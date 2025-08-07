
let timer;
let timeLeft = 300;

function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert("Time's up!");
        } else {
            timeLeft--;
            updateTimerDisplay();
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timer);
    timeLeft = 300;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

updateTimerDisplay();

let currentWorkoutIndex = 0;
let timerInterval = null;
let remainingTime = 60;
let isPaused = false;
let beepAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

function startWorkout(workoutElement) {
  if (timerInterval) return; // prevent restarting mid-count

  const workouts = document.querySelectorAll('.workout');
  currentWorkoutIndex = Array.from(workouts).indexOf(workoutElement);

  const timerDisplay = workoutElement.querySelector('.timer-display');
  const progress = workoutElement.querySelector('.progress');
  const pauseBtn = workoutElement.querySelector('.pause-resume');

  remainingTime = 60;
  isPaused = false;

  pauseBtn.style.display = 'inline-block';
  pauseBtn.textContent = 'Pause';
  pauseBtn.onclick = () => togglePauseResume(timerDisplay, progress, pauseBtn);

  timerDisplay.textContent = formatTime(remainingTime);
  updateProgress(progress);

  timerInterval = setInterval(() => {
    if (!isPaused) {
      remainingTime--;
      timerDisplay.textContent = formatTime(remainingTime);
      updateProgress(progress);

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        beepAudio.play();
        timerInterval = null;
        autoAdvance();
      }
    }
  }, 1000);
}

function togglePauseResume(timerDisplay, progress, pauseBtn) {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

function autoAdvance() {
  const workouts = document.querySelectorAll('.workout');
  if (currentWorkoutIndex + 1 < workouts.length) {
    startWorkout(workouts[currentWorkoutIndex + 1]);
  }
}

function updateProgress(progressEl) {
  const percent = ((60 - remainingTime) / 60) * 100;
  progressEl.style.width = `${percent}%`;
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}
function startWorkout(el) {
  if (timerInterval) return;

  activeWorkout = el;
  remainingTime = 60;
  isPaused = false;

  // Reset all buttons
  document.querySelectorAll('.pause-resume').forEach(btn => btn.style.display = 'none');
  document.querySelectorAll('.skip-button').forEach(btn => btn.style.display = 'none');

  const timer = el.querySelector('.timer-display');
  const progress = el.querySelector('.progress');
  const pauseBtn = el.querySelector('.pause-resume');
  const skipBtn = el.querySelector('.skip-button');

  timer.textContent = formatTime(remainingTime);
  progress.style.width = '0%';

  pauseBtn.style.display = 'inline-block';
  pauseBtn.textContent = 'Pause';
  pauseBtn.onclick = () => togglePause(timer, progress, pauseBtn);

  skipBtn.style.display = 'inline-block';
  skipBtn.onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    autoAdvance();
  };

  timerInterval = setInterval(() => {
    if (!isPaused) {
      remainingTime--;
      timer.textContent = formatTime(remainingTime);
      updateProgress(progress);

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        beep.play();
        timerInterval = null;
        autoAdvance();
      }
    }
  }, 1000);
}
