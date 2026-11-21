// levels.js — the three manors of Moonlit Manor.
// Legend: '#' wall, '.' floor, '~' shadow floor (safe, dark), 'B' bush (cover),
// 'C' crate (blocks sight and movement), 'R' relic, 'E' exit, 'P' player start.
// Guards patrol between waypoints given in tile coordinates.

export const LEVELS = [
  {
    name: 'I — The Garden Gate',
    brief: 'Slip past the night watchman. Take the moonstone, then reach the green door.',
    map: [
      '########################',
      '#P....~.....#......R...#',
      '#.....~.....#...........#',
      '#..B..~..B..#....B......#',
      '#.....~.....#...........#',
      '#.....~.....#.....C.....#',
      '#..B.......B.....C......#',
      '#....####.####.####.....#',
      '#....#........#.........#',
      '#.B..#...B....#....B....#',
      '#....#........#.........#',
      '#....####.####.####..E..#',
      '#..~......~.......~....#',
      '#..~......~.......~....#',
      '########################',
    ],
    guards: [
      { patrol: [[8, 2], [8, 6], [16, 6], [16, 2]], pause: 1.2 },
      { patrol: [[19, 9], [12, 9], [12, 12], [19, 12]], pause: 0.8 },
    ],
  },
  {
    name: 'II — The Gallery',
    brief: 'Two moonstones this time, and the watch is doubled. Bushes and shadow are your friends.',
    map: [
      '########################',
      '#P..~....#.....R....~..#',
      '#....B...#...........B.#',
      '#..~....C#....####.....#',
      '#.......#.....#..#..B..#',
      '#..B....#..B..#..#.....#',
      '#....####....#....#....#',
      '#....#......~.....#..R.#',
      '#.B..#..B.........#....#',
      '#....#......C.....#....#',
      '#....####....#....#....#',
      '#..~......B..#..~....E.#',
      '#....B....~..#....B....#',
      '#..~..........#........#',
      '########################',
    ],
    guards: [
      { patrol: [[5, 2], [5, 11], [10, 11], [10, 2]], pause: 0.9 },
      { patrol: [[17, 3], [21, 3], [21, 10], [17, 10]], pause: 1.0 },
      { patrol: [[13, 6], [13, 12], [18, 12]], pause: 1.4 },
    ],
  },
  {
    name: 'III — The Vault',
    brief: 'The vault holds the last moonstones. Four guards, one door. Do not be seen.',
    map: [
      '########################',
      '#P.~...B....#...R....~.#',
      '#.....~.....#........B.#',
      '#..B..~..C..#..####....#',
      '#.....~.....#..#..#....#',
      '#..~....B...#..#..#..B.#',
      '#....####...#..#..#....#',
      '#....#..~...#..#..#....#',
      '#.B..#..B...#.....#..R.#',
      '#....#......#..C..#....#',
      '#....####...#.....#....#',
      '#..~....B...#..~....E..#',
      '#..B....~...#....B.....#',
      '#..~........#....~.....#',
      '########################',
    ],
    guards: [
      { patrol: [[6, 2], [6, 12], [11, 12], [11, 2]], pause: 0.7 },
      { patrol: [[16, 2], [21, 2], [21, 8], [16, 8]], pause: 1.1 },
      { patrol: [[14, 6], [14, 13], [20, 13]], pause: 0.9 },
      { patrol: [[9, 6], [3, 6], [3, 11], [9, 11]], pause: 1.3 },
    ],
  },
];

// parseLevel turns a level's strings into the tiles the game walks on, plus the
// starting spots for the player, the relics and the exit door.
export function parseLevel(level) {
  const tiles = level.map.map((row) => row.split(''));
  const height = tiles.length;
  const width = tiles[0].length;
  let playerStart = { x: 1.5, y: 1.5 };
  const relics = [];
  let exit = { x: 22.5, y: 11.5 };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = tiles[y][x];
      if (c === 'P') { playerStart = { x: x + 0.5, y: y + 0.5 }; tiles[y][x] = '.'; }
      if (c === 'R') { relics.push({ x: x + 0.5, y: y + 0.5, taken: false }); tiles[y][x] = '.'; }
      if (c === 'E') { exit = { x: x + 0.5, y: y + 0.5 }; tiles[y][x] = '.'; }
    }
  }
  return { tiles, width, height, playerStart, relics, exit };
}

// tileAt answers what stands on a tile: wall, crate, bush, shadow or open floor.
export function tileAt(tiles, tx, ty) {
  if (ty < 0 || ty >= tiles.length || tx < 0 || tx >= tiles[0].length) return '#';
  return tiles[ty][tx];
}

export function isSolid(tiles, tx, ty) {
  const t = tileAt(tiles, tx, ty);
  return t === '#' || t === 'C';
}

export function blocksSight(tiles, tx, ty) {
  const t = tileAt(tiles, tx, ty);
  return t === '#' || t === 'C';
}

export function isCover(tiles, tx, ty) {
  const t = tileAt(tiles, tx, ty);
  return t === 'B' || t === '~';
}
