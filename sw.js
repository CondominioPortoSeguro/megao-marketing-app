const CACHE='vinnyzau-v14';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./enhancements.js','./enhancements.css','./polish.js','./polish.css','./bulk-calendar.js','./bulk-calendar.css','./themes.css','./themes.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}return response;}).catch(async()=>await caches.match(req)||await caches.match('./index.html')));}else{event.respondWith(caches.match(req).then(response=>response||fetch(req)));}
});
