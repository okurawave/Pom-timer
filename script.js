const timeDisplay = document.getElementById('time-display');
const startStopBtn = document.getElementById('start-stop');
const resetBtn = document.getElementById('reset');
const modeDisplay = document.getElementById('mode');
const cycleCountDisplay = document.getElementById('cycle-count');

const WORK_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

let timer;
let timeLeft = WORK_TIME;
let isRunning = false;
let currentMode = 'work'; // work, shortBreak, longBreak
let workCycle = 0;

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function switchMode() {
    notificationAudio.play();

    let notificationTitle;
    let notificationBody;

    if (currentMode === 'work') {
        workCycle++;
        cycleCountDisplay.textContent = `サイクル: ${workCycle % 4 || 4}/4`;
        if (workCycle % 4 === 0) {
            currentMode = 'longBreak';
            timeLeft = LONG_BREAK_TIME;
            modeDisplay.textContent = '長い休憩';
            notificationTitle = 'お疲れ様でした！';
            notificationBody = '長い休憩を開始します。';
        } else {
            currentMode = 'shortBreak';
            timeLeft = SHORT_BREAK_TIME;
            modeDisplay.textContent = '短い休憩';
            notificationTitle = '作業終了！';
            notificationBody = '短い休憩を開始します。';
        }
    } else {
        currentMode = 'work';
        timeLeft = WORK_TIME;
        modeDisplay.textContent = '作業モード';
        notificationTitle = '休憩終了';
        notificationBody = '作業を再開します。';
    }

    if (Notification.permission === 'granted') {
        new Notification(notificationTitle, { body: notificationBody });
    }
}

function startTimer() {
    isRunning = true;
    startStopBtn.textContent = '一時停止';
    timer = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
            clearInterval(timer);
            switchMode();
            startTimer(); // Immediately start the next timer
        }
    }, 1000);
}

function stopTimer() {
    isRunning = false;
    startStopBtn.textContent = 'スタート';
    clearInterval(timer);
}

function resetTimer() {
    stopTimer();
    if (currentMode === 'work') {
        timeLeft = WORK_TIME;
    } else if (currentMode === 'shortBreak') {
        timeLeft = SHORT_BREAK_TIME;
    } else {
        timeLeft = LONG_BREAK_TIME;
    }
    workCycle = 0;
    cycleCountDisplay.textContent = `サイクル: 0/4`;
    updateDisplay();
}

startStopBtn.addEventListener('click', () => {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);

updateDisplay();

// Request notification permission on page load
if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}
