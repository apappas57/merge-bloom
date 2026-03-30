# Merge Bloom -- Design System

**Version:** 1.0
**Date:** 2026-03-30
**Aesthetic:** "Cute but Cunty" -- Y2K Kawaii x Modern Premium Indie
**Platform:** iPhone PWA (Phaser 3 + TypeScript)

---

## 1. Aesthetic References & Direction

### Core Vibe

The visual identity sits at the intersection of four aesthetics:

1. **Sanriocore** -- Round everything, pastel-dominant, the softness of Cinnamoroll and My Melody. This gives us our base warmth and approachability.
2. **Y2K Revival** -- Chrome hearts, holographic shimmer, glossy surfaces, pink metallics. This gives us our "premium" edge -- things should look expensive and touchable.
3. **Coquette** -- Bows, ribbons, soft lace textures, ultra-feminine. This adds decorative richness without cluttering.
4. **Indie Game Polish** -- The intentional color control of Monument Valley (every screen a painting), the atmospheric mood of Alto's Odyssey (time-of-day shifts), and the cozy density of Stardew Valley (always something to look at).

### What This Means In Practice

- NO flat UI. Every surface has a subtle gradient, even if it is only 5% opacity difference top-to-bottom.
- Every interactive element has a glossy "candy" quality -- like touching a polished jellybean.
- Sparkles are a design element, not a decoration. They communicate tier, rarity, and delight.
- Backgrounds are atmospheric and shift with time -- not static wallpapers.
- The board itself should feel like a precious object: a jewellery box or vanity case, not a plain grid.

### Merge Game Visual Learnings (Travel Town / Merge Mansion)

- **Travel Town** succeeds with vibrant 2D cartoon graphics, simplified interface, and clear item layouts. Items are easily distinguishable at small sizes.
- **Merge Mansion** uses darker tones and detailed manor decor for a more "adult" mystery vibe. Seasonal themes keep visuals fresh.
- **What we take:** Travel Town's clarity and item readability. We exceed both by making every single item card a "collectible" with tier-based visual progression that makes high-tier items feel genuinely rare and beautiful.
- **What we avoid:** Merge Mansion's darkness and Travel Town's generic cartoon flatness. Our items should look like premium sticker collectibles.

### TikTok Virality Checklist

Every screen should pass these tests:
- Would someone screenshot this to share on an aesthetic page? (Color harmony)
- Does it sparkle / shimmer / have satisfying motion? (Visual candy)
- Is there a "oh that's so cute" moment visible? (Character portraits, item designs)
- Does it look different from every other merge game? (Pink chrome, not generic cartoon)

---

## 2. Color System

### 2.1 Primary Palette

These are the dominant colors across the entire UI. Everything else is built from or complements these.

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Rose Quartz** | `#F8A4C8` | 248, 164, 200 | Primary brand pink. Buttons, active states, key UI elements. |
| **Cotton Candy** | `#FFD6E8` | 255, 214, 232 | Light pink. Card backgrounds, cell fills, soft surfaces. |
| **Blush Cream** | `#FFF0F5` | 255, 240, 245 | Page background, empty states, breathing room. |
| **Hot Fuchsia** | `#E84393` | 232, 67, 147 | Bold accent. CTAs, notifications, "look here" moments. |

### 2.2 Secondary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Lilac Dream** | `#D4A5FF` | 212, 165, 255 | Secondary accent. XP bars, quest progress, achievements. |
| **Baby Blue** | `#A8D8EA` | 168, 216, 234 | Gem currency, info states, cool-tone balance. |
| **Champagne Gold** | `#F5D280` | 245, 210, 128 | Coins, rewards, tier highlights, premium feel. |
| **Soft Lavender** | `#E8D5F5` | 232, 213, 245 | Modal overlays, secondary panels, depth layers. |

### 2.3 Semantic Colors

| State | Primary | Light | Dark |
|-------|---------|-------|------|
| **Success** | `#7DD3A8` | `#D4F5E5` | `#2D8B5E` |
| **Warning** | `#FFD166` | `#FFF3D4` | `#CC8800` |
| **Error** | `#FF6B6B` | `#FFD4D4` | `#CC2929` |
| **Info** | `#74B9FF` | `#D4E9FF` | `#2962CC` |

### 2.4 Chain-Specific Colors

Each merge chain has its own gradient personality. These are used for item card backgrounds.

| Chain | From (light) | To (saturated) | Hex From | Hex To |
|-------|-------------|----------------|----------|--------|
| Flower | Petal pink | Rose | `#FFD6E8` | `#F8A4C8` |
| Fruit | Peach cream | Coral | `#FFD8C4` | `#FF9A76` |
| Crystal | Lavender mist | Amethyst | `#E0D4F5` | `#B39DDB` |
| Butterfly | Sky blue | Cerulean | `#C8E6F5` | `#81D4FA` |
| Star | Lemon cream | Gold | `#FFF5CC` | `#FFD54F` |
| Nature | Mint cream | Sage | `#D4F0D4` | `#81C784` |
| Tea | Warm taupe | Cinnamon | `#E8DDD4` | `#BCAAA4` |
| Shell | Aqua mist | Teal | `#CCF2F6` | `#80DEEA` |
| Sweet | Rose pink | Magenta | `#FFD0E8` | `#F06292` |

### 2.5 Gradient Recipes

#### Background Gradients (Time-of-Day)

