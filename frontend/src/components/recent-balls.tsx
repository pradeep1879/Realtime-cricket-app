import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Card } from "./ui/card";
import type { BallEvent } from "../store/match-store";
import { cn } from "../lib/utils";

export function ballBadge(ball: BallEvent) {
  if (ball.isWicket) {
    switch (ball.wicketType) {
      case "RUN_OUT":
        return "RO";
      case "CAUGHT":
        return "C";
      case "BOWLED":
        return "B";
      case "LBW":
        return "LBW";
      case "STUMPED":
        return "ST";
      case "HIT_WICKET":
        return "HW";
      default:
        return "W";
    }
  }

  if (ball.extraType === "WIDE") {
    const additionalWideRuns = Math.max(ball.teamRuns - 1, 0);
    return additionalWideRuns > 0 ? `Wd+${additionalWideRuns}` : "Wd";
  }

  if (ball.extraType === "NO_BALL") {
    const additionalNoBallRuns = Math.max(ball.teamRuns - 1, 0);
    return additionalNoBallRuns > 0 ? `Nb+${additionalNoBallRuns}` : "Nb";
  }

  if (ball.extraType === "BYE") {
    return `B${ball.teamRuns}`;
  }

  if (ball.extraType === "LEG_BYE") {
    return `Lb${ball.teamRuns}`;
  }

  return `${ball.teamRuns}`;
}

type RecentBallsProps = {
  balls: BallEvent[];
};

export const RecentBalls = memo(function RecentBalls({ balls }: RecentBallsProps) {
  const items = balls.slice(-6);

  return (
    <Card className="rounded-[18px] border-white/10 bg-white/[0.03] px-3.5 py-2.5 sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Recent Balls</p>
          <p className="m-0 mt-0.5 text-xs font-semibold text-white">Last six deliveries</p>
        </div>
        <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {items.length}/6
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2 sm:gap-2.5">
        <AnimatePresence initial={false}>
          {items.map((ball, index) => (
            <motion.div
              key={ball.id}
              layout
              initial={{ scale: 0.72, opacity: 0, x: 16 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.72, opacity: 0, x: -16 }}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-full border px-2.5 text-[10px] font-bold transition sm:h-9 sm:min-w-9 sm:px-3 sm:text-[11px]",
                index === items.length - 1 && "scale-105 border-accent bg-accent text-slate-950 shadow-lg",
                index !== items.length - 1 && "border-white/10 bg-white/[0.04] text-white",
                ball.isWicket && index !== items.length - 1 && "border-red-400/50 bg-red-500/15 text-red-100",
                !ball.isWicket &&
                  (ball.extraType === "WIDE" || ball.extraType === "NO_BALL" || ball.extraType === "BYE" || ball.extraType === "LEG_BYE") &&
                  index !== items.length - 1 &&
                  "border-amber-300/50 bg-amber-300/15 text-amber-100",
                !ball.isWicket &&
                  ball.teamRuns >= 4 &&
                  index !== items.length - 1 &&
                  "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
              )}
            >
              {ballBadge(ball)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
});
