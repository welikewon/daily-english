/* Real-time AI English call: today's Day scene or any topic. Needs live.js (window.deLive) and main.js (age gate, router). */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function url(){return window.deTR&&window.deTR.url&&window.deTR.url();}
function dev(){return window.deLive&&window.deLive.dev?window.deLive.dev():'';}
/* remaining live talks today for this phone (read only) */
function quota(cb){var u=url();if(!u)return cb(null);fetch(u.replace(/\/$/,'')+'/quota',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dev:dev()})})
 .then(function(r){return r.json();}).then(function(j){cb(j&&typeof j.left==='number'&&!j.off?j.left:null);},function(){cb(null);});}
function qText(n){return (n==null?'':'오늘 남은 대화 '+n+'번 · ')+'무료 · 가입 없음 · 결제 없음';}
window.deCallQuota=function(el){if(!el)return;quota(function(n){el.textContent=qText(n);});};
var C=null;
function stop(){if(!C)return;var c=C;C=null;try{c.mic&&c.mic.stop();}catch(e){}try{c.pl&&c.pl.stop();}catch(e){}try{c.sess&&c.sess.close();}catch(e){}}
window.deCallStop=stop;
window.callScreen=function(V,n,free,back){stop();
 var title=free?'💬 아무 주제로 대화':'🎙 AI와 실시간 영어 대화';
 V.innerHTML='<header class="atop"><a class="aback" href="'+back+'">← 뒤로 · Back</a><div class="k">'+(free?'Any topic':'DAY '+n)+'</div><h1>'+title+'</h1><div class="sub">'+(free?'Jake와 원하는 주제로 이야기해요 · Talk about anything with Jake':'오늘 배운 장면으로 Jake와 통화해요 · Call Jake in today\'s scene')+'</div></header>'+
  '<div class="callv"><div class="card callstart" id="cst"><button id="cgo" class="go callgo">📞 대화 시작 · Start talking</button><div class="n2 cq" id="cq">'+qText(null)+'</div>'+
  '<p class="n2">말이 끝나면 Jake가 대답해요. 막히면 한국어로 말해도 돼요. · Speak, then Jake answers. Korean is OK when you are stuck.</p>'+
  '<label class="copt"><input type="checkbox" id="oslow"> 🐢 천천히 · 기다려 주기 <small>Slow voice, longer wait</small></label>'+
  '<label class="copt"><input type="checkbox" id="ohold"> 🎤 누르는 동안만 말하기 <small>Hold to talk</small></label></div>'+
  '<div id="cmis" class="card cmis" hidden></div>'+
  '<div id="clog" class="clog"></div><div id="cst2" class="n2 cst2"></div>'+
  '<div class="cdock" id="cdock" hidden><form id="cform" class="ctype"><input id="cin" autocomplete="off" enterkeyhint="send" placeholder="여기에 써도 돼요 · Or type here" aria-label="영어로 쓰기 · Type"><button class="go" aria-label="보내기 · Send">보내기<small>Send</small></button></form>'+
  '<div class="chelp"><button data-h="ko">🇰🇷 한국어 뜻<small>Meaning</small></button><button data-h="say">💡 뭐라고 말하지?<small>What to say</small></button><button data-h="fix">✏ 방금 말 고쳐 줘<small>Fix my line</small></button></div>'+
  '<div id="chout" class="chout" hidden></div><button id="chold" class="go chold" hidden>🎤 누르고 말하기 · Hold to talk</button>'+
  '<div class="cbtns"><button id="cpause" class="big2">⏸ 잠깐 멈춤<small>Pause</small></button><button id="cend" class="big2 cendb">⏹ 끝내기<small>End</small></button></div></div></div>';
 var $=function(s){return V.querySelector(s);};window.deCallQuota($('#cq'));
 function bubble(me,txt){var d=document.createElement('div');d.className='cb '+(me?'me':'ai');d.innerHTML='<div class="who">'+(me?'나 · Me':'Jake')+'</div><div class="en"></div>'+(me?'<button class="cnot">제 말이 아니에요 · That\'s not what I said</button>':'');
  if(me)d.querySelector('.cnot').onclick=function(){var w=prompt('뭐라고 말했나요? 영어로 써 주세요 · What did you say? Type it',d.querySelector('.en').textContent);if(!w||!w.trim()||!C||!C.started)return;w=w.trim();d.querySelector('.en').textContent=w;d.classList.add('fixed');C.lines[d.__i]=w;C.cur=null;C.me=null;C.sess.sendText('(Correction from the learner - what I actually said: "'+w+'". Reply to this instead.)');window.__callNot=(window.__callNot||0)+1;};d.querySelector('.en').textContent=txt||'';$('#clog').appendChild(d);d.scrollIntoView({block:'end',behavior:'smooth'});return d;}
 function status(t){var s=$('#cst2');if(s)s.textContent=t||'';}
 function fail(e){var err=e&&e.error;stop();$('#cdock').hidden=true;$('#cst').hidden=false;
  status(err==='daily'?'오늘 실시간 대화를 다 썼어요. 내일 다시 할 수 있어요. · You have used today\'s live talks; try again tomorrow.':err==='live_off'||err==='config'?'지금은 실시간 대화를 쓸 수 없어요. · Live talk is not available right now.':'연결이 안 됐어요. 인터넷을 확인하고 다시 눌러 주세요. · Could not connect; check the internet and try again.');window.__callFail=err||'x';window.deCallQuota($('#cq'));}
 var OP={};try{OP=JSON.parse(localStorage.getItem('de100callopt'))||{};}catch(e){}if(OP.slow==null)OP.slow=!free&&n<=17;
 $('#oslow').checked=!!OP.slow;$('#ohold').checked=!!OP.hold;
 V.querySelectorAll('.copt input').forEach(function(i){i.onchange=function(){OP={slow:$('#oslow').checked,hold:$('#ohold').checked};localStorage.setItem('de100callopt',JSON.stringify(OP));};});
 function start(fb){var t0=Date.now();window.deLive.audio();status('📞 연결 중… · Connecting…');$('#cst').hidden=true;
  window.deLive.tokens(url(),{kind:'call',day:n||1,free:!!free,fallback:!!fb,sid:'c'+t0,slow:!!OP.slow,wait:OP.slow?'long':'',hold:!!OP.hold}).then(function(j){if(!V.contains($('#clog')))return;var s=j.sessions.call;
   var c=C={pl:new window.deLive.Player(),cur:null,me:null,paused:false,started:false,turns:0,lines:[],ai:[],hold:!!OP.hold,mis:(j.missions||[]).slice(0,3)};showMis(c);
   function again(){stop();window.__callFb=1;start(true);}
   c.mic=new window.deLive.Mic(function(d){if(C===c&&!c.paused&&c.sess&&(!c.hold||c.down))c.sess.sendAudio(d);});
   c.sess=new window.deLive.Session(j.ws,s,{
    ready:function(){if(C!==c)return;c.started=true;window.__callReadyMs=Date.now()-t0;status('');$('#cdock').hidden=false;$('#chold').hidden=!c.hold;c.sess.sendText('(The talk starts. Greet the learner.)');
     c.mic.start().catch(function(){status('마이크 사용이 막혀 있어요. 주소창 옆 🔒 → 마이크 허용. 아래에 써서 대화해도 돼요. · The microphone is blocked; you can type below.');});},
    outTx:function(t){if(C!==c)return;if(!c.cur){c.me=null;c.cur=bubble(false,'');c.curT='';c.ai.push('');}c.curT+=t;c.ai[c.ai.length-1]=c.curT;c.cur.querySelector('.en').textContent=c.curT;},
    inTx:function(t){if(C!==c)return;if(!c.me){c.cur=null;c.me=bubble(true,'');c.meT='';c.turns++;c.me.__i=c.lines.length;c.lines.push('');}c.meT+=t;c.lines[c.me.__i]=c.meT;c.me.querySelector('.en').textContent=c.meT;tick(c,c.meT);},
    audio:function(d){if(C!==c||c.paused)return;c.pl.play(d);window.__callSpoke=(window.__callSpoke||0)+1;},
    interrupted:function(){if(C===c)c.pl.stop();},
    turnDone:function(){if(C===c){c.cur=null;c.me=null;}},
    closed:function(code,wasReady){window.__callClose=code;if(C!==c)return;if(!wasReady){if(!fb&&j.fb)return again();return fail({error:'ws'+code});}end('closed');}});
   c.sess.open();setTimeout(function(){if(C===c&&!c.started){if(!fb&&j.fb)again();else fail({error:'timeout'});}},8000);
  }).catch(fail);}
 function end(why){var c=C;stop();$('#cdock').hidden=true;$('#cst').hidden=false;$('#cgo').innerHTML='📞 다시 대화하기 · Talk again';status('');
  window.__callEnded=why||'end';window.deCallQuota($('#cq'));if(c)card(c);}
 /* the same end-of-call card every time: what you did, missions, up to 3 better sentences (▶ · 🎤 다시 말하기 · ⭐) */
 function card(c){var old=V.querySelector('.cend');if(old)old.remove();var d=document.createElement('div');d.className='card cend';
  var lines=c.lines.filter(function(x){return x&&x.trim();});
  d.innerHTML='<h2>📋 오늘 대화 정리 · Talk summary</h2><p class="big">🗣 '+lines.length+'번 말했어요 · You spoke '+lines.length+' times</p>'+
   (c.mis.length?'<div class="n2">🎯 미션 '+c.mis.filter(function(m){return m.done;}).length+' / '+c.mis.length+'</div>':'')+'<div class="crev"><p class="n2">💭 더 자연스러운 문장을 찾고 있어요… · Finding better sentences…</p></div>';
  $('#clog').parentNode.insertBefore(d,$('#clog'));d.scrollIntoView({block:'start',behavior:'smooth'});window.__callCard=1;
  var box=d.querySelector('.crev');if(!lines.length){box.innerHTML='<p>다음엔 한 마디라도 말해 봐요! · Next time, try saying at least one line!</p>';return;}
  post('/review',{day:n||1,lines:lines}).then(function(j){var it=j.items||[];window.__callReview=it.length;
   box.innerHTML=(j.praise_ko?'<p>👏 '+esc(j.praise_ko)+'</p>':'')+(it.length?it.map(function(x,i){return '<div class="crow"><div class="n2 said">'+esc(x.said)+'</div><div class="en">✅ '+esc(x.better)+'</div><div class="n2">'+esc(x.ko)+(x.why_ko?' · '+esc(x.why_ko):'')+'</div>'+
    '<div class="qa"><button data-p="'+i+'">▶ 듣기<small>Play</small></button><button data-r="'+i+'">🎤 다시 말하기<small>Say it</small></button><button data-s="'+i+'">⭐ 저장<small>Save</small></button></div><div class="n2 rr"></div></div>';}).join(''):'<p>고칠 문장이 없어요. 아주 잘했어요! · Nothing to fix. Great job!</p>');
   box.onclick=function(e){var b=e.target.closest('button');if(!b)return;var x=it[b.dataset.p||b.dataset.r||b.dataset.s];if(!x)return;
    if(b.dataset.p!=null)window.deTR.say(x.better,'en',0.9);
    else if(b.dataset.s!=null){saveStar(x.better,x.ko);b.innerHTML='⭐ 저장됨<small>Saved</small>';}
    else sayBack(x.better,b.closest('.crow').querySelector('.rr'));};
  },function(){box.innerHTML='<p class="n2">정리를 지금 만들 수 없어요. 내일 다시 해 봐요. · Could not make the summary now.</p>';});}
 function saveStar(en,ko){var L=[];try{L=JSON.parse(localStorage.getItem('de100star'))||[];}catch(e){}if(L.some(function(x){return x.en===en;}))return;L.unshift({en:en,ko:ko,saved:new Date().toISOString().slice(0,10)});localStorage.setItem('de100star',JSON.stringify(L.slice(0,200)));}
 function norm(s){return String(s||'').toLowerCase().replace(/[^a-z' ]/g,' ').split(/\s+/).filter(Boolean);}
 function sayBack(want,out){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){out.textContent='이 휴대폰은 음성 인식이 안 돼요 · No speech recognition here';return;}
  var r=new SR();r.lang='en-US';r.interimResults=false;r.maxAlternatives=3;out.textContent='🎤 말해 보세요… · Say it now…';
  r.onresult=function(e){var best=0,heard='';for(var k=0;k<e.results[0].length;k++){var h=norm(e.results[0][k].transcript),w=norm(want),hit=w.filter(function(x){return h.indexOf(x)>=0;}).length/Math.max(1,w.length);if(hit>best){best=hit;heard=e.results[0][k].transcript;}}
   out.textContent=(best>=0.8?'👍 좋아요! · Good! ':'🔁 한 번 더 · Once more: ')+'「'+heard+'」';};r.onerror=function(){out.textContent='다시 눌러 주세요 · Tap again';};try{r.start();}catch(e){}}
 function post(p,body){body.dev=dev();return fetch(url().replace(/\/$/,'')+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});}
 /* missions: ticked when every word of one key group (or an accepted line) is heard */
 function showMis(c){var m=$('#cmis');if(!c.mis.length){m.hidden=true;return;}m.hidden=false;m.innerHTML='<b>🎯 오늘의 미션 · Missions</b>'+c.mis.map(function(x,i){return '<div class="cm" data-i="'+i+'"><span class="ck">☐</span> '+esc(x.goal_ko||'')+'<div class="n2">'+esc(x.say_en||'')+'</div></div>';}).join('');}
 function sim(a,b){var A={},B={},n=0,u=0,k;a.forEach(function(x){A[x]=1;});b.forEach(function(x){B[x]=1;});for(k in A){u++;if(B[k])n++;}for(k in B)if(!A[k])u++;return u?n/u:0;}
 /* r1 rule: tick only if a key group is fully heard AND the line is closer to an accepted answer than to Jake's line AND negation agrees with the model line */
 var NEG=/^(not|no|never|don't|doesn't|didn't|can't|cannot|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|shouldn't|wouldn't|couldn't|nothing|nobody)$/;
 function neg(w){return w.some(function(x){return NEG.test(x);});}
 function tick(c,said){if(!c.mis.length)return;var w=norm(said),ai=c.ai.filter(Boolean),pw=norm(ai[ai.length-1]||'');c.mis.forEach(function(x,i){if(x.done)return;
  var keys=(x.keys&&x.keys.length?x.keys:(x.accept||[]).map(function(a){return norm(a);}));
  if(!keys.some(function(g){return g.length&&g.every(function(k){return w.indexOf(String(k).toLowerCase())>=0;});}))return;
  var best=Math.max.apply(null,[0].concat((x.accept||[]).concat([x.say_en||'']).map(function(a){return sim(w,norm(a));})));
  if(pw.length&&sim(w,pw)>=best)return;
  if(x.say_en&&neg(w)!==neg(norm(x.say_en)))return;
  x.done=true;var el=$('#cmis .cm[data-i="'+i+'"]');if(el){el.classList.add('done');el.querySelector('.ck').textContent='✅';}window.__callMis=(window.__callMis||0)+1;});}
 /* help bar: meaning of Jake's last line / what I could say (press again: easier) / my last line made natural */
 var helpN=0;
 V.querySelector('.chelp').onclick=function(e){var b=e.target.closest('button');if(!b||!C)return;var k=b.dataset.h,o=$('#chout');var a=C.ai.filter(Boolean),m=C.lines.filter(Boolean);var last=a[a.length-1]||'',me=m[m.length-1]||'';
  if(!last){o.hidden=false;o.textContent='Jake가 먼저 말하면 눌러 주세요 · Wait for Jake first';return;}
  if(k==='fix'&&!me){o.hidden=false;o.textContent='먼저 한 마디 말해 보세요 · Say something first';return;}
  helpN=k==='say'?helpN+1:0;o.hidden=false;o.innerHTML='<p class="n2">💭 …</p>';window.__callHelp=(window.__callHelp||0)+1;
  post('/hints',{day:n||1,partner:last,learner:k==='fix'?me:''}).then(function(j){
   if(k==='ko')o.innerHTML='<b>🇰🇷</b> '+esc(j.reply_ko||'');
   else if(k==='fix')o.innerHTML=j.natural?'✏ <b>'+esc(j.natural)+'</b> <button class="mini" data-play="'+esc(j.natural)+'">▶</button>':'👍 지금 말도 괜찮아요 · Your line was fine';
   else{var h=j.hints||[];o.innerHTML=h.map(function(x){var en=helpN>1?x.en.split(' ').slice(0,3).join(' ')+' …':x.en;return '<div>💡 <b>'+esc(en)+'</b> <button class="mini" data-play="'+esc(x.en)+'">▶</button><div class="n2">'+esc(x.ko)+'</div></div>';}).join('')+(helpN>1?'<p class="n2">첫 마디만 보여 드려요. 이어서 말해 보세요 · Just the first words: go on!</p>':'<p class="n2">한 번 더 누르면 첫 마디만 보여 줘요 · Tap again for just the first words</p>');}
  },function(er){o.textContent=er&&er.error==='daily'?'오늘 도움말을 다 썼어요 · Help is used up for today':'지금은 도움말을 못 가져와요 · Help is not available now';});};
 $('#chout').onclick=function(e){var b=e.target.closest('[data-play]');if(b)window.deTR.say(b.dataset.play,'en',0.85);};
 /* hold to talk */
 var hb=$('#chold');function hdown(e){e.preventDefault();if(!C||!C.started||!C.hold)return;C.down=true;C.pl.stop();C.sess.send({realtimeInput:{activityStart:{}}});hb.classList.add('on');hb.innerHTML='🔴 말하는 중… 떼면 보내요 · Release to send';}
 function hup(){if(!C||!C.down)return;C.down=false;C.sess.send({realtimeInput:{activityEnd:{}}});hb.classList.remove('on');hb.innerHTML='🎤 누르고 말하기 · Hold to talk';window.__callHold=(window.__callHold||0)+1;}
 hb.addEventListener('pointerdown',hdown);hb.addEventListener('pointerup',hup);hb.addEventListener('pointerleave',hup);hb.addEventListener('pointercancel',hup);
 $('#cgo').onclick=function(){start(false);};
 $('#cend').onclick=function(){end('end');};
 $('#cpause').onclick=function(){if(!C)return;C.paused=!C.paused;C.mic.pause(C.paused);if(C.paused)C.pl.stop();this.innerHTML=C.paused?'▶ 계속하기<small>Resume</small>':'⏸ 잠깐 멈춤<small>Pause</small>';};
 $('#cform').onsubmit=function(e){e.preventDefault();var v=$('#cin').value.trim();if(!v||!C||!C.started)return;C.cur=null;C.me=null;var bb=bubble(true,v);bb.__i=C.lines.length;C.lines.push(v);C.turns++;tick(C,v);C.sess.sendText(v);$('#cin').value='';window.__callTyped=(window.__callTyped||0)+1;};
};
})();
