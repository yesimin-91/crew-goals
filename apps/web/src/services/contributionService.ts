import { fetchJson } from "./http";
import type { RecentActivity } from "../types/crewGoals";
import type { GoalReadResponse } from "../../../../packages/shared/src/index";
import { mapGoalRecentActivity } from "./apiContracts";

export async function getRecentActivities(goalId: string, signal?: AbortSignal) {
  const response = await fetchJson<GoalReadResponse>(`/api/goals/${goalId}`, { signal });
  return mapGoalRecentActivity(response);
}
