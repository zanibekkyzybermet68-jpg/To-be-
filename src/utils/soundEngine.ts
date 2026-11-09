export type EqPresetName = 'retro' | 'synthwave' | 'bass' | 'custom';

export interface EqBands {
  b60: number;   // 60 Hz Bass (-12 to +12 dB)
  b250: number;  // 250 Hz Low-Mid (-12 to +12 dB)
  b1k: number;   // 1 kHz Mid (-12 to +12 dB)
  b4k: number;   // 4 kHz High-Mid (-12 to +12 dB)
  b12k: number;  // 12 kHz Treble (-12 to +12 dB)
}

export const EQ_PRESETS: Record<EqPresetName, { label: string; description: string; bands: EqBands }> = {
  retro: {
    label: 'Retro 8-Bit',
    description: 'Mid-focused chiptune crunch with rolled-off sub-bass and crisp upper harmonics.',
    bands: { b60: -4, b250: 2, b1k: 6, b4k: 5, b12k: -2 },
  },
  synthwave: {
    label: 'Neon Synthwave',
    description: 'Warm analog V-curve with punchy 60 Hz sub-bass and shimmering 12 kHz air.',
    bands: { b60: 6, b250: 1, b1k: -2, b4k: 4, b12k: 7 },
  },
  bass: {
    label: 'Heavy Bass',
    description: 'Deep low-end boost at 60 Hz and 250 Hz for maximum arcade impact.',
    bands: { b60: 9, b250: 6, b1k: 0, b4k: 2, b12k: 3 },
  },
  custom: {
    label: 'Custom 5-Band DSP',
    description: 'Manual 5-band biquad filter curve tailored with precision faders.',
    bands: { b60: 3, b250: 0, b1k: 1, b4k: 4, b12k: 5 },
  },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private filterNodes: BiquadFilterNode[] = [];
  private masterGain: GainNode | null = null;
  public muted: boolean = false;
  public sfxVolume: number = 0.85;
  public voiceVolume: number = 0.95;
  public currentPreset: EqPresetName = 'synthwave';
  public bands: EqBands = { ...EQ_PRESETS.synthwave.bands };

  private init(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.setupFilterChain();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupFilterChain() {
    if (!this.ctx) return;
    const configs: Array<{ type: BiquadFilterType; freq: number; q: number; gain: number }> = [
      { type: 'lowshelf', freq: 60, q: 0.7, gain: this.bands.b60 },
      { type: 'peaking', freq: 250, q: 1.0, gain: this.bands.b250 },
      { type: 'peaking', freq: 1000, q: 1.0, gain: this.bands.b1k },
      { type: 'peaking', freq: 4000, q: 1.0, gain: this.bands.b4k },
      { type: 'highshelf', freq: 12000, q: 0.7, gain: this.bands.b12k },
    ];

    this.filterNodes = configs.map((c) => {
      const f = this.ctx!.createBiquadFilter();
      f.type = c.type;
      f.frequency.value = c.freq;
      f.Q.value = c.q;
      f.gain.value = c.gain;
      return f;
    });

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.sfxVolume;

    for (let i = 0; i < this.filterNodes.length - 1; i++) {
      this.filterNodes[i].connect(this.filterNodes[i + 1]);
    }
    this.filterNodes[this.filterNodes.length - 1].connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  private getOutputNode(): AudioNode | null {
    const ctx = this.init();
    if (!ctx) return null;
    if (this.filterNodes.length > 0) {
      return this.filterNodes[0];
    }
    return ctx.destination;
  }

  public setBands(newBands: EqBands, preset: EqPresetName = 'custom') {
    this.bands = { ...newBands };
    this.currentPreset = preset;
    if (this.ctx && this.filterNodes.length === 5) {
      const now = this.ctx.currentTime;
      const vals = [newBands.b60, newBands.b250, newBands.b1k, newBands.b4k, newBands.b12k];
      vals.forEach((v, idx) => {
        this.filterNodes[idx].gain.setTargetAtTime(v, now, 0.02);
      });
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.02);
    }
  }

  public playTone(freq: number, type: OscillatorType = 'sine', duration = 0.2, gainVol = 0.2, delaySec = 0) {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Ignore audio errors when autoplay blocked
    }
  }

  public playClick() {
    this.playTone(820, 'sine', 0.055, 0.09);
  }

  public playCorrect() {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.24); // C6
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.46);
    } catch {}
  }

  public playWrong() {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(164, now + 0.12);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch {}
  }

  public playWin() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.32, 0.18, idx * 0.1);
    });
  }

  public playPopSound() {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  public playGoldenPopSound() {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      // 1. Sub-bass golden thump
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = 'triangle';
      boom.frequency.setValueAtTime(220, now);
      boom.frequency.exponentialRampToValueAtTime(48, now + 0.32);
      boomGain.gain.setValueAtTime(0.4, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      boom.connect(boomGain);
      boomGain.connect(out);
      boom.start(now);
      boom.stop(now + 0.34);

      // 2. Royal Golden Harmonic Arpeggio (C5, E5, G5, B5, C6, E6, G6)
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98];
      notes.forEach((freq, idx) => {
        this.playTone(freq, 'sine', 0.45, 0.22, idx * 0.065);
        this.playTone(freq * 2, 'triangle', 0.25, 0.08, idx * 0.065 + 0.02);
      });
    } catch {}
  }

  public playCartoonWhooshSound() {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      const dur = 0.38;
      // Filtered noise sweep + playful sine glide
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + dur * 0.65);
      filter.frequency.exponentialRampToValueAtTime(400, now + dur);
      filter.Q.setValueAtTime(3.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.32, now + dur * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      noise.start(now);
      noise.stop(now + dur);

      // Playful slide whistle undertone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + dur * 0.8);
      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(0.14, now + dur * 0.35);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(oscGain);
      oscGain.connect(out);
      osc.start(now);
      osc.stop(now + dur);
    } catch {}
  }

  public playCartoonVocalChirp(pattern: 'up' | 'wave' = 'up') {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      if (pattern === 'up') {
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(1550, now + 0.24);
      } else {
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.linearRampToValueAtTime(1400, now + 0.12);
        osc.frequency.linearRampToValueAtTime(800, now + 0.22);
        osc.frequency.linearRampToValueAtTime(1600, now + 0.32);
      }
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.37);
    } catch {}
  }

  public playCartoonBoingSound() {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      const dur = 0.55;
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const mainGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + dur);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(24, now);
      lfoGain.gain.setValueAtTime(95, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      mainGain.gain.setValueAtTime(0.32, now);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(mainGain);
      mainGain.connect(out);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + dur);
      lfo.stop(now + dur);
    } catch {}
  }

  public playCartoonWompWompSound() {
    if (this.muted) return;
    const notes = [
      { f1: 311.13, f2: 293.66, d: 0.26, delay: 0 },
      { f1: 293.66, f2: 277.18, d: 0.26, delay: 0.28 },
      { f1: 277.18, f2: 261.63, d: 0.26, delay: 0.56 },
      { f1: 261.63, f2: 196.0, d: 0.55, delay: 0.84 },
    ];
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    notes.forEach((n) => {
      try {
        const start = ctx.currentTime + n.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.f1, start);
        osc.frequency.linearRampToValueAtTime(n.f2, start + n.d);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);
        osc.connect(gain);
        gain.connect(out);
        osc.start(start);
        osc.stop(start + n.d + 0.02);
      } catch {}
    });
  }

  public playCartoonDeflateRaspSound() {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      const dur = 0.5;
      const squeal = ctx.createOscillator();
      const squealGain = ctx.createGain();
      squeal.type = 'sawtooth';
      squeal.frequency.setValueAtTime(920, now);
      squeal.frequency.exponentialRampToValueAtTime(135, now + dur);

      const flutter = ctx.createOscillator();
      flutter.type = 'square';
      flutter.frequency.setValueAtTime(30, now);
      flutter.frequency.linearRampToValueAtTime(14, now + dur);
      flutter.connect(squealGain.gain);

      squealGain.gain.setValueAtTime(0.24, now);
      squealGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      squeal.connect(squealGain);
      squealGain.connect(out);

      flutter.start(now);
      squeal.start(now);
      flutter.stop(now + dur);
      squeal.stop(now + dur);
    } catch {}
  }

  public playCartoonQuackSound() {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      const dur = 0.28;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(290, now);
      osc1.frequency.exponentialRampToValueAtTime(170, now + dur);
      osc2.frequency.setValueAtTime(585, now);
      osc2.frequency.exponentialRampToValueAtTime(340, now + dur);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + dur);
      filter.Q.setValueAtTime(5, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.34, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(out);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur);
      osc2.stop(now + dur);
    } catch {}
  }

  public playFireworkBoom() {
    if (this.muted) return;
    const ctx = this.init();
    const out = this.getOutputNode();
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.24);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.25);

      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = 'triangle';
      boomOsc.frequency.setValueAtTime(165, now + 0.22);
      boomOsc.frequency.exponentialRampToValueAtTime(35, now + 0.72);
      boomGain.gain.setValueAtTime(0.38, now + 0.22);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
      boomOsc.connect(boomGain);
      boomGain.connect(out);
      boomOsc.start(now + 0.22);
      boomOsc.stop(now + 0.74);
    } catch {}
  }

  public playGrandFireworksFanfare() {
    if (this.muted) return;
    this.playGoldenPopSound();
    setTimeout(() => this.playFireworkBoom(), 180);
    setTimeout(() => this.playFireworkBoom(), 550);
    setTimeout(() => this.playFireworkBoom(), 950);
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    fanfare.forEach((n, i) => {
      this.playTone(n, 'triangle', 0.45, 0.24, 1.1 + i * 0.085);
    });
  }

  public playEqPresetPreviewCue(preset: EqPresetName) {
    if (this.muted) return;
    if (preset === 'retro') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.playTone(f, 'square', 0.14, 0.18, i * 0.07));
    } else if (preset === 'synthwave') {
      [220, 277.18, 329.63, 440, 659.25].forEach((f, i) => this.playTone(f, 'sawtooth', 0.24, 0.18, i * 0.08));
    } else if (preset === 'bass') {
      [65.41, 82.41, 98.0, 130.81].forEach((f, i) => this.playTone(f, 'triangle', 0.3, 0.35, i * 0.09));
    } else {
      [330, 440, 554.37, 659.25, 880].forEach((f, i) => this.playTone(f, 'sine', 0.2, 0.22, i * 0.07));
    }
  }

  public speak(text: string, pitch = 1.0, rate = 0.95) {
    if (this.muted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.pitch = pitch;
        utterance.rate = rate;
        utterance.volume = this.voiceVolume;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  }
}

export const soundEngine = new SoundEngine();
