let activeWorkout = null;
let timerInterval = null;
let countdownInterval = null;
let remainingTime = 60;
let isPaused = false;

const beep = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
const startSound = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
const endSound = new Audio('https://actions.google.com/sounds/v1/human_voices/cheerful_fanfare.ogg');

const motivationalMessages = [
  "You've got this!",
  "Push your limits!",
  "One step closer to your goals.",
  "Stay strong, finish strong!",
  "Breathe and keep going.",
  "Feel the energy!"
];

function getAllWorkouts() {
  return Array.from(document.querySelectorAll('.workout'));
}

function showMotivation() {
  const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  alert(msg);
}

function showCountdown(timer, callback) {
  let count = 5;
  timer.textContent = `Starting in: ${count}`;
  countdownInterval = setInterval(() => {
    count--;
    beep.play();
    timer.textContent = count > 0 ? `Starting in: ${count}` : 'GO!';
    if (count <= 0) {
      clearInterval(countdownInterval);
      startSound.play();
      setTimeout(callback, 1000);
    }
  }, 1000);
}

function startWorkout(el) {
  if (timerInterval) clearInterval(timerInterval);
  if (countdownInterval) clearInterval(countdownInterval);

  const all = getAllWorkouts();
  const i = all.indexOf(el);
  if (i === -1) return;

  activeWorkout = el;
  remainingTime = 60;
  isPaused = false;

  const timer = el.querySelector('.timer-display');
  const progress = el.querySelector('.progress');
  const pauseBtn = el.querySelector('.pause-resume:not(.skip-next):not(.prev-workout)');
  const skipBtn = el.querySelector('.pause-resume.skip-next');
  const prevBtn = el.querySelector('.pause-resume.prev-workout');

  all.forEach(w => {
    if (w !== el) w.querySelectorAll('.pause-resume').forEach(b => b.style.display = 'none');
  });

  showMotivation();
  showCountdown(timer, () => {
    timer.textContent = formatTime(remainingTime);
    updateProgress(progress);

    pauseBtn.style.display = 'inline-block';
    pauseBtn.textContent = 'Pause';
    pauseBtn.onclick = () => togglePause(pauseBtn);

    if (prevBtn) {
      prevBtn.style.display = i === 0 ? 'none' : 'inline-block';
      prevBtn.textContent = 'Previous';
      prevBtn.onclick = (ev) => {
        ev.stopPropagation();
        startWorkout(all[i - 1]);
      };
    }

    if (skipBtn) {
      skipBtn.style.display = i + 1 < all.length ? 'inline-block' : 'none';
      skipBtn.textContent = 'Go to Next';
      skipBtn.onclick = (ev) => {
        ev.stopPropagation();
        clearInterval(timerInterval);
        startWorkout(all[i + 1]);
      };
    }

    timerInterval = setInterval(() => {
      if (!isPaused) {
        remainingTime--;
        timer.textContent = formatTime(remainingTime);
        updateProgress(progress);

        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          endSound.play();
          if (i + 1 < all.length) {
            startWorkout(all[i + 1]);
          }
        }
      }
    }, 1000);
  });
}

function togglePause(pauseBtn) {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

function updateProgress(bar) {
  bar.style.width = `${((60 - remainingTime) / 60) * 100}%`;
}

function formatTime(s) {
  return `00:${String(s).padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  getAllWorkouts().forEach(el => {
    el.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('pause-resume')) return;
      startWorkout(el);
    });
  });

  document.querySelector('.master-reset').onclick = () => {
    if (timerInterval) clearInterval(timerInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    getAllWorkouts().forEach(w => {
      w.querySelector('.timer-display').textContent = '01:00';
      w.querySelector('.progress').style.width = '0%';
      w.querySelectorAll('.pause-resume').forEach(btn => btn.style.display = 'none');
    });
    document.querySelectorAll('.check-cell').forEach(cell => {
      cell.textContent = '';
      cell.classList.remove('checked');
    });
    activeWorkout = null;
    isPaused = false;
  };
});
