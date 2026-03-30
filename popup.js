
/* ═══════════════════════════════════════════════════════
   SCREEN SYSTEM
═══════════════════════════════════════════════════════ */
const SCREEN_IDS = ["home","start","game","end","win","rt","rt-end","sudoku","sudoku-win","sudoku-end"];

function showScreen(name) {
  SCREEN_IDS.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) el.classList.toggle("hidden", s !== name);
  });
}

/* ═══════════════════════════════════════════════════════
   SWIPE DECK
═══════════════════════════════════════════════════════ */
const MODES = [
  {
    id:     "sl",
    emoji:  "🧠",
    name:   "SL Challenge",
    desc:   "Press the right key for each letter combo",
    tags:   ["5 Levels", "30 sec", "Keyboard"],
    bg:     "linear-gradient(145deg, #0f2044, #1a1060)",
    glow:   "rgba(96,165,250,0.35)",
    accent: "#60a5fa",
  },
  {
    id:     "rt",
    emoji:  "⚡",
    name:   "Reaction Test",
    desc:   "Hit SPACE the instant you see green",
    tags:   ["5 Rounds", "Timed", "Reflexes"],
    bg:     "linear-gradient(145deg, #0a2e1a, #061f0f)",
    glow:   "rgba(34,197,94,0.35)",
    accent: "#4ade80",
  },
  {
    id:     "sudoku",
    emoji:  "🔢",
    name:   "Sudoku",
    desc:   "Fill the grid — no repeats in row, column or box",
    tags:   ["9×9 Grid", "3 Mistakes", "Logic"],
    bg:     "linear-gradient(145deg, #2a1a0e, #1a0f05)",
    glow:   "rgba(251,191,36,0.3)",
    accent: "#fbbf24",
  },
];

let deckIdx       = 0;
let dragging      = false;
let dragStartX    = 0;
let dragCurrentX  = 0;
let pointerDownId = null;

const topCard   = document.getElementById("swipe-top");
const backCard  = document.getElementById("swipe-back");
const stampPlay = document.getElementById("stamp-play");
const stampSkip = document.getElementById("stamp-skip");

const SWIPE_THRESHOLD = 75;
const MAX_ROTATE      = 18;
const FLY_DISTANCE    = 520;

function renderCard(el, mode) {
  Array.from(el.children).forEach(child => {
    if (!child.classList.contains("stamp")) child.remove();
  });
  el.style.background = mode.bg;
  el.style.boxShadow  = `inset 0 0 0 2px rgba(255,255,255,0.08), 0 24px 60px ${mode.glow}, 0 8px 24px rgba(0,0,0,0.5)`;

  const frag = document.createDocumentFragment();
  const emojiEl = document.createElement("div");
  emojiEl.className = "card-emoji"; emojiEl.textContent = mode.emoji;
  frag.appendChild(emojiEl);
  const nameEl = document.createElement("div");
  nameEl.className = "card-name"; nameEl.textContent = mode.name;
  frag.appendChild(nameEl);
  const descEl = document.createElement("div");
  descEl.className = "card-desc"; descEl.textContent = mode.desc;
  frag.appendChild(descEl);
  const tagsEl = document.createElement("div");
  tagsEl.className = "card-tags";
  mode.tags.forEach(t => {
    const tag = document.createElement("span");
    tag.className = "card-tag"; tag.textContent = t;
    tag.style.borderColor = mode.accent + "55"; tag.style.color = mode.accent;
    tagsEl.appendChild(tag);
  });
  frag.appendChild(tagsEl);
  el.insertBefore(frag, el.firstChild);
}

function renderDeck() {
  renderCard(backCard, MODES[(deckIdx + 1) % MODES.length]);
  renderCard(topCard,  MODES[deckIdx % MODES.length]);
  topCard.style.transition  = "";
  topCard.style.transform   = "";
  topCard.style.opacity     = "";
  backCard.style.transform  = "scale(0.92) translateY(10px)";
  backCard.style.transition = "";
  stampPlay.style.opacity   = "0";
  stampSkip.style.opacity   = "0";
}

