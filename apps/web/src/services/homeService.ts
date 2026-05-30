import { fetchJson } from "./http";
import type { EntryOverview } from "../types/crewGoals";
import { mapHomeEntryOverview } from "./apiContracts";
import type { HomeEntryResponse } from "../../../../packages/shared/src/index";

export const fallbackOverview: EntryOverview = {
  headline: "Run separately. Finish together.",
  subheadline:
    "Create a 7-day distance goal with familiar friends. Every eligible Run or Trail Run adds to the same crew target after sync, with no need to start together.",
  rules: [
    "Goals begin immediately after invites are sent.",
    "Friends who join later only contribute future runs.",
    "Only trusted Run and Trail Run activities count."
  ],
  highlights: [
    { label: "Cycle", value: "7 days" },
    { label: "Crew size", value: "2-4 people" },
    { label: "Goal type", value: "Distance" }
  ]
};

export async function getHomeEntryOverview(signal?: AbortSignal) {
  const response = await fetchJson<HomeEntryResponse>("/api/home-entry", { signal });
  return mapHomeEntryOverview(response);
}
