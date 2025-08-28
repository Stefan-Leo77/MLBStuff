/**
 * Box Score module - Handles the display of box score data for a game
 */

class BoxScore {
    constructor() {
        this.container = document.getElementById('box-score');
        this.currentGamePk = null;
        this.boxScoreData = null;
    }
    
    // Load box score data for a game
    async loadBoxScore(gamePk) {
        this.currentGamePk = gamePk;
        
        try {
            // First get basic game data to set the title
            const gameData = await fetchAPI(`/api/game/${gamePk}/feed/live`);
            if (gameData && gameData.gameData && gameData.gameData.teams) {
                const awayTeam = gameData.gameData.teams.away?.name || 'Away Team';
                const homeTeam = gameData.gameData.teams.home?.name || 'Home Team';
                const titleElem = document.getElementById('game-title');
                if (titleElem) {
                    titleElem.textContent = `${awayTeam} @ ${homeTeam}`;
                }
            }
            
            // Show loading state
            showLoading(this.container);
            
            // Get box score data
            this.boxScoreData = await fetchAPI(`/api/game/${gamePk}/boxscore`);
            
            // Validate the data we received
            const validData = this.boxScoreData && 
                             this.boxScoreData.teams && 
                             this.boxScoreData.teams.away && 
                             this.boxScoreData.teams.home;
            
            if (!validData) {
                console.error('Invalid or missing boxscore data structure', this.boxScoreData);
                showError(this.container, 'Failed to load box score data. Please try again later.');
                return;
            }
            
            // Render the box score
            this.renderBoxScore();
            
            // Set up team tabs
            this.setupTeamTabs();
        } catch (error) {
            console.error('Error loading box score:', error);
            showError(this.container, 'Failed to load box score. Please try again later.');
        }
    }
    
    // Render the box score components
    renderBoxScore() {
        // Clear any previous content and set up the basic structure if it doesn't exist
        if (!this.container.querySelector('.score-summary')) {
            // First time initialization
            this.container.innerHTML = `
                <div class="score-summary"></div>
                <div class="inning-scores"></div>
            `;
        }
        
        this.renderScoreSummary();
        this.renderInningScores();
        this.renderTeamStats('away');
        this.renderTeamStats('home');
    }
    
    // Render the score summary at the top of the box score
    renderScoreSummary() {
        let scoreSummary = this.container.querySelector('.score-summary');
        if (!scoreSummary) {
            scoreSummary = document.createElement('div');
            scoreSummary.className = 'score-summary';
            this.container.appendChild(scoreSummary);
        }
        
        const awayTeam = this.boxScoreData.teams.away;
        const homeTeam = this.boxScoreData.teams.home;
        
        // Safely get team IDs and names
        const awayTeamId = awayTeam.team?.id || 0;
        const homeTeamId = homeTeam.team?.id || 0;
        const awayTeamName = awayTeam.team?.name || 'Away Team';
        const homeTeamName = homeTeam.team?.name || 'Home Team';
        
        // Safely get scores
        const awayRuns = awayTeam.teamStats?.batting?.runs || 0;
        const homeRuns = homeTeam.teamStats?.batting?.runs || 0;
        
        scoreSummary.innerHTML = `
            <div class="team-summary">
                <img src="${getTeamLogoUrl(awayTeamId)}" alt="${awayTeamName}" onerror="this.src='/static/img/mlb-logo.png'">
                <div class="name">${awayTeamName}</div>
                <div class="score">${awayRuns}</div>
            </div>
            <div class="vs">@</div>
            <div class="team-summary">
                <img src="${getTeamLogoUrl(homeTeamId)}" alt="${homeTeamName}" onerror="this.src='/static/img/mlb-logo.png'">
                <div class="name">${homeTeamName}</div>
                <div class="score">${homeRuns}</div>
            </div>
        `;
    }
    
