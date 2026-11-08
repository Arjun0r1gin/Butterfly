/**
 * BUTTERFLY — Music Marker Coordinate Registry
 * Tracks 2D canvas coordinates of music markers rendered onto Three.js page textures,
 * enabling pixel-precise 3D raycasting and touch interaction on the physical book sheets.
 */

export interface CanvasMusicMarkerHit {
  spreadIndex: number;
  markerId: string;
  cx: number;       // Canvas X (0 - 1024)
  cy: number;       // Canvas Y (0 - 1082)
  radius: number;   // Hit radius in px
}

class MusicMarkerRegistry {
  private hits: CanvasMusicMarkerHit[] = [];

  public clearSpread(spreadIndex: number) {
    this.hits = this.hits.filter((h) => h.spreadIndex !== spreadIndex);
  }

  public register(hit: CanvasMusicMarkerHit) {
    // Avoid duplicate
    this.hits = this.hits.filter(
      (h) => !(h.spreadIndex === hit.spreadIndex && h.markerId === hit.markerId)
    );
    this.hits.push(hit);
  }

  public findHit(spreadIndex: number, canvasX: number, canvasY: number): CanvasMusicMarkerHit | null {
    for (const h of this.hits) {
      if (h.spreadIndex === spreadIndex) {
        const dist = Math.hypot(canvasX - h.cx, canvasY - h.cy);
        if (dist <= h.radius + 14) {
          return h;
        }
      }
    }
    return null;
  }
}

export const musicMarkerRegistry = new MusicMarkerRegistry();

