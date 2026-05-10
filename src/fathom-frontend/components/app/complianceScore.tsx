export default function ComplianceScore({ score }: { score?: number }) {
  if (!score) return <span>0</span>;

  if (score > 90) return <span className="text-green-500">{score}</span>;
  else if (score > 70) return <span className="text-orange-500">{score}</span>;
  else return <span className="text-red-500">{score}</span>;
}
