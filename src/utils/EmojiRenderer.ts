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
      // Holographic gradient border with multi-stop shimmer
      const holoGrad = ctx.createLinearGradient(pad, pad, size - pad, size - pad);
      holoGrad.addColorStop(0, '#FF6B9D');
      holoGrad.addColorStop(0.15, '#FFD93D');
      holoGrad.addColorStop(0.35, '#6BCB77');
      holoGrad.addColorStop(0.55, '#4D96FF');
      holoGrad.addColorStop(0.75, '#D4A5FF');
      holoGrad.addColorStop(1, '#FF6B9D');
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = holoGrad;
      ctx.lineWidth = size * 0.045;
      ctx.stroke();

      // Outer glow halo for holographic effect
      ctx.save();
      ctx.globalAlpha = 0.15;
      roundRect(ctx, pad - size * 0.01, pad - size * 0.01, size - pad * 2 + size * 0.02, size - pad * 2 + size * 0.02, cr + size * 0.01);
      ctx.strokeStyle = holoGrad;
      ctx.lineWidth = size * 0.03;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();

      drawSparkles(ctx, cx, cy, size, 5);
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

    // === Plush body (unique shape per chain) ===
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

    // Draw chain-specific plush body shape
    EmojiRenderer.drawPlushBody(ctx, cx, plushY, plushR, chainId);
    ctx.fill();

    // Plush border
    ctx.strokeStyle = colors.to + '80';
    ctx.lineWidth = size * 0.01;
    EmojiRenderer.drawPlushBody(ctx, cx, plushY, plushR, chainId);
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

  /** Draw the plush body path for a specific chain shape */
  private static drawPlushBody(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, chainId: string): void {
    ctx.beginPath();

    switch (chainId) {
      case 'flower': {
        // Petal/tulip shape -- wider at top, tapered bottom
        const w = r * 1.1;
        const h = r * 1.15;
        ctx.moveTo(cx, cy + h);
        // Taper up from bottom-center to the wide top
        ctx.bezierCurveTo(cx - w * 0.3, cy + h * 0.4, cx - w * 1.1, cy + h * 0.1, cx - w * 0.85, cy - h * 0.3);
        // Round across the wide top (left petal lobe)
        ctx.bezierCurveTo(cx - w * 0.7, cy - h * 0.85, cx - w * 0.25, cy - h * 1.0, cx, cy - h * 0.8);
        // Top right petal lobe
        ctx.bezierCurveTo(cx + w * 0.25, cy - h * 1.0, cx + w * 0.7, cy - h * 0.85, cx + w * 0.85, cy - h * 0.3);
        // Taper back down to bottom
        ctx.bezierCurveTo(cx + w * 1.1, cy + h * 0.1, cx + w * 0.3, cy + h * 0.4, cx, cy + h);
        break;
      }

      case 'butterfly': {
        // Wing/oval shape -- wider than tall, pinched at center
        const w = r * 1.2;
        const h = r * 0.85;
        ctx.moveTo(cx, cy - h);
        // Top-right to right wing bulge
        ctx.bezierCurveTo(cx + w * 0.6, cy - h * 1.1, cx + w * 1.2, cy - h * 0.5, cx + w, cy);
        // Right pinch to bottom-right
        ctx.bezierCurveTo(cx + w * 1.2, cy + h * 0.5, cx + w * 0.6, cy + h * 1.1, cx, cy + h);
        // Bottom-left to left wing bulge
        ctx.bezierCurveTo(cx - w * 0.6, cy + h * 1.1, cx - w * 1.2, cy + h * 0.5, cx - w, cy);
        // Left pinch back to top
        ctx.bezierCurveTo(cx - w * 1.2, cy - h * 0.5, cx - w * 0.6, cy - h * 1.1, cx, cy - h);
        break;
      }

      case 'fruit': {
        // Apple shape -- round but slightly wider at bottom with a small indent at top
        const w = r * 1.0;
        const h = r * 1.05;
        ctx.moveTo(cx, cy - h * 0.9);
        // Top-right curve (slight indent at center top)
        ctx.bezierCurveTo(cx + w * 0.35, cy - h * 1.05, cx + w * 1.05, cy - h * 0.6, cx + w * 0.95, cy - h * 0.05);
        // Right side to bottom-right (wider at bottom)
        ctx.bezierCurveTo(cx + w * 1.1, cy + h * 0.5, cx + w * 0.7, cy + h * 1.05, cx, cy + h);
        // Bottom-left to left side
        ctx.bezierCurveTo(cx - w * 0.7, cy + h * 1.05, cx - w * 1.1, cy + h * 0.5, cx - w * 0.95, cy - h * 0.05);
        // Left side back up to top indent
        ctx.bezierCurveTo(cx - w * 1.05, cy - h * 0.6, cx - w * 0.35, cy - h * 1.05, cx, cy - h * 0.9);
        break;
      }

      case 'crystal': {
        // Hexagonal gem shape -- faceted with soft rounded corners
        const w = r * 0.95;
        const h = r * 1.05;
        const softR = r * 0.12;
        // 6-sided gem: flat top/bottom, angled sides
        const points: [number, number][] = [
          [cx - w * 0.5, cy - h],        // top-left
          [cx + w * 0.5, cy - h],         // top-right
          [cx + w, cy - h * 0.15],        // right-upper
          [cx + w * 0.7, cy + h * 0.85],  // right-lower
          [cx - w * 0.7, cy + h * 0.85],  // left-lower
          [cx - w, cy - h * 0.15],        // left-upper
        ];
        // Draw with rounded corners between each pair of edges
        ctx.moveTo(
          (points[5][0] + points[0][0]) / 2,
          (points[5][1] + points[0][1]) / 2
        );
        for (let i = 0; i < 6; i++) {
          const curr = points[i];
          const next = points[(i + 1) % 6];
          const midX = (curr[0] + next[0]) / 2;
          const midY = (curr[1] + next[1]) / 2;
          ctx.quadraticCurveTo(curr[0] + (curr[0] > cx ? -softR * 0.3 : softR * 0.3), curr[1], midX, midY);
        }
        break;
      }

      case 'nature': {
        // Leaf/teardrop shape -- pointed at top, round at bottom
        const w = r * 0.95;
        const h = r * 1.15;
        ctx.moveTo(cx, cy - h);
        // Right side -- curves outward then rounds at bottom
        ctx.bezierCurveTo(cx + w * 0.6, cy - h * 0.5, cx + w * 1.1, cy + h * 0.1, cx + w * 0.8, cy + h * 0.5);
        // Bottom-right to bottom center (round bottom)
        ctx.bezierCurveTo(cx + w * 0.55, cy + h * 0.95, cx + w * 0.15, cy + h * 1.05, cx, cy + h * 0.95);
        // Bottom-left
        ctx.bezierCurveTo(cx - w * 0.15, cy + h * 1.05, cx - w * 0.55, cy + h * 0.95, cx - w * 0.8, cy + h * 0.5);
        // Left side back up to point
        ctx.bezierCurveTo(cx - w * 1.1, cy + h * 0.1, cx - w * 0.6, cy - h * 0.5, cx, cy - h);
        break;
      }

      case 'star': {
        // 5-pointed star with very rounded points (plush star cushion)
        const outerR = r * 1.1;
        const innerR = r * 0.55;
        const points = 5;
        const startAngle = -Math.PI / 2;
        // Build star vertices
        const verts: [number, number][] = [];
        for (let i = 0; i < points * 2; i++) {
          const angle = startAngle + (i * Math.PI) / points;
          const rad = i % 2 === 0 ? outerR : innerR;
          verts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]);
        }
        // Draw with rounded corners using quadratic curves through midpoints
        const first = verts[0];
        const last = verts[verts.length - 1];
        ctx.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
        for (let i = 0; i < verts.length; i++) {
          const curr = verts[i];
          const next = verts[(i + 1) % verts.length];
          const midX = (curr[0] + next[0]) / 2;
          const midY = (curr[1] + next[1]) / 2;
          ctx.quadraticCurveTo(curr[0], curr[1], midX, midY);
        }
        break;
      }

      case 'tea': {
        // Mug/cup shape -- rounded rectangle, wider at top
        const topW = r * 1.05;
        const botW = r * 0.8;
        const h = r * 1.0;
        const cornerR = r * 0.25;
        ctx.moveTo(cx - topW + cornerR, cy - h);
        // Top edge
        ctx.lineTo(cx + topW - cornerR, cy - h);
        // Top-right corner
        ctx.quadraticCurveTo(cx + topW, cy - h, cx + topW, cy - h + cornerR);
        // Right side (tapers in toward bottom)
        ctx.lineTo(cx + botW, cy + h - cornerR);
        // Bottom-right corner
        ctx.quadraticCurveTo(cx + botW, cy + h, cx + botW - cornerR, cy + h);
        // Bottom edge
        ctx.lineTo(cx - botW + cornerR, cy + h);
        // Bottom-left corner
        ctx.quadraticCurveTo(cx - botW, cy + h, cx - botW, cy + h - cornerR);
        // Left side (tapers out toward top)
        ctx.lineTo(cx - topW, cy - h + cornerR);
        // Top-left corner
        ctx.quadraticCurveTo(cx - topW, cy - h, cx - topW + cornerR, cy - h);
        break;
      }

      case 'shell': {
        // Shell/swirl shape -- slightly asymmetric, organic curves
        const w = r * 1.0;
        const h = r * 1.05;
        ctx.moveTo(cx + w * 0.1, cy - h);
        // Top-right -- asymmetric bulge
        ctx.bezierCurveTo(cx + w * 0.8, cy - h * 1.05, cx + w * 1.15, cy - h * 0.4, cx + w * 0.95, cy + h * 0.1);
        // Right to bottom-right -- sweeping curve
        ctx.bezierCurveTo(cx + w * 0.8, cy + h * 0.6, cx + w * 0.5, cy + h * 1.05, cx - w * 0.1, cy + h);
        // Bottom-left -- tighter curve
        ctx.bezierCurveTo(cx - w * 0.6, cy + h * 0.95, cx - w * 1.05, cy + h * 0.5, cx - w * 0.95, cy - h * 0.05);
        // Left back up to top -- softer asymmetry
        ctx.bezierCurveTo(cx - w * 0.85, cy - h * 0.55, cx - w * 0.5, cy - h * 0.95, cx + w * 0.1, cy - h);
        break;
      }

      case 'sweet': {
        // Cupcake shape -- wider top dome, narrower bottom base
        const topW = r * 1.05;
        const botW = r * 0.7;
        const h = r * 1.05;
        const domeH = h * 0.55;
        // Start at bottom-left
        ctx.moveTo(cx - botW, cy + h);
        // Bottom edge
        ctx.lineTo(cx + botW, cy + h);
        // Right side tapers up to dome start
        ctx.lineTo(cx + topW * 0.85, cy + h - domeH);
        // Dome -- wide rounded top
        ctx.bezierCurveTo(
          cx + topW * 1.15, cy - h * 0.3,
          cx + topW * 0.6, cy - h * 1.05,
          cx, cy - h * 0.95
        );
        ctx.bezierCurveTo(
          cx - topW * 0.6, cy - h * 1.05,
          cx - topW * 1.15, cy - h * 0.3,
          cx - topW * 0.85, cy + h - domeH
        );
        // Left side down to bottom
        ctx.lineTo(cx - botW, cy + h);
        break;
      }

      case 'love': {
        // Heart shape -- classic soft plush heart
        const w = r * 1.0;
        const h = r * 1.1;
        // Start at the bottom point of the heart
        ctx.moveTo(cx, cy + h * 0.85);
        // Left side curve up to the left hump
        ctx.bezierCurveTo(
          cx - w * 0.3, cy + h * 0.4,
          cx - w * 1.2, cy + h * 0.1,
          cx - w * 1.0, cy - h * 0.3
        );
        // Left hump to center dip
        ctx.bezierCurveTo(
          cx - w * 0.85, cy - h * 0.85,
          cx - w * 0.2, cy - h * 0.95,
          cx, cy - h * 0.55
        );
        // Center dip to right hump
        ctx.bezierCurveTo(
          cx + w * 0.2, cy - h * 0.95,
          cx + w * 0.85, cy - h * 0.85,
          cx + w * 1.0, cy - h * 0.3
        );
        // Right hump down to bottom point
        ctx.bezierCurveTo(
          cx + w * 1.2, cy + h * 0.1,
          cx + w * 0.3, cy + h * 0.4,
          cx, cy + h * 0.85
        );
        break;
      }

      case 'cosmic': {
        // Crescent/planet shape -- main circle body with a small ring arc
        const bodyR = r * 0.85;
        // Main planet circle
        ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
        ctx.closePath();
        // Draw the ring as a separate ellipse (stroked later separately via fill only here)
        // The ring wraps around -- draw it as a thick elliptical path behind
        ctx.moveTo(cx + r * 1.2, cy + r * 0.05);
        ctx.ellipse(cx, cy + r * 0.05, r * 1.2, r * 0.3, -0.15, 0, Math.PI * 2);
        break;
      }

      case 'cafe': {
        // Coffee bean shape -- vertical oval with a curved line through the middle
        const w = r * 0.8;
        const h = r * 1.1;
        // Main bean oval
        ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
        break;
      }

      default: {
        // Fallback: simple circle
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        break;
      }
    }

    ctx.closePath();
  }

  /** Draw a generator — chain-colored card with programmatic icon (no emoji dependency) */
  private static drawGenerator(ctx: CanvasRenderingContext2D, size: number, _emoji: string, chainId: string): void {
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
    ctx.fillStyle = colors.from;
    ctx.fill();
    ctx.restore();

    // Chain-specific gradient background
    const grad = ctx.createLinearGradient(0, pad, 0, size - pad);
    grad.addColorStop(0, colors.from);
    grad.addColorStop(0.6, colors.to);
    grad.addColorStop(1, colors.from);
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner shine
    ctx.save();
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.clip();
    const shine = ctx.createLinearGradient(0, pad, 0, cy);
    shine.addColorStop(0, 'rgba(255,255,255,0.45)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(pad, pad, size - pad * 2, cy - pad);
    ctx.restore();

    // Double border for generator distinction
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.strokeStyle = colors.to;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();
    roundRect(ctx, pad + size * 0.03, pad + size * 0.03, size - pad * 2 - size * 0.06, size - pad * 2 - size * 0.06, cr - size * 0.02);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = size * 0.02;
    ctx.stroke();

    // Draw chain plush body shape as the generator icon
    const plushR = size * 0.22;
    const plushY = cy + size * 0.02;
    const plushGrad = ctx.createRadialGradient(cx - plushR * 0.3, plushY - plushR * 0.3, 0, cx, plushY, plushR);
    plushGrad.addColorStop(0, '#FFFFFF');
    plushGrad.addColorStop(0.5, colors.from);
    plushGrad.addColorStop(1, colors.to);
    ctx.fillStyle = plushGrad;
    EmojiRenderer.drawPlushBody(ctx, cx, plushY, plushR, chainId);
    ctx.fill();

    // Plush border
    ctx.strokeStyle = colors.to + '80';
    ctx.lineWidth = size * 0.01;
    EmojiRenderer.drawPlushBody(ctx, cx, plushY, plushR, chainId);
    ctx.stroke();

    // Cute face on the plush
    drawCuteEyes(ctx, cx, plushY - plushR * 0.05, size * 0.55, false);
    drawBlush(ctx, cx, plushY - plushR * 0.05, size * 0.55);
    drawSmile(ctx, cx, plushY - plushR * 0.05, size * 0.55);

    // Sparkle accents around the plush
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const sparklePositions = [
      { x: cx - plushR * 1.3, y: plushY - plushR * 0.8 },
      { x: cx + plushR * 1.3, y: plushY - plushR * 0.6 },
      { x: cx - plushR * 1.1, y: plushY + plushR * 0.6 },
    ];
    for (const sp of sparklePositions) {
      const sr = size * 0.02;
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y - sr * 2);
      ctx.quadraticCurveTo(sp.x + sr * 0.3, sp.y - sr * 0.3, sp.x + sr * 2, sp.y);
      ctx.quadraticCurveTo(sp.x + sr * 0.3, sp.y + sr * 0.3, sp.x, sp.y + sr * 2);
      ctx.quadraticCurveTo(sp.x - sr * 0.3, sp.y + sr * 0.3, sp.x - sr * 2, sp.y);
      ctx.quadraticCurveTo(sp.x - sr * 0.3, sp.y - sr * 0.3, sp.x, sp.y - sr * 2);
      ctx.fill();
    }

    // "+" badge (rose pink circle with white plus)
    const plusR = size * 0.11;
    const plusX = size - pad - plusR - size * 0.01;
    const plusY = pad + plusR + size * 0.01;
    ctx.beginPath();
    ctx.arc(plusX, plusY, plusR, 0, Math.PI * 2);
    ctx.fillStyle = '#EC407A';
    ctx.fill();
    // White border on badge
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = size * 0.015;
    ctx.stroke();
    // Plus symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${plusR * 1.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
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
