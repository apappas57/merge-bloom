# m3rg3r UX Improvement Plan

**Date:** 2026-04-01
**Based on:** Player pain point research across Travel Town, Merge Mansion, Gossip Harbor, EverMerge, and Love & Pies. Reddit/App Store review analysis. Game feel and "juice" best practices. Accessibility standards (WCAG 2.2). Full codebase audit of m3rg3r's current state.

**Current state summary:** m3rg3r has solid foundations -- merge-2 system, 12 chains, orders, generators with 5-tier merging, hint system, storage tray, sound (oscillator-based), kawaii aesthetic, daily challenges, achievements. No energy, no ads, unlimited gems. The game works. Now it needs to FEEL great.

---

## PRIORITY 1: Fix What Is Annoying NOW

These are friction points that hurt the experience every session. Fix these first.

---

### P1.1 -- Accidental Merges With No Undo

**The problem:** Players accidentally merge the wrong items (fat-finger drag on a small 6x8 board) and there is no way to reverse it. This is the #1 UX complaint across ALL merge games. The undo system is designed in IMPROVEMENT_PLAN.md but not implemented. Every wasted merge feels bad.

**Current behavior:** Once two items merge, the result is permanent. The only recourse is to keep merging forward, which may waste items needed for an active order.

**Exact implementation:**

1. Add an `UndoStack` class in `src/systems/UndoSystem.ts`:
   - Stores the last 3 game states as snapshots (items array, generators array, board occupancy)
   - Each snapshot is taken BEFORE a merge executes in `GameScene.executeMerge()`
   - Memory-efficient: only store the delta (changed items), not the full board
   - Snapshots expire after 30 seconds to prevent long-range abuse

2. Add an undo button to the UI:
   - Position: bottom-left corner of the board area, above the storage tray label
   - Icon: curved-left arrow emoji or a custom drawn rounded arrow
   - Size: `s(36)` diameter circle with `0xFFF0F5` fill, `0xF8BBD0` border
   - State: greyed out (alpha 0.3) when stack is empty, full alpha when available
   - Cost: free for the first undo per session, then 10 coins each (coins are abundant, this is a speed bump not a wall)
   - Animation on tap: items reverse-fly from the merged position back to their pre-merge cells over 300ms with `Back.easeOut`

3. Sound: play the merge sound in reverse (descending chime) on undo

4. Mascot reaction: "Oops! Let's try again!" speech bubble

**Why this matters:** Travel Town and Gossip Harbor both have undo. Players expect it. Without it, every drag feels risky instead of playful.

**Files to modify:** `GameScene.ts` (add snapshot before merge), new `UndoSystem.ts`, `UIScene.ts` (add button)

**Effort:** Medium (4-6 hours)

---

### P1.2 -- No Merge Preview (What Will This Become?)

**The problem:** When dragging an item toward a merge target, the player has no idea what the resulting item will be. They have to memorize the chain or check the collection screen. This is especially frustrating for newer chains (tea, shell, cosmic) where the progression is unknown.

**Current behavior:** Dragging an item over a valid merge target highlights the cell green (`CELL_VALID`). That is the only feedback.

**Exact implementation:**

1. When an item is dragged over a valid merge target (same chain, same tier, not max tier):
   - Show a small preview of the NEXT tier item centered above the target cell
   - Preview appears as a semi-transparent (`alpha 0.6`) version of the next-tier item sprite
   - Size: `SIZES.ITEM_SIZE * 0.5` (half the normal item size)
   - Position: `cell.y - SIZES.CELL * 0.7` (floating above the cell)
   - Entry animation: scale from 0 to 1 over 150ms with `Back.easeOut`, gentle bob animation
   - A small upward arrow or "+" icon between the two items

2. Implementation location: `MergeItem.setupDrag()` drag handler
   - On drag move, when hovering a valid merge cell, call `GameScene.showMergePreview(chainId, nextTier, x, y)`
   - On drag leave cell or dragend, call `GameScene.hideMergePreview()`
   - Preview is a single shared game object (not created/destroyed per frame)

3. The preview should also show the item name in small text below: e.g., "Daisy" in `fs(8)` Nunito

**Why this matters:** Merge Mansion has an info button showing the chain. Players of Forbidden Merge specifically requested merge-on-hover preview. This eliminates guesswork and makes every merge feel intentional.

**Files to modify:** `MergeItem.ts` (emit preview event on drag), `GameScene.ts` (add preview display/hide methods)

**Effort:** Low-Medium (2-3 hours)

---

### P1.3 -- Board Full With No Guidance

**The problem:** When the 6x8 board fills up, the player feels stuck. Tapping a generator when the board is full produces a shake animation and the mascot says "Board is full!" but there is no guidance on WHAT to do about it.

**Current behavior:** Generator shakes left-right 3 times. Mascot speech bubble. That is all.

**Exact implementation:**

1. When the board reaches 85% full (41 of 48 cells occupied), trigger a soft warning:
   - Mascot says: "Getting cozy! Try merging some items" (only once per session)
   - Briefly pulse the hint system to highlight a mergeable pair immediately (bypass the 10-second idle timer)

2. When the board is 100% full and a generator is tapped:
   - Instead of just shaking, show a small tooltip near the generator: "Merge items to free space" in a speech-bubble shape
   - Highlight the closest mergeable pair with the hint glow
   - If no pairs exist, highlight the storage tray with a gentle pulse and show: "Store items for later"
   - If storage is also full, highlight the trash zone: "Drag items here to remove"

