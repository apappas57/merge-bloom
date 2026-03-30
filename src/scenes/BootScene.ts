import { FONT, TEXT, fs } from '../utils/constants';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const { width, height } = this.scale;

    // Wait for custom fonts to load
    document.fonts.ready.then(() => {
      this.add.text(width / 2, height / 2 - height * 0.05, '🌸', { fontSize: fs(64) }).setOrigin(0.5);
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
