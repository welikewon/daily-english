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
function pronTip(w){var P=window.PRON;if(!P||!P.rules)return null;var x=String(w).toLowerCase().replace(/[^a-z]/g,'');if(!x)return null;
 for(var i=0;i<P.order.length;i++){var r=P.rules[P.order[i]];if(r&&new RegExp(r.match).test(x))return {key:P.order[i],ko:r.ko};}return null;}
function colour(target,heard){var tw=String(target).split(/\s+/),h=norm(heard),used={},out=[],g=0,y=0,fr=null,fy=null;
 tw.forEach(function(w){var n=norm(w),cls='r';
  if(n.length){var ok=n.every(function(p){var k=h.indexOf(p);while(k>=0&&used[k])k=h.indexOf(p,k+1);if(k>=0){used[k]=1;return true;}return false;});
   if(ok){cls='g';g++;}else{var best=9;n.forEach(function(p){h.forEach(function(q,k){if(!used[k])best=Math.min(best,lev(p,q)/Math.max(p.length,1));});});if(best<=0.34){cls='y';y++;}}}
  else{cls='g';g++;}
  if(cls==='r'&&!fr)fr=w;if(cls==='y'&&!fy)fy=w;
  out.push('<span class="w '+cls+'">'+esc(w)+'</span>');});
 var tw0=fr||fy,tp=tw0?pronTip(tw0):null;window.__pronTip=tp&&tp.key;
 return {html:out.join(' ')+(tp?'<div class="ptip">💡 <b>'+esc(tw0.replace(/[^A-Za-z']/g,''))+'</b> — '+esc(tp.ko)+'</div>':''),score:(g+0.5*y)/Math.max(tw.length,1),tip:tp};}
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

return {pronTip:pronTip,SR:SR,$:$,$$:$$,el:el,esc:esc,norm:norm,lev:lev,sim:sim,colour:colour,accepted:accepted,talkBox:talkBox,recBox:recBox,abortAll:abortAll};
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
window.__aiLive=function(){return !!(window.TALK_AI_URL!=null?window.TALK_AI_URL:((T.tutor||{}).url));};
/* ---------- 자유 대화 (AI): hands-free call loop. proxy address from config; any failure -> the prepared role-play continues ---------- */
(function(){var TU=T.tutor||{},U=window.TALK_AI_URL!=null?window.TALK_AI_URL:(TU.url||''),box=$('#aichat');if(!box)return;
 if(!U){box.hidden=true;return;}box.hidden=false;if($('#ainone'))$('#ainone').hidden=true;
 if($('#aitr')&&/\/app\//.test(location.pathname))$('#aitr').setAttribute('href','#/tr');
 if(TU.provider&&TU.provider!=='GEMINI')$('#aipriv').textContent='AI와 대화할 때 이름·연락처 같은 개인 정보는 말하지 마세요.';
 var H=[],busy=false,n=0,MAX=30,log=$('#ailog'),sid=null,S={on:false,paused:false,rec:null,speaking:false,t0:0,turns:0,nat:[],wd:null,bargeFin:null,localN:0,rpI:0};window.__aiLoop=S;
 var END_MS=window.__aiEndMs||1500,TURN_MS=15000,NOSPEECH_MS=8000,TIMEOUT=window.__aiTimeout||10000;
 try{sid=sessionStorage.getItem('de100sid');}catch(e){}if(!sid){sid=Math.random().toString(36).slice(2,10)+Date.now().toString(36);try{sessionStorage.setItem('de100sid',sid);}catch(e){}}
 function hasKo(t){return /[가-힣]/.test(t||'');}
 function voices(cb){var ss=window.speechSynthesis;if(!ss)return cb();var v=ss.getVoices();if(v&&v.length)return cb();var done=false,go1=function(){if(!done){done=true;cb();}};
  try{ss.addEventListener('voiceschanged',go1);}catch(e){ss.onvoiceschanged=go1;}setTimeout(go1,1200);}
 function voice(lang){var v=(window.speechSynthesis&&speechSynthesis.getVoices())||[];
  if(lang==='ko')return v.filter(function(x){return /^ko/i.test(x.lang)&&/Google/i.test(x.name);})[0]||v.filter(function(x){return /^ko/i.test(x.lang);})[0]||null;
  var en=v.filter(function(x){return /^en[-_]US/i.test(x.lang);}),pref=/Google US English|Google|Natural|Neural|Samantha|Aria|Jenny|Ava|Allison/i;
  return en.filter(function(x){return pref.test(x.name);})[0]||en[0]||v.filter(function(x){return /^en/i.test(x.lang);})[0]||null;}
 function live(t,on){var b=$('#ailive');if(!b)return;b.hidden=!on;b.querySelector('.lt').textContent=t||'듣고 있어요… 말해 보세요 · Listening… speak now';}
 function stopListen(){var r=S.rec;S.rec=null;clearTimeout(S.endT);clearTimeout(S.maxT);live('',false);if(r){r.onend=null;r.onresult=null;r.onerror=null;try{r.abort();}catch(e){}}}
 /* speak: never listen while speaking; resume 400 ms after onend; fallback timer from text length (Samsung onend can be early or missing); tap = barge-in */
 function speak(t,then,lang){stopListen();clearTimeout(S.wd);var fired=false,ss=window.speechSynthesis;
  var fin=function(now){if(fired)return;fired=true;clearTimeout(S.wd);S.bargeFin=null;
   var wait=function(k){if(!now&&ss&&ss.speaking&&k<20){setTimeout(function(){wait(k+1);},200);return;}S.speaking=false;box.classList.remove('aispk');if(then)setTimeout(then,now?0:400);};wait(0);};
  if(!ss||!t){S.speaking=false;if(then)setTimeout(then,0);return;}try{stopAll();}catch(e){}ss.cancel();
  var u=new SpeechSynthesisUtterance(t),vv=voice(lang);u.lang=lang==='ko'?'ko-KR':'en-US';if(vv)u.voice=vv;u.rate=$('#aislow').checked?0.7:0.9;
  u.onend=function(){fin();};u.onerror=function(){fin();};S.speaking=true;box.classList.add('aispk');S.bargeFin=function(){ss.cancel();fin(true);};
  S.wd=setTimeout(function(){fin();},2000+t.length*95/u.rate);ss.speak(u);window.__aiSpoke=(window.__aiSpoke||0)+1;}
 /* listen: continuous recognition, our own end-of-speech timer (END_MS after the last words), max TURN_MS; Android repeats finals -> de-duplicate */
 function listen(){if(!S.on||S.paused||busy||S.speaking)return;
  if(!SR){var tb=talkBox({target:'',onDone:function(h){tb.remove();send(h==null||h===''?'(silent)':h);}});$('#aibox').innerHTML='';$('#aibox').appendChild(tb);return;}
  var r=new SR(),fins=[],interim='',alts=[],heardAny=false;S.rec=r;if(!S.t0)S.t0=Date.now();r.lang='en-US';r.interimResults=true;r.continuous=true;r.maxAlternatives=3;live('',true);
  function text(){return fins.join(' ').replace(/\s+/g,' ').trim();}
  function done(){if(S.rec!==r)return;var t=(text()+' '+(fins.length?'':interim)).trim();stopListen();if(!S.on||S.paused)return;
   if(t){S.t0=0;send(t,false,alts);return;}
   if(Date.now()-S.t0>=NOSPEECH_MS){S.t0=0;send('(silent)');return;}
   setTimeout(listen,250);}
  r.onresult=function(ev){heardAny=true;interim='';for(var i=ev.resultIndex;i<ev.results.length;i++){var res=ev.results[i],x=res[0].transcript.trim();
    if(res.isFinal){var last=fins[fins.length-1];if(last&&x.toLowerCase().indexOf(last.toLowerCase())===0)fins[fins.length-1]=x;else if(x&&x!==last)fins.push(x);
     alts=[];for(var k=1;k<res.length;k++)if(res[k].transcript)alts.push(res[k].transcript.trim());}
    else interim+=x+' ';}
   live((text()+' '+interim).trim(),true);clearTimeout(S.endT);S.endT=setTimeout(done,END_MS);};
  r.onerror=function(ev){if(ev&&(ev.error==='not-allowed'||ev.error==='service-not-allowed')){stopListen();$('#ainote').textContent='마이크 사용이 막혀 있어요. 주소창 옆 🔒 → 마이크 허용을 눌러 주세요. · The microphone is blocked: tap 🔒 next to the address and allow the microphone.';S.on=false;$('#aictl').hidden=true;$('#aistart').hidden=false;}};
  r.onend=function(){if(S.rec!==r)return;if(heardAny&&(text()||interim)){done();return;}S.rec=null;live('',false);if(!S.on||S.paused)return;
   if(Date.now()-S.t0>=NOSPEECH_MS){S.t0=0;send('(silent)');return;}setTimeout(listen,250);};   /* no-speech / aborted: start again */
  S.maxT=setTimeout(done,TURN_MS);
  try{r.start();window.__aiListens=(window.__aiListens||0)+1;}catch(e){S.rec=null;setTimeout(listen,400);}}
 function bubble(me,html){var c=el('div','card ln'+(me?' mine':''),html);log.appendChild(c);try{c.scrollIntoView({block:'nearest'});}catch(e){}return c;}
 function fallback(msg){S.on=false;stopListen();if(window.speechSynthesis)speechSynthesis.cancel();$('#aictl').hidden=true;$('#ainote').textContent=msg;window.__aiFallback=(window.__aiFallback||0)+1;
  setTimeout(function(){var k=STEPS.map(function(s){return s.dataset.k;}).indexOf('rp');go(k);if($('#rpstart'))$('#rpstart').click();},1500);}
 function show(j){var c=bubble(false,'<div class="who">'+esc(T.partner.name)+'</div><div class="en">'+esc(j.reply)+'</div><div class="ko n2">'+esc(j.reply_ko||'')+'</div>'+
   (j.natural?'<div class="tip">💡 이렇게 말하면 더 자연스러워요 · More natural: <b>'+esc(j.natural)+'</b></div>':'')+(j.tip_ko?'<div class="tip">'+esc(j.tip_ko)+'</div>':'')+'<div class="hints"></div><button class="again">🔁 다시 듣기 · Play again</button>');
  if(j.natural&&S.nat.indexOf(j.natural)<0)S.nat.push(j.natural);
  c.querySelector('.again').onclick=function(e){e.stopPropagation();if(!S.on)return;speak(j.reply,listen);};
  (j.hints||[]).forEach(function(h){var b=el('button','sug big2','🗣 '+esc(h.en)+'<br><span class="n2">'+esc(h.ko)+'</span>');
   b.onclick=function(e){e.stopPropagation();if(!S.on||busy)return;stopListen();bubble(true,'<div class="who">나 · Me</div><div class="en">'+esc(h.en)+'</div>');speak(h.en,function(){send(h.en,true);});};c.querySelector('.hints').appendChild(b);});
  speak(j.reply,listen);}
 /* the learner answered in Korean: show + say the English, then the learner repeats it (that English goes to the AI) */
 function koHelp(text,wait){var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ctl)ctl.abort();},6000);
  fetch(U.replace(/\/$/,'')+'/translate',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl?ctl.signal:undefined,body:JSON.stringify({text:text,from:'ko',to:'en',sid:sid})})
  .then(function(r){return r.json().then(function(j){return {s:r.status,j:j};});})
  .then(function(x){clearTimeout(tm);wait.remove();if(x.s!==200||!x.j.translation)throw 0;busy=false;if(!S.on)return;var en=x.j.simple||x.j.translation;window.__aiKoHelp=en;
   bubble(false,'<div class="tip big">🗣 이렇게 말하면 돼요 · Say it like this:<br><b class="en">'+esc(en)+'</b></div><p class="n2">따라 말해 보세요 · Now say it</p>');speak(en,listen);})
  .catch(function(){clearTimeout(tm);if(wait.parentNode)wait.remove();busy=false;talk(text);});}
 function local(){var ts=T.roleplay.turns.filter(function(t){return t.partner_en;});var t=ts[(S.rpI++)%Math.max(ts.length,1)];return t?{reply:t.partner_en,reply_ko:t.partner_ko||'',hints:(t.choices||t.hints||[]).slice(0,2)}:null;}
 function send(text,shown,alts){if(busy)return;if(n>=MAX){end('오늘 대화는 여기까지! 아주 잘했어요. · That is all for today. Great job!');return;}stopListen();
  if(text&&text!=='(silent)'){S.turns++;if(!shown)bubble(true,'<div class="who">나 · Me</div><div class="en">'+esc(text)+'</div>');}
  if(hasKo(text)&&text.length<=300){busy=true;koHelp(text,bubble(false,'<div class="n2">영어로 바꾸는 중… · Translating…</div>'));return;}
  talk(text,alts);}
 function talk(text,alts,retry){busy=true;n++;
  var wait=bubble(false,'<div class="n2 think">💭 생각 중… · Thinking…</div>');
  var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ctl)ctl.abort();},TIMEOUT);
  fetch(U.replace(/\/$/,'')+'/talk',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl?ctl.signal:undefined,
   body:JSON.stringify({day:T.day,scene_id:'d'+('00'+T.day).slice(-3),level:'A1',sid:sid,history:H.slice(-12),text:text,alts:(alts||[]).slice(0,2)})})
  .then(function(r){return r.json().catch(function(){return {};}).then(function(j){return {s:r.status,j:j};});})
  .then(function(x){clearTimeout(tm);busy=false;wait.remove();
   if(x.s===200&&x.j.reply&&x.j.hints){S.localN=0;if(text)H.push({role:'learner',text:text});H.push({role:'partner',text:x.j.reply});if(S.on)show(x.j);return;}
   if(x.s===429&&x.j.error==='session')return fallback('이번 AI 대화는 여기까지예요. 준비된 대화 연습으로 이어 갈게요.');
   if(x.s===429&&x.j.error==='daily')return fallback('오늘 쓸 수 있는 무료 AI 대화를 다 썼어요. 준비된 대화 연습으로 이어 갈게요. 내일 다시 AI와 대화할 수 있어요.');
   if(x.s===503)return fallback('준비된 대화 연습으로 이어 갈게요.');
   throw 0;})
  .catch(function(){clearTimeout(tm);busy=false;if(wait.parentNode)wait.remove();if(!S.on)return;
   if(!retry){n--;talk(text,alts,true);return;}          /* slow or failed: try once more */
   S.localN++;var l=S.localN<=2?local():null;if(!l)return fallback('준비된 대화 연습으로 이어 갈게요.');   /* then a prepared line keeps the call going */
   window.__aiLocal=(window.__aiLocal||0)+1;H.push({role:'partner',text:l.reply});if(!l.hints.length)l.hints=[{en:'Yes.',ko:'네.'},{en:'Sorry, one more time, please.',ko:'죄송해요, 한 번 더요.'}];
   l.hints=l.hints.map(function(h){return typeof h==='string'?{en:h,ko:''}:{en:h.en||h.text||'',ko:h.ko||''};});show(l);});}
 function end(msg){S.on=false;stopListen();if(window.speechSynthesis)speechSynthesis.cancel();S.speaking=false;$('#aictl').hidden=true;
  var s=$('#aisum');s.hidden=false;s.innerHTML='<h3>📞 통화 끝 · Call ended</h3><p class="big">오늘 AI와 <b>'+S.turns+'번</b> 주고받았어요.</p>'+
   (S.nat.length?'<p>💡 이렇게 말하면 더 자연스러워요 · More natural</p><ul>'+S.nat.slice(0,3).map(function(x){return '<li><b>'+esc(x)+'</b></li>';}).join('')+'</ul>':'')+'<button id="aitmrw" class="big2">👍 내일 또 해요 · See you tomorrow</button>';
  if(msg)$('#ainote').textContent=msg;window.__aiSummary=S.turns;$('#aistart').hidden=false;
  $('#aitmrw').onclick=function(){s.hidden=true;if(location.hash.indexOf('#/')===0)location.hash='#/';else window.scrollTo(0,0);};}
 $('#aistart').onclick=function(){$('#aistart').hidden=true;$('#aictl').hidden=false;$('#aisum').hidden=true;S.on=true;S.paused=false;S.turns=0;S.nat=[];S.localN=0;
  if(window.speechSynthesis){try{var w=new SpeechSynthesisUtterance(' ');w.volume=0;speechSynthesis.speak(w);}catch(e){}}   /* warm-up inside the tap (first-turn silence on some phones) */
  voices(function(){var o=T.roleplay.turns.filter(function(t){return t.partner_en;})[0];S.rpI=1;
   if(o){bubble(false,'<div class="who">'+esc(T.partner.name)+'</div><div class="en">'+esc(o.partner_en)+'</div><div class="ko n2">'+esc(o.partner_ko||'')+'</div>');H.push({role:'partner',text:o.partner_en});speak(o.partner_en,listen);}
   else talk('');});};
 $('#aipause').onclick=function(){if(!S.on)return;S.paused=!S.paused;this.textContent=S.paused?'▶ 이어서 · Resume':'⏸ 잠깐 멈춤 · Pause';
  if(S.paused){stopListen();if(window.speechSynthesis)speechSynthesis.cancel();S.speaking=false;box.classList.remove('aispk');}else{S.t0=0;listen();}};
 $('#aiend').onclick=function(){end();};
 $('#aiko').onchange=function(){log.classList.toggle('noko',!this.checked);};
 /* barge-in: tap anywhere on the call card while the AI speaks -> stop the voice and listen now */
 box.addEventListener('click',function(e){if(!S.on||!S.speaking||!S.bargeFin)return;if(e.target.closest('button,input,label,a,summary'))return;window.__aiBarge=(window.__aiBarge||0)+1;S.bargeFin();},true);
 if(!window.__aiG){window.__aiG=1;document.addEventListener('click',function(e){if(e.target.closest('#pstop')&&window.speechSynthesis)speechSynthesis.cancel();},true);
  window.addEventListener('hashchange',function(){if(window.speechSynthesis)speechSynthesis.cancel();var L=window.__aiLoop;if(L&&L.on){L.on=false;L.speaking=false;var r=L.rec;L.rec=null;if(r){r.onend=null;try{r.abort();}catch(e){}}}});}
})();
streak();go(0);window.__talkReady=1;
};
if(window.TALK&&!window.TALK_DEFER)window.initTalk();
