import type {
  GoalDetailResponse,
  GoalsHubResponse,
  GoalReadResponse,
  HomeEntryResponse,
  InviteAvailability,
  InviteDetailResponse,
  InvitesListResponse,
  RecentGoalActivity
} from "../../../../packages/shared/src/index";

import type {
  EntryOverview,
  GoalDetail,
  GoalMember,
  GoalSummary,
  InviteAvailabilityReason,
  InviteDetail,
  InviteListItem,
  PendingInvite,
  RecentActivity
} from "../types/crewGoals";

function mapAvailabilityReason(input: {
  availability?: InviteAvailability;
  reasonCode?: InviteAvailabilityReason;
  status?: "pending" | "accepted" | "ignored" | "invalid";
}): InviteAvailabilityReason | undefined {
  if (input.reasonCode) {
    return input.reasonCode;
  }

  if (input.availability === "blocked") {
    return "active_goal_conflict";
  }

  if (input.status === "ignored") {
    return "ignored";
  }

  return undefined;
}

function mapGoalMembers(members: GoalDetailResponse["members"]): GoalMember[] {
  return members.map((member) => ({
    userId: member.id,
    displayName: member.displayName,
    role: member.role,
    joinTime: member.joinedAt,
    contributionKm: member.contributionKm
  }));
}

function mapPendingInvites(
  pendingInvites: GoalDetailResponse["pendingInvites"]
): PendingInvite[] {
  return pendingInvites.map((invite) => ({
    inviteId: invite.inviteId,
    displayName: invite.invitee.displayName,
    invitedAt: invite.sentAt
  }));
}

function mapRecentActivity(activity: RecentGoalActivity): RecentActivity {
  return {
    id: activity.activityId,
    athleteName: activity.member.displayName,
    distanceKm: activity.distanceKm,
    activityType: activity.activityType === "run" ? "Run" : "Trail Run",
    syncedAt: activity.syncedAt
  };
}

export function mapHomeEntryOverview(response: HomeEntryResponse): EntryOverview {
  return {
    headline: response.headline,
    subheadline: response.subheadline,
    rules: response.rules,
    highlights: response.highlights
  };
}

export function mapGoalsHubResponse(response: GoalsHubResponse): GoalSummary | null {
  if (response.state !== "active_goal" || !response.activeGoal) {
    return null;
  }

  const goal = response.activeGoal;

  return {
    id: goal.goalId,
    title: goal.title,
    status: goal.status,
    targetDistanceKm: goal.progress.targetDistanceKm,
    totalDistanceKm: goal.progress.totalDistanceKm,
    myContributionKm: goal.myContributionKm,
    joinedMemberCount: goal.crew.joinedMemberCount,
    pendingInviteCount: goal.crew.pendingInviteCount,
    crewSize: goal.crew.crewLimit,
    startTime: goal.timeline.startTime,
    endTime: goal.timeline.endTime
  };
}

function assertGoalDetailResponse(response: GoalReadResponse): GoalDetailResponse {
  if (response.screen !== "goal_detail") {
    throw new Error(`Expected goal detail payload, received ${response.screen}`);
  }

  return response;
}

export function mapGoalReadResponse(response: GoalReadResponse): GoalDetail {
  const detail = assertGoalDetailResponse(response);

  return {
    id: detail.goalId,
    title: detail.title,
    status: detail.status,
    targetDistanceKm: detail.progress.targetDistanceKm,
    totalDistanceKm: detail.progress.totalDistanceKm,
    myContributionKm: detail.myContributionKm,
    joinedMemberCount: detail.crew.joinedMemberCount,
    pendingInviteCount: detail.crew.pendingInviteCount,
    crewSize: detail.crew.crewLimit,
    startTime: detail.timeline.startTime,
    endTime: detail.timeline.endTime,
    joinedMembers: mapGoalMembers(detail.members),
    pendingInvites: mapPendingInvites(detail.pendingInvites)
  };
}

export function mapGoalRecentActivity(response: GoalReadResponse): RecentActivity[] {
  const detail = assertGoalDetailResponse(response);
  return detail.recentActivity.map(mapRecentActivity);
}

export function mapInvitesListResponse(response: InvitesListResponse): InviteListItem[] {
  return response.items.map((item) => ({
    id: item.inviteId,
    goalId: item.goalId,
    goalTitle: item.title,
    inviterName: item.inviter.displayName,
    targetDistanceKm: item.targetDistanceKm,
    durationDays: item.durationDays,
    currentMemberCount: item.currentJoinedMemberCount,
    status: item.status,
    availabilityReason: mapAvailabilityReason({
      availability: item.availability,
      status: item.status
    }),
    endTime: item.expiresAt
  }));
}

export function mapInviteDetailResponse(response: InviteDetailResponse): InviteDetail {
  return {
    id: response.inviteId,
    goalId: response.goal.goalId,
    goalTitle: response.goal.title,
    inviterName: response.inviter.displayName,
    targetDistanceKm: response.goal.targetDistanceKm,
    durationDays: response.goal.durationDays,
    currentMemberCount: response.goal.currentJoinedMemberCount,
    joinedMemberCount: response.goal.currentJoinedMemberCount,
    pendingInviteCount: response.goal.pendingInviteCount,
    status: response.status,
    availabilityReason: mapAvailabilityReason({
      availability: response.availability.state,
      reasonCode: response.availability.reasonCode,
      status: response.status
    }),
    currentUserHasActiveGoal: response.availability.reasonCode === "active_goal_conflict",
    currentUserActiveGoalId: response.availability.currentUserActiveGoalId,
    startTime: response.goal.startTime,
    endTime: response.goal.endTime
  };
}
