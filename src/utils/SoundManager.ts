/**
 * Sound Manager for m3rg3r.
 * Rich Web Audio synthesis with kawaii-themed sounds and haptic feedback.
 * No external audio files needed -- all sounds are generated via oscillators + gain envelopes.
 *
 * Sounds are short (50-500ms), pleasant (no harsh frequencies), and kawaii (bright, bubbly, rounded).
 */

// --- Haptic feedback helper ---

type HapticPattern =
  | 'light'       // 10ms - generator tap, UI buttons
  | 'medium'      // 20ms - item pickup
  | 'merge'       // [15, 30, 25] burst
  | 'highMerge'   // [10, 20, 10, 20, 30] escalating
  | 'levelUp'     // [20, 40, 20, 40, 20, 60] celebration
  | 'orderComplete' // [15, 30, 15, 30, 50]
  | 'error';      // [40] single firm buzz

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  merge: [15, 30, 25],
  highMerge: [10, 20, 10, 20, 30],
  levelUp: [20, 40, 20, 40, 20, 60],
  orderComplete: [15, 30, 15, 30, 50],
  error: [40],
};

/** Fire haptic feedback if supported */
export function haptic(pattern: HapticPattern): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    }
  } catch {
    // Vibration API not available or blocked
  }
}

// --- Pentatonic note frequencies for tier-scaled merge sounds ---
// C5, D5, E5, G5, A5, C6, D6, E6, G6, A6, B6
const PENTATONIC: number[] = [
  523.25, 587.33, 659.25, 783.99, 880.00,
  1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 1975.53,
];

