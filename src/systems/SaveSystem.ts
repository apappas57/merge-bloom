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
}

const SAVE_KEY = 'merge_bloom_save';
const SAVE_VERSION = 1;

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
      if (data.version !== SAVE_VERSION) return null;
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
    };
  }
}
