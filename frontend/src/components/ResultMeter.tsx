function ResultMeter({ votes }: { votes: { value: number }[] }) {
  const yes = votes.filter((v) => v.value === 1).length;
  const no = votes.filter((v) => v.value === -1).length;
  const total = votes.length;

  const yesPercent = total > 0 ? Math.round((yes / total) * 100) : 0;
  const noPercent = total > 0 ? Math.round((no / total) * 100) : 0;

  return (
    <div>
      <p>yes {yesPercent}%</p>
      <p>no {noPercent}%</p>
      <p>{total} votes</p>
    </div>
  );
}

export default ResultMeter;
