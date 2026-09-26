#!/usr/bin/env node
/* Test du lecteur de sauvegardes (commun/ficsit-partie.js), sans vraie partie dans le dépôt : fabrique de petites
   sauvegardes synthétiques au format du jeu — en-tête, blocs zlib signés, listes mAvailableRecipes et
   mPurchasedSchematics — dans les deux formats d'en-tête de propriété (1.0-1.1 et 1.2), et vérifie la lecture.
   Usage : node scripts/test_partie.js   (code de sortie 1 en cas d'échec). */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
global.window = global;
eval(fs.readFileSync(path.join(__dirname, '..', 'commun', 'ficsit-partie.js'), 'utf8'));

const i32 = n => { const b = Buffer.alloc(4); b.writeInt32LE(n); return b; };
const i64 = n => { const b = Buffer.alloc(8); b.writeBigInt64LE(BigInt(n)); return b; };
const fstr = s => s === '' ? i32(0) : Buffer.concat([i32(s.length + 1), Buffer.from(s + '\0', 'latin1')]);
const ref = c => Buffer.concat([fstr(''), fstr(`/Game/FactoryGame/Recipes/X/${c.slice(0, -2)}.${c}`)]);
function tableau(nom, classes, v12){
  const entrees = Buffer.concat([i32(classes.length), ...classes.map(ref)]);
  const tete = v12   // 1.2 : nouvel en-tête de propriété ; 1.0-1.1 : taille, index, type interne, garde
    ? Buffer.concat([fstr(nom), fstr('ArrayProperty'), i32(1), fstr('ObjectProperty'), i32(0), Buffer.from([0]), i32(entrees.length), i32(0)])
    : Buffer.concat([fstr(nom), fstr('ArrayProperty'), i64(entrees.length), fstr('ObjectProperty'), Buffer.from([0])]);
  return Buffer.concat([tete, entrees]);
}
function sauvegarde({entete, version, nom, recettes, schemas, v12}){
  const corps = Buffer.concat([Buffer.alloc(64, 7), tableau('mAvailableRecipes', recettes, v12), Buffer.alloc(32, 3),
    tableau('mPurchasedSchematics', schemas, v12), Buffer.alloc(16)]);
  const tete = [i32(entete), i32(version), i32(123)];
  if(entete >= 14) tete.push(fstr('fichier'));
  tete.push(fstr('Persistent_Level'), fstr('?opts'), fstr(nom), i32(7200), i64(638000000000000000n), Buffer.alloc(40));
  const blocs = [];
  for(let o = 0; o < corps.length; o += 100){            // plusieurs blocs, comme le jeu
    const brut = corps.subarray(o, o + 100), z = zlib.deflateSync(brut);
    blocs.push(Buffer.from([0xC1, 0x83, 0x2A, 0x9E]), i32(0x22222222), Buffer.from([0]), i32(131072), i32(0x03000000),
      i64(z.length), i64(brut.length), i64(z.length), i64(brut.length), z);
  }
  return Buffer.concat([...tete, ...blocs]);
}
const blob = b => ({arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length)});

(async () => {
  const echecs = [], R = ['Recipe_IngotIron_C', 'Recipe_Alternate_PureIronIngot_C', 'Recipe_Alternate_SteelScrew_C', 'Recipe_IngotIron_C'];
  const S = ['Schematic_1-1_C', 'Schematic_3-2_C', 'Schematic_Tutorial1_C'];
  for(const [cas, o] of [['1.0', {entete: 13, version: 46, v12: false}], ['1.1', {entete: 14, version: 52, v12: false}], ['1.2', {entete: 14, version: 58, v12: true}]]){
    try{
      const p = await FicsitPartie.lire(blob(sauvegarde(Object.assign({nom: 'Partie ' + cas, recettes: R, schemas: S}, o))));
      const att = {nom: 'Partie ' + cas, recettes: 3, alt: 2, palier: 3, duree: 7200};
      const eu = {nom: p.nom, recettes: p.recettes.length, alt: FicsitPartie.alternatives(p), palier: FicsitPartie.palier(p), duree: p.duree};
      if(JSON.stringify(att) !== JSON.stringify(eu)) echecs.push(`${cas} : attendu ${JSON.stringify(att)}, lu ${JSON.stringify(eu)}`);
      console.log(`ok    sauvegarde ${cas} : ${JSON.stringify(eu)}`);
    }catch(e){ echecs.push(`${cas} : ${e.message}`); }
  }
  try{ await FicsitPartie.lire(blob(sauvegarde({entete: 13, version: 42, nom: 'vieille', recettes: R, schemas: S}))); echecs.push('sauvegarde antérieure à 1.0 acceptée'); }
  catch(e){ if(e.message !== 'ancienne') echecs.push('ancienne : message ' + e.message); else console.log('ok    sauvegarde antérieure à 1.0 refusée'); }
  if(echecs.length){ console.error(echecs.join('\n')); process.exit(1); }
})();
