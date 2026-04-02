/* ═══════════════════════════════════════════════════
   ⚙️  SUPABASE CONFIG — paste your values here
═══════════════════════════════════════════════════ */
const SUPABASE_URL = "https://jqlvryoppbhmdzjdxnjq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbHZyeW9wcGJobWR6amR4bmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwODc5ODIsImV4cCI6MjA5MDY2Mzk4Mn0.yfKVfiJIW0bQBZ8jb-93AqgXUXQstAfAR5Z4YaVQtnY";

/* ═══════════════════════════════════════════════════
   SUPABASE REST HELPERS
═══════════════════════════════════════════════════ */
async function dbInsert(table, row) {
  if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) return { ok:false, reason:"not_configured" };
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}`, "Prefer":"return=minimal" },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const body = await r.text().catch(()=>"");
      return { ok:false, reason:`http_${r.status}`, body };
    }
    return { ok:true };
  } catch(e) {
    return { ok:false, reason:"network", message:e.message };
  }
}
async function dbSelect(table, params) {
  if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) return [];
  try {
    const qs = new URLSearchParams(params).toString();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
      headers: { "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}` },
    });
    return r.ok ? r.json() : [];
  } catch { return []; }
}

/* ═══════════════════════════════════════════════════
   SCREENS
═══════════════════════════════════════════════════ */
const SCREEN_IDS = [
  "home","start","game","name","leaderboard","win",
  "rt","rt-end","rt-handoff","rt-1v1",
  "sdk-diff","sudoku","sudoku-win","sudoku-end"
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
function ac() { if (!_actx) _actx = new (window.AudioContext||window.webkitAudioContext)(); if(_actx.state==="suspended")_actx.resume(); return _actx; }
function beep(freq,type,dur,vol=0.26,delay=0) {
  try { const ctx=ac(),osc=ctx.createOscillator(),g=ctx.createGain(); osc.connect(g);g.connect(ctx.destination); osc.type=type;osc.frequency.value=freq; const t=ctx.currentTime+delay; g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur); osc.start(t);osc.stop(t+dur); } catch(_){}
}
const SFX = {
  correct()  { beep(880,"sine",.07,.2); },
  wrong()    { beep(140,"sawtooth",.16,.3); },
  levelup()  { [523,659,784,1047].forEach((f,i)=>beep(f,"sine",.14,.26,i*.09)); },
  win()      { [523,659,784,1047,1319,1568].forEach((f,i)=>beep(f,"sine",.18,.3,i*.09)); },
  combo(n)   { beep(440+Math.min(n,15)*36,"sine",.06,.18); },
  click()    { beep(900,"sine",.03,.1); },
  rtGo()     { beep(1047,"sine",.09,.26); },
  rtEarly()  { beep(200,"square",.14,.22); },
  rtFake()   { beep(180,"square",.12,.18); },
  noteOn()   { beep(660,"sine",.04,.09); },
  sdkWin()   { [523,659,784,880,1047].forEach((f,i)=>beep(f,"sine",.16,.26,i*.09)); },
  achieve()  { [880,1047,1319].forEach((f,i)=>beep(f,"sine",.11,.22,i*.1)); },
  submit()   { [660,880,1047].forEach((f,i)=>beep(f,"sine",.12,.24,i*.08)); },
};

/* ═══════════════════════════════════════════════════
   ACHIEVEMENTS
═══════════════════════════════════════════════════ */
const ACH = {
  first_score: { icon:"🏆", label:"First Score",   desc:"Submit to leaderboard"    },
  on_fire:     { icon:"🔥", label:"On Fire",        desc:"15x combo in SL"          },
  ghost_beast: { icon:"👻", label:"Ghost Beast",    desc:"Score 30+ in Ghost mode"  },
  flawless:    { icon:"✨", label:"Flawless",       desc:"Sudoku with 0 mistakes"   },
  cyborg:      { icon:"🤖", label:"Cyborg",         desc:"Reaction under 200ms"     },
  daily_done:  { icon:"📅", label:"Daily",          desc:"Complete daily sudoku"    },
  hot_seat:    { icon:"⚔️", label:"1v1 Champ",     desc:"Win a 1v1 match"          },
  centurion:   { icon:"💯", label:"Centurion",      desc:"Score 100+ in SL"         },
  world_top10: { icon:"🌍", label:"World Top 10",   desc:"Appear in top 10"         },
};
function getAch()  { try{return JSON.parse(localStorage.getItem("ach")||"{}");}catch{return{};} }
function unlockAch(id) {
  const a=getAch(); if(a[id]) return;
  a[id]=Date.now(); try{localStorage.setItem("ach",JSON.stringify(a));}catch{}
  SFX.achieve();
  const t=document.getElementById("ach-toast");
  t.innerHTML=`${ACH[id].icon} <strong>${ACH[id].label}</strong> unlocked!`;
  t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2600);
  renderAchBar();
}
function renderAchBar() {
  const bar=document.getElementById("ach-bar"), a=getAch();
  bar.innerHTML=Object.entries(ACH).map(([id,d])=>`<span class="ach-badge${a[id]?" unlocked":""}" title="${d.label}: ${d.desc}">${d.icon}</span>`).join("");
}

/* ═══════════════════════════════════════════════════
   LOCAL STORAGE HELPERS
═══════════════════════════════════════════════════ */
function getHS()  { try{return parseInt(localStorage.getItem("sl_hs")||"0");}catch{return 0;} }
function saveHS(s){ try{if(s>getHS())localStorage.setItem("sl_hs",s);}catch{} }
function getSavedName() { try{return localStorage.getItem("sl_name")||"";}catch{return "";} }
function saveName(n)    { try{localStorage.setItem("sl_name",n);}catch{} }

