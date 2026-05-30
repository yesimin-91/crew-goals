import {
  formatDateLabel,
  formatDistanceKm,
  formatPercent,
  formatRelativeTime,
  getDaysLeft,
  getInitials
} from "../../lib/formatters";
import type { GoalDetail, GoalMember, GoalSummary, RecentActivity } from "../../types/crewGoals";

function getProgressPercent(totalDistanceKm: number, targetDistanceKm: number) {
  if (targetDistanceKm <= 0) {
    return 0;
  }

  return Math.min(100, (totalDistanceKm / targetDistanceKm) * 100);
}

function getGoalStatusLabel(goal: GoalSummary) {
  if (goal.status === "completed") {
    return "Goal completed";
  }

  if (goal.status === "expired") {
    return "Goal expired";
  }

  const totalDurationMs = new Date(goal.endTime).getTime() - new Date(goal.startTime).getTime();
  const elapsedMs = Date.now() - new Date(goal.startTime).getTime();
  const elapsedPercent =
    totalDurationMs <= 0 ? 100 : Math.max(0, Math.min(100, (elapsedMs / totalDurationMs) * 100));
  const progressPercent = getProgressPercent(goal.totalDistanceKm, goal.targetDistanceKm);
  const remainingDistanceKm = Math.max(0, goal.targetDistanceKm - goal.totalDistanceKm);

  if (progressPercent >= elapsedPercent - 10) {
    return "On track";
  }

  return `${formatDistanceKm(remainingDistanceKm)} left`;
}

function mapMember(member: GoalMember) {
  return {
    id: member.userId,
    name: member.displayName,
    initials: getInitials(member.displayName),
    roleLabel: member.role === "creator" ? "Creator" : "Member",
    contributionLabel: formatDistanceKm(member.contributionKm)
  };
}

export function mapGoalSummaryCard(goal: GoalSummary) {
  const progressPercent = getProgressPercent(goal.totalDistanceKm, goal.targetDistanceKm);

  return {
    id: goal.id,
    title: goal.title,
    progressLabel: `${formatDistanceKm(goal.totalDistanceKm)} / ${formatDistanceKm(goal.targetDistanceKm)}`,
    progressPercent,
    progressPercentLabel: formatPercent(progressPercent),
    statusLabel: getGoalStatusLabel(goal),
    myContributionLabel: formatDistanceKm(goal.myContributionKm),
    remainingDistanceLabel: formatDistanceKm(Math.max(0, goal.targetDistanceKm - goal.totalDistanceKm)),
    daysLeftLabel: `${getDaysLeft(goal.endTime)} days left`,
    joinedMemberCountLabel: `${goal.joinedMemberCount} joined`,
    pendingInviteCountLabel: `${goal.pendingInviteCount} pending`
  };
}

export function mapGoalDetailView(goal: GoalDetail, activities: RecentActivity[]) {
  const summary = mapGoalSummaryCard(goal);

  return {
    ...summary,
    timelineLabel: `${formatDateLabel(goal.startTime)} to ${formatDateLabel(goal.endTime)}`,
    crewSizeLabel: `${goal.crewSize} people intended`,
    members: goal.joinedMembers.map(mapMember),
    pendingInvites: goal.pendingInvites.map((invite) => ({
      id: invite.inviteId,
      name: invite.displayName,
      initials: getInitials(invite.displayName),
      invitedLabel: `Invited ${formatRelativeTime(invite.invitedAt)}`
    })),
    recentActivities: activities.slice(0, 3).map((activity) => ({
      id: activity.id,
      athleteName: activity.athleteName,
      athleteInitials: getInitials(activity.athleteName),
      headline: `${activity.athleteName} added ${formatDistanceKm(activity.distanceKm)}`,
      detail: `${activity.activityType} synced ${formatRelativeTime(activity.syncedAt)}`
    }))
  };
}

export type GoalSummaryCardView = ReturnType<typeof mapGoalSummaryCard>;
export type GoalDetailView = ReturnType<typeof mapGoalDetailView>;
