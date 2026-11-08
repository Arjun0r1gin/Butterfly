/**
 * BUTTERFLY — Final Page Proposal Editor Component
 * Edit Chapter IV heading, main question line, highlight text, quote,
 * and place interactive stickers and animated GIFs over the twilight rocket scene.
 */

import React, { useState } from 'react';
import type {
  ButterflyContent,
  FinalQuestionContent,
  StickerItem,
  MediaAsset,
} from '../../../services/content/types';
import { StickerCanvas } from '../Common/StickerCanvas';
import { MediaLibrary } from '../MediaLibrary/MediaLibrary';
import styles from '../../Admin.module.css';

export interface FinalPageEditorProps {
  content: ButterflyContent;
  onChange: (updater: (prev: ButterflyContent) => ButterflyContent) => void;
}

export const FinalPageEditor: React.FC<FinalPageEditorProps> = ({
  content,
  onChange,
}) => {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const fq = content.finalQuestion;

  const updateFinalQuestion = (
    updater: (prev: FinalQuestionContent) => FinalQuestionContent
  ) => {
    onChange((prev) => ({
      ...prev,
      finalQuestion: updater(prev.finalQuestion),
    }));
  };

  const handleUpdateStickers = (stickers: StickerItem[]) => {
    updateFinalQuestion((prev) => ({ ...prev, stickers }));
  };

  const handleSelectMediaForSticker = (asset: MediaAsset, url: string) => {
    setShowMediaPicker(false);
    const newSticker: StickerItem = {
      id: `fq_st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: asset.isGif ? 'gif' : 'image',
      label: asset.name,
      mediaId: asset.id,
      customUrl: url,
      x: 50,
      y: 40,
      width: 100,
      height: 100,
      rotationDeg: 0,
      zIndex: 10,
    };

    updateFinalQuestion((prev) => ({
      ...prev,
      stickers: [...prev.stickers, newSticker],
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.8rem', margin: '0 0 6px', color: 'var(--admin-text-main)' }}>
          Final Proposal Screen Editor
        </h2>
        <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.88rem' }}>
          Customize the final proposal typography, copy, and floating stickers/GIFs presented when the butterfly lands on the rocket tip.
        </p>
      </div>

      <div className={styles.editorWorkspace}>
        {/* Left Column: Visual Canvas */}
        <div className={styles.canvasColumn}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-gold-primary)' }}>
              Final Scene Visual Preview (Transparent Proposal Over Sunset Sky)
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

          <div
            className={styles.canvasBoardWrapper}
            style={{
              background: 'linear-gradient(180deg, #180905 0%, #2f140a 50%, #4a1f0a 100%)',
            }}
          >
            <StickerCanvas
              stickers={fq.stickers}
              onUpdateStickers={handleUpdateStickers}
              backgroundSrc=""
              width={560}
              height={440}
              className=""
            >
              {/* Visual Proposal Layout Simulation */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {/* Chapter Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '28px', height: '1px', background: 'rgba(229, 189, 117, 0.75)' }} />
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', letterSpacing: '3px', color: '#e5bd75', textTransform: 'uppercase', fontWeight: 600 }}>
                    {fq.chapterHeader}
                  </span>
                  <div style={{ width: '28px', height: '1px', background: 'rgba(229, 189, 117, 0.75)' }} />
                </div>

                {/* Question Title */}
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 600, lineHeight: 1.25, marginBottom: '12px' }}>
                  <div style={{ color: '#fff8ee', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                    {fq.questionTitleMain}
                  </div>
                  <div style={{ color: '#f7be58', textShadow: '0 2px 10px rgba(247,190,88,0.4)' }}>
                    {fq.questionTitleHighlight}
                  </div>
                </div>

                {/* Subtitle Quote */}
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: '#e4d3c1', margin: '0 0 24px', maxWidth: '420px', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                  {fq.questionSubtitle}
                </p>

                {/* Simulated Buttons */}
                <div style={{ display: 'flex', gap: '18px' }}>
                  <div style={{ padding: '8px 22px', borderRadius: '999px', background: 'linear-gradient(135deg, #fedc7c, #f6b33e, #e08b1c)', color: '#2b1504', fontFamily: "'Cinzel', serif", fontSize: '13px', fontWeight: 700, letterSpacing: '1px', boxShadow: '0 4px 14px rgba(246,179,62,0.4)' }}>
                    YES →
                  </div>
                  <div style={{ padding: '8px 22px', borderRadius: '999px', background: 'rgba(30, 12, 5, 0.3)', border: '1.5px solid rgba(230,185,110,0.55)', color: '#f7ede0', fontFamily: "'Cinzel', serif", fontSize: '13px', fontWeight: 600, letterSpacing: '1px' }}>
                    NO
                  </div>
                </div>
              </div>
            </StickerCanvas>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', textAlign: 'center' }}>
            Tip: Placed stickers will appear dynamically in the visitor experience around the proposal text!
          </span>
        </div>

        {/* Right Column: Form Inspector */}
        <div className={styles.inspectorColumn}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', margin: 0, color: 'var(--admin-gold-primary)' }}>
            Proposal Content Fields
          </h3>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Chapter Header</label>
            <input
              type="text"
              className={styles.formInput}
              value={fq.chapterHeader}
              onChange={(e) => updateFinalQuestion((prev) => ({ ...prev, chapterHeader: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Main Question (White Line)</label>
            <input
              type="text"
              className={styles.formInput}
              value={fq.questionTitleMain}
              onChange={(e) => updateFinalQuestion((prev) => ({ ...prev, questionTitleMain: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Highlight Text (Golden Line)</label>
            <input
              type="text"
              className={styles.formInput}
              value={fq.questionTitleHighlight}
              onChange={(e) => updateFinalQuestion((prev) => ({ ...prev, questionTitleHighlight: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Supporting Quote</label>
            <textarea
              className={styles.formTextarea}
              value={fq.questionSubtitle}
              onChange={(e) => updateFinalQuestion((prev) => ({ ...prev, questionSubtitle: e.target.value }))}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '16px', marginTop: '8px' }}>
            <span style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--admin-gold-primary)' }}>
              Placed Stickers on Final Screen ({fq.stickers.length})
            </span>
            <p style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', margin: '4px 0 12px' }}>
              Add celebration stickers, hearts, animated sparkle GIFs, or love badges to accompany the proposal.
            </p>
            <button
              type="button"
              className={styles.btnSecondary}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setShowMediaPicker(true)}
            >
              + Browse Media Library
            </button>
          </div>
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
