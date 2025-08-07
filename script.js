let timerInterval = null;
let remainingTime = 60;
let isPaused = false;
let beepAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
let activeWorkout = null;

// Helper: get all workout elements in DOM order
function getAllWorkouts() {
  return Array.from(document.querySelectorAll('.workout'));
}

// Helper: check if the workoutElement is the last morning workout in its day
function isLastMorningWorkout(workoutElement) {
  const dayDiv = workoutElement.closest('.day');
  const morningHeader = dayDiv ? dayDiv.querySelector('h3') : null;
  if (!morningHeader || !/Morning/i.test(morningHeader.textContent)) return false;
  const morningList = morningHeader.nextElementSibling;
  if (!morningList || morningList.tagName !== 'UL') return false;
  const morningWorkouts = Array.from(morningList.querySelectorAll('.workout'));
  return morningWorkouts.length && workoutElement === morningWorkouts[morningWorkouts.length - 1];
}

// Auto-advance logic: only transition if not the last morning workout
function autoAdvance(workoutElement) {
  if (isLastMorningWorkout(workoutElement)) {
    alert('The morning session is complete!');
    return; // Do not move to evening
  }
  const allWorkouts = getAllWorkouts();
  const i = allWorkouts.indexOf(workoutElement);
  if (i + 1 < allWorkouts.length) {
    startWorkout(allWorkouts[i + 1]);
  } else {
    // End of all workouts for the day
    // Optionally handle this case if needed
  }
}

// Start a workout (with timer, pause, skip, progress)
function startWorkout(workoutElement) {
  if (timerInterval) return;

  activeWorkout = workoutElement;
  remainingTime = 60;
  isPaused = false;

  // Hide all pause/skip buttons, then show for current workout
  document.querySelectorAll('.pause-resume').forEach(btn => btn.style.display = 'none');
  document.querySelectorAll('.skip-button').forEach(btn => btn.style.display = 'none');

  const timerDisplay = workoutElement.querySelector('.timer-display');
  const progress = workoutElement.querySelector('.progress');
  const pauseBtn = workoutElement.querySelector('.pause-resume');
  const skipBtn = workoutElement.querySelector('.skip-button');

  timerDisplay.textContent = formatTime(remainingTime);
  progress.style.width = '0%';

  pauseBtn.style.display = 'inline-block';
  pauseBtn.textContent = 'Pause';
  pauseBtn.onclick = () => togglePauseResume(timerDisplay, progress, pauseBtn);

  skipBtn.style.display = 'inline-block';
  skipBtn.onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    autoAdvance(workoutElement);
  };

  timerInterval = setInterval(() => {
    if (!isPaused) {
      remainingTime--;
      timerDisplay.textContent = formatTime(remainingTime);
      updateProgress(progress);

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        beepAudio.play();
        timerInterval = null;
        autoAdvance(workoutElement);
      }
    }
  }, 1000);
}

// Pause/resume toggle
function togglePauseResume(timerDisplay, progress, pauseBtn) {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

// Progress bar update
function updateProgress(progressEl) {
  const percent = ((60 - remainingTime) / 60) * 100;
  progressEl.style.width = `${percent}%`;
}

// Time formatting (mm:ss)
function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}
