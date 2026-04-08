
/* ═══════════════════════════════════════════════════
   SUPABASE
═══════════════════════════════════════════════════ */
const SUPABASE_URL = "https://jqlvryoppbhmdzjdxnjq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbHZyeW9wcGJobWR6amR4bmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwODc5ODIsImV4cCI6MjA5MDY2Mzk4Mn0.yfKVfiJIW0bQBZ8jb-93AqgXUXQstAfAR5Z4YaVQtnY";

async function dbInsert(table, row) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Prefer":"return=minimal"},
      body:JSON.stringify(row),
    });
    return r.ok;
  } catch { return false; }
}
async function dbSelect(table, params) {
  try {
    const qs = new URLSearchParams(params).toString();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
      headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},
    });
    return r.ok ? r.json() : [];
  } catch { return []; }
}

/* ═══════════════════════════════════════════════════
   FLAGS
═══════════════════════════════════════════════════ */
const FLAGS = [
  "🌍","🏳️","🇦🇺","🇦🇹","🇧🇪","🇧🇷","🇨🇦","🇨🇱","🇨🇳","🇨🇴",
  "🇭🇷","🇨🇿","🇩🇰","🇪🇬","🇫🇮","🇫🇷","🇩🇪","🇬🇷","🇭🇰","🇭🇺",
  "🇮🇳","🇮🇩","🇮🇪","🇮🇱","🇮🇹","🇯🇵","🇰🇪","🇰🇷","🇲🇾","🇲🇽",
  "🇳🇱","🇳🇿","🇳🇬","🇳🇴","🇵🇰","🇵🇭","🇵🇱","🇵🇹","🇷🇴","🇷🇺",
  "🇸🇦","🇿🇦","🇸🇪","🇨🇭","🇹🇭","🇹🇷","🇺🇦","🇦🇪","🇬🇧","🇺🇸",
  "🇻🇳","🇦🇷","🇸🇬","🇪🇸","🇸🇰","🇸🇮","🇪🇪","🇱🇻","🇱🇹","🇮🇸",
];

let selectedFlag = "🌍";

function buildFlagPicker() {
  const grid = document.getElementById("flag-grid");
  const saved = getSavedFlag();
  selectedFlag = saved;
  document.getElementById("flag-selected").textContent = saved;
  grid.innerHTML = "";
  FLAGS.forEach(f => {
    const btn = document.createElement("button");
    btn.className = "flag-opt" + (f === saved ? " selected" : "");
    btn.textContent = f;
    btn.addEventListener("click", () => {
      selectedFlag = f;
      document.getElementById("flag-selected").textContent = f;
      grid.querySelectorAll(".flag-opt").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      saveFlag(f); SFX.click();
    });
    grid.appendChild(btn);
  });
}

/* ═══════════════════════════════════════════════════
   SCREENS
═══════════════════════════════════════════════════ */
const SCREEN_IDS = [
  "home","start","game","name","leaderboard","win",
  "rt","rt-end","rt-handoff","rt-1v1",
  "sdk-diff","sudoku","sudoku-win","sudoku-end","stats"
];

function showScreen(name) {
  SCREEN_IDS.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) el.classList.toggle("hidden", s !== name);
  });
}

/* ═══════════════════════════════════════════════════
   AUDIO
═══════════════════════════════════════════════════ */
let _actx = null;
function ac() { if(!_actx)_actx=new(window.AudioContext||window.webkitAudioContext)(); if(_actx.state==="suspended")_actx.resume(); return _actx; }
function beep(freq,type,dur,vol=0.24,delay=0){try{const ctx=ac(),osc=ctx.createOscillator(),g=ctx.createGain();osc.connect(g);g.connect(ctx.destination);osc.type=type;osc.frequency.value=freq;const t=ctx.currentTime+delay;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);osc.start(t);osc.stop(t+dur);}catch(_){}}
const SFX={
  correct()  {beep(880,"sine",.07,.2);},
  wrong()    {beep(140,"sawtooth",.16,.28);},
  levelup()  {[523,659,784,1047].forEach((f,i)=>beep(f,"sine",.14,.24,i*.09));},
  win()      {[523,659,784,1047,1319,1568].forEach((f,i)=>beep(f,"sine",.18,.28,i*.09));},
  combo(n)   {beep(440+Math.min(n,15)*36,"sine",.06,.16);},
  click()    {beep(900,"sine",.03,.1);},
  rtGo()     {beep(1047,"sine",.09,.24);},
  rtEarly()  {beep(200,"square",.14,.22);},
  rtFake()   {beep(180,"square",.12,.18);},
  noteOn()   {beep(660,"sine",.04,.09);},
  sdkWin()   {[523,659,784,880,1047].forEach((f,i)=>beep(f,"sine",.16,.24,i*.09));},
  achieve()  {[880,1047,1319].forEach((f,i)=>beep(f,"sine",.11,.2,i*.1));},
  submit()   {[660,880,1047].forEach((f,i)=>beep(f,"sine",.12,.22,i*.08));},
};

