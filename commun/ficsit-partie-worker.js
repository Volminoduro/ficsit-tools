/* FICSIT — lecture d'une sauvegarde Satisfactory (.sav) hors du fil principal : Web Worker lancé par
   commun/ficsit-partie.js. D'abord le lecteur rapide ci-dessous (les trois listes utiles, lues directement) ; s'il
   échoue, le parseur complet @etothepii/satisfactory-file-parser (commun/vendor/, voir scripts/parseur.sh), chargé
   seulement à ce moment-là. Les deux donnent le même résultat sur les sauvegardes de test (scripts/test_partie.js).
   Le fichier ne quitte pas le navigateur.
   Messages : reçoit l'ArrayBuffer du fichier ; renvoie {progres: 0…1} au fil de l'analyse, puis {partie} ou
   {erreur: 'ancienne' | 'format' | 'recettes'}.
   Hors worker (fichier ouvert en file://, où Chrome refuse les workers), la page charge ce même fichier par une
   balise <script> et appelle FicsitPartieLecteur.lire dans le fil principal.

   Ce que l'on garde de la sauvegarde (structure relevée sur des sauvegardes réelles 1.0 à 1.2, versions 46 à 58) :
   - FGRecipeManager.mAvailableRecipes : recettes débloquées (références /Game/…/Recipe_X.Recipe_X_C) ;
   - BP_SchematicManager.mPurchasedSchematics : schémas obtenus (jalons, recherches du MAM, disques durs) ;
   - BP_ResearchManager.mUnclaimedHardDriveData : disques durs analysés dont la récompense n'a pas encore été
     choisie, un HardDriveData par disque : HardDriveID, PendingRewards (schémas Schematic_Alternate_… proposés)
     et PendingRewardsRerollsExecuted (relances déjà faites). Une analyse encore en cours dans le MAM
     (mSavedOngoingResearch) n'a pas encore de choix : elle n'est pas lue. */
