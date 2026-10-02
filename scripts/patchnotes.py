#!/usr/bin/env python3
"""Injecte le « Journal des révisions » dans chaque outil et régénère CHANGELOG.md.

Le journal prend la forme d'un badge de version (ex. « v1.7 ») dans le dock commun en haut à droite,
à côté des drapeaux (commun/ficsit-lang.js déplace tout élément data-fdock dans ce dock). Un clic
déroule le panneau des révisions. Chaque navigateur retient la dernière version vue de chaque outil
(localStorage « ficsit-tools:vu:<fichier> ») : tant qu'une version n'a pas été vue, le badge porte une
pastille et les entrées nouvelles sont marquées « nouveau » dans le panneau.

Source : changelog.json à la racine. Idempotent : le bloc est remplacé entre les marqueurs
<!-- PATCHNOTES:START --> et <!-- PATCHNOTES:END -->. Icône du panneau : celle de la carte
de l'outil dans index.html.
Usage : python3 scripts/patchnotes.py   (depuis la racine du dépôt)
"""
import json, re, html, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
START, END = "<!-- PATCHNOTES:START -->", "<!-- PATCHNOTES:END -->"
VISIBLES = 3  # entrées affichées avant le repli

# Ancre par outil = (texte repère, "avant" | "apres_paragraphe") pour la première insertion.
# Habillage : les variables de la charte commune (commun/ficsit-hud.css), les mêmes sur toutes les pages.
# Langue : l'encart suit l'attribut lang de <html>, posé par le sélecteur commun (scripts/langue.py).
THEMES = {
  "satisfactory_infographie.html": dict(ancre=("<p class=\"foot\"><span data-l=\"fr\">Données et icônes", "apres_paragraphe")),
  "ficsit_horloge.html": dict(ancre=("<footer", "avant")),
  "broyeur-excedents.html": dict(ancre=("<footer", "avant")),
  "arbre-production.html": dict(ancre=("<footer", "avant")),
  "memo-ficsit.html": dict(ancre=("<footer", "avant")),
  "depot-dimensionnel.html": dict(ancre=("<footer", "avant")),
  "energie-noeuds.html": dict(ancre=("<footer", "avant")),
}

