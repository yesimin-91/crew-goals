import type { GoalResultResponse } from "../../../../packages/shared/src/index";

import { fetchJson } from "./http";

export async function getGoalResult(goalId: string, signal?: AbortSignal) {
  return fetchJson<GoalResultResponse>(`/api/goals/${goalId}/result`, { signal });
}
