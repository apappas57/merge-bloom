import { COLORS, FONT, fs, s, SIZES, TEXT } from '../utils/constants';

/**
 * Photo Mode for capturing and sharing garden screenshots.
 * Hides UI, adds a decorative kawaii frame with player stats,
 * and provides save/share functionality.
 */

interface PlayerStats {
  level: number;
  totalMerges: number;
  itemsDiscovered: number;
  totalItems: number;
  daysPlaying: number;
  gardenDecorations: number;
}

export class ShareSystem {
  private scene: Phaser.Scene;
  private isPhotoMode = false;
  private overlay: Phaser.GameObjects.Container | null = null;
  private uiWasVisible = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Enter photo mode: hide UI, show decorative frame with stats and buttons. */
  enterPhotoMode(stats: PlayerStats): void {
    if (this.isPhotoMode) return;
    this.isPhotoMode = true;

    // Hide the UIScene
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene) {
      this.uiWasVisible = uiScene.scene.isVisible();
      uiScene.scene.setVisible(false);
    }

    // Create overlay
    this.overlay = this.createPhotoOverlay(stats);
  }

  /** Exit photo mode: restore UI, clean up frame. */
  exitPhotoMode(): void {
    if (!this.isPhotoMode) return;
    this.isPhotoMode = false;

    // Destroy overlay
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }

    // Restore the UIScene
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && this.uiWasVisible) {
      uiScene.scene.setVisible(true);
    }
  }

  /** Capture the current canvas as a PNG data URL. */
  captureCanvas(): string {
    // Force a render so the frame is included in the capture
    this.scene.game.renderer.snapshot((image: Phaser.Display.Color | HTMLImageElement) => {
      // no-op: snapshot callback required by Phaser but we use toDataURL below
    });
    return this.scene.game.canvas.toDataURL('image/png');
  }

  /** Download the captured image as a PNG file. */
  downloadImage(dataUrl: string, filename?: string): void {
    const name = filename || `m3rg3r-garden-${Date.now()}.png`;
    const link = document.createElement('a');
    link.download = name;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /** Share via Web Share API if available, falls back to download. */
  async shareImage(dataUrl: string): Promise<boolean> {
    if (!navigator.share || !navigator.canShare) {
      this.downloadImage(dataUrl);
      return false;
    }
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'm3rg3r-garden.png', { type: 'image/png' });
      if (!navigator.canShare({ files: [file] })) {
        this.downloadImage(dataUrl);
        return false;
      }
      await navigator.share({
        title: 'm3rg3r Garden',
        text: 'Check out my garden!',
        files: [file],
      });
      return true;
    } catch {
      return false;
    }
  }

  /** Create the photo mode overlay with frame, stats, and action buttons. */
  private createPhotoOverlay(stats: PlayerStats): Phaser.GameObjects.Container {
    const { width, height } = this.scene.game.canvas;
    const container = this.scene.add.container(0, 0);
    container.setDepth(9999);

    // --- Decorative frame ---
    const frameGfx = this.scene.add.graphics();
    const borderWidth = s(4);
    const frameInset = s(8);
    const cornerRadius = s(20);
    const frameColor = 0xFFB7C5; // soft pink

    // Outer rounded border
    frameGfx.lineStyle(borderWidth, frameColor, 0.9);
    frameGfx.strokeRoundedRect(
      frameInset, frameInset,
      width - frameInset * 2, height - frameInset * 2,
      cornerRadius,
    );

    // Inner subtle glow line
    frameGfx.lineStyle(s(1), frameColor, 0.3);
    frameGfx.strokeRoundedRect(
      frameInset + borderWidth + s(2),
      frameInset + borderWidth + s(2),
      width - (frameInset + borderWidth + s(2)) * 2,
      height - (frameInset + borderWidth + s(2)) * 2,
      cornerRadius - s(4),
    );
    container.add(frameGfx);

    // --- Corner decorations (small hearts) ---
    const corners = [
      { x: frameInset + s(16), y: frameInset + s(16) },
      { x: width - frameInset - s(16), y: frameInset + s(16) },
      { x: frameInset + s(16), y: height - frameInset - s(16) },
      { x: width - frameInset - s(16), y: height - frameInset - s(16) },
    ];
    for (const corner of corners) {
      const heart = this.drawHeart(corner.x, corner.y, s(8), frameColor);
      container.add(heart);
    }

    // --- Top watermark ---
    const topText = this.scene.add.text(width / 2, frameInset + s(22), 'm3rg3r', {
      fontFamily: FONT,
      fontSize: fs(11),
      color: '#FFB7C5',
      align: 'center',
    });
    topText.setOrigin(0.5, 0.5);
    topText.setAlpha(0.7);
    container.add(topText);

    // --- Stats card ---
    const cardW = width - s(48);
    const cardH = s(44);
    const cardX = width / 2 - cardW / 2;
    const cardY = height - frameInset - s(120);

    const cardGfx = this.scene.add.graphics();
    cardGfx.fillStyle(COLORS.BG_CREAM, 0.92);
    cardGfx.fillRoundedRect(cardX, cardY, cardW, cardH, s(12));
    cardGfx.lineStyle(s(1), frameColor, 0.5);
    cardGfx.strokeRoundedRect(cardX, cardY, cardW, cardH, s(12));
    container.add(cardGfx);

    const statsLine = `Level ${stats.level}  |  ${stats.itemsDiscovered}/${stats.totalItems} Items  |  ${stats.gardenDecorations} Decorations`;
    const statsText = this.scene.add.text(width / 2, cardY + cardH / 2, statsLine, {
      fontFamily: FONT,
      fontSize: fs(10),
      color: TEXT.PRIMARY,
      align: 'center',
    });
    statsText.setOrigin(0.5, 0.5);
    container.add(statsText);

    // --- Bottom watermark ---
    const watermark = this.scene.add.text(width / 2, cardY + cardH + s(10), 'm3rg3r', {
      fontFamily: FONT,
      fontSize: fs(7),
      color: TEXT.SECONDARY,
      align: 'center',
    });
    watermark.setOrigin(0.5, 0.5);
    watermark.setAlpha(0.5);
    container.add(watermark);

    // --- Action buttons ---
    const btnY = height - frameInset - s(52);
    const btnSpacing = s(80);
    const buttons = [
      { label: 'Save', x: width / 2 - btnSpacing, action: () => this.onSave() },
      { label: 'Share', x: width / 2, action: () => this.onShare() },
      { label: 'Back', x: width / 2 + btnSpacing, action: () => this.exitPhotoMode() },
    ];

    for (const btn of buttons) {
      const btnContainer = this.createButton(btn.x, btnY, btn.label, btn.action);
      container.add(btnContainer);
    }

    return container;
  }

  /** Draw a small heart shape at the given position. */
  private drawHeart(x: number, y: number, size: number, color: number): Phaser.GameObjects.Graphics {
    const gfx = this.scene.add.graphics();
    gfx.fillStyle(color, 0.7);

    // Heart shape via two arcs and a triangle
    const r = size * 0.5;
    gfx.fillCircle(x - r * 0.5, y - r * 0.3, r * 0.55);
    gfx.fillCircle(x + r * 0.5, y - r * 0.3, r * 0.55);
    // Bottom triangle
    gfx.fillTriangle(
      x - r, y - r * 0.1,
      x + r, y - r * 0.1,
      x, y + r * 0.8,
    );

    return gfx;
  }

  /** Create a rounded button with tap handler. */
  private createButton(
    x: number, y: number, label: string, callback: () => void,
  ): Phaser.GameObjects.Container {
    const btnW = s(64);
    const btnH = s(32);
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.BG_CREAM, 0.95);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, s(10));
    bg.lineStyle(s(1.5), 0xFFB7C5, 0.8);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, s(10));
    container.add(bg);

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: FONT,
      fontSize: fs(11),
      color: TEXT.PRIMARY,
      align: 'center',
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    // Hit area for interaction
    const hitZone = this.scene.add.zone(0, 0, btnW, btnH);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      // Quick press animation
      this.scene.tweens.add({
        targets: container,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 60,
        yoyo: true,
        onComplete: () => callback(),
      });
    });
    container.add(hitZone);

    return container;
  }

  /** Handle save button tap: capture and download. */
  private onSave(): void {
    const dataUrl = this.captureCanvas();
    this.downloadImage(dataUrl);
  }

  /** Handle share button tap: try Web Share API, fall back to download. */
  private onShare(): void {
    const dataUrl = this.captureCanvas();
    this.shareImage(dataUrl);
  }

  /** Clean up all resources. Call when the scene shuts down. */
  destroy(): void {
    this.exitPhotoMode();
  }
}

// === SHARE SYSTEM INTEGRATION ===
// In GameScene, add a camera button to bottom bar or settings.
// On tap: this.shareSystem = new ShareSystem(this); this.shareSystem.enterPhotoMode({...stats});
// The system handles everything else (frame, capture, download, share, exit).
