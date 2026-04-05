import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { useMatchStore } from "../../store/match-store";

const toastStyles = {
  success: {
    icon: CheckCircle2,
    card: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
    iconWrap: "bg-emerald-400/15 text-emerald-200"
  },
  error: {
    icon: AlertCircle,
    card: "border-red-400/20 bg-red-400/10 text-red-50",
    iconWrap: "bg-red-400/15 text-red-200"
  },
  info: {
    icon: Info,
    card: "border-white/10 bg-slate-900/95 text-white",
    iconWrap: "bg-white/10 text-slate-200"
  }
} as const;

export function Toaster() {
  const toasts = useMatchStore((state) => state.toasts);
  const dismissToast = useMatchStore((state) => state.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), toast.durationMs ?? 3200)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dismissToast, toasts]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] px-3 sm:top-6 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-end gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const tone = toastStyles[toast.variant];
            const Icon = tone.icon;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                className={[
                  "pointer-events-auto w-full max-w-sm rounded-[20px] border shadow-2xl backdrop-blur-xl",
                  tone.card
                ].join(" ")}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className={["rounded-full p-2", tone.iconWrap].join(" ")}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-sm font-semibold">{toast.title}</p>
                    {toast.message ? (
                      <p className="m-0 mt-1 text-sm leading-5 text-white/75">{toast.message}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-full border border-white/10 bg-white/5 p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
