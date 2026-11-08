/**
 * BUTTERFLY — Realistic Spiral Page-Turning Physics Engine
 *
 * Implements physical paper mechanics around the vertical spiral binding:
 * - Curvilinear cylindrical 3D bending & arching (replaces flat rotateY)
 * - 3D arch lift in Z towards viewer (translateZ)
 * - Vertical paper bowing (translateY & skewY matching Reference Image 2 & 3)
 * - Outer edge flexible curl (secondary flap rotation)
 * - Dynamic contact cast shadow onto the left page stack
 * - Dynamic lift shadow on the right page stack
 * - Specular ridge highlight along the cylinder crest
 * - Dynamic z-index layering when passing 90 degrees
 */

export interface LeafDomRefs {
  root: HTMLElement;
  curlWrapper?: HTMLElement | null;
  outerFlap?: HTMLElement | null;
  castShadowLeft?: HTMLElement | null;
  liftShadowRight?: HTMLElement | null;
  frontHighlight?: HTMLElement | null;
  backHighlight?: HTMLElement | null;
  frontShading?: HTMLElement | null;
  backShading?: HTMLElement | null;
}

export function queryLeafDomRefs(root: HTMLElement): LeafDomRefs {
  return {
    root,
    curlWrapper: root.querySelector('[data-element="curl-wrapper"]') as HTMLElement | null,
    outerFlap: root.querySelector('[data-element="outer-flap"]') as HTMLElement | null,
    castShadowLeft: root.querySelector('[data-element="cast-shadow-left"]') as HTMLElement | null,
    liftShadowRight: root.querySelector('[data-element="lift-shadow-right"]') as HTMLElement | null,
    frontHighlight: root.querySelector('[data-element="front-highlight"]') as HTMLElement | null,
    backHighlight: root.querySelector('[data-element="back-highlight"]') as HTMLElement | null,
    frontShading: root.querySelector('[data-shading="front"]') as HTMLElement | null,
    backShading: root.querySelector('[data-shading="back"]') as HTMLElement | null,
  };
}

/**
 * Applies realistic paper curvature, 3D lift, and dynamic shadows at normalized progress t in [0.0, 1.0].
 * - t = 0.0: Perfectly flat resting on the right page stack
 * - t = 0.25: Outer edge lifts, initial cylindrical bow forms, shadow appears on left spine
 * - t = 0.50: Halfway turn matching Reference Image 3! High 3D arch, peak cast shadow on left stack,
 *             underlying right page revealed, reverse side exposed
 * - t = 0.75: Curving over the spiral onto left stack, back side facing viewer
 * - t = 1.00: Completely settled flat on the left page stack
 */
export function applyRealisticPageTurnPhysics(
  refs: LeafDomRefs,
  progress: number,
  leafIndex: number = 0
): void {
  const t = Math.max(0, Math.min(1, progress));
  const archFactor = Math.sin(t * Math.PI);
  const angle = -180 * t;

  const {
    root,
    curlWrapper,
    outerFlap,
    castShadowLeft,
    liftShadowRight,
    frontHighlight,
    backHighlight,
  } = refs;

  // 1. Z-Index Stacking
  if (root) {
    // When leaf passes 90deg (t = 0.5), it switches from right stack priority to left stack priority
    root.style.zIndex = (t < 0.5 ? 30 - leafIndex : 10 + leafIndex).toString();
  }

  // 2. Main 3D Curvilinear Arch Transformation
  if (curlWrapper) {
    const tz = (archFactor * 72).toFixed(1);          // Rises towards viewer in 3D
    const ty = (-archFactor * 26).toFixed(1);         // Arches upward at top edge
    const sx = (1 - archFactor * 0.16).toFixed(3);     // Cylindrical foreshortening
    const skew = (-archFactor * 3.6).toFixed(2);      // Subtle natural page shear

    curlWrapper.style.transform = `rotateY(${angle.toFixed(2)}deg) translateZ(${tz}px) translateY(${ty}px) scaleX(${sx}) skewY(${skew}deg)`;
  }

  // 3. Secondary Outer Page Flap Curl (flexible paper lip)
  if (outerFlap) {
    const flapAngle = t < 0.5 ? -archFactor * 20 : archFactor * 15;
    outerFlap.style.transform = `rotateY(${flapAngle.toFixed(1)}deg)`;
  }

  // 4. Dynamic Cast Shadow onto Left Stack (matches Reference Image 3)
  if (castShadowLeft) {
    if (t < 0.015) {
      castShadowLeft.style.opacity = '0';
    } else {
      const shadowOpacity = (archFactor * 0.62).toFixed(3);
      // Expands leftward from the central spine as the arch widens
      const shadowWidth = (0.25 + 0.75 * Math.min(1, t * 1.5)).toFixed(3);
      const shadowSkew = (-archFactor * 12).toFixed(1);

      castShadowLeft.style.opacity = shadowOpacity;
      castShadowLeft.style.transform = `scaleX(${shadowWidth}) skewY(${shadowSkew}deg)`;
    }
  }

  // 5. Dynamic Lift Shadow underneath on Right Stack
  if (liftShadowRight) {
    if (t < 0.01 || t > 0.95) {
      liftShadowRight.style.opacity = '0';
    } else {
      const rightOpacity = ((1 - t) * archFactor * 0.45).toFixed(3);
      liftShadowRight.style.opacity = rightOpacity;
    }
  }

  // 6. Dynamic Specular Ridge Highlight & Soft Surface Shading
  if (frontHighlight) {
    frontHighlight.style.opacity = t < 0.5 ? (archFactor * 0.42).toFixed(3) : '0';
  }
  if (backHighlight) {
    backHighlight.style.opacity = t >= 0.5 ? (archFactor * 0.42).toFixed(3) : '0';
  }
}

