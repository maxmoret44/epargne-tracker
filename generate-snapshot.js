#!/usr/bin/env node
/**
 * generate-snapshot.js — Épargne Tracker → Neural Network Vault (V2 Graham)
 *
 * Lit le ledger.csv canonique du vault, calcule les positions courantes via FIFO,
 * croise avec les prix marché actuels et FUND_SECTOR_SEED pour les allocations,
 * et génère le snapshot markdown dans Context/epargne-snapshot.md.
 *
 * Source de vérité : ~/neural-network-vault/Custom-Skills/Finance/Investment-Journal/ledger.csv
 * Output           : ~/neural-network-vault/Context/epargne-snapshot.md
 *
 * Usage : node ~/epargne-tracker/generate-snapshot.js
 *
 * Note : la récupération des prix marché actuels reste à implémenter selon le scénario
 * choisi en Task 27. En attendant, les prix sont passés en input via un fichier
 * optionnel ~/.config/epargne-tracker/prices.json (mapping ticker → prix EUR).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

import { parseLedger } from './lib/ledger-parser.js';
import { aggregatePositions, computeCashByAccount } from './lib/position-aggregator.js';
import { computePosition } from './lib/fifo-calculator.js';
import { decomposeFundsToGeoSectors } from './lib/fund-decomposer.js';
import { renderSnapshot } from './lib/snapshot-renderer.js';

const VAULT_ROOT  = join(homedir(), 'neural-network-vault');
const LEDGER_PATH = join(VAULT_ROOT, 'Custom-Skills', 'Finance', 'Investment-Journal', 'ledger.csv');
const SNAPSHOT_PATH = join(VAULT_ROOT, 'Context', 'epargne-snapshot.md');
const PRICES_PATH = join(homedir(), '.config', 'epargne-tracker', 'prices.json');
const FUND_SEED_PATH = join(homedir(), '.config', 'epargne-tracker', 'fund-seed.json');

function loadJsonOrEmpty(path) {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.warn(`⚠️ Impossible de parser ${path} : ${e.message}. Utilisation d'un objet vide.`);
    return {};
  }
}

function main() {
  // 1. Lire le ledger
  if (!existsSync(LEDGER_PATH)) {
    console.error(`❌ Ledger introuvable : ${LEDGER_PATH}`);
    console.error(`   Créer le fichier (chantier 3 du design Graham) avant de relancer.`);
    process.exit(1);
  }
  const ledgerCsv = readFileSync(LEDGER_PATH, 'utf8');
  const transactions = parseLedger(ledgerCsv);
  console.log(`✅ ${transactions.length} transactions lues depuis ledger.csv`);

  // 2. Charger les prix marché et FUND_SECTOR_SEED
  const prices = loadJsonOrEmpty(PRICES_PATH);
  const fundSeed = loadJsonOrEmpty(FUND_SEED_PATH);

  // 3. Calculer les positions FIFO par compte
  const positionsByAccount = aggregatePositions(transactions);
  const cashByAccount = computeCashByAccount(transactions);

  // 4. Enrichir avec prix marché courants
  for (const positions of Object.values(positionsByAccount)) {
    for (const p of positions) {
      if (p.asset_class === 'euro_fund') {
        // Fonds euro : pas de parts cotées, valeur = cost basis (intérêts capitalisés directement)
        p.current_price = 0;
        p.current_value_eur = p.cost_basis_eur;
        p.pv_latente_eur = 0;
        p.pv_pct = 0;
      } else {
        const current_price = prices[p.ticker] ?? p.average_cost; // fallback : prix d'achat
        p.current_price = current_price;
        p.current_value_eur = Number((p.quantity * current_price).toFixed(2));
        p.pv_latente_eur = Number((p.current_value_eur - p.cost_basis_eur).toFixed(2));
        p.pv_pct = p.cost_basis_eur > 0 ? Number((p.pv_latente_eur / p.cost_basis_eur * 100).toFixed(2)) : 0;
      }
    }
  }

  // 5. Allocation géo/sectorielle (sur tout le portefeuille agrégé)
  const allPositions = Object.values(positionsByAccount).flat();
  const { geo, sector } = decomposeFundsToGeoSectors(allPositions, fundSeed);

  // 6. Totaux (positions + cash buffers par compte)
  const total_cash_eur = Object.values(cashByAccount).reduce((acc, c) => acc + c, 0);
  const total_value_eur = Number((allPositions.reduce((acc, p) => acc + p.current_value_eur, 0) + total_cash_eur).toFixed(2));
  const total_pv_latente_eur = Number(allPositions.reduce((acc, p) => acc + p.pv_latente_eur, 0).toFixed(2));

  // PV réalisée : on calcule sur TOUS les tickers (y compris ceux soldés et filtrés des positions)
  const allTickers = new Set(transactions.filter(t => t.ticker && t.asset_class !== 'euro_fund').map(t => t.ticker));
  let total_realized_pnl_eur = 0;
  for (const ticker of allTickers) {
    const tickerTxs = transactions.filter(t => t.ticker === ticker);
    try {
      const pos = computePosition(tickerTxs, ticker);
      total_realized_pnl_eur += pos.realized_pnl_eur;
    } catch (e) {
      console.warn(`⚠️  realized PnL ${ticker}: ${e.message}`);
    }
  }
  total_realized_pnl_eur = Number(total_realized_pnl_eur.toFixed(2));

  // 7. Render
  const md = renderSnapshot({
    generated_at: new Date().toISOString().slice(0, 10),
    positions_by_account: positionsByAccount,
    cash_by_account: cashByAccount,
    geo_allocation: geo,
    sector_allocation: sector,
    total_value_eur,
    total_pv_latente_eur,
    total_realized_pnl_eur
  });

  // 8. Write
  mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, md, 'utf8');
  console.log(`✅ Snapshot écrit : ${SNAPSHOT_PATH}`);
}

main();
