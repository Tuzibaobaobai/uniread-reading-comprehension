import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
// self-hosted: Google Fonts is unreliable for users in mainland China
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/500.css';
import '@fontsource/source-sans-3/700.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import './styles/global.css';
import './styles/app.css';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { ReaderPage } from './reader/ReaderPage';
import { clearAllLocal } from './lib/storage';

/** development only: http://localhost:5173/#/reset clears all saved answers, then goes home */
function Reset() {
  if (import.meta.env.DEV) console.info(`cleared ${clearAllLocal()} saved entries`);
  return <Navigate to="/" replace />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* hash routing keeps the static build deployable anywhere (no server rewrites) */}
    <HashRouter>
      <div className="app-scroll">
      <Routes>
        <Route path="/" element={<PlaylistsPage />} />
        <Route path="/p/:playlistId" element={<PlaylistPage />} />
        <Route path="/p/:playlistId/:itemId" element={<ReaderPage />} />
        {import.meta.env.DEV && <Route path="/reset" element={<Reset />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </HashRouter>
  </StrictMode>,
);
