#!/usr/bin/env node
/* Tests du moteur du planificateur (planner-moteur.js) sur le payload de planner.html : résultats attendus, calculés
   à la main depuis les recettes du jeu. Usage : node scripts/test_planner.js (depuis la racine). Code de sortie 1 en cas d'échec. */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'planner-moteur.js'));
const html = fs.readFileSync(path.join(ROOT, 'planner.html'), 'utf8');
const P = JSON.parse(/<script id="payload" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1]);

let echecs = 0;
const proche = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
function ok(nom, cond, detail){
  console.log(`${cond ? 'ok  ' : 'ÉCHEC'} ${nom}${cond ? '' : ' : ' + detail}`);
  if(!cond) echecs++;
}
const etape = (R, item) => R.etapes.find(e => e.item === item);
const standard = r => !r.alt;

// 1. Plaques de fer renforcées, 5 /min (recettes standard) : 30 plaques, 60 vis (15 tiges), 60 lingots → 60 minerai de fer
{
  const R = M.calculer(P, [{item: 'Reinforced Iron Plate', debit: 5}], {permise: standard});
  ok('RIP : minerai de fer', proche(R.bruts['Iron Ore'], 60), JSON.stringify(R.bruts));
  ok('RIP : une seule ressource', Object.keys(R.bruts).length === 1, JSON.stringify(R.bruts));
  ok('RIP : 1 assembleuse à 100 %', etape(R, 'Reinforced Iron Plate').entieres === 1 && proche(etape(R, 'Reinforced Iron Plate').cadence, 1), '');
  ok('RIP : 1,5 constructeur de plaques → 2 à 75 %', etape(R, 'Iron Plate').entieres === 2 && proche(etape(R, 'Iron Plate').cadence, .75),
    JSON.stringify(etape(R, 'Iron Plate')));
  ok('RIP : 2 hauts fourneaux', proche(etape(R, 'Iron Ingot').machines, 2), '');
  ok('RIP : ordre aval → amont', R.etapes[0].item === 'Reinforced Iron Plate' && R.etapes[R.etapes.length - 1].item === 'Iron Ingot',
    R.etapes.map(e => e.item).join(' > '));
  ok('RIP : convergé, rien en surplus', R.converge && !Object.keys(R.surplus).length, JSON.stringify(R.surplus));
  // MW : assembleuse + plaques et vis, 2 constructeurs à 75 % chacune (MW × 0,75^exposant) + 1 constructeur de tiges
  // (15 /min, pile 100 %) + 2 hauts fourneaux
  const B = P.b, e = B.Constructor[1];
  const attendu = B.Assembler[0] + 4 * B.Constructor[0] * Math.pow(.75, e) + B.Constructor[0] + B.Smelter[0] * 2;
  ok('RIP : MW', proche(R.mw, attendu), `${R.mw} ≠ ${attendu}`);
}

// 2. Plastique, 20 /min : 10 raffineries ; résidu lourd (sous-produit) en surplus, 30 pétrole brut
{
  const R = M.calculer(P, [{item: 'Plastic', debit: 20}], {permise: standard});
  ok('plastique : pétrole', proche(R.bruts['Crude Oil'], 30), JSON.stringify(R.bruts));
  ok('plastique : résidu lourd en surplus', proche(R.surplus['Heavy Oil Residue'], 10), JSON.stringify(R.surplus));
}

// 3. Sous-produit réutilisé : plastique + caoutchouc, le résidu lourd en carburant (recette imposée)
{
  const R = M.calculer(P, [{item: 'Plastic', debit: 20}, {item: 'Fuel', debit: 10}], {permise: () => true,
    choix: {'Fuel': 'Recipe_ResidualFuel_C'}});
  // carburant résiduel : 6 résidu → 4 carburant ; 10 carburant demandent 15 résidu, le plastique en donne 10 : 5 à produire
  ok('résidu : pas de surplus', !R.surplus['Heavy Oil Residue'], JSON.stringify(R.surplus));
  ok('résidu : carburant résiduel retenu', etape(R, 'Fuel') && etape(R, 'Fuel').recette.classe === 'Recipe_ResidualFuel_C',
    JSON.stringify(R.etapes.map(e => [e.item, e.recette.classe])));
  ok('résidu : convergé', R.converge, R.iterations);
  ok('résidu : pas d\'emballage', !R.etapes.some(e => e.recette.machine === 'Packager'), R.etapes.map(e => e.recette.nom).join(', '));
}

