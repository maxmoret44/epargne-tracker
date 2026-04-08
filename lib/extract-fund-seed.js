#!/usr/bin/env node
/**
 * extract-fund-seed.js — Script one-shot pour extraire FUND_SECTOR_SEED de index.html
 * et le persister en JSON dans ~/.config/epargne-tracker/fund-seed.json.
 *
 * À relancer manuellement chaque fois que fund-compo modifie FUND_SECTOR_SEED dans index.html
 * (le script suppose une exécution manuelle, pas un hook automatique).
 *
 * Usage : node ~/epargne-tracker/lib/extract-fund-seed.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

const HTML_PATH = join(homedir(), 'epargne-tracker', 'index.html');
const OUTPUT = join(homedir(), '.config', 'epargne-tracker', 'fund-seed.json');

const html = readFileSync(HTML_PATH, 'utf8');

// Extraction naïve : on cherche `const FUND_SECTOR_SEED = { ... };`
// puis on évalue le bloc dans un sandbox minimal.
const match = html.match(/const\s+FUND_SECTOR_SEED\s*=\s*(\{[\s\S]*?\n\s*\});/);
if (!match) {
  console.error('❌ FUND_SECTOR_SEED introuvable dans index.html');
  process.exit(1);
}

// Parse via Function constructor (pas eval, mais accepte du JS object literal)
let seed;
try {
  seed = Function(`"use strict"; return (${match[1]});`)();
} catch (e) {
  console.error(`❌ Impossible de parser FUND_SECTOR_SEED : ${e.message}`);
  process.exit(1);
}

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(seed, null, 2));
console.log(`✅ FUND_SECTOR_SEED extrait vers ${OUTPUT}`);
console.log(`   ${Object.keys(seed).length} fonds décomposés`);
