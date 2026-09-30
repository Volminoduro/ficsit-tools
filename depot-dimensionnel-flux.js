/* FICSIT — débits théoriques vers le Dimensional Depot (depot-dimensionnel.html, étapes 2 et 3).
   Régime permanent de l'usine tirée de la sauvegarde (commun/ficsit-usine-worker.js), calculé par relaxation :
   chaque bâtiment combine ce qui lui arrive (flux, items/min par item) et ce que l'aval peut prendre (acceptation),
   jusqu'à ce que plus rien ne bouge. Ce qui est pris en compte :
   - extracteurs : 60 / 120 / 240 par min (mineur Mk1 / Mk2 / Mk3) × pureté du nœud (½, 1, 2) × cadence ;
   - machines : recette × cadence, sorties × amplification des Somersloops ; une machine tourne à la part que
     permettent son ingrédient le plus rare et la place en aval (sortie bouchée = machine arrêtée) ;
   - convoyeurs et ascenseurs : plafond du Mk (60, 120, 270, 480, 780, 1 200 par min) ;
   - séparateurs : parts égales entre les sorties qui acceptent, le surplus d'une sortie saturée va aux autres ;
     séparateurs intelligents et programmables : règles lues dans la save (Tout, Aucun, Tout le reste, Excédent : ne
     reçoit que ce que les autres sorties refusent) ;
   - fusionneurs et conteneurs : ce qui entre ressort ; en cas de bouchon, chaque entrée garde au moins sa part ;
     un conteneur qui a encore de la place (contenu lu dans la save) prend tout ce qui arrive : l'aval est servi
     d'abord, le reste s'accumule — c'est le régime actuel, jusqu'à ce qu'il soit plein ;
   - Uploaders : trois plafonds — vitesse d'envoi (15 par min, doublée à chaque recherche du MAM, jusqu'à 240),
     raccord (les convoyeurs et ascenseurs qui y mènent sans embranchement, depuis le conteneur ou le séparateur) et
     chaîne en amont (second calcul sans les deux autres) ; rien n'entre plus pour un item dont le Depot a atteint sa
     limite (pile × niveau d'extension). Un conteneur juste avant l'Uploader se comporte comme un tronçon : l'Uploader
     est servi d'abord, le conteneur ne garde que ce qu'il ne peut pas prendre.
   - gares, quais de camion, ports de drones : un réservoir commun par famille (ce qui est chargé ressort par les
     gares qui déchargent ; les trajets ne sont pas lus) ;
   - générateurs à combustible solide : consommation 60 × MW × cadence / énergie de l'item ;
   - bilan électrique estimé (consommation à la marche calculée, production des générateurs).
   Pas encore pris en compte : fluides (supposés disponibles), répartition des bâtiments entre circuits électriques
   (seul le bilan global et les fusibles grillés lus dans la save sont donnés). Tout autre bâtiment (broyeur,
   ascenseur spatial…) prend tout ce qui lui arrive et ne fournit rien. */
