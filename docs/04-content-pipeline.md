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
- 题号 `number` 在整个 item 内连续（I 有 3 题，则 II 从 4 开始），只用于展示
- 小题 `id` 是永久身份（docs/14 §3.2）：**首次生产**时按顺序写 `q1…qN`（与题号相同）；之后同一道题永远保留原 id，调序只改 `number`；新增或换题用该 item 历史上从未用过的 id（已知最大编号 +1）；删除的 id 退役，不再分配给别的题。用 `npx tsx scripts/id-changes.ts --base <上一版 tag/commit>` 生成变更表并检查是否复用了退役 id
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
| **一对多连线 / 归类**（左边是 2–3 个类别，右边是带编号的句子，每句只属于一个类别） | 每个右边句子一道 `choice` 题（题号 = 书上编号，`prompt` = 句子），选项 = 左边类别（`A`、`B`…，各题相同）；section `instruction` 照抄原书连线指令；每题单独写 `explanationZh` 和 `evidence`（指向文中最小的对应句子，第一条用于“定位原文”）。交接文档注明原书题型为一对多连线 |
| 回答问题 / 观点题 | `extendedText`，`"scoring":"judge"`（LLM 评分，见 docs/09）；有句子框架时放 `scaffold`；`points` = 要点数（通常 1–2） |
| 猜词义（有选项） | `choice`；（无选项，填中文） | `textEntry`，prompt 中放 blank |
| 用所给词的适当形式填空 | `textEntry`，blank 放 `prompt`，`hint.baseWord` = 括号里的词（不再把括号文字写进 prompt） |
| **句型转换**（改为被动语态 / 对画线部分提问 / 同义句 / 反意疑问句…） | `textEntry`，`"scoring":"all"`；`prompt` = 原句（画线部分用 `underline`）+ 文本 `（改为被动语态）` + `br` + 框架句，每个横线一个 blank（每空一词） |
| **连词成句** | `order`：`items` 按书中顺序，每个逗号分隔的词块一个 item（id `w1…`），`ending` = 书中给出的句末标点；`prompt` 可省略 |

- 题干和选项中的中文括注也用 `gloss` 节点；题干中的下划线词用 `underline`
- `skills` 至少标一个：`main_idea | detail | inference | vocab_in_context | reference | attitude | structure | grammar | calculation | opinion`
- 每题 `points: 1`（连线题 = 对数）

## 2.5 真题（KET / PET）
真题按 [production-brief-ket.md](production-brief-ket.md) 生产。流程（省 token）：`scripts/render.swift` 渲染页图 → `scripts/ocr.swift` 本地 OCR（答案册另跑 `zh` 中文优先一遍，供中文详解）→ `scripts/audio.mjs` 转码音频 → 每套一个 Agent 结构化成 3 个 item + key → `npm run validate` + `npx tsx scripts/check-ket.ts <套>`（答案与答案册逐题比对）。已交付的时文阅读内容不改。

## 3. 答案键规范（keys/）

**有官方答案的书（ci-g3、ci-g7）**：答案以答案册为准（`.work/pages/<pl>-key/p###.jpg`），`answerSource: "official"`，`officialRef: {"pdf": "<答案 PDF 文件名>", "pages": [..]}`。`explanationZh` 由你参考答案册的“详解”**重新写成面向学生的口语化解析**（定位原文 → 推理 → 必要时说明错项），不要照抄；书中“语言点”可提炼为 `tipsZh`（可选，1 句）。如果你独立作答与官方答案不同，以官方为准，并在 `explanationZh` 末尾加“【与独立作答不一致，待复核】”。开放题 `sampleAnswer` 用官方参考答案。

```json
{ "schemaVersion": "1.0", "itemId": "...", "answerSource": "generated", "reviewStatus": "pending",
  "answers": { "q1": { "correct": ["A"], "explanationZh": "…", "evidence": [{ "block": "p2", "quote": "…" }] } } }
```
- `choice / inlineChoice` → `correct: ["A"]`；`gapMatch` → `correct` 按该题空格顺序排列（单空即 `["C"]`）
- `textEntry` → `slots: { "b3": { "accept": ["was developed"] } }`，列出所有可接受写法（如 `["colour","color"]`、缩写与全称）；首字母提示题写**完整单词**
- `match` → `pairs: { "1": "C", "2": "A" }`
- `order` → `sequence: ["w3","w1",…]`；有多种正确语序时用 `sequences: [[…],[…]]`
- 句型转换的 `slots`：每空单独列出，缩写/全称都列（如 `["hadn't"]` 与另一空 `["we"]`；`["What's"]` 不能拆时按框架空格数处理）
- `extendedText` → `sampleAnswer`（官方参考答案；无官方答案时写完整英文句子）+ `rubricType`（`content` / 观点题 `opinion`）+ `keyPoints`（每个得分要点一条：`descZh` 写意思而不是原词，`examples` 列 1–2 种英文说法，`weight` 之和 = 题目 `points`）+ `match`（`all`；“答出其一即可”用 `any`）+ `rubricZh`（给人看的批注）；易错题可补 2–3 个 `anchors`（满分 / 部分分 / 0 分样例）
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
- 词表词条有两种词性时写 `pos: "n. / v."`，`meaningZh` 用“；”分隔两种释义
- 按行排列的短句（如口号、清单）：一组连续的行写成一个段落，行与行之间用 `br`（定位原文会把换行当作句子边界，只高亮对应的那一行）；没有特殊样式的引导语（如 “Not that...”）保留为普通文本，不改成 heading
- 标题或彩色小标题中出现的词表词条不在正文高亮时，允许 validate 警告“never highlighted”（逐条在交接文档说明）
- 7年级：文章页没有导读和 Words & Expressions 时，从答案册该篇的“导读”和词表照录（不要自拟）

