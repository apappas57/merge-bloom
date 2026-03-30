import { COLORS, FONT, TEXT, fs, s } from '../utils/constants';

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

    // Pink gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xFFF0F5, 0xFFF0F5, 0xFCE4EC, 0xF8BBD0, 1);
    bg.fillRect(0, 0, width, height);

    // Floating decorative emoji with parallax layers
    const deco = ['\uD83C\uDF38', '\uD83D\uDC95', '\uD83C\uDF37', '\uD83D\uDC97', '\uD83E\uDD8B', '\u2728', '\uD83D\uDC90', '\uD83C\uDF80', '\uD83D\uDC96', '\uD83C\uDF39', '\u2B50', '\uD83C\uDF70', '\uD83C\uDF3A', '\uD83C\uDF3C', '\uD83C\uDF3B', '\uD83E\uDDC1', '\uD83C\uDF3F'];

    // Three parallax layers: back (slow, big, faint), mid, front (fast, varied)
    const layers = [
      { count: 6, minSize: 22, maxSize: 38, alpha: 0.1, speedMult: 0.5, depthBase: 0 },
      { count: 8, minSize: 16, maxSize: 28, alpha: 0.18, speedMult: 1.0, depthBase: 1 },
      { count: 5, minSize: 12, maxSize: 20, alpha: 0.25, speedMult: 1.6, depthBase: 2 },
    ];

    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        const e = deco[Phaser.Math.Between(0, deco.length - 1)];
        const x = Phaser.Math.Between(s(20), width - s(20));
        const y = Phaser.Math.Between(s(20), height - s(20));
        const fontSize = Phaser.Math.Between(layer.minSize, layer.maxSize);
        const t = this.add.text(x, y, e, { fontSize: fs(fontSize) })
          .setOrigin(0.5).setAlpha(layer.alpha).setDepth(layer.depthBase);

        const baseDuration = Phaser.Math.Between(2500, 4500);
        const duration = Math.round(baseDuration / layer.speedMult);
        const drift = s(Phaser.Math.Between(10, 30)) * layer.speedMult;

        this.tweens.add({
          targets: t, y: y - drift,
          duration,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          delay: Phaser.Math.Between(0, 2000),
        });

        // Slight horizontal sway for parallax feel
        this.tweens.add({
          targets: t, x: x + s(Phaser.Math.Between(-8, 8)) * layer.speedMult,
          duration: duration * 1.3,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          delay: Phaser.Math.Between(0, 1500),
        });
      }
    }

    // Title emoji + pulse
    const titleEmoji = this.add.text(width / 2, height * 0.25, '\uD83C\uDF38', { fontSize: fs(80) })
      .setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: titleEmoji, scaleX: 1.1, scaleY: 1.1,
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Title
    this.add.text(width / 2, height * 0.37, 'Merge Bloom', {
      fontSize: fs(38), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
      shadow: { offsetX: 0, offsetY: s(2), color: 'rgba(212,184,232,0.4)', blur: s(8), fill: true }
    }).setOrigin(0.5).setDepth(10);

    // Subtitle — random tagline
    const tagline = TAGLINES[Phaser.Math.Between(0, TAGLINES.length - 1)];
    const subtitle = this.add.text(width / 2, height * 0.43, tagline, {
      fontSize: fs(14), color: TEXT.SECONDARY, fontFamily: FONT,
    }).setOrigin(0.5).setDepth(10);

    // Subtle fade-in for subtitle
    subtitle.setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 800, delay: 300 });

    // Version text under tagline
    this.add.text(width / 2, height * 0.47, 'v1.0', {
      fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT,
    }).setOrigin(0.5).setAlpha(0.4).setDepth(10);

    // Play button — pill shape, rose pink
    const btnW = s(200), btnH = s(56);
    const btnX = width / 2 - btnW / 2;
    const btnY = height * 0.55;

    // Button shadow
    const btnShadow = this.add.graphics();
    btnShadow.fillStyle(0xC2185B, 0.25);
    btnShadow.fillRoundedRect(btnX, btnY + s(4), btnW, btnH, btnH / 2);
    btnShadow.setDepth(10);

    // Button glow
    const btnGlow = this.add.graphics();
    btnGlow.fillStyle(0xEC407A, 0.25);
    btnGlow.fillRoundedRect(btnX - s(4), btnY - s(4), btnW + s(8), btnH + s(8), (btnH + s(8)) / 2);
    btnGlow.setDepth(10);
    this.tweens.add({ targets: btnGlow, alpha: 0.4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xEC407A, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, btnH / 2);
    btnBg.setDepth(10);

    this.add.text(width / 2, btnY + btnH / 2, '\u25B6  Play', {
      fontSize: fs(22), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5).setDepth(10);

    const hitZone = this.add.zone(width / 2, btnY + btnH / 2, btnW, btnH).setInteractive();
    hitZone.setDepth(10);
    hitZone.on('pointerdown', () => {
      this.tweens.add({
        targets: [btnBg, btnShadow], scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true,
        onComplete: () => {
          this.cameras.main.fadeOut(400, 255, 240, 245);
          this.time.delayedCall(400, () => this.scene.start('GameScene'));
        }
      });
    });

    this.add.text(width / 2, height - s(40), 'Made with \uD83D\uDC95', {
      fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT,
    }).setOrigin(0.5).setDepth(10);

    this.cameras.main.fadeIn(600, 255, 240, 245);
  }
}
