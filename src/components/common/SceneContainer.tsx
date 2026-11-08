/**
 * BUTTERFLY — SceneContainer Component
 * Reusable, isolated wrapper for full-viewport story scenes.
 * Establishes an independent CSS stacking context (isolation: isolate)
 * to prevent z-index bleeding across adjacent scenes.
 */

import { forwardRef, type HTMLAttributes, type ReactNode, type ElementType } from 'react';

export interface SceneContainerProps extends HTMLAttributes<HTMLElement> {
  sceneId: string;
  children?: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
}

export const SceneContainer = forwardRef<HTMLElement, SceneContainerProps>(
  ({ sceneId, children, className = '', as: Component = 'section', ...rest }, ref) => {
    const Tag = Component as ElementType;
    return (
      <Tag
        ref={ref}
        id={sceneId}
        data-scene={sceneId}
        className={`scene-container isolate-stack ${className}`.trim()}
        {...rest}
      >
        {children}
      </Tag>
    );
  }
);

SceneContainer.displayName = 'SceneContainer';
