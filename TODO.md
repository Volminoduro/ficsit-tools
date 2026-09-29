# TODO

Fait le 2026-09-25 : les quatre chantiers ci-dessous (cochés). « Chaîne déjà payée » est devenu « avancement de la chaîne ».

Chantiers à venir, par outil. Estimation en charge d'IA (tokens de la session de travail, lecture ciblée des pages, régénération des payloads et vérifications comprises ; ordres de grandeur, pas des mesures) : **S** ≈ moins de 15 000 tokens, **M** ≈ 15 000 à 60 000, **L** ≈ plus de 60 000. Niveau H et modèle conseillés selon la grille du skill de sélection de modèle.
Rappel : chaque évolution d'un outil passe par une entrée de `changelog.json` (FR/EN) puis `python3 scripts/patchnotes.py`, et tous les textes ajoutés sont traduits FR/EN.

## Tous les outils — `commun/`

- [x] **Bouton « Accueil » sur chaque outil** — **M bas** (~20 000 tokens, H1 Sonnet 5)
  Un bouton de retour vers `index.html` sur les cinq outils (pas sur l'accueil lui-même). À placer dans le dock commun en haut à droite, à côté du badge de version et des drapeaux : le plus simple est de le créer une seule fois dans `commun/ficsit-lang.js` (à côté de `#fdock`), avec son style dans `commun/ficsit-lang.css` (charte FICSIT, icône de maison ou de logo) et son libellé FR/EN dans `commun/langue.json` (`langue.py` à relancer). Lien relatif, pour rester valable sur GitHub Pages. À vérifier : l'affichage sur mobile, où le dock est déjà chargé. Comme le code est commun, une seule modification, mais une entrée de journal (FR/EN) par outil dans `changelog.json` (5 entrées, un bump de version chacune), puis `patchnotes.py` et `test_pages.js`.
- [x] **Importer ma sauvegarde : recettes alternatives débloquées** — **L** (fait le 2026-09-27)
  Module commun `commun/ficsit-partie.js` + Web Worker `commun/ficsit-partie-worker.js` avec le parseur npm @etothepii/satisfactory-file-parser 4.1.2 (MIT, ~280 Ko réduit, ~58 Ko compressé, `scripts/parseur.sh`), vérifié sur 25 sauvegardes réelles (1.0 à 1.2, versions 46 à 58 ; antérieures à 1.0 refusées). Extraction de `mAvailableRecipes`, `mPurchasedSchematics` et des disques durs en attente de choix — structure relevée sur une sauvegarde réelle : il n'y a pas d'acteur « scanner », l'état est dans `BP_ResearchManager.mUnclaimedHardDriveData` (`HardDriveID`, `PendingRewards`, `PendingRewardsRerollsExecuted`) ; une analyse encore en cours (`mSavedOngoingResearch`) n'a pas de choix et n'est pas lue. Revu le 2026-09-27 à la demande du joueur : l'import ne se fait plus que dans l'infographie, dans un panneau latéral (onglet sur le bord droit) : barre de progression, filtre, disques en attente, alternatives débloquées / manquantes, toutes notées sur le critère de l'onglet affiché (énergie, matière, espace ou synthèse), avec gain vs base et verdict gagnante / compromis / perdante. Ajouté le 2026-09-28 : simulation des choix de disques durs (un choix coché par disque, option « Simuler mes choix » qui les ajoute au filtre des combinaisons, duels, catalogue et paliers).
  Lecteur rapide ajouté le 2026-09-28 (les trois listes lues directement, parseur complet en secours) : ~1 s dans Chrome pour 5,5 Mo, résultats identiques au parseur sur les 22 sauvegardes 1.0+ de test. Limite : pas de sauvegarde de plusieurs dizaines de Mo pour tester (le lecteur rapide garde en mémoire le corps décompressé, pas l'arbre d'objets).

## Optimiseur de recyclage — `broyeur-excedents.html`

- [x] **Sélecteur de palier façon « recettes alternatives »** — **M** (~50 000 tokens, H1 Sonnet 5)
  Remplacer le menu déroulant « Tier max » (`tierSel`) par la grille de boutons à icônes de l'infographie (`.tiersel`, palier atteint). Le choix par défaut est forcé au palier minimum de l'objet sélectionné (son `t`), et non plus « tous ». Reprend le composant et son CSS de l'infographie ; à vérifier : le comportement quand la sélection change (le palier suit-il le nouvel objet ?), la mémorisation des réglages, et les paliers de la grille qui sont sous le minimum de l'objet (grisés, non cliquables).
- [x] **Retirer le filtre « Minerai neuf »** — **M bas** (~25 000 tokens, H1 Sonnet 5)
  Le filtre (`noRawLbl`, `rawMaxLbl`) et la colonne « Minerai neuf » (`mRawNeeded`) ne correspondent jamais aux données observées : à supprimer, ainsi que le calcul associé dans `scripts/broyeur.py` s'il n'alimente rien d'autre (vérifier que `arbre.py` ne s'en sert pas), l'aide et le message « décochez le filtre minerai ». Régénérer les payloads, relancer `verif_payloads.py`.
- [x] **Renommer « Chaîne déjà payée »** — **S** (~10 000 tokens, H0 Haiku 4.5 une fois le nom choisi)
  Libellé peu parlant (`sortC`, `chainCovered`, `mChainCovered`). Trouver un nom clair en FR et en EN, le reporter dans le tri, la colonne, la fiche détail et l'aide. Le plus coûteux est de trancher la formulation avec le joueur ; le remplacement lui-même est mécanique.

