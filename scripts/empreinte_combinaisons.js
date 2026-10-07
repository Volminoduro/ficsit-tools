#!/usr/bin/env node
/* Empreinte des combinaisons précalculées de satisfactory_infographie.html : « entrée:sortie » sur une ligne.
   Usage : node scripts/empreinte_combinaisons.js satisfactory_infographie.html [script.js]
   - entrée : ce dont dépend le calcul de scripts/paliers_combinaisons.js, hors résultat — le payload privé des clés
     qu'il écrit (combi, combiM, combiE, combiS, tc), les blocs MOTEUR et PALIERS de la page (mêmes marqueurs que le
     script) et le script lui-même (2e argument, par défaut celui du dépôt) ;
   - sortie : les clés que le script écrit.
   La CI (combinaisons.yml) compare l'empreinte de la page à celle de la base de la PR : même entrée et même sortie,
   donc le recalcul de ~15 min ne peut rien changer, il est sauté. Un changement d'interface (CSS, texte, onglets)
   laisse les deux inchangées ; une recette, un palier, le moteur ou une combinaison modifiés à la main, non. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = fs.readFileSync(process.argv[3] || path.join(__dirname, 'paliers_combinaisons.js'), 'utf8');
const P = JSON.parse(html.match(/<script id="payload" type="application\/json">([\s\S]*?)<\/script>/)[1]);
// code de la page : satisfactory_infographie.js à côté du HTML, sinon (ancienne version) dans un <script> du HTML
const jsFichier = process.argv[2].replace(/\.html$/, '.js');
const js = fs.existsSync(jsFichier) ? fs.readFileSync(jsFichier, 'utf8') : html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
const bloc = (a, b) => {
  const i = js.indexOf(a), j = js.indexOf(b);
  if (i < 0 || j < i) { console.error('marqueurs', a, '/', b, 'introuvables dans', process.argv[2]); process.exit(1); }
  return js.slice(i, j);
};
const ECRITES = ['combi', 'combiM', 'combiE', 'combiS', 'tc'];
const entree = {}, sortie = {};
for (const k of Object.keys(P)) (ECRITES.includes(k) ? sortie : entree)[k] = P[k];
const h = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
console.log(h(JSON.stringify(entree) + bloc('/* MOTEUR:START', '/* MOTEUR:END */') + bloc('/* PALIERS:START', '/* PALIERS:END */') + script) + ':' + h(JSON.stringify(sortie)));
