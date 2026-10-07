const P = JSON.parse(document.getElementById('payload').textContent);
const M = window.PlannerMoteur;
const L = o => FicsitLang.pick(o);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num = (v, d) => FicsitLang.num(v, {maximumFractionDigits: d == null ? 2 : d});
const ico = (n, s) => P.ic[n] ? `<img class="ic${s ? ' s' : ''}" alt="" loading="lazy" src="commun/icones-44/${P.ic[n]}.webp">` : '';
const nomItem = n => FicsitLang.item(n);
const nomRec = n => n.startsWith('Alternate: ') ? FicsitLang.recette(n.slice(11)) : FicsitLang.recette(n);
const nomBat = n => FicsitLang.batiment(n);
const LIQ = new Set(P.liq);
const unite = n => LIQ.has(n) ? 'm³/min' : '/min';

/* ---------- état mémorisé (par navigateur) ---------- */
const CLE = 'ficsit-tools:planner';
const DEFAUT = {cibles: [{item: 'Reinforced Iron Plate', debit: 10}], choix: {}, palier: 9, alt: false, suivre: true, mode: 'defaut', vue: 'graphe', zoom: 1,
  montage: 'manifold', poids: {mat: 5, mw: 5, esp: 5}, pos: {}, replies: [], v: 4};
/* Plusieurs plans, un par onglet : les champs propres à un plan (PLAN) vivent à plat dans S pour le plan affiché, et dans
   S.plans[i] pour tous ; garder() recopie le plan affiché dans S.plans. Vue, zoom, palier de la partie : communs. */
const MODES_CLES = ['defaut', 'energie', 'ressources', 'place', 'synthese'];
const PLAN = ['cibles', 'choix', 'mode', 'poids', 'montage', 'alt', 'palier', 'pos', 'replies'];
const copie = o => JSON.parse(JSON.stringify(o));
const extrait = o => { const p = {}; PLAN.forEach(k => { p[k] = copie(o[k] !== undefined ? o[k] : DEFAUT[k]); }); return p; };
const nomPlan = n => L({fr: `Plan ${n}`, en: `Plan ${n}`});
let S = lireEtat();
function lireEtat(){
  try{
    const s = JSON.parse(localStorage.getItem(CLE));
    if(s && Array.isArray(s.cibles)){
      if(!s.v || s.v < 2) s.vue = 'graphe';   // graphe par défaut, aussi pour les réglages d'avant
      if(!s.v || s.v < 3){ s.replies = []; delete s.deplies; s.v = 3; }   // montages dépliés par défaut : on retient les blocs repliés
      const t = Object.assign({}, DEFAUT, s);
      // avant les onglets : le plan unique devient le premier onglet
      if(!Array.isArray(t.plans) || !t.plans.length){ t.plans = [Object.assign({nom: ''}, extrait(t))]; t.actif = 0; }
      t.actif = Math.min(Math.max(0, t.actif | 0), t.plans.length - 1);
      t.v = 4;
      return t;
    }
  }catch(e){}
  const t = copie(DEFAUT); t.plans = [Object.assign({nom: ''}, extrait(t))]; t.actif = 0;
  return t;
}
let TA = null;
function garder(){
  S.plans[S.actif] = Object.assign({nom: S.plans[S.actif].nom}, extrait(S));
  try{ localStorage.setItem(CLE, JSON.stringify(S)); }catch(e){}
  clearTimeout(TA); TA = setTimeout(majAdresse, 250);
}

/* ---------- adresse : le plan affiché, dans ?p=… (JSON compact en base64url), pour l'envoyer à quelqu'un ----------
   Disposition du graphe (positions, blocs repliés) non comprise. Ouvrir une adresse avec ?p= : le plan identique s'il
   existe déjà, sinon un nouvel onglet. */
const b64 = t => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64 = t => decodeURIComponent(escape(atob(t.replace(/-/g, '+').replace(/_/g, '/'))));
function compact(pl){
  const o = {c: pl.cibles.map(c => [c.item, c.debit])};
  if(pl.nom) o.n = pl.nom;
  if(Object.keys(pl.choix || {}).length) o.h = pl.choix;
  if(pl.mode !== 'defaut') o.m = pl.mode;
  if(pl.mode === 'synthese') o.w = [pl.poids.mw, pl.poids.mat, pl.poids.esp];
  if(pl.montage !== 'manifold') o.o = 1;
  if(pl.alt) o.a = 1;
  if(pl.palier !== 9) o.t = pl.palier;
  return b64(JSON.stringify(o));
}
function deCompact(code){
  try{
    const o = JSON.parse(deB64(code)), pl = extrait(DEFAUT);
    if(!Array.isArray(o.c)) return null;
    pl.cibles = o.c.filter(c => Array.isArray(c) && typeof c[0] === 'string').map(c => ({item: c[0], debit: Math.max(0, +c[1] || 0)}));
    if(o.h && typeof o.h === 'object') pl.choix = o.h;
    if(MODES_CLES.includes(o.m)) pl.mode = o.m;
    if(Array.isArray(o.w)) pl.poids = {mw: +o.w[0] || 0, mat: +o.w[1] || 0, esp: +o.w[2] || 0};
    if(o.o) pl.montage = 'equilibre';
    pl.alt = !!o.a;
    if(Number.isInteger(o.t) && o.t >= 0 && o.t <= 9) pl.palier = o.t;
    pl.nom = typeof o.n === 'string' ? o.n.slice(0, 40) : '';
    return pl;
  }catch(e){ return null; }
}
function majAdresse(){
  const q = new URLSearchParams(location.search), code = compact(S.plans[S.actif]);
  if(q.get('p') === code) return;
  q.set('p', code);
  try{ history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash); }catch(e){}
}
// au chargement : un plan reçu par l'adresse
(function(){
  const code = new URLSearchParams(location.search).get('p'); if(!code) return;
  const pl = deCompact(code); if(!pl) return;
  const sansNom = x => compact(Object.assign({}, x, {nom: ''}));   // même plan, quel que soit son nom
  let i = S.plans.findIndex(x => sansNom(x) === sansNom(pl));
  if(i < 0){ S.plans.push(Object.assign({}, pl, {nom: pl.nom || L({fr: 'Plan reçu', en: 'Shared plan'})})); i = S.plans.length - 1; }
  S.actif = i; Object.assign(S, extrait(S.plans[i]));
})();

/* ---------- usine de la partie (commune avec l'outil Depot, mise en cache) : capacité installée par recette ----------
   ETAT_U : null (pas de partie), {f} lecture en cours, {manque} fichier non gardé, {erreur}, {ok} lue. */
let INST = null, ETAT_U = null, tour = 0;
async function chargerUsine(){
  const t = ++tour;
  INST = null; ETAT_U = FicsitPartie.charger() ? {f: 0} : null;
  calcul();
  if(!ETAT_U) return;
  let dernier = 0;
  const progres = f => { const n = performance.now(); if(t === tour && n - dernier > 150){ dernier = n; ETAT_U = {f}; rendreContexte(contexte()); } };
  try{
    const u = await FicsitPartie.usine(progres);
    if(t !== tour) return;
    if(!u) ETAT_U = {manque: true};
    else { INST = M.installe(P, u.batis); ETAT_U = {ok: true, n: Object.values(INST).reduce((s, x) => s + x.n, 0)}; }
  }catch(e){ if(t !== tour) return; ETAT_U = {erreur: e.message || 'format'}; }
  calcul();
}

/* ---------- solveur HiGHS (commun/vendor/highs.js, ~5 Mo) : chargé seulement quand une optimisation est demandée ---------- */
let HIGHS = null, ETAT_H = null;   // ETAT_H : null, 'charge', 'erreur'
function solveur(){
  if(HIGHS || ETAT_H) return;
  ETAT_H = 'charge';
  const sc = document.createElement('script');
  sc.src = 'commun/vendor/highs.js';
  sc.onload = () => FicsitHighs().then(h => { HIGHS = h; ETAT_H = null; calcul(); }, () => { ETAT_H = 'erreur'; calcul(); });
  sc.onerror = () => { ETAT_H = 'erreur'; calcul(); };
  document.head.appendChild(sc);
}
const modeSel = document.getElementById('mode');
// libellé court du bouton, et titre complet (infobulle)
// ordre de la glissière = ordre des clés, celui des critères de l'infographie : énergie, matière, espace, synthèse
const MODES = {defaut: {fr: 'Standard', en: 'Standard'}, energie: {fr: 'Énergie', en: 'Power'},
  ressources: {fr: 'Matière', en: 'Materials'}, place: {fr: 'Espace', en: 'Space'}, synthese: {fr: 'Synthèse', en: 'Synthesis'}};
const MODES_T = {defaut: {fr: 'Une recette par item (standard d\'abord)', en: 'One recipe per item (standard first)'},
  energie: {fr: 'Optimisées : moins d\'énergie', en: 'Optimised: less power'},
  ressources: {fr: 'Optimisées : moins de matière', en: 'Optimised: fewer materials'},
  place: {fr: 'Optimisées : moins d\'espace', en: 'Optimised: less space'},
  synthese: {fr: 'Optimisées : synthèse des trois', en: 'Optimised: all three combined'}};
const montSel = document.getElementById('montage');
const MONTAGES = {manifold: {fr: 'Manifold', en: 'Manifold'}, equilibre: {fr: 'Équilibrage (séparateurs)', en: 'Load balancing (splitters)'}};
const AIDES = {
  defaut: {fr: 'Une seule recette par item : la standard, sauf celles que vous changez (⇄ sur un bloc, ou dans la liste).',
    en: 'A single recipe per item: the standard one, except those you change (⇄ on a box, or in the list).'},
  ressources: {fr: 'Le solveur mélange librement toutes les recettes permises (un item peut en utiliser plusieurs) pour prendre le moins de ressources brutes, chacune pesée selon sa rareté sur la carte.',
    en: 'The solver freely mixes every allowed recipe (an item may use several) to take the fewest raw resources, each weighed by its scarcity on the map.'},
  energie: {fr: 'Le solveur mélange librement toutes les recettes permises pour que les machines consomment le moins de MW.',
    en: 'The solver freely mixes every allowed recipe so the machines draw the fewest MW.'},
  place: {fr: 'Le solveur mélange librement toutes les recettes permises pour que les machines prennent le moins de m² au sol : des bâtiments entiers, une machine à 10 % prenant autant d\'espace qu\'à 100 % (convoyeurs et extraction non comptés).',
    en: 'The solver freely mixes every allowed recipe so the machines take the fewest m² of floor: whole buildings, a machine at 10% taking as much room as at 100% (belts and extraction not counted).'},
  synthese: {fr: 'Les trois critères à la fois : chacun compté en part de la chaîne standard (−10 % de MW pèse autant que −10 % de matière ou d\'espace), pondéré par les curseurs.',
    en: 'All three criteria at once: each counted as a share of the standard chain (−10% MW weighs as much as −10% materials or space), weighted by the sliders.'}};
function rendreModes(){
  modeSel.style.setProperty('--x', Object.keys(MODES).indexOf(S.mode) * 20 + '%');
  modeSel.querySelectorAll('[data-mode]').forEach(b => {
    const m = b.dataset.mode; b.textContent = L(MODES[m]); b.title = L(MODES_T[m]);
    b.setAttribute('aria-checked', m === S.mode); b.tabIndex = m === S.mode ? 0 : -1;
  });
  document.getElementById('modeAide').textContent = L(AIDES[S.mode] || AIDES.defaut);
  const po = document.getElementById('poids'); po.hidden = S.mode !== 'synthese';
  po.querySelectorAll('input').forEach(i => { i.value = S.poids[i.dataset.p]; i.nextElementSibling.textContent = S.poids[i.dataset.p]; });
  document.querySelectorAll('.interrupteur .sw-lib').forEach(x => x.classList.toggle('actif', x.dataset.cote === S.montage));
}
// interrupteur : coché = équilibrage par séparateurs, décoché = manifold
montSel.checked = S.montage === 'equilibre';
montSel.addEventListener('change', () => { S.montage = montSel.checked ? 'equilibre' : 'manifold'; garder(); rendreModes(); calcul(); });
document.querySelectorAll('.interrupteur .sw-lib').forEach(x => x.addEventListener('click', () => {
  if(S.montage === x.dataset.cote) return;
  montSel.checked = x.dataset.cote === 'equilibre'; montSel.dispatchEvent(new Event('change'));
}));
document.getElementById('poids').addEventListener('input', e => { const i = e.target.closest('input'); if(i) i.nextElementSibling.textContent = i.value; });
document.getElementById('poids').addEventListener('change', e => {
  const i = e.target.closest('input'); if(!i) return;
  S.poids = Object.assign({}, S.poids, {[i.dataset.p]: +i.value}); garder(); calcul();
});
function choisirMode(m){ if(m === S.mode || !MODES[m]) return; S.mode = m; garder(); rendreModes(); calcul(); }
// glisser le curseur : il suit le pointeur, puis se cale sur le mode le plus proche ; un simple clic choisit le mode visé
let GM = null;
modeSel.addEventListener('pointerdown', e => {
  if(e.button > 0) return;
  GM = {x: e.clientX, bouge: false, pid: e.pointerId};
  try{ modeSel.setPointerCapture(e.pointerId); }catch(err){}
});
const indexMode = x => { const r = modeSel.getBoundingClientRect(); return Math.max(0, Math.min(4, Math.floor((x - r.left) / r.width * 5))); };
modeSel.addEventListener('pointermove', e => {
  if(!GM || e.pointerId !== GM.pid) return;
  if(!GM.bouge && Math.abs(e.clientX - GM.x) < 4) return;
  GM.bouge = true; modeSel.classList.add('glisse');
  const r = modeSel.getBoundingClientRect(), f = Math.max(0, Math.min(0.8, (e.clientX - r.left) / r.width - 0.1));
  modeSel.style.setProperty('--x', f * 100 + '%');
});
const finGM = e => {
  if(!GM || (e && e.pointerId !== GM.pid)) return;
  GM = null; modeSel.classList.remove('glisse');
  // glissé ou simple clic : le mode sous le pointeur au relâché (le pointeur capturé, le « click » vise la glissière entière)
  const m = Object.keys(MODES)[indexMode(e.clientX)]; if(m === S.mode) rendreModes(); else choisirMode(m);
};
modeSel.addEventListener('pointerup', finGM);
modeSel.addEventListener('pointercancel', e => { GM = null; modeSel.classList.remove('glisse'); rendreModes(); });
// clavier (Entrée, espace) ou clic de programme : le bouton visé ; à la souris, c'est le relâché qui choisit
modeSel.addEventListener('click', e => { if(e.detail) return; const b = e.target.closest('[data-mode]'); if(b) choisirMode(b.dataset.mode); });
// clavier : flèches d'un mode à l'autre (groupe de boutons radio)
modeSel.addEventListener('keydown', e => {
  const k = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key]; if(!k) return;
  e.preventDefault();
  const ms = Object.keys(MODES), m = ms[(ms.indexOf(S.mode) + k + ms.length) % ms.length];
  choisirMode(m); modeSel.querySelector(`[data-mode="${m}"]`).focus();
});

