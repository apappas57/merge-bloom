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
};

export const TEXT = {
  PRIMARY: '#6D3A5B',
  SECONDARY: '#B07A9E',
  ACCENT: '#EC407A',
  GOLD: '#E8A317',
  MINT: '#E91E63',
  WHITE: '#FFFFFF',
};

export const SIZES = {
  CELL: s(50),
  CELL_GAP: s(3),
  BOARD_PADDING: s(12),
  ITEM_SIZE: s(40),
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
};

export const FONT = 'Fredoka, Nunito, system-ui, -apple-system, sans-serif';
export const FONT_BODY = 'Nunito, system-ui, -apple-system, sans-serif';
