/**
 * BUTTERFLY — Animation Math & Interpolation Utilities
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampResult: boolean = false
): number {
  const normalized = (value - inMin) / (inMax - inMin);
  const result = outMin + normalized * (outMax - outMin);
  return clampResult ? clamp(result, Math.min(outMin, outMax), Math.max(outMin, outMax)) : result;
}

export function damp(current: number, target: number, lambda: number, deltaTime: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * deltaTime));
}

