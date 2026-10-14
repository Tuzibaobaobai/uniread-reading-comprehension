/**
 * UniRead Reading Comprehension — content & attempt schema (v1.0)
 *
 * Single source of truth for all data in content/. Interaction kinds are named after
 * 1EdTech QTI 3.0 interactions so items can later be exported to QTI.
 * See docs/03-data-model.md for field semantics and examples.
 */
import { z } from 'zod';

export const SCHEMA_VERSION = '1.0';

/* ------------------------------------------------------------------ ids */

export const PlaylistId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const ItemId = z.string().regex(/^[a-z0-9-]+-w\d{2}-(mon|tue|wed|thu|fri)$/);
export const Day = z.enum(['mon', 'tue', 'wed', 'thu', 'fri']);

/* ------------------------------------------------------------- inline */

export const BlankHint = z
  .object({
    /** first letter(s) printed before the blank, e.g. "n" in "n____" */
    firstLetter: z.string().optional(),
    /** base word printed in brackets, e.g. "(develop)" */
    baseWord: z.string().optional(),
  })
  .strict();

export const Inline: z.ZodType<InlineT> = z.lazy(() =>
  z.discriminatedUnion('t', [
    z.object({ t: z.literal('text'), v: z.string() }).strict(),
    /** italics, e.g. book or film titles */
    z.object({ t: z.literal('em'), v: z.string() }).strict(),
    /** bold text inside passage (e.g. sub-labels) */
    z.object({ t: z.literal('strong'), v: z.string() }).strict(),
    /** highlighted vocabulary word; ref → article.vocabulary[].id */
    z.object({ t: z.literal('vocab'), v: z.string(), ref: z.string().optional() }).strict(),
    /** underlined word targeted by a question (may also be vocab) */
    z.object({ t: z.literal('underline'), v: z.string(), vocab: z.string().optional() }).strict(),
    /** inline Chinese gloss, rendered "v ( zh )". v may be "" when the gloss follows a vocab node */
    z.object({ t: z.literal('gloss'), v: z.string(), zh: z.string() }).strict(),
    /** a response slot; id is unique within the item (b1, b2…) */
    z
      .object({
        t: z.literal('blank'),
        id: z.string().regex(/^b\d+[a-z]?$/),
        number: z.number().int().positive().optional(),
        hint: BlankHint.optional(),
      })
      .strict(),
    z.object({ t: z.literal('br') }).strict(),
  ]),
);

export type InlineT =
  | { t: 'text'; v: string }
  | { t: 'em'; v: string }
  | { t: 'strong'; v: string }
  | { t: 'vocab'; v: string; ref?: string }
  | { t: 'underline'; v: string; vocab?: string }
  | { t: 'gloss'; v: string; zh: string }
  | { t: 'blank'; id: string; number?: number; hint?: z.infer<typeof BlankHint> }
  | { t: 'br' };

export const Rich = z.array(Inline);

/* -------------------------------------------------------------- blocks */

const blockBase = { id: z.string().regex(/^[a-z]+\d+$/) };

export const TableCell = z
  .object({
    content: Rich,
    header: z.boolean().optional(),
    colSpan: z.number().int().positive().optional(),
    rowSpan: z.number().int().positive().optional(),
  })
  .strict();

export const Block = z.discriminatedUnion('type', [
  z.object({ ...blockBase, type: z.literal('paragraph'), content: Rich, indent: z.boolean().optional() }).strict(),
  z.object({ ...blockBase, type: z.literal('heading'), content: Rich, level: z.number().int().min(2).max(4).optional() }).strict(),
  z
    .object({ ...blockBase, type: z.literal('list'), ordered: z.boolean().optional(), items: z.array(Rich) })
    .strict(),
  z
    .object({
      ...blockBase,
      type: z.literal('dialogue'),
      /** e.g. "W: Woman  M: Man" */
      legend: z.string().optional(),
      turns: z.array(z.object({ speaker: z.string(), content: Rich }).strict()),
    })
    .strict(),
  /** note / notice / letter / advert box */
  z
    .object({
      ...blockBase,
      type: z.literal('note'),
      title: Rich.optional(),
      content: z.array(Rich),
      signature: z.array(Rich).optional(),
    })
    .strict(),
  z
    .object({
      ...blockBase,
      type: z.literal('table'),
      caption: Rich.optional(),
      rows: z.array(z.array(TableCell)),
    })
    .strict(),
  z.object({ ...blockBase, type: z.literal('imageRef'), image: z.string() }).strict(),
]);
export type BlockT = z.infer<typeof Block>;

