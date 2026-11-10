import { Fragment } from 'react';
import arrowIcon from '@/assets/icons/breadcrumb-arrow.svg';
import './Breadcrumb.css';

export interface Crumb {
  key: string;
  label: string;
  /** an earlier level: tap to go back to it; the last crumb (the current page) has none */
  onClick?: () => void;
}

/**
 * ui/common/Breadcrumb — the designer's Breadcrumb (Figma 19752:11618, frame 3.26 词汇 · 复盘, #146): the levels as 32 high
 * pills (Grey/9, the current one Text primary) with arrow-right-01-sharp 16 between them, on white, padding 20 / 24. Placed
 * as the first row of a card it stays at the top while the card's content scrolls (it replaces the 返回成绩 button).
 */
export function Breadcrumb({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav className="breadcrumb" aria-label={label}>
      <ol className="breadcrumb-list">
        {items.map((c, i) => {
          const current = i === items.length - 1;
          return (
            <Fragment key={c.key}>
              {i > 0 && <img className="breadcrumb-arrow" src={arrowIcon} alt="" aria-hidden />}
              <li className="breadcrumb-item">
                {current || !c.onClick ? (
                  <span className={`breadcrumb-area${current ? ' is-current' : ''}`} aria-current={current ? 'page' : undefined}>
                    {c.label}
                  </span>
                ) : (
                  <button type="button" className="breadcrumb-area" onClick={c.onClick}>
                    {c.label}
                  </button>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
