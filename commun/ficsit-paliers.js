/* FICSIT — grille de paliers commune (infographie, broyeur, arbre de production).
   Source : commun/ficsit-paliers.js (+ ficsit-paliers.css, libellés dans langue.json > communs.paliers),
   injectée dans chaque page avec le bloc de langue par scripts/langue.py.

   FicsitPaliers.grille(el, o) dessine dans el une grille de boutons, un par palier de 0 à o.max :
     o.sel        palier sélectionné (les paliers de o.min à o.sel sont « dans la sélection »)
     o.min        début de la sélection (0 par défaut)
     o.ok(t)      palier cliquable ? (tous par défaut) ; sinon hachuré, pointillés, désactivé
     o.presse(t)  bouton enfoncé ? (par défaut t === o.sel pour un palier cliquable)
     o.titre(t)   infobulle (par défaut « Palier t »)
     o.ico(nom)   HTML de l'icône d'un item (la page fournit ses icônes) ; FicsitPaliers.IC[t] donne l'item
     o.clic(t)    appelé au clic d'un palier cliquable
   Trois états bien distincts : dans la sélection (orange), cliquable hors sélection (bouton plein),
   non cliquable (hachuré). */
(function(){
  var IC = {0:'Iron Plate', 1:'Screws', 2:'Reinforced Iron Plate', 3:'Steel Ingot', 4:'Motor',
    5:'Plastic', 6:'Computer', 7:'Aluminum Ingot', 8:'Encased Uranium Cell', 9:'Dark Matter Crystal'};
  function court(t){ var l = FicsitLang.t('paliers'); return (Array.isArray(l) && l[t]) || ''; }
  function titre(t){ return FicsitLang.t('palier') + ' ' + t; }
  function grille(el, o){
    var min = o.min || 0, ok = o.ok || function(){ return true; },
        presse = o.presse || function(t){ return t === o.sel; }, h = '';
    el.classList.add('fpal');
    for(var t = 0; t <= o.max; t++){
      var c = ok(t), cls = !c ? 'off' : (t >= min && t <= o.sel ? 'in' : 'out');
      h += '<button type="button" data-t="' + t + '" class="' + cls + '"' + (c ? '' : ' disabled')
        + ' aria-pressed="' + (c && presse(t)) + '" title="' + String((o.titre || titre)(t)).replace(/"/g, '&quot;') + '">'
        + '<span class="fpal-ic">' + (o.ico ? o.ico(IC[t]) : '') + '</span>'
        + '<span class="tn">' + t + '</span><span class="tl">' + court(t) + '</span></button>';
    }
    el.innerHTML = h;
    el.querySelectorAll('button:not(:disabled)').forEach(function(b){
      b.addEventListener('click', function(){ if(o.clic) o.clic(+b.dataset.t); });
    });
  }
  window.FicsitPaliers = {IC: IC, court: court, grille: grille};
})();
