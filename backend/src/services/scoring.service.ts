import {
  ExtraType,
  LeagueStatus,
  MatchStatus,
  Prisma,
  TossDecision,
  WicketType
} from "@prisma/client";

import { matchGateway } from "../sockets/match.gateway";
import { prisma } from "../utils/prisma";
import {
  buildScorecard,
  matchScorecardInclude,
  rotationRunsFromBall,
  teamRunsFromBall
} from "./scorecard.service";

type MatchContext = Prisma.MatchGetPayload<typeof matchScorecardInclude>;

export type CreateMatchInput = {
  leagueId: string;
  round?: string;
  totalOvers: number;
  teamA: {
    logoUrl?: string;
    name: string;
    players: Array<{ name: string }>;
  };
  teamB: {
    logoUrl?: string;
    name: string;
    players: Array<{ name: string }>;
  };
};

export type CreateLeagueInput = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status?: LeagueStatus;
};

export type CreateTeamInput = {
  leagueId: string;
  name: string;
  logoUrl?: string;
  players: Array<{ name: string }>;
};

export type TossInput = {
  tossWinnerId: string;
  tossDecision: TossDecision;
};

export type SelectPlayersInput = {
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
};

export type AddBallInput = {
  clientEventId?: string;
  batsmanId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extras?: number;
  overthrowRuns?: number;
  extraType?: ExtraType;
  isWicket?: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  incomingBatsmanId?: string;
  isDead?: boolean;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function isLegalDelivery(extraType: ExtraType, isDead: boolean) {
  if (isDead) {
    return false;
  }

  return extraType !== ExtraType.WIDE && extraType !== ExtraType.NO_BALL;
}

function compareByCreatedAt<T extends { createdAt: Date }>(left: T, right: T) {
  return left.createdAt.getTime() - right.createdAt.getTime();
}

async function getMatchOrThrow(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    ...matchScorecardInclude
  });

  assert(match, "Match not found");
  return match;
}

async function getLeagueOrThrow(leagueId: string) {
  const league = await prisma.league.findUnique({
    where: {
      id: leagueId
    },
    include: {
      teams: {
        include: {
          players: true
        }
      },
      matches: {
        orderBy: {
          createdAt: "desc"
        },
        ...matchScorecardInclude
      }
    }
  });

  assert(league, "League not found");
  return league;
}

function currentInningsFromMatch(match: MatchContext) {
  return match.innings.find((innings) => innings.inningsNumber === match.currentInnings) ?? null;
}

function totalRunsFromBalls(balls: Array<{ runs: number; extras: number; overthrowRuns: number; isDead: boolean }>) {
  return balls.reduce((sum, ball) => sum + teamRunsFromBall(ball), 0);
}

function validatePlayerBelongs(teamPlayers: Array<{ id: string }>, playerId: string, label: string) {
  assert(teamPlayers.some((player) => player.id === playerId), `${label} does not belong to the selected team`);
}

function openingTeams(match: MatchContext) {
  assert(match.tossWinnerId && match.tossDecision, "Toss must be completed before starting the match");

  const tossWinnerIsTeamA = match.tossWinnerId === match.teamAId;
  const tossWinnerTeam = tossWinnerIsTeamA ? match.teamA : match.teamB;
  const tossLoserTeam = tossWinnerIsTeamA ? match.teamB : match.teamA;

  if (match.tossDecision === TossDecision.BAT) {
    return {
      battingTeam: tossWinnerTeam,
      bowlingTeam: tossLoserTeam
    };
  }

  return {
    battingTeam: tossLoserTeam,
    bowlingTeam: tossWinnerTeam
  };
}

function secondInningsTeams(match: MatchContext) {
  const first = match.innings.find((innings) => innings.inningsNumber === 1);
  assert(first, "First innings not found");

  const battingTeam = first.bowlingTeam;
  const bowlingTeam = first.battingTeam;

  return {
    battingTeam,
    bowlingTeam
  };
}

