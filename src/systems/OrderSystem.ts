import { OrderDef, OrderItem, OrderReward, CHARACTERS, ORDER_POOL } from '../data/orders';
import { getChainItem } from '../data/chains';

export interface ActiveOrder {
  def: OrderDef;
  /** Tracks how many of each required item have been fulfilled */
  progress: number[];
  completed: boolean;
}

export class OrderSystem {
  private activeOrders: ActiveOrder[] = [];
  private completedIds: Set<string> = new Set();
  private maxActive = 3;
  private playerLevel: number;
  public coins = 0;
  public totalCompleted = 0;

  constructor(level: number) {
    this.playerLevel = level;
  }

  initialize(saved?: { active: ActiveOrder[]; completedIds: string[]; coins: number; totalCompleted: number }): void {
    if (saved) {
      this.activeOrders = saved.active;
      this.completedIds = new Set(saved.completedIds);
      this.coins = saved.coins;
      this.totalCompleted = saved.totalCompleted;
    }
    this.fillSlots();
  }

  setLevel(level: number): void {
    this.playerLevel = level;
    this.fillSlots();
  }

  private fillSlots(): void {
    while (this.activeOrders.length < this.maxActive) {
      const available = ORDER_POOL.filter(o =>
        o.unlockLevel <= this.playerLevel &&
        !this.completedIds.has(o.id) &&
        !this.activeOrders.some(a => a.def.id === o.id)
      );

      if (available.length === 0) {
        // Reset completed pool to cycle orders
        this.completedIds.clear();
        const retry = ORDER_POOL.filter(o =>
          o.unlockLevel <= this.playerLevel &&
          !this.activeOrders.some(a => a.def.id === o.id)
        );
        if (retry.length === 0) break;
        const order = retry[Phaser.Math.Between(0, retry.length - 1)];
        this.activeOrders.push({
          def: order,
          progress: order.items.map(() => 0),
          completed: false,
        });
        continue;
      }

      const order = available[Phaser.Math.Between(0, available.length - 1)];
      this.activeOrders.push({
        def: order,
        progress: order.items.map(() => 0),
        completed: false,
      });
    }
  }

  /**
   * Check if a board item can fulfill any active order requirement.
   * Returns the order index and item slot index if a match is found.
   */
  findMatchingOrder(chainId: string, tier: number): { orderIdx: number; slotIdx: number } | null {
    for (let oi = 0; oi < this.activeOrders.length; oi++) {
      const order = this.activeOrders[oi];
      if (order.completed) continue;

      for (let si = 0; si < order.def.items.length; si++) {
        const req = order.def.items[si];
        if (req.chainId === chainId && req.tier === tier && order.progress[si] < req.quantity) {
          return { orderIdx: oi, slotIdx: si };
        }
      }
    }
    return null;
  }

  /**
   * Fulfill one unit of an order requirement.
   * Returns the order if it's now complete.
   */
  fulfillItem(orderIdx: number, slotIdx: number): ActiveOrder | null {
    const order = this.activeOrders[orderIdx];
    if (!order || order.completed) return null;

    order.progress[slotIdx]++;

    // Check if all items fulfilled
    const isComplete = order.def.items.every((req, i) => order.progress[i] >= req.quantity);
    if (isComplete) {
      order.completed = true;
      return order;
    }
    return null;
  }

  /**
   * Claim a completed order — apply rewards and remove from active.
   */
  claimOrder(orderIdx: number): OrderReward[] | null {
    const order = this.activeOrders[orderIdx];
    if (!order || !order.completed) return null;

    const rewards = order.def.rewards;
    for (const r of rewards) {
      if (r.type === 'coins') this.coins += r.amount;
    }

    this.completedIds.add(order.def.id);
    this.totalCompleted++;
    this.activeOrders.splice(orderIdx, 1);
    this.fillSlots();

    return rewards;
  }

  /**
   * Claim a completed order by its definition ID (index-safe for delayed calls).
   */
  claimOrderById(orderId: string): OrderReward[] | null {
    const idx = this.activeOrders.findIndex(o => o.def.id === orderId);
    if (idx === -1) return null;
    return this.claimOrder(idx);
  }

  /**
   * Check which active orders can be fulfilled by items currently on the board.
   * Returns an array of booleans (one per active order) indicating whether
   * at least one unfulfilled slot has a matching item on the board.
   */
  findBoardMatches(boardItems: Map<string, { chainId: string; tier: number }>): boolean[] {
    return this.activeOrders.map(order => {
      if (order.completed) return false;

      for (let si = 0; si < order.def.items.length; si++) {
        const req = order.def.items[si];
        if (order.progress[si] >= req.quantity) continue;

        // Check if any board item matches this requirement
        let found = false;
        boardItems.forEach(item => {
          if (!found && item.chainId === req.chainId && item.tier === req.tier) {
            found = true;
          }
        });
        if (found) return true;
      }
      return false;
    });
  }

  getActiveOrders(): ActiveOrder[] {
    return this.activeOrders;
  }

  getCharacter(characterId: string) {
    return CHARACTERS.find(c => c.id === characterId);
  }

  getSaveData() {
    return {
      active: this.activeOrders.map(o => ({ ...o, progress: [...o.progress] })),
      completedIds: Array.from(this.completedIds),
      coins: this.coins,
      totalCompleted: this.totalCompleted,
    };
  }
}
