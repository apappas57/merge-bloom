import { SIZES, COLORS, s } from '../utils/constants';
import { GeneratorDef } from '../data/chains';
import { Board } from './Board';

export class Generator extends Phaser.GameObjects.Container {
  public genDef: GeneratorDef;
  private board: Board;
  private sprite: Phaser.GameObjects.Image;
  private cooldownGfx: Phaser.GameObjects.Graphics;
  private readyGlow: Phaser.GameObjects.Graphics;
  private shimmerGfx: Phaser.GameObjects.Graphics;
  private isReady = true;
  private cooldownEvent: Phaser.Time.TimerEvent | null = null;
  private shimmerEvent: Phaser.Time.TimerEvent | null = null;
  public col: number;
  public row: number;
  public itemId: string;

  constructor(scene: Phaser.Scene, board: Board, def: GeneratorDef, col: number, row: number, itemId: string) {
    const cell = board.getCell(col, row)!;
    super(scene, cell.x, cell.y);

    this.genDef = def;
    this.board = board;
    this.col = col;
    this.row = row;
    this.itemId = itemId;

    this.readyGlow = scene.add.graphics();
    this.add(this.readyGlow);

    this.shimmerGfx = scene.add.graphics();
    this.add(this.shimmerGfx);

    const half = board.cellDimension / 2;
    const bg = scene.add.graphics();

    // More distinct generator background: diamond-pattern inner + stronger pink
    bg.fillStyle(0xFFD6E8, 0.95);
    bg.fillRoundedRect(-half, -half, half * 2, half * 2, s(12));

    // Inner gradient-like effect: lighter top
    bg.fillStyle(0xFFFFFF, 0.2);
    bg.fillRoundedRect(-half + s(1), -half + s(1), half * 2 - s(2), half - s(1), { tl: s(12), tr: s(12), bl: 0, br: 0 });

    // Thicker, more visible border
    bg.lineStyle(s(2), COLORS.ACCENT_PINK, 0.65);
    bg.strokeRoundedRect(-half, -half, half * 2, half * 2, s(12));

    // Inner accent border
    bg.lineStyle(s(1), 0xFFB0CC, 0.4);
    bg.strokeRoundedRect(-half + s(3), -half + s(3), half * 2 - s(6), half * 2 - s(6), s(10));

    // Small diamond dots pattern inside
    const dotGap = s(8);
    bg.fillStyle(0xFFB8D0, 0.15);
    for (let dx = -half + dotGap; dx < half; dx += dotGap) {
      for (let dy = -half + dotGap; dy < half; dy += dotGap) {
        bg.fillRect(dx - s(0.5), dy - s(0.5), s(1), s(1));
      }
    }

    this.add(bg);

    const key = `gen_${def.id}`;
    this.sprite = scene.add.image(0, 0, key);
    this.sprite.setDisplaySize(SIZES.ITEM_SIZE + s(4), SIZES.ITEM_SIZE + s(4));
    this.add(this.sprite);

    this.cooldownGfx = scene.add.graphics();
    this.add(this.cooldownGfx);

    this.drawReadyGlow();

    this.setSize(board.cellDimension, board.cellDimension);
    this.setInteractive();
    this.on('pointerdown', () => this.onTap());

    board.setOccupied(col, row, itemId);
    scene.add.existing(this);
  }

