
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
