#!/usr/bin/env node
/* Test de l'import de sauvegarde (commun/ficsit-partie-worker.js, parseur de commun/vendor/), sans vraie partie
   dans le dépôt :
   - extraction : un objet de sauvegarde tel que le parseur le rend, à la structure relevée sur des sauvegardes
     réelles (gestionnaires de recettes, de schémas et de recherche, disques durs en attente de choix) ;
   - refus : fichier trop court, en-tête incohérent (format), version antérieure à la 1.0 (ancienne) ;
   - référentiel : chaque schéma proposé par un disque dur est connu, avec ses recettes (FicsitAlternatives).
   Avec FICSIT_SAVES=<dossier>, lit en plus chaque .sav de ce dossier avec le vrai parseur et en résume l'import.
   Usage : node scripts/test_partie.js   (code de sortie 1 en cas d'échec). */
const fs = require('fs'), path = require('path');
const C = path.join(__dirname, '..', 'commun');
global.self = global;
eval(fs.readFileSync(path.join(C, 'vendor', 'satisfactory-file-parser.js'), 'utf8'));
global.SatisfactoryFileParser = SatisfactoryFileParser;
eval(fs.readFileSync(path.join(C, 'ficsit-partie-worker.js'), 'utf8'));
const L = global.FicsitPartieLecteur, echecs = [];
const ok = (c, msg) => { if(c) console.log('ok    ' + msg); else echecs.push(msg); };

const ref = c => ({levelName: '', pathName: `/Game/FactoryGame/X/${c.slice(0, -2)}.${c}`});
const tab = (nom, classes) => ({[nom]: {type: 'ArrayProperty', name: nom, values: classes.map(ref)}});
const dd = (id, schemas, relances) => ({type: 'HardDriveData', properties: {
  HardDriveID: {type: 'IntProperty', value: id},
  PendingRewards: {type: 'ArrayProperty', values: schemas.map(ref)},
  PendingRewardsRerollsExecuted: {type: 'IntProperty', value: relances}}});
const save = {header: {sessionName: 'Essai', saveDateTime: '1769828760000', playDurationSeconds: 7200, saveVersion: 58},
  levels: {a: {objects: [{typePath: '/Script/Autre.Truc', properties: {}}]},
    Persistent_Level: {objects: [
      {typePath: '/Script/FactoryGame.FGRecipeManager', properties: tab('mAvailableRecipes',
        ['Recipe_IngotIron_C', 'Recipe_Alternate_PureIronIngot_C', 'Recipe_Alternate_PureIronIngot_C'])},
      {typePath: '/Game/FactoryGame/Schematics/Progression/BP_SchematicManager.BP_SchematicManager_C',
        properties: tab('mPurchasedSchematics', ['Schematic_3-2_C', 'Schematic_Alternate_PureIronIngot_C'])},
      {typePath: '/Game/FactoryGame/Recipes/Research/BP_ResearchManager.BP_ResearchManager_C', properties: {
        mUnclaimedHardDriveData: {type: 'ArrayProperty', values: [
          dd(8, ['Schematic_Alternate_CopperIngot_Tempered_C', 'Schematic_Alternate_Coal1_C'], 0),
          dd(9, ['Schematic_Alternate_InventorySlots2_C', 'Schematic_Alternate_Motor1_C'], 1)]}}}]}}};
const p = L.extraire(save);
ok(p.nom === 'Essai' && p.duree === 7200 && p.version === 58 && p.date === '2026-01-31T03:06:00.000Z', 'en-tête : nom, durée, version, date');
ok(JSON.stringify(p.recettes) === '["Recipe_IngotIron_C","Recipe_Alternate_PureIronIngot_C"]', 'recettes débloquées, sans doublon');
ok(p.schemas.length === 2, 'schémas obtenus');
ok(p.attente.length === 2 && p.attente[0].id === 8 && p.attente[1].relances === 1
  && p.attente[0].schemas.join() === 'Schematic_Alternate_CopperIngot_Tempered_C,Schematic_Alternate_Coal1_C', 'disques durs en attente de choix');
let e = null; try{ L.extraire({header: {}, levels: {}}); }catch(x){ e = x.message; }
ok(e === 'recettes', 'sauvegarde sans gestionnaire de recettes refusée');

const tampon = (entete, version, n = 200) => { const b = new ArrayBuffer(n), v = new DataView(b); v.setInt32(0, entete, true); v.setInt32(4, version, true); return b; };
for(const [b, att, msg] of [[new ArrayBuffer(10), 'format', 'fichier trop court'], [tampon(7777, 58), 'format', 'en-tête incohérent'],
  [tampon(13, 42), 'ancienne', 'sauvegarde antérieure à 1.0'], [tampon(14, 58), 'format', 'corps illisible']]){
  let m = null; try{ L.analyser(b); }catch(x){ m = x.message; }
  ok(m === att, `${msg} → ${att}`);
}

// référentiel partagé : schémas de disques durs et recettes, tels que langue.py les assemble
const js = fs.readFileSync(path.join(C, 'ficsit-commun.js'), 'utf8');
const A = JSON.parse(js.match(/window\.FicsitAlternatives=(\{.*?\});\n/)[1]);
const inconnus = ['Schematic_Alternate_CopperIngot_Tempered_C', 'Schematic_Alternate_Coal1_C', 'Schematic_Alternate_Motor1_C']
  .filter(s => !A.disques[s] || !A.disques[s][1].some(c => A.recettes[c]));
ok(!inconnus.length, 'schémas de disques durs rattachés à leurs recettes' + (inconnus.length ? ' : ' + inconnus : ''));
ok(Object.keys(A.recettes).length > 90, `${Object.keys(A.recettes).length} alternatives dans le référentiel partagé`);

if(process.env.FICSIT_SAVES){
  const D = process.env.FICSIT_SAVES;
  for(const f of fs.readdirSync(D).filter(f => f.endsWith('.sav'))){
    const b = fs.readFileSync(path.join(D, f)), t0 = Date.now();
    try{
      const q = L.analyser(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
      console.log(`      ${f} : v${q.version}, ${q.recettes.length} recettes, ${q.attente.length} disque(s) en attente, ${Date.now() - t0} ms`);
    }catch(x){ console.log(`      ${f} : ${x.message}`); }
  }
}
if(echecs.length){ console.error(echecs.map(m => 'ÉCHEC ' + m).join('\n')); process.exit(1); }
