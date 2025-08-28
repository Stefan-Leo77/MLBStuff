import requests
from datetime import datetime, timedelta
import json

BASE_URL = "https://statsapi.mlb.com"
OUTPUT_FILE = "c:\\hw\\mlbfeed\\MLBStuff\\mlbtests_output.txt"

def write_output(endpoint, data):
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write(f"--- {endpoint} ---\n")
        f.write(json.dumps(data, indent=2))
        f.write("\n\n")

def get_most_recent_game_info():
    # Look back up to 7 days for a completed game
    for days_ago in range(0, 7):
        date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        resp = requests.get(f"{BASE_URL}/api/v1/schedule?sportId=1&date={date}")
        if resp.status_code != 200:
            continue
        data = resp.json()
        for date_info in data.get("dates", []):
            for game in date_info.get("games", []):
                if game.get("status", {}).get("detailedState") == "Final":
                    gamePk = game.get("gamePk")
                    teams = game.get("teams", {})
                    home_team = teams.get("home", {}).get("team", {})
                    away_team = teams.get("away", {}).get("team", {})
                    venue = game.get("venue", {})
                    # Try to get a guid from the live feed if possible
                    guid = None
                    pbp_resp = requests.get(f"{BASE_URL}/api/v1/game/{gamePk}/playByPlay")
                    if pbp_resp.status_code == 200:
                        pbp_data = pbp_resp.json()
                        all_plays = pbp_data.get("allPlays", [])
                        if all_plays:
                            guid = all_plays[0].get("playEndTime") or all_plays[0].get("playId")
                    return {
                        "gamePk": gamePk,
                        "home_teamId": home_team.get("id"),
                        "away_teamId": away_team.get("id"),
                        "venueId": venue.get("id"),
                        "guid": guid
                    }
    raise Exception("No recent completed game found.")

def test_schedule():
    resp = requests.get(f"{BASE_URL}/api/v1/schedule?sportId=1&date=2025-08-27")
    assert resp.status_code == 200
    data = resp.json()
    assert "dates" in data
    write_output("/api/v1/schedule", data)

def test_teams():
    resp = requests.get(f"{BASE_URL}/api/v1/teams")
    assert resp.status_code == 200
    data = resp.json()
    assert "teams" in data
    write_output("/api/v1/teams", data)

def test_game_status():
    resp = requests.get(f"{BASE_URL}/api/v1/gameStatus")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list) or isinstance(data, dict)
    write_output("/api/v1/gameStatus", data)

def test_boxscore():
    info = get_most_recent_game_info()
    gamePk = info["gamePk"]
    resp = requests.get(f"{BASE_URL}/api/v1/game/{gamePk}/boxscore")
    assert resp.status_code == 200
    data = resp.json()
    assert "teams" in data
    write_output(f"/api/v1/game/{gamePk}/boxscore", data)

def test_play_by_play():
    info = get_most_recent_game_info()
    gamePk = info["gamePk"]
    resp = requests.get(f"{BASE_URL}/api/v1/game/{gamePk}/playByPlay")
    assert resp.status_code == 200
    data = resp.json()
    assert "allPlays" in data
    write_output(f"/api/v1/game/{gamePk}/playByPlay", data)

def test_context_metrics_averages():
    info = get_most_recent_game_info()
    gamePk = info["gamePk"]
    guid = info["guid"] or "SOME_GUID"
    resp = requests.get(f"{BASE_URL}/api/v1/game/{gamePk}/{guid}/contextMetricsAverages")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    write_output(f"/api/v1/game/{gamePk}/{guid}/contextMetricsAverages", data)

def test_team_roster():
    info = get_most_recent_game_info()
    teamId = info["home_teamId"]
    resp = requests.get(f"{BASE_URL}/api/v1/teams/{teamId}/roster")
    assert resp.status_code == 200
    data = resp.json()
    assert "roster" in data
    write_output(f"/api/v1/teams/{teamId}/roster", data)

def test_venue():
    info = get_most_recent_game_info()
    venueId = info["venueId"]
    resp = requests.get(f"{BASE_URL}/api/v1/venues/{venueId}")
    assert resp.status_code == 200
    data = resp.json()
    assert "venue" in data or "venues" in data
    write_output(f"/api/v1/venues/{venueId}", data)

def test_weather_basic():
    info = get_most_recent_game_info()
    venueId = info["venueId"]
    resp = requests.get(f"{BASE_URL}/api/v1/weather/venues/{venueId}/basic")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    write_output(f"/api/v1/weather/venues/{venueId}/basic", data)

def test_uniforms_game():
    info = get_most_recent_game_info()
    gamePk = info["gamePk"]
    resp = requests.get(f"{BASE_URL}/api/v1/uniforms/game?gamePks={gamePk}")
    assert resp.status_code == 200
    data = resp.json()
    assert "uniforms" in data or isinstance(data, dict)
    write_output(f"/api/v1/uniforms/game?gamePks={gamePk}", data)

if __name__ == "__main__":
    # Clear the output file before running
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        pass

    test_schedule()
    test_teams()
    test_game_status()
    test_boxscore()
    test_play_by_play()
    test_context_metrics_averages()
    test_team_roster()
    test_venue()
    test_weather_basic()
    test_uniforms_game()