import { test } from 'node:test';
import assert from 'node:assert';
import { computePosition } from './fifo-calculator.js';

test('computePosition : un seul BUY', () => {
  const transactions = [
    { date: '2024-03-12', type: 'BUY', ticker: 'GALP.LS', quantity: 50, price: 12.40, fees_eur: 2.50, total_eur: -622.50 }
  ];

  const result = computePosition(transactions, 'GALP.LS');

  assert.strictEqual(result.quantity, 50);
  assert.strictEqual(result.cost_basis_eur, 622.50); // total payé incluant frais
  assert.strictEqual(result.average_cost, 12.45); // (50*12.40 + 2.50) / 50
});

test('computePosition : 2 BUYs puis 1 SELL partiel FIFO', () => {
  const transactions = [
    { date: '2024-03-12', type: 'BUY', ticker: 'GALP.LS', quantity: 50, price: 12.40, fees_eur: 2.50, total_eur: -622.50 },
    { date: '2024-09-08', type: 'BUY', ticker: 'GALP.LS', quantity: 30, price: 14.20, fees_eur: 2.50, total_eur: -428.50 },
    { date: '2026-01-20', type: 'SELL', ticker: 'GALP.LS', quantity: 40, price: 20.10, fees_eur: 2.50, total_eur: 801.50 }
  ];

  const result = computePosition(transactions, 'GALP.LS');

  // 50 + 30 - 40 = 40 restant
  assert.strictEqual(result.quantity, 40);

  // FIFO : on vend 40 du lot 1 (cost_per_unit = (50*12.40 + 2.50)/50 = 12.45)
  // Lot 1 reste : 10 @ 12.45 = 124.50
  // Lot 2 : 30 @ ((30*14.20 + 2.50)/30 = 14.283...) ≈ 428.50
  // cost_basis_eur = 124.50 + 428.50 = 553.00
  assert.strictEqual(result.cost_basis_eur, 553.00);

  // PV réalisée : 40 vendus à (40*20.10 - 2.50)/40 = 20.0375 vs cost_per_unit lot 1 = 12.45
  // PV = 40 * (20.0375 - 12.45) = 40 * 7.5875 = 303.50
  assert.strictEqual(result.realized_pnl_eur, 303.50);
});

test('computePosition : SELL sans BUY suffisant lève une erreur', () => {
  const transactions = [
    { date: '2024-03-12', type: 'BUY', ticker: 'X', quantity: 10, price: 100, fees_eur: 0, total_eur: -1000 },
    { date: '2024-04-01', type: 'SELL', ticker: 'X', quantity: 20, price: 110, fees_eur: 0, total_eur: 2200 }
  ];

  assert.throws(() => computePosition(transactions, 'X'), /sans BUY suffisant/);
});

test('computePosition : ticker absent retourne quantity 0', () => {
  const transactions = [
    { date: '2024-03-12', type: 'BUY', ticker: 'A', quantity: 10, price: 100, fees_eur: 0, total_eur: -1000 }
  ];

  const result = computePosition(transactions, 'B');

  assert.strictEqual(result.quantity, 0);
  assert.strictEqual(result.cost_basis_eur, 0);
});

test('computePosition : quantity arrondie à 8 décimales (no float artifacts)', () => {
  const transactions = [
    { date: '2024-01-01', type: 'BUY', ticker: 'X', quantity: 1.1215, price: 66.87, fees_eur: 0, total_eur: -75.00 },
    { date: '2024-02-01', type: 'SELL', ticker: 'X', quantity: 0.534, price: 119.48, fees_eur: 0, total_eur: 63.77 }
  ];

  const result = computePosition(transactions, 'X');

  // 1.1215 - 0.534 = 0.5875 exactement, mais JS float donne 0.5874999999999999
  assert.strictEqual(result.quantity, 0.5875);
});

test('computePosition : précision crypto BTC préservée (8 décimales)', () => {
  // Petits achats DCA BTC ~ satoshis : doivent être conservés sans perte
  const transactions = [
    { date: '2025-02-02', type: 'BUY', ticker: 'BTC', quantity: 0.000104, price: 105000, fees_eur: 0, total_eur: -10.92 },
    { date: '2025-02-02', type: 'BUY', ticker: 'BTC', quantity: 0.00042, price: 97571.43, fees_eur: 0, total_eur: -40.98 },
    { date: '2025-03-17', type: 'BUY', ticker: 'BTC', quantity: 0.000063, price: 79206.35, fees_eur: 0, total_eur: -4.99 }
  ];

  const result = computePosition(transactions, 'BTC');

  // 0.000104 + 0.00042 + 0.000063 = 0.000587
  assert.strictEqual(result.quantity, 0.000587);
});
