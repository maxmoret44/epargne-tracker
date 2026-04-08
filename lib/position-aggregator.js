import { computePosition } from './fifo-calculator.js';

/**
 * aggregatePositions — groupe les transactions par compte puis calcule les positions courantes.
 *
 * Returns : { [account]: [position, ...] }
 *   où position = { ticker, asset_class, quantity, cost_basis_eur, average_cost, realized_pnl_eur }
 */
export function aggregatePositions(transactions) {
  const byAccount = {};

  // Grouper par compte
  for (const tx of transactions) {
    if (!byAccount[tx.account]) byAccount[tx.account] = [];
    byAccount[tx.account].push(tx);
  }

  // Pour chaque compte, calculer les positions par ticker
  const result = {};
  for (const [account, txs] of Object.entries(byAccount)) {
    const tickers = new Set(txs.filter(t => t.ticker).map(t => t.ticker));
    result[account] = [...tickers].map(ticker => {
      const position = computePosition(txs, ticker);
      const asset_class = txs.find(t => t.ticker === ticker)?.asset_class ?? 'unknown';
      return { ...position, asset_class };
    }).filter(p => p.quantity > 0); // exclure les positions soldées
  }

  return result;
}

export function computeCashByAccount(transactions) {
  const cash = {};
  for (const tx of transactions) {
    if (!cash[tx.account]) cash[tx.account] = 0;
    cash[tx.account] += tx.total_eur ?? 0;
  }
  // Arrondir à 2 décimales pour éviter les artefacts flottants
  for (const k of Object.keys(cash)) {
    cash[k] = Number(cash[k].toFixed(2));
  }
  return cash;
}
