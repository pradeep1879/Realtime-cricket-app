export type LeagueStatus = "UPCOMING" | "LIVE" | "COMPLETED";

export type League = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: LeagueStatus;
};

const LEAGUES_KEY = "cricket-platform-leagues";
const MATCH_LEAGUE_KEY = "cricket-platform-match-league-map";

const defaultLeagues: League[] = [
  {
    id: "open-premier-league",
    name: "Open Premier League",
    location: "Mumbai",
    startDate: "2026-04-01",
    endDate: "2026-05-12",
    status: "LIVE"
  },
  {
    id: "summer-challengers-cup",
    name: "Summer Challengers Cup",
    location: "Pune",
    startDate: "2026-06-01",
    endDate: "2026-06-28",
    status: "UPCOMING"
  }
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getLeagues() {
  const leagues = readJson<League[]>(LEAGUES_KEY, defaultLeagues);

  if (!leagues.length) {
    writeJson(LEAGUES_KEY, defaultLeagues);
    return defaultLeagues;
  }

  return leagues;
}

export function createLeague(league: Omit<League, "id">) {
  const leagues = getLeagues();
  const next = {
    ...league,
    id: `league-${Date.now()}`
  };

  writeJson(LEAGUES_KEY, [next, ...leagues]);
  return next;
}

export function getMatchLeagueMap() {
  return readJson<Record<string, string>>(MATCH_LEAGUE_KEY, {});
}

export function assignMatchToLeague(matchId: string, leagueId: string) {
  const map = getMatchLeagueMap();
  map[matchId] = leagueId;
  writeJson(MATCH_LEAGUE_KEY, map);
}

export function getLeagueForMatch(matchId: string) {
  const map = getMatchLeagueMap();
  return map[matchId] ?? defaultLeagues[0].id;
}
