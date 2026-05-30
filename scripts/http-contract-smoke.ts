import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createGoalService } from "../apps/api/src/modules/goals/create-goal-service.js";
import { createGoalsService } from "../apps/api/src/modules/goals/goals-service.js";
import { createHomeEntryService } from "../apps/api/src/modules/home/home-entry-service.js";
import { createInvitesService } from "../apps/api/src/modules/invites/invites-service.js";
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
