#!/usr/bin/env python3
"""Réécrit dans chaque page ce qui est dérivable du référentiel donnees/donnees-jeu.json.

Aujourd'hui : les icônes (une seule source, donnees/icones/, ré-échantillonnée à la taille de chaque
page), les paliers de recettes de l'infographie, tout le payload du broyeur (scripts/broyeur.py) et
celui de l'arbre de production (scripts/arbre.py). Les combinaisons de l'infographie (clés tc, combi et
combiM) sont calculées par scripts/paliers_combinaisons.js et ne sont pas touchées ici.

Usage : python3 scripts/payloads.py [--verifier]   (depuis la racine du dépôt)
  --verifier : ne récrit rien, signale seulement ce qui changerait (utile en revue).
Dépendances : Pillow.
Après un passage qui modifie les paliers : relancer
  node scripts/paliers_combinaisons.js satisfactory_infographie.html tout --ecrire
les combinaisons en dépendent.
"""
import base64, io, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = json.loads((ROOT / "donnees" / "donnees-jeu.json").read_text(encoding="utf-8"))
ICO = ROOT / "donnees" / "icones"
VERIF = "--verifier" in sys.argv

SLUGS = {**{n: v["slug"] for n, v in REF["items"].items()},
         **{n: v["slug"] for n, v in REF["batiments"].items()}}
_cache = {}


def icone(nom, taille):
    """Icône du référentiel, ré-échantillonnée et encodée en base64 pour une page donnée."""
    from PIL import Image
    cle = (nom, taille)
    if cle in _cache:
        return _cache[cle]
    src = ICO / f"{SLUGS[nom]}.webp"
    im = Image.open(src).convert("RGBA")
    if im.size != (taille, taille):
        im = im.resize((taille, taille), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=75, method=6)  # ré-encodage depuis une source déjà compressée : q75 suffit à 44-96 px
    return _cache.setdefault(cle, base64.b64encode(buf.getvalue()).decode())


def bloc_json(s, ident):
    m = re.search(r'(<script id="%s" type="application/json">)(.*?)(</script>)' % ident, s, re.S)
    return m, json.loads(m.group(2))


def ecrire(chemin, s, avant):
    if VERIF or s == avant:
        return
    chemin.write_text(s, encoding="utf-8")


def nom_recette(n, alternative):
    """Les payloads nomment les alternatives sans le préfixe « Alternate: »."""
    if alternative or n not in REF["recettes"]:
        return "Alternate: " + n if "Alternate: " + n in REF["recettes"] else n
    return n


def page_icones(fichier, ident, taille, cle=None):
    """Remplace un dictionnaire d'icônes nom → base64 par les icônes du référentiel.
    `cle` : clé du payload qui porte les icônes, si elles ne sont pas le payload entier."""
    p = ROOT / fichier
    s = avant = p.read_text(encoding="utf-8")
    m, tout = bloc_json(s, ident)
    d = tout[cle] if cle else tout
    neuf, poids = {}, 0
    for nom in d:
        if nom not in SLUGS:
            print(f"  {fichier} : {nom} absent du référentiel, icône conservée")
            neuf[nom] = d[nom]
            continue
        neuf[nom] = icone(nom, taille)
        poids += len(neuf[nom])
    if cle:
        tout[cle] = neuf
    s = s[:m.start(2)] + json.dumps(tout if cle else neuf, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"{fichier} : {len(neuf)} icônes à {taille} px "
          f"({sum(len(v) for v in d.values())//1024} → {poids//1024} Ko)")


def horloge():
    p = ROOT / "ficsit_horloge.html"
    s = avant = p.read_text(encoding="utf-8")
    m = re.search(r"(const DATA = )(\{.*?\})(;\n)", s, re.S)
    D = json.loads(m.group(2))
    av = sum(len(b["icon"]) for b in D["buildings"])
    for b in D["buildings"]:
        b["icon"] = icone(b["name"], 96)
    s = s[:m.start(2)] + json.dumps(D, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"ficsit_horloge.html : {len(D['buildings'])} icônes à 96 px "
          f"({av//1024} → {sum(len(b['icon']) for b in D['buildings'])//1024} Ko)")


