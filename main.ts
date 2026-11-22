import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function ensureReadableTree(dir: string): void {
  chmodSync(dir, 0o755);
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      ensureReadableTree(full);
    } else {
      chmodSync(full, 0o644);
    }
  }
}

mkdirSync(OUTPUT_DIR, { recursive: true, mode: 0o755 });
chmodSync(OUTPUT_DIR, 0o755);

const outGame = join(OUTPUT_DIR, 'game');
const outShots = join(OUTPUT_DIR, 'screenshots');

cpSync(join(ROOT_DIR, 'game'), outGame, { recursive: true });
ensureReadableTree(outGame);

mkdirSync(outShots, { recursive: true, mode: 0o755 });
if (existsSync(join(ROOT_DIR, 'screenshots'))) {
  cpSync(join(ROOT_DIR, 'screenshots'), outShots, { recursive: true });
  ensureReadableTree(outShots);
}

const dossierJson = buildDossier(OUTPUT_DIR, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

const dossierFile = join(OUTPUT_DIR, 'dossier.json');
writeFileSync(dossierFile, dossierJson, { mode: 0o644 });
chmodSync(dossierFile, 0o644);
