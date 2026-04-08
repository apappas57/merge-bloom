import { MergeItem, MergeItemData } from '../objects/MergeItem';
import { Generator } from '../objects/Generator';
import { getNextInChain, isMaxTier, GeneratorTierDef, getGenTierDef } from '../data/chains';
import { FONT, fs, s } from '../utils/constants';

// Chain-specific particle colors (exported for use in celebration effects)
export const CHAIN_PARTICLES: Record<string, number[]> = {
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

// Chain-specific particle shape overrides
const CHAIN_SHAPES: Record<string, string> = {
  flower: 'petal',
  crystal: 'diamond',
  star: 'star',
  love: 'heart',
  butterfly: 'petal',
  nature: 'leaf',
  cosmic: 'star',
  sweet: 'circle',
  shell: 'circle',
  fruit: 'circle',
  tea: 'circle',
  cafe: 'circle',
};

export interface MergeResult {
  success: boolean;
  newItem?: MergeItemData;
  xpGained?: number;
  gemsGained?: number;
}

export interface GeneratorMergeResult {
  success: boolean;
  newGenTier: number;
  newTierDef: GeneratorTierDef | null;
  col: number;
  row: number;
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

  async executeMerge(dropped: MergeItem, target: MergeItem, comboMultiplier = 1): Promise<MergeResult> {
    const next = getNextInChain(dropped.data_.chainId, dropped.data_.tier);
    if (!next) return { success: false };

    const col = target.data_.col;
    const row = target.data_.row;
    const tier = dropped.data_.tier;
    const chainId = dropped.data_.chainId;

    // Calculate merge midpoint
    const midX = (dropped.x + target.x) / 2;
    const midY = (dropped.y + target.y) / 2;

    // Phase 1: Both items merge away
    await Promise.all([dropped.playMergeAway(), target.playMergeAway()]);

    // Phase 2: White flash at merge point
    this.createMergeFlash(midX, midY, tier);

    // Freeze frame for high-tier merges
    if (tier >= 4) {
      await new Promise<void>(r => this.scene.time.delayedCall(50, r));
    }

    // Phase 4 (300-500ms): Ring of particles + chain-specific shapes
    this.createParticles(midX, midY, tier, chainId, comboMultiplier);

    // Expanding ring at merge point
    this.createMergeRing(midX, midY, tier, chainId);

    // Camera zoom pulse (subtle 2% for 200ms, scales with combo)
    const cam = this.scene.cameras.main;
    const baseZoom = cam.zoom;
    const zoomPulse = 1.02 + (comboMultiplier - 1) * 0.005;
    this.scene.tweens.add({
      targets: cam, zoom: baseZoom * zoomPulse,
      duration: 100, ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: cam, zoom: baseZoom,
          duration: 100, ease: 'Sine.easeIn',
        });
      }
    });

    // Screen shake for tier 4+ (scales with combo)
    if (tier >= 4 || comboMultiplier > 1) {
      const baseIntensity = tier >= 4 ? s(Math.min(tier - 3, 5)) : s(1);
      const intensity = baseIntensity * Math.min(comboMultiplier, 3);
      cam.shake(100 + comboMultiplier * 20, intensity / 1000);
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

  canMergeGenerators(a: Generator, b: Generator): boolean {
    return Generator.canMergeGenerators(a, b);
  }

  async executeGeneratorMerge(dropped: Generator, target: Generator): Promise<GeneratorMergeResult> {
    const newTier = target.genTier + 1;
    const newTierDef = getGenTierDef(target.genDef, newTier);
    if (!newTierDef) return { success: false, newGenTier: 0, newTierDef: null, col: 0, row: 0 };

    const col = target.col;
    const row = target.row;

    await Promise.all([dropped.playMergeAway(), target.playMergeAway()]);

    // Generator merges always feel impactful (tier + 3 for particle count)
    this.createParticles(target.x, target.y, newTier + 3, target.genDef.chainId);
    this.createMergeFlash(target.x, target.y, newTier + 3);
    this.createMergeRing(target.x, target.y, newTier + 3, target.genDef.chainId);

    // Camera zoom pulse
    const cam = this.scene.cameras.main;
    const baseZoom = cam.zoom;
    this.scene.tweens.add({
      targets: cam, zoom: baseZoom * 1.02,
      duration: 100, ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({ targets: cam, zoom: baseZoom, duration: 100, ease: 'Sine.easeIn' });
      }
    });

    // Screen shake for tier 3+ generator merges
    if (newTier >= 3) {
      const intensity = s(Math.min(newTier, 5));
      cam.shake(100, intensity / 1000);
    }

    return { success: true, newGenTier: newTier, newTierDef: newTierDef, col, row };
  }

  /** Phase 2: Bright white flash circle that expands and fades */
  private createMergeFlash(x: number, y: number, tier: number): void {
    const flash = this.scene.add.graphics();
    const radius = s(8 + tier * 2);
    flash.fillStyle(0xFFFFFF, 0.9);
    flash.fillCircle(0, 0, radius);
    flash.setPosition(x, y).setDepth(2002);
    flash.setScale(0.3);
    flash.setAlpha(1);

    this.scene.tweens.add({
      targets: flash,
      scaleX: 2.5, scaleY: 2.5, alpha: 0,
      duration: 150, ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  /** Phase 4: Clean expanding ring that fades */
  private createMergeRing(x: number, y: number, tier: number, chainId: string): void {
    const colors = CHAIN_PARTICLES[chainId] || [0xFF9CAD, 0xA8E6CF, 0xA8D8EA, 0xFFD700];
    const ringColor = colors[0];
    const ring = this.scene.add.graphics();
    const radius = s(20 + tier * 3);
    ring.lineStyle(s(2.5), ringColor, 0.8);
    ring.strokeCircle(0, 0, radius);
    ring.setPosition(x, y).setDepth(1999);
    ring.setScale(0.2);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 2, scaleY: 2, alpha: 0,
      duration: 350, ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  /** Draw a chain-specific particle shape */
  private drawParticleShape(p: Phaser.GameObjects.Graphics, shape: string, size: number, color: number, alpha: number): void {
    p.fillStyle(color, alpha);
    switch (shape) {
      case 'petal': {
        // 5-petal flower shape
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          p.fillEllipse(Math.cos(a) * size * 0.4, Math.sin(a) * size * 0.4, size * 0.5, size * 0.3);
        }
        p.fillStyle(0xFFFFFF, 0.5);
        p.fillCircle(0, 0, size * 0.15);
        break;
      }
      case 'diamond': {
        p.beginPath();
        p.moveTo(0, -size * 1.2);
        p.lineTo(size * 0.6, 0);
        p.lineTo(0, size * 1.2);
        p.lineTo(-size * 0.6, 0);
        p.closePath();
        p.fillPath();
        // Inner highlight
        p.fillStyle(0xFFFFFF, 0.3);
        p.beginPath();
        p.moveTo(0, -size * 0.6);
        p.lineTo(size * 0.2, 0);
        p.lineTo(0, size * 0.3);
        p.lineTo(-size * 0.2, 0);
        p.closePath();
        p.fillPath();
        break;
      }
      case 'star': {
        const sr = size;
        p.beginPath();
        for (let i = 0; i < 5; i++) {
          const outerAngle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const innerAngle = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
          if (i === 0) p.moveTo(Math.cos(outerAngle) * sr * 1.3, Math.sin(outerAngle) * sr * 1.3);
          else p.lineTo(Math.cos(outerAngle) * sr * 1.3, Math.sin(outerAngle) * sr * 1.3);
          p.lineTo(Math.cos(innerAngle) * sr * 0.5, Math.sin(innerAngle) * sr * 0.5);
        }
        p.closePath();
        p.fillPath();
        break;
      }
      case 'heart': {
        const hr = size;
        p.fillCircle(-hr * 0.3, -hr * 0.15, hr * 0.45);
        p.fillCircle(hr * 0.3, -hr * 0.15, hr * 0.45);
        p.fillTriangle(-hr * 0.65, 0, hr * 0.65, 0, 0, hr * 0.7);
        break;
      }
      case 'leaf': {
        // Leaf shape using ellipse (Phaser-compatible)
        p.fillEllipse(0, 0, size * 1.2, size * 1.8);
        break;
      }
      default: {
        // Circle fallback
        p.fillCircle(0, 0, size);
        break;
      }
    }
  }

  private createParticles(x: number, y: number, tier: number, chainId: string, comboMultiplier = 1): void {
    const colors = CHAIN_PARTICLES[chainId] || [0xFF9CAD, 0xA8E6CF, 0xA8D8EA, 0xFFD700];
    const holoColors = [0xFF6B9D, 0xFFD93D, 0x6BCB77, 0x4D96FF, 0xD4A5FF];
    const count = Math.round((10 + tier * 3) * Math.min(comboMultiplier, 3));
    const chainShape = CHAIN_SHAPES[chainId] || 'circle';

    // Ring of particles exploding outward in a clean circle
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.graphics();
      // For T7+ merges: mix in holographic rainbow-colored particles
      const useHolo = tier >= 7 && i % 3 === 0;
      const color = useHolo
        ? holoColors[Phaser.Math.Between(0, holoColors.length - 1)]
        : colors[Phaser.Math.Between(0, colors.length - 1)];
      const size = s(Phaser.Math.Between(3, 6 + tier));
      const alpha = useHolo ? 1 : 0.9;

      // Use chain-specific shapes for every 3rd particle, stars for T5+, circles for rest
      if (i % 3 === 0) {
        this.drawParticleShape(p, chainShape, size, color, alpha);
      } else if (tier >= 5 && i % 4 === 0) {
        this.drawParticleShape(p, 'star', size, color, alpha);
      } else {
        p.fillStyle(color, alpha);
        p.fillCircle(0, 0, size);
      }
      p.setPosition(x, y).setDepth(2000);

      const angle = (i / count) * Math.PI * 2;
      const dist = s(30 + tier * 10 + Phaser.Math.Between(0, 20));

      // Stagger start slightly for wave effect
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - s(20),
        alpha: 0, scaleX: 0, scaleY: 0,
        rotation: Phaser.Math.FloatBetween(-1, 1),
        duration: 400 + Phaser.Math.Between(0, 150),
        delay: Phaser.Math.Between(0, 50),
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
