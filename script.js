// DOM Elements
const timeDisplay = document.getElementById('time-display');
const startStopBtn = document.getElementById('start-stop');
const resetBtn = document.getElementById('reset');
const modeDisplay = document.getElementById('mode');
const cycleCountDisplay = document.getElementById('cycle-count');
const progressCircle = document.querySelector('.progress-ring__circle');
const statsBtn = document.getElementById('stats-btn');
const statsModal = document.getElementById('stats-modal');
const heatmapContainer = document.getElementById('heatmap-container');
const bargraphContainer = document.getElementById('bargraph-container');
const achievementsBtn = document.getElementById('achievements-btn');
const achievementsModal = document.getElementById('achievements-modal');
const achievementsGrid = document.getElementById('achievements-grid');
const installGuideBtn = document.getElementById('install-guide-btn');
const installGuideModal = document.getElementById('install-guide-modal');


// --- Achievement Data ---
const achievements = [
    { id: 'first_step', name: 'First Step', description: '初めてのポモドーロを完了する', icon: 'icon_first_step.png', unlocked: false },
    { id: 'pomodoro_beginner', name: 'Pomodoro Beginner', description: '10回のポモドーロを完了する', icon: 'icon_pomodoro_beginner.png', unlocked: false },
    { id: 'pomodoro_enthusiast', name: 'Pomodoro Enthusiast', description: '50回のポモドーロを完了する', icon: 'icon_pomodoro_enthusiast.png', unlocked: false },
    { id: 'pomodoro_master', name: 'Pomodoro Master', description: '100回のポモドーロを完了する', icon: 'icon_pomodoro_master.png', unlocked: false },
    { id: '3_day_streak', name: '3-Day Streak', description: '3日間継続して利用する', icon: 'icon_3_day_streak.png', unlocked: false },
    { id: '7_day_streak', name: '7-Day Streak', description: '7日間継続して利用する', icon: 'icon_7_day_streak.png', unlocked: false },
    { id: 'weekend_warrior', name: 'Weekend Warrior', description: '週末（土日）にポモドーロを完了する', icon: 'icon_weekend_warrior.png', unlocked: false },
    { id: 'night_owl', name: 'Night Owl', description: '深夜（22:00～5:00）にポモドーロを完了する', icon: 'icon_night_owl.png', unlocked: false },
    { id: 'weekly_goal_achiever', name: 'Weekly Goal Achiever', description: '週間（月曜始まり）で35回のポモドーロを完了する', icon: 'icon_weekly_goal.png', unlocked: false },
    { id: 'monthly_goal_achiever', name: 'Monthly Goal Achiever', description: '月間で150回のポモドーロを完了する', icon: 'icon_monthly_goal.png', unlocked: false },
];
const goalInput = document.getElementById('goal-input');
const progressDisplay = document.getElementById('progress-display');
const confettiCanvas = document.getElementById('confetti-canvas');
const taskInput = document.getElementById('task-input');
const settingsBtn = document.getElementById('settings-btn');
const modal = document.getElementById('settings-modal');
const closeBtns = document.querySelectorAll('.close-btn');
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
const toastContainer = document.getElementById('toast-container');

// --- Toast Notification ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 3000); // Show for 3 seconds
}


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
let currentSound = null;

// --- localStorage Keys ---
const STATS_KEY = 'pomodoro_stats';
const ACHIEVEMENTS_KEY = 'pomodoro_achievements';
const SETTINGS_KEY = 'timerSettings';
const HISTORY_KEY = 'pomodoro_history';

// --- Data Management ---
let stats = {
    totalPomodoros: 0,
    lastSessionDate: null,
    streak: 0,
};
let userAchievements = {}; // { achievementId: unlockedDate }

const notificationAudio = new Audio('notification.wav');
const myConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
});

