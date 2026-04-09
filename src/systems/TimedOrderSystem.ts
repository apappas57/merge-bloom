import { MERGE_CHAINS } from '../data/chains';
import { CHARACTERS } from '../data/orders';

// ── Types ──────────────────────────────────────────────────────

export interface TimedOrderItem {
  chainId: string;
  tier: number;
  quantity: number;
}

export interface TimedOrderReward {
  type: 'coins' | 'gems' | 'xp';
  amount: number;
}

export interface TimedOrderDef {
  id: string;
  characterId: string;
  flavorText: string;
  items: TimedOrderItem[];
  rewards: TimedOrderReward[];
  difficulty: 'quick' | 'sprint' | 'marathon';
  timeLimitMs: number;
}

export interface ActiveTimedOrder {
  def: TimedOrderDef;
  progress: number[];
  startTime: number;
  completed: boolean;
  expired: boolean;
}

export interface TimedOrderSaveData {
  activeOrder: ActiveTimedOrder | null;
  cooldownUntil: number;
  totalCompleted: number;
}

// ── Flavor Texts ───────────────────────────────────────────────

const TIMED_TEXTS: Record<string, string[]> = {
  quick: [
    'Quick delivery! Can you handle it?',
    'I need this before the kettle boils!',
    'Speed round! Show me what you\'ve got!',
    'Just a tiny rush order, no big deal!',
    'The clock is ticking... but no pressure!',
    'Fast and fabulous, that\'s the goal!',
  ],
  sprint: [
    'The guests arrive soon! Help!',
    'I need these for the festival today!',
    'A challenge worthy of your skills!',
    'Race against the clock with me!',
    'Can you pull this off in time?',
    'This one takes a bit more effort!',
  ],
  marathon: [
    'This is a big one. Ready?',
    'Only the best mergers can do this!',
    'A legendary challenge awaits!',
    'I believe in you. This is your moment!',
    'The ultimate test of your garden!',
    'Go big or go home, right?',
  ],
};

// ── Cooldown Constants ─────────────────────────────────────────

const COOLDOWN_AFTER_COMPLETE = 300_000; // 5 min
const COOLDOWN_AFTER_DECLINE = 180_000;  // 3 min
const COOLDOWN_AFTER_EXPIRY = 120_000;   // 2 min
const PLAY_TIME_THRESHOLD = 300_000;     // 5 min of active play

// ── Difficulty Config ──────────────────────────────────────────

interface DifficultyConfig {
  timeLimitMs: number;
  itemCount: [number, number]; // [min, max]
  tierRange: [number, number]; // [min, max]
  coinRange: [number, number];
  gems: number;
  minLevel: number;
}

const DIFFICULTY_CONFIG: Record<string, DifficultyConfig> = {
  quick: {
    timeLimitMs: 300_000,
    itemCount: [1, 1],
    tierRange: [1, 3],
    coinRange: [60, 160],
    gems: 5,
    minLevel: 1,
  },
  sprint: {
    timeLimitMs: 600_000,
    itemCount: [1, 2],
    tierRange: [2, 5],
    coinRange: [150, 400],
    gems: 8,
    minLevel: 4,
  },
  marathon: {
    timeLimitMs: 900_000,
    itemCount: [2, 3],
    tierRange: [3, 6],
    coinRange: [300, 800],
    gems: 15,
    minLevel: 8,
  },
};

// ── Helpers ────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let timedOrderIdCounter = 0;

// ── System ─────────────────────────────────────────────────────

export class TimedOrderSystem {
  private activeOrder: ActiveTimedOrder | null = null;
  private cooldownUntil = 0;
  private totalCompleted = 0;
  private playerLevel: number;
  private lastPlayTime = Date.now();
  private playTimeAccumulated = 0;

  constructor(level: number) {
    this.playerLevel = level;
  }

  setLevel(level: number): void {
    this.playerLevel = level;
  }

  initialize(saved?: TimedOrderSaveData): void {
    if (saved) {
      this.activeOrder = saved.activeOrder;
      this.cooldownUntil = saved.cooldownUntil;
      this.totalCompleted = saved.totalCompleted;
    }
  }

  // ── Play-Time Tracking ─────────────────────────────────────

  /** Track play time. Call every frame or on a 1-second timer. */
  tick(): void {
    const now = Date.now();
    this.playTimeAccumulated += now - this.lastPlayTime;
    this.lastPlayTime = now;
  }

  /** Should we offer a new timed order? (every 5 min of active play) */
  shouldOfferOrder(): boolean {
    if (this.activeOrder) return false;
    if (Date.now() < this.cooldownUntil) return false;
    if (this.playTimeAccumulated < PLAY_TIME_THRESHOLD) return false;
    return true;
  }

  // ── Order Generation ───────────────────────────────────────

