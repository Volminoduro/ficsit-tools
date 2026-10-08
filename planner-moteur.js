/* Planificateur de production — moteur de calcul, sans DOM (chargé par planner.html, testé par scripts/test_planner.js).

   Données (payload de planner.html, écrit par scripts/payloads.py depuis donnees/donnees-jeu.json) :
     P.r   = [[classe, nom, alternative 0/1, palier, machine, temps (s), [[item, qté]…] ingrédients, [[item, qté]…] produits,
              MW moyens de la recette (0 = ceux de la machine)]…]   recettes des bâtiments de production
     P.b   = {machine: [MW, exposant de consommation, palier, classe du bâtiment construit (Build_…), emplacements de
              Somersloop]}
     P.res = [ressources brutes (extraites, jamais fabriquées par défaut)]

   API (window.PlannerMoteur, ou module.exports) :
     candidates(P, item, permise)   recettes permises qui produisent l'item (meilleure d'abord)
     calculer(P, cibles, opts)      cibles = [{item, debit (/min)}] ;
        opts.permise(recette) → bool    filtre (palier, alternatives, partie importée) ; défaut : toutes
        opts.choix = {item: classe}     recette imposée pour un item ; 'brut' = l'item est fourni de l'extérieur
        opts.preferees = Set(classes)   recettes à prendre d'abord par défaut (celles de l'usine existante)
     → {etapes: [{item, recette, machines, entieres, cadence, mw, entrees, sorties}], bruts: {item: /min},
        surplus: {item: /min}, manquants: [items sans recette permise], mw, converge}
     optimiser(P, cibles, opts, highs)  même résultat, recettes choisies par programmation linéaire (HiGHS, voir plus bas) :
        opts.critere = 'ressources' (matière : ressources brutes pesées par leur rareté) | 'energie' (MW des machines)
          | 'place' (m² au sol des machines entières : programme en nombres entiers) | 'synthese' (les trois, chacun rapporté à sa valeur dans opts.ref, la chaîne
          de référence, et pondéré par opts.poids = {mat, mw, esp}) ; opts.choix et opts.permise comme calculer()
     mesures(P, R)                  les trois critères d'un plan → {mat (‰ des ressources de la carte), mw, esp (m²)}
     graphe(R, cibles)              nœuds et liens d'un plan, pour la vue en graphe (voir plus bas)
     convoyeur(debit, liquide, dispo), equilibre(n), montage(etape, mode, dispo, liquides)
     extraire(debit, base, mw, exp, kmax, cap)   extracteurs d'une ressource brute : nombre, cadence commune, MW, fragments d'énergie
                                     niveau de tapis ou de tuyau d'un débit ; arbre de séparateurs vers n machines ;
                                     montage d'une étape en manifold ou en équilibrage (voir plus bas)
     installe(P, batis)             usine existante (bâtiments lus par commun/ficsit-usine-worker.js : {c, rec, clk, sloops,
                                     prod}) → {classe: {n machines, exec (exécutions/min à leur cadence, Somersloops
                                     compris), prod (part du temps où elles ont produit, mesurée par le jeu, ou null)}}
     ecart(etape, inst)             capacité installée face au besoin d'une étape → {installe (/min de son item), besoin,
                                     manque (/min), machines (à ajouter, à 100 %)}

   Calcul : chaque item demandé est produit par une seule recette (la choisie, sinon la première candidate).
   Le débit de chaque recette suit la demande nette de son item : cibles + consommation des autres recettes
   − sous-produits des autres recettes. Résolu par itérations jusqu'au point fixe (exact sur un arbre, convergent sur
   les boucles qui rendent moins qu'elles ne consomment) ; un sous-produit non consommé reste en surplus.
   Machines : nombre fractionnaire, puis entier supérieur avec la cadence qui donne le même débit, et la
   consommation à cette cadence (MW × cadence^exposant par machine). */