function setDragTransform(dx) {
  const ratio  = Math.min(Math.abs(dx) / 150, 1);
  const rotate = (dx / 150) * MAX_ROTATE;
  topCard.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
  if (dx > 0) {
    stampPlay.style.opacity = String(Math.min(ratio * 1.4, 1));
    stampSkip.style.opacity = "0";
  } else if (dx < 0) {
    stampSkip.style.opacity = String(Math.min(ratio * 1.4, 1));
    stampPlay.style.opacity = "0";
  } else {
    stampPlay.style.opacity = "0"; stampSkip.style.opacity = "0";
  }
  const backScale = 0.92 + ratio * 0.08;
  const backY     = 10 - ratio * 10;
  backCard.style.transform = `scale(${backScale}) translateY(${backY}px)`;
}

function flyOff(direction) {
  const dx     = direction === "right" ? FLY_DISTANCE : -FLY_DISTANCE;
  const rotate = direction === "right" ? MAX_ROTATE   : -MAX_ROTATE;
  topCard.style.transition = "transform 0.38s cubic-bezier(0.25,0.8,0.5,1), opacity 0.38s ease";
  topCard.style.transform  = `translateX(${dx}px) rotate(${rotate}deg)`;
  topCard.style.opacity    = "0";
  backCard.style.transition = "transform 0.38s ease";
  backCard.style.transform  = "scale(1) translateY(0)";
  setTimeout(() => {
    const mode = MODES[deckIdx % MODES.length];
    deckIdx++;
    if (direction === "right") launchMode(mode.id);
    else                       renderDeck();
  }, 380);
}

function snapBack() {
  topCard.style.transition  = "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)";
  topCard.style.transform   = "";
  backCard.style.transition = "transform 0.35s ease";
  backCard.style.transform  = "scale(0.92) translateY(10px)";
  stampPlay.style.opacity   = "0"; stampSkip.style.opacity = "0";
}

function launchMode(id) {
  if      (id === "sl")     showScreen("start");
  else if (id === "rt")     startReactionTest();
  else if (id === "sudoku") startSudoku();
}

topCard.addEventListener("pointerdown", e => {
  dragging = true; dragStartX = e.clientX; dragCurrentX = 0;
  pointerDownId = e.pointerId; topCard.setPointerCapture(e.pointerId);
  topCard.style.transition = "";
});
topCard.addEventListener("pointermove", e => {
  if (!dragging || e.pointerId !== pointerDownId) return;
  dragCurrentX = e.clientX - dragStartX; setDragTransform(dragCurrentX);
});
topCard.addEventListener("pointerup", e => {
  if (!dragging || e.pointerId !== pointerDownId) return;
  dragging = false;
  if      (dragCurrentX >  SWIPE_THRESHOLD) flyOff("right");
  else if (dragCurrentX < -SWIPE_THRESHOLD) flyOff("left");
  else                                       snapBack();
});
topCard.addEventListener("pointercancel", () => { dragging = false; snapBack(); });

document.getElementById("btn-like").addEventListener("click", () => { setDragTransform(SWIPE_THRESHOLD+10); setTimeout(()=>flyOff("right"),50); });
document.getElementById("btn-nope").addEventListener("click", () => { setDragTransform(-(SWIPE_THRESHOLD+10)); setTimeout(()=>flyOff("left"),50); });

document.addEventListener("keydown", e => {
  if (!document.getElementById("screen-home").classList.contains("hidden")) {
    if (e.key === "ArrowRight") { setDragTransform(SWIPE_THRESHOLD+10); setTimeout(()=>flyOff("right"),50); }
    if (e.key === "ArrowLeft")  { setDragTransform(-(SWIPE_THRESHOLD+10)); setTimeout(()=>flyOff("left"),50); }
  }
});

renderDeck();

/* ═══════════════════════════════════════════════════════
   SL CHALLENGE
═══════════════════════════════════════════════════════ */
let score = 0, level = 1, realCurrent = "", alive = false, timeLeft = 30;
let timerInterval = null, changeTimeout = null;

