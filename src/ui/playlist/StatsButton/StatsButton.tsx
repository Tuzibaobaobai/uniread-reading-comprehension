import type { ButtonHTMLAttributes } from 'react';
import chartIcon from '@/assets/icons/chart-line.svg';
import './StatsButton.css';

/**
 * ui/StatsButton — reuses UniRead UIKit-Playlist `btn` (18647:274866, #150): the 56px square chart button left of 收藏 in
 * the playlist intro (button group 10091:56404). Like 收藏 it is a UniRead platform action; the host wires it.
 */
export function StatsButton({ label, className = '', ...rest }: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={['playlist-stats', className].filter(Boolean).join(' ')} aria-label={label} title={label} {...rest}>
      <img src={chartIcon} alt="" />
    </button>
  );
}
