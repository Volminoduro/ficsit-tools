#!/usr/bin/env python3
"""Construit le bloc commun (langue, glossaire, grille de paliers) et le relie à chaque page HTML du dépôt.

Sources : commun/langue.json (configuration), commun/glossaire.json (noms du jeu EN → FR),
commun/ficsit-lang.js (moteur + sélecteur à drapeaux), commun/ficsit-lang.css,
commun/ficsit-paliers.js et .css (grille de paliers commune), commun/ficsit-partie.js (import d'une sauvegarde)
et le référentiel des alternatives qu'il utilise, tiré de donnees/donnees-jeu.json.
Produit commun/ficsit-commun.js et commun/ficsit-commun.css (fichiers générés : ne pas les éditer), une seule
copie servie à tous les outils et mise en cache par le navigateur. Chaque page reçoit, en tête de <head> juste après
<meta charset> (la langue est posée avant le premier rendu), un <link> et un <script> vers ces fichiers, suffixés
d'une empreinte de leur contenu (?v=…) pour qu'une mise à jour ne reste pas bloquée dans le cache.
Idempotent : remplacé entre <!-- FICSIT-LANG:START --> et <!-- FICSIT-LANG:END -->.
Usage : python3 scripts/langue.py   (depuis la racine du dépôt)
"""
import hashlib, json, re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
C = ROOT / "commun"
START, END = "<!-- FICSIT-LANG:START -->", "<!-- FICSIT-LANG:END -->"


def compact(obj):
    obj = {k: v for k, v in obj.items() if not k.startswith("_")}
    # « </ » ne doit pas fermer la balise <script> hôte
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def alternatives():
    """Référentiel des alternatives pour « Ma partie » (commun/ficsit-partie.js), tiré de donnees/donnees-jeu.json :
    recettes[classe] = [nom sans « Alternate: », item produit, slug d'icône de l'item, palier] ;
    disques[schéma de disque dur] = [nom du schéma, classes des recettes qu'il débloque]."""
    d = json.loads((ROOT / "donnees" / "donnees-jeu.json").read_text(encoding="utf-8"))
    rec = {}
    for nom, r in sorted(d["recettes"].items(), key=lambda x: x[1]["classe"]):
        if r["alternative"] and r["produits"]:
            item = r["produits"][0][0]
            rec[r["classe"]] = [nom.replace("Alternate: ", ""), item, d["items"][item]["slug"], r.get("palier")]
    classes = {n: r["classe"] for n, r in d["recettes"].items()}
    dd = {s: [x["nom"], [classes[n] for n in x["recettes"]]] for s, x in d["disquesDurs"].items()}
    return compact({"recettes": rec, "disques": dd})


def recettes():
    """Graphe des recettes de production pour « Ma partie » (items fabricables, chaîne de l'arbre avec vos recettes) :
    items (noms triés) et r = [classe, nom, alternative 0/1, palier, [indices des ingrédients], [indices des produits]]."""
    d = json.loads((ROOT / "donnees" / "donnees-jeu.json").read_text(encoding="utf-8"))
    B = d["batiments"]
    rec = sorted((n, r) for n, r in d["recettes"].items()
                 if r["machine"] and B.get(r["machine"], {}).get("groupe") == "production")
    items = sorted({x[0] for _, r in rec for x in r["ingredients"] + r["produits"]})
    ix = {n: i for i, n in enumerate(items)}
    return compact({"items": items, "r": [[r["classe"], n, int(r["alternative"]), r["palier"],
                                          [ix[x[0]] for x in r["ingredients"]], [ix[x[0]] for x in r["produits"]]]
                                         for n, r in rec]})


def bloc():
    conf = json.loads((C / "langue.json").read_text(encoding="utf-8"))
    glo = json.loads((C / "glossaire.json").read_text(encoding="utf-8"))
    if conf["defaut"] not in conf["langues"]:
        sys.exit("langue.json : 'defaut' absent de 'langues'")
    tete = "/* Fichier généré par scripts/langue.py depuis commun/ : ne pas éditer. */\n"
    js = (C / "ficsit-lang.js").read_text(encoding="utf-8")
    js = js.replace("__CONF__", compact(conf)).replace("__GLOSSAIRE__", compact(glo))
    js = tete + js.strip() + "\n" + (C / "ficsit-paliers.js").read_text(encoding="utf-8").strip() + "\n"
    js += "window.FicsitAlternatives=" + alternatives() + ";\n"
    js += "window.FicsitRecettes=" + recettes() + ";\n"
    js += (C / "ficsit-partie.js").read_text(encoding="utf-8").strip() + "\n"
    css = tete + "\n".join((C / f).read_text(encoding="utf-8").strip() for f in ("ficsit-lang.css", "ficsit-paliers.css")) + "\n"
    for nom, contenu in (("ficsit-commun.js", js), ("ficsit-commun.css", css)):
        f = C / nom
        if not f.exists() or f.read_text(encoding="utf-8") != contenu:
            f.write_text(contenu, encoding="utf-8")
    v = lambda t: hashlib.sha1(t.encode("utf-8")).hexdigest()[:10]
    return (f'{START}\n<link rel="stylesheet" href="commun/ficsit-commun.css?v={v(css)}">\n'
            f'<script src="commun/ficsit-commun.js?v={v(js)}"></script>\n{END}')


def empreintes(s):
    """Scripts locaux propres à une page (<script src="x.js?v=…">, hors commun/) : empreinte de leur contenu."""
    def rempl(m):
        f = ROOT / m.group(1)
        return m.group(0) if not f.exists() else \
            f'src="{m.group(1)}?v={hashlib.sha1(f.read_bytes()).hexdigest()[:10]}"'
    return re.sub(r'src="([\w\-]+\.js)(?:\?v=[0-9a-f]+)?"', rempl, s)


def injecter(p, contenu):
    s = p.read_text(encoding="utf-8")
    if START in s:
        s = re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END), lambda _: contenu, s, count=1)
    else:
        m = re.search(r"<meta\s+charset=[^>]*>", s, re.I) or re.search(r"<head[^>]*>", s, re.I)
        if not m:
            sys.exit(f"{p.name} : ni <meta charset> ni <head> trouvés")
        s = s[:m.end()] + "\n" + contenu + s[m.end():]
    s = empreintes(s)
    p.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    b = bloc()
    for p in sorted(ROOT.glob("*.html")):
        injecter(p, b)
        print(f"{p.name} : bloc langue à jour")
