import json
import os
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

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

        try:
            import firebase_admin
            from firebase_admin import auth as firebase_auth

            try:
                app = firebase_admin.get_app()
            except ValueError:
                app = firebase_admin.initialize_app()
        except Exception:
            self.send_json(503, {"error": "Firebase Admin is not configured on the server."})
            return False

        try:
            firebase_auth.verify_id_token(token, app=app, check_revoked=True)
        except Exception:
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