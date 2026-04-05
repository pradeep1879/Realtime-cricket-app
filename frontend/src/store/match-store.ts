import { create } from "zustand";

import { getAdminToken, request, setAdminToken } from "../lib/api";
import { dequeueBall, enqueueBall, listQueuedBalls, type QueuedBallEvent } from "../lib/offline-queue";

export type UiMatchStatus = "SCHEDULED" | "LIVE" | "INNINGS_BREAK" | "COMPLETED" | "ABANDONED";

export type Player = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
};

export type BallEvent = {
  id: string;
  over: string;
  runs: number;
  extras: number;
  overthrowRuns: number;
  extraType: string;
  isWicket: boolean;
  wicketType?: string | null;
  isLegal: boolean;
  isDead: boolean;
  teamRuns: number;
  batsman: string;
  nonStriker: string;
  bowler: string;
  dismissedPlayer: string | null;
  incomingBatsman: string | null;
  statusText: string;
  createdAt: string;
};

export type Scorecard = {
  matchId: string;
  round: string | null;
  status: "CREATED" | "TOSS_DONE" | "INNINGS_1" | "INNINGS_BREAK" | "INNINGS_2" | "COMPLETED" | "ABANDONED";
  totalOvers: number;
  currentInningsNumber: number;
  target: number | null;
  result: string | null;
  toss: null | {
    winnerTeamId: string;
    winnerTeamName: string;
    decision: "BAT" | "BOWL";
  };
  teams: {
    teamA: Team;
    teamB: Team;
  };
  innings: Array<{
    inningsId: string;
    inningsNumber: number;
    battingTeam: Team;
    bowlingTeam: Team;
    totalRuns: number;
    wickets: number;
    overs: string;
    legalBalls: number;
    activePlayers: {
      striker: Player | null;
      nonStriker: Player | null;
      bowler: Player | null;
    };
    batsmenStats: Array<{
      playerId: string;
      name: string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      strikeRate: number;
      isOut: boolean;
      dismissal: null | {
        wicketType: string | null;
        bowler: string;
      };
    }>;
    bowlerStats: Array<{
      playerId: string;
      name: string;
      overs: string;
      maidens: number;
      runsConceded: number;
      wickets: number;
      economy: number;
    }>;
    overSummaries: Array<{
      overNumber: number;
      overLabel: string;
      runs: number;
      wickets: number;
      legalBalls: number;
    }>;
    lastDismissedBatsman: null | {
      playerId: string;
      name: string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      strikeRate: number;
      dismissal: null | {
        wicketType: string | null;
        bowler: string;
      };
    };
    lastOverBowler: null | {
      playerId: string;
      name: string;
      overs: string;
      maidens: number;
      runsConceded: number;
      wickets: number;
      economy: number;
    };
    extrasSummary: {
      wides: number;
      noBalls: number;
      byes: number;
      legByes: number;
    };
    recentBalls: BallEvent[];
    lastBall: BallEvent | null;
    isCompleted: boolean;
  }>;
  currentInnings: Scorecard["innings"][number] | null;
  summary: null | {
    score: number;
    wickets: number;
    overs: string;
    lastBall: BallEvent | null;
    batsmenStats: Scorecard["innings"][number]["batsmenStats"];
    bowlerStats: Scorecard["innings"][number]["bowlerStats"];
  };
};

export type MatchListItem = {
  id: string;
  title: string;
  round: string | null;
  status: Scorecard["status"];
  totalOvers: number;
  teams: Scorecard["teams"];
  currentInningsNumber: number;
  toss: Scorecard["toss"];
  result: string | null;
  summary: null | {
    battingTeamId: string;
    battingTeamName: string;
    score: number;
    wickets: number;
    overs: string;
  };
};

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: "success" | "error" | "info";
  durationMs?: number;
};

