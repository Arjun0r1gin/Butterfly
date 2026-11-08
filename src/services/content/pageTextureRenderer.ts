/**
 * BUTTERFLY — Authentic Handmade Scrapbook Page Texture Renderer
 * Renders high-resolution canvas textures for Three.js physical book leaves
 * integrating authentic black ink cursive handwriting (Caveat / Patrick Hand),
 * colorful Polaroid photographs, dried flowers, washi tape, stamps, and stickers.
 */

import * as THREE from 'three';
import type { StorySpreadContent, PageLeftContent, PageRightContent, StickerItem } from './types';
import { getMediaUrl } from './indexedDB';

const PAGE_CANVAS_W = 1024;
const PAGE_CANVAS_H = 1082; // Matches 390x412 aspect ratio (0.946)

const bgCache = new Map<string, HTMLImageElement>();
const mediaImgCache = new Map<string, HTMLImageElement>();

async function ensureHandwritingFonts(customFont?: string): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      if (customFont) {
        await document.fonts.load(`bold 44px "${customFont}"`);
        await document.fonts.load(`34px "${customFont}"`);
      }
      await document.fonts.load('bold 44px "Caveat"');
      await document.fonts.load('36px "Caveat"');
      await document.fonts.load('30px "Patrick Hand"');
      await document.fonts.load('34px "Kalam"');
      await document.fonts.ready;
    } catch {
      // Fallback to system handwriting fonts
    }
  }
}

function loadBaseImage(src: string): Promise<HTMLImageElement> {
  if (bgCache.has(src)) return Promise.resolve(bgCache.get(src)!);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      bgCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      bgCache.set(src, img);
      resolve(img);
    };
    img.src = src;
  });
}

