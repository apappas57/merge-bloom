import { QuestDef, QUEST_POOL } from '../data/quests';

export interface ActiveQuest {
  def: QuestDef;
  progress: number;
  completed: boolean;
}

export class QuestSystem {
  private activeQuests: ActiveQuest[] = [];
  private completedIds: Set<string> = new Set();
  private maxActive = 3;
  private playerLevel: number;

  constructor(level: number) {
    this.playerLevel = level;
  }

  initialize(saved?: ActiveQuest[], completedIds?: string[]): void {
    if (saved && saved.length > 0) this.activeQuests = saved;
    if (completedIds) this.completedIds = new Set(completedIds);
    this.fillSlots();
  }

  setLevel(level: number): void {
    this.playerLevel = level;
    this.fillSlots();
  }

  private fillSlots(): void {
    while (this.activeQuests.length < this.maxActive) {
      const avail = QUEST_POOL.filter(q =>
        q.level <= this.playerLevel &&
        !this.completedIds.has(q.id) &&
        !this.activeQuests.some(a => a.def.id === q.id)
      );
      if (avail.length === 0) {
        this.completedIds.clear();
        break;
      }
      const q = avail[Phaser.Math.Between(0, avail.length - 1)];
      this.activeQuests.push({ def: q, progress: 0, completed: false });
    }
  }

  onItemCreated(chainId: string, tier: number): ActiveQuest[] {
    const done: ActiveQuest[] = [];
    for (const q of this.activeQuests) {
      if (q.completed) continue;
      if (q.def.type === 'create' && q.def.chainId === chainId && q.def.targetTier && tier >= q.def.targetTier) {
        q.progress = q.def.targetCount;
        q.completed = true;
        done.push(q);
      }
    }
    return done;
  }

  onMerge(): ActiveQuest[] {
    const done: ActiveQuest[] = [];
    for (const q of this.activeQuests) {
      if (q.completed) continue;
      if (q.def.type === 'merge_count') {
        q.progress++;
        if (q.progress >= q.def.targetCount) {
          q.completed = true;
          done.push(q);
        }
      }
    }
    return done;
  }

  claimQuest(questId: string): { gems: number; xp: number } | null {
    const idx = this.activeQuests.findIndex(q => q.def.id === questId && q.completed);
    if (idx === -1) return null;
    const q = this.activeQuests[idx];
    this.completedIds.add(q.def.id);
    this.activeQuests.splice(idx, 1);
    this.fillSlots();
    return { gems: q.def.rewardGems, xp: q.def.rewardXP };
  }

  getActiveQuests(): ActiveQuest[] {
    return this.activeQuests;
  }

  getSaveData(): { active: ActiveQuest[]; completed: string[] } {
    return {
      active: this.activeQuests.map(q => ({ ...q })),
      completed: Array.from(this.completedIds),
    };
  }
}