3. Add a board fullness indicator:
   - Small text below the storage label: "42/48" in `fs(7)` secondary color
   - Only appears when board is above 75% full
   - Color shifts from secondary to soft coral as it approaches full

**Why this matters:** "Limited board space" is the #2 complaint in Travel Town and Merge Mansion reviews. m3rg3r has a generous board and free storage, but players need to be TOLD these options exist when they are panicking about space.

**Files to modify:** `GameScene.ts` (board fullness check), `Generator.ts` (enhanced full-board feedback), `UIScene.ts` (optional fullness counter)

**Effort:** Low (2-3 hours)

---

### P1.4 -- Item Swap Lacks Visual Feedback

**The problem:** When you drag an item onto a non-matching occupied cell, the items swap positions. This is correct behavior (and better than returning to original, which Travel Town does). But the swap happens silently with no visual or audio feedback, so it feels like a bug rather than a feature.

**Current behavior in `GameScene.handleDrop()`:** Items are atomically swapped with `moveToCell()` calls. No sound, no particles, no indication this was intentional.

**Exact implementation:**

1. When a swap occurs (dragged onto occupied cell, not a valid merge):
   - Play a soft "whoosh" sound (a quick 150ms sine sweep from 300Hz to 200Hz) via SoundManager
   - Both items get a brief scale bounce: `1.0 -> 1.1 -> 1.0` over 150ms, `Bounce.easeOut`
   - Show a very subtle swap icon (two curved arrows) at the midpoint between the two cells, fade out over 400ms

2. Add a `swap()` method to `SoundManager`:
   ```
   swap(): void {
     this.playTone(300, 0.08, 'sine', 0.3);
     setTimeout(() => this.playTone(200, 0.06, 'sine', 0.2), 40);
   }
   ```

**Why this matters:** Without feedback, the swap feels accidental. With feedback, it becomes a deliberate board-management tool. Travel Town's item swap is one of its most-praised QOL features, but even their implementation lacks clear feedback.

**Files to modify:** `GameScene.ts` (add feedback in `handleDrop` swap branch), `SoundManager.ts` (add swap sound)

**Effort:** Very Low (30-60 minutes)

---

### P1.5 -- Generator Tap vs Drag Ambiguity

**The problem:** Generators use a 200ms hold threshold to distinguish taps (spawn item) from drags (move generator). This causes two issues:
- Fast players sometimes trigger drags when they meant to tap, because they move their finger slightly during the tap
- The hold delay makes rapid tapping feel sluggish compared to Travel Town's instant spawn

**Current behavior in `Generator.ts`:** `HOLD_THRESHOLD_MS = 200`. A hold timer starts on pointerdown. If the timer fires and the pointer is still on the generator, drag mode begins. If pointerup fires before the timer, it is treated as a tap -- but only if elapsed < 250ms AND moved < `s(10)`.

**Exact implementation:**

1. Reduce `HOLD_THRESHOLD_MS` from 200 to 300ms (counterintuitive, but read on)

2. Change the tap detection to be DISTANCE-based, not time-based:
   - If pointer moves less than `s(8)` total distance from the initial pointerdown position, treat as TAP regardless of hold time up to 300ms
   - If pointer moves more than `s(8)`, immediately enter drag mode (cancel the hold timer)
   - This means quick taps are INSTANT (no 200ms wait) and deliberate drags require actual movement

3. Add visual feedback for drag-mode entry:
   - When drag mode activates, the generator lifts with a small shadow appearing beneath it (a dark ellipse at 0.1 alpha, offset `s(4)` below)
   - Helps players understand they have entered drag mode vs tap mode

**Why this matters:** The 200ms delay is noticeable. Travel Town generators feel instant because they do not have a tap/drag disambiguation problem (generators cannot be moved in Travel Town). Since m3rg3r allows generator dragging, the disambiguation needs to be distance-based, not time-based.

**Files to modify:** `Generator.ts` (refactor `setupInput`)

**Effort:** Low (1-2 hours)

---

### P1.6 -- Sound is Placeholder (Oscillator Beeps)

**The problem:** The SoundManager uses raw Web Audio oscillator tones. These sound like a science experiment, not a kawaii garden game. Every competitor has real audio. This is flagged as the "#1 polish gap" in `BEST_MERGE_GAME_RESEARCH.md`.

**Current behavior:** `playTone()` generates sine waves at calculated frequencies. The merge sound is an ascending pair of sine tones. The generator tap is a "pop" that sounds like a sonar ping.

**Exact implementation:**

1. Source free sounds from Pixabay (royalty-free, no attribution required):
   - Merge: a bright "ding" chime, 0.2s, pitched up per tier
   - Generator tap: soft bubble pop
   - Spawn: gentle "whoosh" or sparkle
   - Order complete: 4-note music box melody
   - Level up: ascending harp gliss
   - Discovery: triple sparkle chime
   - Button press: tiny UI click
   - Error: soft low "bonk"

2. Download as MP3, place in `public/audio/`. Recommended file sizes: under 50KB each for fast PWA caching.