async function loadMediaImage(url: string): Promise<HTMLImageElement | null> {
  if (mediaImgCache.has(url)) return mediaImgCache.get(url)!;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      mediaImgCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Renders a Left Page (Visual Memories: Polaroids, Washi Tape, Pressed Flowers, Stickers)
 */
export async function renderLeftPageCanvas(
  page: PageLeftContent,
  canvas: HTMLCanvasElement
): Promise<void> {
  await ensureHandwritingFonts();

  canvas.width = PAGE_CANVAS_W;
  canvas.height = PAGE_CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw base warm aged parchment background
  const bg = await loadBaseImage('/storybook/studio_page_blank_left.jpg');
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, PAGE_CANVAS_W, PAGE_CANVAS_H);
  } else {
    ctx.fillStyle = '#f7f1e3';
    ctx.fillRect(0, 0, PAGE_CANVAS_W, PAGE_CANVAS_H);
  }

  // Preload washi tape images
  const washiPink = await loadBaseImage('/storybook/assets/washi_pink_floral.png');
  const washiGingham = await loadBaseImage('/storybook/assets/washi_gingham.png');

  // 2. Render Polaroid Photos
  const photos = page.photos || [];
  const photoCount = photos.length;

  for (let idx = 0; idx < photoCount; idx++) {
    const photo = photos[idx];
    ctx.save();

    let px = 0.5 * PAGE_CANVAS_W;
    let py = 0.5 * PAGE_CANVAS_H;
    let pw = 380;
    let ph = 440;

    if (photoCount === 3) {
      // 3-photo layout (Spread 1 style)
      if (idx === 0) {
        px = 0.40 * PAGE_CANVAS_W;
        py = 0.28 * PAGE_CANVAS_H;
        pw = 350;
        ph = 410;
      } else if (idx === 1) {
        px = 0.72 * PAGE_CANVAS_W;
        py = 0.44 * PAGE_CANVAS_H;
        pw = 330;
        ph = 390;
      } else {
        px = 0.50 * PAGE_CANVAS_W;
        py = 0.73 * PAGE_CANVAS_H;
        pw = 340;
        ph = 400;
      }
    } else {
      // 2-photo layout (Spread 2, 3, 4 style)
      if (idx === 0) {
        px = 0.35 * PAGE_CANVAS_W;
        py = 0.34 * PAGE_CANVAS_H;
        pw = 380;
        ph = 440;
      } else {
        px = 0.68 * PAGE_CANVAS_W;
        py = 0.62 * PAGE_CANVAS_H;
        pw = 390;
        ph = 450;
      }
    }

    ctx.translate(px, py);
    ctx.rotate((photo.rotationDeg * Math.PI) / 180);

    const pLeft = -pw / 2;
    const pTop = -ph / 2;

    // Realistic paper drop shadow
    ctx.shadowColor = 'rgba(28, 16, 8, 0.24)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 8;

    // Polaroid card frame
    ctx.fillStyle = '#fffefb';
    ctx.fillRect(pLeft, pTop, pw, ph);

    // Subtle polaroid card border
    ctx.strokeStyle = '#ede4d3';
    ctx.lineWidth = 1;
    ctx.strokeRect(pLeft, pTop, pw, ph);

    // Reset shadow for photo & text
    ctx.shadowColor = 'transparent';

    // Photo frame area
    const framePad = 22;
    const frameW = pw - framePad * 2;
    const frameH = ph - 110;
    const frameX = pLeft + framePad;
    const frameY = pTop + framePad;

    // Draw real photo
    let drawnImage = false;
    const photoUrl = photo.customUrl || (photo.mediaId ? await getMediaUrl(photo.mediaId) : null);
    if (photoUrl) {
      const pImg = await loadMediaImage(photoUrl);
      if (pImg && pImg.complete && pImg.naturalWidth > 0) {
        // Draw photo with cover aspect ratio
        ctx.save();
        ctx.beginPath();
        ctx.rect(frameX, frameY, frameW, frameH);
        ctx.clip();

        const imgRatio = pImg.naturalWidth / pImg.naturalHeight;
        const targetRatio = frameW / frameH;
        let dw = frameW;
        let dh = frameH;
        let dx = frameX;
        let dy = frameY;

        if (imgRatio > targetRatio) {
          dw = frameH * imgRatio;
          dx = frameX - (dw - frameW) / 2;
        } else {
          dh = frameW / imgRatio;
          dy = frameY - (dh - frameH) / 2;
        }

        // Apply selective vibrancy boost to photos (restores vibrant natural colors, bright pinks & greens)
        ctx.filter = 'contrast(1.08) saturate(1.18) brightness(1.05)';
        ctx.drawImage(pImg, dx, dy, dw, dh);
        ctx.filter = 'none';

        // Soft vignette inside frame
        ctx.strokeStyle = 'rgba(40, 25, 15, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(frameX, frameY, frameW, frameH);
        ctx.restore();
        drawnImage = true;
      }
    }

    if (!drawnImage) {
      // Warm gradient fallback
      const grad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
      grad.addColorStop(0, '#fde68a');
      grad.addColorStop(1, '#f472b6');
      ctx.fillStyle = grad;
      ctx.fillRect(frameX, frameY, frameW, frameH);

      ctx.font = '48px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(photo.doodle || '📷', frameX + frameW / 2, frameY + frameH / 2);
    }

    // Polaroid Handwritten Caption in Deep Black Ink
    ctx.fillStyle = '#17120F';
    ctx.font = '30px "Caveat", "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(photo.title, frameX + 6, pTop + ph - 38);

    if (photo.date) {
      ctx.fillStyle = '#4a3b30';
      ctx.font = '22px "Caveat", "Patrick Hand", cursive, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(photo.date, frameX + frameW - 6, pTop + ph - 38);
    }

    // Washi Tape strip at top
    const tapeImg = photo.tapeStyle === 'washi-gold' ? washiGingham : washiPink;
    const tapeW = 140;
    const tapeH = 34;
    const tapeX = pLeft + pw / 2 - tapeW / 2;
    const tapeY = pTop - tapeH / 2;

    if (tapeImg && tapeImg.complete && tapeImg.naturalWidth > 0) {
      ctx.save();
      ctx.filter = 'contrast(1.05) saturate(1.15) brightness(1.03)';
      ctx.drawImage(tapeImg, tapeX, tapeY, tapeW, tapeH);
      ctx.restore();
    } else {
      ctx.fillStyle = photo.tapeStyle === 'washi-gold' ? 'rgba(235, 215, 185, 0.90)' : 'rgba(245, 175, 190, 0.90)';
      ctx.fillRect(tapeX, tapeY, tapeW, tapeH);
    }

    ctx.restore();
  }

  // 3. Render Stickers, Pressed Flowers, and Stamps
  await renderStickersOnCanvas(ctx, page.stickers);
}

