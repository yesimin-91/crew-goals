import { fallbackOverview } from "../services/homeService";
import type { CrewGoalsApi } from "../services/crewGoalsApi";
import { ApiError } from "../services/http";
import {
  mapGoalRecentActivity,
  mapGoalReadResponse,
  mapGoalsHubResponse,
  mapHomeEntryOverview,
  mapInviteDetailResponse,
  mapInvitesListResponse
} from "../services/apiContracts";
import type {
  GoalDetailResponse,
  GoalsHubResponse,
  HomeEntryResponse,
  InviteDetailResponse,
  InvitesListResponse,
  GoalReadResponse
} from "../../../../packages/shared/src/index";

const homeEntryResponse: HomeEntryResponse = {
  screen: "home_entry",
  state: "active_goal",
  bannerLabel: "Weekly crew goal for Mia",
  headline: fallbackOverview.headline,
  subheadline: fallbackOverview.subheadline,
  rules: fallbackOverview.rules,
  highlights: fallbackOverview.highlights,
  primaryAction: { label: "Open Goal Detail", href: "/goals/goal-nora-weekly", kind: "primary" },
  secondaryAction: { label: "Goals Hub", href: "/goals", kind: "ghost" },
  activeGoal: undefined
};

const activeGoalResponse: GoalsHubResponse = {
  screen: "goals_hub",
  state: "active_goal",
  title: "Crew Goals",
  subtitle: "Your current weekly crew goal stays active while friends can still accept pending invites.",
  activeGoal: {
    goalId: "goal-nora-weekly",
    title: "Mia + 2 Crew",
    status: "active",
    progress: {
      totalDistanceKm: 34.2,
      targetDistanceKm: 56,
      percentComplete: 61.1,
      remainingDistanceKm: 21.8,
      trackState: "on_track",
      statusLabel: "On track"
    },
    timeline: {
      startTime: "2026-05-25T06:00:00.000Z",
      endTime: "2026-06-01T06:00:00.000Z",
      totalDays: 7,
      daysLeft: 2,
      hoursLeft: 48,
      remainingLabel: "2 days left"
    },
    myContributionKm: 14.8,
    crew: {
      joinedMemberCount: 2,
      pendingInviteCount: 1,
      crewLimit: 3
    }
  }
};

const goalDetailResponse: GoalDetailResponse = {
  screen: "goal_detail",
  goalId: "goal-nora-weekly",
  title: "Mia + 2 Crew",
  status: "active",
  recommendationTier: "recommended",
  recommendationSource: "recent_training",
  progress: {
    totalDistanceKm: 34.2,
    targetDistanceKm: 56,
    percentComplete: 61.1,
    remainingDistanceKm: 21.8,
    trackState: "on_track",
    statusLabel: "On track"
  },
  timeline: {
    startTime: "2026-05-25T06:00:00.000Z",
    endTime: "2026-06-01T06:00:00.000Z",
    totalDays: 7,
    daysLeft: 2,
    hoursLeft: 48,
    remainingLabel: "2 days left"
  },
  myContributionKm: 14.8,
  crew: {
    joinedMemberCount: 2,
    pendingInviteCount: 1,
    crewLimit: 3
  },
  members: [
    {
      id: "mia",
      displayName: "Mia Chen",
      avatarUrl: "/mock/avatars/mia.png",
      role: "creator",
      joinedAt: "2026-05-25T06:00:00.000Z",
      contributionKm: 19.4,
      contributionLabel: "19.4 km contributed"
    },
    {
      id: "nora",
      displayName: "Nora Lee",
      avatarUrl: "/mock/avatars/nora.png",
      role: "member",
      joinedAt: "2026-05-26T04:30:00.000Z",
      contributionKm: 14.8,
      contributionLabel: "14.8 km contributed"
    }
  ],
  pendingInvites: [
    {
      inviteId: "invite-jules",
      invitee: {
        id: "jules",
        displayName: "Jules Park",
        avatarUrl: "/mock/avatars/jules.png"
      },
      status: "pending",
      sentAt: "2026-05-25T06:03:00.000Z",
      expiresAt: "2026-06-01T06:00:00.000Z"
    }
  ],
  recentActivity: [
    {
      activityId: "activity-1",
      member: {
        id: "nora",
        displayName: "Nora Lee",
        avatarUrl: "/mock/avatars/nora.png"
      },
      activityType: "run",
      distanceKm: 8.3,
      happenedAt: "2026-05-28T02:10:00.000Z",
      syncedAt: "2026-05-28T02:10:00.000Z",
      relativeSyncLabel: "2 hours ago"
    }
  ],
  recentActivityEmptyState: undefined,
  actions: []
};

