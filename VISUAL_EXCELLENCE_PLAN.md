# m3rg3r Visual Excellence Roadmap

**Date:** 2026-04-01
**Purpose:** Gap analysis against Travel Town, Gossip Harbor, Merge Mansion, and EverMerge. Every recommendation is actionable with exact file/function/line references.
**Scope:** Analysis only. No code changes.

---

## Executive Summary

m3rg3r is currently at about 55% of Travel Town's visual quality. The architecture is solid -- canvas 2D programmatic rendering, DPR scaling, volumetric helpers (contact shadow, rim light, warm ambient) already exist. The problem is not missing infrastructure. The problem is:

1. **Icons are too simple.** Most have 2-3 visual elements. Travel Town items have 5-8.
2. **The palette is monochrome pink.** Everything is lavender/rose. Top games use 5+ distinct warm color families.
3. **Tier differentiation is weak.** T1 and T3 of the same chain often look identical at 40px.
4. **The board and background are flat.** No texture, no environmental detail, no warmth.
5. **UI chrome is plain.** Functional but not premium. No wood, no texture, no depth.
6. **Animations are good but missing juice.** No idle animations, no environment particles, no chain-specific merge effects.

The good news: the rendering pipeline (EmojiRenderer.ts with volumetric helpers) is production-grade. Most improvements are about adding visual detail to existing drawing functions, not rebuilding systems.

---

## 1. ITEM QUALITY GAP: Chain-by-Chain Analysis

### Methodology
Each chain rated 1-10 on: detail density, 40px readability, tier differentiation, color warmth/saturation, and competitor parity (Travel Town = 8, Merge Mansion = 9).

---

### 1.1 Flower Chain (T1-T8)
**Current rating: 4/10**

**What's there:**
- T1-T3: `drawLeafIcon` -- a simple bezier leaf with vein line + stem. 3 visual elements.
- T4-T8: `drawFlowerIcon` -- radial elliptical petals around a yellow center. 4 visual elements.

