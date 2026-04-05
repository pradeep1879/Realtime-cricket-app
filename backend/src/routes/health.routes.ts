import { Elysia } from "elysia";

import { healthController } from "../controllers/health.controller";

export const healthRoutes = new Elysia({ prefix: "/api" }).get("/health", healthController);
