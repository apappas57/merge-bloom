// Device pixel ratio for retina rendering
export const DPR = Math.min(window.devicePixelRatio || 1, 3);

/** Convert a CSS-pixel font size to a DPR-scaled string */
export function fs(px: number): string {
  return `${Math.round(px * DPR)}px`;
}

/** Scale a value by DPR */
export function s(v: number): number {
  return Math.round(v * DPR);
}

/**
 * Safe area top inset in game pixels.
 * iPhone 16 Pro Dynamic Island = ~59pt. PWA standalone mode exposes this.
 * We detect via CSS env() at runtime but use a sensible default.
 */
function getSafeAreaTop(): number {
  // In standalone PWA mode, the status bar area is part of our viewport
  // Use a generous default for iPhone 14+ Dynamic Island
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
  return isStandalone ? s(50) : s(20);
}

export const SAFE_AREA_TOP = getSafeAreaTop();

// Cutesy pink palette — extra pink & warm
export const COLORS = {
  BG_CREAM: 0xFFF0F5,
  BG_PINK: 0xFFE4EC,
  BG_MINT: 0xFCE4EC,
  BOARD_BG: 0xFCE4EC,
  CELL_BG: 0xFFF0F5,
  CELL_BORDER: 0xF8BBD0,
  CELL_SHADOW: 0xF48FB1,
  CELL_HIGHLIGHT: 0xF8BBD0,
  CELL_VALID: 0xF48FB1,
  CELL_INVALID: 0xFFCDD2,
  UI_BG: 0xFFF0F5,
  UI_PANEL: 0xFCE4EC,
  ACCENT_PINK: 0xF06292,
  ACCENT_GOLD: 0xFFD700,
  ACCENT_TEAL: 0xF48FB1,
  ACCENT_ROSE: 0xEC407A,
  ACCENT_BLUE: 0xF8BBD0,
  TEXT_DARK: 0x880E4F,
  TEXT_MID: 0xC2185B,
  // Y2K accent colors
  CHROME_PINK: 0xE8A4C8,
  HOLO_BLUE: 0x87CEEB,
  JELLY_PURPLE: 0xD4A5FF,
  Y2K_SILVER: 0xC0C0C0,
};

export const TEXT = {
  PRIMARY: '#6D3A5B',
  SECONDARY: '#B07A9E',
  ACCENT: '#EC407A',
  GOLD: '#E8A317',
  MINT: '#E91E63',
  WHITE: '#FFFFFF',
};

// Calculate responsive cell size based on actual screen dimensions
function calcMaxCell(): number {
  const w = (window.innerWidth) * DPR;
  const h = (window.visualViewport?.height || window.innerHeight) * DPR;
  const safeTop = getSafeAreaTop();
  const topBar = safeTop + s(42);
  const orderBar = s(76);
  const bottomBar = s(58);
  const boardPad = s(12);
  const gap = s(3);
  const traySpace = s(60); // storage tray + padding below board

  const cols = 6, rows = 8;
  const maxFromWidth = Math.floor((w - boardPad * 2 - (cols - 1) * gap) / cols);
  const maxFromHeight = Math.floor((h - topBar - orderBar - boardPad * 2 - bottomBar - traySpace - (rows - 1) * gap) / rows);
  // Use the smaller of width/height constraints, capped at s(65) for readability
  return Math.min(maxFromWidth, maxFromHeight, s(65));
}

export const SIZES = {
  CELL: calcMaxCell(),
  CELL_GAP: s(3),
  BOARD_PADDING: s(12),
  ITEM_SIZE: Math.round(calcMaxCell() * 0.8),
  TOP_BAR: SAFE_AREA_TOP + s(42),
  BOTTOM_BAR: s(58),
  ORDER_BAR: s(76),
  CORNER_RADIUS: s(16),
  SAFE_TOP: SAFE_AREA_TOP,
};

export const TIMING = {
  MERGE_DURATION: 250,
  SPAWN_DURATION: 300,
  BOUNCE_DURATION: 200,
  GENERATOR_COOLDOWN: 500,
  AUTOSAVE: 30000,
  /** Auto-produce intervals per generator tier (ms) */
  AUTO_PRODUCE: {
    1: 60000,
    2: 50000,
    3: 40000,
    4: 30000,
    5: 20000,
  } as Record<number, number>,
  /** Max items a generator can produce while offline */
  AUTO_PRODUCE_OFFLINE_CAP: 3,
  /** Board fullness threshold (0-1) above which auto-produce pauses */
  AUTO_PRODUCE_BOARD_FULL_PCT: 0.9,
};

export const FONT = 'Fredoka, Nunito, system-ui, -apple-system, sans-serif';
export const FONT_BODY = 'Nunito, system-ui, -apple-system, sans-serif';
