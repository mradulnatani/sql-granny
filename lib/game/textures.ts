import * as THREE from 'three';

// Procedural chapter texture generation extracted from the original game file.
export function createChapterHorrorTextures(floorColorHex, wallColorHex) {
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const fCtx = floorCanvas.getContext('2d');
  fCtx.fillStyle = floorColorHex;
  fCtx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) {
    fCtx.fillStyle = y % 128 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.22)';
    fCtx.fillRect(0, y, 512, 62);
    fCtx.strokeStyle = '#050302';
    fCtx.lineWidth = 3;
    fCtx.strokeRect(0, y, 512, 64);
  }
  for (let i = 0; i < 16; i++) {
    const grad = fCtx.createRadialGradient(256, 256, 5, 256, 256, 95);
    grad.addColorStop(0, 'rgba(105, 8, 8, 0.36)');
    grad.addColorStop(1, 'rgba(105, 8, 8, 0)');
    fCtx.fillStyle = grad;
    fCtx.beginPath();
    fCtx.arc(Math.random() * 512, Math.random() * 512, 25 + Math.random() * 65, 0, Math.PI * 2);
    fCtx.fill();
  }
  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(8, 8);

  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 512;
  wallCanvas.height = 512;
  const wCtx = wallCanvas.getContext('2d');
  wCtx.fillStyle = wallColorHex;
  wCtx.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 32) {
    wCtx.fillStyle = x % 64 === 0 ? 'rgba(0, 0, 0, 0.38)' : 'rgba(255, 255, 255, 0.03)';
    wCtx.fillRect(x, 0, 16, 512);
  }
  for (let i = 0; i < 50; i++) {
    wCtx.fillStyle = i % 4 === 0 ? 'rgba(95, 9, 9, 0.28)' : 'rgba(5, 5, 5, 0.45)';
    wCtx.beginPath();
    wCtx.arc(Math.random() * 512, Math.random() * 512, 14 + Math.random() * 65, 0, Math.PI * 2);
    wCtx.fill();
  }
  const wallTex = new THREE.CanvasTexture(wallCanvas);
  wallTex.wrapS = THREE.RepeatWrapping;
  wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(2, 1);

  return { floorTex, wallTex };
}
