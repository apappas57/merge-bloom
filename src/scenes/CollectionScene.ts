import { MERGE_CHAINS } from '../data/chains';
import { ACHIEVEMENTS } from '../data/achievements';
import { getLore } from '../data/lore';
import { COLORS, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';
import { SaveSystem } from '../systems/SaveSystem';

export class CollectionScene extends Phaser.Scene {
  private tab: 'items' | 'badges' = 'items';
  private contentContainer!: Phaser.GameObjects.Container;
  private panelY = 0;

  constructor() { super('CollectionScene'); }

  create() {
    const { width, height } = this.scale;
    const save = SaveSystem.load();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x5C5470, 0.4);
    overlay.fillRect(0, 0, width, height);

    const closeZone = this.add.zone(width / 2, height * 0.05, width, height * 0.1).setInteractive();
    closeZone.on('pointerdown', () => this.closeScene());

    const panelH = height * 0.88;
    this.panelY = height - panelH;
    const panelR = s(24);

    const panel = this.add.graphics();
    panel.fillStyle(0xFFF8F0, 0.98);
    panel.fillRoundedRect(0, this.panelY, width, panelH + panelR, { tl: panelR, tr: panelR, bl: 0, br: 0 });
    panel.lineStyle(s(1.5), COLORS.CELL_BORDER, 0.3);
    panel.strokeRoundedRect(0, this.panelY, width, panelH, { tl: panelR, tr: panelR, bl: 0, br: 0 });

    // Handle
    const handle = this.add.graphics();
    handle.fillStyle(COLORS.CELL_BORDER, 0.4);
    handle.fillRoundedRect(width / 2 - s(25), this.panelY + s(10), s(50), s(4), s(2));

    // Close
    this.add.text(width - s(20), this.panelY + s(15), '✕', {
      fontSize: fs(18), color: TEXT.SECONDARY, fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive().on('pointerdown', () => this.closeScene());

    // Tab buttons
    const tabY = this.panelY + s(28);
    const tabW = s(90);
    const tabH = s(30);

    const itemsTab = this.createTab(width / 2 - tabW - s(4), tabY, tabW, tabH, 'Items', this.tab === 'items');
    const badgesTab = this.createTab(width / 2 + s(4), tabY, tabW, tabH, 'Badges', this.tab === 'badges');

    itemsTab.zone.on('pointerdown', () => { this.tab = 'items'; this.renderContent(save); itemsTab.setActive(true); badgesTab.setActive(false); });
    badgesTab.zone.on('pointerdown', () => { this.tab = 'badges'; this.renderContent(save); itemsTab.setActive(false); badgesTab.setActive(true); });

    // Content container
    this.contentContainer = this.add.container(0, 0);

    this.renderContent(save);
  }

  private createTab(x: number, y: number, w: number, h: number, label: string, active: boolean) {
    const bg = this.add.graphics();
    const txt = this.add.text(x + w / 2, y + h / 2, label, {
      fontSize: fs(11), color: active ? TEXT.WHITE : TEXT.SECONDARY, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5);
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive();

    const draw = (isActive: boolean) => {
      bg.clear();
      bg.fillStyle(isActive ? 0xFF9CAD : 0xFFE4EC, 1);
      bg.fillRoundedRect(x, y, w, h, h / 2);
      txt.setColor(isActive ? TEXT.WHITE : TEXT.SECONDARY);
    };
    draw(active);

    return { zone, setActive: draw };
  }

  private renderContent(save: ReturnType<typeof SaveSystem.load>): void {
    this.contentContainer.removeAll(true);
    if (this.tab === 'items') this.renderItems(save);
    else this.renderBadges(save);
  }

  private renderItems(save: ReturnType<typeof SaveSystem.load>): void {
    const { width } = this.scale;
    const discovered = new Map<string, number>();
    if (save) for (const c of save.collection) discovered.set(c.chainId, c.maxTier);

    let y = this.panelY + s(70);
    const rowH = s(75);
    const itemSize = s(36);
    const itemGap = s(6);

    for (const chain of MERGE_CHAINS) {
      const maxTier = discovered.get(chain.id) || 0;
      const pct = Math.round((Math.min(maxTier, chain.items.length) / chain.items.length) * 100);

      const name = this.add.text(s(16), y, chain.name, {
        fontSize: fs(13), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
      });
      this.contentContainer.add(name);

      const pctText = this.add.text(width - s(16), y, `${pct}%`, {
        fontSize: fs(11), color: pct === 100 ? TEXT.MINT : TEXT.SECONDARY, fontFamily: FONT, fontStyle: '600',
      }).setOrigin(1, 0);
      this.contentContainer.add(pctText);

      // Progress bar
      const barY = y + s(18);
      const barW = width - s(32);
      const barBg = this.add.graphics();
      barBg.fillStyle(COLORS.UI_PANEL, 1);
      barBg.fillRoundedRect(s(16), barY, barW, s(4), s(2));
      this.contentContainer.add(barBg);
      if (pct > 0) {
        const barFill = this.add.graphics();
        barFill.fillGradientStyle(0xA8E6CF, 0xFF9CAD, 0xA8E6CF, 0xFF9CAD, 1);
        barFill.fillRoundedRect(s(16), barY, barW * (pct / 100), s(4), s(2));
        this.contentContainer.add(barFill);
      }

      const iconsY = barY + s(12);
      chain.items.forEach((item, i) => {
        const ix = s(16) + i * (itemSize + itemGap);
        if (ix + itemSize > width - s(16)) return;
        const isFound = item.tier <= maxTier;

        const bg = this.add.graphics();
        bg.fillStyle(isFound ? 0xF3E8FF : 0xF0EAF0, 0.9);
        bg.fillRoundedRect(ix, iconsY, itemSize, itemSize, s(8));
        bg.lineStyle(s(1), isFound ? COLORS.CELL_BORDER : 0xE0D8E8, 0.3);
        bg.strokeRoundedRect(ix, iconsY, itemSize, itemSize, s(8));
        this.contentContainer.add(bg);

        if (isFound) {
          // Use rendered texture if available, fallback to name initial
          const texKey = `${chain.id}_${item.tier}`;
          if (this.textures.exists(texKey)) {
            const img = this.add.image(ix + itemSize / 2, iconsY + itemSize / 2, texKey);
            img.setDisplaySize(itemSize - s(4), itemSize - s(4));
            this.contentContainer.add(img);
          } else {
            const initial = this.add.text(ix + itemSize / 2, iconsY + itemSize / 2, item.name.charAt(0), {
              fontSize: fs(16), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
            }).setOrigin(0.5);
            this.contentContainer.add(initial);
          }

          // Make tappable for lore
          const zone = this.add.zone(ix + itemSize / 2, iconsY + itemSize / 2, itemSize, itemSize).setInteractive();
          zone.on('pointerdown', () => this.showLore(chain.id, item.tier, item.name, item.name));
          this.contentContainer.add(zone);
        } else {
          const q = this.add.text(ix + itemSize / 2, iconsY + itemSize / 2, '?', {
            fontSize: fs(14), color: '#D4B8E8', fontFamily: FONT, fontStyle: '600',
          }).setOrigin(0.5);
          this.contentContainer.add(q);
        }
      });

      y += rowH;
    }
  }

  private renderBadges(save: ReturnType<typeof SaveSystem.load>): void {
    const { width } = this.scale;
    const unlocked = new Set(save?.achievements?.map(a => a.id) || []);

    let y = this.panelY + s(70);
    const badgeSize = s(60);
    const gap = s(8);
    const cols = Math.floor((width - s(32)) / (badgeSize + gap));
    const startX = (width - cols * (badgeSize + gap) + gap) / 2;

    const countText = this.add.text(width / 2, y, `${unlocked.size} / ${ACHIEVEMENTS.length} badges earned`, {
      fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5);
    this.contentContainer.add(countText);
    y += s(28);

    ACHIEVEMENTS.forEach((ach, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * (badgeSize + gap);
      const by = y + row * (badgeSize + gap + s(16));
      const isEarned = unlocked.has(ach.id);

      const bg = this.add.graphics();
      bg.fillStyle(isEarned ? 0xF3E8FF : 0xF0EAF0, 0.9);
      bg.fillRoundedRect(bx, by, badgeSize, badgeSize, s(12));
      bg.lineStyle(s(1), isEarned ? 0xD4B8E8 : 0xE0D8E8, 0.4);
      bg.strokeRoundedRect(bx, by, badgeSize, badgeSize, s(12));
      this.contentContainer.add(bg);

      if (isEarned) {
        // Badge icon: canvas-drawn rosette
        const badgeG = this.add.graphics();
        const bcx = bx + badgeSize / 2, bcy = by + badgeSize / 2 - s(4);
        const br = badgeSize * 0.28;
        badgeG.fillStyle(0xD4B8E8, 1);
        for (let pi = 0; pi < 8; pi++) {
          const pa = (pi / 8) * Math.PI * 2;
          badgeG.fillCircle(bcx + Math.cos(pa) * br * 0.7, bcy + Math.sin(pa) * br * 0.7, br * 0.4);
        }
        badgeG.fillStyle(0xFFD700, 1);
        badgeG.fillCircle(bcx, bcy, br * 0.5);
        badgeG.fillStyle(0xFFFFFF, 0.4);
        badgeG.fillCircle(bcx - br * 0.1, bcy - br * 0.15, br * 0.15);
        this.contentContainer.add(badgeG);

        const name = this.add.text(bx + badgeSize / 2, by + badgeSize + s(2), ach.name, {
          fontSize: fs(7), color: TEXT.PRIMARY, fontFamily: FONT_BODY, align: 'center',
          wordWrap: { width: badgeSize },
        }).setOrigin(0.5, 0);
        this.contentContainer.add(name);
      } else {
        // Lock icon (canvas-drawn)
        const lockG = this.add.graphics();
        const lcx = bx + badgeSize / 2, lcy = by + badgeSize / 2;
        const lr = s(7);
        lockG.fillStyle(0xD4B8E8, 0.6);
        lockG.fillRoundedRect(lcx - lr, lcy - lr * 0.2, lr * 2, lr * 1.5, s(2));
        lockG.lineStyle(s(2), 0xD4B8E8, 0.6);
        lockG.beginPath();
        lockG.arc(lcx, lcy - lr * 0.5, lr * 0.55, Math.PI, 0, false);
        lockG.strokePath();
        this.contentContainer.add(lockG);

        const name = this.add.text(bx + badgeSize / 2, by + badgeSize + s(2), '???', {
          fontSize: fs(7), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
        }).setOrigin(0.5, 0);
        this.contentContainer.add(name);
      }
    });
  }

  private showLore(chainId: string, tier: number, emoji: string, name: string): void {
    const { width, height } = this.scale;
    const lore = getLore(chainId, tier);
    if (!lore) return;

    const overlay = this.add.graphics().setDepth(200);
    overlay.fillStyle(0x5C5470, 0.5);
    overlay.fillRect(0, 0, width, height);

    const cardW = width * 0.78, cardH = s(180);
    const cx = (width - cardW) / 2, cy = (height - cardH) / 2;

    const card = this.add.graphics().setDepth(201);
    card.fillStyle(0xFFF8F0, 1);
    card.fillRoundedRect(cx, cy, cardW, cardH, s(20));
    card.lineStyle(s(1.5), COLORS.CELL_BORDER, 0.4);
    card.strokeRoundedRect(cx, cy, cardW, cardH, s(20));

    // Use rendered texture for lore card, fallback to text initial
    let emojiObj: Phaser.GameObjects.GameObject;
    const loreTex = `${chainId}_${tier}`;
    if (this.textures.exists(loreTex)) {
      const img = this.add.image(width / 2, cy + s(30), loreTex).setDisplaySize(s(40), s(40)).setDepth(202);
      emojiObj = img;
    } else {
      emojiObj = this.add.text(width / 2, cy + s(30), name.charAt(0), {
        fontSize: fs(32), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
      }).setOrigin(0.5).setDepth(202);
    }
    const nameText = this.add.text(width / 2, cy + s(65), name, {
      fontSize: fs(16), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5).setDepth(202);

    const loreText = this.add.text(width / 2, cy + s(95), `"${lore}"`, {
      fontSize: fs(11), color: TEXT.SECONDARY, fontFamily: FONT_BODY, fontStyle: 'italic',
      wordWrap: { width: cardW - s(32) }, align: 'center',
    }).setOrigin(0.5, 0).setDepth(202);

    const tierLabel = this.add.text(width / 2, cy + cardH - s(22), `Tier ${tier}`, {
      fontSize: fs(9), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5).setDepth(202);

    // Tap anywhere to close
    const closeZone = this.add.zone(width / 2, height / 2, width, height).setInteractive().setDepth(199);
    closeZone.on('pointerdown', () => {
      [overlay, card, emojiObj, nameText, loreText, tierLabel, closeZone].forEach(o => o.destroy());
    });
  }

  private closeScene(): void {
    this.cameras.main.fadeOut(200, 255, 240, 245);
    this.time.delayedCall(200, () => this.scene.stop('CollectionScene'));
  }
}
