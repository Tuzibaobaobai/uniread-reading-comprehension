/**
 * Design-system compliance gate (docs/14 §15), run by `npm test` (scripts/ds-check.test.ts).
 *
 *   npx tsx scripts/ds-check.ts            report
 *   npx tsx scripts/ds-check.ts --update   accept the current counts as the new baseline (only after migrating, never to hide new literals)
 *
 * Hard failures:
 *   - a var(--ur-…) that the pinned design-system version does not define (design-system/tokens/names.json)
 *   - a font-family that is not a var(…)
 * Ratchet (design-system/check-baseline.json): per file, the number of hard-coded colours (#hex, rgb(), hsl()) and of
 * literal values left in the legacy token layer (src/styles/tokens.css) may only go down. New code cannot add any;
 * existing ones are migrated to --ur-* tokens or to an approved proposal and the baseline is lowered with --update.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const GENERATED = new Set(['src/styles/uniread-tokens.css']);
const LEGACY = 'src/styles/tokens.css';
const BASELINE = 'design-system/check-baseline.json';
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g;

const stripComments = (s: string, css: boolean) =>
  css ? s.replace(/\/\*[\s\S]*?\*\//g, '') : s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

export function check(root = '.') {
  const names = new Set(Object.keys(JSON.parse(readFileSync(`${root}/design-system/tokens/names.json`, 'utf8')).names));
  const files = globSync('src/**/*.{css,tsx,ts}', { cwd: root }).filter((f) => !GENERATED.has(f) && !/\.test\.tsx?$/.test(f));
  const errors: string[] = [];
  const counts: Record<string, { colors: number; legacyLiterals?: number }> = {};
  for (const f of files) {
    const css = f.endsWith('.css');
    const text = stripComments(readFileSync(`${root}/${f}`, 'utf8'), css);
    for (const m of text.matchAll(/var\(\s*(--ur-[a-z0-9-]+)/g)) if (!names.has(m[1])) errors.push(`${f}: ${m[1]} is not a token of the pinned design system`);
    if (css)
      // @font-face declares a family name; everywhere else the family must come from a token
      for (const m of text.replace(/@font-face\s*{[^}]*}/g, '').matchAll(/font-family:\s*([^;}]+)/g)) if (!/^var\(/.test(m[1].trim()) && !/^inherit|^initial/.test(m[1].trim())) errors.push(`${f}: font-family "${m[1].trim()}" must be a token`);
    // src/ui: the component library speaks only the design system — --ur-* tokens, no px / colour literals, no legacy names
    if (f.startsWith('src/ui/') && css) {
      for (const m of text.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) if (!m[1].startsWith('--ur-')) errors.push(`${f}: ${m[1]} — components use --ur-* tokens only`);
      for (const m of text.matchAll(/(?<![\w.-])(\d*\.?\d+)px\b/g)) if (Number(m[1]) !== 0) errors.push(`${f}: ${m[1]}px — use a --ur-* size / space token`);
    }
    // svg markup / data URIs in .tsx carry their own colours only through currentColor; anything else counts
    const colors = (text.match(COLOR) ?? []).length;
    const entry: { colors: number; legacyLiterals?: number } = { colors };
    if (f === LEGACY) {
      // declarations whose value is not a var(): the gaps still waiting for a UniRead token
      entry.legacyLiterals = [...text.matchAll(/--[a-z0-9-]+:\s*([^;]+);/g)].filter((m) => !/var\(/.test(m[1])).length;
    }
    if (entry.colors || entry.legacyLiterals) counts[f] = entry;
  }
  const baseline: typeof counts = existsSync(`${root}/${BASELINE}`) ? JSON.parse(readFileSync(`${root}/${BASELINE}`, 'utf8')).files : {};
  for (const [f, c] of Object.entries(counts)) {
    const b = baseline[f] ?? { colors: 0, legacyLiterals: 0 };
    if (c.colors > b.colors) errors.push(`${f}: ${c.colors} hard-coded colours (baseline ${b.colors}) — use a --ur-* token`);
    if ((c.legacyLiterals ?? 0) > (b.legacyLiterals ?? 0)) errors.push(`${f}: ${c.legacyLiterals} literal legacy tokens (baseline ${b.legacyLiterals ?? 0}) — alias a --ur-* token or propose one`);
  }
  // the component registry: known statuses; reuse / extend point at a component of the pinned inventory
  const inventory = new Set((JSON.parse(readFileSync(`${root}/design-system/components.inventory.json`, 'utf8')) as { nodeId: string }[]).map((c) => c.nodeId));
  const registry = JSON.parse(readFileSync(`${root}/design-system/components.registry.json`, 'utf8')) as { components: { code: string; status: string; figma?: { nodeId: string } }[] };
  const seenCode = new Set<string>();
  for (const c of registry.components) {
    if (!['reuse', 'extend', 'proposed', 'approved', 'deprecated'].includes(c.status)) errors.push(`registry ${c.code}: unknown status ${c.status}`);
    if (seenCode.has(c.code)) errors.push(`registry ${c.code}: listed twice`);
    seenCode.add(c.code);
    if (['extend', 'approved'].includes(c.status) || (c.status === 'reuse' && c.figma))
      if (!c.figma || !inventory.has(c.figma.nodeId)) errors.push(`registry ${c.code}: ${c.status} needs a figma.nodeId from components.inventory.json`);
    if (c.status === 'proposed' && !/^rc\//.test(c.code)) errors.push(`registry ${c.code}: proposed components are named rc/… (RC/… in Figma)`);
  }
  return { errors, counts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, counts } = check();
  if (process.argv.includes('--update')) {
    writeFileSync(BASELINE, JSON.stringify({ note: 'ratchet: counts may only go down (scripts/ds-check.ts)', files: counts }, null, 1) + '\n');
    console.log(`baseline updated: ${Object.keys(counts).length} files`);
  }
  const total = Object.values(counts).reduce((n, c) => n + c.colors + (c.legacyLiterals ?? 0), 0);
  console.log(`${total} literal(s) still to migrate in ${Object.keys(counts).length} file(s)`);
  errors.forEach((e) => console.log('ERROR', e));
  process.exit(errors.length && !process.argv.includes('--update') ? 1 : 0);
}
