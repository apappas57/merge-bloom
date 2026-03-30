import { SIZES, COLORS, FONT, FONT_BODY, TEXT, SAFE_AREA_TOP, fs, s } from '../utils/constants';
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
  private lastOrderHash = '';

  constructor() { super('UIScene'); }

  create(data: {
    gems: number; coins: number; level: number; xp: number; xpToNext: number;
    quests: ActiveQuest[]; orders: ActiveOrder[];
  }) {
    const { width } = this.scale;
    this.curGems = data.gems;
    this.curCoins = data.coins || 0;
    this.curLevel = data.level;

    // === COMPACT TOP BAR ===
    const topBg = this.add.graphics();
    topBg.fillStyle(COLORS.UI_BG, 0.95);
    topBg.fillRect(0, 0, width, SIZES.TOP_BAR);
    topBg.fillStyle(COLORS.ACCENT_ROSE, 0.2);
    topBg.fillRect(0, SIZES.TOP_BAR - s(1), width, s(1));

    // Content starts below safe area (Dynamic Island on iPhone 16)
    const contentY = SAFE_AREA_TOP + s(4);

    this.levelText = this.add.text(s(10), contentY, `⭐${data.level}`, {
      fontSize: fs(13), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
    });

    this.coinsText = this.add.text(width / 2 - s(20), contentY, `🪙${this.fmt(data.coins || 0)}`, {
      fontSize: fs(13), color: '#E8A317', fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5, 0);

    this.gemsText = this.add.text(width - s(10), contentY, `💎${this.fmt(data.gems)}`, {
      fontSize: fs(13), color: '#A8D8EA', fontFamily: FONT, fontStyle: '600',
    }).setOrigin(1, 0);

    // Thin XP bar
    const xpY = contentY + s(20);
    const xpBg = this.add.graphics();
    xpBg.fillStyle(COLORS.UI_PANEL, 1);
    xpBg.fillRoundedRect(s(10), xpY, width - s(20), s(6), s(3));
    this.xpBar = this.add.graphics();
    this.drawXPBar(data.xp, data.xpToNext);

    // === ORDER BAR ===
    this.renderOrders(data.orders);

    // === BOTTOM BAR ===
    const bottomY = this.scale.height - SIZES.BOTTOM_BAR;
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(COLORS.UI_BG, 0.95);
    bottomBg.fillRect(0, bottomY, width, SIZES.BOTTOM_BAR);

    const btnDefs = [
      { emoji: '📅', label: 'Daily', scene: 'DailyChallengeScene' },
      { emoji: '🛒', label: 'Shop', scene: 'ShopScene' },
      { emoji: '📖', label: 'Items', scene: 'CollectionScene' },
      { emoji: '⚙️', label: 'More', scene: 'SettingsScene' },
    ];
    const btnWidth = width / btnDefs.length;
    btnDefs.forEach((def, i) => {
      const cx = btnWidth * i + btnWidth / 2;
      const cy = bottomY + SIZES.BOTTOM_BAR / 2 - s(6); // Shift up above home indicator
      this.add.text(cx, cy - s(2), def.emoji, { fontSize: fs(14) }).setOrigin(0.5);
      this.add.text(cx, cy + s(14), def.label, {
        fontSize: fs(8), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(0.5);
      const zone = this.add.zone(cx, cy, btnWidth, SIZES.BOTTOM_BAR).setInteractive();
      zone.on('pointerdown', () => {
        if (!this.scene.isActive(def.scene)) this.scene.launch(def.scene);
      });
    });

    this.scene.get('GameScene').events.on('update-ui', this.onUpdate, this);
  }

  private renderOrders(orders: ActiveOrder[]): void {
    this.orderElements.forEach(e => e.destroy());
    this.orderElements = [];

    const { width } = this.scale;
    const barY = SIZES.TOP_BAR;
    const barH = SIZES.ORDER_BAR;

    // Bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.UI_PANEL, 0.8);
    barBg.fillRect(0, barY, width, barH);
    barBg.fillStyle(COLORS.CELL_BORDER, 0.15);
    barBg.fillRect(0, barY + barH - s(1), width, s(1));
    this.orderElements.push(barBg);

    if (!orders || orders.length === 0) {
      const t = this.add.text(width / 2, barY + barH / 2, '📜 Waiting for orders...', {
        fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(0.5);
      this.orderElements.push(t);
      return;
    }

    const count = Math.min(orders.length, 3);
    const gap = s(5);
    const cardW = (width - gap * (count + 1)) / count;
    const cardH = barH - s(8);
    const cardY = barY + s(4);

    orders.slice(0, 3).forEach((order, i) => {
      const x = gap + i * (cardW + gap);
      const char = CHARACTERS.find(c => c.id === order.def.characterId);
      const isComplete = order.completed;

      // Card background
      const card = this.add.graphics();
      card.fillStyle(isComplete ? 0xC8E6C9 : 0xFFFFFF, 0.95);
      card.fillRoundedRect(x, cardY, cardW, cardH, s(10));
      card.lineStyle(s(1), isComplete ? 0x81C784 : COLORS.CELL_BORDER, 0.4);
      card.strokeRoundedRect(x, cardY, cardW, cardH, s(10));
      this.orderElements.push(card);

      // Character portrait (custom kawaii face)
      const portraitKey = `char_${order.def.characterId}`;
      const portraitSize = s(30);
      if (this.textures.exists(portraitKey)) {
        const portrait = this.add.image(x + s(6) + portraitSize / 2, cardY + s(6) + portraitSize / 2, portraitKey);
        portrait.setDisplaySize(portraitSize, portraitSize);
        this.orderElements.push(portrait);
      }

      // Character name
      const nameText = this.add.text(x + s(6) + portraitSize / 2, cardY + s(6) + portraitSize + s(2), char?.name || '?', {
        fontSize: fs(7), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
      }).setOrigin(0.5, 0);
      this.orderElements.push(nameText);

      // Required items — larger, clearer
      const itemAreaX = x + portraitSize + s(14);
      const itemAreaW = cardW - portraitSize - s(18);
      const itemSize = s(22);
      const itemGap = s(4);

      order.def.items.forEach((req, ri) => {
        const ix = itemAreaX + ri * (itemSize + itemGap + s(8));
        const iy = cardY + s(6);
        const chainItem = getChainItem(req.chainId, req.tier);
        const filled = order.progress[ri] || 0;
        const done = filled >= req.quantity;

        // Item background circle
        const itemBg = this.add.graphics();
        itemBg.fillStyle(done ? 0xC8E6C9 : 0xF3E8FF, 0.8);
        itemBg.fillCircle(ix + itemSize / 2, iy + itemSize / 2, itemSize / 2 + s(2));
        if (done) {
          itemBg.lineStyle(s(1), 0x81C784, 0.6);
          itemBg.strokeCircle(ix + itemSize / 2, iy + itemSize / 2, itemSize / 2 + s(2));
        }
        this.orderElements.push(itemBg);

        // Item emoji
        const ie = this.add.text(ix + itemSize / 2, iy + itemSize / 2, chainItem?.emoji || '?', {
          fontSize: fs(12),
        }).setOrigin(0.5);
        this.orderElements.push(ie);

        // Progress badge
        const badge = this.add.text(ix + itemSize / 2, iy + itemSize + s(4), `${filled}/${req.quantity}`, {
          fontSize: fs(8), color: done ? '#4CAF50' : TEXT.PRIMARY,
          fontFamily: FONT, fontStyle: '600',
        }).setOrigin(0.5, 0);
        this.orderElements.push(badge);
      });

      // Reward — bottom right
      const coinReward = order.def.rewards.find(r => r.type === 'coins');
      if (coinReward) {
        const rx = x + cardW - s(6);
        const ry = cardY + cardH - s(14);
        const rt = this.add.text(rx, ry, `🪙${coinReward.amount}`, {
          fontSize: fs(9), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
        }).setOrigin(1, 0.5);
        this.orderElements.push(rt);
      }

      // GO button when complete
      if (isComplete) {
        const btnW = s(36), btnH = s(20);
        const btnX = x + cardW - btnW - s(4);
        const btnY2 = cardY + s(6);
        const btnGfx = this.add.graphics();
        btnGfx.fillStyle(0x66BB6A, 1);
        btnGfx.fillRoundedRect(btnX, btnY2, btnW, btnH, btnH / 2);
        this.orderElements.push(btnGfx);

        const goText = this.add.text(btnX + btnW / 2, btnY2 + btnH / 2, '✓', {
          fontSize: fs(11), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '700',
        }).setOrigin(0.5);
        this.orderElements.push(goText);

        // Pulse the GO button
        this.tweens.add({
          targets: [btnGfx, goText], scaleX: 1.05, scaleY: 1.05,
          duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        const goZone = this.add.zone(btnX + btnW / 2, btnY2 + btnH / 2, btnW + s(16), s(44)).setInteractive();
        goZone.on('pointerdown', () => {
          this.scene.get('GameScene').events.emit('claim-order', i);
        });
        this.orderElements.push(goZone);
      }
    });
  }

  private drawXPBar(xp: number, xpToNext: number): void {
    const { width } = this.scale;
    const barW = width - s(20);
    const barY = SAFE_AREA_TOP + s(24);
    const progress = Math.min(xp / xpToNext, 1);
    this.xpBar.clear();
    if (progress > 0) {
      this.xpBar.fillGradientStyle(0x81C784, 0xFF7FAA, 0xA8E6CF, 0xFF9CAD, 1);
      this.xpBar.fillRoundedRect(s(10), barY, barW * progress, s(6), s(3));
    }
  }

  private onUpdate(data: {
    gems: number; coins: number; level: number; xp: number; xpToNext: number;
    quests: ActiveQuest[]; orders: ActiveOrder[];
  }): void {
    if (data.gems !== this.curGems) {
      this.curGems = data.gems;
      this.gemsText.setText(`💎${this.fmt(data.gems)}`);
    }
    if ((data.coins || 0) !== this.curCoins) {
      this.curCoins = data.coins || 0;
      this.coinsText.setText(`🪙${this.fmt(data.coins || 0)}`);
      this.tweens.add({ targets: this.coinsText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    }
    if (data.level !== this.curLevel) {
      this.curLevel = data.level;
      this.levelText.setText(`⭐${data.level}`);
    }
    this.drawXPBar(data.xp, data.xpToNext);
    // Only re-render orders if they actually changed
    if (data.orders) {
      const hash = JSON.stringify(data.orders.map(o => [o.def.id, o.progress, o.completed]));
      if (hash !== this.lastOrderHash) {
        this.lastOrderHash = hash;
        this.renderOrders(data.orders);
      }
    }
  }

  private fmt(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  }
}
