import { FONT, TEXT, fs, s } from '../utils/constants';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const { width, height } = this.scale;

    // Wait for custom fonts to load
    document.fonts.ready.then(() => {
      // Canvas-drawn cherry blossom (loading icon)
      const g = this.add.graphics();
      const cx = width / 2, cy = height / 2 - height * 0.05, r = s(24);
      g.fillStyle(0xF8BBD0, 0.9);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        g.fillEllipse(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, r * 0.55, r * 0.35);
      }
      g.fillStyle(0xFFD54F, 1);
      g.fillCircle(cx, cy, r * 0.15);
      g.fillStyle(0xFFFFFF, 0.35);
      g.fillCircle(cx - r * 0.1, cy - r * 0.15, r * 0.08);
      this.add.text(width / 2, height / 2 + height * 0.04, 'm3rg3r', {
        fontSize: fs(30), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600'
      }).setOrigin(0.5);
      this.add.text(width / 2, height / 2 + height * 0.08, 'Loading...', {
        fontSize: fs(14), color: TEXT.SECONDARY, fontFamily: FONT
      }).setOrigin(0.5);

      this.time.delayedCall(400, () => this.scene.start('PreloadScene'));
    });
  }
}
