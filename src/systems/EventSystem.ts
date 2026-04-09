// ============================================================================
// EventSystem.ts -- Date-based mini-events that make the game feel alive
// ============================================================================

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'weekend' | 'birthday' | 'seasonal' | 'special';
  xpMultiplier: number;
  coinMultiplier: number;
  mergeXpMultiplier: number;
  featuredChain?: string;
  featuredChainBonus?: number;
  featuredCharacter?: string;
  bannerColor: number;
  bannerTextColor: string;
}

// ---------------------------------------------------------------------------
// Birthday config: character -> date (month, day) + primary chain
// ---------------------------------------------------------------------------
interface BirthdayEntry {
  characterId: string;
  characterName: string;
  emoji: string;
  month: number; // 1-indexed
  day: number;
  chainId: string;
  chainName: string;
}

const BIRTHDAYS: BirthdayEntry[] = [
  { characterId: 'rosie', characterName: 'Rosie', emoji: '\uD83D\uDC69\u200D\uD83C\uDF3E', month: 3, day: 21, chainId: 'flower', chainName: 'Garden Flowers' },
  { characterId: 'lyra', characterName: 'Lyra', emoji: '\uD83E\uDDDA', month: 6, day: 21, chainId: 'butterfly', chainName: 'Flutter Friends' },
  { characterId: 'koji', characterName: 'Koji', emoji: '\uD83E\uDDD1\u200D\uD83C\uDF73', month: 9, day: 15, chainId: 'fruit', chainName: 'Fruit Garden' },
  { characterId: 'mizu', characterName: 'Mizu', emoji: '\uD83E\uDDDC\u200D\u2640\uFE0F', month: 7, day: 7, chainId: 'shell', chainName: 'Ocean Dreams' },
  { characterId: 'nyx', characterName: 'Nyx', emoji: '\uD83E\uDDD9\u200D\u2640\uFE0F', month: 10, day: 31, chainId: 'cosmic', chainName: 'Cosmic Voyage' },
  { characterId: 'mochi', characterName: 'Mochi', emoji: '\uD83D\uDC3F\uFE0F', month: 4, day: 1, chainId: 'sweet', chainName: 'Sweet Treats' },
  { characterId: 'suki', characterName: 'Suki', emoji: '\uD83E\uDD8B', month: 5, day: 5, chainId: 'love', chainName: 'Love Letters' },
  { characterId: 'ren', characterName: 'Ren', emoji: '\uD83C\uDF3F', month: 11, day: 15, chainId: 'nature', chainName: 'Enchanted Forest' },
  { characterId: 'kira', characterName: 'Kira', emoji: '\u2B50', month: 1, day: 1, chainId: 'star', chainName: 'Starlight' },
  { characterId: 'vivi', characterName: 'Vivi', emoji: '\u2615', month: 2, day: 14, chainId: 'cafe', chainName: 'Cozy Cafe' },
];

// ---------------------------------------------------------------------------
// Seasonal events (Southern Hemisphere / Melbourne)
// Each runs for 7 days starting on the given date
// ---------------------------------------------------------------------------
interface SeasonalDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  startMonth: number;
  startDay: number;
  durationDays: number;
  featuredChain: string;
  featuredChainBonus: number;
  bannerColor: number;
  bannerTextColor: string;
}

const SEASONAL_EVENTS: SeasonalDef[] = [
  {
    id: 'spring-blossom',
    name: 'Spring Blossom Festival',
    description: 'Flowers are blooming! Garden chain 2x bonus, all rewards 1.5x!',
    icon: '\uD83C\uDF38',
    startMonth: 9, startDay: 22, durationDays: 7,
    featuredChain: 'flower', featuredChainBonus: 2.0,
    bannerColor: 0xFFB7C5, bannerTextColor: '#880E4F',
  },
  {
    id: 'summer-splash',
    name: 'Summer Splash',
    description: 'Dive into summer! Ocean chain 2x bonus, all rewards 1.5x!',
    icon: '\uD83C\uDF0A',
    startMonth: 12, startDay: 21, durationDays: 7,
    featuredChain: 'shell', featuredChainBonus: 2.0,
    bannerColor: 0x81D4FA, bannerTextColor: '#01579B',
  },
  {
    id: 'autumn-harvest',
    name: 'Autumn Harvest',
    description: 'Cozy harvest season! Nature chain 2x bonus, all rewards 1.5x!',
    icon: '\uD83C\uDF42',
    startMonth: 3, startDay: 21, durationDays: 7,
    featuredChain: 'nature', featuredChainBonus: 2.0,
    bannerColor: 0xFFCC80, bannerTextColor: '#BF360C',
  },
  {
    id: 'winter-wonderland',
    name: 'Winter Wonderland',
    description: 'Frosty fun! Crystal chain 2x bonus, all rewards 1.5x!',
    icon: '\u2744\uFE0F',
    startMonth: 6, startDay: 21, durationDays: 7,
    featuredChain: 'crystal', featuredChainBonus: 2.0,
    bannerColor: 0xB3E5FC, bannerTextColor: '#0D47A1',
  },
];

