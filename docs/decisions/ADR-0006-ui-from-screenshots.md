# ADR-0006 · UI 依据 UniRead 截图，Figma 恢复后精修

- 状态：Superseded by [ADR-0007](ADR-0007-figma-design-system.md)（2026-10-15）；原采纳 2026-10-14
- 背景：UniRead Figma 暂时无法访问；用户在 `screenshots/` 提供了 5 张 UniRead 页面截图。
- 决策：按截图实现布局与组件风格（一题一页、底部题号分页）；所有视觉值集中在 `src/styles/tokens.css`。
- 结果：Figma 恢复后只替换 token 值与少量组件细节。
