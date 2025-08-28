package com.mlb.playbyplay.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "games")
data class GameSummary(
    @PrimaryKey val gamePk: Long,
    val homeTeam: String,
    val awayTeam: String,
    val status: String,
    val startTime: String,
)

import androidx.room.Index

@Entity(tableName = "plays", indices = [Index(value = ["playId"], unique = true)])
data class Play(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val gamePk: Long,
    val playId: String,
    val description: String,
    val inning: Int,
    val inningHalf: String,
    val atBatIndex: Int,
    val eventType: String,
    val timestamp: Long,
)