/**
 * Renders a Right Page (Genuine Handwritten Story, Deep Black Ink, Blush Highlighter, Responsive Typography)
 */
export async function renderRightPageCanvas(
  page: PageRightContent,
  canvas: HTMLCanvasElement
): Promise<void> {
  const typo = page.typography || {};
  const fontFamily = typo.fontFamily || 'Caveat';
  const fontSize = typo.fontSize || 34;
  const textColor = typo.color || '#17120F'; // Pure dark black ink
  const lineHeight = Math.round(fontSize * (typo.lineHeight || 1.55));
  const paraSpacing = typo.paragraphSpacing !== undefined ? typo.paragraphSpacing : 28;
  const textAlign = typo.textAlign || 'left';

  await ensureHandwritingFonts(fontFamily);

  canvas.width = PAGE_CANVAS_W;
  canvas.height = PAGE_CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw base warm aged parchment background
  const bg = await loadBaseImage('/storybook/studio_page_blank_right.jpg');
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, PAGE_CANVAS_W, PAGE_CANVAS_H);
  } else {
    ctx.fillStyle = '#f7f1e3';
    ctx.fillRect(0, 0, PAGE_CANVAS_W, PAGE_CANVAS_H);
  }

  ctx.save();
  const marginX = 135;
  const contentW = PAGE_CANVAS_W - marginX * 2 - 20;

  let curY = 140;

  // 2. Date in Top Right with Pen Underline
  if (page.dateOrLocation) {
    ctx.save();
    ctx.font = `34px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    const dateX = marginX + contentW;
    ctx.fillText(page.dateOrLocation, dateX, curY);

    // Hand-drawn pen underline
    const dateMetrics = ctx.measureText(page.dateOrLocation);
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(dateX - dateMetrics.width - 10, curY + 12);
    ctx.quadraticCurveTo(dateX - dateMetrics.width / 2, curY + 14, dateX + 8, curY + 11);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Chapter Number Header with Blush Watercolor Wash Streak
  if (page.chapterNumber) {
    ctx.save();
    const chapText = page.chapterNumber;
    ctx.font = `bold 36px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
    const chapMetrics = ctx.measureText(chapText);

    // Soft blush watercolor highlighter wash
    ctx.fillStyle = 'rgba(235, 160, 175, 0.42)';
    ctx.beginPath();
    ctx.roundRect(marginX - 10, curY - 26, chapMetrics.width + 24, 30, 6);
    ctx.fill();

    // Deep black ink text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(chapText, marginX, curY);
    ctx.restore();
    curY += 58;
  }

  // 4. Chapter Title with Matching Blush Watercolor Wash Streak
  if (page.chapterTitle) {
    ctx.save();
    const titleText = page.chapterTitle;
    ctx.font = `bold 44px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
    const titleMetrics = ctx.measureText(titleText);

    // Soft blush watercolor highlighter wash
    ctx.fillStyle = 'rgba(235, 160, 175, 0.42)';
    ctx.beginPath();
    ctx.roundRect(marginX - 10, curY - 32, titleMetrics.width + 26, 38, 8);
    ctx.fill();

    // Deep black ink title
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(titleText, marginX, curY);
    ctx.restore();
    curY += 68;
  }

  // 5. Genuine Long-Form Handwritten Story Body flowing top to bottom
  const storyParagraphs = page.storyParagraphs || [];

  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'alphabetic';

  let alignX = marginX;
  if (textAlign === 'center') {
    alignX = marginX + contentW / 2;
  } else if (textAlign === 'right') {
    alignX = marginX + contentW;
  }

  // Usable height extends comfortably down the entire page without clipping
  const maxUsableY = PAGE_CANVAS_H - 85;

  storyParagraphs.forEach((para) => {
    if (!para || !para.trim()) return;
    const words = para.split(/\s+/);
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);

      if (metrics.width > contentW && currentLine) {
        if (curY <= maxUsableY) {
          ctx.fillText(currentLine, alignX, curY);
          curY += lineHeight;
        }
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine && curY <= maxUsableY) {
      ctx.fillText(currentLine, alignX, curY);
      curY += lineHeight;
    }

    curY += paraSpacing;
  });

  // 6. Closing Signature if provided
  if (page.signature && curY <= maxUsableY) {
    ctx.font = `italic ${Math.round(fontSize * 0.95)}px "${fontFamily}", "Caveat", cursive, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillStyle = textColor;
    ctx.fillText(page.signature, marginX + contentW, curY + 6);
  } else {
    // Subtle Inked Accent Stroke under text
    ctx.strokeStyle = 'rgba(80, 60, 45, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginX + 60, Math.min(curY, maxUsableY) - 14);
    ctx.quadraticCurveTo(marginX + 160, Math.min(curY, maxUsableY) - 10, marginX + 260, Math.min(curY, maxUsableY) - 15);
    ctx.stroke();
  }

  ctx.restore();

  // 7. Render Stickers (e.g. Butterfly flight loop doodle, Pink Wildflower Sprig)
  await renderStickersOnCanvas(ctx, page.stickers);
}

