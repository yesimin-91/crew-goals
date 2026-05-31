import {
  integer,
  real,
  uniqueIndex,
  sqliteTable,
  text
} from "drizzle-orm/sqlite-core";

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull(),
  title: text("title").notNull(),
  targetDistance: real("target_distance").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status").notNull(),
  recommendationTier: text("recommendation_tier").notNull(),
  recommendationSource: text("recommendation_source").notNull(),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
  expiredAt: text("expired_at"),
  resultLockedAt: text("result_locked_at"),
  finalDistance: real("final_distance")
});

export const goalMembers = sqliteTable("goal_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  goalId: text("goal_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  joinTime: text("join_time").notNull(),
  contributionDistance: real("contribution_distance").notNull().default(0)
}, (table) => ({
  goalUserUnique: uniqueIndex("goal_members_goal_user_unique").on(
    table.goalId,
    table.userId
  )
}));

export const goalInvites = sqliteTable("goal_invites", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  inviterId: text("inviter_id").notNull(),
  inviteeId: text("invitee_id").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  acceptedAt: text("accepted_at"),
  ignoredAt: text("ignored_at"),
  invalidReason: text("invalid_reason"),
  expiresAt: text("expires_at").notNull()
});

export const goalContributions = sqliteTable("goal_contributions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  goalId: text("goal_id"),
  activityId: text("activity_id").notNull().unique(),
  userId: text("user_id").notNull(),
  distance: real("distance").notNull(),
  activityType: text("activity_type").notNull(),
  activitySource: text("activity_source").notNull(),
  activityEndTime: text("activity_end_time").notNull(),
  syncedAt: text("synced_at").notNull(),
  countedAt: text("counted_at").notNull(),
  status: text("status").notNull(),
  ignoredReason: text("ignored_reason")
});

export const crewGoalAnalyticsEvents = sqliteTable("crew_goal_analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: text("event_id").notNull().unique(),
  eventName: text("event_name").notNull(),
  source: text("source").notNull(),
  goalId: text("goal_id"),
  userId: text("user_id"),
  properties: text("properties"),
  createdAt: text("created_at").notNull()
});
