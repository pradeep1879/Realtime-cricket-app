import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "./ui/card";
import { StatusBadge } from "./status-badge";
import type { UiMatchStatus } from "../store/match-store";

type LeagueCardLeague = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  teamsCount: number;
  matchesCount: number;
};

type LeagueCardProps = {
  league: LeagueCardLeague;
  teamsCount: number;
};

function mapLeagueStatus(status: LeagueCardLeague["status"]): UiMatchStatus {
  if (status === "LIVE") return "LIVE";
  if (status === "COMPLETED") return "COMPLETED";
  return "SCHEDULED";
}

export function LeagueCard({ league, teamsCount }: LeagueCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.18 }}>
      <Link to={`/leagues/${league.id}`} className="block no-underline">
        <Card className="h-full p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 text-xs uppercase tracking-[0.24em] text-accent">League</p>
              <h3 className="m-0 mt-2 text-2xl font-bold text-white">{league.name}</h3>
            </div>
            <StatusBadge status={mapLeagueStatus(league.status)} />
          </div>

          <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {league.location}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {teamsCount} teams
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
