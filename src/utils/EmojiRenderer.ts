/** Chain color themes (pastel gradients) */
const CHAIN_COLORS: Record<string, { from: string; to: string; fromHex: number; toHex: number }> = {
  flower:    { from: '#F8BBD0', to: '#F48FB1', fromHex: 0xF8BBD0, toHex: 0xF48FB1 },
  butterfly: { from: '#B3E5FC', to: '#81D4FA', fromHex: 0xB3E5FC, toHex: 0x81D4FA },
  fruit:     { from: '#FFCCBC', to: '#FF8A65', fromHex: 0xFFCCBC, toHex: 0xFF8A65 },
  crystal:   { from: '#D1C4E9', to: '#B39DDB', fromHex: 0xD1C4E9, toHex: 0xB39DDB },
  nature:    { from: '#C8E6C9', to: '#81C784', fromHex: 0xC8E6C9, toHex: 0x81C784 },
  star:      { from: '#FFF9C4', to: '#FFD54F', fromHex: 0xFFF9C4, toHex: 0xFFD54F },
  tea:       { from: '#D7CCC8', to: '#BCAAA4', fromHex: 0xD7CCC8, toHex: 0xBCAAA4 },
  shell:     { from: '#B2EBF2', to: '#80DEEA', fromHex: 0xB2EBF2, toHex: 0x80DEEA },
  sweet:     { from: '#F8BBD0', to: '#F06292', fromHex: 0xF8BBD0, toHex: 0xF06292 },
};

/** Default fallback for unknown chains or UI textures */
const DEFAULT_COLORS = { from: '#E0E0E0', to: '#BDBDBD', fromHex: 0xE0E0E0, toHex: 0xBDBDBD };

/** Parse a texture key to extract chain and tier info */
function parseKey(key: string): { chainId: string; tier: number; isGenerator: boolean; isUI: boolean } {
  if (key.startsWith('gen_')) {
    // Generator keys: gen_gen_flower -> chainId derived from second part
    const rest = key.slice(4); // e.g. "gen_flower"
    const chainId = rest.replace('gen_', '');
    return { chainId, tier: 0, isGenerator: true, isUI: false };
  }
  // UI keys like 'gem', 'star_ui', 'sparkle'
  if (key === 'gem' || key === 'star_ui' || key === 'sparkle') {
    return { chainId: '', tier: 0, isGenerator: false, isUI: true };
  }
  // Chain item keys: flower_1, crystal_3, etc.
  const parts = key.split('_');
  const tier = parseInt(parts[parts.length - 1], 10);
  const chainId = parts.slice(0, parts.length - 1).join('_');
  return { chainId, tier, isGenerator: false, isUI: false };
}

/** Draw a rounded rectangle path on a canvas context */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw a small 4-point sparkle star */
function drawSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx + size * 0.3, cy - size * 0.3, cx + size, cy);
  ctx.quadraticCurveTo(cx + size * 0.3, cy + size * 0.3, cx, cy + size);
  ctx.quadraticCurveTo(cx - size * 0.3, cy + size * 0.3, cx - size, cy);
  ctx.quadraticCurveTo(cx - size * 0.3, cy - size * 0.3, cx, cy - size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Create a rainbow/holographic gradient for high tiers */
function rainbowStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): CanvasGradient {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#FF6B6B');
  grad.addColorStop(0.17, '#FFD93D');
  grad.addColorStop(0.33, '#6BCB77');
  grad.addColorStop(0.5, '#4D96FF');
  grad.addColorStop(0.67, '#9B59B6');
  grad.addColorStop(0.83, '#FF6B9D');
  grad.addColorStop(1, '#FF6B6B');
  return grad;
}

