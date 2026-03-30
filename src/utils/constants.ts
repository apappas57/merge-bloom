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

// Kawaii pastel palette — Sanrio / Cinnamoroll inspired
export const COLORS = {
  // Backgrounds
  BG_CREAM: 0xFFF8F0,
  BG_PINK: 0xFFF0F5,
  BG_MINT: 0xE8F5E9,

  // Board
  BOARD_BG: 0xE8F5E9,
  CELL_BG: 0xF3E8FF,
  CELL_BORDER: 0xD4B8E8,
  CELL_SHADOW: 0xC9A8D8,
  CELL_HIGHLIGHT: 0xA8E6CF,
  CELL_VALID: 0xA8E6CF,
  CELL_INVALID: 0xFFB3B3,

  // UI
  UI_BG: 0xFFF0F5,
  UI_PANEL: 0xFFE4EC,
  ACCENT_PINK: 0xFF9CAD,
  ACCENT_GOLD: 0xFFD700,
  ACCENT_TEAL: 0xA8E6CF,
  ACCENT_ROSE: 0xFFB3D9,
  ACCENT_BLUE: 0xA8D8EA,

  // Text (as hex for Phaser graphics)
  TEXT_DARK: 0x5C5470,
  TEXT_MID: 0x9E8FA0,
};

// Text colors as CSS strings
export const TEXT = {
  PRIMARY: '#5C5470',
  SECONDARY: '#9E8FA0',
  ACCENT: '#FF9CAD',
  GOLD: '#E8A317',
  MINT: '#6BBF8A',
  WHITE: '#FFFFFF',
};

export const SIZES = {
  CELL: s(52),
  CELL_GAP: s(4),
  BOARD_PADDING: s(16),
  ITEM_SIZE: s(40),
  TOP_BAR: s(90),
  BOTTOM_BAR: s(70),
  QUEST_BAR: s(50),
  CORNER_RADIUS: s(18),
};

export const TIMING = {
  MERGE_DURATION: 250,
  SPAWN_DURATION: 300,
  BOUNCE_DURATION: 200,
  GENERATOR_COOLDOWN: 8000,
  AUTOSAVE: 30000,
};

export const FONT = 'Fredoka, Nunito, system-ui, -apple-system, sans-serif';
export const FONT_BODY = 'Nunito, system-ui, -apple-system, sans-serif';
