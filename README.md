# Crew Goals

Crew Goals 是一个面向 Suunto App 的异步团队训练目标 MVP monorepo，用来验证 2-4 位熟人好友是否愿意一起发起一个固定 7 天的 Distance Goal，并在不需要同时开跑的前提下，通过 Run / Trail Run 的同步结果自动累计团队进度。

这个 MVP 重点验证的是完整闭环：创建目标、邀请 1-3 位好友、接受或忽略邀请、查看团队进度与个人贡献、在运动后感知“这次跑步帮团队前进了多少”，以及在 Completed / Expired 之后愿意再次发起下一轮。

## What it does

- Home 和 Goals Hub 提供项目入口与当前目标摘要。
- Create Goal 支持创建固定 7 天 Distance Goal、选择 1 到 3 位好友、查看推荐距离并发送邀请。
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
