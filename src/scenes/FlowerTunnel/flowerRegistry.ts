/**
 * BUTTERFLY — Flower Asset Registry & Preloader
 * Manages all 16 verified watercolor flower assets:
 * 11 corrected transparent assets from /flowers/processed/
 * 5 original verified transparent assets from /flowers/
 */

export interface FlowerAssetDefinition {
  id: string;
  name: string;
  colorFamily: 'peach' | 'ivory' | 'gold' | 'magenta' | 'mint' | 'lavender' | 'crimson' | 'orange' | 'blue' | 'coral';
  path: string;
  sourceType: 'processed' | 'original';
  aspectRatio: number;
  weight: number; // Composition prominence weight
}

export const FLOWER_REGISTRY: FlowerAssetDefinition[] = [
  // --- 11 Corrected Transparent Assets (/flowers/processed/) ---
  {
    id: 'peach-coral-bloom',
    name: 'Delicate Peach Coral Watercolor Bloom',
    colorFamily: 'peach',
    path: '/flowers/processed/Delicate Peach Coral Watercolor Bloom.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },
  {
    id: 'golden-ruffled-bloom',
    name: 'Golden Ruffled Watercolor Bloom',
    colorFamily: 'gold',
    path: '/flowers/processed/Golden Ruffled Watercolor Bloom.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },
  {
    id: 'ivory-golden-center',
    name: 'Golden-Centered Ivory Watercolor Blossom',
    colorFamily: 'ivory',
    path: '/flowers/processed/Golden-Centered Ivory Watercolor Blossom.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },
  {
    id: 'magenta-rose',
    name: 'Magenta Rose with Golden Stamens',
    colorFamily: 'magenta',
    path: '/flowers/processed/Magenta Rose with Golden Stamens.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.1,
  },
  {
    id: 'mint-cream-blossom',
    name: 'Mint and Cream Watercolor Blossom',
    colorFamily: 'mint',
    path: '/flowers/processed/Mint and Cream Watercolor Blossom.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 0.95,
  },
  {
    id: 'pastel-lavender-bloom',
    name: 'Pastel Watercolor Bloom on Black',
    colorFamily: 'lavender',
    path: '/flowers/processed/Pastel Watercolor Bloom on Black.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },
  {
    id: 'radiant-magenta-blossom',
    name: 'Radiant Magenta Watercolor Blossom',
    colorFamily: 'magenta',
    path: '/flowers/processed/Radiant Magenta Watercolor Blossom.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.05,
  },
  {
    id: 'vibrant-orange-bloom',
    name: 'Vibrant Orange Watercolor Bloom',
    colorFamily: 'orange',
    path: '/flowers/processed/Vibrant Orange Watercolor Bloom.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },
  {
    id: 'crimson-camellia-glow',
    name: 'Watercolor Crimson Camellia Glow',
    colorFamily: 'crimson',
    path: '/flowers/processed/Watercolor Crimson Camellia Glow.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.1,
  },
  {
    id: 'watercolor-lavender-bloom',
    name: 'Watercolor Lavender Bloom',
    colorFamily: 'lavender',
    path: '/flowers/processed/Watercolor Lavender Bloom.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },
  {
    id: 'peach-ivory-blossom',
    name: 'Watercolor Peach and Ivory Blossom',
    colorFamily: 'peach',
    path: '/flowers/processed/Watercolor Peach and Ivory Blossom.png',
    sourceType: 'processed',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },

  // --- 5 Original Transparent Assets (/flowers/) ---
  {
    id: 'golden-yellow-blossom',
    name: 'Golden Yellow Watercolor Blossom',
    colorFamily: 'gold',
    path: '/flowers/Golden Yellow Watercolor Blossom.png',
    sourceType: 'original',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },
  {
    id: 'blue-lavender-bloom',
    name: 'Luminous Blue and Lavender Watercolor Bloom',
    colorFamily: 'blue',
    path: '/flowers/Luminous Blue and Lavender Watercolor Bloom.png',
    sourceType: 'original',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },
  {
    id: 'luminous-bloom',
    name: 'Luminous Watercolor Bloom',
    colorFamily: 'peach',
    path: '/flowers/Luminous Watercolor Bloom on Black-1.png',
    sourceType: 'original',
    aspectRatio: 1312 / 1199,
    weight: 1.0,
  },
  {
    id: 'translucent-pink-peach',
    name: 'Translucent Pink Peach Watercolor Blossom',
    colorFamily: 'peach',
    path: '/flowers/Translucent Pink Peach Watercolor Blossom.png',
    sourceType: 'original',
    aspectRatio: 1312 / 1199,
    weight: 0.95,
  },
  {
    id: 'coral-peony-bloom',
    name: 'Watercolor Coral Peony Bloom',
    colorFamily: 'coral',
    path: '/flowers/Watercolor Coral Peony Bloom-2.png',
    sourceType: 'original',
    aspectRatio: 1536 / 1024,
    weight: 1.1,
  },
];

export interface LoadedFlowerSprite {
  def: FlowerAssetDefinition;
  image: HTMLImageElement;
  /**
   * Pre-rendered offscreen canvas buffer scaled for locked 60 FPS drawing
   * preserves high-res watercolor textures without per-frame downsampling bottlenecks
   */
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export class FlowerAssetCache {
  private static instance: FlowerAssetCache | null = null;
  private cache: Map<string, LoadedFlowerSprite> = new Map();
  private isLoaded: boolean = false;
  private loadPromise: Promise<LoadedFlowerSprite[]> | null = null;

  public static getInstance(): FlowerAssetCache {
    if (!FlowerAssetCache.instance) {
      FlowerAssetCache.instance = new FlowerAssetCache();
    }
    return FlowerAssetCache.instance;
  }

  /**
   * Preloads and decodes all 16 flower assets before animation starts
   */
  public async loadAll(targetResolution = 512): Promise<LoadedFlowerSprite[]> {
    if (this.isLoaded) {
      return Array.from(this.cache.values());
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = Promise.all(
      FLOWER_REGISTRY.map((def) => this.loadSingleAsset(def, targetResolution))
    ).then((sprites) => {
      this.isLoaded = true;
      return sprites;
    });

    return this.loadPromise;
  }

  private async loadSingleAsset(
    def: FlowerAssetDefinition,
    targetRes: number
  ): Promise<LoadedFlowerSprite> {
    if (this.cache.has(def.id)) {
      return this.cache.get(def.id)!;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = def.path;

      img.onload = async () => {
        try {
          if ('decode' in img) {
            await img.decode();
          }
        } catch {
          // Decode failure fallback
        }

        // Create high-fidelity offscreen canvas sprite
        const spriteCanvas = document.createElement('canvas');
        const aspect = def.aspectRatio;
        const sw = targetRes;
        const sh = Math.round(targetRes / aspect);
        spriteCanvas.width = sw;
        spriteCanvas.height = sh;

        const ctx = spriteCanvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, sw, sh);
        }

        const sprite: LoadedFlowerSprite = {
          def,
          image: img,
          canvas: spriteCanvas,
          width: sw,
          height: sh,
        };

        this.cache.set(def.id, sprite);
        resolve(sprite);
      };

      img.onerror = () => {
        console.warn(`[FlowerTunnel] Failed to load flower asset: ${def.path}`);
        // Fallback placeholder sprite
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = targetRes;
        fallbackCanvas.height = targetRes;
        const ctx = fallbackCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(targetRes / 2, targetRes / 2, targetRes * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        const fallback: LoadedFlowerSprite = {
          def,
          image: img,
          canvas: fallbackCanvas,
          width: targetRes,
          height: targetRes,
        };
        this.cache.set(def.id, fallback);
        resolve(fallback);
      };
    });
  }

  public getSprites(): LoadedFlowerSprite[] {
    return Array.from(this.cache.values());
  }

  public getSpriteById(id: string): LoadedFlowerSprite | undefined {
    return this.cache.get(id);
  }
}

