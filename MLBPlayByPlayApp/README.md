# MLB Play-by-Play (Android, Kotlin + Compose)

Lightweight, accessible, and production-ready app to display current status of each live MLB game, focusing on play-by-play for each game. Uses MLB StatsAPI, caches aggressively, and polls efficiently.

## Highlights
- Kotlin + Jetpack Compose + Material 3
- Retrofit + OkHttp with cache headers and short polling (7.5s) to reduce calls
- Room for local persistence and offline review of a game's play-by-play
- Hilt for DI, Navigation-Compose for routing
- Separate screens: Games list and per-game Play-by-Play

## Build
Open this folder (MLBPlayByPlayApp) in Android Studio (Hedgehog+). Build and run as usual.

## API
- Schedule: https://statsapi.mlb.com/api/v1/schedule
- Game feed: https://statsapi.mlb.com/api/v1.1/game/{gamePk}/feed/live

No API key required. A descriptive User-Agent is set.

## Notes
- Polling interval is ~7.5s; OkHttp enforces short cache to avoid redundant calls.
- Room stores plays so users can scroll back through prior plays.
- To further reduce calls, add ETag/If-None-Match handling. OkHttp can provide this if server supports it.

## Next steps
- Add unique constraint on Play(playId) in Room to hard-dedupe.
- Show more metadata (outs, count, runners) from linescore.
- Add WorkManager to schedule background refresh during live windows.
