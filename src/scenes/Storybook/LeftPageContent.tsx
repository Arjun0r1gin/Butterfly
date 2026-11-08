/**
 * BUTTERFLY — Storybook Left Page Component
 * Renders photos with washi tape, stamps, stickers, and scrapbook memories.
 */

import { memo } from 'react';
import type { StoryPageLeft } from './types';
import styles from './Storybook.module.css';

export interface LeftPageContentProps {
  pageData: StoryPageLeft;
}

export const LeftPageContent = memo(function LeftPageContent({
  pageData,
}: LeftPageContentProps) {
  return (
    <div className={styles.pageInner} data-side="left">
      {/* Background Parchment & Floral Border */}
      <img
        src="/storybook/page_template_left.png"
        alt=""
        className={styles.pageTemplateBg}
        aria-hidden="true"
      />

      <div className={styles.leftPageContent}>
        {/* Photo Memories Grid */}
        <div className={styles.photosContainer}>
          {pageData.photos.map((photo) => (
            <div
              key={photo.id}
              className={`${styles.polaroid} ${styles[photo.tapeStyle]}`}
              style={{
                transform: `rotate(${photo.rotationDeg}deg)`,
              }}
            >
              {/* Washi Tape Strip */}
              <div className={`${styles.washiTape} ${styles[photo.tapeStyle]}`} />

              {/* Photo Frame */}
              <div
                className={styles.photoCanvas}
                style={{ background: photo.bgGradient }}
              >
                <span className={styles.photoDoodle}>{photo.doodle || '📷'}</span>
              </div>

              {/* Polaroid Caption */}
              <div className={styles.polaroidCaption}>
                <span className={styles.polaroidTitle}>{photo.title}</span>
                {photo.date && (
                  <span className={styles.polaroidDate}>{photo.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Scrapbook Stickers & Stamps */}
        <div className={styles.stickersLayer}>
          {pageData.stickers.map((st) => (
            <div
              key={st.id}
              className={`${styles.sticker} ${styles[`sticker_${st.type}`]}`}
              style={{
                left: `${st.x}%`,
                top: `${st.y}%`,
                transform: `translate(-50%, -50%) rotate(${st.rotationDeg}deg)`,
              }}
            >
              {st.label}
            </div>
          ))}
        </div>

        {/* Handwritten Notes */}
        <div className={styles.handwrittenNotes}>
          {pageData.handwrittenNotes.map((note, idx) => (
            <p key={idx} className={styles.handwrittenLine}>
              {note}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
});

