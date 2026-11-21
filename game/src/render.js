// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the backdrop
// colour. One procedural dusk-market scene is painted twice, side by side; the right picture
// carries the seven differences. Flat shapes and canvas text only — no image files, no network.

import {
  DIFFS,
  FIELD,
  FONT,
  HEADER,
  PALETTE,
  PANEL,
  PANEL_LEFT_X,
  PANEL_RIGHT_X,
  TIME_LIMIT,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

/** Stars scattered over the sky, placed once from the seeded random. */
const STARS = [];
function seedStars(random) {
  if (STARS.length > 0) return;
  for (let index = 0; index < 42; index += 1) {
    STARS.push({ x: 20 + random() * 564, y: 8 + random() * 150, r: 0.8 + random() * 1.4 });
  }
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
}

export function createRenderer(canvas, random) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  seedStars(random);

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  /** CSS pixels on the canvas element to field coordinates. */
  function toField(cssX, cssY) {
    const ratio = window.devicePixelRatio || 1;
    return {
      x: (cssX * ratio - view.x) / view.scale,
      y: (cssY * ratio - view.y) / view.scale,
    };
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function circle(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  function rect(x, y, width, height, color) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  }

  /** The dusk sky, stars and rooftops behind the stalls. */
  function drawSky(ox, oy, variant) {
    const gradient = context.createLinearGradient(0, oy, 0, oy + 340);
    gradient.addColorStop(0, PALETTE.skyTop);
    gradient.addColorStop(1, PALETTE.skyBottom);
    context.fillStyle = gradient;
    context.fillRect(ox, oy, PANEL.width, 340);
    for (const star of STARS) {
      circle(ox + star.x, oy + star.y, star.r, 'rgba(245,239,228,0.85)');
    }
    // Difference 6: the moon rises over the right-hand rooftops in the left picture only.
    if (variant === 0) {
      circle(ox + 520, oy + 60, 22, '#f5efe4');
      circle(ox + 528, oy + 54, 19, PALETTE.skyTop);
    }
    // Rooftop silhouettes.
    rect(ox, oy + 300, 130, 60, '#1d1533');
    rect(ox + 120, oy + 320, 170, 40, '#221839');
    rect(ox + 280, oy + 290, 150, 70, '#1d1533');
    rect(ox + 420, oy + 315, 184, 45, '#221839');
    rect(ox + 60, oy + 285, 26, 18, '#1d1533');
    rect(ox + 330, oy + 272, 22, 20, '#1d1533');
  }

  /** Festoon lights strung across the top of the picture, with one hanging lantern. */
  function drawLights(ox, oy, variant) {
    context.strokeStyle = '#241d3d';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(ox, oy + 36);
    context.quadraticCurveTo(ox + PANEL.width / 2, oy + 108, ox + PANEL.width, oy + 36);
    context.stroke();
    const bulbColors = ['#f2c94c', '#f4a259', '#e5484d', '#4f9fd8'];
    for (let index = 0; index < 9; index += 1) {
      const t = index / 8;
      const x = ox + t * PANEL.width;
      const y = oy + 36 + Math.sin(t * Math.PI) * 52;
      circle(x, y + 8, 6, bulbColors[index % bulbColors.length]);
    }
    // Difference 0: the hanging lantern is red in the left picture, teal in the right.
    context.strokeStyle = '#241d3d';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(ox + 300, oy + 96);
    context.lineTo(ox + 300, oy + 128);
    context.stroke();
    circle(ox + 300, oy + 150, 20, variant === 0 ? PALETTE.lanternRed : PALETTE.lanternTeal);
    circle(ox + 300, oy + 150, 12, 'rgba(245,239,228,0.55)');
  }

  /** One striped awning; the middle stall loses a stripe in the right picture. */
  function drawAwning(ox, oy, x, width, variant, isMiddle) {
    const stripes = isMiddle && variant === 1 ? 4 : 5;
    const stripeWidth = width / stripes;
    for (let index = 0; index < stripes; index += 1) {
      rect(
        ox + x + index * stripeWidth,
        oy + 180,
        stripeWidth,
        58,
        index % 2 === 0 ? PALETTE.awningRed : PALETTE.awningCream,
      );
    }
    rect(ox + x, oy + 180, width, 10, '#b23a2c');
  }

  function drawStalls(ox, oy, variant) {
    // Stall frames and counters.
    rect(ox + 20, oy + 238, 180, 14, PALETTE.stallWood);
    rect(ox + 212, oy + 238, 180, 14, PALETTE.stallWood);
    rect(ox + 404, oy + 238, 180, 14, PALETTE.stallWood);
    // Posts hold each awning up over its counter.
    for (const x of [20, 212, 404]) {
      rect(ox + x + 8, oy + 252, 8, 128, PALETTE.stallWood);
      rect(ox + x + 164, oy + 252, 8, 128, PALETTE.stallWood);
    }
    rect(ox + 20, oy + 380, 180, 90, PALETTE.stallCounter);
    rect(ox + 212, oy + 380, 180, 90, PALETTE.stallCounter);
    rect(ox + 404, oy + 380, 180, 90, PALETTE.stallCounter);
    rect(ox + 20, oy + 380, 180, 8, PALETTE.stallWood);
    rect(ox + 212, oy + 380, 180, 8, PALETTE.stallWood);
    rect(ox + 404, oy + 380, 180, 8, PALETTE.stallWood);
    drawAwning(ox, oy, 20, 180, variant, false);
    drawAwning(ox, oy, 212, 180, variant, true);
    drawAwning(ox, oy, 404, 180, variant, false);
    // Fruit stall: a pile of apples — difference 4 is one apple fewer on the right.
    const apples = variant === 0 ? 5 : 4;
    const appleSpots = [
      [120, 350],
      [140, 340],
      [160, 350],
      [130, 365],
      [152, 365],
    ];
    for (let index = 0; index < apples; index += 1) {
      circle(ox + appleSpots[index][0], oy + appleSpots[index][1], 13, PALETTE.fruitRed);
    }
    circle(ox + 90, oy + 360, 11, PALETTE.fruitOrange);
    circle(ox + 175, oy + 360, 11, PALETTE.fruitGreen);
    // Lantern stall: little glowing lanterns in a row.
    for (let index = 0; index < 4; index += 1) {
      circle(ox + 240 + index * 42, oy + 350, 12, index % 2 === 0 ? PALETTE.lanternRed : PALETTE.gold);
    }
    // Flower stall: stems with coloured heads.
    const flowerColors = ['#e5484d', '#f2c94c', '#4f9fd8', '#b388ff', '#7fb069'];
    for (let index = 0; index < 5; index += 1) {
      const x = ox + 430 + index * 32;
      context.strokeStyle = '#4a7c59';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x, oy + 372);
      context.lineTo(x, oy + 340);
      context.stroke();
      circle(x, oy + 334, 9, flowerColors[index]);
    }
    // Sign board on the flower stall — difference 5 is its star, present only on the left.
    rect(ox + 470, oy + 398, 64, 40, '#f2e3c6');
    context.strokeStyle = PALETTE.stallWood;
    context.lineWidth = 3;
    context.strokeRect(ox + 470, oy + 398, 64, 40);
    if (variant === 0) {
      text('★', ox + 502, oy + 419, 20, '#d94f3d', 'center');
    }
    text('FLOWERS', ox + 502, oy + 434, 10, PALETTE.stallWood, 'center');
  }

  /** Balloons tied to a crate — difference 2 is an extra balloon on the right. */
  function drawBalloons(ox, oy, variant) {
    const count = variant === 0 ? 2 : 3;
    const spots = [
      [505, 120, PALETTE.balloonRed],
      [535, 108, PALETTE.balloonBlue],
      [520, 92, PALETTE.balloonYellow],
    ];
    for (let index = 0; index < count; index += 1) {
      const [x, y, color] = spots[index];
      context.fillStyle = color;
      context.beginPath();
      context.ellipse(ox + x, oy + y, 14, 18, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = 'rgba(245,239,228,0.7)';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(ox + x, oy + y + 18);
      context.lineTo(ox + 520, oy + 500);
      context.stroke();
    }
    rect(ox + 500, oy + 500, 44, 34, '#8a5a33');
    rect(ox + 500, oy + 500, 44, 8, '#6e4525');
  }

  /** The market cat, asleep by the crates — difference 1: it is only in the left picture. */
  function drawCat(ox, oy, variant) {
    if (variant !== 0) return;
    context.fillStyle = PALETTE.cat;
    context.beginPath();
    context.ellipse(ox + 90, oy + 486, 26, 16, 0, 0, Math.PI * 2);
    context.fill();
    circle(ox + 108, oy + 462, 13, PALETTE.cat);
    context.beginPath();
    context.moveTo(ox + 98, oy + 454);
    context.lineTo(ox + 102, oy + 440);
    context.lineTo(ox + 108, oy + 452);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(ox + 110, oy + 452);
    context.lineTo(ox + 116, oy + 440);
    context.lineTo(ox + 119, oy + 454);
    context.closePath();
    context.fill();
    context.strokeStyle = PALETTE.cat;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(ox + 66, oy + 488);
    context.quadraticCurveTo(ox + 52, oy + 478, ox + 58, oy + 462);
    context.stroke();
  }

  function drawScene(ox, oy, variant, state) {
    drawSky(ox, oy, variant);
    rect(ox, oy + 470, PANEL.width, PANEL.height - 470, PALETTE.ground);
    drawLights(ox, oy, variant);
    drawStalls(ox, oy, variant);
    drawBalloons(ox, oy, variant);
    drawCat(ox, oy, variant);
    // Crates on the ground.
    rect(ox + 36, oy + 500, 44, 34, '#8a5a33');
    rect(ox + 36, oy + 500, 44, 8, '#6e4525');
    // Found markers: a green ring and a check, on both pictures at once.
    for (let index = 0; index < DIFFS.length; index += 1) {
      if (!state.found[index]) continue;
      const diff = DIFFS[index];
      context.strokeStyle = PALETTE.found;
      context.lineWidth = 5;
      context.beginPath();
      context.arc(ox + diff.x, oy + diff.y, 26, 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = '#ffffff';
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(ox + diff.x - 11, oy + diff.y);
      context.lineTo(ox + diff.x - 3, oy + diff.y + 9);
      context.lineTo(ox + diff.x + 12, oy + diff.y - 9);
      context.stroke();
    }
    // Miss marks: a red X that fades away.
    for (const miss of state.misses) {
      if (miss.panel !== variant) continue;
      const alpha = Math.max(0, 1 - miss.age / 0.8);
      context.strokeStyle = `rgba(229,72,77,${alpha})`;
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(ox + miss.x - 12, oy + miss.y - 12);
      context.lineTo(ox + miss.x + 12, oy + miss.y + 12);
      context.moveTo(ox + miss.x + 12, oy + miss.y - 12);
      context.lineTo(ox + miss.x - 12, oy + miss.y + 12);
      context.stroke();
    }
  }

  function drawPanelFrame(ox, tag) {
    context.strokeStyle = PALETTE.panelBorder;
    context.lineWidth = 3;
    context.strokeRect(ox, PANEL.y, PANEL.width, PANEL.height);
    rect(ox + 10, PANEL.y + 10, 34, 30, PALETTE.panelTag);
    text(tag, ox + 27, PANEL.y + 33, 20, PALETTE.text, 'center');
  }

  function drawHeader(state) {
    rect(0, 0, FIELD.width, HEADER.height, PALETTE.header);
    text('DUSK MARKET — Spot the Difference', 24, 41, 27, PALETTE.text, 'left');
    text(`Found ${state.foundCount} / ${DIFFS.length}`, FIELD.width / 2, 41, 27, PALETTE.gold, 'center');
    text(
      `Time ${formatTime(state.timeLeft)}   Score ${state.score}`,
      FIELD.width - 24,
      41,
      27,
      PALETTE.text,
      'right',
    );
  }

  function drawOverlayPanel(title, lines, prompt, accent) {
    const width = 640;
    const height = 150 + lines.length * 36 + 70;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(20,16,31,0.82)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, width, height);
    context.strokeStyle = PALETTE.panelBorder;
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);
    text(title, FIELD.width / 2, y + 72, 44, accent, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + 128 + index * 36, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 22, PALETTE.gold, 'center');
  }

  /** Paint one frame: header, both pictures, then a panel for the screen the game is on. */
  function draw(state, screen, bestSeconds) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawHeader(state);
    drawScene(PANEL_LEFT_X, PANEL.y, 0, state);
    drawScene(PANEL_RIGHT_X, PANEL.y, 1, state);
    drawPanelFrame(PANEL_LEFT_X, 'A');
    drawPanelFrame(PANEL_RIGHT_X, 'B');
    if (screen === SCREEN_TITLE) {
      const lines = [
        'Two pictures of the same evening market. Seven things changed.',
        'Click a difference in either picture. A wrong click costs 5 seconds.',
        bestSeconds === null
          ? 'Find all 7 before the clock runs out.'
          : `Best win so far: ${formatTime(bestSeconds)}. Find all 7 before the clock runs out.`,
      ];
      drawOverlayPanel('DUSK MARKET', lines, 'Click or press Space to start', PALETTE.text);
    } else if (screen === SCREEN_PAUSED) {
      drawOverlayPanel('Paused', ['The market will wait for you.'], 'Press P to resume', PALETTE.text);
    } else if (screen === SCREEN_WIN) {
      const used = TIME_LIMIT - state.timeLeft;
      const lines = [
        `You found all ${DIFFS.length} differences in ${formatTime(used)}.`,
        `Score ${state.score}   •   Wrong clicks ${state.mistakes}`,
        bestSeconds === null ? '' : `Best win: ${formatTime(bestSeconds)}.`,
      ];
      drawOverlayPanel('You found them all!', lines, 'Press Space or R to play again', PALETTE.found);
    } else if (screen === SCREEN_LOSE) {
      const lines = [
        `Time ran out with ${state.foundCount} of ${DIFFS.length} differences found.`,
        'The missing ones were still there, hiding in plain sight.',
      ];
      drawOverlayPanel("Time's up", lines, 'Press Space or R to try again', PALETTE.wrong);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toField };
}
