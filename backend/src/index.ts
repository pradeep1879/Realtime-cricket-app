import { prisma } from "./utils/prisma";
import { createApp } from "./app";
import { env } from "./utils/env";

async function bootstrap() {
  await prisma.$connect();

  const app = createApp();

  console.log(`Cricket Exchange API running on http://localhost:${env.port}`);

  const shutdown = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return app;
}

bootstrap().catch(async (error) => {
  console.error("Failed to start server", error);
  await prisma.$disconnect();
  process.exit(1);
});
