/* 노래 파일 악보 만들기 – 브라우저 안에서만 동작 (파일 전송 없음) */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var NAME_S=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var NAME_F=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
var FIFTHS={0:0,7:1,2:2,9:3,4:4,11:5,6:6,1:-5,8:-4,3:-3,10:-2,5:-1};
var SHARP_ORD=['F','C','G','D','A','E','B'],FLAT_ORD=['B','E','A','D','G','C','F'];
var LETTERS=['C','D','E','F','G','A','B'];
var FPS=22050/256; // Basic Pitch 프레임 속도
var S={file:null,url:null,frames:null,onsets:null,notes:[],dur:0,bpm:0,t0:0,key:null,kind:'mix',lenSec:60,density:'mid',shift:0,chordBars:[],melody:[],bars:0,busy:false};
var BP=null,audioCtx=null,playTimer=null,playNodes=[];

/* ---------- 작은 도구 ---------- */
function setProg(p,t){$('#prog').classList.remove('hide');$('#progBar').style.width=Math.round(p*100)+'%';if(t)$('#progTxt').textContent=t}
function err(m){$('#err').textContent=m||''}
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('도구를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'))};document.head.appendChild(s)})}
function pcName(pc,flat){return (flat?NAME_F:NAME_S)[((pc%12)+12)%12]}
function midiName(m,flat){return pcName(m,flat)+(Math.floor(m/12)-1)}
function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}

/* ---------- 파일 읽기 ---------- */
async function decode(file,maxSec){
  var buf=await file.arrayBuffer();
  var AC=window.AudioContext||window.webkitAudioContext;
  var ctx=new AC();
  var ab;
  try{ab=await ctx.decodeAudioData(buf.slice(0))}catch(e){try{ctx.close()}catch(_){};throw new Error('이 파일은 읽을 수 없어요. mp3, wav, m4a 파일인지 확인해 주세요.')}
  var total=ab.duration;
  var useSec=maxSec>0?Math.min(maxSec,total):total;
  var n=Math.floor(useSec*22050);
  var off=new OfflineAudioContext(1,n,22050);
  var src=off.createBufferSource();
  src.buffer=ab;src.connect(off.destination);src.start(0);
  var out=await off.startRendering();
  try{ctx.close()}catch(_){}
  return {audio:out,total:total,used:useSec};
}

/* ---------- Basic Pitch ---------- */
async function runModel(audio){
  if(!window.BasicPitchLib){setProg(.05,'분석 도구를 내려받는 중… (처음 한 번만 느려요)');await loadScript('bp.bundle.js')}
  var L=window.BasicPitchLib;
  var frames=[],onsets=[];
  setProg(.12,'음을 찾는 중…');
  var bp=new L.BasicPitch('model/model.json');
  await bp.evaluateModel(audio,function(f,o){for(var i=0;i<f.length;i++){frames.push(f[i]);onsets.push(o[i])}},function(p){setProg(.12+p*.7,'음을 찾는 중… '+Math.round(p*100)+'%')});
  S.frames=frames;S.onsets=onsets;
}
function extractNotes(){
  var L=window.BasicPitchLib;
  var th={few:[0.5,0.4,11],mid:[0.35,0.3,7],many:[0.25,0.25,5]}[S.density];
  var ev=L.noteFramesToTime(L.outputToNotesPoly(S.frames,S.onsets,th[0],th[1],th[2]));
  ev.sort(function(a,b){return a.startTimeSeconds-b.startTimeSeconds});
  S.notes=ev.map(function(n){return {t:n.startTimeSeconds,d:n.durationSeconds,m:n.pitchMidi,a:n.amplitude}});
}

/* ---------- BPM / 박 위치 ---------- */
function detectTempo(){
  var N=S.onsets.length;if(N<200){S.bpm=100;S.t0=0;return}
  var env=new Float32Array(N);
  for(var i=0;i<N;i++){var s=0,r=S.onsets[i];for(var j=0;j<r.length;j++)s+=r[j];env[i]=s}
  var mean=0;for(i=0;i<N;i++)mean+=env[i];mean/=N;for(i=0;i<N;i++)env[i]=Math.max(0,env[i]-mean*0.8);
  var maxLag=Math.ceil(FPS*60/55*4)+2,ac=new Float32Array(maxLag+2);
  for(var lag=1;lag<=maxLag;lag++){var sum=0;for(i=0;i+lag<N;i++)sum+=env[i]*env[i+lag];ac[lag]=sum/(N-lag)}
  function A(l){var i0=Math.floor(l),f=l-i0;if(i0<1||i0+1>maxLag)return 0;return ac[i0]*(1-f)+ac[i0+1]*f}
  var best=0,bestB=100;
  for(var b=60;b<=180;b+=0.5){
    var L=FPS*60/b;
    var sc=A(L)+0.5*A(L*2)+0.25*A(L*4)+0.3*A(L/2);
    var prior=Math.exp(-0.5*Math.pow(Math.log2(b/100)/0.55,2));
    sc*=prior;
    if(sc>best){best=sc;bestB=b}
  }
  // 정수에 가까우면 붙이기
  if(Math.abs(bestB-Math.round(bestB))<0.35)bestB=Math.round(bestB);
  // 음표 시작 시각이 16분음표 격자에 가장 잘 맞는 BPM으로 다듬기
  var on=S.notes.filter(function(n){return n.a>0.15});
  var bestR=-1,bestBpm=bestB,bestPh=0;
  if(on.length>12){
    for(var bb=bestB-2.5;bb<=bestB+2.5;bb+=0.05){
      var ssB=60/bb/4,cs=0,sn=0,tw=0;
      for(var q0=0;q0<on.length;q0++){var th=2*Math.PI*on[q0].t/ssB,w=on[q0].a;cs+=w*Math.cos(th);sn+=w*Math.sin(th);tw+=w}
      var R=Math.sqrt(cs*cs+sn*sn)/tw;
      // 원래 추정에서 너무 멀어지면 약하게 감점
      R-=Math.abs(bb-bestB)*0.004;
      if(R>bestR){bestR=R;bestBpm=bb;bestPh=Math.atan2(sn,cs)}
    }
    if(bestR>0.35){bestB=Math.round(bestBpm*20)/20;}else{bestPh=null}
  }else bestPh=null;
  S.bpm=bestB;
  var P=FPS*60/S.bpm,bph;
  if(bestPh!==null){
    var ss2=60/S.bpm/4,phSec=((bestPh/(2*Math.PI))*ss2%ss2+ss2)%ss2;
    var bj=0,bjs=-1;
    for(var jj=0;jj<4;jj++){
      var ph0=(phSec+jj*ss2)*FPS,sc3=0;
      for(var kq=0;ph0+kq*P<N;kq++){var ixq=Math.round(ph0+kq*P);if(ixq<N)sc3+=env[ixq]}
      if(sc3>bjs){bjs=sc3;bj=jj}
    }
    bph=(phSec+bj*ss2)*FPS;
  }else{
    var bp=0;bph=0;
    for(var ph=0;ph<P;ph+=0.5){var sc2=0;for(var k=0;ph+k*P<N;k++){var ix=Math.round(ph+k*P);if(ix<N)sc2+=env[ix]}if(sc2>bp){bp=sc2;bph=ph}}
  }
  // 마디 첫 박 찾기 (4박 중 가장 강한 곳 + 낮은 음)
  var lowE=new Float32Array(4),strong=new Float32Array(4);
  for(var k2=0;bph+k2*P<N;k2++){var ix2=Math.round(bph+k2*P);if(ix2<N)strong[k2%4]+=env[ix2]}
  var tt=bph/FPS;
  S.notes.forEach(function(n){if(n.m<55){var kk=Math.round((n.t-tt)/(P/FPS));if(kk>=0)lowE[kk%4]+=n.a}});
  var db=0,dbs=-1;
  for(var q=0;q<4;q++){var v=strong[q]/(strong[0]+strong[1]+strong[2]+strong[3]+1e-6)+lowE[q]/(lowE[0]+lowE[1]+lowE[2]+lowE[3]+1e-6);if(v>dbs){dbs=v;db=q}}
  var t0=(bph+db*P)/FPS,barSec=4*P/FPS;
  var first=S.notes.length?S.notes[0].t:0;
  t0+=Math.floor((first-t0+0.05)/barSec)*barSec;
  S.t0=t0;
}

