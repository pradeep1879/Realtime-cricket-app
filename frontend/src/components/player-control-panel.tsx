import { AlertTriangle, CheckCircle2, ShieldAlert, Users } from "lucide-react";
import { motion } from "framer-motion";

import { Card } from "./ui/card";
import { LoadingSpinner } from "./ui/loading-spinner";
import { Select } from "./ui/select";

type Player = {
  id: string;
  name: string;
};

type PlayerControlPanelProps = {
  battingPlayers: Player[];
  bowlingPlayers: Player[];
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  incomingBatsmanId: string;
  availableIncomingBatters: Player[];
  pendingBalls: number;
  needsBowlerSelection: boolean;
  needsIncomingBatsman: boolean;
  requireWicketConfirmation: boolean;
  loading: boolean;
  onStrikerChange: (value: string) => void;
  onNonStrikerChange: (value: string) => void;
  onBowlerChange: (value: string) => void;
  onIncomingBatsmanChange: (value: string) => void;
  onRequireWicketConfirmationChange: (value: boolean) => void;
  onSyncPlayers: () => void;
};

export function PlayerControlPanel({
  battingPlayers,
  bowlingPlayers,
  strikerId,
  nonStrikerId,
  bowlerId,
  incomingBatsmanId,
  availableIncomingBatters,
  pendingBalls,
  needsBowlerSelection,
  needsIncomingBatsman,
  requireWicketConfirmation,
  loading,
  onStrikerChange,
  onNonStrikerChange,
  onBowlerChange,
  onIncomingBatsmanChange,
  onRequireWicketConfirmationChange,
  onSyncPlayers
}: PlayerControlPanelProps) {
  const hasValidSelection = Boolean(strikerId && nonStrikerId && bowlerId);
  const hasDistinctBatters = strikerId !== nonStrikerId;
  const canSyncPlayers = hasValidSelection && hasDistinctBatters && !needsIncomingBatsman && !loading;
  const helperText = needsIncomingBatsman
    ? "Select the next batsman before confirming the wicket."
    : needsBowlerSelection
      ? "Over complete. Choose the next bowler."
      : !hasDistinctBatters
        ? "Striker and non-striker must be different players."
      : "Update the players only when something changes on the field.";

  return (
    <Card className="rounded-[20px] p-5">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Player Controls</p>
          <h3 className="m-0 mt-1 text-xl font-bold">Current players</h3>
          <p className="m-0 mt-2 text-sm text-muted-foreground">{helperText}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
          Pending {pendingBalls}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-[18px] bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Users className="h-4 w-4" />
            Current Players
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Striker</label>
              <Select value={strikerId} onChange={(event) => onStrikerChange(event.target.value)} disabled={loading}>
                {battingPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Non-Striker</label>
              <Select value={nonStrikerId} onChange={(event) => onNonStrikerChange(event.target.value)} disabled={loading}>
                {battingPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bowler</label>
              <Select value={bowlerId} onChange={(event) => onBowlerChange(event.target.value)} disabled={loading}>
                <option value="">Select bowler</option>
                {bowlingPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-[18px] bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <ShieldAlert className="h-4 w-4" />
            Match Guidance
          </div>

          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className={[
              "rounded-[16px] px-4 py-3 text-sm",
              needsIncomingBatsman
                ? "bg-red-300/10 text-red-100"
                : needsBowlerSelection
                  ? "bg-amber-300/12 text-amber-100"
                  : "bg-white/[0.04] text-white/85"
            ].join(" ")}
          >
            {helperText}
          </motion.div>

          <div className="mt-3 space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Incoming Batsman</label>
            <Select
              value={incomingBatsmanId}
              onChange={(event) => onIncomingBatsmanChange(event.target.value)}
              disabled={availableIncomingBatters.length === 0 || loading}
            >
              <option value="">
                {availableIncomingBatters.length === 0 ? "No batter needed" : "Select next batsman"}
              </option>
              {availableIncomingBatters.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </Select>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-[16px] bg-white/[0.04] px-4 py-3 text-sm text-white">
            <input
              type="checkbox"
              checked={requireWicketConfirmation}
              onChange={(event) => onRequireWicketConfirmationChange(event.target.checked)}
              disabled={loading}
              className="h-4 w-4 accent-amber-300"
            />
            Require wicket confirmation before saving
          </label>
        </div>

        <button
          type="button"
          onClick={onSyncPlayers}
          disabled={!canSyncPlayers}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-white text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <LoadingSpinner label={needsBowlerSelection ? "Starting over..." : "Updating..."} />
          ) : (
            <>
              {needsBowlerSelection ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {needsBowlerSelection ? "Start Next Over" : "Update Active Players"}
            </>
          )}
        </button>
      </div>
    </Card>
  );
}
