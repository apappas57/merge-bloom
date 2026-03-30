import { MergeItem, MergeItemData } from '../objects/MergeItem';
import { getNextInChain, isMaxTier } from '../data/chains';
import { fs, s } from '../utils/constants';

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
    this.createParticles(target.x, target.y, dropped.data_.tier);

    const tier = dropped.data_.tier;
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

  private createParticles(x: number, y: number, tier: number): void {
    const colors = [0xffd700, 0xff69b4, 0x87ceeb, 0x2ecc71, 0xff6347];
    const count = 8 + tier * 3;

    for (let i = 0; i < count; i++) {
      const p = this.scene.add.graphics();
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      p.fillStyle(color, 1);
      p.fillCircle(0, 0, s(Phaser.Math.Between(3, 5 + tier)));
      p.setPosition(x, y).setDepth(2000);

      const angle = (i / count) * Math.PI * 2;
      const dist = s(30 + tier * 10 + Phaser.Math.Between(0, 20));

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - s(20),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 400 + Phaser.Math.Between(0, 200),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    if (tier >= 3) {
      const msgs = ['Nice!', 'Great!', 'Amazing!', 'Incredible!', 'LEGENDARY!'];
      const idx = Math.min(tier - 3, msgs.length - 1);
      const txt = this.scene.add.text(x, y - s(30), msgs[idx], {
        fontSize: fs(16 + tier * 2), color: '#ffd700',
        fontFamily: 'system-ui', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: s(3),
      }).setOrigin(0.5).setDepth(2001);

      this.scene.tweens.add({
        targets: txt, y: y - s(80), alpha: 0, scaleX: 1.5, scaleY: 1.5,
        duration: 1000, ease: 'Power2',
        onComplete: () => txt.destroy(),
      });
    }
  }
}
