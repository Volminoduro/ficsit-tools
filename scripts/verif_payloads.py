#!/usr/bin/env python3
"""Compare ce que chaque outil embarque avec le référentiel donnees/donnees-jeu.json.

Tant que les payloads ne sont pas dérivés du référentiel (étape 2), ce script sert de filet :
il liste ce qui diverge, outil par outil, sans rien modifier. Sortie vide = les outils sont alignés.
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


def ligne(outil, sujet, detail):
    print(f"{outil:14} {sujet:22} {detail}")


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


def broyeur():
    P = payload("broyeur-excedents.html")
    # Un fluide vaut 0 point pour le broyeur : il n'est broyable qu'une fois conditionné.
    pts = [(x["n"], x["sp"], ITEMS[x["n"]]["points"]) for x in P["src"]
           if x["n"] in ITEMS and not ITEMS[x["n"]]["liquide"] and ITEMS[x["n"]]["points"] != x["sp"]]
    paliers = []
    for t in P["tgt"]:
        ref = R.get(nom_recette(t["rec"].replace("Alternate: ", ""), t["rec"].startswith("Alternate: ")))
        if ref and ref["palier"] != t["t"]:
            paliers.append((t["rec"], t["t"], ref["palier"]))
    ligne("broyeur", "points de broyage", f"{len(pts)} divergents : {pts[:5]}")
    # Le `t` du broyeur porte sur toute la chaîne de production, pas sur la recette cible : il ne
    # sera comparable qu'une fois l'optimiseur du broyeur redérivé du référentiel (voir README).
    ligne("broyeur", "paliers (à arbitrer)", f"{len(paliers)} : {paliers[:5]}")


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
    infographie(); broyeur(); horloge(); icones()
