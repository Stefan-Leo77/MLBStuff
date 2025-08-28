package com.mlb.playbyplay.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface MlbStatsApi {
    // Games schedule for today
    @GET("/api/v1/schedule")
    suspend fun getSchedule(
        @Query("sportId") sportId: Int = 1,
    @Query("hydrate") hydrate: String = "team", // keep lightweight
    @Query("fields") fields: String = "dates,date,games(gamePk,status(abstractGameState,detailedState),teams(home(team(name,teamName)),away(team(name,teamName))),gameDate)",
        @Query("date") date: String? = null,
        @Query("gameType") gameType: String? = null,
    ): ScheduleResponse

    // Play by play
    @GET("/api/v1.1/game/{gamePk}/feed/live")
    suspend fun getGameFeed(
        @Path("gamePk") gamePk: Long,
    @Query("fields") fields: String? = null
    ): GameFeedResponse
}

@JsonClass(generateAdapter = true)
data class ScheduleResponse(
    val dates: List<ScheduleDate> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ScheduleDate(
    val date: String,
    val games: List<ScheduleGame> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ScheduleGame(
    val gamePk: Long,
    val status: Status,
    val teams: Teams,
    val gameDate: String,
)

@JsonClass(generateAdapter = true)
data class Status(val abstractGameState: String = "", val detailedState: String = "")

@JsonClass(generateAdapter = true)
data class Teams(val away: TeamSide, val home: TeamSide)

@JsonClass(generateAdapter = true)
data class TeamSide(val team: Team)

@JsonClass(generateAdapter = true)
data class Team(val id: Long, val name: String, val teamName: String)

@JsonClass(generateAdapter = true)
data class GameFeedResponse(
    val gameData: GameData? = null,
    val liveData: LiveData? = null,
)

@JsonClass(generateAdapter = true)
data class GameData(val game: GameInfo? = null)

@JsonClass(generateAdapter = true)
data class GameInfo(val pk: Long = 0)

@JsonClass(generateAdapter = true)
data class LiveData(val plays: AllPlays? = null)

@JsonClass(generateAdapter = true)
data class AllPlays(@Json(name = "allPlays") val allPlays: List<PlayDto> = emptyList())

@JsonClass(generateAdapter = true)
data class PlayDto(
    val atBatIndex: Int = 0,
    val result: Result? = null,
    val about: About? = null,
)

@JsonClass(generateAdapter = true)
data class Result(val eventType: String? = null, val description: String? = null)

@JsonClass(generateAdapter = true)
data class About(val inning: Int = 0, val halfInning: String = "", val hasReview: Boolean? = null, val startTime: String? = null)
