package com.mlb.playbyplay.util

import com.mlb.playbyplay.data.AppDatabase
import com.mlb.playbyplay.data.GameDao
import com.mlb.playbyplay.data.PlayDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DbBindings {
    @Provides @Singleton fun bindGameDao(db: AppDatabase): GameDao = db.gameDao()
    @Provides @Singleton fun bindPlayDao(db: AppDatabase): PlayDao = db.playDao()
}
