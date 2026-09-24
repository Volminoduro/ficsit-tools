#!/usr/bin/env python3
"""Arbre de production (arbre-production.html) : calcule son payload depuis le référentiel.

Pour chaque item broyable (solide, qui rapporte des points AWESOME et qu'une chaîne sait produire),
et pour deux chaînes de recettes :
- « base » : pour chaque item, sa recette standard (non alternative), de préférence celle dont il est
  le produit principal, puis le palier le plus bas, puis l'ordre alphabétique ; les recettes
  « Unpackage » ne servent qu'en dernier recours. Sans recette standard : la recette de la chaîne
  optimisée.
- « optimisée » : la chaîne la moins gourmande en MW, celle du broyeur (scripts/broyeur.py).
Mesures, le long de la chaîne (une recette par item) :
- d : profondeur, en niveaux de fabrication jusqu'aux ressources brutes (ressource = 0) ;
- e : entrées directes, nombre d'ingrédients de la recette de l'item ;
- i : items intermédiaires distincts de l'arbre (hors ressources brutes et hors l'item lui-même) ;
- r : ressources brutes distinctes (eau comprise) ;
- t : palier de la chaîne, le plus haut de ses recettes (au sens du référentiel) ;
- rec : recette de l'item.
Une boucle éventuelle (recette qui consomme un item déjà sur le chemin) est coupée : l'arête qui
reboucle compte pour une profondeur nulle.

Usage : python3 scripts/arbre.py   → résumé, sans rien écrire. L'écriture passe par scripts/payloads.py.
"""
import json, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import broyeur

ROOT, R, B, ITEMS, RES = broyeur.ROOT, broyeur.R, broyeur.B, broyeur.ITEMS, broyeur.RES


def chaine_base(optimisee):
    cand = {}
    for n, r in R.items():
        if r["machine"] not in B or B[r["machine"]]["groupe"] != "production" or r["alternative"]:
            continue
        for k, (p, q) in enumerate(r["produits"]):
            # clé de tri : produit principal d'abord, Unpackage en dernier recours, palier, nom
            cle = (n.startswith("Unpackage"), k > 0, r["palier"] if r["palier"] is not None else 99, n)
            if p not in cand or cle < cand[p][0]:
                cand[p] = (cle, (n, q))
    choix = {p: v[1] for p, v in cand.items() if p not in RES}
    for p, c in optimisee.items():
        choix.setdefault(p, c)
    return choix


def mesures(item, choix):
    prof = {}

    def profondeur(it, pile):
        if it in RES:
            return 0
        if it in prof:
            return prof[it]
        if it in pile or it not in choix:
            return 0
        n, _ = choix[it]
        d = 1 + max((profondeur(g, pile | {it}) for g, _ in R[n]["ingredients"]), default=0)
        prof[it] = d
        return d

    inter, bruts, t, vus = set(), set(), 0, set()
    pile = [item]
    while pile:
        it = pile.pop()
        if it in vus:
            continue
        vus.add(it)
        if it in RES:
            bruts.add(it)
            continue
        if it not in choix:
            continue
        if it != item:
            inter.add(it)
        r = R[choix[it][0]]
        t = max(t, r["palier"] or 0)
        pile.extend(g for g, _ in r["ingredients"])
    n = choix[item][0]
    return {"d": profondeur(item, frozenset()), "e": len(R[n]["ingredients"]), "i": len(inter),
            "r": len(bruts), "t": t, "rec": n}


def calcul():
    opt = broyeur.chaines()
    base = chaine_base(opt)
    items = []
    for n in sorted(opt):
        if ITEMS.get(n, {}).get("points", 0) <= 0 or ITEMS[n]["liquide"]:
            continue
        items.append({"n": n, "sp": ITEMS[n]["points"], "b": mesures(n, base), "o": mesures(n, opt)})
    return {"items": items}


def payload_page():
    s = (ROOT / "arbre-production.html").read_text(encoding="utf-8")
    return json.loads(re.search(r'<script id="payload" type="application/json">(.*?)</script>', s, re.S).group(1))


if __name__ == "__main__":
    P = calcul()
    print(f"{len(P['items'])} items")
    for c in ("b", "o"):
        dmax = max(P["items"], key=lambda x: x[c]["d"])
        imax = max(P["items"], key=lambda x: x[c]["i"])
        print(f"  chaîne {c} : profondeur max {dmax[c]['d']} ({dmax['n']}), items distincts max {imax[c]['i']} ({imax['n']})")
    try:
        page = payload_page()
        print("page à jour" if {k: page[k] for k in P} == P else "page à régénérer (scripts/payloads.py)")
    except (FileNotFoundError, AttributeError):
        print("page absente ou sans payload")
