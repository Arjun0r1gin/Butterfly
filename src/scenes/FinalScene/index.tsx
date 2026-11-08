import { useRef, memo } from 'react';
import { SceneContainer } from '../../components/common/SceneContainer';
import { SCENE_IDS } from '../../utils/constants';
import { useSceneTimeline } from '../../hooks/useSceneTimeline';
import styles from './FinalScene.module.css';

export interface FinalSceneProps {
  className?: string;
}

export const FinalScene = memo(function FinalScene({ className = '' }: FinalSceneProps) {
  const containerRef = useRef<HTMLElement>(null);

  // Hook ready for Phase 2 animation implementation; no animations defined in Phase 1
  useSceneTimeline({
    sceneId: SCENE_IDS.FINAL_SCENE,
    scopeRef: containerRef,
    onSetup: () => {
      // Scene animation timeline hook-in point (Phase 2)
    },
  });

  return (
    <SceneContainer
      ref={containerRef}
      sceneId={SCENE_IDS.FINAL_SCENE}
      className={`${styles.finalScene} ${className}`.trim()}
      aria-label="Final Scene"
    >
      <div className={styles.backgroundLayer} data-layer="background" />
      <div className={styles.contentLayer} data-layer="content" />
      <div className={styles.foregroundLayer} data-layer="foreground" />
    </SceneContainer>
  );
});

