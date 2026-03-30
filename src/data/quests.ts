export interface QuestDef {
  id: string;
  description: string;
  type: 'create' | 'merge_count';
  chainId?: string;
  targetTier?: number;
  targetCount: number;
  rewardGems: number;
  rewardXP: number;
  level: number;
}

export const QUEST_POOL: QuestDef[] = [
  { id: 'q1', description: 'Grow a Tulip 🌷', type: 'create', chainId: 'flower', targetTier: 4, targetCount: 1, rewardGems: 50, rewardXP: 100, level: 1 },
  { id: 'q2', description: 'Merge 5 items', type: 'merge_count', targetCount: 5, rewardGems: 30, rewardXP: 50, level: 1 },
  { id: 'q3', description: 'Create a Caterpillar 🐛', type: 'create', chainId: 'butterfly', targetTier: 2, targetCount: 1, rewardGems: 30, rewardXP: 50, level: 1 },
  { id: 'q4', description: 'Grow a Rose 🌹', type: 'create', chainId: 'flower', targetTier: 5, targetCount: 1, rewardGems: 80, rewardXP: 150, level: 1 },
  { id: 'q5', description: 'Merge 10 items', type: 'merge_count', targetCount: 10, rewardGems: 50, rewardXP: 80, level: 1 },
  { id: 'q6', description: 'Cherry Blossom 🌸', type: 'create', chainId: 'flower', targetTier: 6, targetCount: 1, rewardGems: 100, rewardXP: 200, level: 2 },
  { id: 'q7', description: 'Grow an Apple 🍎', type: 'create', chainId: 'fruit', targetTier: 2, targetCount: 1, rewardGems: 50, rewardXP: 100, level: 2 },
  { id: 'q8', description: 'Create a Bee 🐝', type: 'create', chainId: 'butterfly', targetTier: 3, targetCount: 1, rewardGems: 60, rewardXP: 120, level: 1 },
  { id: 'q9', description: 'Merge 20 items', type: 'merge_count', targetCount: 20, rewardGems: 80, rewardXP: 150, level: 2 },
  { id: 'q10', description: 'Create a Bouquet 💐', type: 'create', chainId: 'flower', targetTier: 8, targetCount: 1, rewardGems: 200, rewardXP: 500, level: 2 },
  { id: 'q11', description: 'Create a Butterfly 🦋', type: 'create', chainId: 'butterfly', targetTier: 5, targetCount: 1, rewardGems: 150, rewardXP: 300, level: 2 },
  { id: 'q12', description: 'Grow a Mango 🥭', type: 'create', chainId: 'fruit', targetTier: 5, targetCount: 1, rewardGems: 120, rewardXP: 250, level: 3 },
  { id: 'q13', description: 'Create a Diamond 💎', type: 'create', chainId: 'crystal', targetTier: 4, targetCount: 1, rewardGems: 150, rewardXP: 300, level: 3 },
  { id: 'q14', description: 'Merge 50 items', type: 'merge_count', targetCount: 50, rewardGems: 150, rewardXP: 300, level: 3 },
  { id: 'q15', description: 'Create a Crown 👑', type: 'create', chainId: 'crystal', targetTier: 5, targetCount: 1, rewardGems: 200, rewardXP: 500, level: 4 },
  { id: 'q16', description: 'Build a Cottage 🏡', type: 'create', chainId: 'nature', targetTier: 6, targetCount: 1, rewardGems: 200, rewardXP: 500, level: 4 },
  { id: 'q17', description: 'Create a Cake 🎂', type: 'create', chainId: 'fruit', targetTier: 7, targetCount: 1, rewardGems: 250, rewardXP: 600, level: 3 },
  { id: 'q18', description: 'Create a Peacock 🦚', type: 'create', chainId: 'butterfly', targetTier: 6, targetCount: 1, rewardGems: 250, rewardXP: 600, level: 3 },
  { id: 'q19', description: 'Create a Rainbow 🌈', type: 'create', chainId: 'star', targetTier: 6, targetCount: 1, rewardGems: 300, rewardXP: 800, level: 5 },
  { id: 'q20', description: 'Merge 100 items', type: 'merge_count', targetCount: 100, rewardGems: 300, rewardXP: 800, level: 5 },
  // Tea chain
  { id: 'q21', description: 'Brew a Matcha 🍵', type: 'create', chainId: 'tea', targetTier: 2, targetCount: 1, rewardGems: 50, rewardXP: 100, level: 6 },
  { id: 'q22', description: 'Make Boba Tea 🧋', type: 'create', chainId: 'tea', targetTier: 4, targetCount: 1, rewardGems: 120, rewardXP: 250, level: 6 },
  { id: 'q23', description: 'Build a Tea House 🏠', type: 'create', chainId: 'tea', targetTier: 7, targetCount: 1, rewardGems: 300, rewardXP: 700, level: 6 },
  // Shell chain
  { id: 'q24', description: 'Find a Shell 🐚', type: 'create', chainId: 'shell', targetTier: 2, targetCount: 1, rewardGems: 60, rewardXP: 120, level: 7 },
  { id: 'q25', description: 'Befriend a Dolphin 🐬', type: 'create', chainId: 'shell', targetTier: 5, targetCount: 1, rewardGems: 180, rewardXP: 400, level: 7 },
  { id: 'q26', description: 'Summon a Mermaid 🧜‍♀️', type: 'create', chainId: 'shell', targetTier: 6, targetCount: 1, rewardGems: 300, rewardXP: 700, level: 7 },
  // Sweet chain
  { id: 'q27', description: 'Bake a Cookie 🍪', type: 'create', chainId: 'sweet', targetTier: 3, targetCount: 1, rewardGems: 80, rewardXP: 150, level: 8 },
  { id: 'q28', description: 'Frost a Cupcake 🧁', type: 'create', chainId: 'sweet', targetTier: 4, targetCount: 1, rewardGems: 120, rewardXP: 250, level: 8 },
  { id: 'q29', description: 'Build Candy Castle 🏰', type: 'create', chainId: 'sweet', targetTier: 8, targetCount: 1, rewardGems: 400, rewardXP: 1000, level: 8 },
  { id: 'q30', description: 'Merge 200 items', type: 'merge_count', targetCount: 200, rewardGems: 500, rewardXP: 1200, level: 7 },
  // Love Letters chain
  { id: 'q31', description: 'Write a Growing Heart 💗', type: 'create', chainId: 'love', targetTier: 2, targetCount: 1, rewardGems: 60, rewardXP: 120, level: 3 },
  { id: 'q32', description: 'Craft a Gift Heart 💝', type: 'create', chainId: 'love', targetTier: 4, targetCount: 1, rewardGems: 150, rewardXP: 350, level: 3 },
  { id: 'q33', description: 'Find Eternal Love 💞', type: 'create', chainId: 'love', targetTier: 6, targetCount: 1, rewardGems: 300, rewardXP: 700, level: 3 },
  // Cosmic Voyage
  { id: 'q34', description: 'Spot a Comet ☄️', type: 'create', chainId: 'cosmic', targetTier: 2, targetCount: 1, rewardGems: 60, rewardXP: 120, level: 9 },
  { id: 'q35', description: 'Discover Saturn 🪐', type: 'create', chainId: 'cosmic', targetTier: 5, targetCount: 1, rewardGems: 150, rewardXP: 350, level: 9 },
  { id: 'q36', description: 'Launch a Rocket 🚀', type: 'create', chainId: 'cosmic', targetTier: 7, targetCount: 1, rewardGems: 300, rewardXP: 700, level: 9 },
  // Cozy Cafe
  { id: 'q37', description: 'Brew an Espresso ☕', type: 'create', chainId: 'cafe', targetTier: 2, targetCount: 1, rewardGems: 60, rewardXP: 120, level: 5 },
  { id: 'q38', description: 'Stack some Pancakes 🥞', type: 'create', chainId: 'cafe', targetTier: 5, targetCount: 1, rewardGems: 150, rewardXP: 350, level: 5 },
  { id: 'q39', description: 'Open a Bakery 🏪', type: 'create', chainId: 'cafe', targetTier: 7, targetCount: 1, rewardGems: 300, rewardXP: 700, level: 5 },
];
