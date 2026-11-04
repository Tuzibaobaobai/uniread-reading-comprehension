import type { ReactNode } from 'react';
import './SegmentedTabs.css';

export interface SegmentedTab<T extends string> {
  id: T;
  label: ReactNode;
}

/**
 * ui/SegmentedTabs — reuses UniRead UIKit-Ranking `tab item` (13237:101204, issue #138): the two-way switch on a grey
 * track, e.g. the 文章 / 题目 tabs of the reader below 1024px (the page decides when it is shown).
 * Variant State Default / Selected per tab. role tablist / tab with aria-selected; `className` keeps page hooks
 * (.reader-tabs).
 */
export function SegmentedTabs<T extends string>({ tabs, value, onChange, className = '' }: { tabs: SegmentedTab<T>[]; value: T; onChange: (id: T) => void; className?: string }) {
  return (
    <div className={['segmented-tabs', className].filter(Boolean).join(' ')} role="tablist">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" role="tab" aria-selected={tab.id === value} className={tab.id === value ? 'is-active' : ''} onClick={() => onChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
