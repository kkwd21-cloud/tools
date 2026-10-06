/* Dusk Soul shared: 가사 풍성하게 엔진 (영어 섞기·랩·듀엣·연주 구간·애드리브·감정 변화·제목 반복)
   데이터: lyx-data.js (window.DUSK_LYX). 이 파일 하나를 고치면 불러다 쓰는 모든 페이지에 적용돼요. */
(function(){
'use strict';
var SECDEF={rapv:{tag:'Rap Verse',key:'rapV',hk:'rap'},rapb:{tag:'Rap',key:'rapB',hk:'rap'},solo:{tag:'Instrumental Break',key:null,hk:'solo'}};
var ARC={intro:'soft, atmospheric',verse:'whispered, soft and close',pre:'building, rising tension',chorus:'full voice, powerful and open',rap:'confident, rhythmic delivery',bridge:'quiet, vulnerable',chorusF:'biggest, emotional peak, full vocals',outro:'fading, whispered',solo:''};
var ADL={b:['(hey!)','(yeah, yeah)','(woo!)','(oh-oh-oh)'],d:['(ooh... ooh...)','(mmm... hmm)','(na na na)','(oh... oh...)']};
var BRIGHT=/^(party|swag|drive|cheer|happy|summer|crush|hope)$/;
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function def(){return {en:'off',rap:'off',rapLen:8,duet:false,solo:false,adlib:false,arc:false,tit:false}}
function X(th){return (window.DUSK_LYX&&window.DUSK_LYX[th])||null}
function on(lx){return !!lx&&(lx.en!=='off'||lx.rap!=='off'||lx.duet||lx.solo||lx.adlib||lx.arc||lx.tit)}
/* 초보용 한 번 누르기 → 세부 설정 */
function preset(m,lx){lx=lx||def();lx.en=(m==='en'||m==='both')?'hook':'off';lx.rap=(m==='rap'||m==='both')?'v2':'off';if(lx.rap!=='off')lx.rapLen=8;return lx}
function presetOf(lx){if(lx.en==='off'&&lx.rap==='off')return 'ko';if(lx.en==='hook'&&lx.rap==='off')return 'en';if(lx.en==='off'&&lx.rap==='v2'&&lx.rapLen===8)return 'rap';if(lx.en==='hook'&&lx.rap==='v2'&&lx.rapLen===8)return 'both';return ''}
/* 구간 순서: base 는 verse1,pre,chorus… 같은 기존 목록 */
function secs(base,lx){
  var out=[];
  base.forEach(function(s){
    if(s==='verse2'&&(lx.rap==='v2'||lx.rap==='both'))out.push('rapv');
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
/* 뽑은 텍스트 후처리 */
function post(k,s,th,lx){
  var x=X(th);
  if(k==='rapV'&&lx.rapLen===4)s=s.split('\n').slice(0,4).join('\n');
  if(k==='chorus'){
    if(x&&lx.en!=='off'){var h=rnd(x.enHook);s=(lx.en==='hook')?s+'\n'+h:s.split('\n').slice(0,2).join('\n')+'\n'+h}
    if(lx.adlib)s+='\n'+rnd(ADL[BRIGHT.test(th)?'b':'d'])}
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
function styleTokens(lx){var o=[];if(lx.rap!=='off')o.push('rap verse');if(lx.en==='hook')o.push('English hook');else if(lx.en!=='off')o.push('bilingual lyrics with English lines');if(lx.duet)o.push('male and female duet');return o}
/* 후렴 마지막에 제목 한 줄 (복사 결과에만 반영) */
function withTitle(k,t,title,lx){return(lx.tit&&k==='chorus'&&title&&t.indexOf(title)<0)?t+'\n'+title:t}
window.DuskLyx={SECDEF:SECDEF,ARC:ARC,def:def,on:on,preset:preset,presetOf:presetOf,secs:secs,pool:pool,post:post,soloTag:soloTag,duetV:duetV,hint:hint,tag:tag,styleTokens:styleTokens,withTitle:withTitle,theme:X};
})();
