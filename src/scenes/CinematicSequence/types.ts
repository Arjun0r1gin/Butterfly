/**
 * BUTTERFLY — Cinematic Sequence Types & Configuration
 */

export interface CinematicSequenceProps {
  className?: string;
  onSpreadChange?: (spreadIndex: number) => void;
  onSequenceProgress?: (progress: number) => void;
}

export interface ButterflyWaypoint {
  x: number; // Percentage of viewport width (0 - 100)
  y: number; // Percentage of viewport height (0 - 100)
  tilt: number; // Degrees
  scale: number;
}

