/* Planificateur de production — moteur de calcul, sans DOM (chargé par planner.html, testé par scripts/test_planner.js).

   Données (payload de planner.html, écrit par scripts/payloads.py depuis donnees/donnees-jeu.json) :
     P.r   = [[classe, nom, alternative 0/1, palier, machine, temps (s), [[item, qté]…] ingrédients, [[item, qté]…] produits,
              MW moyens de la recette (0 = ceux de la machine)]…]   recettes des bâtiments de production
     P.b   = {machine: [MW, exposant de consommation, palier]}
     P.res = [ressources brutes (extraites, jamais fabriquées par défaut)]

   API (window.PlannerMoteur, ou module.exports) :
     candidates(P, item, permise)   recettes permises qui produisent l'item (meilleure d'abord)
     calculer(P, cibles, opts)      cibles = [{item, debit (/min)}] ;
        opts.permise(recette) → bool    filtre (palier, alternatives, partie importée) ; défaut : toutes
        opts.choix = {item: classe}     recette imposée pour un item ; 'brut' = l'item est fourni de l'extérieur
     → {etapes: [{item, recette, machines, entieres, cadence, mw, entrees, sorties}], bruts: {item: /min},
        surplus: {item: /min}, manquants: [items sans recette permise], mw, converge}

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
  function parDefaut(P, item, permise){
    var c = candidates(P, item, permise), res = index(P).res;
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
        r = parDefaut(P, item, permise);
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

    // bilan par item : production − consommation − cibles
    var bilan = {};
    function ajoute(i, v){ bilan[i] = (bilan[i] || 0) + v; }
    Object.keys(cible).forEach(function(i){ ajoute(i, -cible[i]); });
    // l'item de chaque étape : celui pour lequel la recette a été retenue (sinon son produit principal)
    var pour = {};
    Object.keys(retenue).forEach(function(i){ var r = retenue[i]; if(r && !(r.classe in pour)) pour[r.classe] = i; });
    var etapes = [], mw = 0;
    Object.keys(x).forEach(function(c){
      var n = x[c]; if(n < EPS) return;
      var r = ix.parClasse[c], parMin = 60 / r.temps;                   // exécutions par minute d'une machine à 100 %
      var machines = n / parMin, entieres = Math.max(1, Math.ceil(machines - 1e-6)), cadence = machines / entieres;
      var b = P.b[r.machine] || [0, 1.321929, 0], base = r.mw || b[0];
      var conso = entieres * base * Math.pow(cadence, b[1]);
      mw += conso;
      r.ing.forEach(function(p){ ajoute(p[0], -n * p[1]); });
      r.prod.forEach(function(p){ ajoute(p[0], n * p[1]); });
      etapes.push({item: pour[c] || r.prod[0][0], recette: r, machines: machines, entieres: entieres, cadence: cadence, mw: conso,
        entrees: r.ing.map(function(p){ return [p[0], n * p[1]]; }), sorties: r.prod.map(function(p){ return [p[0], n * p[1]]; })});
    });
    var bruts = {}, surplus = {};
    Object.keys(bilan).forEach(function(i){
      var v = bilan[i];
      if(v < -1e-6) bruts[i] = -v;
      else if(v > 1e-6) surplus[i] = v;
    });
    ordonner(etapes, cible);
    return {etapes: etapes, bruts: bruts, surplus: surplus, manquants: Array.from(manquants), mw: mw, converge: converge, iterations: it + 1};
  }

  // tri de l'aval (cibles) vers l'amont : rang = plus longue distance depuis une cible (sans boucler)
  function ordonner(etapes, cible){
    var parItem = {};
    etapes.forEach(function(e){ e.sorties.forEach(function(s){ (parItem[s[0]] = parItem[s[0]] || []).push(e); }); });
    var rang = new Map();
    function visite(e, d, pile){
      if(pile.has(e) || (rang.has(e) && rang.get(e) >= d)) return;
      rang.set(e, d); pile.add(e);
      e.entrees.forEach(function(p){ (parItem[p[0]] || []).forEach(function(f){ if(f !== e) visite(f, d + 1, pile); }); });
      pile.delete(e);
    }
    etapes.forEach(function(e){ if(e.sorties.some(function(s){ return s[0] in cible; })) visite(e, 0, new Set()); });
    etapes.forEach(function(e){ if(!rang.has(e)) visite(e, 0, new Set()); });
    etapes.sort(function(a, b){ return (rang.get(a) - rang.get(b)) || a.item.localeCompare(b.item); });
    etapes.forEach(function(e){ e.rang = rang.get(e); });
  }

  var API = {candidates: candidates, calculer: calculer};
  if(typeof module !== 'undefined' && module.exports) module.exports = API;
  else racine.PlannerMoteur = API;
})(typeof self !== 'undefined' ? self : this);
