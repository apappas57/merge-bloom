import { SIZES, COLORS, FONT, FONT_BODY, TEXT, SAFE_AREA_TOP, fs, s } from '../utils/constants';
import { ActiveQuest } from '../systems/QuestSystem';
import { ActiveOrder } from '../systems/OrderSystem';
import { CHARACTERS } from '../data/orders';
import { getChainItem } from '../data/chains';
import { SoundManager } from '../utils/SoundManager';

export class UIScene extends Phaser.Scene {
  private gemsText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private levelIcon!: Phaser.GameObjects.Graphics;
  private coinIcon!: Phaser.GameObjects.Graphics;
  private gemIcon!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private orderElements: Phaser.GameObjects.GameObject[] = [];
  private orderGlowTweens: Phaser.Tweens.Tween[] = [];
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

    // === COMPACT TOP BAR (Frosted glass / jelly look) ===
    const topBg = this.add.graphics();
    // Base fill with higher transparency for frosted glass effect
    topBg.fillStyle(0xFFFFFF, 0.55);
    topBg.fillRect(0, 0, width, SIZES.TOP_BAR);
    // Subtle pink tint overlay
    topBg.fillStyle(COLORS.UI_BG, 0.35);
    topBg.fillRect(0, 0, width, SIZES.TOP_BAR);
    // Inner highlight along top edge (light inner glow)
    topBg.fillStyle(0xFFFFFF, 0.3);
    topBg.fillRect(0, 0, width, s(1));
    // Inner border highlight
    topBg.lineStyle(s(0.5), 0xFFFFFF, 0.4);
    topBg.strokeRect(0, s(1), width, SIZES.TOP_BAR - s(2));
    // Bottom accent line
    topBg.fillStyle(COLORS.ACCENT_ROSE, 0.15);
    topBg.fillRect(0, SIZES.TOP_BAR - s(1), width, s(1));

    // Content starts below safe area (Dynamic Island on iPhone 16)
    const contentY = SAFE_AREA_TOP + s(4);

    // Level star icon (canvas-drawn)
    this.levelIcon = this.add.graphics();
    this.drawStarIcon(this.levelIcon, s(16), contentY + s(7), s(7), 0xFFD700);

    this.levelText = this.add.text(s(24), contentY, `${data.level}`, {
      fontSize: fs(13), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
    });

    // Coin icon (canvas-drawn gold circle with highlight)
    this.coinIcon = this.add.graphics();
    const coinIconX = width / 2 - s(20);
    this.drawCoinIcon(this.coinIcon, coinIconX - s(14), contentY + s(7), s(6));

