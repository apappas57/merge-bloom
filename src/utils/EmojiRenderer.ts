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
  love:      { from: '#FFB3C6', to: '#FF6B8A', fromHex: 0xFFB3C6, toHex: 0xFF6B8A },
  cosmic:    { from: '#D1C4E9', to: '#7C4DFF', fromHex: 0xD1C4E9, toHex: 0x7C4DFF },
  cafe:      { from: '#EFEBE9', to: '#BCAAA4', fromHex: 0xEFEBE9, toHex: 0xBCAAA4 },
};

const DEFAULT_COLORS = { from: '#E0E0E0', to: '#BDBDBD', fromHex: 0xE0E0E0, toHex: 0xBDBDBD };

function parseKey(key: string): { chainId: string; tier: number; isGenerator: boolean; isUI: boolean } {
  if (key.startsWith('gen_')) {
    const rest = key.slice(4);
    const chainId = rest.replace('gen_', '');
    return { chainId, tier: 0, isGenerator: true, isUI: false };
  }
  if (key === 'gem' || key === 'star_ui' || key === 'sparkle') {
    return { chainId: '', tier: 0, isGenerator: false, isUI: true };
  }
  const parts = key.split('_');
  const tier = parseInt(parts[parts.length - 1], 10);
  const chainId = parts.slice(0, parts.length - 1).join('_');
  return { chainId, tier, isGenerator: false, isUI: false };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

/** Draw cute kawaii eyes on a shape */
function drawCuteEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, happy: boolean = false): void {
  const eyeSpacing = size * 0.16;
  const eyeR = size * 0.045;

  if (happy) {
    // Happy closed eyes (^_^)
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = size * 0.02;
    ctx.lineCap = 'round';
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.arc(cx + dir * eyeSpacing, cy, eyeR * 1.5, Math.PI + 0.3, -0.3);
      ctx.stroke();
    });
  } else {
    // Open dot eyes with shine
    [-1, 1].forEach(dir => {
      const ex = cx + dir * eyeSpacing;
      ctx.fillStyle = '#3D2B1F';
      ctx.beginPath();
      ctx.arc(ex, cy, eyeR, 0, Math.PI * 2);
      ctx.fill();
      // Shine
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - eyeR * 0.3, cy - eyeR * 0.4, eyeR * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

/** Draw blush marks */
function drawBlush(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const spacing = size * 0.22;
  ctx.fillStyle = 'rgba(255,130,170,0.25)';
  [-1, 1].forEach(dir => {
    ctx.beginPath();
    ctx.ellipse(cx + dir * spacing, cy + size * 0.06, size * 0.06, size * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Draw a tiny smile */
function drawSmile(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.strokeStyle = '#5C3D2E';
  ctx.lineWidth = size * 0.015;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.08, size * 0.05, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

/** Draw sparkle decorations for high-tier items */
function drawSparkles(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, count: number): void {
  ctx.fillStyle = 'rgba(255,215,0,0.6)';
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.PI / 4;
    const dist = size * 0.42;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist;
    const sr = size * 0.025;
    // 4-point star
    ctx.beginPath();
    ctx.moveTo(sx, sy - sr * 2);
    ctx.quadraticCurveTo(sx + sr * 0.3, sy - sr * 0.3, sx + sr * 2, sy);
    ctx.quadraticCurveTo(sx + sr * 0.3, sy + sr * 0.3, sx, sy + sr * 2);
    ctx.quadraticCurveTo(sx - sr * 0.3, sy + sr * 0.3, sx - sr * 2, sy);
    ctx.quadraticCurveTo(sx - sr * 0.3, sy - sr * 0.3, sx, sy - sr * 2);
    ctx.fill();
  }
}

export class EmojiRenderer {
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
        EmojiRenderer.drawGenerator(ctx, size, emoji, parsed.chainId);
      } else if (parsed.isUI) {
        EmojiRenderer.drawUI(ctx, size, emoji);
      } else {
        EmojiRenderer.drawPlushItem(ctx, size, emoji, parsed.chainId, parsed.tier);
      }

      scene.textures.addCanvas(key, canvas);
    }
  }

  /** Draw a cute plush-style item — the core visual identity */
  private static drawPlushItem(ctx: CanvasRenderingContext2D, size: number, emoji: string, chainId: string, tier: number): void {
    const colors = CHAIN_COLORS[chainId] || DEFAULT_COLORS;
    const cx = size / 2;
    const cy = size / 2;
    const pad = size * 0.08;
    const bodyR = (size - pad * 2) / 2;
    const cr = size * 0.18;

    // === Background card ===
    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = size * 0.05;
    ctx.shadowOffsetY = size * 0.03;
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.fillStyle = colors.from;
    ctx.fill();
    ctx.restore();

    // Gradient fill
    const grad = ctx.createLinearGradient(pad, pad, pad, size - pad);
    grad.addColorStop(0, colors.from);
    grad.addColorStop(1, colors.to);
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner shine
    ctx.save();
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.clip();
    const shine = ctx.createLinearGradient(0, pad, 0, cy);
    shine.addColorStop(0, 'rgba(255,255,255,0.4)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(pad, pad, size - pad * 2, cy - pad);
    ctx.restore();

    // Border (tier-based)
    if (tier >= 7) {
      // Rainbow shimmer border
      const rGrad = ctx.createLinearGradient(pad, pad, size - pad, size - pad);
      rGrad.addColorStop(0, '#FF6B9D');
      rGrad.addColorStop(0.25, '#FFD93D');
      rGrad.addColorStop(0.5, '#6BCB77');
      rGrad.addColorStop(0.75, '#4D96FF');
      rGrad.addColorStop(1, '#FF6B9D');
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = rGrad;
      ctx.lineWidth = size * 0.04;
      ctx.stroke();
      drawSparkles(ctx, cx, cy, size, 4);
    } else if (tier >= 5) {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = size * 0.035;
      ctx.stroke();
      drawSparkles(ctx, cx, cy, size, 3);
    } else if (tier >= 3) {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = colors.to;
      ctx.lineWidth = size * 0.025;
      ctx.stroke();
    } else {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = colors.to;
      ctx.lineWidth = size * 0.02;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // === Plush body (centered circle/blob) ===
    const plushR = bodyR * 0.55;
    const plushY = cy + size * 0.02;

    // Plush shadow
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.ellipse(cx, plushY + plushR * 0.15, plushR * 0.9, plushR * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plush body gradient
    const plushGrad = ctx.createRadialGradient(cx - plushR * 0.25, plushY - plushR * 0.25, 0, cx, plushY, plushR);
    plushGrad.addColorStop(0, '#FFFFFF');
    plushGrad.addColorStop(0.4, colors.from);
    plushGrad.addColorStop(1, colors.to);
    ctx.fillStyle = plushGrad;
    ctx.beginPath();
    ctx.arc(cx, plushY, plushR, 0, Math.PI * 2);
    ctx.fill();

    // Plush border
    ctx.strokeStyle = colors.to + '80';
    ctx.lineWidth = size * 0.01;
    ctx.stroke();

    // === Cute face ===
    const faceY = plushY - plushR * 0.05;
    const isHappy = tier >= 5;
    drawCuteEyes(ctx, cx, faceY, size, isHappy);
    drawBlush(ctx, cx, faceY, size);
    drawSmile(ctx, cx, faceY, size);

    // === Emoji as tiny icon on the plush body (like a belly button design) ===
    const iconSize = size * 0.22;
    ctx.font = `${iconSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, cx, plushY + plushR * 0.45);
  }

  /** Draw a generator — special plush with "tap me" energy */
  private static drawGenerator(ctx: CanvasRenderingContext2D, size: number, emoji: string, chainId: string): void {
    const colors = CHAIN_COLORS[chainId] || DEFAULT_COLORS;
    const cx = size / 2;
    const cy = size / 2;
    const pad = size * 0.06;
    const cr = size * 0.2;

    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(190,80,130,0.2)';
    ctx.shadowBlur = size * 0.06;
    ctx.shadowOffsetY = size * 0.03;
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.fillStyle = '#FFE4EC';
    ctx.fill();
    ctx.restore();

    // Pink gradient
    const grad = ctx.createLinearGradient(0, pad, 0, size - pad);
    grad.addColorStop(0, '#FFE4EC');
    grad.addColorStop(1, '#FFB8D0');
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner shine
    ctx.save();
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.clip();
    const shine = ctx.createLinearGradient(0, pad, 0, cy);
    shine.addColorStop(0, 'rgba(255,255,255,0.4)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(pad, pad, size - pad * 2, cy - pad);
    ctx.restore();

    // Border
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.strokeStyle = '#F06292';
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Emoji centered
    const emojiSize = size * 0.45;
    ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, cx, cy);

    // "+" badge
    const plusR = size * 0.1;
    const plusX = size - pad - plusR;
    const plusY = pad + plusR;
    ctx.beginPath();
    ctx.arc(plusX, plusY, plusR, 0, Math.PI * 2);
    ctx.fillStyle = '#EC407A';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${plusR * 1.4}px sans-serif`;
    ctx.fillText('+', plusX, plusY + 1);
  }

  /** Draw UI textures (gem, star, sparkle) */
  private static drawUI(ctx: CanvasRenderingContext2D, size: number, emoji: string): void {
    // Subtle glow behind
    const cx = size / 2;
    const cy = size / 2;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.4);
    glow.addColorStop(0, 'rgba(255,200,230,0.3)');
    glow.addColorStop(1, 'rgba(255,200,230,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    ctx.font = `${size * 0.7}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, cx, cy + size * 0.03);
  }
}
