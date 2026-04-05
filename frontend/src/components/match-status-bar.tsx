import { AlertTriangle, Target, Zap } from "lucide-react";

import { Card } from "./ui/card";

type MatchStatusBarProps = {
  statusText: string;
  requiredRunRate: string | null;
  ballsRemaining: number | null;
  partnership: string;
  isLastOver: boolean;
};

export function MatchStatusBar({
  statusText,
  requiredRunRate,
  ballsRemaining,
  partnership,
  isLastOver
}: MatchStatusBarProps) {
  return (
    <Card className="grid gap-3 rounded-[20px] border-white/10 bg-white/[0.03] p-4 sm:gap-4 md:grid-cols-3">
      <div className="rounded-[16px] bg-white/[0.03] p-3 md:bg-transparent md:p-0">
        <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Status</p>
        <p className="m-0 mt-1 text-sm font-semibold leading-6 text-white">{statusText}</p>
      </div>

      <div className="rounded-[16px] bg-white/[0.03] p-3 md:bg-transparent md:p-0">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Target className="h-3.5 w-3.5" />
          Partnership
        </div>
        <p className="m-0 mt-1 text-sm font-semibold leading-6 text-white">{partnership}</p>
        {requiredRunRate ? (
          <p className="m-0 mt-1 text-xs text-muted-foreground">Required RR {requiredRunRate}</p>
        ) : null}
      </div>

      <div className="rounded-[16px] bg-white/[0.03] p-3 md:bg-transparent md:p-0">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {isLastOver ? <AlertTriangle className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
          Remaining
        </div>
        <p className="m-0 mt-1 text-sm font-semibold leading-6 text-white">
          {isLastOver ? "Last over in progress" : ballsRemaining !== null ? `${ballsRemaining} balls left` : "Awaiting next phase"}
        </p>
      </div>
    </Card>
  );
}
