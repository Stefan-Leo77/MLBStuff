import requests
import datetime

def get_today_gamepks():
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    url = f"https://statsapi.mlb.com/api/v1/schedule?sportId=1&date={today}"
    resp = requests.get(url, timeout=10)
    if resp.status_code != 200:
        print(f"Failed to get schedule: {resp.status_code}")
        return []
    data = resp.json()
    gamepks = []
    for date in data.get('dates', []):
        for game in date.get('games', []):
            # Only include games that are in progress or scheduled for today
            if game.get('status', {}).get('abstractGameState') in ['Live', 'In Progress', 'Final', 'Pre-Game', 'Warmup', 'Delayed Start', 'Manager Challenge', 'Suspended']:
                gamepks.append((game['gamePk'], game['status']['abstractGameState'], game['teams']['away']['team']['name'], game['teams']['home']['team']['name']))
    return gamepks

if __name__ == "__main__":
    games = get_today_gamepks()
    if not games:
        print("No games found for today.")
    else:
        print("Today's games:")
        for pk, state, away, home in games:
            print(f"gamePk: {pk} | State: {state} | {away} at {home}")
