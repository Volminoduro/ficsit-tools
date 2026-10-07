/* Infobulles de la charte : remplacent les bulles natives (attribut title), que le navigateur dessine à sa façon.
   Au survol ou au focus clavier d'un élément portant un title, le texte passe en data-ftip (le title natif disparaît
   avant que le navigateur n'affiche sa bulle) et s'affiche dans une fenêtre de la charte : première ligne en titre,
   les suivantes en détail. Placement : centrée sous un petit élément (bouton, icône) ; près du curseur sur un élément
   large (ligne d'un tableau), comme la bulle native ; centrée sous l'élément au clavier. Valable pour tout title, posé dans le HTML ou plus tard par un script (changement de
   langue compris : le nouveau title l'emporte au survol suivant). Au tactile (pas de survol) : appui long sur l'élément, qui n'est alors pas activé ; la bulle se ferme au toucher suivant
   ou au défilement.
   Accessibilité : la bulle est un role="tooltip" relié à l'élément (aria-describedby) ; un élément sans texte visible
   garde son nom accessible (aria-label tiré du title). */
(function(){
  var bulle = null, cible = null, delai = null, veille = null, souris = null;
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
  function afficher(el, t, auClavier){
    var b = monter();
    b.textContent = '';
    t.split('\n').forEach(function(l, i){
      if(!l.trim()) return;
      var d = document.createElement('div'); d.className = i ? 'd' : 't'; d.textContent = l; b.appendChild(d);
    });
    if(!b.firstChild) return;
    cible = el; el.setAttribute('aria-describedby', 'finfo');
    b.hidden = false;
    var r = el.getBoundingClientRect(), w = b.offsetWidth, h = b.offsetHeight, m = 8, x, y;
    if(souris && !auClavier && r.width > 260){
      // élément large (ligne d'un tableau, panneau) : près du curseur, comme la bulle native, et non centré sur l'élément
      x = souris.x - 14;
      y = souris.y + 22 + h > innerHeight - m ? souris.y - h - 12 : souris.y + 22;
    } else {
      // petit élément (bouton, icône) : centré dessous, ou dessus s'il n'y a pas la place
      x = r.left + r.width / 2 - w / 2;
      y = r.bottom + 8 + h > innerHeight - m ? r.top - h - 8 : r.bottom + 8;
    }
    x = Math.min(Math.max(m, x), innerWidth - w - m);
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
    delai = setTimeout(function(){ afficher(el, t, tout); }, tout ? 0 : 180);
  }
  document.addEventListener('pointermove', function(e){ if(e.pointerType !== 'touch') souris = {x: e.clientX, y: e.clientY}; }, {passive: true});
  document.addEventListener('pointerover', function(e){ if(e.pointerType !== 'touch') souris = {x: e.clientX, y: e.clientY}; viser(e, false); });
  document.addEventListener('focusin', function(e){ if(e.target.matches && e.target.matches(':focus-visible')) viser(e, true); });
  document.addEventListener('pointerout', function(e){
    if(e.pointerType === 'touch') return;   // le doigt qui se lève : la bulle reste jusqu'au toucher suivant
    if(cible || delai){ var vers = e.relatedTarget; if(!vers || !(cible || e.target).contains(vers)) cacher(); }
  });
  document.addEventListener('focusout', cacher);
  // tactile : appui long (≈ 0,5 s sans bouger) = la bulle ; le geste ne déclenche pas l'élément (clic et menu contextuel avalés)
  var appui = null, longAppui = false, depart = null;
  function annulerAppui(){ clearTimeout(appui); appui = null; }
  document.addEventListener('pointerdown', function(e){
    cacher(); annulerAppui(); longAppui = false;
    if(e.pointerType !== 'touch') return;
    var el = e.target.closest && e.target.closest('[title],[data-ftip]');
    if(!el) return;
    var t = texte(el);
    if(!t) return;
    depart = {x: e.clientX, y: e.clientY};
    appui = setTimeout(function(){ appui = null; longAppui = true; afficher(el, t, true); }, 500);
  });
  document.addEventListener('pointermove', function(e){
    if(appui && Math.abs(e.clientX - depart.x) + Math.abs(e.clientY - depart.y) > 12) annulerAppui();
  }, {passive: true});
  document.addEventListener('pointerup', annulerAppui);
  document.addEventListener('pointercancel', annulerAppui);
  document.addEventListener('click', function(e){ if(longAppui){ longAppui = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', function(e){ if(appui || longAppui) e.preventDefault(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') cacher(); });
  window.addEventListener('scroll', cacher, true);
})();
