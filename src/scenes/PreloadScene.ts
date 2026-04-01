import { MERGE_CHAINS, GENERATORS, getGenTextureKey } from '../data/chains';
import { CHARACTERS } from '../data/orders';
import { EmojiRenderer } from '../utils/EmojiRenderer';
import { CharacterRenderer } from '../utils/CharacterRenderer';
import { SIZES, s } from '../utils/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  create() {
    const list: { key: string; emoji: string }[] = [];

    for (const chain of MERGE_CHAINS) {
      for (const item of chain.items) {
        list.push({ key: `${chain.id}_${item.tier}`, emoji: item.emoji });
      }
    }

    // Generate textures for all 5 tiers of each generator
    for (const gen of GENERATORS) {
      for (const tierDef of gen.tiers) {
        const key = getGenTextureKey(gen.id, tierDef.tier);
        list.push({ key, emoji: tierDef.emoji });
      }
    }

    list.push(
      { key: 'gem', emoji: '💎' },
      { key: 'star_ui', emoji: '⭐' },
      { key: 'sparkle', emoji: '✨' },
    );

    // Render at 2x the display size for extra crispness on 3x Retina
    console.log(`[Preload] Generating ${list.length} textures at size ${SIZES.ITEM_SIZE * 2}...`);
    const t0 = performance.now();
    try {
      EmojiRenderer.generateTextures(this, list, SIZES.ITEM_SIZE * 2);
      console.log(`[Preload] Textures done in ${(performance.now() - t0).toFixed(0)}ms`);
    } catch (e) {
      console.error('[Preload] TEXTURE GENERATION FAILED:', e);
    }

    // Character portraits -- large for crisp rendering in order cards
    CharacterRenderer.generateTextures(
      this,
      CHARACTERS.map(c => c.id),
      s(48)
    );

    console.log('[Preload] Characters done. Starting MenuScene in 200ms...');
    this.time.delayedCall(200, () => {
      console.log('[Preload] Transitioning to MenuScene NOW');
      this.scene.start('MenuScene');
    });
  }
}