const letterEl    = document.getElementById("letter");
const hudScore    = document.getElementById("hud-score");
const hudLevel    = document.getElementById("hud-level");
const hudTime     = document.getElementById("hud-time");
const timerBar    = document.getElementById("timer-bar");
const endTitle    = document.getElementById("end-title");
const endScoreVal = document.getElementById("end-score-val");
const winScoreVal = document.getElementById("win-score-val");

document.getElementById("btn-restart")    .addEventListener("click", startGame);
document.getElementById("btn-restart-win").addEventListener("click", startGame);
document.getElementById("btn-end-home")   .addEventListener("click", goHome);
document.getElementById("btn-win-home")   .addEventListener("click", goHome);
document.getElementById("btn-back-sl")    .addEventListener("click", goHome);

function goHome() {
  stopTimer(); stopIdleTimer(); alive = false;
  sdkStopTimer();
  deckIdx = 0; renderDeck(); showScreen("home");
}

function updateHud() {
  hudScore.textContent = `Score: ${score}`;
  hudLevel.textContent = `Level ${level}`;
  hudTime .textContent = `⏱ ${timeLeft}s`;
  timerBar.style.width = `${(timeLeft/30)*100}%`;
  if      (timeLeft > 15) timerBar.style.background = "linear-gradient(90deg,#22c55e,#84cc16)";
  else if (timeLeft > 8)  timerBar.style.background = "linear-gradient(90deg,#f59e0b,#f97316)";
  else                    timerBar.style.background = "linear-gradient(90deg,#ef4444,#dc2626)";
}

function startTimer() {
  clearInterval(timerInterval); timeLeft = 30; updateHud();
  timerInterval = setInterval(() => { timeLeft--; updateHud(); if (timeLeft <= 0) { timeLeft = 0; gameOver("time"); } }, 1000);
}
function stopTimer() { clearInterval(timerInterval); }

const LEVEL_SPEED = {1:5000,2:4000,3:3000,4:2000,5:1500};
function levelSpeed() { return LEVEL_SPEED[level]??1500; }

function startIdleTimer() {
  clearTimeout(changeTimeout);
  changeTimeout = setTimeout(() => { if (alive) { nextRound(); startIdleTimer(); } }, levelSpeed());
}
function stopIdleTimer() { clearTimeout(changeTimeout); }

function randomLetters() {
  const L = ["S","L"]; const n = Math.random()<.5?1:2;
  let r = ""; for (let i=0;i<n;i++) r+=L[Math.floor(Math.random()*2)]; return r;
}

const CORRECT_KEY = {S:"s",L:"l",SS:"l",LL:"s",SL:" ",LS:" "};
function correctKey(seq) { return CORRECT_KEY[seq]; }

function nextRound() { realCurrent = randomLetters(); letterEl.textContent = realCurrent; letterEl.className = "letter-tile"; }
function flashTile(cls) { letterEl.classList.add(cls); setTimeout(()=>letterEl.classList.remove(cls),260); }

function startGame() {
  score=0; level=1; alive=true;
  showScreen("game");
  letterEl.textContent = "GO!"; letterEl.className = "letter-tile";
  updateHud(); startTimer();
  setTimeout(()=>{ nextRound(); startIdleTimer(); },600);
}

function gameOver(reason="wrong") {
  alive=false; stopTimer(); stopIdleTimer();
  if (reason==="win") { winScoreVal.textContent=score; showScreen("win"); }
  else { endScoreVal.textContent=score; endTitle.className=reason==="time"?"end-title time":"end-title lose"; endTitle.textContent=reason==="time"?"Time's Up!":"Good Try!"; showScreen("end"); }
}

const LEVEL_AT = {10:2,20:3,30:4,40:5}; const WIN_SCORE=50;

