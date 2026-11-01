/* Generated version is updated by scripts/prepare-release.cjs. */
const VERSION='3b121900d46fb3b7';
const PREFIX='vocab-app:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const FILES=['./','index.html','core.js','data.js','app.js','packs.js','sessions.js','alternatives.js','offline.js','style.css','manifest.webmanifest','icon.svg'];
const URLS=FILES.map(file=>new URL(file,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  // No tokens, API calls, unrelated apps or child preview paths enter this cache.
  if(event.request.method!=='GET'||!URLS.includes(event.request.url))return;
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
