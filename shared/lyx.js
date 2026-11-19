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
/* 따라 부르기 소리 (곡마다 한 종류를 고정해서 반복) [이름, 소리1, 소리2, 소리3] — 말뜻이 없는 부드러운 소리만, 유명 곡 후렴과 겹치지 않게 */
var CHANTS=[["소르르","소르르","소르 소르르","소르르르"],["하루루","하루루","하루 하루루","하루루루"],["미모리","미모리","미모 미모리","모리 모리"],["포로롱","포로롱","포로 포롱","포로로롱"],["유라라","유라라","유라 유라라","라라라"],["새라라","새라라","새라 라라","새로로"],["도리도리","도리 도리","도리 도리도","도리리"],["무니무니","무니 무니","무니 무니무","무니니"],["토로로","토로로","토로 토로로","로로로"],["호호이","호호이","호호 호호이","호이 호이"],["오로라","오로라","오로 로라","로라라"],["미라미라","미라 미라","미라 미라라","라라미"],["나리나리","나리 나리","나리 나리리","리리"],["소소소","소소 소","소소 소소소","소오"],["비비비","비비 비","비비 비비비","비이"],["로로로","로로 로","로로 로로로","로오"],["보로롱","보로롱","보로 보롱","보로로롱"],["하나나","하나나","하나 하나나","나나"],["수루루","수루루","수루 수루루","루루"],["무르르","무르르","무르 무르르","르르"],["헤나나","헤나나","헤나 헤나나","나나"],["고로로","고로로","고로 고로로","로로"],["호로롱","호로롱","호로 호롱","호로로롱"],["새롱새롱","새롱 새롱","새롱 새롱새","롱롱"],["뽀로롱","뽀로롱","뽀로 뽀롱","뽀로로롱"],["하리리","하리리","하리 하리리","리리"],["오미오미","오미 오미","오미 오미오","미오"],["도도레","도도레","도도 레레","도레미"],["라미라","라미라","라미 라미라","미라"],["소라라","소라라","소라 소라라","라라"],["유유유","유유 유","유유 유유유","유우"],["모모모","모모 모","모모 모모모","모오"],["주르르","주르르","주르 주르르","르르"],["사르락","사르락","사르 사르락","락락"],["라라라","라라라","랄랄라","라라 라"],["나나나","나나나","나 나나나","나나"],["우우우","우우우","우— 우우우","우우"],["오오오","오오오","오오 오오오","오오"],["아아아","아아아","아— 아아아","아아"],["허밍","음음음","흐음~ 음음","음"],["Lo-ra-lo","Lo-ra-lo","Lo-ra, ra-lo","Lo-lo"],["Mi-ra-mi","Mi-ra-mi","Mi-ra, ra-mi","Mi-mi"],["Ba-lu-ba","Ba-lu-ba","Ba-lu, lu-ba","Ba-ba"],["Hoo-la-loo","Hoo-la-loo","Hoo-la, la-loo","Hoo-loo"],["Sa-na-na","Sa-na-na","Sa-na, na-na","Na-na"],["Moo-ra-moo","Moo-ra-moo","Moo-ra, ra-moo","Moo-moo"],["Yo-la-yo","Yo-la-yo","Yo-la, la-yo","Yo-yo"],["Ne-ri-ne","Ne-ri-ne","Ne-ri, ri-ne","Ne-ne"],["Su-la-su","Su-la-su","Su-la, la-su","Su-su"],["Oh-ra-oh","Oh-ra-oh","Oh-ra, ra-oh","Oh-oh"],["Lu-mi-lu","Lu-mi-lu","Lu-mi, mi-lu","Lu-lu"],["Ho-la-ho","Ho-la-ho","Ho-la, la-ho","Ho-ho"],["Ta-ri-ta","Ta-ri-ta","Ta-ri, ri-ta","Ta-ta"],["Ya-na-ya","Ya-na-ya","Ya-na, na-ya","Ya-ya"],["Wi-lo-wi","Wi-lo-wi","Wi-lo, lo-wi","Wi-wi"],["Oh-oh-oh","Oh-oh-oh","Oh-oh, oh-oh-oh","Oh"],["Whoa-oh-oh","Whoa-oh-oh","Whoa-oh, oh-oh","Whoa"],["Mm-mm-mm","Mm-mm-mm","Mm-mm, mm-mm-mm","Mm"],["Ooh-la-la","Ooh-la-la","Ooh-la, la-la-la","Ooh"],["Doo-doo-doo","Doo-doo-doo","Doo-doo, doo-doo-doo","Doo"]];
function pickC(){var nk=0;CHANTS.forEach(function(c){if(/[가-힣]/.test(c[1]))nk++});return Math.random()<.7?Math.floor(Math.random()*nk):nk+Math.floor(Math.random()*(CHANTS.length-nk))}
function cs(lx){if(lx.chantSet==null||!CHANTS[lx.chantSet])lx.chantSet=pickC();return CHANTS[lx.chantSet]}
function chantName(lx){return cs(lx)[0]}
function chantRoll(lx){var o=lx.chantSet,n=o;while(n===o||n==null)n=pickC();lx.chantSet=n;return CHANTS[n][0]}
function chantTail(c){var u=c[1],v=c[2],w=c[3];return rnd([u+'~ '+u+'~ '+v,u+' '+v+', '+u+' '+v+'~','('+u+'~) '+u+' '+v,u+'~\n('+w+'~)',u+' '+v+'~ '+w+'~',u+'? ('+v+'~)'])}
function chantIntro(lx){if(!lx||lx.chant!=='mid'&&lx.chant!=='strong')return '';var c=cs(lx);return lx.chant==='strong'?'('+c[1]+'~ '+c[2]+'~)\n('+c[1]+'... '+c[3]+'...)':'('+c[1]+'... '+c[2]+'...)'}
function chantPost(k,s,lx){
  var m=lx.chant;if(!m||m==='off')return s;var c=cs(lx),u=c[1],v=c[2],w=c[3],L=s.split('\n');
  if(k==='chorus'){
    if(m==='strong'){if(L.length>2)L.splice(2,0,'('+u+')');L.unshift('('+u+'~ '+v+'~)');L.push(chantTail(c));L.push(chantTail(c))}
    else L.push(chantTail(c));
  }else if(k==='pre'){if(m==='strong')L.push(u+' '+v+'~')}
  else if(k==='outro'){if(m==='mid'||m==='strong'){L.push(u+' '+v+'~');L.push('('+w+'... )')}}
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