// ---------------------------------------------------------------------------
// Weekend events (rotate weekly)
// ---------------------------------------------------------------------------
const WEEKEND_EVENTS: GameEvent[] = [
  {
    id: 'weekend-bloom',
    name: 'Weekend Bloom',
    description: 'Double XP from all merges!',
    icon: '\uD83C\uDF38',
    type: 'weekend',
    xpMultiplier: 1.0,
    coinMultiplier: 1.0,
    mergeXpMultiplier: 2.0,
    bannerColor: 0xFFB7C5,
    bannerTextColor: '#880E4F',
  },
  {
    id: 'weekend-harvest',
    name: 'Golden Harvest',
    description: 'Double coins from orders!',
    icon: '\uD83C\uDF3E',
    type: 'weekend',
    xpMultiplier: 1.0,
    coinMultiplier: 2.0,
    mergeXpMultiplier: 1.0,
    bannerColor: 0xFFE082,
    bannerTextColor: '#5D4037',
  },
  {
    id: 'weekend-sparkle',
    name: 'Sparkle Surge',
    description: 'Triple XP from tier 5+ merges!',
    icon: '\u2728',
    type: 'weekend',
    xpMultiplier: 1.0,
    coinMultiplier: 1.0,
    mergeXpMultiplier: 3.0,
    bannerColor: 0xD4A5FF,
    bannerTextColor: '#4A148C',
  },
];

// ===========================================================================
// EventSystem
// ===========================================================================
export class EventSystem {
  private currentEvents: GameEvent[] = [];

  constructor() {
    this.refreshEvents();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Re-evaluate which events are active right now. */
  refreshEvents(): GameEvent[] {
    const now = new Date();
    const events: GameEvent[] = [];

    this.checkWeekendEvents(now, events);
    this.checkBirthdayEvents(now, events);
    this.checkSeasonalEvents(now, events);
    this.checkSpecialEvents(now, events);

    this.currentEvents = events;
    return events;
  }

  getActiveEvents(): GameEvent[] {
    return this.currentEvents;
  }

  hasActiveEvent(): boolean {
    return this.currentEvents.length > 0;
  }

  /** Combined XP multiplier across all active events. */
  getXpMultiplier(): number {
    return this.currentEvents.reduce((m, e) => m * e.xpMultiplier, 1.0);
  }

  /** Combined coin multiplier across all active events. */
  getCoinMultiplier(): number {
    return this.currentEvents.reduce((m, e) => m * e.coinMultiplier, 1.0);
  }

  /** Combined merge-XP multiplier across all active events. */
  getMergeXpMultiplier(): number {
    return this.currentEvents.reduce((m, e) => m * e.mergeXpMultiplier, 1.0);
  }

  /** Chain-specific bonus from featured-chain events. Returns 1.0 if none. */
  getChainBonus(chainId: string): number {
    return this.currentEvents.reduce((m, e) => {
      if (e.featuredChain === chainId && e.featuredChainBonus) {
        return m * e.featuredChainBonus;
      }
      return m;
    }, 1.0);
  }

  /** Highest-priority active event for banner display. */
  getPrimaryEvent(): GameEvent | null {
    if (this.currentEvents.length === 0) return null;
    const priority: GameEvent['type'][] = ['seasonal', 'birthday', 'special', 'weekend'];
    for (const type of priority) {
      const found = this.currentEvents.find((ev) => ev.type === type);
      if (found) return found;
    }
    return this.currentEvents[0];
  }

  /** Human-friendly banner string combining all active event names. */
  getBannerText(): string {
    if (this.currentEvents.length === 0) return '';
    if (this.currentEvents.length === 1) {
      return `${this.currentEvents[0].icon} ${this.currentEvents[0].name}`;
    }
    return this.currentEvents.map((e) => `${e.icon} ${e.name}`).join(' + ');
  }

  // -------------------------------------------------------------------------
  // Weekend events -- rotate based on ISO week number
  // -------------------------------------------------------------------------

  private checkWeekendEvents(now: Date, events: GameEvent[]): void {
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) return;

    const weekNum = this.getWeekNumber(now);
    const event = WEEKEND_EVENTS[weekNum % WEEKEND_EVENTS.length];
    events.push(event);
  }

  private getWeekNumber(date: Date): number {
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - yearStart.getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  }

  // -------------------------------------------------------------------------
  // Character birthdays -- 1 day each, chain gets 1.5x, orders give 3x coins
  // -------------------------------------------------------------------------

