# Production brief — PET / B1 Preliminary for Schools 真题 (token-lean)

Rules for transcribing one PET test = **4 items** (Reading, Writing, Listening, Speaking — PET's Reading and Writing are separate papers). Everything not said here is as in [production-brief-ket.md](production-brief-ket.md) (inputs, images, keys, errata) and [production-brief.md](production-brief.md) ("Inline nodes", "Questions"). A finished KET example: `content/playlists/ket1/`. Schema: `ExamItem` in `schema/index.ts`.

**Delivered 时文阅读 content (`content/playlists/ci-*`) and KET content are frozen — never touch them.**

Books (playlist `<pl>`, book number `<B>`): **pet1** = 校园版真题 1, **pet2** = 校园版真题 2 (same layout as pet1), **pet3** = 校园版真题 3 (2025, separate PDFs — see "Book 3 inputs" below).

## Inputs (prepared — do not re-render or re-OCR)
- pet1 / pet2 — one PDF per test: `.work/pages/<pl>/t<N>/p###.jpg`, OCR `.work/text/<pl>/t<N>/p###.txt` (English) and `.work/text/<pl>/t<N>-zh/p###.txt` (Chinese-first, for 中文解析 / 写作点评). Typical layout (Test 1; check the running heads for other tests): Reading p1–10 · Writing p11–12 · Listening p13–18 · Speaking (examiner script) p19–22 · answer key: Reading p23 · Writing sample answers p24–29 · Listening answers + transcript p30–34 · answer key with extra explanations (中文) p35–.
- Speaking pictures (colour, pet1 / pet2): `.work/pages/<pl>/t<N>-pics/p001.jpg` (Part 2 photos 1A, 1B), `p002.jpg` (Part 3 task picture).
- Audio: `content/assets/<pl>/<pl>-t<N>-p<K>.m4a`, durations (seconds) in `.work/audio/<pl>/<pl>-audio.json`. **Missing recordings** (GitHub #101): pet2 Test 1 Part 2, Test 1 Part 4, Test 4 Part 1 — transcribe their questions anyway (the transcript is in the answer key); leave that section without `audio` and add to the item `"errata":[{"original":"（缺少听力 Part <K> 录音）","corrected":"待补充","note":"GitHub #101"}]`.
- Source PDF names (`source.pdf`): pet1 / pet2 `Test <N> 完整试卷+答案解析.pdf`; `source.pdfPages` = PDF pages, `bookPages` = printed page numbers.

## Book 3 inputs (pet3 — Cambridge 2025 English edition)
- Question paper: `.work/pages/pet3/t<N>/p###.jpg`, OCR `.work/text/pet3/t<N>/`: Reading p1–10 · Writing p11–12 · Listening p13–18 · Speaking visual materials p19–20 (Part 2 photos 1A/1B, Part 3 task picture — crop the speaking pictures from these pages).
- Answer key, writing sample answers with marks, listening answers + transcripts: `.work/pages/pet3/t<N>-key/`, OCR `.work/text/pet3/t<N>-key/`.
- Speaking examiner script: `.work/pages/pet3/t<N>-sp/`, OCR `.work/text/pet3/t<N>-sp/`.
- The scans are photographed two-page spreads: every image shows a strip of the neighbouring page at one edge, and the OCR mixes in its cut-off words (lines whose x is ≈ 0 or > 0.88). Ignore them; when a line looks broken, read the page image.
- **No 中文解析 in this book** (the "extra explanations" are in an online Resource Bank we don't have). Write every `explanationZh` yourself — simple Chinese for a 13-year-old: why the answer is right (quote the evidence from the text / transcript) and why the most tempting wrong option is wrong — and set `"explanationSource":"generated"` in each key file (answers stay `"answerSource":"official"`). Writing `anchors`: the printed sample answers with their printed subscale marks (Content / Communicative Achievement / Organisation / Language → total /20); `noteZh` = your Chinese summary of the printed examiner commentary.
- Speaking item `source.pdf` = the examiner-script PDF (pictures come from the question paper's visual-materials pages).
- Audio: all 16 recordings present. Source PDF names: `PET3 - Test <N> 完整试卷（含口语图片）.pdf` (questions), `PET3 - Test <N> 参考答案&音频文稿.pdf` (`officialRef`), `PET3 - Test <N> 口语问题参考.pdf`.

## Items (ids are permanent)
| paper | id | title / displayName | order | taskType | durationMinutes | totalMarks |
|---|---|---|---|---|---|---|
| Reading | `<pl>-t<N>-r` | `PET真题<B>-第<N>套-阅读` | 4(N−1)+1 | `exam_reading` 阅读 | 45 | 32 |
| Writing | `<pl>-t<N>-w` | `PET真题<B>-第<N>套-写作` | 4(N−1)+2 | `exam_writing` 写作 | 45 | 40 |
| Listening | `<pl>-t<N>-l` | `PET真题<B>-第<N>套-听力` | 4(N−1)+3 | `exam_listening` 听力 | 36 | 25 |
| Speaking | `<pl>-t<N>-s` | `PET真题<B>-第<N>套-口语` | 4(N−1)+4 | `exam_speaking` 口语 | 14 | 80 |

`meta.exam` = `"B1 Preliminary for Schools"`. `paper`: `reading` / `writing` / `listening` / `speaking`. One section per Part (`part`, `label: "Part N"`, printed instruction). Question numbers as printed (each paper starts at 1), `id` = `q<number>`.

## Reading (32 × 1 point)
| Part | how |
|---|---|
| 1 notices (Q1–5) | as KET R&W Part 1: question `material` = the notice image (alt = its text); `choice` A–C |
| 2 people ↔ texts (Q6–10) | `"view":"match"`. Section `intro` = the printed lead-in ("The young people below…") — it goes with the questions, not in `material` (#90). Section `material` = the 8 short texts as `note` blocks (`title` = "A Mouse House" etc.); each question: `choice`, `prompt` = the person's description (+ name), `image` = the person's photo (crop from the page into `assets/<pl>/<pl>-t<N>-r-p<K>.jpg`, register in `article.images`, alt "Photo of <name>", #91), options `A`–`H`, option content = the text's title |
| 3 long text (Q11–15) | section material = text; `choice` A–D |
| 4 gapped text (Q16–20) | section material = text with blanks `b16`…; section `bank` = the 8 sentences A–H; each question `gapMatch` `{"blankIds":["b16"]}` |
| 5 multiple-choice cloze (Q21–26) | as KET Part 4: `inlineChoice`, options A–D |
| 6 open cloze (Q27–32) | as KET Part 5: `textEntry` `maxWords: 1`; accept every printed alternative |

## Writing (2 tasks counted, 20 points each)
- Keep every printed genre layout (#96): the input email is a `note` with `"style":"email"` (`title` "EMAIL", `header` = the From / To / Subject lines, `content` = the body, `signature`); an announcement / advert is a `note` with `"style":"notice"` (`title` = the bar text, `heading` = the big centred title, one `content` line per printed line).
- **Part 1 (Q1, compulsory)**: `extendedText` `{"prompt":[the task text],"scoring":"judge","minWords":100}`, points 20. Question `material` = the input email as a `note` block (style email). The handwritten notes printed beside the email are inline callouts placed right after the words they point at: `{"t":"callout","v":"Great!"}`.
- **Part 2 (Q2 article, Q3 story — choose one)**: one section with `"choose": 1` and two `extendedText` questions (Q2, Q3), each points 20, `minWords: 100`. The article task: `prompt` = the sentence before the box ("You see this announcement…"), `stimulus` = the box as a `note` with style notice, `task` = "Write your **article**." (+ the word guidance). The story task's prompt includes the given first sentence (`em`) and "Write your **story**.".
- Keys: as KET writing, but `"rubricType":"cambridge_b1_writing"` and **four** criteria, weight 5 each:
  `content` 内容 · `communicative_achievement` 交际效果 · `organisation` 条理性 · `language` 语言 (Part 1 `content` descZh lists the 4 notes to answer). `anchors` = Sample answers A and B with their printed total (/20) and condensed 点评. `sampleAnswer` = the printed sample with the highest mark (learners see it as the reference answer).

## Listening (25 × 1 point)
- Every section `"audio":{"src":"assets/<pl>/<pl>-t<N>-p<K>.m4a","seconds":…}`; transcripts per section in the key (`transcripts`), as KET. Transcripts are plain text: leave out the answer underlines the book prints (the evidence highlight does that job).
- Part 1 (Q1–7): picture options, as KET Listening Part 1 (crop each picture `assets/<pl>/<pl>-t<N>-l-q<Q>-<A|B|C>.jpg`).
- Part 2 (Q8–13), Part 4 (Q20–25): `choice` A–C (prompt includes the context sentence). Part 4 (one long interview) gets `"view":"all"` — all questions on one page, options stacked; Part 2 (separate short conversations) stays one question per page (#86).
- Part 3 (Q14–19): note completion — section material with blanks `b14`…, `textEntry`; accept printed alternatives (`(school) hall` → `school hall`, `hall`; `11.30 / half past eleven` → also `11:30`).

## Speaking (4 Parts × 20 points — the Cambridge scale is computed from the criteria bands)
The learner is Candidate A; turns are what the learner replies to. `speaking` `{"prompt":[…],"turns":[{"id":"t1","text":"…"}],"maxSeconds":…,"scoring":"judge"}`.
- **Part 1 (q1)**: interlocutor questions to Candidate A (Phase 1 + Phase 2), `maxSeconds` 30.
- **Part 2 (q2)**: question `material` = photo 1A (`imageRef`, crop from `t<N>-pics/p001.jpg`); one turn = the examiner's instruction ("Now, I'd like you to talk about your photograph…"), `maxSeconds` 75.
- **Part 3 (q3) — with an AI partner**: question `material` = the task picture (crop `t<N>-pics/p002.jpg`, alt lists every option). Turns: the examiner's task instruction first (role examiner), then **4–6 partner lines written by you** (`"role":"partner"`), each one a natural B1 move that the learner answers: suggest an option and ask the learner's view, agree/disagree with a reason, bring in another option, ask which is best, move towards a decision. Keep them short (≤ 25 words), friendly, A2–B1 language. `maxSeconds` 45.
- **Part 4 (q4)**: the examiner's follow-up questions (as printed), `maxSeconds` 40.
- Key per question: `"rubricType":"cambridge_b1_speaking"`, criteria (weight 5): `grammar_vocabulary` 语法与词汇 · `discourse_management` 话语组织 · `interactive_communication` 互动交流 · `global` 整体表现 → weights sum to 20, so **points = 20 per question**, `totalMarks` 80. `answerSource: "generated"` (the book has no speaking answers; partner lines and model answers are written by you).

## Done =
`npm run validate -- <pl>-t<N>-r <pl>-t<N>-w <pl>-t<N>-l <pl>-t<N>-s` → 0 errors; `npx tsx scripts/check-exam.ts <N> <pl>` → 0 mismatches (Reading 32, Listening 25). Report: files, counts, book errors, uncertain readings, schema gaps.
