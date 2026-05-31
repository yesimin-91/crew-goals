import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createGoalService } from "../apps/api/src/modules/goals/create-goal-service.js";
import { createContributionService } from "../apps/api/src/modules/contributions/contribution-service.js";
import { createGoalsService } from "../apps/api/src/modules/goals/goals-service.js";
import { createHomeEntryService } from "../apps/api/src/modules/home/home-entry-service.js";
import { createInviteActionsService } from "../apps/api/src/modules/invites/invite-actions-service.js";
import { createInvitesService } from "../apps/api/src/modules/invites/invites-service.js";
import { createOperationsService } from "../apps/api/src/modules/operations/operations-service.js";
import { createRecommendationsService } from "../apps/api/src/modules/recommendations/recommendations-service.js";
import { MockCrewGoalsReadRepository } from "../apps/api/src/repositories/mock-crew-goals-read-repository.js";
import {
  seedCrewGoalsReadData,
  SqliteCrewGoalsReadRepository
} from "../apps/api/src/repositories/sqlite-crew-goals-read-repository.js";
import { createServer } from "../apps/api/src/server.js";
import { createDatabase } from "../packages/db/src/index.js";

async function main() {
  const now = new Date("2026-05-29T12:00:00.000Z");

  const recommendation = createRecommendationsService().getGoalDistanceRecommendation({
    selectedFriendIds: ["nora", "isaac"]
  });
  assert.equal(recommendation.options.length, 3, "recommendation option count");
  assert.equal(recommendation.defaultSelectedTier, "recommended", "default selected tier");
  const recommendedOption = recommendation.options.find((option) => option.tier === "recommended");
  assert.ok(recommendedOption, "recommended option exists");

  assertRepository(
    "mock-blocked",
    new MockCrewGoalsReadRepository({
      scenario: "blocked",
      now
    })
  );

  const dbDir = mkdtempSync(join(tmpdir(), "crew-goals-smoke-"));
  const database = createDatabase(join(dbDir, "crew-goals.sqlite"));
  seedCrewGoalsReadData(database.sqlite, now);
  const originalFixture = database.sqlite
    .prepare("SELECT end_time FROM goals WHERE id = ?")
    .get("goal_active_mia_crew") as { end_time: string };
  assertRepository(
    "sqlite-default",
    new SqliteCrewGoalsReadRepository(database.sqlite, { now })
  );
  seedCrewGoalsReadData(database.sqlite, new Date("2030-01-01T00:00:00.000Z"));
  const refreshedFixture = database.sqlite
    .prepare("SELECT end_time FROM goals WHERE id = ?")
    .get("goal_active_mia_crew") as { end_time: string };
  assert.notEqual(
    refreshedFixture.end_time,
    originalFixture.end_time,
    "sqlite demo fixture should refresh when it has expired"
  );
  database.sqlite.close();

  const createDbDir = mkdtempSync(join(tmpdir(), "crew-goals-create-"));
  const createDatabaseResult = createDatabase(join(createDbDir, "crew-goals.sqlite"));
  const createRepository = new SqliteCrewGoalsReadRepository(createDatabaseResult.sqlite, { now });
  const createdGoal = createGoalService(createRepository).createGoal({
    selectedFriendIds: ["nora", "isaac"],
    selectedTier: "recommended"
  });
  assert.equal(createdGoal.goalId.length > 0, true, "create goal id");
  const createdGoalDetail = createGoalsService(createRepository).getGoalDetail(createdGoal.goalId);
  assert.ok(
    createdGoalDetail && createdGoalDetail.screen === "goal_detail",
    "created goal should be readable"
  );
  assert.equal(createdGoalDetail?.title, "Mia + 2 Crew", "created goal title");
  assert.equal(
    createdGoalDetail?.progress.targetDistanceKm,
    recommendedOption.distanceKm,
    "created goal should persist the selected recommendation distance"
  );
  assert.equal(
    createdGoalDetail?.recommendationSource,
    recommendation.source,
    "created goal should persist the recommendation source"
  );
  assert.equal(createdGoalDetail?.pendingInvites.length, 2, "created goal pending invite count");

  const noraRepository = new SqliteCrewGoalsReadRepository(createDatabaseResult.sqlite, {
    now,
    viewerId: "nora"
  });
  const accepted = createInviteActionsService(noraRepository).acceptInvite(createdGoal.inviteIds[0]!);
  assert.equal(accepted.goalId, createdGoal.goalId, "accepted invite goal id");
  const acceptedGoalDetail = createGoalsService(createRepository).getGoalDetail(createdGoal.goalId);
  assert.ok(
    acceptedGoalDetail && acceptedGoalDetail.screen === "goal_detail",
    "accepted goal should be readable"
  );
  assert.equal(acceptedGoalDetail.members.length, 2, "accepted invite should add member");
  assert.equal(
    noraRepository.getInviteById(createdGoal.inviteIds[0]!)?.status,
    "accepted",
    "accepted invite status"
  );
  assert.throws(
    () => createInviteActionsService(noraRepository).acceptInvite(createdGoal.inviteIds[0]!),
    /invite_unavailable/,
    "accepted invite should not be accepted twice"
  );
  const afterDuplicateAcceptGoalDetail = createGoalsService(createRepository).getGoalDetail(
    createdGoal.goalId
  );
  assert.ok(
    afterDuplicateAcceptGoalDetail && afterDuplicateAcceptGoalDetail.screen === "goal_detail",
    "goal should still be readable after duplicate accept"
  );
  assert.equal(
    afterDuplicateAcceptGoalDetail.members.length,
    2,
    "accepted invite should not duplicate members"
  );

  const isaacRepository = new SqliteCrewGoalsReadRepository(createDatabaseResult.sqlite, {
    now,
    viewerId: "isaac"
  });
  const ignoreResult = createInviteActionsService(isaacRepository).ignoreInvite(createdGoal.inviteIds[1]!);
  assert.equal(ignoreResult.inviteId, createdGoal.inviteIds[1], "ignored invite id");
  assert.equal(
    isaacRepository.getInviteById(createdGoal.inviteIds[1]!)?.status,
    "ignored",
    "ignored invite status"
  );
  createDatabaseResult.sqlite.close();

  const app = createServer({
    now: () => new Date("2026-05-29T12:00:00.000Z")
  });
  const defaultActiveGoalResponse = await app.inject({
    method: "GET",
    url: "/api/goals/active"
  });
  assert.equal(defaultActiveGoalResponse.statusCode, 200, "server default active goal status");
  const defaultActiveGoal = defaultActiveGoalResponse.json();
  assert.equal(defaultActiveGoal.screen, "goals_hub");
  assert.equal(defaultActiveGoal.activeGoal?.goalId, "goal_active_mia_crew");

  const scenarioJoinableResponse = await app.inject({
    method: "GET",
    url: "/api/invites?scenario=joinable"
  });
  assert.equal(scenarioJoinableResponse.statusCode, 200, "scenario invite status");
  const scenarioInvites = scenarioJoinableResponse.json();
  assert.equal(
    scenarioInvites.items.some(
      (invite: { availability: string; statusLabel: string }) =>
        invite.availability === "unavailable" && invite.statusLabel === "Goal is full"
    ),
    true,
    "scenario route should still use mock data"
  );

  const blockedCreateResponse = await app.inject({
    method: "POST",
    url: "/api/goals",
    payload: {
      selectedFriendIds: ["zoe"],
      selectedTier: "recommended"
    }
  });
  assert.equal(
    blockedCreateResponse.statusCode,
    409,
    "default create goal should reject active goal conflict"
  );

  const blockedAcceptResponse = await app.inject({
    method: "POST",
    url: "/api/invites/invite_zoe_weekly_push/accept"
  });
  assert.equal(blockedAcceptResponse.statusCode, 409, "blocked invite accept should conflict with active goal");

  const ignoreResponse = await app.inject({
    method: "POST",
    url: "/api/invites/invite_zoe_weekly_push/ignore"
  });
  assert.equal(ignoreResponse.statusCode, 200, "ignore invite should succeed");

  const analyticsEventResponse = await app.inject({
    method: "POST",
    url: "/api/analytics/events",
    payload: {
      eventName: "crew_goal_entry_click",
      source: "home",
      goalId: "goal_active_mia_crew",
      properties: {
        cta: "start_goal"
      }
    }
  });
  assert.equal(analyticsEventResponse.statusCode, 200, "analytics event status");
  assert.equal(
    analyticsEventResponse.json().eventName,
    "crew_goal_entry_click",
    "analytics event name"
  );

  const notificationPreviewResponse = await app.inject({
    method: "POST",
    url: "/api/notifications/preview",
    payload: {
      trigger: "goal_completed",
      goalId: "goal_active_mia_crew",
      recipientId: "mia"
    }
  });
  assert.equal(notificationPreviewResponse.statusCode, 200, "notification preview status");
  assert.equal(
    notificationPreviewResponse.json().screen,
    "notification_preview",
    "notification preview screen"
  );
  assert.equal(
    notificationPreviewResponse.json().deepLink,
    "/results/goal_active_mia_crew/completed",
    "notification preview deeplink"
  );

  const countedContribution = await app.inject({
    method: "POST",
    url: "/api/contributions/sync",
    payload: {
      activityId: "act_sync_001",
      distanceKm: 7.2,
      activityType: "run",
      activitySource: "suunto",
      activityEndTime: "2026-05-29T10:00:00.000Z"
    }
  });
  assert.equal(countedContribution.statusCode, 200, "counted contribution status");
  assert.equal(countedContribution.json().outcome, "counted", "counted contribution outcome");

  const duplicateContribution = await app.inject({
    method: "POST",
    url: "/api/contributions/sync",
    payload: {
      activityId: "act_sync_001",
      distanceKm: 7.2,
      activityType: "run",
      activitySource: "suunto",
      activityEndTime: "2026-05-29T10:00:00.000Z"
    }
  });
  assert.equal(duplicateContribution.json().outcome, "already_counted", "duplicate contribution outcome");

  const ineligibleContribution = await app.inject({
    method: "POST",
    url: "/api/contributions/sync",
    payload: {
      activityId: "act_sync_002",
      distanceKm: 4.3,
      activityType: "walk",
      activitySource: "suunto",
      activityEndTime: "2026-05-29T11:00:00.000Z"
    }
  });
  assert.equal(ineligibleContribution.json().reasonCode, "activity_type", "ineligible contribution reason");

  const postRunResponse = await app.inject({
    method: "GET",
    url: "/api/post-run/act_sync_001"
  });
  assert.equal(postRunResponse.statusCode, 200, "post-run route status");
  assert.equal(postRunResponse.json().state, "counted", "post-run route state");

  const completedDbDir = mkdtempSync(join(tmpdir(), "crew-goals-complete-"));
  const completedDb = createDatabase(join(completedDbDir, "crew-goals.sqlite"));
  seedCrewGoalsReadData(completedDb.sqlite, now);
  const completedRepository = new SqliteCrewGoalsReadRepository(completedDb.sqlite, {
    now,
    viewerId: "mia"
  });
  completedRepository.syncContribution({
    activityId: "act_sync_003",
    userId: "mia",
    distanceKm: 50,
    activityType: "run",
    activitySource: "suunto",
    activityEndTime: "2026-05-29T10:00:00.000Z",
    syncedAt: now.toISOString()
  });
  const completedGoal = completedRepository.getGoalById("goal_active_mia_crew");
  assert.equal(completedGoal?.status, "completed", "completed goal status");
  assert.ok(completedGoal?.resultLockedAt, "completed goal result lock");
  const completedResult = completedRepository.getGoalResult("goal_active_mia_crew");
  assert.equal(completedResult?.screen, "goal_result", "completed result screen");
  assert.equal(completedResult?.status, "completed", "completed result status");
  completedDb.sqlite.close();

  const expiredDbDir = mkdtempSync(join(tmpdir(), "crew-goals-expire-"));
  const expiredDb = createDatabase(join(expiredDbDir, "crew-goals.sqlite"));
  seedCrewGoalsReadData(expiredDb.sqlite, now);
  const expiredRepository = new SqliteCrewGoalsReadRepository(expiredDb.sqlite, {
    now: new Date("2030-01-01T00:00:00.000Z"),
    viewerId: "mia"
  });
  expiredRepository.expireActiveGoal("goal_active_mia_crew");
  const expiredGoal = expiredRepository.getGoalById("goal_active_mia_crew");
  assert.equal(expiredGoal?.status, "expired", "expired goal status");
  assert.ok(expiredGoal?.resultLockedAt, "expired goal result lock");
  const expiredResult = expiredRepository.getGoalResult("goal_active_mia_crew");
  assert.equal(expiredResult?.screen, "goal_result", "expired result screen");
  assert.equal(expiredResult?.status, "expired", "expired result status");
  expiredDb.sqlite.close();

  const goalResultDbDir = mkdtempSync(join(tmpdir(), "crew-goals-result-"));
  const goalResultDb = createDatabase(join(goalResultDbDir, "crew-goals.sqlite"));
  seedCrewGoalsReadData(goalResultDb.sqlite, now);
  const goalResultRepository = new SqliteCrewGoalsReadRepository(goalResultDb.sqlite, {
    now,
    viewerId: "mia"
  });
  createContributionService(goalResultRepository).syncContribution({
    activityId: "act_sync_004",
    distanceKm: 50,
    activityType: "run",
    activitySource: "suunto",
    activityEndTime: "2026-05-29T10:00:00.000Z"
  });
  const goalResultApp = createServer({
    now: () => now,
    database: goalResultDb,
    seedDemoData: false
  });
  const goalResultResponse = await goalResultApp.inject({
    method: "GET",
    url: "/api/goals/goal_active_mia_crew/result"
  });
  assert.equal(goalResultResponse.statusCode, 200, "goal result route status");
  assert.equal(goalResultResponse.json().screen, "goal_result", "goal result route screen");
  const goalResultAnalytics = goalResultDb.sqlite
    .prepare(
      `SELECT event_name, source, goal_id
       FROM crew_goal_analytics_events
       WHERE event_name = ?`
    )
    .get("crew_goal_completed") as { event_name: string; source: string; goal_id: string };
  assert.equal(goalResultAnalytics.event_name, "crew_goal_completed", "goal completed event logged");
  assert.equal(goalResultAnalytics.source, "postrun", "goal completed source");
  assert.equal(goalResultAnalytics.goal_id, "goal_active_mia_crew", "goal completed goal id");
  await goalResultApp.close();
  goalResultDb.sqlite.close();

  let clock = new Date("2026-05-29T12:00:00.000Z");
  const timeAwareApp = createServer({
    now: () => clock
  });
  const firstHomeResponse = await timeAwareApp.inject({
    method: "GET",
    url: "/api/home-entry"
  });
  assert.equal(firstHomeResponse.statusCode, 200, "first home status");
  const firstHome = firstHomeResponse.json();
  clock = new Date("2030-01-01T00:00:00.000Z");
  const secondHomeResponse = await timeAwareApp.inject({
    method: "GET",
    url: "/api/home-entry"
  });
  assert.equal(secondHomeResponse.statusCode, 200, "second home status");
  const secondHome = secondHomeResponse.json();
  assert.notEqual(
    secondHome.activeGoal?.timeline?.hoursLeft,
    firstHome.activeGoal?.timeline?.hoursLeft,
    "default server path should evaluate time per request"
  );
  await timeAwareApp.close();

  const analyticsDbDir = mkdtempSync(join(tmpdir(), "crew-goals-analytics-"));
  const analyticsDb = createDatabase(join(analyticsDbDir, "crew-goals.sqlite"));
  seedCrewGoalsReadData(analyticsDb.sqlite, now);
  const operationsRepository = new SqliteCrewGoalsReadRepository(analyticsDb.sqlite, {
    now,
    viewerId: "mia"
  });
  createOperationsService(operationsRepository).recordAnalyticsEvent({
    eventName: "crew_goal_detail_view",
    source: "goals_hub",
    goalId: "goal_active_mia_crew",
    properties: {
      source: "goals_hub"
    }
  });
  const storedAnalytics = analyticsDb.sqlite
    .prepare(
      `SELECT event_name, source, goal_id, user_id
       FROM crew_goal_analytics_events
       WHERE event_name = ?`
    )
    .get("crew_goal_detail_view") as {
    event_name: string;
    source: string;
    goal_id: string;
    user_id: string;
  };
  assert.equal(storedAnalytics.event_name, "crew_goal_detail_view", "analytics stored event");
  assert.equal(storedAnalytics.source, "goals_hub", "analytics stored source");
  assert.equal(storedAnalytics.goal_id, "goal_active_mia_crew", "analytics stored goal");
  assert.equal(storedAnalytics.user_id, "mia", "analytics default user");
  analyticsDb.sqlite.close();

  await app.close();

  console.log("http-contract-smoke: ok");
}

