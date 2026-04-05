import {
  ExtraType,
  MatchStatus,
  Prisma,
  WicketType,
  type Ball,
  type Player,
  type Team
} from "@prisma/client";

export const matchScorecardInclude = Prisma.validator<Prisma.MatchDefaultArgs>()({
  include: {
    league: true,
    teamA: {
      include: {
        players: true
      }
    },
    teamB: {
      include: {
        players: true
      }
    },
    tossWinner: true,
    innings: {
      orderBy: {
        inningsNumber: "asc"
      },
      include: {
        battingTeam: {
          include: {
            players: true
          }
        },
        bowlingTeam: {
          include: {
            players: true
          }
        },
        striker: true,
        nonStriker: true,
        currentBowler: true,
        lastOverBowler: true,
        balls: {
          orderBy: {
            createdAt: "asc"
          },
          include: {
            batsman: true,
            nonStriker: true,
            bowler: true,
            dismissedPlayer: true,
            incomingBatsman: true
          }
        }
      }
    }
  }
});

export type MatchScorecardContext = Prisma.MatchGetPayload<typeof matchScorecardInclude>;

function formatOvers(legalBalls: number) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

function teamRunsFromBall(ball: Pick<Ball, "runs" | "extras" | "overthrowRuns" | "isDead">) {
  if (ball.isDead) {
    return 0;
  }

  return ball.runs + ball.extras + ball.overthrowRuns;
}

function batsmanRunsFromBall(
  ball: Pick<Ball, "runs" | "extraType" | "isDead">
) {
  if (ball.isDead) {
    return 0;
  }

  if (ball.extraType === ExtraType.WIDE || ball.extraType === ExtraType.BYE || ball.extraType === ExtraType.LEG_BYE) {
    return 0;
  }

  return ball.runs;
}

function rotationRunsFromBall(
  ball: Pick<Ball, "runs" | "extras" | "overthrowRuns" | "extraType" | "isDead">
) {
  if (ball.isDead) {
    return 0;
  }

  switch (ball.extraType) {
    case ExtraType.WIDE:
    case ExtraType.NO_BALL:
      return Math.max(ball.extras - 1, 0) + ball.runs + ball.overthrowRuns;
    case ExtraType.BYE:
    case ExtraType.LEG_BYE:
      return ball.extras + ball.overthrowRuns;
    default:
      return ball.runs + ball.overthrowRuns;
  }
}

function bowlerRunsFromBall(
  ball: Pick<Ball, "runs" | "extras" | "overthrowRuns" | "extraType" | "isDead">
) {
  if (ball.isDead) {
    return 0;
  }

  if (ball.extraType === ExtraType.BYE || ball.extraType === ExtraType.LEG_BYE) {
    return 0;
  }

  return ball.runs + ball.extras + ball.overthrowRuns;
}

function countsAsBatsmanBall(ball: Pick<Ball, "extraType" | "isDead">) {
  return !ball.isDead && ball.extraType !== ExtraType.WIDE;
}

function countsAsBowlerWicket(ball: Pick<Ball, "isWicket" | "wicketType">) {
  return ball.isWicket && ball.wicketType !== WicketType.RUN_OUT;
}

function playerSummary(player: Player) {
  return {
    id: player.id,
    name: player.name
  };
}

function teamSummary(team: Team & { players: Player[] }) {
  return {
    id: team.id,
    name: team.name,
    players: team.players.map(playerSummary)
  };
}

