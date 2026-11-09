import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from check_service import run_check


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"


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

    def do_GET(self):
        if urlsplit(self.path).path.startswith("/api/"):
            self.send_json(404, {"error": "API route not found."})
            return
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/check":
            self.send_json(404, {"error": "API route not found."})
            return

        authorization = self.headers.get("Authorization", "")
        token = authorization.removeprefix("Bearer ").strip() if authorization.startswith("Bearer ") else ""
        status, payload, headers = run_check(token)
        self.send_json(status, payload, headers)

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