# 03 · 数据模型

**唯一事实来源：[`schema/index.ts`](../schema/index.ts)**（zod）。`npm run schema:export` 导出 JSON Schema 到 `schema/json/`，供 UniRead 后端/其他语言使用。

## 设计参照
| 来源 | 借鉴点 |
|---|---|
| 1EdTech **QTI 3.0** | interaction 命名（choice、inlineChoice、textEntry、gapMatch、match、extendedText、order）；答案键 ≈ `responseDeclaration/correctResponse` + `mapping`；便于日后导出 QTI 题包 |
| Khan Academy **Perseus** | 正文是结构化内容，空格以占位节点嵌入，题目用 id 引用 → 文章与题目解耦、可联动 |
| Newsela / CommonLit / ReadTheory | 每题能力标签 `skills`、中文解析、原文证据定位 |
| xAPI / Caliper | Attempt 结构可映射为 `answered` / `completed` statement |

## 文件布局
```
content/
  catalog.json                                 由 scripts/build-index.ts 生成：playlists + item 摘要（列表页只读它）
  playlists/<playlistId>/playlist.json         playlist 元数据 + 有序 itemIds
  playlists/<playlistId>/items/<itemId>.json   文章 + 题目（不含答案）
  playlists/<playlistId>/keys/<itemId>.json    答案键 + 解析 + 证据
  assets/<playlistId>/…                        封面、文章图片
```

## ID 规范（发布后永不变更）
| 对象 | 格式 | 例 |
|---|---|---|
| Playlist | `ci-<book>` | `ci-g3`、`ci-g7`、`ci-xsc3`、`ci-zk` |
| Item | `<playlist>-w<NN>-<mon…fri>` | `ci-g3-w01-mon` |
| Block | 类型前缀 + 序号 | `p1` 段落、`h1` 标题、`l1` 列表、`d1` 对话、`n1` 便条、`t1` 表格、`i1` 图片位 |
| Blank | `b<n>` | `b1` |
| Question | `q<number>` | `q1` |
| 词条 | `v-<headword>` | `v-show-up` |

## 层级
```
Playlist ─┬─ Item ─┬─ meta（信息框）
          │        ├─ article ─┬─ images[]
          │        │           ├─ blocks[]   ← Inline[]（text / em / strong / vocab / underline / gloss / blank / br）
          │        │           └─ vocabulary[]
          │        └─ sections[] ─┬─ instruction / label / bank? / stimulus?
          │                       └─ questions[] ─ interaction
          └─ Key（独立文件）── answers{ qid → correct | slots | pairs | sequence | sampleAnswer }
Attempt（运行时）── responses{ qid → value } + result
```

## Item 示例（节选）
```json
{
  "schemaVersion": "1.0",
  "id": "ci-g3-w01-mon", "playlistId": "ci-g3", "order": 1, "week": 1, "day": "mon",
  "title": "Tiny “Embryos” Begin Space Test",
  "displayName": "Week 1 Monday Tiny “Embryos” Begin Space Test",
  "taskType": { "code": "reading_choice", "labelZh": "阅读选择" },
  "meta": { "genre": "新闻报道", "wordCount": 126, "difficulty": 4, "suggestedMinutes": 6,
            "themeContext": "人与社会", "contentRequirement": "科学技术与工程",
            "intro": "中国空间站首次开展人类“人工胚胎”实验。", "hasVideo": false },
  "article": {
    "images": [],
    "blocks": [{ "id": "p2", "type": "paragraph", "content": [
      { "t": "text", "v": "Scientists say these are not real " },
      { "t": "vocab", "v": "human", "ref": "v-human" },
      { "t": "text", "v": " embryos. They are made from " },
      { "t": "gloss", "v": "stem cells", "zh": "干细胞" }, { "t": "text", "v": " …" } ] }],
    "vocabulary": [{ "id": "v-human", "headword": "human", "ipa": "ˈhjuːmən", "pos": "adj.", "meaningZh": "人的" }]
  },
  "sections": [{ "id": "s1", "instruction": "Choose the best answer.", "questions": [
    { "id": "q1", "number": 1, "points": 1, "skills": ["detail"],
      "interaction": { "kind": "choice", "variant": "standard", "maxChoices": 1,
        "prompt": [{ "t": "text", "v": "What are the “artificial embryos” made from?" }],
        "options": [{ "id": "A", "content": [{ "t": "text", "v": "Stem cells." }] }, …] } }]}],
  "source": { "pdf": "小学英语时文阅读提分训练3+X3年级.pdf", "pdfPages": [10], "bookPages": [1] },
  "status": { "content": "reviewed", "version": "1.0.0" }
}
```

## 各 interaction 的数据形态

| kind | 题目字段 | 作答值 `responses[qid]` | 答案键 |
|---|---|---|---|
| `choice` | `prompt`、`options[]`、`variant` | `["B"]` | `{ "correct": ["B"] }` |
| `inlineChoice` | `blankId`、`options[]`、`prompt?` | `["C"]` | `{ "correct": ["C"] }` |
| `gapMatch` | `blankIds?`（文中空）或 `prompt` 中的 blank；选项来自 `section.bank` | `{ "b3": "E" }` | `{ "correct": ["E"] }`（按空格顺序） |
| `textEntry` | `blankIds?` 或 `prompt` 中的 blank；`maxWords?` | `{ "b1": "was developed" }` | `{ "slots": { "b1": { "accept": ["was developed"] } } }` |
| `match` | `left[]`、`right[]` | `{ "1": "C", "2": "A" }` | `{ "pairs": { "1": "C", "2": "A" } }` |
| `extendedText` | `prompt`、`scaffold?`、`scoring`（`judge`/`self`/`none`） | `"Because …"` | `{ "sampleAnswer": "…", "rubricType": "content", "keyPoints": [{"id":"k1","descZh":"…","weight":1}], "match": "all", "anchors?": [...] }` |
| `order` | `items[]` | `["c","a","b"]` | `{ "sequence": ["c","a","b"] }` |

