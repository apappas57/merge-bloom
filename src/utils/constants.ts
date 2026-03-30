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

export const COLORS = {
  BG_DARK: 0x1a1a2e,
  BG_MID: 0x16213e,
  CELL_BG: 0x1e3a5f,
  CELL_BORDER: 0x2a5298,
  CELL_HIGHLIGHT: 0x4a90d9,
  CELL_VALID: 0x2ecc71,
  CELL_INVALID: 0xe74c3c,
  ACCENT_PINK: 0xe94560,
  ACCENT_GOLD: 0xffd700,
  ACCENT_TEAL: 0x2ecc71,
  UI_BG: 0x0d1b2a,
  UI_PANEL: 0x1b2838,
  // Garden board theme
  BOARD_BG: 0x132a13,
  CELL_GARDEN: 0x1a3a2a,
  CELL_GARDEN_BORDER: 0x2d5a3d,
  CELL_GARDEN_INNER: 0x0f2a1f,
};

export const SIZES = {
  CELL: s(52),
  CELL_GAP: s(4),
  BOARD_PADDING: s(16),
  ITEM_SIZE: s(40),
  TOP_BAR: s(90),
  BOTTOM_BAR: s(70),
  QUEST_BAR: s(50),
  CORNER_RADIUS: s(10),
};

export const TIMING = {
  MERGE_DURATION: 250,
  SPAWN_DURATION: 300,
  BOUNCE_DURATION: 200,
  GENERATOR_COOLDOWN: 8000,
  AUTOSAVE: 30000,
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
