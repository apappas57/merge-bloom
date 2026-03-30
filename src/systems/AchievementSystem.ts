import { ACHIEVEMENTS, AchievementDef } from '../data/achievements';
import { MERGE_CHAINS } from '../data/chains';

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}

export class AchievementSystem {
  private unlocked: Map<string, number> = new Map();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  initialize(saved?: UnlockedAchievement[]): void {
    if (saved) {
      for (const a of saved) this.unlocked.set(a.id, a.unlockedAt);
    }
  }

  check(state: {
    totalMerges: number;
    level: number;
    collection: Map<string, number>;
    newChainId?: string;
    newTier?: number;
  }): AchievementDef[] {
    const newlyUnlocked: AchievementDef[] = [];

    for (const ach of ACHIEVEMENTS) {
      if (this.unlocked.has(ach.id)) continue;

      let met = false;
      const c = ach.condition;

      switch (c.type) {
        case 'merge_count':
          met = state.totalMerges >= c.value;
          break;
        case 'level':
          met = state.level >= c.value;
          break;
        case 'item_created':
          if (c.chainId && c.tier && state.newChainId === c.chainId && state.newTier === c.tier) {
            met = true;
          }
          // Also check collection (might have been created before)
          if (c.chainId && c.tier) {
            const maxTier = state.collection.get(c.chainId) || 0;
            if (maxTier >= c.tier) met = true;
          }
          break;
        case 'chain_complete': {
          for (const chain of MERGE_CHAINS) {
            const maxTier = state.collection.get(chain.id) || 0;
            const finalTier = chain.items[chain.items.length - 1].tier;
            if (maxTier >= finalTier) { met = true; break; }
          }
          break;
        }
        case 'collection_pct': {
          let discovered = 0, total = 0;
          for (const chain of MERGE_CHAINS) {
            total += chain.items.length;
            discovered += Math.min(state.collection.get(chain.id) || 0, chain.items.length);
          }
          const pct = total > 0 ? (discovered / total) * 100 : 0;
          met = pct >= c.value;
          break;
        }
        case 'all_chains': {
          met = MERGE_CHAINS.every(chain => {
            const maxTier = state.collection.get(chain.id) || 0;
            return maxTier >= chain.items[chain.items.length - 1].tier;
          });
          break;
        }
      }

      if (met) {
        this.unlocked.set(ach.id, Date.now());
        newlyUnlocked.push(ach);
      }
    }

    return newlyUnlocked;
  }

  getUnlocked(): UnlockedAchievement[] {
    const result: UnlockedAchievement[] = [];
    this.unlocked.forEach((unlockedAt, id) => result.push({ id, unlockedAt }));
    return result;
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  get totalUnlocked(): number {
    return this.unlocked.size;
  }
}
