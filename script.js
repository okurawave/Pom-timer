// DOM Elements
const timeDisplay = document.getElementById('time-display');
const startStopBtn = document.getElementById('start-stop');
const resetBtn = document.getElementById('reset');
const modeDisplay = document.getElementById('mode');
const cycleCountDisplay = document.getElementById('cycle-count');
const goalInput = document.getElementById('goal-input');
const progressDisplay = document.getElementById('progress-display');
const confettiCanvas = document.getElementById('confetti-canvas');
const taskInput = document.getElementById('task-input');
const settingsBtn = document.getElementById('settings-btn');
const modal = document.getElementById('settings-modal');
const closeBtn = document.querySelector('.close-btn');
const saveSettingsBtn = document.getElementById('save-settings');
const resetDefaultsBtn = document.getElementById('reset-defaults');
const workTimeInput = document.getElementById('work-time-input');
const shortBreakInput = document.getElementById('short-break-input');
const longBreakInput = document.getElementById('long-break-input');
const cycleInput = document.getElementById('cycle-input');
const themeBtn = document.getElementById('theme-btn');
const themeSelector = document.getElementById('theme-selector');
const themeOptions = document.querySelectorAll('.theme-option');
const soundBtn = document.getElementById('sound-btn');
const soundSelector = document.getElementById('sound-selector');
const soundOptions = document.querySelectorAll('.sound-option');
const stopSoundBtn = document.getElementById('stop-sound-btn');

// Default Settings
const DEFAULT_SETTINGS = {
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    cycles: 4,
};

// State
let settings = { ...DEFAULT_SETTINGS };
let timer;
let timeLeft;
let isRunning = false;
let currentMode = 'work'; // work, shortBreak, longBreak
let workCycle = 0;

let dailyGoal = 8;
let completedPomodoros = 0;
const notificationAudio = new Audio('notification.wav');

const myConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
});

function loadSettings() {
    dailyGoal = parseInt(localStorage.getItem('dailyGoal')) || 8;
    completedPomodoros = parseInt(localStorage.getItem('completedPomodoros')) || 0;
    goalInput.value = dailyGoal;
    updateProgressDisplay();
}

function saveSettings() {
    localStorage.setItem('dailyGoal', dailyGoal);
    localStorage.setItem('completedPomodoros', completedPomodoros);
}

function updateProgressDisplay() {
    progressDisplay.textContent = `${completedPomodoros}/${dailyGoal}`;
}

function celebrate() {
    myConfetti({
        particleCount: 150,
        spread: 180
    });
}
let currentSound = null;


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applyTheme(localStorage.getItem('theme') || 'light');
    loadSoundSettings();
    resetTimer();
});



function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// --- Timer Logic ---
function switchMode() {
    // notificationAudio.play(); // This will be handled by the browser notification
    let notificationTitle;
    let notificationBody;

    if (currentMode === 'work') {
        workCycle++;

        completedPomodoros++;
        updateProgressDisplay();
        saveSettings();

        if (parseInt(completedPomodoros) === parseInt(dailyGoal)) {
            celebrate();
        }

        cycleCountDisplay.textContent = `サイクル: ${workCycle % 4 || 4}/4`;
        if (workCycle % 4 === 0) {

        cycleCountDisplay.textContent = `サイクル: ${workCycle % settings.cycles || settings.cycles}/${settings.cycles}`;
        if (workCycle > 0 && workCycle % settings.cycles === 0) {

            currentMode = 'longBreak';
            timeLeft = settings.longBreakTime * 60;
            modeDisplay.textContent = '長い休憩';
            notificationTitle = 'お疲れ様でした！';
            notificationBody = `長い休憩(${settings.longBreakTime}分)を開始します。`;
        } else {
            currentMode = 'shortBreak';
            timeLeft = settings.shortBreakTime * 60;
            modeDisplay.textContent = '短い休憩';
            notificationTitle = '作業終了！';
            notificationBody = `短い休憩(${settings.shortBreakTime}分)を開始します。`;
        }
    } else {
        currentMode = 'work';
        timeLeft = settings.workTime * 60;
        modeDisplay.textContent = '作業モード';
        notificationTitle = '休憩終了';
        notificationBody = '作業を再開します。';
    }

    updateDisplay();

    if (Notification.permission === 'granted') {
        new Notification(notificationTitle, { body: notificationBody });
    }
}

function startTimer() {
    isRunning = true;
    startStopBtn.textContent = '一時停止';
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timer);
            switchMode();
            startTimer(); // Automatically start the next timer
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
    updateDisplay();
}

