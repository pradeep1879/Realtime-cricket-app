import { motion } from "framer-motion";

import { Card } from "./ui/card";
import { StatusBadge } from "./status-badge";
import { mapStatus, type Scorecard } from "../store/match-store";

function currentRunRate(runs: number, overs: string) {
  const [over, balls] = overs.split(".").map(Number);
  const totalOvers = over + (balls ?? 0) / 6;
  return totalOvers ? (runs / totalOvers).toFixed(2) : "0.00";
}

function requiredRunRate(scorecard: Scorecard) {
  const innings = scorecard.currentInnings;
  if (!innings || !scorecard.target || innings.inningsNumber !== 2) {
    return null;
  }

  const runsNeeded = Math.max(scorecard.target - innings.totalRuns, 0);
  const ballsLeft = Math.max(scorecard.totalOvers * 6 - innings.legalBalls, 0);
  if (runsNeeded <= 0 || ballsLeft <= 0) {
    return null;
  }

  return ((runsNeeded * 6) / ballsLeft).toFixed(2);
}

function ballsRemaining(scorecard: Scorecard) {
  const innings = scorecard.currentInnings;
  if (!innings) return null;
  return Math.max(scorecard.totalOvers * 6 - innings.legalBalls, 0);
}

function matchStatusLine(scorecard: Scorecard) {
  if (mapStatus(scorecard.status) === "INNINGS_BREAK") {
    return "Innings Break";
  }

  if (mapStatus(scorecard.status) === "COMPLETED") {
    return scorecard.result ?? "Match Completed";
  }

  const innings = scorecard.currentInnings;
  if (!innings) {
    return "Match yet to start";
  }

  if (scorecard.target && innings.inningsNumber === 2) {
    const runsNeeded = Math.max(scorecard.target - innings.totalRuns, 0);
    const ballsLeft = scorecard.totalOvers * 6 - innings.legalBalls;
    if (runsNeeded > 0 && ballsLeft > 0) {
      return `Need ${runsNeeded} runs in ${ballsLeft} balls`;
    }
  }

  return "Live scoring in progress";
}

type ScoreHeaderProps = {
  scorecard: Scorecard;
};

export function ScoreHeader({ scorecard }: ScoreHeaderProps) {
  const innings = scorecard.currentInnings;
  const uiStatus = mapStatus(scorecard.status);
  const ballsLeft = ballsRemaining(scorecard);
  const reqRate = requiredRunRate(scorecard);
  const isLastOver = Boolean(innings && ballsLeft !== null && ballsLeft <= 6 && ballsLeft > 0);

  return (
    <Card className="overflow-hidden rounded-[24px] border-white/10 bg-slate-950/70 p-0">
      <div className="bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="m-0 text-[11px] uppercase tracking-[0.24em] text-accent">Live Match</p>
            <h1 className="m-0 mt-1 text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
              {scorecard.teams.teamA.name} vs {scorecard.teams.teamB.name}
            </h1>
            {scorecard.round ? (
              <p className="m-0 mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                {scorecard.round}
              </p>
            ) : null}
            {scorecard.toss ? (
              <p className="m-0 mt-2 text-sm text-muted-foreground">
                Toss: {scorecard.toss.winnerTeamName} chose to {scorecard.toss.decision.toLowerCase()}
              </p>
            ) : null}
          </div>
          <div className="self-start sm:self-auto">
            <StatusBadge status={uiStatus} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Score</p>
                <motion.h2
                  key={innings ? `${innings.totalRuns}-${innings.wickets}` : "empty"}
                  initial={{ scale: 0.96, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="m-0 text-4xl font-black leading-none sm:text-5xl md:text-6xl"
                >
                  {innings ? `${innings.totalRuns}/${innings.wickets}` : "--/--"}
                </motion.h2>
                <p className="m-0 mt-2 text-sm text-white/80">
                  {innings ? `${innings.battingTeam.name} batting` : "Waiting for innings"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-1">
                <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 sm:min-w-[128px] sm:text-right">
                  <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Overs</p>
                  <p className="m-0 mt-1 text-2xl font-semibold">{innings?.overs ?? "--"}</p>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 sm:min-w-[128px] sm:text-right">
                  <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Phase</p>
                  <p className="m-0 mt-1 text-sm font-semibold text-white">
                    {isLastOver ? "Last Over" : uiStatus.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3 sm:rounded-[20px] sm:p-4">
              <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">CRR</p>
              <p className="m-0 mt-1 text-lg font-bold sm:text-xl">
                {innings ? currentRunRate(innings.totalRuns, innings.overs) : "--"}
              </p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3 sm:rounded-[20px] sm:p-4">
              <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Target</p>
              <p className="m-0 mt-1 text-lg font-bold sm:text-xl">
                {innings?.inningsNumber === 2 ? scorecard.target ?? "--" : "--"}
              </p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3 sm:rounded-[20px] sm:p-4">
              <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Req RR</p>
              <p className="m-0 mt-1 text-lg font-bold sm:text-xl">{reqRate ?? "--"}</p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3 sm:rounded-[20px] sm:p-4">
              <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Balls Left</p>
              <p className="m-0 mt-1 text-lg font-bold sm:text-xl">{ballsLeft ?? "--"}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] bg-white/[0.03] px-4 py-3">
          <p className="m-0 text-sm font-medium leading-6 text-white">{matchStatusLine(scorecard)}</p>
        </div>
      </div>
    </Card>
  );
}
