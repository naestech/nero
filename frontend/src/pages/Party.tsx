import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Heart, HeartOff } from "lucide-react";

import { useParty } from "../hooks/useParty";
import { socket } from "../lib/socket";
import JoinForm from "../components/JoinForm";
import NowPlaying from "../components/NowPlaying";
import Queue from "../components/Queue";
import ResultMeter from "../components/ResultMeter";

function Party() {
  const { partyId } = useParams();
  const [participantId, setParticipantId] = useState(
    localStorage.getItem("participantId"),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [myVote, setMyVote] = useState<1 | -1 | null>(null);
  const { party, participants, songs, currentSong, reveal, idleTimeout } = useParty(
    partyId!,
    participantId,
  );
  const [countdown, setCountdown] = useState<string | null>(null);
  const isHost = party?.hostId == participantId;

  useEffect(() => {
    setMyVote(null);
  }, [currentSong?.songId]);

  useEffect(() => {
    if (!idleTimeout) {
      setCountdown(null);
      return;
    }

    function tick() {
      const remaining = Math.max(0, idleTimeout! - Date.now());
      const secs = Math.ceil(remaining / 1000);
      const mins = Math.floor(secs / 60);
      setCountdown(`${mins}:${String(secs % 60).padStart(2, "0")}`);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [idleTimeout]);

  // auto-play when host adds the first song to an idle party
  useEffect(() => {
    if (!isHost || isPlaying || currentSong) return;
    if (songs.some((s) => s.status === "queued")) {
      socket.emit("playback:play", { partyId, participantId });
      setIsPlaying(true);
    }
  }, [songs]);

  if (!participantId)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-sm">
          <p className="text-3xl font-bold mb-6 tracking-tight">nero</p>
          <p className="text-[#555] text-sm mb-6">join the party</p>
          <JoinForm partyId={partyId!} onJoin={setParticipantId} />
        </div>
      </main>
    );
  if (!party) return <div className="min-h-screen flex items-center justify-center text-[#555]">loading...</div>;

  return (
    <div>
      {/* floating header */}
      <div className="fixed top-4 left-4 right-4 z-50 bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl px-5 py-3 flex items-center justify-between">
        <p className="font-bold text-white">
          {party.name}
          <span className="text-[#666] font-normal"> — {party.theme}</span>
        </p>
        {countdown
          ? <p className={`text-sm transition-colors ${idleTimeout && idleTimeout - Date.now() <= 10000 ? "text-white font-bold" : "text-[#888]"}`}>party ends in {countdown}</p>
          : <p className="text-[#555] text-sm">{participants.length} in the room</p>
        }
      </div>

      {/* main content — fixed between header and search bar, scrolls internally */}
      <div className="fixed top-20 bottom-20 left-0 right-0 overflow-y-auto px-4">
      <div className="max-w-md mx-auto py-4">
        {currentSong && (
          <NowPlaying
            currentSong={currentSong}
            songs={songs}
            isHost={isHost}
            participantId={participantId}
          />
        )}

        {currentSong && (
          <div className="flex justify-between w-3/5 mx-auto mt-4">
            <button
              onClick={() => {
                socket.emit("song:vote", { songId: currentSong.songId, participantId, value: 1 });
                setMyVote(1);
              }}
              className={`transition-all ${myVote === 1 ? "text-white" : "text-[#444]"}`}
            >
              <Heart size={26} fill={myVote === 1 ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => {
                socket.emit("song:vote", { songId: currentSong.songId, participantId, value: -1 });
                setMyVote(-1);
              }}
              className={`transition-all ${myVote === -1 ? "text-white" : "text-[#444]"}`}
            >
              <HeartOff size={26} />
            </button>
          </div>
        )}

        {reveal && (
          <div className="mt-4 w-3/5 mx-auto">
            <ResultMeter votes={reveal.votes} />
          </div>
        )}

        <div className="mt-10">
          <Queue partyId={partyId!} songs={songs} />
        </div>
      </div>
      </div>
    </div>
  );
}
export default Party;
