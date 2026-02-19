import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../lib/socket";

export function useParty(partyId: string, participantId: string | null) {
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [idleTimeout, setIdleTimeout] = useState(null);

  useEffect(() => {
    if (!participantId) return;

    socket.connect();
    socket.emit("party:join", { partyId, participantId });

    socket.on("party:state", (data) => {
      setParty(data.party);
      setParticipants(data.party.participants);
      setSongs(data.party.songs);
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

    socket.on("party:ended", () => {
      navigate(`/party/${partyId}/results`);
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
