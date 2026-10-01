/* FICSIT — site utilisable hors ligne (service worker, enregistré par commun/ficsit-commun.js en http(s) seulement).
   Tout se calcule dans le navigateur : il suffit de garder une copie de chaque fichier servi.
   - pages (navigation) : le réseau d'abord, pour avoir la dernière version ; la copie si le réseau manque ;
   - fichiers versionnés (?v=…, bloc commun, scripts de page) : la copie d'abord, ils ne changent jamais sous le même
     nom ; une nouvelle version remplace l'ancienne copie du même fichier ;
   - le reste (icônes, parseur, workers) : la copie tout de suite, rafraîchie en arrière-plan.
   À l'installation, les pages de l'accueil et le parseur sont copiés d'avance ; le reste l'est au fil des visites.
   Changer CACHE vide les anciennes copies (à faire si la stratégie change, pas à chaque version du site). */
var CACHE = 'ficsit-tools-1';
var AVANCE = ['./', 'index.html', 'satisfactory_infographie.html', 'ficsit_horloge.html', 'broyeur-excedents.html',
  'arbre-production.html', 'memo-ficsit.html', 'depot-dimensionnel.html',
  'energie-noeuds.html'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(AVANCE).catch(function(){}); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

// garde une copie ; pour un fichier versionné, retire les copies des autres versions du même fichier
function garder(req, rep){
  if(!rep || !rep.ok || rep.type === 'opaque') return rep;
  var copie = rep.clone(), u = new URL(req.url);
  caches.open(CACHE).then(function(c){
    var avant = u.searchParams.has('v') ? c.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ var x = new URL(k.url); return x.pathname === u.pathname && x.search !== u.search; })
        .map(function(k){ return c.delete(k); }));
    }) : Promise.resolve();
    return avant.then(function(){ return c.put(req, copie); });
  });
  return rep;
}

self.addEventListener('fetch', function(e){
  var req = e.request, u = new URL(req.url);
  if(req.method !== 'GET' || u.origin !== location.origin) return;   // polices Google, etc. : le navigateur s'en charge
  if(req.mode === 'navigate'){
    e.respondWith(fetch(req).then(function(r){ return garder(req, r); }).catch(function(){
      return caches.match(req, {ignoreSearch: true}).then(function(r){ return r || caches.match('index.html'); });
    }));
    return;
  }
  if(u.searchParams.has('v')){
    e.respondWith(caches.match(req).then(function(r){ return r || fetch(req).then(function(x){ return garder(req, x); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(r){
    var reseau = fetch(req).then(function(x){ return garder(req, x); }).catch(function(){ return r; });
    return r || reseau;
  }));
});
