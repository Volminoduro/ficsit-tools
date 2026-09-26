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
    const n = document.querySelectorAll('#out .card').length;
    return n ? [] : ['aucune cible pour plaques, vis et fil'];
  },
  'arbre-production.html': () => {
    const n = document.querySelectorAll('#rows tr').length, m = P.items.length;
    return n === m ? [] : [`${n} lignes dans le tableau pour ${m} items`];
  },
  'ficsit_horloge.html': () => {
    const n = document.querySelectorAll('#tbl tbody tr').length;
    return n ? [] : ['aucune répartition calculée'];
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
    setSynW({mw: 5, mat: 5, esp: 5}); setMode('mw');
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
    pb.forEach(x => echecs.push(`${page} : ${x}`));
    console.log(`${pb.length ? 'ÉCHEC' : 'ok   '} ${page} [vérifications]`);
    await p.close();
  }
  await b.close();
  if (echecs.length) { console.error('\n' + echecs.join('\n')); process.exit(1); }
})();
