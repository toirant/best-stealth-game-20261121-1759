// guards.js — the night watch. A guard patrols its waypoints, pauses to scan,
// grows suspicious when it glimpses the player, gives chase when sure, and
// walks over to investigate a noise. Suspicion fades when the player is unseen.

import { TILE, GUARD_RADIUS, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_TURN_SPEED,
  SUSPICION_PER_SECOND, SUSPICION_SHADOW_FACTOR, SUSPICION_SNEAK_FACTOR,
  SUSPICION_DECAY, ALERT_CHASE_SECONDS, INVESTIGATE_SECONDS } from './config.js';
import { canSee } from './vision.js';
import { isCover } from './levels.js';

export function createGuard(def) {
  const waypoints = def.patrol.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }));
  return {
    x: waypoints[0].x,
    y: waypoints[0].y,
    angle: 0,
    waypoints,
    waypointIndex: 1 % waypoints.length,
    pause: def.pause || 1,
    pauseTimer: 0,
    state: 'patrol',        // patrol | suspicious | alert | investigate | return
    suspicion: 0,           // 0..1; 1 means the guard is sure it saw you
    stateTimer: 0,
    investigateTarget: null,
    lastSeen: null,
    stepTimer: 0,
  };
}

function angleTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }

function turnToward(guard, target, dt) {
  let diff = target - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const step = GUARD_TURN_SPEED * dt;
  guard.angle += Math.max(-step, Math.min(step, diff));
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  turnToward(guard, angleTo(guard.x, guard.y, tx, ty), dt);
  return dist - step < 2;
}

// updateGuard runs one guard for a frame. It returns events the game loop acts
// on: 'spotted' when suspicion first fills, 'caught' when it touches the player.
export function updateGuard(guard, tiles, player, dt, onNoise) {
  const events = [];
  const px = player.x;
  const py = player.y;
  const seen = canSee(tiles, guard.x, guard.y, guard.angle, px, py);

  if (seen) {
    // Hiding in cover or sneaking buys time; standing in the open does not.
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    let rate = SUSPICION_PER_SECOND;
    if (isCover(tiles, tx, ty)) rate *= SUSPICION_SHADOW_FACTOR;
    if (player.sneaking) rate *= SUSPICION_SNEAK_FACTOR;
    guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
    guard.lastSeen = { x: px, y: py };
    if (guard.suspicion >= 1 && guard.state !== 'alert') {
      guard.state = 'alert';
      guard.stateTimer = ALERT_CHASE_SECONDS;
      events.push('spotted');
    }
  } else if (guard.state !== 'alert') {
    guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt);
  }

  // Footstep noise: a walking player is heard nearby; a sneaking one is not.
  const distToPlayer = Math.hypot(px - guard.x, py - guard.y);
  if (player.noiseRadius > 0 && distToPlayer < player.noiseRadius && guard.state === 'patrol') {
    guard.state = 'investigate';
    guard.investigateTarget = { x: px, y: py };
    guard.stateTimer = INVESTIGATE_SECONDS;
  }

  switch (guard.state) {
    case 'patrol': {
      if (guard.pauseTimer > 0) {
        guard.pauseTimer -= dt;
        guard.angle += Math.sin(performance.now() / 900) * 0.4 * dt; // look around
        break;
      }
      const target = guard.waypoints[guard.waypointIndex];
      if (moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED, dt)) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pauseTimer = guard.pause;
      }
      break;
    }
    case 'suspicious': {
      // A half-seen player makes the guard stop and stare toward them.
      if (guard.lastSeen) turnToward(guard, angleTo(guard.x, guard.y, guard.lastSeen.x, guard.lastSeen.y), dt);
      if (guard.suspicion <= 0.05) { guard.state = 'patrol'; }
      break;
    }
    case 'alert': {
      guard.stateTimer -= dt;
      const target = guard.lastSeen || { x: px, y: py };
      moveToward(guard, target.x, target.y, GUARD_CHASE_SPEED, dt);
      if (Math.hypot(px - guard.x, py - guard.y) < GUARD_RADIUS + 14) events.push('caught');
      if (guard.stateTimer <= 0) {
        guard.state = 'patrol';
        guard.suspicion = 0.4;
      }
      break;
    }
    case 'investigate': {
      guard.stateTimer -= dt;
      const target = guard.investigateTarget;
      if (target && moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED * 1.5, dt)) {
        guard.pauseTimer = 1.2;
        guard.state = 'patrol';
      }
      if (guard.stateTimer <= 0) { guard.state = 'patrol'; }
      break;
    }
    default:
      guard.state = 'patrol';
  }

  // A guard that is halfway sure stops patrolling and stares.
  if (guard.state === 'patrol' && guard.suspicion > 0.45) guard.state = 'suspicious';
  if (guard.state === 'suspicious' && guard.suspicion >= 1 && guard.state !== 'alert') {
    guard.state = 'alert';
    guard.stateTimer = ALERT_CHASE_SECONDS;
    events.push('spotted');
  }
  return events;
}

// hearNoise sends every patrolling guard toward a point (a tossed coin).
export function hearNoise(guards, x, y, radius) {
  for (const g of guards) {
    if (g.state !== 'patrol' && g.state !== 'suspicious') continue;
    if (Math.hypot(x - g.x, y - g.y) <= radius) {
      g.state = 'investigate';
      g.investigateTarget = { x, y };
      g.stateTimer = INVESTIGATE_SECONDS;
    }
  }
}
