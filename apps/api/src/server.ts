import cors from "@fastify/cors";
import Fastify from "fastify";

import { createDatabase } from "../../../packages/db/src/index.js";
import type { MockScenario } from "./mock/crew-goals-mock-data.js";
import type {
  CrewGoalsReadRepository,
  CrewGoalsWriteRepository
} from "./repositories/crew-goals-read-repository.js";
import { MockCrewGoalsReadRepository } from "./repositories/mock-crew-goals-read-repository.js";
import {
  seedCrewGoalsReadData,
  SqliteCrewGoalsReadRepository
} from "./repositories/sqlite-crew-goals-read-repository.js";
import { registerGoalRoutes } from "./routes/goals-routes.js";
import { registerContributionRoutes } from "./routes/contributions-routes.js";
import { registerHomeRoutes } from "./routes/home-routes.js";
import { registerInviteRoutes } from "./routes/invites-routes.js";

export function createServer(
  options: {
    now?: () => Date;
    database?: ReturnType<typeof createDatabase>;
    seedDemoData?: boolean;
  } = {}
) {
  const app = Fastify({
    logger: true
  });

  const database = options.database ?? createDatabase();
  if (options.seedDemoData !== false) {
    seedCrewGoalsReadData(database.sqlite, options.now?.() ?? new Date());
  }
  const createDbRepository = (): CrewGoalsWriteRepository => {
    return new SqliteCrewGoalsReadRepository(database.sqlite, {
      now: options.now?.() ?? new Date()
    });
  };

  const createReadRepository = (scenario?: MockScenario): CrewGoalsReadRepository => {
    if (scenario) {
      return new MockCrewGoalsReadRepository({
        now: options.now?.() ?? new Date(),
        scenario
      });
    }

    return new SqliteCrewGoalsReadRepository(database.sqlite, {
      now: options.now?.() ?? new Date()
    });
  };

  void app.register(cors, {
    origin: true
  });

  app.get("/api/health", async () => ({
    ok: true,
    service: "crew-goals-api",
    database: database.meta.file
  }));

  void registerHomeRoutes(app, createReadRepository);
  void registerGoalRoutes(app, createReadRepository, createDbRepository);
  void registerContributionRoutes(app, createDbRepository);
  void registerInviteRoutes(app, createReadRepository, createDbRepository);

  return app;
}
