const P = JSON.parse(document.getElementById('payload').textContent);
const D = P.d, IC = P.ic, L = Math.log10;

/* ---------- mémoire des réglages (localStorage, par navigateur) ---------- */
const PREFS_KEY = 'ficsit-tools:infographie:v1';
const PREFS = (()=>{ try{ return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; }catch(e){ return {}; } })();
let prefsReady = false, curTab = 'tabD';
function savePrefs(){
  if(!prefsReady) return;
  try{ localStorage.setItem(PREFS_KEY, JSON.stringify({
    mode, cap, picked, onlyBetter, tab: curTab, filt, sort, synW, partie: !!FILTRE, panneau: panneauOuvert, partieLu,
    tierSel: document.getElementById('tierSel').value,
    q: document.getElementById('q').value,
    openGrp: [...openGrp], openCb: [...openCb], openRows: [...openRows],
    seqPick, seqRate })); }catch(e){}
}

/* ---------- mode de comparaison ---------- */
let mode = 'mw';
const IDX  = r => (mode==='syn' ? synIdx(r) : idxOf(r, mode)).i;
/* gain sur la meilleure recette de base : réservé aux alternatives (une recette de base n'a pas de « base ») */
const GAIN = r => (!r.a || !stdOf(r.p)) ? null : (mode==='syn' ? synIdx(r) : idxOf(r, mode)).g;
const CBS  = () => combiSet().rows;
const CHS  = () => combiSet().chains;
const FRQ  = () => combiSet().freq;
const SYM  = () => ({mw:'I', mat:'M', esp:'E', syn:'S'})[mode];

const TXT = () => ({
  fr: {
    mw: {
      h1:'en mégawatts',
      lede:'232 recettes de Satisfactory 1.0 — 131 de base, 101 alternatives — classées par '
        +'<b>unités produites par minute et par MW consommé sur toute la chaîne</b>, extraction du minerai comprise.',
      formula:'<b>Indice I = (sortie/min) ÷ (MW totaux)</b><br>'
        +'coût(X) = P<sub>machine</sub> ÷ débit<sub>X</sub> + Σ (débit<sub>ingrédient</sub> ÷ débit<sub>X</sub>) × coût(ingrédient) &nbsp;→&nbsp; I = 1 ÷ coût.<br>'
        +'Machines à 100 %, sans surcadençage ni Somersloop. Extraction comptée : '+BT('Miner Mk.2')+' sur nœud normal, 0,125 MW par u/min.',
      limits:[
        "Le minerai n'est compté que par l'énergie qu'il coûte à extraire — 0,125 MW par unité/min, le même tarif pour tous les solides. L'onglet Matière donne l'autre axe.",
        "Les entrées ramassées à la main — feuilles, bois, restes d'aliens — sont facturées 0 MW, ce qui propulse les recettes de biomasse en haut du spectre.",
        "Coproduits : la puissance de la machine est répartie entre les sorties au prorata des quantités ; les ingrédients sont facturés en entier à la sortie utilisée, estimation prudente qui ne suppose pas que l'autre sortie sert ailleurs.",
        "Trois alternatives nucléaires sont hors modèle : elles consomment des déchets d'uranium, sous-produit d'un générateur et non d'une recette.",
        `Les recettes du ${BT('Converter')} qui fabriquent du minerai brut sont exclues : leur produit est déjà tarifé à l'extraction.`,
        `Avec un palier imposé, l'indice d'une recette isolée ne change pas : il reste calculé avec les recettes de base en amont. Deux recettes en dépendent d'une base pas encore débloquée : ${IT_('SAM Fluctuator')} avant le palier 3 (${IT_('Steel Pipe')}) et ${IT_('Ionized Fuel')} au palier 7 (${IT_('Rocket Fuel')}). Les combinaisons, elles, sont recalculées avec les seules recettes jouables.`
      ]
    },
    mat: {
      h1:'en minerai',
      lede:'Les mêmes recettes, jugées cette fois sur la <b>matière première</b> : unités produites par minute '
        +'par unité de ressource brute finie consommée sur toute la chaîne. L\'électricité n\'entre pas dans ce calcul.',
      formula:'<b>Indice M = (sortie/min) ÷ (ressources brutes consommées)</b><br>'
        +'Chaque unité de minerai, de pétrole, d\'azote, de SAM ou d\'uranium compte pour 1. '
        +'L\'eau est gratuite : elle est illimitée et ne coûte que de l\'énergie, or l\'énergie est ignorée ici.<br>'
        +'La puissance des machines vaut zéro : une recette qui ajoute une '+BT('Refinery').toLowerCase()+' pour économiser du minerai gagne.',
      limits:[
        "Toutes les ressources pèsent pareil : une unité de bauxite vaut une unité de fer, alors que les nœuds ne sont ni aussi nombreux ni aussi accessibles. Une pondération par rareté déplacerait le classement.",
        `L'eau est gratuite ici. Les recettes de dilution — lingots purs, béton mouillé, ${IT_('Diluted Fuel')} — en profitent pleinement, ce qui est cohérent tant qu'on ne regarde pas la facture électrique.`,
        "Les recettes dont toutes les entrées sont ramassées à la main n'ont pas d'indice : elles ne consomment aucune ressource extraite.",
        "Coproduits : les ingrédients sont facturés en entier à la sortie utilisée, estimation prudente qui ne suppose pas que l'autre sortie sert ailleurs.",
        `Les mêmes exclusions qu'en énergie : alternatives nucléaires à base de déchets, recettes du ${BT('Converter')} produisant du minerai brut.`,
        "Avec un palier imposé, l'indice d'une recette isolée ne change pas ; seules les combinaisons sont recalculées avec les recettes jouables."
      ]
    },
    esp: {
      h1:'en mètres carrés',
      lede:'Les mêmes recettes, jugées sur la <b>place au sol</b> : unités produites par minute par m² occupé '
        +'par les machines et l\'extraction de toute la chaîne, chacune surcadencée à fond (250 %, trois éclats de charge).',
      formula:'<b>Indice E = (sortie/min) ÷ (m² au sol)</b><br>'
        +'coût(X) = emprise<sub>machine</sub> ÷ (2,5 × débit<sub>X</sub>) + Σ (débit<sub>ingrédient</sub> ÷ débit<sub>X</sub>) × coût(ingrédient) &nbsp;→&nbsp; E = 1 ÷ coût.<br>'
        +'Machines et extraction à 250 %, sans Somersloop. Extraction : '+BT('Miner Mk.3')+' sur nœud normal (84 m², 600 u/min), '
        +'extracteurs d\'eau et de pétrole, puits d\'azote. Convoyeurs, séparateurs et allées ne sont pas comptés.',
      limits:[
        "L'emprise est la surface au sol de chaque bâtiment (largeur × longueur), reprise du wiki officiel car absente des données du jeu. L'azote est compté sur l'ensemble des puits du monde (pressuriseurs et extracteurs). Convoyeurs, séparateurs, fusionneurs et passages ne sont pas comptés : une usine réelle occupe davantage, d'autant plus qu'elle a de machines.",
        "Tout est surcadencé à 250 %, extraction comprise : le classement serait le même à 100 %, seules les valeurs sont multipliées par 2,5. Les éclats de charge et l'électricité supplémentaire ne sont pas comptés.",
        "L'extracteur d'eau est volumineux (390 m² pour 300 m³/min) : les recettes gourmandes en eau reculent, à l'inverse du mode Matière.",
        "Les entrées ramassées à la main — feuilles, bois, restes d'aliens — occupent 0 m², ce qui avantage les recettes de biomasse comme en énergie.",
        "Coproduits : l'emprise de la machine est répartie entre les sorties au prorata des quantités ; les ingrédients sont facturés en entier à la sortie utilisée.",
        `Les mêmes exclusions qu'en énergie : alternatives nucléaires à base de déchets, recettes du ${BT('Converter')} produisant du minerai brut.`,
        "Avec un palier imposé, l'indice d'une recette isolée ne change pas ; seules les combinaisons sont recalculées avec les recettes jouables."
      ]
    },
    syn: {
      h1:'tout compris',
      lede:'Les mêmes recettes, jugées sur les <b>trois critères à la fois</b> : énergie, matière et place au sol. '
        +'Chacun est converti en MW-équivalents puis pondéré selon les curseurs ; l\'indice S est la sortie par MW-équivalent.',
      formula:()=>{ const T = synTaux(), w = synPoids();
        return '<b>Indice S = (sortie/min) ÷ coût composite</b><br>'
        +`coût = ${pc(w.mw)} × MW + ${pc(w.mat)} × ${nf(T.mat)} × ressources brutes + ${pc(w.esp)} × ${nf(T.esp)} × m² &nbsp;→&nbsp; S = 1 ÷ coût.<br>`
        +`Taux de change médians entre critères, sur les recettes : une unité de ressource brute par minute « vaut » ${nf(T.mat)} MW, un m² au sol ${nf(T.esp)} MW. `
        +'Énergie à 100 %, matière sans l\'eau, espace à 250 % : chaque critère garde son propre modèle. '
        +'Face à la base, chaque alternative est classée <b>gagnante</b> (meilleure ou égale sur les trois critères), <b>compromis</b> ou <b>perdante</b> (pire ou égale sur les trois).'; },
      limits:[
        "Les taux de change sont des médianes : ils rendent les trois critères comparables en moyenne, pas pour chaque recette. Poser un poids à 100 % redonne exactement le classement du critère seul.",
        "Chaque critère garde son propre scénario (énergie à 100 %, espace surcadencé à 250 %) : la synthèse additionne des coûts, elle ne décrit pas une usine unique.",
        "Le classement gagnante / compromis / perdante ne dépend pas des poids : il ne compare que les signes des trois gains.",
        "Les combinaisons suivent les curseurs : la page les recalcule elle-même, par la même recherche exacte. Seuls la pire chaîne et le nombre de chaînes distinctes, qui demandent une énumération complète, ne sont donnés qu'à poids égaux.",
        `Les mêmes exclusions qu'en énergie : alternatives nucléaires à base de déchets, recettes du ${BT('Converter')} produisant du minerai brut.`
      ]
    }
  },
  en: {
    mw: {
      h1:'in megawatts',
      lede:'232 Satisfactory 1.0 recipes — 131 standard, 101 alternates — ranked by '
        +'<b>units produced per minute per MW consumed across the whole chain</b>, ore extraction included.',
      formula:'<b>Index I = (output/min) ÷ (total MW)</b><br>'
        +'cost(X) = P<sub>machine</sub> ÷ rate<sub>X</sub> + Σ (rate<sub>ingredient</sub> ÷ rate<sub>X</sub>) × cost(ingredient) &nbsp;→&nbsp; I = 1 ÷ cost.<br>'
        +'Machines at 100%, no overclocking or Somersloop. Extraction counted: Miner Mk.2 on a normal node, 0.125 MW per unit/min.',
      limits:[
        "Ore is only counted by the energy it takes to extract — 0.125 MW per unit/min, the same rate for every solid. The Materials tab gives the other axis.",
        "Hand-gathered inputs — leaves, wood, alien remains — are billed at 0 MW, which pushes biomass recipes to the top of the spectrum.",
        "Co-products: machine power is split between the outputs in proportion to the quantities; ingredients are billed in full to the output used, a cautious estimate that does not assume the other output is used elsewhere.",
        "Three nuclear alternates are out of the model: they consume uranium waste, a byproduct of a generator rather than of a recipe.",
        "Converter recipes that make raw ore are excluded: their product is already priced at extraction.",
        "With a tier cap, the index of an isolated recipe does not change: it is still computed with the standard recipes upstream. Two recipes depend on a standard recipe not yet unlocked: SAM Fluctuator before tier 3 (Steel Pipe) and Ionized Fuel at tier 7 (Rocket Fuel). Combinations, however, are recomputed with playable recipes only."
      ]
    },
    mat: {
      h1:'in ore',
      lede:'The same recipes, judged this time on <b>raw materials</b>: units produced per minute '
        +'per unit of finite raw resource consumed across the whole chain. Electricity does not enter this calculation.',
      formula:'<b>Index M = (output/min) ÷ (raw resources consumed)</b><br>'
        +'Each unit of ore, crude oil, nitrogen, SAM or uranium counts as 1. '
        +'Water is free: it is unlimited and only costs energy, and energy is ignored here.<br>'
        +'Machine power counts as zero: a recipe that adds a refinery to save ore wins.',
      limits:[
        "Every resource weighs the same: a unit of bauxite is worth a unit of iron, even though nodes are neither as numerous nor as accessible. Weighting by scarcity would shift the ranking.",
        "Water is free here. Dilution recipes — pure ingots, wet concrete, Diluted Fuel — benefit fully, which holds as long as you ignore the power bill.",
        "Recipes whose inputs are all hand-gathered have no index: they consume no extracted resource.",
        "Co-products: ingredients are billed in full to the output used, a cautious estimate that does not assume the other output is used elsewhere.",
        "The same exclusions as for energy: waste-based nuclear alternates, Converter recipes producing raw ore.",
        "With a tier cap, the index of an isolated recipe does not change; only combinations are recomputed with playable recipes."
      ]
    },
    esp: {
      h1:'in square metres',
      lede:'The same recipes, judged on <b>floor space</b>: units produced per minute per m² taken up '
        +'by the machines and extraction of the whole chain, each overclocked to the max (250%, three power shards).',
      formula:'<b>Index E = (output/min) ÷ (floor m²)</b><br>'
        +'cost(X) = footprint<sub>machine</sub> ÷ (2.5 × rate<sub>X</sub>) + Σ (rate<sub>ingredient</sub> ÷ rate<sub>X</sub>) × cost(ingredient) &nbsp;→&nbsp; E = 1 ÷ cost.<br>'
        +'Machines and extraction at 250%, no Somersloop. Extraction: Miner Mk.3 on a normal node (84 m², 600 units/min), '
        +'water and oil extractors, nitrogen wells. Belts, splitters and walkways are not counted.',
      limits:[
        "The footprint is each building's floor area (width × length), taken from the official wiki since the game data lacks it. Nitrogen is counted over all the world's wells (pressurizers and extractors). Belts, splitters, mergers and walkways are not counted: a real factory takes more room, all the more so with many machines.",
        "Everything is overclocked to 250%, extraction included: the ranking would be the same at 100%, only the values are multiplied by 2.5. Power shards and the extra electricity are not counted.",
        "The Water Extractor is bulky (390 m² for 300 m³/min): water-hungry recipes drop back, the opposite of the Materials mode.",
        "Hand-gathered inputs — leaves, wood, alien remains — take 0 m², which favours biomass recipes as in the Energy mode.",
        "Co-products: the machine footprint is split between the outputs in proportion to the quantities; ingredients are billed in full to the output used.",
        "The same exclusions as for energy: waste-based nuclear alternates, Converter recipes producing raw ore.",
        "With a tier cap, the index of an isolated recipe does not change; only combinations are recomputed with playable recipes."
      ]
    },
    syn: {
      h1:'all in',
      lede:'The same recipes, judged on <b>all three criteria at once</b>: energy, materials and floor space. '
        +'Each is converted into MW-equivalents and weighted by the sliders; the S index is output per MW-equivalent.',
      formula:()=>{ const T = synTaux(), w = synPoids();
        return '<b>Index S = (output/min) ÷ composite cost</b><br>'
        +`cost = ${pc(w.mw)} × MW + ${pc(w.mat)} × ${nf(T.mat)} × raw resources + ${pc(w.esp)} × ${nf(T.esp)} × m² &nbsp;→&nbsp; S = 1 ÷ cost.<br>`
        +`Median exchange rates between criteria, over the recipes: one unit of raw resource per minute is "worth" ${nf(T.mat)} MW, one m² of floor ${nf(T.esp)} MW. `
        +'Energy at 100%, materials without water, space at 250%: each criterion keeps its own model. '
        +'Against the standard recipe, each alternate is rated <b>winning</b> (better or equal on all three criteria), <b>trade-off</b> or <b>losing</b> (worse or equal on all three).'; },
      limits:[
        "The exchange rates are medians: they make the three criteria comparable on average, not for every recipe. Setting one weight to 100% gives back exactly that criterion's ranking.",
        "Each criterion keeps its own scenario (energy at 100%, space overclocked to 250%): the synthesis adds up costs, it does not describe a single factory.",
        "The winning / trade-off / losing rating does not depend on the weights: it only compares the signs of the three gains.",
        "Combinations follow the sliders: the page recomputes them itself, with the same exact search. Only the worst chain and the number of distinct chains, which need a full enumeration, are given at equal weights only.",
        "The same exclusions as for energy: waste-based nuclear alternates, Converter recipes producing raw ore."
      ]
    }
  }
})[lang][mode];

