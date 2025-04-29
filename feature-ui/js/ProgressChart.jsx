import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';

const ProgressChart = ({ data, streak, totalHours }) => {
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState(7);

  // Prepare chart data based on chartType and timeRange
  const prepareChartData = () => {
    // Filter data for the selected time range
    const filteredData = data.slice(-timeRange);

    const labels = filteredData.map(d => d.date);
    const values = filteredData.map(d => chartType === 'bar' ? d.hours : d.tasks);

    return {
      labels,
      datasets: [
        {
          label: chartType === 'bar' ? 'Hours Trained' : 'Tasks Completed',
          data: values,
          backgroundColor: chartType === 'bar' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(16, 185, 129, 0.5)',
          borderColor: chartType === 'bar' ? 'rgba(59, 130, 246, 1)' : 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          fill: chartType === 'line' ? false : true,
          tension: 0.1,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  const options = {
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
  };

  return (
    <div className="bg-[#1E293B] rounded-lg p-6 shadow-lg text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <i className="fas fa-chart-line"></i> Progress Chart
        </h3>
        <div className="flex items-center gap-4">
          <button
            className={`px-3 py-1 rounded ${chartType === 'bar' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setChartType('bar')}
          >
            Hours
          </button>
          <button
            className={`px-3 py-1 rounded ${chartType === 'line' ? 'bg-green-600' : 'bg-gray-700'}`}
            onClick={() => setChartType('line')}
          >
            Tasks
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <button
          className="text-gray-400 hover:text-white"
          onClick={() => setTimeRange(7)}
          disabled={timeRange === 7}
        >
          {'< Last 7 Days >'}
        </button>
        {/* Additional time ranges can be added here */}
      </div>
      <div style={{ height: '300px' }}>
        {chartType === 'bar' ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-white">
        <div className="bg-[#273549] p-4 rounded-lg">
          <p className="text-sm">Current Streak</p>
          <p className="text-2xl font-bold">{streak} days</p>
        </div>
        <div className="bg-[#273549] p-4 rounded-lg">
          <p className="text-sm">Total Training Hours</p>
          <p className="text-2xl font-bold">{totalHours}</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