function shakeEl(el){el.classList.remove("shaking");void el.offsetWidth;el.classList.add("shaking");setTimeout(()=>el.classList.remove("shaking"),360);}
function spawnParticles(x,y,count=14){const colors=["#60a5fa","#a78bfa","#4ade80","#fbbf24","#f87171","#fb923c"];for(let i=0;i<count;i++){const p=document.createElement("div");p.className="particle";const angle=(360/count)*i+Math.random()*20,dist=40+Math.random()*75,dx=Math.cos(angle*Math.PI/180)*dist,dy=Math.sin(angle*Math.PI/180)*dist,sz=Math.floor(4+Math.random()*5);p.style.cssText=`left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${colors[Math.random()*colors.length|0]}`;document.body.appendChild(p);p.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0)`,opacity:0}],{duration:520+Math.random()*280,easing:"ease-out",fill:"forwards"}).onfinish=()=>p.remove();}}

/* ═══════════════════════════════════════════════════
   ACHIEVEMENTS
═══════════════════════════════════════════════════ */
const ACH={
  first_score:  {icon:"🏆",label:"First Score",   desc:"Submit to leaderboard"},
  on_fire:      {icon:"🔥",label:"On Fire",        desc:"15x combo in SL"},
  ghost_beast:  {icon:"👻",label:"Ghost Beast",    desc:"Score 30+ in Ghost mode"},
  flawless:     {icon:"✨",label:"Flawless",       desc:"Sudoku with 0 mistakes"},
  cyborg:       {icon:"🤖",label:"Cyborg",         desc:"Reaction under 200ms"},
  daily_done:   {icon:"📅",label:"Daily",          desc:"Complete daily sudoku"},
  hot_seat:     {icon:"⚔️",label:"1v1 Champ",      desc:"Win a 1v1 match"},
  centurion:    {icon:"💯",label:"Centurion",      desc:"Score 100+ in SL"},
  world_top10:  {icon:"🌍",label:"World Top 10",   desc:"Appear in top 10"},
  sharpshooter: {icon:"🎯",label:"Sharpshooter",   desc:"Perfect RT — no early/fake presses"},
  speed_demon:  {icon:"💨",label:"Speed Demon",    desc:"RT average under 200ms"},
  daily_3:      {icon:"🗓️",label:"3-Day Streak",  desc:"Daily sudoku 3 days in a row"},
  lucky_7:      {icon:"🍀",label:"Lucky Seven",    desc:"Daily sudoku 7 days in a row"},
  hint_free:    {icon:"🧩",label:"No Hints",       desc:"Solve Hard sudoku with no hints and 0 mistakes"},
  combinator:   {icon:"⚡",label:"Combinator",    desc:"Reach 25x combo in SL"},
  shielded:     {icon:"🛡️",label:"Shielded",        desc:"Block a wrong answer with combo shield"},
};
function getAch(){try{return JSON.parse(localStorage.getItem("ach")||"{}");}catch{return{};}}
function unlockAch(id){const a=getAch();if(a[id])return;a[id]=Date.now();try{localStorage.setItem("ach",JSON.stringify(a));}catch{}SFX.achieve();const t=document.getElementById("ach-toast");t.innerHTML=`${ACH[id].icon} <strong>${ACH[id].label}</strong> unlocked!`;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600);renderAchBar();}
function renderAchBar(){const bar=document.getElementById("ach-bar"),a=getAch();bar.innerHTML=Object.entries(ACH).map(([id,d])=>`<span class="ach-badge${a[id]?" unlocked":""}" title="${d.label}: ${d.desc}">${d.icon}</span>`).join("");}

/* ═══════════════════════════════════════════════════
   LOCAL STORAGE
═══════════════════════════════════════════════════ */
function getHS()       {try{return parseInt(localStorage.getItem("sl_hs")||"0");}catch{return 0;}}
function saveHS(s)     {try{if(s>getHS())localStorage.setItem("sl_hs",s);}catch{}}
function getSavedName(){try{return localStorage.getItem("sl_name")||"";}catch{return "";}}
function saveName(n)   {try{localStorage.setItem("sl_name",n);}catch{}}
function getSavedFlag(){try{return localStorage.getItem("sl_flag")||"🌍";}catch{return "🌍";}}
function saveFlag(f)   {try{localStorage.setItem("sl_flag",f);}catch{}}

/* ═══════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════ */
function getStats(){try{return JSON.parse(localStorage.getItem("player_stats")||"{}");}catch{return{};}}
function saveStats(s){try{localStorage.setItem("player_stats",JSON.stringify(s));}catch{}}
function updateSLStats(score,level,combo){const s=getStats();if(!s.sl)s.sl={games:0,bestScore:0,bestLevel:0,bestCombo:0};s.sl.games++;if(score>s.sl.bestScore)s.sl.bestScore=score;if(level>s.sl.bestLevel)s.sl.bestLevel=level;if(combo>s.sl.bestCombo)s.sl.bestCombo=combo;saveStats(s);}
function updateRTStats(avg,best){const s=getStats();if(!s.rt)s.rt={games:0,bestAvg:9999,bestSingle:9999};s.rt.games++;if(avg<s.rt.bestAvg)s.rt.bestAvg=avg;if(best!=null&&best<s.rt.bestSingle)s.rt.bestSingle=best;saveStats(s);}
function updateSDKStats(secs,mistakes){const s=getStats();if(!s.sdk)s.sdk={games:0,bestTime:0,bestMistakes:99};s.sdk.games++;if(!s.sdk.bestTime||secs<s.sdk.bestTime)s.sdk.bestTime=secs;if(mistakes<s.sdk.bestMistakes)s.sdk.bestMistakes=mistakes;saveStats(s);}

/* ─────────────────────────────────────────────── */
function getDailyStreak(){try{const today=new Date().toISOString().slice(0,10),yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10),last=localStorage.getItem("daily_last")||"",streak=parseInt(localStorage.getItem("daily_streak")||"0");if(last===today||last===yesterday)return streak;return 0;}catch{return 0;}}
function saveDailyStreak(){try{const today=new Date().toISOString().slice(0,10),yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10),last=localStorage.getItem("daily_last")||"";if(last===today)return;let streak=parseInt(localStorage.getItem("daily_streak")||"0");streak=last===yesterday?streak+1:1;localStorage.setItem("daily_streak",streak);localStorage.setItem("daily_last",today);if(streak>=3)unlockAch("daily_3");if(streak>=7)unlockAch("lucky_7");}catch{}}
function renderStatsScreen(){const s=getStats(),sl=s.sl||{games:0,bestScore:0,bestLevel:0,bestCombo:0},rt=s.rt||{games:0,bestAvg:9999,bestSingle:9999},sdk=s.sdk||{games:0,bestTime:0,bestMistakes:99},streak=getDailyStreak();document.getElementById("stats-sl-games").textContent=sl.games;document.getElementById("stats-sl-best").textContent=sl.bestScore?`${sl.bestScore} pts`:"–";document.getElementById("stats-sl-combo").textContent=sl.bestCombo?`${sl.bestCombo}x`:"–";document.getElementById("stats-rt-games").textContent=rt.games;document.getElementById("stats-rt-best-avg").textContent=rt.bestAvg<9999?`${rt.bestAvg} ms`:"–";document.getElementById("stats-rt-best-single").textContent=rt.bestSingle<9999?`${rt.bestSingle} ms`:"–";document.getElementById("stats-sdk-games").textContent=sdk.games;if(sdk.bestTime){const m=Math.floor(sdk.bestTime/60),sc=sdk.bestTime%60;document.getElementById("stats-sdk-best").textContent=`${m}:${String(sc).padStart(2,"0")}`;}else{document.getElementById("stats-sdk-best").textContent="–";}document.getElementById("stats-streak-num").textContent=streak||0;}

/* ═══════════════════════════════════════════════════
   SEEDED RNG
═══════════════════════════════════════════════════ */
function mkRng        (seed){let s=seed>>>0;return()=>{s=Math.imul(s^s>>>15,s|1);s^=s+Math.imul(s^s>>>7,s|61);return((s^s>>>14)>>>0)/0xffffffff;};}
function dateSeed     (){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
function isDailyDone  (){try{return localStorage.getItem("daily_date")===new Date().toISOString().slice(0,10);}catch{return false;}}
function markDailyDone(){try{localStorage.setItem("daily_date",new Date().toISOString().slice(0,10));}catch{}unlockAch("daily_done");}

/* ═══════════════════════════════════════════════════
   SWIPE DECK
═══════════════════════════════════════════════════ */
const MODES=[
  {id:"sl",    emoji:"🧠",name:"SL Challenge",   desc:"Endless — get on the world leaderboard",      tags:["10 Levels","Endless","🌍 Global"],  bg:"linear-gradient(145deg,#0f2044,#1a1060)", bgLight:"linear-gradient(145deg,#e0f2fe,#dbeafe)", glow:"rgba(96,165,250,.35)", accent:"#60a5fa"},
  {id:"rt",    emoji:"⚡",name:"Reaction Test",  desc:"Hit SPACE the instant you see green",          tags:["5 Rounds","1v1 mode","Reflexes"],  bg:"linear-gradient(145deg,#0a2e1a,#061f0f)", bgLight:"linear-gradient(145deg,#dcfce7,#d1fae5)", glow:"rgba(34,197,94,.35)",  accent:"#4ade80"},
  {id:"sudoku",emoji:"🔢",name:"Sudoku",         desc:"Fill the grid — no repeats in row, col or box",tags:["3 Diffs","Notes","Logic"],          bg:"linear-gradient(145deg,#2a1a0e,#1a0f05)", bgLight:"linear-gradient(145deg,#fef9c3,#fef3c7)", glow:"rgba(251,191,36,.3)",  accent:"#fbbf24"},
  {id:"daily", emoji:"📅",name:"Daily Challenge",desc:"Today's seeded puzzle — same for everyone",    tags:["Sudoku","Seeded","Daily"],          bg:"linear-gradient(145deg,#1a0a2e,#0f0520)", bgLight:"linear-gradient(145deg,#f3e8ff,#ede9fe)", glow:"rgba(168,139,250,.3)", accent:"#a78bfa"},
  {id:"lb",    emoji:"🌍",name:"Leaderboard",    desc:"World rankings across all three games",        tags:["SL","Reaction","Sudoku"],           bg:"linear-gradient(145deg,#0d2020,#061410)", bgLight:"linear-gradient(145deg,#ccfbf1,#d1fae5)", glow:"rgba(20,184,166,.3)",  accent:"#2dd4bf"},
  {id:"stats", emoji:"📊",name:"My Stats",       desc:"Personal records, streaks and history",        tags:["Records","Streaks","History"],      bg:"linear-gradient(145deg,#1a0e2e,#0e0620)", bgLight:"linear-gradient(145deg,#f5f3ff,#ede9fe)", glow:"rgba(139,92,246,.3)",  accent:"#a78bfa"},
];

let      deckIdx=0,dragging=false,dragX=0,dragStart=0,ptId=null;
const    topCard=document.getElementById("swipe-top"),backCard=document.getElementById("swipe-back");
function getStampP(){return document.getElementById("stamp-play");}
function getStampS(){return document.getElementById("stamp-skip");}
const    THRESH=72,MAX_ROT=18,FLY=520;

function renderCard(el,m){
  el.innerHTML="";
  if(el===topCard){const sp=document.createElement("div");sp.className="stamp stamp-play";sp.id="stamp-play";sp.textContent="PLAY";el.appendChild(sp);const ss=document.createElement("div");ss.className="stamp stamp-skip";ss.id="stamp-skip";ss.textContent="SKIP";el.appendChild(ss);}
  el.style.background=m.bg;
  el.style.boxShadow=`inset 0 0 0 2px rgba(255,255,255,.08),0 20px 52px ${m.glow},0 8px 20px rgba(0,0,0,.5)`;
  const f=document.createDocumentFragment();
  ["card-emoji","card-name","card-desc"].forEach((cls,i)=>{const d=document.createElement("div");d.className=cls;d.textContent=[m.emoji,m.name,m.desc][i];f.appendChild(d);});
  const tags=document.createElement("div");tags.className="card-tags";
  m.tags.forEach(t=>{const s=document.createElement("span");s.className="card-tag";s.textContent=t;s.style.borderColor=m.accent+"55";s.style.color=m.accent;tags.appendChild(s);});
  f.appendChild(tags);el.appendChild(f);
}
function renderDeck(){
  renderCard(backCard,MODES[(deckIdx+1)%MODES.length]);
  renderCard(topCard, MODES[deckIdx%MODES.length]);
  topCard.style.opacity="";topCard.style.transform="";topCard.style.transition="";
  const _m=MODES[deckIdx%MODES.length];topCard.style.background=document.body.classList.contains("theme-light")?(_m.bgLight||_m.bg):_m.bg;
  backCard.style.transform="scale(.92) translateY(10px)";backCard.style.transition="";
  getStampP().style.opacity=getStampS().style.opacity="0";
}
function setDrag(dx){const r=Math.min(Math.abs(dx)/150,1);topCard.style.transform=`translateX(${dx}px) rotate(${dx/150*MAX_ROT}deg)`;getStampP().style.opacity=dx>0?String(Math.min(r*1.4,1)):"0";getStampS().style.opacity=dx<0?String(Math.min(r*1.4,1)):"0";backCard.style.transform=`scale(${.92+r*.08}) translateY(${10-r*10}px)`;}
function flyOff(dir){topCard.style.transition="transform .38s cubic-bezier(.25,.8,.5,1),opacity .38s";topCard.style.transform=`translateX(${dir==="right"?FLY:-FLY}px) rotate(${dir==="right"?MAX_ROT:-MAX_ROT}deg)`;topCard.style.opacity="0";backCard.style.transition="transform .38s";backCard.style.transform="scale(1) translateY(0)";setTimeout(()=>{const m=MODES[deckIdx%MODES.length];deckIdx++;dir==="right"?launch(m.id):renderDeck();},380);}
function snapBack(){topCard.style.transition="transform .35s cubic-bezier(.34,1.56,.64,1)";topCard.style.transform="";backCard.style.transition="transform .35s";backCard.style.transform="scale(.92) translateY(10px)";getStampP().style.opacity=getStampS().style.opacity="0";}
function launch(id){if(id==="sl"){refreshSLScreen();showScreen("start");}else if(id==="rt")startRT(false);else if(id==="sudoku")showScreen("sdk-diff");else if(id==="daily")startDailyChallenge();else if(id==="lb")openLeaderboard("sl",null,null);else if(id==="stats"){renderStatsScreen();showScreen("stats");}}

topCard .addEventListener("pointerdown",e=>{dragging=true;dragStart=e.clientX;dragX=0;ptId=e.pointerId;topCard.setPointerCapture(e.pointerId);topCard.style.transition="";});
topCard .addEventListener("pointermove",e=>{if(!dragging||e.pointerId!==ptId)return;dragX=e.clientX-dragStart;setDrag(dragX);});
topCard .addEventListener("pointerup",  e=>{if(!dragging||e.pointerId!==ptId)return;dragging=false;dragX>THRESH?flyOff("right"):dragX<-THRESH?flyOff("left"):snapBack();});
topCard .addEventListener("pointercancel",()=>{dragging=false;snapBack();});
document.getElementById  ("btn-like").addEventListener("click",()=>{setDrag(THRESH+10);setTimeout(()=>flyOff("right"),50);});
document.getElementById  ("btn-nope").addEventListener("click",()=>{setDrag(-(THRESH+10));setTimeout(()=>flyOff("left"),50);});
document.addEventListener("keydown",e=>{if(!document.getElementById("screen-home").classList.contains("hidden")){if(e.key==="ArrowRight"){setDrag(THRESH+10);setTimeout(()=>flyOff("right"),50);}if(e.key==="ArrowLeft"){setDrag(-(THRESH+10));setTimeout(()=>flyOff("left"),50);}}});

function goHome(){slAlive=false;stopSLTimer();stopIdle();sdkStopTimer();sdkSetNotesMode(false);deckIdx=0;renderDeck();renderAchBar();showScreen("home");}
renderDeck();renderAchBar();

/* ═══════════════════════════════════════════════════
   GENERIC NAME+FLAG SUBMIT FLOW
   Used by SL, RT, Sudoku
═══════════════════════════════════════════════════ */
let _submitCallback = null;

function openNameEntry(titleText, titleClass, scoreLine, isNewBest, callback) {
  document.getElementById("name-title").textContent = titleText;
  document.getElementById("name-title").className = `end-title ${titleClass}`;
  document.getElementById("name-score-val").textContent = "";
  document.getElementById("name-level-val").textContent = "";
  // scoreLine goes into end-score manually
  const scoreEl = document.querySelector("#screen-name .end-score");
  scoreEl.innerHTML = scoreLine;
  const nb = document.getElementById("name-new-best");
  isNewBest ? nb.classList.remove("hidden") : nb.classList.add("hidden");
  document.getElementById("name-input").value = getSavedName();
  buildFlagPicker();
  _submitCallback = callback;
  showScreen("name");
  setTimeout(()=>document.getElementById("name-input").focus(),200);
}

document.getElementById("btn-submit-score").addEventListener("click", doSubmit);
document.getElementById("btn-skip-submit") .addEventListener("click", ()=>{ if(_submitCallback) _submitCallback(null,null); });
document.getElementById("name-input").addEventListener("keydown",e=>{ if(e.key==="Enter") doSubmit(); });

async function doSubmit() {
  const name = (document.getElementById("name-input").value.trim().slice(0,16)) || "Anonymous";
  const flag = selectedFlag;
  saveName(name); saveFlag(flag);
  SFX.submit();
  const btn = document.getElementById("btn-submit-score");
  btn.textContent="Submitting…"; btn.disabled=true;
  if (_submitCallback) await _submitCallback(name, flag);
  btn.textContent="Submit to World 🌍"; btn.disabled=false;
}

/* ═══════════════════════════════════════════════════
   LEADERBOARD (all games)
═══════════════════════════════════════════════════ */
let lbGame="sl", lbTimeTab="all", lbHighlight=null;

document.getElementById  ("btn-lb-close").addEventListener("click",goHome);
document.getElementById  ("btn-lb-home") .addEventListener("click",goHome);
document.getElementById  ("btn-lb-play") .addEventListener("click",()=>{refreshSLScreen();showScreen("start");});
document.querySelectorAll(".lb-game-tab").forEach(btn=>btn.addEventListener("click",()=>{lbGame=btn.dataset.game;document.querySelectorAll(".lb-game-tab").forEach(b=>b.classList.remove("active"));btn.classList.add("active");loadLeaderboard();}));
document.querySelectorAll(".lb-tab").forEach(btn=>btn.addEventListener("click",()=>{lbTimeTab=btn.dataset.tab;document.querySelectorAll(".lb-tab").forEach(b=>b.classList.remove("active"));btn.classList.add("active");loadLeaderboard();}));

async function openLeaderboard(game, name, score) {
  lbGame = game || "sl";
  lbHighlight = name && score!==null ? {name,score} : null;
  document.querySelectorAll(".lb-game-tab").forEach(b=>b.classList.toggle("active",b.dataset.game===lbGame));
  document.querySelectorAll(".lb-tab").forEach(b=>b.classList.toggle("active",b.dataset.tab==="all"));
  lbTimeTab="all";
  showScreen("leaderboard");
  loadLeaderboard();
}

// Score display helpers per game
function lbScoreLabel(game, score, meta) {
  if (game==="sl")     return `${score} pts`;
  if (game==="rt")     return `${score} ms avg`;
  if (game==="sudoku") {
    const m=Math.floor(score/60), s=score%60;
    return `${m}:${String(s).padStart(2,"0")}`;
  }
  return score;
}

function lbMetaLabel(game, meta) {
  if (!meta) return "";
  if (game==="sl")     return `Lvl ${meta.level||1}`;
  if (game==="rt")     return `best ${meta.best||"-"}ms`;
  if (game==="sudoku") return `${meta.mistakes||0} ✕ · ${meta.difficulty||""}`;
  return "";
}

// Lower is better for RT and Sudoku
function lbOrderParam(game) {
  return game==="sl" ? "score.desc" : "score.asc";
}

async function loadLeaderboard() {
  const list=document.getElementById("lb-list");
  list.innerHTML=`<div class="lb-loading">Loading…</div>`;
  const params={select:"name,flag,score,meta,created_at",order:lbOrderParam(lbGame),limit:"15","game":`eq.${lbGame}`};
  if(lbTimeTab==="today"){const t=new Date();t.setHours(0,0,0,0);params["created_at"]=`gte.${t.toISOString()}`;}
  else if(lbTimeTab==="week"){const t=new Date();t.setDate(t.getDate()-7);params["created_at"]=`gte.${t.toISOString()}`;}
  const rows=await dbSelect("game_scores",params);
  list.innerHTML="";
  if(!rows||!rows.length){list.innerHTML=`<div class="lb-error">No scores yet — be the first!</div>`;document.getElementById("lb-your-rank").textContent="";return;}

  let yourRank="", foundYou=false;
  rows.forEach((row,i)=>{
    const isYou=lbHighlight&&row.name===lbHighlight.name&&row.score===lbHighlight.score;
    const div=document.createElement("div");
    div.className=`lb-row${i===0?" top1":""}${isYou?" you":""}`;
    div.style.animationDelay=`${i*0.04}s`;
    const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`;
    const flag=row.flag||"🌍";
    div.innerHTML=`<span class="lb-rank">${medal}</span><span class="lb-flag">${flag}</span><span class="lb-name">${esc(row.name)}${isYou?" 👈":""}</span><span class="lb-score">${lbScoreLabel(lbGame,row.score,row.meta)}</span><span class="lb-meta">${lbMetaLabel(lbGame,row.meta)}</span>`;
    list.appendChild(div);
    if(isYou){foundYou=true;yourRank=`You're #${i+1} ${lbTimeTab==="today"?"today":"all time"}!`;if(i<10)unlockAch("world_top10");}
  });
  document.getElementById("lb-your-rank").textContent=yourRank;
}

