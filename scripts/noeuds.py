#!/usr/bin/env python3
"""Régénère donnees/noeuds-ressources.json : pureté et ressource de chaque nœud de la carte, par identifiant d'acteur
(tel qu'il apparaît dans une sauvegarde, mExtractableResource). La sauvegarde ne contient pas la pureté d'un nœud
d'origine : c'est une donnée de la carte.

Source : rockfactory/satisfactory-logistics (licence MIT), src/recipes/WorldResourceNodes.json.
Usage : python3 scripts/noeuds.py   (depuis la racine du dépôt ; réseau requis)
"""
import json, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = "https://raw.githubusercontent.com/rockfactory/satisfactory-logistics/main/src/recipes/WorldResourceNodes.json"
DOC = ("Nœuds de ressources de la carte (jeu de base, 1.0+) : identifiant de l'acteur tel qu'il apparaît dans une "
       "sauvegarde (mExtractableResource) → [classe de la ressource, pureté, classe du nœud]. La sauvegarde ne contient "
       "pas la pureté des nœuds non modifiés : c'est une donnée de la carte. Source : rockfactory/satisfactory-logistics, "
       "src/recipes/WorldResourceNodes.json (licence MIT, https://github.com/rockfactory/satisfactory-logistics). "
       "Si la sauvegarde porte elle-même une pureté (génération aléatoire, mods), c'est elle qui prime. "
       "Régénéré par scripts/noeuds.py.")

if __name__ == "__main__":
    with urllib.request.urlopen(SOURCE, timeout=60) as r:
        w = json.load(r)
    n = {x["id"]: [x["resource"], x["purity"], x["classPath"]] for x in sorted(w, key=lambda x: x["id"])}
    f = ROOT / "donnees" / "noeuds-ressources.json"
    avant = json.loads(f.read_text(encoding="utf-8"))["noeuds"] if f.exists() else {}
    f.write_text(json.dumps({"_doc": DOC, "noeuds": n}, ensure_ascii=False, indent=0, separators=(",", ":")) + "\n", encoding="utf-8")
    plus, moins = set(n) - set(avant), set(avant) - set(n)
    modif = [k for k in set(n) & set(avant) if n[k] != avant[k]]
    print(f"donnees/noeuds-ressources.json : {len(n)} nœuds (+{len(plus)}, -{len(moins)}, {len(modif)} modifiés)")
