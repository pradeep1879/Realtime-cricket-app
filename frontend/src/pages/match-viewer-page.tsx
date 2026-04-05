import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Radio } from "lucide-react";

import { ViewerScreen } from "../components/viewer-screen";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { useMatchSocket } from "../hooks/use-match-socket";
import { useMatchStore } from "../store/match-store";

export function MatchViewerPage() {
  const { id } = useParams<{ id: string }>();
  const loadScorecard = useMatchStore((state) => state.loadScorecard);
  const scorecard = useMatchStore((state) => state.scorecard);
  const isAdmin = useMatchStore((state) => state.isAdmin);
  const loading = useMatchStore((state) => state.loading);

  useMatchSocket(id);

  useEffect(() => {
    if (id) {
      void loadScorecard(id);
    }
  }, [id, loadScorecard]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-3">
        <Link to="/matches">
          <Button variant="ghost">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Button>
        </Link>
        {isAdmin && id ? (
          <Link to={`/scorer/${id}`}>
            <Button variant="secondary">
              <Radio className="mr-2 h-4 w-4" />
              Open Scorer
            </Button>
          </Link>
        ) : null}
      </div>
      {scorecard ? (
        <ViewerScreen />
      ) : loading ? (
        <Card className="p-6">
          <LoadingSpinner label="Loading match..." />
        </Card>
      ) : null}
    </div>
  );
}
