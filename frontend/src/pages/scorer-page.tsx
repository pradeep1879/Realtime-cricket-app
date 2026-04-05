import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { ScorerPanel } from "../components/scorer-panel";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { useMatchSocket } from "../hooks/use-match-socket";
import { useMatchStore } from "../store/match-store";

export function ScorerPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const loadScorecard = useMatchStore((state) => state.loadScorecard);
  const scorecard = useMatchStore((state) => state.scorecard);
  const loading = useMatchStore((state) => state.loading);

  useMatchSocket(matchId);

  useEffect(() => {
    if (matchId) {
      void loadScorecard(matchId);
    }
  }, [loadScorecard, matchId]);

  return (
    <div className="grid gap-4">
      <Link to="/matches">
        <Button variant="ghost">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Matches
        </Button>
      </Link>
      {scorecard ? (
        <ScorerPanel />
      ) : loading ? (
        <Card className="p-6">
          <LoadingSpinner label="Loading scorer..." />
        </Card>
      ) : null}
    </div>
  );
}
