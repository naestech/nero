import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../lib/socket";
import { Party, Participant, Song, CurrentSong, Reveal } from "../types";

export function useParty(partyId: string, participantId: string | null) {
  const navigate = useNavigate();
  const [party, setParty] = useState<Party | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [idleTimeout, setIdleTimeout] = useState<number | null>(null);

  useEffect(() => {
    if (!participantId) return;

    socket.connect();
    socket.emit("party:join", { partyId, participantId });

    socket.on("party:state", (data) => {
      setParty(data.party);
      setParticipants(data.party.participants);
      setSongs(data.party.songs);
      // store theme so results page can read it on refresh
      localStorage.setItem(`theme:${partyId}`, data.party.theme);
    });

    socket.on("participant:joined", (data) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.id === data.participant.id)) return prev;
        return [...prev, data.participant];
      });
    });

    socket.on("participant:left", (data) => {
      setParticipants((prev) =>
        prev.filter((p) => p.id !== data.participantId),
      );
    });

    socket.on("song:added", (data) => {
      setSongs((prev) => [...prev, data.song]);
    });

    socket.on("playback:started", (data) => {
      setReveal(null);
      setCurrentSong({ songId: data.song.id, startTime: data.startTime });
      setSongs((prev) => prev.map((s) => {
        if (s.id === data.song.id) return { ...s, status: "playing" };
        if (s.status === "playing") return { ...s, status: "played" };
        return s;
      }));
    });

    socket.on("playback:reveal", (data) => {
      setReveal(data);
    });

    socket.on("queue:idle", (data) => {
      setIdleTimeout(data.timeoutAt);
    });

    socket.on("queue:idle:cancel", () => {
      setIdleTimeout(null);
    });

    socket.on("party:ended", (data) => {
      localStorage.setItem(`results:${partyId}`, JSON.stringify(data.results));
      const theme = localStorage.getItem(`theme:${partyId}`);
      navigate(`/party/${partyId}/results`, { state: { results: data.results, theme } });
    });

    return () => {
      socket.off("party:state");
      socket.off("participant:joined");
      socket.off("participant:left");
      socket.off("song:added");
      socket.off("playback:started");
      socket.off("playback:reveal");
      socket.off("queue:idle");
      socket.off("queue:idle:cancel");
      socket.off("party:ended");
      socket.disconnect();
    };
  }, [partyId, participantId]);

  return { party, participants, songs, currentSong, reveal, idleTimeout };
}
