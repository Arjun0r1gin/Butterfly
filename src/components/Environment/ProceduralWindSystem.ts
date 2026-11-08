/**
 * BUTTERFLY — Procedural Harmonic Wind System
 * Generates continuous, non-synchronized wind vectors, gust pulses, and vegetation sway
 * with smooth transitions across space and time.
 */

export class ProceduralWindSystem {
  private time: number = 0;

  /**
   * Advance continuous global time
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    this.time += dt;
  }

  /**
   * Get the current global wind force multiplier [0.0 to 1.5]
   */
  public getGlobalWindForce(baseStrength: number, gustiness: number): number {
    const t = this.time;
    // Harmonic combination of low-frequency ambient breeze and organic gusts
    const slowWave = Math.sin(t * 0.45) * 0.25;
    const midWave = Math.sin(t * 1.15 + 1.2) * 0.20;
    const gustPulse = Math.max(0, Math.sin(t * 0.72) * Math.cos(t * 0.38)) * gustiness * 0.50;

    return Math.max(0.1, baseStrength * (0.65 + slowWave + midWave + gustPulse));
  }

  /**
   * Computes the horizontal sway offset for a plant/flower blade rooted at worldX
   * @param worldX Horizontal coordinate in world pixels
   * @param stiffness Plant stiffness (higher = stiffer, lower = more flexible)
   * @param phaseOffset Unique individual plant phase offset
   * @param baseStrength Scene base wind strength
   * @param gustiness Scene gustiness
   */
  public getSwayOffset(
    worldX: number,
    stiffness: number,
    phaseOffset: number,
    baseStrength: number,
    gustiness: number
  ): number {
    const t = this.time;
    const windForce = this.getGlobalWindForce(baseStrength, gustiness);

    // Traveling wave across the garden landscape
    const spatialPhase = worldX * 0.0035 + phaseOffset;
    const harmonicA = Math.sin(t * 1.8 + spatialPhase);
    const harmonicB = Math.sin(t * 3.4 + spatialPhase * 1.5) * 0.35;
    const harmonicC = Math.cos(t * 0.9 + spatialPhase * 0.5) * 0.25;

    const rawSway = (harmonicA + harmonicB + harmonicC) * windForce;
    // Flexibility: lower stiffness bends further
    const flexMultiplier = 1.0 / Math.max(0.4, stiffness);

    return rawSway * flexMultiplier;
  }

  /**
   * Computes small drift vector for airborne particles at (worldX, worldY)
   */
  public getParticleDrift(
    worldX: number,
    worldY: number,
    baseStrength: number
  ): { vx: number; vy: number } {
    const t = this.time;
    const spatialX = worldX * 0.002;
    const spatialY = worldY * 0.003;

    // Organic atmospheric turbulence
    const vx = (Math.sin(t * 0.8 + spatialX) * 0.4 + 0.6) * baseStrength * 18;
    const vy = Math.cos(t * 1.2 + spatialY + spatialX) * 8 - 4; // slight upward thermal buoyancy

    return { vx, vy };
  }
}

