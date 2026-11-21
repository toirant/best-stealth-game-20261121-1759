// vision.js — what a guard can see: a cone of light cut short by walls and
// crates, and a line of sight that never passes through them. Both are pure
// geometry over the level grid, so the render and the AI agree on what is seen.

import { TILE, GUARD_SIGHT_RANGE, GUARD_SIGHT_HALF_ANGLE } from './config.js';
import { blocksSight } from './levels.js';

// hasLineOfSight walks from (x1,y1) to (x2,y2) in small steps and reports false
// the moment a wall or crate stands between the two points.
export function hasLineOfSight(tiles, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x1 + dx * t) / TILE);
    const ty = Math.floor((y1 + dy * t) / TILE);
    if (blocksSight(tiles, tx, ty)) return false;
  }
  return true;
}

// canSee answers whether a guard at (gx,gy) facing `angle` can see a point
// (px,py): inside range, inside the cone, and with a clear line of sight.
export function canSee(tiles, gx, gy, angle, px, py) {
  const dx = px - gx;
  const dy = py - gy;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_SIGHT_RANGE) return false;
  if (dist < 26) return true; // too close to miss
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD_SIGHT_HALF_ANGLE) return false;
  return hasLineOfSight(tiles, gx, gy, px, py);
}

// conePolygon builds the guard's vision cone as a polygon the renderer can
// fill, clipping each ray where a wall stops it.
export function conePolygon(tiles, gx, gy, angle) {
  const points = [{ x: gx, y: gy }];
  const rays = 26;
  for (let i = 0; i <= rays; i++) {
    const a = angle - GUARD_SIGHT_HALF_ANGLE + (2 * GUARD_SIGHT_HALF_ANGLE * i) / rays;
    let r = GUARD_SIGHT_RANGE;
    // Step out along the ray until a wall stops it.
    for (let d = 8; d <= GUARD_SIGHT_RANGE; d += 8) {
      const tx = Math.floor((gx + Math.cos(a) * d) / TILE);
      const ty = Math.floor((gy + Math.sin(a) * d) / TILE);
      if (blocksSight(tiles, tx, ty)) { r = d; break; }
    }
    points.push({ x: gx + Math.cos(a) * r, y: gy + Math.sin(a) * r });
  }
  return points;
}
