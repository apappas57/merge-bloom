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

export interface GeneratorDef {
  id: string;
  chainId: string;
  emoji: string;
  name: string;
  spawnTier: number;
  cooldown: number;
  cost: number;
  unlockedAtLevel: number;
}

export const GENERATORS: GeneratorDef[] = [
  { id: 'gen_flower', chainId: 'flower', emoji: '🌻', name: 'Flower Pot', spawnTier: 1, cooldown: 8000, cost: 0, unlockedAtLevel: 1 },
  { id: 'gen_butterfly', chainId: 'butterfly', emoji: '🪺', name: 'Nest', spawnTier: 1, cooldown: 10000, cost: 100, unlockedAtLevel: 1 },
  { id: 'gen_fruit', chainId: 'fruit', emoji: '🧺', name: 'Basket', spawnTier: 1, cooldown: 8000, cost: 200, unlockedAtLevel: 2 },
  { id: 'gen_crystal', chainId: 'crystal', emoji: '⛏️', name: 'Pickaxe', spawnTier: 1, cooldown: 12000, cost: 500, unlockedAtLevel: 3 },
  { id: 'gen_nature', chainId: 'nature', emoji: '🪵', name: 'Stump', spawnTier: 1, cooldown: 10000, cost: 800, unlockedAtLevel: 4 },
  { id: 'gen_tea', chainId: 'tea', emoji: '🍃', name: 'Tea Garden', spawnTier: 1, cooldown: 9000, cost: 600, unlockedAtLevel: 6 },
  { id: 'gen_shell', chainId: 'shell', emoji: '🌊', name: 'Tide Pool', spawnTier: 1, cooldown: 11000, cost: 900, unlockedAtLevel: 7 },
  { id: 'gen_sweet', chainId: 'sweet', emoji: '🍯', name: 'Honey Pot', spawnTier: 1, cooldown: 10000, cost: 1200, unlockedAtLevel: 8 },
  { id: 'gen_star', chainId: 'star', emoji: '🔭', name: 'Telescope', spawnTier: 1, cooldown: 15000, cost: 1000, unlockedAtLevel: 5 },
];
