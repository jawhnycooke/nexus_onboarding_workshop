"""Render a Fundamental HTML deck to PDF, one slide per page.

Usage:
    python fundamental_assets/build_pdf.py module_00
    python fundamental_assets/build_pdf.py module_00/module_00_presentation.html

Uses Chrome headless `--print-to-pdf`. The deck-stage component ships a
`@media print` stylesheet that lays every slide out at authored 1920x1080
with page breaks between them, plus an injected `@page { size: 1920px 1080px;
margin: 0 }` rule — so Chrome's print engine outputs a clean, full-bleed PDF
with one page per slide.

HTML remains the source of truth. Re-run after edits.
"""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def resolve_html(arg: str) -> Path:
    p = Path(arg).resolve()
    if p.is_dir():
        candidates = sorted(p.glob("*_presentation.html"))
        if not candidates:
            raise SystemExit(f"no *_presentation.html under {p}")
        return candidates[0]
    if p.suffix != ".html":
        raise SystemExit(f"expected an HTML file or directory, got {p}")
    return p


def build_pdf(html: Path, out_pdf: Path, profile_root: Path) -> None:
    """Render the HTML deck to PDF via Chrome headless print.

    Chrome's print pipeline doesn't exit cleanly on macOS — same story as
    --screenshot. We poll the output file for stable size, then terminate."""
    profile = profile_root / "p"
    profile.mkdir(parents=True, exist_ok=True)

    if out_pdf.exists():
        out_pdf.unlink()

    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        f"--user-data-dir={profile}",
        "--virtual-time-budget=10000",  # extra time for fonts + deck-stage init
        f"--print-to-pdf={out_pdf}",
        "--no-pdf-header-footer",
        f"file://{html}",
    ]

    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + 60
    last_size, stable = -1, 0
    try:
        while time.time() < deadline:
            if out_pdf.exists():
                size = out_pdf.stat().st_size
                if size > 1000 and size == last_size:
                    stable += 1
                    if stable >= 3:
                        return
                else:
                    stable = 0
                last_size = size
            time.sleep(0.3)
        raise SystemExit(f"print-to-pdf timed out for {html.name}")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            proc.kill()


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2

    html = resolve_html(argv[1])
    out_pdf = html.with_suffix(".pdf")
    print(f"rendering {html} -> {out_pdf}")

    import tempfile
    with tempfile.TemporaryDirectory(prefix="fd-pdf-") as tmp:
        build_pdf(html, out_pdf, Path(tmp))

    size_mb = out_pdf.stat().st_size / (1024 * 1024)
    print(f"done -> {out_pdf}  ({size_mb:.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
