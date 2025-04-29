// Stats management
function updateStats() {
    // Get stats elements
    const activeTasksEl = document.getElementById('active-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const totalTimeEl = document.getElementById('total-time');

    // Only update if elements exist
    if (activeTasksEl && completedTasksEl && totalTimeEl) {
        const activeTasks = userData.tasks.filter(task => !task.completed).length;
        const completedTasks = userData.tasks.filter(task => task.completed).length;
        const totalTime = calculateTotalTime();

        // Update stats display
        activeTasksEl.textContent = activeTasks;
        completedTasksEl.textContent = completedTasks;
        totalTimeEl.textContent = formatTimeForStats(totalTime);
    }
}

function calculateTotalTime() {
    return userData.tasks
        .filter(task => task.completed)
        .reduce((total, task) => total + (task.duration * 3600), 0); // Convert hours to seconds
}

// Format time from seconds to "Xh Ym" format
function formatTimeForStats(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    
    if (hours === 0) {
        return `${minutes}m`;
    } else if (minutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
}

// Initialize stats when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initial stats update
    updateStats();
    
    // Listen for task updates
    document.addEventListener('taskUpdated', updateStats);
});
