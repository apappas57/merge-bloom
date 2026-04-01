import { MergeItemData } from '../objects/MergeItem';
import { ActiveQuest } from './QuestSystem';
import { ActiveOrder } from './OrderSystem';

export interface LoginData {
  lastLoginDate: string;   // YYYY-MM-DD
  loginStreak: number;     // consecutive days (1-7 cycle)
  lastClaimedDate: string; // YYYY-MM-DD of last claimed reward
}

export interface SaveData {
  version: number;
  timestamp: number;
  player: {
    level: number;
    xp: number;
    xpToNext: number;
    gems: number;
    totalMerges: number;
  };
  board: {
    cols: number;
    rows: number;
    items: MergeItemData[];
    generators: { genId: string; genTier: number; col: number; row: number; itemId: string; lastAutoProduceTime?: number }[];
  };
  quests: {
    active: ActiveQuest[];
    completed: string[];
  };
  collection: { chainId: string; maxTier: number }[];
  storage?: ({ chainId: string; tier: number } | null)[];
  achievements?: { id: string; unlockedAt: number }[];
  garden?: { chainId: string; tier: number; emoji: string; name: string; x: number; y: number }[];
  orders?: {
    active: ActiveOrder[];
    completedIds: string[];
    coins: number;
    totalCompleted: number;
  };
  login?: LoginData;
  completedStoryBeats?: string[];
}

const SAVE_KEY = 'm3rg3r_save';
const SAVE_VERSION = 8;

/** v4 -> v5: character ID renames */
const CHAR_ID_MIGRATION: Record<string, string> = {
  rose: 'rosie', petal: 'lyra', bramble: 'koji', coral: 'mizu', luna: 'nyx',
  pip: 'mochi', blossom: 'suki', maple: 'ren', sunny: 'kira', cocoa: 'vivi',
};

export class SaveSystem {
  static save(data: SaveData): void {
    data.version = SAVE_VERSION;
    data.timestamp = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  static load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (data.version < 1) return null;
      // Migrate
      if (!data.storage) data.storage = [null, null, null, null];
      if (!data.achievements) data.achievements = [];
      if (!data.orders) data.orders = undefined;

      // v3 -> v4 migration: add genTier to generators
      if (data.version < 4) {
        data.board.generators = data.board.generators.map(g => ({
          ...g,
          genTier: (g as Record<string, unknown>).genTier as number ?? 1,
        }));
        data.version = 4;
      }

      // v4 -> v5 migration: rename character IDs in saved orders
      if (data.version < 5) {
        if (data.orders?.active) {
          data.orders.active = data.orders.active.map(order => ({
            ...order,
            def: {
              ...order.def,
              characterId: CHAR_ID_MIGRATION[order.def.characterId] || order.def.characterId,
            },
          }));
        }
        data.version = 5;
      }

      // v5 -> v6 migration: add login streak data
      if (data.version < 6) {
        if (!data.login) {
          data.login = { lastLoginDate: '', loginStreak: 0, lastClaimedDate: '' };
        }
        data.version = 6;
      }

      // v6 -> v7 migration: add story beat tracking
      if (data.version < 7) {
        if (!data.completedStoryBeats) {
          data.completedStoryBeats = [];
        }
        data.version = 7;
      }

      // v7 -> v8 migration: add lastAutoProduceTime to generators
      if (data.version < 8) {
        const now = Date.now();
        data.board.generators = data.board.generators.map(g => ({
          ...g,
          lastAutoProduceTime: (g as Record<string, unknown>).lastAutoProduceTime as number ?? now,
        }));
        data.version = 8;
      }

      return data;
    } catch {
      return null;
    }
  }

  static getDefault(): SaveData {
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: { level: 1, xp: 0, xpToNext: 100, gems: 99999, totalMerges: 0 },
      board: { cols: 6, rows: 8, items: [], generators: [] },
      quests: { active: [], completed: [] },
      collection: [],
      storage: [null, null, null, null],
      achievements: [],
      login: { lastLoginDate: '', loginStreak: 0, lastClaimedDate: '' },
      completedStoryBeats: [],
    };
  }

  /** Get today's date as YYYY-MM-DD string */
  static getTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Check login streak and return reward info if it's a new day.
   *  Returns null if already claimed today. */
  static checkLoginStreak(login: LoginData | undefined): {
    streak: number;
    reward: DailyReward;
    isNewDay: boolean;
  } | null {
    const today = SaveSystem.getTodayStr();
    const loginData = login || { lastLoginDate: '', loginStreak: 0, lastClaimedDate: '' };

    // Already claimed today
    if (loginData.lastClaimedDate === today) return null;

    let streak: number;
    if (loginData.lastLoginDate === '') {
      // First ever login
      streak = 1;
    } else {
      // Check if yesterday
      const last = new Date(loginData.lastLoginDate + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      const diffMs = todayDate.getTime() - last.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        streak = (loginData.loginStreak % 7) + 1;
      } else if (diffDays === 0) {
        // Same day (shouldn't reach here due to lastClaimedDate check, but safe)
        return null;
      } else {
        // Missed a day -- reset to 1
        streak = 1;
      }
    }

    const reward = DAILY_REWARDS[streak - 1];
    return { streak, reward, isNewDay: true };
  }

  /** Update login data after claiming a reward */
  static claimDailyReward(login: LoginData | undefined, streak: number): LoginData {
    const today = SaveSystem.getTodayStr();
    return {
      lastLoginDate: today,
      loginStreak: streak,
      lastClaimedDate: today,
    };
  }
}

export interface DailyReward {
  day: number;
  type: 'gems' | 'coins';
  amount: number;
  special?: boolean;  // Day 7 confetti celebration
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, type: 'gems',  amount: 100 },
  { day: 2, type: 'coins', amount: 200 },
  { day: 3, type: 'gems',  amount: 300 },
  { day: 4, type: 'coins', amount: 500 },
  { day: 5, type: 'gems',  amount: 500 },
  { day: 6, type: 'coins', amount: 1000 },
  { day: 7, type: 'gems',  amount: 1000, special: true },
];
