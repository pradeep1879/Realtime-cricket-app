import { Elysia, t } from "elysia";

import {
  addBallController,
  createMatchController,
  createLeagueController,
  createTeamController,
  deleteMatchController,
  leagueController,
  listLeaguesController,
  listMatchesController,
  scorecardController,
  selectPlayersController,
  startMatchController,
  tossController,
  undoLastBallController
} from "../controllers/match.controller";
import { requireAdmin } from "../utils/auth";

const matchIdParams = {
  params: t.Object({
    id: t.String()
  })
};

export const matchRoutes = new Elysia({ prefix: "/api" })
  .get("/leagues", listLeaguesController)
  .get("/league/:id", leagueController, matchIdParams)
  .post("/league", createLeagueController, {
    beforeHandle: requireAdmin
  })
  .post("/team", createTeamController, {
    beforeHandle: requireAdmin
  })
  .get("/matches", listMatchesController)
  .post("/match", createMatchController, {
    beforeHandle: requireAdmin
  })
  .post("/match/:id/toss", tossController, {
    ...matchIdParams,
    beforeHandle: requireAdmin
  })
  .post("/match/:id/start", startMatchController, {
    ...matchIdParams,
    beforeHandle: requireAdmin
  })
  .post("/match/:id/select-players", selectPlayersController, {
    ...matchIdParams,
    beforeHandle: requireAdmin
  })
  .post("/match/:id/ball", addBallController, {
    ...matchIdParams,
    beforeHandle: requireAdmin
  })
  .post("/match/:id/ball/undo", undoLastBallController, {
    ...matchIdParams,
    beforeHandle: requireAdmin
  })
  .delete("/match/:id", deleteMatchController, {
    ...matchIdParams,
    beforeHandle: requireAdmin
  })
  .get("/match/:id/scorecard", scorecardController, matchIdParams);
