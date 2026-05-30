import type {
  GoalRecommendationTier,
  GoalStatus,
  InviteStatus,
  RecommendationSource
} from "../../../../packages/shared/src/index.js";

import { addHours, toIsoDate } from "../lib/time.js";

export type MockScenario =
  | "default"
  | "blocked"
  | "joinable"
  | "unavailable"
  | "no_active_goal";

const CREW_LIMIT = 4;

export interface MockUser {
  id: string;
  displayName: string;
  avatarUrl: string;
}

export interface MockGoalMember {
  userId: string;
  role: "creator" | "member";
  joinTime: string;
  contributionKm: number;
}

export interface MockPendingInvite {
  inviteId: string;
  inviteeId: string;
  createdAt: string;
  expiresAt: string;
}

export interface MockGoalActivity {
  activityId: string;
  userId: string;
  activityType: "run" | "trail_run";
  distanceKm: number;
  happenedAt: string;
  syncedAt: string;
}

export interface MockGoal {
  id: string;
  creatorId: string;
  title: string;
  status: GoalStatus;
  targetDistanceKm: number;
  crewLimit: number;
  startTime: string;
  endTime: string;
  recommendationTier: GoalRecommendationTier;
  recommendationSource: RecommendationSource;
  members: MockGoalMember[];
  pendingInvites: MockPendingInvite[];
  recentActivity: MockGoalActivity[];
}

export interface MockInvite {
  id: string;
  goalId: string;
  inviterId: string;
  inviteeId: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
}

export interface MockCrewGoalsDataset {
  viewerId: string;
  users: Record<string, MockUser>;
  activeGoalId?: string;
  goals: Record<string, MockGoal>;
  invites: Record<string, MockInvite>;
}

