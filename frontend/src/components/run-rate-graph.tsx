import { memo } from "react";

import { Card } from "./ui/card";
import type { Scorecard } from "../store/match-store";

type RunRateGraphProps = {
  innings: NonNullable<Scorecard["currentInnings"]>;
};

export const RunRateGraph = memo(function RunRateGraph({ innings }: RunRateGraphProps) {
  const bars = innings.recentBalls.slice(-10).map((ball) => Math.max(ball.teamRuns, 0));

  return (
    <Card className="rounded-[18px] border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Momentum</p>
          <h3 className="m-0 mt-0.5 text-base font-semibold text-white">Recent deliveries</h3>
        </div>
        <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {bars.length}
        </span>
      </div>
      <div className="mt-3 flex h-16 items-end gap-1.5">
        {bars.length === 0 ? (
          <div className="text-sm text-muted-foreground">Graph starts after the first ball.</div>
        ) : (
          bars.map((value, index) => (
            <div key={`${innings.inningsId}-${index}`} className="flex flex-1 flex-col justify-end">
              <div
                className="rounded-t-lg bg-gradient-to-t from-secondary to-accent transition-all"
                style={{ height: `${Math.max(10, value * 10)}px` }}
              />
            </div>
          ))
        )}
      </div>
    </Card>
  );
});