// localForageからデータを読み込む
function loadData() {
    Promise.all([
        localforage.getItem(STATS_KEY),
        localforage.getItem(ACHIEVEMENTS_KEY),
        localforage.getItem(SETTINGS_KEY),
        localforage.getItem('dailyGoal'),
        localforage.getItem('completedPomodoros')
    ]).then(values => {
        stats = values[0] || stats;
        userAchievements = values[1] || {};
        settings = values[2] || { ...DEFAULT_SETTINGS };
        dailyGoal = values[3] || 8;
        completedPomodoros = values[4] || 0;

        goalInput.value = dailyGoal;
        updateProgressDisplay();
    }).catch(err => {
        console.error("Error loading data from localForage", err);
    }).finally(() => {
        resetTimer(); // Ensure timer is reset regardless of Promise outcome
        // Fallback to default values
        stats = stats || {};
        userAchievements = {};
        settings = { ...DEFAULT_SETTINGS };
        dailyGoal = 8;
        completedPomodoros = 0;

        // Update UI with default values
        goalInput.value = dailyGoal;
        updateProgressDisplay();
        resetTimer(); // Reset timer to reflect default values

        // Notify the user
        alert("Failed to load data. Default settings have been applied.");
    });
}

// localForageにデータを保存する
function saveData() {
    localforage.setItem(STATS_KEY, stats);
    localforage.setItem(ACHIEVEMENTS_KEY, userAchievements);
    localforage.setItem(SETTINGS_KEY, settings);
    localforage.setItem('dailyGoal', dailyGoal);
    localforage.setItem('completedPomodoros', completedPomodoros);
}

function updatePomodoroHistory() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    localforage.getItem(HISTORY_KEY).then(history => {
        history = history || {};
        history[today] = (history[today] || 0) + 1;
        localforage.setItem(HISTORY_KEY, history);
    });
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

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    localforage.getItem('theme').then(theme => {
        applyTheme(theme || 'light');
    });
    loadSoundSettings();
    checkStreakOnLoad();
});

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    let totalTime;
    if (currentMode === 'work') {
        totalTime = settings.workTime * 60;
    } else if (currentMode === 'shortBreak') {
        totalTime = settings.shortBreakTime * 60;
    } else {
        totalTime = settings.longBreakTime * 60;
    }
    const percent = ((totalTime - timeLeft) / totalTime) * 100;
    setProgress(percent);
}

