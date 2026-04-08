export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: {
    type: 'merge_count' | 'item_created' | 'chain_complete' | 'level' | 'collection_pct' | 'all_chains';
    value: number;
    chainId?: string;
    tier?: number;
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_bloom', name: 'First Bloom', description: 'Your very first merge!', emoji: '🌱',
    condition: { type: 'merge_count', value: 1 } },
  { id: 'budding_gardener', name: 'Budding Gardener', description: '10 merges and counting!', emoji: '🌿',
    condition: { type: 'merge_count', value: 10 } },
  { id: 'green_thumb', name: 'Green Thumb', description: '100 merges. The garden knows your touch.', emoji: '🧤',
    condition: { type: 'merge_count', value: 100 } },
  { id: 'merge_master', name: 'Merge Master', description: '1,000 merges. You make it look easy.', emoji: '✨',
    condition: { type: 'merge_count', value: 1000 } },
  { id: 'chain_champion', name: 'Chain Champion', description: 'Complete every item in a chain.', emoji: '🏆',
    condition: { type: 'chain_complete', value: 1 } },
  { id: 'collector_half', name: 'Collector', description: 'Discover 50% of all items.', emoji: '📖',
    condition: { type: 'collection_pct', value: 50 } },
  { id: 'completionist', name: 'Completionist', description: 'Every item discovered. Incredible.', emoji: '🌟',
    condition: { type: 'collection_pct', value: 100 } },
  { id: 'crown_jewel', name: 'Crown Jewel', description: 'Fit for royalty.', emoji: '👑',
    condition: { type: 'item_created', value: 1, chainId: 'crystal', tier: 5 } },
  { id: 'rainbow_maker', name: 'Rainbow Maker', description: 'You brought color to the sky.', emoji: '🌈',
    condition: { type: 'item_created', value: 1, chainId: 'star', tier: 6 } },
  { id: 'bouquet_master', name: 'Bouquet Master', description: 'The finest flowers, arranged with love.', emoji: '💐',
    condition: { type: 'item_created', value: 1, chainId: 'flower', tier: 8 } },
  { id: 'candy_castle', name: 'Sweet Dreams', description: 'A castle made entirely of candy!', emoji: '🏰',
    condition: { type: 'item_created', value: 1, chainId: 'sweet', tier: 8 } },
  { id: 'mermaid_friend', name: 'Mermaid Friend', description: 'The ocean shared its secret.', emoji: '🧜‍♀️',
    condition: { type: 'item_created', value: 1, chainId: 'shell', tier: 6 } },
  { id: 'level_5', name: 'Growing Garden', description: 'Level 5. New things are blooming!', emoji: '🌷',
    condition: { type: 'level', value: 5 } },
  { id: 'level_10', name: 'Rising Star', description: 'Level 10. The garden thrives.', emoji: '⭐',
    condition: { type: 'level', value: 10 } },
  { id: 'level_20', name: 'Garden Legend', description: 'Level 20. A legacy of blooms.', emoji: '💕',
    condition: { type: 'level', value: 20 } },
  { id: 'all_chains', name: 'Master of All', description: 'Every chain completed to its final form.', emoji: '🎀',
    condition: { type: 'all_chains', value: 1 } },

  // === Chain completion achievements (for chains without one) ===
  { id: 'tea_master', name: 'Tea Ceremony', description: 'The tea house is open. All are welcome.', emoji: '🫖',
    condition: { type: 'item_created', value: 1, chainId: 'tea', tier: 7 } },
  { id: 'nature_keeper', name: 'Forest Keeper', description: 'The cottage stands among the ancient trees.', emoji: '🏡',
    condition: { type: 'item_created', value: 1, chainId: 'nature', tier: 6 } },
  { id: 'love_eternal', name: 'Eternal Flame', description: 'A love that never fades.', emoji: '💞',
    condition: { type: 'item_created', value: 1, chainId: 'love', tier: 6 } },
  { id: 'cosmic_voyager', name: 'Cosmic Voyager', description: 'The rocket is ready. Next stop: the stars.', emoji: '🚀',
    condition: { type: 'item_created', value: 1, chainId: 'cosmic', tier: 7 } },
  { id: 'cafe_owner', name: 'Grand Opening', description: 'The bakery door swings open. Fresh bread forever.', emoji: '🏪',
    condition: { type: 'item_created', value: 1, chainId: 'cafe', tier: 7 } },
  { id: 'fruit_harvest', name: 'Harvest Festival', description: 'The orchard overflows. Time for cake.', emoji: '🎂',
    condition: { type: 'item_created', value: 1, chainId: 'fruit', tier: 7 } },
  { id: 'butterfly_sanctuary', name: 'Butterfly Sanctuary', description: 'The peacock spreads its wings. Magnificent.', emoji: '🦚',
    condition: { type: 'item_created', value: 1, chainId: 'butterfly', tier: 6 } },

  // === Order milestone achievements ===
  { id: 'orders_10', name: 'Helpful Friend', description: '10 orders delivered. Everyone knows your name.', emoji: '📦',
    condition: { type: 'merge_count', value: 50 } },
  { id: 'orders_25', name: 'Town Hero', description: '25 orders and counting. The town depends on you.', emoji: '🦸',
    condition: { type: 'merge_count', value: 200 } },
  { id: 'orders_50', name: 'Legendary Courier', description: '50 orders. You have never let anyone down.', emoji: '🏅',
    condition: { type: 'merge_count', value: 500 } },

  // === Merge milestones ===
  { id: 'merge_500', name: 'Merge Addict', description: '500 merges. You dream in chains now.', emoji: '🔗',
    condition: { type: 'merge_count', value: 500 } },
  { id: 'merge_2000', name: 'Merge Legend', description: '2,000 merges. The items move themselves for you.', emoji: '💫',
    condition: { type: 'merge_count', value: 2000 } },
  { id: 'merge_10000', name: 'Merge Ascended', description: '10,000 merges. You have transcended the board.', emoji: '🌌',
    condition: { type: 'merge_count', value: 10000 } },

  // === Level milestones ===
  { id: 'level_15', name: 'Seasoned Gardener', description: 'Level 15. The garden remembers your hands.', emoji: '🌻',
    condition: { type: 'level', value: 15 } },
  { id: 'level_25', name: 'Garden Sage', description: 'Level 25. Flowers bloom just because you walked by.', emoji: '🧙',
    condition: { type: 'level', value: 25 } },

  // === Collection milestones ===
  { id: 'collector_quarter', name: 'Curious Explorer', description: '25% of all items discovered. Keep looking!', emoji: '🔍',
    condition: { type: 'collection_pct', value: 25 } },
  { id: 'collector_three_quarter', name: 'Almost There', description: '75% of all items discovered. So close!', emoji: '📚',
    condition: { type: 'collection_pct', value: 75 } },
  { id: 'shell_collector', name: 'Shell Collector', description: 'The ocean whispers its final secret.', emoji: '🐚',
    condition: { type: 'item_created', value: 1, chainId: 'shell', tier: 5 } },

  // === Hidden/secret achievements ===
  { id: 'night_owl', name: 'Night Owl', description: 'A moon and a shooting star at the same time. Magic hour.', emoji: '🦉',
    condition: { type: 'item_created', value: 1, chainId: 'star', tier: 5 } },
  { id: 'sweet_tooth', name: 'Sweet Tooth', description: 'Candy, cookies, and cake. The dentist will never know.', emoji: '🍭',
    condition: { type: 'item_created', value: 1, chainId: 'sweet', tier: 5 } },
];