function assertRepository(
  label: string,
  repository: MockCrewGoalsReadRepository | SqliteCrewGoalsReadRepository
) {
  const homeResponse = createHomeEntryService(repository).getHomeEntry();
  const goalsService = createGoalsService(repository);
  const invitesService = createInvitesService(repository);
  const activeGoalResponse = goalsService.getActiveGoal();
  const goalDetailResponse = goalsService.getGoalDetail("goal_active_mia_crew");
  const invitesListResponse = invitesService.listInvites();
  const inviteDetailResponse = invitesService.getInviteDetail("invite_zoe_weekly_push");

  assert.equal(homeResponse.screen, "home_entry", `${label}: home screen`);
  assert.equal(homeResponse.state, "active_goal", `${label}: home state`);
  assert.equal(homeResponse.activeGoal?.goalId, "goal_active_mia_crew", `${label}: home goal`);

  assert.equal(activeGoalResponse.screen, "goals_hub", `${label}: hub screen`);
  assert.equal(activeGoalResponse.activeGoal?.goalId, "goal_active_mia_crew", `${label}: active goal id`);
  assert.equal(activeGoalResponse.activeGoal?.crew.joinedMemberCount, 2, `${label}: active goal members`);

  assert.ok(goalDetailResponse && goalDetailResponse.screen === "goal_detail", `${label}: goal detail`);
  assert.equal(goalDetailResponse.goalId, "goal_active_mia_crew", `${label}: goal detail id`);
  assert.equal(goalDetailResponse.members.length, 2, `${label}: joined members`);
  assert.equal(goalDetailResponse.recentActivity.length > 0, true, `${label}: activities exist`);

  assert.equal(invitesListResponse.items.length > 0, true, `${label}: invites exist`);
  assert.equal(
    invitesListResponse.items.some(
      (invite) => invite.availability === "blocked" && invite.statusLabel.includes("current goal")
    ),
    true,
    `${label}: blocked invite state`
  );

  assert.ok(inviteDetailResponse, `${label}: invite detail exists`);
  assert.equal(inviteDetailResponse.goal.goalId, "goal_zoe_weekly_push", `${label}: invite goal`);
  assert.equal(inviteDetailResponse.availability.reasonCode, "active_goal_conflict", `${label}: blocked reason`);
  assert.equal(
    inviteDetailResponse.availability.currentUserActiveGoalId,
    "goal_active_mia_crew",
    `${label}: current active goal id`
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
