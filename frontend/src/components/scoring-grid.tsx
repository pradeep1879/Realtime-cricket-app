import { motion } from "framer-motion";

import { BallButton } from "./ball-button";

type ScoringGridProps = {
  disabled?: boolean;
  onRun: (runs: number) => void;
  onWicket: () => void;
  onWide: () => void;
  onNoBall: () => void;
  onBye: () => void;
  onLegBye: () => void;
  onUndo: () => void;
};

const runButtons = [
  { label: "0", runs: 0, tone: "neutral" as const },
  { label: "1", runs: 1, tone: "neutral" as const },
  { label: "2", runs: 2, tone: "neutral" as const },
  { label: "3", runs: 3, tone: "neutral" as const },
  { label: "4", runs: 4, tone: "boundary" as const },
  { label: "6", runs: 6, tone: "boundary" as const }
];

export function ScoringGrid({
  disabled,
  onRun,
  onWicket,
  onWide,
  onNoBall,
  onBye,
  onLegBye,
  onUndo
}: ScoringGridProps) {
  return (
    <div className="sticky bottom-0 z-20 w-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] p-3 shadow-2xl backdrop-blur-xl sm:bottom-2 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Scoring Desk</p>
          <p className="m-0 mt-1 text-sm font-semibold text-white/85">Fast tap controls</p>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">
          Live
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-3">
          <div className="flex items-center justify-between">
            <p className="m-0 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Runs</p>
            <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tap to score</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-3">
            {runButtons.map((item) => (
              <motion.div key={item.label} whileTap={{ scale: 0.96 }}>
                <BallButton
                  label={item.label}
                  tone={item.tone}
                  disabled={disabled}
                  onClick={() => onRun(item.runs)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-3">
            <p className="m-0 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Match Events</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <motion.div whileTap={{ scale: 0.96 }}>
                <BallButton label="Wicket" tone="wicket" disabled={disabled} onClick={onWicket} compact />
              </motion.div>
              <motion.div whileTap={{ scale: 0.96 }}>
                <BallButton label="Undo" tone="neutral" disabled={disabled} onClick={onUndo} compact />
              </motion.div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-3">
            <div className="flex items-center justify-between">
              <p className="m-0 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Extras</p>
              <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Quick actions</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <motion.div whileTap={{ scale: 0.96 }}>
                <BallButton label="Wide" tone="extra" disabled={disabled} onClick={onWide} compact />
              </motion.div>
              <motion.div whileTap={{ scale: 0.96 }}>
                <BallButton label="No Ball" tone="extra" disabled={disabled} onClick={onNoBall} compact />
              </motion.div>
              <motion.div whileTap={{ scale: 0.96 }}>
                <BallButton label="Bye" tone="extra" disabled={disabled} onClick={onBye} compact />
              </motion.div>
              <motion.div whileTap={{ scale: 0.96 }}>
                <BallButton label="Leg Bye" tone="extra" disabled={disabled} onClick={onLegBye} compact />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
