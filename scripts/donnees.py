#!/usr/bin/env python3
"""Régénère le référentiel de données de jeu commun à tous les outils.

Source : greeny/SatisfactoryTools, branche `dev` — `data/data.json` pour les items, recettes et
bâtiments, `www/assets/images/items/{slug}_256.png` pour les icônes.
Sorties :
  donnees/donnees-jeu.json   référentiel unique (items, bâtiments, recettes, paliers de déblocage)
  donnees/icones/<slug>.webp icônes normalisées (128 px, WebP), une seule copie par item
Les payloads des outils restent dérivés de ce référentiel : aucune page n'est modifiée ici.

Usage : python3 scripts/donnees.py [--sans-icones]   (depuis la racine du dépôt)
Dépendances : Pillow (icônes uniquement).
"""
import json, sys, pathlib, urllib.request, datetime, io

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "donnees"
ICO = OUT / "icones"
BASE = "https://raw.githubusercontent.com/greeny/SatisfactoryTools/dev"
DATA = BASE + "/data/data.json"
IMG = BASE + "/www/assets/images/items/{slug}_256.png"
TAILLE = 96  # côté des icônes normalisées : la plus grande taille utilisée par un outil (horloge)

# Type de schéma de déblocage → origine de la recette, telle que l'affichent les outils.
PALIER_MAM = 1     # jalon Field Research : le MAM, donc la recherche des disques durs
PALIER_DD_MIN = PALIER_MAM  # pas d'alternative de disque dur avant le MAM
ORIGINE = {"EST_Milestone": "jalon", "EST_Tutorial": "jalon", "EST_MAM": "mam",
           "EST_Alternate": "dd", "EST_ResourceSink": "boutique", "EST_Custom": "autre"}
# Groupes de bâtiments utilisés par les outils (le reste est ignoré : logistique, décor, véhicules…).
GROUPES = {
    "production": ["Desc_SmelterMk1_C", "Desc_FoundryMk1_C", "Desc_ConstructorMk1_C", "Desc_AssemblerMk1_C",
                   "Desc_ManufacturerMk1_C", "Desc_OilRefinery_C", "Desc_Packager_C", "Desc_Blender_C",
                   "Desc_HadronCollider_C", "Desc_QuantumEncoder_C", "Desc_Converter_C"],
    "extraction": ["Desc_MinerMk1_C", "Desc_MinerMk2_C", "Desc_MinerMk3_C", "Desc_WaterPump_C",
                   "Desc_OilPump_C", "Desc_FrackingSmasher_C", "Desc_FrackingExtractor_C"],
    "generation": ["Desc_GeneratorBiomass_Automated_C", "Desc_GeneratorCoal_C", "Desc_GeneratorFuel_C",
                   "Desc_GeneratorNuclear_C", "Desc_GeneratorGeoThermal_C"],
    "atelier": ["Desc_Workshop_C", "Desc_WorkBench_C"],
    # Convoyeurs : pas de recette associée, mais leurs icônes et paliers servent au mémo.
    "logistique": ["Desc_ConveyorBeltMk1_C", "Desc_ConveyorBeltMk2_C", "Desc_ConveyorBeltMk3_C",
                   "Desc_ConveyorBeltMk4_C", "Desc_ConveyorBeltMk5_C", "Desc_ConveyorBeltMk6_C"],
}


def charger():
    with urllib.request.urlopen(DATA) as r:
        return json.loads(r.read().decode("utf-8"))


