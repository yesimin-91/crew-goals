# Crew Goals Phase 1 / MVP PRD v2

## 1. Summary

Crew Goals 是 Suunto App 内的异步团队训练目标功能，让 2-4 位熟人好友在 7 天内共同完成一个跑步距离目标。用户不需要同时开始训练，每次符合条件的 Run / Trail Run 会在同步成功后自动计入团队总进度。

MVP 要验证用户是否愿意创建熟人团队目标、邀请好友加入、持续查看进度、在运动后感受到团队贡献，并在完成或到期后愿意再次发起。

## 2. MVP Scope

MVP 包含：

- 创建固定 7 天 Distance Goal
- 邀请 1-3 位好友，创建者默认加入
- 被邀请者接受或忽略邀请
- 自动累计符合条件的 Run / Trail Run 距离
- 查看团队总进度、我的贡献、成员贡献、轻量 recent activity
- 运动后展示 Contribution Card
- Completed / Expired 后展示结果页，并支持 Start Another Goal

MVP 不包含：

- 实时同跑、实时位置、聊天、陌生人组队
- 排行榜、勋章、个人最低配额
- 自定义目标输入、多目标类型、复杂手表端交互
- 社交 feed、点赞、评论、活动详情展开
- Active Goal 取消、成员退出、创建后追加邀请、目标编辑
- 完整历史目标列表

## 3. Core Rules

### 3.1 User Rules

- 每个用户同一时间只能参与 1 个 active Crew Goal。
- 每个 Goal 创建时必须至少包含 2 个 intended participants：1 个 creator + 至少 1 个 pending invitee。
- Goal 创建后立即 Active，因此好友接受前 joined members 可能暂时只有 creator 1 人。
- 团队上限按 creator + accepted members + pending invites 计算，最多 4 人。
- 创建者默认加入，占用 1 个成员名额。
- 用户可接受或忽略邀请。
- 若用户已有 active Crew Goal，则不能加入新的 invite；Join Goal 页需提供 View Current Goal 入口。

### 3.2 Goal Rules

- 类型固定为 Distance Goal。
- 周期固定为 7 天。
- Send Invite 后 Goal 立即 Active，并开始倒计时。
- Goal 不等待被邀请者全部加入。
- 达到目标距离后进入 Completed。
- 7 天结束但未达到目标进入 Expired。
- Completed / Expired 后锁定结果，不再计入新活动。
- Completed / Expired 不可重开，只能 Start Another Goal。
- Invite 不设置独立 TTL，随 Goal 一起失效：Goal reaches endTime、Goal completed、Goal full、invitee ignores 后均不可再加入。

### 3.3 Lifecycle & Permissions

Phase 1 明确不支持：

- Active Goal 取消
- 已加入成员中途退出
- 创建后编辑目标值
- 创建后编辑成员
- 创建后追加邀请
- Creator 转移
- 手动修正贡献

Invite 可被忽略。Ignored invite 不在 active Goal Detail 中展示，避免形成社交压力。

### 3.4 Goal Title

Phase 1 不开放用户自定义 Goal 名称。系统自动生成名称：

- 2 人：`Mia + Nora Crew`
- 3-4 人：`Mia + 2 Crew`
- 默认 fallback：`Weekly Crew Goal`

Start Another Goal 时重新生成 title。

### 3.5 Prototype Note

Prototype 可包含 ended goal 示例用于验证 Expired 体验，但 Phase 1 production 不包含完整历史列表。

## 4. Recommendation Logic

目标值提供 3 档：

- Easy：团队预估周跑量的 80%
- Recommended：团队预估周跑量的 100%
- Stretch：团队预估周跑量的 120%

预估逻辑：

- 优先使用已选成员过去 4 周 Run / Trail Run 的周均距离。
- 若部分成员缺少数据，仅使用可用成员数据，并显示通用解释。
- 若可用数据不足 2 人，使用系统默认三档：20 km / 35 km / 50 km。
- MVP 不支持用户自由输入目标。
- Start Another Goal 需要基于当前可邀请成员重新计算推荐值。

