import { LoaderCircle } from "lucide-react";

import { cn } from "../../lib/utils";

type LoadingSpinnerProps = {
  className?: string;
  label?: string;
};

export function LoadingSpinner({ className, label = "Loading" }: LoadingSpinnerProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LoaderCircle className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </span>
  );
}