/* ---------- 키 ---------- */
var MAJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
var MIN=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
function corr(a,b){var ma=0,mb=0,i;for(i=0;i<12;i++){ma+=a[i];mb+=b[i]}ma/=12;mb/=12;var n=0,da=0,db=0;for(i=0;i<12;i++){n+=(a[i]-ma)*(b[i]-mb);da+=Math.pow(a[i]-ma,2);db+=Math.pow(b[i]-mb,2)}return n/Math.sqrt(da*db+1e-9)}
function detectKey(){
  var h=new Array(12).fill(0);
  S.notes.forEach(function(n){h[n.m%12]+=n.d*(0.3+n.a)*(n.m<48?1.2:1)});
  var best=-2,key=null;
  for(var t=0;t<12;t++){
    var rot=[];for(var i=0;i<12;i++)rot.push(h[(i+t)%12]);
    var cM=corr(rot,MAJ),cm=corr(rot,MIN);
    if(cM>best){best=cM;key={tonic:t,minor:false}}
    if(cm>best){best=cm;key={tonic:t,minor:true}}
  }
  S.key=key||{tonic:0,minor:false};
}
function keyInfo(key,shift){
  var t=((key.tonic+shift)%12+12)%12;
  var relMaj=key.minor?(t+3)%12:t;
  var fifths=FIFTHS[relMaj];
  var flat=fifths<0;
  var name=pcName(t,flat)+(key.minor?'m':'');
  var disp=pcName(t,flat)+(key.minor?' minor':' major');
  var sig={};LETTERS.forEach(function(l){sig[l]=0});
  if(fifths>0)for(var i=0;i<fifths;i++)sig[SHARP_ORD[i]]=1;
  if(fifths<0)for(var j=0;j<-fifths;j++)sig[FLAT_ORD[j]]=-1;
  // 온음계 pc 집합
  var scale=key.minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
  var pcs=scale.map(function(x){return (t+x)%12});
  return {t:t,minor:key.minor,fifths:fifths,flat:flat,name:name,disp:disp,sig:sig,pcs:pcs,tonic:t,relMaj:relMaj};
}

/* ---------- 박 격자 ---------- */
function stepSec(){return 60/S.bpm/4}
function toStep(t){return Math.round((t-S.t0)/stepSec())}

/* ---------- 멜로디 ---------- */
function buildMelody(){
  var ss=stepSec(),lo=S.kind==='solo'?36:57,hi=S.kind==='solo'?96:84;
  var cand=S.notes.filter(function(n){return n.m>=lo&&n.m<=hi&&n.d>=ss*0.9});
  var groups={};
  cand.forEach(function(n){var st=toStep(n.t);if(st<0)return;(groups[st]=groups[st]||[]).push(n)});
  var byStep={};
  Object.keys(groups).forEach(function(k){
    var g=groups[k];
    // 한 옥타브 아래에 비슷한 세기의 음이 있으면 윗음은 배음으로 보고 버림
    g=g.filter(function(x){return !g.some(function(y){return y.m===x.m-12&&y.a>=1.25*x.a})});
    var bestN=null,bs=-1e9;
    g.forEach(function(n){
      var score=n.a+(S.kind==='solo'?0.003:0.010)*(n.m-60)+Math.min(n.d,1)*0.2;
      if(score>bs){bs=score;bestN=n}
    });
    if(bestN){var st=+k;byStep[st]={st:st,m:bestN.m,end:Math.max(st+1,toStep(bestN.t+bestN.d)),score:bs}}
  });
  var arr=Object.keys(byStep).map(function(k){return byStep[k]}).sort(function(a,b){return a.st-b.st});
  // 겹침 정리: 앞 음을 다음 음 시작까지 자르기
  for(var i=0;i<arr.length;i++){
    var nx=arr[i+1];
    if(nx&&arr[i].end>nx.st)arr[i].end=nx.st;
    if(arr[i].end<=arr[i].st)arr[i].end=arr[i].st+1;
  }
  arr=arr.filter(function(a){return a.end>a.st});
  // 같은 음 연속 짧은 간격 합치기
  var out=[];
  arr.forEach(function(a){
    var p=out[out.length-1];
    if(p&&p.m===a.m&&a.st-p.end<=0){p.end=a.end}else out.push(a);
  });
  // 튀는 음 정리: 앞뒤 음과 9반음 이상 멀고 아주 짧은 음은 버리기
  if(S.density!=='many'){
    out=out.filter(function(a,i){
      var p=out[i-1],n=out[i+1];
      if(a.end-a.st>1)return true;
      var far=function(x){return !x||Math.abs(x.m-a.m)>=9};
      return !(far(p)&&far(n)&&(p||n));
    });
  }
  // 짧은(2스텝 이하) 음계 밖 음은 가까운 음계음으로 맞추기
  if(S.key&&S.density!=='many'){
    var ki=keyInfo(S.key,0);
    out.forEach(function(a){
      if(a.end-a.st<=1&&ki.pcs.indexOf(a.m%12)<0){
        for(var d=1;d<=2;d++){
          if(ki.pcs.indexOf((a.m+d)%12)>=0){a.m+=d;break}
          if(ki.pcs.indexOf(((a.m-d)%12+12)%12)>=0){a.m-=d;break}
        }
      }
    });
  }
  S.melody=out;
  var last=out.length?out[out.length-1].end:16;
  S.bars=Math.max(1,Math.ceil(last/16));
  S.bars=Math.min(S.bars,Math.ceil((S.dur||1)/(4*60/S.bpm))+1);
}

