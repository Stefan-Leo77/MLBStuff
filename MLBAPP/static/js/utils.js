/**
 * Utility functions for the MLB Live Game Viewer
 */

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format time in local timezone
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format inning display
function formatInning(inningHalf, inningNum) {
    const half = inningHalf === 'top' ? 'Top' : 'Bottom';
    const inning = getOrdinalSuffix(inningNum);
    return `${half} ${inning}`;
}

// Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    
    if (j === 1 && k !== 11) {
        return num + "st";
    }
    if (j === 2 && k !== 12) {
        return num + "nd";
    }
    if (j === 3 && k !== 13) {
        return num + "rd";
    }
    return num + "th";
}

// Create team logo URL from team ID
function getTeamLogoUrl(teamId) {
    return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

// Create player image URL from player ID
function getPlayerImageUrl(playerId) {
    return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

// Determine game status display
function getGameStatusDisplay(status) {
    if (!status) return '';
    
    switch(status.abstractGameState) {
        case 'Final':
            return 'Final';
        case 'Live':
        case 'In Progress':
            if (status.detailedState.includes('Delayed')) {
                return 'Delayed';
            }
            return 'Live';
        case 'Preview':
            return formatTime(status.gameDate);
        default:
            return status.detailedState;
    }
}

// Determine game status class
function getGameStatusClass(status) {
    if (!status) return '';
    
    switch(status.abstractGameState) {
        case 'Final':
            return 'final';
        case 'Live':
        case 'In Progress':
            return 'live';
        case 'Preview':
            return 'preview';
        default:
            return '';
    }
}

// Get current data source setting
async function getDataSource() {
    try {
        const response = await fetch('/api/data_source');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting data source setting:', error);
        return { use_live_data: false };
    }
}

// Toggle data source between local and live
async function toggleDataSource() {
    try {
        const response = await fetch('/api/toggle_data_source');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        // Update the UI
        const dataSourceLabel = document.getElementById('data-source-label');
        if (dataSourceLabel) {
            dataSourceLabel.textContent = data.use_live_data ? 'LIVE MLB API' : 'LOCAL TEST DATA';
        }
        
        // Show notification
        showNotification(data.message, 'info');
        
        return data;
    } catch (error) {
        console.error('Error toggling data source:', error);
        showNotification('Failed to toggle data source.', 'error');
        return null;
    }
}

// Simple API fetch wrapper with error handling
async function fetchAPI(endpoint) {
    try {
        console.log(`Fetching data from ${endpoint}...`);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched data from ${endpoint}`, data);
        
        // Check if the data structure is valid
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            console.warn(`Empty or invalid data received from ${endpoint}`);
        }
        
        return data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

// Display error message with retry button
function showError(container, message) {
    container.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button class="retry-btn">Retry</button>
        </div>
    `;
    
    // Add retry button functionality
    const retryBtn = container.querySelector('.retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            // Reload the current view
            if (window.currentGamePk) {
                showLoading(container, 'Retrying...');
                
                // Determine which component to reload based on active tab
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab) {
                    const tabId = activeTab.dataset.tab;
                    
                    if (tabId === 'box-score' && window.boxScore) {
                        window.boxScore.loadBoxScore(window.currentGamePk);
                    } else if (tabId === 'at-bat' && window.atBat) {
                        window.atBat.loadAtBatData(window.currentGamePk);
                    } else if (tabId === 'play-by-play' && window.playByPlay) {
                        window.playByPlay.loadPlayByPlay(window.currentGamePk);
                    }
                }
            }
        });
    }
}

// Create loading indicator
function showLoading(container, message = 'Loading...') {
    container.innerHTML = `<div class="loading">${message}</div>`;
}

// Show notification message
function showNotification(message, type = 'info') {
    // Check if notification container exists, create if it doesn't
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on notification type
    const icon = document.createElement('i');
    switch (type) {
        case 'error':
            icon.className = 'fas fa-exclamation-circle';
            break;
        case 'success':
            icon.className = 'fas fa-check-circle';
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle';
            break;
        default:
            icon.className = 'fas fa-info-circle';
    }
    notification.appendChild(icon);
    
    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    });
    notification.appendChild(closeBtn);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}
