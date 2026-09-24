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
   Dock : tout élément marqué data-fdock est déplacé dans le dock commun en haut à droite, avant les drapeaux.
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

  function attrs(){
    document.querySelectorAll('title[data-' + cur + ']').forEach(function(t){ document.title = t.getAttribute('data-' + cur); });
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
    // Dock commun en haut à droite : les éléments de la page marqués data-fdock (ex. le journal des
    // révisions), puis le sélecteur de langue.
    var d = document.getElementById('fdock');
    if(!d){ d = document.createElement('div'); d.id = 'fdock'; d.className = 'fdock'; document.body.appendChild(d); }
    document.querySelectorAll('[data-fdock]').forEach(function(el){ d.appendChild(el); });
    d.appendChild(w);
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
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter); else monter();
})();
