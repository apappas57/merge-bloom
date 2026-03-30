# Mystery Town / Travel Town -- Deep Analysis for Merge Bloom

**Date:** 2026-03-30
**Purpose:** Exhaustive breakdown of Mystery Town (Cedar Games) and Travel Town (Moon Active/Magmatic Games) to drive the next major Merge Bloom iteration.
**Note:** Mystery Town is Cedar Games' take on the Travel Town formula. Both are merge-2 games with town-building metas. Travel Town is the market leader ($117M revenue in 2024, +231% YoY) and the template Mystery Town follows. This analysis covers both, prioritizing the mechanics and design patterns we want to replicate.

---

## 1. Core Game Loop

### Merge Mechanics: Merge-2 (NOT Merge-3)

Both Travel Town and Mystery Town use **merge-2** mechanics. This is a critical distinction from games like Merge Mansion which historically used merge-3. Merge-2 means:

- **Drag any item onto one identical item** to combine them into the next tier
- Only 2 items needed per merge (faster, more satisfying, lower friction)
- Items can be **freely dragged anywhere** on the board -- there are no fixed grid positions
- The merge action is: tap to pick up, drag to target, release to merge
- If you drag onto a non-matching item, the items swap positions
- If you drag to an empty cell, the item moves there

**Why merge-2 works:** Faster dopamine loops. Players make progress with every pair they find. Merge-3 requires collecting three of something, which creates frustrating "almost there" moments. Merge-2 means every duplicate is immediately actionable.

### How Generators Work

Generators (also called Producers) are the primary source of items on the board. There are multiple types:

**Standard Generators (Energy-Cost)**
- Tapping a generator costs 1 energy and spawns a base-level item
- The item appears in an adjacent empty cell
- If no adjacent cells are empty, the item appears in the nearest empty cell on the board
- If the board is completely full, you cannot tap the generator
- There is NO cooldown on standard generators -- you can tap repeatedly as long as you have energy
- Each tap always costs 1 energy (unless Power Boost is active)

**Auto-Producers (No Energy, Cooldown-Based)**
- These spawn items automatically on a timer (cooldown) without costing energy
- Once you claim their items, they begin regenerating a new batch automatically
- Examples: Jewelry Display, Ice-Cream Freezer, Light Source
- Cooldown varies by producer type (typically several minutes)
- Items spawn in adjacent free cells
- These are highly valuable because they generate items for free

**Charging Generators**
- Need 5 taps to "charge up" before they spawn items
- Each charge tap costs 1 energy
- Can spawn a "defective" item (adds randomness/frustration)
- Higher risk, but can produce higher-tier items

**Power Boost Toggle (x2)**
- When activated, generators consume 2 energy per tap instead of 1
- BUT spawned items start at level 2 instead of level 1
- This is psychologically addictive -- once you try it, normal generation feels slow
- Key monetization lever: players burn energy twice as fast, leading to purchases

### The Board

**Size and Layout:**
- The board is a **single-screen grid** -- no scrolling required
- Approximately **63 cells** at higher levels (confirmed by player at level 32)
- Board starts smaller and expands as you level up
- The grid is NOT a strict rectangular grid -- cells are arranged in an organic, slightly irregular pattern that feels more natural than clinical
- All items, generators, and the order bar are visible on one screen simultaneously
- This is Travel Town's #1 design advantage: "the entire merge board is visible on one screen" -- other merge games have sprawling areas requiring scrolling, which kills efficiency

**How Items Appear on the Board:**
1. Player taps a generator -> item spawns in an adjacent cell
2. Auto-producers spawn items on cooldown timers
3. Some items appear from completing merges (chain progression)
4. Chests/reward boxes can be tapped to release items
5. Items can "bubble up" from the board when there's no space (bubble mechanic)

**When the Board is Full:**
- You CANNOT tap generators (no space for items to spawn)
- You must free space by:
  - **Merging items** (two items become one, freeing a cell)
  - **Selling items** (tap item -> sell button on bottom-right; grants coins by level)
  - **Discarding** (level-1 items cannot be sold, only trashed via trash button)
  - **Moving items to Storage** (drag to inventory on bottom-left; limited slots, expandable with Diamonds)
- First-stage items cannot be sold, only discarded
- Undo button appears after selling, letting you reverse the sale

