import { mapGoalSummaryCard } from "../goals/goalViewModels";
import type { EntryOverview, GoalSummary } from "../../types/crewGoals";

export function mapHomeEntryView(overview: EntryOverview, activeGoal: GoalSummary | null) {
  return {
    overview,
    activeGoal: activeGoal ? mapGoalSummaryCard(activeGoal) : null
  };
}

export type HomeEntryView = ReturnType<typeof mapHomeEntryView>;
