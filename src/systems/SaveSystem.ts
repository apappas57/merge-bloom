import { MergeItemData } from '../objects/MergeItem';
import { ActiveQuest } from './QuestSystem';

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
}

const SAVE_KEY = 'merge_bloom_save';
const SAVE_VERSION = 2;

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
      // Accept v1 and v2
      if (data.version < 1) return null;
      // Migrate v1 → v2
      if (!data.storage) data.storage = [null, null, null, null];
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
    };
  }
}
