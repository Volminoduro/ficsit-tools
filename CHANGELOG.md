# Journal des révisions

Généré depuis `changelog.json` par `scripts/patchnotes.py` — ne pas éditer à la main.

## Registre des rendements / Yield registry — `satisfactory_infographie.html`

- **v1.12** (24/09/2026) : Paliers des recettes du MAM recalculés depuis l'arbre de recherche du wiki officiel et le coût de chaque recherche : la plupart des recherches de départ (Caterium, Quartz, protéines, Quickwire) sortent dès le palier 1 ou 2 au lieu de 3, Compacted Coal passe au palier 2. Mode Espace : emprises des bâtiments reprises du wiki (Assembler 9 × 16, Refinery 10 × 22, Smelter 5 × 10…) et azote compté sur l'ensemble des puits du monde. Combinaisons recalculées.
  *EN — MAM recipe tiers recomputed from the official wiki's research tree and each research's cost: most starting research (Caterium, Quartz, proteins, Quickwire) now comes at tier 1 or 2 instead of 3, Compacted Coal moves to tier 2. Space mode: building footprints taken from the wiki (Assembler 9 × 16, Refinery 10 × 22, Smelter 5 × 10…) and nitrogen counted over all the world's wells. Combinations recomputed.*
- **v1.11** (24/09/2026) : Noms français pour toutes les recettes, alternatives comprises (160 noms ajoutés d'après la localisation officielle du jeu), et pour les restes d'aliens. La mention sur les noms restés en anglais disparaît.
  *EN — French names for every recipe, alternates included (160 names added from the game's official localization), and for alien remains. The note about names left in English is gone.*
- **v1.10** (24/09/2026) : Nouveau critère « Espace » : chaque recette et chaque combinaison notée en sortie par m² au sol, machines et extraction surcadencées à 250 % (éclats de charge, sans Somersloop). Emprises des bâtiments relevées à la main ; convoyeurs et allées non comptés.
  *EN — New "Space" criterion: every recipe and combination rated by output per floor m², machines and extraction overclocked to 250% (power shards, no Somersloop). Building footprints recorded by hand; belts and walkways not counted.*
- **v1.9** (24/09/2026) : Noms français ajoutés : Foreuse portable, Restes de dardeuse, Restes de sanglier alien, Restes de cracheur.
  *EN — French names added: Foreuse portable, Restes de dardeuse, Restes de sanglier alien, Restes de cracheur.*
- **v1.8** (24/09/2026) : Le journal des révisions quitte le bas de page : un badge de version en haut à droite, à côté des drapeaux, le déroule d'un clic. Une pastille signale une version pas encore vue, et les nouveautés sont marquées dans le journal. Page allégée de 87 Ko (données précalculées inutilisées retirées).
  *EN — The revision log leaves the page footer: a version badge at the top right, next to the flags, opens it in one click. A dot flags a version you haven't seen yet, and new entries are marked in the log. Page 87 KB lighter (unused precomputed data removed).*
- **v1.7** (24/09/2026) : Paliers des alternatives de disque dur calculés depuis les recherches du MAM qu'elles exigent, au lieu d'un plancher au palier 1 : Cheap Silica, Fine Concrete, Fine Black Powder et Compacted Coal passent du palier 2 au palier 3. Combinaisons par palier recalculées.
  *EN — Tiers of hard drive alternates now computed from the MAM research they require, instead of a tier 1 floor: Cheap Silica, Fine Concrete, Fine Black Powder and Compacted Coal move from tier 2 to tier 3. Per-tier combinations recomputed.*
- **v1.6** (24/09/2026) : Registre des combinaisons sans plafond de palier désormais recalculé par script depuis les recettes de la page, comme les combinaisons par palier. Nombre de chaînes distinctes recompté par énumération complète (ex. Concrete 47 → 77, Rotor 19 688 → 32 528) et plafond relevé à un million : Modular Frame et High-Speed Connector gardent leur pire chaîne. Pire chaîne de Circuit Board corrigée (0,056 → 0,055).
  *EN — Combination registry without a tier cap now recomputed by script from the page's recipes, like the per-tier combinations. Number of distinct chains recounted by full enumeration (e.g. Concrete 47 → 77, Rotor 19,688 → 32,528) and cap raised to one million: Modular Frame and High-Speed Connector keep their worst chain. Circuit Board's worst chain corrected (0.056 → 0.055).*
- **v1.5** (23/09/2026) : Paliers de déblocage recalculés depuis un référentiel unique : 29 recettes changent de palier, dont des alternatives affichées jusqu'ici comme jouables trop tôt (Sloppy Alumina 5 → 7, Steel Canister 3 → 5) et les recettes SAM, jusqu'ici au palier 0. Les combinaisons optimales par palier ont été recalculées en conséquence.
  *EN — Unlock tiers recomputed from a single reference dataset: 29 recipes change tier, including alternates shown as playable too early until now (Sloppy Alumina 5 → 7, Steel Canister 3 → 5) and the SAM recipes, previously at tier 0. Optimal combinations per tier were recomputed accordingly.*
- **v1.4** (22/09/2026) : Interface entièrement bilingue : textes, notes, séquences et journal suivent le drapeau FR/EN commun à tous les outils, en haut à droite. En français, items, recettes de base et bâtiments portent leur nom du jeu ; les recettes alternatives, et quelques recettes de base sans traduction vérifiée, gardent leur nom anglais.
  *EN — Fully bilingual interface: texts, notes, sequences and log follow the FR/EN flag shared by every tool, top right. In French, items, standard recipes and buildings use their in-game names; alternate recipes, and a few standard recipes with no verified translation, keep their English names.*
- **v1.3** (22/09/2026) : Vos réglages sont mémorisés d'une visite à l'autre (critère, langue, palier, items cochés, onglet, filtres, séquences et cadences), avec un bouton Réinitialiser. La note du sélecteur de palier suit la langue des noms.
  *EN — Your settings are remembered between visits (criterion, language, tier, checked items, tab, filters, sequences and rates), with a Reset button. The tier picker note follows the item-name language.*
- **v1.2** (21/09/2026) : Filtre par palier atteint : recettes, alternatives et combinaisons se limitent à ce qui est réellement jouable au palier choisi. Correction de cinq optimums du mode Matière (famille du moteur).
  *EN — Tier reached filter: recipes, alternates and combinations are limited to what is actually playable at the chosen tier. Fixed five optima in Materials mode (motor family).*
- **v1.1** (15/09/2026) : Combinaisons : chaque chaîne du podium se déroule étape par étape, de l'extraction à la cible, avec machines, horloges et coproduits. La séquence s'affiche au clic.
  *EN — Combinations: each podium chain unfolds step by step, from extraction to target, with machines, clock speeds and by-products. The sequence shows on click.*
- **v1.0** (05/09/2026) : Première version : chaque recette notée en sortie par mégawatt (Énergie) et par matière brute (Matière), onglets Duels, Combinaisons et Catalogue, filtre multi-items et noms français.
  *EN — First release: every recipe scored on output per megawatt (Energy) and per raw resource (Materials), with Duels, Combinations and Catalogue tabs, a multi-item filter and French names.*

## Module d'étalonnage / Calibration module — `ficsit_horloge.html`

- **v1.4** (24/09/2026) : Mention en bas de page : le site est généré par IA.
  *EN — Footer notice: the site is AI-generated.*
- **v1.3** (24/09/2026) : Le journal des révisions quitte le bas de page : un badge de version en haut à droite, à côté des drapeaux, le déroule d'un clic. Une pastille signale une version pas encore vue, et les nouveautés sont marquées dans le journal.
  *EN — The revision log leaves the page footer: a version badge at the top right, next to the flags, opens it in one click. A dot flags a version you haven't seen yet, and new entries are marked in the log.*
- **v1.2** (22/09/2026) : La langue se choisit désormais avec le drapeau FR/EN commun à tous les outils, en haut à droite. Noms de bâtiments, formule et fourchettes de consommation traduits.
  *EN — Language is now set with the FR/EN flag shared by every tool, top right. Building names, formula and consumption ranges translated.*
- **v1.1** (22/09/2026) : Vos réglages sont mémorisés d'une visite à l'autre (bâtiment, T, puissance de base, régime de shards, langue), avec un bouton Réinitialiser.
  *EN — Your settings are remembered between visits (building, T, base power, shard regime, language), with a Reset button.*
- **v1.0** (14/09/2026) : Première version : pour un besoin T en machines-équivalent, toutes les répartitions possibles avec horloge, shards, MW et écart à la répartition sans shard. Régime shards rares ou illimités, mode linéaire des générateurs, bascule FR/EN.
  *EN — First release: for a need of T machine-equivalents, every possible split with clock speed, shards, MW and gap to the shard-free split. Scarce or unlimited shard regime, linear mode for generators, FR/EN toggle.*

## Optimiseur de recyclage / Recycling optimizer — `broyeur-excedents.html`

- **v1.10** (24/09/2026) : Rangé avec « Complexité et valeur au broyeur » dans la catégorie Recyclage de l'accueil. Mention en bas de page : le site est généré par IA.
  *EN — Grouped with "Complexity vs sink value" under Recycling on the home page. Footer notice: the site is AI-generated.*
- **v1.9** (24/09/2026) : Paliers des recettes du MAM recalculés depuis l'arbre de recherche du wiki officiel et le coût de chaque recherche : la plupart des recherches de départ (Caterium, Quartz, protéines, Quickwire) sortent dès le palier 1 ou 2 au lieu de 3, Compacted Coal passe au palier 2.
  *EN — MAM recipe tiers recomputed from the official wiki's research tree and each research's cost: most starting research (Caterium, Quartz, proteins, Quickwire) now comes at tier 1 or 2 instead of 3, Compacted Coal moves to tier 2.*
- **v1.8** (24/09/2026) : Noms français pour toutes les recettes, alternatives comprises (160 noms ajoutés d'après la localisation officielle du jeu), et pour les restes d'aliens. La mention sur les noms restés en anglais disparaît du pied de page.
  *EN — French names for every recipe, alternates included (160 names added from the game's official localization), and for alien remains. The note about names left in English is gone from the footer.*
- **v1.7** (24/09/2026) : Les recettes alternatives s'affichent sans le préfixe anglais « Alternate: », suivies de la mention « (alternative) ». Noms français ajoutés : Foreuse portable, Restes de dardeuse, Restes de sanglier alien, Restes de cracheur.
  *EN — Alternate recipes are shown without the "Alternate:" prefix, followed by "(alternate)". French names added: Foreuse portable, Restes de dardeuse, Restes de sanglier alien, Restes de cracheur.*
- **v1.6** (24/09/2026) : Le journal des révisions quitte le bas de page : un badge de version en haut à droite, à côté des drapeaux, le déroule d'un clic. Une pastille signale une version pas encore vue, et les nouveautés sont marquées dans le journal.
  *EN — The revision log leaves the page footer: a version badge at the top right, next to the flags, opens it in one click. A dot flags a version you haven't seen yet, and new entries are marked in the log.*
- **v1.5** (24/09/2026) : Compacted Coal passe du tier 2 au tier 3 : sa recherche au MAM vient après celle de la poudre noire.
  *EN — Compacted Coal moves from tier 2 to tier 3: its MAM research comes after Black Powder's.*
- **v1.4** (24/09/2026) : Données recalculées par script depuis le référentiel commun. Les recettes retenues ne changent pas, mais minerai neuf et machines se lisent désormais sur la chaîne affichée (celle qui consomme le moins de MW) au lieu d'être minimisés chacun de leur côté : ils augmentent souvent (AI Limiter : 7,3 → 22 minerai/min par unité). Tiers alignés sur les autres outils, dont Circuit Board 3 → 5, Motor 7 → 8, Electromagnetic Control Rod 6 → 8.
  *EN — Data recomputed by script from the shared reference dataset. Selected recipes are unchanged, but new ore and machines are now read from the displayed chain (the one that draws the fewest MW) instead of each being minimized separately: they often go up (AI Limiter: 7.3 → 22 ore/min per unit). Tiers aligned with the other tools, including Circuit Board 3 → 5, Motor 7 → 8, Electromagnetic Control Rod 6 → 8.*
- **v1.3** (22/09/2026) : La langue se choisit désormais avec le drapeau FR/EN commun à tous les outils, en haut à droite. Les noms d'items et de recettes de base passent en français, et les nombres suivent le format de la langue.
  *EN — Language is now set with the FR/EN flag shared by every tool, top right. Item and standard recipe names now switch to French, and numbers follow the language's format.*
- **v1.2** (22/09/2026) : Excédents, débits, tri, filtres et langue sont mémorisés d'une visite à l'autre, avec un bouton Réinitialiser. Corrigé : la bascule FR/EN ne plante plus et le filtre de palier n'est plus remis à « tous » au changement de langue.
  *EN — Surpluses, rates, sorting, filters and language are remembered between visits, with a Reset button. Fixed: the FR/EN toggle no longer crashes and the tier filter no longer resets to “all” when switching language.*
- **v1.1** (14/09/2026) : Bascule FR/EN de l'interface et des noms d'items.
  *EN — FR/EN toggle for the interface and item names.*
- **v1.0** (02/09/2026) : Première version : à partir des excédents saisis, classement des cibles du broyeur AWESOME par points gagnés par mégawatt investi, avec filtres de palier et de minerai supplémentaire.
  *EN — First release: from the surpluses you enter, AWESOME Sink targets ranked by points earned per megawatt invested, with tier and extra-ore filters.*

## Mémo de terrain / Field memo — `memo-ficsit.html`

- **v1.3** (24/09/2026) : Mention en bas de page : le site est généré par IA.
  *EN — Footer notice: the site is AI-generated.*
- **v1.2** (24/09/2026) : Le journal des révisions quitte le bas de page : un badge de version en haut à droite, à côté des drapeaux, le déroule d'un clic. Une pastille signale une version pas encore vue, et les nouveautés sont marquées dans le journal.
  *EN — The revision log leaves the page footer: a version badge at the top right, next to the flags, opens it in one click. A dot flags a version you haven't seen yet, and new entries are marked in the log.*
- **v1.1** (22/09/2026) : Version anglaise complète, via le drapeau FR/EN commun à tous les outils. Noms de bâtiments alignés sur la localisation française du jeu, et huit recettes corrigées dans l'arbre des pièces de projet (batterie, turbomoteur, cube de conversion de pression…).
  *EN — Full English version, via the FR/EN flag shared by every tool. Building names aligned with the game's French localization, and eight recipes fixed in the project parts tree (battery, turbo motor, pressure conversion cube…).*
- **v1.0** (31/08/2026) : Première version : extraction par pureté de nœud et par horloge, cadences des convoyeurs, déblocages du HUB par palier et arborescence des pièces d'Ascenseur spatial.
  *EN — First release: extraction by node purity and clock speed, conveyor belt rates, HUB unlocks by tier and the Space Elevator parts tree.*

## Complexité et valeur au broyeur / Complexity vs sink value — `arbre-production.html`

- **v1.3** (24/09/2026) : Nouveau nom, « Complexité et valeur au broyeur », rangé avec l'optimiseur dans la catégorie Recyclage de l'accueil. Les minerais bruts solides (fer, cuivre, calcaire, charbon, caterium, quartz, soufre, bauxite, uranium, SAM) figurent désormais, à profondeur 0. Mention en bas de page : le site est généré par IA.
  *EN — New name, "Complexity vs sink value", grouped with the optimizer under Recycling on the home page. Solid raw ores (iron, copper, limestone, coal, caterium, quartz, sulfur, bauxite, uranium, SAM) are now listed, at depth 0. Footer notice: the site is AI-generated.*
- **v1.2** (24/09/2026) : Paliers des recettes du MAM recalculés depuis l'arbre de recherche du wiki officiel et le coût de chaque recherche : la plupart des recherches de départ (Caterium, Quartz, protéines, Quickwire) sortent dès le palier 1 ou 2 au lieu de 3, Compacted Coal passe au palier 2.
  *EN — MAM recipe tiers recomputed from the official wiki's research tree and each research's cost: most starting research (Caterium, Quartz, proteins, Quickwire) now comes at tier 1 or 2 instead of 3, Compacted Coal moves to tier 2.*
- **v1.1** (24/09/2026) : Noms français pour toutes les recettes, alternatives comprises (160 noms ajoutés d'après la localisation officielle du jeu), et pour les restes d'aliens.
  *EN — French names for every recipe, alternates included (160 names added from the game's official localization), and for alien remains.*
- **v1.0** (24/09/2026) : Première version : profondeur de l'arbre de production et nombre d'items intermédiaires de chaque item broyable, face à sa valeur AWESOME, en recettes de base ou en chaîne optimisée (MW), filtrable par palier.
  *EN — First release: production tree depth and number of intermediate items for every sinkable item, against its AWESOME value, with standard recipes or the optimized (MW) chain, filterable by tier.*
