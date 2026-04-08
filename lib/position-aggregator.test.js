import { test } from 'node:test';
import assert from 'node:assert';
import { aggregatePositions } from './position-aggregator.js';
import { computeCashByAccount } from './position-aggregator.js';

test('aggregatePositions : groupe par compte et calcule positions', () => {
  const transactions = [
    { date: '2024-03-12', account: 'PEA-TR', type: 'BUY', asset_class: 'stock', ticker: 'GALP.LS', quantity: 50, price: 12.40, fees_eur: 2.50, total_eur: -622.50 },
    { date: '2024-05-10', account: 'BoursoVie', type: 'BUY', asset_class: 'fund', ticker: 'FR0010315770', quantity: 2.5, price: 650.20, fees_eur: 0, total_eur: -1625.50 }
  ];

  const result = aggregatePositions(transactions);

  assert.deepStrictEqual(Object.keys(result).sort(), ['BoursoVie', 'PEA-TR']);
  assert.strictEqual(result['PEA-TR'].length, 1);
  assert.strictEqual(result['PEA-TR'][0].ticker, 'GALP.LS');
  assert.strictEqual(result['PEA-TR'][0].quantity, 50);
});

test('computeCashByAccount : somme algébrique des total_eur', () => {
  const transactions = [
    { date: '2024-02-01', account: 'PEA-TR', type: 'DEPOSIT', total_eur: 500.00 },
    { date: '2024-03-12', account: 'PEA-TR', type: 'BUY', total_eur: -622.50 },
    { date: '2024-09-08', account: 'PEA-TR', type: 'BUY', total_eur: -428.50 },
    { date: '2025-04-15', account: 'PEA-TR', type: 'DIVIDEND', total_eur: 12.34 },
    { date: '2026-01-20', account: 'PEA-TR', type: 'SELL', total_eur: 801.50 },
    { date: '2024-02-01', account: 'BoursoVie', type: 'DEPOSIT', total_eur: 1500.00 }
  ];

  const cash = computeCashByAccount(transactions);

  // PEA-TR : 500 - 622.50 - 428.50 + 12.34 + 801.50 = 262.84
  assert.strictEqual(cash['PEA-TR'], 262.84);
  assert.strictEqual(cash['BoursoVie'], 1500.00);
});
