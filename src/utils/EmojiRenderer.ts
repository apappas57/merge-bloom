/** Chain color themes -- warm, saturated tones */
const CHAIN_COLORS: Record<string, { from: string; to: string; fromHex: number; toHex: number }> = {
  flower:    { from: '#FFB8D0', to: '#F06292', fromHex: 0xFFB8D0, toHex: 0xF06292 },
  butterfly: { from: '#A0D8F0', to: '#4FC3F7', fromHex: 0xA0D8F0, toHex: 0x4FC3F7 },
  fruit:     { from: '#FFCBA4', to: '#FF7043', fromHex: 0xFFCBA4, toHex: 0xFF7043 },
  crystal:   { from: '#D1B8F0', to: '#A470E0', fromHex: 0xD1B8F0, toHex: 0xA470E0 },
  nature:    { from: '#B8E6A0', to: '#66BB6A', fromHex: 0xB8E6A0, toHex: 0x66BB6A },
  star:      { from: '#FFF4A0', to: '#FFC107', fromHex: 0xFFF4A0, toHex: 0xFFC107 },
  tea:       { from: '#E0CFC0', to: '#A1887F', fromHex: 0xE0CFC0, toHex: 0xA1887F },
  shell:     { from: '#A0E8F0', to: '#4DD0E1', fromHex: 0xA0E8F0, toHex: 0x4DD0E1 },
  sweet:     { from: '#FFB0D0', to: '#EC407A', fromHex: 0xFFB0D0, toHex: 0xEC407A },
  love:      { from: '#FFA0B8', to: '#FF4570', fromHex: 0xFFA0B8, toHex: 0xFF4570 },
  cosmic:    { from: '#C8B0F0', to: '#6A3DE8', fromHex: 0xC8B0F0, toHex: 0x6A3DE8 },
  cafe:      { from: '#F0E0D0', to: '#A1887F', fromHex: 0xF0E0D0, toHex: 0xA1887F },
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
export function addTierSparkles(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, tier: number): void {
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

  // Stem (drawn first, behind leaves)
  ctx.strokeStyle = darkenColor(color, 0.15);
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.15);
  ctx.quadraticCurveTo(cx + r * 0.05, cy + r * 0.45, cx, cy + r * 0.7);
  ctx.stroke();

  // Soil mound at base
  const soilGrad = ctx.createRadialGradient(cx, cy + r * 0.75, 0, cx, cy + r * 0.75, r * 0.35);
  soilGrad.addColorStop(0, '#8D6E63');
  soilGrad.addColorStop(1, '#5D4037');
  ctx.fillStyle = soilGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.75, r * 0.35, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Soil texture dots
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx + (i - 1.5) * r * 0.12, cy + r * 0.74 + (i % 2) * r * 0.03, r * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  // Leaves
  for (let i = 0; i < leafCount; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i - (leafCount - 1) / 2) * 0.4);
    const grad = ctx.createLinearGradient(-r * 0.3, -r, r * 0.3, r * 0.4);
    grad.addColorStop(0, accent);
    grad.addColorStop(0.6, color);
    grad.addColorStop(1, darkenColor(color, 0.1));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.bezierCurveTo(r * 0.6, -r * 0.6, r * 0.5, r * 0.3, 0, r * 0.5);
    ctx.bezierCurveTo(-r * 0.5, r * 0.3, -r * 0.6, -r * 0.6, 0, -r * 0.8);
    ctx.fill();
    // Central vein
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.65);
    ctx.lineTo(0, r * 0.35);
    ctx.stroke();
    // Branching veins (thin lines from center to edges)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = size * 0.012;
    for (let v = 0; v < 3; v++) {
      const vy = -r * 0.4 + v * r * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, vy);
      ctx.quadraticCurveTo(r * 0.25, vy - r * 0.08, r * 0.35, vy - r * 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, vy);
      ctx.quadraticCurveTo(-r * 0.25, vy - r * 0.08, -r * 0.35, vy - r * 0.15);
      ctx.stroke();
    }
    // Leaf edge shadow (darker rim on the right side)
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = size * 0.015;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.bezierCurveTo(r * 0.6, -r * 0.6, r * 0.5, r * 0.3, 0, r * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  // Dewdrop on leaf tip
  const dewGrad = ctx.createRadialGradient(cx - r * 0.08, cy - r * 0.55, 0, cx - r * 0.05, cy - r * 0.5, r * 0.08);
  dewGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
  dewGrad.addColorStop(0.5, 'rgba(200,230,255,0.6)');
  dewGrad.addColorStop(1, 'rgba(180,220,255,0.2)');
  ctx.fillStyle = dewGrad;
  ctx.beginPath();
  ctx.arc(cx - r * 0.05, cy - r * 0.5, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // Dewdrop highlight pinpoint
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.08, cy - r * 0.54, r * 0.025, 0, Math.PI * 2);
  ctx.fill();

  addHighlight(ctx, cx, cy - r * 0.2, r);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Flower Icon (petals radiating from center) ---
function drawFlowerIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  const petalCount = 4 + Math.min(tier, 4);

  // Green stem behind the flower
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = size * 0.035;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.15);
  ctx.quadraticCurveTo(cx + r * 0.08, cy + r * 0.5, cx - r * 0.02, cy + r * 0.8);
  ctx.stroke();

  // Two small leaves on stem
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.05, cy + r * 0.4, r * 0.15, r * 0.06, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.08, cy + r * 0.55, r * 0.12, r * 0.05, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Leaf veins
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.02, cy + r * 0.4);
  ctx.lineTo(cx + r * 0.15, cy + r * 0.38);
  ctx.stroke();

  // Petals -- each with its own gradient (lighter at tip, darker at base)
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // Petal gradient: lighter at tip, darker at base
    const grad = ctx.createLinearGradient(0, -r * 0.7, 0, -r * 0.1);
    grad.addColorStop(0, accent);      // lighter tip
    grad.addColorStop(0.6, color);     // mid
    grad.addColorStop(1, darkenColor(color, 0.12)); // darker base
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.45, r * 0.22, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Petal overlap shadow (right edge of each petal)
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = size * 0.012;
    ctx.beginPath();
    ctx.ellipse(r * 0.02, -r * 0.44, r * 0.22, r * 0.35, 0, -0.3, Math.PI * 0.8);
    ctx.stroke();
    // Petal inner vein (subtle line along center)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = size * 0.008;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.15);
    ctx.lineTo(0, -r * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  // Center with gradient
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.22);
  centerGrad.addColorStop(0, '#FFF176');
  centerGrad.addColorStop(0.5, '#FFE082');
  centerGrad.addColorStop(1, '#FFB300');
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Yellow pollen dots in center
  ctx.fillStyle = '#FDD835';
  for (let i = 0; i < 6; i++) {
    const pa = (i / 6) * Math.PI * 2;
    const pd = r * 0.1;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(pa) * pd, cy + Math.sin(pa) * pd, r * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }
  // Brighter pollen highlights
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 3; i++) {
    const pa = (i / 3) * Math.PI * 2 + 0.3;
    const pd = r * 0.06;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(pa) * pd, cy + Math.sin(pa) * pd, r * 0.015, 0, Math.PI * 2);
    ctx.fill();
  }

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

  // Main fruit body with color variation (sun side lighter, shadow side darker)
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx + r * 0.2, cy + r * 0.2, r * 1.1);
  grad.addColorStop(0, accent);
  grad.addColorStop(0.4, color);
  grad.addColorStop(0.8, darkenColor(color, 0.1));
  grad.addColorStop(1, darkenColor(color, 0.2));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.05, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle color variation overlay (redder on sun side for apples/warm, greener on shadow)
  ctx.save();
  ctx.globalAlpha = 0.12;
  const sunGrad = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.3, 0, cx, cy, r);
  sunGrad.addColorStop(0, '#FFE0B2');
  sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.05, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Texture dots (for oranges, peaches -- subtle surface bumps)
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 12; i++) {
    const ta = (i / 12) * Math.PI * 2 + 0.2;
    const td = r * (0.3 + (i % 3) * 0.15);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ta) * td, cy + r * 0.05 + Math.sin(ta) * td, r * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stem
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = size * 0.03;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.7);
  ctx.quadraticCurveTo(cx + r * 0.05, cy - r * 0.85, cx - r * 0.02, cy - r * 0.95);
  ctx.stroke();

  // Leaf on top (with vein)
  const leafGrad = ctx.createLinearGradient(cx, cy - r * 0.9, cx + r * 0.3, cy - r * 0.7);
  leafGrad.addColorStop(0, '#4CAF50');
  leafGrad.addColorStop(1, '#81C784');
  ctx.fillStyle = leafGrad;
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.15, cy - r * 0.82, r * 0.22, r * 0.1, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Leaf vein
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.03, cy - r * 0.82);
  ctx.lineTo(cx + r * 0.28, cy - r * 0.8);
  ctx.stroke();

  // Highlight shine spot (oval white at 30% opacity)
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.2, r * 0.28, r * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

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

  // Inner glow behind crystal (radial gradient from bright center)
  const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.1);
  innerGlow.addColorStop(0, accent + '40');
  innerGlow.addColorStop(0.6, accent + '15');
  innerGlow.addColorStop(1, accent + '00');
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2);
  ctx.fill();

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
  grad.addColorStop(0.3, color);
  grad.addColorStop(0.7, darkenColor(color, 0.1));
  grad.addColorStop(1, darkenColor(color, 0.25));
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner radial glow within crystal body
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx + r * 0.6, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.45, cy + r * 0.8);
  ctx.lineTo(cx - r * 0.45, cy + r * 0.8);
  ctx.lineTo(cx - r * 0.6, cy - r * 0.2);
  ctx.closePath();
  ctx.clip();
  const coreGlow = ctx.createRadialGradient(cx, cy - r * 0.1, 0, cx, cy, r * 0.7);
  coreGlow.addColorStop(0, 'rgba(255,255,255,0.25)');
  coreGlow.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = coreGlow;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // Facet lines (light lines showing crystal faces)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = size * 0.015;
  // Central facet
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx, cy + r * 0.8);
  ctx.stroke();
  // Horizontal facet belt
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.6, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.6, cy - r * 0.2);
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

  // Bright facet highlight (upper left face)
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx - r * 0.15, cy - r * 0.15);
  ctx.lineTo(cx + r * 0.15, cy - r * 0.15);
  ctx.closePath();
  ctx.fill();

  // Small sparkle highlights at facet intersections
  const sparklePoints = [
    { x: cx, y: cy - r * 0.9 },       // top
    { x: cx + r * 0.6, y: cy - r * 0.2 },  // upper right
    { x: cx - r * 0.6, y: cy - r * 0.2 },  // upper left
    { x: cx, y: cy + r * 0.1 },        // center intersection
  ];
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const sp of sparklePoints) {
    const sr = r * 0.04;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y - sr * 2.5);
    ctx.quadraticCurveTo(sp.x + sr * 0.3, sp.y - sr * 0.3, sp.x + sr * 2.5, sp.y);
    ctx.quadraticCurveTo(sp.x + sr * 0.3, sp.y + sr * 0.3, sp.x, sp.y + sr * 2.5);
    ctx.quadraticCurveTo(sp.x - sr * 0.3, sp.y + sr * 0.3, sp.x - sr * 2.5, sp.y);
    ctx.quadraticCurveTo(sp.x - sr * 0.3, sp.y - sr * 0.3, sp.x, sp.y - sr * 2.5);
    ctx.fill();
  }

  addHighlight(ctx, cx - r * 0.15, cy - r * 0.4, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Star Icon ---
function drawStarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.4;
  const points = 4 + Math.min(Math.floor(tier / 2), 2);

  // Surrounding glow halo (large radial gradient behind star) -- always present
  const haloGrad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.3);
  haloGrad.addColorStop(0, accent + (tier >= 4 ? '70' : '40'));
  haloGrad.addColorStop(0.5, accent + '20');
  haloGrad.addColorStop(1, accent + '00');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Star path
  const starPath: { x: number; y: number }[] = [];
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const rad = i % 2 === 0 ? r : r * 0.4;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    starPath.push({ x, y });
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Inner radial gradient for depth
  const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, 0, cx, cy, r);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.2, accent);
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, darkenColor(color, 0.1));
  ctx.fillStyle = grad;
  ctx.fill();

  // Edge highlights on each star point tip
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = size * 0.012;
  for (let i = 0; i < points * 2; i += 2) {
    const tipIdx = i;
    const prevIdx = (tipIdx - 1 + starPath.length) % starPath.length;
    const nextIdx = (tipIdx + 1) % starPath.length;
    // Left edge of point
    ctx.beginPath();
    ctx.moveTo(starPath[prevIdx].x, starPath[prevIdx].y);
    ctx.lineTo(starPath[tipIdx].x, starPath[tipIdx].y);
    ctx.stroke();
  }

  // Bright center glow
  const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.35);
  centerGlow.addColorStop(0, 'rgba(255,255,255,0.3)');
  centerGlow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
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
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, darkenColor(color, 0.15));
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle inner shadow at bottom
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.7);
  ctx.bezierCurveTo(cx - r * 0.15, cy + r * 0.35, cx - r * 0.95, cy + r * 0.1, cx - r * 0.8, cy - r * 0.3);
  ctx.bezierCurveTo(cx - r * 0.65, cy - r * 0.75, cx - r * 0.1, cy - r * 0.8, cx, cy - r * 0.4);
  ctx.bezierCurveTo(cx + r * 0.1, cy - r * 0.8, cx + r * 0.65, cy - r * 0.75, cx + r * 0.8, cy - r * 0.3);
  ctx.bezierCurveTo(cx + r * 0.95, cy + r * 0.1, cx + r * 0.15, cy + r * 0.35, cx, cy + r * 0.7);
  ctx.closePath();
  ctx.clip();
  const shadowGrad = ctx.createLinearGradient(cx, cy + r * 0.3, cx, cy + r * 0.75);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(cx - r, cy + r * 0.2, r * 2, r * 0.6);
  ctx.restore();

  // Glossy highlight (white oval in upper-left)
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.22, r * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Secondary smaller highlight
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.3, r * 0.08, r * 0.06, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Inner detail for higher tiers
  if (tier >= 3) {
    ctx.save();
    ctx.globalAlpha = 0.2;
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

  // Bow/ribbon detail for gift hearts (tier 4+)
  if (tier >= 4) {
    // Ribbon vertical + horizontal cross
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.4);
    ctx.lineTo(cx, cy + r * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy + r * 0.05);
    ctx.lineTo(cx + r * 0.55, cy + r * 0.05);
    ctx.stroke();
    // Small bow at top center
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.1, cy - r * 0.42, r * 0.1, r * 0.06, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.1, cy - r * 0.42, r * 0.1, r * 0.06, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Bow center knot
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.42, r * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }

  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Cup / Mug Icon ---
function drawCupIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.35;
  const cupW = r * 0.7;
  const cupH = r * 0.9;

  // Saucer beneath the cup
  const saucerGrad = ctx.createLinearGradient(cx - cupW * 1.4, cy + cupH * 0.75, cx + cupW * 1.4, cy + cupH * 0.85);
  saucerGrad.addColorStop(0, darkenColor(color, 0.05));
  saucerGrad.addColorStop(0.5, accent);
  saucerGrad.addColorStop(1, darkenColor(color, 0.05));
  ctx.fillStyle = saucerGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + cupH * 0.82, cupW * 1.35, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Saucer rim highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.ellipse(cx, cy + cupH * 0.8, cupW * 1.3, r * 0.08, 0, Math.PI + 0.3, -0.3);
  ctx.stroke();

  // Cup body
  const grad = ctx.createLinearGradient(cx - cupW, cy - cupH * 0.4, cx + cupW, cy + cupH * 0.6);
  grad.addColorStop(0, accent);
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, darkenColor(color, 0.08));
  ctx.fillStyle = grad;
  roundRect(ctx, cx - cupW, cy - cupH * 0.3, cupW * 2, cupH * 1.1, r * 0.15);
  ctx.fill();

  // Liquid level visible inside (darker line near top)
  const liqGrad = ctx.createLinearGradient(cx, cy - cupH * 0.2, cx, cy - cupH * 0.05);
  liqGrad.addColorStop(0, darkenColor(color, 0.2));
  liqGrad.addColorStop(1, darkenColor(color, 0.1));
  ctx.fillStyle = liqGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy - cupH * 0.15, cupW * 0.85, r * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cup rim
  ctx.fillStyle = darkenColor(color, 0.1);
  ctx.beginPath();
  ctx.ellipse(cx, cy - cupH * 0.3, cupW, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Rim highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.ellipse(cx, cy - cupH * 0.31, cupW * 0.9, r * 0.06, 0, Math.PI + 0.5, -0.5);
  ctx.stroke();

  // Handle on right side (small arc)
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx + cupW + r * 0.15, cy + cupH * 0.1, r * 0.22, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();
  // Handle inner highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = size * 0.015;
  ctx.beginPath();
  ctx.arc(cx + cupW + r * 0.15, cy + cupH * 0.1, r * 0.18, -Math.PI * 0.3, Math.PI * 0.2);
  ctx.stroke();

  // Steam wisps (curvy S-shaped lines) -- always show at least 2
  const steamCount = Math.max(2, Math.min(tier, 3));
  for (let i = 0; i < steamCount; i++) {
    const sx = cx + (i - (steamCount - 1) / 2) * r * 0.3;
    const steamAlpha = 0.3 + (tier >= 2 ? 0.2 : 0);
    ctx.strokeStyle = `rgba(255,255,255,${steamAlpha})`;
    ctx.lineWidth = size * 0.018;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, cy - cupH * 0.38);
    // S-curve steam wisp
    ctx.bezierCurveTo(
      sx + r * 0.12, cy - cupH * 0.55,
      sx - r * 0.12, cy - cupH * 0.7,
      sx + r * 0.06, cy - cupH * 0.95
    );
    ctx.stroke();
  }

  addHighlight(ctx, cx - cupW * 0.3, cy - cupH * 0.1, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Shell / Spiral Icon ---
function drawShellIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;

  // Sandy dots at base
  const sandColors = ['#F5DEB3', '#DEB887', '#D2B48C', '#E8D5B7'];
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = sandColors[i % sandColors.length];
    ctx.beginPath();
    ctx.arc(
      cx + (i - 3.5) * r * 0.14,
      cy + r * 0.78 + (i % 2) * r * 0.04,
      r * (0.03 + (i % 3) * 0.01),
      0, Math.PI * 2
    );
    ctx.fill();
  }

  // Main shell body with pearlescent color shift (mix pink and blue)
  const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, 0, cx + r * 0.2, cy + r * 0.2, r);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.2, '#F8BBD0');  // pink pearl
  grad.addColorStop(0.5, accent);
  grad.addColorStop(0.7, '#B3E5FC');  // blue pearl
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

  // Pearlescent sheen overlay
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.1, cy + r * 0.7);
  ctx.bezierCurveTo(cx - r * 0.8, cy + r * 0.5, cx - r * 0.9, cy - r * 0.3, cx - r * 0.4, cy - r * 0.7);
  ctx.bezierCurveTo(cx, cy - r * 0.9, cx + r * 0.5, cy - r * 0.7, cx + r * 0.7, cy - r * 0.2);
  ctx.bezierCurveTo(cx + r * 0.9, cy + r * 0.2, cx + r * 0.6, cy + r * 0.65, cx + r * 0.1, cy + r * 0.7);
  ctx.closePath();
  ctx.clip();
  const pearlGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  pearlGrad.addColorStop(0, 'rgba(248,187,208,0.15)');
  pearlGrad.addColorStop(0.5, 'rgba(179,229,252,0.12)');
  pearlGrad.addColorStop(1, 'rgba(248,187,208,0.1)');
  ctx.fillStyle = pearlGrad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // Spiral ridges (concentric arc lines)
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
    // Shadow side of each ridge
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.08, cy + r * 0.68);
    ctx.quadraticCurveTo(
      cx + (t - 0.5) * r * 0.5 + r * 0.02, cy + r * (0.32 - t * 0.8),
      cx + r * (0.12 + t * 0.4), cy - r * (0.08 + t * 0.4)
    );
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  }

  // Shell edge rim
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = size * 0.01;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.1, cy + r * 0.7);
  ctx.bezierCurveTo(cx - r * 0.8, cy + r * 0.5, cx - r * 0.9, cy - r * 0.3, cx - r * 0.4, cy - r * 0.7);
  ctx.stroke();

  addHighlight(ctx, cx - r * 0.1, cy - r * 0.2, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Cake / Sweet Icon ---
function drawCakeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  const layers = Math.min(1 + Math.floor(tier / 2), 3);
  const layerH = (r * 1.3) / layers;
  const baseY = cy + r * 0.5;

  // Plate beneath cake
  const plateGrad = ctx.createLinearGradient(cx - r * 0.9, baseY + r * 0.1, cx + r * 0.9, baseY + r * 0.15);
  plateGrad.addColorStop(0, '#E0E0E0');
  plateGrad.addColorStop(0.5, '#FFFFFF');
  plateGrad.addColorStop(1, '#E0E0E0');
  ctx.fillStyle = plateGrad;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + r * 0.12, r * 0.9, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Plate rim
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = size * 0.006;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + r * 0.12, r * 0.88, r * 0.09, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Cake layers
  for (let i = 0; i < layers; i++) {
    const y = baseY - i * layerH;
    const w = r * (0.8 - i * 0.12);
    const h = layerH * 0.9;
    // Layer body with gradient
    const grad = ctx.createLinearGradient(cx - w, y - h, cx + w, y);
    grad.addColorStop(0, accent);
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, darkenColor(color, 0.08));
    ctx.fillStyle = grad;
    roundRect(ctx, cx - w, y - h, w * 2, h, r * 0.08);
    ctx.fill();

    // Visible layer line (horizontal filling line between layers)
    if (i > 0) {
      ctx.fillStyle = darkenColor(color, 0.12);
      ctx.beginPath();
      ctx.ellipse(cx, y, w * 0.95, h * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Frosting drip on top of each layer
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(cx, y - h, w * 0.95, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Frosting drips down the side (2-3 per layer)
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let d = 0; d < 3; d++) {
      const dx = cx + (d - 1) * w * 0.5;
      const dripH = h * (0.2 + d * 0.1);
      ctx.beginPath();
      ctx.moveTo(dx - r * 0.04, y - h);
      ctx.quadraticCurveTo(dx - r * 0.05, y - h + dripH, dx, y - h + dripH + r * 0.03);
      ctx.quadraticCurveTo(dx + r * 0.05, y - h + dripH, dx + r * 0.04, y - h);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Sprinkles (tiny colored dots on the frosting)
  const sprinkleColors = ['#E53935', '#FFEB3B', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
  for (let i = 0; i < 10; i++) {
    const topLayerY = baseY - (layers - 1) * layerH - layerH * 0.9;
    const sprW = r * (0.75 - (layers - 1) * 0.1);
    const sx = cx + (Math.cos(i * 2.3) * sprW * 0.8);
    const sy = topLayerY + (Math.sin(i * 1.7) * layerH * 0.3);
    ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(i * 0.8);
    ctx.fillRect(-size * 0.012, -size * 0.004, size * 0.024, size * 0.008);
    ctx.restore();
  }

  // Cherry on top (always present, bigger for higher tiers)
  const topY = baseY - layers * layerH;
  const cherryR = tier >= 3 ? r * 0.13 : r * 0.1;
  // Cherry body
  const cherryGrad = ctx.createRadialGradient(cx - cherryR * 0.3, topY - r * 0.12, 0, cx, topY - r * 0.08, cherryR);
  cherryGrad.addColorStop(0, '#FF5252');
  cherryGrad.addColorStop(1, '#C62828');
  ctx.fillStyle = cherryGrad;
  ctx.beginPath();
  ctx.arc(cx, topY - r * 0.08, cherryR, 0, Math.PI * 2);
  ctx.fill();
  // Cherry highlight
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(cx - cherryR * 0.3, topY - r * 0.12, cherryR * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Cherry stem
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = size * 0.02;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, topY - r * 0.08 - cherryR);
  ctx.quadraticCurveTo(cx + r * 0.1, topY - r * 0.35, cx + r * 0.05, topY - r * 0.4);
  ctx.stroke();

  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Cosmic Icon (planet, comet, rocket shapes) ---
function drawCosmicIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.35;

  // Tiny star dots around all cosmic objects
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 6; i++) {
    const sa = (i / 6) * Math.PI * 2 + 0.5;
    const sd = r * (0.9 + (i % 3) * 0.15);
    const starR = r * (0.015 + (i % 2) * 0.01);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(sa) * sd, cy + Math.sin(sa) * sd, starR, 0, Math.PI * 2);
    ctx.fill();
  }

  if (tier <= 2) {
    // Rock / Comet
    const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, 0, cx, cy, r);
    grad.addColorStop(0, accent);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, darkenColor(color, 0.15));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    // Surface craters
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy + r * 0.1, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.2, cy - r * 0.1, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    if (tier >= 2) {
      // Comet tail with gradient
      const tailGrad = ctx.createLinearGradient(cx + r * 0.4, cy, cx + r * 1.2, cy - r * 0.3);
      tailGrad.addColorStop(0, accent + '80');
      tailGrad.addColorStop(1, accent + '00');
      ctx.fillStyle = tailGrad;
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
    grad.addColorStop(0.6, color);
    grad.addColorStop(1, darkenColor(color, 0.15));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Surface bands (horizontal curved lines)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = size * 0.015;
    for (let b = -2; b <= 2; b++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy + b * r * 0.15, r * 0.5, r * 0.06, 0.05, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Darker band
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = size * 0.025;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.1, r * 0.48, r * 0.08, 0.1, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    // Ring with transparency (semi-transparent fill instead of just stroke)
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = accent;
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.9, r * 0.2, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Ring inner edge
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = size * 0.01;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.82, r * 0.17, -0.3, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Rocket
    const bodyW = r * 0.3;
    const bodyH = r * 0.9;
    // Body
    const grad = ctx.createLinearGradient(cx - bodyW, cy, cx + bodyW, cy);
    grad.addColorStop(0, darkenColor(color, 0.12));
    grad.addColorStop(0.3, color);
    grad.addColorStop(0.5, accent);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, darkenColor(color, 0.12));
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
      // Fin highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(cx + dir * bodyW, cy + bodyH * 0.25);
      ctx.lineTo(cx + dir * bodyW * 1.4, cy + bodyH * 0.45);
      ctx.lineTo(cx + dir * bodyW, cy + bodyH * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
    });
    // Flame exhaust (orange-yellow triangle with glow)
    const flameGrad = ctx.createLinearGradient(cx, cy + bodyH * 0.4, cx, cy + bodyH * 1.0);
    flameGrad.addColorStop(0, '#FF9800');
    flameGrad.addColorStop(0.5, '#FF5722');
    flameGrad.addColorStop(1, '#FF572200');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.55, cy + bodyH * 0.4);
    ctx.quadraticCurveTo(cx, cy + bodyH * 1.05, cx + bodyW * 0.55, cy + bodyH * 0.4);
    ctx.fill();
    // Inner flame (brighter)
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.25, cy + bodyH * 0.4);
    ctx.quadraticCurveTo(cx, cy + bodyH * 0.75, cx + bodyW * 0.25, cy + bodyH * 0.4);
    ctx.fill();
    // White-hot core
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.1, cy + bodyH * 0.4);
    ctx.quadraticCurveTo(cx, cy + bodyH * 0.55, cx + bodyW * 0.1, cy + bodyH * 0.4);
    ctx.fill();
    // Window (small circle) with reflective detail
    const winGrad = ctx.createRadialGradient(cx - bodyW * 0.1, cy - bodyH * 0.15, 0, cx, cy - bodyH * 0.1, bodyW * 0.35);
    winGrad.addColorStop(0, '#E3F2FD');
    winGrad.addColorStop(0.5, '#90CAF9');
    winGrad.addColorStop(1, '#42A5F5');
    ctx.fillStyle = winGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - bodyH * 0.1, bodyW * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // Window frame
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = size * 0.01;
    ctx.beginPath();
    ctx.arc(cx, cy - bodyH * 0.1, bodyW * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    // Window highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(cx - bodyW * 0.12, cy - bodyH * 0.16, bodyW * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Body panel line
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = size * 0.008;
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.8, cy + bodyH * 0.2);
    ctx.lineTo(cx + bodyW * 0.8, cy + bodyH * 0.2);
    ctx.stroke();
  }
  addHighlight(ctx, cx - r * 0.15, cy - r * 0.25, r * 0.5);
  addTierSparkles(ctx, cx, cy, r, tier);
}