CSS = """
.pn{--pn-or:var(--f-or);--pn-disp:var(--f-police);--pn-body:var(--f-police);--pn-panel:var(--f-fenetre);
  --pn-deep:var(--f-creux);--pn-line:var(--f-trait);--pn-ink:var(--f-encre);--pn-dim:var(--f-encre2);display:flex;font-family:var(--pn-body);text-align:left}
.pn *{box-sizing:border-box}
.pn-btn{all:unset;box-sizing:border-box;position:relative;cursor:pointer;display:flex;align-items:center;gap:7px;
  padding:0 12px;background:none;
  font:600 12px/1 var(--f-police);letter-spacing:.08em;color:var(--f-encre);
  transition:color .15s,background .15s}
.pn-btn svg{width:13px;height:13px;flex:none;fill:none;stroke:var(--f-or);stroke-width:1.6}
.pn-btn:hover{background:#4A4A4A}
.pn-btn[aria-expanded=true]{background:var(--f-or);color:var(--f-or-encre)}
.pn-btn[aria-expanded=true] svg{stroke:var(--f-or-encre)}
.pn-btn:focus-visible{outline:2px solid var(--f-or-clair);outline-offset:1px}
.pn-dot{display:none;position:absolute;left:3px;top:3px;width:8px;height:8px;border-radius:50%;background:var(--f-or);
  box-shadow:0 0 0 2px var(--f-barre)}
.pn-neuf .pn-dot{display:block;animation:pn-pulse 1.8s ease-in-out infinite}
.pn-neuf .pn-btn[aria-expanded=true] .pn-dot{background:var(--f-or-encre)}
@keyframes pn-pulse{50%{box-shadow:0 0 0 2px var(--f-barre),0 0 0 5px rgba(229,147,69,.35)}}
@media (prefers-reduced-motion:reduce){.pn-neuf .pn-dot{animation:none}}
.pn-panel{position:fixed;top:var(--f-barre-h);right:0;width:min(440px,calc(100vw - 24px));max-height:min(72vh,640px);
  overflow:auto;overscroll-behavior:contain;background:var(--pn-panel);color:var(--pn-ink);
  box-shadow:var(--f-ombre)}
.pn-panel[hidden]{display:none}
.pn-hz{height:3px;background:var(--pn-or)}
.pn-head{display:flex;align-items:center;gap:12px;padding:12px 0 12px 16px;background:var(--f-barre)}
.pn-head > div{flex:1;min-width:0}
.pn-slot{flex:none;width:42px;height:42px;display:grid;place-items:center;background:var(--f-case);border-radius:3px}
.pn-slot img{width:30px;height:30px;object-fit:contain;display:block}
.pn-title{margin:0;padding:0;border:0;background:none;font-family:var(--pn-disp);font-weight:600;font-size:1.08rem;
  line-height:1.15;letter-spacing:0;color:var(--pn-ink)}
.pn-sub{margin:3px 0 0;padding:0;font-size:.86rem;line-height:1.3;color:var(--pn-dim);max-width:none}
.pn-x{all:unset;flex:none;cursor:pointer;align-self:stretch;width:44px;margin:-12px 0;display:grid;place-items:center;color:#fff;
  background:#4A4A4A;font:400 22px/1 system-ui,sans-serif}
.pn-x:hover,.pn-x:focus-visible{background:var(--pn-or);color:var(--f-or-encre)}
.pn-list{list-style:none;margin:0;padding:14px 16px 4px 16px;position:relative}
.pn-e{position:relative;margin:0;padding:0 0 13px 22px}
.pn-e::before{content:"";position:absolute;left:5px;top:14px;bottom:-2px;width:1px;background:var(--pn-line)}
.pn-list > .pn-e:last-child::before{display:none}
.pn-e::after{content:"";position:absolute;left:1px;top:6px;width:9px;height:9px;transform:rotate(45deg);
  border:1.5px solid var(--pn-dim);background:var(--pn-panel)}
.pn-list:first-of-type > .pn-e:first-child::after,.pn-e.pn-new::after{background:var(--pn-or);border-color:var(--pn-or)}
.pn-meta{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin-bottom:3px}
.pn-v{font-family:var(--pn-disp);font-weight:700;font-size:.85rem;padding:1px 7px;background:var(--pn-or);
  color:var(--f-or-encre);border-radius:2px}
.pn-e + .pn-e .pn-v,.pn-old .pn-v{background:var(--pn-deep);color:var(--pn-dim);box-shadow:inset 0 0 0 1px var(--pn-line)}
.pn-d{font-family:var(--pn-disp);font-size:.88rem;color:var(--pn-dim);letter-spacing:.03em}
.pn-nv{display:none;font-family:var(--pn-disp);font-weight:700;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;
  color:var(--pn-or)}
.pn-new .pn-nv{display:inline}
.pn-t{margin:0;padding:0;font-size:.94rem;line-height:1.5;color:var(--pn-ink);max-width:none}
.pn-old{border-top:1px dashed var(--pn-line);margin:0 16px}
.pn-old summary{cursor:pointer;padding:10px 0;font-family:var(--pn-disp);font-weight:600;font-size:.9rem;color:var(--pn-dim);
  list-style:none}
.pn-old summary::-webkit-details-marker{display:none}
.pn-old summary::before{content:"+";display:inline-block;width:1.1em;color:var(--pn-or);font-weight:700}
.pn-old[open] summary::before{content:"\\2212"}
.pn-old summary:hover,.pn-old summary:focus-visible{color:var(--pn-ink)}
.pn-old summary:focus-visible{outline:2px solid var(--pn-or);outline-offset:2px}
.pn-old .pn-list{padding:4px 0 6px}
.pn-foot{height:8px}
html:not([lang|=en]) .pn [data-l=en],html[lang|=en] .pn [data-l=fr]{display:none}
@media (max-width:560px){.pn-btn{padding:0 8px;gap:5px}.pn-panel{width:100vw}}
@media print{.pn{display:none}}
"""

MOIS_EN = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()

def fr(d):
    a, m, j = d.split("-"); return f"{j}/{m}/{a}"

def en(d):
    a, m, j = d.split("-"); return f"{int(j)} {MOIS_EN[int(m) - 1]} {a}"

def bi(fr_txt, en_txt, tag="span"):
    return f'<{tag} data-l="fr">{fr_txt}</{tag}><{tag} data-l="en" lang="en">{en_txt}</{tag}>'

def icones():
    s = (ROOT / "index.html").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r'<a class="card" href="([^"]+)">([\s\S]*?)</a>', s):
        img = re.search(r'<img src="([^"]+)"', m.group(2))
        if img: out[m.group(1)] = img.group(1)
    return out

