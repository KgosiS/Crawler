import json
import os
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from monitor import check


ROOT = os.path.dirname(os.path.abspath(__file__))
TARGET_URL = "https://auto83.vercel.app/"
CHECK_COOLDOWN_SECONDS = 60
last_check_at = None
check_state_lock = threading.Lock()


def _firebase_api_key():
    api_key = os.environ.get("VITE_FIREBASE_API_KEY")
    if api_key:
        return api_key

    config_path = os.path.join(ROOT, ".env.local")
    if os.path.isfile(config_path):
        with open(config_path, encoding="utf-8") as config_file:
            for line in config_file:
                name, separator, value = line.partition("=")
                if separator and name.strip() == "VITE_FIREBASE_API_KEY":
                    return value.strip().strip("\"'")
    return None


def run_check(token):
    global last_check_at

    if not token:
        return 401, {"error": "Sign in to run a site check."}, {}

    api_key = _firebase_api_key()
    if not api_key:
        return 503, {"error": "Firebase web configuration is missing on the server."}, {}

    try:
        request = Request(
            f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}",
            data=json.dumps({"idToken": token}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with urlopen(request, timeout=10) as response:
            user_data = json.loads(response.read())
    except HTTPError as error:
        try:
            firebase_error = json.loads(error.read()).get("error", {}).get("message", "")
        except (json.JSONDecodeError, AttributeError):
            firebase_error = ""
        if firebase_error in {"INVALID_ID_TOKEN", "TOKEN_EXPIRED", "USER_DISABLED"}:
            return 401, {"error": "Your sign-in has expired. Please sign in again."}, {}
        return 503, {"error": "Firebase could not validate the sign-in right now."}, {}
    except (URLError, TimeoutError, OSError, json.JSONDecodeError):
        return 503, {"error": "Firebase could not validate the sign-in right now."}, {}

    if not user_data.get("users"):
        return 401, {"error": "Your sign-in has expired. Please sign in again."}, {}

    now = time.monotonic()
    with check_state_lock:
        if last_check_at is not None:
            remaining = CHECK_COOLDOWN_SECONDS - (now - last_check_at)
            if remaining > 0:
                return (
                    429,
                    {"error": "Please wait before running another check."},
                    {"Retry-After": str(int(remaining) + 1)},
                )
        last_check_at = now

    return 200, check(TARGET_URL, timeout=20, sample_bytes=65536), {}
