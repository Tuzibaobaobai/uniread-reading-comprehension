# Production brief (token-lean)

Compact rules + JSON skeletons for transcription agents. Full rules: docs/04 (§2–§7) and docs/14; schema: `schema/index.ts`. Read those only when this brief does not cover a case.

## Inputs
- **Week pack** `.work/packs/<pl>-wNN.txt`: TOC lines + OCR text of every book page and of the answer-book pages for the week. OCR is good but has spacing/symbol errors (e.g. `B.High` → `B. High`, garbled IPA) — fix them.
- **Page images** `.work/pages/<pl>/p###.jpg`: open each article page **once** to see what OCR cannot: coloured (highlighted) words → `vocab`, underlines, italics, gloss placement, blank numbers, photos. Crop/zoom only if something is unreadable.
- **Answer book** images `.work/pages/<pl>-key/p###.jpg`: only if the OCR answer text is ambiguous.

## Files per item (ids are permanent)
- `content/playlists/<pl>/items/<id>.json`, `…/keys/<id>.json`, images `content/assets/<pl>/<id>-N.jpg` (`swift scripts/crop.swift <page.jpg> <out.jpg> x y w h` — fractions 0–1, inside the frame, no border; then set `w`/`h` to the output size).
- `id` = `<pl>-wNN-<mon|tue|wed|thu|fri>`, `order` = (week−1)×5 + day(1–5), `displayName` = `Week N <Monday…> <title>`.
- Status: item `status: {"content":"transcribed","version":"1.0.0"}`; key `"answerSource":"official","reviewStatus":"pending","officialRef":{"pdf":"<answer pdf name>","pages":[…]}` — never `approved`.

