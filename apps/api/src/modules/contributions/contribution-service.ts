import type {
  ContributionSyncRequest,
  ContributionSyncResponse
} from "../../../../../packages/shared/src/index.js";

import type { CrewGoalsWriteRepository } from "../../repositories/crew-goals-read-repository.js";

export function createContributionService(repository: CrewGoalsWriteRepository) {
  return {
    syncContribution(request: ContributionSyncRequest): ContributionSyncResponse {
      const result = repository.syncContribution({
        activityId: request.activityId,
        userId: repository.getViewer().id,
        distanceKm: request.distanceKm,
        activityType: request.activityType,
        activitySource: request.activitySource,
        activityEndTime: request.activityEndTime,
        syncedAt: repository.getNow().toISOString()
      });

      if (result.status === "counted") {
        const goal = result.goalId ? repository.getGoalById(result.goalId) : null;

        return {
          screen: "contribution_sync",
          activityId: request.activityId,
          outcome: result.completedGoalId ? "goal_completed" : "counted",
          status: "counted",
          distanceKm: request.distanceKm,
          message: result.completedGoalId
            ? "Goal completed"
            : "Contribution counted",
          goal: goal
            ? {
                goalId: goal.id,
                title: goal.title,
                status: goal.status,
                totalDistanceKm: goal.members.reduce((sum, member) => sum + member.contributionKm, 0),
                targetDistanceKm: goal.targetDistanceKm,
                remainingDistanceKm: Math.max(
                  0,
                  goal.targetDistanceKm -
                    goal.members.reduce((sum, member) => sum + member.contributionKm, 0)
                ),
                resultLockedAt: goal.resultLockedAt
              }
            : undefined
        };
      }

      return {
        screen: "contribution_sync",
        activityId: request.activityId,
        outcome: result.reasonCode === "duplicate" ? "already_counted" : "not_counted",
        status: "ignored",
        reasonCode: result.reasonCode,
        distanceKm: request.distanceKm,
        message:
          result.reasonCode === "duplicate"
            ? "Already counted"
            : result.reasonCode === "goal_locked"
              ? "Goal already completed"
              : "Could not update crew progress yet",
        goal: result.goalId ? mapGoalSnapshot(repository, result.goalId) : undefined
      };
    }
  };
}

function mapGoalSnapshot(repository: CrewGoalsWriteRepository, goalId: string) {
  const goal = repository.getGoalById(goalId);

  if (!goal) {
    return undefined;
  }

  const totalDistanceKm = goal.members.reduce((sum, member) => sum + member.contributionKm, 0);

  return {
    goalId: goal.id,
    title: goal.title,
    status: goal.status,
    totalDistanceKm,
    targetDistanceKm: goal.targetDistanceKm,
    remainingDistanceKm: Math.max(0, goal.targetDistanceKm - totalDistanceKm),
    resultLockedAt: goal.resultLockedAt
  };
}
