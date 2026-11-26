/* 바로 통역 · Live interpreter (app screen #/tr) + window.deTR helper (stuck panel, AI call). our proxy /translate; phone speech in/out. */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function aiUrl(){if(window.TALK_AI_URL!=null)return window.TALK_AI_URL;var T=window.TALKS||{};for(var k in T){var t=T[k]&&(T[k].data||T[k]);if(t&&t.tutor&&t.tutor.url)return t.tutor.url;}
 var one=window.TALK;return one&&one.tutor&&one.tutor.url||'';}
function sid(){var s=null;try{s=sessionStorage.getItem('de100sid');}catch(e){}if(!s){s=Math.random().toString(36).slice(2,10)+Date.now().toString(36);try{sessionStorage.setItem('de100sid',s);}catch(e){}}return s;}
function translate(text,from,to){var U=aiUrl();if(!U)return Promise.reject({error:'off'});
 var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ctl)ctl.abort();},9000);
 return fetch(U.replace(/\/$/,'')+'/translate',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl?ctl.signal:undefined,body:JSON.stringify({text:text,from:from,to:to,sid:sid()})})
  .then(function(r){return r.json().catch(function(){return {};}).then(function(j){clearTimeout(tm);if(r.status===200&&j.translation)return j;throw {error:j.error||('http'+r.status),status:r.status};});},function(e){clearTimeout(tm);throw {error:'network'};});}
function voice(lang){var v=(window.speechSynthesis&&speechSynthesis.getVoices())||[],re=(lang==='ko')?(/^ko/i):(/^en[-_]US/i);var c=v.filter(function(x){return re.test(x.lang);});
 return c.filter(function(x){return /Google/i.test(x.name);})[0]||c[0]||null;}
function say(t,lang,rate,cb){var ss=window.speechSynthesis;if(!ss||!t){cb&&cb();return;}try{window.stopAll&&stopAll();}catch(e){}ss.cancel();
 var u=new SpeechSynthesisUtterance(t),v=voice(lang);u.lang=lang==='ko'?'ko-KR':'en-US';if(v)u.voice=v;u.rate=rate||0.9;var done=false,fin=function(){if(!done){done=true;cb&&cb();}};
 u.onend=fin;u.onerror=fin;setTimeout(fin,2500+t.length*110/u.rate);ss.speak(u);window.__trSpoke=(window.__trSpoke||[]).concat([lang+':'+t]);}
function errMsg(e){if(e&&e.status===429)return '오늘 쓸 수 있는 무료 통역을 다 썼어요. 내일 다시 쓸 수 있어요. · Today\'s free translations are used up. Try again tomorrow.';
 if(e&&(e.error==='off'||e.status===503))return '지금은 통역을 쓸 수 없어요. 아래 번역기 링크를 써 주세요. · The interpreter is off right now. Please use a translator link below.';
 return '연결이 느려요. 다시 눌러 주세요. · The connection is slow. Please try again.';}
