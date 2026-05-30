import type {
  MockCrewGoalsDataset,
  MockGoal,
  MockInvite,
  MockScenario,
  MockUser
} from "../mock/crew-goals-mock-data.js";
import { createMockCrewGoalsDataset } from "../mock/crew-goals-mock-data.js";
import type { CrewGoalsReadRepository } from "./crew-goals-read-repository.js";

export function resolveMockScenario(scenario?: string): MockScenario {
  switch (scenario) {
    case "blocked":
    case "joinable":
    case "unavailable":
    case "no_active_goal":
      return scenario;
    default:
      return "default";
  }
}

export class MockCrewGoalsReadRepository implements CrewGoalsReadRepository {
  private readonly dataset: MockCrewGoalsDataset;

  constructor(
    private readonly options: {
      now?: Date;
      scenario?: MockScenario;
    } = {}
  ) {
    this.dataset = createMockCrewGoalsDataset(
      options.now ?? new Date(),
      options.scenario
    );
  }

  getViewer(): MockUser {
    return this.getUserById(this.dataset.viewerId);
  }

  getActiveGoal(): MockGoal | null {
    if (!this.dataset.activeGoalId) {
      return null;
    }

    return this.dataset.goals[this.dataset.activeGoalId] ?? null;
  }

  getGoalById(goalId: string): MockGoal | null {
    return this.dataset.goals[goalId] ?? null;
  }

  listInvites(): MockInvite[] {
    return Object.values(this.dataset.invites).filter(
      (invite) => invite.inviteeId === this.dataset.viewerId
    );
  }

  getInviteById(inviteId: string): MockInvite | null {
    const invite = this.dataset.invites[inviteId];

    if (!invite || invite.inviteeId !== this.dataset.viewerId) {
      return null;
    }

    return invite;
  }

  getViewerInviteByGoalId(goalId: string): MockInvite | null {
    return (
      Object.values(this.dataset.invites).find(
        (invite) => invite.goalId === goalId && invite.inviteeId === this.dataset.viewerId
      ) ?? null
    );
  }

  getUserById(userId: string): MockUser {
    const user = this.dataset.users[userId];

    if (!user) {
      throw new Error(`Unknown mock user: ${userId}`);
    }

    return user;
  }

  getNow(): Date {
    return this.options.now ?? new Date();
  }
}
