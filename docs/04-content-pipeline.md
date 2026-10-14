# 04 · 内容生产流程（Content Pipeline）

PDF 是扫描件（无文字层、无答案页），内容靠 **页面图片 → 视觉转录 → 结构化 JSON** 生产。
本文件既是流程说明，也是转录员（人或 AI agent）必须遵守的规范。

## 1. 流程总览

| 步骤 | 工具 / 产物 | 说明 |
|---|---|---|
| 1. 渲染页面 | `swift scripts/render.swift <pdf> .work/pages/<playlist> 1800` | 每页一张 JPEG（`p001.jpg`…），`.work/` 不入库 |
| 2. 转录 | `content/playlists/<pl>/items/<itemId>.json` | 文章 + 题目，严格符合 `schema/index.ts` |
| 3. 出答案 | `content/playlists/<pl>/keys/<itemId>.json` | 书中无答案，由转录员作答并写中文解析 + 原文证据 |
| 4. 裁图 | `swift scripts/crop.swift <page.jpg> <out.jpg> x y w h` | 坐标为页面比例 0–1，裁到图片边框**内侧** |
| 5. 校验 | `npm run validate -- <itemId>` | schema + 交叉引用规则，必须 0 error |
| 6. 复核 | 独立复核人对照原图逐字检查 | 通过后 `status.content = "reviewed"` |
| 7. 建索引 | `npm run build:index` | 生成 `content/catalog.json` 并回填 playlist `itemIds` |

页码换算：3年级 书页 N = `p(N+9)`；小升初 书页 N = `p(N+8)`。目录见 [01-content-inventory.md](01-content-inventory.md)。

## 2. 转录规范

参考范例：`content/playlists/ci-g3/items/ci-g3-w01-mon.json` + `keys/ci-g3-w01-mon.json`。

### 2.1 基本字段
- `id` = `{playlist}-w{两位周}-{mon|tue|wed|thu|fri}`；`order` = (week-1)*5 + 天序号(1–5)
- `title`：英文标题原样（大号首词 + 彩色其余部分合为一句），使用弯引号 “ ” ’
- `titleZh`：目录中的中文标题
- `displayName` = `Week {week} {Monday…Friday} {title}`
- `taskType`：按目录标签：阅读选择/阅读理解→`reading_choice`，完形填空→`cloze`，选词填空→`word_bank`，六选四→`six_choose_four`，七选五→`seven_choose_five`，连线题→`matching`，判断正误→`true_false`，回答问题→`answer_questions`，短文填空→`passage_fill`，表格填空→`table_fill`，补全对话→`dialogue_completion`，每周精读→`weekly_intensive`；`labelZh` 用目录原文
- `meta`：信息框逐项照抄。小升初“主题语境（内容要求）”合在一行时：`themeContext` 取括号前，`contentRequirement` 取括号内。`hasVideo`：有“本篇配视频讲解课程”或目录 ▶ 标记即 true。建议用时缺失时按词数估（约 20 词/分钟）并在 `errata` 记录
- `source.pdfPages`：文章与题目所在的全部 PDF 页号；`bookPages` 为书页码
- `status`：`{ "content": "transcribed", "version": "1.0.0" }`

### 2.2 正文 blocks
- 每个自然段一个 `paragraph`，id 依次 `p1, p2…`；小标题 `heading`（id `h1…`）；列表 `list`（`l1…`）；对话 `dialogue`（`d1…`，每个说话轮次一个 turn，`speaker` 照原文如 `W`/`M`/`Joe`，`legend` 照抄说话人图例）；便条/广告/通知 `note`（`n1…`）；表格 `table`（`t1…`）
- 所有 block id 在整个 item 内唯一（包括 `sections[].stimulus` 里的 block）
- 文字逐字照抄，保留原书拼写和标点；用弯引号和撇号（’）；破折号用 —
- 行内节点：
  - 彩色高亮词 → `{"t":"vocab","v":"arrived","ref":"v-arrive"}`（ref 指向词表 id；词形不同也指向原形词条）
  - 带下划线的考查词 → `{"t":"underline","v":"one"}`；若同时高亮，加 `"vocab":"v-xxx"`
  - 中文括注 `word ( 中文 )` → `{"t":"gloss","v":"word","zh":"中文"}`。`v` 只放被注释的英文词/短语（通常是括号前那个词或短语），不要把整句放进去。若被注释的词同时是高亮词，用 vocab 节点后接 `{"t":"gloss","v":"","zh":"中文"}`
  - 斜体（书名、片名）→ `em`；粗体小标签 → `strong`
  - 文中空格 → `{"t":"blank","id":"b1","number":1}`；有首字母提示 `n__4__` → `"hint":{"firstLetter":"n"}`；有括号原词 `__1__(develop)` → `"hint":{"baseWord":"develop"}`，括号原词不要再写进文字
- 图片：裁剪后放 `content/assets/<pl>/<itemId>-<n>.jpg`，在 `article.images` 登记（`w/h` 为裁剪后像素），并在正文中合适位置插入 `{"type":"imageRef","id":"i1","image":"img1"}`（若用户界面统一把图片放在正文前，可放在 blocks 开头）。`alt` 用一句英文描述。没有图片时 `images: []`
- 首张图片同时作为缩略图：`"thumbnail": "assets/<pl>/<itemId>-1.jpg"`；无图片则不填（App 会生成文字卡）