    this.coinsText = this.add.text(coinIconX, contentY, `${this.fmt(data.coins || 0)}`, {
      fontSize: fs(13), color: '#E8A317', fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5, 0);

    // Gem icon (canvas-drawn diamond)
    this.gemIcon = this.add.graphics();
    this.drawGemIcon(this.gemIcon, width - s(10) - s(14), contentY + s(7), s(6));

    this.gemsText = this.add.text(width - s(10), contentY, `${this.fmt(data.gems)}`, {
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

    // === BOTTOM BAR (Frosted glass / jelly look) ===
    const bottomY = this.scale.height - SIZES.BOTTOM_BAR;
    const bottomBg = this.add.graphics();
    // Base frosted glass fill
    bottomBg.fillStyle(0xFFFFFF, 0.55);
    bottomBg.fillRect(0, bottomY, width, SIZES.BOTTOM_BAR);
    // Subtle pink tint overlay
    bottomBg.fillStyle(COLORS.UI_BG, 0.35);
    bottomBg.fillRect(0, bottomY, width, SIZES.BOTTOM_BAR);
    // Top edge highlight (inner glow)
    bottomBg.fillStyle(0xFFFFFF, 0.3);
    bottomBg.fillRect(0, bottomY, width, s(1));
    // Inner border highlight
    bottomBg.lineStyle(s(0.5), 0xFFFFFF, 0.4);
    bottomBg.strokeRect(0, bottomY + s(1), width, SIZES.BOTTOM_BAR - s(2));
    // Top accent separator
    bottomBg.fillStyle(COLORS.ACCENT_ROSE, 0.1);
    bottomBg.fillRect(0, bottomY, width, s(1));

    const btnDefs = [
      { icon: 'calendar', label: 'Daily', scene: 'DailyChallengeScene' },
      { icon: 'bag', label: 'Shop', scene: 'ShopScene' },
      { icon: 'book', label: 'Items', scene: 'CollectionScene' },
      { icon: 'gear', label: 'More', scene: 'SettingsScene' },
    ];
    const btnWidth = width / btnDefs.length;
    btnDefs.forEach((def, i) => {
      const cx = btnWidth * i + btnWidth / 2;
      const cy = bottomY + SIZES.BOTTOM_BAR / 2 - s(6); // Shift up above home indicator
      const iconG = this.add.graphics();
      this.drawBottomBarIcon(iconG, cx, cy - s(2), s(10), def.icon);
      this.add.text(cx, cy + s(14), def.label, {
        fontSize: fs(8), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(0.5);
      const zone = this.add.zone(cx, cy, btnWidth, SIZES.BOTTOM_BAR).setInteractive();
      zone.on('pointerdown', () => {
        const gs = this.scene.get('GameScene') as { sound_?: SoundManager } | undefined;
        gs?.sound_?.buttonPress();
        if (!this.scene.isActive(def.scene)) this.scene.launch(def.scene);
      });
    });

    this.scene.get('GameScene').events.on('update-ui', this.onUpdate, this);
  }

  private renderOrders(orders: ActiveOrder[], boardMatches?: boolean[]): void {
    this.orderElements.forEach(e => e.destroy());
    this.orderElements = [];
    // Kill any existing glow tweens
    this.orderGlowTweens.forEach(t => t.destroy());
    this.orderGlowTweens = [];

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
      const t = this.add.text(width / 2, barY + barH / 2, 'Waiting for orders...', {
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
      const hasMatch = boardMatches ? boardMatches[i] : false;

      // Pulsing glow behind card when a matching item is on the board
      if (hasMatch && !isComplete) {
        const glow = this.add.graphics();
        glow.fillStyle(COLORS.ACCENT_ROSE, 0.25);
        glow.fillRoundedRect(x - s(2), cardY - s(2), cardW + s(4), cardH + s(4), s(12));
        glow.lineStyle(s(2), COLORS.ACCENT_ROSE, 0.5);
        glow.strokeRoundedRect(x - s(2), cardY - s(2), cardW + s(4), cardH + s(4), s(12));
        this.orderElements.push(glow);

        const glowTween = this.tweens.add({
          targets: glow, alpha: 0.4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        this.orderGlowTweens.push(glowTween);
      }

      // Card background — clean white, green border hint when complete, rose when fulfillable
      const card = this.add.graphics();
      card.fillStyle(0xFFFFFF, 0.95);
      card.fillRoundedRect(x, cardY, cardW, cardH, s(10));
      const borderColor = isComplete ? 0x81C784 : (hasMatch ? COLORS.ACCENT_ROSE : COLORS.CELL_BORDER);
      const borderAlpha = isComplete ? 0.6 : (hasMatch ? 0.6 : 0.3);
      card.lineStyle(s(isComplete || hasMatch ? 1.5 : 1), borderColor, borderAlpha);
      card.strokeRoundedRect(x, cardY, cardW, cardH, s(10));
      this.orderElements.push(card);

      // Interactive hit zone on each order card
      const zone = this.add.zone(x + cardW / 2, cardY + cardH / 2, cardW, cardH).setInteractive();
      zone.on('pointerdown', () => {
        if (isComplete) return;
        // Emit claim-order-item event to GameScene
        this.scene.get('GameScene').events.emit('claim-order-item', i);
      });
      this.orderElements.push(zone);

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

        // Item icon (canvas-rendered texture, matching in-game items)
        const itemKey = `${req.chainId}_${req.tier}`;
        if (this.textures.exists(itemKey)) {
          const itemImg = this.add.image(ix + itemSize / 2, iy + itemSize / 2, itemKey);
          itemImg.setDisplaySize(itemSize, itemSize);
          this.orderElements.push(itemImg);
        } else {
          // Fallback to emoji text if texture not found
          const ie = this.add.text(ix + itemSize / 2, iy + itemSize / 2, chainItem?.emoji || '?', {
            fontSize: fs(12),
          }).setOrigin(0.5);
          this.orderElements.push(ie);
        }

        // Progress badge
        const badge = this.add.text(ix + itemSize / 2, iy + itemSize + s(4), `${filled}/${req.quantity}`, {
          fontSize: fs(8), color: done ? '#4CAF50' : TEXT.PRIMARY,
          fontFamily: FONT, fontStyle: '600',
        }).setOrigin(0.5, 0);
        this.orderElements.push(badge);
      });

      // "Tap!" indicator when order has matching board items
      if (hasMatch && !isComplete) {
        const tapLabel = this.add.text(x + cardW - s(10), cardY + s(8), 'Tap!', {
          fontSize: fs(8), color: '#EC407A', fontFamily: FONT, fontStyle: '700',
        }).setOrigin(1, 0);
        this.orderElements.push(tapLabel);

        const tapTween = this.tweens.add({
          targets: tapLabel, scaleX: 1.1, scaleY: 1.1, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        this.orderGlowTweens.push(tapTween);
      }

      // Reward — bottom right (canvas-drawn coin icon)
      const coinReward = order.def.rewards.find(r => r.type === 'coins');
      if (coinReward) {
        const rx = x + cardW - s(6);
        const ry = cardY + cardH - s(14);
        const coinG = this.add.graphics();
        this.drawCoinIcon(coinG, rx - s(32), ry, s(5));
        this.orderElements.push(coinG);
        const rt = this.add.text(rx, ry, `${coinReward.amount}`, {
          fontSize: fs(9), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
        }).setOrigin(1, 0.5);
        this.orderElements.push(rt);
      }

      // Completed indicator — canvas-drawn checkmark (no emoji)
      if (isComplete) {
        const checkG = this.add.graphics();
        const chkX = x + cardW - s(18);
        const chkY = cardY + s(10);
        const chkR = s(8);
        checkG.fillStyle(0x81C784, 1);
        checkG.fillCircle(chkX, chkY, chkR);
        checkG.lineStyle(s(1.5), 0xFFFFFF, 1);
        checkG.beginPath();
        checkG.moveTo(chkX - chkR * 0.4, chkY);
        checkG.lineTo(chkX - chkR * 0.05, chkY + chkR * 0.35);
        checkG.lineTo(chkX + chkR * 0.45, chkY - chkR * 0.3);
        checkG.strokePath();
        this.orderElements.push(checkG);
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
    quests: ActiveQuest[]; orders: ActiveOrder[]; boardMatches?: boolean[];
  }): void {
    if (data.gems !== this.curGems) {
      this.curGems = data.gems;
      this.gemsText.setText(`${this.fmt(data.gems)}`);
    }
    if ((data.coins || 0) !== this.curCoins) {
      this.curCoins = data.coins || 0;
      this.coinsText.setText(`${this.fmt(data.coins || 0)}`);
      this.tweens.add({ targets: this.coinsText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    }
    if (data.level !== this.curLevel) {
      this.curLevel = data.level;
      this.levelText.setText(`${data.level}`);
    }
    this.drawXPBar(data.xp, data.xpToNext);
    // Re-render orders when they change OR when board matches change
    if (data.orders) {
      const hash = JSON.stringify(data.orders.map(o => [o.def.id, o.progress, o.completed]).concat(data.boardMatches as never[] || []));
      if (hash !== this.lastOrderHash) {
        this.lastOrderHash = hash;
        this.renderOrders(data.orders, data.boardMatches);
      }
    }
  }

  private fmt(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  }

  // ─── Canvas-drawn icon helpers ───

  /** Draw a 5-point star */
  private drawStarIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number): void {
    g.fillStyle(color, 1);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const px = cx + Math.cos(angle) * rad;
      const py = cy + Math.sin(angle) * rad;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    // Highlight
    g.fillStyle(0xFFFFFF, 0.35);
    g.fillCircle(cx - r * 0.15, cy - r * 0.2, r * 0.2);
  }

  /** Draw a gold coin with highlight */
  private drawCoinIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number): void {
    // Shadow
    g.fillStyle(0xB8860B, 0.4);
    g.fillCircle(cx + s(0.5), cy + s(0.5), r);
    // Main coin
    const grad1 = 0xFFD700;
    g.fillStyle(grad1, 1);
    g.fillCircle(cx, cy, r);
    // Inner ring
    g.lineStyle(s(0.5), 0xDAA520, 0.6);
    g.strokeCircle(cx, cy, r * 0.72);
    // Highlight
    g.fillStyle(0xFFFFFF, 0.4);
    g.fillCircle(cx - r * 0.2, cy - r * 0.25, r * 0.3);
  }

  /** Draw a diamond/gem shape */
  private drawGemIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number): void {
    g.fillStyle(0x87CEEB, 1);
    g.beginPath();
    g.moveTo(cx, cy - r);         // top
    g.lineTo(cx + r * 0.8, cy - r * 0.2);  // top-right
    g.lineTo(cx + r * 0.5, cy + r);        // bottom-right
    g.lineTo(cx - r * 0.5, cy + r);        // bottom-left
    g.lineTo(cx - r * 0.8, cy - r * 0.2);  // top-left
    g.closePath();
    g.fillPath();
    // Facet highlight
    g.fillStyle(0xFFFFFF, 0.35);
    g.beginPath();
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r * 0.3, cy - r * 0.1);
    g.lineTo(cx - r * 0.15, cy - r * 0.1);
    g.lineTo(cx - r * 0.5, cy - r * 0.2);
    g.closePath();
    g.fillPath();
  }

  /** Draw bottom bar navigation icons */
  private drawBottomBarIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number, size: number, icon: string): void {
    const color = 0x9B7EAB; // muted purple matching the UI
    switch (icon) {
      case 'calendar': {
        // Calendar: rectangle with top tabs and grid
        const w = size * 1.6, h = size * 1.5;
        const x = cx - w / 2, y = cy - h / 2;
        g.fillStyle(color, 0.8);
        g.fillRoundedRect(x, y + h * 0.15, w, h * 0.85, s(2));
        // Top band
        g.fillStyle(color, 1);
        g.fillRect(x, y + h * 0.15, w, h * 0.25);
        // Tabs
        g.lineStyle(s(1.5), color, 1);
        g.beginPath();
        g.moveTo(x + w * 0.3, y); g.lineTo(x + w * 0.3, y + h * 0.25);
        g.moveTo(x + w * 0.7, y); g.lineTo(x + w * 0.7, y + h * 0.25);
        g.strokePath();
        // Grid dots
        g.fillStyle(0xFFFFFF, 0.7);
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            g.fillCircle(x + w * (0.22 + c * 0.28), y + h * (0.55 + r * 0.2), s(1.2));
          }
        }
        break;
      }
      case 'bag': {
        // Shopping bag: trapezoid body with handle
        const w = size * 1.4, h = size * 1.5;
        g.fillStyle(color, 0.85);
        g.beginPath();
        g.moveTo(cx - w * 0.35, cy - h * 0.1);
        g.lineTo(cx + w * 0.35, cy - h * 0.1);
        g.lineTo(cx + w * 0.42, cy + h * 0.5);
        g.lineTo(cx - w * 0.42, cy + h * 0.5);
        g.closePath();
        g.fillPath();
        // Round bottom
        g.fillRoundedRect(cx - w * 0.42, cy + h * 0.35, w * 0.84, h * 0.2, s(2));
        // Handle (arc)
        g.lineStyle(s(1.5), color, 0.9);
        g.beginPath();
        g.arc(cx, cy - h * 0.1, w * 0.22, Math.PI, 0, false);
        g.strokePath();
        break;
      }
      case 'book': {
        // Book: rectangle with spine
        const w = size * 1.4, h = size * 1.5;
        const x = cx - w / 2, y = cy - h / 2;
        // Pages
        g.fillStyle(0xFFFFFF, 0.6);
        g.fillRoundedRect(x + w * 0.15, y, w * 0.85, h, s(2));
        // Cover
        g.fillStyle(color, 0.85);
        g.fillRoundedRect(x, y, w * 0.88, h, { tl: s(2), tr: 0, bl: s(2), br: 0 });
        // Spine highlight
        g.fillStyle(0xFFFFFF, 0.2);
        g.fillRect(x + w * 0.08, y + h * 0.15, s(0.8), h * 0.7);
        // Page lines
        g.lineStyle(s(0.5), 0xFFFFFF, 0.4);
        g.beginPath();
        g.moveTo(x + w * 0.3, y + h * 0.3); g.lineTo(x + w * 0.75, y + h * 0.3);
        g.moveTo(x + w * 0.3, y + h * 0.5); g.lineTo(x + w * 0.75, y + h * 0.5);
        g.moveTo(x + w * 0.3, y + h * 0.7); g.lineTo(x + w * 0.6, y + h * 0.7);
        g.strokePath();
        break;
      }
      case 'gear': {
        // Gear: circle with teeth
        const outerR = size * 0.8;
        const innerR = size * 0.5;
        const teeth = 8;
        g.fillStyle(color, 0.85);
        g.beginPath();
        for (let i = 0; i < teeth * 2; i++) {
          const angle = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? outerR : innerR * 1.1;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.closePath();
        g.fillPath();
        // Center hole
        g.fillStyle(0xFFFFFF, 0.5);
        g.fillCircle(cx, cy, innerR * 0.5);
        break;
      }
    }
  }
}
