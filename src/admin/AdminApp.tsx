/**
 * BUTTERFLY — Admin Studio Main Application Component
 * Independent local content editor with persistent storage, full preview,
 * media library, sticker manipulation, export/import, and zero backend dependencies.
 */

import React, { useState, useRef } from 'react';
import { useButterflyContent } from '../services/content/useButterflyContent';
import { exportContentPackage, importContentPackage } from '../services/content/contentStorage';
import { Dashboard } from './components/Dashboard';
import { ScrapbookEditor } from './components/ScrapbookEditor/ScrapbookEditor';
import { FinalPageEditor } from './components/FinalPageEditor/FinalPageEditor';
import { MediaLibrary } from './components/MediaLibrary/MediaLibrary';
import { AudioLibrary } from './components/AudioLibrary/AudioLibrary';
import { LivePreview } from './components/LivePreview/LivePreview';
import styles from './Admin.module.css';

type AdminView = 'dashboard' | 'scrapbook' | 'final' | 'media' | 'audio' | 'preview';

export const AdminApp: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const {
    content,
    updateContent,
    save,
    reset,
    hasUnsavedChanges,
    isSaving,
    lastSaved,
  } = useButterflyContent(true); // Enable draft autosave

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleManualSave = () => {
    save();
    showToast('✨ All changes saved locally to IndexedDB & LocalStorage!');
  };

  const handleExport = async () => {
    try {
      const pkgJson = await exportContentPackage(content);
      const blob = new Blob([pkgJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `butterfly_content_package_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📦 Complete Content Package exported successfully!');
    } catch (err) {
      console.error('[AdminApp] Export failed', err);
      showToast('❌ Export failed. Please check browser console.');
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const text = await file.text();
        await importContentPackage(text);
        showToast('🎉 Content Package imported successfully!');
        window.location.reload();
      } catch (err) {
        console.error('[AdminApp] Import failed', err);
        showToast('❌ Invalid content package file.');
      }
      e.target.value = '';
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all pages, stickers, and proposal text to original defaults?')) {
      reset();
      showToast('↺ Restored canonical project defaults.');
    }
  };

  const handleGoToVisitor = () => {
    window.location.href = '/';
  };

  return (
    <div className={styles.adminContainer}>
      {/* Hidden File Input for Package Import */}
      <input
        ref={importFileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFileChange}
      />

      {/* Top Navigation Header */}
      <header className={styles.adminHeader}>
        <div className={styles.brandGroup}>
          <div className={styles.brandLogo}>
            <span>🦋</span>
            <span>BUTTERFLY</span>
          </div>
          <span className={styles.brandBadge}>Studio Admin</span>
        </div>

        <div className={styles.headerActions}>
          {/* Status Indicator */}
          <div className={styles.statusIndicator}>
            <span
              className={`${styles.statusDot} ${
                hasUnsavedChanges ? styles.statusDotUnsaved : ''
              }`}
            />
            <span>
              {isSaving
                ? 'Saving...'
                : hasUnsavedChanges
                ? 'Unsaved changes (Draft cached)'
                : lastSaved
                ? `Saved (${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                : 'All changes saved'}
            </span>
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => importFileRef.current?.click()}
            title="Import previously saved content package"
          >
            📥 Import
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExport}
            title="Export complete package with all media"
          >
            📤 Export
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleManualSave}
          >
            💾 Save Changes
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleGoToVisitor}
            style={{
              background: 'rgba(229, 189, 117, 0.12)',
              borderColor: 'var(--admin-gold-primary)',
              color: 'var(--admin-gold-bright)',
            }}
          >
            👁️ Visitor View →
          </button>
        </div>
      </header>

      {/* Main Studio Body: Sidebar + Active View */}
      <div className={styles.adminBody}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar}>
          <nav className={styles.navSection}>
            <span className={styles.navSectionTitle}>Studio Navigation</span>

            <button
              type="button"
              className={`${styles.navItem} ${
                activeView === 'dashboard' ? styles.navItemActive : ''
              }`}
              onClick={() => setActiveView('dashboard')}
            >
              <span className={styles.navIcon}>📊</span>
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                activeView === 'scrapbook' ? styles.navItemActive : ''
              }`}
              onClick={() => setActiveView('scrapbook')}
            >
              <span className={styles.navIcon}>📖</span>
              <span>Scrapbook Pages</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                activeView === 'final' ? styles.navItemActive : ''
              }`}
              onClick={() => setActiveView('final')}
            >
              <span className={styles.navIcon}>🚀</span>
              <span>Final Proposal</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                activeView === 'media' ? styles.navItemActive : ''
              }`}
              onClick={() => setActiveView('media')}
            >
              <span className={styles.navIcon}>🖼️</span>
              <span>Media Library</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                activeView === 'audio' ? styles.navItemActive : ''
              }`}
              onClick={() => setActiveView('audio')}
            >
              <span className={styles.navIcon}>🎵</span>
              <span>Audio Library</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                activeView === 'preview' ? styles.navItemActive : ''
              }`}
              onClick={() => setActiveView('preview')}
            >
              <span className={styles.navIcon}>✨</span>
              <span>Live 3D Preview</span>
            </button>
          </nav>

          {/* Footer Reset Action */}
          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '16px' }}>
            <button
              type="button"
              className={styles.btnDanger}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleReset}
            >
              ↺ Reset to Defaults
            </button>
          </div>
        </aside>

        {/* Center Panel */}
        <main className={styles.mainPanel}>
          {activeView === 'dashboard' && (
            <Dashboard content={content} onNavigate={setActiveView} />
          )}

          {activeView === 'scrapbook' && (
            <ScrapbookEditor content={content} onChange={updateContent} />
          )}

          {activeView === 'final' && (
            <FinalPageEditor content={content} onChange={updateContent} />
          )}

          {activeView === 'media' && <MediaLibrary />}

          {activeView === 'audio' && <AudioLibrary />}

          {activeView === 'preview' && <LivePreview content={content} />}
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(28, 20, 14, 0.95)',
            border: '1px solid var(--admin-gold-primary)',
            color: 'var(--admin-gold-bright)',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontSize: '0.88rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