    // Render the inning-by-inning scores
    renderInningScores() {
        let inningScores = this.container.querySelector('.inning-scores');
        if (!inningScores) {
            inningScores = document.createElement('div');
            inningScores.className = 'inning-scores';
            this.container.appendChild(inningScores);
        }
        
        const awayTeam = this.boxScoreData.teams.away;
        const homeTeam = this.boxScoreData.teams.home;
        const linescore = this.boxScoreData.linescore || {};
        const innings = linescore.innings || [];
        
        // Handle case where no innings data is available
        if (innings.length === 0) {
            inningScores.innerHTML = '<div class="no-data">Inning-by-inning data not available</div>';
            return;
        }
        
        let tableHTML = '<table><thead><tr><th>Team</th>';
        
        // Generate inning headers
        for (let i = 0; i < innings.length; i++) {
            tableHTML += `<th>${i + 1}</th>`;
        }
        
        // Add R H E headers
        tableHTML += '<th>R</th><th>H</th><th>E</th></tr></thead><tbody>';
        
        // Safely get team abbreviation
        const awayTeamAbbr = awayTeam.team?.abbreviation || 
                          (awayTeam.team?.name ? awayTeam.team.name.substring(0, 3).toUpperCase() : 'AWAY');
        
        // Away team line score
        tableHTML += `<tr><td class="team-name">${awayTeamAbbr}</td>`;
        
        // Inning scores for away team
        for (let i = 0; i < innings.length; i++) {
            const inning = innings[i];
            const score = inning.away ? (inning.away.runs !== undefined ? inning.away.runs : '-') : '-';
            tableHTML += `<td>${score}</td>`;
        }
        
        // R H E for away team
        tableHTML += `
            <td>${awayTeam.teamStats.batting.runs || 0}</td>
            <td>${awayTeam.teamStats.batting.hits || 0}</td>
            <td>${awayTeam.teamStats.fielding.errors || 0}</td>
        </tr>`;
        
        // Home team line score - safely get team abbreviation
        const homeTeamAbbr = homeTeam.team?.abbreviation || 
                          (homeTeam.team?.name ? homeTeam.team.name.substring(0, 3).toUpperCase() : 'HOME');
        tableHTML += `<tr><td class="team-name">${homeTeamAbbr}</td>`;
        
        // Inning scores for home team
        for (let i = 0; i < innings.length; i++) {
            const inning = innings[i];
            const score = inning.home ? (inning.home.runs !== undefined ? inning.home.runs : '-') : '-';
            tableHTML += `<td>${score}</td>`;
        }
        
        // R H E for home team
        tableHTML += `
            <td>${homeTeam.teamStats.batting.runs || 0}</td>
            <td>${homeTeam.teamStats.batting.hits || 0}</td>
            <td>${homeTeam.teamStats.fielding.errors || 0}</td>
        </tr>`;
        
        tableHTML += '</tbody></table>';
        inningScores.innerHTML = tableHTML;
    }
    
    // Render batting and pitching stats for a team
    renderTeamStats(teamType) {
        const team = this.boxScoreData.teams[teamType];
        this.renderBattingStats(team, teamType);
        this.renderPitchingStats(team, teamType);
    }
    
