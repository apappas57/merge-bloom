import { SIZES, COLORS, s } from '../utils/constants';

export interface CellData {
  col: number;
  row: number;
  x: number;
  y: number;
  occupied: boolean;
  locked: boolean;
  itemId: string | null;
}

export class Board {
  private scene: Phaser.Scene;
  private cells: CellData[][] = [];
  private graphics: Phaser.GameObjects.Graphics;
  private cols: number;
  private rows: number;
  private offsetX: number;
  private offsetY: number;
  private cellSize: number;
  private gap: number;

  constructor(scene: Phaser.Scene, cols: number, rows: number) {
    this.scene = scene;
    this.cols = cols;
    this.rows = rows;
    this.gap = SIZES.CELL_GAP;

    const { width } = scene.scale;
    const availableWidth = width - SIZES.BOARD_PADDING * 2;
    this.cellSize = Math.floor((availableWidth - (cols - 1) * this.gap) / cols);
    if (this.cellSize > SIZES.CELL) this.cellSize = SIZES.CELL;

    const boardWidth = cols * (this.cellSize + this.gap) - this.gap;
    const boardHeight = rows * (this.cellSize + this.gap) - this.gap;
    this.offsetX = (width - boardWidth) / 2;
    this.offsetY = SIZES.TOP_BAR + SIZES.QUEST_BAR + SIZES.BOARD_PADDING;

    for (let row = 0; row < rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < cols; col++) {
        this.cells[row][col] = {
          col, row,
          x: this.offsetX + col * (this.cellSize + this.gap) + this.cellSize / 2,
          y: this.offsetY + row * (this.cellSize + this.gap) + this.cellSize / 2,
          occupied: false, locked: false, itemId: null,
        };
      }
    }

    this.graphics = scene.add.graphics();
    this.drawBoard();
  }

  drawBoard(): void {
    this.graphics.clear();
    const pad = SIZES.BOARD_PADDING;
    const bw = this.cols * (this.cellSize + this.gap) - this.gap + pad * 2;
    const bh = this.rows * (this.cellSize + this.gap) - this.gap + pad * 2;
    const bx = this.offsetX - pad;
    const by = this.offsetY - pad;
    const r = SIZES.CORNER_RADIUS;

    // Board background — soft mint with subtle shadow
    this.graphics.fillStyle(COLORS.BOARD_BG, 0.6);
    this.graphics.fillRoundedRect(bx + s(2), by + s(3), bw, bh, r + s(4));

    this.graphics.fillStyle(COLORS.BOARD_BG, 0.85);
    this.graphics.fillRoundedRect(bx, by, bw, bh, r + s(4));

    // Soft border
    this.graphics.lineStyle(s(1.5), COLORS.CELL_BORDER, 0.3);
    this.graphics.strokeRoundedRect(bx, by, bw, bh, r + s(4));

    const cr = s(10);
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        const cx = cell.x - this.cellSize / 2;
        const cy = cell.y - this.cellSize / 2;

        if (cell.locked) {
          this.graphics.fillStyle(0xE0D8E8, 0.5);
          this.graphics.fillRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);
          continue;
        }

        // Cell shadow
        this.graphics.fillStyle(COLORS.CELL_SHADOW, 0.15);
        this.graphics.fillRoundedRect(cx + s(1), cy + s(2), this.cellSize, this.cellSize, cr);

        // Cell fill — pale lavender
        this.graphics.fillStyle(COLORS.CELL_BG, 0.8);
        this.graphics.fillRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);

        // Inner highlight (top half, lighter)
        this.graphics.fillStyle(0xFFFFFF, 0.15);
        this.graphics.fillRoundedRect(cx + s(1), cy + s(1), this.cellSize - s(2), this.cellSize / 2, { tl: cr, tr: cr, bl: 0, br: 0 });

        // Border
        this.graphics.lineStyle(s(1), COLORS.CELL_BORDER, 0.35);
        this.graphics.strokeRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);
      }
    }
  }

  highlightCell(col: number, row: number, color: number): void {
    if (!this.isValid(col, row)) return;
    const cell = this.cells[row][col];
    this.drawBoard();
    const cx = cell.x - this.cellSize / 2;
    const cy = cell.y - this.cellSize / 2;
    const cr = s(10);
    this.graphics.fillStyle(color, 0.4);
    this.graphics.fillRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);
    this.graphics.lineStyle(s(2), color, 0.6);
    this.graphics.strokeRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);
  }

  clearHighlights(): void { this.drawBoard(); }

  getCellAt(worldX: number, worldY: number): CellData | null {
    const half = this.cellSize / 2;
    for (let row = 0; row < this.rows; row++)
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        if (worldX >= cell.x - half && worldX <= cell.x + half &&
            worldY >= cell.y - half && worldY <= cell.y + half) return cell;
      }
    return null;
  }

  getCell(col: number, row: number): CellData | null {
    if (!this.isValid(col, row)) return null;
    return this.cells[row][col];
  }

  isValid(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  setOccupied(col: number, row: number, itemId: string | null): void {
    if (!this.isValid(col, row)) return;
    this.cells[row][col].occupied = itemId !== null;
    this.cells[row][col].itemId = itemId;
  }

  findEmptyCell(): CellData | null {
    const empty: CellData[] = [];
    for (let row = 0; row < this.rows; row++)
      for (let col = 0; col < this.cols; col++) {
        const c = this.cells[row][col];
        if (!c.occupied && !c.locked) empty.push(c);
      }
    if (empty.length === 0) return null;
    return empty[Phaser.Math.Between(0, empty.length - 1)];
  }

  findEmptyCellNear(col: number, row: number): CellData | null {
    const dirs = [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dc, dr] of dirs) {
      const nc = col + dc, nr = row + dr;
      if (this.isValid(nc, nr)) {
        const c = this.cells[nr][nc];
        if (!c.occupied && !c.locked) return c;
      }
    }
    return this.findEmptyCell();
  }

  get totalCols() { return this.cols; }
  get totalRows() { return this.rows; }
  get cellDimension() { return this.cellSize; }

  getEmptyCount(): number {
    let n = 0;
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (!this.cells[r][c].occupied && !this.cells[r][c].locked) n++;
    return n;
  }

  destroy(): void { this.graphics.destroy(); }
}
