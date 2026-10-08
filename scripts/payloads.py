#!/usr/bin/env python3
"""Réécrit dans chaque page ce qui est dérivable du référentiel donnees/donnees-jeu.json.

Aujourd'hui : les icônes (une seule source, donnees/icones/, ré-échantillonnée à la taille de chaque
page), les paliers de recettes de l'infographie, tout le payload du broyeur (scripts/broyeur.py) et
celui de l'arbre de production (scripts/arbre.py) et celui
du planificateur (planner.html). Les combinaisons de l'infographie (clés tc, combi et
combiM) sont calculées par scripts/paliers_combinaisons.js et ne sont pas touchées ici.

Usage : python3 scripts/payloads.py [--verifier]   (depuis la racine du dépôt)
  --verifier : ne récrit rien, signale seulement ce qui changerait (utile en revue).
Dépendances : Pillow.
Après un passage qui modifie les paliers : relancer
  node scripts/paliers_combinaisons.js satisfactory_infographie.html --ecrire
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


ICO44 = ROOT / "commun" / "icones-44"
_ico44 = set()


def icone_fichier(nom):
    """Icône 44 px partagée par l'infographie, le broyeur et l'arbre : un fichier commun/icones-44/<slug>.webp
    (mis en cache une fois pour les trois outils) ; renvoie le slug, que la page référence."""
    slug = SLUGS[nom]
    f = ICO44 / f"{slug}.webp"
    data = base64.b64decode(icone(nom, 44))
    if not VERIF and (not f.exists() or f.read_bytes() != data):
        ICO44.mkdir(exist_ok=True)
        f.write_bytes(data)
    _ico44.add(f.name)
    return slug


def payload_depot():
    """Débit vers le Dimensional Depot (depot-dimensionnel.html) : noms du jeu pour lire le graphe tiré d'une
    sauvegarde — items (slug → nom, taille de pile, slugs dotés d'une icône), recettes (classe → nom, durée, entrées et
    sorties, fluides compris, MW moyens des recettes à puissance variable), bâtiments (classe Build_… → nom, MW consommés ou
    produits), fluides, énergie des combustibles, pureté des nœuds, geysers et puits de la carte (donnees/noeuds-ressources.json) — et
    icône partagée de chaque item (commun/icones-44/)."""
    p = ROOT / "depot-dimensionnel.html"
    s = avant = p.read_text(encoding="utf-8")
    m, _ = bloc_json(s, "payload")
    items, ic = {}, []
    for nom, it in sorted(REF["items"].items()):
        items[it["slug"]] = nom
        if (ICO / f"{it['slug']}.webp").exists():   # quelques items du référentiel n'ont pas d'icône source
            ic.append(icone_fichier(nom))
    it = REF["items"]
    flux = lambda l: [[it[n]["slug"], q] for n, q in l if n in it]   # fluides compris (m³), ils passent par les tuyaux
    noeuds = json.loads((ROOT / "donnees" / "noeuds-ressources.json").read_text(encoding="utf-8"))["noeuds"]
    neuf = {"items": items, "ic": ic,
            "pile": {v["slug"]: v["pile"] for n, v in sorted(it.items()) if not v["liquide"]},
            "liq": [v["slug"] for n, v in sorted(it.items()) if v["liquide"]],
            "rec": {r["classe"]: [n, r["temps"], flux(r["ingredients"]), flux(r["produits"])]
                    + ([(r["mwMin"] + r["mwMax"]) / 2] if r.get("mwMax") else []) for n, r in sorted(REF["recettes"].items())},
            # électricité : bâtiment Build_… → [MW consommés à 100 %, exposant de la cadence, MW produits]
            "pw": {"Build_" + b["classe"][5:]: [b["mw"], b["exposant"], b.get("production", 0)]
                   for n, b in sorted(REF["batiments"].items()) if b["classe"].startswith("Desc_") and (b["mw"] or b.get("production"))},
            # énergie des combustibles (MJ par item, par m³ pour un fluide)
            "nrj": {v["slug"]: v["energie"] for n, v in sorted(it.items()) if v["energie"]},
            "noeuds": {k: [v[0].lower().replace("_", "-"), v[1]] for k, v in sorted(noeuds.items())
                       if v[2] in ("BP_ResourceNode_C", "BP_ResourceNodeGeyser_C", "BP_FrackingSatellite_C")},
            "bat": {"Build_" + b["classe"][5:]: n for n, b in sorted(REF["batiments"].items()) if b["classe"].startswith("Desc_")}}
    s = s[:m.start(2)] + json.dumps(neuf, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"depot-dimensionnel.html : {len(items)} items ({len(ic)} icônes partagées), {len(neuf['rec'])} recettes, {len(neuf['bat'])} bâtiments")


def payload_energie():
    """Rentabilité énergétique par nœud (energie-noeuds.html) : coefficients de chaque filière (scripts/energie.py),
    extraction (foreuses, extracteur de pétrole, eau, azote), plafonds des convoyeurs et tuyaux, géothermie, et
    recette de construction de chaque bâtiment requis (pour la partie importée, dont la liste les contient)."""
    sys.path.insert(0, str(ROOT / "scripts"))
    import energie
    p = ROOT / "energie-noeuds.html"
    s = avant = p.read_text(encoding="utf-8")
    m, _ = bloc_json(s, "payload")
    B = REF["batiments"]
    construction = lambda nom: "Recipe_" + B[nom]["classe"][5:]
    ch, ic = [], set()
    for c in energie.coefficients():
        machines = sorted({REF["recettes"][n]["machine"] for n in c["etapes"]} | {c["gen"]})
        ch.append({"id": c["id"], "res": c["res"], "fuel": c["fuel"], "gen": c["gen"],
                   "brut": round(c["brut"], 6), "proc": round(c["proc"], 6), "gens": round(c["gens"], 6),
                   "sec": {k: round(v, 6) for k, v in c["sec"].items()}, "hors": {k: round(v, 6) for k, v in c["hors"].items()},
                   "surplus": {k: round(v, 6) for k, v in c["surplus"].items()},
                   "rec": c["rec"], "alt": c["alt"], "bat": [construction(b) for b in machines], "t": c["t"],
                   "principale": c["principale"], "etapes": c["etapes"]})
        ic |= {c["res"], c["fuel"], c["gen"], *c["sec"], *c["hors"], *c["surplus"]}
    mineur = lambda k, base: [base, B[f"Miner Mk.{k}"]["mw"], B[f"Miner Mk.{k}"]["palier"], construction(f"Miner Mk.{k}")]
    neuf = {"ch": ch,
            # extraction : [débit à 100 % sur nœud normal, MW, palier, recette de construction]
            "mineurs": [mineur(1, 60), mineur(2, 120), mineur(3, 240)],
            "petrole": [120, B["Oil Extractor"]["mw"], B["Oil Extractor"]["palier"], construction("Oil Extractor")],
            "eau": [120, B["Water Extractor"]["mw"]], "azote": 0.5, "exp": B["Miner Mk.1"]["exposant"],
            # convoyeurs : [plafond /min, palier, recette] ; tuyaux Mk.1 (palier 3) et Mk.2 (palier 6), absents de la source
            "conv": [[cap, B[f"Conveyor Belt Mk.{k}"]["palier"], construction(f"Conveyor Belt Mk.{k}")]
                     for k, cap in enumerate([60, 120, 270, 480, 780, 1200], 1)],
            "tuy": [[300, 3, "Recipe_Pipeline_C"], [600, 6, "Recipe_PipelineMK2_C"]],
            # géothermie : puissance moyenne par pureté du geyser (elle oscille autour de cette valeur), pas de cadence
            "geo": {"mw": [100, 200, 400], "bat": construction("Geothermal Generator")},
            # nom → icône partagée (commun/icones-44/<slug>.webp) ; noms des recettes et bâtiments par classe
            "ic": {n: icone_fichier(n) for n in sorted(ic | {"Geothermal Generator"}) if n in SLUGS},
            "noms": {}}
    tous = {**{r["classe"]: n for n, r in REF["recettes"].items()},
            **{construction(n): n for n, b in B.items() if b["classe"].startswith("Desc_")}}
    utiles = {x for c in ch for x in c["rec"] + c["bat"]} | {m[3] for m in neuf["mineurs"]} | {neuf["petrole"][3]}
    neuf["noms"] = {k: tous[k] for k in sorted(utiles) if k in tous}
    s = s[:m.start(2)] + json.dumps(neuf, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"energie-noeuds.html : {len(ch)} filières")


def page_icones_partagees(fichier, ident, cle=None):
    """Remplace un dictionnaire d'icônes nom → base64 ou slug par nom → slug (fichiers partagés, icone_fichier)."""
    p = ROOT / fichier
    s = avant = p.read_text(encoding="utf-8")
    m, tout = bloc_json(s, ident)
    d = tout[cle] if cle else tout
    neuf = {nom: icone_fichier(nom) for nom in d if nom in SLUGS}
    if cle:
        tout[cle] = neuf
    s = s[:m.start(2)] + json.dumps(tout if cle else neuf, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"{fichier} : {len(neuf)} icônes partagées (commun/icones-44/)")


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


