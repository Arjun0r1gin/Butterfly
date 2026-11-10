/**
 * BUTTERFLY — Authentic Handmade Scrapbook Page Texture Renderer
 * Renders high-resolution canvas textures for Three.js physical book leaves
 * integrating authentic black ink cursive handwriting (Caveat / Patrick Hand),
 * colorful Polaroid photographs, dried flowers, washi tape, stamps, and stickers.
 */

import * as THREE from 'three';
import type { StorySpreadContent, PageLeftContent, PageRightContent, StickerItem } from './types';
import { getMediaUrl } from './indexedDB';
import { musicMarkerRegistry } from './musicMarkerRegistry';
import { assetUrl } from '../../utils/assets';

const PAGE_CANVAS_W = 1024;
const PAGE_CANVAS_H = 1082; // Matches 390x412 aspect ratio (0.946)

const bgCache = new Map<string, HTMLImageElement>();
const mediaImgCache = new Map<string, HTMLImageElement>();

async function ensureHandwritingFonts(customFont?: string): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      if (customFont) {
        await document.fonts.load(`600 48px "${customFont}"`);
        await document.fonts.load(`bold 48px "${customFont}"`);
        await document.fonts.load(`600 44px "${customFont}"`);
        await document.fonts.load(`bold 44px "${customFont}"`);
        await document.fonts.load(`600 36px "${customFont}"`);
        await document.fonts.load(`34px "${customFont}"`);
      }
      await document.fonts.load('600 48px "Caveat"');
      await document.fonts.load('bold 48px "Caveat"');
      await document.fonts.load('600 44px "Caveat"');
      await document.fonts.load('bold 44px "Caveat"');
      await document.fonts.load('600 38px "Caveat"');
      await document.fonts.load('600 32px "Caveat"');
      await document.fonts.load('600 32px "Patrick Hand"');
      await document.fonts.load('600 34px "Kalam"');
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
    img.src = assetUrl(src);
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
    img.src = assetUrl(url);
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

function drawSparkle(ctx: CanvasRenderingContext2D, sx: number, sy: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#f5ba58';
  ctx.beginPath();
  ctx.moveTo(sx, sy - size);
  ctx.quadraticCurveTo(sx, sy, sx + size, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy + size);
  ctx.quadraticCurveTo(sx, sy, sx - size, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy - size);
  ctx.fill();
  ctx.restore();
}

