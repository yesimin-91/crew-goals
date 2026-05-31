# 前端开发方案

## 前端目标

- 用清晰的页面流承接 Crew Goals 的主链路。
- 把“异步团队目标、自动累计、先加入后计入、完成后再发起”这几条规则讲清楚。
- 以移动端体验为中心，控制信息密度，避免做成泛化 dashboard。

## 路由与页面

### Home

- 负责告诉用户 Crew Goals 是什么。
- 根据是否存在 active goal 决定入口形态。
- 无 active goal 时引导进入 Goals Hub 或 Create Goal。
- 有 active goal 时直接导向 Goal Detail。

### Goals Hub

- 负责展示当前 active goal 摘要。
- 无 active goal 时展示空态和创建引导。
- 不承担完整历史列表职责。

### Create Goal

- 负责展示固定 7 天 Distance Goal。
- 负责说明 invite friends、run separately、distance adds automatically 的玩法。
- 负责承接好友选择和推荐距离预览。

### Choose Friends

- 最少选择一位，最多选择三位。
- 支持搜索。
- 优先显示 recent teammates 和 active friends。
- 没有可邀请好友时必须提供可返回的空态。

### Recommendation Preview

- 负责展示 Easy、Recommended、Stretch 三档。
- 默认选中 Recommended。
- 负责解释推荐值来源。
- 必须清楚说明 goal starts immediately、future runs only after join、eligible runs sync 后自动累计。

### Join Goal

- 负责展示邀请人、目标距离、周期、当前成员数。
- 负责让用户知道只有加入之后的未来活动才会计入。
- 如果用户已有 active goal，必须提供 View Current Goal 入口。

### Invite Unavailable

- 负责展示 full、completed、expired、ignored 等失效状态。
- 不能只靠 toast 解释失效原因。
- 需要明确给出 Back to Home 和 View Goals 一类回退入口。

### Goal Detail

- 首屏优先展示团队总进度。
- 其次展示我的贡献、成员贡献、pending invites 和 recent activity。
- recent activity 只保留轻量贡献事件，不做社交 feed。

### Post-run Contribution Card

- 负责在运动后解释本次活动是否计入。
- 需要展示 updating、counted、already counted、not counted、goal_locked 等状态。
- 不展示路线、配速、心率、cadence、 calories 等敏感运动数据。

### Result Pages

- Completed 和 Expired 都要有独立结果页。
- 结果页要突出团队成就，而不是失败或惩罚。
- 结果页要为 Start Another Goal 提供清晰入口。

## 页面状态设计

### 必须显式表达的状态

- loading
- error
- empty
- active
- blocked
- unavailable
- updating
- counted
- already counted
- not counted
- completed
- expired

### 不建议依赖的表达方式

- 单纯 toast 代替页面状态
- 用多个互相重叠的布尔值描述同一个业务状态
- 在页面层重复实现服务端规则判断

## 页面编排策略

### Pages 层

- 做路由参数读取。
- 做数据拉取和重试。
- 做页面级状态切换。
- 做不同 state 的分支选择。

### Features 层

- 做业务字段到展示字段的映射。
- 做文案归一和格式化。
- 做列表、卡片、状态标签的 view model。

### Components 层

- 做纯展示组件。
- 尽量不直接知道 API shape。
- 适合复用的通用结构放这里。

### Services 层

- 做 API 调用。
- 做 response 解包和契约适配。
- 做 mock 与真实 API 的切换。

## 当前阶段需要补齐的页面工作

### Create 流程

- 新增 `/goals/create` 路由。
- 新增好友选择页面或步骤。
- 新增推荐预览页面或步骤。
- 新增发送邀请后的成功跳转。

### Invite 流程

- 把 Invite Detail 中的 disabled CTA 改为真实动作。
- 支持 accept 与 ignore。
- 对 active goal conflict、full、expired、completed 统一使用 unavailable 或 blocked 视图。

### Contribution 流程

- 新增 post-run 页面。
- 在活动同步状态不确定时展示 updating。
- 在重复活动时展示 Already counted。

### Result 流程

- 新增 completed 结果页。
- 新增 expired 结果页。
- 在结果页上放置 Share Result 和 Start Another Goal。

## 文案原则

- 优先强调 async、future runs only、no need to run together。
- 避免把 Expired 说成失败。
- 避免把 invite unavailable 说成系统错误。
- 避免把 recent activity 做成社交 feed。
- 避免让用户误以为创建后要等所有人都加入才会开始。

## 交互原则

- Home 和 Goals Hub 只保留最短路径，不堆复杂说明。
- Create 页面要清晰，但不要把规则写成长篇说明文。
- Join Goal 页面需要清楚、克制、低风险。
- Goal Detail 要强调进度和贡献感，而不是排名。
- Result 页要让用户自然看到下一轮入口。

## API 对接建议

### 目标接口

- `POST /api/recommendations/goal-distance`
- `POST /api/goals`
- `GET /api/goals/active`
- `GET /api/goals/:goalId`
- `GET /api/goals/:goalId/result`

### 邀请接口

- `GET /api/invites`
- `GET /api/invites/:inviteId`
- `POST /api/invites/:inviteId/accept`
- `POST /api/invites/:inviteId/ignore`

### 贡献接口

- `POST /api/contributions/sync`
- `GET /api/post-run/:activityId`

### 运营接口

- `POST /api/analytics/events`
- `POST /api/notifications/preview`

## 推荐的数据转换方式

- 不让组件直接消费原始 API payload。
- 在 feature 层把 DTO 转成页面视图模型。
- 保持格式化、文案和状态标签的集中管理。
- 如果后端字段名变化，只改 mapper，不让页面到处跟着改。

## 实施顺序

### 创建与推荐

- 先打通创建页、好友选择页和推荐预览页。
- 再接创建接口和成功跳转。

### 邀请动作

- 再接 join、accept、ignore。
- 然后补 unavailable 和 blocked 的页面回退逻辑。

### 贡献与结果

- 再接 post-run 页面。
- 然后补 completed 和 expired 结果页。
- 最后补 restart prefill。

### 稳定化

- 再补空态、错误态、loading 和 retry 细化。
- 再补埋点和通知预览。

## 测试与审查

### 单元测试

- formatter
- mapper
- view model 分支函数

### 组件测试

- 进度卡
- 成员列表
- 邀请状态卡
- post-run 状态卡

### 集成测试

- create goal flow
- join invite flow
- contribution sync flow
- completed / expired flow

### 审查重点

- 页面是否还在直接写业务规则。
- 页面是否清楚区分 loading、empty、error、blocked 和 unavailable。
- 页面是否正确表达了 future runs only。
- 页面是否为 restart 提供了低阻力入口。
