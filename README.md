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
- `python3 scripts/verif_payloads.py` compare ce que chaque page embarque au référentiel. Sortie vide = tout est aligné.
- **État actuel : les payloads des pages ne sont pas encore dérivés du référentiel** (étape 2). Items, points de broyage et puissances concordent déjà ; les paliers divergent — voir la sortie de `verif_payloads.py`.

## Journal des révisions

- Source unique : `changelog.json` (entrées de la plus récente à la plus ancienne, version SemVer propre à chaque outil, date ISO, texte court en français et en anglais).
- Après chaque évolution d'un outil : ajouter l'entrée, puis lancer `python3 scripts/patchnotes.py`. Le script réécrit l'encart « Journal des révisions » en bas de chaque page (entre les marqueurs `PATCHNOTES:START/END`) et régénère `CHANGELOG.md`.
- L'encart est embarqué dans le HTML : il reste lisible hors ligne, comme le reste de l'outil. Il suit la langue commune (voir ci-dessous).

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
