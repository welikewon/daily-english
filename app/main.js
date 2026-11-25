/* 매일 영어 100일 app (PWA): hash routes  #/  #/day/N  #/talk/N  #/install  — needs ../app.js (dePlay/stopAll), content.js, talk.js */
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
function download(n,cb){var d=day(n),u=urls(d),i=0,fail=0;if(!window.caches){cb&&cb('이 브라우저는 내려받기를 지원하지 않아요.');return Promise.resolve(false);}
 return caches.open(cname(n)).then(function(c){function next(){if(i>=u.length)return Promise.resolve();var x=u[i++];
  return fetch(x).then(function(r){if(!r.ok)throw 0;return c.put(x,r);}).catch(function(){fail++;}).then(function(){cb&&cb(Math.round(100*i/u.length)+'%');return next();});}
  return next();}).then(function(){if(fail){cb&&cb('일부 파일을 받지 못했어요 ('+fail+'개). 인터넷 연결을 확인하고 다시 눌러 주세요.');return false;}cb&&cb('완료');return true;});}
function remove(n){return window.caches?caches.delete(cname(n)):Promise.resolve(false);}
function usage(el){if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(function(e){el.textContent='이 휴대폰에 저장한 양: 약 '+(e.usage/1e6).toFixed(1)+' MB';});}
/* ---------- screens ---------- */
function top(title,sub,back){return '<header class="atop">'+(back?'<a class="aback" href="'+back[0]+'">← '+esc(back[1])+'</a>':'')+'<div class="k">매일 영어 100일</div><h1>'+esc(title)+'</h1>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</header>';}
function home(){var p=prog(),t=todayDay(),td=day(t);
 var h=top('오늘의 영어','<div class="streak">'+streak()+'</div>');
 if(!standalone)h+='<a class="card instcard" href="#/install">📲 <b>휴대폰에 앱으로 설치하기</b><br><span class="n2">책 없이도 홈 화면에서 바로 열 수 있어요.</span></a>';
 h+='<div class="card todaycard"><div class="k">오늘 · DAY '+t+'</div><div class="big">'+esc(td.title_ko)+'</div><div class="n2">'+esc(td.title_en)+'</div><a class="go" href="#/day/'+t+'">시작하기 ▶</a></div>';
 h+='<div class="card"><b>⬇ 지하철·차에서도 듣기</b><p class="n2">인터넷이 없어도 들을 수 있게 미리 내려받아요. (대화 연습·AI·음성 인식은 인터넷이 필요해요.)</p><button id="week" class="big2">이번 주 7일 내려받기</button> <span id="wkst" class="n2"></span><div id="use" class="n2"></div></div>';
 h+='<h2>Day 1–'+D.length+'</h2><ol class="days">'+D.map(function(d){return '<li><a href="#/day/'+d.id+'" class="'+(p.done[d.id]?'done':'')+(d.id===t?' now':'')+'"><span class="dn">'+d.id+'</span><span class="dt">'+esc(d.title_ko)+'</span><span class="mk" data-dl="'+d.id+'"></span>'+(p.done[d.id]?'<span class="ck">✓</span>':'')+'</a></li>';}).join('')+'</ol>';
 h+='<p class="n2 center"><a href="#/install">설치 안내</a> · <a href="../index.html">웹 목록</a></p>';
 V.innerHTML=h;usage($('#use'));
 D.forEach(function(d){has(d.id).then(function(x){if(x){var m=$('[data-dl="'+d.id+'"]');if(m)m.textContent='⬇';}});});
 $('#week').onclick=function(){var b=this,ids=[];for(var k=0;k<7;k++)if(day(t+k))ids.push(t+k);b.disabled=true;var i=0;
  (function nx(){if(i>=ids.length){$('#wkst').textContent='완료! '+ids.length+'일치를 받았어요.';b.disabled=false;usage($('#use'));home.refresh&&home.refresh();return;}
   var n=ids[i++];download(n,function(s){$('#wkst').textContent='Day '+n+' '+s;}).then(nx);})();};}
