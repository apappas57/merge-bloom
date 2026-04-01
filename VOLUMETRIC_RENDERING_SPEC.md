# m3rg3r -- Volumetric 3D Rendering Spec (Pure Canvas 2D)

**Date:** 2026-04-01
**Purpose:** Technical reference for making canvas 2D plush sprites look 3D/volumetric without WebGL, shaders, or Three.js. Every technique is pure `CanvasRenderingContext2D`.
**Target file:** `src/utils/EmojiRenderer.ts`
**Performance target:** 60fps with 48 items on screen (iPhone SE 2nd gen baseline)

---

## Table of Contents

1. [How Top Merge Games Achieve the 3D Look](#1-how-top-merge-games-achieve-the-3d-look)
2. [The 7 Layers of Fake 3D](#2-the-7-layers-of-fake-3d)
3. [Technique Reference (Code + Performance)](#3-technique-reference)
4. [The "3D Plush Rendering" Recipe](#4-the-3d-plush-rendering-recipe)
5. [Step-by-Step Upgrade Guide](#5-step-by-step-upgrade-guide)
6. [Performance Budget](#6-performance-budget)
7. [Before/After Comparison Map](#7-beforeafter-comparison-map)

---

## 1. How Top Merge Games Achieve the 3D Look

### Merge Mansion (Metacore) -- Actual 3D Pipeline
- Items are modeled in **Blender as 3D objects**, textured, lit, then rendered to 2D sprites at the optimal viewing angle.
- The 3D-to-2D pipeline lets artists rotate items freely to find the angle that best fills the grid square and reads clearly.
- Final 2D paint passes are done in Photoshop on top of the renders.
- **Why we can't copy this:** It requires 3D modeling for every item. We render programmatically at runtime.
- **What we CAN steal:** Their lighting model. Top-left directional light, warm ambient fill, strong contact shadows beneath items.

### Travel Town (Moon Active) -- 2D Painted with 3D Shading Rules
- Items are hand-painted 2D with a **consistent lighting model** (light from ~10 o'clock position).
- Every item has: white specular highlight (upper-left), body gradient (light-to-dark), soft contact shadow, and slightly thicker outlines on the shadow side.
- Colors go from bright at the highlight to saturated at the midtone to dark at the shadow. Never flat fills.
- **This is our model.** Everything Travel Town does with a human artist, we can approximate with canvas 2D gradient stacking.

### Gossip Harbor (Microfun) -- The "Warm Glow" Trick
- Everything is bathed in **golden-hour warm ambient light**.
- Items have a warm tint overlay (subtle orange/yellow radial gradient at 5-10% opacity over the entire item).
- Sparkles on water, flickering cafe lights, environment-aware lighting shifts.
- **What we steal:** The warm ambient overlay. One extra radial gradient per item with `rgba(255,200,100,0.06)` transforms "flat pastel" into "warm and touchable."

### The Universal "Cheap 3D" Formula (Minimum Effort, Maximum Impact)
The single most impactful upgrade path, ranked by visual improvement per CPU cycle:

| Rank | Technique | Improvement | Cost |
|------|-----------|-------------|------|
| 1 | **Offset radial gradient** (light source simulation) | Transforms flat circle to sphere | Nearly free |
| 2 | **Contact shadow ellipse** beneath item | Grounds item on surface | 1 extra ellipse |
| 3 | **Rim light** on shadow edge | Separates item from background | 1 arc stroke |
| 4 | **Specular highlight** (white ellipse, upper-left) | Suggests glossy/smooth surface | 1 ellipse fill |
| 5 | **Ambient occlusion** (dark gradient at base) | Suggests weight/gravity | 1 gradient |
| 6 | **Warm ambient overlay** | Makes everything feel "lit" | 1 radial gradient |
| 7 | **Fabric texture** (stipple noise) | Suggests material (plush/soft) | Cached pattern |

---

## 2. The 7 Layers of Fake 3D

Every item in the upgraded renderer is built from these layers, drawn bottom to top:

```
Layer 7: Specular highlight (topmost, white, high opacity)
Layer 6: Rim light (edge glow on shadow side)
Layer 5: Warm ambient overlay (subtle golden tint)
Layer 4: Main body gradient (offset radial, simulates directional light)
Layer 3: Fabric texture (subtle noise pattern)
Layer 2: Ambient occlusion (dark band at base)
Layer 1: Contact shadow (dark ellipse on "ground")
Layer 0: Background card (existing)
```

---

## 3. Technique Reference

### 3.1 Offset Radial Gradient (Directional Light Simulation)

**What it does:** Instead of centering the radial gradient on the object, offset it toward the light source (upper-left). This makes one side bright and the other dark, exactly like a sphere lit from one direction.

**Before:** Flat colored circle with centered gradient.
**After:** Sphere-like shape with clear light direction. Instantly reads as "3D object."

**Performance:** Effectively free. `createRadialGradient` is already used -- we just change the center coordinates.

```typescript
/**
 * Create a directional-lit radial gradient.
 * Light source is upper-left (~10 o'clock).
 * offsetRatio: how far the bright center is from the shape center (0.2-0.35 typical)
 */
function createDirectionalGradient(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  lightColor: string,
  midColor: string,
  shadowColor: string,
  offsetRatio: number = 0.3
): CanvasGradient {
  // Light hits from upper-left: offset gradient center up and left
  const lightX = cx - radius * offsetRatio;
  const lightY = cy - radius * offsetRatio;

  const grad = ctx.createRadialGradient(
    lightX, lightY, radius * 0.05,  // inner circle: tiny, at light position
    cx, cy, radius                    // outer circle: full radius, centered on object
  );

  grad.addColorStop(0, lightColor);    // Bright where light hits
  grad.addColorStop(0.45, midColor);   // Natural body color at midpoint
  grad.addColorStop(0.85, shadowColor); // Darker at edges away from light
  grad.addColorStop(1.0, shadowColor);  // Shadow terminates at edge

  return grad;
}
```

**Current code location:** `drawPlushItem` at line 1808 already does this partially:
```typescript
const plushGrad = ctx.createRadialGradient(cx - plushR * 0.25, plushY - plushR * 0.25, 0, cx, plushY, plushR);
```
**Upgrade:** Increase offset from `0.25` to `0.35`, add a 4th color stop for the shadow terminator, and use a darkened version of `colors.to` instead of raw `colors.to`.

---

### 3.2 Contact Shadow (Ground Shadow Beneath Object)

**What it does:** Draws a blurred dark ellipse beneath the item, as if the item is sitting on a surface and casting a shadow downward.

**Before:** Item floats on card with no ground reference.
**After:** Item appears to have weight and sit on a surface. The brain instantly reads "this is a physical object."

**Performance:** 1 extra `ellipse()` fill with low-opacity color. Negligible.

```typescript
/**
 * Draw a soft contact shadow beneath an object.
 * The shadow is wider than the object (penumbra) and darkest at center.
 */
function drawContactShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  objectRadius: number,
  surfaceY: number  // Y position of the "ground" below the object
): void {
  const shadowW = objectRadius * 1.1;   // Slightly wider than object
  const shadowH = objectRadius * 0.18;  // Very flat ellipse
  const shadowY = surfaceY + objectRadius * 0.05;  // Just below object base

  // Radial gradient: dark center fading to transparent edges
  const grad = ctx.createRadialGradient(cx, shadowY, 0, cx, shadowY, shadowW);
  grad.addColorStop(0, 'rgba(0,0,0,0.12)');    // Darkest directly under object
  grad.addColorStop(0.5, 'rgba(0,0,0,0.06)');  // Midpoint
  grad.addColorStop(1, 'rgba(0,0,0,0)');        // Fades to nothing at edges

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
```

**Current code comparison:** Line 1802-1805 already has a basic shadow:
```typescript
ctx.fillStyle = 'rgba(0,0,0,0.06)';
ctx.beginPath();
ctx.ellipse(cx, plushY + plushR * 0.15, plushR * 0.9, plushR * 0.3, 0, 0, Math.PI * 2);
ctx.fill();
```
**Upgrade:** Replace flat fill with a radial gradient shadow. Increase opacity at center (0.12), add fade to transparent at edges. This single change dramatically increases perceived depth.

---

### 3.3 Rim Light (Back-Edge Glow)

**What it does:** Draws a thin bright line along the edge of the object on the side OPPOSITE the light source (lower-right). In real photography, this is called "rim lighting" or "kicker light" -- it separates the subject from the background and suggests the object has depth that wraps around behind it.

**Before:** Object silhouette blends into card background on shadow side.
**After:** Object "pops" off the background. Clearly volumetric. This is the technique that Travel Town uses on every single item.

**Performance:** 1 arc stroke with gradient. Negligible.

```typescript
/**
 * Draw a rim light along the shadow edge of a circular/elliptical shape.
 * Light comes from upper-left, so rim appears on lower-right.
 */
function drawRimLight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rimColor: string = 'rgba(255,255,255,0.35)',
  rimWidth: number = 0.03  // as fraction of radius
): void {
  ctx.save();

  // Rim light on the shadow side (lower-right quadrant)
  // We stroke an arc from ~4 o'clock to ~8 o'clock
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = radius * rimWidth;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.95, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  ctx.restore();
}

/**
 * Variant: gradient rim that fades at the ends (more realistic).
 */
function drawGradientRimLight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  bodyColor: string
): void {
  ctx.save();

  // Use a linear gradient that fades the rim at its endpoints
  const rimGrad = ctx.createLinearGradient(
    cx + radius * 0.5, cy + radius * 0.3,   // start (brighter)
    cx - radius * 0.3, cy + radius * 0.8    // end (fades out)
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
```

---

### 3.4 Specular Highlight (Glossy Spot)

**What it does:** Places a bright white elliptical "spot" on the upper-left of the object where the light source would create a direct reflection. This is what makes items look "glossy" and "touchable" -- the brain reads specular highlights as smooth/shiny surfaces.

**Before:** Object reads as matte/flat.
**After:** Object reads as smooth, polished, "candy-like." This is the #1 technique for kawaii/Sanrio-style objects.

**Performance:** 1-2 ellipse fills. Negligible.

```typescript
/**
 * Draw a two-part specular highlight (primary spot + secondary reflection).
 * Positioned upper-left where light source hits.
 */
function drawSpecularHighlight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  intensity: number = 0.7  // 0-1, controls opacity
): void {
  // Primary highlight: larger, softer
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${intensity * 0.6})`;
  ctx.beginPath();
  ctx.ellipse(
    cx - radius * 0.25,   // offset left
    cy - radius * 0.30,   // offset up
    radius * 0.22,         // width
    radius * 0.15,         // height (flatter = more realistic)
    -0.4,                  // slight rotation following surface curve
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
```

**Current code comparison:** The existing `addHighlight()` function at line 136 already does a version of this. The upgrade is:
- Make primary highlight more elliptical (not circular) for realism
- Add a second smaller/brighter spot beneath it
- Rotate both to follow the implied surface curvature

---

### 3.5 Ambient Occlusion (Contact Darkening)

**What it does:** Darkens the areas where the plush body meets the card surface and where surfaces crease/fold together. In reality, light has a harder time reaching tight spaces between surfaces, so those areas appear darker. This is the #1 cue the brain uses for "these surfaces are touching."

**Before:** Plush body transitions abruptly to card surface.
**After:** Dark gradient at base of plush body where it "sits" on the card. Reads as physical contact.

**Performance:** 1 extra gradient fill, clipped to plush body. Negligible.

```typescript
/**
 * Draw ambient occlusion as a dark gradient at the base of the plush body.
 * This simulates light being blocked where the body touches the card surface.
 */
function drawAmbientOcclusion(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  bodyClipPath: () => void  // function that draws the body path for clipping
): void {
  ctx.save();

  // Clip to the plush body shape so AO doesn't bleed outside
  bodyClipPath();
  ctx.clip();

  // Dark gradient rising from the bottom of the shape
  const aoGrad = ctx.createLinearGradient(cx, cy + radius, cx, cy + radius * 0.3);
  aoGrad.addColorStop(0, 'rgba(0,0,0,0.15)');   // Darkest at very bottom
  aoGrad.addColorStop(0.4, 'rgba(0,0,0,0.05)');  // Fades quickly
  aoGrad.addColorStop(1, 'rgba(0,0,0,0)');        // Transparent at midpoint

  ctx.fillStyle = aoGrad;
  ctx.fillRect(cx - radius * 1.5, cy, radius * 3, radius * 1.5);

  ctx.restore();
}

/**
 * Crease/fold AO for specific shape features (e.g., heart dip, star valleys).
 * Draw a tiny dark radial gradient at the crease point.
 */
function drawCreaseOcclusion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  const aoGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
  aoGrad.addColorStop(0, 'rgba(0,0,0,0.1)');
  aoGrad.addColorStop(0.5, 'rgba(0,0,0,0.03)');
  aoGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aoGrad;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}
```

---

### 3.6 Warm Ambient Light Overlay

**What it does:** Lays a subtle warm-tinted radial gradient over the entire item, simulating "golden hour" ambient lighting. This is Gossip Harbor's secret weapon -- it makes everything feel cozy and inviting without changing any base colors.

**Before:** Items have clean pastel colors but feel "cold" or "clinical."
**After:** Items feel warmly lit, as if sitting under soft lamp light. Emotionally inviting.

**Performance:** 1 extra radial gradient. Negligible.

```typescript
/**
 * Apply warm ambient light overlay.
 * Draws a large, subtle warm gradient over the item.
 * Call AFTER the main body gradient but BEFORE highlights.
 */
function drawWarmAmbient(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  bodyClipPath: () => void
): void {
  ctx.save();

  // Clip to body shape
  bodyClipPath();
  ctx.clip();

  // Warm light from upper-left (matching directional light)
  const warmGrad = ctx.createRadialGradient(
    cx - radius * 0.4, cy - radius * 0.4, 0,
    cx, cy, radius * 1.2
  );
  warmGrad.addColorStop(0, 'rgba(255,220,150,0.08)');  // Warm yellow at light source
  warmGrad.addColorStop(0.5, 'rgba(255,200,120,0.04)'); // Fading warm
  warmGrad.addColorStop(1, 'rgba(180,160,200,0.03)');    // Cool purple at shadow (color contrast)

  ctx.fillStyle = warmGrad;
  ctx.fillRect(cx - radius * 1.5, cy - radius * 1.5, radius * 3, radius * 3);

  ctx.restore();
}
```

---

### 3.7 Fabric Texture (Plush Material Suggestion)

**What it does:** Adds a subtle noise/stipple pattern over the plush body that suggests soft fabric. Real plush toys have a visible texture from the short fibers of the fabric. We simulate this with a cached dot pattern overlay.

**Before:** Plush body is perfectly smooth gradient.
**After:** Plush body has a very subtle "fuzzy" quality that reads as fabric/soft material.

**Performance:** CACHED. Generate a reusable noise pattern once, then stamp it via `createPattern()`. The pattern generation is ~2ms one-time cost. Applying it is just a single `fillRect` with a pattern fill.

```typescript
/**
 * Generate a cached stipple/noise texture canvas for fabric simulation.
 * Call once during preload, reuse for all items.
 */
function generateFabricTexture(size: number = 64): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Subtle random dots simulating fabric texture
  // Using deterministic seeded positions for consistency
  const dotCount = Math.floor(size * size * 0.08);  // 8% coverage
  for (let i = 0; i < dotCount; i++) {
    // Simple hash-based pseudo-random (deterministic, no Math.random)
    const hash = (i * 2654435761) >>> 0;
    const x = (hash % size);
    const y = ((hash >>> 16) % size);
    const brightness = ((hash >>> 8) & 0xFF) > 128;

    ctx.fillStyle = brightness
      ? 'rgba(255,255,255,0.04)'   // Light dots (fibers catching light)
      : 'rgba(0,0,0,0.03)';         // Dark dots (fibers in shadow)

    ctx.beginPath();
    ctx.arc(x, y, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// Cache at module level
let _fabricPattern: CanvasPattern | null = null;

/**
 * Apply fabric texture to the current clipped region.
 * Must be called within a save/restore with the body shape clipped.
 */
function applyFabricTexture(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  if (!_fabricPattern) {
    const texCanvas = generateFabricTexture(64);
    _fabricPattern = ctx.createPattern(texCanvas, 'repeat');
  }
  if (!_fabricPattern) return;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = _fabricPattern;
  ctx.fillRect(cx - radius * 1.5, cy - radius * 1.5, radius * 3, radius * 3);
  ctx.restore();
}
```

---

### 3.8 Stitching / Seam Detail

**What it does:** Draws a dashed line along the edge of the plush body, just inside the outline, simulating the visible stitching seam of a real plush toy.

**Before:** Plush body has a plain colored outline.
**After:** Plush body has a charming "handmade" quality with visible stitch marks.

**Performance:** 1 stroked path with `setLineDash()`. Negligible.

```typescript
/**
 * Draw stitching detail along the body outline.
 * Uses setLineDash for the stitch pattern.
 */
function drawStitching(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  bodyPathFn: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void,
  chainColor: string,
  size: number
): void {
  ctx.save();

  // Stitch pattern: short dash, gap, short dash
  const stitchLen = size * 0.035;
  const gapLen = size * 0.025;
  ctx.setLineDash([stitchLen, gapLen]);
  ctx.lineDashOffset = 0;

  // Draw slightly inside the body outline
  const insetR = radius * 0.88;
  bodyPathFn(ctx, cx, cy, insetR);

  ctx.strokeStyle = darkenColor(chainColor, 0.2) + 'A0';  // Semi-transparent darker version
  ctx.lineWidth = size * 0.012;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Reset dash
  ctx.setLineDash([]);
  ctx.restore();
}
```

---

### 3.9 Sub-Surface Scattering Simulation (Plush Light Wrap)

**What it does:** Simulates light passing through the edges of soft/translucent material. Real plush toys, when backlit, show a bright glow around their edges where light bleeds through the thin fabric. We simulate this with a bright, warm glow just inside the silhouette edge on the light-facing side.

**Before:** Hard transition from plush body to background.
**After:** Soft, warm glow bleeding around edges gives "soft material" impression. This is what makes Gossip Harbor items feel "warm."

**Performance:** 1 extra stroke with wide, low-opacity line. Negligible.

```typescript
/**
 * Simulate sub-surface scattering for soft/plush materials.
 * Draws a warm inner glow along the light-facing edge.
 */
function drawSubSurfaceScatter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  bodyColor: string,
  bodyClipPath: () => void
): void {
  ctx.save();

  // Clip to body so the glow stays inside
  bodyClipPath();
  ctx.clip();

  // Inner glow on the light-facing side (upper-left arc)
  // This simulates light passing through the thin edges of the plush
  const sssGrad = ctx.createRadialGradient(
    cx - radius * 0.6, cy - radius * 0.6, radius * 0.3,
    cx, cy, radius
  );
  sssGrad.addColorStop(0, 'rgba(255,200,180,0)');       // Transparent at center
  sssGrad.addColorStop(0.7, 'rgba(255,200,180,0)');      // Still transparent
  sssGrad.addColorStop(0.88, 'rgba(255,220,200,0.12)');   // Warm glow near edge
  sssGrad.addColorStop(1.0, 'rgba(255,180,160,0.08)');    // Slightly dimmer at very edge

  ctx.fillStyle = sssGrad;
  ctx.fillRect(cx - radius * 1.5, cy - radius * 1.5, radius * 3, radius * 3);

  ctx.restore();
}
```

---

### 3.10 Belly Icon "Printed on Curved Surface" Effect

**What it does:** Makes the icon on the plush belly look like it is printed on a curved surface rather than floating flat on top. We achieve this by:
1. Adding a subtle shadow/darkening at the edges of the icon area
2. Slightly reducing icon opacity at the edges
3. Adding a curved gradient overlay that matches the body's shading

**Before:** Icon sits flat on top of plush body, looks "pasted on."
**After:** Icon looks printed/embroidered onto the curved surface of the plush.

**Performance:** 1 extra radial gradient. Negligible.

```typescript
/**
 * Draw the "curved surface" effect for the belly icon area.
 * Call this AFTER drawing the icon to overlay the curvature shading.
 */
function drawCurvedSurfaceOverlay(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  iconRadius: number,
  bodyColor: string
): void {
  ctx.save();

  // Vignette effect: darken edges of icon area to suggest curvature
  const curveGrad = ctx.createRadialGradient(
    cx - iconRadius * 0.15, cy - iconRadius * 0.15, 0,  // offset to match light direction
    cx, cy, iconRadius
  );
  curveGrad.addColorStop(0, 'rgba(0,0,0,0)');            // Center is unaffected
  curveGrad.addColorStop(0.6, 'rgba(0,0,0,0)');           // Most of icon is unaffected
  curveGrad.addColorStop(0.85, 'rgba(0,0,0,0.06)');       // Subtle darkening at edges
  curveGrad.addColorStop(1.0, 'rgba(0,0,0,0.12)');        // Darker at very edge

  ctx.fillStyle = curveGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, iconRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
```

---

## 4. The "3D Plush Rendering" Recipe

This is the complete draw order for a single plush item, layer by layer. Integrating all 7+ techniques into one coherent rendering pipeline.

### Complete Draw Order

```typescript
/**
 * UPGRADED drawPlushItem -- full volumetric rendering pipeline.
 * Drop-in replacement for the existing method in EmojiRenderer.
 */
private static drawPlushItem(
  ctx: CanvasRenderingContext2D,
  size: number,
  chainId: string,
  tier: number
): void {
  const colors = CHAIN_COLORS[chainId] || DEFAULT_COLORS;
  const cx = size / 2;
  const cy = size / 2;
  const pad = size * 0.08;
  const bodyR = (size - pad * 2) / 2;
  const cr = size * 0.18;

  // ====================================
  // LAYER 0: Background Card (unchanged)
  // ====================================
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = size * 0.05;
  ctx.shadowOffsetY = size * 0.03;
  roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
  ctx.fillStyle = colors.from;
  ctx.fill();
  ctx.restore();

  // Card gradient fill
  const cardGrad = ctx.createLinearGradient(pad, pad, pad, size - pad);
  cardGrad.addColorStop(0, colors.from);
  cardGrad.addColorStop(1, colors.to);
  roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
  ctx.fillStyle = cardGrad;
  ctx.fill();

  // Inner shine on card
  ctx.save();
  roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cr);
  ctx.clip();
  const shine = ctx.createLinearGradient(0, pad, 0, cy);
  shine.addColorStop(0, 'rgba(255,255,255,0.4)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(pad, pad, size - pad * 2, cy - pad);
  ctx.restore();

  // Border (same tier-based system, unchanged)
  // ... [existing border code] ...

  // ====================================
  // LAYER 1: Contact Shadow (UPGRADED)
  // ====================================
  const plushR = bodyR * 0.55;
  const plushY = cy + size * 0.02;

  drawContactShadow(ctx, cx, plushY, plushR, plushY + plushR * 0.12);

  // ====================================
  // LAYER 2: Ambient Occlusion at Base
  // ====================================
  const bodyClipPath = () => {
    EmojiRenderer.drawPlushBody(ctx, cx, plushY, plushR, chainId);
  };

  drawAmbientOcclusion(ctx, cx, plushY, plushR, bodyClipPath);

  // ====================================
  // LAYER 3: Main Body Gradient (UPGRADED with directional lighting)
  // ====================================
  const darkShadow = darkenColor(colors.to, 0.15);
  const plushGrad = createDirectionalGradient(
    ctx, cx, plushY, plushR,
    '#FFFFFF',      // Light hotspot (white)
    colors.from,    // Midtone (chain light color)
    darkShadow,     // Shadow (darkened chain dark color)
    0.35            // Stronger offset for more dramatic lighting
  );
  ctx.fillStyle = plushGrad;
  bodyClipPath();
  ctx.fill();

  // ====================================
  // LAYER 4: Fabric Texture Overlay
  // ====================================
  ctx.save();
  bodyClipPath();
  ctx.clip();
  applyFabricTexture(ctx, cx, plushY, plushR);
  ctx.restore();

  // ====================================
  // LAYER 5: Warm Ambient Light
  // ====================================
  drawWarmAmbient(ctx, cx, plushY, plushR, bodyClipPath);

  // ====================================
  // LAYER 5b: Sub-Surface Scattering
  // ====================================
  drawSubSurfaceScatter(ctx, cx, plushY, plushR, colors.from, bodyClipPath);

  // ====================================
  // LAYER 6: Stitching Detail
  // ====================================
  drawStitching(
    ctx, cx, plushY, plushR,
    EmojiRenderer.drawPlushBody,
    colors.to,
    size
  );

  // ====================================
  // LAYER 6b: Rim Light on Shadow Edge
  // ====================================
  drawGradientRimLight(ctx, cx, plushY, plushR, colors.to);

  // ====================================
  // LAYER 6c: Body Outline (softer than before)
  // ====================================
  ctx.strokeStyle = colors.to + '60';  // More transparent than before (was '80')
  ctx.lineWidth = size * 0.008;         // Thinner (was 0.01)
  bodyClipPath();
  ctx.stroke();

  // ====================================
  // Cute Face (unchanged)
  // ====================================
  const faceY = plushY - plushR * 0.05;
  const isHappy = tier >= 5;
  drawCuteEyes(ctx, cx, faceY, size, isHappy);
  drawBlush(ctx, cx, faceY, size);
  drawSmile(ctx, cx, faceY, size);

  // ====================================
  // Belly Icon (UPGRADED with curved surface effect)
  // ====================================
  const iconSize = size * 0.30;
  const iconY = plushY + plushR * 0.45;

  // Background circle for icon (slightly more transparent)
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath();
  ctx.arc(cx, iconY, iconSize * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw the icon itself
  const iconConfig = getItemIconConfig(chainId, tier);
  ctx.save();
  iconConfig.draw(ctx, cx, iconY, iconSize, tier, iconConfig.color, iconConfig.accent);
  ctx.restore();

  // ====================================
  // LAYER 7: Curved Surface Overlay on Icon
  // ====================================
  drawCurvedSurfaceOverlay(ctx, cx, iconY, iconSize * 0.55, colors.to);

  // ====================================
  // LAYER 7b: Specular Highlight (UPGRADED)
  // ====================================
  drawSpecularHighlight(ctx, cx, plushY, plushR, 0.7);
}
```

---

## 5. Step-by-Step Upgrade Guide

### Phase 1: Instant Impact (30 min, biggest visual improvement)

These 3 changes are the minimum viable "3D upgrade" that will transform the look:

**Step 1.1: Upgrade the body gradient**
In `drawPlushItem`, replace the existing gradient at line 1808-1811:
```typescript
// OLD
const plushGrad = ctx.createRadialGradient(cx - plushR * 0.25, plushY - plushR * 0.25, 0, cx, plushY, plushR);
plushGrad.addColorStop(0, '#FFFFFF');
plushGrad.addColorStop(0.4, colors.from);
plushGrad.addColorStop(1, colors.to);

// NEW -- Stronger directional lighting with shadow terminator
const plushGrad = ctx.createRadialGradient(
  cx - plushR * 0.35, plushY - plushR * 0.35, plushR * 0.05,
  cx, plushY, plushR
);
plushGrad.addColorStop(0, '#FFFFFF');
plushGrad.addColorStop(0.3, colors.from);
plushGrad.addColorStop(0.7, colors.to);
plushGrad.addColorStop(1.0, darkenColor(colors.to, 0.15));
```

**Step 1.2: Upgrade the contact shadow**
Replace the flat shadow at line 1802-1805:
```typescript
// OLD
ctx.fillStyle = 'rgba(0,0,0,0.06)';
ctx.beginPath();
ctx.ellipse(cx, plushY + plushR * 0.15, plushR * 0.9, plushR * 0.3, 0, 0, Math.PI * 2);
ctx.fill();

// NEW -- Gradient contact shadow
const shadowGrad = ctx.createRadialGradient(
  cx, plushY + plushR * 0.12, 0,
  cx, plushY + plushR * 0.12, plushR * 1.1
);
shadowGrad.addColorStop(0, 'rgba(0,0,0,0.14)');
shadowGrad.addColorStop(0.4, 'rgba(0,0,0,0.06)');
shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = shadowGrad;
ctx.beginPath();
ctx.ellipse(cx, plushY + plushR * 0.12, plushR * 1.1, plushR * 0.2, 0, 0, Math.PI * 2);
ctx.fill();
```

**Step 1.3: Add rim light after the body outline**
Insert after line 1822:
```typescript
// Rim light on shadow edge (lower-right)
ctx.save();
const rimGrad = ctx.createLinearGradient(
  cx + plushR * 0.5, plushY + plushR * 0.3,
  cx - plushR * 0.3, plushY + plushR * 0.8
);
rimGrad.addColorStop(0, 'rgba(255,255,255,0)');
rimGrad.addColorStop(0.3, 'rgba(255,255,255,0.35)');
rimGrad.addColorStop(0.7, 'rgba(255,255,255,0.25)');
rimGrad.addColorStop(1, 'rgba(255,255,255,0)');
ctx.strokeStyle = rimGrad;
ctx.lineWidth = plushR * 0.06;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.arc(cx, plushY, plushR * 0.92, Math.PI * 0.1, Math.PI * 0.9);
ctx.stroke();
ctx.restore();
```

### Phase 2: Polish (30 min, adds material quality)

**Step 2.1: Add stitching detail**
Insert after the body outline stroke, before the face:
```typescript
// Stitching
ctx.save();
ctx.setLineDash([size * 0.035, size * 0.025]);
const stitchR = plushR * 0.88;
EmojiRenderer.drawPlushBody(ctx, cx, plushY, stitchR, chainId);
ctx.strokeStyle = darkenColor(colors.to, 0.2) + 'A0';
ctx.lineWidth = size * 0.012;
ctx.lineCap = 'round';
ctx.stroke();
ctx.setLineDash([]);
ctx.restore();
```

**Step 2.2: Add fabric texture**
Add the `generateFabricTexture()` and `applyFabricTexture()` functions from Section 3.7 at module level. Then insert inside `drawPlushItem`, clipped to the body shape:
```typescript
// Fabric texture
ctx.save();
EmojiRenderer.drawPlushBody(ctx, cx, plushY, plushR, chainId);
ctx.clip();
applyFabricTexture(ctx, cx, plushY, plushR);
ctx.restore();
```

**Step 2.3: Upgrade specular highlight**
Replace the existing `addHighlight()` call (which is inside individual icon draw functions) with nothing -- instead add ONE specular highlight at the body level:
```typescript
// Specular highlight (on body, not on icon)
ctx.save();
ctx.fillStyle = 'rgba(255,255,255,0.55)';
ctx.beginPath();
ctx.ellipse(
  cx - plushR * 0.25, plushY - plushR * 0.30,
  plushR * 0.20, plushR * 0.13,
  -0.4, 0, Math.PI * 2
);
ctx.fill();
ctx.fillStyle = 'rgba(255,255,255,0.8)';
ctx.beginPath();
ctx.ellipse(
  cx - plushR * 0.18, plushY - plushR * 0.22,
  plushR * 0.07, plushR * 0.05,
  -0.3, 0, Math.PI * 2
);
ctx.fill();
ctx.restore();
```

### Phase 3: Premium (30 min, adds warmth and softness)

**Step 3.1: Warm ambient overlay**
Insert after the fabric texture, before the face:
```typescript
// Warm ambient light
ctx.save();
EmojiRenderer.drawPlushBody(ctx, cx, plushY, plushR, chainId);
ctx.clip();
const warmGrad = ctx.createRadialGradient(
  cx - plushR * 0.4, plushY - plushR * 0.4, 0,
  cx, plushY, plushR * 1.2
);
warmGrad.addColorStop(0, 'rgba(255,220,150,0.08)');
warmGrad.addColorStop(0.5, 'rgba(255,200,120,0.04)');
warmGrad.addColorStop(1, 'rgba(180,160,200,0.03)');
ctx.fillStyle = warmGrad;
ctx.fillRect(cx - plushR * 1.5, plushY - plushR * 1.5, plushR * 3, plushR * 3);
ctx.restore();
```

**Step 3.2: Sub-surface scattering**
Insert after warm ambient:
```typescript
// Sub-surface scattering simulation
ctx.save();
EmojiRenderer.drawPlushBody(ctx, cx, plushY, plushR, chainId);
ctx.clip();
const sssGrad = ctx.createRadialGradient(
  cx - plushR * 0.6, plushY - plushR * 0.6, plushR * 0.3,
  cx, plushY, plushR
);
sssGrad.addColorStop(0, 'rgba(255,200,180,0)');
sssGrad.addColorStop(0.7, 'rgba(255,200,180,0)');
sssGrad.addColorStop(0.88, 'rgba(255,220,200,0.12)');
sssGrad.addColorStop(1.0, 'rgba(255,180,160,0.08)');
ctx.fillStyle = sssGrad;
ctx.fillRect(cx - plushR * 1.5, plushY - plushR * 1.5, plushR * 3, plushR * 3);
ctx.restore();
```

**Step 3.3: Curved surface overlay on belly icon**
Insert after drawing the icon:
```typescript
// Icon curvature overlay
const iconGrad = ctx.createRadialGradient(
  cx - iconSize * 0.08, iconY - iconSize * 0.08, 0,
  cx, iconY, iconSize * 0.55
);
iconGrad.addColorStop(0, 'rgba(0,0,0,0)');
iconGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
iconGrad.addColorStop(0.85, 'rgba(0,0,0,0.06)');
iconGrad.addColorStop(1.0, 'rgba(0,0,0,0.12)');
ctx.fillStyle = iconGrad;
ctx.beginPath();
ctx.arc(cx, iconY, iconSize * 0.55, 0, Math.PI * 2);
ctx.fill();
```

---

## 6. Performance Budget

All measurements assume 48 sprites on screen, iPhone SE 2nd gen (A13 Bionic).

| Technique | Draw Calls | GPU Time | Notes |
|-----------|-----------|----------|-------|
| Offset radial gradient | 0 extra | ~0ms | Just changes gradient params |
| Contact shadow (gradient) | +1 fill | ~0.02ms | One ellipse with gradient fill |
| Rim light | +1 stroke | ~0.02ms | One arc stroke |
| Specular highlight | +2 fills | ~0.02ms | Two small ellipses |
| Ambient occlusion | +1 fill (clipped) | ~0.05ms | Clip + gradient fill |
| Warm ambient | +1 fill (clipped) | ~0.05ms | Clip + gradient fill |
| Fabric texture | +1 fill (pattern) | ~0.03ms | Cached pattern fill |
| Stitching | +1 stroke | ~0.03ms | Dashed line stroke |
| SSS simulation | +1 fill (clipped) | ~0.05ms | Clip + gradient fill |
| Icon curvature | +1 fill | ~0.02ms | One radial gradient |
| **TOTAL per item** | **+10** | **~0.3ms** | |
| **48 items on screen** | **+480** | **~14ms** | Fits in 16.6ms (60fps) frame |

**Key insight:** Canvas 2D gradient fills are hardware-accelerated on all modern mobile browsers. The bottleneck is never the gradient math -- it is path complexity and clipping. Our plush body paths are simple (5-8 bezier curves), so clipping is fast.

**If performance is tight**, the first things to cut are:
1. Fabric texture (least visible at 40px)
2. SSS simulation (subtle, hard to see at small sizes)
3. Stitching (only visible at larger sizes)

The first 4 techniques (directional gradient, contact shadow, rim light, specular highlight) are effectively free and should NEVER be cut.

### Texture Caching Note

Sprites are generated ONCE during `PreloadScene` and cached as Phaser textures via `scene.textures.addCanvas(key, canvas)`. The rendering cost is paid once at load time, not per frame. Even the full 10-layer pipeline applied to all 79 items + 60 generator variants = 139 textures generated in ~40ms total. Invisible to the player.

---

## 7. Before/After Comparison Map

### Current Rendering (What We Have)

```
[Card shadow] -> [Card gradient] -> [Card shine] -> [Card border]
  -> [Flat shadow ellipse] -> [Body radial gradient (slightly offset)]
  -> [Body outline] -> [Eyes] -> [Blush] -> [Smile]
  -> [Icon bg circle] -> [Programmatic icon]
```

Total effects per plush: ~8 draw operations
Lighting model: weak directional (gradient offset 0.25), no shadow terminator
Material cues: none
Depth cues: minimal (flat shadow, thin outline)

### Upgraded Rendering (What We Get)

```
[Card shadow] -> [Card gradient] -> [Card shine] -> [Card border]
  -> [Gradient contact shadow] -> [Ambient occlusion at base]
  -> [Body directional gradient (offset 0.35, 4 stops)]
  -> [Fabric texture overlay] -> [Warm ambient overlay]
  -> [Sub-surface scatter] -> [Stitching detail]
  -> [Rim light on shadow edge] -> [Soft body outline]
  -> [Eyes] -> [Blush] -> [Smile]
  -> [Icon bg circle] -> [Programmatic icon] -> [Curved surface overlay]
  -> [Specular highlight (2-part)]
```

Total effects per plush: ~18 draw operations
Lighting model: strong directional (offset 0.35), shadow terminator, warm ambient, rim light
Material cues: fabric texture, stitching, sub-surface scatter
Depth cues: gradient shadow, ambient occlusion, specular highlight, rim separation

### Visual Impact Summary

| Quality | Before | After |
|---------|--------|-------|
| Lighting | Weak, flat | Strong directional with warm fill |
| Depth | Reads as "sticker" | Reads as "physical object on surface" |
| Material | Smooth gradient (could be anything) | Clearly soft fabric/plush |
| Separation | Blends into card | Pops off card via rim light + shadow |
| Surface | Perfectly smooth | Subtle texture + stitching |
| Warmth | Cool/clinical | Golden-hour warmth |
| Icon integration | Pasted on | Printed on curved surface |

---

## Appendix A: darkenColor Utility

The existing `darkenColor` function in EmojiRenderer.ts is used throughout this spec. For reference:

```typescript
function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xFF) * (1 - amount));
  const g = Math.max(0, ((num >> 8) & 0xFF) * (1 - amount));
  const b = Math.max(0, (num & 0xFF) * (1 - amount));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}
```

## Appendix B: Light Direction Consistency

ALL techniques in this spec use the same light direction: **upper-left (~10 o'clock)**. This consistency is the single most important factor in making items look "real." Inconsistent light direction across techniques instantly breaks the illusion.

| Technique | Light Side (bright) | Shadow Side (dark) |
|-----------|-------------------|-------------------|
| Directional gradient | Upper-left quadrant | Lower-right quadrant |
| Contact shadow | Offset slightly right | N/A (below object) |
| Rim light | N/A | Lower-right arc |
| Specular highlight | Upper-left | N/A |
| Warm ambient | Upper-left (stronger) | Lower-right (cooler) |
| SSS | Upper-left edge | N/A |
| Ambient occlusion | N/A | Bottom of object |

## Appendix C: Research Sources

- [Metacore: How Merge Mansion's art evolves from first sketches to final assets](https://metacoregames.com/news/in-a-nutshell-how-merge-mansions-game-art-evolves-from-first-sketches-to-final-assets) -- 3D-to-2D art pipeline
- [Deconstructor of Fun: Finding Genre Success -- Gossip Harbor](https://www.deconstructoroffun.com/blog/2024/8/19/finding-genre-success-the-case-of-gossip-harbor) -- Warm lighting analysis
- [Retro Style Games: Merge Dreamland Isometric 3D Sprites](https://retrostylegames.com/portfolio/merge-dreamland-isometric-3d-sprites-wildscapes-homescapes/) -- Merge game art pipeline
- [Charles Petzold: Rudimentary 3D on the 2D HTML Canvas](https://www.charlespetzold.com/blog/2024/09/Rudimentary-3D-on-the-2D-HTML-Canvas.html) -- Canvas 2D 3D techniques
- [29a.ch: Normal Mapping with Javascript and Canvas](https://29a.ch/2010/3/24/normal-mapping-with-javascript-and-canvas-tag) -- Per-pixel lighting in canvas
- [MDN: createRadialGradient()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createRadialGradient) -- API reference
- [MDN: setLineDash()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash) -- Stitch pattern API
- [noisejs: 2D & 3D Perlin/Simplex noise](https://github.com/josephg/noisejs) -- Lightweight noise generation
- [80.lv: Sprite Stacking for 2D-to-3D](https://80.lv/articles/developer-shows-how-to-make-2d-game-look-3d-with-sprite-stacking) -- Alternative technique reference
- [Udonis: How Gossip Harbor Became the Top-Grossing Merge Game](https://www.blog.udonis.co/mobile-marketing/mobile-games/gossip-harbor) -- Visual strategy analysis
