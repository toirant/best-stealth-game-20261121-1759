// main.ts — Moonlit Manor's hand-in program.
// Copies game/ and screenshots/ from this repository into the output directory
// and writes /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Runs on plain `node main.ts` (Node 22, standard library only, no network).
// The output directory is created if missing and its contents are cleared, but
// the directory itself is never removed: the grader mounts it.

import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function clearDirectoryContents(dir) {
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function main() {
  mkdirSync(outputDir, { recursive: true });
  clearDirectoryContents(outputDir);

  const gameSource = join(repoRoot, 'game');
  const shotsSource = join(repoRoot, 'screenshots');
  if (!existsSync(gameSource)) throw new Error('game/ is missing from the repository');
  if (!existsSync(shotsSource)) throw new Error('screenshots/ is missing from the repository');

  cpSync(gameSource, join(outputDir, 'game'), { recursive: true });
  cpSync(shotsSource, join(outputDir, 'screenshots'), { recursive: true });

  const dossier = buildDossier(outputDir, DOSSIER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);

  // A short report on stdout so a run's result is visible in the grader's log.
  const shotNames = readdirSync(join(outputDir, 'screenshots')).sort();
  console.log(`Moonlit Manor: wrote ${outputDir}/game, ${shotNames.length} screenshots, dossier.json (${dossier.length} bytes)`);
}

main();
