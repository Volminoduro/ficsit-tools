/* FICSIT — lecture de l'usine d'une sauvegarde Satisfactory (.sav) hors du fil principal, pour l'outil
   « Débit vers le Dimensional Depot » (depot-dimensionnel.html). Web Worker : charge le parseur complet
   @etothepii/satisfactory-file-parser (commun/vendor/, voir scripts/parseur.sh) ; le fichier ne quitte pas le
   navigateur. Hors worker (page en file://), la page charge ce même fichier et appelle FicsitUsine.lire.
   Messages : reçoit l'ArrayBuffer ; renvoie {progres: 0…1}, puis {usine} ou {erreur: 'ancienne' | 'format'}.

   Ce qu'on garde (structure relevée sur des sauvegardes réelles 1.0 à 1.2) :
   - bâtiments utiles au flux solide : machines (mCurrentRecipe), extracteurs (mExtractableResource), générateurs
     (mCurrentFuelClass), Uploaders (Build_CentralStorage_C), et tout bâtiment dont un port de convoyeur est branché
     (convoyeurs, ascenseurs, séparateurs et fusionneurs avec les règles mSortRules des intelligents et programmables,
     conteneurs, gares…) ;
   - pour chacun : classe, recette, horloge (mCurrentPotential, 1 par défaut, absente de la save à 100 %), éclats de
     surcadençage et Somersloops (inventaire InventoryPotential), productivité mesurée par le jeu
     (mLastProductivityMeasurementProduceDuration / Duration), contenu (Uploaders : l'item de leur inventaire) ;
   - les liaisons : chaque FGFactoryConnectionComponent et son mConnectedComponent (port → port) ;
   - le stock du Depot (FGCentralStorageSubsystem.mStoredItems) et les recherches achetées (extension du Depot,
     vitesse d'envoi des Uploaders) ;
   - pour les extracteurs : le nœud, sa pureté et sa ressource s'ils sont dans la save, l'item en stock en sortie.
   - conteneurs : contenu et nombre de cases (pour savoir s'ils peuvent encore absorber un surplus) ;
   - réseau électrique : nombre de circuits et de fusibles grillés (FGPowerCircuit.mIsFuseTriggered).
   Pas encore lus : tuyaux (fluides), câbles (quel bâtiment est sur quel circuit), contenu des convoyeurs. La pureté des nœuds de ressources
   n'est pas dans la sauvegarde (donnée de la carte). */
