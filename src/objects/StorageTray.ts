import { SIZES, COLORS, FONT_BODY, TEXT, fs, s } from '../utils/constants';

export interface StorageSlot {
  index: number;
  x: number;
  y: number;
  itemData: { chainId: string; tier: number } | null;
}

/**
 * Off-board storage tray — 4 slots below the board for holding items.
 */
export class StorageTray extends Phaser.GameObjects.Container {
  private slots: StorageSlot[] = [];
  private slotGraphics: Phaser.GameObjects.Graphics;
  private slotSprites: (Phaser.GameObjects.Image | null)[] = [];
  private slotSize: number;
  private maxSlots = 4;

  constructor(scene: Phaser.Scene, y: number) {
    const { width } = scene.scale;
    super(scene, 0, 0);

    this.slotSize = s(44);
    const gap = s(8);
    const totalW = this.maxSlots * (this.slotSize + gap) - gap;
    const startX = (width - totalW) / 2;

    this.slotGraphics = scene.add.graphics();
    this.add(this.slotGraphics);

    for (let i = 0; i < this.maxSlots; i++) {
      const sx = startX + i * (this.slotSize + gap) + this.slotSize / 2;
      this.slots.push({ index: i, x: sx, y, itemData: null });
      this.slotSprites.push(null);
    }

    // Label
    const label = scene.add.text(width / 2, y - s(14), '✨ Storage', {
      fontSize: fs(9), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5);
    this.add(label);

    this.drawSlots();
    this.setDepth(4);
    scene.add.existing(this);

    // Make slots interactive for tapping stored items back
    for (const slot of this.slots) {
      const zone = scene.add.zone(slot.x, slot.y, this.slotSize, this.slotSize).setInteractive();
      zone.on('pointerdown', () => this.onSlotTap(slot.index));
    }
  }

  private drawSlots(): void {
    this.slotGraphics.clear();
    const half = this.slotSize / 2;
    const r = s(10);

    for (const slot of this.slots) {
      // Slot shadow
      this.slotGraphics.fillStyle(0xC9A8D8, 0.12);
      this.slotGraphics.fillRoundedRect(slot.x - half + s(1), slot.y - half + s(2), this.slotSize, this.slotSize, r);

      // Slot background
      this.slotGraphics.fillStyle(slot.itemData ? 0xF3E8FF : 0xFFE4EC, 0.7);
      this.slotGraphics.fillRoundedRect(slot.x - half, slot.y - half, this.slotSize, this.slotSize, r);

      // Border
      this.slotGraphics.lineStyle(s(1), 0xD4B8E8, 0.4);
      this.slotGraphics.strokeRoundedRect(slot.x - half, slot.y - half, this.slotSize, this.slotSize, r);
    }
  }

  storeItem(chainId: string, tier: number): boolean {
    const emptySlot = this.slots.find(s => s.itemData === null);
    if (!emptySlot) return false;

    emptySlot.itemData = { chainId, tier };

    // Show the item sprite
    const key = `${chainId}_${tier}`;
    if (this.scene.textures.exists(key)) {
      const sprite = this.scene.add.image(emptySlot.x, emptySlot.y, key);
      sprite.setDisplaySize(s(32), s(32));
      sprite.setDepth(5);
      // Pop-in animation
      sprite.setScale(0);
      this.scene.tweens.add({ targets: sprite, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
      this.slotSprites[emptySlot.index] = sprite;
    }

    this.drawSlots();
    return true;
  }

  private onSlotTap(index: number): void {
    const slot = this.slots[index];
    if (!slot.itemData) return;

    // Emit event for GameScene to handle placing the item back
    this.scene.events.emit('storage-retrieve', slot.itemData, index);
  }

  removeItem(index: number): { chainId: string; tier: number } | null {
    const slot = this.slots[index];
    if (!slot.itemData) return null;

    const data = { ...slot.itemData };
    slot.itemData = null;

    // Remove sprite
    const sprite = this.slotSprites[index];
    if (sprite) {
      this.scene.tweens.add({
        targets: sprite, scaleX: 0, scaleY: 0, duration: 150,
        onComplete: () => sprite.destroy(),
      });
      this.slotSprites[index] = null;
    }

    this.drawSlots();
    return data;
  }

  getStoredItems(): ({ chainId: string; tier: number } | null)[] {
    return this.slots.map(s => s.itemData ? { ...s.itemData } : null);
  }

  loadItems(items: ({ chainId: string; tier: number } | null)[]): void {
    items.forEach((item, i) => {
      if (i >= this.maxSlots || !item) return;
      this.slots[i].itemData = item;

      const key = `${item.chainId}_${item.tier}`;
      if (this.scene.textures.exists(key)) {
        const sprite = this.scene.add.image(this.slots[i].x, this.slots[i].y, key);
        sprite.setDisplaySize(s(32), s(32));
        sprite.setDepth(5);
        this.slotSprites[i] = sprite;
      }
    });
    this.drawSlots();
  }

  isFull(): boolean {
    return this.slots.every(s => s.itemData !== null);
  }

  get trayY(): number {
    return this.slots[0]?.y || 0;
  }
}