3. Refactor `SoundManager` to use Phaser's audio system instead of raw Web Audio:
   - Load sounds in `PreloadScene` via `this.load.audio('sfx_merge', 'audio/merge.mp3')`
   - Play via `this.sound.play('sfx_merge', { volume: 0.3, rate: 1 + tier * 0.1 })`
   - Use `rate` parameter to pitch sounds up for higher tiers (same effect as current frequency scaling, but with real audio)
   - Keep the Web Audio oscillator as a fallback if audio files fail to load

4. Add background music:
   - A single looping lo-fi ambient track (60-90 seconds, under 500KB MP3)
   - Volume: 0.15 default (very quiet, ambient)
   - Fade in over 3 seconds on game start
   - Pause when app loses focus (`visibilitychange`)
   - Toggle in Settings scene

**Why this matters:** Sound is 50% of game feel. A silent game with oscillator beeps feels like a prototype. Real audio files transform perceived quality instantly.

**Files to modify:** `SoundManager.ts` (refactor), `PreloadScene.ts` (load audio), `SettingsScene.ts` (add music toggle)

**Effort:** Medium (3-4 hours for implementation, plus time sourcing sounds)

---

## PRIORITY 2: Make the Game Feel Significantly More Polished

These improvements elevate m3rg3r from "working game" to "this feels like a real product."

---

### P2.1 -- Long-Press Item Info / Chain Preview

**The problem:** Players cannot see what an item is, what chain it belongs to, or what it becomes next without leaving the game to check the Collection scene. Travel Town shows this on tap. Merge Mansion has a blue info button.

**Exact implementation:**

1. Long-press (400ms hold without moving) on any item or generator triggers an info popup:
   - Popup appears as a rounded card (`s(20)` border radius) centered above the item
   - Card contains:
     - Item emoji at `fs(24)` size
     - Item name in Fredoka Bold `fs(14)`, e.g., "Daisy"
     - Chain name in Nunito `fs(10)` secondary color, e.g., "Flower Chain"
     - A horizontal mini-chain showing: previous tier (greyed) -> THIS tier (highlighted with glow) -> next tier (full color) -> tier after (silhouette)
     - Each item in the mini-chain is `s(20)` wide with the emoji
   - For generators: show the chain it produces, current tier, and the spawn table (what tiers it can produce and their relative weights as a simple bar chart)
   - Popup has a soft shadow and appears with `Back.easeOut` scale animation from 0 to 1

2. Dismiss: tap anywhere, or drag (if the player starts dragging, cancel the info popup and begin the drag)

3. Implementation: add a `holdTimer` to `MergeItem.setupDrag()`, similar to Generator's existing pattern

**Files to modify:** `MergeItem.ts` (add hold detection), `GameScene.ts` (add info popup rendering)

**Effort:** Medium (3-4 hours)

---

### P2.2 -- Session Start Experience

**The problem:** When a player opens the game, they see the board exactly as they left it. There is no welcome-back moment, no summary of what happened while they were away, no immediate goal to pursue. The mascot says a random greeting 1.5 seconds in, but it feels hollow.

**Exact implementation:**

1. On session start (when `loadSave()` completes), show a brief welcome overlay (1.5 seconds, auto-dismiss on tap):
   - Soft overlay (alpha 0.3) with a centered card
   - Card shows:
     - Time since last session: "Welcome back! It's been 4 hours" (or "Good morning!" / "Good evening!" based on time of day)
     - Current active orders summary: "Luna needs a Rose, Mochi needs a Crystal"
     - A "Let's go!" button (pill-shaped, rose pink)
   - The card slides up from the bottom with `Power2` ease
   - Auto-dismisses after 3 seconds or on any tap

2. If the player has been away for 6+ hours:
   - Show a "Your garden missed you!" message from the mascot (waking-up animation: mascot starts asleep, wakes on tap)
   - If any generators have "conceptual" cooldowns done (for future auto-producer feature), show what accumulated

3. The greeting should NEVER block gameplay for more than 2 taps. Respect the player's time.

**Files to modify:** `GameScene.ts` (add welcome overlay after `loadSave`)

**Effort:** Low-Medium (2-3 hours)

---

### P2.3 -- Haptic Feedback (Vibration API)

**The problem:** Every top merge game uses haptics. m3rg3r is a PWA targeting mobile (iPhone specifically for the girlfriend). The Vibration API is available in PWA standalone mode on many devices, and iOS Safari supports it from iOS 16+.

**Exact implementation:**

1. Add a `HapticsManager` utility:
   ```typescript
   export class HapticsManager {
     private enabled = true;

     light() {
       if (!this.enabled) return;
       navigator.vibrate?.(10);  // 10ms light tap
     }

     medium() {
       if (!this.enabled) return;
       navigator.vibrate?.(25);  // 25ms medium feedback
     }

     heavy() {
       if (!this.enabled) return;
       navigator.vibrate?.(50);  // 50ms heavy impact
     }

     success() {
       if (!this.enabled) return;
       navigator.vibrate?.([10, 30, 10]);  // tap-pause-tap pattern
     }
   }
   ```

2. Trigger points:
   - Merge (any tier): `light()`
   - Merge (tier 5+): `medium()`
   - Merge (tier 7+): `heavy()`
   - Generator tap: `light()`
   - Order complete: `success()`
   - Level up: `heavy()` followed by `success()` after 200ms
   - Undo: `light()`
   - Error (board full): `medium()` (single pulse, different feel from success)

3. Settings: add a haptics toggle to SettingsScene

