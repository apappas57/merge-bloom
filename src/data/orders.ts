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
  { id: 'o19', characterId: 'vivi', flavorText: 'Cupcakes for the party! Triple-layer, raspberry swirl, gold leaf on top!', items: [{ chainId: 'sweet', tier: 4, quantity: 2 }], rewards: [{ type: 'coins', amount: 400 }, { type: 'gems', amount: 10 }], difficulty: 'hard', unlockLevel: 8 },
  { id: 'o20', characterId: 'kira', flavorText: 'Stars for the night sky -- I\'m mapping a new constellation! It looks like a cat!', items: [{ chainId: 'star', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 300 }, { type: 'xp', amount: 40 }], difficulty: 'hard', unlockLevel: 5 },
  { id: 'o21', characterId: 'nyx', flavorText: 'A bouquet and a crown. Do not ask why. ...fine. It\'s a gift.', items: [{ chainId: 'flower', tier: 8, quantity: 1 }, { chainId: 'crystal', tier: 5, quantity: 1 }], rewards: [{ type: 'coins', amount: 1000 }, { type: 'gems', amount: 25 }], difficulty: 'hard', unlockLevel: 5 },
  { id: 'o22', characterId: 'vivi', flavorText: 'Boba AND cookies! Together! This is the best day of my life!', items: [{ chainId: 'tea', tier: 4, quantity: 1 }, { chainId: 'sweet', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 350 }, { type: 'gems', amount: 8 }], difficulty: 'hard', unlockLevel: 8 },
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

  // === NEW ORDERS: EASY (T1-T2) ===
  // Rosie - easy
  { id: 'o30', characterId: 'rosie', flavorText: 'Leaves for the compost! Healthy soil, happy garden.', items: [{ chainId: 'nature', tier: 1, quantity: 3 }, { chainId: 'nature', tier: 2, quantity: 1 }], rewards: [{ type: 'coins', amount: 80 }, { type: 'gems', amount: 5 }], difficulty: 'easy', unlockLevel: 4 },
  // Lyra - easy
  { id: 'o31', characterId: 'lyra', flavorText: 'Stars are falling tonight... bring me some before they fade.', items: [{ chainId: 'star', tier: 1, quantity: 3 }, { chainId: 'star', tier: 2, quantity: 1 }], rewards: [{ type: 'coins', amount: 90 }, { type: 'gems', amount: 6 }], difficulty: 'easy', unlockLevel: 5 },
  // Koji - easy
  { id: 'o32', characterId: 'koji', flavorText: 'Coffee beans! I need espresso before I can even think about breakfast!', items: [{ chainId: 'cafe', tier: 1, quantity: 3 }, { chainId: 'cafe', tier: 2, quantity: 1 }], rewards: [{ type: 'coins', amount: 70 }, { type: 'gems', amount: 5 }], difficulty: 'easy', unlockLevel: 5 },
  // Mizu - easy
  { id: 'o33', characterId: 'mizu', flavorText: 'Coral for the reef garden. The little fish need a home.', items: [{ chainId: 'shell', tier: 1, quantity: 3 }, { chainId: 'shell', tier: 2, quantity: 1 }], rewards: [{ type: 'coins', amount: 80 }, { type: 'gems', amount: 6 }], difficulty: 'easy', unlockLevel: 7 },
  // Nyx - easy
  { id: 'o34', characterId: 'nyx', flavorText: 'Space rocks for my altar. Do not touch them with your bare hands.', items: [{ chainId: 'cosmic', tier: 1, quantity: 3 }], rewards: [{ type: 'coins', amount: 60 }, { type: 'gems', amount: 5 }], difficulty: 'easy', unlockLevel: 9 },
  // Mochi - easy
  { id: 'o35', characterId: 'mochi', flavorText: 'Candy! Candy candy candy! Today is the best day ever!', items: [{ chainId: 'sweet', tier: 1, quantity: 3 }, { chainId: 'sweet', tier: 2, quantity: 1 }], rewards: [{ type: 'coins', amount: 75 }, { type: 'gems', amount: 5 }], difficulty: 'easy', unlockLevel: 8 },
  // Suki - easy
  { id: 'o36', characterId: 'suki', flavorText: 'Love notes for the spring festival. Each one must be folded perfectly.', items: [{ chainId: 'love', tier: 1, quantity: 3 }, { chainId: 'love', tier: 2, quantity: 1 }], rewards: [{ type: 'coins', amount: 70 }, { type: 'gems', amount: 5 }], difficulty: 'easy', unlockLevel: 3 },
  // Ren - easy
  { id: 'o37', characterId: 'ren', flavorText: 'Tea leaves for the morning brew. The forest wakes slowly, and so do I.', items: [{ chainId: 'tea', tier: 1, quantity: 3 }, { chainId: 'tea', tier: 2, quantity: 1 }], rewards: [{ type: 'coins', amount: 80 }, { type: 'gems', amount: 6 }], difficulty: 'easy', unlockLevel: 6 },
  // Kira - easy
  { id: 'o38', characterId: 'kira', flavorText: 'Grapes for the trail! You can not adventure on an empty stomach!', items: [{ chainId: 'fruit', tier: 1, quantity: 3 }, { chainId: 'fruit', tier: 2, quantity: 1 }], rewards: [{ type: 'coins', amount: 70 }, { type: 'gems', amount: 5 }], difficulty: 'easy', unlockLevel: 2 },
  // Vivi - easy
  { id: 'o39', characterId: 'vivi', flavorText: 'Droplets for my watercolor palette! Art needs the purest ingredients!', items: [{ chainId: 'crystal', tier: 1, quantity: 3 }, { chainId: 'crystal', tier: 2, quantity: 1 }], rewards: [{ type: 'coins', amount: 100 }, { type: 'gems', amount: 7 }], difficulty: 'easy', unlockLevel: 3 },

  // === NEW ORDERS: MEDIUM (T3-T4) ===
  // Rosie - medium
  { id: 'o40', characterId: 'rosie', flavorText: 'Pine trees for the garden path. They smell like winter mornings.', items: [{ chainId: 'nature', tier: 3, quantity: 2 }, { chainId: 'nature', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 200 }, { type: 'gems', amount: 10 }], difficulty: 'medium', unlockLevel: 4 },
  // Lyra - medium
  { id: 'o41', characterId: 'lyra', flavorText: 'Shooting stars and sparkles... I am writing a poem about the sky.', items: [{ chainId: 'star', tier: 4, quantity: 1 }, { chainId: 'star', tier: 3, quantity: 1 }], rewards: [{ type: 'coins', amount: 250 }, { type: 'gems', amount: 12 }], difficulty: 'medium', unlockLevel: 5 },
  // Koji - medium
  { id: 'o42', characterId: 'koji', flavorText: 'Waffles and croissants! The brunch special is going to blow minds!', items: [{ chainId: 'cafe', tier: 4, quantity: 1 }, { chainId: 'cafe', tier: 3, quantity: 1 }], rewards: [{ type: 'coins', amount: 220 }, { type: 'gems', amount: 11 }], difficulty: 'medium', unlockLevel: 5 },
  // Mizu - medium
  { id: 'o43', characterId: 'mizu', flavorText: 'A crab and a tropical fish. I want to study how they share the reef.', items: [{ chainId: 'shell', tier: 3, quantity: 1 }, { chainId: 'shell', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 250 }, { type: 'gems', amount: 12 }], difficulty: 'medium', unlockLevel: 7 },
  // Nyx - medium
  { id: 'o44', characterId: 'nyx', flavorText: 'Sparkling hearts for the binding spell. Love magic is the strongest kind.', items: [{ chainId: 'love', tier: 3, quantity: 2 }, { chainId: 'love', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 280 }, { type: 'gems', amount: 13 }], difficulty: 'medium', unlockLevel: 4 },
  // Mochi - medium
  { id: 'o45', characterId: 'mochi', flavorText: 'Coffee and cookies! My perfect afternoon snack combo!', items: [{ chainId: 'tea', tier: 3, quantity: 1 }, { chainId: 'sweet', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 200 }, { type: 'gems', amount: 10 }], difficulty: 'medium', unlockLevel: 8 },
  // Suki - medium
  { id: 'o46', characterId: 'suki', flavorText: 'Crystal balls and ice. I am making a frost arrangement -- delicate work.', items: [{ chainId: 'crystal', tier: 3, quantity: 1 }, { chainId: 'crystal', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 200 }, { type: 'gems', amount: 10 }], difficulty: 'medium', unlockLevel: 3 },
  // Ren - medium
  { id: 'o47', characterId: 'ren', flavorText: 'Boba tea and cake. The forest council meets at noon, and I am the host.', items: [{ chainId: 'tea', tier: 4, quantity: 1 }, { chainId: 'tea', tier: 5, quantity: 1 }], rewards: [{ type: 'coins', amount: 300 }, { type: 'gems', amount: 14 }], difficulty: 'medium', unlockLevel: 6 },
  // Kira - medium
  { id: 'o48', characterId: 'kira', flavorText: 'A UFO! I need proof! The adventure club will never believe this!', items: [{ chainId: 'cosmic', tier: 3, quantity: 1 }, { chainId: 'cosmic', tier: 2, quantity: 2 }], rewards: [{ type: 'coins', amount: 250 }, { type: 'gems', amount: 12 }], difficulty: 'medium', unlockLevel: 9 },
  // Vivi - medium
  { id: 'o49', characterId: 'vivi', flavorText: 'Oranges and mangoes! I am painting a still life in sunset colors!', items: [{ chainId: 'fruit', tier: 3, quantity: 2 }, { chainId: 'fruit', tier: 4, quantity: 1 }], rewards: [{ type: 'coins', amount: 250 }, { type: 'gems', amount: 12 }], difficulty: 'medium', unlockLevel: 3 },

  // === NEW ORDERS: HARD (T5-T6) ===
  // Rosie - hard
  { id: 'o50', characterId: 'rosie', flavorText: 'Palm trees and a cottage. I am building a tropical retreat in the garden.', items: [{ chainId: 'nature', tier: 5, quantity: 1 }, { chainId: 'nature', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 600 }, { type: 'gems', amount: 18 }], difficulty: 'hard', unlockLevel: 5 },
  // Lyra - hard
  { id: 'o51', characterId: 'lyra', flavorText: 'A moon, a rainbow, and sparkles. I need the entire sky for my dream spell.', items: [{ chainId: 'star', tier: 5, quantity: 1 }, { chainId: 'star', tier: 6, quantity: 1 }, { chainId: 'star', tier: 3, quantity: 2 }], rewards: [{ type: 'coins', amount: 700 }, { type: 'gems', amount: 22 }], difficulty: 'hard', unlockLevel: 6 },
  // Koji - hard
  { id: 'o52', characterId: 'koji', flavorText: 'Pancake stack and a bakery! I am opening a pop-up and nothing will stop me!', items: [{ chainId: 'cafe', tier: 5, quantity: 1 }, { chainId: 'cafe', tier: 7, quantity: 1 }], rewards: [{ type: 'coins', amount: 800 }, { type: 'gems', amount: 25 }], difficulty: 'hard', unlockLevel: 7 },
  // Mizu - hard
  { id: 'o53', characterId: 'mizu', flavorText: 'A dolphin and a mermaid. The ocean festival only happens once a year.', items: [{ chainId: 'shell', tier: 5, quantity: 1 }, { chainId: 'shell', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 700 }, { type: 'gems', amount: 22 }], difficulty: 'hard', unlockLevel: 8 },
  // Nyx - hard
  { id: 'o54', characterId: 'nyx', flavorText: 'Saturn and a nebula. The stars are aligning. I must be ready.', items: [{ chainId: 'cosmic', tier: 5, quantity: 1 }, { chainId: 'cosmic', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 750 }, { type: 'gems', amount: 23 }], difficulty: 'hard', unlockLevel: 9 },
  // Mochi - hard
  { id: 'o55', characterId: 'mochi', flavorText: 'Donuts and chocolate and a birthday cake! It is my un-birthday party!', items: [{ chainId: 'sweet', tier: 5, quantity: 1 }, { chainId: 'sweet', tier: 6, quantity: 1 }, { chainId: 'sweet', tier: 7, quantity: 1 }], rewards: [{ type: 'coins', amount: 700 }, { type: 'gems', amount: 20 }], difficulty: 'hard', unlockLevel: 8 },
  // Suki - hard
  { id: 'o56', characterId: 'suki', flavorText: 'Twin hearts and eternal love. I am arranging the most beautiful gift ever made.', items: [{ chainId: 'love', tier: 5, quantity: 1 }, { chainId: 'love', tier: 6, quantity: 1 }], rewards: [{ type: 'coins', amount: 600 }, { type: 'gems', amount: 18 }], difficulty: 'hard', unlockLevel: 5 },
  // Ren - hard
  { id: 'o57', characterId: 'ren', flavorText: 'A tea set and a tea house. The old ways are the best ways. Come, sit, stay.', items: [{ chainId: 'tea', tier: 6, quantity: 1 }, { chainId: 'tea', tier: 7, quantity: 1 }], rewards: [{ type: 'coins', amount: 750 }, { type: 'gems', amount: 23 }], difficulty: 'hard', unlockLevel: 7 },
  // Kira - hard
  { id: 'o58', characterId: 'kira', flavorText: 'A rocket ship! I am going to space! Pack snacks! And a mango!', items: [{ chainId: 'cosmic', tier: 7, quantity: 1 }, { chainId: 'fruit', tier: 5, quantity: 1 }], rewards: [{ type: 'coins', amount: 800 }, { type: 'gems', amount: 25 }], difficulty: 'hard', unlockLevel: 9 },
  // Vivi - hard
  { id: 'o59', characterId: 'vivi', flavorText: 'A peach, a cake, and a hibiscus! My masterpiece needs the perfect warm palette!', items: [{ chainId: 'fruit', tier: 6, quantity: 1 }, { chainId: 'fruit', tier: 7, quantity: 1 }, { chainId: 'flower', tier: 7, quantity: 1 }], rewards: [{ type: 'coins', amount: 750 }, { type: 'gems', amount: 22 }], difficulty: 'hard', unlockLevel: 6 },
];
