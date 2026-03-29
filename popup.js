/* ═══════════════════════════════════════════════════════
   SCREEN SYSTEM
═══════════════════════════════════════════════════════ */
const SCREEN_IDS = ["home","start","game","end","win","rt","rt-end"];

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
    id:    "sl",
    emoji: "🧠",
    name:  "SL Challenge",
    desc:  "Press the right key for each letter combo",
    tags:  ["5 Levels", "30 sec", "Keyboard"],
    bg:    "linear-gradient(145deg, #0f2044, #1a1060)",
    glow:  "rgba(96,165,250,0.35)",
    accent:"#60a5fa",
  },
  {
    id:    "rt",
    emoji: "⚡",
    name:  "Reaction Test",
    desc:  "Hit SPACE the instant you see green",
    tags:  ["5 Rounds", "Timed", "Reflexes"],
    bg:    "linear-gradient(145deg, #0a2e1a, #061f0f)",
    glow:  "rgba(34,197,94,0.35)",
    accent:"#4ade80",
  },
];

let deckIdx       = 0;   // which mode is on top
let dragging      = false;
let dragStartX    = 0;
let dragCurrentX  = 0;
let pointerDownId = null;

const topCard   = document.getElementById("swipe-top");
const backCard  = document.getElementById("swipe-back");
const stampPlay = document.getElementById("stamp-play");
const stampSkip = document.getElementById("stamp-skip");

const SWIPE_THRESHOLD = 75;   // px to trigger a swipe
const MAX_ROTATE      = 18;   // degrees at full drag
const FLY_DISTANCE    = 520;  // px off-screen

/* ── Render a card with mode data ── */
function renderCard(el, mode) {
  // Remove old content except stamps (only on top card)
  Array.from(el.children).forEach(child => {
    if (!child.classList.contains("stamp")) child.remove();
  });

  el.style.background = mode.bg;
  el.style.boxShadow  =
    `inset 0 0 0 2px rgba(255,255,255,0.08),
     0 24px 60px ${mode.glow},
     0 8px 24px rgba(0,0,0,0.5)`;

  const frag = document.createDocumentFragment();

  const emojiEl = document.createElement("div");
  emojiEl.className   = "card-emoji";
  emojiEl.textContent = mode.emoji;
  frag.appendChild(emojiEl);

  const nameEl = document.createElement("div");
  nameEl.className   = "card-name";
  nameEl.textContent = mode.name;
  frag.appendChild(nameEl);

  const descEl = document.createElement("div");
  descEl.className   = "card-desc";
  descEl.textContent = mode.desc;
  frag.appendChild(descEl);

  const tagsEl = document.createElement("div");
  tagsEl.className = "card-tags";
  mode.tags.forEach(t => {
    const tag = document.createElement("span");
    tag.className   = "card-tag";
    tag.textContent = t;
    tag.style.borderColor = mode.accent + "55";
    tag.style.color       = mode.accent;
    tagsEl.appendChild(tag);
  });
  frag.appendChild(tagsEl);

  el.insertBefore(frag, el.firstChild);
}

function renderDeck() {
  const top  = MODES[deckIdx % MODES.length];
  const back = MODES[(deckIdx + 1) % MODES.length];

  renderCard(backCard, back);
  renderCard(topCard,  top);

  topCard.style.transition = "";
  topCard.style.transform  = "";
  backCard.style.transform = "scale(0.92) translateY(10px)";
  backCard.style.transition= "";

  stampPlay.style.opacity = "0";
  stampSkip.style.opacity = "0";
}

