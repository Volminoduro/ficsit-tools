#!/usr/bin/env python3
"""Rapport des changements entre deux versions du référentiel de jeu (donnees/donnees-jeu.json), après un patch.

Compare items, recettes, bâtiments et disques durs : ajoutés, retirés, modifiés (champ par champ), puis liste les
nouveaux noms sans traduction française dans commun/glossaire.json (à compléter à la main, en reprenant la localisation
du jeu). Écrit le rapport en Markdown sur la sortie standard, et dans un fichier si on le demande.

Usage : python3 scripts/diff_donnees.py ANCIEN.json NOUVEAU.json [--sortie donnees/derniere-maj.md]
Code de retour : 0 dans tous les cas (un rapport vide est une bonne nouvelle).
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
# champs comparés par section (les autres sont dérivés et suivent)
CHAMPS = {
    "items": ["points", "pile", "liquide", "energie"],
    "recettes": ["classe", "machine", "temps", "ingredients", "produits", "alternative", "palier", "atelier", "mwMin", "mwMax"],
    "batiments": ["classe", "groupe", "mw", "exposant", "palier"],
    "disquesDurs": ["nom", "recettes"],
}
TITRES = {"items": "Items", "recettes": "Recettes", "batiments": "Bâtiments", "disquesDurs": "Disques durs (schémas)"}


def court(v):
    s = json.dumps(v, ensure_ascii=False)
    return s if len(s) <= 90 else s[:87] + "…"


def rapport(a, b):
    lignes, total = [], 0
    for sec, champs in CHAMPS.items():
        A, B = a.get(sec, {}), b.get(sec, {})
        plus = sorted(set(B) - set(A)); moins = sorted(set(A) - set(B))
        modif = []
        for k in sorted(set(A) & set(B)):
            d = [(c, A[k].get(c), B[k].get(c)) for c in champs if A[k].get(c) != B[k].get(c)]
            if d:
                modif.append((k, d))
        n = len(plus) + len(moins) + len(modif)
        total += n
        lignes.append(f"## {TITRES[sec]} — {n} changement(s)")
        lignes += [f"- ajouté : **{k}**" for k in plus]
        lignes += [f"- retiré : ~~{k}~~" for k in moins]
        for k, d in modif:
            lignes.append(f"- modifié : **{k}** — " + " ; ".join(f"{c} : {court(x)} → {court(y)}" for c, x, y in d))
        lignes.append("")
    # noms sans traduction française (le glossaire suit les noms anglais du référentiel)
    glo = json.loads((ROOT / "commun" / "glossaire.json").read_text(encoding="utf-8"))
    sans = {sec: sorted(n for n in b.get(sec, {}) if n not in glo.get(sec, {}) and not n.startswith("Alternate: "))
            for sec in ("items", "recettes", "batiments")}
    sans["recettes"] = [n for n in sans["recettes"] if n not in b.get("items", {})]   # recette = nom de l'item : déjà traduit
    # seuls les noms apparus avec cette mise à jour sont listés : les anciens manques sont voulus (équipement, etc.)
    neufs = {sec: [n for n in noms if n not in a.get(sec, {})] for sec, noms in sans.items()}
    nb, vieux = sum(len(v) for v in neufs.values()), sum(len(v) for v in sans.values()) - sum(len(v) for v in neufs.values())
    lignes.append(f"## Glossaire — {nb} nouveau(x) nom(s) sans traduction française"
                  + (f" ({vieux} ancien(s) non traduits, laissés tels quels)" if vieux else ""))
    for sec, noms in neufs.items():
        if noms:
            lignes.append(f"- {TITRES[sec]} : " + ", ".join(noms))
    lignes.append("")
    tete = [f"# Mise à jour des données du jeu : {total} changement(s)", ""]
    if not total:
        tete.append("Aucun changement dans le référentiel.\n")
    return "\n".join(tete + lignes)


if __name__ == "__main__":
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    if len(args) < 2:
        sys.exit(__doc__)
    a, b = (json.loads(pathlib.Path(x).read_text(encoding="utf-8")) for x in args[:2])
    r = rapport(a, b)
    print(r)
    if "--sortie" in sys.argv:
        pathlib.Path(sys.argv[sys.argv.index("--sortie") + 1]).write_text(r, encoding="utf-8")