(function(g){
  var SORTIE = /^(Output|ConveyorAny1|mOutput)/, ENTREE = /^(Input|ConveyorAny0|mInput)/;
  var CONVOYEUR = {1: 60, 2: 120, 3: 270, 4: 480, 5: 780, 6: 1200};
  var MINEUR = {1: 60, 2: 120, 3: 240};
  var PURETE = {impure: 0.5, normal: 1, pure: 2};
  // emplacements de Somersloop : l'amplification vaut 1 + Somersloops / emplacements (×2 quand tout est rempli)
  var SLOOPS = {Build_SmelterMk1_C: 1, Build_ConstructorMk1_C: 1, Build_AssemblerMk1_C: 2, Build_FoundryMk1_C: 2,
    Build_OilRefinery_C: 2, Build_Converter_C: 2, Build_ManufacturerMk1_C: 4, Build_Blender_C: 4,
    Build_HadronCollider_C: 4, Build_QuantumEncoder_C: 4};
  var TOUT = 'desc-wildcard-c', AUCUN = 'desc-none-c', EXCEDENT = 'desc-overflow-c', AUTRE = 'desc-anyundefined-c';
  var FAMILLE = {Build_TrainDockingStation_C: 'train', Build_TruckStation_C: 'camion', Build_DroneStation_C: 'drone'};
  // géothermie : puissance moyenne selon la pureté du geyser (elle oscille autour de cette valeur)
  var GEYSER = {impure: 100, normal: 200, pure: 400};
  var EPS = 1e-6;
  var slug = function(c){ return String(c || '').toLowerCase().replace(/_/g, '-'); };

  function genre(b, P){
    if(b.c === 'Build_CentralStorage_C') return 'upl';
    if(/^Build_(ConveyorBelt|ConveyorLift)/.test(b.c)) return 'conv';
    if(/Splitter/.test(b.c)) return 'sep';
    if(/Merger|^Build_ConveyorAttachment/.test(b.c)) return 'fus';
    if(b.rec && P.rec[b.rec]) return 'mach';
    if(b.res && /^Build_MinerMk\d/.test(b.c)) return 'extr';
    // générateurs à combustible solide (le générateur à carburant brûle un fluide : supposé alimenté)
    if(P.pw && P.pw[b.c] && P.pw[b.c][2] > 0 && b.c !== 'Build_GeneratorFuel_C') return 'gen';
    if(/Storage(Container|Integrated)|^Build_Container/.test(b.c)) return 'fus';   // tampon : ce qui entre ressort
    return 'autre';
  }
  // acceptation d'un lien : {d: par défaut, m: {item: débit}} ; lue par acc(e, item)
  var acc = function(e, i){ return e.a.m[i] != null ? e.a.m[i] : e.a.d; };
  // parts égales entre sorties plafonnées ; le surplus d'une sortie pleine va aux autres
  function repartir(q, caps){
    var r = caps.map(function(){ return 0; }), libres = caps.map(function(_, k){ return k; }), reste = q;
    while(reste > EPS && libres.length){
      var part = reste / libres.length, suite = [];
      libres.forEach(function(k){ var d = Math.min(part, caps[k] - r[k]); r[k] += d; reste -= d; if(caps[k] - r[k] > EPS) suite.push(k); });
      if(suite.length === libres.length) break;
      libres = suite;
    }
    return r;
  }
  // acceptation d'une entrée parmi n qui se partagent A : au moins sa part, plus ce que les autres laissent
  var partEntree = function(A, total, propre, n){ return Math.max(A / n, A - (total - propre)); };

  /* Le modèle est construit une fois ; resoudre() le relaxe dans le mode courant (mode.libre), resultat() en tire le
     résumé. deux() résout d'abord le mode réel, puis bascule en mode libre et repart de cet état (convergence rapide :
     seuls les abords des Uploaders changent) — un seul graphe, deux régimes. */
  function modele(u, P, opts){
    opts = opts || {};
    var ext = u.extensions || [], niv = function(re){ return ext.reduce(function(n, s){ var m = s.match(re); return m ? Math.max(n, +m[1]) : n; }, 0); };
    var U = 15 * Math.pow(2, niv(/CentralUploadBoost_0(\d)_C$/)), mult = 1 + niv(/CentralStackExpansion_0(\d)_C$/);
    var stock = {}; Object.keys(u.depot || {}).forEach(function(c){ stock[slug(c)] = u.depot[c]; });
    // opts.libre : ce que la chaîne peut fournir à chaque Uploader, sans ses deux autres plafonds (Depot jamais plein,
    // vitesse d'envoi et raccord illimités)
    var mode = {libre: !!opts.libre};
    var limite = function(i){ return !mode.libre && P.pile[i] != null ? P.pile[i] * mult : Infinity; };
    var Ueff = function(){ return mode.libre ? Infinity : U; };
    var N = u.batis.map(function(b, i){ return {i: i, b: b, g: genre(b, P), ins: [], outs: []}; });
    // gares, quais de camion, ports de drones : un réservoir commun par famille (les trajets ne sont pas lus) — ce
    // que les gares chargent en ressort par les gares qui déchargent, réparti selon ce que leur aval accepte
    var reservoir = {}, vers = function(i){ return reservoir[i] != null ? reservoir[i] : i; }, familles = {};
    N.slice().forEach(function(n){
      var f = FAMILLE[n.b.c]; if(!f) return;
      if(familles[f] == null){ familles[f] = N.length; N.push({i: N.length, b: {c: 'reservoir:' + f}, g: 'fus', ins: [], outs: [], famille: f, gares: 0}); }
      reservoir[n.i] = familles[f]; N[familles[f]].gares++; n.g = 'gare';
    });
    var E = [];
    u.liens.forEach(function(l){
      var a = l[0], pa = l[1], b = l[2], pb = l[3], sens;
      if(SORTIE.test(pa) || ENTREE.test(pb)) sens = [a, pa, b, pb];
      else if(SORTIE.test(pb) || ENTREE.test(pa)) sens = [b, pb, a, pa];
      else return;
      var e = {de: vers(sens[0]), pd: sens[1], vers: vers(sens[2]), pv: sens[3], f: {}, a: {d: Infinity, m: {}}};
      if(e.de === e.vers) return;
      E.push(e); N[e.de].outs.push(e); N[e.vers].ins.push(e);
    });
    var alertes = {purete: 0, recette: 0};
    // préparation par genre
    N.forEach(function(n){
      var b = n.b;
      if(n.g === 'conv'){ var mk = (b.c.match(/Mk(\d)/) || [])[1]; n.cap = n.cap0 = CONVOYEUR[mk] || Infinity; }
      if(n.g === 'extr'){
        var nd = P.noeuds[b.res] || [], pur = b.pur || nd[1];
        if(!PURETE[pur]){ pur = 'normal'; n.pureteInconnue = true; alertes.purete++; }
        n.item = b.item ? slug(b.item) : nd[0] || slug(b.sortie);
        n.pur = pur;
        n.taux = (MINEUR[(b.c.match(/Mk(\d)/) || [])[1]] || 0) * PURETE[pur] * (b.clk == null ? 1 : b.clk);
      }
      if(n.g === 'mach'){
        var R = P.rec[b.rec], k = 60 / R[1] * (b.clk == null ? 1 : b.clk), amp = SLOOPS[b.c] ? 1 + (b.sloops || 0) / SLOOPS[b.c] : 1;
        n.besoin = {}; R[2].forEach(function(x){ n.besoin[x[0]] = (n.besoin[x[0]] || 0) + x[1] * k; });
        n.prod = {}; R[3].forEach(function(x){ n.prod[x[0]] = (n.prod[x[0]] || 0) + x[1] * k * amp; });
        n.x = 0;
      }
      if(n.g === 'sep'){
        var regles = (b.regles || []).map(function(r){ return [slug(r[0]), r[1]]; }), listes = {};
        regles.forEach(function(r){ if(!/^desc-(wildcard|none|overflow|anyundefined)-c$/.test(r[0])) listes[r[0]] = 1; });
        // 1 : sortie normale pour cet item ; 2 : sortie d'excédent (ne reçoit que ce que les normales refusent) ; 0 : non
        n.permis = function(e, i){
          if(!regles.length) return 1;
          var k = +(e.pd.match(/(\d+)$/) || [])[1] - 1, v = 0;   // Output1 → règle d'index 0
          regles.forEach(function(r){
            if(r[1] !== k) return;
            if(r[0] === i || r[0] === TOUT || r[0] === AUTRE && !listes[i]) v = 1;
            else if(r[0] === EXCEDENT && !v) v = 2;
          });
          return v;
        };
      }
      if(n.g === 'upl'){ n.recu = {}; }
      if(n.g === 'fus' && b.cases){   // conteneur : place restante par item (cases libres × pile)
        var cont = {}; Object.keys(b.stock || {}).forEach(function(c){ cont[slug(c)] = b.stock[c]; });
        var pile = function(i){ return P.pile[i] || 100; };
        var cases = function(sauf){ var k = 0; for(var j in cont) if(j !== sauf) k += Math.ceil(cont[j] / pile(j)); return b.cases - k; };
        n.libre = function(i){ return i === '*' ? cases(null) * 100 : cases(i) * pile(i) - (cont[i] || 0); };
      }
      if(n.g === 'gen'){   // combustible solide : 60 × MW × cadence / énergie de l'item (MJ) par minute
        n.mw = P.pw[b.c][2] * (b.clk == null ? 1 : b.clk);
        n.besoin = {}; Object.keys(P.nrj || {}).forEach(function(i){ n.besoin[i] = 60 * n.mw / P.nrj[i]; });
        n.x = 0;
      }
    });
    // raccord de chaque Uploader : les convoyeurs et ascenseurs qui y mènent sans embranchement, depuis le dernier
    // bâtiment (conteneur, séparateur, machine…) ; son plafond est celui du plus faible (somme si plusieurs entrées)
    var raccords = [];
    N.forEach(function(n){
      if(n.g !== 'upl') return;
      n.raccord = {cap: 0, mk: null};
      n.ins.forEach(function(e){
        var cap = Infinity, mk = null, cur = N[e.de], vus = {};
        while(cur && cur.g === 'conv' && !vus[cur.i]){
          vus[cur.i] = 1;
          if(cur.cap < cap){ cap = cur.cap; mk = cur.b.c; }
          raccords.push(cur);
          cur = cur.ins.length === 1 && cur.outs.length === 1 ? N[cur.ins[0].de] : null;
        }
        n.raccord.cap += cap;
        if(mk && (!n.raccord.mk || CONVOYEUR[(mk.match(/Mk(\d)/) || [])[1]] < CONVOYEUR[(n.raccord.mk.match(/Mk(\d)/) || [])[1]])) n.raccord.mk = mk;
      });
      if(!n.ins.length) n.raccord.cap = 0;
    });
    // mode libre : raccords sans plafond
    var appliquer = function(){ raccords.forEach(function(c){ c.cap = mode.libre ? Infinity : c.cap0; }); };
    appliquer();
    // parcours : sources d'abord (profondeur depuis les extracteurs), puis le reste
    var ordre = [], vu = new Uint8Array(N.length), file = N.filter(function(n){ return n.g === 'extr' || !n.ins.length; }).map(function(n){ return n.i; });
    file.forEach(function(i){ vu[i] = 1; });
    for(var q = 0; q < file.length; q++){ ordre.push(file[q]); N[file[q]].outs.forEach(function(e){ if(!vu[e.vers]){ vu[e.vers] = 1; file.push(e.vers); } }); }
    N.forEach(function(n){ if(!vu[n.i]) ordre.push(n.i); });
    // file de travail : un bâtiment n'est recalculé que si un lien voisin a changé (flux vers l'aval, acceptation
    // vers l'amont) au-delà de TOL items/min
    var TOL = 1e-4, file2 = [], dans = new Uint8Array(N.length);
    var zone = null;   // si posée : seuls ces bâtiments sont recalculés (le reste garde son état)
    var reveiller = function(i){ if(!dans[i] && (!zone || zone[i])){ dans[i] = 1; file2.push(i); } };
    var diff = function(x, y){ return x === y ? 0 : isFinite(x) && isFinite(y) ? Math.abs(x - y) : Infinity; };
    var poser = function(e, f){
      var d = 0;
      for(var i in f) d = Math.max(d, diff(f[i], e.f[i] || 0));
      for(var j in e.f) if(!(j in f)) d = Math.max(d, e.f[j]);
      e.f = f;
      if(d > TOL) reveiller(e.vers);
    };
    // amortissement : l'acceptation ne fait que la moitié du chemin à chaque mise à jour, sinon les collecteurs
    // (fusionneurs en série) oscillent sans fin autour du point fixe
    var amortir = function(x, y){ return isFinite(x) && isFinite(y) ? y + (x - y) / 2 : x; };
    var poserA = function(e, a){
      var reste = 0;   // chemin encore à faire après amortissement : le bâtiment se réveille jusqu'à l'avoir fait
      for(var k in a.m){ var c = amortir(a.m[k], acc(e, k)); reste = Math.max(reste, diff(a.m[k], c)); a.m[k] = c; }
      var cd = amortir(a.d, e.a.d); reste = Math.max(reste, diff(a.d, cd)); a.d = cd;
      if(reste > TOL) reveiller(e.vers);
      var d = diff(a.d, e.a.d);
      for(var i in a.m) d = Math.max(d, diff(a.m[i], acc(e, i)));
      for(var j in e.a.m) if(!(j in a.m)) d = Math.max(d, diff(e.a.m[j], a.d));
      e.a = a;
      if(d > TOL) reveiller(e.de);
    };
    var entrees = function(n){ var t = {}; n.ins.forEach(function(e){ for(var i in e.f) t[i] = (t[i] || 0) + e.f[i]; }); return t; };
    var items = function(n, T){ var s = {}; for(var i in T) s[i] = 1; n.outs.forEach(function(e){ for(var i in e.a.m) s[i] = 1; }); return Object.keys(s); };
    // envoie T (par item) vers les sorties autorisées, parts égales plafonnées par leur acceptation
    function distribuer(n, T, permis){
      var f = n.outs.map(function(){ return {}; });
      Object.keys(T).forEach(function(i){
        if(T[i] <= EPS) return;
        var ok = n.outs.map(function(e){ return !permis ? 1 : permis(e, i); });
        var r = repartir(T[i], n.outs.map(function(e, k){ return ok[k] === 1 ? acc(e, i) : 0; }));
        var reste = T[i] - r.reduce(function(a, b){ return a + b; }, 0);
        if(reste > EPS){   // excédent : ce que les sorties normales n'ont pas pris
          var r2 = repartir(reste, n.outs.map(function(e, k){ return ok[k] === 2 ? acc(e, i) : 0; }));
          r2.forEach(function(x, k){ r[k] += x; });
        }
        r.forEach(function(x, k){ if(x > EPS) f[k][i] = x; });
      });
      n.outs.forEach(function(e, k){ poser(e, f[k]); });
    }
    // acceptation des entrées d'un nœud qui laisse passer : ce que les sorties prennent, partagé entre les entrées
    function accPassage(n, T, cap, permis){
      var cles = items(n, T), nIn = n.ins.length;
      var A = function(i){ var s = 0; n.outs.forEach(function(e){ if(!permis || permis(e, i)) s += acc(e, i); }); return Math.min(s, cap); };
      var Ad = Math.min(n.outs.reduce(function(s, e){ return s + e.a.d; }, 0), cap);
      if(permis) Ad = Math.min(cap, n.outs.reduce(function(s, e){ return s + (permis(e, '*') ? e.a.d : 0); }, 0));
      var tot = 0; for(var i in T) tot += T[i];
      // conteneur qui a encore de la place : il prend tout ce qui arrive (l'aval sert d'abord, le reste s'accumule)
      var place = n.libre ? function(i){ return n.libre(i) > EPS; } : function(){ return false; };
      n.ins.forEach(function(e){
        var m = {}, propre = 0; for(var j in e.f) propre += e.f[j];
        cles.forEach(function(i){ m[i] = place(i) ? Infinity : partEntree(A(i), T[i] || 0, e.f[i] || 0, nIn); });
        poserA(e, {d: place('*') ? Infinity : nIn ? partEntree(Ad, tot, propre, nIn) : Ad, m: m});
      });
    }
    function pas(n, phase){
      var b = n.b, T = entrees(n);
      if(n.g === 'extr'){
        var o = {}; if(n.item && n.taux > 0) o[n.item] = n.taux;
        distribuer(n, o);
      } else if(n.g === 'conv' || n.g === 'fus' || n.g === 'sep'){
        var cap = n.g === 'conv' ? n.cap : Infinity, S = {}, tot = 0;
        for(var i in T) tot += T[i];
        var k = tot > cap ? cap / tot : 1;
        for(var j in T) S[j] = T[j] * k;
        if(!n.outs.length) S = {};
        distribuer(n, S, n.permis);
        accPassage(n, T, n.outs.length ? cap : 0, n.permis);
      } else if(n.g === 'mach'){
        var lim = 1, ratio = {};
        Object.keys(n.prod).forEach(function(p){
          var A = n.outs.reduce(function(s, e){ return s + acc(e, p); }, 0);
          lim = Math.min(lim, A / n.prod[p]);
        });
        Object.keys(n.besoin).forEach(function(i){ ratio[i] = Math.min(1, (T[i] || 0) / n.besoin[i]); });
        var x = lim; for(var r in ratio) x = Math.min(x, ratio[r]);
        n.x = x;
        var o2 = {}; Object.keys(n.prod).forEach(function(p){ o2[p] = x * n.prod[p]; });
        distribuer(n, o2);
        var nIn = n.ins.length;
        n.ins.forEach(function(e){
          var m = {};
          Object.keys(n.besoin).forEach(function(i){
            var xo = lim;
            if(phase === 2) for(var j in ratio) if(j !== i) xo = Math.min(xo, ratio[j]);
            m[i] = partEntree(n.besoin[i] * Math.min(1, xo), T[i] || 0, e.f[i] || 0, nIn);
          });
          poserA(e, {d: 0, m: m});
        });
      } else if(n.g === 'upl'){
        var tot2 = 0, recu = {};
        for(var i2 in T) tot2 += T[i2];
        var k2 = tot2 > Ueff() ? Ueff() / tot2 : 1;
        for(var i3 in T) recu[i3] = T[i3] * k2;
        n.recu = recu;
        var m2 = {}; Object.keys(stock).concat(Object.keys(T)).forEach(function(i){ m2[i] = stock[i] >= limite(i) ? 0 : Ueff(); });
        n.ins.forEach(function(e){ poserA(e, {d: Ueff(), m: m2}); });
      } else if(n.g === 'gen'){
        // générateur : brûle ce qui lui arrive jusqu'à sa puissance (les combustibles se partagent la part qui reste)
        var part = 0; for(var i5 in T) if(n.besoin[i5]) part += T[i5] / n.besoin[i5];
        n.x = Math.min(1, part);
        var nG = n.ins.length;
        n.ins.forEach(function(e){
          var m3 = {}, propre = 0; for(var j5 in e.f) if(n.besoin[j5]) propre += e.f[j5] / n.besoin[j5];
          for(var i6 in n.besoin) m3[i6] = n.besoin[i6] * partEntree(1, part, propre, nG);
          poserA(e, {d: 0, m: m3});
        });
        n.outs.forEach(function(e){ poser(e, {}); });
      } else {
        n.ins.forEach(function(e){ poserA(e, {d: Infinity, m: {}}); });
        n.outs.forEach(function(e){ poser(e, {}); });
      }
    }
    // relaxation jusqu'au point fixe, en partant des sources ; phase 1 sans la limite croisée des ingrédients
    // (sinon une machine à deux ingrédients reste à zéro), phase 2 avec
    // progres(f), f de 0 à 1 : estimation (le nombre de pas n'est pas connu d'avance ; ~40 pas par bâtiment et par phase)
    var tours = 0, max = (opts.max || 400) * N.length, stable = true;
    // depart : bâtiments réveillés au début (tous par défaut) ; en repartant d'un état déjà résolu, seuls ceux dont
    // les règles ont changé, la file propage le reste ; la phase suivante repasse sur tout ce que la précédente a touché
    function resoudre(phases, progres, depart){
      var t0 = tours, attendu = 40 * (depart ? Math.max(depart.length, N.length / 4) : N.length) * phases.length, touches = null;
      phases.forEach(function(phase){
        var suivants = new Set();
        (touches ? Array.from(touches) : depart || ordre).forEach(reveiller);
        for(var q2 = 0; q2 < file2.length; q2++){
          if(++tours > max){ stable = false; break; }
          var i4 = file2[q2]; dans[i4] = 0; pas(N[i4], phase); if(depart) suivants.add(i4);
          if(q2 > 65536){ file2 = file2.slice(q2 + 1); q2 = -1; }
          if(progres && !(tours & 8191)) progres(1 - Math.exp(-(tours - t0) / attendu));
        }
        file2 = []; dans.fill(0);
        touches = depart ? suivants : null;
      });
    }
    function resultat(){
    var ups = N.filter(function(n){ return n.g === 'upl'; }).map(function(n){
      var tot = 0; for(var i in n.recu) tot += n.recu[i];
      var plein = Object.keys(n.recu).concat(Object.keys(n.b.stock || {}).map(slug)).some(function(i){ return stock[i] >= limite(i); });
      return {i: n.i, recu: n.recu, total: tot, plein: plein, raccord: n.raccord};
    });
    // bilan électrique estimé : chaque consommateur à la marche calculée (MW × cadence^exposant × Somersloops²),
    // générateurs selon le combustible reçu, générateur à carburant plein, géothermie selon la pureté du geyser
    var conso = 0, prodMW = 0, somme = function(l){ return l.reduce(function(s, e){ for(var i in e.f) s += e.f[i]; return s; }, 0); };
    N.forEach(function(n){
      var b = n.b, pw = P.pw && P.pw[b.c], clk = b.clk == null ? 1 : b.clk;
      if(b.c === 'Build_GeneratorGeoThermal_C'){ prodMW += GEYSER[b.pur || (P.noeuds[b.res] || [])[1]] || GEYSER.normal; return; }
      if(!pw) return;
      if(n.g === 'gen'){ prodMW += n.mw * n.x; return; }
      if(pw[2] > 0){ prodMW += pw[2] * clk; return; }
      if(!(pw[0] > 0) && !(n.g === 'mach' && P.rec[b.rec][4])) return;
      var base = n.g === 'mach' && P.rec[b.rec][4] || pw[0], amp = SLOOPS[b.c] ? Math.pow(1 + (b.sloops || 0) / SLOOPS[b.c], 2) : 1;
      var marche = n.g === 'mach' ? n.x : n.g === 'extr' ? (n.taux > 0 ? Math.min(1, somme(n.outs) / n.taux) : 0) : 1;
      conso += base * Math.pow(clk, pw[1] || 1) * amp * marche;
    });
    // conteneurs qui se remplissent : ce qu'ils absorbent (entrée − sortie) et le temps avant d'être pleins
    var tampons = [];
    N.forEach(function(n){
      if(!n.libre) return;
      var t = {}; n.ins.forEach(function(e){ for(var i in e.f) t[i] = (t[i] || 0) + e.f[i]; });
      n.outs.forEach(function(e){ for(var i in e.f) t[i] = (t[i] || 0) - e.f[i]; });
      var abs = 0, fin = Infinity; for(var i in t) if(t[i] > 1e-3){ abs += t[i]; fin = Math.min(fin, n.libre(i) / t[i]); }
      if(abs > 1e-3) tampons.push({i: n.i, absorbe: abs, plein: fin});
    });
    var reservoirs = N.filter(function(n){ return n.famille; }).map(function(n){ return {famille: n.famille, gares: n.gares, debit: somme(n.ins)}; });
    var parItem = {}, lim = {};
    ups.forEach(function(x){ for(var i in x.recu) parItem[i] = (parItem[i] || 0) + x.recu[i]; });
    Object.keys(stock).concat(Object.keys(parItem)).forEach(function(i){ lim[i] = limite(i); });
    // résultat compact (transmis par le worker) : par bâtiment, part de marche des machines, débit des extracteurs
    var batis = N.map(function(n){
      return n.g === 'mach' || n.g === 'gen' ? {x: n.x} : n.g === 'extr' ? {taux: n.taux, pur: n.pur, item: n.item, inc: n.pureteInconnue || undefined} : 0;
    });
    return {U: U, mult: mult, limite: lim, stock: stock, uploaders: ups, parItem: parItem, batis: batis,
      energie: {prod: prodMW, conso: conso, circuits: u.circuits || 0, fusibles: u.fusibles || 0}, reservoirs: reservoirs, tampons: tampons,
      tours: tours, stable: stable, alertes: alertes, noeuds: opts.noeuds ? N : undefined};
    }
    // ce que le passage au mode libre touche directement : les Uploaders et leurs raccords
    var bascule = N.filter(function(n){ return n.g === 'upl'; }).map(function(n){ return n.i; }).concat(raccords.map(function(c){ return c.i; }));
    // amont des Uploaders : tout ce qui y mène, en remontant les liens ; le plafond « chaîne en amont » n'est recalculé
    // que là (le reste de l'usine garde son régime réel, qui fixe ce que les autres branches acceptent)
    var amont = function(){
      var z = new Uint8Array(N.length), pile = bascule.slice();
      pile.forEach(function(i){ z[i] = 1; });
      while(pile.length){ N[pile.pop()].ins.forEach(function(e){ if(!z[e.de]){ z[e.de] = 1; pile.push(e.de); } }); }
      return z;
    };
    return {mode: mode, appliquer: appliquer, resoudre: resoudre, resultat: resultat, bascule: bascule,
      limiter: function(z){ zone = z; }, amont: amont};
  }
  // un seul régime (tests) : opts.libre pour le mode libre
  function calculer(u, P, opts){ var m = modele(u, P, opts); m.resoudre([1, 2]); return m.resultat(); }
  // les trois plafonds de chaque Uploader : vitesse d'envoi (recherches du MAM), raccord (convoyeur qui y arrive),
  // chaîne en amont (calcul « libre », sans les deux autres ni la limite du Depot). Débit réel : le plus petit des
  // trois, 0 si le Depot est plein pour l'item ; « potentiel » : ce même minimum, Depot plein ou non.
  function deux(u, P, progres){
    var p = progres || function(){};
    // régime réel d'abord, depuis zéro (c'est lui qu'on affiche) ; le libre, qui ne sert qu'au plafond « chaîne en
    // amont » des Uploaders, repart de cet état
    var m = modele(u, P);
    m.resoudre([1, 2], function(f){ p(0.65 * f); });
    var reel = m.resultat();
    m.mode.libre = true; m.appliquer(); m.limiter(m.amont());
    // phase 1 aussi (sinon une chaîne bloquée dans le régime réel y resterait), mais seulement depuis les Uploaders
    m.resoudre([1, 2], function(f){ p(0.65 + 0.35 * f); }, m.bascule);
    var libre = m.resultat();
    reel.uploaders.forEach(function(x){
      var l = libre.uploaders.find(function(y){ return y.i === x.i; });
      x.amont = l ? l.total : 0;
      x.U = reel.U;
      var f = [['envoi', reel.U], ['raccord', x.raccord.cap], ['amont', x.amont]].sort(function(a, b){ return a[1] - b[1]; })[0];
      x.potentiel = f[1];
      x.facteur = f[0];
      x.frein = x.plein && x.total < 1e-3 ? 'plein' : f[0];
    });
    return {reel: reel, libre: libre};
  }
  g.FicsitFlux = {calculer: calculer, deux: deux, repartir: repartir, slug: slug};

  if(typeof document === 'undefined' && typeof importScripts === 'function' && typeof g.FicsitUsine === 'undefined'){   // worker
    g.onmessage = function(e){
      var dernier = 0;
      try{ g.postMessage({flux: deux(e.data.u, e.data.P, function(f){ var t = Date.now(); if(t - dernier > 150){ dernier = t; g.postMessage({progres: f}); } })}); }
      catch(err){ g.postMessage({erreur: String(err && err.message || err)}); }
    };
  }
})(typeof self !== 'undefined' ? self : this);
