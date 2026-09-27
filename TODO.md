# TODO

Fait le 2026-09-25 : les quatre chantiers ci-dessous (cochés). « Chaîne déjà payée » est devenu « avancement de la chaîne ».

Chantiers à venir, par outil. Estimation en charge d'IA (tokens de la session de travail, lecture ciblée des pages, régénération des payloads et vérifications comprises ; ordres de grandeur, pas des mesures) : **S** ≈ moins de 15 000 tokens, **M** ≈ 15 000 à 60 000, **L** ≈ plus de 60 000. Niveau H et modèle conseillés selon la grille du skill de sélection de modèle.
Rappel : chaque évolution d'un outil passe par une entrée de `changelog.json` (FR/EN) puis `python3 scripts/patchnotes.py`, et tous les textes ajoutés sont traduits FR/EN.

## Tous les outils — `commun/`

- [x] **Bouton « Accueil » sur chaque outil** — **M bas** (~20 000 tokens, H1 Sonnet 5)
  Un bouton de retour vers `index.html` sur les cinq outils (pas sur l'accueil lui-même). À placer dans le dock commun en haut à droite, à côté du badge de version et des drapeaux : le plus simple est de le créer une seule fois dans `commun/ficsit-lang.js` (à côté de `#fdock`), avec son style dans `commun/ficsit-lang.css` (charte FICSIT, icône de maison ou de logo) et son libellé FR/EN dans `commun/langue.json` (`langue.py` à relancer). Lien relatif, pour rester valable sur GitHub Pages. À vérifier : l'affichage sur mobile, où le dock est déjà chargé. Comme le code est commun, une seule modification, mais une entrée de journal (FR/EN) par outil dans `changelog.json` (5 entrées, un bump de version chacune), puis `patchnotes.py` et `test_pages.js`.
- [x] **Importer ma sauvegarde : recettes alternatives débloquées** — **L** (fait le 2026-09-27)
  Module commun `commun/ficsit-partie.js` + Web Worker `commun/ficsit-partie-worker.js` avec le parseur npm @etothepii/satisfactory-file-parser 4.1.2 (MIT, ~280 Ko réduit, ~58 Ko compressé, `scripts/parseur.sh`), vérifié sur 25 sauvegardes réelles (1.0 à 1.2, versions 46 à 58 ; antérieures à 1.0 refusées). Extraction de `mAvailableRecipes`, `mPurchasedSchematics` et des disques durs en attente de choix — structure relevée sur une sauvegarde réelle : il n'y a pas d'acteur « scanner », l'état est dans `BP_ResearchManager.mUnclaimedHardDriveData` (`HardDriveID`, `PendingRewards`, `PendingRewardsRerollsExecuted`) ; une analyse encore en cours (`mSavedOngoingResearch`) n'a pas de choix et n'est pas lue. Accueil : barre de progression, alternatives débloquées / manquantes avec icônes, disques en attente, « Vider l'import ». Infographie : chaque choix en attente avec score Synthèse (poids mémorisés), gain vs base et verdict gagnante / compromis / perdante.
  Limites : pas de sauvegarde de plusieurs dizaines de Mo pour tester (la plus grosse : 6 Mo, ~5 s dans Chrome ; le parseur construit tout l'arbre d'objets, donc la mémoire croît avec la taille — message dédié si elle manque).

## Optimiseur de recyclage — `broyeur-excedents.html`

- [x] **Sélecteur de palier façon « recettes alternatives »** — **M** (~50 000 tokens, H1 Sonnet 5)
  Remplacer le menu déroulant « Tier max » (`tierSel`) par la grille de boutons à icônes de l'infographie (`.tiersel`, palier atteint). Le choix par défaut est forcé au palier minimum de l'objet sélectionné (son `t`), et non plus « tous ». Reprend le composant et son CSS de l'infographie ; à vérifier : le comportement quand la sélection change (le palier suit-il le nouvel objet ?), la mémorisation des réglages, et les paliers de la grille qui sont sous le minimum de l'objet (grisés, non cliquables).
- [x] **Retirer le filtre « Minerai neuf »** — **M bas** (~25 000 tokens, H1 Sonnet 5)
  Le filtre (`noRawLbl`, `rawMaxLbl`) et la colonne « Minerai neuf » (`mRawNeeded`) ne correspondent jamais aux données observées : à supprimer, ainsi que le calcul associé dans `scripts/broyeur.py` s'il n'alimente rien d'autre (vérifier que `arbre.py` ne s'en sert pas), l'aide et le message « décochez le filtre minerai ». Régénérer les payloads, relancer `verif_payloads.py`.
- [x] **Renommer « Chaîne déjà payée »** — **S** (~10 000 tokens, H0 Haiku 4.5 une fois le nom choisi)
  Libellé peu parlant (`sortC`, `chainCovered`, `mChainCovered`). Trouver un nom clair en FR et en EN, le reporter dans le tri, la colonne, la fiche détail et l'aide. Le plus coûteux est de trancher la formulation avec le joueur ; le remplacement lui-même est mécanique.

Entrée de journal à prévoir pour le broyeur (une seule version regroupant les trois points, `patchnotes.py`, `verif_payloads.py` et `test_pages.js` compris) : ~8 000 tokens en plus. Total des trois chantiers du broyeur : ~90 000 tokens ; avec le bouton Accueil : ~110 000.