/* ═══════════════════════════════════════════════════
   DAILY SEED
═══════════════════════════════════════════════════ */
function mkRng(seed) {
  let s=seed>>>0;
  return ()=>{ s=Math.imul(s^s>>>15,s|1);s^=s+Math.imul(s^s>>>7,s|61);return((s^s>>>14)>>>0)/0xffffffff; };
}
function dateSeed() { const d=new Date(); return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); }
function isDailyDone() { try{return localStorage.getItem("daily_date")===new Date().toISOString().slice(0,10);}catch{return false;} }
function markDailyDone() { try{localStorage.setItem("daily_date",new Date().toISOString().slice(0,10));}catch{} unlockAch("daily_done"); }

/* ═══════════════════════════════════════════════════
   SWIPE DECK
═══════════════════════════════════════════════════ */
const MODES = [
  { id:"sl",     emoji:"🧠", name:"SL Challenge",    desc:"Endless scoring — get on the world leaderboard", tags:["10 Levels","Endless","🌍 Global"],  bg:"linear-gradient(145deg,#0f2044,#1a1060)", glow:"rgba(96,165,250,.35)",  accent:"#60a5fa" },
  { id:"rt",     emoji:"⚡", name:"Reaction Test",   desc:"Hit SPACE the instant you see green",            tags:["5 Rounds","1v1 mode","Reflexes"],   bg:"linear-gradient(145deg,#0a2e1a,#061f0f)", glow:"rgba(34,197,94,.35)",   accent:"#4ade80" },
  { id:"sudoku", emoji:"🔢", name:"Sudoku",          desc:"Fill the grid — no repeats in row, col or box",  tags:["3 Diffs","Notes","Logic"],           bg:"linear-gradient(145deg,#2a1a0e,#1a0f05)", glow:"rgba(251,191,36,.3)",   accent:"#fbbf24" },
  { id:"daily",  emoji:"📅", name:"Daily Challenge", desc:"Today's seeded puzzle — same for everyone",      tags:["Sudoku","Seeded","Daily"],           bg:"linear-gradient(145deg,#1a0a2e,#0f0520)", glow:"rgba(168,139,250,.3)",  accent:"#a78bfa" },
  { id:"lb",     emoji:"🌍", name:"Leaderboard",     desc:"See who's top of the world rankings right now",  tags:["All Time","Today","Live"],           bg:"linear-gradient(145deg,#0d2020,#061410)", glow:"rgba(20,184,166,.3)",   accent:"#2dd4bf" },
];

let deckIdx=0, dragging=false, dragX=0, dragStart=0, ptId=null;
const topCard=document.getElementById("swipe-top"), backCard=document.getElementById("swipe-back");
function getStampP(){return document.getElementById("stamp-play");}
function getStampS(){return document.getElementById("stamp-skip");}
const THRESH=72, MAX_ROT=18, FLY=520;

function renderCard(el, m) {
  el.innerHTML="";
  if(el===topCard){
    const sp=document.createElement("div");sp.className="stamp stamp-play";sp.id="stamp-play";sp.textContent="PLAY";el.appendChild(sp);
    const ss=document.createElement("div");ss.className="stamp stamp-skip";ss.id="stamp-skip";ss.textContent="SKIP";el.appendChild(ss);
  }
  el.style.background=m.bg;
  el.style.boxShadow=`inset 0 0 0 2px rgba(255,255,255,.08),0 20px 52px ${m.glow},0 8px 20px rgba(0,0,0,.5)`;
  const f=document.createDocumentFragment();
  ["card-emoji","card-name","card-desc"].forEach((cls,i)=>{ const d=document.createElement("div");d.className=cls;d.textContent=[m.emoji,m.name,m.desc][i];f.appendChild(d); });
  const tags=document.createElement("div");tags.className="card-tags";
  m.tags.forEach(t=>{ const s=document.createElement("span");s.className="card-tag";s.textContent=t;s.style.borderColor=m.accent+"55";s.style.color=m.accent;tags.appendChild(s); });
  f.appendChild(tags); el.appendChild(f);
}
function renderDeck() {
  renderCard(backCard, MODES[(deckIdx+1)%MODES.length]);
  renderCard(topCard,  MODES[deckIdx%MODES.length]);
  topCard.style.opacity=""; topCard.style.transform=""; topCard.style.transition="";
  topCard.style.background=MODES[deckIdx%MODES.length].bg;
  backCard.style.transform="scale(.92) translateY(10px)"; backCard.style.transition="";
  getStampP().style.opacity=getStampS().style.opacity="0";
}
function setDrag(dx) {
  const r=Math.min(Math.abs(dx)/150,1);
  topCard.style.transform=`translateX(${dx}px) rotate(${dx/150*MAX_ROT}deg)`;
  getStampP().style.opacity=dx>0?String(Math.min(r*1.4,1)):"0";
  getStampS().style.opacity=dx<0?String(Math.min(r*1.4,1)):"0";
  backCard.style.transform=`scale(${.92+r*.08}) translateY(${10-r*10}px)`;
}
function flyOff(dir) {
  topCard.style.transition="transform .38s cubic-bezier(.25,.8,.5,1),opacity .38s";
  topCard.style.transform=`translateX(${dir==="right"?FLY:-FLY}px) rotate(${dir==="right"?MAX_ROT:-MAX_ROT}deg)`;
  topCard.style.opacity="0";
  backCard.style.transition="transform .38s"; backCard.style.transform="scale(1) translateY(0)";
  setTimeout(()=>{ const m=MODES[deckIdx%MODES.length]; deckIdx++; dir==="right"?launch(m.id):renderDeck(); },380);
}
function snapBack() {
  topCard.style.transition="transform .35s cubic-bezier(.34,1.56,.64,1)"; topCard.style.transform="";
  backCard.style.transition="transform .35s"; backCard.style.transform="scale(.92) translateY(10px)";
  getStampP().style.opacity=getStampS().style.opacity="0";
}
function launch(id) {
  if      (id==="sl")     { refreshSLScreen(); showScreen("start"); }
  else if (id==="rt")     startRT(false);
  else if (id==="sudoku") showScreen("sdk-diff");
  else if (id==="daily")  startDailyChallenge();
  else if (id==="lb")     openLeaderboard(null, null);
}
topCard.addEventListener("pointerdown",e=>{ dragging=true;dragStart=e.clientX;dragX=0;ptId=e.pointerId;topCard.setPointerCapture(e.pointerId);topCard.style.transition=""; });
topCard.addEventListener("pointermove",e=>{ if(!dragging||e.pointerId!==ptId)return;dragX=e.clientX-dragStart;setDrag(dragX); });
topCard.addEventListener("pointerup",  e=>{ if(!dragging||e.pointerId!==ptId)return;dragging=false;dragX>THRESH?flyOff("right"):dragX<-THRESH?flyOff("left"):snapBack(); });
topCard.addEventListener("pointercancel",()=>{ dragging=false;snapBack(); });
document.getElementById("btn-like").addEventListener("click",()=>{ setDrag(THRESH+10);setTimeout(()=>flyOff("right"),50); });
document.getElementById("btn-nope").addEventListener("click",()=>{ setDrag(-(THRESH+10));setTimeout(()=>flyOff("left"),50); });
document.addEventListener("keydown",e=>{
  if(!document.getElementById("screen-home").classList.contains("hidden")){
    if(e.key==="ArrowRight"){setDrag(THRESH+10);setTimeout(()=>flyOff("right"),50);}
    if(e.key==="ArrowLeft") {setDrag(-(THRESH+10));setTimeout(()=>flyOff("left"),50);}
  }
});

