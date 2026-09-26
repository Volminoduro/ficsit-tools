#!/usr/bin/env node
/* Précalcul des combinaisons de satisfactory_infographie.html. La page calcule elle-même les combinaisons de
   chaque palier (tcRows), sauf pour les critères de PRECALC, trop longs en direct (matière : jusqu'à 30 s par palier,
   à cause des chaînes à égalité) : ceux-là sont précalculés ici dans la clé « tc ».
   Usage : node scripts/paliers_combinaisons.js satisfactory_infographie.html [registre|tc] [mw|mat|esp|syn] [--ecrire]
     registre (défaut) combinaisons sans plafond de palier → clés combi (énergie), combiM (matière), combiE (espace)
              et combiS (synthèse, à poids égaux). Une ligne par cible : indices de la chaîne tout en base et de
              l'optimum, plus la pire chaîne et le nombre de chaînes distinctes, obtenus par énumération complète tant
              qu'il y en a au plus PLAFOND. La page n'en lit que la pire chaîne et le nombre de chaînes.
     tc       mise au point : ce que la page calcule (tcRows) pour chaque palier, sur la sortie standard ;
              mw|mat|esp|syn restreint à un critère.
     --ecrire écrit le registre et tc (critères de PRECALC seulement) dans le payload de la page.
   Une chaîne distincte = une recette par item, cohérente sur tout l'arbre (un item produit deux fois l'est par la même
   recette), sans boucle et de coût fini. Les cibles sont celles du registre déjà présent dans la page.
   Le modèle de coût et la recherche exacte sont ceux de la page, entre les marqueurs MOTEUR:START et MOTEUR:END,
   repris tels quels du HTML : synthèse comprise, aux poids par défaut (SYN_W0) et aux taux de change que la page
   calcule (synTaux). */
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const P = JSON.parse(html.match(/<script id="payload" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const js = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
// Code partagé : entre les marqueurs MOTEUR:START et MOTEUR:END de la page (échec explicite s'ils manquent).
const i0 = js.indexOf('/* MOTEUR:START'), i1 = js.indexOf('/* MOTEUR:END */');
if(i0 < 0 || i1 < i0){ console.error('marqueurs MOTEUR:START / MOTEUR:END introuvables dans', process.argv[2]); process.exit(1); }
const helpers = js.slice(i0, i1);
const ENGINE = String.raw`
/* critères : énergie (mw), matière (mat), espace au sol (esp), synthèse (syn) ; clé du registre sans plafond pour chacun */
const MODES = ['mw', 'mat', 'esp', 'syn'], REGISTRE = {mw: 'combi', mat: 'combiM', esp: 'combiE', syn: 'combiS'};
/* ---------- paliers : disponibilité et recherche exacte des chaînes ---------- */
const TMAX = Math.max(...D.map(r=>r.t));
let cap = TMAX;
const availCache = {};
function availFor(c){
  if(c in availCache) return availCache[c];
  const items = new Set(), rec = new Set();
  let ch = true;
  while(ch){ ch = false;
    for(const r of D){
      if(rec.has(r) || r.t > c) continue;
      if(r.ig.every(g=>isRaw(g[0]) || items.has(g[0]))){
        rec.add(r); ch = true; items.add(r.p); r.by.forEach(b=>items.add(b[0])); }
    }
  }
  return availCache[c] = {rec, items};
}
const isAvail = r => availFor(cap).rec.has(r);
const filtered = () => cap < TMAX;
/* Énumération complète des chaînes cohérentes d'une cible, pour le registre : nombre de chaînes et pire
   indice par critère. S'arrête dès que tous les critères dépassent « plafond » chaînes. */
function enumChains(target, c, plafond){
  const choice = {}, n = {}, pire = {};
  MODES.forEach(m=>{ n[m] = 0; pire[m] = 0; });
  let stop = false;
  const rec = pending => {
    if(stop) return;
    let it = null;
    while(pending.length){ const x = pending.pop(); if(!isRaw(x) && !(x in choice)){ it = x; break; } }
    if(!it){
      for(const m of MODES){ const cst = costWith(target, choice, m);
        if(cst != null){ n[m]++; if(cst > pire[m]) pire[m] = cst; } }
      stop = MODES.every(m => n[m] > plafond);
      return;
    }
    for(const o of optsOf(it, c)){
      choice[it] = o; const np = pending.slice(); o.r.ig.forEach(g=>np.push(g[0])); rec(np); delete choice[it];
      if(stop) return;
    }
  };
  rec([target]);
  return m => n[m] > plafond ? {nb: '>' + plafond, pire: null} : {nb: n[m], pire: n[m] ? 1/pire[m] : null};
}
`;
const args = process.argv.slice(3);
const quoi = args.includes('tc') ? 'tc' : 'registre';
const PRECALC = ['mat'];   // critères dont les combinaisons par palier sont précalculées (trop longs dans la page)
const modes = args.filter(a=>['mw', 'mat', 'esp', 'syn'].includes(a));
const run = new Function('P', 'quoi', 'modes', 'PRECALC', 'const D = P.d;\n' + helpers + ENGINE + `
setBudget(100000);
const out = {};
if(quoi === 'tc'){ out.tc = {};
  for(const m of (modes.length ? modes : MODES)){ out.tc[m] = {};
    for(let c = 0; c <= TMAX; c++){ out.tc[m][c] = tcRows(m, c); console.error('tc', m, 'palier', c); }
  }
}
if(quoi !== 'tc'){
  out.tc = {};
  for(const m of PRECALC){ out.tc[m] = {};
    for(let c = 0; c <= TMAX; c++){ out.tc[m][c] = tcRows(m, c); console.error('tc', m, 'palier', c); } }
  const PLAFOND = 1000000, cibles = P.combi.map(t=>t.cible), en = {};
  cibles.forEach(t=>{ en[t] = enumChains(t, TMAX, PLAFOND); console.error('registre', t, en[t]('mw').nb); });
  for(const m of MODES){
    const combi = [];
    for(const t of cibles){
      const r = searchChains(t, m, TMAX, 1, 3e6), d = searchChains(t, m, TMAX, 1, 3e6, null, true);
      const e = en[t](m), o = r.list[0], dd = d.list[0] ? d.list[0].score : null;
      combi.push({cible: t, idx_defaut: dd, idx_optimal: o.score, gain_pct: dd ? o.score/dd*100-100 : null,
        idx_pire: e.pire, nb_chaines: e.nb, combinaisons_brutes: brutes(t, TMAX),
        nb_alternatives_optimales: o.alts.length, alternatives_optimales: o.alts.join(' | ')});
    }
    out[REGISTRE[m]] = combi;
  }
}
return out;`);
const out = run(P, quoi, modes, PRECALC);
if(args.includes('--ecrire')){
  const re = /(<script id="payload" type="application\/json">)([\s\S]*?)(<\/script>)/;
  if(quoi === 'tc'){ console.error('--ecrire : seul le registre s\'écrit dans la page'); process.exit(2); }
  fs.writeFileSync(process.argv[2], html.replace(re, (_, a, b, z)=>a + JSON.stringify(Object.assign(P, out)) + z));
  console.error('écrit dans', process.argv[2], ':', Object.keys(out).join(', '));
} else process.stdout.write(JSON.stringify(quoi === 'tc' ? out.tc : out));