### 2.3 Words & Expressions
- `vocabulary` 按书中顺序；`id` = `v-` + 小写词条（空格/符号转 `-`），如 `v-show-up`
- `ipa` 去掉两侧斜杠；短语无音标则省略 `ipa`、`pos`
- 每个词条至少在正文出现一次 vocab 节点

### 2.4 题目 sections
- 每个大题（I / II）一个 section；无罗马数字时省略 `label`
- `instruction` 照抄英文指令；完形填空书中无指令时写 `"Choose the best answer to complete the passage."`
- 题号 `number` 在整个 item 内连续（I 有 3 题，则 II 从 4 开始）；`id` = `q{number}`
- 题型映射：

| 原题 | interaction |
|---|---|
| 单选（含词义题、指代题、①②③ 组合选项） | `choice`，选项 id `A/B/C/D` |
| 判断正误 | `choice` + `"variant":"trueFalse"`，选项固定 `[{"id":"T","content":[{"t":"text","v":"True"}]},{"id":"F","content":[{"t":"text","v":"False"}]}]` |
| 完形填空 | 每空一个 `inlineChoice`，`blankId` 指向正文 blank，选项 A–C/D |
| 括号二选一 `___ (Northern/Southern)` | `inlineChoice`，blank 放在 `prompt` 里，选项 A/B |
| 选词填空 / 六选四 / 七选五 / 补全对话 / 11 选 10 | section 上放 `bank`（A…），每空一个 `gapMatch`，`blankIds:["b1"]` 指向正文 blank |
| 题目句子里的选词填空（每周精读） | 同上，但 blank 放在 question 的 `prompt` 里（不写 blankIds）；**一题多空保持一题**，key 的 `correct` 按空格顺序排列，如 `["B","E"]` |
| 短文填空 / 表格填空 / 句子补全（打字） | `textEntry`；文中/表中空格用 `blankIds`；题目句中空格放 `prompt`，一题可多空 |
| 表格填空的表格 | 放在 section 的 `stimulus`（`table` block），表格里的空用 blank 节点；每空一个 textEntry 题（`blankIds:["b1"]`） |
| 连线 | 一个 `match` 题，`left` id 用 `1..n`，`right` id 用 `A..`；整题一个题号，`points` = 左项数 |
| 回答问题 / 观点题 | `extendedText`；事实题 `"scoring":"self"`，纯观点题 `"scoring":"none"`；有句子框架时放 `scaffold` |
| 猜词义（有选项） | `choice`；（无选项，填中文） | `textEntry`，prompt 中放 blank |

- 题干和选项中的中文括注也用 `gloss` 节点；题干中的下划线词用 `underline`
- `skills` 至少标一个：`main_idea | detail | inference | vocab_in_context | reference | attitude | structure | grammar | calculation | opinion`
- 每题 `points: 1`（连线题 = 对数）

## 3. 答案键规范（keys/）
```json
{ "schemaVersion": "1.0", "itemId": "...", "answerSource": "generated", "reviewStatus": "pending",
  "answers": { "q1": { "correct": ["A"], "explanationZh": "…", "evidence": [{ "block": "p2", "quote": "…" }] } } }
```
- `choice / inlineChoice` → `correct: ["A"]`；`gapMatch` → `correct` 按该题空格顺序排列（单空即 `["C"]`）
- `textEntry` → `slots: { "b3": { "accept": ["was developed"] } }`，列出所有可接受写法（如 `["colour","color"]`、缩写与全称）；首字母提示题写**完整单词**
- `match` → `pairs: { "1": "C", "2": "A" }`
- `extendedText` → `sampleAnswer`（完整英文句子，小学生水平）+ `rubricZh`（要点）
- 每题必须有 `explanationZh`（1–2 句中文，说明依据），尽量给 `evidence`（block id + 原文片段，片段必须在该 block 中逐字存在）
- 作答要认真：先通读全文再答题；完形/选词需考虑语法、搭配、上下文和“每项只用一次”；不确定时在 `explanationZh` 末尾加“【待复核】”

## 4. 复核清单（Reviewer）
1. 对照页面图逐字核对标题、信息框、正文、词表、题干、选项
2. 高亮词、下划线词、中文括注、斜体是否全部标注且位置正确
3. 空格编号、首字母/原词提示是否正确
4. 每道题答案独立重做一遍，与 key 不一致处标出并修正
5. 图片裁剪是否完整、无边框残留
6. `npm run validate -- <itemId>` 0 error
7. 通过后：item `status.content = "reviewed"`

## 5. 试点中确认的补充规则
- 中文括注紧跟在 vocab 或 em 节点之后时，用 `{"t":"gloss","v":"","zh":"…"}`（如斜体书名 + `(《红楼梦》)`）
- 中文括注覆盖整个短语时，`v` 写整个短语（如 `degrees Celsius`、`hair clip`）
- 单选题干中的横线（如 `The word means ______.`）写成纯文本 `________`，不要用 blank 节点（blank 必须有题目作答）
- 广告/通知等多则材料：每则一个 `note` 块，配图用 `imageRef` 放在对应 note 之前
- 段落以空格开头（六选四/七选五）时，段落第一个节点就是 blank
- 词表词条只出现在标题中（标题为纯文本）时允许 validate 警告“never highlighted”
- 表格左上角空表头写 `{"header":true,"content":[]}`
- 书中无中文标题时从目录页补 `titleZh`

## 6. 已知原书问题处理
- 原书错别字（如 “Time Tem Glasses”）：正文照录修正后的文字，在 `errata` 记录 `{original, corrected, note}`
- 题目跨页、文章跨页：合并为同一个 item，`source.pdfPages` 列全