# Horloge : bâtiments proposés, dans l'ordre d'affichage (clé de la page, nom dans le référentiel).
HORLOGE = [("smelter", "Smelter"), ("constructor", "Constructor"), ("packager", "Packager"),
           ("assembler", "Assembler"), ("foundry", "Foundry"), ("refinery", "Refinery"),
           ("manufacturer", "Manufacturer"), ("blender", "Blender"), ("converter", "Converter"),
           ("accelerator", "Particle Accelerator"), ("encoder", "Quantum Encoder"),
           ("miner1", "Miner Mk.1"), ("miner2", "Miner Mk.2"), ("miner3", "Miner Mk.3"),
           ("water", "Water Extractor"), ("oil", "Oil Extractor"), ("well", "Resource Well Pressurizer"),
           ("biomass", "Biomass Burner"), ("coalgen", "Coal-Powered Generator"),
           ("fuelgen", "Fuel-Powered Generator"), ("nuclear", "Nuclear Power Plant")]
GROUPE_HORLOGE = {"production": "prod", "extraction": "extr", "generation": "gen"}


def donnees_horloge():
    """Bâtiments de l'horloge, sans icônes, tout depuis le référentiel : puissance à 100 % (consommée, ou produite
    pour un générateur) ; machine à puissance variable : médiane des puissances moyennes de ses recettes, avec la
    plage min – max de ses recettes."""
    B, R = REF["batiments"], REF["recettes"]
    ent = lambda v: int(v) if v == int(v) else v
    out = []
    for key, nom in HORLOGE:
        b = B[nom]
        x = {"key": key, "name": nom, "group": GROUPE_HORLOGE[b["groupe"]]}
        if b["groupe"] == "generation":
            x["mw"] = ent(b["production"])
        elif b["mw"]:
            x["mw"] = ent(b["mw"])
        else:
            rs = [r for r in R.values() if r["machine"] == nom and r.get("mwMin") is not None]
            moy = sorted((r["mwMin"] + r["mwMax"]) / 2 for r in rs)
            n = len(moy)
            x["mw"] = ent(moy[n // 2] if n % 2 else (moy[n // 2 - 1] + moy[n // 2]) / 2)
            x["min"], x["max"] = ent(min(r["mwMin"] for r in rs)), ent(max(r["mwMax"] for r in rs))
        out.append(x)
    return out


def horloge():
    """Données de l'horloge (const DATA) : bâtiments dérivés du référentiel (donnees_horloge) et icônes à 96 px."""
    p = ROOT / "ficsit_horloge.html"
    s = avant = p.read_text(encoding="utf-8")
    m = re.search(r"(const DATA = )(\{.*?\})(;\n)", s, re.S)
    D = json.loads(m.group(2))
    D["buildings"] = [dict(b, icon=icone(b["name"], 96)) for b in donnees_horloge()]
    s = s[:m.start(2)] + json.dumps(D, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"ficsit_horloge.html : {len(D['buildings'])} bâtiments dérivés du référentiel, icônes à 96 px")


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
        r["k"] = ref["classe"]   # classe du jeu : retrouve la recette dans une sauvegarde (« ma partie »)
    s = s[:m.start(2)] + json.dumps(P, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"satisfactory_infographie.html : {len(chg)} paliers alignés sur le référentiel")
    for n, a, b in sorted(chg, key=lambda x: (x[2] - x[1], x[0])):
        print(f"    {n:34} {a} → {b}")


def emprises_infographie():
    """Mode « Espace » de l'infographie : emprises au sol (donnees/emprises.json) → payload.
    em : m² par machine ; ex : m² par unité/min extraite, à 250 % ; oc : facteur de surcadençage ;
    xb : bâtiment d'extraction de chaque ressource, b (nom), d (débit à 250 %), a (emprise) — pour l'azote,
    agrégé sur tous les puits du monde, b et n listent pressuriseurs et extracteurs."""
    E = json.loads((ROOT / "donnees" / "emprises.json").read_text(encoding="utf-8"))
    oc = E["surcadencage"]
    em = {n: round(b["l"] * b["L"], 2) for n, b in E["batiments"].items()}
    ex, xb = {}, {}
    for res in REF["ressources"]:
        x = E["extraction"].get(res) or (None if REF["items"][res]["liquide"] else E["extraction"]["solide"])
        if not x:
            print(f"  ressource sans emprise d'extraction : {res}")
            continue
        aire = x["aire"] if "aire" in x else x["l"] * x["L"]   # « aire » : emprise totale déjà agrégée (azote)
        ex[res] = round(aire / (x["debit"] * oc), 6)
        ent = lambda v: int(v) if v == int(v) else v   # 600.0 → 600 : même écriture que JSON.stringify
        if "aire" in x:
            xb[res] = {"b": ["Resource Well Pressurizer", "Resource Well Extractor"],
                       "n": [x["pressuriseurs"], x["extracteurs"]], "d": ent(x["debit"] * oc), "a": ent(aire)}
        else:
            xb[res] = {"b": x["batiment"], "d": ent(x["debit"] * oc), "a": ent(round(aire, 2))}
    p = ROOT / "satisfactory_infographie.html"
    s = avant = p.read_text(encoding="utf-8")
    m, P = bloc_json(s, "payload")
    manque = sorted({r["m"] for r in P["d"]} - set(em))
    if manque:
        print(f"  machines sans emprise : {manque}")
    P["em"], P["ex"], P["oc"], P["xb"] = em, ex, oc, xb
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
    neuf["ic"] = {x["n"]: icone_fichier(x["n"]) for x in neuf["items"] if x["n"] in SLUGS}
    s = s[:m.start(2)] + json.dumps(neuf, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"arbre-production.html : {len(neuf['items'])} items, {len(neuf['ic'])} icônes partagées")


# emplacements de Somersloop par machine (absents de la source ; mêmes valeurs que depot-dimensionnel-flux.js)
SOMERSLOOPS = {"Smelter": 1, "Constructor": 1, "Assembler": 2, "Foundry": 2, "Refinery": 2, "Converter": 2,
               "Manufacturer": 4, "Blender": 4, "Particle Accelerator": 4, "Quantum Encoder": 4}


def rarete():
    """Poids de chaque ressource brute pour l'optimisation du planificateur : ‰ de la capacité mondiale d'extraction
    par unité/min consommée. Capacité = somme des nœuds de la carte (donnees/noeuds-ressources.json) au mieux du jeu,
    surcadencés à 250 % : foreuse Mk.3 (240 /min sur nœud normal, plafonnée par le convoyeur Mk.6 à 1 200), extracteur
    de pétrole (120), puits (extracteur de puits, 60) ; pureté ×0,5 / ×1 / ×2. L'eau, illimitée, ne coûte rien."""
    N = json.loads((ROOT / "donnees" / "noeuds-ressources.json").read_text(encoding="utf-8"))["noeuds"]
    par_classe = {"Desc_" + v["slug"][5:-2].replace("-", "_") + "_C": n for n, v in REF["items"].items() if n in REF["ressources"]}
    par_classe = {k.lower(): n for k, n in par_classe.items()}
    pur = {"impure": .5, "normal": 1, "pure": 2}
    cap = {}
    for res, purete, noeud in N.values():
        nom = par_classe.get(res.lower())
        if not nom:
            continue
        base = {"BP_ResourceNode_C": 240, "BP_FrackingSatellite_C": 60}.get(noeud)
        if base is None:
            continue
        if nom == "Crude Oil" and noeud == "BP_ResourceNode_C":
            base = 120
        cap[nom] = cap.get(nom, 0) + min(1200, base * pur[purete] * 2.5)
    return {n: (0 if n == "Water" else round(1000 / cap[n], 6)) for n in sorted(REF["ressources"]) if n == "Water" or n in cap}


def emprises_machines(machines):
    E = json.loads((ROOT / "donnees" / "emprises.json").read_text(encoding="utf-8"))["batiments"]
    manque = [m for m in machines if m not in E]
    if manque:
        raise SystemExit(f"payloads.py : machines du planificateur sans emprise dans donnees/emprises.json : {manque}")
    return {m: round(E[m]["l"] * E[m]["L"], 2) for m in machines}


def planner_donnees():
    """Planificateur de production (planner.html) : recettes des bâtiments de production, machines et ressources brutes
    (format décrit en tête de planner-moteur.js) ; icônes à 44 px partagées."""
    B = REF["batiments"]
    rec = sorted((n, r) for n, r in REF["recettes"].items() if B.get(r["machine"], {}).get("groupe") == "production")
    mw = lambda r: round((r["mwMin"] + r["mwMax"]) / 2, 3) if r.get("mwMax", 0) > r.get("mwMin", 0) else 0
    machines = sorted({r["machine"] for _, r in rec})
    items = sorted({x[0] for _, r in rec for x in r["ingredients"] + r["produits"]} | set(REF["ressources"]))
    # extraction : [débit à 100 % sur nœud normal, MW, palier, recette de construction] ; exposant de la puissance en fonction de la cadence
    constr = lambda nom: "Recipe_" + B[nom]["classe"][5:]
    ext = lambda nom, base: [base, B[nom]["mw"], B[nom]["palier"], constr(nom)]
    EMP = json.loads((ROOT / "donnees" / "emprises.json").read_text(encoding="utf-8"))["extraction"]
    aire_ext = lambda k: round(EMP[k]["l"] * EMP[k]["L"], 2)
    extracteurs = ["Miner Mk.1", "Miner Mk.2", "Miner Mk.3", "Oil Extractor", "Water Extractor"]
    return {"r": [[r["classe"], n, int(r["alternative"]), r["palier"], r["machine"], r["temps"],
                   r["ingredients"], r["produits"], mw(r)] for n, r in rec],
            "b": {m: [B[m]["mw"], B[m]["exposant"], B[m]["palier"], "Build_" + B[m]["classe"][5:], SOMERSLOOPS.get(m, 0)]
                  for m in machines},
            "res": REF["ressources"],
            "rare": rarete(),
            # emprise au sol de chaque machine (m², donnees/emprises.json, comme le mode « Espace » de l'infographie)
            "em": emprises_machines(machines),
            "liq": [i for i in items if REF["items"].get(i, {}).get("liquide")],
            # points de l'Awesome Sink par item (solides seulement : le broyeur ne prend pas les fluides)
            "pts": {i: REF["items"][i]["points"] for i in items
                    if REF["items"].get(i, {}).get("points", 0) > 0 and not REF["items"][i].get("liquide")},
            # convoyeurs et tuyaux (montage) : [débit max /min, palier, recette de construction] ; tuyaux absents de la
            # source, comme pour energie-noeuds.html
            "conv": [[cap, B[f"Conveyor Belt Mk.{k}"]["palier"], "Recipe_" + B[f"Conveyor Belt Mk.{k}"]["classe"][5:]]
                     for k, cap in enumerate([60, 120, 270, 480, 780, 1200], 1)],
            "tuy": [[300, 3, "Recipe_Pipeline_C"], [600, 6, "Recipe_PipelineMK2_C"]],
            "ext": {"mineurs": [ext("Miner Mk.1", 60), ext("Miner Mk.2", 120), ext("Miner Mk.3", 240)],
                    "petrole": ext("Oil Extractor", 120), "eau": ext("Water Extractor", 120), "exp": B["Miner Mk.1"]["exposant"],
                    # emprise au sol d'un extracteur (m², donnees/emprises.json) : foreuses (toutes pareilles), pétrole, eau
                    "aire": {"solide": aire_ext("solide"), "Crude Oil": aire_ext("Crude Oil"), "Water": aire_ext("Water")}},
            "ic": {n: icone_fichier(n) for n in items + machines + extracteurs if n in SLUGS}}


def payload_planner():
    p = ROOT / "planner.html"
    s = avant = p.read_text(encoding="utf-8")
    m, _ = bloc_json(s, "payload")
    neuf = planner_donnees()
    s = s[:m.start(2)] + json.dumps(neuf, ensure_ascii=False, separators=(",", ":")) + s[m.end(2):]
    ecrire(p, s, avant)
    print(f"planner.html : {len(neuf['r'])} recettes, {len(neuf['b'])} machines, {len(neuf['ic'])} icônes partagées")


if __name__ == "__main__":
    paliers_infographie()
    emprises_infographie()
    payload_broyeur()
    payload_arbre()
    page_icones_partagees("satisfactory_infographie.html", "payload", cle="ic")
    page_icones_partagees("broyeur-excedents.html", "icons")
    horloge()
    memo()
    payload_depot()
    payload_energie()
    payload_planner()
    # icônes partagées que plus aucune page n'utilise
    if not VERIF and ICO44.exists():
        for f in ICO44.glob("*.webp"):
            if f.name not in _ico44:
                f.unlink()