**Board Space Management is a Core Skill:**
- Players always return to a board with **20-25% empty space** (items get cleaned up / energy caps mean you can't fill it completely)
- This means the first merge happens within seconds of opening the app
- Board clutter management is a real strategy: keep space for generators, prioritize merging over hoarding

### Drag-and-Drop on Mobile

- Tap an item to select it (slight lift animation)
- Drag with finger anywhere on the board
- Items smoothly follow the finger with slight lag for "weight" feel
- Drop on matching item: satisfying merge animation + particle burst
- Drop on non-matching item: items swap positions
- Drop on empty cell: item moves there
- Drop on generator: nothing (generators are not movable in the same way)
- The drag feels responsive and direct -- no snap-to-grid jankiness

---

## 2. Orders / Customers System

This is the PRIMARY progression driver. Everything revolves around orders.

### What the Orders Panel Looks Like

- Orders appear in an **order bar at the top of the screen**, directly above the merge board
- Each order shows as a **horizontal card/panel** with:
  - A **character portrait** (the villager/customer making the request) on the left
  - The **requested item(s)** shown as icons in the middle
  - The **reward** shown on the right (coins icon + amount, or toolbox icon)
- Multiple orders are visible simultaneously, scrollable horizontally
- The order bar is always present and accessible -- no navigating to a separate screen

### How Orders Are Presented

- Each order comes from a **specific villager/character** (there are 55 villagers in Travel Town)
- The villager has a small portrait and sometimes a speech bubble with flavor text
- Tapping on an order expands it to show:
  - Which Producer/Generator creates the needed items
  - The level of the requested item(s)
  - What merge path you need to follow to get there
  - The reward you'll receive
- Orders are color-coded: **dark green** for villager requests vs different styling for auto-orders
- If a villager order and auto-order want the same item, the villager order takes priority and displays first

### What Items Orders Require

- Orders request specific items at specific merge levels
- Early orders: low-level items (level 1-3 in a chain) -- easy to fulfill quickly
- Mid-game orders: mid-tier items (level 4-6) requiring moderate merging
- Late-game orders: high-tier items (level 7+) requiring extensive chain progression
- Some orders require items from **multiple chains** (e.g., a flower + a crystal)
- Some orders require items from **combined chains** (chains where you merge outputs from two different chains together)
- Orders scale in difficulty based on player level and activity -- more active players get harder quests

### How Many Orders Are Active at Once

- **Starting out:** 1 order at a time
- **As you progress:** more order slots unlock, eventually showing multiple simultaneous orders
- **Auto-orders:** only 1 auto-order displays at a time (first-in, first-out queue)
- Quest difficulty and quantity scales: can be anything from **9 to 35 orders per day**
- Regular villager orders + auto-orders can coexist in the bar

### What Rewards Orders Give

**Coins (Smileys):**
- Primary reward currency
- Used to upgrade/construct buildings in the town
- Reward scales dramatically: an order that initially gives 2,000 coins can eventually yield 30,000+ for the same item type
- Some orders pay fortunes for rare objects

**Toolboxes:**
- Given as rewards for harder-to-complete orders
- Contain construction tools: screws, wood, cement, bricks, wooden planks
- About 1 in 3 building stages require Tools in addition to coins
- This creates strategic choice: prioritize easy coin orders or hard toolbox orders?

**Experience Points (XP):**
- Completing orders grants XP
- XP contributes to leveling up
- Leveling up gives: energy refill (25 energy), new area unlocks, new generators

**Energy (from some orders/chests):**
- Some rewards include energy, helping sustain play sessions

### How New Orders Appear

- When you complete an order, a new one rolls in to replace it
- New orders can appear immediately or after a short delay
- The order pool is level-gated -- higher levels unlock harder (and more rewarding) orders
- Automatic orders appear when you create a certain number of max-level items from a chain
- Auto-orders are profitable because auto-producers make items for free -- pure profit

### Is There an Order Queue / Backlog?

- Yes -- there is a queue system behind the scenes
- Orders that can't display (because slots are full or a villager order has priority) wait in queue
- Auto-orders use a first-in, first-out (FIFO) queue
- Only one auto-order displays at a time even if multiple are triggered
- The system auto-fills the order bar -- "Automatic Orders List" feature fills your board with tasks automatically

### Do Orders Have Time Limits?

**Regular Orders:** No time limit. Take as long as you need.

**Tick-Tock Orders (Special):**
- Time-limited special orders where "travelers are in a hurry"
- Clock keeps ticking even if you leave the game
- You can choose difficulty: Easy, Medium, or Huge
- Harder difficulty = bigger reward
- Must press "GO" before time runs out
- Even completing just 1 order in a sequence earns a consolation reward
- Store highlights helpful items during Tick-Tock orders (monetization hook)
- "Order Sprint" events: complete a streak of Tick-Tock Orders before event ends for grand prize

### Orders UI Summary

```
+---------------------------------------------------------------+
|  [Villager1]  [Item Icon] [Item Icon]  ->  [Coin Reward]      |
|  [Villager2]  [Item Icon]              ->  [Toolbox Reward]   |
|  [Auto]       [Item Icon] [Item Icon]  ->  [Coin Reward]      |
+---------------------------------------------------------------+
|                                                                |
|                    MERGE BOARD (63 cells)                      |
|          [Generators] [Items] [Auto-Producers]                 |
|                                                                |
+---------------------------------------------------------------+
|  [Storage]          [Energy Bar]          [Sell/Trash]         |
+---------------------------------------------------------------+
```

---

## 3. Visual Style & UI

### Color Palette

- **Primary Background:** Warm, bright, cheerful -- soft greens, sky blues, warm yellows
- **Board Background:** Lightly textured surface (wooden table feel, or soft grassy surface depending on area)
- **UI Chrome:** Clean whites and soft grays with colored accents
- **Accent Colors:** Bright greens (for coins/smileys), blue/purple (for diamonds/premium), orange/red (for energy)
- **Overall Feel:** Vibrant but not garish. Bright 2D cartoon with soft edges. Think "sunny day at the beach" energy.

### Art Style

- **2D hand-painted cartoon** -- NOT 3D rendered, NOT vector flat
- Fully painted artwork (confirmed from art development details -- no 3D base)
- Items have a slightly stylized, rounded, tactile quality
- Think: Pixar meets children's book illustration
- Characters have big expressive faces, friendly proportions
- Buildings are detailed and whimsical with unique visual transformations as they upgrade
- The overall aesthetic is **warm, inviting, non-threatening** -- designed for broad casual audience (primarily female, avg age 32)

### How Items Look

- Each item in a merge chain has a distinct, instantly recognizable visual
- Items progress from small/simple to large/ornate as they level up
- Level 1: tiny, rough version (small shell, single flower, basic seed)
- Max level: elaborate, beautiful version (ornate necklace, full bouquet, ancient tree)
- Items have slight shadows/depth to pop off the board
- Consistent art style across all chains -- everything looks like it belongs together
- Over 500 unique item designs across all chains

### Example Item Categories and Their Visual Themes

- **Kitchen:** cups -> kettles -> toasters -> microwaves (warm browns, metallic highlights)
- **Tools:** nails -> hammers -> saws -> drills (gray/silver tones)
- **Flowers:** seeds -> sprouts -> blooms -> bouquets (colorful, bright)
- **Sea/Shell:** small shell -> large shell -> decorated shell -> seashell necklace (blues, sandy tones)
- **Wood:** stick -> log -> plank -> bench -> table (warm browns, wood grain textures)
- **Food:** basic ingredients -> prepared dishes -> gourmet meals (rich, appetizing colors)
- **Mechanical:** gears -> wrenches -> engines (industrial grays with accent colors)

### Board Background

- The board has a soft, textured background that changes with the game area/theme
- Early areas: grassy/garden feel
- Later areas: beach, harbor, town square, etc.
- The board surface is subtle -- it should not compete with items for visual attention
- Slight vignette at edges to focus attention on center

### UI Layout (iPhone Portrait)

```
+------------------------------------------+
|  [Level] [Coins] [Diamonds] [Energy Bar] |  <- TOP BAR (currencies + resources)
+------------------------------------------+
|                                          |
|  [Order 1] [Order 2] [Order 3] [...]    |  <- ORDER BAR (scrollable horizontal)
|                                          |
+------------------------------------------+
|                                          |
|                                          |
|                                          |
|           MERGE BOARD                    |  <- MAIN GAMEPLAY AREA (largest portion)
|     (generators + items + space)         |
|                                          |
|                                          |
|                                          |
+------------------------------------------+
|  [Storage] [Town] [Shop] [Events]        |  <- BOTTOM NAVIGATION
+------------------------------------------+
```

**Top Bar:**
- Player level indicator (left)
- Coin/smiley count
- Diamond count
- Energy bar with count (e.g., "87/100") and timer showing when next energy regenerates
- Settings/menu icon

**Order Bar:**
- Directly below top bar
- Horizontally scrollable cards
- Each card: character portrait + requested items + reward
- Takes up approximately 15% of screen height

**Main Board:**
- Center of screen, takes up ~60% of screen real estate
- All cells visible without scrolling
- Generators visually distinct from regular items (they look like "source" objects -- ovens, machines, plants)
- Auto-producers have a visual cooldown indicator (circular timer overlay)

**Bottom Bar:**
- Storage tray access
- Town/building view button
- Shop button
- Event/challenge button
- Occasionally: special event banners

### Font Choices

- Clean, rounded sans-serif fonts
- Slightly playful but highly readable
- Numbers are bold and clear (important for currency displays)
- Character dialogue uses a slightly different, friendlier font

### Animation Style

- **Merge animation:** Items slide together, flash of light, new item "pops" into existence with a satisfying scale-up bounce
- **Generator tap:** Item appears with a small burst/sparkle, slides into adjacent cell
- **Order complete:** Checkmark animation, reward slides in, character does a happy reaction
- **Level up:** Full-screen celebration with confetti/sparkle effects
- **Building upgrade:** Building transforms with construction animation, then reveals new form
- **Idle animations:** Items have subtle breathing/bobbing, generators have ambient effects (steam, sparkle, glow)

### How Generators Look vs Regular Items

- **Generators** are visually larger, more detailed, and have an "active" quality (steam, glow, animation)
- They look like source objects: ovens, machines, seed bags, treasure chests, display cases
- They have a subtle pulsing glow or indicator when ready to tap
- **Auto-producers** show a circular cooldown timer overlay when recharging
- **Regular items** are smaller, simpler, clearly "products" rather than "sources"
- Clear visual hierarchy: generators are anchors, items are what flows between them

---

## 4. Progression System

### Town Building / World Changes

- The player restores a **seaside town** that was ravaged by a storm
- Buildings start as ruins/construction sites
- Each building upgrade has a **unique visual transformation** -- watching the town change is "incredibly rewarding" (per reviews)
- The town map is **hidden under clouds** that clear as you level up, revealing new buildings
- You start with basic houses and shops, progressing to more elaborate structures
- Two types of buildings:
  1. **Generator buildings:** Provide and update generators. Require coins + tools (concrete, screws, wooden planks)
  2. **XP buildings:** Just provide experience. Only require coins.
- Upgrading generator buildings unlocks new producers and item chains (e.g., upgrading the bakery unlocks a baking oven that starts a new baked goods chain)

### Level System

- XP earned from: completing orders, merging items, building upgrades
- Each level-up grants: 25 energy, potential new area unlock, new generators/chains
- Leveling too fast can actually hurt (orders get harder) -- experienced players "park" at levels like 27, 37, 41, 57
- Player level displayed prominently in top-left

### Unlocking New Areas

- New areas unlock through main story quest completion
- Each completed quest chain automatically opens new regions
- New regions reveal new buildings, generators, and item chains
- Areas have distinct visual themes (harbor, town square, hillside, etc.)
- The feeling of "clearing clouds" to reveal a new area is a strong dopamine hit

### What Drives the Player Forward

1. **Orders create immediate goals** -- always something to work toward
2. **Town transformation** -- seeing ruins become beautiful buildings
3. **New chains unlocking** -- curiosity about what's next in the merge tree
4. **Collection completion** -- 500+ items to discover
5. **Story beats** -- light narrative from 55 villager characters
6. **Events and challenges** -- rotating limited-time content

### Story Elements

- 55 villagers each have names and personalities
- Light story delivered through order dialogue and building upgrades
- Multicultural, international storyline with diverse foods, locations, and experiences
- Mystery Town specifically adds a stronger narrative: Aurora investigating her uncle's disappearance, mysterious creatures, friends and enemies, hidden truth
- Story is NOT the main draw -- it's flavor that makes orders feel purposeful

---

## 5. What Makes It Addictive

### The "Just One More Merge" Feeling

- Merge-2 means every pair is immediately actionable -- there's always something to merge
- Short chains (5-6 levels) give quick satisfaction
- Long chains (8-10 levels) make the final item feel earned
- The board always has at least a few matching pairs visible, creating constant "I'll just do this one"
- After completing an order, a new one immediately appears, starting the cycle again

### Visual Satisfaction of Merges

- Two items sliding together with a burst of particles
- New item appearing with a bouncy scale-up animation
- Higher-tier items look visually more impressive -- clear feeling of "upgrade"
- Color intensity increases with item level
- Board becomes visually richer as you progress

### Sound Design

- Soft, relaxing background music (not intrusive)
- Distinct merge sound effect: satisfying "pop" or "chime" that varies by item type
- Generator tap: mechanical/organic sound matching the generator type
- Order completion: celebratory jingle
- Level up: fanfare
- Ambient sounds matching the area theme
- Sound design creates a relaxing atmosphere that encourages longer sessions

### Haptic Feedback

- Light haptic pulse on merge
- Subtle tap feedback on generator use
- Satisfying "thunk" haptic when placing items
- These micro-interactions make even mundane actions feel rewarding

### Reward Pacing

- Early game: rewards come fast and frequently (get players hooked)
- Mid game: rewards space out but remain satisfying
- Late game: individual rewards are larger but require more effort
- Constant drip of small rewards (coins from selling, XP from merges) between big rewards (order completion, building upgrades)
- "The constant sense of progression is what makes the game so addictive" -- review quote

### What Reviews Say Is Most Satisfying

- Watching the town transform from ruins to beauty
- Discovering new item chains
- The merge mechanic itself: "instantly accessible, appealing to a wide audience"
- Short chains: satisfaction for reaching a milestone
- Long chains: "the reward you get after making a complex item feel like it was worth the effort"
- The relaxing, non-competitive nature: "no pressure to compete"

---

## 6. What Players Complain About (Things We Remove for Merge Bloom)

Since Merge Bloom is a **gift project with NO monetization**, these pain points are our competitive advantage. We remove ALL of them.

### Energy System (The #1 Complaint)

- 1 energy regenerates every 1.5-2 minutes
- Max energy cap: 100
- Early game: energy is fine, orders are cheap
- Past level 30: "almost unplayable without paying" -- orders can take several hundred energy
- Players get "a minute or two of free play" before waiting
- The energy system is the core monetization lever: frustrate -> pay to continue
- **Merge Bloom: No energy. Unlimited taps on generators. Pure play.**

### Energy Purchase Economics (What We Avoid)

- First energy purchase: 10 diamonds for 100 energy
- Price doubles with each purchase (20, 40, 80... diamonds)
- Resets daily
- Free energy from ads: 25 energy per ad, up to 4 ads/day (100 energy total)
- Most expensive pack: $120 for 8,000 diamonds = 20,000 energy
- **Merge Bloom: None of this. Free forever.**

### Ad Placements

- Rewarded video ads for energy (25 energy per watch)
- Ads that force-open Google Play can crash the game, losing the reward
- Pop-up offers for purchases
- Mystery Town claims "no ads" but has pop-up purchase offers
- **Merge Bloom: Zero ads.**

### IAP Pressure Points

- Diamond purchase packs at various price points
- "Starter" bundles that appear cheap then escalate ($2 -> $6 price jumps)
- Power Boost creating dependency (feels slow without it)
- Store highlights during time-limited orders (creating urgency to buy)
- Limited storage forcing diamond purchases for more slots
- **Merge Bloom: All premium currency given freely.**

### Where Players Get Stuck/Frustrated

- Board clutter: running out of space with no good merges available
- Unpredictable item production: "zero consistency" in what generators produce
- Going through excessive energy without getting needed items
- Long chains requiring days of grinding for a single quest
- Generator rule changes disrupting strategies ("completely ruined the game")
- Competitions that suddenly double energy costs
- "2+ 4= 6 combinations possible, leading to going through much more energy and having a full board"
- **Merge Bloom: Unlimited energy solves most of these. Smaller board with cleaner chains reduces the rest.**

---

## 7. Detailed Implementation Plan for Merge Bloom

### 7A. Orders System Implementation

This is the single highest-impact feature to add. Orders transform the game from "merge stuff" into "merge with PURPOSE."

#### Data Structures

```typescript
interface Order {
  id: string;
  characterId: string;          // Which character/villager is asking
  characterName: string;        // Display name
  characterEmoji: string;       // Emoji portrait (since we use emoji rendering)
  requiredItems: OrderItem[];   // What items the player must provide
  rewards: OrderReward[];       // What the player gets on completion
  isAutoOrder: boolean;         // Auto-order vs manual villager order
  isTimeLimited: boolean;       // Tick-tock style (optional, Phase 2)
  timeLimit?: number;           // Seconds, if time-limited
  flavorText: string;           // "I need flowers for my garden!"
  difficulty: 'easy' | 'medium' | 'hard';
  unlockLevel: number;          // Minimum player level to see this order
}

interface OrderItem {
  chainId: string;              // Which merge chain this item belongs to
  itemLevel: number;            // What level in the chain (1-10)
  quantity: number;             // How many needed (usually 1-3)
  fulfilled: number;            // How many the player has provided so far
}

interface OrderReward {
  type: 'coins' | 'gems' | 'xp' | 'energy' | 'item';
  amount: number;
  itemId?: string;              // If reward type is 'item'
}

interface OrderQueue {
  activeOrders: Order[];        // Currently displayed (max 3-5)
  pendingOrders: Order[];       // Waiting to fill empty slots
  completedToday: number;       // For daily tracking
  totalCompleted: number;       // Lifetime tracking
}

interface Character {
  id: string;
  name: string;
  emoji: string;                // Emoji representation
  personality: string;          // Affects flavor text style
  unlockLevel: number;          // When this character appears
  orderPool: string[];          // IDs of orders this character can give
}
```

#### Order Pool Design (Tied to Current Merge Chains)

Based on current Merge Bloom chains (Flower, Fruit, Crystal, Butterfly, Star, Nature):

```typescript
const GARDEN_ORDERS: Order[] = [
  // EASY - Flower Chain (levels 1-3)
  {
    characterName: "Rose",
    characterEmoji: "👩‍🌾",
    requiredItems: [{ chainId: 'flower', itemLevel: 2, quantity: 2 }],
    rewards: [{ type: 'coins', amount: 50 }],
    flavorText: "Could you bring me some wildflowers?",
    difficulty: 'easy',
    unlockLevel: 1,
  },
  // MEDIUM - Fruit Chain (levels 3-5)
  {
    characterName: "Bramble",
    characterEmoji: "🧑‍🍳",
    requiredItems: [{ chainId: 'fruit', itemLevel: 4, quantity: 1 }],
    rewards: [{ type: 'coins', amount: 150 }, { type: 'xp', amount: 25 }],
    flavorText: "I'm making jam! I need ripe fruit.",
    difficulty: 'medium',
    unlockLevel: 5,
  },
  // HARD - Multi-chain (Crystal + Flower)
  {
    characterName: "Luna",
    characterEmoji: "🧙‍♀️",
    requiredItems: [
      { chainId: 'crystal', itemLevel: 5, quantity: 1 },
      { chainId: 'flower', itemLevel: 4, quantity: 1 },
    ],
    rewards: [{ type: 'coins', amount: 500 }, { type: 'gems', amount: 10 }],
    flavorText: "For my enchantment, I need a crystal and a bloom...",
    difficulty: 'hard',
    unlockLevel: 10,
  },
];
```

#### UI Layout Specifications

**Order Bar (top of screen, below resource bar):**
```
Height: ~80px (iPhone portrait)
Background: Semi-transparent white/cream panel with rounded corners
Shadow: Subtle drop shadow for depth
Layout: Horizontal scroll, each order card ~200px wide

Order Card Layout:
+-----------------------------------------------+
| [Emoji]  [Item1 Icon] [Item2 Icon]  [Reward]  |
| [Name ]  [  x2      ] [  x1      ]  [50 coins]|
| ["Help!"]                            [GO btn]  |
+-----------------------------------------------+

- Character emoji: 32x32, left-aligned
- Character name: Small text below emoji
- Flavor text: Tiny italic text, truncated
- Required items: Item emoji icons with quantity badges
- Reward: Coin/gem icon with amount
- "GO" button: Appears when all items are ready, bright green
- Progress indicator: Partial fill bar under item requirements
```

**Order Completion Animation:**
1. Items fly from board to order card
2. Card flashes gold
3. Reward amount animates upward (+50 coins!)
4. Character emoji does a happy bounce
5. Card slides out, new order slides in from right
6. Satisfying "cha-ching" sound

#### How Orders Integrate with the Merge System

1. **Item Detection:** When a merge creates an item matching an active order requirement, highlight that item with a subtle glow and show an arrow pointing toward the order
2. **Drag to Order:** Player can drag a matching item directly onto the order card to fulfill it (in addition to the order auto-detecting matching items on the board)
3. **Auto-Fulfill Option:** When an order's items are all on the board, a "Complete" button appears on the order card -- tap to auto-submit all items
4. **Order Priority Hints:** Orders can show which generator to tap to start working toward needed items
5. **New Order Generation:** When an order is completed, check the queue. Pull the next appropriate order based on player level, recently completed chains, and difficulty curve.

#### Reward Economy (Merge Bloom -- Generous, No Monetization)

Since we have no monetization, rewards should feel abundant:

| Order Difficulty | Coins | Gems | XP |
|-----------------|-------|------|-----|
| Easy | 30-80 | 0-2 | 10-15 |
| Medium | 100-300 | 2-5 | 20-35 |
| Hard | 300-800 | 5-15 | 40-60 |

Coins are used for: unlocking garden areas, buying decorations, expanding storage
Gems are used for: instant generator recharges (cosmetic, since energy is free), special items, cosmetic unlocks

---

### 7B. Visual Matching -- Specific Changes Needed

#### Color Palette Changes

**Current Merge Bloom palette (assumed from garden theme):**
Needs to shift toward Travel Town's bright, warm, cartoon vibrancy.

**Target Palette:**

| Element | Color | Hex Suggestion |
|---------|-------|---------------|
| Primary Background | Warm cream/beige | #FFF8E7 |
| Board Surface | Soft sage green | #E8F0E4 |
| Top Bar BG | White with slight warm tint | #FFFDF7 |
| Order Bar BG | Semi-transparent cream | rgba(255, 252, 240, 0.95) |
| Coin Color | Warm gold | #FFD700 |
| Gem Color | Rich purple | #9B59B6 |
| Energy Color | Bright green | #2ECC71 |
| XP Color | Sky blue | #3498DB |
| Button Primary | Bright green | #4CAF50 |
| Button Secondary | Warm orange | #FF9800 |
| Text Primary | Dark charcoal | #2C3E50 |
| Text Secondary | Warm gray | #7F8C8D |
| Card Background | White | #FFFFFF |
| Card Border | Light warm gray | #E0D5C7 |
| Merge Flash | Golden yellow | #FFE082 |
| Success Green | Vibrant green | #66BB6A |

#### Item Rendering Approach

To match Travel Town's painted-cartoon style using our emoji renderer:

1. **Size Progression:** Items should visually grow larger as they level up (level 1 = small emoji, max level = large with added particle effects)
2. **Glow/Shadow:** Higher-tier items should have a subtle colored glow behind them
3. **Background Circle:** Each item sits on a soft circular background that matches its chain color
4. **Level Indicator:** Small number badge or star count in corner of item
5. **Generator Distinction:** Generators should be visually larger (1.5x), have a pulsing border, and show a "tap" hand icon when energy is available

#### Board Layout Changes

**Current -> Target:**
- Ensure board is single-screen, no scrolling (this is non-negotiable)
- Board cells should have soft rounded backgrounds, not harsh grid lines
- Slight gap between cells for visual breathing room
- Board shape: slightly irregular/organic rather than perfect rectangle
- Target: 35-45 cells for our game (smaller than Travel Town's 63, appropriate for gift game scope)

#### UI Positioning Changes

```
CURRENT (assumed):                    TARGET:
+------------------+                  +---------------------------+
| [Resources]      |                  | [Lvl] [Coins] [Gems] [XP]|
| [Board........]  |                  | [Order1][Order2][Order3]  |
| [Board........]  |       ->        | [.......................]  |
| [Board........]  |                  | [..... MERGE BOARD .....]  |
| [Bottom bar]     |                  | [.......................]  |
+------------------+                  | [Storage] [Garden] [Shop] |
                                      +---------------------------+
```

Key changes:
1. Add dedicated order bar between resources and board
2. Resource bar should show: Level, Coins, Gems (no energy counter since we have unlimited energy)
3. Bottom navigation: Storage, Garden View (town equivalent), Collection/Shop
4. Board should take up 55-60% of screen height

---

### 7C. Feature Priority for Maximum Impact

#### Phase 1: "It Feels Like Mystery Town" (HIGHEST PRIORITY)

These changes, implemented together, create the closest Match to the Travel Town/Mystery Town feel:

1. **Orders System (Core)**
   - 3 active order slots
   - 8-10 characters with emoji portraits
   - Orders requiring items from existing chains at various levels
   - Coin + XP rewards
   - Order completion animation
   - New order auto-generation from queue
   - Order bar UI at top of screen

2. **UI Restructure**
   - Add order bar between resources and board
   - Reorganize top bar: Level | Coins | Gems
   - Add bottom navigation bar: Storage | Garden | Collection
   - Ensure single-screen board (no scroll)

3. **Visual Polish**
   - Warm color palette shift (cream/sage/gold)
   - Item glow effects for higher tiers
   - Merge animation: particle burst + bounce
   - Order completion celebration animation
   - Generator visual distinction (larger, pulsing)

4. **Auto-Producers**
   - At least 2-3 generators that produce items on cooldown without tapping
   - Visual cooldown timer on the generator
   - Items auto-spawn in adjacent cells

#### Phase 2: "It Feels Complete" (HIGH PRIORITY)

5. **Garden/Town View**
   - Separate screen showing the garden areas
   - Buildings/areas upgrade visually with coins spent
   - Clouds clear to reveal new areas (huge satisfaction moment)
   - Each area upgrade unlocks a new generator or chain

6. **Character Depth**
   - More characters with distinct personalities
   - Recurring characters who ask for progressively harder items
   - Short story beats on milestone completions

7. **Sound Design**
   - Merge pop/chime sounds
   - Generator tap sounds
   - Order completion jingle
   - Soft background music
   - Ambient garden sounds

8. **Auto-Order System**
   - Orders that auto-appear when max-level items are created
   - Increasing coin rewards for repeat auto-orders
   - Creates a passive income loop

#### Phase 3: "It Has Depth" (MEDIUM PRIORITY)

9. **Combined Chains**
   - Orders that require items from two different chains merged together
   - Creates cross-pollination between chains
   - More strategic depth

10. **Collection Screen**
    - Show all discovered items across all chains
    - Completion percentage per chain
    - Rewards for completing full chains

11. **Daily Challenges**
    - Special daily orders with bonus rewards
    - Streak bonuses for consecutive days

12. **Board Expansion**
    - Board starts at ~25 cells
    - Expands to ~35-45 cells as player levels up
    - New cell reveals feel like progression

#### What to Simplify/Skip

- **NO energy system** (our biggest differentiator as a gift)
- **NO ads** of any kind
- **NO IAP** or premium currency scarcity
- **NO time-pressure mechanics** (Tick-Tock orders can be purely optional, no real penalty)
- **NO competitive events** (keep it purely personal and relaxing)
- **Simplified town building** (our "garden view" can be simpler than Travel Town's full town -- just visual upgrades to garden areas, not full construction management)
- **Fewer total items** (50-100 items is plenty vs Travel Town's 500+ -- quality over quantity for a gift)
- **No scrolling board** (keep it tight and manageable)

---

## Appendix A: Key Differences Between Travel Town and Mystery Town

| Aspect | Travel Town | Mystery Town |
|--------|------------|-------------|
| Developer | Magmatic Games (Moon Active) | Cedar Games Studio |
| Launch | 2020 | October 2024 |
| Revenue | $117M (2024) | Smaller, newer |
| Theme | Seaside town restoration | Mystery/detective mansion |
| Narrative | Light (55 villagers, minimal story) | Stronger (Aurora's investigation, mystery plot) |
| Merge Type | Merge-2 | Merge-2 |
| Board | Single-screen, ~63 cells | Single-screen, similar layout |
| Generators | Standard + Auto + Charging | Standard + Auto (with booster issues) |
| Orders | Villager orders + Auto-orders + Tick-Tock | Similar order system |
| Monetization | IAP + Rewarded Ads (heavy) | IAP (claims no ads, has pop-up offers) |
| Complaints | Energy, board clutter, grinding | Energy, price increases, generator nerfs |
| Art | Bright 2D painted cartoon | Similar style, slightly darker/moodier palette |

## Appendix B: Merge Bloom Advantages as a Gift Game

By removing all monetization friction, Merge Bloom can be the version of this game that players WISH existed:

1. **Unlimited generator taps** -- the #1 player complaint eliminated
2. **No waiting** -- play as long as you want in one sitting
3. **Generous rewards** -- coins and gems flow freely
4. **No ads** -- uninterrupted, pure gameplay
5. **No purchase pressure** -- no pop-ups, no "deals," no FOMO
6. **Relaxing pace** -- truly no-pressure, unlike F2P games that create artificial urgency
7. **Personal touch** -- garden theme + gift = emotional resonance a commercial game can't match

---

## Sources

- [Deconstructing Travel Town: How to engage merge-2 whales -- PocketGamer.biz](https://www.pocketgamer.biz/deconstructing-magmatic-games-travel-town/)
- [Why Travel Town Dominates Mobile Merge -- Naavik](https://naavik.co/digest/why-travel-town-is-dominating-mobile-merge/)
- [Travel Town Deconstruction: Merge-2 Whales -- Gamigion](https://www.gamigion.com/travel-town-deconstruction-merge-2-whales/)
- [The Secrets of Mobile Merge Mastery -- FoxAdvert](https://foxadvert.com/en/digital-marketing-blog/the-secrets-of-mobile-merge-mastery-learn-from-travel-towns-success/)
- [Travel Town Review (2025) -- AllLoot](https://allloot.com/travel-town-review/)
- [Travel Town Beginner's Guide -- Level Winner](https://www.levelwinner.com/travel-town-beginners-guide-tips-tricks-strategies/)
- [Producers/Generators -- Travel Town Wiki (Fandom)](https://travel-town-mobile-game.fandom.com/wiki/Producers/Generators)
- [Items -- Travel Town Wiki (Fandom)](https://travel-town-mobile-game.fandom.com/wiki/Items)
- [Buildings -- Travel Town Wiki (Fandom)](https://travel-town-mobile-game.fandom.com/wiki/Buildings)
- [Automatic Orders -- Travel Town Wiki (Fandom)](https://travel-town-mobile-game.fandom.com/wiki/Automatic_Orders)
- [What are Orders? -- Travel Town Support](https://support.traveltowngame.com/hc/en-us/articles/4833678076434-What-are-Orders)
- [What are Tick Tock Orders? -- Travel Town Support](https://support.traveltowngame.com/hc/en-us/articles/18965678862738-What-are-Tick-Tock-Orders)
- [The Merge Board -- Travel Town Support](https://support.traveltowngame.com/hc/en-us/articles/4833664499090-The-Merge-Board)
- [How to Sell Items -- Travel Town Support](https://support.traveltowngame.com/hc/en-us/articles/4833675472786-How-to-Sell-Items)
- [Mystery Town: Merge Games -- Google Play](https://play.google.com/store/apps/details?id=com.cedargames.mysterytown)
- [Mystery Town: Merge Games -- App Store](https://apps.apple.com/us/app/mystery-town-merge-games/id6503603603)
- [Mystery Town -- Cedar Games Studio](https://cedargamestudio.com/)
- [Mystery Town -- Game Solver](https://game-solver.com/mystery-town-merge-cases/)
- [Travel Town Auto Orders -- SimpleGameGuide](https://simplegameguide.com/travel-town-automatic-orders-list/)
- [Travel Town Auto Orders Guide -- TravelTownFreeEnergyLinks](https://traveltownfreeenergylinks.com/guide/auto-orders/)
- [Explore Key Insights from Travel Town Player Feedback -- Kimola](https://kimola.com/reports/explore-key-insights-from-travel-town-player-feedback-google-play-en-155417)
- [Gossip Harbor's Meteoric Rise -- Naavik](https://naavik.co/digest/gossip-harbors-meteoric-rise-in-merge/)
- [Travel Town vs Merge Mansion -- TravelTownFreeEnergy](https://traveltownfreeenergy.com/travel-town-vs-merge-mansion/)
- [Travel Town -- App Store](https://apps.apple.com/us/app/travel-town-merge-adventure/id1521236603)
- [Travel Town -- Google Play](https://play.google.com/store/apps/details?id=io.randomco.travel)
