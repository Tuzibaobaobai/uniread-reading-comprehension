# Project conventions

UniRead reading-comprehension app. Start with docs/00-overview.md.

## Source of truth
- Data structure: `schema/index.ts` (zod). Change it only deliberately; bump `SCHEMA_VERSION` for breaking changes and update docs/03-data-model.md.
- Transcription rules: docs/04-content-pipeline.md — follow exactly when creating or editing anything in `content/`.
- UI: structure/behaviour in docs/05-ui-spec.md; visuals come only from the Figma design system (docs/design/figma-registry.md). Docs never state visual values; code uses only tokens from `src/styles/tokens.css` (no colour/size literals in components).

## Content
- UniRead production rules: docs/14-agent-production-rules.md (v0.10; copy for producers in examples/agent-production/). Iron rule: the platform must reproduce RC's layout, fonts, responsiveness and interactions exactly — only data/storage/communication adapters change; capture reference screenshots with `REFERENCE=1 npx playwright test e2e/reference.spec.ts`. Every content batch ends with a handoff doc in docs/handoff/ (template docs/14-production-handoff.template.md; inventory via `npx tsx scripts/handoff-inventory.ts`). Agent review ≠ human review: keys stay `reviewStatus: pending` until a person approves; never upgrade to official/approved to pass a check.
- Item ids `<playlist>-w<NN>-<mon..fri>` are permanent. Question ids `q<n>` are permanent identities, separate from the display `number` (continuous per item): first production uses q1…qN; afterwards keep ids for the same question, give new/changed questions a never-used id, never reuse retired ids (`npx tsx scripts/id-changes.ts --base <ref>`). Blanks `b<n>`.
- Answers live only in `content/playlists/<pl>/keys/` — never inline them in items.
- Every content change must pass `npm run validate -- <itemId>` with 0 errors; then `npm run build:index`.
- Page images for transcription: `.work/pages/<playlist>/p###.jpg` (regenerate with scripts/render.swift if missing). Book page N = p(N+9) for every current book; per-book page maps live in `scripts/book-maps.mjs`.

## Code
- React 18 + TS + Vite. Grading is pure (`src/lib/grading.ts`) so it can run server-side. Constructed responses are scored by an LLM judge (`src/lib/judge.ts`, docs/09); keys/rubrics stay server-side: grading and keys are served by `/api/rc/grade` and `/api/rc/judge` (server/*.ts — Vercel functions; Vite middleware in dev/preview), and keys are stripped from the static build.
- Components depend on `ContentProvider` / `AttemptStore` interfaces (docs/06), not on fetch/localStorage directly.
- UI text (buttons, hints, aria-labels, placeholders, status/score labels) goes through i18next: `t('key')` with keys in `src/i18n/locales/zh-CN.json` + `en-US.json` (same key set; zh-CN is the default). Never hard-code UI strings; content data and judge prompts are not translated. The host switches language via `applyExamLocale` (GitHub #106); RC never listens to postMessage.
- Interactions must work by tap/click alone (no drag-only), targets ≥ 44px, inputs ≥ 16px font (both at the 1000px design width), no native <select>.
- UI style kit (`ui-style-kit/`, rules in `.claude/rules/ui-style.md`; decision GitHub #62): CSS is written in px for a 1000px design width; `postcss-mobile-forever` scales it with vw below 1000px (font sizes too) and caps it at 1000px. RC keeps its own breakpoints on top (≥ 1024px 50/50 split, < 1024px 文章 / 题目 tabs). Project exceptions to the kit: fonts and type scale come from Figma (`tokens.css`), not the kit's fonts; colours/sizes stay tokens. Full-screen shell: `body` is fixed, pages scroll in `.app-scroll` — never `100vh`/`100dvh`. Hover-only styles go in `@media (hover: hover) and (pointer: fine)`; shared animations are switched off under `prefers-reduced-motion`; text that may be truncated uses `OverflowTip`.

## Workflow
- Verify every change locally (dev server, build, test, e2e). Never `git push` or deploy to Vercel without the user's explicit confirmation.

## Commands
npm run dev · npm run validate · npm run build:index · npm test · npm run build · npm run e2e · npm run deploy (main → production; Vercel prebuilt + API functions; only after the user confirms) · npm run deploy:dev (develop → Vercel project uniread-reading-comprehension-dev for reviewing the next milestone; only after the user confirms)
