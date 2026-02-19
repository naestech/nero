import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dices } from "lucide-react";
import JoinForm from "../components/JoinForm";

const inputClass = "w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#444] outline-none focus:border-[#3a3a3a] text-sm mb-3";

function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [code, setCode] = useState("");

  function handleJoined(_participantId: string) {
    navigate(`/party/${code}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-sm">
        <p className="text-3xl font-bold tracking-tight">nero party!</p>
        <p className="text-[#555] text-sm mt-1 mb-6">themed listening parties</p>

        {mode === "join" ? (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="party code"
              className={inputClass}
            />
            <JoinForm partyId={code} onJoin={handleJoined} />
          </>
        ) : (
          <CreateForm navigate={navigate} />
        )}

        <button
          onClick={() => setMode(mode === "join" ? "create" : "join")}
          className="text-[#555] text-sm hover:text-[#888] transition-colors mt-5 block text-center w-full"
        >
          {mode === "join" ? "create a party" : "join a party"}
        </button>
      </div>
    </main>
  );
}

const THEMES = [
  "hyperpop",
  "afrobeats",
  "bedroom pop",
  "midwest emo",
  "UK drill",
  "bossa nova",
  "j-pop",
  "shoegaze",
  "uk garage",
  "k-pop",
  "reggaeton",
  "jazz funk",
  "blues rock",
  "pop punk",
  "hard rock",
  "2000s R&B",
  "90s hip hop",
  "indie sleaze",
  "pregame",
  "late night drive",
  "lofi beats to study and relax to",
  "workout",
];

function CreateForm({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
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

  function rollTheme() {
    setTheme(THEMES[Math.floor(Math.random() * THEMES.length)]);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={hostName}
        onChange={(e) => setHostName(e.target.value)}
        placeholder="username"
        className={inputClass}
      />

      <div className="border-t border-[#2a2a2a] mt-1 mb-4" />

      <input
        value={partyName}
        onChange={(e) => setPartyName(e.target.value)}
        placeholder="party name"
        className={inputClass}
      />

      <div className="flex items-center bg-[#111] border border-[#2a2a2a] rounded-xl mb-3 pr-3 focus-within:border-[#3a3a3a] transition-colors">
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="party theme"
          className="flex-1 bg-transparent px-4 py-3 text-white placeholder-[#444] outline-none text-sm"
        />
        <div className="w-px h-5 bg-[#2a2a2a] mx-1 flex-shrink-0" />
        <button
          type="button"
          onClick={rollTheme}
          className="pl-2 flex items-center"
          title="random theme"
        >
          <Dices size={20} className="text-[#555] hover:text-[#888] transition-colors" />
        </button>
      </div>

      <button
        type="submit"
        disabled={!hostName || !partyName || !theme}
        className="w-full bg-white text-black rounded-full py-3 font-semibold text-sm hover:bg-[#e5e5e5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-1"
      >
        create
      </button>
    </form>
  );
}

export default Home;