document.addEventListener("keydown", e => {
  if (e.key===" ") e.preventDefault();
  const startVis = !document.getElementById("screen-start").classList.contains("hidden");
  if (!alive && startVis) { if (e.key===" ") startGame(); return; }
  const endVis = !document.getElementById("screen-end").classList.contains("hidden")||!document.getElementById("screen-win").classList.contains("hidden");
  if (!alive && endVis) { if (e.key===" ") goHome(); return; }
  if (!alive) return;
  if (document.getElementById("screen-game").classList.contains("hidden")) return;
  if (!["s","l"," "].includes(e.key)) return;
  letterEl.classList.add("pressed"); setTimeout(()=>letterEl.classList.remove("pressed"),120);
  if (e.key===correctKey(realCurrent)) {
    score++; flashTile("correct");
    if (score>=WIN_SCORE) { gameOver("win"); return; }
    if (LEVEL_AT[score]) { level=LEVEL_AT[score]; letterEl.textContent=`LEVEL ${level}!`; letterEl.className="letter-tile"; updateHud(); stopIdleTimer(); setTimeout(()=>{ startTimer(); nextRound(); startIdleTimer(); },700); return; }
    updateHud(); nextRound(); startIdleTimer();
  } else { flashTile("wrong"); setTimeout(()=>gameOver("wrong"),280); }
});

/* ═══════════════════════════════════════════════════════
   REACTION TEST
═══════════════════════════════════════════════════════ */
const RT_ROUNDS=5, RT_MIN=1800, RT_MAX=4500;
let rtRound=0, rtTimes=[], rtGoTime=null, rtWaiting=false, rtActive=false, rtDelayTimer=null;

const rtTile      = document.getElementById("rt-tile");
const rtTileText  = document.getElementById("rt-tile-text");
const rtTileLabel = document.getElementById("rt-tile-label");
const rtRoundLbl  = document.getElementById("rt-round-label");
const rtLog       = document.getElementById("rt-log");
const rtSub       = document.getElementById("rt-sub");

document.getElementById("btn-rt-quit") .addEventListener("click",()=>{ rtReset(); goHome(); });
document.getElementById("btn-rt-again").addEventListener("click", startReactionTest);
document.getElementById("btn-rt-home") .addEventListener("click", goHome);

function rtReset() { clearTimeout(rtDelayTimer); rtWaiting=false; rtActive=false; rtGoTime=null; }

function startReactionTest() { rtRound=0; rtTimes=[]; rtLog.innerHTML=""; showScreen("rt"); rtNextRound(); }

function rtNextRound() {
  rtRound++; rtRoundLbl.textContent=`Round ${rtRound} / ${RT_ROUNDS}`;
  rtSub.textContent="Press SPACE when the tile turns green";
  rtSetState("waiting","⏳","Get ready…"); rtWaiting=true; rtActive=false; rtGoTime=null;
  const delay = RT_MIN + Math.random()*(RT_MAX-RT_MIN);
  rtDelayTimer = setTimeout(()=>{
    rtSetState("ready","👀","Almost…");
    rtDelayTimer = setTimeout(()=>{ rtWaiting=false; rtActive=true; rtGoTime=performance.now(); rtSetState("go","GO!","Press SPACE now!"); }, 400+Math.random()*300);
  }, delay-500);
}

function rtSetState(state,emoji,label) { rtTile.className=`rt-tile ${state}`; rtTileText.textContent=emoji; rtTileLabel.textContent=label; }

function rtHandleKey() {
  if (document.getElementById("screen-rt").classList.contains("hidden")) return;
  if (rtWaiting) {
    clearTimeout(rtDelayTimer); rtWaiting=false; rtActive=false;
    rtSetState("early","⚠️","Too early!"); rtSub.textContent="Wait for green before pressing!";
    rtTimes.push("early"); addLogRow(rtRound,"early");
    if (rtRound>=RT_ROUNDS) setTimeout(rtShowResults,900); else setTimeout(rtNextRound,1100); return;
  }
  if (rtActive) {
    const elapsed = Math.round(performance.now()-rtGoTime); rtActive=false; rtTimes.push(elapsed);
    const speed = elapsed<230?"fast":elapsed<380?"medium":"slow";
    rtSetState("done","✓",`${elapsed} ms`);
    rtTileText.style.fontSize="36px";
    rtTile.querySelector("span:first-child").style.color = speed==="fast"?"#22c55e":speed==="medium"?"#f59e0b":"#f87171";
    addLogRow(rtRound,elapsed,speed);
    if (rtRound>=RT_ROUNDS) { setTimeout(rtShowResults,900); }
    else { setTimeout(()=>{ rtTileText.style.fontSize=""; rtTile.querySelector("span:first-child").style.color=""; rtNextRound(); },900); }
  }
}

