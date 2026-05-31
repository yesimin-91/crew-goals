# 后端与数据方案

## 后端目标

- 把 Crew Goals 的规则放进服务端，并让前端只负责表达。
- 让 create、accept、ignore、sync、expire、result 这些动作都可验证、可追溯、可审查。
- 让所有关键状态变化都落到明确的数据事实中。

## 领域模型

### Goal

- 保存 creator、title、targetDistance、startTime、endTime、status。
- 保存 recommendationTier 和 recommendationSource。
- 保存 completedAt、expiredAt、resultLockedAt 和 finalDistance。
- 作为目标生命周期的主事实。

### GoalMember

- 保存 goal 与 user 的关系。
- 保存 role、joinTime 和 contributionDistance。
- 作为成员是否能计入活动的判断依据之一。

### GoalInvite

- 保存 inviter、invitee、status、createdAt、acceptedAt、ignoredAt、invalidReason 和 expiresAt。
- 作为邀请流转的主事实。
- 与 goal 生命周期联动失效。

### GoalContribution

- 保存 activityId、userId、distance、activityType、activitySource、activityEndTime、syncedAt、countedAt、status 和 ignoredReason。
- activityId 必须唯一。
- 作为贡献计入和去重的事实基础。

### AnalyticsEvent

- 保存关键产品事件。
- 只用于分析和审计，不参与核心业务决策。

## API 设计

### Goal

- `POST /api/goals`
- `GET /api/goals/active`
- `GET /api/goals/:goalId`
- `GET /api/goals/:goalId/result`

### Recommendation

- `POST /api/recommendations/goal-distance`

### Invite

- `GET /api/invites`
- `GET /api/invites/:inviteId`
- `POST /api/invites/:inviteId/accept`
- `POST /api/invites/:inviteId/ignore`

### Contribution

- `POST /api/contributions/sync`
- `GET /api/post-run/:activityId`

### Operations

- `POST /api/analytics/events`
- `POST /api/notifications/preview`

## 业务规则

### 创建目标

- 必须至少选择一位好友。
- 必须最多选择三位好友。
- 创建者默认加入。
- 同一用户同一时间只能参与一个 active goal。
- goal 创建后立即 active。
- 创建时必须生成 startTime 和 endTime，且周期固定为 7 天。

### 推荐距离

- 推荐值输出 Easy、Recommended、Stretch 三档。
- 优先使用已选成员的历史训练数据。
- 如果可用数据不足，则使用默认值。
- 默认值应清晰表达为 fallback，而不是伪装成真实训练推导结果。

### 接受邀请

- 只允许 pending invite 被接受。
- 用户已有 active goal 时必须拒绝加入。
- invite full、completed、expired、ignored 都必须进入不可加入状态。
- 接受成功后要创建 member 记录。
- 如果并发下出现重复接受，必须保证幂等或返回明确失败。

### 忽略邀请

- 只允许 pending invite 被忽略。
- 已经过期、已满、已完成或已被忽略的邀请不应再接受忽略操作。
- 忽略后不应该再在 active detail 中显示。

### 活动同步

- 只计入 Run 和 Trail Run。
- 只计入 trusted source。
- 只计入成员已加入之后的活动。
- 只计入 goal startTime 与 endTime 之间的活动。
- 同一 activityId 只计入一次。
- 目标已锁定后，活动应返回 goal_locked。

### 到期与完成

- 累计距离达到目标后进入 Completed。
- 到达 endTime 且未完成时进入 Expired。
- 两种状态都要写入 resultLockedAt。
- 锁定后 finalDistance 不再改变。
- Pending invite 在锁定后应进入 invalid。

### 结果查询

- Completed 与 Expired 都应能返回结果 payload。
- 结果页需要包含总距离、目标距离、完成或耗时信息、成员贡献和重启入口。

### 通知预览

- 预览只需要生成可校验的标题、正文和 deep link。
- 不要求第二阶段完成真实 push 投递。
- 如果目标不存在或已失效，预览应返回明确错误。

## 时间规则

- startTime 和 endTime 由服务端生成。
- 所有绝对时间使用 UTC 记录。
- eligibility 判断使用活动结束时间。
- 跨时区或夏令时不应改变绝对截止时间。
- resultLockedAt 以服务端时间写入。

## 事务边界

### create goal

- 创建 goal。
- 创建 creator member。
- 创建 pending invites。
- 写入推荐来源和推荐档位。

### accept invite

- 校验 invite 和 active goal 冲突。
- 更新 invite 状态。
- 创建 joined member。
- 必要时触发其他 invite 的失效状态更新。

### sync contribution

- 校验 duplicate。
- 校验 activity type 和 source。
- 校验 member joinTime。
- 校验 goal time window。
- 写入 contribution。
- 更新 member 累计贡献。
- 必要时锁定 goal。

### expire goal

- 校验 goal 仍然 active。
- 锁定为 expired。
- 写入 expiredAt、resultLockedAt 和 finalDistance。
- 使 pending invites 失效。

## 数据模型约束

### goals

- `status` 必须是有限状态值。
- `completed_at`、`expired_at`、`result_locked_at`、`final_distance` 都应允许为空。
- `recommendation_tier` 和 `recommendation_source` 都应落库。

### goal_members

- `goal_id` 与 `user_id` 组合必须唯一。
- `join_time` 必须可用于后续 eligibility 判断。
- `contribution_distance` 可以作为聚合字段保留，但不能成为唯一事实来源。

### goal_invites

- `status` 必须受限于邀请状态机。
- `expires_at` 必须和 goal endTime 对齐。
- `invalid_reason` 必须能表达 full、completed、expired、ignored 和 active_goal_conflict。

### goal_contributions

- `activity_id` 必须唯一。
- `status` 必须区分 counted 与 ignored。
- `ignored_reason` 必须能表达 activity_type、source、before_join、outside_window、duplicate、goal_locked 和 no_active_goal。

### analytics_events

- `event_id` 必须唯一。
- 事件应可重复写入但不能重复污染事实。
- properties 应保留结构化对象序列化结果。

## 读模型建议

- Goal Detail 应返回团队进度、timeline、member list、pending invites、recent activity。
- Join Goal 应返回邀请人、目标周期、成员数和可加入性原因。
- Post-run Card 应返回是否计入、为什么没有计入、目标当前状态。
- Result 页面应返回完成时间或到期时间、总距离和成员贡献。

## 定时与异步策略

### MVP 阶段

- 读取 goal 时补做过期检查。
- 活动同步时补做完成检查。
- 通知只保留预览接口。

### 稳定化阶段

- 增加后台扫描任务处理 Expired goals。
- 增加 reminder 任务处理 24h left。
- 如果后续活动量增加，再考虑把同步和通知拆成 worker。

## 测试重点

### 领域测试

- 创建目标约束。
- 接受邀请约束。
- 忽略邀请约束。
- 活动 eligibility。
- duplicate handling。
- completed lock。
- expired lock。

### 接口测试

- 正常创建。
- 正常邀请接受。
- active goal conflict。
- invite full。
- invite completed。
- invite expired。
- duplicate activity。
- ineligible activity。
- goal locked outcome。

### 数据一致性测试

- 事务失败回滚。
- 并发接受不出现双重成员。
- 重复同步不重复计入。
- 完成与到期不会互相覆盖锁定结果。

## 审查重点

- 所有关键状态是否都在服务端裁决。
- 是否存在写操作未包事务的情况。
- 是否存在重复 activity 产生重复贡献的路径。
- 是否存在 result lock 之后还能继续增长总距离的路径。
- 是否存在 invite 状态和 goal 状态不一致的路径。
