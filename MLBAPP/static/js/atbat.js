/**
 * At Bat Visualization module - Handles the display of the current at-bat and field situation
 */

class AtBat {
    constructor() {
        this.container = document.getElementById('at-bat');
        this.currentGamePk = null;
        this.liveData = null;
        this.updateInterval = null;
    }
    
    // Load at-bat data for a game
    async loadAtBatData(gamePk) {
        this.currentGamePk = gamePk;
        clearInterval(this.updateInterval);
        
        try {
            // Show loading state
            showLoading(this.container);
            
            // Load initial data
            await this.fetchAndUpdateAtBatData();
            
            // Set up polling for live games
            this.setupLiveUpdates();
        } catch (error) {
            console.error('Error loading at-bat data:', error);
            showError(this.container, 'Failed to load at-bat data. Please try again later.');
        }
    }
    
    // Fetch and update at-bat data
    async fetchAndUpdateAtBatData() {
        try {
            // Get live feed data
            const gameData = await fetchAPI(`/api/game/${this.currentGamePk}/feed/live`);
            
            if (!gameData) {
                showError(this.container, 'Failed to load game data. Please try again later.');
                return;
            }
            
            this.liveData = gameData;
            this.renderAtBatView();
        } catch (error) {
            console.error('Error updating at-bat data:', error);
        }
    }
    
    // Set up live updates for in-progress games
    setupLiveUpdates() {
        // Clear any existing intervals to prevent multiple timers
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Check if we have valid data first
        if (!this.liveData || !this.liveData.gameData) {
            console.log('No valid game data available for live updates');
            return;
        }
        
        // Only set up polling for games that are actually live
        const status = this.liveData.gameData.status?.abstractGameState;
        if (status === 'Live' || status === 'In Progress') {
            console.log('Setting up live updates for in-progress game');
            // Poll for updates every 10 seconds
            this.updateInterval = setInterval(() => {
                this.fetchAndUpdateAtBatData();
            }, 10000);
        } else {
            console.log('Game is not in progress, no live updates needed');
        }
    }
    
    // Render the at-bat view
    renderAtBatView() {
        if (!this.liveData) {
            this.container.innerHTML = '<div class="no-data">No game data available.</div>';
            return;
        }
        
        const gameData = this.liveData.gameData;
        const liveData = this.liveData.liveData;
        
        if (!gameData || !liveData) {
            this.container.innerHTML = '<div class="no-data">Incomplete game data available. Please try another game.</div>';
            return;
        }
        
        try {
            // Render game info header
            this.renderGameInfo(gameData, liveData);
            
            // Render field and base runners
            this.renderField(liveData);
            
            // Render current at-bat information
            this.renderCurrentAtBat(gameData, liveData);
        } catch (error) {
            console.error('Error rendering at-bat view:', error);
            this.container.innerHTML = '<div class="error">Error rendering at-bat view. The data format may not be as expected.</div>';
        }
    }
    
    // Render game info header
    renderGameInfo(gameData, liveData) {
        // Create game info container if it doesn't exist
        let gameInfoContainer = this.container.querySelector('.game-info');
        if (!gameInfoContainer) {
            gameInfoContainer = document.createElement('div');
            gameInfoContainer.className = 'game-info';
            this.container.appendChild(gameInfoContainer);
        }
        
        // Safely get current play
        const plays = liveData?.plays || {};
        const currentPlay = plays.currentPlay || {};
        let gameStatus = '';
        
        if (gameData?.status?.abstractGameState === 'Live' || gameData?.status?.abstractGameState === 'In Progress') {
            // Game is in progress, show inning info
            const inningState = currentPlay.about?.halfInning || 'top';
            const inningNum = currentPlay.about?.inning || 1;
            gameStatus = formatInning(inningState, inningNum);
            
            // Add count information
            const balls = currentPlay.count?.balls || 0;
            const strikes = currentPlay.count?.strikes || 0;
            const outs = currentPlay.count?.outs || 0;
            gameStatus += ` | ${balls}-${strikes} | ${outs} out${outs !== 1 ? 's' : ''}`;
        } else if (gameData?.status?.abstractGameState === 'Final') {
            // Game is over
            gameStatus = 'Final';
        } else {
            // Game hasn't started yet
            try {
                gameStatus = `${formatTime(gameData?.datetime?.dateTime || new Date().toISOString())}`;
            } catch (e) {
                console.error('Error formatting game time:', e);
                gameStatus = 'Scheduled';
            }
        }
        
        // Add score
        const awayTeam = gameData?.teams?.away || { name: 'Away' };
        const homeTeam = gameData?.teams?.home || { name: 'Home' };
        const awayScore = liveData?.linescore?.teams?.away?.runs || 0;
        const homeScore = liveData?.linescore?.teams?.home?.runs || 0;
        
        gameInfoContainer.innerHTML = `
            <h3>${gameStatus}</h3>
            <div class="score">${awayTeam.name || 'Away'} ${awayScore}, ${homeTeam.name || 'Home'} ${homeScore}</div>
        `;
    }
    
