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
