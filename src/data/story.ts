/**
 * Story system — "Restoring the Garden"
 *
 * Lightweight narrative that rewards gameplay, never interrupts it.
 * 4 acts tied to player level, ~20 story beats triggered at milestones.
 * Each beat is one-time, tracked in save data.
 */

export interface StoryBeat {
  id: string;
  act: number;
  trigger: { type: 'level' | 'chain_complete' | 'order_count' | 'first_max_tier' | 'first_gen_merge'; value: number };
  characterId: string;
  lines: string[];
  reward?: { gems?: number; coins?: number };
}

export interface StoryAct {
  act: number;
  title: string;
  subtitle: string;
  levelRange: [number, number];
}

export const STORY_ACTS: StoryAct[] = [
  { act: 1, title: 'The Overgrown Garden', subtitle: 'Rosie found an abandoned garden and needs help clearing it', levelRange: [1, 5] },
  { act: 2, title: 'New Friends Arrive', subtitle: 'Characters start visiting as the garden improves', levelRange: [6, 10] },
  { act: 3, title: 'The Festival', subtitle: 'Preparing for a garden festival', levelRange: [11, 15] },
  { act: 4, title: 'The Eternal Garden', subtitle: 'The garden becomes a magical sanctuary', levelRange: [16, 99] },
];

