import { Board, CellData } from '../objects/Board';
import { MergeItem, MergeItemData, newItemId } from '../objects/MergeItem';
import { Generator } from '../objects/Generator';
import { Mascot } from '../objects/Mascot';
import { StorageTray } from '../objects/StorageTray';
import { MergeSystem } from '../systems/MergeSystem';
import { QuestSystem, ActiveQuest } from '../systems/QuestSystem';
import { HintSystem } from '../systems/HintSystem';
import { AchievementSystem } from '../systems/AchievementSystem';
import { AchievementDef } from '../data/achievements';
import { OrderSystem } from '../systems/OrderSystem';
import { SaveSystem, SaveData, LoginData, DAILY_REWARDS } from '../systems/SaveSystem';
import { GENERATORS, MERGE_CHAINS, getNextInChain, getChainItem, isMaxTier, getChain } from '../data/chains';
import { GardenDecorationManager } from '../objects/GardenDecoration';
import { SIZES, COLORS, TIMING, FONT, FONT_BODY, TEXT, fs, s } from '../utils/constants';
import { SoundManager, haptic } from '../utils/SoundManager';
import { StoryBeat, getPendingBeats } from '../data/story';
import { CHARACTERS } from '../data/orders';
import { WeatherSystem } from '../systems/WeatherSystem';
import { EventSystem } from '../systems/EventSystem';
import { TimedOrderSystem, TimedOrderDef } from '../systems/TimedOrderSystem';
import { ShareSystem } from '../systems/ShareSystem';

/** Undo record for the most recent non-merge move */
interface UndoRecord {
  itemId: string;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  /** If a swap occurred, the other item's id */
  swappedItemId?: string;
  timestamp: number;
}

