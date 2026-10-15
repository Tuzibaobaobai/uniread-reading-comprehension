# ADR-0008 · 主观题用 LLM as a Judge 评分

- 状态：已采纳（2026-10-15）
- 背景：回答问题、观点题原先只给参考答案，由学生自评，不计分。UniRead 平台提供大模型 API。
- 决策：
  - `extendedText` 默认 `scoring: "judge"`：服务端用官方参考答案、得分要点 `keyPoints` 和可选样例 `anchors`，加上学生作答，交给 LLM 判分（结构化输出，temperature 0），结果写入 `byQuestion[].judgement`。
  - 对应 QTI 的 `externalScored = externalMachine`：本地判分只标 `pending`，由外部回填。
  - 判分逻辑与模型无关，放在 `src/lib/judge.ts`（纯函数）。代码兜底：校验输出、分数与要点一致性、空白或中文作答 0 分、低置信度转人工。
  - 不可用时退回学生自评（不计分）。分数用于练习和形成性反馈；`needsReview` 的题须经教师确认。
- 影响：schema 新增 `JudgeKeyPoint`、`JudgeAnchor`、`Judgement` 和 `scoredBy`；新增 `/api/rc/judge` 契约（docs/06）；内容生产要为回答问题写 `keyPoints`（docs/04）。详见 [docs/09](../09-subjective-scoring.md)。
