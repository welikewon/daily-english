window.TALK_DEFER=1;
/* Talk practice page (one scene per day). Needs app.js (window.dePlay / stopAll) loaded first and window.TALK = scene data. */
/* shared kit (talk page + stuck-helper panel): matching, word colours, push-to-talk box, record & compare */
window.TK=(function(){
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
var $=function(s,r){return (r||document).querySelector(s);},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s));};
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
/* ---------- text matching ---------- */
var CONTR={"i'm":"i am","you're":"you are","it's":"it is","we're":"we are","they're":"they are","he's":"he is","she's":"she is","isn't":"is not","aren't":"are not","what's":"what is","let's":"let us","that's":"that is","don't":"do not","can't":"can not","i'll":"i will"};
function norm(s){s=String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]+/g,' ');
 return s.split(/\s+/).filter(Boolean).map(function(w){return CONTR[w]||w.replace(/'/g,'');}).join(' ').split(' ').filter(Boolean);}
function lev(a,b){var d=[],i,j;for(j=0;j<=b.length;j++)d[j]=j;for(i=1;i<=a.length;i++){var p=d[0];d[0]=i;for(j=1;j<=b.length;j++){var t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]!==b[j-1]?1:0));p=t;}}return d[b.length];}
function sim(a,b){var x=norm(a).sort().join(' '),y=norm(b).sort().join(' ');if(!x&&!y)return 1;return 1-lev(x,y)/Math.max(x.length,y.length,1);}
/* word colours: green exact (in order), yellow close, red missing */
function colour(target,heard){var tw=String(target).split(/\s+/),h=norm(heard),used={},out=[],g=0,y=0;
 tw.forEach(function(w){var n=norm(w),cls='r';
  if(n.length){var ok=n.every(function(p){var k=h.indexOf(p);while(k>=0&&used[k])k=h.indexOf(p,k+1);if(k>=0){used[k]=1;return true;}return false;});
   if(ok){cls='g';g++;}else{var best=9;n.forEach(function(p){h.forEach(function(q,k){if(!used[k])best=Math.min(best,lev(p,q)/Math.max(p.length,1));});});if(best<=0.34){cls='y';y++;}}}
  else{cls='g';g++;}
  out.push('<span class="w '+cls+'">'+esc(w)+'</span>');});
 return {html:out.join(' '),score:(g+0.5*y)/Math.max(tw.length,1)};}
function accepted(turn,heard){var s=0;(turn.accept||[]).forEach(function(a){s=Math.max(s,sim(a,heard));});
 var h=' '+norm(heard).join(' ')+' ';var key=(turn.keys||[]).some(function(k){return k.every(function(w){return h.indexOf(' '+norm(w).join(' ')+' ')>=0;});});
 return {ok:s>=0.6||key,score:s,key:key};}
