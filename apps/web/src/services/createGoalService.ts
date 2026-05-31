import type {
  CreateGoalResponse,
  GoalDistanceRecommendationResponse,
  GoalRecommendationTier
} from "../types/crewGoals";
import { fetchJson } from "./http";

export async function getGoalDistanceRecommendation(
  selectedFriendIds: string[],
  signal?: AbortSignal
) {
  return fetchJson<GoalDistanceRecommendationResponse>(
    "/api/recommendations/goal-distance",
    {
      method: "POST",
      body: JSON.stringify({ selectedFriendIds }),
      signal
    }
  );
}

export async function createGoal(
  selectedFriendIds: string[],
  selectedTier: GoalRecommendationTier
) {
  return fetchJson<CreateGoalResponse>("/api/goals", {
    method: "POST",
    body: JSON.stringify({ selectedFriendIds, selectedTier })
  });
}
