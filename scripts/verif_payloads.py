#!/usr/bin/env python3
"""Compare ce que chaque outil embarque avec le référentiel donnees/donnees-jeu.json.

Filet de sécurité : liste, outil par outil, ce qui diverge, sans rien modifier. Chaque ligne commence
par un nombre d'écarts ; tous à 0 = les outils sont alignés. Code de sortie 1 dès qu'un écart existe
(utilisé par la CI, .github/workflows/verif.yml).
Usage : python3 scripts/verif_payloads.py   (depuis la racine du dépôt)
"""
import json, re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = json.loads((ROOT / "donnees" / "donnees-jeu.json").read_text(encoding="utf-8"))
R, ITEMS, BAT = REF["recettes"], REF["items"], REF["batiments"]


def payload(fichier, ident="payload"):
    s = (ROOT / fichier).read_text(encoding="utf-8")
    m = re.search(r'<script id="%s" type="application/json">(.*?)</script>' % ident, s, re.S)
    return json.loads(m.group(1)) if m else None


def nom_recette(n, alternative):
    """Les payloads stockent les alternatives sans le préfixe « Alternate: »."""
    if alternative or n not in R:
        return "Alternate: " + n if "Alternate: " + n in R else n
    return n


ECARTS = []


def ligne(outil, sujet, detail):
    print(f"{outil:14} {sujet:22} {detail}")
    if int(detail.split()[0]):
        ECARTS.append(f"{outil} : {sujet}")


def infographie():
    P = payload("satisfactory_infographie.html")
    inconnues, paliers, puissances = [], [], []
    for r in P["d"]:
        n = nom_recette(r["n"], r["a"])
        ref = R.get(n)
        if not ref:
            inconnues.append(r["n"])
            continue
        if ref["palier"] != r["t"]:
            paliers.append((r["n"], r["t"], ref["palier"]))
        b = BAT.get(r["m"])
        if b and ref.get("mwMin") is None and b["mw"] != r["w"]:
            puissances.append((r["n"], r["w"], b["mw"]))
    ligne("infographie", "recettes inconnues", f"{len(inconnues)} : {', '.join(inconnues[:5])}")
    ligne("infographie", "paliers divergents", f"{len(paliers)} : {paliers[:5]}")
    ligne("infographie", "puissances divergentes", f"{len(puissances)} : {puissances[:5]}")
    # Mode Espace : emprises au sol dérivées de donnees/emprises.json (réécrites par payloads.py).
    E = json.loads((ROOT / "donnees" / "emprises.json").read_text(encoding="utf-8"))
    em = {n: round(b["l"] * b["L"], 2) for n, b in E["batiments"].items()}
    sans = sorted({r["m"] for r in P["d"]} - set(em))
    ecart = sorted(n for n in em if P.get("em", {}).get(n) != em[n]) + (["oc"] if P.get("oc") != E["surcadencage"] else [])
    ligne("infographie", "emprises (mode Espace)", f"{len(sans) + len(ecart)} : {(sans + ecart)[:5]}")


def broyeur():
    P = payload("broyeur-excedents.html")
    # Un fluide vaut 0 point pour le broyeur : il n'est broyable qu'une fois conditionné.
    pts = [(x["n"], x["sp"], ITEMS[x["n"]]["points"]) for x in P["src"]
           if x["n"] in ITEMS and not ITEMS[x["n"]]["liquide"] and ITEMS[x["n"]]["points"] != x["sp"]]
    sys.path.insert(0, str(ROOT / "scripts"))
    import broyeur
    calc = {t["n"]: t for t in broyeur.calcul()["tgt"]}
    ecarts = [t["n"] for t in P["tgt"] if calc.get(t["n"]) != t] + [n for n in calc if n not in {t["n"] for t in P["tgt"]}]
    ligne("broyeur", "points de broyage", f"{len(pts)} divergents : {pts[:5]}")
    # Le payload entier (paliers compris) est dérivé par scripts/broyeur.py : tout écart = page à régénérer.
    ligne("broyeur", "cibles non dérivées", f"{len(ecarts)} : {ecarts[:5]}")


def arbre():
    P = payload("arbre-production.html")
    sys.path.insert(0, str(ROOT / "scripts"))
    import arbre as A
    calc = {x["n"]: x for x in A.calcul()["items"]}
    page = {x["n"]: x for x in P["items"]}
    ecarts = sorted(n for n in set(calc) | set(page) if calc.get(n) != page.get(n))
    # Tout le payload est dérivé par scripts/arbre.py : tout écart = page à régénérer (payloads.py).
    ligne("arbre", "items non dérivés", f"{len(ecarts)} : {ecarts[:5]}")


def horloge():
    s = (ROOT / "ficsit_horloge.html").read_text(encoding="utf-8")
    D = json.loads(re.search(r"const DATA = (\{.*?\});\n", s, re.S).group(1))
    ec = [(b["name"], b["mw"], BAT[b["name"]]["mw"]) for b in D["buildings"]
          if b["name"] in BAT and BAT[b["name"]]["mw"] not in (0, b["mw"])]
    abs_ = [b["name"] for b in D["buildings"] if b["name"] not in BAT]
    ligne("horloge", "puissances divergentes", f"{len(ec)} : {ec[:5]}")
    ligne("horloge", "bâtiments inconnus", f"{len(abs_)} : {abs_}")


def icones():
    ico = {p.stem for p in (ROOT / "donnees" / "icones").glob("*.webp")}
    manque = {v["slug"] for v in ITEMS.values()} - ico - {"power"}  # « power » n'est pas un vrai item
    ligne("icônes", "items sans icône", f"{len(manque)} : {sorted(manque)[:5]}")


if __name__ == "__main__":
    if not R:
        sys.exit("référentiel vide : lancer scripts/donnees.py")
    infographie(); broyeur(); arbre(); horloge(); icones()
    if ECARTS:
        sys.exit(f"{len(ECARTS)} contrôle(s) en échec : {', '.join(ECARTS)}")