function esc(s){return(s||"").replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]));}

/* ═══════════════════════════════════════════════════
   SL CHALLENGE
═══════════════════════════════════════════════════ */
const SL_SPEED={1:5000,2:4500,3:3800,4:3200,5:2600,6:2100,7:1700,8:1300,9:1000,10:750};
const SL_LEVELS=[0,10,20,35,50,70,95,125,160,200];
const SL_MAX_LEVEL=10;

let slScore=0,slLevel=1,slCurrent="",slAlive=false,slTime=60,slMaxTime=60;
let slTimer=null,slIdle=null,slCombo=0,slGhost=false,slGhostTO=null,slEndScore=0,slEndLevel=1;
let slSelectedTime=60,slLives=false,slLivesCount=0,slShield=false,slMaxCombo=0;

const letterEl=document.getElementById("letter"),hudScore=document.getElementById("hud-score"),hudLevel=document.getElementById("hud-level"),hudTime=document.getElementById("hud-time"),timerBar=document.getElementById("timer-bar"),comboEl=document.getElementById("sl-combo");

document.querySelectorAll(".time-btn").forEach(btn=>{btn.addEventListener("click",()=>{document.querySelectorAll(".time-btn").forEach(b=>b.classList.remove("active"));btn.classList.add("active");slSelectedTime=parseInt(btn.dataset.t);SFX.click();});});
document.getElementById  ("btn-ghost-toggle").addEventListener("click",()=>{slGhost=!slGhost;SFX.click();refreshSLScreen();});
document.getElementById  ("btn-lives-toggle").addEventListener("click",()=>{slLives=!slLives;SFX.click();refreshSLScreen();});
document.getElementById  ("btn-restart-win") .addEventListener("click",startSL);
document.getElementById  ("btn-win-home")    .addEventListener("click",goHome);
document.getElementById  ("btn-back-sl")     .addEventListener("click",goHome);