/* ---------- recettes permises : partie importée, sinon palier + alternatives ---------- */
function contexte(){
  const p = FicsitPartie.charger();
  if(p){
    // palier de la partie : réglé tout seul à chaque nouvel import, puis au choix (jamais au-delà de celui atteint)
    const ok = FicsitPartie.permises(p), max = FicsitPartie.palier(p);
    if(!S.palierPartie || S.palierPartie.lu !== p.lu){ S.palierPartie = {lu: p.lu, t: max}; garder(); }
    const t = Math.min(S.palierPartie.t, max);
    // au palier de la partie : toutes ses recettes débloquées (une alternative de disque dur peut porter un palier plus
    // haut) ; plus bas : seulement celles jusqu'au palier choisi
    return {p, palier: t, palierMax: max, permise: t >= max ? r => ok.has(r.classe) : r => ok.has(r.classe) && (r.palier || 0) <= t,
      preferees: INST && S.suivre ? new Set(Object.keys(INST)) : null};
  }
  // optimisé : les alternatives sont toujours permises (l'optimisation n'a de sens qu'en les comparant)
  const alt = S.alt || S.mode !== 'defaut';
  return {p: null, palier: S.palier, permise: r => r.palier <= S.palier && (alt || !r.alt)};
}

/* convoyeurs et tuyaux débloqués : recettes de construction de la partie, sinon palier choisi */
function dispo(C){
  const ok = c => C.p ? (C.p.recettes || []).includes(c[2]) : c[1] <= S.palier;
  const conv = P.conv.map((c, k) => [c[0], 'Mk.' + (k + 1), c]).filter(c => ok(c[2]));
  const tuy = P.tuy.map((c, k) => [c[0], 'Mk.' + (k + 1), c]).filter(c => ok(c[2]));
  // une partie sans aucune recette de convoyeur lisible : le Mk.1, toujours là dès le départ
  return {conv: conv.length ? conv : [[P.conv[0][0], 'Mk.1']], tuy};
}
const tapis = (c, liq) => !c ? L({fr: 'non débloqué', en: 'not unlocked'})
  : (c.n > 1 ? c.n + ' × ' : '') + (liq ? L({fr: 'tuyau ', en: 'pipe '}) : L({fr: 'convoyeur ', en: 'belt '})) + c.nom;
const tapisCourt = c => !c ? '—' : (c.n > 1 ? c.n + '×' : '') + c.nom;
// couleur d'un convoyeur ou d'un tuyau selon son niveau (classes t1…t6, p1, p2 ; plusieurs lignes : multi)
const CAPS = {60: 1, 120: 2, 270: 3, 480: 4, 780: 5, 1200: 6};
const classeTapis = (c, liq) => !c ? 't0' : (liq ? 'p' + (c.cap > 300 ? 2 : 1) : 't' + (CAPS[c.cap] || 6)) + (c.n > 1 ? ' multi' : '');

