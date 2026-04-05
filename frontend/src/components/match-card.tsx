import { motion } from "framer-motion";
import { ArrowRight, Trash2, Radio } from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { StatusBadge } from "./status-badge";
import { mapStatus, type MatchListItem } from "../store/match-store";

type MatchCardProps = {
  match: MatchListItem;
  isAdmin?: boolean;
  onDelete?: (matchId: string) => void;
};

export function MatchCard({ match, isAdmin = false, onDelete }: MatchCardProps) {
  const uiStatus = mapStatus(match.status);

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <Card className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.24em] text-accent">Match</p>
            {match.round ? (
              <p className="m-0 mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                {match.round}
              </p>
            ) : null}
            <h3 className="m-0 mt-2 text-xl font-bold">{match.title}</h3>
          </div>
          <StatusBadge status={uiStatus} />
        </div>

        <Link to={`/match/${match.id}`} className="mt-5 block">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="m-0 text-sm text-muted-foreground">
                {match.summary
                  ? `${match.summary.battingTeamName} ${match.summary.score}/${match.summary.wickets}`
                  : "Score pending"}
              </p>
              <p className="m-0 mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {match.summary ? `Overs ${match.summary.overs}` : `${match.totalOvers} overs`}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>

        {match.result ? <p className="m-0 mt-4 text-sm text-sky-200">{match.result}</p> : null}

        {isAdmin ? (
          <div className="mt-4 flex gap-2">
            <Link to={`/scorer/${match.id}`} className="flex-1">
              <Button className="w-full" variant="secondary">
                <Radio className="mr-2 h-4 w-4" />
                Open Scorer
              </Button>
            </Link>
            <Button
              variant="danger"
              onClick={() => onDelete?.(match.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}