/* ---------- 코드 ---------- */
var CT=[
  {n:'',iv:[0,4,7],p:0,suf:''},
  {n:'m',iv:[0,3,7],p:0,suf:'m'},
  {n:'7',iv:[0,4,7,10],p:0.06,suf:'7'},
  {n:'maj7',iv:[0,4,7,11],p:0.06,suf:'maj7'},
  {n:'m7',iv:[0,3,7,10],p:0.05,suf:'m7'},
  {n:'dim',iv:[0,3,6],p:0.1,suf:'dim'}
];
function detectChords(){
  var bars=S.bars,segs=bars*2,ss=stepSec(),segSec=ss*8;
  var W=[];for(var s=0;s<segs;s++)W.push(new Array(12).fill(0));
  S.notes.forEach(function(n){
    if(n.m<28||n.m>88)return;
    var a=n.t-S.t0,b=a+n.d;
    var s0=Math.max(0,Math.floor(a/segSec)),s1=Math.min(segs-1,Math.floor(b/segSec));
    for(var k=s0;k<=s1;k++){
      var ov=Math.min(b,(k+1)*segSec)-Math.max(a,k*segSec);
      if(ov<=0)continue;
      var wgt=ov*(0.3+n.a)*(n.m<55?1.6:(n.m>76?0.6:1));
      W[k][n.m%12]+=wgt;
    }
  });
  var key=keyInfo(S.key,0);
  var states=[];
  for(var r=0;r<12;r++)for(var t=0;t<CT.length;t++){
    var dia=key.pcs.indexOf(r)>=0;
    states.push({r:r,t:t,dia:dia});
  }
  function emis(w,st){
    var tot=0;for(var i=0;i<12;i++)tot+=w[i];
    if(tot<1e-4)return 0;
    var T=CT[st.t],inn=0,out=0;
    var set={};T.iv.forEach(function(x){set[(st.r+x)%12]=1});
    for(i=0;i<12;i++){if(set[i])inn+=w[i];else out+=w[i]}
    var sc=(inn-0.55*out)/tot+0.25*w[st.r]/tot-T.p+(st.dia?0.05:-0.02);
    // 3화음 구성음이 하나라도 거의 없으면 감점
    var miss=0;T.iv.forEach(function(x){if(w[(st.r+x)%12]/tot<0.03)miss++});
    sc-=0.12*miss;
    return sc;
  }
  var NS=states.length,SW=0.13;
  var dp=[],bk=[];
  for(var k=0;k<segs;k++){
    var row=new Array(NS),bkr=new Array(NS);
    var bestPrev=-1e9,bi=0;
    if(k>0){for(var q=0;q<NS;q++)if(dp[k-1][q]>bestPrev){bestPrev=dp[k-1][q];bi=q}}
    for(var j=0;j<NS;j++){
      var e=emis(W[k],states[j]);
      if(k===0){row[j]=e;bkr[j]=-1}
      else{
        var stay=dp[k-1][j],sw=bestPrev-SW;
        if(stay>=sw){row[j]=stay+e;bkr[j]=j}else{row[j]=sw+e;bkr[j]=bi}
      }
    }
    dp.push(row);bk.push(bkr);
  }
  var path=new Array(segs),bj=0,bv=-1e9;
  for(var z=0;z<NS;z++)if(dp[segs-1][z]>bv){bv=dp[segs-1][z];bj=z}
  for(var kk=segs-1;kk>=0;kk--){path[kk]=bj;bj=bk[kk][bj]<0?bj:bk[kk][bj]}
  // 빈 구간은 이전 코드 유지
  var segChord=path.map(function(pi,k){
    var tot=0;W[k].forEach(function(x){tot+=x});
    return {r:states[pi].r,t:states[pi].t,empty:tot<1e-4};
  });
  var bars2=[];
  for(var b=0;b<bars;b++){
    var c1=segChord[b*2],c2=segChord[b*2+1];
    bars2.push({a:c1,b:c2});
  }
  S.chordBars=bars2.map(function(x){return {a:{r:x.a.r,t:x.a.t,empty:x.a.empty},b:{r:x.b.r,t:x.b.t,empty:x.b.empty}}});
}
function refineKey(){
  if(!S.chordBars.length||!S.key)return false;
  var cur=S.key,rel=cur.minor?{tonic:(cur.tonic+3)%12,minor:false}:{tonic:(cur.tonic+9)%12,minor:true};
  function score(k){
    var sc=0,seq=S.chordBars.map(function(b){return b.a});
    var tri=function(c,r,minor){return c.r===r&&(minor?(c.t===1||c.t===4):(c.t===0||c.t===2||c.t===3))};
    seq.forEach(function(c,i){
      if(tri(c,k.tonic,k.minor))sc+=1;
      if(tri(c,(k.tonic+7)%12,false))sc+=0.5;
      if(!k.minor&&tri(c,(k.tonic+5)%12,false))sc+=0.3;
      if(k.minor&&tri(c,(k.tonic+8)%12,false))sc+=0.3;
    });
    if(seq.length){
      if(tri(seq[seq.length-1],k.tonic,k.minor))sc+=2;
      if(tri(seq[0],k.tonic,k.minor))sc+=1;
    }
    return sc;
  }
  var a=score(cur),b=score(rel);
  if(b>a+0.6){S.key=rel;return true}
  return false;
}
function chordName(c,shift,flat){return pcName(c.r+shift,flat)+CT[c.t].suf}
function chordFromText(txt){ // "Am7" → {r,t}
  var m=String(txt).trim().match(/^([A-Ga-g])([#b♯♭]?)(.*)$/);
  if(!m)return null;
  var base={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1].toUpperCase()];
  var acc=m[2]==='#'||m[2]==='♯'?1:(m[2]==='b'||m[2]==='♭'?-1:0);
  var suf=m[3].trim();
  var map={'':0,'maj':0,'M':0,'m':1,'min':1,'-':1,'7':2,'maj7':3,'M7':3,'m7':4,'min7':4,'dim':5,'°':5};
  if(!(suf in map))return null;
  return {r:((base+acc)%12+12)%12,t:map[suf]};
}
function barText(i){
  var key=keyInfo(S.key,S.shift),b=S.chordBars[i];
  var a=chordName(b.a,S.shift,key.flat),c=chordName(b.b,S.shift,key.flat);
  return (a===c)?a:(a+' '+c);
}
function setBarFromText(i,txt){
  var key=S.shift;
  var parts=txt.trim().split(/\s+/).filter(Boolean);
  var cs=parts.map(chordFromText);
  if(!cs.length||cs.some(function(x){return !x}))return false;
  var c1=cs[0],c2=cs[1]||cs[0];
  function unshift(c){return {r:((c.r-key)%12+12)%12,t:c.t,empty:false}}
  S.chordBars[i]={a:unshift(c1),b:unshift(c2)};
  return true;
}

/* ---------- 패턴 이름 ---------- */
var PATS=[
  {seq:[0,7,9,5],name:'I–V–vi–IV · 가장 흔한 팝 진행'},
  {seq:[9,5,0,7],name:'vi–IV–I–V · 감성 팝 진행'},
  {seq:[0,9,5,7],name:'I–vi–IV–V · 50년대 진행(올드 팝)'},
  {seq:[5,7,4,9],name:'IV–V–iii–vi · 왕도 진행(J-pop 스타일)'},
  {seq:[0,5,9,7],name:'I–IV–vi–V'},
  {seq:[9,7,5,7],name:'vi–V–IV–V'},
  {seq:[2,7,0,0],name:'ii–V–I · 재즈 기본 진행'}
];
function patternName(){
  var key=keyInfo(S.key,0),base=key.relMaj;
  var seq=[];
  S.chordBars.forEach(function(b){
    var c=b.a;var d=((c.r-base)%12+12)%12;
    // 단조의 으뜸(i)은 vi 로 읽기: relMaj 기준이라 이미 반영됨
    seq.push(d);
  });
  // 연속 중복 제거
  var u=[];seq.forEach(function(x){if(!u.length||u[u.length-1]!==x)u.push(x)});
  var bestN=0,bestP=null;
  PATS.forEach(function(p){
    var cnt=0;
    for(var i=0;i+3<u.length;i++){
      if(u[i]===p.seq[0]&&u[i+1]===p.seq[1]&&u[i+2]===p.seq[2]&&u[i+3]===p.seq[3])cnt++;
    }
    if(cnt>bestN){bestN=cnt;bestP=p}
  });
  return bestP&&bestN>=1?bestP.name+' ('+bestN+'번 반복)':'';
}

/* ---------- ABC 만들기 ---------- */
function abcPitch(m,state,key){
  var pc=((m%12)+12)%12,oct=Math.floor(m/12)-1;
  var letter=null,acc=0;
  // 온음계 안: 키 설정으로 철자 결정
  for(var i=0;i<7;i++){
    var L=LETTERS[i],base={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[L]+key.sig[L];
    if(((base%12)+12)%12===pc){letter=L;acc=key.sig[L];break}
  }
  if(letter===null){
    var nm=(key.flat?NAME_F:NAME_S)[pc];
    letter=nm[0];acc=nm.length>1?(nm[1]==='#'?1:-1):0;
  }
  // 옥타브 (B# / Cb 보정은 생략)
  var id=letter+oct;
  var cur=state[id];if(cur===undefined)cur=key.sig[letter];
  var pre='';
  if(acc!==cur){pre=acc===1?'^':acc===-1?'_':'=';state[id]=acc}
  var s=pre,oc=oct;
  if(oc>=5){s+=letter.toLowerCase()+Array(oc-5+1).join("'")}
  else{s+=letter+Array(4-oc+1).join(',')}
  return s;
}
function splitLen(n){ // 16분음표 개수를 표기 가능한 길이로 쪼개기
  var allowed=[16,12,8,6,4,3,2,1],out=[];
  while(n>0){for(var i=0;i<allowed.length;i++)if(allowed[i]<=n){out.push(allowed[i]);n-=allowed[i];break}}
  return out;
}
function titleText(){
  var t=(S.title||'').replace(/[\r\n]+/g,' ').trim();
  return t||'자동 채보';
}
function setTitleAuto(t){
  if(S.titleEdited||!t)return;
  S.title=String(t).replace(/\.[A-Za-z0-9]{2,4}$/,'').replace(/[_]+/g,' ').trim();
  var el=document.getElementById('scTitle');if(el)el.value=S.title;
}
function lyrTokens(line){
  var m=String(line||'').replace(/\[[^\]]*\]|\([^)]*\)/g,' ').match(/[가-힣]|[A-Za-z0-9]+/g);
  return m||[];
}
var TSRE=/\[(\d{1,3}):(\d{2}(?:[.:]\d{1,3})?)\]/g;
function lyrData(){
  var el=document.getElementById('lyIn');
  var d={timed:false,lines:[],entries:[],ti:''};if(!el)return d;
  var raw=el.value.replace(/^\uFEFF/,'').replace(/<\d{1,3}:\d{2}(?:[.:]\d{1,3})?>/g,'');
  var rows=raw.split(/\r\n|\r|\n/),ents=[];
  rows.forEach(function(r){
    var mt=/^\s*\[ti:([^\]]*)\]/i.exec(r);if(mt){d.ti=mt[1].trim();return}
    var ts=[],m;TSRE.lastIndex=0;
    while((m=TSRE.exec(r)))ts.push(parseInt(m[1],10)*60+parseFloat(m[2].replace(':','.')));
    var txt=r.replace(TSRE,'');
    if(/^\s*[\[(][^\])]*[\])]\s*$/.test(txt))txt='';
    if(ts.length){var tk=lyrTokens(txt);ts.forEach(function(t){ents.push({t:t,syl:tk})})}
    d.lines.push(/^\s*[\[(][^\])]*[\])]\s*$/.test(r)&&!ts.length?null:txt);
  });
  d.lines=d.lines.filter(function(x){return x!==null}).map(lyrTokens);
  ents=ents.filter(function(e){return e.syl.length}).sort(function(a,b){return a.t-b.t});
  if(ents.length>=2){d.timed=true;d.entries=ents}
  return d;
}
function lyrLines(){return lyrData().lines}
function lyrW(syl,flags){
  var idx=[],i;for(i=0;i<flags.length;i++)if(!flags[i])idx.push(i);
  var m=idx.length,n=syl.length;if(!m||!n)return '';
  var out=[],k=0;
  for(i=0;i<flags.length;i++){
    if(flags[i]){out.push('*');continue}
    var a=Math.floor(k*n/m),b=Math.floor((k+1)*n/m);k++;
    out.push(b>a?syl.slice(a,b).join('~'):'*');
  }
  return out.join(' ');
}
function buildABC(){
  var key=keyInfo(S.key,S.shift);
  var shift=S.shift;
  var lines=['X:1','T:'+titleText(),'M:4/4','L:1/16','Q:1/4='+Math.round(S.bpm),'K:'+key.name];
  var mel=S.melody.map(function(n){return {st:n.st,end:n.end,m:n.m+shift}});
  // 스텝별 이벤트
  var bars=S.bars,out=[],mi=0;
  var body='',lineStr='',lineFlags=[],lineSteps=[],prevTie=false,LD=lyrData(),LL=LD.lines,ss=stepSec(),outLines=[],allNotes=[];S.evT=[];
  for(var b=0;b<bars;b++){
    var bs=b*16,be=bs+16,state={},bar='';
    var ch=S.chordBars[b];
    var chA=chordName(ch.a,shift,key.flat),chB=chordName(ch.b,shift,key.flat);
    var evs=[]; // {st,len,m|null,tie}
    var cur=bs;
    while(mi<mel.length&&mel[mi].st<be){
      var n=mel[mi];
      var st=Math.max(n.st,bs),en=Math.min(n.end,be);
      if(st>cur)evs.push({st:cur,len:st-cur,m:null});
      if(en>st)evs.push({st:st,len:en-st,m:n.m,cont:n.end>be});
      cur=Math.max(cur,en);
      if(n.end>be){ // 다음 마디로 이어짐
        mel[mi]={st:be,end:n.end,m:n.m,cont:true};
        break;
      }
      mi++;
    }
    if(cur<be)evs.push({st:cur,len:be-cur,m:null});
    // 반 마디(8)에서 쪼개기: 코드가 다르면
    var final=[];
    evs.forEach(function(e){
      if(e.st<bs+8&&e.st+e.len>bs+8&&chA!==chB){
        final.push({st:e.st,len:bs+8-e.st,m:e.m,tieNext:e.m!==null});
        final.push({st:bs+8,len:e.st+e.len-(bs+8),m:e.m,cont:e.cont});
      }else final.push(e);
    });
    var first=true;
    final.forEach(function(e,idx){
      var parts=splitLen(e.len),acc=0;
      parts.forEach(function(L,pi){S.evT.push(e.st+acc);acc+=L;
        var sym='';
        if(pi===0){
          if(e.st===bs)sym='"'+chA+'"';
          else if(e.st===bs+8&&chA!==chB)sym='"'+chB+'"';
        }
        var tie=(pi<parts.length-1)||e.tieNext||(pi===parts.length-1&&e.cont);
        if(e.m===null)bar+=sym+'z'+(L>1?L:'')+' ';
        else{bar+=sym+abcPitch(e.m,state,key)+(L>1?L:'')+(tie?'-':'')+' ';lineFlags.push(prevTie);lineSteps.push(e.st+acc-L);prevTie=!!tie}
      });
    });
    var lastBar=(b===bars-1),eol=((b+1)%4===0)||lastBar;
    lineStr+=bar.trim()+(lastBar?' |]':' |')+(eol?'':' ');
    if(eol){
      var li=Math.floor(b/4);
      outLines.push({str:lineStr.trim(),flags:lineFlags,steps:lineSteps,li:li});
      lineFlags.forEach(function(f,x){allNotes.push({l:outLines.length-1,x:x,step:lineSteps[x],cont:f})});
      lineStr='';lineFlags=[];lineSteps=[];
    }
  }
  var tok={};
  if(LD.timed){
    var E=LD.entries,MEL=S.melody||[];
    var byStep={};allNotes.forEach(function(nt,ix){if(!nt.cont)byStep[nt.step]=nt});
    E.forEach(function(en,x){
      var s0=(en.t-S.t0)/ss,nx=E[x+1]?(E[x+1].t-S.t0)/ss:s0+12/ss;
      var n=en.syl.length;
      // 이 줄 구간의 멜로디 음 (쉼이 0.9초 이상이면 문장 끝)
      var cand=[],prevEnd=null,gapSt=0.9/ss;
      for(var q=0;q<MEL.length;q++){
        var mn=MEL[q];if(mn.st<s0-3)continue;if(mn.st>=nx-1)break;
        if(!byStep[mn.st])continue;
        if(prevEnd!==null&&mn.st-prevEnd>=gapSt&&cand.length>=Math.min(n,3))break;
        cand.push({st:mn.st,end:Math.min(mn.end,nx),nt:byStep[mn.st]});prevEnd=mn.end;
      }
      var m=cand.length;if(!m)return;
      if(m<n){ // 음이 모자라면 한 음에 여러 글자
        cand.forEach(function(c,k){var a=Math.floor(k*n/m),b2=Math.floor((k+1)*n/m);if(b2>a)tok[c.nt.l+':'+c.nt.x]=en.syl.slice(a,b2).join('~')});
        return;
      }
      var f=cand[0].st,L=Math.max(1,cand[m-1].end-f),prev=-1;
      for(var jx=0;jx<n;jx++){
        var tg=f+(jx+0.5)*L/n,lo=prev+1,hi=m-(n-jx),best=lo,bd=1e9;
        for(var k=lo;k<=hi;k++){var d=Math.abs(cand[k].st-tg);if(d<bd){bd=d;best=k}}
        prev=best;var c2=cand[best].nt;tok[c2.l+':'+c2.x]=en.syl[jx];
      }
    });
  }
  outLines.forEach(function(ol,idx){
    body+=ol.str+'\n';
    var w='';
    if(LD.timed){
      var any=false;w=ol.flags.map(function(f,x){var t=tok[idx+':'+x];if(t){any=true;return t}return '*'}).join(' ');if(!any)w='';
    }else{
      var syl=LL[ol.li];if(syl&&syl.length)w=lyrW(syl,ol.flags);
    }
    if(w)body+='w:'+w+'\n';
  });
  lines.push(body);
  return lines.join('\n');
}

