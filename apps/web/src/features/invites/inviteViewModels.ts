import { formatDateLabel, formatDistanceKm, formatRelativeTime, getInitials } from "../../lib/formatters";
import type {
  InviteAvailabilityReason,
  InviteDetail,
  InviteListItem
} from "../../types/crewGoals";

function getAvailabilityCopy(reason?: InviteAvailabilityReason) {
  switch (reason) {
    case "active_goal_conflict":
      return {
        label: "Active goal conflict",
        tone: "warning" as const,
        description:
          "You already have an active Crew Goal, so this invite stays view-only until that goal ends."
      };
    case "full":
      return {
        label: "Goal is full",
        tone: "neutral" as const,
        description: "This crew already reached its member cap, so new joins are closed."
      };
    case "completed":
      return {
        label: "Goal completed",
        tone: "neutral" as const,
        description: "The team already finished this goal, so the invite is no longer available."
      };
    case "expired":
      return {
        label: "Goal ended",
        tone: "neutral" as const,
        description: "This invite ended with the crew's 7-day window."
      };
    case "ignored":
      return {
        label: "Invite closed",
        tone: "neutral" as const,
        description: "This invite is no longer active."
      };
    default:
      return {
        label: "Ready to review",
        tone: "positive" as const,
        description:
          "Open the invite to review the goal and decide later. Join and ignore actions can plug in during the next phase."
      };
  }
}

export function mapInviteListItem(item: InviteListItem) {
  const availability = getAvailabilityCopy(item.availabilityReason);

  return {
    id: item.id,
    goalId: item.goalId,
    title: item.goalTitle,
    inviterName: item.inviterName,
    initials: getInitials(item.inviterName),
    targetLabel: formatDistanceKm(item.targetDistanceKm),
    durationLabel: `${item.durationDays} days`,
    membersLabel: `${item.currentMemberCount} members now`,
    expiresLabel: `Ends ${formatDateLabel(item.endTime)}`,
    statusLabel: availability.label,
    statusTone: availability.tone,
    description: availability.description
  };
}

export function mapInviteDetailView(invite: InviteDetail) {
  const availability = getAvailabilityCopy(invite.availabilityReason);
  const isUnavailable =
    invite.status === "invalid" &&
    invite.availabilityReason !== "active_goal_conflict";
  const isConflict = invite.availabilityReason === "active_goal_conflict";

  return {
    id: invite.id,
    goalId: invite.goalId,
    title: invite.goalTitle,
    inviterName: invite.inviterName,
    inviterInitials: getInitials(invite.inviterName),
    targetLabel: formatDistanceKm(invite.targetDistanceKm),
    durationLabel: `${invite.durationDays} days`,
    currentMembersLabel: `${invite.currentMemberCount} members right now`,
    joinedMembersLabel: `${invite.joinedMemberCount} joined`,
    pendingInvitesLabel: `${invite.pendingInviteCount} pending`,
    startsLabel: `Started ${formatRelativeTime(invite.startTime)}`,
    endsLabel: `Ends ${formatDateLabel(invite.endTime)}`,
    availabilityLabel: availability.label,
    availabilityDescription: availability.description,
    availabilityTone: availability.tone,
    isUnavailable,
    isConflict,
    currentUserActiveGoalId: invite.currentUserActiveGoalId
  };
}

export type InviteListItemView = ReturnType<typeof mapInviteListItem>;
export type InviteDetailView = ReturnType<typeof mapInviteDetailView>;
