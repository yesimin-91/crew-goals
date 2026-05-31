# 实施步骤

## 第 1 步：补齐创建链路

- 实现 `/goals/create`、`/goals/friends`、`/goals/preview`。
- 接推荐接口和创建接口。
- 完成后，用户应能从 Home 或 Goals Hub 创建 7 天 Distance Goal，并邀请 1 到 3 位好友。

## 第 2 步：打通邀请动作

- 把 `InviteDetailPage` 的 disabled CTA 改成真实 `Join Goal` 和 `Not now`。
- 接 `POST /api/invites/:inviteId/accept` 和 `POST /api/invites/:inviteId/ignore`。
- 处理 `active goal conflict`、`full`、`expired`、`completed`、`ignored` 的错误态。

## 第 3 步：补 Post-run Contribution Card

- 新增 `/post-run/:activityId` 页面。
- 接 `GET /api/post-run/:activityId` 和必要时的 sync 结果展示。
- 覆盖 `updating`、`counted`、`already_counted`、`not_counted`、`goal_locked`。

## 第 4 步：补结果页和 restart

- 新增 `/results/:goalId/completed` 和 `/results/:goalId/expired`。
- 接 `GET /api/goals/:goalId/result`。
- 实现 `Start Another Goal` 进入 create flow，并带上一轮 joined members 的预选逻辑。

## MVP 约束

- 这只是一个 MVP，所以不需要分享和埋点。