```
Morning (6am-12pm):
  Top: #FFF5F0 (warm cream)
  Bottom: #FFE4EC (soft pink)
  Midpoint: 60% from top

Afternoon (12pm-5pm):
  Top: #F0F0FF (cool white)
  Bottom: #E8D5F5 (soft lavender)
  Midpoint: 55% from top

Evening (5pm-9pm):
  Top: #FFE4EC (pink)
  Bottom: #E0C4FF (orchid)
  Midpoint: 50% from top

Night (9pm-6am):
  Top: #2D1B4E (deep purple)
  Bottom: #1A0D2E (midnight)
  Midpoint: 40% from top
  Note: Stars/sparkle particles appear during night mode
```

#### Button Gradients

```
Primary Button:
  Top: #F8A4C8 (rose quartz)
  Bottom: #E84393 (hot fuchsia)
  Direction: top-to-bottom
  Hover: shift both +10% brightness
  Active: shift both -10% brightness + scale 0.95

Secondary Button:
  Top: #FFD6E8 (cotton candy)
  Bottom: #F8A4C8 (rose quartz)
  Direction: top-to-bottom
  Border: 1.5px solid #F8A4C8

Danger Button:
  Top: #FF8A8A
  Bottom: #FF4757
  Direction: top-to-bottom
```

#### Card Gradients

```
Item Card (base):
  Top: chain.from (light variant)
  Bottom: chain.to (saturated variant)
  Direction: top-to-bottom
  Glossy overlay: linear-gradient top 0% rgba(255,255,255,0.45) to 45% rgba(255,255,255,0)

Panel/Modal Card:
  Top: #FFFFFF at 95% opacity
  Bottom: #FFF0F5 at 90% opacity
  Direction: top-to-bottom
  Backdrop: blur(12px)
```

### 2.6 Glossy / Chrome Effect Recipes

These are the key techniques to achieve the "expensive candy" look.

#### Glass Card Effect (Canvas 2D -- for Phaser)
```
1. Fill rounded rect with gradient (chain colors, top-to-bottom)
2. Clip to same rounded rect
3. Fill top 45% with linear gradient:
   - Stop 0: rgba(255, 255, 255, 0.45)
   - Stop 1: rgba(255, 255, 255, 0.0)
   This creates the "highlight on top of a sphere" look.
4. Add bottom edge shadow:
   - shadowColor: rgba(0, 0, 0, 0.15)
   - shadowBlur: 6% of card size
   - shadowOffsetY: 4% of card size
```

#### Chrome / Holographic Shimmer (for max-tier items)
```
1. Create linear gradient at 45-degree angle across card
2. Color stops:
   - 0.00: #FF6B9D (pink)
   - 0.17: #FFD93D (gold)
   - 0.33: #6BCB77 (green)
   - 0.50: #4D96FF (blue)
   - 0.67: #9B59B6 (purple)
   - 0.83: #FF6B9D (pink again)
   - 1.00: #FFD93D (gold wrap)
3. Apply as strokeStyle for border (3-5% card width)
4. Animate by shifting color stops +0.1 per frame (creates the rainbow crawl)
```

#### Inner Glow Effect
```
After drawing card border:
1. Inset stroke by 2px from border
2. strokeStyle: rgba(255, 255, 255, 0.5)
3. lineWidth: 1.5% of card size
This creates a "lit from within" candy effect.
```

---

## 3. Typography System

### 3.1 Font Stack

| Role | Font | Weight | Google Fonts |
|------|------|--------|-------------|
| **Heading** | Fredoka | 600-700 | `Fredoka:wght@400;500;600;700` |
| **Body** | Nunito | 400-700 | `Nunito:wght@400;600;700` |
| **Accent/Numbers** | Fredoka | 700 | Same family, used for counters, prices, XP values |

**Fallback stack:** `system-ui, -apple-system, sans-serif`

Fredoka is the perfect kawaii heading font: bubbly rounded strokes that feel plush and squeezable at display sizes, but still sharp enough for small UI labels. Nunito is its ideal body companion: rounded terminals maintain the soft feel while being highly legible at small sizes.

### 3.2 Size Scale (in CSS pixels, DPR-scaled at render)

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `xs` | 9px | 1.2 | Fine print, timestamps |
| `sm` | 11px | 1.3 | Secondary labels, badges |
| `base` | 13px | 1.4 | Body text, descriptions, UI labels |
| `md` | 15px | 1.3 | Section headers, button text |
| `lg` | 18px | 1.2 | Card titles, level numbers |
| `xl` | 22px | 1.1 | Modal headings, celebration text |
| `2xl` | 28px | 1.0 | Level-up splash, hero numbers |
| `3xl` | 36px | 1.0 | Full-screen celebration moments only |

### 3.3 Weight Usage Rules

| Weight | Name | When to Use |
|--------|------|-------------|
| 400 | Regular | Body text, descriptions, lore text |
| 600 | SemiBold | UI labels, button text, active navigation |
| 700 | Bold | Numbers (XP, coins, gems), headings, celebration text |

### 3.4 Text Color Rules

| Context | Color | Hex |
|---------|-------|-----|
| Primary text (dark on light) | Deep Plum | `#5D2A4A` |
| Secondary text | Muted Rose | `#9E6B88` |
| Accent / interactive | Hot Fuchsia | `#E84393` |
| Gold values (coins, rewards) | Champagne Dark | `#C8921A` |
| Gem values | Sky Blue | `#5BA4D9` |
| On dark background | White | `#FFFFFF` |
| On pink button | White | `#FFFFFF` |
| Disabled | Faded Pink | `#D4B0C4` |

