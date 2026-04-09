# m3rg3r -- Project Instructions

## What Is This
A premium kawaii merge game (PWA) built as a gift. Inspired by Travel Town / Gossip Harbor. No ads, no energy, no IAP. Targets "best merge game ever" quality.

**Live:** https://merge-game-nine.vercel.app
**Repo:** https://github.com/apappas57/merge-bloom
**Stack:** Phaser 3, TypeScript (strict), Vite 7, vite-plugin-pwa, Vercel
**Total codebase:** ~21,000 lines across 30+ files

## Architecture

```
src/
  main.ts              -- Phaser config, DPR scaling
  scenes/              -- Boot, Preload, Menu, Game, UI, Shop, Collection, Settings, DailyChallenge
  objects/             -- Board, MergeItem, Generator, Mascot, StorageTray, GardenDecoration
  systems/             -- MergeSystem, QuestSystem, OrderSystem, AchievementSystem, HintSystem,
                          SaveSystem, TimedOrderSystem, WeatherSystem, EventSystem, ShareSystem
  data/                -- chains.ts, quests.ts, orders.ts, achievements.ts, lore.ts, dailyChallenges.ts
  utils/               -- constants.ts, EmojiRenderer.ts (8K lines), CharacterRenderer.ts, SoundManager.ts
```

## Key Design Decisions
- **DPR rendering**: Game runs at `innerWidth * DPR` x `innerHeight * DPR` with `Phaser.Scale.FIT`
- **Canvas-rendered sprites**: Items drawn programmatically via EmojiRenderer.ts (NO emoji text, all canvas 2D paths)
- **Puffy 3D plushie style**: Every item is a round squishy character with Molang-style eyes, rosy cheeks, and item-specific accessory. Uses `drawPlushieBody`, `drawPlushieEyes`, `drawPlushieMouth`, `drawPlushieBlush` shared helpers.
- **Character system**: 10 named characters with personality-specific dialogue (130 lines across greetings, completions, idles)
- **Generator merging**: 5 tiers per chain, weighted drop tables, hold-to-drag UX
- **Save system**: localStorage v8 with migration chain, debounced auto-save (max 1/sec). Timed orders save separately.
- **Orders**: Travel Town-style character orders drive progression (primary loop)
- **Ambient music**: Synthesized lo-fi garden music via Web Audio (4 time-of-day moods)
- **Events**: Date-based mini-events (weekends, birthdays, seasonal) with XP/coin/merge multipliers
- **Static items**: No idle animations on board items (breathing/glow/shimmer all disabled per user feedback)

## Game Content
- 12 merge chains, 79 items (all puffy 3D plushie style), 12 generators (5 tiers each)
- 10 characters with 130 dialogue lines, 59 orders + timed bonus orders
- 50 quests, 36 achievements, 20 daily challenges, 20 story beats
- 20+ mini-events (weekend, birthday, seasonal, special)
- 4 ambient music moods, 5 weather particle types (currently disabled)
- Garden decoration mode, share/screenshot system, login streaks

## Color Palette
- Background: warm golden-hour pastels (time-of-day shifting)
- Board: `#FFF5EE` (soft cream)
- Accents: `#EC407A` (rose), `#F48FB1` (pink), `#F5D280` (warm gold)
- Text: `#880E4F` (dark), `#C2185B` (mid)

## Commands
```bash
npm run dev      # Vite dev server
npm run build    # tsc + vite build
npm run lint     # tsc --noEmit
npm run preview  # Preview production build
```

## Deploy
- Vercel auto-deploys from `main` branch
- PWA with skipWaiting + clientsClaim
- Pre-deploy: `npx tsc --noEmit && npm run build`

## Custom Skills
- `/game-deploy` -- build, test, commit, push pipeline
- `/game-chain` -- add a complete merge chain across all files
- `/game-audit` -- 9-check codebase health validation
- `/game-asset` -- create/update game sprites and visual assets
- `/game-ux` -- run UX review checklist against best practices
- `/game-balance` -- check game balance (drop tables, XP curves, order difficulty)

## Systems Reference

| System | File | Key Info |
|--------|------|----------|
| Sprites | EmojiRenderer.ts (8K) | 71 plushie functions + 4 shared helpers + old icons |
| Game loop | GameScene.ts (3K) | Board, merging, orders, popups, all integrations |
| UI | UIScene.ts | Order cards, top bar, event banner, timed order timer |
| Merge | MergeSystem.ts | Chain particles, freeze-frame, screen shake, combo |
| Orders | OrderSystem.ts | 3 active slots, character-driven, board matching |
| Timed orders | TimedOrderSystem.ts | Quick/sprint/marathon, countdown, cooldowns |
| Events | EventSystem.ts | Weekends, birthdays, seasonal, special, multipliers |
| Weather | WeatherSystem.ts | Seasonal particles (currently disabled) |
| Sound | SoundManager.ts | SFX + ambient music (4 moods, Web Audio synthesis) |
| Share | ShareSystem.ts | Photo mode, canvas capture, Web Share API |
| Save | SaveSystem.ts | v8, localStorage, migration chain, login streaks |

## Rules
- NEVER use emoji `ctx.fillText()` for game sprites -- always canvas 2D paths
- All plushie items use `r = size * 0.35` for consistent sizing
- All items must read clearly at 40px AND look great at 168px
- No idle animations on board items (disabled per motion sickness feedback)
- Generator spawns use proximity-first BFS, not random placement
- Characters have distinct personalities -- match dialogue to their voice
- Sound effects use Web Audio synthesis, no external audio files
- Save migrations must be backwards-compatible (never lose player progress)
- Debounce saves to max 1/second (PERF)
- Test on iPhone (PWA mode) before considering a feature complete
