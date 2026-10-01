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

if(echecs){ console.log(`${echecs} échec(s)`); process.exit(1); }
console.log('planificateur : tous les tests passent');
