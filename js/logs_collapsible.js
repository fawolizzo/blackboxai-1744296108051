// logs_collapsible.js
// This module provides a function to render logs with date grouping and collapsible sections.
// It is designed to integrate with the existing app without changing other parts.

// Usage:
// Call renderCollapsibleLogs(logs, containerElement, calculateDailyHours, formatDuration)
// logs: array of log objects with timestamp, text, date, time
// containerElement: DOM element to render logs into
// calculateDailyHours: function(date) => number of hours trained on that date
// formatDuration: function(duration) => formatted string for hours

export function renderCollapsibleLogs(logs, containerElement, calculateDailyHours, formatDuration) {
    containerElement.innerHTML = '';

    // Group logs by date
    const logsByDate = {};
    logs.forEach(log => {
        const date = log.date || new Date(log.timestamp).toLocaleDateString();
        if (!logsByDate[date]) {
            logsByDate[date] = [];
        }
        logsByDate[date].push(log);
    });

    // Create date sections for logs with collapse functionality
    Object.keys(logsByDate)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(date => {
            // Calculate daily hours
            const dailyHours = calculateDailyHours(date);

            // Create a container for this date's logs
            const dateSection = document.createElement('div');
            dateSection.className = 'mb-6';

            // Add date header with hours and collapse button
            const dateHeader = document.createElement('div');
            dateHeader.className = 'text-lg font-semibold text-blue-600 mb-4 mt-6 border-b pb-2 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition-colors';
            dateHeader.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-chevron-down mr-2 text-sm text-gray-400 transition-transform"></i>
                    <span>${date === new Date().toLocaleDateString() ? 'Today' : date}</span>
                </div>
                <span class="text-sm text-gray-600">Hours: ${formatDuration(dailyHours)}</span>
            `;

            // Create container for logs
            const logsWrapper = document.createElement('div');
            logsWrapper.className = 'space-y-2';

            // Add logs for this date
            logsByDate[date].forEach(log => {
                const logDiv = document.createElement('div');
                logDiv.className = 'border-l-4 border-green-500 pl-4 p-3 hover:bg-gray-50 rounded-lg transition mb-2';
                logDiv.innerHTML = `
                    <p class="text-sm text-gray-600">${log.time || new Date(log.timestamp).toLocaleTimeString()}</p>
                    <p>${log.text}</p>
                `;
                logsWrapper.appendChild(logDiv);
            });

            // Add click handler for collapsing
            dateHeader.addEventListener('click', () => {
                const icon = dateHeader.querySelector('i');
                if (logsWrapper.style.display === 'none') {
                    logsWrapper.style.display = 'block';
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    logsWrapper.style.display = 'none';
                    icon.style.transform = 'rotate(-90deg)';
                }
            });

            dateSection.appendChild(dateHeader);
            dateSection.appendChild(logsWrapper);
            containerElement.appendChild(dateSection);
        });
}
