# Merge Bloom -- Game Design Document

**Version:** 1.0
**Date:** 2026-03-30
**Platform:** iPhone (PWA -- Progressive Web App)
**Tech Stack:** Phaser 3 + TypeScript + Vite
**Monetization:** None. This is a personal gift project. Unlimited gems, no ads, no energy system.

---

## Table of Contents

1. [Theme and Narrative](#1-theme-and-narrative)
2. [Core Mechanics](#2-core-mechanics)
3. [Merge Chains](#3-merge-chains)
4. [Generators](#4-generators)
5. [Progression System](#5-progression-system)
6. [Quest System](#6-quest-system)
7. [Economy](#7-economy)
8. [Board Features](#8-board-features)
9. [Visual Polish and Juice](#9-visual-polish-and-juice)
10. [UI Layout](#10-ui-layout-iphone-portrait)
11. [Tutorial Flow](#11-tutorial-flow)
12. [Save System](#12-save-system)
13. [Sound Design](#13-sound-design-future)
14. [Technical Architecture](#14-technical-architecture)
15. [Future Content Ideas](#15-future-content-ideas-v2)
16. [Appendix: Emoji Rendering Notes](#16-appendix-emoji-rendering-notes)

---

## 1. Theme and Narrative

### Name

**Merge Bloom**

Alternate names considered: Merge Garden, Bloom & Merge, Garden Merge, Little Garden Merge. "Merge Bloom" was chosen because it is short, evocative, and captures both the core mechanic (merge) and the cozy garden theme (bloom).

### Setting

The player has inherited a small, overgrown magical garden from a kind elderly neighbor. The garden was once magnificent -- full of rare flowers, crystal fountains, enchanted butterflies, and fruit-bearing trees -- but it has fallen into disrepair. By merging and creating beautiful things, the player restores the garden to its former glory.

### Tone

Warm, gentle, unhurried. There is no failure state. No pressure. No timers that punish you. The game is a calm, satisfying activity -- like tending a real garden.

### Story Beats

Story is delivered through short text pop-ups (2-3 sentences) when the player unlocks new areas or reaches milestone levels.

| Level | Story Beat |
|-------|-----------|
| 1 | "Welcome to your new garden! It is a little wild right now, but with some care, it will bloom again." |
| 3 | "Look -- the flower beds are coming back to life! The garden remembers being loved." |
| 5 | "You have unlocked the Orchard. The old fruit trees are still here, just waiting for attention." |
| 8 | "Something sparkles in the pond... crystals! This garden really is magical." |
| 10 | "The butterflies are returning! They only visit gardens full of life." |
| 12 | "A hidden path has appeared behind the big oak tree. Where does it lead?" |
| 15 | "The garden is beautiful again. But there are whispers of even more to discover..." |
| 18 | "The old greenhouse has been restored. Inside, rare and wonderful things can grow." |
| 20 | "The garden is in full bloom. You have brought the magic back. But every garden keeps growing..." |

### Garden Areas (Visual Backdrop Unlocks)

Each area changes the background art behind the board and introduces thematic merge chains.

| Area | Unlock Level | Theme | Primary Chain |
|------|-------------|-------|--------------|
| The Flower Beds | 1 | Wildflowers, soft grass | Flower Chain |
| The Orchard | 5 | Fruit trees, dappled light | Fruit Chain |
| The Crystal Pond | 8 | Shimmering water, stones | Crystal Chain |
| The Butterfly Meadow | 10 | Open field, warm breeze | Butterfly Chain |
| The Stargazing Hill | 13 | Twilight sky, fireflies | Star Chain |
| The Ancient Grove | 16 | Old-growth trees, moss | Nature Chain |
| The Greenhouse | 18 | Glass walls, warm glow | Bonus/mixed chains |

---

## 2. Core Mechanics

### The Board

- Grid-based play area displayed in iPhone portrait orientation
- Starting size: **5 columns x 7 rows** (35 cells)
- Maximum size: **7 columns x 9 rows** (63 cells)
- Each cell holds exactly one item or is empty
- Board expands at specific levels (see Progression)

### Item Interaction

**Drag and Drop:**
- Touch and hold an item to pick it up (150ms hold delay to avoid accidental drags)
- Drag to any empty cell to move it
- Drag onto a matching item (same chain, same tier) to merge
- If dropped on a non-matching item or occupied cell, the item returns to its original position with a gentle rubber-band animation
- Items cannot be placed off the board

**Merging:**
- Two items of the same type and tier combine into one item of the next tier
- The resulting item appears in the cell of the target (the item you dragged onto)
- The source cell becomes empty
- If a merge creates an item adjacent to another matching item, a subtle highlight pulse indicates a possible follow-up merge (but does not auto-merge -- the player always has agency)

**Three-Merge Bonus:**
- If three or more identical items are on the board, dragging one onto another merges all three (or more) at once
- Three items merging produces the next tier item PLUS a bonus item one tier below
- Example: three `🌷` (Tier 4) merge into one `🌹` (Tier 5) + one `☘️` (Tier 3)
- This encourages patience and board management

### Generators

- Special items that produce tier-1 items when tapped
- Have a cooldown timer between taps (visible as a circular fill animation)
- Cannot be merged with regular items
- Can be merged with other generators of the same type to create higher-tier generators
- Higher-tier generators have shorter cooldowns and occasionally produce tier-2 items

### Item Deletion

- Long-press (800ms) on any non-generator item shows a trash icon overlay
- Tap the trash icon to delete the item and free the cell
- Deletion awards a small amount of coins (1-3 depending on tier)
- Generators cannot be deleted (safety measure) -- they can only be sold through the Shop

---

## 3. Merge Chains

Each chain represents a thematic progression from humble beginnings to a spectacular final item. All items are rendered using native iOS emoji for crisp, familiar visuals.

### 3.1 Flower Chain (Unlocked: Level 1)

The first chain the player encounters. Gentle progression from seed to bouquet.

| Tier | Emoji | Name | Merge Count |
|------|-------|------|-------------|
| 1 | 🌱 | Sprout | -- |
| 2 | 🌿 | Fern | 2 Sprouts |
| 3 | ☘️ | Clover | 2 Ferns |
| 4 | 🌷 | Tulip | 2 Clovers |
| 5 | 🌹 | Rose | 2 Tulips |
| 6 | 🌸 | Cherry Blossom | 2 Roses |
| 7 | 🌺 | Hibiscus | 2 Cherry Blossoms |
| 8 | 💐 | Grand Bouquet | 2 Hibiscuses |

**Generator:** Seed Pouch (produces Sprouts)
**Final item reward:** Completing the Grand Bouquet for the first time awards 500 XP and a quest completion.

### 3.2 Fruit Chain (Unlocked: Level 5)

A food-themed chain with a cake as the ultimate reward.

| Tier | Emoji | Name | Merge Count |
|------|-------|------|-------------|
| 1 | 🫐 | Blueberry | -- |
| 2 | 🍇 | Grapes | 2 Blueberries |
| 3 | 🍎 | Apple | 2 Grapes |
| 4 | 🍊 | Orange | 2 Apples |
| 5 | 🥝 | Kiwi | 2 Oranges |
| 6 | 🥭 | Mango | 2 Kiwis |
| 7 | 🍑 | Peach | 2 Mangos |
| 8 | 🎂 | Celebration Cake | 2 Peaches |

**Generator:** Fruit Basket (produces Blueberries)
**Final item reward:** 500 XP. The Celebration Cake is a visual delight -- sparkle particles surround it permanently.

### 3.3 Crystal Chain (Unlocked: Level 8)

A shorter, more prestigious chain. Feels premium.

| Tier | Emoji | Name | Merge Count |
|------|-------|------|-------------|
| 1 | 💧 | Water Drop | -- |
| 2 | 🧊 | Ice Crystal | 2 Water Drops |
| 3 | 🔮 | Crystal Ball | 2 Ice Crystals |
| 4 | 💎 | Diamond | 2 Crystal Balls |
| 5 | 👑 | Royal Crown | 2 Diamonds |

**Generator:** Crystal Spring (produces Water Drops)
**Final item reward:** 750 XP. The Crown has a slow, majestic rotation animation.

### 3.4 Butterfly Chain (Unlocked: Level 10)

A metamorphosis-themed chain. Short and sweet.

| Tier | Emoji | Name | Merge Count |
|------|-------|------|-------------|
| 1 | 🥚 | Egg | -- |
| 2 | 🐛 | Caterpillar | 2 Eggs |
| 3 | 🐝 | Bee | 2 Caterpillars |
| 4 | 🦋 | Butterfly | 2 Bees |
| 5 | 🦚 | Peacock | 2 Butterflies |

**Generator:** Nest (produces Eggs)
**Final item reward:** 750 XP. Butterflies and Peacocks have a gentle floating animation.

### 3.5 Star Chain (Unlocked: Level 13)

A celestial chain with a magical feel.

| Tier | Emoji | Name | Merge Count |
|------|-------|------|-------------|
| 1 | ⭐ | Star | -- |
| 2 | 🌟 | Glowing Star | 2 Stars |
| 3 | ✨ | Sparkles | 2 Glowing Stars |
| 4 | 💫 | Shooting Star | 2 Sparkles |
| 5 | 🌙 | Crescent Moon | 2 Shooting Stars |
| 6 | 🌈 | Rainbow | 2 Crescent Moons |

**Generator:** Wishing Well (produces Stars)
**Final item reward:** 1000 XP. The Rainbow emits a continuous, subtle particle trail.

### 3.6 Nature Chain (Unlocked: Level 16)

A chain about growing a world. The final item is a cozy cottage -- the ultimate "garden restored" symbol.

| Tier | Emoji | Name | Merge Count |
|------|-------|------|-------------|
| 1 | 🍂 | Fallen Leaf | -- |
| 2 | 🍁 | Maple Leaf | 2 Fallen Leaves |
| 3 | 🌲 | Pine Tree | 2 Maple Leaves |
| 4 | 🌳 | Oak Tree | 2 Pine Trees |
| 5 | 🌴 | Palm Tree | 2 Oak Trees |
| 6 | 🏡 | Cottage | 2 Palm Trees |

**Generator:** Compost Bin (produces Fallen Leaves)
**Final item reward:** 1000 XP. The Cottage is the "true ending" item -- creating it triggers a special celebration animation with confetti and a story pop-up.

### Merge Chain Summary Table

| Chain | Tiers | Unlock Level | Generator | Final Item |
|-------|-------|-------------|-----------|-----------|
| Flower | 8 | 1 | Seed Pouch | 💐 Grand Bouquet |
| Fruit | 8 | 5 | Fruit Basket | 🎂 Celebration Cake |
| Crystal | 5 | 8 | Crystal Spring | 👑 Royal Crown |
| Butterfly | 5 | 10 | Nest | 🦚 Peacock |
| Star | 6 | 13 | Wishing Well | 🌈 Rainbow |
| Nature | 6 | 16 | Compost Bin | 🏡 Cottage |

---

## 4. Generators

### Generator Basics

Generators are the engine of the game. They sit on the board and produce items when tapped. They are visually distinct from regular items -- they have a subtle pulsing glow when ready and a circular cooldown indicator when recharging.

### Generator Tiers

Each chain's generator can be leveled up by merging two generators of the same tier.

| Generator Tier | Emoji | Cooldown | Output |
|---------------|-------|----------|--------|
| Tier 1 (Basic) | 📦 | 12 seconds | Always tier-1 item |
| Tier 2 (Improved) | 🎁 | 8 seconds | 80% tier-1, 20% tier-2 |
| Tier 3 (Premium) | 🏺 | 5 seconds | 60% tier-1, 30% tier-2, 10% tier-3 |

The emoji shown above is the generator "frame." Each generator also displays a small version of its chain's tier-1 emoji to indicate which chain it belongs to.

### Generator Acquisition

- Level-up rewards grant generators for newly unlocked chains
- Quest rewards can include generators
- The Shop sells generators for gems (but gems are unlimited, so this is a convenience feature)
- Merging two Tier 1 generators of the same chain produces a Tier 2 generator
- Merging two Tier 2 generators produces a Tier 3 generator

### Generator Interaction

- **Single tap** (when ready): Produces an item in a random adjacent empty cell. If no adjacent cells are empty, the item appears in the nearest empty cell on the board. If the board is completely full, a gentle shake animation plays and nothing is produced.
- **Cooldown visual**: A circular progress ring fills clockwise around the generator. When full, the generator pulses with a soft glow.
- **Hold and drag**: Generators can be moved like any other item.

---

## 5. Progression System

### Experience Points (XP)

XP is earned from merging items. Higher-tier merges give more XP.

| Merge Result Tier | XP Awarded |
|-------------------|-----------|
| Tier 2 | 5 XP |
| Tier 3 | 10 XP |
| Tier 4 | 20 XP |
| Tier 5 | 40 XP |
| Tier 6 | 80 XP |
| Tier 7 | 150 XP |
| Tier 8 | 300 XP |

Three-merge bonus merges award 1.5x the normal XP (rounded up).

### Level Progression

| Level | XP Required | Cumulative XP | Reward |
|-------|-------------|--------------|--------|
| 1 | 0 | 0 | Tutorial complete. Flower Chain + Seed Pouch generator. Board: 5x7. |
| 2 | 100 | 100 | 2nd Seed Pouch generator |
| 3 | 200 | 300 | Quest system unlocks (3 quest slots) |
| 4 | 350 | 650 | Board expands to 5x8 |
| 5 | 500 | 1,150 | Fruit Chain unlocks. Fruit Basket generator. Story beat: The Orchard. |
| 6 | 700 | 1,850 | 2nd Fruit Basket generator |
| 7 | 900 | 2,750 | Board expands to 6x8 |
| 8 | 1,200 | 3,950 | Crystal Chain unlocks. Crystal Spring generator. Story beat: Crystal Pond. |
| 9 | 1,500 | 5,450 | Shop unlocks |
| 10 | 1,800 | 7,250 | Butterfly Chain unlocks. Nest generator. Story beat: Butterfly Meadow. Board expands to 6x9. |
| 11 | 2,200 | 9,450 | 2nd Crystal Spring generator |
| 12 | 2,600 | 12,050 | 2nd Nest generator. Story beat: Hidden Path. |
| 13 | 3,000 | 15,050 | Star Chain unlocks. Wishing Well generator. Story beat: Stargazing Hill. Board expands to 7x9. |
| 14 | 3,500 | 18,550 | Collection bonus: view all chains in Collection screen |
| 15 | 4,000 | 22,550 | Tier 2 generators available in Shop |
| 16 | 4,500 | 27,050 | Nature Chain unlocks. Compost Bin generator. Story beat: Ancient Grove. |
| 17 | 5,000 | 32,050 | 2nd Wishing Well generator |
| 18 | 5,500 | 37,550 | Tier 3 generators available in Shop. Story beat: Greenhouse. |
| 19 | 6,000 | 43,550 | Bonus: all generators receive -2 second cooldown reduction |
| 20 | 7,000 | 50,550 | Final story beat. Special "Garden Restored" badge on the main screen. |

### Board Expansion Schedule

| Level | Board Size | Total Cells |
|-------|-----------|-------------|
| 1 | 5 x 7 | 35 |
| 4 | 5 x 8 | 40 |
| 7 | 6 x 8 | 48 |
| 10 | 6 x 9 | 54 |
| 13 | 7 x 9 | 63 |

When the board expands, new cells appear with a brief "grow" animation (scaling up from 0). The new cells are added to the right side and/or bottom edge as appropriate.

---

## 6. Quest System

### Overview

Quests provide directed goals to guide the player and add a sense of accomplishment. Three active quests are shown at a time. When one is completed, a new one fills its slot.

### Quest UI

- Collapsible panel at the top of the screen, below the status bar
- Shows 3 quest cards horizontally
- Each card: icon, description text, progress bar, reward preview
- Tap a quest card to highlight relevant items on the board (subtle glow)
- Completed quests play a confetti animation and slide out, replaced by a new quest

### Quest Types

**Creation Quests** -- Make a specific item:
- "Create a 🌹 Rose"
- "Create a 💎 Diamond"
- "Create a 🦋 Butterfly"

**Merge Count Quests** -- Perform a number of merges:
- "Merge 10 items"
- "Merge 5 flowers"
- "Perform 3 three-merges"

**Collection Quests** -- Have specific items on the board simultaneously:
- "Have 3 🌲 Pine Trees on the board at the same time"
- "Fill a row with flowers"

**Generator Quests** -- Use generators:
- "Use generators 10 times"
- "Upgrade a generator to Tier 2"

**Chain Completion Quests** -- Reach the end of a chain:
- "Create your first 💐 Grand Bouquet"
- "Create your first 👑 Royal Crown"

### Quest Reward Table

| Quest Difficulty | XP Reward | Coin Reward | Special Reward |
|-----------------|-----------|-------------|----------------|
| Easy | 50 XP | 25 coins | -- |
| Medium | 150 XP | 75 coins | Random generator (sometimes) |
| Hard | 400 XP | 200 coins | Tier 2 generator or rare item |
| Chain Finale | 750 XP | 500 coins | Story beat + celebration |

### Quest Pool (Initial 30 Quests)

1. Create a 🌿 Fern (Easy)
2. Create a ☘️ Clover (Easy)
3. Create a 🌷 Tulip (Medium)
4. Merge 10 items (Easy)
5. Merge 20 items (Medium)
6. Create a 🌹 Rose (Medium)
7. Use a generator 5 times (Easy)
8. Create a 🌸 Cherry Blossom (Medium)
9. Have 2 🌷 Tulips on the board at once (Medium)
10. Create a 🌺 Hibiscus (Hard)
11. Create a 💐 Grand Bouquet (Chain Finale)
12. Perform a three-merge (Easy)
13. Create a 🍎 Apple (Easy)
14. Create a 🍊 Orange (Medium)
15. Create a 🥭 Mango (Hard)
16. Create a 🎂 Celebration Cake (Chain Finale)
17. Merge 50 items total (Medium)
18. Upgrade a generator to Tier 2 (Medium)
19. Create a 🧊 Ice Crystal (Easy)
20. Create a 💎 Diamond (Hard)
21. Create a 👑 Royal Crown (Chain Finale)
22. Create a 🐛 Caterpillar (Easy)
23. Create a 🦋 Butterfly (Medium)
24. Create a 🦚 Peacock (Chain Finale)
25. Perform 5 three-merges (Medium)
26. Create a 🌟 Glowing Star (Easy)
27. Create a 🌈 Rainbow (Chain Finale)
28. Create a 🌳 Oak Tree (Medium)
29. Create a 🏡 Cottage (Chain Finale)
30. Have items from 4 different chains on the board (Hard)

---

## 7. Economy

### Gems

- Displayed in top bar with count: **99,999** (or the infinity symbol)
- Used for: buying generators in Shop, unlocking locked cells, buying specific items
- Since this is a gift project with no monetization, gems are effectively unlimited
- If gems are spent, they regenerate to 99,999 at the start of each session

### Coins

- Earned organically from merging and quests
- Used for quality-of-life features:
  - **Undo Last Merge**: 10 coins
  - **Shuffle Board**: 25 coins
  - **Quick Sell**: Sell any non-generator item for 1-5 coins depending on tier

| Action | Coins Earned |
|--------|-------------|
| Any merge | 1-3 (based on tier) |
| Three-merge | 5 |
| Quest completion | 25-500 (based on difficulty) |
| Level up | 100 |
| Deleting an item | 1-3 (based on tier) |

### Shop

**Generators Tab:**
| Item | Cost |
|------|------|
| Any Tier 1 Generator | 100 gems |
| Any Tier 2 Generator | 500 gems |
| Any Tier 3 Generator | 2,000 gems |

**Items Tab:**
| Item | Cost |
|------|------|
| Any Tier 1 item | 10 gems |
| Any Tier 2 item | 50 gems |
| Any Tier 3 item | 150 gems |

**Tools Tab:**
| Item | Cost |
|------|------|
| Undo Last Merge | 10 coins |
| Shuffle Board | 25 coins |
| Clear One Cell | 50 gems |
| Unlock Locked Cell | 200 gems |

---

## 8. Board Features

### Cell States

1. **Empty** -- Available for items. Light background.
2. **Occupied** -- Contains an item or generator.
3. **Locked** -- Visible but inaccessible. Shows a lock overlay. Unlocked by spending gems or reaching a certain level.
4. **Blocked** -- Covered by an obstacle. Cleared by merging an item in any adjacent cell.
5. **Bonus** -- Special golden cells that appear randomly. Any merge performed on a bonus cell awards double XP. Lasts 60 seconds.

---

## 9. Visual Polish and Juice

### Merge Animation (Core)

1. Player drags item A onto matching item B
2. Item A flies to item B's position (200ms ease-out)
3. Both items scale down to 0 simultaneously (100ms)
4. Brief white flash on the cell (50ms)
5. Particle burst: 8-12 small circles radiate outward (400ms)
6. New merged item scales up from 0 to 1.2x then settles to 1.0x (bouncy ease, 300ms)
7. Small "+XP" text floats upward and fades (600ms)

### Combo Text System

| Condition | Text | Color |
|-----------|------|-------|
| Three-merge | "Nice!" | Gold |
| Two merges within 2 seconds | "Amazing!" | Pink |
| Three merges within 3 seconds | "Incredible!" | Purple with glow |
| Creating a chain's final item | "MAGNIFICENT!" | Rainbow gradient |

### Item Visual Effects

- **Tier 5+ items**: Subtle sparkle particles orbit continuously
- **Tier 7-8 items**: Stronger glow effect, more particles
- **Generators (ready)**: Gentle float animation, pulsing glow ring
- **Generators (cooldown)**: Static, dimmed, circular progress overlay

### Screen Effects

- **Big merges (tier 6+)**: Subtle screen shake (2px, 100ms)
- **Quest completion**: Confetti burst from quest panel
- **Level up**: Full-screen confetti + golden text + white flash
- **Board expansion**: New cells "grow" in with cascading delay

### Background

- Soft gradient that shifts based on real time of day:
  - Morning (6am-12pm): Warm peach to soft sky blue
  - Afternoon (12pm-5pm): Light blue to gentle lavender
  - Evening (5pm-9pm): Lavender to warm orange-pink
  - Night (9pm-6am): Deep blue to soft purple

---

## 10. UI Layout (iPhone Portrait)

```
+------------------------------------------+
|  STATUS BAR (iOS)                        |
+------------------------------------------+
|  [Lv.5]  [=====XP BAR======]  [99,999]  |  <- Top Bar
+------------------------------------------+
|  [Quest 1] [Quest 2] [Quest 3]     [v]   |  <- Quest Panel
+------------------------------------------+
|                                          |
|           G A M E   B O A R D            |
|          (5x7 to 7x9 grid)              |
|          Items rendered here             |
|                                          |
+------------------------------------------+
|  [Shop]    [Collection]    [Settings]    |  <- Bottom Bar
+------------------------------------------+
```

---

## 11. Tutorial Flow

5-step guided tutorial in first 2-3 minutes:

1. **Introduction** -- Story text, board with 2 sprouts + generator
2. **First Merge** -- Spotlight on sprouts, guided drag, celebration
3. **Generator** -- Spotlight on generator, tap to spawn
4. **Chain Discovery** -- Keep merging to discover new items
5. **Quest Introduction** -- Show quest panel, first quest assigned
6. **Free Play** -- "The garden is yours. Explore, merge, and bloom!"

---

## 12. Save System

- Auto-save every 30 seconds + on merge/quest/level-up/app-blur
- localStorage with key `"mergebloom_save"`
- Backup save every 5 minutes to `"mergebloom_save_backup"`
- Save version field for migration support

---

## 13. Sound Design (Future)

Out of scope for v1. Architecture should support it. Key sounds:
- Merge: satisfying pop/chime (escalates with tier)
- Generator tap: soft woody click
- Quest complete: short brass fanfare
- Level up: ascending chime sequence
- Background: ambient nature sounds (shifts with time of day)

---

## 14. Technical Architecture

- Phaser 3 + TypeScript + Vite
- PWA with service worker for offline play
- Emoji rendered to Canvas textures at boot time
- 60fps target on iPhone SE 2nd gen+
- Board state under 10KB JSON for saves

---

## 15. Future Content Ideas (v2+)

- **Seasonal events**: Spring blossoms, summer beach chain, autumn pumpkins, winter snowflakes
- **Daily challenges**: Small board with specific goals
- **More chains**: Gems, cooking, space, music
- **Garden decoration mode**: Place finale items as decorations
- **Custom themes**: Dark mode, pastel, high contrast
- **Statistics dashboard**: Merge counts, time played, records

---

## 16. Appendix: Emoji Rendering Notes

All emoji chosen are available on iOS 14.2+ (Unicode 13.0 or earlier). Emoji render at 2x resolution for Retina clarity. Emoji rejected: 🪻 (too new), 🪴 (cluttered at small size), 🌻 (too similar to 🌺).

---

## Design Philosophy

1. **No frustration, ever.** Unlimited gems, no energy, no timers, no fail states.
2. **Satisfying feedback loops.** Every interaction has animation, particles, and juice.
3. **Gentle discovery.** New content unfolds naturally. Always something to look forward to, never pressure.

---

*Document version 1.0 -- Merge Bloom Game Design Document*