function dayScreen(n){var d=day(n);if(!d){location.hash='#/';return;}
 var h=top('DAY '+n+' · '+d.title_ko,esc(d.title_en),['#/','오늘']);
 h+='<div class="card ten"><b>🎧 오늘의 10분</b><div class="tenb">'+
  '<button class="big2" data-trk="shadow">🎧 쉐도잉 (12문장)</button><button class="big2" data-trk="dlg">💬 대화 듣기</button><button class="big2" data-trk="quiz">🗣 말해 보기 퀴즈</button><button class="big2" data-trk="all">🔁 전체 듣기</button>'+
  '<button class="big2 soon" disabled>👂 귀로만 말하기 (준비 중)</button></div>'+
  '<p class="drive">🚗 운전 중에는 <b>듣기·따라 말하기만</b> 하세요. 화면은 보지 마세요.</p>'+
  '<label class="bg"><input type="checkbox" id="bg"'+(S.bg?' checked':'')+'> 화면이 꺼져도 계속 듣기</label>'+(isIOS&&standalone?'<p class="n2">아이폰 홈 화면 앱에서 화면이 꺼질 때 소리가 멈추면, Safari에서 열어 들으세요.</p>':'')+'</div>';
 h+='<div class="card dlc"><b>⬇ 이 날 내려받기</b> <span class="n2">약 '+d.mb+' MB</span><div><button id="dl" class="big2">내려받기</button> <button id="rm" hidden>지우기</button> <span id="dlst" class="n2"></span></div></div>';
 h+='<div class="card acts">'+(d.talk?'<a class="go" id="talkgo" href="#/talk/'+n+'">🗣 대화 연습 (말하고 대답 듣기)</a>':'<span class="n2">🗣 대화 연습은 곧 열려요.</span>')+
  '<button id="stuck" class="help">🙋 막혔을 때</button><div id="stuckp" class="n2" hidden>막혔을 때 도움말(번역기 대화 모드 · 공손한 부탁 3문장)은 곧 이곳에 열려요.</div></div>';
 h+='<h2>오늘의 문장 '+d.sentences.length+'</h2>'+d.sentences.map(function(s,i){var k='s'+('0'+(i+1)).slice(-2);
  return '<div class="card sent" data-n="'+(i+1)+'"><div class="en big">'+(i+1)+'. '+esc(s.en)+'</div><div class="ko">'+esc(s.ko)+'</div>'+
   (s.blocks.length?'<div class="chips">'+s.blocks.map(function(b){return '<span class="ch"><b>'+esc(b.en)+'</b><i>'+esc(b.ko)+'</i></span>';}).join('')+'</div>':'')+
   '<div class="sb"><button data-one="'+k+'">▶ 듣기</button><button data-one="'+k+'_slow" data-slow="1">🐢 천천히</button>'+(d.a[k+'_x3']?'<button data-x3="'+k+'">🔁 3번</button>':'')+(d.a[k+'_chunks']?'<button data-ck="'+k+'">✂ 끊어</button>':'')+'</div></div>';}).join('');
 if(d.dialogue.lines.length)h+='<h2>대화 · '+esc(d.dialogue.setting_ko)+'</h2><button class="big2" data-trk="dlg">💬 대화 전체 듣기</button>'+d.dialogue.lines.map(function(l,i){return '<div class="card ln" data-k="dlg_'+('0'+(i+1)).slice(-2)+'"><div class="who">'+esc(l.speaker)+'</div><div class="en">'+esc(l.en)+'</div><div class="ko n2">'+esc(l.ko)+'</div></div>';}).join('');
 h+='<button id="fin" class="big2 fin">✓ 오늘 공부 끝!</button>';
 V.innerHTML=h;var dir=AU+did(n)+'/';
 var Q=['shadow','dlg','quiz'];
 function trk(k,btn){var cards=k==='shadow'?$$('.sent'):k==='dlg'?$$('.ln'):[];window.deNext=function(){var i=Q.indexOf(k);if(i>=0&&i<Q.length-1)trk(Q[i+1]);};
  dePlay(dir+k+'.mp3',{mode:k==='shadow'?'shadow':k==='dlg'?'dlg':k==='quiz'?'quiz':'seq',label:{shadow:'🎧 쉐도잉',dlg:'💬 대화 듣기',quiz:'🗣 말해 보기',all:'🔁 전체 듣기'}[k],starts:d.a[k]||[],total:cards.length,btn:btn,cards:cards});markDay();}
 $$('[data-trk]').forEach(function(b){b.onclick=function(){if(b.classList.contains('act')){stopAll();return;}trk(b.dataset.trk,b);};});
 $$('[data-one]').forEach(function(b){b.onclick=function(){if(b.classList.contains('act')){stopAll();return;}dePlay(dir+b.dataset.one+'.mp3',{mode:b.dataset.slow?'slow':'single',btn:b,cards:[b.closest('.sent')],starts:[0]});markDay();};});
 $$('[data-x3]').forEach(function(b){b.onclick=function(){if(b.classList.contains('act')){stopAll();return;}var k=b.dataset.x3;dePlay(dir+k+'_x3.mp3',{mode:'x3',starts:d.a[k+'_x3'],total:3,unit:'번',btn:b,cards:[b.closest('.sent')]});markDay();};});
 $$('[data-ck]').forEach(function(b){b.onclick=function(){if(b.classList.contains('act')){stopAll();return;}var k=b.dataset.ck,c=b.closest('.sent');dePlay(dir+k+'_chunks.mp3',{mode:'chunk',starts:d.a[k+'_chunks'],total:(d.a[k+'_chunks']||[]).length,btn:b,chunks:$$('.ch',c)});markDay();};});
 $$('.ln').forEach(function(l){l.onclick=function(){dePlay(dir+l.dataset.k+'.mp3',{mode:'single',cards:[l],starts:[0]});};});
 $('#bg').onchange=function(){setBg(this.checked);};
 V.addEventListener('click',function(e){var b=e.target.closest('[data-trk],[data-one],[data-x3],[data-ck],.ln');if(!b||navigator.onLine||isDl)return;
  e.stopPropagation();e.preventDefault();var t=$('#offnote');if(!t){t=document.createElement('div');t.id='offnote';t.className='card warn';V.insertBefore(t,V.children[1]);}
  t.textContent='지금은 인터넷이 없어요. 이 날을 먼저 「내려받기」 해 두면 인터넷 없이도 들을 수 있어요.';window.scrollTo(0,0);},true);
 var isDl=false;function dlstate(){has(n).then(function(x){isDl=x;if(!$('#dl'))return;$('#dl').textContent=x?'다시 내려받기':'내려받기';$('#rm').hidden=!x;$('#dlst').textContent=x?'✓ 내려받았어요 (인터넷 없이 듣기 가능)':'';});}
 $('#dl').onclick=function(){var b=this;b.disabled=true;download(n,function(s){$('#dlst').textContent=s;}).then(function(){b.disabled=false;dlstate();});};
 $('#rm').onclick=function(){remove(n).then(dlstate);};dlstate();
 $('#stuck').onclick=function(){$('#stuckp').hidden=!$('#stuckp').hidden;};
 var tg=$('#talkgo');if(tg&&!SR&&standalone&&isIOS){tg.href='../talk/'+did(n)+'.html';tg.target='_blank';tg.insertAdjacentHTML('afterend','<p class="n2" id="sfnote">아이폰 홈 화면 앱에서는 음성 인식이 안 돼서, 대화 연습은 Safari에서 열려요.</p>');}
 $('#fin').onclick=function(){var p=prog();p.done[n]=today();saveProg(p);markDay();this.textContent='✓ 잘했어요! 내일 또 만나요';};}
