import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useParty } from "../hooks/useParty";
import { socket } from "../lib/socket";
import JoinForm from "../components/JoinForm";
import NowPlaying from "../components/NowPlaying";
import Queue from "../components/Queue";

function Party() {
  const { partyId } = useParams();
  const [participantId, setParticipantId] = useState(
    localStorage.getItem("participantId"),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [myVote, setMyVote] = useState<1 | -1 | null>(null);
  const { party, participants, songs, currentSong } = useParty(
    partyId!,
    participantId,
  );

  useEffect(() => {
    setMyVote(null);
  }, [currentSong?.songId]);

  if (!participantId)
    return <JoinForm partyId={partyId!} onJoin={setParticipantId} />;
  if (!party) return <div>loading...</div>;

  const isHost = party.hostId == participantId;

  return (
    <div>
      <p>{party.name}</p>
      <p>{party.theme}</p>
      <p>{participants.length} in room</p>
      <div>
        {currentSong && (
          <NowPlaying currentSong={currentSong} songs={songs} isHost={isHost} participantId={participantId} />
        )}
      </div>
      {currentSong && (
        <div>
          <button
            onClick={() => {
              socket.emit("song:vote", { songId: currentSong.songId, participantId, value: 1 });
              setMyVote(1);
            }}
            style={{ textDecoration: myVote === 1 ? "underline" : "none" }}
          >
            yes
          </button>
          <button
            onClick={() => {
              socket.emit("song:vote", { songId: currentSong.songId, participantId, value: -1 });
              setMyVote(-1);
            }}
            style={{ textDecoration: myVote === -1 ? "underline" : "none" }}
          >
            no
          </button>
        </div>
      )}
      {/* TODO: replace with final play button design */}
      {isHost && !isPlaying && (
        <button
          onClick={() => {
            socket.emit("playback:play", { partyId, participantId });
            setIsPlaying(true);
          }}
        >
          play
        </button>
      )}
      <Queue partyId={partyId!} songs={songs} />
    </div>
  );
}
export default Party;
