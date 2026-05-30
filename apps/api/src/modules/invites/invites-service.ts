import type {
  InviteDetailResponse,
  InviteListItem,
  InvitesListResponse
} from "../../../../../packages/shared/src/index.js";

import type {
  CrewGoalsReadRepository,
  CrewInviteRecord
} from "../../repositories/crew-goals-read-repository.js";
import {
  buildInviteDetailResponse,
  buildInviteStatusLabel,
  getInviteGoal,
  resolveInviteAvailability,
  resolveInviteInvalidReason,
  resolveInviteStatus
} from "./invite-read-models.js";

export function createInvitesService(repository: CrewGoalsReadRepository) {
  return {
    listInvites(): InvitesListResponse {
      const items = repository.listInvites().map((invite) => buildInviteListItem(repository, invite));

      return {
        screen: "invites_list",
        title: "Crew Goal Invites",
        subtitle:
          "Pending, blocked, and unavailable invite states are all resolved by the API from the goal status and your active-goal eligibility.",
        items
      };
    },

    getInviteDetail(inviteId: string): InviteDetailResponse | null {
      const invite = repository.getInviteById(inviteId);

      if (!invite) {
        return null;
      }

      return buildInviteDetailResponse(repository, invite, getInviteGoal(repository, invite));
    }
  };
}

function buildInviteListItem(
  repository: CrewGoalsReadRepository,
  invite: CrewInviteRecord
): InviteListItem {
  const inviter = repository.getUserById(invite.inviterId);
  const goal = getInviteGoal(repository, invite);
  const availability = resolveInviteAvailability(repository, invite, goal);
  const status = resolveInviteStatus(invite, goal);
  const reasonCode = resolveInviteInvalidReason(invite, goal);

  return {
    inviteId: invite.id,
    goalId: goal.id,
    title: goal.title,
    inviter: {
      id: inviter.id,
      displayName: inviter.displayName,
      avatarUrl: inviter.avatarUrl
    },
    targetDistanceKm: goal.targetDistanceKm,
    durationDays: Math.round(
      (new Date(goal.endTime).getTime() - new Date(goal.startTime).getTime()) /
        (24 * 60 * 60 * 1000)
    ),
    currentJoinedMemberCount: goal.members.length,
    pendingInviteCount: goal.pendingInvites.length,
    status,
    availability,
    statusLabel: buildInviteStatusLabel(status, availability, reasonCode),
    distanceLabel: `${goal.targetDistanceKm} km in ${Math.round(
      (new Date(goal.endTime).getTime() - new Date(goal.startTime).getTime()) /
        (24 * 60 * 60 * 1000)
    )} days`,
    sentAt: invite.createdAt,
    expiresAt: invite.expiresAt,
    currentMembersLabel: `${goal.members.length} joined, ${goal.pendingInvites.length} pending`
  };
}
