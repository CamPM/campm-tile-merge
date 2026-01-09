import { Injectable, signal } from '@angular/core';

export type SoundPackId = 'classic' | 'bubble' | 'wood' | 'glass' | 'retro' | 'scifi' | 'nature' | 'mech';

interface SoundProfile {
  osc: OscillatorType;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  attack: number;
  decay: number;
  pitchMod?: number; // Hz to drop over decay
  noise?: boolean; // Add noise layer
  detune?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private ctx: AudioContext | null = null;
  muted = signal(false);
  activePack = signal<SoundPackId>('classic');

  constructor() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  toggleMute() {
    this.muted.update(m => !m);
  }

  setPack(packId: string) {
    this.activePack.set(packId as SoundPackId);
  }

  // --- Sound Trigger Methods ---

  playPickUp() { 
    this.synthesize('pickup');
  }

  playDrop() { 
    this.synthesize('drop');
  }

  playReturn() {
    // Player decided not to place
    this.synthesize('return');
  }

  playClear(lines: number) { 
    // Play a chord or sequence based on lines
    const count = Math.min(lines, 4);
    for(let i=0; i<count; i++) {
      setTimeout(() => this.synthesize('clear', i), i * 80);
    }
  }

  playError() { 
    this.synthesize('error');
  }

  playPowerUp() { 
    this.synthesize('powerup');
  }

  // --- Synthesis Engine ---

  private synthesize(type: 'pickup' | 'drop' | 'return' | 'clear' | 'error' | 'powerup', variation: number = 0) {
    if (this.muted() || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const pack = this.activePack();
    const config = this.getConfig(pack, type, variation);

    // 1. Main Oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = config.osc;
    osc.frequency.setValueAtTime(this.getBaseFreq(pack, type, variation), t);
    
    if (config.pitchMod) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, this.getBaseFreq(pack, type, variation) - config.pitchMod), t + config.decay);
    }
    
    // 2. Filter (Optional)
    let node: AudioNode = osc;
    if (config.filterType && config.filterFreq) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = config.filterType;
      filter.frequency.setValueAtTime(config.filterFreq, t);
      // Dynamic filter for some sounds
      if (type === 'drop') {
         filter.frequency.exponentialRampToValueAtTime(config.filterFreq / 2, t + config.decay);
      }
      osc.connect(filter);
      node = filter;
    }

    // 3. Noise Layer (Optional for texture)
    if (config.noise) {
      this.createNoiseBurst(t, config.decay, type === 'return' ? 0.05 : 0.1);
    }

    // 4. Envelope
    node.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this.getVolume(type), t + config.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + config.attack + config.decay);

    osc.start(t);
    osc.stop(t + config.attack + config.decay + 0.1);
  }

  private createNoiseBurst(time: number, duration: number, vol: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    // Filter noise to make it less harsh
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(time);
  }

  private getVolume(type: string): number {
    switch (type) {
      case 'pickup': return 0.1;
      case 'drop': return 0.25; // Thud needs body
      case 'return': return 0.08;
      case 'clear': return 0.15;
      case 'error': return 0.15;
      case 'powerup': return 0.2;
      default: return 0.1;
    }
  }

  private getBaseFreq(pack: SoundPackId, type: string, variation: number): number {
    // Base pitch mapping
    const base = {
      pickup: 350,
      drop: 150, // Low thud
      return: 200,
      clear: 500, // + variation intervals
      error: 100,
      powerup: 600
    };

    // Pack overrides for pitch character
    if (pack === 'classic') base.drop = 120; // Deeper chill thud
    if (pack === 'bubble') { base.pickup = 500; base.drop = 300; }
    if (pack === 'retro') { base.pickup = 440; base.drop = 110; }
    if (pack === 'glass') { base.pickup = 800; base.drop = 400; base.clear = 1200; }
    
    // Chord intervals for clear (Pentatonic-ish)
    if (type === 'clear') {
      const intervals = [0, 200, 350, 500]; // roughly major chord
      return base.clear + (intervals[variation] || 0);
    }

    return base[type as keyof typeof base];
  }

  private getConfig(pack: SoundPackId, type: string, variation: number): SoundProfile {
    // Defaults (Classic / Chill)
    let config: SoundProfile = {
      osc: 'sine',
      attack: 0.01,
      decay: 0.15,
      filterType: 'lowpass',
      filterFreq: 800
    };

    switch (pack) {
      case 'classic': // Chill Lofi
        if (type === 'drop') { config.decay = 0.25; config.filterFreq = 300; config.osc = 'triangle'; } // Thud
        if (type === 'pickup') { config.osc = 'sine'; config.decay = 0.08; }
        if (type === 'clear') { config.osc = 'sine'; config.decay = 0.4; config.attack = 0.02; }
        if (type === 'return') { config.osc = 'sine'; config.decay = 0.1; config.filterFreq = 200; }
        break;

      case 'bubble': // Pitch sweeps
        config.osc = 'sine';
        config.pitchMod = 200;
        if (type === 'drop') { config.decay = 0.2; config.pitchMod = 300; }
        if (type === 'clear') { config.osc = 'triangle'; config.pitchMod = -100; } // Up sweep
        break;

      case 'wood': // Short, filtered
        config.osc = 'triangle'; // Woodblock-ish
        config.filterType = 'bandpass';
        config.filterFreq = 600;
        config.decay = 0.08;
        if (type === 'drop') { config.filterFreq = 200; config.decay = 0.1; }
        break;

      case 'glass': // High freq, bells
        config.osc = 'sine';
        config.filterType = 'highpass';
        config.filterFreq = 1000;
        config.decay = 0.5;
        if (type === 'drop') { config.decay = 0.2; config.filterFreq = 400; }
        break;

      case 'retro': // 8-bit
        config.osc = 'square';
        config.filterType = undefined;
        config.decay = 0.1;
        if (type === 'drop') { config.osc = 'sawtooth'; config.decay = 0.15; }
        if (type === 'clear') { config.osc = 'square'; config.decay = 0.3; config.attack = 0.01; }
        break;

      case 'scifi': // Futuristic
        config.osc = 'sawtooth';
        config.filterType = 'lowpass';
        config.filterFreq = 2000;
        if (type === 'pickup') { config.pitchMod = -200; config.decay = 0.1; } // Zip up
        if (type === 'drop') { config.pitchMod = 500; config.decay = 0.2; } // Zap down
        break;

      case 'nature': // Noise based
        config.osc = 'sine';
        config.noise = true; // Watery texture
        config.filterType = 'lowpass';
        config.filterFreq = 600;
        if (type === 'drop') { config.decay = 0.3; config.filterFreq = 300; }
        break;
      
      case 'mech': // Clicky
        config.osc = 'square';
        config.filterType = 'highpass';
        config.filterFreq = 200;
        config.decay = 0.05; // Tight click
        config.noise = true;
        break;
    }

    if (type === 'return') {
      config.decay = 0.1;
      config.pitchMod = 50;
    }
    
    if (type === 'error') {
      config.osc = 'sawtooth';
      config.decay = 0.2;
      config.pitchMod = 20;
      config.filterType = undefined;
    }

    return config;
  }
}