---
name: crew-goals-frontend
description: Frontend standards for the Crew Goals project. Use when implementing or reviewing React and TypeScript work in apps/web, including page flows from docs/PRD_v2.md, route structure, state management, API integration, styling, interaction logic, and frontend refactors for Crew Goals screens such as home entry, create goal, invite join, goal detail, post-run card, completed, and expired states.
---

# Crew Goals Frontend

## Overview

Use this skill to keep the Crew Goals frontend consistent as the project grows from a demo into a production-ready React and TypeScript app. Treat `docs/PRD_v2.md` as the product source of truth and implement UI so that page states, copy intent, and business boundaries stay aligned with the PRD.

## Working Rules

1. Read `docs/PRD_v2.md` before changing flows, labels, or eligibility-related UI.
2. Preserve the current stack unless there is a clear reason to change it:
   - React
   - TypeScript
   - Vite
   - React Router
3. Build frontend code under `apps/web/src`.
4. Keep route-level screens thin. Put reusable logic and display building blocks into separate modules instead of growing large page files.
5. Prefer explicit, typed data flow over ad hoc local state webs.

## Architecture

Use this target structure as the app expands:

```text
apps/web/src/
├── app/              # app shell, router, global providers
├── pages/            # route-level screens mapped to PRD pages
├── features/         # feature modules such as goal, invite, contribution
├── components/       # shared presentational UI
├── services/         # API clients and transport helpers
├── mocks/            # temporary fixtures and fake payloads
├── lib/              # pure helpers, formatters, constants
└── styles/           # global tokens and shared CSS
```

Apply these boundaries:

- `pages/`: compose feature modules and handle route params
- `features/`: own feature-specific UI, hooks, selectors, and view models
- `services/`: contain fetch logic and request/response mapping only
- `lib/`: keep pure and framework-light

Do not mix API calls, route branching, formatting logic, and large JSX trees in one file once a screen becomes non-trivial.

## Page Mapping

Create screens that mirror the PRD instead of inventing generic containers. Use clear names such as:

- `HomeEntryPage`
- `GoalsHubPage`
- `CreateGoalPage`
- `ChooseFriendsPage`
- `GoalPreviewPage`
- `JoinGoalPage`
- `GoalDetailPage`
- `PostRunContributionPage`
- `GoalCompletedPage`
- `GoalExpiredPage`

When one PRD page has many sub-states, keep one route and branch through typed state objects instead of creating many hidden one-off booleans.

## Component Standards

- Keep components focused on one responsibility.
- Prefer composition over deeply configurable mega-components.
- Extract repeated cards, metric rows, member rows, status pills, and empty states into shared components only after the repetition is real.
- Use props interfaces for every exported component.
- Keep derived values outside JSX when they are not trivial.
- Avoid passing raw backend payloads deep into the tree. Map them to UI-friendly view models first.

## State Management

- Use local component state for view-only concerns such as tabs, input values, modal visibility, and optimistic toggles.
- Use feature hooks or shared query state for server-backed data.
- Keep domain invariants on the backend. Frontend should reflect constraints, not re-own them.
- Model async state explicitly: `idle`, `loading`, `success`, `error`, and when useful `empty` or `updating`.
- Prefer one typed state object over many loosely related booleans.

Examples:

- Good: `inviteAvailability: "available" | "full" | "ended" | "blocked-by-active-goal"`
- Avoid: `isFull`, `isEnded`, `isBlocked`, `showUnavailableBanner`

## API Integration

- Access backend data through service modules, not inline `fetch` calls scattered across pages.
- Type every request and response shape.
- Keep data normalization close to the service layer.
- Treat backend time, status, and eligibility as authoritative.
- Do not hardcode product rules in multiple components; centralize copy-friendly interpretation in feature selectors or helpers.

When backend APIs are incomplete:

- Keep temporary mock data in `mocks/`
- Name it clearly as temporary
- Make it easy to replace with real API wiring

Do not bury fake data inside unrelated components.

## Styling Standards

- Reuse the visual direction already established in the project unless the user asks for a redesign.
- Prefer CSS files and shared tokens over inline style objects for substantial styling.
- Define reusable design tokens for spacing, color, radius, and typography before duplicating raw values.
- Treat this project as mobile-only by default.
- Design and implement for mobile viewport behavior first.
- Do not spend effort on desktop-specific layouts, wide-screen enhancements, or dual-mode responsive compositions unless the user explicitly asks for them.
- It is acceptable for desktop to remain a simple centered preview of the mobile experience, but desktop should not drive layout decisions.
- Preserve clear visual hierarchy: team progress first, personal contribution second, secondary metadata last.
- Use motion only when it clarifies state changes such as sync, completion, or transitions between result states.

## UX Rules From The PRD

Frontend must reinforce these product truths:

- Crew Goals is asynchronous
- Goal starts immediately after invite send
- Late joiners count future runs only
- Only eligible Run or Trail Run activities count
- Completed and Expired states are locked
- Ignored invites are not shown in active goal detail
- Expired messaging should be non-punitive

If copy or layout would blur one of these rules, fix the UI before polishing visuals.

## TypeScript Standards

- Keep `strict` TypeScript clean. Do not mute errors with `any`.
- Prefer narrow unions and named interfaces over broad loose objects.
- Use `type` for unions and mapped types; use `interface` for exported object contracts when that improves readability.
- Parse nullable API fields deliberately.
- Avoid non-null assertions unless the invariant is truly guaranteed by surrounding code.

## Refactoring Rules

- Refactor when a page file starts mixing route logic, mock data, formatting, and multiple card sections.
- Favor small, behavior-preserving refactors before big rewrites.
- When moving code, preserve external behavior and route semantics first, then improve internal structure.
- If a demo artifact is being replaced by product code, port useful content rather than rewriting blindly.

## Validation

Before finishing frontend work:

1. Confirm the screen still matches `docs/PRD_v2.md`.
2. Run typecheck and build when the change is substantial.
3. Verify empty, loading, success, and error states for touched flows.
4. Check mobile layout first.
5. Ensure user-facing text does not accidentally contradict backend rules.

## Review Lens

When reviewing frontend changes, prioritize:

1. PRD behavior mismatches
2. State bugs caused by overlapping booleans or duplicated rules
3. Components that are too coupled to mock data
4. Missing loading, unavailable, or error states
5. Visual hierarchy problems that bury the team-progress story