export type SetupPayload = {
  leagueId: string;
  round?: string;
  totalOvers: number;
  tossWinner: "teamA" | "teamB";
  tossDecision: "BAT" | "BOWL";
  teamA: { name: string; players: Array<{ name: string }> };
  teamB: { name: string; players: Array<{ name: string }> };
};

type BallPayload = QueuedBallEvent["payload"];
type MatchFilter = "ALL" | "LIVE" | "COMPLETED";

type MatchState = {
  matches: MatchListItem[];
  scorecard: Scorecard | null;
  isAdmin: boolean;
  adminChecking: boolean;
  filter: MatchFilter;
  loading: boolean;
  matchesLoading: boolean;
  error: string | null;
  pendingBalls: QueuedBallEvent[];
  toasts: ToastItem[];
  setFilter: (filter: MatchFilter) => void;
  showToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
  adminLogin: (pin: string) => Promise<void>;
  adminLogout: () => void;
  verifyAdmin: () => Promise<void>;
  setScorecard: (scorecard: Scorecard) => void;
  fetchMatches: () => Promise<void>;
  createAndStartMatch: (payload: SetupPayload) => Promise<string>;
  startCurrentMatch: () => Promise<void>;
  loadScorecard: (matchId: string) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;
  addBall: (payload: BallPayload) => Promise<void>;
  undoBall: () => Promise<void>;
  updatePlayers: (payload: {
    strikerId: string;
    nonStrikerId: string;
    bowlerId: string;
  }) => Promise<void>;
  syncPendingBalls: () => Promise<void>;
};

