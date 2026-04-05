import { memo } from "react";

import { Card } from "./ui/card";
import type { Scorecard } from "../store/match-store";

type MatchHeaderProps = {
  scorecard: Scorecard | null;
  mode: "setup" | "scorer" | "viewer";
  onModeChange: (mode: "setup" | "scorer" | "viewer") => void;
};

export const MatchHeader = memo(function MatchHeader({
  scorecard,
  mode,
  onModeChange
}: MatchHeaderProps) {
  const matchup = scorecard
    ? `${scorecard.teams.teamA.name} vs ${scorecard.teams.teamB.name}`
    : "Cricket Exchange";

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-white/8 via-transparent to-white/4 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">Live Scoring Desk</p>
            <h1 className="m-0 text-2xl font-bold md:text-4xl">{matchup}</h1>
            {scorecard?.round ? (
              <p className="m-0 mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                {scorecard.round}
              </p>
            ) : null}
          </div>
          {scorecard?.result ? (
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              {scorecard.result}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/20 p-1">
          {(["setup", "scorer", "viewer"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onModeChange(item)}
              className={[
                "rounded-xl px-3 py-2 text-sm font-semibold capitalize transition",
                mode === item ? "bg-white text-slate-950" : "text-muted-foreground hover:bg-white/5"
              ].join(" ")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
});
