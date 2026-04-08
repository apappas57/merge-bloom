import { FONT, TEXT, fs, s } from '../utils/constants';

type Mood = 'idle' | 'happy' | 'excited' | 'worried' | 'sleeping';

/**
 * Kawaii mascot — a cute flower bud character drawn with Phaser graphics.
 * Lives in the corner of the game screen and reacts to gameplay events.
 */
export class Mascot extends Phaser.GameObjects.Container {
  private bodyGfx: Phaser.GameObjects.Graphics;
  private leftEye: Phaser.GameObjects.Graphics;
  private rightEye: Phaser.GameObjects.Graphics;
  private blushL: Phaser.GameObjects.Graphics;
  private blushR: Phaser.GameObjects.Graphics;
  private mouth: Phaser.GameObjects.Graphics;
  private flower: Phaser.GameObjects.Text;
  private speechBubble: Phaser.GameObjects.Container | null = null;
  private mood: Mood = 'idle';
  private idleTimer = 0;
  private blinkTimer: Phaser.Time.TimerEvent | null = null;
  private size: number;
  private _zzzText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.size = s(16);
    const sz = this.size;

    // Body — soft pink circle with gradient feel
    this.bodyGfx = scene.add.graphics();
    // Outer glow
    this.bodyGfx.fillStyle(0xFFB8D0, 0.3);
    this.bodyGfx.fillCircle(0, 0, sz + s(2));
    // Main body
    this.bodyGfx.fillStyle(0xFCE4EC, 1);
    this.bodyGfx.fillCircle(0, 0, sz);
    this.bodyGfx.lineStyle(s(1), 0xF48FB1, 0.5);
    this.bodyGfx.strokeCircle(0, 0, sz);
    this.add(this.bodyGfx);

    // Inner highlight — glossy candy look
    const highlight = scene.add.graphics();
    highlight.fillStyle(0xFFFFFF, 0.3);
    highlight.fillEllipse(-sz * 0.15, -sz * 0.25, sz * 0.7, sz * 0.45);
    this.add(highlight);

    // Cat-like ears for extra kawaii (two small triangles)
    const ears = scene.add.graphics();
    ears.fillStyle(0xFCE4EC, 1);
    // Left ear
    ears.beginPath();
    ears.moveTo(-sz * 0.6, -sz * 0.4);
    ears.lineTo(-sz * 0.25, -sz * 0.95);
    ears.lineTo(-sz * 0.05, -sz * 0.45);
    ears.closePath();
    ears.fill();
    // Left ear inner
    ears.fillStyle(0xF8BBD0, 0.8);
    ears.beginPath();
    ears.moveTo(-sz * 0.5, -sz * 0.5);
    ears.lineTo(-sz * 0.28, -sz * 0.82);
    ears.lineTo(-sz * 0.15, -sz * 0.52);
    ears.closePath();
    ears.fill();
    // Right ear
    ears.fillStyle(0xFCE4EC, 1);
    ears.beginPath();
    ears.moveTo(sz * 0.6, -sz * 0.4);
    ears.lineTo(sz * 0.25, -sz * 0.95);
    ears.lineTo(sz * 0.05, -sz * 0.45);
    ears.closePath();
    ears.fill();
    // Right ear inner
    ears.fillStyle(0xF8BBD0, 0.8);
    ears.beginPath();
    ears.moveTo(sz * 0.5, -sz * 0.5);
    ears.lineTo(sz * 0.28, -sz * 0.82);
    ears.lineTo(sz * 0.15, -sz * 0.52);
    ears.closePath();
    ears.fill();
    ears.lineStyle(s(0.5), 0xF48FB1, 0.4);
    ears.beginPath();
    ears.moveTo(-sz * 0.6, -sz * 0.4);
    ears.lineTo(-sz * 0.25, -sz * 0.95);
    ears.lineTo(-sz * 0.05, -sz * 0.45);
    ears.moveTo(sz * 0.6, -sz * 0.4);
    ears.lineTo(sz * 0.25, -sz * 0.95);
    ears.lineTo(sz * 0.05, -sz * 0.45);
    ears.strokePath();
    this.add(ears);

    // Eyes — bigger relative to body for maximum cute
    this.leftEye = scene.add.graphics();
    this.leftEye.fillStyle(0x3D2B1F, 1);
    this.leftEye.fillCircle(-sz * 0.28, -sz * 0.08, sz * 0.15);
    this.leftEye.fillStyle(0xFFFFFF, 1);
    this.leftEye.fillCircle(-sz * 0.23, -sz * 0.15, sz * 0.06);
    this.add(this.leftEye);

