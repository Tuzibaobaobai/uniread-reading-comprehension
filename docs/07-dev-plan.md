# 07 · 开发执行计划（先验证，再全量）

## Phase 0 · 文档与骨架
- [x] git init、Vite + React + TS 工程
- [x] `schema/index.ts`（zod）+ JSON Schema 导出
- [x] `scripts/render.swift`（PDF → 页面图）、`scripts/crop.swift`（裁图）、`scripts/validate.ts`（校验）
- [x] docs/00–07、ADR
- [x] 范例 item `ci-g3-w01-mon`

## Phase 1 · 试点内容（14 篇，覆盖全部题型与版式）
| item | 题型 / 覆盖点 |
|---|---|
| ci-g3-w01-mon | 单选（范例） |
| ci-g3-w01-tue | 单选 + 图片 |
| ci-g3-w01-wed | 完形 6 空 |
| ci-g3-w01-thu | 选词填空 A–H |
| ci-g3-w01-fri | 每周精读：句中选词（一题两空）+ 单选 |
| ci-g3-w02-thu | 六选四（句库） |
| ci-g3-w03-thu | 连线 |
| ci-g3-w04-thu | 判断正误 |
| ci-xsc-w05-thu | 短文填空（词形变换） |
| ci-xsc-w06-mon | 广告材料 + 4 选项单选 |
| ci-xsc-w06-thu | 七选五 |
| ci-xsc-w10-thu | 补全对话 |
| ci-xsc-w12-thu | 表格填空（首字母） |
| ci-xsc-w17-fri | 判断 + 连线 |

流程：转录 agent（4 路并行）→ validate → 独立复核 agent → 修正。
- [x] 14 篇（含范例）转录完成，validate 0 error
- [ ] 独立复核（进行中）
**验收闸口 1**：产品负责人审阅试点数据与答案 → 冻结 schema v1.0。

## Phase 2 · App 功能（用试点数据）
- [x] 三个页面 + 6 种 interaction 组件（order 预留）+ 判分 + 提交/复盘 + 本地保存
- [x] Vitest：`grading.test.ts`（8 项通过）
- [x] Playwright：桌面 1440×900、iPad 横屏 1180×820、竖屏 820×1180（使用本机 Chrome，18 项通过）
- [x] 字体自托管（不依赖 Google Fonts）
**验收闸口 2**：PC 与 iPad 试用。

## Phase 3 · 全量内容（150 篇）
- 按周分批（每批 5 篇），多 agent 并行转录 → validate → 独立复核
- 每批产出问题清单（原书错误、【待复核】答案）
- 每本随机 10 篇人工抽查
**验收闸口 3**：全部 `npm run validate` 0 error；抽查通过。

## Phase 4 · UI 精修
- Figma 恢复后用精确 token 与组件规格替换 `tokens.css`；不动数据与逻辑

## Phase 5 · 集成准备
- 输出 JSON Schema、接口契约（docs/06），keys 与前端分离部署

## 验证命令
```bash
npm run validate     # 内容校验
npm test             # 判分单元测试
npm run build        # 类型检查 + 构建
npm run e2e          # 端到端（Playwright）
```
