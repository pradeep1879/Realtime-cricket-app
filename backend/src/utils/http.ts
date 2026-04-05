import type { Elysia } from "elysia";

export function apiPlugin(app: Elysia) {
  return app.onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        message: "Validation failed",
        details: `${error}`
      };
    }

    if (!set.status || set.status === 200) {
      set.status = 500;
    }

    return {
      message: error instanceof Error ? error.message : "Internal server error"
    };
  });
}