/* montage d'une étape en phrases : {resume (court, pour le bloc), lignes (détail par entrée et sortie)} */
function texteMontage(e, D){
  const mo = M.montage(e, S.montage, D, LIQ);
  let sep = 0, grp = 0;
  const lignes = [];
  const qui = l => `<b>${esc(nomItem(l.item))}</b> · ${num(l.debit)} ${unite(l.item)}`;
  mo.entrees.forEach(l => {
    sep += l.separateurs; grp += l.groupeurs;
    let t;
    if(l.mode === 'direct') t = L({fr: `directement, sur ${tapis(l.ligne, l.liquide)}`, en: `directly, on a ${tapis(l.ligne, l.liquide)}`});
    else if(l.liquide) t = L({fr: `${tapis(l.ligne, true)} en manifold (un réseau de tuyaux s'équilibre seul)`, en: `${tapis(l.ligne, true)} as a manifold (a pipe network balances itself)`});
    else if(l.mode === 'manifold') t = L({fr: `manifold sur ${tapis(l.ligne)} : ${l.separateurs} séparateur(s) en chaîne, un par machine (la dernière au bout du tapis), branches de ${num(l.debit / e.entieres)} /min sur ${tapis(l.branche)}`,
      en: `manifold on a ${tapis(l.ligne)}: ${l.separateurs} splitter(s) in a row, one per machine (the last one at the end of the belt), branches of ${num(l.debit / e.entieres)} /min on a ${tapis(l.branche)}`});
    else {
      const etg = l.etages.map(g => L({fr: `${g.separateurs} séparateur(s) en ${g.facteur} → ${g.branches} × ${num(g.debit)} /min (${tapisCourt(g.tapis)})`,
        en: `${g.separateurs} splitter(s) into ${g.facteur} → ${g.branches} × ${num(g.debit)} /min (${tapisCourt(g.tapis)})`})).join(' ; ');
      t = L({fr: `équilibrage 1 → ${e.entieres}${l.boucle ? ` (arbre vers ${e.entieres + l.boucle}, ${l.boucle} sortie(s) renvoyée(s) sur l'entrée par 1 groupeur ; la ligne porte alors ${num(l.debitLigne)} /min)` : ''} sur ${tapis(l.ligne)} : ${etg} ; ${l.separateurs} séparateur(s) en tout`,
        en: `load balancing 1 → ${e.entieres}${l.boucle ? ` (tree to ${e.entieres + l.boucle}, ${l.boucle} output(s) looped back to the input through 1 merger; the line then carries ${num(l.debitLigne)} /min)` : ''} on a ${tapis(l.ligne)}: ${etg}; ${l.separateurs} splitter(s) in all`});
    }
    lignes.push(`<p class="montage-l"><span class="s">${L({fr: 'Entrée', en: 'Input'})}</span> ${qui(l)} — ${t}</p>`);
  });
  mo.sorties.forEach(l => {
    grp += l.groupeurs;
    let t;
    if(l.mode === 'direct') t = L({fr: `directement, sur ${tapis(l.ligne, l.liquide)}`, en: `directly, on a ${tapis(l.ligne, l.liquide)}`});
    else if(l.liquide) t = L({fr: `${tapis(l.ligne, true)} en manifold`, en: `${tapis(l.ligne, true)} as a manifold`});
    else if(l.mode === 'manifold') t = L({fr: `${l.groupeurs} groupeur(s) en chaîne vers ${tapis(l.ligne)}`, en: `${l.groupeurs} merger(s) in a row onto a ${tapis(l.ligne)}`});
    else t = L({fr: `${l.groupeurs} groupeur(s) à 3 entrées en arbre vers ${tapis(l.ligne)}`, en: `${l.groupeurs} 3-input merger(s) in a tree onto a ${tapis(l.ligne)}`});
    lignes.push(`<p class="montage-l"><span class="s">${L({fr: 'Sortie', en: 'Output'})}</span> ${qui(l)} — ${t}</p>`);
  });
  const resume = sep || grp ? L({fr: `${sep} sép. · ${grp} grp.`, en: `${sep} split. · ${grp} merg.`}) : L({fr: 'montage direct', en: 'direct feed'});
  return {resume, lignes};
}

/* recettes proposées pour un item : celles permises (meilleure d'abord), plus la recette actuelle si elle n'en est pas */
function optionsRecette(item, actuelle, C){
  const cand = M.candidates(P, item, C.permise);
  if(actuelle && !cand.includes(actuelle)) cand.unshift(actuelle);
  return cand;
}
const libRecette = c => `${nomRec(c.nom)}${c.alt ? ' (alt.)' : ''} — ${nomBat(c.machine)}`;

// items qu'on peut viser : produits par au moins une recette (toutes, la permission est vérifiée au calcul)
const FABRICABLES = Array.from(new Set(P.r.flatMap(r => r[7].map(p => p[0]))));

/* ---------- objectifs ---------- */
function rendreCibles(){
  document.getElementById('cibles').innerHTML = S.cibles.map((c, i) => `
    <div class="cible">
      <button type="button" class="choix-item" data-pick="${i}" aria-haspopup="listbox" aria-expanded="false"
        aria-label="${esc(L({fr: 'Item', en: 'Item'}) + ' : ' + nomItem(c.item))}">${ico(c.item)}<span class="nom">${esc(nomItem(c.item))}</span><span class="fl" aria-hidden="true">▾</span></button>
      <span class="qte"><button type="button" data-pas="-1" data-q="${i}" aria-label="${esc(L({fr: 'Moins', en: 'Less'}))}">−</button><input type="number" min="0" step="any" value="${c.debit}" data-d="${i}" aria-label="${esc(L({fr: 'Débit par minute', en: 'Rate per minute'}))}"><button type="button" data-pas="1" data-q="${i}" aria-label="${esc(L({fr: 'Plus', en: 'More'}))}">+</button></span>
      <span class="u">${unite(c.item)}</span>
      <button type="button" class="x" data-x="${i}" title="${esc(L({fr: 'Retirer', en: 'Remove'}))}" aria-label="${esc(L({fr: 'Retirer', en: 'Remove'}))}">×</button>
    </div>`).join('') || `<p class="vide">${L({fr: 'Aucun objectif.', en: 'No target.'})}</p>`;
}
document.getElementById('cibles').addEventListener('change', e => {
  const t = e.target;
  if(t.dataset.i != null){ S.cibles[+t.dataset.i].item = t.value; rendreCibles(); }
  if(t.dataset.d != null) S.cibles[+t.dataset.d].debit = Math.max(0, +t.value || 0);
  garder(); calcul();
});
// −/+ : un par clic (dix avec Maj), calcul relancé après une courte pause (clics rapprochés = un seul calcul)
let TQ = null;
document.getElementById('cibles').addEventListener('click', e => {
  const q = e.target.closest('[data-pas]');
  if(q){
    const i = +q.dataset.q, c = S.cibles[i], pas = +q.dataset.pas * (e.shiftKey ? 10 : 1);
    c.debit = Math.max(0, Math.round((c.debit + pas) * 1000) / 1000);
    document.querySelector(`#cibles input[data-d="${i}"]`).value = c.debit;
    garder(); clearTimeout(TQ); TQ = setTimeout(calcul, 250); return;
  }
  const pk = e.target.closest('[data-pick]');
  if(pk){ if(PICK && PICK.i === +pk.dataset.pick) fermerPicker(true); else ouvrirPicker(+pk.dataset.pick); return; }
  const b = e.target.closest('[data-x]'); if(!b) return;
  S.cibles.splice(+b.dataset.x, 1); garder(); rendreCibles(); calcul();
});
document.getElementById('ajout').addEventListener('click', () => {
  S.cibles.push({item: 'Iron Plate', debit: 10}); garder(); rendreCibles(); calcul();
  ouvrirPicker(S.cibles.length - 1);   // nouvel objectif : on choisit tout de suite son item
});

/* ---------- choix d'un item : liste avec icônes et recherche (le <select> natif n'affiche pas d'images) ---------- */
let PICK = null;   // {i, actif}
const sansAccent = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const picker = document.getElementById('picker'), pickQ = picker.querySelector('input'), pickL = picker.querySelector('ul');
function listePicker(){
  const q = sansAccent(pickQ.value.trim()), cur = S.cibles[PICK.i] && S.cibles[PICK.i].item;
  const it = PICK.ok.filter(n => !q || sansAccent(nomItem(n)).includes(q) || sansAccent(n).includes(q))
    .sort((a, b) => nomItem(a).localeCompare(nomItem(b), FicsitLang.locale));
  PICK.liste = it; PICK.actif = Math.max(0, it.indexOf(cur));
  pickL.innerHTML = it.map((n, k) => `<li role="option" id="pk${k}" data-item="${esc(n)}" aria-selected="${n === cur}">${ico(n, 1).replace(' loading="lazy"', '')}<span>${esc(nomItem(n))}</span></li>`).join('')
    || `<li class="vide" aria-disabled="true">${L({fr: 'Aucun item.', en: 'No item.'})}</li>`;
  marquerPicker();
}
function marquerPicker(){
  pickL.querySelectorAll('.actif').forEach(x => x.classList.remove('actif'));
  const li = document.getElementById('pk' + PICK.actif);
  if(li){ li.classList.add('actif'); li.scrollIntoView({block: 'nearest'}); pickQ.setAttribute('aria-activedescendant', li.id); }
}
function ouvrirPicker(i){
  const b = document.querySelector(`#cibles [data-pick="${i}"]`); if(!b) return;
  // items qu'une recette permise sait faire (palier et alternatives, ou partie importée) ; l'objectif actuel reste listé
  const C = contexte(), cur = S.cibles[i].item;
  PICK = {i, ok: FABRICABLES.filter(n => n === cur || M.candidates(P, n, C.permise).length)};
  const r = b.getBoundingClientRect(), a = document.getElementById('app').getBoundingClientRect();
  picker.style.left = Math.max(8, r.left - a.left) + 'px';
  picker.style.top = (r.bottom - a.top + 4) + 'px';
  picker.style.width = Math.max(280, r.width) + 'px';
  picker.hidden = false; b.setAttribute('aria-expanded', 'true');
  pickQ.value = ''; listePicker(); pickQ.focus();
}
function fermerPicker(rendreFocus){
  if(!PICK) return;
  const b = document.querySelector(`#cibles [data-pick="${PICK.i}"]`);
  picker.hidden = true; PICK = null;
  if(b){ b.setAttribute('aria-expanded', 'false'); if(rendreFocus) b.focus(); }
}
function prendrePicker(n){
  const i = PICK.i; fermerPicker(false);
  if(n && S.cibles[i].item !== n){ S.cibles[i].item = n; garder(); rendreCibles(); calcul(); }
  const b = document.querySelector(`#cibles [data-pick="${i}"]`); if(b) b.focus();
}
pickQ.addEventListener('input', listePicker);
pickQ.addEventListener('keydown', e => {
  if(!PICK) return;
  const n = PICK.liste.length;
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if(n){ PICK.actif = (PICK.actif + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; marquerPicker(); } }
  else if(e.key === 'Enter'){ e.preventDefault(); if(n) prendrePicker(PICK.liste[PICK.actif]); }
  else if(e.key === 'Escape'){ e.preventDefault(); fermerPicker(true); }
});
pickL.addEventListener('click', e => { const li = e.target.closest('[data-item]'); if(li) prendrePicker(li.dataset.item); });
document.addEventListener('pointerdown', e => { if(PICK && !picker.contains(e.target) && !e.target.closest('[data-pick]')) fermerPicker(false); });
document.getElementById('choixRaz').addEventListener('click', () => { S.choix = {}; garder(); calcul(); });

// grille de paliers commune aux outils (commun/ficsit-paliers.js) : avec une partie, au-delà de son palier = hachuré
function grillePaliers(C){
  FicsitPaliers.grille(document.getElementById('paliers'), {max: 9, sel: C.palier,
    ok: t => !C.p || t <= C.palierMax, ico: n => ico(n),
    titre: t => C.p && t > C.palierMax ? L({fr: `Palier ${t} : pas encore atteint dans votre partie`, en: `Tier ${t}: not reached yet in your game`})
      : L({fr: `Palier ${t} : recettes jusqu'à ce palier`, en: `Tier ${t}: recipes up to this tier`}),
    clic: t => { if(C.p) S.palierPartie.t = t; else S.palier = t; garder(); calcul(); }});
}
function rendreContexte(C){
  const el = document.getElementById('ctx');
  if(C.p){
    const u = !ETAT_U ? '' : ETAT_U.ok
      ? L({fr: `Usine lue : <b>${num(ETAT_U.n, 0)}</b> machines de production.`, en: `Factory read: <b>${num(ETAT_U.n, 0)}</b> production machines.`})
        + (S.mode === 'defaut' ? ` <label><input type="checkbox" id="suivre"${S.suivre ? ' checked' : ''}> ${L({fr: 'Recettes de mon usine d\'abord', en: 'My factory\'s recipes first'})}</label>
          <span class="aide-mode">${L({fr: 'Pour chaque item, la recette que vos machines utilisent déjà, plutôt que la standard.',
            en: 'For each item, the recipe your machines already use, rather than the standard one.'})}</span>` : '')
      : ETAT_U.manque ? L({fr: 'Fichier de la sauvegarde non gardé par ce navigateur : réimportez-le (« Ma partie ») pour comparer avec votre usine.',
          en: 'Save file not kept by this browser: import it again ("My game") to compare with your factory.'})
      : ETAT_U.erreur ? L({fr: 'Usine illisible dans cette sauvegarde : comparaison indisponible.', en: 'Factory unreadable in this save: no comparison.'})
      : L({fr: `Lecture de l'usine… ${num(ETAT_U.f * 100, 0)} %`, en: `Reading the factory… ${num(ETAT_U.f * 100, 0)}%`});
    document.getElementById('altBox').innerHTML = '';
    el.innerHTML = `<div class="b-pal" id="paliers"></div>
      <span>${L({fr: `Partie importée : palier <b>${C.palierMax}</b> atteint, recettes débloquées dans la sauvegarde.`,
      en: `Imported game: tier <b>${C.palierMax}</b> reached, recipes unlocked in the save.`})}</span> <span id="etatUsine">${u}</span>`;
    grillePaliers(C);
    const su = document.getElementById('suivre');
    if(su) su.onchange = e => { S.suivre = e.target.checked; garder(); calcul(); };
    return;
  }
  el.innerHTML = `<div class="b-pal" id="paliers"></div>`;
  document.getElementById('altBox').innerHTML = `<label${S.mode !== 'defaut' ? ` class="force" title="${esc(L({fr: 'Toujours incluses quand les recettes sont optimisées', en: 'Always included when recipes are optimised'}))}"` : ''}><input type="checkbox" id="alt"${S.alt || S.mode !== 'defaut' ? ' checked' : ''}${S.mode !== 'defaut' ? ' disabled' : ''}> ${L({fr: 'Alternatives', en: 'Alternates'})}${S.mode !== 'defaut' ? ` <small>${L({fr: '(incluses par l\'optimisation)', en: '(included by the optimisation)'})}</small>` : ''}</label>
`;
  grillePaliers(C);
  document.getElementById('alt').onchange = e => { S.alt = e.target.checked; garder(); calcul(); };
}

/* ---------- calcul et rendu ---------- */
const flux = (n, v, cls) => `<span class="flux${cls ? ' ' + cls : ''}">${ico(n, 1)}<span><b>${num(v)}</b> ${esc(nomItem(n))} <span class="fl">${unite(n)}</span></span></span>`;

// optimisation mémorisée : la place se résout en nombres entiers (jusqu'à quelques secondes sur une grosse chaîne) ;
// changer le montage, la langue ou la vue ne la relance pas
const OPTI = new Map();
function optimise(C, REF){
  const cle = JSON.stringify([S.cibles, S.choix, S.mode, S.mode === 'synthese' ? S.poids : 0, C.p ? [...FicsitPartie.permises(C.p)].sort().concat(C.palier) : [S.palier, S.alt]]);
  if(!OPTI.has(cle)){
    if(OPTI.size > 12) OPTI.delete(OPTI.keys().next().value);
    OPTI.set(cle, M.optimiser(P, S.cibles, {permise: C.permise, choix: S.choix, critere: S.mode, poids: S.poids, ref: REF}, HIGHS));
  }
  return OPTI.get(cle);
}
function calcul(){
  const C = contexte();
  rendreContexte(C);
  const opt = S.mode !== 'defaut';
  if(opt) solveur();
  // chaîne standard (une recette par item) : référence de la synthèse et des écarts affichés dans le bilan
  const REF = opt ? M.mesures(P, M.calculer(P, S.cibles, {permise: C.permise, choix: S.choix})) : null;
  let R = opt && HIGHS ? optimise(C, REF) : null;
  const repli = opt && !R;
  if(!R) R = M.calculer(P, S.cibles, {permise: C.permise, choix: S.choix, preferees: C.preferees});
  const EC = INST ? new Map(R.etapes.map(e => [e, M.ecart(e, INST)])) : null;
  const D = dispo(C);
  const cibles = new Set(S.cibles.map(c => c.item));

  const al = [];
  if(repli) al.push(ETAT_H === 'charge' ? L({fr: 'Chargement du solveur… en attendant, recettes « une par item ».', en: 'Loading the solver… meanwhile, "one per item" recipes.'})
    : L({fr: 'Optimisation impossible (solveur indisponible) : recettes « une par item ».', en: 'Optimisation unavailable (solver failed): "one per item" recipes.'}));
  if(R.manquants.length) al.push(L({fr: 'Aucune recette permise pour : ', en: 'No allowed recipe for: '})
    + R.manquants.map(n => esc(nomItem(n))).join(', ')
    + L({fr: '. Ils sont comptés comme ressources à fournir.', en: '. They are counted as resources to supply.'}));
  if(!R.converge) al.push(L({fr: 'Le calcul ne se stabilise pas (boucle de recettes qui consomme plus qu\'elle ne produit) : changez une des recettes en boucle.',
    en: 'The plan does not settle (a recipe loop consumes more than it makes): change one of the looping recipes.'}));
  document.getElementById('alertes').innerHTML = al.map(t => `<div class="alerte">${t}</div>`).join('');

  const nbMach = R.etapes.reduce((s, e) => s + e.entieres, 0);
  const tuile = (v, l, k, ec) => `<div class="tuile"${k ? ` data-k="${k}"` : ''}><div class="big">${v}</div><div class="lbl">${l}</div>${ec || ''}</div>`;
  // en mode optimisé : écart de chaque critère face à la chaîne standard
  const MS = M.mesures(P, R);
  const ecart = k => {
    if(!REF || repli || !(REF[k] > 1e-9)) return '';
    const d = (MS[k] / REF[k] - 1) * 100;
    if(Math.abs(d) < 0.5) return `<div class="ec">= ${L({fr: 'standard', en: 'standard'})}</div>`;
    return `<div class="ec ${d < 0 ? 'mieux' : 'pire'}">${d > 0 ? '+' : '−'}${num(Math.abs(d), 0)} % ${L({fr: 'face au standard', en: 'vs standard'})}</div>`;
  };
  document.getElementById('tuiles').innerHTML =
    tuile(num(R.mw, 1) + ' MW', L({fr: 'Consommation des machines', en: 'Machine power draw'}), 'mw', ecart('mw')) +
    tuile(num(MS.mat, 2) + ' ‰', L({fr: 'des ressources de la carte', en: 'of the map\'s resources'}), 'rare', ecart('mat')) +
    tuile(num(MS.esp, 0) + ' m²', L({fr: 'Espace au sol (machines)', en: 'Floor space (machines)'}), 'esp', ecart('esp')) +
    tuile(num(nbMach, 0), L({fr: 'Machines', en: 'Machines'})) +
    tuile(num(R.etapes.length, 0), L({fr: 'Recettes', en: 'Recipes'})) +
    (EC ? tuile(num([...EC.values()].reduce((s, x) => s + Math.ceil(x.machines - 1e-6), 0), 0),
      L({fr: 'Machines à construire', en: 'Machines to build'})) : '');

  const tri = o => Object.keys(o).sort((a, b) => o[b] - o[a]);
  document.getElementById('bruts').innerHTML = tri(R.bruts).map(n => flux(n, R.bruts[n])).join('')
    || `<p class="vide">${L({fr: 'Aucune.', en: 'None.'})}</p>`;
  document.getElementById('surplus').innerHTML = tri(R.surplus).map(n => flux(n, R.surplus[n], 'sp')).join('')
    || `<p class="vide">${L({fr: 'Aucun.', en: 'None.'})}</p>`;
  // recettes alternatives du plan : un bouton par recette, qui choisit son bloc dans le graphe
  const alts = R.etapes.filter(e => e.recette.alt);
  document.getElementById('alts').innerHTML = alts.map(e => `<button type="button" class="flux alt" data-aller="${esc('e:' + e.recette.classe)}">${ico(e.item, 1)}<span>${esc(nomRec(e.recette.nom))}
      <small>· ${esc(nomBat(e.recette.machine))}</small></span></button>`).join('')
    || `<p class="vide">${L({fr: 'Aucune : recettes standard seulement.', en: 'None: standard recipes only.'})}</p>`;

  document.getElementById('etapes').innerHTML = R.etapes.map(e => {
    const r = e.recette, cand = optionsRecette(e.item, r, C);
    const opts = cand.map(c => `<option value="${esc(c.classe)}"${c === r ? ' selected' : ''}>${esc(libRecette(c))}</option>`).join('')
      + `<option value="brut">${L({fr: 'Fourni (hors chaîne)', en: 'Supplied (outside the chain)'})}</option>`;
    const cad = e.cadence > 0.99999 ? '100 %' : num(e.cadence * 100, 1) + ' %';
    const x = EC && EC.get(e), u = unite(e.item);
    const usine = !x ? '' : `<div class="usine">${x.n
      ? L({fr: `Votre usine : <b>${num(x.n, 0)}</b> machine(s) avec cette recette, <b>${num(x.installe)}</b> ${u}`,
          en: `Your factory: <b>${num(x.n, 0)}</b> machine(s) with this recipe, <b>${num(x.installe)}</b> ${u}`})
        + (x.prod != null ? L({fr: ` (tournent à ${num(x.prod * 100, 0)} %)`, en: ` (running at ${num(x.prod * 100, 0)}%)`}) : '')
      : L({fr: 'Votre usine : aucune machine avec cette recette', en: 'Your factory: no machine with this recipe'})}
      · ${x.manque > 1e-6
        ? `<span class="ko">${L({fr: `manque ${num(x.manque)} ${u}, ${num(Math.ceil(x.machines - 1e-6), 0)} machine(s) à construire`,
            en: `${num(x.manque)} ${u} short, ${num(Math.ceil(x.machines - 1e-6), 0)} machine(s) to build`})}</span>`
        : `<span class="okc">${L({fr: 'capacité suffisante', en: 'enough capacity'})}</span>`}</div>`;
    const etat = !x ? '' : x.manque > 1e-6 ? ' manque' : ' couvert';
    return `<div class="etape${cibles.has(e.item) ? ' cib' : etat}">${ico(e.item)}
      <div class="nom">${esc(nomItem(e.item))}<small>${esc(nomBat(r.machine))}</small></div>
      <div class="mach">${num(e.entieres, 0)} × ${cad}<small>${num(e.machines, 2)} ${L({fr: 'machines exactes', en: 'exact machines'})} · ${num(e.mw, 1)} MW</small></div>
      <div class="det">
        <select data-item="${esc(e.item)}" aria-label="${esc(L({fr: 'Recette', en: 'Recipe'}))}">${opts}</select>
        ${e.entrees.map(p => flux(p[0], p[1])).join('')}
        <span class="fl">→</span>
        ${e.sorties.map(p => flux(p[0], p[1])).join('')}
      </div>${usine}${(() => { const m = texteMontage(e, D);
        return `<details class="montage"><summary>${L({fr: 'Montage', en: 'Layout'})} : ${m.resume}</summary>${m.lignes.join('')}</details>`; })()}</div>`;
  }).join('') || `<p class="vide">${L({fr: 'Rien à produire.', en: 'Nothing to make.'})}</p>`;
  DERNIER = {R, EC, D, C};
  rendreGraphe();   // le graphe reste dessous, même quand la liste est ouverte
}

/* ---------- vue en graphe : colonnes de la mise en page du moteur (M.graphe), ressources à gauche ----------
   Ordre dans chaque colonne : barycentre des voisins (pondéré par le débit), en balayages alternés, pour limiter
   les croisements. Liens : courbes de Bézier, ports répartis sur la hauteur du bloc dans l'ordre des voisins, avec le
   convoyeur qu'il faut. Un bloc déplacé garde sa place (S.pos, par identifiant stable : recette, ressource, objectif). */
let DERNIER = null, GEO = null, CHOISI = null;
const GW = 196, GH = 76, GX = 130, GY = 18, MARGE = 16;
/* montage dessiné dans un bloc déplié, de gauche à droite : lignes d'entrée, séparateurs (carrés orange), une rangée par
   machine, groupeurs (losanges blancs), lignes de sortie. Chaque entrée et chaque sortie a sa ligne, son montage et son
   convoyeur, dans sa bande : la première entrée part du bord gauche (la plus éloignée des machines), les suivantes
   arrivent par le haut ; la première sortie va au bord droit, les suivantes (sous-produits) repartent par le bas. Chaque ligne touche
   les machines à sa hauteur (décalée d'une ligne à l'autre). Au-delà de 27 machines, pas de dessin. */

/* items acheminés : une icône par unité sur le trajet, qui avance à la vitesse du convoyeur (SMIL). Dans un montage déplié
   (seulement au zoom SEUIL_PROCHE ou plus, classe « proche » du dessin) et sur les liens qui sortent d'un bloc replié ou, au zoom
   plus faible, de n'importe quel bloc. Au-delà de PLAFOND_PORTES icônes, retour aux points qui défilent. */
const SEUIL_PROCHE = 0.8, PLAFOND_PORTES = 800, PLAFOND_BLOC = 150, VITESSE = {t1: 12, t2: 16, t3: 21, t4: 28, t5: 36, t6: 48, p1: 16, p2: 28};   // px/s
let NPORTES = 0;
const calme = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
// groupe d'une icône qui avance le long de d (ou posée à son point, en mouvement réduit) ; fixe : [x, y]
const porteSvg = (item, d, dur, decal, taille, fixe, titre) => {
  const f = P.ic[item], r = taille / 2 + 1.5;
  const mv = fixe ? '' : `<animateMotion dur="${dur.toFixed(2)}s" begin="${(-decal).toFixed(2)}s" repeatCount="indefinite" path="${d}"/>`;
  return `<g class="porte"${fixe ? ` transform="translate(${fixe[0].toFixed(1)},${fixe[1].toFixed(1)})"` : ''}>${mv}<circle r="${r}" style="fill:#1c1c1c;stroke:none"/>`
    + `<image href="commun/icones-44/${f}.webp" x="${-taille / 2}" y="${-taille / 2}" width="${taille}" height="${taille}"/>${titre ? `<title>${esc(titre)}</title>` : ''}</g>`;
};
// icônes des liens entre blocs : posées après coup (la longueur d'une courbe se mesure dans le DOM), refaites quand un bloc bouge
function portesLien(svg, k){
  svg.querySelectorAll(`.porte-lien[data-k="${k}"]`).forEach(g => g.remove());
  const l = GEO.liens[k], lien = svg.querySelector(`.lien[data-k="${k}"]`), pt = svg.querySelector(`.defile[data-k="${k}"]`);
  if(!lien || !pt || !P.ic[l.item]) return;
  const len = lien.getTotalLength(), m = Math.max(1, Math.round(len / 90));
  if(NPORTES + m > PLAFOND_PORTES){ pt.removeAttribute('data-src'); return; }
  NPORTES += m;
  const niv = classeTapis(l.tapis, LIQ.has(l.item)).split(' ')[0], dur = len / (VITESSE[niv] || 12), fixe = calme();
  const src = GEO.parId.get(l.de).sch ? 'd' : 'p', d = lien.getAttribute('d');
  pt.setAttribute('data-src', src);
  let html = '';
  for(let i = 0; i < m; i++){
    const q = fixe ? lien.getPointAtLength(len * (i + 0.5) / m) : null;
    html += porteSvg(l.item, d, dur, dur * i / m, 14, q ? [q.x, q.y] : null, '').replace('class="porte"', `class="porte porte-lien" data-k="${k}" data-de="${esc(l.de)}" data-vers="${esc(l.vers)}" data-src="${src}"`);
  }
  const noeud = svg.querySelector('.noeud');
  const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g'); tmp.innerHTML = html;
  [...tmp.children].forEach(g => svg.insertBefore(g, noeud));
}
function majProche(svg){
  if(!svg) return;
  svg.classList.toggle('proche', S.zoom >= SEUIL_PROCHE);
  svg.classList.toggle('trop', svg.querySelectorAll('.porte-m').length > PLAFOND_PORTES);   // trop d'icônes à animer : les points
}
const RH0 = 20, DX = 26, MW = 30, MH = 12, MAXDESSIN = 27, PAS = 26, DECAL = 14;
function schemaMontage(e, D, rang){
  const mo = M.montage(e, S.montage, D, LIQ), n = e.entieres;
  const tSep = L({fr: 'Séparateur', en: 'Splitter'}), tGrp = L({fr: 'Groupeur', en: 'Merger'});
  if(n > MAXDESSIN) return {w: GW, h: GH + 24, nSep: 0, nGrp: 0,
    svg: `<text x="12" y="${GH + 12}" class="n4">${esc(L({fr: `${n} machines : trop pour être dessiné`, en: `${n} machines: too many to draw`}))}</text>`};
  // ordre des bandes : celui demandé (rang : item → rang, d'après la hauteur des blocs voisins), sinon solides d'abord,
  // et pour les sorties le produit de l'étape d'abord
  const poids = (l, prem) => rang && rang[l.item] != null ? rang[l.item] : (l.item === prem ? -2 : l.liquide ? 1 : 0);
  const ordre = (ls, prem) => ls.slice().sort((a, b) => poids(a, prem) - poids(b, prem));
  const ents = ordre(mo.entrees), sors = ordre(mo.sorties, e.item), kE = ents.length, kS = sors.length, K = Math.max(kE, kS, 1);
  const MHk = MH + (K - 1) * DECAL, RH = Math.max(RH0, MHk + 8);
  const boucle = Math.max(0, ...ents.map(l => l.mode === 'equilibre' ? l.boucle : 0)), rows = n + boucle;
  const top = GH + 12 + PAS * (K - 1);   // au-dessus : les lignes qui arrivent ou repartent par le haut
  const y = i => top + RH * i + RH / 2;
  const dE = j => (j - (kE - 1) / 2) * DECAL, dS = j => (j - (kS - 1) / 2) * DECAL;
  const yF = j => top - PAS * j + 2;     // ligne j > 0 : passage par le haut
  let out = [], nSep = 0, nGrp = 0, porte = null;
  const textes = [], fixe = calme();
  const trait = (d, cls) => {
    out.push(`<path class="sch${cls ? ' ' + cls : ''}" d="${d}"/>`);
    // points qui défilent dans le sens du tracé (tous les tracés vont de l'entrée vers la sortie) ; au zoom voulu, des icônes
    // les remplacent (.avec-ic, jeton résolu une fois les trajets connus)
    const niv = (cls || '').match(/\b[tp][1-6]\b/), liq = /\bliq\b/.test(cls || '');
    out.push(`<path class="defile d-sch${porte && P.ic[porte] ? '@IC@' : ''}${niv ? ' ' + niv[0] : ''}${liq ? ' liq' : ''}" d="${d}" stroke-width="1.6"/>`);
  };
  /* trajets des items : un par machine et par bande, de l'entrée de la bande à la machine (entrées) ou de la machine à la fin de
     la bande (sorties), d'un seul tenant. Les items sont émis à intervalle régulier à l'origine de la bande, le k-ième prend
     le trajet k mod K (K trajets) : un item qui arrive à un séparateur continue donc sur UNE branche (tour à tour), sans
     disparaître ni réapparaître, et le flux se partage comme dans le jeu (espacement K fois plus grand sur chaque branche). */
  const bandes = [];
  const ESPACE = n > 8 ? 70 : 44;
  // un trajet est une suite de segments droits {x0, y0, x1, y1, L, v}, chacun à la vitesse de son niveau de convoyeur
  const vitesseDe = (tapis, liq) => VITESSE[classeTapis(tapis, liq).split(' ')[0]] || 12;
  const segT = (x0, y0, x1, y1, tapis, liq) => ({x0, y0, x1, y1, L: Math.abs(x1 - x0) + Math.abs(y1 - y0), v: vitesseDe(tapis, liq)});
  // suite H/V/H… à partir de (x, y) : pas = [['H', x1, tapis], ['V', y1, tapis], …]
  const suite = (x, y, pas, liq) => pas.map(([k, val, tapis]) => { const sg = k === 'H' ? segT(x, y, val, y, tapis, liq) : segT(x, y, x, val, tapis, liq); if(k === 'H') x = val; else y = val; return sg; });
  const dTrajet = r => r.length ? `M${r[0].x0},${r[0].y0}` + r.map(sg => sg.x1 !== sg.x0 ? ` H${sg.x1}` : ` V${sg.y1}`).join('') : '';
  const prevoir = (item, liq, trajets) => {
    const K = trajets.length, v0 = trajets[0][0].v, Tc = ESPACE / v0;
    const liste = trajets.map((r, i) => { const T = r.reduce((a, sg) => a + sg.L / sg.v, 0), m = Math.max(1, Math.ceil(T / (K * Tc)));
      return {r, i, T, m, C: m * K * Tc}; });
    return {item, K, Tc, liste, total: liste.reduce((a, q) => a + q.m, 0)};
  };
  // position à l'instant t après l'émission, le long du trajet r (vitesses par segment)
  const positionTrajet = (r, t) => {
    for(const sg of r){ const dt = sg.L / sg.v; if(t <= dt || sg === r[r.length - 1]){ const f = dt ? Math.min(1, t / dt) : 1; return [sg.x0 + (sg.x1 - sg.x0) * f, sg.y0 + (sg.y1 - sg.y0) * f]; } t -= dt; }
    return [0, 0];
  };
  const porteurs = b => {
    const html = [];
    b.liste.forEach(({r, i: ri, T, m, C}) => {
      const d = dTrajet(r), Ltot = r.reduce((a, sg) => a + sg.L, 0) || 1, f = Math.min(1, T / C);
      // keyPoints / keyTimes : avancement (part de la longueur) à chaque fin de segment, et instant correspondant (part de C)
      let lc = 0, tc = 0; const kp = ['0'], kt = ['0'];
      r.forEach(sg => { lc += sg.L; tc += sg.L / sg.v; kp.push((lc / Ltot).toFixed(4)); kt.push((tc / C).toFixed(4)); });
      kp.push('1'); kt.push('1');
      for(let k = 0; k < m; k++){
        const t0 = (ri + b.K * k) * b.Tc;
        if(fixe){ if(t0 <= T){ const [px, py] = positionTrajet(r, t0); html.push(porteSvg(b.item, d, 0, 0, 10, [px, py], nomItem(b.item))); } continue; }
        html.push(`<g class="porte"><animateMotion dur="${C.toFixed(2)}s" begin="${(-t0).toFixed(2)}s" repeatCount="indefinite" path="${d}" keyPoints="${kp.join(';')}" keyTimes="${kt.join(';')}" calcMode="linear"/>`
          + `<animate attributeName="opacity" dur="${C.toFixed(2)}s" begin="${(-t0).toFixed(2)}s" repeatCount="indefinite" values="1;0" keyTimes="0;${f.toFixed(4)}" calcMode="discrete"/>`
          + `<circle r="6.5" style="fill:#1c1c1c;stroke:none"/><image href="commun/icones-44/${P.ic[b.item]}.webp" x="-5" y="-5" width="10" height="10"/><title>${esc(nomItem(b.item))}</title></g>`);
      }
    });
    return html.join('').replace(/class="porte"/g, 'class="porte porte-m"');
  };
  const sep = (x, yy) => { nSep++; out.push(`<rect class="sep" x="${x - 4}" y="${yy - 4}" width="8" height="8"><title>${tSep}</title></rect>`); };
  const grp = (x, yy) => { nGrp++; out.push(`<rect class="grp" x="${x - 4}" y="${yy - 4}" width="8" height="8" transform="rotate(45 ${x} ${yy})"><title>${tGrp}</title></rect>`); };
  const texte = (x, yy, t, cls, fin) => textes.push(`<text class="sch-t${cls ? ' ' + cls : ''}" x="${x}" y="${yy}"${fin ? ' text-anchor="end"' : ''}>${esc(t)}</text>`);
  const cl = (l, t) => (l.liquide ? 'liq ' : '') + classeTapis(t, l.liquide);
  // texte « Mk.x » à la couleur du niveau, posé là où le niveau change (et au départ de chaque bande d'entrée)
  const tn = (t, liq) => classeTapis(t, liq).split(' ')[0];
  const etiq = (x, yy, t, liq) => texte(x, yy, tapisCourt(t), 'tap ' + tn(t, liq));
  // --- une bande d'entrée : de (x0, départ) jusqu'aux machines (xM), à la hauteur y(i) + dy ; renvoie le point de départ
  function bandeE(l, x0, xM, dy, j){
    porte = l.item;
    let y0 = y(0) + dy;
    const trajets = [];
    if(l.mode === 'direct'){ trait(`M${x0},${y0} H${xM}`, cl(l, l.ligne)); trajets.push(suite(x0, y0, [['H', xM, l.ligne]], l.liquide)); }
    else if(l.mode === 'manifold'){
      const xT = x0 + 20;
      trait(`M${x0},${y0} H${xT} V${y(n - 1) + dy} H${xM}`, cl(l, l.ligne));
      for(let i = 0; i < n - 1; i++){ trait(`M${xT},${y(i) + dy} H${xM}`, cl(l, l.branche)); if(!l.liquide) sep(xT, y(i) + dy); }
      for(let i = 0; i < n; i++) trajets.push(suite(x0, y0, [['H', xT, l.ligne], ['V', y(i) + dy, l.ligne], ['H', xM, i === n - 1 ? l.ligne : l.branche]], l.liquide));
      if(n > 1 && tn(l.branche, l.liquide) !== tn(l.ligne, l.liquide)) etiq(xT + 4, y(0) + dy - 3, l.branche, l.liquide);
    } else {
      const q = M.equilibre(n), f = q.facteurs, xR = x0 + (boucle ? 40 : 18);
      // séparateur de l'étage k, rang t : couvre les feuilles [t·c, (t+1)·c), c = m / (f1·…·fk)
      const ys = (k, t) => { let pr = 1; for(let i = 0; i < k; i++) pr *= f[i]; const c = q.m / pr; return (y(t * c) + y((t + 1) * c - 1)) / 2 + dy; };
      y0 = ys(0, 0);
      trait(`M${x0},${y0} H${xR}`, classeTapis(l.ligne));
      if(l.boucle) grp(x0 + 16, y0);
      let nb = 1, precedent = l.ligne;
      const tapisEtage = k => l.etages && l.etages[k] ? l.etages[k].tapis : l.branche;
      f.forEach((fk, k) => {
        const xk = xR + k * DX, xs = k < f.length - 1 ? xk + DX : xM;
        if(tn(tapisEtage(k), l.liquide) !== tn(precedent, l.liquide)) etiq(xk + DX / 2 + 2, (k < f.length - 1 ? ys(k + 1, 0) : y(0) + dy) - 3, tapisEtage(k), l.liquide);
        precedent = tapisEtage(k);
        for(let t = 0; t < nb; t++){
          const ya = ys(k, t);
          for(let c = 0; c < fk; c++){
            const ch = t * fk + c, yb = k < f.length - 1 ? ys(k + 1, ch) : y(ch) + dy;
            trait(`M${xk},${ya} H${xk + DX / 2} V${yb} H${xs}`, classeTapis(l.etages && l.etages[k] ? l.etages[k].tapis : l.branche));
          }
          sep(xk, ya);
        }
        nb *= fk;
      });
      // trajet de chaque machine : l'étage k envoie la feuille L vers le séparateur ch = ⌊L ÷ (m / (f1…fk+1))⌋
      for(let L = 0; L < n; L++){
        const pas = [['H', xR, l.ligne]]; let pr = 1;
        f.forEach((fk, k) => {
          pr *= fk;
          const xk = xR + k * DX, xs = k < f.length - 1 ? xk + DX : xM, ch = Math.floor(L / (q.m / pr)), tap = l.etages && l.etages[k] ? l.etages[k].tapis : l.branche;
          pas.push(['H', xk + DX / 2, tap], ['V', k < f.length - 1 ? ys(k + 1, ch) : y(ch) + dy, tap], ['H', xs, tap]);
        });
        trajets.push(suite(x0, y0, pas, l.liquide));
      }
      // sorties en trop : renvoyées sur l'entrée par le groupeur ; les items y suivent leur feuille puis le trait de retour
      const yb = top + rows * RH + 4 + j * 4;
      for(let L = n; L < n + l.boucle; L++){
        const pas = [['H', xR, l.ligne]]; let pr = 1, tap = l.branche;
        f.forEach((fk, k) => {
          pr *= fk;
          const xk = xR + k * DX, xs = k < f.length - 1 ? xk + DX : xM, ch = Math.floor(L / (q.m / pr));
          tap = tapisEtage(k);
          pas.push(['H', xk + DX / 2, tap], ['V', k < f.length - 1 ? ys(k + 1, ch) : y(ch) + dy, tap], ['H', xs, tap]);
        });
        pas.push(['V', yb, tap], ['H', x0 + 16, tap], ['V', y0, tap]);
        trajets.push(suite(x0, y0, pas, l.liquide));
      }
      for(let r = n; r < n + l.boucle; r++){
        if(j === 0) texte(xM + 2, y(r) + 3, '↺');
        trait(`M${xM},${y(r) + dy} V${yb} H${x0 + 16} V${y0}`, 'boucle');
      }
    }
    return {y0, trajets};
  }
  const largeurE = l => l.mode === 'direct' ? 26 : l.mode === 'manifold' ? 50 : (boucle ? 40 : 18) + M.equilibre(n).facteurs.length * DX + 8;
  // --- entrées : bande 0 à gauche (après la marge des noms), bandes suivantes vers les machines
  // Calage horizontal : bandes d'entrée, machines (xM, xO), début de chaque bande de sortie (x1S) et bord droit du bloc (xFin),
  // où le dernier groupeur vient s'appuyer (le lien qui sort du bloc part de là). Si le montage est plus étroit que le bloc,
  // il est décalé vers la droite (la ligne d'entrée s'allonge) plutôt que de tirer un trait de sortie jusqu'au bord.
  const AMORCE = kE > 1 ? 28 : 0;
  let x0E, xM, xO, x1S, xFin;
  const calage = amorce => {
    x0E = []; let xc = amorce;
    ents.forEach(l => { x0E.push(xc); xc += largeurE(l); });
    xM = Math.max(xc, 46); xO = xM + MW;
    x1S = new Array(kS); xc = xO;
    for(let j = kS - 1; j >= 0; j--){ x1S[j] = xc; xc = bandeS(sors[j], xc, dS(j), true)[0] + 8; }
    xFin = xc - 8;
  };
  calage(AMORCE);
  if(xFin < GW) calage(AMORCE + GW - xFin);
  const yEs = {}; let yE = y(0);
  ents.forEach((l, j) => {
    porte = l.item;
    const {y0, trajets} = bandeE(l, x0E[j], xM, dE(j), j);
    let amorce = [];
    if(j === 0){
      if(x0E[0] > 0){ trait(`M0,${y0} H${x0E[0]}`, cl(l, l.ligne)); amorce = suite(0, y0, [['H', x0E[0], l.ligne]], l.liquide); }
      yE = y0; yEs[l.item] = y0; etiq(4, y0 - 9, l.ligne, l.liquide);
    } else {
      trait(`M0,${yF(j)} H${x0E[j]} V${y0}`, cl(l, l.ligne)); amorce = suite(0, yF(j), [['H', x0E[j], l.ligne], ['V', y0, l.ligne]], l.liquide);
      yEs[l.item] = yF(j); etiq(4, yF(j) - 9, l.ligne, l.liquide);
    }
    if(P.ic[l.item]) bandes.push(prevoir(l.item, l.liquide, trajets.map(r => amorce.concat(r))));
  });
  // --- machines
  for(let i = 0; i < n; i++){
    out.push(`<rect class="mach" x="${xM}" y="${y(i) - MHk / 2}" width="${MW}" height="${MHk}" rx="3"><title>${esc(nomBat(e.recette.machine))} ${i + 1}</title></rect>`);
    if(n > 1) out.push(`<text class="mach-n" x="${xM + MW / 2}" y="${y(i) + 3.5}" text-anchor="middle">${i + 1}</text>`);
  }
  // --- une bande de sortie : des machines (xO) jusqu'à x1 (début de la bande) + sa largeur ; renvoie [x de fin, y de fin]
  function bandeS(l, x1, dy, mesure){
    porte = l.item;
    const t = mesure ? () => {} : trait, g = mesure ? () => {} : grp, trajets = [];
    if(l.mode === 'manifold'){
      const xT = x1 + 18;
      t(`M${xO},${y(0) + dy} H${xT} V${y(n - 1) + dy} H${xT + 10}`, cl(l, l.ligne));
      for(let i = 1; i < n; i++){ t(`M${xO},${y(i) + dy} H${xT}`, cl(l, l.branche)); if(!l.liquide) g(xT, y(i) + dy); }
      if(!mesure && n > 1 && tn(l.branche, l.liquide) !== tn(l.ligne, l.liquide)){ etiq(xO + 3, y(1) + dy - 3, l.branche, l.liquide); etiq(xT + 3, y(0) + dy - 3, l.ligne, l.liquide); }
      for(let i = 0; i < n; i++) trajets.push(suite(xO, y(i) + dy, [['H', xT, i === 0 ? l.ligne : l.branche], ['V', y(n - 1) + dy, l.ligne], ['H', xT + 10, l.ligne]], l.liquide));
      return [xT + 10, y(n - 1) + dy, trajets];
    }
    if(l.mode === 'equilibre'){
      // groupeurs à 3 entrées, en file : chaque groupeur prend les trois premières lignes et rejoint la fin de la file
      const file = Array.from({length: n}, (_, i) => ({x: x1, xs: xO, y: y(i) + dy, ids: [i]}));
      for(let i = 0; i < n; i++) trajets.push([]);
      let premier = true;
      if(!mesure && tn(l.branche, l.liquide) !== tn(l.ligne, l.liquide)) etiq(xO + 3, y(0) + dy - 3, l.branche, l.liquide);
      while(file.length > 1){
        const gs = file.splice(0, Math.min(3, file.length)), gx = Math.max(...gs.map(a => a.x)) + DX, gy = gs.reduce((s0, a) => s0 + a.y, 0) / gs.length;
        gs.forEach(a => { t(`M${a.xs},${a.y} H${gx - DX / 2} V${gy} H${gx}`, classeTapis(a.xs === xO ? l.branche : l.ligne)); const tap = a.xs === xO ? l.branche : l.ligne; a.ids.forEach(i => { const r = trajets[i], px = r.length ? r[r.length - 1].x1 : xO, py = r.length ? r[r.length - 1].y1 : y(i) + dy; trajets[i] = r.concat(suite(px, py, [['H', gx - DX / 2, tap], ['V', gy, tap], ['H', gx, tap]], l.liquide)); }); });
        if(!mesure && premier && tn(l.branche, l.liquide) !== tn(l.ligne, l.liquide)) etiq(gx + 3, gy - 3, l.ligne, l.liquide);
        premier = false;
        g(gx, gy); file.push({x: gx, xs: gx, y: gy, ids: [].concat(...gs.map(a => a.ids))});
      }
      return [file[0].x, file[0].y, trajets];
    }
    t(`M${xO},${y(0) + dy} H${x1 + 8}`, cl(l, l.ligne));
    return [x1 + 8, y(0) + dy, [suite(xO, y(0) + dy, [['H', x1 + 8, l.ligne]], l.liquide)]];
  }
  // sorties : bande 0 la plus à droite (au bord du bloc), les suivantes plus près des machines
  // sorties suivantes (sous-produits) : repartent par le bas, comme leurs blocs « surplus » en bas de colonne
  const bas = top + rows * RH + (boucle ? 12 + 4 * kE : 6), yB = j => bas + PAS * (j - 1) + 4;
  const ySs = {}; let yS = y(0);
  sors.forEach((l, j) => {
    const [xb, yb, trajets] = bandeS(l, x1S[j], dS(j), false);
    let queue;
    if(j === 0){ yS = yb; ySs[l.item] = yb; queue = []; }
    else { trait(`M${xb},${yb} H${xb + 4} V${yB(j)} H${xFin}`, cl(l, l.ligne)); ySs[l.item] = yB(j); queue = [['H', xb + 4], ['V', yB(j)], ['H', xFin]]; }
    if(P.ic[l.item]) bandes.push(prevoir(l.item, l.liquide, trajets.map(r => { const e = r[r.length - 1]; return r.concat(suite(e.x1, e.y1, queue.map(([k, v2]) => [k, v2, l.ligne]), l.liquide)); })));
  });
  // icônes qui acheminent les items le long des trajets (sinon, trop nombreuses : les points restent)
  const iconesOk = bandes.reduce((a, b) => a + b.total, 0) <= PLAFOND_BLOC;
  if(iconesOk) bandes.forEach(b => out.push(porteurs(b)));
  out = out.map(x => x.replace(/@IC@/g, iconesOk ? ' avec-ic' : ''));
  const h = bas + PAS * Math.max(0, kS - 1);
  return {w: Math.max(GW, xFin), h: h + 10, svg: out.join('') + textes.join(''), nSep, nGrp, yE, yS, yEs, ySs};
}
// légende des couleurs : les niveaux de convoyeur et de tuyau présents dans le graphe
function legende(u){
  const noms = {t1: 'Mk.1', t2: 'Mk.2', t3: 'Mk.3', t4: 'Mk.4', t5: 'Mk.5', t6: 'Mk.6', p1: L({fr: 'tuyau Mk.1', en: 'pipe Mk.1'}), p2: L({fr: 'tuyau Mk.2', en: 'pipe Mk.2'})};
  document.getElementById('legende').innerHTML = Object.keys(noms).filter(k => u.has(k))
    .map(k => `<span class="lg"><i class="${k}"></i>${esc(noms[k])}</span>`).join('');
}
function couper(t, max){ return t.length > max ? t.slice(0, max - 1) + '…' : t; }
function cheminLien(l){
  const a = GEO.parId.get(l.de), b = GEO.parId.get(l.vers);
  // bloc déplié : les liens partent de sa ligne de sortie et arrivent sur sa ligne d'entrée (resserrés autour)
  const x1 = a.px + a.w, x2 = b.px;
  // bloc déplié : chaque item sur sa propre ligne d'entrée ou de sortie
  const y1 = a.py + (a.sch && a.sch.ySs && a.sch.ySs[l.item] != null ? a.sch.ySs[l.item]
    : a.sch && a.sch.yS != null ? a.sch.yS + (l.ps - 0.5) * 14 : a.h * l.ps);
  const y2 = b.py + (b.sch && b.sch.yEs && b.sch.yEs[l.item] != null ? b.sch.yEs[l.item]
    : b.sch && b.sch.yE != null ? b.sch.yE + (l.pe - 0.5) * 14 : b.h * l.pe);
  const courbe = (xa, ya, xb, yb) => { const dx = Math.max(40, Math.abs(xb - xa) / 2); return ` C${xa + dx},${ya} ${xb - dx},${yb} ${xb},${yb}`; };
  if(!l.via) return {d: `M${x1},${y1}` + courbe(x1, y1, x2, y2), mx: (x1 + x2) / 2, my: (y1 + y2) / 2};
  // lien long : droit à travers chaque colonne traversée (entre les blocs), courbes entre les colonnes
  let d = `M${x1},${y1}`, xa = x1, ya = y1;
  l.via.forEach(v => { const yv = v.py + v.h / 2; d += courbe(xa, ya, v.px, yv) + ` L${v.px + v.w},${yv}`; xa = v.px + v.w; ya = yv; });
  d += courbe(xa, ya, x2, y2);
  const m = l.via[Math.floor((l.via.length - 1) / 2)];
  return {d, mx: m.px + m.w / 2, my: m.py + m.h / 2};
}
/* marges du graphe : la place que laisse la colonne (le dessin se centre dans le reste, « Ajuster » le remplit) ;
   le détail du bloc choisi reste sur le bord, sans décaler le dessin */
function marges(){
  const box = document.getElementById('graphe'), col = document.getElementById('colonne'), pad = {t: 16, r: 16, b: 16, l: 16};
  if(innerWidth >= 760) pad.l = col.offsetWidth + 16;
  else pad.t = col.classList.contains('rail') ? col.offsetHeight + 12 : 16;
  box.style.padding = `${pad.t}px ${pad.r}px ${pad.b}px ${pad.l}px`;
  document.getElementById('app').style.setProperty('--col-l', (innerWidth >= 760 ? col.offsetWidth : 0) + 'px');
  return pad;
}
/* disposition : colonnes (déjà fixées), ordre dans chaque colonne, puis hauteur de chaque bloc.
   Un lien qui saute des colonnes reçoit un point de passage par colonne traversée (l.via) : il passe entre les blocs, et
   compte dans l'ordre comme un petit bloc. Ordre : barycentre des voisins (pondéré par le débit), balayages alternés,
   échanges de voisins qui retirent des croisements ; on garde l'ordre qui en a le moins. Hauteur : chaque bloc se cale
   sur ses voisins (liens au plus droit), sans chevauchement ni changement d'ordre (régression isotone, pool adjacent). */
function disposer(G, colonnes){
  const parId = new Map(G.noeuds.map(n => [n.id, n])), aretes = [], nc = colonnes.length;
  G.liens.forEach((l, k) => {
    const a = parId.get(l.de), b = parId.get(l.vers);
    l.via = null;
    if(b.x <= a.x) return;   // arc retour d'une boucle : hors de l'ordre
    let u = a;
    if(b.x - a.x > 1){
      l.via = [];
      for(let x = a.x + 1; x < b.x; x++){
        const v = {id: `v:${k}:${x}`, x, w: 0, h: 10, ae: 5, as: 5, reel: false};
        colonnes[x].push(v); l.via.push(v);
        aretes.push({a: u, b: v, w: l.debit}); u = v;
      }
    }
    aretes.push({a: u, b, w: l.debit});
  });
  const gauche = new Map(), droite = new Map(), lst = (m, n) => m.get(n) || m.set(n, []).get(n);
  aretes.forEach(e => { lst(droite, e.a).push(e); lst(gauche, e.b).push(e); });
  const croisements = x => {   // entre les colonnes x et x+1, pondéré par les débits
    const es = aretes.filter(e => e.a.x === x);
    let c = 0;
    for(let i = 0; i < es.length; i++) for(let j = i + 1; j < es.length; j++){
      const p = es[i], q = es[j];
      if((p.a.o - q.a.o) * (p.b.o - q.b.o) < 0) c += 1 + Math.sqrt(p.w * q.w) / 1e4;
    }
    return c;
  };
  const total = () => { let c = 0; for(let x = 0; x < nc - 1; x++) c += croisements(x); return c; };
  const numeroter = c => c.forEach((n, i) => n.o = i);
  colonnes.forEach(numeroter);
  // échange de deux voisins d'une colonne s'il retire des croisements avec les deux colonnes voisines
  const local = (u, v) => {   // croisements entre les liens de u et de v, u au-dessus de v
    let c = 0;
    [[gauche, 'a'], [droite, 'b']].forEach(([m, k]) => (m.get(u) || []).forEach(p => (m.get(v) || []).forEach(q => { if(p[k].o > q[k].o) c++; })));
    return c;
  };
  const echanger = () => {
    let mieux = true, tours = 0;
    while(mieux && tours++ < 6){
      mieux = false;
      colonnes.forEach(c => {
        for(let i = 0; i + 1 < c.length; i++){
          if(c[i].type === 'surplus' !== (c[i + 1].type === 'surplus')) continue;   // surplus en bas de colonne
          if(local(c[i + 1], c[i]) < local(c[i], c[i + 1])){ [c[i], c[i + 1]] = [c[i + 1], c[i]]; numeroter(c); mieux = true; }
        }
      });
    }
  };
  let meilleur = Infinity, garde = null;
  for(let passe = 0; passe < 12; passe++){
    const versDroite = passe % 2 === 0, ordre = versDroite ? colonnes.slice(1) : colonnes.slice(0, -1).reverse();
    ordre.forEach(c => {
      c.forEach(n => {
        let s = 0, w = 0;
        ((versDroite ? gauche : droite).get(n) || []).forEach(e => { const v = versDroite ? e.a : e.b; s += v.o * e.w; w += e.w; });
        n.b = w ? s / w : n.o;
      });
      c.sort((a, b) => (a.type === 'surplus') - (b.type === 'surplus') || a.b - b.b || a.o - b.o); numeroter(c);
    });
    echanger();
    const t = total();
    if(t < meilleur - 1e-9){ meilleur = t; garde = colonnes.map(c => c.slice()); }
  }
  garde.forEach((c, x) => { colonnes[x] = c; numeroter(c); });
  // hauteurs : départ empilé et centré, puis chaque bloc vers la moyenne de ses voisins (liens longs : plus de poids)
  const ecart = (p, q) => (p.reel && q.reel ? GY : 8);
  const hauteur = c => c.reduce((s0, n, i) => s0 + n.h + (i ? ecart(c[i - 1], n) : 0), 0);
  const haut = Math.max(...colonnes.map(hauteur));
  colonnes.forEach(c => { let y = (haut - hauteur(c)) / 2; c.forEach((n, i) => { if(i) y += ecart(c[i - 1], n); n.py = y; y += n.h; }); });
  for(let passe = 0; passe < 16; passe++){
    const ordre = passe % 2 ? colonnes.slice().reverse() : colonnes;
    ordre.forEach(c => {
      // hauteur voulue : lien a → b au plus droit, a.py + a.as = b.py + b.ae
      const voulu = c.map(n => {
        let s = 0, w = 0;
        (gauche.get(n) || []).forEach(e => { const k = e.w * (n.reel && e.a.reel ? 1 : 2); s += (e.a.py + e.a.as - n.ae) * k; w += k; });
        (droite.get(n) || []).forEach(e => { const k = e.w * (n.reel && e.b.reel ? 1 : 2); s += (e.b.py + e.b.ae - n.as) * k; w += k; });
        return w ? [s / w, w] : [n.py, 1e-3];
      });
      // pool adjacent : z = y − décalage minimal, non décroissant, au plus près de la hauteur voulue
      const dec = []; let o = 0;
      c.forEach((n, i) => { if(i) o += c[i - 1].h + ecart(c[i - 1], n); dec.push(o); });
      const blocs = [];
      c.forEach((n, i) => {
        blocs.push({v: voulu[i][0] - dec[i], w: voulu[i][1], n: 1});
        while(blocs.length > 1 && blocs[blocs.length - 2].v >= blocs[blocs.length - 1].v){
          const q = blocs.pop(), p = blocs[blocs.length - 1];
          p.v = (p.v * p.w + q.v * q.w) / (p.w + q.w); p.w += q.w; p.n += q.n;
        }
      });
      let i = 0;
      blocs.forEach(b => { for(let k = 0; k < b.n; k++, i++) c[i].py = b.v + dec[i]; });
    });
  }
  const y0 = Math.min(...colonnes.flat().map(n => n.py));
  // colonnes : largeur du plus large bloc ; un point de passage traverse toute la colonne
  let xc = MARGE;
  colonnes.forEach(c => {
    const lc = Math.max(...c.map(n => n.reel ? n.w : 0), 1);
    c.forEach(n => { n.py = Math.round(n.py - y0 + MARGE); n.px = xc; if(!n.reel) n.w = lc; });
    xc += lc + GX;
  });
}
function rendreGraphe(){
  if(MENU) fermerMenu(false);
  marges();   // le menu d'un bloc ne survit pas à un nouveau dessin
  const box = document.getElementById('graphe');
  if(!DERNIER || !DERNIER.R.etapes.length){
    box.innerHTML = `<p class="vide" style="padding:12px">${L({fr: 'Rien à produire.', en: 'Nothing to make.'})}</p>`;
    document.getElementById('detail').innerHTML = ''; document.getElementById('legende').innerHTML = ''; GEO = null; return;
  }
  const {R, EC, D} = DERNIER, G = M.graphe(R, S.cibles);
  // objectif replié sur son bloc : quand tout ce qu'une étape produit va à un seul objectif, le cadre de l'objectif (et son
  // lien) disparaît ; le bloc porte l'objectif en onglet. Un item qui sert aussi d'autres blocs, ou plusieurs objectifs,
  // gardent leur cadre.
  {
    const plies = new Set();
    G.noeuds.filter(n => n.type === 'cible').forEach(c => {
      const entrants = G.liens.filter(l => l.vers === c.id); if(entrants.length !== 1) return;
      const src = G.noeuds.find(n => n.id === entrants[0].de);
      if(!src || src.type !== 'etape' || G.liens.filter(l => l.de === src.id).length !== 1) return;
      src.objectif = entrants[0].debit; src.objectifItem = c.item; plies.add(c.id);
    });
    if(plies.size){ G.noeuds = G.noeuds.filter(n => !plies.has(n.id)); G.liens = G.liens.filter(l => !plies.has(l.vers)); }
  }
  const parId = new Map(G.noeuds.map(n => [n.id, n]));
  // colonnes compactées (une colonne de la mise en page peut être vide), ressources à gauche
  const cols = [...new Set(G.noeuds.map(n => n.col))].sort((a, b) => b - a), colonnes = cols.map(() => []);
  G.noeuds.forEach(n => { n.x = cols.indexOf(n.col); colonnes[n.x].push(n); });
  colonnes.forEach(c => c.sort((a, b) => (a.type === 'surplus') - (b.type === 'surplus') || a.item.localeCompare(b.item)));
  // taille de chaque bloc : déplié, il dessine son montage
  const replies = new Set(S.replies);
  const tailler = (n, rang) => {
    n.w = GW; n.h = GH; n.sch = null; n.reel = true;
    if(n.type === 'etape' && !replies.has(n.id)){ n.sch = schemaMontage(n.etape, D, rang); n.w = n.sch.w; n.h = n.sch.h; }
    else if(n.type === 'etape' && n.etape.recette.alt) n.h = GH + 16;   // ligne du nom de la recette alternative
    // hauteur où arrivent et partent les liens (bloc déplié : ses lignes d'entrée et de sortie)
    n.ae = n.sch && n.sch.yE != null ? n.sch.yE : n.h / 2;
    n.as = n.sch && n.sch.yS != null ? n.sch.yS : n.h / 2;
  };
  G.noeuds.forEach(n => tailler(n));
  const cols0 = colonnes.map(c => c.slice());
  disposer(G, colonnes);
  // second passage : chaque bloc déplié range ses lignes d'entrée et de sortie selon la hauteur des blocs reliés
  // (entrées : la plus basse au bord gauche, les autres arrivent par le haut ; sorties : la plus haute au bord droit,
  // les autres repartent par le bas), puis la disposition est refaite avec ces blocs
  const centre = (l, cote) => { const v = l.via ? (cote === 'de' ? l.via[l.via.length - 1] : l.via[0]) : parId.get(l[cote]); return v.py + v.h / 2; };
  let refaire = false;
  G.noeuds.forEach(n => {
    if(!n.sch || !n.sch.yEs) return;
    const hE = {}, hS = {};
    G.liens.forEach(l => {
      if(l.vers === n.id) (hE[l.item] = hE[l.item] || []).push(centre(l, 'de'));
      if(l.de === n.id) (hS[l.item] = hS[l.item] || []).push(centre(l, 'vers'));
    });
    const moy = a => a.reduce((s0, v) => s0 + v, 0) / a.length, rang = {};
    Object.keys(hE).sort((a, b) => moy(hE[b]) - moy(hE[a])).forEach((it, i) => { rang[it] = i; });
    Object.keys(hS).sort((a, b) => moy(hS[a]) - moy(hS[b])).forEach((it, i) => { rang[it] = i; });
    const avant = JSON.stringify([n.sch.yEs, n.sch.ySs]);
    tailler(n, rang);
    if(JSON.stringify([n.sch.yEs, n.sch.ySs]) !== avant) refaire = true;
  });
  if(refaire){ cols0.forEach((c, x) => { colonnes[x] = c.slice(); }); disposer(G, colonnes); }
  // positions choisies à la main
  G.noeuds.forEach(n => { const q = S.pos[n.id]; if(q){ n.px = Math.max(0, q.x); n.py = Math.max(n.objectif != null ? 14 : 0, q.y); } });
  // un lien ne passe par ses points de passage que si ses deux bouts sont à leur place automatique
  G.liens.forEach(l => { if(l.via && (S.pos[l.de] || S.pos[l.vers])) l.via = null; });
  const pts = G.noeuds.concat(...G.liens.map(l => l.via || []));
  const W = Math.max(...pts.map(n => n.px + n.w)) + MARGE, H = Math.max(...pts.map(n => n.py + n.h)) + MARGE;
  // ports : sorties à droite, entrées à gauche, rangées selon la hauteur du voisin
  const sortants = new Map(), entrants = new Map();
  G.liens.forEach(l => { (sortants.get(l.de) || sortants.set(l.de, []).get(l.de)).push(l); (entrants.get(l.vers) || entrants.set(l.vers, []).get(l.vers)).push(l); });
  // voisin vu depuis le bloc : premier (ou dernier) point de passage d'un lien long, sinon l'autre bout
  const proche = (l, autre) => l.via ? (autre === 'vers' ? l.via[0] : l.via[l.via.length - 1]) : parId.get(l[autre]);
  const ports = (m, cle, autre) => m.forEach(ls => {
    ls.sort((a, b) => proche(a, autre).py - proche(b, autre).py);
    ls.forEach((l, i) => { l[cle] = (i + 1) / (ls.length + 1); });
  });
  ports(sortants, 'ps', 'vers'); ports(entrants, 'pe', 'de');
  GEO = {parId, liens: G.liens};
  const maxD = Math.max(...G.liens.map(l => l.debit), 1e-9), UTILISES = new Set();
  const liens = G.liens.map((l, k) => {
    const g = cheminLien(l), liq = LIQ.has(l.item), c = M.convoyeur(l.debit, liq, D);
    l.tapis = c;
    const ep = 1.5 + 6 * Math.sqrt(l.debit / maxD);
    const titre = `${num(l.debit)} ${unite(l.item)} · ${nomItem(l.item)} · ${tapis(c, liq)}`;
    const ct = classeTapis(c, liq); UTILISES.add(ct.split(' ')[0]);
    return `<path class="lien ${ct}${liq ? ' liq' : ''}" data-k="${k}" data-de="${esc(l.de)}" data-vers="${esc(l.vers)}" stroke-width="${ep.toFixed(1)}"
      d="${g.d}"><title>${esc(titre)}</title></path>
      <path class="defile ${ct.split(' ')[0]}${liq ? ' liq' : ''}" data-k="${k}" data-de="${esc(l.de)}" data-vers="${esc(l.vers)}"
      stroke-width="${Math.max(1.6, ep * 0.6).toFixed(1)}" d="${g.d}"/>
      <text class="etiq" data-k="${k}" data-de="${esc(l.de)}" data-vers="${esc(l.vers)}" x="${g.mx}" y="${g.my - 5}" text-anchor="middle">${esc(num(l.debit, 1))} <tspan class="tap ${ct}">${esc(tapisCourt(c))}</tspan></text>`;
  }).join('');
  const noeuds = G.noeuds.map(n => {
    const ic = P.ic[n.item] ? `<image href="commun/icones-44/${P.ic[n.item]}.webp" x="8" y="9" width="30" height="30"/>` : '';
    let l2 = '', l3 = '', l4 = '', cls = n.type, titre = nomItem(n.item);
    if(n.type === 'etape'){
      const e = n.etape, cad = e.cadence > 0.99999 ? '100 %' : num(e.cadence * 100, 0) + ' %';
      l2 = `${num(e.entieres, 0)} × ${cad} · ${nomBat(e.recette.machine)}`;
      titre += ` — ${nomRec(e.recette.nom)} (${nomBat(e.recette.machine)}) : ${num(e.machines, 2)} ${L({fr: 'machines exactes', en: 'exact machines'})}, ${num(e.mw, 1)} MW`;
      const x = EC && EC.get(e);
      if(x){
        cls += x.manque > 1e-6 ? ' manque' : ' couvert';
        l3 = x.manque > 1e-6 ? `<tspan class="n3">${L({fr: `+${num(Math.ceil(x.machines - 1e-6), 0)} à construire`, en: `+${num(Math.ceil(x.machines - 1e-6), 0)} to build`})}</tspan>`
          : `<tspan class="n3 okc">${L({fr: 'usine : suffisant', en: 'factory: enough'})}</tspan>`;
      } else l3 = `<tspan class="n3">${num(n.debit)} ${unite(n.item)}</tspan>`;
      l4 = texteMontage(e, D).resume;
    } else {
      l2 = n.type === 'brut' ? L({fr: 'ressource', en: 'resource'}) : n.type === 'cible' ? L({fr: 'objectif', en: 'target'}) : L({fr: 'surplus', en: 'surplus'});
      l3 = `<tspan class="n3${n.type === 'surplus' ? ' okc' : ''}">${num(n.debit)} ${unite(n.item)}</tspan>`;
    }
    if(n.id === CHOISI) cls += ' choisi';
    // recette alternative : liseré et pastille orange, et son nom sous le bloc (sauf déplié : le montage prend la place)
    const alt = n.type === 'etape' && n.etape.recette.alt;
    if(alt) cls += ' alt';
    const marqueAlt = !alt ? '' : `<rect class="alt-l" x="0" y="0" width="4" height="${n.h}"/>
      <g class="alt-p"><rect x="8" y="44" width="30" height="13" rx="2"/><text x="23" y="54" text-anchor="middle">ALT</text></g>
      ${n.sch ? '' : `<text x="46" y="${GH + 8}" class="n5">${esc(couper(nomRec(n.etape.recette.nom), 26))}</text>`}`;
    const changeable = n.type === 'etape' || (n.type === 'brut' && (S.choix[n.item] === 'brut' || !P.res.includes(n.item)));
    const xr = n.type === 'etape' ? n.w - 48 : n.w - 24;
    // alternatives permises pour l'item, autres que la recette du bloc : pastille sur ⇄ (où une alternative pourrait servir)
    const nAlt = n.type === 'etape' ? optionsRecette(n.item, n.etape.recette, DERNIER.C).filter(c => c.alt && c !== n.etape.recette).length : 0;
    const tRec = L({fr: 'Changer de recette', en: 'Change recipe'})
      + (nAlt ? L({fr: ` (${nAlt} alternative${nAlt > 1 ? 's' : ''} possible${nAlt > 1 ? 's' : ''})`, en: ` (${nAlt} alternate${nAlt > 1 ? 's' : ''} available)`}) : '');
    const recette = changeable ? `<g class="recette${nAlt ? ' a-alt' : ''}" data-recette="${esc(n.id)}" role="button"
      aria-label="${esc(tRec)}"><title>${esc(tRec)}</title>
      <rect x="${xr}" y="4" width="20" height="20" rx="2"/><text x="${xr + 10}" y="19" text-anchor="middle">⇄</text>
      ${nAlt ? `<circle class="n-alt" cx="${xr + 19}" cy="5" r="6"/><text class="n-alt-t" x="${xr + 19}" y="8" text-anchor="middle">${nAlt}</text>` : ''}</g>` : '';
    const plier = n.type === 'etape' ? `<g class="plier" data-plier="${esc(n.id)}" role="button"
      aria-label="${esc(n.sch ? L({fr: 'Replier le montage', en: 'Fold the layout'}) : L({fr: 'Déplier le montage', en: 'Unfold the layout'}))}">
      <rect x="${n.w - 24}" y="4" width="20" height="20" rx="2"/><text x="${n.w - 14}" y="19" text-anchor="middle">${n.sch ? '−' : '+'}</text></g>` : '';
    const tx = n.objectif != null ? `${L({fr: 'OBJECTIF', en: 'TARGET'})} · ${num(n.objectif)} ${unite(n.objectifItem)}` : '';
    const onglet = tx ? `<g class="obj-tab"><rect x="-1" y="-13" width="${Math.round(tx.length * 6.3 + 14)}" height="14" rx="2"/><text x="6" y="-2.5">${esc(tx)}</text></g>` : '';
    return `<g class="noeud ${cls}${n.objectif != null ? ' objectif' : ''}${n.sch ? ' deplie' : ''}" data-id="${esc(n.id)}" tabindex="0" transform="translate(${n.px},${n.py})"><title>${esc(titre)}${tx ? ' — ' + esc(tx.toLowerCase()) : ''}</title>
      <rect x="0" y="0" width="${n.w}" height="${n.h}" rx="2"/>${onglet}${marqueAlt}${ic}${recette}${plier}${n.sch ? n.sch.svg : ''}
      <text x="46" y="19" class="n1">${esc(couper(nomItem(n.item), n.type === 'etape' ? 15 : changeable ? 18 : 21))}</text>
      <text x="46" y="35" class="n2">${esc(couper(l2, 26))}</text>
      <text x="46" y="52">${l3}</text>
      ${l4 ? `<text x="46" y="68" class="n4">${esc(couper(l4, 28))}</text>` : ''}</g>`;
  }).join('');
  box.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * S.zoom}" height="${H * S.zoom}" viewBox="0 0 ${W} ${H}"
    role="img" aria-label="${esc(L({fr: 'Graphe de production', en: 'Production graph'}))}" data-w="${W}" data-h="${H}">${liens}${noeuds}</svg>`;
  document.getElementById('zoomVal').textContent = num(S.zoom * 100, 0) + ' %';
  { const sv = box.querySelector('svg'); NPORTES = 0; G.liens.forEach((_, k) => portesLien(sv, k)); majProche(sv); }
  legende(UTILISES);
  const toutDeplie = !G.noeuds.some(n => n.type === 'etape' && replies.has(n.id)), bd = document.getElementById('deplier');
  bd.title = toutDeplie ? L({fr: 'Tout replier', en: 'Fold all'}) : L({fr: 'Tout déplier', en: 'Expand all'});
  bd.querySelector('.ic').textContent = toutDeplie ? '▣' : '▦';
  rendreDetail();
}
// déplace un bloc : son groupe et les liens qui le touchent, sans tout redessiner
function deplacer(id, x, y){
  const n = GEO.parId.get(id); n.px = Math.max(0, x); n.py = Math.max(n.objectif != null ? 14 : 0, y);
  const svg = document.querySelector('#graphe svg');
  svg.querySelector(`.noeud[data-id="${CSS.escape(id)}"]`).setAttribute('transform', `translate(${n.px},${n.py})`);
  GEO.liens.forEach((l, k) => {
    if(l.de !== id && l.vers !== id) return;
    const g = cheminLien(l);
    svg.querySelectorAll(`.lien[data-k="${k}"], .defile[data-k="${k}"]`).forEach(x => x.setAttribute('d', g.d));
    const t = svg.querySelector(`.etiq[data-k="${k}"]`); t.setAttribute('x', g.mx); t.setAttribute('y', g.my - 5);
    portesLien(svg, k);
  });
}
// panneau sous le graphe : montage du bloc choisi
function rendreDetail(){
  const el = document.getElementById('detail');
  const n = CHOISI && GEO && GEO.parId.get(CHOISI);
  if(!n || n.type !== 'etape'){ el.innerHTML = ''; return; }
  const e = n.etape, m = texteMontage(e, DERNIER.D);
  const opts = optionsRecette(e.item, e.recette, DERNIER.C).map(c => `<option value="${esc(c.classe)}"${c === e.recette ? ' selected' : ''}>${esc(libRecette(c))}</option>`).join('')
    + `<option value="brut">${L({fr: 'Fourni (hors chaîne)', en: 'Supplied (outside the chain)'})}</option>`;
  el.innerHTML = `<div class="boite"><button type="button" class="replier fermer-d" data-fermer-d
    aria-label="${esc(L({fr: 'Fermer', en: 'Close'}))}">×</button><h3>${esc(nomItem(e.item))} — ${num(e.entieres, 0)} × ${esc(nomBat(e.recette.machine))}
    · ${L({fr: 'montage', en: 'layout'})} ${esc(L(MONTAGES[S.montage]).toLowerCase())}</h3>
    <select data-item="${esc(e.item)}" aria-label="${esc(L({fr: 'Recette', en: 'Recipe'}))}">${opts}</select>${m.lignes.join('')}</div>`;
}
// survol ou toucher d'un bloc : toute sa lignée en amont (fournisseurs, leurs fournisseurs… jusqu'aux ressources) et
// toute la chaîne en aval (consommateurs, leurs consommateurs… jusqu'aux objectifs), avec les liens qui les relient ;
// le reste s'efface
function isoler(id){
  const svg = document.querySelector('#graphe svg'); if(!svg) return;
  svg.querySelectorAll('.lie').forEach(x => x.classList.remove('lie'));
  if(!id || !GEO){ svg.classList.remove('actif'); return; }
  svg.classList.add('actif');
  const parcours = (de, vers) => {
    const vu = new Set([id]), file = [id];
    while(file.length){
      const v = file.shift();
      GEO.liens.forEach(l => { if(l[vers] === v && !vu.has(l[de])){ vu.add(l[de]); file.push(l[de]); } });
    }
    return vu;
  };
  const amont = parcours('de', 'vers'), aval = parcours('vers', 'de');
  new Set([...amont, ...aval]).forEach(x => { const g = svg.querySelector(`.noeud[data-id="${CSS.escape(x)}"]`); if(g) g.classList.add('lie'); });
  svg.querySelectorAll('.lien, .etiq, .defile[data-k], .porte-lien').forEach(l => {
    const {de, vers} = l.dataset;
    if((amont.has(de) && amont.has(vers)) || (aval.has(de) && aval.has(vers))) l.classList.add('lie');
  });
}
function choisir(id){
  CHOISI = id;
  document.querySelectorAll('#graphe .noeud.choisi').forEach(g => g.classList.remove('choisi'));
  if(id){ const g = document.querySelector(`#graphe .noeud[data-id="${CSS.escape(id)}"]`); if(g) g.classList.add('choisi'); }
  isoler(id); rendreDetail();
}
const boxG = document.getElementById('graphe');
let GLISSE = null;   // {id, sx, sy, x0, y0, bouge}
boxG.addEventListener('mouseover', e => { if(GLISSE) return; const g = e.target.closest('.noeud'); isoler(g ? g.dataset.id : CHOISI); });
boxG.addEventListener('mouseleave', () => { if(!GLISSE) isoler(CHOISI); });
boxG.addEventListener('focusin', e => { const g = e.target.closest('.noeud'); if(g) isoler(g.dataset.id); });
/* menu des recettes d'un bloc, posé sous le bloc (coordonnées du dessin × zoom − défilement du cadre) */
const menu = document.getElementById('menuRec');
let MENU = null;   // identifiant du bloc dont le menu est ouvert
function ouvrirMenu(id){
  const n = GEO && GEO.parId.get(id); if(!n) return;
  const item = n.item, actuelle = n.type === 'etape' ? n.etape.recette : null, choix = S.choix[item];
  const btn = (val, lib, coche) => `<button type="button" role="menuitemradio" aria-checked="${!!coche}" data-val="${esc(val)}">${esc(lib)}</button>`;
  menu.innerHTML = `<div class="tete">${esc(L({fr: 'Recette', en: 'Recipe'}))} · ${esc(nomItem(item))}</div>`
    + optionsRecette(item, actuelle, DERNIER.C).map(c => btn(c.classe, libRecette(c), c === actuelle)).join('')
    + '<div class="sep-m"></div>'
    + btn('brut', L({fr: 'Fourni (hors chaîne)', en: 'Supplied (outside the chain)'}), choix === 'brut')
    + (choix ? btn('', L({fr: 'Recette par défaut', en: 'Default recipe'}), false) : '');
  const cadre = menu.parentElement.getBoundingClientRect(), r = boxG.getBoundingClientRect();
  menu.hidden = false;
  const x = r.left - cadre.left + n.px * S.zoom - boxG.scrollLeft, y = r.top - cadre.top + (n.py + Math.min(n.h, GH)) * S.zoom - boxG.scrollTop + 2;
  menu.style.left = Math.max(0, Math.min(x, cadre.width - menu.offsetWidth - 4)) + 'px';
  menu.style.top = Math.max(0, y) + 'px';
  MENU = id;
  (menu.querySelector('[aria-checked="true"]') || menu.querySelector('button')).focus({preventScroll: true});
}
function fermerMenu(rendre){
  if(!MENU) return;
  const id = MENU; MENU = null; menu.hidden = true;
  if(rendre){ const g = document.querySelector(`#graphe .noeud[data-id="${CSS.escape(id)}"]`); if(g) g.focus({preventScroll: true}); }
}
menu.addEventListener('click', e => {
  const b = e.target.closest('button[data-val]'); if(!b || !MENU) return;
  const item = GEO.parId.get(MENU).item, v = b.dataset.val;
  if(v) S.choix[item] = v; else delete S.choix[item];
  fermerMenu(false); garder(); calcul();
});
menu.addEventListener('keydown', e => {
  const bs = [...menu.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
  if(e.key === 'Escape'){ e.preventDefault(); fermerMenu(true); }
  else if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); bs[(i + (e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length].focus(); }
});
document.addEventListener('pointerdown', e => {
  if(MENU && !e.target.closest('#menuRec') && !e.target.closest('.recette')) fermerMenu(false);
}, true);
boxG.addEventListener('scroll', () => fermerMenu(false));
document.getElementById('detail').addEventListener('change', e => {
  const t = e.target; if(!t.dataset.item) return;
  S.choix[t.dataset.item] = t.value; garder(); calcul();
});
function basculer(id){
  const r = new Set(S.replies);
  if(r.has(id)) r.delete(id); else r.add(id);
  S.replies = [...r]; garder(); rendreGraphe();
}
boxG.addEventListener('pointerdown', e => {
  const rb = e.target.closest('.recette');
  if(rb){ e.preventDefault(); if(MENU === rb.dataset.recette) fermerMenu(false); else ouvrirMenu(rb.dataset.recette); return; }
  const pl = e.target.closest('.plier');
  if(pl){ e.preventDefault(); basculer(pl.dataset.plier); return; }
  const g = e.target.closest('.noeud');
  if(!g){ if(CHOISI && e.target.closest('svg')) choisir(null); return; }   // dans le vide : plus de bloc choisi
  if(!GEO || e.button > 0) return;
  const n = GEO.parId.get(g.dataset.id);
  GLISSE = {id: g.dataset.id, sx: e.clientX, sy: e.clientY, x0: n.px, y0: n.py, bouge: false, pid: e.pointerId};
  try{ boxG.setPointerCapture(e.pointerId); }catch(err){}   // pointeur déjà relâché ou simulé
  e.preventDefault();
});
boxG.addEventListener('pointermove', e => {
  if(!GLISSE || e.pointerId !== GLISSE.pid) return;
  const dx = (e.clientX - GLISSE.sx) / S.zoom, dy = (e.clientY - GLISSE.sy) / S.zoom;
  if(!GLISSE.bouge && Math.hypot(dx, dy) < 4) return;
  if(!GLISSE.bouge){ GLISSE.bouge = true; boxG.classList.add('glisse'); isoler(GLISSE.id); }
  deplacer(GLISSE.id, GLISSE.x0 + dx, GLISSE.y0 + dy);
});
function lacher(e){
  if(!GLISSE || (e && e.pointerId !== GLISSE.pid)) return;
  const {id, bouge} = GLISSE; GLISSE = null; boxG.classList.remove('glisse');
  if(bouge){
    const n = GEO.parId.get(id); S.pos[id] = {x: Math.round(n.px), y: Math.round(n.py)}; garder();
    rendreGraphe();   // taille du dessin ajustée à la nouvelle place
  } else choisir(CHOISI === id ? null : id);
}
boxG.addEventListener('pointerup', lacher);
boxG.addEventListener('pointercancel', lacher);
// clavier : Entrée choisit le bloc, les flèches le déplacent
boxG.addEventListener('keydown', e => {
  const g = e.target.closest('.noeud'); if(!g || !GEO) return;
  const id = g.dataset.id, n = GEO.parId.get(id), pas = e.shiftKey ? 60 : 20;
  const d = {ArrowLeft: [-pas, 0], ArrowRight: [pas, 0], ArrowUp: [0, -pas], ArrowDown: [0, pas]}[e.key];
  if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); choisir(CHOISI === id ? null : id); return; }
  if((e.key === 'r' || e.key === 'R') && g.querySelector('.recette')){ e.preventDefault(); ouvrirMenu(id); return; }
  if((e.key === '+' || e.key === '-') && id.startsWith('e:')){ e.preventDefault(); basculer(id);
    const g2 = document.querySelector(`#graphe .noeud[data-id="${CSS.escape(id)}"]`); if(g2) g2.focus(); return; }
  if(!d) return;
  e.preventDefault();
  deplacer(id, n.px + d[0], n.py + d[1]);
  S.pos[id] = {x: Math.round(n.px), y: Math.round(n.py)}; garder();
});
// molette (ou pincement du pavé tactile) : zoom autour du pointeur, sans redessiner
const ZMIN = 0.2, ZMAX = 2.5;
let ZT = null;
boxG.addEventListener('wheel', e => {
  const svg = boxG.querySelector('svg[data-w]'); if(!svg) return;
  e.preventDefault();
  const z1 = S.zoom, k = e.deltaMode === 1 ? 0.05 : e.deltaMode === 2 ? 1 : 0.0015;
  const z2 = Math.min(ZMAX, Math.max(ZMIN, z1 * Math.exp(-e.deltaY * k * (e.ctrlKey ? 4 : 1))));
  if(Math.abs(z2 - z1) < 1e-4) return;
  if(MENU) fermerMenu(false);
  const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / z1, sy = (e.clientY - r.top) / z1;
  S.zoom = z2;
  svg.setAttribute('width', +svg.dataset.w * z2); svg.setAttribute('height', +svg.dataset.h * z2);
  const r2 = svg.getBoundingClientRect();   // le point sous le pointeur ne bouge pas
  boxG.scrollLeft += r2.left + sx * z2 - e.clientX; boxG.scrollTop += r2.top + sy * z2 - e.clientY;
  document.getElementById('zoomVal').textContent = num(z2 * 100, 0) + ' %';
  majProche(svg);
  clearTimeout(ZT); ZT = setTimeout(garder, 300);
}, {passive: false});
document.querySelector('.zoom').addEventListener('click', e => {
  const b = e.target.closest('[data-z]'); if(!b) return;
  const svg = document.querySelector('#graphe svg'), dz = +b.dataset.z;
  if(dz) S.zoom = Math.min(ZMAX, Math.max(ZMIN, Math.round(S.zoom * (dz > 0 ? 1.2 : 1 / 1.2) * 100) / 100));
  else if(svg){ const m = marges();
    S.zoom = Math.min(1.2, Math.max(ZMIN, Math.min((boxG.clientWidth - m.l - m.r) / +svg.dataset.w, (boxG.clientHeight - m.t - m.b) / +svg.dataset.h))); }
  garder(); rendreGraphe();
});
document.getElementById('reorg').addEventListener('click', () => { S.pos = {}; garder(); rendreGraphe(); });
document.getElementById('deplier').addEventListener('click', () => {
  // tout déplié → tout replier ; sinon tout déplier
  const etapes = GEO ? [...GEO.parId.values()].filter(n => n.type === 'etape').map(n => n.id) : [];
  S.replies = etapes.some(id => S.replies.includes(id)) ? [] : etapes;
  garder(); rendreGraphe();
});
function rendreVue(){
  // la liste s'ouvre en feuille par-dessus le graphe
  document.getElementById('vueListe').hidden = S.vue !== 'liste';
  document.querySelectorAll('[data-vue]').forEach(b => b.setAttribute('aria-pressed', b.dataset.vue === S.vue));
  rendreGraphe();
}
document.querySelector('.vues').addEventListener('click', e => {
  const b = e.target.closest('[data-vue]'); if(!b) return;
  S.vue = b.dataset.vue; garder(); rendreVue();
});
// une alternative du bilan : son bloc choisi et amené au milieu de la place libre
document.getElementById('alts').addEventListener('click', e => {
  const b = e.target.closest('[data-aller]'); if(!b) return;
  if(S.vue !== 'graphe'){ S.vue = 'graphe'; garder(); rendreVue(); }
  choisir(b.dataset.aller);
  const g = document.querySelector(`#graphe .noeud[data-id="${CSS.escape(b.dataset.aller)}"]`); if(!g) return;
  const r = g.getBoundingClientRect(), c = boxG.getBoundingClientRect(), m = marges();
  boxG.scrollLeft += r.left + r.width / 2 - (c.left + m.l + (c.width - m.l - m.r) / 2);
  boxG.scrollTop += r.top + r.height / 2 - (c.top + m.t + (c.height - m.t - m.b) / 2);
});
document.getElementById('detail').addEventListener('click', e => { if(e.target.closest('[data-fermer-d]')) choisir(null); });
document.getElementById('etapes').addEventListener('change', e => {
  const t = e.target; if(!t.dataset.item) return;
  S.choix[t.dataset.item] = t.value; garder(); calcul();
});

