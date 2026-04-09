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

  // --- Ambient music state ---
  // PERF: Use Set for O(1) add/delete instead of array with O(n) splice
  private musicNodes: Set<OscillatorNode | GainNode> = new Set();
  private musicSchedulerId: number | null = null;
  private currentMood: string = '';
  private nextNoteTime: number = 0;
  private currentChordIndex: number = 0;
  private currentNoteInChord: number = 0;

  // --- Mood chord progressions (arpeggiated music-box style) ---
  private static readonly MOODS = {
    morning: {
      tempo: 80,
      noteLength: 2.0,
      chords: [
        [261.63, 329.63, 392.00],  // C major
        [220.00, 261.63, 329.63],  // Am
        [174.61, 261.63, 349.23],  // F
        [196.00, 246.94, 392.00],  // G
      ],
    },
    afternoon: {
      tempo: 70,
      noteLength: 2.5,
      chords: [
        [196.00, 246.94, 392.00],  // G
        [164.81, 196.00, 246.94],  // Em
        [261.63, 329.63, 392.00],  // C
        [146.83, 220.00, 293.66],  // D
      ],
    },
    evening: {
      tempo: 65,
      noteLength: 3.0,
      chords: [
        [174.61, 261.63, 349.23],  // F
        [146.83, 174.61, 220.00],  // Dm
        [116.54, 174.61, 233.08],  // Bb
        [130.81, 196.00, 261.63],  // C
      ],
    },
    night: {
      tempo: 55,
      noteLength: 3.5,
      chords: [
        [146.83, 174.61, 220.00],  // Dm
        [110.00, 130.81, 164.81],  // Am (low)
        [116.54, 146.83, 174.61],  // Bb (low)
        [98.00, 116.54, 146.83],   // Gm (low)
      ],
    },
  };

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

  /** Swap sound: quick whoosh (sine sweep 300Hz -> 200Hz) + two tones */
  swap(): void {
    this.playTone(300, 0.08, 'sine', 0.3);
    setTimeout(() => this.playTone(200, 0.06, 'sine', 0.2), 40);
    haptic('light');
  }

  /** Undo sound: descending chime (reverse of merge) */
  undo(): void {
    this.playTone(659.25, 0.12, 'sine', 0.4, 0.005);
    setTimeout(() => this.playTone(523.25, 0.15, 'sine', 0.5, 0.005), 80);
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

  /** Combo break: descending "wah" (pitch drop with quick decay) */
  comboBreak(): void {
    this.playTone(440, 0.12, 'sine', 0.3, 0.005);
    setTimeout(() => this.playTone(330, 0.1, 'sine', 0.2, 0.005), 50);
    setTimeout(() => this.playTone(220, 0.08, 'sine', 0.1, 0.005), 100);
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

  // ---- Ambient music (synthesized, no external files) ----

  /** Start the ambient music loop. Detects time-of-day mood and arpeggios through chord tones. */
  startAmbientMusic(): void {
    if (!this._musicEnabled) return;
    // Avoid double-starting
    if (this.musicSchedulerId !== null) return;
    this.startScheduler();
  }

  /** Fade out and stop all ambient music over 1.5 seconds. */
  stopAmbientMusic(): void {
    // Clear the scheduler first
    if (this.musicSchedulerId !== null) {
      window.clearInterval(this.musicSchedulerId);
      this.musicSchedulerId = null;
    }

    const ctx = this.getCtx();
    const now = ctx ? ctx.currentTime : 0;
    const fadeDuration = 1.5;

    // Fade out all tracked gain nodes
    for (const node of this.musicNodes) {
      try {
        if (node instanceof GainNode && ctx) {
          node.gain.cancelScheduledValues(now);
          node.gain.setValueAtTime(node.gain.value, now);
          node.gain.exponentialRampToValueAtTime(0.001, now + fadeDuration);
        }
      } catch {
        // Node may already be disconnected
      }
    }

    // Disconnect and clean up after fade completes
    setTimeout(() => {
      for (const node of this.musicNodes) {
        try {
          if (node instanceof OscillatorNode) {
            node.stop();
          }
          node.disconnect();
        } catch {
          // Already stopped or disconnected
        }
      }
      this.musicNodes.clear();
    }, (fadeDuration + 0.1) * 1000);
  }

  /** Check if time-of-day mood changed; if so, crossfade to the new mood. */
  checkMoodChange(): void {
    const newMood = this.getMood();
    if (newMood !== this.currentMood && this.musicSchedulerId !== null) {
      this.stopAmbientMusic();
      // Start new mood after fade completes
      setTimeout(() => {
        if (this._musicEnabled) {
          this.startAmbientMusic();
        }
      }, 1700);
    }
  }

  /** Handle page visibility changes -- stop music when hidden, restart when visible. */
  handleVisibilityChange(hidden: boolean): void {
    if (hidden) {
      this.stopAmbientMusic();
    } else if (this._musicEnabled) {
      this.startAmbientMusic();
    }
  }

  /** Schedule a single music note: sine + detuned sine for warm music-box timbre. */
  private scheduleNote(freq: number, time: number, duration: number, vol: number): void {
    const ctx = this.getCtx();
    if (!ctx || !this._musicEnabled) return;

    const masterVol = this._volume * vol * 0.03; // Very quiet -- background atmosphere

    // Main oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Detuned warmth oscillator (+3 cents)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq;
    osc2.detune.value = 3;

    // Gain envelope: soft attack, sustain, long release
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(masterVol, time + 0.08);
    gain.gain.setValueAtTime(masterVol, time + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    // Second osc slightly quieter for subtle chorus
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.001, time);
    gain2.gain.linearRampToValueAtTime(masterVol * 0.6, time + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.05);
    osc2.start(time);
    osc2.stop(time + duration + 0.05);

    // PERF: Track for cleanup using Set (O(1) add/delete)
    this.musicNodes.add(osc);
    this.musicNodes.add(osc2);
    this.musicNodes.add(gain);
    this.musicNodes.add(gain2);

    // Auto-cleanup after note finishes
    osc.onended = () => {
      this.musicNodes.delete(osc);
      this.musicNodes.delete(osc2);
      this.musicNodes.delete(gain);
      this.musicNodes.delete(gain2);
    };
  }

  /** Look-ahead scheduler: runs every 100ms, schedules notes 200ms ahead for glitch-free playback. */
  private startScheduler(): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const mood = this.getMood();
    const moodData = SoundManager.MOODS[mood as keyof typeof SoundManager.MOODS];
    this.currentMood = mood;
    this.nextNoteTime = ctx.currentTime + 0.5; // Start in 0.5s
    this.currentChordIndex = 0;
    this.currentNoteInChord = 0;

    const scheduleAhead = 0.2; // Schedule 200ms ahead

    this.musicSchedulerId = window.setInterval(() => {
      if (!ctx || !this._musicEnabled) return;

      while (this.nextNoteTime < ctx.currentTime + scheduleAhead) {
        const chord = moodData.chords[this.currentChordIndex];
        const freq = chord[this.currentNoteInChord];
        const noteLen = moodData.noteLength;

        this.scheduleNote(freq, this.nextNoteTime, noteLen, 1.0);

        // Play a very quiet bass note (root, one octave down) on the first note of each chord
        if (this.currentNoteInChord === 0) {
          this.scheduleNote(chord[0] / 2, this.nextNoteTime, noteLen * 2, 0.4);
        }

        // Advance through the arpeggio
        this.currentNoteInChord++;
        if (this.currentNoteInChord >= chord.length) {
          this.currentNoteInChord = 0;
          this.currentChordIndex = (this.currentChordIndex + 1) % moodData.chords.length;
        }

        // Time between notes (arpeggio speed derived from tempo)
        this.nextNoteTime += 60 / moodData.tempo;
      }
    }, 100);
  }

  /** Determine ambient mood from time of day. */
  private getMood(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  // ---- Settings ----

  get sfxEnabled() { return this._sfxEnabled; }
  set sfxEnabled(v: boolean) { this._sfxEnabled = v; this.savePrefs(); }

  get musicEnabled() { return this._musicEnabled; }
  set musicEnabled(v: boolean) {
    this._musicEnabled = v;
    this.savePrefs();
    if (v) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

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

// === AMBIENT MUSIC INTEGRATION GUIDE ===
// In GameScene.create(), after sound_ initialization:
//   this.sound_.startAmbientMusic();
//   this.time.addEvent({ delay: 60000, loop: true, callback: () => this.sound_.checkMoodChange() });
//   document.addEventListener('visibilitychange', () => this.sound_.handleVisibilityChange(document.hidden));
// In GameScene shutdown/destroy:
//   this.sound_.stopAmbientMusic();
