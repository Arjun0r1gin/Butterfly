/**
 * BUTTERFLY — Dynamic Page Texture Renderer
 * Renders high-resolution canvas textures for Three.js physical book leaves
 * integrating editable typography, polaroid photos, stickers, notes, and uploaded media.
 */

import * as THREE from 'three';
import type { StorySpreadContent, PageLeftContent, PageRightContent } from './types';
import { getMediaUrl } from './indexedDB';

const PAGE_CANVAS_W = 1024;
const PAGE_CANVAS_H = 1082; // Aspect ratio matches 390x412 (0.946)

const bgCache = new Map<string, HTMLImageElement>();
const mediaImgCache = new Map<string, HTMLImageElement>();

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
      // Fallback 1x1 image
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
 * Renders a Left Page (photos, notes, stickers) onto a 2D Canvas
 */
export async function renderLeftPageCanvas(
  page: PageLeftContent,
  canvas: HTMLCanvasElement
): Promise<void> {
  canvas.width = PAGE_CANVAS_W;
  canvas.height = PAGE_CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw base parchment background
  const bg = await loadBaseImage('/storybook/studio_page_blank_left.jpg');
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, PAGE_CANVAS_W, PAGE_CANVAS_H);
  } else {
    ctx.fillStyle = '#f6edd9';
    ctx.fillRect(0, 0, PAGE_CANVAS_W, PAGE_CANVAS_H);
  }

  // 2. Render Polaroid Photos
  for (const photo of page.photos) {
    ctx.save();
    const px = (photo.rotationDeg < 0 ? 0.32 : 0.68) * PAGE_CANVAS_W;
    const py = (photo.rotationDeg < 0 ? 0.34 : 0.62) * PAGE_CANVAS_H;
    ctx.translate(px, py);
    ctx.rotate((photo.rotationDeg * Math.PI) / 180);

    const pw = 380;
    const ph = 440;
    const pLeft = -pw / 2;
    const pTop = -ph / 2;

    // Drop shadow
    ctx.shadowColor = 'rgba(25, 12, 4, 0.28)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 8;

    // White polaroid card
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(pLeft, pTop, pw, ph);

    // Reset shadow for content
    ctx.shadowColor = 'transparent';

    // Photo frame area
    const framePad = 24;
    const frameW = pw - framePad * 2;
    const frameH = 310;
    const frameX = pLeft + framePad;
    const frameY = pTop + framePad;

    // Custom photo image or gradient
    let drawnImage = false;
    if (photo.customUrl || photo.mediaId) {
      const url = photo.customUrl || (photo.mediaId ? await getMediaUrl(photo.mediaId) : null);
      if (url) {
        const pImg = await loadMediaImage(url);
        if (pImg) {
          ctx.drawImage(pImg, frameX, frameY, frameW, frameH);
          drawnImage = true;
        }
      }
    }

    if (!drawnImage) {
      // Warm gradient fallback
      const grad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
      grad.addColorStop(0, '#fce7f3');
      grad.addColorStop(1, '#fed7aa');
      ctx.fillStyle = grad;
      ctx.fillRect(frameX, frameY, frameW, frameH);

      // Doodle
      ctx.font = '54px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(photo.doodle || '🌸', frameX + frameW / 2, frameY + frameH / 2);
    }

    // Polaroid title and date
    ctx.fillStyle = '#3c2415';
    ctx.font = '600 22px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(photo.title, frameX + 4, pTop + ph - 42);

    if (photo.date) {
      ctx.fillStyle = '#8b6f5a';
      ctx.font = 'italic 18px "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText(photo.date, frameX + frameW - 4, pTop + ph - 42);
    }

    // Washi Tape strip at top
    ctx.fillStyle = photo.tapeStyle === 'washi-gold' ? 'rgba(235, 185, 95, 0.82)' : 'rgba(244, 165, 185, 0.82)';
    ctx.fillRect(pLeft + pw / 2 - 60, pTop - 14, 120, 28);

    ctx.restore();
  }

  // 3. Render Handwritten Notes
  if (page.handwrittenNotes.length > 0) {
    ctx.save();
    ctx.font = 'italic 26px "Cormorant Garamond", "Playfair Display", Georgia, serif';
    ctx.fillStyle = 'rgba(65, 42, 26, 0.92)';
    ctx.textAlign = 'center';

    let noteY = PAGE_CANVAS_H - 120;
    for (const note of page.handwrittenNotes) {
      ctx.fillText(note, PAGE_CANVAS_W / 2, noteY);
      noteY += 34;
    }
    ctx.restore();
  }

  // 4. Render Stickers
  await renderStickersOnCanvas(ctx, page.stickers);
}

/**
 * Renders a Right Page (Chapter header, drop cap, story text, signature, stickers) onto a 2D Canvas
 */
