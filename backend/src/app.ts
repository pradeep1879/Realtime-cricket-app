import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

import { healthRoutes } from "./routes/health.routes";
import { matchRoutes } from "./routes/match.routes";
import { authRoutes } from "./routes/auth.routes";
import { apiPlugin } from "./utils/http";
import { env } from "./utils/env";
import { matchGateway } from "./sockets/match.gateway";

export function createApp() {
  const app = new Elysia()
    .use(
      cors({
        origin: env.corsOrigin,
        credentials: true
      })
    )
    .use(apiPlugin)
    .use(healthRoutes)
    .use(authRoutes)
    .use(matchRoutes)
    .ws("/ws", {
      open(ws) {
        const matchId = new URL(ws.data.request.url).searchParams.get("matchId");

        if (matchId) {
          matchGateway.subscribe(ws as never, matchId);
          ws.send(
            JSON.stringify({
              event: "socket:ready",
              data: { matchId }
            })
          );
        }
      },
      message(ws, message) {
        const payload =
          typeof message === "string"
            ? message
            : new TextDecoder().decode(message as ArrayBufferLike);
        const parsed = JSON.parse(payload) as { type?: string; matchId?: string };

        if (parsed?.type === "subscribe" && parsed.matchId) {
          matchGateway.subscribe(ws as never, parsed.matchId);
          ws.send(
            JSON.stringify({
              event: "socket:ready",
              data: { matchId: parsed.matchId }
            })
          );
        }
      },
      close(ws) {
        matchGateway.unsubscribe(ws as never);
      }
    })
    .get("/", () => ({
      service: "cricket-exchange-api",
      status: "running"
    }));

  return app.listen({
    port: env.port,
    idleTimeout: 60
  });
}