**Problems:**
- T1 (Seedling), T2 (Sprout), T3 (Clover) all use `drawLeafIcon` with nearly identical shapes. Only leaf count changes (1 vs 2). At 40px these are indistinguishable. The color shift is also subtle (#4CAF50 to #66BB6A to #2E7D32) -- all mid-greens.
- T4-T8 all use `drawFlowerIcon` with the same structure. The only visual change is petal count (4+tier, capped at 8) and color. At 40px, a 6-petal flower and an 8-petal flower look identical.
- No visual "story" of growth. Travel Town's flower chain goes: small seed > sprout in dirt > stem with leaves > bud > small bloom > large bloom > bouquet in vase > garden arch. Each stage is a completely different shape.
- No pot, no soil, no vase -- items float in space with no grounding object.

**What Travel Town does differently:**
- Each tier is a fundamentally different OBJECT, not the same shape with more petals.
- Lower tiers have earthy brown/green palettes; higher tiers introduce pinks, reds, golds.
- Vases, pots, wrapping paper, ribbons add secondary visual elements that scream "upgrade."
- A T8 bouquet has 8+ distinct elements: vase, multiple flower types, ribbon, wrapping paper, water, stems, leaves, baby's breath accent.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P1 | EmojiRenderer.ts | drawLeafIcon (line 118) | T1 should be a seed/acorn shape (rounded, brown, crack line). T2 should be a sprout poking from soil (add a soil mound ellipse). T3 should be a small stem with 2 leaves (current shape is fine for T3 only). Each must be a visibly different silhouette. |
| P1 | EmojiRenderer.ts | drawFlowerIcon (line 156) | T4 Tulip needs a distinct tulip shape (3 overlapping cup petals, not radial ellipses). T5 Rose needs layered concentric petals (spiral inward). T6 Cherry Blossom needs 5 notched petals. T7 Hibiscus needs large open petals with visible stamen. T8 Bouquet needs multiple flowers + wrapping + ribbon. |
| P2 | EmojiRenderer.ts | getItemIconConfig "flower" (line 1370) | Shift T1-T2 colors to brown/earthy: T1 should be #8D6E63 (seed brown), T2 should be #66BB6A (sprout green) with soil brown base. |
| P2 | EmojiRenderer.ts | drawFlowerIcon | Add a stem + leaf pair below every flower (3 more draw calls). Flowers should sit ON something, not float. Higher tiers should add a green leaf under the bloom. |

---

### 1.2 Butterfly Chain (T1-T6)
**Current rating: 5/10**

**What's there:**
- T1: `drawEggIcon` -- an egg with speckles. Simple but identifiable.
- T2: `drawLeafIcon` used as a caterpillar stand-in. This is a leaf, not a caterpillar. Confusing.
- T3-T6: `drawButterflyIcon` -- mirrored elliptical wings with body and antennae. 5 visual elements for the base form.

**Problems:**
- T2 is a reused leaf function. A caterpillar should have a segmented body with eyes.
- T3 (Bee), T4 (Ladybug), T5 (Butterfly), T6 (Peacock) all share the exact same body shape. The only difference is wing color and wing pattern dots (added at tier 3 and 5). At 40px, Bee and Ladybug are visually identical -- same elliptical wings, same body.
- A bee should have distinct proportions (round fuzzy body, short wings), stripes, and stinger. A ladybug should have a dome body with spots. A peacock should have a massive decorative tail. These are completely different silhouettes that currently share one generic butterfly template.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P1 | EmojiRenderer.ts | getItemIconConfig "butterfly" (line 1380) | T2 needs a dedicated `drawCaterpillarIcon` function: segmented round body (4-5 circles in a row), tiny feet, kawaii face on the front circle. |
| P1 | EmojiRenderer.ts | drawButterflyIcon (line 187) | Split into distinct sub-functions or add tier-conditional paths: T3 (Bee) should have round fuzzy body, tiny wings, yellow/black stripes. T4 (Ladybug) should have dome shape, distinct spots (not dots on wings), short antennae. T5 (Butterfly) can keep current shape but needs wing PATTERNS (symmetrical eye spots, gradient bands). T6 (Peacock) needs a large fanned tail with eye-spot feathers -- completely different silhouette. |
| P2 | EmojiRenderer.ts | drawButterflyIcon | Add subtle wing vein lines (2-3 bezier curves per wing) for T4+. Real butterfly wings have visible structure. |

---

### 1.3 Fruit Chain (T1-T7)
**Current rating: 5/10**

**What's there:**
- T1-T6: `drawFruitIcon` -- a round circle with radial gradient, leaf on top, stem. 4 visual elements.
- T7: `drawCakeIcon` -- layered rectangle cake. Good variety at the end.

**Problems:**
- Grapes, Apple, Orange, Kiwi, Mango, Peach are ALL circles with a leaf. At 40px, the only difference is color. An orange and a peach are nearly the same hue. Grapes should be a cluster of small circles. A kiwi should be oval and fuzzy with a visible cross-section or fuzzy skin. A mango should have a distinctive curved teardrop shape.
- The T4 secondary fruit (drawn at 50% opacity behind the main fruit) is a good idea but executes poorly -- it just looks like a blurry duplicate.
- No basket, no plate, no serving context. Top games show fruits arranged on platters, in bowls, or with cut-open views at higher tiers.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P1 | EmojiRenderer.ts | drawFruitIcon (line 246) | Each fruit needs a distinct SHAPE, not just color. T1 Grapes: cluster of 6-8 small circles arranged in triangular cluster with vine tendril. T3 Orange: add visible navel dimple at top, textured surface (subtle stipple dots). T4 Kiwi: oval shape, fuzzy brown exterior or show a cross-section with seeds (distinct green interior + seed ring + white center). T5 Mango: teardrop/kidney bean shape, two-tone gradient (yellow-orange to red blush). T6 Peach: heart-like shape with visible crease line and blush gradient. |
| P2 | EmojiRenderer.ts | drawFruitIcon | Add a subtle leaf shadow (0.05 alpha dark ellipse under the leaf) and a more pronounced specular highlight. The current `addHighlight` is generic -- fruits should have a wider, softer highlight than gems. |

---

### 1.4 Crystal/Gem Chain (T1-T5)
**Current rating: 6/10**

**What's there:**
- T1: `drawDropletIcon` -- a teardrop shape with inner glow. Distinctive.
- T2-T3: `drawCrystalIcon` -- pentagon gem with facet lines. Decent detail for its size.
- T4: `drawCrystalIcon` with more facets. Good progression.
- T5: `drawCrownIcon` -- a crown. Good visual endpoint.

**Problems:**
- This is actually one of the better chains. The main issue is that T2 (Ice) and T3 (Crystal Ball) both use `drawCrystalIcon` and look very similar -- one is light blue, the other is purple. The SHAPE is identical.
- T3 Crystal Ball should be spherical, not faceted. It should have a fortune-teller crystal ball look: smooth round surface, inner swirl/mist, glowing base.
- The crown at T5 is good but needs gem inlays with distinct colors (currently only red dots at T3+).

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P2 | EmojiRenderer.ts | getItemIconConfig "crystal" (line 1397) | T3 needs a dedicated `drawCrystalBallIcon`: sphere with mist swirl inside, ornate base/stand, inner glow. T4 Diamond should have the brilliant-cut outline (wider base, pointed top) rather than generic pentagon. |
| P3 | EmojiRenderer.ts | drawCrownIcon (line 733) | Add 2-3 gem colors (sapphire blue, emerald green, ruby red) at the crown points instead of all red. Add a velvet texture band (subtle cross-hatch pattern). |

---

### 1.5 Nature Chain (T1-T6)
**Current rating: 3/10** (lowest rated chain)

**What's there:**
- T1-T5: ALL use `drawLeafIcon`. Five tiers of the same leaf shape with different colors.
- T6: `drawHouseIcon`. A house at the end of a nature chain is a nice payoff.

**Problems:**
- This is the weakest chain visually. T1 (Leaf), T2 (Maple Leaf), T3 (Pine), T4 (Tree), T5 (Palm) are all drawn with the exact same bezier leaf shape. The only variation is leaf count (1-4) and color. At 40px, T1 through T5 are genuinely indistinguishable.
- A maple leaf should have the iconic 5-point serrated shape. A pine should be a triangular evergreen tree shape. A tree should have a round canopy on a trunk. A palm should have the fan-leaf + curved trunk silhouette. These are completely different forms sharing one function.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P1 | EmojiRenderer.ts | getItemIconConfig "nature" (line 1404) | Create dedicated drawing functions: `drawMapleLeafIcon` (5-pointed serrated outline), `drawPineTreeIcon` (triangular layered branches on trunk), `drawTreeIcon` (round canopy + brown trunk), `drawPalmTreeIcon` (curved trunk + fan fronds). Each must have a unique silhouette identifiable at 40px. |
| P2 | EmojiRenderer.ts | drawLeafIcon (line 118) | For the remaining uses of drawLeafIcon (T1 Leaf), add a small twig/branch the leaf hangs from, and subtle vein branching pattern (2 side veins branching off the central vein). |

---

### 1.6 Star Chain (T1-T6)
**Current rating: 6/10**

**What's there:**
- T1-T4: `drawStarIcon` with increasing points and glow effects. Good base.
- T5: `drawMoonIcon` -- crescent with glow and craters. Distinctive.
- T6: `drawRainbowIcon` -- multi-band arc with clouds. Distinctive.

**This is a decent chain.** Star, Moon, Rainbow have genuinely different silhouettes. The main issue is T1-T4 all look like slightly different stars.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P3 | EmojiRenderer.ts | drawStarIcon (line 348) | T2 "Glowing Star" should have visible light rays emanating outward (4-6 thin lines). T3 "Sparkles" should be a cluster of 3 small stars rather than 1 big star. T4 "Shooting Star" should have a motion trail (tapering gradient behind the star). |

---

### 1.7 Tea Chain (T1-T7)
**Current rating: 5/10**

**What's there:**
- T1: `drawLeafIcon` -- tea leaf. Simple.
- T2-T4, T6: `drawCupIcon` -- a cup with handle and steam. 5 visual elements.
- T5: `drawCakeIcon` -- cake slice.
- T7: `drawHouseIcon` -- tea house.

**Problems:**
- T2 Matcha, T3 Coffee, T4 Boba Tea, T6 Tea Set all use `drawCupIcon`. The cups are differentiated only by color. A matcha cup should be a wide ceremonial bowl (no handle). A boba tea should be a clear tall cup with visible tapioca pearls at the bottom and a dome lid. A tea set should show a teapot + cup together.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P2 | EmojiRenderer.ts | drawCupIcon (line 417) | Add tier-conditional shapes: T2 Matcha should be a wide low bowl (wider roundRect, no handle, matcha-green liquid visible at rim). T4 Boba Tea should be a taller narrow cup with dome lid, straw, and 3-5 small dark circles at the bottom (pearls). T6 Tea Set should draw a small teapot + saucer + cup arrangement (3 objects, scaled smaller). |

---

### 1.8 Shell/Ocean Chain (T1-T6)
**Current rating: 7/10** (best chain visually)

**What's there:**
- T1: `drawCoralIcon` -- branching coral. Unique shape.
- T2: `drawShellIcon` -- spiral shell with ridges. Good detail.
- T3: `drawCrabIcon` -- crab with claws, legs, eyes. 6+ visual elements.
- T4: `drawFishIcon` -- fish with tail, eye, fin, scales. 5+ elements.
- T5: `drawDolphinIcon` -- dolphin with dorsal fin, belly, eye, tail flukes. 7+ elements.
- T6: `drawMermaidIcon` -- mermaid with tail, body, hair, crown. 6+ elements.

**This is the strongest chain.** Each tier has a distinct silhouette and sufficient detail. This chain demonstrates what every chain should aspire to.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P3 | EmojiRenderer.ts | drawCrabIcon (line 1180) | Add a subtle sand base ellipse beneath the crab (grounds it). Claw proportions could be slightly larger for 40px readability. |
| P3 | EmojiRenderer.ts | drawFishIcon (line 1044) | Add 1-2 colored stripe bands across the body for tropical fish look. |

---

### 1.9 Sweet Chain (T1-T8)
**Current rating: 5/10**

**What's there:**
- T1-T2: `drawCandyIcon` -- wrapped candy / lollipop. 4 elements.
- T3: `drawCandyIcon` -- cookie (donut variant). Reuse issue.
- T4: `drawCakeIcon` -- cupcake.
- T5: `drawCandyIcon` -- donut. Reuse issue.
- T6: `drawCandyIcon` -- chocolate.
- T7: `drawCakeIcon` -- birthday cake.
- T8: `drawCastleIcon` -- candy castle. Good endpoint.

**Problems:**
- `drawCandyIcon` is overloaded. T1 (wrapped candy), T3 (cookie), T5 (donut), T6 (chocolate) all share one function with tier-conditional branches. At 40px, cookie and donut look similar (both circles). Chocolate should be a bar/square shape with grid lines, not a circle.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P2 | EmojiRenderer.ts | drawCandyIcon (line 898) | T3 Cookie needs visible chocolate chips (5-6 dark brown dots on a golden circle). T6 Chocolate should be a rectangular bar with score lines (grid of 4-6 segments) rather than a circle. Each needs a unique silhouette. |
| P3 | EmojiRenderer.ts | drawCakeIcon (line 493) | T4 Cupcake needs a ridged wrapper at the bottom (scalloped edge) and swirled frosting on top (spiral shape) with a cherry/sprinkles. Currently it's a layered rectangle. |

---

### 1.10 Love Chain (T1-T6)
**Current rating: 5/10**

**Problems:**
- T2-T6 all use `drawHeartIcon` with the same shape. Only color varies (pink to darker pink to dark pink). At 40px, T2-T6 are the same heart.
- T3 "Sparkling Heart" should have visible sparkle particles baked into the texture. T4 "Gift Heart" should incorporate a bow/ribbon. T5 "Twin Hearts" should literally be two overlapping hearts. T6 "Eternal Love" should be a heart with wings or a halo.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P1 | EmojiRenderer.ts | getItemIconConfig "love" (line 1447) | T4 Gift Heart needs a ribbon/bow crossing the heart. T5 Twin Hearts needs two overlapping hearts (one slightly behind, offset and rotated). T6 Eternal Love needs small wings on the sides or a golden crown/halo above. Each must be a different silhouette. |

---

### 1.11 Cosmic Chain (T1-T7)
**Current rating: 6/10**

**What's there:** Good variety -- rock, comet, planet, rocket. Different shapes per tier cluster.

**Problems:**
- T3 is labeled "UFO" but currently draws a planet with ring (the T3-T4 branch both draw planets). UFO needs its own saucer shape.
- T6 "Nebula" draws a planet. Should be a colorful gas cloud.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P2 | EmojiRenderer.ts | drawCosmicIcon (line 539) | T3 UFO needs a saucer shape (flat disc with dome on top, maybe a beam of light below). T6 Nebula should be a multi-colored cloud (overlapping soft circles in purple, blue, pink with star sparkles inside). |

---

### 1.12 Cafe Chain (T1-T7)
**Current rating: 5/10**

**Problems:**
- T2-T3 reuse `drawCupIcon` via `drawCoffeeIcon`. T3 Croissant should be a crescent pastry shape, not a cup.
- T4 Waffle should be a grid-pattern square/circle, not a cup.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P2 | EmojiRenderer.ts | drawCoffeeIcon (line 646) | T3 Croissant needs a dedicated crescent/horn shape with visible layered pastry texture. T4 Waffle needs a square/circle with grid pattern (cross-hatch lines forming a waffle grid). These are currently delegating to cup/pancake shapes that do not look like croissants or waffles. |

---

## 2. BOARD & ATMOSPHERE GAP

### Current State
**File:** `Board.ts` (line 59-151), `GameScene.ts` (line 579-638)

**Board rendering:**
- Rounded rect background at #FCE4EC (soft pink), 88% opacity
- Dot pattern overlay (0.8px dots at 12px spacing, 15% opacity) -- barely visible
- Holographic shimmer strips (4 color bands at 4% opacity) -- invisible in practice
- Cell rendering: white fill with pink shadow, inner highlight top half, inner shadow bottom half, pink border. Decent depth effect.
- Locked cells: diagonal line pattern.

**Background:**
- Time-of-day gradient (4 states, all pink/lavender variants). All four are within the same narrow pink-lavender range.

**Ambient sparkles:**
- 4 floating shape sparkles (hearts, circles, blossoms, diamonds) at 8% opacity
- 4 four-point star sparkles with drift animation

### What Travel Town Does
- Board sits on a **textured surface** (grass, wood, stone depending on area). The board does not float in colored void.
- **Environmental decorations** surround the board: flowers, bushes, fence posts, cobblestones, butterflies.
- **Dynamic lighting**: warm tones shift with game events. A merge creates a brief warm flash. Completing an order creates a localized glow.
- **Material variety**: the board frame has visible wood grain or stone texture, not flat color.
- **Depth layering**: bushes/flowers slightly overlap the board edges, creating z-depth.

### Specific Improvements Needed

| Priority | File | Function/Line | Change | Impact |
|----------|------|---------------|--------|--------|
| P1 | GameScene.ts | drawBackground (line 579) | Replace the 4 monochrome pink gradients with genuinely different color palettes per time of day. Morning: warm cream (#FFF8E1) to soft peach (#FFE0B2). Afternoon: warm butter (#FFFDE7) to light sage (#E8F5E9). Evening: warm coral-cream (#FFF3E0) to soft lavender (#F3E5F5). Night: deep indigo (#E8EAF6) to dusky purple (#EDE7F6). Currently all 4 are pink/lavender variants -- they need to be DIFFERENT color families. | Major -- instantly makes the game feel "alive" and warm rather than monotone pink. |
| P1 | Board.ts | drawBoard (line 59) | Add a board "frame" -- a darker border (4-6px) with a slightly different material look. Currently the board has a 1.5px border at 35% opacity. Travel Town's board has a visible wooden/decorative frame. Draw a second rounded rect 6px larger on each side with a warmer, darker fill (#D7CCC8 or warm brown) to create a frame effect. | Significant -- the board currently blends into the background. A visible frame anchors it. |
| P2 | Board.ts | drawBoard (line 76-84) | Replace the dot pattern with a subtle fabric/woven texture. The current dots are invisible. Instead: cross-hatch pattern at 6px intervals using 0.5px lines at 8% opacity. This will read as "soft surface" rather than "flat digital panel." | Moderate -- adds perceived material quality. |
| P2 | GameScene.ts | createAmbientSparkles (line 592) | Increase sparkle count from 4+4 to 8+8. Increase alpha from 0.08 to 0.12 for shapes and 0.7 to 0.9 for star sparkles. Currently the ambient effects are too subtle to notice. Add slow rotation tweens to the star sparkles. | Moderate -- the "alive" feeling comes from visible background motion. |
| P2 | GameScene.ts | After board creation | Add 4-6 small canvas-drawn flowers/leaves positioned along the bottom and sides of the board, overlapping the board edge by 5-10px. These should be static decorative elements at depth 1, drawn once. Each should be a simple 5-petal flower or leaf cluster in soft greens and pinks. | Major -- this is the single biggest "this looks like a real game" signal. Travel Town's environmental decorations make the board feel like a place, not a panel. |
| P3 | Board.ts | drawBoard cell rendering (line 106-149) | Add a tiny (1px) white inner-border highlight along the top-left edges of each cell, and a matching 1px shadow on bottom-right. Currently the inner highlight covers the top 45% -- it should be a sharp 1-2px edge accent for a more "glass tile" look. | Subtle but cumulative across 48 cells. |

---

## 3. UI QUALITY GAP

### 3.1 Top Bar
**Current state:** `UIScene.ts` (line 34-87)

- White rect at 55% opacity + pink tint at 35% + bottom accent line. "Frosted glass" effect.
- Canvas-drawn star, coin, gem icons.
- XP bar: 6px rounded rect with gradient fill.

**What Travel Town does:**
- Textured bar background (subtle gradient with inner shadow, not flat)
- Currency icons have idle ANIMATIONS (coin rotates, gem sparkles)
- Level indicator is a prominent badge/shield shape, not just a star + number
- XP bar has a visible track (inset groove), a shimmering fill, and a marker dot at the progress point

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P2 | UIScene.ts | create (line 34-51) | Add a 2px inner shadow along the bottom of the top bar (dark gradient strip) to create a "recessed" look. Add a subtle gradient to the background (lighter at top, slightly darker at bottom) instead of flat fill. |
| P2 | UIScene.ts | drawCoinIcon (line 382) | Add a subtle "C" or embossed mark on the coin face. Add a second smaller highlight dot on the opposite side of the primary highlight (creates a more realistic metallic look). |
| P3 | UIScene.ts | drawXPBar (line 314) | Add a background track with visible inset (1px dark line on top edge, 1px light line on bottom). Add a small circular marker at the fill endpoint. Add a subtle shimmer tween to the fill gradient. |

---

### 3.2 Order Bar
**Current state:** `UIScene.ts` (line 136-312)

- Pink panel background at 80% opacity
- White cards with pink border, rounded corners
- Character portraits (canvas-rendered textures)
- Item icons inside circle backgrounds
- Progress badges (text-based)
- Reward coin amounts

**What Gossip Harbor does:**
- Order cards have a slight gradient (warm cream at top, slightly darker at bottom)
- Character portraits have expressive emotion states that change when you fulfill items
- Progress is shown as a FILL BAR per item, not just "0/2" text
- A completed order has a satisfying checkmark ANIMATION (not just a static green circle)
- The entire card has a brief CELEBRATION when all items are fulfilled (sparkle burst, card lifts slightly)

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P2 | UIScene.ts | renderOrders (line 169-311) | Add a top-to-bottom subtle gradient on order cards (white at top, very faint cream #FFFAF0 at bottom). This creates a "physical card" feeling. |
| P2 | UIScene.ts | renderOrders (item progress) | Replace the "0/2" text badges with mini progress bars: a small rounded rect track with a colored fill. This is more visually scannable than reading numbers. |
| P3 | UIScene.ts | renderOrders (completion) | When an order is complete, add a brief scale-up + sparkle animation before showing the static checkmark. Currently it snaps to a green circle with no celebration. |

---

### 3.3 Bottom Nav Bar
**Current state:** `UIScene.ts` (line 91-131)

- Same frosted glass treatment as top bar
- 4 canvas-drawn icons (calendar, bag, book, gear)
- Text labels below icons

**Problems:**
- Icons are monochrome purple (#9B7EAB) with no visual distinction between states (active/inactive)
- No indicator for notifications (e.g., "new daily challenge available")
- The icons are drawn at a very small size and lack detail

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P3 | UIScene.ts | drawBottomBarIcon (line 421) | Add a filled circle background behind the active tab icon (subtle #FCE4EC fill). Add a small red notification dot for items that need attention (new daily challenge, unclaimed order rewards). |

---

## 4. ANIMATION & FEEL GAP

### 4.1 Merge Animation
**Current state:** `MergeItem.ts` (line 221-249), `MergeSystem.ts` (line 52-86, 114-195)

- Items scale to 0 with Back.easeIn (good)
- Result item scales to 1.3 then bounces to 1 (good)
- Particles: circles + star-shapes, chain-colored, 10-30 count based on tier
- Screen shake for T4+ (good)
- Text pop-up for T3+ ("Nice!", "Great!", etc.)

**What Travel Town does differently:**
- The merge has a brief WHITE FLASH at the merge point (a fast-expanding white circle that fades in ~100ms)
- Particles are more varied: sparkles, colored ribbons/confetti strips, and ring-shaped expanding circles
- The result item has a brief GOLDEN GLOW outline on appearance that fades over 500ms
- High-tier merges create a SHOCKWAVE ring (expanding circle outline that fades)

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P1 | MergeSystem.ts | createParticles (line 114) | Add a fast white flash: create a white circle at the merge point, scale it from 0 to `s(40)` over 100ms, fade alpha from 0.6 to 0, then destroy. This should fire BEFORE the particles. |
| P2 | MergeSystem.ts | createParticles (line 114) | Add 2-3 expanding ring particles (circle outlines that scale up and fade). These create a "shockwave" effect that makes merges feel impactful. |
| P2 | MergeItem.ts | playMergeResult (line 241) | After the bounce settles, add a brief golden outline glow that pulses once and fades (a graphics object drawn around the item, tweened from alpha 0.6 to 0 over 500ms). |
| P3 | MergeSystem.ts | createParticles | Add 3-5 "confetti" particles for T5+ merges: thin rectangles (2x6px) in bright colors with rotation tweens as they fly outward. |

---

### 4.2 Spawn Animation
**Current state:** `MergeItem.ts` (line 233-239)

- Scale from 0 to 1 with Back.easeOut over 300ms. Clean and functional.

**What's missing:**
- No "pop" effect at the spawn point. A small puff of particles (3-5 tiny circles) at the spawn location would add satisfaction.
- No subtle landing bounce. After reaching scale 1, a tiny 0.98 > 1.02 > 1 micro-bounce would add physicality.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P3 | MergeItem.ts | playSpawnAnimation (line 233) | Add a chain callback: after reaching scale 1, add a micro-bounce (1 > 1.05 > 1, 80ms, Bounce.easeOut). Also emit 3-5 tiny particles at the item position on spawn. |

---

### 4.3 Idle Animations
**Current state:** None for regular items. Only generators have shimmer + glow.

**What Travel Town does:**
- High-tier items have subtle idle animations: steam wisps on hot drinks, flower petals occasionally falling, gems sparkle intermittently.
- This gives the board a "living" quality even when the player is not interacting.

**Specific improvements needed:**
| Priority | File | Function | Change |
|----------|------|----------|--------|
| P3 | MergeItem.ts | constructor or new method | For T5+ items, add a very slow idle scale pulse (1 > 1.02 > 1 over 2 seconds, repeat forever). For T7+ items, the holo shimmer already exists. For T3-T4 items, add a very slow rotation tween (-0.5 degrees to +0.5 degrees, 3 seconds, yoyo, repeat). These must be extremely subtle -- 1-2% movement max. |

---

### 4.4 Screen Transitions
**Current state:** Camera fadeIn/fadeOut between scenes (400-600ms). Clean.

**What's missing:**
- No particle burst or visual flourish on scene transitions
- Menu to Game transition is just a fade -- a brief scale-up + fade would feel more energetic

This is low priority. The fades work well.

---

## 5. COLOR PALETTE REVIEW

### Current Palette Analysis

The constants.ts `COLORS` object (line 30-55) reveals the core problem:

```
BG_CREAM:     0xFFF0F5  -- lavender blush (pink)
BG_PINK:      0xFFE4EC  -- pink
BG_MINT:      0xFCE4EC  -- pink (mislabeled as mint!)
BOARD_BG:     0xFCE4EC  -- pink
CELL_BG:      0xFFF0F5  -- lavender blush (pink)
CELL_BORDER:  0xF8BBD0  -- pink
CELL_SHADOW:  0xF48FB1  -- pink
CELL_HIGHLIGHT: 0xF8BBD0 -- pink
CELL_VALID:   0xF48FB1  -- pink
CELL_INVALID: 0xFFCDD2  -- pink
UI_BG:        0xFFF0F5  -- lavender blush (pink)
UI_PANEL:     0xFCE4EC  -- pink
ACCENT_PINK:  0xF06292  -- pink
ACCENT_GOLD:  0xFFD700  -- gold (only non-pink)
ACCENT_TEAL:  0xF48FB1  -- pink (mislabeled as teal!)
ACCENT_ROSE:  0xEC407A  -- rose/pink
ACCENT_BLUE:  0xF8BBD0  -- pink (mislabeled as blue!)
```

**17 out of 19 named colors are pink/lavender.** Three colors are mislabeled -- `ACCENT_TEAL`, `ACCENT_BLUE`, and `BG_MINT` are all pink values despite their names.

The `TEXT` object uses purple tones (#6D3A5B, #B07A9E, #EC407A) which are fine for a pink theme.

### What Top Merge Games Use

**Travel Town palette:**
- Warm cream/sand backgrounds (not pink)
- Rich green for nature (#4CAF50 to #2E7D32)
- Warm gold/amber for UI chrome (#FFD700 to #FFA000)
- Ocean blue for secondary accents (#42A5F5)
- Wood brown for frames/borders (#8D6E63)
- Coral/salmon for highlights, not bubblegum pink (#FF8A65)

**Gossip Harbor palette:**
- Warm cream (#FFF5E1) -- not cold white, not pink
- Deep teal (#008080) and warm coral (#FF6F61) as complementary accents
- Honey gold (#DAA520) for premium elements
- Rich mahogany (#8B3A3A) for depth

**The "adult cute" formula from ART_DIRECTION.md:**
Colors at 70-80% saturation with WARM undertones. Not baby pastels (too nursery), not neon (too childish). Warm and saturated.

### Recommended Palette Changes

| Constant | Current | Recommended | Reasoning |
|----------|---------|-------------|-----------|
| BG_CREAM | 0xFFF0F5 (pink) | 0xFFF8F0 (warm cream) | Neutral warm base, not pink-biased |
| BG_PINK | 0xFFE4EC (pink) | 0xFFEDE0 (warm peach) | Warmer, less cold-pink |
| BG_MINT | 0xFCE4EC (pink!) | 0xE8F5E9 (actual soft mint) | Fix mislabel, add green to palette |
| BOARD_BG | 0xFCE4EC (pink) | 0xFFF5EE (seashell/warm white) | Board should be neutral-warm, items pop against it |
| CELL_BG | 0xFFF0F5 (pink) | 0xFFFAF5 (warm white) | Cells should be nearly white so items are the color |
| CELL_BORDER | 0xF8BBD0 (pink) | 0xE8D5C4 (warm beige) | Softer, warm, not aggressively pink |
| CELL_SHADOW | 0xF48FB1 (pink) | 0xD7C4B8 (warm shadow) | Shadows should be warm neutral, not colored |
| ACCENT_TEAL | 0xF48FB1 (pink!) | 0x4DB6AC (actual teal) | Fix mislabel, add a cool accent color |
| ACCENT_BLUE | 0xF8BBD0 (pink!) | 0x64B5F6 (actual blue) | Fix mislabel, add blue accent |
| UI_BG | 0xFFF0F5 (pink) | 0xFFF8F2 (warm cream) | UI should feel warm, not pink |
| UI_PANEL | 0xFCE4EC (pink) | 0xFFF0E8 (warm peach cream) | Warmer panel background |

**Keep:** ACCENT_PINK (0xF06292), ACCENT_ROSE (0xEC407A), ACCENT_GOLD (0xFFD700). Pink should be an ACCENT, not the foundation.

**Add new colors:**
```
WARM_BROWN: 0xD7CCC8    -- for board frames, UI trim
SAGE_GREEN: 0xA5D6A7    -- for nature/garden environmental details
SOFT_CORAL: 0xFF8A65    -- warm accent alternative to cold pink
CREAM_GOLD: 0xFFE0B2    -- warm highlight for premium elements
DEEP_WOOD:  0x8D6E63    -- for grounding elements, outlines
```

The principle: **Pink stays as a theme accent (Allie clearly likes pink), but the foundation shifts to warm cream/peach/amber so items have color contrast against the background.** Currently, pink items on a pink board on a pink background creates visual mush.

---

## 6. PRIORITY IMPLEMENTATION ORDER

### Phase 1: Immediate Impact (1-2 sessions)
*These changes will transform the game's perceived quality the most.*

1. **Fix the palette** (constants.ts) -- shift foundation from pink to warm cream, fix mislabeled colors. Pink becomes accent.
2. **Nature chain overhaul** -- create distinct silhouettes for maple leaf, pine tree, tree, palm tree. Currently the worst chain.
3. **Flower chain tiers** -- make T1-T3 distinct objects (seed, sprout in soil, stem with leaves). Make T4-T8 distinct flower types.
4. **Love chain variety** -- twin hearts, winged heart, heart with bow. Cannot have 5 identical hearts.
5. **Board frame** -- add a visible decorative border around the board.
6. **Merge white flash** -- add the expanding white circle at merge point.
7. **Background warmth** -- diversify the time-of-day gradients.

### Phase 2: Detail Density (2-3 sessions)
*Bring individual items to Travel Town detail levels.*

8. **Fruit chain shapes** -- grape cluster, kiwi cross-section, mango teardrop, peach with crease.
9. **Butterfly chain variety** -- bee stripes, ladybug dome, peacock fan tail.
10. **Tea chain shapes** -- matcha bowl, boba with pearls.
11. **Sweet chain shapes** -- cookie chips, chocolate bar grid, cupcake wrapper + swirl frosting.
12. **Cosmic chain shapes** -- UFO saucer, nebula cloud.
13. **Cafe chain shapes** -- croissant horn, waffle grid.
14. **Board environmental details** -- 4-6 decorative flowers/leaves around the board.
15. **Order card progress bars** -- replace "0/2" text with mini fill bars.

### Phase 3: Polish (ongoing)
*These add cumulative quality but are not individually transformative.*

16. **Merge shockwave rings** and confetti particles
17. **Merge result golden glow** outline on new items
18. **Idle animations** for T5+ items
19. **Star chain variety** -- shooting star trail, sparkle cluster
20. **Crystal chain variety** -- crystal ball sphere, brilliant-cut diamond
21. **UI chrome improvements** -- top bar inner shadow, XP bar shimmer, bottom nav notification dots
22. **Spawn micro-bounce** and particle puff
23. **Crown gem variety** -- multiple gem colors
24. **Board cell glass-tile edge highlights**

---

## 7. THE "SHELL CHAIN STANDARD"

The Shell/Ocean chain is the quality bar every other chain must meet. It achieves a 7/10 because:

1. **Every tier has a unique silhouette** (coral branches / spiral shell / round crab / streamlined fish / curved dolphin / humanoid mermaid)
2. **Detail scales with tier** (T1 coral has 3-6 branches, T5 dolphin has 7+ distinct parts)
3. **Colors are saturated and warm** (coral red, warm sand, ocean blue, teal)
4. **Items would be identifiable as silhouettes alone** (no color needed)

When creating or updating any chain's drawing functions, the test is: "Would a player instantly know which tier this is if the icon were shown as a black silhouette at 40px?" If the answer is no, the tiers need different shapes, not just different colors.

---

## 8. PERFORMANCE NOTES

All icon drawing functions execute at texture generation time (PreloadScene), not per-frame. Adding detail to drawing functions has ZERO runtime performance impact -- the cost is paid once during preload, stored as texture, and rendered as a simple Image sprite thereafter.

The volumetric helpers (drawContactShadow, drawGradientRimLight, drawSpecularHighlight, drawWarmAmbient) in lines 2178-2286 of EmojiRenderer.ts are already implemented and used for the card background. The icon drawing functions themselves should also use these more aggressively -- particularly `drawContactShadow` beneath every item icon (not just the card), and `drawSpecularHighlight` on glossy items (fruits, crystals, candies).

The ambient sparkles and board rendering run every frame via Phaser tweens and graphics objects. Current counts (4+4 sparkles) are well within budget. Doubling to 8+8 is safe on iPhone SE 2nd gen baseline. Environmental decorations (flowers around board) should be static graphics with no tweens -- draw once, never update.

---

## Summary Scorecard

| Area | Current | Target | Gap |
|------|---------|--------|-----|
| Item icons (avg across chains) | 5/10 | 8/10 | 3 points |
| Board & atmosphere | 4/10 | 8/10 | 4 points |
| UI chrome | 5/10 | 7/10 | 2 points |
| Animation & juice | 6/10 | 8/10 | 2 points |
| Color palette | 3/10 | 8/10 | 5 points |
| **Overall** | **4.6/10** | **7.8/10** | **3.2 points** |

The palette and board atmosphere are the largest gaps. Fixing those two areas (Phase 1, items 1 + 5 + 7) would lift the overall score from 4.6 to approximately 6.0 before touching a single icon. The icon work (items 2-4, 6) brings it to 7+. Animation polish (Phase 2-3) gets it to the 7.5-8.0 range that competes with Travel Town.
