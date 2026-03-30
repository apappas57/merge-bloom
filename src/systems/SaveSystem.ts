import { MergeItemData } from '../objects/MergeItem';
import { ActiveQuest } from './QuestSystem';
import { ActiveOrder } from './OrderSystem';

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
    generators: { genId: string; col: number; row: number; itemId: string }[];
  };
  quests: {
    active: ActiveQuest[];
    completed: string[];
  };
  collection: { chainId: string; maxTier: number }[];
  storage?: ({ chainId: string; tier: number } | null)[];
  achievements?: { id: string; unlockedAt: number }[];
  orders?: {
    active: ActiveOrder[];
    completedIds: string[];
    coins: number;
    totalCompleted: number;
  };
}

const SAVE_KEY = 'merge_bloom_save';
const SAVE_VERSION = 3;

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
    };
  }
}
