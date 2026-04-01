import { SIZES, COLORS, TIMING, FONT, fs, s } from '../utils/constants';
import { GeneratorDef, GeneratorTierDef, getGenTextureKey, getGenTierDef } from '../data/chains';
import { Board, CellData } from './Board';

const HOLD_THRESHOLD_MS = 200;

export class Generator extends Phaser.GameObjects.Container {
  public genDef: GeneratorDef;
  public genTier: number;
  private currentTierDef: GeneratorTierDef;
  private board: Board;
  private sprite: Phaser.GameObjects.Image;
  private cooldownGfx: Phaser.GameObjects.Graphics;
  private readyGlow: Phaser.GameObjects.Graphics;
  private shimmerGfx: Phaser.GameObjects.Graphics;
  private autoProduceGfx: Phaser.GameObjects.Graphics;
  private tierBadge: Phaser.GameObjects.Text | null = null;
  private isReady = true;
  private cooldownEvent: Phaser.Time.TimerEvent | null = null;
  private shimmerEvent: Phaser.Time.TimerEvent | null = null;
  private autoProduceEvent: Phaser.Time.TimerEvent | null = null;
  public col: number;
  public row: number;
  public itemId: string;

  /** Timestamp of last auto-produce (for save/load offline calculation) */
  public lastAutoProduceTime: number = Date.now();

  // Drag state
  private isDragging = false;
  private holdTimer: Phaser.Time.TimerEvent | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private origCol = 0;
  private origRow = 0;
  private pointerDownTime = 0;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private isPointerOnThis = false;

  constructor(scene: Phaser.Scene, board: Board, def: GeneratorDef, col: number, row: number, itemId: string, genTier: number = 1) {
    const cell = board.getCell(col, row)!;
    super(scene, cell.x, cell.y);

    this.genDef = def;
    this.genTier = genTier;
    this.currentTierDef = getGenTierDef(def, genTier) || def.tiers[0];
    this.board = board;
    this.col = col;
    this.row = row;
    this.origCol = col;
    this.origRow = row;
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

    // Tier-specific visual enhancements
    if (genTier >= 5) {
      // Rainbow border for T5
      const ringW = s(2.5);
      const rainbowColors = [0xFF6B9D, 0xFFD93D, 0x6BCB77, 0x4D96FF, 0xC06CF0];
      for (let i = 0; i < rainbowColors.length; i++) {
        const offset = i * ringW * 0.4;
        bg.lineStyle(ringW, rainbowColors[i], 0.5);
        bg.strokeRoundedRect(-half + offset, -half + offset, half * 2 - offset * 2, half * 2 - offset * 2, s(12));
      }
    } else if (genTier >= 4) {
      // Gold ring + sparkle for T4
      bg.lineStyle(s(2), 0xFFD700, 0.6);
      bg.strokeRoundedRect(-half + s(1), -half + s(1), half * 2 - s(2), half * 2 - s(2), s(12));
    } else if (genTier >= 3) {
      // Gold ring for T3
      bg.lineStyle(s(1.5), 0xFFD700, 0.45);
      bg.strokeRoundedRect(-half + s(1), -half + s(1), half * 2 - s(2), half * 2 - s(2), s(12));
    } else if (genTier >= 2) {
      // Silver ring for T2
      bg.lineStyle(s(1.5), 0xC0C0C0, 0.45);
      bg.strokeRoundedRect(-half + s(1), -half + s(1), half * 2 - s(2), half * 2 - s(2), s(12));
    }

    this.add(bg);

    const key = getGenTextureKey(def.id, genTier);
    this.sprite = scene.add.image(0, 0, key);
    this.sprite.setDisplaySize(SIZES.ITEM_SIZE + s(4), SIZES.ITEM_SIZE + s(4));
    this.add(this.sprite);

    this.cooldownGfx = scene.add.graphics();
    this.add(this.cooldownGfx);

    // Auto-produce progress ring (drawn outside the cell glow)
    this.autoProduceGfx = scene.add.graphics();
    this.add(this.autoProduceGfx);

    // Tier badge (II, III, IV, V) - T1 has no badge
    if (genTier >= 2) {
      const romanNumerals = ['', '', 'II', 'III', 'IV', 'V'];
      const badgeColor = genTier >= 5 ? '#FF6B9D' : genTier >= 4 ? '#FFD700' : genTier >= 3 ? '#FFD700' : '#C0C0C0';
      this.tierBadge = scene.add.text(half - s(4), half - s(4), romanNumerals[genTier], {
        fontSize: fs(8),
        color: badgeColor,
        fontFamily: FONT,
        fontStyle: '700',
        stroke: '#FFFFFF',
        strokeThickness: s(2),
      }).setOrigin(1, 1);
      this.add(this.tierBadge);
    }

    this.drawReadyGlow();

    this.setSize(board.cellDimension, board.cellDimension);
    this.setInteractive();
    this.setupInput();

    board.setOccupied(col, row, itemId);
    scene.add.existing(this);

    // Start the auto-produce timer
    this.startAutoProduceTimer();
  }

