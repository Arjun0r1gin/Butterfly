/**
 * BUTTERFLY — Continuous Panoramic Sunset Garden Journey & Storybook Experience
 *
 * Single Continuous Panoramic Camera Pan:
 * 1. The Sunset Wildflower Meadow (Left viewport)
 *    - Flower fall handover; butterfly explores the open golden sunset meadow.
 * 2. Camera travels seamlessly rightward across the unified landscape.
 *    - Continuous horizon, lighting, hills, and sky with zero seams or image panels.
 *    - Pergola garden enters frame naturally; Memory Book reveals.
 * 3. Butterfly approaches and lands on top-right corner of Storybook.
 *    - Interactive 3D physical page turns with real-time cylinder curling.
 * 4. Butterfly takes off upward and rightward as camera continues to the Rocket Observatory.
 *    - Stone launchpad and vintage retro rocket revealed on the right terrace.
 *    - Butterfly lands gracefully on the vintage rocket overlooking the cosmic galaxy.
 */

import { useRef, memo, useCallback, useState, useEffect } from 'react';
import { SceneContainer } from '../../components/common/SceneContainer';
import { SCENE_IDS } from '../../utils/constants';
import { FlowerTunnel } from '../FlowerTunnel';
import { Butterfly } from '../../components/Butterfly';
import { STORYBOOK_SPREADS } from '../Storybook/storybookData';
import { ThreePageFlipPrototype } from '../Storybook/ThreePageFlipPrototype';
import { GlobalAtmosphere, type EnvState } from '../../components/Environment/GlobalAtmosphere';
import { FinalQuestionModal } from '../../components/RocketInteraction/FinalQuestionModal';
import type { SequenceTimelineState } from '../FlowerTunnel/types';
import styles from './CinematicSequence.module.css';

export interface CinematicSequenceProps {
  className?: string;
  onSpreadChange?: (spreadIndex: number) => void;
}

// =============================================================================
// C1-Continuous Global Camera Motion Profile Constants
// Mathematically guarantees continuous velocity (first derivative) across the entire journey.
// Cruising speed before and after Pergola hold is 100% IDENTICAL (zero speed jumps).
// =============================================================================
export const D_START = 0.03;
export const D_END = 0.03;
export const D_EASE = 0.04;
export const D_HOLD = 0.40; // Generous reading & page turn hold

const EFF_TIME = 1.0 - D_HOLD - D_EASE - 0.5 * (D_START + D_END);
export const V0 = 1.0 / EFF_TIME;

const T_CRUISE1 = 0.52 / V0 - 0.5 * (D_START + D_EASE);
const T_CRUISE2 = 0.48 / V0 - 0.5 * (D_EASE + D_END);

export const P0 = 0.0;
export const P1 = P0 + D_START;
export const P2 = P1 + T_CRUISE1;
export const P3 = P2 + D_EASE;           // Arrives at Pergola X = 0.52
export const P4 = P3 + D_HOLD;           // Pergola reading hold ends
export const P5 = P4 + D_EASE;
export const P6 = P5 + T_CRUISE2;
export const P7 = 1.0;                   // Settles on Rocket

const X0 = 0.0;
const X1 = 0.5 * V0 * D_START;
const X2 = X1 + V0 * T_CRUISE1;
const X3 = 0.52;
const X4 = 0.52;
const X5 = X4 + 0.5 * V0 * D_EASE;
const X6 = X5 + V0 * T_CRUISE2;
const X7 = 1.0;

function hermite(t: number, Xa: number, Xb: number, Va_s: number, Vb_s: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * Xa + (t3 - 2 * t2 + t) * Va_s + (-2 * t3 + 3 * t2) * Xb + (t3 - t2) * Vb_s;
}

