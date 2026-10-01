#!/usr/bin/env python3
"""Rentabilité énergétique par nœud (energie-noeuds.html) : coefficients de chaque filière, depuis le référentiel.

Une filière = une ressource primaire (le nœud qu'on compare), un combustible, un générateur et les recettes qui mènent
de l'une à l'autre (CHAINES). Pour chacune, on résout la chaîne pour une unité/min de combustible :
- chaque item intermédiaire est produit par la recette imposée par la filière, sinon par la recette de base dont il
  est le produit principal (hors conditionneuse et convertisseur) ;
- un coproduit sert d'abord aux besoins de la chaîne (point fixe), le reste est un surplus (signalé, non crédité) ;
- machines sans overclocking, puissance moyenne (min + max) / 2 pour les machines à puissance variable.
Puis on ramène tout à une unité/min de ressource primaire : MW bruts (énergie du combustible / 60), MW des machines,
ressources secondaires (dont l'eau des centrales à charbon et nucléaires), générateurs, surplus.

La page applique le reste selon le palier (celui de la partie importée, ou le dernier) : foreuse ou extracteur du
nœud, pureté, cadence (100 ou 250 %), plafond du convoyeur ou du tuyau, coût d'extraction des ressources secondaires.

Usage : python3 scripts/energie.py   → tableau récapitulatif (palier 9, nœud normal, 100 %), sans rien écrire.
L'écriture dans la page passe par scripts/payloads.py.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = json.loads((ROOT / "donnees" / "donnees-jeu.json").read_text(encoding="utf-8"))
R, B, ITEMS, RES = REF["recettes"], REF["batiments"], REF["items"], set(REF["ressources"])

# eau des centrales, en m³/min pour une centrale à 100 % (charbon : 45 ; nucléaire : 240)
EAU = {"Coal-Powered Generator": 45, "Nuclear Power Plant": 240}

# filières comparées : id, ressource primaire, combustible, générateur, recettes imposées (item → nom de recette)
HOR = {"Heavy Oil Residue": "Alternate: Heavy Oil Residue"}
DILUE = dict(HOR, **{"Fuel": "Alternate: Diluted Fuel"})
# le turbocarburant « de base » est une recherche du MAM, rangée parmi les alternatives : imposé explicitement
TURBO = dict(DILUE, **{"Turbofuel": "Turbofuel"})
CHAINES = [
    ("charbon", "Coal", "Coal", "Coal-Powered Generator", {}),
    ("charbon-compacte", "Coal", "Compacted Coal", "Coal-Powered Generator", {}),
    ("carburant", "Crude Oil", "Fuel", "Fuel-Powered Generator", {"Fuel": "Fuel"}),
    ("residuel", "Crude Oil", "Fuel", "Fuel-Powered Generator", dict(HOR, **{"Fuel": "Residual Fuel"})),
    ("dilue", "Crude Oil", "Fuel", "Fuel-Powered Generator", DILUE),
    ("turbo", "Crude Oil", "Turbofuel", "Fuel-Powered Generator", TURBO),
    ("turbo-lourd", "Crude Oil", "Turbofuel", "Fuel-Powered Generator", dict(HOR, **{"Turbofuel": "Alternate: Turbo Heavy Fuel"})),
    ("turbo-melange", "Crude Oil", "Turbofuel", "Fuel-Powered Generator",
     dict(DILUE, **{"Turbofuel": "Alternate: Turbo Blend Fuel", "Petroleum Coke": "Petroleum Coke"})),
    ("roquette", "Crude Oil", "Rocket Fuel", "Fuel-Powered Generator", TURBO),
    ("roquette-nitro", "Crude Oil", "Rocket Fuel", "Fuel-Powered Generator", dict(DILUE, **{"Rocket Fuel": "Alternate: Nitro Rocket Fuel"})),
    ("ionise", "Crude Oil", "Ionized Fuel", "Fuel-Powered Generator", dict(DILUE, **{"Rocket Fuel": "Alternate: Nitro Rocket Fuel"})),
    ("uranium", "Uranium", "Uranium Fuel Rod", "Nuclear Power Plant", {}),
]
# entrées qui ne viennent pas d'un nœud (comptées à part, sans coût d'extraction)
HORS_NOEUD = {"Power Shard"}


def mw_recette(r):
    return (r["mwMin"] + r["mwMax"]) / 2 if "mwMin" in r else B[r["machine"]]["mw"]


def defaut(item):
    """Recette de base dont l'item est le produit principal (hors conditionneuse, convertisseur, établi seul)."""
    c = [n for n, r in R.items() if r["produits"][0][0] == item and r["machine"] in B
         and r["machine"] not in ("Packager", "Converter")]
    base = [n for n in c if not R[n]["alternative"]]
    c = sorted(base or c, key=lambda n: (R[n]["palier"] if R[n]["palier"] is not None else 99, n))
    if not c:
        raise SystemExit(f"energie.py : aucune recette pour {item}")
    return c[0]


