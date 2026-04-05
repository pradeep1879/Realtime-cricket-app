import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { LoadingSpinner } from "./ui/loading-spinner";
import { Select } from "./ui/select";
import { request } from "../lib/api";
import { useMatchStore } from "../store/match-store";

type LeagueOption = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  teamsCount: number;
  matchesCount: number;
};

type LeagueTeamOption = {
  id: string;
  name: string;
  logoUrl?: string | null;
  players: Array<{
    id: string;
    name: string;
  }>;
};

type LeagueDetail = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  teams: LeagueTeamOption[];
  matches: Array<{
    id: string;
  }>;
};

const CUSTOM_TEAM_A = "__custom_team_a__";
const CUSTOM_TEAM_B = "__custom_team_b__";

const defaultForm: {
  teamASelection: string;
  teamAName: string;
  teamAPlayers: string;
  teamBSelection: string;
  teamBName: string;
  teamBPlayers: string;
  round: string;
  totalOvers: number;
  leagueId: string;
  tossWinner: "teamA" | "teamB";
  tossDecision: "BAT" | "BOWL";
} = {
  teamASelection: CUSTOM_TEAM_A,
  teamAName: "Mumbai Meteors",
  teamAPlayers: "Aarav, Ishan, Dev, Laksh, Rohan, Kunal, Vihaan, Arjun, Neel, Yash, Kabir",
  teamBSelection: CUSTOM_TEAM_B,
  teamBName: "Delhi Dynamos",
  teamBPlayers: "Aditya, Manav, Shaurya, Harsh, Rudra, Tanish, Krish, Samar, Reyansh, Dhruv, Viraj",
  round: "Round 1",
  leagueId: "",
  totalOvers: 20,
  tossWinner: "teamA" as const,
  tossDecision: "BAT" as const
};

const defaultCreateTeamForm = {
  target: "teamA" as "teamA" | "teamB",
  name: "",
  players: "",
  logoUrl: ""
};

function parsePlayers(raw: string) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