/* ---------- panneaux flottants : repli (mémorisé), à propos, glisser le fond pour se déplacer ---------- */
const REPLIS = (() => { try{ return JSON.parse(localStorage.getItem(CLE + ':replis')) || null; }catch(e){ return null; } })()
  || (innerWidth < 760 ? {pnBilan: true, colonne: true, bandeau: true} : {});   // sur téléphone, le graphe d'abord : colonne en barre, bilan replié
function replier(id, r){
  const pn = document.getElementById(id); pn.classList.toggle('replie', r);
  const b = pn.querySelector('.replier'); b.setAttribute('aria-expanded', !r); b.textContent = r ? '▸' : '▾';
}
Object.keys(REPLIS).forEach(id => id !== 'colonne' && id !== 'bandeau' && document.getElementById(id) && document.getElementById(id).querySelector('.replier[data-replier]') && replier(id, REPLIS[id]));
const bandeauBtn = document.getElementById('bandeauBtn');
function replierBandeau(r){
  document.getElementById('bandeau').classList.toggle('replie', r);
  bandeauBtn.setAttribute('aria-expanded', !r); bandeauBtn.textContent = r ? '▾' : '▴';
}
replierBandeau(!!REPLIS.bandeau);
bandeauBtn.addEventListener('click', () => {
  REPLIS.bandeau = !REPLIS.bandeau; replierBandeau(REPLIS.bandeau); marges();
  try{ localStorage.setItem(CLE + ':replis', JSON.stringify(REPLIS)); }catch(e){}
});
const colBtn = document.getElementById('colBtn');
function rail(r){
  document.getElementById('colonne').classList.toggle('rail', r);
  colBtn.setAttribute('aria-expanded', !r); colBtn.textContent = r ? (innerWidth < 760 ? '▾' : '▸') : (innerWidth < 760 ? '▴' : '◂');
}
rail(!!REPLIS.colonne);
colBtn.addEventListener('click', () => {
  REPLIS.colonne = !REPLIS.colonne; rail(REPLIS.colonne); marges();
  try{ localStorage.setItem(CLE + ':replis', JSON.stringify(REPLIS)); }catch(e){}
});
document.querySelectorAll('[data-replier]').forEach(b => b.addEventListener('click', () => {
  const id = b.dataset.replier; REPLIS[id] = !REPLIS[id]; replier(id, REPLIS[id]); marges();
  try{ localStorage.setItem(CLE + ':replis', JSON.stringify(REPLIS)); }catch(e){}
}));
const aPropos = document.getElementById('aPropos'), aProposBtn = document.getElementById('aProposBtn');
const ouvrirAPropos = o => { aPropos.hidden = !o; aProposBtn.setAttribute('aria-expanded', o); if(o) document.getElementById('aProposX').focus(); };
aProposBtn.addEventListener('click', () => ouvrirAPropos(aPropos.hidden));
document.getElementById('aProposX').addEventListener('click', () => { ouvrirAPropos(false); aProposBtn.focus(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !aPropos.hidden){ ouvrirAPropos(false); aProposBtn.focus(); } });
// sources et mention « généré par IA » : dans le panneau « à propos » (la page entière est le graphe)
const rangerPied = () => { const f = document.querySelector('.wrap footer'); if(f) aPropos.appendChild(f);
  const ia = document.getElementById('fia'); if(ia) aPropos.appendChild(ia); };
