/* Dusk Soul shared: "다른 스타일로" 변형 엔진. 데이터: var-data.js (window.DUSK_VAR) */
(function(){
'use strict';
var HK='dusk_var_hist_v1',MAXH=60;
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function load(){try{return JSON.parse(localStorage.getItem(HK)||'[]')||[]}catch(e){return []}}
function save(h){try{localStorage.setItem(HK,JSON.stringify(h.slice(-MAXH)))}catch(e){}}
function fresh(arr,seen){var c=arr.filter(function(x){return seen.indexOf(x)<0});return rnd(c.length?c:arr)}
/* fam: ballad/pop/acoustic/lofi/cinematic/… , vocal: 'male'|'female'|'duet'|'' → 추가 키워드 배열 */
function tokens(fam,vocal){
  var V=window.DUSK_VAR&&window.DUSK_VAR[fam];if(!V)return [];
  var hist=load(),out=[];
  var vp=vocal==='male'?V.vm:vocal==='female'?V.vf:vocal==='duet'?V.vg:[];
  var mood=fresh(V.m,hist),inst=fresh(V.i,hist),prod=fresh(V.p,hist),twist=fresh(V.t,hist);
  out.push(mood,inst,prod,twist);
  if(vp&&vp.length)out.push(fresh(vp,hist));
  hist=hist.concat(out);save(hist);
  return out}
window.DuskVar={tokens:tokens};
})();
