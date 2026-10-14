# ADR-0003 · 作答记录存 localStorage

- 状态：已采纳（2026-10-13）
- 决策：v1 无账号，作答记录（Attempt）存浏览器 localStorage，键 `uniread.rc.attempt.<itemId>`。
- 结果：Attempt 结构即 UniRead 上报格式；接入时替换 `AttemptStore` 实现即可。
