#!/usr/bin/env bash
# Mise à jour des données du jeu après un patch de Satisfactory (réseau requis) :
#   1. recharge le référentiel et les icônes depuis greeny/SatisfactoryTools (scripts/donnees.py) ;
#   2. recharge la pureté des nœuds de la carte (scripts/noeuds.py) ;
#   3. écrit le rapport des changements (donnees/derniere-maj.md) : items, recettes, bâtiments, disques durs, noms
#      à traduire dans commun/glossaire.json ;
#   4. régénère tout, combinaisons de l'infographie comprises, et vérifie (scripts/tout.sh --combinaisons).
# Ensuite : relire le rapport, compléter le glossaire si besoin (puis relancer bash scripts/tout.sh), ajouter une
# entrée de journal aux outils touchés, committer.
#   bash scripts/maj_jeu.sh [--sans-icones] [--sans-combinaisons]
set -euo pipefail
cd "$(dirname "$0")/.."

icones="" combi="--combinaisons"
for a in "$@"; do
  case "$a" in
    --sans-icones) icones="--sans-icones" ;;
    --sans-combinaisons) combi="" ;;
    *) echo "option inconnue : $a" >&2; exit 2 ;;
  esac
done

avant=$(mktemp); trap 'rm -f "$avant"' EXIT
cp donnees/donnees-jeu.json "$avant"
echo "== référentiel (greeny/SatisfactoryTools)"
python3 scripts/donnees.py $icones
echo "== nœuds de la carte (rockfactory/satisfactory-logistics)"
python3 scripts/noeuds.py
echo "== rapport des changements"
python3 scripts/diff_donnees.py "$avant" donnees/donnees-jeu.json --sortie donnees/derniere-maj.md > /dev/null
head -1 donnees/derniere-maj.md
grep '^## ' donnees/derniere-maj.md
echo "   (détail : donnees/derniere-maj.md)"
echo "== régénération et vérifications"
bash scripts/tout.sh $combi
