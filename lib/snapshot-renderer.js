/**
 * snapshot-renderer.js — Génère le markdown du snapshot pour le vault Obsidian.
 *
 * Output : Context/epargne-snapshot.md
 */

export function renderSnapshot(data) {
  const lines = [];

  lines.push('---');
  lines.push('status: generated');
  lines.push('tags: [snapshot, finance, auto]');
  lines.push(`generated_at: ${data.generated_at}`);
  lines.push('source: ledger.csv');
  lines.push('---');
  lines.push('');
  lines.push('← [[Context/Context MOC]]');
  lines.push('');
  lines.push(`# Snapshot Portefeuille — ${data.generated_at}`);
  lines.push('');
  lines.push(`> Source : \`Investment-Journal/ledger.csv\` | Calculs FIFO exacts | Généré par \`epargne-tracker/generate-snapshot.js\``);
  lines.push('');

  lines.push('## 💰 Synthèse');
  lines.push('');
  lines.push(`- **Valeur totale du portefeuille :** €${data.total_value_eur.toFixed(2)}`);
  lines.push(`- **Plus-value latente totale :** €${data.total_pv_latente_eur.toFixed(2)}`);
  if (typeof data.total_realized_pnl_eur === 'number') {
    lines.push(`- **Plus-value réalisée totale :** €${data.total_realized_pnl_eur.toFixed(2)}`);
    const total_pv = data.total_pv_latente_eur + data.total_realized_pnl_eur;
    lines.push(`- **Plus-value totale (latente + réalisée) :** €${total_pv.toFixed(2)}`);
  }
  lines.push('');

  lines.push('## 📊 Positions par compte');
  lines.push('');
  for (const [account, positions] of Object.entries(data.positions_by_account)) {
    lines.push(`### ${account}`);
    lines.push('');
    lines.push(`Cash disponible : €${(data.cash_by_account[account] ?? 0).toFixed(2)}`);
    lines.push('');
    lines.push('| Ticker | Class | Qty | Coût moy | Prix marché | Valeur | PV |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const p of positions) {
      lines.push(`| ${p.ticker} | ${p.asset_class} | ${p.quantity} | €${p.average_cost.toFixed(2)} | €${p.current_price.toFixed(2)} | €${p.current_value_eur.toFixed(2)} | +${p.pv_pct.toFixed(1)}% |`);
    }
    lines.push('');
  }

  lines.push('## 🌍 Allocation géographique');
  lines.push('');
  for (const [geo, value] of Object.entries(data.geo_allocation)) {
    const pct = (value / data.total_value_eur * 100).toFixed(1);
    lines.push(`- **${geo}** : €${value.toFixed(2)} (${pct}%)`);
  }
  lines.push('');

  lines.push('## 🏭 Allocation sectorielle');
  lines.push('');
  for (const [sec, value] of Object.entries(data.sector_allocation)) {
    const pct = (value / data.total_value_eur * 100).toFixed(1);
    lines.push(`- **${sec}** : €${value.toFixed(2)} (${pct}%)`);
  }
  lines.push('');

  return lines.join('\n');
}
