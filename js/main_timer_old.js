// DOM Elements
let profileBtn;
let notificationBtn;
let completionAlert;
let dailyProgress;
let streakBadge;
let tasksContainer;
let logsContainer;
let addLogBtn;
let addTaskBtn;
let resetBtn;
let themeBtn;

// Theme handling
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.classList.remove(currentTheme);
    html.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeBtn.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun text-2xl';
    } else {
        icon.className = 'fas fa-moon text-2xl';
    }
}

// Sample user data (initial state)
let userData = {
    name: 'Player',
    rating: 1500,
    goal: 1800,
    streak: 15,
    completionRate: 85,
    hoursTrained: 0,
    tasks: [],
    logs: [],
    dailyProgress: []
};

const TIMER_ACTIVE_TASK_KEY = 'timerActiveTaskId';
const TIMER_END_TIME_KEY = 'timerEndTime';
const TIMER_PAUSED_KEY = 'timerPaused';
const TIMER_PAUSE_REMAINING_KEY = 'pauseRemainingMs';

let timerInterval = null;
let activeTaskId = null;
let timerPaused = false;
let timerEndTime = null;
let loggedCompletion = false;
let pauseRemainingMs = null;

function saveTimerState() {
    if (activeTaskId !== null) {
        localStorage.setItem(TIMER_ACTIVE_TASK_KEY, activeTaskId.toString());
    } else {
        localStorage.removeItem(TIMER_ACTIVE_TASK_KEY);
    }
    if (timerEndTime !== null) {
        localStorage.setItem(TIMER_END_TIME_KEY, timerEndTime.toString());
    } else {
        localStorage.removeItem(TIMER_END_TIME_KEY);
    }
    localStorage.setItem(TIMER_PAUSED_KEY, timerPaused ? 'true' : 'false');
    if (pauseRemainingMs !== null) {
        localStorage.setItem(TIMER_PAUSE_REMAINING_KEY, pauseRemainingMs.toString());
    } else {
        localStorage.removeItem(TIMER_PAUSE_REMAINING_KEY);
    }
}

function loadTimerState() {
    const storedTaskId = localStorage.getItem(TIMER_ACTIVE_TASK_KEY);
    const storedEndTime = localStorage.getItem(TIMER_END_TIME_KEY);
    const storedPaused = localStorage.getItem(TIMER_PAUSED_KEY);
    const storedPauseRemaining = localStorage.getItem(TIMER_PAUSE_REMAINING_KEY);

    activeTaskId = storedTaskId !== null ? parseInt(storedTaskId) : null;
    timerEndTime = storedEndTime !== null ? parseInt(storedEndTime) : null;
    timerPaused = storedPaused === 'true';
    pauseRemainingMs = storedPauseRemaining !== null ? parseInt(storedPauseRemaining) : null;
}

function clearTimerState() {
    localStorage.removeItem(TIMER_ACTIVE_TASK_KEY);
    localStorage.removeItem(TIMER_END_TIME_KEY);
    localStorage.removeItem(TIMER_PAUSED_KEY);
    localStorage.removeItem(TIMER_PAUSE_REMAINING_KEY);
    activeTaskId = null;
    timerEndTime = null;
    timerPaused = false;
    pauseRemainingMs = null;
    loggedCompletion = false;
}

function startTick() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!timerPaused && timerEndTime) {
            const now = Date.now();
            let remainingMs = timerEndTime - now;
            if (remainingMs < 0) remainingMs = 0;
            const remainingSeconds = Math.floor(remainingMs / 1000);
            updateTimerDisplayWithSeconds(activeTaskId, remainingSeconds);
            if (remainingSeconds === 0 && !loggedCompletion) {
                loggedCompletion = true;
                completeTask(activeTaskId);
                clearInterval(timerInterval);
                timerInterval = null;
                clearTimerState();
            }
        }
    }, 1000);
}

document.addEventListener('visibilitychange', () => {
    if (activeTaskId === null) return;

    if (document.hidden) {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    } else {
        updateTimerDisplay(activeTaskId);
        if (!timerPaused && !timerInterval && !loggedCompletion) {
            startTick();
        }
    }
});
