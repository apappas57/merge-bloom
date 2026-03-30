import { MERGE_CHAINS, GENERATORS } from '../data/chains';
import { EmojiRenderer } from '../utils/EmojiRenderer';
import { SIZES } from '../utils/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  create() {
    const list: { key: string; emoji: string }[] = [];

    // Chain items
    for (const chain of MERGE_CHAINS) {
      for (const item of chain.items) {
        list.push({ key: `${chain.id}_${item.tier}`, emoji: item.emoji });
      }
    }

    // Generators
    for (const gen of GENERATORS) {
      list.push({ key: `gen_${gen.id}`, emoji: gen.emoji });
    }

    // UI emoji
    list.push(
      { key: 'gem', emoji: '💎' },
      { key: 'star_ui', emoji: '⭐' },
      { key: 'sparkle', emoji: '✨' },
    );

    EmojiRenderer.generateTextures(this, list, SIZES.ITEM_SIZE + 16);

    this.time.delayedCall(200, () => this.scene.start('MenuScene'));
  }
}
