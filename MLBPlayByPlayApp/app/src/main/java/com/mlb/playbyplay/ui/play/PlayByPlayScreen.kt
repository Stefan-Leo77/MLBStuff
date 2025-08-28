package com.mlb.playbyplay.ui.play

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.mlb.playbyplay.viewmodel.PlayByPlayViewModel

@Composable
fun PlayByPlayScreen(gamePk: Long, viewModel: PlayByPlayViewModel = hiltViewModel()) {
    val state by viewModel.getState(gamePk).collectAsState()

    LaunchedEffect(gamePk) { viewModel.startObserving(gamePk) }

    Column(Modifier.fillMaxSize().padding(8.dp)) {
        Text("Play-by-Play", modifier = Modifier.padding(8.dp))
        LazyColumn(Modifier.fillMaxSize()) {
            items(state.plays) { play ->
                Column(Modifier.padding(8.dp)) {
                    Text(play.description)
                    Text("Inning ${'$'}{play.inningHalf} ${'$'}{play.inning}")
                }
            }
        }
    }
}
