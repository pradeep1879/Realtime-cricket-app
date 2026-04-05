import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, ShieldCheck, LogOut } from "lucide-react";

import { MatchList } from "../components/match-list";
import { StatusBadge } from "../components/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { mapStatus, useMatchStore } from "../store/match-store";

export function MatchesDashboardPage() {
  const matches = useMatchStore((state) => state.matches);
  const filter = useMatchStore((state) => state.filter);
  const setFilter = useMatchStore((state) => state.setFilter);
  const fetchMatches = useMatchStore((state) => state.fetchMatches);
  const matchesLoading = useMatchStore((state) => state.matchesLoading);
  const isAdmin = useMatchStore((state) => state.isAdmin);
  const adminLogout = useMatchStore((state) => state.adminLogout);
  const deleteMatch = useMatchStore((state) => state.deleteMatch);

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  const filteredMatches = useMemo(() => {
    if (filter === "ALL") return matches;
    return matches.filter((match) =>
      filter === "LIVE" ? mapStatus(match.status) === "LIVE" : mapStatus(match.status) === "COMPLETED"
    );
  }, [filter, matches]);

  return (
    <div className="grid gap-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">Matches Dashboard</p>
            <h1 className="m-0 mt-2 text-2xl font-bold sm:text-3xl md:text-5xl">Live cricket, clearly organized</h1>
            <p className="m-0 mt-2 max-w-2xl text-sm text-muted-foreground">
              Browse scheduled, live, and completed fixtures. Public users stay viewer-only, while scorers can unlock admin tools.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isAdmin ? (
              <Button variant="secondary" onClick={adminLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout Admin
              </Button>
            ) : (
              <Link to="/admin/login">
                <Button variant="ghost">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Scorer Login
                </Button>
              </Link>
            )}
            {isAdmin ? (
              <Link to="/scorer/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Match
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(["ALL", "LIVE", "COMPLETED"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={[
              "rounded-full border px-4 py-2 text-sm font-semibold transition",
              filter === item
                ? "border-accent bg-accent text-slate-950"
                : "border-white/10 bg-white/5 text-white"
            ].join(" ")}
          >
            {item}
          </button>
        ))}
      </div>

      {matchesLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Loading matches...</Card>
      ) : filteredMatches.length === 0 ? (
        <Card className="p-6">
          <p className="m-0 text-lg font-semibold">No matches yet</p>
          <p className="m-0 mt-2 text-sm text-muted-foreground">
            Log in as scorer to create the first match and start scoring.
          </p>
        </Card>
      ) : (
        <MatchList
          matches={filteredMatches}
          isAdmin={isAdmin}
          onDelete={(matchId) => {
            if (window.confirm("Delete this match permanently?")) {
              void deleteMatch(matchId);
            }
          }}
        />
      )}

      <Card className="p-5">
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="SCHEDULED" />
          <StatusBadge status="LIVE" />
          <StatusBadge status="INNINGS_BREAK" />
          <StatusBadge status="COMPLETED" />
          <StatusBadge status="ABANDONED" />
        </div>
      </Card>
    </div>
  );
}
