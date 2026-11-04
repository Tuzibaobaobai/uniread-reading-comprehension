/**
 * Design tokens → CSS (stage 1, docs/14 §15): design-system/tokens/*.tokens.json → src/styles/uniread-tokens.css.
 * Every visual value the UI uses comes from here as a `--ur-*` custom property; nothing in src/ may hard-code one.
 *
 *   npx tsx scripts/ds-build.ts          (after scripts/ds-sync.ts)
 *
 * Names: the Figma path, lower-cased, non-alphanumerics → "-":
 *   variables  color/brand/6 → --ur-color-brand-6 · radius/m → --ur-radius-m · max width → --ur-max-width
 *   paint      Customization/Grey/13(text) → --ur-paint-customization-grey-13-text
 *   text       Font system/S/regular → --ur-text-font-system-s-regular (font shorthand) + -size / -line-height / -weight
 *   effect     drop-shadow/btn-xs → --ur-effect-drop-shadow-btn-xs (box-shadow value)
 *   proposed   (rc-proposed.tokens.json) color/text/primary → --ur-color-text-primary, marked "proposed" in a comment
 * Also writes design-system/tokens/names.json (every generated name → its Figma path and status) for ds-check.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

type Token = { $type: string; $value: unknown; $extensions?: { figma?: Record<string, unknown>; rc?: Record<string, unknown> } };
const isToken = (o: unknown): o is Token => !!o && typeof o === 'object' && '$type' in (o as object);

export const slug = (parts: string[]) =>
  parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function walk(tree: Record<string, unknown>, path: string[], out: [string[], Token][]) {
  for (const [k, v] of Object.entries(tree)) {
    if (k.startsWith('$')) continue;
    if (isToken(v)) out.push([[...path, k], v]);
    else if (v && typeof v === 'object' && !Array.isArray(v)) walk(v as Record<string, unknown>, [...path, k], out);
  }
}

const gradient = (stops: { position: number; hex: string; alpha: number }[]) =>
  // the snapshot does not record the direction: horizontal, as the design-system document previews it
  `linear-gradient(90deg, ${stops.map((s) => `${hexA(s.hex, s.alpha)} ${s.position}%`).join(', ')})`;
const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${+a.toFixed(3)})`;
};

export function build(tokenFiles: { file: string; status: 'uniread' | 'proposed' }[]) {
  const lines: string[] = [];
  const names: Record<string, { figma: string; group: string; status: string }> = {};
  const add = (name: string, value: string, figma: string, group: string, status: string, note = '') => {
    if (names[name]) throw new Error(`token name collision: ${name} (${figma} and ${names[name].figma})`);
    names[name] = { figma, group, status };
    lines.push(`  ${name}: ${value};${note ? ` /* ${note} */` : ''}`);
  };
  for (const { file, status } of tokenFiles) {
    const tree = JSON.parse(readFileSync(file, 'utf8')) as Record<string, Record<string, unknown>>;
    for (const group of ['variables', 'paint', 'text', 'effect']) {
      if (!tree[group]) continue;
      const list: [string[], Token][] = [];
      walk(tree[group], [], list);
      lines.push('', `  /* ---- ${status === 'proposed' ? 'RC proposed (pending UniRead approval)' : 'UniRead'} · ${group} */`);
      for (const [path, t] of list) {
        const figma = path.join('/');
        const tag = status === 'proposed' ? `proposed${t.$extensions?.rc?.issue ? ` ${t.$extensions.rc.issue}` : ''}` : '';
        const alias = t.$extensions?.rc?.alias as string | undefined;
        if (group === 'variables') {
          const name = `--ur-${slug(path)}`;
          const value = alias ? `var(--ur-${slug(alias.split('/'))})` : t.$type === 'string' ? (/font-family$/.test(figma) ? `"${t.$value}"` : String(t.$value)) : String(t.$value);
          add(name, value, figma, group, status, [tag, alias ? `→ ${alias}` : ''].filter(Boolean).join(' '));
        } else if (group === 'paint') {
          if (t.$type === 'empty') continue;
          const value = alias ? `var(--ur-${slug(alias.split('/'))})` : t.$type === 'gradient' ? gradient((t.$value as { stops: never }).stops) : String(t.$value);
          add(`--ur-paint-${slug(path)}`, value, figma, group, status, tag);
        } else if (group === 'text') {
          const v = t.$value as { fontFamily: string; fontWeight: number; fontSize: string; lineHeight: string };
          const base = `--ur-text-${slug(path)}`;
          const fam = (t.$extensions?.figma?.fontAlias as string | undefined) ? `var(--ur-${slug(String(t.$extensions!.figma!.fontAlias).split('/'))})` : `"${v.fontFamily}"`;
          add(`${base}-size`, v.fontSize, figma, group, status);
          add(`${base}-line-height`, v.lineHeight, figma, group, status);
          add(`${base}-weight`, String(v.fontWeight), figma, group, status);
          add(base, `${v.fontWeight} ${v.fontSize}/${v.lineHeight} ${fam}`, figma, group, status, 'font shorthand');
        } else if (group === 'effect') {
          // one or more declarations (multi-layer shadows span lines; float btn adds a backdrop blur)
          const decls = String(t.$value)
            .split(/;\s*(?=[a-z-]+:)|;\s*$/)
            .map((d) => d.trim())
            .filter(Boolean)
            .map((d) => /^([a-z-]+):\s*([\s\S]*)$/.exec(d))
            .filter((m): m is RegExpExecArray => !!m);
          for (const [, prop, value] of decls) {
            const name = `--ur-effect-${slug(path)}${prop === 'box-shadow' ? '' : `-${prop}`}`;
            add(name, value.replace(/\s+/g, ' ').replace(/;$/, ''), figma, group, status, prop === 'box-shadow' ? '' : prop);
          }
        }
      }
    }
  }
  return { css: lines.join('\n'), names };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const lock = JSON.parse(readFileSync('design-system/lock.json', 'utf8'));
  const files: { file: string; status: 'uniread' | 'proposed' }[] = [{ file: 'design-system/tokens/uniread.tokens.json', status: 'uniread' }];
  if (existsSync('design-system/tokens/rc-proposed.tokens.json')) files.push({ file: 'design-system/tokens/rc-proposed.tokens.json', status: 'proposed' });
  const { css, names } = build(files);
  writeFileSync(
    'src/styles/uniread-tokens.css',
    `/* UniRead design tokens ${lock.label} (${lock.source}, ${lock.date}) — GENERATED by scripts/ds-build.ts from design-system/tokens/.
 * Do not edit: change the design system in Figma (or a proposal in rc-proposed.tokens.json), then ds-sync + ds-build. */
:root {${css}
}
`,
  );
  writeFileSync('design-system/tokens/names.json', JSON.stringify({ label: lock.label, names }, null, 1) + '\n');
  const by = Object.values(names).reduce<Record<string, number>>((a, n) => ((a[`${n.group}/${n.status}`] = (a[`${n.group}/${n.status}`] ?? 0) + 1), a), {});
  console.log(`src/styles/uniread-tokens.css: ${Object.keys(names).length} tokens`, by);
}
