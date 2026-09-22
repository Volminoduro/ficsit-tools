# Satisfactory

Outils générés pour la maîtrise des systèmes de *Satisfactory* (logistique, énergie, optimisation de production).

## Convention pour ce dossier

- Charte graphique FICSIT : orange `#FA9549` sur bleu-gris foncé, hachures diagonales, coins biseautés/coupés, typographie Saira Condensed / Rajdhani, cadres d'icônes façon slots d'inventaire.
- Icônes d'objets réels du jeu, encodées en base64 dans le HTML (jamais de substituts dessinés à la main quand l'intégration est possible).
- Source de données : `greeny/SatisfactoryTools` (branche `dev`), `data/data.json` pour les items/recettes/bâtiments, `www/assets/images/items/{slug}_256.png` pour les icônes.

## Journal des révisions

- Source unique : `changelog.json` (entrées de la plus récente à la plus ancienne, version SemVer propre à chaque outil, date ISO, texte court en français et en anglais).
- Après chaque évolution d'un outil : ajouter l'entrée, puis lancer `python3 scripts/patchnotes.py`. Le script réécrit l'encart « Journal des révisions » en bas de chaque page (entre les marqueurs `PATCHNOTES:START/END`) et régénère `CHANGELOG.md`.
- L'encart est embarqué dans le HTML : il reste lisible hors ligne, comme le reste de l'outil. Il suit la bascule FR/EN de chaque page ; le mémo, sans bascule, reste en français.

## Outils déjà produits (à réintégrer ici)

Ces outils existent mais ont été générés dans des sessions de chat précédentes — je n'y ai plus accès directement depuis ce bac à sable. Il faudra soit que tu me les repartages, soit que je les régénère, pour qu'ils atterrissent physiquement dans ce dossier :

- `satisfactory_infographie.html` — infographie interactive Énergie/Matière (Duels, Combinaisons, Catalogue), FR/EN.
- Optimiseur AWESOME Sink (~340 Ko) — solveur récursif de coût MW, workflow surplus d'inputs.
- `ficsit_horloge.html` — calculateur d'horloge de production (répartitions, paliers de shards, MW/delta).
- Script PowerShell de synchronisation de blueprints (solo ↔ solo, serveur dédié → solo).

## À venir

- Infographie croisant profondeur d'arbre de production, nombre de branches d'ingrédients et valeur AWESOME Sink par item.