export function getCameraPanFraction(p: number): number {
  const clampedP = Math.max(0.0, Math.min(1.0, p));
  if (clampedP <= P1) {
    const t = (clampedP - P0) / D_START;
    return hermite(t, X0, X1, 0.0, V0 * D_START);
  } else if (clampedP <= P2) {
    return X1 + V0 * (clampedP - P1);
  } else if (clampedP <= P3) {
    const t = (clampedP - P2) / D_EASE;
    return hermite(t, X2, X3, V0 * D_EASE, 0.0);
  } else if (clampedP <= P4) {
    return X3;
  } else if (clampedP <= P5) {
    const t = (clampedP - P4) / D_EASE;
    return hermite(t, X4, X5, 0.0, V0 * D_EASE);
  } else if (clampedP <= P6) {
    return X5 + V0 * (clampedP - P5);
  } else {
    const t = (clampedP - P6) / D_END;
    return hermite(t, X6, X7, V0 * D_END, 0.0);
  }
}

// =============================================================================
// Continuous Butterfly Choreography Along Global Progress Curve
// =============================================================================
interface ButterflyKeyframe {
  p: number;
  x: number;     // vw
  y: number;     // vh
  scale: number;
  rot: number;   // deg
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0.0, Math.min(1.0, (x - e0) / (e1 - e0)));
  return t * t * (3.0 - 2.0 * t);
}

export function getRocketTipLandingCoords(vw: number, vh: number) {
  const contW = Math.max(vh * 3.656, 2.2 * vw);
  const contH = vh;
  const imgW = 3868;
  const imgH = 1058;
  const imgAR = imgW / imgH;
  const contAR = contW / contH;

  let scale: number;
  let offsetY = 0;
  if (contAR >= imgAR) {
    scale = contW / imgW;
    const renderedH = imgH * scale;
    offsetY = (contH - renderedH) / 2.0;
  } else {
    scale = contH / imgH;
  }

  // Exact pointed apex tip of rocket nose cone
  const tipPanoX = 3535;
  const tipPanoY = 234;

  const tipContX = tipPanoX * scale;
  const tipContY = offsetY + tipPanoY * scale;

  const maxPanX = Math.max(0, contW - vw);
  const tipScreenX = tipContX - maxPanX;
  const tipScreenY = tipContY;

  const feetOffsetPx = 28;
  const landingScreenY = tipScreenY - feetOffsetPx;

  return {
    x: (tipScreenX / vw) * 100,
    y: (landingScreenY / vh) * 100,
  };
}

function getButterflyState(p: number, isMobile: boolean, vw: number = 1600, vh: number = 900) {
  const targetBookX = isMobile ? 82 : 86;
  const targetBookY = isMobile ? 16 : 13;
  const rocketTip = getRocketTipLandingCoords(vw, vh);
  const targetRocketX = rocketTip.x;
  const targetRocketY = rocketTip.y;

  const keyframes: ButterflyKeyframe[] = [
    { p: 0.00, x: 48, y: 48, scale: 0.85, rot: 4 },
    { p: 0.12, x: 38, y: 38, scale: 1.05, rot: -8 },
    { p: 0.24, x: 34, y: 32, scale: 1.10, rot: 6 },
    { p: 0.30, x: 38, y: 30, scale: 1.05, rot: 10 },
    { p: 0.35, x: 48, y: 44, scale: 0.94, rot: 8 },
    { p: 0.3886, x: 54.0, y: 53.6, scale: 0.82, rot: 0 }, // Lands gently on gilded butterfly medallion!
    { p: 0.42, x: 54.0, y: 53.6, scale: 0.82, rot: 0 },   // Resting on cover
    { p: 0.45, x: 68, y: 30, scale: 0.84, rot: 8 },   // Flutters upward as book opens
    { p: 0.48, x: targetBookX, y: targetBookY, scale: 0.82, rot: 2 }, // Perches on top-right of open book
    { p: 0.78, x: targetBookX, y: targetBookY, scale: 0.82, rot: 2 }, // Comfortably perched throughout reading & page turns!
    { p: 0.81, x: 70, y: 22, scale: 0.98, rot: 12 },  // Smooth takeoff toward rocket
    { p: 0.88, x: isMobile ? 45 : 74, y: isMobile ? 23 : 22, scale: 1.12, rot: 8 },
    { p: 0.94, x: isMobile ? targetRocketX + 3.0 : targetRocketX - 1.5, y: targetRocketY - 2.8, scale: 1.25, rot: 4 },
    { p: 0.98, x: targetRocketX, y: targetRocketY, scale: 1.28, rot: 2 }, // Settled on rocket nose cone tip
    { p: 1.00, x: targetRocketX, y: targetRocketY, scale: 1.28, rot: 2 },
  ];

  const clampedP = Math.max(0.0, Math.min(1.0, p));
  for (let i = 0; i < keyframes.length - 1; i++) {
    const k0 = keyframes[i];
    const k1 = keyframes[i + 1];
    if (clampedP <= k1.p) {
      const sm = smoothstep(k0.p, k1.p, clampedP);
      return {
        x: k0.x + (k1.x - k0.x) * sm,
        y: k0.y + (k1.y - k0.y) * sm,
        scale: k0.scale + (k1.scale - k0.scale) * sm,
        rot: k0.rot + (k1.rot - k0.rot) * sm,
      };
    }
  }
  return keyframes[keyframes.length - 1];
}

