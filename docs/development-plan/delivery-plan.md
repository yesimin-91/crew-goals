# Crew Goals 交付与迭代方案

## 交付目标

本阶段交付目标不是把所有扩展能力一次性做完，而是把 PRD 中的 MVP 闭环做成“真实可演示、真实可迭代、真实可验证”的产品工程。

## 交付原则

### 先主链路，后补强

- 先打通 create → invite → join → contribute → result → restart
- 再补齐错误态、边界态、埋点、通知和运营能力

### 先规则稳定，后视觉打磨

- 规则正确比动画、样式、视觉细节更重要
- 如果规则未定，前端不要过度封装复杂 UI

### 先移动端闭环，后扩展平台

- 当前阶段只面向移动端产品形态
- 桌面开发环境只承担预览职责

## 迭代分层

### 基础工程层

- 路由基础设施
- 页面与 feature 目录拆分
- API service 层
- 后端 route / service / repository 基础结构
- shared types 与 db schema 整理

### 产品主链路层

- active goal 查询
- create goal flow
- recommendation flow
- invite accept / ignore flow
- goal detail
- contribution sync
- completed / expired result

### 可靠性层

- loading / error / unavailable 状态
- duplicate activity handling
- result lock
- expire handling
- retry path

### 可运营层

- analytics event wiring
- notification trigger 接口预留
- restart prefill

## 建议开发顺序

### 前期准备

- 完成目录重构
- 明确 shared types
- 明确 API response shape
- 清理 demo-only 状态组织方式

### 第一批功能

- Home Entry
- Goals Hub
- active goal detail 基础展示
- `GET /api/goals/active`
- `GET /api/goals/:goalId`

### 第二批功能

- Choose Friends
- Recommendation Preview
- `POST /api/recommendations/goal-distance`
- `POST /api/goals`

### 第三批功能

- Invite list
- Join Goal
- unavailable invite states
- `GET /api/invites`
- `GET /api/invites/:inviteId`
- `POST /api/invites/:inviteId/accept`
- `POST /api/invites/:inviteId/ignore`

### 第四批功能

- post-run contribution card
- contribution sync outcomes
- recent activity
- `POST /api/contributions/sync`
- `GET /api/post-run/:activityId`

### 第五批功能

- completed result
- expired result
- restart prefill
- result payload endpoint

### 第六批功能

- 埋点
- 通知接口预留
- 稳定化测试
- 文案与状态微调

## 风险管理

### PRD 规则细节变动

- 处理方式是把页面、接口、数据模型拆开维护
- 不把所有规则写死在一个总文档或一个大文件里

### demo 迁移成本

- 处理方式是只吸收 demo 中已经证明有价值的视觉和交互
- 不直接沿用 demo 的全局状态写法

### 边界场景不足

- 处理方式是在每个 feature 完成时同步补齐边界态
- 不把边界态留到最后统一处理

### 数据一致性遗漏

- 处理方式是对 create / accept / contribution / expire 四类动作优先补事务与测试

## 测试策略

### 前端

- 页面状态测试
- 关键组件测试
- 主要流程集成测试

### 后端

- 领域规则测试
- 接口测试
- 数据一致性测试

### 联调

- create goal 联调
- join invite 联调
- contribution counted / duplicate / ineligible 联调
- completed / expired 联调

## 验收视角

### 产品验收

- 是否完整覆盖 PRD MVP 范围
- 是否存在明显规则误导
- 是否具备完整移动端链路

### 工程验收

- 是否具备清晰模块边界
- 是否便于继续扩展
- 是否避免前后端重复实现规则

### 演示验收

- 是否可以稳定展示 create、join、contribute、result 主链路
- 是否可以稳定展示 duplicate、ended、full、no contribution 等边界状态

## 文档与代码同步要求

- 新增接口时同步更新后端方案文档
- 页面结构发生明显变化时同步更新前端方案文档
- 迭代顺序明显变化时同步更新本文件
- 关键技术决策变化时同步更新架构文档