    this.rightEye = scene.add.graphics();
    this.rightEye.fillStyle(0x3D2B1F, 1);
    this.rightEye.fillCircle(sz * 0.28, -sz * 0.08, sz * 0.15);
    this.rightEye.fillStyle(0xFFFFFF, 1);
    this.rightEye.fillCircle(sz * 0.33, -sz * 0.15, sz * 0.06);
    this.add(this.rightEye);

    // Blush marks
    this.blushL = scene.add.graphics();
    this.blushL.fillStyle(0xF06292, 0.3);
    this.blushL.fillEllipse(-sz * 0.48, sz * 0.15, sz * 0.2, sz * 0.12);
    this.add(this.blushL);

    this.blushR = scene.add.graphics();
    this.blushR.fillStyle(0xF06292, 0.3);
    this.blushR.fillEllipse(sz * 0.48, sz * 0.15, sz * 0.2, sz * 0.12);
    this.add(this.blushR);

    // Mouth
    this.mouth = scene.add.graphics();
    this.drawMouth('smile');
    this.add(this.mouth);

    // Flower on ear (canvas-drawn cherry blossom)
    const flowerGfx = scene.add.graphics();
    const flX = sz * 0.45, flY = -sz * 0.75, flR = sz * 0.22;
    flowerGfx.fillStyle(0xF8BBD0, 0.9);
    for (let pi = 0; pi < 5; pi++) {
      const pa = (pi / 5) * Math.PI * 2 - Math.PI / 2;
      flowerGfx.fillEllipse(
        flX + Math.cos(pa) * flR * 0.4,
        flY + Math.sin(pa) * flR * 0.4,
        flR * 0.45, flR * 0.3
      );
    }
    flowerGfx.fillStyle(0xFFD54F, 1);
    flowerGfx.fillCircle(flX, flY, flR * 0.15);
    this.flower = scene.add.text(0, 0, '', { fontSize: fs(1) }).setAlpha(0); // kept for tween compat
    this.add(flowerGfx);
    this.add(this.flower);

    this.setDepth(50);
    scene.add.existing(this);

    // Start idle animation
    this.startIdleAnimation();
    this.startBlinking();

