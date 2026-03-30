import { COLORS, FONT, TEXT, fs, s } from '../utils/constants';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;

    // Soft pastel gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xFFF8F0, 0xFFF8F0, 0xFFE4EC, 0xE8F5E9, 1);
    bg.fillRect(0, 0, width, height);

    // Floating decorative emoji
    const deco = ['🌸', '🌷', '🌹', '🌺', '🦋', '🌿', '✨', '💐', '☘️', '💕', '⭐', '🌙'];
    for (let i = 0; i < 15; i++) {
      const e = deco[Phaser.Math.Between(0, deco.length - 1)];
      const x = Phaser.Math.Between(s(20), width - s(20));
      const y = Phaser.Math.Between(s(20), height - s(20));
      const t = this.add.text(x, y, e, { fontSize: fs(Phaser.Math.Between(16, 30)) })
        .setOrigin(0.5).setAlpha(0.2);
      this.tweens.add({
        targets: t, y: y - s(Phaser.Math.Between(10, 30)),
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    // Title emoji + pulse
    const titleEmoji = this.add.text(width / 2, height * 0.25, '🌸', { fontSize: fs(80) }).setOrigin(0.5);
    this.tweens.add({
      targets: titleEmoji, scaleX: 1.1, scaleY: 1.1,
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Title
    this.add.text(width / 2, height * 0.37, 'Merge Bloom', {
      fontSize: fs(38), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
      shadow: { offsetX: 0, offsetY: s(2), color: 'rgba(212,184,232,0.4)', blur: s(8), fill: true }
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.43, 'A cozy garden merge game', {
      fontSize: fs(14), color: TEXT.SECONDARY, fontFamily: FONT,
    }).setOrigin(0.5);

    // Play button — pill shape, rose pink
    const btnW = s(200), btnH = s(56);
    const btnX = width / 2 - btnW / 2;
    const btnY = height * 0.55;

    // Button shadow
    const btnShadow = this.add.graphics();
    btnShadow.fillStyle(0xE889A0, 0.3);
    btnShadow.fillRoundedRect(btnX, btnY + s(4), btnW, btnH, btnH / 2);

    // Button glow
    const btnGlow = this.add.graphics();
    btnGlow.fillStyle(0xFF9CAD, 0.25);
    btnGlow.fillRoundedRect(btnX - s(4), btnY - s(4), btnW + s(8), btnH + s(8), (btnH + s(8)) / 2);
    this.tweens.add({ targets: btnGlow, alpha: 0.4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xFF9CAD, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, btnH / 2);

    this.add.text(width / 2, btnY + btnH / 2, '▶  Play', {
      fontSize: fs(22), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5);

    const hitZone = this.add.zone(width / 2, btnY + btnH / 2, btnW, btnH).setInteractive();
    hitZone.on('pointerdown', () => {
      this.tweens.add({
        targets: [btnBg, btnShadow], scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true,
        onComplete: () => {
          this.cameras.main.fadeOut(400, 255, 248, 240);
          this.time.delayedCall(400, () => this.scene.start('GameScene'));
        }
      });
    });

    this.add.text(width / 2, height - s(40), 'Made with 💕', {
      fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT,
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(600, 255, 248, 240);
  }
}
