import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient, Prisma } from "@prisma/client";
import { env } from "./env.js";

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

// keyed by partyId so we can cancel if someone adds a song during the countdown
const idleTimers = new Map<string, NodeJS.Timeout>();

type SongWithVotes = Prisma.SongGetPayload<{ include: { votes: true } }>;

function buildResults(playedSongs: SongWithVotes[]) {
  return playedSongs
    .map((song) => {
      const yes = song.votes.filter((v) => v.value === 1).length;
      const total = song.votes.length;
      const yesPercent = total > 0 ? yes / total : 0;
      return { song, yesPercent, total };
    })
    .sort((a, b) => {
      // primary: yes% descending
      if (b.yesPercent !== a.yesPercent) return b.yesPercent - a.yesPercent;
      // tiebreaker: more votes wins
      return b.total - a.total;
    });
}

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// POST /parties
app.post("/parties", async (req, res) => {
  const { name, theme, hostName } = req.body;

  if (!name?.trim() || !theme?.trim() || !hostName?.trim()) {
    res.status(400).json({ error: "name, theme, and hostName are required" });
    return;
  }

  try {
    const [party, host] = await prisma.$transaction(async (tx) => {
      // partyId first since participant needs it
      const party = await tx.party.create({
        data: { name, theme, hostId: "" },
      });

      const host = await tx.participant.create({
        data: { partyId: party.id, name: hostName, isHost: true },
      });

      // update hostId with participant id
      const updatedParty = await tx.party.update({
        where: { id: party.id },
        data: { hostId: host.id },
      });

      return [updatedParty, host];
    });

    res.json({ party, participant: host });
  } catch (err) {
    console.error("POST /parties:", err);
    res.status(500).json({ error: "Failed to create party" });
  }
});

// GET /parties/:partyId
app.get("/parties/:partyId", async (req, res) => {
  const { partyId } = req.params;

  try {
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      include: {
        participants: true,
        // position order for queue rendering
        songs: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!party) {
      res.status(404).json({ error: "Party not found" });
      return;
    }

    res.json({ party });
  } catch (err) {
    console.error("GET /parties/:partyId:", err);
    res.status(500).json({ error: "Failed to fetch party" });
  }
});

// POST /parties/:partyId/join
app.post("/parties/:partyId/join", async (req, res) => {
  const { partyId } = req.params;
  const { name } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const party = await prisma.party.findUnique({ where: { id: partyId } });

    if (!party) {
      res.status(404).json({ error: "Party not found" });
      return;
    }

    const participant = await prisma.participant.create({
      data: {
        partyId,
        name,
        isHost: false,
      },
    });

    res.json({ participant });
  } catch (err) {
    console.error("POST /parties/:partyId/join:", err);
    res.status(500).json({ error: "Failed to join party" });
  }
});

