# Satisfactory

Outils générés pour la maîtrise des systèmes de *Satisfactory* (logistique, énergie, optimisation de production).

Tout le dépôt — code, calculs, textes — est généré par IA (Claude, d'Anthropic), à la demande d'un joueur qui l'oriente et le relit. Le site le dit : un encart sur l'accueil et un bandeau commun en bas de chaque page (`commun/ficsit-lang.js`, texte `communs.ia` de `commun/langue.json`).

## Convention pour ce dossier

- Charte graphique FICSIT : orange `#FA9549` sur bleu-gris foncé, hachures diagonales, coins biseautés/coupés, typographie Saira Condensed / Rajdhani, cadres d'icônes façon slots d'inventaire.
- Icônes d'objets réels du jeu, encodées en base64 dans le HTML (jamais de substituts dessinés à la main quand l'intégration est possible).
- Source de données : `greeny/SatisfactoryTools` (branche `dev`) — voir « Données de jeu » ci-dessous.

## Outils

Pages autonomes, publiées sur GitHub Pages depuis `main` ; `index.html` les présente en deux catégories, Production (mémo, registre, étalonnage) et Recyclage (optimiseur, complexité et valeur au broyeur).

- `satisfactory_infographie.html` — **Registre des rendements** : chaque recette, standard ou alternative, notée en sortie par MW, par unité de matière première et par m² au sol (machines et extraction surcadencées à 250 %), plus une synthèse des trois pondérée par curseurs ; duels entre recettes, meilleures combinaisons par produit, catalogue, filtre par palier atteint.
- `broyeur-excedents.html` — **Optimiseur de recyclage (broyeur AWESOME)** : à partir de vos excédents, classe les cibles de broyage par points gagnés pour chaque MW ajouté.
- `ficsit_horloge.html` — **Module d'étalonnage** : coût de chaque palier d'horloge (overclock) en éclats et en MW, et répartition optimale selon vos éclats.
- `arbre-production.html` — **Complexité et valeur au broyeur** : pour chaque item broyable, minerais bruts compris, profondeur de l'arbre de production et nombre d'items intermédiaires face à sa valeur AWESOME, en recettes de base ou en chaîne optimisée (MW), filtrable par palier.
- `memo-ficsit.html` — **Mémo de terrain** : extraction selon la pureté des nœuds, cadence des convoyeurs, jalons et pièces de l'ascenseur spatial.
- `scripts/lier-blueprints.ps1` — utilitaire Windows, hors site : regroupe les blueprints de toutes les parties dans une bibliothèque commune (`D:\Satisfactory\BP`) en remplaçant chaque dossier de blueprints par une jonction vers elle.

## Données de jeu