  private checkBirthdayEvents(now: Date, events: GameEvent[]): void {
    const month = now.getMonth() + 1; // 1-indexed
    const day = now.getDate();

    for (const b of BIRTHDAYS) {
      if (b.month === month && b.day === day) {
        events.push({
          id: `birthday-${b.characterId}`,
          name: `${b.characterName}'s Birthday!`,
          description: `Happy birthday ${b.characterName}! ${b.chainName} chain gets 1.5x bonus and ${b.characterName}'s orders pay 3x coins!`,
          icon: '\uD83C\uDF82',
          type: 'birthday',
          xpMultiplier: 1.0,
          coinMultiplier: 3.0,
          mergeXpMultiplier: 1.0,
          featuredChain: b.chainId,
          featuredChainBonus: 1.5,
          featuredCharacter: b.characterId,
          bannerColor: 0xF8BBD0,
          bannerTextColor: '#AD1457',
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Seasonal events -- 7-day windows, Southern Hemisphere (Melbourne)
  // -------------------------------------------------------------------------

  private checkSeasonalEvents(now: Date, events: GameEvent[]): void {
    for (const s of SEASONAL_EVENTS) {
      if (this.isWithinDateWindow(now, s.startMonth, s.startDay, s.durationDays)) {
        events.push({
          id: s.id,
          name: s.name,
          description: s.description,
          icon: s.icon,
          type: 'seasonal',
          xpMultiplier: 1.5,
          coinMultiplier: 1.5,
          mergeXpMultiplier: 1.5,
          featuredChain: s.featuredChain,
          featuredChainBonus: s.featuredChainBonus,
          bannerColor: s.bannerColor,
          bannerTextColor: s.bannerTextColor,
        });
      }
    }
  }

  /**
   * Check if `now` falls within a window of `durationDays` starting at
   * the given month/day in the same year. Handles year-boundary wrap
   * (e.g. Summer Splash starting Dec 21 running into late December).
   */
  private isWithinDateWindow(
    now: Date,
    startMonth: number,
    startDay: number,
    durationDays: number,
  ): boolean {
    const year = now.getFullYear();
    const start = new Date(year, startMonth - 1, startDay);
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Also check previous year's window in case it wraps into January
    const startPrev = new Date(year - 1, startMonth - 1, startDay);
    const endPrev = new Date(startPrev.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const nowMs = now.getTime();
    return (
      (nowMs >= start.getTime() && nowMs < end.getTime()) ||
      (nowMs >= startPrev.getTime() && nowMs < endPrev.getTime())
    );
  }

  // -------------------------------------------------------------------------
  // Special events
  // -------------------------------------------------------------------------

  private checkSpecialEvents(now: Date, events: GameEvent[]): void {
    this.checkMegaMergeMonday(now, events);
    this.checkFlowerPowerFriday(now, events);
  }

  /** Mega Merge Monday: first Monday of each month, 3x coins */
  private checkMegaMergeMonday(now: Date, events: GameEvent[]): void {
    if (now.getDay() !== 1) return; // Must be Monday
    if (now.getDate() > 7) return; // Must be in the first 7 days

    events.push({
      id: 'mega-merge-monday',
      name: 'Mega Merge Monday',
      description: 'First Monday of the month! All coins tripled!',
      icon: '\uD83D\uDCA5',
      type: 'special',
      xpMultiplier: 1.0,
      coinMultiplier: 3.0,
      mergeXpMultiplier: 1.0,
      bannerColor: 0xFFD54F,
      bannerTextColor: '#E65100',
    });
  }

  /** Flower Power Friday: every Friday, flower chain 2x bonus */
  private checkFlowerPowerFriday(now: Date, events: GameEvent[]): void {
    if (now.getDay() !== 5) return; // Must be Friday

    events.push({
      id: 'flower-power-friday',
      name: 'Flower Power Friday',
      description: 'Fridays are for flowers! Garden chain gets 2x bonus!',
      icon: '\uD83C\uDF3B',
      type: 'special',
      xpMultiplier: 1.0,
      coinMultiplier: 1.0,
      mergeXpMultiplier: 1.0,
      featuredChain: 'flower',
      featuredChainBonus: 2.0,
      bannerColor: 0xC8E6C9,
      bannerTextColor: '#1B5E20',
    });
  }
}

// === EVENT SYSTEM INTEGRATION ===
// GameScene.create(): this.eventSystem = new EventSystem();
// Refresh every 60s: this.time.addEvent({ delay: 60000, loop: true, callback: () => this.eventSystem.refreshEvents() });
// Apply multipliers:
//   XP gain: xp * this.eventSystem.getXpMultiplier()
//   Coin rewards: coins * this.eventSystem.getCoinMultiplier()
//   Merge XP: mergeXp * this.eventSystem.getMergeXpMultiplier()
//   Gen drops: check this.eventSystem.getChainBonus(chainId)
// Show banner: if (this.eventSystem.hasActiveEvent()) show banner with getBannerText() and getPrimaryEvent().bannerColor