const esc = s => String(s).replace(/"/g,'&quot;');
/* icônes : fichiers partagés entre outils, commun/icones-44/<slug>.webp (IC : nom → slug, écrit par payloads.py) */
const icoSrc = n => `commun/icones-44/${IC[n]}.webp`;
const ico = (n,c) => IC[n] ? `<img class="ic ${c||''}" alt="" title="${esc(IT_(n))}" loading="lazy" src="${icoSrc(n)}">` : '';
const dec = x => lang==='fr' ? x.replace('.', ',') : x;
const nf = v => { if(v == null) return '—';
  const s = String(v);
  if(s.length <= 9 && !s.includes('e')) return dec(s);
  return dec(String(+v.toPrecision(6))); };
const pct = v => dec(String(+v.toFixed(1)));
const pc = v => dec(String(Math.round(v*100))) + ' %';
const sp = n => FicsitLang.num(n);
const fmtBig = n => typeof n === 'string' ? tr('plus de ', 'more than ') + sp(+n.replace(/[^0-9]/g,'')) : sp(n);
const fmtHuge = n => { if(n < 1e9) return sp(n);
  const e = Math.floor(L(n)), m = dec((n/Math.pow(10,e)).toFixed(1));
  return `${m} × 10${String(e).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('')}`; };
let lang = FicsitLang.lang;
const tr = (fr, en) => lang==='fr' ? fr : en;
const SRC_ = {fr:{jalon:'jalon', mam:'MAM', dd:'disque dur'}, en:{jalon:'milestone', mam:'MAM', dd:'hard drive'}};
const SRC = new Proxy({}, {get:(_, k)=>SRC_[lang][k]});
const IT_ = n => FicsitLang.item(n);
const RC_ = n => FicsitLang.recette(n);
const BT = n => FicsitLang.batiment(n);
const RI = {}; D.forEach(r=>{ RI[r.n] = r.p; });
const icoR = (n,c) => ico(RI[n] || n, c || 'sm');
const stdOf = p => D.filter(x=>x.p===p && !x.a && isAvail(x)).sort((x,y)=>(IDX(y)||0)-(IDX(x)||0))[0];
/* PALIERS:START — disponibilité par palier, reprise telle quelle par scripts/paliers_combinaisons.js */
/* ---------- paliers ----------
   Une recette est jouable au palier atteint si elle est débloquée à ce palier ou avant ET si chacun de
   ses ingrédients est produisible avec des recettes elles-mêmes jouables (point fixe). */
const TMAX = Math.max(...D.map(r=>r.t));
let cap = TMAX;
/* FILTRE : recettes permises (« ma partie ») — null = toutes, sinon l'ensemble des classes débloquées dans la
   sauvegarde (commun/ficsit-partie.js). availKey distingue les caches filtrés. */
let FILTRE = null, FILTRE_N = 0;   // FILTRE_N : numéro de l'import, pour ne pas resservir les caches d'un précédent
const availKey = c => c + (FILTRE ? 'p' + FILTRE_N : '');
const availCache = {};
function availFor(c){
  const key = availKey(c);
  if(key in availCache) return availCache[key];
  const items = new Set(), rec = new Set();
  let ch = true;
  while(ch){ ch = false;
    for(const r of D){
      if(rec.has(r) || r.t > c || (FILTRE && !FILTRE.has(r.k))) continue;
      if(r.ig.every(g=>isRaw(g[0]) || items.has(g[0]))){
        rec.add(r); ch = true; items.add(r.p); r.by.forEach(b=>items.add(b[0])); }
    }
  }
  return availCache[key] = {rec, items};
}
const isAvail = r => availFor(cap).rec.has(r);
const filtered = () => cap < TMAX;
/* PALIERS:END */
/* libellé long d'un palier : mots propres à l'outil + noms du jeu tirés du glossaire commun */
const TIER_LB = {0:[['Départ','Onboarding'], 'b:Constructor', 'b:Smelter'], 1:[['Premières alternatives de disque dur','First hard-drive alternates']],
  2:['b:Assembler', 'i:Concrete'], 3:[['Acier','Steel'], 'b:Foundry'], 4:[['Moteurs','Motors'], 'i:Encased Industrial Beam'],
  5:['b:Refinery', ['pétrole','oil']], 6:[['Ordinateurs','Computers'], 'b:Manufacturer'], 7:[['Aluminium','Aluminum'], 'b:Blender'],
  8:[['Nucléaire','Nuclear'], 'b:Particle Accelerator'], 9:[['Quantique','Quantum'], 'b:Converter', 'b:Quantum Encoder']};
const tierLabel = t => (TIER_LB[t] || []).map(x => Array.isArray(x) ? tr(x[0], x[1])
  : x[0]==='b' ? BT(x.slice(2)) : IT_(x.slice(2))).join(', ');
const icoRaw = n => IC[n] ? `<img class="ic" alt="" src="${icoSrc(n)}">` : '';
function renderTierPick(){
  // grille commune (commun/ficsit-paliers.js) : tous les paliers cliquables ; retoucher le palier choisi lève le filtre
  FicsitPaliers.grille(document.getElementById('tierPick'), {max: TMAX, sel: cap, ico: icoRaw,
    presse: t=>filtered() && t===cap, titre: t=>`${tr('Palier','Tier')} ${t} — ${tierLabel(t)}`,
    clic: t=>setCap(filtered() && t===cap ? TMAX : t)});
  const av = availFor(cap).rec, ok = D.filter(r=>av.has(r));
  const blocked = D.filter(r=>r.t<=cap && !av.has(r)), s = blocked.length>1 ? 's' : '';
  document.getElementById('tierNote').innerHTML = filtered()
    ? tr(`Palier <b>${cap}</b> atteint : <b>${ok.length}</b> recettes jouables sur ${D.length}, dont
       ${ok.filter(r=>r.a).length} alternatives. Tout ce qui vient après est masqué dans le spectre, les
       statistiques et les trois onglets ; les combinaisons sont recalculées avec ces seules recettes.`,
       `Tier <b>${cap}</b> reached: <b>${ok.length}</b> playable recipes out of ${D.length}, including
       ${ok.filter(r=>r.a).length} alternates. Everything that comes later is hidden from the spectrum, the
       statistics and all three tabs; combinations are recomputed with these recipes only.`)
      + (blocked.length ? tr(` ${blocked.length} recette${s} de ce palier écartée${s} : un de leurs ingrédients
       n'est produisible qu'au palier suivant (${blocked.map(r=>RC_(r.n)).join(', ')}).`,
       ` ${blocked.length} recipe${s} from this tier set aside: one of their ingredients
       can only be produced at the next tier (${blocked.map(r=>RC_(r.n)).join(', ')}).`) : '')
      + ` <a id="tierReset" role="button" tabindex="0">${tr('Tout afficher','Show all')}</a>`
    : tr(`Aucun palier imposé : les ${D.length} recettes sont affichées. Touchez le palier que vous avez
       atteint pour masquer tout ce qui se débloque après — recettes, alternatives et combinaisons.`,
       `No tier cap: all ${D.length} recipes are shown. Tap the tier you have reached
       to hide everything unlocked after it — recipes, alternates and combinations.`);
  const rs = document.getElementById('tierReset');
  if(rs){ rs.addEventListener('click', ()=>setCap(TMAX));
    rs.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setCap(TMAX); } }); }
}
function setCap(c){ cap = c; buildUsedIn(); renderTierPick(); renderAll(); }
/* Combinaisons : calculées ici, pour le critère et le palier affichés (tcRows, recherche exacte : moins d'un
   dixième de seconde pour toutes les cibles), mises en cache. Seule exception, précalculée hors ligne (P.tc) : la
   matière, où l'eau et les recettes sans coût machine multiplient les chaînes à égalité (jusqu'à 30 s aux paliers
   8 et 9). Sans palier imposé, on garde du registre précalculé (P.combi…, scripts/paliers_combinaisons.js) la pire
   chaîne et le nombre de chaînes distinctes, obtenus par énumération complète. */
const combiCache = {};
function combiSet(){
  const key = mode + '|' + availKey(cap) + (mode==='syn' ? '|' + SYN_K.map(k=>SYN_WC[k]).join(',') : '');
  if(combiCache[key]) return combiCache[key];
  const reg = mode==='syn' && !synDefaut() ? [] : ({mw: P.combi, mat: P.combiM, esp: P.combiE, syn: P.combiS})[mode] || [];
  const rows = [], chains = {}, cnt = {};
  // précalcul (matière) : seulement sans filtre de partie ; avec, la matière se calcule ici à budget réduit
  // (quelques secondes au pire, podium non prouvé optimal signalé comme tel)
  const pre = !FILTRE && P.tc && P.tc[mode] && P.tc[mode][cap];
  let rowsT = pre;
  if(!rowsT){
    const court = FILTRE && mode==='mat', lb0 = LB_BUDGET;
    if(court) LB_BUDGET = 2000;
    rowsT = tcRows(mode, cap, court ? 3e4 : 3e6);
    LB_BUDGET = lb0;
  }
  rowsT.forEach(x=>{
    const r0 = !filtered() && !FILTRE ? reg.find(c=>c.cible===x.c) : null, opt = x.top[0][1];
    rows.push({cible:x.c, idx_defaut:x.d, idx_optimal:x.o, gain_pct: x.d ? x.o/x.d*100-100 : null,
      idx_pire: r0 ? r0.idx_pire : null, nb_chaines: r0 ? r0.nb_chaines : null,
      combinaisons_brutes: x.n, nb_alternatives_optimales: opt.length, alternatives_optimales: opt.join(' | ')});
    chains[x.c] = {top: x.top, exact: x.x};
    opt.forEach(a=>{ cnt[a] = (cnt[a]||0) + 1; });
  });
  const freq = Object.entries(cnt).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
  return combiCache[key] = {rows, chains, freq};
}


