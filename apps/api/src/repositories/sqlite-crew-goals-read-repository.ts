import type Database from "better-sqlite3";

import type {
  CrewGoalAnalyticsEventRecord,
  ContributionIgnoredReason,
  GoalResultResponse,
  GoalRecommendationTier,
  GoalStatus,
  InviteStatus,
  PostRunContributionResponse,
  RecommendationSource
} from "../../../../packages/shared/src/index.js";
import {
  createMockCrewGoalsDataset,
  type MockCrewGoalsDataset
} from "../mock/crew-goals-mock-data.js";
import { USER_PROFILES, VIEWER_ID } from "../lib/crew-users.js";
import type {
  AcceptInviteResult,
  CreateGoalInput,
  CreateGoalResult,
  CrewGoalActivityRecord,
  CrewGoalMemberRecord,
  CrewGoalRecord,
  CrewGoalsReadRepository,
  CrewGoalsWriteRepository,
  CrewInviteRecord,
  CrewPendingInviteRecord,
  CrewUserProfile,
  IgnoreInviteResult,
  IgnoredContributionInput,
  SyncContributionInput,
  SyncContributionResult
} from "./crew-goals-read-repository.js";

const CREW_LIMIT = 4;
const DEMO_FIXTURE_VERSION = "step2_v1";
const DEMO_GOAL_IDS = [
  "goal_active_mia_crew",
  "goal_zoe_weekly_push",
  "goal_ava_full",
  "goal_liam_last_call"
];
const DEMO_INVITE_IDS = [
  "invite_active_isaac",
  "invite_zoe_weekly_push",
  "invite_ava_full",
  "invite_liam_last_call"
];

interface GoalRow {
  id: string;
  creator_id: string;
  title: string;
  target_distance: number;
  start_time: string;
  end_time: string;
  status: string;
  recommendation_tier: string;
  recommendation_source: string;
  completed_at: string | null;
  expired_at: string | null;
  result_locked_at: string | null;
  final_distance: number | null;
}

interface GoalMemberRow {
  user_id: string;
  role: string;
  join_time: string;
  contribution_distance: number;
}

