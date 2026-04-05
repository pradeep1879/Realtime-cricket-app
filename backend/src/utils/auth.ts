import type { Context } from "elysia";

import { verifyAdminToken } from "../services/auth.service";

export function requireAdmin({ headers, set }: Pick<Context, "headers" | "set">) {
  const authorization = headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token || !verifyAdminToken(token)) {
    set.status = 401;
    throw new Error("Admin authorization required");
  }
}