goalInput.addEventListener('change', () => {
    const parsedGoal = parseInt(goalInput.value, 10);
    dailyGoal = isNaN(parsedGoal) ? 0 : parsedGoal; // Default to 0 if input is invalid
    updateProgressDisplay();
    saveSettings();
});


    currentMode = 'work';
    workCycle = 0;
    timeLeft = settings.workTime * 60;
    modeDisplay.textContent = '作業モード';
    cycleCountDisplay.textContent = `サイクル: 0/${settings.cycles}`;
    updateDisplay();
}


// --- Settings Modal ---
function openModal() {
    workTimeInput.value = settings.workTime;
    shortBreakInput.value = settings.shortBreakTime;
    longBreakInput.value = settings.longBreakTime;
    cycleInput.value = settings.cycles;
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

function saveSettings() {
    settings.workTime = parseInt(workTimeInput.value, 10);
    settings.shortBreakTime = parseInt(shortBreakInput.value, 10);
    settings.longBreakTime = parseInt(longBreakInput.value, 10);
    settings.cycles = parseInt(cycleInput.value, 10);

    localStorage.setItem('timerSettings', JSON.stringify(settings));
    closeModal();
    resetTimer();
}

function resetDefaultSettings() {
    settings = { ...DEFAULT_SETTINGS };
    localStorage.removeItem('timerSettings');
    closeModal();
    resetTimer();
}

function loadSettings() {
    const savedSettings = localStorage.getItem('timerSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
}

// --- Theme Switcher ---
function applyTheme(themeName) {
    document.body.className = '';
    document.body.classList.add(themeName);
    localStorage.setItem('theme', themeName);
    themeSelector.style.display = 'none';
}

function toggleThemeSelector() {
    soundSelector.style.display = 'none';
    themeSelector.style.display = themeSelector.style.display === 'block' ? 'none' : 'block';
}


// --- Ambient Sound ---
function playSound(soundName) {
    if (currentSound) {
        currentSound.pause();
    }
    const sound = document.getElementById(`${soundName}-sound`);
    if (sound) {
        sound.volume = parseFloat(localStorage.getItem(`${soundName}Volume`)) || 0.5;
        sound.play();
        currentSound = sound;
    }
}

function stopAllSounds() {
    soundOptions.forEach(option => {
        const soundName = option.dataset.sound;
        const sound = document.getElementById(`${soundName}-sound`);
        if (sound) sound.pause();
    });
    currentSound = null;
    soundSelector.style.display = 'none';
}

function setVolume(soundName, volume) {
    const sound = document.getElementById(`${soundName}-sound`);
    if (sound) {
        sound.volume = volume;
    }
    localStorage.setItem(`${soundName}Volume`, volume);
}

function loadSoundSettings() {
    soundOptions.forEach(option => {
        const soundName = option.dataset.sound;
        const savedVolume = localStorage.getItem(`${soundName}Volume`);
        if (savedVolume) {
            option.querySelector('.volume-slider').value = savedVolume;
        } else {
            option.querySelector('.volume-slider').value = 0.5;
        }
    });
}

function toggleSoundSelector() {
    themeSelector.style.display = 'none';
    soundSelector.style.display = soundSelector.style.display === 'block' ? 'none' : 'block';
}


// --- Event Listeners ---

startStopBtn.addEventListener('click', () => {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);
settingsBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
saveSettingsBtn.addEventListener('click', saveSettings);
resetDefaultsBtn.addEventListener('click', resetDefaultSettings);
themeBtn.addEventListener('click', toggleThemeSelector);
soundBtn.addEventListener('click', toggleSoundSelector);
stopSoundBtn.addEventListener('click', stopAllSounds);


// Load settings on page load
loadSettings();
updateDisplay();


// Request notification permission on page load


themeOptions.forEach(button => {
    button.addEventListener('click', () => applyTheme(button.dataset.theme));
});

soundOptions.forEach(option => {
    const soundName = option.dataset.sound;
    const slider = option.querySelector('.volume-slider');

    // Play sound when clicking the option (but not on the slider)
    option.addEventListener('click', (e) => {
        if (e.target.type !== 'range') {
            playSound(soundName);
        }
    });

    // Adjust volume with the slider
    slider.addEventListener('input', (e) => {
        setVolume(soundName, e.target.value);
    });
});


window.addEventListener('click', (event) => {
    if (event.target == modal) {
        closeModal();
    }
    if (!themeBtn.contains(event.target) && !themeSelector.contains(event.target)) {
        themeSelector.style.display = 'none';
    }
    if (!soundBtn.contains(event.target) && !soundSelector.contains(event.target)) {
        soundSelector.style.display = 'none';
    }
});

// Request notification permission
if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
        }
    });
}