function overState(
  balls: Array<{
    overNumber: number;
    bowlerId: string;
    isLegal: boolean;
    isDead: boolean;
  }>
) {
  const effectiveBalls = balls.filter((ball) => !ball.isDead);
  const legalBalls = effectiveBalls.filter((ball) => ball.isLegal).length;
  const currentOverNumber = Math.floor(legalBalls / 6) + 1;
  const currentOverBalls = effectiveBalls.filter((ball) => ball.overNumber === currentOverNumber);

  return {
    legalBalls,
    currentOverNumber,
    nextBallNumber: currentOverBalls.length + 1
  };
}

function nextStateFromBall({
  strikerId,
  nonStrikerId,
  incomingBatsmanId,
  dismissedPlayerId,
  isWicket,
  runsForRotation,
  overEnded,
  wicketsAfterBall,
  maxWickets
}: {
  strikerId: string | null;
  nonStrikerId: string | null;
  incomingBatsmanId?: string | null;
  dismissedPlayerId?: string | null;
  isWicket: boolean;
  runsForRotation: number;
  overEnded: boolean;
  wicketsAfterBall: number;
  maxWickets: number;
}) {
  let nextStriker = strikerId;
  let nextNonStriker = nonStrikerId;

  if (runsForRotation % 2 === 1) {
    [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
  }

  if (isWicket) {
    assert(dismissedPlayerId, "dismissedPlayerId is required when wicket falls");
    const inningsOverFromWicket = wicketsAfterBall >= maxWickets;

    if (dismissedPlayerId === nextStriker) {
      assert(incomingBatsmanId || inningsOverFromWicket, "incomingBatsmanId is required after wicket");
      nextStriker = incomingBatsmanId ?? null;
    } else if (dismissedPlayerId === nextNonStriker) {
      assert(incomingBatsmanId || inningsOverFromWicket, "incomingBatsmanId is required after wicket");
      nextNonStriker = incomingBatsmanId ?? null;
    } else {
      throw new Error("dismissedPlayerId must match striker or non-striker");
    }
  }

  if (overEnded) {
    [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
  }

  return {
    strikerId: nextStriker,
    nonStrikerId: nextNonStriker
  };
}

function targetReached(match: MatchContext, inningsNumber: number, currentRuns: number) {
  if (inningsNumber !== 2) {
    return false;
  }

  const firstInnings = match.innings.find((innings) => innings.inningsNumber === 1);
  assert(firstInnings, "First innings must exist before second innings scoring");

  const target = totalRunsFromBalls(firstInnings.balls) + 1;
  return currentRuns >= target;
}

function matchStatusAfterInnings(inningsNumber: number) {
  return inningsNumber === 1 ? MatchStatus.INNINGS_BREAK : MatchStatus.COMPLETED;
}

async function scorecardAndBroadcast(matchId: string, event: "match:start" | "score:update") {
  const match = await getMatchOrThrow(matchId);
  const scorecard = buildScorecard(match);

  matchGateway.emit(matchId, {
    event,
    data: scorecard
  });

  return scorecard;
}

export async function createMatch(input: CreateMatchInput) {
  const league = await prisma.league.findUnique({
    where: {
      id: input.leagueId
    }
  });

  assert(league, "leagueId is invalid");
  assert(input.totalOvers > 0, "totalOvers must be greater than zero");
  assert(input.teamA.players.length >= 2, "Team A must have at least two players");
  assert(input.teamB.players.length >= 2, "Team B must have at least two players");

  const ensureTeam = async (team: CreateMatchInput["teamA"]) => {
    let existing = await prisma.team.findFirst({
      where: {
        leagueId: input.leagueId,
        name: team.name
      },
      include: {
        players: true
      }
    });

    if (!existing) {
      return prisma.team.create({
        data: {
          leagueId: input.leagueId,
          name: team.name,
          logoUrl: team.logoUrl,
          players: {
            create: team.players.map((player) => ({
              name: player.name
            }))
          }
        },
        include: {
          players: true
        }
      });
    }

    const existingNames = new Set(existing.players.map((player) => player.name.toLowerCase()));
    const missingPlayers = team.players.filter(
      (player) => !existingNames.has(player.name.toLowerCase())
    );

    if (missingPlayers.length === 0 && (!team.logoUrl || team.logoUrl === existing.logoUrl)) {
      return existing;
    }

    existing = await prisma.team.update({
      where: {
        id: existing.id
      },
      data: {
        logoUrl: team.logoUrl ?? existing.logoUrl,
        players: {
          create: missingPlayers.map((player) => ({
            name: player.name
          }))
        }
      },
      include: {
        players: true
      }
    });

    return existing;
  };

  const teamA = await ensureTeam(input.teamA);
  const teamB = await ensureTeam(input.teamB);

  const match = await prisma.match.create({
    data: {
      leagueId: input.leagueId,
      round: input.round?.trim() ? input.round.trim() : null,
      totalOvers: input.totalOvers,
      teamAId: teamA.id,
      teamBId: teamB.id
    },
    ...matchScorecardInclude
  });

  return buildScorecard(match);
}

export async function createTeam(input: CreateTeamInput) {
  await getLeagueOrThrow(input.leagueId);
  assert(input.players.length >= 2, "Team must have at least two players");

  const existing = await prisma.team.findFirst({
    where: {
      leagueId: input.leagueId,
      name: input.name
    }
  });

  assert(!existing, "A team with this name already exists in the selected league");

  const team = await prisma.team.create({
    data: {
      leagueId: input.leagueId,
      name: input.name,
      logoUrl: input.logoUrl,
      players: {
        create: input.players.map((player) => ({
          name: player.name
        }))
      }
    },
    include: {
      players: true
    }
  });

  return {
    id: team.id,
    name: team.name,
    logoUrl: team.logoUrl,
    players: team.players.map((player) => ({
      id: player.id,
      name: player.name
    }))
  };
}

export async function createLeague(input: CreateLeagueInput) {
  const league = await prisma.league.create({
    data: {
      name: input.name,
      location: input.location,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      status: input.status ?? LeagueStatus.UPCOMING
    },
    include: {
      teams: {
        include: {
          players: true
        }
      },
      matches: {
        ...matchScorecardInclude
      }
    }
  });

  return {
    id: league.id,
    name: league.name,
    location: league.location,
    startDate: league.startDate,
    endDate: league.endDate,
    status: league.status,
    teamsCount: league.teams.length,
    matchesCount: league.matches.length
  };
}

export async function listLeagues() {
  const leagues = await prisma.league.findMany({
    orderBy: {
      startDate: "desc"
    },
    include: {
      teams: true,
      matches: true
    }
  });

  return leagues.map((league) => ({
    id: league.id,
    name: league.name,
    location: league.location,
    startDate: league.startDate,
    endDate: league.endDate,
    status: league.status,
    teamsCount: league.teams.length,
    matchesCount: league.matches.length
  }));
}

export async function fetchLeague(leagueId: string) {
  const league = await getLeagueOrThrow(leagueId);

  const matches = league.matches.map((match) => {
    const scorecard = buildScorecard(match as unknown as MatchContext);
    return {
      id: scorecard.matchId,
      title: `${scorecard.teams.teamA.name} vs ${scorecard.teams.teamB.name}`,
      round: scorecard.round,
      status: scorecard.status,
      totalOvers: scorecard.totalOvers,
      teams: scorecard.teams,
      currentInningsNumber: scorecard.currentInningsNumber,
      toss: scorecard.toss,
      result: scorecard.result,
      summary: scorecard.currentInnings
        ? {
            battingTeamId: scorecard.currentInnings.battingTeam.id,
            battingTeamName: scorecard.currentInnings.battingTeam.name,
            score: scorecard.currentInnings.totalRuns,
            wickets: scorecard.currentInnings.wickets,
            overs: scorecard.currentInnings.overs
          }
        : null
    };
  });

  return {
    id: league.id,
    name: league.name,
    location: league.location,
    startDate: league.startDate,
    endDate: league.endDate,
    status: league.status,
    teams: league.teams.map((team) => ({
      id: team.id,
      name: team.name,
      logoUrl: team.logoUrl,
      players: team.players.map((player) => ({
        id: player.id,
        name: player.name
      }))
    })),
    matches
  };
}

export async function doToss(matchId: string, input: TossInput) {
  const match = await getMatchOrThrow(matchId);
  assert(match.status === MatchStatus.CREATED, "Toss can only be completed for a newly created match");
  assert(
    input.tossWinnerId === match.teamAId || input.tossWinnerId === match.teamBId,
    "tossWinnerId must be one of the two match teams"
  );

  await prisma.match.update({
    where: { id: matchId },
    data: {
      tossWinnerId: input.tossWinnerId,
      tossDecision: input.tossDecision,
      status: MatchStatus.TOSS_DONE
    }
  });

  return buildScorecard(await getMatchOrThrow(matchId));
}

export async function startMatch(matchId: string) {
  const match = await getMatchOrThrow(matchId);
  const firstInnings = match.innings.find((innings) => innings.inningsNumber === 1) ?? null;
  const secondInnings = match.innings.find((innings) => innings.inningsNumber === 2) ?? null;

  if (match.status === MatchStatus.TOSS_DONE || (match.status === MatchStatus.INNINGS_1 && firstInnings)) {
    if (firstInnings) {
      return scorecardAndBroadcast(matchId, "match:start");
    }

    const { battingTeam, bowlingTeam } = openingTeams(match);

    await prisma.$transaction([
      prisma.innings.create({
        data: {
          matchId,
          inningsNumber: 1,
          battingTeamId: battingTeam.id,
          bowlingTeamId: bowlingTeam.id,
          startedAt: new Date()
        }
      }),
      prisma.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.INNINGS_1,
          currentInnings: 1
        }
      })
    ]);

    return scorecardAndBroadcast(matchId, "match:start");
  }

  if (
    match.status === MatchStatus.INNINGS_BREAK ||
    (match.status === MatchStatus.INNINGS_2 && secondInnings) ||
    (firstInnings?.isCompleted && !secondInnings && match.status !== MatchStatus.COMPLETED)
  ) {
    if (secondInnings) {
      if (match.status !== MatchStatus.INNINGS_2) {
        await prisma.match.update({
          where: { id: matchId },
          data: {
            status: MatchStatus.INNINGS_2,
            currentInnings: 2
          }
        });
      }

      return scorecardAndBroadcast(matchId, "match:start");
    }

    const { battingTeam, bowlingTeam } = secondInningsTeams(match);

    await prisma.$transaction([
      prisma.innings.create({
        data: {
          matchId,
          inningsNumber: 2,
          battingTeamId: battingTeam.id,
          bowlingTeamId: bowlingTeam.id,
          startedAt: new Date()
        }
      }),
      prisma.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.INNINGS_2,
          currentInnings: 2
        }
      })
    ]);

    return scorecardAndBroadcast(matchId, "match:start");
  }

  throw new Error("Match cannot be started in the current state");
}

