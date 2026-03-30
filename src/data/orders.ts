export interface OrderItem {
  chainId: string;
  tier: number;
  quantity: number;
}

export interface OrderReward {
  type: 'coins' | 'gems' | 'xp';
  amount: number;
}

export interface Character {
  id: string;
  name: string;
  emoji: string;
  unlockLevel: number;
}

export interface OrderDef {
  id: string;
  characterId: string;
  flavorText: string;
  items: OrderItem[];
  rewards: OrderReward[];
  difficulty: 'easy' | 'medium' | 'hard';
  unlockLevel: number;
}

export const CHARACTERS: Character[] = [
  { id: 'rose', name: 'Rose', emoji: '👩‍🌾', unlockLevel: 1 },
  { id: 'petal', name: 'Petal', emoji: '🧚', unlockLevel: 1 },
  { id: 'bramble', name: 'Bramble', emoji: '🧑‍🍳', unlockLevel: 2 },
  { id: 'coral', name: 'Coral', emoji: '🧜‍♀️', unlockLevel: 3 },
  { id: 'luna', name: 'Luna', emoji: '🧙‍♀️', unlockLevel: 4 },
  { id: 'pip', name: 'Pip', emoji: '🐿️', unlockLevel: 1 },
  { id: 'blossom', name: 'Blossom', emoji: '🦋', unlockLevel: 2 },
  { id: 'maple', name: 'Maple', emoji: '🍁', unlockLevel: 4 },
  { id: 'sunny', name: 'Sunny', emoji: '☀️', unlockLevel: 5 },
  { id: 'cocoa', name: 'Cocoa', emoji: '🧁', unlockLevel: 6 },
];

