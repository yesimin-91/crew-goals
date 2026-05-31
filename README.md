# Crew Goals

Crew Goals 是一个 7 天游程式 Team Goal MVP monorepo，用来演示创建目标、邀请好友、自动累计贡献、结果锁定和重开下一轮的完整闭环。

## What it does

- Home 和 Goals Hub 提供项目入口与当前目标摘要。
- Create Goal 支持选择 1 到 3 位好友、查看推荐距离、发送邀请。
- Invite Detail 支持 Join Goal 和 Not now。
- Post-run 页面解释活动是否计入，以及为什么计入或未计入。
- Result 页面分别处理 Completed 和 Expired，并支持 Start Another Goal。

## Project layout

- `apps/web` - React + TypeScript + Vite 前端
- `apps/api` - Fastify + TypeScript API
- `packages/shared` - 前后端共享契约
- `packages/db` - SQLite bootstrap 和 Drizzle schema

## Quick start

```bash
npm install
npm run dev
```

开发时会同时启动：
- Web: `http://127.0.0.1:5173`
- API: `http://localhost:3001`

Vite 会把 `/api` 代理到 API 服务，所以前端本地开发时不需要单独配置 API 地址。

## Useful scripts

- `npm run dev` - 同时启动 web 和 api
- `npm run dev:web` - 只启动前端
- `npm run dev:api` - 只启动后端
- `npm run build` - 构建 web 和 api
- `npm run typecheck` - 检查 web 和 api 的 TypeScript

## Demo and data

- API 默认会自动初始化 SQLite demo 数据。
- `apps/web` 支持 mock 模式，适合无后端联调或演示。
- mock 模式开关：`VITE_CREW_GOALS_USE_MOCKS=true`

## Main routes

- `/` - Home
- `/goals` - Goals Hub
- `/goals/create` - Create Goal
- `/goals/friends` - Create Goal step
- `/goals/preview` - Create Goal step
- `/invites` - Invites list
- `/invites/:inviteId` - Invite Detail
- `/post-run/:activityId` - Post-run Contribution Card
- `/results/:goalId/completed` - Completed result
- `/results/:goalId/expired` - Expired result

## Documentation

- [`docs/PRD_v2.md`](/Users/xiesimin/Desktop/crew-goals/docs/PRD_v2.md)
- [`docs/development-plan-v2/README.md`](/Users/xiesimin/Desktop/crew-goals/docs/development-plan-v2/README.md)
- [`docs/development-plan-v2/implementation-steps.md`](/Users/xiesimin/Desktop/crew-goals/docs/development-plan-v2/implementation-steps.md)
- [`docs/development-plan-v2/review-guide.md`](/Users/xiesimin/Desktop/crew-goals/docs/development-plan-v2/review-guide.md)

## Notes

- The MVP intentionally avoids share and analytics expansion beyond the documented flows.
- SQLite data lives under `apps/api/data/`.
- Shared behavior rules are documented in `docs/`, not duplicated in the README.
