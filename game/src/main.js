// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between five screens: title, play, paused, win and lose.
//
// ?seed=N fixes the star field. ?shot=start|play|end (with &seed=N) stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP, TIME_LIMIT } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_LOSE, EVENT_WIN, STATUS_LOSE, STATUS_PLAY, STATUS_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import {
  createRenderer,
  SCREEN_LOSE,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas, createRandom(seed));

function readBest() {
  try {
    const value = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '', 10);
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function saveBest(seconds) {
  try {
    window.localStorage.setItem(BEST_KEY, String(seconds));
  } catch {
    // Storage can be off (private windows): the best time then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, (x, y) => renderer.toField(x, y));
  let screen = SCREEN_TITLE;
  let best = readBest();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each find.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.start();
    screen = SCREEN_PLAY;
    announce('Playing. Find 7 differences before the time runs out.');
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_LOSE;
    if (won) {
      const used = Math.round(TIME_LIMIT - world.state.timeLeft);
      if (best === null || used < best) {
        best = used;
        saveBest(best);
      }
      announce(`You found all 7 differences in ${used} seconds. Score ${world.state.score}.`);
    } else {
      announce(`Time is up. You found ${world.state.foundCount} of 7 differences.`);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) {
      startGame();
      return;
    }
    if (actions & ACTION_CONFIRM && screen !== SCREEN_PLAY && screen !== SCREEN_PAUSED) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function handleClicks() {
    if (screen === SCREEN_TITLE) {
      if (input.takeClicks().length > 0) startGame();
      return;
    }
    if (screen === SCREEN_WIN || screen === SCREEN_LOSE) {
      if (input.takeClicks().length > 0) startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) {
      input.takeClicks();
      return;
    }
    for (const click of input.takeClicks()) {
      const events = world.click(click.x, click.y);
      if (events & EVENT_WIN) endGame(true);
      else if (events & EVENT_LOSE) endGame(false);
      else if (events !== 0) {
        announce(
          events === 1
            ? `Found ${world.state.foundCount} of 7 differences.`
            : `Not a difference. 5 seconds lost. ${world.state.foundCount} of 7 found.`,
        );
      }
    }
  }

  let last = performance.now();
  let accumulator = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClicks();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        const events = world.step(STEP);
        accumulator -= STEP;
        if (events & EVENT_LOSE) {
          endGame(false);
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the clock run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Dusk Market spot the difference. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