(function(g){
  var classe = function(p){ p = p || ''; return p.slice(p.lastIndexOf('.') + 1); };
  var parent = function(n){ return n.slice(0, n.lastIndexOf('.')); };
  var prop = function(o, k){ var p = o && o.properties && o.properties[k]; return p ? (p.values || p.value) : undefined; };
  var SHARD = 'Desc_CrystalShard_C', SLOOP = 'Desc_WAT1_C';

  function extraire(save){
    var h = save.header || {}, objs = [];
    Object.keys(save.levels || {}).forEach(function(k){ (save.levels[k].objects || []).forEach(function(o){ objs.push(o); }); });
    var parNom = new Map(objs.map(function(o){ return [o.instanceName, o]; }));
    var stacks = function(nom){   // contenu d'un inventaire : {classe d'item: quantité}
      var inv = parNom.get(nom), out = {};
      (prop(inv, 'mInventoryStacks') || []).forEach(function(s){
        var it = s.properties && s.properties.Item && s.properties.Item.value, n = s.properties && s.properties.NumItems;
        var c = classe(it && it.itemReference && it.itemReference.pathName);
        if(c && n && n.value) out[c] = (out[c] || 0) + n.value;
      });
      return out;
    };
    // tout bâtiment qui a au moins un port de convoyeur branché est gardé : convoyeurs, séparateurs, conteneurs (y
    // compris les variantes comme Build_ContainerScreen_Mk1_C), gares, ports de drones… — pas de liste à tenir à jour
    var branches = new Set();
    objs.forEach(function(o){
      var v = /FGFactoryConnectionComponent/.test(o.typePath) && prop(o, 'mConnectedComponent');
      if(v && v.pathName) branches.add(parent(o.instanceName));
    });
    var batis = [], ids = new Map(), sub = null, schemas = [], circuits = 0, fusibles = 0;
    objs.forEach(function(o){
      var c = classe(o.typePath);
      if(/FGPowerCircuit/.test(o.typePath)){ circuits++; if(prop(o, 'mIsFuseTriggered')) fusibles++; }   // fusibles grillés
      if(/CentralStorageSubsystem/.test(o.typePath)) sub = o;
      if(/SchematicManager/.test(o.typePath)) schemas = (prop(o, 'mPurchasedSchematics') || []).map(function(r){ return classe(r.pathName); });
      if(o.type !== 'SaveEntity' || !/^Build_/.test(c)) return;
      var rec = prop(o, 'mCurrentRecipe'), res = prop(o, 'mExtractableResource'), fuel = prop(o, 'mCurrentFuelClass');
      if(!(rec || res || fuel || branches.has(o.instanceName) || c === 'Build_CentralStorage_C')) return;
      var b = {c: c};
      if(rec) b.rec = classe(rec.pathName);
      if(res){
        b.res = classe(res.pathName);
        // pureté et ressource portées par le nœud dans la save : absentes pour un nœud d'origine (donnée de la carte,
        // voir donnees/noeuds-ressources.json), présentes s'il a été modifié (génération aléatoire, mods)
        var nd = parNom.get(res.pathName), pu = prop(nd, 'mPurity') || prop(nd, 'mNodePurity'), rc = prop(nd, 'mResourceClass');
        if(pu) b.pur = String(pu.value || pu).replace(/^RP_/, '').toLowerCase();
        if(rc && rc.pathName) b.item = classe(rc.pathName);
        var oi = prop(o, 'mOutputInventory'), so = oi && oi.pathName ? Object.keys(stacks(oi.pathName)) : [];
        if(so.length) b.sortie = so[0];   // ce que l'extracteur a en stock : confirme la ressource extraite
      }
      if(fuel) b.fuel = classe(fuel.pathName);
      var clk = prop(o, 'mCurrentPotential'); if(clk != null) b.clk = clk;
      var pot = prop(o, 'mInventoryPotential');
      if(pot && pot.pathName){ var s = stacks(pot.pathName); if(s[SHARD]) b.shards = s[SHARD]; if(s[SLOOP]) b.sloops = s[SLOOP]; }
      var pd = prop(o, 'mLastProductivityMeasurementProduceDuration'), du = prop(o, 'mLastProductivityMeasurementDuration');
      if(du > 0 && pd != null) b.prod = Math.round(pd / du * 1000) / 1000;
      if(c === 'Build_CentralStorage_C'){
        var inv = prop(o, 'mStorageInventory'), st = inv && inv.pathName ? stacks(inv.pathName) : {};
        b.stock = st;
      }
      if(/Storage(Container|Integrated)|^Build_Container/.test(c)){   // conteneur : contenu et nombre de cases
        var ci = prop(o, 'mStorageInventory'), cinv = ci && ci.pathName && parNom.get(ci.pathName);
        if(cinv){ b.stock = stacks(ci.pathName); b.cases = (prop(cinv, 'mInventoryStacks') || []).length; }
      }
      if(/Smart|Programmable/.test(c)) b.regles = (prop(o, 'mSortRules') || []).map(function(r){
        var p = r.properties || {}, it = p.ItemClass && p.ItemClass.value, oi = p.OutputIndex && p.OutputIndex.value;
        return [classe(it && it.pathName), oi];
      });
      ids.set(o.instanceName, batis.length);
      batis.push(b);
    });
    // liaisons : port → port, entre bâtiments gardés ; [bâtiment, port, bâtiment, port], chaque paire une fois
    var liens = [], vus = new Set();
    objs.forEach(function(o){
      if(!/FGFactoryConnectionComponent/.test(o.typePath)) return;
      var v = prop(o, 'mConnectedComponent'); if(!v || !v.pathName) return;
      var a = ids.get(parent(o.instanceName)), bb = ids.get(parent(v.pathName));
      if(a == null || bb == null) return;
      var pa = classe(o.instanceName), pb = classe(v.pathName), cle = a < bb ? a + pa + '|' + bb + pb : bb + pb + '|' + a + pa;
      if(vus.has(cle)) return; vus.add(cle);
      liens.push([a, pa, bb, pb]);
    });
    var depot = {};
    (prop(sub, 'mStoredItems') || []).forEach(function(s){
      var p = s.properties || {}, c = classe(p.ItemClass && p.ItemClass.value && p.ItemClass.value.pathName);
      if(c && p.amount) depot[c] = p.amount.value;
    });
    var d = new Date(Number(h.saveDateTime));
    return {nom: h.sessionName || '', date: isNaN(d) ? null : d.toISOString(), duree: h.playDurationSeconds || 0,
      version: h.saveVersion, batis: batis, liens: liens, depot: depot, circuits: circuits, fusibles: fusibles,
      extensions: schemas.filter(function(s){ return /Central(StackExpansion|UploadBoost)/.test(s); })};
  }

  function verifier(buf){
    if(!buf || buf.byteLength < 64) throw new Error('format');
    var v = new DataView(buf), entete = v.getInt32(0, true), version = v.getInt32(4, true);
    if(entete < 0 || entete > 100 || version < 0 || version > 1000) throw new Error('format');
    if(version < 46) throw new Error('ancienne');
  }
  function lire(buf, progres){
    verifier(buf);
    var save;
    try{ save = g.SatisfactoryFileParser.Parser.ParseSave('usine', buf, {throwErrors: false,
      onProgressCallback: function(p){ if(progres) progres(p); }}); }
    catch(e){ throw new Error('format'); }
    return extraire(save);
  }
  g.FicsitUsine = {extraire: extraire, lire: lire};

  if(typeof document === 'undefined' && typeof importScripts === 'function'){   // dans le worker
    importScripts('vendor/satisfactory-file-parser.js');
    var dernier = -1;
    g.onmessage = function(e){
      try{
        var u = lire(e.data, function(p){ var q = Math.round(p * 100); if(q !== dernier){ dernier = q; g.postMessage({progres: p}); } });
        g.postMessage({usine: u});
      }catch(err){ g.postMessage({erreur: err.message || 'format'}); }
    };
  }
})(self);