function goHome() {
  slAlive=false; stopSLTimer(); stopIdle(); sdkStopTimer(); sdkSetNotesMode(false);
  deckIdx=0; renderDeck(); renderAchBar(); showScreen("home");
}
renderDeck(); renderAchBar();

/* ═══════════════════════════════════════════════════
   SL CHALLENGE — ENDLESS, 10 LEVELS
═══════════════════════════════════════════════════ */
// Level speed map: level → ms before auto-advance
const SL_SPEED = {1:5000,2:4500,3:3800,4:3200,5:2600,6:2100,7:1700,8:1300,9:1000,10:750};
// Level thresholds (score needed to reach level)
const SL_LEVELS = [0,10,20,35,50,70,95,125,160,200]; // index = level-1, value = score to reach that level
const SL_MAX_LEVEL = 10;

let slScore=0, slLevel=1, slCurrent="", slAlive=false, slTime=60, slMaxTime=60;
let slTimer=null, slIdle=null, slCombo=0, slGhost=false, slGhostTO=null, slEndScore=0, slEndLevel=1;

const letterEl=document.getElementById("letter");
const hudScore =document.getElementById("hud-score");
const hudLevel =document.getElementById("hud-level");
const hudTime  =document.getElementById("hud-time");
const timerBar =document.getElementById("timer-bar");
const comboEl  =document.getElementById("sl-combo");

// Time selector
let slSelectedTime = 60;
document.querySelectorAll(".time-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".time-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    slSelectedTime = parseInt(btn.dataset.t);
    SFX.click();
  });
});

function refreshSLScreen() {
  document.getElementById("sl-highscore").textContent = getHS();
  const ghostBtn = document.getElementById("btn-ghost-toggle");
  ghostBtn.classList.toggle("on", slGhost);
  document.getElementById("ghost-state").textContent = slGhost?"ON":"OFF";
  document.getElementById("ghost-state").className = `option-state ${slGhost?"on":"off"}`;
}

document.getElementById("btn-ghost-toggle").addEventListener("click",()=>{ slGhost=!slGhost; SFX.click(); refreshSLScreen(); });
document.getElementById("btn-restart-win") .addEventListener("click", startSL);
document.getElementById("btn-win-home")    .addEventListener("click", goHome);
document.getElementById("btn-back-sl")     .addEventListener("click", goHome);

function getLevelForScore(s) {
  let lv=1;
  for(let i=SL_LEVELS.length-1;i>=0;i--){ if(s>=SL_LEVELS[i]){ lv=i+1; break; } }
  return Math.min(lv, SL_MAX_LEVEL);
}

function updateHud() {
  hudScore.textContent=`Score: ${slScore}`;
  hudLevel.textContent=`Lvl ${slLevel}`;
  if(slSelectedTime===99){
    hudTime.textContent="∞";
    timerBar.style.width="100%";
    timerBar.style.background="linear-gradient(90deg,#6366f1,#8b5cf6)";
  } else {
    hudTime.textContent=`⏱ ${slTime}s`;
    timerBar.style.width=`${(slTime/slMaxTime)*100}%`;
    timerBar.style.background=slTime>slMaxTime*.5?"linear-gradient(90deg,#22c55e,#84cc16)":slTime>slMaxTime*.25?"linear-gradient(90deg,#f59e0b,#f97316)":"linear-gradient(90deg,#ef4444,#dc2626)";
  }
}

