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

  return null; // Placeholder for next part
};

export default ProgressChart;
