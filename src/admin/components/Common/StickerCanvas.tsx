/**
 * BUTTERFLY — Interactive StickerCanvas Component
 * Interactive visual canvas supporting drag, proportional resize, rotate, z-index layering,
 * and animated GIF/image rendering with dedicated sizing controls.
 */

import React, { useRef, useState, useEffect } from 'react';
import type { StickerItem } from '../../../services/content/types';
import { getMediaUrl } from '../../../services/content/indexedDB';
import styles from '../../Admin.module.css';

export interface StickerCanvasProps {
  stickers: StickerItem[];
  onUpdateStickers: (stickers: StickerItem[]) => void;
  backgroundSrc?: string;
  width?: number;
  height?: number;
  children?: React.ReactNode;
  className?: string;
}

export const StickerCanvas: React.FC<StickerCanvasProps> = ({
  stickers,
  onUpdateStickers,
  backgroundSrc = '/storybook/studio_page_blank_left.jpg',
  width = 440,
  height = 490,
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  // Interaction tracking refs
  const dragRef = useRef<{
    isDragging: boolean;
    isResizing: boolean;
    isRotating: boolean;
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origRot: number;
    centerX: number;
    centerY: number;
  }>({
    isDragging: false,
    isResizing: false,
    isRotating: false,
    id: '',
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    origW: 80,
    origH: 80,
    origRot: 0,
    centerX: 0,
    centerY: 0,
  });

  // Resolve media URLs from IndexedDB for custom uploads / GIFs
  useEffect(() => {
    let isDisposed = false;
    const mediaIds = stickers.filter((s) => s.mediaId).map((s) => s.mediaId!);

    if (mediaIds.length === 0) return;

    Promise.all(
      mediaIds.map(async (mId) => {
        const url = await getMediaUrl(mId);
        return { mId, url };
      })
    ).then((results) => {
      if (isDisposed) return;
      const dict: Record<string, string> = {};
      results.forEach((r) => {
        if (r.url) dict[r.mId] = r.url;
      });
      setMediaUrls((prev) => ({ ...prev, ...dict }));
    });

    return () => {
      isDisposed = true;
    };
  }, [stickers]);

  // Click outside to deselect
  const handleBoardClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'IMG') {
      setSelectedId(null);
    }
  };

  // 1. Drag Move Handler
  const handlePointerDownSticker = (e: React.PointerEvent, st: StickerItem) => {
    e.stopPropagation();
    setSelectedId(st.id);

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    dragRef.current = {
      isDragging: true,
      isResizing: false,
      isRotating: false,
      id: st.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: st.x,
      origY: st.y,
      origW: st.width || 80,
      origH: st.height || 80,
      origRot: st.rotationDeg || 0,
      centerX: rect.left + (st.x / 100) * rect.width,
      centerY: rect.top + (st.y / 100) * rect.height,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // 2. Proportional Resize Handle
  const handlePointerDownResize = (e: React.PointerEvent, st: StickerItem) => {
    e.stopPropagation();
    dragRef.current = {
      isDragging: false,
      isResizing: true,
      isRotating: false,
      id: st.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: st.x,
      origY: st.y,
      origW: st.width || 80,
      origH: st.height || 80,
      origRot: st.rotationDeg || 0,
      centerX: 0,
      centerY: 0,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // 3. Rotate Handle
  const handlePointerDownRotate = (e: React.PointerEvent, st: StickerItem) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    dragRef.current = {
      isDragging: false,
      isResizing: false,
      isRotating: true,
      id: st.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: st.x,
      origY: st.y,
      origW: st.width || 80,
      origH: st.height || 80,
      origRot: st.rotationDeg || 0,
      centerX: rect.left + (st.x / 100) * rect.width,
      centerY: rect.top + (st.y / 100) * rect.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Global Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    const { isDragging, isResizing, isRotating, id, startX, startY, origX, origY, origW, origH, centerX, centerY } =
      dragRef.current;

    if (!isDragging && !isResizing && !isRotating) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (isDragging) {
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      const newX = Math.max(5, Math.min(95, Math.round((origX + dx) * 10) / 10));
      const newY = Math.max(5, Math.min(95, Math.round((origY + dy) * 10) / 10));

      onUpdateStickers(
        stickers.map((s) => (s.id === id ? { ...s, x: newX, y: newY } : s))
      );
    } else if (isResizing) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const aspect = origW > 0 && origH > 0 ? origW / origH : 1;
      const delta = (dx + dy) / 2;
      const newW = Math.max(30, Math.min(430, Math.round(origW + delta)));
      const newH = Math.max(30, Math.min(480, Math.round(newW / aspect)));

      onUpdateStickers(
        stickers.map((s) => (s.id === id ? { ...s, width: newW, height: newH } : s))
      );
    } else if (isRotating) {
      const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let deg = Math.round((rad * 180) / Math.PI) + 90; // Top is 0
      if (deg > 180) deg -= 360;
      if (deg < -180) deg += 360;

      onUpdateStickers(
        stickers.map((s) => (s.id === id ? { ...s, rotationDeg: deg } : s))
      );
    }
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
    dragRef.current.isResizing = false;
    dragRef.current.isRotating = false;
  };

  // Sticker actions
  const handleDeleteSticker = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onUpdateStickers(stickers.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleLayerSticker = (id: string, dir: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const st = stickers.find((s) => s.id === id);
    if (!st) return;
    const currentZ = st.zIndex || 1;
    const newZ = dir === 'up' ? currentZ + 1 : Math.max(1, currentZ - 1);
    onUpdateStickers(stickers.map((s) => (s.id === id ? { ...s, zIndex: newZ } : s)));
  };

  // Direct Sizing Controls
  const selectedSticker = stickers.find((s) => s.id === selectedId);

  const handleSetWidth = (targetW: number) => {
    if (!selectedId) return;
    const st = stickers.find((s) => s.id === selectedId);
    if (!st) return;

    const curW = st.width || 80;
    const curH = st.height || 80;
    const aspect = curW > 0 && curH > 0 ? curW / curH : 1;

    const newW = Math.max(30, Math.min(430, Math.round(targetW)));
    const newH = Math.max(30, Math.min(480, Math.round(newW / aspect)));

    onUpdateStickers(
      stickers.map((s) => (s.id === selectedId ? { ...s, width: newW, height: newH } : s))
    );
  };

  const handleNudgeSize = (delta: number) => {
    if (!selectedSticker) return;
    const curW = selectedSticker.width || 80;
    handleSetWidth(curW + delta);
  };

  const handleResetAspect = () => {
    if (!selectedId) return;
    const st = stickers.find((s) => s.id === selectedId);
    if (!st) return;
    const url = st.customUrl || (st.mediaId ? mediaUrls[st.mediaId] : null);
    if (!url) return;

    const testImg = new Image();
    testImg.onload = () => {
      if (testImg.naturalWidth && testImg.naturalHeight) {
        const aspect = testImg.naturalWidth / testImg.naturalHeight;
        const curW = st.width || 180;
        const newH = Math.round(curW / aspect);
        onUpdateStickers(
          stickers.map((s) => (s.id === selectedId ? { ...s, height: newH } : s))
        );
      }
    };
    testImg.src = url;
  };

  const handleCenterSticker = () => {
    if (!selectedId) return;
    onUpdateStickers(
      stickers.map((s) => (s.id === selectedId ? { ...s, x: 50, y: 50 } : s))
    );
  };

  const handleResetRotation = () => {
    if (!selectedId) return;
    onUpdateStickers(
      stickers.map((s) => (s.id === selectedId ? { ...s, rotationDeg: 0 } : s))
    );
  };

  return (
    <div className={styles.stickerCanvasContainer}>
      <div
        ref={containerRef}
        className={`${styles.interactivePage} ${className}`.trim()}
        style={{ width: `${width}px`, height: `${height}px` }}
        onClick={handleBoardClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Background Parchment */}
        {backgroundSrc && (
          <img
            src={backgroundSrc}
            alt=""
            className={styles.interactivePageBg}
            draggable={false}
          />
        )}

        {/* Embedded Page Text / Memories content */}
        {children}

        {/* Stickers Layer */}
        {stickers.map((st) => {
          const isSelected = st.id === selectedId;
          const sw = st.width || 80;
          const sh = st.height || 80;
          const url = st.customUrl || (st.mediaId ? mediaUrls[st.mediaId] : null);

          return (
            <div
              key={st.id}
              className={`${styles.stickerElement} ${
                isSelected ? styles.stickerElementSelected : ''
              }`}
              style={{
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: `${sw}px`,
                height: `${sh}px`,
                transform: `translate(-50%, -50%) rotate(${st.rotationDeg || 0}deg)`,
                zIndex: st.zIndex || 1,
              }}
              onPointerDown={(e) => handlePointerDownSticker(e, st)}
            >
              {/* Dimension Badge for Selected Sticker */}
              {isSelected && (
                <div className={styles.stickerDimensionBadge}>
                  {sw} × {sh}px
                </div>
              )}

              {/* Control Bar for Selected Sticker */}
              {isSelected && (
                <div
                  className={styles.stickerControls}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={styles.stickerCtrlBtn}
                    onClick={(e) => handleLayerSticker(st.id, 'up', e)}
                    title="Bring Forward"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className={styles.stickerCtrlBtn}
                    onClick={(e) => handleLayerSticker(st.id, 'down', e)}
                    title="Send Backward"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className={styles.stickerCtrlBtn}
                    onClick={(e) => handleDeleteSticker(st.id, e)}
                    title="Delete Sticker"
                    style={{ color: '#ff7766' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Corner Resize & Rotate Handles */}
              {isSelected && (
                <>
                  <div
                    className={styles.resizeHandle}
                    onPointerDown={(e) => handlePointerDownResize(e, st)}
                    title="Drag to resize (proportional)"
                  />
                  <div
                    className={styles.rotateHandle}
                    onPointerDown={(e) => handlePointerDownRotate(e, st)}
                    title="Drag to rotate"
                  />
                </>
              )}

              {/* Visual Media Rendering (GIFs & Images) */}
              {url ? (
                <img
                  src={url}
                  alt={st.label || 'Sticker'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
              ) : (
                // Default Fallback Badge
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      st.type === 'seal'
                        ? '#9e3223'
                        : st.type === 'stamp'
                        ? '#fff8ee'
                        : 'rgba(255, 248, 235, 0.95)',
                    color: st.type === 'seal' ? '#ffe0d8' : '#3c2415',
                    borderRadius: st.type === 'seal' ? '50%' : '6px',
                    border:
                      st.type === 'stamp'
                        ? '2px dashed #8d735a'
                        : '1.5px solid #d5b376',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    padding: '4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  }}
                >
                  {st.label || 'Sticker'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sizing & Positioning Inspector Bar when a sticker/image is selected */}
      {selectedSticker && (
        <div className={styles.stickerInspector} onClick={(e) => e.stopPropagation()}>
          <div className={styles.inspectorHeader}>
            <span className={styles.inspectorTitle}>
              Selected: <strong>{selectedSticker.label || 'Item'}</strong>
            </span>
            <span className={styles.inspectorSizeBadge}>
              {selectedSticker.width || 80} × {selectedSticker.height || 80}px ({selectedSticker.rotationDeg || 0}°)
            </span>
          </div>

          {/* Size Slider & Nudge Buttons */}
          <div className={styles.inspectorRow}>
            <span className={styles.inspectorLabel}>Size:</span>
            <button
              type="button"
              className={styles.sizeNudgeBtn}
              onClick={() => handleNudgeSize(-15)}
              title="Shrink by 15px"
            >
              −
            </button>
            <input
              type="range"
              min="30"
              max="430"
              step="5"
              value={selectedSticker.width || 80}
              onChange={(e) => handleSetWidth(Number(e.target.value))}
              className={styles.sizeSlider}
            />
            <button
              type="button"
              className={styles.sizeNudgeBtn}
              onClick={() => handleNudgeSize(15)}
              title="Enlarge by 15px"
            >
              +
            </button>
            <span className={styles.sizeValue}>{selectedSticker.width || 80}px</span>
          </div>

          {/* Quick Presets */}
          <div className={styles.inspectorRow}>
            <span className={styles.inspectorLabel}>Presets:</span>
            <div className={styles.presetGroup}>
              <button type="button" className={styles.presetBtn} onClick={() => handleSetWidth(80)}>
                Small (80px)
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => handleSetWidth(160)}>
                Medium (160px)
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => handleSetWidth(260)}>
                Large (260px)
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => handleSetWidth(380)}>
                Full Page (380px)
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={handleResetAspect}
                title="Restore original image aspect ratio"
              >
                ↺ Reset Ratio
              </button>
            </div>
          </div>

          {/* Alignment & Tools */}
          <div className={styles.inspectorRow}>
            <span className={styles.inspectorLabel}>Tools:</span>
            <div className={styles.toolBtnGroup}>
              <button type="button" className={styles.toolBtn} onClick={handleCenterSticker}>
                ✛ Center
              </button>
              <button type="button" className={styles.toolBtn} onClick={handleResetRotation}>
                ↺ 0° Straight
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={(e) => handleLayerSticker(selectedSticker.id, 'up', e)}
                title="Bring Forward"
              >
                ▲ Up
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={(e) => handleLayerSticker(selectedSticker.id, 'down', e)}
                title="Send Backward"
              >
                ▼ Down
              </button>
              <button
                type="button"
                className={styles.toolBtnDelete}
                onClick={(e) => handleDeleteSticker(selectedSticker.id, e)}
                title="Delete from page"
              >
                ✕ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