function createClientEventId() {
  return `ball-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function playerUpdateToastMessage(scorecard: Scorecard) {
  const innings = scorecard.currentInnings;
  if (!innings) {
    return "Active players are ready.";
  }

  if (!innings.activePlayers.bowler) {
    return "Opening batters are set. Select the bowler to continue.";
  }

  return `${innings.activePlayers.striker?.name ?? "Striker"} and ${innings.activePlayers.nonStriker?.name ?? "non-striker"} are ready.`;
}

export function mapStatus(status: MatchListItem["status"]): UiMatchStatus {
  if (status === "INNINGS_1" || status === "INNINGS_2") {
    return "LIVE";
  }

  if (status === "CREATED" || status === "TOSS_DONE") {
    return "SCHEDULED";
  }

  if (status === "ABANDONED") {
    return "ABANDONED";
  }

  return status;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  scorecard: null,
  isAdmin: Boolean(getAdminToken()),
  adminChecking: false,
  filter: "ALL",
  loading: false,
  matchesLoading: false,
  error: null,
  pendingBalls: listQueuedBalls(),
  toasts: [],
  setFilter: (filter) => set({ filter }),
  showToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: createToastId() }]
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    })),
  adminLogin: async (pin) => {
    set({ loading: true, error: null });

    try {
      const response = await request<{ token: string; expiresAt: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ pin })
      });

      setAdminToken(response.token);
      set({ isAdmin: true, loading: false });
      get().showToast({
        variant: "success",
        title: "Scorer access unlocked",
        message: "Admin controls are now available for match setup and live scoring."
      });
    } catch (error) {
      setAdminToken(null);
      set({
        isAdmin: false,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to unlock scorer access"
      });
      get().showToast({
        variant: "error",
        title: "Unable to unlock scorer access",
        message: error instanceof Error ? error.message : "Please try the PIN again."
      });
      throw error;
    }
  },
  adminLogout: () => {
    setAdminToken(null);
    set({ isAdmin: false });
    get().showToast({
      variant: "info",
      title: "Logged out",
      message: "Scorer controls have been locked for this session.",
      durationMs: 2200
    });
  },
  verifyAdmin: async () => {
    if (!getAdminToken()) {
      set({ isAdmin: false, adminChecking: false });
      return;
    }

    set({ adminChecking: true });

    try {
      await request<{ ok: true }>("/api/admin/verify");
      set({ isAdmin: true, adminChecking: false });
    } catch {
      setAdminToken(null);
      set({ isAdmin: false, adminChecking: false });
    }
  },
  setScorecard: (scorecard) => set({ scorecard }),
  fetchMatches: async () => {
    set({ matchesLoading: true, error: null });

    try {
      const matches = await request<MatchListItem[]>("/api/matches");
      set({ matches, matchesLoading: false });
    } catch (error) {
      set({
        matchesLoading: false,
        error: error instanceof Error ? error.message : "Unable to fetch matches"
      });
      get().showToast({
        variant: "error",
        title: "Could not load matches",
        message: error instanceof Error ? error.message : "Please refresh and try again."
      });
    }
  },
  createAndStartMatch: async (payload) => {
    set({ loading: true, error: null });

    try {
      const created = await request<Scorecard>("/api/match", {
        method: "POST",
        body: JSON.stringify({
          leagueId: payload.leagueId,
          round: payload.round,
          totalOvers: payload.totalOvers,
          teamA: payload.teamA,
          teamB: payload.teamB
        })
      });

      const tossWinnerId =
        payload.tossWinner === "teamA" ? created.teams.teamA.id : created.teams.teamB.id;

      await request<Scorecard>(`/api/match/${created.matchId}/toss`, {
        method: "POST",
        body: JSON.stringify({
          tossWinnerId,
          tossDecision: payload.tossDecision
        })
      });

      const started = await request<Scorecard>(`/api/match/${created.matchId}/start`, {
        method: "POST"
      });

      const battingPlayers = started.currentInnings?.battingTeam.players ?? [];
      const bowlingPlayers = started.currentInnings?.bowlingTeam.players ?? [];

      const ready = await request<Scorecard>(`/api/match/${started.matchId}/select-players`, {
        method: "POST",
        body: JSON.stringify({
          strikerId: battingPlayers[0]?.id,
          nonStrikerId: battingPlayers[1]?.id,
          bowlerId: bowlingPlayers[0]?.id
        })
      });

      set({
        scorecard: ready,
        loading: false
      });

      await get().fetchMatches();
      get().showToast({
        variant: "success",
        title: "Match ready",
        message: "The match was created, toss completed, and opening players were selected."
      });
      return ready.matchId;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to create match"
      });
      get().showToast({
        variant: "error",
        title: "Unable to start match",
        message: error instanceof Error ? error.message : "Check the setup details and try again."
      });
      throw error;
    }
  },
  startCurrentMatch: async () => {
    const scorecard = get().scorecard;
    if (!scorecard) return;

    set({ loading: true, error: null });

    try {
      const started = await request<Scorecard>(`/api/match/${scorecard.matchId}/start`, {
        method: "POST"
      });

      set({
        scorecard: started,
        loading: false
      });
      await get().fetchMatches();
      get().showToast({
        variant: "success",
        title: started.currentInningsNumber === 2 ? "Second innings started" : "Match started",
        message: "Select the live players and continue scoring."
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to start innings"
      });
      get().showToast({
        variant: "error",
        title: "Unable to start innings",
        message: error instanceof Error ? error.message : "Please try again."
      });
      throw error;
    }
  },
  loadScorecard: async (matchId) => {
    set({ loading: true, error: null });

    try {
      const scorecard = await request<Scorecard>(`/api/match/${matchId}/scorecard`);
      set({
        scorecard,
        loading: false
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to fetch scorecard"
      });
      get().showToast({
        variant: "error",
        title: "Unable to load scorecard",
        message: error instanceof Error ? error.message : "Please refresh and try again."
      });
    }
  },
  deleteMatch: async (matchId) => {
    set({ loading: true, error: null });

    try {
      await request<{ ok: true }>(`/api/match/${matchId}`, {
        method: "DELETE"
      });

      set((state) => ({
        matches: state.matches.filter((match) => match.id !== matchId),
        scorecard: state.scorecard?.matchId === matchId ? null : state.scorecard,
        loading: false
      }));
      get().showToast({
        variant: "success",
        title: "Match deleted",
        message: "The fixture has been removed from the dashboard."
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to delete match"
      });
      get().showToast({
        variant: "error",
        title: "Unable to delete match",
        message: error instanceof Error ? error.message : "Please try again."
      });
      throw error;
    }
  },
  addBall: async (payload) => {
    const scorecard = get().scorecard;
    if (!scorecard) return;

    const matchId = scorecard.matchId;
    const event: QueuedBallEvent = {
      clientEventId: createClientEventId(),
      matchId,
      payload,
      queuedAt: new Date().toISOString()
    };

    const submit = async (queuedEvent: QueuedBallEvent) => {
      const latest = await request<Scorecard>(`/api/match/${matchId}/ball`, {
        method: "POST",
        body: JSON.stringify({
          ...queuedEvent.payload,
          clientEventId: queuedEvent.clientEventId
        })
      });

      set({ scorecard: latest });
      dequeueBall(queuedEvent.clientEventId);
      set({ pendingBalls: listQueuedBalls() });
      await get().fetchMatches();
    };

    if (!navigator.onLine) {
      enqueueBall(event);
      set({ pendingBalls: listQueuedBalls() });
      get().showToast({
        variant: "info",
        title: "Saved offline",
        message: "The ball has been queued and will sync when the connection returns.",
        durationMs: 2600
      });
      return;
    }

    try {
      set({ loading: true, error: null });
      await submit(event);
      set({ loading: false });
    } catch {
      set({ loading: false });
      enqueueBall(event);
      set({ pendingBalls: listQueuedBalls() });
      get().showToast({
        variant: "info",
        title: "Connection interrupted",
        message: "That ball was queued locally and will sync automatically."
      });
    }
  },
  undoBall: async () => {
    const scorecard = get().scorecard;
    if (!scorecard) return;

    set({ loading: true, error: null });
    try {
      const latest = await request<Scorecard>(`/api/match/${scorecard.matchId}/ball/undo`, {
        method: "POST"
      });

      set({ scorecard: latest });
      await get().fetchMatches();
      get().showToast({
        variant: "success",
        title: "Last ball removed",
        message: "The innings state has been recalculated."
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to undo the last ball"
      });
      get().showToast({
        variant: "error",
        title: "Unable to undo ball",
        message: error instanceof Error ? error.message : "Please try again."
      });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  updatePlayers: async (payload) => {
    const scorecard = get().scorecard;
    if (!scorecard) return;

    set({ loading: true, error: null });
    try {
      const latest = await request<Scorecard>(`/api/match/${scorecard.matchId}/select-players`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      set({ scorecard: latest });
      get().showToast({
        variant: "success",
        title: "Players updated",
        message: playerUpdateToastMessage(latest)
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to update active players"
      });
      get().showToast({
        variant: "error",
        title: "Unable to update players",
        message: error instanceof Error ? error.message : "Please check the selections and try again."
      });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  syncPendingBalls: async () => {
    const queue = [...listQueuedBalls()];
    if (queue.length === 0) return;

    set({ loading: true, error: null });

    try {
      for (const event of queue) {
        try {
          const scorecard = await request<Scorecard>(`/api/match/${event.matchId}/ball`, {
            method: "POST",
            body: JSON.stringify({
              ...event.payload,
              clientEventId: event.clientEventId
            })
          });

          dequeueBall(event.clientEventId);
          set({
            scorecard,
            pendingBalls: listQueuedBalls()
          });
        } catch {
          break;
        }
      }

      await get().fetchMatches();
      get().showToast({
        variant: "success",
        title: "Pending balls synced",
        message: "Offline scoring events have been pushed to the server."
      });
    } finally {
      set({ loading: false });
    }
  }
}));
