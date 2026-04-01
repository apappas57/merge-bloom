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

function parseKey(key: string): { chainId: string; tier: number; isGenerator: boolean; isUI: boolean; genTier: number } {
  // Tiered generator keys: gen_gen_<chainId>_t<tier>
  const genTierMatch = key.match(/^gen_gen_(.+)_t(\d+)$/);
  if (genTierMatch) {
    return { chainId: genTierMatch[1], tier: 0, isGenerator: true, isUI: false, genTier: parseInt(genTierMatch[2], 10) };
  }
  // Legacy generator keys: gen_gen_<chainId> (no tier suffix)
  if (key.startsWith('gen_')) {
    const rest = key.slice(4);
    const chainId = rest.replace('gen_', '');
    return { chainId, tier: 0, isGenerator: true, isUI: false, genTier: 1 };
  }
  if (key === 'gem' || key === 'star_ui' || key === 'sparkle') {
    return { chainId: '', tier: 0, isGenerator: false, isUI: true, genTier: 0 };
  }
  const parts = key.split('_');
  const tier = parseInt(parts[parts.length - 1], 10);
  const chainId = parts.slice(0, parts.length - 1).join('_');
  return { chainId, tier, isGenerator: false, isUI: false, genTier: 0 };
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

// ============================================================
// PROGRAMMATIC ICON DRAWING FUNCTIONS
// Each draws a premium canvas 2D illustration with gradients,
// highlights, shadows, and tier-scaling detail.
// ============================================================

type IconDrawFn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string) => void;

/** Add a two-part volumetric specular highlight to any icon (upper-left light) */
function addHighlight(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  // Primary highlight: larger, softer, elliptical for realism
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.30, r * 0.22, r * 0.15, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Secondary highlight: smaller, brighter, sharper pinpoint
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.18, cy - r * 0.22, r * 0.09, r * 0.06, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

/** Draw tiny 4-point sparkle stars around an icon for higher tiers */
function addTierSparkles(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, tier: number): void {
  if (tier < 3) return;
  const count = Math.min(tier - 2, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const dist = r * 1.15;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist;
    const sr = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(sx, sy - sr * 2);
    ctx.quadraticCurveTo(sx + sr * 0.3, sy - sr * 0.3, sx + sr * 2, sy);
    ctx.quadraticCurveTo(sx + sr * 0.3, sy + sr * 0.3, sx, sy + sr * 2);
    ctx.quadraticCurveTo(sx - sr * 0.3, sy + sr * 0.3, sx - sr * 2, sy);
    ctx.quadraticCurveTo(sx - sr * 0.3, sy - sr * 0.3, sx, sy - sr * 2);
    ctx.fill();
  }
}

// --- Seedling / Leaf Icon ---
function drawLeafIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  const leafCount = Math.min(1 + Math.floor(tier / 2), 4);
  for (let i = 0; i < leafCount; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i - (leafCount - 1) / 2) * 0.4);
    const grad = ctx.createLinearGradient(-r * 0.3, -r, r * 0.3, r * 0.4);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.bezierCurveTo(r * 0.6, -r * 0.6, r * 0.5, r * 0.3, 0, r * 0.5);
    ctx.bezierCurveTo(-r * 0.5, r * 0.3, -r * 0.6, -r * 0.6, 0, -r * 0.8);
    ctx.fill();
    // Leaf vein
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6);
    ctx.lineTo(0, r * 0.3);
    ctx.stroke();
    ctx.restore();
  }
  // Stem
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.3);
  ctx.lineTo(cx, cy + r * 0.7);
  ctx.stroke();
  addHighlight(ctx, cx, cy - r * 0.2, r);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Flower Icon (petals radiating from center) ---
function drawFlowerIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  const petalCount = 4 + Math.min(tier, 4);
  // Petals
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const grad = ctx.createRadialGradient(0, -r * 0.4, 0, 0, -r * 0.4, r * 0.35);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.45, r * 0.22, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Center
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.22);
  centerGrad.addColorStop(0, '#FFE082');
  centerGrad.addColorStop(1, '#FFB300');
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  addHighlight(ctx, cx, cy - r * 0.05, r * 0.2);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Butterfly Icon ---
function drawButterflyIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  const wingDetail = Math.min(tier, 6);
  // Wings (left + right, upper + lower)
  [-1, 1].forEach(dir => {
    // Upper wing
    const ugr = ctx.createRadialGradient(cx + dir * r * 0.4, cy - r * 0.2, 0, cx + dir * r * 0.4, cy - r * 0.2, r * 0.5);
    ugr.addColorStop(0, accent);
    ugr.addColorStop(1, color);
    ctx.fillStyle = ugr;
    ctx.beginPath();
    ctx.ellipse(cx + dir * r * 0.4, cy - r * 0.15, r * 0.38, r * 0.5, dir * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Lower wing
    const lgr = ctx.createRadialGradient(cx + dir * r * 0.3, cy + r * 0.25, 0, cx + dir * r * 0.3, cy + r * 0.25, r * 0.35);
    lgr.addColorStop(0, accent);
    lgr.addColorStop(1, color);
    ctx.fillStyle = lgr;
    ctx.beginPath();
    ctx.ellipse(cx + dir * r * 0.32, cy + r * 0.3, r * 0.25, r * 0.3, dir * -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Wing pattern dots for higher tiers
    if (wingDetail >= 3) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(cx + dir * r * 0.4, cy - r * 0.2, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    if (wingDetail >= 5) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(cx + dir * r * 0.3, cy + r * 0.25, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // Body
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.08, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  // Antennae
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = size * 0.02;
  ctx.lineCap = 'round';
  [-1, 1].forEach(dir => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.4);
    ctx.quadraticCurveTo(cx + dir * r * 0.25, cy - r * 0.7, cx + dir * r * 0.2, cy - r * 0.8);
    ctx.stroke();
    // Antenna tip
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.2, cy - r * 0.8, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  });
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Fruit Icon (round with highlight and leaf) ---
function drawFruitIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Main fruit body
  const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
  grad.addColorStop(0, accent);
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, darkenColor(color, 0.15));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.05, r, 0, Math.PI * 2);
  ctx.fill();
  // Leaf on top
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.15, cy - r * 0.8, r * 0.2, r * 0.1, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Stem
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = size * 0.03;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.7);
  ctx.lineTo(cx, cy - r * 0.95);
  ctx.stroke();
  // For multi-fruit tiers, add smaller fruit behind
  if (tier >= 4) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    const smR = r * 0.5;
    const smGrad = ctx.createRadialGradient(cx + r * 0.6, cy + r * 0.2, 0, cx + r * 0.6, cy + r * 0.2, smR);
    smGrad.addColorStop(0, accent);
    smGrad.addColorStop(1, color);
    ctx.fillStyle = smGrad;
    ctx.beginPath();
    ctx.arc(cx + r * 0.65, cy + r * 0.25, smR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  addHighlight(ctx, cx - r * 0.15, cy - r * 0.1, r);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Crystal / Gem Icon ---
function drawCrystalIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  const facets = 3 + Math.min(tier, 5);
  // Main gem body
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx + r * 0.6, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.45, cy + r * 0.8);
  ctx.lineTo(cx - r * 0.45, cy + r * 0.8);
  ctx.lineTo(cx - r * 0.6, cy - r * 0.2);
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, accent);
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darkenColor(color, 0.2));
  ctx.fillStyle = grad;
  ctx.fill();
  // Facet lines
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = size * 0.015;
  // Central facet
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx, cy + r * 0.8);
  ctx.stroke();
  // Diagonal facets
  if (facets >= 4) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.6, cy - r * 0.2);
    ctx.lineTo(cx - r * 0.45, cy + r * 0.8);
    ctx.stroke();
  }
  if (facets >= 6) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.9);
    ctx.lineTo(cx - r * 0.45, cy + r * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.8);
    ctx.stroke();
  }
  // Bright facet highlight
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx - r * 0.15, cy - r * 0.15);
  ctx.lineTo(cx + r * 0.15, cy - r * 0.15);
  ctx.closePath();
  ctx.fill();
  addHighlight(ctx, cx - r * 0.15, cy - r * 0.4, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Star Icon ---
function drawStarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  const points = 4 + Math.min(Math.floor(tier / 2), 2);
  // Outer glow for high tiers
  if (tier >= 4) {
    const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.1);
    glowGrad.addColorStop(0, accent + '60');
    glowGrad.addColorStop(1, accent + '00');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  // Star path
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const rad = i % 2 === 0 ? r : r * 0.4;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, 0, cx, cy, r);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.3, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fill();
  addHighlight(ctx, cx - r * 0.1, cy - r * 0.2, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Heart Icon ---
function drawHeartIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Heart path
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.7);
  ctx.bezierCurveTo(cx - r * 0.15, cy + r * 0.35, cx - r * 0.95, cy + r * 0.1, cx - r * 0.8, cy - r * 0.3);
  ctx.bezierCurveTo(cx - r * 0.65, cy - r * 0.75, cx - r * 0.1, cy - r * 0.8, cx, cy - r * 0.4);
  ctx.bezierCurveTo(cx + r * 0.1, cy - r * 0.8, cx + r * 0.65, cy - r * 0.75, cx + r * 0.8, cy - r * 0.3);
  ctx.bezierCurveTo(cx + r * 0.95, cy + r * 0.1, cx + r * 0.15, cy + r * 0.35, cx, cy + r * 0.7);
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fill();
  // Inner detail for higher tiers
  if (tier >= 3) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.35);
    ctx.bezierCurveTo(cx - r * 0.08, cy + r * 0.2, cx - r * 0.5, cy + r * 0.05, cx - r * 0.42, cy - r * 0.15);
    ctx.bezierCurveTo(cx - r * 0.35, cy - r * 0.4, cx - r * 0.05, cy - r * 0.42, cx, cy - r * 0.2);
    ctx.bezierCurveTo(cx + r * 0.05, cy - r * 0.42, cx + r * 0.35, cy - r * 0.4, cx + r * 0.42, cy - r * 0.15);
    ctx.bezierCurveTo(cx + r * 0.5, cy + r * 0.05, cx + r * 0.08, cy + r * 0.2, cx, cy + r * 0.35);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();
  }
  addHighlight(ctx, cx - r * 0.2, cy - r * 0.25, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Cup / Mug Icon ---
function drawCupIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.35;
  // Cup body
  const cupW = r * 0.7;
  const cupH = r * 0.9;
  const grad = ctx.createLinearGradient(cx - cupW, cy - cupH * 0.4, cx + cupW, cy + cupH * 0.6);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  roundRect(ctx, cx - cupW, cy - cupH * 0.3, cupW * 2, cupH * 1.1, r * 0.15);
  ctx.fill();
  // Cup rim
  ctx.fillStyle = darkenColor(color, 0.1);
  ctx.beginPath();
  ctx.ellipse(cx, cy - cupH * 0.3, cupW, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Handle
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx + cupW + r * 0.15, cy + cupH * 0.1, r * 0.22, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();
  // Steam wisps
  if (tier >= 2) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = size * 0.02;
    const steamCount = Math.min(tier - 1, 3);
    for (let i = 0; i < steamCount; i++) {
      const sx = cx + (i - (steamCount - 1) / 2) * r * 0.3;
      ctx.beginPath();
      ctx.moveTo(sx, cy - cupH * 0.4);
      ctx.quadraticCurveTo(sx + r * 0.12, cy - cupH * 0.7, sx - r * 0.08, cy - cupH * 0.95);
      ctx.stroke();
    }
  }
  addHighlight(ctx, cx - cupW * 0.3, cy - cupH * 0.1, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Shell / Spiral Icon ---
function drawShellIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Main shell body
  const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, 0, cx, cy, r);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.3, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  // Shell fan shape
  ctx.moveTo(cx - r * 0.1, cy + r * 0.7);
  ctx.bezierCurveTo(cx - r * 0.8, cy + r * 0.5, cx - r * 0.9, cy - r * 0.3, cx - r * 0.4, cy - r * 0.7);
  ctx.bezierCurveTo(cx, cy - r * 0.9, cx + r * 0.5, cy - r * 0.7, cx + r * 0.7, cy - r * 0.2);
  ctx.bezierCurveTo(cx + r * 0.9, cy + r * 0.2, cx + r * 0.6, cy + r * 0.65, cx + r * 0.1, cy + r * 0.7);
  ctx.closePath();
  ctx.fill();
  // Spiral ridges
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = size * 0.015;
  const ridgeCount = 2 + Math.min(tier, 4);
  for (let i = 1; i <= ridgeCount; i++) {
    const t = i / (ridgeCount + 1);
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.1, cy + r * 0.7);
    ctx.quadraticCurveTo(
      cx + (t - 0.5) * r * 0.5, cy + r * (0.3 - t * 0.8),
      cx + r * (0.1 + t * 0.4), cy - r * (0.1 + t * 0.4)
    );
    ctx.stroke();
  }
  addHighlight(ctx, cx - r * 0.1, cy - r * 0.2, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Cake / Sweet Icon ---
function drawCakeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  const layers = Math.min(1 + Math.floor(tier / 2), 3);
  const layerH = (r * 1.4) / layers;
  const baseY = cy + r * 0.55;
  for (let i = 0; i < layers; i++) {
    const y = baseY - i * layerH;
    const w = r * (0.8 - i * 0.12);
    const h = layerH * 0.9;
    // Layer body
    const grad = ctx.createLinearGradient(cx - w, y - h, cx + w, y);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    roundRect(ctx, cx - w, y - h, w * 2, h, r * 0.08);
    ctx.fill();
    // Frosting drip on top
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(cx, y - h, w * 0.95, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Cherry on top for higher tiers
  if (tier >= 3) {
    const topY = baseY - layers * layerH;
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.arc(cx, topY - r * 0.1, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Cherry highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.03, topY - r * 0.13, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // Stem
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.moveTo(cx, topY - r * 0.22);
    ctx.quadraticCurveTo(cx + r * 0.1, topY - r * 0.35, cx + r * 0.05, topY - r * 0.4);
    ctx.stroke();
  }
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Cosmic Icon (planet, comet, rocket shapes) ---
function drawCosmicIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.35;
  if (tier <= 2) {
    // Rock / Comet
    const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, 0, cx, cy, r);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    if (tier >= 2) {
      // Comet tail
      ctx.fillStyle = accent + '60';
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.4, cy - r * 0.1);
      ctx.quadraticCurveTo(cx + r * 1.0, cy + r * 0.3, cx + r * 1.2, cy - r * 0.5);
      ctx.quadraticCurveTo(cx + r * 0.8, cy + r * 0.1, cx + r * 0.4, cy + r * 0.1);
      ctx.closePath();
      ctx.fill();
    }
  } else if (tier <= 4) {
    // Planet with ring
    const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r * 0.65);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    // Ring
    ctx.strokeStyle = accent + 'AA';
    ctx.lineWidth = size * 0.03;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.9, r * 0.2, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    // Surface band
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.1, r * 0.45, r * 0.08, 0.1, 0, Math.PI);
    ctx.stroke();
  } else {
    // Rocket
    const bodyW = r * 0.3;
    const bodyH = r * 0.9;
    // Body
    const grad = ctx.createLinearGradient(cx - bodyW, cy, cx + bodyW, cy);
    grad.addColorStop(0, darkenColor(color, 0.1));
    grad.addColorStop(0.5, accent);
    grad.addColorStop(1, darkenColor(color, 0.1));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - bodyH);
    ctx.bezierCurveTo(cx + bodyW * 0.5, cy - bodyH * 0.7, cx + bodyW, cy - bodyH * 0.3, cx + bodyW, cy + bodyH * 0.4);
    ctx.lineTo(cx - bodyW, cy + bodyH * 0.4);
    ctx.bezierCurveTo(cx - bodyW, cy - bodyH * 0.3, cx - bodyW * 0.5, cy - bodyH * 0.7, cx, cy - bodyH);
    ctx.closePath();
    ctx.fill();
    // Nose cone
    const noseGrad = ctx.createRadialGradient(cx, cy - bodyH * 0.5, 0, cx, cy - bodyH * 0.5, bodyW);
    noseGrad.addColorStop(0, '#FFFFFF');
    noseGrad.addColorStop(1, accent);
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - bodyH);
    ctx.bezierCurveTo(cx + bodyW * 0.3, cy - bodyH * 0.7, cx + bodyW * 0.5, cy - bodyH * 0.5, cx + bodyW * 0.5, cy - bodyH * 0.4);
    ctx.lineTo(cx - bodyW * 0.5, cy - bodyH * 0.4);
    ctx.bezierCurveTo(cx - bodyW * 0.5, cy - bodyH * 0.5, cx - bodyW * 0.3, cy - bodyH * 0.7, cx, cy - bodyH);
    ctx.closePath();
    ctx.fill();
    // Fins
    ctx.fillStyle = color;
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.moveTo(cx + dir * bodyW, cy + bodyH * 0.2);
      ctx.lineTo(cx + dir * bodyW * 1.8, cy + bodyH * 0.55);
      ctx.lineTo(cx + dir * bodyW, cy + bodyH * 0.45);
      ctx.closePath();
      ctx.fill();
    });
    // Flame
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.5, cy + bodyH * 0.4);
    ctx.quadraticCurveTo(cx, cy + bodyH * 0.95, cx + bodyW * 0.5, cy + bodyH * 0.4);
    ctx.fill();
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.25, cy + bodyH * 0.4);
    ctx.quadraticCurveTo(cx, cy + bodyH * 0.7, cx + bodyW * 0.25, cy + bodyH * 0.4);
    ctx.fill();
    // Window
    ctx.fillStyle = '#E3F2FD';
    ctx.beginPath();
    ctx.arc(cx, cy - bodyH * 0.1, bodyW * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(cx - bodyW * 0.1, cy - bodyH * 0.15, bodyW * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  addHighlight(ctx, cx - r * 0.15, cy - r * 0.25, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Coffee / Cafe Icon ---
function drawCoffeeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  if (tier <= 1) {
    // Coffee bean
    const grad = ctx.createRadialGradient(cx - r * 0.1, cy - r * 0.1, 0, cx, cy, r * 0.5);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.35, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Center crease
    ctx.strokeStyle = darkenColor(color, 0.2);
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.35);
    ctx.quadraticCurveTo(cx + r * 0.08, cy, cx, cy + r * 0.35);
    ctx.stroke();
  } else if (tier <= 3) {
    // Coffee cup
    drawCupIcon(ctx, cx, cy, size, tier, color, accent);
    return;
  } else if (tier <= 5) {
    // Pastry / pancake stack
    const layers = tier - 2;
    const layerH = r * 0.25;
    const baseY = cy + r * 0.3;
    for (let i = 0; i < layers; i++) {
      const y = baseY - i * layerH;
      const w = r * (0.65 - i * 0.04);
      const grad2 = ctx.createLinearGradient(cx - w, y, cx + w, y + layerH);
      grad2.addColorStop(0, accent);
      grad2.addColorStop(1, color);
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.ellipse(cx, y, w, layerH * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      // Drizzle
      ctx.fillStyle = '#FFE082';
      ctx.beginPath();
      ctx.ellipse(cx, y - layerH * 0.15, w * 0.85, layerH * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Butter pat on top
    ctx.fillStyle = '#FFF9C4';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - layers * layerH - r * 0.05, r * 0.15, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Bakery building
    drawHouseIcon(ctx, cx, cy, size, tier, color, accent);
    return;
  }
  addHighlight(ctx, cx - r * 0.15, cy - r * 0.15, r * 0.4);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Droplet Icon ---
function drawDropletIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Droplet shape
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.8);
  ctx.bezierCurveTo(cx + r * 0.1, cy - r * 0.5, cx + r * 0.65, cy - r * 0.05, cx + r * 0.55, cy + r * 0.3);
  ctx.bezierCurveTo(cx + r * 0.45, cy + r * 0.75, cx + r * 0.1, cy + r * 0.85, cx, cy + r * 0.85);
  ctx.bezierCurveTo(cx - r * 0.1, cy + r * 0.85, cx - r * 0.45, cy + r * 0.75, cx - r * 0.55, cy + r * 0.3);
  ctx.bezierCurveTo(cx - r * 0.65, cy - r * 0.05, cx - r * 0.1, cy - r * 0.5, cx, cy - r * 0.8);
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.1, 0, cx, cy + r * 0.2, r * 0.8);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.3, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fill();
  // Inner ripple for higher tiers
  if (tier >= 3) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = size * 0.015;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.15, r * 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }
  addHighlight(ctx, cx - r * 0.15, cy - r * 0.25, r * 0.4);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Crown Icon ---
function drawCrownIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  const w = r * 0.8;
  const h = r * 0.65;
  const points = 3 + Math.min(Math.floor(tier / 2), 2);
  // Crown body
  ctx.beginPath();
  ctx.moveTo(cx - w, cy + h * 0.4);
  ctx.lineTo(cx - w, cy - h * 0.2);
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const px = cx - w + t * w * 2;
    const tipY = cy - h * (0.8 + (i % 2 === (points % 2) ? 0.2 : 0));
    if (i > 0) {
      const prevX = cx - w + ((i - 0.5) / (points - 1)) * w * 2;
      ctx.lineTo(prevX, cy - h * 0.1);
    }
    ctx.lineTo(px, tipY);
  }
  ctx.lineTo(cx + w, cy - h * 0.2);
  ctx.lineTo(cx + w, cy + h * 0.4);
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx, cy - h, cx, cy + h);
  grad.addColorStop(0, accent);
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darkenColor(color, 0.15));
  ctx.fillStyle = grad;
  ctx.fill();
  // Band at bottom
  ctx.fillStyle = darkenColor(color, 0.1);
  roundRect(ctx, cx - w, cy + h * 0.15, w * 2, h * 0.3, r * 0.05);
  ctx.fill();
  // Jewels on tips
  if (tier >= 3) {
    ctx.fillStyle = '#E53935';
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      const px = cx - w + t * w * 2;
      const tipY = cy - h * (0.8 + (i % 2 === (points % 2) ? 0.2 : 0));
      ctx.beginPath();
      ctx.arc(px, tipY + r * 0.08, r * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  addHighlight(ctx, cx - w * 0.3, cy - h * 0.3, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- House / Building Icon ---
function drawHouseIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  const w = r * 0.7;
  const h = r * 0.6;
  const roofH = r * 0.45;
  // Building body
  const bodyGrad = ctx.createLinearGradient(cx - w, cy, cx + w, cy);
  bodyGrad.addColorStop(0, accent);
  bodyGrad.addColorStop(1, color);
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, cx - w, cy - h * 0.1, w * 2, h + h * 0.5, r * 0.06);
  ctx.fill();
  // Roof
  const roofGrad = ctx.createLinearGradient(cx, cy - h - roofH, cx, cy - h * 0.1);
  roofGrad.addColorStop(0, darkenColor(color, 0.2));
  roofGrad.addColorStop(1, darkenColor(color, 0.1));
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.moveTo(cx - w * 1.15, cy - h * 0.1);
  ctx.lineTo(cx, cy - h * 0.1 - roofH);
  ctx.lineTo(cx + w * 1.15, cy - h * 0.1);
  ctx.closePath();
  ctx.fill();
  // Door
  ctx.fillStyle = darkenColor(color, 0.25);
  roundRect(ctx, cx - r * 0.12, cy + h * 0.05, r * 0.24, h * 0.4, r * 0.03);
  ctx.fill();
  // Windows
  ctx.fillStyle = '#FFF9C4';
  const winSize = r * 0.13;
  [-1, 1].forEach(dir => {
    roundRect(ctx, cx + dir * w * 0.5 - winSize, cy - h * 0.05 + winSize * 0.2, winSize * 2, winSize * 1.5, r * 0.02);
    ctx.fill();
  });
  // Chimney for higher tiers
  if (tier >= 4) {
    ctx.fillStyle = darkenColor(color, 0.15);
    roundRect(ctx, cx + w * 0.45, cy - h * 0.1 - roofH * 0.7, w * 0.25, roofH * 0.5, r * 0.02);
    ctx.fill();
    // Smoke
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(cx + w * 0.55, cy - h * 0.1 - roofH * 0.85, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.6, cy - h * 0.1 - roofH * 1.0, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Moon Icon ---
function drawMoonIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Outer glow
  const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.1);
  glowGrad.addColorStop(0, accent + '40');
  glowGrad.addColorStop(1, accent + '00');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2);
  ctx.fill();
  // Moon body
  const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r * 0.7);
  grad.addColorStop(0, '#FFFDE7');
  grad.addColorStop(0.5, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
  ctx.fill();
  // Crescent shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.arc(cx + r * 0.2, cy - r * 0.05, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Craters
  if (tier >= 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy + r * 0.15, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.05, cy - r * 0.2, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  addHighlight(ctx, cx - r * 0.2, cy - r * 0.25, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Rainbow Icon ---
function drawRainbowIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.38;
  const arcColors = ['#E53935', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'];
  const bandW = r * 0.12;
  for (let i = 0; i < arcColors.length; i++) {
    ctx.strokeStyle = arcColors[i];
    ctx.lineWidth = bandW;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.3, r * (0.7 - i * 0.08), Math.PI, 0);
    ctx.stroke();
  }
  // Clouds at base
  ctx.fillStyle = '#FFFFFF';
  [-1, 1].forEach(dir => {
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.65, cy + r * 0.3, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.55, cy + r * 0.2, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
  });
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Candy Icon ---
function drawCandyIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.35;
  if (tier <= 2) {
    // Wrapped candy
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.4);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // Wrapper twists
    [-1, 1].forEach(dir => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx + dir * r * 0.3, cy - r * 0.12);
      ctx.lineTo(cx + dir * r * 0.7, cy - r * 0.25);
      ctx.lineTo(cx + dir * r * 0.7, cy + r * 0.25);
      ctx.lineTo(cx + dir * r * 0.3, cy + r * 0.12);
      ctx.closePath();
      ctx.fill();
    });
    if (tier >= 2) {
      // Lollipop stick
      ctx.strokeStyle = '#BCAAA4';
      ctx.lineWidth = size * 0.035;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.35);
      ctx.lineTo(cx, cy + r * 0.9);
      ctx.stroke();
      // Swirl stripe
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = size * 0.025;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 1.5);
      ctx.stroke();
    }
  } else {
    // Donut / cookie shape
    const grad = ctx.createRadialGradient(cx, cy, r * 0.12, cx, cy, r * 0.55);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    // Hole or detail
    if (tier >= 5) {
      ctx.fillStyle = darkenColor(color, 0.15);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
    // Frosting drizzle
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = size * 0.025;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, -0.5, Math.PI + 0.5);
    ctx.stroke();
    // Sprinkles for higher tiers
    if (tier >= 4) {
      const sprinkleColors = ['#E53935', '#FFEB3B', '#4CAF50', '#2196F3'];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const sx = cx + Math.cos(a) * r * 0.35;
        const sy = cy + Math.sin(a) * r * 0.35;
        ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(a);
        roundRect(ctx, -size * 0.015, -size * 0.005, size * 0.03, size * 0.01, size * 0.003);
        ctx.fill();
        ctx.restore();
      }
    }
  }
  addHighlight(ctx, cx - r * 0.1, cy - r * 0.15, r * 0.35);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Egg Icon (for butterfly chain tier 1) ---
function drawEggIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.2, 0, cx, cy, r * 0.65);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.4, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.05, r * 0.4, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Speckles
  if (tier >= 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const d = r * (0.15 + Math.random() * 0.2);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  addHighlight(ctx, cx - r * 0.12, cy - r * 0.2, r * 0.4);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Letter / Envelope Icon (for love chain) ---
function drawLetterIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  const w = r * 0.7;
  const h = r * 0.5;
  // Envelope body
  const grad = ctx.createLinearGradient(cx - w, cy - h, cx + w, cy + h);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  roundRect(ctx, cx - w, cy - h * 0.6, w * 2, h * 1.5, r * 0.06);
  ctx.fill();
  // Flap
  ctx.fillStyle = darkenColor(color, 0.1);
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - h * 0.6);
  ctx.lineTo(cx, cy + h * 0.15);
  ctx.lineTo(cx + w, cy - h * 0.6);
  ctx.closePath();
  ctx.fill();
  // Heart seal
  if (tier >= 2) {
    ctx.fillStyle = '#E53935';
    const sx = cx, sy = cy - h * 0.05;
    const hr = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(sx, sy + hr * 0.6);
    ctx.bezierCurveTo(sx - hr * 0.1, sy + hr * 0.3, sx - hr * 0.7, sy + hr * 0.1, sx - hr * 0.6, sy - hr * 0.2);
    ctx.bezierCurveTo(sx - hr * 0.5, sy - hr * 0.55, sx - hr * 0.1, sy - hr * 0.6, sx, sy - hr * 0.3);
    ctx.bezierCurveTo(sx + hr * 0.1, sy - hr * 0.6, sx + hr * 0.5, sy - hr * 0.55, sx + hr * 0.6, sy - hr * 0.2);
    ctx.bezierCurveTo(sx + hr * 0.7, sy + hr * 0.1, sx + hr * 0.1, sy + hr * 0.3, sx, sy + hr * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  addHighlight(ctx, cx - w * 0.3, cy - h * 0.3, r * 0.4);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Fish Icon (for shell/ocean chain) ---
function drawFishIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Body
  const grad = ctx.createRadialGradient(cx - r * 0.1, cy, 0, cx, cy, r * 0.6);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.55, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.45, cy);
  ctx.lineTo(cx + r * 0.85, cy - r * 0.3);
  ctx.lineTo(cx + r * 0.85, cy + r * 0.3);
  ctx.closePath();
  ctx.fill();
  // Eye
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy - r * 0.05, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3D2B1F';
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy - r * 0.05, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  // Fin
  if (tier >= 3) {
    ctx.fillStyle = accent + '80';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.05, cy - r * 0.3, r * 0.18, r * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Scales pattern for higher tiers
  if (tier >= 4) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = size * 0.01;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + i * r * 0.15, cy, r * 0.15, Math.PI * 0.3, Math.PI * 0.7);
      ctx.stroke();
    }
  }
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Coral Icon ---
function drawCoralIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Branches
  const branches = 3 + Math.min(tier, 3);
  for (let i = 0; i < branches; i++) {
    const angle = -Math.PI / 2 + (i - (branches - 1) / 2) * 0.45;
    const len = r * (0.5 + (i % 2) * 0.15);
    const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    grad.addColorStop(0, color);
    grad.addColorStop(1, accent);
    ctx.strokeStyle = grad;
    ctx.lineWidth = size * (0.05 - i * 0.003);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.3);
    ctx.quadraticCurveTo(
      cx + Math.cos(angle) * len * 0.5 + (i % 2 ? 1 : -1) * r * 0.1,
      cy + Math.sin(angle) * len * 0.5,
      cx + Math.cos(angle) * len,
      cy + Math.sin(angle) * len
    );
    ctx.stroke();
    // Branch tip bulb
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }
  // Base
  ctx.fillStyle = darkenColor(color, 0.1);
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.4, r * 0.35, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Mermaid Icon (for shell chain final tier) ---
function drawMermaidIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Tail
  const tailGrad = ctx.createLinearGradient(cx, cy, cx, cy + r * 0.8);
  tailGrad.addColorStop(0, accent);
  tailGrad.addColorStop(1, color);
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.2, cy);
  ctx.quadraticCurveTo(cx - r * 0.25, cy + r * 0.5, cx - r * 0.35, cy + r * 0.7);
  ctx.lineTo(cx + r * 0.35, cy + r * 0.7);
  ctx.quadraticCurveTo(cx + r * 0.25, cy + r * 0.5, cx + r * 0.2, cy);
  ctx.closePath();
  ctx.fill();
  // Tail fin
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.75, r * 0.35, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = '#FFCCBC';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.15, r * 0.2, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hair
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.4, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.15, cy - r * 0.2, r * 0.08, r * 0.25, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.15, cy - r * 0.2, r * 0.08, r * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Crown/tiara for high tier
  if (tier >= 5) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.15, cy - r * 0.58);
    ctx.lineTo(cx - r * 0.08, cy - r * 0.72);
    ctx.lineTo(cx, cy - r * 0.62);
    ctx.lineTo(cx + r * 0.08, cy - r * 0.72);
    ctx.lineTo(cx + r * 0.15, cy - r * 0.58);
    ctx.closePath();
    ctx.fill();
  }
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Crab Icon ---
function drawCrabIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Body
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.45);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.05, r * 0.45, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // Claws
  [-1, 1].forEach(dir => {
    ctx.fillStyle = color;
    // Arm
    ctx.beginPath();
    ctx.moveTo(cx + dir * r * 0.4, cy);
    ctx.lineTo(cx + dir * r * 0.7, cy - r * 0.2);
    ctx.lineTo(cx + dir * r * 0.65, cy + r * 0.05);
    ctx.closePath();
    ctx.fill();
    // Pincer
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.72, cy - r * 0.22, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkenColor(color, 0.15);
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.72, cy - r * 0.22, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  });
  // Legs
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.02;
  for (let i = 0; i < 3; i++) {
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.moveTo(cx + dir * r * 0.35, cy + r * 0.15);
      ctx.lineTo(cx + dir * r * (0.55 + i * 0.08), cy + r * (0.35 + i * 0.08));
      ctx.stroke();
    });
  }
  // Eyes
  [-1, 1].forEach(dir => {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.15, cy - r * 0.25, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3D2B1F';
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.15, cy - r * 0.25, r * 0.035, 0, Math.PI * 2);
    ctx.fill();
  });
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Dolphin Icon ---
function drawDolphinIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  // Body
  const grad = ctx.createRadialGradient(cx - r * 0.1, cy - r * 0.1, 0, cx, cy, r * 0.7);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.6, cy + r * 0.1);
  ctx.bezierCurveTo(cx - r * 0.7, cy - r * 0.4, cx - r * 0.2, cy - r * 0.6, cx + r * 0.15, cy - r * 0.45);
  ctx.bezierCurveTo(cx + r * 0.4, cy - r * 0.35, cx + r * 0.65, cy - r * 0.1, cx + r * 0.55, cy + r * 0.15);
  ctx.bezierCurveTo(cx + r * 0.45, cy + r * 0.4, cx + r * 0.1, cy + r * 0.5, cx - r * 0.2, cy + r * 0.4);
  ctx.bezierCurveTo(cx - r * 0.45, cy + r * 0.35, cx - r * 0.55, cy + r * 0.25, cx - r * 0.6, cy + r * 0.1);
  ctx.closePath();
  ctx.fill();
  // Belly
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.1, r * 0.35, r * 0.15, -0.1, 0, Math.PI);
  ctx.fill();
  // Snout
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.55, cy, r * 0.12, r * 0.06, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Tail
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.55, cy + r * 0.05);
  ctx.quadraticCurveTo(cx - r * 0.8, cy - r * 0.2, cx - r * 0.85, cy - r * 0.35);
  ctx.quadraticCurveTo(cx - r * 0.65, cy - r * 0.05, cx - r * 0.55, cy + r * 0.05);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.55, cy + r * 0.15);
  ctx.quadraticCurveTo(cx - r * 0.8, cy + r * 0.35, cx - r * 0.85, cy + r * 0.45);
  ctx.quadraticCurveTo(cx - r * 0.65, cy + r * 0.2, cx - r * 0.55, cy + r * 0.15);
  ctx.fill();
  // Eye
  ctx.fillStyle = '#3D2B1F';
  ctx.beginPath();
  ctx.arc(cx + r * 0.25, cy - r * 0.15, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx + r * 0.24, cy - r * 0.17, r * 0.02, 0, Math.PI * 2);
  ctx.fill();
  // Dorsal fin
  ctx.fillStyle = darkenColor(color, 0.1);
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.35);
  ctx.quadraticCurveTo(cx + r * 0.05, cy - r * 0.65, cx + r * 0.2, cy - r * 0.55);
  ctx.quadraticCurveTo(cx + r * 0.15, cy - r * 0.35, cx + r * 0.15, cy - r * 0.25);
  ctx.closePath();
  ctx.fill();
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Castle Icon (for sweet chain final tier) ---
function drawCastleIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  const w = r * 0.7;
  const h = r * 0.8;
  // Main tower
  const grad = ctx.createLinearGradient(cx - w * 0.35, cy - h, cx + w * 0.35, cy + h * 0.5);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  roundRect(ctx, cx - w * 0.35, cy - h * 0.3, w * 0.7, h * 0.9, r * 0.04);
  ctx.fill();
  // Side towers
  [-1, 1].forEach(dir => {
    ctx.fillStyle = darkenColor(color, 0.05);
    roundRect(ctx, cx + dir * w * 0.5, cy - h * 0.15, w * 0.35, h * 0.75, r * 0.03);
    ctx.fill();
    // Turret top
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(cx + dir * w * 0.5, cy - h * 0.15);
    ctx.lineTo(cx + dir * w * 0.67, cy - h * 0.45);
    ctx.lineTo(cx + dir * w * 0.85, cy - h * 0.15);
    ctx.closePath();
    ctx.fill();
  });
  // Main turret
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.35, cy - h * 0.3);
  ctx.lineTo(cx, cy - h * 0.75);
  ctx.lineTo(cx + w * 0.35, cy - h * 0.3);
  ctx.closePath();
  ctx.fill();
  // Door
  ctx.fillStyle = darkenColor(color, 0.25);
  ctx.beginPath();
  ctx.arc(cx, cy + h * 0.3, w * 0.15, Math.PI, 0);
  ctx.lineTo(cx + w * 0.15, cy + h * 0.6);
  ctx.lineTo(cx - w * 0.15, cy + h * 0.6);
  ctx.closePath();
  ctx.fill();
  // Windows
  ctx.fillStyle = '#FFF9C4';
  ctx.beginPath();
  ctx.arc(cx, cy - h * 0.05, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // Flag
  if (tier >= 6) {
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = size * 0.015;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.75);
    ctx.lineTo(cx, cy - h * 1.0);
    ctx.stroke();
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 1.0);
    ctx.lineTo(cx + r * 0.15, cy - h * 0.92);
    ctx.lineTo(cx, cy - h * 0.84);
    ctx.closePath();
    ctx.fill();
  }
  addTierSparkles(ctx, cx, cy, r, tier);
}

