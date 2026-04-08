import { test } from 'node:test';
import assert from 'node:assert';
import { renderSnapshot } from './snapshot-renderer.js';

test('renderSnapshot : structure de base', () => {
  const data = {
    generated_at: '2026-04-08',
    positions_by_account: {
      'PEA-TR': [
        { ticker: 'GALP.LS', asset_class: 'stock', quantity: 40, average_cost: 13.83, current_price: 20.70, current_value_eur: 828.00, pv_latente_eur: 274.80, pv_pct: 49.7 }
      ]
    },
    cash_by_account: { 'PEA-TR': 262.84 },
    geo_allocation: { 'Europe': 828, 'US': 0 },
    sector_allocation: { 'Énergie': 828 },
    total_value_eur: 1090.84,
    total_pv_latente_eur: 274.80
  };

  const md = renderSnapshot(data);

  assert.match(md, /Snapshot Portefeuille/);
  assert.match(md, /2026-04-08/);
  assert.match(md, /GALP\.LS/);
  assert.match(md, /\+49\.7%/);
  assert.match(md, /1090\.84/);
});
