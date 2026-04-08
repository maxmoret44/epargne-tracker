/**
 * fund-decomposer.js — Croise les positions de fonds avec FUND_SECTOR_SEED
 * pour produire l'allocation géographique et sectorielle agrégée du portefeuille.
 *
 * Pour les actions individuelles (asset_class = stock), pas de décomposition :
 * la position est attribuée au secteur/pays de l'entreprise (fourni en input).
 */

export function decomposeFundsToGeoSectors(positions, fundSeed) {
  const geo = {};
  const sector = {};

  for (const pos of positions) {
    if (pos.asset_class !== 'fund' && pos.asset_class !== 'etf') continue;
    const seed = fundSeed[pos.ticker];
    if (!seed) {
      // Fonds non décomposé → bucket "Inconnu"
      geo['Inconnu'] = (geo['Inconnu'] ?? 0) + pos.current_value_eur;
      sector['Inconnu'] = (sector['Inconnu'] ?? 0) + pos.current_value_eur;
      continue;
    }
    for (const [geoKey, weight] of Object.entries(seed.geo ?? {})) {
      geo[geoKey] = (geo[geoKey] ?? 0) + pos.current_value_eur * weight;
    }
    for (const [secKey, weight] of Object.entries(seed.sector ?? {})) {
      sector[secKey] = (sector[secKey] ?? 0) + pos.current_value_eur * weight;
    }
  }

  // Arrondir
  for (const k of Object.keys(geo)) geo[k] = Number(geo[k].toFixed(2));
  for (const k of Object.keys(sector)) sector[k] = Number(sector[k].toFixed(2));

  return { geo, sector };
}
