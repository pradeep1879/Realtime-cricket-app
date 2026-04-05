import { motion } from "framer-motion";

import { cn } from "../lib/utils";
import type { UiMatchStatus } from "../store/match-store";

type StatusBadgeProps = {
  status: UiMatchStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<UiMatchStatus, string> = {
    SCHEDULED: "border-white/10 bg-white/8 text-slate-200",
    LIVE: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
    INNINGS_BREAK: "border-amber-300/30 bg-amber-300/12 text-amber-100",
    COMPLETED: "border-sky-400/30 bg-sky-400/12 text-sky-200",
    ABANDONED: "border-red-400/30 bg-red-400/12 text-red-200"
  };

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]", styles[status])}>
      {status === "LIVE" ? (
        <motion.span
          className="h-2 w-2 rounded-full bg-emerald-300"
          animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0.35, 0.9] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      ) : null}
      {status.replace(/_/g, " ")}
    </div>
  );
}
