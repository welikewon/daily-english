/* Our mini-drama (우리 드라마): slow -> natural -> drama speed, 「들리는 소리 → 원래 문장」 captions, listening drills. Original scripts and our own synthetic voices only. */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var IDX=null,idxP=null;
function index(){if(!idxP)idxP=fetch('../drama/index.json').then(function(r){return r.ok?r.json():{days:[]};}).then(function(j){IDX=j;return j;},function(){IDX={days:[]};return IDX;});return idxP;}
/* Day screen slot: a button only when this Day has a drama */
window.deDramaSlot=function(n){var el=document.getElementById('dramaslot');if(!el)return;index().then(function(j){if(document.getElementById('dramaslot')!==el)return;
 if((j.days||[]).indexOf(n)<0)return;el.innerHTML='<a class="go dramago" href="#/drama/'+n+'">🎭 우리 드라마 · Our mini-drama<small>천천히 → 보통 → 드라마 속도로 들어요 · Slow → natural → drama speed</small></a>';});};
var A=null,stopQ=false;
function stop(){stopQ=true;if(A){try{A.pause();}catch(e){}A=null;}V0&&V0.querySelectorAll('.dl.on').forEach(function(x){x.classList.remove('on');});}
window.deDramaStop=stop;
var V0=null;
function play(src,cb){stopQ=false;try{window.stopAll&&window.stopAll();}catch(e){}if(A){try{A.pause();}catch(e){}}A=new Audio(src);A.onended=function(){cb&&cb(true);};A.onerror=function(){cb&&cb(false);};A.play().catch(function(){cb&&cb(false);});window.__dramaPlays=(window.__dramaPlays||0)+1;}
var SP=[{k:'s',ko:'🐢 천천히',en:'Slow'},{k:'n',ko:'🙂 보통',en:'Natural'},{k:'d',ko:'🎬 드라마 속도',en:'Drama speed'}];
window.dramaScreen=function(V,n,back){V0=V;stop();V.innerHTML='<p class="n2" style="padding:16px">불러오는 중… · Loading…</p>';
 Promise.all([index(),fetch('../drama/d'+('00'+n).slice(-3)+'.json').then(function(r){if(!r.ok)throw 0;return r.json();})]).then(function(r){render(V,r[1],r[0],back);},function(){location.replace(back);});};
