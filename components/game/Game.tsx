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
        ambientLight.intensity = 0.09;
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.density = chapterCfg.fogDensity;
        }
      }