(function(g){
  var classe = function(ref){ var p = (ref && ref.pathName) || ''; return p.slice(p.lastIndexOf('.') + 1); };
  var valeurs = function(o, nom){ var p = o && o.properties && o.properties[nom]; return (p && p.values) || []; };
  var val = function(s, nom){ var p = s && s.properties && s.properties[nom]; return p ? p.value : undefined; };
  var uniques = function(a){ return Array.from(new Set(a.filter(Boolean))); };

  function extraire(save){
    var h = save.header || {}, gestion = {};
    Object.keys(save.levels || {}).forEach(function(k){
      (save.levels[k].objects || []).forEach(function(o){
        var m = /(Recipe|Schematic|Research)Manager/.exec(o.typePath || '');
        if(m && !gestion[m[1]]) gestion[m[1]] = o;
      });
    });
    if(!gestion.Recipe) throw new Error('recettes');
    var d = new Date(Number(h.saveDateTime));
    return {
      nom: h.sessionName || '', date: isNaN(d) ? null : d.toISOString(), duree: h.playDurationSeconds || 0,
      version: h.saveVersion, lu: new Date().toISOString(),
      recettes: uniques(valeurs(gestion.Recipe, 'mAvailableRecipes').map(classe)),
      schemas: uniques(valeurs(gestion.Schematic, 'mPurchasedSchematics').map(classe)),
      attente: valeurs(gestion.Research, 'mUnclaimedHardDriveData').map(function(s){
        var r = s.properties && s.properties.PendingRewards;
        return {id: val(s, 'HardDriveID'), schemas: uniques(((r && r.values) || []).map(classe)),
          relances: val(s, 'PendingRewardsRerollsExecuted') || 0};
      }).filter(function(a){ return a.schemas.length; })
    };
  }

  function analyser(buf, progres){   // parseur complet (synchrone)
    verifier(buf);
    var save;
    try{
      save = g.SatisfactoryFileParser.Parser.ParseSave('partie', buf, {throwErrors: false,
        onProgressCallback: function(p){ if(progres) progres(p); }});
    }catch(e){ throw new Error('format'); }
    return extraire(save);
  }

  /* ---------- lecteur rapide ----------
     Lit directement les trois listes utiles dans le corps décompressé, sans construire la sauvegarde entière :
     moins d'une seconde et peu de mémoire, même pour une grosse partie. Chaque liste est un tableau de références
     d'objets (nom de niveau vide puis chemin /Game/…/X.X_C), le nombre d'entrées juste avant la première ; cela vaut
     pour les deux formats d'en-tête de propriété (1.0-1.1 et 1.2). Disques durs en attente : suite de structures
     HardDriveData (HardDriveID, PendingRewards, PendingRewardsRerollsExecuted, None) ; la valeur d'une propriété
     entière est toujours les 4 octets qui précèdent le nom de la propriété suivante. Au moindre doute (structure
     inattendue, valeur incohérente), erreur : lire() se replie alors sur le parseur complet. */
  var dec = new TextDecoder('latin1'), dec16 = new TextDecoder('utf-16le');
  function chaine(v, p){                       // FString Unreal : longueur (négative = UTF-16), texte, zéro final
    var n = v.getInt32(p, true); p += 4;
    if(n === 0) return ['', p];
    if(n < -1e6 || n > 1e6) throw new Error('rapide');
    if(n < 0) return [dec16.decode(new Uint8Array(v.buffer, v.byteOffset + p, -2 * n - 2)), p - 2 * n];
    return [dec.decode(new Uint8Array(v.buffer, v.byteOffset + p, n - 1)), p + n];
  }
  function octets(s){ var a = []; for(var i = 0; i < s.length; i++) a.push(s.charCodeAt(i)); return a; }
  function fstr(s){ var n = s.length + 1; return [n & 255, (n >> 8) & 255, 0, 0].concat(octets(s), [0]); }   // FString sérialisée
  function cherche(b, motif, depuis, jusqua){
    var m0 = motif[0], n = motif.length, fin = Math.min(jusqua == null ? b.length : jusqua, b.length) - n;
    for(var i = b.indexOf(m0, depuis || 0); i >= 0 && i <= fin; i = b.indexOf(m0, i + 1)){
      var ok = true;
      for(var k = 1; k < n; k++) if(b[i + k] !== motif[k]){ ok = false; break; }
      if(ok) return i;
    }
    return -1;
  }
  var GAME = octets('/Game/');
  function refs(b, v, depuis, jusqua){         // tableau de références qui suit « depuis » : [classes, fin]
    var j = cherche(b, GAME, depuis, jusqua);
    if(j < 0) return [[], depuis];
    var p = j - 8, n = v.getInt32(p - 4, true), out = [];
    if(n <= 0 || n > 100000) throw new Error('rapide');
    for(var k = 0; k < n; k++){
      var niv = chaine(v, p); p = niv[1];
      var ch = chaine(v, p); p = ch[1];
      if(ch[0].indexOf('/') !== 0) throw new Error('rapide');
      out.push(ch[0].slice(ch[0].lastIndexOf('.') + 1));
    }
    return [out, p];
  }
  function liste(b, v, nom){
    var i = cherche(b, fstr(nom));
    if(i < 0) return null;
    return refs(b, v, i, i + 400)[0];            // tableau vide : pas de référence juste après
  }
  var HD = fstr('HardDriveID'), PR = fstr('PendingRewards'), RR = fstr('PendingRewardsRerollsExecuted'), NONE = fstr('None');
  function disques(b, v){
    var i = cherche(b, fstr('mUnclaimedHardDriveData'));
    if(i < 0) return [];
    var out = [], p = cherche(b, HD, i, i + 600);
    while(p >= 0){
      var q = cherche(b, PR, p, p + 400);
      if(q < 0) throw new Error('rapide');
      var id = v.getInt32(q - 4, true), fin = cherche(b, NONE, q), r = cherche(b, RR, q, fin);
      if(fin < 0 || id < 0 || id > 100000) throw new Error('rapide');
      var lu = refs(b, v, q, fin), rel = r >= 0 ? v.getInt32(fin - 4, true) : 0;
      if(rel < 0 || rel > 1000 || lu[0].some(function(c){ return !/^Schematic_/.test(c); })) throw new Error('rapide');
      if(lu[0].length) out.push({id: id, schemas: uniques(lu[0]), relances: rel});
      p = fin + NONE.length;
      if(cherche(b, HD, p, p + HD.length) !== p) break;   // structure suivante collée à la précédente, sinon fin du tableau
    }
    return out;
  }
  async function inflate(bloc){
    var flux = new Blob([bloc]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(flux).arrayBuffer());
  }
  var SIG = [0xC1, 0x83, 0x2A, 0x9E];
  async function rapide(buf, progres){
    var b = new Uint8Array(buf), v = new DataView(buf), entete = v.getInt32(0, true), p = 12;
    if(entete >= 14) p = chaine(v, p)[1];         // nom du fichier de sauvegarde
    p = chaine(v, p)[1]; p = chaine(v, p)[1];      // carte, options
    var s = chaine(v, p), nom = s[0]; p = s[1];    // nom de la session
    var duree = v.getInt32(p, true), ticks = v.getBigInt64(p + 4, true);
    var date = new Date(Number(ticks / 10000n) - 62135596800000);   // ticks .NET depuis l'an 1 → ms Unix
    var parts = [], total = 0, o = cherche(b, SIG, p);
    if(o < 0) throw new Error('rapide');
    while(o >= 0 && o < b.length){
      if(cherche(b, SIG, o, o + 4) !== o) throw new Error('rapide');
      var comp = Number(v.getBigUint64(o + 17, true)), debut = o + 49;
      var d = await inflate(b.subarray(debut, debut + comp));
      parts.push(d); total += d.length; o = debut + comp;
      if(progres) progres(o / b.length);
    }
    var corps = new Uint8Array(total), q = 0;
    parts.forEach(function(d){ corps.set(d, q); q += d.length; });
    var cv = new DataView(corps.buffer), recettes = liste(corps, cv, 'mAvailableRecipes');
    if(!recettes || !recettes.length) throw new Error('rapide');
    return {nom: nom, date: isNaN(date) ? null : date.toISOString(), duree: duree, version: v.getInt32(4, true),
      lu: new Date().toISOString(), recettes: uniques(recettes), schemas: uniques(liste(corps, cv, 'mPurchasedSchematics') || []),
      attente: disques(corps, cv), lecteur: 'rapide'};
  }

  function verifier(buf){
    if(!buf || buf.byteLength < 64) throw new Error('format');
    var v = new DataView(buf), entete = v.getInt32(0, true), version = v.getInt32(4, true);
    if(entete < 0 || entete > 100 || version < 0 || version > 1000) throw new Error('format');
    if(version < 46) throw new Error('ancienne');   // 46 = 1.0 : recettes antérieures incompatibles
  }
  /* lire : lecteur rapide, puis, s'il échoue, parseur complet (chargé seulement à ce moment : charger()). */
  function lire(buf, progres, charger){
    try{ verifier(buf); }catch(e){ return Promise.reject(e); }
    return rapide(buf, progres).catch(function(){
      return Promise.resolve(charger ? charger() : null).then(function(){
        var p = analyser(buf, progres); p.lecteur = 'complet'; return p;
      });
    });
  }

  g.FicsitPartieLecteur = {extraire: extraire, analyser: analyser, rapide: rapide, lire: lire};

  if(typeof document === 'undefined' && typeof importScripts === 'function'){   // dans le worker
    var dernier = -1;
    g.onmessage = function(e){
      lire(e.data, function(p){
        var q = Math.round(p * 100);
        if(q !== dernier){ dernier = q; g.postMessage({progres: p}); }
      }, function(){ if(!g.SatisfactoryFileParser) importScripts('vendor/satisfactory-file-parser.js'); })
        .then(function(partie){ g.postMessage({partie: partie}); })
        .catch(function(err){ g.postMessage({erreur: err.message || 'format'}); });
    };
  }
})(self);
