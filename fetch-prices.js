#!/usr/bin/env node
/**
 * fetch-prices.js — Récupère les prix marché courants et écrit prices.json.
 *
 * Lit le ledger pour déterminer les tickers actuellement détenus,
 * appelle Yahoo Finance pour chacun (selon mapping ISIN_TO_YAHOO),
 * et écrit le résultat dans ~/.config/epargne-tracker/prices.json.
 *
 * Usage : node fetch-prices.js
 * Puis  : node generate-snapshot.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

import { parseLedger } from './lib/ledger-parser.js';
import { aggregatePositions } from './lib/position-aggregator.js';
import { fetchPrices } from './lib/price-fetcher.js';

const VAULT_ROOT = join(homedir(), 'neural-network-vault');
const LEDGER_PATH = join(VAULT_ROOT, 'Custom-Skills', 'Finance', 'Investment-Journal', 'ledger.csv');
const PRICES_PATH = join(homedir(), '.config', 'epargne-tracker', 'prices.json');

async function main() {
  const csv = readFileSync(LEDGER_PATH, 'utf8');
  const txs = parseLedger(csv);
  const positionsByAccount = aggregatePositions(txs);

  // Tickers actuellement détenus (quantity > 0)
  const heldTickers = new Set();
  for (const positions of Object.values(positionsByAccount)) {
    for (const p of positions) {
      if (p.quantity > 0 && p.ticker) heldTickers.add(p.ticker);
    }
  }

  console.log(`📊 ${heldTickers.size} tickers détenus à fetcher`);

  const { prices, skipped } = await fetchPrices([...heldTickers]);

  console.log(`✅ ${Object.keys(prices).length} prix récupérés :`);
  for (const [ticker, price] of Object.entries(prices)) {
    console.log(`   ${ticker} → €${price}`);
  }

  if (skipped.length > 0) {
    console.log(`\n⚠️  ${skipped.length} tickers skippés (fallback cost) :`);
    for (const { ticker, reason } of skipped) {
      console.log(`   ${ticker} : ${reason}`);
    }
  }

  mkdirSync(dirname(PRICES_PATH), { recursive: true });
  writeFileSync(PRICES_PATH, JSON.stringify(prices, null, 2), 'utf8');
  console.log(`\n💾 Écrit : ${PRICES_PATH}`);
}

main().catch(e => {
  console.error('❌', e);
  process.exit(1);
});
