import { Board, CellData } from '../objects/Board';
import { MergeItem, MergeItemData, newItemId } from '../objects/MergeItem';
import { Generator } from '../objects/Generator';
import { Mascot } from '../objects/Mascot';
import { StorageTray } from '../objects/StorageTray';
import { MergeSystem } from '../systems/MergeSystem';
import { QuestSystem, ActiveQuest } from '../systems/QuestSystem';
import { HintSystem } from '../systems/HintSystem';
import { AchievementSystem } from '../systems/AchievementSystem';
import { AchievementDef } from '../data/achievements';
import { OrderSystem } from '../systems/OrderSystem';
import { SaveSystem, SaveData, LoginData, DAILY_REWARDS } from '../systems/SaveSystem';
import { GENERATORS, getNextInChain, getChainItem, isMaxTier, getChain } from '../data/chains';
import { GardenDecorationManager, GardenDecoData } from '../objects/GardenDecoration';
import { SIZES, COLORS, TIMING, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';
import { SoundManager } from '../utils/SoundManager';

/** Chain colors for preview tooltip backgrounds */
const PREVIEW_CHAIN_COLORS: Record<string, number> = {
  flower: 0xF8BBD0, butterfly: 0xB3E5FC, fruit: 0xFFCCBC, crystal: 0xD1C4E9,
  nature: 0xC8E6C9, star: 0xFFF9C4, tea: 0xD7CCC8, shell: 0xB2EBF2,
  sweet: 0xF8BBD0, love: 0xFFB3C6, cosmic: 0xD1C4E9, cafe: 0xEFEBE9,
};

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private mergeSystem!: MergeSystem;
  private questSystem!: QuestSystem;
  private hintSystem!: HintSystem;
  private achievementSystem!: AchievementSystem;
  private orderSystem!: OrderSystem;
  private gardenManager!: GardenDecorationManager;
  public sound_!: SoundManager;
  private mascot!: Mascot;
  private storageTray!: StorageTray;

  private items: Map<string, MergeItem> = new Map();
  private generators: Generator[] = [];
  private isMerging = false;
  private previewContainer: Phaser.GameObjects.Container | null = null;
  private loginData: LoginData = { lastLoginDate: '', loginStreak: 0, lastClaimedDate: '' };

  public playerLevel = 1;
  private playerXP = 0;
  private xpToNext = 100;
  public gems = 99999;
  private totalMerges = 0;
  private collection: Map<string, number> = new Map();

  constructor() { super('GameScene'); }

  create() {
    const { width, height } = this.scale;

    this.drawBackground(width, height);
    this.createAmbientSparkles(width, height);

    this.board = new Board(this, 6, 8);
    this.mergeSystem = new MergeSystem(this);
    this.questSystem = new QuestSystem(this.playerLevel);

    // Storage tray — positioned between board and bottom bar
    const boardBottom = SIZES.TOP_BAR + SIZES.ORDER_BAR + SIZES.BOARD_PADDING
      + 8 * (this.board.cellDimension + SIZES.CELL_GAP) - SIZES.CELL_GAP + SIZES.BOARD_PADDING;
    const trayY = boardBottom + s(28);
    this.storageTray = new StorageTray(this, trayY);

    // Sound manager
    this.sound_ = new SoundManager(this);

    // Garden decoration manager
    this.gardenManager = new GardenDecorationManager(this, {
      x: 0, y: SIZES.TOP_BAR, w: width, h: height - SIZES.TOP_BAR - SIZES.BOTTOM_BAR
    });

    // Mascot — top-left, tucked into the order bar area
    this.mascot = new Mascot(this, s(24), SIZES.TOP_BAR + s(8));

    const save = SaveSystem.load();
    if (save) { this.loadSave(save); } else { this.startFresh(); }

    // Systems
    this.hintSystem = new HintSystem(this, this.board, this.items);
    this.achievementSystem = new AchievementSystem(this);
    this.achievementSystem.initialize(save?.achievements);
    this.orderSystem = new OrderSystem(this.playerLevel);
    this.orderSystem.initialize(save?.orders || undefined);

    // Events
    this.events.on('item-dropped', this.handleDrop, this);
    this.events.on('generator-tapped', this.handleGenTap, this);
    this.events.on('generator-dropped', this.handleGenDrop, this);
    this.events.on('board-full', this.handleBoardFull, this);
    this.events.on('shop-buy-generator', this.onBuyGenerator, this);
    this.events.on('storage-retrieve', this.onStorageRetrieve, this);
    this.events.on('claim-order', this.onClaimOrder, this);
    this.events.on('item-preview', this.showChainPreview, this);
    this.events.on('daily-challenge-complete', (reward: { xp: number; coins: number }) => {
      this.addXP(reward.xp);
      this.orderSystem.coins += reward.coins;
      this.mascot.showSpeech('Daily done! 🎉', 3000);
      this.updateUI();
      this.saveGame();
    });

    // Drag sounds -- pickup on drag start
    this.input.on('dragstart', () => { this.sound_.pickup(); });

    this.scene.launch('UIScene', {
      gems: this.gems, coins: this.orderSystem.coins, level: this.playerLevel,
      xp: this.playerXP, xpToNext: this.xpToNext,
      quests: this.questSystem.getActiveQuests(),
      orders: this.orderSystem.getActiveOrders(),
    });

    this.time.addEvent({ delay: TIMING.AUTOSAVE, loop: true, callback: () => this.saveGame() });

    // Save on app background — store ref for cleanup
    const visHandler = () => { if (document.hidden) this.saveGame(); };
    document.addEventListener('visibilitychange', visHandler);
    this.events.once('shutdown', () => document.removeEventListener('visibilitychange', visHandler));

    // Mascot greeting
    this.time.delayedCall(1500, () => {
      const greetings = ['Welcome back! 🌸', 'Let\'s garden! ✨', 'Hi there! 💕', 'Ready to merge? 🌷'];
      this.mascot.showSpeech(greetings[Phaser.Math.Between(0, greetings.length - 1)], 3000);
    });

    // Mascot sleep timer
    this.time.addEvent({
      delay: 5000, loop: true,
      callback: () => {
        if (Date.now() - (this.hintSystem as any).lastInteraction > 30000) {
          this.mascot.goToSleep();
        }
      }
    });

    // Wake mascot on input
    this.input.on('pointerdown', () => this.mascot.wakeUp());

    this.cameras.main.fadeIn(400, 255, 240, 245);

    // Trash zone — drag items to bottom-right to delete
    this.createTrashZone(width, height);

    // First-play tutorial
    if (!save) this.showTutorial(width, height);

    // Daily login reward check (delay so scene fully renders first)
    this.time.delayedCall(800, () => this.checkDailyLogin());
  }

  private createTrashZone(width: number, height: number): void {
    const trashY = height - SIZES.BOTTOM_BAR - s(38);
    const trashX = width - s(32);
    const trashIcon = this.add.text(trashX, trashY, '🗑️', { fontSize: fs(16) })
      .setOrigin(0.5).setAlpha(0.3).setDepth(4);
    const trashLabel = this.add.text(trashX, trashY + s(14), 'Trash', {
      fontSize: fs(7), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5).setAlpha(0.3).setDepth(4);

    // Listen for drags near trash zone
    this.events.on('item-near-trash', (near: boolean) => {
      trashIcon.setAlpha(near ? 0.9 : 0.3);
      trashLabel.setAlpha(near ? 0.9 : 0.3);
      if (near) {
        trashIcon.setScale(1.2);
      } else {
        trashIcon.setScale(1);
      }
    });
  }

  private showTutorial(_width: number, _height: number): void {
    const { width, height } = this.scale;

    // Semi-transparent overlay
    const overlay = this.add.graphics().setDepth(5000);
    overlay.fillStyle(0x6D3A5B, 0.5);
    overlay.fillRect(0, 0, width, height);

    const steps = [
      { text: '🌸 Welcome to m3rg3r!\n\nTap generators to spawn items', y: height * 0.3 },
      { text: '✨ Drag matching items\nonto each other to merge!', y: height * 0.4 },
      { text: '💕 Keep merging to discover\nbeautiful new items!', y: height * 0.5 },
      { text: '🗑️ Drag items to the trash\nto free up space', y: height * 0.6 },
    ];

    let step = 0;

    const textObj = this.add.text(width / 2, steps[0].y, steps[0].text, {
      fontSize: fs(16), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
      align: 'center', lineSpacing: s(6),
      backgroundColor: 'rgba(109,58,91,0.85)', padding: { x: s(20), y: s(16) },
    }).setOrigin(0.5).setDepth(5001);

    const tapHint = this.add.text(width / 2, steps[0].y + s(60), 'Tap to continue', {
      fontSize: fs(11), color: 'rgba(255,255,255,0.6)', fontFamily: FONT_BODY,
    }).setOrigin(0.5).setDepth(5001);
    this.tweens.add({ targets: tapHint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

    const advanceZone = this.add.zone(width / 2, height / 2, width, height).setInteractive().setDepth(5002);
    advanceZone.on('pointerdown', () => {
      step++;
      if (step >= steps.length) {
        overlay.destroy();
        textObj.destroy();
        tapHint.destroy();
        advanceZone.destroy();
        this.mascot.showSpeech('Let\'s bloom! 🌸', 3000);
        return;
      }
      textObj.setText(steps[step].text);
      textObj.setY(steps[step].y);
      tapHint.setY(steps[step].y + s(60));
    });
  }

  private drawBackground(width: number, height: number): void {
    const hour = new Date().getHours();
    let topColor: number, botColor: number;
    if (hour >= 6 && hour < 12) { topColor = 0xFFF0F5; botColor = 0xFCE4EC; }
    else if (hour >= 12 && hour < 17) { topColor = 0xFCE4EC; botColor = 0xFFF0F5; }
    else if (hour >= 17 && hour < 21) { topColor = 0xFFF0F5; botColor = 0xF3E5F5; }
    else { topColor = 0xF3E5F5; botColor = 0xEDE7F6; }

    const bg = this.add.graphics();
    bg.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
    bg.fillRect(0, 0, width, height);
  }

  private createAmbientSparkles(width: number, height: number): void {
    const sparkles = ['💕', '✨', '🌸', '💗', '⭐', '🎀', '💖'];

    // Original emoji sparkles (slightly fewer to make room for star graphics)
    for (let i = 0; i < 4; i++) {
      const e = sparkles[Phaser.Math.Between(0, sparkles.length - 1)];
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR);
      const t = this.add.text(x, y, e, { fontSize: fs(Phaser.Math.Between(8, 14)) })
        .setOrigin(0.5).setAlpha(0.08).setDepth(0);
      this.tweens.add({
        targets: t, y: y - s(Phaser.Math.Between(40, 100)), alpha: 0,
        duration: Phaser.Math.Between(5000, 10000), delay: Phaser.Math.Between(0, 5000),
        repeat: -1,
        onRepeat: () => {
          t.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR));
          t.setAlpha(0.08);
        },
      });
    }

    // Canvas-drawn 4-point star sparkles with drift animation
    const starColors = [0xFF6B9D, 0xFFD93D, 0xD4A5FF, 0x87CEEB, 0xE8A4C8];
    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics().setDepth(0);
      const color = starColors[Phaser.Math.Between(0, starColors.length - 1)];
      const starSize = s(Phaser.Math.Between(3, 6));

      // Draw a 4-point star
      g.fillStyle(color, 0.7);
      g.beginPath();
      g.moveTo(0, -starSize * 1.5);
      g.lineTo(starSize * 0.35, -starSize * 0.35);
      g.lineTo(starSize * 1.5, 0);
      g.lineTo(starSize * 0.35, starSize * 0.35);
      g.lineTo(0, starSize * 1.5);
      g.lineTo(-starSize * 0.35, starSize * 0.35);
      g.lineTo(-starSize * 1.5, 0);
      g.lineTo(-starSize * 0.35, -starSize * 0.35);
      g.closePath();
      g.fillPath();

      const startX = Phaser.Math.Between(0, width);
      const startY = Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR);
      g.setPosition(startX, startY).setAlpha(0.1);

      // Drift up with horizontal sway
      const driftX = Phaser.Math.Between(-30, 30);
      this.tweens.add({
        targets: g,
        y: startY - s(Phaser.Math.Between(50, 120)),
        x: startX + s(driftX),
        alpha: 0,
        scaleX: { from: 0.5, to: 1.2 },
        scaleY: { from: 0.5, to: 1.2 },
        duration: Phaser.Math.Between(6000, 12000),
        delay: Phaser.Math.Between(0, 6000),
        repeat: -1,
        onRepeat: () => {
          const newX = Phaser.Math.Between(0, width);
          const newY = Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR);
          g.setPosition(newX, newY);
          g.setAlpha(0.1);
          g.setScale(0.5);
        },
      });
    }
  }

  private startFresh(): void {
    this.questSystem.initialize();
    const flowerGen = GENERATORS.find(g => g.id === 'gen_flower')!;
    const butterflyGen = GENERATORS.find(g => g.id === 'gen_butterfly')!;
    this.createGenerator(flowerGen, 1, 0);
    this.createGenerator(butterflyGen, 4, 0);
    this.spawnItem('flower', 1, 2, 3);
    this.spawnItem('flower', 1, 3, 3);
    this.spawnItem('flower', 2, 2, 4);
    this.spawnItem('butterfly', 1, 3, 4);
    this.spawnItem('butterfly', 1, 4, 4);
  }

  private loadSave(data: SaveData): void {
    this.playerLevel = data.player.level;
    this.playerXP = data.player.xp;
    this.xpToNext = data.player.xpToNext;
    this.gems = data.player.gems;
    this.totalMerges = data.player.totalMerges;
    for (const c of data.collection) this.collection.set(c.chainId, c.maxTier);
    for (const g of data.board.generators) {
      const def = GENERATORS.find(d => d.id === g.genId);
      if (def) this.createGenerator(def, g.col, g.row, g.itemId, g.genTier ?? 1);
    }
    for (const item of data.board.items) this.createItem(item);
    this.questSystem.initialize(data.quests.active, data.quests.completed);
    if (data.storage) this.storageTray.loadItems(data.storage);
    if (data.garden) this.gardenManager.load(data.garden);
    if (data.login) this.loginData = { ...data.login };
  }

  private createItem(data: MergeItemData): MergeItem {
    const item = new MergeItem(this, this.board, data);
    item.setDepth(10);
    this.items.set(data.id, item);
    return item;
  }

  private createGenerator(def: typeof GENERATORS[0], col: number, row: number, itemId?: string, genTier: number = 1): Generator {
    const id = itemId || newItemId();
    const gen = new Generator(this, this.board, def, col, row, id, genTier);
    gen.setDepth(5);
    this.generators.push(gen);
    return gen;
  }

  public spawnItem(chainId: string, tier: number, col: number, row: number): MergeItem | null {
    const cell = this.board.getCell(col, row);
    if (!cell || cell.occupied) return null;
    const data: MergeItemData = { id: newItemId(), chainId, tier, col, row };
    const item = this.createItem(data);
    item.playSpawnAnimation();
    return item;
  }

  private onBuyGenerator(genDef: typeof GENERATORS[0]): void {
    if (this.gems < genDef.cost) return;
    const cell = this.board.findEmptyCell();
    if (!cell) return;
    this.gems -= genDef.cost;
    this.createGenerator(genDef, cell.col, cell.row);
    this.updateUI();
    this.saveGame();
  }

  private onStorageRetrieve(itemData: { chainId: string; tier: number }, slotIndex: number): void {
    const cell = this.board.findEmptyCell();
    if (!cell) {
      this.mascot.showSpeech('Board is full! 😅', 2000);
      return;
    }
    const removed = this.storageTray.removeItem(slotIndex);
    if (removed) {
      this.spawnItem(removed.chainId, removed.tier, cell.col, cell.row);
      this.saveGame();
    }
  }

  private handleDrop(dropped: MergeItem, targetCell: CellData): void {
    if (this.isMerging) { dropped.returnToOriginal(); return; }
    const { width, height } = this.scale;
    this.events.emit('item-near-trash', false);

    // Check if dropped on trash zone (bottom-right corner)
    const trashX = width - s(32);
    const trashY = height - SIZES.BOTTOM_BAR - s(38);
    if (Math.abs(dropped.x - trashX) < s(30) && Math.abs(dropped.y - trashY) < s(30)) {
      const data = dropped.data_;
      this.items.delete(data.id);
      this.board.setOccupied(data.col, data.row, null);
      this.sound_.trash();
      // Poof animation
      this.tweens.add({
        targets: dropped, scaleX: 0, scaleY: 0, alpha: 0, duration: 200,
        ease: 'Back.easeIn', onComplete: () => dropped.destroy(),
      });
      this.saveGame();
      return;
    }

    // Check if dropped on storage tray area
    const trayY = this.storageTray.trayY;
    if (dropped.y > trayY - s(25) && dropped.y < trayY + s(25)) {
      if (!this.storageTray.isFull()) {
        const data = dropped.data_;
        this.items.delete(data.id);
        this.board.setOccupied(data.col, data.row, null);
        dropped.destroy();
        this.storageTray.storeItem(data.chainId, data.tier);
        this.saveGame();
        return;
      }
    }

    const targetId = targetCell.itemId;
    if (targetId) {
      const target = this.items.get(targetId);
      if (target && this.mergeSystem.canMerge(dropped, target)) { this.executeMerge(dropped, target); return; }
      if (this.generators.some(g => g.itemId === targetId)) { dropped.returnToOriginal(); return; }
      if (target) {
        const origCol = dropped.data_.col, origRow = dropped.data_.row;
        // Clear target's cell and swap both items' board state atomically
        // to prevent moveToCell's auto-clear from corrupting board state
        this.board.setOccupied(targetCell.col, targetCell.row, null);
        target.moveToCell(origCol, origRow);
        // Update dropped's data to point at target cell BEFORE moveToCell,
        // so moveToCell's clear step doesn't wipe target's new position
        dropped.data_.col = targetCell.col;
        dropped.data_.row = targetCell.row;
        dropped.moveToCell(targetCell.col, targetCell.row);
        this.sound_.swap();
        return;
      }
    }
    if (!targetCell.occupied && !targetCell.locked) { dropped.moveToCell(targetCell.col, targetCell.row); this.sound_.drop(); }
    else { dropped.returnToOriginal(); }
  }

  private async executeMerge(item1: MergeItem, item2: MergeItem): Promise<void> {
    this.isMerging = true;
    this.items.delete(item1.data_.id);
    this.items.delete(item2.data_.id);
    const result = await this.mergeSystem.executeMerge(item1, item2);
    this.isMerging = false;
    if (result.success && result.newItem) {
      const newItem = this.createItem(result.newItem);
      newItem.playMergeResult();
      this.sound_.merge(result.newItem.tier);
      this.totalMerges++;
      this.addXP(result.xpGained || 0);
      this.gems = Math.min(this.gems + (result.gemsGained || 0), 999999);
      const cur = this.collection.get(result.newItem.chainId) || 0;
      const isNewDiscovery = result.newItem.tier > cur;
      if (isNewDiscovery) this.collection.set(result.newItem.chainId, result.newItem.tier);

      // NEW! discovery animation
      if (isNewDiscovery) {
        this.playDiscoveryAnimation(newItem);
        this.sound_.discovery();
      }

      // Check if this is a max-tier item — offer garden placement
      if (isMaxTier(result.newItem.chainId, result.newItem.tier) &&
          !this.gardenManager.hasChain(result.newItem.chainId)) {
        const chainDef = getChain(result.newItem.chainId);
        const itemDef = getChainItem(result.newItem.chainId, result.newItem.tier);
        if (chainDef && itemDef) {
          this.time.delayedCall(800, () => {
            this.showGardenPrompt(newItem, itemDef.emoji, itemDef.name, result.newItem!.chainId, result.newItem!.tier);
          });
        }
      }

      // Mascot reacts + check achievements + check orders
      this.mascot.reactToMerge(result.newItem.tier);
      this.checkAchievements(result.newItem.chainId, result.newItem.tier);

      // Check if this new item fulfills an order — if so, consume it
      const orderMatch = this.orderSystem.findMatchingOrder(result.newItem.chainId, result.newItem.tier);
      if (orderMatch) {
        // Consume the item from the board
        this.items.delete(newItem.data_.id);
        this.board.setOccupied(newItem.data_.col, newItem.data_.row, null);

        // Fly item to top of screen (toward order bar) then destroy
        this.tweens.add({
          targets: newItem, y: s(60), alpha: 0, scaleX: 0.3, scaleY: 0.3,
          duration: 400, ease: 'Power2',
          onComplete: () => newItem.destroy(),
        });

        const completed = this.orderSystem.fulfillItem(orderMatch.orderIdx, orderMatch.slotIdx);
        if (completed) {
          // Auto-claim immediately — no visible "complete" state needed
          this.onClaimOrder(orderMatch.orderIdx);
        } else {
          this.updateUI();
        }
      }

      const c1 = this.questSystem.onItemCreated(result.newItem.chainId, result.newItem.tier);
      const c2 = this.questSystem.onMerge();
      for (const q of [...c1, ...c2]) this.handleQuestComplete(q);
      this.updateUI();
      this.saveGame();
    }
  }

  private handleGenTap(_gen: Generator, cell: CellData, spawnTier?: number): void {
    if (this.isMerging) return;
    this.sound_.generatorTap();
    const tier = spawnTier ?? _gen.genDef.spawnTier;
    const item = this.spawnItem(_gen.genDef.chainId, tier, cell.col, cell.row);
    if (item) { this.sound_.spawn(); this.createSpawnParticles(cell.x, cell.y); }
  }

  private boardFullCooldown = 0;

  private handleBoardFull(): void {
    const now = Date.now();
    // Throttle so repeated taps don't spam the message
    if (now - this.boardFullCooldown < 3000) return;
    this.boardFullCooldown = now;
    this.sound_.boardFull();
    this.mascot.showSpeech('Board is full! Clear some space!', 3000);
  }

  private createSpawnParticles(x: number, y: number): void {
    const colors = [0xFFB3D9, 0xA8E6CF, 0xA8D8EA];
    for (let i = 0; i < 5; i++) {
      const p = this.add.graphics();
      p.fillStyle(colors[Phaser.Math.Between(0, colors.length - 1)], 0.8);
      p.fillCircle(0, 0, s(3));
      p.setPosition(x, y).setDepth(2000);
      const angle = Math.random() * Math.PI * 2;
      const dist = s(20 + Math.random() * 15);
      this.tweens.add({
        targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, duration: 300, onComplete: () => p.destroy(),
      });
    }
  }

  private handleGenDrop(dropped: Generator, targetCell: CellData): void {
    if (this.isMerging) { dropped.returnToOriginal(); return; }

    const targetId = targetCell.itemId;
    if (targetId) {
      // Check if target is a generator we can merge with
      const targetGen = this.generators.find(g => g.itemId === targetId);
      if (targetGen && this.mergeSystem.canMergeGenerators(dropped, targetGen)) {
        this.executeGeneratorMerge(dropped, targetGen);
        return;
      }
      // Can't merge -- snap back
      dropped.returnToOriginal();
      return;
    }

    // Empty cell: move generator there
    if (!targetCell.occupied && !targetCell.locked) {
      dropped.moveToCell(targetCell.col, targetCell.row);
      this.saveGame();
    } else {
      dropped.returnToOriginal();
    }
  }

  private async executeGeneratorMerge(dropped: Generator, target: Generator): Promise<void> {
    this.isMerging = true;

    const genDef = target.genDef;
    const targetCol = target.col;
    const targetRow = target.row;

    // Remove both generators from the array
    this.generators = this.generators.filter(g => g !== dropped && g !== target);

    const result = await this.mergeSystem.executeGeneratorMerge(dropped, target);
    this.isMerging = false;

    if (result.success && result.newTierDef) {
      const newGen = this.createGenerator(genDef, result.col, result.row, undefined, result.newGenTier);

      // Spawn animation for the new generator
      newGen.setScale(0);
      this.tweens.add({
        targets: newGen, scaleX: 1.3, scaleY: 1.3, duration: 200, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({ targets: newGen, scaleX: 1, scaleY: 1, duration: 150, ease: 'Bounce.easeOut' });
        }
      });

      this.sound_.generatorMerge(result.newGenTier);
      this.totalMerges++;
      this.addXP(20 + result.newGenTier * 10);
      this.gems = Math.min(this.gems + 10 + result.newGenTier * 5, 999999);

      // Show upgrade text
      const tierNames = ['', '', 'II', 'III', 'IV', 'V'];
      const cell = this.board.getCell(targetCol, targetRow);
      if (cell) {
        const upgradeMsg = result.newGenTier >= 5 ? 'MAX TIER!' : `Tier ${tierNames[result.newGenTier]}!`;
        const msgColor = result.newGenTier >= 5 ? '#FF6B9D' : result.newGenTier >= 4 ? '#FFD700' : '#EC407A';
        const txt = this.add.text(cell.x, cell.y - s(30), upgradeMsg, {
          fontSize: fs(16), color: msgColor, fontFamily: FONT, fontStyle: '700',
          stroke: '#FFFFFF', strokeThickness: s(3),
        }).setOrigin(0.5).setDepth(2001).setScale(0);
        this.tweens.add({
          targets: txt, scaleX: 1.3, scaleY: 1.3, duration: 200, ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: txt, scaleX: 1, scaleY: 1, duration: 100,
              onComplete: () => {
                this.tweens.add({
                  targets: txt, y: cell.y - s(70), alpha: 0, duration: 800, ease: 'Power2',
                  onComplete: () => txt.destroy(),
                });
              }
            });
          }
        });
      }

      this.mascot.reactToMerge(result.newGenTier + 2);
      const upgradeLines = [
        'Upgraded! So powerful!', 'Getting stronger!', 'Amazing upgrade!',
      ];
      this.mascot.showSpeech(upgradeLines[Phaser.Math.Between(0, upgradeLines.length - 1)], 2500);

      this.updateUI();
      this.saveGame();
    }
  }

  private handleQuestComplete(quest: ActiveQuest): void {
    const reward = this.questSystem.claimQuest(quest.def.id);
    if (!reward) return;
    this.gems = Math.min(this.gems + reward.gems, 999999);
    this.addXP(reward.xp);
    const { width, height } = this.scale;

    // Hearts instead of generic confetti
    for (let i = 0; i < 8; i++) {
      const h = this.add.text(
        width / 2 + Phaser.Math.Between(-s(80), s(80)),
        height / 2 + s(20), '💕', { fontSize: fs(Phaser.Math.Between(12, 20)) }
      ).setOrigin(0.5).setDepth(3001);
      this.tweens.add({
        targets: h, y: h.y - s(Phaser.Math.Between(60, 120)), alpha: 0,
        duration: 1200, delay: i * 80, onComplete: () => h.destroy(),
      });
    }

    const banner = this.add.text(width / 2, height / 2, `✅ ${quest.def.description}`, {
      fontSize: fs(17), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
      backgroundColor: 'rgba(255,240,245,0.95)', padding: { x: s(16), y: s(12) },
    }).setOrigin(0.5).setDepth(3000);

    const rewardTxt = this.add.text(width / 2, height / 2 + s(35), `+${reward.gems} 💎  +${reward.xp} ⭐`, {
      fontSize: fs(14), color: TEXT.MINT, fontFamily: FONT, fontStyle: '600',
      backgroundColor: 'rgba(255,240,245,0.95)', padding: { x: s(12), y: s(8) },
    }).setOrigin(0.5).setDepth(3000);

    this.tweens.add({
      targets: [banner, rewardTxt], y: `-=${s(30)}`, alpha: 0,
      duration: 2000, delay: 1500,
      onComplete: () => { banner.destroy(); rewardTxt.destroy(); },
    });

    this.mascot.react('excited');
    this.mascot.showSpeech('Quest done! 🎉', 2500);
    this.updateUI();
  }

  private addXP(amount: number): void {
    this.playerXP += amount;
    while (this.playerXP >= this.xpToNext) {
      this.playerXP -= this.xpToNext;
      this.playerLevel++;
      this.xpToNext = Math.floor(this.xpToNext * 1.5);
      this.onLevelUp();
    }
  }

  private onLevelUp(): void {
    this.sound_.levelUp();
    const { width, height } = this.scale;
    const txt = this.add.text(width / 2, height / 2 - s(60), `🎉 Level ${this.playerLevel}!`, {
      fontSize: fs(34), color: TEXT.ACCENT, fontFamily: FONT, fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: s(4),
    }).setOrigin(0.5).setDepth(3000).setScale(0);

    this.tweens.add({
      targets: txt, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: txt, y: `-=${s(40)}`, alpha: 0, delay: 2000, duration: 800, onComplete: () => txt.destroy() });
      }
    });
    this.questSystem.setLevel(this.playerLevel);
    this.orderSystem.setLevel(this.playerLevel);
    this.checkAchievements();
    this.createConfetti();
    this.mascot.react('excited');
    this.mascot.showSpeech(`Level ${this.playerLevel}! 🌟`, 3000);
    this.updateUI();
  }

  private createConfetti(): void {
    const { width } = this.scale;
    const colors = [0xFF9CAD, 0xFFB3D9, 0xA8D8EA, 0xA8E6CF, 0xFFECB3, 0xC8A8E9];
    for (let i = 0; i < 30; i++) {
      const c = this.add.graphics();
      c.fillStyle(colors[Phaser.Math.Between(0, colors.length - 1)], 1);
      c.fillCircle(0, 0, s(Phaser.Math.Between(3, 6)));
      c.setPosition(Phaser.Math.Between(0, width), -s(20)).setDepth(3000);
      this.tweens.add({
        targets: c, y: this.scale.height + s(20),
        x: c.x + Phaser.Math.Between(-s(80), s(80)),
        rotation: Phaser.Math.FloatBetween(-3, 3),
        duration: Phaser.Math.Between(1500, 3000), ease: 'Power1',
        onComplete: () => c.destroy(),
      });
    }
  }

  private showGardenPrompt(item: MergeItem, emoji: string, name: string, chainId: string, tier: number): void {
    const { width, height } = this.scale;

    // Semi-transparent overlay
    const overlay = this.add.graphics().setDepth(4000);
    overlay.fillStyle(0x6D3A5B, 0.4);
    overlay.fillRect(0, 0, width, height);

    // Prompt card
    const cardW = width * 0.75;
    const cardH = s(160);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;
    const r = s(20);

    const card = this.add.graphics().setDepth(4001);
    card.fillStyle(0xFFF8F0, 1);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, r);
    card.lineStyle(s(1.5), 0xF8BBD0, 0.5);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, r);

    // Item emoji large
    const emojiText = this.add.text(width / 2, cardY + s(30), emoji, {
      fontSize: fs(36),
    }).setOrigin(0.5).setDepth(4002);

    // Title
    const title = this.add.text(width / 2, cardY + s(65), `Place ${name} in your garden?`, {
      fontSize: fs(13), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
      align: 'center', wordWrap: { width: cardW - s(24) },
    }).setOrigin(0.5).setDepth(4002);

    // Buttons
    const btnW = s(80), btnH = s(32);
    const gap = s(12);

    // "Keep" button (left)
    const keepBg = this.add.graphics().setDepth(4002);
    keepBg.fillStyle(0xA8D8EA, 1);
    keepBg.fillRoundedRect(width / 2 - btnW - gap / 2, cardY + cardH - s(48), btnW, btnH, btnH / 2);

    const keepText = this.add.text(width / 2 - btnW / 2 - gap / 2, cardY + cardH - s(32), 'Keep', {
      fontSize: fs(12), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5).setDepth(4003);

    const keepZone = this.add.zone(width / 2 - btnW / 2 - gap / 2, cardY + cardH - s(32), btnW, btnH)
      .setInteractive().setDepth(4003);

    // "Place" button (right)
    const placeBg = this.add.graphics().setDepth(4002);
    placeBg.fillStyle(0xFF9CAD, 1);
    placeBg.fillRoundedRect(width / 2 + gap / 2, cardY + cardH - s(48), btnW, btnH, btnH / 2);

    const placeText = this.add.text(width / 2 + btnW / 2 + gap / 2, cardY + cardH - s(32), '🌸 Place', {
      fontSize: fs(12), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5).setDepth(4003);

    const placeZone = this.add.zone(width / 2 + btnW / 2 + gap / 2, cardY + cardH - s(32), btnW, btnH)
      .setInteractive().setDepth(4003);

    const cleanup = () => {
      [overlay, card, emojiText, title, keepBg, keepText, keepZone, placeBg, placeText, placeZone].forEach(o => o.destroy());
    };

    keepZone.on('pointerdown', () => cleanup());

    placeZone.on('pointerdown', () => {
      // Remove the item from the board
      this.items.delete(item.data_.id);
      this.board.setOccupied(item.data_.col, item.data_.row, null);
      item.destroy();

      // Place in garden
      this.gardenManager.place(chainId, tier, emoji, name);

      this.mascot.react('excited');
      this.mascot.showSpeech('The garden looks even prettier now! 🌸', 3000);

      cleanup();
      this.saveGame();
    });
  }

  private playDiscoveryAnimation(item: MergeItem): void {
    const x = item.x;
    const y = item.y;

    // Golden glow expanding from item
    const glow = this.add.graphics();
    glow.fillStyle(0xFFD700, 0.3);
    glow.fillCircle(0, 0, s(5));
    glow.setPosition(x, y).setDepth(1500);
    this.tweens.add({
      targets: glow, scaleX: 6, scaleY: 6, alpha: 0,
      duration: 500, ease: 'Power2',
      onComplete: () => glow.destroy(),
    });

    // "NEW!" badge
    const badge = this.add.text(x, y - s(30), 'NEW!', {
      fontSize: fs(16), color: '#FFD700', fontFamily: FONT, fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: s(3),
      shadow: { offsetX: 0, offsetY: s(2), color: 'rgba(0,0,0,0.15)', blur: s(4), fill: true },
    }).setOrigin(0.5).setDepth(2500).setScale(0);

    this.tweens.add({
      targets: badge, scaleX: 1.3, scaleY: 1.3, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: badge, scaleX: 1, scaleY: 1, duration: 100,
          onComplete: () => {
            this.tweens.add({
              targets: badge, y: y - s(60), alpha: 0,
              delay: 1200, duration: 500,
              onComplete: () => badge.destroy(),
            });
          }
        });
      }
    });

    // Gold sparkle particles
    const goldColors = [0xFFD700, 0xFFECB3, 0xFFF176, 0xFFB300];
    for (let i = 0; i < 8; i++) {
      const p = this.add.graphics();
      const color = goldColors[Phaser.Math.Between(0, goldColors.length - 1)];
      p.fillStyle(color, 0.9);
      p.fillCircle(0, 0, s(Phaser.Math.Between(2, 5)));
      p.setPosition(x, y).setDepth(2000);
      const angle = (i / 8) * Math.PI * 2;
      const dist = s(Phaser.Math.Between(25, 45));
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - s(10),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 600 + Phaser.Math.Between(0, 200),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    // Mascot reacts
    const discoveryLines = [
      'Ooh, what\'s this? ✨', 'A new discovery! 💕', 'So pretty! 🌸',
      'I\'ve never seen this before! 🤩', 'How beautiful! 💖',
    ];
    this.mascot.showSpeech(discoveryLines[Phaser.Math.Between(0, discoveryLines.length - 1)], 2500);
  }

  private onClaimOrder(orderIdx: number): void {
    const rewards = this.orderSystem.claimOrder(orderIdx);
    if (!rewards) return;
    this.sound_.complete();

    let xpGained = 0;
    let gemsGained = 0;
    for (const r of rewards) {
      if (r.type === 'xp') xpGained += r.amount;
      if (r.type === 'gems') gemsGained += r.amount;
    }
    if (xpGained > 0) this.addXP(xpGained);
    if (gemsGained > 0) this.gems = Math.min(this.gems + gemsGained, 999999);

    // Celebration
    const { width, height } = this.scale;
    const coinReward = rewards.find(r => r.type === 'coins');
    if (coinReward) {
      const ct = this.add.text(width / 2, height / 2, `+${coinReward.amount} 🪙`, {
        fontSize: fs(24), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '700',
        stroke: '#FFFFFF', strokeThickness: s(3),
      }).setOrigin(0.5).setDepth(3000).setScale(0);
      this.tweens.add({
        targets: ct, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({ targets: ct, y: `-=${s(50)}`, alpha: 0, delay: 1000, duration: 600, onComplete: () => ct.destroy() });
        }
      });
    }

    // Hearts
    for (let i = 0; i < 6; i++) {
      const h = this.add.text(
        width / 2 + Phaser.Math.Between(-s(60), s(60)),
        height / 2, '💕', { fontSize: fs(Phaser.Math.Between(12, 18)) }
      ).setOrigin(0.5).setDepth(3001);
      this.tweens.add({
        targets: h, y: h.y - s(Phaser.Math.Between(50, 100)), alpha: 0,
        duration: 1000, delay: i * 60, onComplete: () => h.destroy(),
      });
    }

    this.mascot.react('excited');
    this.mascot.showSpeech('Order complete! 💕', 2500);
    this.updateUI();
    this.saveGame();
  }

  private checkAchievements(newChainId?: string, newTier?: number): void {
    const newlyUnlocked = this.achievementSystem.check({
      totalMerges: this.totalMerges,
      level: this.playerLevel,
      collection: this.collection,
      newChainId, newTier,
    });
    for (const ach of newlyUnlocked) {
      this.showAchievementToast(ach);
    }
  }

  private showAchievementToast(ach: AchievementDef): void {
    this.sound_.achievement();
    const { width } = this.scale;
    const toastW = width * 0.75;
    const toastH = s(52);
    const toastX = (width - toastW) / 2;
    const toastY = -toastH;

    const container = this.add.container(0, 0).setDepth(4000);

    const bg = this.add.graphics();
    bg.fillStyle(0xFFF0F5, 0.97);
    bg.fillRoundedRect(toastX, toastY, toastW, toastH, toastH / 2);
    bg.lineStyle(s(1.5), 0xD4B8E8, 0.5);
    bg.strokeRoundedRect(toastX, toastY, toastW, toastH, toastH / 2);
    container.add(bg);

    const emoji = this.add.text(toastX + s(18), toastY + toastH / 2, ach.emoji, { fontSize: fs(20) }).setOrigin(0, 0.5);
    container.add(emoji);

    const title = this.add.text(toastX + s(48), toastY + s(12), ach.name, {
      fontSize: fs(12), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    });
    container.add(title);

    const desc = this.add.text(toastX + s(48), toastY + s(30), ach.description, {
      fontSize: fs(9), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    });
    container.add(desc);

    // Slide in from top
    this.tweens.add({
      targets: container, y: s(110), duration: 400, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: container, y: -toastH - s(20), duration: 300, ease: 'Power2',
            onComplete: () => container.destroy(),
          });
        });
      }
    });

    this.mascot.showSpeech('Badge earned! 🎀', 2000);
  }

  private updateUI(): void {
    this.scene.get('UIScene').events.emit('update-ui', {
      gems: this.gems, coins: this.orderSystem.coins, level: this.playerLevel,
      xp: this.playerXP, xpToNext: this.xpToNext,
      quests: this.questSystem.getActiveQuests(),
      orders: this.orderSystem.getActiveOrders(),
    });
  }

  private saveGame(): void {
    const items: MergeItemData[] = [];
    this.items.forEach(item => items.push(item.getData()));
    const gens = this.generators.map(g => ({ genId: g.genDef.id, genTier: g.genTier, col: g.col, row: g.row, itemId: g.itemId }));
    const coll: { chainId: string; maxTier: number }[] = [];
    this.collection.forEach((maxTier, chainId) => coll.push({ chainId, maxTier }));

    SaveSystem.save({
      version: 6, timestamp: Date.now(),
      player: { level: this.playerLevel, xp: this.playerXP, xpToNext: this.xpToNext, gems: this.gems, totalMerges: this.totalMerges },
      board: { cols: 6, rows: 8, items, generators: gens },
      quests: this.questSystem.getSaveData(),
      collection: coll,
      storage: this.storageTray.getStoredItems(),
      achievements: this.achievementSystem.getUnlocked(),
      garden: this.gardenManager.getDecorations(),
      orders: this.orderSystem.getSaveData(),
      login: { ...this.loginData },
    });
  }

  // ─── FEATURE: Merge Chain Preview (long-press) ───

  private showChainPreview(itemData: MergeItemData, itemX: number, itemY: number): void {
    // Dismiss any existing preview
    this.dismissPreview();

    const chain = getChain(itemData.chainId);
    if (!chain) return;

    const { width, height } = this.scale;
    const container = this.add.container(0, 0).setDepth(5000);
    this.previewContainer = container;

    // Semi-transparent dismiss overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.01);
    overlay.fillRect(0, 0, width, height);
    const overlayZone = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    overlayZone.on('pointerdown', () => this.dismissPreview());
    container.add([overlay, overlayZone]);

    // Determine which items to show: up to 4, centered on current item
    const items = chain.items;
    const currentIdx = items.findIndex(i => i.tier === itemData.tier);
    if (currentIdx < 0) return;

    // Show a window of items: 2 before current (if available), current, and remaining up to 4 total
    const maxShow = Math.min(items.length, 4);
    let startIdx = Math.max(0, currentIdx - 1);
    let endIdx = startIdx + maxShow;
    if (endIdx > items.length) { endIdx = items.length; startIdx = Math.max(0, endIdx - maxShow); }

    const visibleItems = items.slice(startIdx, endIdx);
    const currentVisIdx = currentIdx - startIdx;

    // Card dimensions
    const itemSlotW = s(38);
    const arrowW = s(14);
    const numItems = visibleItems.length;
    const cardW = numItems * itemSlotW + (numItems - 1) * arrowW + s(28);
    const cardH = s(68);
    const cornerR = s(14);

    // Position above the item, clamped to screen
    let cardX = itemX - cardW / 2;
    let cardY = itemY - s(60) - cardH;
    if (cardX < s(8)) cardX = s(8);
    if (cardX + cardW > width - s(8)) cardX = width - s(8) - cardW;
    if (cardY < SIZES.TOP_BAR + s(4)) cardY = itemY + s(50); // Flip below if too high

    // Card background with chain color
    const chainColor = PREVIEW_CHAIN_COLORS[itemData.chainId] || 0xFFF0F5;
    const cardBg = this.add.graphics();
    // Shadow
    cardBg.fillStyle(0x000000, 0.08);
    cardBg.fillRoundedRect(cardX + s(2), cardY + s(3), cardW, cardH, cornerR);
    // Main card
    cardBg.fillStyle(chainColor, 0.95);
    cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, cornerR);
    // White inner
    cardBg.fillStyle(0xFFFFFF, 0.6);
    cardBg.fillRoundedRect(cardX + s(3), cardY + s(3), cardW - s(6), cardH - s(6), cornerR - s(2));
    // Border
    cardBg.lineStyle(s(1.5), chainColor, 0.8);
    cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, cornerR);
    container.add(cardBg);

    // Chain name at top
    const chainLabel = this.add.text(cardX + cardW / 2, cardY + s(10), chain.name, {
      fontSize: fs(8), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5, 0);
    container.add(chainLabel);

    // Draw items in a row
    const rowY = cardY + s(38);
    let curX = cardX + s(14);

    for (let i = 0; i < visibleItems.length; i++) {
      const item = visibleItems[i];
      const isCurrent = i === currentVisIdx;
      const isMax = item.tier === items[items.length - 1].tier;
      const centerX = curX + itemSlotW / 2;

      // Glow ring for current item
      if (isCurrent) {
        const glow = this.add.graphics();
        glow.fillStyle(0xFFD700, 0.25);
        glow.fillCircle(centerX, rowY, s(18));
        glow.lineStyle(s(2), 0xFFD700, 0.7);
        glow.strokeCircle(centerX, rowY, s(16));
        container.add(glow);

        // Pulse the glow
        this.tweens.add({
          targets: glow, alpha: 0.5, duration: 600,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }

      // Item emoji
      const emoji = this.add.text(centerX, rowY - s(2), item.emoji, {
        fontSize: fs(isCurrent ? 18 : 15),
      }).setOrigin(0.5);
      container.add(emoji);

      // Tier label or star marker
      const label = isCurrent ? `T${item.tier} ★` : isMax ? `T${item.tier} ✨` : `T${item.tier}`;
      const labelColor = isCurrent ? TEXT.ACCENT : isMax ? TEXT.GOLD : TEXT.SECONDARY;
      const tierText = this.add.text(centerX, rowY + s(14), label, {
        fontSize: fs(7), color: labelColor, fontFamily: FONT_BODY, fontStyle: isCurrent ? '700' : '400',
      }).setOrigin(0.5);
      container.add(tierText);

      // Arrow to next item
      if (i < visibleItems.length - 1) {
        const arrowX = curX + itemSlotW + arrowW / 2;
        const arrow = this.add.text(arrowX, rowY - s(2), '\u2192', {
          fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT,
        }).setOrigin(0.5);
        container.add(arrow);
      }

      curX += itemSlotW + arrowW;
    }

    // Truncation indicators
    if (startIdx > 0) {
      const dots = this.add.text(cardX + s(6), rowY - s(2), '...', {
        fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(0, 0.5);
      container.add(dots);
    }
    if (endIdx < items.length) {
      const dots = this.add.text(cardX + cardW - s(6), rowY - s(2), '...', {
        fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(1, 0.5);
      container.add(dots);
    }

    // Slide in animation
    container.setAlpha(0);
    container.y = s(8);
    this.tweens.add({
      targets: container, alpha: 1, y: 0, duration: 200, ease: 'Back.easeOut',
    });
  }

  private dismissPreview(): void {
    if (this.previewContainer) {
      const c = this.previewContainer;
      this.previewContainer = null;
      this.tweens.add({
        targets: c, alpha: 0, duration: 120, onComplete: () => c.destroy(),
      });
    }
  }

  // ─── FEATURE: Daily Login Rewards ───

  private checkDailyLogin(): void {
    const result = SaveSystem.checkLoginStreak(this.loginData);
    if (!result) return; // Already claimed today

    // Show the daily reward popup
    this.showDailyRewardPopup(result.streak, result.reward);
  }

  private showDailyRewardPopup(streak: number, reward: typeof DAILY_REWARDS[number]): void {
    const { width, height } = this.scale;
    const container = this.add.container(0, 0).setDepth(6000);

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x6D3A5B, 0.45);
    overlay.fillRect(0, 0, width, height);
    container.add(overlay);

    // Card
    const cardW = width * 0.82;
    const cardH = s(220);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2 - s(10);
    const r = s(22);

    const card = this.add.graphics();
    // Shadow
    card.fillStyle(0x000000, 0.1);
    card.fillRoundedRect(cardX + s(3), cardY + s(4), cardW, cardH, r);
    // Background
    card.fillStyle(0xFFF8F0, 1);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, r);
    // Top accent strip
    card.fillStyle(reward.type === 'gems' ? 0xD4A5FF : 0xFFD700, 0.3);
    card.fillRoundedRect(cardX, cardY, cardW, s(50), { tl: r, tr: r, bl: 0, br: 0 });
    // Border
    card.lineStyle(s(1.5), reward.type === 'gems' ? 0xD4A5FF : 0xFFD700, 0.5);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, r);
    container.add(card);

    // Banner title
    const bannerEmoji = reward.special ? '🎊' : reward.type === 'gems' ? '💎' : '🪙';
    const title = this.add.text(width / 2, cardY + s(25), `${bannerEmoji} Day ${streak} Reward! ${bannerEmoji}`, {
      fontSize: fs(18), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);
    container.add(title);

    // Reward amount
    const rewardIcon = reward.type === 'gems' ? '💎' : '🪙';
    const rewardColor = reward.type === 'gems' ? '#D4A5FF' : '#FFD700';
    const amountText = this.add.text(width / 2, cardY + s(70), `+${reward.amount} ${rewardIcon}`, {
      fontSize: fs(32), color: rewardColor, fontFamily: FONT, fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: s(3),
    }).setOrigin(0.5).setScale(0);
    container.add(amountText);

    // Bounce in the reward amount
    this.tweens.add({
      targets: amountText, scaleX: 1.2, scaleY: 1.2, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: amountText, scaleX: 1, scaleY: 1, duration: 150 });
      }
    });

    // 7-dot progress bar
    const dotSpacing = s(28);
    const dotsStartX = width / 2 - ((7 - 1) * dotSpacing) / 2;
    const dotsY = cardY + s(120);

    for (let day = 1; day <= 7; day++) {
      const dx = dotsStartX + (day - 1) * dotSpacing;
      const dotGfx = this.add.graphics();

      if (day < streak) {
        // Claimed (filled)
        dotGfx.fillStyle(0xA8E6CF, 1);
        dotGfx.fillCircle(dx, dotsY, s(9));
        dotGfx.lineStyle(s(1.5), 0x81C784, 0.8);
        dotGfx.strokeCircle(dx, dotsY, s(9));
        const check = this.add.text(dx, dotsY, '✓', {
          fontSize: fs(9), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '700',
        }).setOrigin(0.5);
        container.add(check);
      } else if (day === streak) {
        // Current day (highlighted with glow)
        dotGfx.fillStyle(reward.type === 'gems' ? 0xD4A5FF : 0xFFD700, 1);
        dotGfx.fillCircle(dx, dotsY, s(11));
        dotGfx.lineStyle(s(2), 0xFFFFFF, 0.9);
        dotGfx.strokeCircle(dx, dotsY, s(11));
        this.tweens.add({
          targets: dotGfx, alpha: 0.6, duration: 500,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      } else {
        // Future (empty)
        dotGfx.fillStyle(0xE0E0E0, 0.5);
        dotGfx.fillCircle(dx, dotsY, s(8));
        dotGfx.lineStyle(s(1), 0xBDBDBD, 0.4);
        dotGfx.strokeCircle(dx, dotsY, s(8));
      }
      container.add(dotGfx);

      // Day number below dots
      const dayLabel = this.add.text(dx, dotsY + s(16), `${day}`, {
        fontSize: fs(7), color: day === streak ? TEXT.ACCENT : TEXT.SECONDARY,
        fontFamily: FONT_BODY, fontStyle: day === streak ? '700' : '400',
      }).setOrigin(0.5);
      container.add(dayLabel);
    }

    // "Streak!" label
    const streakLabel = this.add.text(width / 2, dotsY + s(32), `${streak}-day streak!`, {
      fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5);
    container.add(streakLabel);

    // Auto-claim after 1.5 seconds
    this.time.delayedCall(1500, () => {
      // Apply reward
      if (reward.type === 'gems') {
        this.gems = Math.min(this.gems + reward.amount, 999999);
      } else {
        this.orderSystem.coins += reward.amount;
      }

      // Update login data
      this.loginData = SaveSystem.claimDailyReward(this.loginData, streak);

      // Fly animation for reward
      const flyIcon = reward.type === 'gems' ? '💎' : '🪙';
      for (let i = 0; i < 6; i++) {
        const gem = this.add.text(
          width / 2 + Phaser.Math.Between(-s(40), s(40)),
          cardY + s(70),
          flyIcon, { fontSize: fs(14) }
        ).setOrigin(0.5).setDepth(6001);
        this.tweens.add({
          targets: gem,
          x: reward.type === 'gems' ? width - s(60) : s(60),
          y: SIZES.TOP_BAR / 2,
          alpha: 0, scaleX: 0.3, scaleY: 0.3,
          duration: 600 + i * 80,
          delay: i * 60,
          ease: 'Power2',
          onComplete: () => gem.destroy(),
        });
      }

      // Day 7 special confetti
      if (reward.special) {
        this.createConfetti();
        this.mascot.react('excited');
        this.mascot.showSpeech('Perfect week! 🎊', 3000);
      } else {
        this.mascot.react('happy');
        const lines = ['Welcome back! 💕', 'Nice streak! 🌸', 'Keep it up! ✨'];
        this.mascot.showSpeech(lines[Phaser.Math.Between(0, lines.length - 1)], 2500);
      }

      this.updateUI();
      this.saveGame();

      // Dismiss popup after a short pause
      this.time.delayedCall(600, () => {
        this.tweens.add({
          targets: container, alpha: 0, duration: 300,
          onComplete: () => container.destroy(),
        });
      });
    });

    // Slide in animation for the whole popup
    container.setAlpha(0);
    this.tweens.add({
      targets: container, alpha: 1, duration: 300, ease: 'Power2',
    });
  }
}