function addLogRow(round,ms,speed) {
  const row=document.createElement("div"); row.className="rt-log-row";
  const cls=ms==="early"?"early":speed; const txt=ms==="early"?"⚠ Too early":`${ms} ms`;
  row.innerHTML=`<span class="round-num">Round ${round}</span><span class="round-ms ${cls}">${txt}</span>`;
  rtLog.appendChild(row);
}

function rtShowResults() {
  const valid=rtTimes.filter(t=>typeof t==="number"); const early=rtTimes.filter(t=>t==="early").length;
  const avg=valid.length?Math.round(valid.reduce((a,b)=>a+b,0)/valid.length):null;
  const best=valid.length?Math.min(...valid):null;
  const summary=document.getElementById("rt-summary"); summary.innerHTML="";
  rtTimes.forEach((t,i)=>{ const row=document.createElement("div"); row.className="rt-summary-row"; const isE=t==="early"; const sp=!isE?(t<230?"fast":t<380?"medium":""):""; row.innerHTML=`<span class="label">Round ${i+1}</span><span class="value ${isE?"":sp}">${isE?"⚠ Too early":`${t} ms`}</span>`; summary.appendChild(row); });
  if (avg!==null){ const r=document.createElement("div"); r.className="rt-summary-row"; r.innerHTML=`<span class="label" style="font-weight:700;color:#cbd5e1">Average</span><span class="value ${avg<230?"fast":avg<380?"medium":""}">${avg} ms</span>`; summary.appendChild(r); }
  if (best!==null){ const r=document.createElement("div"); r.className="rt-summary-row"; r.innerHTML=`<span class="label" style="font-weight:700;color:#cbd5e1">Best</span><span class="value best">${best} ms</span>`; summary.appendChild(r); }
  const rEl=document.getElementById("rt-rating");
  if      (avg===null)   { rEl.textContent="😬 All early — try waiting!"; rEl.style.color="#f97316"; }
  else if (early>0)      { rEl.textContent=`${early} early press${early>1?"es":""} — patience counts 😅`; rEl.style.color="#f59e0b"; }
  else if (avg<200)      { rEl.textContent="🚀 Superhuman! Are you a robot?"; rEl.style.color="#22c55e"; }
  else if (avg<250)      { rEl.textContent="⚡ Elite reflexes!"; rEl.style.color="#4ade80"; }
  else if (avg<300)      { rEl.textContent="🎯 Above average — nice!"; rEl.style.color="#86efac"; }
  else if (avg<380)      { rEl.textContent="👍 Average human range"; rEl.style.color="#f59e0b"; }
  else                   { rEl.textContent="🐢 Keep practicing!"; rEl.style.color="#f87171"; }
  showScreen("rt-end");
}

document.addEventListener("keydown", e => {
  if (e.key!==" ") return;
  if (!document.getElementById("screen-rt").classList.contains("hidden"))     rtHandleKey();
  if (!document.getElementById("screen-rt-end").classList.contains("hidden")) startReactionTest();
});

/* ═══════════════════════════════════════════════════════
   SUDOKU
═══════════════════════════════════════════════════════ */
let sdkBoard       = [];   // 9x9 solved values
let sdkPuzzle      = [];   // 9x9 puzzle (0 = empty)
let sdkPlayer      = [];   // 9x9 player values
let sdkMistakes    = 0;
let sdkSelected    = null; // {r,c}
let sdkSeconds     = 0;
let sdkTimerInt    = null;
let sdkDifficulty  = "Medium";

const SDK_CLUES    = { Easy: 38, Medium: 30, Hard: 24 };

