/**
 * BUTTERFLY — Flower Tunnel Data Types & Specifications
 */

export interface FlowerVariety {
  name: string;
  petalCount: number;
  petalLayers: number;
  centerRadius: number;
  petalWidthRatio: number;
  petalLengthRatio: number;
  primaryColor: string;
  secondaryColor: string;
  centerColor: string;
  stamenColor: string;
}

export interface FlowerParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  baseRadius: number;
  rotation: number;
  rotationSpeed: number;
  wobbleSpeed: number;
  wobbleOffset: number;
  varietyIndex: number; // 0 to 15 pointing to the 16 registered watercolor flower assets
  ringIndex: number;
  baseAngle: number;
  radiusRatio: number; // 0.0 at screen center, up to 1.35 at outer screen corners
  radiusOffset: number; // Organic radial perturbation
  depthOffset: number; // Subtle z jitter for depth layering
  scaleFactor: number; // Natural scale variation (0.85 - 1.25)
  alpha: number;
  active: boolean;

  // Cascading fall physics properties
  fallDelay: number; // Organic staggered release
  fallSpeedMult: number; // Gravity variation
  swayAmp: number; // Aerodynamic horizontal flutter amplitude
  swayFreq: number; // Flutter frequency
  fallRotationSpeed: number; // Tumble spin rate during descent
}

export interface TunnelConfig {
  ringCount: number;
  baseFlowersPerRing: number;
  tunnelDepth: number;
  fov: number;
  initialRadius: number;
  maxRadius: number;
  swirlStrength: number;
}

export interface SequenceTimelineState {
  progress: number;
  // Step 2 & 3: Gift box
  giftBoxOpacity: number;
  giftBoxScale: number;
  giftBoxRotation: number;
  giftBoxDisintegration: number;

  // Stage 1 & 2: Circular Swirl & Complete Coverage (Center to Corners)
  flowerClusterProgress: number; // Core center bloom
  activeFlowerRatio: number; // Ring emergence from 0 to 1
  tunnelFormation: number; // Radial expansion
  tunnelDepthExpansion: number;
  swirlProgress: number; // Continuous swirling rotation
  coverageProgress: number; // 0 to 1: full viewport & corner saturation

  // Stage 3: Full Coverage Hold
  holdProgress: number;

  // Stage 4: Cascading Downward Waterfall
  fallProgress: number; // 0 (still in formation) to 1 (all fallen off-screen)
  cameraZ: number;
  cameraRoll: number;
  viewportFillProgress: number;
  transitionProgress: number; // 0 to 1 handover
  backgroundOpacity: number; // Clean pastel background opacity (fades out behind opaque flower blanket)
  gardenOpacity: number; // Garden background opacity (0 during swirl/hold, fades to 1 as flowers drop down)
}
