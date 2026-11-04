import type { ButtonHTMLAttributes } from 'react';
import starIcon from '@/assets/icons/star.svg';
import './FavoriteButton.css';

/**
 * ui/FavoriteButton — reuses UniRead UIKit-Playlist `Favorite` (18644:121797, #138): the playlist page 收藏 button
 * (star icon + label). Keeps the class `.playlist-fav`.
 */
export function FavoriteButton({ label, className = '', ...rest }: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={['playlist-fav', className].filter(Boolean).join(' ')} {...rest}>
      <img src={starIcon} alt="" /> {label}
    </button>
  );
}
