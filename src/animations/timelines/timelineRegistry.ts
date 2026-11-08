/**
 * BUTTERFLY — Central Timeline Registry
 * Tracks active scene timelines across the application, providing global cleanup and synchronization.
 */

import type { SceneTimelineHandle } from './timelineFactory';

class TimelineRegistry {
  private timelines: Map<string, SceneTimelineHandle> = new Map();

  public register(id: string, handle: SceneTimelineHandle): void {
    if (this.timelines.has(id)) {
      this.unregister(id);
    }
    this.timelines.set(id, handle);
  }

  public get(id: string): SceneTimelineHandle | undefined {
    return this.timelines.get(id);
  }

  public unregister(id: string): void {
    const handle = this.timelines.get(id);
    if (handle) {
      handle.kill();
      this.timelines.delete(id);
    }
  }

  public clearAll(): void {
    this.timelines.forEach((handle) => handle.kill());
    this.timelines.clear();
  }
}

export const timelineRegistry = new TimelineRegistry();

