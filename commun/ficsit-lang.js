/* FICSIT — langue commune à tous les outils.
   Source : commun/ficsit-lang.js (+ langue.json, glossaire.json, ficsit-lang.css), injectée dans chaque page
   par scripts/langue.py. Ne pas éditer le bloc injecté dans les pages : il est réécrit à chaque passage.

   API (window.FicsitLang) :
     .lang                 langue active ('fr' | 'en')
     .locale               locale de formatage des nombres ('fr-FR' | 'en-US')
     .set(l)               change la langue (mémorisée pour tous les outils, synchronisée entre onglets)
     .on(fn)               fn(lang) appelée à chaque changement
     .t(cle)               texte commun (langue.json > communs)
     .pick({fr, en})       choisit la variante de la langue active
     .item(n) .recette(n) .batiment(n)   nom du jeu dans la langue active (glossaire.json, repli : anglais)
     .num(v, opts)         v.toLocaleString(locale, opts)
   Accueil : un lien vers index.html ouvre le dock sur chaque outil (pas sur l'accueil lui-même).
   Mention IA : un bandeau commun (texte langue.json > communs.ia) est ajouté en bas de chaque page.
   Hors ligne : enregistre sw.js (copie des fichiers servis, voir ce fichier).
   Dock : barre de titre commune, pleine largeur en haut de page, comme celle des fenêtres du jeu (« FICSIT » et le nom
   de l'outil à gauche, tiré du <title>) ; tout élément marqué data-fdock y est déplacé, à droite, avant les drapeaux.
   La barre réserve sa hauteur (html.fbarre) : elle ne recouvre jamais le contenu.
   Outils : « Accueil » puis les onglets vers chaque outil juste après l'identité (liste unique : langue.json > outils, outil courant en orange) ;
   sur écran étroit ils se replient dans un menu « Outils ».
   HTML statique :
     <x data-l="fr">…</x><x data-l="en">…</x>     seule la variante de la langue active est affichée
     data-fr-<attr>="…" data-en-<attr>="…"       l'attribut <attr> (title, placeholder, aria-label…) suit la langue
     <title data-fr="…" data-en="…">             idem pour le titre de l'onglet */
