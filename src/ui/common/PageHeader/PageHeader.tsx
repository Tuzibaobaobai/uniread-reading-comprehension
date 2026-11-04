import type { ReactNode } from 'react';
import './PageHeader.css';

/**
 * RC/Common/PageHeader (proposed, #138): the home page title + the card grid below it (screens 0.01 / 0.02).
 * Variants: Locale zh-CN / en-US (the title text comes from i18next). `status` sits between the title and the grid
 * (load error, Loading). Keeps the classes `.page-title` / `.playlist-grid` that e2e selects.
 */
export function PageHeader({ title, status, children }: { title: ReactNode; status?: ReactNode; children?: ReactNode }) {
  return (
    <>
      <h1 className="page-title">{title}</h1>
      {status}
      <div className="playlist-grid">{children}</div>
    </>
  );
}
