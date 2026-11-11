import type { ReactNode } from 'react';
import './PageHeader.css';

/**
 * RC/Common/PageHeader (proposed, #138): the home page title + the card grid below it (screens 0.01 / 0.02).
 * Variants: Locale zh-CN / en-US (the title text comes from i18next). `status` sits between the title and the grid
 * (load error, Loading); `filters` (#149: the 全部 / 最近在读 / 已完成 row) sits right under the title. Keeps the classes `.page-title` / `.playlist-grid` that e2e selects.
 */
export function PageHeader({ title, filters, status, children }: { title: ReactNode; filters?: ReactNode; status?: ReactNode; children?: ReactNode }) {
  return (
    <>
      <h1 className="page-title">{title}</h1>
      {filters}
      {status}
      <div className="playlist-grid">{children}</div>
    </>
  );
}