/* ------------------------------------------------------------- article */

export const Image = z
  .object({
    id: z.string(),
    src: z.string(),
    alt: z.string(),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
    caption: z.string().optional(),
  })
  .strict();

export const VocabEntry = z
  .object({
    id: z.string().regex(/^v-[a-z0-9-]+$/),
    headword: z.string(),
    ipa: z.string().optional(),
    pos: z.string().optional(),
    meaningZh: z.string(),
  })
  .strict();

export const Article = z
  .object({
    images: z.array(Image),
    blocks: z.array(Block),
    vocabulary: z.array(VocabEntry),
  })
  .strict();

export const ItemMeta = z
  .object({
    genre: z.string(), // 语篇类型
    wordCount: z.number().int().positive(), // 词数
    difficulty: z.number().int().min(1).max(9), // 难度 N 级
    suggestedMinutes: z.number().int().positive(), // 建议用时
    themeContext: z.string(), // 主题语境
    contentRequirement: z.string().optional(), // 内容要求
    intro: z.string(), // 导语 / 导读
    hasVideo: z.boolean(), // 本篇配视频讲解课程
  })
  .strict();

/* ------------------------------------------------------- interactions */

export const Option = z
  .object({
    id: z.string().regex(/^[A-Z]$|^[TF]$/),
    content: Rich,
    image: z.string().optional(),
  })
  .strict();

export const Choice = z
  .object({
    kind: z.literal('choice'),
    variant: z.enum(['standard', 'trueFalse']).default('standard'),
    prompt: Rich,
    options: z.array(Option).min(2),
    maxChoices: z.literal(1).default(1),
  })
  .strict();

/** one blank (in passage or prompt) with its own option list — cloze, (A/B) choose-in-brackets */
export const InlineChoice = z
  .object({
    kind: z.literal('inlineChoice'),
    blankId: z.string(),
    /** prompt for blanks that live in the question rather than the passage */
    prompt: Rich.optional(),
    options: z.array(Option).min(2),
  })
  .strict();

/**
 * blank(s) filled from the section's shared bank — 选词填空 / 六选四 / 七选五 / 补全对话.
 * Usually one blank; a question sentence may contain several (key.correct is aligned with blankIds).
 * Blanks in the passage are listed in blankIds; blanks in the prompt are discovered from prompt.
 */
export const GapMatch = z
  .object({
    kind: z.literal('gapMatch'),
    blankIds: z.array(z.string()).optional(),
    prompt: Rich.optional(),
  })
  .strict();

/** typed answer into 1..n blanks — 短文填空 / 表格填空 / 句子补全 */
export const TextEntry = z
  .object({
    kind: z.literal('textEntry'),
    /** blanks in the passage/table: list their ids; blanks in the prompt are discovered from prompt */
    blankIds: z.array(z.string()).optional(),
    prompt: Rich.optional(),
    maxWords: z.number().int().positive().optional(),
  })
  .strict();

/** 连线题 — every left item gets exactly one right item */
export const Match = z
  .object({
    kind: z.literal('match'),
    prompt: Rich.optional(),
    left: z.array(z.object({ id: z.string(), content: Rich }).strict()),
    right: z.array(z.object({ id: z.string(), content: Rich, image: z.string().optional() }).strict()),
  })
  .strict();

