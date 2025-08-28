/**
 * Scoreboard module - Handles the display of game scores for a given day
 */

class Scoreboard {
    constructor() {
        this.container = document.getElementById('games-container');
        this.currentDate = new Date();
    }

    // Initialize the scoreboard
    async init() {
        // Get games for today
        await this.loadGamesForDate(formatDate(this.currentDate));
        
        // Set up date navigation
        this.setupDateNavigation();
    }
    
    // Set up date navigation controls
    setupDateNavigation() {
        const datePicker = document.getElementById('date-picker');
        const prevDateBtn = document.getElementById('prev-date');
        const nextDateBtn = document.getElementById('next-date');
        const todayBtn = document.getElementById('today-btn');
        
        // Set date picker value
        datePicker.value = formatDate(this.currentDate);
        
        // Handle date picker change
        datePicker.addEventListener('change', () => {
            this.loadGamesForDate(datePicker.value);
        });
        
        // Handle previous date button
        prevDateBtn.addEventListener('click', () => {
            const newDate = new Date(this.currentDate);
            newDate.setDate(newDate.getDate() - 1);
            this.currentDate = newDate;
            datePicker.value = formatDate(newDate);
            this.loadGamesForDate(datePicker.value);
        });
        
        // Handle next date button
        nextDateBtn.addEventListener('click', () => {
            const newDate = new Date(this.currentDate);
            newDate.setDate(newDate.getDate() + 1);
            this.currentDate = newDate;
            datePicker.value = formatDate(newDate);
            this.loadGamesForDate(datePicker.value);
        });
        
        // Handle today button
        todayBtn.addEventListener('click', () => {
            this.currentDate = new Date();
            datePicker.value = formatDate(this.currentDate);
            this.loadGamesForDate(datePicker.value);
        });
    }
    
    // Load games for a specific date
    async loadGamesForDate(date) {
        showLoading(this.container);
        
        try {
            const data = await fetchAPI(`/api/schedule?date=${date}`);
            
            if (!data || !data.dates || data.dates.length === 0) {
                this.container.innerHTML = '<div class="no-games">No games scheduled for this date.</div>';
                return;
            }
            
            const games = data.dates[0].games;
            this.renderGames(games);
        } catch (error) {
            console.error('Error loading games:', error);
            showError(this.container, 'Failed to load games. Please try again later.');
        }
    }
    
    // Render the game cards
    renderGames(games) {
        if (!games || games.length === 0) {
            this.container.innerHTML = '<div class="no-games">No games scheduled for this date.</div>';
            return;
        }
        
        const gamesHTML = games.map(game => this.createGameCard(game)).join('');
        this.container.innerHTML = gamesHTML;
        
        // Add click event listeners to game cards
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gamePk = card.dataset.gamepk;
                this.handleGameCardClick(gamePk);
            });
        });
    }
    
    // Create HTML for a game card
    createGameCard(game) {
        const awayTeam = game.teams.away;
        const homeTeam = game.teams.home;
        const status = game.status;
        const statusDisplay = getGameStatusDisplay(status);
        const statusClass = getGameStatusClass(status);
        
        return `
            <div class="game-card" data-gamepk="${game.gamePk}">
                <div class="game-status ${statusClass}">${statusDisplay}</div>
                <div class="team-row">
                    <div class="team-info">
                        <img class="team-logo" src="${getTeamLogoUrl(awayTeam.team.id)}" alt="${awayTeam.team.name} logo" onerror="this.src='/static/img/mlb-logo.png'">
                        <div>
                            <div class="team-name">${awayTeam.team.name}</div>
                            <div class="team-record">(${awayTeam.leagueRecord.wins}-${awayTeam.leagueRecord.losses})</div>
                        </div>
                    </div>
                    <div class="team-score ${awayTeam.isWinner ? 'winner' : ''}">${awayTeam.score !== undefined ? awayTeam.score : '-'}</div>
                </div>
                <div class="team-row">
                    <div class="team-info">
                        <img class="team-logo" src="${getTeamLogoUrl(homeTeam.team.id)}" alt="${homeTeam.team.name} logo" onerror="this.src='/static/img/mlb-logo.png'">
                        <div>
                            <div class="team-name">${homeTeam.team.name}</div>
                            <div class="team-record">(${homeTeam.leagueRecord.wins}-${homeTeam.leagueRecord.losses})</div>
                        </div>
                    </div>
                    <div class="team-score ${homeTeam.isWinner ? 'winner' : ''}">${homeTeam.score !== undefined ? homeTeam.score : '-'}</div>
                </div>
                <div class="game-details">
                    ${game.venue.name} | ${game.seriesDescription}
                </div>
            </div>
        `;
    }
    
    // Handle game card click
    handleGameCardClick(gamePk) {
        // Hide scoreboard and show game detail
        document.getElementById('scoreboard').classList.add('hidden');
        document.getElementById('game-detail').classList.remove('hidden');
        
        // Load game details
        window.boxScore.loadBoxScore(gamePk);
        window.atBat.loadAtBatData(gamePk);
        window.playByPlay.loadPlayByPlay(gamePk);
        
        // Set active tab
        document.querySelector('.tab-btn[data-tab="box-score"]').click();
    }
}
