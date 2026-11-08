/**
 * BUTTERFLY — Benchmark & Stage Capture Runner
 * Directly executes:
 * 1. FlowerAssetCache preloading of all 16 watercolor assets
 * 2. High-precision performance benchmarking on 1920x1080 and 390x844
 * 3. Captures pixel-perfect PNGs for all 6 visual stages
 * 4. Captures responsive viewports for Stage 4
 * 5. Captures 28 sequential frames for GIF assembly
 * 6. Transmits all data to local reporting server
 */

import { FlowerAssetCache } from './flowerRegistry';
import { initializeTunnelParticles, projectTunnelParticles, DEFAULT_TUNNEL_CONFIG } from './tunnelMath';
import { FlowerTunnelRenderer } from './flowerRenderer';
import { createTunnelMasterTimeline } from './timeline';
import type { SequenceTimelineState } from './types';

const REPORT_SERVER = 'http://localhost:9010';

async function postData(endpoint: string, data: any) {
  await fetch(`${REPORT_SERVER}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof data === 'string' ? data : JSON.stringify(data),
  });
}

export async function runFullPipeline() {
  const statusEl = document.getElementById('status')!;
  statusEl.innerText = 'Preloading and decoding all 16 watercolor assets...';

  // Create test canvas with warm cream background
  const container = document.getElementById('canvas-container')!;
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const renderer = new FlowerTunnelRenderer(canvas);
  const assetCache = FlowerAssetCache.getInstance();
  const sprites = await assetCache.loadAll(512);

  statusEl.innerText = `Loaded ${sprites.length} flower sprites. Initializing particles...`;
  const particles = initializeTunnelParticles(DEFAULT_TUNNEL_CONFIG, sprites.length);

  const state: SequenceTimelineState = {
    progress: 0,
    giftBoxOpacity: 0,
    giftBoxScale: 0.7,
    giftBoxRotation: 0,
    giftBoxDisintegration: 0,
    flowerClusterProgress: 0,
    activeFlowerRatio: 0,
    tunnelFormation: 0,
    tunnelDepthExpansion: 0,
    swirlProgress: 0,
    coverageProgress: 0,
    holdProgress: 0,
    fallProgress: 0,
    cameraZ: 0,
    cameraRoll: 0,
    viewportFillProgress: 0,
    transitionProgress: 0,
    backgroundOpacity: 1.0,
    gardenOpacity: 0.0,
  };

  const tl = createTunnelMasterTimeline(state, {
    config: DEFAULT_TUNNEL_CONFIG,
    onUpdate: () => {},
  });
  tl.pause();

  function renderAt(w: number, h: number, progress: number): string {
    container.style.width = `${w}px`;
    container.style.height = `${h}px`;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    renderer.updateDimensions();

    tl.progress(progress);
    const elapsedSec = progress * tl.duration();
    const projected = projectTunnelParticles(
      particles,
      state,
      w,
      h,
      DEFAULT_TUNNEL_CONFIG,
      elapsedSec
    );

    renderer.render(projected, sprites, state.transitionProgress, elapsedSec);

    // If stage 1, composite the pink gift box on top
    if (state.giftBoxOpacity > 0.05) {
      const ctx = (renderer as any).ctx;
      const dpr = (renderer as any).dpr;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(w / 2, h / 2);
      ctx.scale(state.giftBoxScale, state.giftBoxScale);
      ctx.rotate((state.giftBoxRotation * Math.PI) / 180);
      ctx.globalAlpha = state.giftBoxOpacity;

      // Draw illustrated gift box
      const bw = 140;
      const bh = 140;
      // Shadow
      ctx.fillStyle = 'rgba(219, 39, 119, 0.15)';
      ctx.beginPath();
      ctx.ellipse(0, bh * 0.42, bw * 0.45, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Box body
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(-bw / 2, -bh * 0.15, bw, bh * 0.55);
      // Box lid
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(-bw * 0.54, -bh * 0.32, bw * 1.08, bh * 0.22);
      // Gold Ribbon vertical
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-12, -bh * 0.32, 24, bh * 0.72);
      // Gold Ribbon horizontal
      ctx.fillRect(-bw * 0.54, -bh * 0.24, bw * 1.08, 16);
      // Ribbon bow loops
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-24, -bh * 0.42, 26, 16, -0.4, 0, Math.PI * 2);
      ctx.ellipse(24, -bh * 0.42, 26, 16, 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Composite over warm cream background (#FAF6EE)
    const outCanvas = document.createElement('canvas');
    outCanvas.width = canvas.width;
    outCanvas.height = canvas.height;
    const outCtx = outCanvas.getContext('2d')!;
    outCtx.fillStyle = '#FAF6EE';
    outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    outCtx.drawImage(canvas, 0, 0);

    return outCanvas.toDataURL('image/png');
  }

  // --- 1. RUN DESKTOP BENCHMARK (1920x1080) ---
  statusEl.innerText = 'Running Desktop Performance Benchmark (1920x1080)...';
  container.style.width = '1920px';
  container.style.height = '1080px';
  canvas.style.width = '1920px';
  canvas.style.height = '1080px';
  renderer.updateDimensions();

  const desktopTimes: number[] = [];
  const BENCH_STEPS = 200;
  for (let i = 0; i < BENCH_STEPS; i++) {
    const prog = i / BENCH_STEPS;
    tl.progress(prog);
    const elapsedSec = prog * tl.duration();

    const t0 = performance.now();
    const projected = projectTunnelParticles(
      particles,
      state,
      1920,
      1080,
      DEFAULT_TUNNEL_CONFIG,
      elapsedSec
    );
    renderer.render(projected, sprites, state.transitionProgress, elapsedSec);
    const t1 = performance.now();
    desktopTimes.push(t1 - t0);
  }

  desktopTimes.sort((a, b) => a - b);
  const dMean = desktopTimes.reduce((a, b) => a + b, 0) / desktopTimes.length;
  const desktopMetrics = {
    viewport: '1920x1080 (Desktop)',
    sampleCount: desktopTimes.length,
    meanMs: Number(dMean.toFixed(2)),
    medianMs: Number(desktopTimes[Math.floor(desktopTimes.length * 0.5)].toFixed(2)),
    p95Ms: Number(desktopTimes[Math.floor(desktopTimes.length * 0.95)].toFixed(2)),
    p99Ms: Number(desktopTimes[Math.floor(desktopTimes.length * 0.99)].toFixed(2)),
    minMs: Number(desktopTimes[0].toFixed(2)),
    maxMs: Number(desktopTimes[desktopTimes.length - 1].toFixed(2)),
    effectiveFps: Number((1000 / dMean).toFixed(1)),
  };

  // --- 2. RUN MOBILE BENCHMARK (390x844) ---
  statusEl.innerText = 'Running Mobile Performance Benchmark (390x844)...';
  container.style.width = '390px';
  container.style.height = '844px';
  canvas.style.width = '390px';
  canvas.style.height = '844px';
  renderer.updateDimensions();

  const mobileTimes: number[] = [];
  for (let i = 0; i < BENCH_STEPS; i++) {
    const prog = i / BENCH_STEPS;
    tl.progress(prog);
    const elapsedSec = prog * tl.duration();

    const t0 = performance.now();
    const projected = projectTunnelParticles(
      particles,
      state,
      390,
      844,
      DEFAULT_TUNNEL_CONFIG,
      elapsedSec
    );
    renderer.render(projected, sprites, state.transitionProgress, elapsedSec);
    const t1 = performance.now();
    mobileTimes.push(t1 - t0);
  }

  mobileTimes.sort((a, b) => a - b);
  const mMean = mobileTimes.reduce((a, b) => a + b, 0) / mobileTimes.length;
  const mobileMetrics = {
    viewport: '390x844 (Mobile)',
    sampleCount: mobileTimes.length,
    meanMs: Number(mMean.toFixed(2)),
    medianMs: Number(mobileTimes[Math.floor(mobileTimes.length * 0.5)].toFixed(2)),
    p95Ms: Number(mobileTimes[Math.floor(mobileTimes.length * 0.95)].toFixed(2)),
    p99Ms: Number(mobileTimes[Math.floor(mobileTimes.length * 0.99)].toFixed(2)),
    minMs: Number(mobileTimes[0].toFixed(2)),
    maxMs: Number(mobileTimes[mobileTimes.length - 1].toFixed(2)),
    effectiveFps: Number((1000 / mMean).toFixed(1)),
  };

  await postData('/metrics', [desktopMetrics, mobileMetrics]);

  // --- 3. CAPTURE 6 VISUAL STAGES (1920x1080) ---
  const stages = [
    { name: 'stage_1_initial_appearance', progress: 0.10 },
    { name: 'stage_2_early_expansion', progress: 0.32 },
    { name: 'stage_3_tunnel_formation', progress: 0.58 },
    { name: 'stage_4_fully_developed_tunnel', progress: 0.72 },
    { name: 'stage_5_camera_entering', progress: 0.86 },
    { name: 'stage_6_fullscreen_transition', progress: 0.98 },
  ];

  for (const st of stages) {
    statusEl.innerText = `Capturing ${st.name}...`;
    const dataUrl = renderAt(1920, 1080, st.progress);
    await postData(`/screenshot?name=${st.name}`, dataUrl);
  }

  // --- 4. CAPTURE RESPONSIVE VIEWPORTS OF STAGE 4 ---
  const responsive = [
    { name: 'stage_4_tunnel_1920x1080', w: 1920, h: 1080 },
    { name: 'stage_4_tunnel_1366x768', w: 1366, h: 768 },
    { name: 'stage_4_tunnel_390x844', w: 390, h: 844 },
    { name: 'stage_4_tunnel_360x800', w: 360, h: 800 },
  ];

  for (const r of responsive) {
    statusEl.innerText = `Capturing responsive ${r.name}...`;
    const dataUrl = renderAt(r.w, r.h, 0.70);
    await postData(`/screenshot?name=${r.name}`, dataUrl);
  }

  // --- 5. CAPTURE SEQUENTIAL FRAMES FOR ANIMATED GIF (720x405) ---
  const GIF_FRAMES = 28;
  for (let f = 0; f < GIF_FRAMES; f++) {
    const prog = f / (GIF_FRAMES - 1);
    statusEl.innerText = `Capturing GIF frame ${f + 1}/${GIF_FRAMES}...`;
    const dataUrl = renderAt(720, 405, prog);
    const idx = String(f).padStart(2, '0');
    await postData(`/gif_frame?idx=${idx}`, dataUrl);
  }

  statusEl.innerText = 'All captures and benchmarks finished! Assembling GIF...';
  await postData('/done', {});
  statusEl.innerText = 'VERIFICATION COMPLETE!';
}

window.addEventListener('DOMContentLoaded', () => {
  runFullPipeline().catch((err) => {
    document.getElementById('status')!.innerText = 'FATAL ERROR: ' + err.message;
    console.error(err);
  });
});

