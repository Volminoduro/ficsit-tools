#!/usr/bin/env python3
"""Injecte l'encart « Journal des révisions » dans chaque outil et régénère CHANGELOG.md.

Source : changelog.json à la racine. Idempotent : le bloc est remplacé entre les marqueurs
<!-- PATCHNOTES:START --> et <!-- PATCHNOTES:END -->. Icône de l'encart : celle de la carte
de l'outil dans index.html.
Usage : python3 scripts/patchnotes.py   (depuis la racine du dépôt)
"""
import json, re, html, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
START, END = "<!-- PATCHNOTES:START -->", "<!-- PATCHNOTES:END -->"
VISIBLES = 3  # entrées affichées avant le repli

# Habillage par outil : polices et couleurs reprises des variables de chaque page.
# ancre = (texte repère, "avant" | "apres") pour la première insertion.
THEMES = {
  "satisfactory_infographie.html": dict(disp="'Saira Condensed',sans-serif", body="'Barlow',sans-serif",
      panel="var(--panel)", deep="var(--deep)", line="var(--rule)", ink="var(--ink)", dim="var(--dim)",
      ancre=("<p class=\"foot\">Données et icônes", "apres_paragraphe")),
  "ficsit_horloge.html": dict(disp="'Saira Condensed',sans-serif", body="'Rajdhani',sans-serif",
      panel="var(--panel)", deep="var(--slot)", line="var(--line)", ink="var(--text)", dim="var(--muted)",
      ancre=("<footer", "avant")),
  "broyeur-excedents.html": dict(disp="var(--disp)", body="var(--sans)",
      panel="var(--p1)", deep="var(--p3)", line="var(--ln)", ink="var(--ink)", dim="var(--ink2)",
      ancre=("<footer", "avant")),
  "memo-ficsit.html": dict(disp="var(--d)", body="var(--b)",
      panel="var(--panel)", deep="var(--slot)", line="var(--line)", ink="var(--tx)", dim="var(--tx2)",
      ancre=("<footer", "avant")),
}

CSS = """
.pn{--pn-or:#FA9549;margin:34px 0 8px;background:var(--pn-panel);color:var(--pn-ink);font-family:var(--pn-body);
  clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px);
  border-left:3px solid var(--pn-or);text-align:left}
.pn *{box-sizing:border-box}
.pn-hz{height:6px;background:repeating-linear-gradient(45deg,var(--pn-or) 0 10px,transparent 10px 20px);opacity:.7}
.pn-head{display:flex;align-items:center;gap:14px;padding:16px 20px 12px;border-bottom:1px solid var(--pn-line)}
.pn-slot{flex:none;width:46px;height:46px;display:grid;place-items:center;background:var(--pn-deep);
  border:1px solid var(--pn-line);box-shadow:inset 0 0 0 2px rgba(0,0,0,.35)}
.pn-slot img{width:34px;height:34px;object-fit:contain;display:block}
.pn-title{margin:0;padding:0;border:0;background:none;font-family:var(--pn-disp);font-weight:700;font-size:1.25rem;
  line-height:1.1;letter-spacing:.02em;color:var(--pn-or)}
.pn-sub{margin:3px 0 0;padding:0;font-size:.9rem;line-height:1.3;color:var(--pn-dim);max-width:none}
.pn-list{list-style:none;margin:0;padding:14px 20px 6px 20px;position:relative}
.pn-e{position:relative;margin:0;padding:0 0 14px 22px}
.pn-e::before{content:"";position:absolute;left:5px;top:14px;bottom:-2px;width:1px;background:var(--pn-line)}
.pn-list > .pn-e:last-child::before{display:none}
.pn-e::after{content:"";position:absolute;left:1px;top:6px;width:9px;height:9px;transform:rotate(45deg);
  border:1.5px solid var(--pn-dim);background:var(--pn-panel)}
.pn-list:first-of-type > .pn-e:first-child::after{background:var(--pn-or);border-color:var(--pn-or)}
.pn-meta{display:flex;align-items:baseline;gap:10px;margin-bottom:3px}
.pn-v{font-family:var(--pn-disp);font-weight:700;font-size:.85rem;padding:1px 8px 1px 7px;background:var(--pn-or);
  color:#1b1206;clip-path:polygon(0 0,100% 0,100% 60%,calc(100% - 6px) 100%,0 100%)}
.pn-e + .pn-e .pn-v,.pn-old .pn-v{background:var(--pn-deep);color:var(--pn-dim);box-shadow:inset 0 0 0 1px var(--pn-line)}
.pn-d{font-family:var(--pn-disp);font-size:.9rem;color:var(--pn-dim);letter-spacing:.03em}
.pn-t{margin:0;padding:0;font-size:.98rem;line-height:1.5;color:var(--pn-ink);max-width:72ch}
.pn-old{border-top:1px dashed var(--pn-line);margin:0 20px}
.pn-old summary{cursor:pointer;padding:10px 0;font-family:var(--pn-disp);font-weight:600;font-size:.92rem;color:var(--pn-dim);
  list-style:none}
.pn-old summary::-webkit-details-marker{display:none}
.pn-old summary::before{content:"+";display:inline-block;width:1.1em;color:var(--pn-or);font-weight:700}
.pn-old[open] summary::before{content:"\\2212"}
.pn-old summary:hover,.pn-old summary:focus-visible{color:var(--pn-ink)}
.pn-old summary:focus-visible{outline:2px solid var(--pn-or);outline-offset:2px}
.pn-old .pn-list{padding:4px 0 6px}
.pn-foot{height:10px}
@media (max-width:560px){.pn-head{padding:14px 14px 10px}.pn-list{padding-left:14px;padding-right:14px}.pn-old{margin:0 14px}}
"""