## 5. Activity Eligibility

### 5.1 Counted Activity

活动需同时满足：

- activityType 为 Run 或 Trail Run。
- activity source 为 Suunto 认可的标准 activity source。
- 用户已加入 Goal。
- 活动完成时间在用户 joinTime 之后。
- 活动完成时间在 Goal startTime 与 endTime 之间。
- 活动同步成功。
- 同一 activityId 未被计入过。

### 5.2 Not Counted

以下活动不计入：

- Cycling、Walking、Gym 等非 Run / Trail Run 活动
- 用户加入前完成的活动
- Goal 开始前或结束后完成的活动
- 手动补录活动
- Phase 1 中未通过可信 source 校验的第三方导入活动
- 重复同步的同一 activityId

### 5.3 Activity Deleted / Updated

Phase 1 默认以活动首次成功计入结果为准，不提供前端手动修正入口。

若底层活动服务已支持 activity deleted / updated event，则服务端可触发贡献重算；否则作为 MVP 限制记录。无论采用哪种技术实现，客户端展示需避免让用户手动干预贡献结果。

### 5.4 Duplicate Activity

- 后台重复同步同一 activityId 时，系统静默忽略，不重复计入。
- 若用户正在查看该活动的 post-run card，展示 Already counted 状态。

## 6. Time Rules

- Goal 创建时由服务端生成绝对 startTime / endTime，存储为 UTC。
- endTime = startTime + 7 * 24 hours。
- eligibility 判断使用服务端记录的绝对时间比较。
- 前端按用户当前本地时区展示剩余时间。
- 跨时区旅行、夏令时变化不改变 Goal 的绝对截止时间。
- activity eligibility 使用 activity end time 判断。

## 7. Status Logic

### 7.1 Goal Status Machine

```text
Draft
 └─ Send Invite
      └─ Active
           ├─ Total distance >= targetDistance → Completed
           │    ├─ completedAt = current server time
           │    ├─ resultLockedAt = completedAt
           │    └─ finalDistance = totalContribution at completion
           └─ Current time >= endTime and target not reached → Expired
                ├─ expiredAt = endTime
                ├─ resultLockedAt = endTime
                └─ finalDistance = totalContribution at endTime
```

### 7.2 Invite Status Machine

```text
Pending
 ├─ User accepts → Accepted
 ├─ User ignores → Ignored
 └─ Goal full / completed / expired / invalid → Invalid
```

### 7.3 Activity Count Status

```text
Activity completed
 └─ Syncing
      ├─ Eligible → Counted
      ├─ Ineligible → Not counted
      └─ Duplicate → Ignored
```

### 7.4 On Track Logic

Goal Detail 状态文案使用统一公式：

- `progressPercent = totalDistance / targetDistance * 100`
- `expectedProgress = elapsedTime / totalDuration * 100`
- 若 `progressPercent >= expectedProgress - 10`，显示 `On track`
- 若未达到上方条件，显示 `{remainingDistance} km left`
- Completed 显示 `Goal completed`
- Expired 显示 `Goal expired`

## 8. Data Model & Interfaces

Goal:

- id
- creatorId
- title
- targetDistance
- startTime UTC
- endTime UTC
- status: Draft / Active / Completed / Expired
- memberIds
- pendingInviteIds
- createdAt
- completedAt nullable
- expiredAt nullable
- resultLockedAt nullable
- finalDistance nullable
- recommendationTier: Easy / Recommended / Stretch
- recommendationSource: recent_training / default

GoalMember:

- goalId
- userId
- role: Creator / Member
- joinTime
- contributionDistance
- status: Joined

GoalInvite:

- id
- goalId
- inviterId
- inviteeId
- status: Pending / Accepted / Ignored / Invalid
- createdAt
- acceptedAt nullable
- ignoredAt nullable
- invalidReason nullable: full / completed / expired / ignored / active_goal_conflict
- expiresAt = Goal endTime

GoalContribution:

