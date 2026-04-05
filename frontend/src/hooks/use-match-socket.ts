import { useEffect } from "react";

import { matchSocket } from "../lib/socket";
import { useMatchStore, type Scorecard } from "../store/match-store";

export function useMatchSocket(matchId?: string) {
  const setScorecard = useMatchStore((state) => state.setScorecard);

  useEffect(() => {
    if (!matchId) {
      return;
    }

    matchSocket.connect(matchId);

    const unsubScore = matchSocket.on("score:update", (payload) => {
      setScorecard(payload as Scorecard);
    });

    const unsubStart = matchSocket.on("match:start", (payload) => {
      setScorecard(payload as Scorecard);
    });

    return () => {
      unsubScore();
      unsubStart();
      matchSocket.disconnect();
    };
  }, [matchId, setScorecard]);
}
