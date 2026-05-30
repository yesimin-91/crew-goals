import { getRecentActivities } from "./contributionService";
import { getGoalDetail, getActiveGoalSummary } from "./goalService";
import { getHomeEntryOverview } from "./homeService";
import { getInvite, listInvites } from "./inviteService";
import { createMockCrewGoalsApi } from "../mocks/mockCrewGoalsApi";
import type {
  EntryOverview,
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
}

export function createHttpCrewGoalsApi(): CrewGoalsApi {
  return {
    getHomeEntryOverview,
    getActiveGoalSummary,
    getGoalDetail,
    getRecentActivities,
    listInvites,
    getInvite
  };
}

export const defaultCrewGoalsApi =
  import.meta.env.VITE_CREW_GOALS_USE_MOCKS === "true"
    ? createMockCrewGoalsApi()
    : createHttpCrewGoalsApi();
