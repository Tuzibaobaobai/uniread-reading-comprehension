import { ChevronLeft, ChevronRight } from '@/components/Icons';
import './ArrowButton.css';

/**
 * UniRead UiKit-Vocabulary · round arrow button (in dialog-单词预习, 12041:88652), reused
 * (design-system/components.registry.json `ui/ArrowButton`): previous / next word.
 */
export function ArrowButton({ direction, label, disabled = false, onClick }: { direction: 'prev' | 'next'; label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="scan-nav" disabled={disabled} onClick={onClick} aria-label={label}>
      {direction === 'prev' ? <ChevronLeft /> : <ChevronRight />}
    </button>
  );
}
