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

# Habillage par outil : polices et couleurs reprises des variables de chaque page.
# ancre = (texte repère, "avant" | "apres_paragraphe") pour la première insertion.
# Langue : l'encart suit l'attribut lang de <html>, posé par le sélecteur commun (scripts/langue.py).
THEMES = {
  "satisfactory_infographie.html": dict(disp="'Saira Condensed',sans-serif", body="'Barlow',sans-serif",
      panel="var(--panel)", deep="var(--deep)", line="var(--rule)", ink="var(--ink)", dim="var(--dim)",
      ancre=("<p class=\"foot\"><span data-l=\"fr\">Données et icônes", "apres_paragraphe")),
  "ficsit_horloge.html": dict(disp="'Saira Condensed',sans-serif", body="'Rajdhani',sans-serif",
      panel="var(--panel)", deep="var(--slot)", line="var(--line)", ink="var(--text)", dim="var(--muted)",
      ancre=("<footer", "avant")),
  "broyeur-excedents.html": dict(disp="var(--disp)", body="var(--sans)",
      panel="var(--p1)", deep="var(--p3)", line="var(--ln)", ink="var(--ink)", dim="var(--ink2)",
      ancre=("<footer", "avant")),
  "arbre-production.html": dict(disp="'Saira Condensed',sans-serif", body="'Barlow',sans-serif",
      panel="var(--panel)", deep="var(--deep)", line="var(--rule)", ink="var(--ink)", dim="var(--dim)",
      ancre=("<footer", "avant")),
  "memo-ficsit.html": dict(disp="var(--d)", body="var(--b)",
      panel="var(--panel)", deep="var(--slot)", line="var(--line)", ink="var(--tx)", dim="var(--tx2)",
      ancre=("<footer", "avant")),
}