(function(racine){
  var EPS = 1e-9;

  function index(P){
    if(P._ix) return P._ix;
    var parItem = {}, parClasse = {};
    P.r.forEach(function(r){
      var o = {classe: r[0], nom: r[1], alt: !!r[2], palier: r[3], machine: r[4], temps: r[5], ing: r[6], prod: r[7], mw: r[8]};
      parClasse[o.classe] = o;
      o.prod.forEach(function(p, k){ (parItem[p[0]] = parItem[p[0]] || []).push({r: o, principal: k === 0}); });
    });
    return (P._ix = {parItem: parItem, parClasse: parClasse, res: new Set(P.res)});
  }

  /* ordre de préférence : pas de déballage, produit principal, pas de détour (emballage d'autre chose qu'un item emballé,
     convertisseur : il transforme une ressource en une autre), recette standard, palier bas, nom */
  var deballe = function(r){ return /^Recipe_Unpackage/.test(r.classe) ? 1 : 0; };
  function detour(r, item){ return (r.machine === 'Packager' && !/^Packaged /.test(item)) || r.machine === 'Converter' ? 1 : 0; }
  function candidates(P, item, permise){
    var l = (index(P).parItem[item] || []).filter(function(c){ return !permise || permise(c.r); });
    l.sort(function(a, b){
      return (deballe(a.r) - deballe(b.r)) || (b.principal - a.principal) || (detour(a.r, item) - detour(b.r, item))
        || (a.r.alt - b.r.alt) || (a.r.palier - b.r.palier) || a.r.nom.localeCompare(b.r.nom);
    });
    return l.map(function(c){ return c.r; });
  }
  /* recette par défaut d'un item : la première candidate qui ne boucle pas aussitôt sur lui (un ingrédient dont la
     propre recette par défaut consomme l'item : déballer ce qu'on vient d'emballer, matière noire qui consomme son
     propre résidu). Si toutes bouclent (turbocarburant sans son alternative : seulement le déballage), aucune : l'item
     est signalé manquant, l'utilisateur peut encore imposer une recette. */
  function parDefaut(P, item, permise, preferees){
    var c = candidates(P, item, permise), res = index(P).res;
    if(preferees) c = c.filter(function(r){ return preferees.has(r.classe); }).concat(c.filter(function(r){ return !preferees.has(r.classe); }));
    return c.filter(function(r){
      return !r.ing.some(function(p){
        if(res.has(p[0])) return false;
        var s = candidates(P, p[0], permise)[0];
        return s && s.ing.some(function(q){ return q[0] === item; });
      });
    })[0] || null;
  }

  function qte(liste, item){ var s = 0; liste.forEach(function(x){ if(x[0] === item) s += x[1]; }); return s; }

  function calculer(P, cibles, opts){
    opts = opts || {};
    var ix = index(P), permise = opts.permise || null, choix = opts.choix || {};
    var cible = {};
    cibles.forEach(function(c){ if(c.item && c.debit > 0) cible[c.item] = (cible[c.item] || 0) + c.debit; });

    // recette retenue pour un item (null : fourni de l'extérieur) ; mémorisée pour tout le calcul
    var retenue = {}, manquants = new Set();
    function recette(item){
      if(item in retenue) return retenue[item];
      var c = choix[item], r = null;
      if(c === 'brut') r = null;
      else if(c && ix.parClasse[c] && (!permise || permise(ix.parClasse[c])) && qte(ix.parClasse[c].prod, item) > 0) r = ix.parClasse[c];
      else if(!ix.res.has(item)){
        r = parDefaut(P, item, permise, opts.preferees);
        if(!r) manquants.add(item);
      }
      return (retenue[item] = r);
    }

    // x[classe] = exécutions par minute de la recette ; point fixe sur la demande nette
    var x = {}, actives = {}, converge = false, it;
    for(it = 0; it < 500; it++){
      var besoin = Object.assign({}, cible), apport = {};
      Object.keys(x).forEach(function(c){
        var r = ix.parClasse[c], n = x[c];
        r.ing.forEach(function(p){ besoin[p[0]] = (besoin[p[0]] || 0) + n * p[1]; });
        r.prod.forEach(function(p){ apport[p[0]] = (apport[p[0]] || 0) + n * p[1]; });
      });
      var nx = {}, ecart = 0;
      Object.keys(besoin).forEach(function(item){
        var r = recette(item); if(!r) return;
        actives[r.classe] = r;
        var propre = (x[r.classe] || 0) * qte(r.prod, item);          // ce que la recette de l'item en fait déjà
        var net = besoin[item] - ((apport[item] || 0) - propre);        // moins les sous-produits des autres recettes
        var n = Math.max(0, net) / qte(r.prod, item);
        nx[r.classe] = Math.max(nx[r.classe] || 0, n);                  // une recette retenue pour deux items : le plus exigeant
      });
      Object.keys(nx).concat(Object.keys(x)).forEach(function(c){ ecart = Math.max(ecart, Math.abs((nx[c] || 0) - (x[c] || 0))); });
      x = nx;
      if(ecart < 1e-7){ converge = true; break; }
    }

    // l'item de chaque étape : celui pour lequel la recette a été retenue (sinon son produit principal)
    var pour = {};
    Object.keys(retenue).forEach(function(i){ var r = retenue[i]; if(r && !(r.classe in pour)) pour[r.classe] = i; });
    var res = resultat(P, x, cible, pour);
    return {etapes: res.etapes, bruts: res.bruts, surplus: res.surplus, manquants: Array.from(manquants), mw: res.mw,
      converge: converge, iterations: it + 1};
  }

  /* étapes, ressources, surplus et MW d'un plan x = {classe: exécutions/min} ; pour = {classe: item} (item affiché) */
  function resultat(P, x, cible, pour){
    // bilan par item : production − consommation − cibles
    var bilan = {};
    function ajoute(i, v){ bilan[i] = (bilan[i] || 0) + v; }
    Object.keys(cible).forEach(function(i){ ajoute(i, -cible[i]); });
    var etapes = [], mw = 0;
    Object.keys(x).forEach(function(c){
      var n = x[c]; if(n < EPS) return;
      var r = index(P).parClasse[c], parMin = 60 / r.temps;                   // exécutions par minute d'une machine à 100 %
      var machines = n / parMin, entieres = Math.max(1, Math.ceil(machines - 1e-6)), cadence = machines / entieres;
      var b = P.b[r.machine] || [0, 1.321929, 0], base = r.mw || b[0];
      var conso = entieres * base * Math.pow(cadence, b[1]);
      mw += conso;
      r.ing.forEach(function(p){ ajoute(p[0], -n * p[1]); });
      r.prod.forEach(function(p){ ajoute(p[0], n * p[1]); });
      etapes.push({item: (pour && pour[c]) || r.prod[0][0], recette: r, machines: machines, entieres: entieres, cadence: cadence, mw: conso,
        entrees: r.ing.map(function(p){ return [p[0], n * p[1]]; }), sorties: r.prod.map(function(p){ return [p[0], n * p[1]]; })});
    });
    var bruts = {}, surplus = {};
    Object.keys(bilan).forEach(function(i){
      var v = bilan[i];
      if(v < -1e-6) bruts[i] = -v;
      else if(v > 1e-6) surplus[i] = v;
    });
    ordonner(etapes, cible);
    return {etapes: etapes, bruts: bruts, surplus: surplus, mw: mw};
  }

  /* tri de l'aval (cibles) vers l'amont : rang = plus longue distance depuis une étape qui produit une cible, en
     suivant « consomme ce que produit ». Les boucles (recyclage plastique ↔ caoutchouc, résidu de matière noire…) sont
     coupées par un parcours en profondeur qui écarte les arcs retour ; plus long chemin ensuite dans l'ordre
     topologique du graphe sans boucle. */
  function ordonner(etapes, cible){
    var parItem = {};
    etapes.forEach(function(e){ e.sorties.forEach(function(s){ (parItem[s[0]] = parItem[s[0]] || []).push(e); }); });
    var amont = new Map(etapes.map(function(e){
      var l = [];
      e.entrees.forEach(function(p){ (parItem[p[0]] || []).forEach(function(f){ if(f !== e && l.indexOf(f) < 0) l.push(f); }); });
      return [e, l];
    }));
    var etat = new Map(), ordre = [], gardes = new Map(etapes.map(function(e){ return [e, []]; }));
    function visite(e){
      etat.set(e, 1);
      amont.get(e).forEach(function(f){
        if(etat.get(f) === 1) return;                 // arc retour : boucle, ignoré pour la mise en rang
        gardes.get(e).push(f);
        if(!etat.has(f)) visite(f);
      });
      etat.set(e, 2); ordre.push(e);
    }
    var racines = etapes.filter(function(e){ return e.sorties.some(function(s){ return s[0] in cible; }); });
    racines.concat(etapes).forEach(function(e){ if(!etat.has(e)) visite(e); });
    var rang = new Map(etapes.map(function(e){ return [e, 0]; }));
    for(var k = ordre.length - 1; k >= 0; k--){       // ordre inverse du post-ordre : chaque étape avant son amont
      var e = ordre[k];
      gardes.get(e).forEach(function(f){ rang.set(f, Math.max(rang.get(f), rang.get(e) + 1)); });
    }
    etapes.sort(function(a, b){ return (rang.get(a) - rang.get(b)) || a.item.localeCompare(b.item); });
    etapes.forEach(function(e){ e.rang = rang.get(e); });
  }

  /* Sources d'une ressource brute : au-delà du convoyeur (ou tuyau) le plus fort, la ressource se prend à plusieurs sources,
     chacune dans la limite d'une ligne. Les consommateurs sont rangés du plus éloigné du produit fini au plus proche, et
     remplis dans cet ordre : une source dessert des postes voisins dans la chaîne, un consommateur trop gros est coupé.
     plafond(item) = débit max d'une ligne (null : pas de scission). → {item: [{debit, parts: {id du consommateur: débit}}]},
     seulement pour les ressources à plusieurs sources. */
  function sources(R, cibles, plafond){
    var cible = {}, cons = {}, res = {};
    (cibles || []).forEach(function(c){ if(c.item && c.debit > 0) cible[c.item] = (cible[c.item] || 0) + c.debit; });
    R.etapes.forEach(function(e){
      e.entrees.forEach(function(s){ if(R.bruts[s[0]] !== undefined) (cons[s[0]] = cons[s[0]] || []).push({id: 'e:' + e.recette.classe, col: (e.rang || 0) + 1, q: s[1]}); });
    });
    Object.keys(R.bruts).forEach(function(i){
      var cap = plafond ? plafond(i) : null, tot = R.bruts[i];
      if(!cap || !(tot > cap * (1 + 1e-9))) return;
      var cs = (cons[i] || []).slice(), som = 0;
      if(cible[i]) cs.push({id: 'c:' + i, col: 0, q: cible[i]});
      cs.forEach(function(c){ som += c.q; });
      if(!(som > 0)) return;
      cs.forEach(function(c){ c.q *= tot / som; });
      cs.sort(function(a, b){ return b.col - a.col || (a.id < b.id ? -1 : 1); });
      var out = [], cur = {debit: 0, parts: {}};
      cs.forEach(function(c){
        var reste = c.q;
        while(reste > 1e-9){
          var place = cap - cur.debit;
          if(place <= 1e-9){ out.push(cur); cur = {debit: 0, parts: {}}; place = cap; }
          var v = Math.min(reste, place);
          cur.debit += v; cur.parts[c.id] = (cur.parts[c.id] || 0) + v; reste -= v;
        }
      });
      if(cur.debit > 1e-9) out.push(cur);
      if(out.length > 1) res[i] = out;
    });
    return res;
  }

  /* Graphe d'un plan (résultat de calculer ou optimiser) : nœuds = étapes, ressources brutes, objectifs, surplus ;
     liens = débit d'un item d'un nœud à l'autre. Quand plusieurs nœuds produisent un item, chaque consommateur reçoit
     de chacun au prorata de sa production. col : colonne de mise en page, 0 = objectifs et surplus (à droite), puis
     les étapes par rang ; chaque ressource brute juste à gauche de son consommateur le plus en amont.
     → {noeuds: [{id, type: 'etape' | 'brut' | 'cible' | 'surplus', item, debit, etape?, col}], liens: [{de, vers, item, debit}]} */
  function graphe(R, cibles, srcs){
    var cible = {};
    (cibles || []).forEach(function(c){ if(c.item && c.debit > 0) cible[c.item] = (cible[c.item] || 0) + c.debit; });
    var noeuds = [], prod = {}, cons = {}, maxRang = 0;
    var ajoute = function(t, i, nd, v){ (t[i] = t[i] || []).push([nd, v]); };
    R.etapes.forEach(function(e, k){
      var nd = {id: 'e:' + e.recette.classe, type: 'etape', item: e.item, debit: 0, etape: e, col: (e.rang || 0) + 1};
      maxRang = Math.max(maxRang, nd.col);
      e.sorties.forEach(function(s){ if(s[0] === e.item) nd.debit += s[1]; ajoute(prod, s[0], nd, s[1]); });
      e.entrees.forEach(function(s){ ajoute(cons, s[0], nd, s[1]); });
      noeuds.push(nd);
    });
    Object.keys(R.bruts).forEach(function(i){
      var nd = {id: 'b:' + i, type: 'brut', item: i, debit: R.bruts[i], col: maxRang + 1};
      noeuds.push(nd); ajoute(prod, i, nd, R.bruts[i]);
    });
    Object.keys(cible).forEach(function(i){
      var nd = {id: 'c:' + i, type: 'cible', item: i, debit: cible[i], col: 0};
      noeuds.push(nd); ajoute(cons, i, nd, cible[i]);
    });
    Object.keys(R.surplus).forEach(function(i){
      var nd = {id: 's:' + i, type: 'surplus', item: i, debit: R.surplus[i], col: 0};
      noeuds.push(nd); ajoute(cons, i, nd, R.surplus[i]);
    });
    var liens = [], eclate = {};
    // ressource à plusieurs sources : un nœud par source (le premier garde l'identifiant de la ressource), chacun relié à ses consommateurs
    Object.keys(srcs || {}).forEach(function(i){
      var ps = prod[i] || [];
      if(ps.length !== 1 || ps[0][0].type !== 'brut') return;
      eclate[i] = true;
      var n0 = ps[0][0], n = srcs[i].length;
      srcs[i].forEach(function(sc, k){
        var nd = k ? {id: 'b:' + i + '#' + k, type: 'brut', item: i, col: n0.col} : n0;
        nd.debit = sc.debit; nd.src = k; nd.nsrc = n;
        if(k) noeuds.push(nd);
        cons[i].forEach(function(c){ var v = sc.parts[c[0].id]; if(v > 1e-9) liens.push({de: nd.id, vers: c[0].id, item: i, debit: v}); });
      });
    });
    Object.keys(cons).forEach(function(i){
      if(eclate[i]) return;
      var ps = prod[i] || [], total = ps.reduce(function(s, p){ return s + p[1]; }, 0);
      if(total <= 0) return;
      cons[i].forEach(function(c){ ps.forEach(function(p){
        var v = p[1] * c[1] / total;
        if(p[0] !== c[0] && v > 1e-9) liens.push({de: p[0].id, vers: c[0].id, item: i, debit: v});
      }); });
    });
    // une ressource se place juste avant son consommateur le plus en amont (pas toutes dans la dernière colonne)
    var parId = {};
    noeuds.forEach(function(nd){ parId[nd.id] = nd; });
    noeuds.forEach(function(nd){
      if(nd.type !== 'brut') return;
      var c = 0;
      liens.forEach(function(l){ if(l.de === nd.id) c = Math.max(c, parId[l.vers].col); });
      nd.col = c + 1;
    });
    return {noeuds: noeuds, liens: liens};
  }

  /* Optimisation : les recettes permises en mélange libre, au moindre coût, par programmation linéaire résolue par
     HiGHS (commun/vendor/highs.js, chargé par l'appelant : highs = await FicsitHighs()).
     Variables : exécutions/min de chaque recette utile (remontée depuis les cibles), et pour chaque item un apport de
     l'extérieur. Contraintes : pour chaque item, production − consommation + apport ≥ cible (le reste est un surplus).
     opts.critere = 'ressources' (défaut) : part de la capacité mondiale d'extraction de chaque ressource brute
       (P.rare = {ressource: poids}, ‰ par unité/min), plus un peu d'énergie pour départager ;
       'energie' : MW des machines, plus un peu de ressources pour départager.
     opts.choix = {item: classe | 'brut'} : recette imposée (les autres recettes dont l'item est le produit principal sont
       écartées) ou item fourni de l'extérieur, gratuit. opts.permise : filtre des recettes.
     Un item fabricable apporté de l'extérieur coûte très cher : il n'apparaît que faute de recette, et il est alors
     signalé manquant. Même résultat que calculer(), plus cout (valeur de l'objectif). */
  var PENALITE = 1e3;   // apport d'un item fabricable : bien plus cher que toute ressource
  function optimiser(P, cibles, opts, highs){
    opts = opts || {};
    var ix = index(P), permise = opts.permise || null, choix = opts.choix || {}, critere = opts.critere || 'ressources';
    // poids de chaque critère dans l'objectif : synthèse = poids ÷ valeur de référence (chaque critère en part de la
    // chaîne de référence) ; critère seul = lui, et un millième des autres pour départager
    var w = {mat: 1, mw: 1e-3, esp: 0};
    if(critere === 'energie') w = {mat: 1e-3, mw: 1, esp: 0};
    else if(critere === 'place') w = {mat: 1e-3, mw: 1e-6, esp: 1};
    else if(critere === 'synthese'){
      var po = opts.poids || {mat: 1, mw: 1, esp: 1}, rf = opts.ref || {}, tp = (po.mat || 0) + (po.mw || 0) + (po.esp || 0) || 1;
      var part = function(k){ return (po[k] || 0) / tp / (rf[k] > 1e-9 ? rf[k] : 1); };
      w = {mat: part('mat') || 1e-4 / (rf.mat > 1e-9 ? rf.mat : 1), mw: part('mw'), esp: part('esp')};
    }
    var cible = {};
    cibles.forEach(function(c){ if(c.item && c.debit > 0) cible[c.item] = (cible[c.item] || 0) + c.debit; });
    // recettes utiles : remontée depuis les cibles par tout ce qui produit un item demandé
    var items = new Map(), recettes = [], vues = new Set(), file = Object.keys(cible);
    var garde = function(r){
      if(permise && !permise(r)) return false;
      var p = r.prod[0][0];
      return !choix[p] || (choix[p] !== 'brut' && (choix[p] === r.classe || !ix.parClasse[choix[p]]));
    };
    var ajouteItem = function(i){ if(!items.has(i)){ items.set(i, items.size); file.push(i); } };
    Object.keys(cible).forEach(function(i){ items.set(i, items.size); });
    while(file.length){
      var it = file.shift();
      if(choix[it] === 'brut') continue;
      (ix.parItem[it] || []).forEach(function(c){
        var r = c.r; if(vues.has(r.classe) || !garde(r)) return;
        vues.add(r.classe); recettes.push(r);
        r.ing.concat(r.prod).forEach(function(q){ ajouteItem(q[0]); });
      });
    }
    var noms = Array.from(items.keys()), m = noms.length, n = recettes.length + m;
    var A = noms.map(function(){ return {}; }), b = noms.map(function(i){ return cible[i] || 0; }), c = [], apport = [];
    var poidsRes = function(i){ return (P.rare && P.rare[i] != null) ? P.rare[i] : 1; };
    recettes.forEach(function(r, j){
      r.ing.forEach(function(q){ var k = items.get(q[0]); A[k][j] = (A[k][j] || 0) - q[1]; });
      r.prod.forEach(function(q){ var k = items.get(q[0]); A[k][j] = (A[k][j] || 0) + q[1]; });
      var B = P.b[r.machine] || [0], mwExec = (r.mw || B[0]) * r.temps / 60;   // MW par exécution/min
      c.push(1e-6 + w.mw * mwExec);
    });
    // place : des bâtiments entiers (une machine posée prend toute sa surface, quelle que soit sa cadence) →
    // une variable entière m<j> par recette, au moins le nombre de machines à 100 % (exécutions/min × temps / 60)
    var entiers = w.esp > 0 ? recettes.map(function(r){ return (P.em && P.em[r.machine]) || 0; }) : [];
    noms.forEach(function(i, k){
      var j = recettes.length + k; A[k][j] = 1; apport.push(j);
      var brut = ix.res.has(i), fourni = choix[i] === 'brut';
      c.push(fourni ? 0 : brut ? w.mat * poidsRes(i) : PENALITE);
    });
    // modèle au format LP (CPLEX), noms neutres r<j> (recettes) et a<k> (apports), une ligne par item
    var nb = function(v){ return Number(v.toPrecision(12)).toString(); };
    var terme = function(v, nom, premier){ return (v < 0 ? ' - ' : premier ? ' ' : ' + ') + nb(Math.abs(v)) + ' ' + nom; };
    var nom = function(j){ return j < recettes.length ? 'r' + j : 'a' + (j - recettes.length); };
    var lp = ['Minimize', ' cout:'];
    c.forEach(function(v, j){ lp.push(terme(v, nom(j), j === 0)); });
    entiers.forEach(function(em, j){ if(em > 0) lp.push(terme(w.esp * em, 'm' + j, false)); });
    lp.push('Subject To');
    A.forEach(function(ligne, k){
      var cols = Object.keys(ligne);
      lp.push(' i' + k + ':' + cols.map(function(j, q){ return terme(ligne[j], nom(+j), q === 0); }).join('\n  ') + ' >= ' + nb(b[k]));
    });
    entiers.forEach(function(em, j){ if(em > 0) lp.push(' n' + j + ':' + terme(recettes[j].temps / 60, nom(j), true) + ' - m' + j + ' <= 0'); });
    // un item qu'une recette permise sait fabriquer n'est jamais « apporté » : la pénalité seule ne suffit pas quand la
    // chaîne coûte plus qu'elle (des milliers de MW ou de m²). Repli sur la pénalité si le modèle borné n'a pas de solution.
    var fabricable = new Set();
    recettes.forEach(function(r){ r.prod.forEach(function(q){ fabricable.add(q[0]); }); });
    var bornes = [];
    noms.forEach(function(i, k){ if(fabricable.has(i) && !ix.res.has(i) && choix[i] !== 'brut') bornes.push(' a' + k + ' = 0'); });
    var fin = [];
    if(entiers.some(function(em){ return em > 0; })){
      fin.push('General');
      entiers.forEach(function(em, j){ if(em > 0) fin.push(' m' + j); });
    }
    fin.push('End');
    // en nombres entiers : 1 % de l'optimum suffit, et au plus quelques secondes (la meilleure solution trouvée reste valable)
    var reglages = {output_flag: false, mip_rel_gap: 0.01, time_limit: 2.5};
    var resoudre = function(borne){
      var texte = lp.concat(borne && bornes.length ? ['Bounds'].concat(bornes) : [], fin).join('\n');
      try{ var so = highs.solve(texte, reglages); }catch(e){ return null; }
      return so && (so.Status === 'Optimal' || (so.Status === 'Time limit reached' && so.Columns && so.Columns.r0 && isFinite(so.ObjectiveValue))) ? so : null;
    };
    var sol = resoudre(true) || resoudre(false);
    if(!sol) return null;
    var val = function(j){ var col = sol.Columns[nom(j)]; return col ? col.Primal : 0; };
    var x = {}, manquants = [], cout = 0;
    recettes.forEach(function(r, j){ var v = val(j); if(v > 1e-9) x[r.classe] = v; });
    noms.forEach(function(i, k){
      var v = val(recettes.length + k);
      if(v > 1e-6 && !ix.res.has(i) && choix[i] !== 'brut') manquants.push(i);
    });
    var res = resultat(P, x, cible, null);
    Object.keys(res.bruts).forEach(function(i){ if(ix.res.has(i)) cout += res.bruts[i] * poidsRes(i); });
    return {etapes: res.etapes, bruts: res.bruts, surplus: res.surplus, manquants: manquants, mw: res.mw,
      converge: true, rarete: cout};
  }

  // les trois critères d'un plan : matière (‰ des ressources de la carte, comme le tri par rareté), MW des machines
  // (entières, à leur cadence), m² au sol des bâtiments posés (machines entières ; sans convoyeurs ni extraction)
  function mesures(P, R){
    var mat = 0, esp = 0;
    Object.keys(R.bruts).forEach(function(i){ mat += R.bruts[i] * ((P.rare && P.rare[i]) || 0); });
    R.etapes.forEach(function(e){ esp += e.entieres * ((P.em && P.em[e.recette.machine]) || 0); });
    return {mat: mat, mw: R.mw, esp: esp};
  }

  /* ---------- convoyeurs et montage ----------
     dispo = {conv: [[débit max /min, nom]…], tuy: [[débit max m³/min, nom]…]}, du plus petit au plus grand : les niveaux
     débloqués (la page les tire du payload P.conv / P.tuy selon la partie ou le palier). */

  // plus petit tapis (ou tuyau) qui passe le débit ; au-delà du plus grand, plusieurs lignes du plus grand
  function convoyeur(debit, liquide, dispo){
    var l = (liquide ? dispo.tuy : dispo.conv) || [];
    if(!l.length) return null;
    for(var k = 0; k < l.length; k++) if(debit <= l[k][0] + 1e-6) return {nom: l[k][1], cap: l[k][0], n: 1};
    var max = l[l.length - 1];
    return {nom: max[1], cap: max[0], n: Math.ceil(debit / max[0] - 1e-9)};
  }

  /* arbre d'équilibrage d'une ligne vers n machines avec des séparateurs (1 → 2 ou 1 → 3) : n s'écrit 2^a·3^b, sinon on
     vise le plus petit m = 2^a·3^b ≥ n et les m − n sorties en trop reviennent sur l'entrée par un groupeur (boucle).
     Étages : les 2 d'abord (moins de séparateurs : 1 + f1 + f1·f2 + …). → {facteurs, m, boucle, separateurs} */
  function equilibre(n){
    if(n <= 1) return {facteurs: [], m: 1, boucle: 0, separateurs: 0};
    var m = Infinity;
    for(var a = 1; a <= 2 * n; a *= 2) for(var b = a; b <= 2 * n; b *= 3) if(b >= n && b < m) m = b;
    var f = [], r = m;
    while(r % 2 === 0){ f.push(2); r /= 2; }
    while(r % 3 === 0){ f.push(3); r /= 3; }
    var sep = 0, prod = 1;
    f.forEach(function(x){ sep += prod; prod *= x; });
    return {facteurs: f, m: m, boucle: m - n, separateurs: sep};
  }

  /* montage d'une étape (machines entières) pour chaque entrée et chaque sortie :
     mode 'manifold' : une ligne qui longe les machines, n − 1 séparateurs (la dernière est au bout du tapis) ou
       n − 1 groupeurs ; la ligne porte tout le débit ;
     mode 'equilibre' : arbre de séparateurs (equilibre(n)), débit de chaque étage ; sorties réunies par des groupeurs
       à 3 entrées en arbre (⌈(n − 1) / 2⌉ groupeurs).
     Fluides : tuyau en manifold dans les deux modes (un réseau de tuyaux s'équilibre seul).
     → {entrees: [lot], sorties: [lot]}, lot = {item, debit, liquide, mode, ligne (convoyeur), separateurs, groupeurs,
        etages: [{facteur, branches, debit, tapis}], boucle, debitLigne (débit sur la ligne d'entrée, boucle comprise)} */
  function montage(e, mode, dispo, liquides){
    var n = e.entieres, liq = function(i){ return liquides ? liquides.has(i) : false; };
    function lot(item, debit, sens){
      var l = {item: item, debit: debit, liquide: liq(item), separateurs: 0, groupeurs: 0, etages: [], boucle: 0, debitLigne: debit};
      // sorties : toujours un seul collecteur (n − 1 groupeurs), quel que soit le montage des entrées
      l.mode = l.liquide || n <= 1 ? (n <= 1 ? 'direct' : 'manifold') : sens === 'sortie' ? 'manifold' : mode;
      if(l.mode === 'manifold'){
        if(sens === 'entree') l.separateurs = n - 1; else l.groupeurs = n - 1;
      } else if(l.mode === 'equilibre'){
        if(sens === 'entree'){
          var q = equilibre(n), parBranche = debit / n, branches = 1;
          l.separateurs = q.separateurs; l.boucle = q.boucle; l.debitLigne = parBranche * q.m;
          if(q.boucle) l.groupeurs = 1;   // groupeur qui renvoie les sorties en trop sur l'entrée
          q.facteurs.forEach(function(f){
            branches *= f;
            var d = l.debitLigne / branches;
            l.etages.push({facteur: f, separateurs: branches / f, branches: branches, debit: d, tapis: convoyeur(d, false, dispo)});
          });
        }
      }
      l.ligne = convoyeur(l.debitLigne, l.liquide, dispo);
      l.branche = convoyeur(debit / Math.max(1, n), l.liquide, dispo);
      return l;
    }
    return {entrees: e.entrees.map(function(p){ return lot(p[0], p[1], 'entree'); }),
            sorties: e.sorties.map(function(p){ return lot(p[0], p[1], 'sortie'); })};
  }

  function installe(P, batis){
    var ix = index(P), parBat = {}, out = {};
    Object.keys(P.b).forEach(function(m){ parBat[P.b[m][3]] = P.b[m]; });
    (batis || []).forEach(function(b){
      var r = b.rec && ix.parClasse[b.rec]; if(!r) return;
      var B = parBat[b.c] || P.b[r.machine], fentes = B && B[4];
      var amp = fentes ? 1 + (b.sloops || 0) / fentes : 1, clk = b.clk == null ? 1 : b.clk;
      var o = out[r.classe] = out[r.classe] || {n: 0, exec: 0, prod: null, _p: 0, _np: 0};
      o.n++; o.exec += 60 / r.temps * clk * amp;
      if(b.prod != null){ o._p += b.prod; o._np++; }
    });
    Object.keys(out).forEach(function(c){ var o = out[c]; o.prod = o._np ? o._p / o._np : null; delete o._p; delete o._np; });
    return out;
  }
  function ecart(e, inst){
    var r = e.recette, q = qte(r.prod, e.item), i = inst && inst[r.classe];
    var installe = i ? i.exec * q : 0, besoin = qte(e.sorties, e.item), manque = Math.max(0, besoin - installe);
    return {installe: installe, besoin: besoin, manque: manque, machines: manque / (60 / r.temps * q), n: i ? i.n : 0, prod: i ? i.prod : null};
  }

  /* extraction d'une ressource brute : `debit` /min avec des extracteurs de base `base` /min à 100 % sur le nœud (déjà multipliée
     par la pureté), `mw` MW à 100 %, puissance en cadence^exp. kmax = cadence maximale voulue (1 : sans surcadençage ; 2,5 :
     surcadencé) ; cap = débit maximal de ce que reçoit l'extracteur (convoyeur ou tuyau), qui plafonne la cadence.
     Le moins d'extracteurs possible à cette cadence maximale, tous à la même cadence c.
     → {n, c, mw, fragments (d'énergie : 1 jusqu'à 150 %, 2 jusqu'à 200 %, 3 au-delà), plafond (la cadence est bornée par cap)} */
  function extraire(debit, base, mw, exp, kmax, cap){
    var k = Math.min(kmax, (cap == null ? Infinity : cap) / base);
    var n = Math.max(1, Math.ceil(debit / (base * k) - 1e-9)), c = debit / (n * base);
    return {n: n, c: c, mw: n * mw * Math.pow(c, exp), fragments: c > 1 + 1e-9 ? n * Math.ceil((c - 1) / 0.5 - 1e-9) : 0,
      plafond: cap != null && k < kmax - 1e-9};
  }

  var API = {sources: sources, candidates: candidates, calculer: calculer, optimiser: optimiser, mesures: mesures, graphe: graphe, installe: installe, ecart: ecart,
    convoyeur: convoyeur, equilibre: equilibre, montage: montage, extraire: extraire};
  if(typeof module !== 'undefined' && module.exports) module.exports = API;
  else racine.PlannerMoteur = API;
})(typeof self !== 'undefined' ? self : this);
