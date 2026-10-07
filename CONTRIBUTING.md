# Contribuer

Ce dépôt est généré par IA à la demande d'un joueur ; les contributions humaines suivent les mêmes règles que les sessions d'IA.

## Mise en route

```bash
pip install -r requirements.txt
npm ci && npx playwright install chromium
bash scripts/tout.sh          # ~30 s sans navigateur (--sans-tests), ~2 min avec
```

## Règles

1. **Après toute modification : `bash scripts/tout.sh`**, puis committer ce qu'il régénère (pages, payloads, `CHANGELOG.md`). La CI (`--ci`) échoue si une page n'est pas à jour.
2. **Ne jamais éditer à la main** `donnees/donnees-jeu.json`, les payloads embarqués dans les pages ni les blocs entre marqueurs (`MOTEUR:START/END`…) hors de leur source : corriger le script (`scripts/donnees.py`, `payloads.py`…).
3. **Deux langues** : tout texte ajouté existe en français et en anglais (`<span data-l="fr">…</span><span data-l="en">…</span>` dans une page, `commun/langue.json` pour le bloc commun, `commun/glossaire.json` pour les noms du jeu).
4. **Journal des révisions** : chaque évolution visible d'un outil ajoute une entrée FR/EN dans `changelog.json`, puis `python3 scripts/patchnotes.py` (lancé par `tout.sh`).
5. **Charte** : couleurs et polices viennent de `commun/ficsit-hud.css` (variables `--f-*`) ; une page ne définit ni couleur ni police propres. La vitrine `charte.html` montre les composants.
6. **Captures de référence** : un changement visuel voulu se valide par `node scripts/captures.js --maj`, en relisant les images avant de committer. Les captures dépendent de la machine : en cas d'écart généralisé, régénérer depuis l'artefact `captures-ecarts` de la CI.
7. **Combinaisons de l'infographie** : après un changement de recette, de palier ou du moteur, `bash scripts/tout.sh --combinaisons` (~10 min).

## Tests

- `node scripts/test_planner.js` — moteur du planificateur ;
- `node scripts/test_flux.js` — calcul de débit du Depot sur des usines synthétiques ;
- `node scripts/test_partie.js` — lecture de sauvegarde ;
- `node scripts/test_pages.js` — chaque page dans Chromium (FR puis EN, mobile, fonctionnel) ;
- `node scripts/captures.js` — captures de référence.

Plus de détails : [README.md](README.md) et [docs/](docs/).
