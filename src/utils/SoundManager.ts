/**
 * Sound Manager for m3rg3r.
 * Wraps Phaser audio with game-specific methods and settings persistence.
 *
 * Currently uses generated tones (Web Audio oscillators) as placeholder sounds.
 * Replace with real audio files in Phase A when sourced from Pixabay/Freesound.
 */
export class SoundManager {
  private scene: Phaser.Scene;
  private audioCtx: AudioContext | null = null;
  private _sfxEnabled = true;
  private _musicEnabled = true;
  private _volume = 0.3;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Load preferences from localStorage
    const prefs = localStorage.getItem('m3rg3r_audio');
    if (prefs) {
      try {
        const p = JSON.parse(prefs);
        this._sfxEnabled = p.sfx !== false;
        this._musicEnabled = p.music !== false;
        this._volume = p.volume ?? 0.3;
      } catch { /* use defaults */ }
    }
  }

  private getCtx(): AudioContext | null {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch { return null; }
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol: number = 1): void {
    if (!this._sfxEnabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = this._volume * vol * 0.15;

    // Quick fade out to avoid clicks
    gain.gain.setValueAtTime(this._volume * vol * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /** Merge sound — ascending chime, pitch scales with tier */
  merge(tier: number): void {
    const baseFreq = 440 + tier * 80;
    this.playTone(baseFreq, 0.15, 'sine', 0.8);
    setTimeout(() => this.playTone(baseFreq * 1.25, 0.12, 'sine', 0.6), 60);
    if (tier >= 5) {
      setTimeout(() => this.playTone(baseFreq * 1.5, 0.2, 'sine', 0.5), 120);
    }
  }

  /** Generator tap — soft pop */
  generatorTap(): void {
    this.playTone(300, 0.08, 'sine', 0.5);
    setTimeout(() => this.playTone(400, 0.06, 'sine', 0.3), 30);
  }

  /** Item spawn — whoosh */
  spawn(): void {
    this.playTone(200, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(350, 0.08, 'sine', 0.2), 40);
  }

  /** Quest/order complete — fanfare */
  complete(): void {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.7), i * 100);
    });
  }

  /** Level up — ascending arpeggio */
  levelUp(): void {
    const notes = [440, 554, 659, 880, 1109]; // A4, C#5, E5, A5, C#6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.6), i * 120);
    });
  }

  /** Discovery — sparkle chime */
  discovery(): void {
    this.playTone(880, 0.15, 'sine', 0.5);
    setTimeout(() => this.playTone(1109, 0.12, 'sine', 0.4), 80);
    setTimeout(() => this.playTone(1319, 0.2, 'sine', 0.3), 160);
  }

  /** Button press — tiny pip */
  buttonPress(): void {
    this.playTone(600, 0.04, 'sine', 0.2);
  }

  /** Error/invalid — low thud */
  error(): void {
    this.playTone(150, 0.12, 'triangle', 0.4);
  }

  // Settings
  get sfxEnabled() { return this._sfxEnabled; }
  set sfxEnabled(v: boolean) { this._sfxEnabled = v; this.savePrefs(); }

  get musicEnabled() { return this._musicEnabled; }
  set musicEnabled(v: boolean) { this._musicEnabled = v; this.savePrefs(); }

  get volume() { return this._volume; }
  set volume(v: number) { this._volume = Math.max(0, Math.min(1, v)); this.savePrefs(); }

  private savePrefs(): void {
    localStorage.setItem('m3rg3r_audio', JSON.stringify({
      sfx: this._sfxEnabled, music: this._musicEnabled, volume: this._volume,
    }));
  }
}
