package com.mlb.playbyplay.data

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [GameSummary::class, Play::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun gameDao(): GameDao
    abstract fun playDao(): PlayDao
}