def memo():
    """Le mémo porte ses icônes en classes CSS .it-<nom-en-kebab>."""
    p = ROOT / "memo-ficsit.html"
    s = avant = p.read_text(encoding="utf-8")
    par_slug = {re.sub(r"[^a-z0-9]+", "-", n.lower()).strip("-"): n for n in SLUGS}
    av = ap = 0
    inconnues = []

    def rempl(mo):
        nonlocal av, ap
        cls, b64 = mo.group(1), mo.group(2)
        av += len(b64)
        nom = par_slug.get(cls)
        if not nom:
            inconnues.append(cls)
            ap += len(b64)
            return mo.group(0)
        neuf = icone(nom, 48)
        ap += len(neuf)
        return f".it-{cls}{{background-image:url(data:image/webp;base64,{neuf})"

    s = re.sub(r"\.it-([a-z0-9-]+)\{background-image:url\(data:image/webp;base64,([A-Za-z0-9+/=]+)\)", rempl, s)
    ecrire(p, s, avant)
    print(f"memo-ficsit.html : icônes à 48 px ({av//1024} → {ap//1024} Ko)"
          + (f" — sans correspondance : {inconnues}" if inconnues else ""))


def paliers_infographie():
    p = ROOT / "satisfactory_infographie.html"
    s = avant = p.read_text(encoding="utf-8")
    m, P = bloc_json(s, "payload")
    chg = []
    for r in P["d"]:
        ref = REF["recettes"].get(nom_recette(r["n"], r["a"]))
        if not ref:
            print(f"  recette absente du référentiel : {r['n']}")
            continue
        if ref["palier"] != r["t"]:
            chg.append((r["n"], r["t"], ref["palier"]))
            r["t"] = ref["palier"]
        if ref["origine"] and ref["origine"] != r["s"]:
            r["s"] = ref["origine"]
    s = s[:m.start(2)] + json.dumps(P, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"satisfactory_infographie.html : {len(chg)} paliers alignés sur le référentiel")
    for n, a, b in sorted(chg, key=lambda x: (x[2] - x[1], x[0])):
        print(f"    {n:34} {a} → {b}")


def emprises_infographie():
    """Mode « Espace » de l'infographie : emprises au sol (donnees/emprises.json) → payload.
    em : m² par machine ; ex : m² par unité/min extraite, à 250 % ; oc : facteur de surcadençage."""
    E = json.loads((ROOT / "donnees" / "emprises.json").read_text(encoding="utf-8"))
    oc = E["surcadencage"]
    em = {n: round(b["l"] * b["L"], 2) for n, b in E["batiments"].items()}
    ex = {}
    for res in REF["ressources"]:
        x = E["extraction"].get(res) or (None if REF["items"][res]["liquide"] else E["extraction"]["solide"])
        if not x:
            print(f"  ressource sans emprise d'extraction : {res}")
            continue
        aire = x["aire"] if "aire" in x else x["l"] * x["L"]   # « aire » : emprise totale déjà agrégée (azote)
        ex[res] = round(aire / (x["debit"] * oc), 6)
    p = ROOT / "satisfactory_infographie.html"
    s = avant = p.read_text(encoding="utf-8")
    m, P = bloc_json(s, "payload")
    manque = sorted({r["m"] for r in P["d"]} - set(em))
    if manque:
        print(f"  machines sans emprise : {manque}")
    P["em"], P["ex"], P["oc"] = em, ex, oc
    s = s[:m.start(2)] + json.dumps(P, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"satisfactory_infographie.html : emprises de {len(em)} machines, {len(ex)} ressources (×{oc})")


def payload_broyeur():
    """Le payload du broyeur est entièrement calculé par son optimiseur, scripts/broyeur.py."""
    sys.path.insert(0, str(ROOT / "scripts"))
    import broyeur
    p = ROOT / "broyeur-excedents.html"
    s = avant = p.read_text(encoding="utf-8")
    m, P = bloc_json(s, "payload")
    neuf = broyeur.calcul()
    ancien = {t["n"]: t for t in P["tgt"]}
    chg = sum(1 for t in neuf["tgt"] if ancien.get(t["n"]) != t)
    s = s[:m.start(2)] + json.dumps(neuf, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"broyeur-excedents.html : {len(neuf['src'])} sources, {len(neuf['tgt'])} cibles, {chg} cibles modifiées")


def payload_arbre():
    """Le payload de l'arbre de production est calculé par scripts/arbre.py ; icônes à 44 px."""
    sys.path.insert(0, str(ROOT / "scripts"))
    import arbre
    p = ROOT / "arbre-production.html"
    s = avant = p.read_text(encoding="utf-8")
    m, _ = bloc_json(s, "payload")
    neuf = arbre.calcul()
    neuf["ic"] = {x["n"]: icone(x["n"], 44) for x in neuf["items"] if x["n"] in SLUGS}
    s = s[:m.start(2)] + json.dumps(neuf, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"arbre-production.html : {len(neuf['items'])} items, {len(neuf['ic'])} icônes à 44 px")


if __name__ == "__main__":
    paliers_infographie()
    emprises_infographie()
    payload_broyeur()
    payload_arbre()
    page_icones("satisfactory_infographie.html", "payload", 44, cle="ic")
    page_icones("broyeur-excedents.html", "icons", 44)
    horloge()
    memo()
