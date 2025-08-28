package com.mlb.playbyplay.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mlb.playbyplay.data.Play
import com.mlb.playbyplay.repo.MlbRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PlayByPlayViewModel @Inject constructor(
    private val repo: MlbRepository
) : ViewModel() {

    data class UiState(val plays: List<Play> = emptyList())

    private val stateFlows = mutableMapOf<Long, MutableStateFlow<UiState>>()
    private var pollJobs = mutableMapOf<Long, Job>()

    fun getState(gamePk: Long): StateFlow<UiState> {
        return stateFlows.getOrPut(gamePk) {
            MutableStateFlow(UiState()).also { flow ->
                viewModelScope.launch {
                    repo.observePlays(gamePk).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
                        .collect { plays -> flow.emit(UiState(plays)) }
                }
            }
        }
    }

    fun startObserving(gamePk: Long) {
        if (pollJobs[gamePk]?.isActive == true) return
        pollJobs[gamePk] = viewModelScope.launch {
            while (true) {
                repo.refreshPlays(gamePk)
                delay(7_500) // Poll ~7.5s with OkHttp cache headers to reduce server load
            }
        }
    }

    override fun onCleared() {
        pollJobs.values.forEach { it.cancel() }
        super.onCleared()
    }
}
