// The game's rules and state, with no drawing and no browser in it: the seven differences,
// which are found, the clock, the score, and win/lose. A click is judged in panel-local
// coordinates; the renderer translates the pointer into them. Nothing here allocates after
// createWorld returns.

import {
  DIFF_COUNT,
  DIFFS,
  MARK_RADIUS,
  PANEL,
  PANEL_LEFT_X,
  PANEL_RIGHT_X,
  POINTS_FOUND,
  POINTS_TIME,
  TIME_LIMIT,
  WRONG_PENALTY,
} from './config.js';

export const EVENT_FOUND = 1;
export const EVENT_WRONG = 2;
export const EVENT_WIN = 4;
export const EVENT_LOSE = 8;

export const STATUS_TITLE = 'title';
export const STATUS_PLAY = 'play';
export const STATUS_WIN = 'win';
export const STATUS_LOSE = 'lose';

function distanceSquared(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function createWorld() {
  const state = {
    status: STATUS_TITLE,
    found: new Array(DIFF_COUNT).fill(false),
    foundCount: 0,
    mistakes: 0,
    score: 0,
    timeLeft: TIME_LIMIT,
    elapsed: 0,
    // Miss marks: {x, y, panel, age} in panel-local coordinates; the renderer fades them.
    misses: [],
    // Last found difference id, for the status line; -1 when none yet.
    lastFound: -1,
  };

  function reset() {
    state.status = STATUS_TITLE;
    state.found.fill(false);
    state.foundCount = 0;
    state.mistakes = 0;
    state.score = 0;
    state.timeLeft = TIME_LIMIT;
    state.elapsed = 0;
    state.misses.length = 0;
    state.lastFound = -1;
  }

  function start() {
    reset();
    state.status = STATUS_PLAY;
  }

  /** Which panel (0 left, 1 right) a field point is in, or -1 when it is in neither. */
  function panelAt(fieldX, fieldY) {
    if (fieldY < PANEL.y || fieldY > PANEL.y + PANEL.height) return -1;
    if (fieldX >= PANEL_LEFT_X && fieldX <= PANEL_LEFT_X + PANEL.width) return 0;
    if (fieldX >= PANEL_RIGHT_X && fieldX <= PANEL_RIGHT_X + PANEL.width) return 1;
    return -1;
  }

  /** Judge a click at field coordinates. Returns an event flag. */
  function click(fieldX, fieldY) {
    if (state.status !== STATUS_PLAY) return 0;
    const panel = panelAt(fieldX, fieldY);
    if (panel === -1) return 0;
    const originX = panel === 0 ? PANEL_LEFT_X : PANEL_RIGHT_X;
    const x = fieldX - originX;
    const y = fieldY - PANEL.y;
    let best = -1;
    let bestDistance = MARK_RADIUS * MARK_RADIUS;
    for (let index = 0; index < DIFF_COUNT; index += 1) {
      if (state.found[index]) continue;
      const d = distanceSquared(x, y, DIFFS[index].x, DIFFS[index].y);
      if (d <= bestDistance) {
        bestDistance = d;
        best = index;
      }
    }
    if (best !== -1) {
      state.found[best] = true;
      state.foundCount += 1;
      state.lastFound = best;
      state.score += POINTS_FOUND;
      if (state.foundCount === DIFF_COUNT) {
        state.status = STATUS_WIN;
        state.score += Math.ceil(state.timeLeft) * POINTS_TIME;
        return EVENT_FOUND | EVENT_WIN;
      }
      return EVENT_FOUND;
    }
    state.mistakes += 1;
    state.timeLeft = Math.max(0, state.timeLeft - WRONG_PENALTY);
    state.misses.push({ x, y, panel, age: 0 });
    if (state.timeLeft <= 0) {
      state.status = STATUS_LOSE;
      return EVENT_WRONG | EVENT_LOSE;
    }
    return EVENT_WRONG;
  }

  /** One fixed step: the clock runs only while playing. */
  function step(dt) {
    if (state.status !== STATUS_PLAY) return 0;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    for (let index = state.misses.length - 1; index >= 0; index -= 1) {
      state.misses[index].age += dt;
      if (state.misses[index].age > 0.8) state.misses.splice(index, 1);
    }
    if (state.timeLeft <= 0) {
      state.status = STATUS_LOSE;
      return EVENT_LOSE;
    }
    return 0;
  }

  return { state, reset, start, click, step, panelAt };
}
