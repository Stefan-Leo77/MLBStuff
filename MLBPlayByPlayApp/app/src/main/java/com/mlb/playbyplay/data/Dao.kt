package com.mlb.playbyplay.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface GameDao {
    @Query("SELECT * FROM games ORDER BY startTime DESC")
    fun observeGames(): Flow<List<GameSummary>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertGames(games: List<GameSummary>)

    @Query("DELETE FROM games")
    suspend fun clearAll()
}

@Dao
interface PlayDao {
    @Query("SELECT * FROM plays WHERE gamePk = :gamePk ORDER BY atBatIndex DESC, id DESC")
    fun observePlays(gamePk: Long): Flow<List<Play>>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertPlays(plays: List<Play>)

    @Query("DELETE FROM plays WHERE gamePk = :gamePk")
    suspend fun clearPlays(gamePk: Long)
}
