import type {
  ContributionIgnoredReason,
  ContributionStatus,
  GoalResultResponse,
  PostRunContributionResponse,
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
  resultLockedAt?: string;
  finalDistanceKm?: number;
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

export interface AcceptInviteResult {
  inviteId: string;
  goalId: string;
}

export interface IgnoreInviteResult {
  inviteId: string;
}

export interface SyncContributionInput {
  activityId: string;
  userId: string;
  distanceKm: number;
  activityType: string;
  activitySource: string;
  activityEndTime: string;
  syncedAt: string;
}

export interface IgnoredContributionInput {
  activityId: string;
  userId: string;
  distanceKm: number;
  activityType: string;
  activitySource: string;
  activityEndTime: string;
  syncedAt: string;
  ignoredReason: ContributionIgnoredReason;
  goalId?: string;
}

export interface SyncContributionResult {
  activityId: string;
  status: ContributionStatus;
  reasonCode?: ContributionIgnoredReason;
  goalId?: string;
  completedGoalId?: string;
  resultLockedAt?: string;
}

export interface CrewGoalsReadRepository {
  getViewer(): CrewUserProfile;
  getActiveGoal(): CrewGoalRecord | null;
  getGoalById(goalId: string): CrewGoalRecord | null;
  getGoalResult(goalId: string): GoalResultResponse | null;
  getPostRunContribution(activityId: string): PostRunContributionResponse | null;
  listInvites(): CrewInviteRecord[];
  getInviteById(inviteId: string): CrewInviteRecord | null;
  getViewerInviteByGoalId(goalId: string): CrewInviteRecord | null;
  getUserById(userId: string): CrewUserProfile;
  getNow(): Date;
}

export interface CrewGoalsWriteRepository extends CrewGoalsReadRepository {
  createGoal(input: CreateGoalInput): CreateGoalResult;
  acceptInvite(inviteId: string): AcceptInviteResult;
  ignoreInvite(inviteId: string): IgnoreInviteResult;
  syncContribution(input: SyncContributionInput): SyncContributionResult;
  ignoreContribution(input: IgnoredContributionInput): SyncContributionResult;
  expireActiveGoal(goalId: string): SyncContributionResult;
}