const sdkBoardEl   = document.getElementById("sdk-board");
const sdkDiffEl    = document.getElementById("sdk-diff");
const sdkTimerEl   = document.getElementById("sdk-timer");
const sdkMistEl    = document.getElementById("sdk-mistakes");

document.getElementById("btn-sdk-quit")    .addEventListener("click", () => { sdkStopTimer(); goHome(); });
document.getElementById("btn-sdk-again")   .addEventListener("click", startSudoku);
document.getElementById("btn-sdk-win-home").addEventListener("click", goHome);
document.getElementById("btn-sdk-retry")   .addEventListener("click", startSudoku);
document.getElementById("btn-sdk-end-home").addEventListener("click", goHome);

/* ── Notes mode state ── */
let sdkNotesMode = false;
// sdkNotesCells[r][c] = Set of pencilled numbers
let sdkNotesCells = [];

function sdkInitNotes() {
  sdkNotesCells = Array.from({length:9}, () => Array.from({length:9}, () => new Set()));
}

function sdkSetNotesMode(on) {
  sdkNotesMode = on;
  document.body.classList.toggle("notes-mode", on);
  document.getElementById("btn-sdk-notes").classList.toggle("active", on);
}

document.getElementById("btn-sdk-notes").addEventListener("click", () => sdkSetNotesMode(!sdkNotesMode));
document.getElementById("btn-sdk-erase").addEventListener("click", () => sdkInput(0));

/* ── Numpad ── */
document.getElementById("sdk-numpad").addEventListener("click", e => {
  const btn = e.target.closest(".sdk-num");
  if (!btn) return;
  sdkInput(Number(btn.dataset.n));
});

/* ── Keyboard ── */
document.addEventListener("keydown", e => {
  if (document.getElementById("screen-sudoku").classList.contains("hidden")) return;
  if (e.key === "n" || e.key === "N") { sdkSetNotesMode(!sdkNotesMode); return; }
  if (e.key >= "1" && e.key <= "9") { sdkInput(Number(e.key)); return; }
  if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { sdkInput(0); return; }
  if (!sdkSelected) return;
  let {r,c} = sdkSelected;
  if (e.key === "ArrowUp")    { e.preventDefault(); r = (r+8)%9; }
  if (e.key === "ArrowDown")  { e.preventDefault(); r = (r+1)%9; }
  if (e.key === "ArrowLeft")  { e.preventDefault(); c = (c+8)%9; }
  if (e.key === "ArrowRight") { e.preventDefault(); c = (c+1)%9; }
  sdkSelect(r, c);
});

/* ── Generation ── */
function sdkShuffle(arr) { for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

function sdkIsValid(board, r, c, n) {
  for (let i=0;i<9;i++) { if (board[r][i]===n||board[i][c]===n) return false; }
  const br=Math.floor(r/3)*3, bc=Math.floor(c/3)*3;
  for (let i=0;i<3;i++) for (let j=0;j<3;j++) if (board[br+i][bc+j]===n) return false;
  return true;
}

function sdkSolve(board) {
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    if (board[r][c]===0) {
      for (const n of sdkShuffle([1,2,3,4,5,6,7,8,9])) {
        if (sdkIsValid(board,r,c,n)) { board[r][c]=n; if (sdkSolve(board)) return true; board[r][c]=0; }
      }
      return false;
    }
  }
  return true;
}

function sdkGenerate() {
  // Fresh empty board
  const board = Array.from({length:9},()=>Array(9).fill(0));
  sdkSolve(board);
  return board;
}

function sdkMakePuzzle(solution, clues) {
  const puzzle = solution.map(r=>[...r]);
  const cells  = sdkShuffle(Array.from({length:81},(_,i)=>i));
  let   filled = 81;
  for (const idx of cells) {
    if (filled <= clues) break;
    const r=Math.floor(idx/9), c=idx%9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0; filled--;
    // Quick uniqueness check: count solutions (cap at 2)
    const copy = puzzle.map(row=>[...row]);
    if (!sdkCountSolutions(copy, 2)) { puzzle[r][c]=backup; filled++; }
  }
  return puzzle;
}