function refreshSLScreen(){document.getElementById("sl-highscore").textContent=getHS();const g=document.getElementById("btn-ghost-toggle");g.classList.toggle("on",slGhost);document.getElementById("ghost-state").textContent=slGhost?"ON":"OFF";document.getElementById("ghost-state").className=`option-state ${slGhost?"on":"off"}`;const lv=document.getElementById("btn-lives-toggle");lv.classList.toggle("on",slLives);document.getElementById("lives-state").textContent=slLives?"ON":"OFF";document.getElementById("lives-state").className=`option-state ${slLives?"on":"off"}`;}
function getLevelForScore(s){let lv=1;for(let i=SL_LEVELS.length-1;i>=0;i--){if(s>=SL_LEVELS[i]){lv=i+1;break;}}return Math.min(lv,SL_MAX_LEVEL);}

function updateHud()   {hudScore.textContent=`Score: ${slScore}`;hudLevel.textContent=`Lvl ${slLevel}`;if(slSelectedTime===99){hudTime.textContent="∞";timerBar.style.width="100%";timerBar.style.background="linear-gradient(90deg,#6366f1,#8b5cf6)";}else{hudTime.textContent=`⏱ ${slTime}s`;timerBar.style.width=`${(slTime/slMaxTime)*100}%`;timerBar.style.background=slTime>slMaxTime*.5?"linear-gradient(90deg,#22c55e,#84cc16)":slTime>slMaxTime*.25?"linear-gradient(90deg,#f59e0b,#f97316)":"linear-gradient(90deg,#ef4444,#dc2626)";}}
function stopSLTimer() {clearInterval(slTimer);}
function startSLTimer(){stopSLTimer();if(slSelectedTime===99){updateHud();return;}slTime=slMaxTime=slSelectedTime;updateHud();slTimer=setInterval(()=>{slTime--;updateHud();if(slTime<=0){slTime=0;slEnd("time");}},1000);}
function startIdle()   {clearTimeout(slIdle);slIdle=setTimeout(()=>{if(slAlive){slNext();startIdle();}},SL_SPEED[slLevel]??750);}
function stopIdle()    {clearTimeout(slIdle);}
function slRandom()    {const L=["S","L"],n=Math.random()<.5?1:2;let r="";for(let i=0;i<n;i++)r+=L[Math.floor(Math.random()*2)];return r;}
const    SL_KEYS=      {S:"s",L:"l",SS:"l",LL:"s",SL:" ",LS:" "};
function slNext()      {slCurrent=slRandom();letterEl.textContent=slCurrent;letterEl.className="letter-tile";clearTimeout(slGhostTO);if(slGhost)slGhostTO=setTimeout(()=>{if(slAlive){letterEl.textContent="?";letterEl.classList.add("ghost");}},220);}
function slFlash(cls)  {letterEl.classList.add(cls);setTimeout(()=>letterEl.classList.remove(cls),240);}
function updateCombo(){if(slShield&&slCombo>=3){comboEl.textContent=`🛡️🔥 ${slCombo}x`;comboEl.className="sl-combo active";}else if(slCombo>=3){comboEl.textContent=`🔥 ${slCombo}x`;comboEl.className="sl-combo active";}else{comboEl.textContent="";comboEl.className="sl-combo";}}

function startSL(){slScore=0;slLevel=1;slCombo=0;slMaxCombo=0;slAlive=true;slShield=false;slLivesCount=slLives?3:0;showScreen("game");document.getElementById("ghost-hud").classList.toggle("hidden",!slGhost);const livesHud=document.getElementById("lives-hud");livesHud.classList.toggle("hidden",!slLives);if(slLives)updateLivesHud();letterEl.textContent="GO!";letterEl.className="letter-tile";comboEl.textContent="";comboEl.className="sl-combo";startSLTimer();setTimeout(()=>{slNext();startIdle();},600);}
function updateLivesHud(){const el=document.getElementById("lives-hud");if(!el)return;el.textContent="❤️".repeat(Math.max(0,slLivesCount))+"💔".repeat(Math.max(0,3-slLivesCount));}

document.addEventListener("keydown",e=>{
  if(e.key===" ")e.preventDefault();
  if(!document.getElementById("screen-start").classList.contains("hidden")&&!slAlive){if(e.key===" ")startSL();return;}
  if(!slAlive)return;
  if(document.getElementById("screen-game").classList.contains("hidden"))return;
  if(!["s","l"," "].includes(e.key))return;
  letterEl.classList.add("pressed");setTimeout(()=>letterEl.classList.remove("pressed"),110);
  if(e.key===SL_KEYS[slCurrent]){
    slCombo++;if(slCombo>slMaxCombo)slMaxCombo=slCombo;
    const bonus=slCombo>=20?4:slCombo>=10?2:slCombo>=5?1:0;slScore+=1+bonus;SFX.combo(slCombo);
    if(slCombo>=15)unlockAch("on_fire");if(slScore>=100)unlockAch("centurion");if(slCombo>=25)unlockAch("combinator");
    if(slCombo===10&&slSelectedTime!==99){slTime=Math.min(slTime+3,slMaxTime);updateHud();}
    if(slCombo===20&&!slShield)slShield=true;
    slFlash("correct");updateCombo();
    const newLevel=getLevelForScore(slScore);
    if(newLevel>slLevel){slLevel=newLevel;updateHud();SFX.levelup();const rect=letterEl.getBoundingClientRect();spawnParticles(rect.left+rect.width/2,rect.top+rect.height/2);letterEl.textContent=slLevel===SL_MAX_LEVEL?"MAX LVL!!!":`LVL ${slLevel}!`;letterEl.className="letter-tile";stopIdle();setTimeout(()=>{slNext();startIdle();},600);return;}
    updateHud();slNext();startIdle();
  } else {
    SFX.wrong();slFlash("wrong");shakeEl(letterEl);
    if(slShield){
      slShield=false;slCombo=0;updateCombo();unlockAch("shielded");
      slNext();startIdle();
    } else if(slLives&&slLivesCount>0){
      slCombo=0;updateCombo();slLivesCount--;updateLivesHud();
      if(slLivesCount<=0){setTimeout(()=>slEnd("wrong"),260);}else{slNext();startIdle();}
    } else {
      slCombo=0;updateCombo();setTimeout(()=>slEnd("wrong"),260);
    }
  }
});

