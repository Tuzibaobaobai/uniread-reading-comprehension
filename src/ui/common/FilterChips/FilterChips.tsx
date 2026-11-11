import './FilterChips.css';

export interface FilterChip<K extends string> {
  key: K;
  label: string;
  count: number;
}

/**
 * ui/FilterChips — the filter row above the home page cards: the UniRead designer's `item` (UIKit-学生-首页 18227:44282,
 * Selected 18227:44284; used in 资源列表 19917:187733, #149): S medium label + XS count at 80 %, white pill, brand-6 when
 * selected. One choice at a time (radio semantics); each pill keeps a 44 high tap area around its 32 high drawing.
 */
export function FilterChips<K extends string>({
  label,
  chips,
  value,
  onChange,
}: {
  /** accessible name of the group */
  label: string;
  chips: FilterChip<K>[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <div className="filter-chips" role="radiogroup" aria-label={label}>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          role="radio"
          aria-checked={c.key === value}
          className={`filter-chip ${c.key === value ? 'is-selected' : ''}`}
          onClick={() => onChange(c.key)}
        >
          <span className="filter-chip-label">{c.label}</span>
          <span className="filter-chip-count">{c.count}</span>
        </button>
      ))}
    </div>
  );
}
