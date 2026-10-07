#!/usr/bin/env node
/* Test fumée des pages dans un vrai navigateur (Playwright + Chromium).
   Pour chaque page et chaque langue : aucune erreur JS, et aucun texte visible de l'autre langue
   (journal des révisions déroulé compris). Puis, une fois par page, des vérifications fonctionnelles
   (CHECKS) : des résultats attendus, pas seulement l'absence d'erreur. Enfin, chaque page à 320 et 390 px de large :
   pas de débordement horizontal.
   La langue est posée au chargement (mémorisée) puis rebasculée par le sélecteur à drapeaux.
   Usage : node scripts/test_pages.js   (depuis la racine du dépôt ; Playwright requis :
   npm install --no-save playwright && npx playwright install chromium). Code de sortie 1 en cas d'échec. */
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }

const ROOT = path.resolve(__dirname, '..');
const PAGES = {
  'index.html': null,
  'ficsit_horloge.html': null,
  'memo-ficsit.html': null,
  'satisfactory_infographie.html': p => p.evaluate(() => { document.getElementById('expAllC').click(); }),
  // Espace : séquence d'une chaîne avec ses bâtiments (extraction, étapes, récapitulatif)
  'satisfactory_infographie.html#esp': p => p.evaluate(() => {
    document.getElementById('mESP').click(); document.getElementById('expAllC').click();
    document.querySelector('#combi [data-seq]').click(); }),
  // Synthèse : curseurs, classement face à la base et combinaisons recalculées dans la page
  'satisfactory_infographie.html#syn': p => p.evaluate(() => {
    document.getElementById('mSYN').click(); document.getElementById('expAll').click(); document.getElementById('expAllC').click(); }),
  'broyeur-excedents.html': null,
  'arbre-production.html': null,
  // usine synthétique passée par l'extraction de commun/ficsit-usine-worker.js, puis rendue
  'depot-dimensionnel.html': p => p.evaluate(usineTest),
  'energie-noeuds.html': null,
  'planner.html': null,
  // vitrine de la charte commune (commun/ficsit-hud.css)
  'charte.html': null,
};
/* Dimensional Depot : sauvegarde synthétique (objets tels que le parseur les rend) — foreuse Mk1 sur un nœud de fer
   normal (60 /min) → fonderie (30 lingots /min) → constructeur (plaques, cadence 150 %, 2 éclats : il lui faudrait
   45 lingots, il tourne aux deux tiers, 20 plaques /min) → conteneur industriel (24 cases, 100 plaques : il a de la
   place) → séparateur → Uploader ; un second Uploader débranché ; Depot : 1 234 plaques, extension 01 (limite 400 :
   plein) et vitesse d'envoi 01 (30 /min). Débit réel 0 (Depot plein) : le conteneur garde les 20 plaques /min et le
   constructeur continue ; potentiel 20 /min limité par l'amont. Charge le module d'extraction, l'applique, calcule
   les débits, affiche. */
