import { SIZES, COLORS, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';
import { ActiveQuest } from '../systems/QuestSystem';

export class UIScene extends Phaser.Scene {
  private gemsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private questTexts: Phaser.GameObjects.Text[] = [];
  private questCards: Phaser.GameObjects.Graphics[] = [];
  private curGems = 0;
  private curLevel = 1;
  private gemSparkleEvent: Phaser.Time.TimerEvent | null = null;
  private gemSparkleGfx!: Phaser.GameObjects.Graphics;

  constructor() { super('UIScene'); }

  create(data: { gems: number; level: number; xp: number; xpToNext: number; quests: ActiveQuest[] }) {
    const { width } = this.scale;
    this.curGems = data.gems;
    this.curLevel = data.level;

    // Top bar — soft pink
    const topBg = this.add.graphics();
    topBg.fillStyle(COLORS.UI_BG, 0.95);
    topBg.fillRect(0, 0, width, SIZES.TOP_BAR);

    // Subtle bottom border
    const accent = this.add.graphics();
    accent.fillStyle(COLORS.ACCENT_ROSE, 0.3);
    accent.fillRect(0, SIZES.TOP_BAR - s(1.5), width, s(1.5));

    // Level
    this.levelText = this.add.text(s(20), s(16), `\u2B50 Lv.${data.level}`, {
      fontSize: fs(18), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
    });

    // Divider between level and gems
    const dividerX = width / 2;
    const dividerGfx = this.add.graphics();
    dividerGfx.fillStyle(COLORS.CELL_BORDER, 0.4);
    dividerGfx.fillRect(dividerX - s(0.5), s(12), s(1), s(24));

    // Gems
    this.gemsText = this.add.text(width - s(20), s(16), `\uD83D\uDC8E ${this.fmt(data.gems)}`, {
      fontSize: fs(18), color: '#A8D8EA', fontFamily: FONT, fontStyle: '600',
    }).setOrigin(1, 0);

    // Gem sparkle effect
    this.gemSparkleGfx = this.add.graphics();
    this.startGemSparkle();

    // XP bar — thicker (12px) with more pronounced gradient
    const xpBarY = s(46);
    const xpBarH = s(12);
    const xpBg = this.add.graphics();
    xpBg.fillStyle(COLORS.UI_PANEL, 1);
    xpBg.fillRoundedRect(s(20), xpBarY, width - s(40), xpBarH, s(6));
    // Inner shadow on XP track
    xpBg.fillStyle(0xD8C0D0, 0.3);
    xpBg.fillRoundedRect(s(21), xpBarY + s(1), width - s(42), s(3), { tl: s(6), tr: s(6), bl: 0, br: 0 });

    this.xpBar = this.add.graphics();
    this.drawXPBar(data.xp, data.xpToNext);

    this.xpText = this.add.text(width - s(20), xpBarY + xpBarH + s(4), `${data.xp}/${data.xpToNext} XP`, {
      fontSize: fs(9), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(1, 0);

    // Quest bar
    const questBg = this.add.graphics();
    questBg.fillStyle(COLORS.UI_PANEL, 0.85);
    questBg.fillRect(0, SIZES.TOP_BAR, width, SIZES.QUEST_BAR);

    this.renderQuests(data.quests);

    // Bottom bar
    const bottomY = this.scale.height - SIZES.BOTTOM_BAR;
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(COLORS.UI_BG, 0.95);
    bottomBg.fillRect(0, bottomY, width, SIZES.BOTTOM_BAR);

    const bottomAccent = this.add.graphics();
    bottomAccent.fillStyle(COLORS.ACCENT_ROSE, 0.2);
    bottomAccent.fillRect(0, bottomY, width, s(1));

    // Bottom buttons — icon buttons with emoji above, text below, circular bg
    const btnDefs = [
      { emoji: '\uD83D\uDED2', label: 'Shop', scene: 'ShopScene' },
      { emoji: '\uD83D\uDCD6', label: 'Collection', scene: 'CollectionScene' },
      { emoji: '\u2699\uFE0F', label: 'Settings', scene: 'SettingsScene' },
    ];
    const btnWidth = width / 3;
    const btnCenterY = bottomY + SIZES.BOTTOM_BAR / 2;

    btnDefs.forEach((def, i) => {
      const cx = btnWidth * i + btnWidth / 2;

      // Circular background
      const circleBg = this.add.graphics();
      circleBg.fillStyle(COLORS.UI_PANEL, 0.7);
      circleBg.fillCircle(cx, btnCenterY - s(4), s(18));
      circleBg.lineStyle(s(0.5), COLORS.CELL_BORDER, 0.3);
      circleBg.strokeCircle(cx, btnCenterY - s(4), s(18));

      // Emoji icon
      const emojiText = this.add.text(cx, btnCenterY - s(8), def.emoji, {
        fontSize: fs(16),
      }).setOrigin(0.5);

      // Label below
      const labelText = this.add.text(cx, btnCenterY + s(14), def.label, {
        fontSize: fs(9), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(0.5);

      const zone = this.add.zone(cx, btnCenterY, btnWidth, SIZES.BOTTOM_BAR).setInteractive();
      zone.on('pointerdown', () => {
        // More visible press effect
        this.tweens.add({
          targets: circleBg, scaleX: 0.85, scaleY: 0.85, duration: 60, yoyo: true,
          onYoyo: () => {
            circleBg.clear();
            circleBg.fillStyle(COLORS.ACCENT_PINK, 0.3);
            circleBg.fillCircle(cx, btnCenterY - s(4), s(18));
          },
          onComplete: () => {
            circleBg.clear();
            circleBg.fillStyle(COLORS.UI_PANEL, 0.7);
            circleBg.fillCircle(cx, btnCenterY - s(4), s(18));
            circleBg.lineStyle(s(0.5), COLORS.CELL_BORDER, 0.3);
            circleBg.strokeCircle(cx, btnCenterY - s(4), s(18));
          }
        });
        this.tweens.add({ targets: emojiText, scaleX: 0.85, scaleY: 0.85, duration: 80, yoyo: true });
        this.tweens.add({ targets: labelText, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
        const target = def.scene;
        if (!this.scene.isActive(target)) this.scene.launch(target);
      });
    });

    this.scene.get('GameScene').events.on('update-ui', this.onUpdate, this);
  }

  /** Subtle sparkle animation near the gem counter */
  private startGemSparkle(): void {
    let phase = 0;
    this.gemSparkleEvent = this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        phase += 0.08;
        if (phase > Math.PI * 2) phase -= Math.PI * 2;

        this.gemSparkleGfx.clear();
        const alpha = 0.15 + Math.sin(phase) * 0.15;
        if (alpha > 0.05) {
          const gx = this.gemsText.x - this.gemsText.width - s(4);
          const gy = this.gemsText.y + s(8);
          // Tiny sparkle dots
          this.gemSparkleGfx.fillStyle(0xA8D8EA, alpha);
          this.gemSparkleGfx.fillCircle(gx + s(2), gy - s(2), s(1.5));
          this.gemSparkleGfx.fillStyle(0xFFFFFF, alpha * 0.8);
          this.gemSparkleGfx.fillCircle(gx + s(8), gy + s(4), s(1));
          this.gemSparkleGfx.fillStyle(0xA8D8EA, alpha * 0.6);
          this.gemSparkleGfx.fillCircle(gx - s(2), gy + s(6), s(1));
        }
      }
    });
  }

  private drawXPBar(xp: number, xpToNext: number): void {
    const { width } = this.scale;
    const barW = width - s(40);
    const barH = s(12); // Thicker
    const barY = s(46);
    const progress = Math.min(xp / xpToNext, 1);
    this.xpBar.clear();
    if (progress > 0) {
      // Gradient effect: mint to rose, more pronounced
      this.xpBar.fillGradientStyle(0x81C784, 0xFF7FAA, 0xA8E6CF, 0xFF9CAD, 1);
      this.xpBar.fillRoundedRect(s(20), barY, barW * progress, barH, s(6));

      // Shine highlight on top half of filled bar
      this.xpBar.fillStyle(0xFFFFFF, 0.25);
      this.xpBar.fillRoundedRect(s(21), barY + s(1), barW * progress - s(2), barH * 0.4, { tl: s(5), tr: s(5), bl: 0, br: 0 });
    }
  }

  private renderQuests(quests: ActiveQuest[]): void {
    this.questTexts.forEach(t => t.destroy());
    this.questCards.forEach(g => g.destroy());
    this.questTexts = [];
    this.questCards = [];
    const { width } = this.scale;
    const startY = SIZES.TOP_BAR + s(5);
    const cardH = SIZES.QUEST_BAR - s(10);

    if (quests.length === 0) {
      const t = this.add.text(width / 2, startY + cardH / 2, 'No active quests', {
        fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(0.5);
      this.questTexts.push(t);
      return;
    }

    const count = Math.min(quests.length, 3);
    const cardGap = s(6);
    const totalGap = (count + 1) * cardGap;
    const qw = (width - totalGap) / count;

    quests.slice(0, 3).forEach((q, i) => {
      const x = cardGap + i * (qw + cardGap);

      // Card background
      const card = this.add.graphics();
      const cardColor = q.completed ? 0xC8E6C9 : 0xFFFFFF;
      const cardAlpha = q.completed ? 0.7 : 0.55;
      card.fillStyle(cardColor, cardAlpha);
      card.fillRoundedRect(x, startY, qw, cardH, s(8));
      card.lineStyle(s(0.5), q.completed ? 0x81C784 : COLORS.CELL_BORDER, 0.35);
      card.strokeRoundedRect(x, startY, qw, cardH, s(8));
      this.questCards.push(card);

      const status = q.completed ? '\u2705' : `${q.progress}/${q.def.targetCount}`;
      const color = q.completed ? TEXT.MINT : TEXT.SECONDARY;
      const t = this.add.text(x + qw / 2, startY + cardH / 2, `${q.def.description} ${status}`, {
        fontSize: fs(10), color, fontFamily: FONT_BODY,
        wordWrap: { width: qw - s(12) },
        align: 'center',
      }).setOrigin(0.5);
      this.questTexts.push(t);
    });
  }

  private onUpdate(data: { gems: number; level: number; xp: number; xpToNext: number; quests: ActiveQuest[] }): void {
    if (data.gems !== this.curGems) {
      this.curGems = data.gems;
      this.gemsText.setText(`\uD83D\uDC8E ${this.fmt(data.gems)}`);
      this.tweens.add({ targets: this.gemsText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    }
    if (data.level !== this.curLevel) {
      this.curLevel = data.level;
      this.levelText.setText(`\u2B50 Lv.${data.level}`);
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