// 3b. Tous les items fabricables, 10 /min, toutes recettes : le calcul se stabilise toujours avec les choix par défaut
{
  const items = [...new Set(P.r.flatMap(r => r[7].map(p => p[0])))];
  const ko = items.filter(i => !M.calculer(P, [{item: i, debit: 10}], {permise: () => true}).converge);
  ok('défauts : tout converge', !ko.length, ko.join(', '));
  const ko2 = items.filter(i => !M.calculer(P, [{item: i, debit: 10}], {permise: standard}).converge);
  ok('défauts standard : tout converge', !ko2.length, ko2.join(', '));
}

// 4. « Fourni » : l'item quitte la chaîne et passe en ressources
{
  const R = M.calculer(P, [{item: 'Reinforced Iron Plate', debit: 5}], {permise: standard, choix: {'Iron Plate': 'brut'}});
  ok('fourni : plaques en ressources', proche(R.bruts['Iron Plate'], 30), JSON.stringify(R.bruts));
  ok('fourni : plus d\'étape plaques', !etape(R, 'Iron Plate'), '');
}

// 5. Recette non permise : l'item est signalé manquant
{
  const R = M.calculer(P, [{item: 'Plastic', debit: 10}], {permise: r => r.palier <= 0});
  ok('palier 0 : plastique manquant', R.manquants.includes('Plastic'), JSON.stringify(R.manquants));
}

// 6. Les candidates : produit principal standard d'abord
{
  const c = M.candidates(P, 'Iron Plate', () => true);
  ok('candidates : standard en tête', c[0].classe === 'Recipe_IronPlate_C' && c.length >= 3, c.map(r => r.classe).join(', '));
}

// 7. Usine existante : capacité installée (cadence, Somersloops), écart au plan, préférence pour ses recettes
{
  const batis = [
    {c: 'Build_ConstructorMk1_C', rec: 'Recipe_IronPlate_C', clk: 1.5, prod: 0.5},     // 30 plaques /min
    {c: 'Build_ConstructorMk1_C', rec: 'Recipe_IronPlate_C', sloops: 1, prod: 1},      // 20 × 2 = 40 plaques /min
    {c: 'Build_FoundryMk1_C', rec: 'Recipe_Alternate_IngotIron_C'},                     // fer en fonderie (alternative)
    {c: 'Build_ConveyorBeltMk1_C'},                                                     // sans recette : ignoré
  ];
  const I = M.installe(P, batis);
  ok('installé : 2 constructeurs de plaques', I.Recipe_IronPlate_C && I.Recipe_IronPlate_C.n === 2, JSON.stringify(I));
  ok('installé : 35 exécutions /min', proche(I.Recipe_IronPlate_C.exec, 35), I.Recipe_IronPlate_C.exec);
  ok('installé : productivité moyenne', proche(I.Recipe_IronPlate_C.prod, .75), I.Recipe_IronPlate_C.prod);
  const R = M.calculer(P, [{item: 'Iron Plate', debit: 100}], {permise: () => true, preferees: new Set(Object.keys(I))});
  const e = M.ecart(etape(R, 'Iron Plate'), I);
  ok('écart : 70 installées, 30 manquent, 1,5 machine', proche(e.installe, 70) && proche(e.manque, 30) && proche(e.machines, 1.5), JSON.stringify(e));
  ok('préférées : lingots en fonderie', etape(R, 'Iron Ingot').recette.classe === 'Recipe_Alternate_IngotIron_C',
    etape(R, 'Iron Ingot').recette.classe);
  const R2 = M.calculer(P, [{item: 'Iron Plate', debit: 100}], {permise: () => true});
  ok('sans préférence : lingots au haut fourneau', etape(R2, 'Iron Ingot').recette.classe === 'Recipe_IngotIron_C', etape(R2, 'Iron Ingot').recette.classe);
  const e2 = M.ecart(etape(R2, 'Iron Ingot'), I);
  ok('écart : recette absente de l\'usine', e2.n === 0 && proche(e2.manque, e2.besoin), JSON.stringify(e2));
}

