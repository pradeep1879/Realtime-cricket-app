import { z } from "zod";

import { createAdminToken, verifyAdminPin, verifyAdminToken } from "../services/auth.service";

const loginSchema = z.object({
  pin: z.string().min(1)
});

export async function adminLoginController({ body }: { body: unknown }) {
  const { pin } = loginSchema.parse(body);

  if (!verifyAdminPin(pin)) {
    throw new Error("Invalid scorer PIN");
  }

  return createAdminToken();
}

export async function adminVerifyController({
  headers
}: {
  headers: Record<string, string | undefined>;
}) {
  const authorization = headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token || !verifyAdminToken(token)) {
    throw new Error("Invalid or expired admin token");
  }

  return { ok: true };
}