---

## 4. Component Design Specs

### 4.1 Merge Items (Item Cards)

The item card is the most important visual element in the game. Every card should feel like a tiny, precious collectible.

#### Base Card Structure

```
Outer padding: 6% of card size (breathing room for shadow)
Corner radius: 20% of card size (very round -- kawaii)
Shadow: rgba(0,0,0,0.15), blur 6%, offsetY 4%
```

#### Tier Visual Progression

| Tier | Border | Background | Special Effects |
|------|--------|------------|-----------------|
| 1 | 2.5% width, chain.to at 60% opacity | Chain gradient (from -> to) | None. Clean and simple. |
| 2 | 2.5% width, chain.to at 70% opacity | Chain gradient | Slightly brighter gradient. |
| 3 | 3.5% width, chain.to solid | Chain gradient + inner glow | Inner white glow line (1.5% width, 35% opacity) |
| 4 | 3.5% width, chain.to solid | Chain gradient + inner glow | Same as 3, marginally brighter |
| 5 | 4% width, `#FFD54F` (gold) | Chain gradient + inner glow | Gold border. Gold sparkle dots at 4 corners (4% size). Inner gold glow line. |
| 6 | 4% width, `#FFD54F` (gold) | Chain gradient + double inner glow | Same as 5, sparkles slightly larger (5% size). Subtle continuous sparkle particles (4 orbiting). |
| 7 | 5% width, rainbow holographic gradient | Chain gradient + triple glow | Full rainbow shimmer border. Gold star sparkles at 4 corners (6% size). Inner white glow. 8 orbiting sparkle particles. |
| 8 | 5% width, rainbow holographic gradient | Chain gradient + max glow | Everything from 7, but: golden radial underglow behind card. 12 orbiting sparkle particles. Continuous subtle pulse (scale 1.0 to 1.03 over 2s). |

#### Emoji Rendering

```
Emoji size: 65% of card size
Position: centered horizontally, centered vertically + 2% downward offset (visual centering)
Font: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif
```

#### What Makes Max-Tier Items Feel SPECIAL

1. **Rainbow holographic border** that cycles through colors (animated, not static)
2. **Golden underglow** -- a radial gradient behind the card: `rgba(255, 215, 0, 0.2)` spreading 120% of card size
3. **Perpetual sparkle orbit** -- 12 tiny 4-point stars orbiting the card at varying distances and speeds
4. **Gentle breathe animation** -- scale pulses between 1.0 and 1.03 on a 2-second Sine.easeInOut loop
5. **On-place shimmer** -- when a max-tier item lands on the board, a brief white flash + golden particle burst (larger than normal merge particles)

### 4.2 Board

#### Cell Design

```
Cell size: s(50) -- 50 CSS px, DPR-scaled
Cell gap: s(3)
Cell corner radius: s(10)

Cell background: #FFF0F5 (blush cream)
Cell border: 1.5px solid #F8BBD0 (pastel pink)

Hover/drag-over state (valid):
  Background: #FFD6E8 (cotton candy)
  Border: 2px solid #F8A4C8 (rose quartz)
  Scale: 1.05 (subtle pop)
  Duration: 100ms Sine.easeOut

Hover/drag-over state (invalid):
  Background: #FFE0E0 (error light)
  Border: 2px solid #FF6B6B
  Shake: 3px horizontal, 80ms

Empty cell visual:
  Background: #FFF5F8 (barely-there pink)
  Center dot: 3px circle, #F0D0E0 at 40% opacity
  Purpose: the dot signals "something can go here" without looking broken
```

#### Board Frame

```
Board outer padding: s(12)
Board background: rounded rect with:
  Fill: linear-gradient(top #FCE4EC, bottom #F8D0E0)
  Corner radius: s(16)
  Border: 2px solid #F8BBD0
  Shadow: 0 s(4) s(12) rgba(200, 100, 150, 0.15)

Decorative elements:
  - Tiny bow/ribbon SVG at top-center of board frame (purely decorative, 16px)
  - Optional: subtle lace-pattern texture overlay at 3% opacity (coquette touch)
```

#### Locked Cell

```
Background: #E8D5F5 (soft lavender) at 60% opacity
Overlay: tiny lock emoji (🔒) at 40% opacity, centered
Border: 1.5px dashed #D4A5FF
```

#### Bonus Cell (Golden)

```
Background: radial-gradient(center #FFF5CC, edge #FFE580)
Border: 2px solid #FFD54F
Pulsing glow: box-shadow 0 0 8px rgba(255, 213, 79, 0.4), pulses opacity 0.2-0.6 over 1.5s
Duration indicator: circular ring that depletes over 60 seconds
```

### 4.3 Order Cards

Order cards are the primary progression driver. They need to be readable at small sizes while still feeling cute and premium.

#### Card Structure

```
Card width: (screen width - padding) / 3 (3 cards visible)
Card height: s(68)
Corner radius: s(12)
Background: linear-gradient(top #FFFFFF at 95%, bottom #FFF0F5 at 90%)
Border: 1.5px solid #F8BBD0
Shadow: 0 s(2) s(6) rgba(200, 100, 150, 0.12)
```

#### Character Portrait Frame

