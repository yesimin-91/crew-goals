import { formatDistanceKm, formatPercent } from "../../lib/formatters";
import type {
  ContributionSyncResponse,
  PostRunContributionResponse
} from "../../types/crewGoals";

type PostRunState = PostRunContributionResponse["state"];
type PostRunSource = PostRunContributionResponse | ContributionSyncResponse;
type PostRunTone = "positive" | "warning" | "neutral";

function getStateFromSource(source: PostRunSource): PostRunState {
  if (source.screen === "post_run") {
    return source.state;
  }

  if (source.outcome === "already_counted") {
    return "already_counted";
  }

  if (source.reasonCode === "goal_locked") {
    return "goal_locked";
  }

  return source.status === "counted" ? "counted" : "not_counted";
}

function getPostRunCopy(state: PostRunState) {
  switch (state) {
    case "updating":
      return {
        eyebrow: "Sync in progress",
        title: "Updating crew progress",
        label: "Updating",
        tone: "neutral" as PostRunTone,
        body:
          "We are still checking whether this activity can count toward your active Crew Goal."
      };
    case "counted":
      return {
        eyebrow: "Contribution counted",
        title: "This run moved the crew forward",
        label: "Counted",
        tone: "positive" as PostRunTone,
        body:
          "Eligible Run and Trail Run activities add automatically after sync, without needing the crew to run together."
      };
    case "already_counted":
      return {
        eyebrow: "Already counted",
        title: "This activity was already applied",
        label: "Already counted",
        tone: "neutral" as PostRunTone,
        body:
          "Duplicate activity syncs stay safe and do not add distance twice."
      };
    case "goal_locked":
      return {
        eyebrow: "Goal locked",
        title: "The goal result is already locked",
        label: "Goal locked",
        tone: "warning" as PostRunTone,
        body:
          "Completed and expired goals keep their final result, so later activity syncs cannot change the total."
      };
    case "not_counted":
      return {
        eyebrow: "Not counted",
        title: "This activity did not count",
        label: "Not counted",
        tone: "warning" as PostRunTone,
        body:
          "Phase 1 only counts eligible Run and Trail Run activities from trusted sources after you join the goal."
      };
  }
}

function getGoalProgress(goal: PostRunSource["goal"]) {
  if (!goal) {
    return null;
  }

  const progressPercent =
    goal.targetDistanceKm > 0
      ? Math.min(100, (goal.totalDistanceKm / goal.targetDistanceKm) * 100)
      : 0;

  return {
    id: goal.goalId,
    title: goal.title,
    status: goal.status,
    progressPercent,
    progressPercentLabel: formatPercent(progressPercent),
    totalDistanceLabel: formatDistanceKm(goal.totalDistanceKm),
    targetDistanceLabel: formatDistanceKm(goal.targetDistanceKm),
    remainingDistanceLabel: formatDistanceKm(goal.remainingDistanceKm),
    progressLabel: `${formatDistanceKm(goal.totalDistanceKm)} / ${formatDistanceKm(goal.targetDistanceKm)}`,
    resultLockedLabel: goal.resultLockedAt ? "Final result locked" : null
  };
}

export function mapPostRunContributionView(source: PostRunSource) {
  const state = getStateFromSource(source);
  const copy = getPostRunCopy(state);

  return {
    activityId: source.activityId,
    state,
    message: source.message,
    ...copy,
    goal: getGoalProgress(source.goal),
    syncedDistanceLabel:
      source.screen === "contribution_sync" ? formatDistanceKm(source.distanceKm) : null,
    showRetryHint: state === "updating"
  };
}

export type PostRunContributionView = ReturnType<typeof mapPostRunContributionView>;
