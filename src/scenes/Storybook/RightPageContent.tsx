/**
 * BUTTERFLY — Storybook Right Page Component
 * Renders chapter titles, elegant serif story text, drop caps, and closing signature.
 */

import { memo } from 'react';
import type { StoryPageRight } from './types';
import styles from './Storybook.module.css';

export interface RightPageContentProps {
  pageData: StoryPageRight;
}

export const RightPageContent = memo(function RightPageContent({
  pageData,
}: RightPageContentProps) {
  return (
    <div className={styles.pageInner} data-side="right">
      {/* Background Parchment & Floral Border */}
      <img
        src="/storybook/page_template_right.png"
        alt=""
        className={styles.pageTemplateBg}
        aria-hidden="true"
      />

      <div className={styles.rightPageContent}>
        {/* Chapter Header */}
        <div className={styles.chapterHeader}>
          <span className={styles.chapterNumber}>{pageData.chapterNumber}</span>
          <h2 className={styles.chapterTitle}>{pageData.chapterTitle}</h2>
          {pageData.dateOrLocation && (
            <span className={styles.chapterLocation}>{pageData.dateOrLocation}</span>
          )}
        </div>

        {/* Narrative Paragraphs with Ornamental Drop Cap */}
        <div className={styles.storyBody}>
          {pageData.storyParagraphs.map((para, idx) => (
            <p key={idx} className={styles.storyParagraph}>
              {idx === 0 && pageData.decorativeInitial && (
                <span className={styles.dropCap}>{pageData.decorativeInitial}</span>
              )}
              {para}
            </p>
          ))}
        </div>

        {/* Closing Cursive Signature */}
        {pageData.signature && (
          <div className={styles.signatureBlock}>
            <span className={styles.signatureText}>{pageData.signature}</span>
          </div>
        )}
      </div>
    </div>
  );
});

