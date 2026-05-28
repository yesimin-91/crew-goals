export interface EntryHighlight {
  label: string;
  value: string;
}

export interface EntryOverview {
  headline: string;
  subheadline: string;
  rules: string[];
  highlights: EntryHighlight[];
}

export function buildEntryOverview(): EntryOverview {
  return {
    headline: "Run separately. Finish together.",
    subheadline:
      "Crew Goals lets 2 to 4 friends complete one 7-day distance target asynchronously inside Suunto.",
    rules: [
      "Goals begin immediately after the creator sends invites.",
      "Only runs completed after a member joins can count toward the crew.",
      "Run and Trail Run activities are counted once, after sync, from trusted sources."
    ],
    highlights: [
      { label: "Cycle", value: "7 days" },
      { label: "Crew size", value: "2-4 people" },
      { label: "Status", value: "MVP skeleton" }
    ]
  };
}

