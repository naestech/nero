import { useState } from "react";
import { useNavigate } from "react-router-dom";

function JoinForm({ partyId, onJoin }: { partyId: string; onJoin?: (id: string) => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`/api/parties/${partyId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const { participant } = await res.json();
    localStorage.setItem("participantId", participant.id);

    if (onJoin) {
      onJoin(participant.id);
    } else {
      navigate(`/party/${partyId}`);
    }
  }

  // renders just form fields — callers (Home, Party) provide their own card wrapper
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="username"
        className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#444] outline-none focus:border-[#3a3a3a] text-sm mb-3"
      />
      <button
        type="submit"
        disabled={!name}
        className="w-full bg-white text-black rounded-full py-3 font-semibold text-sm hover:bg-[#e5e5e5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-1"
      >
        join
      </button>
    </form>
  );
}

export default JoinForm;