- goalId
- activityId
- userId
- distance
- activityType
- activitySource
- activityEndTime
- syncedAt
- countedAt
- status: Counted / Ignored
- ignoredReason nullable: activity_type / source / before_join / outside_window / duplicate / goal_locked

## 9. Page Requirements

### 9.1 Home Entry Card

- 无 active goal 时展示创建引导。
- 有 active goal 时展示当前团队进度摘要。
- 有 active goal 时，点击卡片主体进入 Goal Detail。
- 无 active goal 时，点击卡片主体进入 Goals Hub；Start a Goal CTA 可直接进入 Create Goal。
- 必须在入口文案中区分 Crew Goals 与 Team Up：weekly goal、no need to run together。

### 9.2 Goals Hub

- 无 active goal 时展示空态和 Start a Goal。
- 有 active goal 时展示目标摘要、剩余距离、剩余天数、我的贡献、joined member count 与 pending invite count。
- MVP 只展示当前 active goal，不做复杂历史列表。

### 9.3 Create Goal

- 固定展示 Distance Goal 和 7 days。
- 用 3 步说明玩法：invite friends、run separately、distance adds automatically。
- CTA：Choose Friends。

### 9.4 Choose Friends

- 最少选择 1 位，最多选择 3 位好友。
- 支持搜索。
- 优先展示 recent teammates 和 active friends。
- 无可邀请好友时展示空态，并引导稍后再试或返回。

### 9.5 Goal Recommendation + Preview

- 展示 Easy / Recommended / Stretch 三档。
- 默认选中 Recommended。
- 展示成员头像、人数、目标距离、7 天周期。
- 明确说明：
  - Goal starts immediately when you send invites.
  - Friends who join later will only contribute future runs.
  - No need to run together.
  - Eligible runs add automatically after sync.
- CTA：Send Invite。

### 9.6 Join Goal

- 展示邀请人、目标距离、周期、当前成员数。
- 解释异步玩法和自动累计规则。
- 明确说明：Only runs completed after you join will count toward this goal.
- CTA：Join Goal / Not now。
- 若用户已有 active goal，禁用 Join Goal，并提供 View Current Goal。
- 若 Goal 已满或已结束，展示失效状态页，不只使用 toast。

### 9.7 Goal Detail

- 优先展示团队总进度：已完成距离 / 总目标、百分比、剩余天数。
- 展示统一状态文案：On track / X km left / Goal completed / Goal expired。
- 展示我的贡献。
- 展示成员贡献列表，但不做排名强化。
- 展示 joined members 与 pending invites。
- 不显示 ignored invites。
- recent activity 仅展示最近 3 条贡献事件。
- recent activity 不支持点赞、评论、展开活动详情。
- 无贡献时展示有活性的空态：Your goal has started. The first eligible run will move the team forward.
- 支持 Share Progress。
- 可选入口：Start a Run。

### 9.8 Post-run Contribution Card

- 用户在 active goal 中且活动 eligible：展示本次贡献距离、团队进度变化、剩余距离、剩余时间。
- 活动同步中：展示 updating 状态。
- 活动不 eligible：说明 Phase 1 only counts Run / Trail Run from trusted sources.
- 用户无 active goal：展示轻量创建引导。
- 不展示路线、配速、心率等敏感运动数据。

### 9.9 Goal Completed

- 展示总距离、完成用时、成员贡献。
- CTA：Share Result / Start Another Goal。
- Start Another Goal 进入 Create Goal，并预选上一轮可邀请成员。
- 预选上一轮 joined members，排除当前用户。
- 不预选上一轮 pending invitees 中从未加入的用户。
- 不可邀请成员置灰或不预选，并重新计算推荐目标值。

### 9.10 Goal Expired

- 展示最终完成距离、目标距离、成员贡献。
- CTA：Start Another Goal。
- 不使用失败惩罚型文案。

## 10. Privacy & Visibility

Crew Goal members can see:

- member avatar
- display name
- joined status / pending invite status
- cumulative contribution distance
- lightweight contribution events: name + distance + activity type + relative sync time