function stopSLTimer() { clearInterval(slTimer); }
function startSLTimer() {
  stopSLTimer();
  if(slSelectedTime===99){ updateHud(); return; }
  slTime=slMaxTime=slSelectedTime; updateHud();
  slTimer=setInterval(()=>{ slTime--; updateHud(); if(slTime<=0){slTime=0;slEnd("time");} },1000);
}
function startIdle() { clearTimeout(slIdle); slIdle=setTimeout(()=>{ if(slAlive){slNext();startIdle();} },SL_SPEED[slLevel]??750); }
function stopIdle()  { clearTimeout(slIdle); }

function slRandom() {
  const L=["S","L"],n=Math.random()<.5?1:2; let r="";
  for(let i=0;i<n;i++) r+=L[Math.floor(Math.random()*2)]; return r;
}
const SL_KEYS={S:"s",L:"l",SS:"l",LL:"s",SL:" ",LS:" "};

function slNext() {
  slCurrent=slRandom(); letterEl.textContent=slCurrent; letterEl.className="letter-tile";
  clearTimeout(slGhostTO);
  if(slGhost) slGhostTO=setTimeout(()=>{ if(slAlive){letterEl.textContent="?";letterEl.classList.add("ghost");} },220);
}
function slFlash(cls) { letterEl.classList.add(cls); setTimeout(()=>letterEl.classList.remove(cls),240); }
function updateCombo() {
  if(slCombo>=3){ comboEl.textContent=`🔥 ${slCombo}x`; comboEl.className="sl-combo active"; }
  else{ comboEl.textContent=""; comboEl.className="sl-combo"; }
}

function startSL() {
  slScore=0; slLevel=1; slCombo=0; slAlive=true;
  showScreen("game");
  document.getElementById("ghost-hud").classList.toggle("hidden",!slGhost);
  letterEl.textContent="GO!"; letterEl.className="letter-tile";
  comboEl.textContent=""; comboEl.className="sl-combo";
  startSLTimer();
  setTimeout(()=>{ slNext(); startIdle(); },600);
}

document.addEventListener("keydown",e=>{
  if(e.key===" ") e.preventDefault();
  if(!document.getElementById("screen-start").classList.contains("hidden")&&!slAlive){ if(e.key===" ") startSL(); return; }
  if(!slAlive) return;
  if(document.getElementById("screen-game").classList.contains("hidden")) return;
  if(!["s","l"," "].includes(e.key)) return;
  letterEl.classList.add("pressed"); setTimeout(()=>letterEl.classList.remove("pressed"),110);
  if(e.key===SL_KEYS[slCurrent]) {
    slCombo++;
    const bonus=slCombo>=20?4:slCombo>=10?2:slCombo>=5?1:0;
    slScore+=1+bonus;
    SFX.combo(slCombo);
    if(slCombo>=15) unlockAch("on_fire");
    if(slScore>=100) unlockAch("centurion");
    slFlash("correct"); updateCombo();
    // Level up check
    const newLevel=getLevelForScore(slScore);
    if(newLevel>slLevel){
      slLevel=newLevel; updateHud(); SFX.levelup();
      letterEl.textContent=slLevel===SL_MAX_LEVEL?"MAX LVL!!":`LVL ${slLevel}!`;
      letterEl.className="letter-tile"; stopIdle();
      if(slLevel===SL_MAX_LEVEL){ slFlash("correct"); }
      setTimeout(()=>{ slNext(); startIdle(); },600); return;
    }
    updateHud(); slNext(); startIdle();
  } else {
    slCombo=0; updateCombo(); SFX.wrong(); slFlash("wrong");
    setTimeout(()=>slEnd("wrong"),260);
  }
});

function slEnd(reason) {
  slAlive=false; stopSLTimer(); stopIdle(); clearTimeout(slGhostTO);
  slEndScore=slScore; slEndLevel=slLevel;
  const isNewBest = slScore > getHS();
  saveHS(slScore);
  if(slGhost&&slScore>=30) unlockAch("ghost_beast");
  // Go to name entry screen
  const titleEl=document.getElementById("name-title");
  titleEl.textContent=reason==="time"?"Time's Up!":"Game Over";
  titleEl.className=`end-title ${reason==="time"?"time":"lose"}`;
  document.getElementById("name-score-val").textContent=slScore;
  document.getElementById("name-level-val").textContent=slLevel;
  const nb=document.getElementById("name-new-best");
  if(isNewBest){ nb.classList.remove("hidden"); } else { nb.classList.add("hidden"); }
  const inp=document.getElementById("name-input");
  inp.value=getSavedName();
  showScreen("name");
  setTimeout(()=>inp.focus(),200);
}

/* ── Name Entry & Score Submit ── */
document.getElementById("btn-submit-score").addEventListener("click", submitScore);
document.getElementById("btn-skip-submit") .addEventListener("click", ()=>{ openLeaderboard(null,null); });

document.getElementById("name-input").addEventListener("keydown",e=>{ if(e.key==="Enter") submitScore(); });

