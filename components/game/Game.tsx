'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

export default function Granny3DSqlSanctuary() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightingMode, setLightingMode] = useState<'lantern' | 'fullbright' | 'dark'>('lantern');

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene, Camera, Renderer setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.045);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // 2. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.38);
    scene.add(ambientLight);

    // Config object simulating your game config state
    const config = { lightingMode };

    // Your lighting and fog density check
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

    // 3. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [lightingMode]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => setLightingMode('lantern')}
          className="px-3 py-1 bg-zinc-800 text-white rounded text-sm border border-zinc-600"
        >
          Lantern Mode
        </button>
        <button
          onClick={() => setLightingMode('fullbright')}
          className="px-3 py-1 bg-zinc-800 text-white rounded text-sm border border-zinc-600"
        >
          Fullbright
        </button>
      </div>
    </div>
  );
}
