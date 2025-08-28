package com.mlb.playbyplay.ui.games

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.mlb.playbyplay.viewmodel.GamesViewModel

@Composable
fun GamesScreen(onOpenGame: (Long) -> Unit, viewModel: GamesViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) { viewModel.refreshGames() }

    when {
        state.loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Loading…") }
        state.games.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("No live games") }
        else -> LazyColumn(Modifier.fillMaxSize().padding(8.dp)) {
            items(state.games) { game ->
                Card(Modifier.fillMaxWidth().padding(8.dp).clickable { onOpenGame(game.gamePk) }) {
                    Column(Modifier.padding(12.dp)) {
                        Text("${'$'}{game.awayTeam} @ ${'$'}{game.homeTeam}", style = MaterialTheme.typography.titleMedium)
                        Text(game.status)
                        Text(game.startTime)
                    }
                }
            }
        }
    }
}