async function submitScore() {
  const name = document.getElementById("name-input").value.trim().slice(0,16) || "Anonymous";
  saveName(name);
  SFX.submit();
  const btn=document.getElementById("btn-submit-score");
  btn.textContent="Submitting…"; btn.disabled=true;
  const res = await dbInsert("sl_scores",{ name, score:slEndScore, level:slEndLevel });
  btn.disabled=false;
  if(res.ok) {
    unlockAch("first_score");
    await openLeaderboard(name, slEndScore);
  } else {
    let msg = "Failed — retry?";
    if (res.reason === "not_configured")  msg = "⚠️ Add Supabase keys to popup.js";
    else if (res.reason === "http_401")   msg = "⚠️ Wrong API key";
    else if (res.reason === "http_404")   msg = "⚠️ Table not found — run the SQL";
    else if (res.reason === "http_403")   msg = "⚠️ RLS blocking — check policies";
    else if (res.reason === "network")    msg = "⚠️ Network error — check URL";
    else if (res.reason)                  msg = `⚠️ Error: ${res.reason}`;
    btn.textContent = msg;
    setTimeout(()=>{ btn.textContent="Submit Score 🌍"; btn.disabled=false; }, 3500);
  }
}

/* ═══════════════════════════════════════════════════
   LEADERBOARD
═══════════════════════════════════════════════════ */
let lbTab="all", lbPlayerName=null, lbPlayerScore=null;

document.getElementById("btn-lb-close").addEventListener("click", goHome);
document.getElementById("btn-lb-home") .addEventListener("click", goHome);
document.getElementById("btn-lb-play") .addEventListener("click", ()=>{ refreshSLScreen(); showScreen("start"); });
document.getElementById("lb-tab-all")  .addEventListener("click", ()=>{ setLbTab("all"); });
document.getElementById("lb-tab-today").addEventListener("click", ()=>{ setLbTab("today"); });

function setLbTab(tab) {
  lbTab=tab;
  document.getElementById("lb-tab-all")  .classList.toggle("active",tab==="all");
  document.getElementById("lb-tab-today").classList.toggle("active",tab==="today");
  loadLeaderboard();
}

async function openLeaderboard(name, score) {
  lbPlayerName=name; lbPlayerScore=score;
  showScreen("leaderboard");
  setLbTab("all");
}

async function loadLeaderboard() {
  const list=document.getElementById("lb-list");
  list.innerHTML=`<div class="lb-loading">Loading…</div>`;

  const params={
    select:"name,score,level,created_at",
    order:"score.desc,created_at.asc",
    limit:"10",
  };
  if(lbTab==="today"){
    const today=new Date(); today.setHours(0,0,0,0);
    params["created_at"]=`gte.${today.toISOString()}`;
  }

  const rows = await dbSelect("sl_scores", params);
  list.innerHTML="";

  if(!rows||!rows.length){
    list.innerHTML=`<div class="lb-error">No scores yet — be the first!</div>`;
    document.getElementById("lb-your-rank").textContent="";
    return;
  }

  let yourRankText="";
  let foundYou=false;

  rows.forEach((row,i)=>{
    const isYou = lbPlayerName && row.name===lbPlayerName && row.score===lbPlayerScore;
    const div=document.createElement("div");
    div.className=`lb-row${i===0?" top1":""}${isYou?" you":""}`;
    div.style.animationDelay=`${i*0.04}s`;
    const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
    div.innerHTML=`
      <span class="lb-rank">${medal}</span>
      <span class="lb-name">${esc(row.name)}${isYou?" 👈":""}</span>
      <span class="lb-score">${row.score}</span>
      <span class="lb-lvl">Lvl ${row.level}</span>
    `;
    list.appendChild(div);
    if(isYou){ foundYou=true; yourRankText=`You're #${i+1} ${lbTab==="today"?"today":"all time"}!`; if(i<10)unlockAch("world_top10"); }
  });

  // If player submitted but not in top 10, show their rank separately
  if(lbPlayerScore&&!foundYou){
    const countParams={select:"score",order:"score.desc"};
    if(lbTab==="today"){const t=new Date();t.setHours(0,0,0,0);countParams["created_at"]=`gte.${t.toISOString()}`;}
    countParams[`score`]=`gte.${lbPlayerScore}`;
    const above=await dbSelect("sl_scores",countParams);
    yourRankText=`You're ranked #${above.length} ${lbTab==="today"?"today":"all time"} with ${lbPlayerScore} pts`;
  }
  document.getElementById("lb-your-rank").textContent=yourRankText;
}