interface GoalInviteRow {
  id: string;
  goal_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface GoalContributionRow {
  id: number;
  goal_id: string;
  activity_id: string;
  user_id: string;
  distance: number;
  activity_type: string;
  activity_source: string;
  activity_end_time: string;
  synced_at: string;
  counted_at: string;
  status: string;
  ignored_reason: string | null;
}

interface CrewGoalAnalyticsEventRow {
  event_id: string;
  event_name: string;
  source: string;
  goal_id: string | null;
  user_id: string | null;
  properties: string | null;
  created_at: string;
}

export function seedCrewGoalsReadData(sqlite: Database.Database, now = new Date()) {
  const fixtureVersion = getFixtureVersion(sqlite);
  const needsSeed =
    fixtureVersion !== DEMO_FIXTURE_VERSION || hasExpiredDemoFixture(sqlite, now);

  if (!needsSeed) {
    return;
  }

  const dataset = createMockCrewGoalsDataset(now, "blocked");
  const seed = sqlite.transaction((input: MockCrewGoalsDataset) => {
    clearDemoFixture(sqlite);

    for (const goal of Object.values(input.goals)) {
      sqlite
        .prepare(
          `INSERT INTO goals (
            id,
            creator_id,
            title,
            target_distance,
            start_time,
            end_time,
            status,
            recommendation_tier,
            recommendation_source,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          goal.id,
          goal.creatorId,
          goal.title,
          goal.targetDistanceKm,
          goal.startTime,
          goal.endTime,
          goal.status,
          goal.recommendationTier,
          goal.recommendationSource,
          goal.startTime
        );

      for (const member of goal.members) {
        sqlite
          .prepare(
            `INSERT INTO goal_members (
              goal_id,
              user_id,
              role,
              join_time,
              contribution_distance
            ) VALUES (?, ?, ?, ?, ?)`
          )
          .run(
            goal.id,
            member.userId,
            member.role,
            member.joinTime,
            member.contributionKm
          );
      }

      for (const activity of goal.recentActivity) {
        sqlite
          .prepare(
            `INSERT INTO goal_contributions (
              goal_id,
              activity_id,
              user_id,
              distance,
              activity_type,
              activity_source,
              activity_end_time,
              synced_at,
              counted_at,
              status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            goal.id,
            activity.activityId,
            activity.userId,
            activity.distanceKm,
            activity.activityType,
            "suunto",
            activity.happenedAt,
            activity.syncedAt,
            activity.syncedAt,
            "counted"
          );
      }

      for (const invite of goal.pendingInvites) {
        sqlite
          .prepare(
            `INSERT INTO goal_invites (
              id,
              goal_id,
              inviter_id,
              invitee_id,
              status,
              created_at,
              expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            invite.inviteId,
            goal.id,
            goal.creatorId,
            invite.inviteeId,
            "pending",
            invite.createdAt,
            invite.expiresAt
          );
      }
    }

    for (const invite of Object.values(input.invites)) {
      sqlite
        .prepare(
          `INSERT OR IGNORE INTO goal_invites (
            id,
            goal_id,
            inviter_id,
            invitee_id,
            status,
            created_at,
            expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          invite.id,
          invite.goalId,
          invite.inviterId,
          invite.inviteeId,
          invite.status,
          invite.createdAt,
          invite.expiresAt
        );
    }

    sqlite
      .prepare(
        `INSERT OR REPLACE INTO app_meta (key, value) VALUES ('demo_fixture_version', ?)`
      )
      .run(DEMO_FIXTURE_VERSION);
  });

  seed(dataset);
}

function getFixtureVersion(sqlite: Database.Database): string | null {
  const tableExists = sqlite
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table' AND name = 'app_meta'`
    )
    .get() as { name: string } | undefined;

  if (!tableExists) {
    return null;
  }

  const row = sqlite
    .prepare("SELECT value FROM app_meta WHERE key = 'demo_fixture_version'")
    .get() as { value: string } | undefined;

  return row?.value ?? null;
}

function hasExpiredDemoFixture(sqlite: Database.Database, now: Date): boolean {
  const row = sqlite
    .prepare("SELECT MIN(end_time) AS min_end_time FROM goals")
    .get() as { min_end_time: string | null } | undefined;

  if (!row?.min_end_time) {
    return true;
  }

  return new Date(row.min_end_time).getTime() <= now.getTime();
}

function clearDemoFixture(sqlite: Database.Database) {
  sqlite.prepare(`DELETE FROM goal_contributions WHERE goal_id IN (${demoPlaceholders(DEMO_GOAL_IDS.length)})`).run(...DEMO_GOAL_IDS);
  sqlite.prepare(`DELETE FROM goal_invites WHERE id IN (${demoPlaceholders(DEMO_INVITE_IDS.length)}) OR goal_id IN (${demoPlaceholders(DEMO_GOAL_IDS.length)})`).run(
    ...DEMO_INVITE_IDS,
    ...DEMO_GOAL_IDS
  );
  sqlite.prepare(`DELETE FROM goal_members WHERE goal_id IN (${demoPlaceholders(DEMO_GOAL_IDS.length)})`).run(...DEMO_GOAL_IDS);
  sqlite.prepare(`DELETE FROM goals WHERE id IN (${demoPlaceholders(DEMO_GOAL_IDS.length)})`).run(...DEMO_GOAL_IDS);
}

function demoPlaceholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}

export class SqliteCrewGoalsReadRepository implements CrewGoalsWriteRepository {
  constructor(
    private readonly sqlite: Database.Database,
    private readonly options: {
      now?: Date;
      viewerId?: string;
    } = {}
  ) {}

  getViewer(): CrewUserProfile {
    return this.getUserById(this.viewerId);
  }

