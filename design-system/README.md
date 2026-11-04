# design-system/

The UniRead design system as this repo uses it (process: docs/14 §15; spec: docs/uniread-spec/design-system/).

| File | Written by | What |
| --- | --- | --- |
| `lock.json` | `scripts/ds-sync.ts` | the pinned design-system version (label, source, date, snapshot sha256 / Figma version) |
| `tokens/uniread.tokens.json` | `scripts/ds-sync.ts` | UniRead variables and paint / text / effect / grid styles (DTCG) |
| `tokens/rc-proposed.tokens.json` | by hand, stage 3 | RC's proposed semantic / spacing tokens (aliases of UniRead primitives), pending approval |
| `tokens/names.json` | `scripts/ds-build.ts` | every generated `--ur-*` name → Figma path and status (for ds-check) |
| `components.inventory.json` | `scripts/ds-sync.ts` | every UniRead component / component set with variants and node ids |
| `components.registry.json` | stage 2 mapping | our code components ↔ UniRead components, status reuse / extend / proposed / approved / deprecated |
| `check-baseline.json` | `scripts/ds-check.ts --update` | ratchet: literal counts per file, may only go down |
| `migrations/` | by hand | per version upgrade: diff and what was migrated; `legacy-tokens.md` lists today's gaps |
