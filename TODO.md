# TODO

Chantiers à venir, par outil. Estimation en charge d'IA (tokens de la session de travail, lecture ciblée des pages, régénération des payloads et vérifications comprises ; ordres de grandeur, pas des mesures) : **S** ≈ moins de 15 000 tokens, **M** ≈ 15 000 à 60 000, **L** ≈ plus de 60 000. Niveau H et modèle conseillés selon la grille du skill de sélection de modèle.
Rappel : chaque évolution d'un outil passe par une entrée de `changelog.json` (FR/EN) puis `python3 scripts/patchnotes.py`, et tous les textes ajoutés sont traduits FR/EN.

## Optimiseur de recyclage — `broyeur-excedents.html`

- [ ] **Sélecteur de palier façon « recettes alternatives »** — **M** (~50 000 tokens, H1 Sonnet 5)
  Remplacer le menu déroulant « Tier max » (`tierSel`) par la grille de boutons à icônes de l'infographie (`.tiersel`, palier atteint). Le choix par défaut est forcé au palier minimum de l'objet sélectionné (son `t`), et non plus « tous ». Reprend le composant et son CSS de l'infographie ; à vérifier : le comportement quand la sélection change (le palier suit-il le nouvel objet ?), la mémorisation des réglages, et les paliers de la grille qui sont sous le minimum de l'objet (grisés, non cliquables).
- [ ] **Retirer le filtre « Minerai neuf »** — **M bas** (~25 000 tokens, H1 Sonnet 5)
  Le filtre (`noRawLbl`, `rawMaxLbl`) et la colonne « Minerai neuf » (`mRawNeeded`) ne correspondent jamais aux données observées : à supprimer, ainsi que le calcul associé dans `scripts/broyeur.py` s'il n'alimente rien d'autre (vérifier que `arbre.py` ne s'en sert pas), l'aide et le message « décochez le filtre minerai ». Régénérer les payloads, relancer `verif_payloads.py`.
- [ ] **Renommer « Chaîne déjà payée »** — **S** (~10 000 tokens, H0 Haiku 4.5 une fois le nom choisi)
  Libellé peu parlant (`sortC`, `chainCovered`, `mChainCovered`). Trouver un nom clair en FR et en EN, le reporter dans le tri, la colonne, la fiche détail et l'aide. Le plus coûteux est de trancher la formulation avec le joueur ; le remplacement lui-même est mécanique.

Entrée de journal à prévoir pour le broyeur (une seule version regroupant les trois points, `patchnotes.py`, `verif_payloads.py` et `test_pages.js` compris) : ~8 000 tokens en plus. Total des trois chantiers : ~90 000 tokens.
