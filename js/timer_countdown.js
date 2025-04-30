// Timer Countdown Module with pause/resume and localStorage persistence

const TIMER_ACTIVE_TASK_KEY = 'timerActiveTaskId';
const TIMER_END_TIME_KEY = 'timerEndTime';
const TIMER_PAUSED_KEY = 'timerPaused';
const TIMER_PAUSE_REMAINING_KEY = 'pauseRemainingMs';

let timerInterval = null;
let activeTaskId = null;
let timerPaused = false;
let timerEndTime = null;
let pauseRemainingMs = null;
let onTickCallback = null;
let onCompleteCallback = null;

// Save timer state to localStorage
function saveTimerState() {
    if (activeTaskId !== null) {
        localStorage.setItem(TIMER_ACTIVE_TASK_KEY, activeTaskId.toString());
    } else {
        localStorage.removeItem(TIMER_ACTIVE_TASK_KEY);
    }
    if (timerEndTime !== null) {
        localStorage.setItem(TIMER_END_TIME_KEY, timerEndTime.toString());
    } else {
        localStorage.removeItem(TIMER_END_TIME_KEY);
    }
    localStorage.setItem(TIMER_PAUSED_KEY, timerPaused ? 'true' : 'false');
    if (pauseRemainingMs !== null) {
        localStorage.setItem(TIMER_PAUSE_REMAINING_KEY, pauseRemainingMs.toString());
    } else {
        localStorage.removeItem(TIMER_PAUSE_REMAINING_KEY);
    }
}

// Load timer state from localStorage
function loadTimerState() {
    const storedTaskId = localStorage.getItem(TIMER_ACTIVE_TASK_KEY);
    const storedEndTime = localStorage.getItem(TIMER_END_TIME_KEY);
    const storedPaused = localStorage.getItem(TIMER_PAUSED_KEY);
    const storedPauseRemaining = localStorage.getItem(TIMER_PAUSE_REMAINING_KEY);

    activeTaskId = storedTaskId !== null ? parseInt(storedTaskId) : null;
    timerEndTime = storedEndTime !== null ? parseInt(storedEndTime) : null;
    timerPaused = storedPaused === 'true';
    pauseRemainingMs = storedPauseRemaining !== null ? parseInt(storedPauseRemaining) : null;
}

// Clear timer state from localStorage and reset variables
function clearTimerState() {
    localStorage.removeItem(TIMER_ACTIVE_TASK_KEY);
    localStorage.removeItem(TIMER_END_TIME_KEY);
    localStorage.removeItem(TIMER_PAUSED_KEY);
    localStorage.removeItem(TIMER_PAUSE_REMAINING_KEY);
    activeTaskId = null;
    timerEndTime = null;
    timerPaused = false;
    pauseRemainingMs = null;
    clearInterval(timerInterval);
    timerInterval = null;
}

// Start the timer for a task with duration in minutes
function startTimer(taskId, durationMinutes, tickCallback, completeCallback) {
    activeTaskId = taskId;
    timerPaused = false;
    pauseRemainingMs = null;
    timerEndTime = Date.now() + durationMinutes * 60000;
    onTickCallback = tickCallback;
    onCompleteCallback = completeCallback;

    saveTimerState();
    startTick();
}

// Pause the timer and save remaining time
function pauseTimer() {
    if (!timerEndTime || timerPaused) return;
    timerPaused = true;
    const now = Date.now();
    pauseRemainingMs = timerEndTime - now;
    if (pauseRemainingMs < 0) pauseRemainingMs = 0;
    saveTimerState();
}

// Resume the timer from paused state
function resumeTimer() {
    if (!pauseRemainingMs || !timerPaused) return;
    timerPaused = false;
    timerEndTime = Date.now() + pauseRemainingMs;
    pauseRemainingMs = null;
    saveTimerState();
    if (!timerInterval) {
        startTick();
    }
}

// Internal function to start the ticking interval
function startTick() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!timerPaused && timerEndTime) {
            const now = Date.now();
            let remainingMs = timerEndTime - now;
            if (remainingMs < 0) remainingMs = 0;
            if (onTickCallback) {
                onTickCallback(activeTaskId, remainingMs);
            }
            if (remainingMs === 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                if (onCompleteCallback) {
                    onCompleteCallback(activeTaskId);
                }
                clearTimerState();
            }
        }
    }, 1000);
}

// Restore timer state on page load
function restoreTimer(tickCallback, completeCallback) {
    loadTimerState();
    onTickCallback = tickCallback;
    onCompleteCallback = completeCallback;

    if (activeTaskId !== null) {
        if (timerPaused) {
            if (onTickCallback && pauseRemainingMs !== null) {
                onTickCallback(activeTaskId, pauseRemainingMs);
            }
        } else if (timerEndTime !== null) {
            const now = Date.now();
            let remainingMs = timerEndTime - now;
            if (remainingMs < 0) remainingMs = 0;
            if (onTickCallback) {
                onTickCallback(activeTaskId, remainingMs);
            }
            if (!timerInterval) {
                startTick();
            }
        }
    }
}

export {
    startTimer,
    pauseTimer,
    resumeTimer,
    clearTimerState,
    restoreTimer
};
