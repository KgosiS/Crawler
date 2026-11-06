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
3. In Firebase Authentication settings, add the development host to authorized
	domains if it is not already listed.

For this Codespaces preview, add
`glorious-parakeet-69gvgx9j44jjcrg9g-5173.app.github.dev` (hostname only, no
scheme or port) under Authentication > Settings > Authorized domains. For a
different preview URL, add that URL's hostname instead.

```sh
npm install
npm run dev
```

Run the API in a second terminal with `python3 backend.py`. Open the
Vite URL printed by `npm run dev`. For a single production-style server, run
`npm run build` followed by `python3 backend.py` and open
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