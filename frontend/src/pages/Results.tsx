import { useParams } from "react-router-dom";

// TODO: fill in placeholder
function Results() {
  const { partyId } = useParams();
  return <div>results for party {partyId}</div>;
}
export default Results;
