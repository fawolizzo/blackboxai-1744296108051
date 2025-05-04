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
    // Check for saved theme or system preference
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
const TIMER_REMAINING_KEY = 'timerRemainingSeconds';

// Checkbox event handlers
function setupCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', () => {
            const taskId = parseInt(checkbox.dataset.taskId);
            const taskIndex = userData.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                const task = userData.tasks[taskIndex];
                const taskText = checkbox.closest('.task-label').querySelector('span').textContent;
                
                if (checkbox.checked && !task.completed) {
                    task.completed = true;
                    checkbox.closest('.task-item').classList.add('task-completed');
                    addLogEntry(`Completed: ${taskText}`);
                } else if (!checkbox.checked && task.completed) {
                    task.completed = false;
                    checkbox.closest('.task-item').classList.remove('task-completed');
                }
                
                updateTotalHours();
                updateProgress();
                updateDailyProgress();
                saveData();
            }
        });
        
        // Restore checked state if task was completed
        const taskId = parseInt(checkbox.dataset.taskId);
        const task = userData.tasks.find(t => t.id === taskId);
        if (task && task.completed) {
            checkbox.checked = true;
            checkbox.closest('.task-item').classList.add('task-completed');
        }
    });
}

let timerInterval = null;
let activeTaskId = null;
let timerPaused = false;
let timerStartTime = null;
let timerEndTime = null;
let timerPauseTime = null; // NEW
let timerRemaining = 0;    // optional but used elsewhere


// Handle page visibility to avoid throttling issues
document.addEventListener('visibilitychange', () => {
    if (activeTaskId === null) return;

    if (document.hidden) {
        // Page is hidden, clear interval to avoid throttling
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    } else {
        // Page is visible, update timer display immediately and restart interval if not paused
        updateTimerDisplay(activeTaskId);
        if (!timerPaused && !timerInterval) {
            timerInterval = setInterval(() => {
                if (!timerPaused) {
                    const now = Date.now();
                    let remainingMs = timerEndTime - now;
                    if (remainingMs < 0) remainingMs = 0;
                    const remainingSeconds = Math.floor(remainingMs / 1000);
                    updateTimerDisplayWithSeconds(activeTaskId, remainingSeconds);
                    saveTimerState();
                    if (remainingSeconds <= 0) {
                        clearInterval(timerInterval);
                        completeTask(activeTaskId);
                        updateTimerButtons(null);
                        clearTimerState();
                    }
                }
            }, 1000);
        }
    }
});

function getToday() {
    const date = new Date();
    return date.toISOString().split('T')[0];
}

function convertToHours(hours, minutes) {
    return hours + (minutes / 60);
}

