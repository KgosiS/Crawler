# Crawler

## Fieldnote site monitor

The dashboard uses Firebase Authentication (Google or email/password) and lets
signed-in users trigger a one-shot HTTPS response check of `auto83.vercel.app`.
The dashboard keeps recent results in the current browser session. The API
verifies Firebase ID tokens, checks only this configured target, and enforces a
60-second cooldown. Checks do not run browser scripts, follow page links, or
interact with ads.

### Configure Firebase

1. Create a Firebase web app and enable Email/Password and Google under
	Authentication sign-in providers.
2. Copy `.env.example` to `.env.local` and fill in the web app configuration.
3. Install the Firebase Admin SDK and configure Application Default Credentials
	for the same Firebase project. Keep the service-account key outside this
	repository.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json
npm install
npm run dev
```

Run the API in a second terminal with `.venv/bin/python backend.py`. Open the
Vite URL printed by `npm run dev`. For a single production-style server, run
`npm run build` followed by `.venv/bin/python backend.py` and open
`http://localhost:8765`.

## Passive performance monitor

`monitor.py` can also check an explicitly supplied page on a recurring interval.
It reports the HTTP status, time to response, total time to read up to 64 KiB,
and sampled bytes as JSON Lines. Use it only for a site you own or are
authorized to monitor.

Run it with the default 10-minute interval:

```sh
python3 monitor.py --url https://auto83.vercel.app/
```

Use `--interval-seconds`, `--timeout-seconds`, and `--sample-bytes` to adjust
the monitoring parameters. Stop it with Ctrl+C.