```
Shape: Circle, diameter s(28)
Border: 2.5px solid character.accent color
Inner shadow: inset 0 0 4px rgba(0,0,0,0.08)
Position: left-aligned with s(6) padding

Decorative ring (optional for special orders):
  Outer ring: 1px solid character.accent at 40% opacity
  Gap: 2px between ring and portrait border
  Creates a "framed miniature" look
```

#### Card Layout (Compact)

```
+---------------------------+
| [Portrait]  Requested     |
|    Rose     items row      |
|            [====---] 2/4   |
|            [Claim btn]     |
+---------------------------+

Portrait: s(28) circle, left side
Character name: Fredoka 600, 9px, character.accent color
Item icons: row of emoji, 14px each, max 3 visible ("+N" if more)
Progress bar: full width below items
Claim button: appears only when complete, small pill "Claim!" in Hot Fuchsia
```

#### Progress Indicator

NOT just numbers. A visual fill bar:

```
Track: s(4) tall rounded rect, #F0D0E0 fill
Fill: s(4) tall rounded rect, gradient left-to-right:
  From: #F8A4C8 (rose quartz)
  To: #E84393 (hot fuchsia)
Corner radius: s(2)
Animation: fill width tweens to new value over 300ms Cubic.easeOut

Text overlay: "2/4" in Fredoka 600, 8px, #9E6B88, right-aligned above bar
```

#### Completion Celebration

When all items in an order are fulfilled:

```
1. Card border flashes gold (2 pulses, 200ms each)
2. Character portrait does a tiny bounce (scale 1.0 -> 1.15 -> 1.0, 300ms Bounce.easeOut)
3. "Claim!" button appears with a scale-up pop (0 -> 1.1 -> 1.0, 250ms Back.easeOut)
4. Tiny sparkle particles (4) burst from the card center
5. On claim tap:
   a. Card slides up and fades (200ms)
   b. Coin fountain: 8-12 coin emojis burst upward from card position with gravity
   c. Coin count in top bar does a bump animation (+value floats up from count)
   d. New order card slides in from right (250ms Cubic.easeOut)
```

### 4.4 Buttons

#### Primary Button

```
Shape: Pill (border-radius 50% of height)
Height: s(36)
Padding horizontal: s(16)
Background: linear-gradient(top #F8A4C8, bottom #E84393)
Text: Fredoka 600, 13px, #FFFFFF
Shadow: 0 s(3) s(8) rgba(232, 67, 147, 0.3)
Border: none

Glossy overlay:
  Top 45% of button: linear-gradient rgba(255,255,255,0.25) to rgba(255,255,255,0)

Active/press state:
  Scale: 0.93 over 80ms Sine.easeOut
  Gradient shifts: top #E89AB8, bottom #D13A80
  Shadow reduces: 0 s(1) s(4) rgba(232, 67, 147, 0.2)

Disabled state:
  Background: flat #D4B0C4
  Text: #FFFFFF at 60% opacity
  No shadow
```

#### Secondary Button

```
Shape: Pill
Height: s(34)
Background: linear-gradient(top #FFE8F0, bottom #FFD6E8)
Text: Fredoka 600, 13px, #E84393
Border: 1.5px solid #F8A4C8
Shadow: 0 s(2) s(4) rgba(200, 100, 150, 0.1)

Active state:
  Scale: 0.93
  Background: flat #FFD6E8
```

#### Danger Button

```
Shape: Pill
Height: s(34)
Background: linear-gradient(top #FF8A8A, bottom #FF4757)
Text: Fredoka 600, 13px, #FFFFFF
Border: none
Shadow: 0 s(2) s(6) rgba(255, 71, 87, 0.25)

Active state:
  Scale: 0.93
  Gradient: top #E87878, bottom #E03A4A
```

#### Icon Button (Bottom Bar, etc.)

```
Shape: Circle or squircle, s(40) x s(40)
Background: transparent (default), #FFE8F0 (hover)
Icon: emoji, 14px
Label: Nunito 400, 8px, #9E6B88
Active: scale 0.9, background #FFD6E8
```

### 4.5 Modals / Overlays

#### Background Dim

```
Color: rgba(93, 42, 74, 0.4)  -- uses our deep plum tint, not pure black
Backdrop filter: blur(8px)
Entry: fade from 0 to target opacity over 200ms
Exit: fade to 0 over 150ms
```

#### Panel Design

```
Background: #FFFFFF at 97% opacity
Corner radius: s(20)
Shadow: 0 s(8) s(32) rgba(93, 42, 74, 0.2)
Max width: 90% of screen width
Padding: s(20) all sides

Header:
  Background: linear-gradient(left #FFD6E8, right #E8D5F5) -- pink to lavender sweep
  Height: s(44)
  Corner radius: s(20) s(20) 0 0 (top corners only)
  Title: Fredoka 700, 18px, #5D2A4A, centered
  Close button: "x" in s(28) circle, top-right, #9E6B88

Decorative touch:
  Tiny bow emoji (🎀) or sparkle (✨) beside the title text
  Adds personality without cluttering

Content area:
  Padding-top: s(16)
  Scrollable if content exceeds 60% screen height
```

#### Entry / Exit Animations

```
Entry:
  Panel scales from 0.85 to 1.0 + fades from 0 to 1
  Duration: 250ms
  Ease: Back.easeOut (slight overshoot for playfulness)
  Stagger: dim background starts 50ms before panel

Exit:
  Panel scales from 1.0 to 0.9 + fades from 1 to 0
  Duration: 180ms
  Ease: Cubic.easeIn
  Dim background fades 50ms after panel starts
```

