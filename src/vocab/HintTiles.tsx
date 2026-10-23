import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 词汇天天练 hint (#110): the answer's letters (a phrase's words) shuffled, to tap in order. Tapping builds the answer in
 * the field; the field stays editable. A part answered after asking for the hint scores half.
 */
export function HintTiles({ tiles, onChange }: { tiles: string[]; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number[]>([]);
  const words = tiles.some((x) => x.length > 1);
  const set = (next: number[]) => {
    setPicked(next);
    onChange(next.map((i) => tiles[i]).join(words ? ' ' : ''));
  };
  return (
    <div className="hint-tiles" role="group" aria-label={t('vocab.hint.tiles')}>
      {tiles.map((x, i) => (
        <button key={i} type="button" className="hint-tile" disabled={picked.includes(i)} onClick={() => set([...picked, i])}>
          {x}
        </button>
      ))}
      <button type="button" className="hint-undo" disabled={!picked.length} onClick={() => set(picked.slice(0, -1))}>
        {t('vocab.hint.undo')}
      </button>
    </div>
  );
}
