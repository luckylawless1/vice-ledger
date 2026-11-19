// Vice Ledger — hand-in program for the gta6-trophy-guide-01 entry.
//
// The guide itself is the static web app in app/ (open app/index.html in a
// browser; it works fully offline). This program's only job is to hand the
// entry in: copy app/ and screenshots/ into the output directory and write
// dossier.json there with the vendored make.fun library, byte for byte the
// way the scorer builds it.
//
// Run it the way the grader does, or locally with MAKEFUN_OUTPUT_DIR set:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps, mirrored so an over-limit entry fails here first rather
// than at the scorer: dossier text, screenshot count/size, app file count
// and app size.
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function stageIntoOutput() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  const shots = join(repoRoot, 'screenshots');
  if (existsSync(shots)) {
    cpSync(shots, join(outputDir, 'screenshots'), { recursive: true });
  }
}

stageIntoOutput();
const dossierBytes = buildDossier(outputDir, GATE_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
console.log(`vice-ledger: dossier.json written (${dossierBytes.length} bytes) to ${outputDir}`);
