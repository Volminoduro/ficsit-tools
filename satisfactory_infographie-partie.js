/* satisfactory_infographie-partie.js — « Ma partie » du registre des rendements (satisfactory_infographie.html) :
   onglet latéral et panneau (import de la sauvegarde, filtre, simulation des disques durs, alternatives notées),
   bandeau du filtre. Sorti de la page pour l'alléger ; chargé juste avant son script principal, dont il utilise les
   données et fonctions (D, IDX, GAIN, pareto, synIdx, FILTRE, cap…) au moment des appels, jamais au chargement.
   Même portée globale que la page (script classique) : la page appelle setPartie, renderPartie, ouvrirPanneau…
   Lien suffixé d'une empreinte (?v=…) par scripts/langue.py, pour contourner le cache après une mise à jour. */
/* ---------- ma partie : onglet latéral et panneau (commun/ficsit-partie.js) ----------
   Import de la sauvegarde (Web Worker, mémorisé pour tous les outils sous 'ficsit-tools:partie'), filtre, puis
   alternatives du registre notées sur le critère affiché : disques durs en attente de choix, débloquées, manquantes.
   Case cochée : FILTRE = classes des recettes débloquées dans la sauvegarde ; tout (spectre, onglets, combinaisons)
   ne retient plus que celles-là. Les indices des recettes isolées, eux, restent calculés sans filtre. */
let PARTIE = window.FicsitPartie ? FicsitPartie.charger() : null, panneauOuvert = false, etatImport = null, partieLu = null;
/* Simulation des choix de disques durs : pour chaque disque en attente, l'alternative cochée (par défaut la
   meilleure en Synthèse) compte comme débloquée ; FILTRE = recettes de la partie + celles-là. Partagée par les outils
   (FicsitPartie.simulation / simuler, clé 'ficsit-tools:simulation') : on y écrit le choix effectif de chaque disque. */
let SIMU = window.FicsitPartie ? FicsitPartie.simulation() : {on: false, choix: {}};
function simuEcrire(){
  if(PARTIE) FicsitPartie.bilan(PARTIE).attente.forEach(a => { SIMU.choix[a.id] = choixDe(a); });
  FicsitPartie.simuler(SIMU);
}
// alternatives débloquées seulement par la simulation (marquées dans les combinaisons)
const simSeules = () => { const ok = new Set(PARTIE ? PARTIE.recettes : []); return new Set(FILTRE && SIMU.on ? simulees().filter(c => !ok.has(c)) : []); };
const simTag = a => { const r = RD.get(a); return r && SIMK.has(r.k) ? ` <span class="simtag" title="${escH(PT('partieSimuleeTitre'))}">${escH(PT('partieSimulee'))}</span>` : ''; };
let SIMK = new Set(), RD = new Map();
function choixDe(a){   // schéma retenu pour un disque en attente (bilan)
  if(a.choix.some(c => c.schema === SIMU.choix[a.id])) return SIMU.choix[a.id];
  let best = a.choix[0], g0 = -Infinity;
  const parK = new Map(D.map(r=>[r.k, r]));
  a.choix.forEach(c => c.recettes.forEach(f => { const r = parK.get(f.classe), g = r && r.a ? synIdx(r).g : null;
    if(g != null && g > g0){ g0 = g; best = c; } }));
  return best.schema;
}
function simulees(){   // classes des recettes ajoutées par la simulation
  if(!SIMU.on || !PARTIE) return [];
  return FicsitPartie.bilan(PARTIE).attente.flatMap(a => { const s = choixDe(a);
    return a.choix.filter(c => c.schema === s).flatMap(c => c.recettes.map(f => f.classe)); });
}
const permises = () => new Set([...PARTIE.recettes, ...simulees()]);
const escH = x => String(x).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PT = k => FicsitLang.t(k), PTX = (k, v) => FicsitPartie.texte(k, v);
const PERR = {ancienne: 'partieErrAncienne', format: 'partieErrFormat', recettes: 'partieErrRecettes', memoire: 'partieErrMemoire', stockage: 'partieErrStockage'};
/* Caches calculés sous un filtre « ma partie » (clés en « <palier>p<n> », voir availKey) : jetés à chaque changement
   de filtre ou de simulation, sinon ils s'accumuleraient à chaque bascule. */
