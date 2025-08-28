/**
 * Play-by-Play module - Handles the display of the play-by-play feed for a game
 */

class PlayByPlay {
    constructor() {
        this.container = document.getElementById('play-by-play');
        this.currentGamePk = null;
        this.updateInterval = null;
    }
    
    // Load play-by-play data for a game
    async loadPlayByPlay(gamePk) {
        this.currentGamePk = gamePk;
        clearInterval(this.updateInterval);
        
        try {
            // Show loading state
            const playsContainer = this.container.querySelector('.plays');
            showLoading(playsContainer);
            
            // Load initial data
            await this.fetchAndUpdatePlayByPlay();
            
            // Set up polling for live games
            this.setupLiveUpdates();
        } catch (error) {
            console.error('Error loading play-by-play data:', error);
            const playsContainer = this.container.querySelector('.plays');
            showError(playsContainer, 'Failed to load play-by-play data. Please try again later.');
        }
    }
    
    // Fetch and update play-by-play data
    async fetchAndUpdatePlayByPlay() {
        try {
            // Get play-by-play data
            const playByPlayData = await fetchAPI(`/api/game/${this.currentGamePk}/playByPlay`);
            
            if (!playByPlayData) {
                const playsContainer = this.container.querySelector('.plays');
                showError(playsContainer, 'Failed to load play-by-play data. Please try again later.');
                return;
            }
            
            // Get live feed data for additional context
            const gameData = await fetchAPI(`/api/game/${this.currentGamePk}/feed/live`);
            
            // Render play-by-play
            this.renderPlayByPlay(playByPlayData, gameData);
        } catch (error) {
            console.error('Error updating play-by-play data:', error);
        }
    }
    
    // Set up live updates for in-progress games
    setupLiveUpdates() {
        // Get live feed data to check game status
        fetchAPI(`/api/game/${this.currentGamePk}/feed/live`).then(gameData => {
            // Check if the game is in progress
            if (gameData && gameData.gameData && 
                (gameData.gameData.status.abstractGameState === 'Live' || 
                 gameData.gameData.status.abstractGameState === 'In Progress')) {
                
                // Poll for updates every 30 seconds
                this.updateInterval = setInterval(() => {
                    this.fetchAndUpdatePlayByPlay();
                }, 30000);
            }
        });
    }
    
    // Render the play-by-play feed
    renderPlayByPlay(playByPlayData, gameData) {
        const playsContainer = this.container.querySelector('.plays');
        const allPlays = playByPlayData.allPlays || [];
        
        if (allPlays.length === 0) {
            playsContainer.innerHTML = '<div class="no-plays">No play-by-play data available.</div>';
            return;
        }
        
        let playsHTML = '';
        let currentInning = null;
        let currentHalfInning = null;
        
        // Process each play
        allPlays.forEach((play, idx) => {
            const inning = play.about.inning;
            const halfInning = play.about.halfInning;
            
            // Add inning header if changing innings
            if (inning !== currentInning || halfInning !== currentHalfInning) {
                playsHTML += `<div class="inning-header">${formatInning(halfInning, inning)}</div>`;
                currentInning = inning;
                currentHalfInning = halfInning;
            }
            
            // Add play details
            playsHTML += this.createPlayHTML(play, gameData, idx);
        });
        
        playsContainer.innerHTML = playsHTML;
    }
    
    // Create HTML for an individual play
    createPlayHTML(play, gameData, playIndex) {
        const result = play.result || {};
        const description = result.description || 'No description available';

        // Get batter and pitcher info
        const batterName = play.matchup?.batter?.fullName || 'Unknown Batter';
        const pitcherName = play.matchup?.pitcher?.fullName || 'Unknown Pitcher';

        // Get event type
        const eventType = result.eventType || 'Unknown';
        let eventClass = '';

        // Set class based on event type
        if (['home_run', 'triple', 'double', 'single'].includes(eventType)) {
            eventClass = 'hit';
        } else if (['strikeout', 'strikeout_double_play', 'field_out', 'force_out', 'grounded_into_double_play'].includes(eventType)) {
            eventClass = 'out';
        } else if (['walk', 'intent_walk'].includes(eventType)) {
            eventClass = 'walk';
        } else if (eventType === 'run') {
            eventClass = 'run';
        }

        // Build rich details
        const pitchEvents = this.getPitchEvents(play, gameData, playIndex);
        const runnersDetails = this.getRunnersDetails(play);
        const countsDetails = this.getCountsSummary(play);
        const contextDetails = this.getContextSummary(play);
        const rbiText = (result.rbi || result.rbi === 0) ? `RBI: ${result.rbi}` : '';        

        // Optional score after play
        let scoreText = '';
        if (typeof result?.awayScore === 'number' && typeof result?.homeScore === 'number') {
            const awayName = gameData?.gameData?.teams?.away?.name || 'Away';
            const homeName = gameData?.gameData?.teams?.home?.name || 'Home';
            const awayAbbr = getTeamAbbreviation ? getTeamAbbreviation(awayName) : awayName;
            const homeAbbr = getTeamAbbreviation ? getTeamAbbreviation(homeName) : homeName;
            scoreText = `Score: ${awayAbbr} ${result.awayScore} - ${homeAbbr} ${result.homeScore}`;
        }

        // Compose pitch list HTML
        let pitchesHTML = '';
        if (pitchEvents && pitchEvents.length > 0) {
            pitchesHTML = `
                <div class="pitch-sequence">
                    <div class="section-title">Pitches</div>
                    <ol>
                        ${pitchEvents.map(ev => `<li>${this.formatPitchEvent(ev)}</li>`).join('')}
                    </ol>
                </div>`;
        }

        // Runners movement
        let runnersHTML = '';
        if (runnersDetails && runnersDetails.length > 0) {
            runnersHTML = `
                <div class="runners-movement">
                    <div class="section-title">Runners</div>
                    <ul>
                        ${runnersDetails.map(t => `<li>${t}</li>`).join('')}
                    </ul>
                </div>`;
        }

        // Create HTML
        return `
            <div class="play ${eventClass}">
                <div class="play-matchup">${batterName} vs. ${pitcherName}</div>
                <div class="play-description">${description}</div>
                <div class="play-meta">
                    ${[countsDetails, contextDetails, rbiText, scoreText].filter(Boolean).join(' • ')}
                </div>
                <div class="play-details">
                    ${pitchesHTML}
                    ${runnersHTML}
                </div>
            </div>
        `;
    }

