# 组件登记表（生成文件）

由 `scripts/ds-registry.ts` 从 `design-system/components.registry.json` 生成，不要手改。设计系统版本 DS-2026-11-03；流程见 docs/14 §15。

「画面」列是 Figma 页面 2B-Content-Pages 上的状态编号（与 `.work/figma/capture.mjs` 一致）。

共 30 项：复用 5，扩展变体（待批准） 4，新组件（待批准） 21。

## 复用（5）

| 代码组件 | 用途 | UniRead 组件 | 变体 | 画面 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `ui/BackButton` | 顶栏返回按钮 | [UIKit-LearnNav / Btn-Back](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=6270-41344) | **state**: Default | 3.03 3.07 3.11 |  |
| `ui/LearnHeader` | 学习页顶栏：返回 + 资源标题 + 步骤导航 | [UIKit-LearnNav / Header](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=9172-35493) |  | 3.03 3.07 3.11 | 标题通过文本属性覆盖：「第N天 <词条范围>」（i18n） |
| `ui/ArrowButton` | 单词翻页：上一个 / 下一个（圆形箭头） | [UiKit-Vocabulary / dialog-单词预习（内含箭头按钮）](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=12041-88652) |  | 3.03 3.04 | 复用该对话框中的圆形箭头按钮实例；阶段 3 确认其主组件 node id，并补 Disabled 变体（若无） |
| `ui/QuizButton` | 上一题 / 下一题 / 提交 | [UIKit-Quiz / button（Next）](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=7870-49853) | **State**: Default / Hover<br>**Disabled**: no / yes | 3.11 3.16 | 提交用 6433:39508 button（Submit） |
| `ui/Loading` | 整页加载遮罩（#107） | — |  |  | 来自 ui-style-kit（UniRead 下发），不是 Figma 组件 |

## 扩展变体（待批准）（4）

| 代码组件 | 用途 | UniRead 组件 | 变体 | 画面 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `ui/StepTabs` | 速览 / 学习 / 测验 三步导航（#133） | [UIKit-LearnNav / Tabs](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=15476-221046) · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19447-773) | **existing**: Step: 1 / 2 / 3（Read / Speak / Quiz）<br>**add**: Flow: Learn（Read/Speak/Quiz，现有）/ Vocab（速览/学习/测验，新增）× Step 1/2/3<br>**item**: 7805:90511 item（Text、Selected、State）保持不变，通过文本属性写入步骤名 | 3.03 3.07 3.11 4.01 | 设计规范 §07「学习模式」已要求词汇导航使用速览／学习／测验、不与 Read/Speak/Quiz 混用；目前没有对应变体。 |
| `ui/StepIcon` | 步骤图标：速览、学习 | [UIKit-LearnNav / icons](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=8162-32091) · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19447-751) | **existing**: icon: Read / Speak / Quiz / Recite / Dictation<br>**add**: icon: Scan（速览）/ Study（学习） | 3.03 3.07 | 需要设计师绘制两个图标；代码目前用占位图标（速览为方块）。 |
| `ui/PartPager` | 测验分页：每个 Part 一页，显示 P 号与题号范围 | [UIKit-Quiz / page number](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=6346-85439) · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19448-750) | **existing**: Completed: no/yes; State: Default/Hover; Selected: no/yes<br>**add**: Label（文本属性：题号范围如 1–5）+ Kicker（文本属性：P1）；Result: none / correct / wrong（提交后显示对错图标） | 3.11 3.12 3.21 | 提交后的对错图标可复用 quiz result（7870:51523，State: wrong / Default） |
| `ui/QuizResult` | 测验结果卡：通过 / 未通过、得分、各 Part 对错、查看答案 / 只练错题 / 全部重做 | [UIKit-Quiz / Result](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=12409-145740) · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19448-796) | **existing**: Pass: no / yes / Pass3（View Answers / Try Again 两个入口）<br>**add**: Actions: view-answers / retry-mistakes / retry-all（三个入口）；Part 标签（文本属性） | 3.24 3.25 | 各 Part 对错图标复用 quiz result（12409:123905） |

## 新组件（待批准）（21）