/** Chain colors for preview tooltip backgrounds */
const PREVIEW_CHAIN_COLORS: Record<string, number> = {
  flower: 0xF8BBD0, butterfly: 0xB3E5FC, fruit: 0xFFCCBC, crystal: 0xD1C4E9,
  nature: 0xC8E6C9, star: 0xFFF9C4, tea: 0xD7CCC8, shell: 0xB2EBF2,
  sweet: 0xF8BBD0, love: 0xFFB3C6, cosmic: 0xD1C4E9, cafe: 0xEFEBE9,
};

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private mergeSystem!: MergeSystem;
  private questSystem!: QuestSystem;
  private hintSystem!: HintSystem;
  private achievementSystem!: AchievementSystem;
  private orderSystem!: OrderSystem;
  private gardenManager!: GardenDecorationManager;
  public sound_!: SoundManager;
  private mascot!: Mascot;
  private storageTray!: StorageTray;
  private weatherSystem!: WeatherSystem;
  private eventSystem!: EventSystem;
  private timedOrderSystem!: TimedOrderSystem;

  private items: Map<string, MergeItem> = new Map();
  private generators: Generator[] = [];
  private isMerging = false;
  private previewContainer: Phaser.GameObjects.Container | null = null;
  private loginData: LoginData = { lastLoginDate: '', loginStreak: 0, lastClaimedDate: '' };

  // ─── Undo system ───
  private lastMove: UndoRecord | null = null;
  private undoButton: Phaser.GameObjects.Container | null = null;

  // ─── Merge preview on drag ───
  private mergePreviewContainer: Phaser.GameObjects.Container | null = null;

  // ─── Combo system ───
  private comboCount = 0;
  private lastMergeTime = 0;
  private readonly COMBO_WINDOW = 2500;
  private comboTimer: Phaser.Time.TimerEvent | null = null;

  // ─── Tutorial state ───
  private tutorialActive = false;

  public playerLevel = 1;
  private playerXP = 0;
  private xpToNext = 100;
  public gems = 99999;
  private totalMerges = 0;
  private collection: Map<string, number> = new Map();

  // ─── Story system ───
  private completedStoryBeats: string[] = [];
  private hasEverMergedMaxTier = false;
  private hasEverMergedGen = false;

  // ─── Global popup queue system (BUG 2 fix) ───
  // Priority: mascot=1, quest=2, order=3, story=4, level=5 (higher = more important)
  private popupQueue: Array<{ type: string; priority: number; show: () => void }> = [];
  private popupActive = false;
  private popupActiveTimestamp = 0;
  private lastPopupDismissTime = 0;
  private static readonly POPUP_MIN_GAP = 3000; // 3 seconds between popups
  private static readonly POPUP_MAX_QUEUED = 5; // Drop low-priority if queue grows
  private static readonly POPUP_TIMEOUT = 8000; // Force reset stuck popups after 8 seconds

  // PERF: Debounce save to max 1 per second instead of saving after every action
  private saveDebounceTimer: Phaser.Time.TimerEvent | null = null;
  private savePending = false;

  // PERF: Cache board item map for updateUI to avoid rebuilding on every call
  private boardItemMapDirty = true;
  private cachedBoardMatches: boolean[] = [];

  constructor() { super('GameScene'); }

  create() {
    const { width, height } = this.scale;

    this.drawBackground(width, height);
    // Ambient sparkles removed -- caused motion sickness feedback

    this.board = new Board(this, 6, 8);
    this.mergeSystem = new MergeSystem(this);
    this.questSystem = new QuestSystem(this.playerLevel);

    // Storage tray — positioned between board and bottom bar
    const boardBottom = SIZES.TOP_BAR + SIZES.ORDER_BAR + SIZES.BOARD_PADDING
      + 8 * (this.board.cellDimension + SIZES.CELL_GAP) - SIZES.CELL_GAP + SIZES.BOARD_PADDING;
    const trayY = boardBottom + s(28);
    this.storageTray = new StorageTray(this, trayY);

    // Sound manager
    this.sound_ = new SoundManager(this);

    // Garden decoration manager
    this.gardenManager = new GardenDecorationManager(this, {
      x: 0, y: SIZES.TOP_BAR, w: width, h: height - SIZES.TOP_BAR - SIZES.BOTTOM_BAR
    });

    // Mascot — top-left, tucked into the order bar area
    this.mascot = new Mascot(this, s(24), SIZES.TOP_BAR + s(8));

    const save = SaveSystem.load();
    if (save) { this.loadSave(save); } else { this.startFresh(); }

    // Systems
    this.hintSystem = new HintSystem(this, this.board, this.items);
    this.achievementSystem = new AchievementSystem(this);
    this.achievementSystem.initialize(save?.achievements);
    this.orderSystem = new OrderSystem(this.playerLevel);
    this.orderSystem.initialize(save?.orders || undefined);

    // New systems: weather, events, timed orders
    this.weatherSystem = new WeatherSystem(this);
    // Weather particles disabled -- moving elements caused motion sickness feedback
    // this.weatherSystem.start();
    this.eventSystem = new EventSystem();
    this.timedOrderSystem = new TimedOrderSystem(this.playerLevel);

    // Events
    this.events.on('item-dropped', this.handleDrop, this);
    this.events.on('generator-tapped', this.handleGenTap, this);
    this.events.on('generator-dropped', this.handleGenDrop, this);
    this.events.on('auto-produce', this.handleAutoProduce, this);
    this.events.on('board-full', this.handleBoardFull, this);
    this.events.on('shop-buy-generator', this.onBuyGenerator, this);
    this.events.on('storage-retrieve', this.onStorageRetrieve, this);
    this.events.on('claim-order', this.onClaimOrder, this);
    this.events.on('claim-order-item', this.onClaimOrderItem, this);
    this.events.on('item-preview', this.showChainPreview, this);
    this.events.on('toggle-garden-view', this.onToggleGardenView, this);
    this.events.on('daily-challenge-complete', (reward: { xp: number; coins: number }) => {
      this.addXP(reward.xp);
      this.orderSystem.coins += reward.coins;
      this.mascot.showSpeech('Daily done!', 2000);
      this.updateUI();
      this.saveGame();
    });

    // Drag sounds -- pickup on drag start
    this.input.on('dragstart', () => { this.sound_.pickup(); });

    this.scene.launch('UIScene', {
      gems: this.gems, coins: this.orderSystem.coins, level: this.playerLevel,
      xp: this.playerXP, xpToNext: this.xpToNext,
      quests: this.questSystem.getActiveQuests(),
      orders: this.orderSystem.getActiveOrders(),
    });

    this.time.addEvent({ delay: TIMING.AUTOSAVE, loop: true, callback: () => this.saveGame() });

    // Save on app background + ambient music pause/resume
    // PERF: Use immediate save on visibility change (app going to background)
    const visHandler = () => {
      if (document.hidden) { this.saveGameImmediate(); }
      this.sound_.handleVisibilityChange(document.hidden);
    };
    document.addEventListener('visibilitychange', visHandler);
    this.events.once('shutdown', () => {
      document.removeEventListener('visibilitychange', visHandler);
      this.sound_.stopAmbientMusic();
      this.weatherSystem.destroy();
    });

    // Start ambient music
    this.sound_.startAmbientMusic();

    // Periodic checks: popup queue, mood changes, event refresh, timed orders
    this.time.addEvent({ delay: 2000, loop: true, callback: () => this.processPopupQueue() });
    this.time.addEvent({ delay: 60000, loop: true, callback: () => {
      this.sound_.checkMoodChange();
      this.eventSystem.refreshEvents();
    }});
    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      this.timedOrderSystem.tick();
      // Check timed order expiry
      const timed = this.timedOrderSystem.getActiveOrder();
      if (timed && !timed.completed && !timed.expired && this.timedOrderSystem.checkExpiry()) {
        this.mascot.showSpeech('Time\'s up! Nice try!', 2500);
        this.addXP(10); // consolation XP
        this.updateUI();
      }
    }});
    // Offer timed orders every 30 seconds
    this.time.addEvent({ delay: 30000, loop: true, callback: () => {
      if (this.timedOrderSystem.shouldOfferOrder()) {
        const offer = this.timedOrderSystem.generateOrder();
        this.showTimedOrderOffer(offer);
      }
    }});

    // Mascot greeting — event-aware
    this.time.delayedCall(1500, () => {
      const evt = this.eventSystem.getPrimaryEvent();
      if (evt) {
        this.mascot.showSpeech(`${evt.icon} ${evt.name} is active!`, 3000);
      } else {
        const greetings = ['Welcome back!', 'Let\'s garden!', 'Hi there!', 'Ready to merge?'];
        this.mascot.showSpeech(greetings[Phaser.Math.Between(0, greetings.length - 1)], 2000);
      }
    });

    // Mascot sleep timer
    this.time.addEvent({
      delay: 5000, loop: true,
      callback: () => {
        if (Date.now() - this.hintSystem.lastInteractionTime > 30000) {
          this.mascot.goToSleep();
        }
      }
    });

    // Wake mascot on input
    this.input.on('pointerdown', () => this.mascot.wakeUp());

    this.cameras.main.fadeIn(400, 255, 240, 245);

    // Trash zone — drag items to bottom-right to delete
    this.createTrashZone(width, height);

    // Undo button — near trash zone, bottom-left area
    this.createUndoButton(width, height);

    // Listen for merge-preview events from MergeItem drag
    this.events.on('show-merge-preview', this.showMergePreview, this);
    this.events.on('hide-merge-preview', this.hideMergePreview, this);

    // First-play tutorial
    if (!save) this.showTutorial(width, height);

    // Daily login reward check (delay so scene fully renders first)
    this.time.delayedCall(800, () => this.checkDailyLogin());
  }

  private createTrashZone(width: number, height: number): void {
    const trashY = height - SIZES.BOTTOM_BAR - s(38);
    const trashX = width - s(32);
    // Canvas-drawn trash can icon
    const trashIcon = this.add.graphics().setAlpha(0.3).setDepth(4);
    const tSz = s(8);
    trashIcon.fillStyle(0x9B7EAB, 1);
    // Lid
    trashIcon.fillRect(trashX - tSz * 0.8, trashY - tSz * 0.6, tSz * 1.6, tSz * 0.25);
    trashIcon.fillRect(trashX - tSz * 0.3, trashY - tSz * 0.85, tSz * 0.6, tSz * 0.3);
    // Body (tapered)
    trashIcon.beginPath();
    trashIcon.moveTo(trashX - tSz * 0.7, trashY - tSz * 0.3);
    trashIcon.lineTo(trashX + tSz * 0.7, trashY - tSz * 0.3);
    trashIcon.lineTo(trashX + tSz * 0.55, trashY + tSz * 0.7);
    trashIcon.lineTo(trashX - tSz * 0.55, trashY + tSz * 0.7);
    trashIcon.closePath();
    trashIcon.fillPath();
    // Lines
    trashIcon.lineStyle(s(0.5), 0xFFFFFF, 0.4);
    trashIcon.beginPath();
    trashIcon.moveTo(trashX - tSz * 0.2, trashY - tSz * 0.15);
    trashIcon.lineTo(trashX - tSz * 0.15, trashY + tSz * 0.55);
    trashIcon.moveTo(trashX + tSz * 0.2, trashY - tSz * 0.15);
    trashIcon.lineTo(trashX + tSz * 0.15, trashY + tSz * 0.55);
    trashIcon.strokePath();
    const trashLabel = this.add.text(trashX, trashY + s(14), 'Trash', {
      fontSize: fs(7), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5).setAlpha(0.3).setDepth(4);

    // Listen for drags near trash zone
    this.events.on('item-near-trash', (near: boolean) => {
      trashIcon.setAlpha(near ? 0.9 : 0.3);
      trashLabel.setAlpha(near ? 0.9 : 0.3);
      if (near) {
        trashIcon.setScale(1.2);
      } else {
        trashIcon.setScale(1);
      }
    });
  }

  // ─── UNDO BUTTON ───

  private createUndoButton(_width: number, height: number): void {
    const btnX = s(32);
    const btnY = height - SIZES.BOTTOM_BAR - s(38);
    const container = this.add.container(btnX, btnY).setDepth(4);
    this.undoButton = container;

    // Circle background
    const bg = this.add.graphics();
    bg.fillStyle(0xFFF0F5, 1);
    bg.fillCircle(0, 0, s(18));
    bg.lineStyle(s(1.5), 0xF8BBD0, 0.6);
    bg.strokeCircle(0, 0, s(18));
    container.add(bg);

    // Arrow icon (curved left arrow)
    const icon = this.add.text(0, 0, '\u21A9', {
      fontSize: fs(14), color: TEXT.SECONDARY, fontFamily: FONT,
    }).setOrigin(0.5);
    container.add(icon);

    // Label
    const label = this.add.text(0, s(14), 'Undo', {
      fontSize: fs(7), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5).setAlpha(0.7);
    container.add(label);

    // Start greyed out
    container.setAlpha(0.3);

    // Tap zone
    const zone = this.add.zone(0, 0, s(40), s(40)).setInteractive();
    container.add(zone);
    zone.on('pointerdown', () => this.executeUndo());
  }

  private updateUndoButton(): void {
    if (!this.undoButton) return;
    const hasUndo = this.lastMove !== null && (Date.now() - this.lastMove.timestamp < 30000);
    this.undoButton.setAlpha(hasUndo ? 1 : 0.3);
  }

  private recordMove(itemId: string, fromCol: number, fromRow: number, toCol: number, toRow: number, swappedItemId?: string): void {
    this.lastMove = { itemId, fromCol, fromRow, toCol, toRow, swappedItemId, timestamp: Date.now() };
    this.updateUndoButton();
  }

  private executeUndo(): void {
    if (!this.lastMove) return;
    if (Date.now() - this.lastMove.timestamp > 30000) {
      this.lastMove = null;
      this.updateUndoButton();
      return;
    }

    const move = this.lastMove;
    this.lastMove = null;
    this.updateUndoButton();

    const item = this.items.get(move.itemId);
    if (!item) return;

    // Play undo sound (descending chime)
    this.sound_.undo();
    haptic('light');

    if (move.swappedItemId) {
      // Reverse the swap: move both items back with arc animation
      const swapped = this.items.get(move.swappedItemId);
      if (swapped) {
        const fromCell = this.board.getCell(move.fromCol, move.fromRow);
        const toCell = this.board.getCell(move.toCol, move.toRow);
        if (fromCell && toCell) {
          // Clear both current positions
          this.board.setOccupied(item.data_.col, item.data_.row, null);
          this.board.setOccupied(swapped.data_.col, swapped.data_.row, null);

          // Animate item back with arc
          this.animateArcMove(item, fromCell.x, fromCell.y, 300);
          item.data_.col = move.fromCol;
          item.data_.row = move.fromRow;
          item.origCol_ = move.fromCol;
          item.origRow_ = move.fromRow;
          this.board.setOccupied(move.fromCol, move.fromRow, move.itemId);

          // Animate swapped item back with arc
          this.animateArcMove(swapped, toCell.x, toCell.y, 300);
          swapped.data_.col = move.toCol;
          swapped.data_.row = move.toRow;
          swapped.origCol_ = move.toCol;
          swapped.origRow_ = move.toRow;
          this.board.setOccupied(move.toCol, move.toRow, move.swappedItemId!);
        }
      }
    } else {
      // Simple move: animate item back to original cell
      const origCell = this.board.getCell(move.fromCol, move.fromRow);
      if (origCell && !origCell.occupied) {
        this.board.setOccupied(item.data_.col, item.data_.row, null);
        this.animateArcMove(item, origCell.x, origCell.y, 300);
        item.data_.col = move.fromCol;
        item.data_.row = move.fromRow;
        item.origCol_ = move.fromCol;
        item.origRow_ = move.fromRow;
        this.board.setOccupied(move.fromCol, move.fromRow, move.itemId);
      }
    }

    this.mascot.showSpeech('Oops! Let\'s try again!', 2000);
    this.saveGame();
  }

  /** Animate a game object along a curved arc path */
  private animateArcMove(obj: Phaser.GameObjects.Container, targetX: number, targetY: number, duration: number): void {
    const startX = obj.x;
    const startY = obj.y;
    const midX = (startX + targetX) / 2;
    const midY = Math.min(startY, targetY) - s(30); // arc peak above both points

    // Use a custom tween with onUpdate to follow a quadratic bezier curve
    this.tweens.add({
      targets: obj,
      t: { from: 0, to: 1 },
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: (_tween: Phaser.Tweens.Tween, _target: unknown, _key: string, value: number) => {
        const t = value;
        // Quadratic bezier: P = (1-t)^2*P0 + 2*(1-t)*t*P1 + t^2*P2
        const oneMinusT = 1 - t;
        obj.x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * midX + t * t * targetX;
        obj.y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * midY + t * t * targetY;
      },
    });
  }

  // ─── MERGE PREVIEW ON DRAG ───

  public showMergePreview(chainId: string, nextTier: number, x: number, y: number, sourceItemId: string, targetItemId: string): void {
    // Validate the target is actually a compatible merge target
    const targetItem = this.items.get(targetItemId);
    if (!targetItem) { this.hideMergePreview(); return; }
    if (targetItem.data_.chainId !== chainId || targetItem.data_.tier !== nextTier - 1) {
      this.hideMergePreview();
      return;
    }

    // Don't recreate if already showing
    if (this.mergePreviewContainer) {
      this.hideMergePreview();
    }

    const nextItem = getChainItem(chainId, nextTier);
    if (!nextItem) return;

    const textureKey = `${chainId}_${nextTier}`;
    const container = this.add.container(x, y - SIZES.CELL * 0.7).setDepth(2000);
    this.mergePreviewContainer = container;

    // Semi-transparent preview sprite
    const hasTexture = this.textures.exists(textureKey);
    if (hasTexture) {
      const preview = this.add.image(0, 0, textureKey);
      preview.setDisplaySize(SIZES.ITEM_SIZE * 0.5, SIZES.ITEM_SIZE * 0.5);
      preview.setAlpha(0.6);
      container.add(preview);
    } else {
      // Fallback to name initial
      const initial = this.add.text(0, 0, nextItem.name.charAt(0), {
        fontSize: fs(12), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
      }).setOrigin(0.5).setAlpha(0.6);
      container.add(initial);
    }

    // Small "+" indicator
    const plus = this.add.text(0, SIZES.ITEM_SIZE * 0.3, '+', {
      fontSize: fs(10), color: TEXT.ACCENT, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5).setAlpha(0.7);
    container.add(plus);

    // Item name label
    const nameLabel = this.add.text(0, -SIZES.ITEM_SIZE * 0.35, nextItem.name, {
      fontSize: fs(8), color: TEXT.PRIMARY, fontFamily: FONT_BODY, fontStyle: '600',
      backgroundColor: 'rgba(255,240,245,0.85)', padding: { x: s(4), y: s(2) },
    }).setOrigin(0.5).setAlpha(0.8);
    container.add(nameLabel);

    // Entry animation: scale from 0 + gentle bob
    container.setScale(0);
    this.tweens.add({
      targets: container, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut',
      onComplete: () => {
        // Gentle bob animation
        this.tweens.add({
          targets: container, y: container.y - s(3), duration: 600,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }
    });
  }

  public hideMergePreview(): void {
    if (this.mergePreviewContainer) {
      const c = this.mergePreviewContainer;
      this.mergePreviewContainer = null;
      this.tweens.killTweensOf(c);
      c.destroy();
    }
  }

  private showTutorial(_width: number, _height: number): void {
    const { width, height } = this.scale;
    this.tutorialActive = true;

    // All tutorial objects tracked for cleanup
    const tutorialObjs: Phaser.GameObjects.GameObject[] = [];

    // Overlay with spotlight hole
    const overlay = this.add.graphics().setDepth(5000);
    tutorialObjs.push(overlay);

    // Instruction text
    const textObj = this.add.text(width / 2, height * 0.25, '', {
      fontSize: fs(14), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
      align: 'center', lineSpacing: s(6),
      backgroundColor: 'rgba(109,58,91,0.9)', padding: { x: s(16), y: s(12) },
    }).setOrigin(0.5).setDepth(5003);
    tutorialObjs.push(textObj);

    // Pulsing arrow
    const arrow = this.add.text(0, 0, '\u2B07', {
      fontSize: fs(22), color: '#FFD700', fontFamily: FONT,
    }).setOrigin(0.5).setDepth(5003).setAlpha(0);
    tutorialObjs.push(arrow);
    const arrowTween = this.tweens.add({
      targets: arrow, y: '+=8', alpha: { from: 0.6, to: 1 },
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const drawSpotlight = (cx: number, cy: number, radius: number) => {
      overlay.clear();
      overlay.fillStyle(0x6D3A5B, 0.6);
      overlay.fillRect(0, 0, width, height);
      overlay.fillStyle(0xFFF0F5, 0.3);
      overlay.fillCircle(cx, cy, radius + s(4));
      overlay.lineStyle(s(3), 0xFFD700, 0.6);
      overlay.strokeCircle(cx, cy, radius);
    };

    const clearAll = () => {
      arrowTween.destroy();
      tutorialObjs.forEach(o => { if (o && o.active) o.destroy(); });
      this.tutorialActive = false;
      this.mascot.showSpeech('Let\'s bloom!', 2000);
    };

    // ─── STEP 1: Tap a generator ───
    const firstGen = this.generators[0];
    if (!firstGen) { clearAll(); return; }
    const genCell = this.board.getCell(firstGen.col, firstGen.row);
    if (!genCell) { clearAll(); return; }

    drawSpotlight(genCell.x, genCell.y, this.board.cellDimension * 0.6);
    textObj.setText('Tap here to spawn an item!');
    textObj.setY(genCell.y - s(80));
    arrow.setPosition(genCell.x, genCell.y - s(35)).setAlpha(1);

    const step1Handler = () => {
      this.events.off('generator-tapped', step1Handler);
      // ─── STEP 2: Tap again ───
      this.time.delayedCall(400, () => {
        drawSpotlight(genCell.x, genCell.y, this.board.cellDimension * 0.6);
        textObj.setText('Great! Tap again!');
        textObj.setY(genCell.y - s(80));
        arrow.setPosition(genCell.x, genCell.y - s(35));

        const step2Handler = () => {
          this.events.off('generator-tapped', step2Handler);
          // ─── STEP 3: Drag to merge ───
          this.time.delayedCall(400, () => {
            const itemsArr = Array.from(this.items.values());
            let matchA: MergeItem | null = null;
            let matchB: MergeItem | null = null;
            for (let i = 0; i < itemsArr.length; i++) {
              for (let j = i + 1; j < itemsArr.length; j++) {
                if (itemsArr[i].data_.chainId === itemsArr[j].data_.chainId &&
                    itemsArr[i].data_.tier === itemsArr[j].data_.tier &&
                    !isMaxTier(itemsArr[i].data_.chainId, itemsArr[i].data_.tier)) {
                  matchA = itemsArr[i];
                  matchB = itemsArr[j];
                  break;
                }
              }
              if (matchA) break;
            }

            if (matchA && matchB) {
              const ax = matchA.x, ay = matchA.y;
              const bx = matchB.x, by = matchB.y;
              const cx = (ax + bx) / 2, cy = (ay + by) / 2;
              const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
              drawSpotlight(cx, cy, dist / 2 + this.board.cellDimension * 0.6);

              textObj.setText('Drag one onto the other\nto merge!');
              textObj.setY(cy - s(90));

              const mergeArrow = this.add.graphics().setDepth(5002);
              mergeArrow.lineStyle(s(3), 0xFFD700, 0.7);
              mergeArrow.lineBetween(ax, ay, bx, by);
              tutorialObjs.push(mergeArrow);
              this.tweens.add({ targets: mergeArrow, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

              arrow.setAlpha(0);

              const step3Handler = () => {
                this.events.off('merge-complete', step3Handler);
                // ─── STEP 4: Celebration ───
                overlay.clear();
                overlay.fillStyle(0x6D3A5B, 0.4);
                overlay.fillRect(0, 0, width, height);
                textObj.setText('You merged your first item!\nKeep going to discover more!');
                textObj.setY(height * 0.4);
                arrow.setAlpha(0);
                this.time.delayedCall(2500, () => clearAll());
              };
              this.events.on('merge-complete', step3Handler);
            } else {
              textObj.setText('Keep merging to discover\nnew items!');
              textObj.setY(height * 0.4);
              arrow.setAlpha(0);
              overlay.clear();
              overlay.fillStyle(0x6D3A5B, 0.4);
              overlay.fillRect(0, 0, width, height);
              this.time.delayedCall(2500, () => clearAll());
            }
          });
        };
        this.events.on('generator-tapped', step2Handler);
      });
    };
    this.events.on('generator-tapped', step1Handler);
  }

  private drawBackground(width: number, height: number): void {
    const hour = new Date().getHours();
    let topColor: number, botColor: number;
    // Dramatic time-of-day gradients
    if (hour >= 6 && hour < 12) {
      // Morning: warm peach sunrise
      topColor = 0xFFF0E0; botColor = 0xFFE0CC;
    } else if (hour >= 12 && hour < 17) {
      // Afternoon: soft golden cream
      topColor = 0xFFF8E8; botColor = 0xFFF0D4;
    } else if (hour >= 17 && hour < 21) {
      // Evening: warm lavender-peach sunset
      topColor = 0xFFE8E0; botColor = 0xE8D0E8;
    } else {
      // Night: deep blue-purple
      topColor = 0xD8C8E8; botColor = 0xC0B0D8;
    }

    const bg = this.add.graphics();
    bg.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
    bg.fillRect(0, 0, width, height);

    // ── Soft bokeh circles (warm blurred orbs at 3-5% opacity) ──
    const bokehDefs = [
      { x: width * 0.15, y: height * 0.20, r: s(40), color: 0xFFD8A8, alpha: 0.04 },
      { x: width * 0.80, y: height * 0.35, r: s(55), color: 0xF5D280, alpha: 0.03 },
      { x: width * 0.50, y: height * 0.75, r: s(45), color: 0xFFBFA0, alpha: 0.04 },
      { x: width * 0.25, y: height * 0.60, r: s(35), color: 0xE8C8D8, alpha: 0.035 },
      { x: width * 0.70, y: height * 0.15, r: s(30), color: 0xFFF0C0, alpha: 0.04 },
      { x: width * 0.90, y: height * 0.80, r: s(50), color: 0xF0D0B0, alpha: 0.03 },
    ];
    for (const b of bokehDefs) {
      // Multi-layer soft circle for blur-like effect
      bg.fillStyle(b.color, b.alpha * 0.5);
      bg.fillCircle(b.x, b.y, b.r * 1.4);
      bg.fillStyle(b.color, b.alpha);
      bg.fillCircle(b.x, b.y, b.r);
      bg.fillStyle(b.color, b.alpha * 1.5);
      bg.fillCircle(b.x, b.y, b.r * 0.6);
    }

    // ── Garden silhouette decorations (soft rounded bush shapes at edges) ──
    const bushColor = hour >= 17 || hour < 6 ? 0xA8B8A0 : 0xC8D8B8;
    const bushAlpha = 0.06;
    // Bottom-left bush cluster
    bg.fillStyle(bushColor, bushAlpha);
    bg.fillEllipse(s(-10), height - SIZES.BOTTOM_BAR + s(5), s(80), s(45));
    bg.fillEllipse(s(30), height - SIZES.BOTTOM_BAR + s(10), s(60), s(35));
    // Bottom-right bush cluster
    bg.fillEllipse(width + s(10), height - SIZES.BOTTOM_BAR + s(5), s(70), s(40));
    bg.fillEllipse(width - s(25), height - SIZES.BOTTOM_BAR + s(12), s(55), s(30));
    // Top-right small leaves
    bg.fillStyle(bushColor, bushAlpha * 0.7);
    bg.fillEllipse(width - s(15), SIZES.TOP_BAR + s(20), s(50), s(25));

    // ── Vignette (darker edges, lighter center) ──
    const vigAlpha = 0.06;
    // Top vignette
    bg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, vigAlpha, vigAlpha, 0, 0);
    bg.fillRect(0, 0, width, height * 0.2);
    // Bottom vignette
    bg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, vigAlpha, vigAlpha);
    bg.fillRect(0, height * 0.8, width, height * 0.2);
    // Left vignette
    bg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, vigAlpha, 0, vigAlpha, 0);
    bg.fillRect(0, 0, width * 0.15, height);
    // Right vignette
    bg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, vigAlpha, 0, vigAlpha);
    bg.fillRect(width * 0.85, 0, width * 0.15, height);
  }

  private createAmbientSparkles(width: number, height: number): void {
    // ── Shape sparkles — mixed sizes (tiny, small, medium) ──
    const sparkleColors = [0xF5D280, 0xFFD93D, 0xFFBFA0, 0xE8A4C8, 0xF48FB1, 0xA8E6CF, 0xFF6B9D];
    const sparkleShapes = ['heart', 'circle', 'blossom', 'diamond'] as const;

    // 6 shape sparkles (increased from 4), with size variety
    for (let i = 0; i < 6; i++) {
      const g = this.add.graphics().setDepth(0);
      const color = sparkleColors[Phaser.Math.Between(0, sparkleColors.length - 1)];
      const shape = sparkleShapes[Phaser.Math.Between(0, sparkleShapes.length - 1)];
      // Mixed sizes: tiny (2-3), small (4-5), medium (6-8)
      const sizeClass = i < 2 ? Phaser.Math.Between(2, 3) : (i < 4 ? Phaser.Math.Between(4, 5) : Phaser.Math.Between(6, 8));
      const r = s(sizeClass);
      const startAlpha = i < 2 ? 0.06 : (i < 4 ? 0.08 : 0.05); // smaller = subtler, big = gentler
      g.setAlpha(startAlpha);
      this.drawSparkleShape(g, 0, 0, r, color, shape);

      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR);
      g.setPosition(x, y);

      // Mixed speeds: tiny drift slow, medium drift faster
      const speed = sizeClass < 4 ? Phaser.Math.Between(7000, 14000) : Phaser.Math.Between(5000, 9000);
      this.tweens.add({
        targets: g, y: y - s(Phaser.Math.Between(40, 110)), alpha: 0,
        duration: speed, delay: Phaser.Math.Between(0, 6000),
        repeat: -1,
        onRepeat: () => {
          g.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR));
          g.setAlpha(startAlpha);
        },
      });
    }

    // ── 4-point star sparkles with drift — mixed sizes and colors ──
    const starColors = [0xF5D280, 0xFFD93D, 0xFFBFA0, 0xE8A4C8, 0x87CEEB];
    for (let i = 0; i < 5; i++) {
      const g = this.add.graphics().setDepth(0);
      const color = starColors[Phaser.Math.Between(0, starColors.length - 1)];
      const starSize = s(i < 2 ? Phaser.Math.Between(2, 3) : Phaser.Math.Between(4, 7));

      g.fillStyle(color, 0.7);
      g.beginPath();
      g.moveTo(0, -starSize * 1.5);
      g.lineTo(starSize * 0.35, -starSize * 0.35);
      g.lineTo(starSize * 1.5, 0);
      g.lineTo(starSize * 0.35, starSize * 0.35);
      g.lineTo(0, starSize * 1.5);
      g.lineTo(-starSize * 0.35, starSize * 0.35);
      g.lineTo(-starSize * 1.5, 0);
      g.lineTo(-starSize * 0.35, -starSize * 0.35);
      g.closePath();
      g.fillPath();

      const startX = Phaser.Math.Between(0, width);
      const startY = Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR);
      g.setPosition(startX, startY).setAlpha(i < 2 ? 0.07 : 0.1);

      const driftX = Phaser.Math.Between(-30, 30);
      const speed = Phaser.Math.Between(6000, 13000);
      this.tweens.add({
        targets: g,
        y: startY - s(Phaser.Math.Between(50, 120)),
        x: startX + s(driftX),
        alpha: 0,
        scaleX: { from: 0.5, to: 1.2 },
        scaleY: { from: 0.5, to: 1.2 },
        duration: speed,
        delay: Phaser.Math.Between(0, 6000),
        repeat: -1,
        onRepeat: () => {
          const newX = Phaser.Math.Between(0, width);
          const newY = Phaser.Math.Between(SIZES.TOP_BAR, height - SIZES.BOTTOM_BAR);
          g.setPosition(newX, newY);
          g.setAlpha(i < 2 ? 0.07 : 0.1);
          g.setScale(0.5);
        },
      });
    }

    // ── Floating golden light motes (very small warm dots drifting upward) ──
    for (let i = 0; i < 8; i++) {
      const g = this.add.graphics().setDepth(0);
      const moteColor = i < 5 ? 0xF5D280 : 0xFFE4B0; // warm gold / pale gold mix
      const moteR = s(Phaser.Math.Between(1, 2));
      g.fillStyle(moteColor, 0.8);
      g.fillCircle(0, 0, moteR);
      // Subtle glow ring
      g.fillStyle(moteColor, 0.3);
      g.fillCircle(0, 0, moteR * 2);

      const startX = Phaser.Math.Between(s(20), width - s(20));
      const startY = Phaser.Math.Between(height * 0.4, height - SIZES.BOTTOM_BAR);
      g.setPosition(startX, startY).setAlpha(0.12);

      const driftX = Phaser.Math.Between(-15, 15);
      this.tweens.add({
        targets: g,
        y: startY - s(Phaser.Math.Between(80, 200)),
        x: startX + s(driftX),
        alpha: 0,
        duration: Phaser.Math.Between(8000, 16000),
        delay: Phaser.Math.Between(0, 8000),
        repeat: -1,
        onRepeat: () => {
          const newX = Phaser.Math.Between(s(20), width - s(20));
          const newY = Phaser.Math.Between(height * 0.4, height - SIZES.BOTTOM_BAR);
          g.setPosition(newX, newY);
          g.setAlpha(0.12);
        },
      });
    }
  }

  private startFresh(): void {
    this.questSystem.initialize();
    const flowerGen = GENERATORS.find(g => g.id === 'gen_flower')!;
    const butterflyGen = GENERATORS.find(g => g.id === 'gen_butterfly')!;
    this.createGenerator(flowerGen, 1, 0);
    this.createGenerator(butterflyGen, 4, 0);
    this.spawnItem('flower', 1, 2, 3);
    this.spawnItem('flower', 1, 3, 3);
    this.spawnItem('flower', 2, 2, 4);
    this.spawnItem('butterfly', 1, 3, 4);
    this.spawnItem('butterfly', 1, 4, 4);
  }

  private loadSave(data: SaveData): void {
    this.playerLevel = data.player.level;
    this.playerXP = data.player.xp;
    this.xpToNext = data.player.xpToNext;
    this.gems = data.player.gems;
    this.totalMerges = data.player.totalMerges;
    for (const c of data.collection) this.collection.set(c.chainId, c.maxTier);
    for (const g of data.board.generators) {
      const def = GENERATORS.find(d => d.id === g.genId);
      if (def) {
        const gen = this.createGenerator(def, g.col, g.row, g.itemId, g.genTier ?? 1);
        gen.lastAutoProduceTime = g.lastAutoProduceTime ?? Date.now();
      }
    }
    for (const item of data.board.items) this.createItem(item);
    this.questSystem.initialize(data.quests.active, data.quests.completed);
    if (data.storage) this.storageTray.loadItems(data.storage);
    if (data.garden) this.gardenManager.load(data.garden);
    if (data.login) this.loginData = { ...data.login };
    if (data.completedStoryBeats) this.completedStoryBeats = [...data.completedStoryBeats];
    // Derive milestone flags from existing save state
    this.hasEverMergedMaxTier = this.completedStoryBeats.includes('act1_first_max_tier');
    this.hasEverMergedGen = this.completedStoryBeats.includes('act1_first_gen_merge');

    // Load timed order save
    try {
      const timedSave = localStorage.getItem('m3rg3r_timed_orders');
      if (timedSave) this.timedOrderSystem?.initialize(JSON.parse(timedSave));
    } catch { /* ignore corrupt timed order data */ }

    // Calculate offline auto-production
    this.processOfflineProduction(data);
  }

  private createItem(data: MergeItemData): MergeItem {
    const item = new MergeItem(this, this.board, data);
    item.setDepth(10);
    this.items.set(data.id, item);
    this.markBoardDirty(); // PERF: invalidate cached board matches
    return item;
  }

  private createGenerator(def: typeof GENERATORS[0], col: number, row: number, itemId?: string, genTier: number = 1): Generator {
    const id = itemId || newItemId();
    const gen = new Generator(this, this.board, def, col, row, id, genTier);
    gen.setDepth(5);
    this.generators.push(gen);
    return gen;
  }

  public spawnItem(chainId: string, tier: number, col: number, row: number): MergeItem | null {
    const cell = this.board.getCell(col, row);
    if (!cell || cell.occupied) return null;
    const data: MergeItemData = { id: newItemId(), chainId, tier, col, row };
    const item = this.createItem(data);
    item.playSpawnAnimation();
    return item;
  }

  private onBuyGenerator(genDef: typeof GENERATORS[0]): void {
    if (this.gems < genDef.cost) return;
    const cell = this.board.findEmptyCell();
    if (!cell) return;
    this.gems -= genDef.cost;
    this.createGenerator(genDef, cell.col, cell.row);
    this.updateUI();
    this.saveGame();
  }

  private onStorageRetrieve(itemData: { chainId: string; tier: number }, slotIndex: number): void {
    const cell = this.board.findEmptyCell();
    if (!cell) {
      this.mascot.showSpeech('Board is full!', 2000);
      return;
    }
    const removed = this.storageTray.removeItem(slotIndex);
    if (removed) {
      this.spawnItem(removed.chainId, removed.tier, cell.col, cell.row);
      this.saveGame();
    }
  }

  private handleDrop(dropped: MergeItem, targetCell: CellData): void {
    if (this.isMerging) { dropped.returnToOriginal(); return; }
    const { width, height } = this.scale;
    this.events.emit('item-near-trash', false);
    this.hideMergePreview();

    // Check if dropped on trash zone (bottom-right corner)
    const trashX = width - s(32);
    const trashY = height - SIZES.BOTTOM_BAR - s(38);
    if (Math.abs(dropped.x - trashX) < s(30) && Math.abs(dropped.y - trashY) < s(30)) {
      const data = dropped.data_;
      this.items.delete(data.id);
      this.markBoardDirty(); // PERF: invalidate cached board matches
      this.board.setOccupied(data.col, data.row, null);
      this.sound_.trash();
      this.lastMove = null;
      this.updateUndoButton();
      // Poof animation
      this.tweens.add({
        targets: dropped, scaleX: 0, scaleY: 0, alpha: 0, duration: 200,
        ease: 'Back.easeIn', onComplete: () => dropped.destroy(),
      });
      this.saveGame();
      return;
    }

    // Check if dropped on storage tray area
    const trayY = this.storageTray.trayY;
    if (dropped.y > trayY - s(25) && dropped.y < trayY + s(25)) {
      if (!this.storageTray.isFull()) {
        const data = dropped.data_;
        this.items.delete(data.id);
        this.markBoardDirty(); // PERF: invalidate cached board matches
        this.board.setOccupied(data.col, data.row, null);
        dropped.destroy();
        this.storageTray.storeItem(data.chainId, data.tier);
        this.saveGame();
        return;
      }
    }

    const targetId = targetCell.itemId;
    if (targetId) {
      const target = this.items.get(targetId);
      if (target && this.mergeSystem.canMerge(dropped, target)) {
        this.lastMove = null;
        this.updateUndoButton();
        this.executeMerge(dropped, target);
        return;
      }
      if (this.generators.some(g => g.itemId === targetId)) { dropped.returnToOriginal(); return; }
      if (target) {
        const origCol = dropped.data_.col, origRow = dropped.data_.row;

        // Record the swap for undo
        this.recordMove(dropped.data_.id, origCol, origRow, targetCell.col, targetCell.row, target.data_.id);

        // Clear both cells atomically
        this.board.setOccupied(targetCell.col, targetCell.row, null);
        this.board.setOccupied(origCol, origRow, null);

        // Set board state for both items
        target.data_.col = origCol;
        target.data_.row = origRow;
        target.origCol_ = origCol;
        target.origRow_ = origRow;
        this.board.setOccupied(origCol, origRow, target.data_.id);

        dropped.data_.col = targetCell.col;
        dropped.data_.row = targetCell.row;
        dropped.origCol_ = targetCell.col;
        dropped.origRow_ = targetCell.row;
        this.board.setOccupied(targetCell.col, targetCell.row, dropped.data_.id);

        // Arc animation for both items
        const targetCellPos = this.board.getCell(origCol, origRow);
        const droppedCellPos = this.board.getCell(targetCell.col, targetCell.row);
        if (targetCellPos && droppedCellPos) {
          this.animateArcMove(target, targetCellPos.x, targetCellPos.y, 250);
          this.animateArcMove(dropped, droppedCellPos.x, droppedCellPos.y, 250);
        }

        // Scale bounce on both items
        this.tweens.add({
          targets: [dropped, target], scaleX: 1.1, scaleY: 1.1, duration: 75, yoyo: true,
          ease: 'Bounce.easeOut',
        });

        // Show swap icon at midpoint
        if (targetCellPos && droppedCellPos) {
          const midX = (targetCellPos.x + droppedCellPos.x) / 2;
          const midY = (targetCellPos.y + droppedCellPos.y) / 2;
          const swapIcon = this.add.text(midX, midY, '\u21C4', {
            fontSize: fs(14), color: TEXT.SECONDARY, fontFamily: FONT,
          }).setOrigin(0.5).setDepth(2000).setAlpha(0.7);
          this.tweens.add({
            targets: swapIcon, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 400,
            onComplete: () => swapIcon.destroy(),
          });
        }

        this.sound_.swap();
        haptic('light');
        return;
      }
    }
    if (!targetCell.occupied && !targetCell.locked) {
      const fromCol = dropped.data_.col;
      const fromRow = dropped.data_.row;
      dropped.moveToCell(targetCell.col, targetCell.row);
      this.recordMove(dropped.data_.id, fromCol, fromRow, targetCell.col, targetCell.row);
      this.sound_.drop();
      // Ensure visual snap to cell center
      const snapCell = this.board.getCell(targetCell.col, targetCell.row);
      if (snapCell) {
        this.tweens.add({ targets: dropped, x: snapCell.x, y: snapCell.y, duration: 80, ease: 'Power2' });
      }
    }
    else { dropped.returnToOriginal(); }
  }

  private async executeMerge(item1: MergeItem, item2: MergeItem): Promise<void> {
    this.isMerging = true;
    this.items.delete(item1.data_.id);
    this.items.delete(item2.data_.id);
    this.markBoardDirty(); // PERF: invalidate cached board matches

    // Combo tracking
    const now = Date.now();
    if (now - this.lastMergeTime < this.COMBO_WINDOW) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastMergeTime = now;
    const comboMultiplier = this.comboCount;

    // Reset combo timer
    if (this.comboTimer) { this.comboTimer.remove(false); this.comboTimer = null; }
    this.comboTimer = this.time.delayedCall(this.COMBO_WINDOW, () => {
      if (this.comboCount > 1) {
        this.sound_.comboBreak();
      }
      this.comboCount = 0;
      this.comboTimer = null;
    });

    const result = await this.mergeSystem.executeMerge(item1, item2, comboMultiplier);
    this.isMerging = false;
    if (result.success && result.newItem) {
      const newItem = this.createItem(result.newItem);
      newItem.playMergeResult();
      this.sound_.merge(result.newItem.tier);
      this.totalMerges++;
      // Apply merge XP multiplier from events
      const mergeXpMult = this.eventSystem?.getMergeXpMultiplier() ?? 1;
      this.addXP(Math.round((result.xpGained || 0) * mergeXpMult));

      // Check timed order match
      if (this.timedOrderSystem.getActiveOrder()) {
        const timedMatch = this.timedOrderSystem.findMatch(result.newItem.chainId, result.newItem.tier);
        if (timedMatch !== null) {
          const complete = this.timedOrderSystem.fulfillItem(timedMatch);
          if (complete) {
            const timedRewards = this.timedOrderSystem.claimRewards();
            if (timedRewards) {
              for (const tr of timedRewards) {
                if (tr.type === 'coins') this.orderSystem.coins += tr.amount;
                if (tr.type === 'gems') this.gems = Math.min(this.gems + tr.amount, 999999);
                if (tr.type === 'xp') this.addXP(tr.amount);
              }
              this.mascot.showSpeech('Timed order complete! Bonus!', 3000);
              this.sound_.achievement();
            }
          }
        }
      }

      // Show combo text if combo > 1
      if (comboMultiplier > 1) {
        this.showComboText(newItem.x, newItem.y, comboMultiplier);
      }
      this.gems = Math.min(this.gems + (result.gemsGained || 0), 999999);
      const cur = this.collection.get(result.newItem.chainId) || 0;
      const isNewDiscovery = result.newItem.tier > cur;
      if (isNewDiscovery) this.collection.set(result.newItem.chainId, result.newItem.tier);

      // NEW! discovery animation
      if (isNewDiscovery) {
        this.playDiscoveryAnimation(newItem);
        this.sound_.discovery();
      }

      // Track first max-tier merge for story system
      if (isMaxTier(result.newItem.chainId, result.newItem.tier) && !this.hasEverMergedMaxTier) {
        this.hasEverMergedMaxTier = true;
        this.time.delayedCall(3000, () => this.checkStoryBeats());
      }

      // Check if this is a max-tier item — offer garden placement
      if (isMaxTier(result.newItem.chainId, result.newItem.tier) &&
          !this.gardenManager.hasChain(result.newItem.chainId)) {
        const chainDef = getChain(result.newItem.chainId);
        const itemDef = getChainItem(result.newItem.chainId, result.newItem.tier);
        if (chainDef && itemDef) {
          this.time.delayedCall(800, () => {
            this.showGardenPrompt(newItem, itemDef.emoji, itemDef.name, result.newItem!.chainId, result.newItem!.tier);
          });
        }
      }

      // Mascot reacts + check achievements + check orders
      this.mascot.reactToMerge(result.newItem.tier);
      this.checkAchievements(result.newItem.chainId, result.newItem.tier);

      // Orders are NOT auto-consumed. The UI will highlight fulfillable orders
      // and the player must tap the order card to claim items one at a time.

      const c1 = this.questSystem.onItemCreated(result.newItem.chainId, result.newItem.tier);
      const c2 = this.questSystem.onMerge();
      for (const q of [...c1, ...c2]) this.handleQuestComplete(q);
      this.events.emit('merge-complete', result.newItem);
      this.updateUI();
      this.saveGame();
    }
  }

  /** Show combo multiplier text with bouncy scale-in and float-up fade */
  private showComboText(x: number, y: number, combo: number): void {
    // Color scales with combo level
    let color: string;
    if (combo >= 5) {
      // Rainbow-ish cycle for 5x+
      const rainbow = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#D4A5FF'];
      color = rainbow[(combo - 5) % rainbow.length];
    } else if (combo >= 3) {
      color = '#EC407A'; // rose
    } else {
      color = '#FFD700'; // gold
    }

    const txt = this.add.text(x, y - s(40), `${combo}x COMBO!`, {
      fontSize: fs(20 + Math.min(combo, 5) * 2),
      color,
      fontFamily: FONT,
      fontStyle: '700',
      stroke: '#FFFFFF',
      strokeThickness: s(3),
      shadow: { offsetX: 0, offsetY: s(2), color: 'rgba(92,84,112,0.3)', blur: s(4), fill: true },
    }).setOrigin(0.5).setDepth(2005).setScale(0);

    // Bouncy scale-in
    this.tweens.add({
      targets: txt, scaleX: 1.3, scaleY: 1.3, duration: 150, ease: 'Back.easeOut',
      onComplete: () => {
        // Float upward with alpha fade
        this.tweens.add({
          targets: txt, y: y - s(100), alpha: 0, scaleX: 1, scaleY: 1,
          duration: 1200, ease: 'Power2',
          onComplete: () => txt.destroy(),
        });
      }
    });

    // Camera shake increases with combo level
    const cam = this.cameras.main;
    const shakeIntensity = s(1 + combo * 0.5);
    cam.shake(80 + combo * 15, shakeIntensity / 1000);
  }

  private handleGenTap(_gen: Generator, cell: CellData, spawnTier?: number): void {
    if (this.isMerging) return;
    this.sound_.generatorTap();
    const tier = spawnTier ?? _gen.genDef.spawnTier;
    const item = this.spawnItem(_gen.genDef.chainId, tier, cell.col, cell.row);
    if (item) { this.sound_.spawn(); this.createSpawnParticles(cell.x, cell.y); }
  }

  /** Handle auto-produced items (same as tap but quieter, no multi-spawn) */
  private handleAutoProduce(gen: Generator, cell: CellData, spawnTier: number): void {
    if (this.isMerging) return;
    const item = this.spawnItem(gen.genDef.chainId, spawnTier, cell.col, cell.row);
    if (item) {
      this.sound_.spawn();
      this.createSpawnParticles(cell.x, cell.y);
      this.saveGame();
    }
  }

  private boardFullCooldown = 0;

  private handleBoardFull(): void {
    const now = Date.now();
    // Throttle so repeated taps don't spam the message
    if (now - this.boardFullCooldown < 3000) return;
    this.boardFullCooldown = now;
    this.sound_.boardFull();
    this.mascot.showSpeech('Board is full! Clear some space!', 2000);
  }

  // PERF: Pre-allocated color array avoids per-call allocation
  private static readonly SPAWN_PARTICLE_COLORS = [0xFFB3D9, 0xA8E6CF, 0xA8D8EA];

  private createSpawnParticles(x: number, y: number): void {
    const colors = GameScene.SPAWN_PARTICLE_COLORS;
    for (let i = 0; i < 5; i++) {
      const p = this.add.graphics();
      p.fillStyle(colors[Phaser.Math.Between(0, 2)], 0.8);
      p.fillCircle(0, 0, s(3));
      p.setPosition(x, y).setDepth(2000);
      const angle = Math.random() * Math.PI * 2;
      const dist = s(20 + Math.random() * 15);
      this.tweens.add({
        targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, duration: 300, onComplete: () => p.destroy(),
      });
    }
  }

  private handleGenDrop(dropped: Generator, targetCell: CellData): void {
    if (this.isMerging) { dropped.returnToOriginal(); return; }

    const targetId = targetCell.itemId;
    if (targetId) {
      // Check if target is a generator we can merge with
      const targetGen = this.generators.find(g => g.itemId === targetId);
      if (targetGen && this.mergeSystem.canMergeGenerators(dropped, targetGen)) {
        this.executeGeneratorMerge(dropped, targetGen);
        return;
      }
      // Can't merge -- snap back
      dropped.returnToOriginal();
      return;
    }

    // Empty cell: move generator there
    if (!targetCell.occupied && !targetCell.locked) {
      dropped.moveToCell(targetCell.col, targetCell.row);
      this.saveGame();
    } else {
      dropped.returnToOriginal();
    }
  }

  private async executeGeneratorMerge(dropped: Generator, target: Generator): Promise<void> {
    this.isMerging = true;

    const genDef = target.genDef;
    const targetCol = target.col;
    const targetRow = target.row;

    // Remove both generators from the array
    this.generators = this.generators.filter(g => g !== dropped && g !== target);

    const result = await this.mergeSystem.executeGeneratorMerge(dropped, target);
    this.isMerging = false;

    if (result.success && result.newTierDef) {
      const newGen = this.createGenerator(genDef, result.col, result.row, undefined, result.newGenTier);

      // Spawn animation for the new generator
      newGen.setScale(0);
      this.tweens.add({
        targets: newGen, scaleX: 1.3, scaleY: 1.3, duration: 200, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({ targets: newGen, scaleX: 1, scaleY: 1, duration: 150, ease: 'Bounce.easeOut' });
        }
      });

      this.sound_.generatorMerge(result.newGenTier);
      this.totalMerges++;
      this.addXP(20 + result.newGenTier * 10);
      this.gems = Math.min(this.gems + 10 + result.newGenTier * 5, 999999);

      // Track first generator merge for story system
      if (!this.hasEverMergedGen) {
        this.hasEverMergedGen = true;
        this.time.delayedCall(3000, () => this.checkStoryBeats());
      }

      // Show upgrade text
      const tierNames = ['', '', 'II', 'III', 'IV', 'V'];
      const cell = this.board.getCell(targetCol, targetRow);
      if (cell) {
        const upgradeMsg = result.newGenTier >= 5 ? 'MAX TIER!' : `Tier ${tierNames[result.newGenTier]}!`;
        const msgColor = result.newGenTier >= 5 ? '#FF6B9D' : result.newGenTier >= 4 ? '#FFD700' : '#EC407A';
        const txt = this.add.text(cell.x, cell.y - s(30), upgradeMsg, {
          fontSize: fs(16), color: msgColor, fontFamily: FONT, fontStyle: '700',
          stroke: '#FFFFFF', strokeThickness: s(3),
        }).setOrigin(0.5).setDepth(2001).setScale(0);
        this.tweens.add({
          targets: txt, scaleX: 1.3, scaleY: 1.3, duration: 200, ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: txt, scaleX: 1, scaleY: 1, duration: 100,
              onComplete: () => {
                this.tweens.add({
                  targets: txt, y: cell.y - s(70), alpha: 0, duration: 800, ease: 'Power2',
                  onComplete: () => txt.destroy(),
                });
              }
            });
          }
        });
      }

      this.mascot.reactToMerge(result.newGenTier + 2);
      const upgradeLines = [
        'Upgraded! So powerful!', 'Getting stronger!', 'Amazing upgrade!',
      ];
      this.mascot.showSpeech(upgradeLines[Phaser.Math.Between(0, upgradeLines.length - 1)], 2000);

      this.updateUI();
      this.saveGame();
    }
  }

  private handleQuestComplete(quest: ActiveQuest): void {
    const reward = this.questSystem.claimQuest(quest.def.id);
    if (!reward) return;
    this.gems = Math.min(this.gems + reward.gems, 999999);
    this.addXP(reward.xp);

    // Queue the quest complete popup (priority 2)
    this.queuePopup('quest', 2, () => this.showQuestCompletePopup(quest, reward));
    this.updateUI();
  }

  private showQuestCompletePopup(quest: ActiveQuest, reward: { gems: number; xp: number }): void {
    const { width, height } = this.scale;

    // Canvas-drawn heart particles
    for (let i = 0; i < 8; i++) {
      const hg = this.add.graphics().setDepth(3001);
      const hx = width / 2 + Phaser.Math.Between(-s(80), s(80));
      const hy = height / 2 + s(20);
      const hr = s(Phaser.Math.Between(4, 7));
      hg.setPosition(hx, hy);
      hg.fillStyle(0xFF6B9D, 0.9);
      hg.fillCircle(-hr * 0.3, -hr * 0.15, hr * 0.45);
      hg.fillCircle(hr * 0.3, -hr * 0.15, hr * 0.45);
      hg.fillTriangle(-hr * 0.65, 0, hr * 0.65, 0, 0, hr * 0.7);
      this.tweens.add({
        targets: hg, y: hy - s(Phaser.Math.Between(60, 120)), alpha: 0,
        duration: 1200, delay: i * 80, onComplete: () => hg.destroy(),
      });
    }

    const banner = this.add.text(width / 2, height / 2, quest.def.description, {
      fontSize: fs(17), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
      backgroundColor: 'rgba(255,240,245,0.95)', padding: { x: s(16), y: s(12) },
    }).setOrigin(0.5).setDepth(3000);

    const rewardTxt = this.add.text(width / 2, height / 2 + s(35), `+${reward.gems} gems  +${reward.xp} XP`, {
      fontSize: fs(14), color: TEXT.MINT, fontFamily: FONT, fontStyle: '600',
      backgroundColor: 'rgba(255,240,245,0.95)', padding: { x: s(12), y: s(8) },
    }).setOrigin(0.5).setDepth(3000);

    this.tweens.add({
      targets: [banner, rewardTxt], y: `-=${s(30)}`, alpha: 0,
      duration: 2000, delay: 1500,
      onComplete: () => { banner.destroy(); rewardTxt.destroy(); this.onPopupDismissed(); },
    });

    this.mascot.react('excited');
    this.mascot.showSpeech('Quest done!', 2000);
  }

  private addXP(amount: number): void {
    // Apply event XP multiplier
    const xpMult = this.eventSystem?.getXpMultiplier() ?? 1;
    this.playerXP += Math.round(amount * xpMult);
    while (this.playerXP >= this.xpToNext) {
      this.playerXP -= this.xpToNext;
      this.playerLevel++;
      this.xpToNext = Math.floor(this.xpToNext * 1.5);
      this.onLevelUp();
    }
  }

  private onLevelUp(): void {
    this.sound_.levelUp();
    this.questSystem.setLevel(this.playerLevel);
    this.orderSystem.setLevel(this.playerLevel);
    this.checkAchievements();
    this.updateUI();

    // Queue the level-up celebration popup (priority 5 = highest)
    const level = this.playerLevel;
    this.queuePopup('level', 5, () => this.showLevelUpPopup(level));

    // Check story beats after level-up fanfare settles
    this.time.delayedCall(3500, () => this.checkStoryBeats());
  }

  private showLevelUpPopup(level: number): void {
    const { width, height } = this.scale;

    // Full-screen white flash
    const lvlFlash = this.add.graphics().setDepth(2999);
    lvlFlash.fillStyle(0xFFFFFF, 0.7);
    lvlFlash.fillRect(0, 0, width, height);
    this.tweens.add({
      targets: lvlFlash, alpha: 0, duration: 400,
      onComplete: () => lvlFlash.destroy(),
    });

    // Camera shake
    this.cameras.main.shake(300, 0.015);

    // "LEVEL UP!" text with gold color and bouncy scale
    const levelUpTxt = this.add.text(width / 2, height / 2 - s(80), 'LEVEL UP!', {
      fontSize: fs(40), color: '#FFD700', fontFamily: FONT, fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: s(5),
      shadow: { offsetX: 0, offsetY: s(2), color: 'rgba(92,84,112,0.4)', blur: s(6), fill: true },
    }).setOrigin(0.5).setDepth(3000).setScale(0);

    this.tweens.add({
      targets: levelUpTxt, scaleX: 1.2, scaleY: 1.2, duration: 350, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: levelUpTxt, scaleX: 1, scaleY: 1, duration: 150,
          onComplete: () => {
            this.tweens.add({
              targets: levelUpTxt, y: `-=${s(40)}`, alpha: 0, delay: 2000, duration: 800,
              onComplete: () => levelUpTxt.destroy(),
            });
          }
        });
      }
    });

    // Level number text below "LEVEL UP!"
    const levelTxt = this.add.text(width / 2, height / 2 - s(40), `Level ${level}`, {
      fontSize: fs(28), color: TEXT.ACCENT, fontFamily: FONT, fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: s(4),
    }).setOrigin(0.5).setDepth(3000).setScale(0);

    this.tweens.add({
      targets: levelTxt, scaleX: 1, scaleY: 1, duration: 400, delay: 150, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: levelTxt, y: `-=${s(40)}`, alpha: 0, delay: 2000, duration: 800,
          onComplete: () => { levelTxt.destroy(); this.onPopupDismissed(); },
        });
      }
    });

    // Ring of 12 gold star particles bursting outward from center
    const starCenterY = height / 2 - s(60);
    for (let i = 0; i < 12; i++) {
      const starGfx = this.add.graphics().setDepth(3001);
      const starSz = s(Phaser.Math.Between(5, 8));
      starGfx.fillStyle(0xFFD700, 0.95);
      starGfx.beginPath();
      for (let j = 0; j < 5; j++) {
        const outerA = (j / 5) * Math.PI * 2 - Math.PI / 2;
        const innerA = ((j + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
        if (j === 0) starGfx.moveTo(Math.cos(outerA) * starSz, Math.sin(outerA) * starSz);
        else starGfx.lineTo(Math.cos(outerA) * starSz, Math.sin(outerA) * starSz);
        starGfx.lineTo(Math.cos(innerA) * starSz * 0.4, Math.sin(innerA) * starSz * 0.4);
      }
      starGfx.closePath();
      starGfx.fillPath();
      starGfx.setPosition(width / 2, starCenterY);

      const burstAngle = (i / 12) * Math.PI * 2;
      const burstDist = s(60 + Phaser.Math.Between(0, 30));
      this.tweens.add({
        targets: starGfx,
        x: width / 2 + Math.cos(burstAngle) * burstDist,
        y: starCenterY + Math.sin(burstAngle) * burstDist,
        alpha: 0, scaleX: 0, scaleY: 0,
        rotation: Phaser.Math.FloatBetween(-1.5, 1.5),
        duration: 600 + Phaser.Math.Between(0, 200),
        delay: Phaser.Math.Between(0, 100),
        ease: 'Power2',
        onComplete: () => starGfx.destroy(),
      });
    }

    this.createConfetti();
    this.mascot.react('excited');
    this.mascot.showSpeech(`Level ${level}!`, 2000);
  }

  private createConfetti(): void {
    const { width } = this.scale;
    const colors = [0xFF9CAD, 0xFFB3D9, 0xA8D8EA, 0xA8E6CF, 0xFFECB3, 0xC8A8E9];
    for (let i = 0; i < 30; i++) {
      const c = this.add.graphics();
      c.fillStyle(colors[Phaser.Math.Between(0, colors.length - 1)], 1);
      c.fillCircle(0, 0, s(Phaser.Math.Between(3, 6)));
      c.setPosition(Phaser.Math.Between(0, width), -s(20)).setDepth(3000);
      this.tweens.add({
        targets: c, y: this.scale.height + s(20),
        x: c.x + Phaser.Math.Between(-s(80), s(80)),
        rotation: Phaser.Math.FloatBetween(-3, 3),
        duration: Phaser.Math.Between(1500, 3000), ease: 'Power1',
        onComplete: () => c.destroy(),
      });
    }
  }

  private showGardenPrompt(item: MergeItem, emoji: string, name: string, chainId: string, tier: number): void {
    const { width, height } = this.scale;
    const nextSlot = this.gardenManager.getNextSlot();
    if (!nextSlot) return;

    const allElements: Phaser.GameObjects.GameObject[] = [];

    // Semi-transparent overlay
    const overlay = this.add.graphics().setDepth(4000);
    overlay.fillStyle(0x6D3A5B, 0.4);
    overlay.fillRect(0, 0, width, height);
    allElements.push(overlay);

    // Pulsing indicator at target slot location
    const slotX = nextSlot.x * width;
    const slotY = nextSlot.y * height;
    const slotIndicator = this.add.graphics().setDepth(4001);
    slotIndicator.lineStyle(s(2), 0xFFD93D, 0.7);
    slotIndicator.strokeCircle(slotX, slotY, s(24));
    slotIndicator.fillStyle(0xFFD93D, 0.15);
    slotIndicator.fillCircle(slotX, slotY, s(24));
    allElements.push(slotIndicator);
    this.tweens.add({
      targets: slotIndicator, alpha: 0.4, scaleX: 1.15, scaleY: 1.15,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const slotLabel = this.add.text(slotX, slotY + s(30), nextSlot.label, {
      fontSize: fs(9), color: '#FFD93D', fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5).setDepth(4001);
    allElements.push(slotLabel);

    // Prompt card
    const cardW = width * 0.8;
    const cardH = s(185);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;
    const r = s(20);

    const card = this.add.graphics().setDepth(4001);
    card.fillStyle(0xFFF8F0, 1);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, r);
    card.lineStyle(s(1.5), 0xF8BBD0, 0.5);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, r);
    allElements.push(card);

    // Item icon
    let emojiObj: Phaser.GameObjects.GameObject;
    const gardenTexKey = `${chainId}_${tier}`;
    if (this.textures.exists(gardenTexKey)) {
      emojiObj = this.add.image(width / 2, cardY + s(30), gardenTexKey)
        .setDisplaySize(s(40), s(40)).setDepth(4002);
    } else {
      emojiObj = this.add.text(width / 2, cardY + s(30), name.charAt(0), {
        fontSize: fs(30), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
      }).setOrigin(0.5).setDepth(4002);
    }
    allElements.push(emojiObj);

    const title = this.add.text(width / 2, cardY + s(62), `Add ${name} to your garden!`, {
      fontSize: fs(14), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
      align: 'center', wordWrap: { width: cardW - s(24) },
    }).setOrigin(0.5).setDepth(4002);
    allElements.push(title);

    const subtitle = this.add.text(width / 2, cardY + s(82),
      `Placing at "${nextSlot.label}"`, {
      fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT, align: 'center',
    }).setOrigin(0.5).setDepth(4002);
    allElements.push(subtitle);

    const placed = this.gardenManager.count;
    const total = this.gardenManager.totalSlots;
    const progressText = this.add.text(width / 2, cardY + s(100),
      `Garden: ${placed}/${total} filled`, {
      fontSize: fs(9), color: '#B07A9E', fontFamily: FONT,
    }).setOrigin(0.5).setDepth(4002);
    allElements.push(progressText);

    const btnW = s(85), btnH = s(34);
    const gap = s(12);

    const keepBg = this.add.graphics().setDepth(4002);
    keepBg.fillStyle(0xA8D8EA, 1);
    keepBg.fillRoundedRect(width / 2 - btnW - gap / 2, cardY + cardH - s(52), btnW, btnH, btnH / 2);
    allElements.push(keepBg);

    const keepText = this.add.text(width / 2 - btnW / 2 - gap / 2, cardY + cardH - s(35), 'Keep', {
      fontSize: fs(12), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5).setDepth(4003);
    allElements.push(keepText);

    const keepZone = this.add.zone(width / 2 - btnW / 2 - gap / 2, cardY + cardH - s(35), btnW, btnH)
      .setInteractive().setDepth(4003);
    allElements.push(keepZone);

    const placeBg = this.add.graphics().setDepth(4002);
    placeBg.fillStyle(0xEC407A, 1);
    placeBg.fillRoundedRect(width / 2 + gap / 2, cardY + cardH - s(52), btnW, btnH, btnH / 2);
    allElements.push(placeBg);

    const placeText = this.add.text(width / 2 + btnW / 2 + gap / 2, cardY + cardH - s(35), 'Place!', {
      fontSize: fs(12), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5).setDepth(4003);
    allElements.push(placeText);

    const placeZone = this.add.zone(width / 2 + btnW / 2 + gap / 2, cardY + cardH - s(35), btnW, btnH)
      .setInteractive().setDepth(4003);
    allElements.push(placeZone);

    const cleanup = () => { allElements.forEach(o => o.destroy()); };

    keepZone.on('pointerdown', () => cleanup());

    placeZone.on('pointerdown', () => {
      this.items.delete(item.data_.id);
      this.markBoardDirty(); // PERF: invalidate cached board matches
      this.board.setOccupied(item.data_.col, item.data_.row, null);
      item.destroy();

      this.gardenManager.place(chainId, tier, emoji, name);

      this.mascot.react('excited');
      const gardenCount = this.gardenManager.count;
      const messages = [
        `${name} looks beautiful there!`,
        `Love it! ${gardenCount} decorations now!`,
        'The garden is coming alive!',
        'So pretty! Keep collecting!',
      ];
      this.mascot.showSpeech(messages[Phaser.Math.Between(0, messages.length - 1)], 3500);

      cleanup();
      this.updateUI();
      this.saveGame();
    });
  }

  private onToggleGardenView(): void {
    const isActive = this.gardenManager.toggleGardenView();
    this.sound_.buttonPress();
    if (isActive) {
      if (this.gardenManager.count === 0) {
        this.mascot.showSpeech('No decorations yet! Merge to max tier to unlock them.', 4000);
      } else {
        this.mascot.showSpeech(`Your garden has ${this.gardenManager.count} decorations!`, 3000);
      }
    }
    this.updateUI();
  }

  private playDiscoveryAnimation(item: MergeItem): void {
    const x = item.x;
    const y = item.y;

    // Golden glow expanding from item
    const glow = this.add.graphics();
    glow.fillStyle(0xFFD700, 0.3);
    glow.fillCircle(0, 0, s(5));
    glow.setPosition(x, y).setDepth(1500);
    this.tweens.add({
      targets: glow, scaleX: 6, scaleY: 6, alpha: 0,
      duration: 500, ease: 'Power2',
      onComplete: () => glow.destroy(),
    });

    // "NEW!" badge
    const badge = this.add.text(x, y - s(30), 'NEW!', {
      fontSize: fs(16), color: '#FFD700', fontFamily: FONT, fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: s(3),
      shadow: { offsetX: 0, offsetY: s(2), color: 'rgba(0,0,0,0.15)', blur: s(4), fill: true },
    }).setOrigin(0.5).setDepth(2500).setScale(0);

    this.tweens.add({
      targets: badge, scaleX: 1.3, scaleY: 1.3, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: badge, scaleX: 1, scaleY: 1, duration: 100,
          onComplete: () => {
            this.tweens.add({
              targets: badge, y: y - s(60), alpha: 0,
              delay: 1200, duration: 500,
              onComplete: () => badge.destroy(),
            });
          }
        });
      }
    });

    // Gold sparkle particles
    const goldColors = [0xFFD700, 0xFFECB3, 0xFFF176, 0xFFB300];
    for (let i = 0; i < 8; i++) {
      const p = this.add.graphics();
      const color = goldColors[Phaser.Math.Between(0, goldColors.length - 1)];
      p.fillStyle(color, 0.9);
      p.fillCircle(0, 0, s(Phaser.Math.Between(2, 5)));
      p.setPosition(x, y).setDepth(2000);
      const angle = (i / 8) * Math.PI * 2;
      const dist = s(Phaser.Math.Between(25, 45));
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - s(10),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 600 + Phaser.Math.Between(0, 200),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    // Mascot reacts (2s for routine speech)
    const discoveryLines = [
      'Ooh, what\'s this?', 'A new discovery!', 'So pretty!',
      'I\'ve never seen this before!', 'How beautiful!',
    ];
    this.mascot.showSpeech(discoveryLines[Phaser.Math.Between(0, discoveryLines.length - 1)], 2000);
  }

  private onClaimOrder(orderIdx: number): void {
    // Get character for dialogue before claiming (which removes the order)
    const orderBefore = this.orderSystem.getActiveOrders()[orderIdx];
    const charForDialogue = orderBefore ? CHARACTERS.find(c => c.id === orderBefore.def.characterId) : null;

    const rewards = this.orderSystem.claimOrder(orderIdx);
    if (!rewards) return;
    this.sound_.complete();

    // Apply event coin multiplier to rewards
    const coinMult = this.eventSystem?.getCoinMultiplier() ?? 1;
    let xpGained = 0;
    let gemsGained = 0;
    for (const r of rewards) {
      if (r.type === 'coins') r.amount = Math.round(r.amount * coinMult);
      if (r.type === 'xp') xpGained += r.amount;
      if (r.type === 'gems') gemsGained += r.amount;
    }
    if (xpGained > 0) this.addXP(xpGained);
    if (gemsGained > 0) this.gems = Math.min(this.gems + gemsGained, 999999);

    // Character completion dialogue
    if (charForDialogue && charForDialogue.completions?.length) {
      const line = charForDialogue.completions[Phaser.Math.Between(0, charForDialogue.completions.length - 1)];
      this.mascot.showSpeech(`${charForDialogue.name}: "${line}"`, 3000);
    }

    // Queue the order complete celebration (priority 3)
    const rewardsCopy = [...rewards];
    this.queuePopup('order', 3, () => this.showOrderCompletePopup(rewardsCopy));
    this.updateUI();
    this.saveGame();
    // Check story beats after order celebration settles
    this.time.delayedCall(3500, () => this.checkStoryBeats());
  }

  private showOrderCompletePopup(rewards: { type: string; amount: number }[]): void {
    const { width, height } = this.scale;
    const coinReward = rewards.find(r => r.type === 'coins');
    const gemReward = rewards.find(r => r.type === 'gems');

    // Camera shake
    this.cameras.main.shake(200, 0.01);

    // White screen flash
    const flash = this.add.graphics().setDepth(2999);
    flash.fillStyle(0xFFFFFF, 0.6);
    flash.fillRect(0, 0, width, height);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 300,
      onComplete: () => flash.destroy(),
    });

    // Floating reward text
    let popupDismissed = false;
    const dismissPopup = () => {
      if (popupDismissed) return;
      popupDismissed = true;
      this.onPopupDismissed();
    };

    if (coinReward) {
      const ct = this.add.text(width / 2, height / 2 - s(10), `+${coinReward.amount} coins`, {
        fontSize: fs(24), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '700',
        stroke: '#FFFFFF', strokeThickness: s(3),
      }).setOrigin(0.5).setDepth(3000).setScale(0);
      this.tweens.add({
        targets: ct, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: ct, y: `-=${s(50)}`, alpha: 0, delay: 1000, duration: 600,
            onComplete: () => { ct.destroy(); dismissPopup(); },
          });
        }
      });
    }

    if (gemReward) {
      const gt = this.add.text(width / 2, height / 2 + s(20), `+${gemReward.amount} gems`, {
        fontSize: fs(20), color: TEXT.ACCENT, fontFamily: FONT, fontStyle: '700',
        stroke: '#FFFFFF', strokeThickness: s(3),
      }).setOrigin(0.5).setDepth(3000).setScale(0);
      this.tweens.add({
        targets: gt, scaleX: 1, scaleY: 1, duration: 300, delay: 100, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: gt, y: `-=${s(50)}`, alpha: 0, delay: 1000, duration: 600,
            onComplete: () => { gt.destroy(); if (!coinReward) dismissPopup(); },
          });
        }
      });
    }

    if (!coinReward && !gemReward) {
      this.time.delayedCall(1500, () => dismissPopup());
    }

    // Confetti burst: 30 particles with radial explosion and gravity
    const confettiColors = [0xFF9CAD, 0xFFB3D9, 0xA8D8EA, 0xA8E6CF, 0xFFECB3, 0xC8A8E9];
    for (let i = 0; i < 30; i++) {
      const p = this.add.graphics().setDepth(3001);
      const color = confettiColors[Phaser.Math.Between(0, confettiColors.length - 1)];
      const pSize = s(Phaser.Math.Between(3, 6));
      p.fillStyle(color, 0.95);
      p.fillCircle(0, 0, pSize);
      p.setPosition(width / 2, height / 2);

      const angle = (i / 30) * Math.PI * 2;
      const dist = s(40 + Phaser.Math.Between(0, 40));
      const targetX = width / 2 + Math.cos(angle) * dist;
      const targetY = height / 2 + Math.sin(angle) * dist + s(80);

      this.tweens.add({
        targets: p,
        x: targetX, y: targetY,
        alpha: 0, scaleX: 0, scaleY: 0,
        rotation: Phaser.Math.FloatBetween(-2, 2),
        duration: 800 + Phaser.Math.Between(0, 300),
        delay: Phaser.Math.Between(0, 80),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    this.mascot.react('excited');
    this.mascot.showSpeech('Order complete!', 2000);
  }

  /**
   * Handle tap on an order card in the UI -- find the first matching board item,
   * animate it flying to the order bar, fulfill one slot, and check completion.
   */
  private onClaimOrderItem(orderIdx: number): void {
    const orders = this.orderSystem.getActiveOrders();
    const order = orders[orderIdx];
    if (!order || order.completed) return;

    // Find the first unfulfilled item slot and a matching board item
    for (let si = 0; si < order.def.items.length; si++) {
      const req = order.def.items[si];
      if (order.progress[si] >= req.quantity) continue;

      // Search board items for a match
      let matchItem: MergeItem | null = null;
      this.items.forEach(item => {
        if (!matchItem && item.data_.chainId === req.chainId && item.data_.tier === req.tier) {
          matchItem = item;
        }
      });

      if (!matchItem) continue;

      // Found a match -- consume it from the board
      const mi = matchItem as MergeItem;
      this.items.delete(mi.data_.id);
      this.markBoardDirty(); // PERF: invalidate cached board matches
      this.board.setOccupied(mi.data_.col, mi.data_.row, null);
      mi.disableInteractive();

      // Calculate target Y for the order bar (top of screen)
      const orderBarY = SIZES.TOP_BAR + SIZES.ORDER_BAR / 2;

      // Animate item flying to order bar area
      this.tweens.add({
        targets: mi, y: orderBarY, alpha: 0, scaleX: 0.3, scaleY: 0.3,
        duration: 400, ease: 'Power2',
        onComplete: () => mi.destroy(),
      });

      this.sound_.merge(req.tier);
      haptic('light');

      const completed = this.orderSystem.fulfillItem(orderIdx, si);
      if (completed) {
        // Use order ID for the delayed claim (index-safe)
        const orderId = order.def.id;
        this.time.delayedCall(450, () => this.onClaimOrderById(orderId));
      }
      // Always update UI after consuming an item (shows progress change)
      this.updateUI();
      this.saveGame();
      return; // Only consume one item per tap
    }

    // No matching item found -- show character idle dialogue
    const char = CHARACTERS.find(c => c.id === order.def.characterId);
    if (char?.idles?.length) {
      const idle = char.idles[Phaser.Math.Between(0, char.idles.length - 1)];
      this.mascot.showSpeech(`${char.name}: "${idle}"`, 2500);
    } else {
      this.mascot.showSpeech('No matching items on the board!', 2000);
    }
  }

  /** Claim a completed order by its definition ID (index-safe for delayed calls) */
  private onClaimOrderById(orderId: string): void {
    const rewards = this.orderSystem.claimOrderById(orderId);
    if (!rewards) return;
    this.sound_.complete();

    // Apply event coin multiplier
    const coinMult = this.eventSystem?.getCoinMultiplier() ?? 1;
    let xpGained = 0;
    let gemsGained = 0;
    for (const r of rewards) {
      if (r.type === 'coins') r.amount = Math.round(r.amount * coinMult);
      if (r.type === 'xp') xpGained += r.amount;
      if (r.type === 'gems') gemsGained += r.amount;
    }
    if (xpGained > 0) this.addXP(xpGained);
    if (gemsGained > 0) this.gems = Math.min(this.gems + gemsGained, 999999);

    // Queue the order complete celebration (priority 3)
    const rewardsCopy = [...rewards];
    this.queuePopup('order', 3, () => this.showOrderCompletePopup(rewardsCopy));
    this.updateUI();
    this.saveGame();
    // Check story beats after order celebration settles
    this.time.delayedCall(3500, () => this.checkStoryBeats());
  }

  private checkAchievements(newChainId?: string, newTier?: number): void {
    const newlyUnlocked = this.achievementSystem.check({
      totalMerges: this.totalMerges,
      level: this.playerLevel,
      collection: this.collection,
      newChainId, newTier,
    });
    for (const ach of newlyUnlocked) {
      // Queue achievement toasts (priority 2 = quest-level)
      this.queuePopup('quest', 2, () => this.showAchievementToast(ach));
    }
  }

  private showAchievementToast(ach: AchievementDef): void {
    this.sound_.achievement();
    const { width } = this.scale;
    const toastW = width * 0.75;
    const toastH = s(52);
    const toastX = (width - toastW) / 2;
    const toastY = -toastH;

    const container = this.add.container(0, 0).setDepth(4000);

    const bg = this.add.graphics();
    bg.fillStyle(0xFFF0F5, 0.97);
    bg.fillRoundedRect(toastX, toastY, toastW, toastH, toastH / 2);
    bg.lineStyle(s(1.5), 0xD4B8E8, 0.5);
    bg.strokeRoundedRect(toastX, toastY, toastW, toastH, toastH / 2);
    container.add(bg);

    // Canvas-drawn badge rosette icon
    const badgeG = this.add.graphics();
    const bIconX = toastX + s(26), bIconY = toastY + toastH / 2, bIconR = s(10);
    badgeG.fillStyle(0xD4B8E8, 1);
    for (let pi = 0; pi < 8; pi++) {
      const pa = (pi / 8) * Math.PI * 2;
      badgeG.fillCircle(bIconX + Math.cos(pa) * bIconR * 0.6, bIconY + Math.sin(pa) * bIconR * 0.6, bIconR * 0.35);
    }
    badgeG.fillStyle(0xFFD700, 1);
    badgeG.fillCircle(bIconX, bIconY, bIconR * 0.4);
    badgeG.fillStyle(0xFFFFFF, 0.4);
    badgeG.fillCircle(bIconX - bIconR * 0.1, bIconY - bIconR * 0.12, bIconR * 0.12);
    container.add(badgeG);

    const title = this.add.text(toastX + s(48), toastY + s(12), ach.name, {
      fontSize: fs(12), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    });
    container.add(title);

    const desc = this.add.text(toastX + s(48), toastY + s(30), ach.description, {
      fontSize: fs(9), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    });
    container.add(desc);

    // Slide in from top
    this.tweens.add({
      targets: container, y: s(110), duration: 400, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: container, y: -toastH - s(20), duration: 300, ease: 'Power2',
            onComplete: () => { container.destroy(); this.onPopupDismissed(); },
          });
        });
      }
    });

    this.mascot.showSpeech('Badge earned!', 2000);
  }

  // PERF: Mark board items as changed so updateUI recalculates matches
  private markBoardDirty(): void {
    this.boardItemMapDirty = true;
  }

  private updateUI(): void {
    // PERF: Only rebuild board item map when items have actually changed
    if (this.boardItemMapDirty) {
      const boardItemMap = new Map<string, { chainId: string; tier: number }>();
      this.items.forEach((item, id) => {
        boardItemMap.set(id, { chainId: item.data_.chainId, tier: item.data_.tier });
      });
      this.cachedBoardMatches = this.orderSystem.findBoardMatches(boardItemMap);
      this.boardItemMapDirty = false;
    }
    const boardMatches = this.cachedBoardMatches;

    this.scene.get('UIScene').events.emit('update-ui', {
      gems: this.gems, coins: this.orderSystem.coins, level: this.playerLevel,
      xp: this.playerXP, xpToNext: this.xpToNext,
      quests: this.questSystem.getActiveQuests(),
      orders: this.orderSystem.getActiveOrders(),
      boardMatches,
      gardenCount: this.gardenManager.count,
      gardenAvailable: this.gardenManager.availableSlots,
      gardenViewActive: this.gardenManager.isGardenViewActive,
      // New: event and timed order data for UI
      activeEvent: this.eventSystem?.getPrimaryEvent() ?? null,
      eventBannerText: this.eventSystem?.getBannerText() ?? '',
      timedOrder: this.timedOrderSystem?.getActiveOrder() ?? null,
      timedOrderRemaining: this.timedOrderSystem?.getRemainingTime() ?? 0,
    });
  }

  // PERF: Debounced save -- coalesces rapid save calls to max 1 per second.
  // Immediate saves still happen on visibility change (app background).
  private saveGame(): void {
    this.savePending = true;
    if (this.saveDebounceTimer) return; // Already scheduled
    this.saveDebounceTimer = this.time.delayedCall(1000, () => {
      this.saveDebounceTimer = null;
      if (this.savePending) {
        this.savePending = false;
        this.saveGameImmediate();
      }
    });
  }

  /** Force an immediate save (used on visibility change / shutdown) */
  private saveGameImmediate(): void {
    this.savePending = false;
    if (this.saveDebounceTimer) {
      this.saveDebounceTimer.remove(false);
      this.saveDebounceTimer = null;
    }
    const items: MergeItemData[] = [];
    this.items.forEach(item => items.push(item.getData()));
    const gens = this.generators.map(g => ({ genId: g.genDef.id, genTier: g.genTier, col: g.col, row: g.row, itemId: g.itemId, lastAutoProduceTime: g.lastAutoProduceTime }));
    const coll: { chainId: string; maxTier: number }[] = [];
    this.collection.forEach((maxTier, chainId) => coll.push({ chainId, maxTier }));

    SaveSystem.save({
      version: 8, timestamp: Date.now(),
      player: { level: this.playerLevel, xp: this.playerXP, xpToNext: this.xpToNext, gems: this.gems, totalMerges: this.totalMerges },
      board: { cols: 6, rows: 8, items, generators: gens },
      quests: this.questSystem.getSaveData(),
      collection: coll,
      storage: this.storageTray.getStoredItems(),
      achievements: this.achievementSystem.getUnlocked(),
      garden: this.gardenManager.getDecorations(),
      orders: this.orderSystem.getSaveData(),
      login: { ...this.loginData },
      completedStoryBeats: [...this.completedStoryBeats],
    });
    // Timed orders save separately to avoid save migration complexity
    try {
      localStorage.setItem('m3rg3r_timed_orders', JSON.stringify(this.timedOrderSystem.getSaveData()));
    } catch { /* ignore */ }
  }

  // ─── FEATURE: Merge Chain Preview (long-press) ───

  private showChainPreview(itemData: MergeItemData, itemX: number, itemY: number): void {
    // Dismiss any existing preview
    this.dismissPreview();

    const chain = getChain(itemData.chainId);
    if (!chain) return;

    const { width, height } = this.scale;
    const container = this.add.container(0, 0).setDepth(5000);
    this.previewContainer = container;

    // Semi-transparent dismiss overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.01);
    overlay.fillRect(0, 0, width, height);
    const overlayZone = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    overlayZone.on('pointerdown', () => this.dismissPreview());
    container.add([overlay, overlayZone]);

    // Determine which items to show: up to 4, centered on current item
    const items = chain.items;
    const currentIdx = items.findIndex(i => i.tier === itemData.tier);
    if (currentIdx < 0) return;

    // Show a window of items: 2 before current (if available), current, and remaining up to 4 total
    const maxShow = Math.min(items.length, 4);
    let startIdx = Math.max(0, currentIdx - 1);
    let endIdx = startIdx + maxShow;
    if (endIdx > items.length) { endIdx = items.length; startIdx = Math.max(0, endIdx - maxShow); }

    const visibleItems = items.slice(startIdx, endIdx);
    const currentVisIdx = currentIdx - startIdx;

    // Card dimensions
    const itemSlotW = s(38);
    const arrowW = s(14);
    const numItems = visibleItems.length;
    const cardW = numItems * itemSlotW + (numItems - 1) * arrowW + s(28);
    const cardH = s(68);
    const cornerR = s(14);

    // Position above the item, clamped to screen
    let cardX = itemX - cardW / 2;
    let cardY = itemY - s(60) - cardH;
    if (cardX < s(8)) cardX = s(8);
    if (cardX + cardW > width - s(8)) cardX = width - s(8) - cardW;
    if (cardY < SIZES.TOP_BAR + s(4)) cardY = itemY + s(50); // Flip below if too high

    // Card background with chain color
    const chainColor = PREVIEW_CHAIN_COLORS[itemData.chainId] || 0xFFF0F5;
    const cardBg = this.add.graphics();
    // Shadow
    cardBg.fillStyle(0x000000, 0.08);
    cardBg.fillRoundedRect(cardX + s(2), cardY + s(3), cardW, cardH, cornerR);
    // Main card
    cardBg.fillStyle(chainColor, 0.95);
    cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, cornerR);
    // White inner
    cardBg.fillStyle(0xFFFFFF, 0.6);
    cardBg.fillRoundedRect(cardX + s(3), cardY + s(3), cardW - s(6), cardH - s(6), cornerR - s(2));
    // Border
    cardBg.lineStyle(s(1.5), chainColor, 0.8);
    cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, cornerR);
    container.add(cardBg);

    // Chain name at top
    const chainLabel = this.add.text(cardX + cardW / 2, cardY + s(10), chain.name, {
      fontSize: fs(8), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5, 0);
    container.add(chainLabel);

    // Draw items in a row
    const rowY = cardY + s(38);
    let curX = cardX + s(14);

    for (let i = 0; i < visibleItems.length; i++) {
      const item = visibleItems[i];
      const isCurrent = i === currentVisIdx;
      const isMax = item.tier === items[items.length - 1].tier;
      const centerX = curX + itemSlotW / 2;

      // Glow ring for current item
      if (isCurrent) {
        const glow = this.add.graphics();
        glow.fillStyle(0xFFD700, 0.25);
        glow.fillCircle(centerX, rowY, s(18));
        glow.lineStyle(s(2), 0xFFD700, 0.7);
        glow.strokeCircle(centerX, rowY, s(16));
        container.add(glow);

        // Pulse the glow
        this.tweens.add({
          targets: glow, alpha: 0.5, duration: 600,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }

      // Item icon: use rendered texture if available
      const previewTexKey = `${itemData.chainId}_${item.tier}`;
      if (this.textures.exists(previewTexKey)) {
        const previewImg = this.add.image(centerX, rowY - s(2), previewTexKey);
        const displaySize = isCurrent ? s(20) : s(16);
        previewImg.setDisplaySize(displaySize, displaySize);
        container.add(previewImg);
      } else {
        const itemInitial = this.add.text(centerX, rowY - s(2), item.name.charAt(0), {
          fontSize: fs(isCurrent ? 16 : 13), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
        }).setOrigin(0.5);
        container.add(itemInitial);
      }

      // Tier label
      const label = isCurrent ? `T${item.tier}` : `T${item.tier}`;
      const labelColor = isCurrent ? TEXT.ACCENT : isMax ? TEXT.GOLD : TEXT.SECONDARY;
      const tierText = this.add.text(centerX, rowY + s(14), label, {
        fontSize: fs(7), color: labelColor, fontFamily: FONT_BODY, fontStyle: isCurrent ? '700' : '400',
      }).setOrigin(0.5);
      container.add(tierText);

      // Arrow to next item
      if (i < visibleItems.length - 1) {
        const arrowX = curX + itemSlotW + arrowW / 2;
        const arrow = this.add.text(arrowX, rowY - s(2), '\u2192', {
          fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT,
        }).setOrigin(0.5);
        container.add(arrow);
      }

      curX += itemSlotW + arrowW;
    }

    // Truncation indicators
    if (startIdx > 0) {
      const dots = this.add.text(cardX + s(6), rowY - s(2), '...', {
        fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(0, 0.5);
      container.add(dots);
    }
    if (endIdx < items.length) {
      const dots = this.add.text(cardX + cardW - s(6), rowY - s(2), '...', {
        fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT,
      }).setOrigin(1, 0.5);
      container.add(dots);
    }

    // Slide in animation
    container.setAlpha(0);
    container.y = s(8);
    this.tweens.add({
      targets: container, alpha: 1, y: 0, duration: 200, ease: 'Back.easeOut',
    });
  }

  private dismissPreview(): void {
    if (this.previewContainer) {
      const c = this.previewContainer;
      this.previewContainer = null;
      this.tweens.add({
        targets: c, alpha: 0, duration: 120, onComplete: () => c.destroy(),
      });
    }
  }

  // ─── FEATURE: Daily Login Rewards ───

  private checkDailyLogin(): void {
    const result = SaveSystem.checkLoginStreak(this.loginData);
    if (!result) return; // Already claimed today

    // Show the daily reward popup
    this.showDailyRewardPopup(result.streak, result.reward);
  }

  private showDailyRewardPopup(streak: number, reward: typeof DAILY_REWARDS[number]): void {
    const { width, height } = this.scale;
    const container = this.add.container(0, 0).setDepth(6000);

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x6D3A5B, 0.45);
    overlay.fillRect(0, 0, width, height);
    container.add(overlay);

    // Card
    const cardW = width * 0.82;
    const cardH = s(220);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2 - s(10);
    const r = s(22);

    const card = this.add.graphics();
    // Shadow
    card.fillStyle(0x000000, 0.1);
    card.fillRoundedRect(cardX + s(3), cardY + s(4), cardW, cardH, r);
    // Background
    card.fillStyle(0xFFF8F0, 1);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, r);
    // Top accent strip
    card.fillStyle(reward.type === 'gems' ? 0xD4A5FF : 0xFFD700, 0.3);
    card.fillRoundedRect(cardX, cardY, cardW, s(50), { tl: r, tr: r, bl: 0, br: 0 });
    // Border
    card.lineStyle(s(1.5), reward.type === 'gems' ? 0xD4A5FF : 0xFFD700, 0.5);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, r);
    container.add(card);

    // Banner title (no emoji)
    const title = this.add.text(width / 2, cardY + s(25), `Day ${streak} Reward!`, {
      fontSize: fs(18), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);
    container.add(title);

    // Reward amount
    const rewardLabel = reward.type === 'gems' ? 'gems' : 'coins';
    const rewardColor = reward.type === 'gems' ? '#D4A5FF' : '#FFD700';
    const amountText = this.add.text(width / 2, cardY + s(70), `+${reward.amount} ${rewardLabel}`, {
      fontSize: fs(32), color: rewardColor, fontFamily: FONT, fontStyle: '700',
      stroke: '#FFFFFF', strokeThickness: s(3),
    }).setOrigin(0.5).setScale(0);
    container.add(amountText);

    // Bounce in the reward amount
    this.tweens.add({
      targets: amountText, scaleX: 1.2, scaleY: 1.2, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: amountText, scaleX: 1, scaleY: 1, duration: 150 });
      }
    });

    // 7-dot progress bar
    const dotSpacing = s(28);
    const dotsStartX = width / 2 - ((7 - 1) * dotSpacing) / 2;
    const dotsY = cardY + s(120);

    for (let day = 1; day <= 7; day++) {
      const dx = dotsStartX + (day - 1) * dotSpacing;
      const dotGfx = this.add.graphics();

      if (day < streak) {
        // Claimed (filled)
        dotGfx.fillStyle(0xA8E6CF, 1);
        dotGfx.fillCircle(dx, dotsY, s(9));
        dotGfx.lineStyle(s(1.5), 0x81C784, 0.8);
        dotGfx.strokeCircle(dx, dotsY, s(9));
        const check = this.add.text(dx, dotsY, '✓', {
          fontSize: fs(9), color: TEXT.WHITE, fontFamily: FONT, fontStyle: '700',
        }).setOrigin(0.5);
        container.add(check);
      } else if (day === streak) {
        // Current day (highlighted with glow)
        dotGfx.fillStyle(reward.type === 'gems' ? 0xD4A5FF : 0xFFD700, 1);
        dotGfx.fillCircle(dx, dotsY, s(11));
        dotGfx.lineStyle(s(2), 0xFFFFFF, 0.9);
        dotGfx.strokeCircle(dx, dotsY, s(11));
        this.tweens.add({
          targets: dotGfx, alpha: 0.6, duration: 500,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      } else {
        // Future (empty)
        dotGfx.fillStyle(0xE0E0E0, 0.5);
        dotGfx.fillCircle(dx, dotsY, s(8));
        dotGfx.lineStyle(s(1), 0xBDBDBD, 0.4);
        dotGfx.strokeCircle(dx, dotsY, s(8));
      }
      container.add(dotGfx);

      // Day number below dots
      const dayLabel = this.add.text(dx, dotsY + s(16), `${day}`, {
        fontSize: fs(7), color: day === streak ? TEXT.ACCENT : TEXT.SECONDARY,
        fontFamily: FONT_BODY, fontStyle: day === streak ? '700' : '400',
      }).setOrigin(0.5);
      container.add(dayLabel);
    }

    // "Streak!" label
    const streakLabel = this.add.text(width / 2, dotsY + s(32), `${streak}-day streak!`, {
      fontSize: fs(10), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(0.5);
    container.add(streakLabel);

    // Auto-claim after 1.5 seconds
    this.time.delayedCall(1500, () => {
      // Apply reward
      if (reward.type === 'gems') {
        this.gems = Math.min(this.gems + reward.amount, 999999);
      } else {
        this.orderSystem.coins += reward.amount;
      }

      // Update login data
      this.loginData = SaveSystem.claimDailyReward(this.loginData, streak);

      // Fly animation for reward (canvas-drawn gems/coins)
      for (let i = 0; i < 6; i++) {
        const flyG = this.add.graphics().setDepth(6001);
        const flyX = width / 2 + Phaser.Math.Between(-s(40), s(40));
        const flyY = cardY + s(70);
        flyG.setPosition(flyX, flyY);
        if (reward.type === 'gems') {
          // Small diamond
          const gr = s(5);
          flyG.fillStyle(0x87CEEB, 1);
          flyG.beginPath();
          flyG.moveTo(0, -gr); flyG.lineTo(gr * 0.8, -gr * 0.2);
          flyG.lineTo(gr * 0.5, gr); flyG.lineTo(-gr * 0.5, gr);
          flyG.lineTo(-gr * 0.8, -gr * 0.2);
          flyG.closePath(); flyG.fillPath();
        } else {
          // Small coin
          const cr = s(5);
          flyG.fillStyle(0xFFD700, 1);
          flyG.fillCircle(0, 0, cr);
          flyG.fillStyle(0xFFFFFF, 0.35);
          flyG.fillCircle(-cr * 0.2, -cr * 0.2, cr * 0.3);
        }
        this.tweens.add({
          targets: flyG,
          x: reward.type === 'gems' ? width - s(60) : s(60),
          y: SIZES.TOP_BAR / 2,
          alpha: 0, scaleX: 0.3, scaleY: 0.3,
          duration: 600 + i * 80,
          delay: i * 60,
          ease: 'Power2',
          onComplete: () => flyG.destroy(),
        });
      }

      // Day 7 special confetti
      if (reward.special) {
        this.createConfetti();
        this.mascot.react('excited');
        this.mascot.showSpeech('Perfect week!', 2000);
      } else {
        this.mascot.react('happy');
        const lines = ['Welcome back!', 'Nice streak!', 'Keep it up!'];
        this.mascot.showSpeech(lines[Phaser.Math.Between(0, lines.length - 1)], 2000);
      }

      this.updateUI();
      this.saveGame();

      // Dismiss popup after a short pause
      this.time.delayedCall(600, () => {
        this.tweens.add({
          targets: container, alpha: 0, duration: 300,
          onComplete: () => container.destroy(),
        });
      });
    });

    // Slide in animation for the whole popup
    container.setAlpha(0);
    this.tweens.add({
      targets: container, alpha: 1, duration: 300, ease: 'Power2',
    });
  }

  // ─── FEATURE: Timed Bonus Orders ───

  private showTimedOrderOffer(offer: TimedOrderDef): void {
    const { width, height } = this.scale;
    const container = this.add.container(0, 0).setDepth(6000);

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x6D3A5B, 0.4);
    overlay.fillRect(0, 0, width, height);
    container.add(overlay);

    // Card
    const cardW = width * 0.85;
    const cardH = s(200);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;
    const r = s(20);

    const card = this.add.graphics();
    card.fillStyle(0x000000, 0.1);
    card.fillRoundedRect(cardX + s(3), cardY + s(4), cardW, cardH, r);
    card.fillStyle(0xFFF8F0, 1);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, r);
    // Urgency accent strip
    card.fillStyle(0xFF6B6B, 0.3);
    card.fillRoundedRect(cardX, cardY, cardW, s(45), { tl: r, tr: r, bl: 0, br: 0 });
    card.lineStyle(s(1.5), 0xFF6B6B, 0.5);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, r);
    container.add(card);

    // Title
    const diffLabel = offer.difficulty === 'quick' ? 'Quick' : offer.difficulty === 'sprint' ? 'Sprint' : 'Marathon';
    const timeLabel = Math.round(offer.timeLimitMs / 60000);
    const title = this.add.text(width / 2, cardY + s(22), `Timed Order! (${diffLabel} ${timeLabel}m)`, {
      fontSize: fs(16), color: '#C62828', fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);
    container.add(title);

    // Flavor text
    const flavor = this.add.text(width / 2, cardY + s(60), offer.flavorText, {
      fontSize: fs(12), color: TEXT.PRIMARY, fontFamily: FONT,
      wordWrap: { width: cardW - s(30) },
    }).setOrigin(0.5, 0);
    container.add(flavor);

    // Reward preview
    const coinReward = offer.rewards.find(r => r.type === 'coins');
    const gemReward = offer.rewards.find(r => r.type === 'gems');
    const rewardStr = [
      coinReward ? `${coinReward.amount} coins` : '',
      gemReward ? `${gemReward.amount} gems` : '',
    ].filter(Boolean).join(' + ');
    const rewardText = this.add.text(width / 2, cardY + s(100), `Reward: ${rewardStr}`, {
      fontSize: fs(14), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);
    container.add(rewardText);

    // Accept button
    const btnY = cardY + s(145);
    const btnW = s(90);
    const btnH = s(36);
    const acceptBg = this.add.graphics();
    acceptBg.fillStyle(0x81C784, 1);
    acceptBg.fillRoundedRect(width / 2 - btnW - s(10), btnY, btnW, btnH, s(18));
    const acceptTxt = this.add.text(width / 2 - btnW / 2 - s(10), btnY + btnH / 2, 'Accept!', {
      fontSize: fs(14), color: '#FFFFFF', fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);
    const acceptZone = this.add.zone(width / 2 - btnW / 2 - s(10), btnY + btnH / 2, btnW, btnH).setInteractive();
    acceptZone.on('pointerdown', () => {
      this.timedOrderSystem.acceptOrder(offer);
      this.mascot.showSpeech('Timer started! Go!', 2000);
      this.sound_.buttonPress();
      container.destroy();
      this.updateUI();
    });
    container.add([acceptBg, acceptTxt, acceptZone]);

    // Decline button
    const declineBg = this.add.graphics();
    declineBg.fillStyle(0xBDBDBD, 1);
    declineBg.fillRoundedRect(width / 2 + s(10), btnY, btnW, btnH, s(18));
    const declineTxt = this.add.text(width / 2 + btnW / 2 + s(10), btnY + btnH / 2, 'Skip', {
      fontSize: fs(13), color: '#FFFFFF', fontFamily: FONT, fontStyle: '600',
    }).setOrigin(0.5);
    const declineZone = this.add.zone(width / 2 + btnW / 2 + s(10), btnY + btnH / 2, btnW, btnH).setInteractive();
    declineZone.on('pointerdown', () => {
      this.timedOrderSystem.declineOrder();
      this.sound_.buttonPress();
      container.destroy();
    });
    container.add([declineBg, declineTxt, declineZone]);

    // Auto-dismiss after 15 seconds
    this.time.delayedCall(15000, () => {
      if (container.scene) {
        this.timedOrderSystem.declineOrder();
        container.destroy();
      }
    });
  }

  // ─── FEATURE: Story / Narrative System ───

  private checkStoryBeats(): void {
    const pending = getPendingBeats(this.completedStoryBeats, {
      level: this.playerLevel,
      totalOrders: this.orderSystem.totalCompleted,
      hasMaxTier: this.hasEverMergedMaxTier,
      hasGenMerge: this.hasEverMergedGen,
    });

    if (pending.length === 0) return;

    // Queue each pending beat through the global popup queue (priority 4 = story)
    for (const beat of pending) {
      // Mark as completed immediately to prevent re-triggers
      if (this.completedStoryBeats.includes(beat.id)) continue;
      this.completedStoryBeats.push(beat.id);
      this.queuePopup('story', 4, () => this.showStoryBeatPopup(beat));
    }
  }

  private showStoryBeatPopup(beat: StoryBeat): void {
    const char = CHARACTERS.find(c => c.id === beat.characterId);
    const charName = char?.name || '???';
    const charInitial = char?.name?.charAt(0) || '?';

    const { width, height } = this.scale;
    const storyContainer = this.add.container(0, 0).setDepth(5500);

    // NO full-screen backdrop -- story beats should not block game input
    // Just the dialogue card floats on top

    // Dialogue card
    const cardW = width * 0.88;
    const cardH = s(90);
    const cardX = (width - cardW) / 2;
    const cardY = height * 0.35;
    const r = s(16);

    const card = this.add.graphics();
    // Shadow
    card.fillStyle(0x000000, 0.1);
    card.fillRoundedRect(cardX + s(2), cardY + s(3), cardW, cardH, r);
    // Background
    card.fillStyle(0xFFF8F0, 0.97);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, r);
    // Accent border
    card.lineStyle(s(1.5), 0xF8BBD0, 0.6);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, r);
    storyContainer.add(card);

    // Character portrait (reuse pre-rendered textures from PreloadScene)
    const portraitSize = s(42);
    const portraitX = cardX + s(14) + portraitSize / 2;
    const portraitY = cardY + cardH / 2;
    const portraitKey = `char_${beat.characterId}`;

    if (this.textures.exists(portraitKey)) {
      const portrait = this.add.image(portraitX, portraitY, portraitKey);
      portrait.setDisplaySize(portraitSize, portraitSize);
      storyContainer.add(portrait);
    } else {
      // Fallback: character initial in a colored circle
      const fallbackG = this.add.graphics();
      fallbackG.fillStyle(0xF8BBD0, 0.8);
      fallbackG.fillCircle(portraitX, portraitY, portraitSize / 2);
      storyContainer.add(fallbackG);
      const initialText = this.add.text(portraitX, portraitY, charInitial, {
        fontSize: fs(18), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
      }).setOrigin(0.5);
      storyContainer.add(initialText);
    }

    // Character name
    const nameText = this.add.text(cardX + portraitSize + s(22), cardY + s(12), charName, {
      fontSize: fs(11), color: TEXT.ACCENT, fontFamily: FONT, fontStyle: '700',
    });
    storyContainer.add(nameText);

    // Dialogue text
    const dialogueText = this.add.text(
      cardX + portraitSize + s(22),
      cardY + s(30),
      beat.lines[0],
      {
        fontSize: fs(11), color: TEXT.PRIMARY, fontFamily: FONT_BODY,
        wordWrap: { width: cardW - portraitSize - s(40) },
        lineSpacing: s(3),
      }
    );
    storyContainer.add(dialogueText);

    // Reward display (if any)
    if (beat.reward) {
      const rewardParts: string[] = [];
      if (beat.reward.coins) rewardParts.push(`+${beat.reward.coins} coins`);
      if (beat.reward.gems) rewardParts.push(`+${beat.reward.gems} gems`);
      const rewardStr = rewardParts.join('  ');
      const rewardText = this.add.text(
        cardX + cardW - s(12),
        cardY + cardH - s(16),
        rewardStr,
        {
          fontSize: fs(9), color: TEXT.GOLD, fontFamily: FONT, fontStyle: '600',
        }
      ).setOrigin(1, 0.5);
      storyContainer.add(rewardText);
    }

    // Tap hint
    const tapHint = this.add.text(cardX + cardW - s(12), cardY + s(12), 'tap', {
      fontSize: fs(8), color: TEXT.SECONDARY, fontFamily: FONT_BODY,
    }).setOrigin(1, 0);
    this.tweens.add({ targets: tapHint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
    storyContainer.add(tapHint);

    // Slide in from below
    storyContainer.setAlpha(0);
    storyContainer.y = s(20);
    this.tweens.add({
      targets: storyContainer, alpha: 1, y: 0, duration: 300, ease: 'Back.easeOut',
    });

    // Mascot reacts to story
    this.mascot.react('happy');

    // Dismiss handler
    const dismiss = () => {
      if (!storyContainer.active) return;
      // Apply rewards
      if (beat.reward) {
        if (beat.reward.coins) this.orderSystem.coins += beat.reward.coins;
        if (beat.reward.gems) this.gems = Math.min(this.gems + (beat.reward.gems || 0), 999999);
        this.updateUI();
      }

      this.tweens.add({
        targets: storyContainer, alpha: 0, y: s(-10), duration: 200,
        onComplete: () => {
          storyContainer.destroy();
          this.saveGame();
          this.onPopupDismissed();
        },
      });
    };

    // Tap-to-dismiss zone (only covers the card, not the whole screen)
    const dismissZone = this.add.zone(cardX + cardW / 2, cardY + cardH / 2, cardW, cardH)
      .setInteractive().setDepth(5501);
    dismissZone.on('pointerdown', () => {
      dismissZone.destroy();
      if (autoDismissTimer) autoDismissTimer.destroy();
      dismiss();
    });
    storyContainer.add(dismissZone);

    // Auto-dismiss after 4 seconds (story beats are skippable by tapping)
    const autoDismissTimer = this.time.delayedCall(4000, () => {
      dismissZone.destroy();
      dismiss();
    });
  }

  // ─── POPUP QUEUE SYSTEM ───

  /**
   * Queue a popup to be shown. Only one popup shows at a time, with a minimum
   * gap between them. If the queue is too long, the lowest-priority items are dropped.
   */
  private queuePopup(type: string, priority: number, show: () => void): void {
    this.popupQueue.push({ type, priority, show });

    // Sort by priority descending (highest priority first)
    this.popupQueue.sort((a, b) => b.priority - a.priority);

    // Drop lowest-priority items if queue is too long
    if (this.popupQueue.length > GameScene.POPUP_MAX_QUEUED) {
      this.popupQueue.length = GameScene.POPUP_MAX_QUEUED;
    }

    this.processPopupQueue();
  }

  /**
   * Process the popup queue: show the next popup if no popup is active
   * and enough time has passed since the last one dismissed.
   */
  private processPopupQueue(): void {
    // Timeout failsafe: force reset if a popup has been active too long
    if (this.popupActive && this.popupActiveTimestamp > 0) {
      if (Date.now() - this.popupActiveTimestamp > GameScene.POPUP_TIMEOUT) {
        console.warn('[GameScene] Popup stuck for >' + GameScene.POPUP_TIMEOUT + 'ms, force resetting.');
        this.popupActive = false;
        this.popupActiveTimestamp = 0;
      }
    }

    if (this.popupActive || this.popupQueue.length === 0) return;

    const elapsed = Date.now() - this.lastPopupDismissTime;
    const remaining = GameScene.POPUP_MIN_GAP - elapsed;

    if (remaining > 0) {
      // Wait for the gap, then try again
      this.time.delayedCall(remaining, () => this.processPopupQueue());
      return;
    }

    const next = this.popupQueue.shift();
    if (!next) return;

    this.popupActive = true;
    this.popupActiveTimestamp = Date.now();
    next.show();
  }

  /**
   * Mark the current popup as dismissed and schedule the next one.
   */
  private onPopupDismissed(): void {
    this.popupActive = false;
    this.popupActiveTimestamp = 0;
    this.lastPopupDismissTime = Date.now();
    // Schedule next popup after the minimum gap
    if (this.popupQueue.length > 0) {
      this.time.delayedCall(GameScene.POPUP_MIN_GAP, () => this.processPopupQueue());
    }
  }

  private processOfflineProduction(_data: SaveData): void {
    const now = Date.now();
    const offlineCap = TIMING.AUTO_PRODUCE_OFFLINE_CAP;
    let totalProduced = 0;
    const totalCells = this.board.totalCols * this.board.totalRows;
    for (const gen of this.generators) {
      const lastTime = gen.lastAutoProduceTime;
      const interval = gen.getAutoProduceIntervalMs();
      const elapsed = now - lastTime;
      if (elapsed < interval) continue;
      const potential = Math.floor(elapsed / interval);
      const toSpawn = Math.min(potential, offlineCap);
      for (let i = 0; i < toSpawn; i++) {
        const emptyCount = this.board.getEmptyCount();
        const fullPct = 1 - (emptyCount / totalCells);
        if (fullPct >= TIMING.AUTO_PRODUCE_BOARD_FULL_PCT) break;
        const emptyCell = this.board.findEmptyCellNear(gen.col, gen.row);
        if (!emptyCell) break;
        const spawnTier = gen.rollSpawnTier();
        const item = this.spawnItem(gen.genDef.chainId, spawnTier, emptyCell.col, emptyCell.row);
        if (item) totalProduced++;
      }
      gen.lastAutoProduceTime = now;
    }
    if (totalProduced > 0) {
      this.time.delayedCall(1200, () => this.showWelcomeBackPopup(totalProduced));
    }
  }

  private showWelcomeBackPopup(itemCount: number): void {
    const { width, height } = this.scale;
    const container = this.add.container(0, 0).setDepth(5500);
    const overlay = this.add.graphics();
    overlay.fillStyle(0x6D3A5B, 0.3);
    overlay.fillRect(0, 0, width, height);
    container.add(overlay);
    const cardW = width * 0.72;
    const cardH = s(140);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2 - s(20);
    const r = s(20);
    const card = this.add.graphics();
    card.fillStyle(0x000000, 0.08);
    card.fillRoundedRect(cardX + s(2), cardY + s(3), cardW, cardH, r);
    card.fillStyle(0xFFF8F0, 1);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, r);
    card.fillStyle(0x25C486, 0.2);
    card.fillRoundedRect(cardX, cardY, cardW, s(44), { tl: r, tr: r, bl: 0, br: 0 });
    card.lineStyle(s(1.5), 0x25C486, 0.4);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, r);
    container.add(card);
    const title = this.add.text(width / 2, cardY + s(22), 'Welcome back!', {
      fontSize: fs(16), color: TEXT.PRIMARY, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5);
    container.add(title);
    const plural = itemCount === 1 ? 'item' : 'items';
    const msg = this.add.text(
      width / 2, cardY + s(65),
      'Your generators made ' + itemCount + ' ' + plural + '\nwhile you were away!',
      { fontSize: fs(12), color: TEXT.SECONDARY, fontFamily: FONT_BODY, align: 'center', lineSpacing: s(4) }
    ).setOrigin(0.5);
    container.add(msg);
    // Canvas-drawn blossom sparkle
    const sparkleG = this.add.graphics();
    const spX = width / 2, spY = cardY + s(105), spR = s(8);
    sparkleG.fillStyle(0xF8BBD0, 0.8);
    for (let pi = 0; pi < 5; pi++) {
      const pa = (pi / 5) * Math.PI * 2 - Math.PI / 2;
      sparkleG.fillEllipse(spX + Math.cos(pa) * spR * 0.4, spY + Math.sin(pa) * spR * 0.4, spR * 0.45, spR * 0.3);
    }
    sparkleG.fillStyle(0xFFD54F, 1);
    sparkleG.fillCircle(spX, spY, spR * 0.12);
    container.add(sparkleG);
    container.setAlpha(0);
    container.y = s(10);
    this.tweens.add({
      targets: container, alpha: 1, y: 0, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          this.tweens.add({
            targets: container, alpha: 0, y: -s(10), duration: 250, ease: 'Power2',
            onComplete: () => container.destroy(),
          });
        });
      }
    });
    this.mascot.react('happy');
    this.mascot.showSpeech('I kept working!', 2000);
  }

  /** Draw a canvas sparkle shape for ambient/celebration effects */
  private drawSparkleShape(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number, shape: string): void {
    g.fillStyle(color, 1);
    switch (shape) {
      case 'heart':
        g.fillCircle(cx - r * 0.3, cy - r * 0.15, r * 0.45);
        g.fillCircle(cx + r * 0.3, cy - r * 0.15, r * 0.45);
        g.fillTriangle(cx - r * 0.65, cy, cx + r * 0.65, cy, cx, cy + r * 0.7);
        break;
      case 'circle':
        g.fillCircle(cx, cy, r * 0.6);
        g.fillStyle(0xFFFFFF, 0.35);
        g.fillCircle(cx - r * 0.15, cy - r * 0.15, r * 0.2);
        break;
      case 'blossom':
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          g.fillEllipse(cx + Math.cos(a) * r * 0.35, cy + Math.sin(a) * r * 0.35, r * 0.35, r * 0.2);
        }
        g.fillStyle(0xFFD54F, 1);
        g.fillCircle(cx, cy, r * 0.1);
        break;
      case 'diamond':
        g.beginPath();
        g.moveTo(cx, cy - r); g.lineTo(cx + r * 0.6, cy);
        g.lineTo(cx, cy + r); g.lineTo(cx - r * 0.6, cy);
        g.closePath(); g.fillPath();
        break;
      default: {
        // 4-point star fallback
        g.beginPath();
        g.moveTo(cx, cy - r);
        g.lineTo(cx + r * 0.3, cy - r * 0.3);
        g.lineTo(cx + r, cy);
        g.lineTo(cx + r * 0.3, cy + r * 0.3);
        g.lineTo(cx, cy + r);
        g.lineTo(cx - r * 0.3, cy + r * 0.3);
        g.lineTo(cx - r, cy);
        g.lineTo(cx - r * 0.3, cy - r * 0.3);
        g.closePath(); g.fillPath();
        break;
      }
    }
  }

  public async generateGardenCard(): Promise<Blob> {
    const CW = 1080, CH = 1920, oc = document.createElement('canvas');
    oc.width = CW; oc.height = CH;
    const cx = oc.getContext('2d')!;
    const grd = cx.createLinearGradient(0, 0, 0, CH);
    grd.addColorStop(0, '#FFF0F5'); grd.addColorStop(0.5, '#FCE4EC'); grd.addColorStop(1, '#F8BBD0');
    cx.fillStyle = grd; cx.fillRect(0, 0, CW, CH);
    cx.fillStyle = 'rgba(236,64,122,0.04)'; cx.font = '14px serif';
    for (let px = 20; px < CW; px += 48) for (let py = 20; py < CH; py += 48) cx.fillText('\u2665', px + ((py % 96 === 20) ? 24 : 0), py);
    const mg = 40, scRd = 16;
    cx.strokeStyle = 'rgba(244,143,177,0.5)'; cx.lineWidth = 3;
    for (let x = mg; x < CW - mg; x += scRd * 2) { cx.beginPath(); cx.arc(x + scRd, mg, scRd, Math.PI, 0); cx.stroke(); }
    for (let x = mg; x < CW - mg; x += scRd * 2) { cx.beginPath(); cx.arc(x + scRd, CH - mg, scRd, 0, Math.PI); cx.stroke(); }
    for (let vy = mg; vy < CH - mg; vy += scRd * 2) { cx.beginPath(); cx.arc(mg, vy + scRd, scRd, Math.PI / 2, -Math.PI / 2); cx.stroke(); }
    for (let vy = mg; vy < CH - mg; vy += scRd * 2) { cx.beginPath(); cx.arc(CW - mg, vy + scRd, scRd, -Math.PI / 2, Math.PI / 2); cx.stroke(); }
    cx.strokeStyle = 'rgba(240,98,146,0.25)'; cx.lineWidth = 2;
    GameScene.gcR(cx, 56, 56, CW - 112, CH - 112, 32); cx.stroke();
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.font = '700 72px Fredoka, Nunito, system-ui, sans-serif';
    cx.fillStyle = 'rgba(236,64,122,0.15)'; cx.fillText('m3rg3r', CW / 2 + 3, 133);
    cx.fillStyle = '#EC407A'; cx.fillText('m3rg3r', CW / 2, 130);
    cx.font = '400 28px Nunito, system-ui, sans-serif'; cx.fillStyle = '#B07A9E'; cx.fillText('My Garden', CW / 2, 185);
    const bi = await this.gcSnap();
    let sT = 240;
    if (bi) {
      const tw = CW - 120, th = tw * (bi.height / bi.width), bx = 60, by = 220;
      cx.fillStyle = 'rgba(212,160,184,0.25)'; GameScene.gcR(cx, bx + 4, by + 6, tw, th, 24); cx.fill();
      cx.fillStyle = '#FCE4EC'; GameScene.gcR(cx, bx, by, tw, th, 24); cx.fill();
      cx.save(); GameScene.gcR(cx, bx, by, tw, th, 24); cx.clip(); cx.drawImage(bi, bx, by, tw, th); cx.restore();
      cx.strokeStyle = 'rgba(244,143,177,0.5)'; cx.lineWidth = 2; GameScene.gcR(cx, bx, by, tw, th, 24); cx.stroke();
      sT = by + th + 40;
    }
    this.gcSt(cx, CW, sT); GameScene.gcSp(cx, CW, CH);
    cx.font = '64px serif'; cx.textAlign = 'left'; cx.textBaseline = 'middle'; cx.fillText('\uD83C\uDF38', 80, CH - 170);
    cx.textAlign = 'center'; cx.font = '600 32px Fredoka, Nunito, system-ui, sans-serif'; cx.fillStyle = '#EC407A';
    cx.fillText('Play m3rg3r!', CW / 2, CH - 120);
    cx.font = '400 22px Nunito, system-ui, sans-serif'; cx.fillStyle = '#B07A9E';
    cx.fillText('merge-game-nine.vercel.app', CW / 2, CH - 82);
    return new Promise<Blob>((res, rej) => { oc.toBlob(b => { if (b) res(b); else rej(new Error('fail')); }, 'image/png'); });
  }

  private gcSnap(): Promise<HTMLImageElement | null> {
    return new Promise(res => {
      if (this.game.renderer.type === Phaser.CANVAS) {
        const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null);
        i.src = (this.game.canvas as HTMLCanvasElement).toDataURL('image/png');
      } else {
        (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).snapshot(
          (sn: Phaser.Display.Color | HTMLImageElement) => res(sn instanceof HTMLImageElement ? sn : null));
      }
    });
  }

  private gcSt(ctx: CanvasRenderingContext2D, CW: number, top: number): void {
    const ti = MERGE_CHAINS.reduce((n: number, ch: { items: unknown[] }) => n + ch.items.length, 0);
    const co = Array.from(this.collection.entries()).filter(([ci, mt]) => { const ch = getChain(ci); return ch != null && mt >= ch.items[ch.items.length - 1].tier; }).length;
    const di = Array.from(this.collection.values()).reduce((n, t) => n + t, 0);
    const sv = SaveSystem.load();
    const da = Math.max(1, Math.ceil((Date.now() - (sv?.timestamp ?? Date.now())) / 86400000) + 1);
    const sr: { label: string; value: string; icon: string }[] = [
      { label: 'Level', value: String(this.playerLevel), icon: '\u2B50' },
      { label: 'Total Merges', value: this.totalMerges.toLocaleString(), icon: '\u2728' },
      { label: 'Items Discovered', value: di + '/' + ti, icon: '\uD83C\uDF1F' },
      { label: 'Chains Completed', value: co + '/' + MERGE_CHAINS.length, icon: '\uD83C\uDF38' },
      { label: 'Days Played', value: String(da), icon: '\uD83D\uDCC5' },
    ];
    const pw = 440, ph = 56, pg = 14, pr = ph / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 30px Fredoka, Nunito, system-ui, sans-serif'; ctx.fillStyle = '#6D3A5B';
    ctx.fillText('\u2728 Garden Stats \u2728', CW / 2, top + 10);
    let y = top + 44;
    for (const rw of sr) {
      const px = (CW - pw) / 2;
      ctx.fillStyle = 'rgba(212,160,184,0.2)'; GameScene.gcR(ctx, px + 2, y + 3, pw, ph, pr); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; GameScene.gcR(ctx, px, y, pw, ph, pr); ctx.fill();
      ctx.strokeStyle = 'rgba(244,143,177,0.35)'; ctx.lineWidth = 1.5; GameScene.gcR(ctx, px, y, pw, ph, pr); ctx.stroke();
      ctx.textAlign = 'left'; ctx.font = '28px serif'; ctx.fillStyle = '#000'; ctx.fillText(rw.icon, px + 18, y + ph / 2 + 2);
      ctx.font = '400 22px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#B07A9E'; ctx.fillText(rw.label, px + 56, y + ph / 2 + 1);
      ctx.textAlign = 'right'; ctx.font = '700 24px Fredoka, Nunito, system-ui, sans-serif'; ctx.fillStyle = '#6D3A5B';
      ctx.fillText(rw.value, px + pw - 22, y + ph / 2 + 1); y += ph + pg;
    }
  }

  private static gcSp(ctx: CanvasRenderingContext2D, CW: number, CH: number): void {
    for (const p of [{x:100,y:100,z:18},{x:CW-110,y:120,z:22},{x:80,y:400,z:14},{x:CW-90,y:350,z:16},{x:130,y:CH-250,z:20},{x:CW-120,y:CH-280,z:18},{x:CW/2-200,y:90,z:12},{x:CW/2+180,y:95,z:14}]) {
      ctx.fillStyle = 'rgba(255,215,0,0.35)'; ctx.beginPath();
      ctx.moveTo(p.x, p.y-p.z*1.5); ctx.lineTo(p.x+p.z*0.35, p.y-p.z*0.35); ctx.lineTo(p.x+p.z*1.5, p.y);
      ctx.lineTo(p.x+p.z*0.35, p.y+p.z*0.35); ctx.lineTo(p.x, p.y+p.z*1.5); ctx.lineTo(p.x-p.z*0.35, p.y+p.z*0.35);
      ctx.lineTo(p.x-p.z*1.5, p.y); ctx.lineTo(p.x-p.z*0.35, p.y-p.z*0.35); ctx.closePath(); ctx.fill();
    }
    ctx.font = '22px serif'; ctx.fillStyle = 'rgba(236,64,122,0.2)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const h of [{x:160,y:160},{x:CW-170,y:190},{x:90,y:CH-320},{x:CW-100,y:CH-340}]) ctx.fillText('\u2764', h.x, h.y);
  }

  private static gcR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r); ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r); ctx.closePath();
  }
}
