import type { ReactNode } from 'react';
import './GroupTitle.css';

/**
 * ui/GroupTitle — reuses UniRead UIKit-Ranking `group title` (13263:223981, #138): a group heading in the playlist
 * (Week N / 第 N 套 / 每日词汇). `badge` = the KET / PET test result (rc/Common/Tag). Keeps the class `.week-label`.
 */
export function GroupTitle({ children, badge }: { children: ReactNode; badge?: ReactNode }) {
  return (
    <h3 className={`week-label${badge ? ' has-badge' : ''}`}>
      {children}
      {badge}
    </h3>
  );
}
