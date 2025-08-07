// script.js - all app logic: timers, countdown, motivation, sounds, tracker, dark mode, SW reg

let activeWorkout = null;
let timerInterval = null;
let countdownInterval = null;
let remainingTime = 60;
let isPaused = false;

// Audio (hosted, royalty-free from google actions)
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

// ----------------- Helpers -----------------
function getAllWorkouts() {
  return Array.from(document.querySelectorAll('.workout'));
}

function formatTime(s) {
  return `00:${String(s).padStart(2, '0')}`;
}

function updateProgress(bar) {
  if (!bar) return;
  bar.style.width = `${((60 - remainingTime) / 60) * 100}%`;
}

// ----------------- Persistence -----------------
function saveCheckCellData() {
  const cells = Array.from(document.querySelectorAll('.check-cell'));
  const data = cells.map(cell => cell.textContent === '\u2713');
  localStorage.setItem('checkCellData', JSON.stringify(data));
}
function loadCheckCellData() {
  const raw = localStorage.getItem('checkCellData');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const cells = Array.from(document.querySelectorAll('.check-cell'));
    cells.forEach((cell, i) => {
      if (data[i]) {
        cell.textContent = '\u2713';
        cell.classList.add('checked');
      } else {
        cell.textContent = '';
        cell.classList.remove('checked');
      }
    });
  } catch (e) { /* ignore parse errors */ }
}

function saveDarkMode(isDark) {
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}
function loadDarkMode() {
  return localStorage.getItem('darkMode') === 'true';
}

// Save/restore workout progress (index + remaining + paused)
function saveWorkoutProgress(index, remaining, paused) {
  localStorage.setItem('workoutProgress', JSON.stringify({
    index, remaining, paused, timestamp: Date.now()
  }));
}
function loadWorkoutProgress() {
  const raw = localStorage.getItem('workoutProgress');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch(e) { return null; }
}
function clearWorkoutProgress() {
  localStorage.removeItem('workoutProgress');
}

// ----------------- UI Bits -----------------
function showMotivation() {
  // Non-blocking: use confirm-like? keep alert since user asked for messages
  const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  try { alert(msg); } catch (e) { /* ignore in case blocked */ }
}

function showCountdown(timerElement, onDone) {
  if (!timerElement) { onDone(); return; }
  let count = 5;
  timerElement.textContent = `Starting in: ${count}`;
  // Ensure beep plays only after user interaction (we start countdown on click)
  countdownInterval = setInterval(() => {
    count--;
    try { beep.currentTime = 0; beep.play().catch(()=>{}); } catch(e){/*ignore*/ }
    timerElement.textContent = count > 0 ? `Starting in: ${count}` : 'GO!';
    if (count <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      try { startSound.currentTime = 0; startSound.play().catch(()=>{}); } catch(e){/*ignore*/ }
      setTimeout(onDone, 800); // small buffer so "GO!" shows briefly
    }
  }, 1000);
}

// ----------------- Core Timer -----------------
function startWorkout(el, restore = false) {
  // clear any running
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

  const all = getAllWorkouts();
  const i = all.indexOf(el);
  if (i === -1) return;

  activeWorkout = el;
  remainingTime = restore && loadWorkoutProgress()?.remaining ? loadWorkoutProgress().remaining : 60;
  isPaused = restore && loadWorkoutProgress()?.paused ? loadWorkoutProgress().paused : false;

  const timerEl = el.querySelector('.timer-display');
  const progress = el.querySelector('.progress');
  const pauseBtn = el.querySelector('.pause-resume:not(.skip-next):not(.prev-workout)');
  const skipBtn = el.querySelector('.pause-resume.skip-next');
  const prevBtn = el.querySelector('.pause-resume.prev-workout');

  // hide controls on other workouts
  all.forEach(w => {
    if (w !== el) {
      w.querySelectorAll('.pause-resume').forEach(b => b.style.display = 'none');
    }
  });

  // show motivation and countdown before actual timer
  showMotivation();
  showCountdown(timerEl, () => {
    // show main UI controls
    timerEl.textContent = formatTime(remainingTime);
    updateProgress(progress);

    if (pauseBtn) {
      pauseBtn.style.display = 'inline-block';
      pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
      pauseBtn.onclick = (ev) => {
        ev.stopPropagation();
        togglePause(pauseBtn);
        // save state
        saveWorkoutProgress(i, remainingTime, isPaused);
      };
    }

    if (prevBtn) {
      prevBtn.style.display = i === 0 ? 'none' : 'inline-block';
      prevBtn.textContent = 'Previous';
      prevBtn.onclick = (ev) => {
        ev.stopPropagation();
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        clearWorkoutProgress();
        startWorkout(all[i - 1]);
      };
    }

    if (skipBtn) {
      skipBtn.style.display = i + 1 < all.length ? 'inline-block' : 'none';
      skipBtn.textContent = 'Go to Next';
      skipBtn.onclick = (ev) => {
        ev.stopPropagation();
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        clearWorkoutProgress();
        if (i + 1 < all.length) startWorkout(all[i + 1]);
      };
    }

    // start interval
    timerInterval = setInterval(() => {
      if (!isPaused) {
        remainingTime--;
        timerEl.textContent = formatTime(remainingTime);
        updateProgress(progress);
        saveWorkoutProgress(i, remainingTime, isPaused);

        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          try { endSound.currentTime = 0; endSound.play().catch(()=>{}); } catch(e){/*ignore*/}

          // mark complete badge
          markCompleted(el);

          // session/day logic
          if (isLastWorkoutOfSession(el, 'morning')) {
            try { alert("Congrats! Morning workout finished, see you this evening."); } catch(e){}
            cleanupAfterFinish(pauseBtn, skipBtn, prevBtn, timerEl, progress);
            clearWorkoutProgress();
            return;
          }

          if (isLastWorkoutOfDay(el)) {
            try { alert("🎉 You completed all workouts today! Great work — see you tomorrow!"); } catch(e){}
            cleanupAfterFinish(pauseBtn, skipBtn, prevBtn, timerEl, progress);
            clearWorkoutProgress();
            return;
          }

          // go to next
          if (i + 1 < all.length) startWorkout(all[i + 1]);
        }
      }
    }, 1000);
  });
}

