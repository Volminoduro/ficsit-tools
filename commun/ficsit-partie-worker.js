/* FICSIT — lecture d'une sauvegarde Satisfactory (.sav) hors du fil principal : Web Worker lancé par
   commun/ficsit-partie.js, qui charge le parseur @etothepii/satisfactory-file-parser (commun/vendor/, voir
   scripts/parseur.sh). Le fichier ne quitte pas le navigateur.
   Messages : reçoit l'ArrayBuffer du fichier ; renvoie {progres: 0…1} au fil de l'analyse, puis {partie} ou
   {erreur: 'ancienne' | 'format' | 'recettes'}.
   Hors worker (fichier ouvert en file://, où Chrome refuse les workers), la page charge ce même fichier par une
   balise <script> et appelle FicsitPartieLecteur.analyser dans le fil principal.

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

  function analyser(buf, progres){
    if(!buf || buf.byteLength < 64) throw new Error('format');
    var v = new DataView(buf), entete = v.getInt32(0, true), version = v.getInt32(4, true);
    if(entete < 0 || entete > 100 || version < 0 || version > 1000) throw new Error('format');
    if(version < 46) throw new Error('ancienne');   // 46 = 1.0 : recettes antérieures incompatibles
    var save;
    try{
      save = g.SatisfactoryFileParser.Parser.ParseSave('partie', buf, {throwErrors: false,
        onProgressCallback: function(p){ if(progres) progres(p); }});
    }catch(e){ throw new Error('format'); }
    return extraire(save);
  }

  g.FicsitPartieLecteur = {extraire: extraire, analyser: analyser};

  if(typeof document === 'undefined' && typeof importScripts === 'function'){   // dans le worker
    importScripts('vendor/satisfactory-file-parser.js');
    var dernier = -1;
    g.onmessage = function(e){
      try{
        var partie = analyser(e.data, function(p){
          var q = Math.round(p * 100);
          if(q !== dernier){ dernier = q; g.postMessage({progres: p}); }
        });
        g.postMessage({partie: partie});
      }catch(err){ g.postMessage({erreur: err.message || 'format'}); }
    };
  }
})(self);