4. iOS note: `navigator.vibrate` is NOT supported on iOS Safari/PWA. For iOS, the best approach is to use the Web Audio API to play a very short (5ms) low-frequency tone that creates a subtle "thump" through the speaker. This is not true haptics but provides tactile-adjacent feedback. If/when Capacitor is added, switch to `Haptics.impact()` from `@capacitor/haptics`.

**Files to modify:** New `HapticsManager.ts`, `GameScene.ts` (add triggers), `SettingsScene.ts` (add toggle)

**Effort:** Low (1-2 hours)

---

### P2.4 -- Merge Combo Counter and Streak

**The problem:** Rapid merging should feel exciting. Currently, each merge is an isolated event. There is no recognition of speed or consecutive merges.

**Exact implementation:**

1. Track consecutive merges within a 3-second window:
   - After a merge completes, start a 3-second decay timer
   - If another merge happens before the timer expires, increment the combo counter
   - Combo counter resets to 0 when the timer expires

2. Visual feedback at combo thresholds:
   - Combo 2: Show "Nice!" floating text in `fs(16)` Fredoka Bold, rose pink, scale-bounce 1.0->1.3->1.0
   - Combo 3: Show "Great!" in `fs(18)`, gold color, more particles
   - Combo 4: Show "Amazing!" in `fs(20)`, with heart particle burst
   - Combo 5+: Show "INCREDIBLE!" in `fs(24)`, rainbow gradient text (cycle through chain particle colors), screen flash (white overlay at alpha 0.15 that fades over 200ms), bonus XP (+50% per combo level)

3. Combo text position: centered on the board, `y = board center - s(40)`, floats upward and fades over 1 second

4. Sound: each combo level adds an additional note to the merge chime (combo 2 = 2 notes, combo 3 = 3 notes, creating an ascending scale)

5. The combo counter appears as a small badge near the top of the board: a circle with the number, pulsing gently

**Files to modify:** `GameScene.ts` (add combo tracking in `executeMerge`), `SoundManager.ts` (add combo chime variants)

**Effort:** Low-Medium (2-3 hours)

---

### P2.5 -- Enhanced Drag Feedback

**The problem:** When dragging an item, the visual feedback is minimal: the item scales up 15% and the target cell highlights. There is no "ghost" at the original position, no trail, and no differentiation between valid merge targets vs. empty cells vs. swap targets.

**Exact implementation:**

1. Ghost at original position:
   - When drag starts, leave a semi-transparent copy (alpha 0.2) of the item at its original cell
   - This helps the player remember where the item came from and provides a visual "anchor"
   - Implementation: create a temporary `Image` at the original position, destroy on dragend

2. Differentiated cell highlights:
   - Valid merge target (same chain, same tier): Mint green (`0xA8E6CF`) with pulsing glow + merge preview (P1.2)
   - Empty cell: Very subtle light blue (`0xE3F2FD`) at alpha 0.3
   - Swap target (occupied, different item): Soft amber (`0xFFF3E0`) with a tiny swap icon
   - Invalid target (locked cell, generator): Soft coral (`0xFFCDD2`) -- already exists

3. Drag trail:
   - As the item is dragged, leave a fading trail of 3-4 small circles in the item's chain color
   - Each trail particle fades to alpha 0 over 200ms
   - Very subtle -- opacity starts at 0.15
   - Implementation: in the drag handler, every 50ms emit a small circle at the current position

**Files to modify:** `MergeItem.ts` (enhanced drag handler), `Board.ts` (add highlight variants)

**Effort:** Medium (3-4 hours)

---

### P2.6 -- Order Bar Interaction and Clarity

**The problem:** The order bar at the top shows 3 orders with character portraits and required items. But:
- There is no way to see what chain an order item belongs to
- Completed orders auto-claim (good) but there is no celebration animation when it happens
- The order bar is dense and hard to parse at a glance on smaller screens

**Exact implementation:**

1. Tap an order card to show a detail popup:
   - Larger view of the character portrait with their name
   - Each required item shown at `fs(16)` with its name and chain
   - Progress bar for each item showing `filled/required`
   - Reward preview: coins, XP
   - A "where to find" hint: "Merge [chain name] items" for unfulfilled slots
   - Dismiss on tap outside

2. Order completion celebration:
   - When an order auto-completes, the card does a "flip" animation (scale X to 0, change to a reward card, scale X back to 1)
   - The reward card shows the earned coins with a "+120 coins" bounce text
   - Hearts and sparkles burst from the card
   - The character portrait briefly shows a happy expression (eyes become ^ ^ shape)
   - Sound: play `complete()` sound

3. Visual clarity improvements:
   - Add a subtle progress bar at the bottom of each order card (thin, 2px, gradient fill based on % complete)
   - Incomplete items get a subtle pulse every 5 seconds (very gentle alpha oscillation 0.8 to 1.0)

**Files to modify:** `UIScene.ts` (add tap handler, completion animation, progress bar), `GameScene.ts` (emit order-complete event with animation data)

**Effort:** Medium (4-5 hours)

---

### P2.7 -- Tutorial Overhaul (Interactive, Not Text Slides)

**The problem:** The current tutorial is 4 text slides on a dark overlay. The player reads about merging but does not DO it. Every best practice says: teach through gameplay, not text screens.

**Current behavior in `GameScene.showTutorial()`:** 4 static text steps, tap to advance, then freedom.

