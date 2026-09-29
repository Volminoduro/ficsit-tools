/* FICSIT — bouton « Ma partie » commun à toutes les pages (accueil compris), dans le dock en haut à droite.
   Source : commun/ficsit-partie-ui.js, assemblée dans commun/ficsit-commun.js par scripts/langue.py, après
   ficsit-lang.js (le dock) et ficsit-partie.js (la lecture).
   Un seul endroit pour importer sa sauvegarde : le panneau du bouton (déposer ou choisir le .sav, copier le chemin
   du dossier, résumé de la partie, oublier). Tous les outils suivent via FicsitPartie.surChangement.
   Deux niveaux de lecture :
   - lecture rapide (FicsitPartie.lire, ~1 s) : recettes, schémas, disques durs — gardée dans le stockage local ;
   - le fichier lui-même est gardé dans IndexedDB (base 'ficsit-tools', magasin 'fichiers', clé 'sav'), pour qu'un
     outil qui a besoin de l'usine entière (Débit vers le Dimensional Depot) la lise à la demande sans redemander le
     fichier ; son résultat y est mis en cache (clé 'usine'), lié à l'import par partie.lu.
   API ajoutée à window.FicsitPartie :
     .ouvrir() / .fermer()            panneau commun
     .importer(fichier) → Promise     lecture rapide, mémorisation, fichier gardé dans IndexedDB
     .fichier() → Promise<{buf, nom, lu} | null>   le .sav de la partie mémorisée
     .cache(cle) → Promise<valeur | null> ; .garder(cle, valeur) → Promise   petit cache IndexedDB (usine calculée…)
   Accueil : un élément [data-partie-resume] reçoit le résumé de la partie et un bouton vers le panneau. */