/* ---------- 화면 그리기 ---------- */
function render(){
  buildMelody();
  if(!S.chordBars.length||S.chordBars.length!==S.bars){detectChords();if(refineKey())detectChords()}
  drawAll();
}
function drawAll(){
  var key=keyInfo(S.key,S.shift);
  $('#sKey').textContent=key.disp.replace(' major',' 장조').replace(' minor',' 단조');
  $('#sBpm').textContent=Math.round(S.bpm);
  var ms=S.melody.map(function(n){return n.m+S.shift});
  if(ms.length){
    var lo=Math.min.apply(null,ms),hi=Math.max.apply(null,ms);
    $('#sRange').textContent=midiName(lo,key.flat)+' ~ '+midiName(hi,key.flat);
    var sorted=ms.slice().sort(function(a,b){return a-b}),med=sorted[Math.floor(sorted.length/2)];
    var h=(med<63?'남성 보컬에 편한 음역대예요. ':'여성 보컬에 편한 음역대예요. ')+(hi>=79?'가장 높은 음이 꽤 높아서 키를 내리면 부르기 쉬워요.':(lo<=45?'가장 낮은 음이 낮아서 키를 올리면 부르기 쉬워요.':''));
    $('#sHint').textContent=h;
  }else{$('#sRange').textContent='-';$('#sHint').textContent=''}
  $('#shiftTxt').textContent=S.shift===0?'원래 키':('원곡보다 '+(S.shift>0?'+':'')+S.shift+'반음');
  var pat=patternName();$('#patPill').textContent=pat||'';$('#patPill').classList.toggle('hide',!pat);
  var box=$('#chords');box.innerHTML='';
  S.chordBars.forEach(function(b,i){
    var d=document.createElement('div');
    d.innerHTML='<label>'+(i+1)+'마디</label>';
    var inp=document.createElement('input');inp.value=barText(i);inp.setAttribute('aria-label',(i+1)+'마디 코드');
    inp.addEventListener('change',function(){
      if(setBarFromText(i,inp.value)){drawSheetOnly();updMatch()}else{inp.value=barText(i)}
    });
    d.appendChild(inp);box.appendChild(d);
  });
  drawSheetOnly(true);
  updateSuno();
  updMatch();
}
(function(){var t=null;document.addEventListener('input',function(e){if(e.target&&e.target.id==='lyIn'){clearTimeout(t);t=setTimeout(function(){try{lyMsgUpd(true)}catch(x){}},250)}})})();
function lyMsgUpd(redraw){
  var m=document.getElementById('lyMsg'),el=document.getElementById('lyIn');if(!m||!el)return;
  var LDm=lyrData(),has=LDm.lines.some(function(a){return a.length});
  if(el.value.trim()&&!has){m.textContent='⚠ 가사 칸에 글자(가사)가 없어요. 파일에 가사 줄이 없거나 시간표시·정보만 들어 있어요. 가사를 직접 붙여 넣거나 "📝 만든 가사를 악보에 넣기"를 눌러 주세요.';return}
  if(!(S.chordBars&&S.chordBars.length)){m.textContent=has?'가사를 받았어요. 노래 파일로 악보가 만들어지면 자동으로 들어가요.':'';return}
  if(redraw)drawSheetOnly(true);
  var n=document.querySelectorAll('#sheet .abcjs-lyric').length;
  m.textContent=has?(n?('✔ 가사가 악보에 들어갔어요 ('+n+'칸)'+(LDm.timed?' · 시간표시(LRC)에 맞췄어요':'')+(LDm.timed&&LDm.entries[LDm.entries.length-1].t>S.t0+S.bars*16*stepSec()+2?'  ※ 가사 뒤쪽은 분석 범위(앞부분 '+Math.round(S.lenSec)+'초) 밖이에요. "더 정확하게 만들기"에서 분석 범위를 늘리세요.':'')):'가사가 들어갈 음표가 없어요. 위쪽 "음표 양"을 "많이"로 바꿔 보세요.'):'';
}
function drawSheetOnly(skipSuno){
  var abc=buildABC();S.abc=abc;
  try{
    var w=Math.max(280,($('#sheet').clientWidth||600)-16);
    ABCJS.renderAbc('sheet',abc,{responsive:'resize',add_classes:true,staffwidth:w,wrap:{minSpacing:1.6,maxSpacing:2.6,preferredMeasuresPerLine:4}});
  }catch(e){$('#sheet').textContent='악보를 그리지 못했어요: '+e.message}
  try{sheetPrep()}catch(_){}
  if(!skipSuno){updateSuno();var pat=patternName();$('#patPill').textContent=pat||'';$('#patPill').classList.toggle('hide',!pat)}
}
function progressionText(){
  var key=keyInfo(S.key,S.shift),seen=[],out=[];
  S.chordBars.forEach(function(b,i){barText(i).split(' ').forEach(function(c){if(!out.length||out[out.length-1]!==c)out.push(c)})});
  // 앞 16개만
  return out.slice(0,16).join(' - ');
}
function updateSuno(){
  var key=keyInfo(S.key,S.shift);
  var p='tempo '+Math.round(S.bpm)+' bpm, in '+key.disp.replace(' major',' major').replace(' minor',' minor')+', chord progression '+progressionText();
  $('#sunoTxt').value=p+'\n(장르·분위기 단어를 앞에 붙여서 쓰세요. 예: soft piano ballad, '+p.split(',')[0]+')';
  try{if(window.parent!==window)window.parent.postMessage({type:'sm-result',bpm:Math.round(S.bpm),key:key.disp,prog:progressionText(),suno:p},'*')}catch(_){}
}

