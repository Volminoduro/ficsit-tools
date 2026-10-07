# Vérifications automatiques (CI)

Trois workflows GitHub Actions, dans `.github/workflows/` :

- `verif.yml`, à chaque PR et sur `main` (~2 min) : `bash scripts/tout.sh --ci`, soit la régénération (échec si elle modifie une page : une étape a été oubliée), `verif_payloads.py`, puis chaque page dans Chromium, en français puis en anglais (échec sur une erreur JS ou du texte de l'autre langue), et des vérifications fonctionnelles par page (chaque page à 320 et 390 px, sans débordement horizontal ; `CHECKS` de `scripts/test_pages.js` : le broyeur trouve des cibles, l'arbre liste tous ses items, l'infographie a des combinaisons dans chaque critère et sa synthèse à 100 % d'énergie redonne I…).
- `combinaisons.yml`, seulement si l'infographie, `donnees/` ou les scripts de combinaisons changent : compare l'empreinte de ce dont dépend le calcul (recettes et paliers du payload, blocs MOTEUR et PALIERS de la page, script ; `scripts/empreinte_combinaisons.js`) et celle des combinaisons stockées à celles de la base de la PR. Identiques (changement d'interface seul : CSS, textes, onglets), le recalcul est sauté, quelques secondes.
  - Sinon, il recalcule (~15 min) et échoue si le résultat diffère du payload commité.
  - Le recalcul complet tourne aussi chaque lundi sur `main` et à la demande (`workflow_dispatch`), pour qu'un saut à tort ne reste pas caché.
- `source.yml`, chaque lundi (ou à la demande) : régénère le référentiel depuis `greeny/SatisfactoryTools` et échoue si la source a changé, date de récupération mise à part. C'est le signal qu'une mise à jour du jeu est à intégrer. Ne bloque aucune PR.

Versions épinglées dans les workflows (Python 3.12, Pillow 12.3.0, Node 22, Playwright 1.56.1) : une autre version de Pillow pourrait ré-encoder les icônes différemment et faire échouer la première vérification sans vraie raison.
