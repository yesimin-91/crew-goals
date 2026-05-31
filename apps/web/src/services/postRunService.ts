import type { PostRunContributionResponse } from "../../../../packages/shared/src/index";

import { fetchJson } from "./http";

export async function getPostRunContribution(activityId: string, signal?: AbortSignal) {
  return fetchJson<PostRunContributionResponse>(`/api/post-run/${activityId}`, { signal });
}
