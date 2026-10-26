#!/usr/bin/env python3
"""Keep the header, footer and shared <head> tags identical on every page.

Edit partials/header.html, partials/footer.html or partials/head.html, then run:

    python3 scripts/sync_layout.py

Each page keeps its own content; only the blocks between the PF:* markers are
rewritten. On a page that has no markers yet, the old <nav>, mobile menu and
<footer> are replaced and the markers are added.
"""
import html
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://www.goprofinish.com/"
PARTIALS = ROOT / "partials"


def read(name):
    return (PARTIALS / name).read_text(encoding="utf-8")


def find_balanced(s, start, tag):
    """Return the end index of the element whose opening tag starts at `start`."""
    pattern = re.compile(rf"<{tag}\b|</{tag}>", re.I)
    depth = 0
    for m in pattern.finditer(s, start):
        if m.group(0).lower().startswith("</"):
            depth -= 1
            if depth == 0:
                return m.end()
        else:
            depth += 1
    raise ValueError(f"unbalanced <{tag}>")


def replace_block(s, name, content, fallback):
    start, end = f"<!-- PF:{name}:START -->", f"<!-- PF:{name}:END -->"
    block = f"{start}\n{content.rstrip()}\n    {end}"
    if start in s:
        a = s.index(start)
        b = s.index(end) + len(end)
        return s[:a] + block + s[b:]
    return fallback(s, block)


def strip_comment_before(s, idx):
    """Drop a single HTML comment directly above idx (e.g. <!-- Footer -->)."""
    before = s[:idx]
    m = re.search(r"<!--[^>]*-->\s*$", before)
    return m.start() if m else idx


def header_fallback(s, block):
    m = re.search(r"<nav\b", s)
    if not m:
        raise ValueError("no <nav> found")
    a = strip_comment_before(s, m.start())
    b = find_balanced(s, m.start(), "nav")
    s = s[:a] + block + s[b:]
    mm = re.search(r'<div id="nav-menu"', s)
    if mm:
        a2 = strip_comment_before(s, mm.start())
        b2 = find_balanced(s, mm.start(), "div")
        s = s[:a2] + s[b2:]
    return s


def footer_fallback(s, block):
    m = re.search(r"<footer\b", s)
    if not m:
        raise ValueError("no <footer> found")
    a = strip_comment_before(s, m.start())
    b = find_balanced(s, m.start(), "footer")
    return s[:a] + block + s[b:]


def head_fallback(s, block):
    # Remove the old per-page business schema; the shared one replaces it.
    s = re.sub(r"\s*<!-- SEO Local Business Schema -->", "", s)
    s = re.sub(r'\s*<script type="application/ld\+json">\s*\{[^<]*?"AutoBodyShop".*?</script>', "", s, flags=re.S)
    return s.replace("</head>", f"    {block}\n</head>", 1)


def page_meta(s, path):
    title = re.search(r"<title>(.*?)</title>", s, re.S)
    desc = re.search(r'<meta name="description" content="(.*?)"', s, re.S)
    t = html.unescape(title.group(1).strip()) if title else "ProFinish Elite Glass & Keys"
    d = html.unescape(desc.group(1).strip()) if desc else ""
    canonical = SITE if path.name == "index.html" else SITE + path.name
    return canonical, t, d


def mark_main(s):
    if 'id="main"' in s:
        return s
    if re.search(r"<main\b", s):
        return re.sub(r"<main\b", '<main id="main"', s, count=1)
    end = s.index("<!-- PF:HEADER:END -->")
    m = re.compile(r"<section\b").search(s, end)
    return s[: m.start()] + '<span id="main"></span>\n    ' + s[m.start():] if m else s


def sync(path):
    s = path.read_text(encoding="utf-8")
    canonical, title, desc = page_meta(s, path)
    head = (read("head.html")
            .replace("{{CANONICAL}}", canonical)
            .replace("{{TITLE}}", html.escape(title, quote=True))
            .replace("{{DESCRIPTION}}", html.escape(desc, quote=True)))
    s = replace_block(s, "HEAD", head, head_fallback)
    s = replace_block(s, "HEADER", read("header.html"), header_fallback)
    s = replace_block(s, "FOOTER", read("footer.html"), footer_fallback)
    s = mark_main(s)
    path.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    pages = [pathlib.Path(p) for p in sys.argv[1:]] or sorted(ROOT.glob("*.html"))
    for p in pages:
        sync(p)
        print("synced", p.name)
