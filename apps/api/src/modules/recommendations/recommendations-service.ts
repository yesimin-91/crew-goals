import type {
  GoalDistanceRecommendationOption,
  GoalDistanceRecommendationRequest,
  GoalDistanceRecommendationResponse,
  GoalRecommendationTier,
  RecommendationSource
} from "../../../../../packages/shared/src/index.js";

import { RECENT_TRAINING_WEEKLY_DISTANCE_KM, VIEWER_ID } from "../../lib/crew-users.js";
import { toOneDecimal } from "../../lib/time.js";

const DEFAULT_DISTANCES: Record<GoalRecommendationTier, number> = {
  easy: 20,
  recommended: 35,
  stretch: 50
};

export function createRecommendationsService() {
  return {
    getGoalDistanceRecommendation(
      request: GoalDistanceRecommendationRequest
    ): GoalDistanceRecommendationResponse {
      const selectedFriendIds = normalizeFriendIds(request.selectedFriendIds);
      const participantIds = [VIEWER_ID, ...selectedFriendIds];
      const availableDistances = participantIds
        .map((userId) => RECENT_TRAINING_WEEKLY_DISTANCE_KM[userId])
        .filter((distance): distance is number => typeof distance === "number");

      const source: RecommendationSource =
        availableDistances.length >= 2 ? "recent_training" : "default";
      const baseDistance =
        source === "recent_training"
          ? toOneDecimal(
              availableDistances.reduce((sum, distance) => sum + distance, 0)
            )
          : DEFAULT_DISTANCES.recommended;

      return {
        screen: "goal_recommendation",
        durationDays: 7,
        selectedFriendIds,
        options: buildOptions(baseDistance, source),
        defaultSelectedTier: "recommended",
        source,
        explanation:
          source === "recent_training"
            ? "Based on the selected crew's recent weekly Run and Trail Run distance."
            : "Using the default weekly distance presets because recent training data is limited."
      };
    }
  };
}

function normalizeFriendIds(selectedFriendIds: string[]): string[] {
  return Array.from(
    new Set(
      selectedFriendIds.filter((friendId) => friendId && friendId !== VIEWER_ID)
    )
  );
}

function buildOptions(
  baseDistance: number,
  source: RecommendationSource
): GoalDistanceRecommendationOption[] {
  const values =
    source === "recent_training"
      ? {
          easy: toOneDecimal(baseDistance * 0.8),
          recommended: toOneDecimal(baseDistance),
          stretch: toOneDecimal(baseDistance * 1.2)
        }
      : DEFAULT_DISTANCES;

  return [
    {
      tier: "easy",
      label: "Easy",
      distanceKm: values.easy,
      description: "A lighter week for building the habit together."
    },
    {
      tier: "recommended",
      label: "Recommended",
      distanceKm: values.recommended,
      description: "Matches the crew's current weekly rhythm."
    },
    {
      tier: "stretch",
      label: "Stretch",
      distanceKm: values.stretch,
      description: "A bigger push if the whole crew is feeling good."
    }
  ];
}
