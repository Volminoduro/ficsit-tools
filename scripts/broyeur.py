#!/usr/bin/env python3
"""Optimiseur du broyeur (broyeur-excedents.html) : calcule son payload {src, tgt} depuis le référentiel.

Modèle (celui que la page décrit dans son pied de page) :
- Chaque item est produit par la recette qui minimise les MW par unité/min, coûts récursifs compris
  (meilleures alternatives retenues). Toute recette de production compte, et elle peut servir pour
  n'importe lequel de ses produits : elle est alors facturée entièrement à ce produit, les autres
  sorties ne sont ni créditées ni escomptées.
- Machines sans overclocking ; puissance moyenne (min+max)/2 pour les machines à puissance variable.
- Extraction facturée par unité : Foreuse Mk.2 sur nœud normal pour les solides (15 MW / 120 par min),
  Water Extractor (20 / 120), Oil Extractor (40 / 120), puits de gaz pour l'azote (0,5 MW par unité).
- Minimum par point fixe (Bellman-Ford) : les MW sont positifs, la chaîne retenue n'a pas de boucle.
- Une fois la chaîne de chaque item fixée, tout se lit le long de cette même chaîne : mw, minerai
  neuf (raw : ressources hors eau), machines (mach), consommation récursive de chaque item (u) et
  palier (t = palier le plus haut parmi les recettes de la chaîne, au sens du référentiel).

src = ingrédients d'au moins une recette de production dont le coût est calculable (triés par nom).
tgt = items solides qui rapportent des points et qu'une chaîne sait produire (triés par points/MW).

Usage : python3 scripts/broyeur.py   → résumé des écarts avec la page, sans rien écrire.
L'écriture dans la page passe par scripts/payloads.py.
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = json.loads((ROOT / "donnees" / "donnees-jeu.json").read_text(encoding="utf-8"))
R, B, ITEMS, RES = REF["recettes"], REF["batiments"], REF["items"], set(REF["ressources"])

EXTRACTION = {"Water": 20 / 120, "Crude Oil": 40 / 120, "Nitrogen Gas": 0.5}  # MW par unité/min
FOREUSE = 15 / 120                                                          # Foreuse Mk.2, nœud normal


def mw_recette(r):
    return (r["mwMin"] + r["mwMax"]) / 2 if "mwMin" in r else B[r["machine"]]["mw"]


def chaines():
    """Recette retenue pour chaque item productible : {item: (recette, quantité produite par cycle)}."""
    opts = {}
    for n, r in sorted(R.items()):
        if r["machine"] in B and B[r["machine"]]["groupe"] == "production":
            for p, q in r["produits"]:
                opts.setdefault(p, []).append((n, q))
    val = {x: EXTRACTION.get(x, FOREUSE) for x in RES}
    choix = {}
    for _ in range(len(opts) + 1):
        change = False
        for p, lst in opts.items():
            if p in RES:
                continue
            for n, q in lst:
                r = R[n]
                if any(g not in val for g, _ in r["ingredients"]):
                    continue
                c = mw_recette(r) * R[n]["temps"] / 60 / q + sum(gq / q * val[g] for g, gq in r["ingredients"])
                # départage des ex æquo : recette de base d'abord, puis ordre alphabétique (tri de `opts`)
                if p not in val or c < val[p] * (1 - 1e-12) or (
                        c <= val[p] * (1 + 1e-12) and choix[p][0] != n
                        and (R[choix[p][0]]["alternative"], choix[p][0]) > (r["alternative"], n)):
                    val[p], choix[p], change = c, (n, q), True
        if not change:
            return choix
    raise RuntimeError("pas de point fixe : boucle de coût négatif ?")


def deroule(item, choix):
    """Déroule la chaîne d'un item pour 1 unité/min : mw, minerai neuf, machines, u, palier."""
    acc = {"mw": 0.0, "raw": 0.0, "mach": 0.0, "t": 0, "u": {}}

    def go(it, k, pile):
        acc["u"][it] = acc["u"].get(it, 0) + k
        if it in RES:
            acc["mw"] += k * EXTRACTION.get(it, FOREUSE)
            acc["raw"] += 0 if it == "Water" else k
            return
        if it in pile:
            raise RuntimeError(f"boucle dans la chaîne de {item} : {it}")
        n, q = choix[it]
        r = R[n]
        par_min = 60 / r["temps"] * q
        acc["mw"] += k * mw_recette(r) / par_min
        acc["mach"] += k / par_min
        acc["t"] = max(acc["t"], r["palier"])
        for g, gq in r["ingredients"]:
            go(g, k * gq / q, pile | {it})

    go(item, 1.0, frozenset())
    return acc


def calcul():
    choix = chaines()
    calc = set(choix) | RES
    ingr = {g for r in R.values() if r["machine"] in B and B[r["machine"]]["groupe"] == "production"
            for g, _ in r["ingredients"]}
    noms_src = sorted(ingr & calc)
    idx = {n: i for i, n in enumerate(noms_src)}
    ch = {n: deroule(n, choix) for n in calc}
    src = [{"n": n, "sp": ITEMS[n]["points"], "liq": ITEMS[n]["liquide"], "mw": round(ch[n]["mw"], 5),
            "raw": round(ch[n]["raw"], 5), "mach": round(ch[n]["mach"], 5)} for n in noms_src]
    tgt = []
    for n in choix:
        if ITEMS.get(n, {}).get("points", 0) <= 0 or ITEMS[n]["liquide"]:
            continue
        c = ch[n]
        tgt.append({"n": n, "sp": ITEMS[n]["points"], "mw": round(c["mw"], 5), "raw": round(c["raw"], 5),
                    "mach": round(c["mach"], 5), "t": c["t"], "rec": choix[n][0],
                    "u": {str(idx[k]): round(v, 6) for k, v in sorted(c["u"].items(), key=lambda x: idx.get(x[0], -1))
                          if k in idx}})
    tgt.sort(key=lambda t: -t["sp"] / t["mw"])
    return {"src": src, "tgt": tgt}


def payload_page():
    s = (ROOT / "broyeur-excedents.html").read_text(encoding="utf-8")
    return json.loads(re.search(r'<script id="payload" type="application/json">(.*?)</script>', s, re.S).group(1))


if __name__ == "__main__":
    neuf, page = calcul(), payload_page()
    print(f"src : {len(neuf['src'])} items (page : {len(page['src'])}) ; tgt : {len(neuf['tgt'])} cibles (page : {len(page['tgt'])})")
    ancien = {t["n"]: t for t in page["tgt"]}
    for t in neuf["tgt"]:
        a = ancien.get(t["n"])
        if not a:
            print(f"  nouvelle cible : {t['n']}")
            continue
        diff = [k for k in ("rec", "t", "mw", "raw", "mach") if a.get(k) != t[k]]
        if a["u"] != t["u"]:
            diff.append("u")
        if diff:
            print(f"  {t['n']:30} " + ", ".join(f"{k} {a.get(k)} → {t[k]}" for k in diff if k != "u") + (" (u)" if "u" in diff else ""))
