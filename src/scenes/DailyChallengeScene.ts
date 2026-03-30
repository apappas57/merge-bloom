import { Board, CellData } from '../objects/Board';
import { MergeItem, MergeItemData, newItemId } from '../objects/MergeItem';
import { Generator } from '../objects/Generator';
import { MergeSystem } from '../systems/MergeSystem';
import { getTodayChallenge, isTodayCompleted, markTodayCompleted, ChallengeTemplate } from '../data/dailyChallenges';
import { GENERATORS, getChainItem } from '../data/chains';
import { SIZES, COLORS, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';

export class DailyChallengeScene extends Phaser.Scene {
  private board!: Board;
  private mergeSystem!: MergeSystem;
  private items: Map<string, MergeItem> = new Map();
  private generators: Generator[] = [];
  private challenge!: ChallengeTemplate;
  private mergeCount = 0;
  private goalMet = false;

  constructor() { super('DailyChallengeScene'); }

  create() {
    const { width, height } = this.scale;
    this.challenge = getTodayChallenge();
    this.mergeCount = 0;
    this.goalMet = false;

    // Check if already completed
    if (isTodayCompleted()) {
      this.showCompleted(width, height);
      return;
    }

    // Background — slightly different tint from main game
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xFFF8F0, 0xFFF8F0, 0xE8F5E9, 0xE8F5E9, 1);
    bg.fillRect(0, 0, width, height);

    // Header
    const headerH = s(80);
    const headerBg = this.add.graphics();
    headerBg.fillStyle(COLORS.UI_BG, 0.95);
    headerBg.fillRect(0, 0, width, headerH);

    // Daily badge
    this.add.text(s(14), s(14), '📅 Daily Challenge', {
      fontSize: fs(16), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    });

    this.add.text(s(14), s(38), this.challenge.name, {
      fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    });

    // Goal
    const goalItem = getChainItem(this.challenge.goal.chainId, this.challenge.goal.tier);
    this.add.text(width - s(14), s(14), `Goal: ${this.challenge.goal.description}`, {
      fontSize: fs(11), color: TEXT.ACCENT, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(1, 0);

    // Reward preview
    this.add.text(width - s(14), s(34), `🪙${this.challenge.rewardCoins}  ⭐${this.challenge.rewardXP}`, {
      fontSize: fs(10), color: TEXT.GOLD, fontFamily: FONT,
    }).setOrigin(1, 0);

    // Difficulty badge
    const diffColors = { easy: 0xA8E6CF, medium: 0xFFCC80, hard: 0xFFAB91 };
    const diffBadge = this.add.graphics();
    diffBadge.fillStyle(diffColors[this.challenge.difficulty], 1);
    diffBadge.fillRoundedRect(s(14), s(56), s(50), s(16), s(8));
    this.add.text(s(39), s(64), this.challenge.difficulty.toUpperCase(), {
      fontSize: fs(7), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(width - s(14), s(56), '✕ Close', {
      fontSize: fs(11), color: TEXT.SECONDARY, fontFamily: FONT,
    }).setOrigin(1, 0).setInteractive();
    closeBtn.on('pointerdown', () => this.exitScene());

    // Create board — smaller, centered
    // Override SIZES temporarily for the challenge board
    const savedTopBar = SIZES.TOP_BAR;
    const savedOrderBar = SIZES.ORDER_BAR;
    (SIZES as any).TOP_BAR = headerH;
    (SIZES as any).ORDER_BAR = 0;

    this.board = new Board(this, this.challenge.cols, this.challenge.rows);

    (SIZES as any).TOP_BAR = savedTopBar;
    (SIZES as any).ORDER_BAR = savedOrderBar;

    this.mergeSystem = new MergeSystem(this);

    // Place items
    for (const item of this.challenge.items) {
      const data: MergeItemData = { id: newItemId(), chainId: item.chainId, tier: item.tier, col: item.col, row: item.row };
      const mi = new MergeItem(this, this.board, data);
      mi.setDepth(10);
      this.items.set(data.id, mi);
    }

    // Place generators
    if (this.challenge.generators) {
      for (const g of this.challenge.generators) {
        const def = GENERATORS.find(d => d.id === g.genId);
        if (def) {
          const gen = new Generator(this, this.board, def, g.col, g.row, newItemId());
          gen.setDepth(5);
          this.generators.push(gen);
        }
      }
    }

    // Events
    this.events.on('item-dropped', this.handleDrop, this);
    this.events.on('generator-tapped', this.handleGenTap, this);

    // Merge counter
    this.add.text(width / 2, height - s(30), 'Merges: 0', {
      fontSize: fs(11), color: TEXT.SECONDARY, fontFamily: FONT,
    }).setOrigin(0.5);
  }

  private handleDrop(dropped: MergeItem, targetCell: CellData): void {
    const targetId = targetCell.itemId;
    if (targetId) {
      const target = this.items.get(targetId);
      if (target && this.mergeSystem.canMerge(dropped, target)) {
        this.executeMerge(dropped, target);
        return;
      }
      if (this.generators.some(g => g.itemId === targetId)) { dropped.returnToOriginal(); return; }
      if (target) {
        const origCol = dropped.data_.col, origRow = dropped.data_.row;
        this.board.setOccupied(targetCell.col, targetCell.row, null);
        target.moveToCell(origCol, origRow);
        dropped.moveToCell(targetCell.col, targetCell.row);
        return;
      }
    }
    if (!targetCell.occupied && !targetCell.locked) { dropped.moveToCell(targetCell.col, targetCell.row); }
    else { dropped.returnToOriginal(); }
  }

  private async executeMerge(item1: MergeItem, item2: MergeItem): Promise<void> {
    this.items.delete(item1.data_.id);
    this.items.delete(item2.data_.id);
    const result = await this.mergeSystem.executeMerge(item1, item2);
    if (result.success && result.newItem) {
      const newItem = new MergeItem(this, this.board, result.newItem);
      newItem.setDepth(10);
      newItem.playMergeResult();
      this.items.set(result.newItem.id, newItem);
      this.mergeCount++;

      // Check goal
      if (result.newItem.chainId === this.challenge.goal.chainId &&
          result.newItem.tier >= this.challenge.goal.tier && !this.goalMet) {
        this.goalMet = true;
        this.time.delayedCall(500, () => this.showVictory());
      }
    }
  }

  private handleGenTap(_gen: Generator, cell: CellData): void {
    const def = _gen.genDef;
    const c = this.board.getCell(cell.col, cell.row);
    if (!c || c.occupied) return;
    const data: MergeItemData = { id: newItemId(), chainId: def.chainId, tier: def.spawnTier, col: cell.col, row: cell.row };
    const item = new MergeItem(this, this.board, data);
    item.setDepth(10);
    item.playSpawnAnimation();
    this.items.set(data.id, item);
  }

  private showVictory(): void {
    const { width, height } = this.scale;

    markTodayCompleted();

    // Emit rewards to main game
    this.scene.get('GameScene')?.events.emit('daily-challenge-complete', {
      xp: this.challenge.rewardXP,
      coins: this.challenge.rewardCoins,
    });

    // Victory overlay
    const overlay = this.add.graphics().setDepth(5000);
    overlay.fillStyle(0x6D3A5B, 0.5);
    overlay.fillRect(0, 0, width, height);

    const cardW = width * 0.8;
    const cardH = s(200);
    const cx = (width - cardW) / 2;
    const cy = (height - cardH) / 2;

    const card = this.add.graphics().setDepth(5001);
    card.fillStyle(0xFFF8F0, 1);
    card.fillRoundedRect(cx, cy, cardW, cardH, s(20));

    this.add.text(width / 2, cy + s(30), '🎉 Challenge Complete!', {
      fontSize: fs(20), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5).setDepth(5002);

    this.add.text(width / 2, cy + s(60), `${this.challenge.name} — ${this.mergeCount} merges`, {
      fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5).setDepth(5002);

    this.add.text(width / 2, cy + s(90), `+${this.challenge.rewardCoins} 🪙  +${this.challenge.rewardXP} ⭐`, {
      fontSize: fs(18), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5).setDepth(5002);

    // Hearts
    for (let i = 0; i < 10; i++) {
      const h = this.add.text(
        Phaser.Math.Between(s(20), width - s(20)),
        height, ['💕', '✨', '🌸', '💖', '⭐'][Phaser.Math.Between(0, 4)],
        { fontSize: fs(Phaser.Math.Between(12, 20)) }
      ).setOrigin(0.5).setDepth(5003);
      this.tweens.add({
        targets: h, y: -s(20), duration: Phaser.Math.Between(1500, 3000),
        delay: i * 100, onComplete: () => h.destroy(),
      });
    }

    // Done button
    const btnW = s(100), btnH = s(36);
    const btnBg = this.add.graphics().setDepth(5002);
    btnBg.fillStyle(0xFF9CAD, 1);
    btnBg.fillRoundedRect(width / 2 - btnW / 2, cy + cardH - s(50), btnW, btnH, btnH / 2);

    this.add.text(width / 2, cy + cardH - s(32), 'Done 💕', {
      fontSize: fs(13), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5).setDepth(5003);

    const doneZone = this.add.zone(width / 2, cy + cardH - s(32), btnW, btnH).setInteractive().setDepth(5003);
    doneZone.on('pointerdown', () => this.exitScene());
  }

  private showCompleted(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xFFF8F0, 0xFFF8F0, 0xE8F5E9, 0xE8F5E9, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height * 0.35, '✅', { fontSize: fs(48) }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.48, 'Today\'s challenge complete!', {
      fontSize: fs(18), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.55, 'Come back tomorrow for a new puzzle 🌸', {
      fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    const btnW = s(100), btnH = s(36);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xFF9CAD, 1);
    btnBg.fillRoundedRect(width / 2 - btnW / 2, height * 0.65, btnW, btnH, btnH / 2);

    this.add.text(width / 2, height * 0.65 + btnH / 2, 'Back 💕', {
      fontSize: fs(13), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5);

    const zone = this.add.zone(width / 2, height * 0.65 + btnH / 2, btnW, btnH).setInteractive();
    zone.on('pointerdown', () => this.exitScene());
  }

  private exitScene(): void {
    this.events.off('item-dropped');
    this.events.off('generator-tapped');
    this.scene.stop('DailyChallengeScene');
  }
}
