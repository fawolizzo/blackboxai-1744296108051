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

// Initialize tasks
function initializeTasks() {
    tasksContainer.innerHTML = '';
    userData.tasks.forEach((task, index) => {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.innerHTML = `
            <label class="task-label">
                <input type="checkbox" class="task-checkbox" data-duration="${task.duration}">
                <span class="ml-3">${task.text} (${formatDuration(task.duration)})</span>
            </label>
        `;
        tasksContainer.appendChild(taskDiv);
    });
    setupCheckboxListeners();
    updateDailyProgress();
}

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
        duration: duration
    };
    userData.tasks.push(newTask);
    
    // Create new task element
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.innerHTML = `
        <label class="task-label">
            <input type="checkbox" class="task-checkbox" data-duration="${duration}">
            <span class="ml-3">${text} (${formatDuration(duration)})</span>
        </label>
    `;
    
    tasksContainer.appendChild(taskDiv);
    
    // Setup listeners for the new task
    setupCheckboxListeners();
    
    // Update daily progress counter
    updateDailyProgress();
    saveData();
}

// Add Log Entry button click handler
addLogBtn.addEventListener('click', () => {
    const logText = prompt('Enter log entry:');
    if (logText) {
        addLogEntry(logText, true);
    }
});

function addLogEntry(text, skipDuplicateCheck = false) {
    // Check for duplicate entries if not explicitly skipped
    if (!skipDuplicateCheck) {
        const lastLog = userData.logs[0];
        if (lastLog && lastLog.text === text) {
            return; // Skip duplicate entries
        }
    }
    
    const newLog = {
        timestamp: new Date().toLocaleString(),
        text: text
    };
    userData.logs.unshift(newLog);
    
    // Create new log element
    const logDiv = document.createElement('div');
    logDiv.className = 'border-l-4 border-green-500 pl-4 p-3 hover:bg-gray-50 rounded-lg transition';
    logDiv.innerHTML = `
        <p class="text-sm text-gray-600">${newLog.timestamp}</p>
        <p>${text}</p>
    `;
    
    // Insert before the first child of logsContainer
    if (logsContainer.firstChild) {
        logsContainer.insertBefore(logDiv, logsContainer.firstChild);
    } else {
        logsContainer.appendChild(logDiv);
    }
    
    // Save data to local storage
    saveData();
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

    // Recalculate total hours trained from completed tasks
    userData.hoursTrained = userData.tasks.reduce((total, task) => {
        return total + (task.completed ? task.duration : 0);
    }, 0);

    // Update progress immediately
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

// Update progress and check streak
function updateProgress() {
    const totalTasks = userData.tasks.length;
    const completedTasks = userData.tasks.filter(t => t.completed).length;
    userData.completionRate = Math.round((completedTasks / totalTasks) * 100);

    // Check if all tasks are completed
    if (completedTasks === totalTasks && completedTasks > 0) {
        const today = getToday();
        
        // Check if we already have an entry for today
        const todayProgress = userData.dailyProgress.find(p => p.date === today);
        
        if (todayProgress) {
            // Update today's progress
            todayProgress.completionRate = userData.completionRate;
            todayProgress.hoursSpent = userData.tasks.reduce((acc, task) => acc + (task.completed ? task.duration : 0), 0);
        } else {
            // Add new progress entry
            userData.dailyProgress.push({
                date: today,
                completionRate: userData.completionRate,
                hoursSpent: userData.tasks.reduce((acc, task) => acc + (task.completed ? task.duration : 0), 0)
            });

            // Check streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            const hasYesterday = userData.dailyProgress.some(p => p.date === yesterdayStr);
            
            if (!hasYesterday) {
                // Reset streak if we missed yesterday
                userData.streak = 1;
            } else {
                // Increment streak
                userData.streak++;
            }
        }

        // Sort progress by date
        userData.dailyProgress.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Keep only last 30 days of progress
        if (userData.dailyProgress.length > 30) {
            userData.dailyProgress = userData.dailyProgress.slice(0, 30);
        }

        // Show completion alert and animations
        showCompletionAlert();
        pulseStats();

        // Update progress chart
        updateProgressChart();
    }

    // Correct total hours trained display
    userData.hoursTrained = Math.floor(userData.hoursTrained) + (userData.hoursTrained % 1) * 60 / 60;
    updateUI();
}

// Update daily progress counter with animation
function updateDailyProgress() {
    const totalTasks = userData.tasks.length;
    const completedTasks = userData.tasks.filter(t => t.completed).length;
    dailyProgress.textContent = `${completedTasks}/${totalTasks} Complete`;
    dailyProgress.classList.add('updated');
    setTimeout(() => dailyProgress.classList.remove('updated'), 1000);
}

// Show completion alert with animation
function showCompletionAlert() {
    completionAlert.classList.add('slide-in');
    createConfetti();
    showStreakBadge();
}

// Create confetti effect
function createConfetti() {
    const colors = ['#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];
    const confettiCount = 50;
    
    Array.from({ length: confettiCount }).forEach(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.opacity = Math.random() * 0.5 + 0.5;
        confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
        confetti.style.animationDelay = (Math.random() * 0.5) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    });
}

// Show streak badge
function showStreakBadge() {
    streakBadge.classList.add('show');
    setTimeout(() => {
        streakBadge.classList.remove('show');
    }, 3000);
}

// Add pulse animation to stats
function pulseStats() {
    document.querySelectorAll('.text-2xl').forEach(stat => {
        stat.classList.add('stat-update');
        setTimeout(() => stat.classList.remove('stat-update'), 500);
    });
}

// Update progress chart with animation
function updateProgressChart() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;

    // Get last 7 days of progress, sorted by date
    const last7Days = userData.dailyProgress
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7)
        .reverse();
    
    if (last7Days.length === 0) {
        chartContainer.innerHTML = '<p class="text-gray-500 text-center">Complete your daily tasks to see progress</p>';
        return;
    }

    let chartHTML = '';
    last7Days.forEach(day => {
        const height = Math.max(20, day.completionRate);
        chartHTML += `
            <div class="flex flex-col items-center">
                <div class="chart-bar bg-blue-500 w-16 rounded-t-lg relative group cursor-pointer" style="height: 0%">
                    <div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        ${day.completionRate}% Complete<br>${formatDuration(day.hoursSpent)} Trained
                    </div>
                </div>
                <p class="text-xs mt-2">${day.date}</p>
            </div>
        `;
    });

    chartContainer.innerHTML = chartHTML;

    // Animate bars after a short delay
    setTimeout(() => {
        chartContainer.querySelectorAll('.chart-bar').forEach((bar, i) => {
            const height = Math.max(20, last7Days[i].completionRate);
            bar.style.height = `${height}%`;
        });
    }, 100);
}

// Save data to local storage
function saveData() {
    localStorage.setItem('chessTracker', JSON.stringify(userData));
}

// Load data from local storage
function loadData() {
    const saved = localStorage.getItem('chessTracker');
    if (saved) {
        userData = JSON.parse(saved);
        
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

// Function to restore tasks with their completed state
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
                <input type="checkbox" class="task-checkbox" data-duration="${task.duration}" ${task.completed ? 'checked' : ''}>
                <span class="ml-3">${task.text} (${formatDuration(task.duration)})</span>
            </label>
        `;
        tasksContainer.appendChild(taskDiv);
    });
    setupCheckboxListeners();
    updateDailyProgress();
}
</edit_file>
