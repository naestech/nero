import { useEffect, useState } from "react";
import { ListMusic } from "lucide-react";
import { socket } from "../lib/socket";
import useDebounce from "../hooks/useDebounce";
import { Song, SearchResult } from "../types";

type Props = {
  partyId: string;
  songs: Song[];
};

function Queue({ partyId, songs }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const debouncedQuery = useDebounce(query, 300);
  const participantId = localStorage.getItem("participantId");

  useEffect(() => {
    if (!debouncedQuery.trim()) return setResults([]);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => setResults(data.songs ?? []));
  }, [debouncedQuery]);

  function addSong(song: SearchResult) {
    socket.emit("song:add", { partyId, participantId, song });
    setResults([]);
    setQuery("");
  }

  const queued = songs.filter((s) => s.status === "queued");

  return (
    <>
      {queued.length > 0 && (
        <p className="text-xs text-[#555] uppercase tracking-widest mb-3">
          queue
        </p>
      )}
      <div>
        {queued.map((song, i) => (
          <div key={song.id} className="flex items-center gap-3 py-2">
            <span className="text-[#444] text-xs w-4 flex-shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">{song.title}</p>
            </div>
            <p className="text-xs text-[#555] ml-auto flex-shrink-0">
              {song.artist}
            </p>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="overflow-y-auto max-h-64">
              {results.slice(0, 5).map((song) => (
                <div
                  key={song.itunesId}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] last:border-0"
                >
                  <img
                    src={song.albumArt}
                    alt={song.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {song.title}
                    </p>
                    <p className="text-xs text-[#666] truncate">
                      {song.artist}
                    </p>
                  </div>
                  <button
                    onClick={() => addSong(song)}
                    className="ml-auto text-[#555] hover:text-white transition-colors flex-shrink-0"
                  >
                    <ListMusic size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-[#111] to-transparent">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search for a song"
          className="w-full max-w-md mx-auto block bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#444] outline-none focus:border-[#3a3a3a] text-sm"
        />
      </div>
    </>
  );
}

export default Queue;
