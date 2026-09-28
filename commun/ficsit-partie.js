/* FICSIT — « Ma partie » : import d'une sauvegarde Satisfactory (.sav, version 1.0 et plus), dans le navigateur.
   Source : commun/ficsit-partie.js, assemblée dans commun/ficsit-commun.js par scripts/langue.py.
   L'analyse tourne dans un Web Worker, commun/ficsit-partie-worker.js : lecteur rapide des trois listes utiles, et
   parseur complet @etothepii/satisfactory-file-parser en secours seulement (chargé à ce moment-là). Le fichier ne
   quitte pas le navigateur.
   On garde, sous la clé 'ficsit-tools:partie' (stockage local, partagé par tous les outils) : nom de la session,
   date, durée de jeu, recettes débloquées, schémas obtenus et disques durs analysés en attente de choix.
   Le rapprochement avec le référentiel (FicsitAlternatives, généré par scripts/langue.py depuis
   donnees/donnees-jeu.json) donne les alternatives débloquées, manquantes et proposées.

   FicsitPartie.lire(fichier, progres) → Promise<partie> ; progres(etape, fraction), etape = 'lecture' | 'analyse'.
     Rejet : Error('ancienne' | 'format' | 'recettes' | 'memoire').
   FicsitPartie.charger() → partie mémorisée ou null ; .enregistrer(p) ; .oublier()
   FicsitPartie.surChangement(fn) : fn() à chaque import ou oubli, dans cette page ou dans un autre onglet
   FicsitPartie.bilan(p) → {debloquees, manquantes, attente} (alternatives du référentiel)
   FicsitPartie.alternatives(p) → nombre de recettes alternatives débloquées ; .palier(p) → palier atteint */
