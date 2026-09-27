#!/usr/bin/env bash
# Reconstruit commun/vendor/satisfactory-file-parser.js : le parseur de sauvegardes Satisfactory
# @etothepii/satisfactory-file-parser (MIT, npm), réduit en un seul fichier pour le navigateur (esbuild),
# chargé par le Web Worker de commun/ficsit-partie-worker.js. À relancer seulement pour changer de version.
#   bash scripts/parseur.sh [version]   (défaut : la version ci-dessous)
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="${1:-4.1.2}"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
( cd "$T" && npm init -y >/dev/null && npm install --silent "@etothepii/satisfactory-file-parser@$VERSION" esbuild@0.25 >/dev/null
  echo "export { Parser } from '@etothepii/satisfactory-file-parser';" > entree.js
  npx esbuild entree.js --bundle --minify --format=iife --global-name=SatisfactoryFileParser --platform=browser \
    --target=es2020 --legal-comments=none --outfile=parseur.js --log-level=warning )
L="$T/node_modules/@etothepii/satisfactory-file-parser/LICENCE.md"
{ echo "/* @etothepii/satisfactory-file-parser $VERSION — https://github.com/etothepii4/satisfactory-file-parser"
  echo "   Réduit par scripts/parseur.sh (esbuild) : ne pas éditer. Dépendance incluse : pako (MIT / Zlib)."
  sed 's/^/   /' "$L"; echo "*/"
  cat "$T/parseur.js"; } > commun/vendor/satisfactory-file-parser.js
ls -l commun/vendor/satisfactory-file-parser.js
