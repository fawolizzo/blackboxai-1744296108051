// DOM Elements
const profileBtn = document.getElementById('profileBtn');
const notificationBtn = document.getElementById('notificationBtn');
const completionAlert = document.getElementById('completionAlert');
const dailyProgress = document.querySelector('.daily-progress');
const streakBadge = document.querySelector('.streak-badge');
const tasksContainer = document.querySelector('.tasks-container');
const logsContainer = document.querySelector('.logs-container');
const addLogBtn = document.querySelector('.add-log-btn');
const addTaskBtn = document.querySelector('.add-task-btn');

// Create Reset Button
const resetBtn = document.createElement('button');
resetBtn.className = 'mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition w-full flex items-center justify-center';
resetBtn.innerHTML = '<i class="fas fa-trash-alt mr-2"></i>Reset Training Plan';

// Add Reset button after Add Task button
document.querySelector('.buttons-container').appendChild(resetBtn);

// Utility functions
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

// Data persistence functions
function saveData() {
    localStorage.setItem('chessTracker', JSON.stringify(userData));
}

function loadData() {
    const saved = localStorage.getItem('chessTracker');
    if (saved) {
        userData = JSON.parse(saved);
        
        // Ensure all tasks have dates
        userData.tasks.forEach(task => {
            if (!task.date) {
                task.date = getToday();
            }
        });
        
        // Update total hours
        updateTotalHours();
        
        // Update UI with loaded data
        updateUI();
        updateProgressChart();
        
        // Restore tasks with their completed state
        restoreTasks();
        
        // Restore logs with dates
        restoreLogs();
    } else {
        initializeTasks();
    }
}

// Function to initialize tasks
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

// Timer variables
let timerInterval = null;
let timerRemaining = 0;
let activeTaskId = null;
let timerPaused = false;

// Utility functions
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

// Timer functions
function startTimer(taskId) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    activeTaskId = taskId;
    const task = userData.tasks.find(t => t.id === taskId);
    timerRemaining = Math.floor(task.duration * 60);
    timerPaused = false;
    updateTimerDisplay(taskId);
    updateTimerButtons(taskId);
    timerInterval = setInterval(() => {
        if (!timerPaused) {
            timerRemaining--;
            updateTimerDisplay(taskId);
            if (timerRemaining <= 0) {
                clearInterval(timerInterval);
                completeTask(taskId);
                updateTimerButtons(null);
            }
        }
    }, 1000);
}

function pauseTimer() {
    timerPaused = true;
    updateTimerButtons(activeTaskId);
}

function resumeTimer() {
    timerPaused = false;
    updateTimerButtons(activeTaskId);
}

function updateTimerDisplay(taskId) {
    const timerSpan = document.querySelector(`#timer-${taskId}`);
    if (timerSpan) {
        timerSpan.textContent = formatTime(timerRemaining);
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
        addLogEntry(`Completed: ${userData.tasks[taskIndex].text}`);
        activeTaskId = null;
        timerInterval = null;
        timerRemaining = 0;
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
                <button id="start-btn-${task.id}" class="start-btn bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600" data-task-id="${task.id}">Start</button>
                <button id="pause-btn-${task.id}" class="pause-btn bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 hidden" data-task-id="${task.id}">Pause</button>
                <button id="resume-btn-${task.id}" class="resume-btn bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 hidden" data-task-id="${task.id}">Resume</button>
            </div>
        `;
        tasksContainer.appendChild(taskDiv);
    });
    setupCheckboxListeners();
    updateDailyProgress();
}

// Event listeners
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

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupCheckboxListeners();
    updateProgressChart();
});
