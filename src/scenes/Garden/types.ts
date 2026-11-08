/**
 * BUTTERFLY — Garden Scene Types & Configurations
 */

export interface DynamicFlowerNode {
  id: string;
  flowerIndex: number; // 0 to 15 from FlowerAssetCache
  anchorX: number; // Percentage 0 - 100
  anchorY: number; // Percentage 0 - 100
  baseScale: number;
  baseRotationDeg: number;
  swayAmplitudeDeg: number;
  swayFrequencyRad: number;
  phaseOffsetRad: number;
  verticalBobPx: number;
}

export interface FloatingPetal {
  id: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  opacity: number;
  flowerIndex: number;
}

export interface GardenConfig {
  cloudSpeedHigh: number; // px per second
  cloudSpeedLow: number;  // px per second
  sunPulsePeriod: number; // seconds
  branchSwayAmp: number;  // degrees
  branchSwayFreq: number; // rad/s
}

export const DEFAULT_GARDEN_CONFIG: GardenConfig = {
  cloudSpeedHigh: 12,
  cloudSpeedLow: 18,
  sunPulsePeriod: 6.0,
  branchSwayAmp: 0.65,
  branchSwayFreq: 0.45,
};