rangerPied(); addEventListener('DOMContentLoaded', rangerPied); addEventListener('load', rangerPied);
document.body.classList.add('plein-ecran');
addEventListener('resize', () => marges());
// glisser le fond du graphe : il défile (les blocs, eux, se déplacent)
let PAN = null;
boxG.addEventListener('pointerdown', e => {
  if(e.button > 0 || e.target.closest('.noeud') || e.target.closest('.recette') || e.target.closest('.plier')) return;
  PAN = {x: e.clientX, y: e.clientY, l: boxG.scrollLeft, t: boxG.scrollTop, pid: e.pointerId};
  e.preventDefault();   // pas de sélection de texte pendant le glissé
});
boxG.addEventListener('pointermove', e => {
  if(!PAN || e.pointerId !== PAN.pid) return;
  if(!boxG.classList.contains('pan') && Math.hypot(e.clientX - PAN.x, e.clientY - PAN.y) < 4) return;
  boxG.classList.add('pan');
  boxG.scrollLeft = PAN.l - (e.clientX - PAN.x); boxG.scrollTop = PAN.t - (e.clientY - PAN.y);
});
const finPan = () => { PAN = null; boxG.classList.remove('pan'); };
boxG.addEventListener('pointerup', finPan); boxG.addEventListener('pointercancel', finPan);