  /** Check if two generators can merge */
  static canMergeGenerators(a: Generator, b: Generator): boolean {
    if (a.genDef.id !== b.genDef.id) return false;
    if (a.genTier !== b.genTier) return false;
    if (a.genTier >= a.genDef.maxTier) return false;
    return true;
  }

  /** Roll a spawn tier from the drop table */
  rollSpawnTier(): number {
    const table = this.currentTierDef.spawnTable;
    const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of table) {
      roll -= entry.weight;
      if (roll <= 0) return entry.tier;
    }
    return table[0].tier;
  }

  /** Check for multi-spawn */
  rollMultiSpawn(): boolean {
    return Math.random() < this.currentTierDef.multiSpawnChance;
  }

  /** Get the current cooldown duration based on tier */
  getCooldownMs(): number {
    return this.currentTierDef.cooldown;
  }

  /** Get the auto-produce interval for this generator's tier */
  getAutoProduceIntervalMs(): number {
    return TIMING.AUTO_PRODUCE[this.genTier] ?? TIMING.AUTO_PRODUCE[1];
  }

  private drawReadyGlow(): void {
    this.readyGlow.clear();
    if (!this.isReady) return;

    // Outer glow ring - stronger for higher tiers
    const glowAlpha = 0.18 + this.genTier * 0.03;
    this.readyGlow.fillStyle(COLORS.ACCENT_ROSE, glowAlpha);
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

  /** Animated chrome metallic shimmer sweep across the generator when ready */
  private startShimmer(): void {
    this.stopShimmer();
    let shimmerPhase = 0;
    const half = this.board.cellDimension / 2;

    this.shimmerEvent = this.scene.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        if (!this.isReady) { this.shimmerGfx.clear(); return; }
        shimmerPhase += 0.07;
        if (shimmerPhase > Math.PI * 2) shimmerPhase -= Math.PI * 2;

        this.shimmerGfx.clear();

        // Primary chrome highlight band
        const bandX = Math.sin(shimmerPhase) * half * 1.6;
        const bandW = s(5);
        this.shimmerGfx.fillStyle(0xFFFFFF, 0.28 + Math.sin(shimmerPhase) * 0.12);
        this.shimmerGfx.fillRect(bandX - bandW / 2, -half, bandW, half * 2);

        // Chrome pink secondary band
        const band2X = Math.sin(shimmerPhase - 0.4) * half * 1.4;
        this.shimmerGfx.fillStyle(0xE8A4C8, 0.12 + Math.sin(shimmerPhase) * 0.06);
        this.shimmerGfx.fillRect(band2X - bandW, -half, bandW * 2, half * 2);

        // Thin bright leading edge
        const edgeX = Math.sin(shimmerPhase + 0.15) * half * 1.6;
        this.shimmerGfx.fillStyle(0xFFFFFF, 0.35);
        this.shimmerGfx.fillRect(edgeX - s(1), -half, s(2), half * 2);
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

  // ─── Auto-produce Timer ───

  /** Start the auto-produce timer with a visible progress ring */
  private startAutoProduceTimer(): void {
    this.stopAutoProduceTimer();

    const interval = this.getAutoProduceIntervalMs();
    let elapsed = 0;
    const half = this.board.cellDimension / 2;
    const ringRadius = half + s(7);
    const ringWidth = s(2);

    this.autoProduceEvent = this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        elapsed += 100;
        const pct = Math.min(elapsed / interval, 1);

        // Draw progress ring
        this.autoProduceGfx.clear();

        if (pct < 1) {
          // Background ring track (subtle)
          this.autoProduceGfx.lineStyle(ringWidth, 0x25C486, 0.1);
          this.autoProduceGfx.beginPath();
          this.autoProduceGfx.arc(0, 0, ringRadius, 0, Math.PI * 2, false);
          this.autoProduceGfx.strokePath();

          // Filled progress arc (soft green/teal)
          if (pct > 0.001) {
            this.autoProduceGfx.lineStyle(ringWidth, 0x25C486, 0.35);
            this.autoProduceGfx.beginPath();
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + Math.PI * 2 * pct;
            this.autoProduceGfx.arc(0, 0, ringRadius, startAngle, endAngle, false);
            this.autoProduceGfx.strokePath();
          }
        }

        if (pct >= 1) {
          // Timer complete: attempt auto-spawn
          elapsed = 0;
          this.autoProduceGfx.clear();
          this.attemptAutoProduce();
        }
      }
    });
  }

  private stopAutoProduceTimer(): void {
    if (this.autoProduceEvent) {
      this.autoProduceEvent.destroy();
      this.autoProduceEvent = null;
    }
    this.autoProduceGfx.clear();
  }

  /** Attempt to auto-produce an item. Only succeeds if board has space (<90% full). */
  private attemptAutoProduce(): void {
    // Check board fullness: pause if 90%+ full
    const totalCells = this.board.totalCols * this.board.totalRows;
    const emptyCount = this.board.getEmptyCount();
    const fullPct = 1 - (emptyCount / totalCells);
    if (fullPct >= TIMING.AUTO_PRODUCE_BOARD_FULL_PCT) return;

    const emptyCell = this.board.findEmptyCellNear(this.col, this.row);
    if (!emptyCell) return;

    const spawnTier = this.rollSpawnTier();
    // NO multi-spawn on auto-produce
    this.scene.events.emit('auto-produce', this, emptyCell, spawnTier);
    this.lastAutoProduceTime = Date.now();

    // Brief pulse on the progress ring to indicate spawn
    this.playAutoProducePulse();
  }

  /** Visual pulse when auto-produce fires */
  private playAutoProducePulse(): void {
    const half = this.board.cellDimension / 2;
    const pulseGfx = this.scene.add.graphics();
    pulseGfx.lineStyle(s(2.5), 0x25C486, 0.6);
    pulseGfx.strokeCircle(0, 0, half + s(7));
    this.add(pulseGfx);

    this.scene.tweens.add({
      targets: pulseGfx,
      alpha: 0, scaleX: 1.3, scaleY: 1.3,
      duration: 400, ease: 'Power2',
      onComplete: () => { pulseGfx.destroy(); }
    });
  }

  private setupInput(): void {
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerDownTime = pointer.time;
      this.pointerDownX = pointer.x;
      this.pointerDownY = pointer.y;
      this.dragStartX = this.x;
      this.dragStartY = this.y;
      this.origCol = this.col;
      this.origRow = this.row;
      this.isPointerOnThis = true;

      // Start a hold timer for drag initiation
      if (this.holdTimer) this.holdTimer.destroy();
      this.holdTimer = this.scene.time.delayedCall(HOLD_THRESHOLD_MS, () => {
        if (this.isPointerOnThis && !this.isDragging) {
          this.isDragging = true;
          this.setDepth(1000);
          this.scene.tweens.add({
            targets: this, scaleX: 1.15, scaleY: 1.15, duration: 100, ease: 'Back.easeOut',
          });
          this.board.setOccupied(this.col, this.row, null);
        }
      });
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !this.isPointerOnThis) return;
      this.x = pointer.x;
      this.y = pointer.y;

      // Highlight valid drop targets
      const cell = this.board.getCellAt(pointer.x, pointer.y);
      if (cell) {
        this.board.highlightCell(cell.col, cell.row, COLORS.CELL_VALID);
      } else {
        this.board.clearHighlights();
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPointerOnThis) return;
      this.isPointerOnThis = false;

      if (this.holdTimer) {
        this.holdTimer.destroy();
        this.holdTimer = null;
      }

      if (this.isDragging) {
        this.isDragging = false;
        this.setDepth(5);
        this.board.clearHighlights();
        this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 100 });

        const cell = this.board.getCellAt(pointer.x, pointer.y);
        if (cell) {
          this.scene.events.emit('generator-dropped', this, cell);
        } else {
          this.returnToOriginal();
        }
        return;
      }

      // If not dragging and this was a quick tap, treat as spawn tap
      const elapsed = pointer.time - this.pointerDownTime;
      const movedDist = Math.abs(pointer.x - this.pointerDownX) + Math.abs(pointer.y - this.pointerDownY);
      if (elapsed < HOLD_THRESHOLD_MS + 50 && movedDist < s(10)) {
        this.onTap();
      }
    });
  }

  private onTap(): void {
    if (!this.isReady) return;
    const emptyCell = this.board.findEmptyCellNear(this.col, this.row);
    if (!emptyCell) {
      // Shake the generator to show it can't spawn
      this.scene.tweens.add({ targets: this, x: this.x - s(5), duration: 50, yoyo: true, repeat: 3 });
      this.scene.events.emit('board-full');
      return;
    }

    // Bounce animation on tap
    this.scene.tweens.add({
      targets: this, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true,
      ease: 'Back.easeOut',
    });

    const spawnTier = this.rollSpawnTier();
    this.scene.events.emit('generator-tapped', this, emptyCell, spawnTier);

    // Multi-spawn: find second empty cell
    if (this.rollMultiSpawn()) {
      const secondCell = this.board.findEmptyCellNear(this.col, this.row, [emptyCell]);
      if (secondCell) {
        const secondTier = this.rollSpawnTier();
        // Slight delay for second spawn to make it feel sequential
        this.scene.time.delayedCall(80, () => {
          this.scene.events.emit('generator-tapped', this, secondCell, secondTier);
        });
      }
    }

    this.startCooldown();
  }

  public returnToOriginal(): void {
    const cell = this.board.getCell(this.origCol, this.origRow);
    if (cell) {
      this.board.setOccupied(this.origCol, this.origRow, this.itemId);
      this.col = this.origCol;
      this.row = this.origRow;
      this.scene.tweens.add({ targets: this, x: cell.x, y: cell.y, duration: 200, ease: 'Back.easeOut' });
    }
  }

  public moveToCell(col: number, row: number, animate = true): void {
    const cell = this.board.getCell(col, row);
    if (!cell) return;
    this.board.setOccupied(this.col, this.row, null);
    this.col = col;
    this.row = row;
    this.origCol = col;
    this.origRow = row;
    this.board.setOccupied(col, row, this.itemId);
    if (animate) {
      this.scene.tweens.add({ targets: this, x: cell.x, y: cell.y, duration: 150, ease: 'Power2' });
    } else {
      this.x = cell.x;
      this.y = cell.y;
    }
  }

  public playMergeAway(): Promise<void> {
    return new Promise(resolve => {
      this.board.setOccupied(this.col, this.row, null);
      this.disableInteractive();
      this.scene.tweens.add({
        targets: this, scaleX: 0, scaleY: 0, alpha: 0,
        duration: TIMING.MERGE_DURATION, ease: 'Back.easeIn',
        onComplete: () => { this.destroy(); resolve(); }
      });
    });
  }

  private startCooldown(): void {
    this.isReady = false;
    this.readyGlow.setAlpha(0);
    this.scene.tweens.killTweensOf(this.readyGlow);
    this.stopShimmer();

    const duration = this.getCooldownMs();
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

        const remainPct = 1 - pct;
        if (remainPct > 0.001) {
          this.cooldownGfx.fillStyle(0x5C5470, 0.2 * remainPct);
          this.cooldownGfx.beginPath();
          this.cooldownGfx.moveTo(0, 0);
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + Math.PI * 2 * remainPct;
          this.cooldownGfx.arc(0, 0, radius, startAngle, endAngle, false);
          this.cooldownGfx.closePath();
          this.cooldownGfx.fillPath();

          this.cooldownGfx.lineStyle(s(2), COLORS.ACCENT_ROSE, 0.4 * pct);
          this.cooldownGfx.beginPath();
          this.cooldownGfx.arc(0, 0, radius, startAngle, startAngle + Math.PI * 2 * pct, false);
          this.cooldownGfx.strokePath();
        }

        if (elapsed >= duration) {
          this.cooldownGfx.clear();
          this.isReady = true;
          this.drawReadyGlow();
          this.scene.tweens.add({ targets: this, scaleX: 1.1, scaleY: 1.1, duration: 150, yoyo: true, ease: 'Back.easeOut' });
        }
      }
    });
  }

  destroy(fromScene?: boolean): void {
    if (this.cooldownEvent) this.cooldownEvent.destroy();
    if (this.holdTimer) this.holdTimer.destroy();
    this.stopShimmer();
    this.stopAutoProduceTimer();
    super.destroy(fromScene);
  }
}