(function(){
  var CONF = __CONF__, GLO = __GLOSSAIRE__;
  var CODES = Object.keys(CONF.langues), subs = [];
  var DRAPEAUX = {
    fr: '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#002654"/>'
      + '<rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CE1126"/></svg>',
    en: '<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="flang-uk"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath>'
      + '<path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/>'
      + '<path d="M0 0l60 30m0-30L0 30" clip-path="url(#flang-uk)" stroke="#C8102E" stroke-width="4"/>'
      + '<path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></svg>'
  };
  function valide(l){ return CODES.indexOf(l) >= 0; }
  function lire(){ try{ var v = localStorage.getItem(CONF.cle); if(valide(v)) return v; }catch(e){} return CONF.defaut; }
  var cur = lire();
  document.documentElement.lang = cur;
  // Changer d'outil sans rechargement : le site tient dans une coquille (outils.html), un cadre par outil, gardé ouvert.
  // - Page ouverte seule (http) : elle bascule dans la coquille, à la même adresse (paramètres compris). Pas en local
  //   (file://), ni sous un navigateur piloté (tests), ni avec ?seul=1.
  // - Page dans la coquille : ses liens vers les autres pages du site demandent à la coquille de montrer l'outil voulu ;
  //   son titre et son adresse (paramètres) sont remontés à la coquille.
  // - Sinon (seule malgré tout) : place de la barre réservée dès le chargement, transition de page (ficsit-lang.css) et
  //   préchargement des liens survolés (règles de spéculation ; le Depot seulement téléchargé : il lirait toute l'usine).
  var ICI = location.pathname.split('/').pop() || 'index.html', COQ = false, BASCULE = false;
  try{ COQ = window.parent !== window && window.parent.__ficsitCoquille === true; }catch(e){}
  if(window.top === window && /^https?:$/.test(location.protocol) && !navigator.webdriver && !/[?&]seul=1(&|$)/.test(location.search))
  { BASCULE = true; location.replace('outils.html#' + encodeURIComponent(ICI + location.search + location.hash)); }
  document.documentElement.classList.add('fbarre');
  function versCoquille(m){ try{ window.parent.postMessage(m, location.origin); }catch(e){} }
  if(COQ){
    document.documentElement.classList.add('en-coquille');
    var adresse = function(){ versCoquille({ficsitAdresse: ICI + location.search + location.hash}); };
    ['pushState', 'replaceState'].forEach(function(m){
      var o = history[m];
      history[m] = function(){ var r = o.apply(this, arguments); adresse(); return r; };
    });
    window.addEventListener('hashchange', adresse);
    document.addEventListener('click', function(e){
      if(e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if(!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var u = new URL(a.getAttribute('href'), location.href), f = u.pathname.split('/').pop() || 'index.html';
      if(u.origin !== location.origin || !/\.html$/.test(f) || f === 'outils.html') return;
      if(f === ICI && !u.search && u.hash) return;   // ancre dans la même page
      e.preventDefault();
      versCoquille({ficsitOuvrir: f + u.search + u.hash});
    }, true);
  } else try{
    if(HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')){
      var depot = {selector_matches: 'a[href*="depot-dimensionnel"]'}, sr = document.createElement('script');
      sr.type = 'speculationrules';
      sr.textContent = JSON.stringify({
        prerender: [{where: {and: [{selector_matches: 'a[href$=".html"]'}, {not: depot}]}, eagerness: 'moderate'}],
        prefetch: [{where: depot, eagerness: 'moderate'}]});
      document.head.appendChild(sr);
    }
  }catch(e){}

  function attrs(){
    document.querySelectorAll('title[data-' + cur + ']').forEach(function(t){ document.title = t.getAttribute('data-' + cur); });
    if(COQ) versCoquille({ficsitTitre: document.title});
    var pre = 'data-' + cur + '-';
    document.querySelectorAll('*').forEach(function(el){
      for(var i = 0; i < el.attributes.length; i++){
        var a = el.attributes[i];
        if(a.name.indexOf(pre) === 0) el.setAttribute(a.name.slice(pre.length), a.value);
      }
    });
  }
  function boutons(){
    var w = document.getElementById('flang'); if(!w) return;
    w.setAttribute('aria-label', FL.t('groupe'));
    w.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.lang === cur); });
    var ia = document.getElementById('fia'); if(ia) ia.textContent = FL.t('ia');
    var h = document.getElementById('fhome');
    if(h){ h.querySelector('span').textContent = FL.t('accueil'); h.title = FL.t('accueilTitle'); }
    var nb = document.getElementById('fnavbtn');
    if(nb){ nb.querySelector('span').textContent = FL.t('outils'); nb.title = FL.t('outilsTitle'); }
  }
  // Onglets des outils dans la barre (liste : langue.json > outils), repliés en menu « Outils » sur écran étroit.
  function navOutils(d, apres){
    var liste = CONF.outils || []; if(!liste.length || document.getElementById('fnav')) return;
    var cour = (location.pathname.split('/').pop() || 'index.html');
    function bi(o){ return '<span data-l="fr">' + o.fr + '</span><span data-l="en" lang="en">' + o.en + '</span>'; }
    var btn = document.createElement('button');
    btn.id = 'fnavbtn'; btn.type = 'button'; btn.className = 'fnavbtn';
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'fnav');
    btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h12v2H2z"/></svg><span></span>';
    var nav = document.createElement('nav');
    nav.id = 'fnav'; nav.className = 'fnav';
    nav.innerHTML = liste.map(function(o){
      var t = o.titre, ch = o.chantier ? ' — ' + CONF.communs.chantier.fr : '', che = o.chantier ? ' — ' + CONF.communs.chantier.en : '';
      return '<a href="' + o.f + '"' + (o.f === cour ? ' aria-current="page"' : '') + (o.chantier ? ' class="ch"' : '')
        + ' data-fr-title="' + t.fr + ch + '" data-en-title="' + t.en + che + '">'
        + '<span class="fnav-c">' + bi(o) + '</span><span class="fnav-l">' + bi(t) + '</span></a>';
    }).join('');
    function ferme(rend){ nav.classList.remove('ouvert'); btn.setAttribute('aria-expanded', 'false'); if(rend) btn.focus(); }
    btn.addEventListener('click', function(){
      var o = !nav.classList.contains('ouvert'); nav.classList.toggle('ouvert', o); btn.setAttribute('aria-expanded', String(o));
    });
    document.addEventListener('click', function(e){ if(!nav.contains(e.target) && !btn.contains(e.target)) ferme(false); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && nav.classList.contains('ouvert')) ferme(true); });
    d.classList.add('avecnav');
    apres.after(btn); btn.after(nav);
  }
  function appliquer(l, memoriser){
    if(!valide(l)) return;
    var change = l !== cur;
    cur = l; document.documentElement.lang = l;
    if(memoriser){ try{ localStorage.setItem(CONF.cle, l); }catch(e){} }
    boutons(); attrs();
    if(change) subs.forEach(function(fn){ try{ fn(l); }catch(e){ console.error(e); } });
  }
  function monter(){
    if(document.getElementById('flang')) return;
    var w = document.createElement('div');
    w.id = 'flang'; w.className = 'flang'; w.setAttribute('role', 'group');
    w.innerHTML = CODES.map(function(c){ var L = CONF.langues[c];
      return '<button type="button" data-lang="' + c + '" lang="' + c + '" title="' + L.titre + '">'
        + (DRAPEAUX[c] || '') + '<span>' + L.court + '</span></button>'; }).join('');
    w.addEventListener('click', function(e){ var b = e.target.closest('button[data-lang]'); if(b) appliquer(b.dataset.lang, true); });
    // Barre de titre commune : « FICSIT » et le nom de l'outil, puis les éléments de la page marqués data-fdock
    // (ex. le journal des révisions), puis le sélecteur de langue.
    var d = document.getElementById('fdock');
    if(!d){ d = document.createElement('div'); d.id = 'fdock'; d.className = 'fdock'; document.body.insertBefore(d, document.body.firstChild); }
    document.documentElement.classList.add('fbarre');
    if(!d.querySelector('.fdock-id')){
      var id = document.createElement('div'); id.className = 'fdock-id';
      var b = document.createElement('b'); b.textContent = 'FICSIT'; id.appendChild(b);
      var t = document.querySelector('title');
      CODES.forEach(function(c){
        var x = (t && (t.getAttribute('data-' + c) || t.textContent) || '').split(' — ');
        var s = document.createElement('span'); s.setAttribute('data-l', c); s.lang = c;
        s.textContent = /^FICSIT/.test(x[0]) && x[1] ? x[1] : x[0];
        id.appendChild(s);
      });
      d.insertBefore(id, d.firstChild);
    }
    // Retour à l'accueil, à gauche juste après l'identité (lien relatif : valable en local comme sur GitHub Pages), sauf sur l'accueil.
    if(!/(^|\/)(index\.html)?$/.test(location.pathname) && !document.getElementById('fhome')){
      var h = document.createElement('a'); h.id = 'fhome'; h.className = 'fhome'; h.href = 'index.html';
      h.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 1 7.6l1 1.1L3 7.8V14h4v-4h2v4h4V7.8l1 .9 1-1.1z"/></svg><span></span>';
      d.querySelector('.fdock-id').after(h);
    }
    navOutils(d, document.getElementById('fhome') || d.querySelector('.fdock-id'));
    document.querySelectorAll('[data-fdock]').forEach(function(el){ d.appendChild(el); });
    d.appendChild(w);
    // Mention IA, en bas de chaque page.
    var ia = document.createElement('p'); ia.id = 'fia'; ia.className = 'fia'; document.body.appendChild(ia);
    boutons(); attrs();
  }

  var FL = window.FicsitLang = {
    conf: CONF,
    get lang(){ return cur; },
    get locale(){ return CONF.langues[cur].locale; },
    set: function(l){ appliquer(l, true); },
    on: function(fn){ subs.push(fn); },
    t: function(k){ var x = CONF.communs[k]; return x ? (x[cur] != null ? x[cur] : x[CONF.defaut]) : k; },
    pick: function(o){ return o == null ? '' : (o[cur] != null ? o[cur] : o[CONF.defaut]); },
    item: function(n){ return cur === 'fr' && GLO.items[n] ? GLO.items[n] : n; },
    recette: function(n){ return cur === 'fr' && GLO.recettes[n] ? GLO.recettes[n] : n; },
    batiment: function(n){ return cur === 'fr' && GLO.batiments[n] ? GLO.batiments[n] : n; },
    num: function(v, o){ return Number(v).toLocaleString(CONF.langues[cur].locale, o); }
  };
  window.addEventListener('storage', function(e){ if(e.key === CONF.cle && valide(e.newValue)) appliquer(e.newValue, false); });
  // page qui bascule dans la coquille : rien à construire (le chargement s'arrête, parfois avant le <body>)
  if(BASCULE){} else if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter); else monter();
  // hors ligne : sw.js (racine du site) garde une copie de chaque fichier servi ; en http(s) seulement
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol))
    window.addEventListener('load', function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
})();