    // Render batting stats for a team
    renderBattingStats(team, teamType) {
        const battingStatsContainer = this.container.querySelector(`.batting-stats[data-team="${teamType}"] .stats-table`);
        if (!battingStatsContainer) {
            console.error(`Batting stats container for ${teamType} team not found`);
            return;
        }
        
        const players = team.players || {};
        const battingOrder = team.battingOrder || [];
        
        // Check if we have player data
        if (Object.keys(players).length === 0) {
            battingStatsContainer.innerHTML = '<div class="no-data">No batting data available</div>';
            return;
        }
        
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Pos</th>
                        <th>AB</th>
                        <th>R</th>
                        <th>H</th>
                        <th>RBI</th>
                        <th>BB</th>
                        <th>SO</th>
                        <th>LOB</th>
                        <th>AVG</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add rows for each batter in batting order
        if (battingOrder.length === 0) {
            // If no batting order, try to extract players with batting stats
            try {
                const batters = Object.values(players).filter(player => 
                    player && player.stats && player.stats.batting
                );
                
                batters.forEach(player => {
                    try {
                        const stats = player.stats?.batting || {};
                        const personName = player.person?.fullName || 'Unknown Player';
                        const positionAbbr = player.position?.abbreviation || '';
                        
                        tableHTML += `
                            <tr>
                                <td class="player-name">${personName}</td>
                                <td>${positionAbbr}</td>
                                <td>${stats.atBats || 0}</td>
                                <td>${stats.runs || 0}</td>
                                <td>${stats.hits || 0}</td>
                                <td>${stats.rbi || 0}</td>
                                <td>${stats.baseOnBalls || 0}</td>
                                <td>${stats.strikeOuts || 0}</td>
                                <td>${stats.leftOnBase || 0}</td>
                                <td>${stats.avg || '.000'}</td>
                            </tr>
                        `;
                    } catch (error) {
                        console.error('Error rendering batter row:', error);
                        // Skip this batter if there's an error
                    }
                });
            } catch (error) {
                console.error('Error extracting batters:', error);
            }
        } else {
            // Use the batting order
            battingOrder.forEach(playerId => {
                try {
                    const playerKey = `ID${playerId}`;
                    if (players[playerKey]) {
                        const player = players[playerKey];
                        const stats = player.stats?.batting || {};
                        const personName = player.person?.fullName || 'Unknown Player';
                        const positionAbbr = player.position?.abbreviation || '';
                        
                        tableHTML += `
                            <tr>
                                <td class="player-name">${personName}</td>
                                <td>${positionAbbr}</td>
                                <td>${stats.atBats || 0}</td>
                                <td>${stats.runs || 0}</td>
                                <td>${stats.hits || 0}</td>
                                <td>${stats.rbi || 0}</td>
                                <td>${stats.baseOnBalls || 0}</td>
                                <td>${stats.strikeOuts || 0}</td>
                                <td>${stats.leftOnBase || 0}</td>
                                <td>${stats.avg || '.000'}</td>
                            </tr>
                        `;
                    }
                } catch (error) {
                    console.error('Error rendering batter row:', error);
                    // Skip this batter if there's an error
                }
            });
        }
        
        // Add team totals with safety checks
        try {
            const teamStats = team.teamStats?.batting || {};
            tableHTML += `
                <tr class="team-totals">
                    <td class="player-name">Totals</td>
                    <td></td>
                    <td>${teamStats.atBats || 0}</td>
                    <td>${teamStats.runs || 0}</td>
                    <td>${teamStats.hits || 0}</td>
                    <td>${teamStats.rbi || 0}</td>
                    <td>${teamStats.baseOnBalls || 0}</td>
                    <td>${teamStats.strikeOuts || 0}</td>
                    <td>${teamStats.leftOnBase || 0}</td>
                    <td>${teamStats.avg || '.000'}</td>
                </tr>
            `;
        } catch (error) {
            console.error('Error rendering team totals:', error);
            // If team stats are missing, show a simpler row
            tableHTML += `
                <tr class="team-totals">
                    <td class="player-name">Totals</td>
                    <td></td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            `;
        }
        
        tableHTML += '</tbody></table>';
        battingStatsContainer.innerHTML = tableHTML;
    }
    
