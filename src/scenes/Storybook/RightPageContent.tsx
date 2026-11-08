/**
 * BUTTERFLY — Storybook Right Page Component
 * Renders genuine cursive handwriting diary stories in rich black ink,
 * blush watercolor highlighter strokes, butterfly doodles, and pressed flower accents.
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
  const typo = pageData.typography || {};
  const fontFamily = typo.fontFamily || "'Caveat', 'Patrick Hand', cursive, sans-serif";
  const fontSize = typo.fontSize ? `${(typo.fontSize / 34) * 1.35}rem` : '1.35rem';
  const textColor = typo.color || '#17120F';
  const lineHeight = typo.lineHeight || 1.55;
  const textAlign = typo.textAlign || 'left';
  const paraGap = typo.paragraphSpacing !== undefined ? `${(typo.paragraphSpacing / 28) * 12}px` : '12px';

  return (
    <div className={styles.pageInner} data-side="right">
      {/* Background Warm Aged Parchment */}
      <img
        src="/storybook/studio_page_blank_right.jpg"
        alt=""
        className={styles.pageTemplateBg}
        aria-hidden="true"
      />

      {/* Decorative Butterfly Flight Doodle in Top Right */}
      <img
        src="/storybook/assets/doodle_butterfly.png"
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
              {para}
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

      {/* Pressed Pink Wildflower Sprig in Bottom Right Corner */}
      <img
        src="/storybook/assets/flower_pink_sprig.png"
        alt=""
        className={styles.bottomRightFlower}
        aria-hidden="true"
      />
    </div>
  );
});
