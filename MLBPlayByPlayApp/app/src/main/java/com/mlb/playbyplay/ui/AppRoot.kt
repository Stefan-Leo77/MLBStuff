package com.mlb.playbyplay.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.mlb.playbyplay.ui.games.GamesScreen
import com.mlb.playbyplay.ui.play.PlayByPlayScreen

@Composable
fun AppRoot() {
    val navController = rememberNavController()

    Scaffold(modifier = Modifier.fillMaxSize()) { _ ->
        NavHost(navController = navController, startDestination = "games") {
            composable("games") {
                GamesScreen(onOpenGame = { gamePk ->
                    navController.navigate("game/$gamePk")
                })
            }
            composable(
                route = "game/{gamePk}",
                arguments = listOf(navArgument("gamePk") { type = NavType.LongType })
            ) {
                val gamePk = it.arguments?.getLong("gamePk") ?: 0L
                PlayByPlayScreen(gamePk = gamePk)
            }
        }
    }
}
