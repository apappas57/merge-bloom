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
  private highlightGfx: Phaser.GameObjects.Graphics;
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
    this.offsetY = SIZES.TOP_BAR + SIZES.ORDER_BAR + SIZES.BOARD_PADDING;

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
    this.highlightGfx = scene.add.graphics();
    this.highlightGfx.setDepth(3);
    this.drawBoard();
  }

  drawBoard(): void {
    this.graphics.clear();
    const pad = SIZES.BOARD_PADDING;
    const bw = this.cols * (this.cellSize + this.gap) - this.gap + pad * 2;
    const bh = this.rows * (this.cellSize + this.gap) - this.gap + pad * 2;
    const bx = this.offsetX - pad;
    const by = this.offsetY - pad;
    const r = SIZES.CORNER_RADIUS + s(10); // Generously rounded board corners

    // ── Outer shadow (board floats above background) ──
    // Soft wide shadow
    this.graphics.fillStyle(COLORS.BOARD_SHADOW, 0.12);
    this.graphics.fillRoundedRect(bx - s(3), by + s(6), bw + s(6), bh + s(4), r + s(4));
    // Closer tighter shadow
    this.graphics.fillStyle(COLORS.BOARD_SHADOW, 0.18);
    this.graphics.fillRoundedRect(bx + s(1), by + s(3), bw + s(2), bh + s(2), r + s(2));

    // ── Board base fill — warm ivory with subtle gradient feel ──
    this.graphics.fillStyle(COLORS.BOARD_BG, 0.92);
    this.graphics.fillRoundedRect(bx, by, bw, bh, r);
    // Warm gradient overlay: lighter at top, slightly deeper at bottom
    this.graphics.fillStyle(0xFFFFFF, 0.12);
    this.graphics.fillRoundedRect(bx, by, bw, bh * 0.35, { tl: r, tr: r, bl: 0, br: 0 });
    this.graphics.fillStyle(COLORS.WOOD_BROWN, 0.06);
    this.graphics.fillRoundedRect(bx, by + bh * 0.65, bw, bh * 0.35, { tl: 0, tr: 0, bl: r, br: r });

    // ── Subtle wood-grain / linen texture (horizontal lines at 3% opacity) ──
    this.graphics.lineStyle(s(0.3), COLORS.WOOD_BROWN, 0.03);
    const lineSpacing = s(4);
    for (let ly = by + s(8); ly < by + bh - s(8); ly += lineSpacing) {
      // Slight wobble for organic feel
      const wobble = Math.sin(ly * 0.05) * s(0.5);
      this.graphics.beginPath();
      this.graphics.moveTo(bx + s(10) + wobble, ly);
      this.graphics.lineTo(bx + bw - s(10) + wobble, ly);
      this.graphics.strokePath();
    }

    // ── Warm golden inner border glow (10% opacity) ──
    this.graphics.lineStyle(s(2.5), COLORS.BOARD_INNER_GLOW, 0.10);
    this.graphics.strokeRoundedRect(bx + s(3), by + s(3), bw - s(6), bh - s(6), r - s(2));
    // Brighter inner highlight along top edge
    this.graphics.lineStyle(s(1), 0xFFFFFF, 0.18);
    this.graphics.strokeRoundedRect(bx + s(1), by + s(1), bw - s(2), bh - s(2), r - s(1));

    // ── Outer border ──
    this.graphics.lineStyle(s(1.5), COLORS.CELL_BORDER, 0.30);
    this.graphics.strokeRoundedRect(bx, by, bw, bh, r);

    // ── Decorative corner flowers (small kawaii 5-petal flowers) ──
    const cornerInset = s(14);
    const flowerR = s(5);
    const corners = [
      { fx: bx + cornerInset, fy: by + cornerInset },         // top-left
      { fx: bx + bw - cornerInset, fy: by + cornerInset },    // top-right
      { fx: bx + cornerInset, fy: by + bh - cornerInset },    // bottom-left
      { fx: bx + bw - cornerInset, fy: by + bh - cornerInset }, // bottom-right
    ];
    for (const { fx, fy } of corners) {
      // Petals
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
        this.graphics.fillStyle(0xF8BBD0, 0.20);
        this.graphics.fillEllipse(
          fx + Math.cos(a) * flowerR * 0.6,
          fy + Math.sin(a) * flowerR * 0.6,
          flowerR * 0.5, flowerR * 0.35
        );
      }
      // Center dot
      this.graphics.fillStyle(COLORS.WARM_GOLD, 0.30);
      this.graphics.fillCircle(fx, fy, flowerR * 0.2);
    }

    // ── Draw cells ──
    const cr = s(12);
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        const cx = cell.x - this.cellSize / 2;
        const cy = cell.y - this.cellSize / 2;

        if (cell.locked) {
          this.graphics.fillStyle(0xE8E0D8, 0.5);
          this.graphics.fillRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);
          this.graphics.lineStyle(s(0.5), 0xD8CCBF, 0.3);
          for (let d = -this.cellSize; d < this.cellSize * 2; d += s(6)) {
            this.graphics.lineBetween(
              Math.max(cx, cx + d), Math.max(cy, cy - d + this.cellSize),
              Math.min(cx + this.cellSize, cx + d + this.cellSize), Math.min(cy + this.cellSize, cy - d)
            );
          }
          continue;
        }

        // Inset shadow (top edge darker — recessed slot look)
        this.graphics.fillStyle(COLORS.CELL_SHADOW, 0.18);
        this.graphics.fillRoundedRect(cx, cy, this.cellSize, s(4), { tl: cr, tr: cr, bl: 0, br: 0 });

        // Cell outer drop shadow
        this.graphics.fillStyle(COLORS.CELL_SHADOW, 0.12);
        this.graphics.fillRoundedRect(cx + s(1), cy + s(2), this.cellSize, this.cellSize, cr);

        // Cell fill — creamy warm white
        this.graphics.fillStyle(COLORS.CELL_BG, 0.90);
        this.graphics.fillRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);

        // Inner gradient: white highlight at top (jewelry box slot)
        this.graphics.fillStyle(0xFFFFFF, 0.28);
        this.graphics.fillRoundedRect(cx + s(2), cy + s(2), this.cellSize - s(4), this.cellSize * 0.35, { tl: cr - s(1), tr: cr - s(1), bl: 0, br: 0 });

        // Inner shadow at bottom edge (recessed inset)
        this.graphics.fillStyle(COLORS.CELL_SHADOW, 0.10);
        this.graphics.fillRoundedRect(cx + s(2), cy + this.cellSize * 0.68, this.cellSize - s(4), this.cellSize * 0.32 - s(2), { tl: 0, tr: 0, bl: cr - s(1), br: cr - s(1) });

        // Left/right edge darkening for inset depth
        this.graphics.fillStyle(COLORS.CELL_SHADOW, 0.05);
        this.graphics.fillRect(cx, cy + cr, s(2), this.cellSize - cr * 2);
        this.graphics.fillRect(cx + this.cellSize - s(2), cy + cr, s(2), this.cellSize - cr * 2);

        // Border — warm tone
        this.graphics.lineStyle(s(1), COLORS.CELL_BORDER, 0.35);
        this.graphics.strokeRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);

        // Top-left inner highlight for glossy feel
        this.graphics.lineStyle(s(0.5), 0xFFFFFF, 0.18);
        this.graphics.strokeRoundedRect(cx + s(1), cy + s(1), this.cellSize - s(2), this.cellSize - s(2), cr - s(1));
      }
    }
  }

  highlightCell(col: number, row: number, color: number): void {
    if (!this.isValid(col, row)) return;
    const cell = this.cells[row][col];
    this.highlightGfx.clear();
    const cx = cell.x - this.cellSize / 2;
    const cy = cell.y - this.cellSize / 2;
    const cr = s(12);

    // Wide soft warm glow halo (golden hour feel)
    this.highlightGfx.fillStyle(COLORS.WARM_GOLD, 0.10);
    this.highlightGfx.fillRoundedRect(cx - s(6), cy - s(6), this.cellSize + s(12), this.cellSize + s(12), cr + s(4));

    // Closer glow ring
    this.highlightGfx.fillStyle(color, 0.18);
    this.highlightGfx.fillRoundedRect(cx - s(3), cy - s(3), this.cellSize + s(6), this.cellSize + s(6), cr + s(2));

    // Main warm highlight fill
    this.highlightGfx.fillStyle(color, 0.35);
    this.highlightGfx.fillRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);

    // Warm golden border stroke
    this.highlightGfx.lineStyle(s(2.5), COLORS.WARM_GOLD, 0.6);
    this.highlightGfx.strokeRoundedRect(cx, cy, this.cellSize, this.cellSize, cr);

    // Inner white glow for depth
    this.highlightGfx.fillStyle(0xFFFFFF, 0.15);
    this.highlightGfx.fillRoundedRect(cx + s(2), cy + s(2), this.cellSize - s(4), this.cellSize * 0.35, { tl: cr - s(1), tr: cr - s(1), bl: 0, br: 0 });

    // Inner highlight ring
    this.highlightGfx.lineStyle(s(1), 0xFFFFFF, 0.22);
    this.highlightGfx.strokeRoundedRect(cx + s(2), cy + s(2), this.cellSize - s(4), this.cellSize - s(4), cr - s(1));
  }

  clearHighlights(): void { this.highlightGfx.clear(); }

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

  findEmptyCellNear(col: number, row: number, exclude?: CellData[]): CellData | null {
    // Only check the 8 immediately adjacent cells (distance 1).
    // If all 8 are occupied, return null — do NOT expand outward.
    const candidates: CellData[] = [];

    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue; // skip self

        const nc = col + dc;
        const nr = row + dr;
        if (!this.isValid(nc, nr)) continue;

        const c = this.cells[nr][nc];
        if (c.occupied || c.locked) continue;
        if (exclude && exclude.some(e => e.col === c.col && e.row === c.row)) continue;

        candidates.push(c);
      }
    }

    if (candidates.length > 0) {
      return candidates[Phaser.Math.Between(0, candidates.length - 1)];
    }

    return null;
  }

  get totalCols() { return this.cols; }
  get totalRows() { return this.rows; }
  get cellDimension() { return this.cellSize; }
  get boardOffsetX() { return this.offsetX; }
  get boardOffsetY() { return this.offsetY; }
  get boardWidth() { return this.cols * (this.cellSize + this.gap) - this.gap + SIZES.BOARD_PADDING * 2; }
  get boardHeight() { return this.rows * (this.cellSize + this.gap) - this.gap + SIZES.BOARD_PADDING * 2; }

  getEmptyCount(): number {
    let n = 0;
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (!this.cells[r][c].occupied && !this.cells[r][c].locked) n++;
    return n;
  }

  destroy(): void { this.graphics.destroy(); this.highlightGfx.destroy(); }
}
