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
  AcceptInviteResponse,
  CreateGoalResponse,
  GoalDistanceRecommendationResponse,
  GoalRecommendationTier,
  GoalDetailResponse,
  GoalsHubResponse,
  HomeEntryResponse,
  InviteDetailResponse,
  InvitesListResponse,
  IgnoreInviteResponse,
  PostRunContributionResponse,
  GoalReadResponse
} from "../../../../packages/shared/src/index";

const mockRecommendationDistances: Record<GoalRecommendationTier, number> = {
  easy: 42,
  recommended: 56,
  stretch: 67.2
};

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

type MockInviteListItemBase = Omit<
  InvitesListResponse["items"][number],
  "status" | "availability" | "statusLabel"
>;

const inviteJoinableBase = {
  inviteId: "invite-joinable",
  goalId: "goal-sam-weekly",
  title: "Sam + Iris Crew",
  inviter: { id: "sam", displayName: "Sam Rivera", avatarUrl: "/mock/avatars/sam.png" },
  targetDistanceKm: 42,
  durationDays: 7,
  currentJoinedMemberCount: 2,
  pendingInviteCount: 1,
  distanceLabel: "42 km in 7 days",
  sentAt: "2026-05-25T06:03:00.000Z",
  expiresAt: "2026-06-02T06:00:00.000Z",
  currentMembersLabel: "2 joined, 1 pending"
} satisfies MockInviteListItemBase;

const inviteConflictBase = {
  inviteId: "invite-conflict",
  goalId: "goal-kai-weekly",
  title: "Kai + 2 Crew",
  inviter: { id: "kai", displayName: "Kai Morgan", avatarUrl: "/mock/avatars/kai.png" },
  targetDistanceKm: 60,
  durationDays: 7,
  currentJoinedMemberCount: 3,
  pendingInviteCount: 1,
  distanceLabel: "60 km in 7 days",
  sentAt: "2026-05-25T06:03:00.000Z",
  expiresAt: "2026-06-01T20:00:00.000Z",
  currentMembersLabel: "3 joined, 1 pending"
} satisfies MockInviteListItemBase;

const inviteJoinableDetailBase = {
  screen: "invite_detail",
  inviteId: "invite-joinable",
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
} satisfies Omit<InviteDetailResponse, "status">;

