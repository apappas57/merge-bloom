import { MergeItem, MergeItemData } from '../objects/MergeItem';
import { getNextInChain, isMaxTier } from '../data/chains';
import { FONT, fs, s } from '../utils/constants';

// Chain-specific particle colors
const CHAIN_PARTICLES: Record<string, number[]> = {
  flower: [0xFF9CAD, 0xFFB3D9, 0xA8E6CF, 0xFFD0E1],
  butterfly: [0xA8D8EA, 0xFFB3D9, 0xC8A8E9, 0xA8E6CF, 0xFFEAA7],
  fruit: [0xFFB347, 0xFFD700, 0xFF6B6B, 0xA8E6CF],
  crystal: [0xA8D8EA, 0xC8A8E9, 0xE8DAEF, 0xFFFFFF],
  nature: [0xA8E6CF, 0xC8E6C9, 0xB5D99C, 0xFFD700],
  star: [0xFFD700, 0xFFECB3, 0xFFB3D9, 0xA8D8EA],
  tea: [0xC8E6C9, 0xA8D8EA, 0xFFECB3, 0xDEB887],
  shell: [0xA8D8EA, 0x87CEEB, 0xFFB3D9, 0xE0F0FF],
  sweet: [0xFF9CAD, 0xFFB3D9, 0xFFECB3, 0xC8A8E9],
  love: [0xFF6B8A, 0xFFB3C6, 0xFF4D7A, 0xFFC0CB],
  cosmic: [0x7C4DFF, 0xB388FF, 0x536DFE, 0xE8EAF6],
  cafe: [0xD7CCC8, 0xBCAAA4, 0xFFCC80, 0xFFF3E0],
};

export interface MergeResult {
  success: boolean;
  newItem?: MergeItemData;
  xpGained?: number;
  gemsGained?: number;
}

export class MergeSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  canMerge(a: MergeItem, b: MergeItem): boolean {
    if (a.data_.id === b.data_.id) return false;
    if (a.data_.chainId !== b.data_.chainId) return false;
    if (a.data_.tier !== b.data_.tier) return false;
    if (isMaxTier(a.data_.chainId, a.data_.tier)) return false;
    return true;
  }

  async executeMerge(dropped: MergeItem, target: MergeItem): Promise<MergeResult> {
    const next = getNextInChain(dropped.data_.chainId, dropped.data_.tier);
    if (!next) return { success: false };

    const col = target.data_.col;
    const row = target.data_.row;

    await Promise.all([dropped.playMergeAway(), target.playMergeAway()]);

    // Freeze frame for high-tier merges
    const tier = dropped.data_.tier;
    if (tier >= 4) {
      await new Promise<void>(r => this.scene.time.delayedCall(50, r));
    }

    this.createParticles(target.x, target.y, tier, dropped.data_.chainId);

    // Screen shake for tier 4+
    if (tier >= 4) {
      const intensity = s(Math.min(tier - 3, 5));
      this.scene.cameras.main.shake(100, intensity / 1000);
    }

    return {
      success: true,
      newItem: {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        chainId: dropped.data_.chainId,
        tier: next.tier,
        col, row,
      },
      xpGained: 10 + tier * 5,
      gemsGained: 5 + tier * 3,
    };
  }

  private createParticles(x: number, y: number, tier: number, chainId: string): void {
    const colors = CHAIN_PARTICLES[chainId] || [0xFF9CAD, 0xA8E6CF, 0xA8D8EA, 0xFFD700];
    const count = 10 + tier * 3;

    // Mix of circles, hearts-like shapes
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.graphics();
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      const size = s(Phaser.Math.Between(3, 5 + tier));
      p.fillStyle(color, 0.9);
      p.fillCircle(0, 0, size);
      p.setPosition(x, y).setDepth(2000);

      const angle = (i / count) * Math.PI * 2;
      const dist = s(30 + tier * 10 + Phaser.Math.Between(0, 20));

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - s(20),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 450 + Phaser.Math.Between(0, 200),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    if (tier >= 3) {
      const msgs = ['Nice!', 'Great!', 'Amazing!', 'Incredible!', 'LEGENDARY!'];
      const msgColors = ['#FF9CAD', '#A8D8EA', '#C8A8E9', '#FFD700', '#FF6B6B'];
      const idx = Math.min(tier - 3, msgs.length - 1);
      const txt = this.scene.add.text(x, y - s(30), msgs[idx], {
        fontSize: fs(18 + tier * 2), color: msgColors[idx],
        fontFamily: FONT, fontStyle: '700',
        stroke: '#FFFFFF', strokeThickness: s(3),
        shadow: { offsetX: 0, offsetY: s(2), color: 'rgba(92,84,112,0.3)', blur: s(4), fill: true },
      }).setOrigin(0.5).setDepth(2001);

      // Bouncy scale
      txt.setScale(0);
      this.scene.tweens.add({
        targets: txt, scaleX: 1.3, scaleY: 1.3, duration: 200, ease: 'Back.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: txt, scaleX: 1, scaleY: 1, duration: 100,
            onComplete: () => {
              this.scene.tweens.add({
                targets: txt, y: y - s(80), alpha: 0,
                duration: 800, ease: 'Power2',
                onComplete: () => txt.destroy(),
              });
            }
          });
        }
      });
    }
  }
}
