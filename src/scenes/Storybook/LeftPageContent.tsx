/**
 * BUTTERFLY — Storybook Left Page Component
 * Renders authentic handmade scrapbook photos with washi tape, stamps,
 * pressed flowers, stickers, and handwritten captions.
 */

import { memo } from 'react';
import type { StoryPageLeft } from './types';
import { assetUrl } from '../../utils/assets';
import styles from './Storybook.module.css';

export interface LeftPageContentProps {
  pageData: StoryPageLeft;
}

export const LeftPageContent = memo(function LeftPageContent({
  pageData,
}: LeftPageContentProps) {
  return (
    <div className={styles.pageInner} data-side="left">
      {/* Background Warm Aged Parchment */}
      <img
        src={assetUrl('/storybook/studio_page_blank_left.jpg')}
        alt=""
        className={styles.pageTemplateBg}
        aria-hidden="true"
      />

      <div className={styles.leftPageContent}>
        {/* Photo Memories Container */}
        <div className={styles.photosContainer}>
          {pageData.photos.map((photo) => (
            <div
              key={photo.id}
              className={`${styles.polaroid} ${styles[photo.tapeStyle] || ''}`}
              style={{
                transform: `rotate(${photo.rotationDeg}deg)`,
              }}
            >
              {/* Washi Tape Strip */}
              <div className={`${styles.washiTape} ${styles[photo.tapeStyle] || ''}`}>
                {photo.tapeStyle === 'washi-gold' ? (
                  <img src={assetUrl('/storybook/assets/washi_gingham.png')} alt="" className={styles.washiTapeImg} />
                ) : (
                  <img src={assetUrl('/storybook/assets/washi_pink_floral.png')} alt="" className={styles.washiTapeImg} />
                )}
              </div>

              {/* Photo Frame */}
              <div className={styles.photoCanvas}>
                {photo.customUrl ? (
                  <img
                    src={assetUrl(photo.customUrl)}
                    alt={photo.title}
                    className={styles.photoImg}
                  />
                ) : (
                  <span className={styles.photoDoodle}>{photo.doodle || '📷'}</span>
                )}
              </div>

              {/* Polaroid Caption in Black Ink Handwriting */}
              <div className={styles.polaroidCaption}>
                <span className={styles.polaroidTitle}>{photo.title}</span>
                {photo.date && (
                  <span className={styles.polaroidDate}>{photo.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Scrapbook Stickers & Dried Flowers Layer */}
        <div className={styles.stickersLayer}>
          {pageData.stickers.map((st) => (
            <div
              key={st.id}
              className={`${styles.sticker} ${styles[`sticker_${st.type}`] || ''}`}
              style={{
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: `${((st.width || 80) / 440) * 100}%`,
                height: `${((st.height || 80) / 490) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${st.rotationDeg}deg)`,
              }}
            >
              {st.customUrl ? (
                <img
                  src={assetUrl(st.customUrl)}
                  alt={st.label || ''}
                  className={styles.stickerImg}
                />
              ) : (
                st.label
              )}
            </div>
          ))}
        </div>

        {/* Handwritten Notes */}
        {pageData.handwrittenNotes && pageData.handwrittenNotes.length > 0 && (
          <div className={styles.handwrittenNotes}>
            {pageData.handwrittenNotes.map((note, idx) => (
              <p key={idx} className={styles.handwrittenLine}>
                {note}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
