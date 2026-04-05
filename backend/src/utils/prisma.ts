import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    log: ["warn", "error"]
  });

if (Bun.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