// 7b. Graphe : chaque étape reçoit exactement ses entrées, chaque objectif son débit, chaque ressource donne ce qu'elle apporte
function conservation(nom, R, cibles){
  const G = M.graphe(R, cibles), entre = {}, sort = {};
  G.liens.forEach(l => { entre[l.vers + '|' + l.item] = (entre[l.vers + '|' + l.item] || 0) + l.debit;
    sort[l.de + '|' + l.item] = (sort[l.de + '|' + l.item] || 0) + l.debit; });
  const ko = [];
  G.noeuds.forEach(n => {
    if(n.type === 'etape') n.etape.entrees.forEach(([i, v]) => {
      const auto = n.etape.sorties.some(s => s[0] === i);   // une étape qui consomme son propre produit n'a pas de lien vers elle-même
      if(!auto && !proche(entre[n.id + '|' + i] || 0, v)) ko.push(`${n.item} ← ${i} : ${entre[n.id + '|' + i]} ≠ ${v}`);
    });
    if(n.type === 'cible' || n.type === 'surplus') { if(!proche(entre[n.id + '|' + n.item] || 0, n.debit)) ko.push(`${n.type} ${n.item}`); }
    if(n.type === 'brut') { if(!proche(sort[n.id + '|' + n.item] || 0, n.debit)) ko.push(`brut ${n.item}`); }
  });
  const col = new Map(G.noeuds.map(n => [n.id, n.col]));
  const brutsAvant = G.liens.filter(l => l.de.startsWith('b:')).every(l => col.get(l.de) === col.get(l.vers) + 1
    || col.get(l.de) > col.get(l.vers));
  const brutsColles = G.noeuds.filter(n => n.type === 'brut').every(n => G.liens.some(l => l.de === n.id && col.get(l.vers) === n.col - 1));
  ok(`graphe ${nom} : débits conservés`, !ko.length, ko.slice(0, 3).join(' ; '));
  ok(`graphe ${nom} : ressources juste avant leur consommateur le plus en amont`, brutsAvant && brutsColles, '');
  ok(`graphe ${nom} : objectifs à droite`, G.noeuds.filter(n => n.type === 'cible').every(n => n.col === 0), '');
  ok(`graphe ${nom} : liens toujours vers la droite`, G.liens.every(l => col.get(l.de) > col.get(l.vers) || l.de.startsWith('e') && l.vers.startsWith('e')), '');
  return G;
}
{
  const c = [{item: 'Reinforced Iron Plate', debit: 5}];
  const G = conservation('RIP', M.calculer(P, c, {permise: standard}), c);
  ok('graphe RIP : 5 étapes, 1 ressource, 1 objectif', G.noeuds.length === 7, G.noeuds.map(n => n.id).join(' '));
  const c2 = [{item: 'Plastic', debit: 20}];
  const G2 = conservation('plastique', M.calculer(P, c2, {permise: standard}), c2);
  ok('graphe plastique : résidu lourd vers le surplus', G2.liens.some(l => l.vers === 's:Heavy Oil Residue' && proche(l.debit, 10)), JSON.stringify(G2.liens));
}

