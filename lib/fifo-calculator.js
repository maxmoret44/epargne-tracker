/**
 * fifo-calculator.js — Calcule les positions courantes par titre via FIFO.
 *
 * Conventions :
 * - cost_basis_eur = somme des coûts d'achat (incluant frais) - somme des coûts vendus FIFO
 * - average_cost = cost_basis_eur / quantity (uniquement pour les BUY restants)
 * - realized_pnl_eur = somme des PV réalisées sur les SELL
 */

export function computePosition(transactions, ticker) {
  // Filtrer les transactions du ticker, types BUY/SELL uniquement
  const lots = []; // FIFO queue : [{ qty, cost_per_unit }, ...]
  let realized_pnl_eur = 0;

  const filtered = transactions
    .filter(t => t.ticker === ticker && (t.type === 'BUY' || t.type === 'SELL'))
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of filtered) {
    if (tx.type === 'BUY') {
      const cost_per_unit = (tx.quantity * tx.price + (tx.fees_eur ?? 0)) / tx.quantity;
      lots.push({ qty: tx.quantity, cost_per_unit });
    } else if (tx.type === 'SELL') {
      let remaining = tx.quantity;
      const sell_price_net = (tx.quantity * tx.price - (tx.fees_eur ?? 0)) / tx.quantity;
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const consumed = Math.min(lot.qty, remaining);
        realized_pnl_eur += consumed * (sell_price_net - lot.cost_per_unit);
        lot.qty -= consumed;
        remaining -= consumed;
        if (lot.qty === 0) lots.shift();
      }
      if (remaining > 0) {
        throw new Error(`SELL ${tx.quantity} ${ticker} sans BUY suffisant (manque ${remaining})`);
      }
    }
  }

  const quantity = lots.reduce((acc, lot) => acc + lot.qty, 0);
  const cost_basis_eur = lots.reduce((acc, lot) => acc + lot.qty * lot.cost_per_unit, 0);
  const average_cost = quantity > 0 ? cost_basis_eur / quantity : 0;

  return {
    ticker,
    quantity: Number(quantity.toFixed(8)),
    cost_basis_eur: Number(cost_basis_eur.toFixed(2)),
    average_cost: Number(average_cost.toFixed(2)),
    realized_pnl_eur: Number(realized_pnl_eur.toFixed(2))
  };
}
