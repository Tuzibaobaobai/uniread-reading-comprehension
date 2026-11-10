import playIcon from '@/assets/icons/audio-play.svg';
import pauseIcon from '@/assets/icons/audio-pause.svg';
import cardIcon from '@/assets/icons/scan-play.svg';
import cardHoverIcon from '@/assets/icons/scan-play-hover.svg';
import chipIcon from '@/assets/icons/entry-play.svg';
import chipHoverIcon from '@/assets/icons/entry-play-hover.svg';
import speakerIcon from '@/assets/icons/entry-speaker.svg';
import './PlayButton.css';

/**
 * UniRead UIkit-Read · btn-play (3221:7265), extended (design-system/components.registry.json `ui/PlayButton`).
 * Variants: Size entry (the headword's 28 × 28 white chip with icon-play; `inline` = the example's 24 × 24 speaker,
 * volume-high, in a line of text — both the designer's, Ready-for-dev 3.07–3.10) / player
 * (the 真题 recording player's play · pause button, class .player-btn) / card (the 速览 card's 80 × 48 button, the
 * designer's btn-play 19528:124673, class .card-play); Playing no / yes (yes → btn-pause 9271:35589).
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
  size?: 'entry' | 'player' | 'card';
  playing?: boolean;
}) {
  if (size === 'card')
    return (
      <button type="button" className={`card-play${playing ? ' is-playing' : ''}`} onClick={onPlay} aria-label={label}>
        <img className="card-play-icon" src={cardIcon} alt="" />
        <img className="card-play-icon is-hover" src={cardHoverIcon} alt="" />
      </button>
    );
  if (size === 'player')
    return (
      <button type="button" className={`player-btn${playing ? ' is-playing' : ''}`} onClick={onPlay} aria-label={label}>
        <img src={playing ? pauseIcon : playIcon} alt="" width={44} height={44} />
      </button>
    );
  return (
    <button type="button" className={`entry-play${inline ? ' is-small' : ''}`} onClick={onPlay} aria-label={label}>
      <img src={playing ? pauseIcon : inline ? speakerIcon : chipIcon} alt="" />
      {/* #144: btn-play State=Hover (19614:125149) — icon Grey/10, effect btn/btn-s */}
      {!playing && !inline && <img className="entry-play-hover" src={chipHoverIcon} alt="" />}
    </button>
  );
}