export const ORDER_POOL: OrderDef[] = [
  // === EASY (Tier 1-3) ===
  { id: 'o1', characterId: 'pip', flavorText: 'Can you find me some seedlings?', items: [{ chainId: 'flower', tier: 1, quantity: 3 }], rewards: [{ type: 'coins', amount: 30 }], difficulty: 'easy', unlockLevel: 1 },
  { id: 'o2', characterId: 'rose', flavorText: 'I need sprouts for my garden!', items: [{ chainId: 'flower', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 50 }, { type: 'xp', amount: 15 }], difficulty: 'easy', unlockLevel: 1 },
  { id: 'o3', characterId: 'petal', flavorText: 'Bring me some eggs please!', items: [{ chainId: 'butterfly', tier: 1, quantity: 3 }], rewards: [{ type: 'coins', amount: 40 }], difficulty: 'easy', unlockLevel: 1 },
  { id: 'o4', characterId: 'pip', flavorText: 'I want clovers for luck!', items: [{ chainId: 'flower', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 80 }, { type: 'xp', amount: 20 }], difficulty: 'easy', unlockLevel: 1 },
  { id: 'o5', characterId: 'petal', flavorText: 'Caterpillars are so cute!', items: [{ chainId: 'butterfly', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 60 }], difficulty: 'easy', unlockLevel: 1 },

  // === MEDIUM (Tier 3-5) ===
  { id: 'o6', characterId: 'rose', flavorText: 'I need tulips for my vase!', items: [{ chainId: 'flower', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 120 }, { type: 'xp', amount: 25 }], difficulty: 'medium', unlockLevel: 1 },
  { id: 'o7', characterId: 'blossom', flavorText: 'A bee for my hive please!', items: [{ chainId: 'butterfly', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 100 }, { type: 'xp', amount: 20 }], difficulty: 'medium', unlockLevel: 2 },
  { id: 'o8', characterId: 'bramble', flavorText: 'I\'m making jam! Need fruit!', items: [{ chainId: 'fruit', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 150 }, { type: 'xp', amount: 25 }], difficulty: 'medium', unlockLevel: 2 },
  { id: 'o9', characterId: 'rose', flavorText: 'Roses for the festival!', items: [{ chainId: 'flower', tier: 5, quantity: 1 }], rewards: [{ type: 'coins', amount: 200 }, { type: 'gems', amount: 5 }], difficulty: 'medium', unlockLevel: 2 },
  { id: 'o10', characterId: 'blossom', flavorText: 'A ladybug for good luck!', items: [{ chainId: 'butterfly', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 150 }, { type: 'xp', amount: 30 }], difficulty: 'medium', unlockLevel: 2 },
  { id: 'o11', characterId: 'bramble', flavorText: 'Kiwi for my smoothie!', items: [{ chainId: 'fruit', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 180 }], difficulty: 'medium', unlockLevel: 3 },
  { id: 'o12', characterId: 'coral', flavorText: 'Ice for my drinks!', items: [{ chainId: 'crystal', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 120 }, { type: 'xp', amount: 20 }], difficulty: 'medium', unlockLevel: 3 },

  // === HARD (Tier 5+, multi-item) ===
  { id: 'o13', characterId: 'luna', flavorText: 'I need a crystal for my spell!', items: [{ chainId: 'crystal', tier: 3, quantity: 1 }], rewards: [{ type: 'coins', amount: 250 }, { type: 'gems', amount: 5 }], difficulty: 'hard', unlockLevel: 3 },
  { id: 'o14', characterId: 'rose', flavorText: 'Cherry blossoms for the park!', items: [{ chainId: 'flower', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 350 }, { type: 'gems', amount: 8 }], difficulty: 'hard', unlockLevel: 3 },
  { id: 'o15', characterId: 'blossom', flavorText: 'A butterfly collection!', items: [{ chainId: 'butterfly', tier: 5, quantity: 1 }], rewards: [{ type: 'coins', amount: 300 }, { type: 'xp', amount: 50 }], difficulty: 'hard', unlockLevel: 3 },
  { id: 'o16', characterId: 'bramble', flavorText: 'Mango chutney time!', items: [{ chainId: 'fruit', tier: 5, quantity: 1 }, { chainId: 'fruit', tier: 3, quantity: 1 }], rewards: [{ type: 'coins', amount: 400 }, { type: 'gems', amount: 8 }], difficulty: 'hard', unlockLevel: 4 },
  { id: 'o17', characterId: 'luna', flavorText: 'A diamond for the crown...', items: [{ chainId: 'crystal', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 500 }, { type: 'gems', amount: 12 }], difficulty: 'hard', unlockLevel: 4 },
  { id: 'o18', characterId: 'maple', flavorText: 'Trees for the grove!', items: [{ chainId: 'nature', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 350 }, { type: 'xp', amount: 40 }], difficulty: 'hard', unlockLevel: 4 },
  { id: 'o19', characterId: 'cocoa', flavorText: 'Cupcakes for the party!', items: [{ chainId: 'sweet', tier: 4, quantity: 2 }], rewards: [{ type: 'coins', amount: 400 }, { type: 'gems', amount: 10 }], difficulty: 'hard', unlockLevel: 6 },
  { id: 'o20', characterId: 'sunny', flavorText: 'Stars for the night sky!', items: [{ chainId: 'star', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 300 }, { type: 'xp', amount: 40 }], difficulty: 'hard', unlockLevel: 5 },
  { id: 'o21', characterId: 'luna', flavorText: 'A bouquet and a crown!', items: [{ chainId: 'flower', tier: 8, quantity: 1 }, { chainId: 'crystal', tier: 5, quantity: 1 }], rewards: [{ type: 'coins', amount: 1000 }, { type: 'gems', amount: 25 }], difficulty: 'hard', unlockLevel: 5 },
  { id: 'o22', characterId: 'cocoa', flavorText: 'Boba and cookies!', items: [{ chainId: 'tea', tier: 4, quantity: 1 }, { chainId: 'sweet', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 350 }, { type: 'gems', amount: 8 }], difficulty: 'hard', unlockLevel: 7 },
  // Love Letters
  { id: 'o23', characterId: 'petal', flavorText: 'Love notes for the fairy ball!', items: [{ chainId: 'love', tier: 1, quantity: 3 }], rewards: [{ type: 'coins', amount: 60 }], difficulty: 'easy', unlockLevel: 3 },
  { id: 'o24', characterId: 'rose', flavorText: 'A gift heart for someone special!', items: [{ chainId: 'love', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 200 }, { type: 'xp', amount: 30 }], difficulty: 'medium', unlockLevel: 3 },
  { id: 'o25', characterId: 'luna', flavorText: 'Eternal love for my enchantment...', items: [{ chainId: 'love', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 500 }, { type: 'gems', amount: 12 }], difficulty: 'hard', unlockLevel: 4 },
  // Cosmic Voyage
  { id: 'o26', characterId: 'sunny', flavorText: 'A comet for my collection!', items: [{ chainId: 'cosmic', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 120 }], difficulty: 'easy', unlockLevel: 9 },
  { id: 'o27', characterId: 'luna', flavorText: 'A nebula for my star map...', items: [{ chainId: 'cosmic', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 500 }, { type: 'gems', amount: 15 }], difficulty: 'hard', unlockLevel: 9 },
  // Cozy Cafe
  { id: 'o28', characterId: 'bramble', flavorText: 'Croissants for the cafe!', items: [{ chainId: 'cafe', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 150 }, { type: 'xp', amount: 25 }], difficulty: 'medium', unlockLevel: 5 },
  { id: 'o29', characterId: 'cocoa', flavorText: 'A layer cake for the display!', items: [{ chainId: 'cafe', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 400 }, { type: 'gems', amount: 10 }], difficulty: 'hard', unlockLevel: 6 },
];