function purgerFiltres(){
  const filtree = /(^|\|)\d+p\d+(\||$)/;
  [availCache, combiCache, lbCache, planCache].forEach(c => Object.keys(c).forEach(k => { if(filtree.test(k)) delete c[k]; }));
}
function setPartie(on){
  purgerFiltres();
  FILTRE = on && PARTIE ? permises() : null; FILTRE_N++;
  if(!FILTRE && SIMU.on){ SIMU.on = false; FicsitPartie.simuler(SIMU); }   // sans filtre, tout est déjà permis : la simulation n'a pas d'objet
  RD = new Map(D.map(r => [r.n, r])); SIMK = simSeules();
  buildUsedIn(); renderTierPick(); renderPartie(); renderAll();
}
function nouvellePartie(){   // import, vidage ou changement venu d'un autre onglet
  PARTIE = FicsitPartie.charger(); SIMU = FicsitPartie.simulation();
  if(PARTIE && partieLu !== PARTIE.lu){ partieLu = PARTIE.lu; cap = Math.min(TMAX, FicsitPartie.palier(PARTIE) || TMAX); savePrefs(); }
  if(FILTRE) setPartie(!!PARTIE); else { renderTierPick(); renderPartie(); renderAll(); }
}
function ouvrirPanneau(on, focus = true){
  panneauOuvert = on;
  const pn = document.getElementById('partiePanneau'), tab = document.getElementById('partieTab');
  pn.hidden = !on; tab.hidden = on; tab.setAttribute('aria-expanded', on);
  if(on){ renderPartie(); renderPartieListes(); if(focus) document.getElementById('partieFermer').focus({preventScroll: true}); }
  else if(focus) tab.focus({preventScroll: true});
  savePrefs();
}
function renderPartieTab(){
  const tab = document.getElementById('partieTab'), n = PARTIE && PARTIE.attente ? PARTIE.attente.length : 0;
  tab.innerHTML = escH(PT('partieOnglet')) + (n ? `<b>${n}</b>` : '');
  tab.title = PT('partieOngletTitre');
}
function renderBandeau(){
  const el = document.getElementById('partieBandeau');
  el.hidden = !(FILTRE && PARTIE);
  if(el.hidden) return;
  const ok = new Set(PARTIE.recettes), n = D.filter(r => r.a && ok.has(r.k)).length, ns = SIMK.size;
  el.innerHTML = `<span>${escH(PTX('partieBandeau', {nom: PARTIE.nom, n, simu: ns ? PTX('partieSimuActive', {n: ns}) : ''}))}</span>
    <button type="button" id="bandeauOuvrir">${escH(PT('partieBandeauOuvrir'))}</button>`;
  document.getElementById('bandeauOuvrir').addEventListener('click', () => ouvrirPanneau(true));
}
function renderPartie(){
  renderPartieTab(); renderBandeau();
  const pn = document.getElementById('partiePanneau');
  if(pn.hidden) return;
  if(!pn.firstChild){   // squelette, une fois : l'état et les listes se redessinent seuls
    pn.innerHTML = `<div class="phd"><h2 id="pnTitre"></h2><button type="button" id="partieFermer">×</button></div>
      <label class="depot" id="depot"><input type="file" id="savIn" accept=".sav"><b id="pnDepot"></b><span id="pnDepotAide"></span></label>
      <div class="chemin"><code id="chemin">%LOCALAPPDATA%\\FactoryGame\\Saved\\SaveGames</code><button type="button" id="copier"></button><span id="pnCopierAide"></span></div>
      <div class="etat" id="partieEtat" aria-live="polite"></div><div id="partieListes"></div>`;
    pn.setAttribute('aria-labelledby', 'pnTitre'); pn.setAttribute('aria-modal', 'false');
    const inp = document.getElementById('savIn'), depot = document.getElementById('depot');
    document.getElementById('partieFermer').addEventListener('click', () => ouvrirPanneau(false));
    inp.addEventListener('change', () => { importer(inp.files[0]); inp.value = ''; });
    ['dragenter', 'dragover'].forEach(t => depot.addEventListener(t, e => { e.preventDefault(); depot.classList.add('survol'); }));
    ['dragleave', 'drop'].forEach(t => depot.addEventListener(t, () => depot.classList.remove('survol')));
    depot.addEventListener('drop', e => { e.preventDefault(); importer(e.dataTransfer.files[0]); });
    document.getElementById('copier').addEventListener('click', async e => {
      const btn = e.currentTarget, c = document.getElementById('chemin');
      try{ await navigator.clipboard.writeText(c.textContent); }
      catch(_){ const r = document.createRange(); r.selectNodeContents(c); getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand('copy'); }
      btn.classList.add('ok'); setTimeout(() => btn.classList.remove('ok'), 2000);
    });
  }
  document.getElementById('pnTitre').textContent = PT('partieOnglet');
  document.getElementById('partieFermer').title = document.getElementById('partieFermer').ariaLabel = PT('partieFermer');
  document.getElementById('pnDepot').textContent = PT('partieDepot');
  document.getElementById('pnDepotAide').textContent = PT('partieDepotAide');
  document.getElementById('copier').textContent = PT('partieCopier');
  document.getElementById('pnCopierAide').textContent = PT('partieCopierAide');
  const el = document.getElementById('partieEtat'), e = etatImport;
  el.classList.toggle('erreur', !!(e && e.erreur));
  if(e && e.etape){
    const pc = Math.round((e.f || 0) * 100), lec = e.etape === 'lecture';
    el.innerHTML = `<div>${lec ? PT('partieLecture') : PTX('partieAnalyse', {p: FicsitLang.num(pc)})}</div>
      <div class="jauge${lec ? ' lecture' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pc}"><i style="width:${lec ? 100 : pc}%"></i></div>
      <div>${PT('partieAnalyseAide')}</div>`;
    return;
  }
  const err = e && e.erreur ? `<div>${escH(PERR[e.erreur] ? PT(PERR[e.erreur]) : PT('partieErrFormat') + ' (' + e.erreur + ')')}</div>` : '';
  if(!PARTIE){ el.innerHTML = err || escH(PT('partieAucune')); return; }
  const ok = new Set(PARTIE.recettes), alt = D.filter(r=>r.a), nAlt = alt.filter(r=>ok.has(r.k)).length;
  const date = new Date(PARTIE.date).toLocaleString(FicsitLang.locale, {dateStyle: 'long', timeStyle: 'short'});
  el.innerHTML = err + `<div class="nom">${escH(PARTIE.nom || PT('partieSansNom'))}</div>
    <div>${escH(PTX('partieSauvee', {date, h: FicsitLang.num(Math.floor(PARTIE.duree / 3600))}))}${PARTIE.fichier ? ' · ' + escH(PARTIE.fichier) : ''}</div>
    <div class="chiffres"><span><b>${FicsitPartie.palier(PARTIE)}</b>${PT('partiePalier')}</span>
      <span><b>${nAlt}</b>${PT('partieDebloquees').toLowerCase()}</span>
      <span><b>${(PARTIE.attente || []).length}</b>${PT('partieAttente').toLowerCase()}</span></div>
    <label class="chk"><input type="checkbox" id="filtrePartie"${FILTRE ? ' checked' : ''}> <span>${escH(PTX('partieFiltre', {n: nAlt, t: alt.length}))}</span></label>
    ${(PARTIE.attente || []).length ? `<label class="chk"><input type="checkbox" id="simuPartie"${SIMU.on ? ' checked' : ''}> <span>${escH(PT('partieSimuler'))}${SIMU.on
      ? ` <b class="simu">${escH(PTX('partieSimulees', {n: simulees().filter(c => !PARTIE.recettes.includes(c)).length}))}</b>` : ''}</span></label>` : ''}
    <button type="button" id="vider" title="${escH(PT('partieViderTitre'))}">${PT('partieVider')}</button>`;
  document.getElementById('filtrePartie').addEventListener('change', ev => recalculer(() => setPartie(ev.target.checked)));
  const simu = document.getElementById('simuPartie');
  if(simu) simu.addEventListener('change', ev => recalculer(() => { SIMU.on = ev.target.checked; simuEcrire(); setPartie(true); }));
  document.getElementById('vider').addEventListener('click', () => { etatImport = null; FicsitPartie.oublier(); });
}
function recalculer(f){   // le calcul des combinaisons peut prendre quelques secondes : curseur d'attente, puis annonce
  document.body.classList.add('calcul');
  setTimeout(() => { f(); savePrefs(); document.body.classList.remove('calcul'); annoncer(); }, 30);
}
// lecteurs d'écran : résultat d'un recalcul (filtre, simulation, choix d'un disque)
function annoncer(){
  const el = document.getElementById('annonce');
  el.textContent = PTX('partieRecalcule', {n: D.filter(r => r.a && isAvail(r)).length, c: CBS().length});
}
async function importer(f){
  if(!f) return;
  etatImport = {etape: 'lecture', f: 0}; renderPartie();
  let dernier = 0;
  try{
    const p = await FicsitPartie.lire(f, (etape, fr) => {
      const t = performance.now();
      if(etape !== etatImport.etape || fr >= 1 || t - dernier > 100){ dernier = t; etatImport = {etape, f: fr}; renderPartie(); }
    });
    p.fichier = f.name;
    etatImport = null;
    if(!FicsitPartie.enregistrer(p)) etatImport = {erreur: 'stockage'};   // enregistrer prévient les abonnés : nouvellePartie
  }catch(e){ etatImport = {erreur: e.message || 'format'}; renderPartie(); }
}
/* Alternatives du registre notées sur le critère affiché (IDX, GAIN : énergie, matière, espace ou synthèse), verdict
   gagnante / compromis / perdante sur les trois critères (pareto). Disques durs en attente (mUnclaimedHardDriveData) :
   meilleur choix = plus fort gain sur le critère affiché. */
