import { useState } from "react";
import { useNavigate } from "react-router-dom";
import JoinForm from "../components/JoinForm";

function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [code, setCode] = useState("");

  return (
    // toggle between join & create party
    // TODO: move below input forms
    <main>
      <button onClick={() => setMode(mode === "join" ? "create" : "join")}>
        {mode === "join" ? "create a party" : "join a party"}
      </button>

      {mode === "join" ? (
        <>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="party code"
          />
          <JoinForm partyId={code} />
        </>
      ) : (
        <CreateForm navigate={navigate} />
      )}
    </main>
  );
}

// create party form
function CreateForm({
  navigate,
}: {
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [hostName, setHostName] = useState("");
  const [partyName, setPartyName] = useState("");
  const [theme, setTheme] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/parties/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: partyName, theme, hostName }),
    });
    const { party, participant } = await res.json();
    localStorage.setItem("participantId", participant.id);
    navigate(`/party/${party.id}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={hostName}
        onChange={(e) => setHostName(e.target.value)}
        placeholder="username"
      />
      <input
        value={partyName}
        onChange={(e) => setPartyName(e.target.value)}
        placeholder="party name"
      />
      <input
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        placeholder="party theme"
      />

      <button type="submit" disabled={!hostName || !partyName || !theme}>
        create
      </button>
    </form>
  );
}

export default Home;