async function usineTest() {
  if (!window.FicsitUsine) await new Promise((ok, ko) => { const s = document.createElement('script');
    s.src = 'commun/ficsit-usine-worker.js'; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  const ref = (n) => ({pathName: n}), o = (t, nom, props, type) => ({type: type || 'SaveEntity',
    typePath: '/Game/X/' + t + '.' + t, instanceName: nom, properties: props || {}});
  const pr = v => ({value: v}), lien = (a, b) => o('FGFactoryConnectionComponent', a, {mConnectedComponent: pr(ref(b))}, 'SaveComponent');
  const stack = (it, n) => ({properties: {Item: pr({itemReference: ref('/Game/X/' + it + '.' + it)}), NumItems: pr(n)}});
  const objs = [
    o('Build_MinerMk1_C', 'L.Mine', {mExtractableResource: pr(ref('L.BP_ResourceNode106'))}),
    o('Build_SmelterMk1_C', 'L.Fond', {mCurrentRecipe: pr(ref('/Game/X/Recipe_IngotIron.Recipe_IngotIron_C'))}),
    o('Build_ConveyorBeltMk1_C', 'L.B0'), o('Build_ConveyorBeltMk1_C', 'L.B1'), o('Build_ConveyorBeltMk1_C', 'L.B2'), o('Build_ConveyorBeltMk1_C', 'L.B3'),
    o('Build_ConstructorMk1_C', 'L.Cons', {mCurrentRecipe: pr(ref('/Game/X/Recipe_IronPlate.Recipe_IronPlate_C')),
      mCurrentPotential: pr(1.5), mInventoryPotential: pr(ref('L.Cons.Pot')),
      mLastProductivityMeasurementProduceDuration: pr(45), mLastProductivityMeasurementDuration: pr(60)}),
    o('FGInventoryComponent', 'L.Cons.Pot', {mInventoryStacks: {values: [stack('Desc_CrystalShard_C', 2)]}}, 'SaveComponent'),
    o('Build_ConveyorAttachmentSplitter_C', 'L.Sep'),
    o('Build_StorageContainerMk2_C', 'L.Cont', {mStorageInventory: pr(ref('L.Cont.Inv'))}), o('Build_ConveyorBeltMk1_C', 'L.B4'),
    o('FGInventoryComponent', 'L.Cont.Inv', {mInventoryStacks: {values: [stack('Desc_IronPlate_C', 100)].concat(Array(23).fill(stack('Desc_IronPlate_C', 0)))}}, 'SaveComponent'),
    o('Build_CentralStorage_C', 'L.Up1', {mStorageInventory: pr(ref('L.Up1.Inv'))}),
    o('FGInventoryComponent', 'L.Up1.Inv', {mInventoryStacks: {values: [stack('Desc_IronPlate_C', 80)]}}, 'SaveComponent'),
    o('Build_CentralStorage_C', 'L.Up2'),
    lien('L.Mine.Output0', 'L.B0.ConveyorAny0'), lien('L.B0.ConveyorAny1', 'L.Fond.Input0'), lien('L.Fond.Output0', 'L.B1.ConveyorAny0'), lien('L.B1.ConveyorAny1', 'L.Cons.Input0'),
    lien('L.Cons.Output0', 'L.B2.ConveyorAny0'), lien('L.B2.ConveyorAny1', 'L.Cont.Input0'),
    lien('L.Cont.Output0', 'L.B4.ConveyorAny0'), lien('L.B4.ConveyorAny1', 'L.Sep.Input1'),
    lien('L.Sep.Output1', 'L.B3.ConveyorAny0'), lien('L.B3.ConveyorAny1', 'L.Up1.Input0'),
    lien('L.B3.ConveyorAny0', 'L.Sep.Output1'),   // chaque liaison apparaît des deux côtés dans une vraie sauvegarde
    o('FGCentralStorageSubsystem', 'P.CS', {mStoredItems: {values: [{properties: {ItemClass: pr(ref('/Game/X/Desc_IronPlate_C.Desc_IronPlate_C')), amount: pr(1234)}}]}}),
    o('FGSchematicManager', 'P.SM', {mPurchasedSchematics: {values: [ref('/Game/X/Research_Alien_CentralStackExpansion_01_C.Research_Alien_CentralStackExpansion_01_C'),
      ref('/Game/X/Research_Alien_CentralUploadBoost_01_C.Research_Alien_CentralUploadBoost_01_C')]}}),
  ];
  USINE = FicsitUsine.extraire({header: {sessionName: 'Test', saveDateTime: '1769828760000', playDurationSeconds: 7200, saveVersion: 58},
    levels: {L: {objects: objs}}});
  await calculerFlux();
}
/* Réglages pré-remplis pour que les pages rendent du contenu généré en JS. */
const PREFS = {
  'ficsit-tools:broyeur:v1': { sortMode: 'r', surplus: [['Iron Plate', 60], ['Screws', 240], ['Wire', 120]], tierCap: 9 },
};
/* Vérifications fonctionnelles, évaluées dans la page (accès à ses variables globales). Chacune renvoie
   la liste des anomalies, vide si tout va bien. */
const CHECKS = {
  // bouton « Ma partie » commun (commun/ficsit-partie-ui.js) : dock, résumé de l'accueil, panneau, cache IndexedDB
  'index.html': async () => {
    const out = [], btn = document.getElementById('fpartie'), pn = document.getElementById('fpartiePn');
    const res = document.querySelector('[data-partie-resume]');
    if (!btn || !pn || !btn.closest('#fdock')) return ['bouton « Ma partie » absent du dock'];
    if (!res.querySelector('[data-partie-ouvrir]')) out.push('accueil : pas de bouton d\'import sans partie');
    FicsitPartie.enregistrer({nom: 'Test commun', date: '2026-01-31T03:06:00.000Z', duree: 7200, version: 58, lu: 'test-commun',
      recettes: ['Recipe_Alternate_PureIronIngot_C'], schemas: ['Schematic_3-1_C'], attente: []});
    if (!/Test commun/.test(res.innerText) || !btn.classList.contains('charge')) out.push('résumé de la partie absent après import : ' + res.innerText);
    res.querySelector('[data-partie-ouvrir]').click();
    if (pn.hidden || !/Test commun/.test(pn.innerText) || btn.getAttribute('aria-expanded') !== 'true') out.push('panneau commun non ouvert ou sans la partie');
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    if (!pn.hidden) out.push('Échap ne ferme pas le panneau');
    // cache lié à l'import (IndexedDB) : relu tant que la partie est la même, perdu à l'oubli
    await FicsitPartie.garder('essai', {a: 1});
    const c = await FicsitPartie.cache('essai');
    if (!c || c.a !== 1) out.push('cache IndexedDB non relu : ' + JSON.stringify(c));
    FicsitPartie.oublier();
    await new Promise(r => setTimeout(r, 50));
    if (await FicsitPartie.cache('essai') || /Test commun/.test(res.innerText)) out.push('oublier la partie ne vide pas le cache ou le résumé');
    return out;
  },
  'broyeur-excedents.html': () => {
    const n = document.querySelectorAll('#out .card').length, out = n ? [] : ['aucune cible pour plaques, vis et fil'];
    // « Ma partie » : avec les seules recettes de départ (palier 0), les cibles se réduisent à ce qu'elles fabriquent
    const G = FicsitRecettes, depart = G.r.filter(r => r[3] === 0).map(r => r[0]);
    FicsitPartie.enregistrer({nom: 'Test', date: '2026-01-31T03:06:00.000Z', duree: 3600, version: 58, lu: 'test-broyeur',
      recettes: depart, schemas: ['Schematic_1-1_C'], attente: []});
    const m = document.querySelectorAll('#out .card').length, fab = FicsitPartie.fabricables(new Set(depart), [...sel].map(([i]) => SRC[i].n));
    if (document.getElementById('partieBox').hidden) out.push('case « Ma partie » absente après import');
    if (tierCap !== 1) out.push(`palier non réglé sur la partie (${tierCap})`);
    const hors = [...document.querySelectorAll('#out .card')].length && TGT.filter(t => !fab.has(t.n)).length === 0 ? ['aucune cible exclue'] : [];
    if (m >= n || hors.length) out.push(`cibles non filtrées par la partie (${n} → ${m})`);
    document.getElementById('filtrePartie').click(); tierCap = null; compute();
    if (document.querySelectorAll('#out .card').length !== n) out.push('décocher « Ma partie » ne rend pas toutes les cibles');
    FicsitPartie.oublier(); tierCap = null; compute();
    return out;
  },
  'arbre-production.html': () => {
    const n = document.querySelectorAll('#rows tr').length, m = P.items.length;
    const out = n === m ? [] : [`${n} lignes dans le tableau pour ${m} items`];
    // « Ma partie » : le calcul de la page (mesuresJS) redonne les chaînes de base et optimisée de scripts/arbre.py
    for (const c of ['b', 'o']) {
      const ch = Object.fromEntries(Object.entries(P.ch).map(([it, r]) => [it, r[c === 'b' ? 0 : 1] || r[0] || r[1]]));
      const ec = P.items.filter(x => !RES.has(x.n) && JSON.stringify(mesuresJS(x.n, ch)) !== JSON.stringify(x[c]));
      if (ec.length) out.push(`chaîne ${c} recalculée ≠ payload : ${ec.slice(0, 3).map(x => x.n + ' ' + JSON.stringify(mesuresJS(x.n, ch)) + ' ≠ ' + JSON.stringify(x[c])).join(' ; ')}`);
    }
    // import (toutes les recettes de base + une alternative) : bouton « Ma partie », chaîne p, palier réglé
    FicsitPartie.enregistrer({nom: 'Test', date: '2026-01-31T03:06:00.000Z', duree: 3600, version: 58, lu: 'test-arbre',
      recettes: G.r.filter(r => !r[2]).map(r => r[0]).concat('Recipe_Alternate_PureIronIngot_C'), schemas: ['Schematic_4-1_C'], attente: []});
    if (document.getElementById('chainP').hidden || !P.items.every(x => x.p)) out.push('chaîne « Ma partie » absente après import');
    if (st.tier !== 4) out.push(`palier non réglé sur la partie (${st.tier})`);
    const fer = P.items.find(x => x.n === 'Iron Ingot');
    if (fer && fer.p.rec !== 'Alternate: Pure Iron Ingot' && fer.o.rec === 'Alternate: Pure Iron Ingot') out.push('chaîne p : alternative débloquée non retenue');
    FicsitPartie.oublier();
    if (!document.getElementById('chainP').hidden) out.push('chaîne « Ma partie » restée après vidage');
    return out;
  },
  'depot-dimensionnel.html': async () => {
    await usineTest();
    const u = USINE, out = [], txt = id => document.getElementById(id).innerText;
    if (u.batis.length !== 12 || u.liens.length !== 10) out.push(`extraction : ${u.batis.length} bâtiments, ${u.liens.length} liaisons (12 et 10 attendus)`);
    const cont = u.batis.find(b => b.c === 'Build_StorageContainerMk2_C');
    if (!cont || cont.cases !== 24 || cont.stock.Desc_IronPlate_C !== 100) out.push('conteneur mal lu : ' + JSON.stringify(cont));
    const c = u.batis.find(b => b.c === 'Build_ConstructorMk1_C');
    if (!c || c.clk !== 1.5 || c.shards !== 2 || c.prod !== 0.75) out.push('constructeur mal lu : ' + JSON.stringify(c));
    if (u.depot.Desc_IronPlate_C !== 1234 || u.extensions.length !== 2) out.push('stock ou recherches du Depot mal lus');
    // débits : réel 0 (Depot plein), potentiel 20 /min limité par l'amont, fonderie à fond, constructeur aux deux tiers
    const F = FLUX, up = F && F.reel.uploaders.find(x => u.batis[x.i].stock && u.batis[x.i].stock.Desc_IronPlate_C);
    const ic = u.batis.indexOf(c);
    if (!F || F.reel.U !== 30 || F.reel.mult !== 2) out.push('vitesse d\'envoi ou extension mal comptées : ' + JSON.stringify(F && [F.reel.U, F.reel.mult]));
    else {
      if (!up || up.total > 1e-6 || up.frein !== 'plein') out.push('débit réel attendu 0, Depot plein : ' + JSON.stringify(up));
      // trois plafonds : envoi 30 /min, raccord convoyeur Mk.1 60 /min, chaîne en amont 20 /min → potentiel 20, amont
      if (!up || up.U !== 30 || up.raccord.cap !== 60 || !/Mk1/.test(up.raccord.mk) || Math.abs(up.amont - 20) > 0.05
        || Math.abs(up.potentiel - 20) > 0.05 || up.facteur !== 'amont') out.push('plafonds de l\'Uploader : ' + JSON.stringify(up));
      if (Math.abs(F.libre.batis[ic].x - 2 / 3) > 0.01) out.push('constructeur : marche ' + F.libre.batis[ic].x);
      // Depot plein : le conteneur garde le surplus, le constructeur continue ; il sera plein dans (24 cases × 200 − 100) / 20 = 235 min
      const tp = F.reel.tampons;
      if (Math.abs(F.reel.batis[ic].x - 2 / 3) > 0.01) out.push('Depot plein : le constructeur devrait continuer (conteneur) : ' + F.reel.batis[ic].x);
      if (tp.length !== 1 || Math.abs(tp[0].absorbe - 20) > 0.05 || Math.abs(tp[0].plein - 235) > 0.5) out.push('conteneur qui se remplit : ' + JSON.stringify(tp));
      if (!(F.reel.energie.conso > 0) || F.reel.energie.prod !== 0) out.push('bilan électrique : ' + JSON.stringify(F.reel.energie));
      if (!F.reel.stable) out.push('calcul non convergé');
    }
    // inventaire : une ligne par item, détail dans un <details> (fermé : textContent, pas innerText)
    const upl = [...document.querySelectorAll('#uploaders details.upl')], tx = e => (e && e.textContent || '').replace(/\s+/g, ' ');
    if (upl.length !== 2) out.push(`${upl.length} groupes d'Uploaders (2 attendus)`);
    const plaques = upl.find(x => x.querySelector('summary img.ic'));
    if (!plaques || plaques.querySelectorAll('ul.src > li').length !== 1 || !/150/.test(tx(plaques)) || !/2/.test(tx(plaques)))
      out.push('source du groupe « plaques » : ' + (plaques ? tx(plaques) : 'absent'));
    if (plaques && !plaques.querySelector('.alerte')) out.push('séparateur en amont non signalé');
    if (plaques && (plaques.querySelectorAll('.facteurs li').length !== 3 || !/amont|upstream/.test(tx(plaques.querySelector('.facteurs li.min')))))
      out.push('les trois plafonds ne sont pas affichés : ' + tx(plaques.querySelector('.debit')));
    // Depot plein : la ligne donne le débit théorique (20 /min), le plafond (A) et le signe « plein » ; le détail le redit
    const s = plaques && plaques.querySelector('summary');
    if (!s || !/^20\b/.test(tx(s.querySelector('.debitc b'))) || !/A/.test(tx(s.querySelector('.debitc .tag'))) || !s.querySelector('.tag.p')
      || !plaques.querySelector('.debit small.plein'))
      out.push('ligne du groupe « plaques » : ' + tx(s));
    if (!/1[\s\u202f.,]?234/.test(tx(document.getElementById('uploaders')))) out.push('stock du Depot absent de l\'inventaire');
    if (!document.getElementById('legende').querySelector('.tag.p')) out.push('légende absente');
    if (!/200/.test(txt('extension'))) out.push('extension 200 % non affichée');
    // fluides et circuits : pompe à eau à 25 % (30 m³/min) pour une centrale à charbon qui en veut 45 → marche 2/3,
    // 50 MW, il manque 15 m³/min d'eau ; constructeur sur un circuit grillé et fonderie hors circuit : à l'arrêt
    const uf = {batis: [
      {c: 'Build_WaterPump_C', res: 'x', clk: 0.25, circ: 0},
      {c: 'Build_MinerMk1_C', res: 'x', item: 'Desc_Coal_C', pur: 'pure', circ: 0},
      {c: 'Build_ConveyorBeltMk2_C'},
      {c: 'Build_GeneratorCoal_C', fuel: 'Desc_Coal_C', circ: 0},
      {c: 'Build_ConstructorMk1_C', rec: 'Recipe_IronPlate_C', circ: 1},
      {c: 'Build_SmelterMk1_C', rec: 'Recipe_IngotIron_C'}],
      liens: [[1, 'Output0', 2, 'ConveyorAny0'], [2, 'ConveyorAny1', 3, 'Input0']],
      fluides: [{fluide: 'Desc_Water_C', membres: [[0, 'FGPipeConnectionFactory'], [3, 'FGPipeConnectionFactory']], tuyau: 300}],
      circuitsL: [{id: 1, grille: false}, {id: 2, grille: true}], depot: {}, extensions: []};
    const rf = FicsitFlux.calculer(uf, P), fl = rf.fluides[0] || {}, pc = rf.energie.parCircuit;
    if (Math.abs(rf.batis[3].x - 2 / 3) > 0.01 || Math.abs(rf.energie.prod - 50) > 0.5) out.push('centrale à charbon limitée par l\'eau : ' + JSON.stringify([rf.batis[3], rf.energie.prod]));
    if (Math.abs(fl.debit - 30) > 0.05 || Math.abs(fl.manque - 15) > 0.05 || fl.trop) out.push('réseau d\'eau : ' + JSON.stringify(fl));
    if (!rf.batis[4].off || rf.batis[4].x || !rf.batis[5].off) out.push('machines hors tension en marche : ' + JSON.stringify(rf.batis.slice(4)));
    if (!pc.some(c => c.k === 1 && c.grille) || !pc.some(c => c.k === -1 && c.arret === 1)) out.push('circuits : ' + JSON.stringify(pc));
    if (!rf.stable) out.push('calcul fluides non convergé');
    return out;
  },
  // rentabilité par nœud : sans partie, toutes les filières ; avec une partie qui n'a que la foreuse Mk.1, le convoyeur
  // Mk.1 et la centrale à charbon, seul le charbon reste : 60 /min × (5 MW bruts − 0,5 MW d'eau) − 5 MW = 265 MW nets,
  // et à 250 % le convoyeur Mk.1 plafonne le nœud (même valeur, signalée)
  'energie-noeuds.html': () => {
    const out = [], lignes = () => [...document.querySelectorAll('#tableau .ligne:not(.tete)')];
    if (lignes().length !== P.ch.length + 1) out.push(`${lignes().length} lignes (${P.ch.length + 1} attendues)`);
    if (/NaN|undefined/.test(document.getElementById('tableau').innerText)) out.push('valeur invalide dans le tableau');
    if (document.querySelector('#tableau .ligne.hors')) out.push('filière grisée sans partie importée');
    FicsitPartie.enregistrer({nom: 'Test', date: '2026-01-31T03:06:00.000Z', duree: 3600, version: 58, lu: 'test-energie',
      recettes: ['Recipe_MinerMk1_C', 'Recipe_ConveyorBeltMk1_C', 'Recipe_GeneratorCoal_C'], schemas: [], attente: []});
    const ok = lignes().filter(l => !l.classList.contains('hors'));
    const v = ok.length === 1 ? [...ok[0].querySelectorAll('.cel')][1].innerText.replace(/\s+/g, ' ') : '';
    if (ok.length !== 1 || !/^265 MW/.test(v) || !/250 % : 265 MW/.test(v)) out.push(`partie au charbon : ${ok.length} filière(s) disponible(s), nœud normal « ${v} »`);
    if (!lignes().some(l => l.classList.contains('hors') && l.querySelector('.manque'))) out.push('ce qui manque aux filières grisées n\'est pas dit');
    FicsitPartie.oublier();
    if (document.querySelector('#tableau .ligne.hors')) out.push('filières restées grisées après oubli de la partie');
    return out;
  },
  // planificateur : objectif par défaut (10 plaques renforcées /min → 120 minerai de fer), recette imposée, partie importée
  'planner.html': async () => {
    const out = [], txt = id => document.getElementById(id).innerText.replace(/\s+/g, ' ');
    if (!/120\b.*(Iron Ore|Minerai de fer)/.test(txt('bruts'))) out.push('ressources par défaut : ' + txt('bruts'));
    if (document.querySelectorAll('#etapes .etape').length !== 5) out.push(document.querySelectorAll('#etapes .etape').length + ' étapes (5 attendues)');
    if (/NaN|undefined/.test(document.body.innerText)) out.push('valeur invalide dans la page');
    // vue en graphe, affichée par défaut : 5 étapes + minerai + objectif, 7 liens (6 entre étapes et ressource, 1 vers
    // l'objectif), convoyeurs, détail du montage, glisser, survol qui isole, retour à la liste
    if (document.getElementById('vueGraphe').hidden) out.push('le graphe n\'est pas la vue par défaut');
    document.querySelector('[data-vue="graphe"]').click();
    const svg = document.querySelector('#graphe svg');
    if (!svg || document.getElementById('vueGraphe').hidden || !document.getElementById('vueListe').hidden) out.push('vue en graphe non affichée');
    else {
      if (svg.querySelectorAll('.noeud').length !== 7) out.push(svg.querySelectorAll('.noeud').length + ' blocs dans le graphe (7 attendus)');
      if (svg.querySelectorAll('.lien').length !== 7) out.push(svg.querySelectorAll('.lien').length + ' liens dans le graphe (7 attendus)');
      if (/NaN|undefined/.test(svg.outerHTML)) out.push('valeur invalide dans le graphe');
      svg.querySelector('.noeud[data-id^="b:"]').dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
      if (!svg.classList.contains('actif')) out.push('survol du minerai : graphe pas isolé');
      // survol de l'objectif : toute la lignée en amont s'allume (7 liens, 7 blocs), pas seulement le fournisseur direct
      svg.querySelector('.noeud[data-id^="c:"]').dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
      if (svg.querySelectorAll('.lien.lie').length !== 7 || svg.querySelectorAll('.noeud.lie').length !== 7)
        out.push(`survol de l'objectif : ${svg.querySelectorAll('.lien.lie').length} lien(s), ${svg.querySelectorAll('.noeud.lie').length} bloc(s) en lumière (7 / 7 attendus)`);
      // et toute la chaîne en aval : depuis le minerai, tout le graphe (il alimente tout)
      svg.querySelector('.noeud[data-id^="b:"]').dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
      if (svg.querySelectorAll('.lien.lie').length !== 7) out.push(`survol du minerai : ${svg.querySelectorAll('.lien.lie').length} lien(s) en aval (7 attendus)`);
      // bloc du milieu (barres) : minerai → lingots → barres en amont, barres → vis → plaques renforcées → objectif en aval,
      // mais pas la branche des plaques de fer (5 liens)
      const tige = [...GEO.parId.values()].find(n => n.type === 'etape' && n.item === 'Iron Rod');
      svg.querySelector(`.noeud[data-id="${CSS.escape(tige.id)}"]`).dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
      const plaques = [...GEO.parId.values()].find(n => n.type === 'etape' && n.item === 'Iron Plate');
      if (svg.querySelectorAll('.lien.lie').length !== 5 || svg.querySelector(`.noeud[data-id="${CSS.escape(plaques.id)}"]`).classList.contains('lie'))
        out.push(`survol des barres : ${svg.querySelectorAll('.lien.lie').length} lien(s) (5 attendus), branche des plaques ${svg.querySelector(`.noeud[data-id="${CSS.escape(plaques.id)}"]`).classList.contains('lie') ? 'allumée' : 'éteinte'}`);
      // convoyeur sur chaque lien : 120 minerai → Mk.2
      const etiq = [...svg.querySelectorAll('.etiq')].map(x => x.textContent.replace(/\s+/g, ' '));
      if (!etiq.every(x => /Mk\.\d/.test(x)) || !etiq.some(x => /^120 Mk\.2$/.test(x))) out.push('convoyeurs des liens : ' + etiq.join(' | '));
      // toucher un bloc : choisi, détail du montage (3 constructeurs de plaques : manifold, 2 séparateurs)
      const pointeur = (type, el, x, y) => el.dispatchEvent(new PointerEvent(type, {bubbles: true, pointerId: 7, clientX: x, clientY: y, button: 0}));
      const bloc = () => document.querySelector('#graphe .noeud[data-id="e:Recipe_IronPlate_C"]');
      pointeur('pointerdown', bloc(), 100, 100); pointeur('pointerup', document.getElementById('graphe'), 100, 100);
      if (!bloc().classList.contains('choisi') || !/2 (séparateur|splitter)/.test(document.getElementById('detail').innerText))
        out.push('détail du montage : ' + document.getElementById('detail').innerText);
      const n4 = () => bloc().querySelector('.n4').textContent;
      const avantM = n4(), montage = document.getElementById('montage');
      montage.checked = 'equilibre' === 'equilibre'; montage.dispatchEvent(new Event('change'));
      if (n4() === avantM || !/(équilibrage|load balancing)/i.test(document.getElementById('detail').innerText)) out.push('bascule du montage sans effet : ' + n4());
      montage.checked = 'manifold' === 'equilibre'; montage.dispatchEvent(new Event('change'));
      // changer de recette depuis le graphe : bouton ⇄, menu, « Fourni », puis retour à la recette par défaut
      const ouvrir = id => document.querySelector(`#graphe .recette[data-recette="${id}"]`)
        .dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, pointerId: 9, button: 0}));
      ouvrir('e:Recipe_IronPlate_C');
      const menu = document.getElementById('menuRec'), opts = () => [...menu.querySelectorAll('button[data-val]')];
      if (menu.hidden || opts().length < 2 || !opts().some(b => b.getAttribute('aria-checked') === 'true' && b.dataset.val === 'Recipe_IronPlate_C'))
        out.push('menu des recettes : ' + menu.innerText.replace(/\s+/g, ' '));
      else {
        opts().find(b => b.dataset.val === 'brut').click();
        if (!menu.hidden || !/60\b.*(Iron Plate|Plaque de fer)/.test(txt('bruts'))) out.push('« Fourni » depuis le graphe : ' + txt('bruts'));
        if (!document.querySelector('#graphe .recette[data-recette="b:Iron Plate"]')) out.push('item fourni sans bouton ⇄ dans le graphe');
        else {
          ouvrir('b:Iron Plate');
          const def = opts().find(b => b.dataset.val === '');
          if (!def) out.push('pas de « recette par défaut » pour un item fourni'); else def.click();
          if (S.choix['Iron Plate'] !== undefined || !document.querySelector('#graphe .noeud[data-id="e:Recipe_IronPlate_C"]')) out.push('retour à la recette par défaut depuis le graphe');
        }
      }
      // panneau du bloc choisi (toucher un bloc déjà choisi le désélectionne) : liste des recettes
      if (CHOISI !== 'e:Recipe_IronPlate_C') { pointeur('pointerdown', bloc(), 100, 100); pointeur('pointerup', document.getElementById('graphe'), 100, 100); }
      if (!document.querySelector('#detail select[data-item="Iron Plate"]')) out.push('pas de liste de recettes dans le panneau du bloc');
      // glisser le bloc de 150 px vers le bas : position retenue, lien redessiné
      const avantD = document.querySelector('#graphe .lien[data-vers="e:Recipe_IronPlate_C"]').getAttribute('d');
      pointeur('pointerdown', bloc(), 100, 100);
      pointeur('pointermove', document.getElementById('graphe'), 100, 180);
      pointeur('pointermove', document.getElementById('graphe'), 100, 250);
      pointeur('pointerup', document.getElementById('graphe'), 100, 250);
      const q = S.pos['e:Recipe_IronPlate_C'];
      if (!q || document.querySelector('#graphe .lien[data-vers="e:Recipe_IronPlate_C"]').getAttribute('d') === avantD) out.push('glisser sans effet : ' + JSON.stringify(q));
      document.getElementById('reorg').click();
      if (Object.keys(S.pos).length) out.push('réorganiser n\'efface pas les positions');
      // montage dessiné : bloc déplié, séparateurs et groupeurs dessinés = ceux du calcul, dans les deux modes
      for (const m of ['manifold', 'equilibre']) {
        montage.checked = m === 'equilibre'; montage.dispatchEvent(new Event('change'));
        S.replies = []; rendreGraphe();   // dépliés par défaut
        const blocs = [...document.querySelectorAll('#graphe .noeud.deplie')];
        if (blocs.length !== 5) out.push(`${m} : ${blocs.length} bloc(s) déplié(s) sur 5`);
        blocs.forEach(g => {
          const n = GEO.parId.get(g.dataset.id), mo = M.montage(n.etape, m, DERNIER.D, LIQ);
          // toutes les entrées et sorties solides sont dessinées (les tuyaux n'ont ni séparateur ni groupeur)
          const sol = ls => ls.filter(l => !l.liquide), som = (ls, k) => sol(ls).reduce((s0, l) => s0 + l[k], 0);
          const sep = som(mo.entrees, 'separateurs'), grp = som(mo.entrees, 'groupeurs') + som(mo.sorties, 'groupeurs');
          const ds = g.querySelectorAll('.sep').length, dg = g.querySelectorAll('.grp').length;
          if (ds !== sep || dg !== grp) out.push(`${m} ${g.dataset.id} : dessin ${ds} sép. / ${dg} grp., calcul ${sep} / ${grp}`);
          if (g.querySelectorAll('.mach').length !== n.etape.entieres) out.push(`${m} ${g.dataset.id} : machines dessinées`);
          // une ligne d'entrée par ingrédient, chacune avec son point d'arrivée
          if (Object.keys(n.sch.yEs).length !== mo.entrees.length || Object.keys(n.sch.ySs).length !== mo.sorties.length)
            out.push(`${m} ${g.dataset.id} : ${Object.keys(n.sch.yEs).length} ligne(s) d'entrée dessinée(s) pour ${mo.entrees.length}`);
          if (/même montage|same layout/.test(g.textContent)) out.push(`${m} ${g.dataset.id} : entrée rappelée en note au lieu d'être dessinée`);
        });
        if (/NaN|undefined/.test(document.querySelector('#graphe svg').outerHTML)) out.push(m + ' : valeur invalide dans le montage dessiné');
      }
      document.querySelector('#graphe .plier').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, pointerId: 8, button: 0}));
      if (document.querySelectorAll('#graphe .noeud.deplie').length !== 4) out.push('le bouton − ne replie pas le bloc');
      document.getElementById('deplier').click(); document.getElementById('deplier').click();
      if (document.querySelectorAll('#graphe .noeud.deplie').length) out.push('« Tout déplier » ne replie pas tout au second clic');
      montage.checked = 'manifold' === 'equilibre'; montage.dispatchEvent(new Event('change'));
      const w = +document.querySelector('#graphe svg').getAttribute('width');
      document.querySelector('[data-z="1"]').click();
      if (!(+document.querySelector('#graphe svg').getAttribute('width') > w)) out.push('zoom sans effet');
      const w2 = +document.querySelector('#graphe svg').getAttribute('width');
      document.getElementById('graphe').dispatchEvent(new WheelEvent('wheel', {bubbles: true, cancelable: true, deltaY: 200, clientX: 600, clientY: 300}));
      if (!(+document.querySelector('#graphe svg').getAttribute('width') < w2)) out.push('molette : pas de zoom arrière');
      if (!document.querySelector('#graphe path.defile')) out.push('convoyeurs sans défilement');
      document.querySelector('[data-z="0"]').click();
    }
    document.querySelector('[data-vue="liste"]').click();
    if (document.getElementById('vueListe').hidden) out.push('retour à la liste impossible');
    // optimisation : solveur chargé à la demande (file:// compris), moins de ressources que le choix simple
    const rare = () => parseFloat(document.querySelector('#tuiles [data-k="rare"] .big').innerText.replace(/\s/g, '').replace(',', '.'));
    document.getElementById('alt').click();   // alternatives permises : l'optimum en profite
    const avant = rare(), mode = m => document.querySelector(`#mode [data-mode="${m}"]`).click();
    mode('ressources');
    if (!document.getElementById('alt').disabled || !document.getElementById('alt').checked) out.push('mode optimisé : alternatives pas imposées');
    for (let k = 0; k < 200 && !HIGHS && ETAT_H !== 'erreur'; k++) await new Promise(r => setTimeout(r, 100));
    if (!HIGHS) out.push('solveur non chargé : ' + ETAT_H);
    else {
      if (txt('alertes')) out.push('alerte en mode optimisé : ' + txt('alertes'));
      if (!(rare() < avant)) out.push(`optimisé : ${rare()} ‰ ≥ ${avant} ‰`);
      if (/NaN|undefined/.test(document.body.innerText)) out.push('valeur invalide en mode optimisé');
      // place et synthèse : écart affiché face au standard, curseurs de poids seulement en synthèse
      for (const m of ['place', 'synthese']) {
        mode(m);
        if (document.querySelector(`#mode [data-mode="${m}"]`).getAttribute('aria-checked') !== 'true') out.push(m + ' : bouton pas coché');
        if (!document.querySelector('#tuiles [data-k="esp"] .ec')) out.push(m + ' : pas d\'écart face au standard');
        if (document.getElementById('poids').hidden !== (m !== 'synthese')) out.push(m + ' : curseurs de poids mal affichés');
        if (/NaN|undefined/.test(document.body.innerText)) out.push(m + ' : valeur invalide');
      }
    }
    mode('defaut');
    document.getElementById('alt').click();
    const sel = document.querySelector('#etapes select[data-item="Iron Plate"]');
    sel.value = 'brut'; sel.dispatchEvent(new Event('change', {bubbles: true}));
    if (!/60\b.*(Iron Plate|Plaque de fer)/.test(txt('bruts'))) out.push('plaques « fournies » absentes des ressources : ' + txt('bruts'));
    document.getElementById('choixRaz').click();
    FicsitPartie.enregistrer({nom: 'Test', date: '2026-01-31T03:06:00.000Z', duree: 3600, version: 58, lu: 'test-planner',
      recettes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C', 'Recipe_IronRod_C', 'Recipe_Screw_C'], schemas: ['Schematic_1-1_C'], attente: []});
    // grille de paliers commune : palier de la partie sélectionné tout seul, paliers au-delà hachurés
    { const pr = document.querySelector('#paliers button[aria-pressed="true"]'), pp = FicsitPartie.palier(FicsitPartie.charger());
      if (!pr || +pr.dataset.t !== pp) out.push(`palier de la partie non sélectionné (${pr && pr.dataset.t} ≠ ${pp})`);
      if (pp < 9 && !document.querySelector(`#paliers button[data-t="${pp + 1}"]`).disabled) out.push('palier au-delà de la partie cliquable'); }
    if (!/(Aucune recette permise|No allowed recipe).*(Reinforced Iron Plate|Plaque de fer renforcée)/.test(txt('alertes')))
      out.push('partie sans plaques renforcées : pas d\'alerte « ' + txt('alertes') + ' »');
    // usine en cache : 2 constructeurs de plaques (150 % et 100 %) → 50 plaques /min installées, il en faut 60 ;
    // vis sans machine ; « Recettes de mon usine d'abord » prend la fonderie (alliage de fer) pour les lingots
    FicsitPartie.enregistrer({nom: 'Test', date: '2026-01-31T03:06:00.000Z', duree: 3600, version: 58, lu: 'test-planner-usine',
      recettes: ['Recipe_IngotIron_C', 'Recipe_Alternate_IngotIron_C', 'Recipe_IronPlate_C', 'Recipe_IronRod_C', 'Recipe_Screw_C',
        'Recipe_IronPlateReinforced_C'], schemas: ['Schematic_1-1_C'], attente: []});
    await FicsitPartie.garder('usine', {batis: [{c: 'Build_ConstructorMk1_C', rec: 'Recipe_IronPlate_C', clk: 1.5, prod: .5},
      {c: 'Build_ConstructorMk1_C', rec: 'Recipe_IronPlate_C'}, {c: 'Build_FoundryMk1_C', rec: 'Recipe_Alternate_IngotIron_C'}], fluides: []});
    await chargerUsine();
    const u = [...document.querySelectorAll('#etapes .etape')].map(e => [e.querySelector('select').dataset.item, (e.querySelector('.usine') || {}).innerText || '']);
    const plaques = (u.find(x => x[0] === 'Iron Plate') || [])[1] || '', vis = (u.find(x => x[0] === 'Screws') || [])[1] || '';
    if (!/\b2\b.*\b50\b.*\b10\b.*\b1\b/.test(plaques)) out.push('plaques : ' + plaques);
    if (!/(aucune machine|no machine)/.test(vis)) out.push('vis : ' + vis);
    const lingots = () => (document.querySelector('#etapes select[data-item="Iron Ingot"]') || {}).value;
    if (lingots() !== 'Recipe_Alternate_IngotIron_C') out.push('recette de l\'usine non préférée pour les lingots : ' + lingots());
    if (!/(machines à construire|machines to build)/i.test(txt('tuiles'))) out.push('tuile « à construire » absente');
    document.getElementById('suivre').click();
    if (lingots() !== 'Recipe_IngotIron_C') out.push('sans « recettes de mon usine d\'abord », lingots : ' + lingots());
    document.getElementById('suivre').click();
    FicsitPartie.oublier();
    await new Promise(r => setTimeout(r, 50));
    if (txt('alertes') || document.querySelector('#etapes .usine')) out.push('alerte ou comparaison restée après oubli de la partie');
    // onglets : un nouveau plan part des valeurs par défaut, chaque plan garde ses objectifs et son mode, renommage gardé,
    // le plan affiché est dans l'adresse
    {
      mode('energie');
      const cle = () => JSON.parse(localStorage.getItem('ficsit-tools:planner'));
      document.getElementById('planAjout').click();
      if (document.querySelectorAll('#plans .p-nom').length !== 2 || S.actif !== 1) out.push('onglets : pas de second plan');
      if (S.mode !== 'defaut' || S.cibles.length !== 1 || S.cibles[0].item !== 'Reinforced Iron Plate') out.push('onglets : nouveau plan pas par défaut');
      S.cibles = [{item: 'Iron Rod', debit: 30}]; garder(); calcul();
      const nom = document.querySelector('#plans .p-nom[aria-selected="true"]');
      nom.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));
      const inp = document.querySelector('#plans input');
      if (!inp) out.push('onglets : pas de champ de renommage');
      else { inp.value = 'Tiges'; inp.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})); }
      if (document.querySelector('#plans .p-nom[aria-selected="true"]').textContent !== 'Tiges') out.push('onglets : renommage non affiché');
      await new Promise(r => setTimeout(r, 400));   // adresse mise à jour après une courte pause
      const code = new URLSearchParams(location.search).get('p');
      if (!code || !/Iron Rod/.test(atob(code.replace(/-/g, '+').replace(/_/g, '/')))) out.push('adresse : plan affiché absent (' + location.search + ')');
      document.querySelector('#plans .p-nom[data-i="0"]').click();
      if (S.mode !== 'energie' || S.cibles[0].item !== 'Reinforced Iron Plate') out.push('onglets : premier plan pas retrouvé');
      const c = cle();
      if (c.plans.length !== 2 || c.plans[1].nom !== 'Tiges' || c.plans[1].cibles[0].item !== 'Iron Rod') out.push('onglets : plans mal gardés');
      const ok = window.confirm; window.confirm = () => true;
      document.querySelector('#plans .p-nom[data-i="1"]').click();
      document.querySelector('#plans [data-suppr="1"]').click();
      window.confirm = ok;
      if (document.querySelectorAll('#plans .p-nom').length !== 1 || S.actif !== 0 || S.mode !== 'energie') out.push('onglets : fermeture');
      mode('defaut');
    }
    return out;
  },
  'ficsit_horloge.html': () => {
    const n = document.querySelectorAll('#tbl tbody tr').length, out = n ? [] : ['aucune répartition calculée'];
    const bad = [...document.querySelectorAll('#picker .slot')].map(e => e.title).filter(t => /function|undefined|null/.test(t));
    if (bad.length) out.push('infobulle anormale : ' + bad[0]);
    if (DATA.buildings.length < 20) out.push(`${DATA.buildings.length} bâtiments seulement`);
    // régime d'éclats tiré de la partie : illimités avec l'éclat synthétique, rares sans ; nouvel import = nouveau réglage
    const partie = (lu, r) => FicsitPartie.enregistrer({nom: 'Test', date: '2026-01-31T03:06:00.000Z', duree: 3600, version: 58, lu,
      recettes: r, schemas: [], attente: []});
    partie('test-horloge-1', ['Recipe_SyntheticPowerShard_C']);
    if (regime !== 'free' || document.getElementById('regPartie').hidden) out.push('partie avec éclat synthétique : régime ' + regime);
    partie('test-horloge-2', ['Recipe_IngotIron_C']);
    if (regime !== 'rare') out.push('partie sans éclat synthétique : régime ' + regime);
    FicsitPartie.oublier();
    if (!document.getElementById('regPartie').hidden) out.push('note de régime restée après oubli de la partie');
    return out;
  },
  // jalons du HUB obtenus dans la partie : cochés, palier complet marqué, bilan affiché
  'memo-ficsit.html': () => {
    const out = [], jal = document.querySelectorAll('.jal[data-s]');
    if (jal.length !== 42) out.push(`${jal.length} jalons annotés (42 attendus)`);
    FicsitPartie.enregistrer({nom: 'Test', date: '2026-01-31T03:06:00.000Z', duree: 3600, version: 58, lu: 'test-memo',
      recettes: [], schemas: ['Schematic_1-1_C', 'Schematic_1-2_C', 'Schematic_1-3_C', 'Schematic_2-1_C'], attente: []});
    const ok = document.querySelectorAll('.jal.ok').length, faits = document.querySelectorAll('.tier.fait').length;
    if (ok !== 4 || faits !== 1) out.push(`jalons cochés ${ok} (4 attendus), paliers complets ${faits} (1 attendu)`);
    if (!/4/.test(document.getElementById('jalBilan').innerText)) out.push('bilan des jalons absent');
    FicsitPartie.enregistrer({nom: 'Test', date: '2026-01-31T03:06:00.000Z', duree: 3600, version: 58, lu: 'test-memo-2',
      recettes: ['Recipe_MinerMk1_C', 'Recipe_ConveyorBeltMk1_C', 'Recipe_ConveyorBeltMk2_C'], schemas: [], attente: []});
    const conv = document.querySelectorAll('.slot.verrou').length, mineurs = document.querySelectorAll('tr.grp.verrou').length;
    if (conv !== 4 || mineurs !== 2 || !/Mk\.1/.test(document.getElementById('equipBilan').innerText))
      out.push(`partie Mk.1/Mk.2 : ${conv} convoyeurs grisés (4 attendus), ${mineurs} foreuses grisées (2 attendues)`);
    FicsitPartie.oublier();
    if (document.querySelectorAll('.jal.ok').length || !document.getElementById('jalBilan').hidden) out.push('jalons restés cochés après oubli');
    if (document.querySelectorAll('.verrou').length || !document.getElementById('equipBilan').hidden) out.push('matériel resté grisé après oubli');
    return out;
  },
  'satisfactory_infographie.html': () => {
    const out = [], rel = (a, b) => a == null || b == null ? (a == b ? 0 : 1) : Math.abs(a - b) / Math.abs(b);
    // chaque critère : des recettes notées et des combinaisons, avec une meilleure chaîne au moins égale à la base
    for (const m of ['mw', 'mat', 'esp', 'syn']) {
      setMode(m);
      if (!D.some(r => IDX(r) > 0)) out.push(`${m} : aucune recette notée`);
      const rows = CBS();
      if (!rows.length) out.push(`${m} : aucune combinaison`);
      rows.forEach(c => { if (c.idx_defaut && c.idx_optimal < c.idx_defaut * (1 - 1e-9)) out.push(`${m} : ${c.cible} optimum < base`); });
    }
    // synthèse à 100 % d'énergie = indice I
    setSynW({mw: 10, mat: 0, esp: 0});
    const e = D.filter(r => rel(synIdx(r).i, idxOf(r, 'mw').i) > 1e-9);
    if (e.length) out.push(`synthèse 100 % énergie ≠ I : ${e.slice(0, 3).map(r => r.n).join(', ')}`);
    setSynW({mw: 5, mat: 5, esp: 5});
    // « ma partie » : avec les recettes de base et cinq alternatives seulement, aucune autre alternative dans les chaînes
    const alts = D.filter(r => r.a), ok = new Set(alts.slice(0, 5).map(r => r.n));
    if (D.some(r => !r.k)) out.push('recette sans classe du jeu (k)');
    FILTRE = new Set(D.filter(r => !r.a || ok.has(r.n)).map(r => r.k));
    for (const m of ['mw', 'esp']) {
      setMode(m);
      const hors = Object.values(CHS()).flatMap(c => c.top.flatMap(t => t[1])).filter(a => !ok.has(a));
      if (hors.length) out.push(`${m} filtré : alternative non débloquée ${hors[0]}`);
    }
    FILTRE = null; setMode('mw');
    // « Ma partie » : un import (tel que le worker le rend) s'affiche dans le panneau latéral, disque dur en attente
    // noté sur le critère affiché, puis se vide
    FicsitPartie.enregistrer({nom: 'Test', date: '2026-01-31T03:06:00.000Z', duree: 3600, version: 58, recettes:
      [...D.filter(r => !r.a).map(r => r.k), 'Recipe_Alternate_PureIronIngot_C'], schemas: ['Schematic_3-1_C'], attente: [{id: 8, relances: 0,
      schemas: ['Schematic_Alternate_Motor1_C', 'Schematic_Alternate_InventorySlots2_C']}]});
    if (cap !== 3) out.push(`palier non réglé sur la partie (${cap})`);
    cap = TMAX;
    ouvrirPanneau(true, false);
    const lignes = () => [...document.querySelectorAll('#partieAttente tbody tr')];
    if (lignes().length !== 2) out.push(`panneau : ${lignes().length} ligne(s) pour le disque en attente au lieu de 2`);
    const note = () => (lignes()[0] || {}).querySelector?.('td.n')?.textContent;
    const n1 = note(); setMode('mat');
    if (!n1 || n1 === '—' || note() === n1) out.push(`panneau : score du disque en attente absent ou insensible au critère (${n1} → ${note()})`);
    setMode('mw');
    if (!document.getElementById('partieTab').textContent.includes('1')) out.push('onglet : nombre de disques en attente absent');
    // simulation : l'alternative cochée du disque (Moteur rigide par défaut) devient permise, l'autre choix aussi une fois coché
    const moteur = 'Recipe_Alternate_Motor_1_C';
    setPartie(true);
    if (FILTRE.has(moteur)) out.push('filtre : alternative en attente permise sans simulation');
    SIMU.on = true; setPartie(true);
    if (!FILTRE.has(moteur) || !D.some(r => r.k === moteur && isAvail(r))) out.push('simulation : choix par défaut non permis');
    SIMU.choix[8] = 'Schematic_Alternate_InventorySlots2_C'; setPartie(true);
    if (FILTRE.has(moteur)) out.push('simulation : changement de choix ignoré');
    delete SIMU.choix[8]; setPartie(false);
    if (SIMU.on || FILTRE) out.push('simulation : reste active sans filtre');
    const restes = [availCache, combiCache, lbCache, planCache].reduce((n, c) => n + Object.keys(c).filter(k => /\dp\d/.test(k)).length, 0);
    if (restes) out.push(`caches filtrés non purgés : ${restes}`);
    document.getElementById('vider').click();
    if (PARTIE || lignes().length) out.push('panneau : import non vidé');
    ouvrirPanneau(false, false);
    return out;
  },
};
/* Indices de l'autre langue dans le texte visible. Les noms du jeu restent en anglais en mode FR
   quand le glossaire ne les traduit pas (alternatives, quelques items) : on ne cherche donc que des
   mots-outils, jamais des noms. */