    // Listen for game events
    scene.events.on('item-dropped', () => this.react('happy'));
    scene.events.on('generator-tapped', () => this.react('happy'));
  }

  private drawMouth(type: 'smile' | 'open' | 'worried' | 'sleep'): void {
    this.mouth.clear();
    const sz = this.size;

    if (type === 'smile') {
      this.mouth.lineStyle(s(1.5), 0x5C5470, 0.7);
      this.mouth.beginPath();
      this.mouth.arc(0, sz * 0.15, sz * 0.12, 0.2, Math.PI - 0.2, false);
      this.mouth.strokePath();
    } else if (type === 'open') {
      this.mouth.fillStyle(0x5C5470, 0.7);
      this.mouth.fillEllipse(0, sz * 0.2, sz * 0.15, sz * 0.12);
    } else if (type === 'worried') {
      this.mouth.lineStyle(s(1.5), 0x5C5470, 0.5);
      this.mouth.beginPath();
      this.mouth.arc(0, sz * 0.3, sz * 0.1, Math.PI + 0.3, -0.3, false);
      this.mouth.strokePath();
    } else if (type === 'sleep') {
      this.mouth.lineStyle(s(1.5), 0x5C5470, 0.4);
      this.mouth.beginPath();
      this.mouth.moveTo(-sz * 0.08, sz * 0.2);
      this.mouth.lineTo(sz * 0.08, sz * 0.2);
      this.mouth.strokePath();
    }
  }

  private startIdleAnimation(): void {
    // Gentle bobbing (subtler for smaller size)
    this.scene.tweens.add({
      targets: this,
      y: this.y - s(2),
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Flower sway
    this.scene.tweens.add({
      targets: this.flower,
      angle: 6,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private startBlinking(): void {
    this.blinkTimer = this.scene.time.addEvent({
      delay: Phaser.Math.Between(3000, 6000),
      loop: true,
      callback: () => {
        if (this.mood === 'sleeping') return;
        // Close eyes briefly
        this.leftEye.setScale(1, 0.1);
        this.rightEye.setScale(1, 0.1);
        this.scene.time.delayedCall(120, () => {
          this.leftEye.setScale(1, 1);
          this.rightEye.setScale(1, 1);
        });
      }
    });
  }

  react(mood: 'happy' | 'excited' | 'worried'): void {
    this.mood = mood;
    this.idleTimer = 0;

    if (mood === 'happy') {
      this.drawMouth('smile');
      this.scene.tweens.add({
        targets: this, scaleX: 1.15, scaleY: 0.9, duration: 100,
        yoyo: true, repeat: 1, ease: 'Bounce.easeOut',
      });
    } else if (mood === 'excited') {
      this.drawMouth('open');
      // Jump!
      this.scene.tweens.add({
        targets: this, y: this.y - s(15), duration: 200,
        yoyo: true, ease: 'Power2',
      });
      // Spawn canvas-drawn hearts
      for (let i = 0; i < 3; i++) {
        const hg = this.scene.add.graphics().setDepth(51);
        const hx = this.x + Phaser.Math.Between(-s(20), s(20));
        const hy = this.y - s(20);
        const hr = s(5);
        hg.setPosition(hx, hy);
        hg.fillStyle(0xFF6B9D, 0.9);
        // Heart shape using two circles + triangle (Phaser-compatible)
        hg.fillCircle(-hr * 0.3, -hr * 0.15, hr * 0.45);
        hg.fillCircle(hr * 0.3, -hr * 0.15, hr * 0.45);
        hg.fillTriangle(-hr * 0.65, 0, hr * 0.65, 0, 0, hr * 0.7);
        this.scene.tweens.add({
          targets: hg, y: hy - s(30), alpha: 0,
          duration: 800, delay: i * 150,
          onComplete: () => hg.destroy(),
        });
      }
    } else if (mood === 'worried') {
      this.drawMouth('worried');
    }

    // Return to idle after a moment
    this.scene.time.delayedCall(2000, () => {
      if (this.mood !== 'sleeping') {
        this.mood = 'idle';
        this.drawMouth('smile');
      }
    });
  }

  reactToMerge(tier: number): void {
    if (tier >= 5) {
      this.react('excited');
    } else {
      this.react('happy');
    }
  }

  showSpeech(text: string, duration: number = 3000): void {
    if (this.speechBubble) {
      this.speechBubble.destroy();
    }

    const bubble = this.scene.add.container(this.x + s(25), this.y + s(20));
    bubble.setDepth(52);

    const txt = this.scene.add.text(0, 0, text, {
      fontSize: fs(10), color: TEXT.PRIMARY, fontFamily: FONT,
      wordWrap: { width: s(120) }, align: 'center',
      backgroundColor: 'rgba(255,248,240,0.95)',
      padding: { x: s(8), y: s(6) },
    }).setOrigin(0, 0.5);

    bubble.add(txt);
    this.speechBubble = bubble;

    // Fade in
    bubble.setAlpha(0);
    this.scene.tweens.add({ targets: bubble, alpha: 1, duration: 200 });

    // Fade out after duration
    this.scene.time.delayedCall(duration, () => {
      if (this.speechBubble === bubble) {
        this.scene.tweens.add({
          targets: bubble, alpha: 0, duration: 300,
          onComplete: () => { bubble.destroy(); this.speechBubble = null; },
        });
      }
    });
  }

  goToSleep(): void {
    if (this.mood === 'sleeping') return;
    this.mood = 'sleeping';
    this.drawMouth('sleep');
    this.leftEye.setScale(1, 0.1);
    this.rightEye.setScale(1, 0.1);

    // Zzz — canvas-drawn, add to THIS container so it moves with the mascot
    const sz = this.size;
    const zzz = this.scene.add.text(sz * 0.7, -sz * 0.6, 'z', {
      fontSize: fs(10), color: '#B07A9E', fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5).setAlpha(0);
    this.add(zzz);
    this.scene.tweens.add({
      targets: zzz, alpha: 0.7, y: -sz * 0.9,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this._zzzText = zzz;
  }

  wakeUp(): void {
    if (this.mood !== 'sleeping') return;
    this.mood = 'idle';
    this.drawMouth('smile');
    this.leftEye.setScale(1, 1);
    this.rightEye.setScale(1, 1);

    if (this._zzzText) {
      this.scene.tweens.killTweensOf(this._zzzText);
      this._zzzText.destroy();
      this._zzzText = null;
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.blinkTimer) this.blinkTimer.destroy();
    if (this.speechBubble) this.speechBubble.destroy();
    super.destroy(fromScene);
  }
}
