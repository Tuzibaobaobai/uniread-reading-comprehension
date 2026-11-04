import playIcon from '@/assets/icons/audio-play.svg';
import pauseIcon from '@/assets/icons/audio-pause.svg';
import './PlayButton.css';

/**
 * UniRead UIkit-Read · btn-play (3221:7265), extended (design-system/components.registry.json `ui/PlayButton`).
 * Variants: Size entry (round audio button for a headword or an example; `inline` sits in a line of text) / player
 * (the 真题 recording player's play · pause button, class .player-btn); Playing no / yes (yes → btn-pause 9271:35589).
 */
export function PlayButton({
  label,
  onPlay,
  inline = false,
  size = 'entry',
  playing = false,
}: {
  label: string;
  onPlay: () => void;
  inline?: boolean;
  size?: 'entry' | 'player';
  playing?: boolean;
}) {
  if (size === 'player')
    return (
      <button type="button" className={`player-btn${playing ? ' is-playing' : ''}`} onClick={onPlay} aria-label={label}>
        <img src={playing ? pauseIcon : playIcon} alt="" width={44} height={44} />
      </button>
    );
  return (
    <button type="button" className={`entry-play${inline ? ' is-small' : ''}`} onClick={onPlay} aria-label={label}>
      <img src={playing ? pauseIcon : playIcon} alt="" />
    </button>
  );
}