// ============================================================
// ITEM ICON MAP -- maps every chainId + tier to a drawing fn
// ============================================================

interface IconConfig {
  draw: IconDrawFn;
  color: string;
  accent: string;
}

function getItemIconConfig(chainId: string, tier: number): IconConfig {
  const configs: Record<string, IconConfig[]> = {
    flower: [
      { draw: drawLeafIcon, color: '#4CAF50', accent: '#81C784' },           // t1 Seedling
      { draw: drawLeafIcon, color: '#66BB6A', accent: '#A5D6A7' },           // t2 Sprout
      { draw: drawLeafIcon, color: '#2E7D32', accent: '#66BB6A' },           // t3 Clover
      { draw: drawFlowerIcon, color: '#EC407A', accent: '#F48FB1' },         // t4 Tulip
      { draw: drawFlowerIcon, color: '#E91E63', accent: '#F06292' },         // t5 Rose
      { draw: drawFlowerIcon, color: '#F8BBD0', accent: '#FCE4EC' },         // t6 Cherry Blossom
      { draw: drawFlowerIcon, color: '#E91E63', accent: '#FF5252' },         // t7 Hibiscus
      { draw: drawFlowerIcon, color: '#AD1457', accent: '#EC407A' },         // t8 Bouquet
    ],
    butterfly: [
      { draw: drawEggIcon, color: '#BCAAA4', accent: '#EFEBE9' },            // t1 Egg
      { draw: drawLeafIcon, color: '#8BC34A', accent: '#C5E1A5' },           // t2 Caterpillar (worm-like leaf)
      { draw: drawButterflyIcon, color: '#FFC107', accent: '#FFECB3' },      // t3 Bee
      { draw: drawButterflyIcon, color: '#F44336', accent: '#EF5350' },      // t4 Ladybug
      { draw: drawButterflyIcon, color: '#7C4DFF', accent: '#B388FF' },      // t5 Butterfly
      { draw: drawButterflyIcon, color: '#00BCD4', accent: '#4DD0E1' },      // t6 Peacock
    ],
    fruit: [
      { draw: drawFruitIcon, color: '#7B1FA2', accent: '#CE93D8' },          // t1 Grapes
      { draw: drawFruitIcon, color: '#F44336', accent: '#EF9A9A' },          // t2 Apple
      { draw: drawFruitIcon, color: '#FF9800', accent: '#FFCC80' },          // t3 Orange
      { draw: drawFruitIcon, color: '#8BC34A', accent: '#C5E1A5' },          // t4 Kiwi
      { draw: drawFruitIcon, color: '#FF9800', accent: '#FFE0B2' },          // t5 Mango
      { draw: drawFruitIcon, color: '#FF8A65', accent: '#FFCCBC' },          // t6 Peach
      { draw: drawCakeIcon, color: '#F48FB1', accent: '#FCE4EC' },           // t7 Cake
    ],
    crystal: [
      { draw: drawDropletIcon, color: '#42A5F5', accent: '#BBDEFB' },        // t1 Droplet
      { draw: drawCrystalIcon, color: '#B3E5FC', accent: '#E1F5FE' },        // t2 Ice
      { draw: drawCrystalIcon, color: '#9C27B0', accent: '#CE93D8' },        // t3 Crystal Ball
      { draw: drawCrystalIcon, color: '#00BCD4', accent: '#B2EBF2' },        // t4 Diamond
      { draw: drawCrownIcon, color: '#FFD700', accent: '#FFF9C4' },          // t5 Crown
    ],
    nature: [
      { draw: drawLeafIcon, color: '#8D6E63', accent: '#D7CCC8' },           // t1 Leaf
      { draw: drawLeafIcon, color: '#E65100', accent: '#FF8A65' },           // t2 Maple Leaf
      { draw: drawLeafIcon, color: '#2E7D32', accent: '#4CAF50' },           // t3 Pine
      { draw: drawLeafIcon, color: '#388E3C', accent: '#66BB6A' },           // t4 Tree
      { draw: drawLeafIcon, color: '#43A047', accent: '#81C784' },           // t5 Palm
      { draw: drawHouseIcon, color: '#8D6E63', accent: '#D7CCC8' },          // t6 Cottage
    ],
    star: [
      { draw: drawStarIcon, color: '#FFD54F', accent: '#FFF9C4' },           // t1 Star
      { draw: drawStarIcon, color: '#FFD700', accent: '#FFECB3' },           // t2 Glowing Star
      { draw: drawStarIcon, color: '#FFC107', accent: '#FFF8E1' },           // t3 Sparkles
      { draw: drawStarIcon, color: '#FF9800', accent: '#FFE0B2' },           // t4 Shooting Star
      { draw: drawMoonIcon, color: '#FDD835', accent: '#FFF9C4' },           // t5 Moon
      { draw: drawRainbowIcon, color: '#FF5252', accent: '#FFCDD2' },        // t6 Rainbow
    ],
    tea: [
      { draw: drawLeafIcon, color: '#689F38', accent: '#AED581' },           // t1 Tea Leaf
      { draw: drawCupIcon, color: '#689F38', accent: '#C5E1A5' },            // t2 Matcha
      { draw: drawCupIcon, color: '#795548', accent: '#D7CCC8' },            // t3 Coffee
      { draw: drawCupIcon, color: '#8D6E63', accent: '#BCAAA4' },            // t4 Boba Tea
      { draw: drawCakeIcon, color: '#F8BBD0', accent: '#FCE4EC' },           // t5 Cake Slice
      { draw: drawCupIcon, color: '#A1887F', accent: '#D7CCC8' },            // t6 Tea Set
      { draw: drawHouseIcon, color: '#8D6E63', accent: '#BCAAA4' },          // t7 Tea House
    ],
    shell: [
      { draw: drawCoralIcon, color: '#EF5350', accent: '#FFCDD2' },          // t1 Coral
      { draw: drawShellIcon, color: '#FFAB91', accent: '#FBE9E7' },          // t2 Shell
      { draw: drawCrabIcon, color: '#E53935', accent: '#EF9A9A' },           // t3 Crab
      { draw: drawFishIcon, color: '#29B6F6', accent: '#B3E5FC' },           // t4 Tropical Fish
      { draw: drawDolphinIcon, color: '#42A5F5', accent: '#90CAF9' },        // t5 Dolphin
      { draw: drawMermaidIcon, color: '#26C6DA', accent: '#80DEEA' },        // t6 Mermaid
    ],
    sweet: [
      { draw: drawCandyIcon, color: '#E91E63', accent: '#F48FB1' },          // t1 Candy
      { draw: drawCandyIcon, color: '#E91E63', accent: '#F8BBD0' },          // t2 Lollipop
      { draw: drawCandyIcon, color: '#8D6E63', accent: '#D7CCC8' },          // t3 Cookie
      { draw: drawCakeIcon, color: '#F06292', accent: '#F8BBD0' },           // t4 Cupcake
      { draw: drawCandyIcon, color: '#F48FB1', accent: '#FCE4EC' },          // t5 Donut
      { draw: drawCandyIcon, color: '#795548', accent: '#A1887F' },          // t6 Chocolate
      { draw: drawCakeIcon, color: '#F8BBD0', accent: '#FCE4EC' },           // t7 Birthday Cake
      { draw: drawCastleIcon, color: '#F8BBD0', accent: '#FCE4EC' },         // t8 Candy Castle
    ],
    love: [
      { draw: drawLetterIcon, color: '#F48FB1', accent: '#FCE4EC' },         // t1 Love Note
      { draw: drawHeartIcon, color: '#EC407A', accent: '#F48FB1' },          // t2 Growing Heart
      { draw: drawHeartIcon, color: '#E91E63', accent: '#F06292' },          // t3 Sparkling Heart
      { draw: drawHeartIcon, color: '#D81B60', accent: '#EC407A' },          // t4 Gift Heart
      { draw: drawHeartIcon, color: '#C2185B', accent: '#E91E63' },          // t5 Twin Hearts
      { draw: drawHeartIcon, color: '#AD1457', accent: '#D81B60' },          // t6 Eternal Love
    ],
    cosmic: [
      { draw: drawCosmicIcon, color: '#78909C', accent: '#B0BEC5' },         // t1 Space Rock
      { draw: drawCosmicIcon, color: '#7C4DFF', accent: '#B388FF' },         // t2 Comet
      { draw: drawCosmicIcon, color: '#7C4DFF', accent: '#B388FF' },         // t3 UFO
      { draw: drawCosmicIcon, color: '#42A5F5', accent: '#90CAF9' },         // t4 Earth
      { draw: drawCosmicIcon, color: '#FFB74D', accent: '#FFE0B2' },         // t5 Saturn
      { draw: drawCosmicIcon, color: '#7C4DFF', accent: '#D1C4E9' },         // t6 Nebula
      { draw: drawCosmicIcon, color: '#EF5350', accent: '#FFCDD2' },         // t7 Rocket Ship
    ],
    cafe: [
      { draw: drawCoffeeIcon, color: '#6D4C41', accent: '#A1887F' },         // t1 Coffee Bean
      { draw: drawCoffeeIcon, color: '#795548', accent: '#D7CCC8' },         // t2 Espresso
      { draw: drawCoffeeIcon, color: '#FFB74D', accent: '#FFE0B2' },         // t3 Croissant
      { draw: drawCoffeeIcon, color: '#FFB74D', accent: '#FFF3E0' },         // t4 Waffle
      { draw: drawCoffeeIcon, color: '#FFCC80', accent: '#FFF8E1' },         // t5 Pancake Stack
      { draw: drawCakeIcon, color: '#F8BBD0', accent: '#FCE4EC' },           // t6 Layer Cake
      { draw: drawHouseIcon, color: '#A1887F', accent: '#D7CCC8' },          // t7 Bakery
    ],
  };

  const chainConfigs = configs[chainId];
  if (chainConfigs && tier >= 1 && tier <= chainConfigs.length) {
    return chainConfigs[tier - 1];
  }
  // Fallback
  return { draw: drawStarIcon, color: '#E0E0E0', accent: '#F5F5F5' };
}