def resoudre(carburant, imposees):
    """Débit de chaque recette (cycles/min) pour 1 combustible/min ; ressources brutes, entrées hors nœud, surplus."""
    choix = {}
    def recette(item):
        if item not in choix:
            choix[item] = imposees.get(item) or defaut(item)
        return choix[item]
    x = {}
    for _ in range(500):
        besoin = {carburant: 1.0}
        for n, v in x.items():
            for i, q in R[n]["ingredients"]:
                besoin[i] = besoin.get(i, 0) + q * v
            for i, q in R[n]["produits"]:
                if choix.get(i) != n:   # coproduit : couvre d'abord les besoins de la chaîne
                    besoin[i] = besoin.get(i, 0) - q * v
        nx = {}
        for i, q in besoin.items():
            if i in RES or i in HORS_NOEUD or q <= 0:
                continue
            n = recette(i)
            sortie = sum(qq for ii, qq in R[n]["produits"] if ii == i)
            nx[n] = nx.get(n, 0) + q / sortie
        if all(abs(nx.get(k, 0) - x.get(k, 0)) < 1e-12 for k in set(nx) | set(x)):
            break
        x = nx
    brut, hors, surplus = {}, {}, {}
    for i, q in besoin.items():
        if i in RES and q > 1e-12:
            brut[i] = q
        elif i in HORS_NOEUD and q > 1e-12:
            hors[i] = q
        elif q < -1e-9:
            surplus[i] = -q
    mw = sum(v * R[n]["temps"] / 60 * mw_recette(R[n]) for n, v in x.items())
    return x, brut, hors, surplus, mw, choix.get(carburant)


def palier_recette(n):
    return R[n]["palier"] or 0


def chaine(id_, primaire, carburant, generateur, imposees):
    x, brut, hors, surplus, mw, principale = resoudre(carburant, imposees)
    if primaire not in brut:
        raise SystemExit(f"energie.py : {id_} ne consomme pas de {primaire}")
    k = 1 / brut[primaire]   # combustible/min par unité/min de ressource primaire
    g = B[generateur]
    nrj = ITEMS[carburant]["energie"]   # MJ par item, ou par m³
    brut_mw = k * nrj / 60
    gens = brut_mw / g["production"]
    sec = {i: q * k for i, q in brut.items() if i != primaire}
    if generateur in EAU:
        sec["Water"] = sec.get("Water", 0) + gens * EAU[generateur]
    recettes = sorted(R[n]["classe"] for n in x)
    palier = max([palier_recette(n) for n in x] + [g["palier"] or 0])
    alternatives = sorted(R[n]["classe"] for n in x if R[n]["alternative"])
    return {"id": id_, "res": primaire, "fuel": carburant, "gen": generateur,
            "brut": brut_mw, "proc": mw * k, "gens": gens, "sec": sec,
            "hors": {i: q * k for i, q in hors.items()},
            "surplus": {i: q * k for i, q in surplus.items() if i != carburant},
            "rec": recettes, "alt": alternatives, "t": palier,
            "principale": principale,   # recette qui produit le combustible (aucune pour le charbon brûlé tel quel)
            "etapes": [n for n in sorted(x, key=lambda n: -palier_recette(n)) if n != principale]}


def coefficients():
    return [chaine(*c) for c in CHAINES]


if __name__ == "__main__":
    # aperçu : palier 9, nœud normal à 100 %, Foreuse Mk.3 (45 MW / 240) ou extracteur de pétrole (40 MW / 120)
    EXTR = {"Water": 20 / 120, "Crude Oil": 40 / 120, "Nitrogen Gas": 0.5}
    cout = lambda i: EXTR.get(i, 45 / 240)
    for c in coefficients():
        base, mwx = (120, 40) if c["res"] == "Crude Oil" else (240, 45)
        net = base * (c["brut"] - c["proc"] - sum(q * cout(i) for i, q in c["sec"].items())) - mwx
        print(f"{c['id']:18} palier {c['t']}  brut {base * c['brut']:8.1f}  machines {base * c['proc']:7.1f}  "
              f"net {net:8.1f} MW  générateurs {base * c['gens']:5.2f}  secondaires "
              + ", ".join(f"{i} {base * q:.1f}" for i, q in c["sec"].items())
              + (f"  hors nœud {c['hors']}" if c["hors"] else ""))