function slEnd(reason){
  slAlive=false;stopSLTimer();stopIdle();clearTimeout(slGhostTO);
  slEndScore=slScore;slEndLevel=slLevel;
  const isNewBest=slScore>getHS();saveHS(slScore);
  updateSLStats(slScore,slLevel,slMaxCombo);
  if(slGhost&&slScore>=30)unlockAch("ghost_beast");
  if(isNewBest&&slScore>0){const rect=letterEl.getBoundingClientRect();spawnParticles(rect.left+rect.width/2,rect.top+rect.height/2,20);}
  openNameEntry(
    reason==="time"?"Time's Up!":"Game Over",
    reason==="time"?"time":"lose",
    `Score: <span>${slScore}</span> · Level <span>${slLevel}</span>`,
    isNewBest,
    async(name,flag)=>{
      if(name){
        const ok=await dbInsert("game_scores",{name,flag,game:"sl",score:slEndScore,meta:{level:slEndLevel}});
        if(ok){unlockAch("first_score");await openLeaderboard("sl",name,slEndScore);}
        else{alert("Submit failed — check your connection");goHome();}
      } else {
        openLeaderboard("sl",null,null);
      }
    }
  );
}

/* ═══════════════════════════════════════════════════
   REACTION TEST
═══════════════════════════════════════════════════ */
const RT_ROUNDS=5;
let rtRound=0,rtTimes=[],rtGoTime=null,rtWaiting=false,rtActive=false,rtDelay=null,rtFakeActive=false,rt1v1=false,rtPhase=1,rtP1Times=[];
const rtTileEl=document.getElementById("rt-tile"),rtTileT=document.getElementById("rt-tile-text"),rtTileL=document.getElementById("rt-tile-label"),rtRoundL=document.getElementById("rt-round-label"),rtLog=document.getElementById("rt-log"),rtSub=document.getElementById("rt-sub");

document.getElementById("btn-rt-quit")      .addEventListener("click",()=>{rtReset();goHome();});
document.getElementById("btn-rt-again")     .addEventListener("click",()=>startRT(false));
document.getElementById("btn-rt-submit")    .addEventListener("click",rtSubmit);
document.getElementById("btn-rt-1v1")       .addEventListener("click",()=>startRT(true));
document.getElementById("btn-rt-home")      .addEventListener("click",goHome);
document.getElementById("btn-rt-handoff-go").addEventListener("click",rtStartP2);
document.getElementById("btn-rt-1v1-again") .addEventListener("click",()=>startRT(true));
document.getElementById("btn-rt-1v1-home")  .addEventListener("click",goHome);

function rtReset(){clearTimeout(rtDelay);rtWaiting=rtActive=rtFakeActive=false;rtGoTime=null;}
function rtSetState(s,e,l){rtTileEl.className=`rt-tile ${s}`;rtTileT.textContent=e;rtTileL.textContent=l;}
function startRT(is1v1){rt1v1=is1v1;rtPhase=1;rtP1Times=[];rtRound=0;rtTimes=[];rtLog.innerHTML="";document.getElementById("rt-mode-badge").textContent=is1v1?"⚔️ 1v1":"";showScreen("rt");rtNextRound();}

function rtNextRound(){rtRound++;rtRoundL.textContent=`${rt1v1?`P${rtPhase} · `:""}Round ${rtRound} / ${RT_ROUNDS}`;rtSub.textContent="Green = GO  ·  Red = don't press!";rtSetState("waiting","⏳","Get ready…");rtWaiting=true;rtActive=rtFakeActive=false;rtGoTime=null;const td=1800+Math.random()*2700,hf=Math.random()<.3,fa=td*(.3+Math.random()*.3);if(hf){rtDelay=setTimeout(()=>{if(!rtWaiting)return;rtFakeActive=true;rtSetState("fake","🔴","Don't press!");SFX.rtFake();setTimeout(()=>{if(rtFakeActive){rtFakeActive=false;rtSetState("waiting","⏳","Stay sharp…");}},500);},fa);}setTimeout(()=>{clearTimeout(rtDelay);if(!rtWaiting)return;rtSetState("ready","👀","Almost…");rtDelay=setTimeout(()=>{rtWaiting=false;rtActive=true;rtGoTime=performance.now();rtSetState("go","GO!","Press SPACE!");SFX.rtGo();},350+Math.random()*300);},td);}

function rtHandleSpace(){if(document.getElementById("screen-rt").classList.contains("hidden"))return;if(rtFakeActive){rtFakeActive=false;rtWaiting=false;rtActive=false;clearTimeout(rtDelay);rtSetState("early","⚠️","Fake-out!");SFX.rtEarly();rtTimes.push("fake");rtAddLog(rtRound,"fake");if(rtRound>=RT_ROUNDS)setTimeout(rtDone,900);else setTimeout(rtNextRound,1200);return;}if(rtWaiting){clearTimeout(rtDelay);rtWaiting=false;rtSetState("early","⚠️","Too early!");SFX.rtEarly();rtTimes.push("early");rtAddLog(rtRound,"early");if(rtRound>=RT_ROUNDS)setTimeout(rtDone,900);else setTimeout(rtNextRound,1200);return;}if(rtActive){const ms=Math.round(performance.now()-rtGoTime);rtActive=false;rtTimes.push(ms);const sp=ms<230?"fast":ms<380?"medium":"slow";rtSetState("done","✓",`${ms} ms`);rtTileT.style.fontSize="30px";rtTileT.style.color=sp==="fast"?"#22c55e":sp==="medium"?"#f59e0b":"#f87171";rtAddLog(rtRound,ms,sp);if(ms<200)unlockAch("cyborg");if(rtRound>=RT_ROUNDS)setTimeout(rtDone,900);else setTimeout(()=>{rtTileT.style.fontSize=rtTileT.style.color="";rtNextRound();},950);}}
function rtAddLog(round,ms,speed){const row=document.createElement("div");row.className="rt-log-row";const cls=ms==="early"?"early":ms==="fake"?"fake":speed;const txt=ms==="early"?"⚠ Early":ms==="fake"?"🔴 Faked":`${ms} ms`;row.innerHTML=`<span class="rn">Round ${round}</span><span class="rm ${cls}">${txt}</span>`;rtLog.appendChild(row);}
function rtCalcAvg(times){const v=times.filter(t=>typeof t==="number");return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null;}
function rtDone(){if(rt1v1&&rtPhase===1){rtP1Times=[...rtTimes];document.getElementById("rt-handoff-num").textContent="2";const avg=rtCalcAvg(rtP1Times);document.getElementById("rt-handoff-preview").textContent=avg?`Player 1 avg: ${avg} ms`:"Player 1 done";showScreen("rt-handoff");}else if(rt1v1&&rtPhase===2){rtShow1v1();}else{rtShowResults(rtTimes);}}
function rtStartP2(){rtPhase=2;rtRound=0;rtTimes=[];rtLog.innerHTML="";document.getElementById("rt-mode-badge").textContent="⚔️ 1v1";showScreen("rt");rtNextRound();}

function rtSubmit(){
  const avg=rtCalcAvg(rtTimes),best=rtTimes.filter(t=>typeof t==="number").length?Math.min(...rtTimes.filter(t=>typeof t==="number")):null;
  if(!avg){alert("No valid times to submit!");return;}
  openNameEntry("Reaction Results","",`Avg: <span>${avg} ms</span> · Best: <span>${best} ms</span>`,false,
    async(name,flag)=>{
      if(name){
        const ok=await dbInsert("game_scores",{name,flag,game:"rt",score:avg,meta:{best,rounds:RT_ROUNDS}});
        if(ok){unlockAch("first_score");await openLeaderboard("rt",name,avg);}
        else{alert("Submit failed");showScreen("rt-end");}
      } else {openLeaderboard("rt",null,null);}
    }
  );
}

