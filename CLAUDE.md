# m3rg3r -- Project Instructions

## What Is This
A premium kawaii merge game (PWA) built as a gift. Inspired by Travel Town / Gossip Harbor. No ads, no energy, no IAP. Targets "best merge game ever" quality.

**Live:** https://merge-game-nine.vercel.app
**Repo:** https://github.com/apappas57/merge-bloom
**Stack:** Phaser 3, TypeScript (strict), Vite 7, vite-plugin-pwa, Vercel

## Architecture

```
src/
  main.ts              -- Phaser config, DPR scaling
  scenes/              -- Boot, Preload, Menu, Game, UI, Shop, Collection, Settings, DailyChallenge
  objects/             -- Board, MergeItem, Generator, Mascot, StorageTray, GardenDecoration
  systems/             -- MergeSystem, QuestSystem, OrderSystem, AchievementSystem, HintSystem, SaveSystem
  data/                -- chains.ts, quests.ts, orders.ts, achievements.ts, lore.ts, dailyChallenges.ts
  utils/               -- constants.ts, EmojiRenderer.ts, CharacterRenderer.ts, SoundManager.ts
```

## Key Design Decisions
- **DPR rendering**: Game runs at `innerWidth * DPR` x `innerHeight * DPR` with `Phaser.Scale.FIT`
- **Canvas-rendered sprites**: Items drawn programmatically via EmojiRenderer.ts (NO emoji text, all canvas 2D paths)
- **Character system**: 10 named characters (Rosie, Lyra, Koji, Mizu, Nyx, Mochi, Suki, Ren, Kira, Vivi) with unique personalities and dialogue
- **Generator merging**: 5 tiers per chain, weighted drop tables, hold-to-drag UX
- **Save system**: localStorage v4 with migration chain, auto-save every 30s
- **Orders**: Travel Town-style character orders drive progression (primary loop)

## Game Content
- 12 merge chains, 79 items, 12 generators (5 tiers each = 60 variants)
- 10 characters, 29 orders, 30 quests, 16 achievements
- Daily challenges, garden decoration mode, XP/leveling
- Y2K kawaii aesthetic with holographic effects

## Color Palette
- Background: `#FFF0F5` (lavender blush)
- Board: `#FCE4EC` (soft pink)
- Accents: `#EC407A` (rose), `#F48FB1` (pink)
- Y2K: `#E8A4C8` (chrome pink), `#87CEEB` (holo blue), `#D4A5FF` (jelly purple)
- Text: `#6D3A5B` (primary), `#B07A9E` (secondary)

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

## Research Docs
- `GAME_DESIGN.md` -- original design document
- `DESIGN_SYSTEM.md` -- Y2K kawaii visual system (37KB)
- `IMPROVEMENT_PLAN.md` -- phased roadmap
- `GENERATOR_MERGING_SPEC.md` -- competitive research + gen merge spec
- `Y2K_AESTHETIC_REFERENCE.md` -- Y2K theme guide with Phaser code
- `ART_DIRECTION.md` -- top merge game art analysis + premium rendering technique
- `BEST_MERGE_GAME_RESEARCH.md` -- 28-feature strategic roadmap
- `MYSTERY_TOWN_ANALYSIS.md` -- Travel Town deep dive

## Rules
- NEVER use emoji `ctx.fillText()` for game sprites -- always canvas 2D paths
- All items must read clearly at 40px AND look great at 168px
- Test on iPhone (PWA mode) before considering a feature complete
- Generator spawns use proximity-first BFS, not random placement
- Characters have distinct personalities -- match dialogue to their voice
- Sound effects use Web Audio synthesis, no external audio files
- Save migrations must be backwards-compatible (never lose player progress)