/* ---------- 소리 내기 ---------- */
function hz(m){return 440*Math.pow(2,(m-69)/12)}
var playRaf=0,playedOrig=false;
function clearFollow(){
  if(playRaf){cancelAnimationFrame(playRaf);playRaf=0}
  $$('#chords>div.on').forEach(function(d){d.classList.remove('on')});
  var n=$('#nowPlay');if(n){n.textContent='';n.classList.add('hide')}
  try{curClear()}catch(_){}
  fbarShow(false);
}
function stopPlay(){
  playNodes.forEach(function(n){try{n.stop()}catch(_){}});playNodes=[];
  if(playTimer){clearTimeout(playTimer);playTimer=null}
  if(playedOrig){try{$('#orig').pause()}catch(_){}playedOrig=false}
  clearFollow();
  $('#playSheet').textContent='▶ 악보 소리 듣기';
  var pb=$('#playBoth');if(pb)pb.textContent='▶ 원곡 들으며 악보 따라가기';
}
var SH={els:[],lyr:[],ok:false,cur:-1,lyOn:null,cursor:null,lastUser:0,box:null};
['wheel','touchstart','touchmove','keydown','mousedown'].forEach(function(ev){window.addEventListener(ev,function(){SH.lastUser=Date.now()},{passive:true})});
function sheetPrep(){
  var host=$('#sheet');if(!host)return;host.style.position='relative';
  SH.cur=-1;SH.lyOn=null;SH.ok=false;SH.els=[];SH.lyr=[];
  var hr=host.getBoundingClientRect(),sl=host.scrollLeft,st=host.scrollTop;
  function R(el){var r=el.getBoundingClientRect();return {l:r.left-hr.left+sl,r:r.right-hr.left+sl,t:r.top-hr.top+st,b:r.bottom-hr.top+st}}
  function ln(el){var m=/abcjs-l(\d+)/.exec(el.getAttribute('class')||'');return m?+m[1]:0}
  var els=[].slice.call(host.querySelectorAll('svg .abcjs-note,svg .abcjs-rest'));
  if(!els.length||els.length!==(S.evT||[]).length)return;
  SH.els=els.map(function(e){var r=R(e);return {e:e,l:r.l,r:r.r,t:r.t,b:r.b,line:ln(e),cx:(r.l+r.r)/2}});
  SH.lyr=[].slice.call(host.querySelectorAll('svg .abcjs-lyric')).map(function(e){var r=R(e);return {e:e,line:ln(e),cx:(r.l+r.r)/2,txt:e.textContent}});
  var lines={};
  [].forEach.call(host.querySelectorAll('svg .abcjs-staff-wrapper'),function(w){var r=R(w);lines[ln(w)]={t:r.t,b:r.b}});
  SH.lines=lines;
  var c=document.createElement('div');c.id='smCur';c.style.cssText='position:absolute;width:3px;border-radius:2px;background:#6c4bf0;opacity:.85;pointer-events:none;display:none;box-shadow:0 0 0 2px rgba(108,75,240,.18)';
  host.appendChild(c);SH.cursor=c;SH.ok=true;
}
function curClear(){
  if(SH.cur>=0&&SH.els[SH.cur])SH.els[SH.cur].e.classList.remove('sm-on');
  if(SH.lyOn){SH.lyOn.classList.remove('sm-lyon');SH.lyOn=null}
  SH.cur=-1;if(SH.cursor)SH.cursor.style.display='none';
}
function curAt(step){
  if(!SH.ok)return '';
  var ev=S.evT,n=ev.length,k=-1,i;
  for(i=0;i<n;i++){if(ev[i]<=step+0.001)k=i;else break}
  if(k<0)return '';
  var a=SH.els[k],b=SH.els[k+1],t0=ev[k],t1=(k+1<n)?ev[k+1]:S.bars*16;
  var f=Math.max(0,Math.min(1,(step-t0)/Math.max(1,t1-t0)));
  var x0=a.l,x1=(b&&b.line===a.line)?b.l:(a.r+14);
  var x=x0+(x1-x0)*f-3;
  var ly=SH.lines&&SH.lines[a.line];
  var cu=SH.cursor;
  if(ly){cu.style.top=(ly.t-4)+'px';cu.style.height=(ly.b-ly.t+8)+'px'}
  cu.style.left=x+'px';cu.style.display='block';
  var syl='';
  if(k!==SH.cur){
    if(SH.cur>=0&&SH.els[SH.cur])SH.els[SH.cur].e.classList.remove('sm-on');
    a.e.classList.add('sm-on');SH.cur=k;
    if(SH.lyOn){SH.lyOn.classList.remove('sm-lyon');SH.lyOn=null}
    var best=null,bd=18;
    SH.lyr.forEach(function(L){if(L.line!==a.line)return;var d=Math.abs(L.cx-a.cx);if(d<bd){bd=d;best=L}});
    if(best){best.e.classList.add('sm-lyon');SH.lyOn=best.e;SH.syl=best.txt}else SH.syl='';
    // 줄이 화면 밖이면 부드럽게 따라가기 (직접 스크롤 중이면 따라가지 않음)
    if(!document.documentElement.classList.contains('embed')&&Date.now()-SH.lastUser>4000&&ly){
      var hr=$('#sheet').getBoundingClientRect(),top=hr.top+ly.t-$('#sheet').scrollTop,bot=hr.top+ly.b;
      if(top<70||bot>window.innerHeight-90){try{window.scrollTo({top:window.scrollY+top-120,behavior:'smooth'})}catch(_){}}
    }
  }
  return SH.syl||'';
}
function fbarShow(on,txt){
  var emb=document.documentElement.classList.contains('embed');
  if(emb){try{window.parent.postMessage({type:'sm-play',on:on,txt:txt||''},'*')}catch(_){}return}
  var fb=$('#fbar');if(!fb)return;fb.classList.toggle('hide',!on);if(on){$('#fbTxt').textContent=txt||''}
}
function startFollow(t0ctx,shown){
  var ss=stepSec(),barSec=16*ss,ctx=audioCtx,nowEl=$('#nowPlay'),last=-1,lastTxt='';
  if(nowEl)nowEl.classList.remove('hide');
  fbarShow(true,'재생 중…');
  function tick(){
    var el=ctx.currentTime-t0ctx;
    if(playedOrig){var _au=$('#orig');if(_au&&!_au.paused)el=_au.currentTime-Math.max(0,S.t0)}
    var i=Math.floor(el/barSec);
    if(el>=0&&i!==last&&i<S.chordBars.length){
      last=i;
      $$('#chords>div.on').forEach(function(d){d.classList.remove('on')});
      var d=$$('#chords>div')[i];if(d)d.classList.add('on');
    }
    var syl='';
    if(el>=0)syl=curAt(el/ss);
    if(el>=0&&i<S.chordBars.length){
      var txt='지금 '+(i+1)+'마디 · 코드 '+barText(i)+(syl?' · ♪ '+syl:'');
      if(txt!==lastTxt){lastTxt=txt;if(nowEl)nowEl.textContent=txt;fbarShow(true,txt)}
    }
    if(el<S.bars*barSec+0.5)playRaf=requestAnimationFrame(tick);
  }
  playRaf=requestAnimationFrame(tick);
}
function playSheet(withOrig){
  stopPlay();
  var AC=window.AudioContext||window.webkitAudioContext;if(!audioCtx)audioCtx=new AC();
  if(audioCtx.state==='suspended')audioCtx.resume();
  var ctx=audioCtx,ss=stepSec(),shift=withOrig===true?0:S.shift;
  var au=$('#orig'),vs=+($('#vSheet').value||80)/100,vo=+($('#vOrig').value||80)/100;
  var master=ctx.createGain();master.gain.value=(withOrig===true?vs:0.9);master.connect(ctx.destination);window.__master=master;
  function sched(t){
    function tone(type,f,st,dur,vol){
      var o=ctx.createOscillator(),g=ctx.createGain();
      o.type=type;o.frequency.value=f;
      g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(vol,st+0.02);g.gain.setValueAtTime(vol,st+Math.max(0.03,dur-0.06));g.gain.linearRampToValueAtTime(0.0001,st+dur);
      o.connect(g);g.connect(master);o.start(st);o.stop(st+dur+0.02);playNodes.push(o);
    }
    S.melody.forEach(function(n){tone('triangle',hz(n.m+shift),t+n.st*ss,Math.max(0.08,(n.end-n.st)*ss*0.95),0.22)});
    S.chordBars.forEach(function(b,i){
      [b.a,b.b].forEach(function(c,h){
        var st=t+(i*16+h*8)*ss,du=8*ss*0.97;
        CT[c.t].iv.forEach(function(iv){tone('sine',hz(48+((c.r+iv+shift)%12+12)%12-0),st,du,0.07)});
      });
    });
    var total=S.bars*16*ss;
    startFollow(t,true);
    playTimer=setTimeout(stopPlay,(total+0.8)*1000);
  }
  if(withOrig===true&&au&&au.src){
    $('#playBoth').textContent='♪ 원곡 재생 중… (누르면 멈춤)';
    au.volume=vo;au.currentTime=Math.max(0,S.t0);playedOrig=true;
    var pr=au.play();
    var go=function(){sched(ctx.currentTime+0.03)};
    if(pr&&pr.then)pr.then(go,function(){playedOrig=false;stopPlay()});else go();
  }else{
    $('#playSheet').textContent='♪ 재생 중…';
    sched(ctx.currentTime+0.15);
  }
}

