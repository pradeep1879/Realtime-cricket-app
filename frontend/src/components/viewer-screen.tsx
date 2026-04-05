import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { MatchStatusBar } from "./match-status-bar";
import { PlayerCard } from "./player-card";
import { ballBadge } from "./recent-balls";
import { RecentBalls } from "./recent-balls";
import { RecentOverCard } from "./recent-over-card";
import { ScoreHeader } from "./score-header";
import { Card } from "./ui/card";
import { useMatchStore } from "../store/match-store";

function formatBallOverLabel(value: string) {
  const [overPart, ballPart] = value.split(".");
  const overNumber = Number(overPart);

  if (!Number.isFinite(overNumber)) {
    return value;
  }

  return `${Math.max(overNumber - 1, 0)}.${ballPart ?? "0"}`;
}

export function ViewerScreen() {
  const scorecard = useMatchStore((state) => state.scorecard);
  const innings = scorecard?.currentInnings;
  const [showAllBallStatus, setShowAllBallStatus] = useState(false);

  if (!scorecard || !innings) {
    return null;
  }

  const strikerId = innings.activePlayers.striker?.id;
  const displayedBatters = innings.batsmenStats.filter(
    (player) =>
      player.playerId === innings.activePlayers.striker?.id ||
      player.playerId === innings.activePlayers.nonStriker?.id
  );
  const ballStatusItems = useMemo(
    () => innings.recentBalls.slice().reverse(),
    [innings.recentBalls]
  );
  const visibleBallStatusItems = showAllBallStatus
    ? ballStatusItems
    : ballStatusItems.slice(0, 6);
  const ballsRemaining = Math.max(scorecard.totalOvers * 6 - innings.legalBalls, 0);
  const isLastOver = ballsRemaining > 0 && ballsRemaining <= 6;
  const requiredRunRate =
    scorecard.target && innings.inningsNumber === 2 && ballsRemaining > 0
      ? (((scorecard.target - innings.totalRuns) * 6) / ballsRemaining).toFixed(2)
      : null;
  const currentPairRuns =
    displayedBatters.reduce((sum, player) => sum + player.runs, 0);
  const currentPairBalls =
    displayedBatters.reduce((sum, player) => sum + player.balls, 0);
  const batterCardCount = displayedBatters.length;
  const statusText =
    scorecard.result ??
    (requiredRunRate
      ? `Need ${Math.max((scorecard.target ?? innings.totalRuns) - innings.totalRuns, 0)} runs in ${ballsRemaining} balls`
      : isLastOver
        ? "Last over in progress"
        : "Live scoring in progress");

  return (
    <div className="grid gap-4">
      <ScoreHeader scorecard={scorecard} />
      <MatchStatusBar
        statusText={statusText}
        requiredRunRate={requiredRunRate}
        ballsRemaining={ballsRemaining}
        partnership={`${currentPairRuns} partnership from ${currentPairBalls} balls`}
        isLastOver={isLastOver}
      />

      <motion.div
        key={innings.lastBall?.id ?? "no-ball"}
        initial={{ opacity: 0.6, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4"
      >
        <div
          className={[
            "grid gap-4",
            batterCardCount >= 2
              ? "md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]"
              : batterCardCount === 1
                ? "xl:grid-cols-[minmax(0,1fr)_280px]"
                : ""
          ].join(" ")}
        >
          {displayedBatters.map((player) => (
            <PlayerCard
              key={player.playerId}
              name={player.name}
              runs={player.runs}
              balls={player.balls}
              strikeRate={player.strikeRate}
              fours={player.fours}
              sixes={player.sixes}
              isStriker={player.playerId === strikerId}
            />
          ))}

          <div
            className={[
              batterCardCount >= 2 ? "md:col-span-2 xl:col-span-1" : "",
              batterCardCount === 1 ? "xl:col-span-1" : ""
            ].join(" ")}
          >
            <RecentBalls balls={innings.recentBalls} />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
          <div className="grid min-w-0 gap-4 xl:col-span-8 2xl:col-span-9">
            <RecentOverCard scorecard={scorecard} />

            <Card className="rounded-[18px] border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.24em] text-accent">Ball Status</p>
                  <h3 className="m-0 mt-1 text-lg font-semibold text-white">Delivery timeline</h3>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {ballStatusItems.length}
                  </span>
                  {ballStatusItems.length > 6 ? (
                    <button
                      type="button"
                      onClick={() => setShowAllBallStatus((current) => !current)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/[0.08]"
                    >
                      {showAllBallStatus ? "Show less" : "See more"}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                {visibleBallStatusItems.map((ball, index) => (
                  <div
                    key={ball.id}
                    className={[
                      "rounded-[16px] border px-3 py-3 transition sm:grid sm:grid-cols-[72px_minmax(0,1fr)_56px] sm:items-center sm:gap-2 sm:px-4",
                      index === 0
                        ? "border-accent/40 bg-accent/10"
                        : "border-white/10 bg-white/[0.04]"
                    ].join(" ")}
                  >
                    <div className="grid gap-3 sm:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="m-0 text-sm font-semibold text-white">
                            {formatBallOverLabel(ball.over)}
                          </p>
                          <p className="m-0 mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                            {ball.bowler}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-black text-white">
                          {ballBadge(ball)}
                        </div>
                      </div>

                      <div className="rounded-[14px] bg-black/10 px-3 py-2.5">
                        <p className="m-0 text-sm font-semibold text-white">{ball.statusText}</p>
                        <p className="m-0 mt-1 text-xs leading-5 text-muted-foreground">
                          {ball.batsman}
                          {" • "}
                          {ball.extraType !== "NONE" ? ball.extraType.replace(/_/g, " ") : "Legal delivery"}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <p className="m-0 text-sm font-semibold text-white">
                        {formatBallOverLabel(ball.over)}
                      </p>
                      <p className="m-0 mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {ball.bowler}
                      </p>
                    </div>

                    <div className="hidden min-w-0 sm:block">
                      <p className="m-0 text-sm font-semibold text-white">{ball.statusText}</p>
                      <p className="m-0 mt-1 text-xs leading-5 text-muted-foreground">
                        {ball.batsman}
                        {" • "}
                        {ball.extraType !== "NONE" ? ball.extraType.replace(/_/g, " ") : "Legal delivery"}
                      </p>
                    </div>

                    <div className="hidden text-right sm:block">
                      <p className="m-0 text-xl font-black text-white">{ballBadge(ball)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid min-w-0 self-start gap-4 xl:col-span-4 2xl:col-span-3">
            <Card className="min-w-0 overflow-hidden rounded-[18px] border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.24em] text-accent">Bowling Figures</p>
                  <h3 className="m-0 mt-1 text-lg font-semibold text-white">Bowler figures</h3>
                </div>
                <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {innings.bowlerStats.length}
                </span>
              </div>

              <div className="mt-3 overflow-x-auto rounded-[16px] border border-white/10 bg-white/[0.03] lg:overflow-x-visible">
                <div className="min-w-[320px] lg:min-w-0">
                  <div className="grid grid-cols-[minmax(120px,1.3fr)_52px_52px_52px_72px] gap-3 border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground lg:grid-cols-[minmax(0,1.3fr)_0.6fr_0.6fr_0.6fr_0.8fr]">
                    <div>Bowler</div>
                    <div>O</div>
                    <div>R</div>
                    <div>W</div>
                    <div>Eco</div>
                  </div>

                  {innings.bowlerStats.map((bowler, index) => (
                    <div
                      key={bowler.playerId}
                      className={[
                        "grid grid-cols-[minmax(120px,1.3fr)_52px_52px_52px_72px] gap-3 px-4 py-3 text-sm lg:grid-cols-[minmax(0,1.3fr)_0.6fr_0.6fr_0.6fr_0.8fr]",
                        index !== innings.bowlerStats.length - 1 ? "border-b border-white/10" : ""
                      ].join(" ")}
                    >
                      <div className="min-w-0">
                        <p className="m-0 truncate font-semibold text-white">{bowler.name}</p>
                        <p className="m-0 mt-1 text-xs text-muted-foreground">
                          Figure {bowler.overs}-{bowler.runsConceded}-{bowler.wickets}
                        </p>
                      </div>
                      <div className="font-semibold text-white">{bowler.overs}</div>
                      <div className="font-semibold text-white">{bowler.runsConceded}</div>
                      <div className="font-semibold text-white">{bowler.wickets}</div>
                      <div className="font-semibold text-white">{bowler.economy.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="min-w-0 rounded-[18px] border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.24em] text-accent">Extras</p>
                  <h3 className="m-0 mt-1 text-lg font-semibold text-white">Team bonus runs</h3>
                </div>
                <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {innings.extrasSummary.wides +
                    innings.extrasSummary.noBalls +
                    innings.extrasSummary.byes +
                    innings.extrasSummary.legByes}
                </span>
              </div>
              <div className="mt-3 rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="min-w-0">
                    <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Wides</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="m-0 text-2xl font-bold text-white">{innings?.extrasSummary?.wides}</p>
                      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        WD
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">No Balls</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="m-0 text-2xl font-bold text-white">{innings?.extrasSummary?.noBalls}</p>
                      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        NB
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Byes</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="m-0 text-2xl font-bold text-white">{innings?.extrasSummary?.byes}</p>
                      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        B
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Leg Byes</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="m-0 text-2xl font-bold text-white">{innings?.extrasSummary?.legByes}</p>
                      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        LB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