### 4.6 Top Bar

```
Height: SAFE_AREA_TOP + s(42)
Background: #FFF0F5 at 95% opacity
Bottom border: 1px solid #F8BBD0 at 30% opacity
Content starts at: SAFE_AREA_TOP + s(4)

Layout (left to right):
  [Level badge]  ----  [Coins]  ----  [Gems]

Level badge:
  Text: "⭐{level}" in Fredoka 600, 13px, #C8921A

Coins:
  Text: "🪙{count}" in Fredoka 600, 13px, #C8921A
  Position: center of bar

Gems:
  Text: "💎{count}" in Fredoka 600, 13px, #5BA4D9
  Position: right-aligned, s(10) from edge

XP Bar (below currency row):
  Track: full width - s(20) padding, s(6) tall, corner radius s(3)
  Track color: #FCE4EC
  Fill: linear-gradient(left #F8A4C8, right #D4A5FF) -- pink to lilac
  Fill corner radius: s(3)
  Animation: width tweens over 400ms Cubic.easeOut
  On fill (level up): flash white, then refill from 0
```

### 4.7 Bottom Bar

```
Height: s(58)
Background: #FFF0F5 at 95% opacity
Top border: 1px solid #F8BBD0 at 20% opacity
Position: fixed to bottom

Layout: 3 equal-width columns
Each column:
  Emoji icon: 14px, centered
  Label: Nunito 400, 8px, #9E6B88, centered below icon
  Hit area: full column width x full bar height

Active tab indicator:
  Small dot (s(4)) below label, filled #E84393
  Or: label color changes to #E84393

Button definitions:
  [🛒 Shop]  [📖 Items]  [⚙️ More]
```

### 4.8 Generators

#### Visual Design

```
Same rounded-rect card as items, but with:
  Background gradient: #FFE4EC -> #FFD0E0 -> #FFB8D0 (3-stop, warmer pink)
  Border: 5% width, #F06292 (strong rose)
  Secondary inner border: chain.to color at 50% opacity
  Corner radius: 22% (slightly rounder than items)

"+" badge in top-right corner:
  Circle, radius 11% of card size
  Fill: #E84393
  Stroke: #FFFFFF, 1.5% width
  "+" text: white, bold, 140% of badge radius
```

#### Ready State

```
Pulsing glow ring:
  Color: #F8A4C8 at 40% opacity
  Radius: card size * 0.6
  Animation: opacity 0.2 -> 0.5 -> 0.2, scale 0.95 -> 1.05 -> 0.95
  Duration: 1.5s, Sine.easeInOut, loop infinite

Gentle float:
  Y offset: -s(2) to +s(2)
  Duration: 2s, Sine.easeInOut, loop infinite (yoyo)
```

#### Cooldown State

```
Dimmed: entire card at 70% opacity
Circular progress ring:
  Track: rgba(255, 255, 255, 0.3), 3px width
  Fill: #F06292 -> #E84393 (clockwise sweep)
  Radius: 40% of card size
  Center of card
  Animation: arc fills clockwise matching cooldown timer
```

---

## 5. Animation Principles

### 5.1 Easing Functions (Phaser 3 Names)

| Purpose | Easing | Phaser String |
|---------|--------|---------------|
| **General smooth motion** | Cubic Out | `'Cubic.easeOut'` |
| **Bouncy arrival** (items, badges) | Back Out | `'Back.easeOut'` |
| **Playful overshoot** (celebration) | Elastic Out | `'Elastic.easeOut'` |
| **Gentle pulse** (glow, breathe) | Sine InOut | `'Sine.easeInOut'` |
| **Snappy feedback** (button press) | Sine Out | `'Sine.easeOut'` |
| **Quick exit** (dismiss, delete) | Cubic In | `'Cubic.easeIn'` |
| **Landing bounce** (item drop) | Bounce Out | `'Bounce.easeOut'` |
| **Dramatic slow-mo** (big rewards) | Expo Out | `'Expo.easeOut'` |

### 5.2 Duration Guidelines

| Speed | Duration | Use Cases |
|-------|----------|-----------|
| **Instant** | 50-80ms | Button color shift, highlight toggle |
| **Fast** | 100-200ms | Button press scale, cell highlight, hover state |
| **Medium** | 250-400ms | Merge animation, item spawn, card slide |
| **Slow** | 500-800ms | Celebration particles, float text fadeout, modal entry |
| **Dramatic** | 800-1200ms | Level-up fanfare, chain-finale celebration, confetti |

### 5.3 "Juice" Recipes

#### Merge Impact (Frame-by-Frame)