function render(V,D,I,back){var sp=+(localStorage.getItem('de100dsp')||0);if(!(sp>=0&&sp<3))sp=0;
 var h='<header class="atop"><a class="aback" href="'+back+'">← Day '+D.day+'</a><div class="k">🎭 우리 드라마 · Our mini-drama</div><h1>'+esc(D.title_ko)+'</h1><div class="sub">'+esc(D.title_en)+'</div></header>'+
  '<div class="card"><p class="n2">'+esc(D.setting_ko)+'</p><p class="n2">등장: '+D.cast.map(function(c){return esc(c.name)+(c.me?' (나)':'');}).join(', ')+'</p>'+
  '<div class="dsp" role="group" aria-label="속도 · Speed">'+SP.map(function(s,i){return '<button data-sp="'+i+'"'+(i===sp?' class="on"':'')+'>'+s.ko+'<small>'+s.en+'</small></button>';}).join('')+'</div>'+
  '<button id="dall" class="go">▶ 처음부터 듣기 · Play all</button><button id="dstop" class="big2" hidden>⏹ 멈춤 · Stop</button>'+
  '<p class="n2 dnote">🔈 '+esc(I.note_ko||'소리 흉내 (대략)')+' · 「들리는 소리 → 원래 문장」</p></div>'+
  '<div class="card dlines">'+D.lines.map(function(L,i){return '<div class="dl'+(L.me?' me':'')+'" data-i="'+i+'"><div class="who">'+esc(L.who)+'</div>'+
   '<div class="en">'+esc(L.en)+'</div><div class="dh"><span class="hk">🔈 '+esc(L.hk)+'</span><div class="sp">'+esc(L.sp)+' → '+esc(L.en)+'</div>'+
   (L.red.length?'<div class="reds">'+L.red.map(function(x){return '<span class="red">'+esc(x.w)+' → <b>'+esc(x.h)+'</b> ('+esc(x.k)+')</span>';}).join('')+'</div>':'')+'</div>'+
   '<div class="ko n2">'+esc(L.ko)+'</div><button class="dplay" data-i="'+i+'" aria-label="듣기 · Play">▶</button></div>';}).join('')+'</div>'+
  (D.drill.length?'<div class="card ddrill"><h2>👂 들리는 대로 고르기 · What did they say?</h2><p class="n2">드라마 속도로 듣고 원래 문장을 골라요 · Listen at drama speed, pick the written words</p><div id="dq"></div></div>':'');
 V.innerHTML=h;var $=function(s){return V.querySelector(s);};
 function setSp(i){sp=i;localStorage.setItem('de100dsp',i);V.querySelectorAll('.dsp button').forEach(function(b){b.classList.toggle('on',+b.dataset.sp===i);});V.querySelector('.dlines').classList.toggle('drama',i===2);}
 setSp(sp);
 V.querySelector('.dsp').onclick=function(e){var b=e.target.closest('button');if(b)setSp(+b.dataset.sp);};
 function line(i,cb){var L=D.lines[i];V.querySelectorAll('.dl.on').forEach(function(x){x.classList.remove('on');});var el=V.querySelector('.dl[data-i="'+i+'"]');el.classList.add('on');el.scrollIntoView({block:'center',behavior:'smooth'});
  play(L.a+SP[sp].k+'.mp3',function(ok){el.classList.remove('on');cb&&cb(ok);});}
 V.querySelector('.dlines').onclick=function(e){var b=e.target.closest('.dplay');if(b){line(+b.dataset.i);}};
 $('#dall').onclick=function(){var i=0;$('#dall').hidden=true;$('#dstop').hidden=false;stopQ=false;
  (function nx(){if(stopQ||i>=D.lines.length){$('#dall').hidden=false;$('#dstop').hidden=true;window.__dramaAll=i;return;}var k=i++;line(k,function(){if(stopQ)return nx();setTimeout(nx,(D.lines[k].gap||600)*(sp===0?1.3:1));});})();};
 $('#dstop').onclick=function(){stop();$('#dall').hidden=false;$('#dstop').hidden=true;};
 if(!D.drill.length)return;var qi=0,score=0;
 function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
 function q(){var box=$('#dq');if(qi>=D.drill.length){box.innerHTML='<p class="big">🎉 '+score+' / '+D.drill.length+'</p><button class="big2" id="dqr">🔁 다시 하기 · Again</button>';$('#dqr').onclick=function(){qi=0;score=0;q();};window.__dramaScore=score;return;}
  var Q=D.drill[qi],L=D.lines.filter(function(x){return x.n===Q.line;})[0];
  box.innerHTML='<div class="n2">'+(qi+1)+' / '+D.drill.length+'</div><button class="big2" id="dqp">🔊 드라마 속도로 듣기 · Listen</button><div class="dqt">'+esc(Q.prompt)+'</div>'+
   shuffle(Q.ch).map(function(c){return '<button class="dch" data-c="'+esc(c)+'">'+esc(c)+'</button>';}).join('')+'<div id="dqf" class="n2"></div>';
  var pl=function(){if(L)play(L.a+'d.mp3');};$('#dqp').onclick=pl;pl();
  box.querySelectorAll('.dch').forEach(function(b){b.onclick=function(){if(box.dataset.done==='1')return;box.dataset.done='1';var ok=b.dataset.c===Q.ans;if(ok)score++;
   b.classList.add(ok?'ok':'no');box.querySelectorAll('.dch').forEach(function(x){if(x.dataset.c===Q.ans)x.classList.add('ok');});
   $('#dqf').innerHTML=(ok?'⭕ 맞았어요! · Correct! ':'❌ 정답 · Answer: <b>'+esc(Q.ans)+'</b> ')+'<br>🔈 '+esc(Q.heard)+' ('+esc(Q.k)+')<br><button class="go" id="dqn">다음 · Next ▶</button>';
   $('#dqn').onclick=function(){box.dataset.done='';qi++;q();};};});}
 q();}
})();
