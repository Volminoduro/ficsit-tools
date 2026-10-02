#!/usr/bin/env bash
# Reconstruit commun/vendor/highs.js : le solveur de programmation linéaire HiGHS (https://highs.dev, MIT), compilé en
# WebAssembly par highs-js (MIT, npm), en un seul fichier pour le navigateur et Node : le code d'amorce d'emscripten
# et le module WebAssembly en base64 (une page ouverte en file:// ne peut pas charger un .wasm à part).
# Chargé à la demande par planner.html (optimisation des recettes) et par scripts/test_planner.js.
# Expose FicsitHighs() → Promise<highs> (une seule instance), et module.exports sous Node.
# À relancer seulement pour changer de version.
#   bash scripts/highs.sh [version]   (défaut : la version ci-dessous)
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="${1:-1.15.3}"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
( cd "$T" && npm init -y >/dev/null && npm install --silent "highs@$VERSION" >/dev/null )
B="$T/node_modules/highs"
{ echo "/* highs-js $VERSION (HiGHS compilé en WebAssembly) — https://github.com/lovasoa/highs-js"
  echo "   Assemblé par scripts/highs.sh : ne pas éditer. HiGHS : https://github.com/ERGO-Code/HiGHS (MIT)."
  sed 's/^/   /' "$B/LICENSE"; echo "*/"
  echo "(function(g){"
  echo "var module, exports, define;   // l'amorce d'emscripten reste dans cette fonction"
  cat "$B/build/highs.js"; echo
  printf 'var WASM = "'; base64 -w0 "$B/build/highs.wasm"; echo '";'
  cat <<'FIN'
var promesse = null;
function octets(){
  if(typeof atob !== 'function') return new Uint8Array(Buffer.from(WASM, 'base64'));
  var s = atob(WASM), u = new Uint8Array(s.length);
  for(var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}
g.FicsitHighs = function(){
  // le module WebAssembly est fourni directement (crochet instantiateWasm d'emscripten) : jamais de highs.wasm à charger
  if(!promesse) promesse = Module({instantiateWasm: function(imports, recevoir){
    WebAssembly.instantiate(octets(), imports).then(function(r){ recevoir(r.instance); });
    return {};
  }});
  return promesse;
};
})(typeof self !== 'undefined' ? self : globalThis);
if(typeof module === 'object' && module.exports) module.exports = globalThis.FicsitHighs;
FIN
} > commun/vendor/highs.js
ls -l commun/vendor/highs.js
