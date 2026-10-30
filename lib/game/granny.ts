import * as THREE from 'three';

// Three.js character model builder extracted without gameplay changes.
export function buildRealisticGrannyMesh() {
  const grannyRoot = new THREE.Group();

  const gownCanvas = document.createElement('canvas');
  gownCanvas.width = 256;
  gownCanvas.height = 256;
  const gCtx = gownCanvas.getContext('2d');
  gCtx.fillStyle = '#282324';
  gCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 75; i++) {
    gCtx.fillStyle = i % 3 === 0 ? 'rgba(110, 8, 8, 0.48)' : 'rgba(10, 8, 8, 0.55)';
    gCtx.fillRect(
      Math.random() * 256,
      Math.random() * 256,
      12 + Math.random() * 45,
      4 + Math.random() * 28
    );
  }
  const gownTex = new THREE.CanvasTexture(gownCanvas);

  const gownMat = new THREE.MeshStandardMaterial({
    map: gownTex,
    bumpMap: gownTex,
    bumpScale: 0.04,
    roughness: 0.94,
    metalness: 0.06
  });
  const necroticSkinMat = new THREE.MeshStandardMaterial({
    color: 0x8a928b,
    roughness: 0.62,
    metalness: 0.1
  });
  const darkSocketMat = new THREE.MeshBasicMaterial({ color: 0x070202 });
  const cataractEyeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  const redPupilMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35 });

  // Tattered Gown & Hunched Spine
  const lowerSkirt = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.48, 18), gownMat);
  lowerSkirt.position.y = 0.74;
  lowerSkirt.castShadow = true;
  grannyRoot.add(lowerSkirt);

  const hunchedTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.55, 0.96, 16), gownMat);
  hunchedTorso.position.set(0, 1.54, 0.09);
  hunchedTorso.rotation.x = 0.26;
  hunchedTorso.castShadow = true;
  grannyRoot.add(hunchedTorso);

  const shawl = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.12, 10, 20), gownMat);
  shawl.position.set(0, 1.89, 0.14);
  shawl.rotation.x = Math.PI / 2 + 0.25;
  grannyRoot.add(shawl);

  // Anatomical Horror Head & Twitching Neck
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.09, 0.23);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.315, 22, 22), necroticSkinMat);
  cranium.scale.set(0.88, 1.09, 0.96);
  headPivot.add(cranium);

  const leftSocket = new THREE.Mesh(new THREE.SphereGeometry(0.086, 12, 12), darkSocketMat);
  leftSocket.position.set(-0.11, 0.06, 0.24);
  const rightSocket = new THREE.Mesh(new THREE.SphereGeometry(0.086, 12, 12), darkSocketMat);
  rightSocket.position.set(0.11, 0.06, 0.24);
  headPivot.add(leftSocket, rightSocket);

  const leftEyeball = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 12), cataractEyeMat);
  leftEyeball.position.set(-0.11, 0.06, 0.28);
  const rightEyeball = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 12), cataractEyeMat);
  rightEyeball.position.set(0.11, 0.06, 0.28);
  headPivot.add(leftEyeball, rightEyeball);

  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), redPupilMat);
  leftPupil.position.set(-0.11, 0.06, 0.33);
  const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), redPupilMat);
  rightPupil.position.set(0.11, 0.06, 0.33);
  headPivot.add(leftPupil, rightPupil);

  const hookedNose = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.19, 8), necroticSkinMat);
  hookedNose.position.set(0, -0.02, 0.33);
  hookedNose.rotation.x = Math.PI / 2 + 0.35;
  headPivot.add(hookedNose);

  // Screaming Jaw with Crooked Yellowed Teeth
  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -0.13, 0.16);
  const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.22), necroticSkinMat);
  lowerJaw.position.set(0, -0.04, 0.06);
  jawPivot.add(lowerJaw);

  for (let t = -2; t <= 2; t++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.048, 5), toothMat);
    tooth.position.set(t * 0.042, 0.026, 0.14);
    jawPivot.add(tooth);
  }
  headPivot.add(jawPivot);

  const hairBun = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 12), hairMat);
  hairBun.position.set(0, 0.12, -0.28);
  headPivot.add(hairBun);
  grannyRoot.add(headPivot);

  // Left Arm
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.46, 1.82, 0.12);
  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.065, 0.72, 10),
    necroticSkinMat
  );
  leftUpperArm.position.set(0, -0.32, 0.08);
  leftUpperArm.rotation.x = -0.35;
  leftArmPivot.add(leftUpperArm);
  grannyRoot.add(leftArmPivot);

  // Right Arm + Barbed-Wire Bloodied Baseball Bat
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.48, 1.82, 0.14);
  const rightUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.07, 0.75, 10),
    necroticSkinMat
  );
  rightUpperArm.position.set(0, -0.32, 0.05);
  rightArmPivot.add(rightUpperArm);

  const batGroup = new THREE.Group();
  batGroup.position.set(0, -0.66, 0.34);
  batGroup.rotation.x = Math.PI / 2.6;

  const batWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.55 });
  const batTipBloodMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    roughness: 0.25,
    metalness: 0.15
  });
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    metalness: 0.88,
    roughness: 0.25
  });

  const batShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.086, 1.2, 12), batWoodMat);
  batGroup.add(batShaft);

  const bloodTip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.089, 0.076, 0.46, 12),
    batTipBloodMat
  );
  bloodTip.position.y = -0.32;
  batGroup.add(bloodTip);

  for (let w = 0; w < 6; w++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.013, 6, 14), wireMat);
    coil.position.y = -0.12 - w * 0.075;
    coil.rotation.x = Math.PI / 2 + 0.2;
    batGroup.add(coil);
  }

  rightArmPivot.add(batGroup);
  grannyRoot.add(rightArmPivot);

  const terrorLight = new THREE.PointLight(0xdc2626, 2.8, 10.5);
  terrorLight.position.set(0, 2.1, 0.5);
  grannyRoot.add(terrorLight);

  return {
    grannyRoot,
    headPivot,
    jawPivot,
    leftArmPivot,
    rightArmPivot,
    terrorLight
  };
}
