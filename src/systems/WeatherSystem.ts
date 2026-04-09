import { s, SIZES } from '../utils/constants';

/**
 * Ambient weather particle system based on real-world season and time of day.
 * Uses Melbourne (Southern Hemisphere) seasons.
 * All particles are subtle (alpha <= 0.30) and sit at depth 0 behind game items.
 * Max 20 particles at any time. Particles are recycled, never created/destroyed mid-cycle.
 */
export class WeatherSystem {
  private scene: Phaser.Scene;
  private particles: Phaser.GameObjects.Graphics[] = [];
  private tweenRefs: Phaser.Tweens.Tween[] = [];
  private checkTimer: Phaser.Time.TimerEvent | null = null;
  private currentSeason: string = '';
  private isNight: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  start(): void {
    this.currentSeason = this.getSeason();
    this.isNight = this.getIsNight();
    this.createParticles();
    // Check for season/time changes every 60s
    this.checkTimer = this.scene.time.addEvent({
      delay: 60000,
      loop: true,
      callback: () => this.refresh(),
    });
  }

  refresh(): void {
    const newSeason = this.getSeason();
    const newNight = this.getIsNight();
    if (newSeason !== this.currentSeason || newNight !== this.isNight) {
      this.destroyParticles();
      this.currentSeason = newSeason;
      this.isNight = newNight;
      this.createParticles();
    }
  }

  destroy(): void {
    this.destroyParticles();
    if (this.checkTimer) {
      this.checkTimer.destroy();
      this.checkTimer = null;
    }
  }

  private destroyParticles(): void {
    this.tweenRefs.forEach((t) => t.remove());
    this.tweenRefs = [];
    this.particles.forEach((p) => p.destroy());
    this.particles = [];
  }

  /** Southern Hemisphere (Melbourne) seasons */
  private getSeason(): string {
    const m = new Date().getMonth();
    if (m >= 8 && m <= 10) return 'spring';
    if (m >= 11 || m <= 1) return 'summer';
    if (m >= 2 && m <= 4) return 'autumn';
    return 'winter';
  }

  private getIsNight(): boolean {
    const h = new Date().getHours();
    return h >= 21 || h < 6;
  }

  private createParticles(): void {
    const { width, height } = this.scene.scale;
    const top = SIZES.TOP_BAR;
    const bottom = height - SIZES.BOTTOM_BAR;

    switch (this.currentSeason) {
      case 'spring':
        this.createPetals(width, top, bottom);
        break;
      case 'summer':
        this.createDustMotes(width, top, bottom);
        break;
      case 'autumn':
        this.createLeaves(width, top, bottom);
        break;
      case 'winter':
        this.createSnowflakes(width, top, bottom);
        break;
    }

    if (this.isNight) {
      this.createFireflies(width, top, bottom);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────

  private randRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private pickColor(colors: number[]): number {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private makeGraphics(): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setDepth(0);
    this.particles.push(g);
    return g;
  }

  // ─── Falling particle animation (shared by spring, autumn, winter) ────

  private animateFalling(
    g: Phaser.GameObjects.Graphics,
    width: number,
    top: number,
    bottom: number,
    durationMin: number,
    durationMax: number,
    baseAlpha: number,
  ): void {
    const startX = Math.random() * width;
    const startY = top - s(10);
    g.setPosition(startX, startY);
    g.setAlpha(baseAlpha);

    const duration = this.randRange(durationMin, durationMax);
    const drift = (Math.random() - 0.5) * width * 0.3;

    const tween = this.scene.tweens.add({
      targets: g,
      y: bottom + s(10),
      x: startX + drift,
      alpha: 0,
      rotation: Math.random() * Math.PI * 2,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Recycle: reset to top and restart
        g.setPosition(Math.random() * width, top - s(10));
        g.setAlpha(baseAlpha);
        g.setRotation(0);
        this.animateFalling(g, width, top, bottom, durationMin, durationMax, baseAlpha);
      },
    });
    this.tweenRefs.push(tween);
  }

  // ─── Spring: Cherry Blossom Petals ────────────────────────

  private createPetals(width: number, top: number, bottom: number): void {
    const colors = [0xffb7c5, 0xffc0cb, 0xff9eba, 0xfad0d8];
    const count = this.isNight ? 6 : this.randRange(8, 10) | 0;

    for (let i = 0; i < count; i++) {
      const g = this.makeGraphics();
      const color = this.pickColor(colors);
      const size = this.randRange(s(3), s(6));

      // Draw petal: a rotated ellipse
      g.fillStyle(color, 1);
      g.fillEllipse(0, 0, size, size * 0.6);

      const alpha = this.isNight
        ? this.randRange(0.06, 0.10)
        : this.randRange(0.12, 0.22);

      this.animateFalling(g, width, top, bottom, 8000, 14000, alpha);
    }
  }

  // ─── Summer: Golden Dust Motes ────────────────────────────

  private createDustMotes(width: number, top: number, bottom: number): void {
    const colors = [0xffd700, 0xfff5c0, 0xffe082, 0xffecb3];
    const count = this.randRange(10, 14) | 0;

    for (let i = 0; i < count; i++) {
      const g = this.makeGraphics();
      const color = this.pickColor(colors);
      const radius = this.randRange(s(2), s(4));

      g.fillStyle(color, 1);
      g.fillCircle(0, 0, radius);

      const alpha = this.randRange(0.10, 0.18);
      const startX = Math.random() * width;
      const startY = this.randRange(top, bottom);
      g.setPosition(startX, startY);
      g.setAlpha(alpha);
      g.setDepth(0);

      this.animateFloatingUp(g, width, top, bottom, alpha);
    }
  }

  /** Dust motes float upward with gentle horizontal drift */
  private animateFloatingUp(
    g: Phaser.GameObjects.Graphics,
    width: number,
    top: number,
    bottom: number,
    baseAlpha: number,
  ): void {
    const duration = this.randRange(6000, 10000);
    const drift = (Math.random() - 0.5) * width * 0.15;
    const startX = g.x;

    const tween = this.scene.tweens.add({
      targets: g,
      y: top - s(10),
      x: startX + drift,
      alpha: 0,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Recycle: reset to random position near bottom
        g.setPosition(Math.random() * width, this.randRange(bottom * 0.6, bottom));
        g.setAlpha(baseAlpha);
        this.animateFloatingUp(g, width, top, bottom, baseAlpha);
      },
    });
    this.tweenRefs.push(tween);
  }