export async function renderRightPageCanvas(
  page: PageRightContent,
  canvas: HTMLCanvasElement
): Promise<void> {
  canvas.width = PAGE_CANVAS_W;
  canvas.height = PAGE_CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw base parchment background
  const bg = await loadBaseImage('/storybook/studio_page_blank_right.jpg');
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, PAGE_CANVAS_W, PAGE_CANVAS_H);
  } else {
    ctx.fillStyle = '#f6edd9';
    ctx.fillRect(0, 0, PAGE_CANVAS_W, PAGE_CANVAS_H);
  }

  ctx.save();
  const marginX = 140;
  const contentW = PAGE_CANVAS_W - marginX * 2;

  // 2. Chapter Number & Location
  let curY = 160;
  ctx.fillStyle = '#9b7a48';
  ctx.font = '600 20px "Cinzel", "Playfair Display", Georgia, serif';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'left';
  ctx.fillText(page.chapterNumber.toUpperCase(), marginX, curY);

  if (page.dateOrLocation) {
    ctx.font = 'italic 18px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = '#826549';
    ctx.textAlign = 'right';
    ctx.fillText(page.dateOrLocation, marginX + contentW, curY);
  }

  // Decorative header line
  curY += 18;
  ctx.strokeStyle = 'rgba(180, 140, 85, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, curY);
  ctx.lineTo(marginX + contentW, curY);
  ctx.stroke();

  // 3. Chapter Title
  curY += 52;
  ctx.fillStyle = '#2d1808';
  ctx.font = '700 38px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(page.chapterTitle, marginX, curY);

  // 4. Narrative Paragraphs with Drop Cap
  curY += 60;
  const lineHeight = 36;

  page.storyParagraphs.forEach((para, pIdx) => {
    let paraText = para;
    let initialOffset = 0;

    if (pIdx === 0 && page.decorativeInitial) {
      // Draw ornamental drop cap
      ctx.fillStyle = '#b88228';
      ctx.font = '700 68px "Playfair Display", Georgia, serif';
      ctx.fillText(page.decorativeInitial, marginX, curY + 48);
      initialOffset = 68;
      // Strip initial if paragraph starts with it
      if (paraText.startsWith(page.decorativeInitial)) {
        paraText = paraText.slice(page.decorativeInitial.length);
      }
    }

    ctx.fillStyle = '#3a2414';
    ctx.font = '400 22px "Playfair Display", Georgia, serif';

    // Word wrap
    const words = paraText.split(' ');
    let currentLine = '';
    let isFirstLine = pIdx === 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const maxW = isFirstLine ? contentW - initialOffset : contentW;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxW && currentLine) {
        const drawX = isFirstLine ? marginX + initialOffset : marginX;
        ctx.fillText(currentLine, drawX, curY);
        currentLine = words[i];
        curY += lineHeight;
        isFirstLine = false;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      const drawX = isFirstLine ? marginX + initialOffset : marginX;
      ctx.fillText(currentLine, drawX, curY);
      curY += lineHeight;
    }

    curY += 28; // Paragraph spacing
  });

  // 5. Cursive Signature
  if (page.signature) {
    curY += 24;
    ctx.fillStyle = '#5c3a22';
    ctx.font = 'italic 24px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(page.signature, marginX + contentW, curY);
  }

  ctx.restore();

  // 6. Render Stickers
  await renderStickersOnCanvas(ctx, page.stickers);
}

/**
 * Helper to render sticker items (images, GIFs, badges)
 */
async function renderStickersOnCanvas(
  ctx: CanvasRenderingContext2D,
  stickers: PageLeftContent['stickers']
): Promise<void> {
  const sorted = [...stickers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const st of sorted) {
    ctx.save();
    const sx = (st.x / 100) * PAGE_CANVAS_W;
    const sy = (st.y / 100) * PAGE_CANVAS_H;
    ctx.translate(sx, sy);
    ctx.rotate(((st.rotationDeg || 0) * Math.PI) / 180);

    const sw = st.width || 80;
    const sh = st.height || 80;

    if ((st.type === 'image' || st.type === 'gif') && (st.customUrl || st.mediaId)) {
      const url = st.customUrl || (st.mediaId ? await getMediaUrl(st.mediaId) : null);
      if (url) {
        const sImg = await loadMediaImage(url);
        if (sImg) {
          ctx.drawImage(sImg, -sw / 2, -sh / 2, sw, sh);
          ctx.restore();
          continue;
        }
      }
    }

    // Fallback badge styling for built-in sticker types
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
    // Wax seal
    ctx.fillStyle = '#9e3223';
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c95b4b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffe0d8';
    ctx.font = '700 16px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
  } else if (type === 'stamp') {
    // Postage stamp
    ctx.fillStyle = '#fff8ee';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#8d735a';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
    ctx.setLineDash([]);

    ctx.fillStyle = '#4c3422';
    ctx.font = '600 13px "Cinzel", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
  } else {
    // Floral / Botanical pill
    ctx.fillStyle = 'rgba(255, 248, 235, 0.92)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = '#d5b376';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#4c321e';
    ctx.font = '500 14px "Cormorant Garamond", serif';
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
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
