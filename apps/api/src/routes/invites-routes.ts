import type { FastifyInstance, FastifyReply } from "fastify";

import { createInviteActionsService } from "../modules/invites/invite-actions-service.js";
import { createInvitesService } from "../modules/invites/invites-service.js";
import type { MockScenario } from "../mock/crew-goals-mock-data.js";
import type {
  CrewGoalsReadRepository,
  CrewGoalsWriteRepository
} from "../repositories/crew-goals-read-repository.js";
import { resolveMockScenario } from "../repositories/mock-crew-goals-read-repository.js";

export async function registerInviteRoutes(
  app: FastifyInstance,
  createReadRepository: (scenario?: MockScenario) => CrewGoalsReadRepository,
  createWriteRepository: () => CrewGoalsWriteRepository
) {
  app.get("/api/invites", async (request) => {
    const { scenario } = request.query as { scenario?: string };
    const repository = createReadRepository(
      scenario ? resolveMockScenario(scenario) : undefined
    );

    return createInvitesService(repository).listInvites();
  });

  app.get("/api/invites/:inviteId", async (request, reply) => {
    const { inviteId } = request.params as { inviteId: string };
    const { scenario } = request.query as { scenario?: string };
    const repository = createReadRepository(
      scenario ? resolveMockScenario(scenario) : undefined
    );
    const detail = createInvitesService(repository).getInviteDetail(inviteId);

    if (!detail) {
      return reply.code(404).send({
        message: `Invite ${inviteId} was not found`
      });
    }

    return detail;
  });

  app.post("/api/invites/:inviteId/accept", async (request, reply) => {
    const { inviteId } = request.params as { inviteId: string };

    try {
      return createInviteActionsService(createWriteRepository()).acceptInvite(inviteId);
    } catch (error) {
      return sendInviteActionError(reply, error);
    }
  });

  app.post("/api/invites/:inviteId/ignore", async (request, reply) => {
    const { inviteId } = request.params as { inviteId: string };

    try {
      return createInviteActionsService(createWriteRepository()).ignoreInvite(inviteId);
    } catch (error) {
      return sendInviteActionError(reply, error);
    }
  });
}

function sendInviteActionError(reply: FastifyReply, error: unknown) {
  const code = error && typeof error === "object" ? (error as { code?: string }).code : undefined;
  const message = error instanceof Error ? error.message : "Invite action failed";

  if (code === "not_found") {
    return reply.code(404).send({ message });
  }

  if (code === "active_goal_conflict") {
    return reply.code(409).send({
      message,
      code
    });
  }

  if (code === "full" || code === "completed" || code === "expired" || code === "invite_unavailable" || code === "ignored") {
    return reply.code(400).send({
      message,
      code
    });
  }

  return reply.code(400).send({ message });
}