/* ---------- onglets des plans ---------- */
const boxPlans = document.getElementById('plans');
let RENOMME = -1;   // onglet en cours de renommage
const nomDe = i => S.plans[i].nom || nomPlan(i + 1);
function rendreOnglets(){
  boxPlans.innerHTML = S.plans.map((pl, i) => {
    const sel = i === S.actif;
    return `<div class="plan" role="presentation" aria-selected="${sel}">${i === RENOMME
      ? `<input type="text" maxlength="40" data-i="${i}" value="${esc(pl.nom || nomPlan(i + 1))}" aria-label="${esc(L({fr: 'Nom du plan', en: 'Plan name'}))}">`
      : `<button type="button" class="p-nom" role="tab" data-i="${i}" aria-selected="${sel}" tabindex="${sel ? 0 : -1}" title="${esc(nomDe(i))}${sel ? esc(L({fr: ' — double-clic pour renommer', en: ' — double-click to rename'})) : ''}">${esc(nomDe(i))}</button>`
      + `<button type="button" class="p-act" data-ren="${i}" title="${esc(L({fr: 'Renommer', en: 'Rename'}))}" aria-label="${esc(L({fr: 'Renommer', en: 'Rename'}))}">✎</button>`
      + (S.plans.length > 1 ? `<button type="button" class="p-act" data-suppr="${i}" title="${esc(L({fr: 'Fermer ce plan', en: 'Close this plan'}))}" aria-label="${esc(L({fr: 'Fermer ce plan', en: 'Close this plan'}))}">×</button>` : '')}</div>`;
  }).join('') + `<button type="button" class="p-ajout" id="planAjout" title="${esc(L({fr: 'Nouveau plan', en: 'New plan'}))}" aria-label="${esc(L({fr: 'Nouveau plan', en: 'New plan'}))}">+</button>`;
  const inp = boxPlans.querySelector('input');
  if(inp){ inp.focus(); inp.select(); }
}
// affiche le plan i (le plan courant est déjà gardé)
function allerPlan(i){
  if(i === S.actif || !S.plans[i]) return;
  garder();
  S.actif = i; Object.assign(S, extrait(S.plans[i]));
  appliquerPlan();
}
function appliquerPlan(){
  montSel.checked = S.montage === 'equilibre';
  CHOISI = null; RENOMME = -1;
  garder(); rendreOnglets(); rendreModes(); rendreCibles(); calcul();
}
function renommer(i, nom){
  RENOMME = -1;
  if(nom !== null){ nom = nom.trim().slice(0, 40); S.plans[i].nom = nom === nomPlan(i + 1) ? '' : nom; garder(); }
  rendreOnglets();
  const b = boxPlans.querySelector(`.p-nom[data-i="${i}"]`); if(b) b.focus();
}
boxPlans.addEventListener('click', e => {
  const t = e.target.closest('button'); if(!t) return;
  if(t.id === 'planAjout'){
    garder();
    S.plans.push(Object.assign({nom: ''}, extrait(DEFAUT)));
    S.actif = S.plans.length - 1; Object.assign(S, extrait(S.plans[S.actif]));
    appliquerPlan(); boxPlans.querySelector('.p-nom[aria-selected="true"]').focus();
  } else if(t.dataset.ren){ RENOMME = +t.dataset.ren; rendreOnglets(); }
  else if(t.dataset.suppr){
    const i = +t.dataset.suppr;
    if(S.plans.length < 2 || !confirm(L({fr: `Fermer « ${nomDe(i)} » ? Le plan sera perdu.`, en: `Close "${nomDe(i)}"? The plan will be lost.`}))) return;
    S.plans.splice(i, 1);
    S.actif = Math.min(i, S.plans.length - 1); Object.assign(S, extrait(S.plans[S.actif]));
    appliquerPlan();
  } else if(t.dataset.i) allerPlan(+t.dataset.i);
});
boxPlans.addEventListener('dblclick', e => { const t = e.target.closest('.p-nom'); if(t){ RENOMME = +t.dataset.i; rendreOnglets(); } });
boxPlans.addEventListener('keydown', e => {
  const inp = e.target.closest('input');
  if(inp){
    if(e.key === 'Enter'){ e.preventDefault(); renommer(+inp.dataset.i, inp.value); }
    else if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); renommer(+inp.dataset.i, null); }
    return;
  }
  const t = e.target.closest('.p-nom'); if(!t) return;
  const n = S.plans.length, i = +t.dataset.i;
  const j = {ArrowRight: (i + 1) % n, ArrowLeft: (i + n - 1) % n, Home: 0, End: n - 1}[e.key];
  if(j !== undefined){ e.preventDefault(); allerPlan(j); const b = boxPlans.querySelector(`.p-nom[data-i="${j}"]`); if(b) b.focus(); }
  else if(e.key === 'F2'){ e.preventDefault(); RENOMME = i; rendreOnglets(); }
});
boxPlans.addEventListener('focusout', e => {
  const inp = e.target.closest('input');
  if(inp && RENOMME === +inp.dataset.i) setTimeout(() => { if(RENOMME === +inp.dataset.i) renommer(+inp.dataset.i, inp.value); }, 0);
});

function tout(){ rendreOnglets(); rendreModes(); rendreCibles(); calcul(); }
FicsitLang.on(tout);
FicsitPartie.surChangement(chargerUsine);
rendreOnglets();
rendreModes();
rendreCibles();
rendreVue();
chargerUsine();
majAdresse();

// arrière-plan (outil non affiché dans la coquille, classe en-fond) : les icônes qui avancent (SMIL) se mettent en pause aussi
new MutationObserver(() => {
  const fond = document.documentElement.classList.contains('en-fond');
  document.querySelectorAll('#graphe svg').forEach(v => fond ? v.pauseAnimations() : v.unpauseAnimations());
}).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
