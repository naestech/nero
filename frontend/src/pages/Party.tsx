import { useParams } from "react-router-dom";

// TODO: fill in placeholder
function Party() {
  const { partyId } = useParams();
  return <div>party {partyId}</div>;
}
export default Party;
