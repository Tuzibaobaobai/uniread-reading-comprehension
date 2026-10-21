# Figma 设计系统登记表

视觉的唯一来源是 Figma 文件 **UniRead**（fileKey `gYPHIUtQ50mXuoE0Cfpmu0`）。文档只引用本表中的组件名；代码只使用 [`src/styles/tokens.css`](../../src/styles/tokens.css) 中的 token。

新增或更新组件：在 Figma 选中组件 → 右键 Copy link to selection → 用 GitHub issue（设计模板）提交，或直接发给 Claude。

## 组件

| 组件 | Figma 链接 | 用途 | 实现 | 状态 |
|---|---|---|---|---|
| Quiz | [7870-85035](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=7870-85035) | 阅读页右栏题卡（题干、选项列表、底栏） | `src/reader/ReaderPage.tsx`、`app.css` `.question-card` | 已实现，待验收 |
| Option-text-item | [7301-61934](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=7301-61934) | 选项行；状态：默认 / 悬停 / 选中 / 错误 / 正确-展开（含解析） | `src/reader/interactions.tsx`、`app.css` `.option*` | 已实现，待验收 |
| Quiz-pagination | [7870-51500](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=7870-51500) | 上一题 / 题号分页（已答标记）/ 下一题·提交；提交后题号变为对错图标 | `src/reader/ReaderPage.tsx`、`src/reader/QuestionStrip.tsx`、`app.css` `.question-nav`、`.question-dot*`、`.strip-more` | 已实现，待验收；题号溢出时的“更多”按钮 Figma 中尚无设计，暂用现有 token 实现，待补组件 |
| Header | [6346-84038](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=6346-84038) | 阅读页顶栏：返回按钮（btn-back，图标 [11790-77480](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=11790-77480)：18 × 18 SVG，默认 / 悬停两态，#99）+ 标题。Read/Speak/Quiz、Dictionary、生词本、设置本项目不使用 | `src/reader/ReaderPage.tsx`、`app.css` `.reader-head*` | 已实现，待验收 |
| Article Text | [7740-21130](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=7740-21130) | 文章正文排版（采用其文字样式，不采用字幕卡片结构） | `src/reader/ArticlePane.tsx`、`app.css` `.article*`、`.rt-*` | 已实现，待验收 |
| Playlist | [16709-265119](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=16709-265119) | Playlist 详情页：左侧信息面板 + 右侧列表（行含进度条）。分享、统计按钮本项目不使用 | `src/pages/PlaylistPage.tsx`、`app.css` `.playlist-*`、`.item-row*` | 已实现，待验收 |
| UIkit-Read · player | [11728-110946](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=11728-110946)（页 [15476-159261](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=15476-159261)） | 听力录音播放器：进度行 + 后退 / 播放·暂停 / 前进（btn-play 3221-7266、btn-pause 3221-7268、btn-before） | `src/reader/AudioPlayer.tsx`、`app.css` `.player*` | 已实现，待验收；考试模式锁定状态 Figma 中尚无，按 btn-play Disabled 实现 |
| UIkit-Speak · 句卡 Focus | [8872-81973](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=8872-81973)（页 [15450-159260](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=15450-159260)） | 口语：考官问题卡 + 听题 / 回答（录音、✓ 结束、识别中）/ 回放 | `src/reader/Speaking.tsx`、`app.css` `.speak-*` | 已实现，待验收 |
| 整段跟读评分 | [15504-104872](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=15504-104872) | 口语评分结果（按词着色需发音评测，暂未使用） | — | 已登记 |
| 模式切换 select | [19215-125964](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=19215-125964)（页面 [19215-125693](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=19215-125693)） | 真题阅读页顶栏右上角：当前模式（练习 / 考试）+ 考试倒计时 + 下拉箭头；点开菜单切换模式（#102） | `src/reader/ExamChrome.tsx` `ModeSelect`、`app.css` `.mode-select*` | 已实现，待验收；展开后的菜单 Figma 中尚无，待补组件 |
| Quiz · 结果卡 | [15450-159259](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=15450-159259) | 通过 / 未通过结果卡、View Answers / Try Again | 成绩报告暂用 `.dialog` 实现 | 待按结果卡对齐 |
| 拼写 / 字母块 | [15092-99049](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=15092-99049) | 填空输入、对错反馈 | 沿用现有填空样式 | 已登记 |
| Header · Read/Speak/Quiz + 设置 | [7762-32671](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=7762-32671) | 顶栏模式切换、字号 / 播放速度设置 | 本项目暂不使用 | 已登记 |
| Dictionary | [15476-159262](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=15476-159262) | 查词面板 | 本项目暂不使用 | 已登记 |
| Vocabulary | [12074-89149](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0/UniRead?node-id=12074-89149) | 词卡轮播 | 本项目暂不使用 | 已登记 |

待提供：Playlists 列表页（缩略图卡片）、结果卡、对话框（未答提醒）、输入框（填空）、词库芯片（选词填空）、连线、Tokens/Variables 页。

真题（KET/PET）待补组件（暂用现有 token 实现）：写作题干体裁版式（邮件抬头栏 + From/To/Subject 字段框、征稿启事标题栏，#96）、人物照片（阅读 Part 2 文旁 / 题旁，#91）、PET 写作邮件批注标签（callout）、写作二选一任务卡、口语 AI 搭档角色标签；看图选择题图片选项卡片、题目级材料区（告示）、示例题样式、写作区（字数统计 / 要点清单 / 多图题干）、写作与口语评分结果（Cambridge 维度分）、听力原文面板、练习 / 考试模式选择对话框、模式切换菜单展开态、考试倒计时警告态、标记题目、交卷确认、成绩报告、Playlist 按“第 N 套”分组。

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
