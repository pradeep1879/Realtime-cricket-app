import { motion } from "framer-motion";

import { Card } from "./ui/card";

type PlayerCardProps = {
  name: string;
  runs: number;
  balls: number;
  strikeRate: number;
  fours: number;
  sixes: number;
  isStriker: boolean;
};

export function PlayerCard({
  name,
  runs,
  balls,
  strikeRate,
  fours,
  sixes,
  isStriker
}: PlayerCardProps) {
  return (
    <motion.div
      layout
      animate={
        isStriker
          ? {
              scale: 1.01,
              opacity: 1,
              boxShadow: "0 0 0 1px rgba(52,211,153,.25), 0 10px 28px rgba(15,23,42,.28)"
            }
          : { scale: 1, opacity: 0.76, boxShadow: "0 8px 24px rgba(0,0,0,.14)" }
      }
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <Card
        className={[
          "overflow-hidden rounded-[20px] p-4 sm:p-5",
          isStriker
            ? "border-emerald-300/30 bg-emerald-400/[0.06]"
            : "border-white/10 bg-white/[0.03]"
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {isStriker ? "On Strike" : "Non-striker"}
            </p>
            <h3 className="m-0 mt-1 text-lg font-bold sm:text-xl">{name}</h3>
          </div>
          {isStriker ? (
            <div className="flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-emerald-300"
              />
              ON STRIKE
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="m-0 text-2xl font-black sm:text-3xl">
            {runs}
            <span className="text-base font-semibold text-muted-foreground"> ({balls})</span>
          </p>
          <p className="m-0 text-sm text-muted-foreground">SR {strikeRate}</p>
        </div>

        <p className="m-0 mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          4s {fours} | 6s {sixes}
        </p>
      </Card>
    </motion.div>
  );
}
