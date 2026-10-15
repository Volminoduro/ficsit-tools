#!/usr/bin/env python3
"""Injecte le « Journal des révisions » dans chaque outil et régénère CHANGELOG.md.

Le journal prend la forme d'un badge de version (ex. « v1.7.0 ») dans le dock commun en haut à droite,
à côté des drapeaux (commun/ficsit-lang.js déplace tout élément data-fdock dans ce dock). Un clic
déroule le panneau des révisions.

Trois niveaux, lus dans le numéro de version (x.y.z.w) :
  x.y.0    fonctionnalité : titre + texte court, pastille orange qui pulse ;
  x.y.z    ajustement (z > 0) : une ligne, point gris fixe ;
  x.y.z.w  correctif de bug (w > 0) : une ligne plus discrète, rangée sous l'ajustement z, sans pastille.
Les ajustements et correctifs sont regroupés, repliés, sous la fonctionnalité x.y.0 de leur version. Les
numéros à deux segments (« 1.43 », anciennes entrées) se lisent « 1.43.0 » : une fonctionnalité chacun.
Les changements qui valent pour tout le site sont dans le journal « Site » (clé « site » de changelog.json),
affiché en bas du panneau de chaque outil.

Chaque navigateur retient la dernière version vue de chaque outil et du site (localStorage
« ficsit-tools:vu2:<fichier> » et « ficsit-tools:vu2:site » ; l'ancienne clé « ficsit-tools:vu:<fichier> » est
supprimée au chargement) : le badge porte la pastille du niveau le plus élevé des entrées pas encore vues,
et ces entrées sont marquées dans le panneau.

Source : changelog.json à la racine. Idempotent : le bloc est remplacé entre les marqueurs
<!-- PATCHNOTES:START --> et <!-- PATCHNOTES:END -->. Icône du panneau : celle de la carte
de l'outil dans index.html.
Usage : python3 scripts/patchnotes.py   (depuis la racine du dépôt)
"""
import json, re, html, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
START, END = "<!-- PATCHNOTES:START -->", "<!-- PATCHNOTES:END -->"
MAX_LIGNE = 170   # caractères d'une ligne d'ajustement ou de correctif (fr et en)
MAX_TEXTE = 460   # caractères du texte d'une fonctionnalité

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
  "planner.html": dict(ancre=("<footer", "avant")),
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
.pn-ajust:not(.pn-neuf) .pn-dot{display:block;width:6px;height:6px;left:4px;top:4px;background:#9a9a9a}
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
.pn-cur{padding:14px 16px 6px}
.pn-meta{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin-bottom:5px}
.pn-v{font-family:var(--pn-disp);font-weight:700;font-size:.85rem;padding:1px 7px;background:var(--pn-or);
  color:var(--f-or-encre);border-radius:2px}
.pn-d{font-family:var(--pn-disp);font-size:.88rem;color:var(--pn-dim);letter-spacing:.03em}
.pn-nv{display:none;font-family:var(--pn-disp);font-weight:700;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;
  color:var(--pn-or)}
.pn-new > .pn-meta .pn-nv{display:inline}
.pn-tt{margin:0 0 4px;padding:0;border:0;background:none;font-family:var(--pn-disp);font-weight:700;font-size:1rem;line-height:1.25;
  letter-spacing:0;color:var(--pn-ink)}
.pn-t{margin:0;padding:0;font-size:.92rem;line-height:1.5;color:var(--pn-ink);max-width:none}
.pn-aj{margin:10px 0 2px;border-top:1px dashed var(--pn-line)}
.pn-aj > summary{cursor:pointer;list-style:none;padding:8px 0;font-family:var(--pn-disp);font-weight:600;font-size:.78rem;line-height:1;
  letter-spacing:.06em;text-transform:uppercase;color:var(--pn-dim)}
.pn-aj > summary::-webkit-details-marker{display:none}
.pn-aj > summary::before,.pn-g > summary::before,.pn-site > summary::before{content:"+";display:inline-block;width:1.1em;color:var(--pn-or);font-weight:700}
.pn-aj[open] > summary::before,.pn-g[open] > summary::before,.pn-site[open] > summary::before{content:"\\2212"}
.pn-aj > summary:hover,.pn-aj > summary:focus-visible{color:var(--pn-ink)}
.pn-aj ul{list-style:none;margin:0;padding:0 0 8px}
.pn-aj li{display:flex;gap:8px;align-items:baseline;padding:3px 0;font-size:.82rem;line-height:1.4;color:var(--pn-dim)}
.pn-aj .n{flex:none;font-family:var(--pn-disp);font-weight:600;font-size:.72rem;line-height:1;color:#8a8a8a;min-width:3.4em;font-variant-numeric:tabular-nums}
.pn-aj li.fx{padding:1px 0 1px 3.4em;gap:6px;font-size:.74rem;line-height:1.35;color:#6d6d6d}
.pn-aj li.fx::before{content:"\\21B3";flex:none;color:#555}
.pn-aj li.fx .n{font-weight:500;font-size:.66rem;color:#5c5c5c;min-width:0}
.pn-pt{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--pn-or);margin-left:6px;vertical-align:middle}
.pn-hist{margin:0;padding:0 16px 8px;list-style:none;border-top:1px solid var(--pn-line)}
.pn-g{border-bottom:1px solid var(--pn-line)}
.pn-g > summary{cursor:pointer;list-style:none;display:flex;gap:10px;align-items:baseline;padding:9px 0;font-size:.9rem;color:var(--pn-ink)}
.pn-g > summary::-webkit-details-marker{display:none}
.pn-g > summary:focus-visible,.pn-site > summary:focus-visible,.pn-aj > summary:focus-visible{outline:2px solid var(--pn-or);outline-offset:2px}
.pn-g > summary::before{flex:none}
.pn-hv{flex:none;font-family:var(--pn-disp);font-weight:700;font-size:.8rem;color:var(--pn-dim);min-width:4.4em}
.pn-hn{flex:1;min-width:0}
.pn-hc{flex:none;font-size:.72rem;color:#888}
.pn-gd{padding:0 0 8px 1.1em}
.pn-gd .pn-t{font-size:.86rem;color:var(--pn-dim)}
.pn-gd .pn-aj{margin-top:6px}
.pn-site{margin:0 16px;border-top:1px dashed var(--pn-line)}
.pn-site > summary{cursor:pointer;list-style:none;padding:10px 0;font-family:var(--pn-disp);font-weight:600;font-size:.9rem;color:var(--pn-dim)}
.pn-site > summary::-webkit-details-marker{display:none}
.pn-site > summary small{font-weight:400;font-size:.8rem;margin-left:4px}
.pn-site > summary:hover{color:var(--pn-ink)}
.pn-site .pn-hist{padding:0 0 6px;border-top:0}
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

def bie(t):
    return bi(html.escape(t["fr"]), html.escape(t["en"]))

def icones():
    s = (ROOT / "index.html").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r'<a class="card[^"]*" href="([^"]+)">([\s\S]*?)</a>', s):
        img = re.search(r'<img src="([^"]+)"', m.group(2))
        if img: out[m.group(1)] = img.group(1)
    return out

# ---- versions et niveaux ----------------------------------------------------------------------------------

def vers(v):
    """« 1.7.2.1 » → (1, 7, 2, 1) ; « 1.43 » (ancienne entrée) → (1, 43, 0) ; au moins trois segments."""
    n = [int(x) for x in v.split(".")]
    while len(n) < 3: n.append(0)
    return tuple(n)

def niveau(v):
    n = vers(v)
    if len(n) > 3 and n[3] > 0: return "fix"
    return "aj" if n[2] > 0 else "feat"

def verifier(nom, es):
    """Contrôle d'un journal : textes dans les deux langues, longueurs, titre des fonctionnalités à trois segments."""
    vus = set()
    for e in es:
        v = e["version"]
        if v in vus: sys.exit(f"{nom} : version {v} en double")
        vus.add(v)
        for l in ("fr", "en"):
            if not e["texte"].get(l): sys.exit(f"{nom} {v} : texte {l} manquant")
        niv = niveau(v); neuf = len(v.split(".")) >= 3
        if neuf and niv == "feat" and not all((e.get("titre") or {}).get(l) for l in ("fr", "en")):
            sys.exit(f"{nom} {v} : une fonctionnalité demande un titre fr et en")
        if neuf and niv != "feat" and e.get("titre"):
            sys.exit(f"{nom} {v} : un ajustement ou un correctif n'a pas de titre")
        if neuf:
            lim = MAX_TEXTE if niv == "feat" else MAX_LIGNE
            for l in ("fr", "en"):
                if len(e["texte"][l]) > lim:
                    sys.exit(f"{nom} {v} : texte {l} trop long ({len(e['texte'][l])} > {lim} caractères)")

def groupes(es):
    """Entrées → groupes (x, y) du plus récent au plus ancien : {'v': (x, y), 'tete': entrée x.y.0, 'enfants': [...]}.
    Enfants : par ajustement z décroissant, chaque ajustement suivi de ses correctifs (w croissant)."""
    par = {}
    for e in es:
        n = vers(e["version"]); par.setdefault(n[:2], []).append(e)
    out = []
    for k in sorted(par, reverse=True):
        liste = par[k]
        tete = [e for e in liste if niveau(e["version"]) == "feat"]
        if len(tete) != 1: sys.exit(f"version {k[0]}.{k[1]} : il faut exactement une fonctionnalité x.y.0 (trouvé {len(tete)})")
        kids = [e for e in liste if e is not tete[0]]
        kids.sort(key=lambda e: (-vers(e["version"])[2], vers(e["version"])[3] if len(vers(e["version"])) > 3 else 0))
        out.append({"v": k, "tete": tete[0], "enfants": kids})
    return out

def sigle(e):
    """Titre d'une entrée sans titre (ancienne entrée) : début du texte."""
    t = e["texte"]
    def court(s):
        s = re.split(r"(?<=[.:;])\s", s, maxsplit=1)[0].rstrip(".:;")
        if len(s) <= 80: return s
        cut = s[:77]; cut = cut[:cut.rfind(" ")] if " " in cut else cut
        return cut.rstrip(" ,;:") + "…"
    return {l: court(t[l]) for l in ("fr", "en")}

def titre(e):
    return e.get("titre") or sigle(e)

def meta(c, e, src):
    v = html.escape(e["version"])
    return (f'data-v="{v}" data-niv="{niveau(e["version"])}" data-src="{src}"')

def liste_aj(enfants, src):
    li = []
    for e in enfants:
        niv = niveau(e["version"]); v = html.escape(e["version"])
        li.append(f'<li class="{"fx" if niv == "fix" else "aj"}" {meta(None, e, src)}><span class="n">{v}</span>'
                  f'<span>{bie(e["texte"])}</span></li>')
    return "<ul>" + "".join(li) + "</ul>"

def repli_aj(enfants, src, ouvert):
    if not enfants: return ""
    nb_f = sum(1 for e in enfants if niveau(e["version"]) == "fix")
    n = len(enfants)
    if nb_f == 0: fr_, en_ = f"Ajustements · {n}", f"Adjustments · {n}"
    elif nb_f == n: fr_, en_ = f"Correctifs · {n}", f"Fixes · {n}"
    else: fr_, en_ = f"Ajustements et correctifs · {n}", f"Adjustments and fixes · {n}"
    return (f'<details class="pn-aj"{" open" if ouvert else ""}><summary>{bi(fr_, en_)}</summary>'
            f'{liste_aj(enfants, src)}</details>')

def bloc_courant(g, src):
    e = g["tete"]; v = html.escape(e["version"]); t = e.get("titre")
    return (f'<div class="pn-cur" {meta(None, e, src)}><div class="pn-meta"><span class="pn-v">v{v}</span>'
            f'<time class="pn-d" datetime="{e["date"]}">{bi(fr(e["date"]), en(e["date"]))}</time>'
            f'<span class="pn-nv">{bi("nouveau", "new")}</span></div>'
            + (f'<h3 class="pn-tt">{bie(t)}</h3>' if t else "")
            + f'<p class="pn-t">{bie(e["texte"])}</p>' + repli_aj(g["enfants"], src, True) + '</div>')

def ligne_groupe(g, src):
    e = g["tete"]; v = html.escape(e["version"]); n = len(g["enfants"])
    plus = f'<span class="pn-hc">+{n}</span>' if n else ""
    corps = f'<div class="pn-gd"><p class="pn-t">{bie(e["texte"])}</p>{repli_aj(g["enfants"], src, False)}</div>'
    return (f'<li><details class="pn-g"><summary {meta(None, e, src)}><span class="pn-hv">v{v}</span>'
            f'<span class="pn-hn">{bie(titre(e))}</span>{plus}</summary>{corps}</details></li>')

def historique(gs, src):
    return '<ul class="pn-hist">' + "".join(ligne_groupe(g, src) for g in gs) + "</ul>" if gs else ""

def section_site(site):
    gs = groupes(site["entrees"]); der = max(site["entrees"], key=lambda e: vers(e["version"]))
    return (f'<details class="pn-site"><summary>{bi("Site", "Site")} · v{html.escape(der["version"])}'
            f'<small>{bi("barre, onglets, « Ma partie », langue…", "bar, tabs, “My save”, language…")}</small></summary>'
            + historique(gs, "site") + '</details>')

JS = """
(function(){
  var r = document.getElementById('journal'); if(!r) return;
  var b = r.querySelector('.pn-btn'), p = r.querySelector('.pn-panel'), x = r.querySelector('.pn-x');
  var KO = 'ficsit-tools:vu2:' + r.dataset.outil, KS = 'ficsit-tools:vu2:site', V = {outil: r.dataset.v, site: r.dataset.sv};
  var K = {outil: KO, site: KS}, vu = {outil: null, site: null};
  try{ localStorage.removeItem('ficsit-tools:vu:' + r.dataset.outil); }catch(e){}
  try{ vu.outil = localStorage.getItem(KO); vu.site = localStorage.getItem(KS); }catch(e){}
  function seg(s){ var n = s.split('.').map(Number); while(n.length < 3) n.push(0); return n; }
  function cmp(a, c){ a = seg(a); c = seg(c);
    for(var i = 0; i < Math.max(a.length, c.length); i++){ var d = (a[i] || 0) - (c[i] || 0); if(d) return d; } return 0; }
  var RANG = {feat: 3, aj: 2, fix: 1}, haut = 0;
  r.querySelectorAll('[data-v]').forEach(function(e){
    var s = e.dataset.src, v = vu[s];
    if(v === null) { if(RANG[e.dataset.niv] > haut) haut = RANG[e.dataset.niv]; return; }
    if(cmp(e.dataset.v, v) <= 0) return;
    e.classList.add('pn-new'); if(RANG[e.dataset.niv] > haut) haut = RANG[e.dataset.niv];
    if(e.tagName === 'SUMMARY' || e.tagName === 'LI'){ var pt = document.createElement('i'); pt.className = 'pn-pt'; pt.setAttribute('aria-hidden', 'true');
      (e.tagName === 'LI' ? e.querySelector('.n') : e.querySelector('.pn-hn')).appendChild(pt); }
    for(var d = e.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true;
  });
  function niveau(){ r.classList.toggle('pn-neuf', haut >= 3); r.classList.toggle('pn-ajust', haut === 2); }
  niveau();
  // replis (versions, ajustements, journal Site) : ouverts au survol, gardés ouverts au clic ; un second clic les ferme.
  // Sans survol (tactile), le clic ouvre et ferme. Un repli ouvert d'office (nouveautés, dernière version) est déjà gardé.
  var survol = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  r.querySelectorAll('details.pn-g, details.pn-aj, details.pn-site').forEach(function(d){
    var sm = d.querySelector(':scope > summary'), t;
    d.dataset.pin = d.open ? '1' : '';
    sm.addEventListener('click', function(e){
      e.preventDefault(); clearTimeout(t);
      if(d.open && d.dataset.pin === '1'){ d.open = false; d.dataset.pin = ''; } else { d.open = true; d.dataset.pin = '1'; }
    });
    if(!survol) return;
    d.addEventListener('mouseenter', function(){ clearTimeout(t); if(!d.open) t = setTimeout(function(){ d.open = true; d.dataset.pin = ''; }, 110); });
    d.addEventListener('mouseleave', function(){ clearTimeout(t); if(d.open && d.dataset.pin !== '1') t = setTimeout(function(){ d.open = false; }, 180); });
  });
  function ouvrir(o){
    p.hidden = !o; b.setAttribute('aria-expanded', o);
    if(o){ haut = 0; niveau(); try{ localStorage.setItem(KO, V.outil); if(V.site) localStorage.setItem(KS, V.site); }catch(e){} }
  }
  b.addEventListener('click', function(e){ e.stopPropagation(); ouvrir(p.hidden); });
  x.addEventListener('click', function(){ ouvrir(false); b.focus(); });
  document.addEventListener('click', function(e){ if(!p.hidden && !r.contains(e.target)) ouvrir(false); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !p.hidden){ ouvrir(false); b.focus(); } });
})();
"""

ICONE_JOURNAL = ('<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5h8v11H3z"/>'
                 '<path d="M5 4.5h4M5 7h4M5 9.5h2.5"/></svg>')

def bloc(fichier, outil, icone, site):
    gs = groupes(outil["entrees"])
    der = max(outil["entrees"], key=lambda e: vers(e["version"])); v = html.escape(der["version"])
    sder = max(site["entrees"], key=lambda e: vers(e["version"]))["version"]
    slot = f'<span class="pn-slot"><img src="{icone}" alt=""></span>' if icone else ""
    date = der["date"]
    h = [START, f'<style>{CSS.strip()}</style>',
         f'<div class="pn" id="journal" data-fdock data-outil="{html.escape(fichier)}" data-v="{v}" data-sv="{html.escape(sder)}">',
         f'<button type="button" class="pn-btn" aria-expanded="false" aria-controls="pn-panel" '
         f'data-fr-title="Journal des révisions : ce qui a changé" data-en-title="Revision log: what changed" '
         f'title="Journal des révisions : ce qui a changé">'
         f'<span class="pn-dot" aria-hidden="true"></span>{ICONE_JOURNAL}<span>v{v}</span></button>',
         f'<div class="pn-panel" id="pn-panel" role="region" aria-labelledby="pn-titre" hidden><div class="pn-hz"></div>',
         f'<div class="pn-head">{slot}<div><div class="pn-title" id="pn-titre" role="heading" aria-level="2">'
         f'{bi("Journal des révisions", "Revision log")}</div>',
         f'<p class="pn-sub">{bi(f"Version {v}, mise à jour le {fr(date)}", f"Version {v}, updated {en(date)}")}</p></div>'
         f'<button type="button" class="pn-x" data-fr-aria-label="Fermer" data-en-aria-label="Close" aria-label="Fermer">×</button></div>',
         bloc_courant(gs[0], "outil"), historique(gs[1:], "outil"), section_site(site),
         '<div class="pn-foot"></div></div></div>',
         f'<script>{JS.strip()}</script>', END]
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

def md_journal(es):
    L = []
    for g in groupes(es):
        e = g["tete"]; t = titre(e)
        L += [f"### v{e['version']} — {t['fr']} ({fr(e['date'])})", "", e["texte"]["fr"], "", f"*EN — {t['en']}. {e['texte']['en']}*", ""]
        for k in g["enfants"]:
            marque = "  - " if niveau(k["version"]) == "fix" else "- "
            L += [f"{marque}{'correctif ' if niveau(k['version']) == 'fix' else ''}**{k['version']}** ({fr(k['date'])}) : {k['texte']['fr']}",
                  f"{'    ' if marque.startswith('  ') else '  '}*EN — {k['texte']['en']}*"]
        if g["enfants"]: L.append("")
    return L

def changelog_md(data):
    L = ["# Journal des révisions", "", "Généré depuis `changelog.json` par `scripts/patchnotes.py` — ne pas éditer à la main.",
         "Version x.y.0 : fonctionnalité ; x.y.z : ajustement ; x.y.z.w : correctif de bug (rangé sous l'ajustement z).", "",
         f"## {data['site']['nom']['fr']} / {data['site']['nom']['en']} — journal commun", ""] + md_journal(data["site"]["entrees"])
    for f, o in data["outils"].items():
        L += [f"## {o['nom']['fr']} / {o['nom']['en']} — `{f}`", ""] + md_journal(o["entrees"])
    (ROOT / "CHANGELOG.md").write_text("\n".join(L), encoding="utf-8")

if __name__ == "__main__":
    data = json.loads((ROOT / "changelog.json").read_text(encoding="utf-8"))
    verifier("site", data["site"]["entrees"])
    for f, o in data["outils"].items(): verifier(f, o["entrees"])
    ic = icones()
    for f, o in data["outils"].items():
        injecter(f, bloc(f, o, ic.get(f), data["site"]))
        print(f"{f} : v{max(o['entrees'], key=lambda e: vers(e['version']))['version']} ({len(o['entrees'])} entrée(s))")
    changelog_md(data)
    print("CHANGELOG.md régénéré")
