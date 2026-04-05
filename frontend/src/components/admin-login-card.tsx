import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { LoadingSpinner } from "./ui/loading-spinner";
import { useMatchStore } from "../store/match-store";

export function AdminLoginCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminLogin = useMatchStore((state) => state.adminLogin);
  const loading = useMatchStore((state) => state.loading);
  const error = useMatchStore((state) => state.error);
  const [pin, setPin] = useState("");

  return (
    <Card className="mx-auto max-w-md p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/20 p-3 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">Scorer Access</p>
          <h1 className="m-0 mt-1 text-2xl font-bold">Enter scorer PIN</h1>
        </div>
      </div>

      <p className="m-0 text-sm text-muted-foreground">
        Admin routes are protected by the backend. Enter the scorer PIN to unlock match setup and live scoring controls.
      </p>

      <Input
        className="mt-5 text-center text-lg tracking-[0.35em]"
        type="password"
        inputMode="numeric"
        placeholder="••••"
        value={pin}
        onChange={(event) => setPin(event.target.value)}
        disabled={loading}
      />

      <Button
        className="mt-4 h-12 w-full"
        disabled={loading || pin.length === 0}
        onClick={async () => {
          try {
            await adminLogin(pin);
            const nextPath = (location.state as { from?: string } | null)?.from ?? "/matches";
            navigate(nextPath);
          } catch {
            return;
          }
        }}
      >
        {loading ? <LoadingSpinner label="Verifying..." /> : "Unlock Scorer"}
      </Button>

      {error ? <p className="m-0 mt-3 text-sm text-red-300">{error}</p> : null}
    </Card>
  );
}
