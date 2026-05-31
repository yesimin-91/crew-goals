# 审查指南

## 审查目的

- 帮助 reviewer 快速判断实现是否符合 PRD。
- 帮助开发者在提交前自检是否满足第二阶段要求。
- 帮助团队把 review 从“看起来差不多”转成“规则和边界都成立”。

## 审查优先级

### 第一优先

- 主链路是否闭环。
- 服务端规则是否正确。
- 结果锁定是否正确。
- invite 和 contribution 的边界状态是否正确。

### 第二优先

- 前端文案是否准确。
- 页面状态是否清晰。
- API 契约是否易于维护。
- 事务与幂等是否可靠。

### 第三优先

- 组件抽象是否优雅。
- 视觉细节是否统一。
- 是否还可以进一步重构结构。

## 必看项

### 产品一致性

- 是否与 `docs/PRD_v2.md` 的核心规则保持一致。
- 是否把“异步、未来活动才计入、无需一起跑”表达清楚。
- 是否把 Completed 与 Expired 处理成锁定结果，而不是普通失败状态。

### 规则正确性

- 创建目标时是否强制 1 到 3 位好友。
- 是否正确处理 active goal conflict。
- 是否正确处理 invite full、completed、expired、ignored。
- 是否正确处理 Run、Trail Run、trusted source、joinTime、window、duplicate。

### 时间正确性

- startTime 和 endTime 是否由服务端统一生成。
- 是否使用绝对 UTC 时间判断。
- 是否避免依赖本地时区推断业务结果。
- 是否保证到期锁定不会重复执行。

### 数据一致性

- create、accept、sync、expire 是否都在事务边界内。
- activityId 是否唯一。
- invite 状态是否和 goal 状态同步失效。
- completed / expired 后是否还能继续计入贡献。

### 前端表达

- loading、error、empty、blocked、unavailable、updating 是否都有明确表达。
- Join Goal 是否给出 View Current Goal。
- Goal Detail 是否突出总进度而不是排名。
- Result 页是否提供 Start Another Goal。

### 后端契约

- API 是否返回 machine-readable reason。
- screen-oriented payload 是否足够支持页面状态。
- 是否避免前端需要再猜测业务状态。

### 测试覆盖

- 是否覆盖 duplicate activity。
- 是否覆盖 ineligible activity。
- 是否覆盖 active goal conflict。
- 是否覆盖 invite unavailable。
- 是否覆盖 completed 和 expired 的结果锁定。

## 常见阻断问题

### 规则下沉不完整

- 页面里出现 eligibility 重新计算。
- 页面里出现 invite validity 自己判断。
- 页面里出现结果锁定的二次推断。

### 事务不完整

- 创建目标时只写 goal 没写 member 或 invite。
- 接受邀请时只改 invite 没加 member。
- 同步活动时先更新 member 再写 contribution。
- 到期时只改状态没写 resultLockedAt。

### 边界态缺失

- 无 active goal 时页面空白。
- Invite 失效时仍然给 join 按钮。
- Duplicate activity 只给普通错误。
- Expired 结果页没有 restart 入口。

### 文案误导

- 把 Expired 写成失败或惩罚。
- 把 active goal conflict 写成系统错误。
- 把 post-run 未计入写成功能故障，而不是规则说明。

## 非阻断但建议记录

- 推荐逻辑仍然使用静态训练数据源。
- 分享和通知目前先以预览和结构化 payload 为主。
- history list 继续保持非 MVP 范围。
- 页面组件还可以继续拆得更细。

## 建议审查顺序

### 先看结果

- 先确认这个提交是否真的补齐了目标页面或接口。
- 再确认它有没有破坏已有的 active goal、invite 或 contribution 逻辑。

### 再看规则

- 再看服务端是否仍然是最终裁决者。
- 再看前端是否只是把结果表达出来。

### 再看边界

- 最后看异常路径和边界态是否完整。
- 如果边界态不完整，主链路即使能跑也不能算交付完成。

## 自检清单

- 这个变更是否引入了新的业务规则重复实现。
- 这个变更是否影响了已有的状态机。
- 这个变更是否让前端更依赖后端之外的隐式知识。
- 这个变更是否让 reviewer 无法通过代码直接看出状态来源。
- 这个变更是否在测试中覆盖了关键边界。