const goalDetailResponses: Record<string, GoalReadResponse> = {
  "goal-nora-weekly": goalDetailResponse,
  "goal-sam-weekly": {
    ...goalDetailResponse,
    goalId: "goal-sam-weekly",
    title: "Sam + Iris Crew",
    progress: {
      totalDistanceKm: 12.4,
      targetDistanceKm: 42,
      percentComplete: 29.5,
      remainingDistanceKm: 29.6,
      trackState: "on_track",
      statusLabel: "On track"
    },
    timeline: {
      startTime: "2026-05-26T06:00:00.000Z",
      endTime: "2026-06-02T06:00:00.000Z",
      totalDays: 7,
      daysLeft: 3,
      hoursLeft: 72,
      remainingLabel: "3 days left"
    },
    myContributionKm: 4.2,
    crew: {
      joinedMemberCount: 2,
      pendingInviteCount: 1,
      crewLimit: 3
    },
    members: [
      {
        id: "sam",
        displayName: "Sam Rivera",
        avatarUrl: "/mock/avatars/sam.png",
        role: "creator",
        joinedAt: "2026-05-26T06:00:00.000Z",
        contributionKm: 8.2,
        contributionLabel: "8.2 km contributed"
      },
      {
        id: "mia",
        displayName: "Mia Chen",
        avatarUrl: "/mock/avatars/mia.png",
        role: "member",
        joinedAt: "2026-05-27T04:30:00.000Z",
        contributionKm: 4.2,
        contributionLabel: "4.2 km contributed"
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
        sentAt: "2026-05-26T06:03:00.000Z",
        expiresAt: "2026-06-02T06:00:00.000Z"
      }
    ],
    recentActivity: [
      {
        activityId: "activity-2",
        member: {
          id: "sam",
          displayName: "Sam Rivera",
          avatarUrl: "/mock/avatars/sam.png"
        },
        activityType: "trail_run",
        distanceKm: 4.2,
        happenedAt: "2026-05-29T02:10:00.000Z",
        syncedAt: "2026-05-29T02:10:00.000Z",
        relativeSyncLabel: "1 hour ago"
      }
    ]
  },
  "goal-completed-weekly": {
    ...goalDetailResponse,
    goalId: "goal-completed-weekly",
    title: "Mia + 2 Crew",
    status: "completed",
    progress: {
      totalDistanceKm: 56,
      targetDistanceKm: 56,
      percentComplete: 100,
      remainingDistanceKm: 0,
      trackState: "completed",
      statusLabel: "Goal completed"
    },
    timeline: {
      startTime: "2026-05-23T06:00:00.000Z",
      endTime: "2026-05-30T06:00:00.000Z",
      totalDays: 7,
      daysLeft: 0,
      hoursLeft: 0,
      remainingLabel: "Completed"
    },
    myContributionKm: 18.4,
    crew: {
      joinedMemberCount: 3,
      pendingInviteCount: 0,
      crewLimit: 3
    },
    members: [
      {
        id: "mia",
        displayName: "Mia Chen",
        avatarUrl: "/mock/avatars/mia.png",
        role: "creator",
        joinedAt: "2026-05-23T06:00:00.000Z",
        contributionKm: 21.4,
        contributionLabel: "21.4 km contributed"
      },
      {
        id: "nora",
        displayName: "Nora Lee",
        avatarUrl: "/mock/avatars/nora.png",
        role: "member",
        joinedAt: "2026-05-23T08:30:00.000Z",
        contributionKm: 18.4,
        contributionLabel: "18.4 km contributed"
      },
      {
        id: "sam",
        displayName: "Sam Rivera",
        avatarUrl: "/mock/avatars/sam.png",
        role: "member",
        joinedAt: "2026-05-24T03:20:00.000Z",
        contributionKm: 16.2,
        contributionLabel: "16.2 km contributed"
      }
    ],
    pendingInvites: [],
    recentActivity: [
      {
        activityId: "activity_goal_locked",
        member: {
          id: "nora",
          displayName: "Nora Lee",
          avatarUrl: "/mock/avatars/nora.png"
        },
        activityType: "run",
        distanceKm: 6.1,
        happenedAt: "2026-05-30T04:12:00.000Z",
        syncedAt: "2026-05-30T04:18:00.000Z",
        relativeSyncLabel: "locked"
      }
    ]
  }
};

const goalResultResponses = {
  "goal-completed-weekly": {
    screen: "goal_result",
    goalId: "goal-completed-weekly",
    currentUserId: "mia",
    status: "completed",
    title: "Mia + 2 Crew",
    totalDistanceKm: 56,
    targetDistanceKm: 56,
    finalDistanceKm: 56,
    daysUsedLabel: "7 days",
    resultLockedAt: "2026-05-30T06:00:00.000Z",
    members: [
      {
        id: "mia",
        displayName: "Mia Chen",
        avatarUrl: "/mock/avatars/mia.png",
        contributionKm: 21.4
      },
      {
        id: "nora",
        displayName: "Nora Lee",
        avatarUrl: "/mock/avatars/nora.png",
        contributionKm: 18.4
      },
      {
        id: "sam",
        displayName: "Sam Rivera",
        avatarUrl: "/mock/avatars/sam.png",
        contributionKm: 16.2
      }
    ],
    primaryAction: {
      label: "Share Result",
      href: "/goals/goal-completed-weekly/share-result",
      kind: "primary"
    },
    secondaryAction: {
      label: "Start Another Goal",
      href: "/goals/create",
      kind: "secondary"
    }
  },
  "goal-expired-weekly": {
    screen: "goal_result",
    goalId: "goal-expired-weekly",
    currentUserId: "mia",
    status: "expired",
    title: "Mia + 2 Crew",
    totalDistanceKm: 41.5,
    targetDistanceKm: 56,
    finalDistanceKm: 41.5,
    daysUsedLabel: "7 days",
    resultLockedAt: "2026-05-30T06:00:00.000Z",
    members: [
      {
        id: "mia",
        displayName: "Mia Chen",
        avatarUrl: "/mock/avatars/mia.png",
        contributionKm: 17.2
      },
      {
        id: "nora",
        displayName: "Nora Lee",
        avatarUrl: "/mock/avatars/nora.png",
        contributionKm: 14.3
      },
      {
        id: "sam",
        displayName: "Sam Rivera",
        avatarUrl: "/mock/avatars/sam.png",
        contributionKm: 10
      }
    ],
    primaryAction: {
      label: "Start Another Goal",
      href: "/goals/create",
      kind: "primary"
    }
  }
} satisfies Record<string, import("../../../../packages/shared/src/index").GoalResultResponse>;

