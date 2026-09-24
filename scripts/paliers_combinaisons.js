#!/usr/bin/env node
/* Précalcul des combinaisons de recettes de satisfactory_infographie.html.
   Usage : node scripts/paliers_combinaisons.js satisfactory_infographie.html [tc|registre|tout] [mw|mat|esp] [--ecrire]
     tc       (défaut) combinaisons optimales pour chaque palier → clé "tc" du payload.
     registre combinaisons sans plafond de palier → clés combi (énergie), combiM (matière) et combiE (espace).
     tout     les deux.
     mw|mat|esp restreint tc à un critère (mise au point).
     --ecrire écrit le résultat dans le payload de la page au lieu de la sortie standard.
   tc : {"mw":{"0":[...],...,"9":[...]},"mat":{...},"esp":{...}}. Chaque ligne : c = cible, d = indice de la chaîne tout en base,
   o = indice optimal, n = combinaisons brutes, x = recherche prouvée exacte, top = 3 meilleures chaînes [indice, alternatives].
   registre : combi = une ligne par cible (mêmes indices que tc au dernier palier, plus la pire chaîne et le nombre de
   chaînes distinctes, obtenus par énumération complète tant qu'il y en a au plus PLAFOND). La page n'en lit que la pire
   chaîne et le nombre de chaînes : le reste (podium, fréquences) se recalcule depuis tc au dernier palier.
   Une chaîne distincte = une recette par item, cohérente sur tout l'arbre (un item produit deux fois l'est par la même
   recette), sans boucle et de coût fini. Les cibles sont celles du registre déjà présent dans la page.
   Le modèle de coût est celui de la page (fonctions RAWE…costWith reprises telles quelles du HTML). */
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const P = JSON.parse(html.match(/<script id="payload" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const js = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
const helpers = js.slice(js.indexOf('const RAWE'), js.indexOf('function usedItems'));
const ENGINE = String.raw`
/* critères : énergie (mw), matière (mat), espace au sol (esp) ; clé du registre sans plafond pour chacun */
const MODES = ['mw', 'mat', 'esp'], REGISTRE = {mw: 'combi', mat: 'combiM', esp: 'combiE'};
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
const isAltLike = r => !!r.a || r.n === 'Distilled Silica';
function optsOf(it, c){
  const av = availFor(c).rec;
  const out = (MAIN[it]||[]).filter(r=>av.has(r)).map(r=>({k:'m', r}));
  if(!MAIN[it]) (BYSRC[it]||[]).filter(r=>av.has(r)).forEach(r=>out.push({k:'b', r}));
  return out;
}
const rawVal = (it, m) => { const c = rawCost(it, m); return c == null ? Infinity : c; };
function unitCost(o, it, m, val){
  const den = outRate(o, it);
  let t = recCost(o.r, m);
  for(const g of o.r.ig){ t += g[2]/den*val(g[0]); if(t === Infinity) break; }
  return t;
}
/* Borne inférieure : coût minimal de chaque item sans exiger la cohérence (une recette par item).
   Elle est exacte dès que les meilleurs choix ne forment pas de boucle ; sinon on la resserre
   en remplaçant chaque valeur par l'optimum cohérent de l'item pris comme cible. */
const lbCache = {};
let LB_BUDGET = 20000;
function lbFor(c, m){
  const key = c + '|' + m;
  if(lbCache[key]) return lbCache[key];
  const items = [...availFor(c).items].filter(it=>!isRaw(it));
  const LB = {}; items.forEach(it=>LB[it] = Infinity);
  const val = it => isRaw(it) ? rawVal(it, m) : (it in LB ? LB[it] : Infinity);
  for(let k = 0, ch = true; ch && k < 100; k++){ ch = false;
    for(const it of items) for(const o of optsOf(it, c)){
      const t = unitCost(o, it, m, val);
      if(t < LB[it] - 1e-15 * Math.max(1, LB[it] === Infinity ? 1 : LB[it])){ LB[it] = t; ch = true; } } }
  const order = items.filter(it=>LB[it] < Infinity).sort((a,b)=>LB[a]-LB[b]);
  for(let pass = 0; pass < 3; pass++){ let changed = false;
    for(const it of order){
      const r = searchChains(it, m, c, 1, LB_BUDGET, LB);
      if(!r.aborted && r.list.length && r.list[0].cost > LB[it] * (1 + 1e-12)){ LB[it] = r.list[0].cost; changed = true; }
    }
    if(!changed) break;
  }
  return lbCache[key] = LB;
}
function boundCost(target, choice, LB, m){
  const memo = {};
  const cost = (it, stack)=>{
    if(it in memo) return memo[it];
    if(isRaw(it)) return rawVal(it, m);
    const ch = choice[it];
    if(!ch) return it in LB ? LB[it] : Infinity;
    if(stack.has(it)) return Infinity;
    const den = outRate(ch, it), s2 = new Set(stack).add(it);
    let t = recCost(ch.r, m);
    for(const g of ch.r.ig){ t += g[2]/den*cost(g[0], s2); if(t === Infinity) return memo[it] = Infinity; }
    return memo[it] = t;
  };
  return cost(target, new Set());
}
const setBudget = n => { LB_BUDGET = n; };
const altsOfChoice = choice => [...new Set(Object.values(choice).filter(x=>isAltLike(x.r)).map(x=>x.r.n))].sort();
/* Les K meilleures chaînes distinctes (par jeu de recettes alternatives), recherche exacte par
   séparation-évaluation. baseOnly : recettes de base partout où il en existe une de débloquée. */
function searchChains(target, m, c, K, maxNodes, LB, baseOnly){
  LB = LB || lbFor(c, m);
  const best = new Map(), choice = {}, ranked = {};
  let nodes = 0, T = Infinity, aborted = false;
  const val = it => isRaw(it) ? rawVal(it, m) : (it in LB ? LB[it] : Infinity);
  const optsFor = it => ranked[it] || (ranked[it] = (()=>{
    let os = optsOf(it, c);
    if(baseOnly){ const b = os.filter(o=>!isAltLike(o.r)); if(b.length) os = b;
      const mains = os.filter(o=>o.k==='m' && !isAltLike(o.r));
      if(mains.length) os = [mains.reduce((x,y)=>((y.r.i||0) > (x.r.i||0) ? y : x))]; }
    return os.map(o=>({o, t: unitCost(o, it, m, val)})).sort((a,b)=>a.t-b.t).map(x=>x.o);
  })());
  const rec = pending => {
    if(aborted) return;
    if(++nodes > maxNodes){ aborted = true; return; }
    let it = null;
    while(pending.length){ const x = pending.pop(); if(!isRaw(x) && !(x in choice)){ it = x; break; } }
    if(!it){
      const cst = costWith(target, choice, m);
      if(cst == null) return;
      const alts = altsOfChoice(choice), key = alts.join('|');
      if(!best.has(key) || best.get(key).cost > cst){
        best.set(key, {cost: cst, alts, choice: Object.assign({}, choice)});
        if(best.size >= K) T = [...best.values()].map(v=>v.cost).sort((a,b)=>a-b)[K-1];
      }
      return;
    }
    for(const o of optsFor(it)){
      choice[it] = o;
      if(boundCost(target, choice, LB, m) < T * (1 - 1e-12)){
        const np = pending.slice(); o.r.ig.forEach(g=>np.push(g[0])); rec(np); }
      delete choice[it];
      if(aborted) return;
    }
  };
  rec([target]);
  const list = [...best.values()].sort((a,b)=>a.cost-b.cost).slice(0, K)
    .map(v=>({score: 1/v.cost, cost: v.cost, alts: v.alts, choice: v.choice}));
  return {list, nodes, aborted};
}
/* Énumération complète des chaînes cohérentes d'une cible, pour le registre : nombre de chaînes et pire
   indice par critère. S'arrête dès que tous les critères dépassent « plafond » chaînes. */
function enumChains(target, c, plafond){
  const choice = {}, n = {mw: 0, mat: 0, esp: 0}, pire = {mw: 0, mat: 0, esp: 0};
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
function brutes(target, c){
  const reach = new Set(), st = [target];
  while(st.length){ const it = st.pop(); if(reach.has(it) || isRaw(it)) continue; reach.add(it);
    optsOf(it, c).forEach(o=>o.r.ig.forEach(g=>st.push(g[0]))); }
  let n = 1n; reach.forEach(it=>{ n *= BigInt(Math.max(1, optsOf(it, c).length)); });
  return Number(n);
}
`;
const args = process.argv.slice(3);
const quoi = args.find(a=>['tc', 'registre', 'tout'].includes(a)) || 'tc';
const modes = args.filter(a=>a==='mw' || a==='mat' || a==='esp');
const run = new Function('P', 'quoi', 'modes', 'const D = P.d;\n' + helpers + ENGINE + `
setBudget(100000);
const out = {};
if(quoi !== 'registre'){ out.tc = {};
  for(const m of (modes.length ? modes : MODES)){ out.tc[m] = {};
    for(let c = 0; c <= TMAX; c++){
      const rows = [];
      for(const t of P.combi){
        if(!availFor(c).items.has(t.cible)) continue;
        const r = searchChains(t.cible, m, c, 3, 3e6), d = searchChains(t.cible, m, c, 1, 3e6, null, true);
        rows.push({c: t.cible, d: d.list[0] ? d.list[0].score : null, o: r.list[0].score, n: brutes(t.cible, c),
          x: !r.aborted && !d.aborted, top: r.list.map(x=>[x.score, x.alts])});
      }
      out.tc[m][c] = rows; console.error('tc', m, 'palier', c, rows.length, 'cibles');
    }
  }
}
if(quoi !== 'tc'){
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
const out = run(P, quoi, modes);
if(args.includes('--ecrire')){
  const re = /(<script id="payload" type="application\/json">)([\s\S]*?)(<\/script>)/;
  fs.writeFileSync(process.argv[2], html.replace(re, (_, a, b, z)=>a + JSON.stringify(Object.assign(P, out)) + z));
  console.error('écrit dans', process.argv[2], ':', Object.keys(out).join(', '));
} else process.stdout.write(JSON.stringify(quoi === 'tc' ? out.tc : out));
