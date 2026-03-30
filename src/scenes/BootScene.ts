import { FONT, fs } from '../utils/constants';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - height * 0.05, '🌸', { fontSize: fs(64) }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + height * 0.04, 'Merge Bloom', {
      fontSize: fs(28), color: '#ffffff', fontFamily: FONT, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + height * 0.08, 'Loading...', {
      fontSize: fs(16), color: '#8899aa', fontFamily: FONT
    }).setOrigin(0.5);

    this.time.delayedCall(400, () => this.scene.start('PreloadScene'));
  }
}
