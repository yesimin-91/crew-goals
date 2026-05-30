import { fetchJson } from "./http";
import type { GoalDetail, GoalSummary } from "../types/crewGoals";
import type { GoalReadResponse, GoalsHubResponse } from "../../../../packages/shared/src/index";
import {
  mapGoalReadResponse,
  mapGoalsHubResponse
} from "./apiContracts";

export async function getActiveGoalSummary(signal?: AbortSignal) {
  const response = await fetchJson<GoalsHubResponse>("/api/goals/active", { signal });
  return mapGoalsHubResponse(response);
}

export async function getGoalDetail(goalId: string, signal?: AbortSignal) {
  const response = await fetchJson<GoalReadResponse>(`/api/goals/${goalId}`, { signal });
  return mapGoalReadResponse(response);
}