// --- Timer Logic ---
function switchMode() {
    notificationAudio.play();
    let notificationTitle;
    let notificationBody;

    if (currentMode === 'work') {
        workCycle++;
        completedPomodoros++;
        stats.totalPomodoros++;
        updatePomodoroHistory(); // Add this line
        updateProgressDisplay();
        checkAchievements();
        saveData();

        if (parseInt(completedPomodoros) === parseInt(dailyGoal)) {
            celebrate();
        }

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

// --- Achievement Related Functions ---
function populateAchievementsGrid() {
    achievementsGrid.innerHTML = ''; // Clear existing grid
    achievements.forEach(ach => {
        const isUnlocked = !!userAchievements[ach.id];
        const achievementEl = document.createElement('div');
        achievementEl.classList.add('achievement');

        achievementEl.innerHTML = `
            <div class="achievement-icon ${isUnlocked ? 'unlocked' : 'locked'}" style="background-image: url('icons/${ach.icon}')"></div>
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-tooltip">${ach.description}</div>
        `;
        achievementsGrid.appendChild(achievementEl);
    });
}

function checkAchievements() {
    const now = new Date();

    // 1. 初回ポモドーロ
    if (!userAchievements['first_step']) {
        unlockAchievement('first_step', 'First Step');
    }

    // 2. 累計ポモドーロ
    const pomodoroMilestones = [
        { id: 'pomodoro_beginner', count: 10 },
        { id: 'pomodoro_enthusiast', count: 50 },
        { id: 'pomodoro_master', count: 100 },
    ];
    pomodoroMilestones.forEach(m => {
        if (stats.totalPomodoros >= m.count && !userAchievements[m.id]) {
            unlockAchievement(m.id, m.name);
        }
    });

    // 3. 継続利用
    const today = now.toISOString().split('T')[0];
    if (stats.lastSessionDate) {
        const lastDate = new Date(stats.lastSessionDate);
        const diffTime = now - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            stats.streak++;
        } else if (diffDays > 1) {
            stats.streak = 1; // ストリークが途切れた
        }
    } else {
        stats.streak = 1;
    }
    stats.lastSessionDate = today;

    const streakMilestones = [
        { id: '3_day_streak', days: 3 },
        { id: '7_day_streak', days: 7 },
    ];
    streakMilestones.forEach(m => {
        if (stats.streak >= m.days && !userAchievements[m.id]) {
            unlockAchievement(m.id, m.name);
        }
    });


    // 4. 週末利用
    const dayOfWeek = now.getDay(); // 0 (Sunday) or 6 (Saturday)
    if ((dayOfWeek === 0 || dayOfWeek === 6) && !userAchievements['weekend_warrior']) {
        unlockAchievement('weekend_warrior', 'Weekend Warrior');
    }

    // 5. 深夜利用
    const hour = now.getHours();
    if ((hour >= 22 || hour < 5) && !userAchievements['night_owl']) {
        unlockAchievement('night_owl', 'Night Owl');
    }

    // 6. Weekly/Monthly Goal Achiever
    localforage.getItem(HISTORY_KEY).then(history => {
        history = history || {};

        // Weekly check (Monday as start of week)
        if (!userAchievements['weekly_goal_achiever']) {
            let weeklyCount = 0;
            const dayOfWeek = now.getDay(); // 0-6 (Sun-Sat)
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Adjust to Monday
            startOfWeek.setHours(0, 0, 0, 0);

            for (let d = new Date(startOfWeek); d <= now; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                weeklyCount += history[dateStr] || 0;
            }

            if (weeklyCount >= 35) {
                unlockAchievement('weekly_goal_achiever', 'Weekly Goal Achiever');
            }
        }

        // Monthly check
        if (!userAchievements['monthly_goal_achiever']) {
            let monthlyCount = 0;
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            for (let d = new Date(startOfMonth); d <= now; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                monthlyCount += history[dateStr] || 0;
            }

            if (monthlyCount >= 150) {
                unlockAchievement('monthly_goal_achiever', 'Monthly Goal Achiever');
            }
        }
    });

    saveData(); // 変更を保存
}

function unlockAchievement(id, name) {
    if (!userAchievements[id]) {
        userAchievements[id] = new Date().toISOString();
        showToast(`実績解除: ${name}`);
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

    saveData();
    closeModal();
    resetTimer();
}

function resetDefaultSettings() {
    settings = { ...DEFAULT_SETTINGS };
    localforage.removeItem(SETTINGS_KEY).then(() => {
        closeModal();
        resetTimer();
    });
}

// --- Theme Switcher ---
function applyTheme(themeName) {
    document.body.className = '';
    document.body.classList.add(themeName);
    localforage.setItem('theme', themeName);
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
        localforage.getItem(`${soundName}Volume`).then(volume => {
            sound.volume = parseFloat(volume) || 0.5;
            sound.play();
            currentSound = sound;
        });
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
    localforage.setItem(`${soundName}Volume`, volume);
}

function loadSoundSettings() {
    soundOptions.forEach(option => {
        const soundName = option.dataset.sound;
        localforage.getItem(`${soundName}Volume`).then(savedVolume => {
            if (savedVolume) {
                option.querySelector('.volume-slider').value = savedVolume;
            } else {
                option.querySelector('.volume-slider').value = 0.5;
            }
        });
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
saveSettingsBtn.addEventListener('click', saveSettings);
resetDefaultsBtn.addEventListener('click', resetDefaultSettings);
themeBtn.addEventListener('click', toggleThemeSelector);
soundBtn.addEventListener('click', toggleSoundSelector);
stopSoundBtn.addEventListener('click', stopAllSounds);

goalInput.addEventListener('change', () => {
    const parsedGoal = parseInt(goalInput.value, 10);
    dailyGoal = isNaN(parsedGoal) ? 0 : parsedGoal;
    updateProgressDisplay();
    saveData();
});

achievementsBtn.addEventListener('click', () => {
    populateAchievementsGrid();
    achievementsModal.style.display = 'block';
});

installGuideBtn.addEventListener('click', () => {
    installGuideModal.style.display = 'block';
});

statsBtn.addEventListener('click', () => {
    populateStats();
    statsModal.style.display = 'block';
});

closeBtns.forEach(btn => btn.addEventListener('click', () => {
    achievementsModal.style.display = 'none';
    statsModal.style.display = 'none';
    modal.style.display = 'none';
    installGuideModal.style.display = 'none';
}));

// --- Initialization Process ---
function initializeApp() {
    loadData();
    checkStreakOnLoad(); // ページ読み込み時にストリークをチェック
    updateDisplay();
}

function populateStats() {
    localforage.getItem(HISTORY_KEY).then(history => {
        history = history || {};
        generateHeatmap(history);
        generateBarGraph(history);
    });
}

function generateHeatmap(history) {
    heatmapContainer.innerHTML = '';
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate());
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 1);

    const dates = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        dates[dateString] = history[dateString] || 0;
    }

    const maxCount = Math.max(...Object.values(dates), 1);

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const SUNDAY = 0;
    let currentDate = new Date(startDate);
    // Adjust to start the week on Sunday
    while (currentDate.getDay() !== SUNDAY) {
        currentDate.setDate(currentDate.getDate() - 1);
    }

    for (let i = 0; i < MAX_WEEKS; i++) { // Max 53 weeks
        const tr = document.createElement('tr');
        for (let j = 0; j < DAYS_PER_WEEK; j++) {
            const td = document.createElement('td');
            const dateString = currentDate.toISOString().split('T')[0];

            if (currentDate >= startDate && currentDate <= endDate) {
                const count = dates[dateString] || 0;
                const opacity = count > 0 ? MIN_OPACITY + (count / maxCount) * OPACITY_RANGE : EMPTY_OPACITY;
                td.style.backgroundColor = `rgba(76, 175, 80, ${opacity})`;
                td.title = `${dateString}: ${count} pomodoros`;
            } else {
                td.style.backgroundColor = '#ebedf0';
            }
            tr.appendChild(td);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        tbody.appendChild(tr);
        if (currentDate > endDate) break;
    }

    heatmapContainer.appendChild(table);
}

function generateBarGraph(history) {
    bargraphContainer.innerHTML = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTotals = Array(DAYS_PER_WEEK).fill(0);
    const weeklyCounts = Array(DAYS_PER_WEEK).fill(0);

    for (const dateStr in history) {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        weeklyTotals[dayOfWeek] += history[dateStr];
        weeklyCounts[dayOfWeek]++;
    }

    const weeklyAverages = weeklyTotals.map((total, i) => weeklyCounts[i] > 0 ? total / weeklyCounts[i] : 0);
    const maxAverage = Math.max(...weeklyAverages, 1);

    weeklyAverages.forEach((avg, i) => {
        const barWrapper = document.createElement('div');
        barWrapper.style.textAlign = 'center';

        const bar = document.createElement('div');
        const barHeight = (avg / maxAverage) * 100;
        bar.style.height = `${barHeight}%`;
        bar.style.width = '30px';
        bar.style.backgroundColor = '#4caf50';
        bar.style.display = 'inline-block';
        bar.title = `Average: ${avg.toFixed(1)}`;

        const label = document.createElement('p');
        label.textContent = dayNames[i];

        barWrapper.appendChild(bar);
        barWrapper.appendChild(label);
        bargraphContainer.appendChild(barWrapper);
    });
}

function checkStreakOnLoad() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (stats.lastSessionDate && stats.lastSessionDate !== today) {
        const lastDate = new Date(stats.lastSessionDate);
        const diffTime = now - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            stats.streak = 0; // ストリークが途切れた
        }
    }
    // lastSessionDateはポモドーロ完了時に更新するので、ここでは更新しない
    saveData();
}

initializeApp();


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
            // console.log('Notification permission granted.');
        }
    });
}
