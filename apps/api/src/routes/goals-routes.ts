import type { FastifyInstance } from "fastify";

import type {
  CreateGoalRequest,
  GoalDistanceRecommendationRequest
} from "../../../../packages/shared/src/index.js";
import { createGoalService } from "../modules/goals/create-goal-service.js";
import { createGoalsService } from "../modules/goals/goals-service.js";
import { createRecommendationsService } from "../modules/recommendations/recommendations-service.js";
import type { MockScenario } from "../mock/crew-goals-mock-data.js";
import type {
  CrewGoalsReadRepository,
  CrewGoalsWriteRepository
} from "../repositories/crew-goals-read-repository.js";
import { resolveMockScenario } from "../repositories/mock-crew-goals-read-repository.js";

export async function registerGoalRoutes(
  app: FastifyInstance,
  createReadRepository: (scenario?: MockScenario) => CrewGoalsReadRepository,
  createWriteRepository: () => CrewGoalsWriteRepository
) {
  app.post("/api/recommendations/goal-distance", async (request, reply) => {
    const body = request.body as GoalDistanceRecommendationRequest;

    if (!Array.isArray(body?.selectedFriendIds)) {
      return reply.code(400).send({
        message: "selectedFriendIds must be provided"
      });
    }

    return createRecommendationsService().getGoalDistanceRecommendation(body);
  });

  app.post("/api/goals", async (request, reply) => {
    const body = request.body as CreateGoalRequest;

    if (!Array.isArray(body?.selectedFriendIds) || !body?.selectedTier) {
      return reply.code(400).send({
        message: "selectedFriendIds and selectedTier are required"
      });
    }

    try {
      return createGoalService(createWriteRepository()).createGoal(body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create goal";
      const code = error && typeof error === "object" ? (error as { code?: string }).code : undefined;
      const statusCode = code === "active_goal_conflict" ? 409 : 400;

      return reply.code(statusCode).send({
        message
      });
    }
  });

  app.get("/api/goals/active", async (request) => {
    const { scenario } = request.query as { scenario?: string };
    const repository = createReadRepository(
      scenario ? resolveMockScenario(scenario) : undefined
    );

    return createGoalsService(repository).getActiveGoal();
  });

  app.get("/api/goals/:goalId", async (request, reply) => {
    const { goalId } = request.params as { goalId: string };
    const { scenario } = request.query as { scenario?: string };
    const repository = createReadRepository(
      scenario ? resolveMockScenario(scenario) : undefined
    );
    const detail = createGoalsService(repository).getGoalDetail(goalId);

    if (!detail) {
      return reply.code(404).send({
        message: `Goal ${goalId} was not found`
      });
    }

    return detail;
  });

  app.get("/api/goals/:goalId/result", async (request, reply) => {
    const { goalId } = request.params as { goalId: string };
    const repository = createWriteRepository();
    const result = repository.getGoalResult(goalId);

    if (!result) {
      return reply.code(404).send({
        message: `Goal result ${goalId} was not found`
      });
    }

    return result;
  });
}
