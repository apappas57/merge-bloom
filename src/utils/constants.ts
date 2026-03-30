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

// Cutesy pink palette — extra pink & warm
export const COLORS = {
  // Backgrounds — soft pinks
  BG_CREAM: 0xFFF0F5,
  BG_PINK: 0xFFE4EC,
  BG_MINT: 0xFCE4EC,

  // Board — rosy pink
  BOARD_BG: 0xFCE4EC,
  CELL_BG: 0xFFF0F5,
  CELL_BORDER: 0xF8BBD0,
  CELL_SHADOW: 0xF48FB1,
  CELL_HIGHLIGHT: 0xF8BBD0,
  CELL_VALID: 0xF48FB1,
  CELL_INVALID: 0xFFCDD2,

  // UI — warm pink
  UI_BG: 0xFFF0F5,
  UI_PANEL: 0xFCE4EC,
  ACCENT_PINK: 0xF06292,
  ACCENT_GOLD: 0xFFD700,
  ACCENT_TEAL: 0xF48FB1,
  ACCENT_ROSE: 0xEC407A,
  ACCENT_BLUE: 0xF8BBD0,

  // Text (as hex for Phaser graphics)
  TEXT_DARK: 0x880E4F,
  TEXT_MID: 0xC2185B,
};

// Text colors as CSS strings
export const TEXT = {
  PRIMARY: '#6D3A5B',
  SECONDARY: '#B07A9E',
  ACCENT: '#EC407A',
  GOLD: '#E8A317',
  MINT: '#E91E63',
  WHITE: '#FFFFFF',
};

export const SIZES = {
  CELL: s(52),
  CELL_GAP: s(4),
  BOARD_PADDING: s(16),
  ITEM_SIZE: s(40),
  TOP_BAR: s(68),
  BOTTOM_BAR: s(64),
  ORDER_BAR: s(80),
  CORNER_RADIUS: s(18),
};

export const TIMING = {
  MERGE_DURATION: 250,
  SPAWN_DURATION: 300,
  BOUNCE_DURATION: 200,
  GENERATOR_COOLDOWN: 1500,
  AUTOSAVE: 30000,
};

export const FONT = 'Fredoka, Nunito, system-ui, -apple-system, sans-serif';
export const FONT_BODY = 'Nunito, system-ui, -apple-system, sans-serif';
