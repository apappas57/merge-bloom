import { COLORS, FONT, fs, s } from '../utils/constants';
import { SaveSystem } from '../systems/SaveSystem';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('SettingsScene'); }

  create() {
    const { width, height } = this.scale;
    const save = SaveSystem.load();

    // Backdrop
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);

    const closeZone = this.add.zone(width / 2, height * 0.15, width, height * 0.3).setInteractive();
    closeZone.on('pointerdown', () => this.closeScene());

    // Panel
    const panelH = height * 0.55;
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
    this.add.text(width / 2, panelY + s(30), '⚙️ Settings', {
      fontSize: fs(22), color: '#ffffff', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Close
    const closeBtn = this.add.text(width - s(20), panelY + s(15), '✕', {
      fontSize: fs(20), color: '#8899aa', fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive();
    closeBtn.on('pointerdown', () => this.closeScene());

    let y = panelY + s(70);
    const rowH = s(55);

    // --- Stats Section ---
    this.add.text(s(20), y, 'Game Stats', {
      fontSize: fs(14), color: '#ffd700', fontFamily: FONT, fontStyle: 'bold',
    });
    y += s(28);

    const stats = [
      { label: 'Level', value: `${save?.player.level || 1}` },
      { label: 'Total Merges', value: `${save?.player.totalMerges || 0}` },
      { label: 'Gems', value: `${(save?.player.gems || 99999).toLocaleString()}` },
      { label: 'Items on Board', value: `${save?.board.items.length || 0}` },
    ];

    stats.forEach(stat => {
      this.add.text(s(20), y, stat.label, {
        fontSize: fs(12), color: '#8899aa', fontFamily: 'system-ui',
      });
      this.add.text(width - s(20), y, stat.value, {
        fontSize: fs(12), color: '#ffffff', fontFamily: 'system-ui', fontStyle: 'bold',
      }).setOrigin(1, 0);
      y += s(22);
    });

    y += s(15);

    // --- Actions Section ---
    this.add.text(s(20), y, 'Actions', {
      fontSize: fs(14), color: '#ffd700', fontFamily: FONT, fontStyle: 'bold',
    });
    y += s(30);

    // Reset Game button
    this.createButton(s(20), y, width - s(40), s(42), 'Reset Game', 0xe74c3c, () => {
      this.showConfirmReset();
    });
    y += s(55);

    // Version
    this.add.text(width / 2, panelY + panelH - s(25), 'Merge Bloom v1.0 — Made with 💕', {
      fontSize: fs(10), color: '#4a5568', fontFamily: 'system-ui',
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, w: number, h: number, label: string, color: number, onClick: () => void): void {
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.8);
    bg.fillRoundedRect(x, y, w, h, s(10));

    this.add.text(x + w / 2, y + h / 2, label, {
      fontSize: fs(13), color: '#ffffff', fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive();
    zone.on('pointerdown', onClick);
  }

  private showConfirmReset(): void {
    const { width, height } = this.scale;

    // Confirmation overlay
    const confirmBg = this.add.graphics();
    confirmBg.fillStyle(0x000000, 0.7);
    confirmBg.fillRect(0, 0, width, height);
    confirmBg.setDepth(100);

    const boxW = width * 0.8;
    const boxH = s(180);
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;

    const box = this.add.graphics();
    box.fillStyle(0x0d1b2a, 1);
    box.fillRoundedRect(boxX, boxY, boxW, boxH, s(16));
    box.lineStyle(s(2), 0xe74c3c, 0.6);
    box.strokeRoundedRect(boxX, boxY, boxW, boxH, s(16));
    box.setDepth(101);

    const title = this.add.text(width / 2, boxY + s(30), 'Reset Game?', {
      fontSize: fs(18), color: '#e74c3c', fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(102);

    const desc = this.add.text(width / 2, boxY + s(60), 'This will erase all progress.\nThis cannot be undone.', {
      fontSize: fs(12), color: '#8899aa', fontFamily: 'system-ui', align: 'center',
    }).setOrigin(0.5).setDepth(102);

    // Cancel button
    const cancelBg = this.add.graphics().setDepth(102);
    cancelBg.fillStyle(0x2a3a4a, 1);
    cancelBg.fillRoundedRect(boxX + s(16), boxY + boxH - s(55), boxW / 2 - s(24), s(38), s(8));

    const cancelText = this.add.text(boxX + s(16) + (boxW / 2 - s(24)) / 2, boxY + boxH - s(36), 'Cancel', {
      fontSize: fs(13), color: '#ffffff', fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(103);

    const cancelZone = this.add.zone(boxX + s(16) + (boxW / 2 - s(24)) / 2, boxY + boxH - s(36), boxW / 2 - s(24), s(38))
      .setInteractive().setDepth(103);
    cancelZone.on('pointerdown', () => {
      [confirmBg, box, title, desc, cancelBg, cancelText, cancelZone, resetBg, resetText, resetZone].forEach(o => o.destroy());
    });

    // Reset button
    const resetBg = this.add.graphics().setDepth(102);
    resetBg.fillStyle(0xe74c3c, 1);
    resetBg.fillRoundedRect(boxX + boxW / 2 + s(8), boxY + boxH - s(55), boxW / 2 - s(24), s(38), s(8));

    const resetText = this.add.text(boxX + boxW / 2 + s(8) + (boxW / 2 - s(24)) / 2, boxY + boxH - s(36), 'Reset', {
      fontSize: fs(13), color: '#ffffff', fontFamily: 'system-ui', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(103);

    const resetZone = this.add.zone(boxX + boxW / 2 + s(8) + (boxW / 2 - s(24)) / 2, boxY + boxH - s(36), boxW / 2 - s(24), s(38))
      .setInteractive().setDepth(103);
    resetZone.on('pointerdown', () => {
      localStorage.removeItem('merge_bloom_save');
      // Restart the whole game
      this.scene.stop('SettingsScene');
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }

  private closeScene(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => this.scene.stop('SettingsScene'));
  }
}
