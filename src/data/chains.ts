export interface MergeChainItem {
  emoji: string;
  name: string;
  tier: number;
}

export interface MergeChain {
  id: string;
  name: string;
  items: MergeChainItem[];
  unlockedAtLevel: number;
}

export const MERGE_CHAINS: MergeChain[] = [
  {
    id: 'flower',
    name: 'Garden Flowers',
    unlockedAtLevel: 1,
    items: [
      { emoji: '🌱', name: 'Seedling', tier: 1 },
      { emoji: '🌿', name: 'Sprout', tier: 2 },
      { emoji: '☘️', name: 'Clover', tier: 3 },
      { emoji: '🌷', name: 'Tulip', tier: 4 },
      { emoji: '🌹', name: 'Rose', tier: 5 },
      { emoji: '🌸', name: 'Cherry Blossom', tier: 6 },
      { emoji: '🌺', name: 'Hibiscus', tier: 7 },
      { emoji: '💐', name: 'Bouquet', tier: 8 },
    ]
  },
  {
    id: 'butterfly',
    name: 'Flutter Friends',
    unlockedAtLevel: 1,
    items: [
      { emoji: '🥚', name: 'Egg', tier: 1 },
      { emoji: '🐛', name: 'Caterpillar', tier: 2 },
      { emoji: '🐝', name: 'Bee', tier: 3 },
      { emoji: '🐞', name: 'Ladybug', tier: 4 },
      { emoji: '🦋', name: 'Butterfly', tier: 5 },
      { emoji: '🦚', name: 'Peacock', tier: 6 },
    ]
  },
  {
    id: 'fruit',
    name: 'Fruit Garden',
    unlockedAtLevel: 2,
    items: [
      { emoji: '🍇', name: 'Grapes', tier: 1 },
      { emoji: '🍎', name: 'Apple', tier: 2 },
      { emoji: '🍊', name: 'Orange', tier: 3 },
      { emoji: '🥝', name: 'Kiwi', tier: 4 },
      { emoji: '🥭', name: 'Mango', tier: 5 },
      { emoji: '🍑', name: 'Peach', tier: 6 },
      { emoji: '🎂', name: 'Cake', tier: 7 },
    ]
  },
  {
    id: 'crystal',
    name: 'Crystal Cave',
    unlockedAtLevel: 3,
    items: [
      { emoji: '💧', name: 'Droplet', tier: 1 },
      { emoji: '🧊', name: 'Ice', tier: 2 },
      { emoji: '🔮', name: 'Crystal Ball', tier: 3 },
      { emoji: '💎', name: 'Diamond', tier: 4 },
      { emoji: '👑', name: 'Crown', tier: 5 },
    ]
  },
  {
    id: 'nature',
    name: 'Enchanted Forest',
    unlockedAtLevel: 4,
    items: [
      { emoji: '🍂', name: 'Leaf', tier: 1 },
      { emoji: '🍁', name: 'Maple Leaf', tier: 2 },
      { emoji: '🌲', name: 'Pine', tier: 3 },
      { emoji: '🌳', name: 'Tree', tier: 4 },
      { emoji: '🌴', name: 'Palm', tier: 5 },
      { emoji: '🏡', name: 'Cottage', tier: 6 },
    ]
  },
  {
    id: 'star',
    name: 'Starlight',
    unlockedAtLevel: 5,
    items: [
      { emoji: '⭐', name: 'Star', tier: 1 },
      { emoji: '🌟', name: 'Glowing Star', tier: 2 },
      { emoji: '✨', name: 'Sparkles', tier: 3 },
      { emoji: '💫', name: 'Shooting Star', tier: 4 },
      { emoji: '🌙', name: 'Moon', tier: 5 },
      { emoji: '🌈', name: 'Rainbow', tier: 6 },
    ]
  },
  {
    id: 'tea',
    name: 'Cozy Tea',
    unlockedAtLevel: 6,
    items: [
      { emoji: '🫘', name: 'Tea Leaf', tier: 1 },
      { emoji: '🍵', name: 'Matcha', tier: 2 },
      { emoji: '☕', name: 'Coffee', tier: 3 },
      { emoji: '🧋', name: 'Boba Tea', tier: 4 },
      { emoji: '🍰', name: 'Cake Slice', tier: 5 },
      { emoji: '🫖', name: 'Tea Set', tier: 6 },
      { emoji: '🏠', name: 'Tea House', tier: 7 },
    ]
  },
  {
    id: 'shell',
    name: 'Ocean Dreams',
    unlockedAtLevel: 7,
    items: [
      { emoji: '🪸', name: 'Coral', tier: 1 },
      { emoji: '🐚', name: 'Shell', tier: 2 },
      { emoji: '🦀', name: 'Crab', tier: 3 },
      { emoji: '🐠', name: 'Tropical Fish', tier: 4 },
      { emoji: '🐬', name: 'Dolphin', tier: 5 },
      { emoji: '🧜‍♀️', name: 'Mermaid', tier: 6 },
    ]
  },
  {
    id: 'sweet',
    name: 'Sweet Treats',
    unlockedAtLevel: 8,
    items: [
      { emoji: '🍬', name: 'Candy', tier: 1 },
      { emoji: '🍭', name: 'Lollipop', tier: 2 },
      { emoji: '🍪', name: 'Cookie', tier: 3 },
      { emoji: '🧁', name: 'Cupcake', tier: 4 },
      { emoji: '🍩', name: 'Donut', tier: 5 },
      { emoji: '🍫', name: 'Chocolate', tier: 6 },
      { emoji: '🎂', name: 'Birthday Cake', tier: 7 },
      { emoji: '🏰', name: 'Candy Castle', tier: 8 },
    ]
  },
  {
    id: 'love',
    name: 'Love Letters',
    unlockedAtLevel: 3,
    items: [
      { emoji: '💌', name: 'Love Note', tier: 1 },
      { emoji: '💗', name: 'Growing Heart', tier: 2 },
      { emoji: '💖', name: 'Sparkling Heart', tier: 3 },
      { emoji: '💝', name: 'Gift Heart', tier: 4 },
      { emoji: '💕', name: 'Twin Hearts', tier: 5 },
      { emoji: '💞', name: 'Eternal Love', tier: 6 },
    ]
  },
  {
    id: 'cosmic',
    name: 'Cosmic Voyage',
    unlockedAtLevel: 9,
    items: [
      { emoji: '🪨', name: 'Space Rock', tier: 1 },
      { emoji: '☄️', name: 'Comet', tier: 2 },
      { emoji: '🛸', name: 'UFO', tier: 3 },
      { emoji: '🌍', name: 'Earth', tier: 4 },
      { emoji: '🪐', name: 'Saturn', tier: 5 },
      { emoji: '🌌', name: 'Nebula', tier: 6 },
      { emoji: '🚀', name: 'Rocket Ship', tier: 7 },
    ]
  },
  {
    id: 'cafe',
    name: 'Cozy Cafe',
    unlockedAtLevel: 5,
    items: [
      { emoji: '🫘', name: 'Coffee Bean', tier: 1 },
      { emoji: '☕', name: 'Espresso', tier: 2 },
      { emoji: '🥐', name: 'Croissant', tier: 3 },
      { emoji: '🧇', name: 'Waffle', tier: 4 },
      { emoji: '🥞', name: 'Pancake Stack', tier: 5 },
      { emoji: '🎂', name: 'Layer Cake', tier: 6 },
      { emoji: '🏪', name: 'Bakery', tier: 7 },
    ]
  }
];