/* ---------- spectre ---------- */
function renderSpectrum(){
  const vals = D.map(IDX).filter(v=>v>0);
  const lo = L(Math.min(...vals)), hi = L(Math.max(...vals));
  const pos = v => (L(v)-lo)/(hi-lo)*100;
  const band = (el, rows) => { el.innerHTML = rows.filter(r=>IDX(r)>0).map(r =>
    `<b class="tick" style="left:${pos(IDX(r)).toFixed(2)}%;height:36px" data-n="${esc(r.n)}"
      data-p="${esc(r.p)}" data-i="${nf(IDX(r))}" data-t="${r.t}"></b>`).join(''); };
  band(document.getElementById('bandA'), D.filter(r=>r.a && isAvail(r)));
  band(document.getElementById('bandS'), D.filter(r=>!r.a && isAvail(r)));
  const ticks = [];
  for(let e = Math.ceil(lo); e <= Math.floor(hi); e++) ticks.push(Math.pow(10, e));
  document.getElementById('axis').innerHTML = ticks.map(v=>
    `<span style="left:${pos(v).toFixed(2)}%">${v < 1 ? dec(String(v)) : sp(v)}</span>`).join('');
  const ro = document.getElementById('readout');
  document.querySelectorAll('.tick').forEach(t=>{
    const show = ()=>{ ro.dataset.n = t.dataset.n; ro.innerHTML = `${ico(t.dataset.p)}<b>${RC_(t.dataset.n)}</b> — ${IT_(t.dataset.p)} · tier ${t.dataset.t} · ${SYM()} = ${t.dataset.i}`; };
    t.addEventListener('mouseenter', show); t.addEventListener('click', show);
  });
}

/* ---------- textes et statistiques ---------- */
function renderStats(){
  const gs = buildGroups().map(g=>g.g).filter(v=>v!=null).sort((a,b)=>a-b);
  const vals = D.filter(isAvail).map(IDX).filter(v=>v>0);
  const med = gs.length ? Math.round(gs[Math.floor(gs.length/2)]) : null;
  const pa = {dom: 0, mix: 0, sub: 0};
  if(mode==='syn') D.filter(r=>r.a && isAvail(r)).forEach(r=>{ const k = pareto(r); if(k) pa[k]++; });
  document.getElementById('stats').innerHTML = (mode==='syn' ? [
    [med==null ? '—' : (med>=0?'+':'') + med + ' %', tr('gain médian sur la recette de base','median gain over the standard recipe')],
    [pa.dom, tr('alternatives gagnantes sur les trois critères','alternates winning on all three criteria')],
    [pa.mix, tr('compromis : meilleures ici, pires là','trade-offs: better here, worse there')],
    [pa.sub, tr('alternatives perdantes sur les trois','alternates losing on all three')],
  ] : [
    [D.filter(r=>r.a && isAvail(r) && IDX(r)>0).length, tr('alternatives évaluées','alternates scored')],
    [med==null ? '—' : (med>=0?'+':'') + med + ' %', tr('gain médian sur la recette de base','median gain over the standard recipe')],
    [gs.filter(v=>v<0).length, tr('produits où la base résiste','products where the standard holds out')],
    [vals.length>1 ? '×' + fmtHuge(Math.round(Math.max(...vals)/Math.min(...vals))) : '—', tr('écart entre la première et la dernière','gap between the first and the last')],
  ]).map(s=>`<div class="stat"><div class="v">${s[0]}</div><div class="k">${s[1]}</div></div>`).join('');
}
function renderTexts(){
  const t = TXT();
  document.getElementById('h1b').textContent = t.h1;
  document.getElementById('lede').innerHTML = t.lede;
  document.getElementById('formula').innerHTML = typeof t.formula === 'function' ? t.formula() : t.formula;
  document.getElementById('limits').innerHTML = t.limits.map(x=>`<li>${x}</li>`).join('');
}

