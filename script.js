
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
