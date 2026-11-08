/**
 * BUTTERFLY — Scrapbook Editor Component
 * Full editing of all 8 scrapbook pages across 4 chapters:
 * - Text, headings, drop caps, narrative paragraphs, notes, and polaroids
 * - Interactive visual page canvas with drag, resize, rotate, and layering of stickers/GIFs
 * - Multi-level Undo / Redo history stack
 * - Media library integration for PNG, JPG, WebP, and animated GIF insertion
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ButterflyContent,
  StorySpreadContent,
  PageLeftContent,
  PageRightContent,
  StickerItem,
  MediaAsset,
  PageTypography,
  MusicMarker,
} from '../../../services/content/types';
import { audioPlayer } from '../../../services/audio/audioPlayer';
import { getAllAudioTracks, type AudioTrack } from '../../../services/audio/audioDB';
import { NowPlayingPill } from '../../../components/common/NowPlayingPill';
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

  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const storyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getAllAudioTracks().then((tracks) => setAudioTracks(tracks));
    const handleUpdate = () => {
      getAllAudioTracks().then((tracks) => setAudioTracks(tracks));
    };
    window.addEventListener('butterfly_audio_library_updated', handleUpdate);
    return () => window.removeEventListener('butterfly_audio_library_updated', handleUpdate);
  }, []);

  // Active page typography & capacity calculations
  const typo = activeRight.typography || {};
  const activeFont = typo.fontFamily || 'Caveat';
  const activeFontSize = typo.fontSize || 34;
  const activeColor = typo.color || '#17120F';
  const activeLineHeight = typo.lineHeight || 1.55;
  const activeParaSpacing = typo.paragraphSpacing !== undefined ? typo.paragraphSpacing : 28;
  const activeAlign = typo.textAlign || 'left';

  // Capacity calculation for right page:
  const allWords = activeRight.storyParagraphs.join(' ').trim().split(/\s+/).filter(Boolean);
  const wordsCount = allWords.length;
  const nonBlankParas = activeRight.storyParagraphs.filter((p) => p.trim().length > 0);

  // Usable text width on canvas is 734px. Avg character width in handwriting font is approx fontSize * 0.43
  const avgCharW = activeFontSize * 0.43;
  const charsPerLine = Math.max(22, Math.floor(734 / avgCharW));

  let estTotalLines = 0;
  nonBlankParas.forEach((p) => {
    const linesInPara = Math.max(1, Math.ceil(p.length / charsPerLine));
    estTotalLines += linesInPara;
  });

  const linePx = Math.round(activeFontSize * activeLineHeight);
  const totalTextHeightPx = (estTotalLines * linePx) + (Math.max(0, nonBlankParas.length - 1) * activeParaSpacing);
  const usableHeightPx = 760; // 1082 canvas - 240 header - 82 bottom margin
  const capacityPct = Math.round((totalTextHeightPx / usableHeightPx) * 100);

  // Scaled typography for live preview
  const previewFontSize = `${Math.round(activeFontSize * 0.58)}px`;
  const previewParaGap = `${Math.round(activeParaSpacing * 0.38)}px`;

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

  // Update Right Page Typography
  const updateTypography = (updater: (prev: PageTypography) => PageTypography) => {
    updateRightPage((r) => ({
      ...r,
      typography: updater(r.typography || {
        fontFamily: 'Caveat',
        fontSize: 34,
        color: '#17120F',
        lineHeight: 1.55,
        paragraphSpacing: 28,
        textAlign: 'left',
      }),
    }));
  };

  const handleResetTypography = () => {
    updateTypography(() => ({
      fontFamily: 'Caveat',
      fontSize: 34,
      color: '#17120F',
      lineHeight: 1.55,
      paragraphSpacing: 28,
      textAlign: 'left',
    }));
  };

  const handleInsertMusicNote = () => {
    const textarea = storyTextareaRef.current;
    const markerId = `m_${Date.now()}`;
    const markerTag = `[[music:${markerId}]]`;

    const currentText = activeRight.storyParagraphs.join('\n\n');
    let newText = '';
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      newText = currentText.substring(0, start) + ' ' + markerTag + ' ' + currentText.substring(end);
    } else {
      newText = currentText + ' ' + markerTag;
    }

    const paras = newText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const defaultTrack = audioTracks[0] || {
      id: 'sample_our_evening',
      name: 'Our Evening ♡',
    };

    const newMarker: MusicMarker = {
      id: markerId,
      trackId: defaultTrack.id,
      title: defaultTrack.name,
      loop: true,
    };

    updateRightPage((r) => ({
      ...r,
      storyParagraphs: paras,
      musicMarkers: {
        ...(r.musicMarkers || {}),
        [markerId]: newMarker,
      },
    }));

    setEditingMarkerId(markerId);
  };

  const handleUpdateMusicMarker = (markerId: string, updates: Partial<MusicMarker>) => {
    updateRightPage((r) => {
      const existing = r.musicMarkers?.[markerId] || {
        id: markerId,
        trackId: 'sample_our_evening',
        title: 'Our Evening ♡',
        loop: true,
      };
      return {
        ...r,
        musicMarkers: {
          ...(r.musicMarkers || {}),
          [markerId]: { ...existing, ...updates },
        },
      };
    });
  };

  const handleDeleteMusicMarker = (markerId: string) => {
    const markerTagRegex = new RegExp(`\\[\\[music:${markerId}\\]\\]`, 'g');
    const cleanedParas = activeRight.storyParagraphs.map((p) =>
      p.replace(markerTagRegex, '').replace(/\s{2,}/g, ' ').trim()
    ).filter(Boolean);

    updateRightPage((r) => {
      const remainingMarkers = { ...(r.musicMarkers || {}) };
      delete remainingMarkers[markerId];
      return {
        ...r,
        storyParagraphs: cleanedParas,
        musicMarkers: remainingMarkers,
      };
    });

    if (editingMarkerId === markerId) {
      setEditingMarkerId(null);
    }
  };

  const renderPreviewParagraph = (para: string) => {
    const parts = para.split(/(\[\[music:[a-zA-Z0-9_\-]+\]\][,\.!?;:]*)/g);
    return parts.map((part, pIdx) => {
      const match = part.match(/^\[\[music:([a-zA-Z0-9_\-]+)\]\]([,\.!?;:]*)$/);
      if (!match) return part;

      const markerId = match[1];
      const punct = match[2] || '';
      const marker = activeRight.musicMarkers?.[markerId] || {
        id: markerId,
        trackId: 'sample_our_evening',
        title: 'Our Evening ♡',
        loop: true,
      };

      return (
        <span key={pIdx} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              margin: '0 4px',
              background: 'radial-gradient(circle at 35% 35%, #fef0bc 0%, #f5ba58 60%, #db8a2a 100%)',
              border: '1px solid rgba(120, 68, 18, 0.45)',
              boxShadow: '0 2px 6px rgba(215, 140, 40, 0.45)',
              cursor: 'pointer',
              color: '#17120F',
              fontFamily: 'Caveat, cursive, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              padding: 0,
              verticalAlign: 'middle',
            }}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              audioPlayer.playMarker(marker, { x: rect.left + rect.width / 2, y: rect.top });
            }}
            title={`Play "${marker.title}" (Click to test audio)`}
          >
            ♫
          </button>
          {punct}
        </span>
      );
    });
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
                <div style={{ padding: '36px 32px', pointerEvents: 'none', userSelect: 'none', position: 'relative', height: '100%' }}>
                  {/* Butterfly flight loop doodle in top right */}
                  <img
                    src="/storybook/assets/doodle_butterfly.png"
                    alt=""
                    style={{ position: 'absolute', top: '18px', right: '24px', width: '60px', opacity: 0.95 }}
                  />

                  {/* Top-Right Date with Pen Underline */}
                  {activeRight.dateOrLocation && (
                    <div style={{ textAlign: 'right', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontFamily: `"${activeFont}", 'Caveat', 'Patrick Hand', cursive, sans-serif`,
                          fontSize: '24px',
                          color: activeColor,
                          fontWeight: 600,
                        }}
                      >
                        {activeRight.dateOrLocation}
                      </span>
                      <div
                        style={{
                          width: '70px',
                          height: '2px',
                          background: activeColor,
                          marginLeft: 'auto',
                          marginTop: '-2px',
                        }}
                      />
                    </div>
                  )}

                  {/* Chapter Header with Blush Highlight */}
                  {activeRight.chapterNumber && (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '4px' }}>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '2px',
                          left: '-4px',
                          width: 'calc(100% + 10px)',
                          height: '14px',
                          background: 'rgba(235, 160, 175, 0.45)',
                          borderRadius: '4px',
                        }}
                      />
                      <span
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          fontFamily: `"${activeFont}", 'Caveat', 'Patrick Hand', cursive, sans-serif`,
                          fontSize: '22px',
                          fontWeight: 700,
                          color: activeColor,
                        }}
                      >
                        {activeRight.chapterNumber}
                      </span>
                    </div>
                  )}

                  {/* Chapter Title with Blush Highlight */}
                  {activeRight.chapterTitle && (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          left: '-6px',
                          width: 'calc(100% + 14px)',
                          height: '18px',
                          background: 'rgba(235, 160, 175, 0.45)',
                          borderRadius: '6px',
                        }}
                      />
                      <h3
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          fontFamily: `"${activeFont}", 'Caveat', 'Patrick Hand', cursive, sans-serif`,
                          fontSize: '28px',
                          fontWeight: 700,
                          color: activeColor,
                          margin: 0,
                        }}
                      >
                        {activeRight.chapterTitle}
                      </h3>
                    </div>
                  )}

                  {/* Handwritten Story Body in Pure Black Fountain Pen Ink flowing down */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: previewParaGap }}>
                    {activeRight.storyParagraphs.map((para, pIdx) => (
                      <p
                        key={pIdx}
                        style={{
                          fontFamily: `"${activeFont}", 'Caveat', 'Patrick Hand', cursive, sans-serif`,
                          fontSize: previewFontSize,
                          lineHeight: activeLineHeight,
                          color: activeColor,
                          margin: 0,
                          textAlign: activeAlign,
                        }}
                      >
                        {renderPreviewParagraph(para)}
                      </p>
                    ))}
                  </div>

                  {/* Closing Signature if present */}
                  {activeRight.signature && (
                    <div style={{ textAlign: 'right', marginTop: '12px' }}>
                      <span
                        style={{
                          fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                          fontStyle: 'italic',
                          fontSize: `calc(${previewFontSize} * 0.95)`,
                          color: activeColor,
                        }}
                      >
                        {activeRight.signature}
                      </span>
                    </div>
                  )}

                  {/* Pink Wildflower Sprig in Bottom Right */}
                  <img
                    src="/storybook/assets/flower_pink_sprig.png"
                    alt=""
                    style={{ position: 'absolute', bottom: '18px', right: '22px', width: '65px', opacity: 0.92 }}
                  />
                </div>
              ) : (
                <div style={{ padding: '24px 16px', pointerEvents: 'none', userSelect: 'none', height: '100%', position: 'relative' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '14px',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {activeLeft.photos.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: '#fffefb',
                          border: '1px solid #ede4d3',
                          padding: '6px 6px 14px',
                          boxShadow: '0 8px 18px rgba(25,14,6,0.22)',
                          width: activeLeft.photos.length === 3 ? '120px' : '145px',
                          transform: `rotate(${p.rotationDeg}deg)`,
                          borderRadius: '2px',
                          position: 'relative',
                        }}
                      >
                        {/* Washi Tape Strip */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '55px',
                            height: '14px',
                            background:
                              p.tapeStyle === 'washi-gold'
                                ? 'rgba(235, 215, 185, 0.9)'
                                : 'rgba(245, 175, 190, 0.9)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          }}
                        />

                        {/* Photo Image or fallback */}
                        <div
                          style={{
                            width: '100%',
                            height: activeLeft.photos.length === 3 ? '85px' : '105px',
                            background: p.bgGradient || '#fdfbf7',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {p.customUrl ? (
                            <img
                              src={p.customUrl}
                              alt={p.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: '24px' }}>{p.doodle || '📷'}</span>
                          )}
                        </div>

                        {/* Polaroid Caption in Black Ink Handwriting */}
                        <div
                          style={{
                            fontFamily: "'Caveat', 'Patrick Hand', cursive",
                            fontSize: '14px',
                            color: '#161311',
                            fontWeight: 600,
                            marginTop: '6px',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </StickerCanvas>
            <NowPlayingPill />
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

              {/* Typography & Handwriting Controls Card */}
              <div className={styles.typographyCard}>
                <div className={styles.typographyHeader}>
                  <h4 className={styles.typographyTitle}>
                    <span>✒️</span> Typography & Layout
                  </h4>
                  <button
                    type="button"
                    onClick={handleResetTypography}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--admin-gold-primary)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Reset Defaults
                  </button>
                </div>

                {/* Font Family Selector */}
                <div className={styles.formGroup} style={{ gap: '4px' }}>
                  <label className={styles.formLabel}>Font Family</label>
                  <select
                    className={styles.formSelect}
                    value={activeFont}
                    onChange={(e) => updateTypography((t) => ({ ...t, fontFamily: e.target.value }))}
                  >
                    <option value="Caveat">Caveat (Authentic Diary Cursive)</option>
                    <option value="Patrick Hand">Patrick Hand (Warm Handwritten)</option>
                    <option value="Kalam">Kalam (Natural Fountain Pen)</option>
                    <option value="Playfair Display">Playfair Display (Editorial Serif)</option>
                    <option value="Cormorant Garamond">Cormorant Garamond (Romantic Serif)</option>
                  </select>
                </div>

                {/* Font Size (Slider + Numeric Box) */}
                <div className={styles.formGroup} style={{ gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.formLabel}>Font Size</label>
                    <span style={{ fontSize: '0.76rem', color: 'var(--admin-gold-bright)', fontFamily: 'monospace' }}>
                      {activeFontSize}px
                    </span>
                  </div>
                  <div className={styles.sliderRow}>
                    <input
                      type="range"
                      min={20}
                      max={52}
                      step={1}
                      className={styles.sliderInput}
                      value={activeFontSize}
                      onChange={(e) => updateTypography((t) => ({ ...t, fontSize: Number(e.target.value) }))}
                    />
                    <input
                      type="number"
                      min={20}
                      max={52}
                      className={styles.sliderNumberBox}
                      value={activeFontSize}
                      onChange={(e) => updateTypography((t) => ({ ...t, fontSize: Number(e.target.value) || 34 }))}
                    />
                  </div>
                </div>

                {/* Ink Color Picker & Swatches */}
                <div className={styles.formGroup} style={{ gap: '4px' }}>
                  <label className={styles.formLabel}>Ink Color</label>
                  <div className={styles.colorPickerRow}>
                    <input
                      type="color"
                      className={styles.colorPickerNative}
                      value={activeColor}
                      onChange={(e) => updateTypography((t) => ({ ...t, color: e.target.value }))}
                    />
                    <input
                      type="text"
                      className={styles.colorPickerHex}
                      value={activeColor}
                      onChange={(e) => updateTypography((t) => ({ ...t, color: e.target.value }))}
                    />
                    <div className={styles.colorSwatches}>
                      {[
                        { label: 'Deep Black', color: '#17120F' },
                        { label: 'Dark Walnut', color: '#2b1810' },
                        { label: 'Vintage Sepia', color: '#3e2a1e' },
                        { label: 'Indigo Navy', color: '#161c28' },
                      ].map((swatch) => (
                        <button
                          key={swatch.color}
                          type="button"
                          title={swatch.label}
                          className={styles.colorSwatchBtn}
                          style={{
                            background: swatch.color,
                            border: activeColor.toLowerCase() === swatch.color.toLowerCase() ? '2px solid var(--admin-gold-bright)' : '1.5px solid rgba(255,255,255,0.25)',
                          }}
                          onClick={() => updateTypography((t) => ({ ...t, color: swatch.color }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Line Height Slider */}
                <div className={styles.formGroup} style={{ gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.formLabel}>Line Height</label>
                    <span style={{ fontSize: '0.76rem', color: 'var(--admin-gold-bright)', fontFamily: 'monospace' }}>
                      {activeLineHeight.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.2}
                    max={2.2}
                    step={0.05}
                    className={styles.sliderInput}
                    value={activeLineHeight}
                    onChange={(e) => updateTypography((t) => ({ ...t, lineHeight: Number(e.target.value) }))}
                  />
                </div>

                {/* Paragraph Spacing Slider */}
                <div className={styles.formGroup} style={{ gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.formLabel}>Paragraph Spacing</label>
                    <span style={{ fontSize: '0.76rem', color: 'var(--admin-gold-bright)', fontFamily: 'monospace' }}>
                      {activeParaSpacing}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    step={2}
                    className={styles.sliderInput}
                    value={activeParaSpacing}
                    onChange={(e) => updateTypography((t) => ({ ...t, paragraphSpacing: Number(e.target.value) }))}
                  />
                </div>

                {/* Text Alignment */}
                <div className={styles.formGroup} style={{ gap: '4px' }}>
                  <label className={styles.formLabel}>Text Alignment</label>
                  <div className={styles.segmentedButtonGroup}>
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        className={`${styles.segmentedButton} ${activeAlign === align ? styles.segmentedButtonActive : ''}`}
                        onClick={() => updateTypography((t) => ({ ...t, textAlign: align }))}
                      >
                        {align === 'left' ? 'Left ⯸' : align === 'center' ? 'Center ⯹' : 'Right ⯺'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Multi-Paragraph Story Narrative Editor */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className={styles.formLabel}>Story Narrative (Full-Page Writing)</label>
                  <button
                    type="button"
                    style={{
                      background: 'linear-gradient(135deg, rgba(229, 189, 117, 0.25), rgba(200, 150, 80, 0.2))',
                      border: '1px solid var(--admin-gold-primary)',
                      borderRadius: '6px',
                      color: 'var(--admin-gold-primary)',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    onClick={handleInsertMusicNote}
                    title="Insert an interactive music note between words or sentences"
                  >
                    <span>♫</span>
                    <span>Insert Music Note</span>
                  </button>
                </div>
                <textarea
                  ref={storyTextareaRef}
                  className={styles.formTextarea}
                  style={{
                    minHeight: '160px',
                    fontFamily: `"${activeFont}", cursive, sans-serif`,
                    fontSize: '1.05rem',
                    lineHeight: '1.5',
                  }}
                  value={activeRight.storyParagraphs.join('\n\n')}
                  onChange={(e) => {
                    const text = e.target.value;
                    const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
                    updateRightPage((r) => ({
                      ...r,
                      storyParagraphs: paras.length > 0 ? paras : (text.trim() ? [text.trim()] : []),
                    }));
                  }}
                  placeholder="Write your story freely across the page. Separate paragraphs with an empty line..."
                />
              </div>

              {/* Inline Music Markers Configuration Section */}
              {(() => {
                const text = activeRight.storyParagraphs.join('\n\n');
                const matchedIds: string[] = [];
                const regex = /\[\[music:([a-zA-Z0-9_\-]+)\]\]/g;
                let m: RegExpExecArray | null;
                while ((m = regex.exec(text)) !== null) {
                  if (!matchedIds.includes(m[1])) matchedIds.push(m[1]);
                }
                const registeredIds = Object.keys(activeRight.musicMarkers || {});
                const allMarkerIds = Array.from(new Set([...matchedIds, ...registeredIds]));

                if (allMarkerIds.length === 0) return null;

                return (
                  <div
                    style={{
                      background: 'rgba(25, 18, 12, 0.65)',
                      border: '1px solid rgba(229, 189, 117, 0.35)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--admin-gold-primary)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>🎵</span>
                        <span>Inline Music Notes on this Page ({allMarkerIds.length})</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {allMarkerIds.map((mId) => {
                        const marker = activeRight.musicMarkers?.[mId] || {
                          id: mId,
                          trackId: audioTracks[0]?.id || 'sample_our_evening',
                          title: 'Our Evening ♡',
                          loop: true,
                        };
                        const isSelected = editingMarkerId === mId;

                        return (
                          <div
                            key={mId}
                            style={{
                              background: isSelected ? 'rgba(229, 189, 117, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                              border: `1px solid ${isSelected ? 'var(--admin-gold-primary)' : 'rgba(229, 189, 117, 0.2)'}`,
                              borderRadius: '6px',
                              padding: '8px 10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, #f5ba58, #db8a2a)',
                                    color: '#17120F',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                  }}
                                >
                                  ♫
                                </span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-text-main)' }}>
                                  {marker.title || 'Untitled Song'}
                                </span>
                                <code style={{ fontSize: '0.68rem', color: 'var(--admin-gold-bright)', opacity: 0.85 }}>
                                  [[music:{mId}]]
                                </code>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  style={{
                                    background: 'rgba(229, 189, 117, 0.2)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '4px',
                                    color: 'var(--admin-gold-primary)',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => audioPlayer.playMarker(marker)}
                                  title="Test play audio"
                                >
                                  ▶ Test
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--admin-danger)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    padding: '0 4px',
                                  }}
                                  onClick={() => handleDeleteMusicMarker(mId)}
                                  title="Delete note"
                                >
                                  🗑
                                </button>
                              </div>
                            </div>

                            {/* Configuration Fields */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
                              <div>
                                <label style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle)', display: 'block', marginBottom: '2px' }}>
                                  Audio Track
                                </label>
                                <select
                                  className={styles.formInput}
                                  style={{ padding: '4px 6px', fontSize: '0.78rem' }}
                                  value={marker.trackId}
                                  onChange={(e) => {
                                    const trkId = e.target.value;
                                    const selectedTrk = audioTracks.find((t) => t.id === trkId);
                                    handleUpdateMusicMarker(mId, {
                                      trackId: trkId,
                                      title: selectedTrk?.name || marker.title,
                                    });
                                  }}
                                >
                                  <option value="sample_our_evening">Our Evening ♡ (Default Theme)</option>
                                  {audioTracks
                                    .filter((t) => t.id !== 'sample_our_evening')
                                    .map((trk) => (
                                      <option key={trk.id} value={trk.id}>
                                        {trk.name} ({trk.type?.replace('audio/', '') || 'audio'})
                                      </option>
                                    ))}
                                </select>
                              </div>

                              <div>
                                <label style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle)', display: 'block', marginBottom: '2px' }}>
                                  Display Title
                                </label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  style={{ padding: '4px 6px', fontSize: '0.78rem' }}
                                  value={marker.title || ''}
                                  onChange={(e) => handleUpdateMusicMarker(mId, { title: e.target.value })}
                                  placeholder="e.g. Our Evening ♡"
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--admin-text-subtle)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={marker.loop !== false}
                                  onChange={(e) => handleUpdateMusicMarker(mId, { loop: e.target.checked })}
                                />
                                <span>Loop Audio</span>
                              </label>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--admin-text-subtle)' }}>
                                <span>Start:</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  style={{ width: '45px', padding: '2px 4px', fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', borderRadius: '3px', color: 'var(--admin-text-main)' }}
                                  value={marker.startTime || 0}
                                  onChange={(e) => handleUpdateMusicMarker(mId, { startTime: Number(e.target.value) })}
                                />
                                <span>s</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--admin-text-subtle)' }}>
                                <span>End:</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  style={{ width: '45px', padding: '2px 4px', fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', borderRadius: '3px', color: 'var(--admin-text-main)' }}
                                  value={marker.endTime || ''}
                                  onChange={(e) => handleUpdateMusicMarker(mId, { endTime: e.target.value ? Number(e.target.value) : undefined })}
                                  placeholder="Full"
                                />
                                <span>s</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Individual Paragraphs List (Add / Remove / Reorder) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-gold-primary)' }}>
                    Paragraph Blocks ({activeRight.storyParagraphs.length})
                  </span>
                  <button
                    type="button"
                    style={{
                      background: 'rgba(229, 189, 117, 0.15)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '4px',
                      color: 'var(--admin-gold-primary)',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      updateRightPage((r) => ({
                        ...r,
                        storyParagraphs: [...r.storyParagraphs, ''],
                      }));
                    }}
                  >
                    + Add Paragraph
                  </button>
                </div>
                {activeRight.storyParagraphs.map((para, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle)', minWidth: '18px', paddingTop: '6px' }}>
                      P{idx + 1}
                    </span>
                    <input
                      type="text"
                      className={styles.formInput}
                      style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }}
                      value={para}
                      onChange={(e) => {
                        const next = [...activeRight.storyParagraphs];
                        next[idx] = e.target.value;
                        updateRightPage((r) => ({ ...r, storyParagraphs: next }));
                      }}
                    />
                    {activeRight.storyParagraphs.length > 1 && (
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--admin-danger)',
                          cursor: 'pointer',
                          padding: '6px',
                          fontSize: '0.9rem',
                        }}
                        title="Remove paragraph"
                        onClick={() => {
                          const next = activeRight.storyParagraphs.filter((_, i) => i !== idx);
                          updateRightPage((r) => ({ ...r, storyParagraphs: next }));
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Visual Page Capacity Gauge & Overflow Warning */}
              <div className={styles.capacityGauge}>
                <div className={styles.capacityHeader}>
                  <span className={styles.capacityLabel}>Page Fill Capacity</span>
                  <span
                    className={styles.capacityPct}
                    style={{
                      color: capacityPct > 100 ? 'var(--admin-danger)' : capacityPct > 80 ? 'var(--admin-gold-amber)' : 'var(--admin-success)',
                    }}
                  >
                    {capacityPct}% Filled
                  </span>
                </div>
                <div className={styles.capacityTrack}>
                  <div
                    className={styles.capacityFill}
                    style={{
                      width: `${Math.min(100, capacityPct)}%`,
                      background:
                        capacityPct > 100
                          ? 'linear-gradient(90deg, #e08b1c, #e05244)'
                          : capacityPct > 80
                          ? 'linear-gradient(90deg, #e5bd75, #e08b1c)'
                          : 'linear-gradient(90deg, #4ec874, #e5bd75)',
                    }}
                  />
                </div>
                <div className={styles.capacityStats}>
                  <span>Words: {wordsCount}</span>
                  <span>Paragraphs: {nonBlankParas.length}</span>
                  <span>Est. Lines: {estTotalLines}</span>
                  <span>Space: {totalTextHeightPx}px / {usableHeightPx}px</span>
                </div>
                {capacityPct <= 75 ? (
                  <div className={`${styles.capacityBadge} ${styles.capacityBadgeOptimal}`}>
                    <span>✓</span> Comfortable Page Fit — Beautiful breathing room & margins.
                  </div>
                ) : capacityPct <= 100 ? (
                  <div className={`${styles.capacityBadge} ${styles.capacityBadgeNearFull}`}>
                    <span>✦</span> Full Page Coverage — Fills page comfortably from top to bottom.
                  </div>
                ) : (
                  <div className={`${styles.capacityBadge} ${styles.capacityBadgeOverflow}`}>
                    <span>⚠️</span> Page Overflow Warning ({capacityPct}%): Text exceeds physical page boundaries and will be clipped at the bottom! Reduce font size, line spacing, or trim story length.
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Closing Signature</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={activeRight.signature || ''}
                  onChange={(e) => updateRightPage((r) => ({ ...r, signature: e.target.value }))}
                  placeholder="e.g. Always yours, Elena ♡"
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

