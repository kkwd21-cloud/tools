/* Dusk Soul 툴킷 → MusicCanvas 연결 카드 (결과물 복사·저장 직후 한 번 표시) */
(function(){
if(window.__mcCta)return;window.__mcCta=1;
var me=document.currentScript,src=me&&me.src;
if(!src){var ss=document.getElementsByTagName('script');for(var i=0;i<ss.length;i++){if(/shared\/(mc-cta|var)\.js/.test(ss[i].src)){src=ss[i].src;break}}}
if(!src)return;
var root=src.replace(/shared\/[^\/]*$/,'');
var path=location.pathname;
var EN=/^en/i.test(document.documentElement.lang||'')||/\/en\//.test(path);
var rp='';try{rp=new URL(root).pathname}catch(e){}
var rel=(rp&&path.indexOf(rp)===0?path.slice(rp.length):path.replace(/^\//,'')).replace(/^en\//,'');
var tool=(rel.split('/')[0]||'');
if(!tool||tool==='musiccanvas'||tool==='music-video-no-subscription')return;
var href=root+(EN?'en/':'')+'musiccanvas/';
/* 상단 고정 바 오른쪽 작은 "뮤직캔버스" 버튼 */
(function(){if(window.__mcPill)return;window.__mcPill=1;
function add(){var h=document.querySelector('header.top .top-in');if(!h||h.querySelector('.mc-pill'))return;
var st=document.createElement('style');
st.textContent='header.top .mc-pill{flex:0 0 auto;display:inline-flex;align-items:center;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap;color:var(--accent,#b9a0ff);border:1px solid var(--accent,#b9a0ff);border-radius:999px;padding:6px 13px;background:transparent;transition:.15s}header.top .mc-pill:hover{background:var(--accent,#b9a0ff);color:#14101a}header.top .mc-pill .s{display:none}@media (max-width:560px){header.top .mc-pill{padding:6px 11px}header.top .mc-pill .l{display:none}header.top .mc-pill .s{display:inline}}';
document.head.appendChild(st);
var a=document.createElement('a');a.className='mc-pill';a.target='_blank';a.rel='noopener';
a.href='https://kkwd21.gumroad.com/l/musiccanvas?utm_source=tools&utm_medium=header&utm_campaign='+encodeURIComponent(tool);
a.innerHTML=EN?'<span class="l">MusicCanvas · 7-day free</span><span class="s">Make video</span>':'<span class="l">뮤직캔버스 · 7일 무료</span><span class="s">영상 만들기</span>';
a.title=EN?'MusicCanvas — turn your song into a lyric video (Windows)':'뮤직캔버스 — 내 노래를 가사 영상으로 (Windows)';
h.appendChild(a)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add()})();


var K={
 ko:{
  lrc:['자막 완성! 이제 영상으로','이 가사 자막을 노래와 함께 넣으면 가사가 흐르는 유튜브 영상이 돼요.'],
  cover:['커버 완성! 이제 영상으로','이 커버를 배경으로 노래 영상을 바로 만들어요.'],
  song:['노래가 나오면, 영상까지 한 번에','수노 곡에 가사 자막과 배경을 넣어 유튜브용 영상으로 만들어요.'],
  mp3:['곡 정리 끝! 플레이리스트 영상으로','여러 곡을 한 번에 플레이리스트 영상으로 만들어요.'],
  shorts:['쇼츠·틱톡 영상도 한 번에','가사 자막이 있는 세로 영상을 바로 만들어요.'],
  upload:['올릴 영상이 아직 없다면','노래 파일만 있으면 가사 자막 영상을 만들어요.'],
  other:['이 노래로 영상도 만들어 보세요','노래 파일만 넣으면 가사 자막과 배경이 있는 영상이 돼요.'],
  btn:'뮤직캔버스 7일 무료로 해 보기 →',sub:'Windows 프로그램 · 구독 없음',x:'닫기'},
 en:{
  lrc:['Subtitles done! Now make the video','Add this LRC file to your song and get a YouTube video with flowing lyrics.'],
  cover:['Cover done! Now make the video','Use this cover as the background of your music video.'],
  song:['Got your song? Make the video too','Turn your Suno track into a YouTube video with lyrics and a background.'],
  mp3:['Tracks ready! Make a playlist video','Turn several songs into one playlist video.'],
  shorts:['Shorts & TikTok videos in one go','Make vertical videos with lyric subtitles.'],
  upload:['No video to upload yet?','All you need is the song file to make a lyric video.'],
  other:['Make a video with your song','Drop in a song file and get a video with lyrics and a background.'],
  btn:'Try MusicCanvas free for 7 days →',sub:'Windows app · no subscription',x:'Close'}
};
var T=K[EN?'en':'ko'];
var kind={'lrc-maker':'lrc','cover-maker':'cover','mp3-merge-cut':'mp3','shorts-clip':'shorts',
 'upload-kit':'upload','meta-generator':'upload','thumbnail-text':'upload','channel-check':'upload',
 'ringtone-maker':'other','emoticon-maker':'other'}[tool]||'song';
var msg=T[kind];

function get(s,k){try{return s.getItem(k)}catch(e){return null}}
function set(s,k,v){try{s.setItem(k,v)}catch(e){}}
var SK='mc_cta_seen_'+tool,LK='mc_cta_off';
function blocked(){
 if(get(window.sessionStorage||{},SK))return true;
 var off=+get(window.localStorage||{},LK)||0;
 return off&&Date.now()<off;
}

var NEG=/찾기|효과로 저장|넣기|열기|가져오기|불러오기|고르기|선택|\bopen\b|\bload\b|import|choose|select|find/i,WORD=/복사|저장|다운|내려받|ZIP|파일|copy|download|save|export/i,box=null,timer=0;
document.addEventListener('click',function(e){
 var t=e.target&&e.target.closest&&e.target.closest('a,button,[role="button"]');
 if(!t||(box&&box.contains(t)))return;
 var txt=(t.textContent||'')+' '+(t.getAttribute('aria-label')||'')+' '+(t.getAttribute('title')||'');
 if(!t.hasAttribute('download')&&(!WORD.test(txt)||NEG.test(txt)))return;
 if(blocked())return;
 clearTimeout(timer);timer=setTimeout(show,1100);
},true);

function show(){
 if(box||blocked())return;
 set(window.sessionStorage||{},SK,'1');
 var st=document.createElement('style');
 st.textContent='.mccta{position:fixed;left:50%;bottom:16px;transform:translate(-50%,140%);z-index:2147483000;width:calc(100% - 32px);max-width:520px;box-sizing:border-box;padding:16px 18px 14px;border:2px solid var(--accent,#b9a0ff);border-radius:16px;background:var(--panel,#121a31);color:var(--text,#f3f0e8);box-shadow:0 12px 40px rgba(0,0,0,.45);font:14px/1.5 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;transition:transform .35s cubic-bezier(.2,.8,.2,1)}'
 +'.mccta.on{transform:translate(-50%,0)}'
 +'.mccta b{display:block;font-size:16px;margin:0 28px 4px 0}'
 +'.mccta p{margin:0 0 12px;color:var(--muted,#98a2c4)}'
 +'.mccta a.go{display:block;text-align:center;padding:12px 14px;border-radius:12px;background:var(--accent,#b9a0ff);color:#0b0f1d;font-weight:700;text-decoration:none}'
 +'.mccta a.go:hover{filter:brightness(1.08)}'
 +'.mccta small{display:block;text-align:center;margin-top:6px;font-size:12px;color:var(--muted,#98a2c4)}'
 +'.mccta .x{position:absolute;top:8px;right:8px;width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:var(--muted,#98a2c4);font-size:20px;line-height:1;cursor:pointer}'
 +'.mccta .x:hover{background:rgba(255,255,255,.08);color:var(--text,#f3f0e8)}'
 +'@media (prefers-reduced-motion:reduce){.mccta{transition:none}}';
 document.head.appendChild(st);
 box=document.createElement('aside');
 box.className='mccta';box.setAttribute('aria-live','polite');
 box.innerHTML='<button type="button" class="x" aria-label="'+T.x+'">×</button><b></b><p></p><a class="go"></a><small></small>';
 box.querySelector('b').textContent=msg[0];
 box.querySelector('p').textContent=msg[1];
 var a=box.querySelector('a.go');a.textContent=T.btn;a.href=href;
 box.querySelector('small').textContent=T.sub;
 box.querySelector('.x').onclick=function(){
  set(window.localStorage||{},LK,String(Date.now()+3*864e5));
  box.classList.remove('on');setTimeout(function(){box&&box.remove()},400);
 };
 document.body.appendChild(box);
 requestAnimationFrame(function(){requestAnimationFrame(function(){box.classList.add('on')})});
}
})();
