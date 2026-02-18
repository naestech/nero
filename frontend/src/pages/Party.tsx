import { useState } from "react";
import { useParams } from "react-router-dom";
import { useParty } from "../hooks/useParty";
import JoinForm from "../components/JoinForm";

function Party() {
  const { partyId } = useParams();
  const [participantId, setParticipantId] = useState(localStorage.getItem("participantId"));
  const { party, participants, songs, currentSong } = useParty(partyId!, participantId);

  if (!participantId) return <JoinForm partyId={partyId!} onJoin={setParticipantId} />;
  if (!party) return <div>loading...</div>;

  return (
    <div>
      <p>{party.name}</p>
      <p>{party.theme}</p>
      <p>{participants.length} in room</p>
    </div>
  );
}
export default Party;
