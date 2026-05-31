# 架构方案

## 架构目标

- 保持现有 monorepo 结构，继续使用 React、Fastify、SQLite 和 shared packages。
- 用清晰的层次边界承接第二阶段的 MVP 闭环，不把业务规则散落到页面和组件里。
- 让后续扩展能够沿着已有边界继续增加，而不是重新拆一次工程。

## 设计原则

### 服务端权威

- Goal 是否 active、completed、expired 由服务端裁决。
- Invite 是否 joinable、blocked、unavailable 由服务端裁决。
- Contribution 是否 eligible、duplicate、goal_locked 由服务端裁决。
- 前端只展示服务端返回的状态和原因，不自己判断最终结果。

### 单一事实来源

- Goal 事实来自 goals 表。
- 成员加入事实来自 goal_members 表。
- 邀请状态事实来自 goal_invites 表。
- 活动计入事实来自 goal_contributions 表。
- 页面展示的 progress、member contribution、recent activity 都应该从事实表推导，而不是在前端拼凑。

### 结构分层

- `apps/web` 负责页面编排、用户输入、局部交互和表达层 view model。
- `apps/api` 负责领域规则、状态推进、写事务和读模型组装。
- `packages/shared` 负责 DTO、状态枚举和稳定常量。
- `packages/db` 负责 schema、迁移和本地初始化。

### 移动端优先

- 页面按移动端信息密度设计。
- 桌面只做居中预览，不独立发展一套桌面布局。
- 首页、Goals Hub、Goal Detail 和 Result 页面都应该首先服务于手机宽度下的阅读节奏。

## 工程结构

```text
apps/
  web/
  api/
packages/
  shared/
  db/
docs/
  development-plan-v2/
```

## 前端边界

### pages

- 负责路由参数读取。
- 负责页面级数据拉取和 loading / error / empty / unavailable 分支。
- 负责组合 feature 和 component。

### features

- 负责业务相关的 view model 组织。
- 负责把后端 DTO 转成页面更容易消费的结构。
- 负责统一文案映射，避免页面里到处写字符串拼接。

### components

- 负责纯展示，不直接请求接口。
- 负责通用按钮、进度条、空态、错误态和卡片。
- 不理解完整领域流程，只接受 props。

### services

- 负责和 API 通信。
- 负责 API response 到前端类型的转换。
- 负责把后端的 screen-oriented payload 落成页面需要的 view model。

## 后端边界

### routes

- 只做输入校验、参数解析和错误码映射。
- 不放复杂领域规则。
- 不在路由层重复写状态机。

### services

- 负责 create、accept、ignore、sync、expire、preview 等业务动作。
- 负责组合 repository，构建可返回给前端的响应对象。
- 负责埋点和通知预览等横切能力。

### repositories

- 负责数据库访问与读写封装。
- 负责事务边界。
- 负责把表级事实转换为领域记录。

## 数据层边界

### goals

- 保存目标的生命周期字段。
- 保存推荐档位、推荐来源、结果锁定信息。
- 作为 Goal 主事实表。

### goal_members

- 保存成员加入时间、角色和累计贡献。
- 保留 creator 默认加入这件事的事实。
- 作为成员贡献聚合的事实入口。

### goal_invites

- 保存邀请状态、接受时间、忽略时间、失效原因和到期时间。
- 支持 joinable、blocked、unavailable 的可视化判断。
- 与 goal 生命周期联动失效。

### goal_contributions

- 保存每次活动的同步结果。
- 保留 activityId 唯一约束。
- 支持 counted、ignored、duplicate、goal_locked 等状态。

### analytics_events

- 保存关键行为事件。
- 只作为可审计附属事实，不参与核心业务规则裁决。

## 数据流

### 创建目标

- 前端选择好友并选择推荐档位。
- 后端计算推荐值并创建 goal、creator member 和 pending invites。
- 后端立即把 goal 置为 active。
- 前端跳转到 Goal Detail。

### 接受邀请

- 前端打开 Join Goal 页面。
- 后端判断 invite 是否可用，是否存在 active goal 冲突。
- 如果可加入，后端创建 joined member 并更新 invite 状态。
- 如果不可加入，前端展示 unavailable 或 blocked 状态页。

### 活动同步

- 活动同步事件进入 contribution endpoint。
- 后端先判定 duplicate，再判定资格，再写入事实。
- 如果累计距离达到 target，后端锁定结果。
- 如果活动不符合条件，后端返回明确的 ignored reason。

### 到期锁定

- 读取 goal 时补做过期检查。
- 后端把到期且未完成的 goal 锁定为 expired。
- 锁定后不允许后续活动继续改变最终结果。

### 重启

- 完成或到期后，前端进入 create flow。
- 前端可以预选上一轮可邀请成员。
- 后端重新计算推荐值，不沿用旧轮次的推荐结果。

## 路由策略

- 保留简洁的 Web 逻辑路由。
- 当前阶段需要覆盖的页面入口应与产品主链路一一对应。
- 路由不存在时，应该显示明确的 not found 或 unavailable 状态，而不是静默回落到首页。

## 共享层约束

- `packages/shared` 只放稳定 DTO、枚举和可共享常量。
- 不把前端页面状态放到 shared。
- 不把数据库访问逻辑放到 shared。
- 不把频繁变动的 copy 放到 shared。

## 审查重点

- 是否存在前端重复判断 eligibility、status transition 或 invite validity 的情况。
- 是否存在后端写操作没有事务保护的情况。
- 是否存在一个事实在多个地方用不同字段名重复表达的情况。
- 是否存在路由、service、repository 混层写逻辑的情况。

## 非目标

- 不在这一阶段引入复杂事件驱动架构。
- 不把 SQLite 换成别的数据库。
- 不把读模型抽成单独的缓存系统。
- 不把通知、埋点、分享做成独立服务拆分。
