import { MERGE_CHAINS } from '../data/chains';
import { COLORS, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';
import { SaveSystem } from '../systems/SaveSystem';

export class CollectionScene extends Phaser.Scene {
  constructor() { super('CollectionScene'); }

  create() {
    const { width, height } = this.scale;
    const save = SaveSystem.load();
    const discovered = new Map<string, number>();
    if (save) for (const c of save.collection) discovered.set(c.chainId, c.maxTier);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x5C5470, 0.4);
    overlay.fillRect(0, 0, width, height);

    const closeZone = this.add.zone(width / 2, height * 0.08, width, height * 0.16).setInteractive();
    closeZone.on('pointerdown', () => this.closeScene());

    const panelH = height * 0.82;
    const panelY = height - panelH;
    const panelR = s(24);

    const panel = this.add.graphics();
    panel.fillStyle(0xFFF8F0, 0.98);
    panel.fillRoundedRect(0, panelY, width, panelH + panelR, { tl: panelR, tr: panelR, bl: 0, br: 0 });
    panel.lineStyle(s(1.5), COLORS.CELL_BORDER, 0.3);
    panel.strokeRoundedRect(0, panelY, width, panelH, { tl: panelR, tr: panelR, bl: 0, br: 0 });

    const handle = this.add.graphics();
    handle.fillStyle(COLORS.CELL_BORDER, 0.4);
    handle.fillRoundedRect(width / 2 - s(25), panelY + s(10), s(50), s(4), s(2));

    this.add.text(width / 2, panelY + s(30), '📖 Collection', {
      fontSize: fs(22), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(width - s(20), panelY + s(15), '✕', {
      fontSize: fs(18), color: TEXT.SECONDARY, fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive();
    closeBtn.on('pointerdown', () => this.closeScene());

    let totalDiscovered = 0, totalItems = 0;
    for (const chain of MERGE_CHAINS) {
      totalItems += chain.items.length;
      totalDiscovered += Math.min(discovered.get(chain.id) || 0, chain.items.length);
    }

    this.add.text(width / 2, panelY + s(55), `${totalDiscovered} / ${totalItems} items discovered`, {
      fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    let y = panelY + s(80);
    const rowH = s(75);
    const itemSize = s(36);
    const itemGap = s(6);

    for (const chain of MERGE_CHAINS) {
      const maxTier = discovered.get(chain.id) || 0;
      const pct = Math.round((Math.min(maxTier, chain.items.length) / chain.items.length) * 100);

      this.add.text(s(16), y, chain.name, {
        fontSize: fs(13), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
      });

      this.add.text(width - s(16), y, `${pct}%`, {
        fontSize: fs(11), color: pct === 100 ? TEXT.MINT : TEXT.SECONDARY, fontFamily: FONT, fontStyle: '600',
      }).setOrigin(1, 0);

      const barY = y + s(18);
      const barW = width - s(32);
      const barBg = this.add.graphics();
      barBg.fillStyle(COLORS.UI_PANEL, 1);
      barBg.fillRoundedRect(s(16), barY, barW, s(4), s(2));
      if (pct > 0) {
        const barFill = this.add.graphics();
        barFill.fillGradientStyle(0xA8E6CF, 0xFF9CAD, 0xA8E6CF, 0xFF9CAD, 1);
        barFill.fillRoundedRect(s(16), barY, barW * (pct / 100), s(4), s(2));
      }

      const iconsY = barY + s(12);
      chain.items.forEach((item, i) => {
        const ix = s(16) + i * (itemSize + itemGap);
        if (ix + itemSize > width - s(16)) return;

        const isFound = item.tier <= maxTier;
        const itemBg = this.add.graphics();
        itemBg.fillStyle(isFound ? 0xF3E8FF : 0xF0EAF0, 0.9);
        itemBg.fillRoundedRect(ix, iconsY, itemSize, itemSize, s(8));
        itemBg.lineStyle(s(1), isFound ? COLORS.CELL_BORDER : 0xE0D8E8, 0.3);
        itemBg.strokeRoundedRect(ix, iconsY, itemSize, itemSize, s(8));

        if (isFound) {
          this.add.text(ix + itemSize / 2, iconsY + itemSize / 2, item.emoji, { fontSize: fs(18) }).setOrigin(0.5);
        } else {
          this.add.text(ix + itemSize / 2, iconsY + itemSize / 2, '?', {
            fontSize: fs(14), color: '#D4B8E8', fontFamily: FONT, fontStyle: '600',
          }).setOrigin(0.5);
        }
      });

      y += rowH;
      if (y + rowH > height - s(20)) break;
    }
  }

  private closeScene(): void {
    this.cameras.main.fadeOut(200, 255, 248, 240);
    this.time.delayedCall(200, () => this.scene.stop('CollectionScene'));
  }
}
