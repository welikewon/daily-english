/* 웰컴 잉글리시 100 app (PWA): hash routes  #/  #/day/N  #/talk/N  #/install  — needs ../app.js (dePlay/stopAll), content.js, talk.js */
(function(){
var D=window.DAYS,V=document.getElementById('view'),AU='../audio/';
function $(s,r){return (r||document).querySelector(s);}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function did(n){return 'd'+('00'+n).slice(-3);}
function day(n){return D.filter(function(x){return x.id===+n;})[0];}
/* ---------- progress (shared keys with the day pages and the talk page) ---------- */
function prog(){var a=JSON.parse(localStorage.getItem('de100app')||'{}');a.done=a.done||{};var s=JSON.parse(localStorage.getItem('de100')||'{}');
 Object.keys(s).forEach(function(k){if(s[k]&&s[k].done){var n=+String(k).replace(/\D/g,'');if(n&&!a.done[n])a.done[n]=s[k].done;}});return a;}
function saveProg(a){localStorage.setItem('de100app',JSON.stringify(a));}
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function markDay(){var K='de100talk',st=JSON.parse(localStorage.getItem(K)||'{}');st.dates=st.dates||[];if(st.dates.indexOf(today())<0)st.dates.push(today());localStorage.setItem(K,JSON.stringify(st));}
function streak(){var st=JSON.parse(localStorage.getItem('de100talk')||'{}'),ds=st.dates||[],n=0,d=new Date();
 function key(x){return x.getFullYear()+'-'+('0'+(x.getMonth()+1)).slice(-2)+'-'+('0'+x.getDate()).slice(-2);}
 var x=new Date(d);if(ds.indexOf(key(x))<0)x.setDate(x.getDate()-1);while(ds.indexOf(key(x))>=0){n++;x.setDate(x.getDate()-1);}
 var dots='';for(var k=13;k>=0;k--){var y=new Date(d);y.setDate(d.getDate()-k);dots+='<i class="'+(ds.indexOf(key(y))>=0?'on':'')+'"></i>';}
 return '🔥 <b>'+n+'</b>일 연속 · <span class="dots">'+dots+'</span>';}
function todayDay(){var p=prog();for(var i=0;i<D.length;i++)if(!p.done[D[i].id])return D[i].id;return D[D.length-1].id;}
/* ---------- install state ---------- */
var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
var isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
var deferred=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;$$('.instbtn').forEach(function(b){b.hidden=false;});});
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
/* ---------- settings ---------- */
var S=JSON.parse(localStorage.getItem('de100set')||'{"bg":true}');window.deKeepPlaying=!!S.bg;
function setBg(v){S.bg=v;window.deKeepPlaying=v;localStorage.setItem('de100set',JSON.stringify(S));}
/* ---------- offline day packs ---------- */
function urls(d){return d.files.map(function(f){return new URL(AU+did(d.id)+'/'+f+'.mp3',location.href).href.replace('/'+did(d.id)+'/../talk/','/talk/');});}
function cname(n){return 'de100-day-'+('00'+n).slice(-3);}
function has(n){if(!window.caches)return Promise.resolve(false);return caches.has(cname(n));}
function download(n,cb,fresh){var d=day(n),u=urls(d),i=0,fail=0;if(!window.caches){cb&&cb('이 브라우저는 내려받기를 지원하지 않아요.');return Promise.resolve(false);}
 return caches.open(cname(n)).then(function(c){function next(){if(i>=u.length)return Promise.resolve();var x=u[i++];
  return fetch(x,fresh?{cache:'reload'}:undefined).then(function(r){if(!r.ok)throw 0;return c.put(x,r);}).catch(function(){fail++;}).then(function(){cb&&cb(Math.round(100*i/u.length)+'%');return next();});}
  return next();}).then(function(){if(fail){cb&&cb('일부 파일을 받지 못했어요 ('+fail+'개). 인터넷 연결을 확인하고 다시 눌러 주세요.');return false;}cb&&cb('완료');return true;});}
function remove(n){return window.caches?caches.delete(cname(n)):Promise.resolve(false);}
function usage(el){if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(function(e){el.textContent='이 휴대폰에 저장한 양: 약 '+(e.usage/1e6).toFixed(1)+' MB';});}
/* ---------- screens ---------- */
function top(title,sub,back){return '<button class="fsback" data-big="0">가 보통 글씨로 · Normal text</button><header class="atop">'+(back?'<a class="aback" href="'+back[0]+'">← '+esc(back[1])+'</a>':'')+'<div class="hbtn"><button data-go="#/update">🔄 업데이트<small>Update</small></button><button data-go="#/settings">⚙ 설정<small>Settings</small></button></div><div class="k">웰컴 잉글리시 100</div><h1>'+esc(title)+'</h1>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</header>';}
/* ---------- big text (persists) ---------- */
function bigOn(){return localStorage.getItem('de100big')==='1';}
document.documentElement.classList.toggle('bigtext',bigOn());
function bigBtn(){return '<div class="fsz" role="group"><span>글자 크기 · Text size</span><button class="fszb" data-big="0">가 보통 · Normal</button><button class="fszb" data-big="1">가 크게 · Big</button></div>';}
window.deBigBtn=bigBtn;
function bindBig(){}
/* one handler for every 「글자 크기」 picker and the 「가 보통 글씨로」 button (state is shown by CSS from html.bigtext) */
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-big]');if(!b)return;var v=b.dataset.big==='1';if(v===bigOn())return;
 localStorage.setItem('de100big',v?'1':'0');document.documentElement.classList.toggle('bigtext',v);try{window.dispatchEvent(new Event('resize'));}catch(x){}});
