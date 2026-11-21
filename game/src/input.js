// Keyboard and pointer input. Clicks are reported as field coordinates (the renderer's
// logical 1280x720 space); one-shot presses (start, pause, restart) are queued as bit flags
// and taken once by the loop, so a press between two frames is never lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);

export function createInput(canvas, toField) {
  let actions = 0;
  const clicks = [];

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const point = toField(event.clientX - rect.left, event.clientY - rect.top);
    clicks.push(point);
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Clicks since the last call, as {x, y} in field coordinates. */
    takeClicks() {
      if (clicks.length === 0) return clicks;
      const taken = clicks.slice();
      clicks.length = 0;
      return taken;
    },
  };
}