def fr(d):
    a, m, j = d.split("-"); return f"{j}/{m}/{a}"

def icones():
    s = (ROOT / "index.html").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r'<a class="card" href="([^"]+)">([\s\S]*?)</a>', s):
        img = re.search(r'<img src="([^"]+)"', m.group(2))
        if img: out[m.group(1)] = img.group(1)
    return out

def entree(e):
    return (f'<li class="pn-e"><div class="pn-meta"><span class="pn-v">v{html.escape(e["version"])}</span>'
            f'<time class="pn-d" datetime="{e["date"]}">{fr(e["date"])}</time></div>'
            f'<p class="pn-t">{html.escape(e["texte"])}</p></li>')

def bloc(fichier, outil, icone):
    t = THEMES[fichier]; es = outil["entrees"]; der = es[0]
    style = (f'--pn-disp:{t["disp"]};--pn-body:{t["body"]};--pn-panel:{t["panel"]};--pn-deep:{t["deep"]};'
             f'--pn-line:{t["line"]};--pn-ink:{t["ink"]};--pn-dim:{t["dim"]}')
    slot = f'<span class="pn-slot"><img src="{icone}" alt=""></span>' if icone else ""
    vis, old = es[:VISIBLES], es[VISIBLES:]
    h = [START, f'<style>{CSS.strip()}</style>',
         f'<aside class="pn" id="journal" aria-labelledby="pn-titre" style="{style}"><div class="pn-hz"></div>',
         f'<div class="pn-head">{slot}<div><div class="pn-title" id="pn-titre" role="heading" aria-level="2">Journal des révisions</div>',
         f'<p class="pn-sub">Version {html.escape(der["version"])}, mise à jour le {fr(der["date"])}</p></div></div>',
         '<ol class="pn-list">' + "".join(entree(e) for e in vis) + "</ol>"]
    if old:
        n = len(old)
        h.append(f'<details class="pn-old"><summary>{n} révision{"s" if n > 1 else ""} antérieure{"s" if n > 1 else ""}</summary>'
                 '<ol class="pn-list">' + "".join(entree(e) for e in old) + "</ol></details>")
    h += ['<div class="pn-foot"></div></aside>', END]
    return "\n".join(h)

def injecter(fichier, contenu):
    p = ROOT / fichier; s = p.read_text(encoding="utf-8")
    if START in s:
        s = re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END), lambda _: contenu, s, count=1)
    else:
        rep, mode = THEMES[fichier]["ancre"]
        if mode == "avant":
            i = s.rfind(rep)
        else:
            i = s.rfind(rep); i = s.index("</p>", i) + 4 if i >= 0 else -1
        if i < 0: sys.exit(f"{fichier} : ancre introuvable")
        s = s[:i] + ("\n" if mode != "avant" else "") + contenu + "\n" + s[i:]
    p.write_text(s, encoding="utf-8")

def changelog_md(data):
    L = ["# Journal des révisions", "", "Généré depuis `changelog.json` par `scripts/patchnotes.py` — ne pas éditer à la main.", ""]
    for f, o in data["outils"].items():
        L += [f"## {o['nom']} — `{f}`", ""]
        L += [f"- **v{e['version']}** ({fr(e['date'])}) : {e['texte']}" for e in o["entrees"]]
        L.append("")
    (ROOT / "CHANGELOG.md").write_text("\n".join(L), encoding="utf-8")

if __name__ == "__main__":
    data = json.loads((ROOT / "changelog.json").read_text(encoding="utf-8"))
    ic = icones()
    for f, o in data["outils"].items():
        injecter(f, bloc(f, o, ic.get(f)))
        print(f"{f} : v{o['entrees'][0]['version']} ({len(o['entrees'])} entrée(s))")
    changelog_md(data)
    print("CHANGELOG.md régénéré")
