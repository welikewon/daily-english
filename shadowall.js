/* 📚 모든 예문 쉐도잉 · Shadow all - every English sentence of the day's book page, in book order, then More practice.
   Audio: phone voice for now; when a recorded clip exists (opts.clip(key) -> url), it is used instead automatically. */
window.shadowAll=function(root,day,opts){opts=opts||{};
 var secs=(day.shadow_all||[]).map(function(s,i){return {ko:s.section_ko,en:s.section_en,items:s.items||[],core:/12/.test(s.section_ko||'')};});
 secs.sort(function(a,b){return (b.core?1:0)-(a.core?1:0);});   /* today's 12 first, then the book order */
 var ms=day.more_say&&day.more_say.groups||[],more=[];ms.forEach(function(g){(g.items||[]).forEach(function(x){more.push(x);});});
 if(more.length)secs.push({ko:'➕ 더 말해 보기',en:'More practice',items:more,more:true});
 var all=[];secs.forEach(function(s,si){s.items.forEach(function(x,i){if(x&&x.en)all.push({s:si,i:i,en:x.en,ko:x.ko||'',key:'sa_'+si+'_'+i});});});
 var nBook=all.filter(function(x){return !secs[x.s].more;}).length;
 function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 var h='<div class="sa"><div class="sahead"><b>📚 모든 예문 · All sentences ('+nBook+(more.length?' + '+more.length:'')+')</b>'+
  '<button class="sago">▶ 처음부터 쉐도잉 · Shadow from the start</button>'+
  '<label class="satg"><input type="checkbox" class="saslow"> 🐢 천천히 · Slower</label><label class="satg"><input type="checkbox" class="sakohide"> 한글 숨기기 · Hide Korean</label>'+
  '<p class="sanote">책에 나온 순서대로 · In book order. 지금은 휴대폰 목소리로 읽어요 · Phone voice for now.</p></div>';
 secs.forEach(function(s,si){h+='<details class="sasec"'+(si===0?' open':'')+'><summary>'+(s.more?'':'📖 책 · Book: ')+esc(s.ko)+' · '+esc(s.en)+' <span class="n2">('+s.items.length+')</span></summary>'+
  '<button class="sax3" data-s="'+si+'">🔁 3번씩 · 3 times</button>'+
  s.items.map(function(x,i){return '<div class="sait" data-k="sa_'+si+'_'+i+'"><div class="saen"><span class="sal">'+(i+1)+'</span> '+esc(x.en)+'</div><div class="sako">'+esc(x.ko||'')+'</div>'+
   '<div class="sab"><button data-a="p">▶ 듣기 · Play</button><button data-a="r">🗣 따라 말하기 · Repeat</button></div></div>';}).join('')+'</details>';});
 h+='</div>';root.innerHTML=h;
 var $=function(s){return root.querySelector(s);},$$=function(s){return [].slice.call(root.querySelectorAll(s));};
 var run=0,audio=null;
 function voice(){var v=(window.speechSynthesis&&speechSynthesis.getVoices())||[];var c=v.filter(function(x){return /^en[-_]US/i.test(x.lang);});return c.filter(function(x){return /Google/i.test(x.name);})[0]||c[0]||null;}
 function stop(){run++;try{window.speechSynthesis&&speechSynthesis.cancel();}catch(e){}if(audio){audio.pause();audio=null;}$$('.sait.now').forEach(function(e){e.classList.remove('now');});$$('.act').forEach(function(b){b.classList.remove('act');});$$('.sarep').forEach(function(e){e.remove();});}
 function say(x,cb){var id=run,slow=$('.saslow').checked,url=opts.clip&&opts.clip(x.key,slow);var fin=function(){if(id===run)cb&&cb();};
  if(url){audio=new Audio(url);audio.onended=fin;audio.onerror=function(){url=null;tts();};audio.play().catch(function(){tts();});return;}
  tts();function tts(){var ss=window.speechSynthesis;if(!ss){setTimeout(fin,600);return;}ss.cancel();var u=new SpeechSynthesisUtterance(x.en),v=voice();u.lang='en-US';if(v)u.voice=v;u.rate=slow?0.7:0.92;
   var done=false,f=function(){if(!done){done=true;fin();}};u.onend=f;u.onerror=f;setTimeout(f,2500+x.en.length*95/u.rate);ss.speak(u);window.__saSpoke=(window.__saSpoke||0)+1;}}
 function gap(x){return Math.max(1500,x.en.split(/\s+/).length*420*($('.saslow').checked?1.3:1));}
 function el(x){return root.querySelector('.sait[data-k="'+x.key+'"]');}
 function mark(x){$$('.sait.now').forEach(function(e){e.classList.remove('now');});var e=el(x);if(e){e.classList.add('now');var d=e.closest('details');if(d)d.open=true;e.scrollIntoView({block:'center',behavior:'smooth'});}}
 function seq(list,times,btn){stop();var id=run;if(btn)btn.classList.add('act');var k=0,t=0;
  (function next(){if(id!==run)return;if(k>=list.length){stop();return;}var x=list[k];mark(x);window.__saNow=x.key;
   say(x,function(){setTimeout(function(){if(id!==run)return;t++;if(t>=times){t=0;k++;}next();},gap(x));});})();}
 $('.sago').onclick=function(){if(this.classList.contains('act')){stop();return;}seq(all,1,this);};
 $$('.sax3').forEach(function(b){b.onclick=function(){if(b.classList.contains('act')){stop();return;}var si=+b.dataset.s;seq(all.filter(function(x){return x.s===si;}),3,b);};});
 $$('.sait [data-a]').forEach(function(b){b.onclick=function(){var k=b.closest('.sait').dataset.k,x=all.filter(function(y){return y.key===k;})[0];if(!x)return;
  if(b.classList.contains('act')){stop();return;}stop();var id=run;b.classList.add('act');mark(x);
  say(x,function(){if(b.dataset.a!=='r'){stop();return;}var r=document.createElement('div');r.className='sarep';r.textContent='🗣 이제 따라 말해 보세요 · Now you say it';el(x).appendChild(r);
   setTimeout(function(){if(id===run)stop();},gap(x)+800);});};});
 $('.sakohide').onchange=function(){root.querySelector('.sa').classList.toggle('noko',this.checked);};
 window.addEventListener('hashchange',stop);window.addEventListener('pagehide',stop);
 return {stop:stop,count:nBook,more:more.length};};
