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
  '<p class="n2">말이 끝나면 Jake가 대답해요. 막히면 한국어로 말해도 돼요. · Speak, then Jake answers. Korean is OK when you are stuck.</p></div>'+
  '<div id="clog" class="clog"></div><div id="cst2" class="n2 cst2"></div>'+
  '<div class="cdock" id="cdock" hidden><form id="cform" class="ctype"><input id="cin" autocomplete="off" enterkeyhint="send" placeholder="여기에 써도 돼요 · Or type here" aria-label="영어로 쓰기 · Type"><button class="go" aria-label="보내기 · Send">보내기<small>Send</small></button></form>'+
  '<div class="cbtns"><button id="cpause" class="big2">⏸ 잠깐 멈춤<small>Pause</small></button><button id="cend" class="big2 cendb">⏹ 끝내기<small>End</small></button></div></div></div>';
 var $=function(s){return V.querySelector(s);};window.deCallQuota($('#cq'));
 function bubble(me,txt){var d=document.createElement('div');d.className='cb '+(me?'me':'ai');d.innerHTML='<div class="who">'+(me?'나 · Me':'Jake')+'</div><div class="en"></div>';d.querySelector('.en').textContent=txt||'';$('#clog').appendChild(d);d.scrollIntoView({block:'end',behavior:'smooth'});return d;}
 function status(t){var s=$('#cst2');if(s)s.textContent=t||'';}
 function fail(e){var err=e&&e.error;stop();$('#cdock').hidden=true;$('#cst').hidden=false;
  status(err==='daily'?'오늘 실시간 대화를 다 썼어요. 내일 다시 할 수 있어요. · You have used today\'s live talks; try again tomorrow.':err==='live_off'||err==='config'?'지금은 실시간 대화를 쓸 수 없어요. · Live talk is not available right now.':'연결이 안 됐어요. 인터넷을 확인하고 다시 눌러 주세요. · Could not connect; check the internet and try again.');window.__callFail=err||'x';window.deCallQuota($('#cq'));}
 function start(fb){var t0=Date.now();window.deLive.audio();status('📞 연결 중… · Connecting…');$('#cst').hidden=true;
  window.deLive.tokens(url(),{kind:'call',day:n||1,free:!!free,fallback:!!fb,sid:'c'+t0}).then(function(j){if(!V.contains($('#clog')))return;var s=j.sessions.call;
   var c=C={pl:new window.deLive.Player(),cur:null,me:null,paused:false,started:false,turns:0};
   function again(){stop();window.__callFb=1;start(true);}
   c.mic=new window.deLive.Mic(function(d){if(C===c&&!c.paused&&c.sess)c.sess.sendAudio(d);});
   c.sess=new window.deLive.Session(j.ws,s,{
    ready:function(){if(C!==c)return;c.started=true;window.__callReadyMs=Date.now()-t0;status('');$('#cdock').hidden=false;c.sess.sendText('(The talk starts. Greet the learner.)');
     c.mic.start().catch(function(){status('마이크 사용이 막혀 있어요. 주소창 옆 🔒 → 마이크 허용. 아래에 써서 대화해도 돼요. · The microphone is blocked; you can type below.');});},
    outTx:function(t){if(C!==c)return;if(!c.cur){c.me=null;c.cur=bubble(false,'');c.curT='';}c.curT+=t;c.cur.querySelector('.en').textContent=c.curT;},
    inTx:function(t){if(C!==c)return;if(!c.me){c.cur=null;c.me=bubble(true,'');c.meT='';c.turns++;}c.meT+=t;c.me.querySelector('.en').textContent=c.meT;},
    audio:function(d){if(C!==c||c.paused)return;c.pl.play(d);window.__callSpoke=(window.__callSpoke||0)+1;},
    interrupted:function(){if(C===c)c.pl.stop();},
    turnDone:function(){if(C===c){c.cur=null;c.me=null;}},
    closed:function(code,wasReady){window.__callClose=code;if(C!==c)return;if(!wasReady){if(!fb&&j.fb)return again();return fail({error:'ws'+code});}end('closed');}});
   c.sess.open();setTimeout(function(){if(C===c&&!c.started){if(!fb&&j.fb)again();else fail({error:'timeout'});}},8000);
  }).catch(fail);}
 function end(why){var c=C;stop();$('#cdock').hidden=true;$('#cst').hidden=false;$('#cgo').innerHTML='📞 다시 대화하기 · Talk again';
  status(c&&c.turns?'수고했어요! 오늘 '+c.turns+'번 말했어요. · Well done! You spoke '+c.turns+' times.':'');window.__callEnded=why||'end';window.deCallQuota($('#cq'));}
 $('#cgo').onclick=function(){start(false);};
 $('#cend').onclick=function(){end('end');};
 $('#cpause').onclick=function(){if(!C)return;C.paused=!C.paused;C.mic.pause(C.paused);if(C.paused)C.pl.stop();this.innerHTML=C.paused?'▶ 계속하기<small>Resume</small>':'⏸ 잠깐 멈춤<small>Pause</small>';};
 $('#cform').onsubmit=function(e){e.preventDefault();var v=$('#cin').value.trim();if(!v||!C||!C.started)return;C.cur=null;C.me=null;bubble(true,v);C.turns++;C.sess.sendText(v);$('#cin').value='';window.__callTyped=(window.__callTyped||0)+1;};
};
})();