所有答案键可带 `explanationZh`（中文解析）与 `evidence: [{ block, quote }]`（quote 必须逐字存在于该 block）。

## 判分规则（`src/lib/grading.ts`）
- 文本归一化：NFKC、统一弯引号/破折号、合并空白、去首尾空格与末尾标点、默认不区分大小写
- 首字母提示空：接受完整单词，也接受只填剩余字母
- 多空题 / 连线题按空（对）比例得分，`correct` 仅在全部正确时为 true
- `extendedText`：`byQuestion[].scoredBy` = `pending`（等待 LLM judge）→ `judge`（计入总分，`judgement` 记录要点、反馈、置信度、模型和提示版本）；judge 不可用时为 `self`（学生自评记录在 `result.selfAssessed`，不计分）；`none` 不计分。详见 [09](09-subjective-scoring.md)
- 其它题型 `scoredBy` 省略或为 `auto`

## Attempt（作答记录）
```json
{ "attemptId": "6f1c…", "itemId": "ci-g3-w01-mon", "itemVersion": "1.0.0", "learnerId": null,
  "startedAt": "2026-10-14T09:00:00Z", "submittedAt": "2026-10-14T09:05:12Z", "durationSec": 312,
  "status": "submitted",
  "responses": { "q1": ["A"], "q2": ["B"], "q3": ["A"] },
  "result": { "score": 3, "maxScore": 3,
              "byQuestion": [{ "q": "q1", "correct": true, "points": 1, "maxPoints": 1 }, …] } }
```
xAPI 映射：actor = learnerId；verb = `answered`（每题）/ `completed`（提交）；object = `<itemId>#<qid>`；result.score.scaled = score / maxScore。

## 真题 item（`format: "exam"`，KET / PET）

2026-10 起新增，**纯增量**：已交付的 540 条时文阅读（`ArticleItem`）文件、ID 与结构都不变，`SCHEMA_VERSION` 仍为 `1.0`。`Item = ArticleItem | ExamItem`。

- `ExamItem`：`format: "exam"`、`id` = `<playlist>-t<套>-<rw|l|s>`、`test`（第 N 套）、`paper`（`reading_writing` / `listening` / `speaking`；阅读与写作按考试合为一卷，见 #73）、`meta {exam, durationMinutes, totalMarks}`；`article` 只作图片登记表（`blocks` / `vocabulary` 为空）。
- 一个 Part = 一个 section：`part`、`label`（`Part N`）、`material`（左栏材料，可含空格）、`audio {src, seconds}`（听力，文件已含两遍播放）。
- 题目可带 `material`（当前题的左栏材料，如 R&W Part 1 告示）；选项可带 `image`（听力 Part 1 看图选择）。
- `extendedText.minWords`（写作字数下限，实时计数）；新交互 `speaking {prompt, turns[{id, text}], maxSeconds, scoring}`，作答为 `{turnId: 语音转写}`。
- Key：`rubricType` 增加 `cambridge_a2_writing` / `cambridge_a2_speaking`（keyPoints = 评分维度，weight 5，按 0–5 档给分）；`transcripts {sectionId: Block[]}` 为听力原文，与答案一样只在提交后由服务端返回。
- Attempt：`mode`（`practice` / `exam`）、`flagged`（考试模式标记的题）、`played`（考试模式已播放的录音）。Judgement 的 keyPoint 可带 `band`。
- Catalog：真题 playlist 带 `format: "exam"`，ItemSummary 用 `test` / `paper` 代替 `week` / `day`，没有 `difficulty`；真题 playlist 排在时文阅读之后。

### PET 增量（2026-10）
- `paper` 增加 `reading`、`writing`（id 后缀 `r`、`w`）；`meta.exam` 决定 Cambridge 换算表（`A2 Key…` → A2，`B1 Preliminary…` → B1）；catalog 的真题合集带 `exam`。
- 行内节点 `callout`（写作输入邮件的手写批注）；section `choose`（N 选 M 作答，只计所选题）；speaking turn `role`（`examiner` / `partner`，AI 搭档）。
- Section `columns`（`{left, right}`）：配对板的两栏印刷标题（KET 听力 Part 5，#104）。
- Key `explanationSource`（`official` / `generated`）：答案册没有中文解析、由制作方撰写时标 `generated`（PET 校园版真题 3），缺省与 `answerSource` 相同。
- 版式增量（GitHub #90 #91 #96）：`note.style`（`email` = 抬头栏 + `header` 字段行 From / To / Subject；`notice` = 标题栏 + 居中 `heading` 与居中正文，用于征稿启事、广告）；`extendedText.stimulus`（写作题干里按原体裁排版的材料，显示在 prompt 之后）与 `task`（材料之后的写作指令）；paragraph `image`、question `image`（人物照片，引用 `article.images` 的 id）；section `intro`（印在题目前的导语，显示在题目区而不是左栏）。
- `rubricType` 增加 `cambridge_b1_writing`（content / communicative_achievement / organisation / language）、`cambridge_b1_speaking`（grammar_vocabulary / discourse_management / interactive_communication / global）。

## 版本
- `schemaVersion`：数据结构版本（破坏性变更才升级）
- `item.status.version`：内容版本（semver），修订文字或答案时递增；Attempt 记录 `itemVersion`