window.deTR={url:aiUrl,translate:translate,say:say,err:errMsg};
/* ---------- saved sentences (⭐) feed the daily review ---------- */
function stars(){try{return JSON.parse(localStorage.getItem('de100star')||'[]');}catch(e){return [];}}
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function star(en,ko){var L=stars();if(L.some(function(x){return x.en===en;}))return false;L.unshift({en:en,ko:ko,saved:today()});localStorage.setItem('de100star',JSON.stringify(L.slice(0,200)));return true;}
window.deStars=stars;
/* ---------- screen ---------- */
window.interpScreen=function(V,back){var U=aiUrl();
 var st={flip:false,conv:false,rec:null,last:null,hist:[]};try{st.hist=JSON.parse(sessionStorage.getItem('de100tr')||'[]');}catch(e){}
 function L(ko,en){var m=String(ko).match(/^([^\w가-힣]+)\s*/),ic=m?m[1]:'';ko=String(ko).slice(m?m[0].length:0);return st.flip?ic+en+' · '+ko:ic+ko+' · '+en;}
 V.innerHTML='<header class="atop"><a class="aback" href="'+(back||'#/')+'">← <span class="lb" data-ko="뒤로" data-en="Back"></span></a><div class="k">웰컴 잉글리시 100</div><h1 class="lb" data-ko="🗣 바로 통역" data-en="Live interpreter"></h1></header>'+
  '<div id="trwrap">'+(U?'':'<div class="card warn">지금은 통역을 쓸 수 없어요. · The interpreter is not available.</div>')+
  '<div id="trout" class="card trout"><p class="n2 lb" data-ko="아래 버튼을 누르고 말하세요." data-en="Tap a button below and speak."></p></div>'+
  '<div id="trlive" class="trlive" hidden><span class="mic">🎤</span> <span class="lt"></span></div>'+
  '<div class="trbtns"><button id="trko" class="trmic ko lb" data-ko="🇰🇷 한국어로 말하기" data-en="Speak Korean"></button><button id="tren" class="trmic en lb" data-ko="🇺🇸 영어로 말하기" data-en="Speak English"></button></div>'+
  '<button id="trstop" class="big2 lb" hidden data-ko="■ 다 말했어요" data-en="Done"></button>'+
  '<div class="trtog"><label class="tgl"><input type="checkbox" id="trconv"> <span class="lb" data-ko="대화 모드" data-en="Conversation mode"></span></label>'+
  '<label class="tgl"><input type="checkbox" id="trkosnd"> <span class="lb" data-ko="한국어 소리로 듣기" data-en="Read Korean aloud"></span></label>'+
  '<button id="trflip" class="big2 lb" data-ko="🔄 상대에게 보여주기" data-en="Show to partner"></button><button id="trpause" class="big2 lb" data-ko="⏸ 잠깐 멈춤" data-en="Pause"></button></div>'+
  '<details class="trtype"><summary class="lb" data-ko="✍ 글로 쓰기" data-en="Type instead"></summary><textarea id="trtx" rows="3"></textarea><button id="trsend" class="big2 lb" data-ko="번역기로 바로 보내기" data-en="Send to translator"></button></details>'+
  '<p class="n2 lb" data-ko="통역할 말은 번역을 위해 구글 AI로 보내져요. 이름·연락처 같은 개인 정보는 말하지 마세요." data-en="Your words go to Google AI for translation. Please do not say personal details."></p>'+
  '<h3 class="lb" data-ko="이번 대화" data-en="This conversation"></h3><ol id="trhist" class="trhist"></ol>'+
  '<p class="n2 center trlinks"><span class="lb" data-ko="다른 번역기" data-en="Other translators"></span>: <a href="https://translate.google.com/?sl=ko&tl=en&op=translate" target="_blank" rel="noopener">Google</a> · <a href="https://papago.naver.com/?sk=ko&tk=en" target="_blank" rel="noopener">Papago</a></p></div>';
 var $=function(s){return V.querySelector(s);};
 function labels(){[].forEach.call(V.querySelectorAll('.lb'),function(e){e.textContent=L(e.dataset.ko,e.dataset.en);});$('#trwrap').classList.toggle('flip',st.flip);}
 function live(t,on){var b=$('#trlive');if(!b)return;b.hidden=!on;b.querySelector('.lt').textContent=t||L('듣고 있어요…','Listening…');}
 function stopRec(){var r=st.rec;st.rec=null;clearTimeout(st.endT);clearTimeout(st.maxT);live('',false);if($('#trstop'))$('#trstop').hidden=true;
  [].forEach.call(V.querySelectorAll('.trmic'),function(b){b.classList.remove('on');});if(r&&r.live){if(LS&&LS.mic)LS.mic.pause(true);return;}if(r){r.onend=null;r.onresult=null;r.onerror=null;try{r.abort();}catch(e){}}}
 function hist(){var o=$('#trhist');o.innerHTML=st.hist.slice(0,20).map(function(h,i){return '<li><div class="'+(h.from==='ko'?'hk':'he')+'">'+esc(h.src)+'</div><div class="ht">'+esc(h.out)+'</div><button class="trstar" data-i="'+i+'" aria-label="save">'+(h.star?'⭐':'☆')+' '+esc(L('복습에 넣기','Save'))+'</button></li>';}).join('');
  [].forEach.call(o.querySelectorAll('.trstar'),function(b){b.onclick=function(){var h=st.hist[+b.dataset.i],en=h.from==='ko'?h.out:h.src,ko=h.from==='ko'?h.src:h.out;star(en,ko);h.star=1;save();hist();
   toast(L('⭐ 복습 목록에 넣었어요. 내일 「오늘 복습」에 나와요.','Saved for review.'));};});}
 function save(){try{sessionStorage.setItem('de100tr',JSON.stringify(st.hist.slice(0,20)));}catch(e){}}
 function toast(t){var n=$('#trnote');if(!n){n=document.createElement('div');n.id='trnote';n.className='n2 trnote';$('#trout').after(n);}n.textContent=t;}
 function next(from){if(!st.conv)return;var b=from==='ko'?$('#tren'):$('#trko'),o=from==='ko'?$('#trko'):$('#tren');o.classList.remove('next');b.classList.add('next');}
 function show(src,from,j,re){var to=from==='ko'?'en':'ko',out=j.translation,simple=j.simple||'';st.last={src:src,out:out,from:from,simple:simple};
  if(!re){st.hist.unshift({src:src,out:out,from:from});save();}hist();var o=$('#trout');
  if(from==='ko'){o.innerHTML='<div class="trsrc">🇰🇷 '+esc(src)+'</div><div class="trbig en">'+esc(out)+'</div>'+(simple?'<div class="trsimple">'+esc(L('더 쉽게','Simpler'))+': <b>'+esc(simple)+'</b></div>':'')+
    '<div class="trrow"><button id="tragain" class="big2">'+esc(L('🔁 다시 듣기','Play again'))+'</button><button id="trslow" class="big2">'+esc(L('🐢 천천히','Slower'))+'</button><button id="trrep" class="big2">'+esc(L('따라 말하기','Repeat after'))+'</button><button id="trsave" class="big2">'+esc(L('⭐ 복습에 넣기','Save'))+'</button></div><div id="trcmp"></div>';
   if(!re)say(out,'en',0.9,function(){next('ko');});
   $('#tragain').onclick=function(){say(out,'en',0.9);};$('#trslow').onclick=function(){say(out,'en',0.65);};
   $('#trrep').onclick=function(){repeat(out);};}
  else{o.innerHTML='<div class="trsrc">🇺🇸 '+esc(src)+'</div><div class="trbig ko">'+esc(out)+'</div><div class="trrow"><button id="tragain" class="big2">'+esc(L('🔁 다시 듣기','Play again'))+'</button><button id="trsave" class="big2">'+esc(L('⭐ 복습에 넣기','Save'))+'</button></div>';
   if(!re){if($('#trkosnd').checked)say(out,'ko',1,function(){next('en');});else next('en');}
   $('#tragain').onclick=function(){say(out,'ko',1);};}
  $('#trsave').onclick=function(){star(from==='ko'?out:src,from==='ko'?src:out);if(st.hist[0])st.hist[0].star=1;save();hist();toast(L('⭐ 복습 목록에 넣었어요. 내일 「오늘 복습」에 나와요.','Saved for review.'));};
  window.__trLast={src:src,out:out,from:from};}

 /* ---------- real-time path (Gemini Live translate): both directions pre-connected when the screen opens; any failure -> text path ---------- */
 function liveFlag(){var T=window.TALKS||{};for(var k in T){var t=T[k]&&(T[k].data||T[k]);if(t&&t.tutor)return !!t.tutor.live;}return !!(window.TALK&&window.TALK.tutor&&window.TALK.tutor.live);}
 var LS=null;st.lats=[];window.__trLive=st;
 function liveClose(){if(!LS)return;var l=LS;LS=null;try{l.mic&&l.mic.stop();}catch(e){}try{l.pl.stop();}catch(e){}['ko','en'].forEach(function(k){try{l.s[k]&&l.s[k].close();}catch(e){}});}
 function preconnect(){if(!U||!window.deLive||!deLive.supported()||!liveFlag()||LS)return;var t0=Date.now();
  deLive.tokens(U,{kind:'translate',sid:sid()}).then(function(j){if(!document.body.contains(V.querySelector('#trwrap')))return;
   LS={s:{},ready:{},pl:new deLive.Player(),mic:null,from:null,src:'',out:'',chunks:[],t0:t0,dbg:{chunks:0,maxRms:0,sent:0}};window.__LS=LS;
   [['ko','ko>en'],['en','en>ko']].forEach(function(p){var from=p[0],ses=new deLive.Session(j.ws,j.sessions[p[1]],{
     ready:function(){if(!LS)return;LS.ready[from]=true;window.__trLiveReadyMs=Date.now()-t0;},
     inTx:function(t){if(!LS||LS.from!==from)return;LS.src+=t;LS.lastIn=Date.now();liveDraw();},
     outTx:function(t){if(!LS||LS.from!==from)return;if(!LS.out&&LS.lastIn)st.lats.push(Date.now()-(LS.stopAt||Date.now()));LS.out+=t;liveDraw();if(!st.rec){clearTimeout(LS.fin);LS.fin=setTimeout(liveFinish,1600);}},
     audio:function(d){if(!LS||LS.from!==from)return;if(LS.firstAudio==null){LS.firstAudio=Date.now()-LS.startAt;window.__trFirstAudio=(window.__trFirstAudio||[]).concat([LS.firstAudio]);}
      LS.chunks.push(d);if(from==='ko'||$('#trkosnd').checked)LS.pl.play(d);},   /* the model streams audio (incl. silence) all the time: only text moves the finish timer */
     closed:function(code){if(LS){LS.ready[from]=false;LS.s[from]=null;window.__trLiveClose=code;}}});
    LS.s[from]=ses;ses.open();});
  }).catch(function(e){window.__trLiveFail=(e&&e.error)||'x';});}
 function liveReady(from){return !!(LS&&LS.ready[from]&&LS.s[from]&&LS.s[from].ready());}
 function liveDraw(){var o=$('#trout'),from=LS.from;o.innerHTML='<div class="trsrc">'+(from==='ko'?'🇰🇷 ':'🇺🇸 ')+esc(LS.src)+'</div><div class="trbig '+(from==='ko'?'en':'ko')+'">'+esc(LS.out||'…')+'</div>';}
 function liveListen(from){deLive.audio();stopRec();if(window.speechSynthesis)speechSynthesis.cancel();LS.pl.stop();clearTimeout(LS.fin);
  LS.from=from;LS.src='';LS.out='';LS.chunks=[];LS.firstAudio=null;LS.startAt=Date.now();LS.stopAt=0;LS.speech=false;LS.quiet=0;
  var btn=from==='ko'?$('#trko'):$('#tren');btn.classList.add('on');btn.classList.remove('next');$('#trstop').hidden=false;live('',true);st.recFrom=from;st.rec={live:true};
  st.done=liveStopMic;
  if(!LS.mic){LS.mic=new deLive.Mic(function(d,rms){if(!LS)return;LS.dbg.chunks++;LS.dbg.maxRms=Math.max(LS.dbg.maxRms,rms);if(!LS.from)return;var s=LS.s[LS.from];if(!s||!st.rec)return;s.sendAudio(d);LS.dbg.sent++;
    if(rms>0.01){LS.speech=true;LS.quiet=0;}else if(LS.speech){LS.quiet+=100;if(LS.quiet>=1200&&(LS.out||LS.quiet>=2500))liveStopMic();}
    if(Date.now()-LS.startAt>20000)liveStopMic();});
   LS.mic.start().catch(function(){stopRec();toast(L('마이크 사용이 막혀 있어요. 주소창 옆 🔒 → 마이크 허용을 눌러 주세요.','The microphone is blocked. Tap 🔒 next to the address and allow the microphone.'));});}
  else LS.mic.pause(false);
  $('#trout').innerHTML='<div class="trsrc">'+esc(L('듣고 있어요…','Listening…'))+'</div>';}
 function liveStopMic(){if(!LS||!st.rec)return;st.rec=null;LS.stopAt=Date.now();live('',false);$('#trstop').hidden=true;[].forEach.call(V.querySelectorAll('.trmic'),function(b){b.classList.remove('on');});
  var s=LS.s[LS.from],z=btoa(String.fromCharCode.apply(null,new Uint8Array(3200)));for(var i=0;i<8;i++)s&&s.sendAudio(z);   /* a little silence so the model finishes */
  LS.mic.pause(true);clearTimeout(LS.fin);LS.fin=setTimeout(liveFinish,LS.out?1600:3000);}
 function liveFinish(){if(!LS||st.rec)return;var from=LS.from,src=LS.src.trim(),out=LS.out.trim(),ch=LS.chunks.slice();if(!out){if(src)go(src,from);return;}
  st.hist.unshift({src:src,out:out,from:from});save();show(src,from,{translation:out},true);window.__trLast={src:src,out:out,from:from,live:true};
  var rp=function(rate){var p=new deLive.Player();p.rate=rate;ch.forEach(function(d){p.play(d);});};
  if($('#tragain'))$('#tragain').onclick=function(){rp(1);};if($('#trslow'))$('#trslow').onclick=function(){rp(0.8);};
  next(from);LS.from=null;}
 function go(text,from){text=(text||'').trim();if(!text)return;var to=from==='ko'?'en':'ko';$('#trout').innerHTML='<div class="trsrc">'+(from==='ko'?'🇰🇷 ':'🇺🇸 ')+esc(text)+'</div><div class="think">💭 '+esc(L('번역 중…','Translating…'))+'</div>';
  var t0=Date.now();translate(text,from,to).then(function(j){window.__trMs=Date.now()-t0;show(text,from,j);},function(e){$('#trout').innerHTML='<div class="trsrc">'+esc(text)+'</div><div class="warn">'+esc(errMsg(e))+'</div>';window.__trErr=(e&&e.error)||'x';});}
 function listen(lang){if(!U)return;stopRec();if(window.speechSynthesis)speechSynthesis.cancel();
  if(!SR){$('details.trtype').open=true;toast(L('이 휴대폰은 음성 인식이 안 돼요. 글로 써 주세요.','Speech input is not available here. Please type.'));return;}
  var from=lang,r=new SR(),fins=[],interim='',btn=from==='ko'?$('#trko'):$('#tren');st.rec=r;r.lang=from==='ko'?'ko-KR':'en-US';r.interimResults=true;r.continuous=true;r.maxAlternatives=1;
  btn.classList.add('on');btn.classList.remove('next');$('#trstop').hidden=false;live('',true);
  function text(){return fins.join(' ').replace(/\s+/g,' ').trim();}
  function done(){if(st.rec!==r)return;var t=(text()||interim).trim();stopRec();if(t)go(t,from);}
  st.done=done;
  r.onresult=function(ev){interim='';for(var i=ev.resultIndex;i<ev.results.length;i++){var x=ev.results[i][0].transcript.trim();if(ev.results[i].isFinal){var l=fins[fins.length-1];if(l&&x.toLowerCase().indexOf(l.toLowerCase())===0)fins[fins.length-1]=x;else if(x&&x!==l)fins.push(x);}else interim+=x+' ';}
   live((text()+' '+interim).trim(),true);clearTimeout(st.endT);st.endT=setTimeout(done,window.__trEndMs||1000);};
  r.onerror=function(ev){if(ev&&(ev.error==='not-allowed'||ev.error==='service-not-allowed')){stopRec();toast(L('마이크 사용이 막혀 있어요. 주소창 옆 🔒 → 마이크 허용을 눌러 주세요.','The microphone is blocked. Tap 🔒 next to the address and allow the microphone.'));}
   else if(ev&&ev.error==='no-speech'){stopRec();toast(L('잘 안 들렸어요. 다시 눌러 주세요.','I could not hear you. Please tap again.'));}};
  r.onend=function(){if(st.rec===r)done();};
  st.maxT=setTimeout(done,20000);
  try{r.start();window.__trListens=(window.__trListens||0)+1;window.__trLang=r.lang;}catch(e){stopRec();}}
 function repeat(target){if(!SR||!window.TK)return;stopRec();var r=new SR(),heard='';st.rec=r;r.lang='en-US';r.interimResults=true;r.continuous=false;live('',true);
  r.onresult=function(ev){heard='';for(var i=0;i<ev.results.length;i++)heard+=ev.results[i][0].transcript;live(heard,true);};
  r.onend=function(){st.rec=null;live('',false);var c=window.TK.colour(target,heard),pc=Math.round(100*c.score);
   $('#trcmp').innerHTML='<div class="cmp">'+c.html+'</div><p class="big">'+(pc>=80?'👍 ':'')+esc(L('맞힌 정도','Match'))+' '+pc+'%</p>';window.__trRepeat=pc;};
  r.onerror=function(){};try{r.start();}catch(e){}}
 $('#trko').onclick=function(){if(st.rec&&st.recFrom==='ko'){st.done&&st.done();return;}st.recFrom='ko';if(liveReady('ko'))liveListen('ko');else{listen('ko');preconnect();}};
 $('#tren').onclick=function(){if(st.rec&&st.recFrom==='en'){st.done&&st.done();return;}st.recFrom='en';if(liveReady('en'))liveListen('en');else{listen('en');preconnect();}};
 $('#trstop').onclick=function(){st.done&&st.done();};
 $('#trpause').onclick=function(){if(LS){if(st.rec&&st.rec.live)liveStopMic();LS.pl.stop();}stopRec();if(window.speechSynthesis)speechSynthesis.cancel();[].forEach.call(V.querySelectorAll('.trmic'),function(b){b.classList.remove('next');});};
 $('#trconv').onchange=function(){st.conv=this.checked;if(!st.conv)[].forEach.call(V.querySelectorAll('.trmic'),function(b){b.classList.remove('next');});};
 $('#trflip').onclick=function(){st.flip=!st.flip;labels();hist();if(st.last){var l=st.last;show(l.src,l.from,{translation:l.out,simple:l.simple},true);}window.__trFlip=st.flip;};
 $('#trsend').onclick=function(){var t=$('#trtx').value.trim();if(!t)return;go(t,/[가-힣]/.test(t)?'ko':'en');};
 labels();hist();preconnect();window.__trReady=1;
 window.addEventListener('hashchange',function h(){liveClose();stopRec();if(window.speechSynthesis)speechSynthesis.cancel();window.removeEventListener('hashchange',h);});};
})();
