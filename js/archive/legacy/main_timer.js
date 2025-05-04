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

// Load data from local storage
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

// Function to convert hours and minutes to hours
function convertToHours(hours, minutes) {
    return hours + (minutes / 60);
}

// Function to get today's date in YYYY-MM-DD format
function getToday() {
    const date = new Date();
    return date.toISOString().split('T')[0];
}

// Function to convert hours to hours and minutes display
function formatDuration(duration) {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    
    // Handle rounding edge case where minutes = 60
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

// Timer variables
let timerInterval = null;
let timerRemaining = 0;
let activeTaskId = null;
let timerPaused = false;

// Function to format time in mm:ss
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Function to start timer for a task
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

// Function to pause timer
function pauseTimer() {
    timerPaused = true;
    updateTimerButtons(activeTaskId);
}

// Function to resume timer
function resumeTimer() {
    timerPaused = false;
    updateTimerButtons(activeTaskId);
}

// Function to update timer display in UI
function updateTimerDisplay(taskId) {
    const timerSpan = document.querySelector(`#timer-${taskId}`);
    if (timerSpan) {
        timerSpan.textContent = formatTime(timerRemaining);
    }
}

// Function to update timer buttons in UI
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

// Function to complete task when timer ends
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

// Event delegation for task clicks to prevent timer start/pause/resume on label click
tasksContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
        // Checkbox clicked, handle task completion
        return;
    }
    if (e.target.closest('.task-label')) {
        e.preventDefault();
    }
});

// Event delegation for timer button clicks
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

// Add Task button click handler
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

// Add new task
function addTask(text, duration) {
    const newTask = {
        id: userData.tasks.length + 1,
        text: text,
        completed: false,
        duration: duration,
        date: getToday()
    };
    userData.tasks.push(newTask);
    
    // Create new task element
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
    
    // Setup listeners for the new task
    setupCheckboxListeners();
    
    // Update daily progress counter
    updateDailyProgress();
    saveData();
}

// Restore tasks with timer span and data-task-id attribute
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

// Handle task completion
function handleTaskCompletion(checkbox, index) {
    const taskItem = checkbox.closest('.task-item');
    const taskText = taskItem.querySelector('span').textContent;
    const task = userData.tasks[index];
    
    if (checkbox.checked) {
        taskItem.classList.add('task-completed');
        task.completed = true;
        
        // Add to training log immediately, with duplicate check
        addLogEntry(`Completed: ${taskText}`);
    } else {
        taskItem.classList.remove('task-completed');
        task.completed = false;
    }

    // Update total hours and progress
    updateTotalHours();
    updateProgress();
    updateDailyProgress();
    saveData();
}

// Setup checkbox listeners
function setupCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', () => handleTaskCompletion(checkbox, index));
        
        // Restore checked state if task was completed
        if (userData.tasks[index].completed) {
            checkbox.checked = true;
            checkbox.closest('.task-item').classList.add('task-completed');
        }
    });
}

// Calculate total hours for a specific date
function calculateDailyHours(tasks, date) {
    return tasks
        .filter(task => task.date === date && task.completed)
        .reduce((total, task) => total + task.duration, 0);
}

// Calculate total hours across all days
function calculateTotalHours() {
    // Get unique dates from tasks
    const dates = [...new Set(userData.tasks.map(task => task.date))];
    
    // Sum up hours for each date
    return dates.reduce((total, date) => {
        const dailyHours = calculateDailyHours(userData.tasks, date);
        return total + dailyHours;
    }, 0);
}

// Update total hours in userData
function updateTotalHours() {
    const total = calculateTotalHours();
    userData.hoursTrained = total;
    saveData();
}

// Function to restore logs
function restoreLogs() {
    logsContainer.innerHTML = '';
    
    // Group logs by date
    const logsByDate = {};
    userData.logs.forEach(log => {
        const date = log.date || new Date(log.timestamp).toLocaleDateString();
        if (!logsByDate[date]) {
            logsByDate[date] = [];
        }
        logsByDate[date].push(log);
    });
    
    // Create date sections for logs
    Object.keys(logsByDate)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(date => {
            // Calculate daily hours
            const dailyHours = calculateDailyHours(userData.tasks, date);
            
            // Add date header with hours
            const dateHeader = document.createElement('div');
            dateHeader.className = 'text-lg font-semibold text-blue-600 mb-4 mt-6 border-b pb-2 flex justify-between items-center';
            dateHeader.innerHTML = `
                <span>${date === new Date().toLocaleDateString() ? 'Today' : date}</span>
                <span class="text-sm text-gray-600">Hours: ${formatDuration(dailyHours)}</span>
            `;
            logsContainer.appendChild(dateHeader);
            
            // Add logs for this date
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

// Update UI with current data
function updateUI() {
    // Update profile section
    document.querySelector('h2').textContent = `Welcome, ${userData.name}!`;
    document.querySelector('p').textContent = `Rating: ${userData.rating} • Goal: ${userData.goal}`;
    
    // Calculate total hours
    const totalHours = calculateTotalHours();
    
    // Update statistics
    document.querySelectorAll('.streak-count').forEach(el => el.textContent = userData.streak);
    document.querySelector('.completion-rate').textContent = `${userData.completionRate}%`;
    document.querySelectorAll('.hours-trained').forEach(el => el.textContent = formatDuration(totalHours));
}

// Reset Training Plan
resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your training plan? This will clear all tasks and logs.')) {
        userData.tasks = [];
        userData.logs = [];
        userData.hoursTrained = 0;
        userData.completionRate = 0;
        userData.streak = 0;
        userData.dailyProgress = [];
        
        // Clear tasks and logs containers
        tasksContainer.innerHTML = '';
        logsContainer.innerHTML = '';
        
        updateUI();
        updateDailyProgress();
        saveData();
    }
});

// Event Listeners
profileBtn.addEventListener('click', () => {
    // Update name
    const newName = prompt('Enter your name:', userData.name);
    if (newName) {
        userData.name = newName;
    }

    // Update rating
    const newRating = prompt('Enter your current rating:', userData.rating);
    if (newRating && !isNaN(newRating)) {
        userData.rating = parseInt(newRating);
    }

    // Update goal
    const newGoal = prompt('Enter your rating goal:', userData.goal);
    if (newGoal && !isNaN(newGoal)) {
        userData.goal = parseInt(newGoal);
    }

    // Update UI and save changes
    if (newName || newRating || newGoal) {
        updateUI();
        saveData();
    }
});

notificationBtn.addEventListener('click', () => {
    alert('Daily Reminder: Complete your training tasks to maintain your streak!');
});

// Function to update progress chart
function updateProgressChart() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;

    // Clear existing content
    chartContainer.innerHTML = '';

    // Get last 7 days of tasks
    const today = new Date();
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    // Calculate completion rate for each day
    const dailyStats = last7Days.map(date => {
        const tasksForDay = userData.tasks.filter(task => task.date === date);
        const completedTasks = tasksForDay.filter(task => task.completed);
        const completionRate = tasksForDay.length ? (completedTasks.length / tasksForDay.length) * 100 : 0;
        return {
            date: date,
            completionRate: completionRate
        };
    });

    // Create bars
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupCheckboxListeners();
    updateProgressChart();
});