// 7c. Convoyeurs et montage
{
  const D = {conv: P.conv.map((c, k) => [c[0], 'Mk.' + (k + 1)]), tuy: P.tuy.map((c, k) => [c[0], 'Mk.' + (k + 1)])};
  ok('convoyeur : 100 /min sur Mk.2', M.convoyeur(100, false, D).nom === 'Mk.2', JSON.stringify(M.convoyeur(100, false, D)));
  ok('convoyeur : 60 /min tient sur Mk.1', M.convoyeur(60, false, D).nom === 'Mk.1', '');
  ok('convoyeur : 1 500 /min sur 2 × Mk.6', M.convoyeur(1500, false, D).n === 2 && M.convoyeur(1500, false, D).nom === 'Mk.6', '');
  ok('tuyau : 350 m³/min sur Mk.2', M.convoyeur(350, true, D).nom === 'Mk.2', '');
  ok('convoyeur : rien de débloqué', M.convoyeur(10, true, {conv: D.conv, tuy: []}) === null, '');
  const q = n => M.equilibre(n);
  ok('équilibrage 4 : 2 × 2, 3 séparateurs', q(4).m === 4 && q(4).separateurs === 3 && !q(4).boucle, JSON.stringify(q(4)));
  ok('équilibrage 6 : 2 puis 3, 3 séparateurs', q(6).facteurs.join() === '2,3' && q(6).separateurs === 3, JSON.stringify(q(6)));
  ok('équilibrage 9 : 3 × 3, 4 séparateurs', q(9).separateurs === 4, JSON.stringify(q(9)));
  ok('équilibrage 5 : vise 6, 1 sortie en boucle', q(5).m === 6 && q(5).boucle === 1, JSON.stringify(q(5)));
  for(let n = 2; n <= 40; n++){ const r = q(n); if(!(r.m >= n && r.m === r.facteurs.reduce((a, b) => a * b, 1))) ok('équilibrage ' + n, false, JSON.stringify(r)); }
  // 5 constructeurs de plaques (150 lingots) : équilibrage avec boucle, la ligne d'entrée porte 180 /min (6 × 30)
  const R = M.calculer(P, [{item: 'Iron Plate', debit: 100}], {permise: standard}), e = etape(R, 'Iron Plate');
  ok('5 constructeurs pour 100 plaques', e.entieres === 5, e.entieres);
  const mo = M.montage(e, 'equilibre', D, new Set(P.liq)), ent = mo.entrees[0];
  ok('équilibrage : ligne à 180 /min (boucle comprise) sur Mk.3', proche(ent.debitLigne, 180) && ent.ligne.nom === 'Mk.3', JSON.stringify(ent));
  ok('équilibrage : branches finales à 30 /min sur Mk.1', proche(ent.etages[ent.etages.length - 1].debit, 30) && ent.branche.nom === 'Mk.1', '');
  ok('équilibrage : 3 séparateurs et 1 groupeur de boucle', ent.separateurs === 3 && ent.groupeurs === 1 && ent.boucle === 1, '');
  ok('équilibrage : sorties réunies par un seul collecteur (4 groupeurs)', mo.sorties[0].mode === 'manifold' && mo.sorties[0].groupeurs === 4, JSON.stringify(mo.sorties[0]));
  const ma = M.montage(e, 'manifold', D, new Set(P.liq));
  ok('manifold : 4 séparateurs, ligne à 150 /min sur Mk.3', ma.entrees[0].separateurs === 4 && proche(ma.entrees[0].debitLigne, 150) && ma.entrees[0].ligne.nom === 'Mk.3', JSON.stringify(ma.entrees[0]));
  ok('manifold : 4 groupeurs en sortie', ma.sorties[0].groupeurs === 4, '');
  // fluides : tuyau en manifold même en mode équilibrage
  const Rp = M.calculer(P, [{item: 'Plastic', debit: 40}], {permise: standard}), ep = etape(Rp, 'Plastic');
  const mp = M.montage(ep, 'equilibre', D, new Set(P.liq));
  ok('fluide : pétrole en manifold même en équilibrage', mp.entrees[0].liquide && mp.entrees[0].mode === 'manifold', JSON.stringify(mp.entrees[0]));
  // une seule machine : direct
  const R1 = M.calculer(P, [{item: 'Iron Plate', debit: 10}], {permise: standard});
  ok('1 machine : montage direct', M.montage(etape(R1, 'Iron Plate'), 'equilibre', D, new Set(P.liq)).entrees[0].mode === 'direct', '');
}

