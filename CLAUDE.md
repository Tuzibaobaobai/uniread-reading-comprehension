# Project conventions

UniRead reading-comprehension app. Start with docs/00-overview.md.

## Source of truth
- Data structure: `schema/index.ts` (zod). Change it only deliberately; bump `SCHEMA_VERSION` for breaking changes and update docs/03-data-model.md.
- Transcription rules: docs/04-content-pipeline.md — follow exactly when creating or editing anything in `content/`.
- UI: structure/behaviour in docs/05-ui-spec.md; visuals come only from the Figma design system (docs/design/figma-registry.md). Docs never state visual values; code uses only tokens from `src/styles/tokens.css` (no colour/size literals in components).

## Content
- Item ids `<playlist>-w<NN>-<mon..fri>` are permanent. Questions `q<n>` numbered continuously per item; blanks `b<n>`.
- Answers live only in `content/playlists/<pl>/keys/` — never inline them in items.
- Every content change must pass `npm run validate -- <itemId>` with 0 errors; then `npm run build:index`.
- Page images for transcription: `.work/pages/<playlist>/p###.jpg` (regenerate with scripts/render.swift if missing). Book page N = p(N+9) for ci-g3, p(N+8) for ci-xsc.

## Code
- React 18 + TS + Vite. Grading is pure (`src/lib/grading.ts`) so it can run server-side. Constructed responses are scored by an LLM judge (`src/lib/judge.ts`, docs/09); keys/rubrics stay server-side: grading and keys are served by `/api/rc/grade` and `/api/rc/judge` (server/*.ts — Vercel functions; Vite middleware in dev/preview), and keys are stripped from the static build.
- Components depend on `ContentProvider` / `AttemptStore` interfaces (docs/06), not on fetch/localStorage directly.
- Interactions must work by tap/click alone (no drag-only), targets ≥ 44px, inputs ≥ 16px font, no native <select>.

## Workflow
- Verify every change locally (dev server, build, test, e2e). Never `git push` or deploy to Vercel without the user's explicit confirmation.

## Commands
npm run dev · npm run validate · npm run build:index · npm test · npm run build · npm run e2e · npm run deploy (Vercel prebuilt + judge function; only after the user confirms)