/* ---------- speech in (one utterance, push to talk) ---------- */
var REC=null;
function barOn(lbl){document.body.classList.add('playing');var l=document.getElementById('plab');if(l)l.textContent=lbl;var g=document.getElementById('pprog');if(g)g.textContent='';var b=document.getElementById('pbar');if(b)b.style.setProperty('--m','#C62F55');}
function barOff(){if(!REC&&!(MR&&MR.state==='recording'))document.body.classList.remove('playing');}
function talkBox(opts){ /* opts: {target, onDone(text)} -> element with big buttons */
 var box=el('div','talkbox'),b=el('button','mic','🎤 말하기'),done=el('button','done','✋ 다 말했어요'),said=el('button','said','말했어요 · 넘어가기'),
     heard=el('div','heard'),typ=null;
 done.style.display='none';box.appendChild(b);box.appendChild(done);
 if(!SR){typ=el('input','typed');typ.placeholder='여기에 영어로 써도 돼요 (말하면서 써 보세요)';typ.setAttribute('autocapitalize','off');box.appendChild(typ);b.style.display='none';
  box.removeChild(done);var go=el('button','done','✔ 말했어요');go.style.display='inline-block';box.appendChild(go);go.onclick=function(){finish(typ.value||'');};}
 box.appendChild(said);box.appendChild(heard);
 var text='',alts=[];
 function finish(t){REC=null;barOff();b.style.display=SR?'':'none';done.style.display='none';b.classList.remove('on');opts.onDone(t||'',alts);}
 b.onclick=function(){try{window.stopAll&&stopAll();}catch(e){}
  text='';alts=[];var r=new SR();REC=r;r.lang='en-US';r.interimResults=true;r.maxAlternatives=3;r.continuous=false;
  r.onresult=function(ev){var f='',all=[];for(var i=0;i<ev.results.length;i++){f+=ev.results[i][0].transcript+' ';if(ev.results[i].isFinal){for(var k=0;k<ev.results[i].length;k++)all.push(ev.results[i][k].transcript);}}text=f.trim();alts=all;heard.textContent='들린 말: '+text;};
  r.onerror=function(ev){heard.textContent=(ev.error==='not-allowed'||ev.error==='service-not-allowed')?'마이크 사용이 막혀 있어요. 아래 「말했어요」로 넘어가도 돼요.':'잘 안 들렸어요. 다시 「말하기」를 눌러 보세요.';};
  r.onend=function(){if(REC===r)finish(best(text,alts));};
  try{r.start();}catch(e){heard.textContent='음성 인식을 시작하지 못했어요.';return;}
  barOn('🎤 듣고 있어요');b.style.display='none';done.style.display='inline-block';done.classList.add('on');heard.textContent='듣고 있어요… 말한 뒤 「다 말했어요」를 누르세요.';};
 done.onclick=function(){if(REC){try{REC.stop();}catch(e){finish(text);}}};
 said.onclick=function(){if(REC){var r=REC;REC=null;try{r.abort();}catch(e){}barOff();}opts.onDone(null,[]);};
 function best(t,a){if(!opts.target||!a.length)return t;var bs=t,bv=sim(opts.target,t);a.forEach(function(x){var v=sim(opts.target,x);if(v>bv){bv=v;bs=x;}});return bs;}
 return box;}
function abortAll(){var any=false;if(REC){var r=REC;REC=null;any=true;try{r.abort();}catch(e){}}if(MR&&MR.state==='recording'){any=true;try{MR.stop();}catch(e){}}if(any)document.body.classList.remove('playing');
 if(SR)$$('.talkbox .done').forEach(function(d){d.style.display='none';d.classList.remove('on');});$$('.talkbox .mic').forEach(function(m){if(SR)m.style.display='';});}
window.__talkAbort=abortAll;
if(!window.__talkG){window.__talkG=1;document.addEventListener('click',function(e){if(e.target.closest('#pstop')&&window.__talkAbort)window.__talkAbort();},true);
 window.addEventListener('pagehide',function(){if(window.__talkAbort)window.__talkAbort();});document.addEventListener('visibilitychange',function(){if(document.hidden&&window.__talkAbort)window.__talkAbort();});
 window.addEventListener('hashchange',function(){if(window.__talkAbort)window.__talkAbort();});}
/* ---------- record & compare (native, then me) ---------- */
var MR=null,STREAM=null;
function recBox(native){var w=el('div','recbox'),b=el('button','rec','🎙 내 목소리 녹음'),p=el('button','cmp','▶ 원어민 → 나 비교'),n=el('span','n2','');p.disabled=true;var url=null;
 if(!window.MediaRecorder||!navigator.mediaDevices){w.appendChild(el('span','n2','이 브라우저는 녹음을 지원하지 않아요.'));return w;}
 b.onclick=function(){if(MR&&MR.state==='recording'){MR.stop();return;}try{stopAll();}catch(e){}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){STREAM=s;var ch=[];MR=new MediaRecorder(s);MR.ondataavailable=function(e){if(e.data&&e.data.size)ch.push(e.data);};
   MR.onstop=function(){s.getTracks().forEach(function(t){t.stop();});if(ch.length){if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob(ch,{type:MR.mimeType||'audio/mp4'}));p.disabled=false;n.textContent='녹음 완료';}b.textContent='🎙 내 목소리 녹음';b.classList.remove('on');barOff();};
   MR.start();barOn('🎙 녹음 중');b.textContent='■ 녹음 끝';b.classList.add('on');n.textContent='말해 보세요…';}).catch(function(){n.textContent='마이크를 쓸 수 없어요.';});};
 p.onclick=function(){if(!url)return;dePlay(native,{label:'👂 원어민',onend:function(){dePlay(url,{label:'🗣 내 목소리'});}});};
 w.appendChild(b);w.appendChild(p);w.appendChild(n);return w;}