function adjustHex(hex: string, amount: number): string {
  try {
    let color = hex.replace(/^#/, '');
    if (color.length === 3) color = color.split('').map((c) => c + c).join('');
    const num = parseInt(color, 16);
    if (isNaN(num)) return '#D32F2F';
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return '#D32F2F';
  }
}

/**
 * Renders a Right Page (Genuine Handwritten Story, Deep Black Ink, Blush Highlighter, Responsive Typography, Inline Music Badges)
 */
export async function renderRightPageCanvas(
  page: PageRightContent,
  canvas: HTMLCanvasElement,
  spreadIndex: number = 0
): Promise<void> {
  // Clear any existing hit areas for this spread face before redrawing
  musicMarkerRegistry.clearSpread(spreadIndex);

  const typo = page.typography || {};
  const fontFamily = typo.fontFamily || 'Caveat';
  const textColor = typo.color && typo.color !== '#17120F' ? typo.color : '#0a0705'; // Deep black ink
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
  // Expanded text column: 68px clears spiral binder rings, 36px outer margin
  const marginXLeft = 68;
  const marginXRight = 36;
  const contentW = PAGE_CANVAS_W - marginXLeft - marginXRight; // 920px wide

  let curY = 54;

  // 2. Date in Top Right with Pen Underline
  if (page.dateOrLocation) {
    ctx.save();
    ctx.font = `600 32px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    const dateX = marginXLeft + contentW;
    ctx.fillText(page.dateOrLocation, dateX, curY);

    // Hand-drawn pen underline
    const dateMetrics = ctx.measureText(page.dateOrLocation);
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(dateX - dateMetrics.width - 8, curY + 8);
    ctx.quadraticCurveTo(dateX - dateMetrics.width / 2, curY + 10, dateX + 6, curY + 8);
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
    ctx.fillStyle = 'rgba(235, 160, 175, 0.45)';
    ctx.beginPath();
    ctx.roundRect(marginXLeft - 8, curY - 26, chapMetrics.width + 24, 30, 6);
    ctx.fill();

    // Deep black ink text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(chapText, marginXLeft, curY);
    ctx.restore();
    curY += 36;
  } else {
    curY += 28;
  }

  // 4. Chapter Title with Matching Blush Watercolor Wash Streak
  if (page.chapterTitle) {
    ctx.save();
    const titleText = page.chapterTitle;
    ctx.font = `bold 42px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
    const titleMetrics = ctx.measureText(titleText);

    // Soft blush watercolor highlighter wash
    ctx.fillStyle = 'rgba(235, 160, 175, 0.45)';
    ctx.beginPath();
    ctx.roundRect(marginXLeft - 10, curY - 30, titleMetrics.width + 26, 36, 8);
    ctx.fill();

    // Deep black ink title
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(titleText, marginXLeft, curY);
    ctx.restore();
    curY += 46;
  }

  // 5. Genuine Long-Form Handwritten Story Body with Inline Music Badges
  const storyParagraphs = page.storyParagraphs || [];
  const maxUsableY = PAGE_CANVAS_H - 24; // 1058px (maximize usable page height)
  const availableHeight = maxUsableY - curY;

  // Respect user-configured typography from Studio Admin
  const requestedFontSize = typo.fontSize || 48;
  const requestedLineHeight = typo.lineHeight || 1.34;
  const requestedParaSpacing = typo.paragraphSpacing !== undefined ? typo.paragraphSpacing : 14;

  let optimalFont = requestedFontSize;
  let optimalLineHeight = Math.round(requestedFontSize * (requestedLineHeight <= 1.35 ? requestedLineHeight : 1.24));
  let optimalParaSpacing = requestedParaSpacing;

  for (let testFont = requestedFontSize; testFont >= 24; testFont -= 1) {
    const isTarget = testFont === requestedFontSize;
    const lhRatio = isTarget && requestedLineHeight <= 1.30 ? requestedLineHeight : (testFont >= 40 ? 1.22 : 1.26);
    const testLineHeight = Math.round(testFont * lhRatio);
    const testParaSpacing = storyParagraphs.length > 8
      ? Math.min(requestedParaSpacing, 6)
      : (storyParagraphs.length > 5 ? Math.min(requestedParaSpacing, 8) : requestedParaSpacing);

    ctx.font = `600 ${testFont}px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;

    let totalH = 0;
    for (const p of storyParagraphs) {
      if (!p.trim()) continue;
      const cleanWords = p.replace(/\[\[music:[a-zA-Z0-9_\-]+\]\]/g, ' [♫] ').split(/\s+/);
      let lineW = 0;
      let pLines = 1;
      for (const w of cleanWords) {
        const ww = ctx.measureText(w + ' ').width;
        if (lineW + ww > contentW && lineW > 0) {
          pLines++;
          lineW = ww;
        } else {
          lineW += ww;
        }
      }
      totalH += pLines * testLineHeight + testParaSpacing;
    }
    totalH -= testParaSpacing;

    if (page.signature) {
      totalH += Math.round(testFont * 1.05) + 6;
    }

    if (totalH <= availableHeight) {
      optimalFont = testFont;
      optimalLineHeight = testLineHeight;
      optimalParaSpacing = testParaSpacing;
      break;
    }
  }

  const fontSize = optimalFont;
  const lineHeight = optimalLineHeight;
  const paraSpacing = optimalParaSpacing;

  ctx.fillStyle = textColor;
  ctx.font = `600 ${fontSize}px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const spaceW = ctx.measureText(' ').width;

  interface TokenWord {
    type: 'word';
    text: string;
    width: number;
  }
  interface TokenMusic {
    type: 'music';
    markerId: string;
    width: number;
    trailingPunct: string;
    punctWidth: number;
  }
  type ParagraphToken = TokenWord | TokenMusic;

  storyParagraphs.forEach((para) => {
    if (!para || !para.trim()) return;

    // Tokenize paragraph by music markers [[music:id]][punct] or words
    const tokenRegex = /(\[\[music:([a-zA-Z0-9_\-]+)\]\])([,\.!?;:]*)|(\S+)/g;
    const tokens: ParagraphToken[] = [];
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(para)) !== null) {
      if (match[1]) {
        const markerId = match[2];
        const trailingPunct = match[3] || '';
        const punctWidth = trailingPunct ? ctx.measureText(trailingPunct).width : 0;
        tokens.push({
          type: 'music',
          markerId,
          width: 52 + punctWidth,
          trailingPunct,
          punctWidth,
        });
      } else if (match[4]) {
        const word = match[4];
        tokens.push({
          type: 'word',
          text: word,
          width: ctx.measureText(word).width,
        });
      }
    }

    if (tokens.length === 0) return;

    // Line accumulation
    let currentLineTokens: ParagraphToken[] = [];
    let currentLineWidth = 0;

    const flushLine = () => {
      if (currentLineTokens.length === 0 || curY > maxUsableY) return;

      let startX = marginXLeft;
      if (textAlign === 'center') {
        startX = marginXLeft + (contentW - currentLineWidth) / 2;
      } else if (textAlign === 'right') {
        startX = marginXLeft + contentW - currentLineWidth;
      }

      let tokenX = startX;
      for (const tok of currentLineTokens) {
        if (tok.type === 'word') {
          ctx.fillStyle = textColor;
          ctx.font = `600 ${fontSize}px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(tok.text, tokenX, curY);
          tokenX += tok.width + spaceW;
        } else if (tok.type === 'music') {
          const marker = page.musicMarkers?.[tok.markerId];
          // If disabled, skip rendering the badge entirely
          if (marker && marker.enabled === false) {
            if (tok.trailingPunct) {
              ctx.fillStyle = textColor;
              ctx.font = `600 ${fontSize}px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'alphabetic';
              ctx.fillText(tok.trailingPunct, tokenX, curY);
            }
            continue;
          }

          const markerColor = marker?.color || '#D32F2F'; // Default Crimson RED
          const customRadius = marker?.size ? Math.round(marker.size * 0.75) : Math.max(16, Math.round(fontSize * 0.58));
          const badgeW = customRadius * 2 + 8;
          const cx = tokenX + badgeW / 2;
          const cy = curY - fontSize * 0.32;
          const radius = customRadius;

          ctx.save();
          // Vibrant red/custom glow
          ctx.shadowColor = markerColor.startsWith('#')
            ? `${markerColor}66`
            : 'rgba(211, 47, 47, 0.45)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 2;

          // Radial gradient badge (Crimson Red by default)
          const grad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, radius);
          grad.addColorStop(0, adjustHex(markerColor, 55));
          grad.addColorStop(0.55, markerColor);
          grad.addColorStop(1, adjustHex(markerColor, -50));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          // Delicate border
          ctx.strokeStyle = adjustHex(markerColor, -80);
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Crisp White Note symbol for beautiful contrast
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(radius * 1.2)}px "Caveat", cursive, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('♫', cx, cy + 1);

          // Playful sparkles
          drawSparkle(ctx, cx + radius + 2, cy - radius * 0.75, 4.5);
          drawSparkle(ctx, cx - radius - 2, cy + radius * 0.7, 3.5);

          ctx.restore();

          // If there is trailing punctuation attached to music note, render it
          if (tok.trailingPunct) {
            ctx.fillStyle = textColor;
            ctx.font = `600 ${fontSize}px "${fontFamily}", "Caveat", "Patrick Hand", cursive, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(tok.trailingPunct, tokenX + badgeW, curY);
          }

          // Register hit area in coordinate registry
          musicMarkerRegistry.register({
            spreadIndex,
            markerId: tok.markerId,
            cx,
            cy,
            radius: radius + 8,
          });

          tokenX += tok.width + spaceW;
        }
      }

      curY += lineHeight;
      currentLineTokens = [];
      currentLineWidth = 0;
    };

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const addedWidth = currentLineTokens.length === 0 ? tok.width : spaceW + tok.width;

      if (currentLineWidth + addedWidth > contentW && currentLineTokens.length > 0) {
        flushLine();
        currentLineTokens = [tok];
        currentLineWidth = tok.width;
      } else {
        currentLineTokens.push(tok);
        currentLineWidth += addedWidth;
      }
    }

    flushLine();
    curY += paraSpacing;
  });

  // 6. Closing Signature if provided
  if (page.signature && curY <= maxUsableY) {
    ctx.font = `italic ${Math.round(fontSize * 0.95)}px "${fontFamily}", "Caveat", cursive, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillStyle = textColor;
    ctx.fillText(page.signature, marginXLeft + contentW, curY + 6);
  } else {
    // Subtle Inked Accent Stroke under text
    ctx.strokeStyle = 'rgba(80, 60, 45, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginXLeft + 60, Math.min(curY, maxUsableY) - 14);
    ctx.quadraticCurveTo(marginXLeft + 160, Math.min(curY, maxUsableY) - 10, marginXLeft + 260, Math.min(curY, maxUsableY) - 15);
    ctx.stroke();
  }

  ctx.restore();

  // 7. Render Stickers (excluding any flower stickers on right narrative pages)
  const rightPageStickers = (page.stickers || []).filter((st) => {
    const isFlower =
      st.type === 'flower' ||
      st.type === 'botanical' ||
      (st.customUrl &&
        (st.customUrl.includes('flower') ||
          st.customUrl.includes('sprig') ||
          st.customUrl.includes('blossom') ||
          st.customUrl.includes('stamp_pink') ||
          st.customUrl.includes('stamp_vintage_rose') ||
          st.customUrl.includes('washi_pink_floral'))) ||
      (st.label &&
        (st.label.toLowerCase().includes('flower') ||
          st.label.toLowerCase().includes('sprig') ||
          st.label.toLowerCase().includes('blossom') ||
          st.label.toLowerCase().includes('rose')));
    return !isFlower;
  });
  await renderStickersOnCanvas(ctx, rightPageStickers);
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

    // Scale proportionally from editor canvas (440px wide) to 3D texture canvas (1024px wide)
    // so sticker/image size on the physical book matches the admin panel WYSIWYG 1:1
    const editorToCanvasScale = PAGE_CANVAS_W / 440;
    const sw = (st.width || 80) * editorToCanvasScale;
    const sh = (st.height || 80) * editorToCanvasScale;

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
    await renderRightPageCanvas(spread.rightPage, canvas, spread.spreadIndex);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