export function getChain(chainId: string): MergeChain | undefined {
  return MERGE_CHAINS.find(c => c.id === chainId);
}

export function getChainItem(chainId: string, tier: number): MergeChainItem | undefined {
  const chain = getChain(chainId);
  if (!chain) return undefined;
  return chain.items.find(item => item.tier === tier);
}

export function getNextInChain(chainId: string, currentTier: number): MergeChainItem | undefined {
  const chain = getChain(chainId);
  if (!chain) return undefined;
  return chain.items.find(item => item.tier === currentTier + 1);
}

export function isMaxTier(chainId: string, tier: number): boolean {
  const chain = getChain(chainId);
  if (!chain) return true;
  return tier >= chain.items[chain.items.length - 1].tier;
}

export function getTextureKey(chainId: string, tier: number): string {
  return `${chainId}_${tier}`;
}

export interface GeneratorTierDef {
  tier: number;
  name: string;
  emoji: string;
  cooldown: number;
  spawnTable: { tier: number; weight: number }[];
  multiSpawnChance: number;
}

export interface GeneratorDef {
  id: string;
  chainId: string;
  emoji: string;
  name: string;
  spawnTier: number;
  cooldown: number;
  cost: number;
  unlockedAtLevel: number;
  maxTier: number;
  tiers: GeneratorTierDef[];
}

