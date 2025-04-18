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

// Sample user data
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
    timerInterval = setInterval(() => {
        if (!timerPaused) {
            timerRemaining--;
            updateTimerDisplay(taskId);
            if (timerRemaining <= 0) {
                clearInterval(timerInterval);
                completeTask(taskId);
            }
        }
    }, 1000);
}

// Function to pause timer
function pauseTimer() {
    timerPaused = true;
}

// Function to resume timer
function resumeTimer() {
    timerPaused = false;
}

// Function to update timer display in UI
function updateTimerDisplay(taskId) {
    const timerSpan = document.querySelector(`#timer-${taskId}`);
    if (timerSpan) {
        timerSpan.textContent = formatTime(timerRemaining);
    }
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

// Event delegation for task clicks to start/pause/resume timer
tasksContainer.addEventListener('click', (e) => {
    const taskLabel = e.target.closest('.task-label');
    if (!taskLabel) return;
    const taskDiv = taskLabel.closest('.task-item');
    if (!taskDiv) return;
    const taskId = parseInt(taskDiv.querySelector('input[type="checkbox"]').dataset.taskId);
    if (activeTaskId === taskId) {
        if (timerPaused) {
            resumeTimer();
        } else {
            pauseTimer();
        }
    } else {
        startTimer(taskId);
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
    taskDiv.className = 'task-item';
    taskDiv.innerHTML = `
        <label class="task-label">
            <input type="checkbox" class="task-checkbox" data-duration="${duration}" data-task-id="${newTask.id}">
            <span class="ml-3">${text} (${formatDuration(duration)})</span>
            <span id="timer-${newTask.id}" class="ml-4 font-mono text-sm text-blue-600">00:00</span>
        </label>
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
        taskDiv.className = 'task-item';
        if (task.completed) {
            taskDiv.classList.add('task-completed');
        }
        taskDiv.innerHTML = `
            <label class="task-label">
                <input type="checkbox" class="task-checkbox" data-duration="${task.duration}" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="ml-3">${task.text} (${formatDuration(task.duration)})</span>
                <span id="timer-${task.id}" class="ml-4 font-mono text-sm text-blue-600">00:00</span>
            </label>
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupCheckboxListeners();
    updateProgressChart();
});