## Item skeleton
```json
{"schemaVersion":"1.0","id":"ci-g7-w02-mon","playlistId":"ci-g7","order":6,"week":2,"day":"mon",
 "title":"…","titleZh":"<from TOC>","displayName":"Week 2 Monday …",
 "taskType":{"code":"reading_choice","labelZh":"阅读单选"},
 "meta":{"genre":"新闻报道","wordCount":0,"difficulty":0,"suggestedMinutes":0,"themeContext":"…","contentRequirement":"…","intro":"<导读 from page or answer book>","hasVideo":false},
 "thumbnail":"assets/ci-g7/<id>-1.jpg",
 "source":{"pdf":"<book pdf name>","pdfPages":[…],"bookPages":[…]},
 "status":{"content":"transcribed","version":"1.0.0"},
 "article":{"images":[{"id":"img1","src":"assets/…","alt":"<English description>","w":0,"h":0}],
            "vocabulary":[{"id":"v-word","headword":"word","ipa":"wɜːd","pos":"n.","meaningZh":"单词"}],
            "blocks":[{"id":"i1","type":"imageRef","image":"img1"},{"id":"p1","type":"paragraph","content":[…]}]},
 "sections":[{"id":"s1","label":"I","instruction":"Choose the best answer.","questions":[…]}]}
```
- `taskType.code`: reading_choice 阅读单选 · cloze 完形填空 · word_bank 选词填空 · seven_choose_five 七选五 · answer_questions 回答问题 · passage_fill 短文填空 · table_fill 表格填空 · true_false 判断正误 · six_choose_four 六选四 · weekly_intensive 每周精读 (label = TOC label).
- `source.pdfPages`/`bookPages` list EVERY page the article and its questions occupy (Mon/Tue/Fri usually two pages; the next article's first page is the limit).
- Omit `thumbnail` and use `"images":[]` when there is no photo. `hasVideo`: ci-g7 / ci-g8 / ci-xsc3 / ci-zk — true only if the article page says “本篇配视频讲解课程” (TOC ● bullets are NOT video marks); ci-g3 / ci-g4 / ci-g5 — true for every 每周精读 (Friday) item, false otherwise (the book's introduction says so; pages carry no mark).
- Info box values are copied as printed — book typos and errors too (never fix them yourself; report them, the coordinator files a GitHub `errata` issue and edits only after human review). A missing 建议用时 → estimate = words ÷ grade reading speed (g3 30, g4 32, g5 35, xsc3 35, g7 40, g8 45, zk 50 wpm) + 0.6 (primary books g3–g5) or 0.5 (xsc3, g7, g8, zk) min per objective question + 1 min per typed/written question, rounded; add `"errata":[{"original":"（信息框无“建议用时”）","corrected":"建议用时：N分钟","note":"原书未印，按该年级学生平均阅读速度加做题时间估算：<calculation>，取整"}]`.
- 导读 / Words & Expressions missing on the article page → copy them from the answer book.

## Inline nodes (`content`, `prompt`, option `content`)
`{"t":"text","v":"…"}` · `{"t":"vocab","v":"surgery","ref":"v-surgery"}` (coloured word; ref = a vocabulary id, also for inflected forms) · `{"t":"em","v":"…"}` (italic titles) · `{"t":"underline","v":"…"}` · `{"t":"gloss","v":"Shiba Inu","zh":"柴犬"}` (Chinese in brackets after a word/phrase; `v` = the glossed English, `""` after an em/vocab node) · `{"t":"blank","id":"b1","number":1,"hint":{"firstLetter":"w"}|{"baseWord":"cause"}}` · `{"t":"br"}`.
Blocks: `paragraph` · `heading` · `list` {items:[[…]]} · `dialogue` {legend?, turns:[{speaker,content}]} · `note` {title?, content:[[…]], signature?} · `table` {rows:[[{content,header?,rowSpan?,colSpan?}]]} · `imageRef`. Line-by-line text = one paragraph with `br`. Curly quotes/apostrophes as printed.

## Questions — `{"id":"qN","number":N,"points":1,"skills":["detail"],"interaction":{…}}`
Numbers continuous across sections (II starts after I). First production: id = `q{number}`. Skills: main_idea detail inference vocab_in_context reference attitude structure grammar calculation opinion.

| Book format | interaction | key |
|---|---|---|
| 单选 (A–D) | `{"kind":"choice","variant":"standard","maxChoices":1,"prompt":[…],"options":[{"id":"A","content":[…]}…]}` | `{"correct":["B"]}` |
| 图片选项 (A–D are pictures) | choice; crop each picture to `content/assets/<pl>/<id>-optA.jpg` …; option `{"id":"A","image":"assets/<pl>/<id>-optA.jpg","content":[<short English description = alt text>]}` | `{"correct":["B"]}` |
| 判断 T/F | choice `"variant":"trueFalse"`, options `[{"id":"T","content":[{"t":"text","v":"True"}]},{"id":"F","content":[{"t":"text","v":"False"}]}]` | `{"correct":["T"]}` |
| 完形 (blank in article, 4 options each) | one per blank `{"kind":"inlineChoice","blankId":"b1","options":[…]}`; section instruction `"Choose the best answer to complete the passage."` if none printed | `{"correct":["A"]}` |
| 选词填空 / 七选五 (bank, blanks in article) | section `"bank":[{"id":"A","content":[…]}…]`; one per blank `{"kind":"gapMatch","blankIds":["b1"]}`; skip the printed 1–10 answer grid | `{"correct":["E"]}` |
| 句中选词 (bank, blank in the question sentence) | section bank; `{"kind":"gapMatch","prompt":[…blank…]}` (one question may hold 2 blanks) | `{"correct":["B","E"]}` in blank order |
| 短文填空 / 首字母 / 词形 (typed) | blanks in article: `{"kind":"textEntry","blankIds":["b1"]}`; blank in sentence: `{"kind":"textEntry","prompt":[…]}`; base word → `hint.baseWord`, first letter → `hint.firstLetter` (not in the text) | `{"slots":{"b1":{"accept":["warmer"]}}}` full word; list variants |
| 表格填空 | section `"stimulus":[{"id":"t1","type":"table","rows":…}]`, one textEntry per blank | slots |
| 句型转换 | textEntry `"scoring":"all"`; prompt = original (underline part) + `（改为被动语态）` + br + frame with one blank per printed line | slots per blank (contractions both ways) |
| 连词成句 | `{"kind":"order","items":[{"id":"w1","content":[…]}…],"ending":"."}` chunks in book order | `{"sequence":["w3","w1",…]}` or `sequences` |
| 连线 1:1 | `{"kind":"match","left":[{"id":"1",…}],"right":[{"id":"A",…}]}`, points = pairs | `{"pairs":{"1":"C"}}` |
| 一对多连线 | one `choice` per right-hand statement, options = categories (A, B…) | correct per question |
| 回答问题 / 观点 | `{"kind":"extendedText","prompt":[…],"scoring":"judge"}`, points = number of key points (1–2) | see below |

**回答问题 key**: `{"sampleAnswer":"<official answer>","rubricType":"content|opinion","match":"all|any","keyPoints":[{"id":"k1","descZh":"<meaning>","examples":["<1–2 English wordings>"],"weight":1}],"rubricZh":"<marking note>","explanationZh":"…","evidence":[…]}` — weights sum to points (`any` = 答出其一即可).

## Every key answer
- **Must equal the official answer.** Solve first yourself; if you disagree, keep official and append `【与独立作答不一致，待复核】` to explanationZh.
- `explanationZh`: 1–2 sentences of simple Chinese for a 12-year-old, in your own words (don't copy the answer book): where in the text → why; English only when quoting. Optional `tipsZh` (one 语言点).
- `evidence`: `[{"block":"p2","quote":"<verbatim English from that block, the smallest sentence that proves it>"}]` — first one drives 定位原文.

## Parallel agents
Keep any helper/generator scripts in your own folder `.work/tmp-<pl>-wNN/`; never use the shared scratchpad and never run a script you did not write. Write only your own item/key/asset files.

## Finish
`npm run validate -- <id>` (0 errors) for each item, then `npx tsx scripts/check-week.ts <pl> <week>` (official letters + OCR coverage). Do not run build:index, edit playlist.json, commit or deploy. Report ≤ 120 words: files, check results, disagreements, anything new.