function talkScreen(n){var t=window.TALKS[n];if(!t){location.hash='#/day/'+n;return;}
 if(!SR&&standalone&&isIOS){V.innerHTML=top('대화 연습','',['#/day/'+n,'Day '+n])+'<div class="card warn">아이폰 홈 화면 앱에서는 음성 인식이 안 돼요. <a href="../talk/'+did(n)+'.html" target="_blank">Safari에서 대화 연습 열기 ▶</a></div>';return;}
 V.innerHTML=top('대화 연습 · DAY '+n,'',['#/day/'+n,'Day '+n])+'<div class="talkwrap">'+t.html+'</div>';window.TALK=t.data;window.initTalk();}
function install(){var h=top('앱으로 설치하기','',['#/','오늘']);
 if(standalone)h+='<div class="card okc">✓ 이미 앱으로 설치되어 있어요.</div>';
 h+='<button class="big2 instbtn"'+(deferred?'':' hidden')+'>📲 지금 설치하기</button>';
 var ph=function(lines,hi){return '<div class="phone"><div class="scr">'+lines.map(function(l,i){return '<div class="row'+(i===hi?' hi':'')+'">'+l+'</div>';}).join('')+'</div></div>';};
 var gal='<div class="card"><h2>갤럭시 (삼성 인터넷 · 크롬)</h2><ol class="steps"><li>'+ph(['주소창 · 매일 영어 100일','','≡ / ⋮ 메뉴'],2)+'<b>1</b> 화면 아래(삼성 인터넷 ≡) 또는 위(크롬 ⋮)의 <b>메뉴</b>를 눌러요.</li>'+
  '<li>'+ph(['새 탭','북마크','＋ 현재 페이지 추가 / 홈 화면에 추가','앱 설치'],2)+'<b>2</b> 「<b>현재 페이지 추가</b> → 홈 화면」(삼성 인터넷) 또는 「<b>홈 화면에 추가</b>」·「<b>앱 설치</b>」(크롬)를 눌러요.</li>'+
  '<li>'+ph(['매일 영어 100일을 설치할까요?','','[ 설치 ] / [ 추가 ]'],2)+'<b>3</b> 「<b>설치</b>」 또는 「<b>추가</b>」를 누르면 홈 화면에 <b>매일영어</b> 아이콘이 생겨요.</li></ol></div>';
 var ios='<div class="card"><h2>아이폰 (Safari)</h2><ol class="steps"><li>'+ph(['매일 영어 100일','','◁  ▷  [⬆]  📖  ⧉'],2)+'<b>1</b> <b>Safari</b>로 열고, 아래의 <b>공유 버튼</b>(네모에서 위로 향한 화살표)을 눌러요.</li>'+
  '<li>'+ph(['복사','읽기 목록에 추가','＋ 홈 화면에 추가','책갈피 추가'],2)+'<b>2</b> 목록을 위로 밀어 「<b>홈 화면에 추가</b>」를 눌러요.</li>'+
  '<li>'+ph(['홈 화면에 추가','매일영어','            [ 추가 ]'],2)+'<b>3</b> 오른쪽 위 「<b>추가</b>」를 누르면 끝!</li></ol><p class="n2">카카오톡 등 다른 앱 안에서 열었다면, 먼저 「Safari로 열기」를 하세요. 아이폰 홈 화면 앱에서는 대화 연습(음성 인식)이 Safari에서 열려요.</p></div>';
 h+=isIOS?ios+gal:gal+ios;V.innerHTML=h;
 $$('.instbtn').forEach(function(b){b.onclick=function(){if(deferred){deferred.prompt();deferred.userChoice.then(function(){deferred=null;b.hidden=true;});}};});}
/* ---------- router ---------- */
function route(){try{stopAll();}catch(e){}window.deNext=null;var h=location.hash.replace(/^#\/?/,'').split('/');
 if(h[0]==='day'&&h[1])dayScreen(+h[1]);else if(h[0]==='talk'&&h[1])talkScreen(+h[1]);else if(h[0]==='install')install();else home();
 window.scrollTo(0,0);window.__route=location.hash||'#/';}
window.addEventListener('hashchange',route);route();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').then(function(r){window.__swReg=1;}).catch(function(e){window.__swErr=String(e);});
window.__appReady=1;
})();