function sdkCountSolutions(board, limit) {
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    if (board[r][c]===0) {
      let count=0;
      for (let n=1;n<=9;n++) {
        if (sdkIsValid(board,r,c,n)) { board[r][c]=n; count+=sdkCountSolutions(board,limit-count); if (count>=limit) { board[r][c]=0; return count; } board[r][c]=0; }
      }
      return count;
    }
  }
  return 1;
}

/* ── Timer ── */
function sdkStartTimer() {
  sdkSeconds=0; sdkTimerEl.textContent="0:00";
  clearInterval(sdkTimerInt);
  sdkTimerInt = setInterval(()=>{ sdkSeconds++; const m=Math.floor(sdkSeconds/60), s=sdkSeconds%60; sdkTimerEl.textContent=`${m}:${String(s).padStart(2,"0")}`; },1000);
}
function sdkStopTimer() { clearInterval(sdkTimerInt); }

/* ── Start ── */
function startSudoku(diff) {
  sdkDifficulty = diff || "Medium";
  sdkDiffEl.textContent = sdkDifficulty;
  sdkBoard   = sdkGenerate();
  sdkPuzzle  = sdkMakePuzzle(sdkBoard, SDK_CLUES[sdkDifficulty]);
  sdkPlayer  = sdkPuzzle.map(r=>[...r]);
  sdkMistakes = 0;
  sdkSelected = null;
  sdkMistEl.textContent = "✕ 0 / 3";
  sdkInitNotes();
  sdkSetNotesMode(false);
  showScreen("sudoku");
  sdkRenderBoard();
  sdkUpdateNumpad();
  sdkStartTimer();
}

/* ── Render board ── */
function sdkRenderBoard() {
  sdkBoardEl.innerHTML = "";
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    const cell = document.createElement("div");
    cell.className = "sdk-cell";
    cell.dataset.r = r; cell.dataset.c = c;
    cell.dataset.row = r; cell.dataset.col = c;
    const given = sdkPuzzle[r][c] !== 0;
    if (given) {
      cell.classList.add("given"); cell.textContent = sdkPuzzle[r][c];
    } else if (sdkPlayer[r][c] !== 0) {
      cell.classList.add("filled"); cell.textContent = sdkPlayer[r][c];
    } else {
      cell.classList.add("empty");
      cell.appendChild(sdkMakeNotesGrid(r, c));
    }
    cell.addEventListener("click", () => sdkSelect(r,c));
    sdkBoardEl.appendChild(cell);
  }
  if (sdkSelected) sdkHighlight(sdkSelected.r, sdkSelected.c);
}

/* Build the 3×3 mini-grid for pencil marks */
function sdkMakeNotesGrid(r, c) {
  const grid = document.createElement("div");
  grid.className = "sdk-notes";
  for (let n=1; n<=9; n++) {
    const span = document.createElement("span");
    span.className = "sdk-note-n";
    span.dataset.n = n;
    span.textContent = n;
    if (sdkNotesCells[r][c].has(n)) span.classList.add("on");
    grid.appendChild(span);
  }
  return grid;
}

/* ── Select cell ── */
function sdkSelect(r, c) {
  sdkSelected = {r, c};
  sdkHighlight(r, c);
  sdkUpdateNumpad();
}

function sdkHighlight(r, c) {
  const cells = sdkBoardEl.querySelectorAll(".sdk-cell");
  const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
  const selVal = sdkPlayer[r][c];
  cells.forEach(cell => {
    const cr = Number(cell.dataset.r), cc = Number(cell.dataset.c);
    cell.classList.remove("selected","related","same-num");
    const sameBox = Math.floor(cr/3)*3===br && Math.floor(cc/3)*3===bc;
    if (cr===r && cc===c) cell.classList.add("selected");
    else if (cr===r || cc===c || sameBox) cell.classList.add("related");
    if (selVal && selVal===sdkPlayer[cr][cc]) cell.classList.add("same-num");
  });
}

