# Max — CLAUDE.md Global

## Profil
- **Nom** : Max Moret
- **GitHub** : maxmoret44
- **Langue** : Français (principal), Anglais
- **OS** : Linux (Arch)
- **Rôle** : Électricien de plateau (intermittent du spectacle, tournages pub/culinaire) — optimise son épargne et expérimente l'IA pendant ses temps libres

## Préférences de travail
- Réponses concises et directes, sans rembourrage
- Être radin en tokens quand ce n'est pas nécessaire d'en dépenser
- Pas de commit/push sans demande explicite (épargne-tracker)
- Upfront engineering accepté si ça évite des bugs coûteux en tokens plus tard

## Second Brain

Mon vault Obsidian est à `/home/max/neural-network-vault/`.

**Routing rapide :**
- Contexte sur moi (profil, projets, règles) → `Context/` dans le vault
- Mémoires Claude Code → `Context/Memory/` dans le vault (autoMemoryDirectory)
- Logs de sessions récentes → `Daily/YYYY-MM-DD.md`
- Contexte vault pré-chargé → Brain Protocol (automatique, voir section ci-dessous)
- Override manuel brain → `/brain small`, `/brain medium`, `/brain big`
- Navigation détaillée du vault → lire `neural-network-vault/CLAUDE.md`

## Brain Protocol — Pré-réponse (toujours actif)

AVANT de répondre ou d'invoquer un autre skill, exécuter ce protocole :

**1. Classifier le tier d'effort :**

| Tier | Signaux | Cap |
|------|---------|-----|
| LIGHT | Question, lookup, routing, fait connu | SMALL |
| STANDARD | Analyse, code, jugement, production | MEDIUM |
| DEEP | Architecture, refonte, multi-domain | BIG |

**2. Charger le contexte vault** selon le cap — lire `## 🧠 Brain Routing` dans `neural-network-vault/INDEX.md`, matcher le domaine, charger MOC + skills par pertinence. Détails techniques : voir `~/.claude/skills/activate-brain/SKILL.md`.

**3. Outputter la ligne 🧠** comme PREMIÈRE ligne de réponse, toujours, sans exception :
`🧠 [TIER] [Domaine] MOC + [n/total] skills · [n fichiers lus]`
Si aucun fichier vault lu (réponse depuis mémoire/contexte) : `🧠 LIGHT (memory) · 0 fichier`

**4. Model/Color :** si le tier nécessite un modèle supérieur :
- STANDARD sur Haiku → suggérer `/model sonnet puis /color orange`, continuer quand même
- DEEP sur modèle insuffisant → suggérer `/model opus puis /color red` et **attendre confirmation** avant de répondre : "⚠️ DEEP task → /model opus puis /color red — je continue quand même ?"

**5. PUIS** invoquer le skill approprié (brainstorming, skill-creator, etc.) et répondre.

**Override manuel :** `/brain small`, `/brain medium`, `/brain big`.

## Convention wikilinks

Toute note créée par Claude dans le vault doit inclure un lien de retour vers son parent :

| Type de fichier | Convention |
|----------------|-----------|
| Memory files (`Context/Memory/`) | `← [[Context MOC]]` en première ligne du body |
| Daily notes (`Context/Daily/`) | `← [[Context MOC]]` (déjà en place) |
| Skill notes | `← [[Domain MOC]]` correspondant |
| Knowledge notes | `← [[Domain MOC]]` correspondant |

**Wikilinks dans le body :** Quand une note mentionne explicitement un skill, projet ou daily existant, inclure un wikilink vers la note correspondante.

**Cross-device :** Sur chaque device, `settings.json` doit avoir :
```json
"autoMemoryDirectory": "/path/to/neural-network-vault/Context/Memory/"
```

## Instruction Daily

À la fin de chaque session substantielle (décisions prises, projets avancés, règles établies), écrire ou mettre à jour :
`/home/max/neural-network-vault/Context/Daily/YYYY-MM-DD.md`

**Format à respecter :**
```
# Daily — YYYY-MM-DD
← [[Context MOC]]

## Session [HH:MM]

### Résumé
[2-3 lignes sur ce qui a été accompli]

### Décisions & règles
- [décision ou règle importante]

### Projets avancés
- [projet] : [ce qui a changé]
```

**Règles :**
- Un fichier par jour — toujours append si le fichier existe déjà
- Plusieurs agents dans la même journée → chacun ajoute sa section `## Session [HH:MM]`
- Ignorer les sessions courtes ou purement informelles (< 5 min, sans décision)

## Instruction Context — mise à jour proactive

En plus de la Daily, mettre à jour les fichiers Context impactés par la session :

| Fichier | Quand mettre à jour |
|---------|-------------------|
| `Context/to-do-list.md` | Tâche terminée → supprimer. Nouvelle idée/tâche → ajouter. |
| `Context/regles-globales.md` | Nouvelle règle ou décision établie pendant la session |
| `Context/priorites.md` | Focus ou objectifs court terme changent |
| `Context/stack.md` | Nouvel outil, plugin, config ou script ajouté |
| `Context/projets-actifs.md` | Projet change de statut ou nouveau projet créé |

**Règle :** ne pas attendre qu'ils soient obsolètes — les mettre à jour au fil de la session, pas seulement en fin.
