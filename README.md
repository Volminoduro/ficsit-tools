# Satisfactory — outils

Outils générés pour la maîtrise des systèmes de *Satisfactory* (logistique, énergie, optimisation de production). Pages statiques, publiées sur GitHub Pages depuis `main`.

*English: browser tools for the game Satisfactory (production planner, recipe efficiency registry, recycling optimizer, Dimensional Depot throughput from a save file…). Static pages, French and English interface (language switch top right). Contributing: see [CONTRIBUTING.md](CONTRIBUTING.md); details in [docs/](docs/).*

Tout le dépôt — code, calculs, textes — est généré par IA (Claude, d'Anthropic), à la demande d'un joueur qui l'oriente et le relit. Le site le dit par un bandeau commun en bas de chaque page (`commun/ficsit-lang.js`, texte `communs.ia` de `commun/langue.json`).

## Les outils

À ouvrir depuis le site ou le dépôt (http), pas enregistrés seuls : chaque page charge le bloc commun `commun/`. `outils.html` les réunit en une seule page à onglets ; `index.html` les présente.

| Outil | Page | Rôle |
|---|---|---|
| Registre des rendements | `satisfactory_infographie.html` | chaque recette notée par MW, matière et m² au sol ; duels, meilleures combinaisons, filtre par palier |
| Planificateur de production | `planner.html` | objectifs en items/min → chaîne complète, machines, MW, graphe, plans partageables par l'adresse |
| Mémo de terrain | `memo-ficsit.html` | extraction selon la pureté, cadence des convoyeurs, jalons, ascenseur spatial |
| Module d'étalonnage | `ficsit_horloge.html` | coût de chaque palier d'horloge en éclats et en MW |
| Débit vers le Dimensional Depot | `depot-dimensionnel.html` | débit par Uploader depuis une sauvegarde `.sav` |
| Rentabilité énergétique par nœud | `energie-noeuds.html` | MW nets par filière, pureté et cadence |
| Optimiseur de recyclage | `broyeur-excedents.html` | cibles de broyage AWESOME classées par gain |
| Complexité et valeur au broyeur | `arbre-production.html` | profondeur de l'arbre de production face à la valeur AWESOME |
| Vitrine de la charte | `charte.html` | composants graphiques communs |

Description détaillée de chaque outil : [docs/outils.md](docs/outils.md).

## Démarrer

```bash
pip install -r requirements.txt          # Pillow (icônes)
npm ci && npx playwright install chromium # tests dans un navigateur
bash scripts/tout.sh                      # régénère les pages, vérifie, teste
```

**Après toute modification, lancer `bash scripts/tout.sh`** : la CI échoue si une page n'est pas à jour. Options : `--sans-tests` (sans navigateur), `--combinaisons` (recalcule d'abord les combinaisons de l'infographie, ~10 min), `--ci`. Pour un patch du jeu : `bash scripts/maj_jeu.sh`. Les conventions de contribution sont dans [CONTRIBUTING.md](CONTRIBUTING.md).

## Arborescence

- `*.html`, `planner-moteur.js`, `depot-dimensionnel-flux.js`, `satisfactory_infographie-partie.js` : les pages et leurs moteurs.
- `commun/` : bloc commun (charte, langue, paliers, « Ma partie », infobulles), icônes partagées, polices, bibliothèques embarquées.
- `donnees/` : référentiel du jeu (`donnees-jeu.json`, jamais édité à la main), icônes, nœuds de ressources, arbre du MAM.
- `scripts/` : génération (`payloads.py`, `langue.py`, `patchnotes.py`…), vérifications et tests.
- `outils-locaux/` : utilitaires hors site.
- `changelog.json` : journal des révisions (source unique) ; `CHANGELOG.md` en est généré.
- `TODO.md` : chantiers à venir.

## Documentation détaillée

- [docs/outils.md](docs/outils.md) — chaque outil, ses moteurs et ses données
- [docs/charte-et-icones.md](docs/charte-et-icones.md) — charte graphique du HUD, icônes, polices
- [docs/donnees.md](docs/donnees.md) — référentiel de jeu, génération des payloads, combinaisons de l'infographie
- [docs/hors-ligne.md](docs/hors-ligne.md) — coquille à onglets, service worker
- [docs/journal-et-langue.md](docs/journal-et-langue.md) — journal des révisions, FR/EN, « Ma partie »
- [docs/ci.md](docs/ci.md) — workflows GitHub Actions