export async function selectPlayers(matchId: string, input: SelectPlayersInput) {
  const match = await getMatchOrThrow(matchId);
  assert(
    match.status === MatchStatus.INNINGS_1 || match.status === MatchStatus.INNINGS_2,
    "Player selection is only available during a live innings"
  );

  const innings = currentInningsFromMatch(match);
  assert(innings, "Active innings not found");
  assert(!innings.isCompleted, "Cannot select players for a completed innings");
  assert(input.strikerId !== input.nonStrikerId, "Striker and non-striker must be different players");

  validatePlayerBelongs(innings.battingTeam.players, input.strikerId, "Striker");
  validatePlayerBelongs(innings.battingTeam.players, input.nonStrikerId, "Non-striker");
  validatePlayerBelongs(innings.bowlingTeam.players, input.bowlerId, "Bowler");

  if (!innings.currentBowlerId && innings.lastOverBowlerId) {
    assert(input.bowlerId !== innings.lastOverBowlerId, "Bowler cannot bowl consecutive overs");
  }

  const hasBalls = innings.balls.some((ball) => !ball.isDead);

  await prisma.innings.update({
    where: { id: innings.id },
    data: {
      openingStrikerId: hasBalls ? innings.openingStrikerId : input.strikerId,
      openingNonStrikerId: hasBalls ? innings.openingNonStrikerId : input.nonStrikerId,
      openingBowlerId: hasBalls ? innings.openingBowlerId : input.bowlerId,
      strikerId: input.strikerId,
      nonStrikerId: input.nonStrikerId,
      currentBowlerId: input.bowlerId
    }
  });

  return buildScorecard(await getMatchOrThrow(matchId));
}

