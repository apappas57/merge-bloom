import { Board } from '../objects/Board';
import { MergeItem } from '../objects/MergeItem';
import { COLORS, s } from '../utils/constants';

/**
 * Idle merge hint system — after 10s of no interaction,
 * gently pulse two mergeable items on the board.
 */
export class HintSystem {
  private scene: Phaser.Scene;
  private board: Board;
  private items: Map<string, MergeItem>;
  private lastInteraction: number = Date.now();
  private hintActive = false;
  private hintTweens: Phaser.Tweens.Tween[] = [];
  private hintGfx: Phaser.GameObjects.Graphics[] = [];
  private checkTimer: Phaser.Time.TimerEvent;
  private hintDelay = 10000; // 10 seconds

  constructor(scene: Phaser.Scene, board: Board, items: Map<string, MergeItem>) {
    this.scene = scene;
    this.board = board;
    this.items = items;

    // Reset timer on any interaction
    scene.input.on('pointerdown', this.resetTimer, this);
    scene.events.on('item-dropped', this.resetTimer, this);
    scene.events.on('generator-tapped', this.resetTimer, this);

    // Check periodically
    this.checkTimer = scene.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.check(),
    });
  }

  resetTimer(): void {
    this.lastInteraction = Date.now();
    if (this.hintActive) this.clearHints();
  }

  private check(): void {
    if (this.hintActive) return;
    if (Date.now() - this.lastInteraction < this.hintDelay) return;

    // Find a mergeable pair
    const pair = this.findMergeablePair();
    if (pair) {
      this.showHint(pair[0], pair[1]);
    }
  }

  private findMergeablePair(): [MergeItem, MergeItem] | null {
    const itemList = Array.from(this.items.values());

    for (let i = 0; i < itemList.length; i++) {
      for (let j = i + 1; j < itemList.length; j++) {
        const a = itemList[i];
        const b = itemList[j];
        if (a.data_.chainId === b.data_.chainId && a.data_.tier === b.data_.tier) {
          return [a, b];
        }
      }
    }
    return null;
  }

  private showHint(a: MergeItem, b: MergeItem): void {
    this.hintActive = true;

    // Create soft glow circles around each item
    for (const item of [a, b]) {
      const glow = this.scene.add.graphics();
      glow.fillStyle(COLORS.ACCENT_ROSE, 0.2);
      glow.fillCircle(0, 0, s(28));
      glow.setPosition(item.x, item.y);
      glow.setDepth(9);
      glow.setAlpha(0);

      const tween = this.scene.tweens.add({
        targets: glow,
        alpha: 0.5,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.hintGfx.push(glow);
      this.hintTweens.push(tween);
    }
  }

  private clearHints(): void {
    this.hintActive = false;
    for (const t of this.hintTweens) t.destroy();
    for (const g of this.hintGfx) g.destroy();
    this.hintTweens = [];
    this.hintGfx = [];
  }

  destroy(): void {
    this.clearHints();
    this.checkTimer.destroy();
    // Clean up scene-level event listeners to prevent leaks
    this.scene.input.off('pointerdown', this.resetTimer, this);
    this.scene.events.off('item-dropped', this.resetTimer, this);
    this.scene.events.off('generator-tapped', this.resetTimer, this);
  }
}
