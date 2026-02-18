import { useEffect, useRef } from "react";
import { socket } from "../lib/socket";

function NowPlaying({ currentSong, songs, isHost }) {
  const audioRef = useRef(null);
  const song = songs.find((s) => s.id === currentSong.songId);

  useEffect(() => {
    if (!song || !audioRef.current) return;

    audioRef.current.src = song.previewUrl;
    audioRef.current.currentTime = (Date.now() - currentSong.startTime) / 1000;
    audioRef.current.play();
  }, [currentSong.songId]);

  function handleEnded() {
    if (isHost) socket.emit("playback:next", { partyId: song.partyId });
  }

  return (
    <div>
      <img src={song.albumArt} alt={song.title} />
      <p>{song.title}</p>
      <p>{song.artist}</p>
      <audio ref={audioRef} onEnded={handleEnded} />
    </div>
  );
}

export default NowPlaying;