export async function addBall(matchId: string, input: AddBallInput) {
  const match = await getMatchOrThrow(matchId);
  assert(
    match.status === MatchStatus.INNINGS_1 || match.status === MatchStatus.INNINGS_2,
    "Match is not in a scorable innings state"
  );

  if (input.clientEventId) {
    const existing = await prisma.ball.findUnique({
      where: {
        clientEventId: input.clientEventId
      }
    });

    if (existing) {
      return buildScorecard(await getMatchOrThrow(matchId));
    }
  }

  const innings = currentInningsFromMatch(match);
  assert(innings, "Active innings not found");
  assert(!innings.isCompleted, "Cannot add a ball to a completed innings");
  assert(innings.strikerId && innings.nonStrikerId && innings.currentBowlerId, "Select striker, non-striker and bowler before scoring");

  validatePlayerBelongs(innings.battingTeam.players, input.batsmanId, "Batsman");
  validatePlayerBelongs(innings.battingTeam.players, input.nonStrikerId, "Non-striker");
  validatePlayerBelongs(innings.bowlingTeam.players, input.bowlerId, "Bowler");

  assert(input.batsmanId === innings.strikerId, "Only the active striker can face the next ball");
  assert(input.nonStrikerId === innings.nonStrikerId, "nonStrikerId must match the current non-striker");
  assert(input.bowlerId === innings.currentBowlerId, "bowlerId must match the selected current bowler");
  assert(input.runs >= 0 && input.runs <= 6, "runs must be between 0 and 6");

  const extras = input.extras ?? 0;
  const overthrowRuns = input.overthrowRuns ?? 0;
  const extraType = input.extraType ?? ExtraType.NONE;
  const isDead = input.isDead ?? false;
  const isWicket = input.isWicket ?? false;
  const isLegal = isLegalDelivery(extraType, isDead);

  assert(extras >= 0, "extras must be zero or greater");
  assert(overthrowRuns >= 0, "overthrowRuns must be zero or greater");

  if (extraType === ExtraType.WIDE || extraType === ExtraType.NO_BALL) {
    assert(extras >= 1, `${extraType} must carry at least one extra run`);
  }

  if (isWicket) {
    assert(input.wicketType, "wicketType is required when isWicket is true");
    assert(input.dismissedPlayerId, "dismissedPlayerId is required when isWicket is true");

    if (extraType === ExtraType.NO_BALL) {
      assert(input.wicketType === WicketType.RUN_OUT, "Only run-out is allowed on a no-ball");
    }
  }

  if (input.incomingBatsmanId) {
    validatePlayerBelongs(innings.battingTeam.players, input.incomingBatsmanId, "Incoming batsman");
  }

  const balls = [...innings.balls].sort(compareByCreatedAt);
  const { legalBalls, currentOverNumber, nextBallNumber } = overState(balls);
  const wickets = balls.filter((ball) => ball.isWicket && !ball.isDead).length;
  const teamRunsBeforeBall = totalRunsFromBalls(balls);
  const maxWickets = innings.battingTeam.players.length - 1;

  const ball = await prisma.ball.create({
    data: {
      matchId,
      inningsId: innings.id,
      clientEventId: input.clientEventId,
      overNumber: currentOverNumber,
      ballNumber: nextBallNumber,
      batsmanId: input.batsmanId,
      nonStrikerId: input.nonStrikerId,
      bowlerId: input.bowlerId,
      incomingBatsmanId: input.incomingBatsmanId,
      dismissedPlayerId: isWicket ? input.dismissedPlayerId : undefined,
      runs: input.runs,
      extras,
      overthrowRuns,
      extraType,
      isWicket,
      wicketType: isWicket ? input.wicketType : undefined,
      isLegal,
      isDead
    }
  });

  const legalBallsAfterBall = legalBalls + (isLegal ? 1 : 0);
  const wicketsAfterBall = wickets + (isWicket && !isDead ? 1 : 0);
  const overEnded = isLegal && legalBallsAfterBall % 6 === 0;
  const runsForRotation = rotationRunsFromBall(ball);
  const nextLineup = nextStateFromBall({
    strikerId: innings.strikerId,
    nonStrikerId: innings.nonStrikerId,
    incomingBatsmanId: input.incomingBatsmanId,
    dismissedPlayerId: input.dismissedPlayerId,
    isWicket,
    runsForRotation,
    overEnded,
    wicketsAfterBall,
    maxWickets
  });

  const inningsRunsAfterBall = teamRunsBeforeBall + teamRunsFromBall(ball);
  const inningsCompleted =
    wicketsAfterBall >= maxWickets ||
    legalBallsAfterBall >= match.totalOvers * 6 ||
    targetReached(match, innings.inningsNumber, inningsRunsAfterBall);

  await prisma.$transaction([
    prisma.innings.update({
      where: { id: innings.id },
      data: {
        strikerId: inningsCompleted ? null : nextLineup.strikerId,
        nonStrikerId: inningsCompleted ? null : nextLineup.nonStrikerId,
        currentBowlerId: inningsCompleted ? null : overEnded ? null : input.bowlerId,
        lastOverBowlerId: overEnded ? input.bowlerId : innings.lastOverBowlerId,
        isCompleted: inningsCompleted,
        completedAt: inningsCompleted ? new Date() : null
      }
    }),
    prisma.match.update({
      where: { id: matchId },
      data: inningsCompleted
        ? {
            status: matchStatusAfterInnings(innings.inningsNumber),
            currentInnings: innings.inningsNumber,
            updatedAt: new Date()
          }
        : {}
    })
  ]);

  if (inningsCompleted && innings.inningsNumber === 2) {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.COMPLETED
      }
    });
  }

  return scorecardAndBroadcast(matchId, "score:update");
}

