# m3rg3r Generator Merging -- Design Spec

## Part 1: Competitive Research

### 1. Travel Town

**Generator types:** Primary, Secondary, Tertiary. Primary generators are unlocked by completing building sites. Secondary generators are created by merging items produced by primary generators to the end of a chain. Tertiary generators are created from secondary chains.

**Can generators be merged?** No. Generators themselves cannot be merged with each other. They are static, permanent board objects. However, the "nestled chain" mechanic creates NEW generators as a byproduct of progressing through an item chain. This is the key innovation: you merge items, and at a certain point in the chain the result IS a new generator.

**Generator tiers/levels:** Generators do not have explicit level-up tiers. Instead, there are different categories:
- Auto-producers: spawn items into adjacent cells on a timer, no energy cost
- Energy producers: tap to spend energy, produce items
- Charging producers: require 5 taps to "charge up" before spawning
- No-energy generators: cooldown-based, spawn items in free adjacent cells

**What higher-tier generators produce:** Secondary generators produce higher-starting-tier items (tier 2-3 instead of tier 1). They may also produce items from different chains.

**How new generators are unlocked:** Building sites (story progression) and nestled chains (merging items creates a generator mid-chain).

**Generator chain?** Not a traditional merge chain. The "nestled chain" creates generators as items within the merge progression, but you don't merge Generator A + Generator A to get Generator B.

**What makes it compelling:** The nestled chain mechanic creates a layered progression. Primary generators feed secondary generators which feed tertiary, creating depth without explicitly merging generators. The "Boost x2" mechanic lets players spend double energy to get tier 2 items directly from generators.


### 2. Merge Mansion

**Generator types:** Sources/Producers -- Toolbox, Gardening Toolbox, Broom Cabinet, Drawer, Vase, Paint Can, and many more area-specific sources.

**Can generators be merged?** YES. This is a core mechanic. Two same-level Toolboxes merge into a higher-level Toolbox. Each source has its own merge chain (e.g., Toolbox L1 through L9+).

**Generator tiers/levels:**
- Toolbox: Levels 1-9+. Starts as a "Closed Tool Crate" (L1), merges up to high-level toolbox
- Gardening Toolbox: Similar progression, 10+ levels
- Broom Cabinet: Bolt & Screw -> Handle -> Handle Assembly -> Cabinet Door -> Cabinet Frame -> up to Professional Broom Cabinet (L11)

**What higher-tier generators produce:**
- Drop quality improves: L4 Toolbox gives Tools(L1), Screws(L1), Paint Can(L1). Higher toolboxes give up to Tools(L1-4), Screws(L1-3), Paint Cans(L1-3)
- Drop rate improves by ~15-18% per level
- Capacity increases: higher-tier generators store more charges before needing to recharge (e.g., Tool Barrel III holds 12 items)
- Recharge time: higher tiers recharge faster

**How new generators are unlocked:** Obtained from chests, purchased with gems, or rewarded from area progression. Generator parts can also be purchased.

**Generator chain?** Yes. Full merge chains exist for each source type. You merge generator parts to build and upgrade generators.

**What makes it compelling:** The dual progression of upgrading both your generators AND the items they produce creates two parallel merge tracks. Investing in generator upgrades pays compound returns.


### 3. EverMerge

**Generator types:** Mines (stone, wagon), Castles (one per character/building type), and obstacle fields that regenerate.

**Can generators be merged?** Mines cannot be merged. Castles cannot be merged (only one of each type exists). However, castles can be UPGRADED by feeding them lower-tier building pieces from their family.

**Generator tiers/levels:** Castles have star levels. Each star level improves rewards. Stars are earned by feeding the castle leftover building pieces (the same pieces used to build it). Magic Stars from Mystic Isle can also be used.

**What higher-tier generators produce:** Higher-star castles give better reward packages when harvested (costs 10 energy regardless of level). Mines regenerate obstacles in their area.

**How new generators are unlocked:** Complete a character's building chain to build their castle. Mines appear in character areas. New areas unlocked with wands.

**Generator chain?** No traditional merge chain for generators. The upgrade path is: feed materials to castle for stars.