**Exact implementation:**

Replace the text-based tutorial with a guided interactive tutorial:

1. **Step 1 -- "Tap the generator!"** (2 seconds max)
   - Dim everything except the flower generator
   - A bouncing arrow points at the generator
   - Player taps the generator, item spawns
   - Mascot: "You made a sprout!"

2. **Step 2 -- "Tap again!"**
   - Arrow points at generator again
   - Player taps, second matching item spawns next to the first
   - Mascot: "Another one!"

3. **Step 3 -- "Drag one onto the other!"**
   - Arrow points from one item to the other with a dotted path
   - Only the two matching items are interactive
   - Player drags and merges
   - Explosion of particles, merge preview shows result
   - Mascot: "You grew a Daisy! Amazing!"

4. **Step 4 -- "Complete an order!"**
   - Highlight the order bar showing a simple order
   - Arrow points at the needed item chain
   - Let the player merge to complete it naturally
   - On completion: full celebration, mascot dance
   - Mascot: "You did it! That's all you need to know. Have fun!"

5. Tutorial ends. No more hand-holding. The hint system handles ongoing guidance.

Key rules:
- Each step waits for the player to perform the action (no auto-advance)
- Skip button available in the top-right from step 1 ("Skip" in small text)
- Total tutorial time: under 60 seconds of player time
- Never show this tutorial again after completion (save flag in localStorage)

**Files to modify:** `GameScene.ts` (replace `showTutorial` method entirely)

**Effort:** High (5-7 hours)

---

### P2.8 -- Settings Scene Expansion

**The problem:** The settings scene only shows stats and a reset button. It has no controls for sound, music, haptics, or visual preferences.

**Exact implementation:**

Add these toggle rows to the settings panel (each as a pill-shaped toggle switch):

| Setting | Default | Visual |
|---------|---------|--------|
| Sound Effects | ON | Pill toggle, rose pink when on |
| Music | ON | Pill toggle |
| Haptics | ON | Pill toggle |
| Merge Hints | ON | Pill toggle |
| Reduced Motion | OFF | Pill toggle |
| Notifications | OFF | Pill toggle (for future use) |

Each toggle:
- Size: `s(48)` wide, `s(24)` tall, fully rounded
- ON state: rose pink (`0xEC407A`) fill with white circle on right
- OFF state: grey (`0xD0D0D0`) fill with white circle on left
- Tap animates the circle sliding left/right over 150ms
- Plays `buttonPress()` sound on toggle

Reduced Motion setting should:
- Disable ambient sparkle particles
- Disable mascot idle animations
- Replace scale/bounce tweens with simple fade transitions
- Disable screen shake
- Keep essential feedback (merge result, spawn) but simplify them

**Files to modify:** `SettingsScene.ts` (add toggles), `SoundManager.ts` / `HapticsManager.ts` (read settings), `GameScene.ts` (check reduced-motion flag)

**Effort:** Medium (3-4 hours)

---

## PRIORITY 3: Nice-to-Haves That Top Games Have

These features separate a good game from a great one. Implement after P1 and P2 are solid.

---

### P3.1 -- Login Streak and Daily Rewards

**The problem:** Every top merge game has daily login rewards. m3rg3r has daily challenges but no incentive to simply open the app each day. Login streaks create habit loops without requiring active play.

**Exact implementation:**

1. Track consecutive days the game is opened in the save file:
   - `lastLoginDate: string` (ISO date)
   - `currentStreak: number`
   - `longestStreak: number`

2. On session start, if the date has changed since `lastLoginDate`:
   - Show a daily reward popup (kawaii card with confetti):
     - Day 1: 50 coins
     - Day 2: 100 coins
     - Day 3: 150 coins + 1 random tier-2 item
     - Day 4: 200 coins
     - Day 5: 300 coins + 1 random tier-3 item
     - Day 6: 400 coins
     - Day 7: 500 coins + 1 random tier-4 item + achievement badge
   - After day 7, the cycle repeats with increasing base rewards (+50 per cycle)
   - If a day is missed, the streak resets to day 1 (but no punishment, no lost items, no guilt message)

3. Visual: a row of 7 circles at the top of the reward card, filled circles for completed days, current day has a star

4. Mascot says something encouraging based on streak length

5. IMPORTANT: never show a "you broke your streak" message. If the streak resets, just start fresh silently.

**Files to modify:** `SaveSystem.ts` (add streak fields), `GameScene.ts` (check on session start), new popup rendering

**Effort:** Medium (3-4 hours)

---

### P3.2 -- Auto-Producers (Cooldown Generators)

**The problem:** Without an energy system, m3rg3r has no "come back later" pull. All generators are tap-based. Once the player finishes their active orders and runs out of immediate goals, there is no reason to return in 30 minutes. Travel Town's no-energy generators (which produce items on a timer) create this return trigger.

**Exact implementation:**

1. Add a new generator type: Auto-Producer
   - Unlocked at level 5
   - Produces one item automatically every 10 minutes (configurable per chain)
   - Stores up to 3 items in a visual queue (shown as small icons stacked on the generator)
   - Player taps to collect stored items (items place in nearest empty cells)
   - If storage is full (3 items) and board is full, items stop producing until collected
   - The auto-producer has a circular progress ring showing time until next item (similar to current generator cooldown but slower)