function esc(s){ return (s||"").replace(/[<>&"]/g,c=>({'"':"&quot;","<":"&lt;",">":"&gt;","&":"&amp;"}[c])); }

/* ═══════════════════════════════════════════════════
   REACTION TEST
═══════════════════════════════════════════════════ */
const RT_ROUNDS=5;
let rtRound=0,rtTimes=[],rtGoTime=null,rtWaiting=false,rtActive=false,rtDelay=null,rtFakeActive=false,rt1v1=false,rtPhase=1,rtP1Times=[];
const rtTileEl=document.getElementById("rt-tile"),rtTileT=document.getElementById("rt-tile-text"),rtTileL=document.getElementById("rt-tile-label"),rtRoundL=document.getElementById("rt-round-label"),rtLog=document.getElementById("rt-log"),rtSub=document.getElementById("rt-sub");

document.getElementById("btn-rt-quit")      .addEventListener("click",()=>{ rtReset();goHome(); });
document.getElementById("btn-rt-again")     .addEventListener("click",()=>startRT(false));
document.getElementById("btn-rt-1v1")       .addEventListener("click",()=>startRT(true));
document.getElementById("btn-rt-home")      .addEventListener("click",goHome);
document.getElementById("btn-rt-handoff-go").addEventListener("click",rtStartP2);
document.getElementById("btn-rt-1v1-again") .addEventListener("click",()=>startRT(true));
document.getElementById("btn-rt-1v1-home")  .addEventListener("click",goHome);

function rtReset(){clearTimeout(rtDelay);rtWaiting=rtActive=rtFakeActive=false;rtGoTime=null;}
function rtSetState(s,emoji,lbl){rtTileEl.className=`rt-tile ${s}`;rtTileT.textContent=emoji;rtTileL.textContent=lbl;}
function startRT(is1v1){rt1v1=is1v1;rtPhase=1;rtP1Times=[];rtRound=0;rtTimes=[];rtLog.innerHTML="";document.getElementById("rt-mode-badge").textContent=is1v1?"⚔️ 1v1":"";showScreen("rt");rtNextRound();}

function rtNextRound(){
  rtRound++;
  rtRoundL.textContent=`${rt1v1?`P${rtPhase} · `:""}Round ${rtRound} / ${RT_ROUNDS}`;
  rtSub.textContent="Green = GO  ·  Red = don't press!";
  rtSetState("waiting","⏳","Get ready…");rtWaiting=true;rtActive=rtFakeActive=false;rtGoTime=null;
  const totalDelay=1800+Math.random()*2700,hasFake=Math.random()<.3,fakeAt=totalDelay*(.3+Math.random()*.3);
  if(hasFake){rtDelay=setTimeout(()=>{if(!rtWaiting)return;rtFakeActive=true;rtSetState("fake","🔴","Don't press!");SFX.rtFake();setTimeout(()=>{if(rtFakeActive){rtFakeActive=false;rtSetState("waiting","⏳","Stay sharp…");}},500);},fakeAt);}
  setTimeout(()=>{clearTimeout(rtDelay);if(!rtWaiting)return;rtSetState("ready","👀","Almost…");rtDelay=setTimeout(()=>{rtWaiting=false;rtActive=true;rtGoTime=performance.now();rtSetState("go","GO!","Press SPACE!");SFX.rtGo();},350+Math.random()*300);},totalDelay);
}

function rtHandleSpace(){
  if(document.getElementById("screen-rt").classList.contains("hidden"))return;
  if(rtFakeActive){rtFakeActive=false;rtWaiting=false;rtActive=false;clearTimeout(rtDelay);rtSetState("early","⚠️","Fake-out!");SFX.rtEarly();rtTimes.push("fake");rtAddLog(rtRound,"fake");if(rtRound>=RT_ROUNDS)setTimeout(rtDone,900);else setTimeout(rtNextRound,1200);return;}
  if(rtWaiting){clearTimeout(rtDelay);rtWaiting=false;rtSetState("early","⚠️","Too early!");SFX.rtEarly();rtTimes.push("early");rtAddLog(rtRound,"early");if(rtRound>=RT_ROUNDS)setTimeout(rtDone,900);else setTimeout(rtNextRound,1200);return;}
  if(rtActive){
    const ms=Math.round(performance.now()-rtGoTime);rtActive=false;rtTimes.push(ms);
    const sp=ms<230?"fast":ms<380?"medium":"slow";
    rtSetState("done","✓",`${ms} ms`);rtTileT.style.fontSize="32px";rtTileT.style.color=sp==="fast"?"#22c55e":sp==="medium"?"#f59e0b":"#f87171";
    rtAddLog(rtRound,ms,sp);if(ms<200)unlockAch("cyborg");
    if(rtRound>=RT_ROUNDS)setTimeout(rtDone,900);
    else setTimeout(()=>{rtTileT.style.fontSize=rtTileT.style.color="";rtNextRound();},950);
  }
}
function rtAddLog(round,ms,speed){const row=document.createElement("div");row.className="rt-log-row";const cls=ms==="early"?"early":ms==="fake"?"fake":speed;const txt=ms==="early"?"⚠ Early":ms==="fake"?"🔴 Faked":`${ms} ms`;row.innerHTML=`<span class="rn">Round ${round}</span><span class="rm ${cls}">${txt}</span>`;rtLog.appendChild(row);}
function rtDone(){if(rt1v1&&rtPhase===1){rtP1Times=[...rtTimes];document.getElementById("rt-handoff-num").textContent="2";const avg=rtCalcAvg(rtP1Times);document.getElementById("rt-handoff-preview").textContent=avg?`Player 1 avg: ${avg} ms`:"Player 1 done";showScreen("rt-handoff");}else if(rt1v1&&rtPhase===2){rtShow1v1();}else{rtShowResults(rtTimes);}}
function rtStartP2(){rtPhase=2;rtRound=0;rtTimes=[];rtLog.innerHTML="";document.getElementById("rt-mode-badge").textContent="⚔️ 1v1";showScreen("rt");rtNextRound();}
function rtCalcAvg(times){const v=times.filter(t=>typeof t==="number");return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null;}

function rtShowResults(times){
  const valid=times.filter(t=>typeof t==="number"),maxT=valid.length?Math.max(...valid,400):400;
  const chart=document.getElementById("rt-chart");chart.innerHTML="";
  times.forEach((t,i)=>{const col=document.createElement("div");col.className="rt-bar-col";const bar=document.createElement("div");bar.className="rt-bar";const lbl=document.createElement("span");lbl.className="rt-bar-lbl";lbl.textContent=i+1;const isN=typeof t==="number";const sp=isN?(t<230?"fast":t<380?"medium":"slow"):t;bar.classList.add(sp);bar.style.height=isN?Math.round((t/maxT)*100)+"%":"35%";col.appendChild(bar);col.appendChild(lbl);chart.appendChild(col);});
  const sum=document.getElementById("rt-summary");sum.innerHTML="";
  times.forEach((t,i)=>{const r=document.createElement("div");r.className="rt-sum-row";const isN=typeof t==="number";const sp=isN?(t<230?"fast":t<380?"medium":""):"";r.innerHTML=`<span class="lbl">Round ${i+1}</span><span class="val ${isN?sp:""}">${t==="early"?"⚠ Early":t==="fake"?"🔴 Faked":`${t} ms`}</span>`;sum.appendChild(r);});
  const avg=rtCalcAvg(times),best=valid.length?Math.min(...valid):null;
  if(avg!=null){const r=document.createElement("div");r.className="rt-sum-row";r.innerHTML=`<span class="lbl" style="font-weight:700;color:#cbd5e1">Average</span><span class="val ${avg<230?"fast":avg<380?"medium":""}">${avg} ms</span>`;sum.appendChild(r);}
  if(best!=null){const r=document.createElement("div");r.className="rt-sum-row";r.innerHTML=`<span class="lbl" style="font-weight:700;color:#cbd5e1">Best</span><span class="val best">${best} ms</span>`;sum.appendChild(r);}
  const earl=times.filter(t=>t==="early"||t==="fake").length,rEl=document.getElementById("rt-rating");
  if(avg===null)  {rEl.textContent="😬 All bad presses!";rEl.style.color="#f97316";}
  else if(earl>0) {rEl.textContent=`${earl} bad press${earl>1?"es":""} — patience! 😅`;rEl.style.color="#f59e0b";}
  else if(avg<200){rEl.textContent="🤖 Superhuman!";rEl.style.color="#22c55e";}
  else if(avg<250){rEl.textContent="⚡ Elite reflexes!";rEl.style.color="#4ade80";}
  else if(avg<300){rEl.textContent="🎯 Above average!";rEl.style.color="#86efac";}
  else if(avg<380){rEl.textContent="👍 Average range";rEl.style.color="#f59e0b";}
  else            {rEl.textContent="🐢 Keep practicing!";rEl.style.color="#f87171";}
  showScreen("rt-end");
}

function rtShow1v1(){
  const p2=rtTimes,p1=rtP1Times,a1=rtCalcAvg(p1),a2=rtCalcAvg(p2);
  const grid=document.getElementById("rt-1v1-grid");grid.innerHTML="";
  [p1,p2].forEach((times,pi)=>{const col=document.createElement("div");col.className="rt-1v1-col";col.innerHTML=`<h3>Player ${pi+1}</h3>`;times.forEach((t,i)=>{const row=document.createElement("div");row.className="rt-1v1-row";row.innerHTML=`<span class="n">${i+1}</span><span class="v">${typeof t==="number"?t+" ms":t==="early"?"Early":"Faked"}</span>`;col.appendChild(row);});const avg=rtCalcAvg(times);const avgDiv=document.createElement("div");avgDiv.className="rt-1v1-avg";avgDiv.textContent=avg?`Avg: ${avg} ms`:"No valid";avgDiv.style.color=avg&&avg<300?"#22c55e":"#f59e0b";col.appendChild(avgDiv);grid.appendChild(col);});
  const win=document.getElementById("rt-1v1-winner");
  if(a1===null&&a2===null)win.textContent="🤝 Draw!";
  else if(a1===null){win.textContent="⚔️ Player 2 wins!";unlockAch("hot_seat");}
  else if(a2===null)win.textContent="⚔️ Player 1 wins!";
  else if(a1<a2)win.textContent=`⚔️ Player 1 wins by ${a2-a1}ms!`;
  else if(a2<a1){win.textContent=`⚔️ Player 2 wins by ${a1-a2}ms!`;unlockAch("hot_seat");}
  else win.textContent="🤝 Perfect tie!";
  showScreen("rt-1v1");
}

document.addEventListener("keydown",e=>{
  if(e.key!==" ")return;
  if(!document.getElementById("screen-rt").classList.contains("hidden"))rtHandleSpace();
  if(!document.getElementById("screen-rt-end").classList.contains("hidden"))startRT(false);
  if(!document.getElementById("screen-rt-1v1").classList.contains("hidden"))startRT(true);
});

/* ═══════════════════════════════════════════════════
   SUDOKU
═══════════════════════════════════════════════════ */
const SDK_CLUES={Easy:38,Medium:30,Hard:24};
let sdkBoard=[],sdkPuzzle=[],sdkPlayer=[],sdkNotesCells=[];
let sdkMistakes=0,sdkSelected=null,sdkSecs=0,sdkTimerInt=null,sdkNotesMode=false,sdkIsDaily=false;
const sdkBoardEl=document.getElementById("sdk-board"),sdkDiffEl=document.getElementById("sdk-diff"),sdkTimerEl=document.getElementById("sdk-timer"),sdkMistEl=document.getElementById("sdk-mistakes");

document.querySelectorAll(".sdk-diff-card").forEach(btn=>btn.addEventListener("click",()=>{SFX.click();startSudoku(btn.dataset.diff,false);}));
document.getElementById("btn-sdk-diff-back").addEventListener("click",goHome);
document.getElementById("btn-sdk-quit")     .addEventListener("click",()=>{sdkStopTimer();goHome();});
document.getElementById("btn-sdk-again")    .addEventListener("click",()=>showScreen("sdk-diff"));
document.getElementById("btn-sdk-win-home") .addEventListener("click",goHome);
document.getElementById("btn-sdk-retry")    .addEventListener("click",()=>showScreen("sdk-diff"));
document.getElementById("btn-sdk-end-home") .addEventListener("click",goHome);
document.getElementById("btn-sdk-notes")    .addEventListener("click",()=>{sdkSetNotesMode(!sdkNotesMode);SFX.click();});
document.getElementById("btn-sdk-autonotes").addEventListener("click",sdkAutoNotes);
document.getElementById("btn-sdk-erase")    .addEventListener("click",()=>{SFX.click();sdkInput(0);});
document.getElementById("sdk-numpad").addEventListener("click",e=>{const b=e.target.closest(".sdk-num");if(b)sdkInput(Number(b.dataset.n));});

document.addEventListener("keydown",e=>{
  if(document.getElementById("screen-sudoku").classList.contains("hidden"))return;
  if(e.key==="n"||e.key==="N"){sdkSetNotesMode(!sdkNotesMode);return;}
  if(e.key>="1"&&e.key<="9"){sdkInput(Number(e.key));return;}
  if(e.key==="Backspace"||e.key==="Delete"||e.key==="0"){sdkInput(0);return;}
  if(!sdkSelected)return;
  let{r,c}=sdkSelected;
  if(e.key==="ArrowUp"){e.preventDefault();r=(r+8)%9;}
  if(e.key==="ArrowDown"){e.preventDefault();r=(r+1)%9;}
  if(e.key==="ArrowLeft"){e.preventDefault();c=(c+8)%9;}
  if(e.key==="ArrowRight"){e.preventDefault();c=(c+1)%9;}
  sdkSelect(r,c);
});

function sdkShuffle(arr,rng){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor((rng||Math.random)()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sdkIsValid(board,r,c,n){for(let i=0;i<9;i++)if(board[r][i]===n||board[i][c]===n)return false;const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(board[br+i][bc+j]===n)return false;return true;}
function sdkSolve(board,rng){for(let r=0;r<9;r++)for(let c=0;c<9;c++){if(board[r][c]===0){for(const n of sdkShuffle([1,2,3,4,5,6,7,8,9],rng)){if(sdkIsValid(board,r,c,n)){board[r][c]=n;if(sdkSolve(board,rng))return true;board[r][c]=0;}}return false;}}return true;}
function sdkGenerate(rng){const b=Array.from({length:9},()=>Array(9).fill(0));sdkSolve(b,rng);return b;}
function sdkUnique(board){let count=0;function go(b){for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(b[r][c]===0){for(let n=1;n<=9;n++)if(sdkIsValid(b,r,c,n)){b[r][c]=n;go(b);if(count>1)return;b[r][c]=0;}return;}count++;}go(board.map(r=>[...r]));return count===1;}
function sdkMakePuzzle(sol,clues,rng){const p=sol.map(r=>[...r]);const cells=sdkShuffle(Array.from({length:81},(_,i)=>i),rng);let filled=81;for(const idx of cells){if(filled<=clues)break;const r=Math.floor(idx/9),c=idx%9,bk=p[r][c];p[r][c]=0;filled--;if(!sdkUnique(p)){p[r][c]=bk;filled++;}}return p;}
function sdkStartTimer(){sdkSecs=0;sdkTimerEl.textContent="0:00";clearInterval(sdkTimerInt);sdkTimerInt=setInterval(()=>{sdkSecs++;const m=Math.floor(sdkSecs/60),s=sdkSecs%60;sdkTimerEl.textContent=`${m}:${String(s).padStart(2,"0")}`;},1000);}
function sdkStopTimer(){clearInterval(sdkTimerInt);}

function startSudoku(diff,isDaily,rng){
  sdkIsDaily=!!isDaily;sdkDiffEl.textContent=isDaily?"Daily":diff;
  sdkBoard=sdkGenerate(rng);sdkPuzzle=sdkMakePuzzle(sdkBoard,SDK_CLUES[diff]||30,rng);
  sdkPlayer=sdkPuzzle.map(r=>[...r]);sdkMistakes=0;sdkSelected=null;sdkMistEl.textContent="✕ 0 / 3";
  sdkNotesCells=Array.from({length:9},()=>Array.from({length:9},()=>new Set()));
  sdkSetNotesMode(false);showScreen("sudoku");sdkRenderBoard();sdkUpdateNumpad();sdkStartTimer();
}
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
function sdkWin(){sdkStopTimer();SFX.sdkWin();if(sdkMistakes===0)unlockAch("flawless");if(sdkIsDaily)markDailyDone();document.getElementById("sdk-win-time").textContent=sdkTimerEl.textContent;document.getElementById("sdk-win-mistakes").textContent=sdkMistakes;document.getElementById("sdk-win-title").textContent=sdkIsDaily?"Daily Solved! 🗓️":"Solved!";const shareDiv=document.getElementById("sdk-daily-share");if(sdkIsDaily){shareDiv.classList.remove("hidden");shareDiv.style.display="flex";shareDiv.innerHTML=`<button class="btn-ghost-btn" id="btn-share">📋 Share</button>`;document.getElementById("btn-share").addEventListener("click",()=>{const txt=`I solved today's Daily Sudoku in ${sdkTimerEl.textContent} with ${sdkMistakes} mistake${sdkMistakes!==1?"s":""}! 🔢`;navigator.clipboard?.writeText(txt).then(()=>{document.getElementById("btn-share").textContent="✓ Copied!";});});}else{shareDiv.classList.add("hidden");shareDiv.style.display="none";}showScreen("sudoku-win");}
function sdkUpdateNumpad(){const cnt=Array(10).fill(0);for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(sdkPlayer[r][c])cnt[sdkPlayer[r][c]]++;document.querySelectorAll(".sdk-num").forEach(btn=>{const n=Number(btn.dataset.n);btn.classList.toggle("dim",cnt[n]>=9);});}