def paliers(d):
    """Recette → (palier plancher de déblocage, origine).

    Le champ `tier` d'un schéma n'est exploitable que pour les jalons. Pour une alternative de disque
    dur, le palier vient de ses `requiredSchematics` — les dépendances que le jeu exige avant de
    proposer l'alternative au tirage : on remonte la chaîne et on retient le plus élevé.
    - Jalon : son palier.
    - Recherche du MAM : le plus petit palier de paliers-mam.json parmi les recettes qu'elle débloque
      (le nœud est franchi au plus tard quand la première l'est), et jamais avant le MAM lui-même
      (PALIER_MAM) ; ses propres prérequis comptent aussi.
    - Dépendance vers un schéma absent de la source (reliquat d'avant la 1.0, ex.
      Schematic_Alternate_EnrichedCoal_C) : on la rattache au schéma qui débloque aujourd'hui la même
      recette (Recipe_Alternate_EnrichedCoal_C → recherche Compacted Coal du MAM).
    Pour le MAM, la source ne donne rien d'utilisable (tier interne au MAM) : le plancher de ses
    recettes vient de donnees/paliers-mam.json. Plusieurs schémas pour une recette : le plus petit
    palier gagne, c'est le premier chemin de déblocage disponible."""
    S = d["schematics"]
    mam = json.loads((OUT / "paliers-mam.json").read_text(encoding="utf-8"))["paliers"]
    nom_recette = {r["className"]: r["name"] for r in d["recipes"].values()}
    par_recette = {}
    for sc in S.values():
        for rc in sc.get("unlock", {}).get("recipes", []):
            par_recette.setdefault(rc, sc["className"])

    def resoudre(req):
        if req in S:
            return S[req]
        if req.startswith("Schematic_") and req.endswith("_C"):
            alias = par_recette.get("Recipe_" + req[len("Schematic_"):])
            if alias:
                return S[alias]
        print(f"  prérequis introuvable dans la source : {req}", file=sys.stderr)
        return None

    def fermeture(sc, vus=None):
        vus = vus or set()
        if sc["className"] in vus:
            return 0
        vus.add(sc["className"])
        t = 0
        if sc["type"] in ("EST_Milestone", "EST_Tutorial"):
            t = int(sc.get("tier") or 0)
        elif sc["type"] == "EST_MAM":
            ts = [mam[nom_recette[rc]] for rc in sc["unlock"]["recipes"] if nom_recette.get(rc) in mam]
            t = max(PALIER_MAM, min(ts)) if ts else PALIER_MAM
        for req in sc["requiredSchematics"]:
            r = resoudre(req)
            if r:
                t = max(t, fermeture(r, vus))
        return t

    out, mamseul = {}, {}
    for sc in S.values():
        org = ORIGINE.get(sc["type"])
        if not org:
            continue
        for rc in sc.get("unlock", {}).get("recipes", []):
            if org == "mam":
                # Palier inconnu de la source : il vient de paliers-mam.json, pas d'ici.
                mamseul.setdefault(rc, True)
                continue
            t = fermeture(sc)
            if org == "dd":
                t = max(t, PALIER_DD_MIN)   # les disques durs ne tombent pas avant le MAM
            if rc not in out or t < out[rc][0]:
                out[rc] = (t, org)
    for rc in mamseul:
        out.setdefault(rc, (0, "mam"))
    return out


def paliers_machines(d):
    """Palier de déblocage de chaque bâtiment : plus petit jalon dont un déblocage le construit."""
    classes = {b["className"] for b in d["buildings"].values()}
    out = {}
    for sc in d["schematics"].values():
        if sc["type"] not in ("EST_Milestone", "EST_Tutorial"):
            continue
        t = int(sc.get("tier") or 0)
        for rc in sc["unlock"]["recipes"]:
            r = d["recipes"].get(rc)
            for prod in (r["products"] if r else []):
                if prod["item"] in classes:
                    out[prod["item"]] = min(out.get(prod["item"], 99), t)
    return out


# Ressources brutes : palier de la machine qui les extrait (les solides sortent dès la Foreuse Mk.1).
PALIER_RESSOURCE = {"Water": 3, "Crude Oil": 5, "Nitrogen Gas": 8}
# Sous-produits de générateurs : aucune recette ne les produit, ils arrivent avec la centrale.
PALIER_DECHET = {"Uranium Waste": 8, "Plutonium Waste": 8}


def palier_utilisable(ref):
    """Palier dérivé : premier palier où la recette est réellement exécutable — sa machine est
    débloquée et chacun de ses ingrédients est produisible par une recette elle-même exécutable.
    Point fixe, recalculé jusqu'à stabilité. C'est la définition commune aux outils : le `tier`
    de la source n'est pas exploitable (0 pour la plupart des alternatives de disque dur, 3 pour
    tout le MAM). Pour une alternative, c'est un minorant : il faut en plus avoir tiré le disque dur."""
    prod = {}
    for nom, r in ref["recettes"].items():
        for it, _ in r["produits"]:
            prod.setdefault(it, []).append(nom)
    brut = {it: PALIER_RESSOURCE.get(it, 0) for it in ref["ressources"]}
    # Tout item qu'aucune recette ne produit vient du monde : ramassage à la main, faune, générateur.
    for it in ref["items"]:
        if it not in prod:
            brut.setdefault(it, PALIER_DECHET.get(it, 0))
    item = dict(brut)
    rec = {}
    for _ in range(40):
        chg = False
        for nom, r in ref["recettes"].items():
            m = r["machine"]
            t = ref["batiments"][m]["palier"] if m and ref["batiments"][m]["palier"] is not None else 0
            # Un jalon donne un palier fiable : la recette n'est pas exécutable avant, même si tout existe.
            if r["palierPlancher"]:
                t = max(t, r["palierPlancher"])
            for it, _ in r["ingredients"]:
                if it not in item:
                    t = None
                    break
                t = max(t, item[it])
            if t is None:
                continue
            if rec.get(nom) != t and (nom not in rec or t < rec[nom]):
                rec[nom] = t
                chg = True
            for it, _ in r["produits"]:
                if it in brut:
                    continue
                if it not in item or rec[nom] < item[it]:
                    item[it] = rec[nom]
                    chg = True
        if not chg:
            break
    return rec


