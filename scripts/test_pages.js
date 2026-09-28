#!/usr/bin/env node
/* Test fumée des pages dans un vrai navigateur (Playwright + Chromium).
   Pour chaque page et chaque langue : aucune erreur JS, et aucun texte visible de l'autre langue
   (journal des révisions déroulé compris). Puis, une fois par page, des vérifications fonctionnelles
   (CHECKS) : des résultats attendus, pas seulement l'absence d'erreur.
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
};
/* Réglages pré-remplis pour que les pages rendent du contenu généré en JS. */
const PREFS = {
  'ficsit-tools:broyeur:v1': { sortMode: 'r', surplus: [['Iron Plate', 60], ['Screws', 240], ['Wire', 120]], tierCap: 9 },
};
/* Vérifications fonctionnelles, évaluées dans la page (accès à ses variables globales). Chacune renvoie
   la liste des anomalies, vide si tout va bien. */
const CHECKS = {
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
  'ficsit_horloge.html': () => {
    const n = document.querySelectorAll('#tbl tbody tr').length, out = n ? [] : ['aucune répartition calculée'];
    const bad = [...document.querySelectorAll('#picker .slot')].map(e => e.title).filter(t => /function|undefined|null/.test(t));
    if (bad.length) out.push('infobulle anormale : ' + bad[0]);
    if (DATA.buildings.length < 20) out.push(`${DATA.buildings.length} bâtiments seulement`);
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
  await b.close();
  if (echecs.length) { console.error('\n' + echecs.join('\n')); process.exit(1); }
})();
