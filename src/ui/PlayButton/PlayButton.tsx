import playIcon from '@/assets/icons/audio-play.svg';
import './PlayButton.css';

/**
 * UniRead UIkit-Read · btn-play (3221:7265), reused (design-system/components.registry.json `ui/PlayButton`).
 * Round audio button for a headword or an example; `inline` sits in a line of text.
 */
export function PlayButton({ label, onPlay, inline = false }: { label: string; onPlay: () => void; inline?: boolean }) {
  return (
    <button type="button" className={`entry-play${inline ? ' is-small' : ''}`} onClick={onPlay} aria-label={label}>
      <img src={playIcon} alt="" />
    </button>
  );
}
