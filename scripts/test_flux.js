#!/usr/bin/env node
/* Tests du calcul de débit du Depot (depot-dimensionnel-flux.js) sur de petites usines synthétiques, résultats attendus
   calculés à la main. Usage : node scripts/test_flux.js (depuis la racine). Code de sortie 1 en cas d'échec. */
const path = require('path');
const {FicsitFlux: F} = require(path.resolve(__dirname, '..', 'depot-dimensionnel-flux.js'));

let echecs = 0;
const proche = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
function ok(nom, cond, detail){
  console.log(`${cond ? 'ok  ' : 'ÉCHEC'} ${nom}${cond ? '' : ' : ' + detail}`);
  if(!cond) echecs++;
}

// référentiel minimal : une recette « Plaque » (1 minerai → 1 plaque en 6 s, soit 10 minerai /min à 100 %)
const P = {rec: {R: ['Plaque', 6, [['ore', 1]], [['plate', 1]]]}, pile: {}, noeuds: {}, pw: {}, liq: []};
const mineur = extra => Object.assign({c: 'Build_MinerMk1_C', res: 'x', item: 'ore', pur: 'pure'}, extra);
const UPL = {c: 'Build_CentralStorage_C'};
const usine = (batis, liens, extra) => Object.assign({batis, liens, depot: {}}, extra);
const totaux = (u, opts) => F.calculer(u, P, opts).uploaders.map(x => x.total);
const libre = {libre: true};   // sans la vitesse d'envoi de l'Uploader ni son raccord : ce que la chaîne fournit

// 1. Mineur Mk1 pur : 60 × 2 = 120 /min ; Mk3 impur : 240 × ½ = 120 /min
{
  const u = usine([mineur(), UPL], [[0, 'Output0', 1, 'Input0']]);
  ok('mineur Mk1 pur : 120 /min', proche(totaux(u, libre)[0], 120), totaux(u, libre));
  const v = usine([mineur({c: 'Build_MinerMk3_C', pur: 'impure'}), UPL], [[0, 'Output0', 1, 'Input0']]);
  ok('mineur Mk3 impur : 120 /min', proche(totaux(v, libre)[0], 120), totaux(v, libre));
  const c = usine([mineur({clk: 0.5, pur: 'normal'}), UPL], [[0, 'Output0', 1, 'Input0']]);
  ok('mineur normal à 50 % : 30 /min', proche(totaux(c, libre)[0], 30), totaux(c, libre));
}

// 2. Vitesse d'envoi de l'Uploader : 15 /min, doublée à chaque recherche du MAM (palier 02 : ×4 = 60)
{
  const l = [[0, 'Output0', 1, 'Input0']];
  ok('Uploader : plafond d\'envoi 15 /min', proche(totaux(usine([mineur(), UPL], l))[0], 15), totaux(usine([mineur(), UPL], l)));
  const D = F.deux(usine([mineur(), UPL], l, {extensions: ['CentralUploadBoost_02_C']}), P);
  ok('Uploader : envoi 60 /min après deux recherches', proche(D.reel.U, 60) && proche(D.reel.uploaders[0].potentiel, 60), D.reel.U);
  ok('Uploader : le frein est l\'envoi', D.reel.uploaders[0].facteur === 'envoi', D.reel.uploaders[0].facteur);
  ok('Uploader : item reconnu', D.reel.uploaders[0].item === 'ore', D.reel.uploaders[0].item);
}

// 3. Plafond d'un convoyeur au milieu de la chaîne (Mk1 : 60 /min) ; l'amont libre ne le contourne pas
{
  const u = usine([mineur(), {c: 'Build_ConveyorBeltMk1_C'}, {c: 'Build_ConveyorAttachmentMerger_C'}, {c: 'Build_ConveyorBeltMk6_C'}, UPL],
    [[0, 'Output0', 1, 'ConveyorAny0'], [1, 'ConveyorAny1', 2, 'Input0'], [2, 'Output0', 3, 'ConveyorAny0'], [3, 'ConveyorAny1', 4, 'Input0']]);
  ok('convoyeur Mk1 : 120 → 60 /min', proche(totaux(u, libre)[0], 60), totaux(u, libre));
}

// 4. Séparateur : parts égales entre deux Uploaders
{
  const u = usine([mineur({pur: 'normal'}), {c: 'Build_ConveyorAttachmentSplitterSmart_C'}, UPL, UPL],
    [[0, 'Output0', 1, 'Input0'], [1, 'Output1', 2, 'Input0'], [1, 'Output2', 3, 'Input0']]);
  const t = totaux(u, libre);
  ok('séparateur : 60 → 30 + 30', proche(t[0], 30) && proche(t[1], 30), t);
}

// 5. Machine : recette × cadence, limitée par l'ingrédient disponible
{
  const l = [[0, 'Output0', 1, 'Input0'], [1, 'Output0', 2, 'Input0']];
  const a = usine([mineur({pur: 'normal'}), {c: 'Build_ConstructorMk1_C', rec: 'R', clk: 0.5}, UPL], l);
  ok('constructeur à 50 % : 5 plaques /min (limité par la machine)', proche(totaux(a, libre)[0], 5), totaux(a, libre));
  const b = usine([mineur({pur: 'impure', clk: 0.1}), {c: 'Build_ConstructorMk1_C', rec: 'R'}, UPL], l);
  ok('constructeur : 3 plaques /min (limité par le minerai, 60 × ½ × 0,1)', proche(totaux(b, libre)[0], 3), totaux(b, libre));
  const c = usine([mineur({pur: 'normal'}), {c: 'Build_ConstructorMk1_C', rec: 'R'}, UPL], l);
  const r = F.calculer(c, P, libre).uploaders[0];
  ok('constructeur à 100 % : 10 plaques /min, rien d\'autre en sortie', proche(r.total, 10) && Object.keys(r.recu).join() === 'plate', JSON.stringify(r.recu));
}

// 6. Électricité : un circuit au fusible grillé arrête ses bâtiments
{
  const u = usine([mineur({circ: 0}), UPL], [[0, 'Output0', 1, 'Input0']], {circuitsL: [{id: 1, grille: true}]});
  ok('fusible grillé : mineur à l\'arrêt', proche(totaux(u, libre)[0], 0), totaux(u, libre));
  const v = usine([mineur({circ: 0}), UPL], [[0, 'Output0', 1, 'Input0']], {circuitsL: [{id: 1, grille: false}]});
  ok('circuit sain : mineur en marche', proche(totaux(v, libre)[0], 120), totaux(v, libre));
}

// 7. Utilitaires
ok('slug', F.slug('Desc_IronOre_C') === 'desc-ironore-c', F.slug('Desc_IronOre_C'));

if(echecs){ console.log(`${echecs} échec(s)`); process.exit(1); }
console.log('flux du Depot : tous les tests passent');
