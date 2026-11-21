// The screenshot scenes behind ?shot=start|play|end. Each one stages a real state of the
// game — a fresh round, a round with three differences found, a round won — so the frame is
// what a short game really looks like and the same seed always gives the same frame.
import { DIFFS } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/**
 * Set `world` to the named scene (start, play or end; any other name is start) and return the
 * screen to draw over it and the best time to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    world.start();
    // Three differences found, four still hiding: the counter reads 3 / 7.
    for (const id of [0, 2, 4]) {
      const diff = DIFFS[id];
      world.click(24 + diff.x, 84 + diff.y);
    }
    world.state.timeLeft = 103;
    world.state.elapsed = 47;
    return { screen: SCREEN_PLAY, best: null };
  }
  if (name === 'end') {
    world.start();
    // A win with 1:04 on the clock: 64 seconds left, 86 used, best 86.
    world.state.timeLeft = 64;
    world.state.elapsed = 86;
    for (const diff of DIFFS) {
      world.click(24 + diff.x, 84 + diff.y);
    }
    return { screen: SCREEN_WIN, best: 86 };
  }
  world.state.timeLeft = 150;
  return { screen: SCREEN_TITLE, best: null };
}