  /** Generate a random timed order appropriate for the player's level. */
  generateOrder(): TimedOrderDef {
    const difficulty = this.pickDifficulty();
    const config = DIFFICULTY_CONFIG[difficulty];

    const availableChains = MERGE_CHAINS.filter(
      (c) => c.unlockedAtLevel <= this.playerLevel
    );

    const itemCount = randInt(config.itemCount[0], config.itemCount[1]);
    const items: TimedOrderItem[] = [];

    for (let i = 0; i < itemCount; i++) {
      const chain = pickRandom(availableChains);
      const maxChainTier = chain.items[chain.items.length - 1].tier;

      // Clamp tier range to what the chain actually supports
      const minTier = Math.max(config.tierRange[0], 1);
      const maxTier = Math.min(config.tierRange[1], maxChainTier);

      // If the chain can't support even the minimum tier, skip this iteration
      // and try again (pick a different chain)
      if (minTier > maxTier) {
        // Re-pick from chains that support the tier range
        const viable = availableChains.filter(
          (c) => c.items[c.items.length - 1].tier >= config.tierRange[0]
        );
        if (viable.length === 0) {
          // Fallback: use any chain at its max tier
          const fallback = pickRandom(availableChains);
          items.push({
            chainId: fallback.id,
            tier: fallback.items[fallback.items.length - 1].tier,
            quantity: 1,
          });
          continue;
        }
        const viableChain = pickRandom(viable);
        const vMax = viableChain.items[viableChain.items.length - 1].tier;
        const vMin = Math.max(config.tierRange[0], 1);
        const vTier = randInt(vMin, Math.min(config.tierRange[1], vMax));
        items.push({
          chainId: viableChain.id,
          tier: vTier,
          quantity: difficulty === 'quick' ? randInt(1, 2) : 1,
        });
        continue;
      }

      const tier = randInt(minTier, maxTier);
      items.push({
        chainId: chain.id,
        tier,
        quantity: difficulty === 'quick' ? randInt(1, 2) : 1,
      });
    }

    const coinAmount = randInt(config.coinRange[0], config.coinRange[1]);
    const rewards: TimedOrderReward[] = [
      { type: 'coins', amount: coinAmount },
      { type: 'gems', amount: config.gems },
    ];

    const availableCharacters = CHARACTERS.filter(
      (c) => c.unlockLevel <= this.playerLevel
    );
    const character = pickRandom(availableCharacters);
    const flavorText = pickRandom(TIMED_TEXTS[difficulty]);

    timedOrderIdCounter++;
    const id = `timed_${Date.now()}_${timedOrderIdCounter}`;

    return {
      id,
      characterId: character.id,
      flavorText,
      items,
      rewards,
      difficulty: difficulty as 'quick' | 'sprint' | 'marathon',
      timeLimitMs: config.timeLimitMs,
    };
  }

  /** Pick a difficulty tier based on player level. */
  private pickDifficulty(): string {
    const options: string[] = [];

    // Level 1-3: only Quick
    options.push('quick');

    // Level 4-7: Quick + Sprint
    if (this.playerLevel >= 4) {
      options.push('sprint');
    }

    // Level 8+: all three
    if (this.playerLevel >= 8) {
      options.push('marathon');
    }

    return pickRandom(options);
  }

  // ── Accept / Decline ───────────────────────────────────────

  /** Player accepts the offered timed order. */
  acceptOrder(def: TimedOrderDef): void {
    this.activeOrder = {
      def,
      progress: def.items.map(() => 0),
      startTime: Date.now(),
      completed: false,
      expired: false,
    };
    this.playTimeAccumulated = 0;
  }

  /** Player declines the offered timed order. */
  declineOrder(): void {
    this.cooldownUntil = Date.now() + COOLDOWN_AFTER_DECLINE;
    this.playTimeAccumulated = 0;
  }

  // ── Fulfillment ────────────────────────────────────────────

  /**
   * Check if a board item matches any unfulfilled slot in the active order.
   * Returns the slot index if found, or null.
   */
  findMatch(chainId: string, tier: number): number | null {
    if (!this.activeOrder || this.activeOrder.completed || this.activeOrder.expired) {
      return null;
    }

    for (let si = 0; si < this.activeOrder.def.items.length; si++) {
      const req = this.activeOrder.def.items[si];
      if (
        req.chainId === chainId &&
        req.tier === tier &&
        this.activeOrder.progress[si] < req.quantity
      ) {
        return si;
      }
    }
    return null;
  }

  /**
   * Fulfill one unit of the requirement at the given slot index.
   * Returns true if the entire timed order is now complete.
   */
  fulfillItem(slotIdx: number): boolean {
    if (!this.activeOrder || this.activeOrder.completed || this.activeOrder.expired) {
      return false;
    }

    if (slotIdx < 0 || slotIdx >= this.activeOrder.def.items.length) {
      return false;
    }

    const req = this.activeOrder.def.items[slotIdx];
    if (this.activeOrder.progress[slotIdx] >= req.quantity) {
      return false;
    }

    this.activeOrder.progress[slotIdx]++;

    const isComplete = this.activeOrder.def.items.every(
      (item, i) => this.activeOrder!.progress[i] >= item.quantity
    );

    if (isComplete) {
      this.activeOrder.completed = true;
      return true;
    }

    return false;
  }

