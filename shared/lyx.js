/* Dusk Soul shared: 가사 풍성하게 엔진 (영어 섞기·랩·듀엣·연주 구간·애드리브·감정 변화·제목 반복)
   데이터: lyx-data.js (window.DUSK_LYX). 이 파일 하나를 고치면 불러다 쓰는 모든 페이지에 적용돼요. */
(function(){
'use strict';
/* 주제별 전용 영어·랩 문구(lyx-data2.js)를 같은 폴더에서 불러와요. 실패해도 아래 별칭으로 계속 동작해요. */
try{var _cs=document.currentScript;if(_cs&&_cs.src){var _x=new XMLHttpRequest();_x.open('GET',_cs.src.replace(/lyx\.js(\?.*)?$/,'lyx-data2.js'),false);_x.send(null);if(_x.status===200||(_x.status===0&&_x.responseText))(0,eval)(_x.responseText)}}catch(e){}
var SECDEF={rapv:{tag:'Rap Verse',key:'rapV',hk:'rap'},rapb:{tag:'Rap',key:'rapB',hk:'rap'},solo:{tag:'Instrumental Break',key:null,hk:'solo'}};
var ARC={intro:'soft, atmospheric',verse:'whispered, soft and close',pre:'building, rising tension',chorus:'full voice, powerful and open',rap:'confident, rhythmic delivery',bridge:'quiet, vulnerable',chorusF:'biggest, emotional peak, full vocals',outro:'fading, whispered',solo:''};
var ADL={b:['(hey!)','(yeah, yeah)','(woo!)','(oh-oh-oh)'],d:['(ooh... ooh...)','(mmm... hmm)','(na na na)','(oh... oh...)']};
var BRIGHT=/^(party|swag|drive|cheer|happy|summer|crush|hope)$/;
/* 영어 훅·랩 데이터가 없는 주제는 분위기가 비슷한 주제의 문구를 대신 써요 */
var ALIAS={rebel:'swag',revenge:'breakup',toxic:'breakup',flirt:'crush',drunk:'night',flex:'swag',gothic:'night',funny:'happy',jealous:'breakup',diss:'swag',rain:'missing',winter:'memory',autumn:'memory',family:'hope',friend:'happy',confession:'crush',reunion:'missing',lonely:'night',youth:'summer',comfort:'hope',sea:'summer',wait:'missing',unrequited:'missing',firstlove:'crush',regret:'breakup',forgive:'hope',spring:'crush',christmas:'happy',newyear:'hope',wedding:'happy',travel:'drive',hometown:'memory',city:'night',tired:'hope',challenge:'cheer',graduation:'hope',pet:'happy',cafe:'memory',morning:'hope',freedom:'drive',sunset:'memory',stars:'night',letter:'missing',growup:'hope',flower:'crush',promise:'hope',wildlife:'drive',bird:'hope',forest:'memory',plant:'hope',workout:'cheer',friday:'party',foodie:'happy',themepark:'happy',camping:'summer',festival:'party',dancechal:'party',holiday:'summer',longdistance:'missing',lastday:'memory',afterbreakup:'breakup',oldlove:'memory',quit:'cheer',selfroom:'night',fandom:'cheer',retro00:'memory',firstpay:'happy',military:'missing',rooftop:'night',cvs:'night',jobseek:'cheer',parenting:'hope',gamer:'cheer',lastbus:'night',grandma:'memory',soloeat:'happy',baseball:'cheer',hangang:'night'};
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function def(){return {en:'off',rap:'off',rapLen:8,duet:false,solo:false,adlib:false,arc:false,tit:false,chant:'off',chantSet:null}}
function X(th){var D=window.DUSK_LYX;if(!D)return null;return D[th]||(ALIAS[th]&&D[ALIAS[th]])||null}
function on(lx){return !!lx&&(lx.en!=='off'||lx.rap!=='off'||lx.duet||lx.solo||lx.adlib||lx.arc||lx.tit||(lx.chant&&lx.chant!=='off'))}
/* 초보용 한 번 누르기 → 세부 설정 */
function preset(m,lx){lx=lx||def();lx.en=(m==='en'||m==='both')?'hook':'off';lx.rap=(m==='rap'||m==='both')?'v2':(m==='rap1'?'v1':'off');if(lx.rap!=='off')lx.rapLen=8;return lx}
function presetOf(lx){if(lx.en==='off'&&lx.rap==='off')return 'ko';if(lx.en==='hook'&&lx.rap==='off')return 'en';if(lx.en==='off'&&lx.rap==='v1'&&lx.rapLen===8)return 'rap1';if(lx.en==='off'&&lx.rap==='v2'&&lx.rapLen===8)return 'rap';if(lx.en==='hook'&&lx.rap==='v2'&&lx.rapLen===8)return 'both';return ''}
/* 구간 순서: base 는 verse1,pre,chorus… 같은 기존 목록 */
function secs(base,lx){
  var out=[];
  base.forEach(function(s){
    if(s==='intro'&&lx.rap==='v1')return;
    if(s==='verse1'&&lx.rap==='v1')out.push('rapv');
    else if(s==='verse2'&&(lx.rap==='v2'||lx.rap==='both'))out.push('rapv');
    else if(s==='bridge'&&(lx.rap==='br'||lx.rap==='both'))out.push('rapb');
    else out.push(s);
    if(lx.solo&&(s==='chorus2'||s==='verse2'&&base.indexOf('chorus2')<0))out.push('solo')});
  return out}
/* 텍스트 풀: null 이면 기존 풀 그대로 */
function pool(k,th,lx){
  var x=X(th);if(!x)return null;
  if(k==='rapV'||k==='rapB')return x[k]||[];
  if(lx.en==='half'&&(k==='pre'||k==='bridge'||k==='outro'))return x[k==='pre'?'enPre':k==='bridge'?'enBridge':'enOutro']||null;
  return null}
/* 따라 부르기 소리 (곡마다 한 종류를 고정해서 반복) [이름, 소리1, 길게 늘인 소리, 허밍] — 누구나 아는 단순한 모음 소리만 */
var CHANTS=[["라라라","라라라","라라라라","음"],["오오오","오오오","오오오오","음"],["우우우","우우우","우우우우","음"],["나나나","나나나","나나나나","음"],["아아아","아아아","아아아아","음"],["워어어","워어어","워어어어","음"],["랄라라","랄라라","랄라라라","음"],["허밍","음음음","음음음음","음"],["Oh-oh-oh","Oh-oh-oh","Oh-oh-oh-oh","Hmm"],["Whoa-oh-oh","Whoa-oh-oh","Whoa-oh-oh-oh","Hmm"],["Na-na-na","Na-na-na","Na-na-na-na","Hmm"],["La-la-la","La-la-la","La-la-la-la","Hmm"],["Ooh-ooh-ooh","Ooh-ooh-ooh","Ooh-ooh-ooh-ooh","Hmm"],["Ah-ah-ah","Ah-ah-ah","Ah-ah-ah-ah","Hmm"],["Mm-mm-mm","Mm-mm-mm","Mm-mm-mm-mm","Hmm"],["오 오 오","오 오 오","오 오 오오","음"],["우 우 우","우 우 우","우 우 우우","음"],["라 라 라","라 라 라","라 라 라라","음"],["나 나 나","나 나 나","나 나 나아","음"],["아 아 아","아 아 아","아 아 아아","음"],["워 워 워","워 워 워","워 워 워어","음"],["하아","하아","하아아","음"],["후우","후우","후우우","음"],["으음","으음","으으음","음"],["루루루","루루루","루루루루","음"],["Doo-doo-doo","Doo-doo-doo","Doo-doo-doo-doo","Hmm"],["Da-da-da","Da-da-da","Da-da-da-da","Hmm"],["Ba-ba-ba","Ba-ba-ba","Ba-ba-ba-ba","Hmm"],["Lu-lu-lu","Lu-lu-lu","Lu-lu-lu-lu","Hmm"],["Ooh-la-la","Ooh-la-la","Ooh-la-la-la","Hmm"],["Woo-oh-oh","Woo-oh-oh","Woo-oh-oh-oh","Hmm"],["Hoo-hoo-hoo","Hoo-hoo-hoo","Hoo-hoo-hoo-hoo","Hmm"],["Oh-woah","Oh-woah","Oh-woah-oh","Hmm"],["Whoa-whoa-whoa","Whoa-whoa-whoa","Whoa-whoa-whoa-whoa","Hmm"],["Ahh-ahh","Ahh-ahh","Ahh-ahh-ahh","Hmm"],["Mm-hmm","Mm-hmm","Mm-hmm-hmm","Hmm"],["Sha-la-la","Sha-la-la","Sha-la-la-la","Hmm"],["Ohh-ohh","Ohh-ohh","Ohh-ohh-ohh","Hmm"]];
function pickC(){var nk=0;CHANTS.forEach(function(c){if(/[가-힣]/.test(c[1]))nk++});return Math.random()<.7?Math.floor(Math.random()*nk):nk+Math.floor(Math.random()*(CHANTS.length-nk))}
function cs(lx){if(lx.chantSet==null||!CHANTS[lx.chantSet])lx.chantSet=pickC();return CHANTS[lx.chantSet]}
function chantName(lx){return cs(lx)[0]}
function chantRoll(lx){var o=lx.chantSet,n=o;while(n===o||n==null)n=pickC();lx.chantSet=n;return CHANTS[n][0]}
function chantTail(c){var u=c[1],v=c[2];return rnd([u+'~ '+u+'~',u+'~ '+v+'~',u+' '+u+' '+v+'~'])}
function chantIntro(lx){if(!lx||lx.chant!=='mid'&&lx.chant!=='strong')return '';var c=cs(lx);return lx.chant==='strong'?'('+c[1]+'~)\n('+c[3]+'...)':'('+c[1]+'... '+c[1]+'...)'}
function chantPost(k,s,lx){
  var m=lx.chant;if(!m||m==='off')return s;var c=cs(lx),u=c[1],v=c[2],w=c[3],L=s.split('\n');
  if(k==='chorus'){
    if(m==='strong'){if(L.length>2)L.splice(2,0,'('+u+')');L.unshift('('+u+'~)');L.push(u+'~ '+u+'~');L.push(u+'~ '+v+'~')}
    else L.push(chantTail(c));
  }else if(k==='pre'){if(m==='strong')L.push('('+u+'~)')}
  else if(k==='outro'){if(m==='mid'||m==='strong'){L.push(u+'~ '+v+'~');L.push('('+w+'...)')}}
  return L.join('\n')}
/* 뽑은 텍스트 후처리 */
function post(k,s,th,lx){
  var x=X(th);
  if(k==='rapV'&&lx.rapLen===4)s=s.split('\n').slice(0,4).join('\n');
  if(k==='chorus'){
    if(x&&lx.en!=='off'){var h=rnd(x.enHook);s=(lx.en==='hook')?s+'\n'+h:s.split('\n').slice(0,2).join('\n')+'\n'+h}
    if(lx.adlib)s+='\n'+rnd(ADL[BRIGHT.test(ALIAS[th]||th)?'b':'d'])}
  if(lx.chant&&lx.chant!=='off'&&(k==='chorus'||k==='pre'||k==='outro'))s=chantPost(k,s,lx);
  return s}
/* 연주 구간 태그 (fam: rock/country/acoustic/edm/jazz/ballad/cinematic/rnb …) */
function soloTag(fam){return fam==='rock'||fam==='country'||fam==='acoustic'?'Guitar Solo':fam==='edm'?'Drop':fam==='jazz'?'Saxophone Solo':(fam==='ballad'||fam==='cinematic'||fam==='rnb')?'Piano Solo':'Instrumental Break'}
/* 듀엣: lead 는 'male'/'female' (처음 부르는 쪽) */
function duetV(id,lead){var A=lead==='female'?'Female':'Male',B=A==='Male'?'Female':'Male',M={verse1:A,pre:A,chorus:'Both',rapv:B,verse2:B,pre2:B,chorus2:'Both',bridge:'Both',rapb:A,chorusF:'Both',outro:'Both'};return M[id]||''}
/* 구간 힌트 (감정 변화 켜면 기존 힌트 대신 사용) */
function hint(hk,lx,fallback){return lx.arc?(ARC[hk]||''):fallback}
/* 태그 한 줄: baseTag = 기존 태그 이름('Verse 1' 등) */
function tag(id,baseTag,hintText,lx,ctx){
  ctx=ctx||{};var t=baseTag;
  if(id==='solo')t=soloTag(ctx.fam);
  if(lx.duet){var v=duetV(id,ctx.lead);if(v)t+=' - '+v}
  return '['+t+(hintText?': '+hintText:'')+']'}
/* 스타일 문구에 붙일 키워드 */
function styleTokens(lx){var o=[];if(lx.rap==='v1')o.push('opens with a Korean rap verse, hip-hop flow');else if(lx.rap!=='off')o.push('rap verse');if(lx.en==='hook')o.push('English hook');else if(lx.en!=='off')o.push('bilingual lyrics with English lines');if(lx.duet)o.push('male and female duet');if(lx.chant==='lite')o.push('catchy sing-along chant hook');else if(lx.chant==='mid')o.push('sing-along chant hook, hummed intro and outro');else if(lx.chant==='strong')o.push('big group sing-along chants, call-and-response shouts');return o}
/* 후렴 마지막에 제목 한 줄 (복사 결과에만 반영) */
function withTitle(k,t,title,lx){return(lx.tit&&k==='chorus'&&title&&t.indexOf(title)<0)?t+'\n'+title:t}
window.DuskLyx={chantName:chantName,chantRoll:chantRoll,chantIntro:chantIntro,CHANTS:CHANTS,SECDEF:SECDEF,ARC:ARC,def:def,on:on,preset:preset,presetOf:presetOf,secs:secs,pool:pool,post:post,soloTag:soloTag,duetV:duetV,hint:hint,tag:tag,styleTokens:styleTokens,withTitle:withTitle,theme:X};
})();
