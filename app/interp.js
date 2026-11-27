/* 바로 통역 v2 · Live interpreter (#/tr) + 말할 내용 준비 (#/tr/prep) + window.deTR / window.deStars helpers.
   Real-time voice (live translate) when available, else phone recognition + our proxy /translate. Everything said is kept ONLY on this phone. */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function aiUrl(){if(window.TALK_AI_URL!=null)return window.TALK_AI_URL;var T=window.TALKS||{};for(var k in T){var t=T[k]&&(T[k].data||T[k]);if(t&&t.tutor&&t.tutor.url)return t.tutor.url;}
 var one=window.TALK;return one&&one.tutor&&one.tutor.url||'';}
function liveFlag(){var T=window.TALKS||{};for(var k in T){var t=T[k]&&(T[k].data||T[k]);if(t&&t.tutor)return !!t.tutor.live;}return !!(window.TALK&&window.TALK.tutor&&window.TALK.tutor.live);}
function sid(){var s=null;try{s=sessionStorage.getItem('de100sid');}catch(e){}if(!s){s=Math.random().toString(36).slice(2,10)+Date.now().toString(36);try{sessionStorage.setItem('de100sid',s);}catch(e){}}return s;}
function post(path,body,ms){var U=aiUrl();if(!U)return Promise.reject({error:'off'});var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ctl)ctl.abort();},ms||9000);
 return fetch(U.replace(/\/$/,'')+path,{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl?ctl.signal:undefined,body:JSON.stringify(body)})
  .then(function(r){return r.json().catch(function(){return {};}).then(function(j){clearTimeout(tm);if(r.status===200)return j;throw {error:j.error||('http'+r.status),status:r.status};});},function(){clearTimeout(tm);throw {error:'network'};});}
function translate(text,from,to,style){return post('/translate',{text:text,from:from,to:to,sid:sid(),style:style||prefs().style},9000).then(function(j){if(j.translation)return j;throw {error:'empty'};});}
function voice(lang){var v=(window.speechSynthesis&&speechSynthesis.getVoices())||[],re=(lang==='ko')?(/^ko/i):(/^en[-_]US/i);var c=v.filter(function(x){return re.test(x.lang);});
 return c.filter(function(x){return /Google/i.test(x.name);})[0]||c[0]||null;}
function say(t,lang,rate,cb){var ss=window.speechSynthesis;if(!ss||!t){cb&&cb();return;}try{window.stopAll&&stopAll();}catch(e){}ss.cancel();
 var u=new SpeechSynthesisUtterance(t),v=voice(lang);u.lang=lang==='ko'?'ko-KR':'en-US';if(v)u.voice=v;u.rate=rate||0.9;var done=false,fin=function(){if(!done){done=true;cb&&cb();}};
 u.onend=fin;u.onerror=fin;setTimeout(fin,2500+t.length*110/u.rate);ss.speak(u);window.__trSpoke=(window.__trSpoke||[]).concat([lang+':'+t]);}
function errMsg(e){if(e&&e.status===429)return '오늘 쓸 수 있는 무료 통역을 다 썼어요. 내일 다시 쓸 수 있어요. · Today\'s free translations are used up. Try again tomorrow.';
 if(e&&(e.error==='off'||e.status===503))return '지금은 통역을 쓸 수 없어요. · The interpreter is off right now.';
 return '연결이 느려요. 다시 눌러 주세요. · The connection is slow. Please try again.';}
window.deTR={url:aiUrl,translate:translate,say:say,err:errMsg};
/* ---------- saved sentences (⭐) feed the daily review ---------- */
function stars(){try{return JSON.parse(localStorage.getItem('de100star')||'[]');}catch(e){return [];}}
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function star(en,ko){var L=stars();if(L.some(function(x){return x.en===en;}))return false;L.unshift({en:en,ko:ko,saved:today()});localStorage.setItem('de100star',JSON.stringify(L.slice(0,200)));return true;}
window.deStars=stars;
/* ---------- phone-only storage ---------- */
function ld(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function prefs(){var p=ld('de100trp',{});p.style=p.style||{ko:'haeyo',en:'casual'};return p;}
function setPref(k,v){var p=prefs();p[k]=v;sv('de100trp',p);}
function talks(){return ld('de100talks',[]);}
function saveTalks(L){L.sort(function(a,b){return b.updated-a.updated;});sv('de100talks',L.slice(0,30));}
function fmtDate(t){var d=new Date(t);return (d.getMonth()+1)+'/'+d.getDate()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function copy(t,ok){function fb(){var a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{a.setSelectionRange(0,t.length);}catch(x){}var r=false;try{r=document.execCommand('copy');}catch(x){}a.remove();ok&&ok(r);}
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){ok&&ok(true);},fb);return;}}catch(e){}fb();}
var CSS_ON=false;
/* ---------- church / mission phrasebook (our own sentences) ---------- */
var PB=[['👋 인사 · Greetings',[['우리 교회에 오신 것을 환영해요.','Welcome to our church.'],['만나서 정말 반가워요.','It is so nice to meet you.'],['저는 이 교회 성도예요.','I am a member of this church.'],['편하게 지내세요.','Please make yourself at home.']]],
 ['✈ 공항 · Airport',[['비행은 어떠셨어요?','How was your flight?'],['짐은 이게 다예요?','Is this all your luggage?'],['차는 밖에 있어요. 따라오세요.','The car is outside. Please follow me.'],['교회까지 한 시간쯤 걸려요.','It takes about an hour to the church.']]],
 ['🍚 식사 · Meals',[['식사 준비됐어요. 같이 드세요.','The meal is ready. Please eat with us.'],['못 드시는 음식이 있어요?','Is there any food you cannot eat?'],['이건 조금 매워요.','This is a little spicy.'],['더 드릴까요?','Would you like some more?']]],
 ['🛏 숙소 · Lodging',[['여기가 묵으실 방이에요.','This is your room.'],['화장실은 복도 끝에 있어요.','The restroom is at the end of the hall.'],['와이파이 비밀번호는 이거예요.','Here is the Wi-Fi password.'],['밤 열 시 이후에는 조용히 해 주세요.','Please keep quiet after ten at night.']]],
 ['⛪ 예배 · Worship',[['예배는 오전 열한 시에 시작해요.','The service starts at eleven a.m.'],['앞에 나와서 인사해 주시겠어요?','Could you come to the front and say hello?'],['통역해 드릴게요.','I will interpret for you.'],['함께 기도해요.','Let us pray together.']]],
 ['🤒 아플 때 · When sick',[['어디가 아프세요?','Where does it hurt?'],['약국에 같이 가요.','Let us go to the pharmacy together.'],['병원에 가야 할 것 같아요.','I think we need to go to the hospital.'],['물 좀 드릴까요?','Can I get you some water?']]],
 ['🗺 길 · Directions',[['길을 잃으셨어요?','Are you lost?'],['저를 따라오세요.','Please follow me.'],['여기서 기다려 주세요.','Please wait here.'],['몇 시에 다시 만날까요?','What time shall we meet again?']]],
 ['🙏 작별 · Goodbye',[['와 주셔서 정말 고마워요.','Thank you so much for coming.'],['기도할게요.','I will pray for you.'],['조심히 가세요.','Have a safe trip.'],['또 만나요.','See you again.']]]];
