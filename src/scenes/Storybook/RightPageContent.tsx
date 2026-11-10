/**
 * BUTTERFLY — Storybook Right Page Component
 * Renders genuine cursive handwriting diary stories in rich black ink,
 * blush watercolor highlighter strokes, butterfly doodles, and pressed flower accents.
 */

import React, { memo } from 'react';
import type { StoryPageRight, MusicMarker } from './types';
import { audioPlayer } from '../../services/audio/audioPlayer';
import { assetUrl } from '../../utils/assets';
import styles from './Storybook.module.css';

export interface RightPageContentProps {
  pageData: StoryPageRight;
}

function renderParagraphWithMusic(para: string, markers?: Record<string, MusicMarker>) {
  const parts = para.split(/(\[\[music:[a-zA-Z0-9_\-]+\]\][,\.!?;:]*)/g);
  return parts.map((part, pIdx) => {
    const match = part.match(/^\[\[music:([a-zA-Z0-9_\-]+)\]\]([,\.!?;:]*)$/);
    if (!match) return part;

    const markerId = match[1];
    const punct = match[2] || '';
    const marker = markers?.[markerId];

    if (marker && marker.enabled === false) {
      return <React.Fragment key={pIdx}>{punct}</React.Fragment>;
    }

    const activeMarker: MusicMarker = marker || {
      id: markerId,
      trackId: 'track_remo_first_sight',
      title: 'Our Melody ♡',
      loop: true,
      enabled: true,
      color: '#D32F2F',
    };

    const customColor = activeMarker.color || '#D32F2F';
    const customSize = activeMarker.size || 26;

    return (
      <React.Fragment key={pIdx}>
        <button
          type="button"
          className={styles.musicNoteBadge}
          style={{
            width: `${customSize}px`,
            height: `${customSize}px`,
            background: `radial-gradient(circle at 35% 35%, #ff8a80 0%, ${customColor} 60%, #b71c1c 100%)`,
            boxShadow: `0 2px 6px ${customColor}66, 0 1px 3px rgba(0, 0, 0, 0.15)`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            audioPlayer.playMarker(activeMarker, {
              x: rect.left + rect.width / 2,
              y: rect.top,
            });
          }}
          title={activeMarker.title || 'Play music'}
          aria-label={`Play ${activeMarker.title || 'music'}`}
        >
          <span
            className={styles.musicNoteIcon}
            style={{ fontSize: `${Math.round(customSize * 0.58)}px` }}
          >
            ♫
          </span>
          <span className={styles.sparkleTop}>✧</span>
          <span className={styles.sparkleBottom}>✦</span>
        </button>
        {punct}
      </React.Fragment>
    );
  });
}

export const RightPageContent = memo(function RightPageContent({
  pageData,
}: RightPageContentProps) {
  const typo = pageData.typography || {};
  const fontFamily = typo.fontFamily || "'Caveat', 'Patrick Hand', cursive, sans-serif";
  const fontSize = typo.fontSize ? `${(Math.max(38, typo.fontSize) / 34) * 1.55}rem` : '1.55rem';
  const textColor = typo.color && typo.color !== '#17120F' ? typo.color : '#0a0705';
  const lineHeight = typo.lineHeight || 1.48;
  const textAlign = typo.textAlign || 'left';
  const paraGap = typo.paragraphSpacing !== undefined ? `${(typo.paragraphSpacing / 28) * 14}px` : '14px';

  return (
    <div className={styles.pageInner} data-side="right">
      {/* Background Warm Aged Parchment */}
      <img
        src={assetUrl('/storybook/studio_page_blank_right.jpg')}
        alt=""
        className={styles.pageTemplateBg}
        aria-hidden="true"
      />

      {/* Decorative Butterfly Flight Doodle in Top Right */}
      <img
        src={assetUrl('/storybook/assets/doodle_butterfly.png')}
        alt=""
        className={styles.topRightDoodle}
        aria-hidden="true"
      />

      <div className={styles.rightPageContent}>
        {/* Date in Top Right with Pen Underline */}
        {pageData.dateOrLocation && (
          <div className={styles.diaryDateHeader}>
            <span
              className={styles.diaryDateText}
              style={{ fontFamily, color: textColor }}
            >
              {pageData.dateOrLocation}
            </span>
            <div
              className={styles.diaryDateUnderline}
              style={{ background: textColor }}
            />
          </div>
        )}

        {/* Chapter Header with Blush Watercolor Highlighter */}
        {pageData.chapterNumber && (
          <div className={styles.handwrittenChapterHeader}>
            <div className={styles.blushHighlightStreak} />
            <span
              className={styles.handwrittenChapterNumber}
              style={{ fontFamily, color: textColor }}
            >
              {pageData.chapterNumber}
            </span>
          </div>
        )}

        {/* Chapter Title with Blush Watercolor Highlighter */}
        {pageData.chapterTitle && (
          <div className={styles.handwrittenTitleWrapper}>
            <div className={styles.blushHighlightStreakTitle} />
            <h2
              className={styles.handwrittenChapterTitle}
              style={{ fontFamily, color: textColor }}
            >
              {pageData.chapterTitle}
            </h2>
          </div>
        )}

        {/* Story Body: Genuine Black Ink Handwriting flowing naturally */}
        <div
          className={styles.handwrittenStoryBody}
          style={{ gap: paraGap }}
        >
          {pageData.storyParagraphs.map((para, idx) => (
            <p
              key={idx}
              className={styles.handwrittenParagraph}
              style={{
                fontFamily,
                fontSize,
                color: textColor,
                lineHeight,
                textAlign,
              }}
            >
              {renderParagraphWithMusic(para, pageData.musicMarkers)}
            </p>
          ))}
        </div>

        {/* Closing Signature or Subtle Inked Accent Stroke */}
        {pageData.signature ? (
          <div
            className={styles.signatureBlock}
            style={{ textAlign: 'right', marginTop: '14px' }}
          >
            <span
              className={styles.signatureText}
              style={{
                fontFamily,
                fontStyle: 'italic',
                fontSize: `calc(${fontSize} * 0.95)`,
                color: textColor,
              }}
            >
              {pageData.signature}
            </span>
          </div>
        ) : (
          <div className={styles.inkFlourishAccent} />
        )}
      </div>
    </div>
  );
});