function formatDuration(duration) {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    
    if (minutes === 60) {
        return `${hours + 1}h`;
    }
    
    if (hours === 0) {
        return `${minutes}m`;
    } else if (minutes === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h ${minutes}m`;
    }
}

function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// UI Update functions
function updateUI() {
    // Update profile section
    document.querySelector('h2').textContent = `Welcome, ${userData.name}!`;
    document.querySelector('p').textContent = `Rating: ${userData.rating} • Goal: ${userData.goal}`;
    
    // Update statistics
    document.querySelectorAll('.streak-count').forEach(el => el.textContent = userData.streak);
    document.querySelector('.completion-rate').textContent = `${userData.completionRate}%`;
    document.querySelectorAll('.hours-trained').forEach(el => el.textContent = formatDuration(userData.hoursTrained));
}

function updateProgress() {
    const totalTasks = userData.tasks.length;
    const completedTasks = userData.tasks.filter(task => task.completed).length;
    userData.completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    updateUI();
    updateStreak();
}

// Calculate current streak of consecutive days with completed tasks
function updateStreak() {
    if (!userData.tasks.length) {
        userData.streak = 0;
        return;
    }

    // Get unique dates with completed tasks, sorted descending
    const completedDates = [...new Set(userData.tasks
        .filter(t => t.completed)
        .map(t => t.date))]
        .sort((a, b) => new Date(b) - new Date(a));

    if (!completedDates.length) {
        userData.streak = 0;
        return;
    }

    const todayStr = getToday();
    let streak = 0;

    // If today is completed, start streak at 1, else 0
    if (completedDates[0] === todayStr) {
        streak = 1;
    }

    for (let i = 1; i < completedDates.length; i++) {
        const prevDate = new Date(completedDates[i - 1]);
        const currDate = new Date(completedDates[i]);
        const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }

    userData.streak = streak;
}

function updateDailyProgress() {
    const todaysTasks = userData.tasks.filter(task => task.date === getToday());
    const completedTasks = todaysTasks.filter(task => task.completed).length;
    dailyProgress.textContent = `${completedTasks}/${todaysTasks.length} Complete`;
}

// Timer functions
function startTimer(taskId) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    activeTaskId = taskId;
    const task = userData.tasks.find(t => t.id === taskId);
    const durationInSeconds = Math.floor(task.duration * 3600);
    timerPaused = false;
    timerStartTime = Date.now();
    timerEndTime = timerStartTime + (durationInSeconds * 1000);
    
    // Show initial time
    updateTimerDisplayWithSeconds(taskId, durationInSeconds);
    updateTimerButtons(taskId);
    saveTimerState();
    
    timerInterval = setInterval(() => {
        if (!timerPaused) {
            const now = Date.now();
            const elapsed = now - timerStartTime;
            const remaining = durationInSeconds - Math.floor(elapsed / 1000);
            
            if (remaining <= 0) {
                updateTimerDisplayWithSeconds(taskId, 0);
                clearInterval(timerInterval);
                completeTask(taskId);
                updateTimerButtons(null);
                clearTimerState();
            } else {
                updateTimerDisplayWithSeconds(taskId, remaining);
                saveTimerState();
            }
        }
    }, 1000);
}

function pauseTimer() {
    if (timerPaused) return;        // guard
    timerPaused    = true;
    timerPauseTime = Date.now();    // capture pause moment
    updateTimerButtons(activeTaskId);
    saveTimerState();
}

function resumeTimer() {
    timerPaused = false;
    // Adjust timerEndTime to account for pause duration
    timerEndTime += Date.now() - timerPauseTime;
    updateTimerButtons(activeTaskId);
    saveTimerState();
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

function saveTimerState() {
    if (activeTaskId !== null) {
        localStorage.setItem(TIMER_ACTIVE_TASK_KEY, activeTaskId.toString());
        localStorage.setItem('timerStartTime', timerStartTime.toString());
        localStorage.setItem('timerEndTime', timerEndTime.toString());
        localStorage.setItem('timerPaused', timerPaused.toString());
        if (timerPaused) {
            localStorage.setItem('timerPauseTime', timerPauseTime.toString());
        } else {
            localStorage.removeItem('timerPauseTime');
        }
    }
}

function clearTimerState() {
    localStorage.removeItem(TIMER_ACTIVE_TASK_KEY);
    localStorage.removeItem('timerStartTime');
    localStorage.removeItem('timerEndTime');
    localStorage.removeItem('timerPaused');
    localStorage.removeItem('timerPauseTime');
}

function restoreTimerState() {
    const savedTaskId = localStorage.getItem(TIMER_ACTIVE_TASK_KEY);
    const savedStartTime = localStorage.getItem('timerStartTime');
    const savedEndTime = localStorage.getItem('timerEndTime');
    const savedPaused = localStorage.getItem('timerPaused') === 'true';
    const savedPauseTime = localStorage.getItem('timerPauseTime');

    if (savedTaskId && savedStartTime && savedEndTime) {
        activeTaskId = parseInt(savedTaskId);
        timerStartTime = parseInt(savedStartTime);
        timerEndTime = parseInt(savedEndTime);
        timerPaused = savedPaused;
        timerPauseTime = savedPauseTime ? parseInt(savedPauseTime) : null;

        updateTimerDisplay(activeTaskId);
        updateTimerButtons(activeTaskId);

        if (!timerPaused) {
            timerInterval = setInterval(() => {
                if (!timerPaused) {
                    const now = Date.now();
                    let remainingMs = timerEndTime - now;
                    if (remainingMs < 0) remainingMs = 0;
                    const remainingSeconds = Math.floor(remainingMs / 1000);
                    updateTimerDisplayWithSeconds(activeTaskId, remainingSeconds);
                    saveTimerState();
                    if (remainingSeconds <= 0) {
                        clearInterval(timerInterval);
                        completeTask(activeTaskId);
                        updateTimerButtons(null);
                        clearTimerState();
                    }
                }
            }, 1000);
        }
    }
}

// Task functions
function addTask(text, duration) {
    const newTask = {
        id: userData.tasks.length + 1,
        text: text,
        completed: false,
        duration: duration,
        date: getToday()
    };
    userData.tasks.push(newTask);
    
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item flex items-center justify-between';
    taskDiv.innerHTML = `
        <label class="task-label flex items-center flex-grow cursor-pointer">
            <input type="checkbox" class="task-checkbox" data-duration="${duration}" data-task-id="${newTask.id}">
            <span class="ml-3 dark:text-gray-300">${text} (${formatDuration(duration)})</span>
        </label>
        <div class="timer-controls flex items-center space-x-2 ml-4">
            <span id="timer-${newTask.id}" class="font-mono text-sm text-blue-600 dark:text-blue-400">00:00</span>
            <button id="start-btn-${newTask.id}" class="start-btn bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600" data-task-id="${newTask.id}">Start</button>
            <button id="pause-btn-${newTask.id}" class="pause-btn bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 hidden" data-task-id="${newTask.id}">Pause</button>
            <button id="resume-btn-${newTask.id}" class="resume-btn bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 hidden" data-task-id="${newTask.id}">Resume</button>
        </div>
    </div>
    `;
    
    tasksContainer.appendChild(taskDiv);
    setupCheckboxListeners();
    updateDailyProgress();
    saveData();
}

function completeTask(taskId) {
    const taskIndex = userData.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        userData.tasks[taskIndex].completed = true;
        updateTotalHours();
        updateProgress();
        updateDailyProgress();
        saveData();
        restoreTasks();
        // Include planned duration in log entry
        addLogEntry(`Completed: ${userData.tasks[taskIndex].text} (${formatDuration(userData.tasks[taskIndex].duration)})`);
        activeTaskId = null;
        timerInterval = null;
        timerRemaining = 0;
        clearTimerState();

        // Check for achievements after completing a task
        if (window.Achievements) {
            window.Achievements.check(userData);
        }
    }
}

function restoreTasks() {
    tasksContainer.innerHTML = '';
    userData.tasks.forEach((task, index) => {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item flex items-center justify-between dark:text-white';
        if (task.completed) {
            taskDiv.classList.add('task-completed');
        }
        taskDiv.innerHTML = `
            <label class="task-label flex items-center flex-grow cursor-pointer">
                <input type="checkbox" class="task-checkbox" data-duration="${task.duration}" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="ml-3 dark:text-gray-300">${task.text} (${formatDuration(task.duration)})</span>
            </label>
            <div class="timer-controls flex items-center space-x-2 ml-4">
                <span id="timer-${task.id}" class="font-mono text-sm text-blue-600 dark:text-blue-400">00:00</span>
                ${task.completed ? '' : `
                <button id="start-btn-${task.id}" class="start-btn bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600" data-task-id="${task.id}">Start</button>
                <button id="pause-btn-${task.id}" class="pause-btn bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 hidden" data-task-id="${task.id}">Pause</button>
                <button id="resume-btn-${task.id}" class="resume-btn bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 hidden" data-task-id="${task.id}">Resume</button>
                `}
            </div>
        `;
        tasksContainer.appendChild(taskDiv);
    });
    setupCheckboxListeners();
    updateDailyProgress();
}

// Log functions
function addLogEntry(text) {
    const now = new Date();
    const newLog = {
        timestamp: now.toLocaleString(),
        date: now.toLocaleDateString(),
        text: text,
        time: now.toLocaleTimeString()
    };
    userData.logs.unshift(newLog);
    restoreLogs();
    saveData();
}

function restoreLogs() {
    logsContainer.innerHTML = '';
    
    const logsByDate = {};
    userData.logs.forEach(log => {
        const date = log.date || new Date(log.timestamp).toLocaleDateString();
        if (!logsByDate[date]) {
            logsByDate[date] = [];
        }
        logsByDate[date].push(log);
    });
    
    Object.keys(logsByDate)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(date => {
            const dailyHours = calculateDailyHours(userData.tasks, date);
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'text-lg font-semibold text-purple-700 dark:text-purple-400 mb-4 mt-6 border-b dark:border-gray-700 pb-2 flex justify-between items-center';
            dateHeader.innerHTML = `
                <span>${date === new Date().toLocaleDateString() ? 'Today' : date}</span>
                <span class="text-sm text-purple-600 dark:text-purple-400">Hours: ${formatDuration(dailyHours)}</span>
            `;
            logsContainer.appendChild(dateHeader);
            
            logsByDate[date].forEach(log => {
                const logDiv = document.createElement('div');
            logDiv.className = 'border-l-4 border-purple-500 dark:border-purple-400 pl-4 p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition mb-2 text-gray-900 dark:text-white';
                logDiv.innerHTML = `
                    <p class="text-sm text-purple-600 dark:text-purple-400">${log.time || new Date(log.timestamp).toLocaleTimeString()}</p>
                    <p class="text-gray-800 dark:text-gray-200">${log.text}</p>
                `;
                logsContainer.appendChild(logDiv);
            });
        });
}

// Hours calculation functions
function calculateDailyHours(tasks, date) {
    return tasks
        .filter(task => task.date === date && task.completed)
        .reduce((total, task) => total + task.duration, 0);
}

function calculateTotalHours() {
    const dates = [...new Set(userData.tasks.map(task => task.date))];
    return dates.reduce((total, date) => {
        const dailyHours = calculateDailyHours(userData.tasks, date);
        return total + dailyHours;
    }, 0);
}

function updateTotalHours() {
    const total = calculateTotalHours();
    userData.hoursTrained = total;
    saveData();
}

// Progress chart function
function updateProgressChart() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;

    chartContainer.innerHTML = '';

    const today = new Date();
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    const dailyStats = last7Days.map(date => {
        const tasksForDay = userData.tasks.filter(task => task.date === date);
        const completedTasks = tasksForDay.filter(task => task.completed);
        const completionRate = tasksForDay.length ? (completedTasks.length / tasksForDay.length) * 100 : 0;
        return {
            date: date,
            completionRate: completionRate
        };
    });

    dailyStats.forEach((stat, index) => {
        const barContainer = document.createElement('div');
        barContainer.className = 'flex flex-col items-center';

        const bar = document.createElement('div');
        bar.className = 'w-8 bg-blue-200 dark:bg-blue-500/30 rounded-t transition-all duration-500';
        bar.style.height = `${stat.completionRate}%`;

        const label = document.createElement('div');
        label.className = 'text-xs text-gray-500 dark:text-gray-400 mt-2';
        label.textContent = new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' });

        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        chartContainer.appendChild(barContainer);
    });
}

// Data persistence functions
function saveData() {
    localStorage.setItem('chessTracker', JSON.stringify(userData));
}

function loadData() {
    const saved = localStorage.getItem('chessTracker');
    if (saved) {
        userData = JSON.parse(saved);
        userData.tasks.forEach(task => {
            if (!task.date) {
                task.date = getToday();
            }
        });
        updateTotalHours();
        updateUI();
        updateProgressChart();
        restoreTasks();
        restoreLogs();
        restoreTimerState();
        
        // Check achievements after loading data
        if (window.Achievements) {
            window.Achievements.check(userData);
        }
    } else {
        initializeTasks();
    }
}

function initializeTasks() {
    userData = {
        name: 'Player',
        rating: 1500,
        goal: 1800,
        streak: 0,
        completionRate: 0,
        hoursTrained: 0,
        tasks: [],
        logs: [],
        dailyProgress: []
    };
    updateUI();
    saveData();
}

function setupEventListeners() {
    // Theme toggle
    themeBtn.addEventListener('click', toggleTheme);
    tasksContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            return;
        }
        if (e.target.closest('.task-label')) {
            e.preventDefault();
        }
    });

    tasksContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('start-btn')) {
        const taskId = parseInt(e.target.dataset.taskId);
        startTimer(taskId);
    } else if (e.target.classList.contains('pause-btn')) {
        pauseTimer(); // this now sets timerPauseTime internally
    } else if (e.target.classList.contains('resume-btn')) {
        resumeTimer();
    }
});

    addTaskBtn.addEventListener('click', () => {
        const taskText = prompt('Enter new task:');
        if (taskText) {
            const hours = parseInt(prompt('Enter duration hours (0 if less than 1 hour):', '0')) || 0;
            const minutes = parseInt(prompt('Enter duration minutes:', '30')) || 0;
            if (hours === 0 && minutes === 0) {
                alert('Please enter a valid duration');
                return;
            }
            const duration = convertToHours(hours, minutes);
            addTask(taskText, duration);
        }
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your training plan? This will clear all tasks and logs.')) {
            userData.tasks = [];
            userData.logs = [];
            userData.hoursTrained = 0;
            userData.completionRate = 0;
            userData.streak = 0;
            userData.dailyProgress = [];
            tasksContainer.innerHTML = '';
            logsContainer.innerHTML = '';
            updateUI();
            updateDailyProgress();
            saveData();
            clearTimerState();
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            activeTaskId = null;
            timerRemaining = 0;
            timerPaused = false;
        }
    });

    profileBtn.addEventListener('click', () => {
        const newName = prompt('Enter your name:', userData.name);
        if (newName) {
            userData.name = newName;
        }

        const newRating = prompt('Enter your current rating:', userData.rating);
        if (newRating && !isNaN(newRating)) {
            userData.rating = parseInt(newRating);
        }

        const newGoal = prompt('Enter your rating goal:', userData.goal);
        if (newGoal && !isNaN(newGoal)) {
            userData.goal = parseInt(newGoal);
        }

        if (newName || newRating || newGoal) {
            updateUI();
            saveData();
        }
    });

    notificationBtn.addEventListener('click', () => {
        alert('Daily Reminder: Complete your training tasks to maintain your streak!');
    });
}

function exportData() {
    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chess-training-backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData && typeof importedData === 'object') {
                userData = importedData;
                saveData();
                updateUI();
                updateProgressChart();
                restoreTasks();
                restoreLogs();
                restoreTimerState();
                alert('Data imported successfully!');
            } else {
                alert('Invalid data format.');
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize achievements system
    if (window.Achievements) {
        window.Achievements.init();
    }
    // Initialize DOM Elements
    profileBtn = document.getElementById('profileBtn');
    notificationBtn = document.getElementById('notificationBtn');
    completionAlert = document.getElementById('completionAlert');
    dailyProgress = document.querySelector('.daily-progress');
    streakBadge = document.querySelector('.streak-badge');
    tasksContainer = document.querySelector('.tasks-container');
    logsContainer = document.querySelector('.logs-container');
    addTaskBtn = document.querySelector('.add-task-btn');
    themeBtn = document.getElementById('themeBtn');

    // Create Reset Button
    resetBtn = document.createElement('button');
    resetBtn.className = 'mt-4 w-full rounded-lg border border-red-500 text-red-500 p-4 flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 transition-all';
    resetBtn.innerHTML = '<i class="fas fa-sync-alt"></i>Reset Training Plan';

    // Create Export Button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'mt-4 w-full rounded-lg border border-blue-500 text-blue-500 p-4 flex items-center justify-center gap-2 bg-transparent hover:bg-blue-500/10 transition-all';
    exportBtn.innerHTML = '<i class="fas fa-file-export"></i>Export Data';
    exportBtn.addEventListener('click', exportData);

    // Create Import Button and hidden file input
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = 'application/json';
    importInput.style.display = 'none';
    importInput.addEventListener('change', importData);

    const importBtn = document.createElement('button');
    importBtn.className = 'mt-4 w-full rounded-lg border border-green-500 text-green-500 p-4 flex items-center justify-center gap-2 bg-transparent hover:bg-green-500/10 transition-all';
    importBtn.innerHTML = '<i class="fas fa-file-import"></i>Import Data';
    importBtn.addEventListener('click', () => importInput.click());

    // Add buttons to the buttons container
    const buttonsContainer = document.querySelector('.buttons-container');
    buttonsContainer.appendChild(exportBtn);
    buttonsContainer.appendChild(importBtn);
    buttonsContainer.appendChild(importInput);

    // Add Reset button after Add Task button
    buttonsContainer.appendChild(resetBtn);

    // Initialize theme and event listeners
    initializeTheme();
    setupEventListeners();

    // Load data and update UI
    loadData();
    setupCheckboxListeners();
    updateProgressChart();
});