(function(){
  var CLE = 'ficsit-tools:partie', CLE_SIMU = 'ficsit-tools:simulation', abonnes = [];
  // dossier de ce script (commun/), pour y trouver le worker et le parseur quelle que soit la page
  var BASE = ((document.currentScript && document.currentScript.src) || 'commun/').replace(/[^/]*$/, '');

  function chargerScript(src){
    return new Promise(function(ok, ko){
      var s = document.createElement('script'); s.src = src; s.onload = ok;
      s.onerror = function(){ ko(new Error('format')); }; document.head.appendChild(s);
    });
  }
  // repli sans worker (page ouverte en file://) : même code, dans le fil principal ; parseur complet chargé seulement
  // si le lecteur rapide échoue
  function sansWorker(buf, progres){
    var p = window.FicsitPartieLecteur ? Promise.resolve() : chargerScript(BASE + 'ficsit-partie-worker.js');
    return p.then(function(){
      return new Promise(function(r){ setTimeout(r, 30); });   // laisse s'afficher « analyse… »
    }).then(function(){
      return window.FicsitPartieLecteur.lire(buf, function(f){ progres('analyse', f); }, function(){
        return window.SatisfactoryFileParser ? null : chargerScript(BASE + 'vendor/satisfactory-file-parser.js');
      });
    });
  }
  function avecWorker(buf, progres){
    return new Promise(function(ok, ko){
      var w, parti = false;
      try{ w = new Worker(BASE + 'ficsit-partie-worker.js'); }catch(e){ ko(new Error('worker')); return; }
      var fini = function(){ w.terminate(); };
      w.onmessage = function(e){
        var m = e.data;
        if(m.progres != null){ parti = true; progres('analyse', m.progres); }
        else if(m.partie){ fini(); ok(m.partie); }
        else { fini(); ko(new Error(m.erreur || 'format')); }
      };
      // échec avant toute progression (worker refusé ou introuvable) : repli dans le fil principal ;
      // en cours d'analyse, presque toujours la mémoire (sauvegarde énorme) : pas de second essai
      w.onerror = function(e){ e.preventDefault(); fini();
        ko(new Error(!parti ? 'worker' : /memory|mémoire|allocation/i.test(e.message || '') ? 'memoire' : 'format')); };
      w.postMessage(buf, [buf]);
    });
  }

  function lire(fichier, progres){
    progres = progres || function(){};
    progres('lecture', 0);
    return fichier.arrayBuffer().then(function(buf){
      progres('lecture', 1);
      var copie = buf.slice(0);   // le worker prend possession du tampon : copie gardée pour le repli
      var essai;
      try{ essai = avecWorker(buf, progres); }catch(e){ essai = Promise.reject(new Error('worker')); }
      return essai.catch(function(e){ if(e.message === 'worker') return sansWorker(copie, progres); throw e; });
    });
  }

  function charger(){ try{ var p = JSON.parse(localStorage.getItem(CLE)); return p && p.recettes ? p : null; }catch(e){ return null; } }
  function prevenir(){ abonnes.forEach(function(f){ try{ f(); }catch(e){} }); }
  window.addEventListener('storage', function(e){ if(e.key === CLE || e.key === CLE_SIMU || e.key === null) prevenir(); });

  /* Référentiel des alternatives (FicsitAlternatives) : recettes[classe] = [nom, item produit, slug d'icône, palier],
     disques[schéma] = [nom du schéma, [classes de recettes]]. */
  function fiche(c){
    var r = window.FicsitAlternatives && FicsitAlternatives.recettes[c];
    return r ? {classe: c, nom: r[0], item: r[1], icone: r[2], palier: r[3]} : null;
  }
  function bilan(p){
    var A = window.FicsitAlternatives || {recettes: {}, disques: {}}, ok = new Set(p.recettes || []);
    var toutes = Object.keys(A.recettes).map(fiche).sort(function(a, b){ return a.nom.localeCompare(b.nom); });
    return {
      debloquees: toutes.filter(function(r){ return ok.has(r.classe); }),
      manquantes: toutes.filter(function(r){ return !ok.has(r.classe); }),
      attente: (p.attente || []).map(function(a){
        return {id: a.id, relances: a.relances, choix: a.schemas.map(function(s){
          var d = A.disques[s];
          return {schema: s, nom: d ? d[0].replace(/^Alternate: /, '') : s.replace(/^Schematic_Alternate_|_C$/g, ''),
            recettes: d ? d[1].map(fiche).filter(Boolean) : []};
        })};
      })
    };
  }

  /* Simulation des choix de disques durs, partagée par les outils : {on, choix: {id du disque: schéma retenu}}.
     L'infographie la règle (choix par défaut : le meilleur en Synthèse) ; les autres outils la lisent. */
  function simulation(){
    try{ var s = JSON.parse(localStorage.getItem(CLE_SIMU)); if(s && typeof s === 'object') return {on: s.on === true, choix: s.choix || {}}; }catch(e){}
    return {on: false, choix: {}};
  }
  function simuler(s){ try{ localStorage.setItem(CLE_SIMU, JSON.stringify({on: !!s.on, choix: s.choix || {}})); }catch(e){} }
  // recettes permises : celles de la sauvegarde, plus le choix simulé de chaque disque en attente si la simulation est active
  function permises(p, sim){
    var ok = new Set(p.recettes || []);
    sim = sim || simulation();
    if(sim.on) bilan(p).attente.forEach(function(a){
      var s = sim.choix[a.id], c = a.choix.filter(function(c){ return c.schema === s; })[0] || a.choix.filter(function(c){ return c.recettes.length; })[0];
      if(c) c.recettes.forEach(function(f){ ok.add(f.classe); });
    });
    return ok;
  }
  /* Graphe des recettes de production (FicsitRecettes, généré par langue.py) : items fabricables avec un ensemble de
     recettes permises, à partir des items qu'aucune recette ne produit (ressources, cueillette). */
  function fabricables(ok, deja){   // deja : noms d'items disponibles d'office (excédents déclarés, par exemple)
    var G = window.FicsitRecettes, produit = new Set(), dispo = new Set(), change = true, en = new Set(deja || []);
    G.r.forEach(function(r){ r[5].forEach(function(i){ produit.add(i); }); });
    G.items.forEach(function(n, i){ if(!produit.has(i) || en.has(n)) dispo.add(i); });
    var rs = G.r.filter(function(r){ return ok.has(r[0]); });
    while(change){
      change = false;
      rs.forEach(function(r){
        if(r[4].every(function(i){ return dispo.has(i); })) r[5].forEach(function(i){ if(!dispo.has(i)){ dispo.add(i); change = true; } });
      });
    }
    return new Set(Array.from(dispo).map(function(i){ return G.items[i]; }));
  }

  window.FicsitPartie = {
    simulation: simulation, simuler: simuler, permises: permises, fabricables: fabricables,
    cle: CLE, lire: lire, charger: charger, bilan: bilan,
    enregistrer: function(p){ try{ localStorage.setItem(CLE, JSON.stringify(p)); prevenir(); return true; }catch(e){ return false; } },
    oublier: function(){ try{ localStorage.removeItem(CLE); }catch(e){} prevenir(); },
    surChangement: function(f){ abonnes.push(f); },
    // texte commun (langue.json > communs) avec ses paramètres {x}
    texte: function(k, v){ var s = FicsitLang.t(k); Object.keys(v || {}).forEach(function(x){ s = s.split('{' + x + '}').join(v[x]); }); return s; },
    alternatives: function(p){ return p.recettes.filter(function(c){ return /Alternate/.test(c); }).length; },
    palier: function(p){
      var t = 0;
      p.schemas.forEach(function(c){ var m = /^Schematic_(\d+)-\d+_C$/.exec(c); if(m) t = Math.max(t, +m[1]); });
      return t;
    }
  };
})();
