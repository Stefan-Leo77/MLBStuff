package com.mlb.playbyplay.work

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.mlb.playbyplay.repo.MlbRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class LiveUpdateWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted params: WorkerParameters,
    private val repo: MlbRepository
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        // Refresh games list; individual game polling handled in UI to avoid background churn
        return try {
            repo.refreshGames()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
