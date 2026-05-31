import { formatDistanceKm, formatDateLabel } from "../../lib/formatters";
import type { GoalResultResponse } from "../../types/crewGoals";

function getResultCopy(status: GoalResultResponse["status"]) {
  switch (status) {
    case "completed":
      return {
        eyebrow: "Goal completed",
        title: "You finished the week together",
        body: "The final result is locked, and the team can start another goal when ready.",
        tone: "positive" as const,
        badge: "Completed"
      };
    case "expired":
      return {
        eyebrow: "Goal expired",
        title: "This crew goal ended",
        body: "The final result is locked, and the team can roll into another weekly target.",
        tone: "warning" as const,
        badge: "Expired"
      };
  }
}

function getMemberLabel(contributionKm: number) {
  return `${formatDistanceKm(contributionKm)} contributed`;
}

function getOwnerInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

export function mapGoalResultView(result: GoalResultResponse) {
  const copy = getResultCopy(result.status);

  return {
    id: result.goalId,
    currentUserId: result.currentUserId,
    title: result.title,
    status: result.status,
    eyebrow: copy.eyebrow,
    headline: copy.title,
    body: copy.body,
    tone: copy.tone,
    badge: copy.badge,
    summaryLabel: `${formatDistanceKm(result.finalDistanceKm)} final of ${formatDistanceKm(result.targetDistanceKm)}`,
    daysUsedLabel: result.daysUsedLabel,
    lockedAtLabel: `Locked ${formatDateLabel(result.resultLockedAt)}`,
    members: result.members.map((member) => ({
      id: member.id,
      name: member.displayName,
      initials: getOwnerInitials(member.displayName),
      label: getMemberLabel(member.contributionKm)
    })),
    primaryAction: result.primaryAction,
    secondaryAction: result.secondaryAction
  };
}

export type GoalResultView = ReturnType<typeof mapGoalResultView>;
