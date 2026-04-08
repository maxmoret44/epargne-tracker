# Notes de migration generate-snapshot.js V1 → V2

## Différences attendues

- V1 : lit Google Sheets via Service Account, calculs PV approximatifs
- V2 : lit ledger.csv local, calculs FIFO exacts

## Ce qui a changé

- Plus de dépendance à Google Sheets dans le pipeline (cf. Task 27 — scénario B)
- Format markdown du snapshot enrichi (cash par compte, allocation détaillée)
- PV calculées exactement par FIFO

## Ce qui reste à faire (chantier 5)

- Peupler ledger.csv avec les vraies transactions
- Implémenter la récupération des prix marché courants (selon scénario Task 27)
- Implémenter la récupération de FUND_SECTOR_SEED depuis index.html (extraction one-shot)

## Rollback

L'ancien generate-snapshot.js est sauvegardé dans `generate-snapshot.js.bak-pre-graham`.
Pour revenir en arrière :
  cp generate-snapshot.js.bak-pre-graham generate-snapshot.js
