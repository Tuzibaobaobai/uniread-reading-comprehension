import { Fragment, type ReactNode } from 'react';
import type { InlineT } from '@schema';

export type BlankNode = Extract<InlineT, { t: 'blank' }>;

/** render an Inline[] run; blanks are delegated so each screen decides how they look */
export function Rich({ nodes, blank }: { nodes?: InlineT[]; blank?: (n: BlankNode) => ReactNode }) {
  if (!nodes) return null;
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case 'text':
            return <Fragment key={i}>{n.v}</Fragment>;
          case 'em':
            return <em key={i}>{n.v}</em>;
          case 'strong':
            return <strong key={i}>{n.v}</strong>;
          case 'vocab':
            return (
              <span key={i} className="rt-vocab">
                {n.v}
              </span>
            );
          case 'underline':
            return (
              <span key={i} className={n.vocab ? 'rt-underline rt-vocab' : 'rt-underline'}>
                {n.v}
              </span>
            );
          case 'gloss':
            return (
              <Fragment key={i}>
                {n.v}
                <span className="rt-gloss"> ( {n.zh} )</span>
              </Fragment>
            );
          case 'blank':
            return <Fragment key={i}>{blank ? blank(n) : <span className="rt-blank-plain">{n.number ?? ''}</span>}</Fragment>;
          case 'br':
            return <br key={i} />;
          case 'callout':
            // handwritten note on a printed text (PET Writing Part 1); 待补组件 — no Figma design yet
            return (
              <span key={i} className="rt-callout" role="note" aria-label={`批注：${n.v}`}>
                {n.v}
              </span>
            );
        }
      })}
    </>
  );
}

/** plain-text form of an Inline[] (for aria labels and chips) */
export function plainText(nodes?: InlineT[]): string {
  return (nodes ?? [])
    .map((n) => (n.t === 'blank' ? '____' : n.t === 'br' ? ' ' : n.t === 'gloss' ? n.v : 'v' in n ? n.v : ''))
    .join('')
    .trim();
}