/* ── Animate the top card position during drag ── */
function setDragTransform(dx) {
  const ratio   = Math.min(Math.abs(dx) / 150, 1);
  const rotate  = (dx / 150) * MAX_ROTATE;
  topCard.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;

  // Stamp opacity
  if (dx > 0) {
    stampPlay.style.opacity = String(Math.min(ratio * 1.4, 1));
    stampSkip.style.opacity = "0";
  } else if (dx < 0) {
    stampSkip.style.opacity = String(Math.min(ratio * 1.4, 1));
    stampPlay.style.opacity = "0";
  } else {
    stampPlay.style.opacity = "0";
    stampSkip.style.opacity = "0";
  }

  // Back card scales up as top card is dragged
  const backScale = 0.92 + ratio * 0.08;
  const backY     = 10  - ratio * 10;
  backCard.style.transform = `scale(${backScale}) translateY(${backY}px)`;
}

/* ── Fly the top card off screen and advance deck ── */
function flyOff(direction) {
  const dx      = direction === "right" ? FLY_DISTANCE : -FLY_DISTANCE;
  const rotate  = direction === "right" ? MAX_ROTATE   : -MAX_ROTATE;

  topCard.style.transition = "transform 0.38s cubic-bezier(0.25,0.8,0.5,1), opacity 0.38s ease";
  topCard.style.transform  = `translateX(${dx}px) rotate(${rotate}deg)`;
  topCard.style.opacity    = "0";

  backCard.style.transition= "transform 0.38s ease";
  backCard.style.transform = "scale(1) translateY(0)";

  setTimeout(() => {
    topCard.style.opacity = "";
    const mode = MODES[deckIdx % MODES.length];
    deckIdx++;

    if (direction === "right") {
      launchMode(mode.id);
    } else {
      renderDeck();
    }
  }, 380);
}

/* ── Snap back if threshold not met ── */
function snapBack() {
  topCard.style.transition  = "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)";
  topCard.style.transform   = "";
  backCard.style.transition = "transform 0.35s ease";
  backCard.style.transform  = "scale(0.92) translateY(10px)";
  stampPlay.style.opacity   = "0";
  stampSkip.style.opacity   = "0";
}

/* ── Launch the chosen mode ── */
function launchMode(id) {
  if (id === "sl") showScreen("start");
  else             startReactionTest();
}

/* ── Pointer events (mouse + touch) ── */
topCard.addEventListener("pointerdown", (e) => {
  dragging      = true;
  dragStartX    = e.clientX;
  dragCurrentX  = 0;
  pointerDownId = e.pointerId;
  topCard.setPointerCapture(e.pointerId);
  topCard.style.transition = "";
});

topCard.addEventListener("pointermove", (e) => {
  if (!dragging || e.pointerId !== pointerDownId) return;
  dragCurrentX = e.clientX - dragStartX;
  setDragTransform(dragCurrentX);
});

topCard.addEventListener("pointerup", (e) => {
  if (!dragging || e.pointerId !== pointerDownId) return;
  dragging = false;
  if      (dragCurrentX >  SWIPE_THRESHOLD) flyOff("right");
  else if (dragCurrentX < -SWIPE_THRESHOLD) flyOff("left");
  else                                       snapBack();
});

topCard.addEventListener("pointercancel", () => {
  dragging = false;
  snapBack();
});

/* ── Button clicks ── */
document.getElementById("btn-like").addEventListener("click", () => {
  setDragTransform(SWIPE_THRESHOLD + 10);
  setTimeout(() => flyOff("right"), 50);
});

document.getElementById("btn-nope").addEventListener("click", () => {
  setDragTransform(-(SWIPE_THRESHOLD + 10));
  setTimeout(() => flyOff("left"), 50);
});

/* ── Arrow keys on home screen ── */
document.addEventListener("keydown", (e) => {
  if (!document.getElementById("screen-home").classList.contains("hidden")) {
    if (e.key === "ArrowRight") {
      setDragTransform(SWIPE_THRESHOLD + 10);
      setTimeout(() => flyOff("right"), 50);
    } else if (e.key === "ArrowLeft") {
      setDragTransform(-(SWIPE_THRESHOLD + 10));
      setTimeout(() => flyOff("left"), 50);
    }
  }
});

/* Initialise the deck */
renderDeck();

