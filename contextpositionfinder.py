import requests
import json
from datetime import datetime, timedelta

# Search back up to 14 days for a valid gamePk and guid
max_days_back = 14
gamePk = None
guid = None

for days_back in range(max_days_back):
    date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    schedule_url = f"https://statsapi.mlb.com/api/v1/schedule?sportId=1&date={date}"
    schedule_resp = requests.get(schedule_url)
    try:
        schedule_data = schedule_resp.json()
    except Exception:
        continue
    games = schedule_data.get("dates", [{}])[0].get("games", [])
    print(f"{date}: Found {len(games)} games")
    for game in games:
        gamePk_candidate = str(game.get("gamePk"))
        content = game.get("content", {})
        guid_candidate = None
        # If 'editorial' is not in content, try fetching from the content link
        if "editorial" not in content and "link" in content:
            content_url = f"https://statsapi.mlb.com{content['link']}"
            try:
                content_resp = requests.get(content_url)
                content_data = content_resp.json()
                editorial = content_data.get("editorial", {})
            except Exception as e:
                print(f"    Failed to fetch content from {content_url}: {e}")
                editorial = {}
        else:
            editorial = content.get("editorial", {})
        recap = editorial.get("recap", {})
        mlb = recap.get("mlb", {})
        guid_candidate = mlb.get("guid")
        print(f"  gamePk: {gamePk_candidate}, guid: {guid_candidate}")
        if not content:
            print("    No 'content' key in game")
        elif not editorial:
            print("    No 'editorial' key in content (even after fetch)")
            print("    content keys:", list(content.keys()))
            print("    content value:", json.dumps(content, indent=2)[:1000], "... (truncated)")
        elif not recap:
            print("    No 'recap' key in editorial")
        elif not mlb:
            print("    No 'mlb' key in recap")
        if guid_candidate and guid_candidate != "NO_GUID_FOUND":
            gamePk = gamePk_candidate
            guid = guid_candidate
            print(f"Found valid gamePk and guid on {date}")
            break
    if gamePk and guid:
        break

if not gamePk or not guid:
    print(f"No valid gamePk and guid found in the last {max_days_back} days.")
    exit(1)

print(f"Using gamePk: {gamePk}, guid: {guid}")

url = f"https://statsapi.mlb.com/api/v1/game/{gamePk}/{guid}/contextMetricsAverages"
headers = {"Accept-Encoding": "gzip"}

response = requests.get(url, headers=headers)

try:
    data = response.json()
    with open("context_metrics_output.json", "w") as f:
        json.dump(data, f, indent=2)
    print("Output saved to context_metrics_output.json")
    print("Top-level fields in response:", list(data.keys()))
except Exception as e:
    print("Failed to decode JSON. Status code:", response.status_code)
    print("Response text:", response.text)