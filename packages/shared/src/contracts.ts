export type GoalStatus = "active" | "completed" | "expired";

export type GoalRecommendationTier = "easy" | "recommended" | "stretch";

export type RecommendationSource = "recent_training" | "default";

export type InviteStatus = "pending" | "accepted" | "ignored" | "invalid";

export type InviteInvalidReason =
  | "full"
  | "completed"
  | "expired"
  | "ignored"
  | "active_goal_conflict";

export type ContributionStatus = "counted" | "ignored";

export type ContributionIgnoredReason =
  | "activity_type"
  | "source"
  | "before_join"
  | "outside_window"
  | "duplicate"
  | "goal_locked"
  | "no_active_goal";

export type ContributionSyncOutcome =
  | "counted"
  | "already_counted"
  | "not_counted"
  | "goal_completed";

export type GoalTrackState = "on_track" | "behind" | "completed" | "expired";

export type InviteAvailability = "joinable" | "blocked" | "unavailable";

export interface EntryHighlight {
  label: string;
  value: string;
}

export interface ScreenAction {
  label: string;
  href: string;
  kind?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}

export interface ViewerSummary {
  id: string;
  displayName: string;
}

export interface MemberAvatar {
  id: string;
  displayName: string;
  avatarUrl: string;
}

export interface GoalProgressSummary {
  totalDistanceKm: number;
  targetDistanceKm: number;
  percentComplete: number;
  remainingDistanceKm: number;
  trackState: GoalTrackState;
  statusLabel: string;
}

export interface GoalTimelineSummary {
  startTime: string;
  endTime: string;
  totalDays: number;
  daysLeft: number;
  hoursLeft: number;
  remainingLabel: string;
}

export interface GoalCrewCounts {
  joinedMemberCount: number;
  pendingInviteCount: number;
  crewLimit: number;
}

export interface EntryOverview {
  headline: string;
  subheadline: string;
  rules: string[];
  highlights: EntryHighlight[];
}

export interface HomeEntryGoalCard {
  goalId: string;
  title: string;
  status: GoalStatus;
  progress: GoalProgressSummary;
  timeline: GoalTimelineSummary;
  myContributionKm: number;
  crew: GoalCrewCounts;
}

export interface HomeEntryEmptyState {
  title: string;
  body: string;
  primaryAction: ScreenAction;
}

export interface HomeEntryResponse extends EntryOverview {
  screen: "home_entry";
  state: "active_goal" | "no_active_goal";
  bannerLabel: string;
  primaryAction: ScreenAction;
  secondaryAction: ScreenAction;
  activeGoal?: HomeEntryGoalCard;
  emptyState?: HomeEntryEmptyState;
}

export interface GoalsHubActiveGoalSummary {
  goalId: string;
  title: string;
  status: GoalStatus;
  progress: GoalProgressSummary;
  timeline: GoalTimelineSummary;
  myContributionKm: number;
  crew: GoalCrewCounts;
}

export interface GoalsHubEmptyState {
  title: string;
  body: string;
  primaryAction: ScreenAction;
}

export interface GoalsHubResponse {
  screen: "goals_hub";
  state: "active_goal" | "no_active_goal";
  title: string;
  subtitle: string;
  activeGoal?: GoalsHubActiveGoalSummary;
  emptyState?: GoalsHubEmptyState;
}

export interface GoalContributionMember {
  id: string;
  displayName: string;
  avatarUrl: string;
  role: "creator" | "member";
  joinedAt: string;
  contributionKm: number;
  contributionLabel: string;
}

export interface PendingInviteSummary {
  inviteId: string;
  invitee: MemberAvatar;
  status: "pending";
  sentAt: string;
  expiresAt: string;
}

export interface RecentGoalActivity {
  activityId: string;
  member: MemberAvatar;
  activityType: "run" | "trail_run";
  distanceKm: number;
  happenedAt: string;
  syncedAt: string;
  relativeSyncLabel: string;
}

export interface GoalDetailResponse {
  screen: "goal_detail";
  goalId: string;
  title: string;
  status: GoalStatus;
  recommendationTier: GoalRecommendationTier;
  recommendationSource: RecommendationSource;
  progress: GoalProgressSummary;
  timeline: GoalTimelineSummary;
  myContributionKm: number;
  crew: GoalCrewCounts;
  members: GoalContributionMember[];
  pendingInvites: PendingInviteSummary[];
  recentActivity: RecentGoalActivity[];
  recentActivityEmptyState?: {
    title: string;
    body: string;
  };
  actions: ScreenAction[];
}

