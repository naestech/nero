import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

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
});

// GET /parties/:partyId
app.get("/parties/:partyId", async (req, res) => {
  const { partyId } = req.params;

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
});

// POST /parties/:partyId/join
// participant is created here, not on socket connect, so their id persists across refreshes
app.post("/parties/:partyId/join", async (req, res) => {
  const { partyId } = req.params;
  const { name } = req.body;

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
});

// GET /search?q=<query>
// proxied so itunes stays server-side and we control the shape of data the frontend receives
app.get("/search", async (req, res) => {
  const query = req.query.q as string;

  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15&country=US`,
  );

  const data = (await response.json()) as { results: any[] };

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
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
