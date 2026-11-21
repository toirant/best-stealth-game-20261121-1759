// main.js — Moonlit Manor's game loop and state machine.
// States: title → playing → levelClear → caught → victory. The loop runs on
// requestAnimationFrame, updates the player and the guards, and draws the frame.
// A ?shot= parameter stages a scene for screenshots: start, play, alert, win.

import { VIEW_W, VIEW_H, TILE, COINS_PER_LEVEL, COIN_NOISE_RADIUS, PALETTE } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { createInput, moveVector, wasPressed, endFrame } from './input.js';
import { createAudio } from './audio.js';
import { createGuard, updateGuard, hearNoise } from './guards.js';
import { createPlayer, updatePlayer, coinTossTarget } from './player.js';
import { drawTiles, drawCones, drawRelics, drawGuard, drawPlayer, drawCoins, drawHud, drawTitle, drawEnd } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();

const game = {
  screen: 'title', // title | playing | caught | levelClear | victory
  levelIndex: 0,
  level: LEVELS[0],
  tiles: [],
  player: null,
  guards: [],
  relics: [],
  exit: null,
  coins: COINS_PER_LEVEL,
  thrownCoins: [],
  time: 0,
  levelTime: 0,
  caughtTimer: 0,
  clearTimer: 0,
  totalCaught: 0,
  totalRelics: 0,
};

function loadLevel(index) {
  game.levelIndex = index;
  game.level = LEVELS[index];
  const parsed = parseLevel(game.level);
  game.tiles = parsed.tiles;
  game.player = createPlayer(parsed.playerStart);
  game.guards = game.level.guards.map(createGuard);
  game.relics = parsed.relics;
  game.exit = parsed.exit;
  game.coins = COINS_PER_LEVEL;
  game.thrownCoins = [];
  game.levelTime = 0;
  game.screen = 'playing';
}

function startGame() {
  game.totalCaught = 0;
  game.totalRelics = 0;
  game.time = 0;
  loadLevel(0);
}

function allRelicsTaken() {
  return game.relics.every((r) => r.taken);
}

function nearExit() {
  return Math.hypot(game.player.x - game.exit.x * TILE, game.player.y - game.exit.y * TILE) < 26;
}