/* =================================================================== interpreter screen */
window.interpScreen=function(V,back,sub){if(sub==='prep')return prepScreen(V,back);
 var U=aiUrl(),P=prefs(),flip=false;
 function L(ko,en){var m=String(ko).match(/^([^\w가-힣]+)\s*/),ic=m?m[1]:'';ko=String(ko).slice(m?m[0].length:0);return flip?ic+en+' · '+ko:ic+ko+' · '+en;}
 /* current conversation: latest one if used in the last 6 hours, else a new one */
 var all=talks(),cur=all[0]&&(Date.now()-all[0].updated<6*3600e3)&&all[0].lines.length?all[0]:null,resumed=!!cur;
 if(!cur)cur={id:uid(),title:'',created:Date.now(),updated:Date.now(),lines:[]};
 function persist(){if(!cur.lines.length&&!cur.title)return;cur.updated=Date.now();if(!cur.title)cur.title=fmtDate(cur.created)+' 대화';var L2=talks().filter(function(t){return t.id!==cur.id;});L2.push(cur);saveTalks(L2);}
 var AUD={};   /* live audio of this visit, per line, for exact replay */
 V.innerHTML='<header class="atop"><a class="aback" id="trback" href="'+(back||'#/')+'">← <span class="lb" data-ko="뒤로" data-en="Back"></span></a><div class="k">웰컴 잉글리시 100</div><h1 class="lb" data-ko="🗣 바로 통역" data-en="Live interpreter"></h1></header>'+
  '<div id="trwrap" class="trv2">'+(U?'':'<div class="card warn">지금은 통역을 쓸 수 없어요. · The interpreter is not available.</div>')+
  '<div class="trtools"><button id="trpb" class="tb lb" data-ko="📖 자주 쓰는 말" data-en="Phrases"></button><a id="trprep" class="tb lb" href="#/tr/prep" data-ko="📝 말할 내용 준비" data-en="Prepare"></a><button id="trmorebtn" class="tb lb" data-ko="⋯ 더보기" data-en="More"></button></div>'+
  '<div id="trscroll" class="trscroll"><div id="trres" class="trres" hidden></div><div id="trchat" class="trchat" aria-live="polite"></div>'+
  '<div id="trlive" class="trlive2" hidden><div class="lvh"></div><div class="lvt"></div><div class="lvo"></div></div></div>'+
  '<div id="trmore" class="trmore" hidden><div class="trmg"><button id="trlist" class="tb lb" data-ko="📋 대화 목록" data-en="Conversations"></button><button id="trnew" class="tb lb" data-ko="➕ 새 대화" data-en="New talk"></button><button id="trf2f" class="tb lb" data-ko="👥 마주 보기" data-en="Face to face"></button><button id="trflip" class="tb lb" data-ko="🔄 상대에게 보여주기" data-en="Show to partner"></button><button id="trset" class="tb lb" data-ko="⚙ 통역 설정" data-en="Interpreter settings"></button><button id="trclear" class="tb lb" data-ko="🗑 모두 지우기" data-en="Clear all"></button></div>'+
  '<details class="trtype"><summary class="lb" data-ko="✍ 글로 쓰기" data-en="Type instead"></summary><textarea id="trtx" rows="3"></textarea><div class="trrow"><button id="trsendk" class="big2 lb" data-ko="한국어 → 영어" data-en="Korean → English"></button><button id="trsende" class="big2 lb" data-ko="영어 → 한국어" data-en="English → Korean"></button></div></details>'+
  '<p class="n2 lb" data-ko="말한 내용은 번역을 위해 구글 AI로 보내져요. 대화 기록은 이 휴대폰에만 저장돼요." data-en="Your words go to Google AI for translation. The transcript is kept only on this phone."></p>'+
  '<p class="n2 center trlinks"><span class="lb" data-ko="다른 번역기" data-en="Other translators"></span>: <a href="https://translate.google.com/?sl=ko&tl=en&op=translate" target="_blank" rel="noopener">Google</a> · <a href="https://papago.naver.com/?sk=ko&tk=en" target="_blank" rel="noopener">Papago</a></p></div>'+
  '<div id="trdock" class="trdock"><div id="trstatus" class="trstatus" hidden></div>'+
  '<div class="trbar"><button id="trko" class="trmic ko lb" data-ko="🇰🇷 한국어로 말하기" data-en="Speak Korean"></button><button id="trauto" class="trmic au lb" hidden data-ko="🎤 자동" data-en="Auto"></button><button id="tren" class="trmic en lb" data-ko="🇺🇸 영어로 말하기" data-en="Speak English"></button>'+
  '<button id="trdone" class="trdone lb" hidden data-ko="■ 다 했어요" data-en="Done"></button></div></div></div>'+
  '<div id="trov" class="trov" hidden></div>';
 var $=function(s){return V.querySelector(s);},$$=function(s){return [].slice.call(V.querySelectorAll(s));};
 function labels(){$$('.lb').forEach(function(e){var t=L(e.dataset.ko,e.dataset.en);if(e.classList.contains('trmic')||e.classList.contains('trdone')){var i=t.indexOf(' · ');e.innerHTML=esc(t.slice(0,i))+'<small>'+esc(t.slice(i+3))+'</small>';}else e.textContent=t;});}
 function status(t){var s=$('#trstatus');if(!s)return;s.hidden=!t;s.textContent=t||'';fit();}
 function toast(t){status(t);clearTimeout(toast.t);toast.t=setTimeout(function(){status('');},4500);}
 /* ---------- chat ---------- */
 function bubble(l){var me=l.who==='me',toEn=l.from==='ko';
  return '<div class="tb2 '+(me?'me':'pt')+(l.pending?' pend':'')+'" data-id="'+l.id+'"><div class="src">'+(toEn?'🇰🇷 ':'🇺🇸 ')+esc(l.src)+'</div><div class="out '+(toEn?'en':'ko')+'">'+esc(l.out||'…')+'</div>'+
   (l.back?'<div class="back">↩ '+esc(L('상대에게 이렇게 전달돼요','They hear'))+': '+esc(l.back)+'</div>':'')+(l.pending?'<button class="retry">'+esc(L('🔁 다시 시도','Retry'))+'</button>':'')+
   (l.out&&!l.pending?'<div class="qa"><button class="qplay">'+esc(L('🔊 듣기','Play'))+'</button><button class="qcopy">'+esc(L('📋 복사','Copy'))+'</button></div>':'')+
   '<div class="tm">'+fmtDate(l.t)+(l.star?' ⭐':'')+'</div></div>';}
 function draw(keepScroll){var c=$('#trchat');c.innerHTML=cur.lines.length?cur.lines.map(bubble).join(''):'<p class="n2 trempty">'+esc(L('아래 버튼을 누르고 말하세요. 다 말하면 「다 했어요」를 누르세요.','Tap a button below and speak. Tap Done when you finish.'))+'</p>';
  fit();if(!keepScroll)toEnd();window.__trLines=cur.lines.length;}
 function line(id){return cur.lines.filter(function(l){return l.id===id;})[0];}
 function addLine(l){l.id=l.id||uid();l.t=l.t||Date.now();cur.lines.push(l);persist();draw();return l;}
 function upd(){var sc=$('#trscroll'),nb=sc&&sc.scrollHeight-sc.scrollTop-sc.clientHeight<260;persist();draw(true);if(nb)toEnd();}
 /* bubble actions: tap = menu, long-press = menu with delete */
 var pressT=null;
 $('#trchat').addEventListener('click',function(e){var b=e.target.closest('.tb2');if(!b)return;var l=line(b.dataset.id);if(!l)return;if(e.target.closest('.retry')){retry(l);return;}
  if(e.target.closest('.qcopy')){copy(l.out,function(ok){toast(ok?L('📋 복사했어요. 카톡·왓츠앱에 붙여 넣으세요.','Copied. Paste it into your chat app.'):L('복사가 안 됐어요. 글을 길게 눌러 복사하세요.','Copy failed. Long-press the text to copy.'));});return;}
  if(e.target.closest('.qplay')){play(l);return;}menu(l);});
 $('#trchat').addEventListener('touchstart',function(e){var b=e.target.closest('.tb2');if(!b)return;pressT=setTimeout(function(){var l=line(b.dataset.id);if(l)menu(l,true);},650);},{passive:true});
 ['touchend','touchmove','touchcancel'].forEach(function(n){$('#trchat').addEventListener(n,function(){clearTimeout(pressT);},{passive:true});});
 function rescue(){var m=V.querySelector('#trov #trmore');if(m){m.hidden=true;$('#trwrap').appendChild(m);}}
 function fit(){var sc=$('#trscroll'),d=$('#trdock');if(!sc||!d||!document.body.contains(sc))return;window.scrollTo(0,0);var h=window.innerHeight-sc.getBoundingClientRect().top-d.offsetHeight-8;sc.style.height=Math.max(150,h)+'px';if(T)toEnd();}
 function toEnd(){var sc=$('#trscroll');if(sc)sc.scrollTop=sc.scrollHeight;}
 function ov(html){rescue();var o=$('#trov');o.innerHTML='<div class="trsheet">'+html+'</div>';o.hidden=false;o.onclick=function(e){if(e.target===o)closeOv();};return o;}
 function closeOv(){rescue();var o=$('#trov');if(o){o.hidden=true;o.innerHTML='';}}
 function outLang(l){return l.from==='ko'?'en':'ko';}
 function play(l,rate){var a=AUD[l.id];if(a&&a.length&&window.deLive&&(rate||1)===1){deLive.audio();var p=new deLive.Player();p.rate=rate||1;a.forEach(function(d){p.play(d);});return;}say(l.out,outLang(l),outLang(l)==='en'?(rate||0.9):1);}
 function menu(l,del){var en=outLang(l)==='en';
  var o=ov('<div class="shq">'+esc(l.out)+'</div>'+
   '<button data-a="play">'+esc(L('🔊 다시 듣기','Play again'))+'</button>'+(en?'<button data-a="slow">'+esc(L('🐢 천천히','Slower'))+'</button><button data-a="rep">'+esc(L('🗣 따라 말하기','Repeat after'))+'</button>':'')+
   '<button data-a="show">'+esc(L('🔄 상대에게 보여주기','Show'))+'</button><button data-a="edit">'+esc(L('✏ 고치기','Edit'))+'</button><button data-a="again">'+esc(L('🎤 다시 말하기','Say again'))+'</button>'+
   '<button data-a="star">'+esc(L('⭐ 복습에 넣기','Save'))+'</button><button data-a="copy">'+esc(L('📋 복사','Copy'))+'</button><button data-a="del" class="'+(del?'hot':'')+'">'+esc(L('🗑 지우기','Delete'))+'</button><button data-a="x">'+esc(L('닫기','Close'))+'</button>');
  o.querySelector('.trsheet').onclick=function(e){var b=e.target.closest('[data-a]');if(!b)return;var a=b.dataset.a;
   if(a==='play')play(l);else if(a==='slow')play(l,0.7);else if(a==='rep'){closeOv();repeatAfter(l.out);}else if(a==='show'){show(l.out,outLang(l));}else if(a==='edit')edit(l);
   else if(a==='again'){cur.lines=cur.lines.filter(function(x){return x!==l;});upd();closeOv();startTurn(l.from);}
   else if(a==='star'){var e2=l.from==='ko'?l.out:l.src,k2=l.from==='ko'?l.src:l.out;star(e2,k2);l.star=1;upd();closeOv();toast(L('⭐ 복습 목록에 넣었어요.','Saved for review.'));}
   else if(a==='copy'){copy(l.out,function(ok){toast(ok?L('📋 복사했어요.','Copied.'):L('복사가 안 됐어요. 글을 길게 눌러 복사하세요.','Copy failed. Long-press the text to copy.'));});closeOv();}
   else if(a==='del'){cur.lines=cur.lines.filter(function(x){return x!==l;});upd();closeOv();}else if(a==='x')closeOv();};}
 function edit(l){var o=ov('<b>'+esc(L('들린 말 고치기','Fix what was heard'))+'</b><textarea id="tredt" rows="3">'+esc(l.src)+'</textarea><button data-a="go" class="hot">'+esc(L('다시 번역하기','Translate again'))+'</button><button data-a="x">'+esc(L('닫기','Close'))+'</button>');
  o.querySelector('.trsheet').onclick=function(e){var b=e.target.closest('[data-a]');if(!b)return;if(b.dataset.a==='x'){closeOv();return;}
   var t=o.querySelector('#tredt').value.trim();if(!t)return;l.src=t;l.out='';l.back='';delete AUD[l.id];closeOv();upd();textTurn(l);};}
 function show(t,lang){var o=ov('<div class="shbig '+lang+'">'+esc(t)+'</div><button data-a="rot">'+esc(L('🔄 돌리기','Rotate'))+'</button><button data-a="x">'+esc(L('닫기','Close'))+'</button>');o.classList.add('full');
  o.querySelector('.trsheet').onclick=function(e){var b=e.target.closest('[data-a]');if(!b)return;if(b.dataset.a==='rot')o.querySelector('.shbig').classList.toggle('rot');else{o.classList.remove('full');closeOv();}};}
 function repeatAfter(t){say(t,'en',0.85,function(){if(!SR){toast(L('🗣 이제 따라 말해 보세요.','Now you say it.'));return;}toast(L('🎤 이제 따라 말해 보세요…','Now you say it…'));
  var r=new SR();r.lang='en-US';r.interimResults=false;r.onresult=function(e){var h=e.results[0][0].transcript.toLowerCase().replace(/[^a-z' ]/g,'').split(/\s+/),w=t.toLowerCase().replace(/[^a-z' ]/g,'').split(/\s+/).filter(Boolean),k=w.filter(function(x){return h.indexOf(x)>=0;}).length,pc=Math.round(100*k/Math.max(1,w.length));
   window.__trRepeat=pc;toast(pc>=70?L('👍 잘 알아들었어요 ('+pc+'%)','Understood ('+pc+'%)'):L('🔁 다시 해 봐요 ('+pc+'%)','Try again ('+pc+'%)'));};try{r.start();}catch(e){}});}
 /* ---------- live sessions (two directions, pre-connected; one shared mic) ---------- */
 var LS={s:{},ready:{},dead:false,connecting:null},mic=null,T=null,Q=[];
 var canLive=!!(U&&window.deLive&&deLive.supported()&&liveFlag());
 function connect(){if(!canLive||LS.dead)return Promise.reject({error:'nolive'});if(LS.connecting)return LS.connecting;
  var t0=Date.now();LS.connecting=deLive.tokens(U,{kind:'translate',sid:sid(),style:prefs().style}).then(function(j){
   return new Promise(function(res,rej){var n=0,done=false;[['ko','ko>en'],['en','en>ko']].forEach(function(p){var from=p[0];
    var s=new deLive.Session(j.ws,j.sessions[p[1]],{ready:function(){LS.ready[from]=true;window.__trLiveReadyMs=Date.now()-t0;if(++n===2&&!done){done=true;res();}},
     inTx:function(t){onIn(from,t);},outTx:function(t){onOut(from,t);},audio:function(d){onAud(from,d);},
     closed:function(code,was){LS.ready[from]=false;LS.s[from]=null;LS.connecting=null;window.__trLiveClose=code;if(!was&&!done){done=true;rej({error:'ws'+code});}}});
    LS.s[from]=s;s.open();});setTimeout(function(){if(!done){done=true;rej({error:'timeout'});}},9000);});
  }).catch(function(e){LS.connecting=null;if(e&&(e.status===429||e.error==='live_off'||e.status===503))LS.dead=true;window.__trLiveFail=(e&&e.error)||'x';throw e;});
  return LS.connecting;}
 function liveReady(from){return from==='auto'?(LS.ready.ko&&LS.ready.en):!!LS.ready[from];}
 function onIn(from,t){if(!T||!T.live)return;T.src[from]=(T.src[from]||'')+t;liveDraw();}
 function onOut(from,t){if(!T||!T.live)return;if(T.win==null&&String(t).trim()){if(T.from==='auto'||T.from===from){T.win=from;flush();}}if(T.win!==from)return;
  T.out+=t;if(T.firstOut==null){T.firstOut=Date.now()-T.t0;window.__trFirstOut=(window.__trFirstOut||[]).concat([T.firstOut]);}liveDraw();if(T.stopped){clearTimeout(T.fin);T.fin=setTimeout(finishLive,1600);}}
 function onAud(from,d){if(!T||!T.live)return;(T.aud[from]=T.aud[from]||[]).push(d);if(T.win===from)playChunk(from,d);}
 function flush(){(T.aud[T.win]||[]).forEach(function(d){playChunk(T.win,d);});}
 var PL=null;function playChunk(from,d){if(from==='en'&&!prefs().kosnd)return;if(!PL&&window.deLive)PL=new deLive.Player();if(PL){PL.play(d);window.__trPlayed=(window.__trPlayed||0)+1;}}
 function liveDraw(){var lv=$('#trlive');if(!lv||!T)return;lv.hidden=false;var from=T.win||(T.from==='auto'?(T.src.ko&&T.src.ko.length>=(T.src.en||'').length?'ko':'en'):T.from);
  lv.querySelector('.lvh').textContent=T.stopped?L('번역하는 중…','Translating…'):L('듣고 있어요…','Listening…');lv.querySelector('.lvt').textContent=(T.src[from]||'').trim();lv.querySelector('.lvo').textContent=T.out;toEnd();}
 /* ---------- one turn: speak until 「다 했어요」 (never cut off) ---------- */
 function setBar(rec){if(!$('#trdone'))return;$('#trdone').hidden=!rec;['#trko','#tren','#trauto'].forEach(function(s){var b=$(s);if(b)b.classList.toggle('dim',rec);});if(!prefs().auto)$('#trauto').hidden=true;else $('#trauto').hidden=false;fit();}
 function startTurn(from){if(T)return;closeOv();try{speechSynthesis.cancel();}catch(e){}if(PL)PL.stop();wake();
  T={from:from,src:{},out:'',win:from==='auto'?null:from,aud:{},t0:Date.now(),live:false,stopped:false};window.__trTurn=T;setBar(true);
  var lv=$('#trlive');lv.hidden=false;lv.querySelector('.lvh').textContent=L('듣고 있어요…','Listening…');lv.querySelector('.lvt').textContent='';lv.querySelector('.lvo').textContent='';toEnd();
  if(canLive&&!LS.dead){T.live=true;Q=[];if(!liveReady(from)){status(L('연결 중…','Connecting…'));connect().then(function(){status('');Q.forEach(send);Q=[];}).catch(function(){if(T&&T.live){T.live=false;status('');browserRec();}});}
   deLive.audio();if(!mic){mic=new deLive.Mic(function(d){if(!T||!T.live||T.stopped)return;if(!liveReady(T.from))Q.push(d);else send(d);});
    mic.start().then(function(){window.__trMicOn=1;}).catch(function(){micBlocked();});}else mic.pause(false);
   if(prefs().autoend)autoEnd();}
  else browserRec();}
 function send(d){if(!T)return;if(T.from==='auto'){LS.s.ko&&LS.s.ko.sendAudio(d);LS.s.en&&LS.s.en.sendAudio(d);}else LS.s[T.from]&&LS.s[T.from].sendAudio(d);}
 function micBlocked(){endTurn(true);toast(L('마이크 사용이 막혀 있어요. 주소창 옆 🔒 → 마이크 허용을 눌러 주세요.','The microphone is blocked. Tap 🔒 and allow the microphone.'));}
 function autoEnd(){/* optional: end after 2.5 s of quiet once speech was heard */var last=Date.now(),seen=false;T.ae=setInterval(function(){if(!T){return;}var s=(T.src.ko||'')+(T.src.en||'')+(T.bsr||'');if(s.length!==T.len){T.len=s.length;last=Date.now();seen=seen||!!s;}else if(seen&&Date.now()-last>2500)done();},300);}
 function done(){if(!T||T.stopped)return;T.stopped=true;clearInterval(T.ae);setBar(false);liveDraw();
  if(T.live){if(mic)mic.pause(true);var z=btoa(String.fromCharCode.apply(null,new Uint8Array(3200)));for(var i=0;i<10;i++)send(z);clearTimeout(T.fin);T.fin=setTimeout(finishLive,T.out?1600:3500);}
  else if(T.rec){var r=T.rec;T.rec=null;try{r.stop();}catch(e){}setTimeout(finishBrowser,700);}}
 function endTurn(silent){if(T){clearInterval(T.ae);clearTimeout(T.fin);if(T.rec){try{T.rec.abort();}catch(e){}}}T=null;setBar(false);var lv=$('#trlive');if(lv)lv.hidden=true;if(mic)mic.pause(true);if(!silent)status('');}
 function finishLive(){if(!T)return;var t=T,from=t.win||(t.from==='auto'?'ko':t.from),src=(t.src[from]||'').trim(),out=t.out.trim();endTurn();
  if(!src&&!out)return toast(L('잘 안 들렸어요. 다시 눌러 말해 주세요.','I could not hear you. Please try again.'));
  var l=addLine({who:from==='ko'?'me':'partner',from:from,src:src||'…',out:out,live:true});if(t.aud[from])AUD[l.id]=t.aud[from];
  if(!out)textTurn(l);else after(l);}
 /* browser recognition fallback (continuous; restarts itself until 「다 했어요」) */
 function browserRec(){if(!SR){endTurn(true);var d=$('.trtype');if(d)d.open=true;toast(L('이 휴대폰은 음성 인식이 안 돼요. 글로 써 주세요.','Voice input is not available; please type.'));return;}
  var from=T.from==='auto'?'ko':T.from;T.from=from;T.win=from;T.bsr='';var fin='';
  function go(){var r=new SR();r.lang=from==='ko'?'ko-KR':'en-US';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;T.rec=r;
   r.onresult=function(e){var it='';for(var i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)fin+=e.results[i][0].transcript+' ';else it+=e.results[i][0].transcript;}T.bsr=fin;T.src[from]=(fin+it).trim();liveDraw();};
   r.onerror=function(e){if(e.error==='not-allowed'||e.error==='service-not-allowed')micBlocked();};r.onend=function(){if(T&&T.rec===r&&!T.stopped)setTimeout(function(){if(T&&!T.stopped)go();},150);};try{r.start();}catch(e){}}
  go();if(prefs().autoend)autoEnd();}
 function finishBrowser(){if(!T)return;var from=T.from,src=(T.src[from]||'').trim();endTurn();if(!src)return toast(L('잘 안 들렸어요. 다시 눌러 말해 주세요.','I could not hear you. Please try again.'));
  textTurn(addLine({who:from==='ko'?'me':'partner',from:from,src:src,out:''}));}
 function textTurn(l){var to=l.from==='ko'?'en':'ko';status(L('번역하는 중…','Translating…'));
  translate(l.src,l.from,to).then(function(j){status('');l.out=j.translation;l.pending=false;upd();if(to==='en')say(l.out,'en',0.9);else if(prefs().kosnd)say(l.out,'ko',1);after(l);})
   .catch(function(e){status('');l.pending=true;upd();toast(errMsg(e));});}
 function retry(l){l.pending=false;textTurn(l);}
 window.addEventListener('online',function(){cur.lines.filter(function(l){return l.pending;}).forEach(retry);});
 function after(l){window.__trLast={src:l.src,out:l.out,from:l.from,live:!!l.live};
  if(l.from==='ko'&&l.out)translate(l.out,'en','ko').then(function(j){l.back=j.translation;upd();}).catch(function(){});   /* back-translation: what the partner hears */
  if(f2f)f2fDraw();}
 /* ---------- typing ---------- */
 function typed(from){var t=$('#trtx').value.trim();if(!t)return;$('#trtx').value='';textTurn(addLine({who:from==='ko'?'me':'partner',from:from,src:t,out:''}));}
 $('#trsendk').onclick=function(){typed('ko');};$('#trsende').onclick=function(){typed('en');};
 /* ---------- buttons ---------- */
 function micBtn(from){return function(){if(T){if(T.from===from||(from==='auto'))done();return;}startTurn(from);};}
 $('#trko').onclick=micBtn('ko');$('#tren').onclick=micBtn('en');$('#trauto').onclick=micBtn('auto');$('#trdone').onclick=done;
 $('#trflip').onclick=function(){var l=cur.lines[cur.lines.length-1];if(l)show(l.out,outLang(l));else{flip=!flip;labels();draw();}};
 $('#trclear').onclick=function(){var o=ov('<b>'+esc(L('이 대화를 모두 지울까요?','Clear this whole conversation?'))+'</b><button data-a="y" class="hot">'+esc(L('🗑 모두 지우기','Clear all'))+'</button><button data-a="n">'+esc(L('취소','Cancel'))+'</button>');
  o.querySelector('.trsheet').onclick=function(e){var b=e.target.closest('[data-a]');if(!b)return;if(b.dataset.a==='y'){var L2=talks().filter(function(t){return t.id!==cur.id;});saveTalks(L2);cur={id:uid(),title:'',created:Date.now(),updated:Date.now(),lines:[]};AUD={};draw();}closeOv();};};
 $('#trnew').onclick=function(){persist();cur={id:uid(),title:'',created:Date.now(),updated:Date.now(),lines:[]};AUD={};draw();toast(L('새 대화를 시작해요.','New conversation.'));};
 $('#trlist').onclick=listView;
 $('#trmorebtn').onclick=function(){var o=ov('<b>'+esc(L('⋯ 더보기','More'))+'</b><div id="trmh"></div><button data-a="x">'+esc(L('닫기','Close'))+'</button>');var m=$('#trmore');o.querySelector('#trmh').appendChild(m);m.hidden=false;
  o.querySelector('.trsheet').onclick=function(e){if(e.target.closest('[data-a=x]'))return closeOv();var b=e.target.closest('#trmore button');if(b)setTimeout(function(){if(V.querySelector('#trov #trmh'))closeOv();},0);};};
 function listView(){persist();var L2=talks();var o=ov('<b>'+esc(L('📋 대화 목록','Conversations'))+'</b>'+(L2.length?L2.map(function(t){return '<div class="tlrow" data-id="'+t.id+'"><div><b>'+esc(t.title||fmtDate(t.created))+'</b><br><span class="n2">'+fmtDate(t.updated)+' · '+t.lines.length+'</span></div>'+
   '<button data-a="open">'+esc(L('이어서 말하기','Continue'))+'</button><button data-a="ren">'+esc(L('✏ 이름','Rename'))+'</button><button data-a="del">'+esc(L('🗑 지우기','Delete'))+'</button></div>';}).join(''):'<p class="n2">'+esc(L('저장된 대화가 없어요.','No saved conversations.'))+'</p>')+'<button data-a="x">'+esc(L('닫기','Close'))+'</button>');
  o.querySelector('.trsheet').onclick=function(e){var b=e.target.closest('[data-a]');if(!b)return;var r=b.closest('.tlrow'),id=r&&r.dataset.id,t=talks().filter(function(x){return x.id===id;})[0];
   if(b.dataset.a==='x')return closeOv();if(!t)return;
   if(b.dataset.a==='open'){cur=t;AUD={};closeOv();draw();}
   else if(b.dataset.a==='ren'){var n=prompt(L('대화 이름','Name'),t.title||'');if(n!=null){t.title=n.slice(0,40);var L3=talks().filter(function(x){return x.id!==id;});L3.push(t);saveTalks(L3);if(cur.id===id)cur.title=t.title;listView();}}
   else if(b.dataset.a==='del'){if(r.classList.contains('sure')){saveTalks(talks().filter(function(x){return x.id!==id;}));if(cur.id===id){cur={id:uid(),title:'',created:Date.now(),updated:Date.now(),lines:[]};draw();}listView();}else{r.classList.add('sure');b.textContent=L('한 번 더 누르면 지워져요','Tap again to delete');}}};}
 $('#trpb').onclick=function(){var o=ov('<b>'+esc(L('📖 자주 쓰는 말','Phrasebook'))+'</b>'+PB.map(function(g,gi){return '<details'+(gi===0?' open':'')+'><summary>'+esc(g[0])+'</summary>'+g[1].map(function(p,i){return '<button class="pbit" data-g="'+gi+'" data-i="'+i+'"><b>'+esc(p[1])+'</b><br><span>'+esc(p[0])+'</span></button>';}).join('')+'</details>';}).join('')+'<button data-a="x">'+esc(L('닫기','Close'))+'</button>');
  o.querySelector('.trsheet').onclick=function(e){var b=e.target.closest('.pbit');if(e.target.closest('[data-a=x]'))return closeOv();if(!b)return;var p=PB[+b.dataset.g][1][+b.dataset.i];closeOv();
   addLine({who:'me',from:'ko',src:p[0],out:p[1],phrase:true});say(p[1],'en',0.9);window.__trLast={src:p[0],out:p[1],from:'ko',phrase:true};};};
 /* settings */
 $('#trset').onclick=function(){var p=prefs();var o=ov('<b>'+esc(L('⚙ 설정','Settings'))+'</b>'+
   '<label class="tgl"><input type="checkbox" id="s_auto"'+(p.auto?' checked':'')+'> '+esc(L('🎤 자동 언어 감지 버튼 보이기','Show the Auto button'))+'</label>'+
   '<label class="tgl"><input type="checkbox" id="s_ae"'+(p.autoend?' checked':'')+'> '+esc(L('말이 끝나면 자동으로 끝내기','End my turn by itself after a pause'))+'</label>'+
   '<label class="tgl"><input type="checkbox" id="s_ks"'+(p.kosnd?' checked':'')+'> '+esc(L('한국어 번역을 소리로 듣기','Read Korean aloud'))+'</label>'+
   '<div class="n2">'+esc(L('한국어 번역 말투','Korean style'))+'</div><label class="tgl"><input type="radio" name="s_ko" value="haeyo"'+(p.style.ko!=='banmal'?' checked':'')+'> 존댓말(해요체) · Polite</label><label class="tgl"><input type="radio" name="s_ko" value="banmal"'+(p.style.ko==='banmal'?' checked':'')+'> 반말 · Casual</label>'+
   '<div class="n2">'+esc(L('영어 번역 말투','English style'))+'</div><label class="tgl"><input type="radio" name="s_en" value="casual"'+(p.style.en!=='formal'?' checked':'')+'> 쉬운 일상 영어 · Everyday</label><label class="tgl"><input type="radio" name="s_en" value="formal"'+(p.style.en==='formal'?' checked':'')+'> 정중한 영어 · Formal</label>'+
   '<button data-a="ok" class="hot">'+esc(L('저장','Save'))+'</button>');
  o.querySelector('.trsheet').onclick=function(e){var b=e.target.closest('[data-a]');if(!b)return;var q=function(s){return o.querySelector(s);};var old=JSON.stringify(prefs().style);
   setPref('auto',q('#s_auto').checked);setPref('autoend',q('#s_ae').checked);setPref('kosnd',q('#s_ks').checked);
   setPref('style',{ko:q('input[name=s_ko]:checked').value,en:q('input[name=s_en]:checked').value});
   if(JSON.stringify(prefs().style)!==old){['ko','en'].forEach(function(k){try{LS.s[k]&&LS.s[k].close();}catch(x){}LS.s[k]=null;LS.ready[k]=false;});LS.connecting=null;connect().catch(function(){});}
   setBar(false);closeOv();};};
 /* face to face: the top half turns to the partner */
 var f2f=false;
 function f2fDraw(){var t=$('#f2ftop .f2txt'),b=$('#f2fbot .f2txt');if(!t)return;var l=cur.lines[cur.lines.length-1];
  var en=cur.lines.slice().reverse().filter(function(x){return true;})[0];t.textContent=l?(l.from==='ko'?l.out:l.src):'Tap the button and speak English.';b.textContent=l?(l.from==='ko'?l.src:l.out):'버튼을 누르고 한국어로 말하세요.';}
 $('#trf2f').onclick=function(){f2f=!f2f;var w=$('#trwrap');w.classList.toggle('f2f',f2f);var x=$('#f2f');if(x)x.remove();
  if(f2f){var d=document.createElement('div');d.id='f2f';d.innerHTML='<div id="f2ftop" class="f2h"><div class="f2txt"></div><button class="trmic en">🇺🇸 Speak English · 영어로 말하기</button></div><div id="f2fbot" class="f2h"><div class="f2txt"></div><button class="trmic ko">🇰🇷 한국어로 말하기 · Speak Korean</button></div><button id="f2fx" class="tb">'+esc(L('마주 보기 끝내기','Exit face to face'))+'</button>';
   w.appendChild(d);d.querySelector('#f2ftop button').onclick=micBtn('en');d.querySelector('#f2fbot button').onclick=micBtn('ko');d.querySelector('#f2fx').onclick=function(){$('#trf2f').click();};f2fDraw();}};
 /* ---------- leaving: Leave (kept) / Leave without saving / Stay ---------- */
 var leaving=false;
 function leaveDlg(go){if(T)done();var o=ov('<b>'+esc(L('대화를 나갈까요?','Leave the conversation?'))+'</b><p class="n2">'+esc(L('대화는 이 휴대폰에 저장돼요. 나중에 「대화 목록」에서 이어서 말할 수 있어요.','The conversation is saved on this phone; continue it later from Conversations.'))+'</p>'+
   '<button data-a="leave" class="hot">'+esc(L('나가기','Leave'))+'</button><button data-a="nosave">'+esc(L('저장 안 하고 나가기','Leave without saving'))+'</button><button data-a="stay">'+esc(L('머무르기','Stay'))+'</button>');
  o.querySelector('.trsheet').onclick=function(e){var b=e.target.closest('[data-a]');if(!b)return;if(b.dataset.a==='stay')return closeOv();
   if(b.dataset.a==='nosave')saveTalks(talks().filter(function(t){return t.id!==cur.id;}));else persist();leaving=true;closeOv();go();};}
 $('#trback').onclick=function(e){if(!cur.lines.length&&!T)return;e.preventDefault();var h=this.getAttribute('href');leaveDlg(function(){location.hash=h;});};
 try{history.pushState({trg:1},'',location.href);}catch(e){}
 function onPop(){if(leaving||!document.body.contains($('#trwrap'))||!/^#\/tr(\/\d+)?$/.test(location.hash)){window.removeEventListener('popstate',onPop);return;}   /* only the phone's Back (same screen address) asks; other moves pass */
  if(!cur.lines.length&&!T){window.removeEventListener('popstate',onPop);history.back();return;}
  try{history.pushState({trg:1},'',location.href);}catch(e){}leaveDlg(function(){window.removeEventListener('popstate',onPop);history.go(-2);});}
 window.addEventListener('popstate',onPop);
 /* ---------- screen on, recover after calls / lock screen ---------- */
 var WL=null;function wake(){try{if(navigator.wakeLock&&!WL)navigator.wakeLock.request('screen').then(function(w){WL=w;w.addEventListener('release',function(){WL=null;});}).catch(function(){});}catch(e){}}
 function vis(){if(!document.body.contains($('#trwrap')))return;if(document.visibilityState==='hidden'){if(T)done();persist();}else{wake();if(canLive&&!LS.dead&&!(LS.ready.ko&&LS.ready.en))connect().catch(function(){});}}
 document.addEventListener('visibilitychange',vis);
 window.addEventListener('hashchange',function h(){if(/^#\/tr(\/\d+)?$/.test(location.hash)&&document.body.contains($('#trwrap')))return;window.removeEventListener('hashchange',h);document.removeEventListener('visibilitychange',vis);window.removeEventListener('popstate',onPop);
  document.body.classList.remove('trmode');window.removeEventListener('resize',fit);persist();endTurn(true);if(mic){mic.stop();mic=null;}['ko','en'].forEach(function(k){try{LS.s[k]&&LS.s[k].close();}catch(e){}});if(PL)PL.stop();if(WL){try{WL.release();}catch(e){}}});
 document.body.classList.add('trmode');window.addEventListener('resize',fit);labels();setBar(false);draw();wake();if(resumed)toast(L('지난 대화를 이어서 해요. 새로 하려면 「➕ 새 대화」.','Continuing your last conversation. Tap New talk to start fresh.'));
 if(canLive)connect().catch(function(){});window.__trReady=1;};
/* =================================================================== 말할 내용 준비 · Prepare what to say */
function scripts(){return ld('de100scripts',[]);}
function saveScripts(L){L.sort(function(a,b){return b.updated-a.updated;});sv('de100scripts',L.slice(0,50));}
function prepScreen(V,back){var S=null;
 function L(ko,en){return ko+' · '+en;}
 function list(){V.innerHTML='<header class="atop"><a class="aback" href="#/tr">← 바로 통역 · Interpreter</a><div class="k">웰컴 잉글리시 100</div><h1>📝 말할 내용 준비 · Prepare</h1></header>'+
   '<p class="n2">인사말·광고·간증을 한국어로 먼저 말하거나 쓰고, 영어로 바꿔서 읽어요. · Say or type it in Korean, turn it into English, then read it aloud.</p>'+
   '<button id="pnew" class="go">➕ 새 원고 · New script</button><h3>📂 내 원고 · My scripts</h3>'+
   (scripts().length?scripts().map(function(s){return '<div class="card plrow" data-id="'+s.id+'"><b>'+esc(s.title||'제목 없음 · Untitled')+'</b><div class="n2">'+fmtDate(s.updated)+' · '+(s.lines||[]).length+' 문장</div><button data-a="o" class="big2">열기 · Open</button><button data-a="d" class="big2">🗑 지우기 · Delete</button></div>';}).join(''):'<p class="n2">아직 원고가 없어요. · No scripts yet.</p>');
  V.querySelector('#pnew').onclick=function(){S={id:uid(),title:'',ko:'',lines:[],simple:false,read:false,updated:Date.now()};editor();};
  [].forEach.call(V.querySelectorAll('.plrow'),function(r){r.onclick=function(e){var b=e.target.closest('[data-a]');if(!b)return;var s=scripts().filter(function(x){return x.id===r.dataset.id;})[0];if(!s)return;
   if(b.dataset.a==='o'){S=s;editor();}else if(r.classList.contains('sure')){saveScripts(scripts().filter(function(x){return x.id!==s.id;}));list();}else{r.classList.add('sure');b.textContent='한 번 더 누르면 지워져요 · Tap again';}};});window.__prepReady=1;}
 function store(){S.updated=Date.now();var L2=scripts().filter(function(x){return x.id!==S.id;});L2.push(S);saveScripts(L2);}
 var dict=null;
 function editor(){V.innerHTML='<header class="atop"><a class="aback" href="#/tr/prep" id="pback">← 내 원고 · My scripts</a><h1>📝 말할 내용 준비 · Prepare</h1></header>'+
   '<input id="ptitle" class="pti" placeholder="제목 · Title (예: 환영 인사)" value="'+esc(S.title)+'">'+
   '<textarea id="pko" rows="8" placeholder="여기에 한국어로 쓰거나, 아래 🎤 버튼으로 말하세요. · Type Korean here, or tap 🎤 and speak.">'+esc(S.ko)+'</textarea>'+
   '<div class="trrow"><button id="pdict" class="big2">🎤 말로 입력 · Dictate</button><button id="ptr" class="go">영어로 바꾸기 · Translate</button></div>'+
   '<div class="trtog"><label class="tgl"><input type="checkbox" id="psimple"'+(S.simple?' checked':'')+'> 쉽게 · Simpler</label><label class="tgl"><input type="checkbox" id="pread"'+(S.read?' checked':'')+'> 발음 도움 · Pronunciation help</label></div>'+
   '<div id="pst" class="n2"></div><div id="plines"></div>'+
   '<div class="trrow"><button id="pteleb" class="go"'+(S.lines.length?'':' hidden')+'>📖 읽기 화면 · Reading mode</button><button id="pcopy" class="big2"'+(S.lines.length?'':' hidden')+'>📋 복사 · Copy</button><button id="pshare" class="big2"'+(S.lines.length&&navigator.share?'':' hidden')+'>공유 · Share</button></div>';
  var $=function(s){return V.querySelector(s);};
  function lines(){$('#plines').innerHTML=S.lines.map(function(l,i){return (l.para&&i?'<hr>':'')+'<div class="pln" data-i="'+i+'"><div class="n2">'+esc(l.ko)+'</div><div class="pen" contenteditable="true">'+esc(l.en)+'</div>'+(S.read&&l.read&&l.read.length?'<div class="prd">'+l.read.map(function(r){return esc(r.w)+' = '+esc(r.r);}).join(' · ')+'</div>':'')+'</div>';}).join('');
   [].forEach.call(V.querySelectorAll('.pen'),function(p){p.onblur=function(){var i=+p.parentNode.dataset.i;S.lines[i].en=p.textContent.trim();store();};});
   ['#pteleb','#pcopy'].forEach(function(s){$(s).hidden=!S.lines.length;});$('#pshare').hidden=!(S.lines.length&&navigator.share);}
  lines();
  $('#ptitle').oninput=function(){S.title=this.value.slice(0,60);store();};$('#pko').oninput=function(){S.ko=this.value;store();};
  $('#psimple').onchange=function(){S.simple=this.checked;store();};$('#pread').onchange=function(){S.read=this.checked;store();lines();};
  $('#ptr').onclick=function(){var t=$('#pko').value.trim();if(!t)return;S.ko=t;$('#pst').textContent='영어로 바꾸는 중… · Translating…';
   post('/prep',{text:t.slice(0,2000),simple:S.simple,read:true,sid:sid(),style:prefs().style},30000).then(function(j){S.lines=j.lines||[];store();$('#pst').textContent='';lines();window.__prepLines=S.lines.length;})
    .catch(function(e){$('#pst').textContent=errMsg(e);});};
  $('#pdict').onclick=function(){if(dict){dict.stop();return;}dict=dictate(function(t){var a=$('#pko');a.value=(a.value.replace(/\s+$/,'')+(a.value.trim()?' ':'')+t).trimStart();S.ko=a.value;store();},
   function(on,live){$('#pdict').textContent=on?'■ 그만 · Stop':'🎤 말로 입력 · Dictate';$('#pdict').classList.toggle('on',on);if(!on)dict=null;$('#pst').textContent=on?'듣고 있어요… 다 말하면 「그만」을 누르세요. · Listening… tap Stop when you finish.':'';});};
  $('#pcopy').onclick=function(){copy(S.lines.map(function(l){return l.en;}).join(' '));$('#pst').textContent='📋 복사했어요. · Copied.';};
  $('#pshare').onclick=function(){try{navigator.share({title:S.title||'Script',text:S.lines.map(function(l){return l.en;}).join(' ')});}catch(e){}};
  $('#pteleb').onclick=tele;
  window.addEventListener('hashchange',function h(){window.removeEventListener('hashchange',h);if(dict)dict.stop();try{speechSynthesis.cancel();}catch(e){}});}
 /* long dictation: live recognition (best for Korean) or phone recognition; continues across pauses until Stop */
 function dictate(add,state){var U=aiUrl(),stopped=false,sess=null,m=null,rec=null,buf='';
  function finish(){if(buf.trim())add(buf.trim());buf='';}
  function stop(){if(stopped)return;stopped=true;try{m&&m.stop();}catch(e){}try{sess&&sess.close();}catch(e){}try{rec&&rec.stop();}catch(e){}setTimeout(function(){finish();state(false);},900);}
  function browser(){if(!SR){state(false);alert('이 휴대폰은 음성 입력이 안 돼요. 글로 써 주세요. · Voice input is not available.');return;}
   (function go(){if(stopped)return;var r=new SR();r.lang='ko-KR';r.continuous=true;r.interimResults=false;rec=r;r.onresult=function(e){for(var i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)add(e.results[i][0].transcript.trim());};
    r.onend=function(){if(!stopped)setTimeout(go,150);};try{r.start();}catch(e){}})();state(true,false);}
  function live(){deLive.audio();deLive.tokens(U,{kind:'translate',sid:sid(),style:prefs().style}).then(function(j){if(stopped)return;
    sess=new deLive.Session(j.ws,j.sessions['ko>en'],{ready:function(){if(!m){m=new deLive.Mic(function(d){if(sess)sess.sendAudio(d);});m.start().catch(function(){stop();});}},
     inTx:function(t){buf+=t;if(/[.?!。]\s*$/.test(buf)||buf.length>60){finish();}},closed:function(){sess=null;if(!stopped){finish();live();}}});sess.open();state(true,true);})
    .catch(function(){if(!stopped)browser();});}
  if(U&&window.deLive&&deLive.supported()&&liveFlag())live();else browser();
  return {stop:stop};}
 /* teleprompter */
 function tele(){var i=0,o=document.createElement('div');o.className='tele';document.body.appendChild(o);var opt=ld('de100tele',{hear:false,slow:false,ko:true,rd:false});
  function drawT(){var l=S.lines[i]||{};o.innerHTML='<div class="tbar"><button data-a="x">✕ 닫기 · Close</button><span>'+(i+1)+' / '+S.lines.length+'</span></div>'+
    '<div class="tprev">'+esc((S.lines[i-1]||{}).en||'')+'</div><div class="tcur">'+esc(l.en||'')+'</div>'+(opt.ko?'<div class="tko">'+esc(l.ko||'')+'</div>':'')+(opt.rd&&l.read&&l.read.length?'<div class="trd">'+l.read.map(function(r){return esc(r.w)+' → '+esc(r.r);}).join('<br>')+'</div>':'')+
    '<div class="tnext">'+esc((S.lines[i+1]||{}).en||'')+'</div>'+
    '<div class="tctl"><button data-a="prev">◀ 이전 · Back</button><button data-a="play">🔊 듣기 · Listen</button><button data-a="next" class="hot">다음 ▶ · Next</button></div>'+
    '<div class="topt"><label><input type="checkbox" data-o="hear"'+(opt.hear?' checked':'')+'> 먼저 듣기 · Hear first</label><label><input type="checkbox" data-o="slow"'+(opt.slow?' checked':'')+'> 🐢 천천히 · Slow</label><label><input type="checkbox" data-o="ko"'+(opt.ko?' checked':'')+'> 한글 뜻 · Korean</label><label><input type="checkbox" data-o="rd"'+(opt.rd?' checked':'')+'> 발음 도움 · Pronunciation</label></div>';
   window.__teleAt=i;if(opt.hear)say(l.en,'en',opt.slow?0.7:0.9);}
  o.onclick=function(e){var b=e.target.closest('[data-a]'),c=e.target.closest('[data-o]');if(c){opt[c.dataset.o]=c.checked;sv('de100tele',opt);drawT();return;}
   if(b){var a=b.dataset.a;if(a==='x'){try{speechSynthesis.cancel();}catch(x){}o.remove();return;}if(a==='prev')i=Math.max(0,i-1);else if(a==='next')i=Math.min(S.lines.length-1,i+1);else if(a==='play'){say(S.lines[i].en,'en',opt.slow?0.7:0.9);return;}drawT();return;}
   if(e.target.closest('.tcur')){i=Math.min(S.lines.length-1,i+1);drawT();}};
  window.addEventListener('hashchange',function h(){window.removeEventListener('hashchange',h);if(o.parentNode)o.remove();});drawT();}
 list();}
window.prepScreen=prepScreen;
})();