/* ═══════════════════════════════════════════════════════
   SL CHALLENGE
═══════════════════════════════════════════════════════ */
let score       = 0;
let level       = 1;
let realCurrent = "";
let alive       = false;
let timeLeft    = 30;
let timerInterval = null;
let changeTimeout = null;

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
  stopTimer();
  stopIdleTimer();
  alive = false;
  deckIdx = 0;
  renderDeck();
  showScreen("home");
}

function updateHud() {
  hudScore.textContent = `Score: ${score}`;
  hudLevel.textContent = `Level ${level}`;
  hudTime .textContent = `⏱ ${timeLeft}s`;
  timerBar.style.width = `${(timeLeft / 30) * 100}%`;
  if      (timeLeft > 15) timerBar.style.background = "linear-gradient(90deg,#22c55e,#84cc16)";
  else if (timeLeft > 8)  timerBar.style.background = "linear-gradient(90deg,#f59e0b,#f97316)";
  else                    timerBar.style.background = "linear-gradient(90deg,#ef4444,#dc2626)";
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 30;
  updateHud();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateHud();
    if (timeLeft <= 0) { timeLeft = 0; gameOver("time"); }
  }, 1000);
}

function stopTimer()    { clearInterval(timerInterval); }

const LEVEL_SPEED = { 1:5000, 2:4000, 3:3000, 4:2000, 5:1500 };
function levelSpeed() { return LEVEL_SPEED[level] ?? 1500; }

function startIdleTimer() {
  clearTimeout(changeTimeout);
  changeTimeout = setTimeout(() => {
    if (alive) { nextRound(); startIdleTimer(); }
  }, levelSpeed());
}

function stopIdleTimer() { clearTimeout(changeTimeout); }

function randomLetters() {
  const letters = ["S","L"];
  const count   = Math.random() < .5 ? 1 : 2;
  let   result  = "";
  for (let i = 0; i < count; i++) result += letters[Math.floor(Math.random()*2)];
  return result;
}

const CORRECT_KEY = { S:"s", L:"l", SS:"l", LL:"s", SL:" ", LS:" " };
function correctKey(seq) { return CORRECT_KEY[seq]; }

function nextRound() {
  realCurrent          = randomLetters();
  letterEl.textContent = realCurrent;
  letterEl.className   = "letter-tile";
}

function flashTile(cls) {
  letterEl.classList.add(cls);
  setTimeout(() => letterEl.classList.remove(cls), 260);
}

function startGame() {
  score = 0; level = 1; alive = true;
  showScreen("game");
  letterEl.textContent = "GO!";
  letterEl.className   = "letter-tile";
  updateHud();
  startTimer();
  setTimeout(() => { nextRound(); startIdleTimer(); }, 600);
}

function gameOver(reason = "wrong") {
  alive = false;
  stopTimer();
  stopIdleTimer();
  if (reason === "win") {
    winScoreVal.textContent = score;
    showScreen("win");
  } else {
    endScoreVal.textContent = score;
    endTitle.className      = reason === "time" ? "end-title time" : "end-title lose";
    endTitle.textContent    = reason === "time" ? "Time's Up!" : "Good Try!";
    showScreen("end");
  }
}

const LEVEL_AT = { 10:2, 20:3, 30:4, 40:5 };
const WIN_SCORE = 50;

document.addEventListener("keydown", (e) => {
  if (e.key === " ") e.preventDefault();

  const startVisible = !document.getElementById("screen-start").classList.contains("hidden");
  if (!alive && startVisible) {
    if (e.key === " ") startGame();
    return;
  }

  const endVisible =
    !document.getElementById("screen-end").classList.contains("hidden") ||
    !document.getElementById("screen-win").classList.contains("hidden");
  if (!alive && endVisible) {
    if (e.key === " ") goHome();
    return;
  }

  if (!alive) return;
  if (document.getElementById("screen-game").classList.contains("hidden")) return;
  if (!["s","l"," "].includes(e.key)) return;

  letterEl.classList.add("pressed");
  setTimeout(() => letterEl.classList.remove("pressed"), 120);

  if (e.key === correctKey(realCurrent)) {
    score++;
    flashTile("correct");
    if (score >= WIN_SCORE) { gameOver("win"); return; }
    if (LEVEL_AT[score]) {
      level = LEVEL_AT[score];
      letterEl.textContent = `LEVEL ${level}!`;
      letterEl.className   = "letter-tile";
      updateHud();
      stopIdleTimer();
      setTimeout(() => { startTimer(); nextRound(); startIdleTimer(); }, 700);
      return;
    }
    updateHud();
    nextRound();
    startIdleTimer();
  } else {
    flashTile("wrong");
    setTimeout(() => gameOver("wrong"), 280);
  }
});

