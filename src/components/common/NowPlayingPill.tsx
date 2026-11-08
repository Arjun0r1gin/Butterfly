/**
 * BUTTERFLY — Floating "Now Playing" Audio Pill Component
 * Follows exact visual reference from user:
 * Translucent dark walnut pill, play/pause button, "Now Playing" heading,
 * cursive song title, dancing equalizer bars, and close button.
 */

import React, { useEffect, useState } from 'react';
import { audioPlayer, type AudioPlayerState } from '../../services/audio/audioPlayer';
import styles from './NowPlayingPill.module.css';

export interface NowPlayingPillProps {
  className?: string;
  defaultPosition?: { x: number; y: number };
}

export const NowPlayingPill: React.FC<NowPlayingPillProps> = ({
  className = '',
  defaultPosition,
}) => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>(() => audioPlayer.getState());

  useEffect(() => {
    return audioPlayer.subscribe((state) => {
      setPlayerState(state);
    });
  }, []);

  if (!playerState.activeMarkerId) {
    return null;
  }

  // Position calculation: anchorPosition > defaultPosition > centered bottom
  const pos = playerState.anchorPosition || defaultPosition;

  let posStyle: React.CSSProperties = {
    bottom: '48px',
    left: '50%',
    transform: 'translateX(-50%)',
  };

  if (pos && pos.x > 0 && pos.y > 0) {
    // Avoid running off-screen
    const maxX = typeof window !== 'undefined' ? window.innerWidth - 260 : 1200;
    const maxY = typeof window !== 'undefined' ? window.innerHeight - 60 : 800;
    const clampedX = Math.min(Math.max(16, pos.x), maxX);
    const clampedY = Math.min(Math.max(16, pos.y), maxY);

    posStyle = {
      left: `${clampedX}px`,
      top: `${clampedY}px`,
      transform: 'none',
    };
  }

  return (
    <div
      className={`${styles.nowPlayingWrapper} ${className}`.trim()}
      style={posStyle}
      role="region"
      aria-label="Audio Playback Controller"
    >
      <div className={styles.pillContainer}>
        {/* Play / Pause Circular Button */}
        <button
          type="button"
          className={styles.playPauseBtn}
          onClick={() => audioPlayer.toggle()}
          title={playerState.isPlaying ? 'Pause' : 'Play'}
          aria-label={playerState.isPlaying ? 'Pause Audio' : 'Play Audio'}
        >
          {playerState.isPlaying ? '⏸' : '▶'}
        </button>

        {/* Track Details */}
        <div className={styles.songInfo}>
          <span className={styles.nowPlayingLabel}>Now Playing</span>
          <span className={styles.songTitle}>
            {playerState.title || 'Our Storybook Melody ♡'}
          </span>
        </div>

        {/* Animated Equalizer Bars */}
        <div
          className={`${styles.equalizer} ${playerState.isPlaying ? styles.eqActive : ''}`}
          aria-hidden="true"
        >
          <span className={styles.eqBar} />
          <span className={styles.eqBar} />
          <span className={styles.eqBar} />
          <span className={styles.eqBar} />
          <span className={styles.eqBar} />
        </div>

        {/* Close Button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => audioPlayer.stop()}
          title="Stop & Close Player"
          aria-label="Stop audio"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
