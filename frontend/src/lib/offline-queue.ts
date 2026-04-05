const STORAGE_KEY = "cricket-exchange-ball-queue";

export type QueuedBallEvent = {
  clientEventId: string;
  matchId: string;
  payload: {
    batsmanId: string;
    nonStrikerId: string;
    bowlerId: string;
    runs: number;
    extras?: number;
    overthrowRuns?: number;
    extraType?: "NONE" | "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";
    isWicket?: boolean;
    wicketType?:
      | "BOWLED"
      | "CAUGHT"
      | "RUN_OUT"
      | "LBW"
      | "STUMPED"
      | "HIT_WICKET"
    dismissedPlayerId?: string;
    incomingBatsmanId?: string;
    isDead?: boolean;
  };
  queuedAt: string;
};

function readQueue() {
  if (typeof window === "undefined") {
    return [] as QueuedBallEvent[];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as QueuedBallEvent[]) : [];
}

function writeQueue(queue: QueuedBallEvent[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function listQueuedBalls() {
  return readQueue();
}

export function enqueueBall(event: QueuedBallEvent) {
  const queue = readQueue();

  if (queue.some((item) => item.clientEventId === event.clientEventId)) {
    return;
  }

  queue.push(event);
  writeQueue(queue);
}

export function dequeueBall(clientEventId: string) {
  const queue = readQueue().filter((item) => item.clientEventId !== clientEventId);
  writeQueue(queue);
}
