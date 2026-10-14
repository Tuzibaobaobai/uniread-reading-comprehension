# ADR-0005 · 数据模型对齐 QTI 3.0，答案与题目分离

- 状态：已采纳（2026-10-14）
- 决策：interaction 类型按 QTI 3.0 命名；正文结构化（Perseus 式 blank 节点）；答案键存 `keys/` 独立文件；zod schema 为唯一事实来源并导出 JSON Schema。
- 原因：便于与 UniRead 及其他题库互通；生产环境答案不下发前端；文章与题目解耦以支持左右联动。
- 结果：校验脚本负责 schema 之外的交叉引用规则（blank 归属、题号连续、证据存在等）。
