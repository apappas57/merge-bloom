import { MERGE_CHAINS } from '../data/chains';
import { COLORS, FONT, fs, s } from '../utils/constants';
import { SaveSystem } from '../systems/SaveSystem';

export class CollectionScene extends Phaser.Scene {
  constructor() { super('CollectionScene'); }

  create() {
    const { width, height } = this.scale;
    const save = SaveSystem.load();
    const discovered = new Map<string, number>();
    if (save) {
      for (const c of save.collection) discovered.set(c.chainId, c.maxTier);
    }

    // Backdrop
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);

    const closeZone = this.add.zone(width / 2, height * 0.08, width, height * 0.16).setInteractive();
    closeZone.on('pointerdown', () => this.closeScene());

    // Panel
    const panelH = height * 0.82;
    const panelY = height - panelH;
    const panelR = s(20);

    const panel = this.add.graphics();
    panel.fillStyle(0x0d1b2a, 0.98);
    panel.fillRoundedRect(0, panelY, width, panelH + panelR, { tl: panelR, tr: panelR, bl: 0, br: 0 });
    panel.lineStyle(s(2), COLORS.ACCENT_TEAL, 0.4);
    panel.strokeRoundedRect(0, panelY, width, panelH, { tl: panelR, tr: panelR, bl: 0, br: 0 });

    // Handle
    const handle = this.add.graphics();
    handle.fillStyle(0x4a5568, 0.6);
    handle.fillRoundedRect(width / 2 - s(25), panelY + s(10), s(50), s(4), s(2));

    // Title
    this.add.text(width / 2, panelY + s(30), '📖 Collection', {
      fontSize: fs(22), color: '#ffffff', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Close
    const closeBtn = this.add.text(width - s(20), panelY + s(15), '✕', {
      fontSize: fs(20), color: '#8899aa', fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive();
    closeBtn.on('pointerdown', () => this.closeScene());

    // Stats summary
    let totalDiscovered = 0;
    let totalItems = 0;
    for (const chain of MERGE_CHAINS) {
      totalItems += chain.items.length;
      const maxTier = discovered.get(chain.id) || 0;
      totalDiscovered += Math.min(maxTier, chain.items.length);
    }

    this.add.text(width / 2, panelY + s(55), `${totalDiscovered} / ${totalItems} items discovered`, {
      fontSize: fs(12), color: '#8899aa', fontFamily: 'system-ui',
    }).setOrigin(0.5);

    // Chain rows
    let y = panelY + s(80);
    const rowH = s(75);
    const itemSize = s(36);
    const itemGap = s(6);

    for (const chain of MERGE_CHAINS) {
      const maxTier = discovered.get(chain.id) || 0;
      const pct = Math.round((Math.min(maxTier, chain.items.length) / chain.items.length) * 100);

      // Chain name + progress
      this.add.text(s(16), y, chain.name, {
        fontSize: fs(13), color: '#ffffff', fontFamily: 'system-ui', fontStyle: 'bold',
      });

      this.add.text(width - s(16), y, `${pct}%`, {
        fontSize: fs(11), color: pct === 100 ? '#2ecc71' : '#8899aa', fontFamily: 'system-ui', fontStyle: 'bold',
      }).setOrigin(1, 0);

      // Progress bar
      const barY = y + s(18);
      const barW = width - s(32);
      const barBg = this.add.graphics();
      barBg.fillStyle(0x1b2838, 1);
      barBg.fillRoundedRect(s(16), barY, barW, s(4), s(2));
      if (pct > 0) {
        const barFill = this.add.graphics();
        barFill.fillStyle(COLORS.ACCENT_TEAL, 1);
        barFill.fillRoundedRect(s(16), barY, barW * (pct / 100), s(4), s(2));
      }

      // Item icons
      const iconsY = barY + s(12);
      chain.items.forEach((item, i) => {
        const ix = s(16) + i * (itemSize + itemGap);
        if (ix + itemSize > width - s(16)) return; // don't overflow

        const isFound = item.tier <= maxTier;

        // Item background
        const itemBg = this.add.graphics();
        itemBg.fillStyle(isFound ? 0x1b2838 : 0x111822, 0.9);
        itemBg.fillRoundedRect(ix, iconsY, itemSize, itemSize, s(6));
        itemBg.lineStyle(s(1), isFound ? 0x2a5298 : 0x1a2a3a, 0.4);
        itemBg.strokeRoundedRect(ix, iconsY, itemSize, itemSize, s(6));

        if (isFound) {
          // Show emoji
          this.add.text(ix + itemSize / 2, iconsY + itemSize / 2, item.emoji, {
            fontSize: fs(18),
          }).setOrigin(0.5);
        } else {
          // Show lock/question mark
          this.add.text(ix + itemSize / 2, iconsY + itemSize / 2, '?', {
            fontSize: fs(14), color: '#2a3a4a', fontFamily: 'system-ui', fontStyle: 'bold',
          }).setOrigin(0.5);
        }
      });

      y += rowH;
      if (y + rowH > height - s(20)) break;
    }
  }

  private closeScene(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => this.scene.stop('CollectionScene'));
  }
}