2. Visual design:
   - Auto-producers have a clock icon overlay in the corner (distinguishing from tap generators)
   - When items are ready to collect, the generator gently bounces and shows a notification bubble with the count: "3"
   - Collecting items plays a satisfying "pop pop pop" triple-spawn animation

3. Balance: auto-producers spawn tier-1 items only (lower value than tap generators which can spawn higher tiers). Their value is the PASSIVE production, not the tier of items.

4. When the app is reopened after being closed, calculate how many items the auto-producer would have generated based on elapsed time (capped at 3). Show them as ready to collect.

**Files to modify:** New `AutoProducer.ts` object, `GameScene.ts` (add handling), `chains.ts` (add auto-producer definitions)

**Effort:** High (6-8 hours)

---

### P3.3 -- Screenshot / Share Mode

**The problem:** There is no way to share garden progress. The girlfriend cannot easily show off her game to friends. Social sharing is how casual games grow organically.

**Exact implementation:**

1. Add a camera icon button to the bottom bar (replace or add alongside existing buttons)
2. On tap:
   - Hide all UI (top bar, bottom bar, order bar, storage tray)
   - Show only the board and garden decorations against the background
   - Add a decorative frame: rounded rectangle border with kawaii corner decorations (small stars, hearts)
   - Show stats overlay in a card at bottom: "Level 12 | 47 items discovered | 14 days played"
   - Show mascot in a cute pose
   - Add "m3rg3r" watermark in small text at bottom-right (subtle)

3. Tap anywhere to capture:
   - Use Phaser's `game.renderer.snapshot()` to capture the canvas
   - Convert to PNG blob
   - Use `navigator.share()` API (available in PWA on iOS and Android) to open the native share sheet
   - If share API is not available, download the image to camera roll

4. Tap again or tap "X" to exit screenshot mode and restore UI

**Files to modify:** `GameScene.ts` (add screenshot mode), `UIScene.ts` (add camera button)

**Effort:** Medium (3-4 hours)

---

### P3.4 -- Board Organization Tools

**The problem:** As the board fills up, it becomes chaotic. Items from different chains are scattered. Players in Merge Mansion forums manually organize their boards by chain (all flowers in one area, all crystals in another). m3rg3r could offer this as a feature.

**Exact implementation:**

1. Add a "Sort" button to the storage tray area (small wand/sparkle icon):
   - On tap: auto-arrange all items on the board by chain and tier
   - Items from the same chain group together in adjacent cells
   - Within a chain, items sort by tier (lowest at top/left, highest at bottom/right)
   - Generators stay in their current positions (only items move)
   - Animation: all items simultaneously slide to their new positions over 400ms with `Power2` ease, creating a satisfying "everything falls into place" moment
   - Sound: a cascade of soft tones (each item move plays a slightly higher-pitched click)

2. Alternative: "Highlight Chain" mode
   - Long-press the sort button to enter chain-highlight mode
   - All items dim to alpha 0.3 except the selected chain (tap a chain from a popup list)
   - Highlighted items glow and pulse
   - Helps player visually scan the board for items they need
   - Tap anywhere to exit highlight mode

3. Cooldown: 30-second cooldown on auto-sort to prevent spamming

**Files to modify:** `GameScene.ts` (add sort logic), `Board.ts` (add mass-move method)

**Effort:** Medium-High (4-6 hours)

---

### P3.5 -- Particle and Animation Polish Pass

**The problem:** The existing particle and animation system is good but can be elevated to match top-tier casual games. Specific improvements:

**Exact implementation:**

1. **Squish on merge impact:** When the merge result item appears (via `playMergeResult()`), add a squash-and-stretch frame:
   - Frame 1 (0-100ms): scale from 0 to `scaleX: 1.4, scaleY: 0.8` (horizontal stretch)
   - Frame 2 (100-200ms): bounce to `scaleX: 0.85, scaleY: 1.2` (vertical stretch)
   - Frame 3 (200-350ms): settle to `scaleX: 1, scaleY: 1` with `Bounce.easeOut`
   - This creates a "jelly" feel that matches the kawaii aesthetic

2. **Particle variety:** Add emoji-based particles for high-tier merges (tier 5+):
   - In addition to the circle/star particles, emit 2-3 small emoji characters: hearts, sparkles, stars
   - These emoji particles are `fs(8)` text objects that rotate as they fly outward
   - Chain-specific: flowers emit petal emoji, crystals emit diamond emoji, etc.

3. **Generator spawn poof:** When a generator produces an item:
   - Add a small "poof" cloud that expands and fades: a white circle that scales from 0.5 to 1.5 and fades to 0 over 200ms
   - The spawned item "pops" out of the cloud (start scale 0, end scale 1 with slight overshoot)

4. **Board cell hover ripple:** When dragging an item over cells:
   - Each cell the drag passes over gets a brief ripple effect: a circle that expands from the center and fades
   - Very subtle (alpha 0.1, duration 300ms)
   - Makes the board feel responsive and alive

5. **XP bar fill animation:** When XP is gained:
   - The bar does not jump to the new width instantly
   - Instead, it animates with a "fill" tween over 300ms
   - At the leading edge of the fill, add a bright white highlight (2px wide, full alpha) that creates a "liquid filling" effect

**Files to modify:** `MergeItem.ts` (squish), `MergeSystem.ts` (emoji particles), `GameScene.ts` (poof cloud), `Board.ts` (ripple), `UIScene.ts` (XP animation)