## 6. 已知原书问题处理
- 原书错别字（如 “Time Tem Glasses”）：正文照录修正后的文字，在 `errata` 记录 `{original, corrected, note}`
- 题目跨页、文章跨页：合并为同一个 item，`source.pdfPages` 列全

## 7. UniRead 交付规约（[docs/14](14-agent-production-rules.md) v0.6）

每次生产或补齐都要满足以下要求，与上面的转录规范同时执行。

**铁律：还原 RC 的布局和交互**
- UniRead 接入必须保留 RC 原页的布局、字体、响应式和交互，只替换数据、存储和通信适配；差异一律列为未完成。
- 每次交付附可构建源码、字体和图片依赖，以及来源页面的参考截图：`REFERENCE=1 npx playwright test e2e/reference.spec.ts` → `.work/reference/public`（作答前，可公开）和 `.work/reference/private`（提交后，含答案，私有）。

**稳定题目 ID（§3.2）**
- 小题 id 是永久身份，与展示题号 `number` 分开：同题保留 id，调序只改 `number`；新增或换题用该 item 历史未用过的 id；删除的 id 退役不再分配。改变题意、选项含义、空格归属或回答方式算换题。
- 选项、空格、词块 id 同样不得被赋予另一含义；共享文章、图片或 bank 发生实质变化时，所有关联题一起换 id。
- 更新已有内容前，先确定基线（上一版 tag 或 commit），用 `npx tsx scripts/id-changes.ts --base <基线>` 生成变更表，填进交接文档的“本次更新与稳定题目ID”。脚本会检查退役 id 是否被复用，发现即失败。
- `scripts/validate.ts` 已与规约对齐：只要求 id 在 item 内唯一、题号连续，不再要求 `id = q{number}`。

**机器选材清单（§3.1，可选）**
- 每份逻辑试卷一份 `docs/handoff/production-selection.<paperId>.json`（格式 `rc-selection-2`），由 `npx tsx scripts/selection-json.ts <paperId> "<标题>" <playlistId> [itemId…]` 生成。
- 逻辑 ID 只用小写字母、数字和连字符：`sourceId = uniread-rc`、`resourceId = <itemId>-<sectionId>`、`materialId = <itemId>-article`。脚本会检查格式、标题、Section 不重复选用、材料都被使用。

**身份与范围**
- 已有 Item／Section／Question／blank／选项／词块 ID 永不重编。题号只用于展示；内容换版、插题、重排或拆合时，在交接文档给出旧新 ID 映射。
- 没有明确任务时，不批量重写已有题目或答案；不因样式更新重建题目身份。
- 补充信息（平台映射、估算说明、版权、复核证据）写进交接文档，**不加进 strict JSON**，也不为“补齐字段”生成 UniRead 等级、Lexile、版权结论或考试限时。

**元数据含义**
- `gradeBand` 是学校年级（≠ UniRead L 等级）。
- `difficulty` 是原书的“难度 N 级”。
- `wordCount` 和 `suggestedMinutes` 取原书信息框；原书缺失时在 `errata` 记录估算方法，并在交接文档标“估算”。
- `hasVideo` 只是原书标记，交付视频须另行说明。

**复核状态**
- 内容复核与答案复核分开记录。
- Agent（包括独立复核 Agent）的自检只能写 `status.content: reviewed`，交接文档要写明“AI 复核，未人工复核”。
- key 的 `reviewStatus` 只有人工确认后才能改为 `approved`，Agent 一律保持 `pending`。
- 没有官方答案时 `answerSource` 为 `generated`，不得为通过检查改成 `official` 或 `approved`。

**私有材料**
- keys 只放在 `content/playlists/<pl>/keys/`，只由服务端读取。
- 构建会删除公开产物中的 keys，并扫描解析和参考答案文本（`server/private-check.ts`），发现即失败。
- 不把答案写进题干、选项、图片或页面代码。

**资产**
- 只用 `assets/...` 相对路径，不用外链、绝对路径或签名 URL。
- 每篇的缩略图在“独立文件（裁自原书）”和“平台占位”之间选一种，无图题不强行裁图。

**交互验证**
- 新题型至少要有以下测试案例：未答、正常作答、清空或部分草稿、非法 ID、恢复，以及未答题的浏览位置（见 `src/lib/answer-semantics.test.ts` 和 e2e）。
- 测试的期望值来自题意和规则，不能用待测实现生成。

**交接**
- 每批复制 [`14-production-handoff.template.md`](14-production-handoff.template.md)，生成 `docs/handoff/production-handoff.<批次>.md`，不覆盖模板。
- 清单部分用 `npx tsx scripts/handoff-inventory.ts <playlistId…>` 生成，内容包括大题／材料映射、元数据来源、资产、key 位置与 sha256、题型平台状态。
- 交接文档中记录真实执行的命令和结果；没运行的写“未运行”。

**权限**
- 规约不授权推送、部署、审批或发布。
- `/api/rc/*` 和 localStorage 是 RC 原型适配器，不是 UniRead 保存接口。