// 8. Optimisation (HiGHS) : jamais pire que le choix simple, recettes imposées et items fournis respectés
const rarete = b => Object.keys(b).reduce((s, i) => s + b[i] * (P.rare[i] || 0), 0);
require(path.join(ROOT, 'commun', 'vendor', 'highs.js'))().then(H => {
  const tout = () => true, cible = [{item: 'Reinforced Iron Plate', debit: 5}];
  const O = M.optimiser(P, cible, {permise: tout}, H), C = M.calculer(P, cible, {permise: tout});
  ok('optimisé : RIP sans manquant', O && !O.manquants.length, O && O.manquants);
  ok('optimisé : moins de ressources que le choix simple', rarete(O.bruts) < rarete(C.bruts) - 1e-6, `${rarete(O.bruts)} ≥ ${rarete(C.bruts)}`);
  ok('optimisé : 5 RIP produites', proche(O.etapes.filter(e => e.item === 'Reinforced Iron Plate').reduce((s, e) => s + e.sorties[0][1], 0), 5), '');
  const E = M.optimiser(P, cible, {permise: tout, critere: 'energie'}, H);
  ok('énergie : pas plus de MW que le choix simple', E.mw <= C.mw + 1e-6, `${E.mw} > ${C.mw}`);
  ok('énergie : pas plus de MW que l\'optimum ressources', E.mw <= O.mw + 1e-6, `${E.mw} > ${O.mw}`);
  // place : moins de m² au sol que le choix simple et que les autres optima ; synthèse : jamais pire que le standard
  const esp = R => M.mesures(P, R).esp, Pl = M.optimiser(P, cible, {permise: tout, critere: 'place'}, H);
  ok('place : pas plus de m² que le choix simple', esp(Pl) <= esp(C) + 1e-6, `${esp(Pl)} > ${esp(C)}`);
  ok('place : pas plus de m² que l\'optimum énergie', esp(Pl) <= esp(E) + 1e-6, `${esp(Pl)} > ${esp(E)}`);
  const ref = M.mesures(P, C), score = R => { const m = M.mesures(P, R); return m.mat / ref.mat + m.mw / ref.mw + m.esp / ref.esp; };
  const Sy = M.optimiser(P, cible, {permise: tout, critere: 'synthese', poids: {mat: 1, mw: 1, esp: 1}, ref}, H);
  ok('synthèse : mieux que le standard sur la somme des trois', score(Sy) < 3 - 1e-6, score(Sy));
  ok('synthèse : pas pire que chaque optimum seul', [O, E, Pl].every(R => score(Sy) <= score(R) + 0.05), [Sy, O, E, Pl].map(score).join(' / '));
  const SyE = M.optimiser(P, cible, {permise: tout, critere: 'synthese', poids: {mat: 0, mw: 0, esp: 1}, ref}, H);
  ok('synthèse place seule = optimum place', esp(SyE) <= esp(Pl) + 1e-6, `${esp(SyE)} > ${esp(Pl)}`);
  // grosse chaîne : jamais d'objectif « apporté » pour éviter une chaîne chère (pénalité dépassée par des milliers de MW)
  const gros = [{item: 'Ballistic Warp Drive', debit: 1}];
  for(const k of ['energie', 'place']){
    const g = M.optimiser(P, gros, {permise: tout, critere: k}, H);
    ok(`${k} : warp drive fabriqué, sans manquant`, g && !g.manquants.length && g.etapes.length > 10, g && [g.etapes.length, g.manquants]);
  }
  // recettes standard seulement : une seule chaîne possible, la même que le choix simple
  const S = M.optimiser(P, cible, {permise: standard}, H);
  ok('standard : 60 minerai de fer comme le choix simple', proche(S.bruts['Iron Ore'], 60), JSON.stringify(S.bruts));
  // recette imposée : seule recette dont l'item est le produit principal
  const F = M.optimiser(P, [{item: 'Iron Plate', debit: 60}], {permise: tout, choix: {'Iron Plate': 'Recipe_IronPlate_C'}}, H);
  ok('imposée : plaques par le constructeur seulement', F.etapes.filter(e => e.recette.prod[0][0] === 'Iron Plate').every(e => e.recette.classe === 'Recipe_IronPlate_C'),
    F.etapes.map(e => e.recette.classe).join(', '));
  const B = M.optimiser(P, cible, {permise: standard, choix: {'Iron Plate': 'brut'}}, H);
  ok('fourni : 30 plaques en ressources', proche(B.bruts['Iron Plate'], 30), JSON.stringify(B.bruts));
  // tous les items fabricables : résolu, et jamais plus de ressources que le choix simple quand il aboutit
  const items = [...new Set(P.r.flatMap(r => r[7].map(p => p[0])))], pires = [], echec = [];
  for(const i of items){
    const o = M.optimiser(P, [{item: i, debit: 10}], {permise: tout}, H), c = M.calculer(P, [{item: i, debit: 10}], {permise: tout});
    if(!o){ echec.push(i); continue; }
    if(c.converge && !c.manquants.length && rarete(o.bruts) > rarete(c.bruts) + 1e-6) pires.push(i);
  }
  ok(`tous les items (${items.length}) : résolus`, !echec.length, echec.join(', '));
  ok('tous les items : jamais pire que le choix simple', !pires.length, pires.join(', '));
  // graphe d'un plan optimisé (plusieurs recettes par item, sous-produits réutilisés)
  const co = [{item: 'Computer', debit: 5}, {item: 'Heavy Modular Frame', debit: 2}];
  conservation('optimisé', M.optimiser(P, co, {permise: tout}, H), co);
}).catch(e => { ok('HiGHS chargé', false, e && e.message); }).then(() => {
  if(echecs){ console.log(`${echecs} échec(s)`); process.exit(1); }
  console.log('planificateur : tous les tests passent');
});
