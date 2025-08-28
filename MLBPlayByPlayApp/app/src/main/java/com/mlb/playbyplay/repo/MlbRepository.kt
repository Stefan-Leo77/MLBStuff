package com.mlb.playbyplay.repo

import com.mlb.playbyplay.data.GameDao
import com.mlb.playbyplay.data.GameSummary
import com.mlb.playbyplay.data.Play
import com.mlb.playbyplay.data.PlayDao
import com.mlb.playbyplay.network.MlbStatsApi
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MlbRepository @Inject constructor(
    private val api: MlbStatsApi,
    private val gameDao: GameDao,
    private val playDao: PlayDao,
    private val io: CoroutineDispatcher = Dispatchers.IO
) {
    fun observeGames() = gameDao.observeGames()
    fun observePlays(gamePk: Long) = playDao.observePlays(gamePk)

    suspend fun refreshGames(date: String? = null) = withContext(io) {
        val schedule = api.getSchedule(date = date)
        val games = schedule.dates.flatMap { it.games }
            .filter { it.status.abstractGameState.equals("Live", ignoreCase = true) || it.status.detailedState.contains("Live", true) || it.status.detailedState.contains("In Progress", true) }
            .map { g ->
            GameSummary(
                gamePk = g.gamePk,
                homeTeam = g.teams.home.team.teamName,
                awayTeam = g.teams.away.team.teamName,
                status = g.status.detailedState,
                startTime = g.gameDate,
            )
        }
        gameDao.clearAll()
        gameDao.upsertGames(games)
    }

    suspend fun refreshPlays(gamePk: Long) = withContext(io) {
        val feed = api.getGameFeed(gamePk)
        val plays = feed.liveData?.plays?.allPlays.orEmpty().map { p ->
            Play(
                gamePk = gamePk,
                playId = "${'$'}{p.atBatIndex}-${'$'}{p.about?.inning}-${'$'}{p.about?.halfInning}",
                description = p.result?.description.orEmpty(),
                inning = p.about?.inning ?: 0,
                inningHalf = p.about?.halfInning.orEmpty(),
                atBatIndex = p.atBatIndex,
                eventType = p.result?.eventType.orEmpty(),
                timestamp = System.currentTimeMillis(),
            )
        }
        // Insert ignoring duplicates by unique playId emulation via natural keys (Room constraint not added for brevity)
        playDao.insertPlays(plays)
    }

    suspend fun clearGamePlays(gamePk: Long) = withContext(io) {
        playDao.clearPlays(gamePk)
    }
}
