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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
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
    timerPaused = false;
    timerStartTime = Date.now();
    timerEndTime = timerStartTime + Math.floor(task.duration * 3600 * 1000);
    updateTimerDisplay(taskId);
    updateTimerButtons(taskId);
    saveTimerState();
    timerInterval = setInterval(() => {
        if (!timerPaused) {
            const now = Date.now();
            let remainingMs = timerEndTime - now;
            if (remainingMs < 0) remainingMs = 0;
            const remainingSeconds = Math.floor(remainingMs / 1000);
            updateTimerDisplayWithSeconds(taskId, remainingSeconds);
            saveTimerState();
            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                completeTask(taskId);
                updateTimerButtons(null);
                clearTimerState();
            }
        }
    }, 1000);
}

function pauseTimer() {
    timerPaused = true;
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
            <span class="ml-3">${text} (${formatDuration(duration)})</span>
        </label>
        <div class="timer-controls flex items-center space-x-2 ml-4">
            <span id="timer-${newTask.id}" class="font-mono text-sm text-blue-600">00:00</span>
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
    }
}

function restoreTasks() {
    tasksContainer.innerHTML = '';
    userData.tasks.forEach((task, index) => {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item flex items-center justify-between';
        if (task.completed) {
            taskDiv.classList.add('task-completed');
        }
        taskDiv.innerHTML = `
            <label class="task-label flex items-center flex-grow cursor-pointer">
                <input type="checkbox" class="task-checkbox" data-duration="${task.duration}" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="ml-3">${task.text} (${formatDuration(task.duration)})</span>
            </label>
            <div class="timer-controls flex items-center space-x-2 ml-4">
                <span id="timer-${task.id}" class="font-mono text-sm text-blue-600">00:00</span>
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
            dateHeader.className = 'text-lg font-semibold text-blue-600 mb-4 mt-6 border-b pb-2 flex justify-between items-center';
            dateHeader.innerHTML = `
                <span>${date === new Date().toLocaleDateString() ? 'Today' : date}</span>
                <span class="text-sm text-gray-600">Hours: ${formatDuration(dailyHours)}</span>
            `;
            logsContainer.appendChild(dateHeader);
            
            logsByDate[date].forEach(log => {
                const logDiv = document.createElement('div');
                logDiv.className = 'border-l-4 border-green-500 pl-4 p-3 hover:bg-gray-50 rounded-lg transition mb-2';
                logDiv.innerHTML = `
                    <p class="text-sm text-gray-600">${log.time || new Date(log.timestamp).toLocaleTimeString()}</p>
                    <p>${log.text}</p>
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
        bar.className = 'w-8 bg-blue-200 rounded-t transition-all duration-500';
        bar.style.height = `${stat.completionRate}%`;

        const label = document.createElement('div');
        label.className = 'text-xs text-gray-500 mt-2';
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
            pauseTimer();
            timerPauseTime = Date.now();
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

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM Elements
    profileBtn = document.getElementById('profileBtn');
    notificationBtn = document.getElementById('notificationBtn');
    completionAlert = document.getElementById('completionAlert');
    dailyProgress = document.querySelector('.daily-progress');
    streakBadge = document.querySelector('.streak-badge');
    tasksContainer = document.querySelector('.tasks-container');
    logsContainer = document.querySelector('.logs-container');
    addLogBtn = document.querySelector('.add-log-btn');
    addTaskBtn = document.querySelector('.add-task-btn');

    // Create Reset Button
    resetBtn = document.createElement('button');
    resetBtn.className = 'mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition w-full flex items-center justify-center';
    resetBtn.innerHTML = '<i class="fas fa-trash-alt mr-2"></i>Reset Training Plan';

    // Add Reset button after Add Task button
    document.querySelector('.buttons-container').appendChild(resetBtn);

    // Initialize event listeners
    setupEventListeners();

    // Load data and update UI
    loadData();
    setupCheckboxListeners();
    updateProgressChart();
});