- Référentiel unique : `donnees/donnees-jeu.json` (items, bâtiments, recettes, paliers) et `donnees/icones/*.webp` (96 px, une seule copie par item). Régénéré par `python3 scripts/donnees.py` depuis `greeny/SatisfactoryTools` (branche `dev`). Ne jamais éditer à la main : corriger le script ou les fichiers curés.
- `donnees/emprises.json` : emprise au sol (largeur × longueur) des bâtiments de production et d'extraction, absente de la source, reprise de l'infobox de chaque bâtiment sur le wiki officiel, plus le facteur de surcadençage (2,5). Azote : emprise et débit de l'ensemble des puits du monde (6 pressuriseurs, 45 extracteurs, page Resource Well du wiki). Sert au mode « Espace » de l'infographie : `payloads.py` en tire `em` (m² par machine), `ex` (m² par unité/min extraite, à 250 %) et `oc`.
- `donnees/arbre-mam.json` : arbre de recherche du MAM (parents de chaque nœud), absent de la source, relevé à la main sur les images de la page MAM du wiki officiel. Palier d'un nœud = max(palier du MAM = 1, paliers de ses parents, palier où ses coûts — donnés par la source — sont obtenables), calculé dans le point fixe de `donnees.py` et exporté dans le référentiel (`recherchesMam`).
- Définition du palier, commune à tous les outils : premier palier où la recette est exécutable — machine débloquée, déblocage obtenu (jalon, chaîne de prérequis pour une alternative de disque dur, recherche du MAM), et ingrédients produisibles par des recettes elles-mêmes exécutables. Point fixe.
- `python3 scripts/verif_payloads.py` compare ce que chaque page embarque au référentiel. Tous les compteurs à 0 = tout est aligné ; code de sortie 1 sinon.
- `python3 scripts/payloads.py` réécrit dans les pages ce qui est dérivable du référentiel : icônes (une seule source, ré-échantillonnée à 44 px pour l'infographie et le broyeur, 48 px pour le mémo, 96 px pour l'horloge) et paliers de l'infographie. `--verifier` montre ce qui changerait sans écrire.
- `node scripts/paliers_combinaisons.js satisfactory_infographie.html tout --ecrire` recalcule toutes les combinaisons précalculées de l'infographie et les écrit dans son payload (~10 min). Il lit les recettes et le modèle de coût dans la page elle-même : à relancer après tout changement de palier ou de recette (donc après `payloads.py`).
  - `tc` : pour chaque palier et chaque critère (énergie `mw`, matière `mat`, espace `esp`), meilleure chaîne, chaîne tout en base et podium, par recherche exacte (séparation-évaluation).
  - Synthèse (`syn`) : coût composite en MW-équivalents, pI·MW + pM·τM·ressources + pE·τE·m², τ étant les taux de change médians entre critères calculés par la page. Ses combinaisons ne sont pas précalculées : la page les recalcule elle-même aux poids des curseurs (moins d'une seconde pour tous les paliers). La recherche exacte vit donc dans la page ; le script en reprend le code (de `RAWE` à `brutes`) tel quel.
  - `combi` (et `combiM`, `combiE`, `combiS` pour les critères matière, espace et synthèse à poids égaux) : le même calcul sans plafond de palier, plus, par énumération complète, le nombre de chaînes distinctes (une recette par item, cohérente sur tout l'arbre, sans boucle) et l'indice de la pire, tant qu'il y en a au plus un million. Le podium et la fréquence des alternatives se recalculent dans la page depuis `tc`.
  - Sans `--ecrire`, le JSON part sur la sortie standard ; `tc` (défaut) ou `registre` limitent le calcul à une des deux parties.
- Le payload du broyeur (`src`, `tgt`) est entièrement calculé par `scripts/broyeur.py` (appelé par `payloads.py`) : chaîne la moins gourmande en MW pour chaque item, byproducts non crédités, puis puissance, minerai neuf, machines, consommations `u` et palier `t` lus le long de cette chaîne (`t` = palier le plus haut de ses recettes). `python3 scripts/broyeur.py` seul montre les écarts avec la page sans rien écrire.
- Le payload de l'arbre de production (`items`, `ic`) est calculé par `scripts/arbre.py` (appelé par `payloads.py`) : profondeur, entrées directes, items intermédiaires distincts, ressources brutes et palier, le long de deux chaînes — recettes de base, ou chaîne optimisée du broyeur. `python3 scripts/arbre.py` seul donne un résumé sans rien écrire.
- Alternatives de disque dur : le jeu ne les propose au tirage qu'une fois leurs dépendances acquises (`requiredSchematics` de la source) — jalons, autres alternatives ou recherches du MAM, celles-ci au palier calculé depuis `arbre-mam.json` ; jamais avant le MAM (palier 1). Une dépendance vers un schéma disparu de la source est rattachée au schéma qui débloque aujourd'hui la même recette. Seules Iron Wire et Cast Screws n'ont aucune dépendance : elles sortent dès le palier 1.

## Vérifications automatiques (CI)

Trois workflows GitHub Actions, dans `.github/workflows/` :

- `verif.yml`, à chaque PR et sur `main` (~2 min) : relance `langue.py`, `patchnotes.py` et `payloads.py` et échoue s'ils modifient une page (une étape de régénération a été oubliée) ; lance `verif_payloads.py` ; ouvre chaque page dans Chromium, en français puis en anglais, et échoue sur une erreur JS ou du texte de l'autre langue (`node scripts/test_pages.js`, lançable en local).
- `combinaisons.yml`, seulement si l'infographie, `donnees/` ou `paliers_combinaisons.js` changent (~10 min) : recalcule les combinaisons et échoue si elles diffèrent du payload commité.
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
- Glossaire : un nom n'y entre que confirmé par la localisation officielle, relevée sur satisfactory-calculator.com (pages française et anglaise d'un même objet ; les recettes sont appariées par bâtiment et ingrédients, jamais par leur ordre). Recettes alternatives comprises, sous leur nom sans le préfixe « Alternate: ». Tous les noms affichés par les outils sont traduits ; seule la recette alternative Automated Miner (« Foreuse automatisée »), absente de la source et du wiki français, a été relevée en jeu.
- Toute nouvelle page ou évolution doit fournir les deux langues, journal des révisions compris.
