import type {
  GoalRecommendationTier,
  GoalStatus,
  InviteStatus,
  RecommendationSource
} from "../../../../packages/shared/src/index.js";

export interface CrewUserProfile {
  id: string;
  displayName: string;
  avatarUrl: string;
}

export interface CrewGoalMemberRecord {
  userId: string;
  role: "creator" | "member";
  joinTime: string;
  contributionKm: number;
}

export interface CrewPendingInviteRecord {
  inviteId: string;
  inviteeId: string;
  createdAt: string;
  expiresAt: string;
}

export interface CrewGoalActivityRecord {
  activityId: string;
  userId: string;
  activityType: "run" | "trail_run";
  distanceKm: number;
  happenedAt: string;
  syncedAt: string;
}

export interface CrewGoalRecord {
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
  members: CrewGoalMemberRecord[];
  pendingInvites: CrewPendingInviteRecord[];
  recentActivity: CrewGoalActivityRecord[];
}

export interface CrewInviteRecord {
  id: string;
  goalId: string;
  inviterId: string;
  inviteeId: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
}

export interface CreateGoalInput {
  goalId: string;
  creatorId: string;
  title: string;
  targetDistanceKm: number;
  startTime: string;
  endTime: string;
  recommendationTier: GoalRecommendationTier;
  recommendationSource: RecommendationSource;
  inviteeIds: string[];
  createdAt: string;
}

export interface CreateGoalResult {
  goalId: string;
  inviteIds: string[];
}

export interface CrewGoalsReadRepository {
  getViewer(): CrewUserProfile;
  getActiveGoal(): CrewGoalRecord | null;
  getGoalById(goalId: string): CrewGoalRecord | null;
  listInvites(): CrewInviteRecord[];
  getInviteById(inviteId: string): CrewInviteRecord | null;
  getViewerInviteByGoalId(goalId: string): CrewInviteRecord | null;
  getUserById(userId: string): CrewUserProfile;
  getNow(): Date;
}

export interface CrewGoalsWriteRepository extends CrewGoalsReadRepository {
  createGoal(input: CreateGoalInput): CreateGoalResult;
}