export function buildScorecard(match: MatchScorecardContext) {
  const inningsSummaries = match.innings.map((innings) => {
    const balls = innings.balls;
    const legalBalls = balls.filter((ball) => ball.isLegal && !ball.isDead).length;
    const totalRuns = balls.reduce((sum, ball) => sum + teamRunsFromBall(ball), 0);
    const wickets = balls.filter((ball) => ball.isWicket && !ball.isDead).length;

    const batsmenStats = innings.battingTeam.players.map((player) => {
      const playerBalls = balls.filter((ball) => ball.batsmanId === player.id);
      const runs = playerBalls.reduce((sum, ball) => sum + batsmanRunsFromBall(ball), 0);
      const ballsFaced = playerBalls.filter(countsAsBatsmanBall).length;
      const dismissedBall = balls.find((ball) => ball.dismissedPlayerId === player.id);

      return {
        playerId: player.id,
        name: player.name,
        runs,
        balls: ballsFaced,
        fours: playerBalls.filter((ball) => batsmanRunsFromBall(ball) === 4).length,
        sixes: playerBalls.filter((ball) => batsmanRunsFromBall(ball) === 6).length,
        strikeRate: ballsFaced ? Number(((runs / ballsFaced) * 100).toFixed(2)) : 0,
        isOut: Boolean(dismissedBall),
        dismissal: dismissedBall
          ? {
              wicketType: dismissedBall.wicketType,
              bowler: dismissedBall.bowler.name
            }
          : null
      };
    });

    const bowlerStats = innings.bowlingTeam.players
      .map((player) => {
        const playerBalls = balls.filter((ball) => ball.bowlerId === player.id);
        const legal = playerBalls.filter((ball) => ball.isLegal && !ball.isDead).length;
        const runsConceded = playerBalls.reduce((sum, ball) => sum + bowlerRunsFromBall(ball), 0);
        const wicketsTaken = playerBalls.filter(countsAsBowlerWicket).length;
        const maidens = new Set(
          playerBalls
            .filter((ball) => ball.isLegal && !ball.isDead)
            .map((ball) => ball.overNumber)
        );

        const maidenOvers = [...maidens].filter((overNumber) => {
          const overBalls = playerBalls.filter((ball) => ball.overNumber === overNumber);
          const legalInOver = overBalls.filter((ball) => ball.isLegal && !ball.isDead).length;
          const runsInOver = overBalls.reduce((sum, ball) => sum + bowlerRunsFromBall(ball), 0);
          return legalInOver === 6 && runsInOver === 0;
        }).length;

        return {
          playerId: player.id,
          name: player.name,
          overs: formatOvers(legal),
          maidens: maidenOvers,
          runsConceded,
          wickets: wicketsTaken,
          economy: legal ? Number((runsConceded / (legal / 6)).toFixed(2)) : 0
        };
      })
      .filter((player) => player.overs !== "0.0" || player.runsConceded > 0 || player.wickets > 0);

    const lastDismissalBall = [...balls]
      .filter((ball) => ball.isWicket && !ball.isDead && ball.dismissedPlayerId)
      .at(-1);
    const lastDismissedBatsman = lastDismissalBall
      ? batsmenStats.find((player) => player.playerId === lastDismissalBall.dismissedPlayerId) ?? null
      : null;
    const lastOverBowler = innings.lastOverBowler
      ? bowlerStats.find((player) => player.playerId === innings.lastOverBowlerId) ?? {
          playerId: innings.lastOverBowler.id,
          name: innings.lastOverBowler.name,
          overs: "0.0",
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          economy: 0
        }
      : null;

    const overSummaries = [...new Set(balls.map((ball) => ball.overNumber))]
      .sort((left, right) => left - right)
      .map((overNumber) => {
        const overBalls = balls.filter((ball) => ball.overNumber === overNumber);
        const legalInOver = overBalls.filter((ball) => ball.isLegal && !ball.isDead).length;
        const runs = overBalls.reduce((sum, ball) => sum + teamRunsFromBall(ball), 0);
        const wicketsInOver = overBalls.filter((ball) => ball.isWicket && !ball.isDead).length;

        return {
          overNumber,
          overLabel: `Over ${overNumber}`,
          runs,
          wickets: wicketsInOver,
          legalBalls: legalInOver
        };
      });

    const recentBalls = balls.slice(-12).map((ball) => ({
      id: ball.id,
      over: `${ball.overNumber}.${ball.ballNumber}`,
      runs: ball.runs,
      extras: ball.extras,
      overthrowRuns: ball.overthrowRuns,
      extraType: ball.extraType,
      isWicket: ball.isWicket,
      wicketType: ball.wicketType,
      isLegal: ball.isLegal,
      isDead: ball.isDead,
      teamRuns: teamRunsFromBall(ball),
      batsman: ball.batsman.name,
      nonStriker: ball.nonStriker.name,
      bowler: ball.bowler.name,
      dismissedPlayer: ball.dismissedPlayer?.name ?? null,
      incomingBatsman: ball.incomingBatsman?.name ?? null,
      statusText: ball.isDead
        ? "Dead ball"
        : ball.isWicket
          ? `${ball.wicketType?.replace(/_/g, " ") ?? "WICKET"}`
          : ball.extraType !== ExtraType.NONE
            ? `${ball.extraType.replace(/_/g, " ")} ${teamRunsFromBall(ball)}`
            : `${teamRunsFromBall(ball)} run${teamRunsFromBall(ball) === 1 ? "" : "s"}`,
      createdAt: ball.createdAt
    }));

    const extrasSummary = {
      wides: balls
        .filter((ball) => ball.extraType === ExtraType.WIDE && !ball.isDead)
        .reduce((sum, ball) => sum + ball.extras + ball.overthrowRuns + ball.runs, 0),
      noBalls: balls
        .filter((ball) => ball.extraType === ExtraType.NO_BALL && !ball.isDead)
        .reduce((sum, ball) => sum + ball.extras + ball.overthrowRuns + ball.runs, 0),
      byes: balls
        .filter((ball) => ball.extraType === ExtraType.BYE && !ball.isDead)
        .reduce((sum, ball) => sum + ball.extras + ball.overthrowRuns, 0),
      legByes: balls
        .filter((ball) => ball.extraType === ExtraType.LEG_BYE && !ball.isDead)
        .reduce((sum, ball) => sum + ball.extras + ball.overthrowRuns, 0)
    };

    return {
      inningsId: innings.id,
      inningsNumber: innings.inningsNumber,
      battingTeam: teamSummary(innings.battingTeam),
      bowlingTeam: teamSummary(innings.bowlingTeam),
      totalRuns,
      wickets,
      overs: formatOvers(legalBalls),
      legalBalls,
      activePlayers: {
        striker: innings.striker ? playerSummary(innings.striker) : null,
        nonStriker: innings.nonStriker ? playerSummary(innings.nonStriker) : null,
        bowler: innings.currentBowler ? playerSummary(innings.currentBowler) : null
      },
      batsmenStats,
      bowlerStats,
      overSummaries,
      lastDismissedBatsman: lastDismissedBatsman
        ? {
            playerId: lastDismissedBatsman.playerId,
            name: lastDismissedBatsman.name,
            runs: lastDismissedBatsman.runs,
            balls: lastDismissedBatsman.balls,
            fours: lastDismissedBatsman.fours,
            sixes: lastDismissedBatsman.sixes,
            strikeRate: lastDismissedBatsman.strikeRate,
            dismissal: lastDismissedBatsman.dismissal
          }
        : null,
      lastOverBowler: lastOverBowler
        ? {
            playerId: lastOverBowler.playerId,
            name: lastOverBowler.name,
            overs: lastOverBowler.overs,
            maidens: lastOverBowler.maidens,
            runsConceded: lastOverBowler.runsConceded,
            wickets: lastOverBowler.wickets,
            economy: lastOverBowler.economy
          }
        : null,
      extrasSummary,
      recentBalls,
      lastBall: recentBalls.at(-1) ?? null,
      isCompleted: innings.isCompleted
    };
  });

  const firstInnings = inningsSummaries.find((innings) => innings.inningsNumber === 1) ?? null;
  const secondInnings = inningsSummaries.find((innings) => innings.inningsNumber === 2) ?? null;
  const currentInnings =
    inningsSummaries.find((innings) => innings.inningsNumber === match.currentInnings) ?? null;
  const target =
    firstInnings &&
    (Boolean(secondInnings) || match.currentInnings === 2 || match.status === MatchStatus.COMPLETED)
      ? firstInnings.totalRuns + 1
      : null;

  let result: string | null = null;

  if (match.status === MatchStatus.COMPLETED && firstInnings && secondInnings) {
    if (secondInnings.totalRuns >= firstInnings.totalRuns + 1) {
      const wicketsRemaining = secondInnings.battingTeam.players.length - 1 - secondInnings.wickets;
      result = `${secondInnings.battingTeam.name} won by ${wicketsRemaining} wicket${wicketsRemaining === 1 ? "" : "s"}`;
    } else if (secondInnings.totalRuns === firstInnings.totalRuns) {
      result = "Match tied";
    } else {
      const margin = firstInnings.totalRuns - secondInnings.totalRuns;
      result = `${firstInnings.battingTeam.name} won by ${margin} run${margin === 1 ? "" : "s"}`;
    }
  }

  return {
    matchId: match.id,
    round: match.round,
    status: match.status,
    totalOvers: match.totalOvers,
    currentInningsNumber: match.currentInnings,
    toss: match.tossWinner
      ? {
          winnerTeamId: match.tossWinner.id,
          winnerTeamName: match.tossWinner.name,
          decision: match.tossDecision
        }
      : null,
    target,
    result,
    league: match.league
      ? {
          id: match.league.id,
          name: match.league.name,
          location: match.league.location,
          startDate: match.league.startDate,
          endDate: match.league.endDate,
          status: match.league.status
        }
      : null,
    teams: {
      teamA: teamSummary(match.teamA),
      teamB: teamSummary(match.teamB)
    },
    innings: inningsSummaries,
    currentInnings,
    summary: currentInnings
      ? {
          score: currentInnings.totalRuns,
          wickets: currentInnings.wickets,
          overs: currentInnings.overs,
          lastBall: currentInnings.lastBall,
          batsmenStats: currentInnings.batsmenStats,
          bowlerStats: currentInnings.bowlerStats
        }
      : null
  };
}

export {
  batsmanRunsFromBall,
  bowlerRunsFromBall,
  countsAsBatsmanBall,
  countsAsBowlerWicket,
  formatOvers,
  rotationRunsFromBall,
  teamRunsFromBall
};
