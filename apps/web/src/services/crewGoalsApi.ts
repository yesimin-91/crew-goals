import { getRecentActivities } from "./contributionService";
import {
  createGoal,
  getGoalDistanceRecommendation
} from "./createGoalService";
import { getGoalDetail, getActiveGoalSummary } from "./goalService";
import { getHomeEntryOverview } from "./homeService";
import { getInvite, listInvites } from "./inviteService";
import { createMockCrewGoalsApi } from "../mocks/mockCrewGoalsApi";
import type {
  EntryOverview,
  CreateGoalResponse,
  GoalDistanceRecommendationResponse,
  GoalRecommendationTier,
  GoalDetail,
  GoalSummary,
  InviteDetail,
  InviteListItem,
  RecentActivity
} from "../types/crewGoals";

export interface CrewGoalsApi {
  getHomeEntryOverview(signal?: AbortSignal): Promise<EntryOverview>;
  getActiveGoalSummary(signal?: AbortSignal): Promise<GoalSummary | null>;
  getGoalDetail(goalId: string, signal?: AbortSignal): Promise<GoalDetail>;
  getRecentActivities(goalId: string, signal?: AbortSignal): Promise<RecentActivity[]>;
  listInvites(signal?: AbortSignal): Promise<InviteListItem[]>;
  getInvite(inviteId: string, signal?: AbortSignal): Promise<InviteDetail>;
  getGoalDistanceRecommendation(
    selectedFriendIds: string[],
    signal?: AbortSignal
  ): Promise<GoalDistanceRecommendationResponse>;
  createGoal(
    selectedFriendIds: string[],
    selectedTier: GoalRecommendationTier
  ): Promise<CreateGoalResponse>;
}

export function createHttpCrewGoalsApi(): CrewGoalsApi {
  return {
    getHomeEntryOverview,
    getActiveGoalSummary,
    getGoalDetail,
    getRecentActivities,
    listInvites,
    getInvite,
    getGoalDistanceRecommendation,
    createGoal
  };
}

export const defaultCrewGoalsApi =
  import.meta.env.VITE_CREW_GOALS_USE_MOCKS === "true"
    ? createMockCrewGoalsApi()
    : createHttpCrewGoalsApi();
