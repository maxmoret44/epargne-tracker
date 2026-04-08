import { test } from 'node:test';
import assert from 'node:assert';
import { parseLedger } from './ledger-parser.js';

test('parseLedger : ligne BUY simple', () => {
  const csv = [
    'date,account,type,asset_class,ticker,name,quantity,price,currency,fees_eur,total_eur,notes',
    '2024-03-12,PEA-TR,BUY,stock,GALP.LS,Galp Energia,50,12.40,EUR,2.50,-622.50,Premier achat'
  ].join('\n');

  const result = parseLedger(csv);

  assert.strictEqual(result.length, 1);
  assert.deepStrictEqual(result[0], {
    date: '2024-03-12',
    account: 'PEA-TR',
    type: 'BUY',
    asset_class: 'stock',
    ticker: 'GALP.LS',
    name: 'Galp Energia',
    quantity: 50,
    price: 12.40,
    currency: 'EUR',
    fees_eur: 2.50,
    total_eur: -622.50,
    notes: 'Premier achat'
  });
});

test('parseLedger : ligne DIVIDEND avec champs vides', () => {
  const csv = [
    'date,account,type,asset_class,ticker,name,quantity,price,currency,fees_eur,total_eur,notes',
    '2025-04-15,PEA-TR,DIVIDEND,stock,GALP.LS,Galp Energia,0,,EUR,0,12.34,Dividende net'
  ].join('\n');

  const result = parseLedger(csv);

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].type, 'DIVIDEND');
  assert.strictEqual(result[0].quantity, 0);
  assert.strictEqual(result[0].price, null); // champ vide → null
  assert.strictEqual(result[0].total_eur, 12.34);
});

test('parseLedger : plusieurs lignes', () => {
  const csv = [
    'date,account,type,asset_class,ticker,name,quantity,price,currency,fees_eur,total_eur,notes',
    '2024-03-12,PEA-TR,BUY,stock,GALP.LS,Galp Energia,50,12.40,EUR,2.50,-622.50,Premier achat',
    '2024-09-08,PEA-TR,BUY,stock,GALP.LS,Galp Energia,30,14.20,EUR,2.50,-428.50,Renforcement',
    '2026-01-20,PEA-TR,SELL,stock,GALP.LS,Galp Energia,40,20.10,EUR,2.50,801.50,Allègement'
  ].join('\n');

  const result = parseLedger(csv);

  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[0].type, 'BUY');
  assert.strictEqual(result[2].type, 'SELL');
  assert.strictEqual(result[2].total_eur, 801.50);
});

test('parseLedger : ledger vide (header seul)', () => {
  const csv = 'date,account,type,asset_class,ticker,name,quantity,price,currency,fees_eur,total_eur,notes';
  const result = parseLedger(csv);
  assert.strictEqual(result.length, 0);
});
