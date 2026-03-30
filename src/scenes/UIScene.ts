import { SIZES, COLORS, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';
import { ActiveQuest } from '../systems/QuestSystem';
import { ActiveOrder } from '../systems/OrderSystem';
import { CHARACTERS } from '../data/orders';
import { getChainItem } from '../data/chains';

export class UIScene extends Phaser.Scene {
  private gemsText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private orderElements: Phaser.GameObjects.GameObject[] = [];
  private curGems = 0;
  private curCoins = 0;
  private curLevel = 1;

  constructor() { super('UIScene'); }

  create(data: {
    gems: number; coins: number; level: number; xp: number; xpToNext: number;
    quests: ActiveQuest[]; orders: ActiveOrder[];
  }) {
    const { width } = this.scale;
    this.curGems = data.gems;
    this.curCoins = data.coins || 0;
    this.curLevel = data.level;

    // === TOP BAR ===
    const topBg = this.add.graphics();
    topBg.fillStyle(COLORS.UI_BG, 0.95);
    topBg.fillRect(0, 0, width, SIZES.TOP_BAR);

    const accent = this.add.graphics();
    accent.fillStyle(COLORS.ACCENT_ROSE, 0.3);
    accent.fillRect(0, SIZES.TOP_BAR - s(1.5), width, s(1.5));

    // Level
    this.levelText = this.add.text(s(14), s(12), `⭐ Lv.${data.level}`, {
      fontSize: fs(14), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
    });

    // Coins
    this.coinsText = this.add.text(width / 2, s(12), `🪙 ${this.fmt(data.coins || 0)}`, {
      fontSize: fs(14), color: '#E8A317', fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5, 0);

    // Gems
    this.gemsText = this.add.text(width - s(14), s(12), `💎 ${this.fmt(data.gems)}`, {
      fontSize: fs(14), color: '#A8D8EA', fontFamily: FONT, fontStyle: '600',
    }).setOrigin(1, 0);

    // XP bar
    const xpBarY = s(34);
    const xpBg = this.add.graphics();
    xpBg.fillStyle(COLORS.UI_PANEL, 1);
    xpBg.fillRoundedRect(s(14), xpBarY, width - s(28), s(8), s(4));
    this.xpBar = this.add.graphics();
    this.drawXPBar(data.xp, data.xpToNext);

    // === ORDER BAR (replaces quest bar) ===
    this.renderOrders(data.orders);

    // === BOTTOM BAR ===
    const bottomY = this.scale.height - SIZES.BOTTOM_BAR;
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(COLORS.UI_BG, 0.95);
    bottomBg.fillRect(0, bottomY, width, SIZES.BOTTOM_BAR);

    const btnDefs = [
      { emoji: '🛒', label: 'Shop', scene: 'ShopScene' },
      { emoji: '📖', label: 'Collection', scene: 'CollectionScene' },
      { emoji: '⚙️', label: 'Settings', scene: 'SettingsScene' },
    ];
    const btnWidth = width / 3;
    const btnCY = bottomY + SIZES.BOTTOM_BAR / 2;

    btnDefs.forEach((def, i) => {
      const cx = btnWidth * i + btnWidth / 2;
      const circleBg = this.add.graphics();
      circleBg.fillStyle(COLORS.UI_PANEL, 0.7);
      circleBg.fillCircle(cx, btnCY - s(4), s(18));

      this.add.text(cx, btnCY - s(8), def.emoji, { fontSize: fs(16) }).setOrigin(0.5);
      this.add.text(cx, btnCY + s(14), def.label, {
        fontSize: fs(9), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(0.5);

      const zone = this.add.zone(cx, btnCY, btnWidth, SIZES.BOTTOM_BAR).setInteractive();
      zone.on('pointerdown', () => {
        if (!this.scene.isActive(def.scene)) this.scene.launch(def.scene);
      });
    });

    // Listen for updates
    this.scene.get('GameScene').events.on('update-ui', this.onUpdate, this);
  }

  private renderOrders(orders: ActiveOrder[]): void {
    // Clear old elements
    this.orderElements.forEach(e => e.destroy());
    this.orderElements = [];

    const { width } = this.scale;
    const barY = SIZES.TOP_BAR;
    const barH = SIZES.QUEST_BAR;

    // Bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.UI_PANEL, 0.85);
    barBg.fillRect(0, barY, width, barH);
    this.orderElements.push(barBg);

    if (!orders || orders.length === 0) {
      const t = this.add.text(width / 2, barY + barH / 2, '📜 No orders yet', {
        fontSize: fs(11), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(0.5);
      this.orderElements.push(t);
      return;
    }

    const count = Math.min(orders.length, 3);
    const gap = s(4);
    const cardW = (width - gap * (count + 1)) / count;
    const cardH = barH - s(6);
    const cardY = barY + s(3);

    orders.slice(0, 3).forEach((order, i) => {
      const x = gap + i * (cardW + gap);
      const char = CHARACTERS.find(c => c.id === order.def.characterId);

      // Card bg
      const card = this.add.graphics();
      const cardColor = order.completed ? 0xC8E6C9 : 0xFFFFFF;
      card.fillStyle(cardColor, 0.9);
      card.fillRoundedRect(x, cardY, cardW, cardH, s(8));
      card.lineStyle(s(0.5), order.completed ? 0x81C784 : COLORS.CELL_BORDER, 0.4);
      card.strokeRoundedRect(x, cardY, cardW, cardH, s(8));
      this.orderElements.push(card);

      // Character emoji
      const charEmoji = this.add.text(x + s(4), cardY + cardH / 2, char?.emoji || '👤', {
        fontSize: fs(14),
      }).setOrigin(0, 0.5);
      this.orderElements.push(charEmoji);

      // Required items with progress
      const itemStartX = x + s(24);
      order.def.items.forEach((req, ri) => {
        const itemX = itemStartX + ri * s(28);
        const item = getChainItem(req.chainId, req.tier);
        const filled = order.progress[ri] || 0;
        const done = filled >= req.quantity;

        // Item emoji
        const itemEmoji = this.add.text(itemX, cardY + s(8), item?.emoji || '?', {
          fontSize: fs(11),
        });
        this.orderElements.push(itemEmoji);

        // Progress count
        const progColor = done ? TEXT.MINT : TEXT.SECONDARY;
        const progText = this.add.text(itemX + s(14), cardY + cardH - s(8), `${filled}/${req.quantity}`, {
          fontSize: fs(7), color: progColor, fontFamily: FONT_BODY, fontStyle: '600',
        }).setOrigin(0.5, 1);
        this.orderElements.push(progText);
      });

      // Reward (right side)
      const rewardX = x + cardW - s(4);
      const coinReward = order.def.rewards.find(r => r.type === 'coins');
      if (coinReward) {
        const rt = this.add.text(rewardX, cardY + s(6), `🪙${coinReward.amount}`, {
          fontSize: fs(8), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
        }).setOrigin(1, 0);
        this.orderElements.push(rt);
      }

      // GO button if completed
      if (order.completed) {
        const btnW = s(30), btnH = s(16);
        const btnX = rewardX - btnW;
        const btnY2 = cardY + cardH - s(20);
        const btnGfx = this.add.graphics();
        btnGfx.fillStyle(0x66BB6A, 1);
        btnGfx.fillRoundedRect(btnX, btnY2, btnW, btnH, btnH / 2);
        this.orderElements.push(btnGfx);

        const goText = this.add.text(btnX + btnW / 2, btnY2 + btnH / 2, 'GO', {
          fontSize: fs(8), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '700',
        }).setOrigin(0.5);
        this.orderElements.push(goText);

        const goZone = this.add.zone(btnX + btnW / 2, btnY2 + btnH / 2, btnW, btnH).setInteractive();
        goZone.on('pointerdown', () => {
          this.scene.get('GameScene').events.emit('claim-order', i);
        });
        this.orderElements.push(goZone);
      }
    });
  }

  private drawXPBar(xp: number, xpToNext: number): void {
    const { width } = this.scale;
    const barW = width - s(28);
    const barY = s(34);
    const progress = Math.min(xp / xpToNext, 1);
    this.xpBar.clear();
    if (progress > 0) {
      this.xpBar.fillGradientStyle(0x81C784, 0xFF7FAA, 0xA8E6CF, 0xFF9CAD, 1);
      this.xpBar.fillRoundedRect(s(14), barY, barW * progress, s(8), s(4));
    }
  }

  private onUpdate(data: {
    gems: number; coins: number; level: number; xp: number; xpToNext: number;
    quests: ActiveQuest[]; orders: ActiveOrder[];
  }): void {
    if (data.gems !== this.curGems) {
      this.curGems = data.gems;
      this.gemsText.setText(`💎 ${this.fmt(data.gems)}`);
    }
    if (data.coins !== this.curCoins) {
      this.curCoins = data.coins || 0;
      this.coinsText.setText(`🪙 ${this.fmt(data.coins || 0)}`);
      this.tweens.add({ targets: this.coinsText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    }
    if (data.level !== this.curLevel) {
      this.curLevel = data.level;
      this.levelText.setText(`⭐ Lv.${data.level}`);
      this.tweens.add({ targets: this.levelText, scaleX: 1.2, scaleY: 1.2, duration: 150, yoyo: true, ease: 'Back.easeOut' });
    }
    this.drawXPBar(data.xp, data.xpToNext);
    if (data.orders) this.renderOrders(data.orders);
  }

  private fmt(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  }
}
