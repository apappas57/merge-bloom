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
import { SaveSystem, SaveData } from '../systems/SaveSystem';
import { GENERATORS, getNextInChain, getChainItem, isMaxTier } from '../data/chains';
import { SIZES, COLORS, TIMING, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private mergeSystem!: MergeSystem;
  private questSystem!: QuestSystem;
  private hintSystem!: HintSystem;
  private achievementSystem!: AchievementSystem;
  private orderSystem!: OrderSystem;
  private mascot!: Mascot;
  private storageTray!: StorageTray;

  private items: Map<string, MergeItem> = new Map();
  private generators: Generator[] = [];

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
    const boardBottom = SIZES.TOP_BAR + SIZES.QUEST_BAR + SIZES.BOARD_PADDING
      + 8 * (this.board.cellDimension + SIZES.CELL_GAP) - SIZES.CELL_GAP + SIZES.BOARD_PADDING;
    const trayY = boardBottom + s(28);
    this.storageTray = new StorageTray(this, trayY);

    // Mascot — bottom-left corner
    this.mascot = new Mascot(this, s(32), height - SIZES.BOTTOM_BAR - s(40));

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
    this.events.on('shop-buy-generator', this.onBuyGenerator, this);
    this.events.on('storage-retrieve', this.onStorageRetrieve, this);
    this.events.on('claim-order', this.onClaimOrder, this);

    this.scene.launch('UIScene', {
      gems: this.gems, coins: this.orderSystem.coins, level: this.playerLevel,
      xp: this.playerXP, xpToNext: this.xpToNext,
      quests: this.questSystem.getActiveQuests(),
      orders: this.orderSystem.getActiveOrders(),
    });

    this.time.addEvent({ delay: TIMING.AUTOSAVE, loop: true, callback: () => this.saveGame() });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.saveGame(); });

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
      { text: '🌸 Welcome to Merge Bloom!\n\nTap generators to spawn items', y: height * 0.3 },
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
    for (let i = 0; i < 6; i++) {
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
      if (def) this.createGenerator(def, g.col, g.row, g.itemId);
    }
    for (const item of data.board.items) this.createItem(item);
    this.questSystem.initialize(data.quests.active, data.quests.completed);
    if (data.storage) this.storageTray.loadItems(data.storage);
  }

  private createItem(data: MergeItemData): MergeItem {
    const item = new MergeItem(this, this.board, data);
    item.setDepth(10);
    this.items.set(data.id, item);
    return item;
  }

  private createGenerator(def: typeof GENERATORS[0], col: number, row: number, itemId?: string): Generator {
    const id = itemId || newItemId();
    const gen = new Generator(this, this.board, def, col, row, id);
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
    const { width, height } = this.scale;
    this.events.emit('item-near-trash', false);

    // Check if dropped on trash zone (bottom-right corner)
    const trashX = width - s(32);
    const trashY = height - SIZES.BOTTOM_BAR - s(38);
    if (Math.abs(dropped.x - trashX) < s(30) && Math.abs(dropped.y - trashY) < s(30)) {
      const data = dropped.data_;
      this.items.delete(data.id);
      this.board.setOccupied(data.col, data.row, null);
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
      const newItem = this.createItem(result.newItem);
      newItem.playMergeResult();
      this.totalMerges++;
      this.addXP(result.xpGained || 0);
      this.gems = Math.min(this.gems + (result.gemsGained || 0), 999999);
      const cur = this.collection.get(result.newItem.chainId) || 0;
      if (result.newItem.tier > cur) this.collection.set(result.newItem.chainId, result.newItem.tier);

      // Mascot reacts + check achievements + check orders
      this.mascot.reactToMerge(result.newItem.tier);
      this.checkAchievements(result.newItem.chainId, result.newItem.tier);
      this.checkOrders(result.newItem.chainId, result.newItem.tier);

      const c1 = this.questSystem.onItemCreated(result.newItem.chainId, result.newItem.tier);
      const c2 = this.questSystem.onMerge();
      for (const q of [...c1, ...c2]) this.handleQuestComplete(q);
      this.updateUI();
      this.saveGame();
    }
  }

  private handleGenTap(_gen: Generator, cell: CellData): void {
    const item = this.spawnItem(_gen.genDef.chainId, _gen.genDef.spawnTier, cell.col, cell.row);
    if (item) this.createSpawnParticles(cell.x, cell.y);
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

  private checkOrders(chainId: string, tier: number): void {
    // Check if this item matches any active order
    const match = this.orderSystem.findMatchingOrder(chainId, tier);
    if (match) {
      const completed = this.orderSystem.fulfillItem(match.orderIdx, match.slotIdx);
      if (completed) {
        this.mascot.showSpeech('Order ready! Tap GO! 🎉', 2500);
      }
      this.updateUI();
    }
  }

  private onClaimOrder(orderIdx: number): void {
    const rewards = this.orderSystem.claimOrder(orderIdx);
    if (!rewards) return;

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
    const gens = this.generators.map(g => ({ genId: g.genDef.id, col: g.col, row: g.row, itemId: g.itemId }));
    const coll: { chainId: string; maxTier: number }[] = [];
    this.collection.forEach((maxTier, chainId) => coll.push({ chainId, maxTier }));

    SaveSystem.save({
      version: 3, timestamp: Date.now(),
      player: { level: this.playerLevel, xp: this.playerXP, xpToNext: this.xpToNext, gems: this.gems, totalMerges: this.totalMerges },
      board: { cols: 6, rows: 8, items, generators: gens },
      quests: this.questSystem.getSaveData(),
      collection: coll,
      storage: this.storageTray.getStoredItems(),
      achievements: this.achievementSystem.getUnlocked(),
      orders: this.orderSystem.getSaveData(),
    });
  }
}
