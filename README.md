[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/toirant/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/toirant/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Moonlit Manor — a stealth game

A make.fun entry for **best-stealth-game-20261121-1759** ("Make the best stealth game").

You are a thief in a moonlit manor. Steal every moonstone, reach the green exit
door, and never let a watchman see you.

## How to play

Open `game/index.html` in a desktop browser. No build step, no network requests.

- **WASD / arrow keys** — move
- **Hold Shift** — sneak (slower, quieter, harder to spot)
- **Click** — toss a coin to distract a nearby guard (3 per level)
- **Enter** — start / play again

## The stealth

- Guards patrol waypoints and pause to scan. Their yellow vision cones are cut
  short by walls and crates — if you can see the cone, the guard can see you.
- Being seen fills a guard's suspicion meter (shown above his head). Bushes and
  shadow floor slow it; sneaking slows it more. A full meter means **! SPOTTED**:
  the guard gives chase. Break line of sight and he gives up.
- Running is loud: guards nearby hear your footsteps and come to investigate.
- Collect every moonstone to unlock the exit, then slip through the door.

Three levels: The Garden Gate, The Gallery, and The Vault — more guards, more
moonstones, tighter patrols. Synthesized WebAudio sounds (footsteps, coin,
alarm, win jingle); no sound files.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `game/index.html` — the page; `game/src/` holds the game, one job per file:
  `config.js` (tuning), `levels.js` (the three manors), `input.js`, `audio.js`,
  `vision.js` (cones and line of sight), `guards.js` (patrol AI), `player.js`,
  `render.js`, `main.js` (loop and states).
- `screenshots/` — four real renders of the game in headless Chromium:
  title, mid-heist, spotted, victory.

## Validate locally

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`out/` then holds `game/`, `screenshots/` and `dossier.json`.

License: MIT (see `LICENSE`).
