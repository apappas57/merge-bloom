export interface ChallengeTemplate {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cols: number;
  rows: number;
  items: { chainId: string; tier: number; col: number; row: number }[];
  generators?: { genId: string; col: number; row: number }[];
  goal: { description: string; chainId: string; tier: number; count: number };
  rewardXP: number;
  rewardCoins: number;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'tulip_garden',
    name: 'Tulip Garden',
    difficulty: 'easy',
    cols: 4, rows: 5,
    items: [
      { chainId: 'flower', tier: 1, col: 0, row: 0 },
      { chainId: 'flower', tier: 1, col: 1, row: 0 },
      { chainId: 'flower', tier: 1, col: 2, row: 0 },
      { chainId: 'flower', tier: 1, col: 3, row: 0 },
      { chainId: 'flower', tier: 2, col: 0, row: 1 },
      { chainId: 'flower', tier: 2, col: 1, row: 1 },
      { chainId: 'flower', tier: 3, col: 2, row: 1 },
      { chainId: 'flower', tier: 3, col: 3, row: 1 },
    ],
    goal: { description: 'Create a Tulip 🌷', chainId: 'flower', tier: 4, count: 1 },
    rewardXP: 50, rewardCoins: 100,
  },
  {
    id: 'crystal_clear',
    name: 'Crystal Clear',
    difficulty: 'easy',
    cols: 4, rows: 5,
    items: [
      { chainId: 'crystal', tier: 1, col: 0, row: 0 },
      { chainId: 'crystal', tier: 1, col: 1, row: 0 },
      { chainId: 'crystal', tier: 1, col: 2, row: 0 },
      { chainId: 'crystal', tier: 1, col: 3, row: 0 },
      { chainId: 'crystal', tier: 1, col: 0, row: 1 },
      { chainId: 'crystal', tier: 1, col: 1, row: 1 },
      { chainId: 'crystal', tier: 2, col: 2, row: 1 },
      { chainId: 'crystal', tier: 2, col: 3, row: 1 },
    ],
    goal: { description: 'Create a Crystal Ball 🔮', chainId: 'crystal', tier: 3, count: 1 },
    rewardXP: 50, rewardCoins: 100,
  },
  {
    id: 'butterfly_dreams',
    name: 'Butterfly Dreams',
    difficulty: 'medium',
    cols: 4, rows: 5,
    items: [
      { chainId: 'butterfly', tier: 1, col: 0, row: 0 },
      { chainId: 'butterfly', tier: 1, col: 1, row: 0 },
      { chainId: 'butterfly', tier: 1, col: 2, row: 0 },
      { chainId: 'butterfly', tier: 1, col: 3, row: 0 },
      { chainId: 'butterfly', tier: 1, col: 0, row: 1 },
      { chainId: 'butterfly', tier: 1, col: 1, row: 1 },
      { chainId: 'butterfly', tier: 1, col: 2, row: 1 },
      { chainId: 'butterfly', tier: 1, col: 3, row: 1 },
      { chainId: 'butterfly', tier: 2, col: 0, row: 2 },
      { chainId: 'butterfly', tier: 2, col: 1, row: 2 },
    ],
    goal: { description: 'Create a Butterfly 🦋', chainId: 'butterfly', tier: 5, count: 1 },
    rewardXP: 80, rewardCoins: 200,
  },
  {
    id: 'fruit_salad',
    name: 'Fruit Salad',
    difficulty: 'medium',
    cols: 4, rows: 5,
    items: [
      { chainId: 'fruit', tier: 1, col: 0, row: 0 },
      { chainId: 'fruit', tier: 1, col: 1, row: 0 },
      { chainId: 'fruit', tier: 2, col: 2, row: 0 },
      { chainId: 'fruit', tier: 2, col: 3, row: 0 },
      { chainId: 'fruit', tier: 1, col: 0, row: 1 },
      { chainId: 'fruit', tier: 1, col: 1, row: 1 },
      { chainId: 'fruit', tier: 3, col: 2, row: 1 },
      { chainId: 'fruit', tier: 3, col: 3, row: 1 },
    ],
    goal: { description: 'Create a Kiwi 🥝', chainId: 'fruit', tier: 4, count: 1 },
    rewardXP: 80, rewardCoins: 200,
  },
  {
    id: 'rose_rush',
    name: 'Rose Rush',
    difficulty: 'hard',
    cols: 4, rows: 5,
    items: [
      { chainId: 'flower', tier: 1, col: 0, row: 0 },
      { chainId: 'flower', tier: 1, col: 1, row: 0 },
      { chainId: 'flower', tier: 1, col: 2, row: 0 },
      { chainId: 'flower', tier: 1, col: 3, row: 0 },
      { chainId: 'flower', tier: 1, col: 0, row: 1 },
      { chainId: 'flower', tier: 1, col: 1, row: 1 },
      { chainId: 'flower', tier: 1, col: 2, row: 1 },
      { chainId: 'flower', tier: 1, col: 3, row: 1 },
      { chainId: 'flower', tier: 2, col: 0, row: 2 },
      { chainId: 'flower', tier: 2, col: 1, row: 2 },
      { chainId: 'flower', tier: 2, col: 2, row: 2 },
      { chainId: 'flower', tier: 2, col: 3, row: 2 },
    ],
    generators: [{ genId: 'gen_flower', col: 1, row: 4 }],
    goal: { description: 'Create a Rose 🌹', chainId: 'flower', tier: 5, count: 1 },
    rewardXP: 120, rewardCoins: 350,
  },
  {
    id: 'love_letter',
    name: 'Love Letter',
    difficulty: 'medium',
    cols: 4, rows: 5,
    items: [
      { chainId: 'love', tier: 1, col: 0, row: 0 },
      { chainId: 'love', tier: 1, col: 1, row: 0 },
      { chainId: 'love', tier: 1, col: 2, row: 0 },
      { chainId: 'love', tier: 1, col: 3, row: 0 },
      { chainId: 'love', tier: 2, col: 0, row: 1 },
      { chainId: 'love', tier: 2, col: 1, row: 1 },
      { chainId: 'love', tier: 1, col: 2, row: 1 },
      { chainId: 'love', tier: 1, col: 3, row: 1 },
    ],
    goal: { description: 'Create a Gift Heart 💝', chainId: 'love', tier: 4, count: 1 },
    rewardXP: 80, rewardCoins: 200,
  },
  {
    id: 'cafe_morning',
    name: 'Cafe Morning',
    difficulty: 'easy',
    cols: 4, rows: 5,
    items: [
      { chainId: 'cafe', tier: 1, col: 0, row: 0 },
      { chainId: 'cafe', tier: 1, col: 1, row: 0 },
      { chainId: 'cafe', tier: 1, col: 2, row: 0 },
      { chainId: 'cafe', tier: 1, col: 3, row: 0 },
      { chainId: 'cafe', tier: 2, col: 0, row: 1 },
      { chainId: 'cafe', tier: 2, col: 1, row: 1 },
    ],
    goal: { description: 'Make a Croissant 🥐', chainId: 'cafe', tier: 3, count: 1 },
    rewardXP: 50, rewardCoins: 100,
  },
  {
    id: 'stargazer',
    name: 'Stargazer',
    difficulty: 'hard',
    cols: 4, rows: 5,
    items: [
      { chainId: 'star', tier: 1, col: 0, row: 0 },
      { chainId: 'star', tier: 1, col: 1, row: 0 },
      { chainId: 'star', tier: 1, col: 2, row: 0 },
      { chainId: 'star', tier: 1, col: 3, row: 0 },
      { chainId: 'star', tier: 1, col: 0, row: 1 },
      { chainId: 'star', tier: 1, col: 1, row: 1 },
      { chainId: 'star', tier: 1, col: 2, row: 1 },
      { chainId: 'star', tier: 1, col: 3, row: 1 },
      { chainId: 'star', tier: 2, col: 0, row: 2 },
      { chainId: 'star', tier: 2, col: 1, row: 2 },
    ],
    goal: { description: 'Create a Moon 🌙', chainId: 'star', tier: 5, count: 1 },
    rewardXP: 120, rewardCoins: 350,
  },
];

/** Get today's challenge using a date-seeded selection */
export function getTodayChallenge(): ChallengeTemplate {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % CHALLENGE_TEMPLATES.length;
  return CHALLENGE_TEMPLATES[idx];
}

/** Check if today's challenge has been completed */
export function isTodayCompleted(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return localStorage.getItem('m3rg3r_daily_completed') === today;
}

/** Mark today's challenge as completed */
export function markTodayCompleted(): void {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('m3rg3r_daily_completed', today);
}