    // Render field and base runners
    renderField(liveData) {
        // Make sure the field elements exist first
        let fieldContainer = this.container.querySelector('.field');
        if (!fieldContainer) {
            // Create field container and bases
            fieldContainer = document.createElement('div');
            fieldContainer.className = 'field';
            fieldContainer.innerHTML = `
                <div class="diamond">
                    <div class="base first-base" data-occupied="false"></div>
                    <div class="base second-base" data-occupied="false"></div>
                    <div class="base third-base" data-occupied="false"></div>
                    <div class="home-plate"></div>
                </div>
            `;
            this.container.appendChild(fieldContainer);
        }
        
        // Safely access play data
        const plays = liveData?.plays || {};
        const currentPlay = plays.currentPlay || {};
        const offense = currentPlay.matchup?.batSide?.description || 'Right';
        const bases = {
            first: false,
            second: false,
            third: false
        };
        
        // Set base occupancy if we have runner data
        const runners = currentPlay.runners || [];
        if (Array.isArray(runners)) {
            runners.forEach(runner => {
                if (runner && runner.movement && runner.movement.start) {
                    switch (runner.movement.start) {
                        case '1B':
                            bases.first = true;
                            break;
                        case '2B':
                            bases.second = true;
                            break;
                        case '3B':
                            bases.third = true;
                            break;
                    }
                }
            });
        }
        
        // Update the bases on the field
        const firstBase = this.container.querySelector('.first-base');
        const secondBase = this.container.querySelector('.second-base');
        const thirdBase = this.container.querySelector('.third-base');
        
        if (firstBase) firstBase.setAttribute('data-occupied', bases.first);
        if (secondBase) secondBase.setAttribute('data-occupied', bases.second);
        if (thirdBase) thirdBase.setAttribute('data-occupied', bases.third);
    }
    
    // Render current at-bat information
    renderCurrentAtBat(gameData, liveData) {
        // Make sure we have the at-bat container
        let atBatContainer = this.container.querySelector('.current-at-bat');
        if (!atBatContainer) {
            atBatContainer = document.createElement('div');
            atBatContainer.className = 'current-at-bat';
            this.container.appendChild(atBatContainer);
            
            // Create the structure for player info
            atBatContainer.innerHTML = `
                <div class="matchup">
                    <div class="batter"></div>
                    <div class="vs">VS</div>
                    <div class="pitcher"></div>
                </div>
                <div class="count">
                    <div class="balls">Balls: <span>0</span></div>
                    <div class="strikes">Strikes: <span>0</span></div>
                    <div class="outs">Outs: <span>0</span></div>
                </div>
                <div class="pitch-zone">
                    <div class="strike-zone"></div>
                </div>
            `;
        }
        
        // Safely access play data
        const plays = liveData?.plays || {};
        const currentPlay = plays.currentPlay || {};
        const matchup = currentPlay.matchup;
        
        if (!matchup || !matchup.batter || !matchup.pitcher) {
            atBatContainer.innerHTML = '<div class="no-at-bat">No current at-bat data available.</div>';
            return;
        }
        
        // Get batter and pitcher info
        const batter = matchup.batter || { id: 0, fullName: 'Unknown Batter' };
        const pitcher = matchup.pitcher || { id: 0, fullName: 'Unknown Pitcher' };
        const batterStats = liveData.boxscore?.teams?.away?.players?.[`ID${batter.id}`]?.seasonStats?.batting || 
                            liveData.boxscore?.teams?.home?.players?.[`ID${batter.id}`]?.seasonStats?.batting || {};
        const pitcherStats = liveData.boxscore?.teams?.away?.players?.[`ID${pitcher.id}`]?.seasonStats?.pitching || 
                            liveData.boxscore?.teams?.home?.players?.[`ID${pitcher.id}`]?.seasonStats?.pitching || {};
        
        // Update batter info
        const batterContainer = this.container.querySelector('.batter');
        if (batterContainer) {
            batterContainer.innerHTML = `
                <img src="${getPlayerImageUrl(batter.id)}" alt="${batter.fullName}" onerror="this.src='/static/img/player-silhouette.png'">
                <div class="name">${batter.fullName}</div>
                <div class="stats">${batterStats.avg || '.000'} | ${batterStats.homeRuns || 0} HR | ${batterStats.rbi || 0} RBI</div>
            `;
        }
        
        // Update pitcher info
        const pitcherContainer = this.container.querySelector('.pitcher');
        if (pitcherContainer) {
            pitcherContainer.innerHTML = `
                <img src="${getPlayerImageUrl(pitcher.id)}" alt="${pitcher.fullName}" onerror="this.src='/static/img/player-silhouette.png'">
                <div class="name">${pitcher.fullName}</div>
                <div class="stats">${pitcherStats.era || '0.00'} ERA | ${pitcherStats.wins || 0}-${pitcherStats.losses || 0} | ${pitcherStats.strikeOuts || 0} K</div>
            `;
        }
        
        // Update count
        const balls = currentPlay.count?.balls || 0;
        const strikes = currentPlay.count?.strikes || 0;
        const outs = currentPlay.count?.outs || 0;
        
        const ballsSpan = this.container.querySelector('.balls span');
        const strikesSpan = this.container.querySelector('.strikes span');
        const outsSpan = this.container.querySelector('.outs span');
        
        if (ballsSpan) ballsSpan.textContent = balls;
        if (strikesSpan) strikesSpan.textContent = strikes;
        if (outsSpan) outsSpan.textContent = outs;
        
        // Render pitch zone
        this.renderPitchZone(currentPlay);
    }
    
