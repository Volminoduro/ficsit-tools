#!/usr/bin/env node
/* Captures de référence : chaque page photographiée à 1280 et 390 px (haut de page, en français), plus le journal et
   « Ma partie » ouverts, comparées aux images de scripts/captures-reference/. Garde-fou des régressions visuelles.
   Rendu déterministe : police embarquée (commun/polices/), animations et transitions coupées, curseur de saisie
   masqué, navigateur neuf à chaque page (pas de réglage mémorisé).
   Comparaison dans le navigateur (canvas), sans dépendance de plus : un pixel diffère si un canal s'écarte de plus de
   SEUIL de lui et de ses huit voisins dans l'autre image, dans les deux sens (un décalage d'un pixel du lissage des
   lettres est ignoré) ; une capture échoue au-delà de TOLERANCE pixels différents. Les options de lancement fixent le
   rendu du texte : à version de Playwright égale (celle de la CI), deux machines donnent les mêmes images.
   En cas d'écart, scripts/captures-ecarts/ reçoit la nouvelle capture et une image des écarts (pixels différents en
   rouge sur la capture assombrie) ; la CI les joint au résultat de la vérification.
   Usage : node scripts/captures.js          compare (code de sortie 1 en cas d'écart)
           node scripts/captures.js --maj    réécrit les références (après un changement visuel voulu, à relire) */
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }

const ROOT = path.resolve(__dirname, '..');
const REF = path.join(__dirname, 'captures-reference');
const ECARTS = path.join(__dirname, 'captures-ecarts');
const MAJ = process.argv.includes('--maj');
const SEUIL = 8;           // écart par canal (0-255) au-delà duquel un pixel compte comme différent
const TOLERANCE = 20;      // pixels différents admis : le même navigateur rend au pixel près, la marge couvre un aléa

const PAGES = ['index.html', 'satisfactory_infographie.html', 'ficsit_horloge.html', 'broyeur-excedents.html',
  'arbre-production.html', 'memo-ficsit.html', 'depot-dimensionnel.html', 'energie-noeuds.html', 'charte.html',
  'planner.html'];
const LARGEURS = [[1280, 900], [390, 844]];
// états ouverts des éléments communs, sur une page
const ETATS = {
  'journal': ['ficsit_horloge.html', p => p.click('.pn-btn')],
  'ma-partie': ['ficsit_horloge.html', p => p.click('#fpartie')],
};
const FIGER = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';

async function photo(b, page, [w, h], action) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('file://' + path.join(ROOT, page), { waitUntil: 'load' });
  await p.addStyleTag({ content: FIGER });
  if (action) await action(p);
  await p.evaluate(() => document.fonts.ready);
  // images visibles chargées (celles en chargement différé hors écran ne viendront pas) ; 5 s au plus
  await p.evaluate(() => Promise.race([new Promise(r => setTimeout(r, 5000)),
    Promise.all([...document.images].filter(i => i.getBoundingClientRect().top < innerHeight)
      .map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))]));
  await p.waitForTimeout(300);
  const png = await p.screenshot();
  await ctx.close();
  return png;
}

// part de pixels différents, et image des écarts
async function comparer(b, a, n) {
  const p = await b.newPage();
  const r = await p.evaluate(async ([a, n, seuil]) => {
    const charger = s => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = 'data:image/png;base64,' + s; });
    const [ia, ib] = await Promise.all([charger(a), charger(n)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { n: Infinity, part: 1, taille: true };
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
    const x = c.getContext('2d');
    x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
    x.drawImage(ib, 0, 0); const img = x.getImageData(0, 0, c.width, c.height), db = img.data;
    // un pixel ne diffère que si aucun voisin (3 × 3) ne lui ressemble, dans un sens comme dans l'autre (pixel de la
    // capture face aux voisins de la référence, et inversement) : un décalage d'un pixel du lissage des lettres est
    // ignoré, une lettre, un trait ou une couleur ajoutés comme retirés sont vus
    const W = c.width, H = c.height;
    const proche = (p, q, x, y) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const i = (y * W + x) * 4, j = (yy * W + xx) * 4;
        if (Math.max(Math.abs(p[i] - q[j]), Math.abs(p[i + 1] - q[j + 1]), Math.abs(p[i + 2] - q[j + 2])) <= seuil) return true;
      }
      return false;
    };
    const nb = Uint8ClampedArray.from(db);
    let k = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const d = !proche(nb, da, x, y) || !proche(da, nb, x, y);
      if (d) { k++; db[i] = 255; db[i + 1] = 0; db[i + 2] = 0; }
      else { db[i] *= .35; db[i + 1] *= .35; db[i + 2] *= .35; }
    }
    x.putImageData(img, 0, 0);
    return { n: k, part: k / (da.length / 4), ecarts: c.toDataURL('image/png').split(',')[1] };
  }, [a.toString('base64'), n.toString('base64'), SEUIL]);
  await p.close();
  return r;
}

(async () => {
  // rendu du texte fixé : sans ces options, l'ajustement (hinting) suit la configuration de la machine et change les
  // largeurs de texte, donc les retours à la ligne, d'un poste à l'autre
  const b = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--disable-font-subpixel-positioning'] });
  const travaux = [];
  for (const page of PAGES) for (const t of LARGEURS) travaux.push([`${page.replace('.html', '')}-${t[0]}`, page, t, null]);
  for (const [nom, [page, action]] of Object.entries(ETATS)) travaux.push([`${nom}-1280`, page, LARGEURS[0], action]);

  fs.mkdirSync(REF, { recursive: true });
  fs.rmSync(ECARTS, { recursive: true, force: true });
  const echecs = [];
  for (const [nom, page, taille, action] of travaux) {
    const png = await photo(b, page, taille, action);
    const fref = path.join(REF, nom + '.png');
    if (MAJ || !fs.existsSync(fref)) {
      fs.writeFileSync(fref, png);
      console.log(`${MAJ ? 'écrite' : 'nouvelle'} ${nom}`);
      continue;
    }
    const r = await comparer(b, fs.readFileSync(fref), png);
    const pc = `${r.n} px, ${(r.part * 100).toFixed(3).replace('.', ',')} %`;
    if (r.n > TOLERANCE) {
      fs.mkdirSync(ECARTS, { recursive: true });
      fs.writeFileSync(path.join(ECARTS, nom + '.png'), png);
      if (r.ecarts) fs.writeFileSync(path.join(ECARTS, nom + '-ecarts.png'), Buffer.from(r.ecarts, 'base64'));
      echecs.push(`${nom} : ${r.taille ? 'taille différente' : pc + ' de pixels différents'}`);
      console.log(`ÉCART ${nom} (${r.taille ? 'taille' : pc})`);
    } else console.log(`ok    ${nom} (${pc})`);
  }
  await b.close();
  if (echecs.length) {
    console.error(`\n${echecs.length} capture(s) différente(s) de la référence :\n  ${echecs.join('\n  ')}\n` +
      `Images dans scripts/captures-ecarts/. Changement voulu : node scripts/captures.js --maj, relire les images, committer.`);
    process.exit(1);
  }
})();