function rtShowResults(times){const valid=times.filter(t=>typeof t==="number"),maxT=valid.length?Math.max(...valid,400):400;const chart=document.getElementById("rt-chart");chart.innerHTML="";times.forEach((t,i)=>{const col=document.createElement("div");col.className="rt-bar-col";const bar=document.createElement("div");bar.className="rt-bar";const lbl=document.createElement("span");lbl.className="rt-bar-lbl";lbl.textContent=i+1;const isN=typeof t==="number";const sp=isN?(t<230?"fast":t<380?"medium":"slow"):t;bar.classList.add(sp);bar.style.height=isN?Math.round((t/maxT)*100)+"%":"35%";col.appendChild(bar);col.appendChild(lbl);chart.appendChild(col);});const sum=document.getElementById("rt-summary");sum.innerHTML="";times.forEach((t,i)=>{const r=document.createElement("div");r.className="rt-sum-row";const isN=typeof t==="number";const sp=isN?(t<230?"fast":t<380?"medium":""):"";r.innerHTML=`<span class="lbl">Round ${i+1}</span><span class="val ${isN?sp:""}">${t==="early"?"⚠ Early":t==="fake"?"🔴 Faked":`${t} ms`}</span>`;sum.appendChild(r);});const avg=rtCalcAvg(times),best=valid.length?Math.min(...valid):null;if(avg!=null){const r=document.createElement("div");r.className="rt-sum-row";r.innerHTML=`<span class="lbl" style="font-weight:700;color:#cbd5e1">Average</span><span class="val ${avg<230?"fast":avg<380?"medium":""}">${avg} ms</span>`;sum.appendChild(r);}if(best!=null){const r=document.createElement("div");r.className="rt-sum-row";r.innerHTML=`<span class="lbl" style="font-weight:700;color:#cbd5e1">Best</span><span class="val best">${best} ms</span>`;sum.appendChild(r);}const earl=times.filter(t=>t==="early"||t==="fake").length,rEl=document.getElementById("rt-rating");if(avg===null){rEl.textContent="😬 All bad!";rEl.style.color="#f97316";}else if(earl>0){rEl.textContent=`${earl} bad press${earl>1?"es":""} 😅`;rEl.style.color="#f59e0b";}else if(avg<200){rEl.textContent="🤖 Superhuman!";rEl.style.color="#22c55e";}else if(avg<250){rEl.textContent="⚡ Elite reflexes!";rEl.style.color="#4ade80";}else if(avg<300){rEl.textContent="🎯 Above average!";rEl.style.color="#86efac";}else if(avg<380){rEl.textContent="👍 Average range";rEl.style.color="#f59e0b";}else{rEl.textContent="🐢 Keep practicing!";rEl.style.color="#f87171";}
const earlyCount=times.filter(t=>t==="early"||t==="fake").length;
if(earlyCount===0&&avg!=null)unlockAch("sharpshooter");
if(avg!=null&&avg<200)unlockAch("speed_demon");
if(avg!=null){const bestMs=valid.length?Math.min(...valid):null;updateRTStats(avg,bestMs);}
const medalWrap=document.getElementById("rt-medal-wrap");
if(medalWrap){const m=rtGetMedal(avg);if(m){medalWrap.innerHTML=`<div class="rt-medal">${m.icon}</div><div class="rt-medal-label" style="color:${m.color}">${m.label} \u2014 ${m.desc}</div>`;}else{medalWrap.innerHTML="";}}
showScreen("rt-end");}

function rtShow1v1(){const p2=rtTimes,p1=rtP1Times,a1=rtCalcAvg(p1),a2=rtCalcAvg(p2);const grid=document.getElementById("rt-1v1-grid");grid.innerHTML="";[p1,p2].forEach((times,pi)=>{const col=document.createElement("div");col.className="rt-1v1-col";col.innerHTML=`<h3>Player ${pi+1}</h3>`;times.forEach((t,i)=>{const row=document.createElement("div");row.className="rt-1v1-row";row.innerHTML=`<span class="n">${i+1}</span><span class="v">${typeof t==="number"?t+" ms":t==="early"?"Early":"Faked"}</span>`;col.appendChild(row);});const avg=rtCalcAvg(times);const avgDiv=document.createElement("div");avgDiv.className="rt-1v1-avg";avgDiv.textContent=avg?`Avg: ${avg} ms`:"No valid";avgDiv.style.color=avg&&avg<300?"#22c55e":"#f59e0b";col.appendChild(avgDiv);grid.appendChild(col);});const win=document.getElementById("rt-1v1-winner");if(a1===null&&a2===null)win.textContent="🤝 Draw!";else if(a1===null){win.textContent="⚔️ Player 2 wins!";unlockAch("hot_seat");}else if(a2===null)win.textContent="⚔️ Player 1 wins!";else if(a1<a2)win.textContent=`⚔️ Player 1 wins by ${a2-a1}ms!`;else if(a2<a1){win.textContent=`⚔️ Player 2 wins by ${a1-a2}ms!`;unlockAch("hot_seat");}else win.textContent="🤝 Perfect tie!";showScreen("rt-1v1");}

document.addEventListener("keydown",e=>{if(e.key!==" ")return;if(!document.getElementById("screen-rt").classList.contains("hidden"))rtHandleSpace();if(!document.getElementById("screen-rt-end").classList.contains("hidden"))startRT(false);if(!document.getElementById("screen-rt-1v1").classList.contains("hidden"))startRT(true);});

/* ═══════════════════════════════════════════════════
   SUDOKU
═══════════════════════════════════════════════════ */
const SDK_CLUES={Easy:38,Medium:30,Hard:24};
let sdkBoard=[],sdkPuzzle=[],sdkPlayer=[],sdkNotesCells=[];
let sdkMistakes=0,sdkSelected=null,sdkSecs=0,sdkTimerInt=null,sdkNotesMode=false,sdkIsDaily=false,sdkDifficulty="Medium",sdkHintsUsed=0;
const sdkBoardEl=document.getElementById("sdk-board"),sdkDiffEl=document.getElementById("sdk-diff"),sdkTimerEl=document.getElementById("sdk-timer"),sdkMistEl=document.getElementById("sdk-mistakes");

document.querySelectorAll(".sdk-diff-card") .forEach(btn=>btn.addEventListener("click",()=>{SFX.click();startSudoku(btn.dataset.diff,false);}));
document.getElementById("btn-sdk-diff-back").addEventListener("click",goHome);
document.getElementById("btn-sdk-quit")     .addEventListener("click",()=>{sdkStopTimer();goHome();});
document.getElementById("btn-sdk-again")    .addEventListener("click",()=>showScreen("sdk-diff"));
document.getElementById("btn-sdk-submit")   .addEventListener("click",sdkSubmitScore);
document.getElementById("btn-sdk-win-home") .addEventListener("click",goHome);
document.getElementById("btn-sdk-retry")    .addEventListener("click",()=>showScreen("sdk-diff"));
document.getElementById("btn-sdk-end-home") .addEventListener("click",goHome);
document.getElementById("btn-sdk-notes")    .addEventListener("click",()=>{sdkSetNotesMode(!sdkNotesMode);SFX.click();});
document.getElementById("btn-sdk-autonotes").addEventListener("click",sdkAutoNotes);
document.getElementById("btn-sdk-erase")    .addEventListener("click",()=>{SFX.click();sdkInput(0);});
document.getElementById("btn-sdk-hint")     .addEventListener("click",sdkUseHint);
document.getElementById("sdk-numpad").addEventListener("click",e=>{const b=e.target.closest(".sdk-num");if(b)sdkInput(Number(b.dataset.n));});

document.addEventListener("keydown",e=>{if(document.getElementById("screen-sudoku").classList.contains("hidden"))return;if(e.key==="n"||e.key==="N"){sdkSetNotesMode(!sdkNotesMode);return;}if(e.key>="1"&&e.key<="9"){sdkInput(Number(e.key));return;}if(e.key==="Backspace"||e.key==="Delete"||e.key==="0"){sdkInput(0);return;}if(!sdkSelected)return;let{r,c}=sdkSelected;if(e.key==="ArrowUp"){e.preventDefault();r=(r+8)%9;}if(e.key==="ArrowDown"){e.preventDefault();r=(r+1)%9;}if(e.key==="ArrowLeft"){e.preventDefault();c=(c+8)%9;}if(e.key==="ArrowRight"){e.preventDefault();c=(c+1)%9;}sdkSelect(r,c);});