/* ---------- composition ---------- */
function line(r, cls, noName){
  const ins = r.ig.map(g=>`${nf(g[2])} ${ico(g[0],'sm')}${IT_(g[0])}`).join(' + ') || tr('rien','nothing');
  const by = r.by.map(g=>` <s>+ ${nf(g[2])} ${ico(g[0],'sm')}${IT_(g[0])}</s>`).join('');
  const unit = r.ig.map(g=>`${nf(g[1])} ${IT_(g[0])}`).join(' + ');
  const cout = mode==='esp' ? `${nf(P.em[r.m])} m²` : mode==='syn' ? `${nf(r.w)} MW · ${nf(P.em[r.m])} m²` : `${nf(r.w)} MW`;
  const head = noName
    ? `<span class="unit">${BT(r.m)} · ${cout} · tier ${r.t} · ${SRC[r.s]}</span>`
    : `<span class="ttl">${RC_(r.n)}</span> <span class="unit">· ${BT(r.m)} · ${cout} · tier ${r.t} · ${SRC[r.s]}</span>`;
  const rw = mode==='mat' && idxM(r) ? 1/idxM(r) : null;
  const raw = rw ? `<div class="unit">${tr(`soit ${nf(rw)} unité(s) de ressource brute par ${IT_(r.p).toLowerCase()}, chaîne amont comprise`,
    `i.e. ${nf(rw)} unit(s) of raw resource per ${IT_(r.p).toLowerCase()}, upstream chain included`)}</div>` : '';
  return `<div class="cline ${cls}">${head}
    <div class="flow">${ins} → ${nf(r.o)} ${ico(r.p,'sm')}${IT_(r.p)}${by} <span class="unit">/min</span></div>
    <div class="unit">${tr('soit','i.e.')} ${unit} ${tr('par','per')} ${IT_(r.p).toLowerCase()}</div>${raw}</div>`;
}
function chipsOf(a, s){
  const ms={}, ma={}; s.ig.forEach(g=>ms[g[0]]=g[1]); a.ig.forEach(g=>ma[g[0]]=g[1]);
  const c=[];
  Object.keys(ma).forEach(k=>{ if(!(k in ms)) c.push(`<span class="chip ad">+ ${ico(k,'sm')}${IT_(k)}</span>`); });
  Object.keys(ms).forEach(k=>{ if(!(k in ma)) c.push(`<span class="chip rm">− ${ico(k,'sm')}${IT_(k)}</span>`); });
  Object.keys(ma).forEach(k=>{ if(k in ms){ const x=ma[k]/ms[k];
    c.push(`<span class="chip${x<0.999?' up':''}">${ico(k,'sm')}${IT_(k)} ×${nf(x)}</span>`); }});
  c.push(`<span class="chip${a.o>s.o?' up':''}">${tr('sortie','output')} ×${nf(a.o/s.o)}</span>`);
  if(a.w!==s.w) c.push(`<span class="chip">${tr(`machine ×${nf(a.w/s.w)} en puissance`, `machine power ×${nf(a.w/s.w)}`)}</span>`);
  return `<div class="chips">${c.join('')}</div>`;
}
function noBase(p){
  const lk = D.filter(x=>x.p===p && !x.a);
  if(lk.length){ const t = Math.min(...lk.map(x=>x.t));
    return `<div class="altbox base">
      <div class="hd"><b>${RC_(lk[0].n)}</b><u class="flat"><span class="unit">${tr('palier','tier')} ${t}</span></u></div>
      <div class="cline s"><span class="unit">${tr(`Recette de base débloquée au palier ${t}, au-delà du palier
        atteint : d'ici là, seules les alternatives produisent ${IT_(p).toLowerCase()}. Pas de gain calculable.`,
        `Standard recipe unlocked at tier ${t}, beyond the tier reached: until then, only alternates
        produce ${IT_(p).toLowerCase()}. No gain can be computed.`)}</span>
      </div></div>`; }
  const nb = P.nobase[p];
  if(!nb) return `<div class="cline s"><span class="unit">${tr('Pas de recette de base répertoriée.','No standard recipe on record.')}</span></div>`;
  if(nb.kind === 'atelier'){
    const ing = nb.ing.map(g=>`${nf(g[1])} ${ico(g[0],'sm')}${IT_(g[0])}`).join(' + ');
    return `<div class="altbox base">
      <div class="hd"><b>${IT_(nb.n)}</b><u class="flat"><span class="unit">${tr("pas d'indice",'no index')}</span></u></div>
      <div class="cline s"><span class="unit">${BT('Equipment Workshop')} · ${tr('fabrication manuelle','crafted by hand')} · ${nf(nb.time)} s</span>
        <div class="flow">${ing} → ${nf(nb.q)} ${ico(p,'sm')}${IT_(p)}</div>
        <div class="unit">${tr("Aucune machine ne l'exécute : c'est justement ce que l'alternative rend automatisable.",
          'No machine runs it: that is precisely what the alternate makes automatable.')}</div>
      </div></div>`;
  }
  return `<div class="altbox base">
    <div class="hd"><b>${tr('Sous-produit','Byproduct')}</b><u class="flat"><span class="unit">${tr("pas d'indice",'no index')}</span></u></div>
    <div class="cline s"><span class="unit">${tr('Aucune recette dédiée : ce produit sort en second produit de','No dedicated recipe: this product comes out as the secondary output of')}
      ${nb.from.map(n=>RC_(n.replace('Alternate: ',''))).join(', ')}. ${tr('Il y est tarifé comme coproduit : ingrédients facturés en entier, machine au prorata.','It is priced there as a co-product: ingredients billed in full, machine pro rata.')}</span>
    </div></div>`;
}

/* ---------- filtre global ---------- */
let picked = [], onlyBetter = true;
const allItems = [...new Set(D.flatMap(r=>[r.p, ...r.ig.map(g=>g[0]), ...r.by.map(g=>g[0])]))].sort();
const usesItem = (r, it) => r.p===it || r.ig.some(g=>g[0]===it) || r.by.some(g=>g[0]===it);
function keep(r){
  if(!isAvail(r)) return false;
  if(picked.length && !picked.some(it=>usesItem(r,it))) return false;
  if(onlyBetter && r.a && GAIN(r)!=null && GAIN(r)<=0) return false;
  return true;
}
const dropEl = document.getElementById('drop'), pickIn = document.getElementById('pick');
const listEl = document.getElementById('dropList');
const useCount = {}; allItems.forEach(n=>useCount[n] = D.filter(r=>usesItem(r,n)).length);
function optRow(n){
  const on = picked.includes(n);
  return `<div class="opt${on?' on':''}" role="option" aria-selected="${on}" data-n="${esc(n)}">
    <i class="box"></i><span class="lbl">${ico(n)}${IT_(n)}</span>
    <span class="cnt">${useCount[n]}</span></div>`;
}
function drawDrop(){
  const q = pickIn.value.trim().toLowerCase();
  const match = n => !q || n.toLowerCase().includes(q) || IT_(n).toLowerCase().includes(q);
  const avI = availFor(cap).items;
  const sel = picked.filter(match), rest = allItems.filter(n=>!picked.includes(n) && match(n)
    && (!filtered() || avI.has(n) || isRaw(n))).slice(0,60);
  let html = '';
  if(sel.length) html += `<div class="sep">${tr('Cochés','Checked')}</div>` + sel.map(optRow).join('');
  if(rest.length) html += (sel.length ? `<div class="sep">${tr('Autres items','Other items')}</div>` : '') + rest.map(optRow).join('');
  listEl.innerHTML = html || `<div class="empty">${tr('Aucun item ne correspond.','No matching item.')}</div>`;
  listEl.querySelectorAll('.opt').forEach(el=>el.addEventListener('click', e=>{
    e.preventDefault(); e.stopPropagation();
    const n = el.dataset.n;
    picked = picked.includes(n) ? picked.filter(x=>x!==n) : picked.concat([n]);
    drawDrop(); drawPicked(); renderAll();
  }));
}
function openDrop(){ dropEl.hidden = false; drawDrop(); }
function closeDrop(){ dropEl.hidden = true; }
function drawPicked(){
  const box = document.getElementById('picked');
  box.innerHTML = picked.map(n=>`<span class="pick" data-n="${esc(n)}">${ico(n)}<b>${IT_(n)}</b><s>×</s></span>`).join('');
  box.querySelectorAll('.pick').forEach(el=>el.addEventListener('click',()=>{
    picked = picked.filter(x=>x!==el.dataset.n);
    drawPicked(); if(!dropEl.hidden) drawDrop(); renderAll();
  }));
}
pickIn.addEventListener('focus', openDrop);
pickIn.addEventListener('click', openDrop);
pickIn.addEventListener('input', ()=>{ dropEl.hidden = false; drawDrop(); });
pickIn.addEventListener('keydown', e=>{
  if(e.key==='Enter'){ e.preventDefault(); const f = listEl.querySelector('.opt');
    if(f){ const n = f.dataset.n;
      picked = picked.includes(n) ? picked.filter(x=>x!==n) : picked.concat([n]);
      pickIn.value=''; drawDrop(); drawPicked(); renderAll(); } }
  if(e.key==='Escape') closeDrop();
});
document.getElementById('clearPick').addEventListener('click', ()=>{ picked=[]; drawDrop(); drawPicked(); renderAll(); });
document.getElementById('closePick').addEventListener('click', closeDrop);
document.getElementById('combo').addEventListener('click', e=>e.stopPropagation());
document.addEventListener('click', ()=>{ if(!dropEl.hidden) closeDrop(); });
document.getElementById('onlyBetter').addEventListener('change', e=>{ onlyBetter = e.target.checked; renderAll(); });

/* ---------- navigation croisée ---------- */
const usedIn = {};
function buildUsedIn(){
  for(const k in usedIn) delete usedIn[k];
  CBS().forEach(c=>{ (c.alternatives_optimales ? c.alternatives_optimales.split(' | ') : [])
    .forEach(a=>{ (usedIn[a] = usedIn[a] || []).push(c.cible); }); });
}
const q1 = s => String(s).replace(/"/g,'&quot;');
function flash(el){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  setTimeout(()=>el.classList.remove('flash'), 1800); }
function goDuel(prod, alt){
  if(!prod) return;
  selectTab('tabD'); openGrp.add(prod);
  const find = ()=>document.querySelector('#duels .grp[data-p="'+q1(prod)+'"]');
  renderDuels();
  let el = find();
  if(!el){ picked = []; drawPicked();
    const a = D.find(r=>r.n===alt);
    if(a && GAIN(a)!=null && GAIN(a)<=0){ onlyBetter=false; document.getElementById('onlyBetter').checked=false; }
    renderAll(); el = find(); }
  if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); flash(el); }
}
function goCombi(target){
  if(!target) return;
  selectTab('tabC'); openCb.add(target);
  const find = ()=>document.querySelector('#combi .cb[data-t="'+q1(target)+'"]');
  renderCombi();
  let el = find();
  if(!el){ picked = []; drawPicked(); renderAll(); el = find(); }
  if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); flash(el); }
}

/* ---------- duels ---------- */
let openGrp = new Set();
function buildGroups(){
  return [...new Set(D.filter(r=>r.a).map(r=>r.p))].map(p=>{
    const g = {p, base: stdOf(p), alts: D.filter(r=>r.p===p && r.a && isAvail(r)).sort((x,y)=>(IDX(y)||0)-(IDX(x)||0))};
    g.best = g.alts[0];
    g.g = (g.base && g.best && IDX(g.best) && IDX(g.base)) ? IDX(g.best)/IDX(g.base)*100-100 : null;
    return g;
  }).filter(g=>g.alts.length).sort((a,b)=>(b.g??-1e9)-(a.g??-1e9));
}
function visibleAlts(g){ return g.alts.filter(a=> !(onlyBetter && GAIN(a)!=null && GAIN(a)<=0) && keep(a)); }
function renderDuels(){
  savePrefs();
  const groups = buildGroups();
  const list = groups.filter(g=>{
    if(picked.length && !picked.some(it=>usesItem(g.best,it) || (g.base && usesItem(g.base,it)))) return false;
    return visibleAlts(g).length > 0;
  });
  document.getElementById('duelCount').textContent =
    list.length + (list.length>1 ? tr(' produits affichés',' products shown') : tr(' produit affiché',' product shown'));
  document.getElementById('nD').textContent = ' ' + groups.length;
  document.getElementById('duels').innerHTML = list.map(g=>{
    const alts = visibleAlts(g), open = openGrp.has(g.p);
    const all = (g.base ? [g.base] : []).concat(alts);
    const top = Math.max(...all.map(r=>IDX(r)||0));
    const ladder = all.map(r=>`
      <div class="lrow ${r.a?'':'base'}"><span class="ln">${RC_(r.n)}${r.a?'':` <span class="unit">(${tr('base','standard')})</span>`}</span>
        <span class="lb"><i style="width:${Math.max(2,(IDX(r)||0)/top*100).toFixed(1)}%"></i></span>
        <span class="lv">${nf(IDX(r))}</span></div>`).join('');
    const hidden = g.alts.length - alts.length;
    const nBetter = g.alts.filter(a=>GAIN(a)>0).length;
    const body = open ? `<div class="comp">
      ${g.base ? `<div class="altbox base">
          <div class="hd"><b>${RC_(g.base.n)}</b><u class="flat"><span class="unit">${SYM()}=${nf(IDX(g.base))}</span></u></div>
          ${line(g.base,'s',true)}</div>` : noBase(g.p)}
      ${alts.map(a=>`<div class="altbox">
          <div class="hd"><b>${RC_(a.n)}${parBadge(a)}</b><u class="${GAIN(a)==null?'flat':GAIN(a)>0?'up':'down'}">${GAIN(a)==null?'':(GAIN(a)>0?'+':'')+pct(GAIN(a))+' %'} <span class="unit">${SYM()}=${nf(IDX(a))}</span></u></div>
          ${line(a,'a',true)}${g.base?chipsOf(a,g.base):''}
          ${(usedIn[a.n]||[]).length ? `<div class="usedin">${tr('Retenue dans la combinaison optimale de','Used in the optimal combination for')}
            <span class="chips">${usedIn[a.n].map(tg=>`<span class="chip lk" data-gocombi="${esc(tg)}">${ico(tg,'sm')}${IT_(tg)}</span>`).join('')}</span></div>` : ''}
        </div>`).join('')}
      </div>` : '';
    return `<div class="grp" data-p="${esc(g.p)}">
      <div class="top" role="button" tabindex="0" aria-expanded="${open}">
        <span class="name">${ico(g.p,'lg')}${IT_(g.p)}</span>
        <span class="gain ${g.g<0?'neg':''}">${g.g==null?'':(g.g>0?'+':'')+pct(g.g)+' %'}<s>${open?'−':'+'}</s></span></div>
      <div class="sub">${g.alts.length} ${tr('alternative','alternate')}${g.alts.length>1?'s':''}${g.base?` · ${nBetter} ${tr(`meilleure${nBetter>1?'s':''} que la base`,'better than the standard')}`:''}${hidden?` · <a class="reveal" role="button" tabindex="0">${hidden} ${tr(`masquée${hidden>1?'s':''} — afficher`,'hidden — show')}</a>`:''}</div>
      <div class="ladder">${ladder}</div>
      ${body}</div>`;
  }).join('') || `<p class="foot">${tr('Aucun produit ne correspond au filtre.','No product matches the filter.')}</p>`;

  document.querySelectorAll('#duels .reveal').forEach(el=>{
    const go = e=>{ e.stopPropagation(); onlyBetter=false;
      document.getElementById('onlyBetter').checked=false; renderAll(); };
    el.addEventListener('click', go);
    el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' ') go(e); });
  });
  document.querySelectorAll('#duels [data-gocombi]').forEach(el=>el.addEventListener('click', e=>{
    e.stopPropagation(); goCombi(el.dataset.gocombi);
  }));
  document.querySelectorAll('#duels .grp .top').forEach(el=>{
    const go = ()=>{ const p = el.parentElement.dataset.p;
      openGrp.has(p) ? openGrp.delete(p) : openGrp.add(p); renderDuels(); };
    el.addEventListener('click', go);
    el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } });
  });
}
document.getElementById('expAll').addEventListener('click',()=>{ buildGroups().forEach(g=>openGrp.add(g.p)); renderDuels(); });
document.getElementById('colAll').addEventListener('click',()=>{ openGrp.clear(); renderDuels(); });

/* ---------- séquence de production ----------
   Reconstruit la chaîne exacte derrière un score du registre : même modèle de coût que le solveur
   (puissance machine répartie sur toutes les sorties, ingrédients facturés en entier à la sortie
   considérée), puis choix des recettes de base non nommées dans la liste qui retrouve le score. */
/* MOTEUR:START — modèle de coût et recherche exacte, repris tels quels par scripts/paliers_combinaisons.js */
const RAWE = {'Water':1/6, 'Crude Oil':1/3, 'Nitrogen Gas':0.5};
['Iron Ore','Copper Ore','Limestone','Coal','Caterium Ore','Raw Quartz','Sulfur','Bauxite','Uranium','SAM']
  .forEach(k=>RAWE[k]=0.125);
const HAND = new Set(['Leaves','Wood','Mycelia','Hog Remains','Spitter Remains','Stinger Remains','Hatcher Remains','Power Shard']);
const NONRAW = new Set(['Dissolved Silica']);
const MAIN = {}, BYSRC = {};
D.forEach(r=>{ (MAIN[r.p] = MAIN[r.p] || []).push(r);
  r.by.forEach(b=>{ (BYSRC[b[0]] = BYSRC[b[0]] || []).push(r); }); });
const isRaw = it => !MAIN[it] && !NONRAW.has(it);
/* Espace : m² au sol par unité/min, machines et extraction surcadencées (P.oc, 250 %) ; ramassage = 0. */
/* Synthèse (syn) des chaînes : coût composite en MW-équivalents = pI·MW + pM·τM·(ressources brutes) + pE·τE·m²,
   aux poids SYN_WC : ceux des curseurs dans la page, SYN_W0 (un tiers chacun) pour le registre précalculé combiS.
   τ : taux de change médians entre critères (synTaux). Le coût reste additif le long de la chaîne : même recherche
   exacte que les autres critères. */
const SYN_W0 = {mw: 1/3, mat: 1/3, esp: 1/3}, SYN_K = ['mw', 'mat', 'esp'];
let SYN_WC = SYN_W0;
const rawCost = (it, m) => m==='syn' ? synCost(k=>rawCost(it, k))
  : m==='mw' ? (it in RAWE ? RAWE[it] : (HAND.has(it) ? 0 : null))
  : m==='esp' ? (it in P.ex ? P.ex[it] : (HAND.has(it) ? 0 : null))
  : ((it==='Water' || HAND.has(it)) ? 0 : 1);
const byOut = r => r.by.reduce((t,b)=>t+b[2], 0);
/* part de la machine facturée à chaque unité produite (coproduits au prorata) : MW, m² au sol, ou rien */
const recCost = (r, m) => m==='syn' ? synCost(k=>recCost(r, k))
  : m==='mw' ? r.w / (r.o + byOut(r))
  : m==='esp' ? (P.em[r.m] == null ? Infinity : P.em[r.m] / (P.oc * (r.o + byOut(r)))) : 0;
function synCost(f){
  const T = synTaux(); let t = 0;
  for(const k of SYN_K){ if(!SYN_WC[k]) continue; const c = f(k); if(c == null) return null; t += SYN_WC[k]*T[k]*c; }
  return t;
}
const outRate = (ch, it) => ch.k==='m' ? ch.r.o : ch.r.by.find(b=>b[0]===it)[2];
function candsOf(it, listed){
  const av = availFor(cap).rec;
  const forced = (MAIN[it]||[]).filter(r=>r.a && listed.has(r.n) && av.has(r));
  if(forced.length) return forced.map(r=>({k:'m', r}));
  const c = (MAIN[it]||[]).filter(r=>!r.a && av.has(r)).map(r=>({k:'m', r}));
  if(c.length) return c;
  return (BYSRC[it]||[]).filter(r=>(!r.a || listed.has(r.n)) && av.has(r)).map(r=>({k:'b', r}));
}
function costWith(target, choice, m){
  const memo = {};
  const cost = (it, stack)=>{
    if(it in memo) return memo[it];
    if(isRaw(it)) return rawCost(it, m);
    const ch = choice[it];
    if(!ch || stack.has(it)) return null;
    const den = outRate(ch, it), s2 = new Set(stack).add(it);
    let t = recCost(ch.r, m);
    for(const g of ch.r.ig){ const c = cost(g[0], s2); if(c == null) return null; t += g[2]/den*c; }
    return memo[it] = t;
  };
  return cost(target, new Set());
}
/* ---------- recherche exacte des chaînes (reprise par scripts/paliers_combinaisons.js) ----------
   Une chaîne = une recette par item, la même partout dans l'arbre. optsOf : recettes jouables au palier c. */
const isAltLike = r => !!r.a || r.n === 'Distilled Silica';
function optsOf(it, c){
  const av = availFor(c).rec;
  const out = (MAIN[it]||[]).filter(r=>av.has(r)).map(r=>({k:'m', r}));
  if(!MAIN[it]) (BYSRC[it]||[]).filter(r=>av.has(r)).forEach(r=>out.push({k:'b', r}));
  return out;
}
const rawVal = (it, m) => { const c = rawCost(it, m); return c == null ? Infinity : c; };
function unitCost(o, it, m, val){
  const den = outRate(o, it);
  let t = recCost(o.r, m);
  for(const g of o.r.ig){ t += g[2]/den*val(g[0]); if(t === Infinity) break; }
  return t;
}
/* Borne inférieure : coût minimal de chaque item sans exiger la cohérence (une recette par item).
   Elle est exacte dès que les meilleurs choix ne forment pas de boucle ; sinon on la resserre
   en remplaçant chaque valeur par l'optimum cohérent de l'item pris comme cible. */
const lbCache = {};
let LB_BUDGET = 100000;
function lbFor(c, m){
  const key = availKey(c) + '|' + m + (m==='syn' ? '|' + SYN_K.map(k=>SYN_WC[k]).join(',') : '');
  if(lbCache[key]) return lbCache[key];
  const items = [...availFor(c).items].filter(it=>!isRaw(it));
  const LB = {}; items.forEach(it=>LB[it] = Infinity);
  const val = it => isRaw(it) ? rawVal(it, m) : (it in LB ? LB[it] : Infinity);
  for(let k = 0, ch = true; ch && k < 100; k++){ ch = false;
    for(const it of items) for(const o of optsOf(it, c)){
      const t = unitCost(o, it, m, val);
      if(t < LB[it] - 1e-15 * Math.max(1, LB[it] === Infinity ? 1 : LB[it])){ LB[it] = t; ch = true; } } }
  const order = items.filter(it=>LB[it] < Infinity).sort((a,b)=>LB[a]-LB[b]);
  for(let pass = 0; pass < 3; pass++){ let changed = false;
    for(const it of order){
      const r = searchChains(it, m, c, 1, LB_BUDGET, LB);
      if(!r.aborted && r.list.length && r.list[0].cost > LB[it] * (1 + 1e-12)){ LB[it] = r.list[0].cost; changed = true; }
    }
    if(!changed) break;
  }
  return lbCache[key] = LB;
}
function boundCost(target, choice, LB, m){
  const memo = {};
  const cost = (it, stack)=>{
    if(it in memo) return memo[it];
    if(isRaw(it)) return rawVal(it, m);
    const ch = choice[it];
    if(!ch) return it in LB ? LB[it] : Infinity;
    if(stack.has(it)) return Infinity;
    const den = outRate(ch, it), s2 = new Set(stack).add(it);
    let t = recCost(ch.r, m);
    for(const g of ch.r.ig){ t += g[2]/den*cost(g[0], s2); if(t === Infinity) return memo[it] = Infinity; }
    return memo[it] = t;
  };
  return cost(target, new Set());
}
const setBudget = n => { LB_BUDGET = n; };
const altsOfChoice = choice => [...new Set(Object.values(choice).filter(x=>isAltLike(x.r)).map(x=>x.r.n))].sort();
/* Les K meilleures chaînes distinctes (par jeu de recettes alternatives), recherche exacte par
   séparation-évaluation. baseOnly : recettes de base partout où il en existe une de débloquée. */
function searchChains(target, m, c, K, maxNodes, LB, baseOnly){
  LB = LB || lbFor(c, m);
  const best = new Map(), choice = {}, ranked = {};
  let nodes = 0, T = Infinity, aborted = false;
  const val = it => isRaw(it) ? rawVal(it, m) : (it in LB ? LB[it] : Infinity);
  const optsFor = it => ranked[it] || (ranked[it] = (()=>{
    let os = optsOf(it, c);
    if(baseOnly){ const b = os.filter(o=>!isAltLike(o.r)); if(b.length) os = b;
      const mains = os.filter(o=>o.k==='m' && !isAltLike(o.r));
      if(mains.length) os = [mains.reduce((x,y)=>((idxI(y.r)||0) > (idxI(x.r)||0) ? y : x))]; }
    return os.map(o=>({o, t: unitCost(o, it, m, val)})).sort((a,b)=>a.t-b.t).map(x=>x.o);
  })());
  const rec = pending => {
    if(aborted) return;
    if(++nodes > maxNodes){ aborted = true; return; }
    let it = null;
    while(pending.length){ const x = pending.pop(); if(!isRaw(x) && !(x in choice)){ it = x; break; } }
    if(!it){
      const cst = costWith(target, choice, m);
      if(cst == null) return;
      const alts = altsOfChoice(choice), key = alts.join('|');
      if(!best.has(key) || best.get(key).cost > cst){
        best.set(key, {cost: cst, alts, choice: Object.assign({}, choice)});
        if(best.size >= K) T = [...best.values()].map(v=>v.cost).sort((a,b)=>a-b)[K-1];
      }
      return;
    }
    for(const o of optsFor(it)){
      choice[it] = o;
      if(boundCost(target, choice, LB, m) < T * (1 - 1e-12)){
        const np = pending.slice(); o.r.ig.forEach(g=>np.push(g[0])); rec(np); }
      delete choice[it];
      if(aborted) return;
    }
  };
  rec([target]);
  const list = [...best.values()].sort((a,b)=>a.cost-b.cost).slice(0, K)
    .map(v=>({score: 1/v.cost, cost: v.cost, alts: v.alts, choice: v.choice}));
  return {list, nodes, aborted};
}
function brutes(target, c){
  const reach = new Set(), st = [target];
  while(st.length){ const it = st.pop(); if(reach.has(it) || isRaw(it)) continue; reach.add(it);
    optsOf(it, c).forEach(o=>o.r.ig.forEach(g=>st.push(g[0]))); }
  let n = 1n; reach.forEach(it=>{ n *= BigInt(Math.max(1, optsOf(it, c).length)); });
  return Number(n);
}
/* Indice d'une recette isolée (I, M, E) : sortie/min par unité de coût, calculé au palier maximal avec le modèle de
   coût des combinaisons (recCost / rawCost). En amont, les recettes de base (la moins chère quand il y en a plusieurs,
   coproduit d'une recette de base à défaut) ; pour un item qu'aucune ne produit, la moins chère des alternatives.
   g : gain en % sur la meilleure recette de base du même produit. */
const idxCache = new Map();
function idxOf(r, m){
  let C = idxCache.get(m);
  if(!C){
    C = new Map(); idxCache.set(m, C);
    const c0 = cap, f0 = FILTRE; cap = TMAX; FILTRE = null;   // indices sans filtre de partie : comparables
    for(const x of D){
      const listed = new Set([x.n]), memo = {};
      const cost = (it, stack)=>{
        if(isRaw(it)){ const v = rawCost(it, m); return v == null ? Infinity : v; }
        if(it in memo) return memo[it];
        if(stack.has(it)) return Infinity;
        let opts = it === x.p ? [{k:'m', r:x}] : candsOf(it, listed);
        if(!opts.length) opts = (MAIN[it]||[]).filter(r=>availFor(TMAX).rec.has(r)).map(r=>({k:'m', r}));
        const s2 = new Set(stack).add(it);
        let best = Infinity;
        for(const o of opts){ let t = recCost(o.r, m); const den = outRate(o, it);
          for(const g of o.r.ig){ t += g[2]/den*cost(g[0], s2); if(t === Infinity) break; }
          if(t < best) best = t; }
        return memo[it] = best;
      };
      const c = cost(x.p, new Set());
      C.set(x, {i: c > 0 && c < Infinity ? 1/c : null});
    }
    cap = c0; FILTRE = f0;
    for(const x of D){ const e = C.get(x);
      const b = D.filter(y=>y.p===x.p && !y.a && C.get(y).i).map(y=>C.get(y).i);
      e.g = e.i && b.length ? e.i/Math.max(...b)*100-100 : null; }
  }
  return C.get(r);
}
const espIdx = r => { const x = idxOf(r, 'esp'); return {ie: x.i, ge: x.g}; };
const idxI = r => idxOf(r, 'mw').i, idxM = r => idxOf(r, 'mat').i;
/* Taux de change entre critères, en MW : médiane, sur les recettes notées sur les trois, de ce que coûte en MW
   une unité de ressource brute (im/i) et un m² au sol (e/i). Arrondis à trois chiffres, ceux affichés. */
let SYN_T = null;
function synTaux(){
  if(SYN_T) return SYN_T;
  const med = a => { a.sort((x,y)=>x-y); const n = a.length; return n % 2 ? a[(n-1)/2] : (a[n/2-1] + a[n/2]) / 2; };
  const ok = D.filter(r=>idxI(r) > 0 && idxM(r) > 0 && idxOf(r, 'esp').i > 0);
  return SYN_T = {mw: 1, mat: +med(ok.map(r=>idxM(r)/idxI(r))).toPrecision(3), esp: +med(ok.map(r=>idxOf(r, 'esp').i/idxI(r))).toPrecision(3)};
}
/* Combinaisons d'un critère m au palier c, pour chaque cible du registre disponible à ce palier :
   c = cible, d = indice de la chaîne tout en base, o = indice optimal, n = combinaisons brutes,
   x = recherche prouvée exacte, top = 3 meilleures chaînes [indice, alternatives]. */
function tcRows(m, c, budget){
  const B = budget || 3e6;
  const rows = [];
  for(const t of P.combi){
    if(!availFor(c).items.has(t.cible)) continue;
    const r = searchChains(t.cible, m, c, 3, B), d = searchChains(t.cible, m, c, 1, B, null, true);
    rows.push({c: t.cible, d: d.list[0] ? d.list[0].score : null, o: r.list[0].score, n: brutes(t.cible, c),
      x: !r.aborted && !d.aborted, top: r.list.map(x=>[x.score, x.alts])});
  }
  return rows;
}
/* MOTEUR:END */
function usedItems(target, choice){
  const S = new Set(), st = [target];
  while(st.length){ const it = st.pop();
    if(S.has(it) || isRaw(it) || !choice[it]) continue;
    S.add(it); choice[it].r.ig.forEach(g=>st.push(g[0])); }
  return S;
}
/* Synthèse : poids choisis (curseurs 0–10), indice S et classement face à la base. */
let synW = {mw: 5, mat: 5, esp: 5};
const synPoids = () => { const t = SYN_K.reduce((a,k)=>a + synW[k], 0);
  return t ? {mw: synW.mw/t, mat: synW.mat/t, esp: synW.esp/t} : SYN_W0; };
const synDefaut = () => { const w = synPoids(); return SYN_K.every(k=>Math.abs(w[k] - SYN_W0[k]) < 1e-9); };
/* Indice S d'une recette isolée : 1 ÷ (pI/I + pM·τM/M + pE·τE/E), soit le coût composite des trois indices publiés.
   M absent (entrées toutes ramassées) : coût matière nul. I ou E absent : pas d'indice. g : gain sur la meilleure base. */
let synCache = {key: null, C: null};
function synIdx(r){
  const w = synPoids(), key = SYN_K.map(k=>w[k]).join(',');
  if(synCache.key !== key){
    const T = synTaux(), C = new Map();
    for(const x of D){ const e = espIdx(x).ie;
      const I = idxI(x), M = idxM(x);
      const c = I > 0 && e > 0 ? w.mw/I + (M > 0 ? w.mat*T.mat/M : 0) + w.esp*T.esp/e : null;
      C.set(x, {i: c > 0 ? 1/c : null}); }
    for(const x of D){ const e = C.get(x);
      const b = D.filter(y=>y.p===x.p && !y.a && C.get(y).i).map(y=>C.get(y).i);
      e.g = e.i && b.length ? e.i/Math.max(...b)*100-100 : null; }
    synCache = {key, C};
  }
  return synCache.C.get(r);
}
/* gagnante (dom) : aucun critère en recul, au moins un en progrès ; perdante (sub) : l'inverse ; sinon compromis (mix).
   Écarts de moins de 0,5 % tenus pour nuls. */
function pareto(r){
  if(!r.a || !stdOf(r.p)) return null;
  const gs = ['mw', 'mat', 'esp'].map(m=>idxOf(r, m).g).filter(v=>v != null);
  if(!gs.length) return null;
  const up = gs.some(v=>v > 0.5), down = gs.some(v=>v < -0.5);
  return up && !down ? 'dom' : down && !up ? 'sub' : up ? 'mix' : null;
}
const PAR_LB = {dom:['gagnante','winning'], mix:['compromis','trade-off'], sub:['perdante','losing']};
const parBadge = r => { const k = mode==='syn' && pareto(r);
  return k ? `<span class="par par-${k}" title="${esc(tr('Face à la base, sur énergie, matière et espace','Against the standard, on energy, materials and space'))}">${tr(...PAR_LB[k])}</span>` : ''; };
const planCache = {};
function reconstruct(target, alts, score, m){
  const key = [m, availKey(cap), target, score].concat(alts).join('|');   // availKey : les recettes permises changent avec « ma partie »
  if(key in planCache) return planCache[key];
  const listed = new Set(alts), reach = new Set(), st = [target];
  while(st.length){ const it = st.pop();
    if(reach.has(it)) continue; reach.add(it);
    if(!isRaw(it)) candsOf(it, listed).forEach(c=>c.r.ig.forEach(g=>st.push(g[0]))); }
  const items = [...reach].filter(it=>!isRaw(it) && candsOf(it, listed).length);
  const opts = items.map(it=>candsOf(it, listed));
  const total = Math.min(4096, opts.reduce((p,o)=>p*o.length, 1));
  let best = null;
  for(let n = 0; n < total; n++){
    let x = n; const choice = {};
    items.forEach((it,i)=>{ choice[it] = opts[i][x % opts[i].length]; x = Math.floor(x / opts[i].length); });
    const c = costWith(target, choice, m);
    if(!c) continue;
    const got = 1/c, err = Math.abs(got - score)/score;
    const names = new Set([...usedItems(target, choice)].map(it=>choice[it].r.n));
    const miss = alts.some(a=>!names.has(a));
    const k = [err > 1e-9 ? 1 : 0, miss ? 1 : 0, err];
    const better = !best || k[0]!==best.k[0] ? (!best || k[0]<best.k[0])
      : k[1]!==best.k[1] ? k[1]<best.k[1] : k[2]<best.k[2];
    if(better) best = {k, choice, score:got, exact: !k[0] && !k[1]};
  }
  return planCache[key] = best;
}
function stagesOf(target, choice){
  const stage = {};
  const depth = it=>{
    if(isRaw(it)) return 0;
    if(it in stage) return stage[it];
    stage[it] = 0;
    return stage[it] = 1 + Math.max(0, ...choice[it].r.ig.map(g=>depth(g[0])));
  };
  depth(target);
  return stage;
}
/* ordre d'affichage des recettes d'une chaîne : celui de la séquence (étape, puis nom de l'item) */
function orderAlts(target, alts, score){
  const plan = reconstruct(target, alts, score, mode);
  if(!plan) return alts.map(a=>({a, st:null}));
  const stage = stagesOf(target, plan.choice), pos = {};
  usedItems(target, plan.choice).forEach(it=>{
    const n = plan.choice[it].r.n, k = [stage[it], IT_(it)];
    if(!pos[n] || k[0] < pos[n][0]) pos[n] = k;
  });
  return alts.map(a=>({a, st: pos[a] ? pos[a][0] : null, nm: pos[a] ? pos[a][1] : a}))
    .sort((x,y)=>(x.st??99)-(y.st??99) || x.nm.localeCompare(y.nm));
}
function buildSeq(target, choice, rate){
  const used = usedItems(target, choice), stage = stagesOf(target, choice);
  const need = {[target]: rate}, raw = {}, steps = [];
  [...used].sort((a,b)=>stage[b]-stage[a]).forEach(it=>{
    const ch = choice[it], runs = (need[it]||0) / outRate(ch, it);
    ch.r.ig.forEach(g=>{ const q = runs*g[2];
      if(isRaw(g[0])) raw[g[0]] = (raw[g[0]]||0) + q; else need[g[0]] = (need[g[0]]||0) + q; });
    steps.push({it, ch, runs, st: stage[it]});
  });
  steps.forEach(x=>{ x.need = need[x.it]; });
  return {steps, raw, need, nStages: stage[target]};
}
const fx = v => { if(v == null) return '—'; const a = Math.abs(v);
  return dec(String(+v.toFixed(a >= 100 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 5))); };
function machinesTxt(runs, r){
  if(mode==='esp'){  // surcadencées : P.oc (2,5) fois la cadence nominale par machine
    const n = Math.max(1, Math.ceil(runs / P.oc - 1e-9)), clk = runs / n * 100;
    return `<b>${fx(runs)}</b> ${BT(r.m)} ${tr('à 100 %','at 100%')}<br>${n} ${tr('à','at')} ${fx(clk)} % · ${fx(n * P.em[r.m])} m²`;
  }
  const n = Math.max(1, Math.ceil(runs - 1e-9)), clk = runs / n * 100;
  const whole = Math.abs(clk - 100) < 1e-6;
  return `<b>${fx(runs)}</b> ${BT(r.m)}<br>${n} ${tr('à','at')} ${whole ? '100' : fx(clk)} % · ${fx(runs*r.w)} MW`;
}
/* Espace : bâtiments d'extraction (surcadencés à P.oc) pour q u/min de la ressource k. Bâtiments entiers, sauf
   l'azote, compté en part de l'ensemble des puits du monde. null : ressource ramassée ou sans bâtiment. */
function extrBat(k, q){
  const x = (P.xb || {})[k];
  if(!x || !(q > 0)) return null;
  if(Array.isArray(x.b)) return {part: q / x.d, m2: q / x.d * x.a, x};
  const n = Math.max(1, Math.ceil(q / x.d - 1e-9));
  return {n, clk: q / n / (x.d / P.oc) * 100, m2: n * x.a, b: x.b};
}
const extrTxt = e => e.x
  ? tr(`${fx(e.part * 100)} % des puits d'azote du monde (${e.x.n[0]} pressuriseurs, ${e.x.n[1]} extracteurs) · ${fx(e.m2)} m²`,
       `${fx(e.part * 100)}% of the world's nitrogen wells (${e.x.n[0]} pressurizers, ${e.x.n[1]} extractors) · ${fx(e.m2)} m²`)
  : `${e.n} ${BT(e.b)} ${tr('à','at')} ${fx(e.clk)} % · ${fx(e.m2)} m²`;
