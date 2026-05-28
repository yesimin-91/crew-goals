---
name: crew-goals-backend
description: Backend standards for the Crew Goals project. Use when implementing or reviewing TypeScript server work in apps/api and packages/db, including Fastify routes, SQLite schema changes, domain services, invite and goal lifecycle rules, activity contribution counting, idempotency, transactions, and API contracts that support the Crew Goals flows defined in docs/PRD_v2.md.
---

# Crew Goals Backend

## Overview

Use this skill to keep the Crew Goals backend centered on domain correctness. The backend is the source of truth for goal lifecycle, invite validity, contribution eligibility, locking behavior, and UTC time rules described in `docs/PRD_v2.md`.

## Working Rules

1. Read `docs/PRD_v2.md` before changing any domain rule, status transition, or API contract.
2. Preserve the current stack unless there is a strong reason to change it:
   - Fastify
   - TypeScript
   - SQLite
   - Drizzle schema definitions
3. Keep code under:
   - `apps/api/src` for server and route logic
   - `packages/db/src` for schema and database bootstrap
4. Put business rules in services, not directly in route handlers.
5. Treat the backend as authoritative for time, status, and eligibility decisions.

## Architecture

Grow the backend toward this structure:

```text
apps/api/src/
├── routes/           # Fastify route registration modules
├── modules/
│   ├── goals/
│   ├── invites/
│   └── contributions/
├── services/         # domain operations and workflows
├── repositories/     # database access helpers
├── lib/              # pure utilities, time helpers, errors
└── schemas/          # request and response contracts
```

Use these boundaries:

- `routes/`: transport only
- `services/`: orchestration, domain checks, transitions
- `repositories/`: data persistence details
- `lib/`: pure helpers with no HTTP knowledge

Do not let route handlers become mini-services.

## Domain Priorities

Backend changes must preserve these invariants from the PRD:

- A user can participate in only one active goal at a time
- Goal creation requires creator plus at least one pending invitee
- Goal becomes active immediately when invites are sent
- Goal end time is absolute UTC start time plus seven days
- Completed and Expired results are locked
- Ignored or invalid invites cannot later be accepted
- Only eligible Run and Trail Run activities count
- Only activities after member join time can count
- Duplicate activity IDs must be ignored

If an implementation makes one of these ambiguous, favor clarity over cleverness.

## Route Standards

- Keep Fastify handlers thin.
- Validate all external input before entering domain logic.
- Return stable, typed response shapes.
- Use explicit HTTP status codes for domain failures such as conflict, unavailable invite, or invalid transition.
- Keep route names aligned with product actions, for example:
  - `POST /api/goals`
  - `GET /api/goals/:goalId`
  - `POST /api/invites/:inviteId/accept`
  - `POST /api/invites/:inviteId/ignore`
  - `POST /api/contributions/sync`

Do not encode complex domain workflows as generic mutation endpoints with opaque flags.

## Service Standards

- One service method should represent one domain action.
- Name service methods after business events: `createGoal`, `acceptInvite`, `ignoreInvite`, `countContribution`, `lockExpiredGoals`.
- Keep service inputs and outputs typed.
- Prefer returning structured domain results over booleans.
- Centralize status transitions so they are not duplicated across routes.

Example result style:

- Good: `{ outcome: "invite-unavailable", reason: "goal-full" }`
- Avoid: `false`

## Transaction Rules

Use database transactions when an operation updates multiple records that define one business event, especially:

- goal creation plus invite creation
- invite acceptance plus member creation plus pending invite invalidation
- contribution insert plus aggregate updates plus completion lock
- goal expiry or completion locking

When in doubt, choose the safer transactional boundary.

## Time And Eligibility Rules

- Store and compare times in UTC.
- Compute `endTime` on the server.
- Use activity end time for eligibility checks.
- Treat goal lock timestamps as authoritative.
- Do not let client-provided timestamps decide lifecycle transitions without server validation.

Keep time comparison helpers centralized so the same rule is not reimplemented in multiple places.

## Idempotency And Consistency

- Make duplicate activity handling explicit and safe.
- Prefer unique constraints for data that must never double-count, especially `activityId`.
- Handle repeated sync calls without creating double writes.
- Return a meaningful status for duplicate or ignored contribution attempts instead of silently mutating unrelated state.

Use schema constraints to back up service logic, not replace it.

## Database Standards

- Keep Drizzle schema names close to the PRD data model.
- Use snake_case for persisted columns.
- Add fields intentionally; avoid speculative columns with no current rule behind them.
- Keep bootstrap SQL aligned with Drizzle schema definitions.
- When changing schema shape, update both schema definitions and bootstrap logic in the same change.

For aggregates:

- Prefer storing source-of-truth contribution rows and deriving totals when practical.
- If caching totals later becomes necessary, define one authoritative update path.

## Error Handling

- Distinguish domain errors from unexpected server errors.
- Give domain errors stable machine-readable reasons.
- Keep user-facing copy out of backend responses unless the API explicitly exists for copy delivery.
- Log unexpected failures with enough context to debug, but avoid noisy logs for ordinary domain rejections.

## API Contract Standards

- Type request and response payloads explicitly.
- Keep transport DTOs separate from persistence row shapes when they diverge.
- Avoid leaking raw database rows directly to the frontend.
- Shape responses around product screens: goal summary, invite availability, contribution result, result page payload.

## SQLite-Specific Guidance

- Assume single-node MVP constraints.
- Use transactions for multi-step writes.
- Keep indexes and uniqueness focused on real invariants.
- Be mindful that local SQLite is good for MVP correctness and iteration, not for hiding sloppy state logic.

## Validation

Before finishing backend work:

1. Re-check the relevant PRD rules.
2. Run typecheck and build when the change is substantial.
3. Verify both happy path and rejection path.
4. Verify duplicate, expired, full, and active-goal-conflict cases when relevant.
5. Confirm the backend remains authoritative for status and time.

## Review Lens

When reviewing backend changes, prioritize:

1. Broken domain invariants
2. Missing transactional protection
3. Duplicate business rules spread across handlers
4. Weak duplicate-activity handling
5. Response contracts that leak persistence details or hide domain outcomes
