import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { socket } from "../lib/socket";
import { CurrentSong, Song } from "../types";

type Props = {
  currentSong: CurrentSong;
  songs: Song[];
  isHost: boolean;
  participantId: string;
};

function NowPlaying({ currentSong, songs, isHost, participantId }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const song = songs.find((s) => s.id === currentSong.songId);

  useEffect(() => {
    if (!song || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = song.previewUrl;
    audio.currentTime = (Date.now() - currentSong.startTime) / 1000;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
    };
  }, [currentSong.songId]);

  function toggleMute() {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(audioRef.current.muted);
  }

  function handleEnded() {
    if (isHost) socket.emit("playback:next", { partyId: song?.partyId, participantId });
  }

  if (!song) return null;

  return (
    <div className="mt-4 w-3/5 mx-auto">
      <div className="relative">
        <img className="w-full aspect-square object-cover rounded-2xl" src={song.albumArt} alt={song.title} />
<button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
      <p className="text-lg font-bold mt-3 leading-tight">{song.title}</p>
      <p className="text-[#666] text-xs mt-1">{song.artist}</p>
      <audio ref={audioRef} onEnded={handleEnded} />
    </div>
  );
}

export default NowPlaying;