**What makes it compelling:** The castle-as-generator concept ties generators to character progression. The "feeding" mechanic for upgrades uses surplus items meaningfully rather than wasting them.


### 4. Merge Dragons

**Generator types:** Many harvestable objects that function as generators:
- Fruit Trees (main coin source, levels 1-10+, harvestable from L4+)
- Dragon Trees (wood source)
- Prism Flowers (dragon tree leaves)
- Living Stones (stone source)
- Coin Vaults (coin storage + passive generation)
- Dragon Homes (housing for dragons)
- Midas Trees (premium coin source)
- Fountains, Wonders, and more

**Can generators be merged?** YES. Almost everything merges. Fruit Tree L3 + Fruit Tree L3 + Fruit Tree L3 = Fruit Tree L4. Coin Vaults merge: L1 through L8+. Dragon Homes merge to higher levels. This is the deepest generator-merging system in the genre.

**Generator tiers/levels:**
- Fruit Trees: ~10+ levels. Harvestable from L4. Higher levels produce higher-value fruits, more frequently
- Coin Vaults: L1 through L8+. L5 is the efficiency sweet spot (1.8 gold/min/tile). L6+ are larger but less space-efficient
- Dragon Homes: Multiple levels, each housing more dragons. Cost scales with how many you own

**What higher-tier generators produce:**
- Fruit Trees: Higher-level fruits (worth more coins when tapped/merged). Higher trees also drop items for other chains
- Coin Vaults: Higher-value coins, faster generation (L5 produces Silver Coins every ~8 min)
- Dragon Homes: More dragon capacity per home
- All generators: Higher tiers produce from a shifted "drop table" -- better average item tier

**How new generators are unlocked:** Level rewards, merging up from lower tiers, purchasing from shop, finding in levels.

**Generator chain?** Yes. Every generator type IS a merge chain. Fruit Trees, Coin Vaults, Dragon Homes -- all form their own chains that you progress through by merging 3 (or 5 for bonus) of the same tier.

**What makes it compelling:** The "everything merges" philosophy means generators are just another item type. This creates organic discovery -- you might not realize something is a generator until you merge it high enough. The efficiency calculation (which tier of vault is most space-efficient?) adds strategic depth.


### 5. Gossip Harbor / Love & Pies

**Generator types:** Both games use category-based generators:
- Love & Pies: Grocery Bag, Drinks Tray, Oven, Bookshelf, Beehouse, Trolley, Games generators
- Gossip Harbor: Food generators, Non-food generators, Side-quest generators, plus an energy-free Orange Tree

**Can generators be merged?** YES. Generators are items on the board that can be merged with matching generators to create higher-level versions.

**Generator tiers/levels:** Generators have ~10 levels each. They start producing items around L4-5. Love & Pies has a "lightning bolt" indicator when you create a permanent source via merging.

**What higher-tier generators produce:**
- More items per charge
- Higher-tier starting items in the drop table
- Sometimes unlock new item types within the chain
- However, higher generators also take longer to recharge (intentional balancing)
- At player level 15 (Gossip Harbor), you unlock generator boosting: spend 2x/4x energy for higher-tier starting items

**How new generators are unlocked:** Created by merging items in the generator's own chain. Start with recipe items (Grocery List + Paper Bag -> eventually a Grocery Bag Generator). New chain generators unlocked through story/area progression.

**Generator chain?** Yes. The generator IS part of the item chain. You merge base items until the chain produces a generator, then merge generators for better generators.

**What makes it compelling:** Love & Pies pioneered the "generator as chain progression" model. Gossip Harbor refined it with the boosting system and energy-free generators (Orange Tree) as a retention hook. The accidental-merge risk at high levels adds tension.


---

## Part 2: Design Patterns Summary