(function(){
  var FP = window.FicsitPartie; if(!FP) return;
  var T = function(k){ return FicsitLang.t(k); }, TX = FP.texte;
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
  var ERR = {ancienne: 'partieErrAncienne', format: 'partieErrFormat', recettes: 'partieErrRecettes', memoire: 'partieErrMemoire', stockage: 'partieErrStockage'};
  var etat = null;   // import en cours : {etape, f} ; échec : {erreur} ; fichier non gardé : {note}
  // dernier fichier importé dans cette page : repli si IndexedDB est indisponible (navigation privée, stockage bloqué)
  var memoire = null;

  /* ---------- IndexedDB : le fichier .sav et les calculs qui en dépendent ---------- */
  var base = null;
  function idb(){
    if(base) return base;
    base = new Promise(function(ok, ko){
      try{
        var r = indexedDB.open('ficsit-tools', 1);
        r.onupgradeneeded = function(){ r.result.createObjectStore('fichiers'); };
        r.onsuccess = function(){ ok(r.result); };
        r.onerror = function(){ ko(r.error); };
      }catch(e){ ko(e); }
    });
    base.catch(function(){ base = null; });
    return base;
  }
  function op(mode, f){
    return idb().then(function(db){ return new Promise(function(ok, ko){
      var tx = db.transaction('fichiers', mode), st = tx.objectStore('fichiers'), r = f(st);
      tx.oncomplete = function(){ ok(r && r.result); }; tx.onerror = tx.onabort = function(){ ko(tx.error); };
    }); });
  }
  var lireCle = function(k){ return op('readonly', function(st){ return st.get(k); }).catch(function(){ return null; }); };
  var ecrireCle = function(k, v){ return op('readwrite', function(st){ st.put(v, k); }).catch(function(){ return false; }); };
  var viderCles = function(){ return op('readwrite', function(st){ st.clear(); }).catch(function(){ return false; }); };

  FP.fichier = function(){
    var p = FP.charger();
    if(!p) return Promise.resolve(null);
    return lireCle('sav').then(function(x){ return x && x.lu === p.lu ? x : memoire && memoire.lu === p.lu ? memoire : null; });
  };
  FP.cache = function(cle){
    var p = FP.charger();
    if(!p) return Promise.resolve(null);
    return lireCle(cle).then(function(x){ return x && x.lu === p.lu ? x.valeur : null; });
  };
  FP.garder = function(cle, valeur){
    var p = FP.charger();
    return p ? ecrireCle(cle, {lu: p.lu, valeur: valeur}) : Promise.resolve(false);
  };
  var oublierPartie = FP.oublier;
  FP.oublier = function(){ viderCles(); oublierPartie(); };

  FP.importer = function(f){
    if(!f) return Promise.resolve(null);
    etat = {etape: 'lecture', f: 0}; rendu();
    var dernier = 0;
    return FP.lire(f, function(etape, fr){
      var t = Date.now();
      if(etape !== etat.etape || fr >= 1 || t - dernier > 100){ dernier = t; etat = {etape: etape, f: fr}; rendu(); }
    }).then(function(p){
      p.fichier = f.name;
      // le fichier d'abord (l'outil Depot le relit dès qu'il apprend le changement), la partie ensuite
      return viderCles().then(function(){ return f.arrayBuffer(); })
        .then(function(buf){ memoire = {lu: p.lu, nom: f.name, buf: buf}; return ecrireCle('sav', memoire); })
        .then(function(garde){
          etat = !FP.enregistrer(p) ? {erreur: 'stockage'} : garde === false ? {note: 'partieFichierNonGarde'} : null;
          rendu(); return p;
        });
    }).catch(function(e){ etat = {erreur: e.message || 'format'}; rendu(); throw e; });
  };

  /* ---------- bouton du dock et panneau ---------- */
  var ICONE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 1.5h9.5L14.5 4.5V14.5H2z" fill="none" stroke="currentColor" stroke-width="1.4"/>'
    + '<path d="M4.5 1.5v4h6v-4M4.5 14.5V9.5h7v5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
  var btn, pn;
  function monter(){
    var d = document.getElementById('fdock');
    if(!d || document.getElementById('fpartie')) return;
    btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'fpartie'; btn.className = 'fpartie';
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'fpartiePn');
    btn.innerHTML = ICONE + '<span></span><i aria-hidden="true"></i>';
    var lang = document.getElementById('flang');
    d.insertBefore(btn, lang || null);
    pn = document.createElement('div');
    pn.id = 'fpartiePn'; pn.className = 'fpartie-pn'; pn.hidden = true;
    pn.setAttribute('role', 'dialog'); pn.setAttribute('aria-labelledby', 'fpartieTitre');
    pn.innerHTML = '<div class="fpartie-hd"><b id="fpartieTitre"></b><button type="button" class="fpartie-x" id="fpartieX">×</button></div>'
      + '<label class="fpartie-depot" id="fpartieDepot"><input type="file" accept=".sav" id="fpartieIn"><b></b><span></span></label>'
      + '<div class="fpartie-chemin"><code>%LOCALAPPDATA%\\FactoryGame\\Saved\\SaveGames</code><button type="button" id="fpartieCopier"></button><span></span></div>'
      + '<div class="fpartie-etat" id="fpartieEtat" aria-live="polite"></div>';
    document.body.appendChild(pn);
    btn.addEventListener('click', function(e){ e.stopPropagation(); FP[pn.hidden ? 'ouvrir' : 'fermer'](); });
    document.getElementById('fpartieX').addEventListener('click', function(){ FP.fermer(); btn.focus(); });
    document.addEventListener('click', function(e){ if(!pn.hidden && !pn.contains(e.target) && e.target !== btn && !(e.target.closest && e.target.closest('[data-partie-ouvrir]'))) FP.fermer(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !pn.hidden){ FP.fermer(); btn.focus(); } });
    var inp = document.getElementById('fpartieIn'), depot = document.getElementById('fpartieDepot');
    inp.addEventListener('change', function(){ var f = inp.files[0]; inp.value = ''; FP.importer(f).catch(function(){}); });
    ['dragenter', 'dragover'].forEach(function(t){ depot.addEventListener(t, function(e){ e.preventDefault(); depot.classList.add('survol'); }); });
    ['dragleave', 'drop'].forEach(function(t){ depot.addEventListener(t, function(){ depot.classList.remove('survol'); }); });
    depot.addEventListener('drop', function(e){ e.preventDefault(); FP.importer(e.dataTransfer.files[0]).catch(function(){}); });
    document.getElementById('fpartieCopier').addEventListener('click', function(e){
      var b = e.currentTarget, c = pn.querySelector('.fpartie-chemin code');
      var fait = function(){ b.classList.add('ok'); setTimeout(function(){ b.classList.remove('ok'); }, 2000); };
      var repli = function(){ var r = document.createRange(); r.selectNodeContents(c); getSelection().removeAllRanges(); getSelection().addRange(r); try{ document.execCommand('copy'); }catch(_){} fait(); };
      if(navigator.clipboard) navigator.clipboard.writeText(c.textContent).then(fait, repli); else repli();
    });
    // tout bouton de la page marqué data-partie-ouvrir ouvre le panneau
    document.addEventListener('click', function(e){ var o = e.target.closest && e.target.closest('[data-partie-ouvrir]'); if(o){ e.preventDefault(); e.stopPropagation(); FP.ouvrir(); } });
    rendu();
  }
  FP.ouvrir = function(){
    if(!pn) return;
    pn.hidden = false; btn.setAttribute('aria-expanded', 'true'); rendu();
    document.getElementById('fpartieX').focus({preventScroll: true});
  };
  FP.fermer = function(){ if(!pn) return; pn.hidden = true; btn.setAttribute('aria-expanded', 'false'); };

  function resume(p){
    return TX('partieResume', {nom: p.nom || T('partieSansNom'), t: FP.palier(p), a: FP.alternatives(p), d: (p.attente || []).length});
  }
  function rendu(){
    if(!btn) return;
    var p = FP.charger();
    btn.querySelector('span').textContent = T('partieOnglet');
    btn.title = p ? resume(p) : T('partieBoutonTitre');
    btn.classList.toggle('charge', !!p);
    document.getElementById('fpartieTitre').textContent = T('partieOnglet');
    var x = document.getElementById('fpartieX'); x.title = x.ariaLabel = T('partieFermer');
    var dep = document.getElementById('fpartieDepot');
    dep.querySelector('b').textContent = T(p ? 'partieChanger' : 'partieDepot');
    dep.querySelector('span').textContent = T('partieDepotAide');
    document.getElementById('fpartieCopier').textContent = T('partieCopier');
    pn.querySelector('.fpartie-chemin span').textContent = T('partieCopierAide');
    var el = document.getElementById('fpartieEtat'), e = etat;
    el.classList.toggle('erreur', !!(e && e.erreur));
    if(e && e.etape){
      var pc = Math.round((e.f || 0) * 100), lec = e.etape === 'lecture';
      el.innerHTML = '<div>' + esc(lec ? T('partieLecture') : TX('partieAnalyse', {p: FicsitLang.num(pc)})) + '</div>'
        + '<div class="fpartie-jauge' + (lec ? ' lecture' : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pc + '"><i style="width:' + (lec ? 100 : pc) + '%"></i></div>'
        + '<div>' + esc(T('partieAnalyseAide')) + '</div>';
    } else {
      var err = e && e.erreur ? '<div class="fpartie-err">' + esc(ERR[e.erreur] ? T(ERR[e.erreur]) : T('partieErrFormat')) + '</div>'
        : e && e.note ? '<div class="fpartie-err">' + esc(T(e.note)) + '</div>' : '';
      if(!p) el.innerHTML = err + '<div>' + esc(T('partieAucuneCommun')) + '</div>';
      else {
        var date = new Date(p.date).toLocaleString(FicsitLang.locale, {dateStyle: 'long', timeStyle: 'short'});
        el.innerHTML = err + '<div class="fpartie-nom">' + esc(p.nom || T('partieSansNom')) + '</div>'
          + '<div>' + esc(TX('partieSauvee', {date: date, h: FicsitLang.num(Math.floor((p.duree || 0) / 3600))})) + (p.fichier ? ' · ' + esc(p.fichier) : '') + '</div>'
          + '<div class="fpartie-chiffres"><span><b>' + FP.palier(p) + '</b>' + esc(T('partiePalier')) + '</span>'
          + '<span><b>' + FP.alternatives(p) + '</b>' + esc(T('partieDebloquees').toLowerCase()) + '</span>'
          + '<span><b>' + (p.attente || []).length + '</b>' + esc(T('partieAttente').toLowerCase()) + '</span></div>'
          + '<p class="fpartie-aide">' + esc(T('partieOutilsSuivent')) + '</p>'
          + '<button type="button" class="fpartie-vider" id="fpartieVider" title="' + esc(T('partieViderTitre')) + '">' + esc(T('partieVider')) + '</button>';
        document.getElementById('fpartieVider').addEventListener('click', function(){ etat = null; FP.oublier(); });
      }
    }
    // accueil (et toute page qui le souhaite) : résumé de la partie
    document.querySelectorAll('[data-partie-resume]').forEach(function(r){
      r.innerHTML = p
        ? '<span>' + esc(T('partieOnglet')) + ' : <b>' + esc(resume(p)) + '</b></span><button type="button" data-partie-ouvrir>' + esc(T('partieGerer')) + '</button>'
        : '<span>' + esc(T('partieResumeVide')) + '</span><button type="button" data-partie-ouvrir>' + esc(T('partieImporter')) + '</button>';
    });
  }
  FP.surChangement(rendu);
  FicsitLang.on(rendu);
  // après le dock de ficsit-lang.js (monté au même moment, enregistré avant)
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter); else monter();
})();
