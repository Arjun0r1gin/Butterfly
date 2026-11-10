/**
 * BUTTERFLY — Admin Dashboard Overview
 * Metrics: Total pages, editable blocks, placed stickers/GIFs, last saved timestamp,
 * and quick access to Scrapbook Editor, Final Page Editor, and Media Library.
 */

import React from 'react';
import type { ButterflyContent } from '../../services/content/types';
import styles from '../Admin.module.css';

export interface DashboardProps {
  content: ButterflyContent;
  onNavigate: (view: 'dashboard' | 'scrapbook' | 'final' | 'media' | 'audio' | 'tracking' | 'preview') => void;
  onPublish?: () => void;
  onExportZip?: () => void;
  lastPublishedTime?: number | null;
  isPublishing?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  content,
  onNavigate,
  onPublish,
  onExportZip,
  lastPublishedTime,
  isPublishing = false,
}) => {
  // Compute metrics
  const totalSpreads = content.spreads.length;
  const totalPages = totalSpreads * 2;

  let totalStickers = 0;
  let totalPhotos = 0;
  let editablePagesCount = 0;

  content.spreads.forEach((sp) => {
    totalStickers += sp.leftPage.stickers.length;
    totalStickers += sp.rightPage.stickers.length;
    totalPhotos += sp.leftPage.photos.length;

    if (
      sp.leftPage.photos.length > 0 ||
      sp.leftPage.stickers.length > 0 ||
      sp.leftPage.handwrittenNotes.length > 0
    ) {
      editablePagesCount++;
    }

    if (
      sp.rightPage.chapterTitle ||
      sp.rightPage.storyParagraphs.length > 0 ||
      sp.rightPage.stickers.length > 0
    ) {
      editablePagesCount++;
    }
  });

  totalStickers += content.finalQuestion.stickers.length;

  const formatLastSaved = (ts: number) => {
    if (!ts) return 'Never saved';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 15) return 'Just now';
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
  };

  return (
    <div>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Studio Overview</h1>
        <p className={styles.dashboardSubtitle}>
          Manage your handcrafted scrapbook memories, interactive stickers, animated GIFs, and proposal question.
        </p>
      </div>

      {/* 4 Core Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Scrapbook Pages</span>
          <span className={styles.metricValue}>{totalPages}</span>
          <span className={styles.metricDetail}>{totalSpreads} physical spreads</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Pages with Content</span>
          <span className={styles.metricValue}>{editablePagesCount}</span>
          <span className={styles.metricDetail}>{totalPhotos} polaroid memories</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Stickers & GIFs</span>
          <span className={styles.metricValue}>{totalStickers}</span>
          <span className={styles.metricDetail}>
            {content.mediaAssets.length} library assets ({content.mediaAssets.filter((a) => a.isGif).length} GIFs)
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Last Saved Time</span>
          <span className={styles.metricValue} style={{ fontSize: '1.45rem', marginTop: '10px' }}>
            {formatLastSaved(content.lastSaved)}
          </span>
          <span className={styles.metricDetail}>Persistent in IndexedDB & LocalStorage</span>
        </div>
      </div>

      {/* Production Deployment & Publishing Status Panel */}
      <div
        style={{
          marginTop: '28px',
          padding: '22px 24px',
          background: 'radial-gradient(ellipse at 50% 20%, rgba(45, 30, 16, 0.75) 0%, rgba(25, 14, 8, 0.90) 100%)',
          border: '1.5px solid rgba(229, 189, 117, 0.45)',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.2rem' }}>🚀</span>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.15rem', fontWeight: 600, color: 'var(--admin-gold-bright)' }}>
              Production Publishing Workflow
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '3px 9px',
                borderRadius: '999px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                background: lastPublishedTime ? 'rgba(74, 222, 128, 0.15)' : 'rgba(247, 190, 88, 0.15)',
                color: lastPublishedTime ? '#4ade80' : '#f7be58',
                border: `1px solid ${lastPublishedTime ? 'rgba(74, 222, 128, 0.4)' : 'rgba(247, 190, 88, 0.4)'}`,
              }}
            >
              {lastPublishedTime ? 'Published to Project' : 'Ready to Publish'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)', maxWidth: '640px' }}>
            Transfer edited scrapbook text, uploaded polaroids, GIFs, and songs directly into project assets (<code style={{ color: 'var(--admin-gold-primary)' }}>public/media</code>, <code style={{ color: 'var(--admin-gold-primary)' }}>public/audio</code>).
            {lastPublishedTime ? ` Last published: ${formatLastSaved(lastPublishedTime)}.` : ' No manual file copying required.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {onExportZip && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onExportZip}
              title="Download standalone production ZIP archive with all assets"
            >
              📦 Export ZIP
            </button>
          )}

          {onPublish && (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onPublish}
              disabled={isPublishing}
              style={{ padding: '10px 22px' }}
            >
              {isPublishing ? 'Publishing...' : '🚀 Publish to Project'}
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.4rem',
          margin: '36px 0 18px',
          color: 'var(--admin-gold-primary)',
        }}
      >
        Quick Access
      </h2>

      <div className={styles.quickActionsGrid}>
        <div className={styles.actionCard} onClick={() => onNavigate('scrapbook')}>
          <div className={styles.actionCardIcon}>📖</div>
          <h3 className={styles.actionCardTitle}>Scrapbook Pages Editor</h3>
          <p className={styles.actionCardDesc}>
            Edit text, headings, captions, polaroid photos, and drag-and-drop animated GIFs onto all 8 pages across 4 chapters.
          </p>
        </div>

        <div className={styles.actionCard} onClick={() => onNavigate('final')}>
          <div className={styles.actionCardIcon}>🚀</div>
          <h3 className={styles.actionCardTitle}>Final Proposal Question</h3>
          <p className={styles.actionCardDesc}>
            Customize the Chapter IV proposal wording, main question, highlight text, supporting quote, and floating stickers.
          </p>
        </div>

        <div className={styles.actionCard} onClick={() => onNavigate('media')}>
          <div className={styles.actionCardIcon}>🖼️</div>
          <h3 className={styles.actionCardTitle}>Media Library</h3>
          <p className={styles.actionCardDesc}>
            Upload PNG, JPG, WebP, and animated GIF files. Stored permanently in IndexedDB with full animation preservation.
          </p>
        </div>

        <div className={styles.actionCard} onClick={() => onNavigate('audio')}>
          <div className={styles.actionCardIcon}>🎵</div>
          <h3 className={styles.actionCardTitle}>Audio Library</h3>
          <p className={styles.actionCardDesc}>
            Upload MP3, WAV, and OGG songs into IndexedDB and embed interactive music notes inline into diary handwriting.
          </p>
        </div>

        <div className={styles.actionCard} onClick={() => onNavigate('tracking')}>
          <div className={styles.actionCardIcon}>📈</div>
          <h3 className={styles.actionCardTitle}>Visitor Tracking</h3>
          <p className={styles.actionCardDesc}>
            Monitor IN (Envelope Opened) and OUT (YES Clicked) events, visit timelines, conversion rate, and export CSV from Google Sheets.
          </p>
        </div>

        <div className={styles.actionCard} onClick={() => onNavigate('preview')}>
          <div className={styles.actionCardIcon}>✨</div>
          <h3 className={styles.actionCardTitle}>Live 3D Book Preview</h3>
          <p className={styles.actionCardDesc}>
            Interact with the actual visitor-facing 3D page-turning engine with Euler elastica curling and real-time content updates.
          </p>
        </div>
      </div>
    </div>
  );
};