  getActiveGoal(): CrewGoalRecord | null {
    const row = this.sqlite
      .prepare(
        `SELECT goals.*
         FROM goals
         INNER JOIN goal_members ON goal_members.goal_id = goals.id
         WHERE goal_members.user_id = ? AND goals.status = 'active'
         ORDER BY goals.start_time DESC
         LIMIT 1`
      )
      .get(this.viewerId) as GoalRow | undefined;

    if (!row) {
      return null;
    }

    this.maybeExpireGoal(row);

    const refreshedRow = this.sqlite
      .prepare("SELECT * FROM goals WHERE id = ?")
      .get(row.id) as GoalRow | undefined;

    if (!refreshedRow || refreshedRow.status !== "active") {
      return null;
    }

    return this.buildGoal(refreshedRow);
  }

  getGoalById(goalId: string): CrewGoalRecord | null {
    const row = this.sqlite
      .prepare("SELECT * FROM goals WHERE id = ?")
      .get(goalId) as GoalRow | undefined;

    if (!row) {
      return null;
    }

    this.maybeExpireGoal(row);

    const refreshedRow = this.sqlite
      .prepare("SELECT * FROM goals WHERE id = ?")
      .get(goalId) as GoalRow | undefined;

    return refreshedRow ? this.buildGoal(refreshedRow) : null;
  }

  getGoalResult(goalId: string): GoalResultResponse | null {
    const goal = this.getGoalById(goalId);

    if (!goal || goal.status === "active" || !goal.resultLockedAt) {
      return null;
    }

    const totalDistanceKm = roundDistance(
      goal.members.reduce((sum, member) => sum + member.contributionKm, 0)
    );
    const finalDistanceKm = goal.finalDistanceKm ?? totalDistanceKm;

    return {
      screen: "goal_result",
      goalId: goal.id,
      status: goal.status,
      title: goal.title,
      totalDistanceKm,
      targetDistanceKm: goal.targetDistanceKm,
      finalDistanceKm,
      daysUsedLabel: buildDaysUsedLabel(goal.startTime, goal.resultLockedAt),
      resultLockedAt: goal.resultLockedAt,
      members: goal.members.map((member) => {
        const user = this.getUserById(member.userId);

        return {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          contributionKm: member.contributionKm
        };
      }),
      primaryAction:
        goal.status === "completed"
          ? {
              label: "Share Result",
              href: `/goals/${goal.id}/share-result`,
              kind: "primary"
            }
          : {
              label: "Start Another Goal",
              href: "/goals/create",
              kind: "primary"
            },
      secondaryAction:
        goal.status === "completed"
          ? {
              label: "Start Another Goal",
              href: "/goals/create",
              kind: "secondary"
            }
          : undefined
    };
  }

  getPostRunContribution(activityId: string): PostRunContributionResponse | null {
    const contribution = this.getGoalContributionByActivityId(activityId);

    if (!contribution) {
      return {
        screen: "post_run",
        activityId,
        state: "updating",
        message: "Updating crew progress"
      };
    }

    const goal = contribution.goal_id ? this.getGoalById(contribution.goal_id) : null;
    const state =
      contribution.status === "counted"
        ? "counted"
        : contribution.ignored_reason === "duplicate"
          ? "already_counted"
          : contribution.ignored_reason === "goal_locked"
            ? "goal_locked"
            : "not_counted";

    return {
      screen: "post_run",
      activityId,
      state,
      message:
        state === "counted"
          ? "Contribution counted"
          : state === "already_counted"
            ? "Already counted"
            : state === "goal_locked"
              ? "Goal result is locked"
              : "Phase 1 only counts Run and Trail Run activities from trusted sources.",
      goal: goal ? this.buildGoalSnapshot(goal) : undefined
    };
  }

  listInvites(): CrewInviteRecord[] {
    const rows = this.sqlite
      .prepare(
        `SELECT *
         FROM goal_invites
         WHERE invitee_id = ? AND status != 'accepted'
         ORDER BY created_at DESC`
      )
      .all(this.viewerId) as GoalInviteRow[];

    return rows.map((row) => this.toInviteRecord(row));
  }

  getInviteById(inviteId: string): CrewInviteRecord | null {
    const row = this.sqlite
      .prepare(
        `SELECT *
         FROM goal_invites
         WHERE id = ? AND invitee_id = ?`
      )
      .get(inviteId, this.viewerId) as GoalInviteRow | undefined;

    return row ? this.toInviteRecord(row) : null;
  }

