import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";

function NowPlaying({ currentSong, songs, isHost, participantId }) {
  const audioRef = useRef(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const song = songs.find((s) => s.id === currentSong.songId);

  useEffect(() => {
    if (!song || !audioRef.current) return;

    const audio = audioRef.current;
    setAudioBlocked(false);
    audio.src = song.previewUrl;
    audio.currentTime = (Date.now() - currentSong.startTime) / 1000;
    audio.play().catch(() => setAudioBlocked(true));

    return () => {
      audio.pause();
    };
  }, [currentSong.songId]);

  function handleEnded() {
    if (isHost) socket.emit("playback:next", { partyId: song.partyId, participantId });
  }

  if (!song) return null;

  return (
    <div>
      <img src={song.albumArt} alt={song.title} />
      <p>{song.title}</p>
      <p>{song.artist}</p>
      <audio ref={audioRef} onEnded={handleEnded} />
      {audioBlocked && (
        <button onClick={() => audioRef.current?.play().then(() => setAudioBlocked(false))}>
          tap to hear audio
        </button>
      )}
    </div>
  );
}

export default NowPlaying;