// GET /search?q=<query>
app.get("/search", async (req, res) => {
  const query = req.query.q as string;

  if (!query?.trim()) {
    res.status(400).json({ error: "q is required" });
    return;
  }

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15&country=US`,
    );

    type ItunesTrack = {
      trackId: number;
      trackName: string;
      artistName: string;
      artworkUrl100: string;
      previewUrl: string | null;
    };

    const data = (await response.json()) as { results: ItunesTrack[] };

    const songs = data.results
      // tracks without a previewUrl cant be played
      .filter((track) => track.previewUrl)
      .map((track) => ({
        itunesId: String(track.trackId),
        title: track.trackName,
        artist: track.artistName,
        // itunes returns 100x100 but the url lets us swap the size
        albumArt: track.artworkUrl100.replace("100x100", "400x400"),
        previewUrl: track.previewUrl,
      }));

    res.json({ songs });
  } catch (err) {
    console.error("GET /search:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // party:join
  socket.on("party:join", async ({ partyId, participantId }) => {
    try {
      socket.join(partyId);

      // store socketId to identify participant on disconnect
      await prisma.participant.update({
        where: { id: participantId },
        data: { socketId: socket.id },
      });

      // send full party snapshot to socket
      const party = await prisma.party.findUnique({
        where: { id: partyId },
        include: {
          participants: true,
          songs: { orderBy: { position: "asc" } },
        },
      });

      socket.emit("party:state", { party });

      // tell everyone new participant
      const participant = party?.participants.find((p) => p.id === participantId);
      socket.to(partyId).emit("participant:joined", { participant });
    } catch (err) {
      console.error("party:join:", err);
    }
  });

  // playback:play
  socket.on("playback:play", async ({ partyId, participantId }) => {
    try {
      const party = await prisma.party.findUnique({ where: { id: partyId } });

      if (!party || party.hostId !== participantId) return;

      const nextSong = await prisma.song.findFirst({
        where: { partyId, status: "queued" },
        orderBy: { position: "asc" },
      });

      if (!nextSong) return;

      const startTime = Date.now();

      await prisma.song.update({
        where: { id: nextSong.id },
        data: { status: "playing", playedAt: new Date(startTime) },
      });

      // move party out of lobby on first play
      if (party.status === "lobby") {
        await prisma.party.update({
          where: { id: partyId },
          data: { status: "playing" },
        });
      }

      io.to(partyId).emit("playback:started", {
        song: { ...nextSong, status: "playing", playedAt: new Date(startTime) },
        startTime,
      });
    } catch (err) {
      console.error("playback:play:", err);
    }
  });

  // song:vote
  socket.on("song:vote", async ({ songId, participantId, value }) => {
    if (value !== 1 && value !== -1) return;

    try {
      await prisma.vote.upsert({
        where: { songId_participantId: { songId, participantId } },
        update: { value },
        create: { songId, participantId, value },
      });
    } catch (err) {
      console.error("song:vote:", err);
    }
  });

  // playback:next
  socket.on("playback:next", async ({ partyId, participantId }) => {
    try {
      const party = await prisma.party.findUnique({ where: { id: partyId } });

      if (!party || party.hostId !== participantId) return;

      const currentSong = await prisma.song.findFirst({
        where: { partyId, status: "playing" },
        include: { votes: true },
      });

      if (!currentSong) return;

      await prisma.song.update({
        where: { id: currentSong.id },
        data: { status: "played" },
      });

      // score = average of votes
      const score =
        currentSong.votes.length > 0
          ? currentSong.votes.reduce((sum, v) => sum + v.value, 0) /
            currentSong.votes.length
          : 0;

      io.to(partyId).emit("playback:reveal", {
        songId: currentSong.id,
        score,
        votes: currentSong.votes,
      });

      // wait for reveal animation before advancing
      setTimeout(async () => {
        try {
          // re-fetch party in case host called party:end while the song was playing
          const currentParty = await prisma.party.findUnique({ where: { id: partyId } });

          if (currentParty?.status === "ending") {
            // host signaled end during the song, close out now instead of advancing
            await prisma.party.update({
              where: { id: partyId },
              data: { status: "ended" },
            });

            const playedSongs = await prisma.song.findMany({
              where: { partyId, status: "played" },
              include: { votes: true },
            });

            const results = buildResults(playedSongs);

            io.to(partyId).emit("party:ended", { results });
            return;
          }

          const nextSong = await prisma.song.findFirst({
            where: { partyId, status: "queued" },
            orderBy: { position: "asc" },
          });

          if (nextSong) {
            const startTime = Date.now();
            await prisma.song.update({
              where: { id: nextSong.id },
              data: { status: "playing", playedAt: new Date(startTime) },
            });
            io.to(partyId).emit("playback:started", {
              song: { ...nextSong, status: "playing", playedAt: new Date(startTime) },
              startTime,
            });
          } else {
            // queue empty, start idle countdown
            const timeoutAt = Date.now() + party.idleTimeout * 1000;
            io.to(partyId).emit("queue:idle", { timeoutAt });

            const timer = setTimeout(async () => {
              try {
                await prisma.party.update({
                  where: { id: partyId },
                  data: { status: "ended" },
                });

                const playedSongs = await prisma.song.findMany({
                  where: { partyId, status: "played" },
                  include: { votes: true },
                });

                const results = buildResults(playedSongs);

                io.to(partyId).emit("party:ended", { results });
              } catch (err) {
                console.error("idle timeout:", err);
              }
              idleTimers.delete(partyId);
            }, party.idleTimeout * 1000);

            idleTimers.set(partyId, timer);
          }
        } catch (err) {
          console.error("playback:next (setTimeout):", err);
        }
      }, 3000);
    } catch (err) {
      console.error("playback:next:", err);
    }
  });

  // song:add
  socket.on("song:add", async ({ partyId, participantId, song }) => {
    const required = ["itunesId", "title", "artist", "albumArt", "previewUrl"];
    if (!song || required.some((f) => !song[f])) return;

    try {
      const queueLength = await prisma.song.count({
        where: { partyId, status: "queued" },
      });

      const newSong = await prisma.song.create({
        data: {
          partyId,
          addedByName:
            (
              await prisma.participant.findUnique({
                where: { id: participantId },
              })
            )?.name ?? "unknown",
          position: queueLength,
          status: "queued",
          ...song,
        },
      });

      io.to(partyId).emit("song:added", { song: newSong });

      // cancel idle countdown if running
      if (idleTimers.has(partyId)) {
        clearTimeout(idleTimers.get(partyId));
        idleTimers.delete(partyId);
        io.to(partyId).emit("queue:idle:cancel");

        // auto-play new song since queue empty
        const startTime = Date.now();
        await prisma.song.update({
          where: { id: newSong.id },
          data: { status: "playing", playedAt: new Date(startTime) },
        });
        io.to(partyId).emit("playback:started", {
          song: { ...newSong, status: "playing", playedAt: new Date(startTime) },
          startTime,
        });
      }
    } catch (err) {
      console.error("song:add:", err);
    }
  });

  // party:end
  // flags the party as "ending" rather than ending immediately
  // the party closes gracefully at the end of the current song via playback:next
  socket.on("party:end", async ({ partyId, participantId }) => {
    try {
      const party = await prisma.party.findUnique({ where: { id: partyId } });

      if (!party || party.hostId !== participantId) return;

      // cancel idle countdown if running since we're ending anyway
      if (idleTimers.has(partyId)) {
        clearTimeout(idleTimers.get(partyId));
        idleTimers.delete(partyId);
      }

      await prisma.party.update({
        where: { id: partyId },
        data: { status: "ending" },
      });

      // tell the room the party is ending so the UI can show a "last song" indicator
      io.to(partyId).emit("party:ending");
    } catch (err) {
      console.error("party:end:", err);
    }
  });

  // disconnect
  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);

    try {
      const participant = await prisma.participant.findFirst({
        where: { socketId: socket.id },
      });

      if (!participant) return;

      // mark socketId as offline
      await prisma.participant.update({
        where: { id: participant.id },
        data: { socketId: null },
      });

      socket.to(participant.partyId).emit("participant:left", {
        participantId: participant.id,
      });
    } catch (err) {
      console.error("disconnect:", err);
    }
  });
});

server.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
