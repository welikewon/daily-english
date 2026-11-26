/* "막혔을 때" panel (app day/talk screens + standalone talk page). Needs window.STUCK (content) and window.TK (talk kit) + dePlay. Free only: links to the official translator web pages, phone speech synthesis. */
(function(){
function S(){return window.STUCK;}var K=function(){return window.TK;};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var KEY='de100mouth';function list(){return JSON.parse(localStorage.getItem(KEY)||'[]');}function save(l){localStorage.setItem(KEY,JSON.stringify(l.slice(0,50)));}
function hasKo(t){return /[가-힣]/.test(t);}
function gUrl(t){var ko=hasKo(t);return 'https://translate.google.com/?sl='+(ko?'ko':'en')+'&tl='+(ko?'en':'ko')+'&text='+encodeURIComponent(t)+'&op=translate';}
function pUrl(t){var ko=hasKo(t);return 'https://papago.naver.com/?sk='+(ko?'ko':'en')+'&tk='+(ko?'en':'ko')+'&st='+encodeURIComponent(t);}
function speak(t,rate){if(!window.speechSynthesis){return false;}try{stopAll();}catch(e){}speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang=hasKo(t)?'ko-KR':'en-US';u.rate=rate||1;speechSynthesis.speak(u);window.__spoke=(window.__spoke||0)+1;return true;}
function steps(a){return '<div class="sapp"><h3>'+a.order+'. '+esc(a.name)+'</h3><ol class="ssteps">'+a.steps.map(function(s){return '<li><b>'+s.no+'</b> '+esc(s.text_ko)+'</li>';}).join('')+'</ol>'+(a.notes_ko||[]).map(function(n){return '<p class="n2">· '+esc(n)+'</p>';}).join('')+'</div>';}
function render(p){var st=S(),l=list();
 p.innerHTML='<div class="shead"><b>🙋 막혔을 때 · When stuck</b><button class="sclose" aria-label="닫기">✕ 닫기 · Close</button></div>'+
 '<p>'+esc(st.lead_ko)+'</p>'+
 '<div class="card"><h3>✍ 바로 통역 · Translate now</h3>'+(window.deTR&&window.deTR.url()?'<a class="sbtn sbig" href="'+(/\/app\//.test(location.pathname)?'#/tr':'../app/#/tr')+'">🗣 바로 통역 화면 열기 · Open live interpreter</a>':'')+
  '<textarea id="stx" rows="3" placeholder="하고 싶은 말을 한국어로 (또는 들은 영어를) 쓰거나 🎤로 말하세요 · Type or speak"></textarea>'+
  '<div class="srow"><button id="smic">🇰🇷 한국어로 말하기 · Speak Korean</button><button id="smicen">🇺🇸 영어로 말하기 · Speak English</button></div>'+
  '<div class="srow"><button id="strn" class="sbig">번역기로 바로 보내기 · Send to translator</button></div><div id="sres"></div>'+
  '<div class="srow"><button id="ssay">📱 휴대폰 목소리로 듣기 · Listen (phone voice)</button><button id="sslow">🐢 천천히 · Slower</button><button id="sadd">✍ 내 입에서 말해 보기에 넣기 · Add to my practice list</button></div>'+
  '<div id="sst" class="n2"></div><p class="n2 slinks">다른 번역기 · Other translators: <a id="sg" target="_blank" rel="noopener">Google</a> · <a id="sp" target="_blank" rel="noopener">Papago</a></p></div>'+
 '<div class="card"><h3>💬 이렇게 부탁하세요</h3>'+st.polite_lines.map(function(x,i){return '<div class="spol"><button data-pol="'+i+'">🔊</button> <b>'+esc(x.en)+'</b><br><span class="n2">'+esc(x.ko)+'</span></div>';}).join('')+'</div>'+
 '<div class="card"><h3>📱 번역기 대화 모드로 이어 가기</h3>'+st.apps.map(steps).join('')+(st.also_ko||[]).map(function(x){return '<p class="n2">· '+esc(x)+'</p>';}).join('')+
  '<ul>'+st.tips_ko.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
 '<div class="card"><h3>🗣 내 입으로 말해 보기 ('+l.length+')</h3><p class="n2">'+esc(st.bottom_box_ko.replace('책 뒤 ',''))+'</p><div id="smy"></div></div>';
 p.querySelector('.sclose').onclick=close;
 var tx=p.querySelector('#stx');function upd(){var t=tx.value.trim();p.querySelector('#sg').href=t?gUrl(t):'https://translate.google.com/?sl=ko&tl=en&op=translate';p.querySelector('#sp').href=t?pUrl(t):'https://papago.naver.com/?sk=ko&tk=en';}
 tx.oninput=upd;upd();
 function mic(lang){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){p.querySelector('#sst').textContent='이 브라우저는 음성 인식이 안 돼요. 글자로 써 주세요.';return;}
  var r=new SR();r.lang=lang;r.interimResults=false;r.onresult=function(e){tx.value=e.results[0][0].transcript;upd();trn();};r.onerror=function(){p.querySelector('#sst').textContent='잘 안 들렸어요. 다시 해 보세요.';};
  try{r.start();p.querySelector('#sst').textContent='듣고 있어요… 말을 마치면 잠시 기다리세요. · Listening…';r.onend=function(){p.querySelector('#sst').textContent='';};}catch(e){}}
 function trn(){var t=tx.value.trim(),out=p.querySelector('#sres');if(!t||!window.deTR||!window.deTR.url())return;var ko=hasKo(t);out.innerHTML='<p class="n2">💭 번역 중… · Translating…</p>';
  window.deTR.translate(t,ko?'ko':'en',ko?'en':'ko').then(function(j){out.innerHTML='<div class="sbigt">'+esc(j.translation)+'</div>';window.__stuckTr=j.translation;if(ko){tx.value=j.translation;upd();window.deTR.say(j.translation,'en',0.9);}},
   function(e){out.innerHTML='<p class="warn">'+esc(window.deTR.err(e))+'</p>';});}
 p.querySelector('#strn').onclick=trn;
 p.querySelector('#smic').onclick=function(){mic('ko-KR');};p.querySelector('#smicen').onclick=function(){mic('en-US');};
 p.querySelector('#ssay').onclick=function(){if(!speak(tx.value.trim(),1))p.querySelector('#sst').textContent='이 휴대폰은 읽어 주기를 지원하지 않아요.';};
 p.querySelector('#sslow').onclick=function(){speak(tx.value.trim(),0.7);};
 p.querySelector('#sadd').onclick=function(){var t=tx.value.trim();if(!t)return;if(hasKo(t)){p.querySelector('#sst').textContent='영어 문장을 넣어 주세요. (번역 결과를 복사해 붙여 넣기)';return;}
  var L=list();if(!L.some(function(x){return x.en===t;}))L.unshift({en:t,added:new Date().toISOString().slice(0,10)});save(L);render(p);};
 [].forEach.call(p.querySelectorAll('[data-pol]'),function(b){b.onclick=function(){dePlay(st.polite_audio[+b.dataset.pol],{label:'🔊 부탁하기',btn:b});};});
 var my=p.querySelector('#smy');list().forEach(function(x,i){var c=document.createElement('div');c.className='smi';
  c.innerHTML='<b>'+esc(x.en)+'</b> <span class="n2">'+esc(x.added||'')+'</span><div class="srow"><button data-s="1">🔊 듣기 · Listen</button><button data-s="0.7">🐢 천천히 · Slower</button><button class="sdel">지우기 · Delete</button></div>';
  [].forEach.call(c.querySelectorAll('[data-s]'),function(b){b.onclick=function(){speak(x.en,+b.dataset.s);};});
  c.querySelector('.sdel').onclick=function(){var L=list();L.splice(i,1);save(L);render(p);};
  var cw=document.createElement('div');cw.className='cmpw';
  if(K())c.appendChild(K().talkBox({target:x.en,onDone:function(h){cw.innerHTML=h==null?'':K().colour(x.en,h).html;}}));c.appendChild(cw);my.appendChild(c);});
 if(!list().length)my.innerHTML='<p class="n2">아직 없어요. 번역기로 통한 영어 문장을 「➕」로 넣어 두세요.</p>';}
var P=null;
function open(){try{stopAll();}catch(e){}if(!P){P=document.createElement('div');P.id='stuck';document.body.appendChild(P);}P.hidden=false;document.body.classList.add('stuckopen');render(P);P.scrollTop=0;window.__stuckOpen=1;}
function close(){if(P){P.hidden=true;}document.body.classList.remove('stuckopen');try{if(window.TK)window.TK.abortAll();}catch(e){}if(window.speechSynthesis)speechSynthesis.cancel();window.__stuckOpen=0;}
window.openStuck=open;window.closeStuck=close;
window.addEventListener('hashchange',close);window.addEventListener('pagehide',function(){if(window.speechSynthesis)speechSynthesis.cancel();});
document.addEventListener('click',function(e){if(e.target.closest('#pstop')&&window.speechSynthesis)speechSynthesis.cancel();},true);
})();