return {SR:SR,$:$,$$:$$,el:el,esc:esc,norm:norm,lev:lev,sim:sim,colour:colour,accepted:accepted,talkBox:talkBox,recBox:recBox,abortAll:abortAll};
})();
window.initTalk=function(){
var T=window.TALK,AU=T.audio_base,TA=T.talk_base;
var LOG=[]; /* {en, heard, score, step} */
window.__talk={log:LOG};
var K=window.TK,SR=K.SR,$=K.$,$$=K.$$,el=K.el,esc=K.esc,norm=K.norm,lev=K.lev,sim=K.sim,colour=K.colour,accepted=K.accepted,talkBox=K.talkBox,recBox=K.recBox,abortAll=K.abortAll;
/* ---------- steps ---------- */
var STEPS=$$('.tstep'),cur=0;
function go(i){cur=Math.max(0,Math.min(STEPS.length-1,i));STEPS.forEach(function(s,k){s.hidden=k!==cur;});
 $$('#prog li').forEach(function(li,k){li.classList.toggle('on',k===cur);li.classList.toggle('done',k<cur);});
 try{stopAll();}catch(e){}abortAll();window.scrollTo(0,0);if(STEPS[cur].dataset.k==='report')report();}
$$('[data-next]').forEach(function(b){b.onclick=function(){go(cur+1);};});$$('[data-prev]').forEach(function(b){b.onclick=function(){go(cur-1);};});
$$('#prog li').forEach(function(li,k){li.onclick=function(){go(k);};});
function rateOf(){return $('#slow').checked?0.8:1;}
function mark(){var K='de100talk',st=JSON.parse(localStorage.getItem(K)||'{}'),d=new Date(),t=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
 st.dates=st.dates||[];if(st.dates.indexOf(t)<0)st.dates.push(t);st.dates=st.dates.slice(-400);localStorage.setItem(K,JSON.stringify(st));streak();}
function log(step,en,heard,score){LOG.push({step:step,en:en,heard:heard,score:score});mark();}
/* game: tap-to-arrange blocks, then SAY it */
T.game.forEach(function(g,gi){var box=$('#game'),c=el('div','card gm');var blocks=g.blocks.map(function(b,i){return {t:b.en,ko:b.ko,i:i};});
 var sh=blocks.slice();for(var k=sh.length-1;k>0;k--){var j=(k*7+gi*3+1)%(k+1);var x=sh[k];sh[k]=sh[j];sh[j]=x;}
 if(sh.every(function(b,i){return b.i===i;}))sh.reverse();
 c.innerHTML='<div class="ko big">'+esc(g.ko)+'</div><div class="slots"></div><div class="pool"></div><div class="gres n2">한국어 뜻에 맞게 블록을 순서대로 누르세요.</div>';
 var slots=$('.slots',c),pool=$('.pool',c),res=$('.gres',c),got=[];
 sh.forEach(function(b){var t=el('button','blk',esc(b.t));t.onclick=function(){if(t.disabled)return;t.disabled=true;got.push(b);var s=el('span','blk in',esc(b.t));slots.appendChild(s);
   if(got.length===blocks.length){var ok=got.every(function(x,i){return x.i===i;});
    if(ok){res.innerHTML='<b class="okc">맞았어요!</b> 이제 <b>소리 내어</b> 말해 보세요.';var sayb=talkBox({target:g.en,onDone:function(h){var r=h==null?{score:0,html:esc(g.en)}:colour(g.en,h);sayr.innerHTML=r.html;log('game',g.en,h,h==null?null:r.score);}}),sayr=el('div','cmpw');
     var lb=el('button','lis','👂 듣기');lb.onclick=function(){dePlay(g.audio,{rate:rateOf(),label:'👂 듣기'});};res.appendChild(el('div','',''));res.lastChild.appendChild(lb);res.appendChild(sayb);res.appendChild(sayr);}
    else{res.innerHTML='<b class="ngc">순서가 조금 달라요.</b> ';var rb=el('button','','다시');rb.onclick=function(){got=[];slots.innerHTML='';$$('.blk',pool).forEach(function(x){x.disabled=false;});res.textContent='다시 눌러 보세요.';};res.appendChild(rb);}}};pool.appendChild(t);});
 box.appendChild(c);});
/* warm-up: listen (0.8x/1x), push to talk, colours, record & compare, tip */
T.warmup.forEach(function(w,i){var c=el('div','card wu');c.innerHTML='<div class="n2">문장 '+(i+1)+' / '+T.warmup.length+'</div><div class="ko big">'+esc(w.ko)+'</div><div class="en big">'+esc(w.en)+'</div>';
 var lb=el('button','lis','👂 듣기');lb.onclick=function(){dePlay(w.audio,{rate:rateOf(),label:'👂 듣기',btn:lb});};c.appendChild(lb);
 var cw=el('div','cmpw');c.appendChild(talkBox({target:w.en,onDone:function(h){if(h==null){cw.innerHTML='<span class="n2">괜찮아요. 다음에 다시 해 봐요.</span>';log('warmup',w.en,null,null);return;}var r=colour(w.en,h);
   cw.innerHTML=r.html+'<div class="n2">초록=맞음 · 노랑=비슷함 · 빨강=다시 들어 보기</div>';log('warmup',w.en,h,r.score);}}));
 c.appendChild(cw);c.appendChild(recBox(w.audio));if(w.tip_ko)c.appendChild(el('div','tip','💡 '+esc(w.tip_ko)));$('#warm').appendChild(c);});
/* role-swap dialogue */
function dialogue(me){var box=$('#dlg'),L=T.dialogue.lines;box.innerHTML='';
 box.appendChild(el('div','n2 rolehd','내 역할: <b>'+esc(me)+'</b> · 상대 대사는 소리로 나와요.'));
 var i=0;
 function step(){if(i>=L.length){var fin=el('div','card','<b>대화 끝!</b> ');var sw=el('button','big2',me===T.dialogue.learner_speaker?'🔄 역할 바꿔서 한 번 더':'🔄 처음 역할로 다시');sw.onclick=function(){dialogue(me===T.dialogue.learner_speaker?T.dialogue.other:T.dialogue.learner_speaker);};fin.appendChild(sw);box.appendChild(fin);return;}
  var l=L[i],c=el('div','card ln'+(l.speaker===me?' mine':''));c.innerHTML='<div class="who">'+esc(l.speaker)+'</div>';box.appendChild(c);
  if(l.speaker!==me){c.innerHTML+='<div class="en">'+esc(l.en)+'</div><div class="ko n2">'+esc(l.ko)+'</div>';var pb=el('button','lis','👂 다시 듣기');pb.onclick=function(){dePlay(l.audio,{rate:rateOf()});};c.appendChild(pb);
   i++;var nx=el('button','big2','다음 ▶');nx.onclick=function(){nx.remove();step();};c.appendChild(nx);dePlay(l.audio,{rate:rateOf(),label:'💬 '+l.speaker});return;}
  var hint=el('div','hint n2',''),lvl=0;c.innerHTML+='<div class="ko">'+esc(l.ko)+'</div><div class="n2">위 뜻을 영어로 말해 보세요.</div>';
  var hb=el('button','help','🙋 도와줘요');hb.onclick=function(){lvl++;
   if(lvl===1)hint.innerHTML='첫 단어: <b>'+esc(l.en.split(' ')[0])+'</b> …';
   else if(lvl===2)hint.innerHTML='첫 단어: <b>'+esc(l.en.split(' ')[0])+'</b> … · 뜻: '+esc(l.ko);
   else if(lvl===3){hint.innerHTML='<b>'+esc(l.en)+'</b>';dePlay(l.audio,{rate:rateOf(),label:'🙋 힌트'});}
   else{hint.innerHTML='<b>'+esc(l.en)+'</b><br>따라 말해 보세요.';dePlay(l.audio,{rate:rateOf(),label:'🙋 따라 말하기'});}};
  c.appendChild(hb);c.appendChild(hint);var cw=el('div','cmpw');
  c.appendChild(talkBox({target:l.en,onDone:function(h){var turn={accept:[l.en],keys:l.keys||[]};
    if(h==null){cw.innerHTML='<span class="n2">정답: </span><b>'+esc(l.en)+'</b>';log('dialogue',l.en,null,null);}
    else{var a=accepted(turn,h),r=colour(l.en,h);cw.innerHTML=(a.ok?'<b class="okc">좋아요!</b> ':'<b class="ngc">거의 다 왔어요.</b> ')+r.html;log('dialogue',l.en,h,r.score);}
    $$('.talkbox',c).forEach(function(x){x.remove();});hb.remove();i++;step();}}));c.appendChild(cw);}
 step();}
/* mini role-play with fallback + suggestions */
function roleplay(){var box=$('#rp'),R=T.roleplay,i=0;box.innerHTML='';
 function say(t,cb,label){dePlay(t,{label:label||'💬 '+T.partner.name,onend:cb});}
 function next(){if(i>=R.turns.length){var e=el('div','card ln','<div class="who">'+esc(T.partner.name)+'</div><div class="en">'+esc(R.end_en)+'</div><div class="ko n2">'+esc(R.end_ko)+'</div>');box.appendChild(e);say(R.end_audio);
   var nx=el('button','big2','정리 보기 ▶');nx.onclick=function(){go(cur+1);};box.appendChild(nx);return;}
  var t=R.turns[i],c=el('div','card turn');box.appendChild(c);var tries=0;
  if(t.partner_en){c.innerHTML='<div class="who">'+esc(T.partner.name)+'</div><div class="en">'+esc(t.partner_en)+'</div><div class="ko n2">'+esc(t.partner_ko)+'</div>';
   var rb=el('button','lis','👂 다시 듣기');rb.onclick=function(){say(t.partner_audio);};c.appendChild(rb);}
  c.appendChild(el('div','task','🎯 '+esc(t.task_ko)));var fb=el('div','fb'),cw=el('div','cmpw');
  function done(h){if(h==null){log('roleplay',t.accept[0],null,null);reply();return;}
   var a=accepted(t,h);cw.innerHTML='<span class="n2">들린 말:</span> '+esc(h||'(없음)');
   if(a.ok){log('roleplay',t.accept[0],h,Math.max(a.score,a.key?0.8:0));reply();return;}
   tries++;log('roleplay',t.accept[0],h,a.score);
   if(tries===1){fb.innerHTML='<div class="who">'+esc(T.partner.name)+'</div><div class="en">'+esc(R.fallback_en)+'</div><div class="ko n2">'+esc(R.fallback_ko)+'</div>';say(R.fallback_audio);}
   else{fb.innerHTML='<div class="n2">이렇게 말해 볼까요? 눌러서 듣고 따라 말해 보세요.</div>';(t.suggest||[0]).forEach(function(k,si){var sb=el('button','sug','🔊 '+esc(t.accept[k]));sb.onclick=function(){dePlay(t.suggest_audio[si],{rate:rateOf(),label:'🔊 이렇게 말해요'});};fb.appendChild(sb);});}}
  function reply(){$$('.talkbox',c).forEach(function(x){x.remove();});var r=el('div','card ln','<div class="who">'+esc(T.partner.name)+'</div><div class="en">'+esc(t.reply_en)+'</div><div class="ko n2">'+esc(t.reply_ko)+'</div>');box.appendChild(r);
   i++;var nx=el('button','big2','다음 ▶');nx.onclick=function(){nx.remove();next();};r.appendChild(nx);say(t.reply_audio);}
  c.appendChild(talkBox({target:t.accept[0],onDone:done}));c.appendChild(cw);c.appendChild(fb);
  if(t.partner_en)say(t.partner_audio);}
 next();}
/* report */
function report(){var spoken=LOG.filter(function(x){return x.heard!=null;}),sc=spoken.filter(function(x){return x.score!=null;});
 var by={};sc.forEach(function(x){if(!(x.en in by)||x.score>by[x.en])by[x.en]=x.score;});var ks=Object.keys(by);
 var best=ks.slice().sort(function(a,b){return by[b]-by[a];}).slice(0,3),worst=ks.slice().sort(function(a,b){return by[a]-by[b];}).filter(function(k){return best.indexOf(k)<0||ks.length<4;}).slice(0,3);
 var avg=sc.length?sc.reduce(function(s,x){return s+x.score;},0)/sc.length:0,stars=!spoken.length?1:avg>=0.8?3:avg>=0.5?2:1;
 var R=JSON.parse(localStorage.getItem('de100talk_retry')||'{}');R['d'+T.day]=worst;localStorage.setItem('de100talk_retry',JSON.stringify(R));
 $('#rep').innerHTML='<div class="stars">'+'★★★'.slice(0,stars)+'<span class="off">'+'★★★'.slice(stars)+'</span></div>'+
  '<div class="big">'+(stars===3?'아주 잘했어요!':stars===2?'잘하고 있어요!':'시작이 반이에요!')+'</div>'+
  '<p>오늘 소리 내어 말한 문장: <b>'+spoken.length+'</b>개</p>'+
  (best.length?'<h3>잘 말한 문장</h3><ul>'+best.map(function(k){return '<li>'+esc(k)+'</li>';}).join('')+'</ul>':'')+
  (worst.length?'<h3>내일 다시 말해 볼 문장 (저장했어요)</h3><ul>'+worst.map(function(k){return '<li>'+esc(k)+'</li>';}).join('')+'</ul>':'');
 window.__report={spoken:spoken.length,stars:stars,best:best,retry:worst};}
/* streak + calendar dots (last 14 days) */
function streak(){var st=JSON.parse(localStorage.getItem('de100talk')||'{}'),ds=st.dates||[],n=0,d=new Date();
 function key(x){return x.getFullYear()+'-'+('0'+(x.getMonth()+1)).slice(-2)+'-'+('0'+x.getDate()).slice(-2);}
 var x=new Date(d);if(ds.indexOf(key(x))<0)x.setDate(x.getDate()-1);while(ds.indexOf(key(x))>=0){n++;x.setDate(x.getDate()-1);}
 var dots='';for(var k=13;k>=0;k--){var y=new Date(d);y.setDate(d.getDate()-k);dots+='<i class="'+(ds.indexOf(key(y))>=0?'on':'')+'" title="'+key(y)+'"></i>';}
 $$('.streak').forEach(function(s){s.innerHTML='🔥 <b>'+n+'</b>일 연속 · <span class="dots">'+dots+'</span>';});window.__streak=n;}
/* AI prompt copy */
$('#copy').onclick=function(){var t=$('#prompt').value,ok=function(){$('#copied').textContent='복사했어요! 이제 아래 앱을 여세요.';};
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){fallback();});}else fallback();
 function fallback(){var a=$('#prompt');a.focus();a.select();try{document.execCommand('copy');ok();}catch(e){$('#copied').textContent='글을 길게 눌러 「복사」하세요.';}}};
/* device notes */
var ua=navigator.userAgent;if(/iPhone|iPad|iPod/.test(ua)&&/CriOS|FxiOS|EdgiOS|KAKAOTALK|NAVER|Instagram|FBAN/.test(ua))$('#safari').hidden=false;
if(!SR)$('#nosr').hidden=false;
$('#slow').onchange=function(){};
T.dialogue.other=T.dialogue.lines.filter(function(l){return l.speaker!==T.dialogue.learner_speaker;})[0].speaker;
$('#dlgstart').onclick=function(){dialogue(T.dialogue.learner_speaker);$('#dlgstart').remove();};
$('#rpstart').onclick=function(){roleplay();$('#rpstart').remove();};
streak();go(0);window.__talkReady=1;
};
if(window.TALK&&!window.TALK_DEFER)window.initTalk();