const seqPick = {}, seqRate = {};
function seqHTML(c, pod){
  const i = seqPick[c.cible], p = pod[i];
  if(i == null || !p) return '';
  const plan = reconstruct(c.cible, p[1], p[0], mode);
  if(!plan) return `<div class="seq"><div class="sum warn">${tr('Chaîne introuvable dans les données : séquence indisponible.','Chain not found in the data: sequence unavailable.')}</div></div>`;
  const fin = plan.choice[c.cible];
  const rk = mode + '|' + c.cible;
  const rate = seqRate[rk] || outRate(fin, c.cible);
  const q = buildSeq(c.cible, plan.choice, rate);
  const mw = q.steps.reduce((t,x)=>t + x.runs*x.ch.r.w, 0);
  const ext = Object.entries(q.raw).reduce((t,[k,v])=>t + v*(RAWE[k]||0), 0);
  const mat = Object.entries(q.raw).reduce((t,[k,v])=>t + v*rawCost(k,'mat'), 0);
  const hasBy = q.steps.some(x=>x.ch.r.by.length || x.ch.k==='b');
  const verdict = plan.exact
    ? tr(`${SYM()} recalculé = <b>${nf(plan.score)}</b>, identique au registre`, `${SYM()} recomputed = <b>${nf(plan.score)}</b>, same as the registry`)
    : `<span class="warn">${tr(`${SYM()} recalculé = ${nf(plan.score)} au lieu de ${nf(p[0])} : séquence approchée`,
        `${SYM()} recomputed = ${nf(plan.score)} instead of ${nf(p[0])}: approximate sequence`)}</span>`;
  const nMach = q.steps.reduce((t,x)=>t + Math.max(1, Math.ceil(x.runs / P.oc - 1e-9)), 0);
  const aMach = q.steps.reduce((t,x)=>t + Math.max(1, Math.ceil(x.runs / P.oc - 1e-9)) * P.em[x.ch.r.m], 0);
  const xbs = Object.fromEntries(Object.entries(q.raw).map(([k,v])=>[k, extrBat(k, v)]));
  const aExt = mode==='esp' ? Object.values(xbs).reduce((t,e)=>t + (e ? e.m2 : 0), 0)
    : Object.entries(q.raw).reduce((t,[k,v])=>t + v*(rawCost(k,'esp')||0), 0);
  const real = mode==='syn'
    ? tr(`Puissance appelée : <b>${fx(mw)} MW</b> de machines + <b>${fx(ext)} MW</b> d'extraction · ressources brutes : <b>${fx(mat)} u/min</b> hors eau · emprise au sol, tout surcadencé à 250 % : <b>${fx(aMach + aExt)} m²</b>.`,
         `Power drawn: <b>${fx(mw)} MW</b> of machines + <b>${fx(ext)} MW</b> of extraction · raw resources: <b>${fx(mat)} u/min</b> excluding water · floor footprint, all overclocked to 250%: <b>${fx(aMach + aExt)} m²</b>.`)
    : mode==='esp'
    ? tr(`Emprise au sol : <b>${fx(aMach)} m²</b> pour ${nMach} machines surcadencées + <b>${fx(aExt)} m²</b> de bâtiments d'extraction, soit ${fx(rate/(aMach+aExt)*100)} ${IT_(c.cible).toLowerCase()}/min pour 100 m². L'indice facture chaque machine au prorata de son usage ; ici on compte des bâtiments entiers (sauf l'azote, réparti sur les puits du monde).`,
         `Floor footprint: <b>${fx(aMach)} m²</b> for ${nMach} overclocked machines + <b>${fx(aExt)} m²</b> of extraction buildings, i.e. ${fx(rate/(aMach+aExt)*100)} ${IT_(c.cible).toLowerCase()}/min per 100 m². The index bills each machine in proportion to its use; here whole buildings are counted (nitrogen aside, shared over the world's wells).`)
    : mode==='mw'
    ? tr(`Puissance appelée : <b>${fx(mw)} MW</b> de machines + <b>${fx(ext)} MW</b> d'extraction, soit ${fx(rate/(mw+ext))} ${IT_(c.cible).toLowerCase()}/min par MW.`,
         `Power drawn: <b>${fx(mw)} MW</b> of machines + <b>${fx(ext)} MW</b> of extraction, i.e. ${fx(rate/(mw+ext))} ${IT_(c.cible).toLowerCase()}/min per MW.`)
      + (hasBy ? tr(` L'écart avec l'indice vient des coproduits : l'indice ne facture à chaque sortie qu'une part de la machine qui la produit, la puissance appelée compte la machine entière.`,
         ` The gap with the index comes from co-products: the index bills each output only a share of the machine producing it, while power drawn counts the whole machine.`) : '')
    : tr(`Ressources brutes : <b>${fx(mat)} u/min</b> hors eau, soit ${fx(rate/mat)} ${IT_(c.cible).toLowerCase()}/min par unité.`,
         `Raw resources: <b>${fx(mat)} u/min</b> excluding water, i.e. ${fx(rate/mat)} ${IT_(c.cible).toLowerCase()}/min per unit.`);
  const rawRow = `<div class="stp raw"><div class="rail"><div class="sn">0</div></div><div class="col">
    <div class="lab">${tr('Extraction','Extraction')}</div><div class="rawl">${Object.entries(q.raw).sort((a,b)=>b[1]-a[1]).map(([k,v])=>
      `<span class="chip">${fx(v)} ${ico(k,'sm')}${IT_(k)}${HAND.has(k) ? ` <span class="unit">&nbsp;${tr('ramassage','gathered')}</span>`
        : (mode==='mat' && k==='Water') ? ` <span class="unit">&nbsp;${tr('gratuite','free')}</span>` : ''}${mode==='esp' && xbs[k] ? `<span class="xbat">${extrTxt(xbs[k])}</span>` : ''}</span>`).join('')}</div></div></div>`;
  const byStage = {};
  q.steps.forEach(x=>{ (byStage[x.st] = byStage[x.st] || []).push(x); });
  const rows = Object.keys(byStage).map(Number).sort((a,b)=>a-b).map(stn=>{
    const goal = stn === q.nStages;
    const cards = byStage[stn].sort((a,b)=>IT_(a.it).localeCompare(IT_(b.it))).map(x=>{
      const r = x.ch.r, isB = x.ch.k==='b';
      const cls = isB ? 'b' : r.a ? 'a' : '';
      const kind = isB ? tr('coproduit de','co-product of') : r.a ? tr('alternative','alternate') : tr('base','standard');
      const ins = r.ig.map(g=>`${fx(x.runs*g[2])} ${ico(g[0],'sm')}${IT_(g[0])}`).join(' + ') || tr('rien','nothing');
      const outs = [[r.p, r.o]].concat(r.by.map(b=>[b[0], b[2]]));
      const main = outs.find(o=>o[0]===x.it), others = outs.filter(o=>o[0]!==x.it);
      const bp = others.map(([k,v])=>{ const got = x.runs*v, use = q.need[k] || q.raw[k];
        return `+ ${fx(got)} ${ico(k,'sm')}${IT_(k)}/min ` + (use
          ? `<em>${tr(`à réinjecter : la chaîne en consomme ${fx(use)}/min`, `to feed back: the chain consumes ${fx(use)}/min`)}</em>`
          : tr('en surplus','surplus')); }).join('<br>');
      return `<div class="sit ${cls}"><div class="hd">
          <span class="nm">${ico(x.it,'lg')}${IT_(x.it)}</span>
          <span class="mc">${machinesTxt(x.runs, r)}</span></div>
        <div class="rc">${kind} <i>${RC_(r.n)}</i> · tier ${r.t} · ${SRC[r.s]}</div>
        <div class="fl">${ins} → ${fx(x.runs*main[1])} ${ico(x.it,'sm')}${IT_(x.it)} <span class="unit">/min</span></div>
        ${bp ? `<div class="bp">${bp}</div>` : ''}</div>`;
    }).join('');
    return `<div class="stp${goal?' goal':''}"><div class="rail"><div class="sn">${stn}</div></div><div class="col">
      <div class="lab">${goal ? tr('Cible','Target') : tr('Étape ','Step ') + stn}${mode==='esp' ? (()=>{
        const n = byStage[stn].reduce((t,x)=>t + Math.max(1, Math.ceil(x.runs / P.oc - 1e-9)), 0);
        const a = byStage[stn].reduce((t,x)=>t + Math.max(1, Math.ceil(x.runs / P.oc - 1e-9)) * P.em[x.ch.r.m], 0);
        return ` <span class="unit">· ${n} ${tr(n>1?'bâtiments':'bâtiment', n>1?'buildings':'building')} · ${fx(a)} m²</span>`; })() : ''}</div>${cards}</div></div>`;
  }).join('');
  return `<div class="seq">
    <div class="sh"><b>${i===0 ? tr('Séquence de la meilleure chaîne','Sequence of the best chain') : tr('Séquence de la chaîne n° ','Sequence of chain #') + (i+1)}</b>
      <label class="rate">${tr('Cadence visée','Target rate')} <input type="number" min="0.01" step="any" value="${+rate.toFixed(4)}"
        data-rate="${esc(c.cible)}"> ${ico(c.cible,'sm')}/min</label></div>
    <div class="sum">${verdict}.<br>${real}</div>
    ${rawRow}${rows}${mode==='esp' ? batRecap(q, xbs, aMach, aExt) : ''}
  </div>`;
}