/** 回答问题 — not auto-scored */
export const ExtendedText = z
  .object({
    kind: z.literal('extendedText'),
    prompt: Rich,
    /** sentence frame with blanks, e.g. "They felt ___ but ___." */
    scaffold: Rich.optional(),
    scoring: z.enum(['self', 'none']),
  })
  .strict();

/** reserved — not used by current books */
export const Order = z
  .object({
    kind: z.literal('order'),
    prompt: Rich.optional(),
    items: z.array(z.object({ id: z.string(), content: Rich }).strict()),
  })
  .strict();

export const Interaction = z.discriminatedUnion('kind', [
  Choice,
  InlineChoice,
  GapMatch,
  TextEntry,
  Match,
  ExtendedText,
  Order,
]);
export type InteractionT = z.infer<typeof Interaction>;

export const Skill = z.enum([
  'main_idea',
  'detail',
  'inference',
  'vocab_in_context',
  'reference',
  'attitude',
  'structure',
  'grammar',
  'calculation',
  'opinion',
]);

export const Question = z
  .object({
    id: z.string().regex(/^q\d+$/),
    /** display number, continuous across sections of one item */
    number: z.number().int().positive(),
    points: z.number().nonnegative().default(1),
    skills: z.array(Skill).default([]),
    interaction: Interaction,
  })
  .strict();
export type QuestionT = z.infer<typeof Question>;

export const BankEntry = z.object({ id: z.string().regex(/^[A-Z]$/), content: Rich }).strict();

export const Section = z
  .object({
    id: z.string().regex(/^s\d+$/),
    label: z.string().optional(), // "I", "II"
    instruction: z.string(),
    /** shared bank for gapMatch questions; each entry may be used once */
    bank: z.array(BankEntry).optional(),
    /** a table or other stimulus that belongs to the question area (e.g. 表格填空) */
    stimulus: z.array(Block).optional(),
    questions: z.array(Question).min(1),
  })
  .strict();
export type SectionT = z.infer<typeof Section>;

export const TaskTypeCode = z.enum([
  'reading_choice', // 阅读选择 / 阅读理解
  'cloze', // 完形填空
  'word_bank', // 选词填空
  'six_choose_four', // 六选四
  'seven_choose_five', // 七选五
  'matching', // 连线题
  'true_false', // 判断正误
  'answer_questions', // 回答问题
  'passage_fill', // 短文填空
  'table_fill', // 表格填空
  'dialogue_completion', // 补全对话
  'weekly_intensive', // 每周精读
]);

export const Errata = z
  .object({ original: z.string(), corrected: z.string(), note: z.string().optional() })
  .strict();

export const Item = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: ItemId,
    playlistId: PlaylistId,
    order: z.number().int().positive(),
    week: z.number().int().positive(),
    day: Day,
    title: z.string(),
    titleZh: z.string().optional(),
    displayName: z.string(),
    taskType: z.object({ code: TaskTypeCode, labelZh: z.string() }).strict(),
    meta: ItemMeta,
    thumbnail: z.string().optional(),
    article: Article,
    sections: z.array(Section).min(1),
    media: z.object({ audio: z.string().optional(), video: z.string().optional() }).strict().optional(),
    errata: z.array(Errata).optional(),
    source: z
      .object({ pdf: z.string(), pdfPages: z.array(z.number().int()), bookPages: z.array(z.number().int()) })
      .strict(),
    status: z
      .object({ content: z.enum(['transcribed', 'reviewed']), version: z.string() })
      .strict(),
  })
  .strict();
export type ItemT = z.infer<typeof Item>;

/* --------------------------------------------------------------- keys */

export const Evidence = z.object({ block: z.string(), quote: z.string() }).strict();

const answerCommon = {
  explanationZh: z.string().optional(),
  evidence: z.array(Evidence).optional(),
};

export const SlotKey = z
  .object({
    /** accepted answers, compared after normalisation */
    accept: z.array(z.string()).min(1),
    caseSensitive: z.boolean().optional(),
  })
  .strict();

