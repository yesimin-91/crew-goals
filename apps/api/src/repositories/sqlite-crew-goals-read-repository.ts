import type Database from "better-sqlite3";

import type {
  GoalRecommendationTier,
  GoalStatus,
  InviteStatus,
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
  IgnoreInviteResult
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
  activity_id: string;
  user_id: string;
  distance: number;
  activity_type: string;
  activity_end_time: string;
  synced_at: string;
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

    return row ? this.buildGoal(row) : null;
  }

  getGoalById(goalId: string): CrewGoalRecord | null {
    const row = this.sqlite
      .prepare("SELECT * FROM goals WHERE id = ?")
      .get(goalId) as GoalRow | undefined;

    return row ? this.buildGoal(row) : null;
  }

  listInvites(): CrewInviteRecord[] {
    const rows = this.sqlite
      .prepare(
        `SELECT *
         FROM goal_invites
         WHERE invitee_id = ?
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

function isSqliteUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
