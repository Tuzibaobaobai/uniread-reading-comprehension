# ADR-0007 · 视觉以 Figma 设计系统为准

- 状态：已采纳（2026-10-15），取代 [ADR-0006](ADR-0006-ui-from-screenshots.md)
- 背景：Figma 连接器已可用，用户按组件提供 UniRead 设计系统链接。截图取值不再需要。
- 决策：
  - 视觉的唯一来源是 Figma 文件 UniRead，组件登记在 [docs/design/figma-registry.md](../design/figma-registry.md)
  - 文档只描述结构与行为，不写具体视觉值，视觉一律引用登记表中的组件
  - 代码只使用 `src/styles/tokens.css` 中的 token，token 按登记表中的映射规则从 Figma 变量命名
  - 例外（产品决定）：主色使用 UniRead 主色，Figma 的 `color/6` 占位紫映射到 `--accent`；界面文字使用中文
- 影响：docs/02 §3、docs/05 改写为行为描述；`tokens.css` 按 Figma 变量重建；组件中不得出现颜色字面量。
