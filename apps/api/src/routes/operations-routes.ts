import type { FastifyInstance } from "fastify";

import type {
  CrewGoalAnalyticsEventRequest,
  CrewGoalNotificationPreviewRequest
} from "../../../../packages/shared/src/index.js";
import { createOperationsService } from "../modules/operations/operations-service.js";
import type { CrewGoalsReadRepository, CrewGoalsWriteRepository } from "../repositories/crew-goals-read-repository.js";

export async function registerOperationsRoutes(
  app: FastifyInstance,
  createReadRepository: () => CrewGoalsReadRepository,
  createWriteRepository: () => CrewGoalsWriteRepository
) {
  app.post("/api/analytics/events", async (request, reply) => {
    const body = request.body as CrewGoalAnalyticsEventRequest;

    if (!body?.eventName || !body?.source) {
      return reply.code(400).send({
        message: "eventName and source are required"
      });
    }

    return createOperationsService(createWriteRepository()).recordAnalyticsEvent(body);
  });

  app.post("/api/notifications/preview", async (request, reply) => {
    const body = request.body as CrewGoalNotificationPreviewRequest;

    if (!body?.trigger || !body?.goalId) {
      return reply.code(400).send({
        message: "trigger and goalId are required"
      });
    }

    try {
      return createOperationsService(createWriteRepository()).previewNotification(
        body,
        createReadRepository()
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Notification preview failed";
      return reply.code(404).send({ message });
    }
  });
}
