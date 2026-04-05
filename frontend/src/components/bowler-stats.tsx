import { memo } from "react";

import { Card } from "./ui/card";
import type { Scorecard } from "../store/match-store";

type BowlerStatsProps = {
  innings: NonNullable<Scorecard["currentInnings"]>;
};

export const BowlerStats = memo(function BowlerStats({ innings }: BowlerStatsProps) {
  const currentBowlerId = innings.activePlayers.bowler?.id;
  const bowler =
    innings.bowlerStats.find((item) => item.playerId === currentBowlerId) ??
    (innings.activePlayers.bowler
      ? {
          playerId: innings.activePlayers.bowler.id,
          name: innings.activePlayers.bowler.name,
          overs: "0.0",
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          economy: 0
        }
      : null);

  if (!bowler) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="m-0 text-xs uppercase tracking-[0.2em] text-muted-foreground">Bowler</p>
          <h3 className="m-0 mt-1 text-xl font-semibold">{bowler.name}</h3>
        </div>
        <div className="text-right">
          <p className="m-0 text-2xl font-bold">
            {bowler.overs}
            <span className="text-sm font-medium text-muted-foreground"> overs</span>
          </p>
          <p className="m-0 text-xs text-muted-foreground">
            {bowler.runsConceded} runs | {bowler.wickets} wickets
          </p>
        </div>
      </div>
    </Card>
  );
});