def entree(e):
    t = e["texte"]
    return (f'<li class="pn-e" data-v="{html.escape(e["version"])}"><div class="pn-meta"><span class="pn-v">v{html.escape(e["version"])}</span>'
            f'<time class="pn-d" datetime="{e["date"]}">{bi(fr(e["date"]), en(e["date"]))}</time>'
            f'<span class="pn-nv">{bi("nouveau", "new")}</span></div>'
            f'<p class="pn-t">{bi(html.escape(t["fr"]), html.escape(t["en"]))}</p></li>')

JS = """
(function(){
  var r = document.getElementById('journal'); if(!r) return;
  var b = r.querySelector('.pn-btn'), p = r.querySelector('.pn-panel'), x = r.querySelector('.pn-x');
  var K = 'ficsit-tools:vu:' + r.dataset.outil, V = r.dataset.v, vu = null;
  try{ vu = localStorage.getItem(K); }catch(e){}
  function cmp(a, c){ a = a.split('.').map(Number); c = c.split('.').map(Number);
    for(var i = 0; i < Math.max(a.length, c.length); i++){ var d = (a[i] || 0) - (c[i] || 0); if(d) return d; } return 0; }
  if(vu !== V) r.classList.add('pn-neuf');
  if(vu) r.querySelectorAll('.pn-e[data-v]').forEach(function(e){
    if(cmp(e.dataset.v, vu) > 0){ e.classList.add('pn-new'); var d = e.closest('details'); if(d) d.open = true; } });
  function ouvrir(o){
    p.hidden = !o; b.setAttribute('aria-expanded', o);
    if(o){ r.classList.remove('pn-neuf'); try{ localStorage.setItem(K, V); }catch(e){} }
  }
  b.addEventListener('click', function(e){ e.stopPropagation(); ouvrir(p.hidden); });
  x.addEventListener('click', function(){ ouvrir(false); b.focus(); });
  document.addEventListener('click', function(e){ if(!p.hidden && !r.contains(e.target)) ouvrir(false); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !p.hidden){ ouvrir(false); b.focus(); } });
})();
"""

ICONE_JOURNAL = ('<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5h8v11H3z"/>'
                 '<path d="M5 4.5h4M5 7h4M5 9.5h2.5"/></svg>')

def bloc(fichier, outil, icone):
    es = outil["entrees"]; der = es[0]; v = html.escape(der["version"])
    slot = f'<span class="pn-slot"><img src="{icone}" alt=""></span>' if icone else ""
    vis, old = es[:VISIBLES], es[VISIBLES:]
    date = der["date"]
    h = [START, f'<style>{CSS.strip()}</style>',
         f'<div class="pn" id="journal" data-fdock data-outil="{html.escape(fichier)}" data-v="{v}">',
         f'<button type="button" class="pn-btn" aria-expanded="false" aria-controls="pn-panel" '
         f'data-fr-title="Journal des révisions : ce qui a changé" data-en-title="Revision log: what changed" '
         f'title="Journal des révisions : ce qui a changé">'
         f'<span class="pn-dot" aria-hidden="true"></span>{ICONE_JOURNAL}<span>v{v}</span></button>',
         f'<div class="pn-panel" id="pn-panel" role="region" aria-labelledby="pn-titre" hidden><div class="pn-hz"></div>',
         f'<div class="pn-head">{slot}<div><div class="pn-title" id="pn-titre" role="heading" aria-level="2">'
         f'{bi("Journal des révisions", "Revision log")}</div>',
         f'<p class="pn-sub">{bi(f"Version {v}, mise à jour le {fr(date)}", f"Version {v}, updated {en(date)}")}</p></div>'
         f'<button type="button" class="pn-x" data-fr-aria-label="Fermer" data-en-aria-label="Close" aria-label="Fermer">×</button></div>',
         '<ol class="pn-list">' + "".join(entree(e) for e in vis) + "</ol>"]
    if old:
        n = len(old); s_ = "s" if n > 1 else ""
        h.append(f'<details class="pn-old"><summary>{bi(f"{n} révision{s_} antérieure{s_}", f"{n} earlier revision{s_}")}</summary>'
                 '<ol class="pn-list">' + "".join(entree(e) for e in old) + "</ol></details>")
    h.append('<div class="pn-foot"></div></div></div>')
    h.append(f'<script>{JS.strip()}</script>')
    h.append(END)
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
        L += [f"## {o['nom']['fr']} / {o['nom']['en']} — `{f}`", ""]
        for e in o["entrees"]:
            L += [f"- **v{e['version']}** ({fr(e['date'])}) : {e['texte']['fr']}", f"  *EN — {e['texte']['en']}*"]
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
