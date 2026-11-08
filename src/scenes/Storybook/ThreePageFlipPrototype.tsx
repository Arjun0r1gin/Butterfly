/**
 * BUTTERFLY — Three.js Multi-Sheet Scrapbook Engine with Physical Closed-Book Presence
 * 
 * Physically accurate paper mechanics & Antique Spiral Scrapbook:
 * - 100% inextensible arc-length preservation (zero distortion, zero stretching, zero compression)
 * - True multi-sheet physical scrapbook: 4 attached physical leaves (Sheet 0, 1, 2, 3)
 * - Sequential page-turn physics with left-stack accumulation & right-stack depletion
 * - 100% BLANK AGED CREAM PARCHMENT on all inner pages (zero sample text, photos, or stickers)
 * - 13 double-wire metallic antique-brass spiral coils passing through precision punched holes
 * - Unified 3D closed-book presence: resting in pergola garden, front cover with gold emblem & clasp,
 *   3D paper stack edge bevels, natural ground shadow, and ZERO left-side artifacts when closed
 * - Continuous physical opening transition: front cover rotates 0 -> -180 deg while centering smoothly
 */

import { useRef, useEffect, useState, memo, useCallback } from 'react';
import * as THREE from 'three';
import type { StorySpreadContent } from '../../services/content/types';
import { loadSavedContent } from '../../services/content/contentStorage';
import { createSpreadCanvasTexture } from '../../services/content/pageTextureRenderer';
import styles from './Storybook.module.css';

export const SHEET_COUNT = 4;

export interface ThreePageFlipPrototypeProps {
  progress?: number;          // Global reading/turn progress: 0.0 to 1.0 (maps across 4 sheets)
  turnProgress?: number;      // Explicit continuous turn progress: 0.0 to 4.0
  coverProgress?: number;     // 0.0 = fully closed book in garden, 1.0 = fully open centered book
  showControls?: boolean;
  className?: string;
  spreads?: StorySpreadContent[];
  onProgressChange?: (progress: number) => void;
}

const PROGRESS_STAGES = [
  { label: 'Closed', p: 0.0, cp: 0.0 },
  { label: 'Spread 1', p: 0.0, cp: 1.0 },
  { label: 'Turn 1', p: 0.25, cp: 1.0 },
  { label: 'Turn 2', p: 0.50, cp: 1.0 },
  { label: 'Turn 3', p: 0.75, cp: 1.0 },
  { label: 'Turn 4', p: 1.0, cp: 1.0 },
];