const postRunResponses: Record<string, PostRunContributionResponse> = {
  activity_counted: {
    screen: "post_run",
    activityId: "activity_counted",
    state: "counted",
    message: "Contribution counted",
    goal: {
      goalId: "goal-nora-weekly",
      title: "Mia + 2 Crew",
      status: "active",
      totalDistanceKm: 34.2,
      targetDistanceKm: 56,
      remainingDistanceKm: 21.8
    }
  },
  activity_already_counted: {
    screen: "post_run",
    activityId: "activity_already_counted",
    state: "already_counted",
    message: "Already counted",
    goal: {
      goalId: "goal-nora-weekly",
      title: "Mia + 2 Crew",
      status: "active",
      totalDistanceKm: 34.2,
      targetDistanceKm: 56,
      remainingDistanceKm: 21.8
    }
  },
  activity_not_counted: {
    screen: "post_run",
    activityId: "activity_not_counted",
    state: "not_counted",
    message: "Could not update crew progress yet",
    goal: {
      goalId: "goal-nora-weekly",
      title: "Mia + 2 Crew",
      status: "active",
      totalDistanceKm: 34.2,
      targetDistanceKm: 56,
      remainingDistanceKm: 21.8
    }
  },
  activity_goal_locked: {
    screen: "post_run",
    activityId: "activity_goal_locked",
    state: "goal_locked",
    message: "Goal result is already locked",
    goal: {
      goalId: "goal-completed-weekly",
      title: "Mia + 2 Crew",
      status: "completed",
      totalDistanceKm: 56,
      targetDistanceKm: 56,
      remainingDistanceKm: 0,
      resultLockedAt: "2026-05-30T06:00:00.000Z"
    }
  }
};

const inviteDetailResponses: Record<string, InviteDetailResponse> = {
  "invite-joinable": {
    ...inviteJoinableDetailBase,
    status: "pending"
  },
  "invite-conflict": {
    screen: "invite_detail",
    inviteId: "invite-conflict",
    status: "pending",
    inviter: { id: "kai", displayName: "Kai Morgan", avatarUrl: "/mock/avatars/kai.png" },
    goal: {
      goalId: "goal-kai-weekly",
      title: "Kai + 2 Crew",
      targetDistanceKm: 60,
      durationDays: 7,
      currentJoinedMemberCount: 3,
      pendingInviteCount: 1,
      startTime: "2026-05-25T06:00:00.000Z",
      endTime: "2026-06-01T20:00:00.000Z"
    },
    availability: {
      state: "blocked",
      reasonCode: "active_goal_conflict",
      currentUserActiveGoalId: "goal-nora-weekly",
      headline: "Join unavailable while your current goal is active",
      body: "You already have an active goal, so this invite is view-only until that goal ends.",
      primaryAction: { label: "View active goal", href: "/goals/goal-nora-weekly", kind: "primary" },
      secondaryAction: { label: "Not now", href: "/invites", kind: "ghost" }
    },
    rules: [
      "The goal starts immediately when invites are sent.",
      "Only runs completed after you join can count toward this crew goal.",
      "Eligible Run and Trail Run activities add automatically after sync."
    ]
  }
};

let mockInviteStatusById: Record<string, "pending" | "accepted" | "ignored"> = {
  "invite-joinable": "pending",
  "invite-conflict": "pending"
};

function getInviteStatus(inviteId: string) {
  return mockInviteStatusById[inviteId] ?? "pending";
}

function getInviteListResponse(): InvitesListResponse {
  const joinableStatus = getInviteStatus("invite-joinable");
  const conflictStatus = getInviteStatus("invite-conflict");
  const items: InvitesListResponse["items"] = [
    {
      ...inviteJoinableBase,
      status: joinableStatus,
      availability: "joinable",
      statusLabel: joinableStatus === "ignored" ? "Invite closed" : "Waiting for your response"
    },
    {
      ...inviteConflictBase,
      status: conflictStatus,
      availability: "blocked",
      statusLabel:
        conflictStatus === "ignored"
          ? "Invite closed"
          : "Join unavailable while your current goal is active"
    }
  ];

  return {
    screen: "invites_list",
    title: "Crew Goal Invites",
    subtitle: "Pending, blocked, and unavailable invite states are all resolved by the API from the goal status and your active-goal eligibility.",
    items: items.filter((item) => item.status !== "accepted")
  };
}

