import json
import os
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from monitor import check


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
TARGET_URL = "https://auto83.vercel.app/"
CHECK_COOLDOWN_SECONDS = 60
last_check_at = None
check_state_lock = threading.Lock()


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def send_json(self, status, payload, headers=None):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def verify_firebase_token(self):
        authorization = self.headers.get("Authorization", "")
        if not authorization.startswith("Bearer "):
            self.send_json(401, {"error": "Sign in to run a site check."})
            return False

        token = authorization.removeprefix("Bearer ").strip()
        if not token:
            self.send_json(401, {"error": "Sign in to run a site check."})
            return False

        api_key = os.environ.get("VITE_FIREBASE_API_KEY")
        if not api_key:
            config_path = ROOT / ".env.local"
            if config_path.is_file():
                for line in config_path.read_text(encoding="utf-8").splitlines():
                    name, separator, value = line.partition("=")
                    if separator and name.strip() == "VITE_FIREBASE_API_KEY":
                        api_key = value.strip().strip("\"'")
                        break

        if not api_key:
            self.send_json(503, {"error": "Firebase web configuration is missing on the server."})
            return False

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
                self.send_json(401, {"error": "Your sign-in has expired. Please sign in again."})
            else:
                self.send_json(503, {"error": "Firebase could not validate the sign-in right now."})
            return False
        except (URLError, TimeoutError, OSError, json.JSONDecodeError):
            self.send_json(503, {"error": "Firebase could not validate the sign-in right now."})
            return False

        if not user_data.get("users"):
            self.send_json(401, {"error": "Your sign-in has expired. Please sign in again."})
            return False
        return True

    def do_GET(self):
        if urlsplit(self.path).path.startswith("/api/"):
            self.send_json(404, {"error": "API route not found."})
            return
        super().do_GET()

    def do_POST(self):
        global last_check_at

        if urlsplit(self.path).path != "/api/check":
            self.send_json(404, {"error": "API route not found."})
            return
        if not self.verify_firebase_token():
            return

        now = time.monotonic()
        with check_state_lock:
            if last_check_at is not None:
                remaining = CHECK_COOLDOWN_SECONDS - (now - last_check_at)
                if remaining > 0:
                    self.send_json(
                        429,
                        {"error": "Please wait before running another check."},
                        {"Retry-After": str(int(remaining) + 1)},
                    )
                    return
            last_check_at = now

        result = check(TARGET_URL, timeout=20, sample_bytes=65536)
        self.send_json(200, result)

    def log_message(self, format_string, *args):
        if self.path.startswith("/api/"):
            print(f"{self.address_string()} - {format_string % args}")
        else:
            super().log_message(format_string, *args)


def main():
    if not (DIST / "index.html").is_file():
        raise SystemExit("Build the dashboard first with: npm run build")

    port = int(os.environ.get("PORT", "8765"))
    server = ThreadingHTTPServer(("0.0.0.0", port), DashboardHandler)
    print(f"Fieldnote dashboard available at http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()