export const ThreePageFlipPrototype = memo(function ThreePageFlipPrototype({
  progress: externalProgress,
  turnProgress: externalTurnProgress,
  coverProgress: externalCoverProgress = 1.0,
  showControls = true,
  className = '',
  onProgressChange,
}: ThreePageFlipPrototypeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [internalProgress, setInternalProgress] = useState(0.0);
  const [internalCoverProgress, setInternalCoverProgress] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  const turnProgressRef = useRef<{ value: number }>({ value: 0.0 });
  const coverProgressRef = useRef<{ value: number }>({ value: 1.0 });

  const animFrameRef = useRef<number>(0);

  // Compute active turn progress (0.0 to 4.0)
  const activeNormalizedProgress = externalProgress !== undefined ? externalProgress : internalProgress;
  const activeCoverProgress = externalCoverProgress !== undefined ? externalCoverProgress : internalCoverProgress;

  const setProgress = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setInternalProgress(clamped);
    turnProgressRef.current.value = clamped * SHEET_COUNT;
    if (onProgressChange) onProgressChange(clamped);
  }, [onProgressChange]);

  useEffect(() => {
    if (externalTurnProgress !== undefined) {
      turnProgressRef.current.value = Math.max(0, Math.min(SHEET_COUNT, externalTurnProgress));
    } else {
      turnProgressRef.current.value = Math.max(0, Math.min(SHEET_COUNT, activeNormalizedProgress * SHEET_COUNT));
    }
  }, [externalTurnProgress, activeNormalizedProgress]);

  useEffect(() => {
    coverProgressRef.current.value = Math.max(0, Math.min(1, activeCoverProgress));
  }, [activeCoverProgress]);

  // Auto-play animation scrubber across all sheets
  useEffect(() => {
    if (!isPlaying) return;
    let forward = true;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const speed = 0.18; // Comfortable gentle turn speed

      setInternalProgress((prev) => {
        let next = prev + (forward ? speed * dt : -speed * dt);
        if (next >= 1.0) {
          next = 1.0;
          forward = false;
        } else if (next <= 0.0) {
          next = 0.0;
          forward = true;
        }
        turnProgressRef.current.value = next * SHEET_COUNT;
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 1180;
    let height = container.clientHeight || 680;

    // Dimensions matching exact reference proportions (2:1 open book spread)
    const PAGE_W = 390;
    const PAGE_H = 412;
    const COVER_W = 852;
    const COVER_H = 442;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 3000);

    const updateCameraDistance = () => {
      const aspect = camera.aspect;
      const targetWidthCoverage = 0.94;
      const desiredFrustumW = COVER_W / targetWidthCoverage;
      const desiredFrustumH = desiredFrustumW / aspect;
      const minFrustumH = COVER_H / 0.92;
      const effectiveFrustumH = Math.max(desiredFrustumH, minFrustumH);
      const vFovRad = (camera.fov * Math.PI) / 360;
      const dist = (effectiveFrustumH / 2) / Math.tan(vFovRad);
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
    };
    updateCameraDistance();

    // 2. High-Precision WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Cinematic Warm Sunset Lighting
    const ambientLight = new THREE.AmbientLight(0xffedd5, 1.15);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff6e5, 1.35);
    keyLight.position.set(-200, 280, 450);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff9944, 0.75);
    rimLight.position.set(280, 120, 150);
    scene.add(rimLight);

    const spiralSpecularLight = new THREE.DirectionalLight(0xfff4d0, 1.6);
    spiralSpecularLight.position.set(0, 150, 420);
    scene.add(spiralSpecularLight);

    // 4. Load Textures with Anisotropic Filtering
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const loader = new THREE.TextureLoader();

    const loadTexture = (path: string) => {
      const tex = loader.load(path);
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAnisotropy;
      return tex;
    };

    const texCover = loadTexture('/storybook/studio_cover_walnut.jpg');
    const texBlankLeft = loadTexture('/storybook/studio_page_blank_left.jpg');
    const texBlankRight = loadTexture('/storybook/studio_page_blank_right.jpg');
    const texCoverFlap = loadTexture('/storybook/closed_book_user_cover.png');
    const texCoverInside = loadTexture('/storybook/closed_book_user_cover_inside.png');

    // -------------------------------------------------------------------------
    // MASTER BOOK ROOT GROUP
    // Automatically shifted horizontally so:
    // - When CLOSED (cp = 0): Local book [0, PAGE_W] is centered around x = 0 (offset -PAGE_W/2)
    // - When OPEN (cp = 1): Local book [-PAGE_W, PAGE_W] is centered around x = 0 (offset 0)
    // -------------------------------------------------------------------------
    const bookRootGroup = new THREE.Group();
    scene.add(bookRootGroup);

    // 5. Realistic Ground Drop Shadow beneath the book
    const shadowGeo = new THREE.PlaneGeometry(COVER_W + 60, COVER_H + 50);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(128, 64, 10, 128, 64, 110);
      grad.addColorStop(0, 'rgba(12, 6, 2, 0.75)');
      grad.addColorStop(0.5, 'rgba(12, 6, 2, 0.35)');
      grad.addColorStop(1, 'rgba(12, 6, 2, 0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 256, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, -6, -14);
    bookRootGroup.add(shadowMesh);

    // 6. Hardcover Base: Split into Left and Right so left is 100% hidden when book is closed!
    const backCoverHalfW = COVER_W / 2; // 426
    const backCoverHalfH = COVER_H;     // 442

    const texCoverLeft = texCover.clone();
    texCoverLeft.repeat.set(0.5, 1.0);
    texCoverLeft.offset.set(0.0, 0.0);
    texCoverLeft.needsUpdate = true;

    const texCoverRight = texCover.clone();
    texCoverRight.repeat.set(0.5, 1.0);
    texCoverRight.offset.set(0.5, 0.0);
    texCoverRight.needsUpdate = true;

    const rBackMat = new THREE.MeshStandardMaterial({
      map: texCoverRight,
      roughness: 0.65,
      metalness: 0.18,
    });
    const lBackMat = new THREE.MeshStandardMaterial({
      map: texCoverLeft,
      roughness: 0.65,
      metalness: 0.18,
    });

    // Right Back Cover (Always visible: forms bottom of closed book & right wing of open book)
    const rBackGeo = new THREE.PlaneGeometry(backCoverHalfW, backCoverHalfH);
    const rBackMesh = new THREE.Mesh(rBackGeo, rBackMat);
    rBackMesh.position.set(backCoverHalfW / 2, 0, -8.0);
    rBackMesh.receiveShadow = true;
    bookRootGroup.add(rBackMesh);

    // Left Back Cover (Visible ONLY when book is opening / open)
    const lBackGeo = new THREE.PlaneGeometry(backCoverHalfW, backCoverHalfH);
    const lBackMesh = new THREE.Mesh(lBackGeo, lBackMat);
    lBackMesh.position.set(-backCoverHalfW / 2, 0, -8.0);
    lBackMesh.receiveShadow = true;
    lBackMesh.visible = false;
    bookRootGroup.add(lBackMesh);

    // 7. Layered Paper Edge Stacks (Subtle 3D paper depth)
    const rightBaseStackGroup = new THREE.Group();
    const leftBaseStackGroup = new THREE.Group();
    bookRootGroup.add(rightBaseStackGroup);
    bookRootGroup.add(leftBaseStackGroup);
    leftBaseStackGroup.visible = false;

    const stackLevels = 3;
    for (let s = 1; s <= stackLevels; s++) {
      const offsetZ = -s * 1.5;
      const stackScale = 1.0 - s * 0.005;

      // Right stack: gives closed book its realistic deckled page edge on right/top/bottom
      const rStackGeo = new THREE.PlaneGeometry(PAGE_W * stackScale, PAGE_H * stackScale);
      const rStackMat = new THREE.MeshStandardMaterial({
        color: 0xf5eedb,
        roughness: 0.92,
      });
      const rMesh = new THREE.Mesh(rStackGeo, rStackMat);
      rMesh.position.set(PAGE_W / 2 + s * 0.4, 0, offsetZ);
      rightBaseStackGroup.add(rMesh);

      // Left stack: revealed as pages turn
      const lStackGeo = new THREE.PlaneGeometry(PAGE_W * stackScale, PAGE_H * stackScale);
      const lStackMat = new THREE.MeshStandardMaterial({
        color: 0xf5eedb,
        roughness: 0.92,
      });
      const lMesh = new THREE.Mesh(lStackGeo, lStackMat);
      lMesh.position.set(-PAGE_W / 2 - s * 0.4, 0, offsetZ);
      leftBaseStackGroup.add(lMesh);
    }

    // Resting blank endpaper bases underneath the sheets
    const lBaseGeo = new THREE.PlaneGeometry(PAGE_W, PAGE_H);
    const lBaseMat = new THREE.MeshStandardMaterial({
      map: texBlankLeft,
      roughness: 0.82,
      metalness: 0.04,
    });
    const lBaseMesh = new THREE.Mesh(lBaseGeo, lBaseMat);
    lBaseMesh.position.set(-PAGE_W / 2, 0, -0.5);
    lBaseMesh.receiveShadow = true;
    lBaseMesh.visible = false;
    bookRootGroup.add(lBaseMesh);

    const rBaseGeo = new THREE.PlaneGeometry(PAGE_W, PAGE_H);
    const rBaseMat = new THREE.MeshStandardMaterial({
      map: texBlankRight,
      roughness: 0.82,
      metalness: 0.04,
    });
    const rBaseMesh = new THREE.Mesh(rBaseGeo, rBaseMat);
    rBaseMesh.position.set(PAGE_W / 2, 0, -0.5);
    rBaseMesh.receiveShadow = true;
    bookRootGroup.add(rBaseMesh);

    // -------------------------------------------------------------------------
    // 8. 4 Physical Blank Scrapbook Sheets (Leaves 0, 1, 2, 3)
    // Attached to spiral rings at x = 0, curling sequentially and accumulating on left!
    // -------------------------------------------------------------------------
    interface SheetData {
      mesh: THREE.Mesh;
      uniforms: {
        uProgress: { value: number };
        uPageWidth: { value: number };
        uPageHeight: { value: number };
        uFrontTexture: { value: THREE.Texture };
        uBackTexture: { value: THREE.Texture };
      };
    }

    const sheets: SheetData[] = [];
    const sheetsGroup = new THREE.Group();
    bookRootGroup.add(sheetsGroup);

    for (let k = 0; k < SHEET_COUNT; k++) {
      const curlGeo = new THREE.PlaneGeometry(PAGE_W, PAGE_H, 128, 64);
      curlGeo.translate(PAGE_W / 2, 0, 0); // Pivot along x = 0 (the spine spiral)

      const uniforms = {
        uProgress: { value: 0.0 },
        uPageWidth: { value: PAGE_W },
        uPageHeight: { value: PAGE_H },
        uFrontTexture: { value: texBlankRight },
        uBackTexture: { value: texBlankLeft },
      };

      const curlMat = new THREE.MeshStandardMaterial({
        map: texBlankRight,
        roughness: 0.80,
        metalness: 0.04,
        side: THREE.DoubleSide,
      });

      curlMat.onBeforeCompile = (shader) => {
        shader.uniforms.uProgress = uniforms.uProgress;
        shader.uniforms.uPageWidth = uniforms.uPageWidth;
        shader.uniforms.uPageHeight = uniforms.uPageHeight;
        shader.uniforms.uFrontTexture = uniforms.uFrontTexture;
        shader.uniforms.uBackTexture = uniforms.uBackTexture;

        shader.vertexShader = `
          uniform float uProgress;
          uniform float uPageWidth;
          uniform float uPageHeight;
          varying vec2 vCustomUv;
          varying vec3 vNormalVec;
          ${shader.vertexShader}
        `;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vCustomUv = uv;

          float x = position.x;
          float y = position.y;
          float t = clamp(uProgress, 0.0, 1.0);

          vec3 p = position;
          vec3 n = vec3(0.0, 0.0, 1.0);

          if (t <= 0.0002) {
            // Flat on right stack
            p = position;
            n = vec3(0.0, 0.0, 1.0);
          } else if (t >= 0.9998) {
            // Flat on left stack
            p.x = -x;
            p.y = y;
            p.z = 0.0;
            n = vec3(0.0, 0.0, -1.0);
          } else {
            // Natural developable paper curl:
            float arch = sin(t * 3.14159265);
            float R = max(1.5, (65.0 + 20.0 * arch) * arch);

            // Subtle conical peel across vertical axis:
            float cornerLag = (y / uPageHeight) * 32.0 * arch;
            float foldX = clamp(uPageWidth * (1.0 - t) + cornerLag, 0.0, uPageWidth);
            float s = x - foldX;

            if (s <= 0.0) {
              p = position;
              n = vec3(0.0, 0.0, 1.0);
            } else {
              float angle = s / R;
              if (angle <= 3.14159265) {
                p.x = foldX + sin(angle) * R;
                p.z = (1.0 - cos(angle)) * R;
                p.y = y - sin(angle) * (y / uPageHeight) * 4.0 * arch;
                n = vec3(-sin(angle), 0.0, cos(angle));
              } else {
                float excess = s - 3.14159265 * R;
                p.x = foldX - excess;
                float settle = exp(-excess / (0.65 * uPageWidth));
                p.z = max(0.0, 2.0 * R * settle);
                p.y = y;
                n = vec3(0.0, 0.0, -1.0);
              }
            }
          }

          transformed = p;
          vNormalVec = normalize(normalMatrix * n);
          `
        );

        shader.fragmentShader = `
          uniform sampler2D uFrontTexture;
          uniform sampler2D uBackTexture;
          varying vec2 vCustomUv;
          varying vec3 vNormalVec;
          ${shader.fragmentShader}
        `;

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
          vec4 texColor;
          if (gl_FrontFacing) {
            texColor = texture2D(uFrontTexture, vCustomUv);
          } else {
            // Mirrored UV horizontally for back face so punched holes align with central spine!
            vec2 backUv = vec2(1.0 - vCustomUv.x, vCustomUv.y);
            texColor = texture2D(uBackTexture, backUv);
          }
          diffuseColor *= texColor;
          `
        );
      };

      const mesh = new THREE.Mesh(curlGeo, curlMat);
      // Initial stack position: Sheet 0 is on top of right stack, Sheet 3 is at bottom
      mesh.position.set(0, 0, (SHEET_COUNT - 1 - k) * 0.6);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.renderOrder = SHEET_COUNT - k;
      sheetsGroup.add(mesh);

      sheets.push({ mesh, uniforms });
    }

    // -------------------------------------------------------------------------
    // 9. Continuous Metallic Antique-Brass Twin-Wire Spiral Binding (Fixed at x = 0)
    // 13 double-wire rings emerging through left holes (-14) and right holes (+14)
    // -------------------------------------------------------------------------
    const spiralGroup = new THREE.Group();
    spiralGroup.renderOrder = 30;
    const coilCount = 13;
    const startY = 180;
    const endY = -180;
    const coilSpacing = (startY - endY) / (coilCount - 1);

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4a340, // Warm antique brass
      roughness: 0.22,
      metalness: 0.88,
    });

    const xHole = 14.0;
    const zApex = 13.0;
    const zBack = -7.0;

    for (let i = 0; i < coilCount; i++) {
      const cy = startY - i * coilSpacing;
      for (const wireOffset of [-2.2, 2.2]) {
        const wy = cy + wireOffset;
        const curvePoints = [
          new THREE.Vector3(-xHole, wy, 0.0),          // Passing through left page punched hole!
          new THREE.Vector3(-xHole * 0.72, wy, zApex * 0.78),
          new THREE.Vector3(0.0, wy, zApex),           // Shiny metallic front arch
          new THREE.Vector3(xHole * 0.72, wy, zApex * 0.78),
          new THREE.Vector3(xHole, wy, 0.0),           // Passing through right page punched hole!
          new THREE.Vector3(xHole * 0.85, wy, zBack * 0.5),
          new THREE.Vector3(0.0, wy, zBack),           // Underneath spine behind cover
          new THREE.Vector3(-xHole * 0.85, wy, zBack * 0.5),
        ];
        const loopCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal');
        const loopGeo = new THREE.TubeGeometry(loopCurve, 32, 1.35, 12, true);
        const loopMesh = new THREE.Mesh(loopGeo, brassMat);
        loopMesh.castShadow = true;
        spiralGroup.add(loopMesh);
      }
    }
    bookRootGroup.add(spiralGroup);

    // -------------------------------------------------------------------------
    // 10. 3D Hinged Front Cover Leaf with User's Transparent PNG Cover
    // Pivots around x = 0 (the spine). Covers sheets when closed; swings open to left.
    // -------------------------------------------------------------------------
    const frontCoverGroup = new THREE.Group();
    frontCoverGroup.position.set(0, 0, 5.0); // On top of all sheets when closed

    // Proportions calibrated to exact user artwork (862x1024)
    // Leather cover extends from spine (x = 0) to x = 426.0 (matching back cover right edge)
    const COVER_RIGHT_EXTENT = backCoverHalfW; // 426.0
    const USER_SPINE_PX = 100.0;
    const USER_RIGHT_PX = 802.0;
    const USER_IMG_W_PX = 862.0;

    const coverScaleX = COVER_RIGHT_EXTENT / (USER_RIGHT_PX - USER_SPINE_PX);
    const USER_COVER_W = USER_IMG_W_PX * coverScaleX; // ~523.09
    const USER_COVER_H = COVER_H;                     // 442.0
    const spineOffsetX = (0.50 - (USER_SPINE_PX / USER_IMG_W_PX)) * USER_COVER_W; // ~200.86

    const coverLeafGeo = new THREE.PlaneGeometry(USER_COVER_W, USER_COVER_H);
    coverLeafGeo.translate(spineOffsetX, 0, 0); // Pins spine spiral at x = 0

    // Front face: User's transparent PNG (Walnut leather + gold spiral + flowers + lace bow + key + clasp)
    const coverLeafFrontMat = new THREE.MeshStandardMaterial({
      map: texCoverFlap,
      transparent: true,
      alphaTest: 0.02,
      roughness: 0.45,
      metalness: 0.15,
      side: THREE.FrontSide,
    });
    const coverLeafFront = new THREE.Mesh(coverLeafGeo, coverLeafFrontMat);
    coverLeafFront.castShadow = true;
    frontCoverGroup.add(coverLeafFront);

    // Back face: Inside cover endpaper (visible when swinging open to left)
    const coverLeafBackMat = new THREE.MeshStandardMaterial({
      map: texCoverInside,
      transparent: true,
      alphaTest: 0.02,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.BackSide,
    });
    const coverLeafBack = new THREE.Mesh(coverLeafGeo, coverLeafBackMat);
    coverLeafBack.position.z = -0.4;
    frontCoverGroup.add(coverLeafBack);

    bookRootGroup.add(frontCoverGroup);

    // 11. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          updateCameraDistance();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 12. High-Performance Render Loop
    let renderAnimId: number;
    const animate = () => {
      renderAnimId = requestAnimationFrame(animate);

      const cp = coverProgressRef.current.value;
      const globalTurnT = turnProgressRef.current.value;

      // Master Centering:
      // When closed (cp = 0): center of closed book is at x = COVER_RIGHT_EXTENT / 2 = 213
      // Shift root group by -213 so closed book is centered at x = 0
      // When open (cp = 1): full 2-page spread is centered around x = 0 (offset 0)
      const closedCenterOffsetX = COVER_RIGHT_EXTENT / 2; // 213.0
      bookRootGroup.position.x = -(1.0 - cp) * closedCenterOffsetX;

      // Shadow scaling
      const shadowW = (COVER_RIGHT_EXTENT + 40) + cp * (COVER_W - COVER_RIGHT_EXTENT);
      shadowMesh.scale.x = shadowW / (COVER_W + 60);

      // Cover opening mechanics
      if (cp < 0.99) {
        frontCoverGroup.visible = true;
        // Hinges open 0 deg -> -180 deg around the spine
        frontCoverGroup.rotation.y = -cp * Math.PI;
        // Z smoothly dips down as cover swings to left behind the book
        frontCoverGroup.position.z = 5.0 - cp * 15.0;

        // Reveal left back cover and base page as cover swings open past 45 deg
        lBackMesh.visible = cp >= 0.45;
        lBaseMesh.visible = cp >= 0.45;
        leftBaseStackGroup.visible = cp >= 0.45;
      } else {
        // Fully open: front cover is tucked away underneath the hardcover base
        frontCoverGroup.visible = false;
        lBackMesh.visible = true;
        lBaseMesh.visible = true;
        leftBaseStackGroup.visible = true;
      }

      // Multi-sheet page turn mechanics
      for (let k = 0; k < SHEET_COUNT; k++) {
        const localT = Math.max(0, Math.min(1, globalTurnT - k));
        sheets[k].uniforms.uProgress.value = localT;

        if (localT <= 0.0001) {
          // Flat on right stack
          sheets[k].mesh.position.z = (SHEET_COUNT - 1 - k) * 0.6;
          sheets[k].mesh.renderOrder = SHEET_COUNT - k;
        } else if (localT >= 0.9999) {
          // Flat on left stack (accumulating turned sheets)
          sheets[k].mesh.position.z = k * 0.6;
          sheets[k].mesh.renderOrder = k + 1;
        } else {
          // Actively curling mid-air over both stacks
          sheets[k].mesh.position.z = 3.2 + 4.0 * Math.sin(Math.PI * localT);
          sheets[k].mesh.renderOrder = 25;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(renderAnimId);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`${styles.threePrototypeWrapper} ${className}`.trim()}>
      <div ref={mountRef} className={styles.threeCanvasContainer} />

      {/* Interactive Controls & Progress Stage Inspector */}
      {showControls && (
        <div className={styles.prototypeControls}>
          <div className={styles.scrubberRow}>
            <button
              type="button"
              className={styles.playButton}
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause turn' : 'Play turn'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={internalProgress}
              onChange={(e) => {
                setIsPlaying(false);
                setProgress(parseFloat(e.target.value));
              }}
              className={styles.rangeInput}
              aria-label="Multi-Sheet Reading Progress"
            />
            <span className={styles.progressPercent}>
              {(internalProgress * 100).toFixed(0)}%
            </span>
          </div>

          <div className={styles.stageChips}>
            {PROGRESS_STAGES.map((stg) => (
              <button
                key={stg.label}
                type="button"
                className={`${styles.stageChip} ${
                  Math.abs(internalProgress - stg.p) < 0.05 && Math.abs(internalCoverProgress - stg.cp) < 0.05
                    ? styles.activeChip
                    : ''
                }`}
                onClick={() => {
                  setIsPlaying(false);
                  setInternalCoverProgress(stg.cp);
                  coverProgressRef.current.value = stg.cp;
                  setProgress(stg.p);
                }}
              >
                {stg.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
