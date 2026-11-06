import argparse
import json
import time
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def check(url, timeout, sample_bytes):
    started = time.perf_counter()
    request = Request(url, headers={"User-Agent": "PassivePerformanceMonitor/1.0"})

    try:
        response = urlopen(request, timeout=timeout)
    except HTTPError as error:
        response = error
    except (URLError, TimeoutError, OSError) as error:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "url": url,
            "error": str(error),
        }

    with response:
        first_byte = time.perf_counter()
        body = response.read(sample_bytes)
        finished = time.perf_counter()
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "url": url,
            "status": response.getcode(),
            "response_ms": round((first_byte - started) * 1000, 2),
            "sample_ms": round((finished - started) * 1000, 2),
            "bytes_sampled": len(body),
        }


def main():
    parser = argparse.ArgumentParser(
        description="Periodically measure a page response without browser interaction."
    )
    parser.add_argument("--url", required=True, help="Page URL you are authorized to monitor")
    parser.add_argument("--interval-seconds", type=float, default=600)
    parser.add_argument("--timeout-seconds", type=float, default=20)
    parser.add_argument("--sample-bytes", type=int, default=65536)
    args = parser.parse_args()

    if args.interval_seconds <= 0 or args.timeout_seconds <= 0 or args.sample_bytes <= 0:
        parser.error("interval, timeout, and sample size must be greater than zero")

    next_check = time.monotonic()
    try:
        while True:
            result = check(args.url, args.timeout_seconds, args.sample_bytes)
            print(json.dumps(result), flush=True)

            next_check += args.interval_seconds
            now = time.monotonic()
            if next_check <= now:
                next_check = now + args.interval_seconds
            time.sleep(next_check - now)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()