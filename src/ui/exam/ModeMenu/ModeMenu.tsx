import './ModeMenu.css';

export interface ModeMenuItem<K extends string = string> {
  key: K;
  label: string;
  checked: boolean;
}

/**
 * ui/exam/ModeMenu — extends UniRead UIKit-LearnNav · dropdown (6759:5518; items = LearnNav item 13054:56538)
 * (`ui/exam/ModeMenu`, issue #138; the designer's frame 2.04): the open menu of rc/Exam/ModeSelect. Variant Checked
 * no / yes (the current mode sits on a grey fill, LearnNav item Selected=yes). Tap only; role menu with menuitemradio items. Keeps .mode-select-menu / .mode-select-item.
 */
export function ModeMenu<K extends string>({ label, items, onSelect }: { label: string; items: ModeMenuItem<K>[]; onSelect: (key: K) => void }) {
  return (
    <div className="mode-select-menu" role="menu" aria-label={label}>
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          role="menuitemradio"
          aria-checked={it.checked}
          className={['mode-select-item', it.checked ? 'is-current' : ''].filter(Boolean).join(' ')}
          onClick={() => onSelect(it.key)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