export interface InviteListItem {
  inviteId: string;
  goalId: string;
  title: string;
  inviter: MemberAvatar;
  targetDistanceKm: number;
  durationDays: number;
  currentJoinedMemberCount: number;
  pendingInviteCount: number;
  status: InviteStatus;
  availability: InviteAvailability;
  statusLabel: string;
  distanceLabel: string;
  sentAt: string;
  expiresAt: string;
  currentMembersLabel: string;
}

export interface InvitesListResponse {
  screen: "invites_list";
  title: string;
  subtitle: string;
  items: InviteListItem[];
}

export interface InviteGoalPreview {
  goalId: string;
  title: string;
  targetDistanceKm: number;
  durationDays: number;
  currentJoinedMemberCount: number;
  pendingInviteCount: number;
  startTime: string;
  endTime: string;
}

export interface InviteAvailabilitySummary {
  state: InviteAvailability;
  headline: string;
  body: string;
  reasonCode?: InviteInvalidReason;
  currentUserActiveGoalId?: string;
  primaryAction: ScreenAction;
  secondaryAction?: ScreenAction;
}

export interface InviteDetailResponse {
  screen: "invite_detail";
  inviteId: string;
  status: InviteStatus;
  inviter: MemberAvatar;
  goal: InviteGoalPreview;
  availability: InviteAvailabilitySummary;
  rules: string[];
}

export interface GoalInvitePreviewResponse {
  screen: "goal_invite_preview";
  goalId: string;
  inviter: MemberAvatar;
  goal: InviteGoalPreview;
  availability: InviteAvailabilitySummary;
  rules: string[];
}

export type GoalReadResponse = GoalDetailResponse | GoalInvitePreviewResponse;

export interface GoalDistanceRecommendationRequest {
  selectedFriendIds: string[];
}

export interface GoalDistanceRecommendationOption {
  tier: GoalRecommendationTier;
  label: string;
  distanceKm: number;
  description: string;
}

export interface GoalDistanceRecommendationResponse {
  screen: "goal_recommendation";
  durationDays: 7;
  selectedFriendIds: string[];
  options: GoalDistanceRecommendationOption[];
  defaultSelectedTier: GoalRecommendationTier;
  source: RecommendationSource;
  explanation: string;
}

export interface CreateGoalRequest {
  selectedFriendIds: string[];
  selectedTier: GoalRecommendationTier;
}

export interface CreateGoalResponse {
  screen: "goal_created";
  goalId: string;
  detailHref: string;
  inviteIds: string[];
}

export interface AcceptInviteResponse {
  screen: "invite_accepted";
  inviteId: string;
  goalId: string;
  detailHref: string;
}

export interface IgnoreInviteResponse {
  screen: "invite_ignored";
  inviteId: string;
}

export interface ContributionSyncRequest {
  activityId: string;
  distanceKm: number;
  activityType: string;
  activitySource: string;
  activityEndTime: string;
}

export interface ContributionGoalSnapshot {
  goalId: string;
  title: string;
  status: GoalStatus;
  totalDistanceKm: number;
  targetDistanceKm: number;
  remainingDistanceKm: number;
  resultLockedAt?: string;
}

export interface ContributionSyncResponse {
  screen: "contribution_sync";
  activityId: string;
  outcome: ContributionSyncOutcome;
  status: ContributionStatus;
  reasonCode?: ContributionIgnoredReason;
  distanceKm: number;
  message: string;
  goal?: ContributionGoalSnapshot;
}

export type CrewGoalAnalyticsEventName =
  | "crew_goal_entry_impression"
  | "crew_goal_entry_click"
  | "crew_goal_create_start"
  | "crew_goal_friend_select_complete"
  | "crew_goal_recommendation_selected"
  | "crew_goal_invite_sent"
  | "crew_goal_invite_opened"
  | "crew_goal_invite_accepted"
  | "crew_goal_invite_ignored"
  | "crew_goal_invite_blocked_active_goal"
  | "crew_goal_detail_view"
  | "crew_goal_postrun_card_view"
  | "crew_goal_postrun_card_click"
  | "crew_goal_contribution_counted"
  | "crew_goal_contribution_ineligible"
  | "crew_goal_completed"
  | "crew_goal_expired"
  | "crew_goal_share_progress"
  | "crew_goal_share_result"
  | "crew_goal_restart";

