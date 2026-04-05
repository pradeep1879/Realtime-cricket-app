import { memo, useMemo } from "react";

import { Card } from "./ui/card";
import type { Scorecard } from "../store/match-store";

type RecentOverCardProps = {
  scorecard: Scorecard;
};

type OverSummary = NonNullable<Scorecard["currentInnings"]>["overSummaries"][number];

export const RecentOverCard = memo(function RecentOverCard({ scorecard }: RecentOverCardProps) {
  const innings = useMemo(() => {
    if (scorecard.currentInnings?.overSummaries?.length) {
      return scorecard.currentInnings;
    }

    const completedOrLatest = [...scorecard.innings]
      .reverse()
      .find((entry) => entry.overSummaries?.length);

    return completedOrLatest ?? scorecard.currentInnings ?? null;
  }, [scorecard]);

  const overSummaries = useMemo<OverSummary[]>(
    () => (innings?.overSummaries ?? []) as OverSummary[],
    [innings]
  );

  const maxRuns =
    overSummaries.length > 0
      ? overSummaries.reduce<number>((highest, over) => {
          return Math.max(highest, over.runs);
        }, 1)
      : 1;
  const bestOverRuns =
    overSummaries.length > 0
      ? overSummaries.reduce<number>((highest, over) => {
          return Math.max(highest, over.runs);
        }, 0)
      : 0;

  return (
    <Card className="rounded-[18px] border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="m-0 text-xs uppercase tracking-[0.24em] text-accent">Over Graph</p>
          <h3 className="m-0 mt-1 text-lg font-semibold text-white">Over-by-over trend</h3>
        </div>
        <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {overSummaries.length}
        </span>
      </div>

      {overSummaries.length === 0 ? (
        <div className="mt-4 rounded-[16px] bg-white/[0.04] px-4 py-5 text-sm text-muted-foreground">
          Over graph appears after scoring starts.
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto pb-1">
            <div className="flex h-28 min-w-max items-end gap-2 sm:h-40 sm:gap-3">
            {overSummaries.map((over) => (
              <div key={over.overNumber} className="flex w-12 flex-col items-center gap-2 sm:w-20">
                <div className="text-center">
                  <p className="m-0 text-sm font-bold text-white sm:text-base">{over.runs}</p>
                  <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {over.wickets > 0 ? `${over.wickets}W` : `${over.legalBalls}B`}
                  </p>
                </div>

                <div className="flex h-16 w-full flex-col items-center justify-end gap-1 sm:h-24 sm:gap-1.5">
                  <div className="h-3">
                    {over.wickets > 0 ? (
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.14)]" />
                    ) : null}
                  </div>
                  <div
                    className="w-full rounded-t-[14px] bg-[linear-gradient(180deg,rgba(250,204,21,0.95),rgba(34,197,94,0.85))] shadow-[0_10px_24px_rgba(34,197,94,0.18)] transition-all"
                    style={{
                      height: `${Math.max(20, (over.runs / maxRuns) * 100)}%`
                    }}
                  />
                </div>

                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.16em]">
                  {over.overLabel}
                </p>
              </div>
            ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
            <div className="rounded-[16px] bg-white/[0.04] p-3">
              <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Best Over</p>
              <p className="m-0 mt-1 text-lg font-bold text-white">
                {bestOverRuns}
              </p>
            </div>
            <div className="rounded-[16px] bg-white/[0.04] p-3">
              <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Latest Over</p>
              <p className="m-0 mt-1 text-lg font-bold text-white">
                {overSummaries[overSummaries.length - 1]?.runs ?? 0}
              </p>
            </div>
            <div className="rounded-[16px] bg-white/[0.04] p-3">
              <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Overs Shown</p>
              <p className="m-0 mt-1 text-lg font-bold text-white">{overSummaries.length}</p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
});