export function SetupForm() {
  const navigate = useNavigate();
  const createAndStartMatch = useMatchStore((state) => state.createAndStartMatch);
  const loading = useMatchStore((state) => state.loading);
  const error = useMatchStore((state) => state.error);
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeamOption[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [leaguesError, setLeaguesError] = useState<string | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [createTeamLoading, setCreateTeamLoading] = useState(false);
  const [createTeamError, setCreateTeamError] = useState<string | null>(null);
  const [createTeamForm, setCreateTeamForm] = useState(defaultCreateTeamForm);

  useEffect(() => {
    let cancelled = false;

    void request<LeagueOption[]>("/api/leagues")
      .then((response) => {
        if (cancelled) return;
        setLeagues(response);
        setForm((current) => ({
          ...current,
          leagueId: current.leagueId || response[0]?.id || ""
        }));
        setLeaguesLoading(false);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setLeaguesError(
          fetchError instanceof Error ? fetchError.message : "Unable to load leagues"
        );
        setLeaguesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.leagueId) {
      setLeagueTeams([]);
      setTeamsError(null);
      return;
    }

    let cancelled = false;
    setTeamsLoading(true);
    setTeamsError(null);

    void request<LeagueDetail>(`/api/league/${form.leagueId}`)
      .then((league) => {
        if (cancelled) return;

        const teams = league.teams ?? [];
        setLeagueTeams(teams);

        setForm((current) => {
          const firstTeam = teams[0];
          const secondTeam = teams.find((team) => team.id !== firstTeam?.id);

          const teamASelection =
            current.teamASelection !== CUSTOM_TEAM_A &&
            teams.some((team) => team.id === current.teamASelection)
              ? current.teamASelection
              : firstTeam?.id ?? CUSTOM_TEAM_A;

          let teamBSelection =
            current.teamBSelection !== CUSTOM_TEAM_B &&
            teams.some((team) => team.id === current.teamBSelection) &&
            current.teamBSelection !== teamASelection
              ? current.teamBSelection
              : secondTeam?.id ?? CUSTOM_TEAM_B;

          if (teamBSelection === teamASelection) {
            teamBSelection = teams.find((team) => team.id !== teamASelection)?.id ?? CUSTOM_TEAM_B;
          }

          const selectedTeamA = teams.find((team) => team.id === teamASelection);
          const selectedTeamB = teams.find((team) => team.id === teamBSelection);

          return {
            ...current,
            teamASelection,
            teamAName: selectedTeamA?.name ?? current.teamAName,
            teamAPlayers: selectedTeamA
              ? selectedTeamA.players.map((player) => player.name).join(", ")
              : current.teamAPlayers,
            teamBSelection,
            teamBName: selectedTeamB?.name ?? current.teamBName,
            teamBPlayers: selectedTeamB
              ? selectedTeamB.players.map((player) => player.name).join(", ")
              : current.teamBPlayers,
            tossWinner:
              current.tossWinner === "teamB" && !selectedTeamB ? "teamA" : current.tossWinner
          };
        });

        setTeamsLoading(false);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setLeagueTeams([]);
        setTeamsError(
          fetchError instanceof Error ? fetchError.message : "Unable to load league teams"
        );
        setTeamsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.leagueId]);

  const teamAIsExisting = form.teamASelection !== CUSTOM_TEAM_A;
  const teamBIsExisting = form.teamBSelection !== CUSTOM_TEAM_B;
  const teamChoices = leagueTeams.map((team) => ({
    id: team.id,
    label: `${team.name} (${team.players.length} players)`
  }));
  const canStartMatch =
    !loading &&
    !leaguesLoading &&
    !teamsLoading &&
    !createTeamLoading &&
    Boolean(form.leagueId) &&
    Boolean(form.round.trim()) &&
    Boolean(form.teamAName.trim()) &&
    Boolean(form.teamBName.trim()) &&
    form.teamASelection !== form.teamBSelection &&
    parsePlayers(form.teamAPlayers).length >= 2 &&
    parsePlayers(form.teamBPlayers).length >= 2;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4 sm:p-5">
        <div className="mb-5">
          <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">Match Setup</p>
          <h2 className="m-0 mt-2 text-2xl font-bold sm:text-3xl">Create a scoring-ready fixture</h2>
          <p className="m-0 mt-2 text-sm text-muted-foreground">
            Teams, squads, overs, toss, and starting state all in one lightweight flow.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted-foreground">Team A</label>
                <Button
                  type="button"
                  size="default"
                  variant="ghost"
                  disabled={loading || !form.leagueId}
                  onClick={() => {
                    setCreateTeamError(null);
                    setCreateTeamForm((current) => ({ ...defaultCreateTeamForm, target: "teamA" }));
                    setShowCreateTeamDialog(true);
                  }}
                >
                  Create Team
                </Button>
              </div>
              <Select
                value={form.teamASelection}
                disabled={loading || teamsLoading}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  const selectedTeam = leagueTeams.find((team) => team.id === selectedId);

                  setForm((current) => {
                    const nextTeamBSelection =
                      selectedId !== CUSTOM_TEAM_A && current.teamBSelection === selectedId
                        ? leagueTeams.find((team) => team.id !== selectedId)?.id ?? CUSTOM_TEAM_B
                        : current.teamBSelection;
                    const nextTeamB =
                      nextTeamBSelection !== CUSTOM_TEAM_B
                        ? leagueTeams.find((team) => team.id === nextTeamBSelection)
                        : null;

                    return {
                      ...current,
                      teamASelection: selectedId,
                      teamAName: selectedTeam?.name ?? current.teamAName,
                      teamAPlayers: selectedTeam
                        ? selectedTeam.players.map((player) => player.name).join(", ")
                        : current.teamAPlayers,
                      teamBSelection: nextTeamBSelection,
                      teamBName: nextTeamB?.name ?? current.teamBName,
                      teamBPlayers: nextTeamB
                        ? nextTeamB.players.map((player) => player.name).join(", ")
                        : current.teamBPlayers
                    };
                  });
                }}
              >
                <option value={CUSTOM_TEAM_A}>Create new team</option>
                {teamChoices.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.label}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              placeholder="Team A Name"
              value={form.teamAName}
              disabled={loading || teamAIsExisting}
              onChange={(event) => setForm((current) => ({ ...current, teamAName: event.target.value }))}
            />
            <textarea
              className="min-h-40 w-full rounded-xl border border-border bg-input px-3 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.teamAPlayers}
              disabled={loading || teamAIsExisting}
              onChange={(event) =>
                setForm((current) => ({ ...current, teamAPlayers: event.target.value }))
              }
            />
            <p className="m-0 text-xs text-muted-foreground">
              {teamAIsExisting
                ? "Using the existing league team and squad for Team A."
                : "Create a new Team A only if it does not already exist in this league."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted-foreground">Team B</label>
                <Button
                  type="button"
                  size="default"
                  variant="ghost"
                  disabled={loading || !form.leagueId}
                  onClick={() => {
                    setCreateTeamError(null);
                    setCreateTeamForm((current) => ({ ...defaultCreateTeamForm, target: "teamB" }));
                    setShowCreateTeamDialog(true);
                  }}
                >
                  Create Team
                </Button>
              </div>
              <Select
                value={form.teamBSelection}
                disabled={loading || teamsLoading}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  const selectedTeam = leagueTeams.find((team) => team.id === selectedId);

                  setForm((current) => ({
                    ...current,
                    teamBSelection: selectedId,
                    teamBName: selectedTeam?.name ?? current.teamBName,
                    teamBPlayers: selectedTeam
                      ? selectedTeam.players.map((player) => player.name).join(", ")
                      : current.teamBPlayers
                  }));
                }}
              >
                <option value={CUSTOM_TEAM_B}>Create new team</option>
                {teamChoices
                  .filter((team) => team.id !== form.teamASelection)
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.label}
                    </option>
                  ))}
              </Select>
            </div>
            <Input
              placeholder="Team B Name"
              value={form.teamBName}
              disabled={loading || teamBIsExisting}
              onChange={(event) => setForm((current) => ({ ...current, teamBName: event.target.value }))}
            />
            <textarea
              className="min-h-40 w-full rounded-xl border border-border bg-input px-3 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.teamBPlayers}
              disabled={loading || teamBIsExisting}
              onChange={(event) =>
                setForm((current) => ({ ...current, teamBPlayers: event.target.value }))
              }
            />
            <p className="m-0 text-xs text-muted-foreground">
              {teamBIsExisting
                ? "Using the existing league team and squad for Team B."
                : "Create a new Team B only if it does not already exist in this league."}
            </p>
          </div>
        </div>
        </Card>

        <Card className="p-4 sm:p-5">
        <div className="space-y-5">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">Match Controls</p>
            <h3 className="m-0 mt-2 text-xl font-bold sm:text-2xl">Ready the innings</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Overs</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[6, 10, 20, 0].map((preset) =>
                preset > 0 ? (
                  <button
                    key={preset}
                    type="button"
                    disabled={loading}
                    onClick={() => setForm((current) => ({ ...current, totalOvers: preset }))}
                    className={[
                      "rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                      form.totalOvers === preset
                        ? "border-accent bg-accent text-slate-950"
                        : "border-white/10 bg-white/5 text-white"
                    ].join(" ")}
                  >
                    {preset}
                  </button>
                ) : (
                  <Input
                    key="custom"
                    type="number"
                    min={1}
                    value={form.totalOvers}
                    disabled={loading}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        totalOvers: Number(event.target.value) || 1
                      }))
                    }
                  />
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Round</label>
            <Input
              placeholder="Round 1"
              value={form.round}
              disabled={loading}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  round: event.target.value
                }))
              }
            />
            <p className="m-0 text-xs text-muted-foreground">
              Use labels like `Round 1`, `Quarter Final`, or `Super Six`.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">League</label>
              <Select
                value={form.leagueId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    leagueId: event.target.value
                  }))
                }
                disabled={leaguesLoading || leagues.length === 0}
                aria-busy={leaguesLoading}
              >
                <option value="" disabled>
                  {leaguesLoading
                    ? "Loading leagues..."
                    : leagues.length === 0
                      ? "Create a league first"
                      : "Select league"}
                </option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} • {league.location}
                  </option>
                ))}
              </Select>
              {leaguesError ? <p className="m-0 text-sm text-red-300">{leaguesError}</p> : null}
              {teamsError ? <p className="m-0 text-sm text-red-300">{teamsError}</p> : null}
              {!leaguesLoading && leagues.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">
                  No leagues are available yet. Create one from the leagues dashboard before starting a match.
                </p>
              ) : null}
              {!teamsLoading && leagueTeams.length > 0 ? (
                <p className="m-0 text-sm text-muted-foreground">
                  Existing league teams are ready to reuse for rematches and later rounds.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Toss Winner</label>
              <Select
                value={form.tossWinner}
                disabled={loading}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tossWinner: event.target.value as "teamA" | "teamB"
                  }))
                }
              >
                <option value="teamA">{form.teamAName || "Team A"}</option>
                <option value="teamB">{form.teamBName || "Team B"}</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Toss Decision</label>
              <Select
                value={form.tossDecision}
                disabled={loading}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tossDecision: event.target.value as "BAT" | "BOWL"
                  }))
                }
              >
                <option value="BAT">Bat first</option>
                <option value="BOWL">Bowl first</option>
              </Select>
            </div>
          </div>

          <Button
            className="h-14 w-full text-base"
            disabled={!canStartMatch}
            onClick={async () => {
              try {
                const matchId = await createAndStartMatch({
                  leagueId: form.leagueId,
                  round: form.round.trim(),
                  totalOvers: form.totalOvers,
                  tossWinner: form.tossWinner,
                  tossDecision: form.tossDecision,
                  teamA: {
                    name: form.teamAName,
                    players: parsePlayers(form.teamAPlayers)
                  },
                  teamB: {
                    name: form.teamBName,
                    players: parsePlayers(form.teamBPlayers)
                  }
                });
                navigate(`/scorer/${matchId}`);
              } catch {
                return;
              }
            }}
          >
            {loading || teamsLoading ? (
              <LoadingSpinner
                label={
                  teamsLoading
                    ? "Loading Teams..."
                    : createTeamLoading
                      ? "Creating Team..."
                      : "Starting Match..."
                }
              />
            ) : (
              "Start Match"
            )}
          </Button>

          {form.teamASelection === form.teamBSelection ? (
            <p className="m-0 text-sm text-red-300">Team A and Team B must be different teams.</p>
          ) : null}
          {error ? <p className="m-0 text-sm text-red-300">{error}</p> : null}
        </div>
        </Card>
      </div>

      {showCreateTeamDialog ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur sm:items-center">
          <Card className="w-full max-w-lg rounded-[28px] border-white/10 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">Create Team</p>
                <h3 className="m-0 mt-2 text-2xl font-bold">Add a league team</h3>
                <p className="m-0 mt-2 text-sm text-muted-foreground">
                  Create a reusable team for this league and assign it directly to {createTeamForm.target === "teamA" ? "Team A" : "Team B"}.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateTeamDialog(false);
                  setCreateTeamError(null);
                }}
              >
                Close
              </Button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Team Name</label>
                <Input
                  value={createTeamForm.name}
                  disabled={createTeamLoading}
                  onChange={(event) =>
                    setCreateTeamForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Enter team name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Players</label>
                <textarea
                  className="min-h-40 w-full rounded-xl border border-border bg-input px-3 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={createTeamForm.players}
                  disabled={createTeamLoading}
                  onChange={(event) =>
                    setCreateTeamForm((current) => ({ ...current, players: event.target.value }))
                  }
                  placeholder="Comma separated players"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Logo URL (optional)</label>
                <Input
                  value={createTeamForm.logoUrl}
                  disabled={createTeamLoading}
                  onChange={(event) =>
                    setCreateTeamForm((current) => ({ ...current, logoUrl: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            {createTeamError ? <p className="m-0 mt-4 text-sm text-red-300">{createTeamError}</p> : null}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                disabled={createTeamLoading}
                onClick={() => {
                  setShowCreateTeamDialog(false);
                  setCreateTeamError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={createTeamLoading || !form.leagueId}
                onClick={async () => {
                  setCreateTeamError(null);
                  setCreateTeamLoading(true);

                  try {
                    const createdTeam = await request<LeagueTeamOption>("/api/team", {
                      method: "POST",
                      body: JSON.stringify({
                        leagueId: form.leagueId,
                        name: createTeamForm.name.trim(),
                        logoUrl: createTeamForm.logoUrl.trim() || undefined,
                        players: parsePlayers(createTeamForm.players)
                      })
                    });

                    setLeagueTeams((current) =>
                      [...current, createdTeam].sort((left, right) => left.name.localeCompare(right.name))
                    );

                    const playersValue = createdTeam.players.map((player) => player.name).join(", ");

                    setForm((current) =>
                      createTeamForm.target === "teamA"
                        ? {
                            ...current,
                            teamASelection: createdTeam.id,
                            teamAName: createdTeam.name,
                            teamAPlayers: playersValue
                          }
                        : {
                            ...current,
                            teamBSelection: createdTeam.id,
                            teamBName: createdTeam.name,
                            teamBPlayers: playersValue
                          }
                    );

                    setCreateTeamForm(defaultCreateTeamForm);
                    setShowCreateTeamDialog(false);
                  } catch (error) {
                    setCreateTeamError(
                      error instanceof Error ? error.message : "Unable to create team"
                    );
                  } finally {
                    setCreateTeamLoading(false);
                  }
                }}
              >
                {createTeamLoading ? <LoadingSpinner label="Creating Team..." /> : "Create Team"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
