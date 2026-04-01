import { SIZES, COLORS, TIMING, TEXT, fs, s } from '../utils/constants';
import { Board } from './Board';
import { getTextureKey, getNextInChain, isMaxTier } from '../data/chains';

export interface MergeItemData {
  id: string;
  chainId: string;
  tier: number;
  col: number;
  row: number;
}

let _idCounter = 0;
export function newItemId(): string {
  return `item_${Date.now()}_${_idCounter++}`;
}

export class MergeItem extends Phaser.GameObjects.Container {
  public data_: MergeItemData;
  private sprite: Phaser.GameObjects.Image;
  private board: Board;
  public origCol_: number;
  public origRow_: number;
  private glowGfx: Phaser.GameObjects.Graphics;
  private holoShimmerGfx: Phaser.GameObjects.Graphics | null = null;
  private longPressTimer: Phaser.Time.TimerEvent | null = null;
  private pointerStartX = 0;
  private pointerStartY = 0;

  constructor(scene: Phaser.Scene, board: Board, data: MergeItemData) {
    const cell = board.getCell(data.col, data.row)!;
    super(scene, cell.x, cell.y);

    this.data_ = { ...data };
    this.board = board;
    this.origCol_ = data.col;
    this.origRow_ = data.row;

    this.glowGfx = scene.add.graphics();
    this.add(this.glowGfx);
    if (data.tier >= 5) this.addGlow();

    const key = getTextureKey(data.chainId, data.tier);
    this.sprite = scene.add.image(0, 0, key);
    this.sprite.setDisplaySize(SIZES.ITEM_SIZE, SIZES.ITEM_SIZE);
    this.add(this.sprite);

    // Holographic shimmer overlay for T7+ items
    if (data.tier >= 7) this.addHoloShimmer();

    // No tier number — the card frame indicates tier visually

    this.setSize(board.cellDimension, board.cellDimension);
    this.setInteractive({ draggable: true });
    this.setupDrag();

    board.setOccupied(data.col, data.row, data.id);
    scene.add.existing(this);
  }

  private addGlow(): void {
    this.glowGfx.clear();
    this.glowGfx.fillStyle(COLORS.ACCENT_ROSE, 0.2);
    this.glowGfx.fillCircle(0, 0, SIZES.ITEM_SIZE / 2 + s(6));
    this.scene.tweens.add({
      targets: this.glowGfx, alpha: 0.4,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  /** Animated holographic shimmer band that sweeps across T7+ items */
  private addHoloShimmer(): void {
    this.holoShimmerGfx = this.scene.add.graphics();
    this.add(this.holoShimmerGfx);
    const half = SIZES.ITEM_SIZE / 2;
    let phase = 0;

    this.scene.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        if (!this.holoShimmerGfx || !this.scene) return;
        phase += 0.08;
        if (phase > Math.PI * 2) phase -= Math.PI * 2;

        this.holoShimmerGfx.clear();
        // Diagonal shimmer band sweeping across
        const bandX = Math.sin(phase) * half * 1.8;
        const bandW = s(6);
        // Use a shifting hue based on phase for holographic color cycling
        const hueShift = (phase / (Math.PI * 2));
        const colors = [0xFF6B9D, 0xFFD93D, 0x6BCB77, 0x4D96FF, 0xD4A5FF];
        const colorIdx = Math.floor(hueShift * colors.length) % colors.length;
        this.holoShimmerGfx.fillStyle(colors[colorIdx], 0.12 + Math.sin(phase) * 0.06);
        this.holoShimmerGfx.fillRect(bandX - bandW / 2, -half, bandW, half * 2);

        // Secondary thinner band offset
        const band2X = Math.sin(phase + Math.PI) * half * 1.5;
        this.holoShimmerGfx.fillStyle(colors[(colorIdx + 2) % colors.length], 0.08);
        this.holoShimmerGfx.fillRect(band2X - bandW / 4, -half, bandW / 2, half * 2);
      }
    });
  }