export type CrewGoalAnalyticsSource =
  | "home"
  | "goals_hub"
  | "create"
  | "preview"
  | "invite"
  | "postrun"
  | "result"
  | "notification"
  | "system";

export type CrewGoalAnalyticsProperties = Record<
  string,
  string | number | boolean | null
>;

export interface CrewGoalAnalyticsEventRequest {
  eventName: CrewGoalAnalyticsEventName;
  source: CrewGoalAnalyticsSource;
  goalId?: string;
  userId?: string;
  properties?: CrewGoalAnalyticsProperties;
}

export interface CrewGoalAnalyticsEventRecord extends CrewGoalAnalyticsEventRequest {
  eventId: string;
  createdAt: string;
}

export type CrewGoalNotificationTrigger =
  | "invite_sent"
  | "invite_accepted"
  | "goal_24h_left"
  | "goal_completed"
  | "goal_expired";

export type CrewGoalNotificationChannel = "in_app" | "push";

export interface CrewGoalNotificationPreviewRequest {
  trigger: CrewGoalNotificationTrigger;
  goalId: string;
  recipientId?: string;
  source?: CrewGoalAnalyticsSource;
}

export interface CrewGoalNotificationPreviewResponse {
  screen: "notification_preview";
  trigger: CrewGoalNotificationTrigger;
  channel: CrewGoalNotificationChannel;
  goalId: string;
  recipientId: string;
  title: string;
  body: string;
  deepLink: string;
  createdAt: string;
}

export interface GoalResultMember {
  id: string;
  displayName: string;
  avatarUrl: string;
  contributionKm: number;
}

export interface GoalResultResponse {
  screen: "goal_result";
  goalId: string;
  currentUserId: string;
  status: "completed" | "expired";
  title: string;
  totalDistanceKm: number;
  targetDistanceKm: number;
  finalDistanceKm: number;
  daysUsedLabel: string;
  resultLockedAt: string;
  members: GoalResultMember[];
  primaryAction: ScreenAction;
  secondaryAction?: ScreenAction;
}

export interface PostRunContributionResponse {
  screen: "post_run";
  activityId: string;
  state: "updating" | "counted" | "already_counted" | "not_counted" | "goal_locked";
  message: string;
  goal?: ContributionGoalSnapshot;
}

// Temporary web migration models. These are compatibility shapes for the current
// frontend pages and are not the canonical API DTOs above.
export type WebCompatHighlightItem = EntryHighlight;

export interface WebCompatEntryOverview {
  headline: string;
  subheadline: string;
  rules: string[];
  highlights: WebCompatHighlightItem[];
}

export interface WebCompatGoalSummary {
  id: string;
  title: string;
  status: GoalStatus;
  targetDistanceKm: number;
  totalDistanceKm: number;
  myContributionKm: number;
  joinedMemberCount: number;
  pendingInviteCount: number;
  crewSize: number;
  startTime: string;
  endTime: string;
}

export interface WebCompatGoalMember {
  userId: string;
  displayName: string;
  role: "creator" | "member";
  joinTime: string;
  contributionKm: number;
}

export interface WebCompatPendingInvite {
  inviteId: string;
  displayName: string;
  invitedAt: string;
}

export interface WebCompatGoalDetail extends WebCompatGoalSummary {
  joinedMembers: WebCompatGoalMember[];
  pendingInvites: WebCompatPendingInvite[];
}

export interface WebCompatRecentActivity {
  id: string;
  athleteName: string;
  distanceKm: number;
  activityType: "Run" | "Trail Run";
  syncedAt: string;
}

export type WebCompatInviteAvailabilityReason = InviteInvalidReason | "not_found";

export interface WebCompatInviteListItem {
  id: string;
  goalId: string;
  goalTitle: string;
  inviterName: string;
  targetDistanceKm: number;
  durationDays: number;
  currentMemberCount: number;
  status: InviteStatus;
  availabilityReason?: WebCompatInviteAvailabilityReason;
  endTime: string;
}

export interface WebCompatInviteDetail {
  id: string;
  goalId: string;
  goalTitle: string;
  inviterName: string;
  targetDistanceKm: number;
  durationDays: number;
  currentMemberCount: number;
  joinedMemberCount: number;
  pendingInviteCount: number;
  status: InviteStatus;
  availabilityReason?: WebCompatInviteAvailabilityReason;
  currentUserHasActiveGoal: boolean;
  currentUserActiveGoalId?: string;
  startTime: string;
  endTime: string;
}
