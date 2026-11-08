/**
 * BUTTERFLY — Scrapbook Editor Component
 * Full editing of all 8 scrapbook pages across 4 chapters:
 * - Text, headings, drop caps, narrative paragraphs, notes, and polaroids
 * - Interactive visual page canvas with drag, resize, rotate, and layering of stickers/GIFs
 * - Multi-level Undo / Redo history stack
 * - Media library integration for PNG, JPG, WebP, and animated GIF insertion
 */

import React, { useState, useCallback, useRef } from 'react';
import type {
  ButterflyContent,
  StorySpreadContent,
  PageLeftContent,
  PageRightContent,
  StickerItem,
  MediaAsset,
} from '../../../services/content/types';
import { StickerCanvas } from '../Common/StickerCanvas';
import { MediaLibrary } from '../MediaLibrary/MediaLibrary';
import styles from '../../Admin.module.css';

export interface ScrapbookEditorProps {
  content: ButterflyContent;
  onChange: (updater: (prev: ButterflyContent) => ButterflyContent) => void;
}

export const ScrapbookEditor: React.FC<ScrapbookEditorProps> = ({
  content,
  onChange,
}) => {
  const [activeSpreadIdx, setActiveSpreadIdx] = useState(0);
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('right');
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Undo / Redo history stack
  const historyRef = useRef<ButterflyContent[]>([]);
  const historyIdxRef = useRef<number>(-1);

  const pushHistory = useCallback((currentContent: ButterflyContent) => {
    // Keep max 25 steps
    const newHistory = historyRef.current.slice(0, historyIdxRef.current + 1);
    newHistory.push(JSON.parse(JSON.stringify(currentContent)));
    if (newHistory.length > 25) newHistory.shift();
    historyRef.current = newHistory;
    historyIdxRef.current = newHistory.length - 1;
  }, []);

  const handleUndo = () => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current--;
      const snapshot = historyRef.current[historyIdxRef.current];
      onChange(() => JSON.parse(JSON.stringify(snapshot)));
    }
  };

  const handleRedo = () => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current++;
      const snapshot = historyRef.current[historyIdxRef.current];
      onChange(() => JSON.parse(JSON.stringify(snapshot)));
    }
  };

  const activeSpread = content.spreads[activeSpreadIdx] || content.spreads[0];
  const activeLeft = activeSpread.leftPage;
  const activeRight = activeSpread.rightPage;

  // Update spread helper
  const updateActiveSpread = (
    updater: (spread: StorySpreadContent) => StorySpreadContent
  ) => {
    pushHistory(content);
    onChange((prev) => {
      const nextSpreads = [...prev.spreads];
      nextSpreads[activeSpreadIdx] = updater(nextSpreads[activeSpreadIdx]);
      return {
        ...prev,
        spreads: nextSpreads,
      };
    });
  };

  // Update Left Page
  const updateLeftPage = (updater: (left: PageLeftContent) => PageLeftContent) => {
    updateActiveSpread((sp) => ({
      ...sp,
      leftPage: updater(sp.leftPage),
    }));
  };

  // Update Right Page
  const updateRightPage = (updater: (right: PageRightContent) => PageRightContent) => {
    updateActiveSpread((sp) => ({
      ...sp,
      rightPage: updater(sp.rightPage),
    }));
  };

  // Sticker updates from canvas
  const handleUpdateStickers = (stickers: StickerItem[]) => {
    if (activeSide === 'left') {
      updateLeftPage((l) => ({ ...l, stickers }));
    } else {
      updateRightPage((r) => ({ ...r, stickers }));
    }
  };

  // Insert sticker from Media Picker
  const handleSelectMediaForSticker = (asset: MediaAsset, url: string) => {
    setShowMediaPicker(false);
    const newSticker: StickerItem = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: asset.isGif ? 'gif' : 'image',
      label: asset.name,
      mediaId: asset.id,
      customUrl: url,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotationDeg: 0,
      zIndex: 10,
    };

    if (activeSide === 'left') {
      updateLeftPage((l) => ({ ...l, stickers: [...l.stickers, newSticker] }));
    } else {
      updateRightPage((r) => ({ ...r, stickers: [...r.stickers, newSticker] }));
    }
  };

  return (
    <div>
      {/* Spread & Page Navigator Row */}
      <div className={styles.spreadSelectorRow}>
        <div className={styles.spreadTabs}>
          {content.spreads.map((sp, idx) => (
            <button
              key={sp.id}
              type="button"
              className={`${styles.spreadTab} ${
                activeSpreadIdx === idx ? styles.spreadTabActive : ''
              }`}
              onClick={() => setActiveSpreadIdx(idx)}
            >
              Chapter {idx + 1}
            </button>
          ))}
        </div>

        {/* Side Toggle: Left (Photos) vs Right (Story) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={styles.pageSideToggle}>
            <button
              type="button"
              className={`${styles.sideBtn} ${
                activeSide === 'left' ? styles.sideBtnActive : ''
              }`}
              onClick={() => setActiveSide('left')}
            >
              Left Page (Photos & Notes)
            </button>
            <button
              type="button"
              className={`${styles.sideBtn} ${
                activeSide === 'right' ? styles.sideBtnActive : ''
              }`}
              onClick={() => setActiveSide('right')}
            >
              Right Page (Narrative)
            </button>
          </div>

          {/* Undo / Redo */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={styles.btnSecondary}
              style={{ padding: '6px 10px' }}
              onClick={handleUndo}
              title="Undo last change"
            >
              ↺ Undo
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              style={{ padding: '6px 10px' }}
              onClick={handleRedo}
              title="Redo"
            >
              ↻ Redo
            </button>
          </div>
        </div>
      </div>

      {/* Editor Workspace: Visual Canvas + Form Inspector */}
      <div className={styles.editorWorkspace}>
        {/* Left Column: Interactive Visual Canvas */}
        <div className={styles.canvasColumn}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-gold-primary)' }}>
              Interactive Visual Page ({activeSide === 'left' ? 'Page ' + (activeSpreadIdx * 2 + 1) : 'Page ' + (activeSpreadIdx * 2 + 2)})
            </span>
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              onClick={() => setShowMediaPicker(true)}
            >
              + Add Sticker / Animated GIF
            </button>
          </div>

          <div className={styles.canvasBoardWrapper}>
            <StickerCanvas
              stickers={activeSide === 'left' ? activeLeft.stickers : activeRight.stickers}
              onUpdateStickers={handleUpdateStickers}
              backgroundSrc={
                activeSide === 'left'
                  ? '/storybook/studio_page_blank_left.jpg'
                  : '/storybook/studio_page_blank_right.jpg'
              }
            >
              {/* Overlay preview of text / polaroid content for realistic placement */}
              {activeSide === 'right' ? (
                <div style={{ padding: '40px 30px', pointerEvents: 'none', userSelect: 'none' }}>
                  <div style={{ color: '#9b7a48', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
                    {activeRight.chapterNumber}
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#2d1808', margin: '6px 0 16px' }}>
                    {activeRight.chapterTitle}
                  </h3>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', color: '#3a2414', lineHeight: 1.5 }}>
                    {activeRight.storyParagraphs[0]?.slice(0, 160)}...
                  </div>
                  {activeRight.signature && (
                    <div style={{ fontStyle: 'italic', color: '#5c3a22', fontSize: '12px', textAlign: 'right', marginTop: '20px' }}>
                      {activeRight.signature}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '30px 20px', pointerEvents: 'none', userSelect: 'none' }}>
                  <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                    {activeLeft.photos.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: '#fffdfa',
                          padding: '6px 6px 14px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                          width: '130px',
                          transform: `rotate(${p.rotationDeg}deg)`,
                          borderRadius: '2px',
                        }}
                      >
                        <div style={{ width: '100%', height: '90px', background: p.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                          {p.doodle || '📷'}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#3c2415', marginTop: '6px' }}>
                          {p.title}
                        </div>
                      </div>
                    ))}
                  </div>
                  {activeLeft.handwrittenNotes.length > 0 && (
                    <div style={{ fontStyle: 'italic', color: '#412a1a', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
                      {activeLeft.handwrittenNotes[0]}
                    </div>
                  )}
                </div>
              )}
            </StickerCanvas>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', textAlign: 'center' }}>
            Tip: Click a sticker to select it. Drag to reposition, use bottom-right corner to resize, top handle to rotate.
          </span>
        </div>

        {/* Right Column: Form Inspector */}
        <div className={styles.inspectorColumn}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', margin: 0, color: 'var(--admin-gold-primary)' }}>
            {activeSide === 'left' ? 'Left Page Content' : 'Right Page Story Content'}
          </h3>

          {activeSide === 'right' ? (
            /* Right Page Narrative Form */
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Chapter Number</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={activeRight.chapterNumber}
                  onChange={(e) => updateRightPage((r) => ({ ...r, chapterNumber: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Chapter Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={activeRight.chapterTitle}
                  onChange={(e) => updateRightPage((r) => ({ ...r, chapterTitle: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Location or Date Caption</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={activeRight.dateOrLocation || ''}
                  onChange={(e) => updateRightPage((r) => ({ ...r, dateOrLocation: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ornamental Drop Cap Letter</label>
                <input
                  type="text"
                  maxLength={1}
                  className={styles.formInput}
                  style={{ width: '80px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }}
                  value={activeRight.decorativeInitial}
                  onChange={(e) => updateRightPage((r) => ({ ...r, decorativeInitial: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Story Paragraph 1</label>
                <textarea
                  className={styles.formTextarea}
                  value={activeRight.storyParagraphs[0] || ''}
                  onChange={(e) =>
                    updateRightPage((r) => {
                      const next = [...r.storyParagraphs];
                      next[0] = e.target.value;
                      return { ...r, storyParagraphs: next };
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Story Paragraph 2</label>
                <textarea
                  className={styles.formTextarea}
                  value={activeRight.storyParagraphs[1] || ''}
                  onChange={(e) =>
                    updateRightPage((r) => {
                      const next = [...r.storyParagraphs];
                      next[1] = e.target.value;
                      return { ...r, storyParagraphs: next };
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Closing Signature</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={activeRight.signature || ''}
                  onChange={(e) => updateRightPage((r) => ({ ...r, signature: e.target.value }))}
                />
              </div>
            </>
          ) : (
            /* Left Page Photos & Notes Form */
            <>
              {activeLeft.photos.map((photo, pIdx) => (
                <div
                  key={photo.id}
                  style={{
                    background: 'rgba(28, 22, 16, 0.6)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--admin-gold-primary)' }}>
                    Polaroid Photo {pIdx + 1}
                  </span>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Photo Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={photo.title}
                      onChange={(e) =>
                        updateLeftPage((l) => {
                          const nextPhotos = [...l.photos];
                          nextPhotos[pIdx] = { ...nextPhotos[pIdx], title: e.target.value };
                          return { ...l, photos: nextPhotos };
                        })
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date Caption</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={photo.date || ''}
                      onChange={(e) =>
                        updateLeftPage((l) => {
                          const nextPhotos = [...l.photos];
                          nextPhotos[pIdx] = { ...nextPhotos[pIdx], date: e.target.value };
                          return { ...l, photos: nextPhotos };
                        })
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Washi Tape Style</label>
                    <select
                      className={styles.formSelect}
                      value={photo.tapeStyle}
                      onChange={(e) =>
                        updateLeftPage((l) => {
                          const nextPhotos = [...l.photos];
                          nextPhotos[pIdx] = {
                            ...nextPhotos[pIdx],
                            tapeStyle: e.target.value as any,
                          };
                          return { ...l, photos: nextPhotos };
                        })
                      }
                    >
                      <option value="washi-pink">Washi Pink Ribbon</option>
                      <option value="washi-gold">Washi Gold Leaf</option>
                      <option value="corner-tabs">Corner Photo Tabs</option>
                    </select>
                  </div>
                </div>
              ))}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Handwritten Notes (One per line)</label>
                <textarea
                  className={styles.formTextarea}
                  value={activeLeft.handwrittenNotes.join('\n')}
                  placeholder="Enter quotes or handwritten notes..."
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    updateLeftPage((l) => ({ ...l, handwrittenNotes: lines }));
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className={styles.modalBackdrop} onClick={() => setShowMediaPicker(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Select Sticker or Animated GIF</h3>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowMediaPicker(false)}
              >
                ✕ Close
              </button>
            </div>
            <div className={styles.modalBody}>
              <MediaLibrary isPickerMode onSelectMedia={handleSelectMediaForSticker} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