  private setupDrag(): void {
    // Long-press detection: 300ms hold without movement triggers preview
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerStartX = pointer.x;
      this.pointerStartY = pointer.y;
      this.cancelLongPress();
      this.longPressTimer = this.scene.time.delayedCall(300, () => {
        this.scene.events.emit('item-preview', this.data_, this.x, this.y);
        this.longPressTimer = null;
      });
    });

    this.on('dragstart', () => {
      this.cancelLongPress();
      this.origCol_ = this.data_.col;
      this.origRow_ = this.data_.row;
      this.setDepth(1000);
      this.scene.tweens.add({ targets: this, scaleX: 1.15, scaleY: 1.15, duration: 100, ease: 'Back.easeOut' });
      this.board.setOccupied(this.data_.col, this.data_.row, null);
    });

    this.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      // Cancel long-press if pointer moved more than 5px
      if (this.longPressTimer) {
        const dx = _p.x - this.pointerStartX;
        const dy = _p.y - this.pointerStartY;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          this.cancelLongPress();
        }
      }
      this.x = dragX;
      this.y = dragY;
      const cell = this.board.getCellAt(dragX, dragY);
      if (cell) {
        this.board.highlightCell(cell.col, cell.row, COLORS.CELL_VALID);
        // Check for valid merge target and show preview
        this.checkMergePreview(cell);
      } else {
        this.board.clearHighlights();
        this.scene.events.emit('hide-merge-preview');
      }
      // Trash zone proximity check
      const { width, height } = this.scene.scale;
      const nearTrash = dragX > width - s(60) && dragY > height - s(130);
      this.scene.events.emit('item-near-trash', nearTrash);
    });

    this.on('dragend', () => {
      this.cancelLongPress();
      this.setDepth(10);
      this.board.clearHighlights();
      this.scene.events.emit('hide-merge-preview');
      this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 100 });
      const cell = this.board.getCellAt(this.x, this.y);
      if (cell && !cell.locked) { this.scene.events.emit('item-dropped', this, cell); }
      else { this.returnToOriginal(); }
    });

    this.on('pointerup', () => {
      this.cancelLongPress();
    });
  }

  /** Check if the cell under the drag contains a compatible merge target and show preview */
  private checkMergePreview(cell: { col: number; row: number; x: number; y: number; itemId: string | null }): void {
    if (!cell.itemId) {
      this.scene.events.emit('hide-merge-preview');
      return;
    }
    // Check if target item is same chain, same tier, and not max tier
    const targetCell = this.board.getCell(cell.col, cell.row);
    if (!targetCell || !targetCell.itemId) {
      this.scene.events.emit('hide-merge-preview');
      return;
    }

    // We need to check the item data, but we only have the itemId
    // Emit the preview check event with our data and the cell position
    // GameScene will look up the target item and validate
    const nextInChain = getNextInChain(this.data_.chainId, this.data_.tier);
    if (nextInChain && !isMaxTier(this.data_.chainId, this.data_.tier)) {
      // Emit with our chain info so GameScene can validate against the target
      this.scene.events.emit('show-merge-preview', this.data_.chainId, nextInChain.tier, cell.x, cell.y, this.data_.id, targetCell.itemId);
    } else {
      this.scene.events.emit('hide-merge-preview');
    }
  }

  private cancelLongPress(): void {
    if (this.longPressTimer) {
      this.longPressTimer.remove(false);
      this.longPressTimer = null;
    }
  }

  returnToOriginal(): void {
    const cell = this.board.getCell(this.origCol_, this.origRow_);
    if (cell) {
      this.board.setOccupied(this.origCol_, this.origRow_, this.data_.id);
      this.data_.col = this.origCol_;
      this.data_.row = this.origRow_;
      this.scene.tweens.add({ targets: this, x: cell.x, y: cell.y, duration: 200, ease: 'Back.easeOut' });
    }
  }

  moveToCell(col: number, row: number, animate = true): void {
    const cell = this.board.getCell(col, row);
    if (!cell) return;
    this.board.setOccupied(this.data_.col, this.data_.row, null);
    this.data_.col = col; this.data_.row = row;
    this.origCol_ = col; this.origRow_ = row;
    this.board.setOccupied(col, row, this.data_.id);
    if (animate) { this.scene.tweens.add({ targets: this, x: cell.x, y: cell.y, duration: 150, ease: 'Power2' }); }
    else { this.x = cell.x; this.y = cell.y; }
  }

  playMergeAway(): Promise<void> {
    return new Promise(resolve => {
      this.board.setOccupied(this.data_.col, this.data_.row, null);
      this.disableInteractive();
      this.scene.tweens.add({
        targets: this, scaleX: 0, scaleY: 0, alpha: 0,
        duration: TIMING.MERGE_DURATION, ease: 'Back.easeIn',
        onComplete: () => { this.destroy(); resolve(); }
      });
    });
  }

  playSpawnAnimation(): void {
    this.setScale(0); this.setAlpha(0);
    this.scene.tweens.add({
      targets: this, scaleX: 1, scaleY: 1, alpha: 1,
      duration: TIMING.SPAWN_DURATION, ease: 'Back.easeOut',
    });
  }

  playMergeResult(): void {
    this.setScale(0);
    this.scene.tweens.add({
      targets: this, scaleX: 1.3, scaleY: 1.3, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 150, ease: 'Bounce.easeOut' });
      }
    });
  }

  getData(): MergeItemData { return { ...this.data_ }; }
}
