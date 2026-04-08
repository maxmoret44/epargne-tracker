/**
 * price-fetcher.js — Récupère les prix marché courants via Yahoo Finance API publique.
 *
 * Couvre :
 *  - Stocks/ETFs cotés (TR-PEA) via mapping ISIN → ticker Yahoo
 *  - Crypto (BTC) via paire Yahoo BTC-EUR
 *
 * Ne couvre pas :
 *  - Fonds en assurance-vie (BoursoVie) : pricing interne assureur, fallback cost
 *  - Fonds non listés Yahoo : fallback cost (0 PV)
 */

// Mapping ISIN/ticker interne → symbole Yahoo Finance
// Étendre au fil des nouveaux tickers ingérés.
export const ISIN_TO_YAHOO = {
  // TR-PEA stocks
  'FR0000120271': 'TTE.PA',     // TotalEnergies
  'FR0000124141': 'VIE.PA',     // Veolia Environnement
  'FR001400AJ45': 'ML.PA',      // Michelin
  'FR0013451333': 'FDJU.PA',    // FDJ United (ex-FDJ.PA)
  'FR0006174348': 'BVI.PA',     // Bureau Veritas
  'FR0000131104': 'BNP.PA',     // BNP Paribas
  'FR0000120578': 'SAN.PA',     // Sanofi
  'FR0000120073': 'AI.PA',      // Air Liquide
  'NL0014559478': 'TE.PA',      // Technip Energies
  'PTGAL0AM0009': 'GALP.LS',    // Galp Energia
  'FR0000121972': 'SU.PA',      // Schneider Electric
  // TR-PEA ETFs
  'FR0013412020': 'PAEEM.PA',   // Amundi PEA Emergent UCITS ETF
  'FR0011550185': 'ESE.PA',     // BNP Paribas Easy S&P 500 UCITS ETF
  // TR-CTO crypto
  'XF000BTC0017': 'BTC-EUR',    // Bitcoin
  'XF000ETH0019': 'ETH-EUR',    // Ethereum
};

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

/**
 * Fetch un prix Yahoo Finance pour un symbole donné.
 * @returns {Promise<{price: number, currency: string} | null>}
 */
export async function fetchYahooPrice(symbol) {
  const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (epargne-tracker/1.0)',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      return { error: 'no price in response' };
    }
    return { price: meta.regularMarketPrice, currency: meta.currency || 'EUR' };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Fetch les prix pour une liste de tickers internes.
 * Retourne un mapping { tickerInterne: priceEUR } pour les tickers résolus,
 * et un tableau de skipped pour ceux qui n'ont pas de mapping ou ont échoué.
 *
 * @param {string[]} tickers - tickers internes (ISINs ou XF000*)
 * @returns {Promise<{ prices: Record<string, number>, skipped: Array<{ticker: string, reason: string}> }>}
 */
export async function fetchPrices(tickers) {
  const prices = {};
  const skipped = [];

  for (const ticker of tickers) {
    const yahooSymbol = ISIN_TO_YAHOO[ticker];
    if (!yahooSymbol) {
      skipped.push({ ticker, reason: 'no Yahoo mapping (fallback cost)' });
      continue;
    }
    const result = await fetchYahooPrice(yahooSymbol);
    if (result.error) {
      skipped.push({ ticker, reason: `${yahooSymbol}: ${result.error}` });
      continue;
    }
    if (result.currency !== 'EUR') {
      skipped.push({ ticker, reason: `${yahooSymbol}: currency ${result.currency} non géré` });
      continue;
    }
    prices[ticker] = Number(result.price.toFixed(4));
  }

  return { prices, skipped };
}
