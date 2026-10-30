'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  Terminal, Volume2, VolumeX, Skull, Play, RotateCcw, Lock, Unlock,
  Radar, Check, Sparkles, BookOpen, Settings, Shield, Film, ChevronRight,
  Radio, Compass, Award, Flame, Eye, HelpCircle
} from 'lucide-react';

import {
  GTA_INTRO_SLIDES,
  STORY_CHAPTERS,
  MANSION_SOLID_WALLS,
  LOW_CLEARANCE_CRAWL_ZONES,
  MANSION_HIDING_ENCLOSURES,
  INITIAL_BEAR_TRAPS,
  CREAKY_FLOOR_PATCHES,
  EXIT_DOOR_POS,
  MINIMAP_ROOM_LABELS
} from '@/lib/game/config';
import { buildRealisticGrannyMesh } from '@/lib/game/granny';
import { horrorAudio } from '@/lib/game/audio';
import { createChapterHorrorTextures } from '@/lib/game/textures';

export default function App() {
  // Game State ('INTRO' | 'MAIN_MENU' | 'CHAPTER_INTRO' | 'PLAYING' | 'SQL_DECODER' | 'CHAPTER_CLEAR' | 'DAY_TRANSITION' | 'GAMEOVER' | 'VICTORY_CAMPAIGN')
  const [gameStatus, setGameStatus] = useState('INTRO');
  const [menuTab, setMenuTab] = useState('HOME'); // 'HOME' | 'CHAPTERS' | 'HOW_TO_PLAY' | 'SETTINGS'

  // GTA Intro Sequence State
  const [introSlideIndex, setIntroSlideIndex] = useState(0);
  const [introProgress, setIntroProgress] = useState(0);
  const [introSoundActive, setIntroSoundActive] = useState(false);

  // Story Campaign & Level Progression State
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [unlockedLevelIdx, setUnlockedLevelIdx] = useState(0);
  const [day, setDay] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // 2-Step Clue Discovery -> SQL Decryption -> Escape Tool Collection States
  const [discoveredClues, setDiscoveredClues] = useState([]);
  const [decryptedClues, setDecryptedClues] = useState([]);
  const [collectedTools, setCollectedTools] = useState([]);

  // 3-Stance State ('STAND' = 1.70m, 'CROUCH' = 1.00m, 'CRAWL' = 0.38m)
  const [stance, setStance] = useState('STAND');

  // Settings
  const [config, setConfig] = useState({
    lightingMode: 'horror',
    grannyDifficulty: 'stalker',
    audioEnabled: true,
    mouseSensitivity: 1.0
  });

  // Live HUD Telemetry
  const [hudState, setHudState] = useState({
    grannyMode: 'PATROLLING',
    grannyDist: 32,
    noiseLevel: 0,
    isHidden: false,
    hiddenType: null,
    hiddenName: '',
    inCrawlZone: false,
    crawlZoneName: '',
    isTrapped: false,
    trapEscapeProgress: 0,
    safeWardSeconds: 0,
    contextPrompt: null,
    toastMessage: null,
    fps: 60
  });

  // SQL Decryption Modal State
  const [activeClueForSql, setActiveClueForSql] = useState(null);
  const [sqlInput, setSqlInput] = useState('');
  const [sqlFeedback, setSqlFeedback] = useState(null);
  const [showSqlHint, setShowSqlHint] = useState(false);

  const [showMinimap, setShowMinimap] = useState(true);
  const [minimapMode, setMinimapMode] = useState('HEADING_UP'); // 'HEADING_UP' | 'NORTH_UP'
  const [headingText, setHeadingText] = useState('000° N');
  const [gameOverSummary, setGameOverSummary] = useState({ escaped: false, reason: '' });

  const currentChapter = STORY_CHAPTERS[currentLevelIdx] || STORY_CHAPTERS[0];

  // Refs for 60FPS Three.js Engine
  const mountRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const minimapModeRef = useRef('HEADING_UP');
  const engineRef = useRef({
    status: 'INTRO',
    levelIdx: 0,
    day: 1,
    score: 0,
    safeWardTime: 0,
    discoveredClueIds: new Set(),
    decryptedClueIds: new Set(),
    collectedToolIds: new Set(),
    bearTraps: JSON.parse(JSON.stringify(INITIAL_BEAR_TRAPS)),
    player: {
      x: -15,
      y: 1.7,
      z: -11,
      currentEyeY: 1.7,
      stance: 'STAND',
      yaw: 0,
      pitch: 0,
      radius: 0.55,
      isHidden: false,
      hiddenSpot: null,
      inCrawlZone: false,
      crawlZoneName: '',
      isTrapped: false,
      trapEscapeClicks: 0,
      noise: 0,
      bobPhase: 0
    },
    granny: {
      x: 15,
      z: 15,
      yaw: 0,
      state: 'PATROLLING',
      targetX: 0,
      targetZ: -6,
      alertTimer: 0,
      frozenTimer: 0,
      limbSwing: 0,
      waypoints: [
        { x: 0, z: -8 },
        { x: 15, z: -12 },
        { x: 15, z: 14 },
        { x: 0, z: 14 },
        { x: -15, z: 12 },
        { x: -14, z: -8 }
      ],
      wpIndex: 0
    },
    keys: { w: false, a: false, s: false, d: false, shift: false, left: false, right: false },
    creakCooldown: 0,
    jumpscareActive: false,
    jumpscareProgress: 0,
    menuOrbitAngle: 0
  });

  useEffect(() => {
    try {
      const savedBest = localStorage.getItem('granny3d_story_highscore');
      if (savedBest) setHighScore(parseInt(savedBest, 10) || 0);
      const savedUnlocked = localStorage.getItem('granny3d_unlocked_chapter');
      if (savedUnlocked) setUnlockedLevelIdx(Math.min(3, parseInt(savedUnlocked, 10) || 0));
    } catch (e) {}
  }, []);

  const updateHighScore = useCallback((newScore) => {
    setHighScore((prev) => {
      const best = Math.max(prev, newScore);
      try {
        localStorage.setItem('granny3d_story_highscore', String(best));
      } catch (e) {}
      return best;
    });
  }, []);

  const showToast = useCallback((msg) => {
    setHudState((prev) => ({ ...prev, toastMessage: msg }));
    setTimeout(() => {
      setHudState((prev) => (prev.toastMessage === msg ? { ...prev, toastMessage: null } : prev));
    }, 3600);
  }, []);

  /**
   * ============================================================================
   * GTA CINEMATIC INTRO TIMELINE CONTROLLER
   * ============================================================================
   */
  useEffect(() => {
    if (gameStatus !== 'INTRO') {
      horrorAudio.stopGtaIntroTheme();
      return;
    }

    const timer = setInterval(() => {
      setIntroProgress((prev) => {
        const next = prev + 1.15;
        if (next >= 100) {
          clearInterval(timer);
          horrorAudio.stopGtaIntroTheme();
          engineRef.current.status = 'MAIN_MENU';
          setGameStatus('MAIN_MENU');
          return 100;
        }
        const nextSlide = Math.min(
          GTA_INTRO_SLIDES.length - 1,
          Math.floor((next / 100) * GTA_INTRO_SLIDES.length)
        );
        setIntroSlideIndex((cur) => {
          if (cur !== nextSlide) {
            horrorAudio.playPanelSnapSting();
          }
          return nextSlide;
        });
        return next;
      });
    }, 160);

    return () => clearInterval(timer);
  }, [gameStatus]);

  const skipGtaIntro = useCallback(() => {
    horrorAudio.stopGtaIntroTheme();
    engineRef.current.status = 'MAIN_MENU';
    setGameStatus('MAIN_MENU');
  }, []);

  /**
   * ============================================================================
   * 3-STANCE COLLISION & RAYCASTING SYSTEM
   * ============================================================================
   */
  const checkCircleAABB = (cx, cz, r, box) => {
    const halfW = box.w / 2;
    const halfD = box.d / 2;
    const closestX = Math.max(box.x - halfW, Math.min(cx, box.x + halfW));
    const closestZ = Math.max(box.z - halfD, Math.min(cz, box.z + halfD));
    const dx = cx - closestX;
    const dz = cz - closestZ;
    return dx * dx + dz * dz < r * r;
  };

  const getActiveCrawlZone = (cx, cz, r = 0.45) => {
    for (const czBox of LOW_CLEARANCE_CRAWL_ZONES) {
      if (checkCircleAABB(cx, cz, r, czBox)) {
        return czBox;
      }
    }
    return null;
  };

  const canEntityOccupy = (cx, cz, r, isPlayer, playerStance) => {
    for (const w of MANSION_SOLID_WALLS) {
      if (checkCircleAABB(cx, cz, r, w)) return false;
    }
    for (const vent of LOW_CLEARANCE_CRAWL_ZONES) {
      if (vent.isWallVent && checkCircleAABB(cx, cz, r, vent)) {
        if (!isPlayer || playerStance !== 'CRAWL') return false;
      }
    }
    return true;
  };

  const moveWithStanceCollision = (entity, vx, vz, dt, r, isPlayer, playerStance) => {
    const nextX = entity.x + vx * dt;
    if (canEntityOccupy(nextX, entity.z, r, isPlayer, playerStance)) entity.x = nextX;
    const nextZ = entity.z + vz * dt;
    if (canEntityOccupy(entity.x, nextZ, r, isPlayer, playerStance)) entity.z = nextZ;
  };

  const has3DLineOfSight = (x1, z1, x2, z2) => {
    const dist = Math.hypot(x2 - x1, z2 - z1);
    if (dist > 22) return false;
    const steps = Math.ceil(dist / 0.45);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t;
      const pz = z1 + (z2 - z1) * t;
      for (const w of MANSION_SOLID_WALLS) {
        if (
          px >= w.x - w.w / 2 &&
          px <= w.x + w.w / 2 &&
          pz >= w.z - w.d / 2 &&
          pz <= w.z + w.d / 2
        ) {
          return false;
        }
      }
    }
    return true;
  };

  const changePlayerStance = useCallback(
    (targetStance) => {
      const p = engineRef.current.player;
      const inLowZone = getActiveCrawlZone(p.x, p.z, 0.4);
      if (inLowZone && targetStance !== 'CRAWL') {
        showToast(`⚠️ Low Ceiling Clearance (${inLowZone.name})! Crawl out before standing!`);
        return;
      }
      p.stance = targetStance;
      setStance(targetStance);
    },
    [showToast]
  );

  /**
   * ============================================================================
   * THREE.JS 3D WORLD & MULTI-CHAPTER ENVIRONMENT ENGINE
   * ============================================================================
   */
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const chapterCfg = STORY_CHAPTERS[currentLevelIdx] || STORY_CHAPTERS[0];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(chapterCfg.fogColor);
    scene.fog = new THREE.FogExp2(chapterCfg.fogColor, chapterCfg.fogDensity);

    const camera = new THREE.PerspectiveCamera(
      72,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.08,
      75
    );
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Chapter-specific PBR Bump-Mapped Floor & Wall Materials
    const { floorTex, wallTex } = createChapterHorrorTextures(
      chapterCfg.floorTint,
      chapterCfg.wallTint
    );
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: floorTex,
      bumpScale: 0.05,
      roughness: currentLevelIdx === 1 ? 0.35 : 0.82, // Wet reflective floor in Chapter II Boiler Cellar!
      metalness: currentLevelIdx === 1 ? 0.25 : 0.08
    });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x090707, roughness: 0.95 });
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      bumpMap: wallTex,
      bumpScale: 0.06,
      roughness: 0.8,
      metalness: 0.1
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x120907, roughness: 0.7 });

    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // In Chapter IV (Courtyard Finale), replace indoor ceiling with a giant glowing Blood Moon Sky!
    if (!chapterCfg.skyMoon) {
      const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), ceilingMat);
      ceilingMesh.rotation.x = Math.PI / 2;
      ceilingMesh.position.y = 4.4;
      scene.add(ceilingMesh);
    } else {
      const bloodMoon = new THREE.Mesh(
        new THREE.SphereGeometry(4.5, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      bloodMoon.position.set(0, 22, -28);
      scene.add(bloodMoon);

      const moonGlow = new THREE.PointLight(0xdc2626, 4.5, 65);
      moonGlow.position.set(0, 18, -20);
      scene.add(moonGlow);
    }

    // 1. Solid Mansion / Crypt / Courtyard Walls
    MANSION_SOLID_WALLS.forEach((b) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, 4.4, b.d), wallMat);
      mesh.position.set(b.x, 2.2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 0.06, 0.24, b.d + 0.06),
        trimMat
      );
      trim.position.set(b.x, 0.12, b.z);
      scene.add(trim);
    });

    // 2. Flickering Atmospheric Wall Sconces
    const sconceLights = [];
    [
      [-14, -14],
      [14, -14],
      [-14, 14],
      [14, 14],
      [0, -14],
      [0, 14]
    ].forEach(([sx, sz]) => {
      const sLight = new THREE.PointLight(chapterCfg.sconceColor, 0.85, 9.5);
      sLight.position.set(sx, 3.1, sz);
      scene.add(sLight);
      sconceLights.push(sLight);
    });

    // 3. Low-Clearance Crawlspace Wall Vents (0.65m Clearance)
    const ventFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      metalness: 0.75,
      roughness: 0.35
    });
    LOW_CLEARANCE_CRAWL_ZONES.filter((z) => z.isWallVent).forEach((v) => {
      const upperLintel = new THREE.Mesh(new THREE.BoxGeometry(1.05, 3.65, v.d), wallMat);
      upperLintel.position.set(v.x, 2.57, v.z);
      scene.add(upperLintel);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, v.d), ventFrameMat);
      frame.position.set(v.x, 0.72, v.z);
      scene.add(frame);

      const ventLight = new THREE.PointLight(0x06b6d4, 1.2, 4.5);
      ventLight.position.set(v.x, 0.45, v.z);
      scene.add(ventLight);
    });

    // 4. Creaky Floorboard Patches
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x3b1d0e, roughness: 0.9 });
    CREAKY_FLOOR_PATCHES.forEach((p) => {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.04, p.d), plankMat);
      plank.position.set(p.x, 0.02, p.z);
      scene.add(plank);
    });

    // 5. Hiding Enclosures (Beds, Wardrobes, Tables, Coffins)
    const mattressMat = new THREE.MeshStandardMaterial({ color: 0x5c1919, roughness: 0.85 });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      metalness: 0.7,
      roughness: 0.4
    });
    const oakMat = new THREE.MeshStandardMaterial({ color: 0x2e190e, roughness: 0.75 });

    MANSION_HIDING_ENCLOSURES.forEach((spot) => {
      const g = new THREE.Group();
      g.position.set(spot.x, 0, spot.z);

      if (spot.type === 'BED') {
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.32, 1.9), mattressMat);
        mattress.position.y = 0.72;
        mattress.castShadow = true;
        g.add(mattress);

        const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.55, 1.95), ironMat);
        headboard.position.set(-1.32, 0.77, 0);
        g.add(headboard);

        [
          [-1.3, -0.85],
          [1.3, -0.85],
          [-1.3, 0.85],
          [1.3, 0.85]
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95), ironMat);
          leg.position.set(lx, 0.47, lz);
          g.add(leg);
        });
      } else if (spot.type === 'WARDROBE') {
        const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.1, 1.45), oakMat);
        cabinet.position.y = 1.55;
        cabinet.castShadow = true;
        g.add(cabinet);
      } else if (spot.type === 'TABLE') {
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 1.8), oakMat);
        top.position.y = 0.78;
        g.add(top);
        [
          [-1.15, -0.75],
          [1.15, -0.75],
          [-1.15, 0.75],
          [1.15, 0.75]
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.78, 0.14), oakMat);
          leg.position.set(lx, 0.39, lz);
          g.add(leg);
        });
      } else {
        const coffin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 1.25), oakMat);
        coffin.position.y = 0.47;
        g.add(coffin);
      }

      const hideBeacon = new THREE.PointLight(0x38bdf8, 0.65, 5);
      hideBeacon.position.set(0, 1.9, 0);
      g.add(hideBeacon);
      scene.add(g);
    });

    // 6. Floating Volumetric Dust Motes Particle System
    const dustCount = 220;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 42;
      dustPositions[i * 3 + 1] = Math.random() * 4.0;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 42;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfef3c7,
      size: 0.065,
      transparent: true,
      opacity: 0.45
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // 7. Build Chapter-Specific Encrypted Clues (Step 1) & Unlocked Escape Tools (Step 2)
    const clueMeshes = {};
    const toolMeshes = {};
    const clueMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      roughness: 0.3,
      metalness: 0.4
    });
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x261710, roughness: 0.85 });
    const unlockedToolMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x065f46,
      metalness: 0.75,
      roughness: 0.2
    });

    chapterCfg.clues.forEach((clue) => {
      const ped = new THREE.Mesh(new THREE.BoxGeometry(1.2, clue.cluePos.y, 1.0), pedestalMat);
      ped.position.set(clue.cluePos.x, clue.cluePos.y / 2, clue.cluePos.z);
      scene.add(ped);

      const clueGroup = new THREE.Group();
      clueGroup.position.set(clue.cluePos.x, clue.cluePos.y + 0.25, clue.cluePos.z);
      const docMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.36), clueMat);
      clueGroup.add(docMesh);

      const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.025, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      glowRing.rotation.x = Math.PI / 2;
      clueGroup.add(glowRing);

      const clueLight = new THREE.PointLight(0xf59e0b, 1.8, 6.5);
      clueLight.position.set(0, 0.5, 0);
      clueGroup.add(clueLight);

      scene.add(clueGroup);
      clueMeshes[clue.id] = clueGroup;

      // Secret Escape Tool (Spawned after SQL query solved)
      const tg = new THREE.Group();
      tg.position.set(clue.toolPos.x, clue.toolPos.y, clue.toolPos.z);
      const tMesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.22, 0.06, 48, 12),
        unlockedToolMat
      );
      tg.add(tMesh);

      const tLight = new THREE.PointLight(0x10b981, 2.2, 6.0);
      tLight.position.set(0, 0.4, 0);
      tg.add(tLight);
      tg.visible = false;
      scene.add(tg);
      toolMeshes[clue.id] = tg;
    });

    // 8. Chapter Exit Gate / Hatch / Elevator
    const exitGroup = new THREE.Group();
    exitGroup.position.set(EXIT_DOOR_POS.x, 0, EXIT_DOOR_POS.z);
    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 3.6, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x3f1111, roughness: 0.6, metalness: 0.3 })
    );
    doorMesh.position.y = 1.8;
    exitGroup.add(doorMesh);

    const exitBeaconLight = new THREE.PointLight(0xdc2626, 2.8, 11);
    exitBeaconLight.position.set(0, 3.2, -1.2);
    exitGroup.add(exitBeaconLight);
    scene.add(exitGroup);

    // 9. Bear Traps
    const trapMeshes = {};
    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      metalness: 0.75,
      roughness: 0.5
    });
    INITIAL_BEAR_TRAPS.forEach((t) => {
      const tg = new THREE.Group();
      tg.position.set(t.x, 0.06, t.z);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.07, 8, 18), rustMat);
      ring.rotation.x = Math.PI / 2;
      tg.add(ring);
      scene.add(tg);
      trapMeshes[t.id] = tg;
    });

    // 10. Anatomical 3D Granny
    const grannyRig = buildRealisticGrannyMesh();
    scene.add(grannyRig.grannyRoot);

    // 11. Volumetric Player Flashlight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.09);
    scene.add(ambientLight);

    const flashlight = new THREE.SpotLight(0xfffbeb, 5.6, 29, Math.PI / 4.0, 0.46, 1.3);
    flashlight.castShadow = true;
    scene.add(flashlight);
    scene.add(flashlight.target);

    const playerAuraLight = new THREE.PointLight(0xfef3c7, 0.5, 6.0);
    scene.add(playerAuraLight);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Mouse Look
    let isPointerDragging = false;
    const onMouseMove = (e) => {
      if (engineRef.current.status !== 'PLAYING' || engineRef.current.jumpscareActive) return;
      if (document.pointerLockElement === renderer.domElement || isPointerDragging) {
        const sens = 0.0023 * config.mouseSensitivity;
        engineRef.current.player.yaw -= e.movementX * sens;
        engineRef.current.player.pitch = Math.max(
          -Math.PI / 2.3,
          Math.min(Math.PI / 2.3, engineRef.current.player.pitch - e.movementY * sens)
        );
      }
    };
    const onMouseDown = () => {
      isPointerDragging = true;
    };
    const onMouseUp = () => {
      isPointerDragging = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    let animationFrameId;
    let lastTime = performance.now();
    let frameCounter = 0;
    let fpsTimer = performance.now();

    const animate = (nowMs) => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (nowMs - lastTime) / 1000);
      lastTime = nowMs;
      frameCounter++;

      const eng = engineRef.current;

      // Flicker Sconces & Drift Dust Motes
      sconceLights.forEach((sl, i) => {
        sl.intensity = 0.72 + Math.sin(nowMs * 0.012 + i * 2.1) * 0.22;
      });
      dustPoints.rotation.y += dt * 0.03;

      // Animate Clue Objects & Unlocked Tools
      chapterCfg.clues.forEach((clue) => {
        const cMesh = clueMeshes[clue.id];
        if (cMesh) {
          cMesh.visible = !eng.discoveredClueIds.has(clue.id);
          cMesh.rotation.y += dt * 1.8;
        }
        const tMesh = toolMeshes[clue.id];
        if (tMesh) {
          tMesh.visible =
            eng.decryptedClueIds.has(clue.id) && !eng.collectedToolIds.has(clue.id);
          tMesh.rotation.y += dt * 2.6;
        }
      });

      eng.bearTraps.forEach((t) => {
        if (trapMeshes[t.id]) trapMeshes[t.id].visible = t.armed;
      });

      const allToolsReady = eng.collectedToolIds.size >= 4;
      exitBeaconLight.color.setHex(allToolsReady ? 0x10b981 : 0xdc2626);
      doorMesh.material.color.setHex(allToolsReady ? 0x065f46 : 0x3f1111);


      if (config.lightingMode === 'fullbright') {
        ambientLight.intensity = 1.4;
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.density = 0.015;
        }
      } else if (config.lightingMode === 'lantern') {
        ambientLight.intensity = 0.38;
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.density = 0.045;
        }
      } else {
        ambientLight.intensity = 0.14;
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.density = 0.078;
        }
      }
      // Orbiting 3D Background Camera during MAIN_MENU or CHAPTER_INTRO
      if (eng.status === 'MAIN_MENU' || eng.status === 'CHAPTER_INTRO' || eng.status === 'INTRO') {
        eng.menuOrbitAngle += dt * 0.18;
        const camX = Math.cos(eng.menuOrbitAngle) * 14.5;
        const camZ = Math.sin(eng.menuOrbitAngle) * 14.5;
        camera.position.set(camX, 3.1, camZ);
        camera.lookAt(0, 1.4, 0);

        flashlight.position.copy(camera.position);
        flashlight.target.position.set(0, 1.2, 0);

        // Stalking Granny in Main Menu background
        grannyRig.grannyRoot.position.set(
          Math.cos(eng.menuOrbitAngle + 2.4) * 7.5,
          0,
          Math.sin(eng.menuOrbitAngle + 2.4) * 7.5
        );
        grannyRig.grannyRoot.rotation.y = -eng.menuOrbitAngle;
        grannyRig.headPivot.rotation.z = Math.sin(nowMs * 0.008) * 0.15;
        renderer.render(scene, camera);
        return;
      }

      if (eng.status === 'PLAYING') {
        const p = eng.player;
        const g = eng.granny;

        if (eng.safeWardTime > 0) eng.safeWardTime = Math.max(0, eng.safeWardTime - dt);
        if (eng.creakCooldown > 0) eng.creakCooldown = Math.max(0, eng.creakCooldown - dt);

        if (eng.jumpscareActive) {
          eng.jumpscareProgress += dt * 3.4;
          camera.position.set(
            g.x + Math.sin(g.yaw) * 1.15,
            2.02 + (Math.random() - 0.5) * 0.14,
            g.z + Math.cos(g.yaw) * 1.15
          );
          camera.lookAt(g.x, 2.08, g.z);
          grannyRig.jawPivot.rotation.x = 0.55 + Math.sin(eng.jumpscareProgress * 20) * 0.25;
          grannyRig.rightArmPivot.rotation.x = -Math.sin(eng.jumpscareProgress * 14) * 1.9;
          renderer.render(scene, camera);
          return;
        }

        if (eng.keys.left) p.yaw += 2.1 * dt;
        if (eng.keys.right) p.yaw -= 2.1 * dt;

        let isMoving = false;
        const isSprinting = eng.keys.shift && p.stance === 'STAND';
        const effectiveStance = isSprinting ? 'SPRINT' : p.stance;

        if (!p.isHidden && !p.isTrapped) {
          let forward = 0;
          let strafe = 0;
          if (eng.keys.w) forward += 1;
          if (eng.keys.s) forward -= 1;
          if (eng.keys.a) strafe -= 1;
          if (eng.keys.d) strafe += 1;

          if (forward !== 0 || strafe !== 0) {
            isMoving = true;
            const len = Math.hypot(forward, strafe);
            forward /= len;
            strafe /= len;

            const speed =
              p.stance === 'CRAWL'
                ? 2.1
                : p.stance === 'CROUCH'
                ? 2.9
                : isSprinting
                ? 7.25
                : 4.7;

            const sinY = Math.sin(p.yaw);
            const cosY = Math.cos(p.yaw);
            const vx = (-sinY * forward + cosY * strafe) * speed;
            const vz = (-cosY * forward - sinY * strafe) * speed;

            moveWithStanceCollision(p, vx, vz, dt, p.radius, true, p.stance);
            p.bobPhase += dt * (p.stance === 'CRAWL' ? 7 : isSprinting ? 14 : 9);

            p.noise =
              p.stance === 'CRAWL' ? 0 : p.stance === 'CROUCH' ? 10 : isSprinting ? 90 : 34;

            if (isSprinting && Math.hypot(p.x - g.x, p.z - g.z) < 22 && g.state !== 'FROZEN') {
              g.state = 'INVESTIGATING';
              g.targetX = p.x;
              g.targetZ = p.z;
              g.alertTimer = 5.0;
            }
          } else {
            p.noise = Math.max(0, p.noise - dt * 55);
          }
        } else {
          p.noise = 0;
        }

        const activeCrawlZone = getActiveCrawlZone(p.x, p.z, 0.42);
        p.inCrawlZone = Boolean(activeCrawlZone);
        p.crawlZoneName = activeCrawlZone ? activeCrawlZone.name : '';

        const targetEyeY = p.isHidden
          ? p.hiddenSpot?.type === 'BED' || p.hiddenSpot?.type === 'TABLE'
            ? 0.34
            : 1.5
          : p.stance === 'CRAWL'
          ? 0.38
          : p.stance === 'CROUCH'
          ? 1.0
          : 1.7;

        p.currentEyeY += (targetEyeY - p.currentEyeY) * Math.min(1, dt * 12);
        const bobOffset = isMoving
          ? Math.sin(p.bobPhase) * (p.stance === 'CRAWL' ? 0.035 : 0.065)
          : 0;
        const crawlRoll =
          isMoving && p.stance === 'CRAWL' ? Math.cos(p.bobPhase) * 0.03 : 0;

        camera.position.set(p.x, p.currentEyeY + bobOffset, p.z);
        camera.rotation.set(p.pitch, p.yaw, crawlRoll, 'YXZ');

        flashlight.position.copy(camera.position);
        const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
        flashlight.target.position.copy(camera.position).add(dir.multiplyScalar(10));
        playerAuraLight.position.copy(camera.position);

        if (!p.isHidden && isMoving && p.stance !== 'CRAWL' && eng.creakCooldown <= 0) {
          for (const cp of CREAKY_FLOOR_PATCHES) {
            if (checkCircleAABB(p.x, p.z, p.radius, cp)) {
              eng.creakCooldown = 4.0;
              p.noise = 100;
              horrorAudio.playCreak();
              if (g.state !== 'FROZEN') {
                g.state = 'INVESTIGATING';
                g.targetX = p.x;
                g.targetZ = p.z;
                g.alertTimer = 6.5;
              }
              showToast('🔊 CREAK! Granny heard that! (Press [Z] to Crawl silently)');
              break;
            }
          }
        }

        if (!p.isHidden && !p.isTrapped) {
          for (const trap of eng.bearTraps) {
            if (trap.armed && Math.hypot(p.x - trap.x, p.z - trap.z) < 0.85) {
              trap.armed = false;
              if (eng.safeWardTime > 0) {
                eng.score += 75;
                setScore(eng.score);
                showToast('🛡️ SQL Safe Ward shattered a Bear Trap (+75 PTS)!');
              } else {
                p.isTrapped = true;
                p.trapEscapeClicks = 0;
                p.noise = 100;
                horrorAudio.playSqlAlarm();
                if (g.state !== 'FROZEN') {
                  g.state = 'CHASING';
                  g.targetX = p.x;
                  g.targetZ = p.z;
                  g.alertTimer = 6.0;
                }
                showToast('🩸 BEAR TRAP! Mash [SPACE] or press [Q] to decrypt a Clue!');
              }
              break;
            }
          }
        }

        const distToGranny = Math.hypot(p.x - g.x, p.z - g.z);
        horrorAudio.updateSpatialAudio(
          nowMs,
          distToGranny,
          g.state === 'CHASING',
          isMoving,
          effectiveStance
        );

        const isStealthHidden =
          p.isHidden ||
          (p.stance === 'CRAWL' && p.inCrawlZone) ||
          eng.safeWardTime > 0;

        if (g.frozenTimer > 0) {
          g.frozenTimer = Math.max(0, g.frozenTimer - dt);
          g.state = 'FROZEN';
          grannyRig.terrorLight.color.setHex(0x38bdf8);
        } else {
          if (g.state === 'FROZEN') g.state = 'PATROLLING';
          grannyRig.terrorLight.color.setHex(0xdc2626);

          const canSeePlayer =
            !isStealthHidden &&
            config.grannyDifficulty !== 'blind_listener' &&
            has3DLineOfSight(g.x, g.z, p.x, p.z);

          if (canSeePlayer) {
            g.state = 'CHASING';
            g.targetX = p.x;
            g.targetZ = p.z;
            g.alertTimer = 4.5;
          } else if (g.state === 'CHASING') {
            g.alertTimer -= dt;
            if (isStealthHidden || g.alertTimer <= 0) {
              g.state = 'PATROLLING';
            } else {
              g.targetX = p.x;
              g.targetZ = p.z;
            }
          } else if (g.state === 'INVESTIGATING') {
            g.alertTimer -= dt;
            if (Math.hypot(g.targetX - g.x, g.targetZ - g.z) < 1.3 || g.alertTimer <= 0) {
              g.state = 'PATROLLING';
            }
          }

          if (g.state === 'PATROLLING') {
            const wp = g.waypoints[g.wpIndex];
            g.targetX = wp.x;
            g.targetZ = wp.z;
            if (Math.hypot(wp.x - g.x, wp.z - g.z) < 1.4) {
              g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
            }
          }

          const dx = g.targetX - g.x;
          const dz = g.targetZ - g.z;
          const d = Math.hypot(dx, dz);
          if (d > 0.15) {
            g.yaw = Math.atan2(dx, dz);
            let gSpeed =
              (g.state === 'CHASING' ? 4.25 : 2.55) * chapterCfg.grannySpeedMultiplier;
            gSpeed *= 1 + (eng.day - 1) * 0.06;
            if (config.grannyDifficulty === 'nightmare') gSpeed *= 1.2;

            moveWithStanceCollision(
              g,
              (dx / d) * gSpeed,
              (dz / d) * gSpeed,
              dt,
              0.72,
              false,
              'STAND'
            );
            g.limbSwing += dt * (g.state === 'CHASING' ? 12 : 6.5);
          }
        }

        const limpDip = Math.abs(Math.sin(g.limbSwing * 0.5)) * 0.09;
        grannyRig.grannyRoot.position.set(g.x, -limpDip, g.z);
        grannyRig.grannyRoot.rotation.y = g.yaw;
        grannyRig.headPivot.rotation.z = Math.sin(nowMs * 0.008) * 0.12;
        grannyRig.jawPivot.rotation.x =
          g.state === 'CHASING' ? 0.48 + Math.sin(nowMs * 0.02) * 0.15 : 0.08;
        grannyRig.rightArmPivot.rotation.x =
          g.state === 'CHASING'
            ? -0.65 + Math.sin(g.limbSwing) * 0.85
            : Math.sin(g.limbSwing) * 0.45;
        grannyRig.leftArmPivot.rotation.x = -Math.sin(g.limbSwing) * 0.4;

        if (!isStealthHidden && distToGranny < 1.28) {
          triggerGrannyJumpscareCapture();
        }

        // Context Prompt Detection
        let promptText = null;
        if (p.isHidden) {
          promptText = `🛏️ Hidden inside ${p.hiddenSpot.name} — Press [E] to Step Out`;
        } else {
          for (const clue of chapterCfg.clues) {
            if (
              !eng.discoveredClueIds.has(clue.id) &&
              Math.hypot(p.x - clue.cluePos.x, p.z - clue.cluePos.z) < 2.5
            ) {
              promptText = `📜 Press [E] to Examine Clue: ${clue.clueName}`;
              break;
            }
          }
          if (!promptText) {
            for (const clue of chapterCfg.clues) {
              if (
                eng.decryptedClueIds.has(clue.id) &&
                !eng.collectedToolIds.has(clue.id) &&
                Math.hypot(p.x - clue.toolPos.x, p.z - clue.toolPos.z) < 2.6
              ) {
                promptText = `🗝️ Press [E] to Retrieve Tool: ${clue.unlockedToolName}`;
                break;
              }
            }
          }
          if (!promptText) {
            for (const spot of MANSION_HIDING_ENCLOSURES) {
              if (Math.hypot(p.x - spot.x, p.z - spot.z) < 2.5) {
                promptText = `🛏️ Press [E] to Hide in ${spot.name} (or [Z] to Crawl under)`;
                break;
              }
            }
          }
          if (!promptText && Math.hypot(p.x - EXIT_DOOR_POS.x, p.z - EXIT_DOOR_POS.z) < 3.1) {
            promptText =
              eng.collectedToolIds.size >= 4
                ? `🚪 ALL 4 TOOLS READY! Press [E] to Breach ${chapterCfg.exitName}!`
                : `🔒 ${chapterCfg.exitName} Locked (${eng.collectedToolIds.size}/4 Tools — Find Clues & Solve SQL)`;
          }
        }

        // Render smooth 60FPS GTA Rotating Radar Minimap on every frame
        drawRadarMinimap(chapterCfg);

        if (nowMs - fpsTimer > 140) {
          const currentFps = Math.min(60, Math.round((frameCounter * 1000) / (nowMs - fpsTimer)));
          frameCounter = 0;
          fpsTimer = nowMs;

          // Compute compass heading in degrees (0° = North/-Z, 90° = East/+X, 180° = South/+Z, 270° = West/-X)
          const rawDeg = ((-p.yaw * 180) / Math.PI) % 360;
          const normDeg = Math.round((rawDeg + 360) % 360);
          const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
          const cardIdx = Math.round(normDeg / 45) % 8;
          setHeadingText(`${String(normDeg).padStart(3, '0')}° ${cardinals[cardIdx]}`);

          setHudState((prev) => ({
            ...prev,
            grannyMode: g.state,
            grannyDist: Math.round(distToGranny),
            noiseLevel: Math.round(p.noise),
            isHidden: p.isHidden,
            hiddenType: p.hiddenSpot?.type || null,
            hiddenName: p.hiddenSpot?.name || '',
            inCrawlZone: p.inCrawlZone,
            crawlZoneName: p.crawlZoneName,
            isTrapped: p.isTrapped,
            trapEscapeProgress: p.trapEscapeClicks * 25,
            safeWardSeconds: Number(eng.safeWardTime.toFixed(1)),
            contextPrompt: promptText,
            fps: currentFps
          }));
        }
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [currentLevelIdx, config.lightingMode, config.grannyDifficulty, config.mouseSensitivity, showToast]);

  const drawRadarMinimap = (chapterCfg) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const outerRadius = Math.min(cx, cy) - 3;
    const innerRadius = outerRadius - 14;
    const eng = engineRef.current;
    const p = eng.player;
    const g = eng.granny;
    const isHeadingUp = minimapModeRef.current === 'HEADING_UP';

    // Map rotation angle:
    // In Three.js, yaw=0 faces -Z (Up on canvas), yaw=+PI/2 faces -X (Left on canvas).
    // Rotating the world around the player by +p.yaw aligns the player's forward look vector with -Y (Up on canvas).
    const mapRot = isHeadingUp ? p.yaw : 0;
    const scale = isHeadingUp ? 3.55 : (innerRadius * 2) / 46;

    ctx.clearRect(0, 0, w, h);

    // 1. Tactical Radar Base Disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#050807';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = g.state === 'CHASING' ? '#ef4444' : '#334155';
    ctx.stroke();
    ctx.restore();

    // 2. Clipped Interior Radar Viewport
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.clip();

    // Subtle Radar Range Rings
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.lineWidth = 1;
    [innerRadius * 0.38, innerRadius * 0.72].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshair axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.beginPath();
    ctx.moveTo(cx - innerRadius, cy);
    ctx.lineTo(cx + innerRadius, cy);
    ctx.moveTo(cx, cy - innerRadius);
    ctx.lineTo(cx, cy + innerRadius);
    ctx.stroke();

    // Transform into World Space (Centered on Player in HEADING_UP, or Mansion Center in NORTH_UP)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mapRot);
    if (isHeadingUp) {
      ctx.scale(scale, scale);
      ctx.translate(-p.x, -p.z);
    } else {
      ctx.scale(scale, scale);
    }

    // Mansion Floor Boundary
    ctx.fillStyle = '#090d0c';
    ctx.fillRect(-22, -22, 44, 44);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.4;
    ctx.strokeRect(-22, -22, 44, 44);

    // Creaky Floor Zones
    ctx.fillStyle = 'rgba(180, 83, 9, 0.28)';
    CREAKY_FLOOR_PATCHES.forEach((cp) => {
      ctx.fillRect(cp.x - cp.w / 2, cp.z - cp.d / 2, cp.w, cp.d);
    });

    // Hiding Spots (Beds, Wardrobes, Tables)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 0.25;
    MANSION_HIDING_ENCLOSURES.forEach((spot) => {
      ctx.fillRect(spot.x - 1.1, spot.z - 0.9, 2.2, 1.8);
      ctx.strokeRect(spot.x - 1.1, spot.z - 0.9, 2.2, 1.8);
    });

    // Solid Mansion Walls
    ctx.fillStyle = '#475569';
    MANSION_SOLID_WALLS.forEach((b) => {
      ctx.fillRect(b.x - b.w / 2, b.z - b.d / 2, b.w, b.d);
    });

    // Low-Clearance Crawlspace Wall Vents
    ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
    LOW_CLEARANCE_CRAWL_ZONES.filter((z) => z.isWallVent).forEach((v) => {
      ctx.fillRect(v.x - v.w / 2, v.z - v.d / 2, v.w, v.d);
    });

    // Counter-Rotated Upright Room Labels
    MINIMAP_ROOM_LABELS.forEach((rm) => {
      ctx.save();
      ctx.translate(rm.x, rm.z);
      ctx.rotate(-mapRot);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.48)';
      ctx.font = 'bold 2.1px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rm.name, 0, 0);
      ctx.restore();
    });

    // Exit Gate Marker
    const exitReady = eng.collectedToolIds.size >= 4;
    ctx.save();
    ctx.translate(EXIT_DOOR_POS.x, EXIT_DOOR_POS.z);
    ctx.fillStyle = exitReady ? '#10b981' : '#f43f5e';
    ctx.fillRect(-2.0, -0.7, 4.0, 1.4);
    ctx.rotate(-mapRot);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 2.2px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', 0, -1.4);
    ctx.restore();

    // Clues (Amber) & Unlocked Escape Tools (Emerald)
    chapterCfg.clues.forEach((c) => {
      if (!eng.discoveredClueIds.has(c.id)) {
        ctx.save();
        ctx.translate(c.cluePos.x, c.cluePos.z);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 0.28;
        ctx.stroke();
        ctx.rotate(-mapRot);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 1.8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(c.id + 1), 0, 0.1);
        ctx.restore();
      } else if (eng.decryptedClueIds.has(c.id) && !eng.collectedToolIds.has(c.id)) {
        ctx.save();
        ctx.translate(c.toolPos.x, c.toolPos.z);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(0, 0, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d1fae5';
        ctx.lineWidth = 0.3;
        ctx.stroke();
        ctx.rotate(-mapRot);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 1.8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('T', 0, 0.1);
        ctx.restore();
      }
    });

    // Granny Marker & Heading Direction Cone
    ctx.save();
    ctx.translate(g.x, g.z);
    ctx.save();
    // In world coordinates, Granny's forward vector is (sin(g.yaw), cos(g.yaw))
    ctx.rotate(Math.atan2(Math.sin(g.yaw), Math.cos(g.yaw)) - Math.PI / 2);
    ctx.fillStyle =
      g.state === 'FROZEN'
        ? 'rgba(56, 189, 248, 0.22)'
        : 'rgba(239, 68, 68, 0.28)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 5.2, 0.2, Math.PI - 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = g.state === 'FROZEN' ? '#38bdf8' : '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 1.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.3;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // Exit World Space

    // 3. Volumetric Flashlight FOV Cone & Player Directional Arrow
    const playerScreenX = isHeadingUp ? cx : cx + p.x * scale;
    const playerScreenY = isHeadingUp ? cy : cy + p.z * scale;
    const playerArrowRot = isHeadingUp ? 0 : -p.yaw;

    ctx.save();
    ctx.translate(playerScreenX, playerScreenY);
    ctx.rotate(playerArrowRot);

    // Forward Flashlight Cone (Always pointing straight UP in HEADING_UP mode)
    const fovGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 44);
    fovGrad.addColorStop(0, 'rgba(250, 204, 21, 0.42)');
    fovGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.16)');
    fovGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = fovGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 44, -Math.PI / 2 - 0.44, -Math.PI / 2 + 0.44);
    ctx.closePath();
    ctx.fill();

    // FOV Cone Edge Rays
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.48)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-Math.PI / 2 - 0.44) * 38, Math.sin(-Math.PI / 2 - 0.44) * 38);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-Math.PI / 2 + 0.44) * 38, Math.sin(-Math.PI / 2 + 0.44) * 38);
    ctx.stroke();

    // Crisp GTA Player Navigation Arrow / Chevron
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -7.5);
    ctx.lineTo(5.2, 5.5);
    ctx.lineTo(0, 2.6);
    ctx.lineTo(-5.2, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Perimeter Directional Indicator Chevron to Active Objective (if off-screen or far)
    let activeTarget = null;
    let targetColor = '#f59e0b';
    for (const c of chapterCfg.clues) {
      if (eng.decryptedClueIds.has(c.id) && !eng.collectedToolIds.has(c.id)) {
        activeTarget = { x: c.toolPos.x, z: c.toolPos.z };
        targetColor = '#10b981';
        break;
      }
    }
    if (!activeTarget) {
      for (const c of chapterCfg.clues) {
        if (!eng.discoveredClueIds.has(c.id)) {
          activeTarget = { x: c.cluePos.x, z: c.cluePos.z };
          targetColor = '#f59e0b';
          break;
        }
      }
    }
    if (!activeTarget && eng.collectedToolIds.size >= 4) {
      activeTarget = { x: EXIT_DOOR_POS.x, z: EXIT_DOOR_POS.z };
      targetColor = '#10b981';
    }

    if (activeTarget) {
      const dx = activeTarget.x - p.x;
      const dz = activeTarget.z - p.z;
      const screenDx = dx * Math.cos(mapRot) - dz * Math.sin(mapRot);
      const screenDy = dx * Math.sin(mapRot) + dz * Math.cos(mapRot);
      const screenDist = Math.hypot(screenDx, screenDy) * scale;

      if (screenDist > innerRadius - 8) {
        const angle = Math.atan2(screenDy, screenDx);
        const edgeR = innerRadius - 6;
        ctx.save();
        ctx.translate(cx + Math.cos(angle) * edgeR, cy + Math.sin(angle) * edgeR);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = targetColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(4.5, 4);
        ctx.lineTo(-4.5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore(); // End Clipped Interior Radar Viewport

    // 5. Rotating Outer Compass Bezel Ring (N, E, S, W + Degree Ticks)
    const bezelRadius = (outerRadius + innerRadius) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Minor 30-degree ticks around bezel
    for (let deg = 0; deg < 360; deg += 30) {
      if (deg % 90 === 0) continue;
      const rad = (deg * Math.PI) / 180 - Math.PI / 2 + mapRot;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * (innerRadius + 1.5), cy + Math.sin(rad) * (innerRadius + 1.5));
      ctx.lineTo(cx + Math.cos(rad) * (outerRadius - 1.5), cy + Math.sin(rad) * (outerRadius - 1.5));
      ctx.stroke();
    }

    // Upright Cardinal Letters (N, E, S, W) that orbit smoothly as the player turns
    const cardinalPoints = [
      { label: 'N', angle: -Math.PI / 2, color: '#ef4444' },
      { label: 'E', angle: 0, color: '#e2e8f0' },
      { label: 'S', angle: Math.PI / 2, color: '#94a3b8' },
      { label: 'W', angle: Math.PI, color: '#e2e8f0' }
    ];
    cardinalPoints.forEach((cp) => {
      const a = cp.angle + mapRot;
      const lx = cx + Math.cos(a) * bezelRadius;
      const ly = cy + Math.sin(a) * bezelRadius;

      ctx.fillStyle = '#050807';
      ctx.beginPath();
      ctx.arc(lx, ly, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cp.color;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cp.label, lx, ly + 0.5);
    });

    // Fixed Top Lubber Triangle (Marks Player's Current Forward Heading at 12 O'Clock)
    if (isHeadingUp) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius + 1);
      ctx.lineTo(cx - 4, cy - outerRadius - 4);
      ctx.lineTo(cx + 4, cy - outerRadius - 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  /**
   * ============================================================================
   * STORY CHAPTER LAUNCHERS, INTERACTIONS & SQL DECODER
   * ============================================================================
   */
  const launchStoryChapterBriefing = useCallback((lvlIdx) => {
    horrorAudio.init();
    horrorAudio.stopGtaIntroTheme();
    setCurrentLevelIdx(lvlIdx);
    engineRef.current.levelIdx = lvlIdx;
    engineRef.current.status = 'CHAPTER_INTRO';
    setGameStatus('CHAPTER_INTRO');
  }, []);

  const beginActiveChapterGameplay = useCallback(() => {
    horrorAudio.init();
    horrorAudio.stopGtaIntroTheme();

    const eng = engineRef.current;
    eng.status = 'PLAYING';
    eng.day = 1;
    eng.safeWardTime = 0;
    eng.discoveredClueIds = new Set();
    eng.decryptedClueIds = new Set();
    eng.collectedToolIds = new Set();
    eng.bearTraps = JSON.parse(JSON.stringify(INITIAL_BEAR_TRAPS));
    eng.jumpscareActive = false;

    eng.player.x = -15;
    eng.player.z = -11;
    eng.player.stance = 'STAND';
    eng.player.currentEyeY = 1.7;
    eng.player.yaw = 0;
    eng.player.pitch = 0;
    eng.player.isHidden = false;
    eng.player.hiddenSpot = null;
    eng.player.isTrapped = false;

    eng.granny.x = 15;
    eng.granny.z = 15;
    eng.granny.state = 'PATROLLING';
    eng.granny.frozenTimer = 0;

    setDay(1);
    setStance('STAND');
    setDiscoveredClues([]);
    setDecryptedClues([]);
    setCollectedTools([]);
    setGameStatus('PLAYING');
  }, []);

  const openSqlDecoderForClue = useCallback((clueObj) => {
    if (document.pointerLockElement) document.exitPointerLock();
    engineRef.current.status = 'SQL_DECODER';
    setGameStatus('SQL_DECODER');
    setActiveClueForSql(clueObj);
    setSqlInput('');
    setSqlFeedback(null);
    setShowSqlHint(false);
  }, []);

  const handleContextInteract = useCallback(() => {
    const eng = engineRef.current;
    if (eng.status !== 'PLAYING') return;
    const p = eng.player;
    const chapterCfg = STORY_CHAPTERS[currentLevelIdx] || STORY_CHAPTERS[0];

    if (p.isHidden) {
      p.isHidden = false;
      p.hiddenSpot = null;
      showToast('👣 Stepped out of hiding.');
      return;
    }

    for (const clue of chapterCfg.clues) {
      if (
        !eng.discoveredClueIds.has(clue.id) &&
        Math.hypot(p.x - clue.cluePos.x, p.z - clue.cluePos.z) < 2.6
      ) {
        eng.discoveredClueIds.add(clue.id);
        eng.score += 150;
        setScore(eng.score);
        updateHighScore(eng.score);
        setDiscoveredClues(Array.from(eng.discoveredClueIds));
        horrorAudio.playCluePickup();
        showToast(`📜 Found ${clue.clueName}! Opening SQL Mainframe Decoder...`);
        setTimeout(() => openSqlDecoderForClue(clue), 380);
        return;
      }
    }

    for (const clue of chapterCfg.clues) {
      if (
        eng.decryptedClueIds.has(clue.id) &&
        !eng.collectedToolIds.has(clue.id) &&
        Math.hypot(p.x - clue.toolPos.x, p.z - clue.toolPos.z) < 2.7
      ) {
        eng.collectedToolIds.add(clue.id);
        eng.score += 250;
        setScore(eng.score);
        updateHighScore(eng.score);
        setCollectedTools(Array.from(eng.collectedToolIds));
        horrorAudio.playSqlSuccess();
        showToast(
          `🗝️ Retrieved ${clue.unlockedToolName} (${eng.collectedToolIds.size}/4 Chapter Tools)!`
        );
        return;
      }
    }

    for (const spot of MANSION_HIDING_ENCLOSURES) {
      if (Math.hypot(p.x - spot.x, p.z - spot.z) < 2.5) {
        p.isHidden = true;
        p.hiddenSpot = spot;
        p.x = spot.x;
        p.z = spot.z;
        if (spot.type === 'BED' || spot.type === 'TABLE') {
          p.stance = 'CRAWL';
          setStance('CRAWL');
        }
        showToast(`🛏️ Hidden in ${spot.name}!`);
        return;
      }
    }

    if (Math.hypot(p.x - EXIT_DOOR_POS.x, p.z - EXIT_DOOR_POS.z) < 3.2) {
      if (eng.collectedToolIds.size >= 4) {
        if (document.pointerLockElement) document.exitPointerLock();
        const bonus = (5 - eng.day) * 400 + 1000;
        eng.score += bonus;
        setScore(eng.score);
        updateHighScore(eng.score);
        horrorAudio.playSqlSuccess();

        if (currentLevelIdx < STORY_CHAPTERS.length - 1) {
          const nextLvl = currentLevelIdx + 1;
          setUnlockedLevelIdx((prev) => {
            const bestLvl = Math.max(prev, nextLvl);
            try {
              localStorage.setItem('granny3d_unlocked_chapter', String(bestLvl));
            } catch (e) {}
            return bestLvl;
          });
          eng.status = 'CHAPTER_CLEAR';
          setGameStatus('CHAPTER_CLEAR');
        } else {
          eng.status = 'VICTORY_CAMPAIGN';
          setGameStatus('VICTORY_CAMPAIGN');
        }
      } else {
        horrorAudio.playSqlAlarm();
        showToast(
          `🔒 ${chapterCfg.exitName} Locked! You have ${eng.collectedToolIds.size}/4 Tools.`
        );
      }
    }
  }, [currentLevelIdx, openSqlDecoderForClue, showToast, updateHighScore]);

  const executeSqlDecryption = () => {
    if (!activeClueForSql) return;
    const normalized = sqlInput.toLowerCase().replace(/\s+/g, ' ').replace(/;$/, '').trim();
    const eng = engineRef.current;

    if (activeClueForSql.validator(normalized)) {
      horrorAudio.playSqlSuccess();
      eng.score += 300;
      setScore(eng.score);
      updateHighScore(eng.score);

      eng.decryptedClueIds.add(activeClueForSql.id);
      setDecryptedClues(Array.from(eng.decryptedClueIds));

      eng.player.isTrapped = false;
      eng.player.trapEscapeClicks = 0;

      eng.safeWardTime = 8.0;
      eng.granny.frozenTimer = 8.0;
      eng.granny.state = 'FROZEN';

      setSqlFeedback({
        type: 'success',
        text: `✅ SQL CIPHER CRACKED (+300 PTS)! ${activeClueForSql.decryptedSecretHint}`
      });
    } else {
      horrorAudio.playSqlAlarm();
      eng.score = Math.max(0, eng.score - 50);
      setScore(eng.score);
      eng.player.noise = 100;
      if (eng.granny.state !== 'FROZEN') {
        eng.granny.state = 'CHASING';
        eng.granny.targetX = eng.player.x;
        eng.granny.targetZ = eng.player.z;
        eng.granny.alertTimer = 6.0;
      }
      setSqlFeedback({
        type: 'error',
        text: '❌ SQL SYNTAX ERROR (-50 PTS)! Mainframe alarm alerted Granny!'
      });
    }
  };

  const triggerGrannyJumpscareCapture = () => {
    const eng = engineRef.current;
    if (eng.jumpscareActive) return;
    eng.jumpscareActive = true;
    eng.jumpscareProgress = 0;

    if (document.pointerLockElement) document.exitPointerLock();
    horrorAudio.playJumpscareScreech();

    setTimeout(() => {
      eng.jumpscareActive = false;
      if (eng.day < 5) {
        const nextDay = eng.day + 1;
        eng.day = nextDay;
        setDay(nextDay);
        eng.status = 'DAY_TRANSITION';
        setGameStatus('DAY_TRANSITION');

        setTimeout(() => {
          eng.player.x = -15;
          eng.player.z = -11;
          eng.player.stance = 'STAND';
          setStance('STAND');
          eng.player.isHidden = false;
          eng.player.hiddenSpot = null;
          eng.player.isTrapped = false;
          eng.granny.x = 15;
          eng.granny.z = 15;
          eng.granny.state = 'PATROLLING';
          eng.status = 'PLAYING';
          setGameStatus('PLAYING');
        }, 2300);
      } else {
        eng.status = 'GAMEOVER';
        setGameStatus('GAMEOVER');
        setGameOverSummary({
          escaped: false,
          reason: `Granny captured you on Day 5 during ${currentChapter.chapterNumber}: ${currentChapter.title}.`
        });
      }
    }, 980);
  };

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e) => {
      const eng = engineRef.current;

      if (eng.status === 'INTRO' && e.key === ' ') {
        e.preventDefault();
        skipGtaIntro();
        return;
      }

      if (eng.status === 'SQL_DECODER') {
        if (e.key === 'Escape') {
          eng.status = 'PLAYING';
          setGameStatus('PLAYING');
          setActiveClueForSql(null);
        }
        return;
      }

      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') eng.keys.w = true;
      if (k === 's' || e.key === 'ArrowDown') eng.keys.s = true;
      if (k === 'a') eng.keys.a = true;
      if (k === 'd') eng.keys.d = true;
      if (e.key === 'ArrowLeft') eng.keys.left = true;
      if (e.key === 'ArrowRight') eng.keys.right = true;
      if (e.key === 'Shift') eng.keys.shift = true;

      if (k === 'z' || k === 'x') {
        e.preventDefault();
        const next = eng.player.stance === 'CRAWL' ? 'STAND' : 'CRAWL';
        changePlayerStance(next);
      }
      if (k === 'c') {
        e.preventDefault();
        const next = eng.player.stance === 'CROUCH' ? 'STAND' : 'CROUCH';
        changePlayerStance(next);
      }

      if (k === 'e') {
        e.preventDefault();
        handleContextInteract();
      }

      if (e.key === ' ' && eng.player.isTrapped) {
        e.preventDefault();
        eng.player.trapEscapeClicks += 1;
        if (eng.player.trapEscapeClicks >= 4) {
          eng.player.isTrapped = false;
          eng.player.trapEscapeClicks = 0;
          showToast('🔓 Prized open the Bear Trap jaws!');
        }
      }

      if (k === 'q' && eng.status === 'PLAYING') {
        e.preventDefault();
        const chapterClues = (STORY_CHAPTERS[currentLevelIdx] || STORY_CHAPTERS[0]).clues;
        const uncracked = chapterClues.find(
          (c) => eng.discoveredClueIds.has(c.id) && !eng.decryptedClueIds.has(c.id)
        );
        const targetClue =
          uncracked ||
          chapterClues.find((c) => !eng.decryptedClueIds.has(c.id)) ||
          chapterClues[0];
        if (!eng.discoveredClueIds.has(targetClue.id)) {
          eng.discoveredClueIds.add(targetClue.id);
          setDiscoveredClues(Array.from(eng.discoveredClueIds));
        }
        openSqlDecoderForClue(targetClue);
      }
    };

    const onKeyUp = (e) => {
      const eng = engineRef.current;
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') eng.keys.w = false;
      if (k === 's' || e.key === 'ArrowDown') eng.keys.s = false;
      if (k === 'a') eng.keys.a = false;
      if (k === 'd') eng.keys.d = false;
      if (e.key === 'ArrowLeft') eng.keys.left = false;
      if (e.key === 'ArrowRight') eng.keys.right = false;
      if (e.key === 'Shift') eng.keys.shift = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    currentLevelIdx,
    changePlayerStance,
    handleContextInteract,
    openSqlDecoderForClue,
    skipGtaIntro,
    showToast
  ]);

  const activeIntroSlide = GTA_INTRO_SLIDES[introSlideIndex] || GTA_INTRO_SLIDES[0];

  return (
    <div className="relative w-full h-screen bg-black text-stone-100 overflow-hidden select-none font-sans flex flex-col">
      {/* ==================== MAIN 3D VIEWPORT CANVAS ==================== */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <div
          ref={mountRef}
          onClick={() => {
            if (mountRef.current?.firstChild && gameStatus === 'PLAYING') {
              try {
                mountRef.current.firstChild.requestPointerLock?.();
              } catch (e) {}
            }
          }}
          className="w-full h-full cursor-crosshair"
        />

        {/* ==================== STATE 0: GTA-INSPIRED SPLIT-PANEL COMIC & KEN BURNS CINEMATIC INTRO ==================== */}
        {gameStatus === 'INTRO' && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden">
            {/* Animated Ken Burns Background Split Panels */}
            <div className="relative flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden">
              {/* Left Comic Panel */}
              <div
                key={`left-${activeIntroSlide.id}`}
                className={`relative flex-1 bg-gradient-to-br ${activeIntroSlide.bgGrad} border-b-8 md:border-b-0 md:border-r-8 border-black p-6 sm:p-10 flex flex-col justify-between overflow-hidden transition-all duration-700`}
              >
                {/* Stylized GTA Halftone & Diagonal Ink Lines */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'radial-gradient(#ffffff 1px, transparent 1px), repeating-linear-gradient(45deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 10px, transparent 10px, transparent 20px)',
                    backgroundSize: '16px 16px, 100% 100%'
                  }}
                />

                {/* Top GTA Comic Tag Box */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span
                    className="inline-block px-3.5 py-1 bg-black text-white font-black text-xs sm:text-sm tracking-widest uppercase border-2 border-white shadow-[4px_4px_0px_#000]"
                    style={{ transform: 'skewX(-10deg)' }}
                  >
                    {activeIntroSlide.badge}
                  </span>

                  {!introSoundActive ? (
                    <button
                      onClick={() => {
                        setIntroSoundActive(true);
                        horrorAudio.startGtaIntroTheme();
                      }}
                      className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-black text-xs tracking-wider uppercase border-2 border-black shadow-[4px_4px_0px_#000] animate-bounce flex items-center gap-1.5"
                    >
                      <Volume2 className="w-4 h-4" /> ENABLE GTA SYNTH THEME
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded bg-emerald-950/90 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 animate-pulse" /> SYNTH AUDIO ACTIVE
                    </span>
                  )}
                </div>

                {/* Center Stylized Comic Graphic Emblem */}
                <div className="relative z-10 my-auto py-6 flex flex-col items-start space-y-3">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-amber-300 bg-black/80 px-3 py-1 border-l-4 border-red-500">
                    {activeIntroSlide.tag}
                  </div>
                  <h1
                    className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none drop-shadow-[5px_5px_0px_rgba(0,0,0,1)]"
                    style={{ transform: 'skewX(-6deg)' }}
                  >
                    {activeIntroSlide.title}
                  </h1>
                  <div
                    className="inline-block px-3 py-1 bg-red-600 text-white font-black text-xs sm:text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_#000]"
                    style={{ transform: 'skewX(-8deg)' }}
                  >
                    {activeIntroSlide.subtitle}
                  </div>
                  <p className="max-w-xl text-xs sm:text-base text-stone-200 bg-black/80 p-4 border-2 border-white/80 shadow-[6px_6px_0px_rgba(0,0,0,0.9)] leading-relaxed font-medium">
                    {activeIntroSlide.caption}
                  </p>
                </div>

                {/* Bottom Comic Sub-Panel */}
                <div className="relative z-10 grid grid-cols-2 gap-3 max-w-lg">
                  <div className="bg-black/90 border-2 border-white/70 p-2.5 shadow-[4px_4px_0px_#000]">
                    <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                      {activeIntroSlide.panelLeftTitle}
                    </div>
                    <div className="text-xs font-black text-white mt-0.5">
                      {activeIntroSlide.panelLeftDesc}
                    </div>
                  </div>
                  <div className="bg-black/90 border-2 border-white/70 p-2.5 shadow-[4px_4px_0px_#000]">
                    <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                      {activeIntroSlide.panelRightTitle}
                    </div>
                    <div className="text-xs font-black text-white mt-0.5">
                      {activeIntroSlide.panelRightDesc}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Diagonal GTA Character & Noir Vignette Panel */}
              <div className="w-full md:w-96 bg-neutral-950/90 p-6 flex flex-col justify-between border-l-4 border-black relative overflow-hidden">
                <div className="space-y-2 z-10">
                  <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                    SANCTUARY DOSSIER // SLIDE {introSlideIndex + 1} OF {GTA_INTRO_SLIDES.length}
                  </div>
                  <div className="flex gap-1.5">
                    {GTA_INTRO_SLIDES.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setIntroSlideIndex(idx);
                          setIntroProgress(idx * 25 + 5);
                          horrorAudio.playPanelSnapSting();
                        }}
                        className={`h-2 flex-1 transition-all ${
                          idx === introSlideIndex
                            ? 'bg-red-500 scale-y-125'
                            : idx < introSlideIndex
                            ? 'bg-amber-500/70'
                            : 'bg-stone-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Stylized High-Contrast Poster Card */}
                <div className="my-auto z-10 p-5 bg-gradient-to-b from-stone-900 to-black border-4 border-white shadow-[8px_8px_0px_#dc2626] space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2">
                    <span className="font-black text-sm tracking-wider text-red-500 uppercase">
                      BLACKWOOD EST. 1812
                    </span>
                    <Skull className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-xs text-stone-300 space-y-2 font-mono">
                    <p className="flex items-center justify-between">
                      <span className="text-stone-500">HOSTILE AI:</span>
                      <span className="text-red-400 font-bold">THE MATRIARCH</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-stone-500">MAINFRAME:</span>
                      <span className="text-emerald-400 font-bold">SQLITE OS v3.4</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-stone-500">CAMPAIGN:</span>
                      <span className="text-amber-300 font-bold">4 STORY CHAPTERS</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-stone-500">STEALTH:</span>
                      <span className="text-cyan-300 font-bold">CRAWL [Z] 0.38m</span>
                    </p>
                  </div>
                </div>

                <div className="z-10 space-y-2">
                  <button
                    onClick={skipGtaIntro}
                    className="w-full py-3 bg-white hover:bg-amber-400 text-black font-black text-xs sm:text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_#dc2626] transition flex items-center justify-center gap-2"
                  >
                    <span>ENTER MAIN MENU [SPACE]</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom GTA Loading Bar & Story Tip Strip */}
            <div className="h-14 bg-black border-t-4 border-white px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[11px] uppercase tracking-wider">
                  LOADING SANCTUARY
                </span>
                <span className="text-xs font-mono text-stone-300 truncate max-w-md sm:max-w-xl">
                  {activeIntroSlide.subtitle} — Press [Z] to crawl under beds or [Q] to decode SQL clues.
                </span>
              </div>

              <div className="flex items-center gap-3 w-48 sm:w-64">
                <div className="flex-1 h-3 bg-stone-900 border border-white/60 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-150"
                    style={{ width: `${introProgress}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-black text-white w-10 text-right">
                  {Math.round(introProgress)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STATE 1: AAA STORY-DRIVEN MAIN MENU ==================== */}
        {gameStatus === 'MAIN_MENU' && (
          <div className="absolute inset-0 z-30 bg-gradient-to-r from-black/95 via-black/80 to-transparent flex flex-col justify-between p-6 sm:p-10 overflow-y-auto">
            {/* Top Brand Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-red-900/40 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-red-400 uppercase tracking-widest">
                  <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>BLACKWOOD MANOR CHRONICLES // 4-CHAPTER CAMPAIGN</span>
                </div>
                <h1
                  className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[4px_4px_0px_#991b1b] mt-1"
                  style={{ transform: 'skewX(-5deg)' }}
                >
                  GRANNY 3D: <span className="text-red-600">THE SQL SANCTUARY</span>
                </h1>
              </div>

              <div className="flex items-center gap-3 bg-neutral-950/90 border border-stone-800 px-4 py-2 rounded-xl font-mono text-xs">
                <div>
                  <div className="text-[10px] text-stone-500">CAMPAIGN PROGRESS</div>
                  <div className="text-amber-400 font-bold">
                    CHAPTER {unlockedLevelIdx + 1} / 4 UNLOCKED
                  </div>
                </div>
                <div className="h-7 w-px bg-stone-800" />
                <div>
                  <div className="text-[10px] text-stone-500">HIGH SCORE</div>
                  <div className="text-emerald-400 font-black">{highScore} PTS</div>
                </div>
              </div>
            </div>

            {/* Center Split Navigation + Active Panel */}
            <div className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 items-center">
              {/* Left AAA Menu Buttons */}
              <div className="lg:col-span-5 space-y-2.5">
                <button
                  onClick={() => launchStoryChapterBriefing(unlockedLevelIdx)}
                  className="w-full text-left px-6 py-4 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white font-black text-base sm:text-lg tracking-wider uppercase shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:scale-[1.01] transition flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <Play className="w-5 h-5 fill-current" />
                    <span>
                      {unlockedLevelIdx > 0
                        ? `CONTINUE STORY (CHAPTER ${unlockedLevelIdx + 1})`
                        : 'START STORY CAMPAIGN'}
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setMenuTab('CHAPTERS')}
                  className={`w-full text-left px-5 py-3.5 rounded-xl font-black text-sm tracking-wider uppercase border transition flex items-center justify-between ${
                    menuTab === 'CHAPTERS'
                      ? 'bg-stone-900 border-amber-500 text-amber-300'
                      : 'bg-black/80 border-stone-800 text-stone-300 hover:bg-stone-900/70'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>SELECT STORY CHAPTER (4 LEVELS)</span>
                  </span>
                  <span className="text-xs font-mono text-stone-400">
                    {unlockedLevelIdx + 1}/4
                  </span>
                </button>

                <button
                  onClick={() => setMenuTab('HOW_TO_PLAY')}
                  className={`w-full text-left px-5 py-3.5 rounded-xl font-black text-sm tracking-wider uppercase border transition flex items-center justify-between ${
                    menuTab === 'HOW_TO_PLAY'
                      ? 'bg-stone-900 border-cyan-500 text-cyan-300'
                      : 'bg-black/80 border-stone-800 text-stone-300 hover:bg-stone-900/70'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>SURVIVOR FIELD MANUAL (STEALTH &amp; SQL)</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setMenuTab('SETTINGS')}
                  className={`w-full text-left px-5 py-3.5 rounded-xl font-black text-sm tracking-wider uppercase border transition flex items-center justify-between ${
                    menuTab === 'SETTINGS'
                      ? 'bg-stone-900 border-emerald-500 text-emerald-300'
                      : 'bg-black/80 border-stone-800 text-stone-300 hover:bg-stone-900/70'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>GRAPHICS, LIGHTING &amp; AI SETTINGS</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIntroSlideIndex(0);
                    setIntroProgress(0);
                    setIntroSoundActive(true);
                    engineRef.current.status = 'INTRO';
                    setGameStatus('INTRO');
                    horrorAudio.startGtaIntroTheme();
                  }}
                  className="w-full text-left px-5 py-3.5 rounded-xl bg-black/80 border border-stone-800 hover:border-red-500/60 text-stone-300 hover:text-white font-black text-sm tracking-wider uppercase transition flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <Film className="w-4 h-4 text-red-500" />
                    <span>REPLAY GTA CINEMATIC INTRO</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Right Context Panel */}
              <div className="lg:col-span-7 bg-neutral-950/95 border-2 border-stone-800 rounded-2xl p-6 shadow-2xl">
                {menuTab === 'CHAPTERS' || menuTab === 'HOME' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-wider text-amber-400">
                          4-CHAPTER STORY CAMPAIGN
                        </h3>
                        <p className="text-xs text-stone-400">
                          Select any chapter to play or test specific SQL levels directly.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {STORY_CHAPTERS.map((chap, idx) => {
                        const isUnlocked = idx <= unlockedLevelIdx;
                        return (
                          <div
                            key={chap.levelIndex}
                            className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                              currentLevelIdx === idx
                                ? 'bg-red-950/30 border-red-500'
                                : 'bg-stone-900/80 border-stone-800'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-amber-400 font-bold">
                                  {chap.chapterNumber}
                                </span>
                                <span className="text-stone-400">
                                  AI Speed: {chap.grannySpeedMultiplier}x
                                </span>
                              </div>
                              <div className="text-base font-black text-white">{chap.title}</div>
                              <div className="text-xs text-stone-400">{chap.subtitle}</div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                              <span className="text-[11px] font-mono text-emerald-400">
                                Exit: {chap.exitName}
                              </span>
                              <button
                                onClick={() => launchStoryChapterBriefing(idx)}
                                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider"
                              >
                                {isUnlocked ? 'PLAY' : 'PLAY CHAPTER'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : menuTab === 'HOW_TO_PLAY' ? (
                  <div className="space-y-4 text-xs sm:text-sm text-stone-300">
                    <h3 className="text-lg font-black uppercase tracking-wider text-cyan-400 border-b border-stone-800 pb-2">
                      SURVIVOR FIELD MANUAL — STEALTH, CRAWLING &amp; SQL
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                        <div className="font-mono font-bold text-amber-300">
                          📜 1. Find Physical Dossiers (`[E]`)
                        </div>
                        <p className="text-xs text-stone-400">
                          Each chapter hides 4 glowing Amber Dossiers. Walk up to them and press{' '}
                          <kbd className="px-1.5 py-0.5 bg-black rounded text-amber-300">E</kbd> to
                          collect them.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                        <div className="font-mono font-bold text-emerald-300">
                          💻 2. Execute SQL Queries (`[Q]`)
                        </div>
                        <p className="text-xs text-stone-400">
                          Solve the SQL query on each dossier to reveal and spawn the physical
                          Escape Tool in 3D space AND trigger an <strong>8s Granny Freeze Ward</strong>.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                        <div className="font-mono font-bold text-cyan-300">
                          🕸️ 3. Prone Crawling (`[Z]` — 0.38m)
                        </div>
                        <p className="text-xs text-stone-400">
                          Press <kbd className="px-1.5 py-0.5 bg-black rounded text-cyan-300">Z</kbd>{' '}
                          to drop flat (`0.38m`). Crawl silently over creaky planks, underneath
                          Iron Beds, and through `0.65m` Wall Vents where Granny cannot enter!
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                        <div className="font-mono font-bold text-red-400">
                          🚪 4. Breach the Chapter Exit
                        </div>
                        <p className="text-xs text-stone-400">
                          Once you collect all 4 unlocked Escape Tools, run to the Chapter Exit Gate
                          at the South Foyer (`[E]`) to advance to the next story level.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 font-mono text-xs">
                    <h3 className="text-lg font-black uppercase tracking-wider text-emerald-400 border-b border-stone-800 pb-2">
                      GRAPHICS, AUDIO &amp; DIFFICULTY SETTINGS
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-stone-400 mb-1">
                          3D Lighting &amp; Fog Atmosphere
                        </label>
                        <select
                          value={config.lightingMode}
                          onChange={(e) => setConfig({ ...config, lightingMode: e.target.value })}
                          className="w-full rounded-lg bg-black border border-stone-700 px-3 py-2 text-stone-100"
                        >
                          <option value="horror">Dark Volumetric Flashlight (Authentic)</option>
                          <option value="lantern">Lantern Ambient Glow</option>
                          <option value="fullbright">High-Visibility Mode</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-stone-400 mb-1">
                          The Matriarch AI Aggression
                        </label>
                        <select
                          value={config.grannyDifficulty}
                          onChange={(e) =>
                            setConfig({ ...config, grannyDifficulty: e.target.value })
                          }
                          className="w-full rounded-lg bg-black border border-stone-700 px-3 py-2 text-stone-100"
                        >
                          <option value="stalker">Classic Stalker (Sight + Acoustic)</option>
                          <option value="nightmare">Nightmare Frenzy (1.2x Speed)</option>
                          <option value="blind_listener">Blind Listener (Sound Only)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Footer */}
            <div className="text-xs font-mono text-stone-400 flex flex-wrap items-center justify-between gap-2 border-t border-stone-900 pt-3">
              <span>
                CONTROLS: [WASD] Move &bull; [SHIFT] Sprint &bull; [C] Crouch &bull; [Z] Prone Crawl
                &bull; [E] Interact / Hide &bull; [Q] SQL Mainframe
              </span>
              <span className="text-stone-500">BLACKWOOD SANCTUARY ENGINE v4.0</span>
            </div>
          </div>
        )}

        {/* ==================== STATE 2: STORY CHAPTER CUTSCENE BRIEFING ==================== */}
        {gameStatus === 'CHAPTER_INTRO' && (
          <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-2xl w-full rounded-2xl bg-neutral-950 border-2 border-red-700/80 p-6 sm:p-8 shadow-[0_0_50px_rgba(220,38,38,0.3)] space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <span className="px-3 py-1 rounded bg-red-950 text-red-300 border border-red-600/40 font-mono text-xs font-bold">
                  {currentChapter.chapterNumber} // {currentChapter.subtitle}
                </span>
                <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 animate-pulse" /> {currentChapter.radioCaller}
                </span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-wider text-white">
                  {currentChapter.title}
                </h2>
                <p className="text-xs font-mono text-emerald-400 mt-1">
                  PRIMARY OBJECTIVE: Crack 4 SQL Dossiers &rarr; Collect 4 Tools &rarr; Breach{' '}
                  {currentChapter.exitName}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/90 border-l-4 border-amber-500 font-mono text-xs sm:text-sm text-stone-200 leading-relaxed italic">
                {currentChapter.storyBriefing}
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-black border border-stone-800">
                  <div className="text-[10px] text-stone-500">CHAPTER EXIT</div>
                  <div className="text-stone-200 font-bold mt-0.5">{currentChapter.exitName}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black border border-stone-800">
                  <div className="text-[10px] text-stone-500">MATRIARCH SPEED</div>
                  <div className="text-red-400 font-bold mt-0.5">
                    {currentChapter.grannySpeedMultiplier}x VELOCITY
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-black border border-stone-800">
                  <div className="text-[10px] text-stone-500">SURVIVAL WINDOW</div>
                  <div className="text-amber-400 font-bold mt-0.5">5 DAYS (LIVES)</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    engineRef.current.status = 'MAIN_MENU';
                    setGameStatus('MAIN_MENU');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 text-stone-300 font-mono text-xs font-bold"
                >
                  BACK TO MENU
                </button>
                <button
                  onClick={beginActiveChapterGameplay}
                  className="px-7 py-3 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" /> BEGIN {currentChapter.chapterNumber}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ACTIVE GAMEPLAY HUD & OVERLAYS ==================== */}
        {gameStatus === 'PLAYING' && (
          <>
            {/* Blood Proximity Vignette */}
            <div
              className="pointer-events-none absolute inset-0 transition-all duration-300"
              style={{
                background:
                  hudState.grannyDist < 12 && hudState.safeWardSeconds <= 0
                    ? 'radial-gradient(circle, rgba(0,0,0,0) 38%, rgba(185, 16, 16, 0.62) 100%)'
                    : 'radial-gradient(circle, rgba(0,0,0,0) 58%, rgba(0, 0, 0, 0.78) 100%)'
              }}
            />

            {/* Slatted Wardrobe Peepholes */}
            {hudState.isHidden && hudState.hiddenType === 'WARDROBE' && (
              <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, rgba(12,6,3,0.95) 0px, rgba(12,6,3,0.95) 48px, rgba(0,0,0,0.08) 48px, rgba(0,0,0,0.08) 76px)'
                }}
              />
            )}

            {/* Prone Crawl Valance Banner */}
            {(hudState.inCrawlZone || stance === 'CRAWL') && (
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
                <div className="h-16 bg-gradient-to-b from-black/95 via-stone-950/75 to-transparent flex items-center justify-center">
                  <span className="text-[11px] font-mono font-bold text-cyan-300 bg-black/80 px-3 py-0.5 rounded-full border border-cyan-500/40">
                    🕸️ PRONE CRAWL (0.38m Eye Height — 0dB Silent Stealth)
                    {hudState.inCrawlZone ? ` • ${hudState.crawlZoneName}` : ''}
                  </span>
                </div>
                <div className="h-10 bg-gradient-to-t from-black/90 to-transparent" />
              </div>
            )}

            {/* Top Telemetry Bar */}
            <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex flex-wrap items-start justify-between gap-2">
              <div className="pointer-events-auto flex flex-wrap items-center gap-3 bg-black/85 backdrop-blur-md px-4 py-2 rounded-xl border border-red-900/50 shadow-2xl">
                <div>
                  <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                    {currentChapter.chapterNumber}: {currentChapter.title}
                  </div>
                  <div className="text-sm font-black text-red-500">
                    DAY {day}/5 {'🩸'.repeat(6 - day)}
                  </div>
                </div>

                <div className="h-7 w-px bg-stone-800 hidden sm:block" />

                <div>
                  <div className="text-[10px] uppercase text-stone-400">Dossiers &rarr; SQL</div>
                  <div className="text-xs font-mono font-bold text-amber-300">
                    📜 {discoveredClues.length}/4 &bull; 💻 {decryptedClues.length}/4
                  </div>
                </div>

                <div className="h-7 w-px bg-stone-800 hidden sm:block" />

                <div>
                  <div className="text-[10px] uppercase text-stone-400">Escape Tools</div>
                  <div className="text-sm font-mono font-extrabold text-emerald-400">
                    🗝️ {collectedTools.length} / 4
                  </div>
                </div>

                <div className="h-7 w-px bg-stone-800 hidden sm:block" />

                <div>
                  <div className="text-[10px] uppercase text-stone-400">Stance</div>
                  <div className="text-xs font-mono font-extrabold text-cyan-300">
                    {stance === 'CRAWL'
                      ? '🕸️ CRAWL (0.38m)'
                      : stance === 'CROUCH'
                      ? '🦵 CROUCH (1.0m)'
                      : '🧍 STAND (1.7m)'}
                  </div>
                </div>

                <div className="h-7 w-px bg-stone-800 hidden sm:block" />

                <div>
                  <div className="text-[10px] uppercase text-stone-400">Matriarch Radar</div>
                  <div className="text-xs font-mono font-bold text-red-400">
                    {hudState.grannyMode} ({hudState.grannyDist}m)
                  </div>
                </div>

                {hudState.safeWardSeconds > 0 && (
                  <div className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-400 text-xs font-mono font-bold text-emerald-300 animate-pulse">
                    🛡️ SAFE WARD: {hudState.safeWardSeconds}s
                  </div>
                )}

                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={() => {
                      const eng = engineRef.current;
                      const target =
                        currentChapter.clues.find(
                          (c) =>
                            eng.discoveredClueIds.has(c.id) && !eng.decryptedClueIds.has(c.id)
                        ) || currentChapter.clues[0];
                      eng.discoveredClueIds.add(target.id);
                      setDiscoveredClues(Array.from(eng.discoveredClueIds));
                      openSqlDecoderForClue(target);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-950 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-900"
                  >
                    💻 SQL [Q]
                  </button>
                  <button
                    onClick={() => {
                      if (document.pointerLockElement) document.exitPointerLock();
                      engineRef.current.status = 'MAIN_MENU';
                      setGameStatus('MAIN_MENU');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-stone-900 border border-stone-700 text-stone-300 hover:bg-red-950"
                  >
                    MENU
                  </button>
                </div>
              </div>

              {showMinimap && (
                <div className="pointer-events-auto bg-black/90 p-2.5 rounded-2xl border border-red-900/60 shadow-2xl flex flex-col items-center gap-1">
                  <div className="w-full flex items-center justify-between gap-2 px-1">
                    <span className="text-[10px] font-mono font-extrabold text-cyan-300 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-amber-400" />
                      HDG {headingText}
                    </span>
                    <button
                      onClick={() => {
                        const nextMode =
                          minimapMode === 'HEADING_UP' ? 'NORTH_UP' : 'HEADING_UP';
                        minimapModeRef.current = nextMode;
                        setMinimapMode(nextMode);
                      }}
                      title="Toggle Rotating Heading-Up vs Fixed North-Up Radar"
                      className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[9px] font-mono font-bold text-amber-300 transition"
                    >
                      {minimapMode === 'HEADING_UP' ? '🔄 ROTATING' : '⬆️ NORTH-UP'}
                    </button>
                  </div>

                  <canvas
                    ref={minimapCanvasRef}
                    width={156}
                    height={156}
                    className="rounded-full"
                  />

                  <div className="text-[9px] font-mono text-stone-400 flex items-center gap-1.5">
                    <span>🟠Clue</span>
                    <span>🟢Tool</span>
                    <span>🔵Vent</span>
                    <span>🔴Granny</span>
                  </div>
                </div>
              )}
            </div>

            {/* Context Prompt */}
            {hudState.contextPrompt && (
              <div className="absolute bottom-28 inset-x-0 z-20 flex justify-center px-4">
                <button
                  onClick={handleContextInteract}
                  className="bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-5 py-2 rounded-full text-xs sm:text-sm font-mono font-extrabold shadow-2xl animate-bounce"
                >
                  {hudState.contextPrompt}
                </button>
              </div>
            )}

            {/* Clue Dossier Inventory Bar */}
            <div className="absolute bottom-12 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-stone-400 mr-1">
                  Chapter Dossiers (Click to Decrypt via SQL):
                </span>
                {currentChapter.clues.map((clue) => {
                  const isFound = discoveredClues.includes(clue.id);
                  const isDecrypted = decryptedClues.includes(clue.id);
                  const hasTool = collectedTools.includes(clue.id);

                  return (
                    <button
                      key={clue.id}
                      onClick={() => {
                        if (!isFound) {
                          showToast(
                            `🔍 Search the ${clue.room} to find "${clue.clueName}" first!`
                          );
                        } else {
                          openSqlDecoderForClue(clue);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 border transition ${
                        hasTool
                          ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                          : isDecrypted
                          ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 animate-pulse'
                          : isFound
                          ? 'bg-amber-950/90 border-amber-400 text-amber-200 animate-bounce'
                          : 'bg-stone-900/70 border-stone-800 text-stone-500'
                      }`}
                    >
                      {hasTool ? (
                        <Check className="w-3 h-3" />
                      ) : isDecrypted ? (
                        <Unlock className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      <span>
                        #{clue.id + 1}{' '}
                        {hasTool
                          ? clue.unlockedToolName
                          : isDecrypted
                          ? `Retrieve: ${clue.unlockedToolName}`
                          : isFound
                          ? 'DECRYPT SQL NOW!'
                          : `Undiscovered (${clue.room})`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Stance Controls Bar */}
            <div className="absolute bottom-1.5 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 bg-black/90 px-3 py-1 rounded-xl border border-stone-800">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => changePlayerStance('STAND')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    stance === 'STAND'
                      ? 'bg-amber-700 border-amber-400 text-white'
                      : 'bg-stone-900 border-stone-700 text-stone-400'
                  }`}
                >
                  🧍 STAND (1.7m)
                </button>
                <button
                  onClick={() => changePlayerStance('CROUCH')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    stance === 'CROUCH'
                      ? 'bg-cyan-800 border-cyan-400 text-white'
                      : 'bg-stone-900 border-stone-700 text-stone-400'
                  }`}
                >
                  🦵 CROUCH [C] (1.0m)
                </button>
                <button
                  onClick={() => changePlayerStance('CRAWL')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    stance === 'CRAWL'
                      ? 'bg-emerald-700 border-emerald-300 text-white'
                      : 'bg-stone-900 border-stone-700 text-stone-400'
                  }`}
                >
                  🕸️ PRONE CRAWL [Z] (0.38m)
                </button>
                <button
                  onClick={handleContextInteract}
                  className="px-3 py-1 rounded bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold ml-1"
                >
                  🖐️ INTERACT / HIDE [E]
                </button>
              </div>

              <div className="text-[11px] font-mono text-stone-400 hidden xl:block">
                [WASD]: Move &bull; [Z]: Crawl Under Beds &amp; Wall Vents &bull; [C]: Crouch &bull;
                [E]: Examine / Hide &bull; [Q]: SQL Terminal
              </div>
            </div>
          </>
        )}

        {/* Toast Notification */}
        {hudState.toastMessage && (
          <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-black/95 border border-amber-500/70 text-amber-200 px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-2xl text-center">
            {hudState.toastMessage}
          </div>
        )}

        {/* ==================== SQL CLUE DECRYPTION MODAL ==================== */}
        {gameStatus === 'SQL_DECODER' && activeClueForSql && (
          <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="max-w-3xl w-full rounded-2xl bg-neutral-950 border-2 border-amber-500 p-4 sm:p-6 shadow-2xl font-mono text-xs space-y-3.5 my-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    BLACKWOOD SQLITE MAINFRAME // {activeClueForSql.clueName.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    engineRef.current.status = 'PLAYING';
                    setGameStatus('PLAYING');
                    setActiveClueForSql(null);
                  }}
                  className="px-3 py-1 rounded bg-stone-900 border border-stone-700 text-stone-200 hover:bg-red-950 font-bold"
                >
                  ✕ STEP AWAY (ESC)
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
                <div className="text-[11px] text-emerald-300 font-bold">
                  REVEALS TOOL: {activeClueForSql.unlockedToolName} + 8s MATRIARCH FREEZE WARD
                </div>
                <p className="text-white text-xs sm:text-sm font-semibold">
                  {activeClueForSql.sqlPrompt}
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-amber-300">
                  📊 DATABASE TABLE: <strong className="text-white">{activeClueForSql.tableName}</strong>
                </div>
                <div className="overflow-x-auto rounded-lg border border-amber-500/30 bg-black">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-amber-950/60 text-amber-200 border-b border-amber-500/30">
                      <tr>
                        {activeClueForSql.columns.map((c) => (
                          <th key={c} className="px-2.5 py-1.5">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800 text-stone-200">
                      {activeClueForSql.rows.map((r, idx) => (
                        <tr key={idx}>
                          {r.map((val, i) => (
                            <td key={i} className="px-2.5 py-1">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-amber-400 font-bold">SQL&gt;</span>
                  <input
                    type="text"
                    value={sqlInput}
                    onChange={(e) => setSqlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') executeSqlDecryption();
                    }}
                    placeholder="SELECT column FROM table WHERE condition;"
                    className="w-full pl-14 pr-4 py-2.5 rounded-xl bg-black border-2 border-amber-500/70 text-emerald-200 focus:outline-none"
                  />
                </div>

                {showSqlHint && null}

                {sqlFeedback && (
                  <div
                    className={`p-3 rounded-xl font-bold text-xs leading-relaxed ${
                      sqlFeedback.type === 'success'
                        ? 'bg-emerald-950 border-2 border-emerald-400 text-emerald-200'
                        : 'bg-rose-950 border border-rose-500 text-rose-200'
                    }`}
                  >
                    {sqlFeedback.text}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    
                    <button
                      type="button"
                      onClick={() => setSqlInput("")}
                      className="px-3 py-2 rounded-lg bg-stone-900 border border-cyan-500/50 text-cyan-300 font-bold"
                    >
                      ✖ CLEAR
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={executeSqlDecryption}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black tracking-wider"
                  >
                    ▶ EXECUTE SQL &amp; UNLOCK TOOL (ENTER)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== CHAPTER CLEAR MODAL ==================== */}
        {gameStatus === 'CHAPTER_CLEAR' && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-xl w-full rounded-2xl bg-neutral-950 border-2 border-emerald-500 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                <Check className="w-4 h-4" /> {currentChapter.chapterNumber} COMPLETED
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-wider">
                {currentChapter.exitName} BREACHED!
              </h2>
              <p className="text-xs sm:text-sm font-mono text-stone-300">
                You decrypted all 4 SQL Dossiers and escaped {currentChapter.title}. Prepare to
                descend into the next chapter of Blackwood Sanctuary!
              </p>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => launchStoryChapterBriefing(currentLevelIdx + 1)}
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-black font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg"
                >
                  <span>CONTINUE TO {STORY_CHAPTERS[currentLevelIdx + 1]?.chapterNumber}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== FULL 4-CHAPTER CAMPAIGN VICTORY SCREEN ==================== */}
        {gameStatus === 'VICTORY_CAMPAIGN' && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-2xl w-full rounded-2xl bg-neutral-950 border-2 border-amber-400 p-7 text-center space-y-5 shadow-[0_0_60px_rgba(245,158,11,0.3)]">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-400 text-xs font-mono font-bold">
                <Award className="w-4 h-4" /> BLACKWOOD SANCTUARY SURVIVOR // ALL 4 CHAPTERS CLEARED
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-emerald-400 uppercase tracking-wider">
                YOU ESCAPED BLACKWOOD!
              </h2>
              <p className="text-xs sm:text-sm font-mono text-stone-300 leading-relaxed max-w-xl mx-auto">
                Under the crimson Blood Moon, you overrode the final perimeter relay, fired up
                Detective Vance’s armored cruiser, and smashed through the Main Iron Gate—leaving
                The Matriarch behind in the fog forever.
              </p>

              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-[10px] text-stone-400">FINAL CAMPAIGN SCORE</div>
                  <div className="text-xl font-black text-amber-400">{score}</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-[10px] text-stone-400">CHAPTERS COMPLETED</div>
                  <div className="text-xl font-black text-emerald-400">4 / 4</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-[10px] text-stone-400">SQL LOCKS CRACKED</div>
                  <div className="text-xl font-black text-cyan-400">16 / 16</div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    engineRef.current.status = 'MAIN_MENU';
                    setGameStatus('MAIN_MENU');
                  }}
                  className="px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-wider"
                >
                  RETURN TO MAIN MENU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== DAY TRANSITION OVERLAY ==================== */}
        {gameStatus === 'DAY_TRANSITION' && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-6xl sm:text-8xl font-black text-red-600 tracking-widest animate-pulse">
              DAY {day}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-stone-400 mt-4 max-w-md">
              {currentChapter.chapterNumber}: {currentChapter.title} — Your discovered dossiers and
              decrypted SQL tools remain unlocked!
            </p>
          </div>
        )}

        {/* ==================== GAME OVER MODAL ==================== */}
        {gameStatus === 'GAMEOVER' && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-xl w-full rounded-2xl bg-neutral-950 border-2 border-red-600/60 p-6 text-center space-y-5 shadow-2xl">
              <h2 className="text-3xl sm:text-5xl font-black tracking-wider text-red-500">
                CAPTURED BY THE MATRIARCH
              </h2>
              <p className="text-xs sm:text-sm font-mono text-stone-300">
                {gameOverSummary.reason}
              </p>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={beginActiveChapterGameplay}
                  className="px-7 py-3 rounded-xl font-black text-sm tracking-wider bg-gradient-to-r from-red-700 to-amber-600 text-white flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> RETRY {currentChapter.chapterNumber}
                </button>
                <button
                  onClick={() => {
                    engineRef.current.status = 'MAIN_MENU';
                    setGameStatus('MAIN_MENU');
                  }}
                  className="px-5 py-3 rounded-xl font-mono text-xs font-bold bg-stone-800 text-stone-200"
                >
                  MAIN MENU
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
