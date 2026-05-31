import type {
  CrewGoalAnalyticsEventRecord,
  GoalResultResponse,
  PostRunContributionResponse
} from "../../../../packages/shared/src/index.js";
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

  getGoalResult(goalId: string): GoalResultResponse | null {
    const goal = this.getGoalById(goalId);

    if (!goal || goal.status === "active") {
      return null;
    }

    const totalDistanceKm = goal.members.reduce((sum, member) => sum + member.contributionKm, 0);

    return {
      screen: "goal_result",
      goalId: goal.id,
      status: goal.status,
      title: goal.title,
      totalDistanceKm,
      targetDistanceKm: goal.targetDistanceKm,
      finalDistanceKm: totalDistanceKm,
      daysUsedLabel: "7 days",
      resultLockedAt: goal.endTime,
      members: goal.members.map((member) => {
        const user = this.getUserById(member.userId);

        return {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          contributionKm: member.contributionKm
        };
      }),
      primaryAction: {
        label: "Start Another Goal",
        href: "/goals/create",
        kind: "primary"
      }
    };
  }

  getPostRunContribution(activityId: string): PostRunContributionResponse | null {
    const goal = Object.values(this.dataset.goals).find((item) =>
      item.recentActivity.some((activity) => activity.activityId === activityId)
    );

    if (!goal) {
      return null;
    }

    const totalDistanceKm = goal.members.reduce((sum, member) => sum + member.contributionKm, 0);

    return {
      screen: "post_run",
      activityId,
      state: "counted",
      message: "Contribution counted",
      goal: {
        goalId: goal.id,
        title: goal.title,
        status: goal.status,
        totalDistanceKm,
        targetDistanceKm: goal.targetDistanceKm,
        remainingDistanceKm: Math.max(0, goal.targetDistanceKm - totalDistanceKm)
      }
    };
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

  recordAnalyticsEvent(event: CrewGoalAnalyticsEventRecord): CrewGoalAnalyticsEventRecord {
    return event;
  }
}
