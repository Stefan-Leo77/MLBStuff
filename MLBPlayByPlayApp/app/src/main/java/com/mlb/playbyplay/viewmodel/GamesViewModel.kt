package com.mlb.playbyplay.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mlb.playbyplay.data.GameSummary
import com.mlb.playbyplay.repo.MlbRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class GamesViewModel @Inject constructor(
    private val repo: MlbRepository
) : ViewModel() {

    data class UiState(val loading: Boolean = true, val games: List<GameUi> = emptyList())
    data class GameUi(val gamePk: Long, val homeTeam: String, val awayTeam: String, val status: String, val startTime: String)

    private val loading = MutableStateFlow(true)

    val uiState: StateFlow<UiState> = repo.observeGames().map { list ->
        UiState(
            loading = loading.value,
            games = list.map { GameUi(it.gamePk, it.homeTeam, it.awayTeam, it.status, it.startTime) }
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState())

    fun refreshGames() {
        viewModelScope.launch {
            loading.emit(true)
            try { repo.refreshGames() } finally { loading.emit(false) }
        }
    }
}