  /**
   * Claim the rewards for a completed timed order.
   * Returns the reward list, or null if the order is not complete.
   */
  claimRewards(): TimedOrderReward[] | null {
    if (!this.activeOrder || !this.activeOrder.completed) {
      return null;
    }

    const rewards = this.activeOrder.def.rewards;
    this.totalCompleted++;
    this.activeOrder = null;
    this.cooldownUntil = Date.now() + COOLDOWN_AFTER_COMPLETE;

    return rewards;
  }

  // ── Expiry ─────────────────────────────────────────────────

  /**
   * Check whether the active order has expired.
   * Marks it as expired and clears it. Returns true if it just expired.
   */
  checkExpiry(): boolean {
    if (!this.activeOrder || this.activeOrder.completed || this.activeOrder.expired) {
      return false;
    }

    const elapsed = Date.now() - this.activeOrder.startTime;
    if (elapsed >= this.activeOrder.def.timeLimitMs) {
      this.activeOrder.expired = true;
      this.activeOrder = null;
      this.cooldownUntil = Date.now() + COOLDOWN_AFTER_EXPIRY;
      return true;
    }

    return false;
  }

  /** Get the remaining time in milliseconds for the active order. Returns 0 if none. */
  getRemainingTime(): number {
    if (!this.activeOrder || this.activeOrder.completed || this.activeOrder.expired) {
      return 0;
    }

    const elapsed = Date.now() - this.activeOrder.startTime;
    const remaining = this.activeOrder.def.timeLimitMs - elapsed;
    return Math.max(0, remaining);
  }

  // ── Accessors ──────────────────────────────────────────────

  getActiveOrder(): ActiveTimedOrder | null {
    return this.activeOrder;
  }

  getTotalCompleted(): number {
    return this.totalCompleted;
  }

  // ── Persistence ────────────────────────────────────────────

  getSaveData(): TimedOrderSaveData {
    return {
      activeOrder: this.activeOrder
        ? {
            def: this.activeOrder.def,
            progress: [...this.activeOrder.progress],
            startTime: this.activeOrder.startTime,
            completed: this.activeOrder.completed,
            expired: this.activeOrder.expired,
          }
        : null,
      cooldownUntil: this.cooldownUntil,
      totalCompleted: this.totalCompleted,
    };
  }
}

/*
 * ── Integration Guide for GameScene ─────────────────────────────
 *
 * 1. CREATE in GameScene.create():
 *
 *    this.timedOrderSystem = new TimedOrderSystem(playerLevel);
 *    this.timedOrderSystem.initialize(savedData?.timedOrders);
 *
 * 2. TICK -- call in update() or on a 1-second timer:
 *
 *    this.timedOrderSystem.tick();
 *
 * 3. OFFER CHECK -- every 30 seconds (use a Phaser timer event):
 *
 *    this.time.addEvent({
 *      delay: 30000,
 *      loop: true,
 *      callback: () => {
 *        if (this.timedOrderSystem.shouldOfferOrder()) {
 *          const def = this.timedOrderSystem.generateOrder();
 *          // Show offer popup in UIScene with def.flavorText, items, rewards, timer
 *        }
 *      },
 *    });
 *
 * 4. ACCEPT / DECLINE -- from the offer popup:
 *
 *    // On accept:
 *    this.timedOrderSystem.acceptOrder(def);
 *    // Show timer UI in UIScene
 *
 *    // On decline:
 *    this.timedOrderSystem.declineOrder();
 *
 * 5. EXPIRY CHECK -- every second while an order is active:
 *
 *    this.time.addEvent({
 *      delay: 1000,
 *      loop: true,
 *      callback: () => {
 *        if (this.timedOrderSystem.checkExpiry()) {
 *          // Show "Time's up!" feedback in UIScene, hide timer
 *        }
 *        // Update timer display: this.timedOrderSystem.getRemainingTime()
 *      },
 *    });
 *
 * 6. ITEM FULFILLMENT -- when an item is dropped on the timed order zone:
 *
 *    const slotIdx = this.timedOrderSystem.findMatch(chainId, tier);
 *    if (slotIdx !== null) {
 *      const complete = this.timedOrderSystem.fulfillItem(slotIdx);
 *      // Remove item from board, update timed order UI progress
 *      if (complete) {
 *        const rewards = this.timedOrderSystem.claimRewards();
 *        // Show reward animation, apply rewards (coins, gems, xp)
 *      }
 *    }
 *
 * 7. SAVE -- include in SaveSystem alongside existing order data:
 *
 *    timedOrders: this.timedOrderSystem.getSaveData()
 *
 * 8. UI -- in UIScene, show:
 *    - Countdown timer bar (getRemainingTime() / def.timeLimitMs for %)
 *    - Required items with progress indicators
 *    - Reward preview (coins + gems)
 *    - Character portrait + flavor text
 *    - Pulse/glow animation when time is running low (< 20%)
 */
