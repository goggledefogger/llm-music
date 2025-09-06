import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { EditorPage } from './pages/EditorPage';
import { HomePage } from './pages/HomePage';
import { PatternsPage } from './pages/PatternsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <div className="main-layout">
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="editor" element={<EditorPage />} />
          <Route path="editor/:patternId" element={<EditorPage />} />
          <Route path="patterns" element={<PatternsPage />} />
          <Route path="patterns/:id" element={<EditorPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