export const AnswerKey = z.union([
  /** choice / inlineChoice → [optionId]; gapMatch → bank ids aligned with the question's blanks */
  z.object({ ...answerCommon, correct: z.array(z.string()).min(1) }).strict(),
  /** textEntry: one entry per blank id */
  z.object({ ...answerCommon, slots: z.record(SlotKey) }).strict(),
  /** match: left id → right id */
  z.object({ ...answerCommon, pairs: z.record(z.string()) }).strict(),
  /** order */
  z.object({ ...answerCommon, sequence: z.array(z.string()) }).strict(),
  /** extendedText */
  z.object({ ...answerCommon, sampleAnswer: z.string(), rubricZh: z.string().optional() }).strict(),
]);
export type AnswerKeyT = z.infer<typeof AnswerKey>;

export const ItemKey = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    itemId: ItemId,
    answerSource: z.enum(['official', 'generated']),
    reviewStatus: z.enum(['pending', 'approved']),
    answers: z.record(AnswerKey),
  })
  .strict();
export type ItemKeyT = z.infer<typeof ItemKey>;

/* ----------------------------------------------------------- playlist */

export const Playlist = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: PlaylistId,
    title: z.string(),
    shortTitle: z.string(),
    series: z.string(),
    publisher: z.string(),
    gradeBand: z.string(),
    description: z.string(),
    locale: z.string(),
    cover: z.string(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    itemIds: z.array(ItemId),
    version: z.string(),
  })
  .strict();
export type PlaylistT = z.infer<typeof Playlist>;

/** lightweight item summary for list pages (generated by scripts/build-index.ts) */
export const ItemSummary = z
  .object({
    id: ItemId,
    order: z.number().int(),
    week: z.number().int(),
    day: Day,
    title: z.string(),
    displayName: z.string(),
    taskType: z.object({ code: TaskTypeCode, labelZh: z.string() }).strict(),
    wordCount: z.number().int(),
    difficulty: z.number().int(),
    suggestedMinutes: z.number().int(),
    questionCount: z.number().int(),
    thumbnail: z.string().optional(),
  })
  .strict();

export const Catalog = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    generatedAt: z.string(),
    playlists: z.array(
      z
        .object({
          id: PlaylistId,
          title: z.string(),
          shortTitle: z.string(),
          cover: z.string(),
          accent: z.string(),
          gradeBand: z.string(),
          description: z.string(),
          itemCount: z.number().int(),
          totalWords: z.number().int(),
          difficultyRange: z.tuple([z.number().int(), z.number().int()]),
          taskTypes: z.array(TaskTypeCode),
          items: z.array(ItemSummary),
        })
        .strict(),
    ),
  })
  .strict();
export type CatalogT = z.infer<typeof Catalog>;

/* ------------------------------------------------------------ attempt */

/** response value per question, by interaction kind */
export const ResponseValue = z.union([
  z.array(z.string()), // choice / inlineChoice → [optionId]; order → sequence
  z.record(z.string()), // gapMatch → {blankId: bankId}; textEntry → {blankId: text}; match → {leftId: rightId}
  z.string(), // extendedText
]);

export const Attempt = z
  .object({
    attemptId: z.string(),
    itemId: ItemId,
    itemVersion: z.string(),
    learnerId: z.string().nullable(),
    startedAt: z.string(),
    submittedAt: z.string().nullable(),
    durationSec: z.number().nonnegative(),
    status: z.enum(['in_progress', 'submitted']),
    responses: z.record(ResponseValue),
    result: z
      .object({
        score: z.number(),
        maxScore: z.number(),
        byQuestion: z.array(
          z
            .object({
              q: z.string(),
              correct: z.boolean().nullable(), // null = not auto-scored
              points: z.number(),
              maxPoints: z.number(),
              /** per-blank / per-pair correctness for multi-slot questions */
              parts: z.record(z.boolean()).optional(),
            })
            .strict(),
        ),
        selfAssessed: z.record(z.boolean()).optional(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type AttemptT = z.infer<typeof Attempt>;