    // Render pitching stats for a team
    renderPitchingStats(team, teamType) {
        const pitchingStatsContainer = this.container.querySelector(`.pitching-stats[data-team="${teamType}"] .stats-table`);
        if (!pitchingStatsContainer) {
            console.error(`Pitching stats container for ${teamType} team not found`);
            return;
        }
        
        const players = team.players || {};
        
        // Check if we have player data
        if (Object.keys(players).length === 0) {
            pitchingStatsContainer.innerHTML = '<div class="no-data">No pitching data available</div>';
            return;
        }
        
        // Safely filter pitchers
        let pitchers = [];
        try {
            pitchers = Object.values(players).filter(player => 
                player && player.position && player.position.code === '1' && 
                player.stats && player.stats.pitching
            );
            
            if (pitchers.length === 0) {
                // Try a different approach if no pitchers found
                pitchers = Object.values(players).filter(player => 
                    player && player.stats && player.stats.pitching
                );
            }
            
            // Still no pitchers? Create one placeholder
            if (pitchers.length === 0) {
                pitchingStatsContainer.innerHTML = '<div class="no-data">No pitching data available</div>';
                return;
            }
        } catch (error) {
            console.error('Error filtering pitchers:', error);
            pitchingStatsContainer.innerHTML = '<div class="error">Error loading pitching data</div>';
            return;
        }
        
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Pitcher</th>
                        <th>IP</th>
                        <th>H</th>
                        <th>R</th>
                        <th>ER</th>
                        <th>BB</th>
                        <th>SO</th>
                        <th>HR</th>
                        <th>ERA</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add rows for each pitcher
        pitchers.forEach(player => {
            try {
                const stats = player.stats?.pitching || {};
                const personName = player.person?.fullName || 'Unknown Pitcher';
                
                tableHTML += `
                    <tr>
                        <td class="player-name">${personName}</td>
                        <td>${stats.inningsPitched || '0.0'}</td>
                        <td>${stats.hits || 0}</td>
                        <td>${stats.runs || 0}</td>
                        <td>${stats.earnedRuns || 0}</td>
                        <td>${stats.baseOnBalls || 0}</td>
                        <td>${stats.strikeOuts || 0}</td>
                        <td>${stats.homeRuns || 0}</td>
                        <td>${stats.era || '0.00'}</td>
                    </tr>
                `;
            } catch (error) {
                console.error('Error rendering pitcher row:', error);
                // Skip this pitcher if there's an error
            }
        });
        
        tableHTML += '</tbody></table>';
        pitchingStatsContainer.innerHTML = tableHTML;
    }
    
    // Setup team tabs for switching between home and away teams
    setupTeamTabs() {
        // Create team tabs and team stats containers if they don't exist
        let tabsContainer = this.container.querySelector('.team-tabs');
        if (!tabsContainer) {
            // Create structure for team tabs and stats
            this.container.innerHTML += `
                <div class="team-tabs">
                    <button class="team-tab active" data-team="away">${this.boxScoreData.teams.away.team?.name || 'Away Team'}</button>
                    <button class="team-tab" data-team="home">${this.boxScoreData.teams.home.team?.name || 'Home Team'}</button>
                </div>
                <div class="team-stats-container">
                    <div class="team-stats active" data-team="away">
                        <h3>Batting</h3>
                        <div class="batting-stats" data-team="away">
                            <div class="stats-table"></div>
                        </div>
                        <h3>Pitching</h3>
                        <div class="pitching-stats" data-team="away">
                            <div class="stats-table"></div>
                        </div>
                    </div>
                    <div class="team-stats" data-team="home">
                        <h3>Batting</h3>
                        <div class="batting-stats" data-team="home">
                            <div class="stats-table"></div>
                        </div>
                        <h3>Pitching</h3>
                        <div class="pitching-stats" data-team="home">
                            <div class="stats-table"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const teamTabs = this.container.querySelectorAll('.team-tab');
        const teamStats = this.container.querySelectorAll('.team-stats');
        
        if (!teamTabs.length || !teamStats.length) {
            console.error('Team tabs or stats containers not found');
            return;
        }
        
        teamTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                teamTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show stats for selected team
                const team = tab.dataset.team;
                teamStats.forEach(stat => {
                    if (stat.dataset.team === team) {
                        stat.classList.add('active');
                    } else {
                        stat.classList.remove('active');
                    }
                });
            });
        });
    }
}
