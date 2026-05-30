import type {
  AcceptInviteResponse,
  IgnoreInviteResponse
} from "../../../../../packages/shared/src/index.js";

import type {
  CrewGoalsWriteRepository,
  CrewInviteRecord
} from "../../repositories/crew-goals-read-repository.js";
import {
  getInviteGoal,
  resolveInviteAvailability,
  resolveInviteInvalidReason
} from "./invite-read-models.js";

type InviteActionFailureCode =
  | "not_found"
  | "ignored"
  | "full"
  | "completed"
  | "expired"
  | "active_goal_conflict"
  | "invite_unavailable";

export function createInviteActionsService(repository: CrewGoalsWriteRepository) {
  return {
    acceptInvite(inviteId: string): AcceptInviteResponse {
      const invite = requireInvite(repository, inviteId);

      if (invite.status !== "pending") {
        throw inviteActionError("invite_unavailable");
      }

      const goal = getInviteGoal(repository, invite);

      const blockedReason = resolveBlockedReason(repository, invite, goal);

      if (blockedReason) {
        throw inviteActionError(blockedReason);
      }

      const result = runInviteWrite(() => repository.acceptInvite(inviteId));

      return {
        screen: "invite_accepted",
        inviteId: result.inviteId,
        goalId: result.goalId,
        detailHref: `/goals/${result.goalId}`
      };
    },

    ignoreInvite(inviteId: string): IgnoreInviteResponse {
      const invite = requireInvite(repository, inviteId);

      if (invite.status !== "pending") {
        throw inviteActionError("invite_unavailable");
      }

      const goal = getInviteGoal(repository, invite);

      if (resolveInviteInvalidReason(invite, goal)) {
        throw inviteActionError("invite_unavailable");
      }

      runInviteWrite(() => repository.ignoreInvite(inviteId));

      return {
        screen: "invite_ignored",
        inviteId
      };
    }
  };
}

function requireInvite(
  repository: CrewGoalsWriteRepository,
  inviteId: string
): CrewInviteRecord {
  const invite = repository.getInviteById(inviteId);

  if (!invite) {
    throw inviteActionError("not_found");
  }

  return invite;
}

function resolveBlockedReason(
  repository: CrewGoalsWriteRepository,
  invite: CrewInviteRecord,
  goal = getInviteGoal(repository, invite)
): string | null {
  const invalidReason = resolveInviteInvalidReason(invite, goal);

  if (invalidReason) {
    return invalidReason;
  }

  return resolveInviteAvailability(repository, invite, goal) === "blocked"
    ? "active_goal_conflict"
    : null;
}

function inviteActionError(code: string) {
  const error = new Error(code);
  (error as Error & { code: InviteActionFailureCode }).code = code as InviteActionFailureCode;
  return error;
}

function runInviteWrite<T>(write: () => T): T {
  try {
    return write();
  } catch (error) {
    if (error instanceof Error && error.message === "invite_unavailable") {
      throw inviteActionError("invite_unavailable");
    }

    throw error;
  }
}
