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

// Timer state persistence keys
const TIMER_ACTIVE_TASK_KEY = 'timerActiveTaskId';

let timerInterval = null;
let activeTaskId = null;
let timerPaused = false;
let timerEndTime = null;
let loggedCompletion = false;

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
            }
        }
    }, 1000);
}

function startTimer(taskId) {
    if (timerInterval) clearInterval(timerInterval);
    activeTaskId = taskId;
    const task = userData.tasks.find(t => t.id === taskId);
    if (!task) return;
    timerPaused = false;
    loggedCompletion = false;
    timerEndTime = Date.now() + Math.floor(task.duration * 3600 * 1000);
    updateTimerDisplayWithSeconds(taskId, Math.floor(task.duration * 3600));
    updateTimerButtons(taskId);
    saveTimerState();
    startTick();
}

function pauseTimer() {
    timerPaused = true;
    updateTimerButtons(activeTaskId);
    saveTimerState();
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resumeTimer() {
    if (!timerPaused) return;
    timerPaused = false;
    updateTimerButtons(activeTaskId);
    saveTimerState();
    startTick();
}

function saveTimerState() {
    if (activeTaskId !== null && timerEndTime !== null) {
        localStorage.setItem(TIMER_ACTIVE_TASK_KEY, activeTaskId.toString());
        localStorage.setItem('timerEndTime', timerEndTime.toString());
        localStorage.setItem('timerPaused', timerPaused.toString());
        localStorage.setItem('loggedCompletion', loggedCompletion.toString());
    }
}

function clearTimerState() {
    localStorage.removeItem(TIMER_ACTIVE_TASK_KEY);
    localStorage.removeItem('timerEndTime');
    localStorage.removeItem('timerPaused');
    localStorage.removeItem('loggedCompletion');
}

function restoreTimerState() {
    const savedTaskId = localStorage.getItem(TIMER_ACTIVE_TASK_KEY);
    const savedEndTime = localStorage.getItem('timerEndTime');
    const savedPaused = localStorage.getItem('timerPaused') === 'true';
    const savedLogged = localStorage.getItem('loggedCompletion') === 'true';

    if (savedTaskId && savedEndTime) {
        activeTaskId = parseInt(savedTaskId);
        timerEndTime = parseInt(savedEndTime);
        timerPaused = savedPaused;
        loggedCompletion = savedLogged;

        updateTimerDisplay(activeTaskId);
        updateTimerButtons(activeTaskId);

        if (!timerPaused && !loggedCompletion) {
            startTick();
        }
    }
}

function updateTimerDisplay(taskId) {
    const timerSpan = document.querySelector(`#timer-${taskId}`);
    if (timerSpan) {
        const now = Date.now();
        let remainingMs = timerEndTime - now;
        if (remainingMs < 0) remainingMs = 0;
        const remainingSeconds = Math.floor(remainingMs / 1000);
        timerSpan.textContent = formatTime(remainingSeconds);
    }
}

function updateTimerDisplayWithSeconds(taskId, seconds) {
    const timerSpan = document.querySelector(`#timer-${taskId}`);
    if (timerSpan) {
        timerSpan.textContent = formatTime(seconds);
    }
}

function updateTimerButtons(taskId) {
    userData.tasks.forEach(task => {
        const startBtn = document.querySelector(`#start-btn-${task.id}`);
        const pauseBtn = document.querySelector(`#pause-btn-${task.id}`);
        const resumeBtn = document.querySelector(`#resume-btn-${task.id}`);
        if (!startBtn || !pauseBtn || !resumeBtn) return;

        if (task.id === taskId) {
            if (timerPaused) {
                startBtn.style.display = 'none';
                pauseBtn.style.display = 'none';
                resumeBtn.style.display = 'inline-block';
            } else {
                startBtn.style.display = 'none';
                pauseBtn.style.display = 'inline-block';
                resumeBtn.style.display = 'none';
            }
        } else {
            startBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'none';
        }
    });
}