```
T+0ms:     Player releases drag. Item A begins flying to Item B.
T+0-180ms: Item A tweens to B's position (Cubic.easeOut, 180ms)
           Item A scales 1.0 -> 0.7 during flight
T+180ms:   Both items A and B scale to 0 simultaneously (80ms, Sine.easeIn)
T+260ms:   White flash circle expands from merge point
           Radius: 0 -> cell size * 0.8 over 60ms, then fades over 100ms
T+260ms:   Particle burst: 10 small circles (4px) radiate outward
           Colors: chain.from, chain.to, #FFFFFF (random per particle)
           Distance: 20-40px from center
           Duration: 350ms, Cubic.easeOut
           Fade: each particle fades from 1.0 to 0 over last 150ms
           Rotation: each particle rotates 90-180 degrees
T+320ms:   New merged item appears at merge position
           Scale: 0 -> 1.2 -> 1.0 (Back.easeOut, 280ms)
T+400ms:   "+{XP} XP" text appears above item
           Color: #D4A5FF (lilac)
           Font: Fredoka 700, 11px
           Drift: Y -30px over 600ms, Sine.easeOut
           Fade: opacity 1.0 -> 0 over last 200ms
T+600ms:   Animation complete. Total: ~600ms from release.
```

#### Three-Merge Bonus

```
Same as above, but:
- Third item also flies to merge point (staggered 50ms after first)
- Particle count: 16 (not 10)
- Flash circle is larger (cell size * 1.2) and gold-tinted
- Bonus item spawns 200ms after main item with smaller pop
- "Nice!" text appears above: Fredoka 700, 15px, #FFD54F
- Text has a slight scale pulse (1.0 -> 1.15 -> 1.0, 200ms)
```

#### Item Spawn Pop (from Generator)

```
T+0ms:     Generator tap registered.
T+0-100ms: Generator does a quick squish (scaleX 1.1, scaleY 0.9, 100ms Sine.easeOut)
T+100ms:   Generator bounces back (scaleX 1.0, scaleY 1.0, 150ms Bounce.easeOut)
T+100ms:   New item appears in adjacent cell
           Scale: 0 -> 1.15 -> 1.0 (Back.easeOut, 250ms)
           Alpha: 0 -> 1 over first 100ms
T+150ms:   Small "+" particle at spawn point (#FFFFFF, 3 particles, small)
T+350ms:   Complete.
```

#### Reward Celebration (Quest / Order Complete)

```
T+0ms:     Completion detected.
T+0ms:     Sound: chime + sparkle layer
T+0-50ms:  Card border flashes gold (2 pulses, 100ms each)
T+100ms:   Card does a scale bump (1.0 -> 1.08 -> 1.0, 200ms Back.easeOut)
T+150ms:   Confetti burst from card center:
           - 20-30 small shapes (circles, stars, hearts)
           - Colors: #F8A4C8, #D4A5FF, #FFD54F, #A8D8EA, #FF6B9D
           - Gravity: particles rise then fall with simulated gravity
           - Spread: 60-degree cone upward
           - Duration: 1000ms total, particles fade in last 300ms
T+300ms:   Reward text floats up: "+{coins} 🪙" in Fredoka 700
           Gold color, drift up 40px, fade over 800ms
T+500ms:   Coin counter in top bar bumps (scale 1.0 -> 1.3 -> 1.0, 200ms)
```

#### Level Up Fanfare

```
T+0ms:     XP bar fills completely.
T+0-100ms: XP bar flashes white (100ms)
T+100ms:   Full-screen white flash (alpha 0 -> 0.5 -> 0, 300ms)
T+200ms:   "LEVEL {N}!" text center screen
           Font: Fredoka 700, 28px, #FFD54F with 2px #E84393 stroke
           Scale: 0 -> 1.3 -> 1.0 (Elastic.easeOut, 500ms)
T+200ms:   Confetti explosion from screen center:
           - 60+ particles
           - Mix of circles, stars, hearts, sparkles
           - Colors: full palette rainbow
           - 360-degree spread
           - Duration: 1500ms with gravity
T+500ms:   Subtitle text fades in: story beat text or reward description
           Font: Nunito 400, 13px, #5D2A4A
           Fade in over 300ms
T+2500ms:  All celebration elements fade out (400ms)
T+3000ms:  XP bar resets to 0 and begins filling for next level
```

#### Button Press Feedback

```
On pointer down:
  Scale: 1.0 -> 0.93 (80ms, Sine.easeOut)
  Gradient darkens slightly

On pointer up:
  Scale: 0.93 -> 1.0 (100ms, Bounce.easeOut)
  Gradient returns to normal
  If action succeeds: small sparkle burst at button center (4 particles, 150ms)
```

#### Generator Ready Pulse

```
Continuous when generator is ready:
  Glow ring opacity: 0.2 -> 0.5 -> 0.2 (1.5s, Sine.easeInOut, loop)
  Glow ring scale: 0.95 -> 1.05 -> 0.95 (same timing)
  Item float: y +-s(2) (2s, Sine.easeInOut, yoyo loop)

On tap (ready):
  Glow ring flash to 0.8 opacity then disappear (100ms)
  Generator squish (see Item Spawn above)
  Cooldown ring appears and begins filling
```

---

## 6. Sound Design Direction

### 6.1 Music Genre

**Primary:** Music box + lo-fi ambient garden hybrid. Think a Sanrio character's music box playing in a sunlit greenhouse. Gentle, cyclical melodies with soft bell tones, occasional wind chimes, and a lo-fi warmth (slight vinyl crackle optional).

**Night mode variant:** Softer, slower, more ambient. Add quiet cricket ambience and reduce melodic elements.

**Key qualities:**
- Melodic but not distracting (player will hear it for hours)
- Loops seamlessly (60-90 second loops minimum)
- No percussion heavier than a soft shaker or finger snap
- Instrumentation: glockenspiel, music box, soft piano, celeste, acoustic guitar (sparse)

### 6.2 Key Sound Moments

