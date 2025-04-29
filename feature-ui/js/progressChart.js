let progressChart = null;

const TIME_RANGES = [7, 30, 90];
let currentRangeIndex = 0;
let currentChartType = 'bar';

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
                backgroundColor: type === 'bar' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(16, 185, 129, 0.5)',
                borderColor: type === 'bar' ? 'rgba(59, 130, 246, 1)' : 'rgba(16, 185, 129, 1)',
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

function prepareData(tasks, range, type) {
    const today = new Date();
    const labels = [];
    const values = [];

    for (let i = range - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

        const tasksForDay = tasks.filter(t => t.date === dateStr && t.completed);
        if (type === 'bar') {
            const totalHours = tasksForDay.reduce((sum, t) => sum + t.duration, 0);
            values.push(totalHours);
        } else {
            values.push(tasksForDay.length);
        }
    }

    return { labels, values, label: type === 'bar' ? 'Hours Trained' : 'Tasks Completed' };
}

function renderChart() {
    const ctx = document.getElementById('progressChartCanvas').getContext('2d');
    const data = prepareData(userData.tasks, TIME_RANGES[currentRangeIndex], currentChartType);
    createProgressChart(ctx, data, currentChartType);

    // Update summary stats
    document.getElementById('currentStreak').textContent = `${userData.streak} days`;
    const totalHours = userData.hoursTrained;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    document.getElementById('totalTrainingHours').textContent = `${hours}h ${minutes}m`;
}

document.addEventListener('DOMContentLoaded', () => {
    renderChart();

    document.getElementById('hoursBtn').addEventListener('click', () => {
        currentChartType = 'bar';
        renderChart();
    });

    document.getElementById('tasksBtn').addEventListener('click', () => {
        currentChartType = 'line';
        renderChart();
    });

    document.getElementById('prevRangeBtn').addEventListener('click', () => {
        if (currentRangeIndex > 0) {
            currentRangeIndex--;
            renderChart();
            updateTimeRangeLabel();
        }
    });

    document.getElementById('nextRangeBtn').addEventListener('click', () => {
        if (currentRangeIndex < TIME_RANGES.length - 1) {
            currentRangeIndex++;
            renderChart();
            updateTimeRangeLabel();
        }
    });

    updateTimeRangeLabel();
});

function updateTimeRangeLabel() {
    const label = document.getElementById('timeRangeLabel');
    if (!label) return;
    const range = TIME_RANGES[currentRangeIndex];
    label.textContent = `Last ${range} Days`;
}