// ============================================================
// GENERATOR SOURCE ICON DRAWING FUNCTIONS
// Each generator looks like a "source" object (pot, nest, basket)
// ============================================================

function drawFlowerPotIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  // Pot body (trapezoid)
  const topW = r * 0.55;
  const botW = r * 0.4;
  const potH = r * 0.65;
  const potY = cy + r * 0.15;
  const potGrad = ctx.createLinearGradient(cx - topW, potY, cx + topW, potY + potH);
  potGrad.addColorStop(0, '#D2691E');
  potGrad.addColorStop(0.5, '#A0522D');
  potGrad.addColorStop(1, '#8B4513');
  ctx.fillStyle = potGrad;
  ctx.beginPath();
  ctx.moveTo(cx - topW, potY);
  ctx.lineTo(cx + topW, potY);
  ctx.lineTo(cx + botW, potY + potH);
  ctx.lineTo(cx - botW, potY + potH);
  ctx.closePath();
  ctx.fill();
  // Pot rim
  ctx.fillStyle = '#D2691E';
  ctx.beginPath();
  ctx.ellipse(cx, potY, topW * 1.1, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dirt
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.ellipse(cx, potY + r * 0.05, topW * 0.85, r * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sprout growing from pot
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, potY);
  ctx.quadraticCurveTo(cx + r * 0.1, potY - r * 0.4, cx - r * 0.05, potY - r * 0.6);
  ctx.stroke();
  // Leaf
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.05, potY - r * 0.6, r * 0.18, r * 0.08, -0.5, 0, Math.PI * 2);
  ctx.fill();
  if (tier >= 3) {
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.12, potY - r * 0.4, r * 0.14, r * 0.06, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  addHighlight(ctx, cx - topW * 0.3, potY + potH * 0.2, r * 0.3);
}

function drawNestIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  // Nest body (woven basket shape)
  const nestGrad = ctx.createRadialGradient(cx, cy + r * 0.2, 0, cx, cy + r * 0.2, r * 0.7);
  nestGrad.addColorStop(0, '#D7CCC8');
  nestGrad.addColorStop(0.5, '#A1887F');
  nestGrad.addColorStop(1, '#795548');
  ctx.fillStyle = nestGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.2, r * 0.7, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nest front lip
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.72, r * 0.2, 0, 0, Math.PI);
  ctx.fill();
  // Weave lines
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = size * 0.015;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * (0.1 + i * 0.08), r * (0.65 - i * 0.04), r * 0.04, 0, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // Small eggs in nest
  const eggColors = [accent, color, '#FFFFFF'];
  const eggCount = Math.min(tier, 3);
  for (let i = 0; i < eggCount; i++) {
    const ex = cx + (i - (eggCount - 1) / 2) * r * 0.25;
    const ey = cy - r * 0.05;
    ctx.fillStyle = eggColors[i % eggColors.length];
    ctx.beginPath();
    ctx.ellipse(ex, ey, r * 0.1, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    addHighlight(ctx, ex - r * 0.03, ey - r * 0.05, r * 0.08);
  }
}

function drawBasketIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  // Basket body
  const basketGrad = ctx.createLinearGradient(cx - r * 0.6, cy, cx + r * 0.6, cy + r * 0.5);
  basketGrad.addColorStop(0, '#FFE0B2');
  basketGrad.addColorStop(0.5, '#FFCC80');
  basketGrad.addColorStop(1, '#FFA726');
  ctx.fillStyle = basketGrad;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.65, cy - r * 0.1);
  ctx.lineTo(cx + r * 0.65, cy - r * 0.1);
  ctx.lineTo(cx + r * 0.5, cy + r * 0.55);
  ctx.quadraticCurveTo(cx, cy + r * 0.65, cx - r * 0.5, cy + r * 0.55);
  ctx.closePath();
  ctx.fill();
  // Handle
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = size * 0.035;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.1, r * 0.5, Math.PI + 0.3, -0.3);
  ctx.stroke();
  // Weave pattern
  ctx.strokeStyle = 'rgba(139,69,19,0.25)';
  ctx.lineWidth = size * 0.012;
  for (let i = 0; i < 3; i++) {
    const ly = cy + r * (0.05 + i * 0.15);
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, ly);
    ctx.lineTo(cx + r * 0.6, ly);
    ctx.stroke();
  }
  // Small items peeking out
  const itemGrad = ctx.createRadialGradient(cx, cy - r * 0.2, 0, cx, cy - r * 0.2, r * 0.2);
  itemGrad.addColorStop(0, accent);
  itemGrad.addColorStop(1, color);
  ctx.fillStyle = itemGrad;
  ctx.beginPath();
  ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.15, cy - r * 0.18, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  addHighlight(ctx, cx - r * 0.3, cy + r * 0.1, r * 0.3);
}

function drawCauldronIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  // Cauldron body
  const cauldGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.1, 0, cx, cy + r * 0.1, r * 0.6);
  cauldGrad.addColorStop(0, '#546E7A');
  cauldGrad.addColorStop(0.6, '#37474F');
  cauldGrad.addColorStop(1, '#263238');
  ctx.fillStyle = cauldGrad;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.6, cy - r * 0.2);
  ctx.bezierCurveTo(cx - r * 0.65, cy + r * 0.3, cx - r * 0.5, cy + r * 0.6, cx, cy + r * 0.65);
  ctx.bezierCurveTo(cx + r * 0.5, cy + r * 0.6, cx + r * 0.65, cy + r * 0.3, cx + r * 0.6, cy - r * 0.2);
  ctx.closePath();
  ctx.fill();
  // Rim
  ctx.fillStyle = '#455A64';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.2, r * 0.65, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Glowing liquid inside
  const liqGrad = ctx.createRadialGradient(cx, cy - r * 0.15, 0, cx, cy - r * 0.15, r * 0.45);
  liqGrad.addColorStop(0, accent);
  liqGrad.addColorStop(0.6, color);
  liqGrad.addColorStop(1, color + '60');
  ctx.fillStyle = liqGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.15, r * 0.5, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bubble highlights
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.15, cy - r * 0.3, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.1, cy - r * 0.35, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  // Feet
  [-1, 0, 1].forEach(d => {
    ctx.fillStyle = '#37474F';
    ctx.beginPath();
    ctx.ellipse(cx + d * r * 0.35, cy + r * 0.65, r * 0.07, r * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  addHighlight(ctx, cx - r * 0.25, cy - r * 0.05, r * 0.4);
}

function drawTreasureChestIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  const w = r * 0.65;
  const h = r * 0.45;
  // Chest body
  const chestGrad = ctx.createLinearGradient(cx - w, cy, cx + w, cy + h);
  chestGrad.addColorStop(0, '#8D6E63');
  chestGrad.addColorStop(0.5, '#6D4C41');
  chestGrad.addColorStop(1, '#4E342E');
  ctx.fillStyle = chestGrad;
  roundRect(ctx, cx - w, cy - h * 0.2, w * 2, h * 1.2, r * 0.06);
  ctx.fill();
  // Lid (curved top)
  ctx.fillStyle = '#795548';
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - h * 0.2);
  ctx.bezierCurveTo(cx - w, cy - h * 0.8, cx + w, cy - h * 0.8, cx + w, cy - h * 0.2);
  ctx.closePath();
  ctx.fill();
  // Metal bands
  ctx.fillStyle = accent;
  roundRect(ctx, cx - w - r * 0.02, cy - h * 0.3, w * 2 + r * 0.04, h * 0.12, r * 0.02);
  ctx.fill();
  roundRect(ctx, cx - w - r * 0.02, cy + h * 0.4, w * 2 + r * 0.04, h * 0.12, r * 0.02);
  ctx.fill();
  // Lock/clasp
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, cy - h * 0.25, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // Glow from inside (ajar for higher tiers)
  if (tier >= 2) {
    const glowGrad = ctx.createRadialGradient(cx, cy - h * 0.5, 0, cx, cy - h * 0.3, r * 0.4);
    glowGrad.addColorStop(0, accent + '80');
    glowGrad.addColorStop(1, accent + '00');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.35, r * 0.4, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  addHighlight(ctx, cx - w * 0.4, cy - h * 0.5, r * 0.35);
}

function drawTeapotIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  // Pot body
  const potGrad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.1, 0, cx, cy + r * 0.1, r * 0.55);
  potGrad.addColorStop(0, '#FFFFFF');
  potGrad.addColorStop(0.3, accent);
  potGrad.addColorStop(1, color);
  ctx.fillStyle = potGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.1, r * 0.55, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lid
  ctx.fillStyle = darkenColor(color, 0.1);
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.3, r * 0.35, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lid knob
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.4, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  // Spout
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.5, cy);
  ctx.quadraticCurveTo(cx + r * 0.8, cy - r * 0.15, cx + r * 0.75, cy - r * 0.35);
  ctx.stroke();
  // Handle
  ctx.strokeStyle = darkenColor(color, 0.15);
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.arc(cx - r * 0.55, cy + r * 0.05, r * 0.22, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
  // Steam
  if (tier >= 2) {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = size * 0.02;
    for (let i = 0; i < 2; i++) {
      const sx = cx + (i - 0.5) * r * 0.2;
      ctx.beginPath();
      ctx.moveTo(sx, cy - r * 0.45);
      ctx.quadraticCurveTo(sx + r * 0.08, cy - r * 0.65, sx - r * 0.05, cy - r * 0.8);
      ctx.stroke();
    }
  }
  addHighlight(ctx, cx - r * 0.2, cy - r * 0.1, r * 0.35);
}

function drawSeashellBoxIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  // Large open clam shell (bottom half)
  const shellGrad = ctx.createRadialGradient(cx, cy + r * 0.2, 0, cx, cy + r * 0.2, r * 0.7);
  shellGrad.addColorStop(0, '#FFFFFF');
  shellGrad.addColorStop(0.3, accent);
  shellGrad.addColorStop(1, color);
  ctx.fillStyle = shellGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.15, r * 0.7, r * 0.35, 0, 0, Math.PI);
  ctx.fill();
  // Shell ridges on bottom half
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = size * 0.012;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.5, r * (0.15 * i), Math.PI + 0.4, -0.4);
    ctx.stroke();
  }
  // Upper shell (open, angled back)
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.65, cy + r * 0.15);
  ctx.bezierCurveTo(cx - r * 0.7, cy - r * 0.5, cx + r * 0.7, cy - r * 0.5, cx + r * 0.65, cy + r * 0.15);
  ctx.bezierCurveTo(cx + r * 0.4, cy - r * 0.15, cx - r * 0.4, cy - r * 0.15, cx - r * 0.65, cy + r * 0.15);
  ctx.fill();
  // Pearl inside
  const pearlGrad = ctx.createRadialGradient(cx - r * 0.05, cy + r * 0.05, 0, cx, cy + r * 0.1, r * 0.12);
  pearlGrad.addColorStop(0, '#FFFFFF');
  pearlGrad.addColorStop(0.5, '#F8BBD0');
  pearlGrad.addColorStop(1, '#E0E0E0');
  ctx.fillStyle = pearlGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  addHighlight(ctx, cx - r * 0.15, cy - r * 0.2, r * 0.4);
}

function drawGiftBoxIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  const w = r * 0.55;
  const h = r * 0.5;
  // Box body
  const boxGrad = ctx.createLinearGradient(cx - w, cy - h * 0.2, cx + w, cy + h);
  boxGrad.addColorStop(0, accent);
  boxGrad.addColorStop(1, color);
  ctx.fillStyle = boxGrad;
  roundRect(ctx, cx - w, cy - h * 0.2, w * 2, h * 1.2, r * 0.05);
  ctx.fill();
  // Lid
  ctx.fillStyle = darkenColor(color, 0.08);
  roundRect(ctx, cx - w * 1.05, cy - h * 0.45, w * 2.1, h * 0.3, r * 0.04);
  ctx.fill();
  // Ribbon vertical
  ctx.fillStyle = accent;
  ctx.fillRect(cx - r * 0.05, cy - h * 0.45, r * 0.1, h * 1.65);
  // Ribbon horizontal
  ctx.fillRect(cx - w, cy + h * 0.2, w * 2, r * 0.08);
  // Bow
  ctx.fillStyle = accent;
  [-1, 1].forEach(dir => {
    ctx.beginPath();
    ctx.ellipse(cx + dir * r * 0.15, cy - h * 0.5, r * 0.15, r * 0.08, dir * 0.3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.beginPath();
  ctx.arc(cx, cy - h * 0.5, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  // Glow from inside for higher tiers
  if (tier >= 3) {
    const glowGrad = ctx.createRadialGradient(cx, cy - h * 0.35, 0, cx, cy - h * 0.2, r * 0.3);
    glowGrad.addColorStop(0, '#FFD70080');
    glowGrad.addColorStop(1, '#FFD70000');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.3, r * 0.3, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  addHighlight(ctx, cx - w * 0.3, cy - h * 0.3, r * 0.3);
}

function drawPortalIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  // Outer ring
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.stroke();
  // Inner swirl
  const swirlGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.55);
  swirlGrad.addColorStop(0, '#FFFFFF');
  swirlGrad.addColorStop(0.3, accent);
  swirlGrad.addColorStop(0.7, color);
  swirlGrad.addColorStop(1, darkenColor(color, 0.2));
  ctx.fillStyle = swirlGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // Spiral lines
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = size * 0.015;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const startAngle = (i / 3) * Math.PI * 2;
    for (let t = 0; t < 20; t++) {
      const a = startAngle + t * 0.3;
      const d = r * (0.08 + t * 0.022);
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Star sparkles around rim
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 4;
    const sx = cx + Math.cos(angle) * r * 0.65;
    const sy = cy + Math.sin(angle) * r * 0.65;
    const sr = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(sx, sy - sr * 2);
    ctx.quadraticCurveTo(sx + sr * 0.3, sy - sr * 0.3, sx + sr * 2, sy);
    ctx.quadraticCurveTo(sx + sr * 0.3, sy + sr * 0.3, sx, sy + sr * 2);
    ctx.quadraticCurveTo(sx - sr * 0.3, sy + sr * 0.3, sx - sr * 2, sy);
    ctx.quadraticCurveTo(sx - sr * 0.3, sy - sr * 0.3, sx, sy - sr * 2);
    ctx.fill();
  }
}

function drawCoffeeMachineIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  const w = r * 0.5;
  const h = r * 0.7;
  // Machine body
  const machGrad = ctx.createLinearGradient(cx - w, cy - h, cx + w, cy + h * 0.3);
  machGrad.addColorStop(0, accent);
  machGrad.addColorStop(0.5, color);
  machGrad.addColorStop(1, darkenColor(color, 0.15));
  ctx.fillStyle = machGrad;
  roundRect(ctx, cx - w, cy - h * 0.6, w * 2, h * 1.2, r * 0.08);
  ctx.fill();
  // Top tank
  ctx.fillStyle = darkenColor(color, 0.1);
  roundRect(ctx, cx - w * 0.8, cy - h * 0.85, w * 1.6, h * 0.3, r * 0.05);
  ctx.fill();
  // Spout
  ctx.fillStyle = '#455A64';
  ctx.fillRect(cx - r * 0.06, cy + h * 0.2, r * 0.12, h * 0.25);
  // Cup underneath
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.2, cy + h * 0.45);
  ctx.lineTo(cx + r * 0.2, cy + h * 0.45);
  ctx.lineTo(cx + r * 0.15, cy + h * 0.65);
  ctx.lineTo(cx - r * 0.15, cy + h * 0.65);
  ctx.closePath();
  ctx.fill();
  // Drip
  if (tier >= 2) {
    ctx.fillStyle = '#6D4C41';
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.4, r * 0.03, r * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Button
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx + w * 0.5, cy - h * 0.1, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  addHighlight(ctx, cx - w * 0.3, cy - h * 0.4, r * 0.3);
}

/** Map chains to generator source-object icons */
function getGeneratorIconConfig(chainId: string, genTier: number): IconConfig {
  const configs: Record<string, IconConfig> = {
    flower:    { draw: drawFlowerPotIcon, color: '#8D6E63', accent: '#4CAF50' },
    butterfly: { draw: drawNestIcon, color: '#795548', accent: '#B3E5FC' },
    fruit:     { draw: drawBasketIcon, color: '#FFA726', accent: '#FF7043' },
    crystal:   { draw: drawCauldronIcon, color: '#37474F', accent: '#B39DDB' },
    nature:    { draw: drawFlowerPotIcon, color: '#6D4C41', accent: '#66BB6A' },
    star:      { draw: drawTreasureChestIcon, color: '#5D4037', accent: '#FFD700' },
    tea:       { draw: drawTeapotIcon, color: '#8D6E63', accent: '#A5D6A7' },
    shell:     { draw: drawSeashellBoxIcon, color: '#80DEEA', accent: '#B2EBF2' },
    sweet:     { draw: drawGiftBoxIcon, color: '#F06292', accent: '#F8BBD0' },
    love:      { draw: drawGiftBoxIcon, color: '#FF6B8A', accent: '#FFB3C6' },
    cosmic:    { draw: drawPortalIcon, color: '#7C4DFF', accent: '#B388FF' },
    cafe:      { draw: drawCoffeeMachineIcon, color: '#6D4C41', accent: '#A1887F' },
  };
  return configs[chainId] || { draw: drawBasketIcon, color: '#E0E0E0', accent: '#F5F5F5' };
}

// ============================================================
// UI ICON DRAWING FUNCTIONS (gem, star, sparkle)
// ============================================================

function drawUIGem(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const r = size * 0.32;
  // Contact shadow beneath gem
  drawContactShadow(ctx, cx, cy, r, cy + r * 0.7);

  // Glow (directional, offset upper-left)
  const glowGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.2, cx, cy, r * 1.2);
  glowGrad.addColorStop(0, 'rgba(156,39,176,0.25)');
  glowGrad.addColorStop(1, 'rgba(156,39,176,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Gem shape path (reused for clipping)
  const drawGemPath = () => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.95);
    ctx.lineTo(cx + r * 0.65, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.5, cy + r * 0.85);
    ctx.lineTo(cx - r * 0.5, cy + r * 0.85);
    ctx.lineTo(cx - r * 0.65, cy - r * 0.2);
    ctx.closePath();
  };

  // Gem fill with directional gradient (light from upper-left)
  drawGemPath();
  const grad = ctx.createRadialGradient(
    cx - r * 0.35, cy - r * 0.35, r * 0.05,
    cx, cy, r * 1.1
  );
  grad.addColorStop(0, '#E1BEE7');
  grad.addColorStop(0.25, '#CE93D8');
  grad.addColorStop(0.5, '#AB47BC');
  grad.addColorStop(0.8, '#7B1FA2');
  grad.addColorStop(1, '#4A148C');
  ctx.fillStyle = grad;
  ctx.fill();

  // Warm ambient overlay (clipped to gem)
  ctx.save();
  drawGemPath();
  ctx.clip();
  drawWarmAmbient(ctx, cx, cy, r);
  ctx.restore();

  // Facet lines
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.95);
  ctx.lineTo(cx, cy + r * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.65, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.5, cy + r * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.65, cy - r * 0.2);
  ctx.lineTo(cx - r * 0.5, cy + r * 0.85);
  ctx.stroke();

  // Top facet highlight (directional)
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.95);
  ctx.lineTo(cx - r * 0.2, cy - r * 0.15);
  ctx.lineTo(cx + r * 0.2, cy - r * 0.15);
  ctx.closePath();
  ctx.fill();

  // Rim light on shadow side (lower-right edge)
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.5, cy + r * 0.85);
  ctx.lineTo(cx + r * 0.65, cy - r * 0.2);
  ctx.stroke();
  ctx.restore();

  // Two-part specular highlight
  drawSpecularHighlight(ctx, cx, cy, r, 0.8);
}

function drawUIStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const r = size * 0.3;
  // Contact shadow
  drawContactShadow(ctx, cx, cy, r, cy + r * 0.8);

  // Glow (directional, offset upper-left)
  const glowGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.2, cx, cy, r * 1.3);
  glowGrad.addColorStop(0, 'rgba(255,215,0,0.3)');
  glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Star path helper
  const drawStarPath = () => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r : r * 0.4;
      const x = cx + Math.cos(angle) * rad;
      const y = cy + Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  // Star fill with directional gradient (upper-left light)
  drawStarPath();
  const grad = ctx.createRadialGradient(
    cx - r * 0.35, cy - r * 0.35, r * 0.05,
    cx, cy, r
  );
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.2, '#FFF9C4');
  grad.addColorStop(0.5, '#FFD700');
  grad.addColorStop(0.85, '#FFA000');
  grad.addColorStop(1.0, darkenColor('#FFA000', 0.12));
  ctx.fillStyle = grad;
  ctx.fill();

  // Warm ambient overlay (clipped to star)
  ctx.save();
  drawStarPath();
  ctx.clip();
  drawWarmAmbient(ctx, cx, cy, r);
  ctx.restore();

  // Rim light on lower-right
  drawGradientRimLight(ctx, cx, cy, r);

  // Two-part specular highlight
  drawSpecularHighlight(ctx, cx, cy, r, 0.75);
}

function drawUISparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const r = size * 0.3;
  // Glow (directional, offset upper-left)
  const glowGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r * 1.3);
  glowGrad.addColorStop(0, 'rgba(255,235,59,0.35)');
  glowGrad.addColorStop(1, 'rgba(255,235,59,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Main 4-point star with directional gradient
  const grad = ctx.createRadialGradient(
    cx - r * 0.3, cy - r * 0.3, r * 0.05,
    cx, cy, r
  );
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.3, '#FFF9C4');
  grad.addColorStop(0.7, '#FFD700');
  grad.addColorStop(1, darkenColor('#FFD700', 0.1));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.0);
  ctx.quadraticCurveTo(cx + r * 0.15, cy - r * 0.15, cx + r * 1.0, cy);
  ctx.quadraticCurveTo(cx + r * 0.15, cy + r * 0.15, cx, cy + r * 1.0);
  ctx.quadraticCurveTo(cx - r * 0.15, cy + r * 0.15, cx - r * 1.0, cy);
  ctx.quadraticCurveTo(cx - r * 0.15, cy - r * 0.15, cx, cy - r * 1.0);
  ctx.fill();

  // Warm ambient overlay (clipped to sparkle shape)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.0);
  ctx.quadraticCurveTo(cx + r * 0.15, cy - r * 0.15, cx + r * 1.0, cy);
  ctx.quadraticCurveTo(cx + r * 0.15, cy + r * 0.15, cx, cy + r * 1.0);
  ctx.quadraticCurveTo(cx - r * 0.15, cy + r * 0.15, cx - r * 1.0, cy);
  ctx.quadraticCurveTo(cx - r * 0.15, cy - r * 0.15, cx, cy - r * 1.0);
  ctx.clip();
  drawWarmAmbient(ctx, cx, cy, r);
  ctx.restore();

  // Smaller rotated star overlay
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.6);
  ctx.quadraticCurveTo(r * 0.08, -r * 0.08, r * 0.6, 0);
  ctx.quadraticCurveTo(r * 0.08, r * 0.08, 0, r * 0.6);
  ctx.quadraticCurveTo(-r * 0.08, r * 0.08, -r * 0.6, 0);
  ctx.quadraticCurveTo(-r * 0.08, -r * 0.08, 0, -r * 0.6);
  ctx.fill();
  ctx.restore();

  // Two-part specular highlight
  drawSpecularHighlight(ctx, cx, cy, r * 0.7, 0.7);
}

// ============================================================
// UTILITY: darken a hex color string
// ============================================================

