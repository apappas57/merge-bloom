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
];