**Effort:** Medium (4-5 hours total for all sub-items)

---

### P3.6 -- Seasonal / Time-Based Visual Events

**The problem:** The game looks the same every day. Top merge games run 100+ events per month (Gossip Harbor). m3rg3r does not need that volume, but simple seasonal touches make the game feel alive and current.

**Exact implementation:**

1. Detect the current month and apply seasonal overlays:
   - **Spring (Sep-Nov in AU, Mar-May in NH):** Cherry blossom petals drift across the background. Pink-tinted ambient sparkles.
   - **Summer (Dec-Feb in AU):** Brighter background gradient. Sun sparkles instead of stars.
   - **Autumn (Mar-May in AU):** Falling leaves overlay (orange/red/gold emoji: leaf emoji). Warm-tinted background.
   - **Winter (Jun-Aug in AU):** Snowflake particles. Cooler blue-tinted background. Mascot gets a tiny scarf.

2. Implementation: in `GameScene.createAmbientSparkles()`, check the month and adjust:
   - Particle emojis (replace sparkles with season-appropriate ones)
   - Background gradient colors (subtle shift, not dramatic)
   - Optional: mascot accessory (a small sprite overlay)

3. Special dates:
   - Valentine's Day: extra hearts in particles for 3 days
   - Christmas: snowfall + mascot Santa hat for 7 days
   - The girlfriend's birthday (if known): special "Happy Birthday!" mascot greeting

4. No exclusive items or FOMO. Seasonal changes are purely cosmetic atmosphere.

**Files to modify:** `GameScene.ts` (seasonal particle config), `Mascot.ts` (seasonal accessories)

**Effort:** Low-Medium (2-3 hours for basic seasonal particles)

---

## ACCESSIBILITY IMPROVEMENTS

These should be implemented alongside the priority items above, not as a separate phase.

---

### A.1 -- Color Blind Safety

**Current state:** The game uses color to distinguish chain types (pink flowers, blue crystals, green nature) but each item also has a UNIQUE emoji, which is inherently accessible. The main risk areas are:

- Cell highlight colors: valid (mint green) vs invalid (soft coral) -- these could be confused by players with protanopia
- The hint system glow is rose-colored, which may blend with the pink board

**Fix:**
- Add a subtle icon overlay on highlighted cells: checkmark for valid, X for invalid (in addition to color)
- Hint system glow should use a contrasting color against the pink board: use blue (`0xA8D8EA`) instead of rose (`0xEC407A`)
- For the merge preview (P1.2), include the item name as text, not just the visual

**Effort:** Very Low (30-60 minutes)

---

### A.2 -- Touch Target Sizes

**Current state audit:**
- Board cells: `s(44)` to `s(65)` depending on screen size -- GOOD (meets 44px minimum)
- Bottom bar buttons: `btnWidth` = screen width / 4, with full `BOTTOM_BAR` height hit zones -- GOOD
- Storage tray slots: `s(44)` -- GOOD (meets minimum)
- Settings toggle zones: need to be added (see P2.8)
- Order card tap zones: the entire card is not interactive (needs P2.6 fix) -- need to ensure tap zone covers the full card

**Fix:**
- Ensure all new interactive elements (undo button, sort button, camera button) have minimum `s(44)` tap zones
- The undo button specifically should be `s(44)` minimum despite visual size of `s(36)` -- extend the interactive zone
- Order cards: make the entire card a tap zone, not just specific elements within it

**Effort:** Very Low (integrated into other work)

---

### A.3 -- Font Readability

**Current state:** Fredoka (headings) and Nunito (body) are both rounded sans-serif fonts with good readability. Font sizes use DPR scaling.

**Potential issues:**
- Some text is `fs(7)` which scales to ~7px on 1x DPR screens (too small)
- The coin/gem counters use emoji + number at `fs(13)` which is fine
- Order card text is small and dense

**Fix:**
- Set a minimum effective font size: nothing below `fs(9)` anywhere in the game
- Specifically, the storage tray label ("Storage"), order card character names, and progress badges should all be at least `fs(9)`
- Ensure all text has sufficient contrast ratio against its background (the current palette of dark purple text on light pink backgrounds is good, approximately 4.5:1)

**Effort:** Very Low (15-30 minutes)

---

### A.4 -- Reduced Motion Option

**Current state:** No reduced motion option. The game has ambient sparkles, mascot animations, item glow tweens, and screen shake.

**Fix (as part of P2.8 Settings Expansion):**
- Check `window.matchMedia('(prefers-reduced-motion: reduce)')` on startup
- If the OS setting is enabled, automatically default the in-game Reduced Motion toggle to ON
- When Reduced Motion is ON:
  - Disable: ambient sparkles, mascot idle animation, item glow pulse, screen shake, board cell ripple, drag trail
  - Keep but simplify: merge result (simple fade-in instead of bounce), spawn (simple fade-in), particles (reduce count by 75%)
  - This makes the game fully playable but calm

**Effort:** Low (1-2 hours, integrated into P2.8)

---

## IMPLEMENTATION ORDER

Recommended build sequence, optimized for maximum impact per hour spent:

