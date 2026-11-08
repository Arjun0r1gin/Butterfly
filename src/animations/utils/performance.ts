/**
 * BUTTERFLY — Performance Profiling & GPU Budget Management
 * Monitors actual frame rates (targeting 60 FPS / 16.6ms frame budget)
 * and safely manages `will-change` properties to avoid excessive GPU memory usage.
 */

export interface PerformanceMetrics {
  fps: number;
  frameDurationMs: number;
  droppedFrames: number;
  isCompliant60Fps: boolean;
}

export class PerformanceProfiler {
  private lastTime: number = 0;
  private frameCount: number = 0;
  private droppedFrames: number = 0;
  private currentFps: number = 60;
  private rafId: number | null = null;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  public start(): void {
    if (this.rafId !== null || typeof window === 'undefined') return;

    this.lastTime = performance.now();
    this.frameCount = 0;
    this.droppedFrames = 0;

    const tick = (now: number) => {
      const delta = now - this.lastTime;
      this.frameCount++;

      // Detect dropped frame (took longer than ~20ms, meaning < 50fps)
      if (delta > 20) {
        this.droppedFrames++;
      }

      // Update calculations every 1000ms
      if (delta >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / delta);
        const metrics: PerformanceMetrics = {
          fps: this.currentFps,
          frameDurationMs: +(delta / this.frameCount).toFixed(2),
          droppedFrames: this.droppedFrames,
          isCompliant60Fps: this.currentFps >= 55,
        };

        this.notify(metrics);
        this.frameCount = 0;
        this.droppedFrames = 0;
        this.lastTime = now;
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(metrics: PerformanceMetrics): void {
    this.listeners.forEach((cb) => cb(metrics));
  }

  public getCurrentMetrics(): PerformanceMetrics {
    return {
      fps: this.currentFps,
      frameDurationMs: +(1000 / (this.currentFps || 1)).toFixed(2),
      droppedFrames: this.droppedFrames,
      isCompliant60Fps: this.currentFps >= 55,
    };
  }
}

export const performanceProfiler = new PerformanceProfiler();

/**
 * Manages `will-change` on elements strictly during animation lifetimes
 */
export function setWillChange(elements: Element | Element[], properties: string): () => void {
  const elList = Array.isArray(elements) ? elements : [elements];
  elList.forEach((el) => {
    (el as HTMLElement).style.willChange = properties;
  });

  return () => {
    elList.forEach((el) => {
      (el as HTMLElement).style.willChange = 'auto';
    });
  };
}

