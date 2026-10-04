/* Infobulles de la charte : remplacent les bulles natives (attribut title), que le navigateur dessine à sa façon.
   Au survol ou au focus clavier d'un élément portant un title, le texte passe en data-ftip (le title natif disparaît
   avant que le navigateur n'affiche sa bulle) et s'affiche dans une fenêtre de la charte : première ligne en titre,
   les suivantes en détail. Valable pour tout title, posé dans le HTML ou plus tard par un script (changement de
   langue compris : le nouveau title l'emporte au survol suivant). Rien pour le tactile, qui n'a pas de survol.
   Accessibilité : la bulle est un role="tooltip" relié à l'élément (aria-describedby) ; un élément sans texte visible
   garde son nom accessible (aria-label tiré du title). */
(function(){
  var bulle = null, cible = null, delai = null, veille = null;
  function monter(){
    if(bulle) return bulle;
    bulle = document.createElement('div');
    bulle.id = 'finfo'; bulle.className = 'f-info'; bulle.setAttribute('role', 'tooltip'); bulle.hidden = true;
    document.body.appendChild(bulle);
    return bulle;
  }
  // le texte de l'élément : son title (repris en data-ftip, puis retiré) ou, déjà repris, data-ftip
  function texte(el){
    var t = el.getAttribute('title');
    if(t != null){
      el.removeAttribute('title');
      el.setAttribute('data-ftip', t);
      var sans = !(el.textContent || '').trim();
      if(t && (el.hasAttribute('data-ftip-al') || (sans && !el.hasAttribute('aria-label')))){
        el.setAttribute('aria-label', t); el.setAttribute('data-ftip-al', '');
      }
    }
    return el.getAttribute('data-ftip') || '';
  }
  function cacher(){
    clearTimeout(delai); clearInterval(veille);
    if(cible){ cible.removeAttribute('aria-describedby'); cible = null; }
    if(bulle) bulle.hidden = true;
  }
  function afficher(el, t){
    var b = monter();
    b.textContent = '';
    t.split('\n').forEach(function(l, i){
      if(!l.trim()) return;
      var d = document.createElement('div'); d.className = i ? 'd' : 't'; d.textContent = l; b.appendChild(d);
    });
    if(!b.firstChild) return;
    cible = el; el.setAttribute('aria-describedby', 'finfo');
    b.hidden = false;
    var r = el.getBoundingClientRect(), w = b.offsetWidth, h = b.offsetHeight, m = 8;
    var x = Math.min(Math.max(m, r.left + r.width / 2 - w / 2), innerWidth - w - m);
    var y = r.bottom + 8 + h > innerHeight - m ? r.top - h - 8 : r.bottom + 8;   // sous l'élément, au-dessus s'il n'y a pas la place
    b.style.left = Math.round(x) + 'px'; b.style.top = Math.round(Math.max(m, y)) + 'px';
    clearInterval(veille);
    veille = setInterval(function(){ if(!cible || !cible.isConnected) cacher(); }, 400);   // élément retiré pendant le survol
  }
  function viser(e, tout){
    if(e.pointerType === 'touch') return;
    var el = e.target.closest && e.target.closest('[title],[data-ftip]');
    if(!el || el === cible) return;
    var t = texte(el);
    if(!t) return;
    cacher();
    delai = setTimeout(function(){ afficher(el, t); }, tout ? 0 : 180);
  }
  document.addEventListener('pointerover', function(e){ viser(e, false); });
  document.addEventListener('focusin', function(e){ if(e.target.matches && e.target.matches(':focus-visible')) viser(e, true); });
  document.addEventListener('pointerout', function(e){
    if(cible || delai){ var vers = e.relatedTarget; if(!vers || !(cible || e.target).contains(vers)) cacher(); }
  });
  document.addEventListener('focusout', cacher);
  document.addEventListener('pointerdown', cacher);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') cacher(); });
  window.addEventListener('scroll', cacher, true);
})();