/* ---------- 소리 일치도 (참고용) ---------- */
function barScores(){
  var ss=stepSec(),barSec=16*ss,out=[];
  for(var i=0;i<S.chordBars.length;i++){
    var b=S.chordBars[i],a0=S.t0+i*barSec,a1=a0+barSec,pa={},pb={},pm={};
    CT[b.a.t].iv.forEach(function(iv){pa[(b.a.r+iv)%12]=1});
    CT[b.b.t].iv.forEach(function(iv){pb[(b.b.r+iv)%12]=1});
    S.melody.forEach(function(n){if(n.st>=i*16&&n.st<i*16+16)pm[((n.m%12)+12)%12]=1});
    var tot=0,ok=0;
    S.notes.forEach(function(n){
      if(n.m<28||n.m>88)return;
      var mid=n.t+n.d/2;if(mid<a0||mid>=a1)return;
      var w=n.d*(0.3+n.a),pc=n.m%12,set=(mid<a0+barSec/2)?pa:pb;
      tot+=w;if(set[pc])ok+=w;
    });
    out.push(tot>0.02?ok/tot:null);
  }
  return out;
}
function updMatch(){
  var sc=barScores(),boxes=$$('#chords>div'),sumN=0,cnt=0;
  sc.forEach(function(v,i){
    var d=boxes[i];if(!d)return;
    var tag=d.querySelector('.mt');if(!tag){tag=document.createElement('span');tag.className='mt';d.querySelector('label').appendChild(tag)}
    if(v==null){tag.textContent='';tag.className='mt';return}
    var pc=Math.round(v*100);tag.textContent=' '+pc+'%';tag.className='mt '+(pc>=62?'g':pc>=42?'y':'r');
    sumN+=v;cnt++;
  });
  var m=$('#matchTxt');
  if(m){if(cnt){var avg=Math.round(sumN/cnt*100);m.textContent='코드 일치도 '+avg+'% (원곡 소리 중 적은 코드의 구성음과 같은 음의 비율이에요. 멜로디는 코드 밖 음도 쓰니 100%가 아니어도 정상이에요. 마디별 색: 초록 잘 맞음 · 노랑 보통 · 빨강 의심)'}else m.textContent=''}
}