/** Per-chain generator tier names and emojis */
const GEN_TIER_DATA: Record<string, { names: string[]; emojis: string[] }> = {
  flower:    { names: ['Flower Pot',     'Flower Planter',  'Flower Garden',   'Flower Meadow',    'Flower Paradise'],     emojis: ['🌻', '🪴', '🌸', '🌺', '💐'] },
  butterfly: { names: ['Nest',           'Cozy Nest',       'Grand Nest',      'Butterfly Grove',  'Butterfly Sanctuary'], emojis: ['🪺', '🐣', '🐥', '🦋', '🏕️'] },
  fruit:     { names: ['Basket',         'Fruit Crate',     'Fruit Cart',      'Fruit Stand',      'Fruit Orchard'],       emojis: ['🧺', '📦', '🛒', '🏪', '🌳'] },
  crystal:   { names: ['Pickaxe',        'Silver Pick',     'Gold Pick',       'Crystal Drill',    'Crystal Cavern'],      emojis: ['⛏️', '🪨', '🔮', '💎', '🏔️'] },
  nature:    { names: ['Stump',          'Sapling',         'Young Oak',       'Ancient Tree',     'Enchanted Grove'],     emojis: ['🪵', '🌱', '🌿', '🌳', '🏡'] },
  star:      { names: ['Telescope',      'Star Lens',       'Star Map',        'Star Gate',        'Star Observatory'],    emojis: ['🔭', '🔍', '🗺️', '🌟', '🏛️'] },
  tea:       { names: ['Tea Garden',     'Tea Bushes',      'Tea Terrace',     'Tea Pavilion',     'Tea Palace'],          emojis: ['🍃', '🌿', '🍵', '🫖', '🏯'] },
  shell:     { names: ['Tide Pool',      'Rock Pool',       'Lagoon',          'Coral Reef',       'Ocean Temple'],        emojis: ['🌊', '🪸', '🏝️', '🐠', '🏛️'] },
  sweet:     { names: ['Honey Pot',      'Candy Jar',       'Sweet Cart',      'Sweet Shop',       'Candy Factory'],       emojis: ['🍯', '🍬', '🛒', '🏪', '🏭'] },
  love:      { names: ["Cupid's Bow",    'Love Basket',     'Heart Garden',    'Love Fountain',    'Love Shrine'],         emojis: ['💘', '💝', '💖', '⛲', '🏛️'] },
  cosmic:    { names: ['Observatory',    'Star Lab',        'Space Deck',      'Launch Pad',       'Space Station'],       emojis: ['🔭', '🔬', '🛸', '🚀', '🛰️'] },
  cafe:      { names: ['Coffee Machine', 'Barista Bar',     'Coffee Cart',     'Cafe Corner',      'Grand Cafe'],          emojis: ['☕', '🧋', '🛒', '🏪', '🏰'] },
};

/** Standard tier definitions shared by all generators */
const TIER_TEMPLATES: Omit<GeneratorTierDef, 'name' | 'emoji'>[] = [
  { tier: 1, cooldown: 500, spawnTable: [{ tier: 1, weight: 100 }],                                                                  multiSpawnChance: 0 },
  { tier: 2, cooldown: 450, spawnTable: [{ tier: 1, weight: 70 }, { tier: 2, weight: 30 }],                                          multiSpawnChance: 0.1 },
  { tier: 3, cooldown: 400, spawnTable: [{ tier: 1, weight: 40 }, { tier: 2, weight: 40 }, { tier: 3, weight: 20 }],                 multiSpawnChance: 0.2 },
  { tier: 4, cooldown: 350, spawnTable: [{ tier: 1, weight: 20 }, { tier: 2, weight: 30 }, { tier: 3, weight: 30 }, { tier: 4, weight: 20 }], multiSpawnChance: 0.35 },
  { tier: 5, cooldown: 300, spawnTable: [{ tier: 2, weight: 20 }, { tier: 3, weight: 30 }, { tier: 4, weight: 30 }, { tier: 5, weight: 20 }], multiSpawnChance: 0.5 },
];

