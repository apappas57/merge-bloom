import { COLORS, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';

const TAGLINES = [
  'A cozy garden merge game',
  'Bloom something beautiful',
  'Merge, grow, relax',
  'Your pocket garden awaits',
  'Where flowers meet friends',
  'Tap, merge, smile',
  'Grow your happy place',
  'A sprinkle of calm',
];

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;

    // === LAYERED BACKGROUND ===
    // Base gradient (warm pink to soft lavender)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xFFF5F8, 0xFFF5F8, 0xF8E0F0, 0xE8D5F5, 1);
    bg.fillRect(0, 0, width, height);

    // Soft radial glow in center (candy feel)
    const glow = this.add.graphics().setDepth(1);
    glow.fillStyle(0xFFD6E8, 0.25);
    glow.fillCircle(width / 2, height * 0.35, width * 0.6);
    glow.fillStyle(0xFFE4EC, 0.15);
    glow.fillCircle(width / 2, height * 0.35, width * 0.4);

    // === DECORATIVE FRAME ===
    // Outer scalloped border feel with rounded bumps along edges
    this.drawScallopBorder(width, height);

    // === FLOATING DECORATIONS (3 parallax layers, canvas-drawn shapes) ===
    const shapeColors = [0xFFB8D0, 0xFF6B9D, 0xD4A5FF, 0x87CEEB, 0xE8A4C8, 0xFFD93D, 0xA8E6CF, 0xF48FB1];
    const shapeTypes = ['star', 'heart', 'circle', 'diamond', 'blossom'] as const;

    const layers = [
      { count: 5, minSize: 5, maxSize: 10, alpha: 0.08, speedMult: 0.4, depthBase: 2 },
      { count: 7, minSize: 3, maxSize: 7, alpha: 0.15, speedMult: 0.8, depthBase: 3 },
      { count: 4, minSize: 2, maxSize: 5, alpha: 0.22, speedMult: 1.4, depthBase: 4 },
    ];

    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        const x = Phaser.Math.Between(s(20), width - s(20));
        const y = Phaser.Math.Between(s(40), height - s(40));
        const r = s(Phaser.Math.Between(layer.minSize, layer.maxSize));
        const color = shapeColors[Phaser.Math.Between(0, shapeColors.length - 1)];
        const shape = shapeTypes[Phaser.Math.Between(0, shapeTypes.length - 1)];
        const g = this.add.graphics().setPosition(x, y).setAlpha(layer.alpha).setDepth(layer.depthBase);
        this.drawMenuShape(g, 0, 0, r, color, shape);

        const baseDuration = Phaser.Math.Between(3000, 5000);
        const duration = Math.round(baseDuration / layer.speedMult);
        const drift = s(Phaser.Math.Between(10, 25)) * layer.speedMult;

        this.tweens.add({
          targets: g, y: y - drift,
          duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          delay: Phaser.Math.Between(0, 2000),
        });
        this.tweens.add({
          targets: g, x: x + s(Phaser.Math.Between(-6, 6)) * layer.speedMult,
          duration: duration * 1.3,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          delay: Phaser.Math.Between(0, 1500),
        });
      }
    }

    // === MASCOT CHARACTER (larger, centered on menu) ===
    this.drawMenuMascot(width / 2, height * 0.22);

    // === TITLE with glossy candy style ===
    // Title shadow (depth layer)
    this.add.text(width / 2 + s(1), height * 0.37 + s(3), 'm3rg3r', {
      fontSize: fs(42), color: '#D4A0B8', fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5).setDepth(9);

    const title = this.add.text(width / 2, height * 0.37, 'm3rg3r', {
      fontSize: fs(42), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
      shadow: { offsetX: 0, offsetY: s(1), color: 'rgba(255,255,255,0.6)', blur: 0, fill: true }
    }).setOrigin(0.5).setDepth(10);

    // Subtle title shimmer
    this.tweens.add({
      targets: title, alpha: 0.85, duration: 2000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // === TAGLINE ===
    const tagline = TAGLINES[Phaser.Math.Between(0, TAGLINES.length - 1)];
    const subtitle = this.add.text(width / 2, height * 0.43, tagline, {
      fontSize: fs(13), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 0.8, duration: 800, delay: 400 });

    // Version
    this.add.text(width / 2, height * 0.465, 'v1.0', {
      fontSize: fs(9), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5).setAlpha(0.3).setDepth(10);

    // === PLAY BUTTON (glossy candy pill) ===
    this.createPlayButton(width, height);

    // === SECONDARY BUTTONS (Collection, Settings) ===
    const secBtnY = height * 0.68;
    const secBtns = [
      { label: 'Collection', scene: 'CollectionScene', x: width / 2 - s(70) },
      { label: 'Settings', scene: 'SettingsScene', x: width / 2 + s(70) },
    ];
    for (const btn of secBtns) {
      const bg2 = this.add.graphics().setDepth(10);
      bg2.fillStyle(0xFFFFFF, 0.6);
      bg2.fillRoundedRect(btn.x - s(55), secBtnY, s(110), s(32), s(16));
      bg2.lineStyle(s(1), COLORS.CELL_BORDER, 0.3);
      bg2.strokeRoundedRect(btn.x - s(55), secBtnY, s(110), s(32), s(16));

      this.add.text(btn.x, secBtnY + s(16), btn.label, {
        fontSize: fs(10), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
      }).setOrigin(0.5).setDepth(10);

      const zone = this.add.zone(btn.x, secBtnY + s(16), s(110), s(32)).setInteractive().setDepth(10);
      zone.on('pointerdown', () => {
        if (!this.scene.isActive(btn.scene)) this.scene.launch(btn.scene);
      });
    }

    // === DECORATIVE BOW at top (canvas-drawn) ===
    const bowG = this.add.graphics().setDepth(5).setAlpha(0.4);
    this.drawBow(bowG, width / 2, s(50), s(12));

    // === FOOTER ===
    this.add.text(width / 2, height - s(35), 'for allie aka m3rg3r xx', {
      fontSize: fs(13), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5).setAlpha(0.6).setDepth(10);

    this.cameras.main.fadeIn(600, 255, 240, 245);
  }

  private drawScallopBorder(width: number, height: number): void {
    const border = this.add.graphics().setDepth(1);
    const margin = s(8);
    const scR = s(6);

    // Top edge scallops
    border.fillStyle(0xFFB8D0, 0.12);
    for (let x = margin + scR; x < width - margin; x += scR * 2.5) {
      border.fillCircle(x, margin + scR, scR);
    }
    // Bottom edge
    for (let x = margin + scR; x < width - margin; x += scR * 2.5) {
      border.fillCircle(x, height - margin - scR, scR);
    }
    // Left edge
    for (let y = margin + scR * 3; y < height - margin - scR * 2; y += scR * 2.5) {
      border.fillCircle(margin + scR, y, scR);
    }
    // Right edge
    for (let y = margin + scR * 3; y < height - margin - scR * 2; y += scR * 2.5) {
      border.fillCircle(width - margin - scR, y, scR);
    }
  }

  private drawMenuMascot(cx: number, cy: number): void {
    const sz = s(32);
    const g = this.add.graphics().setDepth(10);

    // Outer glow
    g.fillStyle(0xFFB8D0, 0.2);
    g.fillCircle(cx, cy, sz + s(6));

    // Main body
    g.fillStyle(0xFCE4EC, 1);
    g.fillCircle(cx, cy, sz);

    // Glossy highlight
    g.fillStyle(0xFFFFFF, 0.35);
    g.fillEllipse(cx - sz * 0.1, cy - sz * 0.2, sz * 0.8, sz * 0.5);

    // Border
    g.lineStyle(s(1.5), 0xF48FB1, 0.5);
    g.strokeCircle(cx, cy, sz);

    // Cat ears
    g.fillStyle(0xFCE4EC, 1);
    g.beginPath();
    g.moveTo(cx - sz * 0.65, cy - sz * 0.35);
    g.lineTo(cx - sz * 0.3, cy - sz * 1.0);
    g.lineTo(cx - sz * 0.05, cy - sz * 0.4);
    g.closePath();
    g.fill();
    g.fillStyle(0xF8BBD0, 0.7);
    g.beginPath();
    g.moveTo(cx - sz * 0.55, cy - sz * 0.45);
    g.lineTo(cx - sz * 0.32, cy - sz * 0.85);
    g.lineTo(cx - sz * 0.15, cy - sz * 0.48);
    g.closePath();
    g.fill();

    g.fillStyle(0xFCE4EC, 1);
    g.beginPath();
    g.moveTo(cx + sz * 0.65, cy - sz * 0.35);
    g.lineTo(cx + sz * 0.3, cy - sz * 1.0);
    g.lineTo(cx + sz * 0.05, cy - sz * 0.4);
    g.closePath();
    g.fill();
    g.fillStyle(0xF8BBD0, 0.7);
    g.beginPath();
    g.moveTo(cx + sz * 0.55, cy - sz * 0.45);
    g.lineTo(cx + sz * 0.32, cy - sz * 0.85);
    g.lineTo(cx + sz * 0.15, cy - sz * 0.48);
    g.closePath();
    g.fill();

    // Eyes (big, shiny)
    [-1, 1].forEach(dir => {
      const ex = cx + dir * sz * 0.28;
      const ey = cy - sz * 0.05;
      g.fillStyle(0x3D2B1F, 1);
      g.fillCircle(ex, ey, sz * 0.16);
      g.fillStyle(0xFFFFFF, 1);
      g.fillCircle(ex - sz * 0.04, ey - sz * 0.08, sz * 0.07);
      g.fillStyle(0xFFFFFF, 0.5);
      g.fillCircle(ex + sz * 0.06, ey + sz * 0.04, sz * 0.03);
    });

    // Blush
    g.fillStyle(0xF06292, 0.25);
    g.fillEllipse(cx - sz * 0.48, cy + sz * 0.18, sz * 0.22, sz * 0.12);
    g.fillEllipse(cx + sz * 0.48, cy + sz * 0.18, sz * 0.22, sz * 0.12);

    // Smile
    g.lineStyle(s(1.5), 0x5C3D2E, 0.6);
    g.beginPath();
    g.arc(cx, cy + sz * 0.2, sz * 0.12, 0.15, Math.PI - 0.15, false);
    g.strokePath();

    // Flower accessory (canvas-drawn cherry blossom)
    const flowerG = this.add.graphics().setDepth(11);
    const fx = cx + sz * 0.55, fy = cy - sz * 0.8, fr = s(5);
    flowerG.fillStyle(0xF8BBD0, 0.9);
    for (let pi = 0; pi < 5; pi++) {
      const pa = (pi / 5) * Math.PI * 2 - Math.PI / 2;
      flowerG.fillEllipse(fx + Math.cos(pa) * fr * 0.4, fy + Math.sin(pa) * fr * 0.4, fr * 0.5, fr * 0.35);
    }
    flowerG.fillStyle(0xFFD54F, 1);
    flowerG.fillCircle(fx, fy, fr * 0.15);

    // Gentle bob
    this.tweens.add({
      targets: g, y: g.y - s(3), duration: 2000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  private drawMenuShape(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number, shape: string): void {
    g.fillStyle(color, 1);
    switch (shape) {
      case 'star':
        g.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const rad = i % 2 === 0 ? r : r * 0.4;
          if (i === 0) g.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
          else g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
        g.closePath(); g.fillPath();
        break;
      case 'heart':
        // Heart using two circles + triangle (Phaser-compatible)
        g.fillCircle(cx - r * 0.3, cy - r * 0.15, r * 0.45);
        g.fillCircle(cx + r * 0.3, cy - r * 0.15, r * 0.45);
        g.fillTriangle(cx - r * 0.65, cy, cx + r * 0.65, cy, cx, cy + r * 0.7);
        break;
      case 'circle':
        g.fillCircle(cx, cy, r * 0.6);
        g.fillStyle(0xFFFFFF, 0.3);
        g.fillCircle(cx - r * 0.15, cy - r * 0.15, r * 0.2);
        break;
      case 'diamond':
        g.beginPath();
        g.moveTo(cx, cy - r); g.lineTo(cx + r * 0.6, cy);
        g.lineTo(cx, cy + r); g.lineTo(cx - r * 0.6, cy);
        g.closePath(); g.fillPath();
        break;
      case 'blossom':
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          g.fillEllipse(cx + Math.cos(a) * r * 0.35, cy + Math.sin(a) * r * 0.35, r * 0.4, r * 0.25);
        }
        g.fillStyle(0xFFD54F, 1);
        g.fillCircle(cx, cy, r * 0.12);
        break;
    }
  }

  private drawBow(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number): void {
    g.fillStyle(0xEC407A, 1);
    // Left loop (ellipse via fillEllipse)
    g.fillEllipse(cx - r * 0.8, cy, r * 1.4, r);
    // Right loop
    g.fillEllipse(cx + r * 0.8, cy, r * 1.4, r);
    // Center knot
    g.fillStyle(0xD81B60, 1);
    g.fillCircle(cx, cy, r * 0.25);
  }

  private createPlayButton(width: number, height: number): void {
    const btnW = s(200), btnH = s(56);
    const btnX = width / 2 - btnW / 2;
    const btnY = height * 0.54;

    // Deep shadow
    const shadow = this.add.graphics().setDepth(10);
    shadow.fillStyle(0xAD1457, 0.2);
    shadow.fillRoundedRect(btnX + s(2), btnY + s(5), btnW, btnH, btnH / 2);

    // Pulsing glow
    const glowG = this.add.graphics().setDepth(10);
    glowG.fillStyle(0xEC407A, 0.2);
    glowG.fillRoundedRect(btnX - s(5), btnY - s(5), btnW + s(10), btnH + s(10), (btnH + s(10)) / 2);
    this.tweens.add({
      targets: glowG, alpha: 0.35, scaleX: 1.02, scaleY: 1.02,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Button body (gradient via two layers)
    const btnBg = this.add.graphics().setDepth(10);
    btnBg.fillStyle(0xEC407A, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, btnH / 2);

    // Top glossy highlight (candy effect)
    const btnShine = this.add.graphics().setDepth(10);
    btnShine.fillStyle(0xFFFFFF, 0.2);
    btnShine.fillRoundedRect(btnX + s(8), btnY + s(3), btnW - s(16), btnH * 0.4, { tl: s(20), tr: s(20), bl: s(8), br: s(8) });

    // Bottom subtle dark edge
    const btnEdge = this.add.graphics().setDepth(10);
    btnEdge.fillStyle(0xC2185B, 0.3);
    btnEdge.fillRoundedRect(btnX + s(4), btnY + btnH * 0.7, btnW - s(8), btnH * 0.25, { tl: 0, tr: 0, bl: s(20), br: s(20) });

    this.add.text(width / 2, btnY + btnH / 2, '\u25B6  Play', {
      fontSize: fs(22), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
      shadow: { offsetX: 0, offsetY: s(1), color: 'rgba(0,0,0,0.15)', blur: s(2), fill: true }
    }).setOrigin(0.5).setDepth(11);

    const hitZone = this.add.zone(width / 2, btnY + btnH / 2, btnW, btnH).setInteractive().setDepth(11);
    hitZone.on('pointerdown', () => {
      this.tweens.add({
        targets: [btnBg, shadow, btnShine, btnEdge],
        scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true,
        onComplete: () => {
          this.cameras.main.fadeOut(400, 255, 240, 245);
          this.time.delayedCall(400, () => this.scene.start('GameScene'));
        }
      });
    });
  }
}
