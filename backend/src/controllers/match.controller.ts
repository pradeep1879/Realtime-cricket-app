import { ExtraType, LeagueStatus, TossDecision, WicketType } from "@prisma/client";
import { z } from "zod";

import {
  addBall,
  createMatch,
  createLeague,
  createTeam,
  deleteMatch,
  doToss,
  fetchLeague,
  fetchScorecard,
  listLeagues,
  listMatches,
  selectPlayers,
  startMatch,
  undoLastBall
} from "../services/scoring.service";

const playerSchema = z.object({
  name: z.string().min(1)
});

export const createMatchSchema = z.object({
  leagueId: z.string().min(1),
  round: z.string().min(1).optional(),
  totalOvers: z.number().int().positive(),
  teamA: z.object({
    name: z.string().min(1),
    logoUrl: z.string().url().optional(),
    players: z.array(playerSchema).min(2)
  }),
  teamB: z.object({
    name: z.string().min(1),
    logoUrl: z.string().url().optional(),
    players: z.array(playerSchema).min(2)
  })
});

export const createTeamSchema = z.object({
  leagueId: z.string().min(1),
  name: z.string().min(1),
  logoUrl: z.string().url().optional(),
  players: z.array(playerSchema).min(2)
});

export const createLeagueSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.nativeEnum(LeagueStatus).optional()
});

export const tossSchema = z.object({
  tossWinnerId: z.string().min(1),
  tossDecision: z.nativeEnum(TossDecision)
});

export const selectPlayersSchema = z.object({
  strikerId: z.string().min(1),
  nonStrikerId: z.string().min(1),
  bowlerId: z.string().min(1)
});

export const addBallSchema = z.object({
  clientEventId: z.string().min(1).optional(),
  batsmanId: z.string().min(1),
  nonStrikerId: z.string().min(1),
  bowlerId: z.string().min(1),
  runs: z.number().int().min(0).max(6),
  extras: z.number().int().min(0).optional(),
  overthrowRuns: z.number().int().min(0).optional(),
  extraType: z.nativeEnum(ExtraType).optional(),
  isWicket: z.boolean().optional(),
  wicketType: z.nativeEnum(WicketType).optional(),
  dismissedPlayerId: z.string().min(1).optional(),
  incomingBatsmanId: z.string().min(1).optional(),
  isDead: z.boolean().optional()
});

export async function createMatchController({ body }: { body: unknown }) {
  return createMatch(createMatchSchema.parse(body));
}

export async function createLeagueController({ body }: { body: unknown }) {
  return createLeague(createLeagueSchema.parse(body));
}

export async function createTeamController({ body }: { body: unknown }) {
  return createTeam(createTeamSchema.parse(body));
}

export async function tossController({ params, body }: { params: { id: string }; body: unknown }) {
  return doToss(params.id, tossSchema.parse(body));
}

export async function startMatchController({ params }: { params: { id: string } }) {
  return startMatch(params.id);
}

export async function selectPlayersController({
  params,
  body
}: {
  params: { id: string };
  body: unknown;
}) {
  return selectPlayers(params.id, selectPlayersSchema.parse(body));
}

export async function addBallController({ params, body }: { params: { id: string }; body: unknown }) {
  return addBall(params.id, addBallSchema.parse(body));
}

export async function undoLastBallController({ params }: { params: { id: string } }) {
  return undoLastBall(params.id);
}

export async function scorecardController({ params }: { params: { id: string } }) {
  return fetchScorecard(params.id);
}

export async function listMatchesController() {
  return listMatches();
}

export async function listLeaguesController() {
  return listLeagues();
}

export async function leagueController({ params }: { params: { id: string } }) {
  return fetchLeague(params.id);
}

export async function deleteMatchController({ params }: { params: { id: string } }) {
  return deleteMatch(params.id);
}
