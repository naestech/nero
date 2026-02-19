import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import useDebounce from "../hooks/useDebounce";

function Queue({ partyId, songs }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const debouncedQuery = useDebounce(query, 300);
  const participantId = localStorage.getItem("participantId");

  useEffect(() => {
    if (!debouncedQuery) return setResults([]);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => setResults(data.songs));
  }, [debouncedQuery]);

  function addSong(song) {
    socket.emit("song:add", { partyId, participantId, song });
    setResults([]);
    setQuery("");
  }

  const queued = songs.filter((s) => s.status === "queued");

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="search for a song"
      />
      {results.map((song) => (
        <div key={song.itunesId}>
          <img src={song.albumArt} alt={song.title} />
          <p>{song.title}</p>
          <p>{song.artist}</p>
          <button onClick={() => addSong(song)}>add</button>
        </div>
      ))}

      <div>
        {queued.map((song, i) => (
          <div key={song.id}>
            <p>
              {i + 1}. {song.title}
            </p>
            <p>{song.artist}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Queue;
