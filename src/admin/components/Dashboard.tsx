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
  onNavigate: (view: 'dashboard' | 'scrapbook' | 'final' | 'media' | 'preview') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ content, onNavigate }) => {
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

