// @ts-nocheck
// Web Audio engine extracted from the original game file.
export class Horror3DAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastHeartbeat = 0;
    this.lastGrannyStep = 0;
    this.lastPlayerStep = 0;
    this.gtaBeatInterval = null;
    this.gtaStepIndex = 0;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Iconic Dark GTA-Style Synthwave / Horror Bassline Groove for Intro & Menu
  startGtaIntroTheme() {
    this.init();
    this.stopGtaIntroTheme();
    if (!this.enabled || !this.ctx) return;

    const bassNotes = [55, 55, 65.41, 55, 73.42, 69.3, 65.41, 49.0]; // A1 minor dark groove
    const leadBell = [440, 0, 523.25, 0, 587.33, 554.37, 0, 392.0];

    this.gtaStepIndex = 0;
    this.gtaBeatInterval = setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      try {
        const now = this.ctx.currentTime;
        const step = this.gtaStepIndex % bassNotes.length;
        this.gtaStepIndex++;

        // 1. Gritty Sawtooth Bass Pluck
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNotes[step], now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(360, now);
        bassFilter.frequency.exponentialRampToValueAtTime(95, now + 0.28);

        bassGain.gain.setValueAtTime(0.16, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.34);

        // 2. Kick Drum Thump on even beats
        if (step % 2 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(115, now);
          kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.14);
          kickGain.gain.setValueAtTime(0.24, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);
          kickOsc.start(now);
          kickOsc.stop(now + 0.17);
        }

        // 3. Eerie GTA Vice/IV High Synth Lead Chime
        if (leadBell[step] > 0) {
          const bellOsc = this.ctx.createOscillator();
          const bellGain = this.ctx.createGain();
          bellOsc.type = 'triangle';
          bellOsc.frequency.setValueAtTime(leadBell[step], now);
          bellGain.gain.setValueAtTime(0.065, now);
          bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          bellOsc.connect(bellGain);
          bellGain.connect(this.ctx.destination);
          bellOsc.start(now);
          bellOsc.stop(now + 0.46);
        }
      } catch (e) {}
    }, 360);
  }

  stopGtaIntroTheme() {
    if (this.gtaBeatInterval) {
      clearInterval(this.gtaBeatInterval);
      this.gtaBeatInterval = null;
    }
  }

  playPanelSnapSting() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  updateSpatialAudio(nowMs, distToGranny, isChasing, isPlayerMoving, stance) {
    if (!this.enabled || !this.ctx) return;

    const hbInterval = isChasing ? 290 : Math.max(330, Math.min(1050, distToGranny * 28));
    if (nowMs - this.lastHeartbeat > hbInterval && distToGranny < 26) {
      this.lastHeartbeat = nowMs;
      this.playHeartbeatThump(distToGranny, isChasing);
    }

    const stepInterval = isChasing ? 310 : 590;
    if (nowMs - this.lastGrannyStep > stepInterval && distToGranny < 24) {
      this.lastGrannyStep = nowMs;
      this.playGrannyFootstep(distToGranny);
    }

    if (isPlayerMoving && stance !== 'CRAWL') {
      const pInterval = stance === 'SPRINT' ? 270 : stance === 'CROUCH' ? 620 : 450;
      if (nowMs - this.lastPlayerStep > pInterval) {
        this.lastPlayerStep = nowMs;
        this.playPlayerFootstep(stance);
      }
    }
  }

  playHeartbeatThump(dist, isChasing) {
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isChasing ? 72 : 55, now);
      osc.frequency.exponentialRampToValueAtTime(24, now + 0.16);
      const vol = Math.min(0.45, Math.max(0.04, (26 - Math.min(26, dist)) / 50));
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  playGrannyFootstep(dist) {
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(86, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
      const vol = Math.min(0.32, Math.max(0.02, (24 - Math.min(24, dist)) / 62));
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  playPlayerFootstep(stance) {
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(stance === 'SPRINT' ? 145 : 95, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.07);
      gain.gain.setValueAtTime(
        stance === 'SPRINT' ? 0.1 : stance === 'CROUCH' ? 0.02 : 0.05,
        now
      );
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playCluePickup() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch (e) {}
  }

  playCreak() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(235, now);
      osc.frequency.linearRampToValueAtTime(135, now + 0.16);
      osc.frequency.linearRampToValueAtTime(190, now + 0.32);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playSqlSuccess() {
    if (!this.enabled || !this.ctx) return;
    try {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      });
    } catch (e) {}
  }

  playSqlAlarm() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(155, now);
      osc.frequency.setValueAtTime(110, now + 0.14);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playJumpscareScreech() {
    if (!this.enabled || !this.ctx) return;
    try {
      [105, 148, 222, 311, 466, 622].forEach((f) => {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.62, now + 0.75);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      });
    } catch (e) {}
  }
}

export const horrorAudio = new Horror3DAudioEngine();
