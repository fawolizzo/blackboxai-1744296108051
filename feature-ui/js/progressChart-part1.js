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
