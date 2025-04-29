const ProgressChartPart2 = ({ chartData, chartType, options, setChartType, setTimeRange, timeRange, streak, totalHours }) => {
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

export default ProgressChartPart2;