export const CinematicSequence = memo(function CinematicSequence({
  className = '',
  onSpreadChange,
}: CinematicSequenceProps) {
  const containerRef = useRef<HTMLElement>(null);
  const worldContainerRef = useRef<HTMLDivElement>(null);
  const openBookStageRef = useRef<HTMLDivElement>(null);
  const tunnelLayerRef = useRef<HTMLDivElement>(null);
  const butterflyActorRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const hintTextSpanRef = useRef<HTMLSpanElement>(null);

  const [isHoveringWing, setIsHoveringWing] = useState(false);
  const isHoveringWingRef = useRef(false);
  const [turnProgress, setTurnProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(1.0);

  const onSpreadChangeRef = useRef(onSpreadChange);
  useEffect(() => {
    onSpreadChangeRef.current = onSpreadChange;
  });

  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const spreads = STORYBOOK_SPREADS;

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isDirectMode =
    params !== null &&
    (params.has('scene') ||
     params.has('progress') ||
     params.has('spread') ||
     params.has('qa') ||
     params.has('yes') ||
     params.has('stage') ||
     params.has('gif_progress') ||
     params.has('benchmark'));
  const isGardenDirect = isDirectMode;
  const isWorldRevealedRef = useRef(isDirectMode);
  // Opening scroll lock: strictly locks wheel/touch/key inputs while opening flower animation plays
  const isScrollLockedRef = useRef(!isGardenDirect);
  const [isLandedOnTip, setIsLandedOnTip] = useState(false);
  const isLandedOnTipRef = useRef(false);
  const applyFrameRef = useRef<((p: number) => void) | null>(null);

  const envStateRef = useRef<EnvState>({
    progress: 0,
    cameraPanX: 0,
    worldWidth: 4000,
    isRevealed: isDirectMode,
  });

  const unlockScroll = useCallback(() => {
    isScrollLockedRef.current = false;
    isWorldRevealedRef.current = true;
    envStateRef.current.isRevealed = true;
    if (worldContainerRef.current) {
      worldContainerRef.current.style.opacity = '1';
    }
    if (butterflyActorRef.current) {
      butterflyActorRef.current.style.opacity = '1';
    }
    if (tunnelLayerRef.current) {
      tunnelLayerRef.current.style.opacity = '0';
      tunnelLayerRef.current.style.pointerEvents = 'none';
      tunnelLayerRef.current.style.display = 'none';
    }
    if (scrollHintRef.current) {
      scrollHintRef.current.style.opacity = '1';
    }
  }, []);

  const handleTunnelComplete = useCallback(() => {
    unlockScroll();
  }, [unlockScroll]);

  const handleReplay = useCallback(() => {
    targetProgressRef.current = 0;
    currentProgressRef.current = 0;
    isScrollLockedRef.current = false;
    isLandedOnTipRef.current = false;
    setIsLandedOnTip(false);
    applyFrameRef.current?.(0);
  }, []);

  // ---------------------------------------------------------------------------
  // 1. Flower Tunnel Waterfall Drop & Butterfly Emergence Handover
  // ---------------------------------------------------------------------------
  const handleTunnelStateUpdate = useCallback((state: SequenceTimelineState) => {
    if (worldContainerRef.current) {
      worldContainerRef.current.style.opacity = state.gardenOpacity.toString();
      if (state.gardenOpacity > 0.1) {
        envStateRef.current.isRevealed = true;
      }
    }

    if (butterflyActorRef.current) {
      const bf = butterflyActorRef.current;
      if (state.fallProgress > 0.15) {
        const emergeProgress = Math.min(1, (state.fallProgress - 0.15) / 0.65);
        bf.style.opacity = emergeProgress.toString();
        const startX = 48 + Math.sin(state.fallProgress * 6) * 1.5;
        const startY = 48 - emergeProgress * 2.0;
        const scale = 0.35 + emergeProgress * 0.50;
        const tilt = Math.cos(state.fallProgress * 5) * 8;
        bf.style.left = `${startX}vw`;
        bf.style.top = `${startY}vh`;
        bf.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${tilt}deg)`;
      } else {
        bf.style.opacity = '0';
      }
    }

    // When flowers have finished cascading down and garden is revealed, unlock scrolling cleanly
    if (state.fallProgress >= 0.98 || state.transitionProgress >= 0.98) {
      unlockScroll();
    }
  }, [unlockScroll]);

  // ---------------------------------------------------------------------------
  // 2. Global C1-Continuous Camera Pan & Choreography Controller
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const stage = containerRef.current;
    const world = worldContainerRef.current;
    const bf = butterflyActorRef.current;
    const openStage = openBookStageRef.current;
    const hint = scrollHintRef.current;
    if (!stage || !world || !bf || !openStage) return;

    const isMobile = window.innerWidth <= 768;

    const getMaxPanX = () => {
      if (!worldContainerRef.current) return window.innerWidth * 1.2;
      return Math.max(0, worldContainerRef.current.offsetWidth - window.innerWidth);
    };

    const initialRevealed = isDirectMode || isWorldRevealedRef.current;
    world.style.opacity = initialRevealed ? '1' : '0';
    bf.style.opacity = initialRevealed ? '1' : '0';

    // Unified frame applicator driven by global progress p in [0.0, 1.0]
    const applyFrame = (p: number) => {
      if (isWorldRevealedRef.current) {
        if (world.style.opacity === '0') world.style.opacity = '1';
        if (bf.style.opacity === '0') bf.style.opacity = '1';
      }

      // One Continuous Camera Motion Curve (C1 continuous everywhere, zero speed jumps)
      const camFraction = getCameraPanFraction(p);
      const panX = camFraction * getMaxPanX();
      world.style.transform = `translate3d(${-panX}px, 0, 0)`;

      // Synchronize global procedural environment effects with camera pan
      envStateRef.current.progress = p;
      envStateRef.current.cameraPanX = panX;
      if (worldContainerRef.current) {
        envStateRef.current.worldWidth = worldContainerRef.current.offsetWidth;
      }
      if (isWorldRevealedRef.current) {
        envStateRef.current.isRevealed = true;
      }

      // Continuous Butterfly Trajectory
      const bfState = getButterflyState(p, isMobile, window.innerWidth, window.innerHeight);
      bf.style.left = `${bfState.x}vw`;
      bf.style.top = `${bfState.y}vh`;
      bf.style.transform = `translate(-50%, -50%) scale(${bfState.scale}) rotate(${bfState.rot}deg)`;

      // Hover Wing Mode: gentle hovering while landed on closed cover, open book, or rocket
      const shouldHover = (p >= 0.3886 && p <= 0.42) || (p >= 0.48 && p <= 0.78) || p >= 0.96;
      if (shouldHover !== isHoveringWingRef.current) {
        isHoveringWingRef.current = shouldHover;
        setIsHoveringWing(shouldHover);
      }

      // Final Question & YES/NO Interaction Trigger (p >= 0.98)
      const landed = p >= 0.98;
      if (landed !== isLandedOnTipRef.current) {
        isLandedOnTipRef.current = landed;
        setIsLandedOnTip(landed);
      }

      // Unified Physical Storybook Lifecycle (Presence in Pergola, Opening, Multi-Sheet Reading)
      if (openStage) {
        if (p < 0.42) {
          // STATE B: Closed antique leather book ALREADY PHYSICALLY PRESENT in pergola garden.
          // Anchored in pergola world coordinates: glides naturally into view with the landscape!
          const maxPan = getMaxPanX();
          const pergolaPanX = 0.52 * maxPan;
          const worldBookX = pergolaPanX + window.innerWidth * 0.54;
          const currentBookScreenX = worldBookX - panX;

          openStage.style.opacity = '1';
          openStage.style.visibility =
            currentBookScreenX > -500 && currentBookScreenX < window.innerWidth + 500
              ? 'visible'
              : 'hidden';
          openStage.style.pointerEvents = 'none';
          openStage.style.top = '56%';
          openStage.style.left = `${currentBookScreenX}px`;
          openStage.style.transform = 'translate(-50%, -50%) scale(0.68)';
          setCoverProgress(0);
          setTurnProgress(0);
        } else if (p >= 0.42 && p < 0.48) {
          // STATE C: Continuous Physical Opening Transition
          // 3D cover rotates 0 -> -180 deg, book smoothly expands 0.68 -> 1.0 and centers in viewport!
          const tOpen = smoothstep(0.42, 0.48, p);
          openStage.style.opacity = '1';
          openStage.style.visibility = 'visible';
          openStage.style.pointerEvents = 'auto';
          const topPct = 56 - tOpen * 6;
          const leftPct = 54 - tOpen * 4;
          const curScale = 0.68 + tOpen * 0.32;
          openStage.style.top = `${topPct}%`;
          openStage.style.left = `${leftPct}%`;
          openStage.style.transform = `translate(-50%, -50%) scale(${curScale})`;
          setCoverProgress(tOpen);
          setTurnProgress(0);
        } else if (p >= 0.48 && p <= 0.78) {
          // STATE D: Multi-Sheet Blank Scrapbook Reading Zone (4 physical leaves curling sequentially)
          openStage.style.opacity = '1';
          openStage.style.visibility = 'visible';
          openStage.style.pointerEvents = 'auto';
          openStage.style.top = '50%';
          openStage.style.left = '50%';
          openStage.style.transform = 'translate(-50%, -50%) scale(1.0)';
          setCoverProgress(1.0);

          const readProg = Math.max(0, Math.min(1, (p - 0.48) / (0.78 - 0.48)));
          // Map to 4 physical sheets with comfortable reading pauses between turns
          const T = readProg * 4.0;
          const sheetIdx = Math.min(3, Math.floor(T));
          const sheetU = T - sheetIdx; // in [0, 1]
          let localCurl = 0;
          if (sheetU <= 0.18) {
            localCurl = 0; // Settled spread reading hold
          } else if (sheetU >= 0.82) {
            localCurl = 1; // Turned spread reading hold
          } else {
            localCurl = smoothstep(0.18, 0.82, sheetU);
          }
          const activeTurnT = sheetIdx + localCurl;
          setTurnProgress(activeTurnT);

          const spreadIndex = localCurl >= 0.98 ? Math.min(4, sheetIdx + 1) : sheetIdx;
          if (onSpreadChangeRef.current) onSpreadChangeRef.current(spreadIndex);
        } else {
          // STATE E: Departure toward Rocket (p > 0.78)
          setCoverProgress(1.0);
          setTurnProgress(4.0);
          const leaveProg = smoothstep(0.78, 0.84, p);
          openStage.style.opacity = (1 - leaveProg).toString();
          openStage.style.pointerEvents = 'none';
          if (p > 0.84) openStage.style.visibility = 'hidden';
        }
      }

      // Dynamic Narrative Hint Guidance
      if (hint) {
        hint.style.opacity = '1';
        let currentHint = 'Scroll right to explore garden';
        if (p < 0.28) {
          currentHint = 'Scroll right to explore garden';
        } else if (p < 0.3886) {
          currentHint = 'Follow butterfly to the memory book';
        } else if (p < 0.42) {
          currentHint = 'Butterfly resting on the book cover...';
        } else if (p < 0.48) {
          currentHint = 'The storybook awakens...';
        } else if (p <= 0.78) {
          const readProg = (p - 0.48) / (0.78 - 0.48);
          const tVal = readProg * 4.0;
          if (tVal < 0.9) currentHint = 'Scroll to turn page (1/4)';
          else if (tVal < 1.9) currentHint = 'Scroll to turn page (2/4)';
          else if (tVal < 2.9) currentHint = 'Scroll to turn page (3/4)';
          else if (tVal < 3.9) currentHint = 'Scroll to turn page (4/4)';
          else currentHint = 'Journey onward with the butterfly';
        } else if (p < 0.95) {
          currentHint = 'Follow butterfly to the rocket';
        } else {
          currentHint = 'Butterfly perched on rocket tip ✨';
        }
        if (hintTextSpanRef.current && hintTextSpanRef.current.textContent !== currentHint) {
          hintTextSpanRef.current.textContent = currentHint;
        }
      }
    };

    applyFrameRef.current = applyFrame;

    // -------------------------------------------------------------------------
    // 3. Smooth Virtual Scroll Controller with Opening Scroll Lock & Sensitivity Calibration
    // -------------------------------------------------------------------------
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Block all wheel inputs during opening flower animation
      if (isScrollLockedRef.current) {
        return;
      }
      const rawDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      // In reading zone (p in [0.44, 0.78]), reduce delta for comfortable, gradual pace
      const isReadingZone = currentProgressRef.current >= 0.44 && currentProgressRef.current <= 0.78;
      const sensitivity = isReadingZone ? 0.00009 : 0.00028;
      const delta = rawDelta * sensitivity;
      targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current + delta));
    };

    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        // Block all touch gesture progression during opening flower animation
        if (isScrollLockedRef.current) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          return;
        }
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = touchStartX - currentX;
        const diffY = touchStartY - currentY;
        const primaryDelta = Math.abs(diffX) > Math.abs(diffY) ? diffX : diffY;
        const isReadingZone = currentProgressRef.current >= 0.44 && currentProgressRef.current <= 0.78;
        const sensitivity = isReadingZone ? 0.0006 : 0.0018;
        const delta = primaryDelta * sensitivity;
        touchStartX = currentX;
        touchStartY = currentY;
        targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current + delta));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block navigation keys during opening flower animation
      if (isScrollLockedRef.current) {
        if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) {
          e.preventDefault();
        }
        return;
      }
      const isReadingZone = currentProgressRef.current >= 0.44 && currentProgressRef.current <= 0.78;
      const step = isReadingZone ? 0.012 : 0.035;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        targetProgressRef.current = Math.min(1, targetProgressRef.current + step);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - step);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    // High-Performance 60 FPS Momentum Damping Loop
    const updateLoop = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.00004) {
        currentProgressRef.current += diff * 0.082;
        applyFrame(currentProgressRef.current);
      }
      rafIdRef.current = requestAnimationFrame(updateLoop);
    };
    rafIdRef.current = requestAnimationFrame(updateLoop);

    // Direct URL parameter inspection (?progress=X, ?spread=X, ?scene=X)
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const progressParam = urlParams?.get('progress');
    const spreadParam = urlParams?.get('spread');
    const sceneParam = urlParams?.get('scene');

    if (progressParam !== null && progressParam !== undefined) {
      const p = parseFloat(progressParam);
      targetProgressRef.current = p;
      currentProgressRef.current = p;
      applyFrame(p);
      isWorldRevealedRef.current = true;
      world.style.opacity = '1';
      bf.style.opacity = '1';
    } else if (spreadParam !== null && spreadParam !== undefined) {
      const sIdx = parseInt(spreadParam, 10);
      const targetP = sIdx === 0 ? 0.50 : 0.74;
      targetProgressRef.current = targetP;
      currentProgressRef.current = targetP;
      applyFrame(targetP);
      isWorldRevealedRef.current = true;
      world.style.opacity = '1';
      bf.style.opacity = '1';
    } else if (sceneParam === '2' || sceneParam === 'book') {
      targetProgressRef.current = 0.50;
      currentProgressRef.current = 0.50;
      applyFrame(0.50);
      isWorldRevealedRef.current = true;
      world.style.opacity = '1';
      bf.style.opacity = '1';
    } else if (sceneParam === '3' || sceneParam === 'rocket') {
      targetProgressRef.current = 0.98;
      currentProgressRef.current = 0.98;
      applyFrame(0.98);
      isWorldRevealedRef.current = true;
      world.style.opacity = '1';
      bf.style.opacity = '1';
    } else {
      applyFrame(0);
    }

    return () => {
      applyFrameRef.current = null;
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isDirectMode, spreads.length]);

  return (
    <SceneContainer
      ref={containerRef}
      sceneId={SCENE_IDS.GARDEN}
      className={`${styles.sequenceContainer} ${className}`.trim()}
      aria-label="Continuous Panoramic Sunset Garden Journey & Storybook Experience"
    >
      <div className={styles.pinnedStage}>
        {/* Layer 1: Continuous Seamless Panoramic Magical World */}
        <div
          ref={worldContainerRef}
          className={styles.panoramicWorldContainer}
          style={{ opacity: isDirectMode ? 1 : 0 }}
        >
          <img
            src="/scenes/seamless_garden_panorama_hd.jpg"
            alt="The Continuous Magical Sunset Garden"
            className={styles.panoramicBackground}
          />
          <div className={styles.panoramicSunGlow} />
        </div>

        {/* Layer 1.5: Global Procedural Environmental Effects (Clouds, Particles, Wind, Flora) */}
        <GlobalAtmosphere envStateRef={envStateRef} />

        {/* Layer 2: Master Unified Storybook Stage (Directly in Viewport) */}
        <div
          ref={openBookStageRef}
          className={styles.openBookCenteredStage}
        >
          <ThreePageFlipPrototype
            turnProgress={turnProgress}
            coverProgress={coverProgress}
            showControls={false}
          />
          <div id="storybook-butterfly-anchor" className={styles.bookButterflyAnchor} />
        </div>

        {/* Layer 3: Opening Flower Tunnel Canvas (Auto-plays on initial load, then hands over) */}
        {!isGardenDirect && (
          <div ref={tunnelLayerRef} className={styles.tunnelLayer}>
            <FlowerTunnel
              onStateUpdate={handleTunnelStateUpdate}
              onComplete={handleTunnelComplete}
            />
          </div>
        )}

        {/* Layer 4: Butterfly Character (The persistent single traveler across the garden) */}
        <div className={styles.butterflyFlightTrack}>
          <div ref={butterflyActorRef} className={styles.butterflyActor}>
            <Butterfly
              isHovering={isHoveringWing}
              flapDuration={isHoveringWing ? 0.45 : 0.20}
              showGlow={true}
            />
          </div>
        </div>

        {/* Layer 5: Final Question & YES/NO Interaction on Rocket Tip */}
        <FinalQuestionModal
          isLandedOnTip={isLandedOnTip}
          onReplay={handleReplay}
        />

        {/* Floating Horizontal Scroll Hint Indicator */}
        <div ref={scrollHintRef} className={styles.scrollHint} aria-hidden="true">
          <span ref={hintTextSpanRef}>Scroll right to explore garden</span>
          <span className={styles.scrollHintArrow}>▸</span>
        </div>
      </div>
    </SceneContainer>
  );
});