| Feature | Travel Town | Merge Mansion | EverMerge | Merge Dragons | Gossip Harbor / L&P |
|---|---|---|---|---|---|
| Generators merge? | No (nestled chains create new ones) | YES (core mechanic) | No (star upgrades) | YES (everything merges) | YES |
| Generator tiers | Categories, not levels | 9-11 levels per source | Star levels on castles | Full merge chains (8-10+ levels) | ~10 levels |
| Higher tier = better drops? | Secondary gens start at higher tier | Yes: better items, faster recharge, more capacity | Better castle rewards | Better drop table, higher-value outputs | More items, higher starting tier, slower recharge |
| Generator chain exists? | Nestled (creates gens in item chain) | Yes (dedicated gen merge chain) | No (feed to upgrade) | Yes (gens ARE a merge chain) | Yes (gens part of item chain) |
| Unlock method | Building sites + nestled chains | Chests, gems, area progress | Character building completion | Merging up, shop, level rewards | Merge items in chain until gen appears |

**Industry consensus:** The most successful modern merge games (Merge Mansion, Gossip Harbor, Love & Pies) all support generator merging. It is now an expected feature. Merge Dragons' "everything merges" approach is the gold standard for depth. The key balancing lever is the drop table: each generator tier shifts the probability distribution of spawned item tiers upward.


---

## Part 3: m3rg3r Implementation Spec

### Overview

Add generator merging to m3rg3r. Generators become mergeable board items with their own tier progression. Merge two Tier-1 Flower Pots to get a Tier-2 Flower Planter that spawns tier 1-2 items. This follows the Merge Mansion / Love & Pies model (generators are mergeable items with tiers) rather than Travel Town (static generators).

### Generator Tier Design

Each generator gets 5 tiers. This keeps it manageable (12 chains x 5 tiers = 60 generator variants).

| Gen Tier | Name Pattern | Spawn Tier Range | Cooldown | Items Per Tap | Visual |
|---|---|---|---|---|---|
| 1 | [Base Name] | 1 only | 500ms | 1 | Current look |
| 2 | [Name] II | 1-2 (70/30) | 450ms | 1 | + silver ring |
| 3 | [Name] III | 1-3 (40/40/20) | 400ms | 1-2 (80/20) | + gold ring |
| 4 | [Name] IV | 2-4 (30/40/30) | 350ms | 1-2 (60/40) | + gold ring + sparkle |
| 5 | [Name] V (MAX) | 2-5 (20/30/30/20) | 300ms | 1-2 (50/50) | + rainbow border + glow |

**Drop table explanation:** "1-3 (40/40/20)" means 40% chance tier 1, 40% chance tier 2, 20% chance tier 3.

### Per-Chain Generator Names

| Chain | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| flower | Flower Pot | Flower Planter | Flower Garden | Flower Meadow | Flower Paradise |
| butterfly | Nest | Cozy Nest | Grand Nest | Butterfly Grove | Butterfly Sanctuary |
| fruit | Basket | Fruit Crate | Fruit Cart | Fruit Stand | Fruit Orchard |
| crystal | Pickaxe | Silver Pick | Gold Pick | Crystal Drill | Crystal Cavern |
| nature | Stump | Sapling | Young Oak | Ancient Tree | Enchanted Grove |
| star | Telescope | Star Lens | Star Map | Star Gate | Star Observatory |
| tea | Tea Garden | Tea Bushes | Tea Terrace | Tea Pavilion | Tea Palace |
| shell | Tide Pool | Rock Pool | Lagoon | Coral Reef | Ocean Temple |
| sweet | Honey Pot | Candy Jar | Sweet Cart | Sweet Shop | Candy Factory |
| love | Cupid's Bow | Love Basket | Heart Garden | Love Fountain | Love Shrine |
| cosmic | Observatory | Star Lab | Space Deck | Launch Pad | Space Station |
| cafe | Coffee Machine | Barista Bar | Coffee Cart | Cafe Corner | Grand Cafe |

### UX: How Generator Merging Works

