# Crew Goals 架构方案

## 目标架构

Crew Goals 的正式实现建议继续沿用当前 monorepo，但从“演示工程”升级到“可持续迭代工程”。核心目标不是追求复杂架构，而是建立足够清晰的边界，让产品规则只实现一次，让页面扩展和接口扩展都不会互相拖累。

## 工程结构

```text
apps/
  web/                 # React 前端
  api/                 # Fastify 后端
packages/
  shared/              # 前后端共享类型与常量
  db/                  # SQLite 初始化与 Drizzle schema
docs/
  development-plan/    # 开发方案文档
skills/
  crew-goals-frontend/
  crew-goals-backend/
```

## 模块边界

### 前端

- 负责页面编排、用户输入、状态展示、交互反馈
- 负责把服务端结果转换为适合移动端表达的页面状态
- 不负责定义业务真相，不重复拥有 eligibility、status transition、goal lock 等规则

### 后端

- 负责 Goal、Invite、Contribution 的领域规则
- 负责生命周期推进、时间计算、活动计数、重复去重、冲突判断
- 负责向前端返回稳定的 screen-oriented 数据结构

### 数据层

- 负责持久化 Goal、GoalMember、GoalInvite、GoalContribution
- 通过唯一约束和事务保证关键写操作的幂等与一致性
- 保留足够源事实，支持后续审计、重算和扩展

## 关键设计原则

### PRD 优先

- `docs/PRD_v2.md` 是产品规则的源头
- 当前 demo 可以作为界面与流程参考，但不能作为正式规则实现依据
- 当 demo 与 PRD 冲突时，以 PRD 为准

### 服务端权威

- Goal 的 `startTime`、`endTime`、`completedAt`、`expiredAt` 由服务端生成
- Invite 的可用性由服务端判断
- Contribution 是否 eligible、是否 duplicate、是否 late join 冲突由服务端判断
- 前端不做“二次裁决”，只做表达和提示

### 单一事实来源

- GoalContribution 是活动计入的事实表
- GoalMember 是成员加入状态与加入时间的事实表
- GoalInvite 是邀请状态变化的事实表
- 页面上展示的 team total、my contribution、recent activity 都优先从事实表推导

### 移动端优先

- 交付目标是移动端产品流，不主动扩展桌面交互模式
- 桌面环境只作为开发预览环境，不反向决定信息密度和布局结构

## 运行时流程

### 创建目标

- 前端选择好友并提交推荐档位
- 后端校验用户当前是否已有 active goal
- 后端生成 Goal、Creator Member、Pending Invites
- Goal 立即进入 Active
- 前端跳转到 Goal Detail

### 接受邀请

- 前端进入 Join Goal
- 后端校验 invite 是否仍然可用
- 后端校验用户是否已有 active goal
- 后端创建或更新 GoalMember，并更新 Invite 状态
- 前端进入 Goal Detail 或 unavailable state

### 活动计入

- 活动同步事件进入后端 contribution endpoint
- 后端执行 eligibility 判断
- 后端写入 GoalContribution 或返回 Ignored / Not counted
- 若累计总距离达到 target，后端锁定 Goal 为 Completed
- 若活动到来时 Goal 已锁定，则返回 `goal_locked`

### 到期锁定

- 后端在读取 Goal 时检查是否已过 `endTime`
- 或由定时任务批量扫描 Active Goals
- 将已超时且未完成的 Goal 锁定为 Expired

## 共享层设计

`packages/shared` 不应成为“杂物间”。建议只放这些稳定内容：

- 前后端共享类型
- 状态枚举和值对象
- 可复用的 DTO 类型
- 可共享且不依赖运行时的常量

不要把以下内容放到 shared：

- 前端视图专用状态
- 后端数据库访问逻辑
- 容易频繁变化的页面 copy

## API 风格

推荐使用以业务动作为中心的 REST 风格接口，避免为了“通用”而设计成难以理解的单一 mutation endpoint。

建议接口按功能分组：

- Goal 创建与读取
- Invite 接受与忽略
- Contribution 计入与查询
- Result 与 restart 预填

## 风险点

### 规则重复

- 风险在于前端为了方便，会把 eligibility 或 invite validity 写成页面判断
- 处理方式是让页面只消费后端返回的 machine-readable outcome

### 状态蔓延

- 风险在于 demo 式单文件状态很容易把 route、mock data、计算逻辑、页面渲染混在一起
- 处理方式是前端按 page / feature 拆分，后端按 route / service / repository 拆分

### SQLite 误用

- 风险不在性能，而在把多步写操作做成无事务
- 处理方式是所有核心业务事件都包在清晰事务里

## 架构演进方向

### MVP 阶段

- 单体 Fastify 服务
- 单 SQLite 数据库
- 局部 mock + 局部真实接口并存

### 稳定化阶段

- 引入更完整的 route schema 和 DTO 校验
- 引入后台扫描任务处理 Expired 与提醒逻辑
- 补充埋点、日志和测试覆盖

### 扩展阶段

- 若活动同步量或用户规模增大，可将 SQLite 迁移到 Postgres
- 若通知和同步逻辑变重，可拆分异步 worker
- 若产品线扩展，可在保持领域边界的前提下扩展目标类型