function darkenColor(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================================
// VOLUMETRIC 3D RENDERING HELPERS
// All techniques use upper-left (~10 o'clock) light direction.
// Generated once at preload, not per-frame.
// ============================================================

/** Gradient contact shadow beneath an object (replaces flat fill) */
function drawContactShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  objectRadius: number,
  surfaceY: number
): void {
  const shadowW = objectRadius * 1.1;
  const shadowH = objectRadius * 0.18;
  const shadowY = surfaceY + objectRadius * 0.05;

  const grad = ctx.createRadialGradient(cx, shadowY, 0, cx, shadowY, shadowW);
  grad.addColorStop(0, 'rgba(0,0,0,0.12)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Gradient rim light on shadow side (lower-right) for volumetric pop */
function drawGradientRimLight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  const rimGrad = ctx.createLinearGradient(
    cx + radius * 0.5, cy + radius * 0.3,
    cx - radius * 0.3, cy + radius * 0.8
  );
  rimGrad.addColorStop(0, 'rgba(255,255,255,0)');
  rimGrad.addColorStop(0.3, 'rgba(255,255,255,0.4)');
  rimGrad.addColorStop(0.7, 'rgba(255,255,255,0.3)');
  rimGrad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = radius * 0.06;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.92, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.restore();
}

/** Two-part specular highlight: large diffuse + small sharp (upper-left) */
function drawSpecularHighlight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  intensity: number = 0.7
): void {
  ctx.save();
  // Primary highlight: larger, softer
  ctx.fillStyle = `rgba(255,255,255,${intensity * 0.6})`;
  ctx.beginPath();
  ctx.ellipse(
    cx - radius * 0.25,
    cy - radius * 0.30,
    radius * 0.22,
    radius * 0.15,
    -0.4,
    0, Math.PI * 2
  );
  ctx.fill();

  // Secondary highlight: smaller, brighter, sharper
  ctx.fillStyle = `rgba(255,255,255,${intensity * 0.9})`;
  ctx.beginPath();
  ctx.ellipse(
    cx - radius * 0.18,
    cy - radius * 0.22,
    radius * 0.08,
    radius * 0.06,
    -0.3,
    0, Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
}

/** Warm ambient light overlay (Gossip Harbor golden-hour trick) */
function drawWarmAmbient(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  const warmGrad = ctx.createRadialGradient(
    cx - radius * 0.4, cy - radius * 0.4, 0,
    cx, cy, radius * 1.2
  );
  warmGrad.addColorStop(0, 'rgba(255,220,150,0.08)');
  warmGrad.addColorStop(0.5, 'rgba(255,200,120,0.04)');
  warmGrad.addColorStop(1, 'rgba(180,160,200,0.03)');

  ctx.fillStyle = warmGrad;
  ctx.fillRect(cx - radius * 1.5, cy - radius * 1.5, radius * 3, radius * 3);
  ctx.restore();
}

// ============================================================
// MAIN RENDERER CLASS
// ============================================================

export class EmojiRenderer {
  static generateTextures(
    scene: Phaser.Scene,
    emojiList: { key: string; emoji: string }[],
    size: number = 56
  ): void {
    for (const { key } of emojiList) {
      if (scene.textures.exists(key)) continue;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      const parsed = parseKey(key);

      if (parsed.isGenerator) {
        EmojiRenderer.drawGenerator(ctx, size, parsed.chainId, parsed.genTier);
      } else if (parsed.isUI) {
        EmojiRenderer.drawUI(ctx, size, key);
      } else {
        EmojiRenderer.drawPlushItem(ctx, size, parsed.chainId, parsed.tier);
      }

      scene.textures.addCanvas(key, canvas);
    }
  }

  /** Draw an item -- large illustration filling 70-80% of the card (Travel Town style) */
  private static drawPlushItem(ctx: CanvasRenderingContext2D, size: number, chainId: string, tier: number): void {
    const colors = CHAIN_COLORS[chainId] || DEFAULT_COLORS;
    const cx = size / 2;
    const cy = size / 2;
    const pad = size * 0.06;
    const cr = size * 0.16;

    // === Subtle background card (30% opacity, not the focal point) ===
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur = size * 0.04;
    ctx.shadowOffsetY = size * 0.025;
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // Subtle chain-color tint on card
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.fillStyle = colors.from + '4D'; // 30% opacity
    ctx.fill();

    // Very soft inner shine (barely visible)
    ctx.save();
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.clip();
    const shine = ctx.createLinearGradient(0, pad, 0, cy);
    shine.addColorStop(0, 'rgba(255,255,255,0.25)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(pad, pad, size - pad * 2, cy - pad);
    ctx.restore();

    // Border (tier-based)
    if (tier >= 7) {
      const holoGrad = ctx.createLinearGradient(pad, pad, size - pad, size - pad);
      holoGrad.addColorStop(0, '#FF6B9D');
      holoGrad.addColorStop(0.15, '#FFD93D');
      holoGrad.addColorStop(0.35, '#6BCB77');
      holoGrad.addColorStop(0.55, '#4D96FF');
      holoGrad.addColorStop(0.75, '#D4A5FF');
      holoGrad.addColorStop(1, '#FF6B9D');
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = holoGrad;
      ctx.lineWidth = size * 0.04;
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.15;
      roundRect(ctx, pad - size * 0.01, pad - size * 0.01, size - pad * 2 + size * 0.02, size - pad * 2 + size * 0.02, cr + size * 0.01);
      ctx.strokeStyle = holoGrad;
      ctx.lineWidth = size * 0.025;
      ctx.stroke();
      ctx.restore();
      drawSparkles(ctx, cx, cy, size, 5);
    } else if (tier >= 5) {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = size * 0.03;
      ctx.stroke();
      drawSparkles(ctx, cx, cy, size, 3);
    } else if (tier >= 3) {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = colors.to + 'A0';
      ctx.lineWidth = size * 0.02;
      ctx.stroke();
    } else {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = colors.to + '60';
      ctx.lineWidth = size * 0.015;
      ctx.stroke();
    }

    // === LARGE ITEM ILLUSTRATION (the dominant visual) ===
    const iconSize = size * 0.75; // 75% of the card
    const iconY = cy + size * 0.02; // slightly below center for visual weight

    // Drop shadow beneath the item illustration
    drawContactShadow(ctx, cx, iconY, iconSize * 0.35, iconY + iconSize * 0.32);

    // Draw the item illustration at full size
    const iconConfig = getItemIconConfig(chainId, tier);
    ctx.save();
    iconConfig.draw(ctx, cx, iconY, iconSize, tier, iconConfig.color, iconConfig.accent);
    ctx.restore();

    // Warm ambient light overlay on the whole card (very subtle)
    ctx.save();
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.clip();
    drawWarmAmbient(ctx, cx, cy, size * 0.4);
    ctx.restore();
  }

  /** Draw a generator -- chain-colored card with large source-object icon */
  private static drawGenerator(ctx: CanvasRenderingContext2D, size: number, chainId: string, genTier: number = 1): void {
    const colors = CHAIN_COLORS[chainId] || DEFAULT_COLORS;
    const cx = size / 2;
    const cy = size / 2;
    const pad = size * 0.06;
    const cr = size * 0.2;

    // Shadow - stronger for higher tiers
    ctx.save();
    const shadowAlpha = 0.2 + genTier * 0.05;
    ctx.shadowColor = `rgba(190,80,130,${shadowAlpha})`;
    ctx.shadowBlur = size * (0.06 + genTier * 0.01);
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

    // Tier-specific border decorations
    if (genTier >= 5) {
      const rGrad = ctx.createLinearGradient(pad, pad, size - pad, size - pad);
      rGrad.addColorStop(0, '#FF6B9D');
      rGrad.addColorStop(0.25, '#FFD93D');
      rGrad.addColorStop(0.5, '#6BCB77');
      rGrad.addColorStop(0.75, '#4D96FF');
      rGrad.addColorStop(1, '#FF6B9D');
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = rGrad;
      ctx.lineWidth = size * 0.05;
      ctx.stroke();
      drawSparkles(ctx, cx, cy, size, 6);
    } else if (genTier >= 4) {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = size * 0.045;
      ctx.stroke();
      roundRect(ctx, pad + size * 0.03, pad + size * 0.03, size - pad * 2 - size * 0.06, size - pad * 2 - size * 0.06, cr - size * 0.02);
      ctx.strokeStyle = 'rgba(255,215,0,0.4)';
      ctx.lineWidth = size * 0.02;
      ctx.stroke();
      drawSparkles(ctx, cx, cy, size, 4);
    } else if (genTier >= 3) {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = size * 0.04;
      ctx.stroke();
    } else if (genTier >= 2) {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = '#C0C0C0';
      ctx.lineWidth = size * 0.04;
      ctx.stroke();
    } else {
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
      ctx.strokeStyle = colors.to;
      ctx.lineWidth = size * 0.04;
      ctx.stroke();
    }

    // === Large chain-themed source icon (replaces plush body) ===
    const iconSize = size * 0.6;
    const iconY = cy + size * 0.02;

    // Drop shadow beneath the source icon
    drawContactShadow(ctx, cx, iconY, iconSize * 0.3, iconY + iconSize * 0.28);

    // Draw the generator source icon
    const genIconConfig = getGeneratorIconConfig(chainId, genTier);
    ctx.save();
    genIconConfig.draw(ctx, cx, iconY, iconSize, genTier, genIconConfig.color, genIconConfig.accent);
    ctx.restore();

    // Warm ambient overlay
    ctx.save();
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.clip();
    drawWarmAmbient(ctx, cx, cy, size * 0.35);
    ctx.restore();

    // Sparkle accents for higher tiers
    if (genTier >= 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 + genTier * 0.1})`;
      const sparkleR = size * 0.3;
      const sparkleCount = Math.min(genTier, 5);
      for (let i = 0; i < sparkleCount; i++) {
        const angle = (i / sparkleCount) * Math.PI * 2 - Math.PI / 4;
        const sx = cx + Math.cos(angle) * sparkleR;
        const sy = iconY + Math.sin(angle) * sparkleR;
        const sr = size * (0.02 + genTier * 0.003);
        ctx.beginPath();
        ctx.moveTo(sx, sy - sr * 2);
        ctx.quadraticCurveTo(sx + sr * 0.3, sy - sr * 0.3, sx + sr * 2, sy);
        ctx.quadraticCurveTo(sx + sr * 0.3, sy + sr * 0.3, sx, sy + sr * 2);
        ctx.quadraticCurveTo(sx - sr * 0.3, sy + sr * 0.3, sx - sr * 2, sy);
        ctx.quadraticCurveTo(sx - sr * 0.3, sy - sr * 0.3, sx, sy - sr * 2);
        ctx.fill();
      }
    }

    // "+" badge (rose pink circle with white plus)
    const plusR = size * 0.11;
    const plusX = size - pad - plusR - size * 0.01;
    const plusY2 = pad + plusR + size * 0.01;
    ctx.beginPath();
    ctx.arc(plusX, plusY2, plusR, 0, Math.PI * 2);
    ctx.fillStyle = '#EC407A';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = size * 0.015;
    ctx.stroke();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = size * 0.025;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(plusX - plusR * 0.5, plusY2);
    ctx.lineTo(plusX + plusR * 0.5, plusY2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(plusX, plusY2 - plusR * 0.5);
    ctx.lineTo(plusX, plusY2 + plusR * 0.5);
    ctx.stroke();
  }

  /** Draw UI textures (gem, star, sparkle) -- fully programmatic, no emoji */
  private static drawUI(ctx: CanvasRenderingContext2D, size: number, key: string): void {
    // Subtle glow behind
    const cx = size / 2;
    const cy = size / 2;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.4);
    glow.addColorStop(0, 'rgba(255,200,230,0.3)');
    glow.addColorStop(1, 'rgba(255,200,230,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    switch (key) {
      case 'gem':
        drawUIGem(ctx, cx, cy, size);
        break;
      case 'star_ui':
        drawUIStar(ctx, cx, cy, size);
        break;
      case 'sparkle':
        drawUISparkle(ctx, cx, cy, size);
        break;
    }
  }
}
