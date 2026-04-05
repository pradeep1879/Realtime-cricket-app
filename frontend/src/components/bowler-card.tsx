import { Card } from "./ui/card";

type BowlerCardProps = {
  name: string;
  overs: string;
  runs: number;
  wickets: number;
  economy: number;
};

export function BowlerCard({ name, overs, runs, wickets, economy }: BowlerCardProps) {
  return (
    <Card className="rounded-[20px] border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Bowler</p>
          <h3 className="m-0 mt-1 text-xl font-bold">{name}</h3>
        </div>
        <div className="text-right">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Overs</p>
          <p className="m-0 mt-1 text-2xl font-black">{overs}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="rounded-[16px] bg-white/[0.04] p-3">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Runs</p>
          <p className="m-0 mt-1 text-lg font-bold text-white">{runs}</p>
        </div>
        <div className="rounded-[16px] bg-white/[0.04] p-3">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Wickets</p>
          <p className="m-0 mt-1 text-lg font-bold text-white">{wickets}</p>
        </div>
        <div className="rounded-[16px] bg-white/[0.04] p-3">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Figure</p>
          <p className="m-0 mt-1 text-lg font-bold text-white">{overs}</p>
        </div>
        <div className="rounded-[16px] bg-white/[0.04] p-3">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Economy</p>
          <p className="m-0 mt-1 text-lg font-bold text-white">{economy.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}
