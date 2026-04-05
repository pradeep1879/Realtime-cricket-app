import { memo } from "react";

import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type BallButtonProps = {
  label: string;
  tone?: "neutral" | "boundary" | "wicket" | "extra";
  disabled?: boolean;
  compact?: boolean;
  onClick: () => void;
};

export const BallButton = memo(function BallButton({
  label,
  tone = "neutral",
  disabled = false,
  compact = false,
  onClick
}: BallButtonProps) {
  return (
    <Button
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full min-h-[72px] rounded-[20px] border border-white/10 px-3 text-base font-black shadow-panel transition sm:min-h-[84px] sm:rounded-[24px] sm:text-lg",
        compact && "min-h-[60px] rounded-[18px] text-sm sm:min-h-[68px] sm:text-base",
        tone === "neutral" && "bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(30,41,59,0.95))] text-white hover:bg-slate-800",
        tone === "boundary" && "bg-[linear-gradient(180deg,#34d399,#22c55e)] text-slate-950 shadow-[0_10px_30px_rgba(34,197,94,0.25)] hover:brightness-105",
        tone === "wicket" && "bg-[linear-gradient(180deg,#ef4444,#dc2626)] text-white shadow-[0_10px_30px_rgba(239,68,68,0.25)] hover:brightness-105",
        tone === "extra" && "bg-[linear-gradient(180deg,#fcd34d,#f59e0b)] text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.25)] hover:brightness-105",
        disabled && "cursor-not-allowed opacity-50",
        label.length > 4 && "text-sm sm:text-base"
      )}
    >
      {label}
    </Button>
  );
});