def referentiel(d):
    par_classe = {i["className"]: i for i in d["items"].values()}
    bat_par_classe = {b["className"]: b for b in d["buildings"].values()}
    pal = paliers(d)
    pal_bat = paliers_machines(d)
    mam = json.loads((OUT / "paliers-mam.json").read_text(encoding="utf-8"))["paliers"]

    items = {}
    for i in sorted(d["items"].values(), key=lambda x: x["name"]):
        items[i["name"]] = {"slug": i["slug"], "points": i["sinkPoints"], "liquide": bool(i["liquid"]),
                            "pile": i.get("stackSize"), "energie": i.get("energyValue") or 0}

    batiments, classe_vers_nom = {}, {}
    for groupe, classes in GROUPES.items():
        for c in classes:
            b = bat_par_classe.get(c)
            if not b:
                print(f"  bâtiment absent de la source : {c}", file=sys.stderr)
                continue
            m = b.get("metadata", {})
            classe_vers_nom[c] = b["name"]
            batiments[b["name"]] = {"slug": b["slug"], "classe": c, "groupe": groupe,
                                    "mw": m.get("powerConsumption", 0),
                                    "exposant": m.get("powerConsumptionExponent", 0) or None,
                                    "palier": pal_bat.get(c)}

    recettes = {}
    for r in sorted(d["recipes"].values(), key=lambda x: x["name"]):
        prod = [c for c in r.get("producedIn", []) if c in classe_vers_nom]
        machine = classe_vers_nom[prod[0]] if prod else None
        if machine is None and not r.get("inWorkshop") and not r.get("inHand"):
            continue  # recettes de construction de bâtiments : hors périmètre des outils
        t, org = pal.get(r["className"], (0, None))
        if r["name"] in mam:
            t = max(t or 0, mam[r["name"]])
        nom = r["name"] if r["name"] not in recettes else f"{r['name']} ({r['className']})"
        recettes[nom] = {
            "classe": r["className"], "alternative": bool(r["alternate"]), "machine": machine,
            "temps": r["time"], "origine": org, "palierPlancher": t,
            "atelier": bool(r.get("inWorkshop")), "main": bool(r.get("inHand")),
            "ingredients": [[par_classe[g["item"]]["name"], g["amount"]] for g in r["ingredients"]
                            if g["item"] in par_classe],
            "produits": [[par_classe[g["item"]]["name"], g["amount"]] for g in r["products"]
                         if g["item"] in par_classe],
        }
        if r.get("isVariablePower"):
            recettes[nom]["mwMin"], recettes[nom]["mwMax"] = r["minPower"], r["maxPower"]

    ref = {"items": items, "batiments": batiments, "recettes": recettes,
           "ressources": sorted(par_classe[c]["name"] for c in d["resources"] if c in par_classe)}
    for nom, t in palier_utilisable(ref).items():
        recettes[nom]["palier"] = t
    for nom, r in recettes.items():
        r.setdefault("palier", None)

    return {
        "_doc": "Référentiel unique des données de jeu. Généré par scripts/donnees.py — ne pas éditer à la main. "
                "Les payloads des outils en sont dérivés ; toute correction se fait ici ou dans le script.",
        "source": {"depot": "greeny/SatisfactoryTools", "branche": "dev", "fichier": "data/data.json",
                   "recupere_le": datetime.date.today().isoformat()},
        "_paliers": "palier = premier palier où la recette est réellement exécutable : machine débloquée, "
                    "déblocage obtenu (jalon, chaîne de prérequis d'une alternative, paliers-mam.json) et "
                    "ingrédients produisibles par des recettes elles-mêmes exécutables. Point fixe. "
                    "palierPlancher = la seule part de déblocage, sans les ingrédients.",
        **ref,
    }


def icones(ref):
    from PIL import Image
    ICO.mkdir(parents=True, exist_ok=True)
    slugs = {v["slug"] for v in ref["items"].values()} | {v["slug"] for v in ref["batiments"].values()}
    neuf = 0
    for slug in sorted(slugs):
        dest = ICO / f"{slug}.webp"
        if dest.exists():
            continue
        try:
            with urllib.request.urlopen(IMG.format(slug=slug)) as r:
                im = Image.open(io.BytesIO(r.read())).convert("RGBA")
        except Exception as e:
            print(f"  icône absente : {slug} ({e})", file=sys.stderr)
            continue
        im.resize((TAILLE, TAILLE), Image.LANCZOS).save(dest, "WEBP", quality=82, method=6)
        neuf += 1
    print(f"icônes : {neuf} ajoutée(s), {len(list(ICO.glob('*.webp')))} au total dans donnees/icones/")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    ref = referentiel(charger())
    (OUT / "donnees-jeu.json").write_text(json.dumps(ref, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"donnees/donnees-jeu.json : {len(ref['items'])} items, {len(ref['batiments'])} bâtiments, "
          f"{len(ref['recettes'])} recettes")
    if "--sans-icones" not in sys.argv:
        icones(ref)
