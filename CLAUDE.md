# Merge Bloom — Project Instructions

## What Is This
A cozy kawaii merge game built as a gift for Alex's girlfriend. Inspired by Travel Town / Mystery Town. No ads, no energy system, no IAP — unlimited gems and instant generators.

**Live URL:** https://merge-game-nine.vercel.app
**Repo:** https://github.com/apappas57/merge-bloom

## Tech Stack
- **Phaser 3** (game engine)
- **TypeScript** (strict mode)
- **Vite 7** (build tool)
- **vite-plugin-pwa** (service worker, offline play, Add to Home Screen)
- **Google Fonts**: Fredoka (headings), Nunito (body)
- **No React** — pure Phaser scenes

## Architecture

```
src/
  main.ts              — Phaser config, scene registration, DPR scaling
  scenes/              — 8 Phaser scenes (Boot, Preload, Menu, Game, UI, Shop, Collection, Settings)
  objects/             — Board, MergeItem, Generator, Mascot, StorageTray
  systems/             — MergeSystem, QuestSystem, OrderSystem, AchievementSystem, HintSystem, SaveSystem
  data/                — chains.ts, quests.ts, orders.ts, achievements.ts, lore.ts
  utils/               — constants.ts (DPR/colors/sizes), EmojiRenderer.ts, CharacterRenderer.ts
```

## Key Design Decisions
- **DPR rendering**: Game runs at `window.innerWidth * DPR` x `window.innerHeight * DPR` with `Phaser.Scale.FIT` for retina sharpness
- **Emoji-based sprites**: Items rendered as emoji inside gradient-filled kawaii cards via canvas 2D (EmojiRenderer.ts). No external sprite sheets.
- **Character portraits**: Custom canvas-drawn kawaii faces (CharacterRenderer.ts) — round body, big eyes, blush, unique colors per character
- **Save system**: localStorage with version migration (currently v3). Auto-saves every 30s + on merge + on visibility change.
- **Orders replace quests**: The order system (Travel Town style) is the primary progression driver. Characters request specific items for coin rewards.

## Color Palette (Kawaii Pink)
- Background: `#FFF0F5` (lavender blush)
- Board: `#FCE4EC` (soft pink)
- Cells: `#FFF0F5` with `#F8BBD0` borders
- Accents: `#EC407A` (rose), `#F48FB1` (pink)
- Text: `#6D3A5B` (primary), `#B07A9E` (secondary)

## Content
- 9 merge chains, 59 items total
- 22 orders across 10 characters
- 30 quests, 16 achievements
- Lore text for every item

## Commands
```bash
npm run dev      # Vite dev server (hot reload)
npm run build    # tsc + vite build
npm run preview  # Preview production build
```

## Deployment
- Vercel auto-deploys from GitHub pushes to `main`
- PWA with skipWaiting + clientsClaim for immediate updates
- Clear localStorage to reset game progress

## Key Files
- `GAME_DESIGN.md` — original game design document
- `IMPROVEMENT_PLAN.md` — phased improvement roadmap (Sanrio aesthetic, competitive research)
- `MYSTERY_TOWN_ANALYSIS.md` — Travel Town / Mystery Town deep dive with orders system spec
- `VALIDATION_REPORT.md` — full codebase validation results
