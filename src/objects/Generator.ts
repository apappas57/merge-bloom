import { SIZES, COLORS, s } from '../utils/constants';
import { GeneratorDef } from '../data/chains';
import { Board } from './Board';

export class Generator extends Phaser.GameObjects.Container {
  public genDef: GeneratorDef;
  private board: Board;
  private sprite: Phaser.GameObjects.Image;
  private cooldownGfx: Phaser.GameObjects.Graphics;
  private readyGlow: Phaser.GameObjects.Graphics;
  private isReady = true;
  private cooldownEvent: Phaser.Time.TimerEvent | null = null;
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
    this.drawReadyGlow();

    const half = board.cellDimension / 2;
    const bg = scene.add.graphics();
    bg.fillStyle(0xFFE4EC, 0.9);
    bg.fillRoundedRect(-half, -half, half * 2, half * 2, s(10));
    bg.lineStyle(s(1.5), COLORS.ACCENT_PINK, 0.5);
    bg.strokeRoundedRect(-half, -half, half * 2, half * 2, s(10));
    this.add(bg);

    const key = `gen_${def.id}`;
    this.sprite = scene.add.image(0, 0, key);
    this.sprite.setDisplaySize(SIZES.ITEM_SIZE + s(4), SIZES.ITEM_SIZE + s(4));
    this.add(this.sprite);

    this.cooldownGfx = scene.add.graphics();
    this.add(this.cooldownGfx);

    this.setSize(board.cellDimension, board.cellDimension);
    this.setInteractive();
    this.on('pointerdown', () => this.onTap());

    board.setOccupied(col, row, itemId);
    scene.add.existing(this);
  }

  private drawReadyGlow(): void {
    this.readyGlow.clear();
    if (!this.isReady) return;
    this.readyGlow.fillStyle(COLORS.ACCENT_ROSE, 0.2);
    this.readyGlow.fillCircle(0, 0, this.board.cellDimension / 2 + s(4));
    this.scene.tweens.add({
      targets: this.readyGlow, alpha: 0.5, scaleX: 1.1, scaleY: 1.1,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
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

    const duration = this.genDef.cooldown;
    let elapsed = 0;
    const half = this.board.cellDimension / 2;

    this.cooldownEvent = this.scene.time.addEvent({
      delay: 50,
      repeat: Math.floor(duration / 50),
      callback: () => {
        elapsed += 50;
        const pct = elapsed / duration;
        this.cooldownGfx.clear();
        this.cooldownGfx.fillStyle(0x5C5470, 0.25 * (1 - pct));
        this.cooldownGfx.fillRoundedRect(-half, -half, half * 2, half * 2 * (1 - pct), s(10));
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
    super.destroy(fromScene);
  }
}
