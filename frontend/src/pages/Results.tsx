import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";
import { ResultEntry } from "../types";

const PHASE_DELAYS = [2500, 3000, 3000, 4000];

function PodiumColumn({ entry, rank, visible, className }: {
  entry: ResultEntry;
  rank: number;
  visible: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className} transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <img
        src={entry.song.albumArt}
        alt={entry.song.title}
        className="w-full aspect-square object-cover rounded-xl mb-2"
      />
      <p className="text-[#555] text-xs mb-0.5">{rank}</p>
      <p className="text-xs text-white font-medium truncate">{entry.song.title}</p>
      <p className="text-xs text-[#666] truncate">{entry.song.artist}</p>
    </div>
  );
}

function Results() {
  const { partyId } = useParams();
  const { state } = useLocation();
  const [phase, setPhase] = useState(0);

  const results: ResultEntry[] | null = state?.results ?? JSON.parse(localStorage.getItem(`results:${partyId}`) ?? "null");
  const theme = state?.theme ?? localStorage.getItem(`theme:${partyId}`);

  useEffect(() => {
    if (!results) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    PHASE_DELAYS.forEach((delay, i) => {
      elapsed += delay;
      timers.push(setTimeout(() => setPhase(i + 1), elapsed));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!results) return <div className="min-h-screen flex items-center justify-center text-[#555]">no results found</div>;

  const first  = results[0] ?? null;
  const second = results[1] ?? null;
  const third  = results[2] ?? null;

  // phase 0: intro text
  if (phase === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center fade-up">
        <p className="text-3xl leading-snug mb-6">
          <span className="text-[#666]">the category was </span>
          <span className="text-white">{theme}</span>
        </p>
        <p className="text-white text-lg font-bold">& the winners are...</p>
      </div>
    );
  }

  // phases 1-3: podium reveal
  if (phase < 4) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex gap-2 items-end">
          {second && <PodiumColumn entry={second} rank={2} visible={phase >= 2} className="w-24 md:w-36" />}
          {first  && <PodiumColumn entry={first}  rank={1} visible={phase >= 3} className="w-36 md:w-52" />}
          {third  && <PodiumColumn entry={third}  rank={3} visible={phase >= 1} className="w-24 md:w-36" />}
        </div>
      </div>
    );
  }

  // phase 4: full setlist
  return (
    <div className="min-h-screen px-4 pt-16 pb-16 max-w-md mx-auto fade-up">
      <p className="text-xs text-[#555] uppercase tracking-widest mb-6">the setlist</p>

      {results.map((entry, index) => {
        const yes = entry.song.votes.filter((v) => v.value === 1).length;
        const total = entry.song.votes.length;
        const yesPercent = total > 0 ? Math.round((yes / total) * 100) : 0;

        // find true rank — skip numbers when previous songs share the same rank
        const rank = results.slice(0, index).filter((e) => {
          const eYes = e.song.votes.filter((v) => v.value === 1).length;
          const eTotal = e.song.votes.length;
          const ePercent = eTotal > 0 ? Math.round((eYes / eTotal) * 100) : 0;
          return ePercent !== yesPercent || eTotal !== total;
        }).length + 1;

        return (
          <div key={entry.song.id} className="flex items-center gap-3 py-3 border-b border-[#1a1a1a]">
            <span className="text-[#444] text-xs w-5 flex-shrink-0">#{rank}</span>
            <img
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              src={entry.song.albumArt}
              alt={entry.song.title}
            />
            <div className="min-w-0 flex-1">
              <p className={`text-sm truncate ${rank === 1 ? "font-bold text-white" : "font-medium"}`}>{entry.song.title}</p>
              <p className="text-xs text-[#666] truncate">{entry.song.artist}</p>
            </div>
            <div className="flex-shrink-0 w-14 text-right">
              <div className="flex items-center justify-end gap-1">
                <Heart size={11} className="text-white flex-shrink-0" />
                <span className="text-xs text-white">{yesPercent}%</span>
              </div>
              <p className="text-xs text-[#444]">{total} votes</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Results;