async function recomputeAfterUndo(matchId: string, deletedBallBowlerId?: string) {
  const match = await getMatchOrThrow(matchId);
  const innings = currentInningsFromMatch(match) ?? match.innings.at(-1);
  assert(innings, "No innings found");

  const orderedBalls = [...innings.balls].sort(compareByCreatedAt);
  const effectiveBalls = orderedBalls.filter((ball) => !ball.isDead);
  const legalBalls = effectiveBalls.filter((ball) => ball.isLegal).length;
  const currentOverNumber = Math.floor(legalBalls / 6) + 1;
  const currentOverBalls = effectiveBalls.filter((ball) => ball.overNumber === currentOverNumber);
  const lastBall = orderedBalls.at(-1) ?? null;
  const wickets = effectiveBalls.filter((ball) => ball.isWicket).length;
  const inningsRuns = totalRunsFromBalls(orderedBalls);
  const maxWickets = innings.battingTeam.players.length - 1;
  const inningsCompleted =
    wickets >= maxWickets ||
    legalBalls >= match.totalOvers * 6 ||
    targetReached(match, innings.inningsNumber, inningsRuns);

  let strikerId = innings.openingStrikerId;
  let nonStrikerId = innings.openingNonStrikerId;

  for (const ball of orderedBalls) {
    const priorWickets = orderedBalls
      .filter((entry) => entry.createdAt <= ball.createdAt && entry.id !== ball.id && entry.isWicket && !entry.isDead)
      .length;
    const next = nextStateFromBall({
      strikerId,
      nonStrikerId,
      incomingBatsmanId: ball.incomingBatsmanId,
      dismissedPlayerId: ball.dismissedPlayerId ?? undefined,
      isWicket: ball.isWicket,
      runsForRotation: rotationRunsFromBall(ball),
      overEnded: ball.isLegal && orderedBalls.filter((entry) => entry.isLegal && !entry.isDead && entry.createdAt <= ball.createdAt).length % 6 === 0,
      wicketsAfterBall: priorWickets + (ball.isWicket && !ball.isDead ? 1 : 0),
      maxWickets
    });

    strikerId = next.strikerId;
    nonStrikerId = next.nonStrikerId;
  }

  const nextBowlerId = inningsCompleted
    ? null
    : currentOverBalls.length > 0
      ? currentOverBalls[0]?.bowlerId ?? null
      : deletedBallBowlerId ?? innings.openingBowlerId;

  const lastOverBowlerId =
    legalBalls > 0 && legalBalls % 6 === 0
      ? lastBall?.bowlerId ?? innings.lastOverBowlerId
      : currentOverNumber > 1
        ? orderedBalls
            .filter((ball) => ball.overNumber === currentOverNumber - 1)
            .at(-1)?.bowlerId ?? innings.lastOverBowlerId
        : null;

  await prisma.innings.update({
    where: { id: innings.id },
    data: {
      strikerId: inningsCompleted ? null : strikerId,
      nonStrikerId: inningsCompleted ? null : nonStrikerId,
      currentBowlerId: nextBowlerId,
      lastOverBowlerId,
      isCompleted: inningsCompleted,
      completedAt: inningsCompleted ? innings.completedAt ?? new Date() : null
    }
  });

  if (innings.inningsNumber === 1) {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: inningsCompleted ? MatchStatus.INNINGS_BREAK : MatchStatus.INNINGS_1,
        currentInnings: 1
      }
    });
  } else {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: inningsCompleted ? MatchStatus.COMPLETED : MatchStatus.INNINGS_2,
        currentInnings: 2
      }
    });
  }
}

