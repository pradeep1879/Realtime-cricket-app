import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../utils/env";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", env.adminAuthSecret).update(payload).digest("base64url");
}

export function verifyAdminPin(pin: string) {
  return pin === env.adminPin;
}

export function createAdminToken() {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = encode(
    JSON.stringify({
      role: "admin",
      exp: expiresAt
    })
  );
  const signature = sign(payload);

  return {
    token: `${payload}.${signature}`,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

export function verifyAdminToken(token: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expected = sign(payload);

  if (
    Buffer.byteLength(signature) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return false;
  }

  const decoded = JSON.parse(decode(payload)) as { role: string; exp: number };

  return decoded.role === "admin" && decoded.exp > Date.now();
}
