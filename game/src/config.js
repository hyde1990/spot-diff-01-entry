// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.
// Two picture panels sit side by side under a header bar.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Seconds on the clock when a round starts; a wrong click costs WRONG_PENALTY seconds. */
export const TIME_LIMIT = 150;
export const WRONG_PENALTY = 5;

/** Points for a found difference, and per second left when the round is won. */
export const POINTS_FOUND = 100;
export const POINTS_TIME = 2;

/** How close a click must land to a difference to count, in panel pixels. */
export const MARK_RADIUS = 28;

/** Header bar and the two picture panels, in field coordinates. */
export const HEADER = { height: 64 };
export const PANEL = { width: 604, height: 576, y: 84, gap: 24 };
export const PANEL_LEFT_X = 24;
export const PANEL_RIGHT_X = PANEL_LEFT_X + PANEL.width + PANEL.gap;

/**
 * The seven differences, in panel-local coordinates (0..604, 0..576). A difference is
 * found by clicking near it in either panel; the marker then shows on both.
 */
export const DIFFS = [
  { id: 0, x: 300, y: 150, name: 'lantern colour' },
  { id: 1, x: 90, y: 470, name: 'cat' },
  { id: 2, x: 520, y: 120, name: 'balloons' },
  { id: 3, x: 300, y: 230, name: 'awning stripe' },
  { id: 4, x: 140, y: 330, name: 'apples' },
  { id: 5, x: 500, y: 420, name: 'sign star' },
  { id: 6, x: 520, y: 60, name: 'moon' },
];
export const DIFF_COUNT = DIFFS.length;

export const PALETTE = {
  backdrop: '#14101f',
  header: '#1d1730',
  skyTop: '#2b1e4a',
  skyBottom: '#e07840',
  panelBorder: '#3a2f5c',
  panelTag: '#241d3d',
  ground: '#241a2e',
  stallWood: '#7a4a2b',
  stallCounter: '#9c6b3f',
  awningRed: '#d94f3d',
  awningCream: '#f2e3c6',
  awningTeal: '#2e8f86',
  lanternRed: '#e5484d',
  lanternTeal: '#2ec4b6',
  fruitRed: '#e5484d',
  fruitGreen: '#7fb069',
  fruitOrange: '#f4a259',
  balloonRed: '#e5484d',
  balloonBlue: '#4f9fd8',
  balloonYellow: '#f2c94c',
  cat: '#2f2a33',
  text: '#f5efe4',
  muted: '#b8aed4',
  gold: '#f2c94c',
  found: '#3fbf6f',
  wrong: '#e5484d',
  panel: '#252b38',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best (fastest win) time is kept between visits (this browser only). */
export const BEST_KEY = 'dusk-market.best-seconds';
