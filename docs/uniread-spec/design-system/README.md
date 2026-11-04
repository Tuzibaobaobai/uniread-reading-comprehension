# UniRead 规范 · 设计系统（Design System）

| 项 | 值 |
| --- | --- |
| 规范编号 | `uniread-spec/design-system` |
| 来源 | UniRead Figma 文件 `gYPHIUtQ50mXuoE0Cfpmu0`，设计系统页 [19363-120255](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=19363-120255)；导出快照 `UniRead-设计规范.html` |
| 维护方 | UniRead 设计师（设计系统 owner）。本项目只读取、提案，不改写其定义 |
| 当前采用版本 | `DS-2026-11-03`（快照日期 2026-11-03；锁定于 `design-system/lock.json`） |
| 适用范围 | 本仓库全部界面：时文阅读、KET / PET、词汇天天练及今后新增的内容类型 |

## 快照文件

`UniRead-设计规范.html`（约 42 MB，主要是组件预览图）只保存在本地，不进 git（`.gitignore`）。版本由 `design-system/lock.json` 中的 `snapshotSha256` 固定：

- `15be5dbe0a2b46e6be69cb70ab2d563c125db5c9a38d2b100c170a803985d62b`（DS-2026-11-03）

从快照提取的内容进 git，均由脚本生成，不手改：

- `design-system/tokens/uniread.tokens.json`：77 个变量、95 个填充样式、35 个文字样式、29 个效果样式、5 个栅格。
- `design-system/components.inventory.json`：431 个组件（215 个组件集、216 个独立组件）及其 variant。

## 快照中的要点（原文摘要，以快照为准）

- 本地变量只有 `Primitive` 集合，唯一模式 `CN`。没有语义层，没有间距集合。设计系统自己的治理清单把「新增 Semantic 角色集合」列为 P1。
- 组件复用：优先创建实例，通过公开属性切换状态与内容，不拆散实例来模拟变体。`State` / `state`、`Disabled` / `Dissabled` 等拼写按源组件的实际属性名使用；`Property 1`、`Variant2` 是既有命名，不赋予猜测的含义。
- 「锁定、当前步骤、答题正误与完成度是四个不同维度，不应压成一个 Selected 属性」（§8）。
- 发布与维护：修改前确认所有者与影响范围；先在代表页面验证；重命名、合并、删除要提供迁移表；覆盖常态、悬停、选中、禁用、加载、空态、错误、成功及长文本等状态；对比度目标是常规文字 4.5:1、大字和关键非文字 3:1（§11）。

本项目的落实办法（同步、映射、提案、组件化、写回 Figma、门禁、版本升级）写在 [docs/14 §15](../../14-agent-production-rules.md#15-uniread-设计系统token组件与版本uniread-specdesign-system)，不写进本文件。

## 更新记录

| 版本 | 日期 | 来源 | 变化 |
| --- | --- | --- | --- |
| DS-2026-11-03 | 2026-11-03 | 设计规范 HTML 快照 | 首次采用 |
