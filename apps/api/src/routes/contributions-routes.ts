import type { FastifyInstance } from "fastify";

import type { ContributionSyncRequest } from "../../../../packages/shared/src/index.js";
import { createContributionService } from "../modules/contributions/contribution-service.js";
import type { CrewGoalsWriteRepository } from "../repositories/crew-goals-read-repository.js";

export async function registerContributionRoutes(
  app: FastifyInstance,
  createWriteRepository: () => CrewGoalsWriteRepository
) {
  app.get("/api/post-run/:activityId", async (request) => {
    const { activityId } = request.params as { activityId: string };
    return createWriteRepository().getPostRunContribution(activityId);
  });

  app.post("/api/contributions/sync", async (request, reply) => {
    const body = request.body as ContributionSyncRequest;

    if (
      !body?.activityId ||
      typeof body.distanceKm !== "number" ||
      !body.activityType ||
      !body.activitySource ||
      !body.activityEndTime
    ) {
      return reply.code(400).send({
        message: "activityId, distanceKm, activityType, activitySource, and activityEndTime are required"
      });
    }

    return createContributionService(createWriteRepository()).syncContribution(body);
  });
}
