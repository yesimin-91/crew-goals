import type {
  GoalInvitePreviewResponse,
  InviteAvailability,
  InviteAvailabilitySummary,
  InviteDetailResponse,
  InviteGoalPreview,
  InviteInvalidReason,
  InviteStatus,
  MemberAvatar
} from "../../../../../packages/shared/src/index.js";

import { buildInviteAvailabilitySummary } from "../../lib/view-models.js";
import { diffHours } from "../../lib/time.js";
import type {
  CrewGoalRecord,
  CrewGoalsReadRepository,
  CrewInviteRecord
} from "../../repositories/crew-goals-read-repository.js";

export const INVITE_RULES = [
  "The goal starts immediately when invites are sent.",
  "Only runs completed after you join can count toward this crew goal.",
  "Eligible Run and Trail Run activities add automatically after sync."
];

export function buildInvitePreviewGoal(goal: CrewGoalRecord): InviteGoalPreview {
  return {
    goalId: goal.id,
    title: goal.title,
    targetDistanceKm: goal.targetDistanceKm,
    durationDays: Math.round(diffHours(new Date(goal.startTime), new Date(goal.endTime)) / 24),
    currentJoinedMemberCount: goal.members.length,
    pendingInviteCount: goal.pendingInvites.length,
    startTime: goal.startTime,
    endTime: goal.endTime
  };
}

export function buildInviterAvatar(
  repository: CrewGoalsReadRepository,
  inviterId: string
): MemberAvatar {
  const inviter = repository.getUserById(inviterId);

  return {
    id: inviter.id,
    displayName: inviter.displayName,
    avatarUrl: inviter.avatarUrl
  };
}

export function getInviteGoal(
  repository: CrewGoalsReadRepository,
  invite: CrewInviteRecord
): CrewGoalRecord {
  const goal = repository.getGoalById(invite.goalId);

  if (!goal) {
    throw new Error(`Missing goal ${invite.goalId} for invite ${invite.id}`);
  }

  return goal;
}

export function resolveInviteInvalidReason(
  invite: CrewInviteRecord,
  goal: CrewGoalRecord
): InviteInvalidReason | undefined {
  if (invite.status === "ignored") {
    return "ignored";
  }

  if (goal.status === "completed") {
    return "completed";
  }

  if (goal.status === "expired") {
    return "expired";
  }

  if (goal.members.length >= goal.crewLimit) {
    return "full";
  }

  return undefined;
}

export function resolveInviteStatus(
  invite: CrewInviteRecord,
  goal: CrewGoalRecord
): InviteStatus {
  if (resolveInviteInvalidReason(invite, goal)) {
    return invite.status === "ignored" ? "ignored" : "invalid";
  }

  return invite.status;
}

export function resolveInviteAvailability(
  repository: CrewGoalsReadRepository,
  invite: CrewInviteRecord,
  goal: CrewGoalRecord
): InviteAvailability {
  if (resolveInviteInvalidReason(invite, goal)) {
    return "unavailable";
  }

  const activeGoal = repository.getActiveGoal();

  if (activeGoal && activeGoal.id !== goal.id) {
    return "blocked";
  }

  return "joinable";
}

export function buildInviteAvailability(
  repository: CrewGoalsReadRepository,
  invite: CrewInviteRecord,
  goal: CrewGoalRecord
): InviteAvailabilitySummary {
  const availability = resolveInviteAvailability(repository, invite, goal);
  const activeGoal = repository.getActiveGoal();

  return buildInviteAvailabilitySummary({
    availability,
    reasonCode:
      availability === "blocked"
        ? "active_goal_conflict"
        : resolveInviteInvalidReason(invite, goal),
    activeGoalAction: {
      label: "View Current Goal",
      href: activeGoal ? `/goals/${activeGoal.id}` : "/goals"
    },
    homeAction: {
      label: "Back to Home",
      href: "/"
    },
    goalId: goal.id
  });
}

export function buildGoalInvitePreviewResponse(
  repository: CrewGoalsReadRepository,
  invite: CrewInviteRecord,
  goal: CrewGoalRecord
): GoalInvitePreviewResponse {
  return {
    screen: "goal_invite_preview",
    goalId: goal.id,
    inviter: buildInviterAvatar(repository, invite.inviterId),
    goal: buildInvitePreviewGoal(goal),
    availability: buildInviteAvailability(repository, invite, goal),
    rules: INVITE_RULES
  };
}

export function buildInviteStatusLabel(
  status: InviteStatus,
  availability: InviteAvailability,
  reasonCode?: InviteInvalidReason
): string {
  if (availability === "blocked") {
    return "Join unavailable while your current goal is active";
  }

  if (status === "invalid" || status === "ignored") {
    if (reasonCode === "full") {
      return "Goal is full";
    }

    if (reasonCode === "completed") {
      return "Goal completed";
    }

    if (reasonCode === "ignored") {
      return "Invite dismissed";
    }

    return "Goal expired";
  }

  return "Waiting for your response";
}

export function buildInviteDetailResponse(
  repository: CrewGoalsReadRepository,
  invite: CrewInviteRecord,
  goal: CrewGoalRecord
): InviteDetailResponse {
  return {
    screen: "invite_detail",
    inviteId: invite.id,
    status: resolveInviteStatus(invite, goal),
    inviter: buildInviterAvatar(repository, invite.inviterId),
    goal: buildInvitePreviewGoal(goal),
    availability: buildInviteAvailability(repository, invite, goal),
    rules: INVITE_RULES
  };
}