/* Espace : récapitulatif des bâtiments employés par la chaîne (machines surcadencées, extraction). */
function batRecap(q, xbs, aMach, aExt){
  const M = {}, X = {};
  q.steps.forEach(x=>{ const m = x.ch.r.m, n = Math.max(1, Math.ceil(x.runs / P.oc - 1e-9));
    const o = M[m] = M[m] || {n: 0, a: 0}; o.n += n; o.a += n * P.em[m]; });
  Object.values(xbs).forEach(e=>{ if(!e) return;
    const k = e.x ? 'N2' : e.b, o = X[k] = X[k] || {n: 0, a: 0, part: 0, e}; o.n += e.n || 0; o.a += e.m2; o.part += e.part || 0; });
  const row = (lb, n, a) => `<tr><td>${lb}</td><td>${n}</td><td>${fx(a)} m²</td></tr>`;
  const sortA = o => Object.entries(o).sort((x,y)=>y[1].a - x[1].a);
  return `<div class="batrec"><div class="hd">${tr('Bâtiments employés','Buildings used')}</div><table>
    <tr class="sec"><td>${tr('Production, à 250 %','Production, at 250%')}</td><td>${tr('nombre','count')}</td><td>${tr('emprise','footprint')}</td></tr>
    ${sortA(M).map(([m,o])=>row(BT(m), o.n, o.a)).join('')}
    <tr class="sec"><td colspan="3">${tr('Extraction, à 250 %','Extraction, at 250%')}</td></tr>
    ${sortA(X).map(([k,o])=>k==='N2'
      ? row(tr('Puits d\'azote (part du monde)','Nitrogen wells (share of the world)'), fx(o.part * 100) + ' %', o.a)
      : row(BT(k), o.n, o.a)).join('') || `<tr><td colspan="3">${tr('aucune : entrées ramassées','none: gathered inputs')}</td></tr>`}
    <tr class="tot"><td>${tr('Total au sol','Total floor area')}</td><td></td><td>${fx(aMach + aExt)} m²</td></tr>
  </table></div>`;
}

