import { FONT, TEXT, fs, s } from '../utils/constants';

export interface GardenDecoData {
  chainId: string;
  tier: number;
  emoji: string;
  name: string;
  x: number;  // 0-1 normalized
  y: number;  // 0-1 normalized
}

/** Predefined placement slots for garden decorations */
const PLACEMENT_SLOTS: { x: number; y: number; label: string }[] = [
  { x: 0.15, y: 0.25, label: 'Sky Left' },
  { x: 0.50, y: 0.15, label: 'Sky Center' },
  { x: 0.85, y: 0.25, label: 'Sky Right' },
  { x: 0.12, y: 0.50, label: 'Mid Left' },
  { x: 0.50, y: 0.45, label: 'Mid Center' },
  { x: 0.88, y: 0.50, label: 'Mid Right' },
  { x: 0.20, y: 0.72, label: 'Ground Left' },
  { x: 0.50, y: 0.75, label: 'Ground Center' },
  { x: 0.80, y: 0.72, label: 'Ground Right' },
  { x: 0.35, y: 0.60, label: 'Garden Path' },
  { x: 0.65, y: 0.38, label: 'Hillside' },
  { x: 0.25, y: 0.85, label: 'Pond' },
];

/**
 * Renders placed garden decorations in the game background.
 */
export class GardenDecorationManager {
  private scene: Phaser.Scene;
  private decorations: GardenDecoData[] = [];
  private sprites: Phaser.GameObjects.Text[] = [];
  private boardArea: { x: number; y: number; w: number; h: number };

  constructor(scene: Phaser.Scene, boardArea: { x: number; y: number; w: number; h: number }) {
    this.scene = scene;
    this.boardArea = boardArea;
  }

  load(saved: GardenDecoData[]): void {
    this.decorations = saved || [];
    this.renderAll();
  }

  private renderAll(): void {
    this.sprites.forEach(s => s.destroy());
    this.sprites = [];

    for (const deco of this.decorations) {
      this.renderOne(deco);
    }
  }

  private renderOne(deco: GardenDecoData): void {
    const { width, height } = this.scene.scale;
    const x = deco.x * width;
    const y = deco.y * height;

    const sprite = this.scene.add.text(x, y, deco.emoji, {
      fontSize: fs(24),
    }).setOrigin(0.5).setAlpha(0.35).setDepth(1);

    // Gentle float animation
    this.scene.tweens.add({
      targets: sprite,
      y: y - s(3),
      duration: Phaser.Math.Between(2500, 4000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 2000),
    });

    this.sprites.push(sprite);
  }

  /**
   * Place a decoration. Returns true if placed successfully.
   */
  place(chainId: string, tier: number, emoji: string, name: string): boolean {
    // Find next available slot
    const usedSlots = new Set(this.decorations.map(d => `${d.x.toFixed(2)}_${d.y.toFixed(2)}`));
    const available = PLACEMENT_SLOTS.filter(slot =>
      !usedSlots.has(`${slot.x.toFixed(2)}_${slot.y.toFixed(2)}`)
    );

    if (available.length === 0) return false;

    const slot = available[0];
    const deco: GardenDecoData = {
      chainId, tier, emoji, name,
      x: slot.x, y: slot.y,
    };

    this.decorations.push(deco);
    this.renderOne(deco);

    // Placement celebration
    const { width, height } = this.scene.scale;
    const px = slot.x * width;
    const py = slot.y * height;

    // Sparkle burst at placement
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.text(
        px + Phaser.Math.Between(-s(20), s(20)),
        py, '✨', { fontSize: fs(10) }
      ).setOrigin(0.5).setDepth(2);
      this.scene.tweens.add({
        targets: p, y: p.y - s(Phaser.Math.Between(20, 40)), alpha: 0,
        duration: 600, delay: i * 80,
        onComplete: () => p.destroy(),
      });
    }

    return true;
  }

  getDecorations(): GardenDecoData[] {
    return this.decorations.map(d => ({ ...d }));
  }

  get count(): number {
    return this.decorations.length;
  }

  hasChain(chainId: string): boolean {
    return this.decorations.some(d => d.chainId === chainId);
  }
}