export class EmojiRenderer {
  /**
   * Render emoji to Phaser canvas textures as beautiful framed kawaii item sprites.
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

      const parsed = parseKey(key);

      if (parsed.isGenerator) {
        EmojiRenderer.drawGeneratorFrame(ctx, size, emoji, parsed.chainId);
      } else if (parsed.isUI) {
        // UI textures: simple emoji, no frame (used as icons)
        EmojiRenderer.drawUITexture(ctx, size, emoji);
      } else {
        EmojiRenderer.drawItemFrame(ctx, size, emoji, parsed.chainId, parsed.tier);
      }

      scene.textures.addCanvas(key, canvas);
    }
  }

  /** Draw a framed kawaii item sprite for a merge chain item */
  private static drawItemFrame(
    ctx: CanvasRenderingContext2D,
    size: number,
    emoji: string,
    chainId: string,
    tier: number
  ): void {
    const pad = size * 0.06;
    const cornerR = size * 0.2;
    const colors = CHAIN_COLORS[chainId] || DEFAULT_COLORS;

    // 1. Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = size * 0.06;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = size * 0.04;
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
    ctx.fillStyle = colors.from;
    ctx.fill();
    ctx.restore();

    // 2. Background gradient fill
    const grad = ctx.createLinearGradient(pad, pad, pad, size - pad);
    grad.addColorStop(0, colors.from);
    grad.addColorStop(1, colors.to);
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
    ctx.fillStyle = grad;
    ctx.fill();

    // 3. Inner highlight (top-half shine)
    const highlightH = (size - pad * 2) * 0.45;
    ctx.save();
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
    ctx.clip();
    const shineGrad = ctx.createLinearGradient(0, pad, 0, pad + highlightH);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
    shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(pad, pad, size - pad * 2, highlightH);
    ctx.restore();

    // 4. Border decoration based on tier
    if (tier >= 7) {
      // Rainbow/holographic shimmer border + corner stars
      const borderW = size * 0.05;
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
      ctx.strokeStyle = rainbowStroke(ctx, pad, pad, size - pad * 2, size - pad * 2);
      ctx.lineWidth = borderW;
      ctx.stroke();

      // Inner glow
      ctx.save();
      roundRect(ctx, pad + borderW, pad + borderW, size - (pad + borderW) * 2, size - (pad + borderW) * 2, cornerR * 0.8);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = size * 0.02;
      ctx.stroke();
      ctx.restore();

      // Corner stars
      const starSize = size * 0.06;
      const inset = pad + size * 0.1;
      drawSparkle(ctx, inset, inset, starSize, '#FFD700');
      drawSparkle(ctx, size - inset, inset, starSize, '#FFD700');
      drawSparkle(ctx, inset, size - inset, starSize, '#FFD700');
      drawSparkle(ctx, size - inset, size - inset, starSize, '#FFD700');
    } else if (tier >= 5) {
      // Golden sparkle border
      const borderW = size * 0.04;
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = borderW;
      ctx.stroke();

      // Inner glow line
      roundRect(ctx, pad + borderW * 0.8, pad + borderW * 0.8,
        size - (pad + borderW * 0.8) * 2, size - (pad + borderW * 0.8) * 2, cornerR * 0.85);
      ctx.strokeStyle = 'rgba(255,215,0,0.3)';
      ctx.lineWidth = size * 0.015;
      ctx.stroke();

      // Sparkle dots at corners
      const dotSize = size * 0.04;
      const inset = pad + size * 0.1;
      drawSparkle(ctx, inset, inset, dotSize, '#FFD700');
      drawSparkle(ctx, size - inset, inset, dotSize, '#FFD700');
      drawSparkle(ctx, inset, size - inset, dotSize, '#FFD700');
      drawSparkle(ctx, size - inset, size - inset, dotSize, '#FFD700');
    } else if (tier >= 3) {
      // Thicker border with inner glow
      const borderW = size * 0.035;
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
      ctx.strokeStyle = colors.to;
      ctx.lineWidth = borderW;
      ctx.stroke();

      // Subtle inner glow
      roundRect(ctx, pad + borderW, pad + borderW,
        size - (pad + borderW) * 2, size - (pad + borderW) * 2, cornerR * 0.85);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = size * 0.015;
      ctx.stroke();
    } else {
      // Tier 1-2: Simple soft border
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
      ctx.strokeStyle = colors.to;
      ctx.lineWidth = size * 0.025;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 5. Emoji centered at ~65% of card size
    const emojiSize = size * 0.65;
    ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.02);
  }

  /** Draw a generator frame: hexagonal-ish pink/rose with "+" indicator */
  private static drawGeneratorFrame(
    ctx: CanvasRenderingContext2D,
    size: number,
    emoji: string,
    chainId: string
  ): void {
    const pad = size * 0.05;
    const cornerR = size * 0.22;
    const colors = CHAIN_COLORS[chainId] || DEFAULT_COLORS;

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(190,80,130,0.25)';
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = size * 0.04;
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
    ctx.fillStyle = '#FFE4EC';
    ctx.fill();
    ctx.restore();

    // Rose/pink gradient background
    const grad = ctx.createLinearGradient(0, pad, 0, size - pad);
    grad.addColorStop(0, '#FFE4EC');
    grad.addColorStop(0.5, '#FFD0E0');
    grad.addColorStop(1, '#FFB8D0');
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner highlight shine
    ctx.save();
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
    ctx.clip();
    const shineGrad = ctx.createLinearGradient(0, pad, 0, pad + (size - pad * 2) * 0.4);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.45)');
    shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(pad, pad, size - pad * 2, (size - pad * 2) * 0.4);
    ctx.restore();

    // Thick rose border
    const borderW = size * 0.05;
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cornerR);
    ctx.strokeStyle = '#F06292';
    ctx.lineWidth = borderW;
    ctx.stroke();

    // Secondary inner border using chain color
    roundRect(ctx, pad + borderW * 0.8, pad + borderW * 0.8,
      size - (pad + borderW * 0.8) * 2, size - (pad + borderW * 0.8) * 2, cornerR * 0.85);
    ctx.strokeStyle = colors.to;
    ctx.lineWidth = size * 0.02;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Emoji
    const emojiSize = size * 0.55;
    ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.01);

    // "+" indicator in top-right corner
    const plusR = size * 0.11;
    const plusCX = size - pad - plusR * 0.8;
    const plusCY = pad + plusR * 0.8;

    ctx.beginPath();
    ctx.arc(plusCX, plusCY, plusR, 0, Math.PI * 2);
    ctx.fillStyle = '#EC407A';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = size * 0.015;
    ctx.stroke();

    // Plus sign
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${plusR * 1.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', plusCX, plusCY);
  }

  /** Draw UI emoji textures (gem, star, sparkle) with a subtle glow */
  private static drawUITexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    emoji: string
  ): void {
    // Subtle glow behind
    const glowR = size * 0.35;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, glowR);
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Emoji
    ctx.font = `${size * 0.75}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.03);
  }
}
