// Progress Chart Implementation using Chart.js

let progressChart = null;

function createProgressChart(ctx, data, type = 'bar') {
    if (progressChart) {
        progressChart.destroy();
    }

    progressChart = new Chart(ctx, {
        type: type,
        data: {
            labels: data.labels,
            datasets: [{
                label: data.label,
                data: data.values,
                backgroundColor: 'rgba(59, 130, 246, 0.5)', // blue
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                fill: type === 'line' ? false : true,
                tension: 0.1,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'white'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    cornerRadius: 4,
                    padding: 8
                }
            }
        }
    });
}

// Prepare data for last 7 days
function prepareLast7DaysData(tasks) {
    const today = new Date();
    const labels = [];
    const values = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

        const tasksForDay = tasks.filter(t => t.date === dateStr && t.completed);
        const totalHours = tasksForDay.reduce((sum, t) => sum + t.duration, 0);
        values.push(totalHours);
    }

    return { labels, values, label: 'Hours Trained' };
}

// Initialize and render the chart
function renderProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const data = prepareLast7DaysData(userData.tasks);
    createProgressChart(ctx, data, 'bar');
}

// Update chart when data changes
document.addEventListener('taskUpdated', () => {
    if (typeof userData !== 'undefined') {
        renderProgressChart();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof userData !== 'undefined') {
        renderProgressChart();
    }
});
