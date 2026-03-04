"""
scraper_tool.py — Firecrawl scraper with Playwright fallback.

Encapsulates all scraping logic so agents stay tool-agnostic.
Only this module imports Firecrawl / Playwright.
"""
import re
from typing import Optional

from blog_pipeline.config import FIRECRAWL_API_KEY, SCRAPER_MIN_WORD_COUNT


def _clean_markdown(raw: str) -> str:
    """Strip nav/ads/boilerplate noise from Firecrawl markdown output."""
    # Remove excessive blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", raw)
    # Remove markdown image tags (often ads)
    cleaned = re.sub(r"!\[.*?\]\(.*?\)", "", cleaned)
    # Remove likely nav/footer patterns
    cleaned = re.sub(
        r"(Home|About|Contact|Privacy Policy|Terms of Service|Cookie Policy)(\s*\|?\s*)+",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    return cleaned.strip()


def scrape_url(url: str) -> dict:
    """
    Scrape a URL and return cleaned markdown content.

    Returns:
        {
          "url":        str,
          "content":    str,   # cleaned Markdown
          "word_count": int,
          "error":      str | None
        }

    Strategy:
      1. Try Firecrawl (managed, JS-rendered, clean markdown).
      2. On failure, fall back to Playwright (raw HTML → text extraction).
      3. Enforce minimum word count; mark short pages as errors.
    """
    # ── Primary: Firecrawl ──────────────────────────────────────────────────
    try:
        from firecrawl import FirecrawlApp
        app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
        # Firecrawl SDK v4+ uses scrape() instead of scrape_url()
        result = app.scrape(url, formats=["markdown"])
        # v4 returns a ScrapeResponse object; use attribute or dict access
        if hasattr(result, "markdown"):
            raw_md = result.markdown or ""
        else:
            raw_md = result.get("markdown") or result.get("content") or ""
        if raw_md.strip():
            content = _clean_markdown(raw_md)
            word_count = len(content.split())
            if word_count < SCRAPER_MIN_WORD_COUNT:
                return {
                    "url": url,
                    "content": "",
                    "word_count": word_count,
                    "error": f"Too short ({word_count} words < {SCRAPER_MIN_WORD_COUNT} minimum)",
                }
            return {"url": url, "content": content, "word_count": word_count, "error": None}
    except Exception as fc_exc:
        fc_error = str(fc_exc)
    else:
        fc_error = "Firecrawl returned empty content"

    # ── Fallback: Playwright ────────────────────────────────────────────────
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=15_000, wait_until="domcontentloaded")
            # Extract body text, strip script/style
            content = page.evaluate("""() => {
                document.querySelectorAll('script,style,nav,footer,aside,header').forEach(el => el.remove());
                return document.body ? document.body.innerText : '';
            }""")
            browser.close()
        content = _clean_markdown(content)
        word_count = len(content.split())
        if word_count < SCRAPER_MIN_WORD_COUNT:
            return {
                "url": url,
                "content": "",
                "word_count": word_count,
                "error": f"Playwright fallback: too short ({word_count} words)",
            }
        return {"url": url, "content": content, "word_count": word_count, "error": None}
    except Exception as pw_exc:
        return {
            "url": url,
            "content": "",
            "word_count": 0,
            "error": f"Firecrawl: {fc_error} | Playwright: {pw_exc}",
        }