// --- Coffee / Cafe Icon ---
function drawCoffeeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, color: string, accent: string): void {
  const r = size * 0.38;
  if (tier <= 1) {
    // Coffee bean with warm brown gradient
    const grad = ctx.createRadialGradient(cx - r * 0.12, cy - r * 0.15, 0, cx + r * 0.1, cy + r * 0.1, r * 0.55);
    grad.addColorStop(0, accent);
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, darkenColor(color, 0.2));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.35, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Center crease line (deeper, more defined)
    ctx.strokeStyle = darkenColor(color, 0.25);
    ctx.lineWidth = size * 0.025;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.38);
    ctx.bezierCurveTo(cx + r * 0.1, cy - r * 0.1, cx - r * 0.1, cy + r * 0.1, cx, cy + r * 0.38);
    ctx.stroke();
    // Crease shadow (subtle darker line offset)
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = size * 0.015;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.02, cy - r * 0.35);
    ctx.bezierCurveTo(cx + r * 0.12, cy - r * 0.08, cx - r * 0.08, cy + r * 0.12, cx + r * 0.02, cy + r * 0.35);
    ctx.stroke();
    // Surface texture (subtle bumps)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 5; i++) {
      const ta = (i / 5) * Math.PI * 2 + 1;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ta) * r * 0.2, cy + Math.sin(ta) * r * 0.3, r * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
    // Warm highlight
    addHighlight(ctx, cx - r * 0.1, cy - r * 0.2, r * 0.35);
  } else if (tier <= 3) {
    // Coffee cup (delegate to enhanced cup)
    drawCupIcon(ctx, cx, cy, size, tier, color, accent);
    return;
  } else if (tier <= 5) {
    // Pastry / pancake stack with layered curves
    const layers = tier - 2;
    const layerH = r * 0.25;
    const baseY = cy + r * 0.3;

    // Plate beneath
    ctx.fillStyle = '#EEEEEE';
    ctx.beginPath();
    ctx.ellipse(cx, baseY + r * 0.12, r * 0.72, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < layers; i++) {
      const y = baseY - i * layerH;
      const w = r * (0.65 - i * 0.04);
      // Warm brown gradient for each layer
      const grad2 = ctx.createRadialGradient(cx - w * 0.3, y - layerH * 0.2, 0, cx, y, w);
      grad2.addColorStop(0, accent);
      grad2.addColorStop(0.6, color);
      grad2.addColorStop(1, darkenColor(color, 0.1));
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.ellipse(cx, y, w, layerH * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      // Layer edge detail
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = size * 0.006;
      ctx.beginPath();
      ctx.ellipse(cx, y + layerH * 0.05, w * 0.98, layerH * 0.5, 0, 0.3, Math.PI - 0.3);
      ctx.stroke();
      // Syrup/drizzle with warmth
      const drizGrad = ctx.createLinearGradient(cx - w * 0.85, y, cx + w * 0.85, y);
      drizGrad.addColorStop(0, '#F5D280');
      drizGrad.addColorStop(0.5, '#FFE082');
      drizGrad.addColorStop(1, '#F5D280');
      ctx.fillStyle = drizGrad;
      ctx.beginPath();
      ctx.ellipse(cx, y - layerH * 0.15, w * 0.85, layerH * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Butter pat on top with highlight
    const butterGrad = ctx.createRadialGradient(cx - r * 0.04, baseY - layers * layerH - r * 0.07, 0, cx, baseY - layers * layerH - r * 0.04, r * 0.15);
    butterGrad.addColorStop(0, '#FFFDE7');
    butterGrad.addColorStop(1, '#FFF9C4');
    ctx.fillStyle = butterGrad;
    ctx.beginPath();
    ctx.ellipse(cx, baseY - layers * layerH - r * 0.05, r * 0.15, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    addHighlight(ctx, cx - r * 0.15, cy - r * 0.15, r * 0.4);
  } else {
    // Bakery building
    drawHouseIcon(ctx, cx, cy, size, tier, color, accent);
    return;
  }
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
      { draw: drawPlushieSeedlingIcon, color: '#B8E6A0', accent: '#6B9E50' },    // t1 Seedling plushie
      { draw: drawPlushieSproutIcon, color: '#A5D89A', accent: '#5DA048' },      // t2 Sprout plushie
      { draw: drawPlushieCloverIcon, color: '#7DC96F', accent: '#3D8A2E' },      // t3 Clover plushie
      { draw: drawPlushieTulipIcon, color: '#FFB5C5', accent: '#E8688A' },       // t4 Tulip plushie
      { draw: drawPlushieRoseIcon, color: '#FF8CAD', accent: '#D14068' },        // t5 Rose plushie
      { draw: drawPlushieBlossomIcon, color: '#FFB7C5', accent: '#FFE0E8' },     // t6 Cherry Blossom plushie
      { draw: drawPlushieHibiscusIcon, color: '#FF6B8A', accent: '#FF3D6B' },    // t7 Hibiscus plushie
      { draw: drawPlushieBouquetIcon, color: '#FFD0E1', accent: '#FFD700' },     // t8 Bouquet plushie
    ],
    butterfly: [
      { draw: drawPlushieEggIcon, color: '#BCAAA4', accent: '#EFEBE9' },        // t1 Egg plushie
      { draw: drawPlushieCaterpillarIcon, color: '#8BC34A', accent: '#C5E1A5' }, // t2 Caterpillar plushie
      { draw: drawPlushieBeeIcon, color: '#FFC107', accent: '#FFE082' },         // t3 Bee plushie
      { draw: drawPlushieLadybugIcon, color: '#F44336', accent: '#EF9A9A' },     // t4 Ladybug plushie
      { draw: drawPlushieButterflyIcon, color: '#7C4DFF', accent: '#B388FF' },   // t5 Butterfly plushie
      { draw: drawPlushiePeacockIcon, color: '#00BCD4', accent: '#80DEEA' },     // t6 Peacock plushie
    ],
    fruit: [
      { draw: drawPlushieGrapesIcon, color: '#7B1FA2', accent: '#CE93D8' },      // t1 Grapes plushie
      { draw: drawPlushieAppleIcon, color: '#F44336', accent: '#EF9A9A' },       // t2 Apple plushie
      { draw: drawPlushieOrangeIcon, color: '#FF9800', accent: '#FFE0B2' },      // t3 Orange plushie
      { draw: drawPlushieKiwiIcon, color: '#8BC34A', accent: '#C5E1A5' },        // t4 Kiwi plushie
      { draw: drawPlushieMangoIcon, color: '#FF9800', accent: '#FFCC80' },       // t5 Mango plushie
      { draw: drawPlushiePeachIcon, color: '#FF8A65', accent: '#FFCCBC' },       // t6 Peach plushie
      { draw: drawPlushieCakeIcon, color: '#F48FB1', accent: '#F8BBD0' },        // t7 Cake plushie
    ],
    crystal: [
      { draw: drawPlushieDropletIcon, color: '#42A5F5', accent: '#BBDEFB' },    // t1 Droplet plushie
      { draw: drawPlushieIceIcon, color: '#B3E5FC', accent: '#E1F5FE' },       // t2 Ice plushie
      { draw: drawPlushieCrystalBallIcon, color: '#9C27B0', accent: '#E1BEE7' }, // t3 Crystal Ball plushie
      { draw: drawPlushieDiamondIcon, color: '#00BCD4', accent: '#B2EBF2' },    // t4 Diamond plushie
      { draw: drawPlushieCrownIcon, color: '#FFD700', accent: '#FFF8E1' },      // t5 Crown plushie
    ],
    nature: [
      { draw: drawPlushieLeafIcon, color: '#8D6E63', accent: '#D7CCC8' },       // t1 Leaf plushie
      { draw: drawPlushieMapleLeafIcon, color: '#E65100', accent: '#FFE0B2' },   // t2 Maple Leaf plushie
      { draw: drawPlushiePineIcon, color: '#2E7D32', accent: '#C8E6C9' },       // t3 Pine plushie
      { draw: drawPlushieTreeIcon, color: '#388E3C', accent: '#A5D6A7' },       // t4 Tree plushie
      { draw: drawPlushiePalmIcon, color: '#43A047', accent: '#C8E6C9' },       // t5 Palm plushie
      { draw: drawPlushieCottageIcon, color: '#8D6E63', accent: '#EFEBE9' },    // t6 Cottage plushie
    ],
    star: [
      { draw: drawPlushieStarIcon, color: '#FFD54F', accent: '#FFF9C4' },       // t1 Star plushie
      { draw: drawPlushieGlowingStarIcon, color: '#FFD700', accent: '#FFF8E1' }, // t2 Glowing Star plushie
      { draw: drawPlushieSparklesIcon, color: '#FFC107', accent: '#FFF8E1' },   // t3 Sparkles plushie
      { draw: drawPlushieShootingStarIcon, color: '#FF9800', accent: '#FFE0B2' }, // t4 Shooting Star plushie
      { draw: drawPlushieMoonIcon, color: '#FDD835', accent: '#FFF9C4' },       // t5 Moon plushie
      { draw: drawPlushieRainbowIcon, color: '#FF5252', accent: '#FFFFFF' },    // t6 Rainbow plushie
    ],
    tea: [
      { draw: drawPlushieTeaLeafIcon, color: '#689F38', accent: '#AED581' },     // t1 Tea Leaf plushie
      { draw: drawPlushieMatchaIcon, color: '#689F38', accent: '#C5E1A5' },      // t2 Matcha plushie
      { draw: drawPlushieCoffeeIcon, color: '#795548', accent: '#D7CCC8' },      // t3 Coffee plushie
      { draw: drawPlushieBobaTeaIcon, color: '#8D6E63', accent: '#BCAAA4' },     // t4 Boba Tea plushie
      { draw: drawPlushieCakeSliceIcon, color: '#F8BBD0', accent: '#FCE4EC' },   // t5 Cake Slice plushie
      { draw: drawPlushieTeaSetIcon, color: '#A1887F', accent: '#D7CCC8' },      // t6 Tea Set plushie
      { draw: drawPlushieTeaHouseIcon, color: '#8D6E63', accent: '#BCAAA4' },    // t7 Tea House plushie
    ],
    shell: [
      { draw: drawPlushieCoralIcon, color: '#EF5350', accent: '#FFCDD2' },       // t1 Coral plushie
      { draw: drawPlushieShellIcon, color: '#FFAB91', accent: '#FBE9E7' },       // t2 Shell plushie
      { draw: drawPlushieCrabIcon, color: '#E53935', accent: '#EF9A9A' },        // t3 Crab plushie
      { draw: drawPlushieTropicalFishIcon, color: '#29B6F6', accent: '#B3E5FC' }, // t4 Tropical Fish plushie
      { draw: drawPlushieDolphinIcon, color: '#42A5F5', accent: '#90CAF9' },     // t5 Dolphin plushie
      { draw: drawPlushieMermaidIcon, color: '#26C6DA', accent: '#80DEEA' },     // t6 Mermaid plushie
    ],
    sweet: [
      { draw: drawPlushieCandyIcon, color: '#E91E63', accent: '#F48FB1' },       // t1 Candy plushie
      { draw: drawPlushieLollipopIcon, color: '#E91E63', accent: '#F8BBD0' },    // t2 Lollipop plushie
      { draw: drawPlushieCookieIcon, color: '#8D6E63', accent: '#D7CCC8' },      // t3 Cookie plushie
      { draw: drawPlushieCupcakeIcon, color: '#F06292', accent: '#F8BBD0' },     // t4 Cupcake plushie
      { draw: drawPlushieDonutIcon, color: '#F48FB1', accent: '#FCE4EC' },       // t5 Donut plushie
      { draw: drawPlushieChocolateIcon, color: '#795548', accent: '#A1887F' },   // t6 Chocolate plushie
      { draw: drawPlushieBirthdayCakeIcon, color: '#F8BBD0', accent: '#FCE4EC' }, // t7 Birthday Cake plushie
      { draw: drawPlushieCandyCastleIcon, color: '#F8BBD0', accent: '#FCE4EC' }, // t8 Candy Castle plushie
    ],
    love: [
      { draw: drawPlushieLoveNoteIcon, color: '#F48FB1', accent: '#FCE4EC' },     // t1 Love Note plushie
      { draw: drawPlushieGrowingHeartIcon, color: '#EC407A', accent: '#F8BBD0' }, // t2 Growing Heart plushie
      { draw: drawPlushieSparklingHeartIcon, color: '#E91E63', accent: '#F48FB1' }, // t3 Sparkling Heart plushie
      { draw: drawPlushieGiftHeartIcon, color: '#D81B60', accent: '#F06292' },    // t4 Gift Heart plushie
      { draw: drawPlushieTwinHeartsIcon, color: '#C2185B', accent: '#EC407A' },   // t5 Twin Hearts plushie
      { draw: drawPlushieEternalLoveIcon, color: '#AD1457', accent: '#FFD700' },  // t6 Eternal Love plushie
    ],
    cosmic: [
      { draw: drawPlushieSpaceRockIcon, color: '#78909C', accent: '#B0BEC5' },    // t1 Space Rock plushie
      { draw: drawPlushieCometIcon, color: '#7C4DFF', accent: '#B388FF' },        // t2 Comet plushie
      { draw: drawPlushieUFOIcon, color: '#90A4AE', accent: '#E0E0E0' },         // t3 UFO plushie
      { draw: drawPlushieEarthIcon, color: '#42A5F5', accent: '#81D4FA' },        // t4 Earth plushie
      { draw: drawPlushieSaturnIcon, color: '#7C4DFF', accent: '#D1C4E9' },       // t5 Saturn plushie
      { draw: drawPlushieNebulaIcon, color: '#7B1FA2', accent: '#CE93D8' },       // t6 Nebula plushie
      { draw: drawPlushieRocketIcon, color: '#B0BEC5', accent: '#FFD700' },       // t7 Rocket plushie
    ],
    cafe: [
      { draw: drawPlushieCoffeeBeanIcon, color: '#795548', accent: '#A1887F' },   // t1 Coffee Bean plushie
      { draw: drawPlushieEspressoIcon, color: '#6D4C41', accent: '#BCAAA4' },     // t2 Espresso plushie
      { draw: drawPlushieCroissantIcon, color: '#F9A825', accent: '#FFF9C4' },    // t3 Croissant plushie
      { draw: drawPlushieWaffleIcon, color: '#FFB300', accent: '#FFE082' },       // t4 Waffle plushie
      { draw: drawPlushiePancakeStackIcon, color: '#D7CCC8', accent: '#EFEBE9' }, // t5 Pancake Stack plushie
      { draw: drawPlushieLayerCakeIcon, color: '#F48FB1', accent: '#FCE4EC' },    // t6 Layer Cake plushie
      { draw: drawPlushieBakeryIcon, color: '#8D6E63', accent: '#FFD700' },       // t7 Bakery plushie
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
// KAWAII FACE HELPER
// Reusable across all chains. Draws expressive faces with eyes,
// mouth, and blush marks scaled to any item size.
// ============================================================

type KawaiiExpression = 'happy' | 'sleepy' | 'excited' | 'shy' | 'sparkle';

function drawKawaiiFace(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  faceSize: number,
  expression: KawaiiExpression = 'happy',
  options?: { eyeColor?: string; blushColor?: string; blushOpacity?: number }
): void {
  const s = faceSize / 40;
  const eyeColor = options?.eyeColor || '#3D2B1F';
  const blushColor = options?.blushColor || '#FF9CAD';
  const blushOpacity = options?.blushOpacity ?? 0.35;

  // === EYES ===
  if (expression === 'sleepy') {
    // Curved line eyes (^  ^)
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = Math.max(1.5 * s, 1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx - 6 * s, cy - 2 * s, 4 * s, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 6 * s, cy - 2 * s, 4 * s, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  } else if (expression === 'sparkle') {
    // Star/sparkle eyes
    [cx - 6 * s, cx + 6 * s].forEach(ex => {
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 4 * s : 1.5 * s;
        const px = ex + Math.cos(angle) * r;
        const py = (cy - 2 * s) + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // White highlight dot
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 1.5 * s, (cy - 2 * s) - 1.5 * s, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    // Default dot eyes with highlight (used for happy, shy, excited)
    [cx - 6 * s, cx + 6 * s].forEach(ex => {
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(ex, cy - 2 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 1 * s, (cy - 2 * s) - 1 * s, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // === MOUTH ===
  ctx.strokeStyle = eyeColor;
  ctx.lineWidth = Math.max(1.2 * s, 0.8);
  ctx.lineCap = 'round';
  if (expression === 'excited') {
    // Open happy mouth (D shape)
    ctx.beginPath();
    ctx.arc(cx, cy + 4 * s, 3.5 * s, 0, Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#FF8FA3';
    ctx.beginPath();
    ctx.arc(cx, cy + 4 * s, 3.5 * s, 0, Math.PI);
    ctx.fill();
  } else if (expression === 'shy') {
    // Tiny wavy mouth
    ctx.beginPath();
    ctx.moveTo(cx - 3 * s, cy + 4 * s);
    ctx.quadraticCurveTo(cx, cy + 6 * s, cx + 3 * s, cy + 4 * s);
    ctx.stroke();
  } else {
    // Simple smile curve (happy, sleepy, sparkle)
    ctx.beginPath();
    ctx.arc(cx, cy + 2 * s, 3.5 * s, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  // === BLUSH MARKS ===
  ctx.save();
  ctx.fillStyle = blushColor;
  ctx.globalAlpha = blushOpacity;
  ctx.beginPath();
  ctx.ellipse(cx - 10 * s, cy + 2 * s, 3.5 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 10 * s, cy + 2 * s, 3.5 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ============================================================
// PLUSHIE FLOWER CHAIN ICON FUNCTIONS
// Each tier is a round squishy plushie CHARACTER with 3D depth.
// The flower identity is an accessory/feature on the character.
// Inspired by Molang, Sumikko Gurashi -- puffy toy aesthetic.
// ============================================================

// --- Shared plushie rendering helpers (exported for use by chain files) ---

/** Draw a puffy 3D plushie body with multi-layer gradients */
export function drawPlushieBody(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  baseColor: string, highlightColor: string, shadowColor: string
): void {
  // 1. Base body with 3D radial gradient (light from top-left)
  const bodyGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
  bodyGrad.addColorStop(0, highlightColor);
  bodyGrad.addColorStop(0.6, baseColor);
  bodyGrad.addColorStop(1, shadowColor);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. Specular highlight (top-left shiny spot)
  const specGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx - r * 0.3, cy - r * 0.3, r * 0.5);
  specGrad.addColorStop(0, 'rgba(255,255,255,0.45)');
  specGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 3. Rim light (subtle bright arc on upper edge)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.95, -Math.PI * 0.7, -Math.PI * 0.2);
  ctx.stroke();
}

/** Draw big shiny Molang-style eyes */
export function drawPlushieEyes(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  style: 'normal' | 'wide' | 'gentle' | 'sparkle' = 'normal'
): void {
  const eyeSpacing = r * 0.32;
  const eyeR = r * 0.14;

  for (const side of [-1, 1]) {
    const ex = cx + side * eyeSpacing;
    const ey = cy - r * 0.05;

    if (style === 'sparkle') {
      // Star-shaped sparkle eyes
      ctx.fillStyle = '#2C1810';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const sr = i % 2 === 0 ? eyeR * 1.1 : eyeR * 0.4;
        const px = ex + Math.cos(angle) * sr;
        const py = ey + Math.sin(angle) * sr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // Bright reflection
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex + eyeR * 0.2, ey - eyeR * 0.3, eyeR * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex - eyeR * 0.2, ey + eyeR * 0.2, eyeR * 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // White of eye
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      const vStretch = style === 'wide' ? 1.2 : style === 'gentle' ? 1.0 : 1.1;
      ctx.ellipse(ex, ey, eyeR, eyeR * vStretch, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark pupil (large, fills most of eye)
      ctx.fillStyle = '#2C1810';
      ctx.beginPath();
      ctx.arc(ex, ey + eyeR * 0.1, eyeR * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // Primary reflection dot (top-right)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex + eyeR * 0.22, ey - eyeR * 0.22, eyeR * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Secondary smaller reflection (bottom-left)
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(ex - eyeR * 0.15, ey + eyeR * 0.3, eyeR * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Draw rosy cheek blush on plushie */
export function drawPlushieBlush(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  opacity: number = 0.3
): void {
  const blushY = cy + r * 0.15;
  ctx.save();
  ctx.globalAlpha = opacity;
  for (const side of [-1, 1]) {
    const bx = cx + side * r * 0.42;
    ctx.fillStyle = 'rgba(255,150,150,1)';
    ctx.beginPath();
    ctx.ellipse(bx, blushY, r * 0.14, r * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Draw a tiny plushie mouth */
export function drawPlushieMouth(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  style: 'smile' | 'dot' | 'open' | 'cat' = 'smile'
): void {
  const my = cy + r * 0.22;
  ctx.strokeStyle = '#5D3A2E';
  ctx.lineWidth = r * 0.04;
  ctx.lineCap = 'round';

  if (style === 'dot') {
    ctx.fillStyle = '#5D3A2E';
    ctx.beginPath();
    ctx.arc(cx, my, r * 0.03, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'open') {
    ctx.fillStyle = '#FF8FA3';
    ctx.beginPath();
    ctx.ellipse(cx, my, r * 0.08, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5D3A2E';
    ctx.beginPath();
    ctx.ellipse(cx, my, r * 0.08, r * 0.06, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style === 'cat') {
    // w-shaped cat mouth
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.08, my);
    ctx.quadraticCurveTo(cx - r * 0.04, my + r * 0.05, cx, my);
    ctx.quadraticCurveTo(cx + r * 0.04, my + r * 0.05, cx + r * 0.08, my);
    ctx.stroke();
  } else {
    // Simple curved smile
    ctx.beginPath();
    ctx.arc(cx, my - r * 0.03, r * 0.07, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
}

// ===================== BUTTERFLY CHAIN =====================

// --- T1 Egg: Cream plushie with eggshell fragment on head ---
function drawPlushieEggIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - soft cream
  drawPlushieBody(ctx, cx, bodyCy, r, '#BCAAA4', '#D7CCC8', '#9E8E82');

  // Eggshell fragment on top of head
  ctx.save();
  ctx.fillStyle = '#EFEBE9';
  ctx.strokeStyle = '#D7CCC8';
  ctx.lineWidth = r * 0.03;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.25, bodyCy - r * 0.75);
  ctx.lineTo(cx - r * 0.2, bodyCy - r * 1.05);
  ctx.lineTo(cx - r * 0.08, bodyCy - r * 0.85);
  ctx.lineTo(cx + r * 0.05, bodyCy - r * 1.1);
  ctx.lineTo(cx + r * 0.15, bodyCy - r * 0.82);
  ctx.lineTo(cx + r * 0.25, bodyCy - r * 0.98);
  ctx.lineTo(cx + r * 0.28, bodyCy - r * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Caterpillar: Soft green body with tiny antennae ---
function drawPlushieCaterpillarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - soft green
  drawPlushieBody(ctx, cx, bodyCy, r, '#8BC34A', '#AED581', '#689F38');

  // Two antennae on top
  ctx.save();
  ctx.strokeStyle = '#558B2F';
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = 'round';
  // Left antenna
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.2, bodyCy - r * 0.85);
  ctx.quadraticCurveTo(cx - r * 0.3, bodyCy - r * 1.2, cx - r * 0.25, bodyCy - r * 1.3);
  ctx.stroke();
  // Left antenna ball
  ctx.fillStyle = '#CDDC39';
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, bodyCy - r * 1.33, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // Right antenna
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.2, bodyCy - r * 0.85);
  ctx.quadraticCurveTo(cx + r * 0.3, bodyCy - r * 1.2, cx + r * 0.25, bodyCy - r * 1.3);
  ctx.stroke();
  // Right antenna ball
  ctx.fillStyle = '#CDDC39';
  ctx.beginPath();
  ctx.arc(cx + r * 0.25, bodyCy - r * 1.33, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T3 Bee: Yellow body with brown stripes and small wings ---
function drawPlushieBeeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - warm yellow
  drawPlushieBody(ctx, cx, bodyCy, r, '#FFC107', '#FFE082', '#FFA000');

  // Two brown horizontal stripes across the body
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#795548';
  // Upper stripe
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy - r * 0.15, r * 0.85, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lower stripe
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 0.2, r * 0.8, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Small wings on sides
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#FFFFFF';
  // Left wing
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.85, bodyCy - r * 0.3, r * 0.3, r * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.85, bodyCy - r * 0.3, r * 0.3, r * 0.18, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.28);
}

// --- T4 Ladybug: Red body with black dots and small antennae ---
function drawPlushieLadybugIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - vibrant red
  drawPlushieBody(ctx, cx, bodyCy, r, '#F44336', '#EF9A9A', '#C62828');

  // Black dots on the body (3 visible)
  ctx.fillStyle = '#37474F';
  const dots = [
    { x: -0.3, y: -0.25 },
    { x: 0.25, y: -0.15 },
    { x: -0.1, y: 0.3 },
    { x: 0.3, y: 0.35 },
  ];
  for (const d of dots) {
    ctx.beginPath();
    ctx.arc(cx + r * d.x, bodyCy + r * d.y, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Small antennae
  ctx.save();
  ctx.strokeStyle = '#37474F';
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.15, bodyCy - r * 0.9);
  ctx.lineTo(cx - r * 0.25, bodyCy - r * 1.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.15, bodyCy - r * 0.9);
  ctx.lineTo(cx + r * 0.25, bodyCy - r * 1.15);
  ctx.stroke();
  // Antenna tips
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, bodyCy - r * 1.15, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.25, bodyCy - r * 1.15, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T5 Butterfly: Purple body with colorful symmetrical wings ---
function drawPlushieButterflyIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings behind body (draw BEFORE body)
  ctx.save();
  for (const side of [-1, 1]) {
    // Upper wing
    const uwGrad = ctx.createRadialGradient(
      cx + side * r * 0.7, bodyCy - r * 0.3, 0,
      cx + side * r * 0.7, bodyCy - r * 0.3, r * 0.5
    );
    uwGrad.addColorStop(0, '#CE93D8');
    uwGrad.addColorStop(1, '#AB47BC');
    ctx.fillStyle = uwGrad;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(cx + side * r * 0.75, bodyCy - r * 0.25, r * 0.45, r * 0.35, side * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Lower wing (smaller)
    ctx.fillStyle = '#F48FB1';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(cx + side * r * 0.65, bodyCy + r * 0.25, r * 0.3, r * 0.22, side * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Plushie body - lavender
  drawPlushieBody(ctx, cx, bodyCy, r, '#7C4DFF', '#B388FF', '#5E35B1');

  // Small antennae
  ctx.save();
  ctx.strokeStyle = '#5E35B1';
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.12, bodyCy - r * 0.9);
  ctx.quadraticCurveTo(cx - r * 0.25, bodyCy - r * 1.25, cx - r * 0.18, bodyCy - r * 1.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.12, bodyCy - r * 0.9);
  ctx.quadraticCurveTo(cx + r * 0.25, bodyCy - r * 1.25, cx + r * 0.18, bodyCy - r * 1.3);
  ctx.stroke();
  ctx.fillStyle = '#CE93D8';
  ctx.beginPath();
  ctx.arc(cx - r * 0.18, bodyCy - r * 1.33, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.18, bodyCy - r * 1.33, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T6 Peacock: Teal body with elaborate tail fan, gold accents ---
function drawPlushiePeacockIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail fan behind body (5 feathers in arc)
  ctx.save();
  const featherAngles = [-0.5, -0.25, 0, 0.25, 0.5];
  for (let i = 0; i < featherAngles.length; i++) {
    const angle = featherAngles[i];
    const fx = cx + Math.sin(angle) * r * 1.1;
    const fy = bodyCy - Math.cos(angle) * r * 1.1;

    // Feather shaft
    ctx.strokeStyle = '#00897B';
    ctx.lineWidth = r * 0.04;
    ctx.beginPath();
    ctx.moveTo(cx, bodyCy - r * 0.5);
    ctx.lineTo(fx, fy);
    ctx.stroke();

    // Eye-spot at tip
    ctx.fillStyle = '#004D40';
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00BCD4';
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
    // Gold center dot
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Plushie body - teal
  drawPlushieBody(ctx, cx, bodyCy, r, '#00BCD4', '#80DEEA', '#00838F');

  // Small crown / crest on top (3 gold feather tips)
  ctx.save();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = 'round';
  const crests = [-0.15, 0, 0.15];
  for (const offsetX of crests) {
    ctx.beginPath();
    ctx.moveTo(cx + r * offsetX, bodyCy - r * 0.85);
    ctx.lineTo(cx + r * offsetX, bodyCy - r * 1.15);
    ctx.stroke();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx + r * offsetX, bodyCy - r * 1.18, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}


// ===================== FRUIT CHAIN =====================

// --- T1 Grapes: Purple body with tiny grape cluster on head ---
function drawPlushieGrapesIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - purple
  drawPlushieBody(ctx, cx, bodyCy, r, '#7B1FA2', '#CE93D8', '#4A148C');

  // Tiny grape cluster on head (4 small circles)
  ctx.save();
  const grapeColor = '#9C27B0';
  const grapeHighlight = '#E1BEE7';
  const grapeR = r * 0.1;
  const gx = cx;
  const gy = bodyCy - r * 1.0;
  const grapePositions = [
    { x: -0.08, y: 0 },
    { x: 0.08, y: 0 },
    { x: 0, y: -0.14 },
    { x: 0, y: 0.12 },
  ];
  for (const gp of grapePositions) {
    ctx.fillStyle = grapeColor;
    ctx.beginPath();
    ctx.arc(gx + r * gp.x, gy + r * gp.y, grapeR, 0, Math.PI * 2);
    ctx.fill();
    // Tiny highlight
    ctx.fillStyle = grapeHighlight;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(gx + r * gp.x - grapeR * 0.3, gy + r * gp.y - grapeR * 0.3, grapeR * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Tiny stem
  ctx.strokeStyle = '#4E342E';
  ctx.lineWidth = r * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(gx, gy - r * 0.18);
  ctx.lineTo(gx, gy - r * 0.3);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Apple: Red body with small green leaf on top ---
function drawPlushieAppleIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - red
  drawPlushieBody(ctx, cx, bodyCy, r, '#F44336', '#EF9A9A', '#C62828');

  // Stem and leaf on top
  ctx.save();
  // Stem
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = r * 0.07;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, bodyCy - r * 0.9);
  ctx.lineTo(cx, bodyCy - r * 1.15);
  ctx.stroke();
  // Leaf
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.12, bodyCy - r * 1.12, r * 0.15, r * 0.08, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.28);
}

// --- T3 Orange: Orange body with small green leaf/stem on top ---
function drawPlushieOrangeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - orange
  drawPlushieBody(ctx, cx, bodyCy, r, '#FF9800', '#FFE0B2', '#E65100');

  // Small green leaf and stem on top
  ctx.save();
  // Stem
  ctx.strokeStyle = '#4E342E';
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, bodyCy - r * 0.9);
  ctx.lineTo(cx, bodyCy - r * 1.08);
  ctx.stroke();
  // Leaf
  ctx.fillStyle = '#43A047';
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.1, bodyCy - r * 1.05, r * 0.14, r * 0.07, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.28);
}

// --- T4 Kiwi: Brown-green body with kiwi slice on head ---
function drawPlushieKiwiIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - brown-green
  drawPlushieBody(ctx, cx, bodyCy, r, '#8BC34A', '#C5E1A5', '#558B2F');

  // Kiwi slice on head
  ctx.save();
  const kx = cx + r * 0.05;
  const ky = bodyCy - r * 1.0;
  const sliceR = r * 0.22;
  // Outer brown ring
  ctx.fillStyle = '#795548';
  ctx.beginPath();
  ctx.arc(kx, ky, sliceR, 0, Math.PI * 2);
  ctx.fill();
  // Green interior
  ctx.fillStyle = '#8BC34A';
  ctx.beginPath();
  ctx.arc(kx, ky, sliceR * 0.8, 0, Math.PI * 2);
  ctx.fill();
  // White center
  ctx.fillStyle = '#F1F8E9';
  ctx.beginPath();
  ctx.arc(kx, ky, sliceR * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Seed dots radiating from center
  ctx.fillStyle = '#33691E';
  for (let i = 0; i < 6; i++) {
    const seedAngle = (i / 6) * Math.PI * 2;
    const sx = kx + Math.cos(seedAngle) * sliceR * 0.55;
    const sy = ky + Math.sin(seedAngle) * sliceR * 0.55;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T5 Mango: Golden-orange body with small leaf on stem ---
function drawPlushieMangoIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - golden orange
  drawPlushieBody(ctx, cx, bodyCy, r, '#FF9800', '#FFCC80', '#E65100');

  // Stem and leaf on top
  ctx.save();
  // Stem
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.05, bodyCy - r * 0.88);
  ctx.lineTo(cx + r * 0.05, bodyCy - r * 1.1);
  ctx.stroke();
  // Leaf
  ctx.fillStyle = '#43A047';
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.18, bodyCy - r * 1.08, r * 0.16, r * 0.07, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Subtle warm blush on the body (mango "rosy cheek" gradient)
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#FF5722';
  ctx.beginPath();
  ctx.arc(cx + r * 0.3, bodyCy - r * 0.15, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T6 Peach: Soft pink body with heart-shaped leaf, extra rosy blush ---
function drawPlushiePeachIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - soft peach/pink
  drawPlushieBody(ctx, cx, bodyCy, r, '#FF8A65', '#FFCCBC', '#E64A19');

  // Stem on top
  ctx.save();
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, bodyCy - r * 0.9);
  ctx.lineTo(cx, bodyCy - r * 1.12);
  ctx.stroke();

  // Heart-shaped leaf
  const hx = cx + r * 0.02;
  const hy = bodyCy - r * 1.18;
  const hs = r * 0.12;
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.8);
  ctx.bezierCurveTo(hx - hs * 1.2, hy - hs * 0.3, hx - hs * 0.3, hy - hs * 1.5, hx, hy - hs * 0.4);
  ctx.bezierCurveTo(hx + hs * 0.3, hy - hs * 1.5, hx + hs * 1.2, hy - hs * 0.3, hx, hy + hs * 0.8);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  // Extra rosy blush for peach
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.45);
}

// --- T7 Cake: Pink body with tiny layered cake hat, strawberry on top, sprinkles ---
function drawPlushieCakeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body - soft pink
  drawPlushieBody(ctx, cx, bodyCy, r, '#F48FB1', '#F8BBD0', '#EC407A');

  // Sprinkle dots on the body
  ctx.save();
  const sprinkleColors = ['#FF5722', '#FFEB3B', '#4CAF50', '#2196F3', '#FF9800'];
  const sprinkles = [
    { x: -0.35, y: -0.2 }, { x: 0.38, y: -0.1 },
    { x: -0.25, y: 0.35 }, { x: 0.3, y: 0.3 },
    { x: 0.05, y: 0.45 },
  ];
  for (let i = 0; i < sprinkles.length; i++) {
    ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
    ctx.beginPath();
    ctx.arc(cx + r * sprinkles[i].x, bodyCy + r * sprinkles[i].y, r * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Tiny layered cake hat on head
  ctx.save();
  const cakeX = cx;
  const cakeBaseY = bodyCy - r * 0.85;

  // Bottom layer (wider)
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.roundRect(cakeX - r * 0.25, cakeBaseY - r * 0.12, r * 0.5, r * 0.16, r * 0.03);
  ctx.fill();
  // Frosting line
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(cakeX - r * 0.27, cakeBaseY - r * 0.15, r * 0.54, r * 0.06, r * 0.02);
  ctx.fill();

  // Top layer (narrower)
  ctx.fillStyle = '#FFE0B2';
  ctx.beginPath();
  ctx.roundRect(cakeX - r * 0.18, cakeBaseY - r * 0.32, r * 0.36, r * 0.2, r * 0.03);
  ctx.fill();
  // Pink frosting on top
  ctx.fillStyle = '#F48FB1';
  ctx.beginPath();
  ctx.roundRect(cakeX - r * 0.2, cakeBaseY - r * 0.35, r * 0.4, r * 0.06, r * 0.02);
  ctx.fill();

  // Tiny strawberry on very top
  ctx.fillStyle = '#F44336';
  ctx.beginPath();
  ctx.arc(cakeX, cakeBaseY - r * 0.42, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // Strawberry leaf
  ctx.fillStyle = '#43A047';
  ctx.beginPath();
  ctx.ellipse(cakeX, cakeBaseY - r * 0.48, r * 0.05, r * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}



// --- CRYSTAL CHAIN CONFIG ---
// { draw: drawPlushieDropletIcon, color: '#42A5F5', accent: '#BBDEFB' },    // t1 Droplet plushie
// { draw: drawPlushieIceIcon, color: '#B3E5FC', accent: '#E1F5FE' },       // t2 Ice plushie
// { draw: drawPlushieCrystalBallIcon, color: '#9C27B0', accent: '#E1BEE7' }, // t3 Crystal Ball plushie
// { draw: drawPlushieDiamondIcon, color: '#00BCD4', accent: '#B2EBF2' },    // t4 Diamond plushie
// { draw: drawPlushieCrownIcon, color: '#FFD700', accent: '#FFF8E1' },      // t5 Crown plushie
//
// --- NATURE CHAIN CONFIG ---
// { draw: drawPlushieLeafIcon, color: '#8D6E63', accent: '#D7CCC8' },       // t1 Leaf plushie
// { draw: drawPlushieMapleLeafIcon, color: '#E65100', accent: '#FFE0B2' },   // t2 Maple Leaf plushie
// { draw: drawPlushiePineIcon, color: '#2E7D32', accent: '#C8E6C9' },       // t3 Pine plushie
// { draw: drawPlushieTreeIcon, color: '#388E3C', accent: '#A5D6A7' },       // t4 Tree plushie
// { draw: drawPlushiePalmIcon, color: '#43A047', accent: '#C8E6C9' },       // t5 Palm plushie
// { draw: drawPlushieCottageIcon, color: '#8D6E63', accent: '#EFEBE9' },    // t6 Cottage plushie
//
// --- STAR CHAIN CONFIG ---
// { draw: drawPlushieStarIcon, color: '#FFD54F', accent: '#FFF9C4' },       // t1 Star plushie
// { draw: drawPlushieGlowingStarIcon, color: '#FFD700', accent: '#FFF8E1' }, // t2 Glowing Star plushie
// { draw: drawPlushieSparklesIcon, color: '#FFC107', accent: '#FFF8E1' },   // t3 Sparkles plushie
// { draw: drawPlushieShootingStarIcon, color: '#FF9800', accent: '#FFE0B2' }, // t4 Shooting Star plushie
// { draw: drawPlushieMoonIcon, color: '#FDD835', accent: '#FFF9C4' },       // t5 Moon plushie
// { draw: drawPlushieRainbowIcon, color: '#FF5252', accent: '#FFFFFF' },    // t6 Rainbow plushie
// =============================================================================

// Helpers used (already defined in EmojiRenderer.ts):
// drawPlushieBody, drawPlushieEyes, drawPlushieMouth, drawPlushieBlush, addTierSparkles

// =============================================================================
// CRYSTAL CHAIN (5 tiers)
// =============================================================================

// --- T1 Droplet: Light blue plushie with teardrop on head ---
function drawPlushieDropletIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#42A5F5', '#90CAF9', '#1E88E5');

  // Teardrop on head
  ctx.save();
  const dropX = cx;
  const dropY = bodyCy - r * 1.0;
  const dropGrad = ctx.createRadialGradient(dropX - r * 0.03, dropY - r * 0.05, 0, dropX, dropY, r * 0.2);
  dropGrad.addColorStop(0, '#E3F2FD');
  dropGrad.addColorStop(0.6, '#64B5F6');
  dropGrad.addColorStop(1, '#1E88E5');
  ctx.fillStyle = dropGrad;
  ctx.beginPath();
  ctx.moveTo(dropX, dropY - r * 0.28);
  ctx.quadraticCurveTo(dropX + r * 0.15, dropY - r * 0.05, dropX + r * 0.12, dropY + r * 0.06);
  ctx.arc(dropX, dropY + r * 0.06, r * 0.12, 0, Math.PI, false);
  ctx.quadraticCurveTo(dropX - r * 0.15, dropY - r * 0.05, dropX, dropY - r * 0.28);
  ctx.fill();
  // Tiny highlight on droplet
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(dropX - r * 0.03, dropY - r * 0.06, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Ice: Pale blue plushie with small ice crystal facets on head ---
function drawPlushieIceIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#B3E5FC', '#E1F5FE', '#81D4FA');

  // Ice crystal facets on head (3 small hexagonal shards)
  ctx.save();
  const crystals = [
    { x: cx - r * 0.15, y: bodyCy - r * 0.95, rot: -0.3, s: 0.8 },
    { x: cx + r * 0.1, y: bodyCy - r * 1.05, rot: 0.2, s: 1.0 },
    { x: cx + r * 0.28, y: bodyCy - r * 0.85, rot: 0.5, s: 0.65 },
  ];
  crystals.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    const cH = r * 0.22 * c.s;
    const cW = r * 0.1 * c.s;
    // Diamond/shard shape
    const shardGrad = ctx.createLinearGradient(0, -cH, 0, cH);
    shardGrad.addColorStop(0, '#E1F5FE');
    shardGrad.addColorStop(0.4, '#B3E5FC');
    shardGrad.addColorStop(1, '#4FC3F7');
    ctx.fillStyle = shardGrad;
    ctx.beginPath();
    ctx.moveTo(0, -cH);
    ctx.lineTo(cW, -cH * 0.2);
    ctx.lineTo(cW * 0.7, cH);
    ctx.lineTo(-cW * 0.7, cH);
    ctx.lineTo(-cW, -cH * 0.2);
    ctx.closePath();
    ctx.fill();
    // Highlight edge
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = r * 0.02;
    ctx.beginPath();
    ctx.moveTo(0, -cH);
    ctx.lineTo(cW, -cH * 0.2);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T3 Crystal Ball: Purple plushie with tiny crystal ball on head with glow ---
function drawPlushieCrystalBallIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#9C27B0', '#CE93D8', '#7B1FA2');

  // Crystal ball on head
  ctx.save();
  const ballCx = cx;
  const ballCy = bodyCy - r * 0.95;
  const ballR = r * 0.22;

  // Glow behind ball
  const glowGrad = ctx.createRadialGradient(ballCx, ballCy, ballR * 0.3, ballCx, ballCy, ballR * 2.0);
  glowGrad.addColorStop(0, 'rgba(186,104,200,0.3)');
  glowGrad.addColorStop(1, 'rgba(186,104,200,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(ballCx, ballCy, ballR * 2.0, 0, Math.PI * 2);
  ctx.fill();

  // Ball body
  const ballGrad = ctx.createRadialGradient(ballCx - ballR * 0.25, ballCy - ballR * 0.25, 0, ballCx, ballCy, ballR);
  ballGrad.addColorStop(0, '#E1BEE7');
  ballGrad.addColorStop(0.5, '#BA68C8');
  ballGrad.addColorStop(1, '#7B1FA2');
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(ballCx, ballCy, ballR, 0, Math.PI * 2);
  ctx.fill();

  // Specular highlight on ball
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(ballCx - ballR * 0.25, ballCy - ballR * 0.2, ballR * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Small base under ball
  ctx.fillStyle = '#6A1B9A';
  ctx.beginPath();
  ctx.ellipse(ballCx, ballCy + ballR * 0.9, ballR * 0.6, ballR * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T4 Diamond: Cyan/teal plushie with diamond shape on head ---
function drawPlushieDiamondIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#00BCD4', '#80DEEA', '#00838F');

  // Diamond on head
  ctx.save();
  const dCx = cx;
  const dCy = bodyCy - r * 0.95;
  const dH = r * 0.35;
  const dW = r * 0.25;

  // Diamond shape (top half + bottom point)
  // Top facet (left)
  const facetGrad1 = ctx.createLinearGradient(dCx - dW, dCy - dH * 0.1, dCx, dCy - dH);
  facetGrad1.addColorStop(0, '#4DD0E1');
  facetGrad1.addColorStop(1, '#E0F7FA');
  ctx.fillStyle = facetGrad1;
  ctx.beginPath();
  ctx.moveTo(dCx, dCy - dH);
  ctx.lineTo(dCx - dW, dCy - dH * 0.1);
  ctx.lineTo(dCx, dCy - dH * 0.1);
  ctx.closePath();
  ctx.fill();

  // Top facet (right)
  const facetGrad2 = ctx.createLinearGradient(dCx, dCy - dH, dCx + dW, dCy - dH * 0.1);
  facetGrad2.addColorStop(0, '#B2EBF2');
  facetGrad2.addColorStop(1, '#26C6DA');
  ctx.fillStyle = facetGrad2;
  ctx.beginPath();
  ctx.moveTo(dCx, dCy - dH);
  ctx.lineTo(dCx + dW, dCy - dH * 0.1);
  ctx.lineTo(dCx, dCy - dH * 0.1);
  ctx.closePath();
  ctx.fill();

  // Bottom facet (left)
  const facetGrad3 = ctx.createLinearGradient(dCx - dW, dCy - dH * 0.1, dCx, dCy + dH * 0.5);
  facetGrad3.addColorStop(0, '#26C6DA');
  facetGrad3.addColorStop(1, '#00838F');
  ctx.fillStyle = facetGrad3;
  ctx.beginPath();
  ctx.moveTo(dCx - dW, dCy - dH * 0.1);
  ctx.lineTo(dCx, dCy - dH * 0.1);
  ctx.lineTo(dCx, dCy + dH * 0.5);
  ctx.closePath();
  ctx.fill();

  // Bottom facet (right)
  const facetGrad4 = ctx.createLinearGradient(dCx + dW, dCy - dH * 0.1, dCx, dCy + dH * 0.5);
  facetGrad4.addColorStop(0, '#4DD0E1');
  facetGrad4.addColorStop(1, '#00838F');
  ctx.fillStyle = facetGrad4;
  ctx.beginPath();
  ctx.moveTo(dCx + dW, dCy - dH * 0.1);
  ctx.lineTo(dCx, dCy - dH * 0.1);
  ctx.lineTo(dCx, dCy + dH * 0.5);
  ctx.closePath();
  ctx.fill();

  // Highlight flash across diamond
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(dCx - dW * 0.3, dCy - dH * 0.8);
  ctx.lineTo(dCx + dW * 0.1, dCy - dH * 0.8);
  ctx.lineTo(dCx - dW * 0.1, dCy - dH * 0.3);
  ctx.lineTo(dCx - dW * 0.5, dCy - dH * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T5 Crown: Gold plushie with crown on head, gold glow ---
function drawPlushieCrownIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Gold glow aura
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.5);
  auraGrad.addColorStop(0, 'rgba(255,215,0,0.2)');
  auraGrad.addColorStop(0.6, 'rgba(255,215,0,0.08)');
  auraGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.75, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#FFD700', '#FFF176', '#F9A825');

  // Crown on head
  ctx.save();
  const crownCx = cx;
  const crownBase = bodyCy - r * 0.85;
  const crownW = r * 0.4;
  const crownH = r * 0.35;

  // Crown body
  const crownGrad = ctx.createLinearGradient(crownCx - crownW, crownBase, crownCx + crownW, crownBase - crownH);
  crownGrad.addColorStop(0, '#FFD700');
  crownGrad.addColorStop(0.5, '#FFF176');
  crownGrad.addColorStop(1, '#FFD700');
  ctx.fillStyle = crownGrad;
  ctx.beginPath();
  // Base of crown
  ctx.moveTo(crownCx - crownW, crownBase);
  // Left point
  ctx.lineTo(crownCx - crownW * 0.85, crownBase - crownH);
  // Dip between left and center
  ctx.lineTo(crownCx - crownW * 0.4, crownBase - crownH * 0.5);
  // Center point (tallest)
  ctx.lineTo(crownCx, crownBase - crownH * 1.1);
  // Dip between center and right
  ctx.lineTo(crownCx + crownW * 0.4, crownBase - crownH * 0.5);
  // Right point
  ctx.lineTo(crownCx + crownW * 0.85, crownBase - crownH);
  // Right base
  ctx.lineTo(crownCx + crownW, crownBase);
  ctx.closePath();
  ctx.fill();

  // Crown base band
  ctx.fillStyle = '#F9A825';
  ctx.fillRect(crownCx - crownW, crownBase - r * 0.04, crownW * 2, r * 0.08);

  // Gems on crown points
  const gemColors = ['#FF1744', '#2979FF', '#FF1744'];
  const gemPositions = [
    { x: crownCx - crownW * 0.85, y: crownBase - crownH + r * 0.04 },
    { x: crownCx, y: crownBase - crownH * 1.1 + r * 0.04 },
    { x: crownCx + crownW * 0.85, y: crownBase - crownH + r * 0.04 },
  ];
  gemPositions.forEach((g, i) => {
    ctx.fillStyle = gemColors[i];
    ctx.beginPath();
    ctx.arc(g.x, g.y, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // Gem highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(g.x - r * 0.01, g.y - r * 0.015, r * 0.018, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// =============================================================================
// NATURE CHAIN (6 tiers)
// =============================================================================

// --- T1 Leaf: Brown/tan plushie with single leaf on head ---
function drawPlushieLeafIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#8D6E63', '#BCAAA4', '#6D4C41');

  // Single leaf on head
  ctx.save();
  ctx.translate(cx + r * 0.05, bodyCy - r * 0.9);
  // Stem
  ctx.strokeStyle = '#558B2F';
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.12);
  ctx.quadraticCurveTo(r * 0.03, -r * 0.05, 0, -r * 0.18);
  ctx.stroke();
  // Leaf shape
  const leafGrad = ctx.createRadialGradient(0, -r * 0.25, 0, 0, -r * 0.2, r * 0.18);
  leafGrad.addColorStop(0, '#81C784');
  leafGrad.addColorStop(1, '#388E3C');
  ctx.fillStyle = leafGrad;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.26, r * 0.12, r * 0.08, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Leaf vein
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = r * 0.02;
  ctx.beginPath();
  ctx.moveTo(-r * 0.06, -r * 0.26);
  ctx.lineTo(r * 0.06, -r * 0.26);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Maple Leaf: Orange-brown plushie with maple leaf on head ---
function drawPlushieMapleLeafIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#E65100', '#FF8A65', '#BF360C');

  // Maple leaf on head
  ctx.save();
  const mlCx = cx;
  const mlCy = bodyCy - r * 1.0;
  const leafS = r * 0.2;

  // Stem
  ctx.strokeStyle = '#795548';
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(mlCx, mlCy + leafS * 1.5);
  ctx.lineTo(mlCx, mlCy + leafS * 0.3);
  ctx.stroke();

  // Maple leaf (simplified 5-point)
  const mapleGrad = ctx.createRadialGradient(mlCx, mlCy, 0, mlCx, mlCy, leafS * 1.3);
  mapleGrad.addColorStop(0, '#FF6F00');
  mapleGrad.addColorStop(1, '#E65100');
  ctx.fillStyle = mapleGrad;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const outerR = leafS * (i % 2 === 0 ? 1.2 : 0.6);
    const px = mlCx + Math.cos(angle) * outerR;
    const py = mlCy + Math.sin(angle) * outerR;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      // Inner notch
      const midAngle = ((i - 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
      const midR = leafS * 0.35;
      ctx.lineTo(mlCx + Math.cos(midAngle) * midR, mlCy + Math.sin(midAngle) * midR);
      ctx.lineTo(px, py);
    }
  }
  // Close with last notch
  const lastMidAngle = ((-0.5) / 5) * Math.PI * 2 - Math.PI / 2;
  ctx.lineTo(mlCx + Math.cos(lastMidAngle) * leafS * 0.35, mlCy + Math.sin(lastMidAngle) * leafS * 0.35);
  ctx.closePath();
  ctx.fill();

  // Centre vein
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = r * 0.02;
  ctx.beginPath();
  ctx.moveTo(mlCx, mlCy - leafS * 0.9);
  ctx.lineTo(mlCx, mlCy + leafS * 0.3);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T3 Pine: Dark green plushie with small pine tree shape on head ---
function drawPlushiePineIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#2E7D32', '#66BB6A', '#1B5E20');

  // Pine tree on head (3 stacked triangles)
  ctx.save();
  const treeCx = cx;
  const treeBase = bodyCy - r * 0.82;
  const treeW = r * 0.2;

  // Trunk
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(treeCx - r * 0.04, treeBase, r * 0.08, r * 0.12);

  // Three layers of foliage (bottom to top)
  const layers = [
    { y: treeBase - r * 0.02, w: treeW, h: r * 0.18 },
    { y: treeBase - r * 0.15, w: treeW * 0.8, h: r * 0.16 },
    { y: treeBase - r * 0.26, w: treeW * 0.55, h: r * 0.14 },
  ];
  layers.forEach(l => {
    const layerGrad = ctx.createLinearGradient(treeCx - l.w, l.y, treeCx + l.w, l.y - l.h);
    layerGrad.addColorStop(0, '#388E3C');
    layerGrad.addColorStop(0.5, '#43A047');
    layerGrad.addColorStop(1, '#2E7D32');
    ctx.fillStyle = layerGrad;
    ctx.beginPath();
    ctx.moveTo(treeCx, l.y - l.h);
    ctx.lineTo(treeCx + l.w, l.y);
    ctx.lineTo(treeCx - l.w, l.y);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T4 Tree: Green plushie with small round tree canopy on head ---
function drawPlushieTreeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#388E3C', '#66BB6A', '#1B5E20');

  // Tree on head: trunk + round canopy
  ctx.save();
  const treeCx = cx;
  const trunkBase = bodyCy - r * 0.82;

  // Trunk
  ctx.fillStyle = '#795548';
  ctx.fillRect(treeCx - r * 0.04, trunkBase, r * 0.08, r * 0.15);

  // Round canopy
  const canopyCy = trunkBase - r * 0.15;
  const canopyR = r * 0.22;
  const canopyGrad = ctx.createRadialGradient(treeCx - canopyR * 0.2, canopyCy - canopyR * 0.2, 0, treeCx, canopyCy, canopyR);
  canopyGrad.addColorStop(0, '#81C784');
  canopyGrad.addColorStop(0.6, '#4CAF50');
  canopyGrad.addColorStop(1, '#2E7D32');
  ctx.fillStyle = canopyGrad;
  ctx.beginPath();
  ctx.arc(treeCx, canopyCy, canopyR, 0, Math.PI * 2);
  ctx.fill();

  // Canopy highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(treeCx - canopyR * 0.25, canopyCy - canopyR * 0.25, canopyR * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T5 Palm: Bright green plushie with palm frond leaves on head ---
function drawPlushiePalmIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#43A047', '#81C784', '#2E7D32');

  // Palm trunk on head
  ctx.save();
  const palmCx = cx;
  const palmBase = bodyCy - r * 0.85;

  // Curved trunk
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = r * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(palmCx, palmBase + r * 0.05);
  ctx.quadraticCurveTo(palmCx + r * 0.05, palmBase - r * 0.15, palmCx, palmBase - r * 0.25);
  ctx.stroke();

  // Palm fronds (4 drooping leaves)
  const frondTop = palmBase - r * 0.28;
  const fronds = [
    { endX: -r * 0.3, endY: -r * 0.05, cpX: -r * 0.2, cpY: -r * 0.2 },
    { endX: r * 0.3, endY: -r * 0.05, cpX: r * 0.2, cpY: -r * 0.2 },
    { endX: -r * 0.25, endY: -r * 0.18, cpX: -r * 0.18, cpY: -r * 0.28 },
    { endX: r * 0.25, endY: -r * 0.18, cpX: r * 0.18, cpY: -r * 0.28 },
  ];
  fronds.forEach(f => {
    ctx.strokeStyle = '#388E3C';
    ctx.lineWidth = r * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(palmCx, frondTop);
    ctx.quadraticCurveTo(palmCx + f.cpX, frondTop + f.cpY, palmCx + f.endX, frondTop + f.endY);
    ctx.stroke();
    // Leaf fill
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.moveTo(palmCx, frondTop);
    ctx.quadraticCurveTo(palmCx + f.cpX * 0.9, frondTop + f.cpY * 0.9 - r * 0.02, palmCx + f.endX, frondTop + f.endY);
    ctx.quadraticCurveTo(palmCx + f.cpX * 1.1, frondTop + f.cpY * 1.1 + r * 0.02, palmCx, frondTop);
    ctx.fill();
  });
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T6 Cottage: Warm brown plushie with tiny house/cottage on head, warm glow ---
function drawPlushieCottageIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Warm glow aura
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.5);
  auraGrad.addColorStop(0, 'rgba(255,183,77,0.18)');
  auraGrad.addColorStop(0.6, 'rgba(255,183,77,0.06)');
  auraGrad.addColorStop(1, 'rgba(255,183,77,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.75, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#8D6E63', '#BCAAA4', '#5D4037');

  // Cottage on head
  ctx.save();
  const hCx = cx;
  const hBase = bodyCy - r * 0.8;
  const hW = r * 0.28;
  const hH = r * 0.2;
  const roofH = r * 0.2;

  // House body (walls)
  ctx.fillStyle = '#EFEBE9';
  ctx.fillRect(hCx - hW, hBase - hH, hW * 2, hH);

  // Roof (triangle)
  const roofGrad = ctx.createLinearGradient(hCx - hW * 1.1, hBase - hH, hCx + hW * 1.1, hBase - hH - roofH);
  roofGrad.addColorStop(0, '#D84315');
  roofGrad.addColorStop(1, '#FF5722');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.moveTo(hCx, hBase - hH - roofH);
  ctx.lineTo(hCx - hW * 1.15, hBase - hH);
  ctx.lineTo(hCx + hW * 1.15, hBase - hH);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = '#795548';
  ctx.fillRect(hCx - r * 0.04, hBase - hH * 0.55, r * 0.08, hH * 0.55);

  // Window (left side of door, tiny yellow glow)
  ctx.fillStyle = '#FFF9C4';
  ctx.fillRect(hCx - hW * 0.7, hBase - hH * 0.7, r * 0.08, r * 0.06);
  // Window glow
  const winGlow = ctx.createRadialGradient(hCx - hW * 0.66, hBase - hH * 0.67, 0, hCx - hW * 0.66, hBase - hH * 0.67, r * 0.1);
  winGlow.addColorStop(0, 'rgba(255,249,196,0.4)');
  winGlow.addColorStop(1, 'rgba(255,249,196,0)');
  ctx.fillStyle = winGlow;
  ctx.beginPath();
  ctx.arc(hCx - hW * 0.66, hBase - hH * 0.67, r * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Chimney
  ctx.fillStyle = '#795548';
  ctx.fillRect(hCx + hW * 0.45, hBase - hH - roofH * 0.9, r * 0.07, roofH * 0.5);
  // Chimney top
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(hCx + hW * 0.42, hBase - hH - roofH * 0.9, r * 0.1, r * 0.03);
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// =============================================================================
// STAR CHAIN (6 tiers)
// =============================================================================

// --- T1 Star: Yellow plushie with small 5-point star on head ---
function drawPlushieStarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#FFD54F', '#FFF9C4', '#FFC107');

  // Small 5-point star on head
  ctx.save();
  const starCx = cx;
  const starCy = bodyCy - r * 1.0;
  const starR = r * 0.18;
  const starGrad = ctx.createRadialGradient(starCx, starCy, 0, starCx, starCy, starR);
  starGrad.addColorStop(0, '#FFF9C4');
  starGrad.addColorStop(1, '#FFD54F');
  ctx.fillStyle = starGrad;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const sr = i % 2 === 0 ? starR : starR * 0.4;
    const px = starCx + Math.cos(angle) * sr;
    const py = starCy + Math.sin(angle) * sr;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Glowing Star: Brighter yellow plushie with star and glow rays on head ---
function drawPlushieGlowingStarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#FFD700', '#FFF8E1', '#FBC02D');

  // Glowing star on head
  ctx.save();
  const starCx = cx;
  const starCy = bodyCy - r * 1.0;
  const starR = r * 0.2;

  // Glow behind star
  const glowGrad = ctx.createRadialGradient(starCx, starCy, starR * 0.3, starCx, starCy, starR * 2.5);
  glowGrad.addColorStop(0, 'rgba(255,215,0,0.35)');
  glowGrad.addColorStop(0.5, 'rgba(255,215,0,0.1)');
  glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(starCx, starCy, starR * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Glow rays
  ctx.strokeStyle = 'rgba(255,235,59,0.4)';
  ctx.lineWidth = r * 0.025;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(starCx + Math.cos(angle) * starR * 1.1, starCy + Math.sin(angle) * starR * 1.1);
    ctx.lineTo(starCx + Math.cos(angle) * starR * 1.7, starCy + Math.sin(angle) * starR * 1.7);
    ctx.stroke();
  }

  // Star shape
  const starGrad = ctx.createRadialGradient(starCx, starCy, 0, starCx, starCy, starR);
  starGrad.addColorStop(0, '#FFF8E1');
  starGrad.addColorStop(1, '#FFD700');
  ctx.fillStyle = starGrad;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const sr = i % 2 === 0 ? starR : starR * 0.4;
    const px = starCx + Math.cos(angle) * sr;
    const py = starCy + Math.sin(angle) * sr;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T3 Sparkles: Golden plushie with 3 small sparkle shapes around head ---
function drawPlushieSparklesIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#FFC107', '#FFF8E1', '#FF8F00');

  // 3 sparkle shapes around head
  ctx.save();
  const sparkles = [
    { x: cx - r * 0.35, y: bodyCy - r * 0.95, s: 0.8 },
    { x: cx + r * 0.1, y: bodyCy - r * 1.15, s: 1.0 },
    { x: cx + r * 0.4, y: bodyCy - r * 0.8, s: 0.65 },
  ];
  sparkles.forEach(sp => {
    const spR = r * 0.1 * sp.s;
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    // 4-point sparkle
    ctx.moveTo(sp.x, sp.y - spR * 2);
    ctx.quadraticCurveTo(sp.x + spR * 0.3, sp.y - spR * 0.3, sp.x + spR * 2, sp.y);
    ctx.quadraticCurveTo(sp.x + spR * 0.3, sp.y + spR * 0.3, sp.x, sp.y + spR * 2);
    ctx.quadraticCurveTo(sp.x - spR * 0.3, sp.y + spR * 0.3, sp.x - spR * 2, sp.y);
    ctx.quadraticCurveTo(sp.x - spR * 0.3, sp.y - spR * 0.3, sp.x, sp.y - spR * 2);
    ctx.fill();
    // White centre
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, spR * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T4 Shooting Star: Orange-gold plushie with shooting star and trail on head ---
function drawPlushieShootingStarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#FF9800', '#FFE0B2', '#E65100');

  // Shooting star with trail on head
  ctx.save();
  const starCx = cx + r * 0.15;
  const starCy = bodyCy - r * 1.0;
  const starR = r * 0.15;

  // Trail (fading arc behind the star)
  ctx.save();
  const trailGrad = ctx.createLinearGradient(starCx - r * 0.5, starCy + r * 0.1, starCx, starCy);
  trailGrad.addColorStop(0, 'rgba(255,152,0,0)');
  trailGrad.addColorStop(0.5, 'rgba(255,183,77,0.3)');
  trailGrad.addColorStop(1, 'rgba(255,213,79,0.5)');
  ctx.strokeStyle = trailGrad;
  ctx.lineWidth = r * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(starCx - r * 0.55, starCy + r * 0.15);
  ctx.quadraticCurveTo(starCx - r * 0.25, starCy + r * 0.05, starCx - starR * 0.5, starCy);
  ctx.stroke();
  // Second thinner trail line
  ctx.strokeStyle = 'rgba(255,235,59,0.25)';
  ctx.lineWidth = r * 0.04;
  ctx.beginPath();
  ctx.moveTo(starCx - r * 0.45, starCy + r * 0.22);
  ctx.quadraticCurveTo(starCx - r * 0.2, starCy + r * 0.1, starCx - starR * 0.3, starCy + r * 0.02);
  ctx.stroke();
  ctx.restore();

  // Star
  const sGrad = ctx.createRadialGradient(starCx, starCy, 0, starCx, starCy, starR);
  sGrad.addColorStop(0, '#FFF8E1');
  sGrad.addColorStop(1, '#FF9800');
  ctx.fillStyle = sGrad;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const sr = i % 2 === 0 ? starR : starR * 0.4;
    const px = starCx + Math.cos(angle) * sr;
    const py = starCy + Math.sin(angle) * sr;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T5 Moon: Pale yellow plushie with crescent moon on head, soft glow ---
function drawPlushieMoonIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Soft moon glow aura
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.4);
  auraGrad.addColorStop(0, 'rgba(253,216,53,0.15)');
  auraGrad.addColorStop(0.6, 'rgba(253,216,53,0.05)');
  auraGrad.addColorStop(1, 'rgba(253,216,53,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPlushieBody(ctx, cx, bodyCy, r, '#FDD835', '#FFF9C4', '#F9A825');

  // Crescent moon on head (drawn with two arcs, no composite ops)
  ctx.save();
  const mCx = cx;
  const mCy = bodyCy - r * 0.98;
  const mR = r * 0.22;
  // Inner cutout circle offset/radius
  const cutX = mCx + mR * 0.4;
  const cutY = mCy - mR * 0.15;
  const cutR = mR * 0.72;

  // Calculate intersection angles between the two circles for a clean crescent path
  // Outer arc (clockwise) then inner arc (counter-clockwise)
  const moonGrad = ctx.createRadialGradient(mCx - mR * 0.3, mCy - mR * 0.3, 0, mCx, mCy, mR);
  moonGrad.addColorStop(0, '#FFF9C4');
  moonGrad.addColorStop(0.5, '#FDD835');
  moonGrad.addColorStop(1, '#F9A825');
  ctx.fillStyle = moonGrad;

  // Draw crescent: outer circle CW, then inner circle CCW to subtract
  ctx.beginPath();
  ctx.arc(mCx, mCy, mR, 0, Math.PI * 2); // outer moon
  ctx.arc(cutX, cutY, cutR, 0, Math.PI * 2, true); // inner cutout (counter-clockwise = hole)
  ctx.fill();

  // Highlight on crescent edge
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(mCx - mR * 0.35, mCy - mR * 0.1, mR * 0.2, 0, Math.PI * 2);
  // Also cut this highlight with the same inner circle
  ctx.arc(cutX, cutY, cutR, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T6 Rainbow: White/pastel plushie with rainbow arc on head, rainbow accents ---
function drawPlushieRainbowIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Rainbow glow aura
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.5);
  auraGrad.addColorStop(0, 'rgba(255,82,82,0.12)');
  auraGrad.addColorStop(0.3, 'rgba(255,193,7,0.08)');
  auraGrad.addColorStop(0.6, 'rgba(76,175,80,0.06)');
  auraGrad.addColorStop(1, 'rgba(33,150,243,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.75, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body with pastel rainbow gradient
  const bodyGrad = ctx.createLinearGradient(cx - r, bodyCy - r, cx + r, bodyCy + r);
  bodyGrad.addColorStop(0, '#FFCDD2');
  bodyGrad.addColorStop(0.2, '#FFE0B2');
  bodyGrad.addColorStop(0.4, '#FFF9C4');
  bodyGrad.addColorStop(0.6, '#C8E6C9');
  bodyGrad.addColorStop(0.8, '#BBDEFB');
  bodyGrad.addColorStop(1, '#E1BEE7');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.fill();

  // 3D depth overlay on body
  const depthGrad = ctx.createRadialGradient(cx - r * 0.2, bodyCy - r * 0.2, r * 0.1, cx, bodyCy, r);
  depthGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
  depthGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
  depthGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = depthGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.fill();

  // Specular highlight
  const specGrad = ctx.createRadialGradient(cx - r * 0.3, bodyCy - r * 0.3, 0, cx - r * 0.3, bodyCy - r * 0.3, r * 0.5);
  specGrad.addColorStop(0, 'rgba(255,255,255,0.45)');
  specGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.fill();

  // Rim light
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 0.95, -Math.PI * 0.7, -Math.PI * 0.2);
  ctx.stroke();

  // Rainbow arc on head
  ctx.save();
  const arcCx = cx;
  const arcCy = bodyCy - r * 0.8;
  const arcR = r * 0.32;
  const rainbowColors = ['#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'];

  rainbowColors.forEach((color, i) => {
    const bandR = arcR - i * (r * 0.035);
    if (bandR > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = r * 0.04;
      ctx.beginPath();
      ctx.arc(arcCx, arcCy, bandR, Math.PI, 0);
      ctx.stroke();
    }
  });

  // Tiny clouds at rainbow ends
  for (const side of [-1, 1]) {
    const cloudX = arcCx + side * arcR;
    const cloudY = arcCy;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cloudX + side * r * 0.04, cloudY + r * 0.02, r * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

//   tea: [
//     { draw: drawPlushieTeaLeafIcon, color: '#689F38', accent: '#AED581' },        // t1 Tea Leaf plushie
//     { draw: drawPlushieMatchaIcon, color: '#689F38', accent: '#C5E1A5' },         // t2 Matcha plushie
//     { draw: drawPlushieCoffeeIcon, color: '#795548', accent: '#D7CCC8' },         // t3 Coffee plushie
//     { draw: drawPlushieBobaTeaIcon, color: '#8D6E63', accent: '#BCAAA4' },        // t4 Boba Tea plushie
//     { draw: drawPlushieCakeSliceIcon, color: '#F8BBD0', accent: '#FCE4EC' },      // t5 Cake Slice plushie
//     { draw: drawPlushieTeaSetIcon, color: '#A1887F', accent: '#D7CCC8' },         // t6 Tea Set plushie
//     { draw: drawPlushieTeaHouseIcon, color: '#8D6E63', accent: '#BCAAA4' },       // t7 Tea House plushie
//   ],

// --- T1 Tea Leaf: Soft green body, small rolled tea leaf on head ---
function drawPlushieTeaLeafIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (soft green)
  drawPlushieBody(ctx, cx, bodyCy, r, '#A8C97A', '#C5E0A0', '#8BAF5A');

  // Small rolled tea leaf on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.9);
  ctx.rotate(-0.2);
  const leafGrad = ctx.createLinearGradient(-r * 0.15, 0, r * 0.15, 0);
  leafGrad.addColorStop(0, '#558B2F');
  leafGrad.addColorStop(1, '#7CB342');
  ctx.fillStyle = leafGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.18, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Leaf curl
  ctx.strokeStyle = '#33691E';
  ctx.lineWidth = r * 0.03;
  ctx.beginPath();
  ctx.arc(r * 0.1, 0, r * 0.06, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Matcha: Light green body, tiny matcha cup on head ---
function drawPlushieMatchaIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (light green)
  drawPlushieBody(ctx, cx, bodyCy, r, '#B5D99C', '#D0EEB8', '#94C076');

  // Tiny matcha cup on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.95);
  // Cup body
  ctx.fillStyle = '#E8E0D8';
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, r * 0.05);
  ctx.lineTo(-r * 0.12, -r * 0.12);
  ctx.lineTo(r * 0.12, -r * 0.12);
  ctx.lineTo(r * 0.15, r * 0.05);
  ctx.closePath();
  ctx.fill();
  // Matcha liquid
  ctx.fillStyle = '#8BC34A';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.08, r * 0.11, r * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  // Foam swirl
  ctx.strokeStyle = '#C5E1A5';
  ctx.lineWidth = r * 0.025;
  ctx.beginPath();
  ctx.arc(0, -r * 0.08, r * 0.04, 0, Math.PI * 1.5);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T3 Coffee: Brown body, small coffee cup on head with steam swirl ---
function drawPlushieCoffeeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (warm brown)
  drawPlushieBody(ctx, cx, bodyCy, r, '#A1887F', '#C4AFA8', '#8D7068');

  // Coffee cup on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.95);
  // Cup body (white)
  ctx.fillStyle = '#F5F0EB';
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, r * 0.08);
  ctx.lineTo(-r * 0.12, -r * 0.1);
  ctx.lineTo(r * 0.12, -r * 0.1);
  ctx.lineTo(r * 0.15, r * 0.08);
  ctx.closePath();
  ctx.fill();
  // Coffee liquid
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.06, r * 0.11, r * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  // Steam swirl
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = r * 0.03;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.12);
  ctx.quadraticCurveTo(r * 0.06, -r * 0.2, 0, -r * 0.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.05, -r * 0.14);
  ctx.quadraticCurveTo(-r * 0.02, -r * 0.22, r * 0.04, -r * 0.3);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T4 Boba Tea: Tan/brown body, boba cup on head with straw and dots ---
function drawPlushieBobaTeaIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (warm tan)
  drawPlushieBody(ctx, cx, bodyCy, r, '#C4A882', '#DBBFA0', '#A68B66');

  // Boba cup on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.9);
  // Cup body (clear)
  ctx.fillStyle = 'rgba(255,248,240,0.85)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.14, r * 0.12);
  ctx.lineTo(-r * 0.12, -r * 0.14);
  ctx.lineTo(r * 0.12, -r * 0.14);
  ctx.lineTo(r * 0.14, r * 0.12);
  ctx.closePath();
  ctx.fill();
  // Cup outline
  ctx.strokeStyle = '#BCAAA4';
  ctx.lineWidth = r * 0.02;
  ctx.beginPath();
  ctx.moveTo(-r * 0.14, r * 0.12);
  ctx.lineTo(-r * 0.12, -r * 0.14);
  ctx.lineTo(r * 0.12, -r * 0.14);
  ctx.lineTo(r * 0.14, r * 0.12);
  ctx.closePath();
  ctx.stroke();
  // Boba pearls (small dots at bottom)
  ctx.fillStyle = '#4E342E';
  const bobaPositions = [
    { x: -r * 0.06, y: r * 0.06 },
    { x: r * 0.04, y: r * 0.08 },
    { x: -r * 0.01, y: r * 0.03 },
    { x: r * 0.08, y: r * 0.04 },
  ];
  bobaPositions.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.03, 0, Math.PI * 2);
    ctx.fill();
  });
  // Lid
  ctx.fillStyle = '#D7CCC8';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.14, r * 0.14, r * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  // Straw
  ctx.strokeStyle = '#E91E63';
  ctx.lineWidth = r * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.04, -r * 0.14);
  ctx.lineTo(r * 0.06, -r * 0.32);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T5 Cake Slice: Pink body, triangle cake slice on head with strawberry ---
function drawPlushieCakeSliceIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (soft pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#F8C8D8', '#FFE0EA', '#F0A0B8');

  // Cake slice on head (triangle)
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.92);
  // Cake body (cream/sponge)
  ctx.fillStyle = '#FFF8E1';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.28);
  ctx.lineTo(-r * 0.18, r * 0.04);
  ctx.lineTo(r * 0.18, r * 0.04);
  ctx.closePath();
  ctx.fill();
  // Frosting layer (pink top edge)
  ctx.fillStyle = '#F8BBD0';
  ctx.beginPath();
  ctx.moveTo(-r * 0.16, -r * 0.04);
  ctx.lineTo(r * 0.16, -r * 0.04);
  ctx.lineTo(r * 0.17, r * 0.02);
  ctx.lineTo(-r * 0.17, r * 0.02);
  ctx.closePath();
  ctx.fill();
  // Strawberry on top
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.arc(0, -r * 0.26, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  // Strawberry leaf
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.31, r * 0.04, r * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T6 Tea Set: Cream body, tiny teapot on head with spout, warm glow ---
function drawPlushieTeaSetIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Warm glow aura
  const glowGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.4);
  glowGrad.addColorStop(0, 'rgba(255,183,77,0.12)');
  glowGrad.addColorStop(1, 'rgba(255,183,77,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (warm cream)
  drawPlushieBody(ctx, cx, bodyCy, r, '#D7C4B0', '#EAD9C8', '#BFA890');

  // Teapot on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.9);
  // Teapot body (round)
  const potGrad = ctx.createRadialGradient(-r * 0.02, 0, 0, 0, 0, r * 0.18);
  potGrad.addColorStop(0, '#F5EFE6');
  potGrad.addColorStop(1, '#D7CCC8');
  ctx.fillStyle = potGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.18, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lid
  ctx.fillStyle = '#BCAAA4';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.12, r * 0.1, r * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lid knob
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath();
  ctx.arc(0, -r * 0.15, r * 0.025, 0, Math.PI * 2);
  ctx.fill();
  // Spout (right side)
  ctx.strokeStyle = '#D7CCC8';
  ctx.lineWidth = r * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.16, -r * 0.02);
  ctx.quadraticCurveTo(r * 0.26, -r * 0.06, r * 0.28, -r * 0.12);
  ctx.stroke();
  // Handle (left side)
  ctx.strokeStyle = '#BCAAA4';
  ctx.lineWidth = r * 0.035;
  ctx.beginPath();
  ctx.arc(-r * 0.2, 0, r * 0.07, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// --- T7 Tea House: Warm brown body, tiny pagoda on head, gold accents ---
function drawPlushieTeaHouseIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Gold glow aura
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.5);
  auraGrad.addColorStop(0, 'rgba(255,215,0,0.15)');
  auraGrad.addColorStop(0.5, 'rgba(255,215,0,0.06)');
  auraGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.74, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (warm brown)
  drawPlushieBody(ctx, cx, bodyCy, r, '#A68B72', '#C4A890', '#8A7058');

  // Tiny pagoda/tea house on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.92);
  // Base/walls
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(-r * 0.14, -r * 0.06, r * 0.28, r * 0.14);
  // Door
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-r * 0.04, 0, r * 0.08, r * 0.08);
  // Roof (curved pagoda shape)
  ctx.fillStyle = '#FFB74D';
  ctx.beginPath();
  ctx.moveTo(-r * 0.22, -r * 0.06);
  ctx.quadraticCurveTo(cx * 0, -r * 0.2, r * 0.22, -r * 0.06);
  ctx.closePath();
  ctx.fill();
  // Gold roof tip
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(0, -r * 0.16, r * 0.025, 0, Math.PI * 2);
  ctx.fill();
  // Gold accent lines on roof
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = r * 0.015;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.06);
  ctx.lineTo(r * 0.2, -r * 0.06);
  ctx.stroke();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}


// ============================================================
// PLUSHIE SHELL CHAIN (6 tiers)
// ============================================================
// Config entries:
//   shell: [
//     { draw: drawPlushieCoralIcon, color: '#EF5350', accent: '#FFCDD2' },          // t1 Coral plushie
//     { draw: drawPlushieShellIcon, color: '#FFAB91', accent: '#FBE9E7' },          // t2 Shell plushie
//     { draw: drawPlushieCrabIcon, color: '#E53935', accent: '#EF9A9A' },           // t3 Crab plushie
//     { draw: drawPlushieTropicalFishIcon, color: '#29B6F6', accent: '#B3E5FC' },   // t4 Tropical Fish plushie
//     { draw: drawPlushieDolphinIcon, color: '#42A5F5', accent: '#90CAF9' },        // t5 Dolphin plushie
//     { draw: drawPlushieMermaidIcon, color: '#26C6DA', accent: '#80DEEA' },        // t6 Mermaid plushie
//   ],

// --- T1 Coral: Coral-pink body, small branching coral on head ---
function drawPlushieCoralIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (coral pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#F09090', '#FFB0B0', '#D87070');

  // Branching coral on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.85);
  ctx.strokeStyle = '#EF5350';
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = 'round';
  // Main branch
  ctx.beginPath();
  ctx.moveTo(0, r * 0.1);
  ctx.lineTo(0, -r * 0.15);
  ctx.stroke();
  // Left branch
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.05);
  ctx.lineTo(-r * 0.1, -r * 0.2);
  ctx.stroke();
  // Right branch
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.08);
  ctx.lineTo(r * 0.1, -r * 0.22);
  ctx.stroke();
  // Branch tips (round blobs)
  ctx.fillStyle = '#EF7070';
  ctx.beginPath();
  ctx.arc(0, -r * 0.17, r * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.22, r * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.1, -r * 0.24, r * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Shell: Peach body, spiral shell shape on head ---
function drawPlushieShellIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (soft peach)
  drawPlushieBody(ctx, cx, bodyCy, r, '#FFCCAA', '#FFE0CC', '#F0B088');

  // Spiral shell on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.92);
  // Shell base
  const shellGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.2);
  shellGrad.addColorStop(0, '#FFE0CC');
  shellGrad.addColorStop(1, '#FFAB91');
  ctx.fillStyle = shellGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.18, r * 0.15, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Spiral line
  ctx.strokeStyle = '#FF8A65';
  ctx.lineWidth = r * 0.025;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.12, 0, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.07, Math.PI * 0.5, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.03, Math.PI, Math.PI * 2.5);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T3 Crab: Red body, small claw pincers on sides ---
function drawPlushieCrabIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (red)
  drawPlushieBody(ctx, cx, bodyCy, r, '#EF6050', '#FF8878', '#D04838');

  // Claw pincers on sides
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * r * 0.95, bodyCy - r * 0.1);
    ctx.fillStyle = '#E53935';
    // Arm
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.08, r * 0.14, side * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Top pincer
    ctx.beginPath();
    ctx.ellipse(side * r * 0.04, -r * 0.14, r * 0.07, r * 0.04, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Bottom pincer
    ctx.beginPath();
    ctx.ellipse(side * r * 0.04, -r * 0.06, r * 0.06, r * 0.035, side * -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Tiny eye stalks
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#D04838';
    ctx.beginPath();
    ctx.ellipse(cx + side * r * 0.2, bodyCy - r * 0.9, r * 0.04, r * 0.08, side * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T4 Tropical Fish: Blue body, small fins on sides, colorful stripe ---
function drawPlushieTropicalFishIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (bright blue)
  drawPlushieBody(ctx, cx, bodyCy, r, '#64B5F6', '#90CAF9', '#42A5F5');

  // Colorful stripe across body
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#FFA726';
  ctx.fillRect(cx - r, bodyCy - r * 0.08, r * 2, r * 0.16);
  ctx.fillStyle = '#FFCC80';
  ctx.fillRect(cx - r, bodyCy - r * 0.12, r * 2, r * 0.04);
  ctx.restore();

  // Small side fins
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * r * 0.85, bodyCy + r * 0.1);
    ctx.fillStyle = '#42A5F5';
    ctx.beginPath();
    ctx.ellipse(side * r * 0.08, 0, r * 0.12, r * 0.06, side * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Dorsal fin on top
  ctx.fillStyle = '#29B6F6';
  ctx.beginPath();
  ctx.moveTo(cx, bodyCy - r * 0.85);
  ctx.quadraticCurveTo(cx + r * 0.12, bodyCy - r * 1.1, cx + r * 0.04, bodyCy - r * 1.15);
  ctx.quadraticCurveTo(cx - r * 0.06, bodyCy - r * 1.05, cx, bodyCy - r * 0.85);
  ctx.fill();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T5 Dolphin: Blue-grey body, small dorsal fin on head ---
function drawPlushieDolphinIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (blue-grey)
  drawPlushieBody(ctx, cx, bodyCy, r, '#78A8CC', '#A0C8E8', '#5A8AB0');

  // Light belly (clipped to body)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 0.3, r * 0.6, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Dorsal fin on head
  ctx.fillStyle = '#5A8AB0';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.04, bodyCy - r * 0.88);
  ctx.quadraticCurveTo(cx, bodyCy - r * 1.25, cx + r * 0.12, bodyCy - r * 1.1);
  ctx.quadraticCurveTo(cx + r * 0.08, bodyCy - r * 0.95, cx + r * 0.04, bodyCy - r * 0.88);
  ctx.closePath();
  ctx.fill();

  // Small flippers on sides
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#6898B8';
    ctx.beginPath();
    ctx.ellipse(cx + side * r * 0.8, bodyCy + r * 0.2, r * 0.12, r * 0.05, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T6 Mermaid: Teal body, small crown/tiara and tail fin visible, shimmer accents ---
function drawPlushieMermaidIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Shimmer glow aura
  const shimmerGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.5);
  shimmerGrad.addColorStop(0, 'rgba(38,198,218,0.15)');
  shimmerGrad.addColorStop(0.5, 'rgba(128,222,234,0.06)');
  shimmerGrad.addColorStop(1, 'rgba(38,198,218,0)');
  ctx.fillStyle = shimmerGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.74, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (teal)
  drawPlushieBody(ctx, cx, bodyCy, r, '#5CC8D0', '#88DDE4', '#3CABB5');

  // Scale shimmer on lower body (clipped)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(128,222,234,0.25)';
  for (let row = 0; row < 3; row++) {
    for (let col = -2; col <= 2; col++) {
      const sx = cx + col * r * 0.18 + (row % 2 === 0 ? 0 : r * 0.09);
      const sy = bodyCy + r * 0.2 + row * r * 0.14;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Tail fin peeking out at bottom
  ctx.fillStyle = '#26C6DA';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.15, bodyCy + r * 0.85);
  ctx.quadraticCurveTo(cx - r * 0.3, bodyCy + r * 1.15, cx - r * 0.22, bodyCy + r * 1.2);
  ctx.quadraticCurveTo(cx, bodyCy + r * 1.0, cx + r * 0.22, bodyCy + r * 1.2);
  ctx.quadraticCurveTo(cx + r * 0.3, bodyCy + r * 1.15, cx + r * 0.15, bodyCy + r * 0.85);
  ctx.closePath();
  ctx.fill();

  // Small crown/tiara on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.92);
  ctx.fillStyle = '#FFD700';
  // Crown base
  ctx.fillRect(-r * 0.14, -r * 0.02, r * 0.28, r * 0.06);
  // Crown points
  const points = [-r * 0.1, 0, r * 0.1];
  points.forEach(px => {
    ctx.beginPath();
    ctx.moveTo(px - r * 0.04, -r * 0.02);
    ctx.lineTo(px, -r * 0.12);
    ctx.lineTo(px + r * 0.04, -r * 0.02);
    ctx.closePath();
    ctx.fill();
  });
  // Tiny jewels on crown points
  ctx.fillStyle = '#E0F7FA';
  points.forEach(px => {
    ctx.beginPath();
    ctx.arc(px, -r * 0.08, r * 0.015, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}


// ============================================================
// PLUSHIE SWEET CHAIN (8 tiers)
// ============================================================
// Config entries:
//   sweet: [
//     { draw: drawPlushieCandyIcon, color: '#E91E63', accent: '#F48FB1' },          // t1 Candy plushie
//     { draw: drawPlushieLollipopIcon, color: '#E91E63', accent: '#F8BBD0' },       // t2 Lollipop plushie
//     { draw: drawPlushieCookieIcon, color: '#8D6E63', accent: '#D7CCC8' },         // t3 Cookie plushie
//     { draw: drawPlushieCupcakeIcon, color: '#F06292', accent: '#F8BBD0' },        // t4 Cupcake plushie
//     { draw: drawPlushieDonutIcon, color: '#F48FB1', accent: '#FCE4EC' },          // t5 Donut plushie
//     { draw: drawPlushieChocolateIcon, color: '#795548', accent: '#A1887F' },      // t6 Chocolate plushie
//     { draw: drawPlushieBirthdayCakeIcon, color: '#F8BBD0', accent: '#FCE4EC' },   // t7 Birthday Cake plushie
//     { draw: drawPlushieCandyCastleIcon, color: '#F8BBD0', accent: '#FCE4EC' },    // t8 Candy Castle plushie
//   ],

// --- T1 Candy: Pink body, small wrapped candy on head ---
function drawPlushieCandyIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (soft pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#F48FB1', '#FFB0C8', '#E06890');

  // Wrapped candy on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.92);
  // Candy body (oval)
  const candyGrad = ctx.createLinearGradient(-r * 0.1, 0, r * 0.1, 0);
  candyGrad.addColorStop(0, '#EC407A');
  candyGrad.addColorStop(0.5, '#F06292');
  candyGrad.addColorStop(1, '#EC407A');
  ctx.fillStyle = candyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wrapper twists
  ctx.fillStyle = '#F8BBD0';
  // Left twist
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, -r * 0.02);
  ctx.lineTo(-r * 0.2, -r * 0.06);
  ctx.lineTo(-r * 0.2, r * 0.02);
  ctx.lineTo(-r * 0.12, r * 0.02);
  ctx.closePath();
  ctx.fill();
  // Right twist
  ctx.beginPath();
  ctx.moveTo(r * 0.12, -r * 0.02);
  ctx.lineTo(r * 0.2, -r * 0.06);
  ctx.lineTo(r * 0.2, r * 0.02);
  ctx.lineTo(r * 0.12, r * 0.02);
  ctx.closePath();
  ctx.fill();
  // Candy stripe
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = r * 0.02;
  ctx.beginPath();
  ctx.moveTo(-r * 0.04, -r * 0.07);
  ctx.lineTo(-r * 0.04, r * 0.07);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.04, -r * 0.07);
  ctx.lineTo(r * 0.04, r * 0.07);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T2 Lollipop: Pink body, lollipop stick with swirl on head ---
function drawPlushieLollipopIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (bright pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#F48FB1', '#FFB0C8', '#E06890');

  // Lollipop on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.88);
  // Stick
  ctx.strokeStyle = '#D7CCC8';
  ctx.lineWidth = r * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.08);
  ctx.lineTo(0, -r * 0.12);
  ctx.stroke();
  // Lollipop circle
  const lolliCy = -r * 0.24;
  const lolliR = r * 0.14;
  const lolliGrad = ctx.createRadialGradient(0, lolliCy, 0, 0, lolliCy, lolliR);
  lolliGrad.addColorStop(0, '#FFE0E8');
  lolliGrad.addColorStop(1, '#EC407A');
  ctx.fillStyle = lolliGrad;
  ctx.beginPath();
  ctx.arc(0, lolliCy, lolliR, 0, Math.PI * 2);
  ctx.fill();
  // Spiral swirl
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = r * 0.025;
  ctx.beginPath();
  ctx.arc(0, lolliCy, lolliR * 0.7, 0, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, lolliCy, lolliR * 0.35, Math.PI * 0.5, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T3 Cookie: Brown body, cookie chunk on head with chips ---
function drawPlushieCookieIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (warm cookie brown)
  drawPlushieBody(ctx, cx, bodyCy, r, '#C9A882', '#DBBFA0', '#A88A64');

  // Cookie on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.92);
  // Cookie disc
  const cookieGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.18);
  cookieGrad.addColorStop(0, '#D7B98E');
  cookieGrad.addColorStop(1, '#B8956A');
  ctx.fillStyle = cookieGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Chocolate chips
  ctx.fillStyle = '#4E342E';
  const chipPositions = [
    { x: -r * 0.06, y: -r * 0.04 },
    { x: r * 0.07, y: r * 0.02 },
    { x: r * 0.01, y: -r * 0.1 },
    { x: -r * 0.09, y: r * 0.05 },
    { x: r * 0.1, y: -r * 0.06 },
  ];
  chipPositions.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.025, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T4 Cupcake: Pink body, cupcake top on head with frosting swirl ---
function drawPlushieCupcakeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (warm pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#F5A0B8', '#FFB8CC', '#E88098');

  // Cupcake on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.88);
  // Cupcake wrapper (trapezoid)
  ctx.fillStyle = '#F8BBD0';
  ctx.beginPath();
  ctx.moveTo(-r * 0.14, r * 0.08);
  ctx.lineTo(-r * 0.1, -r * 0.04);
  ctx.lineTo(r * 0.1, -r * 0.04);
  ctx.lineTo(r * 0.14, r * 0.08);
  ctx.closePath();
  ctx.fill();
  // Wrapper lines
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = r * 0.015;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.04, r * 0.08);
    ctx.lineTo(i * r * 0.03, -r * 0.04);
    ctx.stroke();
  }
  // Frosting swirl (dome on top)
  const frostGrad = ctx.createRadialGradient(0, -r * 0.12, 0, 0, -r * 0.1, r * 0.16);
  frostGrad.addColorStop(0, '#FFF0F5');
  frostGrad.addColorStop(1, '#F48FB1');
  ctx.fillStyle = frostGrad;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.1, r * 0.12, r * 0.1, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Frosting peak
  ctx.beginPath();
  ctx.arc(0, -r * 0.18, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  // Cherry on top
  ctx.fillStyle = '#E53935';
  ctx.beginPath();
  ctx.arc(0, -r * 0.22, r * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T5 Donut: Pink body, donut ring on head with sprinkles ---
function drawPlushieDonutIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (soft pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#F8B0C8', '#FFC8DA', '#F090A8');

  // Donut on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.92);
  // Donut body (torus seen from above, tilted)
  ctx.fillStyle = '#D7A96A';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.2, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Donut hole
  ctx.fillStyle = '#C49458';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pink frosting on top half
  ctx.fillStyle = '#F48FB1';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.01, r * 0.19, r * 0.1, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Sprinkles
  const sprinkleColors = ['#FF5252', '#FFEB3B', '#69F0AE', '#40C4FF', '#E040FB'];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI - Math.PI * 0.1;
    const sx = Math.cos(angle) * r * 0.13;
    const sy = -r * 0.02 + Math.sin(angle) * r * 0.06;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
    ctx.fillRect(-r * 0.015, -r * 0.005, r * 0.03, r * 0.01);
    ctx.restore();
  }
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T6 Chocolate: Dark brown body, chocolate bar piece on head ---
function drawPlushieChocolateIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (dark chocolate brown)
  drawPlushieBody(ctx, cx, bodyCy, r, '#8D6E63', '#A68B7B', '#6D4C41');

  // Chocolate bar piece on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.92);
  ctx.rotate(-0.15);
  // Chocolate bar (rounded rect)
  const chocGrad = ctx.createLinearGradient(-r * 0.14, -r * 0.08, r * 0.14, r * 0.08);
  chocGrad.addColorStop(0, '#5D4037');
  chocGrad.addColorStop(0.5, '#6D4C41');
  chocGrad.addColorStop(1, '#4E342E');
  ctx.fillStyle = chocGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.14, -r * 0.08);
  ctx.lineTo(r * 0.14, -r * 0.08);
  ctx.lineTo(r * 0.14, r * 0.06);
  ctx.lineTo(-r * 0.14, r * 0.06);
  ctx.closePath();
  ctx.fill();
  // Grid lines on chocolate
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = r * 0.015;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.08);
  ctx.lineTo(0, r * 0.06);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.14, -r * 0.01);
  ctx.lineTo(r * 0.14, -r * 0.01);
  ctx.stroke();
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(-r * 0.13, -r * 0.07, r * 0.12, r * 0.04);
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T7 Birthday Cake: Pink body, layered cake on head with candle, sprinkles ---
function drawPlushieBirthdayCakeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (light pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#F8C8D8', '#FFE0EA', '#F0A0B8');

  // Layered cake on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.88);
  // Bottom layer
  ctx.fillStyle = '#FFE0B2';
  ctx.fillRect(-r * 0.16, -r * 0.02, r * 0.32, r * 0.1);
  // Frosting between layers
  ctx.fillStyle = '#F48FB1';
  ctx.fillRect(-r * 0.16, -r * 0.05, r * 0.32, r * 0.04);
  // Top layer
  ctx.fillStyle = '#FFF8E1';
  ctx.fillRect(-r * 0.12, -r * 0.14, r * 0.24, r * 0.1);
  // Top frosting
  ctx.fillStyle = '#F8BBD0';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.14, r * 0.13, r * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  // Candle
  ctx.fillStyle = '#FFEB3B';
  ctx.fillRect(-r * 0.02, -r * 0.26, r * 0.04, r * 0.12);
  // Flame
  ctx.fillStyle = '#FF9800';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.28, r * 0.02, r * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFEB3B';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.29, r * 0.01, r * 0.018, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sprinkles on sides
  const sprinkleColors = ['#FF5252', '#FFEB3B', '#69F0AE', '#40C4FF', '#E040FB'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = sprinkleColors[i];
    const sx = -r * 0.12 + i * r * 0.06;
    const sy = -r * 0.08 + (i % 2) * r * 0.04;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// --- T8 Candy Castle: Pastel pink body, tiny castle turret on head, gold + rainbow accents ---
function drawPlushieCandyCastleIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Rainbow/gold glow aura
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.6);
  auraGrad.addColorStop(0, 'rgba(255,215,0,0.15)');
  auraGrad.addColorStop(0.3, 'rgba(244,143,177,0.08)');
  auraGrad.addColorStop(0.6, 'rgba(179,136,255,0.06)');
  auraGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.76, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (pastel pink with rainbow shimmer)
  drawPlushieBody(ctx, cx, bodyCy, r, '#F8C8D8', '#FFE0EA', '#F0A0B8');

  // Rainbow shimmer band (clipped to body)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = 0.12;
  const rainbowColors = ['#FF5252', '#FFAB40', '#FFEB3B', '#69F0AE', '#40C4FF', '#B388FF'];
  rainbowColors.forEach((color, i) => {
    ctx.fillStyle = color;
    const bandY = bodyCy - r + (i * r * 2) / rainbowColors.length;
    ctx.fillRect(cx - r, bandY, r * 2, (r * 2) / rainbowColors.length);
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // Castle turret on head
  ctx.save();
  ctx.translate(cx, bodyCy - r * 0.88);
  // Main tower
  ctx.fillStyle = '#F8BBD0';
  ctx.fillRect(-r * 0.1, -r * 0.14, r * 0.2, r * 0.2);
  // Battlements
  ctx.fillStyle = '#F48FB1';
  const bWidth = r * 0.06;
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(i * bWidth * 1.2 - bWidth * 0.5, -r * 0.2, bWidth, r * 0.06);
  }
  // Side turrets
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#F8BBD0';
    ctx.fillRect(side * r * 0.1 - r * 0.03, -r * 0.18, r * 0.06, r * 0.16);
    // Turret cap
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(side * r * 0.1 - r * 0.04, -r * 0.18);
    ctx.lineTo(side * r * 0.1, -r * 0.26);
    ctx.lineTo(side * r * 0.1 + r * 0.04, -r * 0.18);
    ctx.closePath();
    ctx.fill();
  }
  // Gold door
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(0, r * 0.04, r * 0.04, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-r * 0.04, r * 0.04, r * 0.08, r * 0.02);
  // Gold flag on top
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = r * 0.02;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.2);
  ctx.lineTo(0, -r * 0.32);
  ctx.stroke();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.32);
  ctx.lineTo(r * 0.06, -r * 0.28);
  ctx.lineTo(0, -r * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.4);
}


// ============================================================
// EXPORTS
// ============================================================
export {
  // Tea chain (7)
  drawPlushieTeaLeafIcon,
  drawPlushieMatchaIcon,
  drawPlushieCoffeeIcon,
  drawPlushieBobaTeaIcon,
  drawPlushieCakeSliceIcon,
  drawPlushieTeaSetIcon,
  drawPlushieTeaHouseIcon,
  // Shell chain (6)
  drawPlushieCoralIcon,
  drawPlushieShellIcon,
  drawPlushieCrabIcon,
  drawPlushieTropicalFishIcon,
  drawPlushieDolphinIcon,
  drawPlushieMermaidIcon,
  // Sweet chain (8)
  drawPlushieCandyIcon,
  drawPlushieLollipopIcon,
  drawPlushieCookieIcon,
  drawPlushieCupcakeIcon,
  drawPlushieDonutIcon,
  drawPlushieChocolateIcon,
  drawPlushieBirthdayCakeIcon,
  drawPlushieCandyCastleIcon,
};

//
// CONFIG ENTRIES (add to the appropriate chain arrays):
//
// --- Love chain (6 tiers) ---
// { draw: drawPlushieLoveNoteIcon, color: '#F48FB1', accent: '#FCE4EC' },     // t1 Love Note plushie
// { draw: drawPlushieGrowingHeartIcon, color: '#EC407A', accent: '#F8BBD0' }, // t2 Growing Heart plushie
// { draw: drawPlushieSparklingHeartIcon, color: '#E91E63', accent: '#F48FB1' }, // t3 Sparkling Heart plushie
// { draw: drawPlushieGiftHeartIcon, color: '#D81B60', accent: '#F06292' },    // t4 Gift Heart plushie
// { draw: drawPlushieTwinHeartsIcon, color: '#C2185B', accent: '#EC407A' },   // t5 Twin Hearts plushie
// { draw: drawPlushieEternalLoveIcon, color: '#AD1457', accent: '#FFD700' },  // t6 Eternal Love plushie
//
// --- Cosmic chain (7 tiers) ---
// { draw: drawPlushieSpaceRockIcon, color: '#78909C', accent: '#B0BEC5' },    // t1 Space Rock plushie
// { draw: drawPlushieCometIcon, color: '#7C4DFF', accent: '#B388FF' },        // t2 Comet plushie
// { draw: drawPlushieUFOIcon, color: '#90A4AE', accent: '#E0E0E0' },         // t3 UFO plushie
// { draw: drawPlushieEarthIcon, color: '#42A5F5', accent: '#81D4FA' },        // t4 Earth plushie
// { draw: drawPlushieSaturnIcon, color: '#7C4DFF', accent: '#D1C4E9' },       // t5 Saturn plushie
// { draw: drawPlushieNebulaIcon, color: '#7B1FA2', accent: '#CE93D8' },       // t6 Nebula plushie
// { draw: drawPlushieRocketIcon, color: '#B0BEC5', accent: '#FFD700' },       // t7 Rocket plushie
//
// --- Cafe chain (7 tiers) ---
// { draw: drawPlushieCoffeeBeanIcon, color: '#795548', accent: '#A1887F' },   // t1 Coffee Bean plushie
// { draw: drawPlushieEspressoIcon, color: '#6D4C41', accent: '#BCAAA4' },     // t2 Espresso plushie
// { draw: drawPlushieCroissantIcon, color: '#F9A825', accent: '#FFF9C4' },    // t3 Croissant plushie
// { draw: drawPlushieWaffleIcon, color: '#FFB300', accent: '#FFE082' },       // t4 Waffle plushie
// { draw: drawPlushiePancakeStackIcon, color: '#D7CCC8', accent: '#EFEBE9' }, // t5 Pancake Stack plushie
// { draw: drawPlushieLayerCakeIcon, color: '#F48FB1', accent: '#FCE4EC' },    // t6 Layer Cake plushie
// { draw: drawPlushieBakeryIcon, color: '#8D6E63', accent: '#FFD700' },       // t7 Bakery plushie
// =============================================================================

// =============================================================================
//  LOVE CHAIN (6 tiers)
// =============================================================================

// --- T1 Love Note: Soft pink body, small envelope on head ---
function drawPlushieLoveNoteIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#F48FB1', '#FACDD6', '#E06B90');

  // Small envelope on head
  ctx.save();
  const envCx = cx;
  const envCy = bodyCy - r * 0.95;
  const ew = r * 0.4;
  const eh = r * 0.26;
  // Envelope body
  ctx.fillStyle = '#FFF9C4';
  ctx.fillRect(envCx - ew / 2, envCy - eh / 2, ew, eh);
  // Envelope flap (triangle)
  ctx.fillStyle = '#FFF176';
  ctx.beginPath();
  ctx.moveTo(envCx - ew / 2, envCy - eh / 2);
  ctx.lineTo(envCx, envCy + eh * 0.05);
  ctx.lineTo(envCx + ew / 2, envCy - eh / 2);
  ctx.closePath();
  ctx.fill();
  // Tiny heart seal
  ctx.fillStyle = '#EC407A';
  ctx.beginPath();
  const hx = envCx;
  const hy = envCy - eh * 0.05;
  const hs = r * 0.06;
  ctx.moveTo(hx, hy + hs * 0.6);
  ctx.bezierCurveTo(hx - hs, hy - hs * 0.4, hx - hs * 0.5, hy - hs, hx, hy - hs * 0.3);
  ctx.bezierCurveTo(hx + hs * 0.5, hy - hs, hx + hs, hy - hs * 0.4, hx, hy + hs * 0.6);
  ctx.fill();
  ctx.restore();

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Growing Heart: Pink body, small heart on head ---
function drawPlushieGrowingHeartIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#EC407A', '#F48FB1', '#C2185B');

  // Heart on head
  ctx.save();
  const hx = cx;
  const hy = bodyCy - r * 0.95;
  const hs = r * 0.22;
  ctx.fillStyle = '#F8BBD0';
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.8);
  ctx.bezierCurveTo(hx - hs * 1.3, hy - hs * 0.3, hx - hs * 0.7, hy - hs * 1.2, hx, hy - hs * 0.35);
  ctx.bezierCurveTo(hx + hs * 0.7, hy - hs * 1.2, hx + hs * 1.3, hy - hs * 0.3, hx, hy + hs * 0.8);
  ctx.fill();
  ctx.restore();

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.28);
}

// --- T3 Sparkling Heart: Deeper pink body, heart with sparkle on head ---
function drawPlushieSparklingHeartIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#E91E63', '#F48FB1', '#C2185B');

  // Heart with sparkle on head
  ctx.save();
  const hx = cx;
  const hy = bodyCy - r * 0.95;
  const hs = r * 0.24;
  const heartGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hs);
  heartGrad.addColorStop(0, '#FF80AB');
  heartGrad.addColorStop(1, '#E91E63');
  ctx.fillStyle = heartGrad;
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.8);
  ctx.bezierCurveTo(hx - hs * 1.3, hy - hs * 0.3, hx - hs * 0.7, hy - hs * 1.2, hx, hy - hs * 0.35);
  ctx.bezierCurveTo(hx + hs * 0.7, hy - hs * 1.2, hx + hs * 1.3, hy - hs * 0.3, hx, hy + hs * 0.8);
  ctx.fill();
  // Sparkle on heart
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const spx = hx + hs * 0.3;
  const spy = hy - hs * 0.35;
  const ss = r * 0.07;
  ctx.beginPath();
  ctx.moveTo(spx, spy - ss);
  ctx.lineTo(spx + ss * 0.3, spy);
  ctx.lineTo(spx, spy + ss);
  ctx.lineTo(spx - ss * 0.3, spy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T4 Gift Heart: Rose body, heart with ribbon bow on head ---
function drawPlushieGiftHeartIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#D81B60', '#F06292', '#AD1457');

  // Heart with ribbon bow on head
  ctx.save();
  const hx = cx;
  const hy = bodyCy - r * 0.95;
  const hs = r * 0.24;
  ctx.fillStyle = '#F06292';
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.8);
  ctx.bezierCurveTo(hx - hs * 1.3, hy - hs * 0.3, hx - hs * 0.7, hy - hs * 1.2, hx, hy - hs * 0.35);
  ctx.bezierCurveTo(hx + hs * 0.7, hy - hs * 1.2, hx + hs * 1.3, hy - hs * 0.3, hx, hy + hs * 0.8);
  ctx.fill();
  // Ribbon bow on top of heart
  const bx = hx;
  const by = hy - hs * 0.55;
  ctx.fillStyle = '#FFD700';
  // Left loop
  ctx.beginPath();
  ctx.ellipse(bx - r * 0.08, by, r * 0.08, r * 0.05, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Right loop
  ctx.beginPath();
  ctx.ellipse(bx + r * 0.08, by, r * 0.08, r * 0.05, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Knot center
  ctx.beginPath();
  ctx.arc(bx, by, r * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T5 Twin Hearts: Deep pink body, two small hearts on head ---
function drawPlushieTwinHeartsIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#C2185B', '#EC407A', '#880E4F');

  // Two hearts on head
  ctx.save();
  const hs = r * 0.18;
  const drawHeart = (hx: number, hy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(hx, hy + hs * 0.8);
    ctx.bezierCurveTo(hx - hs * 1.3, hy - hs * 0.3, hx - hs * 0.7, hy - hs * 1.2, hx, hy - hs * 0.35);
    ctx.bezierCurveTo(hx + hs * 0.7, hy - hs * 1.2, hx + hs * 1.3, hy - hs * 0.3, hx, hy + hs * 0.8);
    ctx.fill();
  };
  drawHeart(cx - r * 0.2, bodyCy - r * 0.92, '#F48FB1');
  drawHeart(cx + r * 0.2, bodyCy - r * 1.0, '#FF80AB');
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// --- T6 Eternal Love: Rich magenta body, glowing heart with wings, gold accents ---
function drawPlushieEternalLoveIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Golden glow aura
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.5);
  auraGrad.addColorStop(0, 'rgba(255,215,0,0.15)');
  auraGrad.addColorStop(0.6, 'rgba(255,215,0,0.06)');
  auraGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.74, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#AD1457', '#D81B60', '#880E4F');

  // Winged heart on head
  ctx.save();
  const hx = cx;
  const hy = bodyCy - r * 0.95;
  const hs = r * 0.22;
  // Wings behind heart
  for (const side of [-1, 1]) {
    ctx.fillStyle = 'rgba(255,215,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(hx + side * hs * 1.1, hy - hs * 0.1, hs * 0.55, hs * 0.3, side * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(hx + side * hs * 0.9, hy - hs * 0.15, hs * 0.35, hs * 0.2, side * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Glowing heart
  const heartGlow = ctx.createRadialGradient(hx, hy, 0, hx, hy, hs * 1.2);
  heartGlow.addColorStop(0, '#FF80AB');
  heartGlow.addColorStop(0.7, '#E91E63');
  heartGlow.addColorStop(1, 'rgba(233,30,99,0)');
  ctx.fillStyle = heartGlow;
  ctx.beginPath();
  ctx.arc(hx, hy, hs * 1.1, 0, Math.PI * 2);
  ctx.fill();
  // Solid heart
  ctx.fillStyle = '#FF80AB';
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.8);
  ctx.bezierCurveTo(hx - hs * 1.3, hy - hs * 0.3, hx - hs * 0.7, hy - hs * 1.2, hx, hy - hs * 0.35);
  ctx.bezierCurveTo(hx + hs * 0.7, hy - hs * 1.2, hx + hs * 1.3, hy - hs * 0.3, hx, hy + hs * 0.8);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.4);
}


// =============================================================================
//  COSMIC CHAIN (7 tiers)
// =============================================================================

// --- T1 Space Rock: Grey body, small asteroid chunk on head ---
function drawPlushieSpaceRockIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#78909C', '#B0BEC5', '#546E7A');

  // Small lumpy rock on head
  ctx.save();
  const rx = cx;
  const ry = bodyCy - r * 0.92;
  ctx.fillStyle = '#90A4AE';
  ctx.beginPath();
  ctx.moveTo(rx - r * 0.15, ry + r * 0.05);
  ctx.lineTo(rx - r * 0.12, ry - r * 0.12);
  ctx.lineTo(rx - r * 0.02, ry - r * 0.18);
  ctx.lineTo(rx + r * 0.1, ry - r * 0.13);
  ctx.lineTo(rx + r * 0.15, ry + r * 0.02);
  ctx.lineTo(rx + r * 0.05, ry + r * 0.08);
  ctx.closePath();
  ctx.fill();
  // Crater dots
  ctx.fillStyle = '#607D8B';
  ctx.beginPath();
  ctx.arc(rx - r * 0.03, ry - r * 0.05, r * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rx + r * 0.06, ry - r * 0.02, r * 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Comet: Purple body, comet with trail on head ---
function drawPlushieCometIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#7C4DFF', '#B388FF', '#5E35B1');

  // Comet with trail on head
  ctx.save();
  const cmx = cx + r * 0.05;
  const cmy = bodyCy - r * 0.95;
  // Trail (tapers to the right)
  const trailGrad = ctx.createLinearGradient(cmx - r * 0.3, cmy, cmx + r * 0.05, cmy);
  trailGrad.addColorStop(0, 'rgba(179,136,255,0)');
  trailGrad.addColorStop(0.5, 'rgba(179,136,255,0.4)');
  trailGrad.addColorStop(1, '#B388FF');
  ctx.fillStyle = trailGrad;
  ctx.beginPath();
  ctx.moveTo(cmx - r * 0.35, cmy - r * 0.02);
  ctx.lineTo(cmx, cmy - r * 0.06);
  ctx.lineTo(cmx, cmy + r * 0.06);
  ctx.lineTo(cmx - r * 0.35, cmy + r * 0.02);
  ctx.closePath();
  ctx.fill();
  // Comet body (small bright circle)
  const cometGrad = ctx.createRadialGradient(cmx, cmy, 0, cmx, cmy, r * 0.1);
  cometGrad.addColorStop(0, '#FFFFFF');
  cometGrad.addColorStop(0.5, '#E1BEE7');
  cometGrad.addColorStop(1, '#B388FF');
  ctx.fillStyle = cometGrad;
  ctx.beginPath();
  ctx.arc(cmx, cmy, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T3 UFO: Silver-blue body, small UFO disc on head with light beam ---
function drawPlushieUFOIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#90A4AE', '#CFD8DC', '#607D8B');

  // UFO disc on head
  ctx.save();
  const ux = cx;
  const uy = bodyCy - r * 0.95;
  // Light beam (triangle below disc)
  ctx.fillStyle = 'rgba(129,212,250,0.25)';
  ctx.beginPath();
  ctx.moveTo(ux - r * 0.06, uy + r * 0.06);
  ctx.lineTo(ux + r * 0.06, uy + r * 0.06);
  ctx.lineTo(ux + r * 0.15, uy + r * 0.25);
  ctx.lineTo(ux - r * 0.15, uy + r * 0.25);
  ctx.closePath();
  ctx.fill();
  // Saucer disc (ellipse)
  const saucerGrad = ctx.createLinearGradient(ux, uy - r * 0.06, ux, uy + r * 0.06);
  saucerGrad.addColorStop(0, '#E0E0E0');
  saucerGrad.addColorStop(0.5, '#BDBDBD');
  saucerGrad.addColorStop(1, '#9E9E9E');
  ctx.fillStyle = saucerGrad;
  ctx.beginPath();
  ctx.ellipse(ux, uy, r * 0.22, r * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dome
  ctx.fillStyle = '#81D4FA';
  ctx.beginPath();
  ctx.arc(ux, uy - r * 0.04, r * 0.1, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  // Dome highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(ux - r * 0.02, uy - r * 0.07, r * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.28);
}

// --- T4 Earth: Blue-green body, tiny globe on head ---
function drawPlushieEarthIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#42A5F5', '#81D4FA', '#1E88E5');

  // Tiny globe on head
  ctx.save();
  const gx = cx;
  const gy = bodyCy - r * 0.95;
  const gr = r * 0.18;
  // Ocean blue base
  ctx.fillStyle = '#42A5F5';
  ctx.beginPath();
  ctx.arc(gx, gy, gr, 0, Math.PI * 2);
  ctx.fill();
  // Continents (simple green blobs)
  ctx.fillStyle = '#66BB6A';
  // Left continent
  ctx.beginPath();
  ctx.ellipse(gx - gr * 0.3, gy - gr * 0.1, gr * 0.3, gr * 0.4, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Right continent
  ctx.beginPath();
  ctx.ellipse(gx + gr * 0.35, gy + gr * 0.15, gr * 0.25, gr * 0.3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Globe highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(gx - gr * 0.25, gy - gr * 0.25, gr * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T5 Saturn: Purple body, ring around the body/head ---
function drawPlushieSaturnIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ring behind body (back half)
  ctx.save();
  ctx.strokeStyle = '#D1C4E9';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy - r * 0.05, r * 1.2, r * 0.25, -0.2, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawPlushieBody(ctx, cx, bodyCy, r, '#7C4DFF', '#B388FF', '#5E35B1');

  // Ring in front of body (front half)
  ctx.save();
  ctx.strokeStyle = '#D1C4E9';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy - r * 0.05, r * 1.2, r * 0.25, -0.2, 0, Math.PI);
  ctx.stroke();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T6 Nebula: Deep purple body with pink tints, swirly nebula cloud on head ---
function drawPlushieNebulaIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.73, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#7B1FA2', '#CE93D8', '#4A148C');

  // Pink tint overlay on body
  ctx.save();
  ctx.globalAlpha = 0.15;
  const pinkTint = ctx.createRadialGradient(cx + r * 0.3, bodyCy - r * 0.2, 0, cx, bodyCy, r);
  pinkTint.addColorStop(0, '#F48FB1');
  pinkTint.addColorStop(1, 'rgba(244,143,177,0)');
  ctx.fillStyle = pinkTint;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Swirly nebula cloud on head
  ctx.save();
  const nx = cx;
  const ny = bodyCy - r * 0.9;
  // Multiple overlapping soft circles
  const clouds = [
    { ox: -r * 0.1, oy: -r * 0.05, s: r * 0.14, c: '#CE93D8' },
    { ox: r * 0.08, oy: -r * 0.1, s: r * 0.12, c: '#F48FB1' },
    { ox: 0, oy: -r * 0.15, s: r * 0.16, c: '#BA68C8' },
    { ox: -r * 0.06, oy: -r * 0.12, s: r * 0.1, c: '#E1BEE7' },
    { ox: r * 0.12, oy: -r * 0.02, s: r * 0.1, c: '#AB47BC' },
  ];
  clouds.forEach(c => {
    const cg = ctx.createRadialGradient(nx + c.ox, ny + c.oy, 0, nx + c.ox, ny + c.oy, c.s);
    cg.addColorStop(0, c.c);
    cg.addColorStop(1, 'rgba(123,31,162,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(nx + c.ox, ny + c.oy, c.s, 0, Math.PI * 2);
    ctx.fill();
  });
  // Tiny stars in nebula
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(nx - r * 0.05, ny - r * 0.13, r * 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(nx + r * 0.1, ny - r * 0.08, r * 0.015, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// --- T7 Rocket: Silver body, small rocket with flame on head, gold flame accents ---
function drawPlushieRocketIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Golden glow aura
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.5);
  auraGrad.addColorStop(0, 'rgba(255,215,0,0.12)');
  auraGrad.addColorStop(0.6, 'rgba(255,215,0,0.05)');
  auraGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.75, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#B0BEC5', '#ECEFF1', '#78909C');

  // Rocket on head
  ctx.save();
  const rkx = cx;
  const rky = bodyCy - r * 0.85;
  // Flame at bottom of rocket
  const flameGrad = ctx.createLinearGradient(rkx, rky + r * 0.2, rkx, rky + r * 0.42);
  flameGrad.addColorStop(0, '#FFD700');
  flameGrad.addColorStop(0.5, '#FF9800');
  flameGrad.addColorStop(1, 'rgba(255,87,34,0)');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(rkx - r * 0.07, rky + r * 0.18);
  ctx.quadraticCurveTo(rkx, rky + r * 0.42, rkx + r * 0.07, rky + r * 0.18);
  ctx.closePath();
  ctx.fill();
  // Rocket body (capsule shape)
  const rocketGrad = ctx.createLinearGradient(rkx - r * 0.1, rky, rkx + r * 0.1, rky);
  rocketGrad.addColorStop(0, '#CFD8DC');
  rocketGrad.addColorStop(0.5, '#ECEFF1');
  rocketGrad.addColorStop(1, '#90A4AE');
  ctx.fillStyle = rocketGrad;
  ctx.beginPath();
  ctx.moveTo(rkx, rky - r * 0.35);
  ctx.quadraticCurveTo(rkx + r * 0.12, rky - r * 0.2, rkx + r * 0.1, rky + r * 0.15);
  ctx.lineTo(rkx - r * 0.1, rky + r * 0.15);
  ctx.quadraticCurveTo(rkx - r * 0.12, rky - r * 0.2, rkx, rky - r * 0.35);
  ctx.fill();
  // Nose cone tip
  ctx.fillStyle = '#EF5350';
  ctx.beginPath();
  ctx.moveTo(rkx, rky - r * 0.35);
  ctx.lineTo(rkx + r * 0.06, rky - r * 0.22);
  ctx.lineTo(rkx - r * 0.06, rky - r * 0.22);
  ctx.closePath();
  ctx.fill();
  // Window
  ctx.fillStyle = '#81D4FA';
  ctx.beginPath();
  ctx.arc(rkx, rky - r * 0.06, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(rkx - r * 0.01, rky - r * 0.07, r * 0.015, 0, Math.PI * 2);
  ctx.fill();
  // Fins
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#EF5350';
    ctx.beginPath();
    ctx.moveTo(rkx + side * r * 0.1, rky + r * 0.1);
    ctx.lineTo(rkx + side * r * 0.18, rky + r * 0.2);
    ctx.lineTo(rkx + side * r * 0.08, rky + r * 0.18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}


// =============================================================================
//  CAFE CHAIN (7 tiers)
// =============================================================================

// --- T1 Coffee Bean: Dark brown body, small coffee bean shape on head ---
function drawPlushieCoffeeBeanIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#795548', '#A1887F', '#5D4037');

  // Coffee bean on head
  ctx.save();
  const bx = cx;
  const by = bodyCy - r * 0.95;
  const beanGrad = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.15);
  beanGrad.addColorStop(0, '#8D6E63');
  beanGrad.addColorStop(1, '#4E342E');
  ctx.fillStyle = beanGrad;
  ctx.beginPath();
  ctx.ellipse(bx, by, r * 0.12, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Center crease line
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = r * 0.025;
  ctx.beginPath();
  ctx.moveTo(bx, by - r * 0.12);
  ctx.quadraticCurveTo(bx + r * 0.03, by, bx, by + r * 0.12);
  ctx.stroke();
  ctx.restore();

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Espresso: Brown body, tiny espresso cup on head with steam ---
function drawPlushieEspressoIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#6D4C41', '#A1887F', '#4E342E');

  // Espresso cup on head
  ctx.save();
  const cupX = cx;
  const cupY = bodyCy - r * 0.88;
  // Cup body (trapezoid)
  ctx.fillStyle = '#EFEBE9';
  ctx.beginPath();
  ctx.moveTo(cupX - r * 0.12, cupY - r * 0.08);
  ctx.lineTo(cupX + r * 0.12, cupY - r * 0.08);
  ctx.lineTo(cupX + r * 0.1, cupY + r * 0.08);
  ctx.lineTo(cupX - r * 0.1, cupY + r * 0.08);
  ctx.closePath();
  ctx.fill();
  // Coffee inside
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.ellipse(cupX, cupY - r * 0.06, r * 0.1, r * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  // Handle
  ctx.strokeStyle = '#EFEBE9';
  ctx.lineWidth = r * 0.03;
  ctx.beginPath();
  ctx.arc(cupX + r * 0.15, cupY, r * 0.05, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
  // Steam wisps
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = r * 0.02;
  ctx.lineCap = 'round';
  for (const offset of [-r * 0.04, r * 0.04]) {
    ctx.beginPath();
    ctx.moveTo(cupX + offset, cupY - r * 0.1);
    ctx.quadraticCurveTo(cupX + offset + r * 0.03, cupY - r * 0.18, cupX + offset, cupY - r * 0.24);
    ctx.stroke();
  }
  ctx.restore();

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T3 Croissant: Golden-brown body, small crescent croissant on head ---
function drawPlushieCroissantIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#F9A825', '#FFF9C4', '#F57F17');

  // Crescent croissant on head
  ctx.save();
  const crx = cx;
  const cry = bodyCy - r * 0.95;
  const croissantGrad = ctx.createLinearGradient(crx - r * 0.2, cry, crx + r * 0.2, cry);
  croissantGrad.addColorStop(0, '#FFB74D');
  croissantGrad.addColorStop(0.5, '#FFE082');
  croissantGrad.addColorStop(1, '#F9A825');
  ctx.fillStyle = croissantGrad;
  // Crescent shape
  ctx.beginPath();
  ctx.arc(crx, cry, r * 0.18, Math.PI * 0.8, Math.PI * 2.2);
  ctx.arc(crx + r * 0.04, cry - r * 0.02, r * 0.12, Math.PI * 2.2, Math.PI * 0.8, true);
  ctx.closePath();
  ctx.fill();
  // Score lines across croissant
  ctx.strokeStyle = 'rgba(230,150,50,0.4)';
  ctx.lineWidth = r * 0.015;
  for (let i = 0; i < 3; i++) {
    const angle = Math.PI * 1.0 + (i / 3) * Math.PI * 1.0;
    const x1 = crx + Math.cos(angle) * r * 0.08;
    const y1 = cry + Math.sin(angle) * r * 0.08;
    const x2 = crx + Math.cos(angle) * r * 0.17;
    const y2 = cry + Math.sin(angle) * r * 0.17;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.28);
}

// --- T4 Waffle: Golden body, waffle grid pattern on head ---
function drawPlushieWaffleIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#FFB300', '#FFE082', '#FF8F00');

  // Waffle grid on head
  ctx.save();
  const wx = cx;
  const wy = bodyCy - r * 0.92;
  const ws = r * 0.32; // Waffle size
  // Waffle base (rounded square)
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  const halfW = ws / 2;
  ctx.moveTo(wx - halfW + r * 0.03, wy - halfW);
  ctx.lineTo(wx + halfW - r * 0.03, wy - halfW);
  ctx.quadraticCurveTo(wx + halfW, wy - halfW, wx + halfW, wy - halfW + r * 0.03);
  ctx.lineTo(wx + halfW, wy + halfW - r * 0.03);
  ctx.quadraticCurveTo(wx + halfW, wy + halfW, wx + halfW - r * 0.03, wy + halfW);
  ctx.lineTo(wx - halfW + r * 0.03, wy + halfW);
  ctx.quadraticCurveTo(wx - halfW, wy + halfW, wx - halfW, wy + halfW - r * 0.03);
  ctx.lineTo(wx - halfW, wy - halfW + r * 0.03);
  ctx.quadraticCurveTo(wx - halfW, wy - halfW, wx - halfW + r * 0.03, wy - halfW);
  ctx.fill();
  // Grid lines
  ctx.strokeStyle = '#F9A825';
  ctx.lineWidth = r * 0.02;
  // Vertical lines
  ctx.beginPath();
  ctx.moveTo(wx, wy - halfW);
  ctx.lineTo(wx, wy + halfW);
  ctx.stroke();
  // Horizontal lines
  ctx.beginPath();
  ctx.moveTo(wx - halfW, wy);
  ctx.lineTo(wx + halfW, wy);
  ctx.stroke();
  // Butter pat on top
  ctx.fillStyle = '#FFF9C4';
  ctx.beginPath();
  ctx.ellipse(wx + r * 0.03, wy - r * 0.02, r * 0.06, r * 0.04, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T5 Pancake Stack: Light brown body, 3 stacked pancakes on head with syrup drip ---
function drawPlushiePancakeStackIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#D7CCC8', '#EFEBE9', '#BCAAA4');

  // Stack of 3 pancakes on head
  ctx.save();
  const px = cx;
  const pBaseY = bodyCy - r * 0.82;
  const pancakeH = r * 0.09;
  const pancakeW = r * 0.22;
  for (let i = 0; i < 3; i++) {
    const py = pBaseY - i * pancakeH * 1.1;
    const pw = pancakeW - i * r * 0.02; // Slightly smaller each layer
    const pGrad = ctx.createLinearGradient(px, py - pancakeH / 2, px, py + pancakeH / 2);
    pGrad.addColorStop(0, '#FFCC80');
    pGrad.addColorStop(0.5, '#FFE0B2');
    pGrad.addColorStop(1, '#FFB74D');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.ellipse(px, py, pw, pancakeH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Syrup drip
  const syrupY = pBaseY - 2 * pancakeH * 1.1;
  ctx.fillStyle = '#8D6E63';
  // Pool on top
  ctx.beginPath();
  ctx.ellipse(px, syrupY - r * 0.02, r * 0.1, r * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  // Drip down side
  ctx.beginPath();
  ctx.moveTo(px + r * 0.08, syrupY);
  ctx.quadraticCurveTo(px + r * 0.1, syrupY + r * 0.08, px + r * 0.08, syrupY + r * 0.14);
  ctx.lineTo(px + r * 0.06, syrupY + r * 0.14);
  ctx.quadraticCurveTo(px + r * 0.07, syrupY + r * 0.06, px + r * 0.06, syrupY);
  ctx.closePath();
  ctx.fill();
  // Butter pat
  ctx.fillStyle = '#FFF9C4';
  ctx.beginPath();
  ctx.ellipse(px - r * 0.02, syrupY - r * 0.04, r * 0.04, r * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T6 Layer Cake: Pink body, layered cake on head with frosting ---
function drawPlushieLayerCakeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.73, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#F48FB1', '#FCE4EC', '#EC407A');

  // Layered cake on head
  ctx.save();
  const ckx = cx;
  const ckBaseY = bodyCy - r * 0.82;
  // Bottom layer
  ctx.fillStyle = '#FFCCBC';
  ctx.beginPath();
  ctx.ellipse(ckx, ckBaseY, r * 0.22, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(ckx - r * 0.22, ckBaseY - r * 0.06, r * 0.44, r * 0.06);
  // Middle layer
  ctx.fillStyle = '#F8BBD0';
  ctx.beginPath();
  ctx.ellipse(ckx, ckBaseY - r * 0.1, r * 0.18, r * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(ckx - r * 0.18, ckBaseY - r * 0.16, r * 0.36, r * 0.06);
  // Top layer
  ctx.fillStyle = '#FCE4EC';
  ctx.beginPath();
  ctx.ellipse(ckx, ckBaseY - r * 0.2, r * 0.14, r * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // Frosting drips (wavy line on middle layer)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = r * 0.025;
  ctx.beginPath();
  ctx.moveTo(ckx - r * 0.18, ckBaseY - r * 0.09);
  for (let i = 0; i < 5; i++) {
    const sx = ckx - r * 0.18 + (i + 0.5) * (r * 0.36 / 5);
    const sy = ckBaseY - r * 0.09 + (i % 2 === 0 ? r * 0.03 : -r * 0.01);
    ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  // Cherry on top
  ctx.fillStyle = '#EF5350';
  ctx.beginPath();
  ctx.arc(ckx, ckBaseY - r * 0.25, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  // Cherry highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(ckx - r * 0.01, ckBaseY - r * 0.26, r * 0.015, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// --- T7 Bakery: Warm cream body, tiny bakery shop front on head with awning, gold accents ---
function drawPlushieBakeryIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Golden glow aura
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.5);
  auraGrad.addColorStop(0, 'rgba(255,215,0,0.12)');
  auraGrad.addColorStop(0.6, 'rgba(255,215,0,0.05)');
  auraGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.75, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlushieBody(ctx, cx, bodyCy, r, '#8D6E63', '#BCAAA4', '#6D4C41');

  // Tiny bakery shop front on head
  ctx.save();
  const sx = cx;
  const sy = bodyCy - r * 0.88;
  const sw = r * 0.4;
  const sh = r * 0.28;
  // Shop wall
  ctx.fillStyle = '#EFEBE9';
  ctx.fillRect(sx - sw / 2, sy - sh / 2, sw, sh);
  // Awning (striped)
  const awningY = sy - sh / 2;
  const awningH = r * 0.1;
  ctx.fillStyle = '#EF5350';
  ctx.beginPath();
  ctx.moveTo(sx - sw / 2 - r * 0.04, awningY);
  ctx.lineTo(sx + sw / 2 + r * 0.04, awningY);
  ctx.lineTo(sx + sw / 2 + r * 0.02, awningY + awningH);
  ctx.lineTo(sx - sw / 2 - r * 0.02, awningY + awningH);
  ctx.closePath();
  ctx.fill();
  // Awning stripes
  ctx.fillStyle = '#FFFFFF';
  const stripeW = sw / 4;
  for (let i = 0; i < 4; i += 2) {
    ctx.fillRect(sx - sw / 2 + i * stripeW, awningY, stripeW, awningH);
  }
  // Door
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(sx - r * 0.04, sy, r * 0.08, sh / 2);
  // Gold door handle
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(sx + r * 0.025, sy + sh * 0.18, r * 0.012, 0, Math.PI * 2);
  ctx.fill();
  // Window
  ctx.fillStyle = '#81D4FA';
  ctx.fillRect(sx - sw / 2 + r * 0.04, sy - sh / 4, r * 0.08, r * 0.07);
  // Window highlight
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(sx - sw / 2 + r * 0.045, sy - sh / 4 + r * 0.01, r * 0.025, r * 0.04);
  // Gold sign above door
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.ellipse(sx, awningY - r * 0.04, r * 0.06, r * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  addTierSparkles(ctx, cx, cy, r, tier);

  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// --- T1 Seedling: Tiny pale green plushie, small leaf sprouting from top of head ---
function drawPlushieSeedlingIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.7, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body
  drawPlushieBody(ctx, cx, bodyCy, r, '#B8E6A0', '#D4F5C4', '#8BC672');

  // Small leaf sprouting from top of head
  ctx.save();
  ctx.translate(cx + r * 0.05, bodyCy - r * 0.9);
  // Stem
  ctx.strokeStyle = '#6B9E50';
  ctx.lineWidth = r * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.15);
  ctx.quadraticCurveTo(r * 0.05, -r * 0.1, -r * 0.02, -r * 0.25);
  ctx.stroke();
  // Leaf
  const leafGrad = ctx.createRadialGradient(-r * 0.02, -r * 0.3, 0, 0, -r * 0.2, r * 0.2);
  leafGrad.addColorStop(0, '#A8E49C');
  leafGrad.addColorStop(1, '#6B9E50');
  ctx.fillStyle = leafGrad;
  ctx.beginPath();
  ctx.ellipse(-r * 0.02, -r * 0.32, r * 0.14, r * 0.08, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'wide');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'dot');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.25);
}

// --- T2 Sprout: Slightly bigger soft green body, two leaves on head like ears ---
function drawPlushieSproutIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, _tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body
  drawPlushieBody(ctx, cx, bodyCy, r, '#A5D89A', '#C8F0BC', '#7BBF68');

  // Two leaf "ears" on top of head
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * r * 0.35, bodyCy - r * 0.8);
    ctx.rotate(side * 0.35);
    const earGrad = ctx.createLinearGradient(0, r * 0.15, 0, -r * 0.3);
    earGrad.addColorStop(0, '#7BBF68');
    earGrad.addColorStop(1, '#C8F0BC');
    ctx.fillStyle = earGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.15, r * 0.28, side * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Leaf vein
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = r * 0.03;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.15);
    ctx.lineTo(0, -r * 0.2);
    ctx.stroke();
    ctx.restore();
  }

  // Face
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// --- T3 Clover: Medium green body, three-leaf clover hat on top ---
function drawPlushieCloverIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body
  drawPlushieBody(ctx, cx, bodyCy, r, '#7DC96F', '#A8E49C', '#5AAF48');

  // Clover stem on top of head
  ctx.strokeStyle = '#3D8A2E';
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, bodyCy - r * 0.85);
  ctx.lineTo(cx, bodyCy - r * 1.15);
  ctx.stroke();

  // Three clover leaves arranged in a trefoil
  const cloverCy = bodyCy - r * 1.25;
  const cloverR = r * 0.18;
  const cloverAngles = [
    -Math.PI / 2,
    -Math.PI / 2 + (Math.PI * 2 / 3),
    -Math.PI / 2 - (Math.PI * 2 / 3),
  ];
  cloverAngles.forEach(angle => {
    const lx = cx + Math.cos(angle) * cloverR * 0.6;
    const ly = cloverCy + Math.sin(angle) * cloverR * 0.6;
    const cloverGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, cloverR);
    cloverGrad.addColorStop(0, '#A8E49C');
    cloverGrad.addColorStop(1, '#3D8A2E');
    ctx.fillStyle = cloverGrad;
    ctx.beginPath();
    ctx.arc(lx - cloverR * 0.3, ly - cloverR * 0.1, cloverR * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx + cloverR * 0.3, ly - cloverR * 0.1, cloverR * 0.45, 0, Math.PI * 2);
    ctx.fill();
  });

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face -- proud expression
  drawPlushieEyes(ctx, cx, bodyCy, r, 'normal');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.3);
}

// --- T4 Tulip: Pastel pink plushie body, the tulip IS the character with petal-shaped top ---
function drawPlushieTulipIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.72, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Small green leaf "arms" behind body
  for (const side of [-1, 1]) {
    const armGrad = ctx.createLinearGradient(cx, bodyCy, cx + side * r * 0.8, bodyCy + r * 0.3);
    armGrad.addColorStop(0, '#81C784');
    armGrad.addColorStop(1, '#4CAF50');
    ctx.fillStyle = armGrad;
    ctx.beginPath();
    ctx.ellipse(cx + side * r * 0.6, bodyCy + r * 0.4, r * 0.22, r * 0.08, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Plushie body (pastel pink tulip)
  drawPlushieBody(ctx, cx, bodyCy, r, '#FFB5C5', '#FFD4DE', '#F28EA5');

  // Petal-shaped top of head (3 petals curving upward)
  const petalAngles = [-0.5, 0, 0.5];
  petalAngles.forEach(angle => {
    ctx.save();
    ctx.translate(cx, bodyCy - r * 0.7);
    ctx.rotate(angle);
    const petalGrad = ctx.createLinearGradient(0, r * 0.2, 0, -r * 0.5);
    petalGrad.addColorStop(0, '#FFB5C5');
    petalGrad.addColorStop(0.5, '#FFD4DE');
    petalGrad.addColorStop(1, '#E8688A');
    ctx.fillStyle = petalGrad;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.15, r * 0.2, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Re-draw top of body to blend petals into body seamlessly
  const blendGrad = ctx.createRadialGradient(cx, bodyCy - r * 0.4, 0, cx, bodyCy - r * 0.4, r * 0.5);
  blendGrad.addColorStop(0, '#FFB5C5');
  blendGrad.addColorStop(1, 'rgba(255,181,197,0)');
  ctx.fillStyle = blendGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy - r * 0.4, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face -- elegant gentle eyes
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// --- T5 Rose: Rich pink plushie body with small rose crown/tiara on head ---
function drawPlushieRoseIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.74, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (rich pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#FF8CAD', '#FFB8CC', '#E8607E');

  // Rose crown/tiara on top of head -- small layered rose
  const roseCx = cx;
  const roseCy = bodyCy - r * 1.0;
  const roseR = r * 0.28;

  // Rose petals (spiral layers)
  for (let layer = 0; layer < 2; layer++) {
    const petalCount = layer === 0 ? 5 : 4;
    const offset = layer * 0.3;
    const layerR = roseR * (1 - layer * 0.25);
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 + offset;
      const px = roseCx + Math.cos(angle) * layerR * 0.35;
      const py = roseCy + Math.sin(angle) * layerR * 0.35;
      const petalGrad = ctx.createRadialGradient(px, py, 0, px, py, layerR * 0.55);
      petalGrad.addColorStop(0, layer === 0 ? '#FFB8CC' : '#FF8CAD');
      petalGrad.addColorStop(1, '#D14068');
      ctx.fillStyle = petalGrad;
      ctx.beginPath();
      ctx.ellipse(px, py, layerR * 0.4, layerR * 0.5, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Rose center
  ctx.fillStyle = '#D14068';
  ctx.beginPath();
  ctx.arc(roseCx, roseCy, roseR * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Tiny leaf accents beside the rose
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#6B9E50';
    ctx.beginPath();
    ctx.ellipse(roseCx + side * roseR * 0.7, roseCy + roseR * 0.15, roseR * 0.25, roseR * 0.12, side * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face -- confident sparkle eyes
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'cat');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.4);
}

// --- T6 Cherry Blossom: Soft pink body with petal shapes, petals floating around ---
function drawPlushieBlossomIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.1;

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.74, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Floating petals around the character (drawn behind body)
  const floatingPetals = [
    { x: cx - r * 1.0, y: bodyCy - r * 0.5, rot: 0.3, s: 0.6 },
    { x: cx + r * 0.95, y: bodyCy - r * 0.3, rot: -0.5, s: 0.5 },
    { x: cx - r * 0.7, y: bodyCy + r * 0.7, rot: 1.0, s: 0.45 },
    { x: cx + r * 0.8, y: bodyCy + r * 0.6, rot: -0.8, s: 0.5 },
    { x: cx + r * 0.1, y: bodyCy - r * 1.2, rot: 0.6, s: 0.4 },
  ];
  floatingPetals.forEach(p => {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.15 * p.s);
    pg.addColorStop(0, '#FFE0E8');
    pg.addColorStop(1, '#FFB7C5');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.12 * p.s, r * 0.18 * p.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Plushie body (soft sakura pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#FFB7C5', '#FFD8E2', '#F2899E');

  // Petal-shaped "ears" / accents on sides of head
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * r * 0.55, bodyCy - r * 0.65);
    ctx.rotate(side * 0.4);
    const petalGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.25);
    petalGrad.addColorStop(0, '#FFE0E8');
    petalGrad.addColorStop(1, '#FFB7C5');
    ctx.fillStyle = petalGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.16, r * 0.22, side * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Small flower on top of head
  const flowerCy = bodyCy - r * 0.95;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * r * 0.12;
    const py = flowerCy + Math.sin(angle) * r * 0.12;
    ctx.fillStyle = '#FFE0E8';
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.09, r * 0.12, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFEB3B';
  ctx.beginPath();
  ctx.arc(cx, flowerCy, r * 0.06, 0, Math.PI * 2);
  ctx.fill();

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face -- gentle, serene eyes
  drawPlushieEyes(ctx, cx, bodyCy, r, 'gentle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'smile');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.35);
}

// --- T7 Hibiscus: Vibrant coral-pink body, large flower blooming from top of head ---
function drawPlushieHibiscusIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.15;

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.76, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body (vibrant coral-pink)
  drawPlushieBody(ctx, cx, bodyCy, r, '#FF6B8A', '#FF99AF', '#E84466');

  // Large hibiscus flower blooming from top of head
  const flowerCx = cx;
  const flowerCy = bodyCy - r * 0.85;
  const flowerR = r * 0.45;

  // Outer petals (5 large)
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = flowerCx + Math.cos(angle) * flowerR * 0.35;
    const py = flowerCy + Math.sin(angle) * flowerR * 0.35;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + Math.PI / 2);
    const petalGrad = ctx.createLinearGradient(0, -flowerR * 0.4, 0, flowerR * 0.4);
    petalGrad.addColorStop(0, '#FF99AF');
    petalGrad.addColorStop(0.5, '#FF6B8A');
    petalGrad.addColorStop(1, '#FF3D6B');
    ctx.fillStyle = petalGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, flowerR * 0.3, flowerR * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Petal vein
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = r * 0.02;
    ctx.beginPath();
    ctx.moveTo(0, -flowerR * 0.35);
    ctx.lineTo(0, flowerR * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  // Flower center
  const centerGrad = ctx.createRadialGradient(flowerCx, flowerCy, 0, flowerCx, flowerCy, flowerR * 0.2);
  centerGrad.addColorStop(0, '#FFEB3B');
  centerGrad.addColorStop(1, '#FF9800');
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(flowerCx, flowerCy, flowerR * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Stamen dots
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(
      flowerCx + Math.cos(angle) * flowerR * 0.1,
      flowerCy + Math.sin(angle) * flowerR * 0.1,
      r * 0.02, 0, Math.PI * 2
    );
    ctx.fill();
  }

  // Small leaf accents
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(
      flowerCx + side * flowerR * 0.6, flowerCy + flowerR * 0.35,
      r * 0.12, r * 0.06, side * 0.6, 0, Math.PI * 2
    );
    ctx.fill();
  }

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face -- radiant sparkle eyes
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.4);
}

// --- T8 Bouquet: Largest body, pastel rainbow gradient, multiple flowers from head, gold glow ---
function drawPlushieBouquetIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tier: number, _color: string, _accent: string): void {
  const r = size * 0.35;
  const bodyCy = cy + r * 0.12;

  // Golden glow aura behind everything
  const auraGrad = ctx.createRadialGradient(cx, bodyCy, r * 0.5, cx, bodyCy, r * 1.6);
  auraGrad.addColorStop(0, 'rgba(255,215,0,0.18)');
  auraGrad.addColorStop(0.5, 'rgba(255,215,0,0.08)');
  auraGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, bodyCy + r * 1.05, r * 0.78, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plushie body with pastel rainbow gradient (pink to lavender)
  const bodyGrad = ctx.createLinearGradient(cx - r, bodyCy - r, cx + r, bodyCy + r);
  bodyGrad.addColorStop(0, '#FFD0E1');
  bodyGrad.addColorStop(0.35, '#FFE0E8');
  bodyGrad.addColorStop(0.65, '#E0D4FF');
  bodyGrad.addColorStop(1, '#D4E0FF');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.fill();

  // 3D depth overlay
  const depthGrad = ctx.createRadialGradient(cx - r * 0.2, bodyCy - r * 0.2, r * 0.1, cx, bodyCy, r);
  depthGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
  depthGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
  depthGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = depthGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.fill();

  // Specular highlight
  const specGrad = ctx.createRadialGradient(cx - r * 0.3, bodyCy - r * 0.3, 0, cx - r * 0.3, bodyCy - r * 0.3, r * 0.5);
  specGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
  specGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.fill();

  // Rim light
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r * 0.95, -Math.PI * 0.7, -Math.PI * 0.2);
  ctx.stroke();

  // Multiple tiny flowers growing from head/around
  const headFlowers = [
    { x: cx - r * 0.35, y: bodyCy - r * 0.95, petals: 5, clr: '#FF8CAD', center: '#FFEB3B', s: 0.7 },
    { x: cx + r * 0.35, y: bodyCy - r * 0.9, petals: 5, clr: '#FF6B8A', center: '#FFD54F', s: 0.65 },
    { x: cx, y: bodyCy - r * 1.1, petals: 6, clr: '#FFB7C5', center: '#FFEB3B', s: 0.8 },
    { x: cx - r * 0.55, y: bodyCy - r * 0.6, petals: 4, clr: '#E0D4FF', center: '#FFD54F', s: 0.5 },
    { x: cx + r * 0.55, y: bodyCy - r * 0.55, petals: 4, clr: '#D4E0FF', center: '#FFEB3B', s: 0.45 },
  ];

  headFlowers.forEach(f => {
    const fR = r * 0.12 * f.s;
    for (let i = 0; i < f.petals; i++) {
      const angle = (i / f.petals) * Math.PI * 2 - Math.PI / 2;
      const px = f.x + Math.cos(angle) * fR * 0.6;
      const py = f.y + Math.sin(angle) * fR * 0.6;
      const pg = ctx.createRadialGradient(px, py, 0, px, py, fR * 1.2);
      pg.addColorStop(0, '#FFF0F5');
      pg.addColorStop(1, f.clr);
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(px, py, fR * 0.6, fR * 0.9, angle + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = f.center;
    ctx.beginPath();
    ctx.arc(f.x, f.y, fR * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Small green leaves interspersed
  const leafSpots = [
    { x: cx - r * 0.65, y: bodyCy - r * 0.7, rot: -0.4 },
    { x: cx + r * 0.65, y: bodyCy - r * 0.65, rot: 0.5 },
    { x: cx, y: bodyCy - r * 1.3, rot: 0.1 },
  ];
  leafSpots.forEach(l => {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rot);
    ctx.fillStyle = '#81C784';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.1, r * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Golden sparkle accents
  const sparkleSpots = [
    { x: cx - r * 0.9, y: bodyCy - r * 0.2 },
    { x: cx + r * 0.85, y: bodyCy - r * 0.35 },
    { x: cx - r * 0.2, y: bodyCy - r * 1.35 },
    { x: cx + r * 0.5, y: bodyCy - r * 1.2 },
    { x: cx - r * 0.7, y: bodyCy + r * 0.5 },
    { x: cx + r * 0.75, y: bodyCy + r * 0.45 },
  ];
  ctx.fillStyle = 'rgba(255,215,0,0.7)';
  sparkleSpots.forEach(sp => {
    const sr = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y - sr * 2);
    ctx.quadraticCurveTo(sp.x + sr * 0.3, sp.y - sr * 0.3, sp.x + sr * 2, sp.y);
    ctx.quadraticCurveTo(sp.x + sr * 0.3, sp.y + sr * 0.3, sp.x, sp.y + sr * 2);
    ctx.quadraticCurveTo(sp.x - sr * 0.3, sp.y + sr * 0.3, sp.x - sr * 2, sp.y);
    ctx.quadraticCurveTo(sp.x - sr * 0.3, sp.y - sr * 0.3, sp.x, sp.y - sr * 2);
    ctx.fill();
  });

  addTierSparkles(ctx, cx, cy, r, tier);

  // Face -- ultimate sparkle eyes with maximum expression
  drawPlushieEyes(ctx, cx, bodyCy, r, 'sparkle');
  drawPlushieMouth(ctx, cx, bodyCy, r, 'open');
  drawPlushieBlush(ctx, cx, bodyCy, r, 0.45);
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

    // Subtle chain-color tint on card (12% opacity -- white-dominant)
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
    ctx.fillStyle = colors.from + '1F'; // 12% opacity
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
    const iconSize = size * 0.80; // 80% of the card
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
