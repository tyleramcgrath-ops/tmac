#!/usr/bin/env python3
"""Site-wide SEO / AI-search-readiness audit.

Crawls a site from a seed URL, extracts the same on-page signals the
TypeScript engine in lib/engine/ collects (extract.ts), applies the same
severity model and scoring shape (scoring.ts), and prints a report plus
optional JSON/CSV output.

Deliberately dependency-light: requests + beautifulsoup4 + lxml. Anything the
script cannot measure is reported as unavailable rather than guessed — no
neutral score is presented as if it were real data.

    pip install requests beautifulsoup4 lxml
    python centris_audit.py https://example.com --max 500
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import threading
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass, field
from typing import Any, Iterable
from urllib.parse import urljoin, urlparse, urlunparse, parse_qsl, urlencode
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError as exc:  # pragma: no cover - startup guard
    sys.exit(f"Missing dependency: {exc.name}\n  pip install requests beautifulsoup4 lxml")


# ── Thresholds ───────────────────────────────────────────────────────────────
# Kept in one block so an auditor can see and tune every judgement the script
# makes. Values mirror lib/engine/extract.ts and lib/engine/scoring.ts.

TITLE_MIN, TITLE_MAX = 30, 60
META_DESC_MIN, META_DESC_MAX = 70, 160
THIN_CONTENT_WORDS = 300
AI_DEPTH_WORDS = 600

MAX_BODY_BYTES = 3 * 1024 * 1024
DEFAULT_TIMEOUT = 25
DEFAULT_CONCURRENCY = 4
CONTENT_TEXT_LIMIT = 60_000

DEFAULT_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 CentrisAuditBot/1.0"
)

# Severity weights used by the technical score, matching scoring.ts.
SEVERITY_WEIGHT = {"critical": 25, "warning": 8, "info": 3}
SEVERITY_ORDER = {"critical": 0, "warning": 1, "info": 2}

SKIP_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".ico", ".bmp",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".gz",
    ".tar", ".rar", ".7z", ".mp3", ".mp4", ".avi", ".mov", ".wmv", ".webm",
    ".css", ".js", ".json", ".xml", ".rss", ".atom", ".txt", ".woff", ".woff2",
    ".ttf", ".eot", ".dmg", ".exe", ".apk",
}

TRACKING_PARAMS = re.compile(r"^(utm_|fbclid$|gclid$|msclkid$|mc_[ce]id$|_ga$|ref$|yclid$)")

CTA_PATTERN = re.compile(
    r"\b(get started|sign up|signup|subscribe|buy now|add to cart|free trial|"
    r"start free|contact us|request (a )?demo|book (a )?(call|demo)|download|"
    r"learn more|get a quote|try (it|now|free))\b",
    re.I,
)

KNOWN_SCHEMA_TYPES = {
    "Organization", "LocalBusiness", "Article", "BlogPosting", "NewsArticle",
    "FAQPage", "Product", "Service", "Review", "AggregateRating",
    "BreadcrumbList", "WebPage", "WebSite", "HowTo", "VideoObject", "Person",
    "Event", "Recipe", "SoftwareApplication", "ItemList", "QAPage",
}

# Required properties per schema type — same set validateSchemaNode() enforces.
SCHEMA_REQUIRED: dict[str, list[str | tuple[str, ...]]] = {
    "Article": ["headline", "author", "datePublished"],
    "BlogPosting": ["headline", "author", "datePublished"],
    "NewsArticle": ["headline", "author", "datePublished"],
    "FAQPage": ["mainEntity"],
    "Product": ["name", ("offers", "aggregateRating", "review")],
    "HowTo": ["name", "step"],
    "BreadcrumbList": ["itemListElement"],
    "Organization": ["name"],
    "LocalBusiness": ["name"],
    "VideoObject": ["name", "thumbnailUrl", "uploadDate"],
    "Review": ["itemReviewed", "reviewRating"],
}


# ── Data model ───────────────────────────────────────────────────────────────


@dataclass
class Issue:
    code: str
    severity: str  # critical | warning | info
    message: str
    fix: str
    url: str | None = None


@dataclass
class Page:
    url: str
    final_url: str = ""
    status: int = 0
    fetch_ms: int = 0
    bytes: int = 0
    content_type: str | None = None
    redirect_chain: list[dict[str, Any]] = field(default_factory=list)
    error: str | None = None

    title: str | None = None
    meta_description: str | None = None
    canonical: str | None = None
    meta_robots: str | None = None
    lang: str | None = None
    noindex: bool = False
    indexable: bool = False
    https: bool = False
    mixed_content: bool = False

    h1: list[str] = field(default_factory=list)
    headings: list[dict[str, Any]] = field(default_factory=list)
    h2_count: int = 0
    h3_count: int = 0
    heading_skips: list[str] = field(default_factory=list)

    word_count: int = 0
    first_words: str = ""

    images: int = 0
    images_with_alt: int = 0
    images_missing_alt: int = 0

    internal_links: int = 0
    external_links: int = 0

    schema_types: list[str] = field(default_factory=list)
    schema_errors: list[str] = field(default_factory=list)
    open_graph: dict[str, str] = field(default_factory=dict)
    twitter_card: dict[str, str] = field(default_factory=dict)

    has_faq: bool = False
    faq_questions: list[str] = field(default_factory=list)
    has_toc: bool = False
    question_headings: int = 0
    author: str | None = None
    published_date: str | None = None
    modified_date: str | None = None
    has_contact_form: bool = False
    cta_count: int = 0

    issues: list[Issue] = field(default_factory=list)
    depth: int = 0
    in_sitemap: bool = False


# ── URL helpers ──────────────────────────────────────────────────────────────


def normalize_url(url: str) -> str:
    """Canonical form for dedupe: no fragment, no tracking params, no :80/:443."""
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    host = (parsed.hostname or "").lower()
    if parsed.port and not ((scheme == "http" and parsed.port == 80) or (scheme == "https" and parsed.port == 443)):
        host = f"{host}:{parsed.port}"
    query = urlencode([(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True)
                       if not TRACKING_PARAMS.match(k)])
    path = parsed.path or "/"
    return urlunparse((scheme, host, path, parsed.params, query, ""))


def registrable_host(host: str) -> str:
    return (host or "").lower().removeprefix("www.")


def same_site(url: str, root_host: str, include_subdomains: bool) -> bool:
    host = registrable_host(urlparse(url).hostname or "")
    if not host:
        return False
    if host == root_host:
        return True
    return include_subdomains and host.endswith("." + root_host)


def is_crawlable(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    path = parsed.path.lower()
    return not any(path.endswith(ext) for ext in SKIP_EXTENSIONS)


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


# ── Fetching ─────────────────────────────────────────────────────────────────


class Fetcher:
    """Thread-safe HTTP client with a global minimum interval between requests."""

    def __init__(self, user_agent: str, timeout: int, delay: float):
        self.timeout = timeout
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })
        self._lock = threading.Lock()
        self._next_slot = 0.0

    def _throttle(self) -> None:
        if self.delay <= 0:
            return
        with self._lock:
            now = time.monotonic()
            wait = max(0.0, self._next_slot - now)
            self._next_slot = max(now, self._next_slot) + self.delay
        if wait:
            time.sleep(wait)

    def get(self, url: str, any_text: bool = False) -> tuple[requests.Response | None, bytes, str | None]:
        """Return (response, capped body, error). Never raises.

        By default only HTML bodies are read; `any_text` also reads plain-text
        and XML payloads (robots.txt, sitemaps).
        """
        self._throttle()
        try:
            resp = self.session.get(url, timeout=self.timeout, allow_redirects=True, stream=True)
        except requests.exceptions.Timeout:
            return None, b"", "The page took too long to respond (timeout)."
        except requests.exceptions.SSLError as exc:
            return None, b"", f"TLS error: {exc}"
        except requests.exceptions.RequestException as exc:
            return None, b"", f"Fetch failed: {exc}"

        content_type = resp.headers.get("content-type", "")
        readable = r"text/|application/xhtml|application/xml|\+xml" if any_text else r"text/html|application/xhtml"
        body = b""
        try:
            if resp.ok and re.search(readable, content_type, re.I):
                chunks: list[bytes] = []
                total = 0
                for chunk in resp.iter_content(65_536):
                    chunks.append(chunk)
                    total += len(chunk)
                    if total >= MAX_BODY_BYTES:
                        break
                body = b"".join(chunks)[:MAX_BODY_BYTES]
        except requests.exceptions.RequestException as exc:
            return resp, b"", f"Fetch failed while reading body: {exc}"
        finally:
            resp.close()

        return resp, body, http_error(resp.status_code, content_type, bool(body))


def http_error(status: int, content_type: str, has_body: bool) -> str | None:
    if status == 403:
        return "The site blocked our crawler (403 Forbidden)."
    if status == 404:
        return "Page not found (404)."
    if status == 429:
        return "The site rate-limited our crawler (429)."
    if status >= 500:
        return f"The site returned a server error ({status})."
    if status >= 400:
        return f"HTTP {status}"
    if not has_body:
        return f"Not an HTML page (content-type: {content_type or 'unknown'})."
    return None


# ── Extraction ───────────────────────────────────────────────────────────────


def extract(page: Page, html: str) -> list[str]:
    """Populate `page` from HTML. Returns absolute links found on the page."""
    soup = BeautifulSoup(html, "lxml")

    ld_json = soup.find_all("script", attrs={"type": "application/ld+json"})
    schema_items = extract_schema(soup, ld_json)

    for tag in soup(["style", "noscript", "svg", "iframe"]):
        tag.decompose()
    for tag in soup.find_all("script"):
        if tag.get("type") != "application/ld+json":
            tag.decompose()

    # ── Head tags ──
    title_tag = soup.find("title")
    page.title = clean_text(title_tag.get_text()) if title_tag else None
    page.meta_description = meta_content(soup, "name", "description")
    canonical = soup.find("link", rel=lambda v: v and "canonical" in [r.lower() for r in as_list(v)])
    page.canonical = (canonical.get("href") or "").strip() or None if canonical else None
    page.meta_robots = meta_content(soup, "name", "robots")
    html_tag = soup.find("html")
    page.lang = (html_tag.get("lang") or "").strip() or None if html_tag else None
    page.noindex = bool(page.meta_robots and re.search(r"noindex", page.meta_robots, re.I))
    page.indexable = page.status == 200 and not page.noindex
    page.https = page.final_url.startswith("https://")

    page.open_graph = {
        m["property"]: m["content"]
        for m in soup.find_all("meta", property=True)
        if m.get("content") and m["property"].startswith("og:")
    }
    page.twitter_card = {
        m["name"]: m["content"]
        for m in soup.find_all("meta", attrs={"name": True})
        if m.get("content") and m["name"].startswith("twitter:")
    }

    # ── Headings ──
    headings: list[dict[str, Any]] = []
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
        text = clean_text(tag.get_text())
        if text:
            headings.append({"level": int(tag.name[1]), "text": text})
    page.headings = headings
    page.h1 = [h["text"] for h in headings if h["level"] == 1]
    page.h2_count = sum(1 for h in headings if h["level"] == 2)
    page.h3_count = sum(1 for h in headings if h["level"] == 3)
    page.question_headings = sum(1 for h in headings if h["text"].endswith("?"))

    previous = 0
    for h in headings:
        if previous and h["level"] > previous + 1:
            page.heading_skips.append(f"h{previous} → h{h['level']}")
        previous = h["level"]

    # ── Content ──
    content_text = clean_text(pick_content_root(soup).get_text(" "))[:CONTENT_TEXT_LIMIT]
    words = [w for w in content_text.split(" ") if w]
    page.word_count = len(words)
    page.first_words = " ".join(words[:100])

    # ── Images ──
    imgs = soup.find_all("img")
    page.images = len(imgs)
    page.images_with_alt = sum(1 for img in imgs if (img.get("alt") or "").strip())
    page.images_missing_alt = page.images - page.images_with_alt

    # ── Links ──
    page_host = registrable_host(urlparse(page.final_url).hostname or "")
    links: list[str] = []
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        try:
            absolute = urljoin(page.final_url, href)
        except ValueError:
            continue
        parsed = urlparse(absolute)
        if parsed.scheme not in ("http", "https"):
            continue
        if registrable_host(parsed.hostname or "") == page_host:
            page.internal_links += 1
            links.append(absolute)
        else:
            page.external_links += 1

    # ── Schema ──
    page.schema_types = list(dict.fromkeys(item["type"] for item in schema_items))
    page.schema_errors = [f"{item['type']}: {err}" for item in schema_items for err in item["errors"]]

    # ── Credibility / AI-readiness signals ──
    body_text = content_text.lower()
    page.faq_questions = faq_questions(soup, schema_items)
    page.has_faq = bool(page.faq_questions) or "FAQPage" in page.schema_types or "frequently asked questions" in body_text
    page.has_toc = bool(
        soup.select('[class*="table-of-contents"], [class*="toc"], [id*="table-of-contents"], #toc')
    ) or "table of contents" in body_text

    page.author = (
        meta_content(soup, "name", "author")
        or first_text(soup, '[rel="author"], [class*="author-name"], [itemprop="author"]')
        or schema_author(schema_items)
    )
    time_tag = soup.find("time", attrs={"datetime": True})
    page.published_date = (
        meta_content(soup, "property", "article:published_time")
        or (time_tag["datetime"].strip() if time_tag else None)
        or schema_date(schema_items, "datePublished")
    )
    page.modified_date = (
        meta_content(soup, "property", "article:modified_time")
        or schema_date(schema_items, "dateModified")
    )

    page.has_contact_form = any(
        re.search(r"contact|email|enquir|inquir|message|subscribe|newsletter|quote|demo",
                  f"{form.get_text()} {' '.join(as_list(form.get('class') or []))} {form.get('id') or ''}", re.I)
        or form.find("input", attrs={"type": "email"})
        for form in soup.find_all("form")
    )

    ctas: set[str] = set()
    for el in soup.find_all(["a", "button"]) + soup.find_all("input", attrs={"type": "submit"}):
        text = clean_text(el.get_text() or el.get("value") or "")
        if text and len(text) < 60 and CTA_PATTERN.search(text):
            ctas.add(text)
    page.cta_count = len(ctas)

    if page.https:
        page.mixed_content = bool(
            soup.select('img[src^="http://"], script[src^="http://"], link[rel="stylesheet"][href^="http://"]')
        )

    return links


def as_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return value
    return [value] if value else []


def meta_content(soup: BeautifulSoup, attr: str, value: str) -> str | None:
    tag = soup.find("meta", attrs={attr: value})
    if not tag:
        return None
    return (tag.get("content") or "").strip() or None


def first_text(soup: BeautifulSoup, selector: str) -> str | None:
    el = soup.select_one(selector)
    return clean_text(el.get_text()) or None if el else None


def pick_content_root(soup: BeautifulSoup):
    for selector in ("main", "article", '[role="main"]', "#content", ".content"):
        el = soup.select_one(selector)
        if el and len(clean_text(el.get_text(" "))) > 200:
            return el
    return soup.body or soup


def extract_schema(soup: BeautifulSoup, ld_json: Iterable) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for script in ld_json:
        raw = script.string or script.get_text()
        if not (raw or "").strip():
            continue
        try:
            parsed = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            items.append({"type": "Unknown", "raw": {}, "errors": ["Invalid JSON in JSON-LD script tag"]})
            continue
        for node in flatten_json_ld(parsed):
            node_type = json_ld_type(node)
            if node_type:
                items.append({"type": node_type, "raw": node, "errors": validate_schema_node(node_type, node)})

    for el in soup.select("[itemscope][itemtype]"):
        node_type = (el.get("itemtype") or "").rstrip("/").split("/")[-1]
        if node_type:
            items.append({"type": node_type, "raw": {}, "errors": []})
    return items


def flatten_json_ld(value: Any, nodes: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    nodes = [] if nodes is None else nodes
    if isinstance(value, list):
        for item in value:
            flatten_json_ld(item, nodes)
    elif isinstance(value, dict):
        if value.get("@type"):
            nodes.append(value)
        if isinstance(value.get("@graph"), list):
            flatten_json_ld(value["@graph"], nodes)
    return nodes


def json_ld_type(node: dict[str, Any]) -> str | None:
    node_type = node.get("@type")
    if isinstance(node_type, str):
        return node_type
    if isinstance(node_type, list) and node_type and isinstance(node_type[0], str):
        return node_type[0]
    return None


def validate_schema_node(node_type: str, node: dict[str, Any]) -> list[str]:
    def has(key: str) -> bool:
        return node.get(key) not in (None, "", [], {})

    errors: list[str] = []
    for requirement in SCHEMA_REQUIRED.get(node_type, []):
        if isinstance(requirement, tuple):
            if not any(has(key) for key in requirement):
                alternatives = " / ".join(f'"{key}"' for key in requirement)
                errors.append(f"Missing {alternatives} (one is required for rich results)")
        elif not has(requirement):
            errors.append(f'Missing "{requirement}"')
    return errors


def faq_questions(soup: BeautifulSoup, schema_items: list[dict[str, Any]]) -> list[str]:
    questions: dict[str, None] = {}
    for item in schema_items:
        if item["type"] != "FAQPage":
            continue
        main = item["raw"].get("mainEntity")
        for entry in main if isinstance(main, list) else ([main] if main else []):
            if isinstance(entry, dict) and isinstance(entry.get("name"), str):
                questions[clean_text(entry["name"])] = None
    for el in soup.find_all(["h2", "h3", "h4", "summary"]):
        text = clean_text(el.get_text())
        if text.endswith("?") and 8 < len(text) < 200:
            questions[text] = None
    return list(questions)[:40]


def schema_author(items: list[dict[str, Any]]) -> str | None:
    for item in items:
        author = item["raw"].get("author")
        if isinstance(author, str) and author:
            return author
        if isinstance(author, dict) and isinstance(author.get("name"), str):
            return author["name"]
    return None


def schema_date(items: list[dict[str, Any]], key: str) -> str | None:
    for item in items:
        value = item["raw"].get(key)
        if isinstance(value, str) and value:
            return value
    return None


# ── Crawler ──────────────────────────────────────────────────────────────────


class Crawler:
    def __init__(self, seed: str, args: argparse.Namespace):
        self.args = args
        self.seed = normalize_url(seed)
        parsed = urlparse(self.seed)
        self.root_host = registrable_host(parsed.hostname or "")
        self.origin = f"{parsed.scheme}://{parsed.netloc}"
        self.fetcher = Fetcher(args.user_agent, args.timeout, args.delay)

        self.pages: dict[str, Page] = {}
        self.referrers: dict[str, set[str]] = defaultdict(set)
        self.seen: set[str] = set()
        self.skipped_by_robots: list[str] = []
        self.not_crawled: set[str] = set()
        self.robots_available = False
        self.sitemap_urls: set[str] = set()
        self.sitemap_locations: list[str] = []
        self.robots: RobotFileParser | None = None
        self._lock = threading.Lock()

    # ── robots.txt / sitemaps ──

    def load_robots(self) -> None:
        url = f"{self.origin}/robots.txt"
        resp, body, _ = self.fetcher.get(url, any_text=True)
        if resp is None or resp.status_code != 200:
            return
        text = body.decode("utf-8", "replace")
        self.robots_available = True
        parser = RobotFileParser()
        parser.parse(text.splitlines())
        self.robots = parser
        self.sitemap_locations = [
            line.split(":", 1)[1].strip()
            for line in text.splitlines()
            if line.lower().startswith("sitemap:")
        ]
        crawl_delay = None
        try:
            crawl_delay = parser.crawl_delay(self.args.user_agent)
        except Exception:  # older parsers raise on odd input
            crawl_delay = None
        if crawl_delay and float(crawl_delay) > self.fetcher.delay:
            self.fetcher.delay = float(crawl_delay)
            log(f"  robots.txt requests a {crawl_delay}s crawl-delay — honoring it", self.args)

    def allowed(self, url: str) -> bool:
        if self.args.ignore_robots or self.robots is None:
            return True
        try:
            return self.robots.can_fetch(self.args.user_agent, url)
        except Exception:
            return True

    def load_sitemaps(self) -> None:
        locations = self.sitemap_locations or [f"{self.origin}/sitemap.xml"]
        visited: set[str] = set()
        queue = list(locations)
        while queue and len(self.sitemap_urls) < self.args.max * 4:
            location = queue.pop(0)
            if location in visited:
                continue
            visited.add(location)
            resp, body, _ = self.fetcher.get(location, any_text=True)
            if resp is None or resp.status_code != 200 or not body:
                continue
            try:
                root = ElementTree.fromstring(body)
            except ElementTree.ParseError:
                continue
            tag = root.tag.split("}")[-1]
            for loc in root.iter():
                if loc.tag.split("}")[-1] != "loc" or not (loc.text or "").strip():
                    continue
                value = loc.text.strip()
                if tag == "sitemapindex":
                    queue.append(value)
                elif same_site(value, self.root_host, self.args.include_subdomains):
                    self.sitemap_urls.add(normalize_url(value))
            if not self.sitemap_locations and tag in ("urlset", "sitemapindex"):
                self.sitemap_locations.append(location)

    # ── crawl ──

    def enqueue(self, url: str, depth: int, referrer: str | None) -> str | None:
        normalized = normalize_url(url)
        if referrer:
            self.referrers[normalized].add(referrer)
        if normalized in self.seen:
            return None
        if not is_crawlable(normalized) or not same_site(normalized, self.root_host, self.args.include_subdomains):
            return None
        if not self.allowed(normalized):
            self.seen.add(normalized)
            self.skipped_by_robots.append(normalized)
            return None
        if len(self.seen) >= self.args.max:
            self.not_crawled.add(normalized)
            return None
        self.seen.add(normalized)
        return normalized

    def fetch_one(self, url: str, depth: int) -> tuple[Page, list[str]]:
        started = time.monotonic()
        page = Page(url=url, final_url=url, depth=depth)
        resp, body, error = self.fetcher.get(url)
        page.fetch_ms = int((time.monotonic() - started) * 1000)
        page.error = error

        if resp is None:
            return page, []

        page.status = resp.status_code
        page.final_url = resp.url
        page.content_type = resp.headers.get("content-type")
        page.bytes = len(body) or int(resp.headers.get("content-length") or 0)
        page.redirect_chain = [{"url": h.url, "status": h.status_code} for h in resp.history]
        page.https = page.final_url.startswith("https://")

        if not body:
            return page, []
        links = extract(page, body.decode(resp.encoding or "utf-8", "replace"))
        return page, links

    def run(self) -> None:
        log(f"Fetching robots.txt at {self.origin}/robots.txt", self.args)
        self.load_robots()
        if not self.args.no_sitemap:
            self.load_sitemaps()
            if self.sitemap_urls:
                log(f"  sitemap: {len(self.sitemap_urls)} URL(s) discovered", self.args)

        frontier: list[tuple[str, int]] = []
        seed = self.enqueue(self.seed, 0, None)
        if seed:
            frontier.append((seed, 0))
        for url in sorted(self.sitemap_urls):
            queued = self.enqueue(url, 1, None)
            if queued:
                frontier.append((queued, 1))

        if not frontier:
            return

        workers = max(1, self.args.concurrency)
        with ThreadPoolExecutor(max_workers=workers) as pool:
            while frontier and len(self.pages) < self.args.max:
                room = self.args.max - len(self.pages)
                batch, frontier = frontier[:room], frontier[room:]
                results = list(pool.map(lambda item: self.fetch_one(*item), batch))
                for (url, depth), (page, links) in zip(batch, results):
                    page.in_sitemap = url in self.sitemap_urls
                    self.pages[url] = page
                    for link in links:
                        queued = self.enqueue(link, depth + 1, page.final_url)
                        if queued:
                            frontier.append((queued, depth + 1))
                log(f"  crawled {len(self.pages)}/{self.args.max} — {len(frontier)} queued", self.args)


# ── Issue detection ──────────────────────────────────────────────────────────


def page_issues(page: Page) -> list[Issue]:
    issues: list[Issue] = []

    def add(code: str, severity: str, message: str, fix: str) -> None:
        issues.append(Issue(code, severity, message, fix, page.url))

    if page.error and page.status == 0:
        add("unreachable", "critical", page.error, "Confirm the URL resolves and the server responds to crawlers.")
        return issues
    if page.status >= 500:
        add("http_5xx", "critical", f"Server error ({page.status}).", "Fix the server error or remove links to this URL.")
        return issues
    if page.status >= 400:
        add("http_4xx", "critical", f"Broken page ({page.status}).",
            "Restore the page or update/remove the internal links pointing at it.")
        return issues
    if page.status >= 300:
        add("http_3xx", "warning", f"Unresolved redirect status ({page.status}).", "Point links at the final URL.")

    if not page.https:
        add("no_https", "critical", "Page is served over HTTP.", "Serve the page over HTTPS and redirect HTTP to HTTPS.")
    if page.mixed_content:
        add("mixed_content", "critical", "HTTPS page loads HTTP subresources.",
            "Update image/script/stylesheet URLs to HTTPS.")
    if page.noindex:
        add("noindex", "critical", f'Page is noindex (robots: "{page.meta_robots}").',
            "Remove the noindex directive if this page should rank.")
    if len(page.redirect_chain) > 1:
        hops = " → ".join(str(h["status"]) for h in page.redirect_chain)
        add("redirect_chain", "warning", f"Redirect chain of {len(page.redirect_chain)} hops ({hops}).",
            "Link directly to the final URL to preserve crawl budget and link equity.")

    # ── Metadata ──
    if not page.title:
        add("title_missing", "critical", "No <title>.", "Add a unique, descriptive title tag.")
    else:
        length = len(page.title)
        if length > TITLE_MAX:
            add("title_long", "warning", f"Title is {length} chars (over {TITLE_MAX}).",
                f"Trim to under {TITLE_MAX} chars so it is not truncated in results.")
        elif length < TITLE_MIN:
            add("title_short", "info", f"Title is {length} chars (under {TITLE_MIN}).",
                "Expand the title to use the available space.")

    if not page.meta_description:
        add("meta_desc_missing", "warning", "No meta description.",
            "Write a unique 70–160 char description; search engines and AI summaries use it as a snippet.")
    else:
        length = len(page.meta_description)
        if length > META_DESC_MAX:
            add("meta_desc_long", "info", f"Meta description is {length} chars (over {META_DESC_MAX}).",
                "Trim so the snippet is not truncated.")
        elif length < META_DESC_MIN:
            add("meta_desc_short", "info", f"Meta description is {length} chars (under {META_DESC_MIN}).",
                "Expand to use the available snippet space.")

    if not page.canonical:
        add("canonical_missing", "info", "No canonical URL.",
            "Add a self-referencing canonical to consolidate duplicate URL variants.")
    elif normalize_url(urljoin(page.final_url, page.canonical)) != normalize_url(page.final_url):
        add("canonical_other", "info",
            f"Canonical points elsewhere ({page.canonical}).",
            "Confirm this is intentional — the page will not rank on its own URL otherwise.")

    if not page.lang:
        add("lang_missing", "info", "No lang attribute on <html>.", 'Add lang="en" (or the correct locale).')

    # ── Structure ──
    if not page.h1:
        add("h1_missing", "critical", "No H1.", "Add exactly one H1 describing the page topic.")
    elif len(page.h1) > 1:
        add("h1_multiple", "warning", f"{len(page.h1)} H1s on the page.", "Use exactly one H1; demote the rest to H2.")
    if page.heading_skips:
        add("heading_skip", "info", f"Heading levels skip ({', '.join(sorted(set(page.heading_skips))[:3])}).",
            "Keep heading levels sequential so the outline parses cleanly for assistive tech and AI extraction.")

    # ── Content ──
    if page.word_count < THIN_CONTENT_WORDS:
        add("thin_content", "warning", f"Only {page.word_count} words of body content.",
            f"Thin pages rarely win competitive queries — aim for {THIN_CONTENT_WORDS}+ words of substantive copy.")

    # ── Media ──
    if page.images_missing_alt:
        severity = "warning" if page.images_missing_alt > 5 else "info"
        add("img_alt_missing", severity,
            f"{page.images_missing_alt} of {page.images} images have no alt text.",
            "Add descriptive alt text — it is both an accessibility and an image-search signal.")

    # ── Schema ──
    if not page.schema_types:
        add("schema_missing", "warning", "No structured data.",
            "Add JSON-LD (Organization, WebPage, Article, FAQPage as appropriate) to be eligible for rich results.")
    for error in page.schema_errors:
        add("schema_invalid", "warning", f"Schema validation: {error}.",
            "Add the missing required property or the markup will not qualify for rich results.")

    # ── Social ──
    if not page.open_graph.get("og:title"):
        add("og_missing", "info", "No Open Graph tags.", "Add og:title/og:description/og:image to control link previews.")

    # ── Internal linking ──
    if page.internal_links == 0 and page.status == 200:
        add("no_internal_links", "warning", "Page links to no other pages on the site.",
            "Add contextual internal links so crawlers and readers can move on from this page.")

    return issues


def site_issues(crawler: Crawler) -> list[Issue]:
    issues: list[Issue] = []
    pages = [p for p in crawler.pages.values() if p.status == 200]

    def add(code: str, severity: str, message: str, fix: str, url: str | None = None) -> None:
        issues.append(Issue(code, severity, message, fix, url))

    if not crawler.robots_available:
        add("no_robots_txt", "warning", "No robots.txt found.",
            "Add robots.txt with a Sitemap: directive so crawlers find your URL inventory.")
    if not crawler.sitemap_urls:
        add("no_sitemap", "warning", "No XML sitemap found.",
            "Publish sitemap.xml and reference it from robots.txt.")
    elif not crawler.sitemap_locations:
        add("sitemap_not_declared", "info", "Sitemap exists but is not declared in robots.txt.",
            "Add a Sitemap: line to robots.txt.")

    for label, code, getter in (
        ("title", "duplicate_title", lambda p: p.title),
        ("meta description", "duplicate_meta_desc", lambda p: p.meta_description),
        ("H1", "duplicate_h1", lambda p: p.h1[0] if p.h1 else None),
    ):
        groups: dict[str, list[str]] = defaultdict(list)
        for page in pages:
            value = getter(page)
            if value:
                groups[value].append(page.url)
        for value, urls in sorted(groups.items(), key=lambda kv: -len(kv[1])):
            if len(urls) > 1:
                add(code, "warning",
                    f'{len(urls)} pages share the {label} "{truncate(value, 60)}".',
                    f"Give each page a unique {label} — duplicates make pages compete with each other.",
                    urls[0])

    # Broken internal links, attributed to the pages that link to them.
    for url, page in crawler.pages.items():
        if page.status >= 400 or (page.status == 0 and page.error):
            sources = sorted(crawler.referrers.get(url, set()))[:5]
            if sources:
                add("broken_internal_link", "critical",
                    f"{len(crawler.referrers[url])} page(s) link to {url} which returns "
                    f"{page.status or 'no response'}.",
                    f"Fix or remove the link. Linked from: {', '.join(sources)}",
                    url)

    # Pages in the sitemap that nothing links to.
    orphans = [p.url for p in pages if p.in_sitemap and not crawler.referrers.get(p.url) and p.url != crawler.seed]
    if orphans:
        add("orphan_pages", "warning",
            f"{len(orphans)} sitemap page(s) have no internal links pointing at them.",
            f"Link to them from relevant pages. Examples: {', '.join(orphans[:5])}")

    if crawler.skipped_by_robots:
        add("blocked_by_robots", "info",
            f"{len(crawler.skipped_by_robots)} discovered URL(s) are disallowed by robots.txt.",
            f"Confirm this is intentional. Examples: {', '.join(crawler.skipped_by_robots[:5])}")

    if crawler.not_crawled:
        add("crawl_limit", "info",
            f"{len(crawler.not_crawled)} additional URL(s) were discovered but not crawled (--max reached).",
            "Re-run with a higher --max for full coverage.")

    return issues


def truncate(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: limit - 1] + "…"


# ── Scoring ──────────────────────────────────────────────────────────────────


def build_scores(crawler: Crawler, site_level: list[Issue]) -> dict[str, dict[str, Any]]:
    """0–100 per dimension, computed only from what was actually measured."""
    pages = [p for p in crawler.pages.values() if p.status == 200]
    total = len(pages)
    if not total:
        return {}

    def pct(predicate) -> float:
        return 100.0 * sum(1 for p in pages if predicate(p)) / total

    def avg(getter) -> float:
        return sum(getter(p) for p in pages) / total

    # Technical: same deduction model as scoring.ts, averaged across pages.
    technical_scores = []
    for page in crawler.pages.values():
        deduction = sum(SEVERITY_WEIGHT[i.severity] for i in page.issues)
        technical_scores.append(clamp(100 - deduction))
    technical = sum(technical_scores) / len(technical_scores)

    indexable = pct(lambda p: p.indexable)
    canonical_ok = pct(lambda p: bool(p.canonical))
    https_ok = pct(lambda p: p.https and not p.mixed_content)
    indexability = clamp(indexable * 0.5 + https_ok * 0.3 + canonical_ok * 0.2)

    titles_ok = pct(lambda p: p.title and TITLE_MIN <= len(p.title) <= TITLE_MAX)
    descs_ok = pct(lambda p: p.meta_description and META_DESC_MIN <= len(p.meta_description) <= META_DESC_MAX)
    dup_penalty = 12 * sum(1 for i in site_level if i.code.startswith("duplicate_"))
    metadata = clamp(titles_ok * 0.55 + descs_ok * 0.45 - dup_penalty)

    depth_ok = pct(lambda p: p.word_count >= THIN_CONTENT_WORDS)
    rich = pct(lambda p: p.word_count >= AI_DEPTH_WORDS)
    content = clamp(depth_ok * 0.7 + rich * 0.3)

    structure = clamp(pct(lambda p: len(p.h1) == 1) * 0.6 + pct(lambda p: p.h2_count >= 2) * 0.25
                      + pct(lambda p: not p.heading_skips) * 0.15)

    has_schema = pct(lambda p: bool(p.schema_types))
    valid_schema = pct(lambda p: bool(p.schema_types) and not p.schema_errors)
    schema = clamp(has_schema * 0.6 + valid_schema * 0.4)

    media = clamp(100.0 if not any(p.images for p in pages)
                  else 100.0 * sum(p.images_with_alt for p in pages) / max(1, sum(p.images for p in pages)))

    internal_ok = pct(lambda p: p.internal_links > 0)
    broken = sum(1 for i in site_level if i.code == "broken_internal_link")
    links = clamp(internal_ok - broken * 10)

    # Mirrors scoreAiReadiness() in scoring.ts, averaged over crawled pages.
    def ai_page_score(p: Page) -> float:
        score = 0
        if p.has_faq:
            score += 20
        if p.schema_types:
            score += 20
        if p.author:
            score += 15
        if p.published_date or p.modified_date:
            score += 10
        if p.question_headings:
            score += 10
        if p.external_links:
            score += 10
        if p.has_toc:
            score += 5
        if p.word_count >= AI_DEPTH_WORDS:
            score += 10
        return score

    ai_readiness = clamp(avg(ai_page_score))

    dimensions = {
        "indexability": ("Indexability", indexability, 20,
                         f"{indexable:.0f}% of crawled pages are indexable; {https_ok:.0f}% are clean HTTPS."),
        "metadata": ("Titles & Descriptions", metadata, 15,
                     f"{titles_ok:.0f}% of titles and {descs_ok:.0f}% of descriptions are in the ideal length range."),
        "content": ("Content Depth", content, 15,
                    f"{depth_ok:.0f}% of pages clear {THIN_CONTENT_WORDS} words; median page has "
                    f"{median([p.word_count for p in pages]):.0f}."),
        "structure": ("Heading Structure", structure, 10,
                      f"{pct(lambda p: len(p.h1) == 1):.0f}% of pages have exactly one H1."),
        "schema": ("Structured Data", schema, 10,
                   f"{has_schema:.0f}% of pages carry schema; {valid_schema:.0f}% validate cleanly."),
        "ai_readiness": ("AI Search Readiness", ai_readiness, 15,
                         "Scores FAQ content, schema, author attribution, dates, question headings and citations."),
        "media": ("Image Accessibility", media, 5,
                  f"{sum(p.images_with_alt for p in pages)} of {sum(p.images for p in pages)} images have alt text."),
        "links": ("Internal Linking", links, 10,
                  f"{internal_ok:.0f}% of pages link onward; {broken} broken internal target(s)."),
    }

    scores = {
        key: {"label": label, "score": round(value), "weight": weight, "explanation": explanation}
        for key, (label, value, weight, explanation) in dimensions.items()
    }
    total_weight = sum(d["weight"] for d in scores.values())
    overall = round(sum(d["score"] * d["weight"] for d in scores.values()) / total_weight)
    scores["overall"] = {
        "label": "Overall On-Page Health",
        "score": overall,
        "weight": total_weight,
        "explanation": overall_explanation(overall)
        + " Crawl-based only — no SERP, backlink or Lighthouse data is included, so this is not a"
        " competitiveness score.",
    }
    scores["technical"] = {
        "label": "Technical (issue-weighted)",
        "score": round(technical),
        "weight": 0,
        "explanation": "Average per-page score after deducting 25/8/3 per critical/warning/info issue.",
    }
    return scores


def overall_explanation(score: int) -> str:
    if score >= 80:
        return "On-page fundamentals are in good shape."
    if score >= 60:
        return "Solid foundation with clear, fixable gaps."
    if score >= 40:
        return "Significant on-page gaps are holding the site back."
    return "On-page fundamentals need substantial work."


def clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def median(values: list[int]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    mid = len(ordered) // 2
    return float(ordered[mid]) if len(ordered) % 2 else (ordered[mid - 1] + ordered[mid]) / 2


# ── Reporting ────────────────────────────────────────────────────────────────

BAR_WIDTH = 24


def render_report(crawler: Crawler, scores: dict[str, Any], site_level: list[Issue], elapsed: float) -> str:
    pages = list(crawler.pages.values())
    ok = [p for p in pages if p.status == 200]
    all_issues = [i for p in pages for i in p.issues] + site_level
    counts = Counter(i.severity for i in all_issues)

    out: list[str] = []
    out.append("")
    out.append("═" * 78)
    out.append(f" SEO / AI-VISIBILITY AUDIT — {crawler.origin}")
    out.append("═" * 78)
    out.append("")
    out.append(f"  Pages crawled      {len(pages)}"
               + (f" (of {len(crawler.seen) + len(crawler.not_crawled)} discovered)" if crawler.not_crawled else ""))
    out.append(f"  Crawled OK (200)   {len(ok)}")
    out.append(f"  Non-200            {len(pages) - len(ok)}")
    out.append(f"  Elapsed            {elapsed:.1f}s")
    out.append(f"  Issues             {counts['critical']} critical · {counts['warning']} warning · {counts['info']} info")
    out.append("")

    if scores:
        out.append("─" * 78)
        out.append(" SCORES")
        out.append("─" * 78)
        overall = scores["overall"]
        out.append(f"  {'OVERALL':<26} {bar(overall['score'])} {overall['score']:>3}/100")
        out.append(f"  {'':<26} {overall['explanation']}")
        out.append("")
        for key, entry in scores.items():
            if key in ("overall", "technical"):
                continue
            out.append(f"  {entry['label']:<26} {bar(entry['score'])} {entry['score']:>3}/100  (weight {entry['weight']}%)")
            out.append(f"  {'':<26} {entry['explanation']}")
        technical = scores["technical"]
        out.append("")
        out.append(f"  {technical['label']:<26} {bar(technical['score'])} {technical['score']:>3}/100")
        out.append("")

    grouped: dict[str, list[Issue]] = defaultdict(list)
    for issue in all_issues:
        grouped[issue.code].append(issue)
    ranked = sorted(
        grouped.values(),
        key=lambda group: (SEVERITY_ORDER[group[0].severity], -len(group)),
    )

    out.append("─" * 78)
    out.append(" ISSUES BY TYPE")
    out.append("─" * 78)
    if not ranked:
        out.append("  No issues detected.")
    for group in ranked:
        first = group[0]
        marker = {"critical": "✗", "warning": "!", "info": "·"}[first.severity]
        out.append("")
        out.append(f"  {marker} [{first.severity.upper()}] {first.code} — {len(group)} occurrence(s)")
        # Messages carry per-page detail (lengths, counts), so only collapse them
        # into a single line when every occurrence really does say the same thing.
        varies = len({i.message for i in group}) > 1
        if not varies:
            out.append(f"      {first.message}")
        out.append(f"      Fix: {first.fix}")
        samples = [i for i in group if i.url][:5]
        for issue in samples:
            out.append(f"      • {issue.url}" + (f" — {issue.message}" if varies else ""))
        if len(group) > len(samples) and samples:
            out.append(f"      … and {len(group) - len(samples)} more")

    out.append("")
    out.append("─" * 78)
    out.append(" WORST PAGES (by weighted issue load)")
    out.append("─" * 78)
    ranked_pages = sorted(
        pages,
        key=lambda p: -sum(SEVERITY_WEIGHT[i.severity] for i in p.issues),
    )[:10]
    for page in ranked_pages:
        weight = sum(SEVERITY_WEIGHT[i.severity] for i in page.issues)
        if not weight:
            break
        critical = sum(1 for i in page.issues if i.severity == "critical")
        warning = sum(1 for i in page.issues if i.severity == "warning")
        out.append(f"  {weight:>4}  {truncate(page.url, 62):<62} {critical}C/{warning}W")
    out.append("")
    return "\n".join(out)


def bar(score: float) -> str:
    filled = int(round(BAR_WIDTH * score / 100))
    return "█" * filled + "░" * (BAR_WIDTH - filled)


def write_json(path: str, crawler: Crawler, scores: dict[str, Any], site_level: list[Issue], elapsed: float) -> None:
    payload = {
        "site": crawler.origin,
        "seed": crawler.seed,
        "crawled_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "elapsed_seconds": round(elapsed, 2),
        "pages_crawled": len(crawler.pages),
        "urls_discovered": len(crawler.seen) + len(crawler.not_crawled),
        "robots_txt_found": crawler.robots_available,
        "sitemap_urls": len(crawler.sitemap_urls),
        "scores": scores,
        "site_issues": [asdict(i) for i in site_level],
        "pages": [asdict(p) for p in crawler.pages.values()],
    }
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)


def write_csv(path: str, crawler: Crawler) -> None:
    columns = [
        "url", "status", "fetch_ms", "bytes", "title", "title_length", "meta_description",
        "meta_description_length", "canonical", "indexable", "h1_count", "h1", "h2_count",
        "word_count", "images", "images_missing_alt", "internal_links", "external_links",
        "schema_types", "schema_errors", "has_faq", "author", "published_date",
        "critical_issues", "warning_issues", "info_issues", "issue_codes",
    ]
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(columns)
        for page in crawler.pages.values():
            severities = Counter(i.severity for i in page.issues)
            writer.writerow([
                page.url, page.status, page.fetch_ms, page.bytes, page.title or "",
                len(page.title or ""), page.meta_description or "", len(page.meta_description or ""),
                page.canonical or "", page.indexable, len(page.h1), page.h1[0] if page.h1 else "",
                page.h2_count, page.word_count, page.images, page.images_missing_alt,
                page.internal_links, page.external_links, "|".join(page.schema_types),
                "|".join(page.schema_errors), page.has_faq, page.author or "",
                page.published_date or "", severities["critical"], severities["warning"],
                severities["info"], "|".join(sorted({i.code for i in page.issues})),
            ])


def log(message: str, args: argparse.Namespace) -> None:
    if not args.quiet:
        print(message, file=sys.stderr, flush=True)


# ── Entry point ──────────────────────────────────────────────────────────────


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="centris_audit.py",
        description="Crawl a site and audit on-page SEO and AI-search readiness.",
    )
    parser.add_argument("url", help="Seed URL, e.g. https://example.com")
    parser.add_argument("--max", type=int, default=100, metavar="N", help="Maximum pages to crawl (default 100)")
    parser.add_argument("--concurrency", type=int, default=DEFAULT_CONCURRENCY, metavar="N",
                        help=f"Parallel requests (default {DEFAULT_CONCURRENCY})")
    parser.add_argument("--delay", type=float, default=0.0, metavar="S",
                        help="Minimum seconds between requests; robots.txt crawl-delay overrides upward")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, metavar="S", help="Per-request timeout")
    parser.add_argument("--include-subdomains", action="store_true", help="Also crawl subdomains of the seed host")
    parser.add_argument("--ignore-robots", action="store_true",
                        help="Crawl URLs robots.txt disallows (only for sites you control)")
    parser.add_argument("--no-sitemap", action="store_true", help="Do not seed the crawl from sitemap.xml")
    parser.add_argument("--user-agent", default=DEFAULT_UA)
    parser.add_argument("--json", metavar="PATH", help="Write the full result as JSON")
    parser.add_argument("--csv", metavar="PATH", help="Write one row per page as CSV")
    parser.add_argument("--strict", action="store_true", help="Exit 2 if any critical issue is found")
    parser.add_argument("--quiet", action="store_true", help="Suppress crawl progress on stderr")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    if not urlparse(args.url).scheme:
        args.url = "https://" + args.url
    if args.max < 1:
        print("--max must be at least 1", file=sys.stderr)
        return 1

    started = time.monotonic()
    crawler = Crawler(args.url, args)
    log(f"Crawling {crawler.seed} (max {args.max} pages, {args.concurrency} workers)", args)
    crawler.run()

    if not crawler.pages:
        print(f"Nothing crawled — {args.url} could not be reached or is disallowed by robots.txt.", file=sys.stderr)
        return 1

    for page in crawler.pages.values():
        page.issues = page_issues(page)
    site_level = site_issues(crawler)
    scores = build_scores(crawler, site_level)
    elapsed = time.monotonic() - started

    print(render_report(crawler, scores, site_level, elapsed))

    if args.json:
        write_json(args.json, crawler, scores, site_level, elapsed)
        log(f"Wrote {args.json}", args)
    if args.csv:
        write_csv(args.csv, crawler)
        log(f"Wrote {args.csv}", args)

    if not any(p.status == 200 for p in crawler.pages.values()):
        print("No page returned HTTP 200 — the crawl reached nothing usable.", file=sys.stderr)
        return 1

    criticals = sum(1 for p in crawler.pages.values() for i in p.issues if i.severity == "critical")
    criticals += sum(1 for i in site_level if i.severity == "critical")
    return 2 if (args.strict and criticals) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
