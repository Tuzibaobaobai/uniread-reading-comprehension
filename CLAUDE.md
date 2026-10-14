# Project conventions

UniRead reading-comprehension app. Start with docs/00-overview.md.

## Source of truth
- Data structure: `schema/index.ts` (zod). Change it only deliberately; bump `SCHEMA_VERSION` for breaking changes and update docs/03-data-model.md.
- Transcription rules: docs/04-content-pipeline.md — follow exactly when creating or editing anything in `content/`.
- UI rules: docs/05-ui-spec.md; all visual values live in `src/styles/tokens.css` (no hard-coded colours in components).

## Content
- Item ids `<playlist>-w<NN>-<mon..fri>` are permanent. Questions `q<n>` numbered continuously per item; blanks `b<n>`.
- Answers live only in `content/playlists/<pl>/keys/` — never inline them in items.
- Every content change must pass `npm run validate -- <itemId>` with 0 errors; then `npm run build:index`.
- Page images for transcription: `.work/pages/<playlist>/p###.jpg` (regenerate with scripts/render.swift if missing). Book page N = p(N+9) for ci-g3, p(N+8) for ci-xsc.

## Code
- React 18 + TS + Vite. Grading is pure (`src/lib/grading.ts`) so it can run server-side.
- Components depend on `ContentProvider` / `AttemptStore` interfaces (docs/06), not on fetch/localStorage directly.
- Interactions must work by tap/click alone (no drag-only), targets ≥ 44px, inputs ≥ 16px font, no native <select>.

## Commands
npm run dev · npm run validate · npm run build:index · npm test · npm run build · npm run e2e
