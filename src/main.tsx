import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
// self-hosted: Google Fonts is unreliable for users in mainland China
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/source-sans-3/700.css';
import './styles/global.css';
import './styles/app.css';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { ReaderPage } from './reader/ReaderPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* hash routing keeps the static build deployable anywhere (no server rewrites) */}
    <HashRouter>
      <Routes>
        <Route path="/" element={<PlaylistsPage />} />
        <Route path="/p/:playlistId" element={<PlaylistPage />} />
        <Route path="/p/:playlistId/:itemId" element={<ReaderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
