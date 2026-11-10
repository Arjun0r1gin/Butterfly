/**
 * BUTTERFLY — Book Opening Instructions Banner Component
 * Floating romantic instruction banner above the open scrapbook:
 * - Wording: "Please read the things written on the page and click on the 🎵 music button to listen to the music."
 * - Warm dark brown translucent glass with thin glowing golden capsule border
 * - Golden open book with radiance rays on left
 * - Glowing butterfly with fairy dust trail on right
 * - Draped botanical roses on top-left corner
 * - Highlighted red music note badge & music button pill
 * - Remains visible through all pages while the book is open
 * - Can be manually closed by the user via the (×) button
 */

import { memo, useState, useEffect, useCallback } from 'react';
import styles from './BookInstructionBanner.module.css';

const INSTRUCTION_STORAGE_KEY = 'butterfly_book_instruction_seen';

export interface BookInstructionBannerProps {
  /** Whether the physical book is open in the reading zone */
  isOpen: boolean;
  /** Optional turnProgress (retained for backward compatibility, banner remains through all pages) */
  turnProgress?: number;
}

export const BookInstructionBanner = memo(function BookInstructionBanner({
  isOpen,
}: BookInstructionBannerProps) {
  // Clear any legacy sessionStorage lock from previous versions so the banner is never blocked
  useEffect(() => {
    try {
      sessionStorage.removeItem(INSTRUCTION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const [isDismissedByUser, setIsDismissedByUser] = useState(false);

  // If user scrolled away and the book closed, reset manual dismissal when they return
  useEffect(() => {
    if (!isOpen) {
      setIsDismissedByUser(false);
    }
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    setIsDismissedByUser(true);
  }, []);

  const shouldShow = isOpen && !isDismissedByUser;

  return (
    <aside
      className={`${styles.bannerWrapper} ${shouldShow ? styles.visible : styles.dismissed}`}
      aria-label="Reading Instructions"
      aria-hidden={!shouldShow}
    >
      <div className={styles.bannerCard} role="region" aria-live="polite">
        {/* --- Draped Corner Botanical Roses (Top Left) --- */}
        <div className={styles.cornerRoses} aria-hidden="true">
          <svg viewBox="0 0 52 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="roseRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef5350" />
                <stop offset="50%" stopColor="#d32f2f" />
                <stop offset="100%" stopColor="#9a0007" />
              </linearGradient>
              <linearGradient id="leafGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#81c784" />
                <stop offset="60%" stopColor="#388e3c" />
                <stop offset="100%" stopColor="#1b5e20" />
              </linearGradient>
            </defs>
            {/* Leaves */}
            <path
              d="M10 26C4 28 0 35 2 41C8 42 16 38 18 31C18 27 14 25 10 26Z"
              fill="url(#leafGreenGrad)"
              opacity="0.85"
            />
            <path
              d="M24 10C21 4 13 2 7 6C6 13 11 20 18 20C22 18 24 14 24 10Z"
              fill="url(#leafGreenGrad)"
              opacity="0.85"
            />
            {/* Top Rose Blossom */}
            <circle cx="28" cy="18" r="11" fill="url(#roseRedGrad)" />
            <circle cx="26" cy="16" r="7.5" fill="#e53935" opacity="0.9" />
            <circle cx="27" cy="17" r="4.5" fill="#ff7961" opacity="0.9" />
            <circle cx="28" cy="18" r="2.2" fill="#ffe082" />
            {/* Left Blossom */}
            <circle cx="16" cy="30" r="9" fill="url(#roseRedGrad)" opacity="0.95" />
            <circle cx="15" cy="29" r="6" fill="#e53935" />
            <circle cx="16" cy="30" r="3.5" fill="#ff7961" opacity="0.85" />
            <circle cx="16" cy="30" r="1.8" fill="#ffe082" />
            {/* Small Bud & Stem */}
            <path d="M22 28Q24 38 30 46" stroke="#4caf50" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="31" cy="48" r="5" fill="url(#roseRedGrad)" />
            <circle cx="31" cy="48" r="1.5" fill="#ffe082" />
          </svg>
        </div>

        {/* --- Left Golden Open Book with Radiance Rays --- */}
        <div className={styles.bookIconContainer} aria-hidden="true">
          <svg className={styles.bookSvg} viewBox="0 0 44 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff3d6" />
                <stop offset="50%" stopColor="#e5bd75" />
                <stop offset="100%" stopColor="#b38234" />
              </linearGradient>
              <linearGradient id="bookCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4a359" />
                <stop offset="100%" stopColor="#8c581d" />
              </linearGradient>
            </defs>
            {/* Radiance Rays shining above the pages */}
            <line x1="22" y1="3" x2="22" y2="7" stroke="#ffd580" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="14" y1="5" x2="16" y2="9" stroke="#ffd580" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="30" y1="5" x2="28" y2="9" stroke="#ffd580" strokeWidth="1.6" strokeLinecap="round" />

            {/* Book Base / Outer Leather Spine */}
            <path
              d="M5 28C10 27 16 28 22 31C28 28 34 27 39 28C39 30 35 32 22 32C9 32 5 30 5 28Z"
              fill="url(#bookCoverGrad)"
            />
            {/* Left Page (Curving fan) */}
            <path
              d="M7 15C12 14 17 15 22 18V29C17 26 12 25 7 26V15Z"
              fill="url(#goldBookGrad)"
            />
            <path
              d="M9 17C13 16 17 17 21 19.5"
              stroke="#7a4e16"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.65"
            />
            <path
              d="M9 20C13 19 17 20 21 22.5"
              stroke="#7a4e16"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.65"
            />
            {/* Right Page (Curving fan) */}
            <path
              d="M37 15C32 14 27 15 22 18V29C27 26 32 25 37 26V15Z"
              fill="url(#goldBookGrad)"
            />
            <path
              d="M35 17C31 16 27 17 23 19.5"
              stroke="#7a4e16"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.65"
            />
            <path
              d="M35 20C31 19 27 20 23 22.5"
              stroke="#7a4e16"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.65"
            />
            {/* Center Spine Crease */}
            <line x1="22" y1="18" x2="22" y2="29" stroke="#5a3810" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* --- Center Verbatim Romantic Instruction Message --- */}
        <div className={styles.textContent}>
          <span className={styles.firstLine}>Please read the things written on the page</span>
          <span className={styles.secondLine}>
            and click on the{' '}
            <span className={styles.musicButtonBadge}>
              <span className={styles.musicIconCircle} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </span>
              <span className={styles.musicButtonText}>music button</span>
            </span>{' '}
            to listen to the music.
          </span>
        </div>

        {/* --- Right Glowing Butterfly with Sparkling Trail --- */}
        <div className={styles.butterflyContainer} aria-hidden="true">
          <svg className={styles.butterflySvg} viewBox="0 0 44 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bfWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="60%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#9a3412" />
              </linearGradient>
            </defs>
            {/* Curved fairy dust sparkle trail arching under butterfly */}
            <circle cx="10" cy="32" r="1.2" fill="#ffd54f" opacity="0.75" />
            <circle cx="16" cy="30" r="1.5" fill="#ffe082" opacity="0.85" />
            <circle cx="23" cy="27" r="1.8" fill="#fff" opacity="0.9" />
            {/* Small golden sparkle cross */}
            <path d="M16 29V31M15 30H17" stroke="#ffe082" strokeWidth="0.8" />
            <path d="M23 26V28M22 27H24" stroke="#fff" strokeWidth="0.8" />

            {/* Monarch Butterfly Wings */}
            {/* Left Upper Wing */}
            <path
              d="M31 16C28 10 24 6 20 8C17 10 19 18 29 19L31 16Z"
              fill="url(#bfWingGrad)"
            />
            {/* Left Lower Wing */}
            <path
              d="M30 19C26 19 22 22 23 25C24 28 29 27 31 21L30 19Z"
              fill="url(#bfWingGrad)"
              opacity="0.9"
            />
            {/* Right Upper Wing */}
            <path
              d="M33 16C36 10 40 6 44 8C47 10 45 18 35 19L33 16Z"
              fill="url(#bfWingGrad)"
            />
            {/* Right Lower Wing */}
            <path
              d="M34 19C38 19 42 22 41 25C40 28 35 27 33 21L34 19Z"
              fill="url(#bfWingGrad)"
              opacity="0.9"
            />
            {/* Wing Vein Accents */}
            <path d="M25 11Q29 15 31 18" stroke="#451a03" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M39 11Q35 15 33 18" stroke="#451a03" strokeWidth="0.9" strokeLinecap="round" />
            {/* Butterfly Slender Body & Antennae */}
            <ellipse cx="32" cy="18" rx="1.6" ry="5.5" fill="#2d1305" />
            <path d="M31 13Q29 9 27 8" stroke="#2d1305" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M33 13Q35 9 37 8" stroke="#2d1305" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        </div>

        {/* --- Circular Close Button (×) --- */}
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleDismiss}
          aria-label="Close instruction banner"
          title="Close instructions"
        >
          <svg className={styles.closeIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </aside>
  );
});