/* ── Input ── */
function sdkInput(n) {
  if (!sdkSelected) return;
  const {r,c} = sdkSelected;
  if (sdkPuzzle[r][c] !== 0) return; // given cell

  /* Erase */
  if (n === 0) {
    sdkPlayer[r][c] = 0;
    sdkNotesCells[r][c].clear();
    sdkRefreshCell(r, c);
    sdkHighlight(r, c);
    sdkUpdateNumpad();
    return;
  }

  /* Notes mode — toggle the pencil mark */
  if (sdkNotesMode) {
    if (sdkPlayer[r][c] !== 0) return; // can't annotate a filled cell
    const notes = sdkNotesCells[r][c];
    notes.has(n) ? notes.delete(n) : notes.add(n);
    sdkRefreshCell(r, c);
    return;
  }

  /* Normal mode */
  if (sdkPlayer[r][c] === n) return;

  if (n === sdkBoard[r][c]) {
    // Correct — place the number and scrub this number from notes in same row/col/box
    sdkPlayer[r][c] = n;
    sdkNotesCells[r][c].clear();
    sdkRemoveNoteFromPeers(r, c, n);
    sdkRefreshCell(r, c);
    sdkHighlight(r, c);
    sdkUpdateNumpad();
    if (sdkCheckWin()) { sdkWin(); }
  } else {
    // Wrong
    sdkMistakes++;
    sdkMistEl.textContent = `✕ ${sdkMistakes} / 3`;
    const cellEl = sdkBoardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    // Temporarily show wrong number
    cellEl.innerHTML = "";
    cellEl.textContent = n;
    cellEl.classList.remove("empty","filled");
    cellEl.classList.add("filled","error","error-flash");
    setTimeout(()=>{
      sdkRefreshCell(r, c);
      sdkHighlight(r, c);
    }, 600);
    if (sdkMistakes >= 3) { setTimeout(()=>{ sdkStopTimer(); showScreen("sudoku-end"); },700); }
  }
}

/* Remove a note from all peers when a number is confirmed */
function sdkRemoveNoteFromPeers(r, c, n) {
  const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
  for (let i=0;i<9;i++) {
    sdkNotesCells[r][i].delete(n);
    sdkNotesCells[i][c].delete(n);
  }
  for (let i=0;i<3;i++) for (let j=0;j<3;j++) sdkNotesCells[br+i][bc+j].delete(n);
  // Re-render affected cells
  for (let i=0;i<9;i++) {
    if (sdkPlayer[r][i]===0) sdkRefreshCell(r,i);
    if (sdkPlayer[i][c]===0) sdkRefreshCell(i,c);
  }
  for (let i=0;i<3;i++) for (let j=0;j<3;j++) if (sdkPlayer[br+i][bc+j]===0) sdkRefreshCell(br+i,bc+j);
}

function sdkRefreshCell(r, c) {
  const cellEl = sdkBoardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  if (!cellEl) return;
  const v = sdkPlayer[r][c];
  cellEl.classList.remove("empty","filled","error","error-flash");
  cellEl.innerHTML = "";
  if (v) {
    cellEl.textContent = v;
    cellEl.classList.add("filled");
  } else {
    cellEl.classList.add("empty");
    cellEl.appendChild(sdkMakeNotesGrid(r, c));
  }
}

function sdkCheckWin() {
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (sdkPlayer[r][c]!==sdkBoard[r][c]) return false;
  return true;
}

function sdkWin() {
  sdkStopTimer();
  document.getElementById("sdk-win-time").textContent     = sdkTimerEl.textContent;
  document.getElementById("sdk-win-mistakes").textContent = sdkMistakes;
  showScreen("sudoku-win");
}

/* ── Dim fully-placed numbers on numpad ── */
function sdkUpdateNumpad() {
  const counts = Array(10).fill(0);
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (sdkPlayer[r][c]) counts[sdkPlayer[r][c]]++;
  document.querySelectorAll(".sdk-num[data-n]").forEach(btn => {
    const n = Number(btn.dataset.n);
    if (n === 0) return;
    btn.classList.toggle("dim", counts[n] >= 9);
  });
}


