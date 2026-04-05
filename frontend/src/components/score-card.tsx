import { memo } from "react";

import { Card } from "./ui/card";
import type { Scorecard } from "../store/match-store";

function currentRunRate(runs: number, overs: string) {
  const [overPart, ballPart] = overs.split(".").map(Number);
  const totalOvers = overPart + (ballPart ?? 0) / 6;
  if (!totalOvers) {
    return "0.00";
  }

  return (runs / totalOvers).toFixed(2);
}

type ScoreCardProps = {
  scorecard: Scorecard;
};

export const ScoreCard = memo(function ScoreCard({ scorecard }: ScoreCardProps) {
  const innings = scorecard.currentInnings;

  if (!innings) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/25 via-card to-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">
            {innings.battingTeam.name}
          </p>
          <h2 className="m-0 text-5xl font-bold leading-none">
            {innings.totalRuns}/{innings.wickets}
          </h2>
        </div>
        <div className="text-right">
          <p className="m-0 text-xs uppercase tracking-[0.2em] text-muted-foreground">Overs</p>
          <p className="m-0 text-2xl font-semibold">{innings.overs}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/6 p-3">
          <p className="m-0 text-xs uppercase tracking-[0.18em] text-muted-foreground">CRR</p>
          <p className="m-0 mt-1 text-xl font-semibold">
            {currentRunRate(innings.totalRuns, innings.overs)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/6 p-3">
          <p className="m-0 text-xs uppercase tracking-[0.18em] text-muted-foreground">Target</p>
          <p className="m-0 mt-1 text-xl font-semibold">{scorecard.target ?? "--"}</p>
        </div>
        <div className="rounded-2xl bg-white/6 p-3">
          <p className="m-0 text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
          <p className="m-0 mt-1 text-sm font-semibold">{scorecard.status.replace(/_/g, " ")}</p>
        </div>
      </div>
    </Card>
  );
});