const INDICES = {
  en: /[àâçéèêëîïôûùœ]|\b(le|les|des|du|une|avec|pour|sans|dans|par|sur)\b/i,
  fr: /\b(the|and|with|without|of|per|for|from|your)\b/i,
};

(async () => {
  const b = await chromium.launch();
  const echecs = [];
  for (const [page, prep] of Object.entries(PAGES)) {
    for (const lang of ['fr', 'en']) {
      const p = await b.newPage();
      const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      // Les polices Google peuvent être injoignables (CI, hors ligne) : seules les erreurs JS comptent.
      p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
      await p.addInitScript(([l, prefs]) => {
        try { for (const k in prefs) localStorage.setItem(k, JSON.stringify(prefs[k]));
          localStorage.setItem('ficsit-tools:lang', l === 'fr' ? 'en' : 'fr'); } catch (e) {}
      }, [lang, PREFS]);
      await p.goto('file://' + path.join(ROOT, page));
      await p.waitForTimeout(400);
      await p.click(`.flang button[data-lang="${lang}"]`);   // bascule en direct, depuis l'autre langue
      if (prep) await prep(p);
      if (await p.$('.pn-btn')) await p.click('.pn-btn');   // journal des révisions déroulé : son texte est vérifié aussi
      await p.waitForTimeout(400);
      const texte = await p.evaluate(() => document.body.innerText);
      const lignes = texte.split('\n').filter(l => INDICES[lang].test(l));
      const fuite = lignes.slice(0, 3);
      const nom = `${page} [${lang}]`;
      if (errs.length) echecs.push(`${nom} : erreurs JS : ${errs.slice(0, 3).join(' | ')}`);
      if (fuite.length) echecs.push(`${nom} : texte de l'autre langue : ${fuite.map(l => JSON.stringify(l.slice(0, 120))).join(' | ')}`);
      console.log(`${errs.length || fuite.length ? 'ÉCHEC' : 'ok   '} ${nom}`);
      await p.close();
    }
  }
  for (const [page, check] of Object.entries(CHECKS)) {
    const p = await b.newPage();
    await p.addInitScript(`window.usineTest = ${usineTest}`);   // les vérifications sont sérialisées : l'aide doit être dans la page
    await p.addInitScript(prefs => {
      try { for (const k in prefs) localStorage.setItem(k, JSON.stringify(prefs[k])); } catch (e) {}
    }, PREFS);
    await p.goto('file://' + path.join(ROOT, page));
    await p.waitForTimeout(400);
    let pb;
    try { pb = await p.evaluate(check); } catch (e) { pb = ['exception : ' + e.message]; }
    // bloc commun chargé, et toutes les icônes partagées référencées par la page se chargent (IC : nom → slug)
    pb = pb.concat(await p.evaluate(async () => {
      const out = [];
      if (!window.FicsitLang || !window.FicsitPaliers) out.push('bloc commun (commun/ficsit-commun.js) non chargé');
      const ic = typeof IC === 'object' && IC ? Object.values(IC).filter(v => typeof v === 'string' && v.length < 80) : [];
      const ko = [];
      await Promise.all(ic.map(slug => new Promise(res => {
        const im = new Image(); im.onload = () => res(); im.onerror = () => { ko.push(slug); res(); };
        im.src = `commun/icones-44/${slug}.webp`; })));
      if (ko.length) out.push(`${ko.length} icônes introuvables : ${ko.slice(0, 3).join(', ')}`);
      return out;
    }));
    pb.forEach(x => echecs.push(`${page} : ${x}`));
    console.log(`${pb.length ? 'ÉCHEC' : 'ok   '} ${page} [vérifications]`);
    await p.close();
  }
  // infobulle de la charte (commun/ficsit-infobulle.js) : le survol d'un élément à title l'affiche, avec son texte, à la
  // place de la bulle native (title retiré), et la range à la sortie ; le clavier aussi (focus visible)
  {
    const p = await b.newPage({viewport: {width: 1100, height: 800}});
    await p.goto('file://' + path.join(ROOT, 'charte.html'));
    await p.waitForTimeout(300);
    const btn = p.locator('button.f-btn[data-fr-title]');
    await btn.scrollIntoViewIfNeeded();
    await btn.hover();
    await p.waitForTimeout(450);
    const ok = await p.evaluate(() => { const i = document.getElementById('finfo'), e = document.querySelector('button.f-btn[data-fr-title]');
      return {vu: !!i && !i.hidden, texte: i ? i.innerText : '', titre: e.hasAttribute('title'), lie: e.getAttribute('aria-describedby')}; });
    if (!ok.vu || !ok.texte.includes('Plaque de fer renforcée') || ok.titre || ok.lie !== 'finfo')
      echecs.push(`infobulle au survol : ${JSON.stringify(ok)}`);
    await p.mouse.move(2, 2); await p.waitForTimeout(250);
    if (await p.evaluate(() => !document.getElementById('finfo').hidden)) echecs.push('infobulle : reste affichée après la sortie');
    // élément large : la bulle se place près du curseur (à gauche, puis à droite), pas au centre de la ligne
    const ligne = p.locator('#ligneLarge');
    await ligne.scrollIntoViewIfNeeded();
    const bx = await ligne.boundingBox(), gauche = [];
    for (const dx of [30, bx.width - 60]) {
      await p.mouse.move(2, 2); await p.waitForTimeout(150);
      await p.mouse.move(bx.x + dx, bx.y + bx.height / 2); await p.waitForTimeout(450);
      gauche.push(await p.evaluate(() => { const i = document.getElementById('finfo'); return i.hidden ? null : Math.round(i.getBoundingClientRect().left); }));
    }
    if (gauche[0] == null || gauche[1] == null || Math.abs(gauche[0] - (bx.x + 30 - 14)) > 6 || gauche[1] - gauche[0] < bx.width / 2 - 80)
      echecs.push(`infobulle sur une ligne large : pas près du curseur (cibles ${bx.x + 16} et ${bx.x + bx.width - 74}, obtenu ${gauche})`);
    await p.mouse.move(2, 2); await p.waitForTimeout(250);
    await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(250);
    // tactile : appui long = la bulle (qui reste après le doigt levé), sans activer l'élément ; le toucher suivant la ferme
    await p.mouse.move(2, 2); await p.waitForTimeout(250);
    const tact = await p.evaluate(async () => {
      const e = document.querySelector('button.f-btn[data-fr-title]'), i = () => document.getElementById('finfo'), r = e.getBoundingClientRect();
      const ev = (t, cible) => cible.dispatchEvent(new PointerEvent(t, {pointerType: 'touch', bubbles: true, cancelable: true, clientX: r.x + 5, clientY: r.y + 5}));
      let clics = 0; e.addEventListener('click', () => clics++);
      const dort = ms => new Promise(f => setTimeout(f, ms));
      ev('pointerdown', e); await dort(150);
      const tot = !i() || i().hidden;                      // pas encore : l'appui est trop court
      await dort(450);
      const vu = !!i() && !i().hidden;
      ev('pointerup', e); ev('pointerout', e); e.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
      await dort(50);
      const reste = !!i() && !i().hidden;
      ev('pointerdown', document.body); await dort(50); ev('pointerup', document.body);
      return {tot, vu, reste, clics, ferme: i().hidden};
    });
    if (!tact.tot || !tact.vu || !tact.reste || tact.clics || !tact.ferme) echecs.push(`infobulle au tactile (appui long) : ${JSON.stringify(tact)}`);
    console.log(`${echecs.some(x => x.startsWith('infobulle')) ? 'ÉCHEC' : 'ok   '} infobulle (survol, sortie)`);
    await p.close();
  }

  // lien partagé : planner.html?p=… ouvre le plan reçu dans un nouvel onglet, avec ses objectifs, son nom et son mode
  {
    const p = await b.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    const code = Buffer.from(JSON.stringify({c: [['Modular Frame', 4]], m: 'ressources'})).toString('base64url');
    await p.goto('file://' + path.join(ROOT, 'planner.html') + '?p=' + code);
    await p.waitForTimeout(800);
    const st = await p.evaluate(() => ({n: S.plans.length, actif: S.actif, nom: S.plans[S.actif].nom, cibles: S.cibles, mode: S.mode,
      onglet: document.querySelector('#plans .p-nom[aria-selected="true"]').textContent}));
    if (errs.length || st.cibles[0].item !== 'Modular Frame' || st.cibles[0].debit !== 4 || st.mode !== 'ressources' || !/Plan reçu|Shared plan/.test(st.onglet))
      echecs.push('lien partagé du planificateur : ' + JSON.stringify(st) + ' ' + errs.join(' | '));
    // relu une seconde fois : le même plan, pas un doublon
    await p.reload(); await p.waitForTimeout(500);
    const n = await p.evaluate(() => S.plans.length);
    if (n !== st.n) echecs.push(`lien partagé du planificateur : rechargé, ${n} plans (${st.n} attendus)`);
    console.log(`${echecs.some(x => x.startsWith('lien partagé')) ? 'ÉCHEC' : 'ok   '} planificateur : lien partagé`);
    await p.close();
  }

  // coquille (outils.html, en http) : un onglet de la barre montre l'outil dans un autre cadre, sans recharger la page ;
  // l'outil précédent garde son état ; l'adresse et le titre suivent ; « Précédent » revient au premier outil
  {
    const http = require('http'), fs = require('fs');
    const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp',
      '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png'};
    const srv = http.createServer((q, r) => {
      const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
      fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
        r.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); r.end(d); });
    });
    await new Promise(res => srv.listen(0, '127.0.0.1', res));
    const base = `http://127.0.0.1:${srv.address().port}/`, pb = [];
    const p = await b.newPage({viewport: {width: 1280, height: 800}});
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(base + 'outils.html#memo-ficsit.html');
    await p.evaluate(() => { window.__marque = 1; });
    // barre unique : celle de la coquille ; l'outil dans son cadre n'en a pas
    await p.waitForFunction(() => document.querySelector('iframe.actif'));
    const cadreDe = n => p.frames().find(f => f.parentFrame() && new URL(f.url()).pathname.endsWith('/' + n));   // pas la coquille (#memo-ficsit.html)
    const memoF0 = cadreDe('memo-ficsit.html');
    if (await memoF0.evaluate(() => !!document.getElementById('fdock'))) pb.push('barre de titre dans le cadre de l\'outil');
    try { await p.waitForFunction(() => /Mémo|Memo/i.test(document.querySelector('.fdock-id').textContent), null, {timeout: 5000}); }
    catch (e) { pb.push('barre : nom de l\'outil absent'); }
    if (await p.evaluate(() => document.getElementById('fjournal').hidden)) pb.push('barre : journal de l\'outil absent');
    await memoF0.evaluate(() => { window.__etat = 42; });
    await p.click('#fnav a[href="planner.html"]');
    await p.waitForSelector('iframe[data-outil="planner.html"]', {state: 'attached'});
    await p.waitForTimeout(600);
    const st = await p.evaluate(() => ({marque: window.__marque, hash: location.hash,
      vus: [...document.querySelectorAll('iframe')].filter(f => f.classList.contains('actif')).map(f => f.dataset.outil)}));
    if (await p.evaluate(() => [...document.querySelectorAll('iframe')].some(f => f.hasAttribute('title')))) pb.push('cadre avec un attribut title (bulle qui suit le curseur)');
    if (st.marque !== 1) pb.push('la coquille s\'est rechargée au changement d\'outil');
    if (!/^#planner\.html(\?p=|$)/.test(st.hash) || st.vus.join() !== 'planner.html') pb.push('outil affiché : ' + JSON.stringify(st));
    if (!/[Pp]lanif|[Pp]lanner/.test(await p.title())) pb.push('titre de la coquille : ' + await p.title());
    await p.goBack(); await p.waitForTimeout(300);
    const memoF = cadreDe('memo-ficsit.html');
    const vus = await p.evaluate(() => [...document.querySelectorAll('iframe')].filter(f => f.classList.contains('actif')).map(f => f.dataset.outil).join());
    if (vus !== 'memo-ficsit.html' || await memoF.evaluate(() => window.__etat) !== 42) pb.push('retour au mémo : cadre ' + vus + ', état perdu ?');
    // préchargement : tous les outils de l'accueil finissent ouverts en arrière-plan (liste = langue.json > outils + accueil)
    const attendus = ['index.html', ...require(path.join(ROOT, 'commun', 'langue.json')).outils.map(o => o.f)].sort().join();
    let ouverts = '';
    for (let k = 0; k < 60 && ouverts !== attendus; k++) {
      await p.waitForTimeout(500);
      ouverts = (await p.evaluate(() => [...document.querySelectorAll('iframe')].filter(f => f.dataset.pret).map(f => f.dataset.outil))).sort().join();
    }
    if (ouverts !== attendus) pb.push(`préchargement : ${ouverts} au lieu de ${attendus}`);
    if (errs.length) pb.push('erreurs JS : ' + errs.slice(0, 2).join(' | '));
    pb.forEach(x => echecs.push('coquille : ' + x));
    console.log(`${pb.length ? 'ÉCHEC' : 'ok   '} coquille (onglets sans rechargement)`);
    await p.close(); srv.close();
  }

  // téléphone : aucune page ne déborde horizontalement (320 et 390 px, chaque onglet de l'infographie ouvert)
  for (const page of [...new Set(Object.keys(PAGES).map(x => x.split('#')[0]))]) {
    for (const w of [320, 390]) {
      const p = await b.newPage({viewport: {width: w, height: 800}});
      await p.goto('file://' + path.join(ROOT, page));
      await p.waitForTimeout(400);
      const vues = await p.$('#tabC') ? ['#tabD', '#tabC', '#tabL'] : [null];
      const trop = [];
      for (const v of vues) {
        if (v) { await p.click(v); await p.waitForTimeout(150); }
        const sw = await p.evaluate(() => document.documentElement.scrollWidth);
        if (sw > w) trop.push(`${v || 'page'} : ${sw} px`);
      }
      if (trop.length) echecs.push(`${page} [${w} px] : débordement horizontal (${trop.join(', ')})`);
      console.log(`${trop.length ? 'ÉCHEC' : 'ok   '} ${page} [${w} px]`);
      await p.close();
    }
  }
  await b.close();
  if (echecs.length) { console.error('\n' + echecs.join('\n')); process.exit(1); }
})();
