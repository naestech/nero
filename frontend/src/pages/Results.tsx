import { useParams, useLocation } from "react-router-dom";
import ResultMeter from "../components/ResultMeter";

function Results() {
  const { partyId } = useParams();
  const { state } = useLocation();

  const results = state?.results ?? JSON.parse(localStorage.getItem(`results:${partyId}`) ?? "null");

  if (!results) return <div>no results found</div>;

  return (
    <div>
      {results.map((entry, index) => (
        <div key={entry.song.id}>
          <p>#{index + 1}</p>
          <img src={entry.song.albumArt} alt={entry.song.title} />
          <p>{entry.song.title}</p>
          <p>{entry.song.artist}</p>
          <ResultMeter votes={entry.song.votes} />
        </div>
      ))}
    </div>
  );
}

export default Results;