    // Try to resolve pitch events from the play itself or from the live feed fallback
    getPitchEvents(play, gameData, playIndex) {
        if (Array.isArray(play.playEvents) && play.playEvents.length > 0) {
            return play.playEvents.filter(e => e && (e.isPitch || e.isPitch === true));
        }
        const liveAllPlays = gameData?.liveData?.plays?.allPlays;
        if (Array.isArray(liveAllPlays)) {
            // Try by atBatIndex first
            const atBatIndex = play?.about?.atBatIndex;
            let candidate = null;
            if (typeof atBatIndex === 'number') {
                candidate = liveAllPlays.find(p => p?.about?.atBatIndex === atBatIndex);
            }
            // Fallback: same inning/half and nearest index
            if (!candidate) {
                candidate = liveAllPlays.find(p => p?.about?.inning === play?.about?.inning && p?.about?.halfInning === play?.about?.halfInning);
            }
            if (candidate && Array.isArray(candidate.playEvents)) {
                return candidate.playEvents.filter(e => e && (e.isPitch || e.isPitch === true));
            }
        }
        // Last resort: currentPlay
        const current = gameData?.liveData?.plays?.currentPlay;
        if (current && Array.isArray(current.playEvents)) {
            return current.playEvents.filter(e => e && (e.isPitch || e.isPitch === true));
        }
        return [];
    }

    // Format a single pitch event into human-readable text
    formatPitchEvent(ev) {
        try {
            const num = ev.pitchNumber || ev?.details?.pitchNumber || '';
            const desc = ev?.details?.description || ev?.details?.call?.description || 'Pitch';
            const type = ev?.details?.type?.description || ev?.details?.pitchType || '';
            const mph = ev?.pitchData?.startSpeed ? `${Math.round(ev.pitchData.startSpeed)} mph` : '';
            const zone = ev?.pitchData?.coordinates ? this.formatZone(ev.pitchData.coordinates) : '';
            const count = ev?.count ? this.formatCount(ev.count.balls ?? null, ev.count.strikes ?? null) : '';
            const extras = [type, mph, zone, count].filter(Boolean).join(', ');
            return `${num ? `#${num} ` : ''}${desc}${extras ? ` (${extras})` : ''}`;
        } catch (e) {
            return 'Pitch';
        }
    }

    // Format coordinate zone (rough)
    formatZone(coords) {
        const x = coords?.x;
        const y = coords?.y;
        if (typeof x === 'number' && typeof y === 'number') {
            return `loc x:${x.toFixed(2)} y:${y.toFixed(2)}`;
        }
        return '';
    }

    // Build runner movement text from play.runners
    getRunnersDetails(play) {
        const runners = Array.isArray(play?.runners) ? play.runners : [];
        const items = [];
        runners.forEach(r => {
            const start = r?.movement?.start || r?.movement?.originBase || null;
            const end = r?.movement?.end || r?.movement?.endBase || null;
            const isOut = r?.movement?.isOut || r?.details?.isOut || false;
            const runnerName = r?.details?.runner?.fullName || r?.runner?.fullName || 'Runner';
            let text = `${runnerName} `;
            if (isOut) {
                const outBase = r?.movement?.outBase || end || 'on the play';
                text += `out at ${outBase}`;
            } else if (start && end) {
                text += `advances ${start} 812 ${end}`; // arrow
            } else if (end && !start) {
                text += `reaches ${end}`;
            } else {
                text += `status unchanged`;
            }
            const event = r?.details?.event || r?.details?.eventType;
            if (event) text += ` (${event})`;
            items.push(text);
        });
        return items;
    }

    // Summarize final count and outs after the play
    getCountsSummary(play) {
        const count = play?.count || play?.about?.count;
        const balls = count?.balls;
        const strikes = count?.strikes;
    const outs = (count?.outs ?? play?.about?.outsAfterPlay ?? play?.about?.outs) || null;
        const bits = [];
        if (typeof balls === 'number' && typeof strikes === 'number') {
            bits.push(`Count: ${balls}-${strikes}`);
        }
        if (typeof outs === 'number') {
            bits.push(`Outs: ${outs}`);
        }
        return bits.join(' • ');
    }

    // Summarize inning/outs context
    getContextSummary(play) {
        const abIdx = (typeof play?.about?.atBatIndex === 'number') ? `AB#${play.about.atBatIndex}` : null;
        const inning = play?.about?.inning;
        const half = play?.about?.halfInning;
        const when = (inning && half) ? formatInning(half, inning) : null;
        const scoring = [];
        const runsScored = play?.result?.runsScored || play?.result?.rbi;
        if (typeof runsScored === 'number') scoring.push(`${runsScored} run${runsScored === 1 ? '' : 's'} scored`);
        return [abIdx, when, scoring.join(', ')].filter(Boolean).join(' • ');
    }
    
    // Clean up resources when navigating away
    cleanup() {
        clearInterval(this.updateInterval);
    }
}
