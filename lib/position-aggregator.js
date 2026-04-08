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
      const tickerTxs = txs.filter(t => t.ticker === ticker);
      const asset_class = tickerTxs[0]?.asset_class ?? 'unknown';

      if (asset_class === 'euro_fund') {
        // Fonds euros : pas de parts, cost basis = flux de cash net réinvesti
        let cost_basis_eur = 0;
        for (const t of tickerTxs) {
          if (t.type === 'BUY')                                      cost_basis_eur += -(t.total_eur ?? 0);
          else if (t.type === 'SELL' || t.type === 'WITHDRAWAL')    cost_basis_eur -= (t.total_eur ?? 0);
          else if (t.type === 'INTEREST' || t.type === 'DIVIDEND')  cost_basis_eur += (t.total_eur ?? 0);
        }
        return {
          ticker,
          asset_class,
          quantity: 0,
          cost_basis_eur: Number(cost_basis_eur.toFixed(2)),
          average_cost: 0,
          realized_pnl_eur: 0
        };
      }

      const position = computePosition(tickerTxs, ticker);
      return { ...position, asset_class };
    }).filter(p => p.quantity > 0 || p.cost_basis_eur > 0); // exclure positions soldées (les deux à 0)
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
