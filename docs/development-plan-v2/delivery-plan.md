# 交付与迭代方案

## 交付目标

- 把 Crew Goals 的第二阶段做成可以稳定演示、稳定联调、稳定审查的工程闭环。
- 优先完成主链路，再补边界态、运营能力和测试覆盖。
- 让每一轮迭代都能明确回答当前还缺什么、为什么缺、怎么验收。

## 迭代原则

### 先主链路，后补强

- 先打通 create、invite、join、contribute、result、restart。
- 再补 loading、error、empty、blocked、unavailable、duplicate 和 expired。
- 再补埋点、通知和分享。

### 先规则稳定，后视觉打磨

- 规则正确比视觉更重要。
- 如果规则还不确定，不要把页面做成过度复杂的交互。
- 如果一个状态会影响用户决策，就必须显式展示，而不是隐藏在 toast 里。

### 先服务端，后前端

- 规则先落后端，再在前端表达。
- 如果后端已有明确状态，前端只负责把它展示出来。
- 不要让页面自己重新判断可加入性、可计入性或结果锁定。

## 阶段划分

### 基础工程

- 明确 shared contracts。
- 明确 API response shape。
- 清理 demo-only 的状态组织方式。
- 固定前后端目录边界。
- 让页面和服务都回到可读、可审查的结构。

### 创建与邀请

- 完成 Create Goal、Choose Friends、Recommendation Preview。
- 完成 Invite Detail 的 accept 和 ignore 动作。
- 完成 unavailable invite state。
- 确保 active goal conflict 能被前端正确引导到当前目标。

### 贡献与结果

- 完成 post-run contribution card。
- 完成 contribution sync 的 counted、already counted、not counted 和 goal_locked。
- 完成 completed result。
- 完成 expired result。
- 完成 restart prefill。

### 运营与稳定化

- 完成关键 analytics event wiring。
- 完成 notification preview。
- 完成边界态和错误态细化。
- 完成测试、文案和状态修正。

## 建议开发顺序

### 起步

- 梳理现有页面、服务和 API 缺口。
- 确认第二阶段要保留的接口和页面路径。
- 把所有主链路依赖先列出来。

### 创建链路

- 先做 create goal flow。
- 再接 recommendation。
- 再接 create mutation。
- 完成后确保能从 Home 或 Goals Hub 正常进入 Goal Detail。

### 邀请链路

- 再做 Join Goal 页。
- 再接 accept 和 ignore。
- 再处理 blocked / unavailable 路径。

### 贡献链路

- 再做 post-run card。
- 再接 contribution sync。
- 再处理 duplicate 和 ineligible。

### 结果链路

- 再做 completed 和 expired 页面。
- 再做 result payload。
- 再做 restart prefill。

### 运营补强

- 再补 analytics。
- 再补 notification preview。
- 再做稳定化测试。

## 交付标准

### 页面级完成标准

- 页面符合 PRD 语义。
- 页面移动端可用。
- 页面状态完整。
- 页面没有明显规则误导。
- 页面能够在真实数据和 mock 数据下稳定工作。

### 接口级完成标准

- 接口契约清晰。
- 错误码和状态原因可机器识别。
- 关键写操作具备事务保护。
- 重复请求不会造成错误累计。

### 产品级完成标准

- 用户可以创建目标。
- 用户可以接受或忽略邀请。
- 用户可以看到自动累计的贡献结果。
- 用户可以看到完成和到期后的结果页。
- 用户可以开始下一轮目标。

## 风险管理

### 规则偏移

- 风险是前端为了赶进度自己补判断逻辑。
- 处理方式是把规则统一下沉到服务端，并让页面只展示结果。

### 状态丢失

- 风险是 demo 式页面只覆盖 happy path。
- 处理方式是每个页面都要明确 loading、empty、error、blocked、unavailable、locked 的分支。

### 数据不一致

- 风险是 create、accept、sync、expire 四类写操作没有事务边界。
- 处理方式是把这四类动作作为第一优先级测试对象。

### 结果页缺失

- 风险是完成后用户没有下一步入口。
- 处理方式是把 result 和 restart 放在同一交付节奏里完成。

## 测试策略

### 前端

- 页面状态测试。
- 关键组件测试。
- 主要流程集成测试。

### 后端

- 领域规则测试。
- 接口测试。
- 数据一致性测试。

### 联调

- create goal 联调。
- join invite 联调。
- contribution counted、duplicate、ineligible 联调。
- completed、expired 联调。

## 审查门槛

### 产品审查

- 是否完整覆盖 MVP 闭环。
- 是否存在明显规则误导。
- 是否还保留了不该出现在 MVP 里的扩展能力。

### 工程审查

- 模块边界是否清楚。
- 规则是否重复实现。
- 事务与幂等是否到位。

### 演示审查

- 是否能够稳定演示 create、join、contribute、result 和 restart。
- 是否能够稳定演示 duplicate、ended、full、no contributions 等边界状态。

## 上线前最低要求

- 主链路接口齐全。
- 主链路页面齐全。
- 关键状态有明确文案。
- 错误态不会误导用户。
- 重复同步不会重复计入。
- 结果锁定后不会被后续活动改写。
- 收敛后的文档和代码保持一致。
