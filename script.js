let activeWorkout = null;
let timerInterval = null;
let remainingTime = 60;
let isPaused = false;
let beep = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

function getAllWorkouts() {
  return Array.from(document.querySelectorAll('.workout'));
}

function isMorningWorkout(workoutElement) {
  const dayDiv = workoutElement.closest('.day');
  const h3 = dayDiv ? dayDiv.querySelector('h3') : null;
  return h3 && /morning/i.test(h3.textContent);
}

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

function showGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : "Good evening";
  alert(`${greeting}, welcome back!`);
}

function saveProgress(index, remainingTime, isPaused) {
  localStorage.setItem('workoutProgress', JSON.stringify({
    index,
    remainingTime,
    isPaused,
    timestamp: Date.now()
  }));
}

function loadProgress() {
  const data = localStorage.getItem('workoutProgress');
  return data ? JSON.parse(data) : null;
}

function clearProgress() {
  localStorage.removeItem('workoutProgress');
}

function markCompleted(workoutEl) {
  const badge = document.createElement('span');
  badge.textContent = '✅';
  badge.className = 'complete-badge';
  badge.style.marginLeft = '10px';
  badge.style.fontSize = '1.2em';
  if (!workoutEl.querySelector('.complete-badge')) {
    workoutEl.querySelector('.timer-display').appendChild(badge);
  }
}

function showDailySummary() {
  alert("🎉 You completed all workouts today! Great work — see you tomorrow!");
}

function startWorkout(el, restore = false) {
  if (timerInterval) clearInterval(timerInterval);

  const all = getAllWorkouts();
  const i = all.indexOf(el);
  if (i === -1) return;

  activeWorkout = el;
  remainingTime = restore ? loadProgress()?.remainingTime || 60 : 60;
  isPaused = restore ? loadProgress()?.isPaused || false : false;

  const timer = el.querySelector('.timer-display');
  const progress = el.querySelector('.progress');
  const pauseBtn = el.querySelector('.pause-resume:not(.skip-next):not(.prev-workout)');
  const skipBtn = el.querySelector('.pause-resume.skip-next');
  const prevBtn = el.querySelector('.pause-resume.prev-workout');

  timer.textContent = formatTime(remainingTime);
  updateProgress(progress);

  pauseBtn.style.display = 'inline-block';
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  pauseBtn.onclick = () => togglePause(timer, progress, pauseBtn, i);

  if (prevBtn) {
    prevBtn.style.display = i === 0 ? 'none' : 'inline-block';
    prevBtn.textContent = 'Previous';
    prevBtn.onclick = (ev) => {
      ev.stopPropagation();
      clearProgress();
      startWorkout(all[i - 1]);
    };
  }

  if (skipBtn) {
    skipBtn.style.display = i + 1 < all.length ? 'inline-block' : 'none';
    skipBtn.textContent = 'Go to Next';
    skipBtn.onclick = (ev) => {
      ev.stopPropagation();
      clearInterval(timerInterval);
      clearProgress();
      startWorkout(all[i + 1]);
    };
  }

  timerInterval = setInterval(() => {
    if (!isPaused) {
      remainingTime--;
      timer.textContent = formatTime(remainingTime);
      updateProgress(progress);
      saveProgress(i, remainingTime, isPaused);

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        beep.play();
        clearProgress();
        timerInterval = null;

        markCompleted(el); // ✅ Add badge

        if (isLastWorkoutOfSession(el, 'morning')) {
          alert("Congrats! Morning workout finished, see you this evening.");
          cleanupButtons(pauseBtn, skipBtn, prevBtn, timer, progress);
          return;
        }

        if (isLastWorkoutOfDay(el)) {
          showDailySummary();
          cleanupButtons(pauseBtn, skipBtn, prevBtn, timer, progress);
          return;
        }

        if (i + 1 < all.length) {
          startWorkout(all[i + 1]);
        }
      }
    }
  }, 1000);

  all.forEach(w => {
    if (w !== el) {
      w.querySelectorAll('.pause-resume').forEach(b => b.style.display = 'none');
    }
  });
}

function togglePause(timer, progress, pauseBtn, index) {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  saveProgress(index, remainingTime, isPaused);
}

function updateProgress(bar) {
  bar.style.width = `${((60 - remainingTime) / 60) * 100}%`;
}

function formatTime(s) {
  return `00:${String(s).padStart(2, '0')}`;
}

function cleanupButtons(pauseBtn, skipBtn, prevBtn, timer, progress) {
  pauseBtn.style.display = 'none';
  skipBtn.style.display = 'none';
  if (prevBtn) prevBtn.style.display = 'none';
  timer.textContent = 'Done';
  progress.style.width = '100%';
  activeWorkout = null;
}

document.addEventListener('DOMContentLoaded', () => {
  showGreeting();

  const all = getAllWorkouts();
  all.forEach((el, i) => {
    el.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('pause-resume')) return;
      clearProgress();
      startWorkout(el);
    });
  });

  const saved = loadProgress();
  if (saved && typeof saved.index === 'number' && saved.index < all.length) {
    const confirmResume = confirm("You have an unfinished workout. Continue where you left off?");
    if (confirmResume) {
      startWorkout(all[saved.index], true);
    } else {
      clearProgress();
    }
  }

  document.querySelector('.master-reset').onclick = () => {
    if (timerInterval) clearInterval(timerInterval);
    clearProgress();
    all.forEach(w => {
      w.querySelector('.timer-display').textContent = '01:00';
      w.querySelector('.progress').style.width = '0%';
      w.querySelectorAll('.pause-resume').forEach(btn => btn.style.display = 'none');
      const badge = w.querySelector('.complete-badge');
      if (badge) badge.remove();
    });
    document.querySelectorAll('.check-cell').forEach(cell => {
      cell.textContent = '';
      cell.classList.remove('checked');
    });
    activeWorkout = null;
    isPaused = false;
  };
});
