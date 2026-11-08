/**
 * BUTTERFLY — Opening Envelope Component
 * Implements Step 1 & 2 of the opening sequence:
 * - Displays the new envelope with clean white background and realistic soft shadow
 * - Displays elegant pulsing "Click to Open ♡" underneath
 * - Only starts the flower tunnel when clicked
 * - Prevents multiple clicks / double-triggers
 */

import React, { useState, useCallback } from 'react';
import { assetUrl } from '../../utils/assets';
import styles from './OpeningEnvelope.module.css';

export interface OpeningEnvelopeProps {
  onOpen: () => void;
  onFinished?: () => void;
  isReady?: boolean;
  className?: string;
}

export const OpeningEnvelope: React.FC<OpeningEnvelopeProps> = ({
  onOpen,
  onFinished,
  isReady = true,
  className = '',
}) => {
  const [isPending, setIsPending] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const startOpening = useCallback(() => {
    setIsOpening(true);

    // Trigger flower tunnel immediately
    onOpen();

    // Remove from view once opening dissolve completes
    setTimeout(() => {
      setIsFinished(true);
      if (onFinished) {
        onFinished();
      }
    }, 800);
  }, [onOpen, onFinished]);

  // If user clicked while assets were preloading, trigger opening the moment isReady turns true
  React.useEffect(() => {
    if (isPending && isReady && !isOpening) {
      startOpening();
    }
  }, [isPending, isReady, isOpening, startOpening]);

  const handleOpen = useCallback(() => {
    if (isOpening || isFinished) return;

    if (!isReady) {
      setIsPending(true);
      return;
    }

    startOpening();
  }, [isOpening, isFinished, isReady, startOpening]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
    },
    [handleOpen]
  );

  if (isFinished) {
    return null;
  }

  return (
    <div
      className={`${styles.openingOverlay} ${isOpening ? styles.fadeOut : ''} ${className}`.trim()}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Click to open your storybook gift"
    >
      <div className={styles.envelopeContainer}>
        {/* Envelope Visual */}
        <div className={styles.envelopeCard}>
          <img
            src={assetUrl('/storybook/assets/opening_envelope.png')}
            alt="A Little Story for You..."
            className={styles.envelopeImg}
            draggable={false}
          />
        </div>

        {/* Instruction underneath */}
        <div className={`${styles.promptWrapper} ${isPending ? styles.pendingPrompt : ''}`}>
          <span className={styles.promptText}>
            {isPending ? 'Opening your story... ♡' : 'Click to Open ♡'}
          </span>
          <div className={styles.promptDecor} aria-hidden="true">
            <span className={styles.promptArrow}>‹</span>
            <span className={styles.promptLine} />
            <span className={styles.promptArrow}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
};
