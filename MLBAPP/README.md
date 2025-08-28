# MLB Live Game Viewer

A lightweight production-quality web application for viewing live MLB games, box scores, and play-by-play data.

## Features

- **Scoreboard View**: Display of all games for a selected date with teams, scores, and status
- **Box Score**: Detailed box score with inning-by-inning runs, hits, and errors
- **At-Bat Visualization**: Live view of current at-bat with field situation, batter/pitcher stats, and pitch tracking
- **Play-By-Play**: Chronological play-by-play feed for the game

## Requirements

- Python 3.9+
- Flask
- Requests

## Installation

1. Clone the repository
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Configuration

The application uses a local MLB data file (`mlbtests_output.txt`) for development and testing. In a production environment, you would replace the local data access with direct API calls to the MLB StatsAPI.

## Usage

1. Start the application:
   ```
   python app.py
   ```
2. Open a web browser and go to `http://localhost:5000`

## Project Structure

- `/MLBAPP`: Main application directory
  - `app.py`: Flask application entry point
  - `/static`: Static assets
    - `/css`: CSS stylesheets
    - `/js`: JavaScript modules
    - `/img`: Images and logos
  - `/templates`: HTML templates

## API Endpoints Used

- `/api/v1/schedule`: List of games for a date
- `/api/v1/game/{gamePk}/boxscore`: Box score data
- `/api/v1.1/game/{gamePk}/feed/live`: Live game data
- `/api/v1/game/{gamePk}/playByPlay`: Play-by-play data

## Credits

- Data provided by MLB StatsAPI

## License

This project is licensed under the MIT License - see the LICENSE file for details.