/* ---------- MIDI 저장 ---------- */
function vlq(n){var b=[n&127];n>>=7;while(n>0){b.unshift((n&127)|128);n>>=7}return b}
function dlMidi(){
  var TPQ=480,perStep=TPQ/4,shift=S.shift,ev=[];
  S.melody.forEach(function(n){ev.push({t:n.st*perStep,on:1,ch:0,m:n.m+shift,v:92});ev.push({t:n.end*perStep,on:0,ch:0,m:n.m+shift,v:0})});
  S.chordBars.forEach(function(b,i){
    [b.a,b.b].forEach(function(c,h){
      var st=(i*16+h*8)*perStep,en=st+8*perStep-10;
      CT[c.t].iv.forEach(function(iv){var m=48+(((c.r+iv+shift)%12)+12)%12;ev.push({t:st,on:1,ch:1,m:m,v:60});ev.push({t:en,on:0,ch:1,m:m,v:0})});
    });
  });
  ev.sort(function(a,b){return a.t-b.t||a.on-b.on});
  var tr=[];
  var mpq=Math.round(60000000/S.bpm);
  tr.push(0,0xFF,0x51,3,(mpq>>16)&255,(mpq>>8)&255,mpq&255);
  tr.push(0,0xFF,0x58,4,4,2,24,8);
  tr.push(0,0xC1,0); // 채널 2 피아노 (기본)
  var last=0;
  ev.forEach(function(e){
    var d=Math.max(0,Math.round(e.t)-last);last+=d;
    tr=tr.concat(vlq(d),[(e.on?0x90:0x80)|e.ch,e.m&127,e.v]);
  });
  tr.push(0,0xFF,0x2F,0);
  var head=[0x4D,0x54,0x68,0x64,0,0,0,6,0,0,0,1,TPQ>>8,TPQ&255];
  var len=tr.length;
  var trk=[0x4D,0x54,0x72,0x6B,(len>>24)&255,(len>>16)&255,(len>>8)&255,len&255].concat(tr);
  var blob=new Blob([new Uint8Array(head.concat(trk))],{type:'audio/midi'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=((S.file&&S.file.name||'song').replace(/\.[^.]+$/,''))+'_악보.mid';
  document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);
}

/* ---------- 뮤직캔버스용 코드 파일 저장 ---------- */
function dlMc(){
  if(!S.chordBars||!S.chordBars.length)return;
  var key=keyInfo(S.key,S.shift),ss=stepSec(),barSec=16*ss,bars=[];
  S.chordBars.forEach(function(b,i){
    var t=S.t0+i*barSec;
    var a=chordName(b.a,S.shift,key.flat),c=chordName(b.b,S.shift,key.flat);
    var cs=(a===c)?[{t:t,n:a}]:[{t:t,n:a},{t:t+barSec/2,n:c}];
    bars.push({t:+t.toFixed(3),e:+(t+barSec).toFixed(3),c:cs.map(function(x){return {t:+x.t.toFixed(3),n:x.n}})});
  });
  var song=(S.file&&S.file.name||'song').replace(/\.[^.]+$/,'');
  var data={format:'musiccanvas-chords',v:1,song:song,bpm:Math.round(S.bpm*10)/10,key:key.disp,dur:S.dur||0,bars:bars};
  var blob=new Blob([JSON.stringify(data)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=song+'_코드.json';
  document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);
}

/* ---------- 분석 시작 ---------- */
async function analyze(file){
  if(S.busy)return;
  S.busy=true;err('');stopPlay();
  S.file=file;S.shift=0;S.chordBars=[];SYNC0=null;S.titleEdited=false;setTitleAuto(file&&file.name);
  $('#result').classList.add('hide');
  try{
    setProg(.02,'파일을 읽는 중…');
    var d=await decode(file,S.lenSec);
    S.dur=d.used;
    if(S.url)URL.revokeObjectURL(S.url);
    S.url=URL.createObjectURL(file);$('#orig').src=S.url;
    await runModel(d.audio);
    setProg(.86,'키·박자·코드를 계산하는 중…');
    await wait(30);
    extractNotes();
    if(S.notes.length<8)throw new Error('음을 거의 찾지 못했어요. 소리가 너무 작거나 말소리·효과음 파일일 수 있어요.');
    detectKey();
    detectTempo();
    S.chordBars=[];
    render();
    setProg(1,'완료!');
    $('#result').classList.remove('hide');
    setTimeout(function(){$('#prog').classList.add('hide')},1200);
    if(!document.documentElement.classList.contains('embed'))$('#result').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    console.error(e);err(e.message||'분석 중 문제가 생겼어요.');$('#prog').classList.add('hide');
  }finally{S.busy=false}
}

/* ---------- 이벤트 ---------- */
function bindChips(sel,cb){
  $$(sel+' button').forEach(function(b){b.addEventListener('click',function(){
    $$(sel+' button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});cb(b.dataset.v);
  })});
}
bindChips('#kindChips',function(v){S.kind=v});
bindChips('#lenChips',function(v){S.lenSec=+v});
// 음표 양 칩 (악보 카드 안)
var denWrap=$$('.chips.row').filter(function(r){return r.querySelector('[data-v="few"]')})[0];
if(denWrap){$$('.chips.row').forEach(function(){});Array.prototype.forEach.call(denWrap.querySelectorAll('button'),function(b){b.addEventListener('click',function(){
  Array.prototype.forEach.call(denWrap.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
  S.density=b.dataset.v;if(!S.frames)return;
  extractNotes();render();
})})}
$('#file').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(f)analyze(f);e.target.value=''});
var drop=$('#drop');
['dragenter','dragover'].forEach(function(n){drop.addEventListener(n,function(e){e.preventDefault();drop.classList.add('on')})});
['dragleave','drop'].forEach(function(n){drop.addEventListener(n,function(e){e.preventDefault();drop.classList.remove('on')})});
drop.addEventListener('drop',function(e){var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f)analyze(f)});
$('#redo').addEventListener('click',function(){S.shift=Math.min(12,S.shift+1);drawAll()});
$('#undo').addEventListener('click',function(){S.shift=Math.max(-12,S.shift-1);drawAll()});
$('#playSheet').addEventListener('click',function(){playSheet(false)});
$('#playBoth').addEventListener('click',function(){if(playedOrig||playTimer){stopPlay();return}playSheet(true)});
$('#vOrig').addEventListener('input',function(){try{$('#orig').volume=+this.value/100}catch(_){}});
$('#vSheet').addEventListener('input',function(){try{if(window.__master)window.__master.gain.value=+this.value/100}catch(_){}});
$('#stopSheet').addEventListener('click',stopPlay);
var _fs=$('#fbStop');if(_fs)_fs.addEventListener('click',stopPlay);
$('#dlMidi').addEventListener('click',dlMidi);
$('#dlMc').addEventListener('click',dlMc);
function copyText(txt,note,msg){
  function done(){note.textContent=msg;setTimeout(function(){note.textContent=''},1800)}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){fallback()})}else fallback();
  function fallback(){var t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(_){}t.remove();done()}
}
$('#cpChords').addEventListener('click',function(){copyText(progressionText(),$('#cpChordsTxt'),'복사했어요')});
$('#cpSuno').addEventListener('click',function(){copyText($('#sunoTxt').value.split('\n')[0],$('#cpSunoTxt'),'복사했어요')});
window.addEventListener('message',function(e){var d=e.data;if(!d)return;if(d.type==='sm-stop')stopPlay();if(d.type==='sm-lyrics'&&typeof d.text==='string'){if(d.title)setTitleAuto(d.title);var el=document.getElementById('lyIn');if(el&&!(d.auto&&lyrData().lines.some(function(a){return a.length}))){var dt=document.querySelector('.lyb');if(dt)dt.open=true;el.value=d.text;el.dispatchEvent(new Event('input',{bubbles:true}))}}});
document.addEventListener('keydown',function(e){var t=e.target&&e.target.tagName;if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT')return;if((e.key==='Escape'||e.key===' ')&&(playedOrig||playTimer)){e.preventDefault();stopPlay()}});
var _ti=document.getElementById('scTitle');if(_ti)_ti.addEventListener('input',function(){S.titleEdited=true;S.title=_ti.value;try{if(S.chordBars&&S.chordBars.length)drawSheetOnly(true)}catch(x){}});
var _pr=document.getElementById('prSheet');if(_pr)_pr.addEventListener('click',function(){if(!S.chordBars||!S.chordBars.length){return}try{window.print()}catch(x){}});
function lsLyrics(){
  var v='';try{v=localStorage.getItem('dusk_lrc_lyrics')||''}catch(e){return ''}
  if(!v)return '';var j=v;try{j=JSON.parse(v)}catch(e){j=v}
  function fromObj(o){
    if(typeof o==='string')return o;
    if(Array.isArray(o))return o.map(function(x){return typeof x==='string'?x:(x&&(x.text||x.line||x.l)||'')}).join('\n');
    if(o&&typeof o==='object'){var k=['text','lyrics','raw','value','body','content'];for(var i=0;i<k.length;i++)if(o[k[i]])return fromObj(o[k[i]]);if(o.lines)return fromObj(o.lines)}
    return '';
  }
  return fromObj(j)||'';
}
function loadMakerLyrics(manual){
  var tx=lsLyrics(),el=document.getElementById('lyIn'),m=document.getElementById('lyMsg');if(!el)return;
  if(!tx.trim()){if(manual&&m)m.textContent='⚠ 가사 자막 만들기에서 가져올 가사가 없어요. 이 브라우저에서 그 페이지에 가사를 먼저 넣어 주세요.';return}
  if(!manual&&lyrData().lines.some(function(a){return a.length}))return;
  var dt=document.querySelector('.lyb');if(dt)dt.open=true;
  el.value=tx;el.dispatchEvent(new Event('input',{bubbles:true}));
  if(m&&manual)setTimeout(function(){m.textContent='✔ 가사 자막 만들기의 가사를 가져왔어요. '+m.textContent},300);
}
var _mk=document.getElementById('lyMaker');if(_mk)_mk.addEventListener('click',function(){loadMakerLyrics(true)});
setTimeout(function(){loadMakerLyrics(false)},400);
var SYNC0=null;
(function(){var bx=document.getElementById('syncBox');if(!bx)return;
  function show(){var t=document.getElementById('adjTxt');if(t&&S.bpm)t.textContent='지금: 속도 '+(Math.round(S.bpm*10)/10)+' BPM · 시작 위치 '+(Math.round(S.t0*100)/100)+'초'}
  bx.addEventListener('toggle',show);
  bx.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('button[data-adj]');if(!b||!S.bpm||!(S.notes&&S.notes.length))return;
    if(!SYNC0)SYNC0={bpm:S.bpm,t0:S.t0};
    stopPlay();var a=b.dataset.adj,v=b.dataset.v;
    if(a==='bpm'){var nb=v==='half'?S.bpm/2:v==='dbl'?S.bpm*2:S.bpm+parseFloat(v);S.bpm=Math.max(40,Math.min(240,nb))}
    else if(a==='t0'){S.t0=S.t0+parseFloat(v)}
    else if(a==='reset'){S.bpm=SYNC0.bpm;S.t0=SYNC0.t0}
    S.chordBars=[];try{render()}catch(x){}
    show();
  });
  var o=window.addEventListener;
})();
var _lf=document.getElementById('lyFile');if(_lf)_lf.addEventListener('change',function(){var f=_lf.files&&_lf.files[0];if(!f)return;var r=new FileReader();r.onload=function(){var buf=new Uint8Array(r.result),txt='';try{if(buf[0]===0xFF&&buf[1]===0xFE)txt=new TextDecoder('utf-16le').decode(buf);else if(buf[0]===0xFE&&buf[1]===0xFF)txt=new TextDecoder('utf-16be').decode(buf);else{try{txt=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(e1){txt=new TextDecoder('euc-kr').decode(buf)}}}catch(e2){txt=''}var el=document.getElementById('lyIn');el.value=txt;var dd=lyrData();if(dd.ti)setTitleAuto(dd.ti);el.dispatchEvent(new Event('input',{bubbles:true}))};r.readAsArrayBuffer(f)});
window.__SM={S:S,analyze:analyze};
try{if(window.parent!==window&&window.ResizeObserver){var __h=0;new ResizeObserver(function(){var h=document.documentElement.scrollHeight;if(Math.abs(h-__h)>4){__h=h;window.parent.postMessage({type:'sm-h',h:h},'*')}}).observe(document.body)}}catch(_){}
})();