/* ---------- combinaisons ---------- */
let openCb = new Set();
function renderCombi(){
  savePrefs();
  const rowsC = CBS(), chains = CHS();
  const sn = document.getElementById('synNote');
  sn.hidden = mode!=='syn';
  if(mode==='syn') sn.innerHTML = tr(`<b>Synthèse :</b> combinaisons recalculées dans la page avec vos poids, indice S de la chaîne entière.${synDefaut() ? '' : ' La pire chaîne et le nombre de chaînes distinctes, obtenus par énumération complète, ne sont précalculés qu\'à poids égaux.'}`,
    `<b>Synthesis:</b> combinations recomputed in the page with your weights, S index of the whole chain.${synDefaut() ? '' : ' The worst chain and the number of distinct chains, obtained by full enumeration, are only precomputed at equal weights.'}`);
  const list = rowsC.filter(c=>!picked.length || picked.includes(c.cible))
    .slice().sort((a,b)=>(b.gain_pct??-1e9)-(a.gain_pct??-1e9));
  document.getElementById('combiCount').textContent =
    list.length + (list.length>1 ? tr(' cibles affichées',' targets shown') : tr(' cible affichée',' target shown'));
  document.getElementById('nC').textContent = ' ' + rowsC.length;
  document.getElementById('nTargets').textContent = rowsC.length;
  document.getElementById('combi').innerHTML = list.map(c=>{
    const open = openCb.has(c.cible), det = chains[c.cible];
    const alts = c.alternatives_optimales ? c.alternatives_optimales.split(' | ') : [];
    const scale = [['base',tr('Tout en recettes de base','All standard recipes'), c.idx_defaut], ['opt',tr('Meilleure combinaison','Best combination'), c.idx_optimal]]
      .concat(c.idx_pire ? [['worst',tr('Pire combinaison','Worst combination'), c.idx_pire]] : []);
    const ladder = scale.map(([k,lab,v])=>`
      <div class="lrow ${k}"><span class="ln">${lab}</span>
        <span class="lb"><i style="width:${Math.max(2,(v||0)/c.idx_optimal*100).toFixed(1)}%"></i></span>
        <span class="lv">${nf(v)}</span></div>`).join('');
    const pod = (()=>{ const seen=new Set(), out=[];
      (det?det.top:[]).forEach(p=>{ const k=p[1].join('|'); if(!seen.has(k)){ seen.add(k); out.push(p); } });
      return out.slice(0,3); })();
    const body = open ? `<div class="body">
      <div>${tr('Recettes retenues dans la combinaison optimale :','Recipes used in the optimal combination:')}</div>
      <div class="chips">${alts.map(a=>`<span class="chip up lk" data-goduel="${esc(RI[a]||'')}" data-alt="${esc(a)}">${icoR(a)}${RC_(a)}${simTag(a)}</span>`).join('')
        || `<span class="chip">${tr('aucune : la chaîne de base est déjà optimale','none: the standard chain is already optimal')}</span>`}</div>
      <div style="margin-top:9px">${tr('Podium des meilleures chaînes','Podium of the best chains')} <span class="unit">— ${tr("recettes dans l'ordre de production, numéro d'étape en tête",'recipes in production order, step number first')}</span>${tr(' :',':')}</div>
      <div class="podium">${pod.map((p,k)=>`<div class="pr"><b>${SYM()}=${nf(p[0])}</b>
        <span class="cs">${p[1].length ? orderAlts(c.cible, p[1], p[0]).map(({a,st})=>`<span class="chip lk" data-goduel="${esc(RI[a]||'')}" data-alt="${esc(a)}">${st!=null?`<i class="stn">${st}</i>`:''}${icoR(a)}${RC_(a)}${simTag(a)}</span>`).join('')
          : `<span class="chip">${tr('aucune alternative','no alternate')}</span>`}</span>
        <button data-seq="${esc(c.cible)}" data-k="${k}" aria-pressed="${seqPick[c.cible]===k}">${seqPick[c.cible]===k ? tr('Masquer','Hide') : tr('Séquence','Sequence')}</button></div>`).join('')}</div>
      ${seqHTML(c, pod)}
      <div class="foot" style="margin-top:6px">${det && det.exact
        ? tr('Recherche exacte : aucune chaîne écartée ne pouvait battre ce podium.','Exact search: no discarded chain could beat this podium.')
        : tr('Recherche interrompue avant preuve : ce podium est le meilleur trouvé, sans garantie d\'optimalité.','Search stopped before proof: this podium is the best found, with no guarantee of optimality.')}</div>
    </div>` : '';
    return `<div class="cb" data-t="${esc(c.cible)}">
      <div class="top" role="button" tabindex="0" aria-expanded="${open}">
        <span class="name">${ico(c.cible,'lg')}${IT_(c.cible)}</span>
        <span class="gain">${c.gain_pct==null?'':'+'+pct(c.gain_pct)+' %'}<s>${open?'−':'+'}</s></span></div>
      <div class="sub">${c.nb_alternatives_optimales} ${tr('alternative','alternate')}${c.nb_alternatives_optimales>1?'s':''} ${tr("dans l'optimum",'in the optimum')}
        · ${c.nb_chaines!=null ? fmtBig(c.nb_chaines) + tr(' chaînes distinctes sur ',' distinct chains out of ') : ''}${fmtHuge(c.combinaisons_brutes)} ${tr('combinaisons brutes','raw combinations')}${filtered() ? tr(' au palier ',' at tier ') + cap : ''}</div>
      <div class="ladder">${ladder}</div>
      ${body}</div>`;
  }).join('') || `<p class="foot">${tr('Aucune cible ne correspond au filtre.','No target matches the filter.')}</p>`;

  document.querySelectorAll('#combi [data-goduel]').forEach(el=>el.addEventListener('click', e=>{
    e.stopPropagation(); goDuel(el.dataset.goduel, el.dataset.alt);
  }));
  document.querySelectorAll('#combi [data-seq]').forEach(el=>el.addEventListener('click', e=>{
    e.stopPropagation(); const t = el.dataset.seq, k = +el.dataset.k;
    if(seqPick[t] === k) delete seqPick[t]; else seqPick[t] = k;
    renderCombi();
  }));
  document.querySelectorAll('#combi [data-rate]').forEach(el=>el.addEventListener('change', ()=>{
    const v = parseFloat(String(el.value).replace(',', '.'));
    if(v > 0){ seqRate[mode + '|' + el.dataset.rate] = v; renderCombi(); }
  }));
  document.querySelectorAll('#combi .cb .top').forEach(el=>{
    const go = ()=>{ const k = el.parentElement.dataset.t;
      openCb.has(k) ? openCb.delete(k) : openCb.add(k); renderCombi(); };
    el.addEventListener('click', go);
    el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } });
  });
  document.getElementById('freq').innerHTML = FRQ().slice(0,14).map(([n,c])=>{
    const nm = n.replace('Alternate: ','');
    return `<tr><td>${icoR(nm)}${RC_(nm)}</td><td>${c}</td></tr>`;
  }).join('');
}
document.getElementById('expAllC').addEventListener('click',()=>{ CBS().forEach(c=>openCb.add(c.cible)); renderCombi(); });
document.getElementById('colAllC').addEventListener('click',()=>{ openCb.clear(); renderCombi(); });

/* ---------- tiers ---------- */
function renderTiers(){
  const byT = {};
  D.forEach(r=>{ (byT[r.t] = byT[r.t]||[]).push(r); });
  const maxN = Math.max(...Object.values(byT).map(v=>v.length));
  document.getElementById('tiers').innerHTML = Object.keys(byT).sort((a,b)=>a-b).map(t=>{
    const rs = byT[t], a = rs.filter(r=>r.a), s = rs.filter(r=>!r.a);
    const top = rs.slice().sort((x,y)=>(IDX(y)||0)-(IDX(x)||0)).slice(0,3)
      .map(r=>`${ico(r.p,'sm')}` + (r.a?`<span>${RC_(r.n)}</span>`:`<em>${RC_(r.n)}</em>`)).join(' · ');
    return `<div class="tier${+t>cap?' lock':''}"><div class="tbadge" data-cap="${t}" role="button" tabindex="0"
      title="${tr('Fixer le palier atteint à ','Set the tier reached to ')}${t}">${t}</div><div>
      <div class="tl">${tierLabel(t)} — ${s.length} ${tr('de base','standard')}, ${a.length} ${tr('alternatives','alternates')}</div>
      <div class="tbar"><i class="s" style="width:${s.length/maxN*100}%;left:0"></i>
        <i style="width:${a.length/maxN*100}%;left:${s.length/maxN*100}%"></i></div>
      <div class="names">${top}</div></div></div>`;
  }).join('');
  document.querySelectorAll('#tiers .tbadge').forEach(el=>{
    const go = ()=>setCap(+el.dataset.cap);
    el.addEventListener('click', go);
    el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } });
  });
  const sel = document.getElementById('tierSel');
  const prev = sel.innerHTML ? sel.value : PREFS.tierSel;
  sel.innerHTML = `<option value="">${tr('Tous les tiers','All tiers')}</option>` +
    Object.keys(byT).sort((a,b)=>a-b).map(t=>`<option value="${t}">Tier ${t}</option>`).join('');
  if([...sel.options].some(o=>o.value===prev)) sel.value = prev;
}

