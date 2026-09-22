#!/usr/bin/env python3
"""Injecte le bloc de langue commun dans chaque page HTML du dépôt.

Sources : commun/langue.json (configuration), commun/glossaire.json (noms du jeu EN → FR),
commun/ficsit-lang.js (moteur + sélecteur à drapeaux), commun/ficsit-lang.css.
Le bloc est embarqué dans chaque page (elles restent autonomes et lisibles hors ligne) et placé en tête
de <head>, juste après <meta charset>, pour que la langue soit posée avant le premier rendu.
Idempotent : remplacé entre <!-- FICSIT-LANG:START --> et <!-- FICSIT-LANG:END -->.
Usage : python3 scripts/langue.py   (depuis la racine du dépôt)
"""
import json, re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
C = ROOT / "commun"
START, END = "<!-- FICSIT-LANG:START -->", "<!-- FICSIT-LANG:END -->"


def compact(obj):
    obj = {k: v for k, v in obj.items() if not k.startswith("_")}
    # « </ » ne doit pas fermer la balise <script> hôte
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def bloc():
    conf = json.loads((C / "langue.json").read_text(encoding="utf-8"))
    glo = json.loads((C / "glossaire.json").read_text(encoding="utf-8"))
    if conf["defaut"] not in conf["langues"]:
        sys.exit("langue.json : 'defaut' absent de 'langues'")
    js = (C / "ficsit-lang.js").read_text(encoding="utf-8")
    js = js.replace("__CONF__", compact(conf)).replace("__GLOSSAIRE__", compact(glo))
    css = (C / "ficsit-lang.css").read_text(encoding="utf-8").strip()
    return f"{START}\n<style>{css}</style>\n<script>{js.strip()}</script>\n{END}"


def injecter(p, contenu):
    s = p.read_text(encoding="utf-8")
    if START in s:
        s = re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END), lambda _: contenu, s, count=1)
    else:
        m = re.search(r"<meta\s+charset=[^>]*>", s, re.I) or re.search(r"<head[^>]*>", s, re.I)
        if not m:
            sys.exit(f"{p.name} : ni <meta charset> ni <head> trouvés")
        s = s[:m.end()] + "\n" + contenu + s[m.end():]
    p.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    b = bloc()
    for p in sorted(ROOT.glob("*.html")):
        injecter(p, b)
        print(f"{p.name} : bloc langue à jour")
