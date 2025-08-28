
import requests
import json
import sys

# Set the base URL for the MLB StatsAPI
BASE_URL = "https://statsapi.mlb.com"
GAME_PK = "776567"

headers = {
    "Accept-Encoding": "gzip"
}

OUTPUT_FILE = "test_live_game_endpoints_output.txt"

class Tee:
    def __init__(self, *files):
        self.files = files
    def write(self, obj):
        for f in self.files:
            f.write(obj)
            f.flush()
    def flush(self):
        for f in self.files:
            f.flush()

def pretty_print(response, out):
    try:
        out.write(json.dumps(response.json(), indent=2) + "\n")
    except Exception as e:
        out.write(f"Non-JSON response or error: {e}\n")
        out.write(response.text + "\n")

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    tee = Tee(sys.stdout, f)

    # 1. /api/v1.1/game/{game_pk}/feed/live
    tee.write("\n--- Testing /api/v1.1/game/{game_pk}/feed/live ---\n")
    live_url = f"{BASE_URL}/api/v1.1/game/{GAME_PK}/feed/live"
    live_resp = requests.get(live_url, headers=headers)
    pretty_print(live_resp, tee)

    # 2. /api/v1.1/game/{game_pk}/feed/live/timestamps
    tee.write("\n--- Testing /api/v1.1/game/{game_pk}/feed/live/timestamps ---\n")
    timestamps_url = f"{BASE_URL}/api/v1.1/game/{GAME_PK}/feed/live/timestamps"
    timestamps_resp = requests.get(timestamps_url, headers=headers)
    pretty_print(timestamps_resp, tee)

    # 3. /api/v1.1/game/{game_pk}/feed/live/diffPatch
    tee.write("\n--- Testing /api/v1.1/game/{game_pk}/feed/live/diffPatch (no params) ---\n")
    diffpatch_url = f"{BASE_URL}/api/v1.1/game/{GAME_PK}/feed/live/diffPatch"
    diffpatch_resp = requests.get(diffpatch_url, headers=headers)
    pretty_print(diffpatch_resp, tee)

    # 3b. /api/v1.1/game/{game_pk}/feed/live/diffPatch with example timecodes
    # (You may need to adjust these timecodes to match actual values from the timestamps response)
    example_start = "20230827_153000"
    example_end = "20230827_154000"
    tee.write("\n--- Testing /api/v1.1/game/{game_pk}/feed/live/diffPatch (with params) ---\n")
    diffpatch_params = {
        "startTimecode": example_start,
        "endTimecode": example_end
    }
    diffpatch_resp2 = requests.get(diffpatch_url, headers=headers, params=diffpatch_params)
    pretty_print(diffpatch_resp2, tee)

    # 4. /api/v1.1/game/{game_pk}/feed/live with fields param
    tee.write("\n--- Testing /api/v1.1/game/{game_pk}/feed/live with fields param ---\n")
    fields_params = {
        "fields": "plays,score,teams"
    }
    live_fields_resp = requests.get(live_url, headers=headers, params=fields_params)
    pretty_print(live_fields_resp, tee)

    # 5. /api/v1.1/game/{game_pk}/feed/live with accent param
    tee.write("\n--- Testing /api/v1.1/game/{game_pk}/feed/live with accent param ---\n")
    accent_params = {
        "accent": "true"
    }
    live_accent_resp = requests.get(live_url, headers=headers, params=accent_params)
    pretty_print(live_accent_resp, tee)

    # 6. /api/v1.1/game/{game_pk}/feed/live with inclusiveTimecode param
    tee.write("\n--- Testing /api/v1.1/game/{game_pk}/feed/live with inclusiveTimecode param ---\n")
    inclusive_params = {
        "inclusiveTimecode": "true"
    }
    live_inclusive_resp = requests.get(live_url, headers=headers, params=inclusive_params)
    pretty_print(live_inclusive_resp, tee)

    tee.write("\n--- All endpoint tests complete. ---\n")
