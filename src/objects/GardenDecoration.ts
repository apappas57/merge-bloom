import { FONT, fs, s } from '../utils/constants';

export interface GardenDecoData {
  chainId: string;
  tier: number;
  emoji: string;
  name: string;
  x: number;  // 0-1 normalized
  y: number;  // 0-1 normalized
}

/** Predefined placement slots for garden decorations */
export const PLACEMENT_SLOTS: { x: number; y: number; label: string }[] = [
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

/** Depth layer for garden decorations -- visible behind items (depth 10) and generators (depth 5) */
const GARDEN_DEPTH = 3;
const GARDEN_GLOW_DEPTH = 2;
const GARDEN_VIEW_DEPTH = 6000;

/**
 * Renders placed garden decorations in the game background.
 */
export class GardenDecorationManager {
  private scene: Phaser.Scene;
  private decorations: GardenDecoData[] = [];
  private sprites: Phaser.GameObjects.GameObject[] = [];
  private glowSprites: Phaser.GameObjects.Graphics[] = [];
  private boardArea: { x: number; y: number; w: number; h: number };
  private _gardenViewActive = false;
  private viewOverlay: Phaser.GameObjects.Graphics | null = null;
  private viewElements: Phaser.GameObjects.GameObject[] = [];

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
    this.glowSprites.forEach(g => g.destroy());
    this.glowSprites = [];

    for (const deco of this.decorations) {
      this.renderOne(deco);
    }
  }

  private renderOne(deco: GardenDecoData): void {
    const { width, height } = this.scene.scale;
    const x = deco.x * width;
    const y = deco.y * height;

    // Subtle glow/shimmer behind the decoration so it's noticeable
    const glow = this.scene.add.graphics().setDepth(GARDEN_GLOW_DEPTH);
    glow.fillStyle(0xF48FB1, 0.12);
    glow.fillCircle(x, y, s(20));
    glow.fillStyle(0xFFD93D, 0.06);
    glow.fillCircle(x, y, s(28));
    this.glowSprites.push(glow);

    // Shimmer pulse on the glow
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.4,
      duration: Phaser.Math.Between(2000, 3500),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 1500),
    });

    // Use rendered texture if available, fallback to name initial
    const texKey = `${deco.chainId}_${deco.tier}`;
    let sprite: Phaser.GameObjects.GameObject;
    if (this.scene.textures.exists(texKey)) {
      const img = this.scene.add.image(x, y, texKey)
        .setDisplaySize(s(32), s(32)).setAlpha(0.55).setDepth(GARDEN_DEPTH);
      sprite = img;
    } else {
      const txt = this.scene.add.text(x, y, deco.name.charAt(0), {
        fontSize: fs(22), color: '#B07A9E', fontFamily: 'system-ui', fontStyle: '700',
      }).setOrigin(0.5).setAlpha(0.55).setDepth(GARDEN_DEPTH);
      sprite = txt;
    }

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
   * Place a decoration. Returns the slot info if placed successfully, null otherwise.
   */
  place(chainId: string, tier: number, emoji: string, name: string): { x: number; y: number; label: string } | null {
    // Find next available slot
    const usedSlots = new Set(this.decorations.map(d => `${d.x.toFixed(2)}_${d.y.toFixed(2)}`));
    const available = PLACEMENT_SLOTS.filter(slot =>
      !usedSlots.has(`${slot.x.toFixed(2)}_${slot.y.toFixed(2)}`)
    );

    if (available.length === 0) return null;

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

    // Canvas-drawn sparkle burst at placement
    const sparkleColors = [0xFFD93D, 0xFF6B9D, 0xD4A5FF, 0x87CEEB, 0xA8E6CF];
    for (let i = 0; i < 8; i++) {
      const sg = this.scene.add.graphics().setDepth(GARDEN_DEPTH + 1);
      const sx = px + Phaser.Math.Between(-s(25), s(25));
      const sy = py;
      const sr = s(Phaser.Math.Between(2, 5));
      sg.setPosition(sx, sy);
      const sc = sparkleColors[Phaser.Math.Between(0, sparkleColors.length - 1)];
      sg.fillStyle(sc, 0.9);
      sg.beginPath();
      sg.moveTo(0, -sr * 1.5); sg.lineTo(sr * 0.35, -sr * 0.35);
      sg.lineTo(sr * 1.5, 0); sg.lineTo(sr * 0.35, sr * 0.35);
      sg.lineTo(0, sr * 1.5); sg.lineTo(-sr * 0.35, sr * 0.35);
      sg.lineTo(-sr * 1.5, 0); sg.lineTo(-sr * 0.35, -sr * 0.35);
      sg.closePath(); sg.fillPath();
      this.scene.tweens.add({
        targets: sg, y: sy - s(Phaser.Math.Between(20, 45)), alpha: 0,
        duration: 700, delay: i * 70,
        onComplete: () => sg.destroy(),
      });
    }

    return slot;
  }

  getDecorations(): GardenDecoData[] {
    return this.decorations.map(d => ({ ...d }));
  }

  get count(): number {
    return this.decorations.length;
  }

  get availableSlots(): number {
    const usedSlots = new Set(this.decorations.map(d => `${d.x.toFixed(2)}_${d.y.toFixed(2)}`));
    return PLACEMENT_SLOTS.filter(slot =>
      !usedSlots.has(`${slot.x.toFixed(2)}_${slot.y.toFixed(2)}`)
    ).length;
  }

  get totalSlots(): number {
    return PLACEMENT_SLOTS.length;
  }

  /** Get the next available slot info (for preview in prompts) */
  getNextSlot(): { x: number; y: number; label: string } | null {
    const usedSlots = new Set(this.decorations.map(d => `${d.x.toFixed(2)}_${d.y.toFixed(2)}`));
    const available = PLACEMENT_SLOTS.filter(slot =>
      !usedSlots.has(`${slot.x.toFixed(2)}_${slot.y.toFixed(2)}`)
    );
    return available.length > 0 ? available[0] : null;
  }

  hasChain(chainId: string): boolean {
    return this.decorations.some(d => d.chainId === chainId);
  }

  get isGardenViewActive(): boolean {
    return this._gardenViewActive;
  }

  /**
   * Toggle garden view mode: dims the board, highlights placed decorations,
   * and shows labels + empty slots.
   */
  toggleGardenView(): boolean {
    this._gardenViewActive = !this._gardenViewActive;
    if (this._gardenViewActive) {
      this.enterGardenView();
    } else {
      this.exitGardenView();
    }
    return this._gardenViewActive;
  }

  private enterGardenView(): void {
    const { width, height } = this.scene.scale;

    // Dim overlay behind decorations but above board
    this.viewOverlay = this.scene.add.graphics().setDepth(GARDEN_VIEW_DEPTH);
    this.viewOverlay.fillStyle(0x6D3A5B, 0.35);
    this.viewOverlay.fillRect(0, 0, width, height);

    // Dismiss zone on the overlay
    const dismissZone = this.scene.add.zone(width / 2, height / 2, width, height)
      .setInteractive().setDepth(GARDEN_VIEW_DEPTH);
    dismissZone.on('pointerdown', () => this.toggleGardenView());
    this.viewElements.push(dismissZone);

    // Title
    const title = this.scene.add.text(width / 2, s(50), 'Your Garden', {
      fontSize: fs(20), color: '#FFFFFF', fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5).setDepth(GARDEN_VIEW_DEPTH + 3);
    this.viewElements.push(title);

    // Subtitle with count
    const subtitle = this.scene.add.text(width / 2, s(72),
      `${this.decorations.length}/${PLACEMENT_SLOTS.length} decorations placed`, {
      fontSize: fs(11), color: '#F8BBD0', fontFamily: FONT,
    }).setOrigin(0.5).setDepth(GARDEN_VIEW_DEPTH + 3);
    this.viewElements.push(subtitle);

    // Highlight each placed decoration with a label
    for (const deco of this.decorations) {
      const dx = deco.x * width;
      const dy = deco.y * height;

      // Bright highlight ring
      const ring = this.scene.add.graphics().setDepth(GARDEN_VIEW_DEPTH + 1);
      ring.lineStyle(s(2), 0xFFD93D, 0.8);
      ring.strokeCircle(dx, dy, s(22));
      ring.fillStyle(0xFFD93D, 0.1);
      ring.fillCircle(dx, dy, s(22));
      this.viewElements.push(ring);

      // Larger version of the item
      const texKey = `${deco.chainId}_${deco.tier}`;
      if (this.scene.textures.exists(texKey)) {
        const img = this.scene.add.image(dx, dy, texKey)
          .setDisplaySize(s(36), s(36)).setAlpha(1).setDepth(GARDEN_VIEW_DEPTH + 2);
        this.viewElements.push(img);
      } else {
        const txt = this.scene.add.text(dx, dy, deco.name.charAt(0), {
          fontSize: fs(24), color: '#FFFFFF', fontFamily: 'system-ui', fontStyle: '700',
        }).setOrigin(0.5).setDepth(GARDEN_VIEW_DEPTH + 2);
        this.viewElements.push(txt);
      }

      // Name label below
      const label = this.scene.add.text(dx, dy + s(26), deco.name, {
        fontSize: fs(9), color: '#FFFFFF', fontFamily: FONT, fontStyle: '600',
        backgroundColor: 'rgba(109,58,91,0.6)',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(GARDEN_VIEW_DEPTH + 2);
      this.viewElements.push(label);
    }

    // Show empty slots as dotted circles
    const usedSlots = new Set(this.decorations.map(d => `${d.x.toFixed(2)}_${d.y.toFixed(2)}`));
    for (const slot of PLACEMENT_SLOTS) {
      if (usedSlots.has(`${slot.x.toFixed(2)}_${slot.y.toFixed(2)}`)) continue;

      const sx = slot.x * width;
      const sy = slot.y * height;

      const emptySlot = this.scene.add.graphics().setDepth(GARDEN_VIEW_DEPTH + 1);
      emptySlot.lineStyle(s(1.5), 0xFFFFFF, 0.3);
      // Dashed circle effect via small arcs
      const dashCount = 12;
      for (let i = 0; i < dashCount; i++) {
        const startAngle = (i / dashCount) * Math.PI * 2;
        const endAngle = ((i + 0.5) / dashCount) * Math.PI * 2;
        emptySlot.beginPath();
        emptySlot.arc(sx, sy, s(18), startAngle, endAngle, false);
        emptySlot.strokePath();
      }
      this.viewElements.push(emptySlot);

      const slotLabel = this.scene.add.text(sx, sy, slot.label, {
        fontSize: fs(7), color: '#FFFFFF', fontFamily: FONT,
      }).setOrigin(0.5).setAlpha(0.5).setDepth(GARDEN_VIEW_DEPTH + 1);
      this.viewElements.push(slotLabel);
    }

    // Hint text at bottom
    const hint = this.scene.add.text(width / 2, height - s(80), 'Tap anywhere to close', {
      fontSize: fs(10), color: '#F8BBD0', fontFamily: FONT,
    }).setOrigin(0.5).setDepth(GARDEN_VIEW_DEPTH + 3);
    this.viewElements.push(hint);

    // Fade hint in/out
    this.scene.tweens.add({
      targets: hint, alpha: 0.4, duration: 1200, yoyo: true, repeat: -1,
    });
  }

  exitGardenView(): void {
    this._gardenViewActive = false;
    if (this.viewOverlay) {
      this.viewOverlay.destroy();
      this.viewOverlay = null;
    }
    for (const el of this.viewElements) {
      el.destroy();
    }
    this.viewElements = [];
  }
}
