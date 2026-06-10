/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SoundProfileType = 'classic' | 'wood' | 'neko' | 'glass' | 'retro' | 'water' | 'cyber' | 'ambient' | 'forest';

class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // We instantiate lazily upon first interaction to bypass browser autoplay blocks
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  public playPickup(profile: SoundProfileType = 'classic') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Apply sound profile adjustments
    switch (profile) {
      case 'wood':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'neko':
      case 'glass':
        // Synthesizing a short, soft, high-frequency "meow" style sound envelope
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1300, now + 0.16);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1300, now);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
        break;

      case 'retro':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(600, now + 0.05);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'water':
        this.playWaterBurst(0.15, 800, 1500, 'bandpass');
        break;

      case 'cyber':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'ambient':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.2);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'forest':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(1050, now + 0.09);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, now);
        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
        break;

      case 'classic':
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
    }
  }

  public playDrop(profile: SoundProfileType = 'classic') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (profile) {
      case 'wood':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'neko':
      case 'glass':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'retro':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.2);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'water':
        this.playWaterBurst(0.25, 100, 400, 'lowpass');
        break;

      case 'cyber':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.18);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;

      case 'ambient':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(70, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'forest':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.22);
        filter.type = 'notch';
        filter.frequency.setValueAtTime(400, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;

      case 'classic':
      default:
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
    }
  }

  public playClear(linesCount: number, profile: SoundProfileType = 'classic') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Standard raw note frequencies forming a bright pentatonic scale
    // C4(261.63), D4(293.66), E4(329.63), G4(392.00), A4(440.00), C5(523.25), D5(587.33), E5(659.25), G5(783.99), A5(880.00)
    const basePentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

    // Determine notes to stack. Higher line count plays higher scale steps
    const notesCount = Math.min(3 + linesCount * 2, 10);
    const startIdx = Math.max(0, linesCount - 1);
    const activeNotes = basePentatonic.slice(startIdx, startIdx + notesCount);

    activeNotes.forEach((freq, index) => {
      const noteDelay = index * 0.08; // 80ms delay spacing per chord arpeggio Note
      const noteNow = now + noteDelay;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      let decayTime = 0.4;
      let waveType: OscillatorType = 'sine';
      let filterFreq = 1500;
      let filterType: BiquadFilterType = 'lowpass';

      switch (profile) {
        case 'wood':
          waveType = 'triangle';
          filterType = 'bandpass';
          filterFreq = freq * 1.5;
          decayTime = 0.3;
          break;
        case 'neko':
        case 'glass':
          waveType = 'triangle';
          filterType = 'bandpass';
          filterFreq = freq * 1.5;
          decayTime = 0.55;
          break;
        case 'retro':
          waveType = 'square';
          filterType = 'lowpass';
          filterFreq = 2200;
          decayTime = 0.35;
          break;
        case 'water':
          waveType = 'sine';
          filterType = 'lowpass';
          filterFreq = freq * 1.2;
          decayTime = 0.5;
          break;
        case 'cyber':
          waveType = 'sawtooth';
          filterType = 'bandpass';
          filterFreq = freq * 1.8;
          decayTime = 0.45;
          break;
        case 'ambient':
          waveType = 'sine';
          filterType = 'lowpass';
          filterFreq = 400;
          decayTime = 1.2;
          break;
        case 'forest':
          waveType = 'triangle';
          filterType = 'lowpass';
          filterFreq = freq * 2;
          decayTime = 0.5;
          break;
        case 'classic':
        default:
          waveType = 'sine';
          filterType = 'lowpass';
          filterFreq = 1800;
          decayTime = 0.45;
          break;
      }

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, noteNow);
      
      // Fun pitch slide for retro feel
      if (profile === 'retro') {
        osc.frequency.linearRampToValueAtTime(freq * 1.5, noteNow + decayTime * 0.5);
      }

      // Cheerful vibrating purr frequency modulation
      if (profile === 'neko' || profile === 'glass') {
        for (let t = 0.02; t < decayTime; t += 0.04) {
          osc.frequency.setValueAtTime(freq * 1.04, noteNow + t);
          osc.frequency.setValueAtTime(freq * 0.96, noteNow + t + 0.02);
        }
      }

      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, noteNow);

      const maxGain = 0.2 / activeNotes.length;
      gainNode.gain.setValueAtTime(0, noteNow);
      gainNode.gain.linearRampToValueAtTime(maxGain, noteNow + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteNow + decayTime);

      osc.start(noteNow);
      osc.stop(noteNow + decayTime);
    });
  }

  // Helper node to generate filtered white noise blocks for water texture soundscapes
  private playWaterBurst(duration: number, lowFreq: number, highFreq: number, filterType: BiquadFilterType = 'bandpass') {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Procedural random noise generation
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(lowFreq, now);
    filter.frequency.exponentialRampToValueAtTime(highFreq, now + duration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }

  // General click sound for interactions
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.04);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Procedural jingle to make unlocking or buying shop skins extremely satisfying!
  public playStoreUnlock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Warm Major scale chord sweeps (C4, E4, G4, C5, E5)
    [261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq, idx) => {
      const time = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.1, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.start(time);
      osc.stop(time + 0.3);
    });
  }
}

export const audioService = new AudioService();
export default audioService;
