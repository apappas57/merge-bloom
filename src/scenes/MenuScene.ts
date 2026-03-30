import { COLORS, FONT, fs, s } from '../utils/constants';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1a0a, 0x0a1a0a, 0x132a13, 0x1a3a2a, 1);
    bg.fillRect(0, 0, width, height);

    // Floating decorative emoji
    const deco = ['🌸', '🌷', '🌹', '🌺', '🌻', '🦋', '🌿', '✨', '💐', '🌳', '☘️', '🍂'];
    for (let i = 0; i < 15; i++) {
      const e = deco[Phaser.Math.Between(0, deco.length - 1)];
      const x = Phaser.Math.Between(s(20), width - s(20));
      const y = Phaser.Math.Between(s(20), height - s(20));
      const t = this.add.text(x, y, e, { fontSize: fs(Phaser.Math.Between(18, 34)) })
        .setOrigin(0.5).setAlpha(0.12);
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
      fontSize: fs(36), color: '#ffffff', fontFamily: FONT, fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: s(2), color: '#000000', blur: s(8), fill: true }
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.43, 'A cozy garden merge game', {
      fontSize: fs(15), color: '#8899aa', fontFamily: FONT,
    }).setOrigin(0.5);

    // Play button
    const btnW = s(200), btnH = s(56);
    const btnX = width / 2 - btnW / 2;
    const btnY = height * 0.55;

    const btnGlow = this.add.graphics();
    btnGlow.fillStyle(0x2ecc71, 0.3);
    btnGlow.fillRoundedRect(btnX - s(4), btnY - s(4), btnW + s(8), btnH + s(8), s(32));
    this.tweens.add({ targets: btnGlow, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x2ecc71, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, s(28));

    this.add.text(width / 2, btnY + btnH / 2, '▶  Play', {
      fontSize: fs(22), color: '#ffffff', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitZone = this.add.zone(width / 2, btnY + btnH / 2, btnW, btnH).setInteractive();
    hitZone.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('GameScene'));
    });

    this.add.text(width / 2, height - s(40), 'Made with 💕', {
      fontSize: fs(12), color: '#4a5568', fontFamily: FONT,
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }
}