Crew Goal members cannot see:

- route map
- GPS track
- pace
- heart rate
- cadence
- calories
- full workout detail
- activity notes

Pending invitees can see only inviter, goal distance, duration, current member count, and high-level rules before joining.

## 11. Share Content

### 11.1 Share Progress

分享卡只包含团队级信息：

- Goal name
- Team progress
- Remaining distance
- Days left
- Team size

不展示个人贡献明细、路线、地图、配速、心率。

### 11.2 Share Result

分享卡只包含团队级信息：

- Goal name
- Completed distance
- Target distance
- Days used
- Team size

不展示个人贡献明细、路线、地图、配速、心率。

## 12. Notification Matrix

| Trigger | Recipient | Direction |
|---|---|---|
| Invite sent | Invitee | `{Name} invited you to a 7-day Crew Goal` |
| Invite accepted | Creator | `{Name} joined your Crew Goal` |
| 24h left and not completed | Joined members | `{X} km left to finish this week` |
| Goal completed | Joined members | `Your Crew Goal is complete` |
| Goal expired | Joined members | `Your Crew Goal ended. Start another week together.` |

Phase 1 不发送“有人贡献了”的 push，避免过度打扰。

Notification deep links:

- Invite sent → Join Goal page
- Invite accepted → Goal Detail
- 24h left → Goal Detail
- Goal completed → Goal Completed
- Goal expired → Goal Expired

If the target goal is no longer available, show the unavailable state instead of dropping the user to Home.

## 13. Edge Case Matrix

| Scenario | Product Behavior |
|---|---|
| No inviteable friends | Show empty state with return path; do not dead-end the flow |
| User has active goal when opening invite | Disable Join Goal; show View Current Goal CTA |
| Invite is full | Show unavailable state page; CTA Back to Home / View Goals |
| Invite has ended | Show unavailable state page; CTA Back to Home / View Goals |
| Activity sync delayed | Show updating state on post-run card |
| Ineligible activity | Explain only Run / Trail Run from trusted sources count |
| No contributions yet | Show active empty state, not a blank feed |
| Duplicate activity sync | Background duplicate sync is silently ignored; if user is viewing the post-run card, show Already counted |
| Completed early | Lock result; show Goal Completed |
| Expired | Lock result; use non-punitive copy and Start Another Goal CTA |

## 14. Loading & Error States

| Scenario | Behavior |
|---|---|
| Goals Hub load failed | Show error state with Try again |
| Send invite failed | Stay on Preview; show inline error or toast |
| Accept invite failed | Stay on Join Goal; show retry |
| Contribution sync failed | Show `Could not update crew progress yet` |
| Share sheet failed | Show standard system error or toast |
| Recommendation load failed | Fallback to default distances |

## 15. Analytics Event Definitions

Core events:

- `crew_goal_entry_impression`
- `crew_goal_entry_click`
- `crew_goal_create_start`
- `crew_goal_friend_select_complete`
- `crew_goal_recommendation_selected`
- `crew_goal_invite_sent`
- `crew_goal_invite_opened`
- `crew_goal_invite_accepted`
- `crew_goal_invite_ignored`
- `crew_goal_invite_blocked_active_goal`
- `crew_goal_detail_view`
- `crew_goal_postrun_card_view`
- `crew_goal_postrun_card_click`
- `crew_goal_contribution_counted`
- `crew_goal_contribution_ineligible`
- `crew_goal_completed`
- `crew_goal_expired`
- `crew_goal_share_progress`
- `crew_goal_share_result`
- `crew_goal_restart`

Derived metrics:

- Goal 创建率
- 邀请接受率
- 因 active goal 冲突无法加入比例
- invite accept latency
- late join contribution rate
- 加入后 7 日内贡献率
- Goal 完成率
- Expired 后重启率
- Completed 后再次发起率

Common event properties:

- user_id hashed
- goal_id hashed
- source: home / goals_hub / postrun / notification
- goal_status
- target_distance
- crew_size
- joined_member_count
- pending_invite_count

