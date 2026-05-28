# Crew Goals 开发方案总览

## 目标

这组文档用于把 [PRD_v2.md](/Users/xiesimin/Desktop/crew-goals/docs/PRD_v2.md) 转化为可执行的开发方案，服务于 Phase 1 / MVP 的前后端实现、接口定义、数据建模和迭代落地。

文档重点关注这些问题：

- 如何把 PRD 中的页面和规则映射到当前 monorepo 工程
- 如何划分前端与后端职责，避免规则重复实现
- 如何在 SQLite + Fastify + React 的技术栈下保证 MVP 可交付
- 如何安排开发顺序，让后续多轮迭代的变更成本可控

## 当前技术基线

- 前端使用 React + TypeScript + Vite
- 后端使用 Fastify + TypeScript
- 数据库使用 SQLite
- 数据层使用 Drizzle schema + 本地 bootstrap SQL
- 仓库采用 monorepo 结构，包含 `apps/web`、`apps/api`、`packages/shared`、`packages/db`

## 方案结论

### 产品实现策略

- 以 `Crew Goals` 的核心闭环为优先：创建目标、邀请、加入、自动累计贡献、查看结果、重新发起
- 以 PRD 规则为准，不把 demo 中的便捷写法直接带入正式实现
- 以“服务端负责规则、前端负责表达”为原则组织代码

### 架构策略

- 前端按页面和 feature 拆分，避免继续沿用 demo 式单文件状态组织
- 后端按领域动作拆分服务，围绕 `goal`、`invite`、`contribution` 建立清晰模块边界
- 数据库围绕源事实建模，优先保证可追溯和幂等，而不是过早做聚合缓存

### 迭代策略

- 先打通产品主链路，再补错误态、边界态、通知、分析埋点
- 先做服务端规则闭环，再做前端细节打磨
- 先保证移动端 MVP 完整，再考虑额外平台或复杂运营能力

## 文档索引

### 架构与边界

- [architecture.md](/Users/xiesimin/Desktop/crew-goals/docs/development-plan/architecture.md)

### 前端方案

- [frontend-plan.md](/Users/xiesimin/Desktop/crew-goals/docs/development-plan/frontend-plan.md)

### 后端与数据方案

- [backend-data-plan.md](/Users/xiesimin/Desktop/crew-goals/docs/development-plan/backend-data-plan.md)

### 交付与迭代计划

- [delivery-plan.md](/Users/xiesimin/Desktop/crew-goals/docs/development-plan/delivery-plan.md)

## 适用范围

这份方案覆盖 PRD 中已经明确的 Phase 1 范围：

- 固定 7 天 Distance Goal
- 2-4 人团队
- 邀请与加入
- 自动计入符合条件的跑步活动
- Goal Detail、Post-run Card、Completed、Expired 等关键页面

这份方案不覆盖这些扩展方向：

- 实时协作与社交互动
- 完整历史系统
- 多目标类型
- 自定义目标输入
- 排行榜与激励体系

## 维护方式

- 当 PRD 改动主要影响页面表达时，优先更新 `frontend-plan.md`
- 当 PRD 改动主要影响规则、状态机、接口或数据模型时，优先更新 `backend-data-plan.md`
- 当技术选型、模块边界或工程结构发生变化时，优先更新 `architecture.md`
- 当迭代顺序、测试策略或上线范围变化时，优先更新 `delivery-plan.md`
