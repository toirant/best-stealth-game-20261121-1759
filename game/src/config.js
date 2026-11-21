// config.js — the numbers that tune Moonlit Manor: sizes, speeds, sight and sound.
// One place for every magic number so levels.js and the systems can share them.

export const TILE = 40;                 // one grid cell, in pixels
export const VIEW_W = 960;               // canvas size
export const VIEW_H = 600;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 150;    // pixels per second
export const PLAYER_SNEAK_SPEED = 78;
export const PLAYER_NOISE_WALK = 70;     // noise radius while walking
export const PLAYER_NOISE_SNEAK = 18;

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 132;
export const GUARD_SIGHT_RANGE = 215;   // how far a guard can see
export const GUARD_SIGHT_HALF_ANGLE = 0.61; // ~35 degrees each side of facing
export const GUARD_TURN_SPEED = 2.4;     // radians per second while scanning

export const SUSPICION_PER_SECOND = 1.15;   // full meter in under a second, in the open
export const SUSPICION_SHADOW_FACTOR = 0.38; // hiding in shadow or bush slows it
export const SUSPICION_SNEAK_FACTOR = 0.55;
export const SUSPICION_DECAY = 0.45;        // per second while unseen
export const ALERT_CHASE_SECONDS = 4.0;     // how long a guard hunts before giving up
export const INVESTIGATE_SECONDS = 3.5;     // how long a guard stares at a noise

export const COINS_PER_LEVEL = 3;
export const COIN_NOISE_RADIUS = 150;       // guards inside this hear the coin land

export const PALETTE = {
  floor: '#1c2242',
  floorAlt: '#1a1f3c',
  shadowFloor: '#12162c',   // dark tiles: safe to hide in
  wall: '#4a4f7d',
  wallTop: '#6a70a8',
  bush: '#1f4d2e',
  bushLeaf: '#2f7a44',
  crate: '#5a4026',
  crateEdge: '#8a6a3f',
  exit: '#39d98a',
  exitGlow: '#1d7a4e',
  relic: '#ffd75e',
  player: '#7fe7ff',
  playerSneak: '#4fb3d9',
  guard: '#ff5d5d',
  guardCalm: '#e8b34a',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneAlert: 'rgba(255, 70, 70, 0.28)',
  coneEdge: 'rgba(255, 214, 90, 0.55)',
  hud: '#e8ecff',
  hudDim: '#8b93b8',
  gold: '#ffd75e',
};
