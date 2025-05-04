// Ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const taskList = document.getElementById('task-list');
  const taskNameInput = document.getElementById('task-name');
  const taskDurationInput = document.getElementById('task-duration');
  const addTaskBtn = document.getElementById('add-task-btn');
  const logArea = document.getElementById('log-area');

  if (!taskList || !taskNameInput || !taskDurationInput || !addTaskBtn || !logArea) {
    console.error("One or more required DOM elements are missing.");
    if (addTaskBtn) addTaskBtn.disabled = true;
    displayMessage("Initialization failed: Required page elements not found.", "error");
    return;
  }

  addTaskBtn.addEventListener('click', () => {
    const name = taskNameInput.value.trim();
    const duration = parseInt(taskDurationInput.value, 10);

    if (name && duration > 0) {
      addTask(name, duration);
      taskNameInput.value = '';
      taskDurationInput.value = '';
      saveAppState();
    } else {
      displayMessage('Please enter a valid task name and duration (minutes).', 'warning');
    }
  });

  function saveAppState() {
    try {
      const tasks = Array.from(document.querySelectorAll('#task-list .task')).map(taskEl => {
        const textContent = taskEl.querySelector('.task-text')?.textContent || '';
        const duration = parseInt(taskEl.getAttribute('data-duration'), 10);
        const remaining = parseInt(taskEl.getAttribute('data-remaining'), 10);
        const completed = taskEl.classList.contains('completed');
        const isRunning = taskEl.classList.contains('running');

        const match = textContent.match(/^(.*) \(\d+m\)$/);
        const originalText = match ? match[1] : textContent;

        return {
          text: originalText,
          duration: duration,
          remainingSeconds: remaining,
          completed: completed,
          isRunning: isRunning
        };
      });

      const logEntries = Array.from(logArea.querySelectorAll('p')).map(p => p.textContent);

      localStorage.setItem('chessTrackerData', JSON.stringify({
        tasks: tasks,
        logs: logEntries
      }));
    } catch (error) {
      console.error("Error saving app state:", error);
      displayMessage('Error saving data.', 'error');
    }
  }

  function loadAppState() {
    taskList.innerHTML = '';
    logArea.innerHTML = '<h2>Log</h2>';
    const stored = localStorage.getItem('chessTrackerData');
    if (!stored) return;

    try {
      const appState = JSON.parse(stored);
      if (Array.isArray(appState.tasks)) {
        appState.tasks.forEach(task => {
          if (typeof task.text === 'string' && typeof task.duration === 'number') {
            addTask(task.text, task.duration, task.remainingSeconds, task.completed);
            const newTask = taskList.lastElementChild;
            if (newTask && task.isRunning && !task.completed && task.remainingSeconds > 0) {
              startTimer(newTask, true);
            }
          }
        });
      }

      if (Array.isArray(appState.logs)) {
        appState.logs.reverse().forEach(logText => {
          const logEntry = document.createElement('p');
          logEntry.textContent = logText;
          const h2 = logArea.querySelector('h2');
          if (h2 && h2.nextSibling) {
            logArea.insertBefore(logEntry, h2.nextSibling);
          } else {
            logArea.appendChild(logEntry);
          }
        });
      }
    } catch (error) {
      console.error("Error loading app state:", error);
      localStorage.removeItem('chessTrackerData');
      displayMessage('Error loading previous data. Starting fresh.', 'error');
    }
  }

  function addTask(text, durationMinutes, remainingSeconds = null, completed = false) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('task');
    taskElement.setAttribute('data-duration', durationMinutes);

    const initialRemaining = remainingSeconds !== null ? remainingSeconds : durationMinutes * 60;
    taskElement.setAttribute('data-remaining', initialRemaining);

    const taskText = document.createElement('span');
    taskText.classList.add('task-text');
    taskText.textContent = \`\${text} (\${durationMinutes}m)\`;

    const timerSpan = document.createElement('span');
    timerSpan.classList.add('timer');
    timerSpan.textContent = formatTime(initialRemaining);

    const startBtn = document.createElement('button');
    startBtn.classList.add('start-btn');
    startBtn.textContent = 'Start';

    const pauseBtn = document.createElement('button');
    pauseBtn.classList.add('pause-btn');
    pauseBtn.textContent = 'Pause';
    pauseBtn.style.display = 'none';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = completed;
    checkbox.disabled = completed;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) completeTask(taskElement);
    });

    if (completed) {
      taskElement.classList.add('completed');
      startBtn.disabled = true;
      pauseBtn.disabled = true;
      taskText.style.textDecoration = 'line-through';
    }

    startBtn.addEventListener('click', () => startTimer(taskElement));
    pauseBtn.addEventListener('click', () => pauseTimer(taskElement));

    taskElement.appendChild(checkbox);
    taskElement.appendChild(taskText);
    taskElement.appendChild(timerSpan);
    taskElement.appendChild(startBtn);
    taskElement.appendChild(pauseBtn);
    taskList.appendChild(taskElement);
  }

  function startTimer(taskElement, isRestart = false) {
    if (!taskElement || taskElement.classList.contains('completed') || taskElement.classList.contains('running')) return;
    const isAnyRunning = document.querySelector('.task.running');
    if (isAnyRunning) {
      displayMessage("Another task is running. Please pause it first.", 'warning');
      return;
    }

    taskElement.classList.add('running');
    taskElement.querySelector('.start-btn').style.display = 'none';
    taskElement.querySelector('.pause-btn').style.display = 'inline-block';
    taskElement.querySelector('.task-checkbox').disabled = true;

    let remaining = parseInt(taskElement.getAttribute('data-remaining'), 10);
    if (!isRestart && (isNaN(remaining) || remaining <= 0)) {
      const duration = parseInt(taskElement.getAttribute('data-duration'), 10);
      remaining = duration * 60;
      taskElement.setAttribute('data-remaining', remaining);
    } else if (isRestart && remaining <= 0) {
      completeTask(taskElement);
      return;
    }

    const endTime = Date.now() + remaining * 1000;
    const intervalId = setInterval(() => {
      if (!document.body.contains(taskElement)) {
        clearInterval(intervalId);
        return;
      }

      const now = Date.now();
      const timeLeft = Math.max(0, Math.round((endTime - now) / 1000));
      taskElement.setAttribute('data-remaining', timeLeft);
      taskElement.querySelector('.timer').textContent = formatTime(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(intervalId);
        completeTask(taskElement);
      }
    }, 1000);

    taskElement.setAttribute('data-interval-id', intervalId);
    if (!isRestart) saveAppState();
  }

  function pauseTimer(taskElement) {
    if (!taskElement || taskElement.classList.contains('completed') || !taskElement.classList.contains('running')) return;

    const intervalId = taskElement.getAttribute('data-interval-id');
    if (intervalId) clearInterval(parseInt(intervalId, 10));

    taskElement.classList.remove('running');
    taskElement.querySelector('.start-btn').style.display = 'inline-block';
    taskElement.querySelector('.pause-btn').style.display = 'none';
    taskElement.querySelector('.task-checkbox').disabled = false;

    saveAppState();
  }

  function completeTask(taskElement) {
    if (!taskElement || taskElement.classList.contains('completed')) return;

    taskElement.classList.add('completed');
    taskElement.classList.remove('running');

    const intervalId = taskElement.getAttribute('data-interval-id');
    if (intervalId) clearInterval(parseInt(intervalId, 10));

    taskElement.setAttribute('data-remaining', 0);
    taskElement.querySelector('.timer').textContent = formatTime(0);
    taskElement.querySelector('.start-btn').disabled = true;
    taskElement.querySelector('.pause-btn').disabled = true;
    taskElement.querySelector('.pause-btn').style.display = 'none';
    taskElement.querySelector('.start-btn').style.display = 'inline-block';
    taskElement.querySelector('.task-text').style.textDecoration = 'line-through';
    taskElement.querySelector('.task-checkbox').checked = true;
    taskElement.querySelector('.task-checkbox').disabled = true;

    logTask(taskElement.querySelector('.task-text').textContent, taskElement.getAttribute('data-duration'));
    saveAppState();
  }

  function logTask(description, duration) {
    const logEntry = document.createElement('p');
    const now = new Date();
    const match = description.match(/^(.*) \(\d+m\)$/);
    const text = match ? match[1] : description;
    logEntry.textContent = \`\${now.toLocaleTimeString()} - Completed: \${text} (\${duration}m)\`;
    const h2 = logArea.querySelector('h2');
    if (h2 && h2.nextSibling) {
      logArea.insertBefore(logEntry, h2.nextSibling);
    } else {
      logArea.appendChild(logEntry);
    }
  }

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return \`\${m}:\${s}\`;
  }

  function displayMessage(msg, type = 'info') {
    console.log(\`[\${type.toUpperCase()}]\`, msg);
  }

  loadAppState();
  console.log("Timer initialized.");
});
