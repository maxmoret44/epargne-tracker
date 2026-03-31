#!/usr/bin/env node
/**
 * generate-snapshot.js — Épargne Tracker → Neural Network Vault
 *
 * Lit les données Google Sheets via Service Account et génère un snapshot
 * markdown dans le vault Obsidian pour le skill conseiller-bancaire.
 *
 * Prérequis : Node.js 18+ (fetch + crypto natifs)
 * Config    : ~/.config/epargne-tracker/config.json
 * Auth      : ~/.config/epargne-tracker/service-account.json
 * Output    : ~/neural-network-vault/Context/epargne-snapshot.md
 *
 * Usage : node ~/epargne-tracker/generate-snapshot.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createSign }                              from 'crypto';
import { homedir }                                 from 'os';
import { join }                                    from 'path';

// ─── Paths ────────────────────────────────────────────────────────────────────

const CONFIG_DIR     = join(homedir(), '.config', 'epargne-tracker');
const CONFIG_PATH    = join(CONFIG_DIR, 'config.json');
const SA_PATH        = join(CONFIG_DIR, 'service-account.json');
const VAULT_PATH     = join(homedir(), 'neural-network-vault', 'Context', 'epargne-snapshot.md');
const SHEETS_BASE    = 'https://sheets.googleapis.com/v4/spreadsheets';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SCOPE          = 'https://www.googleapis.com/auth/spreadsheets';

// ─── Config ───────────────────────────────────────────────────────────────────

function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    console.error(`❌ Config introuvable : ${CONFIG_PATH}`);
    console.error('   Créer le fichier avec : { "sheetId": "...", "targetTab": "Suivi" }');
    process.exit(1);
  }
}

function loadServiceAccount() {
  try {
    return JSON.parse(readFileSync(SA_PATH, 'utf8'));
  } catch {
    console.error(`❌ Service account introuvable : ${SA_PATH}`);
    console.error('   Placer le fichier JSON téléchargé depuis Google Cloud Console.');
    process.exit(1);
  }
}

// ─── JWT + OAuth ──────────────────────────────────────────────────────────────

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header  = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  }));

  const unsigned = `${header}.${payload}`;
  const sign     = createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(sa.private_key, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OAuth token error ${res.status}: ${body}`);
  }

  const json = await res.json();
  return json.access_token;
}

// ─── Google Sheets fetch ──────────────────────────────────────────────────────

async function sheetsRead(sheetId, range, token) {
  const url = `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}`
    + `?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.values || [];
}

async function sheetsWrite(sheetId, range, values, token) {
  const url = `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}`
    + `?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  });
  if (!res.ok) { const body = await res.text(); throw new Error(`Sheets write ${res.status}: ${body}`); }
}

async function sheetExists(sheetId, title, token) {
  const url = `${SHEETS_BASE}/${sheetId}?fields=sheets(properties(title))`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const json = await res.json();
  return (json.sheets || []).some(s => s.properties.title === title);
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function parseRows(rows) {
  return rows
    .filter(r => r[0] && r[6])
    .map(r => ({
      date:      r[0],
      boursovie: Number(r[1]) || 0,
      cto:       Number(r[2]) || 0,
      pea:       Number(r[3]) || 0,
      livret:    Number(r[4]) || 0,
      cash:      Number(r[5]) || 0,
      total:     Number(r[6]) || 0,
      cristina:  Number(r[7]) || 0,
      invBourso: Number(r[8]) || 0,
      invCTO:    Number(r[9]) || 0,
      invPEA:    Number(r[10]) || 0,
      invLivret: Number(r[11]) || 0,
    }));
}

function fmt(n) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function fmtPV(n) {
  return `${n >= 0 ? '+' : ''}${fmt(n)}`;
}

// ─── Optional sheets ─────────────────────────────────────────────────────────

async function fetchPeaHoldings(sheetId, token) {
  try {
    const rows = await sheetsRead(sheetId, 'PEA_Holdings!A2:G', token);
    return rows
      .map(r => ({
        ticker: r[0] || '', name: r[1] || '', qty: Number(r[2]) || 0,
        buyPrice: Number(r[3]) || 0, buyDate: r[4] || '',
        sector: r[5] || '', geo: r[6] || '',
      }))
      .filter(h => h.name);
  } catch { return null; }
}

async function fetchAvHoldings(sheetId, token) {
  try {
    const rows = await sheetsRead(sheetId, 'AV_Holdings!A2:G', token);
    return rows
      .map(r => ({ isin: r[0]||'', name: r[1]||'', qty: Number(r[2])||0,
                   buyPrice: Number(r[3])||0, buyDate: r[4]||'', sector: r[5]||'', geo: r[6]||'' }))
      .filter(h => h.isin && h.name);
  } catch { return null; }
}

async function fetchAvCours(sheetId, token) {
  try {
    const rows = await sheetsRead(sheetId, 'AV_Cours!A2:C', token);
    const map = new Map();
    for (const r of rows) { if (r[0] && r[1] != null) map.set(r[0], Number(r[1])||0); }
    return map.size ? map : null;
  } catch { return null; }
}

async function fetchLivePricesForAv(holdings) {
  return Promise.all(holdings.map(async h => {
    try {
      const sr = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(h.isin)}&quotesCount=1&newsCount=0`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) }
      );
      if (!sr.ok) return null;
      const sym = (await sr.json()).quotes?.[0]?.symbol;
      if (!sym) return null;
      const pr = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) }
      );
      if (!pr.ok) return null;
      return (await pr.json()).chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
    } catch { return null; }
  }));
}

async function writeAvCours(sheetId, holdings, prices, token, now) {
  const values = holdings.map((h, i) => [h.isin, prices[i] ?? '', prices[i] != null ? now : '']);
  await sheetsWrite(sheetId, `AV_Cours!A2:C${1 + values.length}`, values, token);
}

async function fetchFundCompo(sheetId, tab, token) {
  try {
    const rows = await sheetsRead(sheetId, `${tab}!A2:D`, token);
    const result = {};
    for (const [isin, dim, cat, w] of rows) {
      if (!isin || !dim || !cat) continue;
      if (!result[isin]) result[isin] = { geo: {}, sector: {} };
      const weight = Number(w) || 0;
      if (dim === 'geo')    result[isin].geo[cat]    = weight;
      if (dim === 'sector') result[isin].sector[cat] = weight;
    }
    return Object.keys(result).length ? result : null;
  } catch { return null; }
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

function aggregateCompo(compo) {
  const sector = {}, geo = {};
  for (const isin of Object.keys(compo)) {
    for (const [cat, w] of Object.entries(compo[isin].sector || {}))
      sector[cat] = (sector[cat] || 0) + w;
    for (const [cat, w] of Object.entries(compo[isin].geo || {}))
      geo[cat] = (geo[cat] || 0) + w;
  }
  return { sector, geo };
}

function renderCompoSection(compo, label) {
  const { sector, geo } = aggregateCompo(compo);
  let md = `\n## ${label}\n`;
  if (Object.keys(sector).length) {
    md += `\n### Secteurs\n\n`;
    for (const [cat, w] of Object.entries(sector).sort((a, b) => b[1] - a[1]))
      md += `- ${cat} : ${w.toFixed(1)}%\n`;
  }
  if (Object.keys(geo).length) {
    md += `\n### Géographie\n\n`;
    for (const [cat, w] of Object.entries(geo).sort((a, b) => b[1] - a[1]))
      md += `- ${cat} : ${w.toFixed(1)}%\n`;
  }
  return md;
}

// ─── Markdown builder ─────────────────────────────────────────────────────────

function buildSnapshot({ rows, peaHoldings, fundCompo, fundCompoPEA, avHoldings, avCours, now }) {
  const last   = rows[rows.length - 1];
  const oldest = rows[0];
  const last13 = rows.slice(-13);

  const accounts = [
    { name: 'BoursoVie', val: last.boursovie, inv: last.invBourso },
    { name: 'Bitcoin',   val: last.cto,       inv: last.invCTO    },
    { name: 'TR PEA',    val: last.pea,       inv: last.invPEA    },
    { name: 'CE Livret', val: last.livret,    inv: last.invLivret },
    { name: 'TR Cash',   val: last.cash,      inv: 0              },
  ];
  const totalVal = last.total;
  const totalInv = accounts.reduce((s, a) => s + a.inv, 0);
  const totalPV  = totalVal - totalInv;
  const totalPct = totalInv > 0 ? (totalPV / totalInv) * 100 : 0;

  let md = `---
generated: ${now}
source: Google Sheets epargne-tracker (service account)
tags: [epargne-snapshot]
---

> Utilisé par : [[Custom-Skills/Finance/Skills-Active/conseiller-bancaire|Conseiller Bancaire]] · [[Custom-Skills/Finance/Docs-Done/Finance MOC|Finance MOC]]

# Snapshot Épargne — ${last.date}

> Généré par \`node ~/epargne-tracker/generate-snapshot.js\`

## Valeurs actuelles

| Compte | Valeur | Investi | Plus-value | Perf | Poids |
|--------|-------:|--------:|-----------:|-----:|------:|
`;

  for (const a of accounts) {
    const poids = `${((a.val / totalVal) * 100).toFixed(1)}%`;
    if (a.inv > 0) {
      const pv  = a.val - a.inv;
      const pct = (pv / a.inv) * 100;
      md += `| ${a.name} | ${fmt(a.val)} | ${fmt(a.inv)} | ${fmtPV(pv)} | ${fmtPct(pct)} | ${poids} |\n`;
    } else {
      md += `| ${a.name} | ${fmt(a.val)} | — | — | — | ${poids} |\n`;
    }
  }
  md += `| **TOTAL** | **${fmt(totalVal)}** | **${fmt(totalInv)}** | **${fmtPV(totalPV)}** | **${fmtPct(totalPct)}** | 100% |\n`;

  // Historique mensuel
  md += `\n## Historique mensuel (${last13.length - 1} dernières entrées)\n\n`;
  md += `| Date | Total | Variation |\n|------|------:|----------:|\n`;
  for (let i = 1; i < last13.length; i++) {
    const delta = last13[i].total - last13[i - 1].total;
    md += `| ${last13[i].date} | ${fmt(last13[i].total)} | ${delta >= 0 ? '+' : ''}${fmt(delta)} |\n`;
  }

  const growthPct = oldest.total > 0 ? ((last.total - oldest.total) / oldest.total) * 100 : 0;
  md += `\n> **Depuis le début** (${oldest.date}) : ${fmt(oldest.total)} → ${fmt(last.total)} (${fmtPct(growthPct)})\n`;

  // PEA Holdings
  if (peaHoldings?.length) {
    md += `\n## PEA — Portefeuille détaillé\n\n`;
    md += `| Titre | Ticker | Qté | Prix achat | Secteur | Géo |\n`;
    md += `|-------|--------|----:|-----------:|---------|-----|\n`;
    for (const h of peaHoldings)
      md += `| ${h.name} | ${h.ticker} | ${h.qty} | ${fmt(h.buyPrice)} | ${h.sector || '—'} | ${h.geo || '—'} |\n`;
  }

  // BoursoVie (AV) Holdings
  const AV_CASH_VALUE = 300;
  if (avHoldings?.length) {
    let totalVal = AV_CASH_VALUE, totalCost = 0;
    for (const h of avHoldings) {
      const cur = avCours.get(h.isin) ?? h.buyPrice;
      totalVal  += cur * h.qty;
      totalCost += h.buyPrice * h.qty;
    }
    md += `\n## BoursoVie (AV) — Portefeuille détaillé\n\n`;
    md += `| Titre | ISIN | Qté | Px revient | Cours actuel | Valeur | PV € | PV % | Poids |\n`;
    md += `|-------|------|----:|-----------:|-------------:|-------:|-----:|-----:|------:|\n`;
    for (const h of avHoldings) {
      const cur   = avCours.get(h.isin) ?? h.buyPrice;
      const val   = cur * h.qty;
      const cost  = h.buyPrice * h.qty;
      const pv    = val - cost;
      const pvPct = cost > 0 ? (pv / cost) * 100 : 0;
      const poids = `${((val / totalVal) * 100).toFixed(1)}%`;
      md += `| ${h.name} | ${h.isin} | ${h.qty} | ${fmt(h.buyPrice)} | ${fmt(cur)} | ${fmt(val)} | ${fmtPV(pv)} | ${fmtPct(pvPct)} | ${poids} |\n`;
    }
    const cashPoids = `${((AV_CASH_VALUE / totalVal) * 100).toFixed(1)}%`;
    md += `| Cash non alloué | — | — | — | — | ${fmt(AV_CASH_VALUE)} | — | — | ${cashPoids} |\n`;
    const totalPV  = totalVal - totalCost - AV_CASH_VALUE;
    const totalPct = totalCost > 0 ? (totalPV / totalCost) * 100 : 0;
    md += `| **TOTAL BoursoVie** | | | | | **${fmt(totalVal)}** | **${fmtPV(totalPV)}** | **${fmtPct(totalPct)}** | 100% |\n`;
  }

  if (fundCompo)    md += renderCompoSection(fundCompo,    'BoursoVie — Répartition fonds');
  if (fundCompoPEA) md += renderCompoSection(fundCompoPEA, 'PEA — Répartition fonds');

  md += `\n---\n_Snapshot généré le ${now}_\n`;
  return md;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📊 Génération du snapshot épargne...');

  const cfg = loadConfig();
  const sa  = loadServiceAccount();
  const { sheetId, targetTab = 'Suivi' } = cfg;

  if (!sheetId) {
    console.error('❌ sheetId requis dans config.json');
    process.exit(1);
  }

  // Auth
  console.log(`   Authentification service account (${sa.client_email})...`);
  const token = await getAccessToken(sa);
  console.log('   ✓ Token obtenu');

  // Données principales
  console.log(`   Lecture onglet "${targetTab}"...`);
  let rawRows;
  try {
    rawRows = await sheetsRead(sheetId, `'${targetTab}'!A2:M`, token);
  } catch (e) {
    console.error(`❌ Erreur Sheets : ${e.message}`);
    process.exit(1);
  }

  const rows = parseRows(rawRows);
  if (!rows.length) { console.error('❌ Aucune donnée trouvée.'); process.exit(1); }
  console.log(`   ✓ ${rows.length} entrées (${rows[0].date} → ${rows[rows.length - 1].date})`);

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Onglets optionnels
  let peaHoldings = null, fundCompo = null, fundCompoPEA = null;

  if (await sheetExists(sheetId, 'PEA_Holdings', token)) {
    peaHoldings = await fetchPeaHoldings(sheetId, token);
    if (peaHoldings) console.log(`   ✓ ${peaHoldings.length} titres PEA`);
  }
  if (await sheetExists(sheetId, 'FundCompo', token)) {
    fundCompo = await fetchFundCompo(sheetId, 'FundCompo', token);
    if (fundCompo) console.log(`   ✓ ${Object.keys(fundCompo).length} fonds BoursoVie`);
  }
  if (await sheetExists(sheetId, 'FundCompoPEA', token)) {
    fundCompoPEA = await fetchFundCompo(sheetId, 'FundCompoPEA', token);
    if (fundCompoPEA) console.log(`   ✓ ${Object.keys(fundCompoPEA).length} fonds PEA`);
  }

  // AV Holdings
  let avHoldings = null, avCours = new Map();
  if (await sheetExists(sheetId, 'AV_Holdings', token)) {
    avHoldings = await fetchAvHoldings(sheetId, token);
    if (avHoldings) console.log(`   ✓ ${avHoldings.length} titres AV`);
  }
  if (avHoldings?.length) {
    if (await sheetExists(sheetId, 'AV_Cours', token)) {
      const cached = await fetchAvCours(sheetId, token);
      if (cached) avCours = cached;
    }
    console.log('   Fetch cours Yahoo Finance (AV)…');
    const livePrices = await fetchLivePricesForAv(avHoldings);
    const anyLive = livePrices.some(p => p != null);
    if (anyLive) {
      for (let i = 0; i < avHoldings.length; i++)
        if (livePrices[i] != null) avCours.set(avHoldings[i].isin, livePrices[i]);
      await writeAvCours(sheetId, avHoldings, livePrices, token, now);
      console.log(`   ✓ ${livePrices.filter(p => p != null).length}/${avHoldings.length} cours live`);
    } else {
      console.log('   ⚠ Pas de cours live, utilisation du cache');
    }
  }

  // Écriture
  const snapshot = buildSnapshot({ rows, peaHoldings, fundCompo, fundCompoPEA, avHoldings, avCours, now });
  mkdirSync(join(homedir(), 'neural-network-vault', 'Context'), { recursive: true });
  writeFileSync(VAULT_PATH, snapshot, 'utf8');

  console.log(`\n✅ Snapshot écrit : ${VAULT_PATH}`);
  console.log(`   Total : ${fmt(rows[rows.length - 1].total)} | ${rows.length} entrées | dernière : ${rows[rows.length - 1].date}`);
}

main().catch(e => { console.error(`❌ ${e.message}`); process.exit(1); });