/* ---------- auto review: must-say sentences from days done 1, 3, 7 days ago ---------- */
function dstr(dt){return dt.getFullYear()+'-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+('0'+dt.getDate()).slice(-2);}
function reviewItems(){var p=prog(),out=[],seen={};
 [1,3,7].forEach(function(k){var dt=new Date();dt.setDate(dt.getDate()-k);var key=dstr(dt);
  Object.keys(p.done).forEach(function(id){if(p.done[id]!==key)return;var d=day(+id);if(!d)return;
   (d.must&&d.must.length?d.must:[1,2]).forEach(function(n){var s=d.sentences[n-1];if(!s||seen[id+'_'+n])return;seen[id+'_'+n]=1;
    out.push({day:+id,en:s.en,ko:s.ko,src:'../audio/'+did(+id)+'/s'+('0'+n).slice(-2)+'.mp3'});});});});
 var st=(window.deStars?window.deStars():[]).filter(function(x){return [1,3,7].some(function(k){var dt=new Date();dt.setDate(dt.getDate()-k);return x.saved===dstr(dt);});}).slice(0,2);
 var pick=[],i=0;while(pick.length<5-st.length&&out.length){pick.push(out.splice(i%out.length,1)[0]);i++;}
 st.forEach(function(x){pick.push({day:0,en:x.en,ko:x.ko,src:null,star:1});});return pick;}
var REVT=0;document.addEventListener('click',function(e){if(e.target.closest('#pstop'))REVT++;},true);window.addEventListener('hashchange',function(){REVT++;});
function playReview(items,btn){var tok=++REVT,i=0,rep=0;
 function next(){if(tok!==REVT)return;if(i>=items.length){$$('.rv').forEach(function(r){r.classList.remove('now');});window.__revDone=1;return;}
  $$('.rv').forEach(function(r,k){r.classList.toggle('now',k===i);});var it=items[i];
  var after=function(){if(tok!==REVT)return;rep++;if(rep>=2){rep=0;i++;}window.__revPlays=(window.__revPlays||0)+1;setTimeout(next,rep?800:1500);};
  if(!it.src&&window.deTR){window.deTR.say(it.en,'en',0.9,after);return;}   /* saved sentence (no recording): phone voice */
  dePlay(it.src,{label:'🔁 오늘 복습 '+(i+1)+' / '+items.length,btn:btn,onend:after});}
 next();}
/* ---------- daily reminder: calendar event (no server); Android app bonus: notification ---------- */
function icsFor(h){var now=new Date(),st=new Date();st.setHours(h,0,0,0);if(st<now)st.setDate(st.getDate()+1);
 var z=function(n){return ('0'+n).slice(-2);},loc=st.getFullYear()+z(st.getMonth()+1)+z(st.getDate())+'T'+z(h)+'0000',
  stamp=now.toISOString().replace(/[-:]/g,'').replace(/.d+/,''),url=new URL('./',location.href).href;
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//daily-english//app//KO','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:de100-daily-'+h+'@daily-english','DTSTAMP:'+stamp,'DTSTART:'+loc,'DURATION:PT10M','RRULE:FREQ=DAILY',
  'SUMMARY:웰컴영어 10분','DESCRIPTION:오늘의 영어 10분: '+url,'URL:'+url,'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:웰컴영어 10분','TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n')+'\r\n';}
function remind(h){var ics=icsFor(h);window.__ics=ics;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));a.download='웰컴영어_알림.ics';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},1000);
 localStorage.setItem('de100remind',String(h));$('#remst').textContent='달력 앱이 열리면 「추가」 또는 「저장」을 누르세요. 매일 '+(h===7?'아침 7시 · 7 AM':h===12?'낮 12시 · 12 PM':'저녁 9시 · 9 PM')+'에 알려 줘요.';
 if(standalone&&'Notification' in window&&navigator.serviceWorker){Notification.requestPermission().then(function(pm){if(pm!=='granted')return;navigator.serviceWorker.ready.then(function(reg){if(reg.periodicSync)reg.periodicSync.register('de100-daily',{minInterval:12*3600*1000}).then(function(){window.__psync=1;}).catch(function(){});});});}}