export async function undoLastBall(matchId: string) {
  const match = await getMatchOrThrow(matchId);
  const innings = currentInningsFromMatch(match) ?? match.innings.at(-1);
  assert(innings, "No innings found");

  const lastBall = [...innings.balls].sort(compareByCreatedAt).at(-1);
  assert(lastBall, "No ball available to undo");

  await prisma.ball.delete({
    where: {
      id: lastBall.id
    }
  });

  await recomputeAfterUndo(matchId, lastBall.bowlerId);
  return scorecardAndBroadcast(matchId, "score:update");
}

export async function fetchScorecard(matchId: string) {
  return buildScorecard(await getMatchOrThrow(matchId));
}

export async function listMatches() {
  const matches = await prisma.match.findMany({
    orderBy: {
      createdAt: "desc"
    },
    ...matchScorecardInclude
  });

  return matches.map((match) => {
    const scorecard = buildScorecard(match);
    const innings = scorecard.currentInnings ?? scorecard.innings.at(-1) ?? null;

    return {
      id: scorecard.matchId,
      title: `${scorecard.teams.teamA.name} vs ${scorecard.teams.teamB.name}`,
      round: scorecard.round,
      status: scorecard.status,
      league: scorecard.league,
      totalOvers: scorecard.totalOvers,
      teams: scorecard.teams,
      currentInningsNumber: scorecard.currentInningsNumber,
      toss: scorecard.toss,
      result: scorecard.result,
      summary: innings
        ? {
            battingTeamId: innings.battingTeam.id,
            battingTeamName: innings.battingTeam.name,
            score: innings.totalRuns,
            wickets: innings.wickets,
            overs: innings.overs
          }
        : null
    };
  });
}

export async function deleteMatch(matchId: string) {
  await prisma.match.delete({
    where: {
      id: matchId
    }
  });

  return {
    ok: true
  };
}
