import { Heart, HeartOff } from "lucide-react";

function ResultMeter({ votes }: { votes: { value: number }[] }) {
  const yes = votes.filter((v) => v.value === 1).length;
  const no = votes.filter((v) => v.value === -1).length;
  const total = votes.length;

  const yesPercent = total > 0 ? Math.round((yes / total) * 100) : 0;
  const noPercent = total > 0 ? Math.round((no / total) * 100) : 0;

  const yesWins = yes >= no;

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className={`flex items-center gap-1.5 font-medium ${yesWins ? "text-white" : "text-[#666]"}`}>
        <Heart size={14} />
        {yesPercent}%
      </span>
      <span className={`flex items-center gap-1.5 ${yesWins ? "text-[#666]" : "text-white font-medium"}`}>
        <HeartOff size={14} />
        {noPercent}%
      </span>
      <span className="text-[#444] ml-auto text-xs">{total} votes</span>
    </div>
  );
}

export default ResultMeter;
