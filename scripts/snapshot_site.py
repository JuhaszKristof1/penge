#!/usr/bin/env python3
"""GRIDLINE – a futó weboldal offline, statikus példányának elkészítése.

A megadott oldalakat headless Chromiummal rendereli (hogy a kliensoldalon
betöltött, adatbázisból származó tartalom is benne legyen), majd kimenti a
kész DOM-ot önálló HTML-fájlokba, a CSS-sel, a fontokkal és a képekkel együtt.

A <script> elemeket eltávolítja: a példány így valóban statikus. Ez szándékos,
mert offline nincs Supabase-kapcsolat, a React hidratálás pedig hibaállapotra
cserélné a kimentett tartalmat.

Eredmény: `public/site/` – az `index.html` közvetlenül megnyitható, szerver nélkül.

Használat:  python3 scripts/snapshot_site.py [--base http://localhost:12000]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from http.client import HTTPConnection
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "site"

# Útvonal -> kimeneti fájl. Az admin végpontok kimaradnak: szerveroldali
# munkamenetet és szerepkört igényelnek, statikusan nincs értelmük.
ROUTES: list[tuple[str, str]] = [
    ("/", "index.html"),
    ("/versenypalyak", "versenypalyak/index.html"),
    ("/ranglistak", "ranglistak/index.html"),
    ("/kozosseg", "kozosseg/index.html"),
    ("/garazs", "garazs/index.html"),
    ("/alkatreszek", "alkatreszek/index.html"),
    ("/kompatibilitas", "kompatibilitas/index.html"),
    ("/koridok/feltoltes", "koridok/feltoltes/index.html"),
    ("/koridok/gps", "koridok/gps/index.html"),
    ("/fejlodes", "fejlodes/index.html"),
    ("/fejlodes/licencrendszer", "fejlodes/licencrendszer/index.html"),
    ("/fejlodes/pontok", "fejlodes/pontok/index.html"),
    ("/rolunk", "rolunk/index.html"),
    ("/utitervek", "utitervek/index.html"),
    ("/kapcsolat", "kapcsolat/index.html"),
    ("/letoltes", "letoltes/index.html"),
    ("/bejelentkezes", "bejelentkezes/index.html"),
    ("/regisztracio", "regisztracio/index.html"),
]

TRACK_SLUGS = [
    "hungaroring",
    "pannonia-ring",
    "euroring",
    "rabocsiring",
    "kakucs-ring",
    "balaton-park-circuit",
]

for _slug in TRACK_SLUGS:
    ROUTES.append((f"/versenypalyak/{_slug}", f"versenypalyak/{_slug}/index.html"))

ROUTE_MAP = {route: out for route, out in ROUTES}

CDP_NODE = r"""
const ws = new WebSocket(process.argv[1]);
const calls = JSON.parse(process.argv[2]);
let seq = 0;
const results = [];
const send = (method, params) => new Promise((resolve) => {
  const id = ++seq;
  const onMessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id === id) { ws.removeEventListener('message', onMessage); resolve(msg.result ?? {}); }
  };
  ws.addEventListener('message', onMessage);
  ws.send(JSON.stringify({ id, method, params }));
});
ws.onopen = async () => {
  for (const [method, params] of calls) results.push(await send(method, params));
  console.log(JSON.stringify(results));
  ws.close();
};
ws.onerror = () => { console.error('ws error'); process.exit(1); };
"""


def run_cdp(ws_url: str, calls: list[tuple[str, dict]]) -> list[dict]:
    proc = subprocess.run(
        ["node", "-e", CDP_NODE, ws_url, json.dumps(calls)],
        capture_output=True,
        text=True,
        timeout=240,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"CDP hiba: {proc.stderr[:500]}")
    return json.loads(proc.stdout or "[]")


def evaluate(ws_url: str, expression: str) -> str:
    result = run_cdp(
        ws_url,
        [("Runtime.evaluate", {"expression": expression, "returnByValue": True, "awaitPromise": True})],
    )
    return result[0]["result"].get("value", "")


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def wait_for_chrome(port: int, timeout: float = 40.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            conn = HTTPConnection("127.0.0.1", port, timeout=1)
            conn.request("GET", "/json/version")
            if conn.getresponse().status == 200:
                return
        except OSError:
            pass
        time.sleep(0.3)
    raise RuntimeError("a Chromium nem indult el")


def rewrite_links(html: str, out_rel: str) -> str:
    """Gyökérrel kezdődő hivatkozásokat relatívvá alakít a kimeneti fájlhoz."""
    depth = out_rel.count("/")
    prefix = "../" * depth

    def to_relative(match: re.Match[str]) -> str:
        attr, url = match.group(1), match.group(2)
        path = urllib.parse.urlparse(url).path

        # Kép/erőforrás: a fájlt a site/ alá is kimásoljuk, csak előtag kell.
        if attr == "src" or path.startswith("/_next/"):
            return f'{attr}="{prefix}{path.lstrip("/")}"'

        target = ROUTE_MAP.get(path)
        if target:
            return f'{attr}="{prefix}{target}"'

        # Ismeretlen belső oldal (pl. dinamikus azonosító): a főoldalra visz.
        if path.startswith("/") and not path.endswith((".css", ".svg", ".jpg", ".png", ".webp", ".ico")):
            return f'{attr}="{prefix}index.html"'

        return f'{attr}="{prefix}{path.lstrip("/")}"'

    html = re.sub(r'(href|src)="(/[^"]*)"', to_relative, html)
    html = html.replace("url(/_next/", f"url({prefix}_next/")
    return html


def strip_scripts(html: str) -> str:
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S | re.I)
    html = re.sub(r"<script\b[^>]*/>", "", html, flags=re.I)
    html = re.sub(r'<link[^>]+rel="(?:preload|modulepreload)"[^>]*>', "", html, flags=re.I)
    return html


def collect_asset_urls(html: str, base: str) -> set[str]:
    urls: set[str] = set()
    for match in re.finditer(r'(?:href|src)="(/[^"]+\.(?:css|woff2?|jpg|jpeg|png|svg|webp))"', html):
        urls.add(base + match.group(1))
    for match in re.finditer(r"url\((/[^)]+)\)", html):
        urls.add(base + match.group(1))
    return urls


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:12000")
    args = parser.parse_args()
    base = args.base.rstrip("/")

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)

    port = free_port()
    profile = tempfile.mkdtemp(prefix="gridline-snap-")
    chrome = subprocess.Popen(
        [
            "/usr/bin/chromium",
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=1",
            f"--user-data-dir={profile}",
            f"--remote-debugging-port={port}",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        wait_for_chrome(port)
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=15) as resp:
            targets = json.load(resp)
        ws_url = next(t["webSocketDebuggerUrl"] for t in targets if t["type"] == "page")

        run_cdp(
            ws_url,
            [
                ("Page.enable", {}),
                (
                    "Emulation.setDeviceMetricsOverride",
                    {"width": 1440, "height": 1400, "deviceScaleFactor": 1, "mobile": False},
                ),
            ],
        )

        assets: set[str] = set()
        written = 0

        for route, out_rel in ROUTES:
            run_cdp(ws_url, [("Page.navigate", {"url": base + route})])
            time.sleep(2.5)

            html = evaluate(ws_url, "document.documentElement.outerHTML")
            if not html:
                print(f"  ! kihagyva (üres DOM): {route}")
                continue

            assets |= collect_asset_urls(html, base)
            html = strip_scripts(html)
            html = rewrite_links(html, out_rel)

            out_path = OUT_DIR / out_rel
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_text(html, encoding="utf-8")
            written += 1
            print(f"  ✓ {route}")

        copied = 0
        for url in sorted(assets):
            rel = urllib.parse.urlparse(url).path.lstrip("/")
            dest = OUT_DIR / rel
            if dest.exists():
                continue
            try:
                with urllib.request.urlopen(url, timeout=25) as resp:
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(resp.read())
                copied += 1
            except OSError as exc:
                print(f"  ! nem sikerült letölteni: {rel} ({exc})")

        # A CSS által hivatkozott fontok a .next/static/media alatt vannak.
        next_media = ROOT / ".next" / "static" / "media"
        font_dir = OUT_DIR / "_next" / "static" / "media"
        font_dir.mkdir(parents=True, exist_ok=True)
        fonts_copied = 0
        for css_path in OUT_DIR.rglob("*.css"):
            for match in re.finditer(r"url\(([^)]+\.woff2?)\)", css_path.read_text(encoding="utf-8", errors="replace")):
                name = Path(match.group(1)).name
                dest = font_dir / name
                if dest.exists():
                    continue
                src = next_media / name
                if src.is_file():
                    shutil.copy2(src, dest)
                    fonts_copied += 1

        # A public/ alatti képek (pályafotók, pályarajzok, alkatrész SVG-k) a
        # HTML-ben lazy-loading miatt nem feltétlenül jelennek meg URL-ként, ezért
        # a teljes public/ tartalmat átmásoljuk – a ZIP-eket kivéve.
        public_dir = ROOT / "public"
        copied_files = 0
        for src in public_dir.rglob("*"):
            if not src.is_file() or src.suffix in {".zip"}:
                continue
            if src.name in {"parts-preview.html"}:
                continue
            rel = src.relative_to(public_dir)
            if rel.parts and rel.parts[0] == "site":
                continue
            dest = OUT_DIR / rel
            if dest.exists():
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            copied_files += 1

        # A CSS-ben a fontok abszolút útvonalon szerepelnek, ami `file://` alatt
        # nem oldódik fel. A kimeneti CSS-ben ezért relatívvá írjuk át őket.
        for css_path in OUT_DIR.rglob("*.css"):
            text = css_path.read_text(encoding="utf-8", errors="replace")
            depth = css_path.relative_to(OUT_DIR).as_posix().count("/")
            prefix = "../" * depth
            rewritten = text.replace("url(/_next/", f"url({prefix}_next/")
            if rewritten != text:
                css_path.write_text(rewritten, encoding="utf-8")

        print(f"\n{written} oldal, {copied} erőforrás, {copied_files} public fájl, {fonts_copied} font -> {OUT_DIR}")
        return 0
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=10)
        except subprocess.TimeoutExpired:
            chrome.kill()
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
