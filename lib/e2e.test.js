import { test } from 'node:test';
import assert from 'node:assert';
import { parseLedger } from './ledger-parser.js';
import { aggregatePositions, computeCashByAccount } from './position-aggregator.js';
import { decomposeFundsToGeoSectors } from './fund-decomposer.js';
import { renderSnapshot } from './snapshot-renderer.js';

test('E2E : ledger fictif → snapshot complet', () => {
  const csv = [
    'date,account,type,asset_class,ticker,name,quantity,price,currency,fees_eur,total_eur,notes',
    '2024-02-01,PEA-TR,DEPOSIT,cash,,,0,,EUR,0,1000.00,Versement initial',
    '2024-03-12,PEA-TR,BUY,stock,GALP.LS,Galp Energia,50,12.40,EUR,2.50,-622.50,Premier achat',
    '2024-09-08,PEA-TR,BUY,stock,GALP.LS,Galp Energia,30,14.20,EUR,2.50,-428.50,Renforcement',
    '2024-05-10,BoursoVie,BUY,fund,FR0010315770,Carmignac Patrimoine,2.5,650.20,EUR,0,-1625.50,Arbitrage UC',
    '2024-11-15,CTO-TR,BUY,crypto,BTC,Bitcoin,0.025,38500,EUR,2.50,-965.00,Achat BTC'
  ].join('\n');

  const transactions = parseLedger(csv);
  assert.strictEqual(transactions.length, 5);

  const positions = aggregatePositions(transactions);
  assert.ok(positions['PEA-TR']);
  assert.ok(positions['BoursoVie']);
  assert.ok(positions['CTO-TR']);

  // GALP : 50 + 30 = 80 titres
  const galp = positions['PEA-TR'].find(p => p.ticker === 'GALP.LS');
  assert.strictEqual(galp.quantity, 80);

  const cash = computeCashByAccount(transactions);
  // PEA-TR : 1000 - 622.50 - 428.50 = -51.00 (cash négatif → BUY > DEPOSIT)
  assert.strictEqual(cash['PEA-TR'], -51.00);

  // Render avec prix fictifs
  const allPositions = Object.values(positions).flat();
  for (const p of allPositions) {
    p.current_price = p.average_cost * 1.2; // simule +20%
    p.current_value_eur = Number((p.quantity * p.current_price).toFixed(2));
    p.pv_latente_eur = Number((p.current_value_eur - p.cost_basis_eur).toFixed(2));
    p.pv_pct = (p.pv_latente_eur / p.cost_basis_eur * 100);
  }

  const { geo, sector } = decomposeFundsToGeoSectors(allPositions, {});
  // FUND_SEED vide → fonds Carmignac va dans Inconnu
  assert.ok(geo['Inconnu'] > 0);

  const md = renderSnapshot({
    generated_at: '2026-04-08',
    positions_by_account: positions,
    cash_by_account: cash,
    geo_allocation: geo,
    sector_allocation: sector,
    total_value_eur: 5000,
    total_pv_latente_eur: 800
  });

  assert.match(md, /Snapshot Portefeuille/);
  assert.match(md, /GALP\.LS/);
});
