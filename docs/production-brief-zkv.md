# Production brief — 中考考纲词汇天天练 (`zkv`, GitHub #110) · token-lean

Transcribe one **day** of 《2026 年上海市初中英语考纲词汇天天练》 into a `vocab-day` item + key, and every handbook entry of that day's range from 《…考纲词汇用法手册》 into the shared lexicon. Design and rules: [docs/16-vocab-day-format.md](16-vocab-day-format.md). Schema: `LexiconEntry`, `VocabDayItem`, `WordProfile`, `WordFamily`, `AnswerKey` in `schema/index.ts`. Inline nodes as in [production-brief.md](production-brief.md) ("Inline nodes").

**Delivered content (`content/playlists/ci-*`, ket*, pet*) is frozen — never touch it.**

## Inputs (prepared — do not re-render or re-OCR)
- Handbook: `.work/pages/zkv/handbook/p###.jpg`, OCR `.work/text/zkv/handbook/` (English) and `handbook-zh/` (Chinese-first; use for Chinese). Printed page N = PDF page N+7. Unit 1 words start at PDF p9; the phrase part (考纲词组) starts around PDF p266.
- Daily book: `.work/pages/zkv/daily/p###.jpg` (two-page spreads), OCR `.work/text/zkv/daily/` and `daily-zh/`. Each day is one spread; the **answer key** for all days is at the end (from about PDF p77).
- Read the OCR first; open a page image only to check layout (underlines, bold, which column), ★/▶/* marks, and lines with low confidence. OCR mixes up IPA symbols — **read IPA from the page image**.

## Lexicon entries — `content/lexicons/zkv/entries/<id>.json`
- `id` = `e-` + lower-case headword, every run of non-letters → `-` (`e-ability`, `e-help-sb-with-sth`, `e-in-time`). `lexicon: "zkv"`, `number` = the printed number (words and phrases are numbered separately), `kind` `word` | `phrase`.
- `headword` as printed (without the ★ / * / ▶ marks); `star: true` for `*`; `levelMark: true` for `▶`; `textbook: ["G7上U3"]` from the small tag beside the number; `inflections` e.g. `"（复 abilities）"`.
- `ipa`: every printed transcription, without slashes. `senses`: one per printed part of speech (`{ "pos": "n.", "zh": "能力，才能，本领" }`, keep the book's punctuation).
- `examples`: each English example sentence as Inline[] with the headword (in whatever form) as `{"t":"underline","v":"…"}` exactly where the book underlines it, plus its Chinese line as `zh`.
- Optional sections exactly as printed: `phrases` (☞ 常用词组), `wordFamily` (☞ 词形拓展: `{word,pos,zh}`), `synonyms` (近义), `antonyms` (反义), `proverbs` (谚语 `{en, zh}`), `tip` (名师点拨 box → `paragraph` blocks).
- `source` `{pdf:"1. 26年初中英语考纲词汇用法手册（最新版）370页.pdf", pdfPages, bookPages}`; `status {content:"transcribed", version:"1.0.0"}`. Leave `audio` out (generated later).

## Day item — `content/playlists/zkv/items/zkv-dNN.json`
```jsonc
{ "schemaVersion":"1.0", "format":"vocab-day", "id":"zkv-d01", "playlistId":"zkv", "order":1, "day":1, "unit":"words",
  "title":"第1天 ability – against", "displayName":"第1天 ability – against",
  "taskType":{"code":"vocab_day","labelZh":"词汇天天练"},
  "wordRange":{"from":"e-ability","to":"e-against"}, "lexicon":"zkv", "entryIds":["e-ability", …, "e-against"],
  "meta":{"totalPoints":100,"suggestedMinutes":25,"passPercent":60},
  "sections":[ … ], "source":{"pdf":"3. 26年初中英语考纲词汇天天练（最新版）141页.pdf","pdfPages":[…],"bookPages":[…]},
  "status":{"content":"transcribed","version":"1.0.0"} }
```
- `entryIds`: every handbook entry from `from` to `to` in book order (phrase days: the phrase entries).
- Sections: `id` `s1`…, `label` "一"…, `instruction` = the printed heading without the percentage. Question ids `q1…qN`, `number` continuous across sections. **Points**: each section's printed percentage split equally over its questions (e.g. 二 30% over 15 questions → 2 each); totals must be 100.
- Every question has `entryRef` = the lexicon entry it practises (the entry whose headword or a form of it is the answer).
- English blanks: `{"t":"blank","id":"b<n>","number":<question number>}` (blank ids unique in the item).

**Word days (约第 1–57 天)**
| 大题 | question |
|---|---|
| 一 音标 → 词、词性、中文 | `wordProfile`: `prompt` = `[{"t":"text","v":"/ˈæksɪdənt/"}]`, `posOptions` = `["n.","v.","adj.","adv.","prep.","conj.","pron.","num."]` |
| 二 中文 → 单词 | `textEntry`, `prompt` = `[{"t":"text","v":"接受；同意 v. "},{"t":"blank","id":"b6","number":6}]` |
| 三 单词 + 词性 → 相关词 + 中文 | `wordFamily`: `base {word:"enable", pos:"v."}`, `slots` = one per printed answer line `{id:"f1", pos:"adj."}` |
| 四 适当形式填空 | `textEntry`, prompt = the sentence with the blank where printed and the bracketed word as hint: blank `"hint":{"baseWord":"cross"}` (keep "(cross)" out of the text) |
| 五 首字母填空 | `textEntry`, blank `"hint":{"firstLetter":"a"}` (remove the printed letter from the text) |
| 六 中译英 | `extendedText`: `prompt` = the Chinese sentence, `scoring:"judge"`, `requiredWord:"act"` (the bracketed word) |

**Phrase days (约第 58–70 天)**
| 大题 | question |
|---|---|
| 一 中文 → 英语词组 | `textEntry`, prompt = Chinese + blank |
| 二 选择词组译成英文填空 | section `promptBank` = the boxed Chinese phrases in printed order; each question `textEntry`, prompt = the sentence with its blank |
| 三 中译英 | as word-day 六, `requiredWord` = the bracketed phrase |

## Key — `content/playlists/zkv/keys/zkv-dNN.json`
`{"schemaVersion":"1.0","itemId":"zkv-d01","answerSource":"official","reviewStatus":"pending","officialRef":{"pdf":"3. …天天练….pdf","pages":[…]},"answers":{…}}`
- `wordProfile`: `{"word":["accident"],"pos":["n."],"zh":["事故；意外的事"], "explanationZh":"…"}` — `zh` = the key's meaning **plus** every meaning of that part of speech in the handbook entry.
- `wordFamily`: `{"forms":{"f1":{"word":["able"],"zh":["能够的；有能力的"]}, …}}` — slots answer in the key's printed order.
- `textEntry`: `{"slots":{"b6":{"accept":["accept"]}}}` — every printed alternative (`a/an` → both, `(be) able to` → with and without the bracket).
- 中译英: `{"sampleAnswer":"<first reference>","references":["…","…"],"rubricType":"translation","keyPoints":[{"id":"meaning","descZh":"意思完整准确","weight":<half of the points>},{"id":"language","descZh":"语法、拼写正确，并使用了指定词","weight":<half>}],"explanationZh":"…"}` — split "A = B" into two references.
- `explanationZh` for every question: short, simple Chinese for a 14-year-old (why this form / which rule), consistent with the handbook entry. The book has no explanations, so they are written by you: add `"explanationSource":"generated"` to the key file.

## Checks
`npm run validate -- zkv-dNN` → 0 errors (it also validates the lexicon entries). Keep book errors as printed and list them. Report: files, counts, book errors, uncertain readings (with page), anything the brief does not cover.