/**
 * Renders sticker items (images, animated GIFs, pressed flowers, stamps)
 */
async function renderStickersOnCanvas(
  ctx: CanvasRenderingContext2D,
  stickers: StickerItem[]
): Promise<void> {
  if (!stickers || stickers.length === 0) return;

  const sorted = [...stickers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const st of sorted) {
    ctx.save();
    const sx = (st.x / 100) * PAGE_CANVAS_W;
    const sy = (st.y / 100) * PAGE_CANVAS_H;
    ctx.translate(sx, sy);
    ctx.rotate(((st.rotationDeg || 0) * Math.PI) / 180);

    const sw = st.width || 80;
    const sh = st.height || 80;

    // Check if it has a custom URL or media ID
    const url = st.customUrl || (st.mediaId ? await getMediaUrl(st.mediaId) : null);
    if (url) {
      const sImg = await loadMediaImage(url);
      if (sImg && sImg.complete && sImg.naturalWidth > 0) {
        // Soft realistic contact shadow for stickers & dried flowers
        ctx.shadowColor = 'rgba(30, 18, 10, 0.22)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;

        ctx.save();
        ctx.filter = 'contrast(1.08) saturate(1.20) brightness(1.04)';
        ctx.drawImage(sImg, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();
        ctx.restore();
        continue;
      }
    }

    // Fallback badge if no image loaded
    renderFallbackBadge(ctx, st.type, st.label || '★', sw, sh);
    ctx.restore();
  }
}

function renderFallbackBadge(
  ctx: CanvasRenderingContext2D,
  type: string,
  label: string,
  w: number,
  h: number
) {
  const rad = Math.min(w, h) / 2;

  if (type === 'seal') {
    ctx.fillStyle = '#9e3223';
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c95b4b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffe0d8';
    ctx.font = '700 16px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
  } else if (type === 'stamp') {
    ctx.fillStyle = '#fff8ee';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#8d735a';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
    ctx.setLineDash([]);

    ctx.fillStyle = '#4c3422';
    ctx.font = '600 16px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
  } else {
    ctx.fillStyle = 'rgba(255, 248, 235, 0.92)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = '#d5b376';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#4c321e';
    ctx.font = '500 18px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
  }
}

/**
 * Creates or updates THREE.CanvasTexture for a given spread face
 */
export async function createSpreadCanvasTexture(
  spread: StorySpreadContent,
  side: 'left' | 'right'
): Promise<THREE.CanvasTexture> {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_CANVAS_W;
  canvas.height = PAGE_CANVAS_H;

  if (side === 'left') {
    await renderLeftPageCanvas(spread.leftPage, canvas);
  } else {
    await renderRightPageCanvas(spread.rightPage, canvas);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
