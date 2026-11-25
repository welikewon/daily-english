
(function(){
const A=new Audio(); let token=0;
const meta=JSON.parse(document.getElementById('meta').textContent);
const dir=meta.dir; const st={rep:false};
function src(n){return dir+'/'+n+'.mp3'}
function wait(ms,t){return new Promise(r=>setTimeout(()=>r(t===token),ms))}
function playSeg(n,from,to,t){return new Promise(res=>{
  A.src=src(n); A.currentTime=0;
  const go=()=>{ if(from) A.currentTime=from; A.play().catch(()=>res(false)); };
  A.oncanplay=()=>{A.oncanplay=null;go()};
  const tick=()=>{ if(t!==token){A.pause();res(false);return}
    if(to && A.currentTime>=to){A.pause();res(true);return}
    if(A.ended){res(true);return} requestAnimationFrame(tick)}; requestAnimationFrame(tick);
});}
function dur(n){return (meta.a[n]||{}).dur||2}
function stop(){token++;A.pause();document.querySelectorAll('.now,.play').forEach(x=>x.classList.remove('now','play'));setBtn()}
function setBtn(){document.querySelectorAll('[data-run]').forEach(b=>b.classList.remove('on'))}
async function play(n,el){const t=++token; const k=st.rep?3:1;
  for(let i=0;i<k;i++){ if(el) el.classList.add('now'); if(!await playSeg(n,0,0,t))return; if(el) el.classList.remove('now');
    if(i<k-1 && !await wait(1000*Math.max(1.2,dur(n)*1.2),t))return; } }
async function chunkPlay(n,el){const t=++token; const ch=(meta.a[n]||{}).chunks||[]; const sp=[...el.querySelectorAll('.ch')];
  el.classList.add('now');
  for(let i=0;i<ch.length;i++){ sp[i]&&sp[i].classList.add('play');
    if(!await playSeg(n,ch[i][0],ch[i][1],t))return; sp[i]&&sp[i].classList.remove('play');
    if(!await wait(1000*Math.max(1.0,(ch[i][1]-ch[i][0])*1.5),t))return; }
  if(!await wait(400,t))return; await playSeg(n,0,0,t); el.classList.remove('now'); }
async function shadow(btn){ if(btn.classList.contains('on')){stop();return} const t=++token; btn.classList.add('on');
  const cards=[...document.querySelectorAll('.sent[data-n]')];
  for(const c of cards){ const n=c.dataset.n; c.classList.add('now'); c.scrollIntoView({block:'center',behavior:'smooth'});
    if(!await playSeg(n,0,0,t))return; if(!await wait(1000*dur(n)*1.5,t))return; c.classList.remove('now'); }
  btn.classList.remove('on'); }
async function dialog(btn){ if(btn.classList.contains('on')){stop();return} const t=++token; btn.classList.add('on');
  const ls=[...document.querySelectorAll('.dlg .ln')]; const s=(meta.a.dlg||{}).starts||[];
  A.src=src('dlg'); A.currentTime=0; A.play();
  const tick=()=>{ if(t!==token){A.pause();return} const c=A.currentTime; let k=-1; s.forEach((x,i)=>{if(c>=x)k=i});
    ls.forEach((l,i)=>l.classList.toggle('now',i===k)); if(A.ended){ls.forEach(l=>l.classList.remove('now'));btn.classList.remove('on');return} requestAnimationFrame(tick)};
  requestAnimationFrame(tick); }
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-play],[data-chunk],[data-run],.flip,.try,.dlg .ln'); if(!b)return;
  if(b.dataset.play){ play(b.dataset.play,b.closest('.sent,.snd-i,.vb,.flip')); }
  else if(b.dataset.chunk){ chunkPlay(b.dataset.chunk,b.closest('.sent,.snd-i,.try,.step')); }
  else if(b.dataset.run==='shadow') shadow(b);
  else if(b.dataset.run==='dlg') dialog(b);
  else if(b.dataset.run==='stop') stop();
  else if(b.dataset.run==='rep'){ st.rep=!st.rep; b.classList.toggle('on',st.rep); }
  else if(b.dataset.run==='ko'){ document.body.classList.toggle('hideko'); b.classList.toggle('on',document.body.classList.contains('hideko')); }
  else if(b.classList.contains('flip')){ b.classList.toggle('open'); if(b.classList.contains('open')) play(b.dataset.k,null); }
  else if(b.classList.contains('try')){ if(e.target.closest('button'))return; b.classList.toggle('open'); }
  else if(b.classList.contains('ln')){ play(b.dataset.k,b); }
});
// daily check (localStorage only)
const K='de100'; const all=JSON.parse(localStorage.getItem(K)||'{}'); const me=all[meta.id]||{steps:[]};
const boxes=[...document.querySelectorAll('.chk input')];
function save(){ me.steps=boxes.map(x=>x.checked); const ok=boxes.length&&boxes.every(x=>x.checked);
  if(ok&&!me.done) me.done=new Date().toISOString().slice(0,10); if(!ok) delete me.done;
  all[meta.id]=me; localStorage.setItem(K,JSON.stringify(all)); const d=document.querySelector('.done'); if(d){d.style.display=me.done?'block':'none'; d.textContent='오늘 공부 완료! '+(me.done||'')} }
boxes.forEach((x,i)=>{x.checked=!!me.steps[i]; x.addEventListener('change',save)}); save();
})();
