import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { BowlerCard } from "./bowler-card";
import { MatchStatusBar } from "./match-status-bar";
import { PlayerCard } from "./player-card";
import { PlayerControlPanel } from "./player-control-panel";
import { RecentBalls } from "./recent-balls";
import { ScoreHeader } from "./score-header";
import { ScoringGrid } from "./scoring-grid";
import { Card } from "./ui/card";
import { LoadingSpinner } from "./ui/loading-spinner";
import { Select } from "./ui/select";
import { useMatchStore } from "../store/match-store";

const wicketTypes = ["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET"] as const;
const extraRunChoices = [1, 2, 3, 4];
const noBallRunChoices = [0, 1, 2, 3, 4, 6];
const wideRunChoices = [1, 2, 3, 4, 5];
const runOutRunChoices = [0, 1, 2, 3, 4];

function oversToNumber(value: string) {
  const [overs, balls] = value.split(".").map(Number);
  return overs + (balls ?? 0) / 6;
}

function crr(runs: number, overs: string) {
  const totalOvers = oversToNumber(overs);
  return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : "0.00";
}

export function ScorerPanel() {
  const scorecard = useMatchStore((state) => state.scorecard);
  const pendingBalls = useMatchStore((state) => state.pendingBalls);
  const loading = useMatchStore((state) => state.loading);
  const addBall = useMatchStore((state) => state.addBall);
  const undoBall = useMatchStore((state) => state.undoBall);
  const updatePlayers = useMatchStore((state) => state.updatePlayers);
  const startCurrentMatch = useMatchStore((state) => state.startCurrentMatch);
  const syncPendingBalls = useMatchStore((state) => state.syncPendingBalls);
  const innings = scorecard?.currentInnings;

  const battingPlayers = innings?.battingTeam.players ?? [];
  const bowlingPlayers = innings?.bowlingTeam.players ?? [];

  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");
  const [incomingBatsmanId, setIncomingBatsmanId] = useState("");
  const [wicketSheetOpen, setWicketSheetOpen] = useState(false);
  const [wicketType, setWicketType] = useState<(typeof wicketTypes)[number]>("BOWLED");
  const [dismissedPlayerId, setDismissedPlayerId] = useState("");
  const [wicketRuns, setWicketRuns] = useState(0);
  const [extrasSheetOpen, setExtrasSheetOpen] = useState(false);
  const [extrasType, setExtrasType] = useState<"BYE" | "LEG_BYE" | "NO_BALL" | "WIDE">("BYE");
  const [extrasRuns, setExtrasRuns] = useState(1);
  const [requireWicketConfirmation, setRequireWicketConfirmation] = useState(true);
  const [floatingFeedback, setFloatingFeedback] = useState<string | null>(null);

  useEffect(() => {
    setStrikerId(innings?.activePlayers.striker?.id ?? "");
    setNonStrikerId(innings?.activePlayers.nonStriker?.id ?? "");
    setBowlerId(innings?.activePlayers.bowler?.id ?? "");
    setDismissedPlayerId(innings?.activePlayers.striker?.id ?? "");
    setIncomingBatsmanId("");
  }, [innings?.activePlayers]);

  useEffect(() => {
    if (!innings || scorecard?.status === "INNINGS_BREAK") {
      return;
    }

    if (!innings.activePlayers.striker && battingPlayers[0]?.id) {
      setStrikerId((current) => current || battingPlayers[0]?.id || "");
    }

    if (!innings.activePlayers.nonStriker && battingPlayers[1]?.id) {
      setNonStrikerId((current) => current || battingPlayers[1]?.id || "");
    }

    if (!innings.activePlayers.bowler && bowlingPlayers[0]?.id) {
      setBowlerId((current) => current || bowlingPlayers[0]?.id || "");
    }
  }, [
    battingPlayers,
    bowlingPlayers,
    innings,
    innings?.activePlayers.bowler,
    innings?.activePlayers.nonStriker,
    innings?.activePlayers.striker,
    scorecard?.status
  ]);

  useEffect(() => {
    const handleOnline = () => {
      void syncPendingBalls();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncPendingBalls]);

  useEffect(() => {
    if (wicketType !== "RUN_OUT") {
      setDismissedPlayerId(strikerId || (innings?.activePlayers.striker?.id ?? ""));
      setWicketRuns(0);
    }
  }, [innings?.activePlayers.striker?.id, strikerId, wicketType]);

  useEffect(() => {
    const lastBall = innings?.lastBall;
    if (!lastBall) {
      return;
    }

    const label = lastBall.isWicket
      ? "WICKET"
      : lastBall.extraType === "WIDE"
        ? "WIDE"
        : lastBall.extraType === "NO_BALL"
          ? "NO BALL"
          : lastBall.extraType === "BYE"
            ? `BYE ${lastBall.teamRuns}`
            : lastBall.extraType === "LEG_BYE"
              ? `LEG BYE ${lastBall.teamRuns}`
              : `${lastBall.teamRuns} RUN${lastBall.teamRuns === 1 ? "" : "S"}`;

    setFloatingFeedback(label);
    const timeout = window.setTimeout(() => setFloatingFeedback(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [innings?.lastBall?.id]);

  const availableIncomingBatters = useMemo(() => {
    const dismissedPlayerIds = new Set(
      (innings?.batsmenStats ?? []).filter((stats) => stats.isOut).map((stats) => stats.playerId)
    );

    return battingPlayers.filter(
      (player) =>
        player.id !== innings?.activePlayers.striker?.id &&
        player.id !== innings?.activePlayers.nonStriker?.id &&
        !dismissedPlayerIds.has(player.id)
    );
  }, [battingPlayers, innings?.activePlayers, innings?.batsmenStats]);

  const strikerStats = innings?.batsmenStats.find(
    (player) => player.playerId === innings?.activePlayers.striker?.id
  );
  const nonStrikerStats = innings?.batsmenStats.find(
    (player) => player.playerId === innings?.activePlayers.nonStriker?.id
  );

  const currentBowler =
    innings?.bowlerStats.find((player) => player.playerId === innings.activePlayers.bowler?.id) ??
    (innings?.activePlayers.bowler
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

  if (!scorecard || !innings) {
    return null;
  }

  const isInningsBreak = scorecard.status === "INNINGS_BREAK";
  const needsBowlerSelection = !innings.activePlayers.bowler && !innings.isCompleted && !isInningsBreak;
  const hasDistinctBatters = strikerId !== nonStrikerId;
  const canScoreBall =
    !loading &&
    !isInningsBreak &&
    Boolean(strikerId && nonStrikerId && bowlerId) &&
    hasDistinctBatters &&
    !needsBowlerSelection;
  const canDismissNonStriker = wicketType === "RUN_OUT";
  const incomingRequired = availableIncomingBatters.length > 0;
  const wicketsAtRisk = innings.wickets < battingPlayers.length - 1;
  const needsIncomingBatsman = wicketSheetOpen && incomingRequired && wicketsAtRisk;

  const ballsRemaining = Math.max(scorecard.totalOvers * 6 - innings.legalBalls, 0);
  const isLastOver = ballsRemaining > 0 && ballsRemaining <= 6;
  const requiredRunRate =
    scorecard.target && innings.inningsNumber === 2 && ballsRemaining > 0
      ? (((scorecard.target - innings.totalRuns) * 6) / ballsRemaining).toFixed(2)
      : null;

  const currentPairRuns =
    (strikerStats?.runs ?? 0) + (nonStrikerStats?.runs ?? 0);
  const currentPairBalls =
    (strikerStats?.balls ?? 0) + (nonStrikerStats?.balls ?? 0);

  const statusText =
    scorecard.target && innings.inningsNumber === 2 && scorecard.target > innings.totalRuns && ballsRemaining > 0
      ? `Need ${scorecard.target - innings.totalRuns} runs in ${ballsRemaining} balls`
      : innings.isCompleted
        ? scorecard.result ?? "Innings completed"
        : isLastOver
          ? "Last over in progress"
          : "Live scoring in progress";

  const dismissalOptions = [innings.activePlayers.striker, innings.activePlayers.nonStriker]
    .filter(Boolean)
    .filter((player) => {
      if (!player) return false;
      if (player.id === innings.activePlayers.striker?.id) {
        return true;
      }
      return canDismissNonStriker;
    });

  const pushBall = async (
    payload: Omit<Parameters<typeof addBall>[0], "batsmanId" | "nonStrikerId" | "bowlerId">
  ) => {
    if (!canScoreBall) return;

    await addBall({
      ...payload,
      batsmanId: strikerId,
      nonStrikerId,
      bowlerId
    });
  };

  const openWicketSheet = () => {
    setDismissedPlayerId(strikerId || innings.activePlayers.striker?.id || "");
    setWicketType("BOWLED");
    setWicketRuns(0);
    setIncomingBatsmanId(availableIncomingBatters[0]?.id ?? "");
    setWicketSheetOpen(true);
  };

  const submitWicket = async () => {
    if (!dismissedPlayerId) {
      return;
    }

    if (incomingRequired && !incomingBatsmanId) {
      return;
    }

    await pushBall({
      runs: wicketType === "RUN_OUT" ? wicketRuns : 0,
      extras: 0,
      isWicket: true,
      wicketType,
      dismissedPlayerId,
      incomingBatsmanId: incomingRequired ? incomingBatsmanId : undefined
    });

    setWicketSheetOpen(false);
    setIncomingBatsmanId("");
    setWicketRuns(0);
  };

  const openExtrasSheet = (type: "BYE" | "LEG_BYE" | "NO_BALL" | "WIDE") => {
    setExtrasType(type);
    setExtrasRuns(type === "NO_BALL" ? 0 : 1);
    setExtrasSheetOpen(true);
  };

  const submitExtras = async () => {
    await pushBall(
      extrasType === "NO_BALL"
        ? {
            runs: extrasRuns,
            extras: 1,
            extraType: "NO_BALL"
          }
        : extrasType === "WIDE"
          ? {
              runs: 0,
              extras: extrasRuns,
              extraType: "WIDE"
            }
        : {
            runs: 0,
            extras: extrasRuns,
            extraType: extrasType
          }
    );

    setExtrasSheetOpen(false);
  };

  const syncPlayers = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) return;

    void updatePlayers({
      strikerId,
      nonStrikerId,
      bowlerId
    });
  };

  const handleUndo = async () => {
    await undoBall();
    setFloatingFeedback("UNDO");
    window.setTimeout(() => setFloatingFeedback(null), 1000);
  };

  const handleStartSecondInnings = async () => {
    await startCurrentMatch();
    setFloatingFeedback("SECOND INNINGS");
    window.setTimeout(() => setFloatingFeedback(null), 1200);
  };

  return (
    <div className="grid gap-4 pb-28 sm:pb-32">
      <ScoreHeader scorecard={scorecard} />

      <MatchStatusBar
        statusText={statusText}
        requiredRunRate={requiredRunRate}
        ballsRemaining={ballsRemaining}
        partnership={`${currentPairRuns} partnership from ${currentPairBalls} balls`}
        isLastOver={isLastOver}
      />

      {isInningsBreak ? (
        <Card className="rounded-[20px] border-amber-300/20 bg-amber-300/[0.08] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-amber-200">Innings Break</p>
              <h3 className="m-0 mt-1 text-2xl font-bold text-white">Start second innings</h3>
              <p className="m-0 mt-2 text-sm text-amber-100/90">
                The chasing team will be set automatically. After starting, choose striker, non-striker, and bowler for the new innings.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => void handleStartSecondInnings()}
              className="h-12 rounded-[16px] bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Starting..." : "Start Second Innings"}
            </button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <div className="grid gap-4">
          <motion.div layout className="grid gap-4 md:grid-cols-2">
            {strikerStats ? (
              <PlayerCard
                key={`striker-${strikerStats.playerId}`}
                name={strikerStats.name}
                runs={strikerStats.runs}
                balls={strikerStats.balls}
                strikeRate={strikerStats.strikeRate}
                fours={strikerStats.fours}
                sixes={strikerStats.sixes}
                isStriker
              />
            ) : null}
            {nonStrikerStats ? (
              <PlayerCard
                key={`non-striker-${nonStrikerStats.playerId}`}
                name={nonStrikerStats.name}
                runs={nonStrikerStats.runs}
                balls={nonStrikerStats.balls}
                strikeRate={nonStrikerStats.strikeRate}
                fours={nonStrikerStats.fours}
                sixes={nonStrikerStats.sixes}
                isStriker={false}
              />
            ) : null}
          </motion.div>

          {currentBowler ? (
            <BowlerCard
              name={currentBowler.name}
              overs={currentBowler.overs}
              runs={currentBowler.runsConceded}
              wickets={currentBowler.wickets}
              economy={currentBowler.economy}
            />
          ) : null}

          <PlayerControlPanel
            battingPlayers={battingPlayers}
            bowlingPlayers={bowlingPlayers}
            strikerId={strikerId}
            nonStrikerId={nonStrikerId}
            bowlerId={bowlerId}
            incomingBatsmanId={incomingBatsmanId}
            availableIncomingBatters={availableIncomingBatters}
            pendingBalls={pendingBalls.length}
            needsBowlerSelection={needsBowlerSelection}
            needsIncomingBatsman={needsIncomingBatsman}
            requireWicketConfirmation={requireWicketConfirmation}
            loading={loading}
            onStrikerChange={setStrikerId}
            onNonStrikerChange={setNonStrikerId}
            onBowlerChange={setBowlerId}
            onIncomingBatsmanChange={setIncomingBatsmanId}
            onRequireWicketConfirmationChange={setRequireWicketConfirmation}
            onSyncPlayers={syncPlayers}
          />
        </div>

          <div className="grid gap-4 xl:w-[400px]">
            <RecentBalls balls={innings.recentBalls} />

          <Card className="rounded-[18px] border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Live Snapshot</p>
                <h3 className="m-0 mt-0.5 text-base font-bold">Recent wicket and over</h3>
              </div>
              <div className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-muted-foreground">
                Innings {innings.inningsNumber}
              </div>
            </div>

            <div className="mt-3 grid gap-2.5">
              <div className="rounded-[14px] bg-white/[0.04] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Last Out Batsman</p>
                    <h4 className="m-0 mt-0.5 text-base font-bold text-white">
                      {innings.lastDismissedBatsman?.name ?? "No wicket yet"}
                    </h4>
                  </div>
                  {innings.lastDismissedBatsman?.dismissal ? (
                    <div className="rounded-full bg-red-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-100">
                      {innings.lastDismissedBatsman.dismissal.wicketType?.replace(/_/g, " ") ?? "OUT"}
                    </div>
                  ) : null}
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-1.5">
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Runs</p>
                    <p className="m-0 mt-0.5 text-sm font-bold text-white">
                      {innings.lastDismissedBatsman?.runs ?? "--"}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Balls</p>
                    <p className="m-0 mt-0.5 text-sm font-bold text-white">
                      {innings.lastDismissedBatsman?.balls ?? "--"}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">4s</p>
                    <p className="m-0 mt-0.5 text-sm font-bold text-white">
                      {innings.lastDismissedBatsman?.fours ?? "--"}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">SR</p>
                    <p className="m-0 mt-0.5 text-sm font-bold text-white">
                      {innings.lastDismissedBatsman
                        ? innings.lastDismissedBatsman.strikeRate.toFixed(1)
                        : "--"}
                    </p>
                  </div>
                </div>

                {innings.lastDismissedBatsman?.dismissal ? (
                  <p className="m-0 mt-2 text-[11px] text-muted-foreground">
                    Dismissed by {innings.lastDismissedBatsman.dismissal.bowler}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[14px] bg-white/[0.04] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Last Over Bowler</p>
                    <h4 className="m-0 mt-0.5 text-base font-bold text-white">
                      {innings.lastOverBowler?.name ?? "No over completed yet"}
                    </h4>
                  </div>
                  {innings.lastOverBowler ? (
                    <div className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Previous Over
                    </div>
                  ) : null}
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-1.5">
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Overs</p>
                    <p className="m-0 mt-0.5 text-sm font-bold text-white">
                      {innings.lastOverBowler?.overs ?? "--"}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Runs</p>
                    <p className="m-0 mt-0.5 text-sm font-bold text-white">
                      {innings.lastOverBowler?.runsConceded ?? "--"}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Wkts</p>
                    <p className="m-0 mt-0.5 text-sm font-bold text-white">
                      {innings.lastOverBowler?.wickets ?? "--"}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Eco</p>
                    <p className="m-0 mt-0.5 text-sm font-bold text-white">
                      {innings.lastOverBowler ? innings.lastOverBowler.economy.toFixed(1) : "--"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className="rounded-[14px] bg-white/[0.04] p-2.5">
                <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">CRR</p>
                <p className="m-0 mt-0.5 text-sm font-bold text-white">{crr(innings.totalRuns, innings.overs)}</p>
              </div>
              <div className="rounded-[14px] bg-white/[0.04] p-2.5">
                <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Balls Left</p>
                <p className="m-0 mt-0.5 text-sm font-bold text-white">{ballsRemaining}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {loading ? (
        <div className="pointer-events-none fixed inset-x-3 bottom-24 z-30 mx-auto w-fit rounded-full border border-white/10 bg-slate-950/92 px-4 py-3 shadow-2xl backdrop-blur sm:bottom-28">
          <LoadingSpinner label="Saving update..." />
        </div>
      ) : null}

      <AnimatePresence>
        {floatingFeedback ? (
          <motion.div
            key={floatingFeedback}
            initial={{ opacity: 0, y: 28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            className="pointer-events-none fixed inset-x-3 top-20 z-40 mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center justify-center rounded-full border border-white/10 bg-slate-950/92 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.22em] text-white shadow-2xl backdrop-blur sm:inset-x-0 sm:top-24 sm:px-5 sm:text-sm"
          >
            {floatingFeedback}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {wicketSheetOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl p-3 sm:p-4">
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="rounded-[28px] border border-white/10 bg-slate-950 p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.24em] text-red-300">Wicket</p>
                  <h3 className="m-0 mt-2 text-2xl font-bold">Record dismissal</h3>
                  <p className="m-0 mt-2 text-sm text-muted-foreground">
                    Pick the dismissal, choose the player out, and send the next batter in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWicketSheetOpen(false)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Wicket Type
                  </label>
                  <Select
                    value={wicketType}
                    disabled={loading}
                    onChange={(event) =>
                      setWicketType(event.target.value as (typeof wicketTypes)[number])
                    }
                  >
                    {wicketTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Player Out
                  </label>
                  <Select
                    value={dismissedPlayerId}
                    onChange={(event) => setDismissedPlayerId(event.target.value)}
                    disabled={!canDismissNonStriker || loading}
                  >
                    {dismissalOptions.map((player) => (
                      <option key={player!.id} value={player!.id}>
                        {player!.name}
                      </option>
                    ))}
                  </Select>
                  {!canDismissNonStriker ? (
                    <p className="m-0 text-xs text-muted-foreground">
                      {wicketType.replace(/_/g, " ")} dismisses the striker.
                    </p>
                  ) : null}
                </div>

                {wicketType === "RUN_OUT" ? (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Runs Completed
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {runOutRunChoices.map((runs) => (
                        <button
                          key={runs}
                          type="button"
                          disabled={loading}
                          onClick={() => setWicketRuns(runs)}
                          className={[
                            "h-11 rounded-2xl border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
                            wicketRuns === runs
                              ? "border-red-300 bg-red-300 text-slate-950"
                              : "border-white/10 bg-white/5 text-white"
                          ].join(" ")}
                        >
                          {runs}
                        </button>
                      ))}
                    </div>
                    <p className="m-0 text-xs text-muted-foreground">
                      Record the runs completed before the run-out. Strike will update automatically.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-muted-foreground">
                    {wicketType === "CAUGHT"
                      ? "Caught out removes the striker. No runs are added on this wicket."
                      : wicketType === "STUMPED"
                        ? "Stumped removes the striker. No runs are added on this wicket."
                        : wicketType === "BOWLED"
                          ? "Bowled removes the striker directly."
                          : wicketType === "LBW"
                            ? "LBW removes the striker directly."
                            : "Hit wicket removes the striker directly."}
                  </div>
                )}

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Next Batsman
                  </label>
                  <Select
                    value={incomingBatsmanId}
                    onChange={(event) => setIncomingBatsmanId(event.target.value)}
                    disabled={loading}
                  >
                    <option value="">
                      {availableIncomingBatters.length > 0 ? "Select next batsman" : "No batter left"}
                    </option>
                    {availableIncomingBatters.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {requireWicketConfirmation ? (
                <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
                  {wicketType === "RUN_OUT"
                    ? `Run out will be recorded with ${wicketRuns} completed run${wicketRuns === 1 ? "" : "s"} before the wicket.`
                    : "Wicket confirmation is enabled to prevent accidental dismissals."}
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWicketSheetOpen(false)}
                  disabled={loading}
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitWicket()}
                  disabled={loading || (availableIncomingBatters.length > 0 && !incomingBatsmanId)}
                  className="h-12 rounded-2xl bg-red-500 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <LoadingSpinner label="Saving..." /> : "Confirm Wicket"}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}

      {extrasSheetOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-xl p-3 sm:p-4">
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="rounded-[28px] border border-white/10 bg-slate-950 p-5 shadow-2xl"
            >
              <p className="m-0 text-xs uppercase tracking-[0.24em] text-amber-200">
                {extrasType === "BYE"
                  ? "Bye"
                  : extrasType === "LEG_BYE"
                    ? "Leg Bye"
                    : extrasType === "NO_BALL"
                      ? "No Ball"
                      : "Wide"}
              </p>
              <h3 className="m-0 mt-2 text-2xl font-bold">How many runs?</h3>
              <p className="m-0 mt-2 text-sm text-muted-foreground">
                {extrasType === "NO_BALL"
                  ? "Choose the runs scored off the bat. The no-ball extra is added automatically."
                  : extrasType === "WIDE"
                    ? "Choose the total wide runs on this delivery, including the automatic one-run penalty."
                  : `Choose the number of runs completed on this ${extrasType === "BYE" ? "bye" : "leg-bye"}.`}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(extrasType === "NO_BALL"
                  ? noBallRunChoices
                  : extrasType === "WIDE"
                    ? wideRunChoices
                    : extraRunChoices).map((runs) => (
                  <button
                    key={runs}
                    type="button"
                    disabled={loading}
                    onClick={() => setExtrasRuns(runs)}
                    className={[
                      "h-14 rounded-2xl border text-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
                      extrasRuns === runs
                        ? "border-amber-300 bg-amber-300 text-slate-950"
                        : "border-white/10 bg-white/5 text-white"
                    ].join(" ")}
                  >
                    {runs}
                  </button>
                ))}
              </div>

              {extrasType === "NO_BALL" ? (
                <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                  This delivery will be recorded as {1 + extrasRuns} total run{1 + extrasRuns === 1 ? "" : "s"}:
                  {" "}
                  1 no-ball + {extrasRuns} off the bat.
                </div>
              ) : null}

              {extrasType === "WIDE" ? (
                <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                  This delivery will be recorded as {extrasRuns} wide run{extrasRuns === 1 ? "" : "s"} in total.
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExtrasSheetOpen(false)}
                  disabled={loading}
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitExtras()}
                  disabled={loading}
                  className="h-12 rounded-2xl bg-amber-300 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <LoadingSpinner label="Saving..." />
                  ) : extrasType === "NO_BALL" ? (
                    `Add No Ball + ${extrasRuns}`
                  ) : extrasType === "WIDE" ? (
                    `Add Wide ${extrasRuns}`
                  ) : (
                    `Add ${extrasRuns}`
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}

      <ScoringGrid
        disabled={!canScoreBall}
        onRun={(runs) => void pushBall({ runs, extras: 0 })}
        onWicket={openWicketSheet}
        onWide={() => openExtrasSheet("WIDE")}
        onNoBall={() => openExtrasSheet("NO_BALL")}
        onBye={() => openExtrasSheet("BYE")}
        onLegBye={() => openExtrasSheet("LEG_BYE")}
        onUndo={() => void handleUndo()}
      />
    </div>
  );
}
