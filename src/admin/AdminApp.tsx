/**
 * BUTTERFLY — Admin Studio Main Application Component
 * Independent local content editor with persistent storage, full preview,
 * media library, sticker manipulation, export/import, and zero backend dependencies.
 */

import React, { useState, useRef } from 'react';
import { useButterflyContent } from '../services/content/useButterflyContent';
import { exportContentPackage, importContentPackage } from '../services/content/contentStorage';
import {
  exportProductionZipPackage,
  publishDirectlyToProject,
  type PublishResult,
} from '../services/content/productionPublisher';
import { Dashboard } from './components/Dashboard';
import { ScrapbookEditor } from './components/ScrapbookEditor/ScrapbookEditor';
import { FinalPageEditor } from './components/FinalPageEditor/FinalPageEditor';
import { MediaLibrary } from './components/MediaLibrary/MediaLibrary';
import { AudioLibrary } from './components/AudioLibrary/AudioLibrary';
import { VisitorTracking } from './components/VisitorTracking/VisitorTracking';
import { LivePreview } from './components/LivePreview/LivePreview';
import styles from './Admin.module.css';

type AdminView = 'dashboard' | 'scrapbook' | 'final' | 'media' | 'audio' | 'tracking' | 'preview';

export const AdminApp: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'saving' | 'published' | 'failed'>('idle');
  const [publishResultModal, setPublishResultModal] = useState<PublishResult | null>(null);
  const [lastPublishedTime, setLastPublishedTime] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('butterfly_last_published_time');
    return raw ? parseInt(raw, 10) : null;
  });
  const importFileRef = useRef<HTMLInputElement>(null);

  const {
    content,
    updateContent,
    save,
    reset,
    hasUnsavedChanges,
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

  const handlePublishToProject = async () => {
    save();
    setIsPublishing(true);
    setPublishStatus('saving');

    try {
      const res = await publishDirectlyToProject(content);
      setIsPublishing(false);
      setPublishStatus('published');
      const now = Date.now();
      setLastPublishedTime(now);
      localStorage.setItem('butterfly_last_published_time', now.toString());
      setPublishResultModal(res);
      showToast('🚀 Published successfully to project! Ready for GitHub build.');
    } catch (err: any) {
      console.error('[AdminApp] Publishing failed', err);
      setIsPublishing(false);
      setPublishStatus('failed');
      showToast(`❌ Publication failed: ${err.message || 'Please check terminal'}`);
      setPublishResultModal({
        success: false,
        timestamp: Date.now(),
        mediaCount: 0,
        audioCount: 0,
        warnings: [],
        error: err.message || String(err),
      });
    }
  };

  const handleExportProductionZip = async () => {
    try {
      save();
      showToast('⏳ Generating production ZIP archive with all media...');
      const res = await exportProductionZipPackage(content);
      showToast(`📦 Downloaded ZIP: ${res.mediaCount} media, ${res.audioCount} songs!`);
    } catch (err: any) {
      console.error('[AdminApp] Export ZIP failed', err);
      showToast('❌ Export ZIP failed. Please check browser console.');
    }
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
                hasUnsavedChanges
                  ? styles.statusDotUnsaved
                  : publishStatus === 'saving'
                  ? styles.statusDotUnsaved
                  : ''
              }`}
              style={{
                background:
                  publishStatus === 'published'
                    ? '#4ade80'
                    : publishStatus === 'failed'
                    ? '#f87171'
                    : undefined,
              }}
            />
            <span>
              {isPublishing
                ? 'Publishing to Project...'
                : publishStatus === 'published'
                ? 'Published to Project ✓'
                : publishStatus === 'failed'
                ? 'Publication Failed ✕'
                : hasUnsavedChanges
                ? 'Unsaved changes (Draft cached)'
                : lastPublishedTime
                ? `Published (${new Date(lastPublishedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
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
            title="Export content package JSON"
          >
            📤 Export JSON
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleManualSave}
            title="Save changes to local browser storage"
          >
            💾 Save Local
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExportProductionZip}
            title="Export complete standalone production ZIP with media & songs"
          >
            📦 Export ZIP
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handlePublishToProject}
            disabled={isPublishing}
            title="Transfer edited text, songs, and media directly into project assets"
          >
            {isPublishing ? 'Publishing...' : '🚀 Publish to Project'}
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
                activeView === 'tracking' ? styles.navItemActive : ''
              }`}
              onClick={() => setActiveView('tracking')}
            >
              <span className={styles.navIcon}>📈</span>
              <span>Visitor Tracking</span>
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
            <Dashboard
              content={content}
              onNavigate={setActiveView}
              onPublish={handlePublishToProject}
              onExportZip={handleExportProductionZip}
              lastPublishedTime={lastPublishedTime}
              isPublishing={isPublishing}
            />
          )}

          {activeView === 'scrapbook' && (
            <ScrapbookEditor content={content} onChange={updateContent} />
          )}

          {activeView === 'final' && (
            <FinalPageEditor content={content} onChange={updateContent} />
          )}

          {activeView === 'media' && <MediaLibrary />}

          {activeView === 'audio' && (
            <AudioLibrary content={content} onChange={updateContent} />
          )}

          {activeView === 'tracking' && <VisitorTracking />}

          {activeView === 'preview' && <LivePreview content={content} />}
        </main>
      </div>

      {/* Publication Results Modal */}
      {publishResultModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setPublishResultModal(null)}
        >
          <div
            className={styles.modalContent}
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3
                className={styles.modalTitle}
                style={{
                  color: publishResultModal.success ? '#4ade80' : '#f87171',
                }}
              >
                {publishResultModal.success
                  ? '🚀 Published Successfully to Project!'
                  : '❌ Publication Failed'}
              </h3>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setPublishResultModal(null)}
              >
                ✕ Close
              </button>
            </div>

            <div className={styles.modalBody}>
              {publishResultModal.success ? (
                <div>
                  <p style={{ margin: '0 0 16px', color: 'var(--admin-text-main)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                    Your latest scrapbook changes, handwritten text, audio assignments, and proposal settings have been saved directly to project production files.
                  </p>

                  <div
                    style={{
                      background: 'rgba(30, 22, 16, 0.75)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      marginBottom: '18px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--admin-gold-primary)' }}>Updated Spreads: </strong>
                      {content.spreads.length} physical spreads (8 pages)
                    </div>
                    <div>
                      <strong style={{ color: 'var(--admin-gold-primary)' }}>Media Assets: </strong>
                      {publishResultModal.mediaCount} files written to <code>public/media/</code>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--admin-gold-primary)' }}>Audio Songs: </strong>
                      {publishResultModal.audioCount} tracks written to <code>public/audio/</code>
                    </div>
                    {publishResultModal.backupPath && (
                      <div>
                        <strong style={{ color: 'var(--admin-gold-primary)' }}>Safety Backup: </strong>
                        <code>{publishResultModal.backupPath}</code>
                      </div>
                    )}
                  </div>

                  {publishResultModal.warnings && publishResultModal.warnings.length > 0 && (
                    <div
                      style={{
                        background: 'rgba(247, 190, 88, 0.12)',
                        border: '1px solid rgba(247, 190, 88, 0.45)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '18px',
                      }}
                    >
                      <strong style={{ color: '#f7be58', fontSize: '0.86rem' }}>
                        ⚠️ Validation Warnings ({publishResultModal.warnings.length})
                      </strong>
                      <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '0.80rem', color: 'var(--admin-text-muted)' }}>
                        {publishResultModal.warnings.map((w, idx) => (
                          <li key={idx}>
                            <strong>{w.field}:</strong> {w.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      To Deploy to Live GitHub Pages Website:
                    </span>
                    <pre
                      style={{
                        background: '#0d0704',
                        border: '1px solid rgba(229, 189, 117, 0.3)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        margin: '8px 0 0',
                        fontSize: '0.82rem',
                        color: '#fef0d5',
                        overflowX: 'auto',
                      }}
                    >
{`npm run build
git add .
git commit -m "Publish updated scrapbook content and music"
git push origin main`}
                    </pre>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#f87171' }}>
                  <p style={{ margin: '0 0 12px' }}>
                    An error occurred while publishing to the project files:
                  </p>
                  <pre
                    style={{
                      background: '#1a0b0b',
                      border: '1px solid #7f1d1d',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.82rem',
                    }}
                  >
                    {publishResultModal.error || 'Unknown error. Check terminal logs.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