function sdkShuffle(arr,rng){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor((rng||Math.random)()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sdkIsValid(board,r,c,n){for(let i=0;i<9;i++)if(board[r][i]===n||board[i][c]===n)return false;const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(board[br+i][bc+j]===n)return false;return true;}
function sdkSolve(board,rng){for(let r=0;r<9;r++)for(let c=0;c<9;c++){if(board[r][c]===0){for(const n of sdkShuffle([1,2,3,4,5,6,7,8,9],rng)){if(sdkIsValid(board,r,c,n)){board[r][c]=n;if(sdkSolve(board,rng))return true;board[r][c]=0;}}return false;}}return true;}
function sdkGenerate(rng){const b=Array.from({length:9},()=>Array(9).fill(0));sdkSolve(b,rng);return b;}
function sdkUnique(board){let count=0;function go(b){for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(b[r][c]===0){for(let n=1;n<=9;n++)if(sdkIsValid(b,r,c,n)){b[r][c]=n;go(b);if(count>1)return;b[r][c]=0;}return;}count++;}go(board.map(r=>[...r]));return count===1;}
function sdkMakePuzzle(sol,clues,rng){const p=sol.map(r=>[...r]);const cells=sdkShuffle(Array.from({length:81},(_,i)=>i),rng);let filled=81;for(const idx of cells){if(filled<=clues)break;const r=Math.floor(idx/9),c=idx%9,bk=p[r][c];p[r][c]=0;filled--;if(!sdkUnique(p)){p[r][c]=bk;filled++;}}return p;}
function sdkStartTimer(){sdkSecs=0;sdkTimerEl.textContent="0:00";clearInterval(sdkTimerInt);sdkTimerInt=setInterval(()=>{sdkSecs++;const m=Math.floor(sdkSecs/60),s=sdkSecs%60;sdkTimerEl.textContent=`${m}:${String(s).padStart(2,"0")}`;},1000);}
function sdkStopTimer(){clearInterval(sdkTimerInt);}

function startSudoku(diff,isDaily,rng){sdkIsDaily=!!isDaily;sdkDifficulty=diff||"Medium";sdkDiffEl.textContent=isDaily?"Daily":diff;sdkBoard=sdkGenerate(rng);sdkPuzzle=sdkMakePuzzle(sdkBoard,SDK_CLUES[diff]||30,rng);sdkPlayer=sdkPuzzle.map(r=>[...r]);sdkMistakes=0;sdkSelected=null;sdkHintsUsed=0;sdkMistEl.textContent="✕ 0 / 3";sdkNotesCells=Array.from({length:9},()=>Array.from({length:9},()=>new Set()));sdkSetNotesMode(false);showScreen("sudoku");sdkRenderBoard();sdkUpdateNumpad();updateHintBtn();sdkStartTimer();}
function startDailyChallenge(){startSudoku("Medium",true,mkRng(dateSeed()));}
function sdkSetNotesMode(on){sdkNotesMode=on;document.body.classList.toggle("notes-mode",on);document.getElementById("btn-sdk-notes").classList.toggle("active",on);}
function sdkAutoNotes(){SFX.click();for(let r=0;r<9;r++)for(let c=0;c<9;c++){if(sdkPlayer[r][c]!==0||sdkPuzzle[r][c]!==0)continue;sdkNotesCells[r][c].clear();for(let n=1;n<=9;n++)if(sdkIsValid(sdkPlayer,r,c,n))sdkNotesCells[r][c].add(n);}sdkRenderBoard();if(sdkSelected)sdkHighlight(sdkSelected.r,sdkSelected.c);}
function sdkConflicts(){const cx=new Set();for(let r=0;r<9;r++)for(let c=0;c<9;c++){const v=sdkPlayer[r][c];if(!v)continue;for(let i=0;i<9;i++){if(i!==c&&sdkPlayer[r][i]===v){cx.add(`${r},${c}`);cx.add(`${r},${i}`);}if(i!==r&&sdkPlayer[i][c]===v){cx.add(`${r},${c}`);cx.add(`${i},${c}`);}}const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;for(let i=0;i<3;i++)for(let j=0;j<3;j++){const rr=br+i,cc=bc+j;if((rr!==r||cc!==c)&&sdkPlayer[rr][cc]===v){cx.add(`${r},${c}`);cx.add(`${rr},${cc}`);}}}return cx;}
function sdkRenderBoard(){sdkBoardEl.innerHTML="";for(let r=0;r<9;r++)for(let c=0;c<9;c++){const cell=document.createElement("div");cell.className="sdk-cell";cell.dataset.r=r;cell.dataset.c=c;cell.dataset.row=r;cell.dataset.col=c;const given=sdkPuzzle[r][c]!==0;if(given){cell.classList.add("given");cell.textContent=sdkPuzzle[r][c];}else if(sdkPlayer[r][c]){cell.classList.add("filled");cell.textContent=sdkPlayer[r][c];}else{cell.classList.add("empty");cell.appendChild(sdkMakeNotes(r,c));}cell.addEventListener("click",()=>sdkSelect(r,c));sdkBoardEl.appendChild(cell);}sdkApplyConflicts();if(sdkSelected)sdkHighlight(sdkSelected.r,sdkSelected.c);}
function sdkMakeNotes(r,c){const g=document.createElement("div");g.className="sdk-notes";for(let n=1;n<=9;n++){const s=document.createElement("span");s.className="sdk-note-n";s.dataset.n=n;s.textContent=n;if(sdkNotesCells[r][c].has(n))s.classList.add("on");g.appendChild(s);}return g;}
function sdkSelect(r,c){sdkSelected={r,c};sdkHighlight(r,c);sdkUpdateNumpad();}
function sdkHighlight(r,c){const cells=sdkBoardEl.querySelectorAll(".sdk-cell"),br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3,sv=sdkPlayer[r][c];cells.forEach(cell=>{const cr=Number(cell.dataset.r),cc=Number(cell.dataset.c);cell.classList.remove("selected","related","same-num");if(cr===r&&cc===c)cell.classList.add("selected");else if(cr===r||cc===c||Math.floor(cr/3)*3===br&&Math.floor(cc/3)*3===bc)cell.classList.add("related");if(sv&&sv===sdkPlayer[cr][cc])cell.classList.add("same-num");});}
function sdkApplyConflicts(){const cx=sdkConflicts();sdkBoardEl.querySelectorAll(".sdk-cell").forEach(cell=>cell.classList.toggle("conflict",cx.has(`${cell.dataset.r},${cell.dataset.c}`)));}
function sdkInput(n){if(!sdkSelected)return;const{r,c}=sdkSelected;if(sdkPuzzle[r][c]!==0)return;if(n===0){sdkPlayer[r][c]=0;sdkNotesCells[r][c].clear();sdkRefreshCell(r,c);sdkApplyConflicts();sdkHighlight(r,c);sdkUpdateNumpad();SFX.click();return;}if(sdkNotesMode){if(sdkPlayer[r][c]!==0)return;const ns=sdkNotesCells[r][c];ns.has(n)?ns.delete(n):ns.add(n);SFX.noteOn();sdkRefreshCell(r,c);return;}if(sdkPlayer[r][c]===n)return;if(n===sdkBoard[r][c]){sdkPlayer[r][c]=n;sdkNotesCells[r][c].clear();sdkClearPeerNotes(r,c,n);sdkRefreshCell(r,c);sdkApplyConflicts();sdkHighlight(r,c);sdkUpdateNumpad();SFX.correct();if(sdkCheckWin())sdkWin();}else{sdkMistakes++;sdkMistEl.textContent=`✕ ${sdkMistakes} / 3`;SFX.wrong();const el=sdkBoardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);el.innerHTML="";el.textContent=n;el.classList.remove("empty","filled");el.classList.add("filled","error","error-flash");setTimeout(()=>{sdkRefreshCell(r,c);sdkHighlight(r,c);},620);if(sdkMistakes>=3)setTimeout(()=>{sdkStopTimer();showScreen("sudoku-end");},730);}}
function sdkClearPeerNotes(r,c,n){const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;for(let i=0;i<9;i++){sdkNotesCells[r][i].delete(n);sdkNotesCells[i][c].delete(n);}for(let i=0;i<3;i++)for(let j=0;j<3;j++)sdkNotesCells[br+i][bc+j].delete(n);for(let i=0;i<9;i++){if(!sdkPlayer[r][i])sdkRefreshCell(r,i);if(!sdkPlayer[i][c])sdkRefreshCell(i,c);}for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(!sdkPlayer[br+i][bc+j])sdkRefreshCell(br+i,bc+j);}
function sdkRefreshCell(r,c){const el=sdkBoardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);if(!el)return;el.classList.remove("empty","filled","error","error-flash");el.innerHTML="";const v=sdkPlayer[r][c];if(v){el.textContent=v;el.classList.add("filled");}else{el.classList.add("empty");el.appendChild(sdkMakeNotes(r,c));}}
function sdkCheckWin(){for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(sdkPlayer[r][c]!==sdkBoard[r][c])return false;return true;}

function sdkWin(){
  sdkStopTimer();SFX.sdkWin();
  if(sdkMistakes===0)unlockAch("flawless");
  if(sdkDifficulty==="Hard"&&sdkHintsUsed===0&&sdkMistakes===0)unlockAch("hint_free");
  updateSDKStats(sdkSecs,sdkMistakes);
  if(sdkIsDaily){markDailyDone();saveDailyStreak();}
  document.getElementById("sdk-win-time").textContent=sdkTimerEl.textContent;
  document.getElementById("sdk-win-mistakes").textContent=sdkMistakes;
  document.getElementById("sdk-win-title").textContent=sdkIsDaily?"Daily Solved! 🗓️":"Solved!";
  const shareDiv=document.getElementById("sdk-daily-share");
  if(sdkIsDaily){shareDiv.classList.remove("hidden");shareDiv.style.display="flex";shareDiv.innerHTML=`<button class="btn-ghost-btn" id="btn-share">📋 Share</button>`;document.getElementById("btn-share").addEventListener("click",()=>{const txt=`I solved today's Daily Sudoku in ${sdkTimerEl.textContent} with ${sdkMistakes} mistake${sdkMistakes!==1?"s":""}! 🔢`;navigator.clipboard?.writeText(txt).then(()=>{document.getElementById("btn-share").textContent="✓ Copied!";});});}
  else{shareDiv.classList.add("hidden");shareDiv.style.display="none";}
  showScreen("sudoku-win");
}