/* ---------- catalogue ---------- */
let filt='all', sort='i', openRows = new Set();
function renderRows(){
  savePrefs();
  const q = document.getElementById('q').value.toLowerCase(), tf = document.getElementById('tierSel').value;
  let rows = D.filter(r => keep(r)
    && (filt==='all' || (filt==='alt')===!!r.a)
    && (!tf || r.t==tf)
    && (!q || (r.n+' '+r.p+' '+r.m+' '+RC_(r.n)+' '+IT_(r.p)+' '+BT(r.m)).toLowerCase().includes(q)));
  rows.sort((a,b)=> sort==='t' ? a.t-b.t || (IDX(b)||0)-(IDX(a)||0)
    : sort==='g' ? (GAIN(b)??-1e9)-(GAIN(a)??-1e9) : (IDX(b)??-1)-(IDX(a)??-1));
  document.getElementById('nL').textContent = ' ' + D.length;
  document.getElementById('rowCount').textContent =
    rows.length + tr(' recettes · touchez une ligne pour voir sa composition et l\'écart avec la recette de base',' recipes · tap a row to see its composition and the gap with the standard recipe');
  document.getElementById('rows').innerHTML = rows.map((r,k)=>{
    const gv = GAIN(r);
    const g = gv==null ? '<u class="flat">'+(IDX(r)==null?tr('hors indice','no index'):!r.a?tr('recette de base','standard recipe'):tr('sans recette de base','no standard recipe'))+'</u>'
      : `<u class="${gv>0.5?'up':gv<-0.5?'down':'flat'}">${gv>0?'+':''}${pct(gv)} % ${tr('vs base','vs standard')}</u>`;
    const id = r.n+'|'+r.p;
    return `<div class="row ${r.a?'isalt':''}" data-k="${k}">
      <div class="t">${r.t}</div>
      <div><div class="nm">${ico(r.p)}${RC_(r.n)}${parBadge(r)}</div>
        <div class="sub">${IT_(r.p)} · ${BT(r.m)} · ${nf(r.o)}/min · ${nf(r.w)} MW · ${SRC[r.s]}</div></div>
      <div class="val"><b>${nf(IDX(r))}</b>${g}</div>
      ${openRows.has(id) ? `<div class="detail">${
        (r.a && stdOf(r.p)) ? line(stdOf(r.p),'s') + line(r,'a') + chipsOf(r, stdOf(r.p)) : line(r, r.a?'a':'s')
      }</div>` : ''}</div>`;
  }).join('') || `<p class="foot">${tr('Aucune recette ne correspond.','No matching recipe.')}</p>`;
  document.querySelectorAll('#rows .row').forEach(el=>el.addEventListener('click',()=>{
    const r = rows[+el.dataset.k], id = r.n+'|'+r.p;
    openRows.has(id) ? openRows.delete(id) : openRows.add(id);
    renderRows();
  }));
}
document.querySelectorAll('.controls button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.controls button').forEach(x=>x.setAttribute('aria-pressed', x===b));
  filt = b.dataset.f; renderRows();
}));
document.getElementById('sortSel').addEventListener('change', e=>{ sort=e.target.value; renderRows(); });
document.getElementById('tierSel').addEventListener('change', renderRows);
document.getElementById('q').addEventListener('input', renderRows);

/* ---------- onglets ---------- */
const TABS = [['tabD','paneD'],['tabC','paneC'],['tabL','paneL']];
function selectTab(b){
  curTab = b;
  TABS.forEach(([b2,p2])=>{
    document.getElementById(b2).setAttribute('aria-selected', b2===b);
    document.getElementById(p2).hidden = (b2!==b);
  });
  savePrefs();
}
TABS.forEach(([b])=>document.getElementById(b).addEventListener('click',()=>selectTab(b)));

function setMode(m){
  mode = m;
  document.getElementById('mMW').setAttribute('aria-pressed', m==='mw');
  document.getElementById('mMAT').setAttribute('aria-pressed', m==='mat');
  document.getElementById('mESP').setAttribute('aria-pressed', m==='esp');
  document.getElementById('mSYN').setAttribute('aria-pressed', m==='syn');
  document.getElementById('synW').hidden = m!=='syn';
  buildUsedIn(); renderTexts(); renderAll();
}
document.getElementById('mMW').addEventListener('click', ()=>setMode('mw'));
document.getElementById('mMAT').addEventListener('click', ()=>setMode('mat'));
document.getElementById('mESP').addEventListener('click', ()=>setMode('esp'));
document.getElementById('mSYN').addEventListener('click', ()=>setMode('syn'));
function drawSynW(){
  const w = synPoids();
  document.querySelectorAll('#synW input').forEach(el=>{ el.value = synW[el.dataset.k];
    el.nextElementSibling.textContent = pc(w[el.dataset.k]); });
}
function setSynW(w){ synW = w; SYN_WC = synPoids(); drawSynW(); buildUsedIn(); renderTexts(); renderAll(); }
document.querySelectorAll('#synW input').forEach(el=>el.addEventListener('input', ()=>{
  setSynW(Object.assign({}, synW, {[el.dataset.k]: +el.value})); }));
document.getElementById('synEq').addEventListener('click', ()=>setSynW({mw: 5, mat: 5, esp: 5}));

/* textes posés par script : suivent le sélecteur de langue commun */
const SORT_LB = {i:['Indice ↓','Index ↓'], g:['Gain vs base ↓','Gain vs standard ↓'], t:['Tier ↑','Tier ↑']};
function applyStaticLang(){
  const rb = document.getElementById('resetPrefs');
  rb.textContent = FicsitLang.t('reset'); rb.title = FicsitLang.t('resetTitle');
  const cl = document.getElementById('copierLien'); cl.textContent = FicsitLang.t('lien'); cl.title = FicsitLang.t('lienTitre');
  document.querySelectorAll('#sortSel option').forEach(o=>{ o.textContent = tr(...SORT_LB[o.value]); });
  const ro = document.getElementById('readout');
  if(ro.dataset.n){ const r = D.find(x=>x.n===ro.dataset.n); if(r) ro.innerHTML =
    `${ico(r.p)}<b>${RC_(r.n)}</b> — ${IT_(r.p)} · tier ${r.t} · ${SYM()} = ${nf(IDX(r))}`; }
}
FicsitLang.on(l=>{ lang = l; applyStaticLang(); renderTexts(); renderTierPick(); renderPartie(); drawPicked();
  if(!dropEl.hidden) drawDrop(); renderAll(); });

function renderAll(){ renderSpectrum(); renderStats(); renderTiers(); renderDuels(); renderCombi(); renderRows(); renderPartieListes(); }
document.getElementById('resetPrefs').addEventListener('click', ()=>{
  try{ localStorage.removeItem(PREFS_KEY); }catch(e){} location.reload();
});

/* lien partageable : #m=syn&t=6&i=Motor|Rotor&o=tabC&f=alt&s=gain&w=5,5,5&q=… — une vue (critère, palier, items,
   onglet, filtre, tri, poids, recherche), jamais la partie du joueur. Lu une fois au chargement, par-dessus les
   réglages mémorisés, puis retiré de l'adresse. */
const LIEN = ['m', 't', 'i', 'o', 'f', 's', 'w', 'q'];
function lienVue(){
  const u = new URLSearchParams({m: mode, t: cap, o: curTab, f: filt, s: sort});
  if(picked.length) u.set('i', picked.join('|'));
  if(mode === 'syn') u.set('w', SYN_K.map(k => synW[k]).join(','));
  const q = document.getElementById('q').value; if(q) u.set('q', q);
  return location.href.split('#')[0] + '#' + u.toString();
}
function lienLu(){
  const h = new URLSearchParams(location.hash.slice(1)), o = {};
  if(!LIEN.some(k => h.has(k))) return null;
  if(h.has('m')) o.mode = h.get('m');
  if(h.has('t')) o.cap = +h.get('t');
  if(h.has('i')) o.picked = h.get('i').split('|');
  if(h.has('o')) o.tab = h.get('o');
  if(h.has('f')) o.filt = h.get('f');
  if(h.has('s')) o.sort = h.get('s');
  if(h.has('q')) o.q = h.get('q');
  if(h.has('w')){ const w = h.get('w').split(',').map(Number); if(w.length === 3) o.synW = {mw: w[0], mat: w[1], esp: w[2]}; }
  history.replaceState(null, '', location.href.split('#')[0]);
  return o;
}
document.getElementById('copierLien').addEventListener('click', async e => {
  const b = e.currentTarget, url = lienVue();
  try{ await navigator.clipboard.writeText(url); }catch(_){ prompt(FicsitLang.t('lien'), url); }
  b.textContent = FicsitLang.t('lienCopie'); setTimeout(() => { b.textContent = FicsitLang.t('lien'); }, 2000);
});

/* restauration des réglages mémorisés (et d'un lien partagé, prioritaire) */
{
  const LU = lienLu(), P_ = Object.assign({}, PREFS, LU || {}), arr = v => Array.isArray(v) ? v : [];
  if(LU && 'cap' in LU) P_.partieLu = PARTIE ? PARTIE.lu : P_.partieLu;   // palier du lien, pas celui de la partie
  if(['mw','mat','esp','syn'].includes(P_.mode)) mode = P_.mode;
  document.getElementById('mMW').setAttribute('aria-pressed', mode==='mw');
  document.getElementById('mMAT').setAttribute('aria-pressed', mode==='mat');
  document.getElementById('mESP').setAttribute('aria-pressed', mode==='esp');
  document.getElementById('mSYN').setAttribute('aria-pressed', mode==='syn');
  document.getElementById('synW').hidden = mode!=='syn';
  if(P_.synW && SYN_K.every(k=>Number.isInteger(P_.synW[k]) && P_.synW[k]>=0 && P_.synW[k]<=10)) synW = Object.assign({}, P_.synW);
  SYN_WC = synPoids(); drawSynW();
  if(Number.isInteger(P_.cap) && P_.cap>=0 && P_.cap<=TMAX) cap = P_.cap;
  if(typeof P_.partieLu === 'string') partieLu = P_.partieLu;
  if(PARTIE && partieLu !== PARTIE.lu){ partieLu = PARTIE.lu; cap = Math.min(TMAX, FicsitPartie.palier(PARTIE) || TMAX); }   // palier de la partie, une fois par import
  if(P_.partie === true && PARTIE){ FILTRE = permises(); RD = new Map(D.map(r => [r.n, r])); SIMK = simSeules(); }
  if(P_.panneau === true) panneauOuvert = true;
  picked = arr(P_.picked).filter(n=>allItems.includes(n));
  if(typeof P_.onlyBetter==='boolean'){ onlyBetter = P_.onlyBetter; document.getElementById('onlyBetter').checked = onlyBetter; }
  if(['all','alt','std'].includes(P_.filt)) filt = P_.filt;
  document.querySelectorAll('.controls button').forEach(x=>x.setAttribute('aria-pressed', x.dataset.f===filt));
  const ss = document.getElementById('sortSel');
  if([...ss.options].some(o=>o.value===P_.sort)){ sort = P_.sort; ss.value = sort; }
  if(typeof P_.q==='string') document.getElementById('q').value = P_.q;
  arr(P_.openGrp).forEach(k=>openGrp.add(k));
  arr(P_.openCb).forEach(k=>openCb.add(k));
  arr(P_.openRows).forEach(k=>openRows.add(k));
  if(P_.seqPick && typeof P_.seqPick==='object') for(const k in P_.seqPick) if(Number.isInteger(P_.seqPick[k])) seqPick[k] = P_.seqPick[k];
  if(P_.seqRate && typeof P_.seqRate==='object') for(const k in P_.seqRate) if(+P_.seqRate[k]>0) seqRate[k] = +P_.seqRate[k];
  selectTab(TABS.some(([b])=>b===P_.tab) ? P_.tab : 'tabD');
}
applyStaticLang(); buildUsedIn(); renderTexts(); renderTierPick(); renderPartie(); drawPicked(); renderAll();
if(panneauOuvert) ouvrirPanneau(true, false);
prefsReady = true; savePrefs();
