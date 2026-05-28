import cors from "@fastify/cors";
import Fastify from "fastify";

import { buildEntryOverview } from "../../../packages/shared/src/index.js";
import { createDatabase } from "../../../packages/db/src/index.js";

export function createServer() {
  const app = Fastify({
    logger: true
  });

  const database = createDatabase();

  void app.register(cors, {
    origin: true
  });

  app.get("/api/health", async () => ({
    ok: true,
    service: "crew-goals-api",
    database: database.meta.file
  }));

  app.get("/api/home-entry", async () => buildEntryOverview());

  return app;
}
