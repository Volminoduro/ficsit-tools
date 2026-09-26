/* FICSIT — « Ma partie » : lecture d'une sauvegarde Satisfactory (.sav, version 1.0 et plus), dans le navigateur.
   Source : commun/ficsit-partie.js, assemblée dans commun/ficsit-commun.js par scripts/langue.py.
   Le fichier ne quitte pas le navigateur : on en garde, sous la clé 'ficsit-tools:partie', le nom de la session,
   sa date, les recettes débloquées (classes Recipe_…_C, liste mAvailableRecipes du gestionnaire de recettes) et
   les schémas achetés (jalons, recherches, disques durs : mPurchasedSchematics). Les outils s'en servent ensuite
   (l'infographie : « seulement les recettes débloquées dans ma partie »).

   Format : en-tête (versions, nom, durée de jeu, date), puis blocs compressés en zlib, chacun précédé de la
   signature Unreal 0x9E2A83C1 et de ses tailles. Dans le corps décompressé, chaque liste est un tableau de
   références d'objets : pour chacune, un nom de niveau (vide) puis un chemin /Game/…/Recipe_X.Recipe_X_C ; le
   nombre d'entrées précède la première. On lit les entrées depuis la première référence qui suit le nom de la
   propriété, ce qui vaut pour l'ancien et le nouveau format d'en-tête de propriété (1.0-1.1 et 1.2).

   FicsitPartie.lire(fichier)  → Promise<partie> (Error en cas de fichier illisible ou trop ancien)
   FicsitPartie.charger()      → partie mémorisée ou null ; .enregistrer(p) ; .oublier()
   FicsitPartie.alternatives(p) → nombre de recettes alternatives débloquées ; .palier(p) → palier atteint */
(function(){
  var CLE = 'ficsit-tools:partie', SIG = [0xC1, 0x83, 0x2A, 0x9E];
  var dec = new TextDecoder('latin1'), dec16 = new TextDecoder('utf-16le');

  function chaine(v, p){                       // FString Unreal : longueur (négative = UTF-16), texte, zéro final
    var n = v.getInt32(p, true); p += 4;
    if(n === 0) return ['', p];
    if(n < 0) return [dec16.decode(new Uint8Array(v.buffer, v.byteOffset + p, -2 * n - 2)), p - 2 * n];
    return [dec.decode(new Uint8Array(v.buffer, v.byteOffset + p, n - 1)), p + n];
  }
  function cherche(b, motif, depuis){          // position d'une suite d'octets
    var m0 = motif[0], n = motif.length;
    for(var i = b.indexOf(m0, depuis || 0); i >= 0 && i <= b.length - n; i = b.indexOf(m0, i + 1)){
      var ok = true;
      for(var k = 1; k < n; k++) if(b[i + k] !== motif[k]){ ok = false; break; }
      if(ok) return i;
    }
    return -1;
  }
  function octets(s){ var a = []; for(var i = 0; i < s.length; i++) a.push(s.charCodeAt(i)); return a; }
  function liste(b, nom){                      // chemins d'un tableau de références d'objets
    var i = cherche(b, octets(nom));
    if(i < 0) return null;
    var j = cherche(b, octets('/Game/'), i);
    if(j < 0 || j - i > 400) return [];         // tableau vide : pas de référence juste après
    var v = new DataView(b.buffer, b.byteOffset), p = j - 8, n = v.getInt32(p - 4, true), out = [];
    if(n <= 0 || n > 100000) throw new Error('liste');
    for(var k = 0; k < n; k++){
      var niv = chaine(v, p); p = niv[1];
      var ch = chaine(v, p); p = ch[1];
      out.push(ch[0].slice(ch[0].lastIndexOf('.') + 1));   // …/Recipe_X.Recipe_X_C → Recipe_X_C
    }
    return out;
  }
  async function inflate(bloc){
    var flux = new Blob([bloc]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(flux).arrayBuffer());
  }

  async function lire(fichier){
    var b = new Uint8Array(await fichier.arrayBuffer()), v = new DataView(b.buffer);
    var entete = v.getInt32(0, true), version = v.getInt32(4, true);
    if(version < 46) throw new Error('ancienne');   // 46 = 1.0 : recettes antérieures incompatibles
    var p = 12, nom = '';
    if(entete >= 14) p = chaine(v, p)[1];           // nom du fichier de sauvegarde
    p = chaine(v, p)[1]; p = chaine(v, p)[1];        // carte, options
    var s = chaine(v, p); nom = s[0]; p = s[1];      // nom de la session
    var duree = v.getInt32(p, true); p += 4;
    var ticks = v.getBigInt64(p, true);
    var date = new Date(Number(ticks / 10000n) - 62135596800000);   // ticks .NET depuis l'an 1 → ms Unix
    // blocs compressés
    var parts = [], total = 0, o = cherche(b, SIG, p);
    if(o < 0) throw new Error('format');
    while(o >= 0 && o < b.length){
      if(cherche(b.subarray(o, o + 4), SIG) !== 0) throw new Error('format');
      var comp = Number(v.getBigUint64(o + 17, true)), debut = o + 49;
      var d = await inflate(b.subarray(debut, debut + comp));
      parts.push(d); total += d.length; o = debut + comp;
    }
    var corps = new Uint8Array(total), q = 0;
    parts.forEach(function(d){ corps.set(d, q); q += d.length; });
    var recettes = liste(corps, 'mAvailableRecipes'), schemas = liste(corps, 'mPurchasedSchematics');
    if(!recettes) throw new Error('recettes');
    return {nom: nom, date: date.toISOString(), duree: duree, version: version, lu: new Date().toISOString(),
      recettes: Array.from(new Set(recettes)), schemas: Array.from(new Set(schemas || []))};
  }

  function charger(){ try{ var p = JSON.parse(localStorage.getItem(CLE)); return p && p.recettes ? p : null; }catch(e){ return null; } }
  window.FicsitPartie = {
    cle: CLE, lire: lire, charger: charger,
    enregistrer: function(p){ try{ localStorage.setItem(CLE, JSON.stringify(p)); return true; }catch(e){ return false; } },
    oublier: function(){ try{ localStorage.removeItem(CLE); }catch(e){} },
    alternatives: function(p){ return p.recettes.filter(function(c){ return /Alternate/.test(c); }).length; },
    palier: function(p){
      var t = 0;
      p.schemas.forEach(function(c){ var m = /^Schematic_(\d+)-\d+_C$/.exec(c); if(m) t = Math.max(t, +m[1]); });
      return t;
    }
  };
})();
