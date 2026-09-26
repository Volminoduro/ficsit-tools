#!/usr/bin/env bash
# Régénère toutes les pages depuis leurs sources, puis vérifie. À lancer après toute modification.
#   bash scripts/tout.sh                  régénère (langue, journal, payloads), vérifie les payloads, teste les pages
#   bash scripts/tout.sh --combinaisons   recalcule d'abord les combinaisons de l'infographie (~10 min)
#   bash scripts/tout.sh --ci             échoue si la régénération modifie une page (source oubliée) ; utilisé par la CI
#   bash scripts/tout.sh --sans-tests     sans les tests navigateur (Playwright absent)
# Ordre : combinaisons (réécrivent le payload de l'infographie) → langue → journal → payloads.
set -euo pipefail
cd "$(dirname "$0")/.."

ci=0 combi=0 tests=1
for a in "$@"; do
  case "$a" in
    --ci) ci=1 ;;
    --combinaisons) combi=1 ;;
    --sans-tests) tests=0 ;;
    *) echo "option inconnue : $a" >&2; exit 2 ;;
  esac
done

if [ "$combi" = 1 ]; then
  echo "== combinaisons de l'infographie"
  node scripts/paliers_combinaisons.js satisfactory_infographie.html tout --ecrire
fi

echo "== régénération"
python3 scripts/langue.py > /dev/null
python3 scripts/patchnotes.py > /dev/null
python3 scripts/payloads.py > /dev/null

if [ "$ci" = 1 ] && ! git diff --quiet; then
  git diff --stat
  echo "::error::Pages pas à jour : lancer bash scripts/tout.sh, puis committer (voir README)."
  exit 1
fi

echo "== payloads"
python3 scripts/verif_payloads.py

if [ "$tests" = 1 ]; then
  echo "== pages dans un navigateur"
  node scripts/test_pages.js
fi
echo "== tout est à jour"
