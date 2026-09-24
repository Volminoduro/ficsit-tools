#!/usr/bin/env node
/* Test fumée des pages dans un vrai navigateur (Playwright + Chromium).
   Pour chaque page et chaque langue : aucune erreur JS, et aucun texte visible de l'autre langue
   (journal des révisions déroulé compris).
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
  // Synthèse : curseurs, classement face à la base et combinaisons recalculées dans la page
  'satisfactory_infographie.html#syn': p => p.evaluate(() => {
    document.getElementById('mSYN').click(); document.getElementById('expAll').click(); document.getElementById('expAllC').click(); }),
  'broyeur-excedents.html': null,
  'arbre-production.html': null,
};
/* Réglages pré-remplis pour que les pages rendent du contenu généré en JS. */
const PREFS = {
  'ficsit-tools:broyeur:v1': { sortMode: 'r', surplus: [['Iron Plate', 60], ['Screws', 240], ['Wire', 120]],
    noRaw: false, rawSel: '0', tierSel: '99' },
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
  await b.close();
  if (echecs.length) { console.error('\n' + echecs.join('\n')); process.exit(1); }
})();
