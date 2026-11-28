/* Offline cache script for /app/ : shell cache (versioned) + one cache per downloaded day ("de100-day-NNN").
   Audio is answered from the day caches when present, with byte-range (206) support for iPhone/Safari. */
var V='de100-shell-64b7ae8f',SHELL=["./", "index.html", "main.js", "content.js", "talk.js", "stuck.js", "live.js", "shadowall.js", "interp.js", "call.js", "drama.js", "app.css", "../audio/stuck/pol_1.mp3", "../audio/stuck/pol_2.mp3", "../audio/stuck/pol_3.mp3", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "../app.js", "../style.css"];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL.map(function(u){return new Request(u,{cache:'reload'});}));}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('de100-shell-')===0&&k!==V;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
function ranged(req,resp){var r=req.headers.get('range');if(!r)return resp;
 return resp.arrayBuffer().then(function(buf){var m=/bytes=(\d*)-(\d*)/.exec(r)||[],n=buf.byteLength,s=m[1]?+m[1]:0,e=m[2]?Math.min(+m[2],n-1):n-1;
  if(!m[1]&&m[2]){s=Math.max(0,n-(+m[2]));e=n-1;}
  return new Response(buf.slice(s,e+1),{status:206,statusText:'Partial Content',headers:{'Content-Type':resp.headers.get('Content-Type')||'audio/mpeg','Content-Range':'bytes '+s+'-'+e+'/'+n,'Content-Length':String(e-s+1),'Accept-Ranges':'bytes'}});});}
self.addEventListener('fetch',function(e){var req=e.request;if(req.method!=='GET')return;var u=new URL(req.url);if(u.origin!==location.origin)return;
 if(/\/audio\/.+\.mp3$/.test(u.pathname)){if(req.cache==='reload'||req.cache==='no-store'){e.respondWith(fetch(req));return;}   /* refresh after an update: straight from the site */
  e.respondWith(caches.match(u.origin+u.pathname,{ignoreSearch:true,ignoreVary:true}).then(function(hit){return hit?ranged(req,hit):fetch(req);}));return;}
 if(req.mode==='navigate'&&u.pathname.indexOf('/app/')>=0){e.respondWith(fetch(req).catch(function(){return caches.match(new URL('index.html',self.registration.scope).href);}));return;}
 e.respondWith(caches.match(req,{ignoreSearch:true}).then(function(hit){return hit||fetch(req).then(function(r){
  if(r.ok&&u.pathname.indexOf('/app/')>=0){var c=r.clone();caches.open(V).then(function(cc){cc.put(req,c);});}return r;});}));});

addEventListener('periodicsync',function(e){if(e.tag==='de100-daily')e.waitUntil(self.registration.showNotification('웰컴영어 10분',{body:'오늘의 영어를 시작해요',icon:'icon-192.png',tag:'de100-daily'}));});
addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(function(cs){for(var i=0;i<cs.length;i++){if('focus' in cs[i])return cs[i].focus();}return clients.openWindow('./');}));});
