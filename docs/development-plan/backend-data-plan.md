# Crew Goals 后端与数据方案

## 后端目标

后端的主要职责不是“提供接口”本身，而是把 PRD 中的规则转化为一致、可追溯、可验证的领域行为。Goal 是否有效、Invite 是否可接受、Contribution 是否可计入，都必须由后端做最终裁决。

## 领域边界

### Goal

负责这些概念：

- 创建者
- 标题
- 推荐档位
- 目标距离
- 开始与结束时间
- 当前状态
- 结果锁定信息

### GoalMember

负责这些概念：

- 用户与 Goal 的从属关系
- role
- joinTime
- 当前累计贡献

### GoalInvite

负责这些概念：

- 邀请发起人与被邀请人
- invite 状态
- invite 失效原因
- invite 随 goal 同步失效

### GoalContribution

负责这些概念：

- 活动来源
- 活动类型
- 活动结束时间
- 同步时间
- 计入状态
- ignored reason

## 推荐模块划分

建议在 `apps/api/src` 中按业务拆分：

```text
modules/
  goals/
  invites/
  contributions/
  recommendations/
services/
repositories/
routes/
schemas/
lib/
```

### goals module

- create goal
- get active goal
- get goal detail
- lock completed goal
- lock expired goal
- build result payload

### invites module

- list invites
- accept invite
- ignore invite
- invalidate stale invites
- resolve availability status

### contributions module

- count contribution
- reject ineligible contribution
- reject duplicate contribution
- build recent activity payload

### recommendations module

- compute Easy / Recommended / Stretch
- choose default fallback values
- expose explanation source

## 接口建议

### Goal

建议提供这些接口：

- `POST /api/goals`
- `GET /api/goals/active`
- `GET /api/goals/:goalId`
- `GET /api/goals/:goalId/result`

### Recommendation

- `POST /api/recommendations/goal-distance`

请求内容可包含：

- creatorId
- selectedFriendIds

响应内容建议包含：

- target options
- default selected tier
- source explanation

### Invite

- `GET /api/invites`
- `GET /api/invites/:inviteId`
- `POST /api/invites/:inviteId/accept`
- `POST /api/invites/:inviteId/ignore`

### Contribution

- `POST /api/contributions/sync`
- `GET /api/goals/:goalId/activities/recent`
- `GET /api/post-run/:activityId`

## 数据模型建议

### goals

建议继续沿用当前核心字段，并补充这些关注点：

- `status`
- `completed_at`
- `expired_at`
- `result_locked_at`
- `final_distance`
- `recommendation_tier`
- `recommendation_source`

### goal_members

建议保留：

- `goal_id`
- `user_id`
- `role`
- `join_time`
- `contribution_distance`

如果后续决定不缓存成员累计贡献，也可以把 `contribution_distance` 视为冗余聚合字段，统一由服务层维护。

### goal_invites

建议保留：

- `status`
- `accepted_at`
- `ignored_at`
- `invalid_reason`
- `expires_at`

### goal_contributions

建议保留：

- `activity_id` 唯一约束
- `activity_type`
- `activity_source`
- `activity_end_time`
- `synced_at`
- `counted_at`
- `status`
- `ignored_reason`

## 事务边界

### create goal

一个事务内完成：

- 创建 goal
- 创建 creator member
- 创建 pending invites

### accept invite

一个事务内完成：

- 校验 invite 可用性
- 校验用户 active goal 冲突
- 更新 invite 状态
- 创建 joined member
- 更新 goal member list 相关聚合信息
- 必要时使其他 invite 失效

### count contribution

一个事务内完成：

- 校验 duplicate
- 校验 eligibility
- 写入 contribution
- 更新 member aggregate
- 更新 goal total / status
- 若完成则锁定 result

### expire goal

一个事务内完成：

- 校验当前 goal 仍为 active
- 更新 goal 为 expired
- 写入 lock 时间
- 更新最终距离
- 将未完成 invite 置为 invalid

## 规则实现建议

### active goal conflict

- 不依赖前端缓存判断
- 后端在创建 goal 与接受 invite 时都要检查
- 统一返回 machine-readable reason

### invite validity

后端需要统一判断：

- full
- completed
- expired
- ignored
- active_goal_conflict

### contribution eligibility

后端需要统一判断：

- activity type
- trusted source
- member joined
- after join time
- inside goal time window
- goal not locked
- not duplicate

### result locking

- Completed 与 Expired 都写入 `result_locked_at`
- 锁定后不允许后续活动继续增加距离
- Post-run card 看到 duplicate 或 locked outcome 时，前端按结果态展示

## 定时与异步策略

### MVP 最小实现

- 在读取 goal 详情时顺手执行过期检查
- 在 contribution 写入时顺手执行完成检查
- 通知先作为接口或占位模块，不要求第一阶段完成完整发送链路

### 稳定化实现

- 增加后台扫描任务处理 Expired goals
- 增加 reminder 任务处理 `24h left`
- 将活动同步从直接 API 调用升级为事件入口或 worker 处理

## 返回模型建议

前端最常用的不是原始表结构，而是 screen-oriented payload。建议至少有这些视图模型：

- goal summary
- goal detail
- invite join view
- post-run contribution result
- completed result
- expired result

建议返回的数据尽量接近页面需要的结构，例如：

- joined members
- pending invites
- progress percent
- on-track status
- recent activity list
- availability reason

## 测试重点

### 领域测试

- create goal constraints
- accept invite constraints
- duplicate contribution rejection
- eligibility matrix
- completed lock
- expired lock

### 接口测试

- 正常创建
- 正常加入
- active goal conflict
- invite full
- invite ended
- duplicate activity
- ineligible activity

### 数据一致性测试

- 事务失败回滚
- 重复请求幂等
- completion 与 expiration 不可重复锁定

## 上线前最低要求

- 主链路接口齐全
- 关键事务具备保护
- 活动去重可靠
- UTC 时间规则落地
- result lock 行为稳定
- 边界场景可返回明确 outcome
