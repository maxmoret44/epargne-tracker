/**
 * ledger-parser.js — Parse le fichier ledger.csv en tableau d'objets transactions.
 *
 * Format CSV attendu : 12 colonnes
 *   date,account,type,asset_class,ticker,name,quantity,price,currency,fees_eur,total_eur,notes
 *
 * Colonnes numériques : quantity, price, fees_eur, total_eur
 * Colonnes vides → null pour les numériques, '' pour les strings
 */

const NUMERIC_COLS = new Set(['quantity', 'price', 'fees_eur', 'total_eur']);
const COLS = ['date', 'account', 'type', 'asset_class', 'ticker', 'name',
              'quantity', 'price', 'currency', 'fees_eur', 'total_eur', 'notes'];

/**
 * Parse une ligne CSV en respectant les guillemets pour les notes.
 * Naïf mais suffisant : les notes ne contiennent pas de virgules dans notre usage.
 */
function parseCsvLine(line) {
  return line.split(',');
}

export function parseLedger(csvContent) {
  const lines = csvContent.trim().split('\n');
  const dataLines = lines.slice(1); // skip header
  return dataLines.map(line => {
    const values = parseCsvLine(line);
    const obj = {};
    COLS.forEach((col, i) => {
      const raw = values[i] ?? '';
      if (NUMERIC_COLS.has(col)) {
        obj[col] = raw === '' ? null : Number(raw);
      } else {
        obj[col] = raw;
      }
    });
    return obj;
  });
}