CSS = """
.pn{--pn-or:#FA9549;display:flex;font-family:var(--pn-body);text-align:left}
.pn *{box-sizing:border-box}
.pn-btn{all:unset;box-sizing:border-box;position:relative;cursor:pointer;display:flex;align-items:center;gap:7px;
  padding:6px 11px 5px 10px;background:rgba(14,18,22,.94);border:1px solid #39434F;box-shadow:0 3px 12px rgba(0,0,0,.45);
  clip-path:polygon(0 0,calc(100% - 9px) 0,100% 9px,100% 100%,9px 100%,0 calc(100% - 9px));
  font:700 12px/1 'Saira Condensed','Rajdhani','Barlow Condensed',system-ui,sans-serif;letter-spacing:.1em;color:#E4EAF0;
  transition:color .15s,background .15s}
.pn-btn::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;
  background:repeating-linear-gradient(135deg,#FA9549 0 6px,transparent 6px 12px);opacity:.8}
.pn-btn svg{width:13px;height:13px;flex:none;fill:none;stroke:#FA9549;stroke-width:1.6}
.pn-btn:hover,.pn-btn[aria-expanded=true]{background:#FA9549;color:#1B1206}
.pn-btn:hover svg,.pn-btn[aria-expanded=true] svg{stroke:#1B1206}
.pn-btn:focus-visible{outline:2px solid #FA9549;outline-offset:1px}
.pn-dot{display:none;position:absolute;left:3px;top:3px;width:8px;height:8px;border-radius:50%;background:#FA9549;
  box-shadow:0 0 0 2px rgba(14,18,22,.94)}
.pn-neuf .pn-dot{display:block;animation:pn-pulse 1.8s ease-in-out infinite}
.pn-neuf .pn-btn:hover .pn-dot,.pn-neuf .pn-btn[aria-expanded=true] .pn-dot{background:#1B1206}
@keyframes pn-pulse{50%{box-shadow:0 0 0 2px rgba(14,18,22,.94),0 0 0 5px rgba(250,149,73,.35)}}
@media (prefers-reduced-motion:reduce){.pn-neuf .pn-dot{animation:none}}
.pn-panel{position:absolute;top:calc(100% + 6px);right:0;width:min(440px,calc(100vw - 24px));max-height:min(72vh,640px);
  overflow:auto;overscroll-behavior:contain;background:var(--pn-panel);color:var(--pn-ink);
  border:1px solid var(--pn-line);border-left:3px solid var(--pn-or);box-shadow:0 10px 30px rgba(0,0,0,.55)}
.pn-panel[hidden]{display:none}
.pn-hz{height:6px;background:repeating-linear-gradient(45deg,var(--pn-or) 0 10px,transparent 10px 20px);opacity:.7}
.pn-head{display:flex;align-items:center;gap:12px;padding:14px 16px 11px;border-bottom:1px solid var(--pn-line)}
.pn-head > div{flex:1;min-width:0}
.pn-slot{flex:none;width:42px;height:42px;display:grid;place-items:center;background:var(--pn-deep);
  border:1px solid var(--pn-line);box-shadow:inset 0 0 0 2px rgba(0,0,0,.35)}
.pn-slot img{width:30px;height:30px;object-fit:contain;display:block}
.pn-title{margin:0;padding:0;border:0;background:none;font-family:var(--pn-disp);font-weight:700;font-size:1.15rem;
  line-height:1.1;letter-spacing:.02em;color:var(--pn-or)}
.pn-sub{margin:3px 0 0;padding:0;font-size:.86rem;line-height:1.3;color:var(--pn-dim);max-width:none}
.pn-x{all:unset;flex:none;cursor:pointer;width:28px;height:28px;display:grid;place-items:center;color:var(--pn-dim);
  font:400 22px/1 system-ui,sans-serif}
.pn-x:hover,.pn-x:focus-visible{color:var(--pn-or)}
.pn-x:focus-visible{outline:2px solid var(--pn-or)}
.pn-list{list-style:none;margin:0;padding:14px 16px 4px 16px;position:relative}
.pn-e{position:relative;margin:0;padding:0 0 13px 22px}
.pn-e::before{content:"";position:absolute;left:5px;top:14px;bottom:-2px;width:1px;background:var(--pn-line)}
.pn-list > .pn-e:last-child::before{display:none}
.pn-e::after{content:"";position:absolute;left:1px;top:6px;width:9px;height:9px;transform:rotate(45deg);
  border:1.5px solid var(--pn-dim);background:var(--pn-panel)}
.pn-list:first-of-type > .pn-e:first-child::after,.pn-e.pn-new::after{background:var(--pn-or);border-color:var(--pn-or)}
.pn-meta{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin-bottom:3px}
.pn-v{font-family:var(--pn-disp);font-weight:700;font-size:.85rem;padding:1px 8px 1px 7px;background:var(--pn-or);
  color:#1b1206;clip-path:polygon(0 0,100% 0,100% 60%,calc(100% - 6px) 100%,0 100%)}
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
@media (max-width:560px){.pn-btn{padding:5px 8px 4px 9px;gap:5px}.pn-panel{position:fixed;top:44px;right:6px;width:calc(100vw - 12px)}}
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
    t = THEMES[fichier]; es = outil["entrees"]; der = es[0]; v = html.escape(der["version"])
    style = (f'--pn-disp:{t["disp"]};--pn-body:{t["body"]};--pn-panel:{t["panel"]};--pn-deep:{t["deep"]};'
             f'--pn-line:{t["line"]};--pn-ink:{t["ink"]};--pn-dim:{t["dim"]}')
    slot = f'<span class="pn-slot"><img src="{icone}" alt=""></span>' if icone else ""
    vis, old = es[:VISIBLES], es[VISIBLES:]
    date = der["date"]
    h = [START, f'<style>{CSS.strip()}</style>',
         f'<div class="pn" id="journal" data-fdock data-outil="{html.escape(fichier)}" data-v="{v}" style="{style}">',
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