| Moment | Sound Character | Duration |
|--------|----------------|----------|
| **Merge (tier 1-3)** | Soft pop + ascending chime (2 notes) | 200ms |
| **Merge (tier 4-5)** | Richer pop + 3-note ascending chime + sparkle layer | 300ms |
| **Merge (tier 6+)** | Crystalline cascade + chord swell + shimmer tail | 500ms |
| **Max-tier creation** | Full ascending arpeggio + choir "ahh" + sparkle explosion | 800ms |
| **Generator tap** | Soft woody "tok" + tiny spring bounce | 150ms |
| **Generator ready** | Single soft bell ding | 100ms |
| **Item pickup** | Tiny suction "pop" | 80ms |
| **Item drop (valid)** | Soft thud + tiny chime | 100ms |
| **Item drop (invalid)** | Muted "bonk" + rubber band | 150ms |
| **Order complete** | Brass fanfare (2-bar, cute) + coin cascade | 600ms |
| **Level up** | Ascending chime sequence (5 notes) + soft cymbal swell | 1200ms |
| **Button tap** | Soft click/bubble pop | 60ms |
| **Modal open** | Soft whoosh + single bell | 200ms |
| **Modal close** | Reverse soft whoosh | 150ms |
| **Three-merge** | All merge sounds but with added sparkle layer + "ping!" | 350ms |
| **Combo text** | Quick ascending 2-note trill | 150ms |

### 6.3 Sound Sources (Free / CC0)

| Source | URL | What to Get |
|--------|-----|-------------|
| Pixabay Kawaii SFX | https://pixabay.com/sound-effects/search/kawaii/ | Cute pop sounds, chimes |
| Pixabay Sparkle SFX | https://pixabay.com/sound-effects/search/sparkle/ | Shimmer and sparkle layers |
| Pixabay Cute SFX | https://pixabay.com/sound-effects/search/cute/ | Button pops, notification dings |
| Pixabay Chime SFX | https://pixabay.com/sound-effects/search/chime/ | Bell chimes, wind chimes |
| Pixabay Game SFX | https://pixabay.com/sound-effects/search/game/ | UI sounds, reward fanfares |
| Pixabay Kawaii Music | https://pixabay.com/music/search/kawaii/ | Background music loops |
| Zapsplat | https://www.zapsplat.com/ | High-quality game SFX (free tier) |
| Freesound | https://freesound.org/ | Music box samples, ambient nature |

---

## 7. Micro-Interactions Catalog

These are the small details that separate a "good" game from an "obsessively polished" one. Each should be implementable as a simple Phaser tween or particle emitter.

### Board Interactions

1. **Item wiggle on invalid drop** -- Item returns to origin with a horizontal shake: x +-3px, 3 oscillations over 200ms, Sine.easeOut decay.

