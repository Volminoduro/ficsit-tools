# Polices embarquées

Toutes sous licence SIL Open Font License 1.1 (`OFL.txt`), © The Noto Project Authors. Déclarées dans
`commun/ficsit-hud.css`, sous la famille « Noto Sans », chacune pour sa plage de caractères (`unicode-range`) :
le navigateur ne télécharge que celles dont la page a besoin.

| Fichier | Source | Caractères |
|---|---|---|
| `noto-sans-latin.woff2` | Google Fonts, Noto Sans (variable : graisse 400-800, chasse 62,5-100 %), sous-ensemble *latin* | latin de base, ponctuation |
| `noto-sans-latin-ext.woff2` | idem, sous-ensemble *latin-ext* | latin étendu |
| `noto-sans-grec.woff2` | idem, sous-ensemble *greek* | grec (Σ des formules) |
| `noto-sans-exposants.woff2` | google/fonts, `ofl/notosans/NotoSans[wdth,wght].ttf`, U+2070-209F | exposants, indices |
| `noto-sans-math-fleches.woff2` | google/fonts, `ofl/notosansmath/NotoSansMath-Regular.ttf`, U+2190-21FF hors ↑ ↓ | flèches |
| `noto-sans-mono-traits.woff2` | google/fonts, `ofl/notosansmono/NotoSansMono[wdth,wght].ttf`, U+2500-257F | traits d'arbre |
| `noto-sans-symboles2.woff2` | google/fonts, `ofl/notosanssymbols2/NotoSansSymbols2-Regular.ttf`, U+25A0-25FF, ★, ✓, ✔ | formes, coches |

Les quatre derniers sont découpés avec fontTools :
`pyftsubset <police>.ttf --unicodes="<plage>" --layout-features='*' --flavor=woff2 --output-file=<fichier>.woff2`.
Un caractère affiché hors de ces plages retomberait sur une police système et ferait varier les captures de
référence (`scripts/captures.js`) d'une machine à l'autre : l'ajouter ici.
