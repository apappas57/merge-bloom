export class EmojiRenderer {
  /**
   * Render emoji to Phaser canvas textures.
   * `size` should already be in game-pixel units (DPR-scaled).
   */
  static generateTextures(
    scene: Phaser.Scene,
    emojiList: { key: string; emoji: string }[],
    size: number = 56
  ): void {
    for (const { key, emoji } of emojiList) {
      if (scene.textures.exists(key)) continue;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.font = `${size * 0.75}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, size / 2, size / 2 + size * 0.03);

      scene.textures.addCanvas(key, canvas);
    }
  }
}
