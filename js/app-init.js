// js/app-init.js — Initialization and UI setup for Chess Tracker

document.addEventListener('DOMContentLoaded', () => {
  // Load user data
  const saved = localStorage.getItem('chessTracker');
  if (saved) {
    userData = JSON.parse(saved);
    // Ensure all tasks have dates
    userData.tasks.forEach(task => {
      if (!task.date) {
        task.date = getToday();
      }
    });
    updateUI();
    updateProgressChart();
    restoreTasks();
    // Render collapsible logs
    import('./logs-collapsible.js').then(module => {
      module.renderCollapsibleLogs(
        userData.logs,
        document.querySelector('.logs-container'),
        date => calculateDailyHours(userData.tasks, date),
        formatDuration
      );
    });
  } else {
    initializeTasks();
  }

  // Setup event listeners and refresh UI
  setupCheckboxListeners();
  updateProgressChart();
});
