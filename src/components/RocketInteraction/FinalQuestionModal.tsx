/**
 * BUTTERFLY — Final Question & YES/NO Interaction Component
 * Orchestrates:
 * 1. Immediate reveal upon butterfly completing landing on rocket tip (zero delay)
 * 2. 100% Transparent Proposal presentation with exact canonical copy & elegant typography
 * 3. Dynamic Large-Scale Dodging NO Button with proximity avoidance, safe cross-screen bounds & playful toasts
 * 4. Full-screen Flower Rain celebration on YES click
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { FlowerRainCelebration } from './FlowerRainCelebration';
import styles from './FinalQuestionModal.module.css';

export interface FinalQuestionModalProps {
  /** Whether the butterfly has completed its landing on the rocket tip */
  isLandedOnTip: boolean;
  /** Callback to replay the journey from beginning */
  onReplay?: () => void;
  className?: string;
}

const TOAST_MESSAGES = [
  'Nice try! 😉',
  'Too slow! 💨',
  'Almost! 😜',
  'Nope! 🏃‍♂️',
  'Not quite! ✨',
  'Try again! 💫',
  'Over here! 👋',
];

export const FinalQuestionModal = memo(function FinalQuestionModal({
  isLandedOnTip,
  onReplay,
  className = '',
}: FinalQuestionModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isCelebration, setIsCelebration] = useState(false);
  const [noOffset, setNoOffset] = useState({ x: 0, y: 0 });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Nice try! 😉');
  const [isToastBelow, setIsToastBelow] = useState(false);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDodgeTimeRef = useRef<number>(0);
  const dodgeCountRef = useRef<number>(0);
  const recentZonesRef = useRef<number[]>([]);
  const hasTriggeredRef = useRef(false);

  // Geometric element refs for dynamic boundary & collision avoidance
  const proposalRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const noWrapperRef = useRef<HTMLDivElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);

  // Check URL params for direct testing: ?scene=3&qa=1 or ?yes=1
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('yes') === '1') {
      hasTriggeredRef.current = true;
      setIsVisible(true);
      setHasEntered(true);
      setIsCelebration(true);
    } else if (params.get('qa') === '1') {
      hasTriggeredRef.current = true;
      setIsVisible(true);
      setHasEntered(true);
    }
  }, []);

  // 1. Immediate Reveal Synchronized with Butterfly Landing
  // The moment the butterfly lands on the rocket tip, trigger the question immediately
  // Zero artificial setTimeout, smoothly fades in on the immediate frame, latches once
  useEffect(() => {
    if (isLandedOnTip && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setIsVisible(true);
      // Kick off CSS entry transition immediately on next animation frame
      requestAnimationFrame(() => {
        setHasEntered(true);
      });
    }
  }, [isLandedOnTip]);

  // 2. Large-Scale Dynamic Cross-Screen NO Button Dodge Controller
  const handleNoDodge = useCallback(() => {
    const now = performance.now();
    // Throttle slightly (160ms) to ensure smooth animations and avoid spamming
    if (now - lastDodgeTimeRef.current < 160) return;
    lastDodgeTimeRef.current = now;

    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw <= 768;

    const noWrapper = noWrapperRef.current;
    if (!noWrapper) return;
    const currentRect = noWrapper.getBoundingClientRect();
    const naturalX = currentRect.left - noOffset.x;
    const naturalY = currentRect.top - noOffset.y;
    const btnW = currentRect.width || (isMobile ? 120 : 138);
    const btnH = currentRect.height || 50;

    // Viewport safe bounds
    const marginX = isMobile ? 16 : 28;
    const marginY = isMobile ? 18 : 32;
    const minX = marginX;
    // On desktop, keep NO button away from the rocket on the far right (rocket occupies ~0.68vw to 1.0vw)
    const maxX = isMobile ? vw - btnW - marginX : Math.min(vw - btnW - marginX, vw * 0.68);
    const minY = marginY;
    const maxY = vh - btnH - marginY;

    // Obstacle rectangles to strictly avoid
    const yesRect = yesButtonRef.current?.getBoundingClientRect();
    const textRect = textContainerRef.current?.getBoundingClientRect();

    const checkOverlap = (
      cand: { left: number; right: number; top: number; bottom: number },
      obs?: DOMRect | null,
      pad: number = 24
    ) => {
      if (!obs) return false;
      return !(
        cand.right + pad < obs.left ||
        cand.left - pad > obs.right ||
        cand.bottom + pad < obs.top ||
        cand.top - pad > obs.bottom
      );
    };

    // 8 Widely-spaced candidate destination zones (normalized coordinates [ux, uy])
    // spanning upper sky, lower lawn, mid-left, lower-right, and diagonals
    const desktopZones = [
      { ux: 0.08, uy: 0.16 }, // Zone 0: Far upper-left twilight sky
      { ux: 0.52, uy: 0.82 }, // Zone 1: Lower-right lawn (below rocket level)
      { ux: 0.08, uy: 0.86 }, // Zone 2: Far bottom-left corner
      { ux: 0.54, uy: 0.44 }, // Zone 3: Mid-right open sky (between text and rocket)
      { ux: 0.05, uy: 0.58 }, // Zone 4: Far mid-left margin
      { ux: 0.46, uy: 0.20 }, // Zone 5: Upper center-right twilight sky
      { ux: 0.32, uy: 0.88 }, // Zone 6: Lower center below actions
      { ux: 0.60, uy: 0.70 }, // Zone 7: Mid-right lower sky
    ];

    const mobileZones = [
      { ux: 0.10, uy: 0.14 }, // Far upper-left
      { ux: 0.62, uy: 0.86 }, // Lower-right
      { ux: 0.10, uy: 0.86 }, // Lower-left
      { ux: 0.62, uy: 0.14 }, // Upper-right
      { ux: 0.06, uy: 0.68 }, // Mid-left
      { ux: 0.36, uy: 0.89 }, // Lower-center
      { ux: 0.64, uy: 0.68 }, // Mid-right
      { ux: 0.36, uy: 0.12 }, // Upper-center
    ];

    const zones = isMobile ? mobileZones : desktopZones;

    // Filter out recent zones so it never bounces back and forth between two spots
    const excludedZones = new Set(recentZonesRef.current.slice(-3));
    const availableZoneIndices: number[] = [];
    for (let i = 0; i < zones.length; i++) {
      if (!excludedZones.has(i)) {
        availableZoneIndices.push(i);
      }
    }
    const shuffled = [...availableZoneIndices].sort(() => Math.random() - 0.5);

    let chosenX = naturalX;
    let chosenY = naturalY;
    let chosenZoneIdx = -1;
    const minJumpDist = isMobile ? 90 : 160;

    for (const idx of shuffled) {
      const z = zones[idx];
      // Jitter candidate position slightly (±20px) for organic variation
      const jitterX = (Math.random() - 0.5) * 40;
      const jitterY = (Math.random() - 0.5) * 30;
      const candX = Math.max(minX, Math.min(maxX, z.ux * vw + jitterX));
      const candY = Math.max(minY, Math.min(maxY, z.uy * vh + jitterY));

      const candRect = {
        left: candX,
        right: candX + btnW,
        top: candY,
        bottom: candY + btnH,
      };

      // Collision checks: NEVER overlap YES button (32px padding) or question text (20px padding)
      if (checkOverlap(candRect, yesRect, 32)) continue;
      if (checkOverlap(candRect, textRect, 20)) continue;

      // Distance check from current button position
      const jumpDist = Math.hypot(candX - currentRect.left, candY - currentRect.top);
      if (jumpDist < minJumpDist) continue;

      // Candidate verified safe and far away!
      chosenX = candX;
      chosenY = candY;
      chosenZoneIdx = idx;
      break;
    }

    // Fallback if all candidates were blocked
    if (chosenZoneIdx === -1) {
      chosenX = naturalX < vw * 0.5 ? Math.min(maxX, naturalX + (isMobile ? 120 : 220)) : Math.max(minX, naturalX - (isMobile ? 120 : 220));
      chosenY = naturalY < vh * 0.5 ? Math.min(maxY, naturalY + (isMobile ? 100 : 180)) : Math.max(minY, naturalY - (isMobile ? 100 : 180));
    } else {
      recentZonesRef.current = [...recentZonesRef.current.slice(-3), chosenZoneIdx];
    }

    // Compute relative delta from natural untransformed position
    const nextOffsetX = Math.round(chosenX - naturalX);
    const nextOffsetY = Math.round(chosenY - naturalY);
    setNoOffset({ x: nextOffsetX, y: nextOffsetY });

    // Flip toast bubble if button moved near the top of the viewport
    setIsToastBelow(chosenY < 70);

    // Toast message update
    const msg = TOAST_MESSAGES[dodgeCountRef.current % TOAST_MESSAGES.length];
    dodgeCountRef.current += 1;
    setToastMessage(msg);
    setShowToast(true);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 1800);
  }, [noOffset.x, noOffset.y]);

  // Proximity approach detection: dodges smoothly as cursor draws near
  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const btn = noButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      // Approach threshold: 52px on desktop, triggers before cursor reaches button
      if (dist < 52) {
        handleNoDodge();
      }
    },
    [handleNoDodge]
  );

  // YES Button Click -> triggers full-screen flower rain cascade
  const handleYesClick = useCallback(() => {
    setIsCelebration(true);
  }, []);

  // Replay Button Click
  const handleReplayClick = useCallback(() => {
    hasTriggeredRef.current = false;
    setIsCelebration(false);
    setIsVisible(false);
    setHasEntered(false);
    setNoOffset({ x: 0, y: 0 });
    setShowToast(false);
    recentZonesRef.current = [];
    if (onReplay) {
      onReplay();
    } else if (typeof window !== 'undefined') {
      window.location.href = window.location.pathname;
    }
  }, [onReplay]);

  if (!isVisible) return null;

  return (
    <>
      {/* 1. Proposal Question State (100% Transparent Background) */}
      {!isCelebration && (
        <div
          className={`${styles.interactionWrapper} ${
            hasEntered ? styles.visible : ''
          } ${className}`.trim()}
          aria-label="Final Journey Proposal & Interaction"
          onMouseMove={handleContainerMouseMove}
        >
          <div
            ref={proposalRef}
            className={`${styles.proposalContainer} ${
              hasEntered ? styles.cardEntered : ''
            }`}
          >
            {/* Question Text Elements wrapped for collision avoidance */}
            <div ref={textContainerRef} className={styles.questionTextContainer}>
              {/* Chapter Header with subtle horizontal flanking lines */}
              <div className={styles.chapterHeader}>
                <span className={styles.headerLine} aria-hidden="true" />
                <span className={styles.headerText}>
                  CHAPTER IV: BEYOND THE HORIZON
                </span>
                <span className={styles.headerLine} aria-hidden="true" />
              </div>

              {/* Canonical Question Title */}
              <h2 className={styles.questionTitle}>
                <span className={styles.questionTitleMain}>
                  Will you join me on this
                </span>
                <span className={styles.questionTitleHighlight}>
                  journey forever?
                </span>
              </h2>

              {/* Subtitle Quote */}
              <p className={styles.questionSubtitle}>
                &ldquo;To infinity and beyond, through every flower and star.&rdquo;
              </p>
            </div>

            {/* Interactive Actions Row */}
            <div className={styles.actionsRow}>
              {/* YES Button */}
              <button
                ref={yesButtonRef}
                type="button"
                className={styles.yesButton}
                onClick={handleYesClick}
                aria-label="Say Yes"
              >
                <span>YES</span>
                <span className={styles.buttonArrow} aria-hidden="true">
                  &rarr;
                </span>
              </button>

              {/* NO Button (Playfully dodges across large screen quadrants) */}
              <div
                ref={noWrapperRef}
                style={{
                  transform: `translate3d(${noOffset.x}px, ${noOffset.y}px, 0)`,
                  transition:
                    'transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'inline-block',
                  position: 'relative',
                  willChange: 'transform',
                }}
              >
                {showToast && (
                  <div
                    className={`${styles.dodgeToast} ${
                      isToastBelow ? styles.toastBelow : ''
                    }`.trim()}
                  >
                    {toastMessage}
                  </div>
                )}
                <button
                  ref={noButtonRef}
                  type="button"
                  className={styles.noButton}
                  onMouseEnter={handleNoDodge}
                  onTouchStart={handleNoDodge}
                  onPointerDown={handleNoDodge}
                  onClick={handleNoDodge}
                  aria-label="Say No"
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Full-Screen Flower Rain Celebration on YES Click */}
      {isCelebration && (
        <FlowerRainCelebration onReplay={handleReplayClick} />
      )}
    </>
  );
});
