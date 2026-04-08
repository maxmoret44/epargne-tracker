import { test } from 'node:test';
import assert from 'node:assert';
import { decomposeFundsToGeoSectors } from './fund-decomposer.js';

test('decomposeFundsToGeoSectors : un fonds patrimonial', () => {
  const positions = [
    { ticker: 'FR0010315770', asset_class: 'fund', quantity: 10, current_value_eur: 6500 }
  ];

  const fundSeed = {
    'FR0010315770': {
      name: 'Carmignac Patrimoine A EUR',
      geo: { 'Europe': 0.4, 'US': 0.4, 'Émergents': 0.1, 'Cash': 0.1 },
      sector: { 'Tech': 0.2, 'Santé': 0.15, 'Conso': 0.15, 'Autres': 0.5 }
    }
  };

  const result = decomposeFundsToGeoSectors(positions, fundSeed);

  // 6500 EUR × 40% Europe = 2600
  assert.strictEqual(result.geo['Europe'], 2600);
  assert.strictEqual(result.geo['US'], 2600);
  assert.strictEqual(result.sector['Tech'], 1300);
});

test('decomposeFundsToGeoSectors : fonds inconnu va dans bucket Inconnu', () => {
  const positions = [
    { ticker: 'XX0000000000', asset_class: 'fund', quantity: 1, current_value_eur: 1000 }
  ];
  const result = decomposeFundsToGeoSectors(positions, {});
  assert.strictEqual(result.geo['Inconnu'], 1000);
});

test('decomposeFundsToGeoSectors : ignore les actions individuelles', () => {
  const positions = [
    { ticker: 'GALP.LS', asset_class: 'stock', quantity: 50, current_value_eur: 1035 }
  ];
  const result = decomposeFundsToGeoSectors(positions, {});
  assert.strictEqual(Object.keys(result.geo).length, 0);
});
