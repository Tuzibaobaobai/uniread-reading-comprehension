# Production brief — KET / A2 Key for Schools 真题 (token-lean)

Compact rules for transcribing one KET test (= 3 items: Reading & Writing, Listening, Speaking — Reading and Writing stay one paper because the exam times them together, GitHub #73). Inline nodes, blocks and the question table are the same as in [production-brief.md](production-brief.md) — read its "Inline nodes" and "Questions" sections; this brief only adds the exam rules. Schema: `ExamItem` in `schema/index.ts`.

**Delivered 时文阅读 content (`content/playlists/ci-*`) is frozen — never touch it.**

## Inputs (already prepared — do not re-render or re-OCR)
- OCR text: `.work/text/ket1/t<N>-<rw|l|s|key>/p###.txt` — one line per text line: `y x confidence text` (y/x = fractions of the page from the top-left). Two-column pages interleave in reading order; use y/x to separate columns. OCR may confuse Cyrillic look-alikes (З С → 3 C), drop spaces and garble symbols — fix them.
- Answer-book Chinese (中文详解, 写作点评): `.work/text/ket1/t<N>-key-zh/p###.txt` — Chinese-first OCR, reads Chinese cleanly. Use it for `explanationZh` and anchor notes instead of the page images; the English OCR in `t<N>-key/` is for answers and transcripts.
- Page images: `.work/pages/ket1/t<N>-<rw|l|s|key>/p###.jpg` (1600 px wide). **Look at an image only to (a) find crop boxes for pictures, (b) check layout the OCR cannot show (columns, bold/italic, tables), (c) read lines whose OCR confidence < 0.5.** Do not read every page.
- Audio: already in `content/assets/ket1/ket1-t<N>-p<K>.m4a`; durations (seconds) in `.work/audio/ket1/ket1-audio.json`.
- Source PDFs (for `source.pdf` names): `articles/KET 真题/01 - KET 校园版真题 1/01 - 分套使用（含音频）【更方便】/0<N> - KET 真题 1 - 第<N>套/`.

## Items (ids are permanent)
| paper | id | title / displayName | order | taskType | meta.durationMinutes | totalMarks |
|---|---|---|---|---|---|---|
| Reading & Writing | `ket1-t<N>-rw` | `KET真题1-第<N>套-阅读与写作` | 3(N−1)+1 | `exam_reading_writing` 阅读与写作 | 60 | 60 |
| Listening | `ket1-t<N>-l` | `KET真题1-第<N>套-听力` | 3(N−1)+2 | `exam_listening` 听力 | 35 | 25 |
| Speaking | `ket1-t<N>-s` | `KET真题1-第<N>套-口语` | 3(N−1)+3 | `exam_speaking` 口语 | 10 | 30 |

```json
{"schemaVersion":"1.0","format":"exam","id":"ket1-t1-rw","playlistId":"ket1","order":1,"test":1,"paper":"reading_writing",
 "title":"KET真题1-第1套-阅读与写作","displayName":"KET真题1-第1套-阅读与写作",
 "taskType":{"code":"exam_reading_writing","labelZh":"阅读与写作"},
 "meta":{"exam":"A2 Key for Schools","durationMinutes":60,"totalMarks":60},
 "article":{"images":[{"id":"img1","src":"assets/ket1/ket1-t1-rw-1.jpg","alt":"<full text of the notice / description of the picture>","w":0,"h":0}],"blocks":[],"vocabulary":[]},
 "sections":[{"id":"s1","part":1,"label":"Part 1","instruction":"For each question, choose the correct answer.","material":[…],"questions":[…]}],
 "source":{"pdf":"01 KET真题 - 第1套 - 阅读与写作.pdf","pdfPages":[1,2,…],"bookPages":[<printed page numbers>]},
 "status":{"content":"transcribed","version":"1.0.0"}}
```
- One section per Part: `id` s1…, `part` = Part number, `label` = `"Part N"`, `instruction` = the printed instruction (both lines, joined with a space). `article.blocks` and `vocabulary` stay `[]`; `article.images` is the image registry for every `imageRef`.
- Block ids unique in the item (p1, p2…, n1…, t1…, i1…). Question `number` = printed question number (continuous from 1), `id` = `q<number>`.
- Key: `{"schemaVersion":"1.0","itemId":…,"answerSource":"official","reviewStatus":"pending","officialRef":{"pdf":"<…参考答案.pdf>","pages":[…]},"answers":{…}}`. Never `approved`.
- Book errors: transcribe as printed and list them in your report (the coordinator files `errata` issues). Do not fix them.

## Reading & Writing (32 questions; Q1–30 1 point, Q31/Q32 15 points)
| Part | how |
|---|---|
| 1 notices (6) | each question: `choice`, `prompt` = the question line if printed else `[]`, options A–C text; `material: [{"id":"i<n>","type":"imageRef","image":"img<n>"}]` with the notice/message cropped as one image (alt = its full text). The section has no `material`. |
| 2 three texts, 7 “Who…” questions | section `material` = a `heading` (person's name) + `paragraph`s per text; each question `choice` with options `A`/`B`/`C` whose content = the names (as printed in the A/B/C header). |
| 3 long text + 5 MCQ | section `material` = title `heading` + paragraphs (+ imageRef for a photo); `choice` A–C. |
| 4 multiple-choice cloze (6) | section `material` = title + paragraphs with `{"t":"blank","id":"b19","number":19}` (id = `b<question number>`); the example (0) is printed text: keep it as text, e.g. `{"t":"strong","v":"(0) "}` + the example word. Each question `inlineChoice` with `blankId`. |
| 5 open cloze (6) | material = the text(s) with blanks `b25`…; example (0) kept as printed text. Each question `textEntry` `{"blankIds":["b25"],"maxWords":1}`. Key `slots.b25.accept` = every alternative in the answer key (`but / (al)though / however` → `["but","although","though","however"]`). |
| 6 email (Q31) | `extendedText` `{"prompt":[task + bullets as text with br],"scoring":"judge","minWords":25}`, points 15. Put a printed email/note in the question `material` (note block); otherwise no material. |
| 7 picture story (Q32) | `extendedText` minWords 35, points 15; question `material` = the 3 pictures (one image each: `imageRef` ×3, alt = what happens). |

Writing keys (Q31, Q32):
```json
{"sampleAnswer":"<Sample answer A, exactly as printed>","rubricType":"cambridge_a2_writing","match":"all",
 "keyPoints":[{"id":"content","descZh":"内容：<the task's 3 content points in Chinese>","weight":5},
              {"id":"organisation","descZh":"条理性：衔接连贯，使用连接词和衔接手段","weight":5},
              {"id":"language","descZh":"语言：词汇和语法结构的准确性与丰富性","weight":5}],
 "anchors":[{"response":"<Sample A>","score":<total printed in the book>,"noteZh":"<点评和得分 condensed, e.g. 内容5/条理性5/语言5>"},{"response":"<Sample B>","score":<book total>,"noteZh":"…"}],
 "explanationZh":"<what a full-mark answer must cover, 1–2 sentences>"}
```

## Listening (25 questions, 1 point each)
- Every section has `"audio":{"src":"assets/ket1/ket1-t<N>-p<K>.m4a","seconds":<from ket1-audio.json>}` (the file already contains both plays).
- Part 1 (5): `choice`, prompt = the question; options are pictures → crop each to `assets/ket1/ket1-t<N>-l-q<Q>-<A|B|C>.jpg`, option `{"id":"A","image":"…","content":[{"t":"text","v":"<short English description>"}]}`.
- Part 2 (5): notes/form completion. Section `material` = the form as a `note` (title + lines) or `table` with blanks `b6`…`b10` (`number` = question number). Each question `textEntry` `{"blankIds":["b6"]}`. Accept every alternative (`25(th) June / June 25(th)` → `["25 June","25th June","June 25","June 25th"]`; numbers as digits).
- Parts 3, 4: `choice` A–C text (Part 4 prompt includes the printed context sentence).
- Part 5 (5): one `choice` per person (Q21–25), prompt = the person's name, options = the 8 lettered items A–H (same list in every question). The printed example (0) stays as section `material` text: e.g. `{"t":"strong","v":"Example: 0 Jack — B"}` as printed.
- **Transcripts** go only in the key: `"transcripts":{"s1":[blocks]}` — per section, `dialogue` blocks (`speaker` as printed: Girl/Boy/Man/Woman/names; one turn per line) plus `paragraph` for the italic narrator lines (`{"t":"em",…}`). Leave out "[repeat]" lines and the "Now listen again" lines. Block ids unique within the key's transcripts (`x1`, `x2`…).
- `explanationZh`: condense the answer book's 中文详解 (正确答案…选项 A 不正确…) to 1–3 sentences; `evidence` is not used for listening.

## Speaking (2 questions × 15 points)
- q1 = Part 1, q2 = Part 2. `{"kind":"speaking","prompt":[<what the learner does, in English>],"turns":[{"id":"t1","text":"<one examiner line>"}…],"maxSeconds":30,"scoring":"judge"}`.
- Use the questions the examiner asks **Candidate A** (the learner plays Candidate A); keep only lines the learner answers (questions), merge a lead-in sentence into the next question. Part 2 visual prompts: crop the picture sheet into the question `material` (imageRef); the discussion questions and the examiner's follow-up questions become turns. Part 2 `maxSeconds` 45.
- Keys (`answerSource: "generated"` — the answer book has no speaking answers):
```json
{"sampleAnswer":"<a short model answer at A2 for the turns, written by you>","rubricType":"cambridge_a2_speaking","match":"all",
 "keyPoints":[{"id":"grammar_vocabulary","descZh":"语法与词汇：简单语法结构的掌握，日常话题词汇的运用","weight":5},
              {"id":"interactive_communication","descZh":"互动交流：回答切题，内容充分，能延展回答","weight":5},
              {"id":"global","descZh":"整体表现：能用简单的语言完成交流任务","weight":5}],
 "explanationZh":"<what a good answer does>"}
```
  Pronunciation cannot be judged from a transcript; it is shown as “未评估” and not scored.

## Images
`swift scripts/crop.swift <page.jpg> content/assets/ket1/<name>.jpg x y w h` (fractions of the page; inside the frame, no border), then set `w`/`h` from `sips -g pixelWidth -g pixelHeight`. Crop on the 1600-px page images; one look at the page is enough to estimate the box — check the crop once.

## Done = 
`npm run validate -- ket1-t<N>-rw ket1-t<N>-l ket1-t<N>-s` → 0 errors, then `npx tsx scripts/check-exam.ts <N> ket1` (answer letters vs answer book) → 0 mismatches. Report: files written, book errors found, anything uncertain.
