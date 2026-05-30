# Step 2 Code Review Request

## Background

Step 1 completed the shared contract unification and the frontend runtime mapping boundary.
This step moves the backend default read path off the in-memory mock dataset and onto SQLite-backed read models, while keeping `scenario`-based mock responses available for demo and smoke coverage.

## Scope

- extract a repository contract that is independent from mock-only types
- add a SQLite-backed `CrewGoalsReadRepository`
- seed SQLite with deterministic Crew Goals read data for the current MVP screens
- switch the default server read path to database mode
- preserve `scenario` query support for mock/debug flows
- extend smoke coverage so both mock and SQLite paths exercise the same shared contract mapping

## Main Changes

### 1. Read repository boundary extracted

- added `apps/api/src/repositories/crew-goals-read-repository.ts`
- service modules now depend on canonical repository record types instead of `MockGoal` / `MockInvite`
- this removes mock dataset types from the service boundary and makes later DB-backed writes easier to add

### 2. SQLite read repository added

- added `apps/api/src/repositories/sqlite-crew-goals-read-repository.ts`
- implemented:
  - `getViewer`
  - `getActiveGoal`
  - `getGoalById`
  - `listInvites`
  - `getInviteById`
  - `getViewerInviteByGoalId`
  - `getUserById`
  - `getNow`
- the repository reconstructs the current read DTO inputs from:
  - `goals`
  - `goal_members`
  - `goal_invites`
  - `goal_contributions`

### 3. Deterministic database seed added

- `seedCrewGoalsReadData()` maintains a deterministic local demo fixture for the default SQLite path
- the fixture is rebuilt when missing, when the fixture version changes, or when the seeded time window has gone stale
- it seeds the same blocked/default MVP scenario that the current app expects at the current clock:
  - one active goal for the viewer
  - a blocked incoming invite
  - an expired/unavailable invite
  - recent counted contributions
- this keeps the default local API behavior aligned with the current time while moving data origin to SQLite

### 4. Server default path switched to DB

- updated `apps/api/src/server.ts`
- default requests now use `SqliteCrewGoalsReadRepository`
- `?scenario=` requests still use `MockCrewGoalsReadRepository`
- result: normal HTTP mode now exercises the real database-backed read path instead of in-memory mock objects

### 5. Smoke coverage expanded

- updated `scripts/http-contract-smoke.ts`
- the same assertions now run against:
  - mock blocked scenario
  - seeded SQLite default scenario
- this guards the shared mapping boundary across both data sources

## Reviewer Focus

Please focus on:

- whether the SQLite repository reconstructs all read-model fields correctly
- whether the default seeded dataset is an acceptable temporary bridge for Step 2
- whether any service logic still leaks mock-only assumptions
- whether we should pull user profile data into DB in the next step instead of keeping the temporary in-process lookup table

## Known Follow-up Items

- user profile data is still a temporary local lookup table, not a persisted table
- `crewLimit` is still a temporary repository constant, not a persisted goal field
- backend invite availability still derives `currentUserActiveGoalId` from `activeGoalAction.href` inside `buildInviteAvailabilitySummary`; frontend no longer parses it, but backend can be tightened further in a follow-up
- write flows are still not implemented in this step
- the default SQLite dataset is still a local demo fixture, not production persistence

## Validation

- `npm run typecheck`
- `scripts/http-contract-smoke.ts` compiled and executed against both mock and SQLite repository paths
