import { memo } from "react";

import { Card } from "./ui/card";
import type { Scorecard } from "../store/match-store";

type PlayerStatsProps = {
  innings: NonNullable<Scorecard["currentInnings"]>;
};

export const PlayerStats = memo(function PlayerStats({ innings }: PlayerStatsProps) {
  const strikerId = innings.activePlayers.striker?.id;
  const nonStrikerId = innings.activePlayers.nonStriker?.id;

  return (
    <div className="grid gap-3">
      {innings.batsmenStats
        .filter(
          (player) => player.playerId === strikerId || player.playerId === nonStrikerId || !player.isOut
        )
        .slice(0, 2)
        .map((player) => (
          <Card key={player.playerId} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="m-0 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {player.playerId === strikerId ? "Striker" : "Non-striker"}
                </p>
                <h3 className="m-0 mt-1 text-xl font-semibold">{player.name}</h3>
              </div>
              <div className="text-right">
                <p className="m-0 text-2xl font-bold">
                  {player.runs}
                  <span className="text-sm font-medium text-muted-foreground"> ({player.balls})</span>
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                  4s {player.fours} | 6s {player.sixes} | SR {player.strikeRate}
                </p>
              </div>
            </div>
          </Card>
        ))}
    </div>
  );
});
