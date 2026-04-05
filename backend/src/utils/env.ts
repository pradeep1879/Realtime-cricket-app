const required = ["DATABASE_URL"] as const;

type RequiredEnvKey = (typeof required)[number];

function readEnv(key: RequiredEnvKey): string {
  const value = Bun.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const env = {
  port: Number(Bun.env.PORT ?? 4000),
  corsOrigin: Bun.env.CORS_ORIGIN ?? "http://localhost:5173",
  databaseUrl: readEnv("DATABASE_URL"),
  adminPin: Bun.env.ADMIN_PIN ?? "1234",
  adminAuthSecret: Bun.env.ADMIN_AUTH_SECRET ?? "change-me-super-secret"
};
