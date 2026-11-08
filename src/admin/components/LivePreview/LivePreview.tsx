/**
 * BUTTERFLY — Live Preview Component
 * Previews the actual scrapbook using the real Three.js physical book component (ThreePageFlipPrototype)
 * with live canvas textures of edited content, page turning controls, and final proposal preview.
 */

import React, { useState } from 'react';
import type { ButterflyContent } from '../../../services/content/types';
import { ThreePageFlipPrototype } from '../../../scenes/Storybook/ThreePageFlipPrototype';
import { FinalQuestionModal } from '../../../components/RocketInteraction/FinalQuestionModal';
import styles from '../../Admin.module.css';

export interface LivePreviewProps {
  content: ButterflyContent;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ content }) => {
  const [previewMode, setPreviewMode] = useState<'book' | 'final'>('book');
  const [turnProgress, setTurnProgress] = useState(0.0);
  const [coverProgress, setCoverProgress] = useState(1.0);
  const [autoPlay, setAutoPlay] = useState(false);

  // Auto-play scrubber
  React.useEffect(() => {
    if (!autoPlay || previewMode !== 'book') return;
    let forward = true;
    let last = performance.now();
    let animId = 0;

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const speed = 0.55; // 0.55 turn progress units per second

      setTurnProgress((prev) => {
        let next = prev + (forward ? speed * dt : -speed * dt);
        if (next >= 4.0) {
          next = 4.0;
          forward = false;
        } else if (next <= 0.0) {
          next = 0.0;
          forward = true;
        }
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [autoPlay, previewMode]);

  return (
    <div>
      {/* Header & Mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.8rem', margin: '0 0 4px', color: 'var(--admin-text-main)' }}>
            Live Visitor Preview
          </h2>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.86rem' }}>
            Powered by the exact visitor-facing WebGL Three.js Euler elastica paper engine and proposal components.
          </p>
        </div>

        <div className={styles.pageSideToggle}>
          <button
            type="button"
            className={`${styles.sideBtn} ${previewMode === 'book' ? styles.sideBtnActive : ''}`}
            onClick={() => setPreviewMode('book')}
          >
            📖 3D Storybook Preview
          </button>
          <button
            type="button"
            className={`${styles.sideBtn} ${previewMode === 'final' ? styles.sideBtnActive : ''}`}
            onClick={() => setPreviewMode('final')}
          >
            🚀 Final Proposal Preview
          </button>
        </div>
      </div>

      {previewMode === 'book' ? (
        /* 1. Master 3D Storybook Preview */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Navigation Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--admin-bg-surface)',
              border: '1px solid var(--admin-border)',
              borderRadius: '10px',
              padding: '10px 18px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setTurnProgress((p) => Math.max(0, p - 1.0))}
                disabled={turnProgress <= 0}
              >
                ◀ Previous Page
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setTurnProgress((p) => Math.min(4.0, p + 1.0))}
                disabled={turnProgress >= 4.0}
              >
                Next Page ▶
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setAutoPlay((a) => !a)}
                style={{
                  background: autoPlay ? 'rgba(229, 189, 117, 0.25)' : undefined,
                  borderColor: autoPlay ? 'var(--admin-gold-primary)' : undefined,
                }}
              >
                {autoPlay ? '⏸ Pause Auto-Turn' : '▶ Auto-Turn Pages'}
              </button>
            </div>

            {/* Direct Spread Jump */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.80rem', color: 'var(--admin-text-subtle)' }}>Jump to:</span>
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.spreadTab}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    background: Math.floor(turnProgress) === idx ? 'rgba(229,189,117,0.2)' : undefined,
                    borderColor: Math.floor(turnProgress) === idx ? 'var(--admin-gold-primary)' : undefined,
                  }}
                  onClick={() => setTurnProgress(idx)}
                >
                  Spread {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Physical Book Viewport */}
          <div
            style={{
              width: '100%',
              height: '620px',
              background: '#0d0a08',
              borderRadius: '14px',
              border: '1px solid var(--admin-border)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Sunset Garden Backdrop */}
            <img
              src="/garden/garden_base_master.png"
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.85)',
                pointerEvents: 'none',
              }}
            />

            {/* Live ThreePageFlipPrototype */}
            <ThreePageFlipPrototype
              turnProgress={turnProgress}
              coverProgress={coverProgress}
              showControls={false}
              spreads={content.spreads}
            />
          </div>

          {/* Progress Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '0 8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', minWidth: '90px' }}>
              Turn Scrub: {turnProgress.toFixed(2)} / 4.0
            </span>
            <input
              type="range"
              min="0"
              max="4"
              step="0.01"
              value={turnProgress}
              onChange={(e) => {
                setAutoPlay(false);
                setTurnProgress(parseFloat(e.target.value));
              }}
              style={{ flex: 1, accentColor: 'var(--admin-gold-primary)' }}
            />
          </div>
        </div>
      ) : (
        /* 2. Final Proposal Preview */
        <div
          style={{
            width: '100%',
            height: '620px',
            borderRadius: '14px',
            border: '1px solid var(--admin-border)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Panoramic Rocket Backdrop */}
          <img
            src="/scenes/seamless_garden_panorama_hd.jpg"
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: '85% center', // Focus on rocket
            }}
          />

          {/* Resting Butterfly on Tip */}
          <div
            style={{
              position: 'absolute',
              left: '81.5%',
              top: '13.5%',
              transform: 'translate(-50%, -50%) scale(1.25)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <img
              src="/butterfly/butterfly_full.png"
              alt=""
              style={{ width: '42px', height: '42px', filter: 'drop-shadow(0 0 12px rgba(255,215,120,0.8))' }}
            />
          </div>

          {/* Live Final Question Modal */}
          <FinalQuestionModal isLandedOnTip={true} />
        </div>
      )}
    </div>
  );
};