/* ═══════════════════════════════════════════════════════
   REACTION TEST
═══════════════════════════════════════════════════════ */
const RT_ROUNDS   = 5;
const RT_MIN_WAIT = 1800;
const RT_MAX_WAIT = 4500;

let rtRound      = 0;
let rtTimes      = [];
let rtGoTime     = null;
let rtWaiting    = false;
let rtActive     = false;
let rtDelayTimer = null;

const rtTile      = document.getElementById("rt-tile");
const rtTileText  = document.getElementById("rt-tile-text");
const rtTileLabel = document.getElementById("rt-tile-label");
const rtRoundLbl  = document.getElementById("rt-round-label");
const rtLog       = document.getElementById("rt-log");
const rtSub       = document.getElementById("rt-sub");

document.getElementById("btn-rt-quit") .addEventListener("click", () => { rtReset(); goHome(); });
document.getElementById("btn-rt-again").addEventListener("click", startReactionTest);
document.getElementById("btn-rt-home") .addEventListener("click", goHome);

function rtReset() {
  clearTimeout(rtDelayTimer);
  rtWaiting = false;
  rtActive  = false;
  rtGoTime  = null;
}

function startReactionTest() {
  rtRound = 0;
  rtTimes = [];
  rtLog.innerHTML = "";
  showScreen("rt");
  rtNextRound();
}

function rtNextRound() {
  rtRound++;
  rtRoundLbl.textContent = `Round ${rtRound} / ${RT_ROUNDS}`;
  rtSub.textContent = "Press SPACE when the tile turns green";
  rtSetState("waiting", "⏳", "Get ready…");
  rtWaiting = true;
  rtActive  = false;
  rtGoTime  = null;

  const delay = RT_MIN_WAIT + Math.random() * (RT_MAX_WAIT - RT_MIN_WAIT);
  rtDelayTimer = setTimeout(() => {
    rtSetState("ready", "👀", "Almost…");
    rtDelayTimer = setTimeout(() => {
      rtWaiting = false;
      rtActive  = true;
      rtGoTime  = performance.now();
      rtSetState("go", "GO!", "Press SPACE now!");
    }, 400 + Math.random() * 300);
  }, delay - 500);
}

function rtSetState(state, emoji, label) {
  rtTile.className        = `rt-tile ${state}`;
  rtTileText.textContent  = emoji;
  rtTileLabel.textContent = label;
}

function rtHandleKey() {
  if (document.getElementById("screen-rt").classList.contains("hidden")) return;

  if (rtWaiting) {
    clearTimeout(rtDelayTimer);
    rtWaiting = false;
    rtActive  = false;
    rtSetState("early", "⚠️", "Too early!");
    rtSub.textContent = "Wait for green before pressing!";
    rtTimes.push("early");
    addLogRow(rtRound, "early");
    if (rtRound >= RT_ROUNDS) setTimeout(rtShowResults, 900);
    else                      setTimeout(rtNextRound, 1100);
    return;
  }

  if (rtActive) {
    const elapsed = Math.round(performance.now() - rtGoTime);
    rtActive = false;
    rtTimes.push(elapsed);
    const speed = elapsed < 230 ? "fast" : elapsed < 380 ? "medium" : "slow";
    rtSetState("done", "✓", `${elapsed} ms`);
    rtTileText.style.fontSize = "36px";
    rtTile.querySelector("span:first-child").style.color =
      speed === "fast" ? "#22c55e" : speed === "medium" ? "#f59e0b" : "#f87171";
    addLogRow(rtRound, elapsed, speed);
    if (rtRound >= RT_ROUNDS) {
      setTimeout(rtShowResults, 900);
    } else {
      setTimeout(() => {
        rtTileText.style.fontSize = "";
        rtTile.querySelector("span:first-child").style.color = "";
        rtNextRound();
      }, 900);
    }
  }
}

