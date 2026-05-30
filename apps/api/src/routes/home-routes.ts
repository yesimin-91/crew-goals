import type { FastifyInstance } from "fastify";

import { createHomeEntryService } from "../modules/home/home-entry-service.js";
import type { MockScenario } from "../mock/crew-goals-mock-data.js";
import type { CrewGoalsReadRepository } from "../repositories/crew-goals-read-repository.js";
import { resolveMockScenario } from "../repositories/mock-crew-goals-read-repository.js";

export async function registerHomeRoutes(
  app: FastifyInstance,
  createRepository: (scenario?: MockScenario) => CrewGoalsReadRepository
) {
  app.get("/api/home-entry", async (request) => {
    const { scenario } = request.query as { scenario?: string };
    const repository = createRepository(
      scenario ? resolveMockScenario(scenario) : undefined
    );

    return createHomeEntryService(repository).getHomeEntry();
  });
}
