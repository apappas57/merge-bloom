import { SIZES, COLORS, FONT, fs, s } from '../utils/constants';
import { ActiveQuest } from '../systems/QuestSystem';

export class UIScene extends Phaser.Scene {
  private gemsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private questTexts: Phaser.GameObjects.Text[] = [];
  private curGems = 0;
  private curLevel = 1;

  constructor() { super('UIScene'); }

  create(data: { gems: number; level: number; xp: number; xpToNext: number; quests: ActiveQuest[] }) {
    const { width } = this.scale;
    this.curGems = data.gems;
    this.curLevel = data.level;

    // Top bar
    const topBg = this.add.graphics();
    topBg.fillStyle(COLORS.UI_BG, 0.95);
    topBg.fillRect(0, 0, width, SIZES.TOP_BAR);

    const accent = this.add.graphics();
    accent.fillStyle(COLORS.ACCENT_TEAL, 0.5);
    accent.fillRect(0, SIZES.TOP_BAR - s(2), width, s(2));

    // Level
    this.levelText = this.add.text(s(20), s(18), `⭐ Lv.${data.level}`, {
      fontSize: fs(18), color: '#ffd700', fontFamily: FONT, fontStyle: 'bold',
    });

    // XP bar
    const xpBarY = s(48);
    const xpBg = this.add.graphics();
    xpBg.fillStyle(0x2a2a4e, 1);
    xpBg.fillRoundedRect(s(20), xpBarY, width - s(40), s(8), s(4));

    this.xpBar = this.add.graphics();
    this.drawXPBar(data.xp, data.xpToNext);

    this.xpText = this.add.text(width - s(20), xpBarY + s(12), `${data.xp}/${data.xpToNext} XP`, {
      fontSize: fs(9), color: '#8899aa', fontFamily: 'system-ui',
    }).setOrigin(1, 0);

    // Gems
    this.gemsText = this.add.text(width - s(20), s(18), `💎 ${this.fmt(data.gems)}`, {
      fontSize: fs(18), color: '#87ceeb', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Quest bar
    const questBg = this.add.graphics();
    questBg.fillStyle(COLORS.UI_PANEL, 0.9);
    questBg.fillRect(0, SIZES.TOP_BAR, width, SIZES.QUEST_BAR);

    this.renderQuests(data.quests);

    // Bottom bar
    const bottomY = this.scale.height - SIZES.BOTTOM_BAR;
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(COLORS.UI_BG, 0.93);
    bottomBg.fillRect(0, bottomY, width, SIZES.BOTTOM_BAR);

    const bottomAccent = this.add.graphics();
    bottomAccent.fillStyle(COLORS.ACCENT_TEAL, 0.3);
    bottomAccent.fillRect(0, bottomY, width, s(1));

    // Bottom buttons — Shop is interactive
    const btnLabels = ['🛒 Shop', '📖 Collection', '⚙️ Settings'];
    const btnWidth = width / 3;
    btnLabels.forEach((label, i) => {
      const btnText = this.add.text(btnWidth * i + btnWidth / 2, bottomY + SIZES.BOTTOM_BAR / 2, label, {
        fontSize: fs(13), color: '#8899aa', fontFamily: 'system-ui',
      }).setOrigin(0.5);

      const zone = this.add.zone(btnWidth * i + btnWidth / 2, bottomY + SIZES.BOTTOM_BAR / 2, btnWidth, SIZES.BOTTOM_BAR).setInteractive();

      if (i === 0) {
        // Shop button
        zone.on('pointerdown', () => {
          if (!this.scene.isActive('ShopScene')) {
            this.scene.launch('ShopScene');
          }
        });
        zone.on('pointerover', () => btnText.setColor('#2ecc71'));
        zone.on('pointerout', () => btnText.setColor('#8899aa'));
      }
    });

    this.scene.get('GameScene').events.on('update-ui', this.onUpdate, this);
  }

  private drawXPBar(xp: number, xpToNext: number): void {
    const { width } = this.scale;
    const barW = width - s(40);
    const progress = Math.min(xp / xpToNext, 1);
    this.xpBar.clear();
    if (progress > 0) {
      this.xpBar.fillStyle(COLORS.ACCENT_TEAL, 1);
      this.xpBar.fillRoundedRect(s(20), s(48), barW * progress, s(8), s(4));
    }
  }

  private renderQuests(quests: ActiveQuest[]): void {
    this.questTexts.forEach(t => t.destroy());
    this.questTexts = [];
    const { width } = this.scale;
    const startY = SIZES.TOP_BAR + s(8);

    if (quests.length === 0) {
      const t = this.add.text(width / 2, startY + s(14), 'No active quests', {
        fontSize: fs(12), color: '#8899aa', fontFamily: 'system-ui',
      }).setOrigin(0.5);
      this.questTexts.push(t);
      return;
    }

    const qw = (width - s(30)) / Math.min(quests.length, 3);
    quests.slice(0, 3).forEach((q, i) => {
      const x = s(15) + i * qw;
      const status = q.completed ? '✅' : `${q.progress}/${q.def.targetCount}`;
      const color = q.completed ? '#2ecc71' : '#8899aa';
      const t = this.add.text(x + qw / 2, startY + s(16), `${q.def.description} ${status}`, {
        fontSize: fs(10), color, fontFamily: 'system-ui',
        wordWrap: { width: qw - s(10) },
      }).setOrigin(0.5);
      this.questTexts.push(t);
    });
  }

  private onUpdate(data: { gems: number; level: number; xp: number; xpToNext: number; quests: ActiveQuest[] }): void {
    if (data.gems !== this.curGems) {
      this.curGems = data.gems;
      this.gemsText.setText(`💎 ${this.fmt(data.gems)}`);
      this.tweens.add({ targets: this.gemsText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    }
    if (data.level !== this.curLevel) {
      this.curLevel = data.level;
      this.levelText.setText(`⭐ Lv.${data.level}`);
      this.tweens.add({ targets: this.levelText, scaleX: 1.3, scaleY: 1.3, duration: 200, yoyo: true, ease: 'Back.easeOut' });
    }
    this.drawXPBar(data.xp, data.xpToNext);
    this.xpText.setText(`${data.xp}/${data.xpToNext} XP`);
    this.renderQuests(data.quests);
  }

  private fmt(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  }
}
