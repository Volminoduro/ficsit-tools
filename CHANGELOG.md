# Journal des révisions

Généré depuis `changelog.json` par `scripts/patchnotes.py` — ne pas éditer à la main.
Version x.y.0 : fonctionnalité ; x.y.z : ajustement ; x.y.z.w : correctif de bug (rangé sous l'ajustement z).

## Site / Site — journal commun

### v1.13.0 — Accessibilité et métadonnées (16/10/2026)

Chaque page a un lien « Aller au contenu » (visible au clavier) et une zone principale repérable par les lecteurs d'écran. Les pages portent une description, une couleur de thème et des métadonnées de partage. Les numéros du journal sont un peu plus lisibles.

*EN — Accessibility and metadata. Every page has a “Skip to content” link (visible with the keyboard) and a main region that screen readers can find. Pages carry a description, a theme colour and sharing metadata. Log version numbers are a little easier to read.*

### v1.12.0 — Page Journal (16/10/2026)

Un onglet « Journal » dans la barre récapitule tous les journaux, une section par outil (et le site), du plus récent au plus ancien : seules les fonctionnalités sont affichées, les ajustements et correctifs s'ajoutent d'un clic. Chaque journal d'outil y renvoie par « Tout le journal ».

*EN — Log page. A “Log” tab in the bar sums up every log, one section per tool (and the site), newest first: only features are shown, adjustments and fixes are added with one click. Each tool's log links to it with “Full log”.*

- **1.12.3** (16/10/2026) : Dans le journal, viser une ligne plus bas ne déplace plus la cible : les lignes du dessus restent ouvertes jusqu'à la sortie du panneau. Défilement fin et discret.
  *EN — In the log, aiming at a lower line no longer shifts the target: lines above stay open until the pointer leaves the panel. Thin, discreet scrollbar.*
- **1.12.2** (16/10/2026) : La page Journal répartit ses sections en deux ou trois colonnes équilibrées selon la largeur de l'écran, au lieu d'une longue liste.
  *EN — The Log page spreads its sections over two or three balanced columns depending on screen width, instead of one long list.*
- **1.12.1** (16/10/2026) : Le bouton « Accueil » reste affiché sur la page d'accueil, où il est l'onglet courant (en orange).
  *EN — The “Home” button stays shown on the home page, where it is the current tab (in orange).*

### v1.11.0 — Journal refondu (15/10/2026)

Le journal distingue trois niveaux : fonctionnalités (pastille orange qui pulse), ajustements (point gris) et correctifs (discrets, rangés sous l'ajustement concerné). Les changements du site entier ont leur propre journal « Site », au lieu d'être répétés dans chaque outil.

*EN — Revised log. The log now has three levels: features (pulsing orange dot), adjustments (grey dot) and fixes (discreet, filed under the adjustment they belong to). Site-wide changes have their own “Site” log instead of being repeated in every tool.*

- **1.11.4** (15/10/2026) : Dans le journal, les replis s'ouvrent en glissant vers le bas et se referment en remontant, au lieu d'apparaître d'un coup.
  *EN — In the log, folds slide open downwards and close upwards, instead of popping in.*
- **1.11.3** (15/10/2026) : Le journal du site n'est plus une ligne dans le journal de chaque outil : il vit sur la page d'accueil, où il a déjà son badge.
  *EN — The site log is no longer a line in each tool's log: it lives on the home page, where it already has its badge.*
- **1.11.2** (15/10/2026) : Le journal du site est aussi sur la page d'accueil, et sa ligne « Site » remonte sous la dernière version du journal de chaque outil (elle était tout en bas).
  *EN — The site log is also on the home page, and its “Site” line moves up under the latest version of each tool's log (it was at the very bottom).*
- **1.11.1** (15/10/2026) : Dans le journal, les versions et leurs ajustements s'ouvrent au survol et restent ouverts au clic ; un second clic les ferme (au tactile, le clic ouvre et ferme).
  *EN — In the log, versions and their adjustments open on hover and stay open on click; a second click closes them (on touch screens, a click opens and closes).*

### v1.10.0 — Un site en une seule page (06/10/2026)

Le site devient une seule page à onglets : changer d'outil n'en recharge plus aucun, chaque outil reste ouvert à côté des autres et retrouve son état (défilement, zoom, saisies) quand on y revient. L'adresse suit l'outil affiché, et « Précédent » ramène à l'outil d'avant.

*EN — A single-page site. The site becomes a single page with tabs: switching tools no longer reloads anything, each tool stays open next to the others and keeps its state (scroll, zoom, inputs) when you come back. The address follows the tool on screen, and “Back” returns to the previous tool.*

- **1.10.4** (06/10/2026) : Une seule barre de titre pour tout le site ; le journal de la barre est celui de l'outil affiché.
  *EN — A single title bar for the whole site; the changelog in the bar is the one of the tool on screen.*
- **1.10.3** (06/10/2026) : Plus d'écran noir en changeant d'outil : l'outil courant reste affiché, avec un liseré de chargement, jusqu'à ce que le suivant soit prêt.
  *EN — No more black screen when switching tools: the current tool stays on screen, with a loading line, until the next one is ready.*
- **1.10.2** (06/10/2026) : Les autres outils s'ouvrent en arrière-plan, un à un : même à la première visite, un onglet s'affiche aussitôt.
  *EN — The other tools open in the background, one by one: even on a first visit, a tab shows at once.*
- **1.10.1** (06/10/2026) : Changer d'outil ne fait plus clignoter la page : le contenu passe en fondu et l'outil survolé est préparé à l'avance (Chrome et Edge).
  *EN — Switching tools no longer makes the page flicker: the content fades across and a hovered tool is prepared ahead (Chrome and Edge).*

### v1.9.0 — Barre de titre à onglets (04/10/2026)

La barre de titre porte désormais des onglets vers tous les outils : plus besoin de repasser par l'accueil pour changer d'outil (outil courant en orange ; losange = outil en chantier). Sur écran étroit, ils se replient dans un menu « Outils ».

*EN — Title bar with tabs. The title bar now carries tabs to every tool, so there is no need to go back through the home page to switch (current tool in orange; diamond = work in progress). On narrow screens they fold into a “Tools” menu.*

- **1.9.1** (05/10/2026) : Le bouton « Accueil » passe à gauche de la barre de titre, avant les onglets des outils.
  *EN — The “Home” button moves to the left of the title bar, before the tool tabs.*

### v1.8.0 — Infobulles de la charte (04/10/2026)

Les bulles d'aide (au survol des boutons, icônes et étiquettes) prennent l'habillage de la charte : fenêtre sombre sous un filet orange, titre en blanc, détail en gris, à la place de la bulle du navigateur. Elles s'affichent aussi au clavier.

*EN — Style-guide tooltips. Help bubbles (on hover over buttons, icons and tags) now use the style guide's look: a dark window under an orange line, white heading, grey detail, instead of the browser's own bubble. They also show with the keyboard.*

- **1.8.1** (07/10/2026) : Infobulles au tactile (appui long de 0,5 s) et contraste renforcé quand le système le demande.
  *EN — Tooltips on touch screens (0.5 s long press) and higher contrast when the system asks for it.*
  - correctif **1.8.0.1** (06/10/2026) : Une bulle avec le nom du fichier de l'outil (« planner.html »…) suivait le curseur partout sur la page.
    *EN — A bubble with the tool's file name (“planner.html”…) followed the cursor all over the page.*

### v1.7.0 — Habillage des menus du jeu (02/10/2026)

Habillage au plus près des menus du jeu : fenêtres gris neutre à barre de titre, coins droits, orange du jeu pour la sélection et les valeurs, police Noto Sans embarquée dans le site (même rendu hors ligne), filet orange du HUD à la place des hachures. Les boutons du haut forment une barre de titre pleine largeur ; couleurs et polices viennent d'une charte commune.

*EN — Game-menu look. Look brought as close as possible to the game's menus: neutral grey windows with a title bar, square corners, the game's orange for selection and values, the Noto typeface shipped with the site (same look offline), the HUD's orange line instead of hazard stripes. The top buttons form a full-width title bar; colours and fonts come from one style sheet shared by every tool.*

### v1.6.0 — Fonctionnement hors ligne (30/09/2026)

Le site fonctionne hors ligne : une fois une page visitée, elle et ses fichiers sont gardés par le navigateur, pour garder l'outil ouvert à côté du jeu même sans connexion.

*EN — Offline use. The site works offline: once a page has been visited, it and its files are kept by the browser, so the tool stays usable next to the game even without a connection.*

### v1.5.0 — Ma partie, commune à tous les outils (29/09/2026)

Bouton « Ma partie » en haut à droite de chaque outil et de l'accueil : un seul endroit pour importer sa sauvegarde, que tous les outils reprennent aussitôt. L'accueil résume la partie importée.

*EN — “My game”, shared by every tool. “My game” button at the top right of every tool and of the home page: one place to import your save, which every tool picks up at once. The home page summarises the imported game.*

- **1.5.1** (29/09/2026) : Le français emploie les termes du jeu : « cadence », « surcadençage », « sous-cadençage », « éclats de charge ».
  *EN — The French text uses the game's own terms for clock speed, overclocking and power shards. English unchanged.*

### v1.4.0 — Fichiers communs et grille de paliers (26/09/2026)

La langue, le glossaire, la grille de paliers et les icônes sont chargés depuis des fichiers communs, mis en cache une fois : les pages pèsent bien moins lourd. La grille de paliers est la même dans tous les outils.

*EN — Shared files and tier grid. Language, glossary, tier grid and icons now load from shared files, cached once: pages weigh far less. The tier grid is the same in every tool.*

### v1.3.0 — Bouton Accueil (25/09/2026)

Bouton « Accueil » dans le dock en haut à droite, pour revenir à la liste des outils.

*EN — Home button. “Home” button in the top-right dock, to go back to the list of tools.*

### v1.2.0 — Données du jeu recalculées (24/09/2026)

Noms français pour toutes les recettes, alternatives comprises (160 noms d'après la localisation officielle du jeu), et paliers des recettes du MAM recalculés d'après l'arbre de recherche du wiki officiel : la plupart des recherches de départ sortent dès le palier 1 ou 2 au lieu de 3.

*EN — Game data recomputed. French names for every recipe, alternates included (160 names from the game's official localisation), and MAM recipe tiers recomputed from the official wiki's research tree: most early researches now come out at tier 1 or 2 instead of 3.*

- **1.2.1** (24/09/2026) : Mention en bas de page : le site est généré par IA.
  *EN — Footer note: the site is generated by AI.*
  - correctif **1.2.1.1** (15/10/2026) : Dans la barre commune, le texte de la mention IA en bas de chaque outil s'affiche de nouveau (l'encadré restait vide).
    *EN — In the shared bar, the AI note at the bottom of each tool shows its text again (the box stayed empty).*

### v1.1.0 — Journal des révisions (24/09/2026)

Le journal des révisions quitte le bas de page : un badge de version en haut à droite, à côté des drapeaux, le déroule d'un clic. Une pastille signale une version pas encore vue, et les nouveautés sont marquées dans le journal.

*EN — Revision log. The revision log leaves the page footer: a version badge at the top right, next to the flags, opens it in one click. A dot flags a version you haven't seen yet, and new entries are marked in the log.*

### v1.0.0 — Langue FR/EN commune (22/09/2026)

La langue se choisit avec un drapeau FR/EN commun à tous les outils, en haut à droite : textes, notes, noms du jeu et format des nombres suivent. Noms de bâtiments, d'items et de recettes de base en français d'après la localisation officielle.

*EN — Shared FR/EN language. The language is chosen with one FR/EN flag shared by every tool, at the top right: texts, notes, game names and number format follow. Building, item and base-recipe names in French, from the game's official localisation.*

## Planificateur de production / Production planner — `planner.html`

### v1.14.0 — Alternatives toujours disponibles (10/10/2026)

Plus de case « Alternatives » : les recettes alternatives sont toujours proposées sur un bloc (menu ⇄ et liste), en mode standard comme optimisé. La recette par défaut reste la standard tant que vous n'en choisissez pas une autre, et l'optimisation continue de les comparer toute seule.

*EN — Alternates always available. No more “Alternates” checkbox: alternate recipes are always offered on a block (⇄ menu and list), in standard as in optimised mode. The default stays the standard recipe until you choose another, and optimisation still compares them on its own.*

  - correctif **1.14.0.1** (15/10/2026) : Le champ de quantité d'un objectif (− / valeur / +) est aligné au pixel sur le sélecteur d'item : même hauteur, même bord haut (décalé d'une fraction de pixel).
    *EN — A target's quantity field (− / value / +) lines up to the pixel with the item picker: same height and same top edge (it was off by a fraction of a pixel).*
  - correctif **1.14.0.2** (15/10/2026) : Le menu de choix de l'item d'un objectif s'ouvre de nouveau juste sous son bouton (il s'ouvrait environ 230 px plus bas, sur le bilan).
    *EN — A target's item picker opens right under its button again (it opened about 230 px lower, over the summary).*

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

### v1.4.0 — Vue d'ensemble façon inventaire (01/10/2026)

Une ligne par item (Uploaders et stock du Depot réunis) avec le débit théorique, le plafond qui le limite, le stock, la limite et le temps avant plein ; un carré rouge signale un Depot plein. Le détail d'un item s'ouvre au clic. Le débit affiché est le débit théorique, que le Depot soit plein ou non.

*EN — Inventory-style overview. One line per item (Uploaders and Depot stock together) with the theoretical rate, the cap limiting it, the stock, the limit and the time to full; a red square flags a full Depot. An item's detail opens on click. The rate shown is the theoretical one, whether the Depot is full or not.*

- **1.4.1** (04/10/2026) : L'infobulle d'une ligne de l'inventaire se place près du curseur.
  *EN — An inventory row's tooltip sits near the cursor.*

### v1.3.0 — Fluides et circuits électriques (30/09/2026)

Chaque réseau de tuyaux devient un réservoir commun : les machines sont limitées par leurs fluides, les centrales par leur eau, et un réseau à qui il manque du fluide est signalé. Chaque bâtiment est rattaché à son circuit : bilan par circuit, circuit en déficit ou sans générateur signalé, bâtiment sur un fusible grillé compté à l'arrêt.

*EN — Fluids and power circuits. Each pipe network becomes a shared tank: machines are limited by their fluids, power plants by their water, and a network short of fluid is flagged. Each building is tied to its circuit: balance per circuit, deficit or generator-less circuit flagged, building on a blown fuse counted as stopped.*

- **1.3.1** (30/09/2026) : Première visite plus rapide (~14 s au lieu de ~20 sur une grosse usine), avec une barre de progression pendant le calcul.
  *EN — Faster first visit (~14 s instead of ~20 on a big factory), with a progress bar during the calculation.*

### v1.2.0 — Régime actuel de l'usine (29/09/2026)

Un conteneur qui a de la place sert l'aval d'abord puis garde le surplus, avec le temps avant plein ; gares, quais de camion et ports de drones forment un réservoir commun par famille ; générateurs à combustible solide, bilan électrique estimé et fusibles grillés lus dans la sauvegarde.

*EN — The factory's current state. A container with room serves downstream first then keeps the surplus, with the time to full; stations, truck stops and drone ports form one shared tank per family; solid-fuel generators, estimated power balance and blown fuses read from the save.*

- **1.2.2** (29/09/2026) : Outil signalé « en chantier » ; un bouton « Réimporter ma sauvegarde » si le fichier n'a pas été gardé par le navigateur.
  *EN — Tool flagged “work in progress”; a “Re-import my save” button if the browser did not keep the file.*
  - correctif **1.2.2.1** (02/10/2026) : Une sauvegarde importée depuis une autre page est reprise ici, même au retour par « précédent » ; un import interrompu ne fait plus perdre la partie précédente.
    *EN — A save imported from another page is picked up here, even when coming back with “Back”; an interrupted import no longer loses the previous game.*
  - correctif **1.2.2.2** (02/10/2026) : Une grosse sauvegarde est gardée sur disque, avec un stockage de secours ; le panneau donne l'erreur exacte du navigateur si les deux refusent.
    *EN — A big save is kept on disk, with a backup store; the panel gives the browser's exact error if both refuse.*
- **1.2.1** (29/09/2026) : L'outil relit le fichier gardé par le bouton « Ma partie » commun et garde l'usine et les débits calculés dans ce navigateur.
  *EN — The tool rereads the file kept by the shared “My game” button and keeps the factory and computed rates in this browser.*

### v1.1.0 — Débits théoriques (29/09/2026)

Chaque Uploader affiche son débit vers le Depot et ce qui le limite (vitesse d'envoi, Depot plein, production en amont), plus le débit potentiel si le Depot était plein. Calcul du régime permanent de toute l'usine dans un Web Worker : pureté des nœuds, cadence et Somersloops, ingrédients, plafonds des convoyeurs, séparateurs. Le tableau du stock donne la limite, le débit et le temps avant plein.

*EN — Theoretical rates. Each Uploader shows its rate to the Depot and what limits it (send speed, full Depot, upstream production), plus the potential rate if the Depot were full. Steady-state calculation of the whole factory in a Web Worker: node purity, clock speed and Somersloops, ingredients, conveyor caps, splitters. The stock table gives the limit, the rate and the time to full.*

- **1.1.1** (29/09/2026) : Les trois plafonds de chaque Uploader sont affichés séparément, le plus bas en évidence : vitesse d'envoi, raccord et chaîne en amont.
  *EN — Each Uploader's three caps are shown separately, the lowest highlighted: send speed, connection and upstream chain.*

### v1.0.0 — Lecture de l'usine (29/09/2026)

Importez une sauvegarde (.sav, lue dans le navigateur) : l'usine est reconstruite (machines, extracteurs, convoyeurs, séparateurs et leurs liaisons) et chaque Uploader est relié aux machines et extracteurs qui l'alimentent, avec le stock actuel du Depot et l'extension achetée.

*EN — Reading the factory. Import a save (.sav, read in the browser): the factory is rebuilt (machines, extractors, conveyors, splitters and their links) and each Uploader is tied to the machines and extractors feeding it, with the Depot's current stock and the bought expansion.*

## Registre des rendements / Yield registry — `satisfactory_infographie.html`

### v1.9.0 — Bouton « Mes alternatives » (04/10/2026)

Le registre n'a plus d'onglet vertical « Ma partie » : ses alternatives débloquées et ses disques durs s'ouvrent par un bouton « Mes alternatives » dans la rangée d'outils.

*EN — “My alternates” button. The registry no longer has a vertical “My game” tab: its unlocked alternates and hard drives open from a “My alternates” button in the toolbar.*

- **1.9.1** (04/10/2026) : Combinaisons et chaînes optimisées en orange ; dans une séquence, la cible est une tuile blanche et un coproduit a un trait pointillé.
  *EN — Optimised combinations and chains in orange; in a sequence, the target is a white tile and a co-product has a dotted line.*
  - correctif **1.9.0.1** (10/10/2026) : Le bouton « Importer ma partie » du panneau « Mes alternatives » ne faisait rien dans la barre commune ; il ouvre maintenant le panneau « Ma partie ».
    *EN — The “Import my game” button in the “My alternates” panel did nothing in the shared bar; it now opens the “My game” panel.*
  - correctif **1.9.0.2** (02/10/2026) : L'étiquette « perdante » de la Synthèse est lisible (blanc sur rouge).
    *EN — The Synthesis “loser” label is readable (white on red).*

### v1.8.0 — Copier le lien (28/09/2026)

Bouton « Copier le lien » : un lien vers la vue affichée (critère, palier, items filtrés, onglet, tri, poids de la synthèse), sans votre partie.

*EN — Copy link. “Copy link” button: a link to the displayed view (criterion, tier, filtered items, tab, sort, synthesis weights), without your game.*

- **1.8.1** (28/09/2026) : Panneau « Ma partie » : le focus clavier y reste tant qu'il est ouvert, et chaque recalcul est annoncé aux lecteurs d'écran.
  *EN — “My game” panel: keyboard focus stays in it while open, and each recalculation is announced to screen readers.*
  - correctif **1.8.0.1** (28/09/2026) : Les séquences de production pouvaient reprendre une chaîne calculée avant un changement du filtre « Ma partie ».
    *EN — Production sequences could reuse a chain computed before a “My game” filter change.*

### v1.7.0 — Simulation des choix de disques durs (28/09/2026)

Dans le panneau « Ma partie », cochez l'alternative à retenir pour chaque disque en attente (par défaut la meilleure en Synthèse) et l'option « Simuler mes choix » : duels, combinaisons, catalogue et paliers font comme si elle était débloquée.

*EN — Simulating hard-drive choices. In the “My game” panel, tick the alternate to keep for each pending drive (best in Synthesis by default) and the “Simulate my choices” option: duels, combinations, catalogue and tiers behave as if it were unlocked.*

- **1.7.2** (28/09/2026) : Import de la sauvegarde environ cinq fois plus rapide (1 s au lieu de 5 pour 5 Mo) et bien plus économe en mémoire.
  *EN — Save import about five times faster (1 s instead of 5 for 5 MB) and far lighter on memory.*
- **1.7.1** (28/09/2026) : Le palier se règle sur celui de votre partie à chaque import ; un bandeau rappelle le filtre et la simulation ; les alternatives simulées sont marquées « simulée ».
  *EN — The tier follows your game's on each import; a banner recalls the filter and the simulation; simulated alternates are marked “simulated”.*
  - correctif **1.7.0.1** (28/09/2026) : Sur téléphone, les onglets, les noms longs et les chiffres clés ne débordent plus de l'écran.
    *EN — On phones, tabs, long names and key figures no longer overflow the screen.*

### v1.6.0 — Disques durs en attente (27/09/2026)

Le panneau « Ma partie » liste les disques durs analysés dans le MAM mais pas encore réclamés : pour chaque alternative proposée, son score Synthèse, son gain face à la base et son verdict, meilleur choix signalé ; les alternatives débloquées ou manquantes sont notées sur le critère affiché.

*EN — Pending hard drives. The “My game” panel lists hard drives analysed in the MAM but not yet claimed: for each alternate offered, its Synthesis score, its gain against the base and its verdict, best choice flagged; unlocked or missing alternates are rated on the displayed criterion.*

### v1.5.0 — Ma partie : recettes débloquées (26/09/2026)

Après import de votre sauvegarde depuis l'accueil, le registre peut ne garder que les recettes débloquées dans votre partie (énergie, espace et synthèse instantanés ; matière en quelques secondes au pire).

*EN — My game: unlocked recipes. After importing your save from the home page, the registry can keep only the recipes unlocked in your game (energy, space and synthesis instant; material a few seconds at worst).*

### v1.4.0 — Critère Synthèse (24/09/2026)

Énergie, matière et espace réunis en un coût composite (taux de change médians entre critères), pondérés par trois curseurs. Chaque alternative y est classée gagnante, compromis ou perdante face à sa recette de base ; les combinaisons suivent les curseurs, recalculées dans la page.

*EN — Synthesis criterion. Energy, material and space combined into one composite cost (median exchange rates between criteria), weighted by three sliders. Each alternate is ranked winner, trade-off or loser against its base recipe; combinations follow the sliders, recomputed in the page.*

- **1.4.1** (26/09/2026) : Page allégée de 190 Ko : les combinaisons Énergie et Espace sont calculées dans la page, pour le palier affiché.
  *EN — Page 190 KB lighter: Energy and Space combinations are computed in the page, for the displayed tier.*
  - correctif **1.4.0.1** (24/09/2026) : Indices Énergie et Matière recalculés avec le même modèle de coût que l'Espace : une quarantaine de recettes à base de pétrole ou de coproduits changent de valeur.
    *EN — Energy and Material indices recomputed by the page with the same cost model as Space: some forty oil- or co-product-based recipes change value.*

### v1.3.0 — Critère Espace (24/09/2026)

Nouveau critère « Espace » : chaque recette et chaque combinaison notée en sortie par m² au sol, machines et extraction surcadencées à 250 %. La séquence décrit les bâtiments employés (foreuses, pompes, puits d'azote, nombre et m² par étape, récapitulatif par type).

*EN — Space criterion. New “Space” criterion: each recipe and combination rated by output per m² of floor, machines and extraction overclocked to 250%. The sequence describes the buildings used (miners, pumps, nitrogen wells, count and m² per step, summary by type).*

- **1.3.1** (24/09/2026) : Emprises des bâtiments reprises du wiki (Assembler 9 × 16, Refinery 10 × 22…) et azote compté sur l'ensemble des puits du monde.
  *EN — Building footprints taken from the wiki (Assembler 9 × 16, Refinery 10 × 22…) and nitrogen counted over all the world's wells.*

### v1.2.0 — Filtre par palier atteint (21/09/2026)

Recettes, alternatives et combinaisons se limitent à ce qui est réellement jouable au palier choisi.

*EN — Filter by reached tier. Recipes, alternates and combinations are limited to what is actually playable at the chosen tier.*

- **1.2.5** (24/09/2026) : Registre sans plafond de palier recalculé par script ; nombres de chaînes recomptés (Concrete 47 → 77, Rotor 19 688 → 32 528).
  *EN — Registry without a tier cap recomputed by script; chain counts recounted (Concrete 47 → 77, Rotor 19,688 → 32,528).*
- **1.2.4** (24/09/2026) : Paliers des alternatives de disque dur calculés depuis les recherches du MAM qu'elles exigent (Cheap Silica, Fine Concrete… passent au palier 3).
  *EN — Hard-drive alternate tiers computed from the MAM researches they require (Cheap Silica, Fine Concrete… move to tier 3).*
- **1.2.3** (23/09/2026) : Paliers recalculés depuis un référentiel unique : 29 recettes changent de palier (Sloppy Alumina 5 → 7, Steel Canister 3 → 5), recettes SAM comprises.
  *EN — Tiers recomputed from a single reference: 29 recipes change tier (Sloppy Alumina 5 → 7, Steel Canister 3 → 5), SAM recipes included.*
- **1.2.2** (22/09/2026) : Interface bilingue FR/EN : textes, notes, séquences et journal suivent le drapeau commun.
  *EN — Bilingual FR/EN interface: texts, notes, sequences and log follow the shared flag.*
- **1.2.1** (22/09/2026) : Réglages mémorisés d'une visite à l'autre, avec un bouton Réinitialiser.
  *EN — Settings remembered between visits, with a Reset button.*
  - correctif **1.2.0.1** (21/09/2026) : Cinq optimums du mode Matière (famille du moteur) corrigés.
    *EN — Five Material-mode optima (motor family) fixed.*

### v1.1.0 — Combinaisons en séquence (15/09/2026)

Chaque chaîne du podium se déroule étape par étape, de l'extraction à la cible, avec machines, horloges et coproduits. La séquence s'affiche au clic.

*EN — Combinations as sequences. Each podium chain unfolds step by step, from extraction to the target, with machines, clock speeds and co-products. The sequence shows on click.*

### v1.0.0 — Registre des rendements (05/09/2026)

Chaque recette notée en sortie par mégawatt (Énergie) et par matière brute (Matière), onglets Duels, Combinaisons et Catalogue, filtre multi-items et noms français.

*EN — Yield registry. Each recipe rated by output per megawatt (Energy) and per raw material (Material), Duels, Combinations and Catalogue tabs, multi-item filter and French names.*

## Module d'étalonnage / Calibration module — `ficsit_horloge.html`

### v1.1.0 — Régime d'éclats selon votre partie (30/09/2026)

Le régime d'éclats se règle sur votre partie importée : « éclats illimités » si l'éclat de charge synthétique est débloqué, « éclats rares » sinon. Réglé à chaque nouvel import, toujours modifiable à la main.

*EN — Shard regime from your game. The shard regime follows your imported game: “unlimited shards” if the synthetic power shard is unlocked, “scarce shards” otherwise. Set on each new import, still editable by hand.*

### v1.0.0 — Cadence et éclats (14/09/2026)

Pour un besoin T en machines-équivalent, toutes les répartitions possibles avec cadence, éclats, MW et écart à la répartition sans éclat. Régime éclats rares ou illimités, mode linéaire des générateurs.

*EN — Clock speed and shards. For a need T in machine-equivalents, every possible split with clock speed, shards, MW and gap to the shard-free split. Scarce or unlimited shards, linear mode for generators.*

- **1.0.3** (26/09/2026) : Liste des bâtiments tirée du référentiel du jeu (puissances, production des générateurs, plages de puissance variable).
  *EN — Building list drawn from the game reference (power, generator output, variable-power ranges).*
  - correctif **1.0.3.1** (26/09/2026) : Plage de l'accélérateur de particules corrigée (250 – 1 500 MW) ; plus de code parasite dans l'infobulle du constructeur.
    *EN — Particle accelerator range fixed (250 – 1,500 MW); no more stray code in the constructor tooltip.*
- **1.0.2** (22/09/2026) : Version anglaise : noms de bâtiments, formule et fourchettes de consommation traduits.
  *EN — English version: building names, formula and consumption ranges translated.*
- **1.0.1** (22/09/2026) : Vos réglages sont mémorisés d'une visite à l'autre, avec un bouton Réinitialiser.
  *EN — Your settings are remembered between visits, with a Reset button.*
  - correctif **1.0.0.1** (28/09/2026) : Sur téléphone, la page ne déborde plus horizontalement : le tableau de résultats défile dans son cadre et le titre s'adapte.
    *EN — On phones, the page no longer overflows horizontally: the results table scrolls in its frame and the title adapts.*

## Optimiseur de recyclage / Recycling optimizer — `broyeur-excedents.html`

### v1.3.0 — Ma partie (28/09/2026)

Avec une sauvegarde importée dans le registre des rendements : option (cochée par défaut) pour ne garder que les cibles que vos recettes débloquées, ou simulées, savent fabriquer ; le palier se règle sur celui de votre partie.

*EN — My game. With a save imported in the yield registry: an option (ticked by default) to keep only the targets your unlocked, or simulated, recipes can make; the tier follows your game's.*

### v1.2.0 — Palier à icônes et avancement de la chaîne (25/09/2026)

Le palier se choisit dans une grille à icônes, comme dans le registre ; il part du palier minimum qu'impliquent vos excédents, et seuls les paliers qui apportent au moins une nouvelle cible sont cliquables. Le filtre « minerai neuf », qui ne correspondait pas aux données observées, est retiré ; « Chaîne déjà payée » devient « avancement de la chaîne ».

*EN — Icon tiers and chain progress. The tier is picked in an icon grid, as in the registry; it starts at the minimum tier your surplus implies, and only tiers bringing at least one new target are clickable. The “new ore” filter, which did not match observed data, is removed; “Chain already paid” becomes “chain progress”.*

- **1.2.1** (25/09/2026) : Grille de paliers plus lisible : un palier non cliquable est hachuré et bordé de pointillés.
  *EN — Tier grid easier to read: a non-clickable tier is hatched with a dotted border.*

### v1.1.0 — Données recalculées (24/09/2026)

Données recalculées par script depuis le référentiel commun : minerai neuf et machines se lisent sur la chaîne affichée (celle qui consomme le moins de MW) au lieu d'être minimisés chacun de leur côté, donc souvent plus élevés (AI Limiter : 7,3 → 22 minerai/min). Paliers alignés sur les autres outils (Circuit Board 3 → 5, Motor 7 → 8…).

*EN — Recomputed data. Data recomputed by script from the shared reference: new ore and machines are read on the displayed chain (the one using the fewest MW) instead of each being minimised on its own, so often higher (AI Limiter: 7.3 → 22 ore/min). Tiers aligned with the other tools (Circuit Board 3 → 5, Motor 7 → 8…).*

- **1.1.1** (24/09/2026) : Les recettes alternatives s'affichent sans le préfixe « Alternate: », suivies de « (alternative) ».
  *EN — Alternate recipes show without the “Alternate:” prefix, followed by “(alternate)”.*

### v1.0.0 — Optimiseur de recyclage (02/09/2026)

À partir des excédents saisis, classement des cibles du broyeur AWESOME par points gagnés par mégawatt investi, avec filtres de palier et de minerai supplémentaire. Rangé avec « Complexité et valeur au broyeur » dans la catégorie Recyclage de l'accueil.

*EN — Recycling optimiser. From the surplus you enter, ranking of AWESOME Sink targets by points gained per megawatt invested, with tier and extra-ore filters. Filed with “Complexity and sink value” in the Recycling category of the home page.*

- **1.0.2** (24/09/2026) : Style unifié avec les autres outils (polices, palette, grand titre) ; la page s'allège de 76 Ko.
  *EN — Style unified with the other tools (fonts, palette, big title); the page is 76 KB lighter.*
- **1.0.1** (22/09/2026) : Excédents, débits, tri, filtres et langue sont mémorisés d'une visite à l'autre, avec un bouton Réinitialiser.
  *EN — Surplus, rates, sort, filters and language are remembered between visits, with a Reset button.*
  - correctif **1.0.1.1** (22/09/2026) : La bascule FR/EN ne plante plus et le filtre de palier n'est plus remis à « tous » au changement de langue.
    *EN — The FR/EN switch no longer crashes and the tier filter is no longer reset to “all” when the language changes.*

## Mémo de terrain / Field memo — `memo-ficsit.html`

### v1.1.0 — Jalons du HUB et extraction selon votre partie (30/09/2026)

Avec une partie importée, les jalons du HUB obtenus sont cochés et les paliers complets marqués, avec un bilan en tête de section ; l'extraction suit votre matériel : foreuses et convoyeurs pas encore débloqués sont grisés, avec un bandeau sur la meilleure foreuse et le meilleur convoyeur dont vous disposez.

*EN — HUB milestones and extraction from your game. With an imported game, HUB milestones you got are ticked and completed tiers marked, with a summary at the top of the section; extraction follows your gear: miners and conveyors not yet unlocked are greyed out, with a banner on the best miner and conveyor you have.*

- **1.1.1** (06/10/2026) : Couleurs des convoyeurs partagées avec le planificateur ; Mk.1 et Mk.2 éclaircis, plus lisibles.
  *EN — Conveyor colours shared with the planner; Mk.1 and Mk.2 lightened, easier to read.*

### v1.0.0 — Mémo de terrain (31/08/2026)

Extraction par pureté de nœud et par cadence, débits des convoyeurs, déblocages du HUB par palier et arborescence des pièces d'Ascenseur spatial.

*EN — Field memo. Extraction by node purity and clock speed, conveyor rates, HUB unlocks by tier and the Space Elevator part tree.*

- **1.0.2** (01/10/2026) : Rangé dans la catégorie « Tableaux de lecture » de l'accueil, avec la rentabilité énergétique par nœud.
  *EN — Filed in the “Reading tables” category of the home page, with the energy yield per node.*
- **1.0.1** (22/09/2026) : Version anglaise complète ; noms de bâtiments alignés sur la localisation française du jeu.
  *EN — Full English version; building names aligned with the game's French localisation.*
  - correctif **1.0.0.1** (22/09/2026) : Huit recettes corrigées dans l'arbre des pièces de projet (batterie, turbomoteur, cube de conversion de pression…).
    *EN — Eight recipes fixed in the project-parts tree (battery, turbo motor, pressure conversion cube…).*
  - correctif **1.0.0.2** (28/09/2026) : Sur très petit écran (320 px), les bandeaux de palier et les noms longs se replient au lieu de déborder.
    *EN — On very small screens (320 px), tier strips and long names wrap instead of overflowing.*

## Complexité et valeur au broyeur / Complexity vs sink value — `arbre-production.html`

### v1.1.0 — Chaîne « Ma partie » (28/09/2026)

Troisième chaîne dès qu'une sauvegarde est importée dans le registre : pour chaque item, l'alternative de la chaîne optimisée si vous l'avez débloquée (ou simulée), sinon la recette de base. Le palier se règle sur celui de votre partie.

*EN — “My game” chain. A third chain as soon as a save is imported in the registry: for each item, the optimised chain's alternate if you unlocked (or simulated) it, otherwise the base recipe. The tier follows your game's.*

- **1.1.1** (04/10/2026) : L'infobulle du graphique reprend l'habillage commun des bulles d'aide (points AWESOME en orange).
  *EN — The chart tooltip uses the shared help-bubble look (AWESOME points in orange).*

### v1.0.0 — Complexité et valeur au broyeur (24/09/2026)

Profondeur de l'arbre de production et nombre d'items intermédiaires de chaque item broyable, face à sa valeur AWESOME, en recettes de base ou en chaîne optimisée (MW), filtrable par palier. Les minerais bruts solides figurent à profondeur 0. Rangé avec l'optimiseur dans la catégorie Recyclage de l'accueil.

*EN — Complexity and sink value. Production-tree depth and number of intermediate items for each sinkable item, against its AWESOME value, in base recipes or in the optimised chain (MW), filterable by tier. Solid raw ores appear at depth 0. Filed with the optimiser in the Recycling category of the home page.*

- **1.0.1** (26/09/2026) : Le palier se choisit dans la même grille à icônes que les autres outils : seuls les paliers qui font apparaître un item sont cliquables.
  *EN — The tier is picked in the same icon grid as the other tools: only tiers that bring up at least one item are clickable.*

## Rentabilité énergétique par nœud / Power per node — `energie-noeuds.html`

### v1.0.0 — Rentabilité énergétique par nœud (01/10/2026)

À lire sans rien régler : combien de MW nets tirer d'un seul nœud, filière par filière (charbon, carburant et ses variantes, turbocarburant, carburant de fusée, carburant ionisé, uranium, géothermie), par pureté du nœud, à 100 % et à 250 % de cadence. Nets : extraction, machines de la chaîne et ressources d'appoint payées. Avec une partie importée, foreuse, convoyeur et tuyau sont les vôtres, et les filières pas débloquées sont grisées.

*EN — Energy yield per node. To read without setting anything: how many net MW to draw from a single node, chain by chain (coal, fuel and its variants, turbofuel, rocket fuel, ionized fuel, uranium, geothermal), by node purity, at 100% and 250% clock speed. Net of extraction, the chain's machines and the top-up resources paid for. With an imported game, the miner, conveyor and pipe are yours, and chains not yet unlocked are greyed out.*

- **1.0.2** (01/10/2026) : Icônes des ressources dans la description de chaque filière.
  *EN — Resource icons in each chain's description.*
- **1.0.1** (01/10/2026) : Carburant ionisé : ses éclats de charge passent par la recette synthétique (palier 9) ; la filière donne environ 23 900 MW nets par nœud de pétrole normal.
  *EN — Ionized fuel: its power shards come from the synthetic recipe (tier 9); the chain yields about 23,900 net MW per normal oil node.*