Entrée de journal à prévoir pour le broyeur (une seule version regroupant les trois points, `patchnotes.py`, `verif_payloads.py` et `test_pages.js` compris) : ~8 000 tokens en plus. Total des trois chantiers du broyeur : ~90 000 tokens ; avec le bouton Accueil : ~110 000.

## Nouvel outil — débit vers le Dimensional Depot

- [ ] **Estimer, depuis une sauvegarde, le débit envoyé au Dimensional Depot** — **L** (≫ 60 000 tokens, à découper en plusieurs PR ; H2 Opus)
  Objectif : un outil qui estime, à partir d'une sauvegarde Satisfactory (.sav), le débit par minute et par item envoyé au Dimensional Depot via les Dimensional Depot Uploaders.
  1. **Lecture de la save**
     - Parser la save dans le navigateur (par ex. avec @etothepii/satisfactory-file-parser, déjà embarqué dans `commun/vendor/`), sans envoi serveur : la save ne quitte pas la machine de l'utilisateur.
     - Extraire : bâtiments (type, recette, overclock, sloops), convoyeurs et tuyaux (tier), séparateurs (filtres des intelligents et programmables), extracteurs (pureté du nœud, tier du mineur), centrales, Uploaders, et le raccordement de chaque connecteur.
     - Reconstruire le graphe complet de production, des nœuds de ressources jusqu'aux Uploaders.
  2. **Calcul du débit**
     - Calcul stationnaire par propagation de flot, itéré jusqu'à convergence (point fixe).
     - Prendre en compte :
       - la capacité machine (recette × horloge × sloop) ;
       - le manque d'entrée : une machine tourne à min(capacité, entrées disponibles / besoin) ;
       - le plafond des convoyeurs et des tuyaux ;
       - la répartition équitable aux séparateurs, filtres compris ;
       - l'apport réel des extracteurs ;
       - le déficit du réseau électrique.
     - Gérer les boucles et rétroactions sans divergence, et signaler quand la solution n'est pas unique.
     - Prendre en compte les limites de stockage du Depot par item, lues dans la save : surplus détruit ou amont bloqué.
  3. **Validation**
     - Recouper le modèle avec le remplissage réel des convoyeurs dans la save (plein et immobile = saturation, presque vide = manque d'entrée) et signaler les écarts.
     - Option : comparer deux saves (delta de stock du Depot / delta de temps de jeu) pour obtenir un débit net réel, en avertissant que la consommation depuis le Depot fausse ce chiffre.
  4. **Sortie** : tableau par item du débit vers le Depot en items/min (théorique et déduit), avec les goulots mis en évidence (machine, convoyeur ou ressource limitante).
  5. **Contraintes du projet**
     - Icônes des items du jeu pour faciliter la lecture, charte graphique du jeu autant que possible.
     - Traduction complète FR/EN de tous les textes (`commun/langue.json`).
     - Entrée correspondante dans le journal de l'outil (`changelog.json`, `patchnotes.py`).
     - Fichiers poussés sur le dépôt habituel.
     - Conventions existantes réutilisées : référentiel `donnees/donnees-jeu.json`, slugs et icônes partagées (`commun/icones-44/`), pipeline `scripts/tout.sh`, tests `test_pages.js`.

  Notes préalables (relevées pendant le chantier « Ma partie », à vérifier) :
  - Le lecteur rapide de « Ma partie » ne suffira pas. Il faut le parseur complet (bâtiments, connexions, inventaires des convoyeurs), qui construit tout l'arbre d'objets : environ 12 s et beaucoup de mémoire en Node pour 5,5 Mo, donc Web Worker indispensable et risque réel sur les très grosses saves.
  - Structures à identifier sur une vraie save avant de coder (comme pour `mUnclaimedHardDriveData`) : Uploaders et leur item, stock et plafond du Depot (sous-système de stockage central), connexions des convoyeurs (`mConnectedComponent`), contenu des convoyeurs, circuits électriques. Il faut au moins une sauvegarde avec des Uploaders actifs, idéalement deux prises à quelques minutes d'écart pour la validation par delta.
  - Découpage conseillé en PR successives :
    1. lecture et graphe, affichés sans calcul ;
    2. débits théoriques ;
    3. convoyeurs, séparateurs et électricité ;
    4. validation et comparaison de deux saves.

  Avancement :
  - [x] **Étape 1 — lecture et graphe** (fait le 2026-09-29, `depot-dimensionnel.html`, `commun/ficsit-usine-worker.js`). Vérifié sur Dunarr-076 (8 717 bâtiments gardés, 9 383 liaisons, ~5 s dans Chrome, ~15 s en Node). Relevés sur la save réelle :
    - on garde tout bâtiment dont un port de convoyeur est branché, plutôt qu'une liste de classes : la save contient des conteneurs `Build_ContainerScreen_Mk1_C` / `Mk2_C` et des bâtiments de mods (`Build_RatioSplitter_C`, `Build_RatioMerger_C`, `Build_FF_…` avec des ports `mInputFactoryConnection` / `mOutputFactoryConnection`) ;
    - le séparateur d'ascenseur (`Build_ConveyorAttachmentSplitterLift_C`) a des ports `TopConnection` / `BottomConnection` sans sens propre : on les tient pour des entrées quand l'autre bout est une sortie ;
    - les conteneurs de stockage sont traversés (tampons) et signalés, puisque le débit peut venir d'un stock accumulé.
  - [ ] Étape 2 — débits théoriques. Manque : la pureté des nœuds (absente de la save, `mExtractableResource` ne donne que l'acteur `BP_ResourceNode…` : il faut une table nœud → pureté tirée des données de la carte) et la limite de stockage du Depot par item (pile de base × extension, à confirmer).
