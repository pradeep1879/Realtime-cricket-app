import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Radio } from "lucide-react";

import { MatchList } from "../components/match-list";
import { PointsTable } from "../components/points-table";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { request } from "../lib/api";
import { type MatchListItem, type Scorecard, useMatchStore } from "../store/match-store";

type LeagueDetail = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  teams: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
    players: Array<{ id: string; name: string }>;
  }>;
  matches: MatchListItem[];
};

type LeagueTab = "matches" | "points" | "teams";

function oversToDecimal(value: string) {
  const [overs, balls] = value.split(".").map(Number);
  return overs + (balls ?? 0) / 6;
}

export function LeagueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isAdmin = useMatchStore((state) => state.isAdmin);
  const [tab, setTab] = useState<LeagueTab>("matches");
  const [league, setLeague] = useState<LeagueDetail | null>(null);
  const [leagueLoading, setLeagueLoading] = useState(true);
  const [leagueError, setLeagueError] = useState<string | null>(null);
  const [scorecards, setScorecards] = useState<Record<string, Scorecard>>({});

  useEffect(() => {
    if (!id) {
      setLeague(null);
      setLeagueLoading(false);
      return;
    }

    let cancelled = false;

    void request<LeagueDetail>(`/api/league/${id}`)
      .then((response) => {
        if (cancelled) return;
        setLeague(response);
        setLeagueLoading(false);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setLeagueError(fetchError instanceof Error ? fetchError.message : "Unable to load league");
        setLeagueLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const leagueMatches = league?.matches ?? [];

  useEffect(() => {
    if (!leagueMatches.length) {
      setScorecards({});
      return;
    }

    void Promise.all(
      leagueMatches.map(async (match) => {
        const scorecard = await request<Scorecard>(`/api/match/${match.id}/scorecard`);
        return [match.id, scorecard] as const;
      })
    ).then((entries) => {
      setScorecards(Object.fromEntries(entries));
    });
  }, [leagueMatches]);

  const teams = useMemo(() => {
    const byId = new Map<
      string,
      {
        id: string;
        name: string;
        players: { id: string; name: string }[];
        matches: number;
        wins: number;
        losses: number;
        ties: number;
        points: number;
        runsFor: number;
        oversFaced: number;
        runsAgainst: number;
        oversBowled: number;
      }
    >();

    const sourceTeams = league?.teams ?? [];

    for (const team of sourceTeams) {
      byId.set(team.id, {
        id: team.id,
        name: team.name,
        players: team.players,
        matches: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        points: 0,
        runsFor: 0,
        oversFaced: 0,
        runsAgainst: 0,
        oversBowled: 0
      });
    }

    for (const match of leagueMatches) {
      [match.teams.teamA, match.teams.teamB].forEach((team) => {
        if (!byId.has(team.id)) {
          byId.set(team.id, {
            id: team.id,
            name: team.name,
            players: team.players,
            matches: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            points: 0,
            runsFor: 0,
            oversFaced: 0,
            runsAgainst: 0,
            oversBowled: 0
          });
        }
      });

      const scorecard = scorecards[match.id];
      if (!scorecard || scorecard.innings.length < 2 || scorecard.status !== "COMPLETED") {
        continue;
      }

      const first = scorecard.innings[0];
      const second = scorecard.innings[1];

      const firstTeam = byId.get(first.battingTeam.id);
      const secondTeam = byId.get(second.battingTeam.id);
      if (!firstTeam || !secondTeam) continue;

      firstTeam.matches += 1;
      secondTeam.matches += 1;

      firstTeam.runsFor += first.totalRuns;
      firstTeam.oversFaced += oversToDecimal(first.overs);
      firstTeam.runsAgainst += second.totalRuns;
      firstTeam.oversBowled += oversToDecimal(second.overs);

      secondTeam.runsFor += second.totalRuns;
      secondTeam.oversFaced += oversToDecimal(second.overs);
      secondTeam.runsAgainst += first.totalRuns;
      secondTeam.oversBowled += oversToDecimal(first.overs);

      if (second.totalRuns > first.totalRuns) {
        secondTeam.wins += 1;
        secondTeam.points += 2;
        firstTeam.losses += 1;
      } else if (second.totalRuns < first.totalRuns) {
        firstTeam.wins += 1;
        firstTeam.points += 2;
        secondTeam.losses += 1;
      } else {
        firstTeam.ties += 1;
        secondTeam.ties += 1;
        firstTeam.points += 1;
        secondTeam.points += 1;
      }
    }

    return [...byId.values()];
  }, [league?.teams, leagueMatches, scorecards]);

  const pointsRows = useMemo(
    () =>
      teams
        .map((team) => ({
          teamId: team.id,
          teamName: team.name,
          played: team.matches,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          points: team.points,
          nrr:
            (team.runsFor / Math.max(team.oversFaced, 1)) -
            (team.runsAgainst / Math.max(team.oversBowled, 1))
        }))
        .sort((a, b) => (b.points === a.points ? b.nrr - a.nrr : b.points - a.points)),
    [teams]
  );

  if (leagueLoading) {
    return (
      <Card className="p-6">
        <p className="m-0 text-lg font-semibold">Loading league...</p>
      </Card>
    );
  }

  if (!league) {
    return (
      <Card className="p-6">
        <p className="m-0 text-lg font-semibold">{leagueError ?? "League not found"}</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-3">
        <Link to="/leagues">
          <Button variant="ghost">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Leagues
          </Button>
        </Link>
      </div>

      <Card className="p-4 sm:p-5">
        <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">League Detail</p>
        <h1 className="m-0 mt-2 text-2xl font-bold sm:text-3xl">{league.name}</h1>
        <p className="m-0 mt-2 text-sm text-muted-foreground">
          {league.location} • {league.startDate} to {league.endDate}
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(["matches", "points", "teams"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={[
              "rounded-full border px-4 py-2 text-sm font-semibold capitalize transition",
              tab === item
                ? "border-accent bg-accent text-slate-950"
                : "border-white/10 bg-white/5 text-white"
            ].join(" ")}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "matches" ? (
        <MatchList matches={leagueMatches} isAdmin={isAdmin} />
      ) : null}

      {tab === "points" ? <PointsTable rows={pointsRows} /> : null}

      {tab === "teams" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.24em] text-accent">Team</p>
                  <h3 className="m-0 mt-2 text-xl font-bold sm:text-2xl">{team.name}</h3>
                </div>
                {isAdmin && leagueMatches.find((match) => match.teams.teamA.id === team.id || match.teams.teamB.id === team.id) ? (
                  <Radio className="h-5 w-5 text-muted-foreground" />
                ) : null}
              </div>
              <p className="m-0 mt-3 text-sm text-muted-foreground">
                Matches {team.matches} • Wins {team.wins} • Losses {team.losses}
              </p>
              <div className="mt-4 grid gap-2">
                {team.players.map((player) => (
                  <div
                    key={player.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    {player.name}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