/* ---------- 🔄 새 내용 받기 · Get updates (version.json on the site; one tap = new files + reload) ---------- */
var APPV='2026.11.27-9';window.APPV=APPV;var EDN=/\/g\//.test(location.pathname)?'general':'pastors';
function vfetch(){return fetch('../version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json();});}
function vnotes(j){return '<div class="updn"><b>이번에 달라진 점 · What is new</b><ul>'+(j.notes_ko||[]).map(function(k,i){return '<li>'+esc(k)+'<br><span class="n2">'+esc((j.notes_en||[])[i]||'')+'</span></li>';}).join('')+'</ul></div>';}
function doUpdate(st){st.innerHTML='<p>⏳ 새 내용을 받는 중… · Downloading…</p>';localStorage.setItem('de100redl','1');
 var go=function(){location.reload();};if(!navigator.serviceWorker){go();return;}
 navigator.serviceWorker.getRegistration().then(function(reg){if(!reg){go();return;}var t=setTimeout(go,15000);
  navigator.serviceWorker.addEventListener('controllerchange',function(){clearTimeout(t);go();});
  reg.update().then(function(){if(!reg.installing&&!reg.waiting){clearTimeout(t);go();}}).catch(function(){clearTimeout(t);go();});}).catch(go);}
function vcheck(st,auto){if(!navigator.onLine){if(!auto)st.innerHTML='<p>📶 인터넷에 연결되면 받을 수 있어요. · You can get it when you are online.</p>';return Promise.resolve(null);}
 if(!auto)st.innerHTML='<p>⏳ 확인하는 중… · Checking…</p>';
 return vfetch().then(function(j){window.__vj=j;if(j.version===APPV){if(!auto)st.innerHTML='<p class="updok">✓ 최신 버전이에요 · Up to date<br><span class="n2">'+esc(j.version)+' · '+esc(j.date)+'</span></p>';return null;}
  st.innerHTML='<div class="updnew"><b>🆕 새 버전이 있어요 · New version</b> <span class="n2">'+esc(j.version)+' · '+esc(j.date)+'</span>'+vnotes(j)+'<button class="go updnow">⬇ 지금 받기 · Update now</button></div>';
  st.querySelector('.updnow').onclick=function(){doUpdate(st);};return j;})
  .catch(function(){if(!auto)st.innerHTML='<p>📶 인터넷에 연결되면 받을 수 있어요. · You can get it when you are online.</p>';return null;});}
function pdfInfo(st){st.innerHTML='<p>⏳ …</p>';vfetch().then(function(j){var p=(j.pdf||{})[EDN]||{};
  if(p.status!=='ready'||!p.url){st.innerHTML='<p>📕 곧 나와요 · Coming soon</p>';return;}
  st.innerHTML='<p><b>'+esc(p.title||'웰컴 잉글리시 100')+'</b><br><span class="n2">'+esc(p.version||'')+' · '+esc(p.date||'')+'</span></p>'+((p.notes_ko||[]).length?'<div class="updn"><b>이번 판에서 달라진 점 · What changed</b><ul>'+p.notes_ko.map(function(k){return '<li>'+esc(k)+'</li>';}).join('')+'</ul></div>':'')+
   '<a class="go" href="'+esc(p.url)+'" download>⬇ PDF 받기 · Download PDF</a>';}).catch(function(){st.innerHTML='<p>📶 인터넷에 연결되면 받을 수 있어요. · You can get it when you are online.</p>';});}
function settingsCard(){return '<div class="card setc" id="setc"><b>⚙ 설정 · Settings</b>'+bigBtn()+'<div class="n2">버전 · Version '+esc(APPV)+'</div>'+
 '<button id="updgo" class="big2">🔄 새 내용 받기 · Get updates</button><div id="updst"></div><button id="pdfgo" class="big2">📕 최신 PDF 받기 · Latest PDF</button><div id="pdfst"></div></div>';}
function bindSettings(){var u=document.getElementById('updgo');if(!u)return;u.onclick=function(){vcheck(document.getElementById('updst'),false);};document.getElementById('pdfgo').onclick=function(){pdfInfo(document.getElementById('pdfst'));};
 if(location.hash==='#/update'||location.hash==='#/settings'){var g=location.hash;history.replaceState(null,'','#/');setTimeout(function(){homeGo(g);},60);}
 vbar();}
/* header buttons 「🔄 업데이트」 / 「⚙ 설정」 (every main screen) */
function homeGo(g){var c=document.getElementById('setc');if(!c)return;c.scrollIntoView({block:'start'});c.classList.add('flash');setTimeout(function(){c.classList.remove('flash');},1500);if(g==='#/update')vcheck(document.getElementById('updst'),false);}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.hbtn [data-go]');if(!b)return;var g=b.dataset.go;if(document.getElementById('setc')&&(!location.hash||location.hash==='#/'))homeGo(g);else location.hash=g;});
/* every time the app opens or comes back: yellow bar when a newer version exists (✕ hides it until the next version) */
var vLast=0;
var vJ=null;
function vbar(){if(!navigator.onLine||Date.now()-vLast<30000){if(vJ)showBar(vJ);return;}vLast=Date.now();
 vfetch().then(function(j){window.__vbarChecked=(window.__vbarChecked||0)+1;vJ=j;showBar(j);}).catch(function(){});}
function showBar(j){var old=document.getElementById('updbar');
  if(j.version===APPV||localStorage.getItem('de100vdis')===j.version||/^#\/tr/.test(location.hash)){if(old)old.remove();return;}if(old)return;
  var b=document.createElement('div');b.id='updbar';b.innerHTML='<button class="ubgo">🔄 새 내용이 있어요 · Tap to update</button><button class="ubx" aria-label="닫기 · Close">✕</button>';document.body.insertBefore(b,document.body.firstChild);
  b.querySelector('.ubx').onclick=function(){localStorage.setItem('de100vdis',j.version);b.remove();};
  b.querySelector('.ubgo').onclick=function(){b.remove();if(document.getElementById('setc')&&(!location.hash||location.hash==='#/'))homeGo('#/update');else location.hash='#/update';};}
setTimeout(vbar,1200);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'){vLast=0;vbar();}});
window.addEventListener('hashchange',function(){if(/^#\/tr/.test(location.hash)){var o=document.getElementById('updbar');if(o)o.remove();}else if(vJ)showBar(vJ);});
/* after an update: refresh the days already downloaded, quietly */
if(localStorage.getItem('de100redl')==='1'){localStorage.removeItem('de100redl');window.__redl=0;setTimeout(function(){if(!window.caches)return;caches.keys().then(function(ks){ks.filter(function(k){return /^de100-day-\d{3}$/.test(k);}).forEach(function(k){var n=+k.slice(-3);if(day(n))download(n,null,true).then(function(){window.__redl++;});});});},1500);window.__updated=APPV;}
function home(){var p=prog(),t=todayDay(),td=day(t);
 var h=top('오늘의 영어','<div class="streak">'+streak()+'</div>')+bigBtn();
 if(window.deTR&&window.deTR.url())h+='<a class="trtop" href="#/tr">🗣 바로 통역 · Live interpreter<span>한국어 ↔ English · 누르고 바로 말하세요 · Tap and speak</span></a>';
 var rv=localStorage.getItem('de100revskip')===today()?[]:reviewItems();window.__revN=rv.length;
 if(rv.length)h+='<div class="card revcard"><b class="inst">🔁 오늘 복습 '+rv.length+'개</b>'+rv.map(function(x){return '<div class="rv"><div class="en">'+esc(x.en)+'</div><div class="n2">'+esc(x.ko)+' · '+(x.star?'⭐ 내가 저장한 문장 · Saved':'Day '+x.day)+'</div></div>';}).join('')+
  '<button id="revgo" class="go">▶ 복습 듣기 (2번씩)</button><button id="revskip" class="nolink">건너뛰기</button></div>';
 h+='<div class="card todaycard"><div class="k">오늘 · DAY '+t+'</div><div class="big">'+esc(td.title_ko)+'</div><div class="n2">'+esc(td.title_en)+'</div><a class="go" href="#/day/'+t+'">시작하기 ▶ · Start</a></div>';
 h+='<div class="card"><button id="remgo" class="big2">⏰ 매일 알림 받기 · Daily reminder</button><div id="rempick" hidden><p class="inst">언제 알려 드릴까요?</p><button class="big2 remh" data-h="7">아침 7시 · 7 AM</button><button class="big2 remh" data-h="12">낮 12시 · 12 PM</button><button class="big2 remh" data-h="21">저녁 9시 · 9 PM</button></div><div id="remst" class="n2"></div></div>';
 h+='<div class="card"><b>⬇ 지하철·차에서도 듣기</b><p class="n2">인터넷이 없어도 들을 수 있게 미리 내려받아요. (대화 연습·AI·음성 인식은 인터넷이 필요해요.)</p><button id="week" class="big2">이번 주 7일 내려받기 · Download this week</button> <span id="wkst" class="n2"></span><div id="use" class="n2"></div></div>';
 if(window.CKS&&window.CKS[0])h+='<div class="card"><b>🗣 말하기 점검</b><a class="go" href="#/ck/0">시작 점검 (Day 0)</a>'+(window.CKS[30]?'<a class="go" href="#/ck/30">30일 점검 · Day 30 check</a>':'')+'</div>';
 h+='<h2>Day 1–'+D.length+'</h2><ol class="days">'+D.map(function(d){return '<li><a href="#/day/'+d.id+'" class="'+(p.done[d.id]?'done':'')+(d.id===t?' now':'')+'"><span class="dn">'+d.id+'</span><span class="dt">'+esc(d.title_ko)+'</span><span class="mk" data-dl="'+d.id+'"></span>'+(p.done[d.id]?'<span class="ck">✓</span>':'')+'</a></li>';}).join('')+'</ol>';
 h+='<p class="n2 center"><a href="#/install">설치 안내</a> · <a href="../index.html">웹 목록</a></p>';
 h+=settingsCard();V.innerHTML=h;bindSettings();
 bindBig();if($('#revgo')){$('#revgo').onclick=function(){playReview(rv,$('#revgo'));};$('#revskip').onclick=function(){localStorage.setItem('de100revskip',today());route();};}
 $('#remgo').onclick=function(){$('#rempick').hidden=false;$('#remgo').hidden=true;};$$('.remh').forEach(function(b){b.onclick=function(){remind(+b.dataset.h);};});usage($('#use'));
 D.forEach(function(d){has(d.id).then(function(x){if(x){var m=$('[data-dl="'+d.id+'"]');if(m)m.textContent='⬇';}});});
 $('#week').onclick=function(){var b=this,ids=[];for(var k=0;k<7;k++)if(day(t+k))ids.push(t+k);b.disabled=true;var i=0;
  (function nx(){if(i>=ids.length){$('#wkst').textContent='완료! '+ids.length+'일치를 받았어요.';b.disabled=false;usage($('#use'));home.refresh&&home.refresh();return;}
   var n=ids[i++];download(n,function(s){$('#wkst').textContent='Day '+n+' '+s;}).then(nx);})();};}
function dayScreen(n){var d=day(n);if(!d){location.hash='#/';return;}
 var h=top('DAY '+n+' · '+d.title_ko,esc(d.title_en),['#/','오늘 · Today'])+bigBtn();
 h+='<div class="card ten"><b>🎧 오늘의 10분</b>'+(d.shadow_all&&d.shadow_all.length?'<button class="sajump2" id="sajump">📚 모든 예문 · All sentences<small>책의 모든 문장 + 더 말해 보기 · Every book sentence + more practice</small></button>':'')+'<div class="tenb">'+
  '<button class="big2 top2" data-trk="shadow">▶ 쉐도잉 · Shadowing</button><button class="big2 top2" data-trk="x3all">🔁 3번씩 듣기 · Listen 3 times</button><button class="big2" data-trk="dlg">💬 대화 듣기 · Dialogue</button><button class="big2" data-trk="quiz">🗣 말해 보기 퀴즈 · Speaking quiz</button><button class="big2" data-trk="all">🔁 전체 듣기 · Play all</button>'+
  '</div>'+
  '<p class="drive">🚗 운전 중에는 <b>듣기·따라 말하기만</b> 하세요. 화면은 보지 마세요.</p>'+
  '<label class="bg"><input type="checkbox" id="bg"'+(S.bg?' checked':'')+'> 화면이 꺼져도 계속 듣기</label>'+(isIOS&&standalone?'<p class="n2">아이폰 홈 화면 앱에서 화면이 꺼질 때 소리가 멈추면, Safari에서 열어 들으세요.</p>':'')+'</div>';
 h+='<div class="card dlc"><b>⬇ 이 날 내려받기</b> <span class="n2">약 '+d.mb+' MB</span><div><button id="dl" class="big2">내려받기 · Download</button> <button id="rm" hidden>지우기 · Delete</button> <span id="dlst" class="n2"></span></div></div>';
 if(d.check&&d.check.length)h=h.replace('<div class="card ten">','<a class="go ckgo" href="#/check/'+n+'">🗣 말하기 점검</a><div class="card ten">');
 h+='<div class="card acts"><a class="go aigo" href="#/ai/'+n+'">AI와 대화 · Talk with AI</a>'+(window.deTR&&window.deTR.url()?'<a class="go trgo" href="#/tr/'+n+'">🗣 바로 통역 · Live interpreter</a>':'')+(d.talk?'<a class="go" id="talkgo" href="#/talk/'+n+'">🗣 대화 연습 · Talk practice</a>':'<span class="n2">🗣 대화 연습은 곧 열려요.</span>')+
  '<button id="stuckgo" class="help">🙋 막혔을 때 · When stuck</button></div>';
 h+='<h2>오늘의 문장 '+d.sentences.length+'</h2>'+d.sentences.map(function(s,i){var k='s'+('0'+(i+1)).slice(-2);
  return '<div class="card sent" data-n="'+(i+1)+'"><div class="en big">'+(i+1)+'. '+esc(s.en)+'</div><div class="ko">'+esc(s.ko)+'</div>'+
   (s.blocks.length?'<div class="chips">'+s.blocks.map(function(b){return '<span class="ch"><b>'+esc(b.en)+'</b><i>'+esc(b.ko)+'</i></span>';}).join('')+'</div>':'')+
   '<div class="sb"><button data-one="'+k+'">▶ 듣기 · Play</button><button data-one="'+k+'_slow" data-slow="1">🐢 천천히 · Slower</button>'+(d.a[k+'_x3']?'<button data-x3="'+k+'">🔁 3번 · 3 times</button>':'')+(d.a[k+'_chunks']?'<button data-ck="'+k+'">✂ 끊어 · In parts</button>':'')+'</div></div>';}).join('');
 if(window.shadowAll&&d.shadow_all&&d.shadow_all.length)h+='<div id="saroot"></div>';
 if(d.dialogue.lines.length)h+='<h2>대화 · '+esc(d.dialogue.setting_ko)+'</h2><button class="big2" data-trk="dlg">💬 대화 전체 듣기 · Whole dialogue</button>'+d.dialogue.lines.map(function(l,i){return '<div class="card ln" data-k="dlg_'+('0'+(i+1)).slice(-2)+'"><div class="who">'+esc(l.speaker)+'</div><div class="en">'+esc(l.en)+'</div><div class="ko n2">'+esc(l.ko)+'</div></div>';}).join('');
 h+='<button id="fin" class="big2 fin">✓ 오늘 공부 끝! · Done for today</button>';
 V.innerHTML=h;bindBig();var dir=AU+did(n)+'/';
 if($('#saroot'))window.shadowAll($('#saroot'),d,{clip:function(k,slow){var c=d.a&&d.a[k+(slow?'_slow':'')];return c?dir+k+(slow?'_slow':'')+'.mp3':null;}});   /* recorded clips replace the phone voice once rendered (meta key sa_S_I) */
 var Q=['shadow','dlg','quiz'];
 function trk(k,btn){var cards=(k==='shadow'||k==='x3all')?$$('.sent'):k==='dlg'?$$('.ln'):[];window.deNext=function(){var i=Q.indexOf(k);if(i>=0&&i<Q.length-1)trk(Q[i+1]);};
  dePlay(dir+k+'.mp3',{nextSeek:k==='x3all',keep:k==='x3all',mode:k==='x3all'?'x3all':k==='shadow'?'shadow':k==='dlg'?'dlg':k==='quiz'?'quiz':'seq',label:{shadow:'🎧 쉐도잉',dlg:'💬 대화 듣기 · Dialogue',quiz:'🗣 말해 보기',all:'🔁 전체 듣기 · Play all',x3all:'🔁 3번씩 듣기 · Listen 3 times'}[k],starts:d.a[k]||[],total:cards.length,btn:btn,cards:cards});markDay();}
 $$('[data-trk]').forEach(function(b){b.onclick=function(){if(b.classList.contains('act')){stopAll();return;}trk(b.dataset.trk,b);};});
 $$('[data-one]').forEach(function(b){b.onclick=function(){if(b.classList.contains('act')){stopAll();return;}dePlay(dir+b.dataset.one+'.mp3',{mode:b.dataset.slow?'slow':'single',btn:b,cards:[b.closest('.sent')],starts:[0]});markDay();};});
 $$('[data-x3]').forEach(function(b){b.onclick=function(){if(b.classList.contains('act')){stopAll();return;}var k=b.dataset.x3;dePlay(dir+k+'_x3.mp3',{mode:'x3',starts:d.a[k+'_x3'],total:3,unit:'번',btn:b,cards:[b.closest('.sent')]});markDay();};});
 $$('[data-ck]').forEach(function(b){b.onclick=function(){if(b.classList.contains('act')){stopAll();return;}var k=b.dataset.ck,c=b.closest('.sent');dePlay(dir+k+'_chunks.mp3',{mode:'chunk',starts:d.a[k+'_chunks'],total:(d.a[k+'_chunks']||[]).length,btn:b,chunks:$$('.ch',c)});markDay();};});
 $$('.ln').forEach(function(l){l.onclick=function(){dePlay(dir+l.dataset.k+'.mp3',{mode:'single',cards:[l],starts:[0]});};});
 $('#bg').onchange=function(){setBg(this.checked);};
 if($('#sajump'))$('#sajump').onclick=function(){var r=$('#saroot');if(r)r.scrollIntoView({behavior:'smooth'});};
 V.addEventListener('click',function(e){var b=e.target.closest('[data-trk],[data-one],[data-x3],[data-ck],.ln');if(!b||navigator.onLine||isDl)return;
  e.stopPropagation();e.preventDefault();var t=$('#offnote');if(!t){t=document.createElement('div');t.id='offnote';t.className='card warn';V.insertBefore(t,V.children[1]);}
  t.textContent='지금은 인터넷이 없어요. 이 날을 먼저 「내려받기」 해 두면 인터넷 없이도 들을 수 있어요.';window.scrollTo(0,0);},true);
 var isDl=false;function dlstate(){has(n).then(function(x){isDl=x;if(!$('#dl'))return;$('#dl').textContent=x?'다시 내려받기 · Download again':'내려받기 · Download';$('#rm').hidden=!x;$('#dlst').textContent=x?'✓ 내려받았어요 (인터넷 없이 듣기 가능)':'';});}
 $('#dl').onclick=function(){var b=this;b.disabled=true;download(n,function(s){$('#dlst').textContent=s;}).then(function(){b.disabled=false;dlstate();});};
 $('#rm').onclick=function(){remove(n).then(dlstate);};dlstate();
 $('#stuckgo').onclick=function(){window.openStuck();};
 var tg=$('#talkgo');if(tg&&!SR&&standalone&&isIOS){tg.href='../talk/'+did(n)+'.html';tg.target='_blank';tg.insertAdjacentHTML('afterend','<p class="n2" id="sfnote">아이폰 홈 화면 앱에서는 음성 인식이 안 돼서, 대화 연습은 Safari에서 열려요.</p>');}
 $('#fin').onclick=function(){var p=prog();p.done[n]=today();saveProg(p);markDay();this.textContent='✓ 잘했어요! 내일 또 만나요 · Great job!';};}
function talkScreen(n,step){var t=window.TALKS[n];if(!t){location.hash='#/day/'+n;return;}
 if(!SR&&standalone&&isIOS){V.innerHTML=top('대화 연습','',['#/day/'+n,'Day '+n+' · 뒤로'])+'<div class="card warn">아이폰 홈 화면 앱에서는 음성 인식이 안 돼요. <a href="../talk/'+did(n)+'.html" target="_blank">Safari에서 대화 연습 열기 ▶</a></div>';return;}
 V.innerHTML=top('대화 연습 · DAY '+n,'',['#/day/'+n,'Day '+n+' · 뒤로'])+'<div class="talkwrap">'+t.html+'</div>';window.TALK=t.data;window.initTalk();
 var steps=[].slice.call(document.querySelectorAll('.tstep')).map(function(s){return s.dataset.k;}),li=document.querySelectorAll('#prog li');
 if(step==='ai'&&li.length)li[li.length-1].click();
 if(step==='go'&&li.length){if(window.__aiLive&&window.__aiLive()){li[steps.indexOf('ai')].click();}else{li[steps.indexOf('rp')].click();}}}
function aiScreen(n){var ks=Object.keys(window.TALKS).map(Number).sort(function(a,b){return a-b;});if(!ks.length){location.hash='#/day/'+n;return;}
 var k=window.TALKS[n]?n:(ks.filter(function(x){return x<=n;}).pop()||ks[0]);location.replace('#/talk/'+k+'/go');}
/* ---------- recording (speaking check, check-ups) ---------- */
var RC={mr:null,t:0};
function startRec(cb,max){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){cb(null,'norec');return;}
 navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){var ch=[],mr=new MediaRecorder(st);RC.mr=mr;
  mr.ondataavailable=function(e){if(e.data&&e.data.size)ch.push(e.data);};
  mr.onstop=function(){st.getTracks().forEach(function(t){t.stop();});clearTimeout(RC.t);RC.mr=null;cb(new Blob(ch,{type:mr.mimeType||'audio/mp4'}));};
  mr.start();RC.t=setTimeout(function(){if(mr.state==='recording')mr.stop();},max||20000);},function(){cb(null,'denied');});}
function stopRec(){if(RC.mr&&RC.mr.state==='recording')RC.mr.stop();}
function recBtn(b,max,done){var on=false;b.onclick=function(){if(on){stopRec();return;}try{stopAll();}catch(e){}on=true;b.dataset.l=b.dataset.l||b.textContent;b.textContent='■ 녹음 끝 · Stop';b.classList.add('on');
 startRec(function(blob,err){on=false;b.classList.remove('on');b.textContent=err?b.dataset.l:'🎤 다시 녹음하기 · Record again';done(blob,err);},max);};}
function idb(){return new Promise(function(res,rej){var r=indexedDB.open('de100rec',1);r.onupgradeneeded=function(){r.result.createObjectStore('r');};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};});}
function idbPut(k,v){return idb().then(function(db){return new Promise(function(res){var t=db.transaction('r','readwrite');t.objectStore('r').put(v,k);t.oncomplete=function(){res(true);};t.onerror=function(){res(false);};});}).catch(function(){return false;});}
function idbGet(k){return idb().then(function(db){return new Promise(function(res){var q=db.transaction('r').objectStore('r').get(k);q.onsuccess=function(){res(q.result||null);};q.onerror=function(){res(null);};});}).catch(function(){return null;});}
var NOREC='녹음이 안 되면, 소리 내어 말한 뒤 「👀 영어 보기」를 누르세요.';
function checkScreen(n,i){var d=day(n);if(!d||!d.check||!d.check.length){location.hash='#/day/'+n;return;}i=i||0;var it=d.check[i],mine=null,last=i>=d.check.length-1;
 V.innerHTML=top('말하기 점검 · DAY '+n,'',['#/day/'+n,'Day '+n+' · 뒤로'])+'<div class="card ckc"><div class="k">'+(i+1)+' / '+d.check.length+'</div><p class="inst">한국어를 보고 영어로 말해 보세요.</p><div class="ko1">'+esc(it.ko)+'</div>'+
  '<button id="rec" class="big2 recb">🎤 녹음하기</button><button id="cmp" class="big2" hidden>▶ 내 목소리 → 원어민 소리</button><button id="see" class="big2">👀 영어 보기</button><div id="ans" class="en1" hidden>'+esc(it.en)+'</div><div id="rst" class="n2"></div>'+
  '<button id="nx" class="go">'+(last?'점검 끝 ✓':'다음 문장 ▶')+'</button></div>';
 recBtn($('#rec'),20000,function(b,err){if(err||!b||!b.size){$('#rst').textContent=NOREC;return;}if(mine)URL.revokeObjectURL(mine);mine=URL.createObjectURL(b);$('#cmp').hidden=false;window.__ckRec=(window.__ckRec||0)+1;});
 $('#cmp').onclick=function(){$('#ans').hidden=false;dePlay(mine,{label:'🎙 내 목소리',btn:$('#cmp'),onend:function(){dePlay(it.audio,{label:'🔊 원어민',btn:$('#cmp')});}});};
 $('#see').onclick=function(){$('#ans').hidden=false;};
 $('#nx').onclick=function(){if(last){var p=prog();p.done[n]=today();saveProg(p);location.hash='#/day/'+n;}else{checkScreen(n,i+1);window.scrollTo(0,0);}};}
function ckScreen(k,i){var C=(window.CKS||{})[k];if(!C||!C.topics.length){location.hash='#/';return;}i=i||0;var it=C.topics[i],last=i>=C.topics.length-1,mine=null;
 V.innerHTML=top(C.title_ko||'말하기 점검','',['#/','오늘 · Today'])+'<div class="card ckc"><div class="k">'+(i+1)+' / '+C.topics.length+'</div><p class="inst">주제를 보고 1분 동안 영어로 말해 보세요.</p><div class="ko1">'+esc(it.ko)+'</div><div class="n2">'+esc(it.en_hint||'')+'</div>'+
  '<button id="rec" class="big2 recb">🎤 1분 말하기 · Speak 1 min</button><button id="mine" class="big2" hidden>▶ 내 목소리 듣기 · My recording</button><button id="old" class="big2" hidden>▶ Day 0 때 내 목소리</button><div id="rst" class="n2"></div>'+
  '<button id="nx" class="go">'+(last?'점검 끝 ✓':'다음 주제 · Next topic ▶')+'</button></div>';
 var key='ck'+k+'_'+i;
 recBtn($('#rec'),60000,function(b,err){if(err||!b||!b.size){$('#rst').textContent='녹음이 안 되면, 소리 내어 1분 말해 보세요.';return;}mine=URL.createObjectURL(b);$('#mine').hidden=false;idbPut(key,b).then(function(ok){window.__ckSaved=ok;});});
 $('#mine').onclick=function(){if(mine)dePlay(mine,{label:'🎙 내 목소리',btn:$('#mine')});};
 if(k>0)idbGet('ck0_'+i).then(function(b){if(b&&$('#old')){$('#old').hidden=false;$('#old').onclick=function(){dePlay(URL.createObjectURL(b),{label:'🎙 Day 0 내 목소리',btn:$('#old')});};}});
 $('#nx').onclick=function(){if(last)location.hash='#/';else{ckScreen(k,i+1);window.scrollTo(0,0);}};}
/* ---------- optional install bar (never a gate) ---------- */
function ibar(){var b=document.getElementById('ibar');var dis=+localStorage.getItem('de100ibarx')||0;
 if(standalone||localStorage.getItem('de100inst')||(dis&&Date.now()-dis<2*864e5)||location.hash.indexOf('#/install')===0){if(b)b.remove();return;}
 if(b)return;b=document.createElement('div');b.id='ibar';b.innerHTML='<button id="ibtn">📲 바탕화면에 두기 · Add to home screen</button><button id="ix" aria-label="닫기">✕</button>';document.body.insertBefore(b,document.body.firstChild);
 $('#ibtn').onclick=function(){if(deferred){var dp=deferred;deferred=null;dp.prompt();(dp.userChoice||Promise.resolve({})).then(function(c){window.__instChoice=c&&c.outcome;if(c&&c.outcome==='accepted')installed();});}else location.hash='#/install';};
 $('#ix').onclick=function(){localStorage.setItem('de100ibarx',String(Date.now()));b.remove();};}
function installed(){localStorage.setItem('de100inst','1');var b=document.getElementById('ibar');if(b)b.remove();if(document.getElementById('idone'))return;
 var m=document.createElement('div');m.id='idone';m.textContent='설치됐어요! 바탕화면의 「웰컴영어」를 누르세요';document.body.insertBefore(m,document.body.firstChild);setTimeout(function(){m.remove();},10000);}
window.addEventListener('appinstalled',installed);
function install(){var ua=navigator.userAgent,inapp=/KAKAOTALK|NAVER\(|NAVER|Instagram|FBAN|FBAV|Line\/|DaumApps|; wv\)/i.test(ua),android=/Android/i.test(ua),samsung=/SamsungBrowser/i.test(ua),iosOther=isIOS&&/CriOS|FxiOS|EdgiOS/.test(ua);
 var ph=function(lines,hi,arrow){return '<div class="phone"><div class="scr">'+lines.map(function(l,i){return '<div class="row'+(i===hi?' hi':'')+'">'+l+'</div>';}).join('')+'</div>'+(arrow?'<div class="arw">'+arrow+'</div>':'')+'</div>';};
 var h=top('바탕화면에 두기','',['#/','오늘 · Today']),g,kind;
 if(standalone){g='<div class="card okc">✓ 이미 바탕화면에 있어요.</div>';kind='done';}
 else if(deferred){g='<button class="go instbtn">📲 바탕화면에 두기</button>';kind='prompt';}
 else if(android&&inapp){kind='android_inapp';g='<div class="card">'+ph(['카카오톡 안에서 열린 화면','',''],0)+'<p class="inst">아래 버튼을 눌러 크롬으로 여세요.</p><a class="go" id="chromego" href="intent://'+location.host+location.pathname+'#Intent;scheme=https;package=com.android.chrome;end">크롬으로 열기</a></div>';}
 else if(isIOS&&(inapp||iosOther)){kind='ios_inapp';g='<div class="card">'+ph(['','','⋯  (메뉴)'],2,'⬇')+'<p class="inst">아래 메뉴(⋯)에서 「Safari로 열기」를 누르세요.</p></div>';}
 else if(isIOS){kind='ios_safari';g='<div class="card">'+ph(['웰컴 잉글리시 100','','◁   ▷   [⬆]   📖   ⧉'],2,'⬇ 공유 버튼')+'<p class="inst">① 아래 가운데 공유 버튼 [⬆]을 누르세요.<br>② 「홈 화면에 추가」를 누르세요.</p></div>';}
 else if(samsung){kind='samsung';g='<div class="card">'+ph(['웰컴 잉글리시 100','','◁   ▷   ⌂   ☆   ≡'],2,'⬇ 메뉴 ≡')+'<p class="inst">① 아래 오른쪽 메뉴 ≡ 를 누르세요.<br>② 「현재 페이지 추가」 → 「홈 화면」을 누르세요.</p></div>';}
 else if(android){kind='chrome';g='<div class="card">'+ph(['주소창                ⋮','',''],0,'⬆ 메뉴 ⋮')+'<p class="inst">① 오른쪽 위 메뉴 ⋮ 를 누르세요.<br>② 「홈 화면에 추가」 또는 「앱 설치」를 누르세요.</p></div>';}
 else{kind='other';g='<div class="card"><p class="inst">휴대폰 카메라로 책의 QR을 찍어 여세요.</p></div>';}
 V.innerHTML=h+g+'<a class="nolink" href="#/">설치 없이 바로 쓰기</a>';window.__instKind=kind;
 $$('.instbtn').forEach(function(b){b.onclick=function(){if(deferred){var dp=deferred;deferred=null;dp.prompt();(dp.userChoice||Promise.resolve({})).then(function(c){if(c&&c.outcome==='accepted'){installed();location.hash='#/';}});}};});}
/* ---------- router ---------- */
(function(){var y=0;window.addEventListener('scroll',function(){var f=document.getElementById('trfab');if(!f)return;var n=window.scrollY;if(n>y+8)f.classList.add('away');else if(n<y-8)f.classList.remove('away');y=n;},{passive:true});})();   /* hides while scrolling down, so it never sits on lesson buttons while reading */
function trfab(r){var f=document.getElementById('trfab');if(!(window.deTR&&window.deTR.url())||r==='tr'){if(f)f.hidden=true;document.body.classList.remove('hasfab');return;}
 if(!f){f=document.createElement('a');f.id='trfab';f.textContent='🗣 통역 · Translate';document.body.appendChild(f);}
 var m=location.hash.match(/^#\/(?:day|talk|ai|check)\/(\d+)/);f.href=m?'#/tr/'+m[1]:'#/tr';f.hidden=false;document.body.classList.add('hasfab');}
/* free-AI privacy notice: first use of the AI talk or the interpreter, then a small ⓘ in the header */
var PRIV='무료 AI라 대화 내용이 서비스 개선을 위해 검토될 수 있어요. 이름·전화번호·주소 같은 개인정보는 말하지 마세요. · This free AI may be reviewed to improve the service; do not share personal details.';
function privShow(){var o=document.createElement('div');o.className='privov';o.innerHTML='<div class="privbox"><b>ⓘ 알려 드려요 · Please note</b><p>'+esc(PRIV)+'</p><button class="go">확인 · OK</button></div>';document.body.appendChild(o);o.querySelector('button').onclick=function(){localStorage.setItem('de100priv','1');o.remove();};window.__privShown=(window.__privShown||0)+1;}
function privNote(h){if(!((h[0]==='talk'&&h[1])||h[0]==='tr'))return;setTimeout(function(){var hd=document.querySelector('#view .atop');if(hd&&!hd.querySelector('.privi')){var b=document.createElement('button');b.className='privi';b.setAttribute('aria-label','개인정보 안내 · Privacy note');b.textContent='ⓘ';b.onclick=privShow;hd.appendChild(b);}
 if(localStorage.getItem('de100priv')!=='1'&&!document.querySelector('.privov'))privShow();},50);}
function route(){try{stopAll();}catch(e){}stopRec();window.deNext=null;var h=location.hash.replace(/^#\/?/,'').split('/');
 if(h[0]==='day'&&h[1])dayScreen(+h[1]);else if(h[0]==='talk'&&h[1])talkScreen(+h[1],h[2]);else if(h[0]==='ai'&&h[1])aiScreen(+h[1]);else if(h[0]==='check'&&h[1])checkScreen(+h[1]);else if(h[0]==='ck'&&h[1])ckScreen(+h[1]);else if(h[0]==='install')install();else if(h[0]==='tr'&&window.interpScreen)window.interpScreen(V,h[1]==='prep'?'#/tr':h[1]?'#/day/'+h[1]:'#/',h[1]==='prep'?'prep':null);else home();privNote(h);
 ibar();trfab(h[0]);
 window.scrollTo(0,0);window.__route=location.hash||'#/';}
window.addEventListener('hashchange',route);route();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').then(function(r){window.__swReg=1;}).catch(function(e){window.__swErr=String(e);});
window.__appReady=1;
})();
