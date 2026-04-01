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
  { id: 'rosie', name: 'Rosie', emoji: '👩‍🌾', unlockLevel: 1 },
  { id: 'lyra', name: 'Lyra', emoji: '🧚', unlockLevel: 1 },
  { id: 'koji', name: 'Koji', emoji: '🧑‍🍳', unlockLevel: 2 },
  { id: 'mizu', name: 'Mizu', emoji: '🧜‍♀️', unlockLevel: 3 },
  { id: 'nyx', name: 'Nyx', emoji: '🧙‍♀️', unlockLevel: 4 },
  { id: 'mochi', name: 'Mochi', emoji: '🐿️', unlockLevel: 1 },
  { id: 'suki', name: 'Suki', emoji: '🦋', unlockLevel: 2 },
  { id: 'ren', name: 'Ren', emoji: '🍁', unlockLevel: 4 },
  { id: 'kira', name: 'Kira', emoji: '☀️', unlockLevel: 5 },
  { id: 'vivi', name: 'Vivi', emoji: '🧁', unlockLevel: 6 },
];

export const ORDER_POOL: OrderDef[] = [
  // === EASY (Tier 1-3) ===
  { id: 'o1', characterId: 'mochi', flavorText: 'Seedlings! I need seedlings! I\'m starting my very own collection!', items: [{ chainId: 'flower', tier: 1, quantity: 3 }], rewards: [{ type: 'coins', amount: 30 }], difficulty: 'easy', unlockLevel: 1 },
  { id: 'o2', characterId: 'rosie', flavorText: 'I\'m planting a new border today -- could you find me some sprouts?', items: [{ chainId: 'flower', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 50 }, { type: 'xp', amount: 15 }], difficulty: 'easy', unlockLevel: 1 },
  { id: 'o3', characterId: 'lyra', flavorText: 'The eggs are dreaming... can you bring me some? I want to listen.', items: [{ chainId: 'butterfly', tier: 1, quantity: 3 }], rewards: [{ type: 'coins', amount: 40 }], difficulty: 'easy', unlockLevel: 1 },
  { id: 'o4', characterId: 'mochi', flavorText: 'Clovers! For my lucky corner! This is going to be amazing!', items: [{ chainId: 'flower', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 80 }, { type: 'xp', amount: 20 }], difficulty: 'easy', unlockLevel: 1 },
  { id: 'o5', characterId: 'lyra', flavorText: 'Caterpillars are already beautiful, even before they change... bring me some?', items: [{ chainId: 'butterfly', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 60 }], difficulty: 'easy', unlockLevel: 1 },

  // === MEDIUM (Tier 3-5) ===
  { id: 'o6', characterId: 'rosie', flavorText: 'The tulips are almost in bloom -- I just need a few more for the archway.', items: [{ chainId: 'flower', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 120 }, { type: 'xp', amount: 25 }], difficulty: 'medium', unlockLevel: 1 },
  { id: 'o7', characterId: 'suki', flavorText: 'A bee for my hive, please. The yellow will look perfect next to the lavender.', items: [{ chainId: 'butterfly', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 100 }, { type: 'xp', amount: 20 }], difficulty: 'medium', unlockLevel: 2 },
  { id: 'o8', characterId: 'koji', flavorText: 'I\'m making jam today! Real jam. The kind that makes you close your eyes.', items: [{ chainId: 'fruit', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 150 }, { type: 'xp', amount: 25 }], difficulty: 'medium', unlockLevel: 2 },
  { id: 'o9', characterId: 'rosie', flavorText: 'Cherry blossom season only lasts a moment. Let\'s not miss it.', items: [{ chainId: 'flower', tier: 5, quantity: 1 }], rewards: [{ type: 'coins', amount: 200 }, { type: 'gems', amount: 5 }], difficulty: 'medium', unlockLevel: 2 },
  { id: 'o10', characterId: 'suki', flavorText: 'A ladybug. Red and black -- timeless. I need one for the collection.', items: [{ chainId: 'butterfly', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 150 }, { type: 'xp', amount: 30 }], difficulty: 'medium', unlockLevel: 2 },
  { id: 'o11', characterId: 'koji', flavorText: 'Kiwi for the smoothie. Not just any kiwi -- the fuzzy, perfect kind.', items: [{ chainId: 'fruit', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 180 }], difficulty: 'medium', unlockLevel: 3 },
  { id: 'o12', characterId: 'mizu', flavorText: 'Ice for my drinks. The good kind.', items: [{ chainId: 'crystal', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 120 }, { type: 'xp', amount: 20 }], difficulty: 'medium', unlockLevel: 3 },

  // === HARD (Tier 5+, multi-item) ===
  { id: 'o13', characterId: 'nyx', flavorText: 'I need a crystal for my spell... do not ask which spell.', items: [{ chainId: 'crystal', tier: 3, quantity: 1 }], rewards: [{ type: 'coins', amount: 250 }, { type: 'gems', amount: 5 }], difficulty: 'hard', unlockLevel: 3 },
  { id: 'o14', characterId: 'rosie', flavorText: 'Cherry blossoms for the park -- they only bloom once. Make it count.', items: [{ chainId: 'flower', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 350 }, { type: 'gems', amount: 8 }], difficulty: 'hard', unlockLevel: 3 },
  { id: 'o15', characterId: 'suki', flavorText: 'I\'m curating a butterfly collection. Only the most beautiful. No pressure.', items: [{ chainId: 'butterfly', tier: 5, quantity: 1 }], rewards: [{ type: 'coins', amount: 300 }, { type: 'xp', amount: 50 }], difficulty: 'hard', unlockLevel: 3 },
  { id: 'o16', characterId: 'koji', flavorText: 'Mango chutney! This batch is going to be legendary. I need fruit. All of it.', items: [{ chainId: 'fruit', tier: 5, quantity: 1 }, { chainId: 'fruit', tier: 3, quantity: 1 }], rewards: [{ type: 'coins', amount: 400 }, { type: 'gems', amount: 8 }], difficulty: 'hard', unlockLevel: 4 },
  { id: 'o17', characterId: 'nyx', flavorText: 'A diamond for the crown. The ritual requires both beauty and power.', items: [{ chainId: 'crystal', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 500 }, { type: 'gems', amount: 12 }], difficulty: 'hard', unlockLevel: 4 },
  { id: 'o18', characterId: 'ren', flavorText: 'Trees for the grove. They\'ve been patient. It\'s time.', items: [{ chainId: 'nature', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 350 }, { type: 'xp', amount: 40 }], difficulty: 'hard', unlockLevel: 4 },
  { id: 'o19', characterId: 'vivi', flavorText: 'Cupcakes for the party! Triple-layer, raspberry swirl, gold leaf on top!', items: [{ chainId: 'sweet', tier: 4, quantity: 2 }], rewards: [{ type: 'coins', amount: 400 }, { type: 'gems', amount: 10 }], difficulty: 'hard', unlockLevel: 6 },
  { id: 'o20', characterId: 'kira', flavorText: 'Stars for the night sky -- I\'m mapping a new constellation! It looks like a cat!', items: [{ chainId: 'star', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 300 }, { type: 'xp', amount: 40 }], difficulty: 'hard', unlockLevel: 5 },
  { id: 'o21', characterId: 'nyx', flavorText: 'A bouquet and a crown. Do not ask why. ...fine. It\'s a gift.', items: [{ chainId: 'flower', tier: 8, quantity: 1 }, { chainId: 'crystal', tier: 5, quantity: 1 }], rewards: [{ type: 'coins', amount: 1000 }, { type: 'gems', amount: 25 }], difficulty: 'hard', unlockLevel: 5 },
  { id: 'o22', characterId: 'vivi', flavorText: 'Boba AND cookies! Together! This is the best day of my life!', items: [{ chainId: 'tea', tier: 4, quantity: 1 }, { chainId: 'sweet', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 350 }, { type: 'gems', amount: 8 }], difficulty: 'hard', unlockLevel: 7 },
  // Love Letters
  { id: 'o23', characterId: 'lyra', flavorText: 'Love notes for the fairy ball! Every invitation must sparkle.', items: [{ chainId: 'love', tier: 1, quantity: 3 }], rewards: [{ type: 'coins', amount: 60 }], difficulty: 'easy', unlockLevel: 3 },
  { id: 'o24', characterId: 'rosie', flavorText: 'A gift heart for someone special. You know I\'m a romantic.', items: [{ chainId: 'love', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 200 }, { type: 'xp', amount: 30 }], difficulty: 'medium', unlockLevel: 3 },
  { id: 'o25', characterId: 'nyx', flavorText: 'Eternal love for my enchantment... it\'s for research. Stop looking at me like that.', items: [{ chainId: 'love', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 500 }, { type: 'gems', amount: 12 }], difficulty: 'hard', unlockLevel: 4 },
  // Cosmic Voyage
  { id: 'o26', characterId: 'kira', flavorText: 'A comet! I saw one last night and I need to study it up close!', items: [{ chainId: 'cosmic', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 120 }], difficulty: 'easy', unlockLevel: 9 },
  { id: 'o27', characterId: 'nyx', flavorText: 'A nebula for my star map... the constellations have been whispering again.', items: [{ chainId: 'cosmic', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 500 }, { type: 'gems', amount: 15 }], difficulty: 'hard', unlockLevel: 9 },
  // Cozy Cafe
  { id: 'o28', characterId: 'koji', flavorText: 'Croissants! Forty-seven layers of butter and love!', items: [{ chainId: 'cafe', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 150 }, { type: 'xp', amount: 25 }], difficulty: 'medium', unlockLevel: 5 },
  { id: 'o29', characterId: 'vivi', flavorText: 'A layer cake for the display -- seven tiers, buttercream roses, perfection required!', items: [{ chainId: 'cafe', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 400 }, { type: 'gems', amount: 10 }], difficulty: 'hard', unlockLevel: 6 },
];
