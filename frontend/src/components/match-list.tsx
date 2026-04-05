import { MatchCard } from "./match-card";
import type { MatchListItem } from "../store/match-store";

type MatchListProps = {
  matches: MatchListItem[];
  isAdmin?: boolean;
  onDelete?: (matchId: string) => void;
};

export function MatchList({ matches, isAdmin = false, onDelete }: MatchListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} isAdmin={isAdmin} onDelete={onDelete} />
      ))}
    </div>
  );
}
