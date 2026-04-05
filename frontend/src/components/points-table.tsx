import { Card } from "./ui/card";

type Row = {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  nrr: number;
};

type PointsTableProps = {
  rows: Row[];
};

export function PointsTable({ rows }: PointsTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <tr>
              <th className="px-4 py-4">Team</th>
              <th className="px-4 py-4">P</th>
              <th className="px-4 py-4">W</th>
              <th className="px-4 py-4">L</th>
              <th className="px-4 py-4">T</th>
              <th className="px-4 py-4">PTS</th>
              <th className="px-4 py-4">NRR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.teamId} className={index % 2 === 0 ? "bg-white/[0.03]" : ""}>
                <td className="px-4 py-4 font-semibold text-white">{row.teamName}</td>
                <td className="px-4 py-4">{row.played}</td>
                <td className="px-4 py-4">{row.wins}</td>
                <td className="px-4 py-4">{row.losses}</td>
                <td className="px-4 py-4">{row.ties}</td>
                <td className="px-4 py-4 font-bold text-accent">{row.points}</td>
                <td className="px-4 py-4">{row.nrr >= 0 ? `+${row.nrr.toFixed(3)}` : row.nrr.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
