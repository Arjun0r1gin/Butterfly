/**
 * BUTTERFLY — Global Procedural Environmental Effects Types
 * Unified configuration, particle state, cloud layer, and wind interface definitions.
 */

export interface SceneConfig {
  /** Cloud formation density multiplier (0.0 to 1.0) */
  cloudDensity: number;
  /** Base cloud horizontal drift speed in world pixels per second */
  cloudSpeed: number;
  /** Warm sunset cloud color tint [r, g, b] */
  cloudTint: [number, number, number];
  /** Ambient cloud opacity multiplier */
  cloudOpacity: number;
  /** Relative particle density multiplier */
  particleDensity: number;
  /** Enabled particle species for this scene */
  particleTypes: {
    dust: boolean;
    pollen: boolean;
    fireflies: boolean;
  };
  /** Base wind force multiplier (0.0 to 1.0) */
  windStrength: number;
  /** Gust frequency and turbulent variability */
  windGustiness: number;
  /** Foreground swaying vegetation density */
  vegetationDensity: number;
  /** Subtle volumetric scattering and warm atmospheric haze (0.0 to 1.0) */
  atmosphereWarmth: number;
  /** Subtle sunset light ray intensity */
  lightRayIntensity: number;
}

export interface ProceduralCloudPuff {
  relX: number; // offset from cluster center in px
  relY: number; // offset from cluster center in px
  radiusX: number;
  radiusY: number;
  rotation: number;
  baseOpacity: number;
}

export interface ProceduralCloudCluster {
  id: number;
  worldX: number;
  worldY: number;
  depthLayer: number; // 0 = far stratosphere, 1 = mid sunset, 2 = lower wisps
  parallaxFactor: number;
  speedMultiplier: number;
  scale: number;
  puffs: ProceduralCloudPuff[];
}

export type ParticleSpecies = 'dust' | 'pollen' | 'firefly';

export interface EnvironmentalParticle {
  species: ParticleSpecies;
  worldX: number;
  worldY: number;
  depth: number; // 0.2 (distant) to 1.2 (foreground)
  radius: number;
  baseAlpha: number;
  currentAlpha: number;
  vx: number;
  vy: number;
  phase: number;
  pulseSpeed: number;
  color: [number, number, number];
}

export interface ForegroundPlant {
  worldX: number;
  baseY: number; // normalized Y relative to viewport (e.g. 0.94 - 1.0)
  height: number;
  width: number;
  stiffness: number;
  phaseOffset: number;
  bladeType: 'grass_blade' | 'tall_stem' | 'wildflower' | 'ivy_leaf';
  colorBase: string;
  colorTip: string;
  hasFlower: boolean;
  flowerColor?: string;
  flowerRadius?: number;
}

