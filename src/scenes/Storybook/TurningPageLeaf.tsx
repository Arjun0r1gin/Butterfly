/**
 * BUTTERFLY — TurningPageLeaf Component
 *
 * Implements physical double-sided 3D page leaf that flexes and curls around the central spiral spine:
 * - Anchored at the spiral binding (transform-origin: left center)
 * - 3D Curvilinear Arch Wrapper (rotateY, translateZ lift, translateY arch rise, foreshortening)
 * - Dynamic Left-Stack Cast Shadow (matches Reference Image 3)
 * - Dynamic Right-Stack Lift Shadow
 * - Front Face: Right page of current spread
 * - Back Face: Left page of next spread (revealed as page arches over)
 * - Moving Specular Ridge Highlight
 */

import { forwardRef } from 'react';
import type { StorySpread } from './types';
import { RightPageContent } from './RightPageContent';
import { LeftPageContent } from './LeftPageContent';
import styles from './Storybook.module.css';

export interface TurningPageLeafProps {
  currentSpread: StorySpread;
  nextSpread: StorySpread;
  zIndex: number;
}

export const TurningPageLeaf = forwardRef<HTMLDivElement, TurningPageLeafProps>(
  function TurningPageLeaf({ currentSpread, nextSpread, zIndex }, ref) {
    return (
      <div
        ref={ref}
        className={styles.turningLeaf}
        style={{ zIndex }}
        data-leaf-index={currentSpread.spreadIndex}
      >
        {/* Dynamic Cast Shadow onto Left Page Stack (Anchored at Spine) */}
        <div
          className={styles.castShadowLeft}
          data-element="cast-shadow-left"
          aria-hidden="true"
        />

        {/* Dynamic Lift Shadow on Right Stack directly underneath page */}
        <div
          className={styles.liftShadowRight}
          data-element="lift-shadow-right"
          aria-hidden="true"
        />

        {/* 3D Curvilinear Paper Arch Wrapper */}
        <div className={styles.curlWrapper} data-element="curl-wrapper">
          {/* Front Face: Right page of current spread (facing user initially) */}
          <div className={`${styles.pageFace} ${styles.faceFront}`}>
            <RightPageContent pageData={currentSpread.rightPage} />

            {/* Specular Ridge Highlight on crest of paper cylinder */}
            <div
              className={styles.ridgeHighlight}
              data-element="front-highlight"
              aria-hidden="true"
            />

            {/* Ambient shading gradient during rotation */}
            <div
              className={styles.pageShading}
              data-shading="front"
              aria-hidden="true"
            />
          </div>

          {/* Back Face: Left page of next spread (revealed as paper arches left) */}
          <div className={`${styles.pageFace} ${styles.faceBack}`}>
            <LeftPageContent pageData={nextSpread.leftPage} />

            {/* Specular Ridge Highlight on reverse face */}
            <div
              className={styles.ridgeHighlight}
              data-element="back-highlight"
              aria-hidden="true"
            />

            {/* Ambient shading gradient during rotation */}
            <div
              className={styles.pageShading}
              data-shading="back"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    );
  }
);
