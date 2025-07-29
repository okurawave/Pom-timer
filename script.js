const timeDisplay = document.getElementById('time-display');
const startStopBtn = document.getElementById('start-stop');
const resetBtn = document.getElementById('reset');
const modeDisplay = document.getElementById('mode');
const cycleCountDisplay = document.getElementById('cycle-count');
const notificationAudio = new Audio('notification.wav');
const achievementsBtn = document.getElementById('achievements-btn');
const achievementsModal = document.getElementById('achievements-modal');
const closeBtn = document.querySelector('.close-btn');
const achievementsGrid = document.getElementById('achievements-grid');


// --- 実績データ ---
const achievements = [
    { id: 'first_step', name: 'First Step', description: '初めてのポモドーロを完了する', icon: 'icon_first_step.png', unlocked: false },
    { id: 'pomodoro_beginner', name: 'Pomodoro Beginner', description: '10回のポモドーロを完了する', icon: 'icon_pomodoro_beginner.png', unlocked: false },
    { id: 'pomodoro_enthusiast', name: 'Pomodoro Enthusiast', description: '50回のポモドーロを完了する', icon: 'icon_pomodoro_enthusiast.png', unlocked: false },
    { id: 'pomodoro_master', name: 'Pomodoro Master', description: '100回のポモドーロを完了する', icon: 'icon_pomodoro_master.png', unlocked: false },
    { id: '3_day_streak', name: '3-Day Streak', description: '3日間継続して利用する', icon: 'icon_3_day_streak.png', unlocked: false },
    { id: '7_day_streak', name: '7-Day Streak', description: '7日間継続して利用する', icon: 'icon_7_day_streak.png', unlocked: false },
    { id: 'weekend_warrior', name: 'Weekend Warrior', description: '週末（土日）にポモドーロを完了する', icon: 'icon_weekend_warrior.png', unlocked: false },
    { id: 'night_owl', name: 'Night Owl', description: '深夜（22:00～5:00）にポモドーロを完了する', icon: 'icon_night_owl.png', unlocked: false },
];
// --------------------

const WORK_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

let timer;
let timeLeft = WORK_TIME;
let isRunning = false;
let currentMode = 'work'; // work, shortBreak, longBreak
let workCycle = 0;

// --- localStorage関連のキー ---
const STATS_KEY = 'pomodoro_stats';
const ACHIEVEMENTS_KEY = 'pomodoro_achievements';

// --- データ管理 ---
let stats = {
    totalPomodoros: 0,
    lastSessionDate: null,
    streak: 0,
};

let userAchievements = {}; // { achievementId: unlockedDate }

// localStorageからデータを読み込む
function loadData() {
    const savedStats = localStorage.getItem(STATS_KEY);
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
    const savedAchievements = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (savedAchievements) {
        userAchievements = JSON.parse(savedAchievements);
    }
}

// localStorageにデータを保存する
function saveData() {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(userAchievements));
}


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

        // ポモドーロ完了時に統計を更新し、実績をチェック
        stats.totalPomodoros++;
        checkAchievements();


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

// --- 実績関連の関数 ---
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
    let newAchievementUnlocked = false;

    // 1. 初回ポモドーロ
    if (!userAchievements['first_step']) {
        unlockAchievement('first_step');
        newAchievementUnlocked = true;
    }

    // 2. 累計ポモドーロ
    const pomodoroMilestones = [
        { id: 'pomodoro_beginner', count: 10 },
        { id: 'pomodoro_enthusiast', count: 50 },
        { id: 'pomodoro_master', count: 100 },
    ];
    pomodoroMilestones.forEach(m => {
        if (stats.totalPomodoros >= m.count && !userAchievements[m.id]) {
            unlockAchievement(m.id);
            newAchievementUnlocked = true;
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
            unlockAchievement(m.id);
            newAchievementUnlocked = true;
        }
    });


    // 4. 週末利用
    const dayOfWeek = now.getDay(); // 0 (Sunday) or 6 (Saturday)
    if ((dayOfWeek === 0 || dayOfWeek === 6) && !userAchievements['weekend_warrior']) {
        unlockAchievement('weekend_warrior');
        newAchievementUnlocked = true;
    }

    // 5. 深夜利用
    const hour = now.getHours();
    if ((hour >= 22 || hour < 5) && !userAchievements['night_owl']) {
        unlockAchievement('night_owl');
        newAchievementUnlocked = true;
    }


    if (newAchievementUnlocked) {
        // TODO: 実績解除の通知を出す (e.g., a small popup)
        console.log("新しい実績を解除しました！");
    }

    saveData(); // 変更を保存
}

function unlockAchievement(id) {
    if (!userAchievements[id]) {
        userAchievements[id] = new Date().toISOString();
        console.log(`Unlocked: ${id}`);
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

// --- モーダル制御 ---
achievementsBtn.addEventListener('click', () => {
    populateAchievementsGrid();
    achievementsModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    achievementsModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == achievementsModal) {
        achievementsModal.style.display = 'none';
    }
});

// --- 初期化処理 ---
function initializeApp() {
    loadData();
    checkStreakOnLoad(); // ページ読み込み時にストリークをチェック
    updateDisplay();
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
if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
        } else if (permission === 'denied') {
            console.warn('Notification permission denied. Notifications will not be available.');
        }
    }).catch(error => {
        console.error('Error requesting notification permission:', error);
    });
}
