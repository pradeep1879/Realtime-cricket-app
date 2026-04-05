import { useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";

import { LeagueCard } from "../components/league-card";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { request } from "../lib/api";
import { useMatchStore } from "../store/match-store";

type League = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  teamsCount: number;
  matchesCount: number;
};

export function LeaguesPage() {
  const isAdmin = useMatchStore((state) => state.isAdmin);
  const showToast = useMatchStore((state) => state.showToast);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    let cancelled = false;

    void request<League[]>("/api/leagues")
      .then((response) => {
        if (cancelled) return;
        setLeagues(response);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load leagues");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-4">
      <Card className="p-4 sm:p-5">
        <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">League Hub</p>
        <h1 className="m-0 mt-2 text-2xl font-bold sm:text-3xl md:text-5xl">Leagues, fixtures, and tables in one place</h1>
        <p className="m-0 mt-2 max-w-2xl text-sm text-muted-foreground">
          Browse active competitions, open live matches, and track teams through standings and recent fixtures.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <Card className="p-5 text-sm text-muted-foreground">Loading leagues...</Card>
          ) : leagues.length > 0 ? (
            leagues.map((league) => (
              <LeagueCard key={league.id} league={league} teamsCount={league.teamsCount} />
            ))
          ) : (
            <Card className="p-4 sm:p-5">
              <p className="m-0 text-lg font-semibold">No leagues yet</p>
              <p className="m-0 mt-2 text-sm text-muted-foreground">
                {isAdmin
                  ? "Create the first league to start organizing fixtures and points tables."
                  : "Leagues will appear here as soon as an admin creates them."}
              </p>
            </Card>
          )}
        </div>

        <Card className="p-4 sm:p-5">
          {isAdmin ? (
            <>
              <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">Create League</p>
              <h2 className="m-0 mt-2 text-xl font-bold sm:text-2xl">Add a competition</h2>

              <div className="mt-5 grid gap-3">
                <Input
                  placeholder="League name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
                <Input
                  placeholder="Location"
                  value={form.location}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                />
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                />
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                />
              </div>

              <Button
                className="mt-4 w-full"
                disabled={creating}
                onClick={async () => {
                  setCreating(true);
                  setError(null);

                  try {
                    const league = await request<League>("/api/league", {
                      method: "POST",
                      body: JSON.stringify({
                        name: form.name || "New League",
                        location: form.location || "TBD",
                        startDate: form.startDate || new Date().toISOString().slice(0, 10),
                        endDate: form.endDate || new Date().toISOString().slice(0, 10),
                        status: "UPCOMING"
                      })
                    });

                    setLeagues((current) => [league, ...current]);
                    setForm({
                      name: "",
                      location: "",
                      startDate: "",
                      endDate: ""
                    });
                    showToast({
                      variant: "success",
                      title: "League created",
                      message: `${league.name} is now available for fixtures and points tables.`
                    });
                  } catch (createError) {
                    setError(
                      createError instanceof Error ? createError.message : "Unable to create league"
                    );
                    showToast({
                      variant: "error",
                      title: "Unable to create league",
                      message:
                        createError instanceof Error ? createError.message : "Please try again."
                    });
                  } finally {
                    setCreating(false);
                  }
                }}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                {creating ? "Creating League..." : "Create League"}
              </Button>
            </>
          ) : (
            <>
              <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">Public View</p>
              <h2 className="m-0 mt-2 text-xl font-bold sm:text-2xl">Viewer-only league hub</h2>
              <p className="m-0 mt-3 text-sm text-muted-foreground">
                Public users can browse leagues, matches, and standings here. League creation and scoring controls are only available after scorer login.
              </p>
            </>
          )}

          {error ? <p className="m-0 mt-4 text-sm text-red-300">{error}</p> : null}
        </Card>
      </div>
    </div>
  );
}
