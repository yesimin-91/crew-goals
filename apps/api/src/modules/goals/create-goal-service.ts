import type {
  CreateGoalRequest,
  CreateGoalResponse
} from "../../../../../packages/shared/src/index.js";

import { addHours, toIsoDate } from "../../lib/time.js";
import { createRecommendationsService } from "../recommendations/recommendations-service.js";
import type {
  CrewGoalsWriteRepository
} from "../../repositories/crew-goals-read-repository.js";

const GOAL_DURATION_DAYS = 7;
const MIN_FRIENDS = 1;
const MAX_FRIENDS = 3;

export function createGoalService(repository: CrewGoalsWriteRepository) {
  return {
    createGoal(request: CreateGoalRequest): CreateGoalResponse {
      const selectedFriendIds = normalizeFriendIds(request.selectedFriendIds);

      if (selectedFriendIds.length < MIN_FRIENDS || selectedFriendIds.length > MAX_FRIENDS) {
        throw createGoalError(
          "invalid_friend_count",
          "selectedFriendIds must include 1 to 3 friends"
        );
      }

      const activeGoal = repository.getActiveGoal();

      if (activeGoal) {
        throw createGoalError("active_goal_conflict", "user already has an active goal");
      }

      const now = repository.getNow();
      const goalId = buildGoalId(now);
      const startTime = toIsoDate(now);
      const endTime = toIsoDate(addHours(now, GOAL_DURATION_DAYS * 24));
      const recommendation = createRecommendationsService().getGoalDistanceRecommendation({
        selectedFriendIds
      });
      const selectedOption = recommendation.options.find(
        (option) => option.tier === request.selectedTier
      );

      if (!selectedOption) {
        throw createGoalError("invalid_recommendation_tier", "selectedTier is invalid");
      }

      const result = repository.createGoal({
        goalId,
        creatorId: repository.getViewer().id,
        title: buildGoalTitle(repository, selectedFriendIds),
        targetDistanceKm: selectedOption.distanceKm,
        startTime,
        endTime,
        recommendationTier: request.selectedTier,
        recommendationSource: recommendation.source,
        inviteeIds: selectedFriendIds,
        createdAt: startTime
      });

      return {
        screen: "goal_created",
        goalId: result.goalId,
        detailHref: `/goals/${result.goalId}`,
        inviteIds: result.inviteIds
      };
    }
  };
}

function normalizeFriendIds(selectedFriendIds: string[]): string[] {
  return Array.from(new Set(selectedFriendIds.filter((friendId) => friendId.trim().length > 0)));
}

function buildGoalId(now: Date): string {
  return `goal_${now.getTime()}`;
}

function buildGoalTitle(
  repository: CrewGoalsWriteRepository,
  selectedFriendIds: string[]
): string {
  const creator = repository.getViewer();

  if (selectedFriendIds.length === 1) {
    const friend = repository.getUserById(selectedFriendIds[0]);
    return `${creator.displayName} + ${friend.displayName} Crew`;
  }

  if (selectedFriendIds.length > 1) {
    return `${creator.displayName} + ${selectedFriendIds.length} Crew`;
  }

  return "Weekly Crew Goal";
}

function createGoalError(code: string, message: string) {
  const error = new Error(message);
  (error as Error & { code: string }).code = code;
  return error;
}