2. **Cell glow on valid drag hover** -- Target cell background transitions to Cotton Candy (#FFD6E8) with a 1px scale bump over 100ms. Reverts on drag leave.

3. **Adjacent match highlight** -- When an item is picked up, all matching items on the board get a subtle pulse (opacity 0.7 -> 1.0 -> 0.7, 800ms, Sine.easeInOut, loop until item is dropped).

4. **Board settle after merge** -- Remaining items on the board do a micro-bounce (y -1px, 60ms) in a wave pattern emanating from the merge point. Stagger: 20ms per cell distance.

5. **Empty cell invitation shimmer** -- Every 8 seconds, a random empty cell gets a brief sparkle (tiny 4-point star, scale 0 -> 1 -> 0, 400ms, at 30% opacity). Subtle hint that the cell is available.

6. **New cell grow-in** -- When the board expands, new cells scale from 0 to 1.0 with a cascading delay (50ms per cell, Back.easeOut, 300ms each). A tiny sparkle accompanies each cell appearing.

### Character & Mascot Interactions

7. **Hearts float from mascot on merge** -- Each merge causes 1-2 tiny heart particles (🩷) to float upward from the mascot position. Rise 30px over 600ms, fade in last 200ms. Sine.easeOut drift.

8. **Mascot reaction to big merge** -- On tier 5+ merge, mascot does a jump animation (y -10px, 200ms, Bounce.easeOut) and briefly shows star eyes (swap texture for 400ms).

9. **Character portrait wave on order appear** -- When a new order card slides in, the character portrait does a tiny side-to-side wobble (rotation -5deg to +5deg, 2 cycles, 300ms, Sine.easeInOut).

10. **Character happy bounce on item delivery** -- When an item matching an order is created, the relevant character portrait does a small bounce (scale 1.0 -> 1.1 -> 1.0, 200ms, Bounce.easeOut) and a tiny sparkle appears above them.

### Currency & XP Interactions

11. **Stars burst from XP bar on fill** -- When XP bar reaches 100%, 8 tiny star particles (✨) burst upward from the bar in a 120-degree arc, rising 20-40px with gravity, fading over 400ms. Colors: #FFD54F, #D4A5FF.

12. **Coin fountain from order completion** -- 8-12 coin particles (🪙) burst upward from the completed order card, arc outward, then fall with gravity. Each coin: rise 40-80px, lateral spread 20-50px, total duration 800ms. Stagger: 30ms between each coin.

13. **Gem counter sparkle on purchase** -- When gems are spent, the gem counter text briefly turns white, then back to blue, with a tiny sparkle particle at the text position (200ms).

14. **Coin counter bump** -- When coins are earned, the coin count text scales 1.0 -> 1.25 -> 1.0 (200ms, Bounce.easeOut) and the new total tweens from old value (counting animation, 400ms).

### UI Polish

15. **Button ripple on tap** -- After button press, a circular ripple expands from tap point (rgba(255,255,255,0.3), 0 -> button width, 300ms, fading to 0). Like Material Design but softer.

16. **Tab switch slide** -- When switching bottom bar tabs (Shop, Items, More), the active dot indicator slides to the new tab position (200ms, Cubic.easeOut) instead of jumping.

17. **Notification badge bounce** -- When a new notification appears (quest complete, order ready), the badge scales from 0 -> 1.2 -> 1.0 (250ms, Bounce.easeOut) and the parent icon does a micro-shake.

18. **Modal content stagger** -- When a modal opens, content elements (title, items, buttons) fade in with a 40ms stagger delay, creating a "cascade reveal" effect.

19. **Pull-down quest panel spring** -- If the quest/order panel is expandable, pulling it down has a spring-physics feel: overscroll with elastic snapback (Elastic.easeOut, 400ms).

### Ambient & Delight

20. **Background sparkle drift** -- 3-5 tiny sparkle particles constantly drift downward across the screen at random x positions. Very slow (5-8 seconds to cross screen), very transparent (15-25% opacity). Creates living, breathing background. During night mode, these become stars.

21. **Seasonal particle overlay** -- Spring: occasional floating cherry blossom petal. Summer: tiny butterfly silhouette. Autumn: falling leaf. Winter: snowflake. One particle every 3-5 seconds, crosses screen slowly.

22. **Long-press delete hearts** -- When long-pressing to delete an item, instead of just showing a trash icon, tiny broken-heart particles (💔) float up, adding emotional weight to deletion.

23. **Achievement unlock shimmer** -- When an achievement unlocks, a horizontal golden shimmer line sweeps across the entire screen left-to-right (200ms, Sine.easeInOut, rgba(255,215,0,0.15)). Subtle but noticeable.

24. **Idle mascot animations** -- After 10 seconds of no interaction, mascot cycles through idle animations: blinking (close eyes 100ms), looking around (eye x-offset shift), and occasionally yawning or waving.

25. **First launch magic** -- On the very first game load, before the tutorial, a special "opening" animation: the board cells cascade in from the center outward (spiral pattern, 30ms stagger, Back.easeOut), accompanied by ascending chimes. Sets the tone immediately.

26. **Combo streak shimmer** -- During a multi-merge combo (2+ merges within 2 seconds), the board frame gets a subtle animated rainbow border that fades out 1 second after the last merge. Rewards fast play visually.

---

## 8. Implementation Notes

### Phaser-Specific Patterns

All colors in `constants.ts` should be stored as both hex numbers (for Phaser Graphics: `0xF8A4C8`) and hex strings (for CSS/text: `'#F8A4C8'`). The existing codebase already follows this pattern.

### Canvas 2D Rendering (EmojiRenderer.ts)

The item card rendering pipeline in `EmojiRenderer.ts` already implements the glossy card effect (gradient fill + top highlight overlay + shadow + tiered borders). The design system above formalizes and extends what exists. Key additions to implement:

1. Update `CHAIN_COLORS` values to match Section 2.4 chain colors
2. Add animated rainbow border for tier 7-8 (currently static -- needs Phaser tween on the texture or a separate animated ring sprite)
3. Add golden underglow sprite for max-tier items (separate Phaser Graphics object behind the item sprite)

### Performance Budget

- Particle emitters: max 3 active simultaneously (merge, ambient, celebration)
- Each emitter: max 30 particles
- Ambient sparkles: max 5 on screen at once
- Tween count: keep under 20 active tweens at any time
- All animations should use Phaser's built-in tween system (GPU-friendly)
- Canvas textures are rendered once at boot -- not per frame

### Color Constants Update

The current `constants.ts` COLORS object should be updated to reflect this design system:

```typescript
export const COLORS = {
  // Primary
  ROSE_QUARTZ: 0xF8A4C8,
  COTTON_CANDY: 0xFFD6E8,
  BLUSH_CREAM: 0xFFF0F5,
  HOT_FUCHSIA: 0xE84393,

  // Secondary
  LILAC_DREAM: 0xD4A5FF,
  BABY_BLUE: 0xA8D8EA,
  CHAMPAGNE_GOLD: 0xF5D280,
  SOFT_LAVENDER: 0xE8D5F5,

  // Semantic
  SUCCESS: 0x7DD3A8,
  WARNING: 0xFFD166,
  ERROR: 0xFF6B6B,
  INFO: 0x74B9FF,

  // Surfaces
  BG: 0xFFF0F5,
  BOARD_BG: 0xFCE4EC,
  CELL_BG: 0xFFF0F5,
  CELL_BORDER: 0xF8BBD0,
  UI_BG: 0xFFF0F5,
  UI_PANEL: 0xFCE4EC,
};

export const TEXT = {
  PRIMARY: '#5D2A4A',
  SECONDARY: '#9E6B88',
  ACCENT: '#E84393',
  GOLD: '#C8921A',
  GEM_BLUE: '#5BA4D9',
  WHITE: '#FFFFFF',
  DISABLED: '#D4B0C4',
};
```

---

*Design System v1.0 -- Merge Bloom*
*"Cute but cunty. Every pixel precious."*