| Order | Item | Impact | Effort | Running Total |
|-------|------|--------|--------|---------------|
| 1 | P1.4 Item Swap Feedback | Quick win, immediate feel improvement | 30 min | 0.5h |
| 2 | P1.2 Merge Preview | Eliminates guesswork, high-visibility feature | 2.5h | 3h |
| 3 | P1.1 Undo System | Removes #1 frustration | 5h | 8h |
| 4 | P1.6 Real Sound Files | Transforms perceived quality | 3.5h | 11.5h |
| 5 | P1.5 Generator Tap Fix | Removes friction from core action | 1.5h | 13h |
| 6 | P1.3 Board Full Guidance | Reduces panic moments | 2.5h | 15.5h |
| 7 | A.1-A.4 Accessibility | Do alongside P1 items | 2h | 17.5h |
| 8 | P2.3 Haptic Feedback | Adds tactile dimension | 1.5h | 19h |
| 9 | P2.4 Combo Counter | Makes rapid merging exciting | 2.5h | 21.5h |
| 10 | P2.8 Settings Expansion | Unlocks player control | 3.5h | 25h |
| 11 | P2.5 Enhanced Drag Feedback | Polishes core interaction | 3.5h | 28.5h |
| 12 | P2.7 Tutorial Overhaul | Improves first-time experience | 6h | 34.5h |
| 13 | P2.1 Long-Press Item Info | Adds depth to item interaction | 3.5h | 38h |
| 14 | P2.2 Session Start Experience | Improves return experience | 2.5h | 40.5h |
| 15 | P2.6 Order Bar Interaction | Polishes progression visibility | 4.5h | 45h |
| 16 | P3.5 Particle Polish Pass | Visual elevation | 4.5h | 49.5h |
| 17 | P3.1 Login Streak | Adds daily return incentive | 3.5h | 53h |
| 18 | P3.6 Seasonal Visuals | Makes game feel alive | 2.5h | 55.5h |
| 19 | P3.3 Screenshot/Share | Social growth | 3.5h | 59h |
| 20 | P3.4 Board Organization | Power-user feature | 5h | 64h |
| 21 | P3.2 Auto-Producers | Return-trigger mechanic | 7h | 71h |

**Total estimated effort: ~71 hours**

Priority 1 items alone (17.5 hours) will eliminate the major friction points.
Priority 1 + 2 (45 hours) will make the game feel professionally polished.
All items (71 hours) will match or exceed the UX quality of commercial merge games.

---

## RESEARCH SOURCES

- [Travel Town Player Feedback Analysis (Kimola)](https://kimola.com/reports/explore-key-insights-from-travel-town-player-feedback-google-play-en-155417)
- [Travel Town Review 2025 (AllLoot)](https://allloot.com/travel-town-review/)
- [Travel Town App Store Reviews](https://apps.apple.com/us/app/travel-town-merge-adventure/id1521236603)
- [Merge Mansion Reviews (JustUseApp)](https://justuseapp.com/en/app/1484442152/merge-mansion/reviews)
- [Gossip Harbor Reviews (AppGamer)](https://www.appgamer.com/gossip-harbor-merge-game/reviews/)
- [Merge Fellas User Reviews 2025](https://mergefellasmodapk.net/merge-fellas-user-reviews/)
- [Best Merge Games 2026 (PlayNForge)](https://www.playnforge.com/best-merge-games/)
- [Top 10 Merge Games Jan 2026 (GameTyrant)](https://gametyrant.com/news/top-10-merge-games-january-2026-i-tested-them-all-so-you-donampx27t-have-to)
- [Why Merge Games Are Best Puzzle Games (Carry1st)](https://www.carry1st.com/blog/why-are-merge-games-the-best-puzzle-games)
- [Deconstructing Travel Town (PocketGamer.biz)](https://www.pocketgamer.biz/deconstructing-magmatic-games-travel-town/)
- [Juicy UI: Smallest Interactions (Medium)](https://medium.com/@mezoistvan/juicy-ui-why-the-smallest-interactions-make-the-biggest-difference-5cb5a5ffc752)
- [The Art of Tiny Animations (Wayline)](https://www.wayline.io/blog/art-of-tiny-animations-game-feel)
- [Making a Game Feel Juicy (GameDev4U)](https://gamedev4u.medium.com/when-you-play-a-great-game-it-feels-good-d23761b6eccf)
- [2025 Guide to Haptics (Saropa)](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774)
- [Haptics Design Principles (Android Developers)](https://developer.android.com/develop/ui/views/haptics/haptics-principles)
- [FTUE in Mobile Games (Udonis)](https://www.blog.udonis.co/mobile-marketing/mobile-games/first-time-user-experience)
- [Mobile Game Onboarding Best Practices (Adrian Crook)](https://adriancrook.com/best-practices-for-mobile-game-onboarding/)
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)
- [WCAG Target Size (W3C)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Command Pattern for Undo (Envato Tuts+)](https://code.tutsplus.com/let-your-players-undo-their-in-game-mistakes-with-the-command-pattern--gamedev-1391t)
- [Casual Gaming Review: Merge Mansion (Medium)](https://k-e-ressman.medium.com/casual-gaming-review-merge-mansion-6c769d26535a)
- [Merge Mansion Tips & Guides (Fandom Wiki)](https://merge-mansion.fandom.com/wiki/Tips)
- [Top Hyper-Casual Game Mechanics 2025 (EJAW)](https://ejaw.net/top-10-hyper-casual-mechanics/)
- [Game Feel Tutorial (GameDev Academy)](https://gamedevacademy.org/game-feel-tutorial/)
