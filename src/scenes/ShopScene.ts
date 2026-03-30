import { GENERATORS, MERGE_CHAINS } from '../data/chains';
import { COLORS, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';
import { GameScene } from './GameScene';

export class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  create() {
    const { width, height } = this.scale;
    const gameScene = this.scene.get('GameScene') as GameScene;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x5C5470, 0.4);
    overlay.fillRect(0, 0, width, height);

    const closeZone = this.add.zone(width / 2, height * 0.2, width, height * 0.4).setInteractive();
    closeZone.on('pointerdown', () => this.closeShop());

    const panelH = height * 0.6;
    const panelY = height - panelH;
    const panelR = s(24);

    // Panel shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0xC9A8D8, 0.2);
    shadow.fillRoundedRect(0, panelY + s(3), width, panelH + panelR, { tl: panelR, tr: panelR, bl: 0, br: 0 });

    const panel = this.add.graphics();
    panel.fillStyle(0xFFF8F0, 0.98);
    panel.fillRoundedRect(0, panelY, width, panelH + panelR, { tl: panelR, tr: panelR, bl: 0, br: 0 });
    panel.lineStyle(s(1.5), COLORS.CELL_BORDER, 0.3);
    panel.strokeRoundedRect(0, panelY, width, panelH, { tl: panelR, tr: panelR, bl: 0, br: 0 });

    // Handle
    const handle = this.add.graphics();
    handle.fillStyle(COLORS.CELL_BORDER, 0.4);
    handle.fillRoundedRect(width / 2 - s(25), panelY + s(10), s(50), s(4), s(2));

    this.add.text(width / 2, panelY + s(32), '🛒 Shop', {
      fontSize: fs(22), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + s(55), `💎 ${gameScene.gems.toLocaleString()} gems`, {
      fontSize: fs(12), color: '#A8D8EA', fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    const closeBtn = this.add.text(width - s(20), panelY + s(15), '✕', {
      fontSize: fs(18), color: TEXT.SECONDARY, fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive();
    closeBtn.on('pointerdown', () => this.closeShop());

    this.add.text(s(20), panelY + s(80), 'Generators', {
      fontSize: fs(14), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
    });

    const startY = panelY + s(105);
    const cardH = s(60);
    const cardGap = s(8);

    GENERATORS.forEach((gen, i) => {
      const y = startY + i * (cardH + cardGap);
      if (y + cardH > height - s(20)) return;

      const chain = MERGE_CHAINS.find(c => c.id === gen.chainId);
      const unlocked = gameScene.playerLevel >= gen.unlockedAtLevel;

      const card = this.add.graphics();
      card.fillStyle(unlocked ? 0xFFF0F5 : 0xF0EAF0, 0.95);
      card.fillRoundedRect(s(12), y, width - s(24), cardH, s(14));
      card.lineStyle(s(1), unlocked ? COLORS.CELL_BORDER : 0xE0D8E8, 0.4);
      card.strokeRoundedRect(s(12), y, width - s(24), cardH, s(14));

      this.add.text(s(30), y + cardH / 2, gen.emoji, { fontSize: fs(24) }).setOrigin(0, 0.5);

      this.add.text(s(70), y + s(12), gen.name, {
        fontSize: fs(13), color: unlocked ? TEXT.PRIMARY : TEXT.SECONDARY, fontFamily: FONT, fontStyle: '600',
      });

      this.add.text(s(70), y + s(32), chain ? `${chain.name} chain` : '', {
        fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
      });

      if (!unlocked) {
        this.add.text(width - s(30), y + cardH / 2, `🔒 Lv.${gen.unlockedAtLevel}`, {
          fontSize: fs(11), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
        }).setOrigin(1, 0.5);
      } else {
        const btnW = s(80), btnH = s(32);
        const btnX = width - s(30) - btnW;
        const btnY2 = y + (cardH - btnH) / 2;
        const costText = gen.cost === 0 ? 'Free!' : `💎 ${gen.cost}`;
        const canAfford = gen.cost === 0 || gameScene.gems >= gen.cost;

        const btnGfx = this.add.graphics();
        btnGfx.fillStyle(canAfford ? 0xFF9CAD : 0xD4B8E8, 1);
        btnGfx.fillRoundedRect(btnX, btnY2, btnW, btnH, btnH / 2);

        this.add.text(btnX + btnW / 2, btnY2 + btnH / 2, costText, {
          fontSize: fs(11), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
        }).setOrigin(0.5);

        if (canAfford) {
          const buyZone = this.add.zone(btnX + btnW / 2, btnY2 + btnH / 2, btnW, btnH).setInteractive();
          buyZone.on('pointerdown', () => {
            this.tweens.add({ targets: btnGfx, alpha: 0.5, duration: 80, yoyo: true });
            this.scene.get('GameScene').events.emit('shop-buy-generator', gen);
            this.time.delayedCall(300, () => this.closeShop());
          });
        }
      }
    });
  }

  private closeShop(): void {
    this.cameras.main.fadeOut(200, 255, 248, 240);
    this.time.delayedCall(200, () => this.scene.stop('ShopScene'));
  }
}