Recommendation properties:

- selected_tier: easy / recommended / stretch
- recommended_distance
- data_source: recent_training / default

Invite properties:

- invite_age_hours
- blocked_reason nullable

Contribution properties:

- activity_type
- activity_distance
- contribution_distance
- activity_source
- sync_latency_seconds
- ineligible_reason nullable: activity_type / source / before_join / outside_window / duplicate / goal_locked

## 16. User Journey

| Stage | User Goal | Product Behavior | Risk | Design Focus | Metric |
|---|---|---|---|---|---|
| Discovery | Understand feature exists | Home / post-run entry introduces weekly asynchronous goal | Misread as Team Up | Emphasize no need to run together | Entry CTR |
| Understanding | Know how it works | Create Goal explains invite, run separately, auto add | Too much explanation | Three clear steps | Create start rate |
| Team selection | Pick familiar friends | Show recent teammates and active friends | No friends available | Reduce choice burden | Friend select complete |
| Commitment | Choose target | Show Easy / Recommended / Stretch | Miss immediate start rule | Highlight starts immediately | Invite sent |
| Invite decision | Decide join or ignore | Join page explains future-only contributions | Late join confusion | Clear eligibility copy | Accept rate |
| Active cycle | Track shared progress | Detail shows team progress first | Empty early state feels cold | Active empty state | Detail views |
| Post-run contribution | Feel own run moved team | Contribution card shows before and after | Sync anxiety | Updating / counted clarity | Post-run card CTR |
| Completed | Feel shared achievement | Result page locks success | Result feels flat | Team completion moment | Completion / share |
| Expired | Avoid failure feeling | Ended result with restart CTA | User feels punished | Non-punitive copy | Restart rate |
| Repeat | Start next cycle | Preselect available previous members | Recreate friction | Recalculate recommendation | Restart rate |

## 17. Acceptance Criteria

- 用户可从 Home 进入 Crew Goals。
- 用户可创建 7 天 Distance Goal。
- Goal 创建后，joined members 可暂时只有 creator，但 intended participants 必须至少包含 creator + 1 pending invitee。
- 用户可邀请 1-3 位好友。
- Invite 失效规则统一为：Goal full / Goal completed / Goal expired / Invite ignored。
- Preview 页明确 Goal 发送后立即开始。
- 被邀请者可加入或忽略。
- Join 页明确只有加入后的未来活动计入。
- 已有 active goal 的用户不能加入新 invite，并能查看当前 goal。
- Active Goal 不支持取消、退出、编辑目标、编辑成员、追加邀请。
- Goal Detail 正确展示团队总进度、剩余时间、我的贡献、成员贡献、pending invites。
- recent activity 是轻量进度事件，不是社交 feed。
- Run / Trail Run 在同步成功后自动计入，且同一活动不重复计入。
- 非 eligible activity 不计入，并有清晰解释。
- 运动后展示正确的 Contribution Card。
- 达成目标后自动进入 Completed，并使用 completedAt 计算完成用时。
- 7 天未达成后进入 Expired，并使用 expiredAt / endTime 锁定最终结果。
- Share Progress 必须分享当前 active goal，不得误用历史 selected result。
- Share Progress / Share Result 不展示个人敏感运动数据。
- Duplicate activity 在后台静默忽略；若用户正在查看该活动的 post-run card，则显示 Already counted。
- Goals Hub 中 demo-only historical example 不属于 Phase 1 production scope。
- Goal 已满、已结束、同步中、无好友、无贡献、duplicate activity 等边界状态均有清晰页面反馈。

## 18. Open Questions / MVP Constraints

- Phase 1 不支持独立 invite TTL；invite 随 Goal endTime 或 Goal lock 失效。
- Phase 1 不提供手动贡献修正入口。
- Phase 1 production 不提供完整 historical goal list；prototype 中的 ended goal 仅用于验证 Expired 体验。
- 单用户仅 1 个 active goal 是 MVP 约束，需要观察 active goal conflict 对 invite acceptance 的影响。
