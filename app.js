
(function(){
var A=document.createElement('audio');A.preload='none';A.setAttribute('playsinline','');document.body.appendChild(A);
var ST=null; /* {mode,label,starts,total,btn,cards,chunks} */
var MODES={single:['#1F8A45','▶ 듣기 중'],slow:['#1F8A45','🐢 천천히 듣기 중'],shadow:['#1E63C6','🎧 쉐도잉 중'],x3:['#C25E0E','🔁 3번 반복 중'],
 chunk:['#7B4FC4','✂ 끊어 듣기 중'],dlg:['#1F3A5F','💬 대화 듣기 중'],seq:['#1E63C6','🎧 이어 듣기 중'],quiz:['#C62F55','🗣 말해 보기 중']};
/* ---- UI: stop bar + back button ---- */
var bar=document.createElement('div');bar.id='pbar';
bar.innerHTML='<div class="pl"><span class="pd"></span><b id="plab"></b><span id="pprog"></span><div class="pg"><i id="pgf"></i></div></div><button type="button" id="pstop" aria-label="Stop all sound">■ 멈추기 · Stop</button>';
document.body.appendChild(bar);
if(!document.body.dataset.home){var bk=document.createElement('a');bk.id='pback';bk.href='index.html';bk.textContent='← 목록';document.body.appendChild(bk);}
var plab=document.getElementById('plab'),pprog=document.getElementById('pprog'),pgf=document.getElementById('pgf');
function clearMarks(){document.querySelectorAll('.now,.play,.act').forEach(function(x){x.classList.remove('now','play','act');x.style.removeProperty('--m');});}
function stopAll(){var was=!!ST;ST=null;try{A.pause();}catch(e){}try{A.removeAttribute('src');A.load();}catch(e){}
 document.querySelectorAll('audio').forEach(function(x){if(x===A)return;try{x.pause();}catch(e){}
  /* still loading (or a play() pending): drop the source so nothing starts late, keep it for the next tap */
  if(x.readyState<3||!x.paused){var s=x.getAttribute('src')||x.dataset.src;if(s){x.dataset.src=s;try{x.removeAttribute('src');x.load();x.setAttribute('src',s);x.preload='none';}catch(e){}}}});
 clearMarks();document.body.classList.remove('playing');
 if('mediaSession' in navigator){try{navigator.mediaSession.playbackState='none';navigator.mediaSession.metadata=null;}catch(e){}}
 window.__stops=(window.__stops||0)+(was?1:0);}
window.stopAll=stopAll;
document.getElementById('pstop').addEventListener('click',stopAll);
/* window.deKeepPlaying (app setting "화면 꺼도 계속 듣기"): screen-off / app-switch do not stop; back/leave still do */
document.addEventListener('visibilitychange',function(){if(document.hidden&&!window.deKeepPlaying)stopAll();});
window.addEventListener('pagehide',stopAll);window.addEventListener('blur',function(){if(!window.deKeepPlaying)stopAll();});window.addEventListener('popstate',stopAll);
document.addEventListener('freeze',function(){if(!window.deKeepPlaying)stopAll();});
if('mediaSession' in navigator){try{navigator.mediaSession.setActionHandler('stop',stopAll);}catch(e){}
 try{navigator.mediaSession.setActionHandler('pause',function(){if(window.deKeepPlaying&&ST){A.pause();try{navigator.mediaSession.playbackState='paused';}catch(e){}}else stopAll();});}catch(e){}
 try{navigator.mediaSession.setActionHandler('play',function(){if(ST&&A.getAttribute('src')){A.play();try{navigator.mediaSession.playbackState='playing';}catch(e){}}});}catch(e){}
 try{navigator.mediaSession.setActionHandler('nexttrack',function(){if(window.deNext)window.deNext();});}catch(e){}}
/* native <audio controls> on the page (quiz/all-in-one): only one sound at a time + same bar */
document.querySelectorAll('audio[controls]').forEach(function(x){x.addEventListener('play',function(){if(ST)stopAll();
 document.querySelectorAll('audio[controls]').forEach(function(y){if(y!==x)y.pause();});
 ST={mode:'seq',label:x.dataset.label||'🎧 듣는 중',starts:[],total:0,native:x};show();});
 x.addEventListener('pause',function(){if(ST&&ST.native===x)stopAll();});
 x.addEventListener('timeupdate',function(){if(ST&&ST.native===x&&x.duration){pgf.style.width=(100*x.currentTime/x.duration)+'%';}});});
function show(){var m=MODES[ST.mode]||MODES.single;bar.style.setProperty('--m',m[0]);plab.textContent=ST.label||m[1];pprog.textContent='';pgf.style.width='0';
 document.body.classList.add('playing');
 if(ST.btn){ST.btn.classList.add('act');ST.btn.style.setProperty('--m',m[0]);}
 if('mediaSession' in navigator){try{navigator.mediaSession.metadata=new MediaMetadata({title:ST.label||m[1],artist:'매일 영어 100일'});navigator.mediaSession.playbackState='playing';}catch(e){}}}
/* play(src, opts): MUST be called inside the tap handler */
function play(src,o){stopAll();o=o||{};ST={mode:o.mode||'single',label:o.label,starts:o.starts||[],total:o.total||0,btn:o.btn,cards:o.cards||[],chunks:o.chunks||[],unit:o.unit||'',onend:o.onend};
 A.src=src;A.currentTime=0;A.defaultPlaybackRate=A.playbackRate=o.rate||1;var p=A.play();window.__plays=(window.__plays||0)+1;
 var mine=ST;if(p&&p.catch)p.catch(function(err){window.__playErr=String(err);if(ST===mine)stopAll();});
 show();tick();}
window.dePlay=play;
function idx(){if(!ST||!ST.starts.length)return -1;var t=A.currentTime,k=0;for(var i=0;i<ST.starts.length;i++){if(t+0.05>=ST.starts[i])k=i;}return k;}
function tick(){if(!ST)return;var k=idx();
 if(A.duration)pgf.style.width=(100*A.currentTime/A.duration)+'%';
 if(k>=0&&ST.total){pprog.textContent=' · '+Math.min(k+1,ST.total)+' / '+ST.total+(ST.unit||'');if(ST.k!==k){window.__maxIdx=Math.max(window.__maxIdx||0,k+1);}}
 if(k>=0&&ST.k!==k){ST.k=k;
  var tg=ST.cards[Math.min(k,ST.cards.length-1)];
  ST.cards.forEach(function(c){if(c){c.classList.toggle('now',c===tg);c.style.setProperty('--m',(MODES[ST.mode]||MODES.single)[0]);}});
  if(tg&&ST.cards.length>1){try{tg.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){}}
  ST.chunks.forEach(function(c,i){c.classList.toggle('play',i===k);});}}
A.addEventListener('timeupdate',tick);
A.addEventListener('ended',function(){var cb=ST&&ST.onend;window.__ended=(window.__ended||0)+1;stopAll();if(cb){try{cb();}catch(e){}}});
A.addEventListener('error',function(){if(ST){window.__playErr='media error';stopAll();}});
/* ---- day page bindings ---- */
var M=document.getElementById('meta');if(!M){window.__playerReady=1;return;}
var meta=JSON.parse(M.textContent),dir=meta.dir,a=meta.a;
function S(n){return dir+'/'+n+'.mp3';}
document.addEventListener('click',function(e){
 var b=e.target.closest('button[data-p]');
 if(b){var n=b.dataset.p,kind=b.dataset.kind||'single',card=b.closest('.sent,.snd-i,.try,.step,.vb,.flip')||null;
  if(b.classList.contains('act')){stopAll();return;}
  if(kind==='shadow'){var cs=[].slice.call(document.querySelectorAll('.sent[data-n]'));play(S('shadow'),{mode:'shadow',starts:(a.shadow||{}).starts,total:cs.length,btn:b,cards:cs});return;}
  if(kind==='x3'){play(S(n+'_x3'),{mode:'x3',starts:(a[n+'_x3']||{}).starts,total:3,unit:'번',btn:b,cards:card?[card]:[]});return;}
  if(kind==='chunk'){var ch=card?[].slice.call(card.querySelectorAll('.ch')):[];var st=(a[n+'_chunks']||{}).starts||[];
   play(S(n+'_chunks'),{mode:'chunk',starts:st,total:st.length,btn:b,cards:[],chunks:ch});return;}
  if(kind==='dlg'){var ls=[].slice.call(document.querySelectorAll('.dlg .ln'));play(S('dlg'),{mode:'dlg',starts:(a.dlg||{}).starts,total:ls.length,btn:b,cards:ls});return;}
  play(S(n),{mode:kind==='slow'?'slow':'single',btn:b,cards:card?[card]:[],starts:[0],total:0});return;}
 var ln=e.target.closest('.dlg .ln');if(ln){play(S(ln.dataset.k),{mode:'single',cards:[ln],starts:[0]});return;}
 var f=e.target.closest('.flip');if(f&&!e.target.closest('button')){f.classList.toggle('open');if(f.classList.contains('open')&&f.dataset.k)play(S(f.dataset.k),{mode:'single',cards:[f],starts:[0]});return;}
 var t=e.target.closest('.try');if(t&&!e.target.closest('button')){t.classList.toggle('open');return;}
 var r=e.target.closest('[data-run]');if(r&&r.dataset.run==='ko'){document.body.classList.toggle('hideko');r.classList.toggle('on',document.body.classList.contains('hideko'));}
});
/* daily check (localStorage only) */
var K='de100',all=JSON.parse(localStorage.getItem(K)||'{}'),me=all[meta.id]||{steps:[]},boxes=[].slice.call(document.querySelectorAll('.chk input'));
function save(){me.steps=boxes.map(function(x){return x.checked;});var ok=boxes.length&&boxes.every(function(x){return x.checked;});
 if(ok&&!me.done)me.done=new Date().toISOString().slice(0,10);if(!ok)delete me.done;all[meta.id]=me;localStorage.setItem(K,JSON.stringify(all));
 var d=document.querySelector('.done');if(d){d.style.display=me.done?'block':'none';d.textContent='오늘 공부 완료! '+(me.done||'');}}
boxes.forEach(function(x,i){x.checked=!!me.steps[i];x.addEventListener('change',save);});save();
window.__playerReady=1;
})();
