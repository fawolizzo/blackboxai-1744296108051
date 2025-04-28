// Achievement definitions
const ACHIEVEMENTS = {
    streaks: [
        { id: 'streak-bronze', name: '7-Day Warrior', description: 'Maintain a 7-day training streak', requirement: 7, icon: 'fa-fire', color: 'bronze' },
        { id: 'streak-silver', name: '30-Day Champion', description: 'Maintain a 30-day training streak', requirement: 30, icon: 'fa-fire', color: 'silver' },
        { id: 'streak-gold', name: 'Centurion', description: 'Maintain a 100-day training streak', requirement: 100, icon: 'fa-fire', color: 'gold' }
    ],
    training: [
        { id: 'training-bronze', name: 'Dedicated Student', description: 'Train for 10 hours total', requirement: 10, icon: 'fa-clock', color: 'bronze' },
        { id: 'training-silver', name: 'Chess Scholar', description: 'Train for 50 hours total', requirement: 50, icon: 'fa-clock', color: 'silver' },
        { id: 'training-gold', name: 'Chess Master', description: 'Train for 100 hours total', requirement: 100, icon: 'fa-clock', color: 'gold' }
    ],
    tasks: [
        { id: 'tasks-bronze', name: 'Task Starter', description: 'Complete 50 training tasks', requirement: 50, icon: 'fa-check', color: 'bronze' },
        { id: 'tasks-silver', name: 'Task Expert', description: 'Complete 100 training tasks', requirement: 100, icon: 'fa-check', color: 'silver' },
        { id: 'tasks-gold', name: 'Task Master', description: 'Complete 500 training tasks', requirement: 500, icon: 'fa-check', color: 'gold' }
    ],
    perfect: [
        { id: 'perfect-week', name: 'Perfect Week', description: 'Complete all tasks for 7 consecutive days', icon: 'fa-calendar-check', color: 'gold' },
        { id: 'perfect-month', name: 'Perfect Month', description: 'Complete all tasks for 30 consecutive days', icon: 'fa-calendar-star', color: 'rainbow' }
    ]
};

// Achievement colors
const ACHIEVEMENT_COLORS = {
    bronze: { bg: '#CD7F32', text: 'white' },
    silver: { bg: '#C0C0C0', text: 'white' },
    gold: { bg: '#FFD700', text: 'black' },
    rainbow: { bg: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff)', text: 'white' }
};

// Track user achievements
let userAchievements = {
    unlocked: [],
    progress: {
        streaks: 0,
        training: 0,
        tasks: 0,
        perfectDays: 0
    }
};

let shareTimeout = null;
let pendingAchievements = [];

// Check for achievements
function checkAchievements(userData) {
    const newAchievements = [];

    // Check streak achievements
    ACHIEVEMENTS.streaks.forEach(achievement => {
        if (!userAchievements.unlocked.includes(achievement.id) && userData.streak >= achievement.requirement) {
            newAchievements.push(achievement);
            userAchievements.unlocked.push(achievement.id);
        }
    });

    // Check training hours achievements
    ACHIEVEMENTS.training.forEach(achievement => {
        if (!userAchievements.unlocked.includes(achievement.id) && userData.hoursTrained >= achievement.requirement) {
            newAchievements.push(achievement);
            userAchievements.unlocked.push(achievement.id);
        }
    });

    // Check completed tasks achievements
    const totalTasks = userData.tasks.filter(task => task.completed).length;
    ACHIEVEMENTS.tasks.forEach(achievement => {
        if (!userAchievements.unlocked.includes(achievement.id) && totalTasks >= achievement.requirement) {
            newAchievements.push(achievement);
            userAchievements.unlocked.push(achievement.id);
        }
    });

    if (newAchievements.length > 0) {
        // Add to pending achievements
        pendingAchievements = pendingAchievements.concat(newAchievements);

        // Clear existing timeout
        if (shareTimeout) {
            clearTimeout(shareTimeout);
        }

        // Set timeout to batch notifications and sharing (e.g., 1 hour)
        shareTimeout = setTimeout(() => {
            showAchievementNotifications(pendingAchievements);
            // TODO: Implement share summary here
            pendingAchievements = [];
            saveAchievements();
        }, 3600000); // 1 hour in milliseconds
    }
}

function showAchievementNotifications(achievements) {
    achievements.forEach(achievement => {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transform translate-y-0 opacity-100 transition-all duration-500';
        notification.style.backgroundColor = ACHIEVEMENT_COLORS[achievement.color].bg;
        notification.style.color = ACHIEVEMENT_COLORS[achievement.color].text;
        
        // Generate shareable URL (placeholder)
        const shareUrl = generateShareUrl(achievement);
        
        notification.innerHTML = `
            <div class="flex items-center justify-between space-x-4">
                <div class="flex items-center space-x-3">
                    <i class="fas ${achievement.icon} text-2xl mr-3"></i>
                    <div>
                        <h4 class="font-bold">${achievement.name}</h4>
                        <p class="text-sm opacity-90">${achievement.description}</p>
                    </div>
                </div>
                <button class="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 transition" onclick="window.open('${shareUrl}', '_blank')">
                    Share
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(100%)';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    });
}

// Generate a shareable URL for an achievement (placeholder implementation)
function generateShareUrl(achievement) {
    const baseUrl = 'https://twitter.com/intent/tweet';
    const text = encodeURIComponent(`I just unlocked the "${achievement.name}" achievement on Chess Training Tracker! #ChessTraining #Achievements`);
    return `${baseUrl}?text=${text}`;
}

// Save achievements to localStorage
function saveAchievements() {
    localStorage.setItem('chessAchievements', JSON.stringify(userAchievements));
}

// Load achievements from localStorage
function loadAchievements() {
    const saved = localStorage.getItem('chessAchievements');
    if (saved) {
        userAchievements = JSON.parse(saved);
    }
}

// Initialize achievements
function initializeAchievements() {
    loadAchievements();
}

// Export functions
window.Achievements = {
    init: initializeAchievements,
    check: checkAchievements,
    getUnlocked: () => userAchievements.unlocked,
    getProgress: () => userAchievements.progress
};