    // Render pitch zone with pitch locations
    renderPitchZone(currentPlay) {
        // Find or create pitch zone
        let pitchZone = this.container.querySelector('.pitch-zone');
        if (!pitchZone) {
            pitchZone = document.createElement('div');
            pitchZone.className = 'pitch-zone';
            pitchZone.innerHTML = '<div class="strike-zone"></div>';
            
            // Add it to the container (or to the at-bat section if it exists)
            const atBatContainer = this.container.querySelector('.current-at-bat');
            if (atBatContainer) {
                atBatContainer.appendChild(pitchZone);
            } else {
                this.container.appendChild(pitchZone);
            }
        }
        
        // Make sure we have a strike zone
        let strikeZone = pitchZone.querySelector('.strike-zone');
        if (!strikeZone) {
            strikeZone = document.createElement('div');
            strikeZone.className = 'strike-zone';
            pitchZone.appendChild(strikeZone);
        }
        
        // Clear existing pitches
        const existingPitches = pitchZone.querySelectorAll('.pitch');
        existingPitches.forEach(pitch => pitch.remove());
        
        // Safety check if no current play or events
        if (!currentPlay || !currentPlay.playEvents) {
            return;
        }
        
        // Get pitches from current at-bat
        const playEvents = currentPlay.playEvents || [];
        const pitches = Array.isArray(playEvents) ? playEvents.filter(event => event && event.isPitch) : [];
        
        // Plot each pitch
        pitches.forEach(pitch => {
            try {
                if (pitch.pitchData && pitch.pitchData.coordinates) {
                    const { x, y } = pitch.pitchData.coordinates;
                    if (typeof x === 'number' && typeof y === 'number') {
                        // Normalize coordinates for our visualization
                        // Note: These calculations may need adjustment based on the actual data ranges
                        const normalizedX = (x / 2) * 100 + 50; // Center x=0 at 50% of container width
                        const normalizedY = (2 - y / 2) * 50; // Invert Y axis (higher y = lower on screen)
                        
                        // Determine pitch result class
                        let pitchClass = '';
                        if (pitch.details && pitch.details.description) {
                            const desc = pitch.details.description.toLowerCase();
                            if (desc.includes('ball')) pitchClass = 'ball';
                            else if (desc.includes('strike')) pitchClass = 'strike';
                            else if (desc.includes('play')) pitchClass = 'in-play';
                        }
                        
                        // Create pitch element
                        const pitchElem = document.createElement('div');
                        pitchElem.className = `pitch ${pitchClass}`;
                        pitchElem.style.left = `${normalizedX}%`;
                        pitchElem.style.top = `${normalizedY}%`;
                        pitchElem.title = pitch.details?.description || 'Pitch';
                        
                        // Add pitch number
                        pitchElem.textContent = pitch.pitchNumber || '';
                        
                        pitchZone.appendChild(pitchElem);
                    }
                }
            } catch (error) {
                console.error('Error rendering pitch:', error);
            }
        });
    }
    
    // Clean up resources when navigating away
    cleanup() {
        clearInterval(this.updateInterval);
    }
}
