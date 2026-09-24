# Satisfactory

Outils générés pour la maîtrise des systèmes de *Satisfactory* (logistique, énergie, optimisation de production).

## Convention pour ce dossier

- Charte graphique FICSIT : orange `#FA9549` sur bleu-gris foncé, hachures diagonales, coins biseautés/coupés, typographie Saira Condensed / Rajdhani, cadres d'icônes façon slots d'inventaire.
- Icônes d'objets réels du jeu, encodées en base64 dans le HTML (jamais de substituts dessinés à la main quand l'intégration est possible).
- Source de données : `greeny/SatisfactoryTools` (branche `dev`) — voir « Données de jeu » ci-dessous.

## Données de jeu

- Référentiel unique : `donnees/donnees-jeu.json` (items, bâtiments, recettes, paliers) et `donnees/icones/*.webp` (96 px, une seule copie par item). Régénéré par `python3 scripts/donnees.py` depuis `greeny/SatisfactoryTools` (branche `dev`). Ne jamais éditer à la main : corriger le script ou les fichiers curés.
- `donnees/paliers-mam.json` : paliers des recettes du MAM, absents de la source (elle donne un tier interne au MAM). Relevés à la main, appliqués en plancher par le script.
- Définition du palier, commune à tous les outils : premier palier où la recette est exécutable — machine débloquée, déblocage obtenu (jalon, chaîne de prérequis pour une alternative de disque dur, `paliers-mam.json`), et ingrédients produisibles par des recettes elles-mêmes exécutables. Point fixe.
- `python3 scripts/verif_payloads.py` compare ce que chaque page embarque au référentiel. Tous les compteurs à 0 = tout est aligné ; code de sortie 1 sinon.
- `python3 scripts/payloads.py` réécrit dans les pages ce qui est dérivable du référentiel : icônes (une seule source, ré-échantillonnée à 44 px pour l'infographie et le broyeur, 48 px pour le mémo, 96 px pour l'horloge) et paliers de l'infographie. `--verifier` montre ce qui changerait sans écrire.
- `node scripts/paliers_combinaisons.js satisfactory_infographie.html tout --ecrire` recalcule toutes les combinaisons précalculées de l'infographie et les écrit dans son payload (~7 min). Il lit les recettes et le modèle de coût dans la page elle-même : à relancer après tout changement de palier ou de recette (donc après `payloads.py`).
  - `tc` : pour chaque palier et chaque critère (énergie `mw`, matière `mat`), meilleure chaîne, chaîne tout en base et podium, par recherche exacte (séparation-évaluation).
  - `combi` (et `combiM` pour le critère matière) : le même calcul sans plafond de palier, plus, par énumération complète, le nombre de chaînes distinctes (une recette par item, cohérente sur tout l'arbre, sans boucle) et l'indice de la pire, tant qu'il y en a au plus un million. Le podium et la fréquence des alternatives se recalculent dans la page depuis `tc`.
  - Sans `--ecrire`, le JSON part sur la sortie standard ; `tc` (défaut) ou `registre` limitent le calcul à une des deux parties.
- Le payload du broyeur (`src`, `tgt`) est entièrement calculé par `scripts/broyeur.py` (appelé par `payloads.py`) : chaîne la moins gourmande en MW pour chaque item, byproducts non crédités, puis puissance, minerai neuf, machines, consommations `u` et palier `t` lus le long de cette chaîne (`t` = palier le plus haut de ses recettes). `python3 scripts/broyeur.py` seul montre les écarts avec la page sans rien écrire.
- Alternatives de disque dur : le jeu ne les propose au tirage qu'une fois leurs dépendances acquises (`requiredSchematics` de la source) — jalons, autres alternatives ou recherches du MAM. Une recherche du MAM compte pour le plus petit palier (`paliers-mam.json`) des recettes qu'elle débloque, jamais avant le MAM (palier 1) ; une dépendance vers un schéma disparu de la source est rattachée au schéma qui débloque aujourd'hui la même recette. **Limite :** la source ne donne pas l'arbre du MAM (quel nœud précède quel autre) : une recherche sans recette relevée dans `paliers-mam.json` (nœud racine comme Quartz ou Caterium) vaut le palier du MAM, un plancher. Seules Iron Wire et Cast Screws n'ont aucune dépendance : elles sortent dès le palier 1.

## Vérifications automatiques (CI)

Trois workflows GitHub Actions, dans `.github/workflows/` :

- `verif.yml`, à chaque PR et sur `main` (~2 min) : relance `langue.py`, `patchnotes.py` et `payloads.py` et échoue s'ils modifient une page (une étape de régénération a été oubliée) ; lance `verif_payloads.py` ; ouvre chaque page dans Chromium, en français puis en anglais, et échoue sur une erreur JS ou du texte de l'autre langue (`node scripts/test_pages.js`, lançable en local).
- `combinaisons.yml`, seulement si l'infographie, `donnees/` ou `paliers_combinaisons.js` changent (~7 min) : recalcule les combinaisons et échoue si elles diffèrent du payload commité.
- `source.yml`, chaque lundi (ou à la demande) : régénère le référentiel depuis `greeny/SatisfactoryTools` et échoue si la source a changé, date de récupération mise à part. C'est le signal qu'une mise à jour du jeu est à intégrer. Ne bloque aucune PR.

Versions épinglées dans les workflows (Python 3.12, Pillow 12.3.0, Node 22, Playwright 1.56.1) : une autre version de Pillow pourrait ré-encoder les icônes différemment et faire échouer la première vérification sans vraie raison.

## Journal des révisions

- Source unique : `changelog.json` (entrées de la plus récente à la plus ancienne, version SemVer propre à chaque outil, date ISO, texte court en français et en anglais).
- Après chaque évolution d'un outil : ajouter l'entrée, puis lancer `python3 scripts/patchnotes.py`. Le script réécrit le « Journal des révisions » de chaque page (entre les marqueurs `PATCHNOTES:START/END`) et régénère `CHANGELOG.md`.
- Le journal s'ouvre depuis un badge de version (« v1.8 ») placé en haut à droite, dans le dock commun à côté des drapeaux. Chaque navigateur retient la dernière version vue de chaque outil (`ficsit-tools:vu:<fichier>`) : une pastille signale une version pas encore vue, et les entrées nouvelles sont marquées « nouveau » à l'ouverture. Il est embarqué dans le HTML (lisible hors ligne) et suit la langue commune (voir ci-dessous).
- Dock commun : `commun/ficsit-lang.js` crée en haut à droite un conteneur `#fdock` et y déplace tout élément de la page marqué `data-fdock`, avant les drapeaux.

## Langue (FR / EN)

- Un seul sélecteur à drapeaux, en haut à droite de chaque page (index compris). Le choix est mémorisé sous la clé `ficsit-tools:lang` et vaut pour tous les outils à la fois, y compris entre onglets ouverts.
- Configuration commune dans `commun/` : `langue.json` (langues, langue par défaut, locale des nombres, textes partagés comme « Réinitialiser »), `glossaire.json` (noms du jeu EN → FR : bâtiments, items, recettes de base, d'après la localisation officielle), `ficsit-lang.js` et `ficsit-lang.css` (moteur et sélecteur).
- Après modification de `commun/` : `python3 scripts/langue.py`. Le bloc est injecté en tête de `<head>` de chaque page (marqueurs `FICSIT-LANG:START/END`) : les pages restent autonomes et hors ligne.
- Dans une page : texte statique en paires `<span data-l="fr">…</span><span data-l="en">…</span>` ; attributs via `data-fr-<attr>` / `data-en-<attr>` ; titre via `<title data-fr data-en>` ; texte généré en JS via `FicsitLang.on(...)`, `FicsitLang.item/recette/batiment(nom)` et `FicsitLang.num(v)`.
- Toute nouvelle page ou évolution doit fournir les deux langues, journal des révisions compris.

## Outils déjà produits (à réintégrer ici)

Ces outils existent mais ont été générés dans des sessions de chat précédentes — je n'y ai plus accès directement depuis ce bac à sable. Il faudra soit que tu me les repartages, soit que je les régénère, pour qu'ils atterrissent physiquement dans ce dossier :

- `satisfactory_infographie.html` — infographie interactive Énergie/Matière (Duels, Combinaisons, Catalogue), FR/EN.
- Optimiseur AWESOME Sink (~340 Ko) — solveur récursif de coût MW, workflow surplus d'inputs.
- `ficsit_horloge.html` — calculateur d'horloge de production (répartitions, paliers de shards, MW/delta).
- Script PowerShell de synchronisation de blueprints (solo ↔ solo, serveur dédié → solo).

## À venir

- Infographie croisant profondeur d'arbre de production, nombre de branches d'ingrédients et valeur AWESOME Sink par item.
