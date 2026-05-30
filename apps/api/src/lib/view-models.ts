import type {
  GoalProgressSummary,
  GoalStatus,
  GoalTimelineSummary,
  GoalTrackState,
  InviteAvailability,
  InviteAvailabilitySummary,
  InviteInvalidReason,
  ScreenAction
} from "../../../../packages/shared/src/index.js";

import { buildRemainingLabel, diffHours, toOneDecimal } from "./time.js";

export function buildGoalProgressSummary(input: {
  totalDistanceKm: number;
  targetDistanceKm: number;
  status: GoalStatus;
  startTime: Date;
  endTime: Date;
  now: Date;
}): GoalProgressSummary {
  const { totalDistanceKm, targetDistanceKm, status, startTime, endTime, now } =
    input;

  const percentComplete = toOneDecimal((totalDistanceKm / targetDistanceKm) * 100);
  const remainingDistanceKm = Math.max(0, toOneDecimal(targetDistanceKm - totalDistanceKm));

  let trackState: GoalTrackState;
  let statusLabel: string;

  if (status === "completed") {
    trackState = "completed";
    statusLabel = "Goal completed";
  } else if (status === "expired") {
    trackState = "expired";
    statusLabel = "Goal expired";
  } else {
    const totalHours = diffHours(startTime, endTime);
    const elapsedHours = Math.min(totalHours, diffHours(startTime, now));
    const expectedProgress = totalHours === 0 ? 0 : (elapsedHours / totalHours) * 100;
    const onTrack = percentComplete >= expectedProgress - 10;

    trackState = onTrack ? "on_track" : "behind";
    statusLabel = onTrack ? "On track" : `${remainingDistanceKm} km left`;
  }

  return {
    totalDistanceKm: toOneDecimal(totalDistanceKm),
    targetDistanceKm: toOneDecimal(targetDistanceKm),
    percentComplete,
    remainingDistanceKm,
    trackState,
    statusLabel
  };
}

export function buildGoalTimelineSummary(input: {
  startTime: Date;
  endTime: Date;
  now: Date;
}): GoalTimelineSummary {
  const { startTime, endTime, now } = input;
  const totalHours = diffHours(startTime, endTime);
  const hoursLeft = Math.ceil(diffHours(now, endTime));

  return {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    totalDays: Math.round(totalHours / 24),
    daysLeft: Math.ceil(hoursLeft / 24),
    hoursLeft,
    remainingLabel: buildRemainingLabel(hoursLeft)
  };
}

export function buildInviteAvailabilitySummary(input: {
  availability: InviteAvailability;
  reasonCode?: InviteInvalidReason;
  activeGoalAction: ScreenAction;
  homeAction: ScreenAction;
  goalId: string;
}): InviteAvailabilitySummary {
  const { availability, reasonCode, activeGoalAction, homeAction, goalId } = input;

  if (availability === "joinable") {
    return {
      state: "joinable",
      headline: "Join this 7-day crew goal",
      body: "Only runs completed after you join will count, and the team progress updates automatically after sync.",
      primaryAction: {
        label: "Join Goal",
        href: `/goals/${goalId}`,
        kind: "primary"
      },
      secondaryAction: {
        label: "Not now",
        href: "/invites",
        kind: "ghost"
      }
    };
  }

  if (availability === "blocked") {
    return {
      state: "blocked",
      headline: "You already have an active crew goal",
      body: "Finish or expire your current weekly crew goal before joining another one.",
      reasonCode,
      currentUserActiveGoalId:
        reasonCode === "active_goal_conflict"
          ? activeGoalAction.href.split("/").pop()
          : undefined,
      primaryAction: {
        ...activeGoalAction,
        kind: "primary"
      },
      secondaryAction: {
        label: "Back to invites",
        href: "/invites",
        kind: "ghost"
      }
    };
  }

  const unavailableBody =
    reasonCode === "full"
      ? "This goal already reached its crew limit, so new members can no longer join."
      : reasonCode === "completed"
        ? "This goal has already been completed and the result is locked."
        : reasonCode === "ignored"
          ? "This invite is no longer available because it was already dismissed."
          : "This invite is no longer available because the crew goal ended.";

  return {
    state: "unavailable",
    headline: "This invite is no longer available",
    body: unavailableBody,
    reasonCode,
    primaryAction: {
      ...homeAction,
      kind: "primary"
    },
    secondaryAction: {
      label: "View Goals",
      href: "/goals",
      kind: "ghost"
    }
  };
}
