/* Dusk Soul 툴킷: 뮤직캔버스 소개 페이지 → 방금 보던 도구로 돌아가는 링크 (상단 고정 바) */
(function(){
if(window.__mcBack)return;window.__mcBack=1;
var me=document.currentScript,src=me&&me.src;
if(!src){var ss=document.getElementsByTagName('script');for(var i=0;i<ss.length;i++){if(/shared\/mc-back\.js/.test(ss[i].src)){src=ss[i].src;break}}}
if(!src)return;
var root=src.replace(/shared\/[^\/]*$/,'');
var EN=/^en/i.test(document.documentElement.lang||'')||/\/en\//.test(location.pathname);
var KO={'sound-finder':'좋아하는 노래처럼 만들기','make-song':'곡 만들기','lrc-maker':'가사 자막','cover-maker':'앨범 커버','ringtone-maker':'벨소리','upload-kit':'유튜브 올리기','shorts-clip':'쇼츠 자르기','mp3-merge-cut':'mp3 합치기','emoticon-maker':'이모티콘','song-analyzer':'곡 분석','thumbnail-text':'썸네일 문구','meta-generator':'메타 생성기','channel-check':'채널 체크','prompt-studio':'프롬프트','lyrics-generator':'가사 생성기','pronunciation-check':'발음 점검','suno-checker':'수노 점검기','suno-lyrics-order':'가사 주문서','genre':'장르 프롬프트','music-video-no-subscription':'비교 페이지','':'도구 모음'};
var EN_={'sound-finder':'Suno prompts','make-song':'Make a song','lrc-maker':'Lyric subtitles','cover-maker':'Cover maker','ringtone-maker':'Ringtones','upload-kit':'Upload guide','shorts-clip':'Shorts clip','mp3-merge-cut':'MP3 merge & cut','emoticon-maker':'Emoticons','song-analyzer':'Song analyzer','thumbnail-text':'Thumbnail text','meta-generator':'Metadata','channel-check':'Channel check','prompt-studio':'Prompt Studio','lyrics-generator':'Lyrics','pronunciation-check':'Pronunciation','suno-checker':'Suno checker','suno-lyrics-order':'Lyrics order','genre':'Genre prompts','music-video-no-subscription':'Comparison','':'Toolkit'};
var ENSET=['cover-maker','emoticon-maker','genre','lrc-maker','lyrics-generator','make-song','mp3-merge-cut','music-video-no-subscription','ringtone-maker','shorts-clip','song-analyzer','suno-checker','thumbnail-text','upload-kit'];
function get(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
var rp='';try{rp=new URL(root).pathname}catch(e){}
function toolOf(u){try{var p=new URL(u,location.href);if(p.origin!==location.origin)return null;var path=p.pathname;if(rp&&path.indexOf(rp)!==0)return null;var rel=path.slice(rp.length).replace(/^en\//,'');var seg=rel.split('/')[0];if(seg==='index.html')seg='';if(seg==='musiccanvas')return null;if(!(seg in KO))return null;return {tool:seg,url:p.href}}catch(e){return null}}
var back=null;
if(document.referrer)back=toolOf(document.referrer);
if(!back){var q=(location.search.match(/[?&]from=([^&]+)/)||[])[1];if(q){q=decodeURIComponent(q).replace(/^header-/,'');if(q in KO)back={tool:q,url:root+(EN&&q&&ENSET.indexOf(q)>=0?'en/':'')+(q?q+'/':'')}}}
if(back)set('mc_back',JSON.stringify(back));else{try{back=JSON.parse(get('mc_back')||'null')}catch(e){back=null}}
if(!back||!back.url)return;
function add(){var h=document.querySelector('header.top .top-in');if(!h||h.querySelector('.mc-back'))return;
var st=document.createElement('style');
st.textContent='header.top .mc-back{flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap;color:#14101a;background:var(--accent,#b9a0ff);border:1px solid var(--accent,#b9a0ff);border-radius:999px;padding:6px 13px}header.top .mc-back:hover{filter:brightness(1.1)}header.top .mc-back .s{display:none}@media (max-width:560px){header.top.has-back .gnav{display:none}header.top.has-back .top-in{gap:10px}header.top.has-back .mc-back{margin-right:auto}header.top .mc-back{padding:6px 11px}header.top .mc-back .l{display:none}header.top .mc-back .s{display:inline}}';
document.head.appendChild(st);
var lab=(EN?EN_:KO)[back.tool];var a=document.createElement('a');a.className='mc-back';a.href=back.url;
a.innerHTML=EN?'<span class="l">← Back to '+lab+'</span><span class="s">← Back</span>':'<span class="l">← '+lab+'(으)로 돌아가기</span><span class="s">← 돌아가기</span>';
if(!EN&&/[가-힣]$/.test(lab)){var c=lab.charCodeAt(lab.length-1)-0xAC00;var jong=c>=0?c%28:0;a.querySelector('.l').textContent='← '+lab+(jong?'으로':'로')+' 돌아가기'}
h.parentNode.classList.add('has-back');var nav=h.querySelector('.gnav');h.insertBefore(a,nav||h.children[1]||null)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();
