import { Board, CellData } from '../objects/Board';
import { MergeItem, MergeItemData, newItemId } from '../objects/MergeItem';
import { Generator } from '../objects/Generator';
import { MergeSystem } from '../systems/MergeSystem';
import { QuestSystem, ActiveQuest } from '../systems/QuestSystem';
import { SaveSystem, SaveData } from '../systems/SaveSystem';
import { GENERATORS } from '../data/chains';
import { SIZES, COLORS, TIMING, fs, s } from '../utils/constants';

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private mergeSystem!: MergeSystem;
  private questSystem!: QuestSystem;

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

    // Garden-themed background with time-of-day tint
    this.drawGardenBackground(width, height);

    // Floating ambient particles
    this.createAmbientParticles(width, height);

    this.board = new Board(this, 6, 8);
    this.mergeSystem = new MergeSystem(this);
    this.questSystem = new QuestSystem(this.playerLevel);

    const save = SaveSystem.load();
    if (save) { this.loadSave(save); } else { this.startFresh(); }

    this.events.on('item-dropped', this.handleDrop, this);
    this.events.on('generator-tapped', this.handleGenTap, this);

    // Listen for shop purchases
    this.events.on('shop-buy-generator', this.onBuyGenerator, this);

    this.scene.launch('UIScene', {
      gems: this.gems, level: this.playerLevel,
      xp: this.playerXP, xpToNext: this.xpToNext,
      quests: this.questSystem.getActiveQuests(),
    });

    this.time.addEvent({ delay: TIMING.AUTOSAVE, loop: true, callback: () => this.saveGame() });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.saveGame(); });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private drawGardenBackground(width: number, height: number): void {
    const hour = new Date().getHours();
    let topColor: number, botColor: number;

    if (hour >= 6 && hour < 12) {
      // Morning — warm peach to soft green
      topColor = 0x1a2a1a;
      botColor = 0x0f1f12;
    } else if (hour >= 12 && hour < 17) {
      // Afternoon — brighter green
      topColor = 0x152815;
      botColor = 0x0d1f0d;
    } else if (hour >= 17 && hour < 21) {
      // Evening — warm amber tint
      topColor = 0x1f1a10;
      botColor = 0x12180f;
    } else {
      // Night — deep blue-green
      topColor = 0x0a1520;
      botColor = 0x08101a;
    }

    const bg = this.add.graphics();
    bg.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
    bg.fillRect(0, 0, width, height);
  }

  private createAmbientParticles(width: number, height: number): void {
    for (let i = 0; i < 8; i++) {
      const p = this.add.graphics();
      p.fillStyle(0x2ecc71, 0.08);
      p.fillCircle(0, 0, s(Phaser.Math.Between(2, 5)));
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR);
      p.setPosition(x, y).setDepth(0);

      this.tweens.add({
        targets: p,
        y: y - s(Phaser.Math.Between(30, 80)),
        x: x + s(Phaser.Math.Between(-30, 30)),
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8000),
        delay: Phaser.Math.Between(0, 5000),
        repeat: -1,
        onRepeat: () => { p.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR)); p.setAlpha(0.08); },
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

  private handleDrop(dropped: MergeItem, targetCell: CellData): void {
    const targetId = targetCell.itemId;
    if (targetId) {
      const target = this.items.get(targetId);
      if (target && this.mergeSystem.canMerge(dropped, target)) { this.executeMerge(dropped, target); return; }
      if (this.generators.some(g => g.itemId === targetId)) { dropped.returnToOriginal(); return; }
      if (target) {
        const origCol = dropped.data_.col;
        const origRow = dropped.data_.row;
        this.board.setOccupied(targetCell.col, targetCell.row, null);
        target.moveToCell(origCol, origRow);
        dropped.moveToCell(targetCell.col, targetCell.row);
        return;
      }
    }
    if (!targetCell.occupied && !targetCell.locked) {
      dropped.moveToCell(targetCell.col, targetCell.row);
    } else {
      dropped.returnToOriginal();
    }
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
    for (let i = 0; i < 5; i++) {
      const p = this.add.graphics();
      p.fillStyle(COLORS.ACCENT_TEAL, 0.8);
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

    const banner = this.add.text(width / 2, height / 2, `✅ ${quest.def.description}`, {
      fontSize: fs(17), color: '#ffd700', fontFamily: 'system-ui', fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: s(16), y: s(12) },
    }).setOrigin(0.5).setDepth(3000);

    const rewardTxt = this.add.text(width / 2, height / 2 + s(35), `+${reward.gems} 💎  +${reward.xp} ⭐`, {
      fontSize: fs(14), color: '#2ecc71', fontFamily: 'system-ui', fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: s(12), y: s(8) },
    }).setOrigin(0.5).setDepth(3000);

    this.tweens.add({
      targets: [banner, rewardTxt], y: `-=${s(30)}`, alpha: 0,
      duration: 2000, delay: 1500,
      onComplete: () => { banner.destroy(); rewardTxt.destroy(); },
    });
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
      fontSize: fs(32), color: '#ffd700', fontFamily: 'system-ui', fontStyle: 'bold',
      stroke: '#000', strokeThickness: s(4),
    }).setOrigin(0.5).setDepth(3000).setScale(0);

    this.tweens.add({
      targets: txt, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: txt, y: `-=${s(40)}`, alpha: 0, delay: 2000, duration: 800, onComplete: () => txt.destroy() });
      }
    });
    this.questSystem.setLevel(this.playerLevel);
    this.createConfetti();
    this.updateUI();
  }

  private createConfetti(): void {
    const { width } = this.scale;
    const colors = [0xff69b4, 0xffd700, 0x87ceeb, 0x2ecc71, 0xff6347, 0x9b59b6];
    for (let i = 0; i < 30; i++) {
      const c = this.add.graphics();
      c.fillStyle(colors[Phaser.Math.Between(0, colors.length - 1)], 1);
      c.fillRect(-s(3), -s(6), s(6), s(12));
      c.setPosition(Phaser.Math.Between(0, width), -s(20)).setDepth(3000);
      c.setRotation(Math.random() * Math.PI);
      this.tweens.add({
        targets: c, y: this.scale.height + s(20),
        x: c.x + Phaser.Math.Between(-s(100), s(100)),
        rotation: c.rotation + Phaser.Math.FloatBetween(-3, 3),
        duration: Phaser.Math.Between(1500, 3000), ease: 'Power1',
        onComplete: () => c.destroy(),
      });
    }
  }

  private updateUI(): void {
    this.scene.get('UIScene').events.emit('update-ui', {
      gems: this.gems, level: this.playerLevel,
      xp: this.playerXP, xpToNext: this.xpToNext,
      quests: this.questSystem.getActiveQuests(),
    });
  }

  private saveGame(): void {
    const items: MergeItemData[] = [];
    this.items.forEach(item => items.push(item.getData()));
    const gens = this.generators.map(g => ({ genId: g.genDef.id, col: g.col, row: g.row, itemId: g.itemId }));
    const coll: { chainId: string; maxTier: number }[] = [];
    this.collection.forEach((maxTier, chainId) => coll.push({ chainId, maxTier }));

    SaveSystem.save({
      version: 1, timestamp: Date.now(),
      player: { level: this.playerLevel, xp: this.playerXP, xpToNext: this.xpToNext, gems: this.gems, totalMerges: this.totalMerges },
      board: { cols: 6, rows: 8, items, generators: gens },
      quests: this.questSystem.getSaveData(),
      collection: coll,
    });
  }
}
