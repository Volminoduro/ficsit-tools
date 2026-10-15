# Journal des révisions

Généré depuis `changelog.json` par `scripts/patchnotes.py` — ne pas éditer à la main.
Version x.y.0 : fonctionnalité ; x.y.z : ajustement ; x.y.z.w : correctif de bug (rangé sous l'ajustement z).

## Site / Site — journal commun

### v1.8.0 — Journal refondu (15/10/2026)

Le journal distingue trois niveaux : fonctionnalités (pastille orange qui pulse), ajustements (point gris) et correctifs (discrets, rangés sous l'ajustement concerné). Les changements du site entier ont leur propre journal « Site », en bas du panneau, au lieu d'être répétés dans chaque outil.

*EN — Revised log. The log now has three levels: features (pulsing orange dot), adjustments (grey dot) and fixes (discreet, filed under the adjustment they belong to). Site-wide changes have their own “Site” log, at the bottom of the panel, instead of being repeated in every tool.*

### v1.7.0 — Un site en une seule page (06/10/2026)

Le site devient une seule page à onglets : changer d'outil n'en recharge plus aucun, chaque outil reste ouvert à côté des autres et retrouve son état (défilement, zoom, saisies) quand on y revient. L'adresse suit l'outil affiché, et « Précédent » ramène à l'outil d'avant.

*EN — A single-page site. The site becomes a single page with tabs: switching tools no longer reloads anything, each tool stays open next to the others and keeps its state (scroll, zoom, inputs) when you come back. The address follows the tool on screen, and “Back” returns to the previous tool.*

- **1.7.4** (06/10/2026) : Une seule barre de titre pour tout le site ; le journal de la barre est celui de l'outil affiché.
  *EN — A single title bar for the whole site; the changelog in the bar is the one of the tool on screen.*
- **1.7.3** (06/10/2026) : Plus d'écran noir en changeant d'outil : l'outil courant reste affiché, avec un liseré de chargement, jusqu'à ce que le suivant soit prêt.
  *EN — No more black screen when switching tools: the current tool stays on screen, with a loading line, until the next one is ready.*
- **1.7.2** (06/10/2026) : Les autres outils s'ouvrent en arrière-plan, un à un : même à la première visite, un onglet s'affiche aussitôt.
  *EN — The other tools open in the background, one by one: even on a first visit, a tab shows at once.*
- **1.7.1** (06/10/2026) : Changer d'outil ne fait plus clignoter la page : le contenu passe en fondu et l'outil survolé est préparé à l'avance (Chrome et Edge).
  *EN — Switching tools no longer makes the page flicker: the content fades across and a hovered tool is prepared ahead (Chrome and Edge).*

### v1.6.0 — Barre de titre à onglets (04/10/2026)

La barre de titre porte désormais des onglets vers tous les outils : plus besoin de repasser par l'accueil pour changer d'outil (outil courant en orange ; losange = outil en chantier). Sur écran étroit, ils se replient dans un menu « Outils ».

*EN — Title bar with tabs. The title bar now carries tabs to every tool, so there is no need to go back through the home page to switch (current tool in orange; diamond = work in progress). On narrow screens they fold into a “Tools” menu.*

- **1.6.1** (05/10/2026) : Le bouton « Accueil » passe à gauche de la barre de titre, avant les onglets des outils.
  *EN — The “Home” button moves to the left of the title bar, before the tool tabs.*

### v1.5.0 — Infobulles de la charte (04/10/2026)

Les bulles d'aide (au survol des boutons, icônes et étiquettes) prennent l'habillage de la charte : fenêtre sombre sous un filet orange, titre en blanc, détail en gris, à la place de la bulle du navigateur. Elles s'affichent aussi au clavier.

*EN — Style-guide tooltips. Help bubbles (on hover over buttons, icons and tags) now use the style guide's look: a dark window under an orange line, white heading, grey detail, instead of the browser's own bubble. They also show with the keyboard.*

- **1.5.1** (07/10/2026) : Infobulles au tactile (appui long de 0,5 s) et contraste renforcé quand le système le demande.
  *EN — Tooltips on touch screens (0.5 s long press) and higher contrast when the system asks for it.*
  - correctif **1.5.0.1** (06/10/2026) : Une bulle avec le nom du fichier de l'outil (« planner.html »…) suivait le curseur partout sur la page.
    *EN — A bubble with the tool's file name (“planner.html”…) followed the cursor all over the page.*

### v1.4.0 — Habillage des menus du jeu (02/10/2026)

Habillage au plus près des menus du jeu : fenêtres gris neutre à barre de titre, coins droits, orange du jeu pour la sélection et les valeurs, police Noto Sans embarquée dans le site (même rendu hors ligne), filet orange du HUD à la place des hachures. Les boutons du haut forment une barre de titre pleine largeur ; couleurs et polices viennent d'une charte commune.

*EN — Game-menu look. Look brought as close as possible to the game's menus: neutral grey windows with a title bar, square corners, the game's orange for selection and values, the Noto Sans typeface shipped with the site (same look offline), the HUD's orange line instead of hazard stripes. The top buttons form a full-width title bar; colours and fonts come from one style sheet shared by every tool.*

### v1.3.0 — Fonctionnement hors ligne (30/09/2026)

Le site fonctionne hors ligne : une fois une page visitée, elle et ses fichiers sont gardés par le navigateur, pour garder l'outil ouvert à côté du jeu même sans connexion.

*EN — Offline use. The site works offline: once a page has been visited, it and its files are kept by the browser, so the tool stays usable next to the game even without a connection.*

### v1.2.0 — Ma partie, commune à tous les outils (29/09/2026)

Bouton « Ma partie » en haut à droite de chaque outil et de l'accueil : un seul endroit pour importer sa sauvegarde, que tous les outils reprennent aussitôt. L'accueil résume la partie importée.

*EN — “My game”, shared by every tool. “My game” button at the top right of every tool and of the home page: one place to import your save, which every tool picks up at once. The home page summarises the imported game.*

- **1.2.1** (29/09/2026) : Le français emploie les termes du jeu : « cadence », « surcadençage », « sous-cadençage », « éclats de charge ».
  *EN — The French text uses the game's own terms for clock speed, overclocking and power shards. English unchanged.*

### v1.1.0 — Bouton Accueil (25/09/2026)

Bouton « Accueil » dans le dock en haut à droite, pour revenir à la liste des outils.

*EN — Home button. “Home” button in the top-right dock, to go back to the list of tools.*

### v1.0.0 — Journal des révisions (24/09/2026)

Le journal des révisions quitte le bas de page : un badge de version en haut à droite, à côté des drapeaux, le déroule d'un clic. Une pastille signale une version pas encore vue, et les nouveautés sont marquées dans le journal.

*EN — Revision log. The revision log leaves the page footer: a version badge at the top right, next to the flags, opens it in one click. A dot flags a version you haven't seen yet, and new entries are marked in the log.*

## Planificateur de production / Production planner — `planner.html`

### v1.14.0 — Alternatives toujours disponibles (10/10/2026)

Plus de case « Alternatives » : les recettes alternatives sont toujours proposées sur un bloc (menu ⇄ et liste), en mode standard comme optimisé. La recette par défaut reste la standard tant que vous n'en choisissez pas une autre, et l'optimisation continue de les comparer toute seule.

*EN — Alternates always available. No more “Alternates” checkbox: alternate recipes are always offered on a block (⇄ menu and list), in standard as in optimised mode. The default stays the standard recipe until you choose another, and optimisation still compares them on its own.*

### v1.13.0 — Ignorer ma partie (10/10/2026)

Case « Ignorer ma partie pour ce plan » dans les réglages (visible avec une partie importée) : le plan se calcule comme sans sauvegarde (palier et alternatives au choix, pas de comparaison avec l'usine), sans toucher à l'import ni aux autres plans. Le choix est propre à l'onglet et repris dans l'adresse partageable.

*EN — Ignore my game. “Ignore my game for this plan” checkbox in the settings (shown with an imported game): the plan is computed as without a save (tier and alternates your choice, no factory comparison), without touching the import or other plans. The choice belongs to the tab and is kept in the shareable address.*

### v1.12.0 — Points Awesome Sink (08/10/2026)

Le récap indique les points par minute du surplus s'il est broyé, et de tout ce que le plan produit si tout est broyé ; chaque bloc de surplus affiche ses points.

*EN — Awesome Sink points. The summary shows the points per minute of the surplus if it is sunk, and of everything the plan produces if everything is sunk; each surplus block shows its points.*

- **1.12.4** (09/10/2026) : Un bloc en recette alternative porte le nom de sa recette (« Rotor en cuivre »…) ; un nom trop long est abrégé, en entier dans l'infobulle.
  *EN — A block on an alternate recipe carries the recipe's name (“Copper Rotor”…); a long name is shortened, in full in the tooltip.*
  - correctif **1.12.4.1** (09/10/2026) : Le nom d'un bloc ne chevauche plus ses boutons (changer de recette, replier).
    *EN — A block's name no longer overlaps its buttons (change recipe, fold).*
- **1.12.3** (09/10/2026) : Un grand plan déplié est plus fluide : les animations sont gelées pendant un défilement, un glissé ou un zoom.
  *EN — A big expanded plan is smoother: animations freeze during a scroll, drag or zoom.*
  - correctif **1.12.3.1** (09/10/2026) : Le menu de changement de recette s'ouvre de nouveau juste sous le bouton ⇄.
    *EN — The recipe-change menu opens right under the ⇄ button again.*
- **1.12.2** (09/10/2026) : Les blocs rangés à la main ne se recouvrent plus quand on déplie tout ou qu'une recette change.
  *EN — Blocks placed by hand no longer overlap when you expand everything or a recipe changes.*
  - correctif **1.12.2.1** (09/10/2026) : Changer la recette d'un bloc replié le laisse replié.
    *EN — Changing a folded block's recipe leaves it folded.*
- **1.12.1** (08/10/2026) : Montage en équilibrage plus lisible : le retour a son débit, des flèches et sa propre ligne ; les marques de source ne servent que si un poste a plusieurs sources.
  *EN — Balanced set-up easier to read: the return is drawn with its flow, arrows and its own spaced line; source marks only show when a station has several sources.*
  - correctif **1.12.1.1** (09/10/2026) : Un bloc sans sortie en trop n'affiche plus de retour fantôme (« ↺ 0 /min »).
    *EN — A block with no excess output no longer shows a ghost return (“↺ 0 /min”).*

### v1.11.0 — Sources scindées (08/10/2026)

Réglage « Sources » : en mode scindé, une ressource brute ou un produit intermédiaire au-delà de la ligne la plus forte du convoyeur débloqué se prend à plusieurs sources ou blocs, chacun remplissant au plus une ligne et servant des postes voisins dans la chaîne. Chaque source a sa couleur, sa lettre et son rail ; le bilan donne l'écart face à une seule source. Groupées par défaut.

*EN — Split sources. “Sources” setting: in split mode, a raw resource or intermediate product beyond the strongest unlocked conveyor line is taken from several sources or blocks, each filling at most one line and serving neighbouring stations in the chain. Each source has its own colour, letter and rail; the summary shows the gap against a single source. Grouped by default.*

### v1.10.0 — Extraction dans le plan (08/10/2026)

Le bloc de chaque ressource brute porte ses extracteurs (meilleur niveau débloqué, nombre, cadence, MW) et un bouton de pureté du nœud. Le réglage « Extraction » choisit la cadence : sans surcadençage ou jusqu'à 250 %. Consommation, espace et machines du bilan comptent l'extraction ; le convoyeur ou le tuyau le plus fort débloqué plafonne la cadence.

*EN — Extraction in the plan. Each raw resource block carries its extractors (best unlocked tier, count, clock speed, MW) and a node purity button. The “Extraction” setting picks the clock speed: no overclock or up to 250%. The summary's power, space and machines count extraction; the strongest unlocked conveyor or pipe caps the clock speed.*

### v1.9.0 — Items acheminés sur les convoyeurs (07/10/2026)

Une icône par unité avance sur les convoyeurs, à la vitesse de leur niveau : dans les montages dépliés (à partir de 80 % de zoom) et sur les liens qui sortent d'un bloc replié. Un item suit un trajet d'un seul tenant et choisit sa branche tour à tour à chaque séparateur ; le niveau de convoyeur (Mk) est écrit à chaque changement.

*EN — Items on the conveyors. One icon per unit moves along the conveyors, at their tier's speed: in expanded set-ups (from 80% zoom) and on links leaving a folded block. An item follows one continuous path and takes each splitter branch in turn; the conveyor tier (Mk) is written at every change.*

- **1.9.2** (07/10/2026) : Les sorties des machines sont toujours réunies par un seul collecteur (n − 1 groupeurs), quel que soit le montage des entrées.
  *EN — Machine outputs are always joined by a single collector (n − 1 mergers), whatever the input layout.*
- **1.9.1** (07/10/2026) : Montage déplié plus lisible : lignes d'entrée deux fois plus espacées, machines numérotées, textes de Mk sans recouvrir les convoyeurs.
  *EN — Expanded set-up easier to read: input lines twice as far apart, machines numbered, Mk labels clear of the conveyors.*

### v1.8.0 — Graphe plus lisible (06/10/2026)

Bien moins de flux qui se croisent (souvent de moitié) : chaque bloc est aligné sur ceux qu'il alimente et dont il dépend, et un flux qui saute plusieurs colonnes passe entre les blocs au lieu de les traverser. Survoler un bloc met en lumière toute sa chaîne, des ressources brutes aux objectifs.

*EN — More readable graph. Far fewer crossing flows (often half): each block lines up with the ones it feeds and depends on, and a flow skipping several columns passes between blocks instead of through them. Hovering a block highlights its whole chain, from raw resources to targets.*

- **1.8.3** (07/10/2026) : Objectif replié sur son bloc : quand une étape ne sert qu'un objectif, le cadre disparaît et le bloc porte un onglet « OBJECTIF ».
  *EN — Target folded onto its block: when a step feeds a single target, the frame goes and the block gets an “OBJECTIVE” tab.*
- **1.8.2** (06/10/2026) : Montage déplié : chaque ingrédient a sa ligne dessinée jusqu'aux machines, avec son nom, ses séparateurs et son convoyeur.
  *EN — Expanded set-up: each ingredient has its own line drawn to the machines, with its name, splitters and conveyor.*
- **1.8.1** (06/10/2026) : Les convoyeurs prennent les couleurs du mémo de terrain, du froid au chaud (Mk.1 ardoise… Mk.6 rouge).
  *EN — Conveyors use the field memo's colours, cold to hot (Mk.1 slate … Mk.6 red).*

### v1.7.0 — Plusieurs plans (06/10/2026)

Plusieurs plans à la fois, dans des onglets au-dessus des objectifs : « + » en ouvre un, double-clic ou ✎ le renomme, × le ferme ; chaque plan garde ses objectifs, ses recettes, son mode et sa disposition. Le plan affiché est inscrit dans l'adresse : envoyer le lien suffit pour le partager.

*EN — Several plans. Several plans at once, in tabs above the targets: “+” opens one, double-click or ✎ renames it, × closes it; each plan keeps its targets, recipes, mode and layout. The plan on screen is written in the address: sending the link is enough to share it.*

### v1.6.0 — Alternatives visibles et bandeau de réglages (05/10/2026)

Un bloc qui utilise une recette alternative porte un liseré et une pastille ALT, et le bilan les liste. Objectifs et réglages passent dans un bandeau en haut ; le choix des recettes devient une glissière (Standard, puis les modes optimisés), et les objectifs se choisissent dans une liste avec icônes et recherche.

*EN — Visible alternates and settings strip. A block using an alternate recipe gets an edge and an ALT badge, and the summary lists them. Targets and settings move into a strip at the top; the recipe choice becomes a slider (Standard, then the optimised modes), and targets are picked from a list with icons and search.*

- **1.6.2** (05/10/2026) : Les montages sont dépliés par défaut ; le bouton − d'un bloc le replie et la page s'en souvient.
  *EN — Set-ups are expanded by default; a block's − button folds it and the page remembers.*
- **1.6.1** (05/10/2026) : Le palier se choisit dans la même grille que les autres outils ; avec une partie importée, le palier atteint est sélectionné à chaque import.
  *EN — The tier is picked in the same grid as the other tools; with an imported game, the reached tier is selected on each import.*

### v1.5.0 — Trois optimisations et la synthèse (03/10/2026)

Trois optimisations, comme les critères de l'infographie : moins de matière, moins d'énergie et, nouveau, moins de place (m² au sol des machines). Une synthèse réunit les trois, avec un curseur de poids par critère. Le bilan donne la place au sol et, en mode optimisé, l'écart de chaque critère face à la chaîne standard.

*EN — Three optimisations and the synthesis. Three optimisations, like the infographic's criteria: less material, less energy and, new, less space (floor area of the machines). A synthesis combines the three, with a weight slider per criterion. The summary gives floor area and, in optimised mode, each criterion's gap against the standard chain.*

- **1.5.2** (06/10/2026) : Les modes optimisés suivent l'ordre de l'infographie : Énergie, Matière, Espace, puis Synthèse.
  *EN — Optimised modes follow the infographic's order: Energy, Material, Space, then Synthesis.*
- **1.5.1** (04/10/2026) : « Moins de place » compte des bâtiments entiers (une machine à 10 % prend autant de place qu'à 100 %) ; les optimisations sont mémorisées.
  *EN — “Less space” counts whole buildings (a machine at 10% takes as much room as at 100%); optimisations are remembered.*
  - correctif **1.5.1.1** (04/10/2026) : Sur une grosse chaîne, « moins d'énergie » ou « moins de place » pouvait laisser des items « à fournir » au lieu de les fabriquer.
    *EN — On a big chain, “less energy” or “less space” could leave items as “to supply” instead of making them.*

### v1.4.0 — Graphe en plein écran (03/10/2026)

L'outil devient un graphe en plein écran : réglages et bilan sur le bord gauche, détail du bloc choisi sur le bord droit, outils en bas ; chaque panneau se replie. La molette zoome autour du pointeur, le fond se fait glisser, « Ajuster » remplit la place libre. Les convoyeurs sont colorés par niveau, avec une légende.

*EN — Full-screen graph. The tool becomes a full-screen graph: settings and summary on the left edge, the selected block's detail on the right, tools at the bottom; every panel folds away. The wheel zooms around the pointer, the background drags, “Fit” fills the free space. Conveyors are coloured by tier, with a legend.*

- **1.4.1** (03/10/2026) : Les convoyeurs s'animent : les items défilent dans le sens du flux, plus vite aux niveaux supérieurs (coupé en mouvement réduit).
  *EN — Conveyors are animated: items move along the flow, faster on higher tiers (off with reduced motion).*

### v1.3.0 — Vue en graphe (02/10/2026)

Les étapes de production en blocs reliés par les débits, des ressources brutes (à gauche) aux objectifs et surplus (à droite). Chaque lien indique le convoyeur ou le tuyau qu'il lui faut. Le bouton + d'un bloc (ou « Tout déplier ») dessine son montage, séparateurs, machines et groupeurs, en manifold ou en équilibrage ; le bouton ⇄ (ou la touche R) change la recette depuis le graphe. Les blocs se déplacent à la souris, au doigt ou au clavier.

*EN — Graph view. Production steps as blocks linked by flow rates, from raw resources (left) to targets and surplus (right). Each link shows the conveyor or pipe it needs. A block's + button (or “Expand all”) draws its set-up, splitters, machines and mergers, in manifold or balanced layout; the ⇄ button (or the R key) changes the recipe from the graph. Blocks can be moved with the mouse, a finger or the keyboard.*

### v1.2.0 — Recettes optimisées (02/10/2026)

Le planificateur peut choisir lui-même les recettes, en combinant librement toutes celles qui sont permises, pour consommer le moins de ressources (pesées par leur rareté sur la carte) ou le moins d'énergie. Calcul exact par programmation linéaire (solveur HiGHS, chargé à la première optimisation puis gardé hors ligne). Une tuile du bilan donne la part des ressources de la carte que demande le plan.

*EN — Optimised recipes. The planner can choose recipes itself, freely mixing all the allowed ones, to use the fewest resources (weighted by their scarcity on the map) or the least energy. Exact linear programming (HiGHS solver, loaded on the first optimisation, then kept offline). A summary tile shows the share of the map's resources the plan needs.*

### v1.1.0 — Comparaison avec votre usine (02/10/2026)

Avec une partie importée, le planificateur lit les machines déjà construites et compare, étape par étape, ce qu'elles produisent (cadence et Somersloops compris) à ce que le plan demande : débit manquant et machines à construire, avec leur total dans le bilan. « Recettes de mon usine d'abord » choisit par défaut celles que vous avez déjà construites.

*EN — Comparison with your factory. With an imported game, the planner reads the machines you already built and compares, step by step, what they produce (clock speed and Somersloops included) with what the plan needs: missing rate and machines to build, totalled in the summary. “My factory's recipes first” picks the recipes you already built by default.*

### v1.0.0 — Objectifs et chaîne de production (01/10/2026)

Vos objectifs de production par minute, et la chaîne qui y mène jusqu'aux ressources brutes : pour chaque recette, le nombre de machines, leur consommation, ce qui entre et ce qui sort. Les sous-produits servent d'abord aux autres étapes, le reste part en surplus. Recette de chaque item au choix ; avec une partie importée, seules les recettes débloquées sont proposées.

*EN — Targets and production chain. Your production targets per minute, and the chain that leads to them down to raw resources: for each recipe, the number of machines, their power draw, what goes in and what comes out. By-products first feed other steps, the rest becomes surplus. Pick each item's recipe; with an imported game, only unlocked recipes are offered.*

## Débit vers le Dimensional Depot / Dimensional Depot throughput — `depot-dimensionnel.html`

### v1.15 — L'infobulle d'une ligne de l'inventaire se place près du curseur, comme la bu… (04/10/2026)

L'infobulle d'une ligne de l'inventaire se place près du curseur, comme la bulle du navigateur, au lieu de se centrer sur la ligne entière.

*EN — A row's tooltip in the inventory now sits near the cursor, like the browser's…. A row's tooltip in the inventory now sits near the cursor, like the browser's own bubble, instead of being centred on the whole row.*

### v1.13 — Le fichier de la partie est gardé tel quel (sur disque par le navigateur, san… (02/10/2026)

Le fichier de la partie est gardé tel quel (sur disque par le navigateur, sans copie en mémoire), avec un second stockage de secours si le premier refuse : une grosse sauvegarde importée depuis l'accueil est bien reprise ici. Si les deux refusent, le panneau « Ma partie » donne l'erreur exacte du navigateur.

*EN — The game file is kept as is (on disk by the browser, without an in-memory cop…. The game file is kept as is (on disk by the browser, without an in-memory copy), with a second fallback storage if the first refuses: a large save imported from the home page is picked up here. If both refuse, the "My game" panel gives the browser's exact error.*

### v1.12 — Sauvegarde importée depuis une autre page (accueil, autre outil)  (02/10/2026)

Sauvegarde importée depuis une autre page (accueil, autre outil) : l'outil la reprend aussi quand on y revient par le bouton « retour » du navigateur, et un import interrompu (page quittée avant la fin) ne fait plus perdre la partie précédente. Pendant l'enregistrement du fichier, le panneau « Ma partie » le signale et le navigateur demande confirmation avant de quitter la page.

*EN — Save imported from another page (home, another tool). Save imported from another page (home, another tool): the tool also picks it up when you come back with the browser's back button, and an interrupted import (page left before the end) no longer loses the previous game. While the file is being saved, the "My game" panel says so and the browser asks for confirmation before leaving the page.*

### v1.10 — Vue d'ensemble façon inventaire  (01/10/2026)

Vue d'ensemble façon inventaire : une ligne par item (Uploaders et stock du Depot réunis) avec le débit théorique, le plafond qui le limite (E : vitesse d'envoi, R : raccord, A : chaîne en amont), le stock, la limite et le temps avant plein ; un carré rouge signale un Depot plein, avec une légende. Le détail d'un item (plafonds, sources en amont) s'ouvre au clic, une infobulle le résume au survol. Les hypothèses et alertes du calcul sont repliées.

*EN — Inventory-style overview. Inventory-style overview: one row per item (Uploaders and Depot stock together) with the theoretical rate, the cap that limits it (E: upload speed, R: feed belt, A: upstream chain), the stock, the limit and the time until full; a red square flags a full Depot, with a legend. An item's details (caps, upstream sources) open on click, a tooltip sums them up on hover. The computation's assumptions and warnings are folded away.*

### v1.9 — Le débit affiché pour chaque item est désormais le débit théorique vers le De… (01/10/2026)

Le débit affiché pour chaque item est désormais le débit théorique vers le Depot (le plus petit des trois plafonds : vitesse d'envoi, raccord, chaîne en amont), que le Depot soit plein ou non. Avant, un item dont le Depot était plein affichait 0 /min en titre. Le plein est signalé à part, en rouge, et le tableau du stock donne aussi le débit théorique.

*EN — The rate shown for each item is now the theoretical rate into the Depot (the…. The rate shown for each item is now the theoretical rate into the Depot (the smallest of the three caps: upload speed, feed, upstream chain), whether the Depot is full or not. Before, an item whose Depot was full showed 0/min as its headline. Being full is flagged separately, in red, and the stock table also gives the theoretical rate.*

### v1.8 — Fluides et électricité par circuit (30/09/2026)

Fluides et électricité par circuit. Chaque réseau de tuyaux lu dans la sauvegarde devient un réservoir commun : extracteurs d'eau et de pétrole, puits, raffineries, conditionneuses et générateurs y versent ou y puisent, un fluide ne passant que par les tuyaux. Les machines sont désormais limitées par leurs fluides, les centrales à charbon et nucléaires par leur eau, et les générateurs à carburant comptent dans la production. Un réseau à qui il manque du fluide est signalé, avec la quantité manquante, ainsi qu'un réseau dont le débit dépasse son tuyau le plus faible. Chaque bâtiment est rattaché à son circuit : bilan par circuit, circuit en déficit ou sans générateur signalé, et un bâtiment sur un circuit dont le fusible a grillé, ou branché à aucun circuit, est compté à l'arrêt. Recoupement avec le jeu : 77 % des machines à 10 points près sur une grosse partie (74 % avant).

*EN — Fluids and power per circuit. Fluids and power per circuit. Each pipe network read from the save becomes a shared pool: water and oil extractors, resource wells, refineries, packagers and generators feed into it or draw from it, and a fluid only travels through pipes. Machines are now limited by their fluids, coal and nuclear plants by their water, and fuel generators count towards production. A network short of fluid is flagged, with the missing amount, as is a network whose flow exceeds its weakest pipe. Each building is tied to its circuit: balance per circuit, circuits in deficit or without a generator flagged, and a building on a circuit with a blown fuse, or connected to no circuit, is counted as stopped. Cross-check with the game: 77% of machines within 10 points on a large save (74% before).*

### v1.6 — Première visite plus rapide (~14 s au lieu de ~20 sur une grosse usine)  (30/09/2026)

Première visite plus rapide (~14 s au lieu de ~20 sur une grosse usine) : un seul modèle de l'usine au lieu de deux, le plafond « chaîne en amont » n'étant recalculé qu'en amont des Uploaders. Barre de progression pendant le calcul des débits.

*EN — Faster first visit (~14 s instead of ~20 on a large factory). Faster first visit (~14 s instead of ~20 on a large factory): a single factory model instead of two, the "upstream chain" cap being recomputed only upstream of the Uploaders. Progress bar while rates are computed.*

### v1.5 — Outil signalé « en chantier » dans son titre et sur l'accueil (29/09/2026)

Outil signalé « en chantier » dans son titre et sur l'accueil. Partie importée avant le bouton commun (fichier non gardé) : l'outil l'explique et propose un bouton « Réimporter ma sauvegarde ». Si le navigateur ne peut pas garder le fichier (navigation privée), il reste utilisable pendant la visite et le panneau le signale.

*EN — Tool marked "work in progress" in its title and on the home page. Tool marked "work in progress" in its title and on the home page. Game imported before the shared button (file not kept): the tool explains it and offers a "Re-import my save" button. If the browser cannot keep the file (private browsing), it stays usable during the visit and the panel says so.*

### v1.4 — Bouton « Ma partie » commun, en haut à droite de chaque outil et de l'accueil  (29/09/2026)

Bouton « Ma partie » commun, en haut à droite de chaque outil et de l'accueil : un seul endroit pour importer sa sauvegarde, que tous les outils reprennent aussitôt. L'accueil résume la partie importée. L'outil n'a plus son propre import : il relit le fichier gardé par le bouton commun, et garde l'usine et les débits calculés dans ce navigateur (une nouvelle visite s'affiche aussitôt).

*EN — Shared "My game" button, top right of every tool and the home page. Shared "My game" button, top right of every tool and the home page: one place to import your save, which every tool picks up at once. The home page summarises the imported game. The tool no longer has its own import: it rereads the file kept by the shared button, and keeps the computed factory and rates in this browser (a new visit shows at once).*

### v1.3 — Les trois plafonds de chaque Uploader sont affichés séparément, le plus bas e… (29/09/2026)

Les trois plafonds de chaque Uploader sont affichés séparément, le plus bas en évidence : vitesse d'envoi (recherches du MAM), raccord (le convoyeur ou l'ascenseur qui arrive dans l'Uploader, avec son Mk) et ce que la chaîne en amont peut fournir. Le débit vers le Depot est le plus petit des trois, 0 si le Depot est plein pour l'item. Un conteneur juste avant l'Uploader compte comme un tronçon de convoyeur : l'Uploader est servi d'abord.

*EN — Each Uploader's three caps are shown separately, the lowest highlighted. Each Uploader's three caps are shown separately, the lowest highlighted: upload speed (MAM research), feed (the belt or lift coming into the Uploader, with its Mk) and what the upstream chain can supply. The rate into the Depot is the smallest of the three, 0 if the Depot is full for that item. A container right before the Uploader counts as a belt section: the Uploader is served first.*

### v1.2 — Étape 3  (29/09/2026)

Étape 3 : régime actuel de l'usine. Un conteneur qui a encore de la place (contenu lu dans la sauvegarde) sert l'aval d'abord puis garde le surplus, avec le temps avant qu'il soit plein : le montage « production → conteneur industriel → Uploader » est compté comme en jeu. Gares, quais de camion et ports de drones : un réservoir commun par famille, ce qui est chargé ressort par ceux qui déchargent. Générateurs à combustible solide : consommation réelle (60 × MW × cadence / énergie du combustible). Bilan électrique estimé (production, consommation à la marche calculée) et fusibles grillés lus dans la sauvegarde.

*EN — Step 3. Step 3: the factory's current regime. A container with room left (contents read from the save) serves downstream first and keeps the surplus, with the time until it is full: the "production → industrial container → Uploader" setup is counted as in game. Train stations, truck stations and drone ports: one shared pool per family, what is loaded comes out of those that unload. Solid-fuel generators: actual consumption (60 × MW × clock speed / fuel energy). Estimated power balance (production, consumption at the computed run rates) and blown fuses read from the save.*

### v1.1 — Étape 2  (29/09/2026)

Étape 2 : débits théoriques en items/min. Chaque Uploader affiche son débit vers le Depot et ce qui le limite (vitesse d'envoi, Depot plein, production en amont), plus le débit potentiel si le Depot était plein. Calcul du régime permanent de toute l'usine, dans un Web Worker : pureté des nœuds (table de la carte, ou la sauvegarde si elle l'indique), cadence et Somersloops, machines limitées par leurs ingrédients et par la place en aval, plafonds des convoyeurs, séparateurs à parts égales avec les règles des séparateurs intelligents (excédent compris), vitesse d'envoi des Uploaders et limite du Depot par item. Le tableau du stock donne la limite, le débit et le temps avant plein ; un recoupement compare la marche calculée à la productivité mesurée par le jeu. Vocabulaire du jeu : « cadence » et « éclats de charge ».

*EN — Step 2. Step 2: theoretical rates in items/min. Each Uploader shows its rate into the Depot and what limits it (upload speed, Depot full, upstream production), plus the potential rate if the Depot were not full. Steady state of the whole factory, computed in a Web Worker: node purity (map table, or the save when it holds it), clock speed and Somersloops, machines limited by their ingredients and by room downstream, belt caps, even splits with smart splitter rules (overflow included), Uploader upload speed and the Depot's per-item limit. The stock table gives the limit, the rate and the time until full; a cross-check compares the computed run rate with the productivity measured by the game.*

### v1.0 — Nouvel outil, étape 1  (29/09/2026)

Nouvel outil, étape 1 : importez une sauvegarde (.sav, lue dans le navigateur, hors du fil principal) ; l'usine est reconstruite (machines, extracteurs, convoyeurs, séparateurs et leurs liaisons) et chaque Uploader, regroupé par item, est relié aux machines et extracteurs qui l'alimentent (recette, horloge, éclats, Somersloops, productivité mesurée), avec le stock actuel du Depot et l'extension achetée. Les débits par minute viendront ensuite.

*EN — New tool, step 1. New tool, step 1: import a save (.sav, read in the browser, off the main thread); the factory is rebuilt (machines, extractors, belts, splitters and their links) and each Uploader, grouped by item, is traced back to the machines and extractors feeding it (recipe, clock, shards, Somersloops, measured productivity), next to the Depot's current stock and the purchased expansion. Per-minute rates come next.*

## Registre des rendements / Yield registry — `satisfactory_infographie.html`

### v1.44 — Corrigé  (10/10/2026)

Corrigé : le bouton « Importer ma partie » du panneau « Mes alternatives » ne faisait rien quand l'outil est ouvert dans la barre commune ; il ouvre maintenant le panneau « Ma partie ».

*EN — Fixed. Fixed: the "Import my save" button in the "My alternatives" panel did nothing when the tool is opened in the shared bar; it now opens the "My save" panel.*

### v1.34 — Les bulles d'aide (au survol des boutons, icônes et étiquettes) prennent l'ha… (04/10/2026)

Les bulles d'aide (au survol des boutons, icônes et étiquettes) prennent l'habillage de la charte : fenêtre sombre sous un filet orange, titre en blanc, détail en gris, à la place de la bulle du navigateur. Elles s'affichent aussi au clavier. Le registre n'a plus d'onglet vertical « Ma partie » (qui doublonnait le bouton du haut de page) : ses alternatives débloquées et disques durs s'ouvrent par un bouton « Mes alternatives » dans la rangée d'outils.

*EN — Help bubbles (on hover over buttons, icons and tags) now use the style guide'…. Help bubbles (on hover over buttons, icons and tags) now use the style guide's look: a dark window under an orange line, white heading, grey detail, instead of the browser's own bubble. They also show with the keyboard. The registry no longer has the vertical “My game” tab (which duplicated the top-of-page button): its unlocked alternates and hard drives open from a “My alternates” button in the toolbar.*

### v1.33 — Combinaisons et chaînes optimisées repassent en orange, la couleur ordinaire  (04/10/2026)

Combinaisons et chaînes optimisées repassent en orange, la couleur ordinaire : l'onglet dit déjà de quoi on parle. Dans la séquence d'une chaîne, la cible est une tuile blanche à chiffre sombre (comme le palier choisi du terminal du jeu), un coproduit a un trait pointillé, et le chiffre de l'extraction est lisible.

*EN — Combinations and optimised chains are back to orange, the ordinary colour. Combinations and optimised chains are back to orange, the ordinary colour: the tab already says what they are. In a chain's sequence the target is a white tile with a dark digit (like the game's selected tier), a co-product has a dashed edge, and the extraction digit is readable.*

### v1.32 — Synthèse  (02/10/2026)

Synthèse : l'étiquette « perdante » s'affiche en blanc sur rouge, lisible ; elle prenait par erreur le style gris des sous-titres de groupe.

*EN — Synthesis. Synthesis: the “losing” tag now shows white on red, readable; it was wrongly picking up the grey style of group subtitles.*

### v1.31 — Combinaisons et chaînes optimisées en bleu, la couleur des graphes de puissan… (02/10/2026)

Combinaisons et chaînes optimisées en bleu, la couleur des graphes de puissance du jeu, au lieu du jaune absent de ses menus : l'orange reste aux recettes alternatives, le gris aux recettes de base.

*EN — Combinations and optimised chains in blue, the colour of the game's power gra…. Combinations and optimised chains in blue, the colour of the game's power graphs, instead of a yellow its menus never use: orange stays for alternate recipes, grey for standard ones.*

### v1.28 — Bouton « Ma partie » commun, en haut à droite de chaque outil et de l'accueil  (29/09/2026)

Bouton « Ma partie » commun, en haut à droite de chaque outil et de l'accueil : un seul endroit pour importer sa sauvegarde, que tous les outils reprennent aussitôt. L'accueil résume la partie importée. Le panneau « Ma partie » du registre garde l'analyse (filtre, simulation, alternatives et disques notés) et renvoie au bouton commun pour l'import.

*EN — Shared "My game" button, top right of every tool and the home page. Shared "My game" button, top right of every tool and the home page: one place to import your save, which every tool picks up at once. The home page summarises the imported game. The registry's "My game" panel keeps the analysis (filter, simulation, rated alternates and hard drives) and points to the shared button for importing.*

### v1.26 — Bouton « Copier le lien »  (28/09/2026)

Bouton « Copier le lien » : un lien vers la vue affichée (critère, palier, items filtrés, onglet, tri, poids de la synthèse), sans votre partie. Panneau « Ma partie » : le focus clavier y reste tant qu'il est ouvert, et chaque recalcul est annoncé aux lecteurs d'écran. Correction : les séquences de production pouvaient reprendre une chaîne calculée avant un changement de filtre « Ma partie ».

*EN — "Copy the link" button. "Copy the link" button: a link to the view shown (criterion, tier, filtered items, tab, sort, synthesis weights), without your game. "My game" panel: keyboard focus stays in it while open, and each recomputation is announced to screen readers. Fix: production sequences could reuse a chain computed before a "My game" filter change.*

### v1.25 — Import de la sauvegarde environ cinq fois plus rapide (1 s au lieu de 5 pour… (28/09/2026)

Import de la sauvegarde environ cinq fois plus rapide (1 s au lieu de 5 pour une partie de 5 Mo) et beaucoup plus économe en mémoire : les trois listes utiles sont lues directement, le parseur complet ne sert plus qu'en secours (et n'est téléchargé que dans ce cas).

*EN — Save import about five times faster (1 s instead of 5 for a 5 MB game) and fa…. Save import about five times faster (1 s instead of 5 for a 5 MB game) and far lighter on memory: the three useful lists are read directly, the full parser is only a fallback (and only downloaded then).*

### v1.24 — « Ma partie »  (28/09/2026)

« Ma partie » : le palier se règle sur celui de votre partie à chaque import ; un bandeau au-dessus des onglets rappelle le filtre et la simulation en cours ; dans les combinaisons, les alternatives débloquées seulement par la simulation sont marquées « simulée ». La simulation est désormais partagée avec l'arbre de production et l'optimiseur de recyclage.

*EN — "My game". "My game": the tier is set to your game's on each import; a banner above the tabs recalls the active filter and simulation; in combinations, alternates unlocked only by the simulation are marked "simulated". The simulation is now shared with the production tree and the recycling optimizer.*

### v1.23 — Simulation des choix de disques durs  (28/09/2026)

Simulation des choix de disques durs : dans le panneau « Ma partie », cochez l'alternative à retenir pour chaque disque en attente (par défaut la meilleure en Synthèse) et l'option « Simuler mes choix » : duels, combinaisons, catalogue et paliers font comme si elle était débloquée. Sur téléphone, les onglets, les noms longs et les chiffres clés ne débordent plus de l'écran, et l'onglet « Ma partie » passe en bas à droite.

*EN — Hard drive pick simulation. Hard drive pick simulation: in the "My game" panel, tick the alternate to keep for each pending drive (by default the best in Synthesis) and the "Simulate my picks" option: duels, combinations, catalogue and tiers act as if it were unlocked. On phones, tabs, long names and key figures no longer overflow the screen, and the "My game" tab moves to the bottom right.*

### v1.22 — « Ma partie » passe dans un panneau latéral, ouvert par l'onglet sur le bord… (27/09/2026)

« Ma partie » passe dans un panneau latéral, ouvert par l'onglet sur le bord droit : import de la sauvegarde (il quitte l'accueil), filtre, disques durs en attente de choix et alternatives débloquées ou manquantes. Chaque alternative y est notée sur le critère affiché (énergie, matière, espace ou synthèse), avec son gain face à la base et son verdict ; l'onglet indique le nombre de disques en attente.

*EN — "My game" moves to a side panel, opened from the tab on the right edge. "My game" moves to a side panel, opened from the tab on the right edge: save import (it leaves the home page), filter, hard drives awaiting a choice and unlocked or missing alternates. Each alternate is rated there on the criterion shown (energy, materials, space or synthesis), with its gain over the standard and its verdict; the tab shows the number of pending drives.*

### v1.21 — « Ma partie »  (27/09/2026)

« Ma partie » : les disques durs analysés dans le MAM mais pas encore réclamés s'affichent avec, pour chaque alternative proposée, son score Synthèse (vos poids actuels), son gain face à la recette de base et son verdict gagnante / compromis / perdante, meilleur choix signalé, pour trancher avant de valider en jeu. La sauvegarde est désormais lue par le parseur communautaire satisfactory-file-parser, hors de la page, avec une barre de progression.

*EN — "My game". "My game": hard drives analysed in the MAM but not yet claimed are listed with, for each offered alternate, its Synthesis score (your current weights), its gain over the standard recipe and its winning / trade-off / losing verdict, best pick flagged, to decide before confirming in game. The save is now read by the community satisfactory-file-parser, off the page, with a progress bar.*

### v1.20 — Option « Ma partie »  (26/09/2026)

Option « Ma partie » : après import de votre sauvegarde depuis l'accueil, ne garder que les recettes débloquées dans votre partie (énergie, espace et synthèse instantanés ; matière en quelques secondes au pire, podium signalé s'il n'est pas prouvé optimal).

*EN — "My game" option. "My game" option: after importing your save from the home page, keep only the recipes unlocked in your game (energy, space and synthesis instantly; material within a few seconds at worst, podium flagged when not proven optimal).*

### v1.19 — Page plus légère  (26/09/2026)

Page plus légère : la langue, le glossaire et la grille de paliers sont chargés depuis un fichier commun à tous les outils, mis en cache une fois. Les icônes aussi, partagées avec les autres outils. (873 → 413 Ko)

*EN — Lighter page. Lighter page: language, glossary and tier grid are loaded from a file shared by all tools, cached once. Icons too, shared with the other tools. (873 → 413 KB)*

### v1.18 — La grille de paliers est désormais commune aux outils (même apparence que dan… (26/09/2026)

La grille de paliers est désormais commune aux outils (même apparence que dans l'optimiseur et l'arbre).

*EN — The tier grid is now shared across tools (same look as in the optimizer and t…. The tier grid is now shared across tools (same look as in the optimizer and the tree).*

### v1.17 — Page allégée de 190 Ko  (26/09/2026)

Page allégée de 190 Ko : les combinaisons Énergie et Espace sont calculées dans la page, pour le palier affiché (moins d'un dixième de seconde), au lieu d'être embarquées pour chaque palier. La Matière reste précalculée : ses chaînes à égalité la rendraient trop lente en direct.

*EN — Page 190 KB lighter. Page 190 KB lighter: Energy and Space combinations are computed in the page, for the tier shown (under a tenth of a second), instead of being embedded for every tier. Materials stay precomputed: their tied chains would make them too slow live.*

### v1.15 — Indices Énergie et Matière recalculés par la page, avec le même modèle de coû… (24/09/2026)

Indices Énergie et Matière recalculés par la page, avec le même modèle de coût que l'Espace, la Synthèse et les combinaisons (ils étaient figés dans les données et suivaient une autre règle pour les coproduits) : une quarantaine de recettes à base de pétrole ou de coproduits changent de valeur. Les recettes de base n'affichent plus de gain « vs base ». Combinaisons recalculées.

*EN — Energy and Materials indices recomputed by the page, with the same cost model…. Energy and Materials indices recomputed by the page, with the same cost model as Space, Synthesis and the combinations (they were frozen in the data and followed another rule for co-products): about forty oil or co-product recipes change value. Standard recipes no longer show a "vs standard" gain. Combinations recomputed.*

### v1.14 — Mode Espace  (24/09/2026)

Mode Espace : la séquence de production décrit les bâtiments employés — foreuses, pompes et part des puits d'azote à l'extraction, nombre de bâtiments et m² à chaque étape, et un récapitulatif par type de bâtiment. L'emprise d'extraction se compte désormais en bâtiments entiers, comme les machines.

*EN — Space mode. Space mode: the production sequence describes the buildings used — miners, extractors and share of the nitrogen wells at extraction, number of buildings and m² at each step, and a summary by building type. Extraction footprint is now counted in whole buildings, like the machines.*

### v1.13 — Nouveau critère Synthèse  (24/09/2026)

Nouveau critère Synthèse : énergie, matière et espace réunis en un coût composite (taux de change médians entre critères), pondérés par trois curseurs. Chaque alternative y est classée gagnante, compromis ou perdante face à sa recette de base ; les combinaisons suivent les curseurs, recalculées dans la page par la même recherche exacte. Mention en bas de page : le site est généré par IA.

*EN — New Synthesis criterion. New Synthesis criterion: energy, materials and space combined into a composite cost (median exchange rates between criteria), weighted by three sliders. Each alternate is rated winning, trade-off or losing against its standard recipe; combinations follow the sliders, recomputed in the page with the same exact search. Footer notice: the site is AI-generated.*

### v1.12 — Paliers des recettes du MAM recalculés depuis l'arbre de recherche du wiki of… (24/09/2026)

Paliers des recettes du MAM recalculés depuis l'arbre de recherche du wiki officiel et le coût de chaque recherche : la plupart des recherches de départ (Caterium, Quartz, protéines, Quickwire) sortent dès le palier 1 ou 2 au lieu de 3, Compacted Coal passe au palier 2. Mode Espace : emprises des bâtiments reprises du wiki (Assembler 9 × 16, Refinery 10 × 22, Smelter 5 × 10…) et azote compté sur l'ensemble des puits du monde. Combinaisons recalculées.

*EN — MAM recipe tiers recomputed from the official wiki's research tree and each r…. MAM recipe tiers recomputed from the official wiki's research tree and each research's cost: most starting research (Caterium, Quartz, proteins, Quickwire) now comes at tier 1 or 2 instead of 3, Compacted Coal moves to tier 2. Space mode: building footprints taken from the wiki (Assembler 9 × 16, Refinery 10 × 22, Smelter 5 × 10…) and nitrogen counted over all the world's wells. Combinations recomputed.*

### v1.11 — Noms français pour toutes les recettes, alternatives comprises (160 noms ajou… (24/09/2026)

Noms français pour toutes les recettes, alternatives comprises (160 noms ajoutés d'après la localisation officielle du jeu), et pour les restes d'aliens. La mention sur les noms restés en anglais disparaît.

*EN — French names for every recipe, alternates included (160 names added from the…. French names for every recipe, alternates included (160 names added from the game's official localization), and for alien remains. The note about names left in English is gone.*

### v1.10 — Nouveau critère « Espace »  (24/09/2026)

Nouveau critère « Espace » : chaque recette et chaque combinaison notée en sortie par m² au sol, machines et extraction surcadencées à 250 % (éclats de charge, sans Somersloop). Emprises des bâtiments relevées à la main ; convoyeurs et allées non comptés.

*EN — New "Space" criterion. New "Space" criterion: every recipe and combination rated by output per floor m², machines and extraction overclocked to 250% (power shards, no Somersloop). Building footprints recorded by hand; belts and walkways not counted.*

### v1.9 — Noms français ajoutés  (24/09/2026)

Noms français ajoutés : Foreuse portable, Restes de dardeuse, Restes de sanglier alien, Restes de cracheur.

*EN — French names added. French names added: Foreuse portable, Restes de dardeuse, Restes de sanglier alien, Restes de cracheur.*

### v1.8 — Le journal des révisions quitte le bas de page  (24/09/2026)

Le journal des révisions quitte le bas de page : un badge de version en haut à droite, à côté des drapeaux, le déroule d'un clic. Une pastille signale une version pas encore vue, et les nouveautés sont marquées dans le journal. Page allégée de 87 Ko (données précalculées inutilisées retirées).

*EN — The revision log leaves the page footer. The revision log leaves the page footer: a version badge at the top right, next to the flags, opens it in one click. A dot flags a version you haven't seen yet, and new entries are marked in the log. Page 87 KB lighter (unused precomputed data removed).*

### v1.7 — Paliers des alternatives de disque dur calculés depuis les recherches du MAM… (24/09/2026)

Paliers des alternatives de disque dur calculés depuis les recherches du MAM qu'elles exigent, au lieu d'un plancher au palier 1 : Cheap Silica, Fine Concrete, Fine Black Powder et Compacted Coal passent du palier 2 au palier 3. Combinaisons par palier recalculées.

*EN — Tiers of hard drive alternates now computed from the MAM research they requir…. Tiers of hard drive alternates now computed from the MAM research they require, instead of a tier 1 floor: Cheap Silica, Fine Concrete, Fine Black Powder and Compacted Coal move from tier 2 to tier 3. Per-tier combinations recomputed.*

### v1.6 — Registre des combinaisons sans plafond de palier désormais recalculé par scri… (24/09/2026)

Registre des combinaisons sans plafond de palier désormais recalculé par script depuis les recettes de la page, comme les combinaisons par palier. Nombre de chaînes distinctes recompté par énumération complète (ex. Concrete 47 → 77, Rotor 19 688 → 32 528) et plafond relevé à un million : Modular Frame et High-Speed Connector gardent leur pire chaîne. Pire chaîne de Circuit Board corrigée (0,056 → 0,055).

*EN — Combination registry without a tier cap now recomputed by script from the pag…. Combination registry without a tier cap now recomputed by script from the page's recipes, like the per-tier combinations. Number of distinct chains recounted by full enumeration (e.g. Concrete 47 → 77, Rotor 19,688 → 32,528) and cap raised to one million: Modular Frame and High-Speed Connector keep their worst chain. Circuit Board's worst chain corrected (0.056 → 0.055).*

### v1.5 — Paliers de déblocage recalculés depuis un référentiel unique  (23/09/2026)

Paliers de déblocage recalculés depuis un référentiel unique : 29 recettes changent de palier, dont des alternatives affichées jusqu'ici comme jouables trop tôt (Sloppy Alumina 5 → 7, Steel Canister 3 → 5) et les recettes SAM, jusqu'ici au palier 0. Les combinaisons optimales par palier ont été recalculées en conséquence.

*EN — Unlock tiers recomputed from a single reference dataset. Unlock tiers recomputed from a single reference dataset: 29 recipes change tier, including alternates shown as playable too early until now (Sloppy Alumina 5 → 7, Steel Canister 3 → 5) and the SAM recipes, previously at tier 0. Optimal combinations per tier were recomputed accordingly.*

### v1.4 — Interface entièrement bilingue  (22/09/2026)

Interface entièrement bilingue : textes, notes, séquences et journal suivent le drapeau FR/EN commun à tous les outils, en haut à droite. En français, items, recettes de base et bâtiments portent leur nom du jeu ; les recettes alternatives, et quelques recettes de base sans traduction vérifiée, gardent leur nom anglais.

*EN — Fully bilingual interface. Fully bilingual interface: texts, notes, sequences and log follow the FR/EN flag shared by every tool, top right. In French, items, standard recipes and buildings use their in-game names; alternate recipes, and a few standard recipes with no verified translation, keep their English names.*

### v1.3 — Vos réglages sont mémorisés d'une visite à l'autre (critère, langue, palier,… (22/09/2026)

Vos réglages sont mémorisés d'une visite à l'autre (critère, langue, palier, items cochés, onglet, filtres, séquences et cadences), avec un bouton Réinitialiser. La note du sélecteur de palier suit la langue des noms.

*EN — Your settings are remembered between visits (criterion, language, tier, check…. Your settings are remembered between visits (criterion, language, tier, checked items, tab, filters, sequences and rates), with a Reset button. The tier picker note follows the item-name language.*

### v1.2 — Filtre par palier atteint  (21/09/2026)

Filtre par palier atteint : recettes, alternatives et combinaisons se limitent à ce qui est réellement jouable au palier choisi. Correction de cinq optimums du mode Matière (famille du moteur).

*EN — Tier reached filter. Tier reached filter: recipes, alternates and combinations are limited to what is actually playable at the chosen tier. Fixed five optima in Materials mode (motor family).*

### v1.1 — Combinaisons  (15/09/2026)

Combinaisons : chaque chaîne du podium se déroule étape par étape, de l'extraction à la cible, avec machines, horloges et coproduits. La séquence s'affiche au clic.

*EN — Combinations. Combinations: each podium chain unfolds step by step, from extraction to target, with machines, clock speeds and by-products. The sequence shows on click.*

### v1.0 — Première version  (05/09/2026)

Première version : chaque recette notée en sortie par mégawatt (Énergie) et par matière brute (Matière), onglets Duels, Combinaisons et Catalogue, filtre multi-items et noms français.

*EN — First release. First release: every recipe scored on output per megawatt (Energy) and per raw resource (Materials), with Duels, Combinations and Catalogue tabs, a multi-item filter and French names.*

## Module d'étalonnage / Calibration module — `ficsit_horloge.html`

### v1.11 — Le régime d'éclats se règle sur votre partie importée (bouton « Ma partie »)  (30/09/2026)

Le régime d'éclats se règle sur votre partie importée (bouton « Ma partie ») : « éclats illimités » si l'éclat de charge synthétique est débloqué, « éclats rares » sinon. Réglé à chaque nouvel import, toujours modifiable à la main.

*EN — The shard regime follows your imported game ("My game" button). The shard regime follows your imported game ("My game" button): "unlimited shards" if the synthetic power shard is unlocked, "scarce shards" otherwise. Set on each new import, still changeable by hand.*

### v1.8 — Sur téléphone, la page ne déborde plus horizontalement  (28/09/2026)

Sur téléphone, la page ne déborde plus horizontalement : la colonne de résultats se resserre (son tableau défile dans son cadre) et le titre s'adapte à la largeur.

*EN — On phones, the page no longer overflows horizontally. On phones, the page no longer overflows horizontally: the results column narrows (its table scrolls within its frame) and the title fits the width.*

### v1.7 — Page plus légère  (26/09/2026)

Page plus légère : la langue, le glossaire et la grille de paliers sont chargés depuis un fichier commun à tous les outils, mis en cache une fois.

*EN — Lighter page. Lighter page: language, glossary and tier grid are loaded from a file shared by all tools, cached once.*

### v1.6 — Liste des bâtiments tirée du référentiel du jeu (puissances, production des g… (26/09/2026)

Liste des bâtiments tirée du référentiel du jeu (puissances, production des générateurs, plages des machines à puissance variable) au lieu d'être saisie à la main. La plage de l'accélérateur de particules est corrigée : 250 – 1 500 MW. L'infobulle du constructeur n'affiche plus de code parasite.

*EN — Building list taken from the game dataset (power, generator output, ranges of…. Building list taken from the game dataset (power, generator output, ranges of variable-power machines) instead of being typed by hand. The Particle Accelerator range is corrected: 250 – 1,500 MW. The Constructor tooltip no longer shows stray code.*

### v1.4 — Mention en bas de page  (24/09/2026)

Mention en bas de page : le site est généré par IA.

*EN — Footer notice. Footer notice: the site is AI-generated.*

### v1.2 — La langue se choisit désormais avec le drapeau FR/EN commun à tous les outils… (22/09/2026)

La langue se choisit désormais avec le drapeau FR/EN commun à tous les outils, en haut à droite. Noms de bâtiments, formule et fourchettes de consommation traduits.

*EN — Language is now set with the FR/EN flag shared by every tool, top right. Language is now set with the FR/EN flag shared by every tool, top right. Building names, formula and consumption ranges translated.*

### v1.1 — Vos réglages sont mémorisés d'une visite à l'autre (bâtiment, T, puissance de… (22/09/2026)

Vos réglages sont mémorisés d'une visite à l'autre (bâtiment, T, puissance de base, régime de shards, langue), avec un bouton Réinitialiser.

*EN — Your settings are remembered between visits (building, T, base power, shard r…. Your settings are remembered between visits (building, T, base power, shard regime, language), with a Reset button.*

### v1.0 — Première version  (14/09/2026)

Première version : pour un besoin T en machines-équivalent, toutes les répartitions possibles avec horloge, shards, MW et écart à la répartition sans shard. Régime shards rares ou illimités, mode linéaire des générateurs, bascule FR/EN.

*EN — First release. First release: for a need of T machine-equivalents, every possible split with clock speed, shards, MW and gap to the shard-free split. Scarce or unlimited shard regime, linear mode for generators, FR/EN toggle.*

## Optimiseur de recyclage / Recycling optimizer — `broyeur-excedents.html`

### v1.17 — Avec une sauvegarde importée dans le registre des rendements  (28/09/2026)

Avec une sauvegarde importée dans le registre des rendements : option (cochée par défaut) pour ne garder que les cibles que vos recettes débloquées, ou simulées, savent fabriquer ; le palier se règle sur celui de votre partie.

*EN — With a save imported in the yield registry. With a save imported in the yield registry: option (ticked by default) to keep only the targets your unlocked, or simulated, recipes can make; the tier is set to your game's.*

### v1.16 — Page plus légère  (26/09/2026)

Page plus légère : la langue, le glossaire et la grille de paliers sont chargés depuis un fichier commun à tous les outils, mis en cache une fois. Les icônes aussi, partagées avec les autres outils. (343 → 97 Ko)

*EN — Lighter page. Lighter page: language, glossary and tier grid are loaded from a file shared by all tools, cached once. Icons too, shared with the other tools. (343 → 97 KB)*

### v1.15 — La grille de paliers est désormais commune aux outils (même apparence que dan… (26/09/2026)

La grille de paliers est désormais commune aux outils (même apparence que dans le registre et l'arbre).

*EN — The tier grid is now shared across tools (same look as in the registry and th…. The tier grid is now shared across tools (same look as in the registry and the tree).*

### v1.14 — Grille de paliers plus lisible  (25/09/2026)

Grille de paliers plus lisible : un palier non cliquable est hachuré et bordé de pointillés, un palier cliquable hors sélection reste un bouton plein.

*EN — Clearer tier grid. Clearer tier grid: a tier that cannot be clicked is hatched with a dashed border, a clickable tier outside the selection stays a solid button.*

### v1.13 — Grille de paliers  (25/09/2026)

Grille de paliers : par défaut, toutes les cibles sont affichées, jusqu'au dernier palier qui en apporte. Seuls les paliers qui font apparaître au moins une nouvelle cible sont cliquables ; les autres, sous le minimum de vos excédents ou sans rien de neuf, sont grisés. « Tout afficher » revient au défaut.

*EN — Tier grid. Tier grid: by default, all targets are shown, up to the last tier that adds any. Only tiers that bring at least one new target can be clicked; the others, below your surplus minimum or with nothing new, are greyed out. "Show all" goes back to the default.*

### v1.12 — Bouton « Accueil » dans le dock en haut à droite, pour revenir à la liste des… (25/09/2026)

Bouton « Accueil » dans le dock en haut à droite, pour revenir à la liste des outils. Le palier se choisit dans une grille à icônes, comme dans le registre des rendements ; il part du palier minimum qu'impliquent vos excédents (les paliers inférieurs sont grisés). Le filtre « minerai neuf », qui ne correspondait pas aux données observées, est retiré. « Chaîne déjà payée » devient « avancement de la chaîne », expliqué en bas de page.

*EN — "Home" button in the top-right dock, to go back to the list of tools. "Home" button in the top-right dock, to go back to the list of tools. The tier is picked from an icon grid, as in the yield registry; it starts at the minimum tier your surplus implies (lower tiers are greyed out). The "new ore" filter, which did not match observed data, is removed. "Chain already covered" becomes "chain progress", explained at the bottom of the page.*

### v1.11 — Style unifié avec les autres outils  (24/09/2026)

Style unifié avec les autres outils : mêmes polices (Saira Condensed et Barlow, au lieu d'Orbitron et Roboto embarquées), même palette, grand titre et bande hachurée. La page s'allège de 76 Ko.

*EN — Style unified with the other tools. Style unified with the other tools: same fonts (Saira Condensed and Barlow, instead of embedded Orbitron and Roboto), same palette, large title and hazard stripe. The page is 76 KB lighter.*

### v1.10 — Rangé avec « Complexité et valeur au broyeur » dans la catégorie Recyclage de… (24/09/2026)

Rangé avec « Complexité et valeur au broyeur » dans la catégorie Recyclage de l'accueil. Mention en bas de page : le site est généré par IA.

*EN — Grouped with "Complexity vs sink value" under Recycling on the home page. Grouped with "Complexity vs sink value" under Recycling on the home page. Footer notice: the site is AI-generated.*

### v1.9 — Paliers des recettes du MAM recalculés depuis l'arbre de recherche du wiki of… (24/09/2026)

Paliers des recettes du MAM recalculés depuis l'arbre de recherche du wiki officiel et le coût de chaque recherche : la plupart des recherches de départ (Caterium, Quartz, protéines, Quickwire) sortent dès le palier 1 ou 2 au lieu de 3, Compacted Coal passe au palier 2.

*EN — MAM recipe tiers recomputed from the official wiki's research tree and each r…. MAM recipe tiers recomputed from the official wiki's research tree and each research's cost: most starting research (Caterium, Quartz, proteins, Quickwire) now comes at tier 1 or 2 instead of 3, Compacted Coal moves to tier 2.*

### v1.8 — Noms français pour toutes les recettes, alternatives comprises (160 noms ajou… (24/09/2026)

Noms français pour toutes les recettes, alternatives comprises (160 noms ajoutés d'après la localisation officielle du jeu), et pour les restes d'aliens. La mention sur les noms restés en anglais disparaît du pied de page.

*EN — French names for every recipe, alternates included (160 names added from the…. French names for every recipe, alternates included (160 names added from the game's official localization), and for alien remains. The note about names left in English is gone from the footer.*

### v1.7 — Les recettes alternatives s'affichent sans le préfixe anglais « Alternate (24/09/2026)

Les recettes alternatives s'affichent sans le préfixe anglais « Alternate: », suivies de la mention « (alternative) ». Noms français ajoutés : Foreuse portable, Restes de dardeuse, Restes de sanglier alien, Restes de cracheur.

*EN — Alternate recipes are shown without the "Alternate:" prefix, followed by "(al…. Alternate recipes are shown without the "Alternate:" prefix, followed by "(alternate)". French names added: Foreuse portable, Restes de dardeuse, Restes de sanglier alien, Restes de cracheur.*

### v1.5 — Compacted Coal passe du tier 2 au tier 3  (24/09/2026)

Compacted Coal passe du tier 2 au tier 3 : sa recherche au MAM vient après celle de la poudre noire.

*EN — Compacted Coal moves from tier 2 to tier 3. Compacted Coal moves from tier 2 to tier 3: its MAM research comes after Black Powder's.*

### v1.4 — Données recalculées par script depuis le référentiel commun (24/09/2026)

Données recalculées par script depuis le référentiel commun. Les recettes retenues ne changent pas, mais minerai neuf et machines se lisent désormais sur la chaîne affichée (celle qui consomme le moins de MW) au lieu d'être minimisés chacun de leur côté : ils augmentent souvent (AI Limiter : 7,3 → 22 minerai/min par unité). Tiers alignés sur les autres outils, dont Circuit Board 3 → 5, Motor 7 → 8, Electromagnetic Control Rod 6 → 8.

*EN — Data recomputed by script from the shared reference dataset. Data recomputed by script from the shared reference dataset. Selected recipes are unchanged, but new ore and machines are now read from the displayed chain (the one that draws the fewest MW) instead of each being minimized separately: they often go up (AI Limiter: 7.3 → 22 ore/min per unit). Tiers aligned with the other tools, including Circuit Board 3 → 5, Motor 7 → 8, Electromagnetic Control Rod 6 → 8.*

### v1.3 — La langue se choisit désormais avec le drapeau FR/EN commun à tous les outils… (22/09/2026)

La langue se choisit désormais avec le drapeau FR/EN commun à tous les outils, en haut à droite. Les noms d'items et de recettes de base passent en français, et les nombres suivent le format de la langue.

*EN — Language is now set with the FR/EN flag shared by every tool, top right. Language is now set with the FR/EN flag shared by every tool, top right. Item and standard recipe names now switch to French, and numbers follow the language's format.*

### v1.2 — Excédents, débits, tri, filtres et langue sont mémorisés d'une visite à l'aut… (22/09/2026)

Excédents, débits, tri, filtres et langue sont mémorisés d'une visite à l'autre, avec un bouton Réinitialiser. Corrigé : la bascule FR/EN ne plante plus et le filtre de palier n'est plus remis à « tous » au changement de langue.

*EN — Surpluses, rates, sorting, filters and language are remembered between visits…. Surpluses, rates, sorting, filters and language are remembered between visits, with a Reset button. Fixed: the FR/EN toggle no longer crashes and the tier filter no longer resets to “all” when switching language.*

### v1.1 — Bascule FR/EN de l'interface et des noms d'items (14/09/2026)

Bascule FR/EN de l'interface et des noms d'items.

*EN — FR/EN toggle for the interface and item names. FR/EN toggle for the interface and item names.*

### v1.0 — Première version  (02/09/2026)

Première version : à partir des excédents saisis, classement des cibles du broyeur AWESOME par points gagnés par mégawatt investi, avec filtres de palier et de minerai supplémentaire.

*EN — First release. First release: from the surpluses you enter, AWESOME Sink targets ranked by points earned per megawatt invested, with tier and extra-ore filters.*

## Mémo de terrain / Field memo — `memo-ficsit.html`

### v1.23 — Couleurs des convoyeurs partagées avec le planificateur  (06/10/2026)

Couleurs des convoyeurs partagées avec le planificateur ; Mk.1 et Mk.2 éclaircis, plus lisibles (chiffres sombres sur la case).

*EN — Belt colours shared with the planner. Belt colours shared with the planner; Mk.1 and Mk.2 made lighter and easier to read (dark figures on the cell).*

### v1.12 — Avec une partie importée, l'extraction suit votre matériel  (01/10/2026)

Avec une partie importée, l'extraction suit votre matériel : les foreuses et convoyeurs pas encore débloqués sont grisés, comme les débits du tableau qui demandent un convoyeur que vous n'avez pas, et un bandeau rappelle la meilleure foreuse et le meilleur convoyeur dont vous disposez.

*EN — With an imported game, extraction follows your equipment. With an imported game, extraction follows your equipment: miners and belts not unlocked yet are greyed out, as are the table's rates that need a belt you do not have, and a banner recalls the best miner and belt you have.*

### v1.11 — Rangé dans la nouvelle catégorie « Tableaux de lecture » de l'accueil, avec l… (01/10/2026)

Rangé dans la nouvelle catégorie « Tableaux de lecture » de l'accueil, avec la rentabilité énergétique par nœud : les pages qu'on lit sans rien régler.

*EN — Moved to the new Reference charts category on the home page, next to Power pe…. Moved to the new Reference charts category on the home page, next to Power per node: the pages you read without setting anything.*

### v1.9 — Jalons du HUB  (30/09/2026)

Jalons du HUB : ceux obtenus dans votre partie importée (bouton « Ma partie ») sont cochés, les paliers complets marqués, avec un bilan en tête de section.

*EN — HUB milestones. HUB milestones: those obtained in your imported game ("My game" button) are ticked, completed tiers highlighted, with a summary at the top of the section.*

### v1.6 — Sur très petit écran (320 px), les bandeaux de palier et les noms longs se re… (28/09/2026)

Sur très petit écran (320 px), les bandeaux de palier et les noms longs se replient au lieu de déborder.

*EN — On very small screens (320 px), tier banners and long names wrap instead of o…. On very small screens (320 px), tier banners and long names wrap instead of overflowing.*

### v1.5 — Page plus légère  (26/09/2026)

Page plus légère : la langue, le glossaire et la grille de paliers sont chargés depuis un fichier commun à tous les outils, mis en cache une fois.

*EN — Lighter page. Lighter page: language, glossary and tier grid are loaded from a file shared by all tools, cached once.*

### v1.3 — Mention en bas de page  (24/09/2026)

Mention en bas de page : le site est généré par IA.

*EN — Footer notice. Footer notice: the site is AI-generated.*

### v1.1 — Version anglaise complète, via le drapeau FR/EN commun à tous les outils (22/09/2026)

Version anglaise complète, via le drapeau FR/EN commun à tous les outils. Noms de bâtiments alignés sur la localisation française du jeu, et huit recettes corrigées dans l'arbre des pièces de projet (batterie, turbomoteur, cube de conversion de pression…).

*EN — Full English version, via the FR/EN flag shared by every tool. Full English version, via the FR/EN flag shared by every tool. Building names aligned with the game's French localization, and eight recipes fixed in the project parts tree (battery, turbo motor, pressure conversion cube…).*

### v1.0 — Première version  (31/08/2026)

Première version : extraction par pureté de nœud et par horloge, cadences des convoyeurs, déblocages du HUB par palier et arborescence des pièces d'Ascenseur spatial.

*EN — First release. First release: extraction by node purity and clock speed, conveyor belt rates, HUB unlocks by tier and the Space Elevator parts tree.*

## Complexité et valeur au broyeur / Complexity vs sink value — `arbre-production.html`

### v1.11 — L'infobulle du graphique reprend l'habillage commun des bulles d'aide (fenêtr… (04/10/2026)

L'infobulle du graphique reprend l'habillage commun des bulles d'aide (fenêtre sombre sous un filet orange, points AWESOME en orange). Les bulles d'aide (au survol des boutons, icônes et étiquettes) prennent l'habillage de la charte : fenêtre sombre sous un filet orange, titre en blanc, détail en gris, à la place de la bulle du navigateur. Elles s'affichent aussi au clavier.

*EN — The chart tooltip now shares the common help-bubble look (dark window under a…. The chart tooltip now shares the common help-bubble look (dark window under an orange line, AWESOME points in orange). Help bubbles (on hover over buttons, icons and tags) now use the style guide's look: a dark window under an orange line, white heading, grey detail, instead of the browser's own bubble. They also show with the keyboard.*

### v1.7 — Troisième chaîne « Ma partie », dès qu'une sauvegarde est importée dans le re… (28/09/2026)

Troisième chaîne « Ma partie », dès qu'une sauvegarde est importée dans le registre des rendements : pour chaque item, l'alternative de la chaîne optimisée si vous l'avez débloquée (ou simulée), sinon la recette de base. Le palier se règle sur celui de votre partie.

*EN — Third chain "My game", once a save is imported in the yield registry. Third chain "My game", once a save is imported in the yield registry: for each item, the optimized chain's alternate if you have unlocked (or simulated) it, otherwise the standard recipe. The tier is set to your game's.*

### v1.6 — Page plus légère  (26/09/2026)

Page plus légère : la langue, le glossaire et la grille de paliers sont chargés depuis un fichier commun à tous les outils, mis en cache une fois. Les icônes aussi, partagées avec les autres outils. (283 → 65 Ko)

*EN — Lighter page. Lighter page: language, glossary and tier grid are loaded from a file shared by all tools, cached once. Icons too, shared with the other tools. (283 → 65 KB)*

### v1.5 — Le palier se choisit dans la même grille à icônes que les autres outils, au l… (26/09/2026)

Le palier se choisit dans la même grille à icônes que les autres outils, au lieu d'un menu : seuls les paliers qui font apparaître au moins un item sont cliquables ; retoucher le palier choisi affiche tout.

*EN — The tier is picked from the same icon grid as the other tools, instead of a menu. The tier is picked from the same icon grid as the other tools, instead of a menu: only tiers that bring at least one item can be clicked; tapping the chosen tier again shows everything.*

### v1.3 — Nouveau nom, « Complexité et valeur au broyeur », rangé avec l'optimiseur dan… (24/09/2026)

Nouveau nom, « Complexité et valeur au broyeur », rangé avec l'optimiseur dans la catégorie Recyclage de l'accueil. Les minerais bruts solides (fer, cuivre, calcaire, charbon, caterium, quartz, soufre, bauxite, uranium, SAM) figurent désormais, à profondeur 0. Mention en bas de page : le site est généré par IA.

*EN — New name, "Complexity vs sink value", grouped with the optimizer under Recycl…. New name, "Complexity vs sink value", grouped with the optimizer under Recycling on the home page. Solid raw ores (iron, copper, limestone, coal, caterium, quartz, sulfur, bauxite, uranium, SAM) are now listed, at depth 0. Footer notice: the site is AI-generated.*

### v1.2 — Paliers des recettes du MAM recalculés depuis l'arbre de recherche du wiki of… (24/09/2026)

Paliers des recettes du MAM recalculés depuis l'arbre de recherche du wiki officiel et le coût de chaque recherche : la plupart des recherches de départ (Caterium, Quartz, protéines, Quickwire) sortent dès le palier 1 ou 2 au lieu de 3, Compacted Coal passe au palier 2.

*EN — MAM recipe tiers recomputed from the official wiki's research tree and each r…. MAM recipe tiers recomputed from the official wiki's research tree and each research's cost: most starting research (Caterium, Quartz, proteins, Quickwire) now comes at tier 1 or 2 instead of 3, Compacted Coal moves to tier 2.*

### v1.1 — Noms français pour toutes les recettes, alternatives comprises (160 noms ajou… (24/09/2026)

Noms français pour toutes les recettes, alternatives comprises (160 noms ajoutés d'après la localisation officielle du jeu), et pour les restes d'aliens.

*EN — French names for every recipe, alternates included (160 names added from the…. French names for every recipe, alternates included (160 names added from the game's official localization), and for alien remains.*

### v1.0 — Première version  (24/09/2026)

Première version : profondeur de l'arbre de production et nombre d'items intermédiaires de chaque item broyable, face à sa valeur AWESOME, en recettes de base ou en chaîne optimisée (MW), filtrable par palier.

*EN — First release. First release: production tree depth and number of intermediate items for every sinkable item, against its AWESOME value, with standard recipes or the optimized (MW) chain, filterable by tier.*

## Rentabilité énergétique par nœud / Power per node — `energie-noeuds.html`

### v1.2 — Icônes des ressources dans la description de chaque filière  (01/10/2026)

Icônes des ressources dans la description de chaque filière : ressource du nœud, générateur, ressources d'appoint et surplus.

*EN — Resource icons in each chain's description. Resource icons in each chain's description: the node's resource, the generator, side resources and surplus.*

### v1.1 — Carburant ionisé  (01/10/2026)

Carburant ionisé : ses éclats de charge sont désormais fabriqués par la recette synthétique (palier 9), avec les MW de l'encodeur quantique, de l'accélérateur de particules et du convertisseur, et les ressources des cristaux temporels et de la matière noire. La filière passe au palier 9 et à environ 23 900 MW nets par nœud de pétrole normal, derrière le carburant de fusée nitro (27 900 MW).

*EN — Ionized fuel. Ionized fuel: its power shards are now made by the synthetic recipe (tier 9), with the power of the quantum encoder, particle accelerator and converter, and the resources of time crystals and dark matter. The chain moves to tier 9 and to about 23,900 net MW per normal oil node, behind nitro rocket fuel (27,900 MW).*

### v1.0 — Nouvel outil, à lire sans rien régler  (01/10/2026)

Nouvel outil, à lire sans rien régler : combien de MW nets tirer d'un seul nœud, filière par filière (charbon, charbon compacté, carburant et ses variantes, turbocarburant, carburant de fusée, carburant ionisé, uranium, géothermie), par pureté du nœud, à 100 % et à 250 % de cadence. Nets : extraction du nœud, machines de la chaîne et ressources d'appoint payées. Chaînes calculées par script depuis le référentiel. Avec une partie importée, la foreuse, le convoyeur et le tuyau sont les vôtres, et les filières pas encore débloquées sont grisées avec ce qui leur manque.

*EN — New tool, read-only. New tool, read-only: how many net MW a single node can give, chain by chain (coal, compacted coal, fuel and its variants, turbofuel, rocket fuel, ionized fuel, uranium, geothermal), by node purity, at 100% and 250% clock speed. Net: the node's extraction, the chain's machines and side resources paid for. Chains computed by script from the shared dataset. With an imported game, the miner, belt and pipe are yours, and chains not unlocked yet are greyed out with what they are missing.*
