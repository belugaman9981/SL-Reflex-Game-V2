
let score         = 0;
let level         = 1;
let current       = "";
let realCurrent   = "";
let alive         = false;

/* ⏱️ TIMER */

let timeLeft      = 30;
let timerInterval = null;

/* ⏳ IDLE CHANGE TIMER */

let changeTimeout = null;

const letterDiv   = document.getElementById("letter");
const scoreDiv    = document.getElementById("score");

function updateScoreBar() {
  scoreDiv.textContent = `Score: ${score} | Level: ${level} | Time: ${timeLeft}`;
}

/* ⏱️ MAIN GAME TIMER */

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 30;
  updateScoreBar();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateScoreBar();

    if (timeLeft <= 0) {
      timeLeft = 0;
      gameOver(true);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

/* 🎚️ LEVEL SPEED */

function levelSpeed() {
  switch (level) {
    case 1: return 5000;
    case 2: return 4000;
    case 3: return 3000;
    case 4: return 2000;
    case 5: return 1000;
  }
}

/* ⏳ IDLE LETTER CHANGE */

function startIdleTimer() {
  clearTimeout(changeTimeout);

  changeTimeout = setTimeout(() => {
    if (alive) {
      nextRound();
      startIdleTimer();
    }
  }, levelSpeed());
}

function stopIdleTimer() {
  clearTimeout(changeTimeout);
}

/* 🎲 LETTER GENERATION */

function randomLetters() {
  const letters = ["S", "L"];
  const count   = Math.random() < 0.5 ? 1 : 2;

  let result = "";
  for (let i = 0; i < count; i++) {
    result += letters[Math.floor(Math.random() * 2)];
  }
  return result;
}

/* 🎯 CORRECT KEY */

function correctKey(seq) {
  switch (seq) {
    case "S":  return "s";
    case "L":  return "l";
    case "SS": return "l";
    case "LL": return "s";
    case "SL": return " ";
    case "LS": return " ";
  }
}

/* 🔄 NEXT ROUND */

function nextRound() {
  realCurrent           = randomLetters();
  current               = realCurrent;
  letterDiv.textContent = current;
}

/* 🚀 START GAME */

function startGame() {
  score = 0;
  level = 1;
  alive = true;

  letterDiv.textContent = "GO";

  startTimer();

  setTimeout(() => {
    nextRound();
    startIdleTimer();
  }, 500);
}

/* 💀 GAME OVER */

function gameOver(timeUp = false) {
  alive = false;

  stopTimer();
  stopIdleTimer();

  letterDiv.textContent = timeUp ? "Time's up!" : "Good try";
  scoreDiv.textContent  = timeUp
    ? `Time's up! Final score: ${score}`
    : `Game Over! Final score: ${score}`;
}

/* ⌨️ INPUT */

document.addEventListener("keydown", (e) => {

  if (!alive) {
    if (e.key === " ") startGame();
    return;
  }

  if (!["s", "l", " "].includes(e.key)) return;

  if (e.key === correctKey(realCurrent)) {

    score++ ;

    let leveledUp = false;

    if (score === 10) { level = 2; leveledUp = true; }
    if (score === 20) { level = 3; leveledUp = true; }
    if (score === 30) { level = 4; leveledUp = true; }
    if (score === 40) { level = 5; leveledUp = true; }
    if (score === 50) { alert("YOU WIN, CONGRATS!"); } 

    if (leveledUp) {

      letterDiv.textContent = `LEVEL ${level}!`;
      updateScoreBar();

      setTimeout(() => {
        startTimer    ();
        nextRound     ();
        startIdleTimer();
      }, 500);

      return;
    }

    nextRound();
    updateScoreBar();
    startIdleTimer();

  } else {
    gameOver();
  }
  
});

