# Crew Goals 前端开发方案

## 前端目标

前端需要把 PRD 中的核心体验落成一套清晰、可信、移动端优先的页面流。重点不是做信息很多的 dashboard，而是突出“异步协作、自动累计、目标推进、贡献反馈”这条产品主线。

## 页面范围

### Home Entry

- 负责教育用户理解 Crew Goals
- 负责区分 `weekly goal` 与 `Team Up`
- 负责根据是否存在 active goal 决定入口形态

### Goals Hub

- 负责展示当前 active goal 摘要
- 负责在无 active goal 时给出 Start a Goal 引导
- 允许出现 prototype-only ended example，但生产逻辑不依赖历史列表

### Create Goal Flow

- `Create Goal`
- `Choose Friends`
- `Goal Recommendation + Preview`

这段流程是 MVP 的核心转化路径，需要优先保证：

- 说明简洁
- 规则清晰
- CTA 明确
- 选择路径短

### Invite Flow

- `Join Goal`
- unavailable state

这段流程必须把以下信息说清楚：

- 这是异步团队目标
- 加入后才开始累计未来跑步
- 如果用户已有 active goal，则不能加入

### Active Goal Flow

- `Goal Detail`
- `Post-run Contribution Card`

这段流程是留存主场景，视觉优先级建议为：

- 团队总进度
- 当前状态文案
- 我的贡献
- 成员贡献
- recent activity

### Result Flow

- `Goal Completed`
- `Goal Expired`

这段流程重点不在信息量，而在“完成感”与“继续发起下一轮”的动力。

## 路由建议

建议在 `apps/web/src/pages` 下按页面建立路由模块，路径可以保持简洁：

- `/`
- `/goals`
- `/goals/create`
- `/goals/friends`
- `/goals/preview`
- `/goals/:goalId`
- `/invites/:inviteId`
- `/results/:goalId/completed`
- `/results/:goalId/expired`
- `/post-run/:activityId`

如果未来嵌入 Suunto App 容器，这些路径仍然可以保留为 Web 端的逻辑路由。

## 目录建议

```text
apps/web/src/
  app/
  pages/
  features/
    goal/
    invite/
    contribution/
    recommendation/
  components/
  services/
  lib/
  mocks/
  styles/
```

## 页面与 feature 的分工

### pages

- 负责路由参数
- 负责页面级数据获取
- 负责页面级状态切换
- 负责组合 features

### features

- 负责业务相关的 UI 片段与 hooks
- 负责 view model 组织
- 负责把原始 API 数据转成组件可直接消费的结构

### components

- 负责纯展示层
- 不直接请求接口
- 不理解完整业务流程，只理解传入的 props

## 状态管理策略

### 本地状态

适合这些内容：

- 输入框
- 好友选择
- 当前 tab
- modal / sheet 开关
- 短暂的 loading / retry UI

### 服务端状态

适合这些内容：

- active goal
- invite availability
- recommendation payload
- recent activity
- result payload

建议尽快引入稳定的服务端状态层，例如 TanStack Query，用来统一处理：

- loading
- error
- refetch
- cache
- mutation feedback

## 页面状态表达

前端需要显式建模这些状态，而不是只做 happy path：

- loading
- error
- empty
- active
- completed
- expired
- unavailable
- updating
- duplicate-counted

建议使用联合类型或状态对象，不使用大量互相重叠的布尔值。

## UI 与交互原则

### 移动端优先

- 页面以手机宽度为默认场景
- 组件间距、标题层级、按钮尺寸都按移动端交互设计
- 桌面只保留简单居中预览，不做独立桌面布局

### 进度优先

- Goal Detail 首屏必须先看到 team progress
- `my contribution` 是辅助信息，不应压过团队目标
- recent activity 是轻量反馈，不应该演变成社交 feed

### 规则优先

用户在页面中最容易误解的规则，需要在关键节点明确表达：

- starts immediately
- no need to run together
- future runs only after join
- only eligible Run / Trail Run count
- completed / expired is locked

### 错误态优先

PRD 已经定义了大量边界情况，前端不应把这些都退化成 toast。尤其这些情况建议有完整页面或强状态卡片：

- invite full
- invite ended
- active goal conflict
- sync delayed
- duplicate activity
- no inviteable friends
- no contributions yet

## API 对接策略

### 服务模块

建议在 `services/` 中为每类资源建立清晰 client：

- `goalService`
- `inviteService`
- `contributionService`
- `recommendationService`

### 数据转换

前端不要直接把后端 payload 原样传进组件。建议在 feature 层建立 view model mapper，例如：

- `mapGoalSummaryToHeroCard`
- `mapInviteStateToJoinView`
- `mapContributionResultToPostRunCard`

这样做的价值在于：

- 页面组件更轻
- copy 与视觉表达更稳定
- 后续后端字段变化时，影响集中

## 前端开发顺序

### 第一阶段

- App shell
- Home Entry
- Goals Hub
- Goal Detail 静态结构

### 第二阶段

- Create Goal flow
- Join Goal flow
- recommendation 数据接入

### 第三阶段

- Post-run Contribution Card
- Completed
- Expired
- restart flow

### 第四阶段

- 空态与错误态补齐
- loading / retry 细化
- 埋点接入

## 前端测试建议

### 单元测试

- formatter
- selector
- mapper
- 页面状态分支函数

### 组件测试

- Goal hero card
- member contribution list
- invite availability card
- post-run result card

### 集成测试

- create goal flow
- accept invite flow
- contribution update flow
- completed / expired route flow

## 交付标准

一页前端功能可以认为完成，需要同时满足：

- 页面符合 PRD 语义
- 移动端布局可用
- loading / empty / error 状态明确
- 接口契约清晰
- 无明显规则冲突
