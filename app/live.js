/* real-time voice (Gemini Live) for the AI call and the interpreter: mic -> 16 kHz PCM -> WebSocket; 24 kHz PCM -> speaker.
   The phone only gets a 1-use, 5-minute token from our proxy. Any failure -> the caller falls back to the text pipeline. */
window.deLive=(function(){
var AC=window.AudioContext||window.webkitAudioContext,ctx=null,wkReady=null;
function supported(){return !!(AC&&window.WebSocket&&window.AudioWorkletNode&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)&&!/[?&]live=0/.test(location.search);}
function audio(){if(!ctx){ctx=new AC();}if(ctx.state==='suspended'){try{ctx.resume();}catch(e){}}return ctx;}   /* call inside a tap */
var WK="class P extends AudioWorkletProcessor{constructor(){super();this.r=sampleRate/16000;this.a=0;this.o=new Int16Array(1600);this.n=0;this.s=0;this.k=0;}"+
 "process(i){var c=i[0]&&i[0][0];if(!c)return true;for(var j=0;j<c.length;j++){var v=c[j];this.s+=v*v;this.k++;this.a+=1;if(this.a>=this.r){this.a-=this.r;v=v<-1?-1:v>1?1:v;this.o[this.n++]=v*32767;"+
 "if(this.n===1600){this.port.postMessage({pcm:this.o.buffer.slice(0),rms:Math.sqrt(this.s/Math.max(1,this.k))});this.n=0;this.s=0;this.k=0;}}}return true;}}registerProcessor('de-mic',P);";
function b64(buf){var b=new Uint8Array(buf),s='',i;for(i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s);}
function unb64(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;}
/* ---------- mic ---------- */
function Mic(onChunk){var st=null,node=null,src=null,on=false;
 this.start=function(){var c=audio();if(!wkReady)wkReady=c.audioWorklet.addModule(URL.createObjectURL(new Blob([WK],{type:'application/javascript'})));
  return Promise.all([wkReady,navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}})]).then(function(r){st=r[1];
   src=c.createMediaStreamSource(st);node=new AudioWorkletNode(c,'de-mic');node.port.onmessage=function(e){if(on)onChunk(b64(e.data.pcm),e.data.rms);};
   var g=c.createGain();g.gain.value=0;src.connect(node);node.connect(g);g.connect(c.destination);on=true;window.__liveMic=(window.__liveMic||0)+1;});};
 this.pause=function(v){on=!v;};
 this.stop=function(){on=false;try{src&&src.disconnect();node&&node.disconnect();}catch(e){}if(st)st.getTracks().forEach(function(t){t.stop();});st=null;};}
/* ---------- speaker ---------- */
function Player(){var nextT=0,srcs=[],self=this;this.rate=1;
 this.play=function(data){var c=audio(),i16=new Int16Array(unb64(data)),f=new Float32Array(i16.length);for(var i=0;i<i16.length;i++)f[i]=i16[i]/32768;
  var buf=c.createBuffer(1,f.length,24000);buf.copyToChannel?buf.copyToChannel(f,0):buf.getChannelData(0).set(f);var s=c.createBufferSource();s.buffer=buf;s.playbackRate.value=self.rate;s.connect(c.destination);
  var t=Math.max(c.currentTime+0.03,nextT);s.start(t);nextT=t+buf.duration/self.rate;srcs.push(s);s.onended=function(){srcs.splice(srcs.indexOf(s),1);};window.__livePlayed=(window.__livePlayed||0)+1;};
 this.stop=function(){srcs.slice().forEach(function(s){try{s.stop();}catch(e){}});srcs=[];nextT=0;};
 this.busy=function(){return !!ctx&&nextT>ctx.currentTime+0.05;};
 this.endsIn=function(){return ctx?Math.max(0,nextT-ctx.currentTime):0;};}
/* ---------- session ---------- */
function Session(ws_url,s,h){var ws,ready=false,closed=false,me=this;
 this.open=function(){ws=new WebSocket(ws_url+'?access_token='+encodeURIComponent(s.token));
  ws.onopen=function(){ws.send(JSON.stringify({setup:s.setup}));};
  ws.onmessage=function(ev){(typeof ev.data==='string'?Promise.resolve(ev.data):ev.data.text()).then(function(t){var m;try{m=JSON.parse(t);}catch(e){return;}
   if(m.setupComplete){ready=true;h.ready&&h.ready();return;}
   var sc=m.serverContent;if(sc){if(sc.inputTranscription&&sc.inputTranscription.text)h.inTx&&h.inTx(sc.inputTranscription.text);
    if(sc.outputTranscription&&sc.outputTranscription.text)h.outTx&&h.outTx(sc.outputTranscription.text);
    ((sc.modelTurn&&sc.modelTurn.parts)||[]).forEach(function(p){if(p.inlineData&&p.inlineData.data)h.audio&&h.audio(p.inlineData.data);});
    if(sc.interrupted)h.interrupted&&h.interrupted();if(sc.turnComplete)h.turnDone&&h.turnDone();}
   if(m.goAway)h.goAway&&h.goAway();});};
  ws.onclose=function(e){if(closed)return;closed=true;h.closed&&h.closed(e.code,ready);};ws.onerror=function(){};};
 this.ready=function(){return ready&&!closed;};
 this.sendAudio=function(d){if(ready&&!closed&&ws.readyState===1)ws.send(JSON.stringify({realtimeInput:{audio:{data:d,mimeType:'audio/pcm;rate=16000'}}}));};
 this.sendText=function(t){if(ready&&!closed&&ws.readyState===1)ws.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:t}]}],turnComplete:true}}));};
 this.close=function(){closed=true;try{ws.close();}catch(e){}};}
/* random id kept only on this phone: lets the server count per phone (a whole church shares one Wi-Fi address) */
function devId(){var k='de100dev',v=null;try{v=localStorage.getItem(k);}catch(e){}if(!v||!/^[a-z0-9]{12,40}$/.test(v)){v=(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)+Date.now().toString(36)).replace(/[^a-z0-9]/g,'').slice(0,24);try{localStorage.setItem(k,v);}catch(e){}}return v;}
function tokens(U,body){body=Object.assign({dev:devId()},body);var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ctl)ctl.abort();},7000);
 return fetch(U.replace(/\/$/,'')+'/live-token',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl?ctl.signal:undefined,body:JSON.stringify(body)})
  .then(function(r){clearTimeout(tm);return r.json().catch(function(){return {};}).then(function(j){if(r.status===200&&j.sessions)return j;throw {error:j.error||'http'+r.status,status:r.status};});},function(){clearTimeout(tm);throw {error:'network'};});}
return {supported:supported,audio:audio,Mic:Mic,Player:Player,Session:Session,tokens:tokens,dev:devId};})();
