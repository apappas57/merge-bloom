import { COLORS, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';
import { SaveSystem } from '../systems/SaveSystem';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('SettingsScene'); }

  create() {
    const { width, height } = this.scale;
    const save = SaveSystem.load();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x5C5470, 0.4);
    overlay.fillRect(0, 0, width, height);

    const closeZone = this.add.zone(width / 2, height * 0.15, width, height * 0.3).setInteractive();
    closeZone.on('pointerdown', () => this.closeScene());

    const panelH = height * 0.55;
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

    this.add.text(width / 2, panelY + s(30), '⚙️ Settings', {
      fontSize: fs(22), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(width - s(20), panelY + s(15), '✕', {
      fontSize: fs(18), color: TEXT.SECONDARY, fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive();
    closeBtn.on('pointerdown', () => this.closeScene());

    let y = panelY + s(70);

    this.add.text(s(20), y, 'Game Stats', {
      fontSize: fs(14), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
    });
    y += s(28);

    const stats = [
      { label: 'Level', value: `${save?.player.level || 1}` },
      { label: 'Total Merges', value: `${save?.player.totalMerges || 0}` },
      { label: 'Gems', value: `${(save?.player.gems || 99999).toLocaleString()}` },
      { label: 'Items on Board', value: `${save?.board.items.length || 0}` },
    ];

    stats.forEach(stat => {
      this.add.text(s(20), y, stat.label, { fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT_BODY });
      this.add.text(width - s(20), y, stat.value, { fontSize: fs(12), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600' }).setOrigin(1, 0);
      y += s(22);
    });

    y += s(15);

    this.add.text(s(20), y, 'Actions', { fontSize: fs(14), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600' });
    y += s(30);

    // Reset button — soft coral
    const btnW = width - s(40), btnH = s(42);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xFFB3B3, 1);
    btnBg.fillRoundedRect(s(20), y, btnW, btnH, btnH / 2);

    this.add.text(s(20) + btnW / 2, y + btnH / 2, 'Reset Game', {
      fontSize: fs(14), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5);

    const resetZone = this.add.zone(s(20) + btnW / 2, y + btnH / 2, btnW, btnH).setInteractive();
    resetZone.on('pointerdown', () => this.showConfirmReset());

    // Version
    this.add.text(width / 2, panelY + panelH - s(25), 'm3rg3r v1.0 — Made with 💕', {
      fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5);
  }

  private showConfirmReset(): void {
    const { width, height } = this.scale;

    const confirmBg = this.add.graphics();
    confirmBg.fillStyle(0x5C5470, 0.6);
    confirmBg.fillRect(0, 0, width, height);
    confirmBg.setDepth(100);

    const boxW = width * 0.8, boxH = s(180);
    const boxX = (width - boxW) / 2, boxY = (height - boxH) / 2;

    const box = this.add.graphics();
    box.fillStyle(0xFFF8F0, 1);
    box.fillRoundedRect(boxX, boxY, boxW, boxH, s(20));
    box.lineStyle(s(1.5), 0xFFB3B3, 0.5);
    box.strokeRoundedRect(boxX, boxY, boxW, boxH, s(20));
    box.setDepth(101);

    const title = this.add.text(width / 2, boxY + s(30), 'Reset Game?', {
      fontSize: fs(18), color: '#FF6B6B', fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5).setDepth(102);

    const desc = this.add.text(width / 2, boxY + s(60), 'This will erase all progress.\nThis cannot be undone.', {
      fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT_BODY, align: 'center',
    }).setOrigin(0.5).setDepth(102);

    // Cancel — soft blue pill
    const cancelBg = this.add.graphics().setDepth(102);
    const cbW = boxW / 2 - s(24), cbH = s(38);
    cancelBg.fillStyle(0xA8D8EA, 1);
    cancelBg.fillRoundedRect(boxX + s(16), boxY + boxH - s(55), cbW, cbH, cbH / 2);

    const cancelText = this.add.text(boxX + s(16) + cbW / 2, boxY + boxH - s(36), 'Cancel', {
      fontSize: fs(13), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5).setDepth(103);

    const cancelZone = this.add.zone(boxX + s(16) + cbW / 2, boxY + boxH - s(36), cbW, cbH)
      .setInteractive().setDepth(103);

    // Reset — soft coral pill
    const resetBg = this.add.graphics().setDepth(102);
    resetBg.fillStyle(0xFFB3B3, 1);
    resetBg.fillRoundedRect(boxX + boxW / 2 + s(8), boxY + boxH - s(55), cbW, cbH, cbH / 2);

    const resetText = this.add.text(boxX + boxW / 2 + s(8) + cbW / 2, boxY + boxH - s(36), 'Reset', {
      fontSize: fs(13), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5).setDepth(103);

    const resetZone = this.add.zone(boxX + boxW / 2 + s(8) + cbW / 2, boxY + boxH - s(36), cbW, cbH)
      .setInteractive().setDepth(103);

    cancelZone.on('pointerdown', () => {
      [confirmBg, box, title, desc, cancelBg, cancelText, cancelZone, resetBg, resetText, resetZone].forEach(o => o.destroy());
    });

    resetZone.on('pointerdown', () => {
      localStorage.removeItem('m3rg3r_save');
      this.scene.stop('SettingsScene');
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }

  private closeScene(): void {
    this.cameras.main.fadeOut(200, 255, 240, 245);
    this.time.delayedCall(200, () => this.scene.stop('SettingsScene'));
  }
}