  // ─── Autumn: Falling Leaves ───────────────────────────────

  private createLeaves(width: number, top: number, bottom: number): void {
    const colors = [0xff8c00, 0xcc5500, 0xffb347, 0xdc143c, 0x8b4513];
    const count = this.randRange(6, 8) | 0;

    for (let i = 0; i < count; i++) {
      const g = this.makeGraphics();
      const color = this.pickColor(colors);
      const size = this.randRange(s(4), s(7));

      // Draw leaf: a slightly tilted ellipse
      g.fillStyle(color, 1);
      g.fillEllipse(0, 0, size, size * 0.5);

      // Give initial slight tilt
      g.setRotation(this.randRange(-0.3, 0.3));

      const alpha = this.randRange(0.12, 0.20);
      this.animateFalling(g, width, top, bottom, 10000, 16000, alpha);
    }
  }

  // ─── Winter: Snowflakes ───────────────────────────────────

  private createSnowflakes(width: number, top: number, bottom: number): void {
    const colors = [0xffffff, 0xe8f4fd, 0xd6ebf5, 0xcce5ff];
    const count = this.randRange(12, 16) | 0;

    for (let i = 0; i < count; i++) {
      const g = this.makeGraphics();
      const color = this.pickColor(colors);
      const radius = this.randRange(s(2), s(4));

      g.fillStyle(color, 1);
      g.fillCircle(0, 0, radius);

      const alpha = this.randRange(0.15, 0.25);
      this.animateFalling(g, width, top, bottom, 12000, 18000, alpha);
    }
  }

  // ─── Night: Fireflies (overlay on any season) ────────────

  private createFireflies(width: number, top: number, bottom: number): void {
    // Respect 20-particle cap: only add fireflies if headroom exists
    const headroom = 20 - this.particles.length;
    const desired = this.randRange(5, 7) | 0;
    const count = Math.min(desired, headroom);
    if (count <= 0) return;

    for (let i = 0; i < count; i++) {
      const g = this.makeGraphics();
      const dotRadius = this.randRange(s(2), s(3));
      const glowRadius = this.randRange(s(5), s(8));

      // Draw glow circle behind, then bright dot on top
      g.fillStyle(0xffff88, 0.3);
      g.fillCircle(0, 0, glowRadius);
      g.fillStyle(0xffff88, 1);
      g.fillCircle(0, 0, dotRadius);

      const startX = this.randRange(width * 0.1, width * 0.9);
      const startY = this.randRange(top + (bottom - top) * 0.2, bottom - (bottom - top) * 0.2);
      g.setPosition(startX, startY);
      g.setAlpha(0);
      g.setDepth(0);

      this.animateFirefly(g, width, top, bottom);
    }
  }

  /** Firefly: blink alpha in and out, with very slow random drift */
  private animateFirefly(
    g: Phaser.GameObjects.Graphics,
    width: number,
    top: number,
    bottom: number,
  ): void {
    const blinkDuration = this.randRange(2000, 3000);
    const driftX = (Math.random() - 0.5) * s(40);
    const driftY = (Math.random() - 0.5) * s(30);
    const cycleDuration = this.randRange(5000, 8000);

    // Blink in
    const fadeIn = this.scene.tweens.add({
      targets: g,
      alpha: 0.20,
      duration: blinkDuration / 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Blink out
        const fadeOut = this.scene.tweens.add({
          targets: g,
          alpha: 0,
          duration: blinkDuration / 2,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            // After full blink cycle, restart
            this.animateFirefly(g, width, top, bottom);
          },
        });
        this.tweenRefs.push(fadeOut);
      },
    });
    this.tweenRefs.push(fadeIn);

    // Slow random drift (independent of blink)
    const clampedX = Math.max(0, Math.min(width, g.x + driftX));
    const clampedY = Math.max(top, Math.min(bottom, g.y + driftY));

    const drift = this.scene.tweens.add({
      targets: g,
      x: clampedX,
      y: clampedY,
      duration: cycleDuration,
      ease: 'Sine.easeInOut',
    });
    this.tweenRefs.push(drift);
  }
}

// === WEATHER SYSTEM INTEGRATION ===
// In GameScene.create():
//   this.weatherSystem = new WeatherSystem(this);
//   this.weatherSystem.start();
// In GameScene destroy/shutdown:
//   this.weatherSystem.destroy();