export const STORY_BEATS: StoryBeat[] = [
  // ═══ ACT 1: The Overgrown Garden (L1-5) ═══

  {
    id: 'act1_level2_rosie',
    act: 1,
    trigger: { type: 'level', value: 2 },
    characterId: 'rosie',
    lines: ['I knew this garden had potential. Look at it already!'],
    reward: { coins: 50 },
  },
  {
    id: 'act1_level3_mochi',
    act: 1,
    trigger: { type: 'level', value: 3 },
    characterId: 'mochi',
    lines: ['Wait wait wait -- is this MY garden too? This is the best day ever!'],
    reward: { coins: 75 },
  },
  {
    id: 'act1_level4_lyra',
    act: 1,
    trigger: { type: 'level', value: 4 },
    characterId: 'lyra',
    lines: ['The garden is dreaming again... I can feel it waking up.'],
    reward: { gems: 50 },
  },
  {
    id: 'act1_level5_koji',
    act: 1,
    trigger: { type: 'level', value: 5 },
    characterId: 'koji',
    lines: ['I smell opportunity. And also soil. But mostly opportunity!'],
    reward: { coins: 100 },
  },
  {
    id: 'act1_first_max_tier',
    act: 1,
    trigger: { type: 'first_max_tier', value: 1 },
    characterId: 'ren',
    lines: ['Patience creates beauty. You understand that now.'],
    reward: { gems: 100 },
  },
  {
    id: 'act1_first_gen_merge',
    act: 1,
    trigger: { type: 'first_gen_merge', value: 1 },
    characterId: 'lyra',
    lines: ['The generators are singing to each other... can you hear it?'],
    reward: { gems: 75 },
  },

  // ═══ ACT 2: New Friends Arrive (L6-10) ═══

  {
    id: 'act2_level6_suki',
    act: 2,
    trigger: { type: 'level', value: 6 },
    characterId: 'suki',
    lines: ['Oh! The garden is finally worth visiting. The colours are divine.'],
    reward: { coins: 150 },
  },
  {
    id: 'act2_level7_nyx',
    act: 2,
    trigger: { type: 'level', value: 7 },
    characterId: 'nyx',
    lines: ['The stars aligned the night you arrived here. That was not a coincidence.'],
    reward: { gems: 100 },
  },
  {
    id: 'act2_level8_kira',
    act: 2,
    trigger: { type: 'level', value: 8 },
    characterId: 'kira',
    lines: ['I can see the garden from my observatory now! It glows at night!'],
    reward: { coins: 200 },
  },
  {
    id: 'act2_level9_vivi',
    act: 2,
    trigger: { type: 'level', value: 9 },
    characterId: 'vivi',
    lines: ['I brought cupcakes! And cookies! And also more cupcakes!'],
    reward: { coins: 200 },
  },
  {
    id: 'act2_level10_mizu',
    act: 2,
    trigger: { type: 'level', value: 10 },
    characterId: 'mizu',
    lines: ['This place is different now. Calmer. I like it here.'],
    reward: { gems: 150 },
  },
  {
    id: 'act2_orders_10',
    act: 2,
    trigger: { type: 'order_count', value: 10 },
    characterId: 'vivi',
    lines: ['TEN orders! This calls for a celebration cake! Actually, three cakes!'],
    reward: { gems: 100, coins: 200 },
  },

  // ═══ ACT 3: The Festival (L11-15) ═══

  {
    id: 'act3_level11_rosie',
    act: 3,
    trigger: { type: 'level', value: 11 },
    characterId: 'rosie',
    lines: ['Everyone is talking about a garden festival. Should we host one?'],
    reward: { coins: 300 },
  },
  {
    id: 'act3_level12_suki',
    act: 3,
    trigger: { type: 'level', value: 12 },
    characterId: 'suki',
    lines: ['The colour palette of this garden? Stunning. You have real vision.'],
    reward: { gems: 150 },
  },
  {
    id: 'act3_level13_koji',
    act: 3,
    trigger: { type: 'level', value: 13 },
    characterId: 'koji',
    lines: ['I am catering the festival. Nobody argue. The menu is already done.'],
    reward: { coins: 350 },
  },
  {
    id: 'act3_level14_nyx',
    act: 3,
    trigger: { type: 'level', value: 14 },
    characterId: 'nyx',
    lines: ['I will handle the fireworks. Do not ask how. Just trust me.'],
    reward: { gems: 200 },
  },
  {
    id: 'act3_level15_kira',
    act: 3,
    trigger: { type: 'level', value: 15 },
    characterId: 'kira',
    lines: ['I mapped the garden from the observatory. It\'s shaped like a heart!'],
    reward: { gems: 200, coins: 300 },
  },
  {
    id: 'act3_orders_25',
    act: 3,
    trigger: { type: 'order_count', value: 25 },
    characterId: 'mochi',
    lines: ['Twenty-five orders?! You are literally the best gardener in the world!'],
    reward: { gems: 150 },
  },

  // ═══ ACT 4: The Eternal Garden (L16+) ═══

  {
    id: 'act4_level16_rosie',
    act: 4,
    trigger: { type: 'level', value: 16 },
    characterId: 'rosie',
    lines: ['This garden... it feels alive now. Like it has its own heartbeat.'],
    reward: { gems: 250, coins: 500 },
  },
  {
    id: 'act4_level20_ren',
    act: 4,
    trigger: { type: 'level', value: 20 },
    characterId: 'ren',
    lines: ['A garden this old remembers everyone who ever tended it. It will remember you.'],
    reward: { gems: 500 },
  },
];

/** Get the current act based on player level */
export function getCurrentAct(level: number): StoryAct {
  return STORY_ACTS.find(a => level >= a.levelRange[0] && level <= a.levelRange[1]) || STORY_ACTS[STORY_ACTS.length - 1];
}

/** Find story beats that should trigger for the given conditions */
export function getPendingBeats(
  completed: string[],
  conditions: {
    level: number;
    totalOrders: number;
    hasMaxTier: boolean;
    hasGenMerge: boolean;
  }
): StoryBeat[] {
  const completedSet = new Set(completed);
  return STORY_BEATS.filter(beat => {
    if (completedSet.has(beat.id)) return false;

    switch (beat.trigger.type) {
      case 'level':
        return conditions.level >= beat.trigger.value;
      case 'order_count':
        return conditions.totalOrders >= beat.trigger.value;
      case 'first_max_tier':
        return conditions.hasMaxTier;
      case 'first_gen_merge':
        return conditions.hasGenMerge;
      case 'chain_complete':
        return false; // Reserved for future use
      default:
        return false;
    }
  });
}
