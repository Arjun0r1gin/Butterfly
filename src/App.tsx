/**
 * BUTTERFLY — Main Application Scaffolding
 * Fixed full-screen cinematic viewport:
 * 1. Flower Tunnel Opening (gift box -> floral swirl -> waterfall cascade)
 * 2. Sunset Garden full-screen reveal with vertical camera parallax
 * 3. Butterfly emergence & flight through the meadow
 * 4. Storybook introduction on the right
 * 5. Scroll-controlled interactive 3D page turns
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { VignetteOverlay } from './components/common/VignetteOverlay';
import { CinematicSequence } from './scenes/CinematicSequence';
import { ThreePageFlipPrototype } from './scenes/Storybook/ThreePageFlipPrototype';
import { assetUrl } from './utils/assets';

// Admin panel is strictly for local editing only. Excluded from production builds.
const AdminApp = import.meta.env.DEV
  ? lazy(() => import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })))
  : null;

export function App() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isPrototype = searchParams?.get('prototype') === 'three';
  const isDev = import.meta.env.DEV;
  const isAdmin =
    isDev &&
    (currentPath.replace(/\/$/, '').endsWith('/admin') ||
     currentPath.includes('/admin') ||
     searchParams?.get('admin') === '1');

  if (isAdmin && AdminApp) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }

  if (isPrototype) {
    return (
      <main className="experience-canvas" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={assetUrl('/garden/garden_base_master.png')}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.92)' }}
        />
        <ThreePageFlipPrototype />
      </main>
    );
  }

  return (
    <main className="experience-canvas">
      {/* Ambient warm sunset lighting overlay */}
      <VignetteOverlay />

      {/* Fixed Full-Screen Cinematic Sequence */}
      <CinematicSequence />
    </main>
  );
}

export default App;