function sdkSubmitScore(){
  const m=Math.floor(sdkSecs/60),s=sdkSecs%60;
  const timeStr=`${m}:${String(s).padStart(2,"0")}`;
  openNameEntry(
    "Sudoku Solved!","",
    `Time: <span>${timeStr}</span> · Mistakes: <span>${sdkMistakes}</span>`,
    false,
    async(name,flag)=>{
      if(name){
        const ok=await dbInsert("game_scores",{name,flag,game:"sudoku",score:sdkSecs,meta:{mistakes:sdkMistakes,difficulty:sdkDifficulty}});
        if(ok){unlockAch("first_score");await openLeaderboard("sudoku",name,sdkSecs);}
        else{alert("Submit failed");showScreen("sudoku-win");}
      } else {openLeaderboard("sudoku",null,null);}
    }
  );
}

function sdkUpdateNumpad(){const cnt=Array(10).fill(0);for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(sdkPlayer[r][c])cnt[sdkPlayer[r][c]]++;document.querySelectorAll(".sdk-num").forEach(btn=>{const n=Number(btn.dataset.n);btn.classList.toggle("dim",cnt[n]>=9);});}

/* ═══════════════════════════════════════════════════
   HINT SYSTEM
═══════════════════════════════════════════════════ */
function sdkUseHint(){if(3-sdkHintsUsed<=0)return;const empties=[];for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(sdkPlayer[r][c]===0&&sdkPuzzle[r][c]===0)empties.push({r,c});if(!empties.length)return;const {r,c}=empties[Math.floor(Math.random()*empties.length)];sdkPlayer[r][c]=sdkBoard[r][c];sdkNotesCells[r][c].clear();sdkClearPeerNotes(r,c,sdkBoard[r][c]);sdkRefreshCell(r,c);sdkApplyConflicts();sdkHighlight(r,c);sdkUpdateNumpad();sdkHintsUsed++;updateHintBtn();SFX.correct();if(sdkCheckWin())sdkWin();}
function updateHintBtn(){const btn=document.getElementById("btn-sdk-hint");if(!btn)return;const left=3-sdkHintsUsed;btn.querySelector("span").textContent=`Hint (${left})`;btn.disabled=left<=0;btn.style.opacity=left<=0?"0.4":"1";}

/* ═══════════════════════════════════════════════════
   RT MEDAL
═══════════════════════════════════════════════════ */
function rtGetMedal(avg){if(avg===null)return null;if(avg<200)return{icon:"🥇",label:"Gold",color:"#fbbf24",desc:"under 200ms avg"};if(avg<250)return{icon:"🥈",label:"Silver",color:"#94a3b8",desc:"under 250ms avg"};if(avg<320)return{icon:"🥉",label:"Bronze",color:"#cd7f32",desc:"under 320ms avg"};return null;}

/* ═══════════════════════════════════════════════════
   STATS SCREEN NAV
═══════════════════════════════════════════════════ */
document.getElementById("btn-stats-close").addEventListener("click",goHome);
document.getElementById("btn-stats-home") .addEventListener("click",goHome);

/* ═══════════════════════════════════════════════════
   SHARE BUTTONS
═══════════════════════════════════════════════════ */
document.getElementById("btn-share-score").addEventListener("click",()=>{const txt=`🧠 SL Challenge: ${slEndScore} pts · Level ${slEndLevel} 🎮 SL Games`;navigator.clipboard?.writeText(txt).then(()=>{const b=document.getElementById("btn-share-score");b.textContent="✓ Copied!";setTimeout(()=>b.textContent="📋 Share",2000);}).catch(()=>{});});
document.getElementById("btn-share-win")  .addEventListener("click",()=>{const score=document.getElementById("win-score-val").textContent;const txt=`🏆 SL Challenge: ${score} pts · Level 10 — Legendary! 🎮 SL Games`;navigator.clipboard?.writeText(txt).then(()=>{const b=document.getElementById("btn-share-win");b.textContent="✓ Copied!";setTimeout(()=>b.textContent="📋 Share Score",2000);}).catch(()=>{});});

/* ═══════════════════════════════════════════════════
   R KEY QUICK-RESTART
═══════════════════════════════════════════════════ */
document.addEventListener("keydown",e=>{
  if((e.key==="r"||e.key==="R")&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    if(!document.getElementById("screen-name").classList.contains("hidden")){startSL();return;}
    if(!document.getElementById("screen-win").classList.contains("hidden")){startSL();return;}
  }
});

/* ═══════════════════════════════════════════════════
   THEMES  (dark → light → neon)
═══════════════════════════════════════════════════ */
const THEMES       = ["dark","light","neon"];
const THEME_LABELS = {dark:"🌙 Dark", light:"☀️ Light", neon:"⚡ Neon"};

function getTheme()    {try{return localStorage.getItem("theme")||"dark";}catch{return "dark";}}
function saveTheme(t)  {try{localStorage.setItem("theme",t);}catch{}}

function applyTheme(t) {
  document.body.classList.remove("theme-light","theme-neon");
  if(t==="light") document.body.classList.add("theme-light");
  if(t==="neon")  document.body.classList.add("theme-neon");
  const b=document.getElementById("btn-theme");
  if(b) b.textContent = THEME_LABELS[t]||"🌙 Dark";
  saveTheme(t);
}

function cycleTheme() {
  const cur=getTheme(), idx=THEMES.indexOf(cur);
  applyTheme(THEMES[(idx+1)%THEMES.length]);
  SFX.click();
}

document.getElementById("btn-theme").addEventListener("click", cycleTheme);

/* ═══════════════════════════════════════════════════
   BACKGROUND MUSIC  (Web Audio API, no external files)
   Calm ambient pad + slow pentatonic arpeggio
═══════════════════════════════════════════════════ */
let _musicOn   = false;
let _musicMaster = null;
let _musicNodes  = [];
let _musicArpTO  = null;
let _musicArpIdx = 0;

// C4 pentatonic major: C D E G A C5
const MUSIC_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
// Gentle up-down path through the scale
const MUSIC_PATTERN = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 1, 4];

function getMusicPref()  {try{return localStorage.getItem("music_on")==="1";}catch{return false;}}
function saveMusicPref(v){try{localStorage.setItem("music_on",v?"1":"0");}catch{}}

function startMusic() {
  if(_musicOn) return;
  _musicOn = true;
  const ctx = ac();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.13, ctx.currentTime + 2.5);
  master.connect(ctx.destination);
  _musicMaster = master;

  // Low-pass filter warms the pad
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  filter.Q.value = 0.8;
  filter.connect(master);
  _musicNodes.push(filter);

  // Pad: 3 detuned sines on C2 / G2 / C3
  [130.81, 196.00, 261.63].forEach((freq, i) => {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = (i - 1) * 7;
    g.gain.value = 0.16;
    osc.connect(g); g.connect(filter);
    osc.start();
    _musicNodes.push(osc, g);
  });

  // LFO — breathes the filter frequency slowly
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
  lfo.frequency.value = 0.1;
  lfoG.gain.value = 120;
  lfo.connect(lfoG); lfoG.connect(filter.frequency);
  lfo.start();
  _musicNodes.push(lfo, lfoG);

  _musicArpIdx = 0;
  _scheduleArp();
  saveMusicPref(true);
  updateMusicBtn();
}

function _scheduleArp() {
  if(!_musicOn) return;
  const ctx  = ac();
  const freq = MUSIC_SCALE[MUSIC_PATTERN[_musicArpIdx % MUSIC_PATTERN.length]];
  const osc  = ctx.createOscillator();
  const env  = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.07);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
  osc.connect(env);
  if(_musicMaster) env.connect(_musicMaster);
  osc.start(); osc.stop(ctx.currentTime + 2.3);
  _musicArpIdx++;
  const gap = 1500 + Math.random() * 600;
  _musicArpTO = setTimeout(_scheduleArp, gap);
}

function stopMusic() {
  if(!_musicOn) return;
  _musicOn = false;
  clearTimeout(_musicArpTO);
  if(_musicMaster) {
    try{const ctx=ac(); _musicMaster.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4);}catch(_){}
    setTimeout(() => {
      _musicNodes.forEach(n => { try{n.stop?.(); n.disconnect?.();}catch(_){} });
      _musicNodes = [];
      _musicMaster = null;
    }, 1500);
  }
  saveMusicPref(false);
  updateMusicBtn();
}

function toggleMusic() { _musicOn ? stopMusic() : startMusic(); }

function updateMusicBtn() {
  const b = document.getElementById("btn-music"); if(!b) return;
  b.textContent = _musicOn ? "🎵 Music ON" : "🎵 Music OFF";
  b.classList.toggle("on", _musicOn);
}

document.getElementById("btn-music").addEventListener("click", () => { toggleMusic(); SFX.click(); });

/* ─── init ──────────────────────────────────── */
applyTheme(getTheme());
updateMusicBtn();
if(getMusicPref()) startMusic();

