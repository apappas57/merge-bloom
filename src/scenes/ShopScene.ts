import { GENERATORS, GeneratorDef, MERGE_CHAINS, getChainItem } from '../data/chains';
import { SIZES, COLORS, FONT, fs, s } from '../utils/constants';
import { GameScene } from './GameScene';

export class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  create() {
    const { width, height } = this.scale;
    const gameScene = this.scene.get('GameScene') as GameScene;

    // Semi-transparent backdrop
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);

    // Tap backdrop to close
    const closeZone = this.add.zone(width / 2, height * 0.2, width, height * 0.4).setInteractive();
    closeZone.on('pointerdown', () => this.closeShop());

    // Panel
    const panelH = height * 0.6;
    const panelY = height - panelH;
    const panelR = s(20);

    const panel = this.add.graphics();
    panel.fillStyle(0x0d1b2a, 0.98);
    panel.fillRoundedRect(0, panelY, width, panelH + panelR, { tl: panelR, tr: panelR, bl: 0, br: 0 });

    // Panel border
    panel.lineStyle(s(2), COLORS.ACCENT_TEAL, 0.4);
    panel.strokeRoundedRect(0, panelY, width, panelH, { tl: panelR, tr: panelR, bl: 0, br: 0 });

    // Handle indicator
    const handleGfx = this.add.graphics();
    handleGfx.fillStyle(0x4a5568, 0.6);
    handleGfx.fillRoundedRect(width / 2 - s(25), panelY + s(10), s(50), s(4), s(2));

    // Title
    this.add.text(width / 2, panelY + s(30), '🛒 Shop', {
      fontSize: fs(22), color: '#ffffff', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Gems display
    this.add.text(width / 2, panelY + s(55), `💎 ${gameScene.gems.toLocaleString()} gems`, {
      fontSize: fs(13), color: '#87ceeb', fontFamily: 'system-ui',
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(width - s(20), panelY + s(15), '✕', {
      fontSize: fs(20), color: '#8899aa', fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive();
    closeBtn.on('pointerdown', () => this.closeShop());

    // Section: Generators
    this.add.text(s(20), panelY + s(80), 'Generators', {
      fontSize: fs(15), color: '#ffd700', fontFamily: FONT, fontStyle: 'bold',
    });

    const startY = panelY + s(105);
    const cardH = s(60);
    const cardGap = s(8);

    GENERATORS.forEach((gen, i) => {
      const y = startY + i * (cardH + cardGap);
      if (y + cardH > height - s(20)) return; // don't overflow

      const chain = MERGE_CHAINS.find(c => c.id === gen.chainId);
      const unlocked = gameScene.playerLevel >= gen.unlockedAtLevel;

      // Card background
      const card = this.add.graphics();
      card.fillStyle(unlocked ? 0x1b2838 : 0x111822, 0.9);
      card.fillRoundedRect(s(12), y, width - s(24), cardH, s(10));
      card.lineStyle(s(1), unlocked ? 0x2a5298 : 0x1a2a3a, 0.5);
      card.strokeRoundedRect(s(12), y, width - s(24), cardH, s(10));

      // Generator emoji
      this.add.text(s(30), y + cardH / 2, gen.emoji, {
        fontSize: fs(24),
      }).setOrigin(0, 0.5);

      // Name + chain
      this.add.text(s(70), y + s(12), gen.name, {
        fontSize: fs(13), color: unlocked ? '#ffffff' : '#4a5568', fontFamily: 'system-ui', fontStyle: 'bold',
      });

      this.add.text(s(70), y + s(32), chain ? `${chain.name} chain` : '', {
        fontSize: fs(10), color: '#8899aa', fontFamily: 'system-ui',
      });

      if (!unlocked) {
        // Locked
        this.add.text(width - s(30), y + cardH / 2, `🔒 Lv.${gen.unlockedAtLevel}`, {
          fontSize: fs(11), color: '#4a5568', fontFamily: 'system-ui',
        }).setOrigin(1, 0.5);
      } else {
        // Buy button
        const btnW = s(80), btnH = s(32);
        const btnX = width - s(30) - btnW;
        const btnY = y + (cardH - btnH) / 2;

        const costText = gen.cost === 0 ? 'Free!' : `💎 ${gen.cost}`;
        const canAfford = gen.cost === 0 || gameScene.gems >= gen.cost;

        const btnGfx = this.add.graphics();
        btnGfx.fillStyle(canAfford ? 0x2ecc71 : 0x4a5568, 1);
        btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, s(8));

        const btnText = this.add.text(btnX + btnW / 2, btnY + btnH / 2, costText, {
          fontSize: fs(11), color: '#ffffff', fontFamily: 'system-ui', fontStyle: 'bold',
        }).setOrigin(0.5);

        if (canAfford) {
          const buyZone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH).setInteractive();
          buyZone.on('pointerdown', () => {
            // Emit buy event to GameScene
            this.scene.get('GameScene').events.emit('shop-buy-generator', gen);

            // Flash effect
            this.tweens.add({
              targets: btnGfx, alpha: 0.5, duration: 100, yoyo: true,
            });

            // Close shop after purchase
            this.time.delayedCall(300, () => this.closeShop());
          });
        }
      }
    });

    // Slide-up animation
    const allObjects = this.children.list;
    const panelObjects = allObjects.filter((_o, i) => i > 1); // skip overlay and closeZone
    panelObjects.forEach(obj => {
      const go = obj as unknown as { y: number };
      if (typeof go.y === 'number') {
        const origY = go.y;
        go.y = origY + s(300);
        this.tweens.add({
          targets: obj, y: origY, duration: 300, ease: 'Power2',
        });
      }
    });
  }

  private closeShop(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.stop('ShopScene');
    });
  }
}
