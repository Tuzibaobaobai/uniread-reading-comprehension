# Figma 设计系统登记表

视觉的唯一来源是 Figma 文件 **UniRead**（fileKey `gYPHIUtQ50mXuoE0Cfpmu0`）。文档只引用本表中的组件名；代码只使用 [`src/styles/tokens.css`](../../src/styles/tokens.css) 中的 token。

新增或更新组件：在 Figma 选中组件 → 右键 Copy link to selection → 用 GitHub issue（设计模板）提交，或直接发给 Claude。

## 组件

| 组件 | Figma 链接 | 用途 | 实现 | 状态 |
|---|---|---|---|---|
| Quiz | [7870-85035](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=7870-85035) | 阅读页右栏题卡（题干、选项列表、底栏） | `src/reader/ReaderPage.tsx`、`app.css` `.question-card` | 已实现，待验收 |
| Option-text-item | [7301-61934](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=7301-61934) | 选项行；状态：默认 / 悬停 / 选中 / 错误 / 正确-展开（含解析） | `src/reader/interactions.tsx`、`app.css` `.option*` | 已实现，待验收 |
| Quiz-pagination | [7870-51500](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=7870-51500) | 上一题 / 题号分页（已答标记）/ 下一题·提交；提交后题号变为对错图标 | `src/reader/ReaderPage.tsx`、`app.css` `.question-nav`、`.question-dot*` | 已实现，待验收 |
| Header | [6346-84038](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=6346-84038) | 阅读页顶栏：返回按钮 + 标题。Read/Speak/Quiz、Dictionary、生词本、设置本项目不使用 | `src/reader/ReaderPage.tsx`、`app.css` `.reader-head*` | 已实现，待验收 |
| Article Text | [7740-21130](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=7740-21130) | 文章正文排版（采用其文字样式，不采用字幕卡片结构） | `src/reader/ArticlePane.tsx`、`app.css` `.article*`、`.rt-*` | 已实现，待验收 |
| Playlist | [16709-265119](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=16709-265119) | Playlist 详情页：左侧信息面板 + 右侧列表（行含进度条）。分享、统计按钮本项目不使用 | `src/pages/PlaylistPage.tsx`、`app.css` `.playlist-*`、`.item-row*` | 已实现，待验收 |

待提供：Playlists 列表页（缩略图卡片）、结果卡、对话框（未答提醒）、输入框（填空）、词库芯片（选词填空）、连线、Tokens/Variables 页。

## Token 映射规则

Figma 变量 → CSS 变量（`tokens.css`）：

| Figma 变量 | CSS token |
|---|---|
| `Customization/Grey/N` | `--grey-N` |
| `Customization/Grey/13(text)`（含透明度） | `--text-primary` |
| `Customization/State/finished-light`、`success-bg` | `--success`、`--success-soft` |
| `Customization/State/wrong-light`、`error-bg` | `--danger`、`--danger-soft` |
| `color/6`（Neutral/Component/6-base） | `--accent`（与 Figma 一致；`--accent-soft` / `--accent-strong` 为其浅色、深色派生） |
| `radius/xs·s·m·xl·full` | `--radius-xs·s·m·xl·full` |
| `Font system/<size>/<weight>` | `--fs-<size>` + `--lh-<size>`，字重用 400/500/700 |
| `font/primary-font-family` | `--font-sans` |
| Effect `drop-shadow/btn-xs`、`bar` | `--shadow-btn`、`--shadow-bar` |

Figma 中没有对应变量的值（如阴影、解析文字色）也先定义为 token，再在组件中引用。
