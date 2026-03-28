/* ─── State ────────────────────────────────────────────── */
let score       = 0;
let level       = 1;
let realCurrent = "";
let alive       = false;
let timeLeft    = 30;

let timerInterval = null;
let changeTimeout = null;

/* ─── DOM ──────────────────────────────────────────────── */
const screens = {
  start : document.getElementById("screen-start"),
  game  : document.getElementById("screen-game"),
  end   : document.getElementById("screen-end"),
  win   : document.getElementById("screen-win"),
};

const letterEl    = document.getElementById("letter");
const hudScore    = document.getElementById("hud-score");
const hudLevel    = document.getElementById("hud-level");
const hudTime     = document.getElementById("hud-time");
const timerBar    = document.getElementById("timer-bar");
const keyHint     = document.getElementById("key-hint");
const endTitle    = document.getElementById("end-title");
const endScoreVal = document.getElementById("end-score-val");
const winScoreVal = document.getElementById("win-score-val");

document.getElementById("btn-restart")    .addEventListener("click", startGame);
document.getElementById("btn-restart-win").addEventListener("click", startGame);

/* ─── Screen helper ────────────────────────────────────── */
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("hidden", key !== name);
  });
}

/* ─── HUD update ───────────────────────────────────────── */
function updateHud() {
  hudScore.textContent = `Score: ${score}`;
  hudLevel.textContent = `Level ${level}`;
  hudTime .textContent = `⏱ ${timeLeft}s`;

  // Timer bar width
  timerBar.style.width = `${(timeLeft / 30) * 100}%`;
  // Colour shift: green → amber → red
  if      (timeLeft > 15) timerBar.style.background = "linear-gradient(90deg,#22c55e,#84cc16)";
  else if (timeLeft > 8)  timerBar.style.background = "linear-gradient(90deg,#f59e0b,#f97316)";
  else                    timerBar.style.background = "linear-gradient(90deg,#ef4444,#dc2626)";
}

/* ─── Key hint text ────────────────────────────────────── */
const HINT_LABELS = {
  S : "press  S",
  L : "press  L",
  SS: "press  L  (opposite)",
  LL: "press  S  (opposite)",
  SL: "press  SPACE",
  LS: "press  SPACE",
};

function updateHint(seq) {
  keyHint.textContent = ""; // hidden until correct — shows after a small delay for challenge
}

/* ─── Timer ────────────────────────────────────────────── */
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

/* ─── Level speed ──────────────────────────────────────── */
const LEVEL_SPEED = { 1: 5000, 2: 4000, 3: 3000, 4: 2000, 5: 1500 };

function levelSpeed() { return LEVEL_SPEED[level] ?? 1500; }

/* ─── Idle change ──────────────────────────────────────── */
function startIdleTimer() {
  clearTimeout(changeTimeout);
  changeTimeout = setTimeout(() => {
    if (alive) { nextRound(); startIdleTimer(); }
  }, levelSpeed());
}

function stopIdleTimer() { clearTimeout(changeTimeout); }

/* ─── Letter generation ────────────────────────────────── */
function randomLetters() {
  const letters = ["S", "L"];
  const count   = Math.random() < 0.5 ? 1 : 2;
  let   result  = "";
  for (let i = 0; i < count; i++)
    result += letters[Math.floor(Math.random() * 2)];
  return result;
}

/* ─── Correct key map ──────────────────────────────────── */
const CORRECT_KEY = { S: "s", L: "l", SS: "l", LL: "s", SL: " ", LS: " " };

function correctKey(seq) { return CORRECT_KEY[seq]; }

/* ─── Next round ───────────────────────────────────────── */
function nextRound() {
  realCurrent           = randomLetters();
  letterEl.textContent  = realCurrent;
  letterEl.className    = "letter-tile";  // reset colour
  updateHint(realCurrent);
}

/* ─── Feedback flash ───────────────────────────────────── */
function flashTile(cls) {
  letterEl.classList.add(cls);
  setTimeout(() => letterEl.classList.remove(cls), 260);
}

/* ─── Start game ───────────────────────────────────────── */
function startGame() {
  score = 0;
  level = 1;
  alive = true;

  showScreen("game");

  letterEl.textContent = "GO!";
  letterEl.className   = "letter-tile";
  keyHint .textContent = "";
  updateHud();
  startTimer();

  setTimeout(() => {
    nextRound();
    startIdleTimer();
  }, 600);
}

/* ─── Game over ────────────────────────────────────────── */
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

/* ─── Level thresholds ─────────────────────────────────── */
const LEVEL_AT = { 10: 2, 20: 3, 30: 4, 40: 5 };
const WIN_SCORE = 50;

/* ─── Key input ────────────────────────────────────────── */
document.addEventListener("keydown", (e) => {

  // Prevent page scroll on space
  if (e.key === " ") e.preventDefault();

  if (!alive) {
    const onEndScreen = !screens.end.classList.contains("hidden") ||
                        !screens.win.classList.contains("hidden") ||
                        !screens.start.classList.contains("hidden");
    if (e.key === " " && onEndScreen) startGame();
    return;
  }

  if (!["s", "l", " "].includes(e.key)) return;

  // Press animation
  letterEl.classList.add("pressed");
  setTimeout(() => letterEl.classList.remove("pressed"), 120);

  if (e.key === correctKey(realCurrent)) {
    score++;
    flashTile("correct");

    // Win condition
    if (score >= WIN_SCORE) { gameOver("win"); return; }

    // Level up
    if (LEVEL_AT[score]) {
      level = LEVEL_AT[score];
      letterEl.textContent = `LEVEL ${level}!`;
      letterEl.className   = "letter-tile";
      updateHud();

      stopIdleTimer();
      setTimeout(() => {
        startTimer();
        nextRound();
        startIdleTimer();
      }, 700);
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