function getInviteDetailResponse(inviteId: string): InviteDetailResponse | null {
  const base = inviteDetailResponses[inviteId];
  if (!base) {
    return null;
  }

  return {
    ...base,
    status: getInviteStatus(inviteId)
  };
}

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
      const response = goalDetailResponses[goalId];
      if (!response) {
        throw new ApiError(`Mock goal ${goalId} is unavailable`, 404);
      }

      return mapGoalReadResponse(response);
    },
    async getRecentActivities(goalId, signal) {
      await waitFor(signal);
      const response = goalDetailResponses[goalId];
      if (!response) {
        return [];
      }

      return mapGoalRecentActivity(response).map((activity) => activity);
    },
    async getPostRunContribution(activityId, signal) {
      await waitFor(signal);

      if (activityId === "activity_updating") {
        return {
          screen: "post_run",
          activityId,
          state: "updating",
          message: "Updating crew progress"
        };
      }

      const response =
        postRunResponses[activityId] ??
        (activityId === "activity-1"
          ? postRunResponses.activity_counted
          : activityId === "activity-2"
            ? postRunResponses.activity_counted
            : undefined);

      if (!response) {
        throw new ApiError(`Mock activity ${activityId} is unavailable`, 404);
      }

      return {
        ...response,
        activityId
      };
    },
    async getGoalResult(goalId, signal) {
      await waitFor(signal);
      const response = goalResultResponses[goalId as keyof typeof goalResultResponses];

      if (!response) {
        throw new ApiError(`Mock goal result ${goalId} is unavailable`, 404);
      }

      return response;
    },
    async listInvites(signal) {
      await waitFor(signal);
      return mapInvitesListResponse(getInviteListResponse());
    },
    async getInvite(inviteId, signal) {
      await waitFor(signal);
      const response = getInviteDetailResponse(inviteId);
      if (!response) {
        throw new ApiError(`Mock invite ${inviteId} is unavailable`, 404);
      }

      return mapInviteDetailResponse(response);
    },
    async acceptInvite(inviteId) {
      await waitFor();
      const response = getInviteDetailResponse(inviteId);
      if (!response) {
        throw new ApiError(`Mock invite ${inviteId} is unavailable`, 404, "not_found");
      }

      mockInviteStatusById = {
        ...mockInviteStatusById,
        [inviteId]: "accepted"
      };

      return {
        screen: "invite_accepted",
        inviteId,
        goalId: response.goal.goalId,
        detailHref: `/goals/${response.goal.goalId}`
      } satisfies AcceptInviteResponse;
    },
    async ignoreInvite(inviteId) {
      await waitFor();
      const response = getInviteDetailResponse(inviteId);
      if (!response) {
        throw new ApiError(`Mock invite ${inviteId} is unavailable`, 404, "not_found");
      }

      mockInviteStatusById = {
        ...mockInviteStatusById,
        [inviteId]: "ignored"
      };

      return {
        screen: "invite_ignored",
        inviteId
      } satisfies IgnoreInviteResponse;
    },
    async getGoalDistanceRecommendation(selectedFriendIds, signal) {
      await waitFor(signal);

      return {
        screen: "goal_recommendation",
        durationDays: 7,
        selectedFriendIds,
        options: [
          {
            tier: "easy",
            label: "Easy",
            distanceKm: mockRecommendationDistances.easy,
            description: "A lighter week for building the habit together."
          },
          {
            tier: "recommended",
            label: "Recommended",
            distanceKm: mockRecommendationDistances.recommended,
            description: "Matches the crew's current weekly rhythm."
          },
          {
            tier: "stretch",
            label: "Stretch",
            distanceKm: mockRecommendationDistances.stretch,
            description: "A bigger push if the whole crew is feeling good."
          }
        ],
        defaultSelectedTier: "recommended",
        source: selectedFriendIds.length > 1 ? "recent_training" : "default",
        explanation:
          selectedFriendIds.length > 1
            ? "Based on the selected crew's recent weekly Run and Trail Run distance."
            : "Using the default weekly distance presets because recent training data is limited."
      } satisfies GoalDistanceRecommendationResponse;
    },
    async createGoal() {
      await waitFor();

      return {
        screen: "goal_created",
        goalId: goalDetailResponse.goalId,
        detailHref: `/goals/${goalDetailResponse.goalId}`,
        inviteIds: ["invite-jules"]
      } satisfies CreateGoalResponse;
    }
  };
}