function update(dt) {
  game.time += dt;
  if (game.screen === 'title') {
    if (wasPressed(input, 'enter') || wasPressed(input, ' ') || input.click) {
      audio.unlock();
      input.click = null;
      startGame();
    }
    return;
  }
  if (game.screen === 'caught') {
    game.caughtTimer -= dt;
    if (game.caughtTimer <= 0 && (wasPressed(input, 'enter') || input.click)) {
      input.click = null;
      loadLevel(game.levelIndex);
    }
    return;
  }
  if (game.screen === 'levelClear') {
    game.clearTimer -= dt;
    if (game.clearTimer <= 0) {
      if (game.levelIndex + 1 < LEVELS.length) loadLevel(game.levelIndex + 1);
      else game.screen = 'victory';
    }
    return;
  }
  if (game.screen === 'victory') {
    if (wasPressed(input, 'enter') || input.click) {
      input.click = null;
      startGame();
    }
    return;
  }

  // Playing.
  game.levelTime += dt;
  const dir = moveVector(input);
  updatePlayer(game.player, game.tiles, dir, dt);
  if (game.player.moving && game.player.stepTimer <= 0) {
    audio.footstep(game.player.sneaking);
    game.player.stepTimer = game.player.sneaking ? 0.42 : 0.3;
  }

  // Toss a coin where the player clicked.
  if (input.click && game.coins > 0) {
    const target = coinTossTarget(game.player, input.click);
    game.thrownCoins.push({ x: target.x, y: target.y, ttl: 6 });
    game.coins -= 1;
    audio.coin();
    hearNoise(game.guards, target.x, target.y, COIN_NOISE_RADIUS);
  }
  input.click = null;
  for (const c of game.thrownCoins) c.ttl -= dt;
  game.thrownCoins = game.thrownCoins.filter((c) => c.ttl > 0);

  // Relics.
  for (const r of game.relics) {
    if (!r.taken && Math.hypot(game.player.x - r.x * TILE, game.player.y - r.y * TILE) < 24) {
      r.taken = true;
      game.totalRelics += 1;
      audio.pickup();
      if (allRelicsTaken()) audio.door();
    }
  }

  // Guards.
  let caught = false;
  for (const g of game.guards) {
    const events = updateGuard(g, game.tiles, game.player, dt);
    if (events.includes('spotted')) audio.spotted();
    if (events.includes('caught')) caught = true;
  }
  if (caught) {
    game.totalCaught += 1;
    audio.caught();
    game.screen = 'caught';
    game.caughtTimer = 0.6;
    return;
  }

  // Exit.
  if (allRelicsTaken() && nearExit()) {
    audio.win();
    game.screen = 'levelClear';
    game.clearTimer = 1.6;
  }
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === 'title') {
    // Show the first level dimly behind the title, so the cover reads as a game.
    if (!game.tiles.length) {
      const parsed = parseLevel(LEVELS[0]);
      game.tiles = parsed.tiles;
      game.player = createPlayer(parsed.playerStart);
      game.guards = LEVELS[0].guards.map(createGuard);
      game.relics = parsed.relics;
      game.exit = parsed.exit;
    }
    drawTiles(ctx, game.tiles, game.exit, false);
    drawCones(ctx, game.tiles, game.guards);
    drawRelics(ctx, game.relics, game.time);
    for (const g of game.guards) drawGuard(ctx, g, game.time);
    drawPlayer(ctx, game.player, game.time);
    drawTitle(ctx, game.time);
    return;
  }
  drawTiles(ctx, game.tiles, game.exit, allRelicsTaken());
  drawCones(ctx, game.tiles, game.guards);
  drawRelics(ctx, game.relics, game.time);
  drawCoins(ctx, game.thrownCoins);
  for (const g of game.guards) drawGuard(ctx, g, game.time);
  drawPlayer(ctx, game.player, game.time);
  drawHud(ctx, game);
  if (game.screen === 'caught') {
    drawEnd(ctx, 'CAUGHT!', ['The watchman grabbed your cloak.', 'The moonstones stay where they are — for now.'], '#ff5d5d');
  } else if (game.screen === 'levelClear') {
    drawEnd(ctx, 'CLEAN GETAWAY', [`Level ${game.levelIndex + 1} cleared in ${Math.floor(game.levelTime)}s.`, 'The next manor waits.'], PALETTE.exit);
  } else if (game.screen === 'victory') {
    drawEnd(ctx, 'MASTER THIEF', [
      `All three manors robbed in ${Math.floor(game.time)}s.`,
      `${game.totalRelics} moonstones stolen · spotted ${game.totalCaught} time${game.totalCaught === 1 ? '' : 's'}.`,
      'Not a single alarm that mattered.',
    ], PALETTE.gold);
  }
}

// stageShot puts the game in a photogenic state for a screenshot. These are
// real renders of the game code — the same draw path the player sees.
function stageShot(shot) {
  if (shot === 'start') { game.screen = 'title'; return; }
  loadLevel(shot === 'win' ? 2 : 0);
  if (shot === 'play') {
    // Mid-heist: thief crouched in a bush beside a patrol, one moonstone taken.
    game.player.x = 6.5 * TILE;
    game.player.y = 3.5 * TILE;
    game.player.sneaking = true;
    game.relics[0].taken = true;
    game.thrownCoins.push({ x: 10.5 * TILE, y: 6.5 * TILE, ttl: 6 });
    game.guards[0].x = 8.5 * TILE;
    game.guards[0].y = 5.5 * TILE;
    game.guards[0].angle = Math.PI * 0.75;
    game.guards[0].suspicion = 0.55;
    game.time = 42;
  } else if (shot === 'alert') {
    // Spotted: the guard is on the chase and the alarm banner is up.
    game.player.x = 12.5 * TILE;
    game.player.y = 7.5 * TILE;
    game.guards[0].x = 9.5 * TILE;
    game.guards[0].y = 7.5 * TILE;
    game.guards[0].angle = 0;
    game.guards[0].state = 'alert';
    game.guards[0].suspicion = 1;
    game.guards[0].stateTimer = 3;
    game.guards[0].lastSeen = { x: game.player.x, y: game.player.y };
    game.time = 87;
  } else if (shot === 'win') {
    game.screen = 'victory';
    game.time = 342;
    game.totalRelics = 4;
    game.totalCaught = 1;
  }
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) stageShot(shot);

// Test hook: the play-test driver reads state through window.__game.
window.__game = game;

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // Freeze the staged shot so screenshots are stable.
  if (!shot) update(dt);
  draw();
  endFrame(input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
