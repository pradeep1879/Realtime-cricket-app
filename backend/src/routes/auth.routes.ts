import { Elysia } from "elysia";

import { adminLoginController, adminVerifyController } from "../controllers/auth.controller";

export const authRoutes = new Elysia({ prefix: "/api/admin" })
  .post("/login", adminLoginController)
  .get("/verify", adminVerifyController);