1. **Drag generators onto each other** -- same interaction as items. Drag a Flower Pot (T1) onto another Flower Pot (T1) to create a Flower Planter (T2).
2. **Visual merge preview** -- when dragging a generator over a compatible generator, show a green highlight + upward arrow icon (same feedback as item merge preview).
3. **Generator merge animation** -- reuse the existing merge particle system but with a unique "upgrade" sound effect and a brief size pulse.
4. **Generator tier badge** -- small roman numeral badge (II, III, IV, V) in the bottom-right corner of upgraded generators. T1 has no badge. T5 gets a rainbow shimmer on the badge.
5. **Merge hint** -- idle hint system should also pulse matching generators after 15s.
6. **Accidental merge protection** -- generators above T3 require a confirmation tap (like Gossip Harbor's approach for high-value items). OR: hold for 300ms to initiate generator drag (vs instant for items).

### Data Structure Changes

#### `chains.ts` -- New GeneratorDef fields

```typescript
export interface GeneratorTierDef {
  tier: number;
  name: string;
  emoji: string;
  cooldown: number;          // ms between taps
  spawnTable: { tier: number; weight: number }[];  // weighted drop table
  multiSpawnChance: number;  // 0-1, chance to spawn 2 items instead of 1
}

export interface GeneratorDef {
  id: string;
  chainId: string;
  maxTier: number;           // always 5
  cost: number;              // coin cost to buy T1 from shop
  unlockedAtLevel: number;
  tiers: GeneratorTierDef[];
}
```

Example for the flower generator:

```typescript
{
  id: 'gen_flower',
  chainId: 'flower',
  maxTier: 5,
  cost: 0,
  unlockedAtLevel: 1,
  tiers: [
    {
      tier: 1, name: 'Flower Pot', emoji: '\u{1F33B}',
      cooldown: 500,
      spawnTable: [{ tier: 1, weight: 1 }],
      multiSpawnChance: 0,
    },
    {
      tier: 2, name: 'Flower Planter', emoji: '\u{1FAB4}',
      cooldown: 450,
      spawnTable: [{ tier: 1, weight: 70 }, { tier: 2, weight: 30 }],
      multiSpawnChance: 0,
    },
    {
      tier: 3, name: 'Flower Garden', emoji: '\u{1F338}',
      cooldown: 400,
      spawnTable: [{ tier: 1, weight: 40 }, { tier: 2, weight: 40 }, { tier: 3, weight: 20 }],
      multiSpawnChance: 0.2,
    },
    {
      tier: 4, name: 'Flower Meadow', emoji: '\u{1F33A}',
      cooldown: 350,
      spawnTable: [{ tier: 2, weight: 30 }, { tier: 3, weight: 40 }, { tier: 4, weight: 30 }],
      multiSpawnChance: 0.4,
    },
    {
      tier: 5, name: 'Flower Paradise', emoji: '\u{1F490}',
      cooldown: 300,
      spawnTable: [{ tier: 2, weight: 20 }, { tier: 3, weight: 30 }, { tier: 4, weight: 30 }, { tier: 5, weight: 20 }],
      multiSpawnChance: 0.5,
    },
  ],
}
```

#### `SaveSystem.ts` -- Generator save data

```typescript
// Current:
generators: { genId: string; col: number; row: number; itemId: string }[];

// New (add genTier):
generators: { genId: string; genTier: number; col: number; row: number; itemId: string }[];
```

Save migration (v3 -> v4): default all existing generators to `genTier: 1`.

#### `MergeItem.ts` -- No changes needed

Generators remain separate from MergeItem. The Generator class handles its own merge logic.

### Generator.ts Changes

```typescript
export class Generator extends Phaser.GameObjects.Container {
  public genDef: GeneratorDef;
  public genTier: number;           // NEW: current tier (1-5)
  private currentTierDef: GeneratorTierDef;  // NEW: resolved tier config
  // ... existing fields ...

  // NEW: Make generators draggable (like MergeItem)
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  // NEW: Check if two generators can merge
  static canMergeGenerators(a: Generator, b: Generator): boolean {
    if (a.genDef.id !== b.genDef.id) return false;     // same generator type
    if (a.genTier !== b.genTier) return false;          // same tier
    if (a.genTier >= a.genDef.maxTier) return false;    // not already max
    return true;
  }

  // NEW: Resolve spawn tier from drop table
  private rollSpawnTier(): number {
    const table = this.currentTierDef.spawnTable;
    const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of table) {
      roll -= entry.weight;
      if (roll <= 0) return entry.tier;
    }
    return table[0].tier;  // fallback
  }

  // NEW: Check for multi-spawn
  private rollMultiSpawn(): boolean {
    return Math.random() < this.currentTierDef.multiSpawnChance;
  }

  // MODIFIED: onTap now uses drop table
  private onTap(): void {
    if (!this.isReady) return;
    const emptyCell = this.board.findEmptyCellNear(this.col, this.row);
    if (!emptyCell) { /* shake animation */ return; }

    const spawnTier = this.rollSpawnTier();

    // Bounce animation
    this.scene.tweens.add({ /* ... existing ... */ });
    this.scene.events.emit('generator-tapped', this, emptyCell, spawnTier);

    // Multi-spawn: find second empty cell
    if (this.rollMultiSpawn()) {
      const secondCell = this.board.findEmptyCellNear(this.col, this.row, [emptyCell]);
      if (secondCell) {
        const secondTier = this.rollSpawnTier();
        this.scene.events.emit('generator-tapped', this, secondCell, secondTier);
      }
    }

    this.startCooldown();
  }
}
```

### MergeSystem.ts Changes

```typescript
// Add to canMerge -- skip if either item is actually a generator
// (generators use their own merge path)

// NEW method:
canMergeGenerators(a: Generator, b: Generator): boolean {
  return Generator.canMergeGenerators(a, b);
}

// NEW method:
async executeGeneratorMerge(dropped: Generator, target: Generator): Promise<{
  success: boolean;
  newGenTier: number;
  newGenDef: GeneratorTierDef;
}> {
  const newTier = target.genTier + 1;
  const newTierDef = target.genDef.tiers.find(t => t.tier === newTier);
  if (!newTierDef) return { success: false, newGenTier: 0, newGenDef: null! };

  // Play merge animation (reuse item merge particles with generator colors)
  await Promise.all([dropped.playMergeAway(), target.playMergeAway()]);
  this.createParticles(target.x, target.y, newTier + 3, target.genDef.chainId);
  // tier + 3 makes gen merges feel impactful (T1 gen merge = T4 item particles)

  return { success: true, newGenTier: newTier, newGenDef: newTierDef };
}
```

### GameScene Changes (Drag Logic)

The GameScene needs to support dragging generators (currently only items are draggable).

```
1. On pointerdown on a Generator:
   - If generator is on cooldown, ignore
   - Start drag after 200ms hold (prevents accidental drags when tapping)
   - Show pickup animation (slight scale up, shadow)

2. On pointermove while dragging generator:
   - Move generator with pointer
   - Check cells under pointer for compatible generator targets
   - If compatible: green highlight + merge preview (show next tier name/emoji)
   - If not compatible: red X or no highlight

3. On pointerup:
   - If over compatible generator: execute generator merge
   - If over empty cell: move generator to that cell (repositioning)
   - If over occupied cell (non-compatible): snap back to original position
   - If released in same cell with < 200ms hold: treat as tap (spawn item)
```

### Visual Tier Indicators

```
T1: Base appearance (current look, no badge)
T2: Thin silver border ring inside the cell. Small "II" badge bottom-right.
T3: Gold border ring. "III" badge. Subtle inner glow pulse.
T4: Gold border + corner sparkle particles. "IV" badge in gold.
T5: Rainbow holographic border (animated hue shift). "V" badge with rainbow.
    Ambient micro-particles floating from generator.
```

These tier visuals match the existing item tier decoration system (gold borders at T5+, rainbow at T7+) but shifted down since generators max at T5.

### Shop Integration

The shop currently sells T1 generators for coins. Add:
- Keep T1 generators purchasable as before
- Do NOT sell higher-tier generators in the shop (must be earned via merging)
- Optionally: sell "Generator Parts" (a new merge chain that, when completed, produces a random T1 generator) for gems

### Balance Considerations

**Why 5 tiers max (not more):**
- Board space is 6x8 = 48 cells. With 12 chains, players might have 12+ generators. If generators had 10 tiers, the board would be consumed by generator merging.
- 5 tiers means 16 same-tier generators merge down to 1 T5 (2->2->2->2 = 16:1 ratio). Achievable but meaningful.
- m3rg3r has no energy system. Faster cooldowns on higher tiers compound differently than in energy-gated games.

**Cooldown curve (500ms -> 300ms):**
- Since there's no energy wall, cooldowns are already fast. The 40% reduction from T1 to T5 is noticeable but not game-breaking.
- The REAL value is in the drop table, not the cooldown. A T5 generator spawning tier 2-5 items saves the player multiple merge steps.

**Drop table value calculation:**
- T1 gen: always tier 1. To get a tier 5 item, player needs 16 tier 1 items (2^4 merges).
- T5 gen: 20% chance tier 5 directly. Expected tier-1-equivalents per tap = weighted average of 2^(tier-1):
  - 0.20 * 1 + 0.30 * 2 + 0.30 * 4 + 0.20 * 16 = 0.20 + 0.60 + 1.20 + 3.20 = 5.20 tier-1-equivalents per tap
  - vs T1: 1.0 tier-1-equivalents per tap
  - So T5 is ~5.2x more efficient than T1. This feels good for the investment of merging 16 T1 generators.

**Multi-spawn value:**
- T5 has 50% chance to spawn 2 items. Expected items per tap: 1.5
- Combined with drop table: 5.2 * 1.5 = 7.8 tier-1-equivalents per tap at T5
- This is roughly 8x T1 efficiency. Strong reward without being absurd.

**Preventing generator hoarding:**
- Since generators take up board space, players naturally can't hoard too many.
- The optimal strategy should be: keep 1-2 high-tier generators per active chain, sell/merge the rest.

**Obtaining duplicate generators:**
- Players currently get generators from the shop (coins) and as starting board items.
- For generator merging to work, players need multiple generators of the same type.
- Add these sources:
  1. Shop: buy T1 generators for coins (existing, keep prices the same)
  2. Level-up rewards: occasionally grant a random T1 generator
  3. Order rewards: completing high-value orders can reward a generator
  4. Collection milestones: discovering N items in a chain rewards that chain's generator
  5. Quest rewards: some quests reward specific generators

### Save Migration Plan

```typescript
// In SaveSystem.ts
const SAVE_VERSION = 4;  // bump from 3

static load(): SaveData | null {
  // ... existing load logic ...

  // v3 -> v4 migration: add genTier to generators
  if (data.version === 3) {
    data.board.generators = data.board.generators.map(g => ({
      ...g,
      genTier: (g as any).genTier ?? 1,
    }));
    data.version = 4;
  }

  return data;
}
```

### Implementation Order

1. **Data layer** (1 session): Rewrite `GeneratorDef` in `chains.ts` with tier system. Define all 60 generator tier variants (12 chains x 5 tiers). Update `SaveSystem` with migration.

2. **Generator class** (1 session): Add `genTier` property, drop table rolling, multi-spawn logic, tier badge rendering, tier-based visual decorations (rings, sparkles).

3. **Drag system** (1 session): Make generators draggable with 200ms hold threshold. Add merge preview highlights. Handle snap-back and repositioning.

4. **Merge integration** (1 session): Add `canMergeGenerators` and `executeGeneratorMerge` to MergeSystem. Wire into GameScene's drop handling. Add generator merge animation + sound.

5. **Acquisition sources** (1 session): Add generator rewards to orders, quests, level-ups, and collection milestones. Ensure players can obtain duplicate generators.

6. **Polish** (1 session): Tune drop tables through playtesting. Add generator merge to tutorial/hints. Add achievement for first T5 generator.

### New Achievements

| ID | Name | Condition | Reward |
|---|---|---|---|
| gen_merge_first | Upgrade! | Merge two generators for the first time | 500 gems |
| gen_tier_3 | Power Up | Create a Tier 3 generator | 1000 gems |
| gen_tier_5 | Master Maker | Create a Tier 5 generator | 5000 gems |
| gen_all_t2 | Rising Garden | Have a T2+ generator for every unlocked chain | 2000 gems |

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Board clutter from duplicate generators | Natural pressure: generators occupy cells needed for merging. Players self-regulate. |
| Accidental generator merges | 200ms hold-to-drag threshold separates "tap to spawn" from "drag to merge." |
| T5 generators trivialise progression | Drop table still requires merging items. T5 just skips early tiers, not all tiers. Max-tier items still need effort. |
| Complexity overload for casual players | Tutorial step when first duplicate generator appears. Badge system makes tier visually obvious. |
| Save data bloat | One extra field (genTier) per generator. Negligible. |
