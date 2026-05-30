export * from "./contracts.js";

import type { EntryOverview } from "./contracts.js";

export function buildEntryOverview(): EntryOverview {
  return {
    headline: "Run separately. Finish together.",
    subheadline:
      "Create a 7-day distance goal with 1 to 3 friends. Every eligible Run or Trail Run adds to the same crew target after sync.",
    rules: [
      "Goal starts immediately after invites are sent.",
      "Friends who join later only contribute future runs.",
      "Only trusted Run and Trail Run activities count."
    ],
    highlights: [
      { label: "Cycle", value: "7 days" },
      { label: "Crew size", value: "2-4 people" },
      { label: "Goal type", value: "Distance" }
    ]
  };
}