  getViewerInviteByGoalId(goalId: string): CrewInviteRecord | null {
    const row = this.sqlite
      .prepare(
        `SELECT *
         FROM goal_invites
         WHERE goal_id = ? AND invitee_id = ?
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .get(goalId, this.viewerId) as GoalInviteRow | undefined;

    return row ? this.toInviteRecord(row) : null;
  }

  getUserById(userId: string): CrewUserProfile {
    const user = USER_PROFILES[userId];

    if (!user) {
      return {
        id: userId,
        displayName: userId,
        avatarUrl: "/mock/avatars/default.png"
      };
    }

    return user;
  }

  getNow(): Date {
    return this.options.now ?? new Date();
  }

  createGoal(input: CreateGoalInput): CreateGoalResult {
    const inviteIds = input.inviteeIds.map((inviteeId) =>
      buildInviteId(input.goalId, inviteeId)
    );

    const create = this.sqlite.transaction(() => {
      this.sqlite
        .prepare(
          `INSERT INTO goals (
            id,
            creator_id,
            title,
            target_distance,
            start_time,
            end_time,
            status,
            recommendation_tier,
            recommendation_source,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          input.goalId,
          input.creatorId,
          input.title,
          input.targetDistanceKm,
          input.startTime,
          input.endTime,
          "active",
          input.recommendationTier,
          input.recommendationSource,
          input.createdAt
        );

      this.sqlite
        .prepare(
          `INSERT INTO goal_members (
            goal_id,
            user_id,
            role,
            join_time,
            contribution_distance
          ) VALUES (?, ?, ?, ?, ?)`
        )
        .run(input.goalId, input.creatorId, "creator", input.startTime, 0);

      const insertInvite = this.sqlite.prepare(
        `INSERT INTO goal_invites (
          id,
          goal_id,
          inviter_id,
          invitee_id,
          status,
          created_at,
          expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      input.inviteeIds.forEach((inviteeId, index) => {
        insertInvite.run(
          inviteIds[index],
          input.goalId,
          input.creatorId,
          inviteeId,
          "pending",
          input.createdAt,
          input.endTime
        );
      });
    });

    create();

    return {
      goalId: input.goalId,
      inviteIds
    };
  }

  acceptInvite(inviteId: string): AcceptInviteResult {
    const invite = this.getInviteById(inviteId);

    if (!invite) {
      throw new Error(`Invite ${inviteId} was not found`);
    }

    const now = this.getNow().toISOString();
    const accept = this.sqlite.transaction(() => {
      const updateResult = this.sqlite
        .prepare(
          `UPDATE goal_invites
           SET status = 'accepted', accepted_at = ?
           WHERE id = ? AND status = 'pending'`
        )
        .run(now, inviteId);

      if (updateResult.changes !== 1) {
        throw new Error("invite_unavailable");
      }

      this.sqlite
        .prepare(
          `INSERT INTO goal_members (
            goal_id,
            user_id,
            role,
            join_time,
            contribution_distance
          ) VALUES (?, ?, ?, ?, ?)`
        )
        .run(invite.goalId, invite.inviteeId, "member", now, 0);
    });

    try {
      accept();
    } catch (error) {
      if (isSqliteUniqueConstraintError(error)) {
        throw new Error("invite_unavailable");
      }

      throw error;
    }

    return {
      inviteId,
      goalId: invite.goalId
    };
  }

  ignoreInvite(inviteId: string): IgnoreInviteResult {
    const invite = this.getInviteById(inviteId);

    if (!invite) {
      throw new Error(`Invite ${inviteId} was not found`);
    }

    const updateResult = this.sqlite
      .prepare(
        `UPDATE goal_invites
         SET status = 'ignored', ignored_at = ?
         WHERE id = ? AND status = 'pending'`
      )
      .run(this.getNow().toISOString(), inviteId);

    if (updateResult.changes !== 1) {
      throw new Error("invite_unavailable");
    }

    return { inviteId };
  }

  private get viewerId() {
    return this.options.viewerId ?? VIEWER_ID;
  }

  private buildGoal(row: GoalRow): CrewGoalRecord {
    return {
      id: row.id,
      creatorId: row.creator_id,
      title: row.title,
      status: row.status as GoalStatus,
      targetDistanceKm: row.target_distance,
      crewLimit: CREW_LIMIT,
      startTime: row.start_time,
      endTime: row.end_time,
      resultLockedAt: row.result_locked_at ?? undefined,
      finalDistanceKm: row.final_distance ?? undefined,
      recommendationTier: row.recommendation_tier as GoalRecommendationTier,
      recommendationSource: row.recommendation_source as RecommendationSource,
      members: this.listMembers(row.id),
      pendingInvites: this.listPendingInvites(row.id),
      recentActivity: this.listRecentActivity(row.id)
    };
  }

  private listMembers(goalId: string): CrewGoalMemberRecord[] {
    const rows = this.sqlite
      .prepare(
        `SELECT user_id, role, join_time, contribution_distance
         FROM goal_members
         WHERE goal_id = ?
         ORDER BY join_time ASC`
      )
      .all(goalId) as GoalMemberRow[];

    return rows.map((row) => ({
      userId: row.user_id,
      role: row.role === "creator" ? "creator" : "member",
      joinTime: row.join_time,
      contributionKm: row.contribution_distance
    }));
  }

  private listPendingInvites(goalId: string): CrewPendingInviteRecord[] {
    const rows = this.sqlite
      .prepare(
        `SELECT id, invitee_id, created_at, expires_at
         FROM goal_invites
         WHERE goal_id = ? AND status = 'pending'
         ORDER BY created_at ASC`
      )
      .all(goalId) as Array<Pick<GoalInviteRow, "id" | "invitee_id" | "created_at" | "expires_at">>;

    return rows.map((row) => ({
      inviteId: row.id,
      inviteeId: row.invitee_id,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    }));
  }

  private listRecentActivity(goalId: string): CrewGoalActivityRecord[] {
    const rows = this.sqlite
      .prepare(
        `SELECT activity_id, user_id, distance, activity_type, activity_end_time, synced_at
         FROM goal_contributions
         WHERE goal_id = ? AND status = 'counted'
         ORDER BY synced_at DESC
         LIMIT 10`
      )
      .all(goalId) as GoalContributionRow[];

    return rows.map((row) => ({
      activityId: row.activity_id,
      userId: row.user_id,
      activityType: row.activity_type === "trail_run" ? "trail_run" : "run",
      distanceKm: row.distance,
      happenedAt: row.activity_end_time,
      syncedAt: row.synced_at
    }));
  }

  syncContribution(input: SyncContributionInput): SyncContributionResult {
    const goal = this.getActiveGoal();
    const now = input.syncedAt;

    if (!goal) {
      return this.ignoreContribution({
        ...input,
        ignoredReason: "no_active_goal"
      });
    }

    const existing = this.sqlite
      .prepare(
        `SELECT *
         FROM goal_contributions
         WHERE activity_id = ?`
      )
      .get(input.activityId) as GoalContributionRow | undefined;

    if (existing) {
      return {
        activityId: input.activityId,
        status: "ignored",
        reasonCode: existing.status === "counted" ? "duplicate" : (existing.ignored_reason as ContributionIgnoredReason),
        goalId: existing.goal_id ?? undefined
      };
    }

    const member = goal.members.find((item) => item.userId === input.userId);

    if (!member) {
      return this.ignoreContribution({
        ...input,
        ignoredReason: "before_join",
        goalId: goal.id
      });
    }

    const ignoredReason = resolveContributionIgnoredReason(goal, member.joinTime, input);

    if (ignoredReason) {
      return this.ignoreContribution({
        ...input,
        ignoredReason,
        goalId: goal.id
      });
    }

    const sync = this.sqlite.transaction(() => {
      this.sqlite
        .prepare(
          `INSERT INTO goal_contributions (
            goal_id,
            activity_id,
            user_id,
            distance,
            activity_type,
            activity_source,
            activity_end_time,
            synced_at,
            counted_at,
            status,
            ignored_reason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`
        )
        .run(
          goal.id,
          input.activityId,
          input.userId,
          input.distanceKm,
          input.activityType,
          input.activitySource,
          input.activityEndTime,
          now,
          now,
          "counted"
        );

      this.sqlite
        .prepare(
          `UPDATE goal_members
           SET contribution_distance = contribution_distance + ?
           WHERE goal_id = ? AND user_id = ?`
        )
        .run(input.distanceKm, goal.id, input.userId);

      const refreshedGoal = this.getGoalById(goal.id);

      if (!refreshedGoal) {
        throw new Error(`Goal ${goal.id} was not found`);
      }

      const totalDistanceKm = roundDistance(
        refreshedGoal.members.reduce((sum, item) => sum + item.contributionKm, 0)
      );

      if (totalDistanceKm >= refreshedGoal.targetDistanceKm) {
        lockGoalResult(this.sqlite, refreshedGoal.id, "completed", now, totalDistanceKm);
      }

      return {
        activityId: input.activityId,
        status: "counted" as const,
        goalId: goal.id,
        completedGoalId:
          totalDistanceKm >= refreshedGoal.targetDistanceKm ? refreshedGoal.id : undefined,
        resultLockedAt:
          totalDistanceKm >= refreshedGoal.targetDistanceKm ? now : undefined
      };
    });

    return sync();
  }

  ignoreContribution(input: IgnoredContributionInput): SyncContributionResult {
    const existing = this.sqlite
      .prepare(
        `SELECT *
         FROM goal_contributions
         WHERE activity_id = ?`
      )
      .get(input.activityId) as GoalContributionRow | undefined;

    if (existing) {
      return {
        activityId: input.activityId,
        status: "ignored",
        reasonCode: existing.status === "counted" ? "duplicate" : (existing.ignored_reason as ContributionIgnoredReason),
        goalId: existing.goal_id ?? undefined
      };
    }

    this.sqlite
      .prepare(
        `INSERT INTO goal_contributions (
          goal_id,
          activity_id,
          user_id,
          distance,
          activity_type,
          activity_source,
          activity_end_time,
          synced_at,
          counted_at,
          status,
          ignored_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.goalId ?? null,
        input.activityId,
        input.userId,
        input.distanceKm,
        input.activityType,
        input.activitySource,
        input.activityEndTime,
        input.syncedAt,
        input.syncedAt,
        "ignored",
        input.ignoredReason
      );

    return {
      activityId: input.activityId,
      status: "ignored",
      reasonCode: input.ignoredReason,
      goalId: input.goalId
    };
  }

  expireActiveGoal(goalId: string): SyncContributionResult {
    const goal = this.getGoalById(goalId);

    if (!goal) {
      throw new Error(`Goal ${goalId} was not found`);
    }

    if (goal.status !== "active" || goal.resultLockedAt) {
      return {
        activityId: goalId,
        status: "ignored",
        reasonCode: "goal_locked",
        goalId: goal.id
      };
    }

    const expiredAt = goal.endTime;
    const finalDistanceKm = roundDistance(goal.members.reduce((sum, item) => sum + item.contributionKm, 0));

    lockGoalResult(this.sqlite, goal.id, "expired", expiredAt, finalDistanceKm);

    this.recordAnalyticsEvent({
      eventId: `evt_crew_goal_expired_${goal.id}_${expiredAt}`,
      eventName: "crew_goal_expired",
      source: "system",
      goalId: goal.id,
      userId: this.viewerId,
      properties: {
        final_distance_km: finalDistanceKm
      },
      createdAt: expiredAt
    });

    return {
      activityId: goal.id,
      status: "ignored",
      reasonCode: "goal_locked",
      goalId: goal.id,
      resultLockedAt: expiredAt
    };
  }

  recordAnalyticsEvent(event: CrewGoalAnalyticsEventRecord): CrewGoalAnalyticsEventRecord {
    this.sqlite
      .prepare(
        `INSERT OR REPLACE INTO crew_goal_analytics_events (
          event_id,
          event_name,
          source,
          goal_id,
          user_id,
          properties,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        event.eventId,
        event.eventName,
        event.source,
        event.goalId ?? null,
        event.userId ?? null,
        JSON.stringify(event.properties ?? {}),
        event.createdAt
      );

    return event;
  }

  private getGoalContributionByActivityId(activityId: string): GoalContributionRow | undefined {
    return this.sqlite
      .prepare(`SELECT * FROM goal_contributions WHERE activity_id = ?`)
      .get(activityId) as GoalContributionRow | undefined;
  }

  private buildGoalSnapshot(goal: CrewGoalRecord) {
    const totalDistanceKm = roundDistance(
      goal.members.reduce((sum, member) => sum + member.contributionKm, 0)
    );

    return {
      goalId: goal.id,
      title: goal.title,
      status: goal.status,
      totalDistanceKm,
      targetDistanceKm: goal.targetDistanceKm,
      remainingDistanceKm: Math.max(0, roundDistance(goal.targetDistanceKm - totalDistanceKm)),
      resultLockedAt: goal.resultLockedAt
    };
  }

  private maybeExpireGoal(goalRow: GoalRow) {
    if (goalRow.status !== "active") {
      return;
    }

    const now = this.getNow();

    if (new Date(goalRow.end_time).getTime() > now.getTime()) {
      return;
    }

    const goal = this.buildGoal(goalRow);
    const finalDistanceKm = roundDistance(
      goal.members.reduce((sum, member) => sum + member.contributionKm, 0)
    );

    lockGoalResult(this.sqlite, goal.id, "expired", goal.endTime, finalDistanceKm);
  }

  listAnalyticsEvents(): CrewGoalAnalyticsEventRow[] {
    return this.sqlite
      .prepare(
        `SELECT event_id, event_name, source, goal_id, user_id, properties, created_at
         FROM crew_goal_analytics_events
         ORDER BY created_at DESC`
      )
      .all() as CrewGoalAnalyticsEventRow[];
  }

  private toInviteRecord(row: GoalInviteRow): CrewInviteRecord {
    return {
      id: row.id,
      goalId: row.goal_id,
      inviterId: row.inviter_id,
      inviteeId: row.invitee_id,
      status: row.status as InviteStatus,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    };
  }
}

function buildInviteId(goalId: string, inviteeId: string): string {
  return `invite_${goalId}_${inviteeId}`;
}

function resolveContributionIgnoredReason(
  goal: CrewGoalRecord,
  joinTime: string,
  input: SyncContributionInput
): ContributionIgnoredReason | null {
  const activityEndTime = new Date(input.activityEndTime);

  if (goal.resultLockedAt || goal.status !== "active") {
    return "goal_locked";
  }

  if (input.activityType !== "run" && input.activityType !== "trail_run") {
    return "activity_type";
  }

  if (input.activitySource !== "suunto") {
    return "source";
  }

  if (activityEndTime.getTime() < new Date(joinTime).getTime()) {
    return "before_join";
  }

  if (
    activityEndTime.getTime() < new Date(goal.startTime).getTime() ||
    activityEndTime.getTime() > new Date(goal.endTime).getTime()
  ) {
    return "outside_window";
  }

  return null;
}

function lockGoalResult(
  sqlite: Database.Database,
  goalId: string,
  status: "completed" | "expired",
  lockedAt: string,
  finalDistanceKm: number
) {
  const timestampColumn = status === "completed" ? "completed_at" : "expired_at";

  sqlite
    .prepare(
      `UPDATE goals
       SET status = ?,
           ${timestampColumn} = ?,
           result_locked_at = ?,
           final_distance = ?
       WHERE id = ? AND result_locked_at IS NULL`
    )
    .run(status, lockedAt, lockedAt, finalDistanceKm, goalId);

  sqlite
    .prepare(
      `UPDATE goal_invites
       SET status = 'invalid',
           invalid_reason = ?
       WHERE goal_id = ? AND status = 'pending'`
    )
    .run(status, goalId);
}

function roundDistance(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildDaysUsedLabel(startTime: string, lockedAt: string): string {
  const elapsedMs = Math.max(
    0,
    new Date(lockedAt).getTime() - new Date(startTime).getTime()
  );
  const elapsedDays = Math.max(1, Math.ceil(elapsedMs / (24 * 60 * 60 * 1000)));

  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"}`;
}

function isSqliteUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
