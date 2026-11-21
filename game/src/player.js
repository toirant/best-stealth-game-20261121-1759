// player.js — the thief. Moves with the keys, sneaks on Shift, bumps into
// walls tile by tile, and leaves a noise radius behind when walking fast.

import { TILE, PLAYER_RADIUS, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED,
  PLAYER_NOISE_WALK, PLAYER_NOISE_SNEAK } from './config.js';
import { isSolid } from './levels.js';

export function createPlayer(start) {
  return {
    x: start.x * TILE,
    y: start.y * TILE,
    radius: PLAYER_RADIUS,
    sneaking: false,
    moving: false,
    noiseRadius: 0,
    stepTimer: 0,
  };
}

// tryMove slides the player along one axis, stopping at solid tiles. Moving
// axis by axis lets the player slide along a wall instead of sticking to it.
function tryMove(player, tiles, dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  const r = player.radius - 2;
  const minTx = Math.floor((nx - r) / TILE);
  const maxTx = Math.floor((nx + r) / TILE);
  const minTy = Math.floor((ny - r) / TILE);
  const maxTy = Math.floor((ny + r) / TILE);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (isSolid(tiles, tx, ty)) return false;
    }
  }
  player.x = nx;
  player.y = ny;
  return true;
}

export function updatePlayer(player, tiles, dir, dt) {
  player.sneaking = dir.sneak;
  const speed = dir.sneak ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  const mx = dir.x * speed * dt;
  const my = dir.y * speed * dt;
  player.moving = mx !== 0 || my !== 0;
  if (player.moving) {
    tryMove(player, tiles, mx, 0);
    tryMove(player, tiles, 0, my);
  }
  player.noiseRadius = !player.moving ? 0 : (dir.sneak ? PLAYER_NOISE_SNEAK : PLAYER_NOISE_WALK);
  player.stepTimer -= dt;
  return player;
}

// coinTossTarget clamps a mouse click to a short throw from the player.
export function coinTossTarget(player, click) {
  const dx = click.x - player.x;
  const dy = click.y - player.y;
  const dist = Math.hypot(dx, dy);
  const maxThrow = 190;
  if (dist <= maxThrow) return { x: click.x, y: click.y };
  return { x: player.x + (dx / dist) * maxThrow, y: player.y + (dy / dist) * maxThrow };
}