function buildGeneratorTiers(chainId: string): GeneratorTierDef[] {
  const data = GEN_TIER_DATA[chainId];
  if (!data) return [];
  return TIER_TEMPLATES.map((tmpl, i) => ({
    ...tmpl,
    name: data.names[i],
    emoji: data.emojis[i],
  }));
}

export const GENERATORS: GeneratorDef[] = [
  { id: 'gen_flower',    chainId: 'flower',    emoji: '🌻', name: 'Flower Pot',     spawnTier: 1, cooldown: 500, cost: 0,    unlockedAtLevel: 1, maxTier: 5, tiers: buildGeneratorTiers('flower') },
  { id: 'gen_butterfly', chainId: 'butterfly',  emoji: '🪺', name: 'Nest',           spawnTier: 1, cooldown: 500, cost: 100,  unlockedAtLevel: 1, maxTier: 5, tiers: buildGeneratorTiers('butterfly') },
  { id: 'gen_fruit',     chainId: 'fruit',      emoji: '🧺', name: 'Basket',         spawnTier: 1, cooldown: 500, cost: 200,  unlockedAtLevel: 2, maxTier: 5, tiers: buildGeneratorTiers('fruit') },
  { id: 'gen_crystal',   chainId: 'crystal',    emoji: '⛏️', name: 'Pickaxe',        spawnTier: 1, cooldown: 500, cost: 500,  unlockedAtLevel: 3, maxTier: 5, tiers: buildGeneratorTiers('crystal') },
  { id: 'gen_nature',    chainId: 'nature',     emoji: '🪵', name: 'Stump',          spawnTier: 1, cooldown: 500, cost: 800,  unlockedAtLevel: 4, maxTier: 5, tiers: buildGeneratorTiers('nature') },
  { id: 'gen_tea',       chainId: 'tea',        emoji: '🍃', name: 'Tea Garden',     spawnTier: 1, cooldown: 500, cost: 600,  unlockedAtLevel: 6, maxTier: 5, tiers: buildGeneratorTiers('tea') },
  { id: 'gen_shell',     chainId: 'shell',      emoji: '🌊', name: 'Tide Pool',      spawnTier: 1, cooldown: 500, cost: 900,  unlockedAtLevel: 7, maxTier: 5, tiers: buildGeneratorTiers('shell') },
  { id: 'gen_sweet',     chainId: 'sweet',      emoji: '🍯', name: 'Honey Pot',      spawnTier: 1, cooldown: 500, cost: 1200, unlockedAtLevel: 8, maxTier: 5, tiers: buildGeneratorTiers('sweet') },
  { id: 'gen_star',      chainId: 'star',       emoji: '🔭', name: 'Telescope',      spawnTier: 1, cooldown: 500, cost: 1000, unlockedAtLevel: 5, maxTier: 5, tiers: buildGeneratorTiers('star') },
  { id: 'gen_love',      chainId: 'love',       emoji: '💘', name: "Cupid's Bow",    spawnTier: 1, cooldown: 500, cost: 600,  unlockedAtLevel: 3, maxTier: 5, tiers: buildGeneratorTiers('love') },
  { id: 'gen_cosmic',    chainId: 'cosmic',     emoji: '🔭', name: 'Observatory',    spawnTier: 1, cooldown: 500, cost: 1800, unlockedAtLevel: 9, maxTier: 5, tiers: buildGeneratorTiers('cosmic') },
  { id: 'gen_cafe',      chainId: 'cafe',       emoji: '☕', name: 'Coffee Machine', spawnTier: 1, cooldown: 500, cost: 1000, unlockedAtLevel: 5, maxTier: 5, tiers: buildGeneratorTiers('cafe') },
];

/** Get the texture key for a generator at a specific tier */
export function getGenTextureKey(genId: string, genTier: number): string {
  return `gen_${genId}_t${genTier}`;
}

/** Get the tier definition for a generator */
export function getGenTierDef(genDef: GeneratorDef, genTier: number): GeneratorTierDef | undefined {
  return genDef.tiers.find(t => t.tier === genTier);
}