export function createMockCrewGoalsDataset(
  now: Date,
  scenario: MockScenario = "default"
): MockCrewGoalsDataset {
  const viewerId = "mia";
  const resolvedScenario = scenario === "default" ? "blocked" : scenario;
  const activeGoalStart = addHours(now, -(3 * 24 + 8));
  const activeGoalEnd = addHours(activeGoalStart, 7 * 24);
  const pendingInviteCreatedAt = addHours(activeGoalStart, 2);

  const blockedInviteStart = addHours(now, -18);
  const blockedInviteEnd = addHours(blockedInviteStart, 7 * 24);

  const joinableInviteStart = addHours(now, -20);
  const joinableInviteEnd = addHours(joinableInviteStart, 7 * 24);

  const fullGoalStart = addHours(now, -42);
  const fullGoalEnd = addHours(fullGoalStart, 7 * 24);

  const expiredInviteStart = addHours(now, -(9 * 24 + 4));
  const expiredInviteEnd = addHours(expiredInviteStart, 7 * 24);

  const goals: Record<string, MockGoal> = {
    goal_active_mia_crew: {
      id: "goal_active_mia_crew",
      creatorId: "mia",
      title: "Mia + 2 Crew",
      status: "active",
      targetDistanceKm: 45,
      crewLimit: CREW_LIMIT,
      startTime: toIsoDate(activeGoalStart),
      endTime: toIsoDate(activeGoalEnd),
      recommendationTier: "recommended",
      recommendationSource: "recent_training",
      members: [
        {
          userId: "mia",
          role: "creator",
          joinTime: toIsoDate(activeGoalStart),
          contributionKm: 18.4
        },
        {
          userId: "nora",
          role: "member",
          joinTime: toIsoDate(addHours(activeGoalStart, 10)),
          contributionKm: 15.1
        }
      ],
      pendingInvites: [
        {
          inviteId: "invite_active_isaac",
          inviteeId: "isaac",
          createdAt: toIsoDate(pendingInviteCreatedAt),
          expiresAt: toIsoDate(activeGoalEnd)
        }
      ],
      recentActivity: [
        {
          activityId: "act_mia_track_001",
          userId: "mia",
          activityType: "run",
          distanceKm: 8.2,
          happenedAt: toIsoDate(addHours(now, -30)),
          syncedAt: toIsoDate(addHours(now, -28))
        },
        {
          activityId: "act_nora_trail_004",
          userId: "nora",
          activityType: "trail_run",
          distanceKm: 10.4,
          happenedAt: toIsoDate(addHours(now, -54)),
          syncedAt: toIsoDate(addHours(now, -52))
        },
        {
          activityId: "act_mia_run_008",
          userId: "mia",
          activityType: "run",
          distanceKm: 6.5,
          happenedAt: toIsoDate(addHours(now, -75)),
          syncedAt: toIsoDate(addHours(now, -73))
        }
      ]
    },
    goal_zoe_weekly_push: {
      id: "goal_zoe_weekly_push",
      creatorId: "zoe",
      title: "Zoe + Ava Crew",
      status: "active",
      targetDistanceKm: 38,
      crewLimit: CREW_LIMIT,
      startTime: toIsoDate(
        resolvedScenario === "joinable" ? joinableInviteStart : blockedInviteStart
      ),
      endTime: toIsoDate(
        resolvedScenario === "joinable" ? joinableInviteEnd : blockedInviteEnd
      ),
      recommendationTier: "recommended",
      recommendationSource: "default",
      members: [
        {
          userId: "zoe",
          role: "creator",
          joinTime: toIsoDate(
            resolvedScenario === "joinable" ? joinableInviteStart : blockedInviteStart
          ),
          contributionKm: 13.2
        },
        {
          userId: "ava",
          role: "member",
          joinTime: toIsoDate(
            addHours(
              resolvedScenario === "joinable" ? joinableInviteStart : blockedInviteStart,
              6
            )
          ),
          contributionKm: 9.6
        }
      ],
      pendingInvites: [
        {
          inviteId: "invite_zoe_weekly_push",
          inviteeId: "mia",
          createdAt: toIsoDate(
            addHours(
              resolvedScenario === "joinable" ? joinableInviteStart : blockedInviteStart,
              2
            )
          ),
          expiresAt: toIsoDate(
            resolvedScenario === "joinable" ? joinableInviteEnd : blockedInviteEnd
          )
        }
      ],
      recentActivity: []
    },
    goal_ava_full: {
      id: "goal_ava_full",
      creatorId: "ava",
      title: "Ava + 3 Crew",
      status: "active",
      targetDistanceKm: 50,
      crewLimit: CREW_LIMIT,
      startTime: toIsoDate(fullGoalStart),
      endTime: toIsoDate(fullGoalEnd),
      recommendationTier: "stretch",
      recommendationSource: "default",
      members: [
        {
          userId: "ava",
          role: "creator",
          joinTime: toIsoDate(fullGoalStart),
          contributionKm: 16.8
        },
        {
          userId: "zoe",
          role: "member",
          joinTime: toIsoDate(addHours(fullGoalStart, 4)),
          contributionKm: 11.4
        },
        {
          userId: "liam",
          role: "member",
          joinTime: toIsoDate(addHours(fullGoalStart, 9)),
          contributionKm: 9.7
        },
        {
          userId: "isaac",
          role: "member",
          joinTime: toIsoDate(addHours(fullGoalStart, 15)),
          contributionKm: 7.2
        }
      ],
      pendingInvites: [],
      recentActivity: []
    },
    goal_liam_last_call: {
      id: "goal_liam_last_call",
      creatorId: "liam",
      title: "Liam + Ava Crew",
      status: "expired",
      targetDistanceKm: 52,
      crewLimit: CREW_LIMIT,
      startTime: toIsoDate(expiredInviteStart),
      endTime: toIsoDate(expiredInviteEnd),
      recommendationTier: "stretch",
      recommendationSource: "default",
      members: [
        {
          userId: "liam",
          role: "creator",
          joinTime: toIsoDate(expiredInviteStart),
          contributionKm: 12.5
        },
        {
          userId: "ava",
          role: "member",
          joinTime: toIsoDate(addHours(expiredInviteStart, 7)),
          contributionKm: 10.1
        }
      ],
      pendingInvites: [],
      recentActivity: []
    }
  };

  const invitesByScenario: Record<Exclude<MockScenario, "default">, Record<string, MockInvite>> = {
    blocked: {
      invite_zoe_weekly_push: {
        id: "invite_zoe_weekly_push",
        goalId: "goal_zoe_weekly_push",
        inviterId: "zoe",
        inviteeId: "mia",
        status: "pending",
        createdAt: toIsoDate(addHours(blockedInviteStart, 2)),
        expiresAt: toIsoDate(blockedInviteEnd)
      },
      invite_liam_last_call: {
        id: "invite_liam_last_call",
        goalId: "goal_liam_last_call",
        inviterId: "liam",
        inviteeId: "mia",
        status: "pending",
        createdAt: toIsoDate(addHours(expiredInviteStart, 1)),
        expiresAt: toIsoDate(expiredInviteEnd)
      }
    },
    joinable: {
      invite_zoe_weekly_push: {
        id: "invite_zoe_weekly_push",
        goalId: "goal_zoe_weekly_push",
        inviterId: "zoe",
        inviteeId: "mia",
        status: "pending",
        createdAt: toIsoDate(addHours(joinableInviteStart, 2)),
        expiresAt: toIsoDate(joinableInviteEnd)
      },
      invite_ava_full: {
        id: "invite_ava_full",
        goalId: "goal_ava_full",
        inviterId: "ava",
        inviteeId: "mia",
        status: "pending",
        createdAt: toIsoDate(addHours(fullGoalStart, 1)),
        expiresAt: toIsoDate(fullGoalEnd)
      }
    },
    unavailable: {
      invite_ava_full: {
        id: "invite_ava_full",
        goalId: "goal_ava_full",
        inviterId: "ava",
        inviteeId: "mia",
        status: "pending",
        createdAt: toIsoDate(addHours(fullGoalStart, 1)),
        expiresAt: toIsoDate(fullGoalEnd)
      }
    },
    no_active_goal: {}
  };

  const activeGoalId =
    resolvedScenario === "blocked" ? "goal_active_mia_crew" : undefined;

  return {
    viewerId,
    activeGoalId,
    users: {
      mia: {
        id: "mia",
        displayName: "Mia",
        avatarUrl: "/mock/avatars/mia.png"
      },
      nora: {
        id: "nora",
        displayName: "Nora",
        avatarUrl: "/mock/avatars/nora.png"
      },
      isaac: {
        id: "isaac",
        displayName: "Isaac",
        avatarUrl: "/mock/avatars/isaac.png"
      },
      zoe: {
        id: "zoe",
        displayName: "Zoe",
        avatarUrl: "/mock/avatars/zoe.png"
      },
      liam: {
        id: "liam",
        displayName: "Liam",
        avatarUrl: "/mock/avatars/liam.png"
      },
      ava: {
        id: "ava",
        displayName: "Ava",
        avatarUrl: "/mock/avatars/ava.png"
      }
    },
    goals,
    invites: invitesByScenario[resolvedScenario]
  };
}