export class SoundManager {
  private scene: Phaser.Scene;
  private audioCtx: AudioContext | null = null;
  private _sfxEnabled = true;
  private _musicEnabled = true;
  private _volume = 0.5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Load preferences from localStorage
    const prefs = localStorage.getItem('m3rg3r_audio');
    if (prefs) {
      try {
        const p = JSON.parse(prefs);
        this._sfxEnabled = p.sfx !== false;
        this._musicEnabled = p.music !== false;
        this._volume = typeof p.volume === 'number' ? p.volume : 0.5;
      } catch { /* use defaults */ }
    }
  }

  private getCtx(): AudioContext | null {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch { return null; }
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // ---- Low-level synthesis helpers ----

  /** Play a single tone with envelope shaping */
  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    vol: number = 1,
    attackTime: number = 0.01,
    detuneVal: number = 0,
  ): void {
    if (!this._sfxEnabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterVol = this._volume * vol * 0.12;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (detuneVal) osc.detune.value = detuneVal;

    // Attack-decay envelope for click-free sound
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(masterVol, now + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  /** Play a filtered noise burst (for clicks, thuds, whooshes) */
  private playNoise(
    duration: number,
    filterFreq: number,
    filterType: BiquadFilterType,
    vol: number = 1,
    filterQ: number = 1,
  ): void {
    if (!this._sfxEnabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterVol = this._volume * vol * 0.1;
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(masterVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    source.stop(now + duration + 0.01);
  }

  /** Play a resonant tone (sine through bandpass for warm, rounded feel) */
  private playResonant(
    freq: number,
    duration: number,
    vol: number = 1,
    resonance: number = 5,
  ): void {
    if (!this._sfxEnabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterVol = this._volume * vol * 0.12;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = resonance;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(masterVol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  // ---- Game sound effects ----

  /**
   * Merge sound: ascending pentatonic chime that rises with tier.
   * T1 starts at C5-D5, scaling up through the pentatonic scale.
   * Higher tiers get an extra shimmer note.
   */
  merge(tier: number): void {
    // Pick two adjacent notes from the pentatonic scale based on tier
    const idx = Math.min((tier - 1) * 2, PENTATONIC.length - 2);
    const note1 = PENTATONIC[idx];
    const note2 = PENTATONIC[Math.min(idx + 1, PENTATONIC.length - 1)];

    this.playTone(note1, 0.15, 'sine', 0.7);
    setTimeout(() => this.playTone(note2, 0.12, 'sine', 0.5, 0.005, 5), 70);

    // Higher tiers get a third shimmer note
    if (tier >= 3) {
      const note3 = PENTATONIC[Math.min(idx + 2, PENTATONIC.length - 1)];
      setTimeout(() => this.playTone(note3, 0.18, 'sine', 0.4, 0.005, 8), 140);
    }

    // T5+ get a sparkle overlay
    if (tier >= 5) {
      setTimeout(() => {
        this.playTone(note2 * 2, 0.1, 'sine', 0.2, 0.005, 12);
      }, 180);
    }

    // Haptics scale with tier
    if (tier >= 5) {
      haptic('highMerge');
    } else {
      haptic('merge');
    }
  }

  /** Generator tap: soft "pop" with resonance */
  generatorTap(): void {
    this.playResonant(420, 0.1, 0.5, 8);
    setTimeout(() => this.playTone(630, 0.06, 'sine', 0.25, 0.005), 25);
    haptic('light');
  }

  /** Item spawn: gentle "bloop" (sine wave with quick pitch drop) */
  spawn(): void {
    if (!this._sfxEnabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const vol = this._volume * 0.08;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /** Item pickup (drag start): subtle "click" (short noise burst, high-pass) */
  pickup(): void {
    this.playNoise(0.04, 3000, 'highpass', 0.3, 0.5);
    haptic('medium');
  }

  /** Item drop: soft "thud" (low sine with quick decay) */
  drop(): void {
    this.playTone(120, 0.1, 'sine', 0.35, 0.005);
    setTimeout(() => this.playTone(80, 0.06, 'sine', 0.15, 0.005), 20);
  }

  /** Swap sound: two quick tones alternating */
  swap(): void {
    this.playTone(350, 0.06, 'sine', 0.3, 0.005);
    setTimeout(() => this.playTone(420, 0.06, 'sine', 0.3, 0.005), 50);
    haptic('light');
  }

  /** Order complete: celebratory arpeggio (major chord strum C-E-G-C) */
  complete(): void {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.6 - i * 0.08, 0.008), i * 80);
    });
    // Final shimmer
    setTimeout(() => this.playTone(1318.51, 0.3, 'sine', 0.2, 0.01, 6), 340);
    haptic('orderComplete');
  }

  /** Level up: full ascending scale with shimmer */
  levelUp(): void {
    // C5, D5, E5, G5, A5, C6 -- pentatonic ascent
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.22, 'sine', 0.55 - i * 0.05, 0.008);
        // Parallel octave shimmer for sparkle
        if (i >= 3) {
          this.playTone(freq * 2, 0.15, 'sine', 0.12, 0.005, 4);
        }
      }, i * 100);
    });
    // Final chord bloom
    setTimeout(() => {
      this.playTone(1046.50, 0.35, 'sine', 0.25, 0.01);
      this.playTone(1318.51, 0.35, 'sine', 0.2, 0.01);
      this.playTone(1567.98, 0.35, 'sine', 0.15, 0.01);
    }, 650);
    haptic('levelUp');
  }

  /** Achievement: triumphant short fanfare */
  achievement(): void {
    // Quick ascending fanfare: G5 - B5 - D6 - G6
    const notes = [783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.18, 'sine', 0.5, 0.008), i * 70);
    });
    // Triumphant final chord
    setTimeout(() => {
      this.playTone(1567.98, 0.3, 'sine', 0.3, 0.01);
      this.playTone(1174.66, 0.3, 'sine', 0.2, 0.01);
    }, 300);
    haptic('orderComplete');
  }

  /** Generator merge: deep resonant merge + level-up chime */
  generatorMerge(newTier: number): void {
    // Deep resonant foundation
    this.playResonant(200, 0.2, 0.6, 4);
    setTimeout(() => this.playResonant(300, 0.15, 0.4, 6), 80);

    // Rising chime based on tier
    const idx = Math.min(newTier * 2, PENTATONIC.length - 2);
    setTimeout(() => {
      this.playTone(PENTATONIC[idx], 0.2, 'sine', 0.5, 0.008);
      this.playTone(PENTATONIC[Math.min(idx + 1, PENTATONIC.length - 1)], 0.2, 'sine', 0.4, 0.008);
    }, 160);

    // Sparkle for high tiers
    if (newTier >= 4) {
      setTimeout(() => {
        this.playTone(PENTATONIC[PENTATONIC.length - 1], 0.15, 'sine', 0.2, 0.005, 10);
      }, 280);
    }

    if (newTier >= 4) {
      haptic('highMerge');
    } else {
      haptic('merge');
    }
  }

  /** Discovery: sparkle chime (ascending bright tones) */
  discovery(): void {
    this.playTone(880, 0.12, 'sine', 0.45, 0.005, 5);
    setTimeout(() => this.playTone(1108.73, 0.1, 'sine', 0.35, 0.005, 5), 80);
    setTimeout(() => this.playTone(1318.51, 0.15, 'sine', 0.25, 0.005, 8), 160);
    setTimeout(() => this.playTone(1760, 0.2, 'sine', 0.15, 0.005, 10), 240);
  }

  /** UI button press: light click */
  buttonPress(): void {
    this.playNoise(0.03, 4000, 'highpass', 0.15, 0.5);
    this.playTone(800, 0.03, 'sine', 0.15, 0.003);
    haptic('light');
  }

  /** Trash: "whoosh" sound (filtered noise sweep) */
  trash(): void {
    if (!this._sfxEnabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const vol = this._volume * 0.08;
    const duration = 0.2;
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(400, now + duration);
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    source.stop(now + duration + 0.01);
  }

  /** Board full: gentle "bonk" (low tone + quick noise) */
  boardFull(): void {
    this.playTone(180, 0.12, 'triangle', 0.4, 0.005);
    setTimeout(() => this.playNoise(0.04, 600, 'lowpass', 0.2, 2), 30);
    haptic('error');
  }

  /** Error/invalid: low thud (kept for backward compat) */
  error(): void {
    this.boardFull();
  }

  // ---- Settings ----

  get sfxEnabled() { return this._sfxEnabled; }
  set sfxEnabled(v: boolean) { this._sfxEnabled = v; this.savePrefs(); }

  get musicEnabled() { return this._musicEnabled; }
  set musicEnabled(v: boolean) { this._musicEnabled = v; this.savePrefs(); }

  get volume() { return this._volume; }
  set volume(v: number) { this._volume = Math.max(0, Math.min(1, v)); this.savePrefs(); }

  /** Toggle SFX on/off, returns new state */
  toggleSfx(): boolean {
    this.sfxEnabled = !this._sfxEnabled;
    return this._sfxEnabled;
  }

  /** Toggle music on/off, returns new state */
  toggleMusic(): boolean {
    this.musicEnabled = !this._musicEnabled;
    return this._musicEnabled;
  }

  private savePrefs(): void {
    localStorage.setItem('m3rg3r_audio', JSON.stringify({
      sfx: this._sfxEnabled, music: this._musicEnabled, volume: this._volume,
    }));
  }
}
