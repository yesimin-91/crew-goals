import type { FastifyInstance } from "fastify";

import { createInvitesService } from "../modules/invites/invites-service.js";
import type { MockScenario } from "../mock/crew-goals-mock-data.js";
import type { CrewGoalsReadRepository } from "../repositories/crew-goals-read-repository.js";
import { resolveMockScenario } from "../repositories/mock-crew-goals-read-repository.js";

export async function registerInviteRoutes(
  app: FastifyInstance,
  createRepository: (scenario?: MockScenario) => CrewGoalsReadRepository
) {
  app.get("/api/invites", async (request) => {
    const { scenario } = request.query as { scenario?: string };
    const repository = createRepository(
      scenario ? resolveMockScenario(scenario) : undefined
    );

    return createInvitesService(repository).listInvites();
  });

  app.get("/api/invites/:inviteId", async (request, reply) => {
    const { inviteId } = request.params as { inviteId: string };
    const { scenario } = request.query as { scenario?: string };
    const repository = createRepository(
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
}