function addLogRow(round, ms, speed) {
  const row = document.createElement("div");
  row.className = "rt-log-row";
  const msClass = ms === "early" ? "early" : speed;
  const msText  = ms === "early" ? "⚠ Too early" : `${ms} ms`;
  row.innerHTML = `<span class="round-num">Round ${round}</span><span class="round-ms ${msClass}">${msText}</span>`;
  rtLog.appendChild(row);
}

function rtShowResults() {
  const validTimes = rtTimes.filter(t => typeof t === "number");
  const earlyCount = rtTimes.filter(t => t === "early").length;
  const avg  = validTimes.length ? Math.round(validTimes.reduce((a,b)=>a+b,0)/validTimes.length) : null;
  const best = validTimes.length ? Math.min(...validTimes) : null;

  const summary = document.getElementById("rt-summary");
  summary.innerHTML = "";

  rtTimes.forEach((t,i) => {
    const row = document.createElement("div");
    row.className = "rt-summary-row";
    const isEarly = t === "early";
    const speed = !isEarly ? (t < 230 ? "fast" : t < 380 ? "medium" : "") : "";
    row.innerHTML = `<span class="label">Round ${i+1}</span><span class="value ${isEarly?"":speed}">${isEarly?"⚠ Too early":`${t} ms`}</span>`;
    summary.appendChild(row);
  });

  if (avg !== null) {
    const r = document.createElement("div");
    r.className = "rt-summary-row";
    r.innerHTML = `<span class="label" style="font-weight:700;color:#cbd5e1">Average</span><span class="value ${avg<230?"fast":avg<380?"medium":""}">${avg} ms</span>`;
    summary.appendChild(r);
  }
  if (best !== null) {
    const r = document.createElement("div");
    r.className = "rt-summary-row";
    r.innerHTML = `<span class="label" style="font-weight:700;color:#cbd5e1">Best</span><span class="value best">${best} ms</span>`;
    summary.appendChild(r);
  }

  const ratingEl = document.getElementById("rt-rating");
  if      (avg === null)   { ratingEl.textContent = "😬 All early — try waiting!";           ratingEl.style.color = "#f97316"; }
  else if (earlyCount > 0) { ratingEl.textContent = `${earlyCount} early press${earlyCount>1?"es":""} — patience counts 😅`; ratingEl.style.color = "#f59e0b"; }
  else if (avg < 200)      { ratingEl.textContent = "🚀 Superhuman! Are you a robot?";       ratingEl.style.color = "#22c55e"; }
  else if (avg < 250)      { ratingEl.textContent = "⚡ Elite reflexes!";                    ratingEl.style.color = "#4ade80"; }
  else if (avg < 300)      { ratingEl.textContent = "🎯 Above average — nice!";              ratingEl.style.color = "#86efac"; }
  else if (avg < 380)      { ratingEl.textContent = "👍 Average human range";                ratingEl.style.color = "#f59e0b"; }
  else                     { ratingEl.textContent = "🐢 Keep practicing!";                   ratingEl.style.color = "#f87171"; }

  showScreen("rt-end");
}

document.addEventListener("keydown", (e) => {
  if (e.key !== " ") return;
  if (!document.getElementById("screen-rt").classList.contains("hidden"))     rtHandleKey();
  if (!document.getElementById("screen-rt-end").classList.contains("hidden")) startReactionTest();
});
