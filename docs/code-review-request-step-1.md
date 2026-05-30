# Code Review Request: Step 1 Contract Consolidation

## Background

This change completes the first development step for the Crew Goals MVP refactor:

- unify shared contracts as the single source of truth
- remove independent frontend contract ownership
- keep current pages working during the migration

The scope is intentionally narrow. No product behavior or route flow is changed in this step.

## Change Summary

### 1. Added frontend compatibility contract aliases in shared

Updated [packages/shared/src/contracts.ts](/Users/xiesimin/Desktop/crew-goals/packages/shared/src/contracts.ts) to keep the existing API DTOs intact while adding a temporary `WebCompat*` compatibility layer for the current web app.

Added:

- `WebCompatEntryOverview`
- `WebCompatGoalSummary`
- `WebCompatGoalDetail`
- `WebCompatGoalMember`
- `WebCompatPendingInvite`
- `WebCompatRecentActivity`
- `WebCompatInviteListItem`
- `WebCompatInviteDetail`
- `WebCompatInviteAvailabilityReason`
- `WebCompatHighlightItem`

Purpose:

- preserve current web typing needs
- avoid duplicate business contract definitions in `apps/web`
- create a migration bridge so later steps can replace UI compatibility types gradually

### 2. Replaced frontend local contract definitions with re-exports

Rewrote [apps/web/src/types/crewGoals.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/types/crewGoals.ts) so it no longer owns its own interfaces.

It now only re-exports contract types from `packages/shared`.

Purpose:

- ensure frontend contract imports resolve back to one shared source
- reduce contract drift risk between `apps/web` and `packages/shared`
- keep current imports stable without forcing a large cross-file refactor in this step

### 3. Added explicit HTTP DTO-to-web mapping

Added [apps/web/src/services/apiContracts.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/apiContracts.ts) as the runtime contract adapter between backend screen-oriented DTOs and the current web compatibility models.

Updated these services to use shared API DTOs at the fetch boundary and map them explicitly before returning data to pages:

- [apps/web/src/services/homeService.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/homeService.ts)
- [apps/web/src/services/goalService.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/goalService.ts)
- [apps/web/src/services/contributionService.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/contributionService.ts)
- [apps/web/src/services/inviteService.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/inviteService.ts)

Purpose:

- stop treating backend JSON as legacy web-shaped payloads
- ensure HTTP mode and mock mode cross the same mapping boundary
- make runtime DTO mismatches visible in one place instead of leaking into pages

### 4. Expanded shared/backend invite DTOs to support runtime-safe mapping

Updated shared and backend invite payload builders so the frontend no longer has to infer critical values from copy strings.

Touched:

- [packages/shared/src/contracts.ts](/Users/xiesimin/Desktop/crew-goals/packages/shared/src/contracts.ts)
- [apps/api/src/modules/invites/invite-read-models.ts](/Users/xiesimin/Desktop/crew-goals/apps/api/src/modules/invites/invite-read-models.ts)
- [apps/api/src/modules/invites/invites-service.ts](/Users/xiesimin/Desktop/crew-goals/apps/api/src/modules/invites/invites-service.ts)

Added structured fields such as:

- `goalId`
- `title`
- `targetDistanceKm`
- `durationDays`
- `currentJoinedMemberCount`
- `pendingInviteCount`
- `startTime`
- `endTime`
- `currentUserActiveGoalId`

### 5. Aligned mock mode with the same runtime boundary

Rebuilt [apps/web/src/mocks/mockCrewGoalsApi.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/mocks/mockCrewGoalsApi.ts) so it now starts from shared backend-style DTOs and passes through the same mapping functions used by HTTP mode.

## Files In Scope

- [packages/shared/src/contracts.ts](/Users/xiesimin/Desktop/crew-goals/packages/shared/src/contracts.ts)
- [apps/web/src/types/crewGoals.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/types/crewGoals.ts)
- [apps/web/src/services/apiContracts.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/apiContracts.ts)
- [apps/web/src/services/homeService.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/homeService.ts)
- [apps/web/src/services/goalService.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/goalService.ts)
- [apps/web/src/services/contributionService.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/contributionService.ts)
- [apps/web/src/services/inviteService.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/services/inviteService.ts)
- [apps/web/src/mocks/mockCrewGoalsApi.ts](/Users/xiesimin/Desktop/crew-goals/apps/web/src/mocks/mockCrewGoalsApi.ts)
- [apps/api/src/modules/invites/invite-read-models.ts](/Users/xiesimin/Desktop/crew-goals/apps/api/src/modules/invites/invite-read-models.ts)
- [apps/api/src/modules/invites/invites-service.ts](/Users/xiesimin/Desktop/crew-goals/apps/api/src/modules/invites/invites-service.ts)
- [scripts/http-contract-smoke.ts](/Users/xiesimin/Desktop/crew-goals/scripts/http-contract-smoke.ts)

## What Did Not Change

- no route changes
- no UI behavior changes
- no database changes
- no page component structure changes
- no route additions
- no new product flows

## Validation

Executed:

```bash
npm run typecheck
```

```bash
./node_modules/.bin/tsc --module esnext --moduleResolution bundler --target es2022 --lib es2022,dom --strict --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck --outDir /private/tmp/crew-goals-smoke scripts/http-contract-smoke.ts
node /private/tmp/crew-goals-smoke/scripts/http-contract-smoke.js
```

Result:

- web typecheck passed
- api typecheck passed
- runtime DTO-to-web contract smoke test passed
- blocked invite conflict branch is covered in smoke validation

## Review Focus

Please focus review on:

1. Whether `packages/shared` is now the effective single source of truth for the frontend contract layer.
2. Whether the `WebCompat*` compatibility naming is clear enough for temporary migration use.
3. Whether the runtime mapping boundary in `apps/web/src/services/apiContracts.ts` is the right place to absorb DTO differences during migration.
4. Whether the invite DTO additions are the minimal structured fields needed to avoid string parsing and hidden runtime coupling.
5. Whether the smoke coverage is sufficient for this phase, or should be promoted into a formal test target next.

## Follow-up Recommendation

In step 2, the next cleanup should continue from the service layer:

- keep migrating page inputs toward shared DTO-first view models
- reduce direct dependence on legacy-shaped web compatibility types
- gradually retire the `WebCompat*` layer once pages are migrated