  private drawReadyGlow(): void {
    this.readyGlow.clear();
    if (!this.isReady) return;

    // Outer glow ring
    this.readyGlow.fillStyle(COLORS.ACCENT_ROSE, 0.18);
    this.readyGlow.fillCircle(0, 0, this.board.cellDimension / 2 + s(5));

    // Inner ring
    this.readyGlow.lineStyle(s(1.5), COLORS.ACCENT_ROSE, 0.3);
    this.readyGlow.strokeCircle(0, 0, this.board.cellDimension / 2 + s(3));

    // Pulse animation on the glow
    this.scene.tweens.add({
      targets: this.readyGlow, alpha: 0.5, scaleX: 1.08, scaleY: 1.08,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Start shimmer animation when ready
    this.startShimmer();
  }

  /** Animated shimmer sweep across the generator when ready */
  private startShimmer(): void {
    this.stopShimmer();
    let shimmerPhase = 0;
    const half = this.board.cellDimension / 2;

    this.shimmerEvent = this.scene.time.addEvent({
      delay: 150, // Reduced from 60ms for better performance with many generators
      loop: true,
      callback: () => {
        if (!this.isReady) { this.shimmerGfx.clear(); return; }
        shimmerPhase += 0.06;
        if (shimmerPhase > Math.PI * 2) shimmerPhase -= Math.PI * 2;

        this.shimmerGfx.clear();
        // A diagonal shimmer band that sweeps across
        const bandX = Math.sin(shimmerPhase) * half * 1.5;
        const bandW = s(8);
        this.shimmerGfx.fillStyle(0xFFFFFF, 0.15 + Math.sin(shimmerPhase) * 0.1);
        // Clip to cell bounds using a skewed rect
        this.shimmerGfx.save();
        this.shimmerGfx.fillRect(bandX - bandW / 2, -half, bandW, half * 2);
        this.shimmerGfx.restore();
      }
    });
  }

  private stopShimmer(): void {
    if (this.shimmerEvent) {
      this.shimmerEvent.destroy();
      this.shimmerEvent = null;
    }
    this.shimmerGfx.clear();
  }

  private onTap(): void {
    if (!this.isReady) return;
    const emptyCell = this.board.findEmptyCellNear(this.col, this.row);
    if (!emptyCell) {
      this.scene.tweens.add({ targets: this, x: this.x - s(5), duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    // Bounce animation on tap
    this.scene.tweens.add({
      targets: this, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true,
      ease: 'Back.easeOut',
    });
    this.scene.events.emit('generator-tapped', this, emptyCell);
    this.startCooldown();
  }

  private startCooldown(): void {
    this.isReady = false;
    this.readyGlow.setAlpha(0);
    this.scene.tweens.killTweensOf(this.readyGlow);
    this.stopShimmer();

    const duration = this.genDef.cooldown;
    let elapsed = 0;
    const half = this.board.cellDimension / 2;
    const radius = half - s(2);

    this.cooldownEvent = this.scene.time.addEvent({
      delay: 50,
      repeat: Math.floor(duration / 50),
      callback: () => {
        elapsed += 50;
        const pct = elapsed / duration;
        this.cooldownGfx.clear();

        // Circular wipe: draw a pie-shaped overlay that shrinks as cooldown progresses
        const remainPct = 1 - pct;
        if (remainPct > 0.001) {
          this.cooldownGfx.fillStyle(0x5C5470, 0.2 * remainPct);
          this.cooldownGfx.beginPath();
          this.cooldownGfx.moveTo(0, 0);
          // Start from top (-PI/2), sweep clockwise by remaining amount
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + Math.PI * 2 * remainPct;
          this.cooldownGfx.arc(0, 0, radius, startAngle, endAngle, false);
          this.cooldownGfx.closePath();
          this.cooldownGfx.fillPath();

          // Circular border showing progress
          this.cooldownGfx.lineStyle(s(2), COLORS.ACCENT_ROSE, 0.4 * pct);
          this.cooldownGfx.beginPath();
          this.cooldownGfx.arc(0, 0, radius, startAngle, startAngle + Math.PI * 2 * pct, false);
          this.cooldownGfx.strokePath();
        }

        if (elapsed >= duration) {
          this.cooldownGfx.clear();
          this.isReady = true;
          this.drawReadyGlow();
          // Ready bounce
          this.scene.tweens.add({ targets: this, scaleX: 1.1, scaleY: 1.1, duration: 150, yoyo: true, ease: 'Back.easeOut' });
        }
      }
    });
  }

  destroy(fromScene?: boolean): void {
    if (this.cooldownEvent) this.cooldownEvent.destroy();
    this.stopShimmer();
    super.destroy(fromScene);
  }
}
