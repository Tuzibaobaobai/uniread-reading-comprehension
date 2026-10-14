# ADR-0001 · 独立 React + Vite 静态站

- 状态：已采纳（2026-10-13）
- 背景：最终要进入 UniRead，但目前没有 UniRead 代码库访问；需要尽快验证交互。
- 决策：React 18 + Vite + TypeScript 静态站，内容为 `content/` 下的 JSON 与图片，无后端。
- 结果：可直接部署到任意静态托管；通过 `ContentProvider`/`AttemptStore` 接口（docs/06）为接入 UniRead 留口。
