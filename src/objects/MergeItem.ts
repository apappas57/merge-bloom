import { SIZES, COLORS, TIMING, TEXT, fs, s } from '../utils/constants';
import { Board } from './Board';
import { getTextureKey } from '../data/chains';

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
  private origCol: number;
  private origRow: number;
  private tierText: Phaser.GameObjects.Text;
  private glowGfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, board: Board, data: MergeItemData) {
    const cell = board.getCell(data.col, data.row)!;
    super(scene, cell.x, cell.y);

    this.data_ = { ...data };
    this.board = board;
    this.origCol = data.col;
    this.origRow = data.row;

    this.glowGfx = scene.add.graphics();
    this.add(this.glowGfx);
    if (data.tier >= 5) this.addGlow();

    const key = getTextureKey(data.chainId, data.tier);
    this.sprite = scene.add.image(0, 0, key);
    this.sprite.setDisplaySize(SIZES.ITEM_SIZE, SIZES.ITEM_SIZE);
    this.add(this.sprite);

    this.tierText = scene.add.text(
      SIZES.ITEM_SIZE / 2 - s(2), SIZES.ITEM_SIZE / 2 - s(2),
      `${data.tier}`,
      { fontSize: fs(8), color: TEXT.WHITE, fontFamily: 'Nunito, system-ui', fontStyle: 'bold',
        backgroundColor: 'rgba(92,84,112,0.6)', padding: { x: s(3), y: s(1) } }
    ).setOrigin(1, 1);
    this.add(this.tierText);

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

  private setupDrag(): void {
    this.on('dragstart', () => {
      this.origCol = this.data_.col;
      this.origRow = this.data_.row;
      this.setDepth(1000);
      this.scene.tweens.add({ targets: this, scaleX: 1.15, scaleY: 1.15, duration: 100, ease: 'Back.easeOut' });
      this.board.setOccupied(this.data_.col, this.data_.row, null);
    });

    this.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.x = dragX;
      this.y = dragY;
      const cell = this.board.getCellAt(dragX, dragY);
      if (cell) { this.board.highlightCell(cell.col, cell.row, COLORS.CELL_VALID); }
      else { this.board.clearHighlights(); }
      // Trash zone proximity check
      const { width, height } = this.scene.scale;
      const nearTrash = dragX > width - s(60) && dragY > height - s(130);
      this.scene.events.emit('item-near-trash', nearTrash);
    });

    this.on('dragend', () => {
      this.setDepth(10);
      this.board.clearHighlights();
      this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 100 });
      const cell = this.board.getCellAt(this.x, this.y);
      if (cell && !cell.locked) { this.scene.events.emit('item-dropped', this, cell); }
      else { this.returnToOriginal(); }
    });
  }

  returnToOriginal(): void {
    const cell = this.board.getCell(this.origCol, this.origRow);
    if (cell) {
      this.board.setOccupied(this.origCol, this.origRow, this.data_.id);
      this.data_.col = this.origCol;
      this.data_.row = this.origRow;
      this.scene.tweens.add({ targets: this, x: cell.x, y: cell.y, duration: 200, ease: 'Back.easeOut' });
    }
  }

  moveToCell(col: number, row: number, animate = true): void {
    const cell = this.board.getCell(col, row);
    if (!cell) return;
    this.board.setOccupied(this.data_.col, this.data_.row, null);
    this.data_.col = col; this.data_.row = row;
    this.origCol = col; this.origRow = row;
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