| 代码组件 | 用途 | UniRead 组件 | 变体 | 画面 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `rc/Vocab/ScanCard` | 速览词卡：词头、音标、朗读 | `RC/Vocab/ScanCard`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19443-488) | **Marked**: none / known / unknown<br>**State**: Default | 3.03 3.04 3.05 4.01 | 内部复用 UIkit-Read btn-play（3221:7265）作朗读按钮 |
| `rc/Vocab/MarkButton` | 认识 / 不认识按钮 | `RC/Vocab/MarkButton`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19443-521) | **Mark**: know / unknown<br>**Selected**: no / yes<br>**State**: Default / Hover / Pressed | 3.03 3.04 3.05 | 与 Dictation「btn-加入错词本」语义不同（标记掌握程度，不是加入列表），因此新建 |
| `rc/Vocab/ScanSummary` | 速览完成小结：标记统计 + 从头再看 / 去学习 | `RC/Vocab/ScanSummary`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19443-530) | **State**: Default | 3.06 | 按钮复用 UIKit-Quiz button（6433:39508 / 7870:49853） |
| `rc/Vocab/StudyToolbar` | 学习页工具栏：词条数、认识 / 不认识计数、未标记提示、标记图例 | `RC/Vocab/StudyToolbar`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19445-666) |  | 3.07 3.09 3.10 4.02 |  |
| `rc/Vocab/MarkTag` | 标记标签（三级、G6下U1、▲补充词等） | `RC/Vocab/MarkTag`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19445-483) | **Kind**: level / textbook / supplement / star | 3.07 3.10 |  |
| `rc/Vocab/EntryCard` | 词条卡：词头、星标、朗读、音标、标签、义项、例句、折叠区（词组 / 词形 / 辨析 / 谚语）、名师点拨 | `RC/Vocab/EntryCard`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19445-654) | **Known**: known / unknown / unmarked<br>**Open**: yes / no<br>**Kind**: word / phrase | 3.07 3.08 3.09 3.10 3.29 | 认识 = 绿色词头且默认收起；不认识 / 未标记 = 红色且展开（#133）。朗读按钮复用 btn-play。 |
| `rc/Vocab/Example` | 例句行：英文（下划线标出词头）+ 朗读 + 中文 | `RC/Vocab/Example`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19445-495) | **Audio**: yes / no | 3.07 3.08 |  |
| `rc/Vocab/TipBox` | 名师点拨（默认收起，#134） | `RC/Vocab/TipBox`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19445-506) | **Open**: no / yes | 3.08 |  |
| `rc/Vocab/CompareBlock` | 辨析（高考词条） | `RC/Vocab/CompareBlock`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19445-512) |  | 3.10 |  |
| `rc/Quiz/SectionHeader` | Part 标题行：Part N + 题型说明 + 已完成 x/y | `RC/Quiz/SectionHeader`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-576) |  | 3.11 3.12 3.13 3.18 |  |
| `rc/Quiz/LineInput` | 单行作答输入（下划线式） | `RC/Quiz/LineInput`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-589) | **State**: Empty / Focus / Filled<br>**Result**: none / correct / wrong<br>**Locked**: no / yes<br>**Lang**: en / zh | 3.11 3.12 3.13 | i18n placeholder；输入字号 ≥ 16px |
| `rc/Quiz/BlankInput` | 句中空格（首字母前缀、括号原词） | `RC/Quiz/BlankInput`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-609) | **Prefix**: none / first-letter<br>**Base**: none / word<br>**State**: Empty / Focus / Filled<br>**Result**: none / correct / wrong | 3.14 3.15 3.22 | 与时文阅读、KET/PET 的填空共用，阶段 5 合并 |
| `rc/Quiz/PosChips` | 词性选择（n. v. adj. …） | `RC/Quiz/PosChips`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-620) | **Selected**: no / yes<br>**State**: Default / Hover<br>**Result**: none / correct / wrong | 3.11 |  |
| `rc/Vocab/WordProfileRow` | 音标写词 + 词性 + 中文释义 行 | `RC/Vocab/WordProfileRow`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-693) | **Result**: none / correct / wrong / partial<br>**Locked**: no / yes | 3.11 3.26 |  |
| `rc/Vocab/WordFamilyRow` | 词形拓展行（相关词 + 中文） | `RC/Vocab/WordFamilyRow`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-726) | **Result**: none / correct / wrong / partial<br>**Locked**: no / yes | 3.13 |  |
| `rc/Vocab/TranslateRow` | 中译英：中文 + 指定词 + 多行输入 | `RC/Vocab/TranslateRow`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-765) | **State**: Empty / Filled<br>**Result**: none / judged | 3.16 3.23 3.28 |  |
| `rc/Quiz/JudgeResult` | 模型评分结果：得分、要点达成、反馈 | `RC/Quiz/JudgeResult`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-739) | **Score**: full / partial / zero | 3.28 1.16 | 时文阅读开放题共用 |
| `rc/Vocab/PhraseBank` | 词组日中文词组方框（点选划掉） | `RC/Vocab/PhraseBank`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-770) | **Used**: no / yes | 3.17 |  |
| `rc/Quiz/TableFill` | 表格填空（第 69–70 天） | `RC/Quiz/TableFill`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-779) | **Cell**: header / text / blank | 3.18 3.19 3.20 3.31 | 答案格复用 rc/Quiz/BlankInput |
| `rc/Quiz/AnswerFeedback` | 复盘答案框：正确答案、得分、解析、查看词条 | `RC/Quiz/AnswerFeedback`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19446-804) | **Result**: correct / wrong / partial | 3.26 3.27 3.31 | 与 option-text-item 的「正确-展开」不同：这里显示的是填空 / 翻译题的答案与解析 |
| `rc/Vocab/EntryDialog` | 查看词条弹层 | `RC/Vocab/EntryDialog`（新建） · [提案 ↗](https://www.figma.com/design/gYPHIUtQ50mXuoE0Cfpmu0?node-id=19445-703) |  | 3.29 | 内容为 rc/Vocab/EntryCard；关闭按钮复用 UIKit-LearnNav btn-close（7870:43771） |