const inviteListResponse: InvitesListResponse = {
  screen: "invites_list",
  title: "Crew Goal Invites",
  subtitle: "Pending, blocked, and unavailable invite states are all resolved by the API from the goal status and your active-goal eligibility.",
  items: [
    {
      inviteId: "invite-joinable",
      goalId: "goal-sam-weekly",
      title: "Sam + Iris Crew",
      inviter: { id: "sam", displayName: "Sam Rivera", avatarUrl: "/mock/avatars/sam.png" },
      targetDistanceKm: 42,
      durationDays: 7,
      currentJoinedMemberCount: 2,
      pendingInviteCount: 1,
      status: "pending",
      availability: "joinable",
      statusLabel: "Waiting for your response",
      distanceLabel: "42 km in 7 days",
      sentAt: "2026-05-25T06:03:00.000Z",
      expiresAt: "2026-06-02T06:00:00.000Z",
      currentMembersLabel: "2 joined, 1 pending"
    },
    {
      inviteId: "invite-conflict",
      goalId: "goal-kai-weekly",
      title: "Kai + 2 Crew",
      inviter: { id: "kai", displayName: "Kai Morgan", avatarUrl: "/mock/avatars/kai.png" },
      targetDistanceKm: 60,
      durationDays: 7,
      currentJoinedMemberCount: 3,
      pendingInviteCount: 1,
      status: "pending",
      availability: "blocked",
      statusLabel: "Join unavailable while your current goal is active",
      distanceLabel: "60 km in 7 days",
      sentAt: "2026-05-25T06:03:00.000Z",
      expiresAt: "2026-06-01T20:00:00.000Z",
      currentMembersLabel: "3 joined, 1 pending"
    }
  ]
};

const inviteDetailResponse: InviteDetailResponse = {
  screen: "invite_detail",
  inviteId: "invite-joinable",
  status: "pending",
  inviter: { id: "sam", displayName: "Sam Rivera", avatarUrl: "/mock/avatars/sam.png" },
  goal: {
    goalId: "goal-sam-weekly",
    title: "Sam + Iris Crew",
    targetDistanceKm: 42,
    durationDays: 7,
    currentJoinedMemberCount: 2,
    pendingInviteCount: 1,
    startTime: "2026-05-26T06:00:00.000Z",
    endTime: "2026-06-02T06:00:00.000Z"
  },
  availability: {
    state: "joinable",
    headline: "Join this 7-day crew goal",
    body: "Only runs completed after you join will count, and the team progress updates automatically after sync.",
    primaryAction: { label: "Join Goal", href: "/goals/goal-sam-weekly", kind: "primary" },
    secondaryAction: { label: "Not now", href: "/invites", kind: "ghost" }
  },
  rules: [
    "The goal starts immediately when invites are sent.",
    "Only runs completed after you join can count toward this crew goal.",
    "Eligible Run and Trail Run activities add automatically after sync."
  ]
};

const goalReadResponse: GoalReadResponse = goalDetailResponse;

function waitFor(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 120);

    signal?.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Request aborted", "AbortError"));
    });
  });
}

export function createMockCrewGoalsApi(): CrewGoalsApi {
  return {
    async getHomeEntryOverview(signal) {
      await waitFor(signal);
      return mapHomeEntryOverview(homeEntryResponse);
    },
    async getActiveGoalSummary(signal) {
      await waitFor(signal);
      return mapGoalsHubResponse(activeGoalResponse);
    },
    async getGoalDetail(goalId, signal) {
      await waitFor(signal);
      if (goalId !== goalDetailResponse.goalId) {
        throw new ApiError(`Mock goal ${goalId} is unavailable`, 404);
      }

      return mapGoalReadResponse(goalReadResponse);
    },
    async getRecentActivities(goalId, signal) {
      await waitFor(signal);
      if (goalId !== goalDetailResponse.goalId) {
        return [];
      }

      return mapGoalRecentActivity(goalReadResponse).map((activity) => activity);
    },
    async listInvites(signal) {
      await waitFor(signal);
      return mapInvitesListResponse(inviteListResponse);
    },
    async getInvite(inviteId, signal) {
      await waitFor(signal);
      if (inviteId !== inviteDetailResponse.inviteId) {
        throw new ApiError(`Mock invite ${inviteId} is unavailable`, 404);
      }

      return mapInviteDetailResponse(inviteDetailResponse);
    }
  };
}
