/**
 * BUTTERFLY — Physical Book Reading Note Component
 * An authentic physical handwritten slip of aged parchment resting gently on the
 * open scrapbook before the visitor begins turning pages.
 * Features:
 * - Genuine Caveat cursive handwriting in midnight black ink (#0a0705)
 * - Warm handmade parchment paper styling with soft layered drop shadow
 * - Translucent washi tape pinned at the top & delicate wax seal accent
 * - Zero website modal/popup overlays: fully integrated into physical book stage
 * - Dismissable on tap, or proceeds naturally when turning pages
 * - Zero blockage of book interaction or 3D WebGL page turning
 */

import { memo, useState, useEffect } from 'react';
import styles from './BookReadingNote.module.css';

export interface BookReadingNoteProps {
  /** Whether the physical book has opened in the viewport reading zone */
  isOpen: boolean;
  /** Current page-turn curl progress (0 at start, increases as pages turn) */
  turnProgress: number;
}

export const BookReadingNote = memo(function BookReadingNote({
  isOpen,
  turnProgress,
}: BookReadingNoteProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Automatically tuck note away if visitor begins turning beyond spread 1
  useEffect(() => {
    if (turnProgress >= 0.12 && !isDismissed) {
      setIsDismissed(true);
    }
  }, [turnProgress, isDismissed]);

  const shouldShow = isOpen && !isDismissed && turnProgress < 0.12;

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div
      className={`${styles.noteWrapper} ${shouldShow ? styles.visible : ''}`}
      aria-hidden={!shouldShow}
    >
      <div
        className={styles.noteCard}
        onClick={handleDismiss}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleDismiss();
        }}
        aria-label="Physical handwritten note from Arjun. Tap to tuck away."
      >
        {/* Decorative Washi Tape Strip at Top */}
        <div className={styles.washiTapeStrip} aria-hidden="true" />

        {/* Delicate Wax Seal Accent */}
        <div className={styles.waxSealAccent} aria-hidden="true">
          ♡
        </div>

        {/* Handwritten Note Body */}
        <div className={styles.noteTextBody}>
          <p className={styles.noteParagraph}>
            Before you turn these pages...
            <br />
            There&apos;s something I&apos;d really like you to read.
          </p>

          <p className={styles.noteParagraphSecond}>
            Take your time; every page has a little piece of my story.
          </p>
        </div>

        {/* Subtle Handwritten Dismiss Hint */}
        <div className={styles.dismissHint} aria-hidden="true">
          (tap to tuck away ♡)
        </div>
      </div>
    </div>
  );
});

