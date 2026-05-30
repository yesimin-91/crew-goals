import type {
  GoalContributionMember,
  GoalDetailResponse,
  GoalReadResponse,
  GoalsHubResponse,
  PendingInviteSummary,
  RecentGoalActivity
} from "../../../../../packages/shared/src/index.js";

import { buildGoalProgressSummary, buildGoalTimelineSummary } from "../../lib/view-models.js";
import { buildRelativeTimeLabel, toOneDecimal } from "../../lib/time.js";
import type {
  CrewGoalActivityRecord,
  CrewGoalRecord,
  CrewGoalsReadRepository
} from "../../repositories/crew-goals-read-repository.js";
import { buildGoalInvitePreviewResponse } from "../invites/invite-read-models.js";

export function createGoalsService(repository: CrewGoalsReadRepository) {
  return {
    getActiveGoal(): GoalsHubResponse {
      const activeGoal = repository.getActiveGoal();

      if (!activeGoal) {
        return {
          screen: "goals_hub",
          state: "no_active_goal",
          title: "Crew Goals",
          subtitle: "Start a weekly distance goal with friends who do not need to run together.",
          emptyState: {
            title: "No active goal yet",
            body: "Create a 7-day distance goal, invite 1 to 3 friends, and let every eligible run add automatically after sync.",
            primaryAction: {
              label: "Start a Goal",
              href: "/goals/create",
              kind: "primary"
            }
          }
        };
      }

      const totalDistanceKm = sumGoalDistance(activeGoal);
      const viewer = repository.getViewer();
      const myContributionKm =
        activeGoal.members.find((member) => member.userId === viewer.id)?.contributionKm ?? 0;
      const now = repository.getNow();

      return {
        screen: "goals_hub",
        state: "active_goal",
        title: "Crew Goals",
        subtitle: "Your current weekly crew goal stays active while friends can still accept pending invites.",
        activeGoal: {
          goalId: activeGoal.id,
          title: activeGoal.title,
          status: activeGoal.status,
          progress: buildGoalProgressSummary({
            totalDistanceKm,
            targetDistanceKm: activeGoal.targetDistanceKm,
            status: activeGoal.status,
            startTime: new Date(activeGoal.startTime),
            endTime: new Date(activeGoal.endTime),
            now
          }),
          timeline: buildGoalTimelineSummary({
            startTime: new Date(activeGoal.startTime),
            endTime: new Date(activeGoal.endTime),
            now
          }),
          myContributionKm,
          crew: {
            joinedMemberCount: activeGoal.members.length,
            pendingInviteCount: activeGoal.pendingInvites.length,
            crewLimit: activeGoal.crewLimit
          }
        }
      };
    },

    getGoalDetail(goalId: string): GoalReadResponse | null {
      const goal = repository.getGoalById(goalId);

      if (!goal) {
        return null;
      }

      const viewer = repository.getViewer();
      const isJoinedMember = goal.members.some((member) => member.userId === viewer.id);

      if (!isJoinedMember) {
        const invite = repository.getViewerInviteByGoalId(goalId);

        if (!invite) {
          return null;
        }

        return buildGoalInvitePreviewResponse(repository, invite, goal);
      }

      return buildJoinedGoalDetail(repository, goal);
    }
  };
}

function buildJoinedGoalDetail(
  repository: CrewGoalsReadRepository,
  goal: CrewGoalRecord
): GoalDetailResponse {
  const viewer = repository.getViewer();
  const totalDistanceKm = sumGoalDistance(goal);
  const now = repository.getNow();
  const myContributionKm =
    goal.members.find((member) => member.userId === viewer.id)?.contributionKm ?? 0;

  return {
    screen: "goal_detail",
    goalId: goal.id,
    title: goal.title,
    status: goal.status,
    recommendationTier: goal.recommendationTier,
    recommendationSource: goal.recommendationSource,
    progress: buildGoalProgressSummary({
      totalDistanceKm,
      targetDistanceKm: goal.targetDistanceKm,
      status: goal.status,
      startTime: new Date(goal.startTime),
      endTime: new Date(goal.endTime),
      now
    }),
    timeline: buildGoalTimelineSummary({
      startTime: new Date(goal.startTime),
      endTime: new Date(goal.endTime),
      now
    }),
    myContributionKm,
    crew: {
      joinedMemberCount: goal.members.length,
      pendingInviteCount: goal.pendingInvites.length,
      crewLimit: goal.crewLimit
    },
    members: buildGoalMembers(repository, goal),
    pendingInvites: goal.pendingInvites.map((invite) => ({
      inviteId: invite.inviteId,
      invitee: toAvatar(repository, invite.inviteeId),
      status: "pending",
      sentAt: invite.createdAt,
      expiresAt: invite.expiresAt
    })),
    recentActivity: goal.recentActivity.map((activity) => buildRecentActivity(repository, activity)),
    recentActivityEmptyState:
      goal.recentActivity.length > 0
        ? undefined
        : {
            title: "Your goal has started",
            body: "The first eligible run will move the team forward."
          },
    actions: [
      {
        label: "Share Progress",
        href: `/goals/${goal.id}/share`,
        kind: "primary"
      },
      {
        label: "Start a Run",
        href: "/sport/run",
        kind: "secondary"
      }
    ]
  };
}

function sumGoalDistance(goal: CrewGoalRecord): number {
  return toOneDecimal(
    goal.members.reduce((sum, member) => sum + member.contributionKm, 0)
  );
}

function buildGoalMembers(
  repository: CrewGoalsReadRepository,
  goal: CrewGoalRecord
): GoalContributionMember[] {
  return goal.members.map((member) => {
    const user = repository.getUserById(member.userId);

    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: member.role,
      joinedAt: member.joinTime,
      contributionKm: member.contributionKm,
      contributionLabel: `${member.contributionKm} km contributed`
    };
  });
}

function buildRecentActivity(
  repository: CrewGoalsReadRepository,
  activity: CrewGoalActivityRecord
): RecentGoalActivity {
  const now = repository.getNow();
  const member = repository.getUserById(activity.userId);

  return {
    activityId: activity.activityId,
    member: {
      id: member.id,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl
    },
    activityType: activity.activityType,
    distanceKm: activity.distanceKm,
    happenedAt: activity.happenedAt,
    syncedAt: activity.syncedAt,
    relativeSyncLabel: buildRelativeTimeLabel(new Date(activity.syncedAt), now)
  };
}

function toAvatar(
  repository: CrewGoalsReadRepository,
  userId: string
): PendingInviteSummary["invitee"] {
  const user = repository.getUserById(userId);

  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl
  };
}