function renderPartieListes(){
  const el = document.getElementById('partieListes');
  if(!el || document.getElementById('partiePanneau').hidden) return;
  if(!PARTIE){ el.innerHTML = ''; return; }
  const B = FicsitPartie.bilan(PARTIE), parK = new Map(D.map(r=>[r.k, r]));
  const crit = PT('partieCriteres')[['mw', 'mat', 'esp', 'syn'].indexOf(mode)];
  const tete = `<table><colgroup><col><col class="s"><col class="g"><col class="v"></colgroup><thead><tr><th></th>
    <th class="n">${PT('partieScore')} ${SYM()}</th><th class="n">${PT('partieVsBase')}</th><th>${PT('partieVerdict')}</th></tr></thead><tbody>`;
  const ligne = (r, best, radio = '') => { const g = GAIN(r), k = pareto(r);
    return `<tr><td>${radio}${ico(r.p)}<b>${RC_(r.n)}</b>${best && g === best ? ` <span class="top">★ ${PT('partieMeilleur')}</span>` : ''}<small>${IT_(r.p)} · ${PT('palier')} ${r.t}</small></td>
      <td class="n">${nf(IDX(r))}</td><td class="n ${g == null ? '' : g > 0.5 ? 'up' : g < -0.5 ? 'down' : 'flat'}">${g == null ? '—' : (g > 0 ? '+' : '') + pct(g) + ' %'}</td>
      <td>${k ? `<span class="par ${k}">${tr(...PAR_LB[k])}</span>` : '—'}</td></tr>`; };
  const parGain = rs => rs.sort((a, b) => (GAIN(b) ?? -1e9) - (GAIN(a) ?? -1e9) || IDX(b) - IDX(a));
  const disques = B.attente.map(a => {
    const pris = choixDe(a);
    // une ligne par choix proposé : sa recette du registre (la première alternative qu'il débloque), sinon une mention
    const lignes = a.choix.map(c => ({c, r: c.recettes.map(f=>parK.get(f.classe)).find(r => r && r.a)}));
    const gs = lignes.filter(x => x.r).map(x => GAIN(x.r)).filter(g => g != null), best = gs.length > 1 ? Math.max(...gs) : null;
    const radio = c => `<input type="radio" class="simr" name="dd-${a.id}" value="${escH(c.schema)}" data-dd="${a.id}"${c.schema === pris ? ' checked' : ''}
      title="${escH(PT('partieChoisir'))}" aria-label="${escH(PT('partieChoisir'))}">`;
    return `<div class="dd${SIMU.on ? ' simu' : ''}"><h4>${escH(PTX('partieDisque', {n: a.id}))}${a.relances ? ' · ' + escH(PTX('partieRelances', {n: a.relances})) : ''}</h4>
      ${tete}${lignes.map(({c, r}) => r ? ligne(r, best, radio(c)) : `<tr><td class="hors" colspan="4">${radio(c)}${c.recettes.length
        ? escH(FicsitLang.recette(c.recettes[0].nom)) + ' — ' + PT('partieHorsRegistre') : escH(c.nom) + ' — ' + PT('partieSansRecette')}</td></tr>`).join('')}</tbody></table></div>`;
  }).join('');
  const deb = parGain(D.filter(r => r.a && new Set(PARTIE.recettes).has(r.k)));
  const ok = new Set(PARTIE.recettes), man = parGain(D.filter(r => r.a && !ok.has(r.k)));
  el.innerHTML = `<p class="crit">${escH(PTX('partieValeurs', {c: '§'})).replace('§', `<b>${escH(crit)} (${SYM()})</b>`)}</p>
    <details id="partieAttente"${B.attente.length ? ' open' : ''}><summary>${PT('partieAttente')}<b>${B.attente.length}</b></summary>
      ${B.attente.length ? `<p>${PT('partieAttenteRegistre')} ${PT('partieChoixAide')}</p>${disques}` : `<p>${PT('partieAucuneAttente')}</p>`}</details>
    <details><summary>${PT('partieDebloquees')}<b>${deb.length}</b><small>${PT('partieTri')}</small></summary>${tete}${deb.map(r => ligne(r)).join('')}</tbody></table></details>
    <details><summary>${PT('partieManquantes')}<b>${man.length}</b><small>${PT('partieTri')}</small></summary>${tete}${man.map(r => ligne(r)).join('')}</tbody></table></details>`;
}
document.getElementById('partieTab').addEventListener('click', () => ouvrirPanneau(true));
// choix simulé d'un disque : retenu, et appliqué tout de suite si la simulation est active
document.getElementById('partiePanneau').addEventListener('change', e => {
  if(!e.target.classList.contains('simr')) return;
  SIMU.choix[e.target.dataset.dd] = e.target.value; simuEcrire();
  if(SIMU.on) recalculer(() => setPartie(true));
});
document.addEventListener('keydown', e => {
  if(!panneauOuvert) return;
  if(e.key === 'Escape'){ ouvrirPanneau(false); return; }
  if(e.key !== 'Tab') return;
  // le focus clavier reste dans le panneau tant qu'il est ouvert (Maj+Tab depuis le premier élément → le dernier)
  const pn = document.getElementById('partiePanneau');
  const f = [...pn.querySelectorAll('button, input, summary, a[href], [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent !== null);
  if(!f.length) return;
  const i = f.indexOf(document.activeElement);
  if(e.shiftKey && (i <= 0)){ e.preventDefault(); f[f.length - 1].focus(); }
  else if(!e.shiftKey && (i === f.length - 1 || i < 0)){ e.preventDefault(); f[0].focus(); }
});
if(window.FicsitPartie) FicsitPartie.surChangement(nouvellePartie);
