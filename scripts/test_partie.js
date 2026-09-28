#!/usr/bin/env node
/* Test de l'import de sauvegarde (commun/ficsit-partie-worker.js, parseur de commun/vendor/), sans vraie partie
   dans le dépôt :
   - extraction : un objet de sauvegarde tel que le parseur le rend, à la structure relevée sur des sauvegardes
     réelles (gestionnaires de recettes, de schémas et de recherche, disques durs en attente de choix) ;
   - refus : fichier trop court, en-tête incohérent (format), version antérieure à la 1.0 (ancienne) ;
   - référentiel : chaque schéma proposé par un disque dur est connu, avec ses recettes (FicsitAlternatives) ;
   - lecteur rapide : sauvegardes synthétiques au format du jeu (en-tête, blocs zlib, listes et structures
     HardDriveData), dans les deux formats d'en-tête de propriété (1.0-1.1 et 1.2).
   Avec FICSIT_SAVES=<dossier>, lit en plus chaque .sav de ce dossier avec les deux lecteurs et vérifie qu'ils
   donnent le même résultat.
   Usage : node scripts/test_partie.js   (code de sortie 1 en cas d'échec). */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
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

// ---------- lecteur rapide : sauvegardes synthétiques ----------
const i32 = n => { const b = Buffer.alloc(4); b.writeInt32LE(n); return b; };
const i64 = n => { const b = Buffer.alloc(8); b.writeBigInt64LE(BigInt(n)); return b; };
const fs_ = x => x === '' ? i32(0) : Buffer.concat([i32(x.length + 1), Buffer.from(x + '\0', 'latin1')]);
const refB = c => Buffer.concat([fs_(''), fs_(`/Game/FactoryGame/X/${c.slice(0, -2)}.${c}`)]);
const tete = (nom, type, taille, v12) => v12   // 1.2 : nouvel en-tête de propriété ; 1.0-1.1 : taille, index, garde
  ? Buffer.concat([fs_(nom), fs_(type), i32(0), i32(taille), Buffer.from([0])])
  : Buffer.concat([fs_(nom), fs_(type), i64(taille), Buffer.from([0])]);
const tabB = (nom, classes, v12) => { const e = Buffer.concat([i32(classes.length), ...classes.map(refB)]);
  return Buffer.concat([tete(nom, 'ArrayProperty', e.length, v12), fs_('ObjectProperty'), e]); };
const entier = (nom, v, v12) => Buffer.concat([tete(nom, 'IntProperty', 4, v12), i32(v)]);
const disqueB = (id, schemas, rel, v12) => Buffer.concat([entier('HardDriveID', id, v12), tabB('PendingRewards', schemas, v12),
  ...(rel != null ? [entier('PendingRewardsRerollsExecuted', rel, v12)] : []), fs_('None')]);
function sauvegarde({entete, version, v12, recettes, schemas, disques}){
  const corps = Buffer.concat([Buffer.alloc(64, 7), tabB('mAvailableRecipes', recettes, v12), Buffer.alloc(32, 3),
    tabB('mPurchasedSchematics', schemas, v12), Buffer.alloc(24, 5),
    ...(disques ? [tete('mUnclaimedHardDriveData', 'ArrayProperty', 999, v12), fs_('StructProperty'), i32(disques.length),
      ...disques.map(d => disqueB(...d, v12)), entier('mLastUsedHardDriveID', 42, v12)] : []), fs_('None'), Buffer.alloc(16)]);
  const t = [i32(entete), i32(version), i32(123)];
  if(entete >= 14) t.push(fs_('fichier'));
  t.push(fs_('Persistent_Level'), fs_('?opts'), fs_('Partie'), i32(7200), i64(638000000000000000n), Buffer.alloc(40));
  const blocs = [];
  for(let o = 0; o < corps.length; o += 100){            // plusieurs blocs, comme le jeu
    const brut = corps.subarray(o, o + 100), z = zlib.deflateSync(brut);
    blocs.push(Buffer.from([0xC1, 0x83, 0x2A, 0x9E]), i32(0x22222222), Buffer.from([0]), i32(131072), i32(0x03000000),
      i64(z.length), i64(brut.length), i64(z.length), i64(brut.length), z);
  }
  return Buffer.concat([...t, ...blocs]);
}
const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.length);

(async () => {
  const R = ['Recipe_IngotIron_C', 'Recipe_Alternate_PureIronIngot_C', 'Recipe_IngotIron_C'], S = ['Schematic_3-2_C'];
  const DD = [[8, ['Schematic_Alternate_CopperIngot_Tempered_C', 'Schematic_Alternate_Coal1_C'], 0],
              [16, ['Schematic_Alternate_Motor1_C'], 2], [17, ['Schematic_Alternate_Cable1_C', 'Schematic_Alternate_Rotor_C'], null]];
  for(const [cas, o] of [['1.0', {entete: 13, version: 46, v12: false}], ['1.1', {entete: 14, version: 52, v12: false}], ['1.2', {entete: 14, version: 58, v12: true}]]){
    try{
      const q = await L.rapide(ab(sauvegarde(Object.assign({recettes: R, schemas: S, disques: DD}, o))));
      const att = JSON.stringify(DD.map(([id, sc, rel]) => ({id, schemas: sc, relances: rel || 0})));
      ok(q.nom === 'Partie' && q.duree === 7200 && q.recettes.length === 2 && q.schemas.join() === S.join() && JSON.stringify(q.attente) === att,
        `lecteur rapide, format ${cas} : recettes, schémas, disques en attente`);
      const sans = await L.rapide(ab(sauvegarde(Object.assign({recettes: R, schemas: S}, o))));
      ok(sans.attente.length === 0, `lecteur rapide, format ${cas} : sans disque en attente`);
    }catch(x){ echecs.push(`lecteur rapide, format ${cas} : ${x.message}`); }
  }
  let m = null; try{ await L.lire(ab(sauvegarde({entete: 13, version: 42, v12: false, recettes: R, schemas: S}))); }catch(x){ m = x.message; }
  ok(m === 'ancienne', 'lire : sauvegarde antérieure à 1.0 refusée avant tout lecteur');

  if(process.env.FICSIT_SAVES){
    const D = process.env.FICSIT_SAVES, tri = a => JSON.stringify([...a].sort());
    for(const f of fs.readdirSync(D).filter(f => f.endsWith('.sav'))){
      const b = fs.readFileSync(path.join(D, f));
      let r, c; try{ r = await L.lire(ab(b)); c = L.analyser(ab(b)); }catch(x){ console.log(`      ${f} : ${x.message}`); continue; }
      ok(r.lecteur === 'rapide' && tri(r.recettes) === tri(c.recettes) && tri(r.schemas) === tri(c.schemas)
        && JSON.stringify(r.attente) === JSON.stringify(c.attente) && r.nom === c.nom && r.duree === c.duree,
        `${f} : lecteur rapide = parseur complet (v${r.version}, ${r.recettes.length} recettes, ${r.attente.length} disque(s) en attente)`);
    }
  }
  if(echecs.length){ console.error(echecs.map(m => 'ÉCHEC ' + m).join('\n')); process.exit(1); }
})();
