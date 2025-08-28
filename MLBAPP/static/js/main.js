/**
 * Main JavaScript file - Initializes all components and sets up event handlers
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    window.scoreboard = new Scoreboard();
    window.boxScore = new BoxScore();
    window.atBat = new AtBat();
    window.playByPlay = new PlayByPlay();
    
    // Initialize scoreboard
    scoreboard.init();
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Set up back button
    setupBackButton();
    
    // Set up data source toggle
    setupDataSourceToggle();
});

// Set up tab navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding tab pane
            const tab = button.dataset.tab;
            document.getElementById(tab).classList.add('active');
        });
    });
}

// Set up back button to return to scoreboard
function setupBackButton() {
    const backButton = document.getElementById('back-to-scoreboard');
    
    backButton.addEventListener('click', () => {
        // Hide game detail and show scoreboard
        document.getElementById('game-detail').classList.add('hidden');
        document.getElementById('scoreboard').classList.remove('hidden');
        
        // Clean up any active resources
        if (window.atBat) window.atBat.cleanup();
        if (window.playByPlay) window.playByPlay.cleanup();
    });
}

// Set up data source toggle
function setupDataSourceToggle() {
    const toggle = document.getElementById('data-source-toggle');
    if (toggle) {
        toggle.addEventListener('change', async () => {
            // Show loading notification
            showNotification('Switching data source...', 'info');
            
            // Toggle the data source
            await toggleDataSource();
            
            // If we're viewing a game, reload it
            if (window.currentGamePk && !document.getElementById('game-detail').classList.contains('hidden')) {
                // Reload active tab content
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