function togglePause(pauseBtn) {
  isPaused = !isPaused;
  if (pauseBtn) pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

// ----------------- Utility UI functions -----------------
function markCompleted(workoutEl) {
  if (!workoutEl) return;
  const existing = workoutEl.querySelector('.complete-badge');
  if (existing) return;
  const badge = document.createElement('span');
  badge.textContent = '✅';
  badge.className = 'complete-badge';
  badge.style.marginLeft = '10px';
  badge.style.fontSize = '1.2em';
  const timer = workoutEl.querySelector('.timer-display');
  if (timer) timer.appendChild(badge);
}

function cleanupAfterFinish(pauseBtn, skipBtn, prevBtn, timerEl, progress) {
  if (pauseBtn) pauseBtn.style.display = 'none';
  if (skipBtn) skipBtn.style.display = 'none';
  if (prevBtn) prevBtn.style.display = 'none';
  if (timerEl) timerEl.textContent = 'Done';
  if (progress) progress.style.width = '100%';
  activeWorkout = null;
}

// ----------------- Session detection (unchanged features) -----------------
function isLastWorkoutOfSession(workoutElement, session = 'morning') {
  const dayDiv = workoutElement.closest('.day');
  if (!dayDiv) return false;
  const h3 = Array.from(dayDiv.querySelectorAll('h3')).find(h => new RegExp(session, 'i').test(h.textContent));
  const ul = h3?.nextElementSibling;
  if (!ul) return false;
  const workouts = Array.from(ul.querySelectorAll('.workout'));
  return workouts.length && workoutElement === workouts[workouts.length - 1];
}

function isLastWorkoutOfDay(workoutElement) {
  return isLastWorkoutOfSession(workoutElement, 'evening');
}

// ----------------- Master Reset -----------------
function masterReset() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  const all = getAllWorkouts();
  all.forEach(w => {
    const timerEl = w.querySelector('.timer-display');
    const progress = w.querySelector('.progress');
    if (timerEl) timerEl.textContent = '01:00';
    if (progress) progress.style.width = '0%';
    w.querySelectorAll('.pause-resume').forEach(btn => btn.style.display = 'none');
    const badge = w.querySelector('.complete-badge');
    if (badge) badge.remove();
  });
  document.querySelectorAll('.check-cell').forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('checked');
  });
  clearWorkoutProgress();
  activeWorkout = null;
  isPaused = false;
}

// ----------------- Dark mode & Tracker event wiring -----------------
function initTrackerAndDarkMode() {
  // tracker check cells
  document.querySelectorAll('.check-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const isChecked = cell.textContent === '\u2713';
      cell.textContent = isChecked ? '' : '\u2713';
      cell.classList.toggle('checked', !isChecked);
      saveCheckCellData();
    });
  });
  loadCheckCellData();

  // dark mode
  const toggle = document.querySelector('.toggle-dark');
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    saveDarkMode(isDark);
  });
  if (loadDarkMode()) document.body.classList.add('dark-mode');

  // master reset
  const mBtn = document.querySelector('.master-reset');
  if (mBtn) mBtn.addEventListener('click', masterReset);
}

// ----------------- Restore in-progress workout prompt -----------------
function checkForSavedWorkout() {
  const saved = loadWorkoutProgress();
  const all = getAllWorkouts();
  if (saved && typeof saved.index === 'number' && saved.index < all.length) {
    // Only prompt if the saved progress is recent-ish (for safety)
    const ageMs = Date.now() - (saved.timestamp || 0);
    // If older than 24 hours, treat as stale
    if (ageMs < 24 * 60 * 60 * 1000) {
      const resume = confirm("You have an unfinished workout. Continue where you left off?");
      if (resume) {
        startWorkout(all[saved.index], true);
        return;
      } else {
        clearWorkoutProgress();
      }
    } else {
      clearWorkoutProgress();
    }
  }
}

// ----------------- Service Worker registration (moved into external script) -----------------
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(() => {
      console.log('✅ Service Worker registered');
    }).catch(err => console.error('❌ SW registration failed:', err));
  }
}

// ----------------- Boot -----------------
document.addEventListener('DOMContentLoaded', () => {
  initTrackerAndDarkMode();
  registerServiceWorker();
  checkForSavedWorkout();

  // Attach click handlers to workouts
  getAllWorkouts().forEach(el => {
    el.addEventListener('click', (ev) => {
      // If the user clicked a control button, ignore (buttons have .pause-resume)
      if (ev.target && ev.target.classList && ev.target.classList.contains('pause-resume')) return;
      // start this workout (clears other timers)
      clearWorkoutProgress(); // start fresh (we also save progress while running)
      startWorkout(el);
    });
  });
});et activeWorkout = null;
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
