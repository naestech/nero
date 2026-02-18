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

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="username"
      />
      <button type="submit" disabled={!name}>
        join
      </button>
    </form>
  );
}

export default JoinForm;
